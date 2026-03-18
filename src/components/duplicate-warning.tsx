"use client";

import Link from "next/link";
import type { DuplicateWarning } from "@/actions/duplicates";

interface DuplicateWarningPanelProps {
  warnings: DuplicateWarning[];
  entityType: "company" | "candidate" | "job";
}

export function DuplicateWarningPanel({ warnings, entityType }: DuplicateWarningPanelProps) {
  if (warnings.length === 0) return null;

  const entityPath = entityType === "company" ? "companies" : entityType === "candidate" ? "candidates" : "jobs";

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-2">
        <svg className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div>
          <h4 className="text-sm font-medium text-amber-800">Possible duplicates found</h4>
          <ul className="mt-2 space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-700">
                Matches <span className="font-medium">{w.field}</span>:{" "}
                <Link href={`/${entityPath}/${w.matchId}`} className="underline hover:text-amber-900" target="_blank">
                  {w.matchName}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-600">
            You can still proceed if this is not a duplicate.
          </p>
        </div>
      </div>
    </div>
  );
}
