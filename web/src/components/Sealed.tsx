"use client";

import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SealedValue({
  placeholder = "$00,000",
  className,
  size = "md",
}: {
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "text-base", md: "text-2xl", lg: "text-4xl" };
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <span
        className={cn("font-display font-extrabold tabular-nums sealed-blur text-blue-300", sizes[size])}
        aria-hidden
      >
        {placeholder}
      </span>
    </span>
  );
}

/** Full sealed panel — shown where probability bars would appear. */
export function SealedBlock({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn(
        "sealed-surface relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3",
        className,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="sealed-shimmer pointer-events-none absolute inset-0" />
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Lock className="h-4 w-4 text-blue-400" strokeWidth={2.5} />
      </span>
      <div className="relative min-w-0">
        <div className="text-sm font-bold text-blue-300">Position sealed</div>
        <div className="truncate text-xs text-blue-400/60">
          Odds hidden until the market settles
        </div>
      </div>
    </motion.div>
  );
}

/** Inline lock chip. */
export function SealedChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-300",
        className,
      )}
    >
      <Lock className="h-3 w-3" strokeWidth={2.5} />
      Sealed
    </span>
  );
}
