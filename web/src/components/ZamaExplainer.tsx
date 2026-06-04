"use client";

import { motion } from "framer-motion";
import { Lock, KeyRound, Eye, Shield, Cpu, ArrowRight, Zap, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Lock,
    color: "text-sky-600",
    bg: "bg-sky-50 border-sky-200",
    title: "Encrypted bet inputs",
    desc: "Amount and side are encrypted in your browser with the Zama Relayer SDK before submission. The contract operates on the ciphertext — calldata reveals nothing.",
    badge: "externalEuint64 + externalEbool",
    badgeColor: "text-sky-700 bg-sky-50 border-sky-200",
  },
  {
    icon: EyeOff,
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-200",
    title: "Encrypted pools & stakes",
    desc: "Pools and per-wallet stakes live as euint64 ciphertexts. No plaintext pool deltas appear on-chain. BetPlaced events carry no fields — no amount, no side, no address.",
    badge: "euint64 yesPoolEnc / userYesStake",
    badgeColor: "text-violet-700 bg-violet-50 border-violet-200",
  },
  {
    icon: KeyRound,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    title: "K-anonymous public odds",
    desc: "Odds are released as a snapshot only after K=3 new bets. A snapshot diff covers ≥3 bets at once, so no observer can tie revealed volume to a single wallet.",
    badge: "FHE.makePubliclyDecryptable",
    badgeColor: "text-orange-700 bg-orange-50 border-orange-200",
  },
  {
    icon: Shield,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    title: "Confidential payouts",
    desc: "Winnings settle in cUSDC via ERC-7984 confidentialTransfer. The payout amount is encrypted on-chain; only your wallet can decrypt the credited balance.",
    badge: "confidentialTransfer",
    badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
];

const FLOW = [
  { label: "Top up", sublabel: "USDC → cUSDC (once)" },
  { label: "Encrypt", sublabel: "amount + side, in-browser" },
  { label: "placeBet()", sublabel: "ciphertext + proof" },
  { label: "K-anon snapshot", sublabel: "after K bets" },
  { label: "Confidential payout", sublabel: "encrypted transfer" },
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
            Public market. <span className="text-gradient">Private positions.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A prediction market needs public odds for price discovery. We keep that —
            but release the odds as K-anonymous snapshots over the encrypted pools,
            so no individual wallet can ever be reconstructed from chain data.
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
              Full lifecycle
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
