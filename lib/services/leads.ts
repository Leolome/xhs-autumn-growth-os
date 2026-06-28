import { leads as mockLeads } from "@/data/mock-leads";
import { stageLabels } from "@/lib/constants";
import { createServerSupabaseDataClient } from "@/lib/supabase/server";
import { leadActivityToRow, leadToRow, mapLeadActivityRow, mapLeadRow } from "@/lib/services/mappers";
import type { IntentLevel, Lead, LeadActivity, LeadStage } from "@/lib/types";

export async function getLeads(): Promise<Lead[]> {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return mockLeads;

  const [{ data: leadRows, error: leadError }, { data: activityRows, error: activityError }] = await Promise.all([
    supabase.from("leads").select("*").order("updated_at", { ascending: false }),
    supabase.from("lead_activities").select("*").order("at", { ascending: false }),
  ]);

  if (leadError || activityError || !leadRows?.length) return mockLeads;

  const activitiesByLead = new Map<string, LeadActivity[]>();
  for (const row of activityRows ?? []) {
    const activity = mapLeadActivityRow(row);
    const list = activitiesByLead.get(row.lead_id) ?? [];
    list.push(activity);
    activitiesByLead.set(row.lead_id, list);
  }

  return leadRows.map((row) => mapLeadRow(row, activitiesByLead.get(row.id) ?? []));
}

export async function upsertLead(lead: Lead) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const { error } = await supabase.from("leads").upsert([leadToRow(lead)], { onConflict: "id" });
  return { ok: !error, error: error?.message };
}

export async function addLeadActivity(leadId: string, activity: LeadActivity) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const [activityResult, leadResult] = await Promise.all([
    supabase.from("lead_activities").upsert([leadActivityToRow(activity, leadId)], { onConflict: "id" }),
    supabase
      .from("leads")
      .update({
        latest_activity: `${activity.action}：${activity.note}`,
        latest_activity_at: activity.at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId),
  ]);
  const error = activityResult.error ?? leadResult.error;
  return { ok: !error, error: error?.message };
}

export async function updateLeadStage(leadId: string, stage: LeadStage, actor = "系统") {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const now = new Date().toISOString();
  const latestActivity = `阶段更新为 ${stageLabels[stage]}`;
  const activityId = `activity-${leadId}-${Date.now()}`;

  const [leadResult, activityResult] = await Promise.all([
    supabase
      .from("leads")
      .update({
        stage,
        latest_activity: latestActivity,
        latest_activity_at: now,
      })
      .eq("id", leadId),
    supabase.from("lead_activities").insert({
      id: activityId,
      lead_id: leadId,
      at: now,
      actor,
      action: "阶段流转",
      note: latestActivity,
    }),
  ]);

  const error = leadResult.error ?? activityResult.error;
  return { ok: !error, error: error?.message };
}

export async function updateLeadIntent(leadId: string, intentLevel: IntentLevel, intentScore?: number) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const update: { intent_level: IntentLevel; intent_score?: number } = { intent_level: intentLevel };
  if (typeof intentScore === "number") update.intent_score = intentScore;

  const { error } = await supabase.from("leads").update(update).eq("id", leadId);
  return { ok: !error, error: error?.message };
}
