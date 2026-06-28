import { benchmarkAccounts as mockBenchmarkAccounts, benchmarkNotes as mockBenchmarkNotes, forbiddenCases } from "@/data/mock-benchmarks";
import { createServerSupabaseDataClient } from "@/lib/supabase/server";
import type { BenchmarkAccountRow, BenchmarkNoteRow } from "@/lib/supabase/database.types";
import type { BenchmarkAccount, BenchmarkNote } from "@/lib/types";

function mapBenchmarkAccountRow(row: BenchmarkAccountRow): BenchmarkAccount {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    avatarUrl: row.avatar_url ?? undefined,
    category: row.category,
    positioning: row.positioning,
    url: row.url,
    learnings: row.learnings,
  };
}

function benchmarkAccountToRow(account: BenchmarkAccount): BenchmarkAccountRow {
  return {
    id: account.id,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
    created_by: null,
    updated_by: null,
    name: account.name,
    avatar_url: account.avatarUrl ?? null,
    category: account.category,
    positioning: account.positioning,
    url: account.url,
    learnings: account.learnings,
  };
}

function mapBenchmarkNoteRow(row: BenchmarkNoteRow): BenchmarkNote {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    accountName: row.account_name,
    title: row.title,
    hook: row.hook,
    coverFormula: row.cover_formula,
    commentInsight: row.comment_insight,
    reusableDirection: row.reusable_direction,
  };
}

export async function getBenchmarkData() {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) {
    return {
      benchmarkAccounts: mockBenchmarkAccounts,
      benchmarkNotes: mockBenchmarkNotes,
      forbiddenCases,
    };
  }

  const [accounts, notes] = await Promise.all([
    supabase.from("benchmarks").select("*").order("updated_at", { ascending: false }),
    supabase.from("benchmark_notes").select("*").order("updated_at", { ascending: false }),
  ]);

  return {
    benchmarkAccounts: accounts.error || !accounts.data?.length ? mockBenchmarkAccounts : accounts.data.map(mapBenchmarkAccountRow),
    benchmarkNotes: notes.error || !notes.data?.length ? mockBenchmarkNotes : notes.data.map(mapBenchmarkNoteRow),
    forbiddenCases,
  };
}

export async function upsertBenchmarkAccount(account: BenchmarkAccount) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const { error } = await supabase.from("benchmarks").upsert([benchmarkAccountToRow(account)], { onConflict: "id" });
  return { ok: !error, error: error?.message };
}
