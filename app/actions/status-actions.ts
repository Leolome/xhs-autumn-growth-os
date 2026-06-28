"use server";

import { revalidatePath } from "next/cache";

import { canWriteCampus } from "@/lib/auth/permissions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getAccounts, upsertAccount } from "@/lib/services/accounts";
import { appendAuditLog } from "@/lib/services/audit";
import { upsertBenchmarkAccount } from "@/lib/services/benchmarks";
import { getBookings, updateBookingStatus, upsertBooking } from "@/lib/services/bookings";
import { upsertAccountSnapshot, upsertNoteSnapshot } from "@/lib/services/crawler";
import { addLeadActivity, getLeads, updateLeadIntent, updateLeadStage, upsertLead } from "@/lib/services/leads";
import { getXhsNotes } from "@/lib/services/notes";
import { getTasks, updateTaskStatus, upsertTask } from "@/lib/services/tasks";
import type {
  Account,
  AccountSnapshot,
  BenchmarkAccount,
  Booking,
  BookingStatus,
  GrowthTask,
  IntentLevel,
  Lead,
  LeadActivity,
  LeadStage,
  NoteSnapshot,
  TaskStatus,
} from "@/lib/types";

type ActionResult = { ok: boolean; fallback?: boolean; error?: string };

function permissionDenied(): ActionResult {
  return { ok: false, fallback: false, error: "当前账号没有该校区的写入权限。" };
}

