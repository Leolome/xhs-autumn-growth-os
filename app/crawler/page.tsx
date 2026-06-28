import { CrawlerPage } from "@/components/crawler/crawler-page";
import {
  filterByCampus,
  scopeAccountSnapshots,
  scopeCrawlTargets,
  scopeNoteSnapshots,
  scopeNotesByAccounts,
} from "@/lib/auth/permissions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getAccounts } from "@/lib/services/accounts";
import { getCrawlerData } from "@/lib/services/crawler";
import { getXhsNotes } from "@/lib/services/notes";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUserContext();
  const [accounts, xhsNotes, crawler] = await Promise.all([getAccounts(), getXhsNotes(), getCrawlerData()]);
  const scopedAccounts = filterByCampus(accounts, user);
  const scopedNotes = scopeNotesByAccounts(xhsNotes, scopedAccounts);
  const scopedTargets = scopeCrawlTargets(crawler.crawlTargets, scopedAccounts, scopedNotes);
  const scopedTargetIds = new Set(scopedTargets.map((target) => target.id));
  return (
    <CrawlerPage
      accounts={scopedAccounts}
      xhsNotes={scopedNotes}
      crawlTargets={scopedTargets}
      crawlRuns={crawler.crawlRuns}
      crawlErrors={crawler.crawlErrors.filter((error) => !error.targetId || scopedTargetIds.has(error.targetId))}
      accountSnapshots={scopeAccountSnapshots(crawler.accountSnapshots, scopedAccounts)}
      noteSnapshots={scopeNoteSnapshots(crawler.noteSnapshots, scopedNotes)}
      user={user}
    />
  );
}
