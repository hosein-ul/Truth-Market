"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Lock, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { Faucet } from "@/components/Faucet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useWalletPicker } from "@/components/WalletPicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/create", label: "Create" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isConnected } = useAccount();
  const walletPicker = useWalletPicker();

  // Design-preview routes are full-bleed; hide the global chrome.
  if (pathname?.startsWith("/preview")) return null;

  const isActive = (href: string) => pathname?.startsWith(href);
  // The app surface (markets/portfolio/create) carries the golden "zard-dark"
  // theme; the landing page keeps the orange/sky palette.
  const isDash =
    pathname?.startsWith("/markets") ||
    pathname?.startsWith("/portfolio") ||
    pathname?.startsWith("/create");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg",
        isDash && "theme-dash",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
          <motion.span
            whileHover={{ scale: 1.06 }}
            transition={{ type: "spring", damping: 12 }}
            className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient shadow-orange-glow"
          >
            <Lock className="h-4 w-4 text-white" strokeWidth={2.5} />
          </motion.span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            Truth<span className="text-gradient">Market</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-150",
                isActive(item.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive(item.href) && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                />
              )}
              <span className="relative">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:block">
            <Faucet />
          </div>
          <div className="hidden sm:block">
            {isConnected ? (
              <ConnectButton
                showBalance={false}
                chainStatus="icon"
                accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
              />
            ) : (
              <Button onClick={walletPicker.open} variant="gradient" size="sm">
                Connect wallet
              </Button>
            )}
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-border bg-background px-4 py-3 md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-semibold",
                    isActive(item.href)
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 sm:hidden">
              <Faucet
                trigger={
                  <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold text-foreground">
                    Get test USDC
                  </button>
                }
              />
              {isConnected ? (
                <ConnectButton showBalance={false} chainStatus="icon" />
              ) : (
                <Button onClick={() => { setOpen(false); walletPicker.open(); }} variant="gradient" className="w-full">
                  Connect wallet
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
