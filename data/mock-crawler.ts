import { accounts } from "@/data/mock-accounts";
import { tasks } from "@/data/mock-tasks";
import type {
  AccountSnapshot,
  CrawlError,
  CrawlRun,
  CrawlTarget,
  NoteSnapshot,
  XhsNote,
} from "@/lib/types";

export const xhsNotes: XhsNote[] = tasks
  .filter((task) => task.noteUrl)
  .slice(0, 42)
  .map((task, index) => ({
    id: `note-${index + 1}`,
    createdAt: `${task.assignedDate}T20:40:00`,
    updatedAt: "2026-07-24T03:40:00",
    taskId: task.id,
    accountId: task.assignedAccountId,
    title: task.suggestedTitle,
    url: task.noteUrl!,
    publishedAt: `${task.assignedDate}T20:30:00`,
    contentType: task.contentType,
    sourceLeadIds: index < 10 ? [`lead-${String(index + 1).padStart(3, "0")}`] : [],
  }));

export const crawlTargets: CrawlTarget[] = [
  ...accounts.map((account) => ({
    id: `target-${account.id}`,
    createdAt: "2026-06-30T10:00:00",
    updatedAt: account.lastSnapshotAt,
    targetType: "account" as const,
    accountId: account.id,
    url: account.profileUrl,
    cadence: "3d" as const,
    status: account.status === "risk" ? ("manual" as const) : ("active" as const),
    lastCrawledAt: account.lastSnapshotAt,
    nextCrawledAt: "2026-07-31T03:00:00",
  })),
  ...xhsNotes.slice(0, 12).map((note) => ({
    id: `target-${note.id}`,
    createdAt: note.createdAt,
    updatedAt: "2026-07-24T03:40:00",
    targetType: "note" as const,
    accountId: note.accountId,
    noteId: note.id,
    url: note.url,
    cadence: "3d" as const,
    status: "active" as const,
    lastCrawledAt: "2026-07-24T03:40:00",
    nextCrawledAt: "2026-07-31T03:00:00",
  })),
];

export const crawlRuns: CrawlRun[] = [
  {
    id: "run-20260724",
    createdAt: "2026-07-24T03:00:00",
    updatedAt: "2026-07-24T03:42:00",
    startedAt: "2026-07-24T03:00:00",
    finishedAt: "2026-07-24T03:42:00",
    status: "partial",
    targetCount: 22,
    successCount: 19,
    failedCount: 3,
    source: "crawler",
  },
  {
    id: "run-20260717",
    createdAt: "2026-07-17T03:00:00",
    updatedAt: "2026-07-17T03:35:00",
    startedAt: "2026-07-17T03:00:00",
    finishedAt: "2026-07-17T03:35:00",
    status: "success",
    targetCount: 20,
    successCount: 20,
    failedCount: 0,
    source: "crawler",
  },
  {
    id: "run-20260710",
    createdAt: "2026-07-10T03:00:00",
    updatedAt: "2026-07-10T03:48:00",
    startedAt: "2026-07-10T03:00:00",
    finishedAt: "2026-07-10T03:48:00",
    status: "partial",
    targetCount: 18,
    successCount: 16,
    failedCount: 2,
    source: "crawler",
  },
];

export const crawlErrors: CrawlError[] = [
  {
    id: "err-1",
    createdAt: "2026-07-24T03:18:00",
    updatedAt: "2026-07-24T03:18:00",
    runId: "run-20260724",
    targetId: "target-acc-macky",
    errorType: "timeout",
    message: "账号主页响应超时，已提示人工补录。",
    resolved: false,
  },
  {
    id: "err-2",
    createdAt: "2026-07-24T03:25:00",
    updatedAt: "2026-07-24T03:25:00",
    runId: "run-20260724",
    targetId: "target-note-6",
    errorType: "parse_error",
    message: "笔记互动字段解析失败，保留上次快照。",
    resolved: false,
  },
  {
    id: "err-3",
    createdAt: "2026-07-24T03:31:00",
    updatedAt: "2026-07-24T09:00:00",
    runId: "run-20260724",
    targetId: "target-note-11",
    errorType: "blocked",
    message: "公开页面临时限制访问，等待下次低频重试。",
    resolved: true,
  },
];

export const accountSnapshots: AccountSnapshot[] = accounts.flatMap((account, accountIndex) =>
  ["2026-07-10T03:00:00", "2026-07-17T03:00:00", "2026-07-24T03:00:00"].map((capturedAt, index) => ({
    id: `snapshot-${account.id}-${index}`,
    createdAt: capturedAt,
    updatedAt: capturedAt,
    accountId: account.id,
    capturedAt,
    followers: account.followers - (2 - index) * (18 + accountIndex * 3),
    totalEngagement: account.totalEngagement - (2 - index) * (120 + accountIndex * 12),
    posts: account.posts - (2 - index),
    source: account.status === "risk" && index === 2 ? "manual" : "crawler",
  })),
);

export const noteSnapshots: NoteSnapshot[] = xhsNotes.slice(0, 18).flatMap((note, noteIndex) =>
  ["2026-07-10T03:00:00", "2026-07-17T03:00:00", "2026-07-24T03:00:00"].map((capturedAt, index) => ({
    id: `note-snapshot-${note.id}-${index}`,
    createdAt: capturedAt,
    updatedAt: capturedAt,
    noteId: note.id,
    capturedAt,
    likes: 18 + noteIndex * 7 + index * 16,
    saves: 6 + noteIndex * 2 + index * 7,
    comments: 2 + noteIndex + index * 3,
    source: index === 2 && noteIndex % 7 === 0 ? "manual" : noteIndex % 9 === 0 ? "csv" : "crawler",
  })),
);
