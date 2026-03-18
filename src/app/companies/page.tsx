import Link from "next/link";
import { Suspense } from "react";
import { getCompanies, type CompanyFilters } from "@/actions/companies";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar, FilterSelect, SortSelect } from "@/components/ui/search-filters";
import type { CompanyStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters: CompanyFilters = {
    search: params.search,
    status: (params.status as CompanyStatus) || "",
    sort: params.sort,
  };

  const companies = await getCompanies(filters);
  const hasFilters = !!(params.search || params.status);

  return (
    <>
      <PageHeader
        title="Companies"
        description="Manage your client companies"
        action={<LinkButton href="/companies/new">Add Company</LinkButton>}
      />

      <Suspense>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar placeholder="Search companies..." />
          </div>
          <FilterSelect
            name="status"
            placeholder="All Statuses"
            options={[
              { value: "lead", label: "Lead" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <SortSelect
            options={[
              { value: "created_at", label: "Newest" },
              { value: "name", label: "Name A-Z" },
            ]}
          />
        </div>
      </Suspense>

      {companies.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No companies match your filters" : "No companies yet"}
          description={hasFilters ? "Try adjusting your search or filters." : "Add your first client company to get started."}
          action={!hasFilters ? <LinkButton href="/companies/new">Add Company</LinkButton> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <Card className="hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-zinc-900">{company.name}</h3>
                  <StatusBadge status={company.status} />
                </div>
                {company.industry && (
                  <p className="mt-1 text-sm text-zinc-500">{company.industry}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                  {company.location && <span>{company.location}</span>}
                  {company.contact_name && <span>{company.contact_name}</span>}
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
