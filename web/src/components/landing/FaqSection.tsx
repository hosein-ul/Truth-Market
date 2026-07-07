"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Shield, EyeOff, Lock, Cpu, Scale, Wallet, Sparkles } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
  icon: React.ElementType;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: "Architecture & Privacy",
    question: "Why is full on-chain transparency considered a bug in prediction markets?",
    answer:
      "In traditional DeFi markets like Polymarket or Kalshi, every bet size, wallet address, and position is broadcast to the public blockchain before execution. This creates three critical vulnerabilities: (1) MEV bots front-run large trades, causing severe slippage; (2) Copy-trading whales monitor winning wallets and steal your research alpha without doing any work; and (3) Your personal wallet address becomes linked to sensitive political, financial, or personal beliefs, exposing you to profiling by employers, competitors, or governments.",
    icon: EyeOff,
  },
  {
    category: "Zama FHEVM",
    question: "How does TruthMarket keep my bet secret while keeping market odds public?",
    answer:
      "TruthMarket is powered by Zama's Fully Homomorphic Encryption Virtual Machine (FHEVM). When you place a bet, your browser encrypts the wager amount and outcome choice (YES/NO) using the network's public cryptographic key. The smart contract on Ethereum receives this encrypted handle (euint64) and performs homomorphic addition directly on the encrypted numbers to update the total pool and odds. The public can see the overall market odds shift, but nobody—not even validators, RPC providers, or platform developers—can decrypt individual bets.",
    icon: Cpu,
  },
  {
    category: "Network Security",
    question: "Can validators, RPC nodes, or TruthMarket developers see my position?",
    answer:
      "No. End-to-end encryption ensures that cleartext values only exist inside your local browser memory before encryption, and inside your wallet when you explicitly decrypt a payout permit. Once transmitted to the network, your position is mathematically sealed. Decryption rights are governed by strict On-Chain Access Control Lists (ACLs) that only authorize your specific wallet address to view or claim your balance.",
    icon: Shield,
  },
  {
    category: "Settlement & Payouts",
    question: "How are winnings and settlements handled privately after a market resolves?",
    answer:
      "When a market closes and the oracle (such as UMA or an Optimistic Oracle) verifies the real-world outcome, the FHEVM smart contract calculates the winning distribution homomorphically. Your winning balance is stored as an encrypted handle assigned to your address. To withdraw, you sign a cryptographic permit using your wallet (MetaMask, Web3Auth, or RainbowKit), allowing the Zama Relayer to return your funds in cleartext directly to your account.",
    icon: Lock,
  },
  {
    category: "Disputes & Oracles",
    question: "What happens during dispute resolution or if an oracle outcome is challenged?",
    answer:
      "While individual trades and balances are strictly confidential, the market resolution criteria and oracle settlement process remain 100% public and transparent. This ensures decentralized consensus on the factual truth without compromising user privacy. If a resolution is disputed, the public UMA optimistic dispute mechanism activates normally, while user funds remain securely locked in encrypted escrow until the dispute is finalized.",
    icon: Scale,
  },
  {
    category: "Wallets & Gas",
    question: "Do I need a specialized wallet or proprietary gas tokens to use TruthMarket?",
    answer:
      "No! TruthMarket is designed for seamless Web3 adoption. You can use standard EVM wallets like MetaMask, RainbowKit, or social login via Web3Auth. Gas fees are paid in standard native network tokens (ETH/USDC), and all cryptographic encryption/decryption happens automatically in the background via our integrated Zama Relayer SDK.",
    icon: Wallet,
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative overflow-hidden bg-background py-28 sm:py-36">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zama-500/10 blur-3xl" />

      <div className="container relative z-10 max-w-5xl px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 shadow-sm">
            <HelpCircle className="h-4 w-4 text-zama-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Deep Dive & About
            </span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Everything you need to know about TruthMarket, Zama FHEVM, and the end of financial surveillance in prediction markets.
          </p>
        </div>

        {/* About TruthMarket Banner */}
        <div className="mt-14 rounded-3xl border border-zama-400/40 bg-gradient-to-br from-card via-zama-500/5 to-card p-8 shadow-xl dark:bg-zinc-900/90 sm:p-10">
          <div className="flex items-start gap-5">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-zama-400/40 bg-zama-500/15 text-zama-700 dark:text-zama-300">
              <Sparkles className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display text-xl font-extrabold text-foreground sm:text-2xl">
                About TruthMarket — The Mission
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                TruthMarket was built on a foundational premise: <strong>True market wisdom requires freedom from fear.</strong> When prediction markets force participants to expose their wallet identities and financial stakes to public scrutiny, people self-censor or get exploited by predatory MEV algorithms. By integrating Zama&apos;s Fully Homomorphic Encryption directly into Ethereum smart contracts, we separate public price discovery from private individual wealth.
              </p>
            </div>
          </div>
        </div>

        {/* Accordion List */}
        <div className="mt-12 space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.question}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? "border-zama-400/60 bg-card shadow-lg dark:bg-zinc-900"
                    : "border-border bg-card/60 hover:border-border/80 dark:bg-zinc-900/50"
                }`}
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors sm:p-7"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors ${
                        isOpen
                          ? "border-zama-400 bg-zama-500/20 text-zama-700 dark:text-zama-300"
                          : "border-border bg-secondary text-muted-foreground"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zama-700 dark:text-zama-400">
                        {item.category}
                      </span>
                      <h4 className="mt-0.5 font-display text-base font-extrabold text-foreground sm:text-lg">
                        {item.question}
                      </h4>
                    </div>
                  </div>

                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-transform duration-300 ${
                      isOpen ? "rotate-180 border-zama-400 bg-zama-500/20 text-zama-700 dark:text-zama-300" : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="border-t border-border/60 px-6 pb-7 pt-4 text-sm leading-relaxed text-muted-foreground sm:px-7 sm:text-base">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
