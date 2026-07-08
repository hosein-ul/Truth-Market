import { getMarketSummaries } from "@/lib/markets";
import { MARKET_STATUS } from "@/lib/abis";
import { Landing } from "@/components/landing/Landing";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export default async function HomePage() {
  let markets: any[] = [];
  try {
    markets = await getMarketSummaries();
  } catch (error) {
    console.error("Failed to fetch market summaries:", error);
  }
  const open = markets.filter((m) => m.status === MARKET_STATUS.OPEN);
  // Trending = most positions first (real on-chain bet counts).
  const featured = [...(open.length > 0 ? open : markets)]
    .sort((a, b) => b.betCount - a.betCount)
    .slice(0, 3);
  const stats = {
    markets: open.length,
    positions: markets.reduce((acc, m) => acc + m.betCount, 0),
    settled: markets.filter(
      (m) => m.status === MARKET_STATUS.RESOLVED || m.status === MARKET_STATUS.VOIDED,
    ).length,
  };
  return <Landing featured={featured} stats={stats} />;
}
