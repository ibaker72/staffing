import { Suspense } from "react";
import { getJobs, type JobFilters } from "@/actions/jobs";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar, FilterSelect, SortSelect } from "@/components/ui/search-filters";
import { JobListWithBulk } from "@/components/job-list-bulk";
import type { JobStatus, JobPriority } from "@/types/database";

export const dynamic = "force-dynamic";

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
        <JobListWithBulk jobs={jobs} />
      )}
    </>
  );
}
