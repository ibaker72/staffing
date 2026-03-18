import { createPlacement } from "@/actions/placements";
import { getCandidates } from "@/actions/candidates";
import { getJobs } from "@/actions/jobs";
import { getCompanies } from "@/actions/companies";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function NewPlacementPage({
  searchParams,
}: {
  searchParams: Promise<{ job_id?: string; company_id?: string }>;
}) {
  const { job_id, company_id } = await searchParams;
  const [candidates, jobs, companies] = await Promise.all([
    getCandidates(),
    getJobs(),
    getCompanies(),
  ]);

  async function handleSubmit(formData: FormData) {
    "use server";
    await createPlacement(formData);
    redirect("/placements");
  }

  const hasDeps = candidates.length > 0 && jobs.length > 0 && companies.length > 0;

  return (
    <>
      <PageHeader
        title="New Placement"
        description="Assign a candidate to a job"
      />
      <Card className="max-w-xl">
        {!hasDeps ? (
          <div className="space-y-2 text-sm text-zinc-500">
            <p>You need at least one candidate, one job, and one company to create a placement.</p>
            <div className="flex gap-3 pt-2">
              {companies.length === 0 && (
                <a href="/companies/new" className="underline text-zinc-900">Add Company</a>
              )}
              {candidates.length === 0 && (
                <a href="/candidates/new" className="underline text-zinc-900">Add Candidate</a>
              )}
              {jobs.length === 0 && (
                <a href="/jobs/new" className="underline text-zinc-900">Add Job</a>
              )}
            </div>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <Select
              label="Candidate"
              id="candidate_id"
              name="candidate_id"
              required
              options={[
                { value: "", label: "Select a candidate" },
                ...candidates.map((c) => ({ value: c.id, label: c.full_name })),
              ]}
            />
            <Select
              label="Job"
              id="job_id"
              name="job_id"
              required
              defaultValue={job_id ?? ""}
              options={[
                { value: "", label: "Select a job" },
                ...jobs.map((j) => ({
                  value: j.id,
                  label: `${j.title} — ${j.company?.name ?? "Unknown"}`,
                })),
              ]}
            />
            <Select
              label="Company"
              id="company_id"
              name="company_id"
              required
              defaultValue={company_id ?? ""}
              options={[
                { value: "", label: "Select a company" },
                ...companies.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Input
              label="Placement Fee ($)"
              id="placement_fee"
              name="placement_fee"
              type="number"
              step="0.01"
              min="0"
              placeholder="15000.00"
            />
            <div className="flex gap-3 pt-2">
              <Button type="submit">Create Placement</Button>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
