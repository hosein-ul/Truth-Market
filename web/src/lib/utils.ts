import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pct(part: bigint, total: bigint, digits = 1): number {
  if (total === 0n) return 0;
  return Number((part * 10000n) / total) / 100;
}

/** Compact USD-style volume formatting: 1.2K, 3.4M */
export function compactUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
