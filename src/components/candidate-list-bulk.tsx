"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { SelectableList } from "@/components/selectable-list";
import {
  bulkUpdateCandidateStatus,
  bulkUpdateCandidateOutreach,
  bulkDeleteCandidates,
} from "@/actions/bulk";
import type {
  Candidate,
  CandidateStatus,
  OutreachStatus,
} from "@/types/database";

interface CandidateListWithBulkProps {
  candidates: Candidate[];
}

export function CandidateListWithBulk({
  candidates,
}: CandidateListWithBulkProps) {
  return (
    <SelectableList
      items={candidates}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      renderItem={(candidate, isSelected, onToggle) => (
        <div key={candidate.id} className="relative">
          <div
            className="absolute top-4 left-4 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggle}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
          </div>
          <Link href={`/candidates/${candidate.id}`}>
            <Card
              className={`hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer pl-10 ${
                isSelected ? "ring-2 ring-zinc-900 border-zinc-900" : ""
              }`}
            >
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
                {candidate.source && (
                  <span className="capitalize">
                    {candidate.source.replace("_", " ")}
                  </span>
                )}
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
        </div>
      )}
      actions={(selectedIds, clearSelection, isPending, startTransition) => (
        <>
          <select
            disabled={isPending}
            defaultValue=""
            onChange={(e) => {
              const value = e.target.value as CandidateStatus;
              if (!value) return;
              startTransition(async () => {
                await bulkUpdateCandidateStatus(selectedIds, value);
                clearSelection();
              });
              e.target.value = "";
            }}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="">Update Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interviewing">Interviewing</option>
            <option value="placed">Placed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            disabled={isPending}
            defaultValue=""
            onChange={(e) => {
              const value = e.target.value as OutreachStatus;
              if (!value) return;
              startTransition(async () => {
                await bulkUpdateCandidateOutreach(selectedIds, value);
                clearSelection();
              });
              e.target.value = "";
            }}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="">Update Outreach</option>
            <option value="none">None</option>
            <option value="initial_contact">Initial Contact</option>
            <option value="follow_up">Follow Up</option>
            <option value="in_conversation">In Conversation</option>
            <option value="nurturing">Nurturing</option>
            <option value="closed">Closed</option>
          </select>

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (
                !confirm(
                  `Are you sure you want to delete ${selectedIds.length} candidate${selectedIds.length === 1 ? "" : "s"}?`
                )
              )
                return;
              startTransition(async () => {
                await bulkDeleteCandidates(selectedIds);
                clearSelection();
              });
            }}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </>
      )}
    />
  );
}
