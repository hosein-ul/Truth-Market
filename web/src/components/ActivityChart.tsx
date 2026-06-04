import { Activity } from "lucide-react";
import type { ActivityItem } from "@/lib/activity";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

/*
 * Honest activity chart: while a market is sealed we can't show amounts or
 * odds, but bet *flow* (count over time) is public via BetPlaced events. We
 * bucket events into a sparkline-style bar chart of betting momentum.
 */
export function ActivityChart({ items }: { items: ActivityItem[] }) {
  const BUCKETS = 14;
  let counts = new Array(BUCKETS).fill(0);

  if (items.length > 0) {
    const blocks = items.map((i) => Number(i.blockNumber)).filter((n) => n > 0);
    if (blocks.length > 0) {
      const min = Math.min(...blocks);
      const max = Math.max(...blocks);
      const span = Math.max(max - min, 1);
      for (const b of blocks) {
        const idx = Math.min(BUCKETS - 1, Math.floor(((b - min) / span) * (BUCKETS - 1)));
        counts[idx]++;
      }
    }
  }

  const peak = Math.max(...counts, 1);
  const hasData = items.length > 0;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Betting momentum</CardTitle>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600">
            <Activity className="h-3.5 w-3.5" />
            Sealed flow
          </span>
        </div>
        <CardDescription>
          Position sizes stay private — this shows how many sealed bets are flowing in over time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground">
            Activity will appear here as bets come in.
          </div>
        ) : (
          <div className="flex h-32 items-end gap-1.5">
            {counts.map((c, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center justify-end">
                <div
                  className="w-full rounded-t-md bg-brand-gradient transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${Math.max((c / peak) * 100, c > 0 ? 8 : 2)}%`, opacity: c > 0 ? 1 : 0.25 }}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
