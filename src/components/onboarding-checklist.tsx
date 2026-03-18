import Link from "next/link";
import { Card } from "@/components/ui/card";

interface ChecklistItem {
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

export function OnboardingChecklist({
  companies,
  candidates,
  jobs,
}: {
  companies: number;
  candidates: number;
  jobs: number;
}) {
  const items: ChecklistItem[] = [
    { label: "Add your first company", done: companies > 0, href: "/companies", cta: "Add Company" },
    { label: "Add your first candidate", done: candidates > 0, href: "/candidates", cta: "Add Candidate" },
    { label: "Create your first job", done: jobs > 0, href: "/jobs", cta: "Create Job" },
  ];

  const completed = items.filter((i) => i.done).length;
  const allDone = completed === items.length;

  if (allDone) return null;

  const pct = Math.round((completed / items.length) * 100);

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Get Started</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Complete these steps to set up your staffing pipeline
          </p>
        </div>
        <span className="text-xs font-medium text-zinc-500">{completed}/{items.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-zinc-100 mb-4">
        <div
          className="h-1.5 rounded-full bg-zinc-900 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  item.done
                    ? "bg-zinc-900 border-zinc-900"
                    : "border-zinc-300"
                }`}
              >
                {item.done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${item.done ? "text-zinc-400 line-through" : "text-zinc-700"}`}>
                {item.label}
              </span>
            </div>
            {!item.done && (
              <Link
                href={item.href}
                className="text-xs font-medium text-zinc-900 hover:underline"
              >
                {item.cta} &rarr;
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
