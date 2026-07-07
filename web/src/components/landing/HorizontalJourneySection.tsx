"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from "framer-motion";
import { Eye, Trophy, AlertTriangle, Cpu, CheckCircle2, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

interface Milestone {
  step: string;
  year: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  tint: string;
  badge: string;
  badgeColor: string;
  highlights: string[];
}

const MILESTONES: Milestone[] = [
  {
    step: "01",
    year: "1990s — 2018",
    title: "Centralized Bookmakers",
    subtitle: "Black-Box Casinos & Offshore Custody",
    description:
      "Traditional sportsbooks and early prediction sites operated as opaque silos. Bettors faced exorbitant 5-10% rake fees, arbitrary account freezes for winning, and severe counterparty insolvency risk with zero on-chain transparency or proof of reserves.",
    icon: AlertTriangle,
    tint: "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    badge: "Opaque & Custodial",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    highlights: ["5% to 10% Platform Rake", "Frequent Account Freezes", "Zero Proof of Reserves"],
  },
  {
    step: "02",
    year: "2020 — 2024",
    title: "Public DeFi Era",
    subtitle: "Polymarket, Kalshi & The Surveillance Trap",
    description:
      "Blockchain revolutionized prediction markets by enabling non-custodial trading and global liquidity pools. However, 100% public on-chain transparency introduced a fatal structural flaw: complete financial surveillance and orderbook exploitation.",
    icon: Eye,
    tint: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    badge: "Public Surveillance",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    highlights: ["MEV Bots Front-Run Orders", "Copy-Trading Whales Steal Alpha", "Wallet Profiling by Employers"],
  },
  {
    step: "03",
    year: "2025",
    title: "Zama FHEVM Breakthrough",
    subtitle: "Computing Directly on Blind Data",
    description:
      "Fully Homomorphic Encryption (FHE) on Ethereum achieves what was previously thought impossible: performing mathematical operations (addition, subtraction, order matching) directly on encrypted ciphertexts without ever decrypting them in RAM or on-chain.",
    icon: Cpu,
    tint: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    badge: "FHE Technology",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    highlights: ["End-to-End Client Encryption", "Blind On-Chain Order Matching", "No Trusted Hardware Required"],
  },
  {
    step: "04",
    year: "The Future (Today)",
    title: "TruthMarket Protocol",
    subtitle: "Privacy-Preserving Crowd Wisdom",
    description:
      "The first decentralized prediction market where odds and volume remain 100% public for global price discovery, but individual positions, betting sizes, and payout claims are mathematically sealed inside Zama FHE handles.",
    icon: Trophy,
    tint: "border-zama-400 bg-zama-500/15 text-zama-700 dark:text-zama-300 shadow-lg shadow-zama-500/10",
    badge: "The New Standard",
    badgeColor: "bg-gradient-to-r from-amber-400/20 via-zama-500/20 to-amber-400/20 text-zama-800 dark:text-zama-300 border-zama-400/40 font-bold",
    highlights: ["Public Odds, Private Bets", "100% MEV & Copy-Trade Protection", "Confidential Payout Claiming"],
  },
];

export function HorizontalJourneySection() {
  const targetRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  // CRITICAL FIX: Explicitly set offset to ["start start", "end end"]
  // This ensures scroll progress is exactly 0 when the sticky header pins at top-0,
  // and exactly 1 when the container finishes its 400vh scroll!
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  // Smooth out mouse wheel jerks using useSpring for buttery cinematic motion
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
    restDelta: 0.001,
  });

  // Map progress (0 to 1) to horizontal translation across 4 equal cards (0% to -75%)
  const x = useTransform(smoothProgress, [0, 1], ["0%", "-75%"]);

  // Track active step index to update header tabs and indicators
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.22) {
      setActiveStep(0);
    } else if (latest < 0.48) {
      setActiveStep(1);
    } else if (latest < 0.74) {
      setActiveStep(2);
    } else {
      setActiveStep(3);
    }
  });

  return (
    <section ref={targetRef} className="relative h-[280vh] bg-background">
      {/* Pinned Sticky Stage */}
      <div className="sticky top-0 flex h-screen flex-col justify-between overflow-hidden border-y border-border/80 bg-gradient-to-b from-background via-secondary/10 to-background py-4 sm:py-6 md:py-8">
        
        {/* ─── TOP HEADER & STEP TABS ─── */}
        <div className="container relative z-10 max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 shadow-sm">
                <Sparkles className="h-3 w-3 text-zama-500 animate-spin-slow" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-zama-700 dark:text-zama-400">
                  Historical Timeline
                </span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl text-wrap-balance">
                The Evolution of <span className="text-gradient">Prediction Markets</span>
              </h2>
            </div>

            {/* Interactive Step Progress Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {MILESTONES.map((m, idx) => {
                const isActive = activeStep === idx;
                return (
                  <div
                    key={m.step}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all duration-300 ${
                      isActive
                        ? "border-zama-400 bg-zama-500/15 text-foreground shadow-sm scale-105"
                        : "border-border/60 bg-card/50 text-muted-foreground opacity-60"
                    }`}
                  >
                    <span className="font-mono text-[11px] font-black">{m.step}</span>
                    <span className="text-[11px] font-bold whitespace-nowrap">{m.year}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── HORIZONTAL MOVING TRACK ─── */}
        <div className="flex flex-1 items-center overflow-hidden my-auto">
          <motion.div
            style={{ x }}
            className="flex items-center gap-5 px-4 sm:gap-6 sm:px-6 md:gap-8 md:px-8"
          >
            {MILESTONES.map((m, index) => {
              const isActive = activeStep === index;
              return (
                <div
                  key={m.step}
                  className={`group relative flex w-[82vw] shrink-0 flex-col justify-between rounded-2xl border p-4 transition-all duration-500 sm:w-[380px] sm:p-5 md:w-[420px] md:p-6 lg:w-[460px] ${
                    isActive
                      ? "border-zama-400/80 bg-card shadow-xl dark:bg-zinc-900/95 ring-1 ring-zama-400/20 scale-[1.01]"
                      : "border-border/60 bg-card/60 shadow-md dark:bg-zinc-900/60 opacity-75 hover:opacity-95"
                  }`}
                >
                  <div>
                    {/* Card Header & Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary font-mono text-[11px] font-black text-foreground">
                          {m.step}
                        </span>
                        <span className="font-mono text-sm font-bold tracking-tight text-muted-foreground sm:text-base">
                          {m.year}
                        </span>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${m.badgeColor}`}>
                        {m.badge}
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="mt-3.5 flex items-start gap-3">
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${m.tint} shadow-inner transition-transform duration-500 group-hover:scale-105`}>
                        <m.icon className="h-5 w-5" strokeWidth={2.2} />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg md:text-xl text-wrap-balance">
                          {m.title}
                        </h3>
                        <p className="mt-0.5 font-display text-[11px] font-semibold text-zama-700 dark:text-zama-400 sm:text-xs">
                          {m.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground sm:text-sm text-wrap-pretty">
                      {m.description}
                    </p>
                  </div>

                  {/* Highlights Footer */}
                  <div className="mt-3.5 border-t border-border/60 pt-3">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      Key Characteristics
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.highlights.map((h) => (
                        <span
                          key={h}
                          className="rounded-md border border-border/80 bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold text-foreground"
                        >
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* ─── BOTTOM SCROLL PROGRESS & INSTRUCTIONS ─── */}
        <div className="container relative z-10 max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-zama-500 animate-ping" />
              Scroll Down to Explore Timeline
            </span>
            <span>Step {activeStep + 1} of 4</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border/60">
            <motion.div
              style={{ scaleX: smoothProgress }}
              className="h-full origin-left bg-gradient-to-r from-amber-400 via-zama-500 to-amber-300 shadow-sm"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
