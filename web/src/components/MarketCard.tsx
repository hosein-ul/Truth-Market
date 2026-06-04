import Link from "next/link";
import type { MarketSummary } from "@/lib/markets";
import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { StatusBadge } from "./StatusBadge";
import { CountdownClock } from "./CountdownClock";
import { formatUSDC } from "@/lib/format";
import { pct } from "@/lib/utils";

export function MarketCard({ m }: { m: MarketSummary }) {
  const status = m.status as MarketStatusValue;
  const isOpen = status === MARKET_STATUS.OPEN;
  const isResolving = status === MARKET_STATUS.RESOLVING;
  const isResolved = status === MARKET_STATUS.RESOLVED;
  const isVoided = status === MARKET_STATUS.VOIDED;
  const isSealed = isOpen || isResolving;

  const total = m.yesPoolClear + m.noPoolClear;
  const yesPct = total > 0n ? Number(pct(m.yesPoolClear, total, 0)) : 50;
  const noPct = 100 - yesPct;

  return (
    <Link href={`/markets/${m.address}`} className="market-card p-5 group block">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <span className="chip chip-cat">{m.category}</span>
        <div className="flex items-center gap-2">
          {isOpen && <CountdownClock deadlineSec={m.deadline} compact />}
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Question */}
      <h3 className="font-serif text-[19px] leading-[1.25] text-bone group-hover:text-signal transition-colors line-clamp-3 min-h-[68px]">
        {m.question}
      </h3>

      {/* Data section */}
      <div className="mt-5">
        {isSealed ? (
          /* Sealed state — emphasize privacy, not missing data */
          <div>
            <div className="prob-track mb-2 overflow-hidden">
              {/* Animated sealed bar — alternating lime/dark segments */}
              <div className="h-full w-full flex">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full"
                    style={{
                      background: i % 2 === 0 ? "rgba(182,255,60,0.25)" : "rgba(22,26,34,0.8)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-signal">
                ▓ Positions sealed · FHE encrypted
              </span>
              {isOpen && (
                <span className="font-mono text-[9px] text-bone-dark">
                  {m.deadline > Math.floor(Date.now() / 1000)
                    ? "Accepting bets"
                    : "Deadline passed"}
                </span>
              )}
              {isResolving && (
                <span className="font-mono text-[9px] text-reveal">
                  Awaiting resolution
                </span>
              )}
            </div>
          </div>
        ) : isResolved ? (
          /* Resolved state — show the actual split */
          <div>
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-signal mb-0.5">YES</div>
                <div className="font-mono num text-[26px] leading-none text-bone">
                  {yesPct}
                  <span className="text-[13px] text-bone-dim">%</span>
                </div>
              </div>
              <div className="flex-1 mx-3 pb-1">
                <div className="prob-track">
                  <div className="prob-fill-yes" style={{ width: `${yesPct}%` }} />
                  <div className="prob-fill-sep" />
                  <div className="prob-fill-no" style={{ width: `${noPct}%` }} />
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-bleed mb-0.5">NO</div>
                <div className="font-mono num text-[26px] leading-none text-bone">
                  {noPct}
                  <span className="text-[13px] text-bone-dim">%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="font-mono text-[9px] text-bone-dark">
                Pool: ${formatUSDC(total)}
              </span>
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.14em] ${
                  m.outcomeYes ? "text-signal" : "text-bleed"
                }`}
              >
                ✓ {m.outcomeYes ? "YES" : "NO"}
              </span>
            </div>
          </div>
        ) : (
          /* Voided */
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-bleed">
              Market voided · Refunds available
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
