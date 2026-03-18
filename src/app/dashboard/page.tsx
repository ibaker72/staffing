import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { getCompanyCount } from "@/actions/companies";
import { getCandidateCount } from "@/actions/candidates";
import { getOpenJobCount } from "@/actions/jobs";
import { getTotalRevenue } from "@/actions/placements";

export default async function DashboardPage() {
  const [companies, candidates, openJobs, revenue] = await Promise.all([
    getCompanyCount(),
    getCandidateCount(),
    getOpenJobCount(),
    getTotalRevenue(),
  ]);

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Companies" value={companies} />
        <MetricCard title="Total Candidates" value={candidates} />
        <MetricCard title="Open Jobs" value={openJobs} />
        <MetricCard title="Total Revenue" value={formattedRevenue} subtitle="From paid placements" />
      </div>
    </>
  );
}
