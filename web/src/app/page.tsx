import Link from "next/link";
import { Lock, EyeOff, Trophy, ArrowRight, Cpu, TrendingUp } from "lucide-react";
import { getMarketSummaries } from "@/lib/markets";
import { MARKET_STATUS } from "@/lib/abis";
import { MarketsExplorer } from "@/components/MarketsExplorer";
import { Button } from "@/components/ui/button";
import { HeroTerminal } from "@/components/HeroTerminal";
import { FloatingOrbs } from "@/components/FloatingOrbs";
import { ZamaExplainer } from "@/components/ZamaExplainer";

export const revalidate = 30;

export default async function HomePage() {
  const markets = await getMarketSummaries();
  const open = markets.filter((m) => m.status === MARKET_STATUS.OPEN).length;
  const totalTraders = markets.reduce((s, m) => s + m.traderCount, 0);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] overflow-hidden border-b border-white/5">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0 bg-mesh" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-100" />
        <FloatingOrbs />

        <div className="container relative flex min-h-[92vh] flex-col items-center justify-center py-20">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1fr]">

            {/* Left — headline + CTA */}
            <div>
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur">
                <Cpu className="h-3 w-3" />
                Zama FHEVM · Ethereum Sepolia
              </div>

              <h1 className="font-display text-5xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Predict.{" "}
                <span className="text-gradient">Bet.</span>
                <br />
                Stay{" "}
                <span className="relative inline-block">
                  <span className="text-gradient">private.</span>
                  {/* underline glow */}
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, #3b82f6, #22d3ee)" }}
                  />
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
                Every bet is{" "}
                <span className="font-semibold text-slate-200">encrypted on-chain</span>{" "}
                using Fully Homomorphic Encryption. No one sees your amount or side —
                not while the market is open. Odds reveal only at settlement.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="xl" variant="gradient" className="gap-2">
                  <Link href="#markets">
                    Explore markets
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="xl"
                  variant="outline"
                  className="border-white/10 text-slate-200 hover:bg-white/6"
                >
                  <Link href="/create">Create a market</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap gap-6">
                <Stat value={markets.length} label="Markets" />
                <div className="w-px bg-white/8" />
                <Stat value={open} label="Open now" accent />
                <div className="w-px bg-white/8" />
                <Stat value={totalTraders} label="Encrypted bets" />
              </div>
            </div>

            {/* Right — animated FHE terminal */}
            <div className="w-full">
              <HeroTerminal />

              {/* Tech badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "FHE.select()",
                  "euint64 / ebool",
                  "ERC-7984 cUSDC",
                  "Zama KMS Oracle",
                  "Sepolia Testnet",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 font-mono text-[10px] text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30">
            <div className="h-6 w-4 rounded-full border border-white/20 flex justify-center pt-1">
              <div
                className="h-1.5 w-0.5 rounded-full bg-white/60"
                style={{ animation: "float 2s ease-in-out infinite" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Value props ── */}
      <section className="border-b border-white/5 py-16">
        <div className="container grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Feature
            icon={<EyeOff className="h-5 w-5" />}
            title="Sealed positions"
            body="Your amount and side are encrypted before they ever touch the chain. The market can't be read while it's open."
            color="text-blue-400"
            glow="shadow-[0_0_16px_rgba(59,130,246,0.12)]"
            border="border-blue-500/15"
          />
          <Feature
            icon={<Lock className="h-5 w-5" />}
            title="No herding"
            body="With odds hidden until settlement, there's no whale signal to chase and no crowd to follow. Bet your own conviction."
            color="text-cyan-400"
            glow="shadow-[0_0_16px_rgba(34,211,238,0.10)]"
            border="border-cyan-500/15"
          />
          <Feature
            icon={<Trophy className="h-5 w-5" />}
            title="Private payouts"
            body="Winnings settle confidentially via ERC-7984. Only your wallet can reveal what you earned — your edge stays yours."
            color="text-amber-400"
            glow="shadow-[0_0_16px_rgba(245,158,11,0.10)]"
            border="border-amber-500/15"
          />
        </div>
      </section>

      {/* ── Markets ── */}
      <section id="markets" className="container scroll-mt-20 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">
              Markets
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick a question. Take a side. Stay sealed.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-300">{open} live</span>
          </div>
        </div>
        <MarketsExplorer markets={markets} />
      </section>

      {/* ── Zama technical explainer (for hackathon judges) ── */}
      <ZamaExplainer />
    </div>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-display text-3xl font-extrabold tabular-nums ${
          accent ? "text-gradient" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
  color,
  glow,
  border,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  color: string;
  glow: string;
  border: string;
}) {
  return (
    <div className={`rounded-2xl border bg-card/50 p-6 ${glow} ${border}`}>
      <div
        className={`mb-3 inline-grid h-11 w-11 place-items-center rounded-xl border bg-card ${color} ${border}`}
      >
        {icon}
      </div>
      <h3 className="mb-1.5 font-display text-base font-bold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
