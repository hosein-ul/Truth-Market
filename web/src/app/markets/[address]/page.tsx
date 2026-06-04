import Link from "next/link";
import { ChevronLeft, Users, Lock, CheckCircle2 } from "lucide-react";
import { getMarketDetail } from "@/lib/markets";
import { getMarketActivity, getTraderCount } from "@/lib/activity";
import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { CategoryChip } from "@/components/CategoryChip";
import { MarketStatusBadge } from "@/components/MarketStatusBadge";
import { Countdown } from "@/components/Countdown";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { SealedBlock } from "@/components/Sealed";
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
  const [m, activity, traderCount] = await Promise.all([
    getMarketDetail(addr),
    getMarketActivity(addr, 14),
    getTraderCount(addr),
  ]);

  const status = m.status as MarketStatusValue;
  const isOpen = status === MARKET_STATUS.OPEN;
  const isResolving = status === MARKET_STATUS.RESOLVING;
  const isResolved = status === MARKET_STATUS.RESOLVED;
  const isVoided = status === MARKET_STATUS.VOIDED;
  const sealed = isOpen || isResolving;

  const total = m.yesPoolClear + m.noPoolClear;
  const yesPct = pct(m.yesPoolClear, total, 0);

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
        {/* LEFT — market info (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryChip category={m.category} />
              <MarketStatusBadge status={status} />
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {traderCount} trader{traderCount !== 1 ? "s" : ""}
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {m.question}
            </h1>
          </div>

          {/* Hero: odds or sealed */}
          <Card>
            <CardContent className="p-5">
              {sealed ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Implied probability
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-display text-2xl font-extrabold text-violet-700">
                          Hidden
                        </span>
                        <Lock className="h-5 w-5 text-violet-500" strokeWidth={2.5} />
                      </div>
                    </div>
                    {isOpen ? (
                      <div className="text-right">
                        <div className="text-xs font-medium text-muted-foreground">Closes in</div>
                        <Countdown
                          deadlineSec={m.deadline}
                          withIcon={false}
                          className="font-display text-lg font-bold"
                        />
                      </div>
                    ) : (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                        Awaiting result
                      </span>
                    )}
                  </div>
                  <SealedBlock />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Every position in this market is encrypted. Odds, sizes, and
                    sides remain private until {isOpen ? "the market closes and is resolved" : "the resolver reveals the pools"}.
                    This is what stops herding and front-running.
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
                  {!isVoided && total > 0n && <ProbabilityBar yesPct={yesPct} />}
                  {isVoided && (
                    <p className="text-sm text-muted-foreground">
                      This market was voided. All bettors can withdraw their full stake.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity chart */}
          <ActivityChart items={activity} />

          {/* Activity list */}
          <ActivityList items={activity} />

          {/* Settlement */}
          <SettlementCard
            description={m.description}
            oracle={m.oracle}
            deadline={m.deadline}
            disputeWindow={m.disputeWindow}
          />
        </div>

        {/* RIGHT — actions (sticky, 1 col) */}
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
