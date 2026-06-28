import { createBrowserClient } from "@supabase/ssr";

import { hasSupabaseConfig } from "@/lib/supabase/config";

export function createBrowserSupabaseClient() {
  if (!hasSupabaseConfig()) return null;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
