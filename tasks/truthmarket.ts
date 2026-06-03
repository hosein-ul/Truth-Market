import { task } from "hardhat/config";

// Convenience CLI tasks that exercise the whole stack on a live network.
// They assume `hardhat deploy --network <net>` has already run.

task("tm:mint", "Mint Mock USDC to an address")
  .addParam("to", "Recipient address")
  .addParam("amount", "Amount in USDC (6 decimals applied automatically)")
  .setAction(async ({ to, amount }, hre) => {
    const usdc = await hre.ethers.getContract<any>("MockUSDC");
    const tx = await usdc.mint(to, BigInt(amount) * 10n ** 6n);
    console.log("mint tx:", tx.hash);
    await tx.wait();
  });

task("tm:wrap", "Wrap MockUSDC into ConfidentialUSDC for the caller")
  .addParam("amount", "Amount in USDC (6 decimals applied automatically)")
  .setAction(async ({ amount }, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const usdc = await hre.ethers.getContract<any>("MockUSDC", signer);
    const cusdc = await hre.ethers.getContract<any>("ConfidentialUSDC", signer);
    const cusdcAddr = await cusdc.getAddress();

    const value = BigInt(amount) * 10n ** 6n;
    console.log("approving", value);
    await (await usdc.approve(cusdcAddr, value)).wait();
    console.log("wrapping...");
    const tx = await cusdc.wrap(signer.address, value);
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
    const [signer] = await hre.ethers.getSigners();
    const factory = await hre.ethers.getContract<any>("MarketFactory", signer);
    const oracleAddr = oracle && oracle.length === 42 ? oracle : signer.address;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(deadlineHours) * 3600);
    const tx = await factory.createMarket(oracleAddr, deadline, question, description, category);
    const receipt = await tx.wait();
    const evt = receipt!.logs
      .map((l: any) => {
        try {
          return factory.interface.parseLog(l);
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
    const [signer] = await hre.ethers.getSigners();
    const cusdc = await hre.ethers.getContract<any>("ConfidentialUSDC", signer);
    const cusdcAddr = await cusdc.getAddress();

    // Approve market as operator for 30 days
    const until = Math.floor(Date.now() / 1000) + 30 * 86400;
    console.log("setOperator -> market");
    await (await cusdc.setOperator(market, until)).wait();

    const isYes = String(side).toLowerCase() === "yes";
    const value = BigInt(amount) * 10n ** 6n;

    const enc = await hre.fhevm
      .createEncryptedInput(market, signer.address)
      .add64(value)
      .addBool(isYes)
      .encrypt();

    const m = await hre.ethers.getContractAt("ConfidentialMarket", market, signer);
    const tx = await m.placeBet(enc.handles[0], enc.handles[1], enc.inputProof);
    console.log("bet tx:", tx.hash);
    await tx.wait();
  });

task("tm:resolve", "Oracle resolves market and finalizes via KMS proof (mock only)")
  .addParam("market", "ConfidentialMarket address")
  .addParam("outcome", "yes or no")
  .setAction(async ({ market, outcome }, hre) => {
    const isYes = String(outcome).toLowerCase() === "yes";
    const m = await hre.ethers.getContractAt("ConfidentialMarket", market);
    const [signer] = await hre.ethers.getSigners();
    const m2 = m.connect(signer) as any;
    console.log("resolve...");
    await (await m2.resolve(isYes)).wait();

    if (!hre.fhevm.isMock) {
      console.log("On Sepolia: finalize() must be called separately with a relayer-signed KMS proof.");
      return;
    }
    const yesHandle = await m2.getYesPool();
    const noHandle = await m2.getNoPool();
    const result = await hre.fhevm.publicDecrypt([yesHandle, noHandle]);
    const yClear = BigInt(result.clearValues[yesHandle] as any);
    const nClear = BigInt(result.clearValues[noHandle] as any);
    await (await m2.finalize(yClear, nClear, result.decryptionProof)).wait();
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
