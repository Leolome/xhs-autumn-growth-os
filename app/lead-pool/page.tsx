import { LeadPoolPage } from "@/components/leads/lead-pool-page";
import { filterByCampus, scopeNotesByAccounts } from "@/lib/auth/permissions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getAccounts } from "@/lib/services/accounts";
import { getBookings } from "@/lib/services/bookings";
import { getLeads } from "@/lib/services/leads";
import { getXhsNotes } from "@/lib/services/notes";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUserContext();
  const [accounts, leads, notes, bookings] = await Promise.all([getAccounts(), getLeads(), getXhsNotes(), getBookings()]);
  const scopedAccounts = filterByCampus(accounts, user);
  return (
    <LeadPoolPage
      initialAccounts={scopedAccounts}
      initialLeads={filterByCampus(leads, user)}
      initialNotes={scopeNotesByAccounts(notes, scopedAccounts)}
      initialBookings={filterByCampus(bookings, user)}
      user={user}
    />
  );
}
