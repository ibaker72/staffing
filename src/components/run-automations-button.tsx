"use client";

import { useState, useTransition } from "react";
import { runAutomations, type AutomationRunResult } from "@/actions/automation";

export function RunAutomationsButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AutomationRunResult | null>(null);
  const [dryRun, setDryRun] = useState(true);

  function handleRun() {
    startTransition(async () => {
      const res = await runAutomations(dryRun);
      setResult(res);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
          </svg>
          {isPending ? "Running..." : dryRun ? "Preview (Dry Run)" : "Run Automations"}
        </button>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => { setDryRun(e.target.checked); setResult(null); }}
            className="rounded border-zinc-300"
          />
          Dry run (preview only)
        </label>
      </div>

      {result && (
        <div className={`rounded-lg border p-4 text-sm ${result.dryRun ? "border-blue-200 bg-blue-50" : "border-green-200 bg-green-50"}`}>
          <div className="mb-3 flex items-center gap-2">
            {result.dryRun ? (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">DRY RUN</span>
            ) : (
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">EXECUTED</span>
            )}
            <span className="text-zinc-600">
              Found {result.totalFound} items{!result.dryRun && `, created ${result.totalCreated} tasks`}
            </span>
          </div>

          <div className="space-y-3">
            {result.rules.map((rule) => (
              <div key={rule.ruleName} className="rounded border border-zinc-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-zinc-800">{rule.ruleDescription}</div>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${rule.found > 0 ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500"}`}>
                    {rule.found} found
                  </span>
                </div>

                {rule.items.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {rule.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-600">
                        <span className="mt-0.5 text-zinc-400">&bull;</span>
                        <div>
                          <span className="font-medium text-zinc-700">{item.entityName}</span>
                          <span className="ml-1 text-zinc-400">({item.entityType})</span>
                          <span className="ml-1">&mdash; {item.reason}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {result.dryRun && result.totalFound > 0 && (
            <div className="mt-3 text-xs text-blue-600">
              Switch off dry run and run again to create these tasks.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
