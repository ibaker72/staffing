import Link from "next/link";
import { getPlacements } from "@/actions/placements";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlacementStatusActions } from "./status-actions";

export default async function PlacementsPage() {
  const placements = await getPlacements();

  return (
    <>
      <PageHeader
        title="Placements"
        description="Track candidate placements and revenue"
        action={<LinkButton href="/placements/new">New Placement</LinkButton>}
      />

      {placements.length === 0 ? (
        <EmptyState
          title="No placements yet"
          description="Create a placement when you assign a candidate to a job."
          action={<LinkButton href="/placements/new">New Placement</LinkButton>}
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
                  {(Number(placement.placement_fee) || 0) > 0 && (
                    <p className="text-sm font-medium text-zinc-700">
                      Fee:{" "}
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(Number(placement.placement_fee) || 0)}
                    </p>
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
