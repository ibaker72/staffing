"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  CompanyStatus,
  CandidateStatus,
  JobStatus,
  OutreachStatus,
} from "@/types/database";

// ── Companies ──────────────────────────────────────────────

export async function bulkUpdateCompanyStatus(
  ids: string[],
  status: CompanyStatus
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ status })
    .in("id", ids);
  if (error) throw new Error("Failed to update company statuses.");
  revalidatePath("/companies");
  revalidatePath("/dashboard");
}

export async function bulkUpdateCompanyOutreach(
  ids: string[],
  outreachStatus: OutreachStatus
) {
  const supabase = await createClient();
  const updateData: Record<string, unknown> = {
    outreach_status: outreachStatus,
  };
  if (outreachStatus !== "none") {
    updateData.last_contacted_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from("companies")
    .update(updateData)
    .in("id", ids);
  if (error) throw new Error("Failed to update company outreach statuses.");
  revalidatePath("/companies");
  revalidatePath("/dashboard");
}

export async function bulkDeleteCompanies(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().in("id", ids);
  if (error) throw new Error("Failed to delete companies.");
  revalidatePath("/companies");
  revalidatePath("/dashboard");
}

// ── Candidates ─────────────────────────────────────────────

export async function bulkUpdateCandidateStatus(
  ids: string[],
  status: CandidateStatus
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("candidates")
    .update({ status })
    .in("id", ids);
  if (error) throw new Error("Failed to update candidate statuses.");
  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}

export async function bulkUpdateCandidateOutreach(
  ids: string[],
  outreachStatus: OutreachStatus
) {
  const supabase = await createClient();
  const updateData: Record<string, unknown> = {
    outreach_status: outreachStatus,
  };
  if (outreachStatus !== "none") {
    updateData.last_contacted_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from("candidates")
    .update(updateData)
    .in("id", ids);
  if (error) throw new Error("Failed to update candidate outreach statuses.");
  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}

export async function bulkDeleteCandidates(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("candidates").delete().in("id", ids);
  if (error) throw new Error("Failed to delete candidates.");
  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}

// ── Jobs ───────────────────────────────────────────────────

export async function bulkUpdateJobStatus(ids: string[], status: JobStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ status })
    .in("id", ids);
  if (error) throw new Error("Failed to update job statuses.");
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function bulkDeleteJobs(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().in("id", ids);
  if (error) throw new Error("Failed to delete jobs.");
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

// ── Tasks ──────────────────────────────────────────────────

export async function bulkCompleteTasks(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ completed_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw new Error("Failed to complete tasks.");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function bulkDeleteTasks(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().in("id", ids);
  if (error) throw new Error("Failed to delete tasks.");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
