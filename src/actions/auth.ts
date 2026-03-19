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

export async function signIn(formData: FormData) {
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const rawRedirect = (formData.get("redirect") as string) || null;
  const redirectTo = sanitizeRedirect(rawRedirect);

  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    console.error("[signIn] Failed to create Supabase client", error);
    redirect(loginErrorUrl("auth_unavailable", redirectTo));
  }

  if (!email || !password) {
    redirect(loginErrorUrl("invalid_credentials", redirectTo));
  }

  let signInError: string | null = null;
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    signInError = error?.message ?? null;
  } catch (error) {
    console.error("[signIn] signInWithPassword threw", error);
    redirect(loginErrorUrl("auth_unavailable", redirectTo));
  }

  if (signInError) {
    redirect(loginErrorUrl("invalid_credentials", redirectTo));
  }

  // Get role to determine redirect
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("[signIn] Failed to fetch current user", userError.message);
    redirect(loginErrorUrl("auth_unavailable", redirectTo));
  }

  if (user) {
    let profile: { role?: string } | null = null;
    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      profile = data as { role?: string } | null;
    } catch (error) {
      console.error("[signIn] Profile lookup failed", error);
      redirect(loginErrorUrl("profile_missing", redirectTo));
    }

    if (profile?.role === "client") {
      redirect(redirectTo || "/client");
    }
  }

  redirect(redirectTo || "/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

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
    return { error: error.message };
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
    // Link client to company
    const { error: linkError } = await supabase.from("client_users").insert({
      user_id: authData.user.id,
      company_id: invitation.company_id,
      invited_by: invitation.invited_by,
    });
    if (linkError) {
      console.error("[acceptClientInvitation] Failed to link client to company:", linkError.message);
      return { error: "Account created but failed to link to company. Contact support." };
    }

    // Mark invitation as accepted
    const { error: acceptError } = await supabase
      .from("client_invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);
    if (acceptError) {
      console.error("[acceptClientInvitation] Failed to mark invitation accepted:", acceptError.message);
      // Non-fatal — account and link were created successfully
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
