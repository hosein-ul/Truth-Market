import { Lock, ArrowUpRight } from "lucide-react";
import type { ActivityItem } from "@/lib/activity";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Recent activity</CardTitle>
        <span className="text-xs text-muted-foreground">
          {items.length} sealed bet{items.length !== 1 ? "s" : ""}
        </span>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-8 text-center text-sm text-muted-foreground">
            No bets yet — be the first to take a position.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item, i) => (
              <li key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-50 text-violet-600">
                    <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">{item.trader}</span>
                    <span className="text-muted-foreground"> placed a sealed bet</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{item.ageLabel}</span>
                  {item.txHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
