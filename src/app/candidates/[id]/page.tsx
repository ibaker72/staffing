import { getCandidate, updateCandidateStatus, updateCandidateOutreach } from "@/actions/candidates";
import { getMatchesForCandidate } from "@/actions/matching";
import { getEntityActivity } from "@/actions/activity";
import { getSubmissionsForCandidate } from "@/actions/submissions";
import { getTasks, createTask, completeTask } from "@/actions/tasks";
import { HealthBadge } from "@/components/health-badge";
import { getCandidateHealth } from "@/actions/data-quality";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotFoundState } from "@/components/ui/error-state";
import { ResumeUpload } from "@/components/resume-upload";
import { OutreachPanel } from "@/components/outreach-panel";
import { JobMatchList } from "@/components/match-list";
import { ActivityTimeline } from "@/components/activity-timeline";
import { SubmissionStatusBadge } from "@/components/submission-list";
import { TaskPanel } from "@/components/task-panel";
import { WorkflowFields } from "@/components/workflow-fields";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { CandidateStatus, OutreachStatus } from "@/types/database";

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

  const isAvailable = candidate.status !== "placed" && candidate.status !== "rejected";

  const [matches, activity, submissions, tasks] = await Promise.all([
    isAvailable ? getMatchesForCandidate(id) : Promise.resolve([]),
    getEntityActivity("candidate", id),
    getSubmissionsForCandidate(id),
    getTasks({ entityType: "candidate", entityId: id }),
  ]);

  async function changeStatus(formData: FormData) {
    "use server";
    const status = formData.get("status") as CandidateStatus;
    await updateCandidateStatus(id, status);
    revalidatePath(`/candidates/${id}`);
  }

  async function handleOutreachUpdate(_id: string, outreachStatus: OutreachStatus, followUpDate: string | null) {
    "use server";
    await updateCandidateOutreach(id, outreachStatus, followUpDate);
    revalidatePath(`/candidates/${id}`);
  }

  async function handleCreateTask(formData: FormData) {
    "use server";
    await createTask(formData);
    revalidatePath(`/candidates/${id}`);
  }

  async function handleCompleteTask(taskId: string) {
    "use server";
    await completeTask(taskId);
    revalidatePath(`/candidates/${id}`);
  }

  async function handleWorkflowSave(_id: string, assignedTo: string | null, nextAction: string | null, dueDate: string | null) {
    "use server";
    const supabase = await createClient();
    await supabase.from("candidates").update({ assigned_to: assignedTo, next_action: nextAction, due_date: dueDate }).eq("id", id);
    revalidatePath(`/candidates/${id}`);
  }

  const skills = candidate.skills ?? [];
  const formatSalary = (val: number | null) =>
    val != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(val)
      : null;

  return (
    <>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <PageHeader
            title={candidate.full_name}
            description={candidate.location ?? undefined}
          />
        </div>
        <HealthBadge fetchHealth={() => getCandidateHealth(candidate.id)} showDetails={true} />
      </div>

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
              {candidate.assigned_to && (
                <div>
                  <dt className="text-zinc-500">Assigned To</dt>
                  <dd className="text-zinc-900">{candidate.assigned_to}</dd>
                </div>
              )}
              {candidate.next_action && (
                <div>
                  <dt className="text-zinc-500">Next Action</dt>
                  <dd className="text-zinc-900">{candidate.next_action}</dd>
                </div>
              )}
              {candidate.due_date && (
                <div>
                  <dt className="text-zinc-500">Due Date</dt>
                  <dd className={`${new Date(candidate.due_date) < new Date(new Date().toDateString()) ? "text-red-600 font-medium" : "text-zinc-900"}`}>
                    {new Date(candidate.due_date).toLocaleDateString()}
                  </dd>
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

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Outreach</h3>
            <OutreachPanel
              entityId={id}
              currentStatus={candidate.outreach_status}
              currentFollowUp={candidate.follow_up_date}
              onUpdate={handleOutreachUpdate}
            />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Workflow</h3>
            <WorkflowFields
              entityId={id}
              assignedTo={candidate.assigned_to}
              nextAction={candidate.next_action}
              dueDate={candidate.due_date}
              onSave={handleWorkflowSave}
            />
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

          {submissions.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">
                Job Submissions ({submissions.length})
              </h3>
              <div className="divide-y divide-zinc-100">
                {submissions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link
                        href={`/jobs/${sub.job?.id}`}
                        className="text-sm font-medium text-zinc-900 hover:underline"
                      >
                        {sub.job?.title ?? "Unknown Job"}
                      </Link>
                      {sub.job?.company && (
                        <p className="text-xs text-zinc-500">{(sub.job.company as { name: string }).name}</p>
                      )}
                    </div>
                    <SubmissionStatusBadge status={sub.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {isAvailable && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Top Job Matches</h3>
              <JobMatchList matches={matches} />
            </Card>
          )}

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Tasks</h3>
            <TaskPanel
              tasks={tasks}
              entityType="candidate"
              entityId={id}
              onComplete={handleCompleteTask}
              onCreate={handleCreateTask}
            />
          </Card>

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

          {activity.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Activity</h3>
              <ActivityTimeline events={activity} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
