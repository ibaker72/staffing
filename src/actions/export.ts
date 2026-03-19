"use server";

import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";

function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return "";
      const str = String(v);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(",");
}

function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [toCsvRow(headers), ...rows.map(toCsvRow)];
  return lines.join("\n");
}

// ── CSV Templates ──

export async function getCompanyTemplate(): Promise<string> {
  return buildCsv(
    ["name", "industry", "location", "website", "contact_name", "contact_email", "contact_phone", "status", "notes"],
    [
      ["Acme Corp", "Technology", "San Francisco, CA", "https://acme.com", "Jane Doe", "jane@acme.com", "555-0100", "lead", "Met at conference"],
      ["Global Staffing Inc", "Staffing", "New York, NY", "https://globalstaffing.com", "John Smith", "john@gs.com", "555-0200", "active", ""],
    ]
  );
}

export async function getCandidateTemplate(): Promise<string> {
  return buildCsv(
    ["first_name", "last_name", "email", "phone", "location", "title", "skills", "years_experience", "desired_salary", "status", "notes"],
    [
      ["Alice", "Johnson", "alice@email.com", "555-0300", "Austin, TX", "Senior Developer", "React,Node.js,TypeScript", "8", "150000", "new", "Strong frontend skills"],
      ["Bob", "Williams", "bob@email.com", "555-0400", "Remote", "Project Manager", "Agile,Scrum,JIRA", "12", "130000", "contacted", "PMP certified"],
    ]
  );
}

export async function getJobTemplate(): Promise<string> {
  return buildCsv(
    ["title", "company_name", "location", "description", "employment_type", "pay_type", "salary_min", "salary_max", "priority", "status"],
    [
      ["Senior React Developer", "Acme Corp", "San Francisco, CA", "Build modern web apps", "full_time", "salary", "140000", "180000", "high", "open"],
      ["Data Analyst", "Global Staffing Inc", "New York, NY", "Analyze staffing metrics", "contract", "hourly", "65", "85", "medium", "open"],
    ]
  );
}

// ── Data Exports ──

export async function exportCompanies(filters?: { status?: string }): Promise<string> {
  await requireInternal();
  const supabase = await createClient();

  let query = supabase
    .from("companies")
    .select("*")
    .order("name");

  if (filters?.status) {
    query = query.eq("status", filters.status as "lead" | "active" | "inactive");
  }

  const { data, error } = await query;
  if (error) throw new Error("Failed to export companies");

  const headers = ["id", "name", "industry", "location", "website", "contact_name", "contact_email", "contact_phone", "status", "outreach_status", "follow_up_date", "notes", "created_at"];
  const rows = (data ?? []).map((c: Record<string, unknown>) => headers.map((h) => c[h] as string | number | null));

  return buildCsv(headers, rows);
}

export async function exportCandidates(filters?: { status?: string }): Promise<string> {
  await requireInternal();
  const supabase = await createClient();

  let query = supabase
    .from("candidates")
    .select("*")
    .order("full_name");

  if (filters?.status) {
    query = query.eq("status", filters.status as "new" | "contacted" | "interviewing" | "placed" | "rejected");
  }

  const { data, error } = await query;
  if (error) throw new Error("Failed to export candidates");

  const headers = ["id", "first_name", "last_name", "email", "phone", "location", "title", "skills", "years_experience", "desired_salary", "status", "outreach_status", "follow_up_date", "notes", "created_at"];
  const rows = (data ?? []).map((c: Record<string, unknown>) => {
    return headers.map((h) => {
      const val = c[h];
      if (h === "skills" && Array.isArray(val)) return (val as string[]).join(", ");
      return val as string | number | null;
    });
  });

  return buildCsv(headers, rows);
}

export async function exportJobs(filters?: { status?: string }): Promise<string> {
  await requireInternal();
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("*, companies(name)")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status as "open" | "closed");
  }

  const { data, error } = await query;
  if (error) throw new Error("Failed to export jobs");

  const headers = ["id", "title", "company_name", "location", "description", "employment_type", "pay_type", "salary_min", "salary_max", "priority", "status", "created_at"];
  const rows = (data ?? []).map((j: Record<string, unknown>) => {
    const company = j.companies as Record<string, unknown> | null;
    return [
      j.id, j.title, company?.name ?? "", j.location, j.description,
      j.employment_type, j.pay_type, j.salary_min, j.salary_max,
      j.priority, j.status, j.created_at,
    ] as (string | number | null)[];
  });

  return buildCsv(headers, rows);
}

export async function exportViewData(viewName: string): Promise<string> {
  await requireInternal();
  const supabase = await createClient();
  const now = new Date().toISOString();

  switch (viewName) {
    case "overdue_tasks": {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .is("completed_at", null)
        .lt("due_date", now.split("T")[0])
        .order("due_date");

      const headers = ["id", "title", "entity_type", "entity_id", "priority", "due_date", "created_at"];
      const rows = (data ?? []).map((t: Record<string, unknown>) => headers.map((h) => t[h] as string | number | null));
      return buildCsv(headers, rows);
    }

    case "stale_jobs": {
      const { data } = await supabase
        .from("jobs")
        .select("*, companies(name)")
        .eq("status", "open")
        .order("created_at");

      const headers = ["id", "title", "company_name", "location", "priority", "status", "created_at"];
      const rows = (data ?? []).map((j: Record<string, unknown>) => {
        const company = j.companies as Record<string, unknown> | null;
        return [j.id, j.title, company?.name ?? "", j.location, j.priority, j.status, j.created_at] as (string | number | null)[];
      });
      return buildCsv(headers, rows);
    }

    default:
      throw new Error(`Unknown view: ${viewName}`);
  }
}
