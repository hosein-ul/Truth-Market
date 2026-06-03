export const USDC_DECIMALS = 6;

export function formatUSDC(raw: bigint | number, opts?: { decimals?: number }): string {
  const dec = opts?.decimals ?? 2;
  const n = typeof raw === "bigint" ? raw : BigInt(raw);
  const denom = 10n ** BigInt(USDC_DECIMALS);
  const whole = n / denom;
  const frac = n % denom;
  const fracStr = (frac + denom).toString().slice(1, 1 + dec); // padded
  const wholeStr = whole.toLocaleString("en-US");
  return dec > 0 ? `${wholeStr}.${fracStr}` : wholeStr;
}

export function parseUSDC(input: string): bigint {
  const clean = input.replace(/[, ]/g, "").trim();
  if (!clean) return 0n;
  const [whole = "0", frac = ""] = clean.split(".");
  const fracPadded = (frac + "0".repeat(USDC_DECIMALS)).slice(0, USDC_DECIMALS);
  return BigInt(whole) * 10n ** BigInt(USDC_DECIMALS) + BigInt(fracPadded || "0");
}

export function shortAddr(addr: string | undefined): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function countdown(deadlineSec: number, nowSec: number): string {
  let diff = deadlineSec - nowSec;
  if (diff <= 0) return "expired";
  const d = Math.floor(diff / 86400);
  diff -= d * 86400;
  const h = Math.floor(diff / 3600);
  diff -= h * 3600;
  const m = Math.floor(diff / 60);
  const s = diff - m * 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export function formatHandle(handle: string | undefined): string {
  if (!handle) return "0x0000…0000";
  return `${handle.slice(0, 6)}…${handle.slice(-4)}`;
}
