import { ethers, network, run } from "hardhat";
import fs from "fs";
import path from "path";
import { ZAMA_SEPOLIA } from "../config/zama";

// Deploys the TruthMarket protocol.
//   - On Sepolia: only MarketFactory is deployed, wired to Zama's OFFICIAL
//     confidential USDC wrapper. No tokens are deployed by us.
//   - On a local/mock network: deploys mock token fixtures first (the official
//     Zama tokens only exist on Sepolia), then the factory.
async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  console.log(`network : ${network.name} (chainId ${chainId})`);
  console.log(`deployer: ${deployer.address}`);
  console.log(`balance : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const isSepolia = chainId === 11155111;

  let underlyingUSDC: string;
  let confidentialUSDC: string;

  if (isSepolia) {
    underlyingUSDC = ZAMA_SEPOLIA.underlyingUSDC;
    confidentialUSDC = ZAMA_SEPOLIA.confidentialUSDC;
    console.log("Using Zama official tokens on Sepolia:");
    console.log(`  underlying USDC  : ${underlyingUSDC}`);
    console.log(`  confidential USDC: ${confidentialUSDC} (cUSDCMock)\n`);
  } else {
    console.log("Local network — deploying mock token fixtures...");
    const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
    const usdc = await ERC20Mintable.deploy();
    await usdc.waitForDeployment();
    underlyingUSDC = await usdc.getAddress();
    console.log(`  underlying USDC  : ${underlyingUSDC}`);

    const Wrapper = await ethers.getContractFactory("ConfidentialWrapperMock");
    const cusdc = await Wrapper.deploy(underlyingUSDC);
    await cusdc.waitForDeployment();
    confidentialUSDC = await cusdc.getAddress();
    console.log(`  confidential USDC: ${confidentialUSDC}\n`);
  }

  console.log("Deploying MarketFactory (v3 — encrypted bets only)...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const factory = await MarketFactory.deploy(confidentialUSDC);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log(`  MarketFactory    : ${factoryAddr}  tx=${factory.deploymentTransaction()?.hash}`);

  const out = {
    network: network.name,
    chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      underlyingUSDC,
      confidentialUSDC,
      MarketFactory: factoryAddr,
    },
    note: isSepolia
      ? "underlyingUSDC and confidentialUSDC are Zama official Sepolia tokens (not deployed by us)."
      : "all addresses are local mock fixtures.",
  };
  const outDir = path.join(__dirname, "..", "deployments", network.name);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "addresses.json"), JSON.stringify(out, null, 2));

  console.log("\n─────────────────────────────────────────────");
  console.log("  TruthMarket deployed");
  console.log("─────────────────────────────────────────────");
  console.log(`  underlying USDC   : ${underlyingUSDC}${isSepolia ? "  (Zama official)" : ""}`);
  console.log(`  confidential USDC : ${confidentialUSDC}${isSepolia ? "  (Zama official cUSDCMock)" : ""}`);
  console.log(`  MarketFactory     : ${factoryAddr}`);
  console.log("─────────────────────────────────────────────");
  console.log(`  saved to deployments/${network.name}/addresses.json`);

  if (isSepolia && process.env.ETHERSCAN_API_KEY) {
    console.log("\nVerifying MarketFactory on Etherscan...");
    await new Promise((r) => setTimeout(r, 20_000));
    try {
      await run("verify:verify", { address: factoryAddr, constructorArguments: [confidentialUSDC] });
      console.log("  verified MarketFactory");
    } catch (e: any) {
      const msg = String(e.message ?? e);
      if (msg.toLowerCase().includes("already verified")) console.log("  already verified");
      else console.log(`  verify skipped: ${msg.split("\n")[0]}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
