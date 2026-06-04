"use client";

import { motion } from "framer-motion";
import { Lock, Eye, Cpu, ArrowRight, Shield, Zap, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Lock,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    title: "Client-side encryption",
    desc: "Your bet amount and YES/NO choice are encrypted in the browser using Zama's relayer SDK before the transaction is signed. Nothing leaves your device in plaintext.",
    badge: "@zama-fhe/relayer-sdk",
    badgeColor: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Database,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.15)]",
    title: "On-chain FHE computation",
    desc: "The contract uses FHE.select() to route your encrypted bet to the sealed YES or NO pool — without ever decrypting your input. Math on ciphertext only.",
    badge: "@fhevm/solidity",
    badgeColor: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Eye,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    title: "Decryption oracle at settlement",
    desc: "Only after the market closes does the Zama KMS oracle decrypt the aggregate pool sizes — amounts remain private, only totals are revealed to compute payouts.",
    badge: "FHE.requestDecryption",
    badgeColor: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Shield,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.12)]",
    title: "Private payouts via ERC-7984",
    desc: "Winners receive confidential USDC (cUSDC) via ERC-7984 confidentialTransfer. Only your wallet can decrypt your balance — your winnings stay yours.",
    badge: "ERC-7984 cUSDC",
    badgeColor: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  },
];

const FLOW = [
  { label: "Deposit USDC", sublabel: "Standard ERC-20" },
  { label: "Wrap → cUSDC", sublabel: "ERC-7984 Confidential" },
  { label: "Encrypt bet", sublabel: "FHE in browser" },
  { label: "placeBet()", sublabel: "On-chain sealed" },
  { label: "Settle + claim", sublabel: "Private payout" },
];

export function ZamaExplainer() {
  return (
    <section className="border-t border-border/50 py-20">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-14 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300">
            <Cpu className="h-3.5 w-3.5" />
            Powered by Zama Protocol FHEVM
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            How <span className="text-gradient">privacy actually works</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            TruthMarket uses Fully Homomorphic Encryption to compute on encrypted data
            without ever decrypting it. Here&apos;s the technical stack powering your privacy.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -4, transition: { type: "spring", damping: 12 } }}
                className={cn(
                  "group relative rounded-2xl border p-5",
                  "glass-card cursor-default",
                  step.glow,
                )}
              >
                <div className={cn("mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border", step.bg)}>
                  <Icon className={cn("h-5 w-5", step.color)} strokeWidth={1.8} />
                </div>
                <div className="mb-2 text-[10px] font-semibold">
                  <span className={cn("rounded-md border px-1.5 py-0.5 font-mono", step.badgeColor)}>
                    {step.badge}
                  </span>
                </div>
                <h3 className="mb-1.5 font-display text-sm font-bold leading-snug text-foreground">
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Token flow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          className="mt-10 rounded-2xl border border-border/60 bg-secondary/30 p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold-500" />
            <span className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Collateral flow
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FLOW.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="rounded-xl border border-border bg-card px-3 py-2">
                  <div className="font-mono text-xs font-semibold text-foreground">{step.label}</div>
                  <div className="text-[10px] text-muted-foreground">{step.sublabel}</div>
                </div>
                {i < FLOW.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Official Zama testnet tokens ·{" "}
            <span className="font-mono text-blue-400/80">
              cUSDC: 0x7c5B…3639
            </span>{" "}
            ·{" "}
            <span className="font-mono text-blue-400/80">
              USDC: 0x9b5C…FFfF
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
