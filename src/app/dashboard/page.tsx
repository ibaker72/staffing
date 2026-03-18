import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CompactActivityList } from "@/components/activity-timeline";
import { getCompanyCountMetric, getUpcomingFollowUps } from "@/actions/companies";
import { getCandidateCountMetric, getCandidateStatusBreakdown, getUpcomingCandidateFollowUps } from "@/actions/candidates";
import { getOpenJobCountMetric, getRecentJobs, getJobStatusBreakdown } from "@/actions/jobs";
import { getTotalRevenueMetric, getPlacementStatusBreakdown } from "@/actions/placements";
import { getRecentActivity } from "@/actions/activity";
import type { MetricQueryResult } from "@/lib/supabase/metric-query";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    settledMetrics,
    candidateBreakdown,
    jobBreakdown,
    placementBreakdown,
    recentActivity,
    recentJobs,
    companyFollowUps,
    candidateFollowUps,
  ] = await Promise.all([
    Promise.allSettled([
      getCompanyCountMetric(),
      getCandidateCountMetric(),
      getOpenJobCountMetric(),
      getTotalRevenueMetric(),
    ]),
    getCandidateStatusBreakdown(),
    getJobStatusBreakdown(),
    getPlacementStatusBreakdown(),
    getRecentActivity(10),
    getRecentJobs(5),
    getUpcomingFollowUps(),
    getUpcomingCandidateFollowUps(),
  ]);

  const metricTables = ["companies", "candidates", "jobs", "placements"];
  const metrics = settledMetrics.map((result, index): MetricQueryResult => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    const table = metricTables[index] ?? "unknown";
    console.error(`[dashboard] Metric promise rejected for table '${table}'`, result.reason);
    return { table, value: 0, hasError: true, missingTable: false, errorMessage: "Metric loader rejected" };
  });

  const [companiesMetric, candidatesMetric, openJobsMetric, revenueMetric] = metrics;
  const hasMetricErrors = metrics.some((m) => m.hasError);
  const missingTables = Array.from(new Set(metrics.filter((m) => m.missingTable).map((m) => m.table)));

  const companies = companiesMetric.value ?? 0;
  const candidates = candidatesMetric.value ?? 0;
  const openJobs = openJobsMetric.value ?? 0;
  const revenue = Number.isFinite(revenueMetric.value) ? revenueMetric.value : 0;

  const formattedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(revenue);

  // Merge follow-ups into a single sorted list
  const allFollowUps = [
    ...companyFollowUps.map((c) => ({
      id: c.id,
      name: c.name,
      type: "company" as const,
      date: c.follow_up_date!,
      href: `/companies/${c.id}`,
    })),
    ...candidateFollowUps.map((c) => ({
      id: c.id,
      name: c.full_name,
      type: "candidate" as const,
      date: c.follow_up_date!,
      href: `/candidates/${c.id}`,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your staffing operations"
      />

      {hasMetricErrors && (
        <div className="mb-4">
          <EmptyState
            title={missingTables.length > 0 ? "Database setup required" : "Some dashboard metrics are unavailable"}
            description={
              missingTables.length > 0
                ? `Missing tables: ${missingTables.join(", ")}. Run your Supabase migrations, then refresh.`
                : "A data query failed. Showing safe default values while the database recovers."
            }
          />
        </div>
      )}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Companies" value={companies} />
        <MetricCard title="Total Candidates" value={candidates} />
        <MetricCard title="Open Jobs" value={openJobs} />
        <MetricCard title="Total Revenue" value={formattedRevenue} subtitle="From paid placements" />
      </div>

      {/* Status breakdowns */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Candidate Pipeline</h3>
          <div className="space-y-2">
            {(["new", "contacted", "interviewing", "placed", "rejected"] as const).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <StatusBadge status={s} />
                <span className="text-sm font-medium text-zinc-700">{candidateBreakdown[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Job Status</h3>
          <div className="space-y-2">
            {(["open", "closed"] as const).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <StatusBadge status={s} />
                <span className="text-sm font-medium text-zinc-700">{jobBreakdown[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Placements</h3>
          <div className="space-y-2">
            {(["pending", "hired", "paid"] as const).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <StatusBadge status={s} />
                <span className="text-sm font-medium text-zinc-700">{placementBreakdown[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent activity + recent jobs + follow-ups */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Recent Activity</h3>
          <CompactActivityList events={recentActivity} />
        </Card>

        <Card className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Recent Jobs</h3>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-zinc-500">No jobs yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {recentJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="block py-2.5 first:pt-0 last:pb-0 hover:bg-zinc-50 -mx-1 px-1 rounded">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{job.title}</p>
                      <p className="text-xs text-zinc-500 truncate">{job.company?.name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <PriorityBadge priority={job.priority} />
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Upcoming Follow-ups</h3>
          {allFollowUps.length === 0 ? (
            <p className="text-sm text-zinc-500">No follow-ups scheduled.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {allFollowUps.map((item) => {
                const isOverdue = new Date(item.date) < new Date(new Date().toDateString());
                return (
                  <Link key={item.id} href={item.href} className="block py-2.5 first:pt-0 last:pb-0 hover:bg-zinc-50 -mx-1 px-1 rounded">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
                        <p className="text-xs text-zinc-500 capitalize">{item.type}</p>
                      </div>
                      <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : "text-zinc-500"}`}>
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
