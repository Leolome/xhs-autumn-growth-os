import type { DataSource } from "../../lib/types";

export type CrawlerMode = "dry-run" | "fixture" | "live-public";

export type WorkerTargetType = "profile" | "note" | "benchmark";

export type WorkerTarget = {
  id: string;
  accountId?: string;
  noteId?: string;
  targetType: WorkerTargetType;
  url: string;
  crawlFrequency: "3d";
  isActive: boolean;
  lastCrawledAt?: string;
  nextCrawledAt?: string;
};

export type ProfileMetrics = {
  targetType: "profile" | "benchmark";
  accountId: string;
  profileUrl: string;
  displayName: string;
  followers: number;
  totalLikesCollects: number;
  postCount: number;
  rawData?: Record<string, unknown>;
};

export type NoteMetrics = {
  targetType: "note";
  accountId?: string;
  noteId?: string;
  noteUrl: string;
  title: string;
  likes: number;
  collects: number;
  comments: number;
  publishTime?: string;
  rawData?: Record<string, unknown>;
};

export type CrawlResult = ProfileMetrics | NoteMetrics;

export type WorkerCrawlErrorType =
  | "timeout"
  | "blocked"
  | "parse_error"
  | "not_found"
  | "network_error"
  | "unknown";

export class CrawlerError extends Error {
  errorType: WorkerCrawlErrorType;

  constructor(errorType: WorkerCrawlErrorType, message: string) {
    super(message);
    this.name = "CrawlerError";
    this.errorType = errorType;
  }
}

export type WorkerRunStatus = "success" | "partial_failed" | "failed";

export type SnapshotSource = Extract<DataSource, "crawler">;
