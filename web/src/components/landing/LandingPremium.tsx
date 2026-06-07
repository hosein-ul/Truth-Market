"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight, Lock, EyeOff, BarChart3,
  Wallet, KeyRound, Crosshair, Copy, Eye, Trophy,
  Check, X, ShieldCheck,
} from "lucide-react";
import type { MarketSummary } from "@/lib/markets";
import { MarketCard } from "@/components/MarketCard";
import { Button } from "@/components/ui/button";
import { MarketHeatmapAscii } from "@/components/art/MarketHeatmapAscii";

/* ─── animation presets ─── */
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

/* ─── Staggered word reveal for headline ─── */
function WordReveal({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true });
  const words = text.split(" ");
  return (
    <span ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.22em]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ─── Animated counter ─── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 40;
    const id = setInterval(() => {
      start = Math.min(start + step, to);
      setVal(Math.round(start));
      if (start >= to) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── data ─── */
const PROBLEMS = [
  { icon: Crosshair, title: "You get tracked the moment you win", body: "Profitable wallets are public targets. Dozens of dashboards exist purely to find and follow them — the better you perform, the more eyes copy your every move." },
  { icon: Copy, title: "Copiers front-run your signal", body: "As soon as a large position lands, algorithmic followers pile in before you finish building. Sharp traders run secondary accounts just to stay unseen." },
  { icon: Eye, title: "Your convictions become a permanent record", body: "Every political, financial, or personal market call is etched on-chain next to your address forever — searchable by anyone, including people you'd rather not inform." },
  { icon: BarChart3, title: "Visible flow warps the signal", body: "When the crowd can see who's positioning and how much, it herds toward large wallets instead of the truth — destroying the signal a prediction market is supposed to surface." },
];

const SOLUTIONS = [
  { icon: Lock, title: "Encrypted positions", body: "Your size and direction are encrypted in your browser before they ever reach the chain. No order book, log, or event can be tied back to you.", num: "01" },
  { icon: BarChart3, title: "Honest, public odds", body: "The aggregate market price stays fully public — real price discovery, just without exposing any individual behind it.", num: "02" },
  { icon: Trophy, title: "Confidential settlement", body: "Winnings settle privately. Only your wallet can decrypt what you were paid — no one can reverse-engineer your position from the payout.", num: "03" },
];

const COMPARISON = [
  { label: "Live public odds", them: "yes" as const, us: "yes" as const },
  { label: "Position size", them: "Public", us: "Encrypted" },
  { label: "Direction (YES/NO)", them: "Public", us: "Encrypted" },
  { label: "Copytraders / front-runners", them: "Common", us: "Impossible" },
  { label: "Wallet history exposed", them: "Forever", us: "Never" },
  { label: "Settlement amount", them: "Public", us: "Confidential" },
];

const STEPS = [
  { icon: Wallet,   num: "01", title: "Fund once",           body: "Convert test USDC into a confidential balance in a single step. After that, every position is one click." },
  { icon: Lock,     num: "02", title: "Position privately",  body: "Choose a direction and size. Both are encrypted client-side before the transaction is ever broadcast." },
  { icon: BarChart3,num: "03", title: "Watch the signal",    body: "The market shows aggregate odds in real time — where the crowd leans, never who's behind it." },
  { icon: KeyRound, num: "04", title: "Claim confidentially",body: "When the market resolves, winners receive their share. Your payout is decryptable only by you." },
];

function CellP(v: "yes" | "no" | string) {
  if (v === "yes") return <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />;
  if (v === "no")  return <X className="h-4 w-4 text-red-400" strokeWidth={2.5} />;
  const isUs = v === "Encrypted" || v === "Impossible" || v === "Never" || v === "Confidential";
  return <span className={`text-xs font-semibold font-mono ${isUs ? "text-amber-700" : "text-stone-400"}`}>{v}</span>;
}

/* ─── main ─── */
export function LandingPremium({ featured }: { featured: MarketSummary[] }) {
  return (
    <div className="overflow-hidden" style={{ background: "#f5f2ec", color: "#1c1a17" }}>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative border-b min-h-[92vh] flex items-center" style={{ borderColor: "rgba(0,0,0,0.09)" }}>
        <div className="container relative z-10 py-24 sm:py-32">
          <div className="grid lg:grid-cols-[1fr_520px] xl:grid-cols-[1fr_600px] gap-12 xl:gap-20 items-center">

            {/* ── LEFT: editorial text ── */}
            <div>
              {/* Tag line */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8 flex items-center gap-3"
              >
                <div className="h-px w-8 bg-amber-700/60" />
                <span className="font-mono text-xs tracking-widest text-amber-700/80 uppercase">
                  Confidential prediction market · Zama FHEVM
                </span>
              </motion.div>

              {/* H1 — Playfair Display editorial */}
              <h1 className="font-serif leading-[1.05] tracking-tight">
                <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#1c1a17]">
                  <WordReveal text="Predict the truth." />
                </span>
                <span
                  className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mt-1"
                  style={{
                    background: "linear-gradient(120deg, #1c1a17 0%, #b8860b 55%, #d4a017 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  <WordReveal text="Keep your position private." />
                </span>
              </h1>

              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="mt-8 mb-7 h-px origin-left"
                style={{ background: "linear-gradient(90deg, rgba(184,134,11,0.4) 0%, transparent 100%)" }}
              />

              {/* Body */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.55 }}
                className="max-w-lg text-lg leading-relaxed"
                style={{ color: "#6b5e46" }}
              >
                Every other prediction market broadcasts your size, direction, and every
                past call — next to your wallet address, forever. TruthMarket encrypts
                your position on-chain using{" "}
                <strong style={{ color: "#1c1a17" }}>Zama FHEVM</strong>. The crowd&apos;s
                odds stay public. Your edge stays yours.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="mt-9 flex flex-wrap gap-3"
              >
                <Button
                  asChild
                  size="xl"
                  className="gap-2 font-semibold"
                  style={{
                    background: "#1c1a17",
                    color: "#f5f2ec",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(28,26,23,0.25)",
                  }}
                >
                  <Link href="/markets">
                    Open the markets <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="xl"
                  variant="outline"
                  className="font-semibold"
                  style={{ borderColor: "rgba(28,26,23,0.25)", color: "#1c1a17" }}
                >
                  <Link href="#how">How it works</Link>
                </Button>
              </motion.div>

              {/* Trust row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="mt-11 flex items-center gap-6 flex-wrap"
              >
                {[
                  { icon: <Lock className="h-3.5 w-3.5" />, label: "Encrypted positions" },
                  { icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Public market odds" },
                  { icon: <EyeOff className="h-3.5 w-3.5" />, label: "Untrackable wallet" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5" style={{ color: "#6b5e46" }}>
                    <span style={{ color: "#b8860b" }}>{t.icon}</span>
                    <span className="text-sm font-medium">{t.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── RIGHT: ASCII probability heatmap art ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:flex flex-col gap-3"
            >
              {/* ASCII art canvas */}
              <div
                className="relative overflow-hidden"
                style={{
                  height: 340,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "rgba(245,242,236,0.6)",
                }}
              >
                <MarketHeatmapAscii yesProb={0.63} className="absolute inset-0 w-full h-full" />

                {/* Overlay labels */}
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-none">
                  <div className="font-mono text-[10px]" style={{ color: "#b8860b" }}>
                    YES · 63%
                  </div>
                  <div className="font-mono text-[10px] text-center" style={{ color: "rgba(28,26,23,0.3)" }}>
                    ← consensus field →
                  </div>
                  <div className="font-mono text-[10px]" style={{ color: "rgba(28,26,23,0.5)" }}>
                    NO · 37%
                  </div>
                </div>

                {/* Top label */}
                <div
                  className="absolute top-3 left-4 font-mono text-[10px] tracking-widest"
                  style={{ color: "rgba(28,26,23,0.25)" }}
                >
                  ENCRYPTED POSITIONS · AGGREGATE SIGNAL
                </div>
              </div>

              {/* Stats row below art */}
              <div
                className="grid grid-cols-3 divide-x text-center py-3"
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "rgba(237,232,223,0.5)",
                  borderTop: "none",
                  divideColor: "rgba(0,0,0,0.08)",
                }}
              >
                {[
                  { label: "Positions", value: <Counter to={142} />, sub: "encrypted on-chain" },
                  { label: "YES probability", value: "63%", sub: "live market signal" },
                  { label: "Market vol.", value: <Counter to={48} suffix="k" />, sub: "USDC total" },
                ].map((s, i) => (
                  <div key={i} className="px-4 py-1">
                    <div
                      className="text-xl font-bold font-mono"
                      style={{ color: "#1c1a17" }}
                    >
                      {s.value}
                    </div>
                    <div className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(28,26,23,0.4)" }}>
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════ THE PROBLEM ══════════════════ */}
      <section className="border-b py-24" style={{ borderColor: "rgba(0,0,0,0.09)", background: "#f5f2ec" }}>
        <div className="container">
          <motion.div {...fadeUp} className="max-w-xl mb-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-amber-700/60" />
              <span className="font-mono text-xs tracking-widest text-amber-700/80 uppercase">The problem</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight" style={{ color: "#1c1a17" }}>
              On Polymarket and Kalshi,
              <br />
              <span style={{ color: "#b8860b" }}>your every move is on record.</span>
            </h2>
            <p className="mt-4 leading-relaxed" style={{ color: "#6b5e46" }}>
              Full transparency sounds fair — until it&apos;s your strategy being studied. When every call is public and tied to your wallet, the market turns against the people who are actually right.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl">
            {PROBLEMS.map((p, i) => (
              <motion.div
                key={p.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.07 }}
                whileHover={{ y: -2, transition: { type: "spring", damping: 20 } }}
                className="group p-6 relative"
                style={{
                  border: "1px solid rgba(0,0,0,0.09)",
                  background: "rgba(237,232,223,0.5)",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(184,134,11,0.35)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.09)")}
              >
                {/* number */}
                <div
                  className="absolute top-4 right-5 font-mono text-xs"
                  style={{ color: "rgba(28,26,23,0.18)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>

                <div
                  className="mb-4 grid h-10 w-10 place-items-center"
                  style={{ border: "1px solid rgba(220,80,80,0.25)", background: "rgba(220,80,80,0.06)", color: "#c0392b" }}
                >
                  <p.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                </div>
                <h3 className="font-semibold text-base tracking-tight mb-1.5" style={{ color: "#1c1a17" }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6b5e46" }}>{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ THE SOLUTION ══════════════════ */}
      <section className="border-b py-24" style={{ borderColor: "rgba(0,0,0,0.09)", background: "#ede8df" }}>
        <div className="container">
          <motion.div {...fadeUp} className="max-w-xl mb-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-amber-700/60" />
              <span className="font-mono text-xs tracking-widest text-amber-700/80 uppercase">How TruthMarket is different</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight" style={{ color: "#1c1a17" }}>
              Keep the wisdom of the crowd.
              <br />
              <span style={{ color: "#b8860b" }}>Lose the surveillance.</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl">
            {SOLUTIONS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.09 }}
                whileHover={{ y: -4, transition: { type: "spring", damping: 16 } }}
                className="p-7 relative"
                style={{ border: "1px solid rgba(0,0,0,0.09)", background: "#f5f2ec" }}
              >
                <div className="mb-5 font-mono text-3xl font-light" style={{ color: "rgba(28,26,23,0.1)" }}>
                  {s.num}
                </div>
                <div
                  className="mb-4 grid h-11 w-11 place-items-center"
                  style={{ border: "1px solid rgba(184,134,11,0.3)", background: "rgba(184,134,11,0.07)", color: "#b8860b" }}
                >
                  <s.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="font-semibold text-lg tracking-tight mb-2" style={{ color: "#1c1a17" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6b5e46" }}>{s.body}</p>

                {/* bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform"
                  style={{ background: "linear-gradient(90deg, #b8860b, transparent)" }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ COMPARISON ══════════════════ */}
      <section className="border-b py-24" style={{ borderColor: "rgba(0,0,0,0.09)", background: "#f5f2ec" }}>
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: "#1c1a17" }}>
              Side by side
            </h2>
            <p className="mt-3 text-sm font-mono" style={{ color: "#6b5e46" }}>
              // diff: TruthMarket vs public prediction markets
            </p>
          </motion.div>

          <motion.div
            {...fadeUp}
            className="mx-auto max-w-2xl overflow-hidden"
            style={{ border: "1px solid rgba(0,0,0,0.09)" }}
          >
            {/* header */}
            <div
              className="grid grid-cols-[1.5fr_1fr_1fr] items-center px-5 py-3.5"
              style={{ background: "rgba(237,232,223,0.8)", borderBottom: "1px solid rgba(0,0,0,0.09)" }}
            >
              <span className="font-mono text-xs" style={{ color: "rgba(28,26,23,0.4)" }}>// visibility</span>
              <span className="text-center font-mono text-xs" style={{ color: "rgba(28,26,23,0.4)" }}>Others</span>
              <span className="text-center font-mono text-xs font-bold" style={{ color: "#b8860b" }}>TruthMarket</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.5fr_1fr_1fr] items-center px-5 py-3.5 text-sm"
                style={{
                  borderBottom: i < COMPARISON.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  background: i % 2 ? "rgba(237,232,223,0.3)" : "transparent",
                }}
              >
                <span className="font-medium" style={{ color: "#1c1a17" }}>{row.label}</span>
                <span className="flex justify-center">{CellP(row.them)}</span>
                <span className="flex justify-center">{CellP(row.us)}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section id="how" className="scroll-mt-20 border-b py-24" style={{ borderColor: "rgba(0,0,0,0.09)", background: "#ede8df" }}>
        <div className="container">
          <motion.div {...fadeUp} className="max-w-xl mb-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-amber-700/60" />
              <span className="font-mono text-xs tracking-widest text-amber-700/80 uppercase">How it works</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight" style={{ color: "#1c1a17" }}>
              Four steps. Nothing leaks.
            </h2>
            <p className="mt-3 leading-relaxed" style={{ color: "#6b5e46" }}>
              It feels like any prediction market — the encryption happens beneath the surface.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.09 }}
                whileHover={{ y: -3, transition: { type: "spring", damping: 18 } }}
                className="p-6 relative"
                style={{ border: "1px solid rgba(0,0,0,0.09)", background: "#f5f2ec" }}
              >
                {/* Large step number */}
                <div
                  className="absolute top-4 right-5 font-mono text-4xl font-light select-none"
                  style={{ color: "rgba(28,26,23,0.06)", lineHeight: 1 }}
                >
                  {s.num}
                </div>

                <div
                  className="mb-4 grid h-10 w-10 place-items-center"
                  style={{ border: "1px solid rgba(184,134,11,0.3)", background: "rgba(184,134,11,0.08)", color: "#b8860b" }}
                >
                  <s.icon className="h-4.5 w-4.5" strokeWidth={1.9} />
                </div>
                <h3 className="font-semibold text-base tracking-tight mb-1.5" style={{ color: "#1c1a17" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6b5e46" }}>{s.body}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            {...fadeUp}
            className="mt-8 max-w-3xl flex items-start gap-4 px-6 py-5"
            style={{ border: "1px solid rgba(184,134,11,0.25)", background: "rgba(184,134,11,0.06)" }}
          >
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#b8860b" }} />
            <p className="text-sm leading-relaxed" style={{ color: "#6b5e46" }}>
              <strong style={{ color: "#1c1a17" }}>Privacy by protocol, not by promise.</strong>{" "}
              Your position size and direction are encrypted in your browser and remain
              encrypted inside the smart contract — the chain itself enforces it. No
              admin, log, or backdoor can undo it. You can always verify your own position.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ FEATURED MARKETS ══════════════════ */}
      {featured.length > 0 && (
        <section className="border-b py-24" style={{ borderColor: "rgba(0,0,0,0.09)", background: "#f5f2ec" }}>
          <div className="container">
            <motion.div {...fadeUp} className="mb-10 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-amber-700/60" />
                  <span className="font-mono text-xs tracking-widest text-amber-700/80 uppercase">Live</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: "#1c1a17" }}>
                  Open markets
                </h2>
              </div>
              <Button
                asChild
                variant="outline"
                className="hidden gap-1.5 sm:inline-flex font-medium"
                style={{ borderColor: "rgba(28,26,23,0.2)", color: "#1c1a17" }}
              >
                <Link href="/markets">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map((m) => <MarketCard key={m.address} m={m} />)}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ FINAL CTA ══════════════════ */}
      <section className="py-32" style={{ background: "#1c1a17" }}>
        <div className="container">
          <div className="max-w-4xl mx-auto grid lg:grid-cols-[1fr_380px] gap-16 items-center">
            {/* left */}
            <motion.div {...fadeUp}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8" style={{ background: "rgba(184,134,11,0.7)" }} />
                <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "rgba(184,134,11,0.7)" }}>
                  Sepolia testnet · Free to try
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold leading-[1.06]" style={{ color: "#f5f2ec" }}>
                Signal the truth.{" "}
                <span style={{ color: "#b8860b" }}>Keep your strategy private.</span>
              </h2>
              <p className="mt-6 leading-relaxed" style={{ color: "rgba(245,242,236,0.55)" }}>
                Grab some test USDC, take a position, and watch the odds move — while your wallet stays invisible.
              </p>
              <div className="mt-9 flex gap-3 flex-wrap">
                <Button
                  asChild
                  size="xl"
                  className="gap-2 font-semibold"
                  style={{ background: "#b8860b", color: "#fff", border: "none", boxShadow: "0 4px 20px rgba(184,134,11,0.35)" }}
                >
                  <Link href="/markets">
                    Open the markets <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="xl"
                  variant="outline"
                  className="font-semibold"
                  style={{ borderColor: "rgba(245,242,236,0.2)", color: "#f5f2ec" }}
                >
                  <Link href="/create">Create a market</Link>
                </Button>
              </div>
            </motion.div>

            {/* right: mini ASCII art */}
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div
                className="relative overflow-hidden"
                style={{ height: 260, border: "1px solid rgba(245,242,236,0.1)", background: "rgba(245,242,236,0.04)" }}
              >
                <MarketHeatmapAscii
                  yesProb={0.57}
                  className="absolute inset-0 w-full h-full"
                />
                {/* Override chars to be light on dark */}
                <style>{`.cta-ascii canvas { filter: invert(1) brightness(0.6); }`}</style>
              </div>
              <div className="mt-3 font-mono text-[11px] text-center" style={{ color: "rgba(184,134,11,0.5)" }}>
                ← ENCRYPTED INDIVIDUAL POSITIONS → AGGREGATE SIGNAL →
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
