"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ArrowRight, ShieldCheck, BarChart3, EyeOff, Cpu } from "lucide-react";
import { ParticleNetwork } from "@/components/art/backgrounds";

export default function AuroraPreview() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      {/* aurora gradient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[40rem] w-[40rem] rounded-full bg-orange-300/40 blur-[120px]" />
        <div className="absolute -right-40 top-20 h-[36rem] w-[36rem] rounded-full bg-sky-300/40 blur-[120px]" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-rose-200/40 blur-[120px]" />
      </div>
      <ParticleNetwork className="absolute inset-0 opacity-70" />

      {/* glass nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
            <Lock className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">TruthMarket</span>
        </div>
        <nav className="hidden items-center gap-1 rounded-full border border-white/60 bg-white/50 px-2 py-1.5 backdrop-blur-xl md:flex">
          {["Markets", "How it works", "Docs"].map((x) => (
            <span key={x} className="rounded-full px-4 py-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">{x}</span>
          ))}
        </nav>
        <button className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg">Launch app</button>
      </header>

      {/* hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        >
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-1.5 text-sm font-semibold text-orange-700 backdrop-blur-xl">
            <Cpu className="h-3.5 w-3.5" /> Confidential by protocol · Zama FHEVM
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.03] tracking-tight sm:text-7xl">
            Bet on the truth.
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-sky-500 bg-clip-text text-transparent">
              Without showing your hand.
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-slate-600">
            Public odds. Private positions. The crowd sees the price — never your wallet,
            your size, or your side.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/30 sm:w-auto">
              Open the markets <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button className="w-full rounded-2xl border border-white/70 bg-white/60 px-8 py-4 text-base font-bold text-slate-800 backdrop-blur-xl sm:w-auto">
              See how it works
            </button>
          </div>
        </motion.div>

        {/* glass feature cards */}
        <div className="mx-auto mt-20 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { icon: Lock, t: "Encrypted bets", d: "Amount + side sealed end-to-end.", c: "text-sky-600" },
            { icon: BarChart3, t: "Public odds", d: "Real price discovery, no names.", c: "text-orange-600" },
            { icon: EyeOff, t: "Untrackable", d: "No whales to copy or front-run.", c: "text-rose-600" },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="rounded-3xl border border-white/70 bg-white/55 p-6 text-left shadow-xl shadow-slate-900/5 backdrop-blur-2xl"
            >
              <f.icon className={`mb-3 h-6 w-6 ${f.c}`} strokeWidth={1.9} />
              <div className="text-base font-bold">{f.t}</div>
              <div className="mt-1 text-sm text-slate-600">{f.d}</div>
            </motion.div>
          ))}
        </div>

        <div className="mx-auto mt-12 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-500 backdrop-blur-xl">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Privacy enforced on-chain — not by policy
        </div>
      </main>
    </div>
  );
}
