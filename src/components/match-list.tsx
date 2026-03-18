import Link from "next/link";
import type { MatchScore } from "@/lib/matching";

function ScoreBar({ percentage }: { percentage: number }) {
  let color = "bg-zinc-300";
  if (percentage >= 60) color = "bg-emerald-500";
  else if (percentage >= 40) color = "bg-amber-500";
  else if (percentage >= 20) color = "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-zinc-600 w-8 text-right">{percentage}%</span>
    </div>
  );
}

export function CandidateMatchList({ matches }: { matches: MatchScore[] }) {
  if (matches.length === 0) {
    return <p className="text-sm text-zinc-500">No strong candidate matches found for this job.</p>;
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <div key={match.candidateId} className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/candidates/${match.candidateId}`}
              className="text-sm font-medium text-zinc-900 hover:underline"
            >
              {match.candidateName}
            </Link>
            <div className="mt-1">
              <ScoreBar percentage={match.percentage} />
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-400">
              {match.breakdown.skills > 0 && <span>Skills: {match.breakdown.skills}/40</span>}
              {match.breakdown.location > 0 && <span>Location: {match.breakdown.location}/20</span>}
              {match.breakdown.experience > 0 && <span>Exp: {match.breakdown.experience}/15</span>}
              {match.breakdown.salary > 0 && <span>Salary: {match.breakdown.salary}/15</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function JobMatchList({ matches }: { matches: MatchScore[] }) {
  if (matches.length === 0) {
    return <p className="text-sm text-zinc-500">No strong job matches found for this candidate.</p>;
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <div key={match.jobId} className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/jobs/${match.jobId}`}
              className="text-sm font-medium text-zinc-900 hover:underline"
            >
              {match.jobTitle}
            </Link>
            <div className="mt-1">
              <ScoreBar percentage={match.percentage} />
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-400">
              {match.breakdown.skills > 0 && <span>Skills: {match.breakdown.skills}/40</span>}
              {match.breakdown.location > 0 && <span>Location: {match.breakdown.location}/20</span>}
              {match.breakdown.experience > 0 && <span>Exp: {match.breakdown.experience}/15</span>}
              {match.breakdown.salary > 0 && <span>Salary: {match.breakdown.salary}/15</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
