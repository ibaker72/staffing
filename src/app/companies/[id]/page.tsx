import { getCompany, updateCompanyStatus, updateCompanyOutreach } from "@/actions/companies";
import { getJobsByCompany } from "@/actions/jobs";
import { getEntityActivity } from "@/actions/activity";
import { getTasks, createTask, completeTask } from "@/actions/tasks";
import { getActiveToken, generatePortalToken } from "@/actions/portal";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { NotFoundState } from "@/components/ui/error-state";
import { OutreachPanel } from "@/components/outreach-panel";
import { ActivityTimeline } from "@/components/activity-timeline";
import { TaskPanel } from "@/components/task-panel";
import { WorkflowFields } from "@/components/workflow-fields";
import { PortalTokenPanel } from "@/components/portal-token-panel";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CompanyStatus, OutreachStatus } from "@/types/database";

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

  const [jobs, activity, tasks, activeToken] = await Promise.all([
    getJobsByCompany(id),
    getEntityActivity("company", id),
    getTasks({ entityType: "company", entityId: id }),
    getActiveToken(id),
  ]);

  async function changeStatus(formData: FormData) {
    "use server";
    const status = formData.get("status") as CompanyStatus;
    await updateCompanyStatus(id, status);
    revalidatePath(`/companies/${id}`);
  }

  async function handleOutreachUpdate(_id: string, outreachStatus: OutreachStatus, followUpDate: string | null) {
    "use server";
    await updateCompanyOutreach(id, outreachStatus, followUpDate);
    revalidatePath(`/companies/${id}`);
  }

  async function handleCreateTask(formData: FormData) {
    "use server";
    await createTask(formData);
    revalidatePath(`/companies/${id}`);
  }

  async function handleCompleteTask(taskId: string) {
    "use server";
    await completeTask(taskId);
    revalidatePath(`/companies/${id}`);
  }

  async function handleWorkflowSave(_id: string, assignedTo: string | null, nextAction: string | null, dueDate: string | null) {
    "use server";
    const supabase = await createClient();
    await supabase.from("companies").update({ assigned_to: assignedTo, next_action: nextAction, due_date: dueDate }).eq("id", id);
    revalidatePath(`/companies/${id}`);
  }

  async function handleGenerateToken() {
    "use server";
    await generatePortalToken(id);
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
              {company.assigned_to && (
                <div>
                  <dt className="text-zinc-500">Assigned To</dt>
                  <dd className="text-zinc-900">{company.assigned_to}</dd>
                </div>
              )}
              {company.next_action && (
                <div>
                  <dt className="text-zinc-500">Next Action</dt>
                  <dd className="text-zinc-900">{company.next_action}</dd>
                </div>
              )}
              {company.due_date && (
                <div>
                  <dt className="text-zinc-500">Due Date</dt>
                  <dd className={`${new Date(company.due_date) < new Date(new Date().toDateString()) ? "text-red-600 font-medium" : "text-zinc-900"}`}>
                    {new Date(company.due_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {company.last_contacted_at && (
                <div>
                  <dt className="text-zinc-500">Last Contacted</dt>
                  <dd className="text-zinc-900">
                    {new Date(company.last_contacted_at).toLocaleDateString()}
                  </dd>
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

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Outreach</h3>
            <OutreachPanel
              entityId={id}
              currentStatus={company.outreach_status}
              currentFollowUp={company.follow_up_date}
              onUpdate={handleOutreachUpdate}
            />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Workflow</h3>
            <WorkflowFields
              entityId={id}
              assignedTo={company.assigned_to}
              nextAction={company.next_action}
              dueDate={company.due_date}
              onSave={handleWorkflowSave}
            />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Client Portal</h3>
            <PortalTokenPanel
              token={activeToken?.token ?? null}
              expiresAt={activeToken?.expires_at ?? null}
              onGenerate={handleGenerateToken}
            />
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
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Tasks</h3>
            <TaskPanel
              tasks={tasks}
              entityType="company"
              entityId={id}
              onComplete={handleCompleteTask}
              onCreate={handleCreateTask}
            />
          </Card>

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
