"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Sparkles, Hourglass, BadgePlus } from "lucide-react";
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
  // Seed the search box from ?q= (the navbar search routes here).
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get("q") ?? "");
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
      if (sort === "traders") return b.betCount - a.betCount;
      return b.deadline - a.deadline; // newest ~ latest deadline as proxy
    });
    return list;
  }, [markets, query, category, statusTab, sort]);

  const sortLabel = SORTS.find((s) => s.key === sort)?.label ?? "Newest";

  // Discovery rails — only on the unfiltered view, Polymarket-style.
  const nowSec = Math.floor(Date.now() / 1000);
  const railsVisible = !query.trim() && category === "All" && statusTab === "all";
  const endingSoon = useMemo(
    () =>
      markets
        .filter((m) => m.status === MARKET_STATUS.OPEN && m.deadline > nowSec)
        .sort((a, b) => a.deadline - b.deadline)
        .slice(0, 8),
    [markets, nowSec],
  );
  const newest = useMemo(
    () =>
      markets
        .filter((m) => m.status === MARKET_STATUS.OPEN)
        .sort((a, b) => b.deadline - a.deadline)
        .slice(0, 8),
    [markets],
  );

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

      {/* Discovery rails */}
      {railsVisible && endingSoon.length > 0 && (
        <Rail
          title="Ending soon"
          icon={<Hourglass className="h-4 w-4 text-zama-700 dark:text-zama-400" />}
          markets={endingSoon}
        />
      )}
      {railsVisible && newest.length > 0 && (
        <Rail
          title="New markets"
          icon={<BadgePlus className="h-4 w-4 text-zama-700 dark:text-zama-400" />}
          markets={newest}
        />
      )}

      {/* Results */}
      <div className="mt-6">
        {railsVisible && (
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">All markets</h2>
        )}
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

/** Horizontal scroll rail of market cards (discovery shelf). */
function Rail({
  title,
  icon,
  markets,
}: {
  title: string;
  icon: React.ReactNode;
  markets: MarketSummary[];
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold tracking-tight">
        {icon}
        {title}
      </h2>
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
        {markets.map((m) => (
          <div key={m.address} className="w-72 flex-shrink-0 snap-start">
            <MarketCard m={m} />
          </div>
        ))}
      </div>
    </section>
  );
}
