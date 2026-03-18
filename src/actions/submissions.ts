"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";
import type { CandidateSubmission, SubmissionStatus } from "@/types/database";
import { notifyCandidateSubmittedToClient } from "./notifications";

export type SubmissionWithCandidate = CandidateSubmission & {
  candidate: { id: string; full_name: string; email: string | null; location: string | null } | null;
};

export type SubmissionWithJob = CandidateSubmission & {
  job: { id: string; title: string; company: { id: string; name: string } | null } | null;
};

const statusTimestampMap: Partial<Record<SubmissionStatus, string>> = {
  submitted: "submitted_at",
  client_review: "client_reviewed_at",
  interview: "interview_at",
  offer: "offered_at",
  hired: "decided_at",
  rejected: "decided_at",
};

export async function getSubmissionsForJob(jobId: string): Promise<SubmissionWithCandidate[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("candidate_submissions")
      .select("*, candidate:candidates(id, full_name, email, location)")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getSubmissionsForJob] Supabase error:", error.message);
      return [];
    }
    return (data ?? []) as SubmissionWithCandidate[];
  } catch (e) {
    console.error("[getSubmissionsForJob] Unexpected error:", e);
    return [];
  }
}

export async function getSubmissionsForCandidate(candidateId: string): Promise<SubmissionWithJob[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("candidate_submissions")
      .select("*, job:jobs(id, title, company:companies(id, name))")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getSubmissionsForCandidate] Supabase error:", error.message);
      return [];
    }
    return (data ?? []) as SubmissionWithJob[];
  } catch (e) {
    console.error("[getSubmissionsForCandidate] Unexpected error:", e);
    return [];
  }
}

export async function createSubmission(formData: FormData) {
  const supabase = await createClient();
  const candidateId = formData.get("candidate_id") as string;
  const jobId = formData.get("job_id") as string;

  const { data, error } = await supabase
    .from("candidate_submissions")
    .insert({
      candidate_id: candidateId,
      job_id: jobId,
      internal_notes: (formData.get("internal_notes") as string) || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("This candidate has already been submitted for this job.");
    }
    console.error("[createSubmission] Supabase error:", error.message);
    throw new Error("Failed to create submission. Please try again.");
  }

  if (data?.id) {
    await logActivity("submission", data.id, "created", `Candidate shortlisted for job`, {
      candidate_id: candidateId,
      job_id: jobId,
    });

    // Get candidate name and job title for notification
    const { data: candidate } = await supabase
      .from("candidates")
      .select("full_name")
      .eq("id", candidateId)
      .maybeSingle();
    const { data: job } = await supabase
      .from("jobs")
      .select("title")
      .eq("id", jobId)
      .maybeSingle();

    // Fire-and-forget email to client
    notifyCandidateSubmittedToClient(
      jobId,
      (candidate as { full_name?: string } | null)?.full_name ?? "A candidate",
      (job as { title?: string } | null)?.title ?? "a position"
    );
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath("/dashboard");
}

export async function updateSubmissionStatus(id: string, status: SubmissionStatus) {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("candidate_submissions")
    .select("status, candidate:candidates(full_name), job:jobs(title)")
    .eq("id", id)
    .maybeSingle();

  const updateData: Record<string, unknown> = { status };
  const tsCol = statusTimestampMap[status];
  if (tsCol) {
    updateData[tsCol] = new Date().toISOString();
  }

  const { error } = await supabase
    .from("candidate_submissions")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("[updateSubmissionStatus] Supabase error:", error.message);
    throw new Error("Failed to update submission status. Please try again.");
  }

  const candidateName = (current?.candidate as { full_name?: string } | null)?.full_name ?? "Unknown";
  const jobTitle = (current?.job as { title?: string } | null)?.title ?? "Unknown";
  await logActivity("submission", id, "status_change",
    `Submission for ${candidateName} → "${jobTitle}" moved to ${status}`,
    { from: current?.status, to: status }
  );

  revalidatePath("/jobs");
  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}

export async function updateSubmissionNotes(id: string, internalNotes: string | null, clientFeedback: string | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("candidate_submissions")
    .update({
      internal_notes: internalNotes,
      client_feedback: clientFeedback,
    })
    .eq("id", id);

  if (error) {
    console.error("[updateSubmissionNotes] Supabase error:", error.message);
    throw new Error("Failed to update submission notes.");
  }
}

export async function getSubmissionStatusBreakdown(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("candidate_submissions").select("status");
    if (error) return {};
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}
