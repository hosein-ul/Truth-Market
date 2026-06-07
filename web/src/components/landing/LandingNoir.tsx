"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight, Lock, EyeOff, BarChart3,
  Wallet, KeyRound, Crosshair, Copy, Eye, Trophy,
  Check, X, ShieldCheck, Cpu,
} from "lucide-react";
import type { MarketSummary } from "@/lib/markets";
import { MarketCard } from "@/components/MarketCard";
import { Button } from "@/components/ui/button";
import { MarketHeatmapAscii } from "@/components/art/MarketHeatmapAscii";

/* ─── Fade-up animation preset ─── */
const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

/* ─── Word-by-word reveal ─── */
function WordReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true });
  return (
    <span ref={ref} className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.22em] last:mr-0">
          <motion.span
            className="inline-block"
            initial={{ y: "105%", opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{
              delay: delay + i * 0.07,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ─── Animated number counter ─── */
function Ticker({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true });
  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const step = to / 36;
    const id = setInterval(() => {
      cur = Math.min(cur + step, to);
      setV(Math.round(cur));
      if (cur >= to) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{v}{suffix}</span>;
}

/* ─── ASCII section label ─── */
function AsciiLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-px w-6 bg-black/30" />
      <span className="font-mono text-[11px] tracking-[0.2em] text-black/40 uppercase">{children}</span>
      <div className="h-px flex-1 bg-black/08" style={{ background: "rgba(0,0,0,0.06)" }} />
    </div>
  );
}

/* ─── Data ─── */
const PROBLEMS = [
  { icon: Crosshair, num: "01", title: "You get tracked the moment you perform", body: "Profitable wallets are public targets. Dozens of dashboards exist purely to find and follow them — the better you perform, the more eyes study and copy your every move." },
  { icon: Copy, num: "02", title: "Copiers front-run your signal", body: "As soon as a large position lands, algorithmic followers pile in before you finish building. Sharp traders run secondary accounts just to remain unseen." },
  { icon: Eye, num: "03", title: "Your convictions become a permanent record", body: "Every financial or political market call is etched on-chain next to your address — searchable by anyone, forever, including people you'd rather not inform." },
  { icon: BarChart3, num: "04", title: "Visible flow corrupts the signal", body: "When the crowd can see who's positioning and how much, it herds toward large wallets instead of truth — destroying the signal prediction markets exist to surface." },
];

const SOLUTIONS = [
  { icon: Lock, num: "01", title: "Encrypted positions", body: "Your size and direction are encrypted client-side before they ever reach the chain. No order book, event, or log can be traced back to you." },
  { icon: BarChart3, num: "02", title: "Honest, public odds", body: "Aggregate odds stay fully public for real price discovery — without exposing any individual position behind them." },
  { icon: Trophy, num: "03", title: "Confidential settlement", body: "Winnings are paid privately. Only your wallet can decrypt what you received — no one can reverse-engineer your position from the outcome." },
];

const COMPARISON = [
  { label: "Live public odds", them: "yes" as const, us: "yes" as const },
  { label: "Your position size", them: "Exposed", us: "Encrypted" },
  { label: "Direction (YES / NO)", them: "Exposed", us: "Encrypted" },
  { label: "Copy-trading & front-running", them: "Common", us: "Impossible" },
  { label: "Wallet history on-chain", them: "Forever", us: "Never" },
  { label: "Settlement amount", them: "Public", us: "Confidential" },
];

const STEPS = [
  { icon: Wallet,    num: "01", title: "Fund once",            body: "Convert test USDC into a confidential balance in a single step. Every position after is one click." },
  { icon: Lock,      num: "02", title: "Position privately",   body: "Choose a direction and size. Both are encrypted in your browser before the transaction is broadcast." },
  { icon: BarChart3, num: "03", title: "Watch the signal",     body: "The market shows aggregate odds live — where the crowd leans, never who's behind it." },
  { icon: KeyRound,  num: "04", title: "Claim confidentially", body: "When the market resolves, your payout is computed and transferred privately. Only you can decrypt it." },
];

/* ─── Comparison cell ─── */
function Cell(v: "yes" | "no" | string) {
  if (v === "yes") return <Check className="h-4 w-4 text-black/70" strokeWidth={2.5} />;
  if (v === "no")  return <X    className="h-4 w-4 text-black/25" strokeWidth={2.5} />;
  const good = v === "Encrypted" || v === "Impossible" || v === "Never" || v === "Confidential";
  return (
    <span className={`font-mono text-xs font-semibold ${good ? "text-black" : "text-black/30"}`}>
      {good ? `[${v}]` : v}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export function LandingNoir({ featured }: { featured: MarketSummary[] }) {
  return (
    <div className="overflow-hidden" style={{ background: "#f9f9fb", color: "#0a0a0a" }}>

      {/* ════════════════ HERO ════════════════ */}
      <section
        className="relative min-h-[95vh] flex items-center"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      >
        {/* ── Corner ASCII annotations ── */}
        <div className="absolute top-6 left-6 font-mono text-[10px] leading-snug select-none hidden xl:block"
          style={{ color: "rgba(0,0,0,0.13)" }}>
          <div>╔══ ZAMA FHEVM · SEPOLIA:11155111 ══╗</div>
          <div>║ ENCRYPTION · ACTIVE                ║</div>
          <div>╚════════════════════════════════════╝</div>
        </div>

        <div className="absolute top-7 right-7 font-mono text-[10px] leading-snug select-none hidden xl:flex flex-col items-end gap-1"
          style={{ color: "rgba(0,0,0,0.13)" }}>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-black/30 animate-pulse" />
            <span>POSITIONS · ENCRYPTED</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-black/20 animate-pulse" />
            <span>ODDS · PUBLIC</span>
          </div>
        </div>

        <div className="container relative py-28 sm:py-36" style={{ zIndex: 1 }}>
          <div className="grid lg:grid-cols-[1fr_500px] xl:grid-cols-[1fr_560px] gap-14 xl:gap-20 items-center">

            {/* ── Left: editorial text ── */}
            <div>
              {/* Protocol badge */}
              <motion.div
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8 inline-flex items-center gap-2.5 font-mono text-xs"
                style={{ color: "rgba(0,0,0,0.4)" }}
              >
                <Cpu className="h-3 w-3" strokeWidth={1.8} />
                <span style={{ color: "rgba(0,0,0,0.25)" }}>╔═</span>
                <span>CONFIDENTIAL BY PROTOCOL</span>
                <span style={{ color: "rgba(0,0,0,0.25)" }}>═╗</span>
              </motion.div>

              {/* H1 — serif + monochrome gradient */}
              <h1 className="font-serif leading-[1.04] tracking-tight">
                <span className="block text-[clamp(2.4rem,5vw,4.5rem)] font-bold" style={{ color: "#0a0a0a" }}>
                  <WordReveal text="Predict the truth." delay={0.1} />
                </span>
                <span
                  className="block text-[clamp(2.4rem,5vw,4.5rem)] font-bold mt-1"
                  style={{
                    background: "linear-gradient(100deg, #0a0a0a 0%, #444 60%, #888 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  <WordReveal text="Without showing your hand." delay={0.35} />
                </span>
              </h1>

              {/* ASCII divider */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.85, duration: 0.55 }}
                className="my-7 font-mono text-[11px] origin-left select-none"
                style={{ color: "rgba(0,0,0,0.18)" }}
              >
                ═══════════════════════════ § ═══════════════════════════
              </motion.div>

              {/* Body */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.55 }}
                className="max-w-xl text-[1.05rem] leading-relaxed"
                style={{ color: "rgba(0,0,0,0.5)" }}
              >
                Every other prediction market broadcasts your position size, direction, and
                full history — tied to your wallet forever. TruthMarket encrypts your
                position on-chain using{" "}
                <strong style={{ color: "#0a0a0a" }}>Zama FHEVM</strong>. The
                crowd&apos;s odds stay visible. Your edge stays yours.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.5 }}
                className="mt-9 flex flex-wrap gap-3"
              >
                <Button
                  asChild size="xl"
                  className="gap-2 font-semibold border-0"
                  style={{ background: "#0a0a0a", color: "#f9f9fb", boxShadow: "0 4px 18px rgba(0,0,0,0.18)" }}
                >
                  <Link href="/markets">
                    Open the markets <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild size="xl" variant="outline"
                  className="font-semibold"
                  style={{ borderColor: "rgba(0,0,0,0.2)", color: "#0a0a0a" }}
                >
                  <Link href="#how">How it works</Link>
                </Button>
              </motion.div>

              {/* Trust pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.05, duration: 0.6 }}
                className="mt-10 flex flex-wrap items-center gap-5"
              >
                {[
                  { icon: <Lock className="h-3.5 w-3.5" />, label: "Encrypted positions" },
                  { icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Public market odds" },
                  { icon: <EyeOff className="h-3.5 w-3.5" />, label: "Untrackable wallet" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5" style={{ color: "rgba(0,0,0,0.4)" }}>
                    {t.icon}
                    <span className="text-sm font-medium">{t.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── Right: ASCII probability art ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:flex flex-col"
            >
              {/* Header label */}
              <div className="mb-2 font-mono text-[10px] tracking-widest select-none"
                style={{ color: "rgba(0,0,0,0.2)" }}>
                ┌── ENCRYPTED CONSENSUS FIELD ──────────────────┐
              </div>

              {/* ASCII heatmap canvas */}
              <div
                className="relative overflow-hidden"
                style={{
                  height: 320,
                  border: "1px solid rgba(0,0,0,0.09)",
                  background: "#ffffff",
                }}
              >
                <MarketHeatmapAscii yesProb={0.64} className="absolute inset-0 w-full h-full" />

                {/* Y-axis labels */}
                <div className="absolute left-3 top-3 font-mono text-[9px] leading-tight select-none"
                  style={{ color: "rgba(0,0,0,0.22)" }}>
                  <div>HIGH</div>
                  <div className="mt-1">density</div>
                </div>
                <div className="absolute left-3 bottom-3 font-mono text-[9px] leading-tight select-none"
                  style={{ color: "rgba(0,0,0,0.22)" }}>
                  <div>LOW</div>
                  <div>density</div>
                </div>

                {/* X-axis markers */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-between px-10 font-mono text-[9px] select-none"
                  style={{ color: "rgba(0,0,0,0.22)" }}>
                  <span>YES ← 64%</span>
                  <span className="text-center" style={{ color: "rgba(0,0,0,0.12)" }}>· encrypted ·</span>
                  <span>36% → NO</span>
                </div>
              </div>

              {/* Footer label */}
              <div className="mt-0 font-mono text-[10px] tracking-widest select-none"
                style={{ color: "rgba(0,0,0,0.2)" }}>
                └── INDIVIDUAL POSITIONS HIDDEN · AGGREGATE PUBLIC ┘
              </div>

              {/* Stats row */}
              <div
                className="mt-3 grid grid-cols-3 divide-x text-center py-4"
                style={{
                  border: "1px solid rgba(0,0,0,0.09)",
                  background: "#ffffff",
                  borderTop: "1px solid rgba(0,0,0,0.09)",
                }}
              >
                {[
                  { v: <Ticker to={142} />, label: "positions", sub: "encrypted on-chain" },
                  { v: "64%", label: "YES odds", sub: "live market signal" },
                  { v: <Ticker to={48} suffix="k" />, label: "USDC vol.", sub: "total market size" },
                ].map((s, i) => (
                  <div key={i} className="px-3" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                    <div className="font-mono text-lg font-bold" style={{ color: "#0a0a0a" }}>{s.v}</div>
                    <div className="font-mono text-[9px] mt-0.5" style={{ color: "rgba(0,0,0,0.35)" }}>{s.label}</div>
                    <div className="font-mono text-[9px]" style={{ color: "rgba(0,0,0,0.2)" }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════ THE PROBLEM ════════════════ */}
      <section className="py-24" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#ffffff" }}>
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mb-14">
            <AsciiLabel>The problem</AsciiLabel>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight" style={{ color: "#0a0a0a" }}>
              On public markets, your strategy
              <br />
              <span style={{ color: "rgba(0,0,0,0.4)" }}>is everyone&apos;s to study.</span>
            </h2>
            <p className="mt-4 leading-relaxed" style={{ color: "rgba(0,0,0,0.45)" }}>
              Full transparency sounds fair — until it&apos;s your edge being tracked.
              When every call is public and tied to your wallet, the market turns against
              the people who are actually right.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-3 max-w-4xl">
            {PROBLEMS.map((p, i) => (
              <motion.div
                key={p.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.07 }}
                whileHover={{ y: -2, transition: { type: "spring", damping: 20 } }}
                className="group relative p-6 cursor-default"
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "#f9f9fb",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.2)";
                  (e.currentTarget as HTMLElement).style.background = "#fff";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
                  (e.currentTarget as HTMLElement).style.background = "#f9f9fb";
                }}
              >
                {/* ASCII step number */}
                <div className="absolute top-4 right-5 font-mono text-xs select-none"
                  style={{ color: "rgba(0,0,0,0.12)" }}>
                  ┌─{p.num}─┐
                </div>

                <div className="mb-4 grid h-10 w-10 place-items-center"
                  style={{ border: "1px solid rgba(0,0,0,0.15)", background: "rgba(0,0,0,0.03)" }}>
                  <p.icon className="h-4 w-4" style={{ color: "rgba(0,0,0,0.5)" }} strokeWidth={1.8} />
                </div>
                <h3 className="font-semibold text-[0.95rem] tracking-tight mb-2" style={{ color: "#0a0a0a" }}>
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(0,0,0,0.45)" }}>
                  {p.body}
                </p>

                {/* Cipher watermark in corner */}
                <div className="absolute bottom-3 left-4 font-mono text-[9px] select-none opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "rgba(0,0,0,0.12)" }}>
                  {["3FA2·B91C", "ψE7D·4A2F", "K=√2⁴⁸", "ZKP·VERIFY"][i]}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ THE SOLUTION ════════════════ */}
      <section className="py-24" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#f4f4f5" }}>
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mb-14">
            <AsciiLabel>How TruthMarket is different</AsciiLabel>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight" style={{ color: "#0a0a0a" }}>
              Keep the wisdom of the crowd.
              <br />
              <span style={{ color: "rgba(0,0,0,0.4)" }}>Remove the surveillance.</span>
            </h2>
            <p className="mt-4 leading-relaxed" style={{ color: "rgba(0,0,0,0.45)" }}>
              A prediction market only needs <em>aggregate</em> odds to work. It never
              needed your name on every trade. We encrypt what should always have been
              private — and leave the prices public.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl">
            {SOLUTIONS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.09 }}
                whileHover={{ y: -4, transition: { type: "spring", damping: 16 } }}
                className="group relative p-7"
                style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#ffffff" }}
              >
                {/* Top edge that appears on hover */}
                <div className="absolute top-0 left-0 right-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                  style={{ background: "#0a0a0a" }} />

                <div className="mb-4 font-mono text-3xl font-light select-none"
                  style={{ color: "rgba(0,0,0,0.07)" }}>
                  {s.num}
                </div>
                <div className="mb-4 grid h-11 w-11 place-items-center"
                  style={{ border: "1px solid rgba(0,0,0,0.15)", background: "rgba(0,0,0,0.03)" }}>
                  <s.icon className="h-5 w-5" style={{ color: "#0a0a0a" }} strokeWidth={1.8} />
                </div>
                <h3 className="font-semibold text-base tracking-tight mb-2" style={{ color: "#0a0a0a" }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(0,0,0,0.45)" }}>
                  {s.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ COMPARISON ════════════════ */}
      <section className="py-24" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#ffffff" }}>
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center mb-12">
            <AsciiLabel>Side by side</AsciiLabel>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: "#0a0a0a" }}>
              The same public odds.
              <br />
              <span style={{ color: "rgba(0,0,0,0.4)" }}>A fundamentally different privacy model.</span>
            </h2>
          </motion.div>

          <motion.div {...fadeUp} className="mx-auto max-w-2xl overflow-hidden"
            style={{ border: "1px solid rgba(0,0,0,0.09)" }}>
            {/* ASCII table header */}
            <div className="font-mono text-[10px] px-5 py-2 select-none"
              style={{ background: "#f4f4f5", borderBottom: "1px solid rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.3)" }}>
              // diff: TruthMarket vs public prediction markets
            </div>
            <div className="grid grid-cols-[1.6fr_1fr_1fr] items-center px-5 py-3"
              style={{ background: "#f9f9fb", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <span className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>// what's visible</span>
              <span className="text-center font-mono text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>Others</span>
              <span className="text-center font-mono text-xs font-bold" style={{ color: "#0a0a0a" }}>TruthMarket</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.6fr_1fr_1fr] items-center px-5 py-3.5 text-sm"
                style={{
                  borderBottom: i < COMPARISON.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  background: i % 2 ? "#f9f9fb" : "#ffffff",
                }}
              >
                <span className="font-medium text-sm" style={{ color: "#0a0a0a" }}>{row.label}</span>
                <span className="flex justify-center">{Cell(row.them)}</span>
                <span className="flex justify-center">{Cell(row.us)}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section id="how" className="scroll-mt-20 py-24"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#f4f4f5" }}>
        <div className="container">
          <motion.div {...fadeUp} className="max-w-xl mb-14">
            <AsciiLabel>How it works</AsciiLabel>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight" style={{ color: "#0a0a0a" }}>
              Four steps. Nothing leaks.
            </h2>
            <p className="mt-3 leading-relaxed" style={{ color: "rgba(0,0,0,0.45)" }}>
              It feels like any prediction market — the encryption happens beneath the surface.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.09 }}
                whileHover={{ y: -3, transition: { type: "spring", damping: 18 } }}
                className="group relative p-6"
                style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#ffffff" }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                  style={{ background: "#0a0a0a" }} />

                {/* ASCII box number */}
                <div className="mb-2 font-mono text-[10px] leading-tight select-none"
                  style={{ color: "rgba(0,0,0,0.2)" }}>
                  <div>┌─ {s.num} ─┐</div>
                  <div className="text-[8px]">└───────┘</div>
                </div>

                {/* Ghost large number */}
                <div className="absolute top-4 right-5 font-mono text-4xl font-light select-none leading-none"
                  style={{ color: "rgba(0,0,0,0.04)" }}>
                  {s.num}
                </div>

                <div className="mb-4 grid h-10 w-10 place-items-center"
                  style={{ border: "1px solid rgba(0,0,0,0.15)", background: "rgba(0,0,0,0.03)" }}>
                  <s.icon className="h-4 w-4" style={{ color: "#0a0a0a" }} strokeWidth={1.9} />
                </div>
                <h3 className="font-semibold text-[0.95rem] tracking-tight mb-1.5" style={{ color: "#0a0a0a" }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(0,0,0,0.45)" }}>
                  {s.body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Protocol note */}
          <motion.div
            {...fadeUp}
            className="mt-8 max-w-3xl flex items-start gap-4 px-6 py-5"
            style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#ffffff" }}
          >
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "rgba(0,0,0,0.5)" }} />
            <p className="text-sm leading-relaxed" style={{ color: "rgba(0,0,0,0.5)" }}>
              <strong style={{ color: "#0a0a0a" }}>Privacy by protocol, not by promise.</strong>{" "}
              Your size and direction are encrypted in your browser and remain encrypted
              inside the smart contract — the chain enforces it. No admin, log, or
              backdoor can undo it. You can always verify your own position with your wallet.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════ FEATURED MARKETS ════════════════ */}
      {featured.length > 0 && (
        <section className="py-24" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#ffffff" }}>
          <div className="container">
            <motion.div {...fadeUp} className="mb-10 flex items-end justify-between">
              <div>
                <AsciiLabel>Live</AsciiLabel>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: "#0a0a0a" }}>
                  Open markets
                </h2>
                <p className="mt-1 font-mono text-xs" style={{ color: "rgba(0,0,0,0.3)" }}>
                  // public odds · encrypted positions
                </p>
              </div>
              <Button asChild variant="outline" className="hidden gap-1.5 sm:inline-flex font-medium"
                style={{ borderColor: "rgba(0,0,0,0.2)", color: "#0a0a0a" }}>
                <Link href="/markets">View all <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map((m) => (
                <MarketCard key={m.address} m={m} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════ FINAL CTA ════════════════ */}
      <section className="py-36 relative overflow-hidden" style={{ background: "#0a0a0a" }}>
        {/* Subtle cipher chars in dark background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <pre className="font-mono text-[11px] leading-5 opacity-[0.04] text-white p-8 whitespace-pre-wrap">
            {Array.from({ length: 40 }, () =>
              Array.from({ length: 120 }, () =>
                "0123456789ABCDEFabcdef░▒▓│┤┐└┴┬├─┼"[Math.floor(Math.random() * 36)]
              ).join("")
            ).join("\n")}
          </pre>
        </div>

        <motion.div {...fadeUp} className="container relative text-center">
          {/* ZK cert block */}
          <div className="mb-10 mx-auto max-w-fit">
            <pre className="font-mono text-[11px] leading-relaxed select-none text-left"
              style={{ color: "rgba(255,255,255,0.15)" }}>
{`┌──────────────────────────────────────────┐
│  π = [A₁·g₁ + ... + Aₙ·gₙ]             │
│  verifier.verify(π, pub) → TRUE          │
│  FHE.decrypt(position, wallet) → ✓       │
└──────────────────────────────────────────┘`}
            </pre>
          </div>

          <div className="mb-6 inline-flex items-center gap-2 font-mono text-xs"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>╔═</span>
            Sepolia testnet · free to try
            <span style={{ color: "rgba(255,255,255,0.15)" }}>═╗</span>
          </div>

          <h2 className="mx-auto max-w-3xl font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.06]"
            style={{ color: "#f9f9fb" }}>
            Signal the truth.{" "}
            <span style={{ color: "rgba(255,255,255,0.45)" }}>Keep your strategy private.</span>
          </h2>

          <div className="mt-5 font-mono text-xs select-none" style={{ color: "rgba(255,255,255,0.12)" }}>
            ═══════════════════ § ═══════════════════
          </div>

          <p className="mx-auto mt-5 max-w-xl" style={{ color: "rgba(255,255,255,0.4)" }}>
            Grab some test USDC, take a position, and watch the odds move — while your
            wallet stays invisible.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl"
              className="gap-2 font-semibold border-0"
              style={{ background: "#f9f9fb", color: "#0a0a0a", boxShadow: "0 4px 20px rgba(255,255,255,0.15)" }}>
              <Link href="/markets">
                Open the markets <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline"
              className="font-semibold"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}>
              <Link href="/create">Create a market</Link>
            </Button>
          </div>

          {/* ASCII footer */}
          <div className="mt-20 font-mono text-[10px] select-none"
            style={{ color: "rgba(255,255,255,0.08)" }}>
            ╔══════════════════════════════════════════════════════════╗<br />
            ║ &nbsp;TRUTH·MARKET · CONFIDENTIAL PREDICTION MARKET · ZAMA&nbsp; ║<br />
            ╚══════════════════════════════════════════════════════════╝
          </div>
        </motion.div>
      </section>
    </div>
  );
}
