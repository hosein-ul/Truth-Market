import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/mock-utils";
import type { Signer } from "ethers";

// Helpers ────────────────────────────────────────────────────────────────────

const USDC = (n: number | bigint) => BigInt(n) * 10n ** 6n;
const DAY = 86_400;

async function deployAll() {
  const [deployer, oracle, alice, bob, carol] = await ethers.getSigners();

  // Local stand-ins for Zama's official Sepolia tokens (same interfaces).
  const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
  const usdc = await ERC20Mintable.deploy();
  await usdc.waitForDeployment();

  const Wrapper = await ethers.getContractFactory("ConfidentialWrapperMock");
  const cusdc = await Wrapper.deploy(await usdc.getAddress());
  await cusdc.waitForDeployment();

  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const factory = await MarketFactory.deploy(await cusdc.getAddress());
  await factory.waitForDeployment();

  return { deployer, oracle, alice, bob, carol, usdc, cusdc, factory };
}

async function mintAndWrap(usdc: any, cusdc: any, user: Signer, amount: bigint) {
  await (await usdc.mint(await user.getAddress(), amount)).wait();
  await (await usdc.connect(user).approve(await cusdc.getAddress(), amount)).wait();
  await (await cusdc.connect(user).wrap(await user.getAddress(), amount)).wait();
}

