"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Run all automation rules - called from dashboard or on-demand
export async function runAutomations(): Promise<{
  followUpTasks: number;
  staleSubmissionReminders: number;
  staleJobFlags: number;
  staleCandidateFlags: number;
}> {
  const results = await Promise.all([
    createFollowUpTasks(),
    createStaleSubmissionReminders(),
    flagStaleJobs(),
    flagStaleCandidates(),
  ]);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/jobs");
  revalidatePath("/candidates");

  return {
    followUpTasks: results[0],
    staleSubmissionReminders: results[1],
    staleJobFlags: results[2],
    staleCandidateFlags: results[3],
  };
}

// Rule 1: Create follow-up tasks for companies/candidates with outreach_status = 'follow_up'
async function createFollowUpTasks(): Promise<number> {
  const supabase = await createClient();
  let created = 0;

  // Get companies needing follow-up
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, follow_up_date, owner_id")
    .eq("outreach_status", "follow_up")
    .not("follow_up_date", "is", null);

  for (const company of companies ?? []) {
    // Check if an open task already exists for this entity
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("entity_type", "company")
      .eq("entity_id", company.id)
      .is("completed_at", null)
      .limit(1);

    if (!existingTasks || existingTasks.length === 0) {
      const { error } = await supabase.from("tasks").insert({
        title: `Follow up: ${company.name}`,
        priority: "medium",
        due_date: company.follow_up_date,
        entity_type: "company",
        entity_id: company.id,
        owner_id: company.owner_id,
      });
      if (!error) created++;
    }
  }

  // Get candidates needing follow-up
  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, full_name, follow_up_date, owner_id")
    .eq("outreach_status", "follow_up")
    .not("follow_up_date", "is", null);

  for (const candidate of candidates ?? []) {
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("entity_type", "candidate")
      .eq("entity_id", candidate.id)
      .is("completed_at", null)
      .limit(1);

    if (!existingTasks || existingTasks.length === 0) {
      const { error } = await supabase.from("tasks").insert({
        title: `Follow up: ${candidate.full_name}`,
        priority: "medium",
        due_date: candidate.follow_up_date,
        entity_type: "candidate",
        entity_id: candidate.id,
        owner_id: candidate.owner_id,
      });
      if (!error) created++;
    }
  }

  return created;
}

// Rule 2: Create reminders for submissions in client_review for > 5 days
async function createStaleSubmissionReminders(): Promise<number> {
  const supabase = await createClient();
  let created = 0;

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const cutoff = fiveDaysAgo.toISOString();
  const today = new Date().toISOString().split("T")[0];

  // Get submissions in client_review status
  const { data: submissions } = await supabase
    .from("candidate_submissions")
    .select("id, job_id, client_reviewed_at, created_at")
    .eq("status", "client_review");

  for (const sub of submissions ?? []) {
    // Use client_reviewed_at if set, otherwise created_at
    const referenceDate = sub.client_reviewed_at ?? sub.created_at;
    if (referenceDate > cutoff) continue; // Not stale yet

    // Check for existing open task with similar title for this job
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("entity_type", "job")
      .eq("entity_id", sub.job_id)
      .is("completed_at", null)
      .ilike("title", "%submission awaiting client review%")
      .limit(1);

    if (!existingTasks || existingTasks.length === 0) {
      const { error } = await supabase.from("tasks").insert({
        title: "Follow up on submission awaiting client review",
        priority: "high",
        due_date: today,
        entity_type: "job",
        entity_id: sub.job_id,
      });
      if (!error) created++;
    }
  }

  return created;
}

// Rule 3: Flag open jobs with no submissions after 30 days
async function flagStaleJobs(): Promise<number> {
  const supabase = await createClient();
  let created = 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  // Get open jobs older than 30 days
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, owner_id, created_at")
    .eq("status", "open")
    .lt("created_at", cutoff);

  for (const job of jobs ?? []) {
    // Check if job has any submissions
    const { data: submissions } = await supabase
      .from("candidate_submissions")
      .select("id")
      .eq("job_id", job.id)
      .limit(1);

    if (submissions && submissions.length > 0) continue; // Has submissions

    // Check for existing duplicate task
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("entity_type", "job")
      .eq("entity_id", job.id)
      .is("completed_at", null)
      .ilike("title", "%stale job%")
      .limit(1);

    if (!existingTasks || existingTasks.length === 0) {
      const { error } = await supabase.from("tasks").insert({
        title: `Stale job: ${job.title} - no submissions after 30 days`,
        priority: "medium",
        entity_type: "job",
        entity_id: job.id,
        owner_id: job.owner_id,
      });
      if (!error) created++;
    }
  }

  return created;
}

// Rule 4: Flag candidates with no recent contact
async function flagStaleCandidates(): Promise<number> {
  const supabase = await createClient();
  let created = 0;

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const cutoff = fourteenDaysAgo.toISOString();

  // Get candidates with status "new" or "contacted" where last_contacted_at is null or old
  const { data: candidatesNullContact } = await supabase
    .from("candidates")
    .select("id, full_name, owner_id")
    .in("status", ["new", "contacted"])
    .is("last_contacted_at", null);

  const { data: candidatesOldContact } = await supabase
    .from("candidates")
    .select("id, full_name, owner_id")
    .in("status", ["new", "contacted"])
    .lt("last_contacted_at", cutoff);

  const allCandidates = [
    ...(candidatesNullContact ?? []),
    ...(candidatesOldContact ?? []),
  ];

  for (const candidate of allCandidates) {
    // Check for existing duplicate task
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("entity_type", "candidate")
      .eq("entity_id", candidate.id)
      .is("completed_at", null)
      .ilike("title", "%stale candidate%")
      .limit(1);

    if (!existingTasks || existingTasks.length === 0) {
      const { error } = await supabase.from("tasks").insert({
        title: `Stale candidate: ${candidate.full_name} - no recent contact`,
        priority: "low",
        entity_type: "candidate",
        entity_id: candidate.id,
        owner_id: candidate.owner_id,
      });
      if (!error) created++;
    }
  }

  return created;
}
