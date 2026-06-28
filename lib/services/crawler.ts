import {
  accountSnapshots as mockAccountSnapshots,
  crawlErrors as mockCrawlErrors,
  crawlRuns as mockCrawlRuns,
  crawlTargets as mockCrawlTargets,
  noteSnapshots as mockNoteSnapshots,
} from "@/data/mock-crawler";
import { createServerSupabaseDataClient } from "@/lib/supabase/server";
import {
  accountSnapshotToRow,
  mapAccountSnapshotRow,
  mapCrawlErrorRow,
  mapCrawlRunRow,
  mapCrawlTargetRow,
  mapNoteSnapshotRow,
  noteSnapshotToRow,
} from "@/lib/services/mappers";
import type { AccountSnapshot, NoteSnapshot } from "@/lib/types";

export async function getCrawlerData() {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) {
    return {
      crawlTargets: mockCrawlTargets,
      crawlRuns: mockCrawlRuns,
      crawlErrors: mockCrawlErrors,
      accountSnapshots: mockAccountSnapshots,
      noteSnapshots: mockNoteSnapshots,
    };
  }

  const [targets, runs, errors, accountSnapshots, noteSnapshots] = await Promise.all([
    supabase.from("crawl_targets").select("*").order("updated_at", { ascending: false }),
    supabase.from("crawl_runs").select("*").order("started_at", { ascending: false }),
    supabase.from("crawl_errors").select("*").order("created_at", { ascending: false }),
    supabase.from("account_snapshots").select("*").order("captured_at", { ascending: false }),
    supabase.from("note_snapshots").select("*").order("captured_at", { ascending: false }),
  ]);

  if (targets.error || runs.error || errors.error || accountSnapshots.error || noteSnapshots.error) {
    return {
      crawlTargets: mockCrawlTargets,
      crawlRuns: mockCrawlRuns,
      crawlErrors: mockCrawlErrors,
      accountSnapshots: mockAccountSnapshots,
      noteSnapshots: mockNoteSnapshots,
    };
  }

  return {
    crawlTargets: targets.data?.map(mapCrawlTargetRow) ?? mockCrawlTargets,
    crawlRuns: runs.data?.map(mapCrawlRunRow) ?? mockCrawlRuns,
    crawlErrors: errors.data?.map(mapCrawlErrorRow) ?? mockCrawlErrors,
    accountSnapshots: accountSnapshots.data?.map(mapAccountSnapshotRow) ?? mockAccountSnapshots,
    noteSnapshots: noteSnapshots.data?.map(mapNoteSnapshotRow) ?? mockNoteSnapshots,
  };
}

export async function upsertAccountSnapshot(snapshot: AccountSnapshot) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };
  const { error } = await supabase.from("account_snapshots").upsert([accountSnapshotToRow(snapshot)], { onConflict: "id" });
  return { ok: !error, error: error?.message };
}

export async function upsertNoteSnapshot(snapshot: NoteSnapshot) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };
  const { error } = await supabase.from("note_snapshots").upsert([noteSnapshotToRow(snapshot)], { onConflict: "id" });
  return { ok: !error, error: error?.message };
}