async function createMarket(
  factory: any,
  creator: Signer,
  oracleAddr: string,
  deadlineOffsetSec = DAY,
) {
  const deadline = BigInt((await ethers.provider.getBlock("latest"))!.timestamp + deadlineOffsetSec);
  const tx = await factory
    .connect(creator)
    .createMarket(oracleAddr, deadline, "Will it rain tomorrow?", "Resolves YES if NWS reports rain.", "Science");
  const receipt = await tx.wait();
  const parsed = receipt!.logs
    .map((l: any) => {
      try {
        return factory.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((p: any) => p && p.name === "MarketCreated");
  const marketAddr: string = parsed.args.market;
  const market = await ethers.getContractAt("ConfidentialMarket", marketAddr);
  return { market, marketAddr, deadline };
}

async function placeBet(
  market: any,
  cusdc: any,
  marketAddr: string,
  user: Signer,
  amount: bigint,
  yes: boolean,
) {
  const until = Math.floor(Date.now() / 1000) + 30 * DAY;
  await (await cusdc.connect(user).setOperator(marketAddr, until)).wait();
  const enc = await fhevm
    .createEncryptedInput(marketAddr, await user.getAddress())
    .add64(amount)
    .addBool(yes)
    .encrypt();
  return market.connect(user).placeBet(enc.handles[0], enc.handles[1], enc.inputProof);
}

async function finalizeMarket(market: any) {
  // Pull encrypted pool handles, ask the mock relayer to decrypt them. The
  // returned object includes a KMS-signed proof in the exact wire format
  // FHE.checkSignatures expects.
  const yesHandle = await market.getYesPool();
  const noHandle = await market.getNoPool();
  const result = await fhevm.publicDecrypt([yesHandle, noHandle]);
  const yClear = BigInt(result.clearValues[yesHandle] as any);
  const nClear = BigInt(result.clearValues[noHandle] as any);
  await (await market.finalize(yClear, nClear, result.decryptionProof)).wait();
  return { yClear, nClear };
}

async function userBalanceClear(cusdc: any, user: Signer): Promise<bigint> {
  const handle = await cusdc.confidentialBalanceOf(await user.getAddress());
  if (handle === ethers.ZeroHash) return 0n;
  return fhevm.userDecryptEuint(FhevmType.euint64, handle, await cusdc.getAddress(), user);
}

// Suite ──────────────────────────────────────────────────────────────────────

describe("TruthMarket — confidential prediction market", function () {
  before(function () {
    if (!fhevm.isMock) this.skip();
  });

  describe("Wrap / unwrap collateral on-ramp", function () {
    it("wraps underlying USDC into confidential USDC 1:1", async function () {
      const { usdc, cusdc, alice } = await deployAll();
      await mintAndWrap(usdc, cusdc, alice, USDC(1_000));
      expect(await userBalanceClear(cusdc, alice)).to.eq(USDC(1_000));
      expect(await usdc.balanceOf(await alice.getAddress())).to.eq(0n);
    });
  });

  describe("Lifecycle: bet → resolve → claim", function () {
    it("pays winners pro-rata and loser receives nothing", async function () {
      const { usdc, cusdc, factory, oracle, alice, bob, carol } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());

      // Fund
      await mintAndWrap(usdc, cusdc, alice, USDC(1_000));
      await mintAndWrap(usdc, cusdc, bob, USDC(1_000));
      await mintAndWrap(usdc, cusdc, carol, USDC(1_000));

      // Bets: alice YES 300, bob NO 100, carol YES 100
      await (await placeBet(market, cusdc, marketAddr, alice, USDC(300), true)).wait();
      await (await placeBet(market, cusdc, marketAddr, bob, USDC(100), false)).wait();
      await (await placeBet(market, cusdc, marketAddr, carol, USDC(100), true)).wait();

      // Pools are encrypted and not publicly decryptable yet. Per-user stakes
      // ARE accessible to the user themselves — verify Alice's YES stake.
      const aliceYes = await market.getUserYesStake(await alice.getAddress());
      const aliceYesClear = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        aliceYes,
        await market.getAddress(),
        alice,
      );
      expect(aliceYesClear).to.eq(USDC(300));

      // Time travel past deadline.
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);

      // Oracle resolves YES, then anyone finalizes (delivers KMS-signed pools).
      await (await market.connect(oracle).resolve(true)).wait();
      const { yClear, nClear } = await finalizeMarket(market);
      expect(yClear).to.eq(USDC(400));
      expect(nClear).to.eq(USDC(100));
      expect(await market.status()).to.eq(2n); // Resolved

      // Claim
      const aliceBefore = await userBalanceClear(cusdc, alice);
      const carolBefore = await userBalanceClear(cusdc, carol);
      const bobBefore = await userBalanceClear(cusdc, bob);

      await (await market.connect(alice).claim()).wait();
      await (await market.connect(carol).claim()).wait();
      await (await market.connect(bob).claim()).wait();

      const aliceAfter = await userBalanceClear(cusdc, alice);
      const carolAfter = await userBalanceClear(cusdc, carol);
      const bobAfter = await userBalanceClear(cusdc, bob);

      // total = 500. aliceYesStake=300/400 → 375; carolYesStake=100/400 → 125
      expect(aliceAfter - aliceBefore).to.eq(USDC(375));
      expect(carolAfter - carolBefore).to.eq(USDC(125));
      expect(bobAfter - bobBefore).to.eq(0n);
    });

    it("blocks double claim", async function () {
      const { usdc, cusdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await mintAndWrap(usdc, cusdc, alice, USDC(100));
      await (await placeBet(market, cusdc, marketAddr, alice, USDC(50), true)).wait();
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await (await market.connect(oracle).resolve(true)).wait();
      await finalizeMarket(market);
      await (await market.connect(alice).claim()).wait();
      await expect(market.connect(alice).claim()).to.be.revertedWithCustomError(market, "AlreadyClaimed");
    });

    it("rejects claim from a non-bettor", async function () {
      const { usdc, cusdc, factory, oracle, alice, bob } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await mintAndWrap(usdc, cusdc, alice, USDC(100));
      await (await placeBet(market, cusdc, marketAddr, alice, USDC(50), true)).wait();
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await (await market.connect(oracle).resolve(true)).wait();
      await finalizeMarket(market);
      await expect(market.connect(bob).claim()).to.be.revertedWithCustomError(market, "NoPosition");
    });
  });

  describe("Deadline & oracle gating", function () {
    it("rejects bets after deadline", async function () {
      const { usdc, cusdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await mintAndWrap(usdc, cusdc, alice, USDC(100));
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(placeBet(market, cusdc, marketAddr, alice, USDC(50), true)).to.be.revertedWithCustomError(
        market,
        "PastDeadline",
      );
    });

    it("only oracle can resolve", async function () {
      const { factory, oracle, alice, bob } = await deployAll();
      const { market } = await createMarket(factory, alice, await oracle.getAddress());
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(market.connect(bob).resolve(true)).to.be.revertedWithCustomError(market, "NotOracle");
    });

    it("rejects resolve before deadline", async function () {
      const { factory, oracle, alice } = await deployAll();
      const { market } = await createMarket(factory, alice, await oracle.getAddress());
      await expect(market.connect(oracle).resolve(true)).to.be.revertedWithCustomError(market, "BeforeDeadline");
    });
  });

  describe("Void paths", function () {
    it("voids when winning side has no bets", async function () {
      const { usdc, cusdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await mintAndWrap(usdc, cusdc, alice, USDC(100));
      await (await placeBet(market, cusdc, marketAddr, alice, USDC(50), true)).wait();
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await (await market.connect(oracle).resolve(false)).wait(); // NO wins
      await finalizeMarket(market);
      expect(await market.status()).to.eq(3n); // Voided

      const aliceBefore = await userBalanceClear(cusdc, alice);
      await (await market.connect(alice).claim()).wait();
      const aliceAfter = await userBalanceClear(cusdc, alice);
      expect(aliceAfter - aliceBefore).to.eq(USDC(50));
    });

    it("enableRefunds works only after dispute window", async function () {
      const { usdc, cusdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await mintAndWrap(usdc, cusdc, alice, USDC(100));
      await (await placeBet(market, cusdc, marketAddr, alice, USDC(50), true)).wait();
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(market.enableRefunds()).to.be.revertedWithCustomError(market, "TooEarlyToVoid");

      await ethers.provider.send("evm_increaseTime", [8 * DAY]);
      await ethers.provider.send("evm_mine", []);
      await (await market.enableRefunds()).wait();
      expect(await market.status()).to.eq(3n); // Voided

      const before = await userBalanceClear(cusdc, alice);
      await (await market.connect(alice).claim()).wait();
      const after = await userBalanceClear(cusdc, alice);
      expect(after - before).to.eq(USDC(50));
    });
  });

  describe("Factory", function () {
    it("lists created markets paginated", async function () {
      const { factory, oracle, alice } = await deployAll();
      const oracleAddr = await oracle.getAddress();
      for (let i = 0; i < 3; ++i) await createMarket(factory, alice, oracleAddr);
      expect(await factory.marketsLength()).to.eq(3n);
      const page = await factory.listMarkets(1, 2);
      expect(page.length).to.eq(2);
    });
  });
});
