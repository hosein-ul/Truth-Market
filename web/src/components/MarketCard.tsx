import Link from "next/link";
import type { MarketSummary } from "@/lib/markets";
import { EncryptedValue } from "./EncryptedValue";
import { StatusBadge } from "./StatusBadge";
import { CountdownClock } from "./CountdownClock";
import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { formatUSDC } from "@/lib/format";

/*
 * MarketCard — feed unit.
 *
 * Layout intent: hairline grid cell, dense but breathing. The question is the
 * hero (serif, large). Underneath is a "data row" showing either encrypted
 * pool glyphs (Open / Resolving) or revealed pool numbers (Resolved). Status
 * sits in the corner — the dot animates when sealed.
 */

export function MarketCard({ m }: { m: MarketSummary }) {
  const status = m.status as MarketStatusValue;
  const isSealed = status === MARKET_STATUS.OPEN || status === MARKET_STATUS.RESOLVING;
  const total = m.yesPoolClear + m.noPoolClear;

  return (
    <Link
      href={`/markets/${m.address}`}
      className="group block hairline bg-ink-800/40 hover:bg-ink-700/60 transition-colors p-5 relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-bone-dim">
          {m.category}
        </div>
        <StatusBadge status={status} />
      </div>

      <h3 className="font-serif text-[22px] leading-[1.18] mt-3 text-bone group-hover:text-signal transition-colors">
        {m.question}
      </h3>

      <div className="mt-6 grid grid-cols-3 gap-3 items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-dark mb-1">
            Yes pool
          </div>
          {isSealed ? (
            <EncryptedValue revealed={false} width={6} className="text-[14px]" />
          ) : (
            <div className="font-mono num text-[14px] text-reveal">
              ${formatUSDC(m.yesPoolClear)}
            </div>
          )}
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-dark mb-1">
            No pool
          </div>
          {isSealed ? (
            <EncryptedValue revealed={false} width={6} className="text-[14px]" />
          ) : (
            <div className="font-mono num text-[14px] text-reveal">
              ${formatUSDC(m.noPoolClear)}
            </div>
          )}
        </div>
        <div className="text-right">
          {status === MARKET_STATUS.OPEN ? (
            <CountdownClock deadlineSec={m.deadline} />
          ) : status === MARKET_STATUS.RESOLVED ? (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-dark mb-1">
                Outcome
              </div>
              <div
                className={`font-mono text-[14px] ${
                  m.outcomeYes ? "text-signal" : "text-bleed"
                }`}
              >
                {m.outcomeYes ? "YES" : "NO"}
              </div>
            </div>
          ) : (
            <div className="font-mono text-[10px] text-bone-dim">—</div>
          )}
        </div>
      </div>

      {status === MARKET_STATUS.RESOLVED && total > 0n && (
        <div className="mt-3 h-px bg-wire relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-signal"
            style={{
              width: `${Number((m.yesPoolClear * 1000n) / total) / 10}%`,
            }}
          />
        </div>
      )}
    </Link>
  );
}
