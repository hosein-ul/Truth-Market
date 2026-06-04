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
        <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
          <Clock className="h-3 w-3" strokeWidth={2.5} />
          Resolving
        </Badge>
      );
    case MARKET_STATUS.RESOLVED:
      return (
        <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
          Settled
        </Badge>
      );
    case MARKET_STATUS.VOIDED:
      return (
        <Badge variant="outline" className="gap-1 border-slate-300 bg-slate-100 text-slate-600">
          <Ban className="h-3 w-3" strokeWidth={2.5} />
          Voided
        </Badge>
      );
    default:
      return null;
  }
}
