"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface AutomationItem {
  entityType: string;
  entityId: string;
  entityName: string;
  reason: string;
}

interface RuleResult {
  ruleName: string;
  ruleDescription: string;
  found: number;
  created: number;
  items: AutomationItem[];
}

export interface AutomationRunResult {
  id?: string;
  dryRun: boolean;
  rules: RuleResult[];
  totalFound: number;
  totalCreated: number;
  startedAt: string;
  completedAt: string;
}

export async function runAutomations(dryRun: boolean = false): Promise<AutomationRunResult> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const startedAt = new Date().toISOString();

  const rules: RuleResult[] = [];

  // Rule 1: Follow-up Tasks
  rules.push(await runFollowUpTasksRule(supabase, dryRun, user?.id));

  // Rule 2: Stale Submission Reminders
  rules.push(await runStaleSubmissionsRule(supabase, dryRun, user?.id));

  // Rule 3: Stale Jobs
  rules.push(await runStaleJobsRule(supabase, dryRun, user?.id));

  // Rule 4: Stale Candidates
  rules.push(await runStaleCandidatesRule(supabase, dryRun, user?.id));

  const totalFound = rules.reduce((sum, r) => sum + r.found, 0);
  const totalCreated = rules.reduce((sum, r) => sum + r.created, 0);
  const completedAt = new Date().toISOString();

  // Store run history
  let runId: string | undefined;
  try {
    const { data } = await supabase.from("automation_runs").insert({
      run_by: user?.id ?? null,
      started_at: startedAt,
      completed_at: completedAt,
      dry_run: dryRun,
      results: { rules },
      total_found: totalFound,
      total_created: totalCreated,
    }).select("id").single();
    runId = data?.id;
  } catch {
    // Non-critical
  }

  if (!dryRun && totalCreated > 0) {
    revalidatePath("/tasks");
    revalidatePath("/dashboard");
  }

  return { id: runId, dryRun, rules, totalFound, totalCreated, startedAt, completedAt };
}

async function runFollowUpTasksRule(supabase: ReturnType<typeof Object>, dryRun: boolean, userId?: string): Promise<RuleResult> {
  // Cast supabase properly - it's the return of createClient()
  const sb = supabase as Awaited<ReturnType<typeof createClient>>;
  const items: AutomationItem[] = [];

  // Companies needing follow-up
  const { data: companies } = await sb
    .from("companies")
    .select("id, name")
    .eq("outreach_status", "follow_up")
    .not("follow_up_date", "is", null);

  for (const company of companies ?? []) {
    // Check if task already exists
    const { data: existing } = await sb
      .from("tasks")
      .select("id")
      .eq("entity_type", "company")
      .eq("entity_id", company.id)
      .is("completed_at", null)
      .ilike("title", `%Follow up:%${company.name}%`)
      .limit(1);

    if (!existing || existing.length === 0) {
      items.push({
        entityType: "company",
        entityId: company.id,
        entityName: company.name,
        reason: "Outreach status is follow_up with follow-up date set",
      });

      if (!dryRun) {
        await sb.from("tasks").insert({
          title: `Follow up: ${company.name}`,
          entity_type: "company",
          entity_id: company.id,
          priority: "medium",
          owner_id: userId ?? null,
        });
      }
    }
  }

  // Candidates needing follow-up
  const { data: candidates } = await sb
    .from("candidates")
    .select("id, full_name")
    .eq("outreach_status", "follow_up")
    .not("follow_up_date", "is", null);

  for (const cand of candidates ?? []) {
    const name = cand.full_name;
    const { data: existing } = await sb
      .from("tasks")
      .select("id")
      .eq("entity_type", "candidate")
      .eq("entity_id", cand.id)
      .is("completed_at", null)
      .ilike("title", `%Follow up:%${name}%`)
      .limit(1);

    if (!existing || existing.length === 0) {
      items.push({
        entityType: "candidate",
        entityId: cand.id,
        entityName: name,
        reason: "Outreach status is follow_up with follow-up date set",
      });

      if (!dryRun) {
        await sb.from("tasks").insert({
          title: `Follow up: ${name}`,
          entity_type: "candidate",
          entity_id: cand.id,
          priority: "medium",
          owner_id: userId ?? null,
        });
      }
    }
  }

  return {
    ruleName: "follow_up_tasks",
    ruleDescription: "Create follow-up tasks for companies and candidates with follow-up outreach status",
    found: items.length,
    created: dryRun ? 0 : items.length,
    items,
  };
}

