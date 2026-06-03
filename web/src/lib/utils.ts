export function cn(...classes: (string | undefined | null | false | 0)[]) {
  return classes.filter(Boolean).join(" ");
}

export function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223;
    return (s >>> 0) / 4294967295;
  };
}

export function pct(part: bigint, total: bigint, digits = 1): string {
  if (total === 0n) return "0";
  return (Number((part * 10000n) / total) / 100).toFixed(digits);
}
