"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Lock, EyeOff, BarChart3,
  Wallet, KeyRound, Crosshair, Copy, Eye, Trophy,
  Check, X, ShieldCheck, Sparkles,
} from "lucide-react";
import type { MarketSummary } from "@/lib/markets";
import { MarketCard } from "@/components/MarketCard";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

/* ─── Ceremony entrance animation ─── */
function CeremonyReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ clipPath: "circle(0% at 50% 50%)" }}
        animate={{ clipPath: "circle(150% at 50% 50%)" }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

const PROBLEMS = [
  { icon: Crosshair, title: "You get tracked the moment you win", body: "Profitable wallets are public targets. Dozens of dashboards exist purely to find and follow them — the better you do, the more eyes copy your every move." },
  { icon: Copy, title: "Copytraders front-run your edge", body: "As soon as a big order lands, copy bots pile in and the price moves before you've finished building your position." },
  { icon: Eye, title: "Your beliefs become a permanent record", body: "Every political, financial, or personal bet is etched on-chain next to your address forever — searchable by anyone." },
  { icon: BarChart3, title: "Visible flow distorts the odds", body: "When the crowd can see who's betting what, it herds toward big wallets instead of toward the truth." },
];

const SOLUTIONS = [
  { icon: Lock, title: "Encrypted positions", body: "Your amount and side are encrypted in your browser before they ever reach the chain. No order book, event, or balance can be tied back to you." },
  { icon: BarChart3, title: "Public, honest odds", body: "The aggregate market price stays fully public, so price discovery works exactly like it should — just without exposing any individual." },
  { icon: Trophy, title: "Confidential payouts", body: "Winnings settle privately. Only your wallet can decrypt what you were paid — no one can reverse-engineer your position." },
];

const COMPARISON = [
  { label: "Live public odds", them: "yes" as const, us: "yes" as const },
  { label: "Your bet size", them: "Public", us: "Encrypted" },
  { label: "Which side you took", them: "Public", us: "Encrypted" },
  { label: "Whale-watching & copy-trading", them: "Trivial", us: "Impossible" },
  { label: "Front-running your position", them: "Common", us: "Eliminated" },
  { label: "Your betting history exposed", them: "Forever", us: "Never" },
  { label: "Payout amount", them: "Public", us: "Confidential" },
];

const STEPS = [
  { icon: Wallet, title: "Top up once", body: "Convert test USDC into a confidential balance in a single step.", greek: "α", label: "ALPHA" },
  { icon: Lock, title: "Bet privately", body: "Pick a side and a size. Both are encrypted in your browser before broadcast.", greek: "β", label: "BETA" },
  { icon: BarChart3, title: "Watch the odds", body: "The market shows where the crowd leans in real time — the price, never the people.", greek: "γ", label: "GAMMA" },
  { icon: KeyRound, title: "Claim confidentially", body: "Winners split the pool pro-rata. Your payout is decryptable only by you.", greek: "δ", label: "DELTA" },
];

function CellL(v: "yes" | "no" | string) {
  if (v === "yes") return <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />;
  if (v === "no") return <X className="h-4 w-4 text-red-500" strokeWidth={2.5} />;
  const isTM = v === "Encrypted" || v === "Impossible" || v === "Eliminated" || v === "Never" || v === "Confidential";
  return <span className={`font-mono text-xs font-semibold ${isTM ? "text-violet-400" : "text-purple-900/70"}`}>{v}</span>;
}

function TrustPillL({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center border border-violet-700/50 bg-violet-950/30 text-violet-400">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold leading-tight text-purple-100">{title}</div>
        <div className="font-mono text-[10px] text-purple-500">{sub}</div>
      </div>
    </div>
  );
}

export function LandingLattice({ featured }: { featured: MarketSummary[] }) {
  return (
    <div className="overflow-hidden bg-[#0a080f]">

      {/* ══════ CEREMONY ENTRANCE + HERO ══════ */}
      <CeremonyReveal>
        <section className="relative min-h-screen flex items-center border-b border-violet-900/20">
          {/* ASCII frame border */}
          <div className="absolute top-5 left-5 right-5 font-mono text-[10px] text-violet-900/40 hidden lg:block select-none leading-tight">
            <div>╔══════════════════════════════════ TRUTH·MARKET ══════════════════════════════════╗</div>
          </div>
          <div className="absolute bottom-5 left-5 right-5 font-mono text-[10px] text-violet-900/40 hidden lg:block select-none leading-tight text-right">
            <div>╚══════════════════════════════════════════════════════════════════════════════════╝</div>
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a080f]/75 via-[#0a080f]/25 to-[#0a080f]" />

          <div className="container relative z-10 py-32 sm:py-40">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-4xl text-center"
            >
              {/* ceremonial badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-8 inline-flex items-center gap-3 border border-violet-700/40 bg-violet-950/30 px-5 py-2.5 backdrop-blur"
              >
                <span className="font-mono text-[10px] text-violet-600/60">[ </span>
                <span className="font-mono text-xs text-violet-300/80 tracking-widest uppercase">
                  Confidential by Protocol · Zama FHEVM
                </span>
                <span className="font-mono text-[10px] text-violet-600/60"> ]</span>
              </motion.div>

              {/* main heading — ceremonial font for h1 */}
              <h1 className="leading-[1.03] tracking-tight">
                <motion.span
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.7 }}
                  className="block font-ceremony text-5xl sm:text-7xl lg:text-8xl font-light text-purple-100"
                >
                  Bet on the truth.
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                  className="block font-ceremony text-5xl sm:text-7xl lg:text-8xl font-semibold italic bg-gradient-to-r from-violet-300 via-purple-400 to-pink-300 bg-clip-text text-transparent"
                >
                  Without showing your hand.
                </motion.span>
              </h1>

              {/* ASCII divider */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="my-8 mx-auto font-mono text-violet-800/40 text-xs tracking-[0.3em] select-none"
              >
                ════════════════ [ HOW IT WORKS ] ════════════════
              </motion.div>

              {/* ZK certificate */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                className="mb-8 mx-auto max-w-sm"
              >
                <pre className="font-mono text-[10px] text-violet-700/35 text-left leading-relaxed select-none">
{`┌──────────────────────────────────────┐
│  π = [A₁·g₁ + ... + Aₙ·gₙ]         │
│  verifier.verify(π, pub) = TRUE      │
└──────────────────────────────────────┘`}
                </pre>
              </motion.div>

              {/* subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mx-auto max-w-2xl text-lg leading-relaxed text-purple-300/60"
              >
                Every other prediction market broadcasts your every move. TruthMarket keeps your
                position{" "}
                <strong className="text-violet-300 font-semibold">encrypted on-chain</strong>.
                The crowd&apos;s odds stay public; your edge stays yours.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Button
                  asChild
                  size="xl"
                  className="w-full sm:w-auto gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:from-violet-500 hover:to-purple-500 border-0 shadow-[0_0_28px_rgba(155,77,255,0.35)] hover:shadow-[0_0_44px_rgba(155,77,255,0.5)] transition-shadow"
                >
                  <Link href="/markets">
                    Open the markets <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="xl"
                  variant="outline"
                  className="w-full sm:w-auto border-violet-800/60 text-purple-200 hover:bg-violet-950/40 hover:border-violet-600/60"
                >
                  <Link href="#how">See how it works</Link>
                </Button>
              </motion.div>

              {/* trust pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="mx-auto mt-14 flex max-w-lg items-center justify-center gap-6"
              >
                <TrustPillL icon={<Lock className="h-4 w-4" />} title="Encrypted" sub="amount + side" />
                <div className="font-mono text-violet-900/50">·</div>
                <TrustPillL icon={<BarChart3 className="h-4 w-4" />} title="Public odds" sub="real discovery" />
                <div className="font-mono text-violet-900/50">·</div>
                <TrustPillL icon={<EyeOff className="h-4 w-4" />} title="Untrackable" sub="no whale-watching" />
              </motion.div>
            </motion.div>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a080f] to-transparent" />
        </section>
      </CeremonyReveal>

      {/* ══════ THE PROBLEM ══════ */}
      <section className="border-b border-violet-900/20 py-24 bg-[#0a080f]">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center mb-14">
            <div className="font-mono text-[11px] text-violet-800/50 tracking-[0.35em] mb-4 select-none">
              [ THE PROBLEM ]
            </div>
            <h2 className="font-ceremony text-3xl sm:text-4xl font-semibold tracking-tight text-purple-100">
              On Polymarket and Kalshi,{" "}
              <span className="italic bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">
                everyone can see what you do
              </span>
            </h2>
            <p className="mt-4 text-purple-400/60 leading-relaxed">
              Full transparency sounds healthy — until it&apos;s your money.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
            {PROBLEMS.map((prob, i) => (
              <motion.div
                key={prob.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.07 }}
                whileHover={{ y: -3, transition: { type: "spring", damping: 18 } }}
                className="group relative flex gap-4 border border-violet-900/25 bg-[#120d1a]/80 p-6 backdrop-blur
                           hover:border-violet-700/40 transition-colors duration-300"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="grid h-11 w-11 shrink-0 place-items-center border border-red-900/40 bg-red-950/20 text-red-400/70">
                  <prob.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold tracking-tight text-purple-100">{prob.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-purple-300/50">{prob.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ THE SOLUTION ══════ */}
      <section className="border-b border-violet-900/20 py-24 bg-[#0c0915]">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center mb-14">
            <div className="font-mono text-[11px] text-violet-800/50 tracking-[0.35em] mb-4 select-none">
              [ HOW TRUTHMARKET IS DIFFERENT ]
            </div>
            <h2 className="font-ceremony text-3xl sm:text-4xl font-semibold tracking-tight text-purple-100">
              Keep the wisdom of the crowd.{" "}
              <span className="italic bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">
                Lose the surveillance.
              </span>
            </h2>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
            {SOLUTIONS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.09 }}
                whileHover={{ y: -5, transition: { type: "spring", damping: 14 } }}
                className="group relative border border-violet-900/30 bg-[#120d1a]/80 p-7 backdrop-blur
                           hover:border-violet-700/50 transition-colors duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="mb-4 grid h-12 w-12 place-items-center border border-violet-800/40 bg-violet-950/30 text-violet-400">
                  <s.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight text-purple-100">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-purple-300/55">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ COMPARISON ══════ */}
      <section className="border-b border-violet-900/20 py-24 bg-[#0a080f]">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center mb-12">
            <div className="font-mono text-[11px] text-violet-800/50 tracking-[0.35em] mb-4 select-none">
              [ SIDE BY SIDE ]
            </div>
            <h2 className="font-ceremony text-3xl sm:text-4xl font-semibold tracking-tight text-purple-100">
              The same public odds.{" "}
              <span className="italic bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">
                A different privacy model.
              </span>
            </h2>
          </motion.div>

          <motion.div {...fadeUp} className="mx-auto max-w-3xl overflow-hidden border border-violet-900/30 bg-[#120d1a]/80 backdrop-blur">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-violet-900/25 bg-violet-950/20 px-5 py-4">
              <span className="font-mono text-xs text-purple-600/50">// visibility</span>
              <span className="text-center font-mono text-xs text-purple-600/50">Polymarket · Kalshi</span>
              <span className="text-center font-mono text-xs text-violet-400">TruthMarket</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1.4fr_1fr_1fr] items-center px-5 py-3.5 text-sm border-b border-violet-900/10 last:border-0 ${i % 2 ? "bg-violet-950/8" : ""}`}
              >
                <span className="font-semibold text-purple-200/80 text-sm">{row.label}</span>
                <span className="flex justify-center">{CellL(row.them)}</span>
                <span className="flex justify-center">{CellL(row.us)}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section id="how" className="scroll-mt-20 border-b border-violet-900/20 py-24 bg-[#0c0915]">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center mb-14">
            <div className="font-mono text-[11px] text-violet-800/50 tracking-[0.35em] mb-4 select-none">
              [ HOW IT WORKS ]
            </div>
            <h2 className="font-ceremony text-3xl sm:text-4xl font-semibold tracking-tight text-purple-100">
              Four steps.{" "}
              <span className="italic bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">
                Nothing leaks.
              </span>
            </h2>
          </motion.div>

          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.09 }}
                whileHover={{ y: -4, transition: { type: "spring", damping: 14 } }}
                className="group relative border border-violet-900/25 bg-[#120d1a]/80 p-6 backdrop-blur
                           hover:border-violet-700/45 transition-colors duration-300"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Greek letter step */}
                <div className="mb-2 font-mono text-4xl font-bold text-violet-800/30 leading-none select-none">{s.greek}</div>
                <div className="mb-1 font-mono text-[9px] text-violet-700/35 tracking-[0.3em] select-none">{s.label}</div>

                <div className="mb-4 grid h-10 w-10 place-items-center border border-violet-800/40 bg-violet-950/30 text-violet-400">
                  <s.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-base font-bold tracking-tight text-purple-100">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-purple-300/50">{s.body}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mx-auto mt-8 flex max-w-3xl items-start gap-4 border border-violet-900/30 bg-violet-950/15 px-6 py-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
            <p className="text-sm text-purple-300/55 leading-relaxed">
              <strong className="text-purple-100">Privacy by protocol, not by promise.</strong>{" "}
              Your amount and side are encrypted in your browser and stay encrypted inside the contract.
              The chain itself enforces it — there is no admin, log, or backdoor.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════ FEATURED MARKETS ══════ */}
      {featured.length > 0 && (
        <section className="border-b border-violet-900/20 py-24 bg-[#0a080f]">
          <div className="container">
            <motion.div {...fadeUp} className="mb-10 flex items-end justify-between">
              <div>
                <div className="font-mono text-[11px] text-violet-800/50 tracking-[0.35em] mb-2 select-none">[ LIVE ]</div>
                <h2 className="font-ceremony text-2xl sm:text-3xl font-semibold tracking-tight text-purple-100">
                  Open markets
                </h2>
              </div>
              <Button
                asChild
                variant="outline"
                className="hidden gap-1.5 sm:inline-flex border-violet-800/50 text-purple-200 hover:bg-violet-950/40"
              >
                <Link href="/markets">View all <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map((m) => <MarketCard key={m.address} m={m} />)}
            </div>
          </div>
        </section>
      )}

      {/* ══════ FINAL CTA ══════ */}
      <section className="relative overflow-hidden py-32 bg-[#0a080f]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a080f] via-violet-950/10 to-[#0a080f]" />

        <motion.div {...fadeUp} className="container relative z-10 text-center">
          <div className="mb-8 mx-auto max-w-fit">
            <pre className="font-mono text-[10px] text-violet-800/35 text-center leading-relaxed select-none">
{`╔══════════════════════════════════╗
║ TRUTH·MARKET · CONFIDENTIAL      ║
║ PREDICTION MARKET ON FHEVM       ║
╚══════════════════════════════════╝`}
            </pre>
          </div>

          <div className="mb-6 inline-flex items-center gap-2 border border-violet-700/40 bg-violet-950/30 px-5 py-2 font-mono text-xs text-violet-400/80">
            <Sparkles className="h-3 w-3" />
            Sepolia testnet — free to try
          </div>

          <h2 className="mx-auto max-w-3xl font-ceremony text-3xl sm:text-5xl font-semibold tracking-tight text-purple-100">
            Trade on what you believe.{" "}
            <span className="italic bg-gradient-to-r from-violet-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Tell no one.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-purple-300/55">
            Grab some test USDC, take a position, and watch the odds move — while your
            wallet stays invisible.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="xl"
              className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:from-violet-500 hover:to-purple-500 border-0 shadow-[0_0_28px_rgba(155,77,255,0.4)] hover:shadow-[0_0_44px_rgba(155,77,255,0.6)] transition-shadow"
            >
              <Link href="/markets">
                Open the markets <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-violet-800/60 text-purple-200 hover:bg-violet-950/40 hover:border-violet-600/60"
            >
              <Link href="/create">Create a market</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
