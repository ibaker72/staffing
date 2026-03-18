import Link from "next/link";
import { Suspense } from "react";
import { getJobs, type JobFilters } from "@/actions/jobs";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar, FilterSelect, SortSelect } from "@/components/ui/search-filters";
import type { JobStatus, JobPriority } from "@/types/database";

export const dynamic = "force-dynamic";

const employmentLabels: Record<string, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  temp_to_hire: "Temp-to-Hire",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters: JobFilters = {
    search: params.search,
    status: (params.status as JobStatus) || "",
    priority: (params.priority as JobPriority) || "",
    sort: params.sort,
  };

  const jobs = await getJobs(filters);
  const hasFilters = !!(params.search || params.status || params.priority);

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Open roles across your client companies"
        action={<LinkButton href="/jobs/new">Create Job</LinkButton>}
      />

      <Suspense>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar placeholder="Search by title, location..." />
          </div>
          <FilterSelect
            name="status"
            placeholder="All Statuses"
            options={[
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ]}
          />
          <FilterSelect
            name="priority"
            placeholder="All Priorities"
            options={[
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
          <SortSelect
            options={[
              { value: "created_at", label: "Newest" },
              { value: "title", label: "Title A-Z" },
              { value: "priority", label: "Priority" },
            ]}
          />
        </div>
      </Suspense>

      {jobs.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No jobs match your filters" : "No jobs yet"}
          description={hasFilters ? "Try adjusting your search or filters." : "Create your first job posting to start matching candidates."}
          action={!hasFilters ? <LinkButton href="/jobs/new">Create Job</LinkButton> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-900">{job.title}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <PriorityBadge priority={job.priority} />
                    <StatusBadge status={job.status} />
                  </div>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  {job.company?.name ?? "Unknown Company"}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                  {job.location && <span>{job.location}</span>}
                  {job.salary_range && <span>{job.salary_range}</span>}
                  <span>{employmentLabels[job.employment_type] ?? job.employment_type}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
