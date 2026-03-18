import Link from "next/link";
import { Suspense } from "react";
import { getCandidates, type CandidateFilters } from "@/actions/candidates";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar, FilterSelect, SortSelect } from "@/components/ui/search-filters";
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
        action={<LinkButton href="/candidates/new">Add Candidate</LinkButton>}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <Link key={candidate.id} href={`/candidates/${candidate.id}`}>
              <Card className="hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-zinc-900">
                    {candidate.full_name}
                  </h3>
                  <StatusBadge status={candidate.status} />
                </div>
                {candidate.email && (
                  <p className="mt-1 text-sm text-zinc-500">{candidate.email}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                  {candidate.location && <span>{candidate.location}</span>}
                  {candidate.source && <span className="capitalize">{candidate.source.replace("_", " ")}</span>}
                  {candidate.years_experience != null && (
                    <span>{candidate.years_experience}yr exp</span>
                  )}
                </div>
                {(candidate.skills?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                    {candidate.skills.length > 4 && (
                      <Badge>+{candidate.skills.length - 4}</Badge>
                    )}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
