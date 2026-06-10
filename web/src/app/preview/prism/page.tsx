"use client";

import { motion } from "framer-motion";
import { Lock, ArrowRight, BarChart3, EyeOff, Trophy } from "lucide-react";
import { GeometricMesh } from "@/components/art/backgrounds";

export default function PrismPreview() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <GeometricMesh className="absolute inset-0 opacity-80" a={[249, 115, 22]} b={[14, 165, 233]} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(255,255,255,0.75),transparent)]" />

      {/* nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900">
            <Lock className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">TruthMarket</span>
        </div>
        <button className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">Launch app</button>
      </header>

      {/* hero — asymmetric, bold */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Confidential · Zama FHEVM
            </div>
            <h1 className="text-6xl font-black leading-[0.98] tracking-tight sm:text-8xl">
              BET
              <br />
              <span className="text-orange-500">PRIVATE.</span>
              <br />
              WIN PUBLIC.
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-slate-600">
              The first prediction market where the odds are public but your position is
              encrypted on-chain. No whale-watching. No copy-trading. No front-running.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button className="group inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/30">
                Open the markets <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button className="rounded-xl border-2 border-slate-900 px-8 py-4 text-base font-bold text-slate-900">
                How it works
              </button>
            </div>
          </motion.div>

          {/* stacked bold cards */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="space-y-3">
            {[
              { icon: Lock, t: "Encrypted bets", d: "Amount + side sealed end-to-end.", bg: "bg-sky-500" },
              { icon: BarChart3, t: "Public odds", d: "Real price discovery, zero names.", bg: "bg-orange-500" },
              { icon: EyeOff, t: "Untrackable", d: "Nobody can copy or front-run you.", bg: "bg-slate-900" },
              { icon: Trophy, t: "Private payouts", d: "Only you can decrypt your winnings.", bg: "bg-emerald-500" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${f.bg} text-white`}>
                  <f.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-sm font-bold">{f.t}</div>
                  <div className="text-xs text-slate-500">{f.d}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
