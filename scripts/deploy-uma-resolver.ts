import { ethers, network, run } from "hardhat";
import fs from "fs";
import path from "path";
import { UMA_SEPOLIA, UMA_RESOLVER_DEFAULTS } from "../config/uma";

// Deploys the UmaResolver — the UMA Optimistic Oracle V3 adapter that resolves
// TruthMarket markets. It is fed ONLY the UMA Finder; the live OOV3 and its
// default bond currency are read from the Finder inside the constructor (never
// hardcoded), so the resolver tracks UMA upgrades automatically.
//
//   UMA_LIVENESS  (seconds) — dispute window. Defaults to 120 for testnet demos.
//   UMA_BOND      (base units of the default currency) — bond floor. Defaults to
//                 0, i.e. fall back to the live OOV3 minimum bond.
//
// Usage:
//   npx hardhat run scripts/deploy-uma-resolver.ts --network sepolia
async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  console.log(`network : ${network.name} (chainId ${chainId})`);
  console.log(`deployer: ${deployer.address}`);
  console.log(`balance : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  if (chainId !== 11155111) {
    throw new Error(
      `UmaResolver targets the REAL UMA OOV3 deployment on Sepolia (chainId 11155111). ` +
        `Current chainId is ${chainId}. Run with --network sepolia.`,
    );
  }

  const finder = UMA_SEPOLIA.finder;
  const liveness = Number(process.env.UMA_LIVENESS ?? UMA_RESOLVER_DEFAULTS.livenessSeconds);
  const bondAmount = BigInt(process.env.UMA_BOND ?? UMA_RESOLVER_DEFAULTS.bondAmount.toString());

  console.log("UMA wiring:");
  console.log(`  Finder            : ${finder}  (stable entry point)`);
  console.log(`  liveness          : ${liveness}s`);
  console.log(`  bond floor        : ${bondAmount} (0 ⇒ use OOV3 minimum)\n`);

  console.log("Deploying UmaResolver...");
  const UmaResolver = await ethers.getContractFactory("UmaResolver");
  const resolver = await UmaResolver.deploy(finder, liveness, bondAmount);
  await resolver.waitForDeployment();
  const resolverAddr = await resolver.getAddress();
  console.log(`  UmaResolver       : ${resolverAddr}  tx=${resolver.deploymentTransaction()?.hash}\n`);

  // Echo what the constructor resolved from the Finder so the wiring is auditable.
  const oo = await resolver.oo();
  const currency = await resolver.currency();
  const effectiveBond = await resolver.effectiveBond();
  const onchainLiveness = await resolver.liveness();
  console.log("Resolved from Finder / OOV3:");
  console.log(`  OptimisticOracleV3: ${oo}`);
  console.log(`  bond currency     : ${currency}`);
  console.log(`  effective bond    : ${effectiveBond} (base units)`);
  console.log(`  liveness          : ${onchainLiveness}s`);
  if (oo.toLowerCase() !== UMA_SEPOLIA.optimisticOracleV3.toLowerCase()) {
    console.log(
      `  note: live OOV3 (${oo}) differs from the address recorded in config/uma.ts ` +
        `(${UMA_SEPOLIA.optimisticOracleV3}). The on-chain value from the Finder is authoritative.`,
    );
  }

  const outDir = path.join(__dirname, "..", "deployments", network.name);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "uma-resolver.json");
  const out = {
    network: network.name,
    chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      UmaResolver: resolverAddr,
      finder,
      optimisticOracleV3: oo,
      bondCurrency: currency,
    },
    params: {
      liveness: Number(onchainLiveness),
      bondFloor: bondAmount.toString(),
      effectiveBond: effectiveBond.toString(),
    },
    note:
      "UmaResolver is the UMA OOV3 adapter. Pass its address as the `oracle` when " +
      "calling MarketFactory.createMarket() to have markets resolved via UMA.",
  };
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log(`\nsaved to deployments/${network.name}/uma-resolver.json`);

  console.log("\n─────────────────────────────────────────────");
  console.log("  UmaResolver deployed");
  console.log("─────────────────────────────────────────────");
  console.log(`  UmaResolver       : ${resolverAddr}`);
  console.log("  use as `oracle` in MarketFactory.createMarket(oracle, ...)");
  console.log("─────────────────────────────────────────────");

  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\nVerifying UmaResolver on Etherscan...");
    await new Promise((r) => setTimeout(r, 20_000));
    try {
      await run("verify:verify", {
        address: resolverAddr,
        constructorArguments: [finder, liveness, bondAmount],
      });
      console.log("  verified UmaResolver");
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
