"use client";

import { cn } from "@/lib/utils";

/** Blurred placeholder for an encrypted value the user hasn't revealed yet. */
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
        className={cn(
          "font-display font-extrabold tabular-nums text-muted-foreground/60 [filter:blur(6px)] select-none",
          sizes[size],
        )}
        aria-hidden
      >
        {placeholder}
      </span>
    </span>
  );
}
