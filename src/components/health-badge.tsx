"use client";

import { useEffect, useState, useTransition } from "react";
import type { HealthScore, FieldCheck } from "@/actions/data-quality";

const gradeColors: Record<string, string> = {
  A: "bg-green-100 text-green-800 border-green-200",
  B: "bg-blue-100 text-blue-800 border-blue-200",
  C: "bg-amber-100 text-amber-800 border-amber-200",
  D: "bg-orange-100 text-orange-800 border-orange-200",
  F: "bg-red-100 text-red-800 border-red-200",
};

interface HealthBadgeProps {
  fetchHealth: () => Promise<HealthScore>;
  showDetails?: boolean;
}

export function HealthBadge({
  fetchHealth,
  showDetails = false,
}: HealthBadgeProps) {
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await fetchHealth();
        setHealth(result);
      } catch {
        // silently fail
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isPending || !health) {
    return (
      <span className="inline-block h-5 w-8 animate-pulse rounded bg-zinc-200" />
    );
  }

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={() => showDetails && setExpanded(!expanded)}
        className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${gradeColors[health.grade]} ${showDetails ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
        title={`Data quality: ${health.score}% (${health.grade})`}
      >
        {health.grade}
        <span className="font-normal">{health.score}%</span>
      </button>

      {expanded && showDetails && (
        <div className="mt-1 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm text-xs">
          <div className="mb-2 font-medium text-zinc-700">
            Data Completeness
          </div>
          <div className="space-y-1">
            {health.checks.map((check: FieldCheck) => (
              <div key={check.field} className="flex items-center gap-2">
                {check.present ? (
                  <span className="text-green-600">&#10003;</span>
                ) : (
                  <span
                    className={
                      check.severity === "critical"
                        ? "text-red-600"
                        : check.severity === "warning"
                          ? "text-amber-600"
                          : "text-zinc-400"
                    }
                  >
                    &#10007;
                  </span>
                )}
                <span
                  className={
                    check.present
                      ? "text-zinc-600"
                      : check.severity === "critical"
                        ? "text-red-700 font-medium"
                        : "text-zinc-500"
                  }
                >
                  {check.label}
                </span>
                {!check.present && check.severity === "critical" && (
                  <span className="rounded bg-red-100 px-1 py-0.5 text-[10px] text-red-700">
                    Required
                  </span>
                )}
              </div>
            ))}
          </div>
          {health.missingCritical > 0 && (
            <div className="mt-2 text-red-600 font-medium">
              {health.missingCritical} critical field
              {health.missingCritical > 1 ? "s" : ""} missing
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simpler inline version for list pages
export function HealthDot({
  score,
  grade,
}: {
  score: number;
  grade: string;
}) {
  const colors: Record<string, string> = {
    A: "bg-green-500",
    B: "bg-blue-500",
    C: "bg-amber-500",
    D: "bg-orange-500",
    F: "bg-red-500",
  };

  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${colors[grade] ?? "bg-zinc-300"}`}
      title={`Health: ${grade} (${score}%)`}
    />
  );
}
