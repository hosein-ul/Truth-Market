"use client";

import { motion } from "framer-motion";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { OrbitalRings } from "@/components/art/backgrounds";

export default function VaultPreview() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fffdf9] text-slate-900">
      <OrbitalRings className="absolute inset-0 opacity-[0.55]" a={[234, 88, 12]} b={[2, 132, 199]} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#fffdf9_72%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-slate-900">
            <Lock className="h-4 w-4 text-slate-900" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">TruthMarket</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
          <span className="hover:text-slate-900">Markets</span><span className="hover:text-slate-900">Protocol</span><span className="hover:text-slate-900">Docs</span>
        </nav>
        <button className="rounded-full border-2 border-slate-900 px-5 py-2 text-sm font-bold">Launch app</button>
      </header>

      <main className="relative z-10 mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-slate-600 backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Confidential prediction market
          </div>
          <h1 className="text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-7xl">
            Your conviction,
            <br />
            <span className="bg-gradient-to-r from-orange-600 to-sky-600 bg-clip-text text-transparent">in a sealed vault.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-lg text-lg leading-relaxed text-slate-600">
            Public odds keep the market honest. Encryption keeps your position yours.
            Nobody — not a whale-tracker, not the house — can see what you hold.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-xl sm:w-auto">
              Open the markets <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button className="w-full rounded-full border-2 border-slate-300 bg-white/70 px-8 py-4 text-base font-bold text-slate-800 backdrop-blur sm:w-auto">
              See how it works
            </button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-center">
            {[["$2.4M", "Volume"], ["18k", "Encrypted bets"], ["100%", "Private"]].map(([v, l]) => (
              <div key={l}>
                <div className="text-2xl font-extrabold tabular-nums">{v}</div>
                <div className="text-xs font-medium text-slate-500">{l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
