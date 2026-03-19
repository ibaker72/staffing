import { Suspense } from "react";
import type { Metadata } from "next";
import { getCandidates, type CandidateFilters } from "@/actions/candidates";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { ExportButton } from "@/components/export-button";

export const metadata: Metadata = { title: "Candidates" };
import { exportCandidates } from "@/actions/export";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar, FilterSelect, SortSelect } from "@/components/ui/search-filters";
import { CandidateListWithBulk } from "@/components/candidate-list-bulk";
import type { CandidateStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters: CandidateFilters = {
    search: params.search,
    status: (params.status as CandidateStatus) || "",
    source: params.source,
    sort: params.sort,
  };

  const candidates = await getCandidates(filters);
  const hasFilters = !!(params.search || params.status || params.source);

  return (
    <>
      <PageHeader
        title="Candidates"
        description="Manage your candidate pipeline"
        action={<div className="flex items-center gap-2"><ExportButton label="Export" fileName="candidates.csv" exportAction={exportCandidates} /><LinkButton href="/candidates/new">Add Candidate</LinkButton></div>}
      />

      <Suspense>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar placeholder="Search by name, email, location..." />
          </div>
          <FilterSelect
            name="status"
            placeholder="All Statuses"
            options={[
              { value: "new", label: "New" },
              { value: "contacted", label: "Contacted" },
              { value: "interviewing", label: "Interviewing" },
              { value: "placed", label: "Placed" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
          <FilterSelect
            name="source"
            placeholder="All Sources"
            options={[
              { value: "referral", label: "Referral" },
              { value: "job_board", label: "Job Board" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "walk_in", label: "Walk-in" },
              { value: "website", label: "Website" },
              { value: "other", label: "Other" },
            ]}
          />
          <SortSelect
            options={[
              { value: "created_at", label: "Newest" },
              { value: "full_name", label: "Name A-Z" },
            ]}
          />
        </div>
      </Suspense>

      {candidates.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No candidates match your filters" : "No candidates yet"}
          description={hasFilters ? "Try adjusting your search or filters." : "Add your first candidate to start building your pipeline."}
          action={!hasFilters ? <LinkButton href="/candidates/new">Add Candidate</LinkButton> : undefined}
        />
      ) : (
        <CandidateListWithBulk candidates={candidates} />
      )}
    </>
  );
}
