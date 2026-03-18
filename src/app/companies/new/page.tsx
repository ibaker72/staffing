import { createCompany } from "@/actions/companies";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/input";
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
          <Select
            label="Status"
            id="status"
            name="status"
            options={[
              { value: "lead", label: "Lead" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <Input label="Industry" id="industry" name="industry" placeholder="HVAC / Mechanical" />
          <Input label="Location" id="location" name="location" placeholder="Dallas, TX" />
          <Input label="Website" id="website" name="website" type="url" placeholder="https://example.com" />
          <div className="border-t border-zinc-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Primary Contact</h3>
            <div className="space-y-4">
              <Input label="Contact Name" id="contact_name" name="contact_name" placeholder="John Smith" />
              <Input label="Contact Email" id="contact_email" name="contact_email" type="email" placeholder="john@example.com" />
              <Input label="Contact Phone" id="contact_phone" name="contact_phone" type="tel" placeholder="+1 (555) 123-4567" />
            </div>
          </div>
          <Textarea label="Notes" id="notes" name="notes" placeholder="Internal notes about this company..." />
          <div className="flex gap-3 pt-2">
            <Button type="submit">Create Company</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
