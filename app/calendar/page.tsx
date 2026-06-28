import { CalendarPage } from "@/components/calendar/calendar-page";
import { filterByCampus, scopeNotesByAccounts } from "@/lib/auth/permissions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getAccounts } from "@/lib/services/accounts";
import { getLeads } from "@/lib/services/leads";
import { getXhsNotes } from "@/lib/services/notes";
import { getTasks } from "@/lib/services/tasks";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUserContext();
  const [accounts, tasks, notes, leads] = await Promise.all([getAccounts(), getTasks(), getXhsNotes(), getLeads()]);
  const scopedAccounts = filterByCampus(accounts, user);
  return (
    <CalendarPage
      initialAccounts={scopedAccounts}
      initialTasks={filterByCampus(tasks, user)}
      initialNotes={scopeNotesByAccounts(notes, scopedAccounts)}
      initialLeads={filterByCampus(leads, user)}
      user={user}
    />
  );
}
