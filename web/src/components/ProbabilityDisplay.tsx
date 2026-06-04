import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { EncryptedValue } from "./EncryptedValue";
import { pct } from "@/lib/utils";

export function ProbabilityDisplay({
  status,
  yesPoolClear,
  noPoolClear,
  outcomeYes,
}: {
  status: MarketStatusValue;
  yesPoolClear: bigint;
  noPoolClear: bigint;
  outcomeYes: boolean;
}) {
  const isSealed = status === MARKET_STATUS.OPEN || status === MARKET_STATUS.RESOLVING;
  const total = yesPoolClear + noPoolClear;
  const yesPct = total > 0n ? Number(pct(yesPoolClear, total, 1)) : 50;
  const noPct = parseFloat((100 - yesPct).toFixed(1));

  return (
    <div className="panel">
      <div className="panel-header">
        <span>
          {isSealed ? "Implied Probability" : "Settlement Probability"}
        </span>
        {isSealed ? (
          <span className="font-mono text-[9px] text-signal flex items-center gap-1.5">
            <span
              className="inline-block w-1 h-1 rounded-full bg-signal animate-pulse_signal"
            />
            SEALED
          </span>
        ) : (
          <span
            className={`font-mono text-[9px] ${outcomeYes ? "text-signal" : "text-bleed"}`}
          >
            RESOLVED {outcomeYes ? "YES" : "NO"}
          </span>
        )}
      </div>

      {isSealed ? (
        /* Sealed state — privacy is the feature */
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="stat-cell text-center">
              <div className="stat-label text-signal mb-2">YES</div>
              <EncryptedValue revealed={false} width={6} className="text-[18px]" />
            </div>
            <div className="stat-cell text-center">
              <div className="stat-label text-bleed mb-2">NO</div>
              <EncryptedValue revealed={false} width={6} className="text-[18px]" />
            </div>
          </div>
          <div className="prob-track mb-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-full"
                style={{
                  background:
                    i % 2 === 0
                      ? "rgba(182,255,60,0.2)"
                      : "rgba(22,26,34,0.9)",
                }}
              />
            ))}
          </div>
          <div className="space-y-1.5">
            {[
              "Individual positions are encrypted on-chain via FHEVM",
              "Aggregate pools are sealed until market resolution",
              "No herding bias — sides are hidden from all participants",
              "Probability reveals only at settlement",
            ].map((line, i) => (
              <div key={i} className="flex items-start gap-2 font-mono text-[10px] text-bone-dark">
                <span className="text-signal mt-0.5">◈</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Resolved state — show the real split */
        <div className="p-5">
          <div className="flex items-end gap-4 mb-5">
            <div className="flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal mb-2">YES</div>
              <div className="font-mono num leading-none text-bone">
                <span className="text-[52px]">{yesPct.toFixed(0)}</span>
                <span className="text-[22px] text-bone-dim">%</span>
              </div>
              {outcomeYes && (
                <div className="font-mono text-[9px] text-signal mt-1">◆ RESOLVED YES</div>
              )}
            </div>
            <div className="text-right flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-bleed mb-2">NO</div>
              <div className="font-mono num leading-none text-bone">
                <span className="text-[52px]">{noPct.toFixed(0)}</span>
                <span className="text-[22px] text-bone-dim">%</span>
              </div>
              {!outcomeYes && (
                <div className="font-mono text-[9px] text-bleed mt-1">◆ RESOLVED NO</div>
              )}
            </div>
          </div>
          <div className="prob-track">
            <div className="prob-fill-yes" style={{ width: `${yesPct}%` }} />
            <div className="prob-fill-sep" />
            <div className="prob-fill-no" style={{ width: `${noPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[9px] text-bone-dark">
            <span>{yesPct.toFixed(1)}%</span>
            <span>{noPct.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
