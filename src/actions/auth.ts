"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClientInvitation } from "@/types/database";
import { notifyClientInvitation } from "./notifications";

function sanitizeRedirect(url: string | null): string | null {
  if (!url) return null;
  // Only allow relative paths, prevent open redirect via protocol-relative URLs
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  return url;
}

function loginErrorUrl(error: string, redirectTo: string | null): string {
  const params = new URLSearchParams({ error });
  if (redirectTo) {
    params.set("redirect", redirectTo);
  }
  return `/login?${params.toString()}`;
}

function signupErrorUrl(error: string): string {
  const params = new URLSearchParams({ error });
  return `/signup?${params.toString()}`;
}

function inferSafeRoleFromMetadata(meta: unknown): "client" | "recruiter" {
  if (!meta || typeof meta !== "object") return "recruiter";
  const maybeRole = (meta as { role?: unknown }).role;
  return maybeRole === "client" ? "client" : "recruiter";
}

export async function signIn(formData: FormData) {
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const rawRedirect = (formData.get("redirect") as string) || null;
  const redirectTo = sanitizeRedirect(rawRedirect);

  if (!email || !password) {
    redirect(loginErrorUrl("invalid_credentials", redirectTo));
  }

  // Create Supabase client — redirect() must stay OUTSIDE try/catch
  // because Next.js redirect() throws a special error that try/catch would swallow.
  let supabase;
  let clientCreateFailed = false;
  try {
    supabase = await createClient();
  } catch (error) {
    console.error("[signIn] Failed to create Supabase client", error);
    clientCreateFailed = true;
  }
  if (clientCreateFailed || !supabase) {
    redirect(loginErrorUrl("auth_unavailable", redirectTo));
  }

  // Authenticate
  let signInFailed = false;
  let signInErrorMsg: string | null = null;
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      signInFailed = true;
      signInErrorMsg = error.message;
    }
  } catch (error) {
    console.error("[signIn] signInWithPassword threw", error);
    signInFailed = true;
  }
  if (signInFailed) {
    // Distinguish between bad credentials and service errors
    const isCredentialError = signInErrorMsg?.toLowerCase().includes("invalid") ||
      signInErrorMsg?.toLowerCase().includes("credentials") ||
      signInErrorMsg?.toLowerCase().includes("password");
    redirect(loginErrorUrl(isCredentialError || !signInErrorMsg ? "invalid_credentials" : "auth_unavailable", redirectTo));
  }

  // Fetch authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("[signIn] Failed to fetch current user after login", userError?.message);
    redirect(loginErrorUrl("auth_unavailable", redirectTo));
  }

  // Fetch profile — errors tracked via variables, redirect() stays outside try/catch
  let profile: { role?: string } | null = null;
  let profileError = false;
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      console.error("[signIn] Profile query error", error.message);
      profileError = true;
    } else {
      profile = data as { role?: string } | null;
    }
  } catch (error) {
    console.error("[signIn] Profile lookup threw", error);
    profileError = true;
  }

  // Self-heal missing profile
  if (!profile && !profileError) {
    const inferredRole = inferSafeRoleFromMetadata(user.user_metadata);
    try {
      const { data: inserted, error: insertError } = await supabase
        .from("user_profiles")
        .upsert(
          {
            id: user.id,
            email: user.email ?? "",
            full_name: (user.user_metadata as { full_name?: string } | null)?.full_name ?? "",
            role: inferredRole,
            is_active: true,
          },
          { onConflict: "id" }
        )
        .select("role")
        .maybeSingle();

      if (insertError) {
        console.error("[signIn] Failed to self-heal missing profile", insertError.message);
        profileError = true;
      } else {
        profile = inserted as { role?: string } | null;
      }
    } catch (error) {
      console.error("[signIn] Profile self-heal threw", error);
      profileError = true;
    }
  }

  // If we still have no profile after self-heal, redirect with clear error
  if (!profile) {
    return redirect(loginErrorUrl("profile_missing", redirectTo));
  }

  // Role-based redirect
  if (profile.role === "client") {
    return redirect(redirectTo || "/client");
  }
  redirect(redirectTo || "/dashboard");
}

