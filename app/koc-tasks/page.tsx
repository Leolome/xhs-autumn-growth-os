import { KocPage } from "@/components/koc/koc-page";
import { filterByCampus } from "@/lib/auth/permissions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getAccounts } from "@/lib/services/accounts";
import { getTasks } from "@/lib/services/tasks";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUserContext();
  const [accounts, tasks] = await Promise.all([getAccounts(), getTasks()]);
  return <KocPage accounts={filterByCampus(accounts, user)} tasks={filterByCampus(tasks, user)} user={user} />;
}
