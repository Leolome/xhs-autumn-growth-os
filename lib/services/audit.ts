import { createServerSupabaseDataClient } from "@/lib/supabase/server";
import { auditLogToRow, mapAuditLogRow } from "@/lib/services/mappers";
import type { AuditLog } from "@/lib/types";

export async function getAuditLogs(limit = 20): Promise<AuditLog[]> {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error || !data?.length) return [];

  return data.map(mapAuditLogRow);
}

export async function appendAuditLog(log: AuditLog) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const { error } = await supabase.from("audit_logs").upsert([auditLogToRow(log)], { onConflict: "id" });
  return { ok: !error, fallback: false, error: error?.message };
}
