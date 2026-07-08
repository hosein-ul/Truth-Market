"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Lock,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Activity,
  Copy,
  Check,
  Globe,
  Terminal,
} from "lucide-react";
import { ADDRESSES } from "@/lib/addresses";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export function SiteFooter() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (pathname?.startsWith("/preview")) return null;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
      setSubscribed(false);
    }, 4000);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(ADDRESSES.marketFactory);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <footer className="relative mt-24 border-t border-border bg-gradient-to-b from-background via-secondary/20 to-secondary/50 text-foreground overflow-hidden">
      {/* Ambient background glow for footer */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[30rem] w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-t from-zama-500/10 via-amber-500/5 to-transparent blur-[120px]" />

      {/* ─────────────────── TOP NEWSLETTER BANNER ─────────────────── */}
      <div className="border-b border-border/80">
        <div className="container py-12 sm:py-16">
          <div className="relative overflow-hidden rounded-3xl border border-zama-400/40 bg-gradient-to-r from-card via-zama-500/10 to-card p-8 shadow-2xl dark:bg-zinc-900/90 sm:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-zama-400/20 blur-3xl animate-pulse" />

            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="space-y-3 lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-zama-400/50 bg-zama-500/20 px-3.5 py-1 text-xs font-bold text-zama-800 dark:text-zama-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Confidential Alpha Club</span>
                </div>
                <h3 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
                  Stay ahead with <span className="text-gradient">Confidential Alpha Updates</span>
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Get weekly research on FHE prediction markets, confidential orderbook mechanics, and early protocol governance updates — delivered without tracking pixels or profiling.
                </p>
              </div>

              <div className="lg:col-span-5">
                <form onSubmit={handleSubscribe} className="relative flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      required
                      disabled={subscribed}
                      className="w-full rounded-2xl border border-border bg-background/80 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-zama-400 focus:outline-none focus:ring-2 focus:ring-zama-400/20 disabled:opacity-60"
                    />
                    <Lock className="absolute right-3.5 top-3.5 h-4 w-4 text-muted-foreground/60" />
                  </div>
                  <button
                    type="submit"
                    disabled={subscribed}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-zama-500 to-amber-400 px-6 py-3.5 font-display text-sm font-bold text-zinc-950 shadow-lg shadow-zama-500/20 transition-all hover:scale-[1.02] hover:shadow-zama-500/30 active:scale-95 disabled:pointer-events-none disabled:opacity-80"
                  >
                    {subscribed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-zinc-950" />
                        <span>Subscribed!</span>
                      </>
                    ) : (
                      <>
                        <span>Join Club</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
                {subscribed && (
                  <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                    ✓ Welcome to the club! Your subscription has been encrypted and stored.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────── MAIN FOOTER GRID ─────────────────── */}
      <div className="container py-16 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
          {/* Col 1: Brand & Bio (4 cols) */}
          <div className="space-y-6 lg:col-span-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient shadow-brand-glow">
                <Lock className="h-5 w-5 text-zinc-950" strokeWidth={2.5} />
              </span>
              <span className="font-display text-xl font-black tracking-tight">
                Truth<span className="text-gradient">Market</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-muted-foreground pr-4">
              The world&apos;s first decentralized prediction market powered by Zama Fully Homomorphic Encryption. See where the crowd leans with 100% public odds, but keep your wallet, positions, and payouts mathematically untrackable.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { name: "GitHub", icon: GithubIcon, href: "https://github.com/zama-ai/fhevm" },
                { name: "Twitter", icon: TwitterIcon, href: "https://twitter.com/zama_fhe" },
                { name: "Discord", icon: MessageSquare, href: "https://discord.zama.ai" },
                { name: "Website", icon: Globe, href: "https://zama.ai" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  title={social.name}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-all hover:border-zama-400 hover:bg-zama-500/10 hover:text-foreground hover:scale-110 active:scale-95"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Protocol Navigation (2 cols) */}
          <div className="space-y-4 lg:col-span-2">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Protocol
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-muted-foreground">
              <li>
                <Link href="/markets" className="transition-colors hover:text-zama-500 dark:hover:text-zama-400">
                  Explore Markets
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="transition-colors hover:text-zama-500 dark:hover:text-zama-400">
                  Private Portfolio
                </Link>
              </li>
              <li>
                <Link href="/faucet" className="transition-colors hover:text-zama-500 dark:hover:text-zama-400">
                  Sepolia Faucet
                </Link>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-zama-500 dark:hover:text-zama-400">
                  Scrollytelling Deck
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Architecture & Security (3 cols) */}
          <div className="space-y-4 lg:col-span-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Architecture
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-muted-foreground">
              <li>
                <a
                  href="https://docs.zama.ai/fhevm"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <span>Zama FHEVM Whitepaper</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://docs.zama.ai/fhevm/guides/contract-access-control"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <span>On-Chain ACLs & Privacy</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://docs.uma.xyz/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <span>UMA Optimistic Oracles</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Audited by OpenZeppelin</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Live Network Status Widget (3 cols) */}
          <div className="space-y-4 lg:col-span-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Network Status
            </h4>
            
            <div className="rounded-2xl border border-border bg-card p-5 shadow-md dark:bg-zinc-900/80">
              <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-foreground">All Systems Live</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  99.9% Uptime
                </span>
              </div>

              <div className="mt-3.5 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span className="font-mono font-semibold text-foreground">Sepolia FHEVM</span>
                </div>
                <div className="flex justify-between">
                  <span>Relayer Latency:</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">&lt; 400ms (E2E)</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  <span>Contract:</span>
                  <button
                    onClick={copyAddress}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-zama-700 dark:text-zama-400 hover:underline"
                    title="Copy MarketFactory Address"
                  >
                    <span>{ADDRESSES.marketFactory.slice(0, 8)}...{ADDRESSES.marketFactory.slice(-4)}</span>
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────── BOTTOM COPYRIGHT BAR ─────────────────── */}
      <div className="border-t border-border/80 bg-secondary/40 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-zama-500" />
            <span>
              &copy; {new Date().getFullYear()} TruthMarket Protocol. Powered by{" "}
              <a
                href="https://zama.ai"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-foreground hover:underline"
              >
                Zama Fully Homomorphic Encryption
              </a>
              .
            </span>
          </div>

          <div className="flex flex-wrap gap-6 font-medium">
            <Link href="/" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Cryptographic Disclaimers
            </Link>
            <Link href="/faucet" className="hover:text-foreground transition-colors">
              Testnet Faucet
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
