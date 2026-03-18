import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CompactActivityList } from "@/components/activity-timeline";
import { SubmissionStatusBadge } from "@/components/submission-list";
import { getCompanyCountMetric, getUpcomingFollowUps } from "@/actions/companies";
import { getCandidateCountMetric, getCandidateStatusBreakdown, getUpcomingCandidateFollowUps, getMyCandidates } from "@/actions/candidates";
import { getOpenJobCountMetric, getRecentJobs, getJobStatusBreakdown, getMyJobs } from "@/actions/jobs";
import { getTotalRevenueMetric, getPlacementStatusBreakdown } from "@/actions/placements";
import { getRecentActivity } from "@/actions/activity";
import { getPlacementsThisMonth, getRevenueByCompany, getSubmissionFunnelCounts, getActiveSubmissionsCount, getOpenTasksCount } from "@/actions/reporting";
import { getOverdueTasks, getMyTasks } from "@/actions/tasks";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import type { MetricQueryResult } from "@/lib/supabase/metric-query";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  const [
    settledMetrics,
    candidateBreakdown,
    jobBreakdown,
    placementBreakdown,
    recentActivity,
    recentJobs,
    companyFollowUps,
    candidateFollowUps,
    placementsThisMonth,
    revenueByCompany,
    submissionFunnel,
    activeSubmissions,
    openTasksCount,
    overdueTasks,
    myJobs,
    myCandidates,
    myTasks,
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
    getPlacementsThisMonth(),
    getRevenueByCompany(),
    getSubmissionFunnelCounts(),
    getActiveSubmissionsCount(),
    getOpenTasksCount(),
    getOverdueTasks(),
    currentUser ? getMyJobs(currentUser.id) : Promise.resolve([]),
    currentUser ? getMyCandidates(currentUser.id) : Promise.resolve([]),
    currentUser ? getMyTasks(currentUser.id) : Promise.resolve([]),
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

  const submissionStatuses = ["internal_review", "submitted", "client_review", "interview", "offer", "hired", "rejected"] as const;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your staffing operations"
      />

      {/* Onboarding checklist for new users */}
      <OnboardingChecklist companies={companies} candidates={candidates} jobs={openJobs} />

      {/* My Work section */}
      {currentUser && (myJobs.length > 0 || myCandidates.length > 0 || myTasks.length > 0) && (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          {myTasks.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">My Tasks</h3>
              <div className="divide-y divide-zinc-100">
                {myTasks.slice(0, 5).map((task) => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());
                  return (
                    <div key={task.id} className="py-2 first:pt-0 last:pb-0">
                      <p className="text-sm text-zinc-900">{task.title}</p>
                      {task.due_date && (
                        <p className={`text-[10px] ${isOverdue ? "text-red-600 font-medium" : "text-zinc-400"}`}>
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <Link href="/tasks" className="text-xs text-zinc-500 hover:text-zinc-700 mt-2 block">
                View all tasks
              </Link>
            </Card>
          )}
          {myJobs.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">My Jobs</h3>
              <div className="divide-y divide-zinc-100">
                {myJobs.slice(0, 5).map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block py-2 first:pt-0 last:pb-0 hover:bg-zinc-50 -mx-1 px-1 rounded">
                    <p className="text-sm font-medium text-zinc-900 truncate">{job.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{job.company?.name}</p>
                  </Link>
                ))}
              </div>
            </Card>
          )}
          {myCandidates.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">My Candidates</h3>
              <div className="divide-y divide-zinc-100">
                {myCandidates.slice(0, 5).map((c) => (
                  <Link key={c.id} href={`/candidates/${c.id}`} className="block py-2 first:pt-0 last:pb-0 hover:bg-zinc-50 -mx-1 px-1 rounded">
                    <p className="text-sm font-medium text-zinc-900 truncate">{c.full_name}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      {c.location && <span className="text-xs text-zinc-400">{c.location}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

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

      {/* Secondary metrics */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Placements This Month" value={placementsThisMonth} />
        <MetricCard title="Active Submissions" value={activeSubmissions} subtitle="In pipeline" />
        <MetricCard title="Open Tasks" value={openTasksCount} />
        <MetricCard
          title="Overdue Tasks"
          value={overdueTasks.length}
          subtitle={overdueTasks.length > 0 ? "Needs attention" : undefined}
        />
      </div>

      {/* Status breakdowns */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Submission Funnel</h3>
          <div className="space-y-2">
            {submissionStatuses.map((s) => (
              <div key={s} className="flex items-center justify-between">
                <SubmissionStatusBadge status={s} />
                <span className="text-sm font-medium text-zinc-700">{submissionFunnel[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue by company */}
      {revenueByCompany.length > 0 && (
        <div className="mt-6">
          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Revenue by Company</h3>
            <div className="space-y-2">
              {revenueByCompany.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700 truncate">{item.name}</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

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

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="mt-6">
          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Overdue Tasks</h3>
            <div className="divide-y divide-zinc-100">
              {overdueTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{task.title}</p>
                    <p className="text-xs text-red-600">
                      Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <Link href="/tasks" className="text-xs text-zinc-500 hover:text-zinc-700 underline shrink-0">
                    View
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
