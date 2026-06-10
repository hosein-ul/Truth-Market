"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight, Lock, EyeOff, BarChart3,
  Wallet, KeyRound, Crosshair, Copy, Eye, Trophy,
  Check, X, ShieldCheck, Cpu, Sparkles, Terminal,
} from "lucide-react";
import type { MarketSummary } from "@/lib/markets";
import { MarketCard } from "@/components/MarketCard";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

/* ─── Typewriter component ─── */
function Typewriter({ lines }: { lines: string[] }) {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const current = lines[idx] ?? "";
    if (chars < current.length) {
      const t = setTimeout(() => setChars((c) => c + 1), 28);
      return () => clearTimeout(t);
    }
    if (idx < lines.length - 1) {
      const t = setTimeout(() => { setIdx((i) => i + 1); setChars(0); }, 600);
      return () => clearTimeout(t);
    }
    setDone(true);
  }, [idx, chars, lines, done]);

  return (
    <div className="font-mono text-xs text-cyan-400/70 space-y-0.5 text-left">
      {lines.map((line, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <span className="text-cyan-600/60 shrink-0">{i < idx ? "✓" : i === idx ? ">" : " "}</span>
          <span className={i < idx ? "text-emerald-400/60" : i === idx ? "text-cyan-300/80" : "text-cyan-900/40"}>
            {i < idx ? line : i === idx ? line.slice(0, chars) : ""}
            {i === idx && !done && <span className="animate-pulse">▮</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

const TERMINAL_LINES = [
  "$ connect wallet → 0x1e77...0D44",
  "$ fhevm.encrypt(amount=500, side=YES)",
  "→ ciphertext: 0x3fa2b91c...",
  "$ market.placeBet(encrypted_tx)",
  "✓ tx confirmed · block #7,402,881",
  "✓ position encrypted on-chain",
  "→ odds updated: YES 64% / NO 36%",
];

const PROBLEMS = [
  { icon: Crosshair, title: "You get tracked the moment you win", body: "Profitable wallets are public targets. Dozens of dashboards exist purely to find and follow them." },
  { icon: Copy, title: "Copytraders front-run your edge", body: "As soon as a big order lands, copy bots pile in and the price moves before you've finished building." },
  { icon: Eye, title: "Your beliefs become a permanent record", body: "Every political, financial, or personal bet is etched on-chain next to your address forever." },
  { icon: BarChart3, title: "Visible flow distorts the odds", body: "When the crowd can see who's betting what, it herds toward big wallets instead of toward the truth." },
];

const SOLUTIONS = [
  { icon: Lock, title: "Encrypted positions", body: "Your amount and side are encrypted in your browser before they ever reach the chain.", color: "cyan" },
  { icon: BarChart3, title: "Public, honest odds", body: "The aggregate market price stays fully public, so price discovery works exactly like it should.", color: "violet" },
  { icon: Trophy, title: "Confidential payouts", body: "Winnings settle privately. Only your wallet can decrypt what you were paid.", color: "cyan" },
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
  { icon: Wallet, title: "Top up once", body: "Convert test USDC into a confidential balance in a single step.", num: "01" },
  { icon: Lock, title: "Bet privately", body: "Pick a side and a size. Both are encrypted in your browser before broadcast.", num: "02" },
  { icon: BarChart3, title: "Watch the odds", body: "The market shows where the crowd leans in real time — the price, never the people.", num: "03" },
  { icon: KeyRound, title: "Claim confidentially", body: "Winners split the pool pro-rata. Your payout is decryptable only by you.", num: "04" },
];

function CellQ(v: "yes" | "no" | string) {
  if (v === "yes") return <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />;
  if (v === "no") return <X className="h-4 w-4 text-red-500" strokeWidth={2.5} />;
  const isTM = v === "Encrypted" || v === "Impossible" || v === "Eliminated" || v === "Never" || v === "Confidential";
  return <span className={`font-mono text-xs font-semibold ${isTM ? "text-cyan-400" : "text-slate-500"}`}>{v}</span>;
}

function TrustPillQ({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center border border-cyan-800/50 bg-cyan-950/30 text-cyan-400">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold leading-tight text-slate-200">{title}</div>
        <div className="font-mono text-[10px] text-slate-500">{sub}</div>
      </div>
    </div>
  );
}

export function LandingQuantum({ featured }: { featured: MarketSummary[] }) {
  return (
    <div className="overflow-hidden bg-[#090e1a]">

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-screen flex items-center border-b border-cyan-900/20">
        {/* top terminal badge */}
        <div className="absolute top-6 left-6 font-mono text-[10px] text-cyan-800/50 hidden lg:block leading-tight select-none">
          <div>╔═══ ZAMA FHEVM &gt; SEPOLIA:11155111 ═══╗</div>
          <div>║ status: ENCRYPTION ACTIVE             ║</div>
          <div>╚══════════════════════════════════════╝</div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090e1a]/80 via-[#090e1a]/20 to-[#090e1a]" />

        <div className="container relative z-10 py-32 sm:py-40">
          <div className="mx-auto max-w-5xl">
            <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-center">
              {/* left: text */}
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* terminal badge */}
                  <div className="mb-7 inline-flex items-center gap-2 border border-cyan-800/50 bg-cyan-950/30 px-4 py-2 font-mono text-xs text-cyan-400/80">
                    <Terminal className="h-3 w-3" />
                    <span className="text-cyan-600/70">//</span>
                    <span>confidential prediction market</span>
                    <span className="ml-2 text-cyan-600/50">@sepolia</span>
                  </div>

                  <h1 className="font-display text-5xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
                    <span className="block text-slate-100">Bet on the truth.</span>
                    <span className="block bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400 bg-clip-text text-transparent mt-2">
                      Without showing your hand.
                    </span>
                  </h1>

                  <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-400">
                    Every other prediction market broadcasts your every move. TruthMarket keeps your
                    position{" "}
                    <strong className="text-cyan-300">encrypted on-chain</strong>.
                    The crowd&apos;s odds stay public; your edge stays yours.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Button
                      asChild
                      size="xl"
                      className="gap-2 bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 font-bold hover:from-cyan-400 hover:to-cyan-300 border-0 shadow-[0_0_28px_rgba(8,247,247,0.3)] hover:shadow-[0_0_40px_rgba(8,247,247,0.5)] transition-shadow"
                    >
                      <Link href="/markets">
                        Open the markets <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="xl"
                      variant="outline"
                      className="border-cyan-800/60 text-slate-300 hover:bg-cyan-950/40 hover:border-cyan-600/60"
                    >
                      <Link href="#how">How it works</Link>
                    </Button>
                  </div>

                  <div className="mt-10 flex items-center gap-6">
                    <TrustPillQ icon={<Lock className="h-4 w-4" />} title="Encrypted" sub="amount + side" />
                    <div className="h-8 w-px bg-cyan-900/50" />
                    <TrustPillQ icon={<EyeOff className="h-4 w-4" />} title="Untrackable" sub="no whale-watching" />
                  </div>
                </motion.div>
              </div>

              {/* right: terminal window */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="hidden lg:block"
              >
                <div className="border border-cyan-800/40 bg-slate-950/80 backdrop-blur overflow-hidden shadow-[0_0_60px_rgba(8,247,247,0.08)]">
                  {/* terminal title bar */}
                  <div className="flex items-center gap-2 border-b border-cyan-900/30 bg-cyan-950/20 px-4 py-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                    <span className="ml-3 font-mono text-[10px] text-cyan-700/60">truthmarket — zsh</span>
                  </div>
                  <div className="p-5 min-h-[220px]">
                    <Typewriter lines={TERMINAL_LINES} />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#090e1a] to-transparent" />
      </section>

      {/* ══════ THE PROBLEM ══════ */}
      <section className="border-b border-cyan-900/20 py-24 bg-[#090e1a]">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center mb-14">
            <div className="font-mono text-[11px] text-cyan-800/60 tracking-[0.3em] mb-4 select-none">
              // THE PROBLEM
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-100">
              On Polymarket and Kalshi,{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                everyone can see what you do
              </span>
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Full transparency sounds healthy — until it&apos;s your money. When every order
              is public and tied to your wallet forever, the market turns against the people
              who are actually right.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
            {PROBLEMS.map((prob, i) => (
              <motion.div
                key={prob.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.07 }}
                whileHover={{ y: -3, boxShadow: "0 0 20px rgba(8,247,247,0.07)", transition: { type: "spring", damping: 18 } }}
                className="group relative flex gap-4 border border-cyan-900/25 bg-slate-950/60 p-6 backdrop-blur
                           hover:border-cyan-800/40 transition-colors duration-300"
              >
                {/* scan-line on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="grid h-11 w-11 shrink-0 place-items-center border border-red-900/40 bg-red-950/20 text-red-400/80">
                  <prob.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="relative z-10">
                  <h3 className="font-display text-base font-bold tracking-tight text-slate-100">{prob.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{prob.body}</p>
                </div>

                <div className="absolute bottom-3 right-4 font-mono text-[10px] text-cyan-900/40 select-none">{prob.icon.displayName ?? ""}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ THE SOLUTION ══════ */}
      <section className="border-b border-cyan-900/20 py-24 bg-[#0a1020]">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center mb-14">
            <div className="font-mono text-[11px] text-cyan-800/60 tracking-[0.3em] mb-4 select-none">
              // HOW TRUTHMARKET IS DIFFERENT
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-100">
              Keep the wisdom of the crowd.{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
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
                className="group relative border border-cyan-900/30 bg-slate-950/70 p-7 backdrop-blur
                           hover:border-cyan-700/50 transition-colors duration-300 overflow-hidden"
              >
                {/* top edge glow */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="mb-4 grid h-12 w-12 place-items-center border border-cyan-800/40 bg-cyan-950/30 text-cyan-400">
                  <s.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight text-slate-100">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ COMPARISON ══════ */}
      <section className="border-b border-cyan-900/20 py-24 bg-[#090e1a]">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center mb-12">
            <div className="font-mono text-[11px] text-cyan-800/60 tracking-[0.3em] mb-4 select-none">
              // diff: TruthMarket vs competitors
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-100">
              Side by side
            </h2>
          </motion.div>

          <motion.div {...fadeUp} className="mx-auto max-w-3xl overflow-hidden border border-cyan-900/30 bg-slate-950/80 backdrop-blur shadow-[0_0_40px_rgba(8,247,247,0.06)]">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-cyan-900/25 bg-cyan-950/15 px-5 py-4">
              <span className="font-mono text-xs text-slate-500">// visibility</span>
              <span className="text-center font-mono text-xs text-slate-500">Polymarket · Kalshi</span>
              <span className="text-center font-mono text-xs text-cyan-400">TruthMarket</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1.4fr_1fr_1fr] items-center px-5 py-3.5 text-sm border-b border-cyan-900/10 last:border-0 ${i % 2 ? "bg-cyan-950/8" : ""}`}
              >
                <span className="font-semibold text-slate-300 text-sm">{row.label}</span>
                <span className="flex justify-center">{CellQ(row.them)}</span>
                <span className="flex justify-center">{CellQ(row.us)}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section id="how" className="scroll-mt-20 border-b border-cyan-900/20 py-24 bg-[#0a1020]">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center mb-14">
            <div className="font-mono text-[11px] text-cyan-800/60 tracking-[0.3em] mb-4 select-none">
              // HOW IT WORKS
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-100">
              Four steps.{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
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
                className="group relative border border-cyan-900/25 bg-slate-950/60 p-6 backdrop-blur
                           hover:border-cyan-700/45 transition-colors duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="mb-4 font-mono text-2xl font-bold text-cyan-900/50 select-none">{s.num}</div>
                <div className="mb-3 grid h-10 w-10 place-items-center border border-cyan-800/40 bg-cyan-950/30 text-cyan-400">
                  <s.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-base font-bold tracking-tight text-slate-100">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mx-auto mt-8 flex max-w-3xl items-start gap-4 border border-cyan-900/30 bg-cyan-950/15 px-6 py-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
            <p className="text-sm text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Privacy by protocol, not by promise.</strong>{" "}
              Your amount and side are encrypted in your browser and stay encrypted inside the contract.
              The chain itself enforces it — there is no admin, log, or backdoor.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════ FEATURED MARKETS ══════ */}
      {featured.length > 0 && (
        <section className="border-b border-cyan-900/20 py-24 bg-[#090e1a]">
          <div className="container">
            <motion.div {...fadeUp} className="mb-10 flex items-end justify-between">
              <div>
                <div className="font-mono text-[11px] text-cyan-800/60 tracking-[0.3em] mb-2 select-none">// LIVE</div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-100">
                  Open markets
                </h2>
                <p className="mt-1 font-mono text-xs text-slate-500">// public odds · private positions</p>
              </div>
              <Button
                asChild
                variant="outline"
                className="hidden gap-1.5 sm:inline-flex border-cyan-800/50 text-slate-300 hover:bg-cyan-950/40"
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
      <section className="relative overflow-hidden py-32 bg-[#090e1a]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090e1a] via-cyan-950/10 to-[#090e1a]" />

        <motion.div {...fadeUp} className="container relative z-10 text-center">
          <div className="mb-6 inline-flex items-center gap-2 border border-cyan-800/50 bg-cyan-950/30 px-5 py-2 font-mono text-xs text-cyan-400/80">
            <Sparkles className="h-3 w-3" />
            Sepolia testnet — free to try
          </div>

          <h2 className="mx-auto max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-100">
            Trade on what you believe.{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Tell no one.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-slate-400">
            Grab some test USDC, take a position, and watch the odds move — while your
            wallet stays invisible.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="xl"
              className="gap-2 bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 font-bold hover:from-cyan-400 hover:to-cyan-300 border-0 shadow-[0_0_28px_rgba(8,247,247,0.3)] hover:shadow-[0_0_44px_rgba(8,247,247,0.5)] transition-shadow"
            >
              <Link href="/markets">
                Open the markets <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-cyan-800/60 text-slate-300 hover:bg-cyan-950/40 hover:border-cyan-600/60"
            >
              <Link href="/create">Create a market</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
