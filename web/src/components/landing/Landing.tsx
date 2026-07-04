"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Lock, EyeOff, Eye, Crosshair, Copy, ShieldCheck, Cpu,
  Wallet, KeyRound, BarChart3, Trophy, Check, X, Sparkles,
} from "lucide-react";
import type { MarketSummary } from "@/lib/markets";
import { HiddenConsensus } from "@/components/art/HiddenConsensus";
import { MarketCard } from "@/components/MarketCard";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export interface LandingStats {
  markets: number;
  positions: number;
  settled: number;
}

export function Landing({
  featured,
  stats,
}: {
  featured: MarketSummary[];
  stats?: LandingStats;
}) {
  return (
    <div className="overflow-hidden">
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative isolate border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-hero-mesh dark:hidden" />
        {/* algorithmic art — "Hidden Consensus" encrypted probability field
            (painted on a white canvas; the dark theme uses ZamaBackground) */}
        <HiddenConsensus className="absolute inset-0 opacity-90 [mask-image:radial-gradient(ellipse_85%_80%_at_50%_40%,#000_60%,transparent_100%)] dark:hidden" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-zama-200/40 blur-3xl dark:bg-zama-900/30" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-zinc-200/40 blur-3xl dark:bg-zinc-800/40" />

        <div className="container relative z-10 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zama-300 bg-white/70 px-4 py-1.5 text-sm font-semibold text-zama-800 dark:border-zama-700 dark:bg-zinc-900/70 dark:text-zama-300 backdrop-blur">
              <Cpu className="h-3.5 w-3.5" strokeWidth={2.5} />
              Confidential by protocol — powered by Zama FHEVM
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
              Bet on the truth.{" "}
              <span className="text-gradient">Without showing your hand.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Every other prediction market broadcasts your every move — your size, your
              side, your whole strategy. TruthMarket keeps your position{" "}
              <strong className="text-foreground">encrypted on-chain</strong>. The
              crowd&apos;s odds stay public; your edge stays yours.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" variant="gradient" className="w-full gap-2 sm:w-auto">
                <Link href="/markets">
                  Open the markets
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
                <Link href="#how">See how it works</Link>
              </Button>
            </div>

            <div className="mx-auto mt-12 flex max-w-md items-center justify-center gap-6 text-left">
              <TrustPill icon={<Lock className="h-4 w-4" />} title="Encrypted" sub="amount + side" />
              <div className="h-9 w-px bg-border" />
              <TrustPill icon={<BarChart3 className="h-4 w-4" />} title="Public odds" sub="real price discovery" />
              <div className="h-9 w-px bg-border" />
              <TrustPill icon={<EyeOff className="h-4 w-4" />} title="Untrackable" sub="no whale-watching" />
            </div>

            {/* Live on-chain stats — real numbers, straight from the factory */}
            {stats && stats.markets > 0 && (
              <div className="mx-auto mt-10 grid max-w-lg grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card/80 shadow-soft backdrop-blur">
                <HeroStat value={stats.markets} label="live markets" />
                <HeroStat value={stats.positions} label="encrypted positions" />
                <HeroStat value={stats.settled} label="markets settled" />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ───────────────────── THE PROBLEM ───────────────────── */}
      <section className="border-b border-border bg-secondary/30 py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-zama-700 dark:text-zama-400">
              The problem with public markets
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              On Polymarket and Kalshi, everyone can see what you do
            </h2>
            <p className="mt-4 text-muted-foreground">
              Full transparency sounds healthy — until it&apos;s your money. When every
              order is public and tied to your wallet forever, the market quietly turns
              against the people who are actually right.
            </p>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2">
            {PROBLEMS.map((p, i) => (
              <motion.div
                key={p.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-no-ring/40 bg-no-bg text-no-fg">
                  <p.icon className="h-5 w-5" strokeWidth={1.9} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold tracking-tight">{p.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── THE SOLUTION ───────────────────── */}
      <section className="border-b border-border py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-zama-700 dark:text-zama-400">
              How TruthMarket is different
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Keep the wisdom of the crowd. Lose the surveillance.
            </h2>
            <p className="mt-4 text-muted-foreground">
              A prediction market only needs <em>aggregate</em> odds to work. It never
              needed your name on every trade. We encrypt the part that should have been
              private all along — and leave the prices public.
            </p>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3">
            {SOLUTIONS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { type: "spring", damping: 14 } }}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl border ${s.tint}`}>
                  <s.icon className="h-5 w-5" strokeWidth={1.9} />
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── COMPARISON ───────────────────── */}
      <section className="border-b border-border bg-secondary/30 py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Side by side
            </h2>
            <p className="mt-4 text-muted-foreground">
              The same public odds. A fundamentally different privacy model.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-border bg-secondary/50 px-5 py-3.5 text-sm font-bold">
              <span className="text-muted-foreground">What others can see</span>
              <span className="text-center text-muted-foreground">Polymarket · Kalshi</span>
              <span className="text-center text-zama-700 dark:text-zama-400">TruthMarket</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1.4fr_1fr_1fr] items-center px-5 py-3.5 text-sm ${i % 2 ? "bg-secondary/20" : ""}`}
              >
                <span className="font-semibold text-foreground">{row.label}</span>
                <span className="flex justify-center">{cell(row.them)}</span>
                <span className="flex justify-center">{cell(row.us)}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────────────────── HOW IT WORKS ───────────────────── */}
      <section id="how" className="scroll-mt-20 border-b border-border py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-zama-700 dark:text-zama-400">
              How it works
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Four steps. Nothing leaks.
            </h2>
            <p className="mt-4 text-muted-foreground">
              No new mental model to learn. It feels like any market — the privacy
              happens underneath.
            </p>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-zinc-950">
                    <s.icon className="h-5 w-5" strokeWidth={1.9} />
                  </div>
                  <span className="font-display text-3xl font-extrabold text-border">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-zama-300 bg-zama-50 px-5 py-4 text-sm text-zama-900 dark:border-zama-800 dark:bg-zama-400/10 dark:text-zama-200">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <strong>Privacy by protocol, not by promise.</strong> Your amount and side
              are encrypted in your browser and stay encrypted inside the contract — the
              chain itself enforces it. There is no admin, log, or backdoor that can undo
              it. You can always decrypt and verify your own position with your wallet.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ───────────────────── FEATURED MARKETS ───────────────────── */}
      {featured.length > 0 && (
        <section className="border-b border-border bg-secondary/30 py-20">
          <div className="container">
            <motion.div {...fadeUp} className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Trending markets
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Public odds you can read at a glance — positions you can&apos;t.
                </p>
              </div>
              <Button asChild variant="outline" className="hidden gap-1.5 sm:inline-flex">
                <Link href="/markets">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map((m) => (
                <MarketCard key={m.address} m={m} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Button asChild variant="gradient" className="gap-1.5">
                <Link href="/markets">
                  Explore all markets <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────── FINAL CTA ───────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-hero-mesh dark:hidden" />
        <HiddenConsensus
          seed={7}
          className="absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_50%,transparent_100%)] dark:hidden"
        />
        <motion.div {...fadeUp} className="container relative z-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zama-300 bg-white/70 px-4 py-1.5 text-sm font-semibold text-zama-800 dark:border-zama-700 dark:bg-zinc-900/70 dark:text-zama-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Sepolia testnet — free to try
          </div>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Trade on what you believe.{" "}
            <span className="text-gradient">Tell no one.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Grab some test USDC, take a position, and watch the odds move — while your
            wallet stays invisible.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl" variant="gradient" className="w-full gap-2 sm:w-auto">
              <Link href="/markets">
                Open the markets
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
              <Link href="/create">Create a market</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-4 py-3.5 text-center">
      <div className="font-display text-2xl font-extrabold tabular-nums">
        {value.toLocaleString()}
      </div>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

function TrustPill({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-white/70 text-zama-700 backdrop-blur dark:bg-zinc-900/70 dark:text-zama-400">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold leading-tight">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function cell(v: boolean | "yes" | "no" | string) {
  if (v === "yes") return <Check className="h-5 w-5 text-yes" strokeWidth={2.5} />;
  if (v === "no") return <X className="h-5 w-5 text-no" strokeWidth={2.5} />;
  return <span className="text-center text-xs font-semibold text-muted-foreground">{v}</span>;
}

const PROBLEMS = [
  {
    icon: Crosshair,
    title: "You get tracked the moment you win",
    body: "Profitable wallets are public targets. Dozens of dashboards exist purely to find and follow them — the better you do, the more eyes copy your every move.",
  },
  {
    icon: Copy,
    title: "Copytraders front-run your edge",
    body: "As soon as a big order lands, copy bots pile in and the price moves before you've finished building. Sharp traders even run secondary accounts just to stay unseen.",
  },
  {
    icon: Eye,
    title: "Your beliefs become a permanent record",
    body: "Every political, financial, or personal bet is etched on-chain next to your address forever — searchable by anyone, including people you'd rather not share it with.",
  },
  {
    icon: BarChart3,
    title: "Visible flow distorts the odds",
    body: "When the crowd can see who's betting what, it herds toward big wallets instead of toward the truth — the exact signal a prediction market is supposed to find.",
  },
];

const SOLUTIONS = [
  {
    icon: Lock,
    tint: "border-zama-300 bg-zama-50 text-zama-800 dark:border-zama-800 dark:bg-zama-400/10 dark:text-zama-300",
    title: "Encrypted positions",
    body: "Your amount and side are encrypted in your browser before they ever reach the chain. No order book, event, or balance can be tied back to you.",
  },
  {
    icon: BarChart3,
    tint: "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    title: "Public, honest odds",
    body: "The aggregate market price stays fully public, so price discovery works exactly like it should — just without exposing a single individual behind it.",
  },
  {
    icon: Trophy,
    tint: "border-yes-ring/40 bg-yes-bg text-yes-fg",
    title: "Confidential payouts",
    body: "Winnings settle privately. Only your wallet can decrypt what you were paid — no one can reverse-engineer your position from the result.",
  },
];

const COMPARISON: { label: string; them: "yes" | "no" | string; us: "yes" | "no" | string }[] = [
  { label: "Live public odds", them: "yes", us: "yes" },
  { label: "Your bet size", them: "Public", us: "Encrypted" },
  { label: "Which side you took", them: "Public", us: "Encrypted" },
  { label: "Whale-watching & copy-trading", them: "Trivial", us: "Impossible" },
  { label: "Front-running your position", them: "Common", us: "Eliminated" },
  { label: "Your betting history exposed", them: "Forever", us: "Never" },
  { label: "Payout amount", them: "Public", us: "Confidential" },
];

const STEPS = [
  {
    icon: Wallet,
    title: "Top up once",
    body: "Convert test USDC into a confidential balance in a single step. After that, betting is one click.",
  },
  {
    icon: Lock,
    title: "Bet privately",
    body: "Pick a side and a size. Both are encrypted in your browser before the transaction is ever broadcast.",
  },
  {
    icon: BarChart3,
    title: "Watch the odds",
    body: "The market shows where the crowd leans in real time — the price, never the people behind it.",
  },
  {
    icon: KeyRound,
    title: "Claim confidentially",
    body: "When the market resolves, winners split the pool pro-rata. Your payout is decryptable only by you.",
  },
];
