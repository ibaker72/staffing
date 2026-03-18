"use server";

import { createClient } from "@/lib/supabase/server";

export interface DuplicateWarning {
  field: string;
  value: string;
  matchId: string;
  matchName: string;
}

// Check if a company might be a duplicate before create
export async function checkCompanyDuplicate(name: string, location?: string): Promise<DuplicateWarning[]> {
  const supabase = await createClient();
  const warnings: DuplicateWarning[] = [];

  // Check by name (case-insensitive partial match)
  const { data: nameMatches } = await supabase
    .from("companies")
    .select("id, name, location")
    .ilike("name", `%${name}%`)
    .limit(5);

  for (const match of nameMatches ?? []) {
    // Exact or very close name match
    if (match.name.toLowerCase() === name.toLowerCase()) {
      warnings.push({
        field: "name",
        value: name,
        matchId: match.id,
        matchName: `${match.name}${match.location ? ` (${match.location})` : ""}`,
      });
    }
    // Same name + same location
    else if (location && match.location &&
             match.name.toLowerCase().includes(name.toLowerCase()) &&
             match.location.toLowerCase() === location.toLowerCase()) {
      warnings.push({
        field: "name+location",
        value: `${name} / ${location}`,
        matchId: match.id,
        matchName: `${match.name} (${match.location})`,
      });
    }
  }

  return warnings;
}

// Check if a candidate might be a duplicate
export async function checkCandidateDuplicate(email?: string, phone?: string): Promise<DuplicateWarning[]> {
  const supabase = await createClient();
  const warnings: DuplicateWarning[] = [];

  if (email) {
    const { data: emailMatches } = await supabase
      .from("candidates")
      .select("id, full_name, email")
      .ilike("email", email)
      .limit(3);

    for (const match of emailMatches ?? []) {
      warnings.push({
        field: "email",
        value: email,
        matchId: match.id,
        matchName: `${match.full_name} (${match.email})`,
      });
    }
  }

  if (phone) {
    // Normalize phone: strip non-digits for comparison
    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length >= 7) {
      const { data: phoneMatches } = await supabase
        .from("candidates")
        .select("id, full_name, phone")
        .not("phone", "is", null)
        .limit(50); // fetch more to filter client-side

      for (const match of phoneMatches ?? []) {
        const matchNormalized = (match.phone ?? "").replace(/\D/g, "");
        if (matchNormalized.length >= 7 && matchNormalized.includes(normalizedPhone.slice(-7))) {
          warnings.push({
            field: "phone",
            value: phone,
            matchId: match.id,
            matchName: `${match.full_name} (${match.phone})`,
          });
        }
      }
    }
  }

  return warnings;
}

// Check if a job might be a duplicate
export async function checkJobDuplicate(companyId: string, title: string, location?: string): Promise<DuplicateWarning[]> {
  const supabase = await createClient();
  const warnings: DuplicateWarning[] = [];

  // Check for same company + similar title
  const { data: matches } = await supabase
    .from("jobs")
    .select("id, title, location, status")
    .eq("company_id", companyId)
    .ilike("title", `%${title}%`)
    .limit(5);

  for (const match of matches ?? []) {
    const desc = `${match.title}${match.location ? ` (${match.location})` : ""} [${match.status}]`;
    if (match.title.toLowerCase() === title.toLowerCase()) {
      warnings.push({
        field: "title+company",
        value: title,
        matchId: match.id,
        matchName: desc,
      });
    } else if (location && match.location && match.location.toLowerCase() === location.toLowerCase()) {
      warnings.push({
        field: "title+company+location",
        value: `${title} / ${location}`,
        matchId: match.id,
        matchName: desc,
      });
    }
  }

  return warnings;
}
