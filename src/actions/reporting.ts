"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/database";

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

// ─── Advanced Reporting ─────────────────────────────────────────

/**
 * Average time-to-fill in days for submissions that reached "hired".
 * Calculated as (decided_at - submitted_at).
 */
export async function getAverageTimeToFill(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("candidate_submissions")
      .select("submitted_at, decided_at")
      .eq("status", "hired")
      .not("decided_at", "is", null)
      .not("submitted_at", "is", null);

    if (error || !data || data.length === 0) return null;

    let totalDays = 0;
    let count = 0;
    for (const row of data) {
      if (row.submitted_at && row.decided_at) {
        const diff = new Date(row.decided_at).getTime() - new Date(row.submitted_at).getTime();
        totalDays += diff / (1000 * 60 * 60 * 24);
        count++;
      }
    }
    return count > 0 ? Math.round(totalDays / count) : null;
  } catch {
    return null;
  }
}

/**
 * Conversion rates through the submission funnel.
 * Returns percentage of submissions that reached each stage.
 */
export async function getConversionRates(): Promise<{
  toClientReview: number;
  toInterview: number;
  toOffer: number;
  toHired: number;
}> {
  const defaultRates = { toClientReview: 0, toInterview: 0, toOffer: 0, toHired: 0 };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("candidate_submissions").select("status");
    if (error || !data || data.length === 0) return defaultRates;

    const total = data.length;
    // Stages are cumulative - if someone reached "hired" they also passed through earlier stages
    const stageOrder = ["submitted", "client_review", "interview", "offer", "hired", "rejected"];
    const stageIndex = (s: string) => stageOrder.indexOf(s);

    const reachedClientReview = data.filter((r) => stageIndex(r.status) >= 1 || r.status === "rejected").length;
    const reachedInterview = data.filter((r) => stageIndex(r.status) >= 2 && r.status !== "rejected").length;
    const reachedOffer = data.filter((r) => stageIndex(r.status) >= 3 && r.status !== "rejected").length;
    const reachedHired = data.filter((r) => r.status === "hired").length;

    return {
      toClientReview: Math.round((reachedClientReview / total) * 100),
      toInterview: Math.round((reachedInterview / total) * 100),
      toOffer: Math.round((reachedOffer / total) * 100),
      toHired: Math.round((reachedHired / total) * 100),
    };
  } catch {
    return defaultRates;
  }
}

/**
 * Placements grouped by month (last 6 months).
 */
export async function getPlacementsByMonth(): Promise<{ month: string; count: number }[]> {
  try {
    const supabase = await createClient();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("placements")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    const monthMap = new Map<string, number>();
    // Pre-fill last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, 0);
    }

    for (const row of data) {
      const d = new Date(row.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }

    return Array.from(monthMap.entries()).map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      count,
    }));
  } catch {
    return [];
  }
}

/**
 * Recruiter-level stats: submissions, hires, and open tasks per recruiter.
 */
export async function getRecruiterStats(): Promise<
  { name: string; submissions: number; hires: number; openTasks: number }[]
> {
  try {
    const supabase = await createClient();

    // Get all internal users
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "recruiter"]);

    if (usersError || !users) return [];
    const typedUsers = users as UserProfile[];

    // Get jobs owned by each user to attribute submissions
    const { data: allJobs } = await supabase.from("jobs").select("id, owner_id");
    const jobsByOwner = new Map<string, string[]>();
    for (const j of allJobs ?? []) {
      if (!j.owner_id) continue;
      const list = jobsByOwner.get(j.owner_id) ?? [];
      list.push(j.id);
      jobsByOwner.set(j.owner_id, list);
    }

    const results = await Promise.all(
      typedUsers.map(async (u) => {
        const ownerJobIds = jobsByOwner.get(u.id) ?? [];
        let subs = 0;
        let hires = 0;
        if (ownerJobIds.length > 0) {
          const [subsRes, hiresRes] = await Promise.all([
            supabase
              .from("candidate_submissions")
              .select("*", { count: "exact", head: true })
              .in("job_id", ownerJobIds)
              .then((r) => r.count ?? 0),
            supabase
              .from("candidate_submissions")
              .select("*", { count: "exact", head: true })
              .in("job_id", ownerJobIds)
              .eq("status", "hired")
              .then((r) => r.count ?? 0),
          ]);
          subs = subsRes;
          hires = hiresRes;
        }
        const openTasks = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", u.id)
          .is("completed_at", null)
          .then((r) => r.count ?? 0);

        return { name: u.full_name ?? u.email ?? "Unknown", submissions: subs, hires, openTasks };
      })
    );

    return results.filter((r) => r.submissions > 0 || r.hires > 0 || r.openTasks > 0);
  } catch {
    return [];
  }
}

/**
 * My stale jobs: open jobs owned by user with no submissions, older than 14 days.
 */
export async function getMyStaleJobs(userId: string): Promise<
  { id: string; title: string; companyName: string; daysSinceCreated: number }[]
