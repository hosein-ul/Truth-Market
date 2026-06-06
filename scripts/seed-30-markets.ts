// Seeds 30 Polymarket-inspired markets on the live factory.
// Run with:
//   npx hardhat run scripts/seed-30-markets.ts --network sepolia
//
// Requires PRIVATE_KEY in .env and factory address in
// deployments/sepolia/addresses.json.

import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const file = path.join(__dirname, "..", "deployments", network.name, "addresses.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const factory = await ethers.getContractAt("MarketFactory", data.contracts.MarketFactory);
  const [signer] = await ethers.getSigners();

  const utc = (y: number, m: number, d: number, h = 23, min = 59) =>
    BigInt(Math.floor(Date.UTC(y, m - 1, d, h, min, 0) / 1000));

  const seeds = [
    // ── Crypto (8) ──────────────────────────────────────────────────────────
    {
      question: "Will Bitcoin hit $150,000 before 2027?",
      description:
        "Resolves YES if BTC-USD on any major CEX (Coinbase, Binance, or Kraken) closes at or above $150,000 on any calendar day before January 1, 2027.",
      category: "Crypto",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will Ethereum reach $10,000 in 2026?",
      description:
        "Resolves YES if ETH-USD on Coinbase closes at or above $10,000 on any calendar day in 2026.",
      category: "Crypto",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will Solana flip Ethereum by market cap in 2026?",
      description:
        "Resolves YES if CoinGecko-reported SOL market cap exceeds ETH market cap on any day before December 31, 2026.",
      category: "Crypto",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will a spot ETH ETF see $1B daily inflow in 2026?",
      description:
        "Resolves YES if any single US-listed spot Ethereum ETF records net daily inflows of $1 billion USD or more on any trading day before September 30, 2026.",
      category: "Crypto",
      deadline: utc(2026, 9, 30),
    },
    {
      question: "Will Bitcoin dominance drop below 40% in 2026?",
      description:
        "Resolves YES if CoinGecko Bitcoin dominance (BTC.D) falls below 40% at any point before December 31, 2026.",
      category: "Crypto",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will Coinbase be listed on the S&P 500 by end of 2026?",
      description:
        "Resolves YES if COIN is added to the S&P 500 index (announced and effective) on or before December 31, 2026.",
      category: "Crypto",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will the total crypto market cap exceed $10 trillion in 2026?",
      description:
        "Resolves YES if CoinGecko total crypto market cap reaches $10 trillion USD at any point before December 31, 2026.",
      category: "Crypto",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will a major central bank hold Bitcoin on its balance sheet by 2027?",
      description:
        "Resolves YES if any G20 central bank officially discloses Bitcoin holdings on its balance sheet before February 1, 2027.",
      category: "Crypto",
      deadline: utc(2027, 1, 31),
    },

    // ── Politics (7) ─────────────────────────────────────────────────────────
    {
      question: "Will Donald Trump be impeached before 2027?",
      description:
        "Resolves YES if the US House of Representatives passes articles of impeachment against Donald Trump before January 1, 2027.",
      category: "Politics",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will Gavin Newsom win the 2028 Democratic presidential nomination?",
      description:
        "Resolves YES if Gavin Newsom wins enough delegates to secure the Democratic Party presidential nomination before the 2028 convention.",
      category: "Politics",
      deadline: utc(2027, 12, 31),
    },
    {
      question: "Will the US-Iran nuclear deal be signed by end of 2026?",
      description:
        "Resolves YES if the United States and Iran formally sign a nuclear agreement reducing Iran's nuclear program before January 1, 2027.",
      category: "Politics",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will there be a US federal government shutdown in 2026?",
      description:
        "Resolves YES if the US federal government enters an official funding lapse causing non-essential operations to cease for at least 1 day during calendar year 2026.",
      category: "Politics",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will Emmanuel Macron resign before end of 2026?",
      description:
        "Resolves YES if Emmanuel Macron officially resigns as President of France before January 1, 2027.",
      category: "Politics",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will the UK rejoin the EU single market by 2028?",
      description:
        "Resolves YES if the United Kingdom formally rejoins the European Union single market (including freedom of movement of goods and services) before January 1, 2028.",
      category: "Politics",
      deadline: utc(2028, 1, 1, 0, 0),
    },
    {
      question: "Will Elon Musk leave a US government role before 2027?",
      description:
        "Resolves YES if Elon Musk publicly departs from any formal or informal advisory role in the US federal government before January 1, 2027.",
      category: "Politics",
      deadline: utc(2026, 12, 31),
    },

    // ── Sports (6) ──────────────────────────────────────────────────────────
    {
      question: "Will Real Madrid win the 2026 UEFA Champions League?",
      description:
        "Resolves YES if Real Madrid CF wins the 2025/26 UEFA Champions League final. Deadline set to September 2026 to allow for post-tournament confirmation.",
      category: "Sports",
      deadline: utc(2026, 9, 1),
    },
    {
      question: "Will the 2026 FIFA World Cup be won by Brazil?",
      description:
        "Resolves YES if the Brazil national football team wins the 2026 FIFA World Cup final held across the United States, Canada, and Mexico.",
      category: "Sports",
      deadline: utc(2026, 7, 19),
    },
    {
      question: "Will Novak Djokovic win another Grand Slam in 2026?",
      description:
        "Resolves YES if Novak Djokovic wins the singles title at the Australian Open, French Open, Wimbledon, or US Open in 2026.",
      category: "Sports",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will the New York Knicks win the 2026-27 NBA Championship?",
      description:
        "Resolves YES if the New York Knicks win the NBA Finals at the conclusion of the 2026-27 season.",
      category: "Sports",
      deadline: utc(2027, 6, 30),
    },
    {
      question: "Will Jon Jones vs. Tom Aspinall fight happen in 2026?",
      description:
        "Resolves YES if Jon Jones and Tom Aspinall are officially confirmed to fight and the bout takes place before January 1, 2027.",
      category: "Sports",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will Formula 1 have a new World Champion in 2026?",
      description:
        "Resolves YES if the 2026 Formula 1 Drivers' World Championship is won by a driver who has never previously won the championship.",
      category: "Sports",
      deadline: utc(2026, 11, 30),
    },

    // ── Science & Tech (4) ──────────────────────────────────────────────────
    {
      question: "Will OpenAI release GPT-5 before end of 2026?",
      description:
        "Resolves YES if OpenAI publicly releases a model officially named or branded 'GPT-5' to the general public (not just API preview) before January 1, 2027.",
      category: "Science",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will AGI be declared by any major lab before 2027?",
      description:
        "Resolves YES if OpenAI, DeepMind, Anthropic, or Meta publicly declares they have achieved Artificial General Intelligence before January 1, 2027.",
      category: "Science",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will a human-rated commercial space station be operational by 2028?",
      description:
        "Resolves YES if any commercial space station (Axiom, Starlab, etc.) is certified for crewed operations and has hosted at least one human before January 1, 2028.",
      category: "Science",
      deadline: utc(2028, 1, 1, 0, 0),
    },
    {
      question: "Will Apple release an AI chip beating Nvidia H100 performance by 2027?",
      description:
        "Resolves YES if Apple announces and ships a chip achieving higher performance than the Nvidia H100 on a standard AI benchmark (MLPerf or equivalent) before July 1, 2027.",
      category: "Science",
      deadline: utc(2027, 6, 30),
    },

    // ── Finance (3) ──────────────────────────────────────────────────────────
    {
      question: "Will the US Federal Reserve cut rates 3+ times in 2026?",
      description:
        "Resolves YES if the FOMC announces three or more separate federal funds rate cuts during calendar year 2026.",
      category: "Finance",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will US inflation fall below 2% by Q4 2026?",
      description:
        "Resolves YES if the US Bureau of Labor Statistics reports a year-over-year CPI headline rate below 2.0% for any month in Q4 2026 (October, November, or December).",
      category: "Finance",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will gold hit $4,000/oz in 2026?",
      description:
        "Resolves YES if the LBMA gold spot price reaches $4,000 per troy ounce or higher at any point during calendar year 2026.",
      category: "Finance",
      deadline: utc(2026, 12, 31),
    },

    // ── Other (2) ────────────────────────────────────────────────────────────
    {
      question: "Will GTA VI be released before end of 2026?",
      description:
        "Resolves YES if Rockstar Games officially releases Grand Theft Auto VI to the public (any platform) before January 1, 2027.",
      category: "Other",
      deadline: utc(2026, 12, 31),
    },
    {
      question: "Will Taylor Swift announce a 2027 world tour?",
      description:
        "Resolves YES if Taylor Swift makes a public announcement of a world tour with dates in 2027 before January 1, 2027.",
      category: "Other",
      deadline: utc(2026, 12, 31),
    },
  ];

  const created: {
    question: string;
    address: string;
    tx: string;
    deadline: string;
    category: string;
  }[] = [];

  for (const s of seeds) {
    const tx = await factory.createMarket(
      signer.address,
      s.deadline,
      s.question,
      s.description,
      s.category,
    );
    const receipt = await tx.wait();
    const evt = receipt!.logs
      .map((l: any) => {
        try {
          return factory.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((p: any) => p && p.name === "MarketCreated");
    const marketAddr: string = evt!.args.market;
    const closeDate = new Date(Number(s.deadline) * 1000).toISOString();
    console.log(`created  ${marketAddr}  ${closeDate}  [${s.category}]  ${s.question}`);
    created.push({
      question: s.question,
      address: marketAddr,
      tx: tx.hash,
      deadline: closeDate,
      category: s.category,
    });
  }

  const out = path.join(
    __dirname,
    "..",
    "deployments",
    network.name,
    "seed-30-markets.json",
  );
  fs.writeFileSync(out, JSON.stringify(created, null, 2));
  console.log(`\nsaved ${out}`);
  console.log(
    `\nNext: copy addresses from seed-30-markets.json into web/src/lib/market-metadata.ts → MARKET_META for rich cover images.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
