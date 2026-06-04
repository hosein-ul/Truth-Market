"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Sealed — the signature visual primitive of TruthMarket.
 *
 * Instead of a terminal glyph-scramble, a sealed value is shown as an elegant
 * frosted, blurred number with a soft violet shimmer and a small lock badge.
 * It communicates "this value exists but is private" beautifully.
 */

export function SealedValue({
  placeholder = "$00,000",
  className,
  size = "md",
}: {
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-base",
    md: "text-2xl",
    lg: "text-4xl",
  };
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <span
        className={cn("font-display font-extrabold tabular-nums sealed-blur", sizes[size])}
        aria-hidden
      >
        {placeholder}
      </span>
    </span>
  );
}

/** A full sealed panel used where probability would normally appear. */
export function SealedBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "sealed-surface relative flex items-center gap-3 overflow-hidden rounded-xl border border-violet-100 px-4 py-3",
        className,
      )}
    >
      <div className="sealed-shimmer pointer-events-none absolute inset-0" />
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/70 shadow-soft">
        <Lock className="h-4 w-4 text-violet-600" strokeWidth={2.5} />
      </span>
      <div className="relative min-w-0">
        <div className="text-sm font-bold text-violet-900">Position sealed</div>
        <div className="truncate text-xs text-violet-600">
          Odds hidden until the market settles
        </div>
      </div>
    </div>
  );
}

/** Inline lock chip. */
export function SealedChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700",
        className,
      )}
    >
      <Lock className="h-3 w-3" strokeWidth={2.5} />
      Sealed
    </span>
  );
}
