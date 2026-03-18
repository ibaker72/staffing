"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type MetricQueryResult,
  safeMetricQuery,
} from "@/lib/supabase/metric-query";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";
import type { Company, CompanyStatus, OutreachStatus } from "@/types/database";

export interface CompanyFilters {
  search?: string;
  status?: CompanyStatus | "";
  industry?: string;
  location?: string;
  sort?: string;
}

export async function getCompanies(filters?: CompanyFilters): Promise<Company[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("companies").select("*");

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%,location.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%`
      );
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const sortField = filters?.sort || "created_at";
    const ascending = sortField === "name";
    query = query.order(sortField, { ascending });

    const { data, error } = await query;

    if (error) {
      console.error("[getCompanies] Supabase error:", error.message, error.code);
      return [];
    }
    return (data ?? []) as Company[];
  } catch (e) {
    console.error("[getCompanies] Unexpected error:", e);
    return [];
  }
}

export async function getCompany(id: string): Promise<Company | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[getCompany] Supabase error:", error.message, error.code);
      return null;
    }
    return data as Company | null;
  } catch (e) {
    console.error("[getCompany] Unexpected error:", e);
    return null;
  }
}

export async function createCompany(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;

  const { data, error } = await supabase.from("companies").insert({
    name,
    website: (formData.get("website") as string) || null,
    industry: (formData.get("industry") as string) || null,
    location: (formData.get("location") as string) || null,
    contact_email: (formData.get("contact_email") as string) || null,
    contact_name: (formData.get("contact_name") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
    notes: (formData.get("notes") as string) || null,
    status: (formData.get("status") as CompanyStatus) || "lead",
  }).select("id").single();

  if (error) {
    console.error("[createCompany] Supabase error:", error.message);
    throw new Error("Failed to create company. Please try again.");
  }

  if (data?.id) {
    await logActivity("company", data.id, "created", `Company "${name}" created`);
  }

  revalidatePath("/companies");
  revalidatePath("/dashboard");
}

export async function updateCompany(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({
      name: formData.get("name") as string,
      website: (formData.get("website") as string) || null,
      industry: (formData.get("industry") as string) || null,
      location: (formData.get("location") as string) || null,
      contact_email: (formData.get("contact_email") as string) || null,
      contact_name: (formData.get("contact_name") as string) || null,
      contact_phone: (formData.get("contact_phone") as string) || null,
      notes: (formData.get("notes") as string) || null,
      status: (formData.get("status") as CompanyStatus) || "lead",
    })
    .eq("id", id);

  if (error) {
    console.error("[updateCompany] Supabase error:", error.message);
    throw new Error("Failed to update company. Please try again.");
  }
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
}

export async function updateCompanyStatus(id: string, status: CompanyStatus) {
  const supabase = await createClient();

  // Get current for logging
  const { data: current } = await supabase.from("companies").select("name, status").eq("id", id).maybeSingle();

  const { error } = await supabase
    .from("companies")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[updateCompanyStatus] Supabase error:", error.message);
    throw new Error("Failed to update company status. Please try again.");
  }

  if (current) {
    await logActivity("company", id, "status_change",
      `Status changed from "${current.status}" to "${status}" for ${current.name}`,
      { from: current.status, to: status }
    );
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  revalidatePath("/dashboard");
}

export async function updateCompanyOutreach(
  id: string,
  outreachStatus: OutreachStatus,
  followUpDate: string | null
) {
  const supabase = await createClient();

  const { data: current } = await supabase.from("companies").select("name, outreach_status").eq("id", id).maybeSingle();

  const updateData: Record<string, unknown> = {
    outreach_status: outreachStatus,
    follow_up_date: followUpDate || null,
  };

  if (outreachStatus !== "none") {
    updateData.last_contacted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("companies")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("[updateCompanyOutreach] Supabase error:", error.message);
    throw new Error("Failed to update outreach status. Please try again.");
  }

  if (current) {
    await logActivity("company", id, "outreach_update",
      `Outreach updated to "${outreachStatus}" for ${current.name}`,
      { from: current.outreach_status, to: outreachStatus, follow_up_date: followUpDate }
    );
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  revalidatePath("/dashboard");
}

export async function getUpcomingFollowUps(): Promise<Company[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .not("follow_up_date", "is", null)
      .order("follow_up_date", { ascending: true })
      .limit(10);

    if (error) {
      console.error("[getUpcomingFollowUps] Supabase error:", error.message);
      return [];
    }
    return (data ?? []) as Company[];
  } catch (e) {
    console.error("[getUpcomingFollowUps] Unexpected error:", e);
    return [];
  }
}

export async function getCompanyCount(): Promise<number> {
  const result = await getCompanyCountMetric();
  return result.value;
}

export async function getCompanyCountMetric(): Promise<MetricQueryResult> {
  return safeMetricQuery("companies", async () => {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count ?? 0;
  });
}
