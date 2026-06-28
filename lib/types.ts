export type AccountType = "teacher" | "koc";

export type Campus = "礼嘉" | "北岸" | "人和" | "九龙坡" | "凯德" | "其他";

export type TaskStatus =
  | "todo"
  | "drafting"
  | "published"
  | "data_filled"
  | "reviewed";

export type ContentType =
  | "提问笔记"
  | "资料分析"
  | "课堂互动视频"
  | "板书分享"
  | "学员展示"
  | "开学倒计时"
  | "体检转化"
  | "家长共情"
  | "生活化定位内容"
  | "真实问题收集"
  | "资料分享"
  | "校区周边内容"
  | "其他";

export type LeadStage =
  | "new"
  | "dm_opened"
  | "resource_sent"
  | "assessed"
  | "group_joined"
  | "to_invite"
  | "booked"
  | "arrived"
  | "strong_intent"
  | "converted"
  | "nurturing"
  | "lost";

export type IntentLevel = "A" | "B" | "C" | "D" | "F";
export type IntentBucket = "high" | "medium" | "low";

export type CrawlErrorType =
  | "timeout"
  | "blocked"
  | "parse_error"
  | "not_found"
  | "network_error"
  | "unknown";

export type BookingStatus =
  | "to_invite"
  | "pending_reply"
  | "booked"
  | "rescheduled"
  | "no_show"
  | "arrived"
  | "feedback_done"
  | "strong_intent"
  | "registered"
  | "not_now";

export type DataSource = "crawler" | "manual" | "csv";

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account extends BaseRecord {
  name: string;
  type: AccountType;
  campus: Campus;
  owner: string;
  avatarUrl?: string;
  profileUrl: string;
  positioning: string;
  notes?: string;
  status: "active" | "paused" | "risk";
  followers: number;
  totalEngagement: number;
  posts: number;
  lastSnapshotAt: string;
  weekExpected: number;
  weekPublished: number;
  dataPending: number;
  leads: {
    dm: number;
    assessments: number;
    groups: number;
    bookings: number;
    aLevel: number;
  };
}

export interface GrowthTask extends BaseRecord {
  assignedDate: string;
  assignedAccountId: string;
  campus: Campus;
  contentType: ContentType;
  suggestedTitle: string;
  hook: string;
  requiredAssets: string[];
  cta: string;
  complianceNote: string;
  status: TaskStatus;
  noteUrl?: string;
  sourceLeadIds?: string[];
  metrics?: {
    likes: number;
    saves: number;
    comments: number;
    dm: number;
    assessments: number;
    bookings: number;
  };
}

export interface CrawlTarget extends BaseRecord {
  targetType: "account" | "profile" | "note" | "benchmark";
  accountId: string;
  noteId?: string;
  url: string;
  cadence: "3d";
  crawlFrequency?: "3d";
  isActive?: boolean;
  status: "active" | "paused" | "manual";
  lastCrawledAt?: string;
  nextCrawledAt?: string;
}

export interface CrawlRun extends BaseRecord {
  startedAt: string;
  finishedAt: string;
  status: "success" | "partial" | "partial_failed" | "failed";
  targetCount: number;
  successCount: number;
  failedCount: number;
  source: DataSource;
}

export interface CrawlError extends BaseRecord {
  runId: string;
  targetId: string;
  url?: string;
  errorType: CrawlErrorType;
  message: string;
  createdAt: string;
  resolved: boolean;
}

export interface AccountSnapshot extends BaseRecord {
  accountId: string;
  capturedAt: string;
  followers: number;
  totalEngagement: number;
  posts: number;
  source: DataSource;
  note?: string;
  rawData?: Record<string, unknown>;
}

export interface XhsNote extends BaseRecord {
  taskId: string;
  accountId: string;
  title: string;
  url: string;
  publishedAt: string;
  contentType: ContentType;
  source?: DataSource;
  sourceLeadIds?: string[];
}

export interface NoteSnapshot extends BaseRecord {
  noteId: string;
  capturedAt: string;
  likes: number;
  saves: number;
  comments: number;
  source: DataSource;
  note?: string;
  rawData?: Record<string, unknown>;
}

export interface LeadActivity extends BaseRecord {
  at: string;
  actor: string;
  action: string;
  note: string;
}

export interface Lead extends BaseRecord {
  parentNickname: string;
  studentGrade: string;
  region: string;
  campus: Campus;
  sourceAccountId: string;
  sourceNoteId: string;
  painPoints: string[];
  intentScore: number;
  intentLevel: IntentLevel;
  stage: LeadStage;
  owner: string;
  nextAction: string;
  nextFollowUpAt: string;
  notes?: string;
  latestActivity: string;
  latestActivityAt: string;
  activities: LeadActivity[];
}

export interface Booking extends BaseRecord {
  leadId: string;
  campus: Campus;
  eventType: "定位课" | "开放日" | "体验课" | "家长沟通";
  title: string;
  scheduledAt: string;
  receptionTeacher?: string;
  capacity: number;
  bookedCount: number;
  status: BookingStatus;
  script: string;
  arrivalFeedback?: string;
  noShowReason?: string;
  recommendedClass?: string;
  nextAction: string;
}

export interface BenchmarkAccount extends BaseRecord {
  name: string;
  avatarUrl?: string;
  category: string;
  positioning: string;
  url: string;
  learnings: string[];
}

export interface BenchmarkNote extends BaseRecord {
  accountName: string;
  title: string;
  hook: string;
  coverFormula: string;
  commentInsight: string;
  reusableDirection: string;
}

export interface ReviewItem extends BaseRecord {
  title: string;
  owner: string;
  campus: Campus;
  score: number;
  reason: string;
}

export interface AuditLog extends BaseRecord {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  campus?: Campus;
  detail: Record<string, unknown>;
}
