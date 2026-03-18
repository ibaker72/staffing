import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { CandidateCreateForm } from "@/components/candidate-create-form";

export default function NewCandidatePage() {
  return (
    <>
      <PageHeader title="Add Candidate" description="Add a new candidate to your pipeline" />
      <Card className="max-w-xl">
        <CandidateCreateForm />
      </Card>
    </>
  );
}
