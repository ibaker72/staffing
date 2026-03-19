"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { writeAuditLog, writeAuditLogBatch } from "./audit";
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
  const { data: before } = await supabase.from("companies").select("id, status").in("id", ids);
  const { error } = await supabase
    .from("companies")
    .update({ status })
    .in("id", ids);
  if (error) throw new Error("Failed to update company statuses.");

  await writeAuditLogBatch(
    (before ?? []).map((c) => ({
      entity_type: "company",
      entity_id: c.id,
      action: "bulk_status_change",
      previous_value: { status: c.status },
      new_value: { status },
      metadata: { bulk_count: ids.length },
    }))
  );

  revalidatePath("/companies");
  revalidatePath("/dashboard");
}

export async function bulkUpdateCompanyOutreach(
  ids: string[],
  outreachStatus: OutreachStatus
) {
  const supabase = await createClient();
  const { data: before } = await supabase.from("companies").select("id, outreach_status").in("id", ids);
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

  await writeAuditLogBatch(
    (before ?? []).map((c) => ({
      entity_type: "company",
      entity_id: c.id,
      action: "bulk_outreach_change",
      previous_value: { outreach_status: c.outreach_status },
      new_value: { outreach_status: outreachStatus },
      metadata: { bulk_count: ids.length },
    }))
  );

  revalidatePath("/companies");
  revalidatePath("/dashboard");
}

export async function bulkDeleteCompanies(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().in("id", ids);
  if (error) throw new Error("Failed to delete companies.");

  await writeAuditLog({
    entity_type: "company",
    action: "bulk_delete",
    metadata: { ids, count: ids.length },
  });

  revalidatePath("/companies");
  revalidatePath("/dashboard");
}

// ── Candidates ─────────────────────────────────────────────

export async function bulkUpdateCandidateStatus(
  ids: string[],
  status: CandidateStatus
) {
  const supabase = await createClient();
  const { data: before } = await supabase.from("candidates").select("id, status").in("id", ids);
  const { error } = await supabase
    .from("candidates")
    .update({ status })
    .in("id", ids);
  if (error) throw new Error("Failed to update candidate statuses.");

  await writeAuditLogBatch(
    (before ?? []).map((c) => ({
      entity_type: "candidate",
      entity_id: c.id,
      action: "bulk_status_change",
      previous_value: { status: c.status },
      new_value: { status },
      metadata: { bulk_count: ids.length },
    }))
  );

  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}

export async function bulkUpdateCandidateOutreach(
  ids: string[],
  outreachStatus: OutreachStatus
) {
  const supabase = await createClient();
  const { data: before } = await supabase.from("candidates").select("id, outreach_status").in("id", ids);
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

  await writeAuditLogBatch(
    (before ?? []).map((c) => ({
      entity_type: "candidate",
      entity_id: c.id,
      action: "bulk_outreach_change",
      previous_value: { outreach_status: c.outreach_status },
      new_value: { outreach_status: outreachStatus },
      metadata: { bulk_count: ids.length },
    }))
  );

  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}

export async function bulkDeleteCandidates(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("candidates").delete().in("id", ids);
  if (error) throw new Error("Failed to delete candidates.");

  await writeAuditLog({
    entity_type: "candidate",
    action: "bulk_delete",
    metadata: { ids, count: ids.length },
  });

  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}

// ── Jobs ───────────────────────────────────────────────────

export async function bulkUpdateJobStatus(ids: string[], status: JobStatus) {
  const supabase = await createClient();
  const { data: before } = await supabase.from("jobs").select("id, status").in("id", ids);
  const { error } = await supabase
    .from("jobs")
    .update({ status })
    .in("id", ids);
  if (error) throw new Error("Failed to update job statuses.");

  await writeAuditLogBatch(
    (before ?? []).map((j) => ({
      entity_type: "job",
      entity_id: j.id,
      action: "bulk_status_change",
      previous_value: { status: j.status },
      new_value: { status },
      metadata: { bulk_count: ids.length },
    }))
  );

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function bulkDeleteJobs(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().in("id", ids);
  if (error) throw new Error("Failed to delete jobs.");

  await writeAuditLog({
    entity_type: "job",
    action: "bulk_delete",
    metadata: { ids, count: ids.length },
  });

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

  await writeAuditLogBatch(
    ids.map((id) => ({
      entity_type: "task",
      entity_id: id,
      action: "bulk_complete",
      new_value: { completed: true },
      metadata: { bulk_count: ids.length },
    }))
  );

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function bulkDeleteTasks(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().in("id", ids);
  if (error) throw new Error("Failed to delete tasks.");

  await writeAuditLog({
    entity_type: "task",
    action: "bulk_delete",
    metadata: { ids, count: ids.length },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
