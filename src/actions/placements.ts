"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type MetricQueryResult,
  safeMetricQuery,
} from "@/lib/supabase/metric-query";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";
import type { Placement, PlacementStatus } from "@/types/database";

export type PlacementWithRelations = Placement & {
  candidate: { id: string; full_name: string } | null;
  job: { id: string; title: string } | null;
  company: { id: string; name: string } | null;
};

export type PlacementWithCandidate = Placement & {
  candidate: { id: string; full_name: string; email: string | null; status: string } | null;
};

export interface PlacementFilters {
  status?: PlacementStatus | "";
  company_id?: string;
  candidate_id?: string;
}

export async function getPlacements(filters?: PlacementFilters): Promise<PlacementWithRelations[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("placements")
      .select(
        "*, candidate:candidates(id, full_name), job:jobs(id, title), company:companies(id, name)"
      );

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.company_id) {
      query = query.eq("company_id", filters.company_id);
    }
    if (filters?.candidate_id) {
      query = query.eq("candidate_id", filters.candidate_id);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

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

  const { data, error } = await supabase.from("placements").insert({
    candidate_id: formData.get("candidate_id") as string,
    job_id: formData.get("job_id") as string,
    company_id: formData.get("company_id") as string,
    placement_fee: fee,
    notes: (formData.get("notes") as string) || null,
    start_date: (formData.get("start_date") as string) || null,
  }).select("id").single();

  if (error) {
    console.error("[createPlacement] Supabase error:", error.message);
    throw new Error("Failed to create placement. Please try again.");
  }

  if (data?.id) {
    await logActivity("placement", data.id, "created", `New placement created`);
  }

  revalidatePath("/placements");
  revalidatePath("/dashboard");
}

export async function updatePlacementStatus(id: string, status: PlacementStatus) {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("placements")
    .select("status, candidate:candidates(full_name), job:jobs(title)")
    .eq("id", id)
    .maybeSingle();

  const updateData: Record<string, unknown> = { status };
  if (status === "hired") {
    updateData.hired_at = new Date().toISOString();
  } else if (status === "paid") {
    updateData.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("placements")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("[updatePlacementStatus] Supabase error:", error.message);
    throw new Error("Failed to update placement status. Please try again.");
  }

  const candidateName = (current?.candidate as { full_name?: string } | null)?.full_name ?? "Unknown";
  const jobTitle = (current?.job as { title?: string } | null)?.title ?? "Unknown";
  await logActivity("placement", id, "status_change",
    `Placement for ${candidateName} at "${jobTitle}" marked as ${status}`,
    { from: current?.status, to: status }
  );

  revalidatePath("/placements");
  revalidatePath("/dashboard");
}

export async function getTotalRevenue(): Promise<number> {
  const result = await getTotalRevenueMetric();
  return result.value;
}

export async function getTotalRevenueMetric(): Promise<MetricQueryResult> {
  return safeMetricQuery("placements", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("placements")
      .select("placement_fee")
      .eq("status", "paid");

    if (error) throw error;

    return (data ?? []).reduce((sum, placement) => {
      const fee = Number(placement?.placement_fee);
      return sum + (Number.isFinite(fee) ? fee : 0);
    }, 0);
  });
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

export async function getPlacementStatusBreakdown(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("placements").select("status");
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
