"use client";

import { motion } from "framer-motion";
import { Lock, ArrowRight, ShieldCheck, BarChart3, EyeOff, Sparkles } from "lucide-react";
import { ParticleNetwork } from "@/components/art/backgrounds";

export default function MidnightPreview() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080810] text-white">
      {/* glow field */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10rem] h-[40rem] w-[44rem] -translate-x-1/2 rounded-full bg-amber-500/20 blur-[140px]" />
        <div className="absolute right-[-10rem] bottom-[-6rem] h-[30rem] w-[30rem] rounded-full bg-sky-500/15 blur-[130px]" />
      </div>
      <ParticleNetwork className="absolute inset-0 opacity-90" a={[245, 200, 100]} b={[56, 189, 248]} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent,#080810_85%)]" />

      {/* nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/40">
            <Lock className="h-4 w-4 text-[#080810]" strokeWidth={2.6} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">TruthMarket</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/55 md:flex">
          <span className="hover:text-white">Markets</span><span className="hover:text-white">How it works</span><span className="hover:text-white">Docs</span>
        </nav>
        <button className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-bold text-[#080810] shadow-lg shadow-amber-500/30">Launch app</button>
      </header>

      {/* hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-semibold text-amber-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Powered by Zama FHEVM
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.03] tracking-tight sm:text-7xl">
            Bet on the truth.
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-sky-300 bg-clip-text text-transparent">
              Leave no trace.
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/60">
            A confidential prediction market. Public odds for the crowd, encrypted
            positions for you — no whale-watching, no copy-trading, no front-running.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4 text-base font-bold text-[#080810] shadow-xl shadow-amber-500/30 sm:w-auto">
              Open the markets <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button className="w-full rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur sm:w-auto">
              See how it works
            </button>
          </div>
        </motion.div>

        <div className="mx-auto mt-20 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { icon: Lock, t: "Encrypted bets", d: "Amount + side sealed end-to-end.", c: "text-sky-300" },
            { icon: BarChart3, t: "Public odds", d: "Real price discovery, no names.", c: "text-amber-300" },
            { icon: EyeOff, t: "Untrackable", d: "No whales to copy or front-run.", c: "text-rose-300" },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left shadow-2xl backdrop-blur-xl"
            >
              <f.icon className={`mb-3 h-6 w-6 ${f.c}`} strokeWidth={1.9} />
              <div className="text-base font-bold">{f.t}</div>
              <div className="mt-1 text-sm text-white/55">{f.d}</div>
            </motion.div>
          ))}
        </div>

        <div className="mx-auto mt-12 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/50 backdrop-blur">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Privacy enforced on-chain — not by policy
        </div>
      </main>
    </div>
  );
}
