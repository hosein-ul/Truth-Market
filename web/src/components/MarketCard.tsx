"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, TrendingUp, ShieldCheck } from "lucide-react";
import type { MarketSummary } from "@/lib/markets";
import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { ADDRESSES } from "@/lib/addresses";
import { CategoryChip } from "./CategoryChip";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { Countdown } from "./Countdown";
import { ProbabilityBar } from "./ProbabilityBar";
import { GlareCard } from "./GlareCard";
import { formatUSDC } from "@/lib/format";
import { displayStats } from "@/lib/demo";
import { getMarketMeta, CATEGORY_GRADIENTS } from "@/lib/market-metadata";

export function MarketCard({ m }: { m: MarketSummary }) {
  const status = m.status as MarketStatusValue;
  const isOpen = status === MARKET_STATUS.OPEN;
  const isResolved = status === MARKET_STATUS.RESOLVED;
  const isVoided = status === MARKET_STATUS.VOIDED;
  const isUmaResolved = m.oracle.toLowerCase() === ADDRESSES.umaResolver.toLowerCase();

  // Public odds + volume: on-chain truth blended with a stable seeded baseline so
  // every market always shows readable prices. Per-wallet positions stay private.
  const realYes = isResolved ? m.yesPoolFinal : m.yesPoolSnapshot;
  const realNo = isResolved ? m.noPoolFinal : m.noPoolSnapshot;
  const stats = displayStats(m.address, realYes, realNo, m.betCount);
  const yesPct = isResolved ? (m.outcomeYes ? 100 : 0) : stats.yesPct;

  const meta = getMarketMeta(m.address, m.question);
  const gradient = CATEGORY_GRADIENTS[m.category] ?? CATEGORY_GRADIENTS.Other;
  const [imgError, setImgError] = useState(false);
  const showImage = !!meta.imageUrl && !imgError;

  return (
    <Link href={`/markets/${m.address}`} className="block h-full">
      <GlareCard className="h-full" glareColor="rgba(255,210,8,0.12)">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 group-hover:border-primary/30 group-hover:shadow-card">
          {/* Cover image */}
          <div className="relative h-36 w-full flex-shrink-0">
            {showImage ? (
              <img
                src={meta.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                crossOrigin="anonymous"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
            )}
          </div>

          {/* Card content */}
          <div className="flex flex-1 flex-col p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <CategoryChip category={m.category} />
                {isUmaResolved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                    <ShieldCheck className="h-3 w-3" />
                    UMA
                  </span>
                )}
              </div>
              <MarketStatusBadge status={status} />
            </div>

            {/* Question */}
            <h3 className="mt-3 line-clamp-3 min-h-[60px] font-display text-[15px] font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
              {m.question}
            </h3>

            {/* Odds */}
            <div className="mt-3 flex-1">
              {isVoided ? (
                <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-3 text-sm text-muted-foreground">
                  Market voided — stakes refundable
                </div>
              ) : (
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="font-display text-lg font-extrabold tabular-nums text-yes-fg">
                      {yesPct}% <span className="text-xs font-semibold text-muted-foreground">YES</span>
                    </span>
                    {isResolved && (
                      <span className={m.outcomeYes
                        ? "rounded-md bg-yes-bg px-1.5 py-0.5 text-xs font-semibold text-yes-fg"
                        : "rounded-md bg-no-bg px-1.5 py-0.5 text-xs font-semibold text-no-fg"
                      }>
                        Resolved {m.outcomeYes ? "YES" : "NO"}
                      </span>
                    )}
                  </div>
                  <ProbabilityBar yesPct={yesPct} />
                </div>
              )}
            </div>

            {/* Footer stats — public volume + bet count; amounts/wallets stay private */}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" />
                {stats.betCount.toLocaleString()} positions
              </span>
              {isOpen ? (
                <Countdown deadlineSec={m.deadline} className="font-semibold text-foreground/80" />
              ) : (
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {`$${formatUSDC(stats.volume, { decimals: 0 })} vol`}
                </span>
              )}
            </div>
          </div>
        </div>
      </GlareCard>
    </Link>
  );
}
