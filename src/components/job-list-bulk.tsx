"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { SelectableList } from "@/components/selectable-list";
import { bulkUpdateJobStatus, bulkDeleteJobs } from "@/actions/bulk";
import type { JobStatus } from "@/types/database";
import type { JobWithCompany } from "@/actions/jobs";

const employmentLabels: Record<string, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  temp_to_hire: "Temp-to-Hire",
};

interface JobListWithBulkProps {
  jobs: JobWithCompany[];
}

export function JobListWithBulk({ jobs }: JobListWithBulkProps) {
  return (
    <SelectableList
      items={jobs}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      renderItem={(job, isSelected, onToggle) => (
        <div key={job.id} className="relative">
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
          <Link href={`/jobs/${job.id}`}>
            <Card
              className={`hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer pl-10 ${
                isSelected ? "ring-2 ring-zinc-900 border-zinc-900" : ""
              }`}
            >
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
                <span>
                  {employmentLabels[job.employment_type] ?? job.employment_type}
                </span>
              </div>
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
              const value = e.target.value as JobStatus;
              if (!value) return;
              startTransition(async () => {
                await bulkUpdateJobStatus(selectedIds, value);
                clearSelection();
              });
              e.target.value = "";
            }}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="">Update Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (
                !confirm(
                  `Are you sure you want to delete ${selectedIds.length} job${selectedIds.length === 1 ? "" : "s"}?`
                )
              )
                return;
              startTransition(async () => {
                await bulkDeleteJobs(selectedIds);
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