export async function signUp(formData: FormData) {
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const fullName = (formData.get("full_name") as string) ?? "";

  if (!email || !password || !fullName) {
    redirect(signupErrorUrl("missing_fields"));
  }

  let supabase;
  let clientCreateFailed = false;
  try {
    supabase = await createClient();
  } catch (error) {
    console.error("[signUp] Failed to create Supabase client", error);
    clientCreateFailed = true;
  }
  if (clientCreateFailed || !supabase) {
    redirect(signupErrorUrl("auth_unavailable"));
  }

  let signUpFailed = false;
  let signUpErrorMsg = "";
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "recruiter", // Default for self-signup
        },
      },
    });

    if (error) {
      console.error("[signUp] signUp failed", error.message);
      signUpFailed = true;
      signUpErrorMsg = error.message;
    }
  } catch (error) {
    console.error("[signUp] signUp threw", error);
    signUpFailed = true;
  }

  if (signUpFailed) {
    // If error mentions "already registered", give a clearer message
    const errorCode = signUpErrorMsg.toLowerCase().includes("already")
      ? "already_registered"
      : "signup_failed";
    redirect(signupErrorUrl(errorCode));
  }

  redirect("/login?message=Check your email to confirm your account");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function acceptClientInvitation(token: string, formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  // Look up invitation
  const { data: invData, error: invError } = await supabase
    .from("client_invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  const invitation = invData as ClientInvitation | null;

  if (invError || !invitation) {
    return { error: "Invalid or expired invitation." };
  }

  // Create user account with client role
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: invitation.email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "client",
      },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (authData.user) {
    // Use SECURITY DEFINER function to atomically link client to company
    // and mark invitation accepted. This bypasses RLS safely since the
    // newly created client user doesn't have INSERT access to client_users.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: acceptError } = await (supabase.rpc as any)("accept_invitation", {
      p_user_id: authData.user.id,
      p_invitation_id: invitation.id,
      p_company_id: invitation.company_id,
      p_invited_by: invitation.invited_by,
    });
    if (acceptError) {
      console.error("[acceptClientInvitation] Failed to link client to company:", acceptError.message);
      return { error: "Account created but failed to link to company. Contact support." };
    }
  }

  redirect("/login?message=Account created. Please check your email to confirm, then sign in.");
}

export async function inviteClient(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify the user has an internal role (admin or recruiter)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "recruiter")) {
    throw new Error("Only internal users can invite clients.");
  }

  const email = formData.get("email") as string;
  const companyId = formData.get("company_id") as string;

  // Check for existing invitation
  const { data: existing } = await supabase
    .from("client_invitations")
    .select("id")
    .eq("email", email)
    .eq("company_id", companyId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existing) {
    throw new Error("An active invitation already exists for this email.");
  }

  const { data, error } = await supabase
    .from("client_invitations")
    .insert({
      company_id: companyId,
      email,
      invited_by: user.id,
    })
    .select("token")
    .single();

  if (error) {
    console.error("[inviteClient] Supabase error:", error.message);
    throw new Error("Failed to create invitation.");
  }

  // Get company name and inviter name for the notification email
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .maybeSingle();
  const { data: inviter } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Fire-and-forget email notification
  notifyClientInvitation(
    email,
    (company as { name?: string } | null)?.name ?? "Your Company",
    (inviter as { full_name?: string } | null)?.full_name ?? "A team member",
    data.token as string
  );

  revalidatePath(`/companies/${companyId}`);
  return { token: data.token };
}

export async function getInvitationsForCompany(companyId: string): Promise<ClientInvitation[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("client_invitations")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return [];
    return (data ?? []) as ClientInvitation[];
  } catch {
    return [];
  }
}
