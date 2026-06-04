import Link from "next/link";
import { ChevronLeft, Users, CheckCircle2, BarChart3 } from "lucide-react";
import { getMarketDetail } from "@/lib/markets";
import { getMarketActivity } from "@/lib/activity";
import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { CategoryChip } from "@/components/CategoryChip";
import { MarketStatusBadge } from "@/components/MarketStatusBadge";
import { Countdown } from "@/components/Countdown";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { LiveOdds } from "@/components/LiveOdds";
import { RefreshOddsButton } from "@/components/RefreshOddsButton";
import { BetForm } from "@/components/BetForm";
import { ClaimCard } from "@/components/ClaimCard";
import { OraclePanel } from "@/components/OraclePanel";
import { PositionCard } from "@/components/PositionCard";
import { ActivityChart } from "@/components/ActivityChart";
import { ActivityList } from "@/components/ActivityList";
import { SettlementCard } from "@/components/SettlementCard";
import { Card, CardContent } from "@/components/ui/card";
import { formatUSDC } from "@/lib/format";
import { pct } from "@/lib/utils";

export const revalidate = 15;

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const addr = address as `0x${string}`;
  const [m, activity] = await Promise.all([
    getMarketDetail(addr),
    getMarketActivity(addr, 14),
  ]);

  const status = m.status as MarketStatusValue;
  const isOpen = status === MARKET_STATUS.OPEN;
  const isResolving = status === MARKET_STATUS.RESOLVING;
  const isResolved = status === MARKET_STATUS.RESOLVED;
  const isVoided = status === MARKET_STATUS.VOIDED;

  const yesShown = isResolved ? m.yesPoolFinal : m.yesPoolSnapshot;
  const noShown = isResolved ? m.noPoolFinal : m.noPoolSnapshot;
  const total = yesShown + noShown;
  const yesPct = pct(yesShown, total, 0);
  const hasBets = total > 0n;
  const betsBehindSnapshot = Math.max(0, m.betCount - m.lastSnapshotBetCount);

  return (
    <div className="container py-6">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All markets
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT — market info */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryChip category={m.category} />
              <MarketStatusBadge status={status} />
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {m.betCount} encrypted bet{m.betCount !== 1 ? "s" : ""}
              </span>
              {isOpen && (
                <RefreshOddsButton
                  marketAddress={m.address}
                  betsBehindSnapshot={betsBehindSnapshot}
                  snapshotBatchK={m.snapshotBatchK}
                />
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {m.question}
            </h1>
          </div>

          {/* Hero: real odds */}
          <Card>
            <CardContent className="p-5">
              {isOpen ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Implied probability
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-extrabold text-yes-fg">
                          {hasBets ? `${yesPct}%` : "—"}
                        </span>
                        <span className="text-sm font-semibold text-muted-foreground">YES</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-muted-foreground">Closes in</div>
                      <Countdown
                        deadlineSec={m.deadline}
                        withIcon={false}
                        className="font-display text-lg font-bold"
                      />
                    </div>
                  </div>
                  {m.betCount >= m.snapshotBatchK ? (
                    <LiveOdds
                      yesHandle={m.yesPoolHandle}
                      noHandle={m.noPoolHandle}
                      initialYes={m.yesPoolSnapshot}
                      initialNo={m.noPoolSnapshot}
                      betsBehindSnapshot={betsBehindSnapshot}
                      snapshotBatchK={m.snapshotBatchK}
                      layout="hero"
                    />
                  ) : m.betCount > 0 ? (
                    <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-sky-700">
                      Odds open after {m.snapshotBatchK - m.betCount} more
                      bet{m.snapshotBatchK - m.betCount > 1 ? "s" : ""}. K-anonymity gate keeps
                      individual bets unattributable.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/50 px-4 py-3 text-sm text-orange-700">
                      No bets yet — be the first to take a position.
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total volume</span>
                    <span className="font-display font-bold tabular-nums">${formatUSDC(total)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Odds are revealed in K-anonymous snapshots: every {m.snapshotBatchK}{" "}
                    new bets, the aggregated pools can be publicly decrypted. A snapshot
                    diff covers ≥{m.snapshotBatchK} bets at once, so it never attributes
                    to a single wallet. Per-wallet stakes stay encrypted end-to-end.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Final result</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <CheckCircle2
                          className={isVoided ? "h-5 w-5 text-slate-400" : m.outcomeYes ? "h-5 w-5 text-yes" : "h-5 w-5 text-no"}
                        />
                        <span className="font-display text-2xl font-extrabold">
                          {isVoided ? "Voided" : m.outcomeYes ? "YES" : "NO"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-muted-foreground">Total volume</div>
                      <div className="font-display text-lg font-bold tabular-nums">
                        ${formatUSDC(total)}
                      </div>
                    </div>
                  </div>
                  {!isVoided && hasBets && <ProbabilityBar yesPct={yesPct} />}
                  {isVoided && (
                    <p className="text-sm text-muted-foreground">
                      This market was voided. All bettors can withdraw their full stake.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <ActivityChart items={activity} />
          <ActivityList items={activity} />
          <SettlementCard
            description={m.description}
            oracle={m.oracle}
            deadline={m.deadline}
            disputeWindow={m.disputeWindow}
          />
        </div>

        {/* RIGHT — actions */}
        <div className="lg:col-span-1">
          <div className="space-y-4 lg:sticky lg:top-20">
            {isOpen && <BetForm marketAddress={m.address} deadline={m.deadline} />}
            {(isResolved || isVoided) && (
              <ClaimCard
                marketAddress={m.address}
                voided={isVoided}
                outcomeYes={m.outcomeYes}
              />
            )}
            <PositionCard marketAddress={m.address} />
            <OraclePanel
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
