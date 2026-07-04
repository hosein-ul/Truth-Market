// Category styling shared by market surfaces.
//
// Covers are GENERATED, not fetched: see components/MarketCover.tsx — a
// deterministic per-address SVG in the Zama palette. (The previous Unsplash
// photo map repeated the same handful of photo IDs across unrelated markets
// and depended on an external host behind our COEP headers; it's gone.)

export type MarketCategory =
  | "Crypto"
  | "Politics"
  | "Sports"
  | "Science"
  | "Finance"
  | "Other";

/** Fallback gradient per category (used where a flat backdrop is enough). */
export const CATEGORY_GRADIENTS: Record<string, string> = {
  Crypto: "from-zama-300 to-zama-500",
  Politics: "from-zinc-200 to-zinc-400",
  Sports: "from-zama-200 to-zama-400",
  Science: "from-zinc-100 to-zama-300",
  Finance: "from-zama-400 to-zama-600",
  Other: "from-zinc-200 to-zinc-300",
};
