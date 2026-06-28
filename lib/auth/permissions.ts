import type { UserContext, UserRole } from "@/lib/auth/types";
import type { Account, AccountSnapshot, Booking, Campus, CrawlTarget, GrowthTask, Lead, NoteSnapshot, XhsNote } from "@/lib/types";

const globalRoles: UserRole[] = ["admin", "operator"];

export function canViewAllCampuses(user: UserContext) {
  return globalRoles.includes(user.role);
}

export function canWriteAllCampuses(user: UserContext) {
  return globalRoles.includes(user.role);
}

export function canManageUsers(user: UserContext) {
  return globalRoles.includes(user.role);
}

export function canReadCampus(user: UserContext, campus: Campus | null | undefined) {
  if (!campus || canViewAllCampuses(user)) return true;
  return user.campus === campus;
}

export function canWriteCampus(user: UserContext, campus: Campus | null | undefined) {
  if (user.role === "viewer") return false;
  if (!campus || canWriteAllCampuses(user)) return true;
  return user.campus === campus;
}

export function filterByCampus<T extends { campus: Campus }>(items: T[], user: UserContext) {
  return items.filter((item) => canReadCampus(user, item.campus));
}

export function scopeNotesByAccounts(notes: XhsNote[], accounts: Account[]) {
  const accountIds = new Set(accounts.map((account) => account.id));
  return notes.filter((note) => accountIds.has(note.accountId));
}

export function scopeAccountSnapshots(snapshots: AccountSnapshot[], accounts: Account[]) {
  const accountIds = new Set(accounts.map((account) => account.id));
  return snapshots.filter((snapshot) => accountIds.has(snapshot.accountId));
}

export function scopeNoteSnapshots(snapshots: NoteSnapshot[], notes: XhsNote[]) {
  const noteIds = new Set(notes.map((note) => note.id));
  return snapshots.filter((snapshot) => noteIds.has(snapshot.noteId));
}

export function scopeCrawlTargets(targets: CrawlTarget[], accounts: Account[], notes: XhsNote[]) {
  const accountIds = new Set(accounts.map((account) => account.id));
  const noteIds = new Set(notes.map((note) => note.id));
  return targets.filter((target) => {
    if (target.accountId && accountIds.has(target.accountId)) return true;
    if (target.noteId && noteIds.has(target.noteId)) return true;
    return !target.accountId && !target.noteId;
  });
}

export function scopeTasksByCampus(tasks: GrowthTask[], user: UserContext) {
  return filterByCampus(tasks, user);
}

export function scopeLeadsByCampus(leads: Lead[], user: UserContext) {
  return filterByCampus(leads, user);
}

export function scopeBookingsByCampus(bookings: Booking[], user: UserContext) {
  return filterByCampus(bookings, user);
}
