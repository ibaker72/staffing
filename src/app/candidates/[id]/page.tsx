import { getCandidate, updateCandidateStatus } from "@/actions/candidates";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotFoundState } from "@/components/ui/error-state";
import { ResumeUpload } from "@/components/resume-upload";
import { revalidatePath } from "next/cache";
import type { CandidateStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const statusFlow: CandidateStatus[] = ["new", "contacted", "interviewing", "placed", "rejected"];

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCandidate(id);

  if (!candidate) {
    return (
      <>
        <PageHeader title="Candidate" />
        <NotFoundState
          title="Candidate not found"
          description="This candidate doesn't exist or couldn't be loaded."
          backHref="/candidates"
          backLabel="Back to Candidates"
        />
      </>
    );
  }

  async function changeStatus(formData: FormData) {
    "use server";
    const status = formData.get("status") as CandidateStatus;
    await updateCandidateStatus(id, status);
    revalidatePath(`/candidates/${id}`);
  }

  const skills = candidate.skills ?? [];
  const formatSalary = (val: number | null) =>
    val != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(val)
      : null;

  return (
    <>
      <PageHeader
        title={candidate.full_name}
        description={candidate.location ?? undefined}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={candidate.status} />
                </dd>
              </div>
              {candidate.email && (
                <div>
                  <dt className="text-zinc-500">Email</dt>
                  <dd className="text-zinc-900">{candidate.email}</dd>
                </div>
              )}
              {candidate.phone && (
                <div>
                  <dt className="text-zinc-500">Phone</dt>
                  <dd className="text-zinc-900">{candidate.phone}</dd>
                </div>
              )}
              {candidate.source && (
                <div>
                  <dt className="text-zinc-500">Source</dt>
                  <dd className="text-zinc-900 capitalize">{candidate.source.replace("_", " ")}</dd>
                </div>
              )}
              {candidate.years_experience != null && (
                <div>
                  <dt className="text-zinc-500">Experience</dt>
                  <dd className="text-zinc-900">{candidate.years_experience} years</dd>
                </div>
              )}
              {candidate.desired_salary != null && (
                <div>
                  <dt className="text-zinc-500">Desired Salary</dt>
                  <dd className="text-zinc-900">{formatSalary(candidate.desired_salary)}</dd>
                </div>
              )}
              {candidate.last_contacted_at && (
                <div>
                  <dt className="text-zinc-500">Last Contacted</dt>
                  <dd className="text-zinc-900">
                    {new Date(candidate.last_contacted_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-zinc-500">Added</dt>
                <dd className="text-zinc-900">
                  {new Date(candidate.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {skills.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Resume</h3>
            <ResumeUpload candidateId={id} currentUrl={candidate.resume_url} />
          </Card>

          {candidate.notes && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">Notes</h3>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">{candidate.notes}</p>
            </Card>
          )}

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">
              Update Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {statusFlow.map((s) => (
                <form key={s} action={changeStatus}>
                  <input type="hidden" name="status" value={s} />
                  <Button
                    type="submit"
                    variant={candidate.status === s ? "primary" : "secondary"}
                    className="capitalize text-xs"
                  >
                    {s}
                  </Button>
                </form>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
