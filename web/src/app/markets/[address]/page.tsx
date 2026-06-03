import { getMarketDetail } from "@/lib/markets";
import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownClock } from "@/components/CountdownClock";
import { EncryptedValue } from "@/components/EncryptedValue";
import { BetPanel } from "@/components/BetPanel";
import { ClaimPanel } from "@/components/ClaimPanel";
import { OracleControls } from "@/components/OracleControls";
import { PoolBar } from "@/components/PoolBar";
import { formatUSDC, shortAddr } from "@/lib/format";
import Link from "next/link";

export const revalidate = 15;

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const m = await getMarketDetail(address as `0x${string}`);
  const status = m.status as MarketStatusValue;
  const isSealed = status === MARKET_STATUS.OPEN || status === MARKET_STATUS.RESOLVING;
  const totalPool = m.yesPoolClear + m.noPoolClear;

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-10 pb-24">
      {/* Breadcrumb */}
      <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-bone-dim mb-6">
        <Link href="/" className="hover:text-bone">
          Markets
        </Link>{" "}
        <span className="text-bone-dark">/</span>{" "}
        <span className="text-bone-dim">{m.category}</span>{" "}
        <span className="text-bone-dark">/</span>{" "}
        <span className="text-bone-dim">{shortAddr(m.address)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: market identity + pools + meta */}
        <div className="lg:col-span-7">
          <div className="flex items-start justify-between gap-4 mb-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone-dim">
              {m.category}
            </span>
            <StatusBadge status={status} />
          </div>

          <h1 className="font-serif text-[44px] md:text-[56px] leading-[1.04] tracking-[-0.02em] text-bone">
            {m.question}
          </h1>

          {m.description && (
            <p className="mt-6 text-bone-dim leading-relaxed max-w-[68ch]">
              {m.description}
            </p>
          )}

          {/* Pools panel */}
          <div className="mt-10 hairline p-6 bg-ink-800/40">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone">
                Pools
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone-dim">
                {isSealed
                  ? "encrypted on-chain · revealed on resolution"
                  : "decrypted · final"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <PoolSide
                label="YES"
                isSealed={isSealed}
                amount={m.yesPoolClear}
                tone="signal"
                isWinner={
                  status === MARKET_STATUS.RESOLVED && m.outcomeYes
                }
              />
              <PoolSide
                label="NO"
                isSealed={isSealed}
                amount={m.noPoolClear}
                tone="bleed"
                isWinner={
                  status === MARKET_STATUS.RESOLVED && !m.outcomeYes
                }
              />
            </div>

            {status === MARKET_STATUS.RESOLVED && totalPool > 0n && (
              <div className="mt-6">
                <PoolBar yes={m.yesPoolClear} no={m.noPoolClear} />
                <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-bone-dim">
                  <span>YES {percent(m.yesPoolClear, totalPool)}%</span>
                  <span>NO {percent(m.noPoolClear, totalPool)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Meta grid */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-wire hairline">
            <Meta
              label="Status"
              value={
                status === MARKET_STATUS.OPEN ? (
                  <CountdownClock deadlineSec={m.deadline} className="text-[13px]" />
                ) : (
                  <span className="font-mono text-[13px] text-bone">
                    {labelOf(status)}
                  </span>
                )
              }
            />
            <Meta
              label="Deadline"
              value={new Date(m.deadline * 1000).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
            <Meta label="Creator" value={shortAddr(m.creator)} />
            <Meta label="Oracle" value={shortAddr(m.oracle)} />
          </div>
        </div>

        {/* Right: action column */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 space-y-4">
            {status === MARKET_STATUS.OPEN && (
              <BetPanel marketAddress={m.address} deadline={m.deadline} />
            )}
            {(status === MARKET_STATUS.RESOLVED || status === MARKET_STATUS.VOIDED) && (
              <ClaimPanel
                marketAddress={m.address}
                voided={status === MARKET_STATUS.VOIDED}
                outcomeYes={m.outcomeYes}
              />
            )}
            <OracleControls
              marketAddress={m.address}
              oracle={m.oracle}
              deadline={m.deadline}
              disputeWindow={m.disputeWindow}
              status={status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PoolSide({
  label,
  isSealed,
  amount,
  tone,
  isWinner,
}: {
  label: string;
  isSealed: boolean;
  amount: bigint;
  tone: "signal" | "bleed";
  isWinner: boolean;
}) {
  return (
    <div className={`hairline p-4 ${isWinner ? "bg-signal/5" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <span
          className={`font-mono text-[12px] uppercase tracking-[0.2em] ${
            tone === "signal" ? "text-signal" : "text-bleed"
          }`}
        >
          {label}
        </span>
        {isWinner && (
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-signal">
            ◆ outcome
          </span>
        )}
      </div>
      {isSealed ? (
        <EncryptedValue revealed={false} width={9} className="text-[20px]" />
      ) : (
        <div className="font-mono num text-[24px] text-reveal">
          ${formatUSDC(amount)}
        </div>
      )}
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone-dark mt-2">
        cUSDC
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 bg-ink-900">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-dark mb-1">
        {label}
      </div>
      <div className="font-mono text-[13px] text-bone">{value}</div>
    </div>
  );
}

function percent(part: bigint, total: bigint): string {
  if (total === 0n) return "0";
  const n = Number((part * 1000n) / total) / 10;
  return n.toFixed(1);
}

function labelOf(s: MarketStatusValue) {
  return s === MARKET_STATUS.OPEN
    ? "Open"
    : s === MARKET_STATUS.RESOLVING
      ? "Resolving"
      : s === MARKET_STATUS.RESOLVED
        ? "Resolved"
        : "Voided";
}
