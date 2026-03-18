import Link from "next/link";
import { getCandidates } from "@/actions/candidates";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CandidatesPage() {
  const candidates = await getCandidates();

  return (
    <>
      <PageHeader
        title="Candidates"
        description="Manage your candidate pipeline"
        action={<LinkButton href="/candidates/new">Add Candidate</LinkButton>}
      />

      {candidates.length === 0 ? (
        <EmptyState
          title="No candidates yet"
          description="Add your first candidate to start building your pipeline."
          action={<LinkButton href="/candidates/new">Add Candidate</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <Link key={candidate.id} href={`/candidates/${candidate.id}`}>
              <Card className="hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-zinc-900">
                    {candidate.full_name}
                  </h3>
                  <StatusBadge status={candidate.status} />
                </div>
                {candidate.email && (
                  <p className="mt-1 text-sm text-zinc-500">{candidate.email}</p>
                )}
                {candidate.location && (
                  <p className="mt-0.5 text-xs text-zinc-400">{candidate.location}</p>
                )}
                {(candidate.skills?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                    {candidate.skills.length > 4 && (
                      <Badge>+{candidate.skills.length - 4}</Badge>
                    )}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
