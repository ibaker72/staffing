"use server";

import { createClient } from "@/lib/supabase/server";
import type { ClientPortalToken, SubmissionStatus } from "@/types/database";

export async function generatePortalToken(companyId: string): Promise<string> {
  const supabase = await createClient();

  // Deactivate existing tokens for this company
  await supabase
    .from("client_portal_tokens")
    .update({ is_active: false })
    .eq("company_id", companyId);

  const { data, error } = await supabase
    .from("client_portal_tokens")
    .insert({ company_id: companyId })
    .select("token")
    .single();

  if (error) {
    console.error("[generatePortalToken] Supabase error:", error.message);
    throw new Error("Failed to generate portal token.");
  }

  return data.token;
}

export async function getActiveToken(companyId: string): Promise<ClientPortalToken | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("client_portal_tokens")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data as ClientPortalToken | null;
  } catch {
    return null;
  }
}

export async function validatePortalToken(token: string): Promise<{ companyId: string; companyName: string } | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("client_portal_tokens")
      .select("company_id, company:companies(name)")
      .eq("token", token)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;

    const companyName = (data.company as { name?: string } | null)?.name ?? "Unknown";
    return { companyId: data.company_id, companyName };
  } catch {
    return null;
  }
}

export async function getPortalJobs(companyId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, location, status, employment_type, created_at")
      .eq("company_id", companyId)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getPortalSubmissions(companyId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("candidate_submissions")
      .select("id, status, client_feedback, created_at, candidate:candidates(full_name, location), job:jobs!inner(id, title, company_id)")
      .eq("job.company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getPortalSubmissions] Supabase error:", error.message);
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

export async function updatePortalSubmissionFeedback(
  submissionId: string,
  companyId: string,
  status: SubmissionStatus,
  feedback: string | null
) {
  const supabase = await createClient();

  // Verify this submission belongs to the company
  const { data: sub } = await supabase
    .from("candidate_submissions")
    .select("id, job:jobs!inner(company_id)")
    .eq("id", submissionId)
    .maybeSingle();

  const jobCompanyId = (sub?.job as { company_id?: string } | null)?.company_id;
  if (!sub || jobCompanyId !== companyId) {
    throw new Error("Submission not found or access denied.");
  }

  const updateData: Record<string, unknown> = { client_feedback: feedback };
  // Clients can only move to client_review or interview statuses
  if (status === "client_review" || status === "interview" || status === "rejected") {
    updateData.status = status;
    if (status === "client_review") updateData.client_reviewed_at = new Date().toISOString();
    if (status === "interview") updateData.interview_at = new Date().toISOString();
    if (status === "rejected") updateData.decided_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("candidate_submissions")
    .update(updateData)
    .eq("id", submissionId);

  if (error) {
    console.error("[updatePortalSubmissionFeedback] Supabase error:", error.message);
    throw new Error("Failed to update feedback.");
  }
}
