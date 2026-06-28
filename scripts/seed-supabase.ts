import "dotenv/config";

import { accounts } from "../data/mock-accounts";
import { tasks } from "../data/mock-tasks";
import { benchmarkAccounts, benchmarkNotes } from "../data/mock-benchmarks";
import {
  accountSnapshots,
  crawlErrors,
  crawlRuns,
  crawlTargets,
  noteSnapshots,
  xhsNotes,
} from "../data/mock-crawler";
import { bookings } from "../data/mock-invitations";
import { leads } from "../data/mock-leads";
import { nextWeekActions } from "../data/mock-review";
import { createServiceSupabaseClient } from "../lib/supabase/server";
import { hasSupabaseServiceConfig } from "../lib/supabase/config";
import {
  accountSnapshotToRow,
  accountToRow,
  bookingToRow,
  crawlErrorToRow,
  crawlRunToRow,
  crawlTargetToRow,
  leadActivityToRow,
  leadToRow,
  noteSnapshotToRow,
  taskToRow,
  xhsNoteToRow,
} from "../lib/services/mappers";

type SeedDb = {
  from: (table: string) => {
    upsert: (
      rows: Array<Record<string, unknown>>,
      options: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
  };
};

async function upsertOrThrow(table: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const supabase = createServiceSupabaseClient();
  if (!supabase) throw new Error("Missing Supabase service client");

  const db = supabase as unknown as SeedDb;
  const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`seeded ${table}: ${rows.length}`);
}

async function main() {
  if (!hasSupabaseServiceConfig()) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running seed.");
  }

  await upsertOrThrow("accounts", accounts.map(accountToRow));
  await upsertOrThrow("tasks", tasks.map(taskToRow));
  await upsertOrThrow("xhs_notes", xhsNotes.map(xhsNoteToRow));
  await upsertOrThrow("leads", leads.map(leadToRow));
  await upsertOrThrow(
    "lead_activities",
    leads.flatMap((lead) => lead.activities.map((activity) => leadActivityToRow(activity, lead.id))),
  );
  await upsertOrThrow("bookings", bookings.map(bookingToRow));
  await upsertOrThrow("crawl_runs", crawlRuns.map(crawlRunToRow));
  await upsertOrThrow("crawl_targets", crawlTargets.map(crawlTargetToRow));
  await upsertOrThrow("crawl_errors", crawlErrors.map(crawlErrorToRow));
  await upsertOrThrow("account_snapshots", accountSnapshots.map(accountSnapshotToRow));
  await upsertOrThrow("note_snapshots", noteSnapshots.map(noteSnapshotToRow));
  await upsertOrThrow(
    "benchmarks",
    benchmarkAccounts.map((item) => ({
      id: item.id,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      name: item.name,
      avatar_url: item.avatarUrl ?? null,
      category: item.category,
      positioning: item.positioning,
      url: item.url,
      learnings: item.learnings,
    })),
  );
  await upsertOrThrow(
    "benchmark_notes",
    benchmarkNotes.map((item) => ({
      id: item.id,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      account_name: item.accountName,
      title: item.title,
      hook: item.hook,
      cover_formula: item.coverFormula,
      comment_insight: item.commentInsight,
      reusable_direction: item.reusableDirection,
    })),
  );
  await upsertOrThrow("review_weekly_summaries", [
    {
      id: "review-week-2026-07-24",
      created_at: "2026-07-24T17:00:00",
      updated_at: "2026-07-24T17:00:00",
      week_start: "2026-07-20",
      week_end: "2026-07-26",
      summary: {
        theme: "小红书秋招获客周复盘",
        focus: "内容任务、私信承接、体检、邀约到课",
      },
      next_actions: nextWeekActions.map((action) => ({
        id: action.id,
        title: action.title,
        owner: action.owner,
        campus: action.campus,
        score: action.score,
        reason: action.reason,
      })),
    },
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
