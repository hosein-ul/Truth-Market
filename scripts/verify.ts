import fs from "fs";
import path from "path";
import { network, run } from "hardhat";

async function main() {
  const file = path.join(__dirname, "..", "deployments", network.name, "addresses.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const { MockUSDC, ConfidentialUSDC, MarketFactory } = data.contracts;

  const targets: [string, string, any[]][] = [
    ["MockUSDC", MockUSDC, []],
    ["ConfidentialUSDC", ConfidentialUSDC, [MockUSDC]],
    ["MarketFactory", MarketFactory, [ConfidentialUSDC]],
  ];

  for (const [name, addr, args] of targets) {
    try {
      await run("verify:verify", { address: addr, constructorArguments: args });
      console.log(`verified ${name}`);
    } catch (e: any) {
      const msg = String(e.message ?? e);
      if (msg.toLowerCase().includes("already verified")) console.log(`already verified ${name}`);
      else console.log(`${name}: ${msg.split("\n")[0]}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
