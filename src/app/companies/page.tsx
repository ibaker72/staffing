import Link from "next/link";
import { getCompanies } from "@/actions/companies";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <>
      <PageHeader
        title="Companies"
        description="Manage your client companies"
        action={<LinkButton href="/companies/new">Add Company</LinkButton>}
      />

      {companies.length === 0 ? (
        <EmptyState
          title="No companies yet"
          description="Add your first client company to get started."
          action={<LinkButton href="/companies/new">Add Company</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <Card className="hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer">
                <h3 className="font-semibold text-zinc-900">{company.name}</h3>
                {company.industry && (
                  <p className="mt-1 text-sm text-zinc-500">{company.industry}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                  {company.location && <span>{company.location}</span>}
                  {company.contact_email && <span>{company.contact_email}</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
