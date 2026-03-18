"use client";

import { useState, useTransition } from "react";
import { runAutomations } from "@/actions/automation";

export function RunAutomationsButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await runAutomations();
        const parts: string[] = [];
        if (res.followUpTasks > 0)
          parts.push(`${res.followUpTasks} follow-up task${res.followUpTasks !== 1 ? "s" : ""}`);
        if (res.staleSubmissionReminders > 0)
          parts.push(
            `${res.staleSubmissionReminders} submission reminder${res.staleSubmissionReminders !== 1 ? "s" : ""}`
          );
        if (res.staleJobFlags > 0)
          parts.push(`${res.staleJobFlags} stale job${res.staleJobFlags !== 1 ? "s" : ""} flagged`);
        if (res.staleCandidateFlags > 0)
          parts.push(
            `${res.staleCandidateFlags} stale candidate${res.staleCandidateFlags !== 1 ? "s" : ""} flagged`
          );

        if (parts.length === 0) {
          setResult("No new automation actions needed.");
        } else {
          setResult(`Created: ${parts.join(", ")}.`);
        }
      } catch {
        setResult("Failed to run automations. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin text-zinc-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Running...
          </>
        ) : (
          "Run Automations"
        )}
      </button>
      {result && (
        <p className="text-xs text-zinc-600 max-w-xs text-right">{result}</p>
      )}
    </div>
  );
}
