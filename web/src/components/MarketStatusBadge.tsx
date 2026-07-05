import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { Badge } from "@/components/ui/badge";
import { Radio, CheckCircle2, Ban } from "lucide-react";

export function MarketStatusBadge({ status }: { status: MarketStatusValue }) {
  switch (status) {
    case MARKET_STATUS.OPEN:
      return (
        <Badge variant="outline" className="gap-1 border-border bg-secondary text-foreground">
          <Radio className="h-3 w-3 text-primary" strokeWidth={2.5} />
          Live
        </Badge>
      );
    case MARKET_STATUS.RESOLVED:
      return (
        <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
          Settled
        </Badge>
      );
    case MARKET_STATUS.VOIDED:
      return (
        <Badge variant="outline" className="gap-1 border-slate-200 bg-slate-100 text-slate-600">
          <Ban className="h-3 w-3" strokeWidth={2.5} />
          Voided
        </Badge>
      );
    default:
      return null;
  }
}
