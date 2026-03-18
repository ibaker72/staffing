import { requireAuth } from "@/lib/auth";
import { getClientCompanyIds } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { SubmissionStatusBadge } from "@/components/submission-list";
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

export default async function ClientDashboard() {
  const user = await requireAuth();
  const companyIds = await getClientCompanyIds(user.id);

  if (companyIds.length === 0) {
    return (
      <Card className="text-center">
        <h2 className="text-lg font-bold text-zinc-900 mb-2">No Company Linked</h2>
        <p className="text-sm text-zinc-500">
          Your account is not linked to any company yet. Please contact your recruiter.
        </p>
      </Card>
    );
  }

  const supabase = await createClient();

  // Get companies
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .in("id", companyIds);

  // Get open jobs for client's companies
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, location, status, employment_type, created_at, company_id")
    .in("company_id", companyIds)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  // Get submissions for client's company jobs
  const { data: submissions } = await supabase
    .from("candidate_submissions")
    .select("id, status, client_feedback, created_at, candidate:candidates(full_name, location), job:jobs!inner(id, title, company_id)")
    .in("job.company_id", companyIds)
    .order("created_at", { ascending: false });

  async function handleFeedback(submissionId: string, status: SubmissionStatus, feedback: string | null) {
    "use server";
    const innerSupabase = await createClient();
    const updateData: Record<string, unknown> = { client_feedback: feedback };
    if (status === "client_review" || status === "interview" || status === "rejected") {
      updateData.status = status;
      if (status === "client_review") updateData.client_reviewed_at = new Date().toISOString();
      if (status === "interview") updateData.interview_at = new Date().toISOString();
      if (status === "rejected") updateData.decided_at = new Date().toISOString();
    }
    await innerSupabase
      .from("candidate_submissions")
      .update(updateData)
      .eq("id", submissionId);
    revalidatePath("/client");
  }

  const companyName = companies?.[0]?.name ?? "Your Company";

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-900">{companyName}</h2>
        <p className="text-sm text-zinc-500">Your open positions and submitted candidates</p>
      </div>

      <div className="space-y-6">
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">
            Open Positions ({jobs?.length ?? 0})
          </h3>
          {!jobs || jobs.length === 0 ? (
            <p className="text-sm text-zinc-500">No open positions currently.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {jobs.map((job) => (
                <div key={job.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{job.title}</p>
                      <p className="text-xs text-zinc-500">
                        {job.location ?? "Remote"} · {employmentLabels[job.employment_type] ?? job.employment_type}
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
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">
            Submitted Candidates ({submissions?.length ?? 0})
          </h3>
          {!submissions || submissions.length === 0 ? (
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
    </>
  );
}
