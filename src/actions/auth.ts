"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClientInvitation } from "@/types/database";
import { notifyClientInvitation } from "./notifications";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirect") as string) || null;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Get role to determine redirect
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

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
    await supabase.from("client_users").insert({
      user_id: authData.user.id,
      company_id: invitation.company_id,
      invited_by: invitation.invited_by,
    });

    // Mark invitation as accepted
    await supabase
      .from("client_invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);
  }

  redirect("/login?message=Account created. Please check your email to confirm, then sign in.");
}

export async function inviteClient(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

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
