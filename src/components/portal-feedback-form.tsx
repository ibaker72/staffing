"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { SubmissionStatus } from "@/types/database";

const clientActions: { status: SubmissionStatus; label: string }[] = [
  { status: "client_review", label: "Mark Reviewed" },
  { status: "interview", label: "Request Interview" },
  { status: "rejected", label: "Pass" },
];

export function PortalFeedbackForm({
  submissionId,
  currentStatus,
  onSubmit,
}: {
  submissionId: string;
  currentStatus: SubmissionStatus;
  onSubmit: (submissionId: string, status: SubmissionStatus, feedback: string | null) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  // Only show actions if submission is in a state the client can act on
  const canAct = ["submitted", "client_review"].includes(currentStatus);

  if (!canAct) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-500 hover:text-zinc-700 underline"
      >
        Review & Respond
      </button>
    );
  }

  function handleAction(status: SubmissionStatus) {
    startTransition(async () => {
      await onSubmit(submissionId, status, feedback || null);
      setOpen(false);
      setFeedback("");
    });
  }

  return (
    <div className="mt-2 rounded-lg border border-zinc-200 p-3 space-y-2">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Add feedback (optional)…"
        rows={2}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
      <div className="flex flex-wrap gap-2">
        {clientActions.map((action) => (
          <Button
            key={action.status}
            variant={action.status === "rejected" ? "danger" : "secondary"}
            className="text-xs"
            onClick={() => handleAction(action.status)}
            disabled={isPending}
          >
            {action.label}
          </Button>
        ))}
        <Button variant="ghost" className="text-xs" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
