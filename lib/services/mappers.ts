import type {
  AccountSnapshotRow,
  AccountRow,
  AuditLogRow,
  BookingRow,
  CrawlErrorRow,
  CrawlRunRow,
  CrawlTargetRow,
  LeadActivityRow,
  LeadRow,
  NoteSnapshotRow,
  TaskRow,
  UserProfileRow,
  XhsNoteRow,
} from "@/lib/supabase/database.types";
import type { UserProfile } from "@/lib/auth/types";
import type {
  Account,
  AccountSnapshot,
  AuditLog,
  Booking,
  CrawlError,
  CrawlRun,
  CrawlTarget,
  GrowthTask,
  Lead,
  LeadActivity,
  NoteSnapshot,
  XhsNote,
} from "@/lib/types";

export function mapAccountRow(row: AccountRow): Account {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    type: row.type,
    campus: row.campus,
    owner: row.owner,
    avatarUrl: row.avatar_url ?? undefined,
    profileUrl: row.profile_url,
    positioning: row.positioning,
    notes: row.notes ?? undefined,
    status: row.status,
    followers: row.followers,
    totalEngagement: row.total_engagement,
    posts: row.posts,
    lastSnapshotAt: row.last_snapshot_at ?? row.updated_at,
    weekExpected: row.week_expected,
    weekPublished: row.week_published,
    dataPending: row.data_pending,
    leads: {
      dm: row.lead_dm,
      assessments: row.lead_assessments,
      groups: row.lead_groups,
      bookings: row.lead_bookings,
      aLevel: row.lead_a_level,
    },
  };
}

export function accountToRow(account: Account): AccountRow {
  return {
    id: account.id,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
    created_by: null,
    updated_by: null,
    name: account.name,
    type: account.type,
    campus: account.campus,
    owner: account.owner,
    role: null,
    avatar_url: account.avatarUrl ?? null,
    profile_url: account.profileUrl,
    positioning: account.positioning,
    notes: account.notes ?? null,
    status: account.status,
    followers: account.followers,
    total_engagement: account.totalEngagement,
    posts: account.posts,
    last_snapshot_at: account.lastSnapshotAt,
    week_expected: account.weekExpected,
    week_published: account.weekPublished,
    data_pending: account.dataPending,
    lead_dm: account.leads.dm,
    lead_assessments: account.leads.assessments,
    lead_groups: account.leads.groups,
    lead_bookings: account.leads.bookings,
    lead_a_level: account.leads.aLevel,
  };
}

export function mapTaskRow(row: TaskRow): GrowthTask {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignedDate: row.assigned_date,
    assignedAccountId: row.account_id,
    campus: row.campus,
    contentType: row.content_type,
    suggestedTitle: row.suggested_title,
    hook: row.hook,
    requiredAssets: row.required_assets,
    cta: row.cta,
    complianceNote: row.compliance_note,
    status: row.status,
    noteUrl: row.note_url ?? undefined,
    sourceLeadIds: row.source_lead_ids,
    metrics: {
      likes: row.metric_likes,
      saves: row.metric_saves,
      comments: row.metric_comments,
      dm: row.metric_dm,
      assessments: row.metric_assessments,
      bookings: row.metric_bookings,
    },
  };
}

export function taskToRow(task: GrowthTask): TaskRow {
  return {
    id: task.id,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    created_by: null,
    updated_by: null,
    assigned_date: task.assignedDate,
    account_id: task.assignedAccountId,
    campus: task.campus,
    content_type: task.contentType,
    suggested_title: task.suggestedTitle,
    hook: task.hook,
    required_assets: task.requiredAssets,
    cta: task.cta,
    compliance_note: task.complianceNote,
    status: task.status,
    note_url: task.noteUrl ?? null,
    source_lead_ids: task.sourceLeadIds ?? [],
    metric_likes: task.metrics?.likes ?? 0,
    metric_saves: task.metrics?.saves ?? 0,
    metric_comments: task.metrics?.comments ?? 0,
    metric_dm: task.metrics?.dm ?? 0,
    metric_assessments: task.metrics?.assessments ?? 0,
    metric_bookings: task.metrics?.bookings ?? 0,
  };
}

export function mapXhsNoteRow(row: XhsNoteRow): XhsNote {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    taskId: row.task_id ?? "",
    accountId: row.account_id,
    title: row.title,
    url: row.url,
    publishedAt: row.published_at,
    contentType: row.content_type,
    source: row.source,
    sourceLeadIds: row.source_lead_ids,
  };
}

