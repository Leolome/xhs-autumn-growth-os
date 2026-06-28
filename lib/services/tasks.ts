import { tasks as mockTasks } from "@/data/mock-tasks";
import { createServerSupabaseDataClient } from "@/lib/supabase/server";
import { mapTaskRow, taskToRow } from "@/lib/services/mappers";
import type { GrowthTask, TaskStatus } from "@/lib/types";

export async function getTasks(): Promise<GrowthTask[]> {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return mockTasks;

  const { data, error } = await supabase.from("tasks").select("*").order("assigned_date");
  if (error || !data?.length) return mockTasks;

  return data.map(mapTaskRow);
}

export async function upsertTask(task: GrowthTask) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const { error } = await supabase.from("tasks").upsert([taskToRow(task)], { onConflict: "id" });
  return { ok: !error, error: error?.message };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
  return { ok: !error, error: error?.message };
}
