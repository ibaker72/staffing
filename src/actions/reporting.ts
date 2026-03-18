"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPlacementsThisMonth(): Promise<number> {
  try {
    const supabase = await createClient();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("placements")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString());

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getRevenueByCompany(): Promise<{ name: string; revenue: number }[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("placements")
      .select("placement_fee, company:companies(name)")
      .eq("status", "paid");

    if (error || !data) return [];

    const map = new Map<string, number>();
    for (const row of data) {
      const name = (row.company as { name?: string } | null)?.name ?? "Unknown";
      const fee = Number(row.placement_fee) || 0;
      map.set(name, (map.get(name) ?? 0) + fee);
    }

    return Array.from(map.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  } catch {
    return [];
  }
}

export async function getSubmissionFunnelCounts(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("candidate_submissions").select("status");
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

export async function getActiveSubmissionsCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("candidate_submissions")
      .select("*", { count: "exact", head: true })
      .not("status", "in", "(hired,rejected)");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getOpenTasksCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .is("completed_at", null);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
