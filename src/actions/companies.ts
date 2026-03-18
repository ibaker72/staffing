"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type MetricQueryResult,
  safeMetricQuery,
} from "@/lib/supabase/metric-query";
import { revalidatePath } from "next/cache";
import type { Company } from "@/types/database";

export async function getCompanies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Company[];
}

export async function getCompany(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Company;
}

export async function createCompany(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("companies").insert({
    name: formData.get("name") as string,
    website: (formData.get("website") as string) || null,
    industry: (formData.get("industry") as string) || null,
    location: (formData.get("location") as string) || null,
    contact_email: (formData.get("contact_email") as string) || null,
  });

  if (error) throw error;
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
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
}

export async function getCompanyCount() {
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
