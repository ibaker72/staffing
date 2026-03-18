import { validatePortalToken, getPortalJobs, getPortalSubmissions, updatePortalSubmissionFeedback } from "@/actions/portal";
import { Card } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/submission-list";
import { StatusBadge } from "@/components/ui/badge";
import { PortalFeedbackForm } from "@/components/portal-feedback-form";
import { revalidatePath } from "next/cache";
import type { SubmissionStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const employmentLabels: Record<string, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  temp_to_hire: "Temp-to-Hire",
};

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Card className="max-w-md w-full text-center">
          <h1 className="text-lg font-bold text-zinc-900 mb-2">Client Portal</h1>
          <p className="text-sm text-zinc-500">A valid portal link is required to access this page.</p>
        </Card>
      </div>
    );
  }

  const session = await validatePortalToken(token);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Card className="max-w-md w-full text-center">
          <h1 className="text-lg font-bold text-zinc-900 mb-2">Invalid or Expired Link</h1>
          <p className="text-sm text-zinc-500">This portal link is no longer valid. Please contact your recruiter for a new link.</p>
        </Card>
      </div>
    );
  }

  const [jobs, submissions] = await Promise.all([
    getPortalJobs(session.companyId),
    getPortalSubmissions(session.companyId),
  ]);

  async function handleFeedback(submissionId: string, status: SubmissionStatus, feedback: string | null) {
    "use server";
    await updatePortalSubmissionFeedback(submissionId, session!.companyId, status, feedback);
    revalidatePath("/portal");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="text-lg font-bold text-zinc-900">{session.companyName}</h1>
          <p className="text-sm text-zinc-500">Client Portal</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Open Positions ({jobs.length})</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-zinc-500">No open positions currently.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {jobs.map((job) => (
                <div key={job.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{job.title}</p>
                      <p className="text-xs text-zinc-500">
                        {job.location ?? "Remote"}
                        {" · "}
                        {employmentLabels[job.employment_type] ?? job.employment_type}
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">
            Submitted Candidates ({submissions.length})
          </h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-zinc-500">No candidates have been submitted yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {submissions.map((sub) => {
                const candidate = sub.candidate as { full_name: string; location: string | null } | null;
                const job = sub.job as { id: string; title: string } | null;
                return (
                  <div key={sub.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{candidate?.full_name ?? "Unknown"}</p>
                        <p className="text-xs text-zinc-500">
                          For: {job?.title ?? "Unknown"} · {candidate?.location ?? "—"}
                        </p>
                      </div>
                      <SubmissionStatusBadge status={sub.status} />
                    </div>
                    {sub.client_feedback && (
                      <p className="text-xs text-zinc-500 mb-2">
                        <span className="font-medium">Your feedback:</span> {sub.client_feedback}
                      </p>
                    )}
                    <PortalFeedbackForm
                      submissionId={sub.id}
                      currentStatus={sub.status as SubmissionStatus}
                      onSubmit={handleFeedback}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
