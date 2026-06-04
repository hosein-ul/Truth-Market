// End-to-end smoke test of the live Sepolia deployment.
//  1. Mint the official underlying USDC to the deployer
//  2. Approve the market to pull USDC
//  3. placeBet(amount, side) — amount + side are public (live odds),
//     the contract wraps to cUSDC internally and accumulates an encrypted
//     per-user stake.
//
// Anything past `placeBet` (resolve / claim) needs the deadline, so it's
// exercised in the mock test suite, not here.

import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const dir = path.join(__dirname, "..", "deployments", network.name);
  const addrs = JSON.parse(fs.readFileSync(path.join(dir, "addresses.json"), "utf8"));
  const demos = JSON.parse(fs.readFileSync(path.join(dir, "demo-markets.json"), "utf8"));

  const [signer] = await ethers.getSigners();
  const usdc = await ethers.getContractAt("ERC20Mintable", addrs.contracts.underlyingUSDC, signer);

  // A few bets across the demo markets so odds render on the live site.
  const bets: { market: string; amount: bigint; side: boolean; label: string }[] = [
    { market: demos[0].address, amount: 60_000_000n, side: true,  label: "YES 60" },
    { market: demos[0].address, amount: 40_000_000n, side: false, label: "NO 40" },
    { market: demos[1].address, amount: 30_000_000n, side: false, label: "NO 30" },
    { market: demos[1].address, amount: 20_000_000n, side: true,  label: "YES 20" },
    { market: demos[2].address, amount: 50_000_000n, side: true,  label: "YES 50" },
  ];

  const total = bets.reduce((s, b) => s + b.amount, 0n);
  console.log(`[1] mint ${total / 1_000_000n} USDC`);
  await (await usdc.mint(signer.address, total)).wait();

  for (const b of bets) {
    console.log(`[bet] ${b.label} on ${b.market}`);
    await (await usdc.approve(b.market, b.amount)).wait();
    const m = await ethers.getContractAt("ConfidentialMarket", b.market, signer);
    const tx = await (m as any).placeBet(b.amount, b.side);
    const r = await tx.wait();
    console.log(`      ok in block ${r!.blockNumber}`);
  }

  // Show resulting public odds.
  console.log("\nResulting odds:");
  for (const d of demos) {
    const m = await ethers.getContractAt("ConfidentialMarket", d.address, signer);
    const yes = await (m as any).yesPool();
    const no = await (m as any).noPool();
    const bps = await (m as any).yesProbabilityBps();
    console.log(`  ${d.address}  YES ${yes / 1_000_000n} / NO ${no / 1_000_000n}  → ${Number(bps) / 100}% YES`);
  }

  console.log("\nLive Sepolia bets placed — public odds, private positions.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
