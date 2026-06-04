"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import type { MarketSummary } from "@/lib/markets";
import { MARKET_STATUS } from "@/lib/abis";
import { MarketCard } from "./MarketCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type SortKey = "newest" | "ending" | "traders";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "ending", label: "Ending soon" },
  { key: "traders", label: "Most traders" },
];

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "open", label: "Live" },
  { key: "settled", label: "Settled" },
];

export function MarketsExplorer({ markets }: { markets: MarketSummary[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [statusTab, setStatusTab] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    let list = markets.filter((m) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        m.question.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);
      const matchesCat = category === "All" || m.category.toLowerCase() === category.toLowerCase();
      const matchesStatus =
        statusTab === "all" ||
        (statusTab === "open" && m.status === MARKET_STATUS.OPEN) ||
        (statusTab === "settled" &&
          (m.status === MARKET_STATUS.RESOLVED || m.status === MARKET_STATUS.VOIDED));
      return matchesQuery && matchesCat && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      if (sort === "ending") return a.deadline - b.deadline;
      if (sort === "traders") return b.traderCount - a.traderCount;
      return b.deadline - a.deadline; // newest ~ latest deadline as proxy
    });
    return list;
  }, [markets, query, category, statusTab, sort]);

  const sortLabel = SORTS.find((s) => s.key === sort)?.label ?? "Newest";

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search markets…"
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 sm:w-auto">
                <SlidersHorizontal className="h-4 w-4" />
                {sortLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              {SORTS.map((s) => (
                <DropdownMenuItem key={s.key} onClick={() => setSort(s.key)}>
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status tabs + categories */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-secondary p-1">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusTab(t.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                  statusTab === t.key
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="hidden h-6 w-px bg-border sm:block" />

          <div className="flex flex-wrap items-center gap-1.5">
            {["All", ...CATEGORY_OPTIONS].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  category === c
                    ? "border-primary/30 bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-16 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-bold">No markets found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different filter, or open a brand-new market.
            </p>
            <Button asChild variant="gradient" className="mt-4">
              <Link href="/create">Create a market</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((m) => (
              <MarketCard key={m.address} m={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
