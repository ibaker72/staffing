"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type MetricQueryResult,
  safeMetricQuery,
} from "@/lib/supabase/metric-query";
import { revalidatePath } from "next/cache";
import type { Company, CompanyStatus } from "@/types/database";

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

  const { error } = await supabase.from("companies").insert({
    name: formData.get("name") as string,
    website: (formData.get("website") as string) || null,
    industry: (formData.get("industry") as string) || null,
    location: (formData.get("location") as string) || null,
    contact_email: (formData.get("contact_email") as string) || null,
    contact_name: (formData.get("contact_name") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
    notes: (formData.get("notes") as string) || null,
    status: (formData.get("status") as CompanyStatus) || "lead",
  });

  if (error) {
    console.error("[createCompany] Supabase error:", error.message);
    throw new Error("Failed to create company. Please try again.");
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

  const { error } = await supabase
    .from("companies")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[updateCompanyStatus] Supabase error:", error.message);
    throw new Error("Failed to update company status. Please try again.");
  }
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
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
