import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { CrawlerConfig } from "./config";

export function createWorkerSupabaseClient(config: CrawlerConfig): SupabaseClient | null {
  if (!config.supabaseUrl || !config.serviceRoleKey) return null;

  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
