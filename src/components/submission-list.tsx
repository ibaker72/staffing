"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SubmissionStatus } from "@/types/database";

const statusFlow: SubmissionStatus[] = [
  "internal_review",
  "submitted",
  "client_review",
  "interview",
  "offer",
  "hired",
  "rejected",
];

const statusLabels: Record<SubmissionStatus, string> = {
  internal_review: "Internal Review",
  submitted: "Submitted",
  client_review: "Client Review",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

interface Submission {
  id: string;
  status: SubmissionStatus;
  created_at: string;
  internal_notes: string | null;
  client_feedback: string | null;
  candidate: { id: string; full_name: string; email: string | null; location: string | null } | null;
}

export function SubmissionList({
  submissions,
  onStatusChange,
}: {
  submissions: Submission[];
  onStatusChange: (id: string, status: SubmissionStatus) => Promise<void>;
}) {
  if (submissions.length === 0) {
    return <p className="text-sm text-zinc-500">No candidates submitted yet.</p>;
  }

  return (
    <div className="divide-y divide-zinc-100">
      {submissions.map((sub) => (
        <SubmissionRow key={sub.id} submission={sub} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
}

function SubmissionRow({
  submission,
  onStatusChange,
}: {
  submission: Submission;
  onStatusChange: (id: string, status: SubmissionStatus) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: SubmissionStatus) {
    startTransition(async () => {
      await onStatusChange(submission.id, status);
    });
  }

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/candidates/${submission.candidate?.id}`}
            className="text-sm font-medium text-zinc-900 hover:underline"
          >
            {submission.candidate?.full_name ?? "Unknown"}
          </Link>
          {submission.candidate?.location && (
            <p className="text-xs text-zinc-500">{submission.candidate.location}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SubmissionStatusBadge status={submission.status} />
          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            {open ? "Hide" : "Actions"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-2 pl-0">
          <div className="flex flex-wrap gap-1.5">
            {statusFlow.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={isPending || submission.status === s}
                className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors ${
                  submission.status === s
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                } disabled:opacity-50`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
          {submission.internal_notes && (
            <p className="mt-2 text-xs text-zinc-500">
              <span className="font-medium">Notes:</span> {submission.internal_notes}
            </p>
          )}
          {submission.client_feedback && (
            <p className="mt-1 text-xs text-zinc-500">
              <span className="font-medium">Client:</span> {submission.client_feedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function SubmissionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: string }> = {
    internal_review: { label: "Internal Review", variant: "default" },
    submitted: { label: "Submitted", variant: "info" },
    client_review: { label: "Client Review", variant: "purple" },
    interview: { label: "Interview", variant: "warning" },
    offer: { label: "Offer", variant: "success" },
    hired: { label: "Hired", variant: "success" },
    rejected: { label: "Rejected", variant: "danger" },
  };

  const entry = map[status] ?? { label: status, variant: "default" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[entry.variant] ?? variantClasses.default}`}
    >
      {entry.label}
    </span>
  );
}

const variantClasses: Record<string, string> = {
  default: "bg-zinc-100 text-zinc-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
};
