// All 30 prediction markets are now deployed on-chain (see
// deployments/sepolia/seed-30-markets.json), so no preview entries are
// needed. The markets feed is populated entirely from MarketFactory via
// getMarketSummaries().
//
// If you ever want to preview new markets BEFORE deploying them, push
// entries here (see git history for the previous template) — but for now
// we keep this empty so the UI never shows un-deployed placeholders.

import type { MarketSummary } from "./markets";

export const STATIC_MARKETS: MarketSummary[] = [];

export const STATIC_MARKET_ADDRESSES = new Set<string>();
