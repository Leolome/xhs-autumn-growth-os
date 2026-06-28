import { NextResponse } from "next/server";

import { hasSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "xhs-autumn-growth-os",
    mode: hasSupabaseConfig() ? "supabase" : "mock-fallback",
    authRequired: process.env.AUTH_REQUIRED === "true",
    timestamp: new Date().toISOString(),
  });
}
