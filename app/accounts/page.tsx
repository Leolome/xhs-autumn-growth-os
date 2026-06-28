import { AccountsPage } from "@/components/accounts/accounts-page";
import { filterByCampus, scopeAccountSnapshots } from "@/lib/auth/permissions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getAccounts } from "@/lib/services/accounts";
import { getCrawlerData } from "@/lib/services/crawler";
import { getTasks } from "@/lib/services/tasks";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUserContext();
  const [accounts, tasks, crawler] = await Promise.all([
    getAccounts(),
    getTasks(),
    getCrawlerData(),
  ]);
  const scopedAccounts = filterByCampus(accounts, user);
  return (
    <AccountsPage
      initialAccounts={scopedAccounts}
      tasks={filterByCampus(tasks, user)}
      accountSnapshots={scopeAccountSnapshots(crawler.accountSnapshots, scopedAccounts)}
      user={user}
    />
  );
}
