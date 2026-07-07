"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight, Lock, EyeOff, Eye, Crosshair, Copy, ShieldCheck, Cpu,
  Wallet, BarChart3, Trophy, Check, X, Sparkles,
} from "lucide-react";
import type { MarketSummary } from "@/lib/markets";
import { MarketCard } from "@/components/MarketCard";
import { Button } from "@/components/ui/button";
import { HorizontalJourneySection } from "@/components/landing/HorizontalJourneySection";
import { PinnedMorphingSection } from "@/components/landing/PinnedMorphingSection";
import { FaqSection } from "@/components/landing/FaqSection";

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
    <div className="relative bg-background text-foreground transition-colors duration-300">
      {/* Global Native CSS Scroll Progress Line from modern-web-guidance */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-50 bg-gradient-to-r from-amber-400 via-zama-500 to-amber-300 scroll-progress-native pointer-events-none" />

      {/* ─────────────────── GLOBAL AMBIENT AURORA BACKGROUND ─────────────────── */}
      {/* Light & Dark Mode Compatible Ambient Glows — No ugly 3D canvas! */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Subtle grid mesh */}
        <div className="absolute inset-0 bg-grid opacity-35 dark:opacity-40 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_30%,#000_60%,transparent_100%)]" />
        
        {/* Top Right Gold/Amber Blob */}
        <div className="absolute -right-32 -top-32 h-[36rem] w-[36rem] rounded-full bg-amber-400/20 blur-[100px] transition-all duration-700 dark:bg-amber-500/15 animate-pulse" style={{ animationDuration: "7s" }} />
        
        {/* Top Left Zama Yellow Blob */}
        <div className="absolute -left-32 top-10 h-[32rem] w-[32rem] rounded-full bg-zama-400/25 blur-[100px] transition-all duration-700 dark:bg-zama-500/15 animate-pulse" style={{ animationDuration: "9s" }} />
        
        {/* Center Soft Warm Aura */}
        <div className="absolute left-1/2 top-[28%] -translate-x-1/2 -translate-y-1/2 h-[45rem] w-[45rem] rounded-full bg-gradient-to-tr from-amber-300/15 via-zama-300/10 to-transparent blur-[120px] dark:from-amber-600/10 dark:via-zama-500/10 pointer-events-none" />
      </div>

      {/* ───────────────────────── HERO SECTION (SCROLL PARALLAX) ───────────────────────── */}
      <HeroSection stats={stats} />

      {/* ───────────────────── THE PROBLEM (HORIZONTAL CONVERGENCE) ───────────────────── */}
      <ProblemSection />

      {/* ───────────────────── HORIZONTAL SCROLL JOURNEY (MILESTONES) ───────────────────── */}
      <HorizontalJourneySection />

      {/* ───────────────────── THE SOLUTION (STAGGER CASCADE / SCROLLYTELLING) ───────────────────── */}
      <SolutionSection />

      {/* ───────────────────── PINNED VIEWPORT & MORPHING STORY (FHEVM ENGINE) ───────────────────── */}
      <PinnedMorphingSection />

      {/* ───────────────────── COMPARISON (SCROLL ROW ILLUMINATION) ───────────────────── */}
      <ComparisonSection />

      {/* ───────────────────── HOW IT WORKS (SCROLL PROGRESS LINE) ───────────────────── */}
      <HowItWorksSection />

      {/* ───────────────────── FEATURED MARKETS ───────────────────── */}
      {featured.length > 0 && <FeaturedSection featured={featured} />}

      {/* ───────────────────── FAQ & ABOUT DEEP DIVE ───────────────────── */}
      <FaqSection />

      {/* ───────────────────── FINAL CTA (VIEWPORT SCALE PARALLAX) ───────────────────── */}
      <FinalCtaSection />
    </div>
  );
}

/* ========================================================================================
   SUB-COMPONENTS WITH EXTENSIVE SCROLL-BASED ANIMATIONS
   ======================================================================================== */