async function recordAudit(
  user: Awaited<ReturnType<typeof getCurrentUserContext>>,
  action: string,
  entityType: string,
  entityId: string,
  campus: Account["campus"] | undefined,
  detail: Record<string, unknown>,
) {
  await appendAuditLog({
    id: `audit-${entityType}-${entityId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    actorId: user.id,
    actorName: user.displayName,
    actorRole: user.role,
    action,
    entityType,
    entityId,
    campus,
    detail,
  });
}

export async function setTaskStatus(taskId: string, status: TaskStatus) {
  const user = await getCurrentUserContext();
  const task = (await getTasks()).find((item) => item.id === taskId);
  if (task && !canWriteCampus(user, task.campus)) return permissionDenied();

  const result = await updateTaskStatus(taskId, status);
  if (result.ok && task) {
    await recordAudit(user, "更新任务状态", "task", taskId, task.campus, { status });
  }
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/review");
  return result;
}

export async function setLeadStage(leadId: string, stage: LeadStage) {
  const user = await getCurrentUserContext();
  const lead = (await getLeads()).find((item) => item.id === leadId);
  if (lead && !canWriteCampus(user, lead.campus)) return permissionDenied();

  const result = await updateLeadStage(leadId, stage, user.displayName);
  if (result.ok && lead) {
    await recordAudit(user, "更新线索阶段", "lead", leadId, lead.campus, { stage });
  }
  revalidatePath("/lead-pool");
  revalidatePath("/dashboard");
  revalidatePath("/review");
  return result;
}

export async function setLeadIntent(leadId: string, intentLevel: IntentLevel, intentScore?: number) {
  const user = await getCurrentUserContext();
  const lead = (await getLeads()).find((item) => item.id === leadId);
  if (lead && !canWriteCampus(user, lead.campus)) return permissionDenied();

  const result = await updateLeadIntent(leadId, intentLevel, intentScore);
  if (result.ok && lead) {
    await recordAudit(user, "更新线索意向", "lead", leadId, lead.campus, { intentLevel, intentScore });
  }
  revalidatePath("/lead-pool");
  revalidatePath("/dashboard");
  return result;
}

export async function appendLeadActivity(leadId: string, activity: LeadActivity) {
  const user = await getCurrentUserContext();
  const lead = (await getLeads()).find((item) => item.id === leadId);
  if (lead && !canWriteCampus(user, lead.campus)) return permissionDenied();

  const result = await addLeadActivity(leadId, activity);
  if (result.ok && lead) {
    await recordAudit(user, "新增跟进记录", "lead_activity", activity.id, lead.campus, {
      leadId,
      action: activity.action,
      note: activity.note,
    });
  }
  revalidatePath("/lead-pool");
  revalidatePath("/dashboard");
  return result;
}

export async function setBookingStatus(bookingId: string, leadId: string, status: BookingStatus) {
  const user = await getCurrentUserContext();
  const booking = (await getBookings()).find((item) => item.id === bookingId);
  if (booking && !canWriteCampus(user, booking.campus)) return permissionDenied();

  const result = await updateBookingStatus(bookingId, leadId, status);
  if (result.ok && booking) {
    await recordAudit(user, "更新邀约状态", "booking", bookingId, booking.campus, { leadId, status });
  }
  revalidatePath("/invitations");
  revalidatePath("/lead-pool");
  revalidatePath("/dashboard");
  revalidatePath("/review");
  return result;
}

export async function saveAccount(account: Account) {
  const user = await getCurrentUserContext();
  if (!canWriteCampus(user, account.campus)) return permissionDenied();

  const result = await upsertAccount(account);
  if (result.ok) {
    await recordAudit(user, "保存账号", "account", account.id, account.campus, {
      name: account.name,
      status: account.status,
    });
  }
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return result;
}

export async function saveBenchmarkAccount(account: BenchmarkAccount) {
  const user = await getCurrentUserContext();
  const result = await upsertBenchmarkAccount(account);
  if (result.ok) {
    await recordAudit(user, "保存参考账号", "benchmark", account.id, undefined, {
      name: account.name,
      category: account.category,
    });
  }
  revalidatePath("/benchmarks");
  return result;
}

export async function saveTask(task: GrowthTask) {
  const user = await getCurrentUserContext();
  if (!canWriteCampus(user, task.campus)) return permissionDenied();

  const result = await upsertTask(task);
  if (result.ok) {
    await recordAudit(user, "保存内容任务", "task", task.id, task.campus, {
      title: task.suggestedTitle,
      status: task.status,
    });
  }
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return result;
}

export async function saveLead(lead: Lead) {
  const user = await getCurrentUserContext();
  if (!canWriteCampus(user, lead.campus)) return permissionDenied();

  const result = await upsertLead(lead);
  if (result.ok) {
    await recordAudit(user, "保存线索", "lead", lead.id, lead.campus, {
      parentNickname: lead.parentNickname,
      stage: lead.stage,
      intentLevel: lead.intentLevel,
    });
  }
  revalidatePath("/lead-pool");
  revalidatePath("/dashboard");
  return result;
}

export async function saveBooking(booking: Booking) {
  const user = await getCurrentUserContext();
  if (!canWriteCampus(user, booking.campus)) return permissionDenied();

  const result = await upsertBooking(booking);
  if (result.ok) {
    await recordAudit(user, "保存邀约", "booking", booking.id, booking.campus, {
      leadId: booking.leadId,
      title: booking.title,
      status: booking.status,
    });
  }
  revalidatePath("/invitations");
  revalidatePath("/dashboard");
  return result;
}

export async function saveAccountSnapshot(snapshot: AccountSnapshot) {
  const user = await getCurrentUserContext();
  const account = (await getAccounts()).find((item) => item.id === snapshot.accountId);
  if (account && !canWriteCampus(user, account.campus)) return permissionDenied();

  const result = await upsertAccountSnapshot(snapshot);
  if (result.ok) {
    await recordAudit(user, "补录账号快照", "account_snapshot", snapshot.id, account?.campus, {
      accountId: snapshot.accountId,
      source: snapshot.source,
      capturedAt: snapshot.capturedAt,
    });
  }
  revalidatePath("/crawler");
  revalidatePath("/dashboard");
  return result;
}

export async function saveNoteSnapshot(snapshot: NoteSnapshot) {
  const user = await getCurrentUserContext();
  const note = (await getXhsNotes()).find((item) => item.id === snapshot.noteId);
  const account = note ? (await getAccounts()).find((item) => item.id === note.accountId) : undefined;
  if (account && !canWriteCampus(user, account.campus)) return permissionDenied();

  const result = await upsertNoteSnapshot(snapshot);
  if (result.ok) {
    await recordAudit(user, "补录笔记快照", "note_snapshot", snapshot.id, account?.campus, {
      noteId: snapshot.noteId,
      source: snapshot.source,
      capturedAt: snapshot.capturedAt,
    });
  }
  revalidatePath("/crawler");
  revalidatePath("/review");
  revalidatePath("/dashboard");
  return result;
}
