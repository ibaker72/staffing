"use server";

import { createClient } from "@/lib/supabase/server";
import type { Task, Company, Candidate, Job } from "@/types/database";

export async function getOverdueTasksView(): Promise<Task[]> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .is("completed_at", null)
      .lt("due_date", today)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("[getOverdueTasksView]", error.message);
      return [];
    }
    return (data ?? []) as Task[];
  } catch {
    return [];
  }
}

export async function getCandidatesNeedingFollowUp(): Promise<Candidate[]> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("outreach_status", "follow_up")
      .lte("follow_up_date", today)
      .order("follow_up_date", { ascending: true });

    if (error) {
      console.error("[getCandidatesNeedingFollowUp]", error.message);
      return [];
    }
    return (data ?? []) as Candidate[];
  } catch {
    return [];
  }
}

export async function getOpenJobsNoSubmissions(): Promise<
  (Job & { company: { name: string } | null })[]
> {
  try {
    const supabase = await createClient();

    // Get all open jobs with company name
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*, company:companies(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getOpenJobsNoSubmissions]", error.message);
      return [];
    }

    // Filter out jobs that have submissions
    const results: (Job & { company: { name: string } | null })[] = [];
    for (const job of jobs ?? []) {
      const jobId = (job as any).id as string;
      const { data: subs } = await supabase
        .from("candidate_submissions")
        .select("id")
        .eq("job_id", jobId)
        .limit(1);

      if (!subs || subs.length === 0) {
        results.push(job as Job & { company: { name: string } | null });
      }
    }

    return results;
  } catch {
    return [];
  }
}

export async function getCompaniesInNurturing(): Promise<Company[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("outreach_status", "nurturing")
      .order("name", { ascending: true });

    if (error) {
      console.error("[getCompaniesInNurturing]", error.message);
      return [];
    }
    return (data ?? []) as Company[];
  } catch {
    return [];
  }
}

export async function getRecentPlacements(
  limit = 20
): Promise<
  {
    id: string;
    candidate_id: string;
    job_id: string;
    company_id: string;
    placement_fee: number;
    status: string;
    hired_at: string | null;
    start_date: string | null;
    created_at: string;
    candidate: { full_name: string } | null;
    job: { title: string } | null;
    company: { name: string } | null;
  }[]
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("placements")
      .select(
        "*, candidate:candidates(full_name), job:jobs(title), company:companies(name)"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getRecentPlacements]", error.message);
      return [];
    }
    return (data ?? []) as any[];
  } catch {
    return [];
  }
}

export async function getStaleOpenJobs(
  daysThreshold = 30
): Promise<(Job & { company: { name: string } | null })[]> {
  try {
    const supabase = await createClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysThreshold);

    const { data, error } = await supabase
      .from("jobs")
      .select("*, company:companies(name)")
      .eq("status", "open")
      .lt("created_at", cutoff.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[getStaleOpenJobs]", error.message);
      return [];
    }
    return (data ?? []) as (Job & { company: { name: string } | null })[];
  } catch {
    return [];
  }
}

export async function getAgingSubmissions(): Promise<
  {
    id: string;
    candidate_id: string;
    job_id: string;
    status: string;
    created_at: string;
    submitted_at: string | null;
    candidate: { full_name: string } | null;
    job: { title: string; company: { name: string } | null } | null;
  }[]
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("candidate_submissions")
      .select(
        "*, candidate:candidates(full_name), job:jobs(title, company:companies(name))"
      )
      .not("status", "in", '("hired","rejected")')
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[getAgingSubmissions]", error.message);
      return [];
    }
    return (data ?? []) as any[];
  } catch {
    return [];
  }
}
