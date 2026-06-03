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
    <header className="hairline-b sticky top-0 z-30 backdrop-blur bg-ink-900/85">
      <div className="mx-auto max-w-[1400px] px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="inline-block w-2 h-2 rounded-full bg-signal animate-pulse_signal" />
            <span className="font-serif text-[20px] tracking-tight leading-none">
              truth<span className="text-signal">.</span>market
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                    active ? "text-bone" : "text-bone-dim hover:text-bone"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ConnectButton
            showBalance={false}
            chainStatus={{ smallScreen: "icon", largeScreen: "icon" }}
            accountStatus={{ smallScreen: "address", largeScreen: "address" }}
          />
        </div>
      </div>
    </header>
  );
}
