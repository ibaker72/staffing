import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCompanyCountMetric } from "@/actions/companies";
import { getCandidateCountMetric } from "@/actions/candidates";
import { getOpenJobCountMetric } from "@/actions/jobs";
import { getTotalRevenueMetric } from "@/actions/placements";
import type { MetricQueryResult } from "@/lib/supabase/metric-query";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const settledMetrics = await Promise.allSettled([
    getCompanyCountMetric(),
    getCandidateCountMetric(),
    getOpenJobCountMetric(),
    getTotalRevenueMetric(),
  ]);

  const metricTables = ["companies", "candidates", "jobs", "placements"];
  const metrics = settledMetrics.map((result, index): MetricQueryResult => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    const table = metricTables[index] ?? "unknown";
    console.error(`[dashboard] Metric promise rejected for table '${table}'`, result.reason);

    return {
      table,
      value: 0,
      hasError: true,
      missingTable: false,
      errorMessage: "Metric loader rejected",
    };
  });

  const [companiesMetric, candidatesMetric, openJobsMetric, revenueMetric] = metrics;

  const hasMetricErrors = metrics.some((metric) => metric.hasError);
  const missingTables = Array.from(
    new Set(
      metrics
        .filter((metric) => metric.missingTable)
        .map((metric) => metric.table)
    )
  );

  const companies = companiesMetric.value ?? 0;
  const candidates = candidatesMetric.value ?? 0;
  const openJobs = openJobsMetric.value ?? 0;
  const revenue = Number.isFinite(revenueMetric.value) ? revenueMetric.value : 0;

  const formattedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(revenue);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your staffing operations"
      />
      {hasMetricErrors && (
        <div className="mb-4">
          <EmptyState
            title={
              missingTables.length > 0
                ? "Database setup required"
                : "Some dashboard metrics are unavailable"
            }
            description={
              missingTables.length > 0
                ? `Missing tables: ${missingTables.join(", ")}. Run your Supabase migrations, then refresh.`
                : "A data query failed. Showing safe default values while the database recovers."
            }
          />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Companies" value={companies} />
        <MetricCard title="Total Candidates" value={candidates} />
        <MetricCard title="Open Jobs" value={openJobs} />
        <MetricCard title="Total Revenue" value={formattedRevenue} subtitle="From paid placements" />
      </div>
    </>
  );
}
