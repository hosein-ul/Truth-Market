import Link from "next/link";
import { Lock, EyeOff, Award, ArrowRight, Cpu, TrendingUp, BarChart3 } from "lucide-react";
import { getMarketSummaries } from "@/lib/markets";
import { MARKET_STATUS } from "@/lib/abis";
import { MarketsExplorer } from "@/components/MarketsExplorer";
import { ZamaExplainer } from "@/components/ZamaExplainer";
import { GenerativeHero } from "@/components/GenerativeHero";
import { Button } from "@/components/ui/button";
import { formatUSDC } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export default async function HomePage() {
  const markets = await getMarketSummaries();
  const open = markets.filter((m) => m.status === MARKET_STATUS.OPEN).length;
  const totalBets = markets.reduce((s, m) => s + m.betCount, 0);
  // Volume shown is whatever has been revealed in K-anonymity snapshots so far.
  const totalVol = markets.reduce(
    (s, m) => s + (m.status === MARKET_STATUS.RESOLVED ? m.yesPoolFinal + m.noPoolFinal : m.yesPoolSnapshot + m.noPoolSnapshot),
    0n,
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-hero-mesh" />
        {/* algorithmic art — Perlin flow-field ribbons (YES-orange → NO-sky) */}
        <GenerativeHero className="absolute inset-0 opacity-95 [mask-image:radial-gradient(ellipse_90%_85%_at_50%_45%,#000_68%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-96 w-96 rounded-full bg-orange-200/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-sky-200/20 blur-3xl" />

        <div className="container relative z-10 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-sm font-semibold text-orange-700">
              <Cpu className="h-3.5 w-3.5" strokeWidth={2.5} />
              Powered by Zama FHEVM
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Predict the future.{" "}
              <span className="text-gradient">Keep your edge.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              A prediction market that keeps the bet — amount, side, position —
              <strong className="text-foreground"> encrypted on-chain</strong>,
              while still showing real odds via K-anonymous snapshots over the
              encrypted pools.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" variant="gradient" className="w-full sm:w-auto gap-2">
                <Link href="#markets">
                  Explore markets
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
                <Link href="/create">Create a market</Link>
              </Button>
            </div>

            <div className="mx-auto mt-10 flex max-w-lg items-center justify-center gap-8">
              <Stat value={String(markets.length)} label="Markets" />
              <div className="h-8 w-px bg-border" />
              <Stat value={String(open)} label="Live now" accent />
              <div className="h-8 w-px bg-border" />
              <Stat value={totalVol > 0n ? `$${formatUSDC(totalVol, { decimals: 0 })}` : String(totalBets)} label={totalVol > 0n ? "Revealed volume" : "Bets"} />
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container grid grid-cols-1 gap-6 py-10 sm:grid-cols-3">
          <Feature
            icon={<BarChart3 className="h-5 w-5" />}
            title="K-anonymous odds"
            body="Pools are revealed as snapshots only after K=3 new bets. A snapshot diff covers many bets at once, so the public sees real prices without ever attributing them to a wallet."
            color="text-orange-600"
            bg="bg-orange-50"
            border="border-orange-200"
          />
          <Feature
            icon={<EyeOff className="h-5 w-5" />}
            title="Encrypted bets"
            body="Bet amount and side are encrypted in your browser with the Zama Relayer SDK. They never appear in calldata, events, or pool deltas — only you can see your stake."
            color="text-sky-600"
            bg="bg-sky-50"
            border="border-sky-200"
          />
          <Feature
            icon={<Award className="h-5 w-5" />}
            title="Confidential payouts"
            body="Winnings settle via ERC-7984 confidential transfer. Only your wallet can decrypt your balance — your edge stays yours."
            color="text-emerald-600"
            bg="bg-emerald-50"
            border="border-emerald-200"
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
              Real odds, private positions. Pick a side.
            </p>
          </div>
          {open > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-orange-600" />
              <span className="text-xs font-semibold text-orange-700">{open} live</span>
            </div>
          )}
        </div>
        <MarketsExplorer markets={markets} />
      </section>

      {/* Zama technical explainer */}
      <ZamaExplainer />
    </div>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-display text-2xl font-extrabold tabular-nums ${accent ? "text-gradient" : ""}`}>
        {value}
      </div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({
  icon, title, body, color, bg, border,
}: {
  icon: React.ReactNode; title: string; body: string; color: string; bg: string; border: string;
}) {
  return (
    <div className={`rounded-2xl border p-6 ${bg} ${border}`}>
      <div className={`mb-3 inline-grid h-11 w-11 place-items-center rounded-xl border ${border} bg-white/70 ${color}`}>
        {icon}
      </div>
      <h3 className="mb-1.5 font-display text-base font-bold tracking-tight text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
