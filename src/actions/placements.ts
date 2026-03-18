"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Placement, PlacementStatus } from "@/types/database";

export type PlacementWithRelations = Placement & {
  candidate: { id: string; full_name: string } | null;
  job: { id: string; title: string } | null;
  company: { id: string; name: string } | null;
};

export type PlacementWithCandidate = Placement & {
  candidate: { id: string; full_name: string; email: string | null; status: string } | null;
};

export async function getPlacements(): Promise<PlacementWithRelations[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("placements")
      .select(
        "*, candidate:candidates(id, full_name), job:jobs(id, title), company:companies(id, name)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getPlacements] Supabase error:", error.message, error.code);
      return [];
    }
    return (data ?? []) as PlacementWithRelations[];
  } catch (e) {
    console.error("[getPlacements] Unexpected error:", e);
    return [];
  }
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

  if (error) {
    console.error("[createPlacement] Supabase error:", error.message);
    throw new Error("Failed to create placement. Please try again.");
  }
  revalidatePath("/placements");
  revalidatePath("/dashboard");
}

export async function updatePlacementStatus(id: string, status: PlacementStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("placements")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[updatePlacementStatus] Supabase error:", error.message);
    throw new Error("Failed to update placement status. Please try again.");
  }
  revalidatePath("/placements");
  revalidatePath("/dashboard");
}

export async function getTotalRevenue(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("placements")
      .select("placement_fee")
      .eq("status", "paid");

    if (error) {
      console.error("[getTotalRevenue] Supabase error:", error.message);
      return 0;
    }
    return (data ?? []).reduce(
      (sum, p) => sum + (Number(p.placement_fee) || 0),
      0
    );
  } catch (e) {
    console.error("[getTotalRevenue] Unexpected error:", e);
    return 0;
  }
}

export async function getPlacementsByJob(jobId: string): Promise<PlacementWithCandidate[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("placements")
      .select(
        "*, candidate:candidates(id, full_name, email, status)"
      )
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getPlacementsByJob] Supabase error:", error.message);
      return [];
    }
    return (data ?? []) as PlacementWithCandidate[];
  } catch (e) {
    console.error("[getPlacementsByJob] Unexpected error:", e);
    return [];
  }
}
