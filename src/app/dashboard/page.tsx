import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCompanyCountMetric } from "@/actions/companies";
import { getCandidateCountMetric } from "@/actions/candidates";
import { getOpenJobCountMetric } from "@/actions/jobs";
import { getTotalRevenueMetric } from "@/actions/placements";

export default async function DashboardPage() {
  const [companiesMetric, candidatesMetric, openJobsMetric, revenueMetric] =
    await Promise.all([
      getCompanyCountMetric(),
      getCandidateCountMetric(),
      getOpenJobCountMetric(),
      getTotalRevenueMetric(),
    ]);

  const metrics = [
    companiesMetric,
    candidatesMetric,
    openJobsMetric,
    revenueMetric,
  ];

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
