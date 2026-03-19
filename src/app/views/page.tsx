import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Saved Views" };
import { RunAutomationsButton } from "@/components/run-automations-button";
import {
  getOverdueTasksView,
  getCandidatesNeedingFollowUp,
  getOpenJobsNoSubmissions,
  getCompaniesInNurturing,
  getRecentPlacements,
  getAgingSubmissions,
} from "@/actions/views";

export const dynamic = "force-dynamic";

const tabs = [
  { key: "overdue-tasks", label: "Overdue Tasks" },
  { key: "follow-ups", label: "Follow-ups Due" },
  { key: "jobs-no-subs", label: "Jobs No Subs" },
  { key: "nurturing", label: "Nurturing" },
  { key: "recent-placements", label: "Recent Placements" },
  { key: "aging-submissions", label: "Aging Submissions" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function daysSince(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function AgingBadge({ days }: { days: number }) {
  let color = "bg-emerald-50 text-emerald-700";
  if (days > 7) {
    color = "bg-red-50 text-red-700";
  } else if (days >= 3) {
    color = "bg-amber-50 text-amber-700";
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {days}d
    </span>
  );
}

export default async function ViewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const activeTab = (params.view as TabKey) || "overdue-tasks";

  return (
    <>
      <PageHeader
        title="Smart Views"
        description="Predefined views to surface actionable data"
        action={<RunAutomationsButton />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/views?view=${tab.key}`}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
              activeTab === tab.key
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card>
        {activeTab === "overdue-tasks" && <OverdueTasksView />}
        {activeTab === "follow-ups" && <FollowUpsView />}
        {activeTab === "jobs-no-subs" && <JobsNoSubsView />}
        {activeTab === "nurturing" && <NurturingView />}
        {activeTab === "recent-placements" && <RecentPlacementsView />}
        {activeTab === "aging-submissions" && <AgingSubmissionsView />}
      </Card>
    </>
  );
}

async function OverdueTasksView() {
  const tasks = await getOverdueTasksView();

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No overdue tasks"
        description="All tasks are on track."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase text-zinc-500">
            <th className="pb-3 pr-4">Task</th>
            <th className="pb-3 pr-4">Priority</th>
            <th className="pb-3 pr-4">Due Date</th>
            <th className="pb-3">Linked Entity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {tasks.map((task) => (
            <tr key={task.id} className="group">
              <td className="py-3 pr-4 font-medium text-zinc-900">
                {task.title}
              </td>
              <td className="py-3 pr-4">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="py-3 pr-4 text-red-600 text-xs">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString()
                  : "--"}
              </td>
              <td className="py-3">
                {task.entity_type && task.entity_id ? (
                  <Link
                    href={`/${task.entity_type === "company" ? "companies" : task.entity_type === "candidate" ? "candidates" : "jobs"}/${task.entity_id}`}
                    className="text-xs text-zinc-500 underline hover:text-zinc-700"
                  >
                    View {task.entity_type}
                  </Link>
                ) : (
                  <span className="text-xs text-zinc-400">--</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function FollowUpsView() {
  const candidates = await getCandidatesNeedingFollowUp();

  if (candidates.length === 0) {
    return (
      <EmptyState
        title="No follow-ups due"
        description="No candidates need follow-up today."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase text-zinc-500">
            <th className="pb-3 pr-4">Candidate</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Follow-up Date</th>
            <th className="pb-3 pr-4">Location</th>
            <th className="pb-3">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {candidates.map((c) => (
            <tr key={c.id} className="group">
              <td className="py-3 pr-4">
                <Link
                  href={`/candidates/${c.id}`}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  {c.full_name}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={c.status} />
              </td>
              <td className="py-3 pr-4 text-xs text-zinc-600">
                {c.follow_up_date
                  ? new Date(c.follow_up_date).toLocaleDateString()
                  : "--"}
              </td>
              <td className="py-3 pr-4 text-xs text-zinc-500">
                {c.location ?? "--"}
              </td>
              <td className="py-3 text-xs text-zinc-500">{c.email ?? "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function JobsNoSubsView() {
  const jobs = await getOpenJobsNoSubmissions();

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="All jobs have submissions"
        description="Every open job has at least one candidate submission."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase text-zinc-500">
            <th className="pb-3 pr-4">Job Title</th>
            <th className="pb-3 pr-4">Company</th>
            <th className="pb-3 pr-4">Priority</th>
            <th className="pb-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {jobs.map((job) => (
            <tr key={job.id} className="group">
              <td className="py-3 pr-4">
                <Link
                  href={`/jobs/${job.id}`}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  {job.title}
                </Link>
              </td>
              <td className="py-3 pr-4 text-xs text-zinc-500">
                {job.company?.name ?? "--"}
              </td>
              <td className="py-3 pr-4">
                <PriorityBadge priority={job.priority} />
              </td>
              <td className="py-3 text-xs text-zinc-500">
                {new Date(job.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function NurturingView() {
  const companies = await getCompaniesInNurturing();

  if (companies.length === 0) {
    return (
      <EmptyState
        title="No companies in nurturing"
        description="No companies currently have nurturing outreach status."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase text-zinc-500">
            <th className="pb-3 pr-4">Company</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Industry</th>
            <th className="pb-3 pr-4">Contact</th>
            <th className="pb-3">Last Contacted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {companies.map((company) => (
            <tr key={company.id} className="group">
              <td className="py-3 pr-4">
                <Link
                  href={`/companies/${company.id}`}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  {company.name}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={company.status} />
              </td>
              <td className="py-3 pr-4 text-xs text-zinc-500">
                {company.industry ?? "--"}
              </td>
              <td className="py-3 pr-4 text-xs text-zinc-500">
                {company.contact_name ?? "--"}
              </td>
              <td className="py-3 text-xs text-zinc-500">
                {company.last_contacted_at
                  ? new Date(company.last_contacted_at).toLocaleDateString()
                  : "Never"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function RecentPlacementsView() {
  const placements = await getRecentPlacements(20);

  if (placements.length === 0) {
    return (
      <EmptyState
        title="No placements yet"
        description="Placements will appear here once candidates are placed."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase text-zinc-500">
            <th className="pb-3 pr-4">Candidate</th>
            <th className="pb-3 pr-4">Job</th>
            <th className="pb-3 pr-4">Company</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Fee</th>
            <th className="pb-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {placements.map((p) => (
            <tr key={p.id} className="group">
              <td className="py-3 pr-4">
                <Link
                  href={`/candidates/${p.candidate_id}`}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  {p.candidate?.full_name ?? "Unknown"}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <Link
                  href={`/jobs/${p.job_id}`}
                  className="text-xs text-zinc-700 hover:underline"
                >
                  {p.job?.title ?? "Unknown"}
                </Link>
              </td>
              <td className="py-3 pr-4 text-xs text-zinc-500">
                {p.company?.name ?? "--"}
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={p.status} />
              </td>
              <td className="py-3 pr-4 text-xs text-zinc-700">
                ${p.placement_fee?.toLocaleString() ?? "0"}
              </td>
              <td className="py-3 text-xs text-zinc-500">
                {new Date(p.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function AgingSubmissionsView() {
  const submissions = await getAgingSubmissions();

  if (submissions.length === 0) {
    return (
      <EmptyState
        title="No active submissions"
        description="All submissions are in a terminal state."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase text-zinc-500">
            <th className="pb-3 pr-4">Candidate</th>
            <th className="pb-3 pr-4">Job</th>
            <th className="pb-3 pr-4">Company</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Age</th>
            <th className="pb-3">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {submissions.map((sub) => {
            const days = daysSince(sub.created_at);
            return (
              <tr key={sub.id} className="group">
                <td className="py-3 pr-4">
                  <Link
                    href={`/candidates/${sub.candidate_id}`}
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    {sub.candidate?.full_name ?? "Unknown"}
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/jobs/${sub.job_id}`}
                    className="text-xs text-zinc-700 hover:underline"
                  >
                    {sub.job?.title ?? "Unknown"}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-xs text-zinc-500">
                  {(sub.job as any)?.company?.name ?? "--"}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={sub.status} />
                </td>
                <td className="py-3 pr-4">
                  <AgingBadge days={days} />
                </td>
                <td className="py-3 text-xs text-zinc-500">
                  {sub.submitted_at
                    ? new Date(sub.submitted_at).toLocaleDateString()
                    : new Date(sub.created_at).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
