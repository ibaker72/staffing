import { createCandidate } from "@/actions/candidates";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
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
          <Input label="Location" id="location" name="location" placeholder="San Francisco, CA" />
          <Input
            label="Skills"
            id="skills"
            name="skills"
            placeholder="React, TypeScript, Node.js (comma separated)"
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
