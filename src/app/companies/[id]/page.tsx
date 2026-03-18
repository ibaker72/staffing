import { getCompany } from "@/actions/companies";
import { getJobsByCompany } from "@/actions/jobs";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [company, jobs] = await Promise.all([
    getCompany(id),
    getJobsByCompany(id),
  ]);

  return (
    <>
      <PageHeader
        title={company.name}
        description={company.industry ?? undefined}
        action={<LinkButton href={`/jobs/new?company_id=${id}`}>Create Job</LinkButton>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Details</h3>
          <dl className="space-y-3 text-sm">
            {company.location && (
              <div>
                <dt className="text-zinc-500">Location</dt>
                <dd className="text-zinc-900">{company.location}</dd>
              </div>
            )}
            {company.website && (
              <div>
                <dt className="text-zinc-500">Website</dt>
                <dd>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-zinc-900 underline">
                    {company.website}
                  </a>
                </dd>
              </div>
            )}
            {company.contact_email && (
              <div>
                <dt className="text-zinc-500">Contact</dt>
                <dd className="text-zinc-900">{company.contact_email}</dd>
              </div>
            )}
            <div>
              <dt className="text-zinc-500">Added</dt>
              <dd className="text-zinc-900">
                {new Date(company.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">
            Jobs ({jobs.length})
          </h3>
          {jobs.length === 0 ? (
            <p className="text-sm text-zinc-500">No jobs created for this company yet.</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <a key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="hover:border-zinc-300 transition-colors cursor-pointer mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-zinc-900">{job.title}</h4>
                        <p className="text-sm text-zinc-500">
                          {job.location}{job.salary_range ? ` · ${job.salary_range}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
