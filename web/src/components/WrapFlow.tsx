"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, Loader2, Coins, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// The on-chain truth this visualizes:
//   placeBet() pulls your plain USDC → wrap()s it into Zama's confidential
//   cUSDC (ERC-7984) → records an ENCRYPTED per-wallet stake. The "wrap" step
//   is a real on-chain conversion, not a cosmetic flourish — this component
//   just makes that conversion legible to the user as it happens.

export type WrapStage =
  | "idle"
  | "mint"
  | "approve"
  | "wrap"
  | "seal"
  | "done"
  | "error";

const PROGRESS: Record<WrapStage, number> = {
  idle: 0,
  mint: 0.12,
  approve: 0.34,
  wrap: 0.62,
  seal: 0.86,
  done: 1,
  error: 0,
};

const CAPTION: Record<WrapStage, string> = {
  idle: "Ready to convert",
  mint: "Funding your wallet with test USDC…",
  approve: "Approving USDC for the market…",
  wrap: "Converting USDC → confidential cUSDC…",
  seal: "Sealing your encrypted position…",
  done: "Done — your position is private.",
  error: "Something went wrong.",
};

export function WrapFlow({
  stage,
  amount,
}: {
  stage: WrapStage;
  amount?: string;
}) {
  const progress = PROGRESS[stage];
  const converting = stage === "wrap" || stage === "seal";
  const finished = stage === "done";

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-b from-white to-secondary/30 p-5 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-display text-sm font-bold tracking-tight">
          Confidential conversion
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700">
          <Lock className="h-3 w-3" strokeWidth={2.5} />
          ERC-7984
        </span>
      </div>

      {/* Pipeline: USDC → encryption core → cUSDC */}
      <div className="relative mx-auto flex max-w-sm items-center justify-between">
        {/* track */}
        <div className="absolute left-7 right-7 top-7 h-0.5 -translate-y-1/2 rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-zinc-400 to-sky-400"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", damping: 22, stiffness: 120 }}
          />
        </div>

        {/* traveling token */}
        <motion.div
          className="absolute top-7 z-10 -translate-y-1/2"
          initial={false}
          animate={{ left: `calc(${progress * 100}% )` }}
          transition={{ type: "spring", damping: 22, stiffness: 120 }}
          style={{ marginLeft: "-12px" }}
        >
          <motion.div
            className={cn(
              "grid h-6 w-6 place-items-center rounded-full text-white shadow-lg",
              converting ? "bg-sky-500" : finished ? "bg-emerald-500" : "bg-zinc-500",
            )}
            animate={converting ? { rotate: 360, scale: [1, 1.15, 1] } : { rotate: 0, scale: 1 }}
            transition={converting ? { duration: 1.1, repeat: Infinity, ease: "linear" } : {}}
          >
            {finished ? (
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            ) : converting ? (
              <Lock className="h-3 w-3" strokeWidth={3} />
            ) : (
              <span className="text-[10px] font-black">$</span>
            )}
          </motion.div>
        </motion.div>

        <Node
          label="USDC"
          sublabel="public"
          icon={<Coins className="h-5 w-5" />}
          active={progress > 0}
          tone="neutral"
        />
        <Node
          label="Encrypt"
          sublabel="FHE wrap"
          icon={<Lock className="h-5 w-5" />}
          active={progress >= PROGRESS.wrap}
          pulse={converting}
          tone="sky"
        />
        <Node
          label="cUSDC"
          sublabel="sealed"
          icon={<ShieldCheck className="h-5 w-5" />}
          active={progress >= 1}
          tone="emerald"
        />
      </div>

      {/* caption */}
      <div className="mt-6 flex items-center justify-center gap-2 text-center">
        {stage !== "done" && stage !== "idle" && stage !== "error" && (
          <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
        )}
        {stage === "done" && <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />}
        <AnimatePresence mode="wait">
          <motion.span
            key={stage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "text-sm font-semibold",
              stage === "done" ? "text-emerald-700" : "text-foreground",
            )}
          >
            {CAPTION[stage]}
          </motion.span>
        </AnimatePresence>
      </div>

      {amount && (
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          {amount} USDC → {amount} cUSDC (encrypted, only you can decrypt it)
        </p>
      )}
    </div>
  );
}

function Node({
  label,
  sublabel,
  icon,
  active,
  pulse,
  tone,
}: {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  active: boolean;
  pulse?: boolean;
  tone: "neutral" | "sky" | "emerald";
}) {
  const tones = {
    neutral: "border-border bg-secondary text-foreground",
    sky: "border-sky-200 bg-sky-50 text-sky-600",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
  } as const;

  return (
    <div className="relative z-0 flex w-16 flex-col items-center gap-1.5 bg-transparent">
      <motion.div
        className={cn(
          "grid h-14 w-14 place-items-center rounded-2xl border bg-white transition-colors",
          active ? tones[tone] : "border-border bg-secondary/40 text-muted-foreground/50",
        )}
        animate={pulse ? { boxShadow: ["0 0 0 0 rgba(14,165,233,0)", "0 0 0 8px rgba(14,165,233,0.12)", "0 0 0 0 rgba(14,165,233,0)"] } : {}}
        transition={pulse ? { duration: 1.4, repeat: Infinity } : {}}
      >
        {icon}
      </motion.div>
      <div className="text-center leading-tight">
        <div className={cn("text-xs font-bold", active ? "text-foreground" : "text-muted-foreground/60")}>
          {label}
        </div>
        <div className="text-[10px] text-muted-foreground">{sublabel}</div>
      </div>
    </div>
  );
}
