"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Company } from "@/types/database";

export async function getCompanies(): Promise<Company[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

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
    })
    .eq("id", id);

  if (error) {
    console.error("[updateCompany] Supabase error:", error.message);
    throw new Error("Failed to update company. Please try again.");
  }
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
}

export async function getCompanyCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("[getCompanyCount] Supabase error:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (e) {
    console.error("[getCompanyCount] Unexpected error:", e);
    return 0;
  }
}
