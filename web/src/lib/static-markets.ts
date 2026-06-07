// 30 preview markets shown in the UI before on-chain deployment.
// Once seed-30-markets.ts is run on Sepolia, replace the fake addresses below
// with the real ones from deployments/sepolia/seed-30-markets.json and remove
// those entries from this array (on-chain markets automatically take precedence).

import type { MarketSummary } from "./markets";

const utc = (y: number, mo: number, d: number, h = 23, min = 59) =>
  Math.floor(Date.UTC(y, mo - 1, d, h, min, 0) / 1000);

// Sequential deterministic addresses for preview markets.
// These never collide with real Ethereum addresses (too low entropy).
const a = (n: number): `0x${string}` =>
  `0x${n.toString(16).padStart(40, "0")}` as `0x${string}`;

const Z = `0x${"0".repeat(40)}` as `0x${string}`;

function mk(
  n: number,
  question: string,
  category: string,
  deadline: number,
): MarketSummary {
  return {
    address: a(n),
    creator: Z,
    oracle: Z,
    deadline,
    question,
    category,
    status: 0, // Open
    yesPoolSnapshot: 0n,
    noPoolSnapshot: 0n,
    yesPoolHandle: Z,
    noPoolHandle: Z,
    yesPoolFinal: 0n,
    noPoolFinal: 0n,
    outcomeYes: false,
    betCount: 0,
    lastSnapshotBetCount: 0,
    snapshotBatchK: 3,
    hasUnsnappedBets: false,
  };
}

export const STATIC_MARKETS: MarketSummary[] = [
  // ── Crypto (8) ──────────────────────────────────────────────────────────────
  mk(1,  "Will Bitcoin hit $150,000 before 2027?",                                "Crypto",   utc(2026, 12, 31)),
  mk(2,  "Will Ethereum reach $10,000 in 2026?",                                  "Crypto",   utc(2026, 12, 31)),
  mk(3,  "Will Solana flip Ethereum by market cap in 2026?",                      "Crypto",   utc(2026, 12, 31)),
  mk(4,  "Will a spot ETH ETF see $1B daily inflow in 2026?",                     "Crypto",   utc(2026,  9, 30)),
  mk(5,  "Will Bitcoin dominance drop below 40% in 2026?",                        "Crypto",   utc(2026, 12, 31)),
  mk(6,  "Will Coinbase be listed on the S&P 500 by end of 2026?",                "Crypto",   utc(2026, 12, 31)),
  mk(7,  "Will the total crypto market cap exceed $10 trillion in 2026?",         "Crypto",   utc(2026, 12, 31)),
  mk(8,  "Will a major central bank hold Bitcoin on its balance sheet by 2027?",  "Crypto",   utc(2027,  1, 31)),

  // ── Politics (7) ────────────────────────────────────────────────────────────
  mk(9,  "Will Donald Trump be impeached before 2027?",                           "Politics", utc(2026, 12, 31)),
  mk(10, "Will Gavin Newsom win the 2028 Democratic presidential nomination?",    "Politics", utc(2027, 12, 31)),
  mk(11, "Will the US-Iran nuclear deal be signed by end of 2026?",               "Politics", utc(2026, 12, 31)),
  mk(12, "Will there be a US federal government shutdown in 2026?",               "Politics", utc(2026, 12, 31)),
  mk(13, "Will Emmanuel Macron resign before end of 2026?",                       "Politics", utc(2026, 12, 31)),
  mk(14, "Will the UK rejoin the EU single market by 2028?",                      "Politics", utc(2028,  1,  1, 0, 0)),
  mk(15, "Will Elon Musk leave a US government role before 2027?",                "Politics", utc(2026, 12, 31)),

  // ── Sports (6) ──────────────────────────────────────────────────────────────
  mk(16, "Will Real Madrid win the 2026 UEFA Champions League?",                  "Sports",   utc(2026,  9,  1)),
  mk(17, "Will the 2026 FIFA World Cup be won by Brazil?",                        "Sports",   utc(2026,  7, 19)),
  mk(18, "Will Novak Djokovic win another Grand Slam in 2026?",                   "Sports",   utc(2026, 12, 31)),
  mk(19, "Will the New York Knicks win the 2026-27 NBA Championship?",            "Sports",   utc(2027,  6, 30)),
  mk(20, "Will Jon Jones vs. Tom Aspinall fight happen in 2026?",                 "Sports",   utc(2026, 12, 31)),
  mk(21, "Will Formula 1 have a new World Champion in 2026?",                     "Sports",   utc(2026, 11, 30)),

  // ── Science & Tech (4) ──────────────────────────────────────────────────────
  mk(22, "Will OpenAI release GPT-5 before end of 2026?",                         "Science",  utc(2026, 12, 31)),
  mk(23, "Will AGI be declared by any major lab before 2027?",                    "Science",  utc(2026, 12, 31)),
  mk(24, "Will a human-rated commercial space station be operational by 2028?",   "Science",  utc(2028,  1,  1, 0, 0)),
  mk(25, "Will Apple release an AI chip beating Nvidia H100 performance by 2027?","Science",  utc(2027,  6, 30)),

  // ── Finance (3) ─────────────────────────────────────────────────────────────
  mk(26, "Will the US Federal Reserve cut rates 3+ times in 2026?",               "Finance",  utc(2026, 12, 31)),
  mk(27, "Will US inflation fall below 2% by Q4 2026?",                           "Finance",  utc(2026, 12, 31)),
  mk(28, "Will gold hit $4,000/oz in 2026?",                                      "Finance",  utc(2026, 12, 31)),

  // ── Other (2) ───────────────────────────────────────────────────────────────
  mk(29, "Will GTA VI be released before end of 2026?",                           "Other",    utc(2026, 12, 31)),
  mk(30, "Will Taylor Swift announce a 2027 world tour?",                         "Other",    utc(2026, 12, 31)),
];

/** Set of lowercase addresses for O(1) static-market detection. */
export const STATIC_MARKET_ADDRESSES = new Set(
  STATIC_MARKETS.map((m) => m.address.toLowerCase()),
);
