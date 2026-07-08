// Live end-to-end UMA Optimistic Oracle V3 resolution demo on REAL Sepolia.
//
// Proves the full optimistic-oracle cycle against UMA's actual OOV3 deployment:
//   1) Create a fresh market via MarketFactory with oracle = UmaResolver and a
//      short deadline.
//   2) Wait until the market's deadline passes (it must be closed to assert).
//   3) Post the UMA bond and ASSERT the outcome (resolver.assertMarketOutcome).
//   4) Wait out the liveness window (no dispute).
//   5) SETTLE the assertion → OOV3 fires assertionResolvedCallback →
//      resolver calls market.resolve(outcome).
//   6) Read the market back: status == Resolving, outcomeYes == asserted value.
//
// NOTE: this exercises the happy path (assert → liveness → settle, undisputed),
// which is fully real on Sepolia. The dispute → DVM-vote path is NOT live on
// Sepolia (see README), so it is intentionally not part of this demo.
//
// Requires the asserter (deployer) to hold the UMA bond currency. The script
// reads the token + amount and aborts with instructions if the balance is short.
//
// Usage:
//   npx hardhat run scripts/uma-e2e-demo.ts --network sepolia
//
// Env:
//   UMA_OUTCOME=YES|NO   outcome to assert (default YES)

import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

function now(): number {
  return Math.floor(Date.now() / 1000);
}

async function chainTime(): Promise<number> {
  const b = await ethers.provider.getBlock("latest");
  return Number(b!.timestamp);
}

// Poll the chain clock until it reaches `targetTs` (Sepolia blocks ~12s).
async function waitUntilChainTime(targetTs: number, label: string) {
  process.stdout.write(`      waiting for ${label} (target ${new Date(targetTs * 1000).toISOString()})`);
  for (;;) {
    const t = await chainTime();
    if (t >= targetTs) break;
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 12_000));
  }
  process.stdout.write(" done\n");
}

