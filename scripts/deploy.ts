import { ethers, network, run } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log(`network : ${network.name} (chainId ${(await ethers.provider.getNetwork()).chainId})`);
  console.log(`deployer: ${deployer.address}`);
  console.log(`balance : ${ethers.formatEther(bal)} ETH\n`);

  console.log("[1/3] MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();
  console.log(`      ${usdcAddr}  tx=${usdc.deploymentTransaction()?.hash}`);

  console.log("[2/3] ConfidentialUSDC...");
  const ConfidentialUSDC = await ethers.getContractFactory("ConfidentialUSDC");
  const cusdc = await ConfidentialUSDC.deploy(usdcAddr);
  await cusdc.waitForDeployment();
  const cusdcAddr = await cusdc.getAddress();
  console.log(`      ${cusdcAddr}  tx=${cusdc.deploymentTransaction()?.hash}`);

  console.log("[3/3] MarketFactory...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const factory = await MarketFactory.deploy(cusdcAddr);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log(`      ${factoryAddr}  tx=${factory.deploymentTransaction()?.hash}`);

  const out = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      MockUSDC: usdcAddr,
      ConfidentialUSDC: cusdcAddr,
      MarketFactory: factoryAddr,
    },
  };
  const outDir = path.join(__dirname, "..", "deployments", network.name);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "addresses.json"), JSON.stringify(out, null, 2));

  console.log("\n─────────────────────────────────────────────");
  console.log("  TruthMarket deployed");
  console.log("─────────────────────────────────────────────");
  console.log(`  MockUSDC          : ${usdcAddr}`);
  console.log(`  ConfidentialUSDC  : ${cusdcAddr}`);
  console.log(`  MarketFactory     : ${factoryAddr}`);
  console.log("─────────────────────────────────────────────");
  console.log(`  saved to deployments/${network.name}/addresses.json`);

  // Verify on Etherscan (best-effort)
  if (network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    console.log("\nVerifying on Etherscan (this may take ~1 min)...");
    // Wait a few blocks for indexing
    await new Promise((r) => setTimeout(r, 30_000));
    for (const [name, addr, args] of [
      ["MockUSDC", usdcAddr, []],
      ["ConfidentialUSDC", cusdcAddr, [usdcAddr]],
      ["MarketFactory", factoryAddr, [cusdcAddr]],
    ] as const) {
      try {
        await run("verify:verify", { address: addr, constructorArguments: args });
        console.log(`  verified ${name}`);
      } catch (e: any) {
        const msg = String(e.message ?? e);
        if (msg.toLowerCase().includes("already verified")) console.log(`  already verified ${name}`);
        else console.log(`  verify ${name} skipped: ${msg.split("\n")[0]}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
