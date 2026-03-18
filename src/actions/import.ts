"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";
import { writeAuditLog } from "./audit";

// ---------------------------------------------------------------------------
// Duplicate checks
// ---------------------------------------------------------------------------

export async function checkCompanyDuplicates(
  rows: { name: string; location?: string }[]
): Promise<{ row: number; match: string }[]> {
  const supabase = await createClient();
  const duplicates: { row: number; match: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const { name } = rows[i];
    if (!name) continue;

    const { data } = await supabase
      .from("companies")
      .select("name")
      .ilike("name", name.trim())
      .limit(1);

    if (data && data.length > 0) {
      duplicates.push({ row: i, match: `Company "${data[0].name}" already exists` });
    }
  }

  return duplicates;
}

export async function checkCandidateDuplicates(
  rows: { email?: string; phone?: string }[]
): Promise<{ row: number; match: string }[]> {
  const supabase = await createClient();
  const duplicates: { row: number; match: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const { email, phone } = rows[i];

    if (email && email.trim()) {
      const { data } = await supabase
        .from("candidates")
        .select("full_name, email")
        .ilike("email", email.trim())
        .limit(1);

      if (data && data.length > 0) {
        duplicates.push({
          row: i,
          match: `Email "${email.trim()}" matches candidate "${data[0].full_name}"`,
        });
        continue;
      }
    }

    if (phone && phone.trim()) {
      const { data } = await supabase
        .from("candidates")
        .select("full_name, phone")
        .ilike("phone", phone.trim())
        .limit(1);

      if (data && data.length > 0) {
        duplicates.push({
          row: i,
          match: `Phone "${phone.trim()}" matches candidate "${data[0].full_name}"`,
        });
      }
    }
  }

  return duplicates;
}

export async function checkJobDuplicates(
  rows: { company_name: string; title: string; location?: string }[]
): Promise<{ row: number; match: string }[]> {
  const supabase = await createClient();
  const duplicates: { row: number; match: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const { company_name, title } = rows[i];
    if (!company_name || !title) continue;

    // Look up company first
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name")
      .ilike("name", company_name.trim())
      .limit(1);

    if (!companies || companies.length === 0) continue;

    const { data: jobs } = await supabase
      .from("jobs")
      .select("title")
      .eq("company_id", companies[0].id)
      .ilike("title", title.trim())
      .limit(1);

    if (jobs && jobs.length > 0) {
      duplicates.push({
        row: i,
        match: `Job "${title}" at "${companies[0].name}" already exists`,
      });
    }
  }

  return duplicates;
}

// ---------------------------------------------------------------------------
// Bulk imports
// ---------------------------------------------------------------------------

