import { getMarketSummaries } from "@/lib/markets";
import { MarketsFeed } from "@/components/MarketsFeed";
import { MARKET_STATUS } from "@/lib/abis";
import Link from "next/link";

export const revalidate = 30;

export default async function HomePage() {
  const markets = await getMarketSummaries();
  const nOpen = markets.filter((m) => m.status === MARKET_STATUS.OPEN).length;
  const nResolving = markets.filter((m) => m.status === MARKET_STATUS.RESOLVING).length;
  const nSettled = markets.filter(
    (m) => m.status === MARKET_STATUS.RESOLVED || m.status === MARKET_STATUS.VOIDED,
  ).length;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-8 pb-20">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone-dark mb-2 flex items-center gap-2">
            <span className="dot-live" />
            Sealed prediction markets · Ethereum Sepolia
          </div>
          <h1 className="font-serif text-[34px] md:text-[44px] leading-[1.05] tracking-[-0.02em] text-bone">
            Predict. Sealed. Verified.
          </h1>
          <p className="mt-2 max-w-[60ch] text-[13px] text-bone-dim leading-[1.55]">
            Bet amounts and sides are encrypted on-chain via{" "}
            <span className="text-signal font-mono">FHEVM</span>. Only the resolved
            outcome and aggregate pools become public. Your position is private.
          </p>
        </div>

        {/* Stats */}
        <div className="flex-shrink-0">
          <div
            className="grid grid-cols-4 gap-px"
            style={{ boxShadow: "inset 0 0 0 0.5px rgba(46,52,65,1)" }}
          >
            <StatCell label="Total" value={markets.length.toString()} />
            <StatCell label="Sealed" value={nOpen.toString()} tone="signal" />
            <StatCell label="Resolving" value={nResolving.toString()} tone="reveal" />
            <StatCell label="Settled" value={nSettled.toString()} />
          </div>
        </div>
      </div>

      {/* ASCII rule */}
      <div className="font-mono text-[9px] text-bone-dark mb-5 flex items-center gap-3">
        <span className="select-none">─────</span>
        <span className="uppercase tracking-[0.22em]">Markets</span>
        <span className="flex-1 border-t border-wire" />
        <Link
          href="/create"
          className="text-signal hover:text-signal-dim transition-colors flex items-center gap-1 uppercase tracking-[0.18em]"
        >
          + Open new market
        </Link>
      </div>

      {/* Markets feed with client-side filters */}
      <MarketsFeed markets={markets} />

      {/* Protocol pillars */}
      {markets.length > 0 && (
        <div className="mt-12 panel p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProtocolNote
              title="◈ End-to-end Encryption"
              body="Amount and side are encrypted client-side before submission. The contract never sees plaintext inputs."
            />
            <ProtocolNote
              title="◈ Anti-Herding Design"
              body="No implied odds during the open phase. Prevents whale-driven bias and copy-trading from the outset."
            />
            <ProtocolNote
              title="◈ Private Payouts"
              body="Winnings are delivered as confidential cUSDC. Only your wallet can decrypt the amount you received."
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "signal" | "reveal";
}) {
  return (
    <div className="stat-cell min-w-[68px]">
      <div className="stat-label">{label}</div>
      <div
        className={`stat-value ${tone === "signal" ? "text-signal" : tone === "reveal" ? "text-reveal" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function ProtocolNote({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal mb-2">
        {title}
      </div>
      <p className="font-mono text-[11px] text-bone-dim leading-[1.6]">{body}</p>
    </div>
  );
}
