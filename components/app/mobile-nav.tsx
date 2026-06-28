"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { roleLabels, type UserContext } from "@/lib/auth/types";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MobileNav({ user }: { user?: UserContext }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/92 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold leading-tight">XHS Growth OS</p>
          <p className="text-xs text-[var(--muted-foreground)]">秋招增长驾驶舱</p>
        </div>
        {user ? (
          <div className="shrink-0 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-right text-xs">
            <p className="font-medium">{user.campus ?? "全部校区"}</p>
            <p className="text-[var(--muted-foreground)]">{roleLabels[user.role]}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-md border px-3 py-1.5 text-sm",
              pathname === item.href
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[var(--border)] bg-white text-[var(--muted-foreground)]",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
