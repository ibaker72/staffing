"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export interface AuditEntry {
  entity_type: string;
  entity_id?: string;
  action: string;
  previous_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export async function writeAuditLog(entry: AuditEntry) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    await supabase.from("audit_log").insert({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? "system",
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      action: entry.action,
      previous_value: entry.previous_value ?? null,
      new_value: entry.new_value ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch {
    // Audit logging is non-critical; never block the main operation
  }
}

export async function writeAuditLogBatch(entries: AuditEntry[]) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    const rows = entries.map((entry) => ({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? "system",
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      action: entry.action,
      previous_value: entry.previous_value ?? null,
      new_value: entry.new_value ?? null,
      metadata: entry.metadata ?? null,
    }));

    await supabase.from("audit_log").insert(rows);
  } catch {
    // Non-critical
  }
}

export async function getAuditLog(options?: {
  entity_type?: string;
  entity_id?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.entity_type) {
    query = query.eq("entity_type", options.entity_type);
  }
  if (options?.entity_id) {
    query = query.eq("entity_id", options.entity_id);
  }
  if (options?.action) {
    query = query.eq("action", options.action);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getAuditLogCount(options?: {
  entity_type?: string;
  action?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("id", { count: "exact", head: true });

  if (options?.entity_type) {
    query = query.eq("entity_type", options.entity_type);
  }
  if (options?.action) {
    query = query.eq("action", options.action);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}
