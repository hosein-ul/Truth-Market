import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

// Seeds markets whose `oracle` is the UmaResolver — these are the markets that
// will be resolved via UMA's real Optimistic Oracle V3 on Sepolia, not by a
// trusted EOA. The frontend tells the two kinds apart on-chain: a market's
// `oracle` field equals the UmaResolver address iff it's UMA-resolved.
async function main() {
  const dir = path.join(__dirname, "..", "deployments", network.name);
  const addrs = JSON.parse(fs.readFileSync(path.join(dir, "addresses.json"), "utf8"));
  const umaDep = JSON.parse(fs.readFileSync(path.join(dir, "uma-resolver.json"), "utf8"));

  const factory = await ethers.getContractAt("MarketFactory", addrs.contracts.MarketFactory);
  const resolverAddr: string = umaDep.contracts.UmaResolver;

  const utc = (y: number, m: number, d: number, h = 23, min = 59) =>
    BigInt(Math.floor(Date.UTC(y, m - 1, d, h, min, 0) / 1000));

  const seeds = [
    {
      question: "Will Bitcoin close above $110,000 on June 30, 2026?",
      description:
        "Resolves YES if the daily close on Coinbase BTC-USD on 2026-06-30 (00:00 UTC settlement) is strictly greater than $110,000. Resolved via UMA Optimistic Oracle V3 — anyone can assert the outcome after the deadline by posting a bond.",
      category: "Crypto",
      deadline: utc(2026, 6, 30, 23, 59),
    },
    {
      question: "Will OpenAI announce a new flagship model before July 31, 2026?",
      description:
        "Resolves YES if OpenAI publicly announces a new flagship-tier model (successor to its current top model) on or before 2026-07-31. Resolved via UMA Optimistic Oracle V3.",
      category: "Other",
      deadline: utc(2026, 7, 31, 23, 59),
    },
    {
      question: "Will the US 10-year Treasury yield close below 4% on Aug 31, 2026?",
      description:
        "Resolves YES if the US 10-year Treasury constant maturity yield closes below 4.00% on 2026-08-31. Resolved via UMA Optimistic Oracle V3.",
      category: "Finance",
      deadline: utc(2026, 8, 31, 23, 59),
    },
  ];

  const created: { question: string; address: string; tx: string; deadline: string; oracle: string }[] = [];
  for (const s of seeds) {
    const tx = await factory.createMarket(resolverAddr, s.deadline, s.question, s.description, s.category);
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
    console.log(`created  ${marketAddr}  ${closeDate}  oracle=UmaResolver  ${s.question}`);
    created.push({ question: s.question, address: marketAddr, tx: tx.hash, deadline: closeDate, oracle: resolverAddr });
  }

  const out = path.join(dir, "uma-markets.json");
  fs.writeFileSync(out, JSON.stringify(created, null, 2));
  console.log(`\nsaved ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
