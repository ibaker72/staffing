"use server";

import { createClient } from "@/lib/supabase/server";
import { getTopCandidatesForJob, getTopJobsForCandidate, type MatchScore } from "@/lib/matching";
import type { Candidate, Job } from "@/types/database";

export async function getMatchesForJob(jobId: string): Promise<MatchScore[]> {
  try {
    const supabase = await createClient();

    const [jobResult, candidatesResult] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId).maybeSingle(),
      supabase.from("candidates").select("*"),
    ]);

    if (jobResult.error || !jobResult.data) return [];
    if (candidatesResult.error) return [];

    const job = jobResult.data as Job;
    const candidates = (candidatesResult.data ?? []) as Candidate[];

    return getTopCandidatesForJob(candidates, job);
  } catch (e) {
    console.error("[getMatchesForJob] error:", e);
    return [];
  }
}

export async function getMatchesForCandidate(candidateId: string): Promise<MatchScore[]> {
  try {
    const supabase = await createClient();

    const [candidateResult, jobsResult] = await Promise.all([
      supabase.from("candidates").select("*").eq("id", candidateId).maybeSingle(),
      supabase.from("jobs").select("*").eq("status", "open"),
    ]);

    if (candidateResult.error || !candidateResult.data) return [];
    if (jobsResult.error) return [];

    const candidate = candidateResult.data as Candidate;
    const jobs = (jobsResult.data ?? []) as Job[];

    return getTopJobsForCandidate(candidate, jobs);
  } catch (e) {
    console.error("[getMatchesForCandidate] error:", e);
    return [];
  }
}
