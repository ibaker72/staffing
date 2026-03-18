import Link from "next/link";
import { getJobs } from "@/actions/jobs";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Open roles across your client companies"
        action={<LinkButton href="/jobs/new">Create Job</LinkButton>}
      />

      {jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          description="Create your first job posting to start matching candidates."
          action={<LinkButton href="/jobs/new">Create Job</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-zinc-900">{job.title}</h3>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  {job.company?.name ?? "Unknown Company"}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                  {job.location && <span>{job.location}</span>}
                  {job.salary_range && <span>{job.salary_range}</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
