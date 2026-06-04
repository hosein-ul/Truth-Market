import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { Badge } from "@/components/ui/badge";
import { Lock, Clock, CheckCircle2, Ban } from "lucide-react";

export function MarketStatusBadge({ status }: { status: MarketStatusValue }) {
  switch (status) {
    case MARKET_STATUS.OPEN:
      return (
        <Badge variant="sealed" className="gap-1">
          <Lock className="h-3 w-3" strokeWidth={2.5} />
          Open · Sealed
        </Badge>
      );
    case MARKET_STATUS.RESOLVING:
      return (
        <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-400">
          <Clock className="h-3 w-3" strokeWidth={2.5} />
          Resolving
        </Badge>
      );
    case MARKET_STATUS.RESOLVED:
      return (
        <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
          Settled
        </Badge>
      );
    case MARKET_STATUS.VOIDED:
      return (
        <Badge variant="outline" className="gap-1 border-slate-500/30 bg-slate-500/10 text-slate-400">
          <Ban className="h-3 w-3" strokeWidth={2.5} />
          Voided
        </Badge>
      );
    default:
      return null;
  }
}
