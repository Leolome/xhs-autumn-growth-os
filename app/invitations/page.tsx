import { InvitationsPage } from "@/components/invitations/invitations-page";
import { filterByCampus } from "@/lib/auth/permissions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getBookings } from "@/lib/services/bookings";
import { getLeads } from "@/lib/services/leads";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUserContext();
  const [bookings, leads] = await Promise.all([getBookings(), getLeads()]);
  return (
    <InvitationsPage
      initialBookings={filterByCampus(bookings, user)}
      initialLeads={filterByCampus(leads, user)}
      user={user}
    />
  );
}
