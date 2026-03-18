"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type MetricQueryResult,
  safeMetricQuery,
} from "@/lib/supabase/metric-query";
import { revalidatePath } from "next/cache";
import type { Candidate, CandidateStatus } from "@/types/database";

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

  const { error } = await supabase.from("candidates").insert({
    full_name: formData.get("full_name") as string,
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
  });

  if (error) {
    console.error("[createCandidate] Supabase error:", error.message);
    throw new Error("Failed to create candidate. Please try again.");
  }
  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}

export async function updateCandidateStatus(id: string, status: CandidateStatus) {
  const supabase = await createClient();

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
  revalidatePath("/candidates");
  revalidatePath(`/candidates/${id}`);
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