async function runStaleSubmissionsRule(supabase: ReturnType<typeof Object>, dryRun: boolean, userId?: string): Promise<RuleResult> {
  const sb = supabase as Awaited<ReturnType<typeof createClient>>;
  const items: AutomationItem[] = [];

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const { data: submissions } = await sb
    .from("candidate_submissions")
    .select("id, candidates(full_name), jobs(title)")
    .eq("status", "client_review")
    .lt("updated_at", fiveDaysAgo.toISOString());

  for (const sub of submissions ?? []) {
    const candidate = sub.candidates as Record<string, string> | null;
    const job = sub.jobs as Record<string, string> | null;
    const name = candidate?.full_name ?? "Unknown";
    const jobTitle = job?.title ?? "Unknown";

    const { data: existing } = await sb
      .from("tasks")
      .select("id")
      .eq("entity_type", "submission")
      .eq("entity_id", sub.id)
      .is("completed_at", null)
      .ilike("title", "%awaiting client review%")
      .limit(1);

    if (!existing || existing.length === 0) {
      items.push({
        entityType: "submission",
        entityId: sub.id,
        entityName: `${name} → ${jobTitle}`,
        reason: "Submission in client_review for over 5 days",
      });

      if (!dryRun) {
        await sb.from("tasks").insert({
          title: `Follow up on submission awaiting client review: ${name} for ${jobTitle}`,
          entity_type: "submission",
          entity_id: sub.id,
          priority: "high",
          owner_id: userId ?? null,
        });
      }
    }
  }

  return {
    ruleName: "stale_submissions",
    ruleDescription: "Create reminders for submissions stuck in client review for over 5 days",
    found: items.length,
    created: dryRun ? 0 : items.length,
    items,
  };
}

async function runStaleJobsRule(supabase: ReturnType<typeof Object>, dryRun: boolean, userId?: string): Promise<RuleResult> {
  const sb = supabase as Awaited<ReturnType<typeof createClient>>;
  const items: AutomationItem[] = [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: jobs } = await sb
    .from("jobs")
    .select("id, title, owner_id")
    .eq("status", "open")
    .lt("created_at", thirtyDaysAgo.toISOString());

  for (const job of jobs ?? []) {
    const { count } = await sb
      .from("candidate_submissions")
      .select("id", { count: "exact", head: true })
      .eq("job_id", job.id);

    if ((count ?? 0) === 0) {
      const { data: existing } = await sb
        .from("tasks")
        .select("id")
        .eq("entity_type", "job")
        .eq("entity_id", job.id)
        .is("completed_at", null)
        .ilike("title", "%Stale job%")
        .limit(1);

      if (!existing || existing.length === 0) {
        items.push({
          entityType: "job",
          entityId: job.id,
          entityName: job.title,
          reason: "Open job with no submissions after 30 days",
        });

        if (!dryRun) {
          await sb.from("tasks").insert({
            title: `Stale job: ${job.title} - no submissions after 30 days`,
            entity_type: "job",
            entity_id: job.id,
            priority: "medium",
            owner_id: job.owner_id ?? userId ?? null,
          });
        }
      }
    }
  }

  return {
    ruleName: "stale_jobs",
    ruleDescription: "Flag open jobs with no submissions after 30 days",
    found: items.length,
    created: dryRun ? 0 : items.length,
    items,
  };
}

async function runStaleCandidatesRule(supabase: ReturnType<typeof Object>, dryRun: boolean, userId?: string): Promise<RuleResult> {
  const sb = supabase as Awaited<ReturnType<typeof createClient>>;
  const items: AutomationItem[] = [];

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: candidates } = await sb
    .from("candidates")
    .select("id, full_name, last_contacted_at")
    .in("status", ["new", "contacted"])
    .or(`last_contacted_at.is.null,last_contacted_at.lt.${fourteenDaysAgo.toISOString()}`);

  for (const cand of candidates ?? []) {
    const name = cand.full_name;

    const { data: existing } = await sb
      .from("tasks")
      .select("id")
      .eq("entity_type", "candidate")
      .eq("entity_id", cand.id)
      .is("completed_at", null)
      .ilike("title", "%Stale candidate%")
      .limit(1);

    if (!existing || existing.length === 0) {
      items.push({
        entityType: "candidate",
        entityId: cand.id,
        entityName: name,
        reason: cand.last_contacted_at
          ? "No contact in over 14 days"
          : "Never contacted",
      });

      if (!dryRun) {
        await sb.from("tasks").insert({
          title: `Stale candidate: ${name} - no recent contact`,
          entity_type: "candidate",
          entity_id: cand.id,
          priority: "low",
          owner_id: userId ?? null,
        });
      }
    }
  }

  return {
    ruleName: "stale_candidates",
    ruleDescription: "Flag candidates with status new/contacted and no contact in 14 days",
    found: items.length,
    created: dryRun ? 0 : items.length,
    items,
  };
}

// Get run history
export async function getAutomationHistory(limit: number = 20): Promise<Array<{
  id: string;
  run_by: string | null;
  started_at: string;
  completed_at: string | null;
  dry_run: boolean;
  results: { rules: RuleResult[] } | null;
  total_found: number;
  total_created: number;
}>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as Array<{
    id: string;
    run_by: string | null;
    started_at: string;
    completed_at: string | null;
    dry_run: boolean;
    results: { rules: RuleResult[] } | null;
    total_found: number;
    total_created: number;
  }>;
}

export async function getLastAutomationRun() {
  const history = await getAutomationHistory(1);
  return history[0] ?? null;
}
