import { LoginForm } from "@/app/login/login-form";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <LoginForm hasSupabase={hasSupabaseConfig()} />
    </main>
  );
}
