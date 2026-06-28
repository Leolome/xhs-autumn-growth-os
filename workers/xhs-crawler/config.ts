import "dotenv/config";

import type { CrawlerMode } from "./types";

export type CrawlerConfig = {
  mode: CrawlerMode;
  supabaseUrl?: string;
  serviceRoleKey?: string;
  requestTimeoutMs: number;
  requestDelayMs: number;
  writeToSupabase: boolean;
  fixturesDir: string;
};

function readArg(name: string) {
  const arg = process.argv.find((item) => item.startsWith(`${name}=`));
  return arg?.split("=").slice(1).join("=");
}

function resolveMode(): CrawlerMode {
  const raw = readArg("--mode") ?? process.env.CRAWLER_MODE ?? "dry-run";
  if (raw === "dry-run" || raw === "fixture" || raw === "live-public") return raw;
  throw new Error(`Unsupported crawler mode: ${raw}`);
}

export function getCrawlerConfig(): CrawlerConfig {
  const mode = resolveMode();
  return {
    mode,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    requestTimeoutMs: Number(process.env.CRAWLER_REQUEST_TIMEOUT_MS ?? 12000),
    requestDelayMs: Number(process.env.CRAWLER_REQUEST_DELAY_MS ?? 1500),
    writeToSupabase: mode === "live-public" || process.env.CRAWLER_WRITE_TO_SUPABASE === "true",
    fixturesDir: process.env.CRAWLER_FIXTURES_DIR ?? "workers/xhs-crawler/fixtures",
  };
}
