"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActivityEvent } from "@/types/database";

export async function logActivity(
  entityType: string,
  entityId: string,
  eventType: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  try {
    const supabase = await createClient();
    await supabase.from("activity_events").insert({
      entity_type: entityType,
      entity_id: entityId,
      event_type: eventType,
      description,
      metadata: metadata ?? {},
    });
  } catch (e) {
    // Activity logging is non-critical — never block the main operation
    console.error("[logActivity] Failed:", e);
  }
}

export async function getRecentActivity(limit = 20): Promise<ActivityEvent[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getRecentActivity] Supabase error:", error.message);
      return [];
    }
    return (data ?? []) as ActivityEvent[];
  } catch (e) {
    console.error("[getRecentActivity] Unexpected error:", e);
    return [];
  }
}

export async function getEntityActivity(
  entityType: string,
  entityId: string,
  limit = 50
): Promise<ActivityEvent[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_events")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getEntityActivity] Supabase error:", error.message);
      return [];
    }
    return (data ?? []) as ActivityEvent[];
  } catch (e) {
    console.error("[getEntityActivity] Unexpected error:", e);
    return [];
  }
}
