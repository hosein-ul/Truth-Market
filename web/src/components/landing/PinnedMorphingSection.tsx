"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { ShieldCheck, Cpu, Lock, ArrowRight, Sparkles, CheckCircle2, RefreshCw, Key } from "lucide-react";

const PHASES = [
  {
    step: "Phase 01",
    title: "Client-Side Encryption",
    subtitle: "Your bet is encrypted before leaving your browser",
    description:
      "When you place an order on TruthMarket, the Zama FHE SDK encrypts your bet size and direction using the network's public key. Neither RPC nodes nor validators can see what you bet or how much.",
    badge: "E2E Cryptographic Secrecy",
    color: "from-amber-400 via-zama-500 to-amber-300",
    borderColor: "border-zama-400 dark:border-zama-500",
    glowColor: "bg-zama-400/20 dark:bg-zama-500/15",
    icon: ShieldCheck,
    iconBg: "bg-zama-400/20 text-zama-700 dark:bg-zama-500/20 dark:text-zama-300 border-zama-400/40",
    codeSnippet: `// 1. Encrypt in browser memory
const encryptedAmount = await fhevm.encrypt64(10000n);
const encryptedSide = await fhevm.encrypt8(1); // YES
// 2. Transmit ciphertext to contract
await truthMarket.placeOrder(encryptedAmount, encryptedSide);`,
    statLabel: "Data Privacy",
    statValue: "100% Sealed",
    highlights: ["Local keypair generation", "Encrypted in browser memory", "Secure ciphertext transit", "No RPC leakage"],
  },
  {
    step: "Phase 02",
    title: "Blind On-Chain Matching",
    subtitle: "Computing odds without decrypting balances",
    description:
      "Zama's Fully Homomorphic Encryption Virtual Machine (FHEVM) allows Ethereum smart contracts to add, subtract, and match encrypted orders directly on-chain. Aggregate odds update instantly while individual wallet positions remain mathematically invisible.",
    badge: "Homomorphic Computation",
    color: "from-emerald-400 via-teal-500 to-emerald-300",
    borderColor: "border-emerald-500/60 dark:border-emerald-500/50",
    glowColor: "bg-emerald-500/15 dark:bg-emerald-500/10",
    icon: Cpu,
    iconBg: "bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/40",
    codeSnippet: `// On-chain FHEVM homomorphic addition
function matchOrder(euint64 newOrder, euint64 currentPool) internal {
  // Adds encrypted numbers without decrypting!
  euint64 updatedPool = FHE.add(currentPool, newOrder);
  FHE.req(FHE.lte(newOrder, maxLimit));
}`,
    statLabel: "MEV Protection",
    statValue: "Zero Front-Running",
    highlights: ["Homomorphic matching", "Private pool updates", "Real-time discovery", "Anti-frontrunning engine"],
  },
  {
    step: "Phase 03",
    title: "Confidential Settlement",
    subtitle: "Claim payouts privately to your personal wallet",
    description:
      "When an oracle resolves the market outcome, the contract calculates your encrypted winnings. Only your private signature can decrypt your balance to withdraw funds.",
    badge: "Private Claim Vault",
    color: "from-blue-400 via-indigo-500 to-purple-400",
    borderColor: "border-blue-500/60 dark:border-blue-500/50",
    glowColor: "bg-blue-500/15 dark:bg-blue-500/10",
    icon: Lock,
    iconBg: "bg-blue-500/20 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/40",
    codeSnippet: `// Client requests private settlement permit
const permit = await fhevm.generatePermit(contractAddress);
const encryptedWinnings = await truthMarket.getWinnings(permit);
// Decrypt locally with user private key
const clearUSDC = await fhevm.decrypt(encryptedWinnings);`,
    statLabel: "On-Chain Profiling",
    statValue: "0% Exposure",
    highlights: ["Decryption permit checks", "Decentralized consensus", "Secure vault settlement", "On-chain ACL guard"],
  },
];

