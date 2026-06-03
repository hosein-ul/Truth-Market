// End-to-end smoke test of the live Sepolia deployment.
//  1. Mint the official underlying USDC to the deployer
//  2. Wrap into the official confidential USDC (cUSDCMock)
//  3. Set the first demo market as operator
//  4. Encrypt (amount, side) via the relayer SDK and place a confidential bet
//
// Anything past `placeBet` (resolve / finalize / claim) needs to wait for the
// market deadline, so it's exercised in the mock test suite, not here.

import { ethers, fhevm, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  // Plugin auto-inits during `hardhat test`; scripts need an explicit kick.
  await fhevm.initializeCLIApi();

  const dir = path.join(__dirname, "..", "deployments", network.name);
  const addrs = JSON.parse(fs.readFileSync(path.join(dir, "addresses.json"), "utf8"));
  const demos = JSON.parse(fs.readFileSync(path.join(dir, "demo-markets.json"), "utf8"));

  const [signer] = await ethers.getSigners();
  const usdc = await ethers.getContractAt("ERC20Mintable", addrs.contracts.underlyingUSDC, signer);
  const cusdc = await ethers.getContractAt("ConfidentialWrapperMock", addrs.contracts.confidentialUSDC, signer);

  const marketAddr: string = demos[0].address;
  console.log(`market : ${marketAddr}  (${demos[0].question})`);

  const stake = 25_000_000n; // 25 USDC

  console.log("[1] mint 25 USDC");
  const mintTx = await usdc.mint(signer.address, stake);
  await mintTx.wait();

  console.log("[2] approve + wrap into confidential USDC");
  await (await usdc.approve(await cusdc.getAddress(), stake)).wait();
  await (await (cusdc as any).wrap(signer.address, stake)).wait();

  console.log("[3] set market as operator");
  const until = Math.floor(Date.now() / 1000) + 30 * 86400;
  await (await (cusdc as any).setOperator(marketAddr, until)).wait();

  console.log("[4] encrypt (amount=10, side=YES) via FHEVM relayer");
  const enc = await fhevm
    .createEncryptedInput(marketAddr, signer.address)
    .add64(10_000_000n)
    .addBool(true)
    .encrypt();

  console.log("[5] placeBet");
  const m = await ethers.getContractAt("ConfidentialMarket", marketAddr, signer);
  const tx = await (m as any).placeBet(enc.handles[0], enc.handles[1], enc.inputProof);
  console.log(`    tx ${tx.hash}`);
  const r = await tx.wait();
  console.log(`    ok in block ${r!.blockNumber}`);

  console.log("\nLive Sepolia confidential bet placed successfully.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