> {
  try {
    const supabase = await createClient();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, title, created_at, company:companies(name)")
      .eq("owner_id", userId)
      .eq("status", "open")
      .lt("created_at", fourteenDaysAgo.toISOString());

    if (error || !jobs) return [];

    // Check which jobs have submissions
    const jobIds = jobs.map((j) => j.id);
    if (jobIds.length === 0) return [];

    const { data: subs } = await supabase
      .from("candidate_submissions")
      .select("job_id")
      .in("job_id", jobIds);

    const jobsWithSubs = new Set((subs ?? []).map((s) => s.job_id));

    return jobs
      .filter((j) => !jobsWithSubs.has(j.id))
      .map((j) => ({
        id: j.id,
        title: j.title,
        companyName: (j.company as { name?: string } | null)?.name ?? "Unknown",
        daysSinceCreated: Math.floor(
          (Date.now() - new Date(j.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }))
      .sort((a, b) => b.daysSinceCreated - a.daysSinceCreated)
      .slice(0, 10);
  } catch {
    return [];
  }
}

/**
 * My follow-ups due today or overdue.
 */
export async function getMyFollowUpsDue(userId: string): Promise<
  { id: string; name: string; type: "company" | "candidate"; date: string; isOverdue: boolean }[]
> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const [{ data: companies }, { data: candidates }] = await Promise.all([
      supabase
        .from("companies")
        .select("id, name, follow_up_date")
        .eq("owner_id", userId)
        .not("follow_up_date", "is", null)
        .lte("follow_up_date", today)
        .order("follow_up_date", { ascending: true })
        .limit(10),
      supabase
        .from("candidates")
        .select("id, full_name, follow_up_date")
        .eq("owner_id", userId)
        .not("follow_up_date", "is", null)
        .lte("follow_up_date", today)
        .order("follow_up_date", { ascending: true })
        .limit(10),
    ]);

    const items = [
      ...(companies ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        type: "company" as const,
        date: c.follow_up_date!,
        isOverdue: c.follow_up_date! < today,
      })),
      ...(candidates ?? []).map((c) => ({
        id: c.id,
        name: c.full_name,
        type: "candidate" as const,
        date: c.follow_up_date!,
        isOverdue: c.follow_up_date! < today,
      })),
    ];

    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);
  } catch {
    return [];
  }
}

/**
 * Submission aging: submissions in non-terminal states with days since created.
 */
export async function getSubmissionAging(): Promise<
  { id: string; candidateName: string; jobTitle: string; status: string; daysAging: number }[]
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("candidate_submissions")
      .select("id, status, created_at, candidate:candidates(full_name), job:jobs(title)")
      .not("status", "in", "(hired,rejected)")
      .order("created_at", { ascending: true })
      .limit(20);

    if (error || !data) return [];

    return data.map((s) => ({
      id: s.id,
      candidateName: (s.candidate as { full_name?: string } | null)?.full_name ?? "Unknown",
      jobTitle: (s.job as { title?: string } | null)?.title ?? "Unknown",
      status: s.status,
      daysAging: Math.floor(
        (Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
  } catch {
    return [];
  }
}

/**
 * Data hygiene warnings: records with missing key fields.
 */
export async function getDataHygieneWarnings(): Promise<
  { type: string; count: number; description: string }[]
> {
  try {
    const supabase = await createClient();
    const warnings: { type: string; count: number; description: string }[] = [];

    const [
      { count: companiesNoContact },
      { count: candidatesNoEmail },
      { count: jobsNoDescription },
      { count: candidatesNoOwner },
    ] = await Promise.all([
      supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .is("contact_email", null)
        .is("contact_phone", null),
      supabase
        .from("candidates")
        .select("*", { count: "exact", head: true })
        .is("email", null),
      supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "open")
        .is("description", null),
      supabase
        .from("candidates")
        .select("*", { count: "exact", head: true })
        .is("owner_id", null),
    ]);

    if ((companiesNoContact ?? 0) > 0)
      warnings.push({ type: "companies", count: companiesNoContact ?? 0, description: "Companies with no contact info" });
    if ((candidatesNoEmail ?? 0) > 0)
      warnings.push({ type: "candidates", count: candidatesNoEmail ?? 0, description: "Candidates with no email" });
    if ((jobsNoDescription ?? 0) > 0)
      warnings.push({ type: "jobs", count: jobsNoDescription ?? 0, description: "Open jobs with no description" });
    if ((candidatesNoOwner ?? 0) > 0)
      warnings.push({ type: "candidates", count: candidatesNoOwner ?? 0, description: "Candidates with no assigned owner" });

    return warnings;
  } catch {
    return [];
  }
}

/**
 * Overdue tasks summary count grouped by priority.
 */
export async function getOverdueTaskSummary(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("tasks")
      .select("priority")
      .is("completed_at", null)
      .lt("due_date", today);

    if (error || !data) return {};
    const counts: Record<string, number> = {};
    for (const row of data) {
      counts[row.priority] = (counts[row.priority] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}
