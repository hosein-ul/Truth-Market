import { ArrowUpRight, Lock, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { ActivityItem, ActivityKind } from "@/lib/activity";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const META: Record<ActivityKind, { label: string; icon: React.ReactNode; cls: string }> = {
  bet: {
    label: "Encrypted prediction placed",
    icon: <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />,
    cls: "bg-sky-50 text-sky-700",
  },
  snapshot: {
    label: "Odds snapshot refreshed",
    icon: <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} />,
    cls: "bg-primary/10 text-primary",
  },
  resolving: {
    label: "Oracle resolved — pools being decrypted",
    icon: <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />,
    cls: "bg-amber-50 text-amber-700",
  },
  resolved: {
    label: "Market settled",
    icon: <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />,
    cls: "bg-emerald-50 text-emerald-700",
  },
  voided: {
    label: "Market voided — refunds enabled",
    icon: <XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />,
    cls: "bg-rose-50 text-rose-700",
  },
};

export function ActivityList({ items }: { items: ActivityItem[] }) {
  const bets = items.filter((i) => i.kind === "bet").length;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Recent activity</CardTitle>
        <span className="text-xs text-muted-foreground">
          {bets} position{bets !== 1 ? "s" : ""} · all anonymous
        </span>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-8 text-center text-sm text-muted-foreground">
            No predictions yet — be the first to take a position.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item, i) => {
              const m = META[item.kind];
              return (
                <li key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`grid h-8 w-8 place-items-center rounded-full ${m.cls}`}>{m.icon}</span>
                    <div className="text-sm">
                      <span className="text-foreground">{m.label}</span>
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
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
