import { Suspense } from "react";
import type { Metadata } from "next";
import { getCompanies, type CompanyFilters } from "@/actions/companies";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { ExportButton } from "@/components/export-button";

export const metadata: Metadata = { title: "Companies" };
import { exportCompanies } from "@/actions/export";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar, FilterSelect, SortSelect } from "@/components/ui/search-filters";
import { CompanyListWithBulk } from "@/components/company-list-bulk";
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
        action={<div className="flex items-center gap-2"><ExportButton label="Export" fileName="companies.csv" exportAction={exportCompanies} /><LinkButton href="/companies/new">Add Company</LinkButton></div>}
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
        <CompanyListWithBulk companies={companies} />
      )}
    </>
  );
}
