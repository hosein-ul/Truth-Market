import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

// Seeds the live factory with a small set of demo markets so the UI has
// something real to render. Deadlines are concrete calendar dates anchored to
// real-world events near the current date — not relative "+N days" stamps that
// drift stale. The deployer doubles as oracle for these markets.
async function main() {
  const file = path.join(__dirname, "..", "deployments", network.name, "addresses.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const factory = await ethers.getContractAt("MarketFactory", data.contracts.MarketFactory);
  const [signer] = await ethers.getSigners();

  // Fixed UTC calendar deadlines so what's shown to the user is the actual date
  // that appears in the question — not "X days from today".
  const utc = (y: number, m: number, d: number, h = 23, min = 59) =>
    BigInt(Math.floor(Date.UTC(y, m - 1, d, h, min, 0) / 1000));

  const seeds = [
    {
      question: "Will BTC close above $150,000 on June 30, 2026?",
      description:
        "Resolves YES if the daily close on Coinbase BTC-USD on 2026-06-30 (00:00 UTC settlement) is strictly greater than $150,000.",
      category: "Crypto",
      deadline: utc(2026, 6, 30, 23, 59),
    },
    {
      question: "Will the Fed cut rates at the July 30, 2026 FOMC meeting?",
      description:
        "Resolves YES if the Federal Reserve announces a target rate decrease at the FOMC meeting concluding on 2026-07-30.",
      category: "Finance",
      deadline: utc(2026, 7, 31, 23, 59),
    },
    {
      question: "Will SpaceX complete a crewed Starship orbital flight by Aug 31, 2026?",
      description:
        "Resolves YES if a Starship vehicle carrying at least one human reaches stable Earth orbit on or before 2026-08-31.",
      category: "Science",
      deadline: utc(2026, 8, 31, 23, 59),
    },
    {
      question: "Will Apple announce a foldable iPhone at the Sep 2026 event?",
      description:
        "Resolves YES if Apple officially announces a foldable-display iPhone product at any keynote held in September 2026.",
      category: "Other",
      deadline: utc(2026, 9, 30, 23, 59),
    },
    {
      question: "Will ETH/BTC ratio close above 0.06 on July 15, 2026?",
      description:
        "Resolves YES if the Binance ETH/BTC daily close on 2026-07-15 is strictly greater than 0.06.",
      category: "Crypto",
      deadline: utc(2026, 7, 15, 23, 59),
    },
    {
      question: "Will Manchester City win the 2026/27 Premier League title?",
      description:
        "Resolves YES if Manchester City finish the 2026/27 Premier League season in first place.",
      category: "Sports",
      deadline: utc(2027, 5, 31, 23, 59),
    },
  ];

  const created: { question: string; address: string; tx: string; deadline: string }[] = [];
  for (const s of seeds) {
    const tx = await factory.createMarket(signer.address, s.deadline, s.question, s.description, s.category);
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
    console.log(`created  ${marketAddr}  ${closeDate}  ${s.question}`);
    created.push({ question: s.question, address: marketAddr, tx: tx.hash, deadline: closeDate });
  }

  const out = path.join(__dirname, "..", "deployments", network.name, "demo-markets.json");
  fs.writeFileSync(out, JSON.stringify(created, null, 2));
  console.log(`\nsaved ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