export function xhsNoteToRow(note: XhsNote): XhsNoteRow {
  return {
    id: note.id,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    created_by: null,
    updated_by: null,
    task_id: note.taskId || null,
    account_id: note.accountId,
    title: note.title,
    url: note.url,
    published_at: note.publishedAt,
    content_type: note.contentType,
    source: note.source ?? "manual",
    source_lead_ids: note.sourceLeadIds ?? [],
  };
}

export function mapLeadActivityRow(row: LeadActivityRow): LeadActivity {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    at: row.at,
    actor: row.actor,
    action: row.action,
    note: row.note,
  };
}

export function leadActivityToRow(activity: LeadActivity, leadId: string): LeadActivityRow {
  return {
    id: activity.id,
    created_at: activity.createdAt,
    updated_at: activity.updatedAt,
    created_by: null,
    updated_by: null,
    lead_id: leadId,
    at: activity.at,
    actor: activity.actor,
    action: activity.action,
    note: activity.note,
  };
}

export function mapLeadRow(row: LeadRow, activities: LeadActivity[] = []): Lead {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentNickname: row.parent_nickname,
    studentGrade: row.student_grade,
    region: row.region,
    campus: row.campus,
    sourceAccountId: row.source_account_id ?? "",
    sourceNoteId: row.source_note_id ?? "",
    painPoints: row.pain_points,
    intentScore: row.intent_score,
    intentLevel: row.intent_level,
    stage: row.stage,
    owner: row.owner,
    nextAction: row.next_action,
    nextFollowUpAt: row.next_follow_up_at ?? row.updated_at,
    notes: row.notes ?? undefined,
    latestActivity: row.latest_activity ?? "",
    latestActivityAt: row.latest_activity_at ?? row.updated_at,
    activities,
  };
}

export function leadToRow(lead: Lead): LeadRow {
  return {
    id: lead.id,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
    created_by: null,
    updated_by: null,
    parent_nickname: lead.parentNickname,
    student_grade: lead.studentGrade,
    region: lead.region,
    campus: lead.campus,
    source_account_id: lead.sourceAccountId || null,
    source_note_id: lead.sourceNoteId || null,
    pain_points: lead.painPoints,
    intent_score: lead.intentScore,
    intent_level: lead.intentLevel,
    stage: lead.stage,
    owner: lead.owner,
    next_action: lead.nextAction,
    next_follow_up_at: lead.nextFollowUpAt,
    notes: lead.notes ?? null,
    latest_activity: lead.latestActivity,
    latest_activity_at: lead.latestActivityAt,
  };
}

export function mapBookingRow(row: BookingRow): Booking {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    leadId: row.lead_id,
    campus: row.campus,
    eventType: row.event_type,
    title: row.title,
    scheduledAt: row.scheduled_at,
    receptionTeacher: row.reception_teacher ?? undefined,
    capacity: row.capacity,
    bookedCount: row.booked_count,
    status: row.status,
    script: row.script,
    arrivalFeedback: row.arrival_feedback ?? undefined,
    noShowReason: row.no_show_reason ?? undefined,
    recommendedClass: row.recommended_class ?? undefined,
    nextAction: row.next_action,
  };
}

export function bookingToRow(booking: Booking): BookingRow {
  return {
    id: booking.id,
    created_at: booking.createdAt,
    updated_at: booking.updatedAt,
    created_by: null,
    updated_by: null,
    lead_id: booking.leadId,
    campus: booking.campus,
    event_type: booking.eventType,
    title: booking.title,
    scheduled_at: booking.scheduledAt,
    reception_teacher: booking.receptionTeacher ?? null,
    capacity: booking.capacity,
    booked_count: booking.bookedCount,
    status: booking.status,
    script: booking.script,
    arrival_feedback: booking.arrivalFeedback ?? null,
    no_show_reason: booking.noShowReason ?? null,
    recommended_class: booking.recommendedClass ?? null,
    next_action: booking.nextAction,
  };
}

export function mapCrawlTargetRow(row: CrawlTargetRow): CrawlTarget {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    targetType: row.target_type,
    accountId: row.account_id ?? "",
    noteId: row.note_id ?? undefined,
    url: row.url,
    cadence: row.cadence,
    crawlFrequency: row.crawl_frequency,
    isActive: row.is_active,
    status: row.status,
    lastCrawledAt: row.last_crawled_at ?? undefined,
    nextCrawledAt: row.next_crawled_at ?? undefined,
  };
}

export function crawlTargetToRow(target: CrawlTarget): CrawlTargetRow {
  return {
    id: target.id,
    created_at: target.createdAt,
    updated_at: target.updatedAt,
    created_by: null,
    updated_by: null,
    target_type: target.targetType,
    account_id: target.accountId || null,
    note_id: target.noteId ?? null,
    url: target.url,
    cadence: target.cadence,
    crawl_frequency: target.crawlFrequency ?? target.cadence,
    is_active: target.isActive ?? target.status === "active",
    status: target.status,
    last_crawled_at: target.lastCrawledAt ?? null,
    next_crawled_at: target.nextCrawledAt ?? null,
  };
}

