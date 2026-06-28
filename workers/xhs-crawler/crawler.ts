import { readFile } from "node:fs/promises";
import path from "node:path";

import type { CrawlerConfig } from "./config";
import { parseNote, parseProfile } from "./parser";
import { CrawlerError, type CrawlResult, type WorkerTarget } from "./types";

function hash(input: string) {
  return [...input].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function simulatedResult(target: WorkerTarget): CrawlResult {
  const seed = hash(target.id);
  if (target.targetType === "note") {
    return {
      targetType: "note",
      accountId: target.accountId,
      noteId: target.noteId,
      noteUrl: target.url,
      title: `模拟笔记 ${target.id}`,
      likes: 20 + (seed % 80),
      collects: 8 + (seed % 30),
      comments: 2 + (seed % 15),
      publishTime: new Date().toISOString(),
      rawData: { mode: "dry-run", seed },
    };
  }

  return {
    targetType: target.targetType,
    accountId: target.accountId ?? "",
    profileUrl: target.url,
    displayName: `模拟账号 ${target.accountId ?? target.id}`,
    followers: 1000 + (seed % 500),
    totalLikesCollects: 5000 + (seed % 1200),
    postCount: 20 + (seed % 20),
    rawData: { mode: "dry-run", seed },
  };
}

async function readFixture(config: CrawlerConfig, target: WorkerTarget) {
  const fileName = target.targetType === "note" ? "note.json" : "profile.html";
  return readFile(path.join(process.cwd(), config.fixturesDir, fileName), "utf8");
}

async function fetchPublicPage(config: CrawlerConfig, target: WorkerTarget) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(target.url, {
      signal: controller.signal,
      headers: {
        "user-agent": "XHS-Autumn-Growth-OS/1.0 low-frequency-public-metrics-monitor",
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      },
    });

    if (response.status === 404) throw new CrawlerError("not_found", `公开页面不存在：${response.status}`);
    if (response.status === 401 || response.status === 403 || response.status === 429) throw new CrawlerError("blocked", `公开页面访问受限：${response.status}`);
    if (!response.ok) throw new CrawlerError("network_error", `公开页面响应异常：${response.status}`);

    const text = await response.text();
    if (/captcha|验证|访问过于频繁|安全验证/i.test(text)) {
      throw new CrawlerError("blocked", "公开页面出现验证或访问限制，本轮停止解析该目标。");
    }
    return text;
  } catch (error) {
    if (error instanceof CrawlerError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new CrawlerError("timeout", "公开页面请求超时。");
    throw new CrawlerError("network_error", error instanceof Error ? error.message : "公开页面网络请求失败。");
  } finally {
    clearTimeout(timeout);
  }
}

export async function crawlTarget(config: CrawlerConfig, target: WorkerTarget): Promise<CrawlResult> {
  if (config.mode === "dry-run") return simulatedResult(target);

  const content = config.mode === "fixture" ? await readFixture(config, target) : await fetchPublicPage(config, target);
  if (target.targetType === "note") return parseNote(content, target.url, target.accountId, target.noteId);
  return parseProfile(content, target.url, target.accountId);
}

export async function delay(ms: number) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}
