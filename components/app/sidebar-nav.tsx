"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardList,
  DatabaseZap,
  Handshake,
  LayoutDashboard,
  SearchCheck,
  UsersRound,
} from "lucide-react";

import { UserMenu } from "@/components/auth/user-menu";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { UserContext } from "@/lib/auth/types";

const icons = [
  LayoutDashboard,
  UsersRound,
  DatabaseZap,
  CalendarDays,
  ClipboardList,
  SearchCheck,
  Bot,
  Handshake,
  BarChart3,
];

export function SidebarNav({ user }: { user?: UserContext }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--border)] bg-[var(--sidebar)] lg:flex lg:flex-col">
      <div className="border-b border-[var(--border)] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-semibold text-white">
            XG
          </div>
          <div>
            <p className="text-sm font-semibold">XHS Autumn Growth OS</p>
            <p className="text-xs text-[var(--muted-foreground)]">重庆高途秋招驾驶舱</p>
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item, index) => {
          const Icon = icons[index];
          const active = pathname === item.href || (pathname === "/" && item.href === "/dashboard");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-[var(--sidebar-foreground)] hover:bg-white hover:text-[var(--foreground)]",
              )}
            >
              <Icon data-icon="inline-start" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{item.label}</span>
                <span className={cn("truncate text-xs", active ? "text-white/72" : "text-[var(--muted-foreground)]")}>
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-[var(--border)] p-4">
        <UserMenu user={user} />
        <div className="rounded-lg bg-white p-3 text-xs leading-5 text-[var(--muted-foreground)]">
          <p className="font-medium text-[var(--foreground)]">MVP 阶段</p>
          <p>当前使用 mock data。Crawler 仅展示结构与低频采集结果。</p>
        </div>
      </div>
    </aside>
  );
}
