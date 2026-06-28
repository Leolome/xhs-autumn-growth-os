import { MobileNav } from "@/components/app/mobile-nav";
import { SidebarNav } from "@/components/app/sidebar-nav";
import type { UserContext } from "@/lib/auth/types";

export function AppShell({ children, user }: { children: React.ReactNode; user?: UserContext }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-screen">
        <SidebarNav user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav user={user} />
          <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
