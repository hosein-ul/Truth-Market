"use client";

import Link from "next/link";
import { Lock, TrendingUp, Sparkles, RefreshCw } from "lucide-react";
import type { MarketSummary } from "@/lib/markets";
import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { CategoryChip } from "./CategoryChip";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { Countdown } from "./Countdown";
import { ProbabilityBar } from "./ProbabilityBar";
import { LiveOdds } from "./LiveOdds";
import { GlareCard } from "./GlareCard";
import { formatUSDC } from "@/lib/format";
import { pct } from "@/lib/utils";

export function MarketCard({ m }: { m: MarketSummary }) {
  const status = m.status as MarketStatusValue;
  const isOpen = status === MARKET_STATUS.OPEN;
  const isResolving = status === MARKET_STATUS.RESOLVING;
  const isResolved = status === MARKET_STATUS.RESOLVED;
  const isVoided = status === MARKET_STATUS.VOIDED;

  // Live odds come from the last K-anonymity snapshot. Once resolved, use finals.
  const yesShown = isResolved ? m.yesPoolFinal : m.yesPoolSnapshot;
  const noShown = isResolved ? m.noPoolFinal : m.noPoolSnapshot;
  const total = yesShown + noShown;
  const yesPct = pct(yesShown, total, 0);
  const hasOdds = total > 0n;
  const betsBehindSnapshot = Math.max(0, m.betCount - m.lastSnapshotBetCount);
  const pendingFirstSnapshot = isOpen && !hasOdds && m.betCount > 0;

  return (
    <Link href={`/markets/${m.address}`} className="block h-full">
      <GlareCard className="h-full" glareColor="rgba(249,115,22,0.08)">
        <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition-all duration-200 group-hover:border-orange-200 group-hover:shadow-card">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <CategoryChip category={m.category} />
            <MarketStatusBadge status={status} />
          </div>

          {/* Question */}
          <h3 className="mt-3 line-clamp-3 min-h-[60px] font-display text-[15px] font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-orange-700">
            {m.question}
          </h3>

          {/* Odds */}
          <div className="mt-3 flex-1">
            {isResolved && hasOdds ? (
              <div>
                <ProbabilityBar yesPct={yesPct} />
                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
                  <span className={m.outcomeYes
                    ? "rounded-md bg-yes-bg px-1.5 py-0.5 text-yes-fg"
                    : "rounded-md bg-no-bg px-1.5 py-0.5 text-no-fg"
                  }>
                    Resolved {m.outcomeYes ? "YES" : "NO"}
                  </span>
                </div>
              </div>
            ) : isOpen && m.betCount >= m.snapshotBatchK ? (
              <div>
                <LiveOdds
                  yesHandle={m.yesPoolHandle}
                  noHandle={m.noPoolHandle}
                  initialYes={m.yesPoolSnapshot}
                  initialNo={m.noPoolSnapshot}
                  betsBehindSnapshot={betsBehindSnapshot}
                  snapshotBatchK={m.snapshotBatchK}
                />
                {betsBehindSnapshot > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700">
                    <RefreshCw className="h-3 w-3" />
                    {betsBehindSnapshot} bet{betsBehindSnapshot > 1 ? "s" : ""} since last snapshot
                  </div>
                )}
              </div>
            ) : isVoided ? (
              <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-3 text-sm text-muted-foreground">
                Market voided — stakes refundable
              </div>
            ) : isResolving ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-3 py-3 text-sm text-amber-700">
                <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
                Decrypting final pools…
              </div>
            ) : pendingFirstSnapshot ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-sky-200 bg-sky-50/50 px-3 py-3 text-sm text-sky-700">
                <Lock className="h-4 w-4 shrink-0" />
                {m.snapshotBatchK - betsBehindSnapshot} more bet{m.snapshotBatchK - betsBehindSnapshot > 1 ? "s" : ""} to first odds
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-orange-200 bg-orange-50/50 px-3 py-3 text-sm text-orange-600">
                <Sparkles className="h-4 w-4 shrink-0" />
                No bets yet — be the first
              </div>
            )}
          </div>

          {/* Footer stats — betCount is public; amounts/wallets are not */}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" />
              {m.betCount > 0 ? `${m.betCount} encrypted bet${m.betCount > 1 ? "s" : ""}` : "No bets yet"}
            </span>
            {isOpen ? (
              <Countdown deadlineSec={m.deadline} className="font-semibold text-foreground/80" />
            ) : isResolved || isVoided ? (
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                {`$${formatUSDC(total, { decimals: 0 })} vol`}
              </span>
            ) : (
              <span className="font-semibold text-amber-600">Awaiting result</span>
            )}
          </div>
        </div>
      </GlareCard>
    </Link>
  );
}
