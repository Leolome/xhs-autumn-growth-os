import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getCurrentUserContext } from "@/lib/auth/session";
import { filterByCampus } from "@/lib/auth/permissions";
import { getDashboardData } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUserContext();
  const { accounts, tasks, leads } = await getDashboardData();
  return (
    <DashboardPage
      accounts={filterByCampus(accounts, user)}
      tasks={filterByCampus(tasks, user)}
      leads={filterByCampus(leads, user)}
      user={user}
    />
  );
}
