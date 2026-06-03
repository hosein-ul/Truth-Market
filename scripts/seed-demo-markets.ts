import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

// Creates a small set of demo markets on the live deployment so the UI has
// something to render. The deployer doubles as oracle for these markets.
async function main() {
  const file = path.join(__dirname, "..", "deployments", network.name, "addresses.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const factory = await ethers.getContractAt("MarketFactory", data.contracts.MarketFactory);
  const [signer] = await ethers.getSigners();

  const now = Math.floor(Date.now() / 1000);
  const days = (n: number) => BigInt(now + n * 86400);

  const seeds = [
    {
      question: "Will BTC close above $200k on 2026-12-31?",
      description:
        "Resolves YES if the daily close on Coinbase BTC-USD on Dec 31 2026 (UTC) is greater than $200,000.",
      category: "Crypto",
      deadline: days(180),
    },
    {
      question: "Will SpaceX land humans on Mars before 2027?",
      description: "Resolves YES if a crewed SpaceX vehicle has touched down on Mars by Jan 1 2027 (UTC).",
      category: "Science",
      deadline: days(365),
    },
    {
      question: "Will ETH/BTC ratio exceed 0.10 within 30 days?",
      description: "Resolves YES if the ETH/BTC ratio on Binance closes above 0.10 on any UTC day within 30 days.",
      category: "Crypto",
      deadline: days(30),
    },
  ];

  const created: { question: string; address: string; tx: string }[] = [];
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
    console.log(`created  ${marketAddr}  ${s.question}`);
    created.push({ question: s.question, address: marketAddr, tx: tx.hash });
  }

  const out = path.join(__dirname, "..", "deployments", network.name, "demo-markets.json");
  fs.writeFileSync(out, JSON.stringify(created, null, 2));
  console.log(`\nsaved ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
