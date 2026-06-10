"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Lock } from "lucide-react";
import { ContourLines } from "@/components/art/backgrounds";

export default function EditorialPreview() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f4] text-[#1a1a17]">
      <ContourLines className="absolute inset-0 opacity-[0.5]" a={[180, 83, 9]} b={[120, 113, 108]} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,transparent,#faf8f4_85%)]" />

      {/* serif editorial nav */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-8 py-7">
        <span className="font-serif text-2xl font-bold tracking-tight">Truth<span className="italic text-amber-700">Market</span></span>
        <nav className="hidden gap-8 text-sm font-medium uppercase tracking-[0.18em] text-[#1a1a17]/60 md:flex">
          <span>Markets</span><span>Method</span><span>About</span>
        </nav>
        <button className="border-b-2 border-[#1a1a17] pb-0.5 text-sm font-semibold uppercase tracking-wider">Enter →</button>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-8">
        {/* hero */}
        <section className="border-b border-[#1a1a17]/15 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              <span className="h-px w-10 bg-amber-700" /> Confidential prediction markets
            </div>
            <h1 className="max-w-4xl font-serif text-6xl font-semibold leading-[1.02] tracking-tight sm:text-[5.5rem]">
              Conviction,
              <br />
              <span className="italic">kept private.</span>
            </h1>
            <div className="mt-10 grid gap-10 sm:grid-cols-[1.4fr_1fr] sm:items-end">
              <p className="max-w-md text-lg leading-relaxed text-[#1a1a17]/70">
                Other markets publish your every move. Here the odds are public and your
                position is encrypted on-chain — the discretion of a private bank, on a
                transparent exchange.
              </p>
              <div className="flex flex-col gap-3">
                <button className="group inline-flex items-center justify-between gap-3 bg-[#1a1a17] px-7 py-4 text-sm font-semibold uppercase tracking-wider text-[#faf8f4]">
                  Open the markets
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
                <button className="inline-flex items-center justify-between gap-3 border border-[#1a1a17]/30 px-7 py-4 text-sm font-semibold uppercase tracking-wider">
                  Read the method
                </button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* numbered editorial stats / principles */}
        <section className="grid gap-px bg-[#1a1a17]/15 py-px sm:grid-cols-3">
          {[
            { n: "01", t: "Encrypted", d: "Amount and side are sealed before they leave your device." },
            { n: "02", t: "Public odds", d: "The market price stays fully visible to everyone." },
            { n: "03", t: "Untraceable", d: "No wallet can be tied to any position, ever." },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-[#faf8f4] p-8"
            >
              <div className="font-serif text-5xl font-semibold text-amber-700/30">{s.n}</div>
              <div className="mt-4 flex items-center gap-2 text-base font-bold uppercase tracking-wider">
                <Lock className="h-4 w-4" /> {s.t}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#1a1a17]/65">{s.d}</p>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}
