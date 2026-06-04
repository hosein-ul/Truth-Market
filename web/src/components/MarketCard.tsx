import Link from "next/link";
import { Users, TrendingUp } from "lucide-react";
import type { MarketSummary } from "@/lib/markets";
import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { Card } from "@/components/ui/card";
import { CategoryChip } from "./CategoryChip";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { Countdown } from "./Countdown";
import { ProbabilityBar } from "./ProbabilityBar";
import { SealedBlock } from "./Sealed";
import { formatUSDC } from "@/lib/format";
import { pct } from "@/lib/utils";

export function MarketCard({ m }: { m: MarketSummary }) {
  const status = m.status as MarketStatusValue;
  const isOpen = status === MARKET_STATUS.OPEN;
  const isResolving = status === MARKET_STATUS.RESOLVING;
  const isResolved = status === MARKET_STATUS.RESOLVED;
  const isVoided = status === MARKET_STATUS.VOIDED;
  const sealed = isOpen || isResolving;

  const total = m.yesPoolClear + m.noPoolClear;
  const yesPct = pct(m.yesPoolClear, total, 0);

  return (
    <Link href={`/markets/${m.address}`} className="group block h-full">
      <Card className="hover-lift flex h-full flex-col p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <CategoryChip category={m.category} />
          <MarketStatusBadge status={status} />
        </div>

        {/* Question */}
        <h3 className="mt-3 line-clamp-3 min-h-[60px] font-display text-[15px] font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          {m.question}
        </h3>

        {/* Odds / sealed area */}
        <div className="mt-3 flex-1">
          {sealed ? (
            <SealedBlock />
          ) : isResolved ? (
            <div>
              <ProbabilityBar yesPct={yesPct} />
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
                <span
                  className={
                    m.outcomeYes
                      ? "rounded-md bg-yes-bg px-1.5 py-0.5 text-yes-fg"
                      : "rounded-md bg-no-bg px-1.5 py-0.5 text-no-fg"
                  }
                >
                  Resolved {m.outcomeYes ? "YES" : "NO"}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-3 text-sm text-muted-foreground">
              Market voided — stakes refundable
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {m.traderCount > 0 ? `${m.traderCount} trader${m.traderCount > 1 ? "s" : ""}` : "No bets yet"}
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
      </Card>
    </Link>
  );
}
