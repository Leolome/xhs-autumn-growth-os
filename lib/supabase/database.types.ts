import type {
  UserRole,
} from "@/lib/auth/types";

import type {
  AccountType,
  BookingStatus,
  Campus,
  ContentType,
  CrawlErrorType,
  DataSource,
  IntentLevel,
  LeadStage,
  TaskStatus,
} from "@/lib/types";

export type AccountRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  name: string;
  type: AccountType;
  campus: Campus;
  owner: string;
  role: string | null;
  avatar_url: string | null;
  profile_url: string;
  positioning: string;
  notes: string | null;
  status: "active" | "paused" | "risk";
  followers: number;
  total_engagement: number;
  posts: number;
  last_snapshot_at: string | null;
  week_expected: number;
  week_published: number;
  data_pending: number;
  lead_dm: number;
  lead_assessments: number;
  lead_groups: number;
  lead_bookings: number;
  lead_a_level: number;
};

export type TaskRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  assigned_date: string;
  account_id: string;
  campus: Campus;
  content_type: ContentType;
  suggested_title: string;
  hook: string;
  required_assets: string[];
  cta: string;
  compliance_note: string;
  status: TaskStatus;
  note_url: string | null;
  source_lead_ids: string[];
  metric_likes: number;
  metric_saves: number;
  metric_comments: number;
  metric_dm: number;
  metric_assessments: number;
  metric_bookings: number;
};

export type XhsNoteRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  task_id: string | null;
  account_id: string;
  title: string;
  url: string;
  published_at: string;
  content_type: ContentType;
  source: DataSource;
  source_lead_ids: string[];
};

export type LeadRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  parent_nickname: string;
  student_grade: string;
  region: string;
  campus: Campus;
  source_account_id: string | null;
  source_note_id: string | null;
  pain_points: string[];
  intent_score: number;
  intent_level: IntentLevel;
  stage: LeadStage;
  owner: string;
  next_action: string;
  next_follow_up_at: string | null;
  notes: string | null;
  latest_activity: string | null;
  latest_activity_at: string | null;
};

export type LeadActivityRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  lead_id: string;
  at: string;
  actor: string;
  action: string;
  note: string;
};

export type BookingRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  lead_id: string;
  campus: Campus;
  event_type: "定位课" | "开放日" | "体验课" | "家长沟通";
  title: string;
  scheduled_at: string;
  reception_teacher: string | null;
  capacity: number;
  booked_count: number;
  status: BookingStatus;
  script: string;
  arrival_feedback: string | null;
  no_show_reason: string | null;
  recommended_class: string | null;
  next_action: string;
};

export type CrawlTargetRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  target_type: "account" | "profile" | "note" | "benchmark";
  account_id: string | null;
  note_id: string | null;
  url: string;
  cadence: "3d";
  crawl_frequency: "3d";
  is_active: boolean;
  status: "active" | "paused" | "manual";
  last_crawled_at: string | null;
  next_crawled_at: string | null;
};

export type CrawlRunRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  started_at: string;
  finished_at: string | null;
  status: "success" | "partial" | "partial_failed" | "failed";
  target_count: number;
  success_count: number;
  failed_count: number;
  source: DataSource;
};

export type CrawlErrorRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  crawl_run_id: string;
  target_id: string | null;
  url: string | null;
  error_type: CrawlErrorType;
  message: string;
  resolved: boolean;
};

export type AccountSnapshotRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  account_id: string;
  captured_at: string;
  followers: number;
  total_engagement: number;
  posts: number;
  source: DataSource;
  note: string | null;
  raw_data: Record<string, unknown>;
};

export type NoteSnapshotRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  note_id: string;
  captured_at: string;
  likes: number;
  saves: number;
  comments: number;
  source: DataSource;
  note: string | null;
  raw_data: Record<string, unknown>;
};

export type BenchmarkAccountRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  name: string;
  avatar_url: string | null;
  category: string;
  positioning: string;
  url: string;
  learnings: string[];
};

export type BenchmarkNoteRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  account_name: string;
  title: string;
  hook: string;
  cover_formula: string;
  comment_insight: string;
  reusable_direction: string;
};

export type ReviewWeeklySummaryRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  week_start: string;
  week_end: string;
  summary: Record<string, unknown>;
  next_actions: Array<Record<string, unknown>>;
};

export type UserProfileRow = {
  id: string;
  created_at: string;
  updated_at: string;
  email: string | null;
  display_name: string;
  role: UserRole;
  campus: Campus | null;
  owner_account_ids: string[];
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
};

export type AuditLogRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  campus: Campus | null;
  detail: Record<string, unknown>;
};

export type Database = {
  public: {
    Tables: {
      accounts: { Row: AccountRow; Insert: Partial<AccountRow>; Update: Partial<AccountRow> };
      tasks: { Row: TaskRow; Insert: Partial<TaskRow>; Update: Partial<TaskRow> };
      xhs_notes: { Row: XhsNoteRow; Insert: Partial<XhsNoteRow>; Update: Partial<XhsNoteRow> };
      leads: { Row: LeadRow; Insert: Partial<LeadRow>; Update: Partial<LeadRow> };
      lead_activities: { Row: LeadActivityRow; Insert: Partial<LeadActivityRow>; Update: Partial<LeadActivityRow> };
      bookings: { Row: BookingRow; Insert: Partial<BookingRow>; Update: Partial<BookingRow> };
      crawl_targets: { Row: CrawlTargetRow; Insert: Partial<CrawlTargetRow>; Update: Partial<CrawlTargetRow> };
      crawl_runs: { Row: CrawlRunRow; Insert: Partial<CrawlRunRow>; Update: Partial<CrawlRunRow> };
      crawl_errors: { Row: CrawlErrorRow; Insert: Partial<CrawlErrorRow>; Update: Partial<CrawlErrorRow> };
      account_snapshots: { Row: AccountSnapshotRow; Insert: Partial<AccountSnapshotRow>; Update: Partial<AccountSnapshotRow> };
      note_snapshots: { Row: NoteSnapshotRow; Insert: Partial<NoteSnapshotRow>; Update: Partial<NoteSnapshotRow> };
      benchmarks: { Row: BenchmarkAccountRow; Insert: Partial<BenchmarkAccountRow>; Update: Partial<BenchmarkAccountRow> };
      benchmark_notes: { Row: BenchmarkNoteRow; Insert: Partial<BenchmarkNoteRow>; Update: Partial<BenchmarkNoteRow> };
      review_weekly_summaries: { Row: ReviewWeeklySummaryRow; Insert: Partial<ReviewWeeklySummaryRow>; Update: Partial<ReviewWeeklySummaryRow> };
      user_profiles: { Row: UserProfileRow; Insert: Partial<UserProfileRow>; Update: Partial<UserProfileRow> };
      audit_logs: { Row: AuditLogRow; Insert: Partial<AuditLogRow>; Update: Partial<AuditLogRow> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_type: AccountType;
      campus: Campus;
      content_type: ContentType;
      task_status: TaskStatus;
      lead_stage: LeadStage;
      intent_level: IntentLevel;
      booking_status: BookingStatus;
      data_source: DataSource;
      crawl_error_type: CrawlErrorType;
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
