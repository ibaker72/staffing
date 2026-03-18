"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

interface Candidate {
  id: string;
  full_name: string;
}

export function SubmitCandidateForm({
  jobId,
  candidates,
  onSubmit,
}: {
  jobId: string;
  candidates: Candidate[];
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="secondary" className="text-xs" onClick={() => setOpen(true)}>
        + Submit Candidate
      </Button>
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit(formData);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to submit candidate.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-lg border border-zinc-200 p-3">
      <input type="hidden" name="job_id" value={jobId} />
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1">Candidate</label>
        <select
          name="candidate_id"
          required
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          <option value="">Select a candidate…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1">Internal Notes</label>
        <textarea
          name="internal_notes"
          rows={2}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          placeholder="Why is this candidate a good fit?"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" className="text-xs" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit"}
        </Button>
        <Button type="button" variant="ghost" className="text-xs" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
