import Link from "next/link";
import { Lock, EyeOff, Trophy, ArrowRight } from "lucide-react";
import { getMarketSummaries } from "@/lib/markets";
import { MARKET_STATUS } from "@/lib/abis";
import { MarketsExplorer } from "@/components/MarketsExplorer";
import { Button } from "@/components/ui/button";

export const revalidate = 30;

export default async function HomePage() {
  const markets = await getMarketSummaries();
  const open = markets.filter((m) => m.status === MARKET_STATUS.OPEN).length;
  const totalTraders = markets.reduce((s, m) => s + m.traderCount, 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-mesh" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="container relative py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3.5 py-1.5 text-sm font-semibold text-violet-700 backdrop-blur">
              <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
              Your position stays private — always
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Trade on the future,{" "}
              <span className="text-gradient">privately</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              TruthMarket is a prediction market where every bet is sealed and
              encrypted on-chain. No one sees your size or your side — not whales,
              not insiders, not the crowd. Odds reveal only when the market settles.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" variant="gradient" className="w-full sm:w-auto">
                <Link href="#markets">
                  Explore markets
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
                <Link href="/create">Create a market</Link>
              </Button>
            </div>

            {/* Quick stats */}
            <div className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-3">
              <Stat value={markets.length} label="Markets" />
              <Stat value={open} label="Open now" />
              <Stat value={totalTraders} label="Positions" />
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container grid grid-cols-1 gap-6 py-10 sm:grid-cols-3">
          <Feature
            icon={<EyeOff className="h-5 w-5" />}
            title="Sealed positions"
            body="Your amount and side are encrypted before they ever touch the chain. The market can't be read while it's open."
          />
          <Feature
            icon={<Lock className="h-5 w-5" />}
            title="No herding"
            body="With odds hidden until settlement, there's no whale signal to chase and no crowd to follow. Bet your own conviction."
          />
          <Feature
            icon={<Trophy className="h-5 w-5" />}
            title="Private payouts"
            body="Winnings settle confidentially. Only your wallet can reveal what you earned — your edge stays yours."
          />
        </div>
      </section>

      {/* Markets */}
      <section id="markets" className="container scroll-mt-20 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">
              Markets
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick a question. Take a side. Stay sealed.
            </p>
          </div>
        </div>
        <MarketsExplorer markets={markets} />
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 px-4 py-3 backdrop-blur">
      <div className="font-display text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="inline-grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white shadow-soft">
        {icon}
      </div>
      <h3 className="mt-3 font-display text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
