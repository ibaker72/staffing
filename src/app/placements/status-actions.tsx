"use client";

import { updatePlacementStatus } from "@/actions/placements";
import { Button } from "@/components/ui/button";
import type { PlacementStatus } from "@/types/database";

const transitions: Record<PlacementStatus, { label: string; next: PlacementStatus } | null> = {
  pending: { label: "Mark Hired", next: "hired" },
  hired: { label: "Mark Paid", next: "paid" },
  paid: null,
};

export function PlacementStatusActions({
  placementId,
  currentStatus,
}: {
  placementId: string;
  currentStatus: PlacementStatus;
}) {
  const transition = transitions[currentStatus];
  if (!transition) return null;

  return (
    <form
      action={async () => {
        await updatePlacementStatus(placementId, transition.next);
      }}
    >
      <Button type="submit" variant="secondary" className="text-xs">
        {transition.label}
      </Button>
    </form>
  );
}
