"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Task, TaskPriority } from "@/types/database";

export async function getTasks(options?: {
  showCompleted?: boolean;
  entityType?: string;
  entityId?: string;
}): Promise<Task[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("tasks").select("*");

    if (!options?.showCompleted) {
      query = query.is("completed_at", null);
    }
    if (options?.entityType && options?.entityId) {
      query = query.eq("entity_type", options.entityType).eq("entity_id", options.entityId);
    }

    query = query.order("due_date", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error("[getTasks] Supabase error:", error.message);
      return [];
    }
    return (data ?? []) as Task[];
  } catch (e) {
    console.error("[getTasks] Unexpected error:", e);
    return [];
  }
}

export async function getOverdueTasks(): Promise<Task[]> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .is("completed_at", null)
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(10);

    if (error) return [];
    return (data ?? []) as Task[];
  } catch {
    return [];
  }
}

export async function getUpcomingTasks(limit = 10): Promise<Task[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .is("completed_at", null)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as Task[];
  } catch {
    return [];
  }
}

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("tasks").insert({
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    priority: (formData.get("priority") as TaskPriority) || "medium",
    due_date: (formData.get("due_date") as string) || null,
    entity_type: (formData.get("entity_type") as string) || null,
    entity_id: (formData.get("entity_id") as string) || null,
    owner_id: user?.id ?? null,
  });

  if (error) {
    console.error("[createTask] Supabase error:", error.message);
    throw new Error("Failed to create task. Please try again.");
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function completeTask(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[completeTask] Supabase error:", error.message);
    throw new Error("Failed to complete task.");
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function reopenTask(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ completed_at: null })
    .eq("id", id);

  if (error) {
    console.error("[reopenTask] Supabase error:", error.message);
    throw new Error("Failed to reopen task.");
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("[deleteTask] Supabase error:", error.message);
    throw new Error("Failed to delete task.");
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function getMyTasks(userId: string, limit = 10): Promise<Task[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("owner_id", userId)
      .is("completed_at", null)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as Task[];
  } catch {
    return [];
  }
}
