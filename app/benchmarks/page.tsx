import { BenchmarksPage } from "@/components/benchmarks/benchmarks-page";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getBenchmarkData } from "@/lib/services/benchmarks";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUserContext();
  const data = await getBenchmarkData();
  return <BenchmarksPage {...data} user={user} />;
}
