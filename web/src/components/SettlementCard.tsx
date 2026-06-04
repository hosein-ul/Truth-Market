import { FileText, Clock, UserCheck, ShieldCheck } from "lucide-react";
import { shortAddr } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function SettlementCard({
  description,
  oracle,
  deadline,
  disputeWindow,
}: {
  description: string;
  oracle: string;
  deadline: number;
  disputeWindow: number;
}) {
  const deadlineDate = new Date(deadline * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const disputeDays = Math.max(1, Math.round(disputeWindow / 86400));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" />
          Resolution & rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Info icon={<Clock className="h-4 w-4" />} label="Closes">
            {deadlineDate}
          </Info>
          <Info icon={<UserCheck className="h-4 w-4" />} label="Resolver">
            {shortAddr(oracle)}
          </Info>
        </div>

        <div className="space-y-2 rounded-xl bg-secondary/50 p-3.5">
          {[
            "Winners split the entire pool, pro-rata to their stake.",
            "Losing positions receive nothing.",
            `If unresolved ${disputeDays} day${disputeDays > 1 ? "s" : ""} after close, the market voids and everyone is refunded.`,
            "All positions stay encrypted until the market settles.",
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {rule}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 text-xs font-medium text-blue-300">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Confidentiality enforced on-chain by Zama — privacy by protocol, not by promise.
        </div>
      </CardContent>
    </Card>
  );
}

function Info({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold tabular-nums">{children}</div>
    </div>
  );
}
