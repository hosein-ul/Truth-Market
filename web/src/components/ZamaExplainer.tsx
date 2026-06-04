"use client";

import { motion } from "framer-motion";
import { Lock, Database, Eye, Shield, Cpu, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Database,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    title: "Public odds, on-chain",
    desc: "Pool totals are stored as plaintext. The implied probability is always visible, so price discovery works exactly like a normal prediction market.",
    badge: "uint256 yesPool / noPool",
    badgeColor: "text-orange-700 bg-orange-50 border-orange-200",
  },
  {
    icon: Lock,
    color: "text-sky-600",
    bg: "bg-sky-50 border-sky-200",
    title: "Private per-user stakes",
    desc: "Your cumulative position is accumulated as an encrypted euint64 via FHE.add. No one can read how much any wallet has staked, or on which side.",
    badge: "euint64 userYesStake",
    badgeColor: "text-sky-700 bg-sky-50 border-sky-200",
  },
  {
    icon: Eye,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    title: "No wallet tracking",
    desc: "The BetPlaced event carries amount + side but no address. Tools like 'Polymarket Whales' simply have nothing to index — herding is impossible.",
    badge: "anonymous events",
    badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  {
    icon: Shield,
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-200",
    title: "Confidential payouts",
    desc: "Winnings settle in cUSDC via ERC-7984 confidentialTransfer. Your payout is encrypted — only your wallet can decrypt the balance you earned.",
    badge: "ERC-7984 cUSDC",
    badgeColor: "text-violet-700 bg-violet-50 border-violet-200",
  },
];

const FLOW = [
  { label: "Approve USDC", sublabel: "Standard ERC-20" },
  { label: "placeBet()", sublabel: "Amount + side public" },
  { label: "Wrap → cUSDC", sublabel: "Encrypted collateral" },
  { label: "Encrypted stake", sublabel: "euint64 per wallet" },
  { label: "Claim payout", sublabel: "Confidential transfer" },
];

export function ZamaExplainer() {
  return (
    <section className="border-t border-border bg-secondary/20 py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-14 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-semibold text-orange-700">
            <Cpu className="h-3.5 w-3.5" />
            Powered by Zama Protocol FHEVM
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Public odds. <span className="text-gradient">Private positions.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A real prediction market needs visible odds for price discovery — but
            visible <em>wallets</em> are what enable herding and whale-tracking.
            Fully Homomorphic Encryption lets us keep one and kill the other.
          </p>
        </motion.div>

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
                className="group relative cursor-default rounded-2xl border border-border bg-card p-5 shadow-soft"
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Collateral flow
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FLOW.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
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
            <span className="font-mono text-orange-600">cUSDC: 0x7c5B…3639</span> ·{" "}
            <span className="font-mono text-orange-600">USDC: 0x9b5C…FFfF</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
