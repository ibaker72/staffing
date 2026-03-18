import { getCompany, updateCompanyStatus } from "@/actions/companies";
import { getJobsByCompany } from "@/actions/jobs";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { NotFoundState } from "@/components/ui/error-state";
import { revalidatePath } from "next/cache";
import type { CompanyStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const statusFlow: CompanyStatus[] = ["lead", "active", "inactive"];

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);

  if (!company) {
    return (
      <>
        <PageHeader title="Company" />
        <NotFoundState
          title="Company not found"
          description="This company doesn't exist or couldn't be loaded."
          backHref="/companies"
          backLabel="Back to Companies"
        />
      </>
    );
  }

  const jobs = await getJobsByCompany(id);

  async function changeStatus(formData: FormData) {
    "use server";
    const status = formData.get("status") as CompanyStatus;
    await updateCompanyStatus(id, status);
    revalidatePath(`/companies/${id}`);
  }

  return (
    <>
      <PageHeader
        title={company.name}
        description={company.industry ?? undefined}
        action={<LinkButton href={`/jobs/new?company_id=${id}`}>Create Job</LinkButton>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900">Details</h3>
              <StatusBadge status={company.status} />
            </div>
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
              {company.contact_name && (
                <div>
                  <dt className="text-zinc-500">Contact</dt>
                  <dd className="text-zinc-900">{company.contact_name}</dd>
                </div>
              )}
              {company.contact_email && (
                <div>
                  <dt className="text-zinc-500">Email</dt>
                  <dd className="text-zinc-900">{company.contact_email}</dd>
                </div>
              )}
              {company.contact_phone && (
                <div>
                  <dt className="text-zinc-500">Phone</dt>
                  <dd className="text-zinc-900">{company.contact_phone}</dd>
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

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {statusFlow.map((s) => (
                <form key={s} action={changeStatus}>
                  <input type="hidden" name="status" value={s} />
                  <Button
                    type="submit"
                    variant={company.status === s ? "primary" : "secondary"}
                    className="capitalize text-xs"
                  >
                    {s}
                  </Button>
                </form>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {company.notes && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">Notes</h3>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">{company.notes}</p>
            </Card>
          )}

          <Card>
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
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge priority={job.priority} />
                          <StatusBadge status={job.status} />
                        </div>
                      </div>
                    </Card>
                  </a>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
