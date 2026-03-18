"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type MetricQueryResult,
  safeMetricQuery,
} from "@/lib/supabase/metric-query";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";
import type { Candidate, CandidateStatus, OutreachStatus } from "@/types/database";

export interface CandidateFilters {
  search?: string;
  status?: CandidateStatus | "";
  source?: string;
  sort?: string;
}

export async function getCandidates(filters?: CandidateFilters): Promise<Candidate[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("candidates").select("*");

    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
      );
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.source) {
      query = query.eq("source", filters.source);
    }

    const sortField = filters?.sort || "created_at";
    const ascending = sortField === "full_name";
    query = query.order(sortField, { ascending });

    const { data, error } = await query;

    if (error) {
      console.error("[getCandidates] Supabase error:", error.message, error.code);
      return [];
    }
    return (data ?? []) as Candidate[];
  } catch (e) {
    console.error("[getCandidates] Unexpected error:", e);
    return [];
  }
}

export async function getCandidate(id: string): Promise<Candidate | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[getCandidate] Supabase error:", error.message, error.code);
      return null;
    }
    return data as Candidate | null;
  } catch (e) {
    console.error("[getCandidate] Unexpected error:", e);
    return null;
  }
}

export async function createCandidate(formData: FormData) {
  const supabase = await createClient();

  const skillsRaw = formData.get("skills") as string;
  const skills = skillsRaw
    ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const yearsExp = formData.get("years_experience") as string;
  const desiredSalary = formData.get("desired_salary") as string;
  const fullName = formData.get("full_name") as string;

  const { data, error } = await supabase.from("candidates").insert({
    full_name: fullName,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    location: (formData.get("location") as string) || null,
    skills,
    notes: (formData.get("notes") as string) || null,
    status: "new" as CandidateStatus,
    source: (formData.get("source") as string) || null,
    years_experience: yearsExp ? parseInt(yearsExp, 10) : null,
    desired_salary: desiredSalary ? parseFloat(desiredSalary) : null,
    resume_url: (formData.get("resume_url") as string) || null,
  }).select("id").single();

  if (error) {
    console.error("[createCandidate] Supabase error:", error.message);
    throw new Error("Failed to create candidate. Please try again.");
  }

  if (data?.id) {
    await logActivity("candidate", data.id, "created", `Candidate "${fullName}" added to pipeline`);
  }

  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}

export async function updateCandidateStatus(id: string, status: CandidateStatus) {
  const supabase = await createClient();

  // Get current for logging
  const { data: current } = await supabase.from("candidates").select("full_name, status").eq("id", id).maybeSingle();

  const updateData: Record<string, unknown> = { status };
  if (status === "contacted") {
    updateData.last_contacted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("[updateCandidateStatus] Supabase error:", error.message);
    throw new Error("Failed to update status. Please try again.");
  }

  if (current) {
    await logActivity("candidate", id, "status_change",
      `Status changed from "${current.status}" to "${status}" for ${current.full_name}`,
      { from: current.status, to: status }
    );
  }

  revalidatePath("/candidates");
  revalidatePath(`/candidates/${id}`);
  revalidatePath("/dashboard");
}

export async function updateCandidate(id: string, formData: FormData) {
  const supabase = await createClient();

  const skillsRaw = formData.get("skills") as string;
  const skills = skillsRaw
    ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const yearsExp = formData.get("years_experience") as string;
  const desiredSalary = formData.get("desired_salary") as string;

  const { error } = await supabase
    .from("candidates")
    .update({
      full_name: formData.get("full_name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      location: (formData.get("location") as string) || null,
      skills,
      notes: (formData.get("notes") as string) || null,
      source: (formData.get("source") as string) || null,
      years_experience: yearsExp ? parseInt(yearsExp, 10) : null,
      desired_salary: desiredSalary ? parseFloat(desiredSalary) : null,
      resume_url: (formData.get("resume_url") as string) || null,
    })
    .eq("id", id);

  if (error) {
    console.error("[updateCandidate] Supabase error:", error.message);
    throw new Error("Failed to update candidate. Please try again.");
  }
  revalidatePath("/candidates");
  revalidatePath(`/candidates/${id}`);
}

export async function updateCandidateOutreach(
  id: string,
  outreachStatus: OutreachStatus,
  followUpDate: string | null
) {
  const supabase = await createClient();

  const { data: current } = await supabase.from("candidates").select("full_name, outreach_status").eq("id", id).maybeSingle();

  const updateData: Record<string, unknown> = {
    outreach_status: outreachStatus,
    follow_up_date: followUpDate || null,
  };

  if (outreachStatus !== "none") {
    updateData.last_contacted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("[updateCandidateOutreach] Supabase error:", error.message);
    throw new Error("Failed to update outreach status. Please try again.");
  }

  if (current) {
    await logActivity("candidate", id, "outreach_update",
      `Outreach updated to "${outreachStatus}" for ${current.full_name}`,
      { from: current.outreach_status, to: outreachStatus, follow_up_date: followUpDate }
    );
  }

  revalidatePath("/candidates");
  revalidatePath(`/candidates/${id}`);
  revalidatePath("/dashboard");
}

export async function getUpcomingCandidateFollowUps(): Promise<Candidate[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .not("follow_up_date", "is", null)
      .order("follow_up_date", { ascending: true })
      .limit(10);

    if (error) {
      console.error("[getUpcomingCandidateFollowUps] Supabase error:", error.message);
      return [];
    }
    return (data ?? []) as Candidate[];
  } catch (e) {
    console.error("[getUpcomingCandidateFollowUps] Unexpected error:", e);
    return [];
  }
}

export async function getCandidateCount(): Promise<number> {
  const result = await getCandidateCountMetric();
  return result.value;
}

export async function getCandidateCountMetric(): Promise<MetricQueryResult> {
  return safeMetricQuery("candidates", async () => {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count ?? 0;
  });
}

export async function getCandidateStatusBreakdown(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("candidates").select("status");
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
