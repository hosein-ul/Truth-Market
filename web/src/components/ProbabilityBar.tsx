import { cn } from "@/lib/utils";

/*
 * Polymarket-style probability bar. Shows YES (emerald) vs NO (rose) split.
 * Used only after a market resolves (or in any context where the split is
 * public). While sealed, callers render <SealedBlock /> instead.
 */

export function ProbabilityBar({
  yesPct,
  className,
  showLabels = true,
  size = "md",
}: {
  yesPct: number; // 0..100
  className?: string;
  showLabels?: boolean;
  size?: "sm" | "md";
}) {
  const yes = Math.max(0, Math.min(100, yesPct));
  const no = 100 - yes;
  const h = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={cn("w-full", className)}>
      {showLabels && (
        <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
          <span className="text-yes-fg">{yes.toFixed(0)}% Yes</span>
          <span className="text-no-fg">{no.toFixed(0)}% No</span>
        </div>
      )}
      <div className={cn("flex w-full overflow-hidden rounded-full bg-no-bg", h)}>
        <div className="h-full bg-yes transition-all duration-500" style={{ width: `${yes}%` }} />
        <div className="h-full bg-no transition-all duration-500" style={{ width: `${no}%` }} />
      </div>
    </div>
  );
}
