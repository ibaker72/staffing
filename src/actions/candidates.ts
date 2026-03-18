"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type MetricQueryResult,
  safeMetricQuery,
} from "@/lib/supabase/metric-query";
import { revalidatePath } from "next/cache";
import type { Candidate, CandidateStatus } from "@/types/database";

export async function getCandidates(): Promise<Candidate[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false });

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

  const { error } = await supabase.from("candidates").insert({
    full_name: formData.get("full_name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    location: (formData.get("location") as string) || null,
    skills,
    notes: (formData.get("notes") as string) || null,
    status: "new" as CandidateStatus,
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

  const { error } = await supabase
    .from("candidates")
    .update({ status })
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

  const { error } = await supabase
    .from("candidates")
    .update({
      full_name: formData.get("full_name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      location: (formData.get("location") as string) || null,
      skills,
      notes: (formData.get("notes") as string) || null,
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
