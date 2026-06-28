import { crawlTarget, delay } from "./crawler";
import { getCrawlerConfig } from "./config";
import { logger } from "./logger";
import { loadDueTargets } from "./scheduler";
import { createWorkerSupabaseClient } from "./supabase";
import { CrawlWriter } from "./writer";

async function main() {
  const config = getCrawlerConfig();
  const supabase = createWorkerSupabaseClient(config);
  const writer = new CrawlWriter(config, supabase);

  if (config.writeToSupabase && !supabase) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when writing to Supabase.");
  }

  logger.info("xhs crawler started", {
    mode: config.mode,
    persistent: writer.isPersistent,
    requestDelayMs: config.mode === "live-public" ? config.requestDelayMs : 0,
  });

  const targets = await loadDueTargets(config, supabase);
  const run = await writer.createRun(targets.length);
  let successCount = 0;
  let failedCount = 0;

  for (const target of targets) {
    try {
      logger.info("crawl target started", { targetId: target.id, targetType: target.targetType });
      const result = await crawlTarget(config, target);
      await writer.writeResult(run, target, result);
      await writer.markTargetSuccess(target);
      successCount += 1;
      logger.info("crawl target succeeded", { targetId: target.id, targetType: target.targetType });
    } catch (error) {
      failedCount += 1;
      await writer.writeError(run, target, error);
    }

    if (config.mode === "live-public") await delay(config.requestDelayMs);
  }

  await writer.completeRun(run, successCount, failedCount);
  logger.info("xhs crawler finished", { runId: run.id, targetCount: targets.length, successCount, failedCount, persistent: writer.isPersistent });
}

main().catch((error) => {
  logger.error("xhs crawler crashed", { message: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
});
