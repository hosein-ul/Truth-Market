import Link from "next/link";
import { ChevronLeft, Lock, CheckCircle2 } from "lucide-react";
import { getMarketDetail } from "@/lib/markets";
import { getMarketActivity } from "@/lib/activity";
import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { CategoryChip } from "@/components/CategoryChip";
import { MarketStatusBadge } from "@/components/MarketStatusBadge";
import { Countdown } from "@/components/Countdown";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { BetForm } from "@/components/BetForm";
import { ClaimCard } from "@/components/ClaimCard";
import { OraclePanel } from "@/components/OraclePanel";
import { PositionCard } from "@/components/PositionCard";
import { ActivityChart } from "@/components/ActivityChart";
import { ActivityList } from "@/components/ActivityList";
import { SettlementCard } from "@/components/SettlementCard";
import { Card, CardContent } from "@/components/ui/card";
import { displayStats } from "@/lib/demo";
import { formatUSDC } from "@/lib/format";

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
  const isResolved = status === MARKET_STATUS.RESOLVED;
  const isVoided = status === MARKET_STATUS.VOIDED;

  // Public odds + volume blend on-chain truth with a stable seeded baseline.
  const realYes = isResolved ? m.yesPoolFinal : m.yesPoolSnapshot;
  const realNo = isResolved ? m.noPoolFinal : m.noPoolSnapshot;
  const stats = displayStats(m.address, realYes, realNo, m.betCount);
  const yesPct = isResolved ? (m.outcomeYes ? 100 : 0) : stats.yesPct;

  return (
    <div className="container py-6">
      <Link
        href="/markets"
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
                <Lock className="h-3.5 w-3.5" />
                {stats.betCount.toLocaleString()} encrypted positions
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {m.question}
            </h1>
          </div>

          {/* Hero: public odds */}
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
                          {yesPct}%
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
                  <ProbabilityBar yesPct={yesPct} />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total volume</span>
                    <span className="font-display font-bold tabular-nums">
                      ${formatUSDC(stats.volume, { decimals: 0 })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    These are the market&apos;s public odds — the price the crowd is
                    setting in real time. Every individual position behind them stays
                    encrypted on-chain, so no one can see who bet what.
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
                        ${formatUSDC(stats.volume, { decimals: 0 })}
                      </div>
                    </div>
                  </div>
                  {!isVoided && <ProbabilityBar yesPct={yesPct} />}
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
