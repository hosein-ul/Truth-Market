"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Cpu, Shield } from "lucide-react";

const LINES = [
  { type: "comment",  text: "// TruthMarket × Zama FHEVM — Sepolia Testnet" },
  { type: "code",     text: 'import { FHE, euint64, ebool } from "@fhevm/solidity";' },
  { type: "blank",    text: "" },
  { type: "comment",  text: "// Your bet — encrypted before it touches the chain" },
  { type: "code",     text: "euint64 amount = FHE.asEuint64(encryptedInput);" },
  { type: "code",     text: "ebool   side   = FHE.asEbool(encryptedSide);" },
  { type: "blank",    text: "" },
  { type: "comment",  text: "// Split into sealed YES / NO pools" },
  { type: "code",     text: "euint64 yesPart = FHE.select(side, amount, zero);" },
  { type: "code",     text: "euint64 noPart  = FHE.select(side, zero, amount);" },
  { type: "blank",    text: "" },
  { type: "comment",  text: "// Seal on-chain — no one can read while market is open" },
  { type: "code",     text: "FHE.allowThis(yesPart);   // contract-only access" },
  { type: "code",     text: "FHE.allowThis(noPart);    // encrypted at rest" },
  { type: "blank",    text: "" },
  { type: "comment",  text: "// ✓ Amount hidden  ✓ Side hidden  ✓ Payout sealed" },
];

const COLORS: Record<string, string> = {
  comment: "text-blue-400/60",
  code:    "text-cyan-300",
  blank:   "",
};

type Line = { full: string; shown: string; done: boolean };

export function HeroTerminal() {
  const [lines, setLines] = useState<Line[]>([]);
  const [activeLine, setActiveLine] = useState(0);
  const [activeChar, setActiveChar] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const src = LINES[activeLine];
    if (!src) return;

    if (activeLine >= lines.length) {
      setLines((prev) => [
        ...prev,
        { full: src.text, shown: "", done: false },
      ]);
      return;
    }

    if (src.text === "") {
      // blank line — advance immediately
      setLines((prev) =>
        prev.map((l, i) =>
          i === activeLine ? { ...l, shown: "", done: true } : l
        )
      );
      const t = setTimeout(() => {
        setActiveLine((n) => n + 1);
        setActiveChar(0);
      }, 120);
      return () => clearTimeout(t);
    }

    if (activeChar < src.text.length) {
      const delay = src.type === "comment" ? 14 : 22;
      const t = setTimeout(() => {
        setLines((prev) =>
          prev.map((l, i) =>
            i === activeLine
              ? { ...l, shown: src.text.slice(0, activeChar + 1) }
              : l
          )
        );
        setActiveChar((n) => n + 1);
      }, delay);
      return () => clearTimeout(t);
    } else {
      // line done
      setLines((prev) =>
        prev.map((l, i) =>
          i === activeLine ? { ...l, done: true } : l
        )
      );
      const t = setTimeout(() => {
        if (activeLine < LINES.length - 1) {
          setActiveLine((n) => n + 1);
          setActiveChar(0);
        }
      }, 180);
      return () => clearTimeout(t);
    }
  }, [activeLine, activeChar, lines.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [lines.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-navy-900/80 shadow-blue-glow backdrop-blur-sm"
      style={{ background: "rgba(8,12,22,0.92)" }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 font-mono text-[11px] text-slate-500">
          ConfidentialMarket.sol — Zama FHEVM
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-cyan-400" />
          <span className="font-mono text-[10px] text-cyan-400/80">FHE Active</span>
        </div>
      </div>

      {/* Code lines */}
      <div className="relative h-[260px] overflow-hidden px-4 py-3 font-mono text-[12px] leading-relaxed">
        {/* Scan line */}
        <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-scanline opacity-40" />

        <AnimatePresence>
          {lines.map((line, i) => {
            const src = LINES[i];
            const color = COLORS[src?.type ?? "code"];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`whitespace-pre ${color}`}
              >
                {line.shown}
                {!line.done && i === activeLine && (
                  <span className="inline-block h-[1em] w-[6px] translate-y-[2px] bg-cyan-400 animate-blink-cursor" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 border-t border-white/5 px-4 py-2 font-mono text-[10px] text-slate-600">
        <span className="flex items-center gap-1">
          <Cpu className="h-2.5 w-2.5 text-blue-500" />
          Solidity 0.8.27
        </span>
        <span className="flex items-center gap-1">
          <Lock className="h-2.5 w-2.5 text-cyan-500" />
          @fhevm/solidity 0.11.1
        </span>
        <span className="ml-auto text-slate-700">Sepolia Testnet</span>
      </div>
    </motion.div>
  );
}
