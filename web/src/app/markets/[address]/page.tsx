import { getMarketDetail } from "@/lib/markets";
import { getMarketActivity } from "@/lib/activity";
import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownClock } from "@/components/CountdownClock";
import { BetPanel } from "@/components/BetPanel";
import { ClaimPanel } from "@/components/ClaimPanel";
import { OracleControls } from "@/components/OracleControls";
import { ProbabilityDisplay } from "@/components/ProbabilityDisplay";
import { ActivityFeed } from "@/components/ActivityFeed";
import { SettlementRules } from "@/components/SettlementRules";
import { PositionPanel } from "@/components/PositionPanel";
import { formatUSDC, shortAddr } from "@/lib/format";
import Link from "next/link";

export const revalidate = 15;

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const [m, activity] = await Promise.all([
    getMarketDetail(address as `0x${string}`),
    getMarketActivity(address as `0x${string}`, 8),
  ]);
  const status = m.status as MarketStatusValue;
  const total = m.yesPoolClear + m.noPoolClear;

  const deadlineDate = new Date(m.deadline * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-6 pb-20">
      {/* Breadcrumb + status strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-bone-dim flex items-center gap-1.5">
          <Link href="/" className="hover:text-bone transition-colors">Markets</Link>
          <span className="text-bone-dark">›</span>
          <span>{m.category}</span>
          <span className="text-bone-dark">›</span>
          <span className="text-bone-dark">{shortAddr(m.address)}</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {status === MARKET_STATUS.OPEN && (
            <CountdownClock deadlineSec={m.deadline} className="text-[11px]" />
          )}
          {status === MARKET_STATUS.RESOLVED && (
            <span className={`font-mono text-[10px] ${m.outcomeYes ? "text-signal" : "text-bleed"}`}>
              Resolved {m.outcomeYes ? "YES" : "NO"}
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <h1 className="font-serif text-[32px] md:text-[46px] leading-[1.08] tracking-[-0.02em] text-bone mb-1">
        {m.question}
      </h1>

      {/* ASCII separator */}
      <div className="font-mono text-[9px] text-bone-dark flex items-center gap-2 mt-3 mb-8 select-none">
        <span className="flex-1 border-t border-wire" />
        <span>◆</span>
        <span className="flex-1 border-t border-wire" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: market data (7/12) */}
        <div className="lg:col-span-7 space-y-4">

          {/* Probability / Odds display */}
          <ProbabilityDisplay
            status={status}
            yesPoolClear={m.yesPoolClear}
            noPoolClear={m.noPoolClear}
            outcomeYes={m.outcomeYes}
          />

          {/* Market stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ boxShadow: "inset 0 0 0 0.5px rgba(46,52,65,1)" }}>
            <MetaCell
              label="Deadline"
              value={deadlineDate}
            />
            <MetaCell
              label="Pool (cUSDC)"
              value={
                status === MARKET_STATUS.RESOLVED || status === MARKET_STATUS.VOIDED
                  ? `$${formatUSDC(total)}`
                  : "Sealed"
              }
              tone={status === MARKET_STATUS.RESOLVED ? "reveal" : undefined}
            />
            <MetaCell label="Creator" value={shortAddr(m.creator)} />
            <MetaCell label="Oracle" value={shortAddr(m.oracle)} />
          </div>

          {/* Activity feed */}
          <ActivityFeed items={activity} />

          {/* Settlement rules */}
          <SettlementRules
            description={m.description}
            oracle={m.oracle}
            deadline={m.deadline}
            disputeWindow={m.disputeWindow}
          />
        </div>

        {/* RIGHT: action column (5/12) */}
        <div className="lg:col-span-5">
          <div className="sticky top-16 space-y-3">

            {/* Bet ticket */}
            {status === MARKET_STATUS.OPEN && (
              <BetPanel marketAddress={m.address} deadline={m.deadline} />
            )}

            {/* Claim panel */}
            {(status === MARKET_STATUS.RESOLVED ||
              status === MARKET_STATUS.VOIDED) && (
              <ClaimPanel
                marketAddress={m.address}
                voided={status === MARKET_STATUS.VOIDED}
                outcomeYes={m.outcomeYes}
              />
            )}

            {/* My position */}
            <PositionPanel marketAddress={m.address} />

            {/* Oracle controls */}
            <OracleControls
              marketAddress={m.address}
              oracle={m.oracle}
              deadline={m.deadline}
              disputeWindow={m.disputeWindow}
              status={status}
            />

            {/* Privacy note */}
            <div className="panel p-4">
              <div className="font-mono text-[9px] text-bone-dark leading-[1.7] space-y-1">
                <div className="text-signal uppercase tracking-[0.16em] mb-2">
                  ◈ Privacy guarantee
                </div>
                <div>▸ All bets encrypted at submission via Zama FHEVM</div>
                <div>▸ Amount and side never appear in plaintext on-chain</div>
                <div>▸ Position decryptable only by your wallet (EIP-712)</div>
                <div>▸ Payout delivered as confidential cUSDC</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "signal" | "reveal";
}) {
  return (
    <div className="stat-cell">
      <div className="stat-label">{label}</div>
      <div
        className={`font-mono text-[13px] num ${
          tone === "signal"
            ? "text-signal"
            : tone === "reveal"
              ? "text-reveal"
              : "text-bone"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
