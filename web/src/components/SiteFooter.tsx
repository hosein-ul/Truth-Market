"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, ShieldCheck, ExternalLink } from "lucide-react";
import { ADDRESSES } from "@/lib/addresses";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/preview")) return null;
  return (
    <footer className="mt-16 border-t border-border bg-secondary/30">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient shadow-brand-glow">
              <Lock className="h-3.5 w-3.5 text-zinc-950" strokeWidth={2.5} />
            </span>
            <span className="font-display text-base font-extrabold tracking-tight">
              Truth<span className="text-gradient">Market</span>
            </span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A prediction market with public odds and private positions. See where
            the crowd leans, but keep your own wallet untrackable — herding and
            whale-watching are impossible by construction.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-orange-700">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-semibold">Secured by Zama FHEVM</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Sepolia testnet</span>
            <a
              href={`https://sepolia.etherscan.io/address/${ADDRESSES.marketFactory}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium hover:text-foreground"
            >
              MarketFactory <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
