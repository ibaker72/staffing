import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";

export const metadata: Metadata = { title: "Reports" };
import {
  getAverageTimeToFill,
  getConversionRates,
  getPlacementsByMonth,
  getRecruiterStats,
  getOverdueTaskSummary,
  getPlacementsThisMonth,
  getActiveSubmissionsCount,
} from "@/actions/reporting";

export const dynamic = "force-dynamic";

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default async function ReportingPage() {
  const [
    avgTimeToFill,
    conversionRates,
    placementsByMonth,
    recruiterStats,
    overdueByPriority,
    placementsThisMonth,
    activeSubmissions,
  ] = await Promise.all([
    getAverageTimeToFill(),
    getConversionRates(),
    getPlacementsByMonth(),
    getRecruiterStats(),
    getOverdueTaskSummary(),
    getPlacementsThisMonth(),
    getActiveSubmissionsCount(),
  ]);

  const totalOverdue = Object.values(overdueByPriority).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader
        title="Reporting"
        description="Performance metrics and pipeline analytics"
      />

      {/* Top-level KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Avg. Time to Fill"
          value={avgTimeToFill != null ? `${avgTimeToFill}d` : "—"}
          subtitle="Submission to hire"
        />
        <MetricCard title="Placements This Month" value={placementsThisMonth} />
        <MetricCard title="Active Submissions" value={activeSubmissions} subtitle="In pipeline" />
        <MetricCard
          title="Overdue Tasks"
          value={totalOverdue}
          subtitle={totalOverdue > 0 ? "Needs attention" : "All clear"}
        />
      </div>

      {/* Conversion funnel */}
      <div className="mt-6">
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Submission Conversion Rates</h3>
          <div className="space-y-3">
            {[
              { label: "Submitted → Client Review", value: conversionRates.toClientReview },
              { label: "→ Interview", value: conversionRates.toInterview },
              { label: "→ Offer", value: conversionRates.toOffer },
              { label: "→ Hired", value: conversionRates.toHired },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-zinc-600">{item.label}</span>
                  <span className="text-sm font-medium text-zinc-900">{item.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100">
                  <div
                    className="h-2 rounded-full bg-zinc-900 transition-all"
                    style={{ width: `${Math.max(item.value, 1)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Placements by month + Overdue tasks */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Placements by Month</h3>
          {placementsByMonth.length === 0 ? (
            <p className="text-sm text-zinc-500">No placement data yet.</p>
          ) : (
            <div className="space-y-2">
              {placementsByMonth.map((item) => {
                const maxCount = Math.max(...placementsByMonth.map((p) => p.count), 1);
                return (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-16 shrink-0">{item.month}</span>
                    <div className="flex-1 h-5 rounded bg-zinc-100">
                      <div
                        className="h-5 rounded bg-zinc-800 flex items-center justify-end px-2"
                        style={{ width: `${Math.max((item.count / maxCount) * 100, item.count > 0 ? 10 : 0)}%` }}
                      >
                        {item.count > 0 && (
                          <span className="text-[10px] font-medium text-white">{item.count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Overdue Tasks by Priority</h3>
          {totalOverdue === 0 ? (
            <p className="text-sm text-zinc-500">No overdue tasks. Great job!</p>
          ) : (
            <div className="space-y-2">
              {(["urgent", "high", "medium", "low"] as const).map((p) => {
                const count = overdueByPriority[p] ?? 0;
                if (count === 0) return null;
                return (
                  <div key={p} className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      p === "urgent" ? "text-red-700" : p === "high" ? "text-red-500" : p === "medium" ? "text-amber-500" : "text-zinc-400"
                    }`}>
                      {priorityLabels[p]}
                    </span>
                    <span className="text-sm font-medium text-zinc-900">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recruiter performance */}
      {recruiterStats.length > 0 && (
        <div className="mt-6">
          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Recruiter Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left font-medium text-zinc-500 pb-2">Recruiter</th>
                    <th className="text-right font-medium text-zinc-500 pb-2">Submissions</th>
                    <th className="text-right font-medium text-zinc-500 pb-2">Hires</th>
                    <th className="text-right font-medium text-zinc-500 pb-2">Open Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {recruiterStats.map((r) => (
                    <tr key={r.name} className="border-b border-zinc-50 last:border-0">
                      <td className="py-2 font-medium text-zinc-900">{r.name}</td>
                      <td className="py-2 text-right text-zinc-600">{r.submissions}</td>
                      <td className="py-2 text-right text-zinc-600">{r.hires}</td>
                      <td className="py-2 text-right text-zinc-600">{r.openTasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