async function main() {
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  if (chainId !== 11155111) {
    throw new Error(`This demo runs against the REAL UMA OOV3 on Sepolia. chainId is ${chainId}; use --network sepolia.`);
  }

  const dir = path.join(__dirname, "..", "deployments", network.name);
  const addrs = JSON.parse(fs.readFileSync(path.join(dir, "addresses.json"), "utf8"));
  const umaDep = JSON.parse(fs.readFileSync(path.join(dir, "uma-resolver.json"), "utf8"));

  const [signer] = await ethers.getSigners();
  const resolverAddr: string = umaDep.contracts.UmaResolver;
  const factoryAddr: string = addrs.contracts.MarketFactory;

  const outcomeYes = (process.env.UMA_OUTCOME ?? "YES").toUpperCase() !== "NO";

  console.log(`network : ${network.name} (chainId ${chainId})`);
  console.log(`asserter: ${signer.address}`);
  console.log(`factory : ${factoryAddr}`);
  console.log(`resolver: ${resolverAddr}`);
  console.log(`outcome : ${outcomeYes ? "YES" : "NO"}\n`);

  const factory = await ethers.getContractAt("MarketFactory", factoryAddr, signer);
  const resolver = await ethers.getContractAt("UmaResolver", resolverAddr, signer);

  // ── 1) Create a fresh market with the resolver as its oracle ──────────────
  const liveness = Number(await resolver.liveness());
  const deadline = (await chainTime()) + 90; // closes in ~90s
  const question = `UMA e2e demo @ ${new Date().toISOString()} — will this resolve via OOV3?`;
  console.log(`[1/6] createMarket(oracle=resolver, deadline=+90s)`);
  const createTx = await factory.createMarket(resolverAddr, deadline, question, "UMA OOV3 integration demo", "Demo");
  const createRc = await createTx.wait();
  // Pull the new market address from the MarketCreated event.
  let marketAddr = "";
  for (const log of createRc!.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === "MarketCreated") {
        marketAddr = parsed.args.market;
        break;
      }
    } catch {
      /* not a factory log */
    }
  }
  if (!marketAddr) throw new Error("could not find MarketCreated event");
  console.log(`      market: ${marketAddr}  (deadline ${new Date(deadline * 1000).toISOString()})\n`);

  const market = await ethers.getContractAt("ConfidentialMarket", marketAddr, signer);

  // ── 2) Wait until the market closes ───────────────────────────────────────
  console.log(`[2/6] waiting for market deadline to pass`);
  await waitUntilChainTime(deadline + 1, "deadline");
  console.log();

  // ── 3) Post the bond and assert the outcome ───────────────────────────────
  const currencyAddr: string = await resolver.currency();
  const bond: bigint = await resolver.effectiveBond();
  const token = new ethers.Contract(currencyAddr, ERC20_ABI, signer);
  let sym = "TOKEN";
  let dec = 18;
  try {
    sym = await token.symbol();
    dec = Number(await token.decimals());
  } catch {
    /* non-standard token; keep defaults */
  }
  const bal: bigint = await token.balanceOf(signer.address);
  console.log(`[3/6] assert outcome — bond currency ${currencyAddr} (${sym})`);
  console.log(`      bond required : ${ethers.formatUnits(bond, dec)} ${sym}`);
  console.log(`      your balance  : ${ethers.formatUnits(bal, dec)} ${sym}`);
  if (bal < bond) {
    console.error(
      `\n  Insufficient bond currency. Acquire at least ${ethers.formatUnits(bond, dec)} ${sym} ` +
        `(token ${currencyAddr}) for ${signer.address}, then re-run.\n` +
        `  This is UMA's whitelisted default currency on Sepolia — see the UMA docs / oracle UI ` +
        `(https://oracle.uma.xyz) for how to obtain testnet bond tokens.`,
    );
    process.exit(1);
  }

  const allowance: bigint = await token.allowance(signer.address, resolverAddr);
  if (allowance < bond) {
    console.log(`      approving resolver to pull ${ethers.formatUnits(bond, dec)} ${sym}…`);
    await (await token.approve(resolverAddr, bond)).wait();
  }

  const assertTx = await resolver.assertMarketOutcome(marketAddr, outcomeYes);
  await assertTx.wait();
  const assertionId: string = await resolver.marketAssertion(marketAddr);
  console.log(`      asserted ${outcomeYes ? "YES" : "NO"} — assertionId ${assertionId}\n`);

  // ── 4) Wait out the liveness window ───────────────────────────────────────
  console.log(`[4/6] liveness window: ${liveness}s (no dispute)`);
  const assertedAt = await chainTime();
  await waitUntilChainTime(assertedAt + liveness + 1, "liveness expiry");
  console.log();

  // ── 5) Settle → OOV3 callback → market.resolve ────────────────────────────
  console.log(`[5/6] settleAssertion → OOV3 fires assertionResolvedCallback → market.resolve`);
  const settleTx = await resolver.settleAssertion(assertionId);
  const settleRc = await settleTx.wait();
  console.log(`      settled in block ${settleRc!.blockNumber}\n`);

  // ── 6) Verify the market resolved as asserted ─────────────────────────────
  const status = Number(await market.status()); // 0 Open, 1 Resolving, 2 Resolved, 3 Voided
  const resolvedOutcome = await market.outcomeYes();
  const statusName = ["Open", "Resolving", "Resolved", "Voided"][status] ?? `#${status}`;
  console.log(`[6/6] market status: ${statusName}   outcomeYes: ${resolvedOutcome}`);

  if (status >= 1 && resolvedOutcome === outcomeYes) {
    console.log(`\n✓ UMA OOV3 resolved the market end-to-end: asserted ${outcomeYes ? "YES" : "NO"} → on-chain outcome matches.`);
    console.log(`  Next, off-chain finalize() decrypts the pools (see smoke-bet script) and winners claim().`);
  } else {
    throw new Error(`unexpected post-settlement state (status ${statusName}, outcomeYes ${resolvedOutcome})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
