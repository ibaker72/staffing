import { createCandidate } from "@/actions/candidates";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewCandidatePage() {
  async function handleSubmit(formData: FormData) {
    "use server";
    await createCandidate(formData);
    redirect("/candidates");
  }

  return (
    <>
      <PageHeader title="Add Candidate" description="Add a new candidate to your pipeline" />
      <Card className="max-w-xl">
        <form action={handleSubmit} className="space-y-4">
          <Input label="Full Name" id="full_name" name="full_name" required placeholder="Jane Smith" />
          <Input label="Email" id="email" name="email" type="email" placeholder="jane@example.com" />
          <Input label="Phone" id="phone" name="phone" type="tel" placeholder="+1 (555) 123-4567" />
          <Input label="Location" id="location" name="location" placeholder="Dallas, TX" />
          <Select
            label="Source"
            id="source"
            name="source"
            options={[
              { value: "", label: "Select source" },
              { value: "referral", label: "Referral" },
              { value: "job_board", label: "Job Board" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "walk_in", label: "Walk-in" },
              { value: "website", label: "Website" },
              { value: "other", label: "Other" },
            ]}
          />
          <Input
            label="Skills"
            id="skills"
            name="skills"
            placeholder="HVAC Install, Brazing, EPA 608 (comma separated)"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Years Experience"
              id="years_experience"
              name="years_experience"
              type="number"
              min="0"
              placeholder="5"
            />
            <Input
              label="Desired Salary ($)"
              id="desired_salary"
              name="desired_salary"
              type="number"
              min="0"
              step="1000"
              placeholder="65000"
            />
          </div>
          <Input
            label="Resume URL"
            id="resume_url"
            name="resume_url"
            type="url"
            placeholder="https://... (or upload after creating)"
          />
          <Textarea label="Notes" id="notes" name="notes" placeholder="Any relevant notes about this candidate..." />
          <div className="flex gap-3 pt-2">
            <Button type="submit">Add Candidate</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
