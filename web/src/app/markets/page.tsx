import Link from "next/link";
import { TrendingUp, Activity, Lock, Plus } from "@/components/icons";
import { getMarketSummaries } from "@/lib/markets";
import { MARKET_STATUS } from "@/lib/abis";
import { MarketsExplorer } from "@/components/MarketsExplorer";
import { Button } from "@/components/ui/button";
import { displayStats } from "@/lib/demo";
import { formatUSDC } from "@/lib/format";
import { STATIC_MARKETS } from "@/lib/static-markets";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export default async function MarketsDashboardPage() {
  const onChain = await getMarketSummaries();

  // Merge on-chain markets with static preview markets.
  // On-chain always wins — if a static market has been deployed its address
  // won't match (real addresses are random), so both would appear until the
  // static entry is removed from static-markets.ts after seeding.
  const onChainAddrs = new Set(onChain.map((m) => m.address.toLowerCase()));
  const staticToShow = STATIC_MARKETS.filter(
    (m) => !onChainAddrs.has(m.address.toLowerCase()),
  );
  const markets = [...onChain, ...staticToShow];

  const open = markets.filter((m) => m.status === MARKET_STATUS.OPEN).length;

  // Aggregate display figures blend on-chain truth with seeded baselines.
  let totalVol = 0n;
  let totalBets = 0;
  for (const m of markets) {
    const realYes = m.status === MARKET_STATUS.RESOLVED ? m.yesPoolFinal : m.yesPoolSnapshot;
    const realNo = m.status === MARKET_STATUS.RESOLVED ? m.noPoolFinal : m.noPoolSnapshot;
    const s = displayStats(m.address, realYes, realNo, m.betCount);
    totalVol += s.volume;
    totalBets += s.betCount;
  }

  return (
    <div className="container py-8">
      {/* Dashboard header */}
      <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-foreground">
              <Activity className="h-3.5 w-3.5" />
              Live markets
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Markets
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Public odds, private positions. Take a side — your stake stays yours.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2 font-bold">
            <Link href="/create">
              <Plus className="h-4 w-4" />
              New market
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <DashStat icon={<TrendingUp className="h-4 w-4" />} value={`$${formatUSDC(totalVol, { decimals: 0 })}`} label="Total volume" />
          <DashStat icon={<Activity className="h-4 w-4" />} value={String(open)} label="Open now" accent />
          <DashStat icon={<Lock className="h-4 w-4" />} value={totalBets.toLocaleString()} label="Encrypted positions" />
        </div>
      </div>

      <div className="mt-8">
        <MarketsExplorer markets={markets} />
      </div>
    </div>
  );
}

function DashStat({
  icon, value, label, accent,
}: {
  icon: React.ReactNode; value: string; label: string; accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-extrabold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
