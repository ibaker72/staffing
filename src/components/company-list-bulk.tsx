"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { SelectableList } from "@/components/selectable-list";
import {
  bulkUpdateCompanyStatus,
  bulkUpdateCompanyOutreach,
  bulkDeleteCompanies,
} from "@/actions/bulk";
import type { Company, CompanyStatus, OutreachStatus } from "@/types/database";

interface CompanyListWithBulkProps {
  companies: Company[];
}

export function CompanyListWithBulk({ companies }: CompanyListWithBulkProps) {
  return (
    <SelectableList
      items={companies}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      renderItem={(company, isSelected, onToggle) => (
        <div key={company.id} className="relative">
          <div
            className="absolute top-4 left-4 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggle}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
          </div>
          <Link href={`/companies/${company.id}`}>
            <Card
              className={`hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer pl-10 ${
                isSelected ? "ring-2 ring-zinc-900 border-zinc-900" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-zinc-900">{company.name}</h3>
                <StatusBadge status={company.status} />
              </div>
              {company.industry && (
                <p className="mt-1 text-sm text-zinc-500">
                  {company.industry}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                {company.location && <span>{company.location}</span>}
                {company.contact_name && <span>{company.contact_name}</span>}
                {company.contact_email && <span>{company.contact_email}</span>}
              </div>
            </Card>
          </Link>
        </div>
      )}
      actions={(selectedIds, clearSelection, isPending, startTransition) => (
        <>
          <select
            disabled={isPending}
            defaultValue=""
            onChange={(e) => {
              const value = e.target.value as CompanyStatus;
              if (!value) return;
              startTransition(async () => {
                await bulkUpdateCompanyStatus(selectedIds, value);
                clearSelection();
              });
              e.target.value = "";
            }}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="">Update Status</option>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            disabled={isPending}
            defaultValue=""
            onChange={(e) => {
              const value = e.target.value as OutreachStatus;
              if (!value) return;
              startTransition(async () => {
                await bulkUpdateCompanyOutreach(selectedIds, value);
                clearSelection();
              });
              e.target.value = "";
            }}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="">Update Outreach</option>
            <option value="none">None</option>
            <option value="initial_contact">Initial Contact</option>
            <option value="follow_up">Follow Up</option>
            <option value="in_conversation">In Conversation</option>
            <option value="nurturing">Nurturing</option>
            <option value="closed">Closed</option>
          </select>

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (
                !confirm(
                  `Are you sure you want to delete ${selectedIds.length} compan${selectedIds.length === 1 ? "y" : "ies"}?`
                )
              )
                return;
              startTransition(async () => {
                await bulkDeleteCompanies(selectedIds);
                clearSelection();
              });
            }}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </>
      )}
    />
  );
}
