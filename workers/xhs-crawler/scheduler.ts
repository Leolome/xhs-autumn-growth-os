import type { SupabaseClient } from "@supabase/supabase-js";

import { crawlTargets as mockTargets } from "../../data/mock-crawler";
import type { CrawlerConfig } from "./config";
import type { WorkerTarget, WorkerTargetType } from "./types";

type CrawlTargetRow = {
  id: string;
  account_id: string | null;
  note_id: string | null;
  target_type: "account" | "profile" | "note" | "benchmark";
  url: string;
  crawl_frequency?: "3d" | null;
  is_active?: boolean | null;
  status?: "active" | "paused" | "manual" | null;
  last_crawled_at?: string | null;
  next_crawled_at?: string | null;
};

function normalizeTargetType(type: CrawlTargetRow["target_type"]): WorkerTargetType {
  if (type === "account") return "profile";
  return type;
}

function toWorkerTarget(row: CrawlTargetRow): WorkerTarget {
  return {
    id: row.id,
    accountId: row.account_id ?? undefined,
    noteId: row.note_id ?? undefined,
    targetType: normalizeTargetType(row.target_type),
    url: row.url,
    crawlFrequency: row.crawl_frequency ?? "3d",
    isActive: row.is_active ?? row.status === "active",
    lastCrawledAt: row.last_crawled_at ?? undefined,
    nextCrawledAt: row.next_crawled_at ?? undefined,
  };
}

function isDue(target: WorkerTarget, now = new Date()) {
  if (!target.isActive) return false;
  if (!target.nextCrawledAt) return true;
  return new Date(target.nextCrawledAt).getTime() <= now.getTime();
}

function dryRunTargets(): WorkerTarget[] {
  const activeTargets = mockTargets.filter((target) => target.status === "active");
  const balancedTargets = [
    ...activeTargets.filter((target) => target.targetType === "account").slice(0, 4),
    ...activeTargets.filter((target) => target.targetType === "note").slice(0, 4),
  ];
  return balancedTargets
    .map((target) => ({
      id: target.id,
      accountId: target.accountId,
      noteId: target.noteId,
      targetType: target.targetType === "account" ? "profile" : target.targetType,
      url: target.url,
      crawlFrequency: "3d",
      isActive: true,
      lastCrawledAt: target.lastCrawledAt,
      nextCrawledAt: undefined,
    }));
}

export async function loadDueTargets(config: CrawlerConfig, supabase: SupabaseClient | null): Promise<WorkerTarget[]> {
  if (config.mode === "dry-run" || config.mode === "fixture" || !supabase) {
    return dryRunTargets().filter((target) => config.mode === "fixture" || isDue(target));
  }

  const { data, error } = await supabase
    .from("crawl_targets")
    .select("id, account_id, note_id, target_type, url, crawl_frequency, is_active, status, last_crawled_at, next_crawled_at")
    .eq("is_active", true)
    .order("next_crawled_at", { ascending: true, nullsFirst: true });

  if (error) throw new Error(`Failed to load crawl_targets: ${error.message}`);
  return (data ?? []).map((row) => toWorkerTarget(row as CrawlTargetRow)).filter((target) => isDue(target));
}

export function nextCrawlTime(from = new Date()) {
  const next = new Date(from);
  next.setUTCDate(next.getUTCDate() + 3);
  return next.toISOString();
}
