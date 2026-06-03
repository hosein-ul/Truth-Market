import fs from "fs";
import path from "path";
import { network, run } from "hardhat";

// Verifies our own deployed contract (MarketFactory). The token contracts on
// Sepolia are Zama's official tokens and are already verified.
async function main() {
  const file = path.join(__dirname, "..", "deployments", network.name, "addresses.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const { MarketFactory, confidentialUSDC } = data.contracts;

  try {
    await run("verify:verify", { address: MarketFactory, constructorArguments: [confidentialUSDC] });
    console.log("verified MarketFactory");
  } catch (e: any) {
    const msg = String(e.message ?? e);
    if (msg.toLowerCase().includes("already verified")) console.log("already verified MarketFactory");
    else console.log(`MarketFactory: ${msg.split("\n")[0]}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
