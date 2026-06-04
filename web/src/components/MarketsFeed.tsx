"use client";

import { useState, useMemo } from "react";
import type { MarketSummary } from "@/lib/markets";
import { MARKET_STATUS } from "@/lib/abis";
import { MarketCard } from "./MarketCard";
import Link from "next/link";

const CATEGORIES = ["All", "Crypto", "Politics", "Sports", "Science", "Other"];
const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Sealed", value: "open" },
  { label: "Resolving", value: "resolving" },
  { label: "Settled", value: "settled" },
];

export function MarketsFeed({ markets }: { markets: MarketSummary[] }) {
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return markets.filter((m) => {
      const catOk =
        category === "All" ||
        m.category.toLowerCase() === category.toLowerCase();
      const sOk =
        statusFilter === "all" ||
        (statusFilter === "open" && m.status === MARKET_STATUS.OPEN) ||
        (statusFilter === "resolving" && m.status === MARKET_STATUS.RESOLVING) ||
        (statusFilter === "settled" &&
          (m.status === MARKET_STATUS.RESOLVED ||
            m.status === MARKET_STATUS.VOIDED));
      return catOk && sOk;
    });
  }, [markets, category, statusFilter]);

  if (markets.length === 0) {
    return (
      <div className="panel p-16 text-center">
        <div className="font-mono text-[32px] text-bone-dark mb-4">◈</div>
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone-dim mb-3">
          No markets yet
        </div>
        <div className="font-mono text-[11px] text-bone-dark mb-6">
          Be the first to open a sealed prediction market.
        </div>
        <Link href="/create" className="btn-primary">
          Open a market
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Category filters */}
        <div className="flex items-center gap-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`filter-pill ${category === cat ? "active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div
          className="w-px h-4 hidden sm:block"
          style={{ background: "rgba(46,52,65,0.8)" }}
        />

        {/* Status filters */}
        <div className="flex items-center gap-0.5">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.value}
              onClick={() => setStatusFilter(sf.value)}
              className={`filter-pill ${statusFilter === sf.value ? "active" : ""}`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {/* Result count */}
        <div className="ml-auto font-mono text-[10px] text-bone-dark">
          {filtered.length} market{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="panel p-12 text-center">
          <div className="font-mono text-[11px] text-bone-dark">
            No markets match this filter. <button className="text-signal hover:underline" onClick={() => { setCategory("All"); setStatusFilter("all"); }}>Clear filters</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-wire" style={{ boxShadow: "inset 0 0 0 0.5px rgba(46,52,65,1)" }}>
          {filtered.map((m) => (
            <MarketCard key={m.address} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}
