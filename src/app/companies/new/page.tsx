import { createCompany } from "@/actions/companies";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewCompanyPage() {
  async function handleSubmit(formData: FormData) {
    "use server";
    await createCompany(formData);
    redirect("/companies");
  }

  return (
    <>
      <PageHeader title="Add Company" description="Create a new client company" />
      <Card className="max-w-xl">
        <form action={handleSubmit} className="space-y-4">
          <Input label="Company Name" id="name" name="name" required placeholder="Acme Corp" />
          <Input label="Website" id="website" name="website" type="url" placeholder="https://example.com" />
          <Input label="Industry" id="industry" name="industry" placeholder="Technology" />
          <Input label="Location" id="location" name="location" placeholder="New York, NY" />
          <Input label="Contact Email" id="contact_email" name="contact_email" type="email" placeholder="hr@example.com" />
          <div className="flex gap-3 pt-2">
            <Button type="submit">Create Company</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
