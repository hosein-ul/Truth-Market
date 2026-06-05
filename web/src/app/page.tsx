import { getMarketSummaries } from "@/lib/markets";
import { MARKET_STATUS } from "@/lib/abis";
import { Landing } from "@/components/landing/Landing";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export default async function HomePage() {
  const markets = await getMarketSummaries();
  // Prefer open markets for the featured strip; fall back to whatever exists.
  const open = markets.filter((m) => m.status === MARKET_STATUS.OPEN);
  const featured = (open.length > 0 ? open : markets).slice(0, 3);
  return <Landing featured={featured} />;
}