// 1. HERO SECTION WITH PARALLAX & FADE-OUT ON SCROLL
function HeroSection({ stats }: { stats?: LandingStats }) {
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Track scroll inside the hero container for parallax effect
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 600], [0, -110]);
  const opacityFade = useTransform(scrollY, [0, 450], [1, 0]);
  const scaleDown = useTransform(scrollY, [0, 600], [1, 0.94]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 28, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section ref={heroRef} className="relative isolate border-b border-border pb-24 pt-20 sm:pb-32 sm:pt-28">
      <motion.div
        style={{ y: yParallax, opacity: opacityFade, scale: scaleDown }}
        className="container relative z-10"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div
            variants={itemVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-zama-300 bg-white/80 px-4 py-1.5 text-sm font-semibold text-zama-900 shadow-sm backdrop-blur dark:border-zama-700/80 dark:bg-zinc-900/80 dark:text-zama-300"
          >
            <Cpu className="h-3.5 w-3.5 text-zama-600 dark:text-zama-400" strokeWidth={2.5} />
            Confidential by protocol — powered by Zama FHEVM
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-display text-4xl font-extrabold leading-[1.04] tracking-tight text-foreground sm:text-6xl"
          >
            Bet on the truth.{" "}
            <span className="text-gradient">Without showing your hand.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          >
            Every other prediction market broadcasts your every move — your size, your
            side, your whole strategy. TruthMarket keeps your position{" "}
            <strong className="text-foreground">encrypted on-chain</strong>. The
            crowd&apos;s odds stay public; your edge stays yours.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="xl" variant="gradient" className="w-full gap-2 shadow-md sm:w-auto">
              <Link href="/markets">
                Open the markets
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="w-full bg-background/60 backdrop-blur sm:w-auto">
              <Link href="#how">See how it works</Link>
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mx-auto mt-12 flex max-w-md items-center justify-center gap-6 text-left"
          >
            <TrustPill icon={<Lock className="h-4 w-4" />} title="Encrypted" sub="amount + side" />
            <div className="h-9 w-px bg-border" />
            <TrustPill icon={<BarChart3 className="h-4 w-4" />} title="Public odds" sub="real price discovery" />
            <div className="h-9 w-px bg-border" />
            <TrustPill icon={<EyeOff className="h-4 w-4" />} title="Untrackable" sub="no whale-watching" />
          </motion.div>

          {/* Live on-chain stats with 3D scroll tilt */}
          {stats && stats.markets > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.92, rotateX: 12 }}
              whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              viewport={{ once: false, margin: "-40px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformPerspective: 800 }}
              className="mx-auto mt-12 grid max-w-lg grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card/90 shadow-soft backdrop-blur"
            >
              <HeroStat value={stats.markets} label="live markets" />
              <HeroStat value={stats.positions} label="encrypted positions" />
              <HeroStat value={stats.settled} label="markets settled" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}

// 2. THE PROBLEM SECTION (HORIZONTAL SCROLL CONVERGENCE)
function ProblemSection() {
  return (
    <section className="relative border-b border-border bg-secondary/30 py-24 scroll-reveal-native">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
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

        {/* Horizontal scroll convergence grid */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {PROBLEMS.map((p, i) => {
            // Left column slides in from left (-60px), Right column slides from right (+60px)
            const isLeft = i % 2 === 0;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, x: isLeft ? -60 : 60, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: false, margin: "-60px" }}
                transition={{ duration: 0.7, delay: (i % 2) * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2 } }}
                className="group flex gap-3.5 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-soft transition-all hover:border-zama-400/50 hover:shadow-md dark:hover:border-zama-500/50"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-no-ring/40 bg-no-bg text-no-fg transition-transform duration-300 group-hover:scale-110">
                  <p.icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold tracking-tight text-foreground">{p.title}</h3>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// 3. THE SOLUTION SECTION (INTERACTIVE SCROLLYTELLING SHOWCASE)
function SolutionSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="relative border-b border-border py-24 scrolly-section">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-bold uppercase tracking-wider text-zama-700 dark:text-zama-400">
            How TruthMarket is different
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Keep the wisdom of the crowd.{" "}
            <span className="text-gradient">Lose the surveillance.</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Scroll down through the architecture below to see how Zama FHEVM
            protects your trades in real time without sacrificing price discovery.
          </p>
        </motion.div>

        {/* Dual-Pane Scrollytelling Layout */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Narrative Scroll Steps (7 cols) */}
          <div className="flex flex-col gap-10 lg:col-span-7 lg:py-6">
            {SOLUTIONS.map((s, i) => {
              const isActive = activeStep === i;
              return (
                <motion.div
                  key={s.title}
                  onViewportEnter={() => setActiveStep(i)}
                  viewport={{ once: false, margin: "-35% 0px -40% 0px" }}
                  initial={{ opacity: 0.4, x: -20 }}
                  whileInView={{ opacity: isActive ? 1 : 0.45, x: 0 }}
                  transition={{ duration: 0.5 }}
                  onClick={() => setActiveStep(i)}
                  className={`group relative cursor-pointer rounded-2xl border p-5 sm:p-6 transition-all duration-500 ${
                    isActive
                      ? "border-zama-400 bg-card shadow-xl dark:border-zama-500/80 dark:bg-zinc-900/90 scale-[1.01]"
                      : "border-border/50 bg-card/40 hover:border-border hover:bg-card/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`grid h-11 w-11 place-items-center rounded-xl border ${s.tint} transition-transform duration-300 group-hover:scale-105`}>
                      <s.icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <span className={`font-display text-xs font-bold uppercase tracking-widest ${isActive ? "text-zama-600 dark:text-zama-400" : "text-muted-foreground"}`}>
                      Step 0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">{s.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  
                  {/* Active Indicator Bar */}
                  <div className={`mt-4 h-1 w-full rounded-full transition-all duration-700 ${isActive ? "bg-gradient-to-r from-amber-400 via-zama-500 to-amber-300 opacity-100" : "bg-border opacity-30"}`} />
                </motion.div>
              );
            })}
          </div>

          {/* Right Column: Sticky Interactive Visualization Deck (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="relative overflow-hidden rounded-2xl border border-zama-400/50 bg-card/95 p-4 sm:p-5 shadow-xl backdrop-blur-2xl dark:border-zama-500/40 dark:bg-zinc-900/95">
              {/* Background ambient glow inside deck */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-zama-400/20 blur-3xl dark:bg-zama-500/15" />
              
              <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Live FHEVM Simulator
                  </span>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-foreground">
                  State 0{activeStep + 1} / 03
                </span>
              </div>

              {/* Dynamic Interactive State Machine */}
              <div className="min-h-[320px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {activeStep === 0 && (
                    <motion.div
                      key="step-0"
                      initial={{ opacity: 0, scale: 0.92, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -15 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-5"
                    >
                      <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                        <div className="text-xs font-bold uppercase text-muted-foreground">Your Secret Order</div>
                        <div className="mt-2 flex items-center justify-between font-display text-lg font-bold text-foreground">
                          <span>Buy YES · 10,000 USDC</span>
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Cleartext</span>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-zama-400/20 text-zama-700 dark:bg-zama-500/20 dark:text-zama-300 animate-bounce">
                          <Lock className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zama-400/60 bg-zama-500/10 p-5 shadow-inner dark:border-zama-500/60">
                        <div className="flex items-center justify-between text-xs font-bold uppercase text-zama-800 dark:text-zama-300">
                          <span>On-Chain FHE Ciphertext</span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5" /> Encrypted
                          </span>
                        </div>
                        <div className="mt-3 font-mono text-xs break-all rounded-xl bg-background/80 p-3.5 text-foreground shadow-sm dark:bg-black/60">
                          euint64: 0x8f7a9b2c4e1d3f6a8b0c2e4d6f8a0b2c4e6d8f0a2b4c6e8d0f2a4b6c8e0d2f4a
                        </div>
                      </div>
                      
                      <p className="text-center text-xs text-muted-foreground">
                        🔒 Encrypted locally in your browser. Not even validators can read your amount.
                      </p>
                    </motion.div>
                  )}

                  {activeStep === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, scale: 0.92, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -15 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-5"
                    >
                      <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-muted-foreground">Public Order Book</span>
                          <span className="text-xs font-bold text-zama-700 dark:text-zama-400">Real-time Discovery</span>
                        </div>
                        <div className="mt-3 space-y-2.5">
                          <div>
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-emerald-600 dark:text-emerald-400">YES Odds</span>
                              <span>67%</span>
                            </div>
                            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <motion.div initial={{ width: 0 }} animate={{ width: "67%" }} transition={{ duration: 0.8 }} className="h-full bg-emerald-500" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-rose-600 dark:text-rose-400">NO Odds</span>
                              <span>33%</span>
                            </div>
                            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <motion.div initial={{ width: 0 }} animate={{ width: "33%" }} transition={{ duration: 0.8 }} className="h-full bg-rose-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase text-muted-foreground">Recent Pool Activity</div>
                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3 text-xs">
                          <span className="font-mono text-muted-foreground">[Encrypted Wallet #89A2]</span>
                          <span className="font-semibold text-foreground">Added Liquidity</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3 text-xs">
                          <span className="font-mono text-muted-foreground">[Encrypted Wallet #3F1B]</span>
                          <span className="font-semibold text-foreground">Swapped Shares</span>
                        </div>
                      </div>

                      <p className="text-center text-xs text-muted-foreground">
                        📊 Aggregate odds adjust instantly without revealing individual whale identities.
                      </p>
                    </motion.div>
                  )}

                  {activeStep === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, scale: 0.92, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -15 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-5"
                    >
                      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          <Trophy className="h-6 w-6" />
                        </div>
                        <div className="mt-3 font-display text-lg font-bold text-foreground">Market Resolved: YES</div>
                        <div className="text-xs text-muted-foreground">Settlement Vault Ready</div>
                      </div>

                      <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="text-xs font-bold uppercase text-muted-foreground">Your Private Balance</div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-display text-2xl font-extrabold text-foreground">18,450 USDC</span>
                          <span className="flex items-center gap-1 rounded-full bg-zama-400/20 px-2.5 py-1 text-xs font-bold text-zama-800 dark:bg-zama-500/20 dark:text-zama-300">
                            <Lock className="h-3 w-3" /> Encrypted
                          </span>
                        </div>
                        <div className="mt-4">
                          <button className="w-full rounded-xl bg-foreground py-2.5 text-xs font-bold text-background transition-transform hover:scale-[1.02] active:scale-[0.98]">
                            Decrypt with Wallet Key ➔
                          </button>
                        </div>
                      </div>

                      <p className="text-center text-xs text-muted-foreground">
                        🏆 Only your signature can decrypt and claim your payout. No on-chain brag sheet.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 4. COMPARISON SECTION (SCROLL-LINKED ROW ILLUMINATION)
function ComparisonSection() {
  return (
    <section className="relative border-b border-border bg-secondary/30 py-24">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Side by side
          </h2>
          <p className="mt-4 text-muted-foreground">
            The same public odds. A fundamentally different privacy model.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-border bg-secondary/60 px-5 py-4 text-sm font-bold">
            <span className="text-muted-foreground">What others can see</span>
            <span className="text-center text-muted-foreground">Polymarket · Kalshi</span>
            <span className="text-center text-zama-700 dark:text-zama-400">TruthMarket</span>
          </div>
          {COMPARISON.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -30, backgroundColor: "rgba(255, 210, 8, 0)" }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ backgroundColor: "rgba(255, 210, 8, 0.07)", transition: { duration: 0.15 } }}
              className={`grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-border/50 px-5 py-4 text-sm last:border-b-0 ${
                i % 2 ? "bg-secondary/20" : ""
              }`}
            >
              <span className="font-semibold text-foreground">{row.label}</span>
              <span className="flex justify-center">{cell(row.them)}</span>
              <span className="flex justify-center">{cell(row.us)}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 5. HOW IT WORKS SECTION (SCROLL PROGRESS LINE)
function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 75%", "end 60%"],
  });
  const scaleXProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });

  return (
    <section id="how" ref={sectionRef} className="scroll-mt-20 border-b border-border py-24">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
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

        {/* Scroll-linked progress bar container */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          {/* Connecting line behind steps (Desktop) */}
          <div className="absolute left-0 top-12 hidden h-1 w-full overflow-hidden rounded-full bg-border lg:block">
            <motion.div
              style={{ scaleX: scaleXProgress, transformOrigin: "left" }}
              className="h-full w-full bg-gradient-to-r from-amber-400 via-zama-500 to-amber-300"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 35, scale: 0.92 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ duration: 0.65, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:border-zama-400/60 hover:shadow-md dark:hover:border-zama-500/50"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-zinc-950 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <s.icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <span className="font-display text-3xl font-extrabold text-border transition-colors group-hover:text-zama-500/40 dark:group-hover:text-zama-400/40">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold tracking-tight text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-12 flex max-w-3xl items-start gap-3.5 rounded-2xl border border-zama-300/80 bg-zama-50/80 px-6 py-5 text-sm text-zama-950 shadow-sm backdrop-blur dark:border-zama-800/80 dark:bg-zama-400/10 dark:text-zama-200"
        >
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-zama-600 dark:text-zama-400" />
          <p className="leading-relaxed">
            <strong>Privacy by protocol, not by promise.</strong> Your amount and side
            are encrypted in your browser and stay encrypted inside the contract — the
            chain itself enforces it. There is no admin, log, or backdoor that can undo
            it. You can always decrypt and verify your own position with your wallet.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// 6. FEATURED MARKETS SECTION
function FeaturedSection({ featured }: { featured: MarketSummary[] }) {
  return (
    <section className="border-b border-border bg-secondary/30 py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex items-end justify-between"
        >
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 3).map((m, i) => (
            <motion.div
              key={m.address}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <MarketCard m={m} />
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Button asChild variant="gradient" className="gap-1.5">
            <Link href="/markets">
              Explore all markets <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// 7. FINAL CTA SECTION (VIEWPORT SCALE PARALLAX)
function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden py-28">
      {/* Background ambient glow specific to CTA */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[35rem] w-[35rem] rounded-full bg-gradient-to-r from-zama-400/20 via-amber-300/15 to-transparent blur-[100px] dark:from-zama-500/15 dark:via-amber-600/10" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 40 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: false, margin: "-60px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="container relative z-10 mx-auto max-w-4xl rounded-3xl border border-zama-400/30 bg-card/80 px-6 py-16 text-center shadow-xl backdrop-blur-md dark:border-zama-500/30 sm:px-12 sm:py-20"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zama-300 bg-white/80 px-4 py-1.5 text-sm font-semibold text-zama-900 shadow-sm backdrop-blur dark:border-zama-700/80 dark:bg-zinc-900/80 dark:text-zama-300">
          <Sparkles className="h-3.5 w-3.5 text-zama-600 dark:text-zama-400" />
          Sepolia testnet — free to try
        </div>

        <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Trade on what you believe.{" "}
          <span className="text-gradient">Tell no one.</span>
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Grab some test USDC, take a position, and watch the odds move — while your
          wallet stays invisible.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="xl" variant="gradient" className="w-full gap-2 shadow-md sm:w-auto">
            <Link href="/markets">
              Open the markets
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="xl" variant="outline" className="w-full bg-background/60 backdrop-blur sm:w-auto">
            <Link href="/create">Create a market</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

/* ========================================================================================
   HELPER COMPONENTS & DATA
   ======================================================================================== */

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-4 py-4 text-center">
      <div className="font-display text-2xl font-extrabold tabular-nums text-foreground sm:text-3xl">
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function TrustPill({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-zama-700 shadow-sm backdrop-blur dark:text-zama-400">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold leading-tight text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function cell(v: boolean | "yes" | "no" | string) {
  if (v === "yes") return <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />;
  if (v === "no") return <X className="h-5 w-5 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />;
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
    tint: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-400/10 dark:text-amber-300",
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
    icon: Trophy,
    title: "Watch the odds",
    body: "The market moves as volume comes in, but no one can see who is driving the action or by how much.",
  },
  {
    icon: ShieldCheck,
    title: "Settle confidentially",
    body: "When the market resolves, claim your winnings privately. Only your wallet can decrypt your balance.",
  },
];
