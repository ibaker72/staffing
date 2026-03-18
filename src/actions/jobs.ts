"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type MetricQueryResult,
  safeMetricQuery,
} from "@/lib/supabase/metric-query";
import { revalidatePath } from "next/cache";
import type { Job } from "@/types/database";

export async function getJobs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, company:companies(id, name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as (Job & { company: { id: string; name: string } })[];
}

export async function getJob(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, company:companies(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Job & { company: { id: string; name: string } };
}

export async function createJob(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("jobs").insert({
    company_id: formData.get("company_id") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    location: (formData.get("location") as string) || null,
    salary_range: (formData.get("salary_range") as string) || null,
  });

  if (error) throw error;
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function updateJobStatus(id: string, status: "open" | "closed") {
  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/dashboard");
}

export async function getOpenJobCount() {
  const result = await getOpenJobCountMetric();
  return result.value;
}

export async function getOpenJobCountMetric(): Promise<MetricQueryResult> {
  const supabase = await createClient();

  return safeMetricQuery("jobs", async () => {
    const { count, error } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    if (error) throw error;
    return count ?? 0;
  });
}

export async function getJobsByCompany(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Job[];
}
