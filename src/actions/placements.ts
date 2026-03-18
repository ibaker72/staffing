"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Placement, PlacementStatus } from "@/types/database";

export async function getPlacements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("placements")
    .select(
      "*, candidate:candidates(id, full_name), job:jobs(id, title), company:companies(id, name)"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as (Placement & {
    candidate: { id: string; full_name: string };
    job: { id: string; title: string };
    company: { id: string; name: string };
  })[];
}

export async function createPlacement(formData: FormData) {
  const supabase = await createClient();

  const fee = parseFloat(formData.get("placement_fee") as string) || 0;

  const { error } = await supabase.from("placements").insert({
    candidate_id: formData.get("candidate_id") as string,
    job_id: formData.get("job_id") as string,
    company_id: formData.get("company_id") as string,
    placement_fee: fee,
  });

  if (error) throw error;
  revalidatePath("/placements");
  revalidatePath("/dashboard");
}

export async function updatePlacementStatus(id: string, status: PlacementStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("placements")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/placements");
  revalidatePath("/dashboard");
}

export async function getTotalRevenue() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("placements")
    .select("placement_fee")
    .eq("status", "paid");

  if (error) throw error;
  return (data ?? []).reduce((sum, p) => sum + Number(p.placement_fee), 0);
}

export async function getPlacementsByJob(jobId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("placements")
    .select(
      "*, candidate:candidates(id, full_name, email, status)"
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as (Placement & {
    candidate: { id: string; full_name: string; email: string | null; status: string };
  })[];
}
