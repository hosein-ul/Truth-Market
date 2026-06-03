import fs from "fs";
import path from "path";
import { task } from "hardhat/config";

// CLI tasks that exercise the live stack. They read addresses from
// deployments/<network>/addresses.json (written by scripts/deploy.ts). On
// Sepolia the token addresses are Zama's official confidential USDC + its
// underlying; the ABIs match our ERC20Mintable / ConfidentialWrapperMock.

function loadAddrs(hre: any) {
  const file = path.join(__dirname, "..", "deployments", hre.network.name, "addresses.json");
  if (!fs.existsSync(file)) throw new Error(`No deployment for network '${hre.network.name}'. Run scripts/deploy.ts first.`);
  return JSON.parse(fs.readFileSync(file, "utf8")).contracts;
}

task("tm:mint", "Mint underlying USDC to an address (Zama public faucet on Sepolia)")
  .addParam("to", "Recipient address")
  .addParam("amount", "Amount in USDC (6 decimals applied automatically)")
  .setAction(async ({ to, amount }, hre) => {
    const a = loadAddrs(hre);
    const usdc = await hre.ethers.getContractAt("ERC20Mintable", a.underlyingUSDC);
    const tx = await (usdc as any).mint(to, BigInt(amount) * 10n ** 6n);
    console.log("mint tx:", tx.hash);
    await tx.wait();
  });

task("tm:wrap", "Wrap underlying USDC into confidential USDC for the caller")
  .addParam("amount", "Amount in USDC (6 decimals applied automatically)")
  .setAction(async ({ amount }, hre) => {
    const a = loadAddrs(hre);
    const [signer] = await hre.ethers.getSigners();
    const usdc = await hre.ethers.getContractAt("ERC20Mintable", a.underlyingUSDC, signer);
    const cusdc = await hre.ethers.getContractAt("ConfidentialWrapperMock", a.confidentialUSDC, signer);

    const value = BigInt(amount) * 10n ** 6n;
    await (await (usdc as any).approve(a.confidentialUSDC, value)).wait();
    const tx = await (cusdc as any).wrap(signer.address, value);
    console.log("wrap tx:", tx.hash);
    await tx.wait();
  });

task("tm:create-market", "Create a new prediction market via the factory")
  .addParam("question", "Yes/No question")
  .addOptionalParam("description", "Resolution criteria", "")
  .addOptionalParam("category", "Crypto/Politics/Sports/Science/Other", "Other")
  .addOptionalParam("deadlineHours", "Hours from now until deadline", "24")
  .addOptionalParam("oracle", "Oracle address (defaults to caller)", "")
  .setAction(async ({ question, description, category, deadlineHours, oracle }, hre) => {
    const a = loadAddrs(hre);
    const [signer] = await hre.ethers.getSigners();
    const factory = await hre.ethers.getContractAt("MarketFactory", a.MarketFactory, signer);
    const oracleAddr = oracle && oracle.length === 42 ? oracle : signer.address;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(deadlineHours) * 3600);
    const tx = await (factory as any).createMarket(oracleAddr, deadline, question, description, category);
    const receipt = await tx.wait();
    const evt = receipt!.logs
      .map((l: any) => {
        try {
          return (factory as any).interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((p: any) => p && p.name === "MarketCreated");
    console.log("market created:", evt?.args?.market);
  });

task("tm:place-bet", "Place a confidential bet on a market")
  .addParam("market", "ConfidentialMarket address")
  .addParam("amount", "Amount in USDC (6 decimals applied)")
  .addParam("side", "yes or no")
  .setAction(async ({ market, amount, side }, hre) => {
    await hre.fhevm.initializeCLIApi();
    const a = loadAddrs(hre);
    const [signer] = await hre.ethers.getSigners();
    const cusdc = await hre.ethers.getContractAt("ConfidentialWrapperMock", a.confidentialUSDC, signer);

    const until = Math.floor(Date.now() / 1000) + 30 * 86400;
    await (await (cusdc as any).setOperator(market, until)).wait();

    const isYes = String(side).toLowerCase() === "yes";
    const value = BigInt(amount) * 10n ** 6n;
    const enc = await hre.fhevm
      .createEncryptedInput(market, signer.address)
      .add64(value)
      .addBool(isYes)
      .encrypt();

    const m = await hre.ethers.getContractAt("ConfidentialMarket", market, signer);
    const tx = await (m as any).placeBet(enc.handles[0], enc.handles[1], enc.inputProof);
    console.log("bet tx:", tx.hash);
    await tx.wait();
  });

task("tm:resolve", "Oracle resolves market and finalizes via KMS proof (mock only)")
  .addParam("market", "ConfidentialMarket address")
  .addParam("outcome", "yes or no")
  .setAction(async ({ market, outcome }, hre) => {
    await hre.fhevm.initializeCLIApi();
    const isYes = String(outcome).toLowerCase() === "yes";
    const [signer] = await hre.ethers.getSigners();
    const m = (await hre.ethers.getContractAt("ConfidentialMarket", market, signer)) as any;
    await (await m.resolve(isYes)).wait();

    if (!hre.fhevm.isMock) {
      console.log("On Sepolia: finalize() must be called with a relayer-signed KMS proof (see README).");
      return;
    }
    const yesHandle = await m.getYesPool();
    const noHandle = await m.getNoPool();
    const result = await hre.fhevm.publicDecrypt([yesHandle, noHandle]);
    const yClear = BigInt(result.clearValues[yesHandle] as any);
    const nClear = BigInt(result.clearValues[noHandle] as any);
    await (await m.finalize(yClear, nClear, result.decryptionProof)).wait();
    console.log(`finalized: yes=${yClear} no=${nClear}`);
  });

task("tm:claim", "Claim winnings from a resolved market")
  .addParam("market", "ConfidentialMarket address")
  .setAction(async ({ market }, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const m = await hre.ethers.getContractAt("ConfidentialMarket", market, signer);
    const tx = await (m as any).claim();
    console.log("claim tx:", tx.hash);
    await tx.wait();
  });
