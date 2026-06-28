import { xhsNotes as mockNotes } from "@/data/mock-crawler";
import { createServerSupabaseDataClient } from "@/lib/supabase/server";
import { mapXhsNoteRow, xhsNoteToRow } from "@/lib/services/mappers";
import type { XhsNote } from "@/lib/types";

export async function getXhsNotes(): Promise<XhsNote[]> {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return mockNotes;

  const { data, error } = await supabase.from("xhs_notes").select("*").order("published_at", { ascending: false });
  if (error || !data?.length) return mockNotes;

  return data.map(mapXhsNoteRow);
}

export async function upsertXhsNote(note: XhsNote) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const { error } = await supabase.from("xhs_notes").upsert([xhsNoteToRow(note)], { onConflict: "id" });
  return { ok: !error, error: error?.message };
}
