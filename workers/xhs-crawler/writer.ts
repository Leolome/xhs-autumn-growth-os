import type { SupabaseClient } from "@supabase/supabase-js";

import type { CrawlerConfig } from "./config";
import { logger } from "./logger";
import { nextCrawlTime } from "./scheduler";
import { CrawlerError, type CrawlResult, type WorkerRunStatus, type WorkerTarget } from "./types";

type RunRecord = {
  id: string;
  startedAt: string;
};

function idPart(input: string) {
  return input.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
}

function nowIso() {
  return new Date().toISOString();
}

export class CrawlWriter {
  private supabase: SupabaseClient | null;
  private shouldWrite: boolean;

  constructor(config: CrawlerConfig, supabase: SupabaseClient | null) {
    this.supabase = supabase;
    this.shouldWrite = config.writeToSupabase && Boolean(supabase);
  }

  get isPersistent() {
    return this.shouldWrite;
  }

  async createRun(targetCount: number): Promise<RunRecord> {
    const startedAt = nowIso();
    const run = {
      id: `run-${startedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
      created_at: startedAt,
      updated_at: startedAt,
      started_at: startedAt,
      finished_at: startedAt,
      status: "failed",
      target_count: targetCount,
      success_count: 0,
      failed_count: 0,
      source: "crawler",
    };

    if (this.shouldWrite) {
      const { error } = await this.supabase!.from("crawl_runs").insert(run);
      if (error) throw new Error(`Failed to create crawl_run: ${error.message}`);
    }
    logger.info("crawl_run created", { runId: run.id, targetCount, persistent: this.shouldWrite });
    return { id: run.id, startedAt };
  }

  async completeRun(run: RunRecord, successCount: number, failedCount: number) {
    const finishedAt = nowIso();
    const status: WorkerRunStatus = successCount > 0 && failedCount === 0 ? "success" : successCount > 0 ? "partial_failed" : "failed";
    const update = {
      updated_at: finishedAt,
      finished_at: finishedAt,
      status,
      success_count: successCount,
      failed_count: failedCount,
    };

    if (this.shouldWrite) {
      const { error } = await this.supabase!.from("crawl_runs").update(update).eq("id", run.id);
      if (error) throw new Error(`Failed to complete crawl_run: ${error.message}`);
    }
    logger.info("crawl_run completed", { runId: run.id, status, successCount, failedCount, persistent: this.shouldWrite });
  }

  async writeResult(run: RunRecord, target: WorkerTarget, result: CrawlResult) {
    const capturedAt = nowIso();
    if (result.targetType === "note") {
      const noteId = await this.ensureNote(target, result);
      const row = {
        id: `note-snapshot-${idPart(noteId)}-${Date.now()}`,
        created_at: capturedAt,
        updated_at: capturedAt,
        note_id: noteId,
        captured_at: capturedAt,
        likes: result.likes,
        saves: result.collects,
        comments: result.comments,
        source: "crawler",
        note: `worker ${run.id}`,
        raw_data: result.rawData ?? {},
      };
      if (this.shouldWrite) {
        const { error } = await this.supabase!.from("note_snapshots").upsert(row, { onConflict: "id" });
        if (error) throw new Error(`Failed to write note_snapshot: ${error.message}`);
      }
      logger.info("note_snapshot prepared", { runId: run.id, targetId: target.id, noteId, persistent: this.shouldWrite });
      return;
    }

    if (!result.accountId) throw new CrawlerError("parse_error", "账号目标缺少 account_id，无法写入 account_snapshots。");
    const row = {
      id: `account-snapshot-${idPart(result.accountId)}-${Date.now()}`,
      created_at: capturedAt,
      updated_at: capturedAt,
      account_id: result.accountId,
      captured_at: capturedAt,
      followers: result.followers,
      total_engagement: result.totalLikesCollects,
      posts: result.postCount,
      source: "crawler",
      note: `worker ${run.id}`,
      raw_data: result.rawData ?? {},
    };
    if (this.shouldWrite) {
      const { error } = await this.supabase!.from("account_snapshots").upsert(row, { onConflict: "id" });
      if (error) throw new Error(`Failed to write account_snapshot: ${error.message}`);
    }
    logger.info("account_snapshot prepared", { runId: run.id, targetId: target.id, accountId: result.accountId, persistent: this.shouldWrite });
  }

  async writeError(run: RunRecord, target: WorkerTarget, error: unknown) {
    const createdAt = nowIso();
    const crawlerError = error instanceof CrawlerError ? error : new CrawlerError("unknown", error instanceof Error ? error.message : "未知采集错误");
    const row = {
      id: `err-${idPart(target.id)}-${Date.now()}`,
      created_at: createdAt,
      updated_at: createdAt,
      crawl_run_id: run.id,
      target_id: target.id,
      url: target.url,
      error_type: crawlerError.errorType,
      message: crawlerError.message,
      resolved: false,
    };
    if (this.shouldWrite) {
      const { error: writeError } = await this.supabase!.from("crawl_errors").insert(row);
      if (writeError) logger.error("failed to write crawl_error", { targetId: target.id, error: writeError.message });
    }
    logger.warn("crawl target failed", { runId: run.id, targetId: target.id, errorType: crawlerError.errorType, message: crawlerError.message, persistent: this.shouldWrite });
  }

  async markTargetSuccess(target: WorkerTarget) {
    const lastCrawledAt = nowIso();
    const update = {
      updated_at: lastCrawledAt,
      last_crawled_at: lastCrawledAt,
      next_crawled_at: nextCrawlTime(new Date(lastCrawledAt)),
    };
    if (this.shouldWrite) {
      const { error } = await this.supabase!.from("crawl_targets").update(update).eq("id", target.id);
      if (error) logger.error("failed to update crawl_target schedule", { targetId: target.id, error: error.message });
    }
  }

  private async ensureNote(target: WorkerTarget, result: Extract<CrawlResult, { targetType: "note" }>) {
    if (target.noteId || result.noteId) return target.noteId ?? result.noteId!;
    if (!target.accountId && !result.accountId) throw new CrawlerError("parse_error", "笔记目标缺少 account_id，无法创建最小 xhs_notes。");

    const noteId = `note-crawler-${idPart(target.url)}`;
    const now = nowIso();
    const row = {
      id: noteId,
      created_at: now,
      updated_at: now,
      task_id: null,
      account_id: target.accountId ?? result.accountId!,
      title: result.title || "公开笔记",
      url: result.noteUrl,
      published_at: result.publishTime ?? now,
      content_type: "其他",
      source: "crawler",
      source_lead_ids: [],
    };
    if (this.shouldWrite) {
      const { error } = await this.supabase!.from("xhs_notes").upsert(row, { onConflict: "id" });
      if (error) throw new Error(`Failed to ensure xhs_note: ${error.message}`);
    }
    logger.info("xhs_note ensured", { noteId, targetId: target.id, persistent: this.shouldWrite });
    return noteId;
  }
}