export function PinnedMorphingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePhase, setActivePhase] = useState(0);

  // Track scroll progress across this 320vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Map progress (0 -> 1) to active phase (0, 1, 2)
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) {
      setActivePhase(0);
    } else if (latest < 0.66) {
      setActivePhase(1);
    } else {
      setActivePhase(2);
    }
  });

  const current = PHASES[activePhase];

  return (
    <section ref={containerRef} className="relative h-[260vh] bg-secondary/30 border-b border-border">
      {/* Pinned Sticky Stage */}
      <div className="sticky top-12 sm:top-16 flex min-h-[80vh] flex-col justify-center overflow-hidden py-4 sm:py-6 px-4 sm:px-8">
        <div className="container relative z-10 max-w-6xl">
          {/* Top Section Banner */}
          <div className="mb-4 sm:mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-zama-500 animate-spin-slow" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                Cryptographic Architecture
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl text-wrap-balance">
              Inside the <span className="text-gradient">Zama FHEVM Engine</span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Watch how encrypted data travels through the protocol in real time.
            </p>
          </div>

          {/* Morphing Stage Card */}
          <div className="relative mx-auto max-w-4xl">
            {/* Background ambient morphing glow */}
            <motion.div
              key={`glow-${activePhase}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className={`pointer-events-none absolute -inset-4 rounded-3xl blur-3xl transition-colors duration-700 ${current.glowColor}`}
            />

            <motion.div
              layout
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className={`relative overflow-hidden rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur-2xl transition-colors duration-700 ${current.borderColor} dark:bg-zinc-900/95 sm:p-5 md:p-6`}
            >
              {/* Phase Progress Indicator */}
              <div className="mb-3 sm:mb-4 flex items-center justify-between border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r ${current.color}`}>
                    {current.step}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">{current.badge}</span>
                </div>

                <div className="flex items-center gap-1">
                  {PHASES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhase(idx)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        activePhase === idx
                          ? "w-6 bg-zama-500 dark:bg-zama-400"
                          : "w-1.5 bg-border hover:bg-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Morphing Grid Content */}
              <div className="grid gap-4 lg:grid-cols-12 lg:items-center lg:gap-5">
                {/* Left side: Morphing Story Text (7 cols) */}
                <div className="space-y-3 lg:col-span-7">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`text-${activePhase}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-2"
                    >
                      <h3 className="font-display text-base font-bold text-foreground sm:text-lg md:text-xl text-wrap-balance">
                        {current.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm text-wrap-pretty">
                        {current.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Key Highlights Checklist */}
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 pt-1">
                    {current.highlights.map((h, i) => (
                      <motion.div
                        key={h}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                        className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/50 p-2 text-[10px] font-semibold text-foreground dark:bg-zinc-800/50"
                      >
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-zama-500 dark:text-zama-400" />
                        <span>{h}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right side: Morphing Code / Architecture Window (5 cols) */}
                <div className="lg:col-span-5">
                  <div className="overflow-hidden rounded-xl border border-border bg-zinc-950 p-3 shadow-xl dark:border-white/10">
                    <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2 text-[10px] text-zinc-400">
                      <div className="flex items-center gap-1 font-mono">
                        <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                        <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                        <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                        <span className="ml-1 font-bold text-zinc-300">FHEVM_Runtime.sol</span>
                      </div>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] uppercase font-bold text-zama-400">
                        Live SDK
                      </span>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.pre
                        key={current.codeSnippet}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-x-auto font-mono text-[10px] leading-relaxed text-zinc-300 sm:text-[11px]"
                      >
                        <code>{current.codeSnippet}</code>
                      </motion.pre>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Bottom scroll instruction */}
              <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-border/60 pt-2.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin-slow" /> Real-time Encryption Engine
                </span>
                <span>Explore architecture ({activePhase + 1}/3)</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
