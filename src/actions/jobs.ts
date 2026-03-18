"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Job } from "@/types/database";

export type JobWithCompany = Job & { company: { id: string; name: string } | null };

export async function getJobs(): Promise<JobWithCompany[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*, company:companies(id, name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getJobs] Supabase error:", error.message, error.code);
      return [];
    }
    return (data ?? []) as JobWithCompany[];
  } catch (e) {
    console.error("[getJobs] Unexpected error:", e);
    return [];
  }
}

export async function getJob(id: string): Promise<JobWithCompany | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*, company:companies(id, name)")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[getJob] Supabase error:", error.message, error.code);
      return null;
    }
    return data as JobWithCompany | null;
  } catch (e) {
    console.error("[getJob] Unexpected error:", e);
    return null;
  }
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

  if (error) {
    console.error("[createJob] Supabase error:", error.message);
    throw new Error("Failed to create job. Please try again.");
  }
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function updateJobStatus(id: string, status: "open" | "closed") {
  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[updateJobStatus] Supabase error:", error.message);
    throw new Error("Failed to update job status. Please try again.");
  }
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/dashboard");
}

export async function getOpenJobCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    if (error) {
      console.error("[getOpenJobCount] Supabase error:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (e) {
    console.error("[getOpenJobCount] Unexpected error:", e);
    return 0;
  }
}

export async function getJobsByCompany(companyId: string): Promise<Job[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getJobsByCompany] Supabase error:", error.message);
      return [];
    }
    return (data ?? []) as Job[];
  } catch (e) {
    console.error("[getJobsByCompany] Unexpected error:", e);
    return [];
  }
}
