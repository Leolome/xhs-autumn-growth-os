import { accounts as mockAccounts } from "@/data/mock-accounts";
import { createServerSupabaseDataClient } from "@/lib/supabase/server";
import type { Account } from "@/lib/types";
import { accountToRow, mapAccountRow } from "@/lib/services/mappers";

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return mockAccounts;

  const { data, error } = await supabase.from("accounts").select("*").order("created_at");
  if (error || !data?.length) return mockAccounts;

  return data.map(mapAccountRow);
}

export async function upsertAccount(account: Account) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const { error } = await supabase.from("accounts").upsert([accountToRow(account)], { onConflict: "id" });
  return { ok: !error, error: error?.message };
}
