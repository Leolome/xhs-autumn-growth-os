import { getAccounts } from "@/lib/services/accounts";
import { getBookings } from "@/lib/services/bookings";
import { getCrawlerData } from "@/lib/services/crawler";
import { getLeads } from "@/lib/services/leads";
import { getXhsNotes } from "@/lib/services/notes";
import { getTasks } from "@/lib/services/tasks";

export async function getDashboardData() {
  const [accounts, tasks, leads, bookings, notes, crawler] = await Promise.all([
    getAccounts(),
    getTasks(),
    getLeads(),
    getBookings(),
    getXhsNotes(),
    getCrawlerData(),
  ]);

  return {
    accounts,
    tasks,
    leads,
    bookings,
    notes,
    ...crawler,
  };
}

