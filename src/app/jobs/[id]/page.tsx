import { getJob, updateJobStatus } from "@/actions/jobs";
import { getPlacementsByJob } from "@/actions/placements";
import { getMatchesForJob } from "@/actions/matching";
import { getEntityActivity } from "@/actions/activity";
import { getSubmissionsForJob, createSubmission, updateSubmissionStatus } from "@/actions/submissions";
import { getTasks, createTask, completeTask } from "@/actions/tasks";
import { getCandidates } from "@/actions/candidates";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { NotFoundState } from "@/components/ui/error-state";
import { CandidateMatchList } from "@/components/match-list";
import { ActivityTimeline } from "@/components/activity-timeline";
import { SubmissionList } from "@/components/submission-list";
import { SubmitCandidateForm } from "@/components/submit-candidate-form";
import { TaskPanel } from "@/components/task-panel";
import { WorkflowFields } from "@/components/workflow-fields";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { SubmissionStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const employmentLabels: Record<string, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  temp_to_hire: "Temp-to-Hire",
};

const payTypeLabels: Record<string, string> = {
  salary: "Salary",
  hourly: "Hourly",
  per_diem: "Per Diem",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return (
      <>
        <PageHeader title="Job" />
        <NotFoundState
          title="Job not found"
          description="This job doesn't exist or couldn't be loaded."
          backHref="/jobs"
          backLabel="Back to Jobs"
        />
      </>
    );
  }

  const [placements, matches, activity, submissions, tasks, allCandidates] = await Promise.all([
    getPlacementsByJob(id),
    job.status === "open" ? getMatchesForJob(id) : Promise.resolve([]),
    getEntityActivity("job", id),
    getSubmissionsForJob(id),
    getTasks({ entityType: "job", entityId: id }),
    getCandidates(),
  ]);

  const currentStatus = job.status;

  async function toggleStatus() {
    "use server";
    const newStatus = currentStatus === "open" ? "closed" : "open";
    await updateJobStatus(id, newStatus);
    revalidatePath(`/jobs/${id}`);
  }

  async function handleSubmissionStatusChange(submissionId: string, status: SubmissionStatus) {
    "use server";
    await updateSubmissionStatus(submissionId, status);
    revalidatePath(`/jobs/${id}`);
  }

  async function handleCreateSubmission(formData: FormData) {
    "use server";
    await createSubmission(formData);
    revalidatePath(`/jobs/${id}`);
  }

  async function handleCreateTask(formData: FormData) {
    "use server";
    await createTask(formData);
    revalidatePath(`/jobs/${id}`);
  }

  async function handleCompleteTask(taskId: string) {
    "use server";
    await completeTask(taskId);
    revalidatePath(`/jobs/${id}`);
  }

  async function handleWorkflowSave(_id: string, assignedTo: string | null, nextAction: string | null, dueDate: string | null) {
    "use server";
    const supabase = await createClient();
    await supabase.from("jobs").update({ assigned_to: assignedTo, next_action: nextAction, due_date: dueDate }).eq("id", id);
    revalidatePath(`/jobs/${id}`);
  }

  // Filter out candidates already submitted for this job
  const submittedCandidateIds = new Set(submissions.map((s) => s.candidate_id));
  const availableCandidates = allCandidates.filter((c) => !submittedCandidateIds.has(c.id));

  return (
    <>
      <PageHeader
        title={job.title}
        description={job.company?.name ?? undefined}
        action={
          <div className="flex gap-2">
            <LinkButton
              href={`/placements/new?job_id=${id}&company_id=${job.company_id}`}
              variant="secondary"
            >
              Assign Candidate
            </LinkButton>
            <form action={toggleStatus}>
              <Button
                type="submit"
                variant={job.status === "open" ? "danger" : "primary"}
              >
                {job.status === "open" ? "Close Job" : "Reopen Job"}
              </Button>
            </form>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={job.status} />
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Priority</dt>
                <dd className="mt-1">
                  <PriorityBadge priority={job.priority} />
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Type</dt>
                <dd className="text-zinc-900">
                  {employmentLabels[job.employment_type] ?? job.employment_type}
                  {" · "}
                  {payTypeLabels[job.pay_type] ?? job.pay_type}
                </dd>
              </div>
              {job.location && (
                <div>
                  <dt className="text-zinc-500">Location</dt>
                  <dd className="text-zinc-900">{job.location}</dd>
                </div>
              )}
              {job.salary_range && (
                <div>
                  <dt className="text-zinc-500">Salary Range</dt>
                  <dd className="text-zinc-900">{job.salary_range}</dd>
                </div>
              )}
              <div>
                <dt className="text-zinc-500">Company</dt>
                <dd>
                  <Link href={`/companies/${job.company_id}`} className="text-zinc-900 underline">
                    {job.company?.name ?? "Unknown"}
                  </Link>
                </dd>
              </div>
              {job.assigned_to && (
                <div>
                  <dt className="text-zinc-500">Assigned To</dt>
                  <dd className="text-zinc-900">{job.assigned_to}</dd>
                </div>
              )}
              {job.next_action && (
                <div>
                  <dt className="text-zinc-500">Next Action</dt>
                  <dd className="text-zinc-900">{job.next_action}</dd>
                </div>
              )}
              {job.due_date && (
                <div>
                  <dt className="text-zinc-500">Due Date</dt>
                  <dd className={`text-zinc-900 ${new Date(job.due_date) < new Date(new Date().toDateString()) ? "text-red-600 font-medium" : ""}`}>
                    {new Date(job.due_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-zinc-500">Created</dt>
                <dd className="text-zinc-900">
                  {new Date(job.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Workflow</h3>
            <WorkflowFields
              entityId={id}
              assignedTo={job.assigned_to}
              nextAction={job.next_action}
              dueDate={job.due_date}
              onSave={handleWorkflowSave}
            />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Tasks</h3>
            <TaskPanel
              tasks={tasks}
              entityType="job"
              entityId={id}
              onComplete={handleCompleteTask}
              onCreate={handleCreateTask}
            />
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {job.description && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                Description
              </h3>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                {job.description}
              </p>
            </Card>
          )}

          {job.urgency_notes && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                Urgency Notes
              </h3>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                {job.urgency_notes}
              </p>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900">
                Candidate Submissions ({submissions.length})
              </h3>
              {job.status === "open" && (
                <SubmitCandidateForm
                  jobId={id}
                  candidates={availableCandidates.map((c) => ({ id: c.id, full_name: c.full_name }))}
                  onSubmit={handleCreateSubmission}
                />
              )}
            </div>
            <SubmissionList
              submissions={submissions}
              onStatusChange={handleSubmissionStatusChange}
            />
          </Card>

          {job.status === "open" && (
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">
                Top Candidate Matches
              </h3>
              <CandidateMatchList matches={matches} />
            </Card>
          )}

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">
              Assigned Candidates ({placements.length})
            </h3>
            {placements.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No candidates assigned to this job yet.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {placements.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <Link
                        href={`/candidates/${p.candidate_id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {p.candidate?.full_name ?? "Unknown Candidate"}
                      </Link>
                      {p.candidate?.email && (
                        <p className="text-xs text-zinc-500">{p.candidate.email}</p>
                      )}
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
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
