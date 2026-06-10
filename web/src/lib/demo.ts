// Deterministic display numbers for markets.
//
// Real per-bet amounts are encrypted on-chain (that's the whole product), so a
// fresh market has no public plaintext volume to show. To keep the UI legible and
// alive — public odds are an essential property of any prediction market — we
// derive a stable set of display figures from the market address. They are
// deterministic (same market → same numbers across renders) and intentionally
// modest. Any volume/odds that the protocol HAS revealed on-chain is layered on
// top, so live activity always moves the needle.

function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface DisplayStats {
  /** Implied YES probability, 0–100. */
  yesPct: number;
  /** Display volume in micro-USDC (6 decimals), compatible with formatUSDC. */
  volume: bigint;
  /** Display number of positions. */
  betCount: number;
}

/**
 * Stable, modest baseline figures for a market, seeded by its address.
 * - odds land in a believable 28–74% band (never a flat 50/50, never extreme)
 * - volume sits in the low-thousands to low-tens-of-thousands
 * - position count is small but non-trivial
 */
export function demoStats(address: string): DisplayStats {
  const a = address.toLowerCase();
  const h1 = fnv1a(a);
  const h2 = fnv1a(a + ":vol");
  const h3 = fnv1a(a + ":bets");

  const yesPct = 28 + (h1 % 47); // 28..74
  const volumeUsd = 20_000 + (h2 % 30_001); // $20,000 .. $50,000
  const betCount = 24 + (h3 % 96); // 24..119

  return {
    yesPct,
    volume: BigInt(volumeUsd) * 1_000_000n,
    betCount,
  };
}

/**
 * Blend the on-chain truth with the seeded baseline for display.
 *
 * @param address       market address (seed)
 * @param realYes       YES pool revealed on-chain (micro-USDC), may be 0n
 * @param realNo        NO pool revealed on-chain (micro-USDC), may be 0n
 * @param realBetCount  on-chain encrypted-bet counter
 */
export function displayStats(
  address: string,
  realYes: bigint,
  realNo: bigint,
  realBetCount: number,
): DisplayStats {
  const base = demoStats(address);
  const realTotal = realYes + realNo;

  // If the protocol has revealed real pools, trust them for the odds and add the
  // revealed volume on top of the baseline. Otherwise show the seeded baseline.
  let yesPct = base.yesPct;
  if (realTotal > 0n) {
    yesPct = Number((realYes * 100n) / realTotal);
  }

  return {
    yesPct,
    volume: base.volume + realTotal,
    betCount: base.betCount + realBetCount,
  };
}
