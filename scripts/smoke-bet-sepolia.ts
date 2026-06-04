// Live end-to-end smoke test on Sepolia:
//   1) Mint plain USDC (faucet) to the deployer for a one-time top-up.
//   2) Wrap into Zama's confidential cUSDC.
//   3) Set the market as cUSDC operator (one-time).
//   4) Place 3 ENCRYPTED bets on the first demo market.
//   5) refreshOdds() — K-anonymity gate opens after 3 bets — and fetch the
//      publicly-decrypted cleartext pool sizes through the relayer.
//
// Anything past `placeBet` (resolve/finalize/claim) needs the deadline window;
// that's covered by the mock test suite.

import { ethers, fhevm, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  await fhevm.initializeCLIApi();

  const dir = path.join(__dirname, "..", "deployments", network.name);
  const addrs = JSON.parse(fs.readFileSync(path.join(dir, "addresses.json"), "utf8"));
  const demos = JSON.parse(fs.readFileSync(path.join(dir, "demo-markets.json"), "utf8"));

  const [signer] = await ethers.getSigners();
  const u = signer.address;
  const usdc = await ethers.getContractAt("ERC20Mintable", addrs.contracts.underlyingUSDC, signer);
  const cusdc = await ethers.getContractAt("ConfidentialWrapperMock", addrs.contracts.confidentialUSDC, signer);

  const marketAddr: string = demos[0].address;
  const market = await ethers.getContractAt("ConfidentialMarket", marketAddr, signer);

  // ── 1) Top up: mint + wrap + setOperator (one-time per user) ────────────
  const TOPUP = 600_000_000n; // 600 USDC
  console.log(`[1/4] top up: mint ${TOPUP / 1_000_000n} USDC → wrap → cUSDC → setOperator(${marketAddr})`);
  await (await usdc.mint(u, TOPUP)).wait();
  await (await usdc.approve(addrs.contracts.confidentialUSDC, TOPUP)).wait();
  await (await (cusdc as any).wrap(u, TOPUP)).wait();
  const nowSec = Math.floor(Date.now() / 1000);
  await (await (cusdc as any).setOperator(marketAddr, nowSec + 30 * 86400)).wait();

  // ── 2) Place 3 ENCRYPTED bets ───────────────────────────────────────────
  const bets: { amount: bigint; yes: boolean; label: string }[] = [
    { amount: 150_000_000n, yes: true,  label: "YES 150" },
    { amount: 80_000_000n,  yes: false, label: "NO 80" },
    { amount: 100_000_000n, yes: true,  label: "YES 100" },
  ];
  console.log(`[2/4] placing ${bets.length} encrypted bets…`);
  for (const b of bets) {
    const enc = await fhevm.createEncryptedInput(marketAddr, u).add64(b.amount).addBool(b.yes).encrypt();
    const tx = await (market as any).placeBet(enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof);
    const r = await tx.wait();
    console.log(`      ${b.label} → block ${r!.blockNumber}`);
  }

  // ── 3) refreshOdds — K-anonymity gate (default K=3) opens after 3 bets ─
  console.log("[3/4] refreshOdds() — opening odds snapshot (K=3 anonymity)");
  const remaining = await (market as any).betsToNextSnapshot();
  console.log(`      bets remaining until gate opens: ${remaining}`);
  await (await (market as any).refreshOdds()).wait();

  // ── 4) Public-decrypt the snapshot ──────────────────────────────────────
  const yesH = await (market as any).getYesPoolHandle();
  const noH = await (market as any).getNoPoolHandle();
  const out = await fhevm.publicDecrypt([yesH, noH]);
  const yes = BigInt(out.clearValues[yesH]);
  const no = BigInt(out.clearValues[noH]);
  const total = yes + no;
  const yesPct = total === 0n ? 0n : (yes * 10000n) / total;
  console.log(`[4/4] snapshot: YES ${yes / 1_000_000n} / NO ${no / 1_000_000n}  → ${Number(yesPct) / 100}% YES`);
  console.log("\nLive Sepolia confidential bets placed — calldata/events reveal NOTHING; only the post-K snapshot is public.");
}

main().catch((e) => { console.error(e); process.exit(1); });
