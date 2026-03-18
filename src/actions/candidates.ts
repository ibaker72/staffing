"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type MetricQueryResult,
  safeMetricQuery,
} from "@/lib/supabase/metric-query";
import { revalidatePath } from "next/cache";
import type { Candidate, CandidateStatus } from "@/types/database";

export async function getCandidates() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Candidate[];
}

export async function getCandidate(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Candidate;
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

  if (error) throw error;
  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}

export async function updateCandidateStatus(id: string, status: CandidateStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("candidates")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
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

  if (error) throw error;
  revalidatePath("/candidates");
  revalidatePath(`/candidates/${id}`);
}

export async function getCandidateCount() {
  const result = await getCandidateCountMetric();
  return result.value;
}

export async function getCandidateCountMetric(): Promise<MetricQueryResult> {
  const supabase = await createClient();

  return safeMetricQuery("candidates", async () => {
    const { count, error } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count ?? 0;
  });
}
