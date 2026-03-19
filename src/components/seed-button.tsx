"use client";

import { useState, useTransition } from "react";
import { seedDemoData, resetDemoData } from "@/actions/admin";

export function SeedButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    companies: number;
    candidates: number;
    jobs: number;
    tasks: number;
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleSeed() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    startTransition(async () => {
      const res = await seedDemoData();
      setResult(res);
      setConfirmed(false);
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 text-amber-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">
              Seed Demo Data
            </p>
            <p className="mt-1 text-xs text-amber-700">
              This will insert sample companies, candidates, jobs, and tasks
              into your database. Existing data will not be modified or deleted.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSeed}
        disabled={isPending}
        className={`rounded-lg px-4 py-2 text-sm font-medium ${
          confirmed
            ? "bg-amber-600 text-white hover:bg-amber-700"
            : "bg-zinc-900 text-white hover:bg-zinc-800"
        } disabled:opacity-50`}
      >
        {isPending
          ? "Seeding..."
          : confirmed
            ? "Click again to confirm"
            : "Insert Demo Data"}
      </button>

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Seeded: {result.companies} companies, {result.candidates} candidates,{" "}
          {result.jobs} jobs, {result.tasks} tasks
        </div>
      )}
    </div>
  );
}

export function ResetButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    deleted: {
      companies: number;
      candidates: number;
      jobs: number;
      tasks: number;
      placements: number;
      submissions: number;
    };
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleReset() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    startTransition(async () => {
      const res = await resetDemoData();
      setResult(res);
      setConfirmed(false);
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 text-red-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">
              Reset All Data
            </p>
            <p className="mt-1 text-xs text-red-700">
              This will permanently delete all companies, candidates, jobs, placements, submissions, and tasks.
              User accounts and audit logs are preserved. This cannot be undone.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleReset}
        disabled={isPending}
        className={`rounded-lg px-4 py-2 text-sm font-medium ${
          confirmed
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200"
        } disabled:opacity-50`}
      >
        {isPending
          ? "Resetting..."
          : confirmed
            ? "Click again to confirm deletion"
            : "Reset All Data"}
      </button>

      {result && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
          Deleted: {result.deleted.companies} companies, {result.deleted.candidates} candidates,{" "}
          {result.deleted.jobs} jobs, {result.deleted.placements} placements,{" "}
          {result.deleted.submissions} submissions, {result.deleted.tasks} tasks
        </div>
      )}
    </div>
  );
}
