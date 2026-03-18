"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type MetricQueryResult,
  safeMetricQuery,
} from "@/lib/supabase/metric-query";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";
import type { Job, JobStatus, JobPriority, EmploymentType, PayType } from "@/types/database";

export type JobWithCompany = Job & { company: { id: string; name: string } | null };

export interface JobFilters {
  search?: string;
  status?: JobStatus | "";
  priority?: JobPriority | "";
  sort?: string;
}

export async function getJobs(filters?: JobFilters): Promise<JobWithCompany[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("jobs")
      .select("*, company:companies(id, name)");

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
      );
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.priority) {
      query = query.eq("priority", filters.priority);
    }

    const sortField = filters?.sort || "created_at";
    const ascending = sortField === "title";
    query = query.order(sortField, { ascending });

    const { data, error } = await query;

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
  const { data: { user } } = await supabase.auth.getUser();
  const title = formData.get("title") as string;

  const { data, error } = await supabase.from("jobs").insert({
    company_id: formData.get("company_id") as string,
    title,
    description: (formData.get("description") as string) || null,
    location: (formData.get("location") as string) || null,
    salary_range: (formData.get("salary_range") as string) || null,
    priority: (formData.get("priority") as JobPriority) || "medium",
    urgency_notes: (formData.get("urgency_notes") as string) || null,
    employment_type: (formData.get("employment_type") as EmploymentType) || "full_time",
    pay_type: (formData.get("pay_type") as PayType) || "salary",
    owner_id: user?.id ?? null,
  }).select("id").single();

  if (error) {
    console.error("[createJob] Supabase error:", error.message);
    throw new Error("Failed to create job. Please try again.");
  }

  if (data?.id) {
    await logActivity("job", data.id, "created", `Job "${title}" created`);
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function updateJobStatus(id: string, status: JobStatus) {
  const supabase = await createClient();

  const { data: current } = await supabase.from("jobs").select("title, status").eq("id", id).maybeSingle();

  const { error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[updateJobStatus] Supabase error:", error.message);
    throw new Error("Failed to update job status. Please try again.");
  }

  if (current) {
    await logActivity("job", id, "status_change",
      `Job "${current.title}" ${status === "closed" ? "closed" : "reopened"}`,
      { from: current.status, to: status }
    );
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/dashboard");
}

export async function getOpenJobCount(): Promise<number> {
  const result = await getOpenJobCountMetric();
  return result.value;
}

export async function getOpenJobCountMetric(): Promise<MetricQueryResult> {
  return safeMetricQuery("jobs", async () => {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    if (error) throw error;
    return count ?? 0;
  });
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

export async function getRecentJobs(limit = 5): Promise<JobWithCompany[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*, company:companies(id, name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as JobWithCompany[];
  } catch {
    return [];
  }
}

export async function getJobStatusBreakdown(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("jobs").select("status");
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

export async function getMyJobs(userId: string, limit = 10): Promise<JobWithCompany[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*, company:companies(id, name)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as JobWithCompany[];
  } catch {
    return [];
  }
}
