"use client";

import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { roleLabels, type UserContext } from "@/lib/auth/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function UserMenu({ user }: { user?: UserContext }) {
  const router = useRouter();

  if (!user) return null;

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="rounded-lg bg-white p-3 text-xs leading-5 text-[var(--muted-foreground)]">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[var(--foreground)]">{user.displayName}</p>
          <p>{roleLabels[user.role]}</p>
          <p>{user.campus ?? "全部校区"}</p>
          {user.isMock ? <p className="mt-1 text-amber-700">内部演示模式</p> : null}
        </div>
      </div>
      {!user.isMock ? (
        <Button className="mt-3 w-full" type="button" variant="outline" onClick={handleSignOut}>
          <LogOut data-icon="inline-start" />
          退出
        </Button>
      ) : null}
    </div>
  );
}