export function mapCrawlRunRow(row: CrawlRunRow): CrawlRun {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at ?? row.updated_at,
    status: row.status,
    targetCount: row.target_count,
    successCount: row.success_count,
    failedCount: row.failed_count,
    source: row.source,
  };
}

export function crawlRunToRow(run: CrawlRun): CrawlRunRow {
  return {
    id: run.id,
    created_at: run.createdAt,
    updated_at: run.updatedAt,
    created_by: null,
    updated_by: null,
    started_at: run.startedAt,
    finished_at: run.finishedAt,
    status: run.status,
    target_count: run.targetCount,
    success_count: run.successCount,
    failed_count: run.failedCount,
    source: run.source,
  };
}

export function mapCrawlErrorRow(row: CrawlErrorRow): CrawlError {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    runId: row.crawl_run_id,
    targetId: row.target_id ?? "",
    url: row.url ?? undefined,
    errorType: row.error_type,
    message: row.message,
    resolved: row.resolved,
  };
}

export function crawlErrorToRow(error: CrawlError): CrawlErrorRow {
  return {
    id: error.id,
    created_at: error.createdAt,
    updated_at: error.updatedAt,
    created_by: null,
    updated_by: null,
    crawl_run_id: error.runId,
    target_id: error.targetId || null,
    url: error.url ?? null,
    error_type: error.errorType,
    message: error.message,
    resolved: error.resolved,
  };
}

export function mapAccountSnapshotRow(row: AccountSnapshotRow): AccountSnapshot {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    accountId: row.account_id,
    capturedAt: row.captured_at,
    followers: row.followers,
    totalEngagement: row.total_engagement,
    posts: row.posts,
    source: row.source,
    note: row.note ?? undefined,
    rawData: row.raw_data,
  };
}

export function accountSnapshotToRow(snapshot: AccountSnapshot): AccountSnapshotRow {
  return {
    id: snapshot.id,
    created_at: snapshot.createdAt,
    updated_at: snapshot.updatedAt,
    created_by: null,
    updated_by: null,
    account_id: snapshot.accountId,
    captured_at: snapshot.capturedAt,
    followers: snapshot.followers,
    total_engagement: snapshot.totalEngagement,
    posts: snapshot.posts,
    source: snapshot.source,
    note: snapshot.note ?? null,
  raw_data: snapshot.rawData ?? {},
  };
}

export function mapUserProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    email: row.email ?? "",
    displayName: row.display_name,
    role: row.role,
    campus: row.campus,
    ownerAccountIds: row.owner_account_ids,
    isActive: row.is_active,
  };
}

export function userProfileToRow(profile: UserProfile): UserProfileRow {
  return {
    id: profile.id,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
    email: profile.email || null,
    display_name: profile.displayName,
    role: profile.role,
    campus: profile.campus,
    owner_account_ids: profile.ownerAccountIds,
    is_active: profile.isActive,
    created_by: null,
    updated_by: null,
  };
}

export function mapAuditLogRow(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    campus: row.campus ?? undefined,
    detail: row.detail,
  };
}

export function auditLogToRow(log: AuditLog): AuditLogRow {
  return {
    id: log.id,
    created_at: log.createdAt,
    updated_at: log.updatedAt,
    created_by: null,
    updated_by: null,
    actor_id: log.actorId,
    actor_name: log.actorName,
    actor_role: log.actorRole,
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId,
    campus: log.campus ?? null,
    detail: log.detail,
  };
}

export function mapNoteSnapshotRow(row: NoteSnapshotRow): NoteSnapshot {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    noteId: row.note_id,
    capturedAt: row.captured_at,
    likes: row.likes,
    saves: row.saves,
    comments: row.comments,
    source: row.source,
    note: row.note ?? undefined,
    rawData: row.raw_data,
  };
}

export function noteSnapshotToRow(snapshot: NoteSnapshot): NoteSnapshotRow {
  return {
    id: snapshot.id,
    created_at: snapshot.createdAt,
    updated_at: snapshot.updatedAt,
    created_by: null,
    updated_by: null,
    note_id: snapshot.noteId,
    captured_at: snapshot.capturedAt,
    likes: snapshot.likes,
    saves: snapshot.saves,
    comments: snapshot.comments,
    source: snapshot.source,
    note: snapshot.note ?? null,
    raw_data: snapshot.rawData ?? {},
  };
}
