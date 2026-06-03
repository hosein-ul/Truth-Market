"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const NAV = [
  { href: "/", label: "Markets" },
  { href: "/create", label: "Create" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-sm"
      style={{ boxShadow: "inset 0 -0.5px 0 0 rgba(46,52,65,1)", background: "rgba(7,8,10,0.9)" }}
    >
      <div className="mx-auto max-w-[1400px] px-5 h-12 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse_signal inline-block" />
          <span className="font-mono text-[13px] tracking-[-0.01em] text-bone">
            truth<span className="text-signal">.</span>market
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors rounded-sm ${
                  active
                    ? "text-bone bg-ink-700"
                    : "text-bone-dim hover:text-bone"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden md:flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-bone-dark">
            <span className="w-1 h-1 rounded-full bg-signal inline-block" />
            Sepolia
          </span>
          <ConnectButton
            showBalance={false}
            chainStatus="none"
            accountStatus={{ smallScreen: "address", largeScreen: "address" }}
          />
        </div>
      </div>
    </header>
  );
}
