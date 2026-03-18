import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { CompanyCreateForm } from "@/components/company-create-form";

export default function NewCompanyPage() {
  return (
    <>
      <PageHeader title="Add Company" description="Create a new client company" />
      <Card className="max-w-xl">
        <CompanyCreateForm />
      </Card>
    </>
  );
}
