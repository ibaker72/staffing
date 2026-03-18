import Link from "next/link";
import { Suspense } from "react";
import { getPlacements, type PlacementFilters } from "@/actions/placements";
import { getCompanies } from "@/actions/companies";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/search-filters";
import { PlacementStatusActions } from "./status-actions";
import type { PlacementStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function PlacementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters: PlacementFilters = {
    status: (params.status as PlacementStatus) || "",
    company_id: params.company_id,
  };

  const [placements, companies] = await Promise.all([
    getPlacements(filters),
    getCompanies(),
  ]);

  const hasFilters = !!(params.status || params.company_id);

  return (
    <>
      <PageHeader
        title="Placements"
        description="Track candidate placements and revenue"
        action={<LinkButton href="/placements/new">New Placement</LinkButton>}
      />

      <Suspense>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <FilterSelect
            name="status"
            placeholder="All Statuses"
            options={[
              { value: "pending", label: "Pending" },
              { value: "hired", label: "Hired" },
              { value: "paid", label: "Paid" },
            ]}
          />
          <FilterSelect
            name="company_id"
            placeholder="All Companies"
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
      </Suspense>

      {placements.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No placements match your filters" : "No placements yet"}
          description={hasFilters ? "Try adjusting your filters." : "Create a placement when you assign a candidate to a job."}
          action={!hasFilters ? <LinkButton href="/placements/new">New Placement</LinkButton> : undefined}
        />
      ) : (
        <div className="space-y-4">
          {placements.map((placement) => (
            <Card key={placement.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/candidates/${placement.candidate_id}`}
                      className="font-semibold text-zinc-900 hover:underline"
                    >
                      {placement.candidate?.full_name ?? "Unknown Candidate"}
                    </Link>
                    <StatusBadge status={placement.status} />
                  </div>
                  <p className="text-sm text-zinc-500">
                    <Link href={`/jobs/${placement.job_id}`} className="hover:underline">
                      {placement.job?.title ?? "Unknown Job"}
                    </Link>
                    {" at "}
                    <Link href={`/companies/${placement.company_id}`} className="hover:underline">
                      {placement.company?.name ?? "Unknown Company"}
                    </Link>
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {(Number(placement.placement_fee) || 0) > 0 && (
                      <span className="font-medium text-zinc-700">
                        Fee:{" "}
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(Number(placement.placement_fee) || 0)}
                      </span>
                    )}
                    {placement.start_date && (
                      <span className="text-zinc-500">
                        Start: {new Date(placement.start_date).toLocaleDateString()}
                      </span>
                    )}
                    {placement.hired_at && (
                      <span className="text-zinc-500">
                        Hired: {new Date(placement.hired_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {placement.notes && (
                    <p className="text-xs text-zinc-400 mt-1">{placement.notes}</p>
                  )}
                </div>
                <PlacementStatusActions
                  placementId={placement.id}
                  currentStatus={placement.status}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
