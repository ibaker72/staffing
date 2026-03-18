import { createJob } from "@/actions/jobs";
import { getCompanies } from "@/actions/companies";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ company_id?: string }>;
}) {
  const { company_id } = await searchParams;
  const companies = await getCompanies();

  async function handleSubmit(formData: FormData) {
    "use server";
    await createJob(formData);
    redirect("/jobs");
  }

  const companyOptions = [
    { value: "", label: "Select a company" },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <>
      <PageHeader title="Create Job" description="Create a new open role" />
      <Card className="max-w-xl">
        {companies.length === 0 ? (
          <p className="text-sm text-zinc-500">
            You need to add at least one company before creating a job.{" "}
            <Link href="/companies/new" className="underline text-zinc-900">
              Add a company
            </Link>
          </p>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <Select
              label="Company"
              id="company_id"
              name="company_id"
              options={companyOptions}
              required
              defaultValue={company_id ?? ""}
            />
            <Input label="Job Title" id="title" name="title" required placeholder="HVAC Service Technician" />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Priority"
                id="priority"
                name="priority"
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
                defaultValue="medium"
              />
              <Select
                label="Employment Type"
                id="employment_type"
                name="employment_type"
                options={[
                  { value: "full_time", label: "Full-Time" },
                  { value: "part_time", label: "Part-Time" },
                  { value: "contract", label: "Contract" },
                  { value: "temp_to_hire", label: "Temp-to-Hire" },
                ]}
                defaultValue="full_time"
              />
            </div>
            <Select
              label="Pay Type"
              id="pay_type"
              name="pay_type"
              options={[
                { value: "salary", label: "Salary" },
                { value: "hourly", label: "Hourly" },
                { value: "per_diem", label: "Per Diem" },
              ]}
              defaultValue="salary"
            />
            <Input label="Location" id="location" name="location" placeholder="Remote / Dallas, TX" />
            <Input label="Salary Range" id="salary_range" name="salary_range" placeholder="$55k - $75k" />
            <Textarea label="Description" id="description" name="description" placeholder="Role responsibilities and requirements..." />
            <Textarea label="Urgency Notes" id="urgency_notes" name="urgency_notes" placeholder="Any time-sensitive details..." />
            <div className="flex gap-3 pt-2">
              <Button type="submit">Create Job</Button>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
