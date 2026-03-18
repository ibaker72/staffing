import { createJob } from "@/actions/jobs";
import { getCompanies } from "@/actions/companies";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
            <a href="/companies/new" className="underline text-zinc-900">Add a company</a>
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
            <Input label="Job Title" id="title" name="title" required placeholder="Senior Software Engineer" />
            <Textarea label="Description" id="description" name="description" placeholder="Role responsibilities and requirements..." />
            <Input label="Location" id="location" name="location" placeholder="Remote / New York, NY" />
            <Input label="Salary Range" id="salary_range" name="salary_range" placeholder="$120k - $160k" />
            <div className="flex gap-3 pt-2">
              <Button type="submit">Create Job</Button>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