export async function importCompanies(
  rows: Record<string, string>[]
): Promise<{ imported: number; errors: { row: number; message: string }[] }> {
  const supabase = await createClient();
  let imported = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = r.name?.trim();

    if (!name) {
      errors.push({ row: i, message: "Missing required field: name" });
      continue;
    }

    try {
      const { data, error } = await supabase
        .from("companies")
        .insert({
          name,
          website: r.website?.trim() || null,
          industry: r.industry?.trim() || null,
          location: r.location?.trim() || null,
          contact_email: r.contact_email?.trim() || null,
          contact_name: r.contact_name?.trim() || null,
          contact_phone: r.contact_phone?.trim() || null,
          notes: r.notes?.trim() || null,
          status: (r.status?.trim() as "lead" | "active" | "inactive") || "lead",
        })
        .select("id")
        .single();

      if (error) {
        errors.push({ row: i, message: error.message });
        continue;
      }

      if (data?.id) {
        await logActivity("company", data.id, "created", `Company "${name}" imported via CSV`);
      }
      imported++;
    } catch (e) {
      errors.push({ row: i, message: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  // Store import log
  try {
    const user = await getCurrentUser();
    const supabaseLog = await createClient();
    await supabaseLog.from("import_logs").insert({
      entity_type: "company",
      total_rows: rows.length,
      imported_count: imported,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : null,
      imported_by: user?.id ?? null,
    });
    await writeAuditLog({
      entity_type: "company",
      action: "import",
      new_value: { imported, errors: errors.length },
      metadata: { total_rows: rows.length },
    });
  } catch {
    // Non-critical
  }

  revalidatePath("/companies");
  revalidatePath("/dashboard");
  return { imported, errors };
}

export async function importCandidates(
  rows: Record<string, string>[]
): Promise<{ imported: number; errors: { row: number; message: string }[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let imported = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const fullName = r.full_name?.trim();

    if (!fullName) {
      errors.push({ row: i, message: "Missing required field: full_name" });
      continue;
    }

    const skills = r.skills
      ? r.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const yearsExp = r.years_experience ? parseInt(r.years_experience, 10) : null;
    const desiredSalary = r.desired_salary ? parseFloat(r.desired_salary) : null;

    try {
      const { data, error } = await supabase
        .from("candidates")
        .insert({
          full_name: fullName,
          email: r.email?.trim() || null,
          phone: r.phone?.trim() || null,
          location: r.location?.trim() || null,
          skills,
          notes: r.notes?.trim() || null,
          status: "new",
          source: r.source?.trim() || null,
          years_experience: isNaN(yearsExp as number) ? null : yearsExp,
          desired_salary: isNaN(desiredSalary as number) ? null : desiredSalary,
          owner_id: user?.id ?? null,
        })
        .select("id")
        .single();

      if (error) {
        errors.push({ row: i, message: error.message });
        continue;
      }

      if (data?.id) {
        await logActivity(
          "candidate",
          data.id,
          "created",
          `Candidate "${fullName}" imported via CSV`
        );
      }
      imported++;
    } catch (e) {
      errors.push({ row: i, message: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  // Store import log
  try {
    const userForLog = await getCurrentUser();
    const supabaseLog = await createClient();
    await supabaseLog.from("import_logs").insert({
      entity_type: "candidate",
      total_rows: rows.length,
      imported_count: imported,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : null,
      imported_by: userForLog?.id ?? null,
    });
    await writeAuditLog({
      entity_type: "candidate",
      action: "import",
      new_value: { imported, errors: errors.length },
      metadata: { total_rows: rows.length },
    });
  } catch {
    // Non-critical
  }

  revalidatePath("/candidates");
  revalidatePath("/dashboard");
  return { imported, errors };
}

export async function importJobs(
  rows: Record<string, string>[]
): Promise<{ imported: number; errors: { row: number; message: string }[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let imported = 0;
  const errors: { row: number; message: string }[] = [];

  // Cache company lookups to avoid repeated queries
  const companyCache = new Map<string, string>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const title = r.title?.trim();
    const companyName = r.company_name?.trim();

    if (!title) {
      errors.push({ row: i, message: "Missing required field: title" });
      continue;
    }
    if (!companyName) {
      errors.push({ row: i, message: "Missing required field: company_name" });
      continue;
    }

    // Look up company_id
    let companyId = companyCache.get(companyName.toLowerCase());
    if (!companyId) {
      const { data: companies } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", companyName)
        .limit(1);

      if (!companies || companies.length === 0) {
        errors.push({ row: i, message: `Company "${companyName}" not found` });
        continue;
      }
      companyId = companies[0].id;
      companyCache.set(companyName.toLowerCase(), companyId);
    }

    try {
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          company_id: companyId,
          title,
          description: r.description?.trim() || null,
          location: r.location?.trim() || null,
          salary_range: r.salary_range?.trim() || null,
          priority: (r.priority?.trim() as "low" | "medium" | "high") || "medium",
          employment_type:
            (r.employment_type?.trim() as
              | "full_time"
              | "part_time"
              | "contract"
              | "temp_to_hire") || "full_time",
          pay_type: (r.pay_type?.trim() as "hourly" | "salary" | "per_diem") || "salary",
          owner_id: user?.id ?? null,
        })
        .select("id")
        .single();

      if (error) {
        errors.push({ row: i, message: error.message });
        continue;
      }

      if (data?.id) {
        await logActivity("job", data.id, "created", `Job "${title}" imported via CSV`);
      }
      imported++;
    } catch (e) {
      errors.push({ row: i, message: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  // Store import log
  try {
    const userForLog = await getCurrentUser();
    const supabaseLog = await createClient();
    await supabaseLog.from("import_logs").insert({
      entity_type: "job",
      total_rows: rows.length,
      imported_count: imported,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : null,
      imported_by: userForLog?.id ?? null,
    });
    await writeAuditLog({
      entity_type: "job",
      action: "import",
      new_value: { imported, errors: errors.length },
      metadata: { total_rows: rows.length },
    });
  } catch {
    // Non-critical
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return { imported, errors };
}
