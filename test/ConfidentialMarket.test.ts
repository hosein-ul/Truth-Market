import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/mock-utils";
import type { Signer } from "ethers";

// Helpers ────────────────────────────────────────────────────────────────────

const USDC = (n: number | bigint) => BigInt(n) * 10n ** 6n;
const DAY = 86_400;

async function deployAll() {
  const [deployer, oracle, alice, bob, carol, dave] = await ethers.getSigners();

  const ERC20Mintable = await ethers.getContractFactory("ERC20Mintable");
  const usdc = await ERC20Mintable.deploy();
  await usdc.waitForDeployment();

  const Wrapper = await ethers.getContractFactory("ConfidentialWrapperMock");
  const cusdc = await Wrapper.deploy(await usdc.getAddress());
  await cusdc.waitForDeployment();

  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const factory = await MarketFactory.deploy(await cusdc.getAddress());
  await factory.waitForDeployment();

  return { deployer, oracle, alice, bob, carol, dave, usdc, cusdc, factory };
}

async function createMarket(factory: any, creator: Signer, oracleAddr: string, offset = DAY) {
  const deadline = BigInt((await ethers.provider.getBlock("latest"))!.timestamp + offset);
  const tx = await factory
    .connect(creator)
    .createMarket(oracleAddr, deadline, "Will it rain tomorrow?", "Resolves YES if NWS reports rain.", "Science");
  const receipt = await tx.wait();
  const parsed = receipt!.logs
    .map((l: any) => { try { return factory.interface.parseLog(l); } catch { return null; } })
    .find((p: any) => p && p.name === "MarketCreated");
  const marketAddr: string = parsed.args.market;
  const market = await ethers.getContractAt("ConfidentialMarket", marketAddr);
  return { market, marketAddr, deadline };
}

/** One-time top-up: mint plaintext USDC → wrap into cUSDC → set market as operator. */
async function topUp(usdc: any, cusdc: any, user: Signer, marketAddr: string, amount: bigint) {
  const u = await user.getAddress();
  await (await usdc.mint(u, amount)).wait();
  await (await usdc.connect(user).approve(await cusdc.getAddress(), amount)).wait();
  await (await cusdc.connect(user).wrap(u, amount)).wait();
  const until = (await ethers.provider.getBlock("latest"))!.timestamp + 30 * DAY;
  await (await cusdc.connect(user).setOperator(marketAddr, until)).wait();
}

/** Encrypted placeBet. */
async function placeBet(market: any, marketAddr: string, user: Signer, amount: bigint, yes: boolean) {
  const u = await user.getAddress();
  const enc = await fhevm.createEncryptedInput(marketAddr, u).add64(amount).addBool(yes).encrypt();
  return market.connect(user).placeBet(enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof);
}

async function userBalanceClear(cusdc: any, user: Signer): Promise<bigint> {
  const handle = await cusdc.confidentialBalanceOf(await user.getAddress());
  if (handle === ethers.ZeroHash) return 0n;
  return fhevm.userDecryptEuint(FhevmType.euint64, handle, await cusdc.getAddress(), user);
}

async function userYesStakeClear(market: any, marketAddr: string, user: Signer): Promise<bigint> {
  const h = await market.getUserYesStake(await user.getAddress());
  if (h === ethers.ZeroHash) return 0n;
  return fhevm.userDecryptEuint(FhevmType.euint64, h, marketAddr, user);
}

async function poolsPublicClear(market: any) {
  const yesH = await market.getYesPoolHandle();
  const noH = await market.getNoPoolHandle();
  const out = await fhevm.publicDecrypt([yesH, noH]);
  return {
    yes: BigInt(out.clearValues[yesH]),
    no: BigInt(out.clearValues[noH]),
    proof: out.decryptionProof,
    handles: [yesH, noH] as [string, string],
  };
}

// Suite ──────────────────────────────────────────────────────────────────────

describe("ConfidentialMarket v3 — encrypted bets, K-anon odds", function () {
  before(function () { if (!fhevm.isMock) this.skip(); });

  describe("Encrypted bet inputs", function () {
    it("accepts encrypted (amount, side) and accumulates encrypted per-user stakes", async function () {
      const { usdc, cusdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());

      await topUp(usdc, cusdc, alice, marketAddr, USDC(500));
      await (await placeBet(market, marketAddr, alice, USDC(120), true)).wait();
      await (await placeBet(market, marketAddr, alice, USDC(30), false)).wait();

      const yesClear = await userYesStakeClear(market, marketAddr, alice);
      const noH = await market.getUserNoStake(await alice.getAddress());
      const noClear = await fhevm.userDecryptEuint(FhevmType.euint64, noH, marketAddr, alice);
      expect(yesClear).to.eq(USDC(120));
      expect(noClear).to.eq(USDC(30));
      expect(await market.betCount()).to.eq(2n);
    });
  });

  describe("K-anonymous odds snapshot", function () {
    it("rejects refreshOdds before K bets, allows after, and gates the next snapshot", async function () {
      const { usdc, cusdc, factory, oracle, alice, bob, carol } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());

      // K defaults to 3 in the factory.
      await topUp(usdc, cusdc, alice, marketAddr, USDC(300));
      await topUp(usdc, cusdc, bob, marketAddr, USDC(300));
      await topUp(usdc, cusdc, carol, marketAddr, USDC(300));

      await (await placeBet(market, marketAddr, alice, USDC(100), true)).wait();
      await (await placeBet(market, marketAddr, bob, USDC(50), false)).wait();

      await expect(market.refreshOdds()).to.be.revertedWithCustomError(market, "TooFewBetsSinceSnapshot");

      await (await placeBet(market, marketAddr, carol, USDC(150), true)).wait();
      await (await market.refreshOdds()).wait();

      const { yes, no } = await poolsPublicClear(market);
      expect(yes).to.eq(USDC(250));
      expect(no).to.eq(USDC(50));

      // After a fresh bet a new handle exists; needs K more bets to refresh again.
      await (await placeBet(market, marketAddr, alice, USDC(25), true)).wait();
      await expect(market.refreshOdds()).to.be.revertedWithCustomError(market, "TooFewBetsSinceSnapshot");
    });
  });

  describe("Resolve + finalize + claim", function () {
    it("pays winners pro-rata and loser gets nothing — payout stays confidential", async function () {
      const { usdc, cusdc, factory, oracle, alice, bob, carol } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());

      await topUp(usdc, cusdc, alice, marketAddr, USDC(400));
      await topUp(usdc, cusdc, bob, marketAddr, USDC(200));
      await topUp(usdc, cusdc, carol, marketAddr, USDC(200));

      await (await placeBet(market, marketAddr, alice, USDC(300), true)).wait();
      await (await placeBet(market, marketAddr, bob, USDC(100), false)).wait();
      await (await placeBet(market, marketAddr, carol, USDC(100), true)).wait();

      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);

      await (await market.connect(oracle).resolve(true)).wait();
      expect(await market.status()).to.eq(1n); // Resolving

      const { yes, no, proof } = await poolsPublicClear(market);
      await (await market.finalize(yes, no, proof)).wait();
      expect(await market.status()).to.eq(2n); // Resolved
      expect(await market.yesPoolFinal()).to.eq(USDC(400));
      expect(await market.noPoolFinal()).to.eq(USDC(100));

      const aliceBefore = await userBalanceClear(cusdc, alice);
      const carolBefore = await userBalanceClear(cusdc, carol);
      const bobBefore = await userBalanceClear(cusdc, bob);

      await (await market.connect(alice).claim()).wait();
      await (await market.connect(carol).claim()).wait();
      await (await market.connect(bob).claim()).wait();

      const aliceAfter = await userBalanceClear(cusdc, alice);
      const carolAfter = await userBalanceClear(cusdc, carol);
      const bobAfter = await userBalanceClear(cusdc, bob);

      // total 500. aliceYesStake 300/400 → 375; carolYesStake 100/400 → 125
      expect(aliceAfter - aliceBefore).to.eq(USDC(375));
      expect(carolAfter - carolBefore).to.eq(USDC(125));
      expect(bobAfter - bobBefore).to.eq(0n);
    });

    it("blocks double claim", async function () {
      const { usdc, cusdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await topUp(usdc, cusdc, alice, marketAddr, USDC(100));
      await (await placeBet(market, marketAddr, alice, USDC(50), true)).wait();
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await (await market.connect(oracle).resolve(true)).wait();
      const { yes, no, proof } = await poolsPublicClear(market);
      await (await market.finalize(yes, no, proof)).wait();
      await (await market.connect(alice).claim()).wait();
      await expect(market.connect(alice).claim()).to.be.revertedWithCustomError(market, "AlreadyClaimed");
    });
  });

  describe("Void paths", function () {
    it("voids when winning side has no bets — claim refunds full stake", async function () {
      const { usdc, cusdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await topUp(usdc, cusdc, alice, marketAddr, USDC(100));
      await (await placeBet(market, marketAddr, alice, USDC(50), true)).wait();
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await (await market.connect(oracle).resolve(false)).wait();
      const { yes, no, proof } = await poolsPublicClear(market);
      await (await market.finalize(yes, no, proof)).wait();
      expect(await market.status()).to.eq(3n); // Voided

      const before = await userBalanceClear(cusdc, alice);
      await (await market.connect(alice).claim()).wait();
      const after = await userBalanceClear(cusdc, alice);
      expect(after - before).to.eq(USDC(50));
    });

    it("enableRefunds works only after deadline + disputeWindow", async function () {
      const { usdc, cusdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await topUp(usdc, cusdc, alice, marketAddr, USDC(100));
      await (await placeBet(market, marketAddr, alice, USDC(50), true)).wait();
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(market.enableRefunds()).to.be.revertedWithCustomError(market, "TooEarlyToVoid");
      await ethers.provider.send("evm_increaseTime", [8 * DAY]);
      await ethers.provider.send("evm_mine", []);
      await (await market.enableRefunds()).wait();
      expect(await market.status()).to.eq(3n);

      const before = await userBalanceClear(cusdc, alice);
      await (await market.connect(alice).claim()).wait();
      const after = await userBalanceClear(cusdc, alice);
      expect(after - before).to.eq(USDC(50));
    });
  });

  describe("Deadline & oracle gating", function () {
    it("rejects bets after deadline", async function () {
      const { usdc, cusdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await topUp(usdc, cusdc, alice, marketAddr, USDC(100));
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(placeBet(market, marketAddr, alice, USDC(10), true)).to.be.revertedWithCustomError(
        market,
        "PastDeadline",
      );
    });

    it("only oracle can resolve, and not before deadline", async function () {
      const { factory, oracle, alice, bob } = await deployAll();
      const { market } = await createMarket(factory, alice, await oracle.getAddress());
      await expect(market.connect(oracle).resolve(true)).to.be.revertedWithCustomError(market, "BeforeDeadline");
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(market.connect(bob).resolve(true)).to.be.revertedWithCustomError(market, "NotOracle");
    });
  });

  describe("Factory", function () {
    it("lists created markets paginated", async function () {
      const { factory, oracle, alice } = await deployAll();
      const oa = await oracle.getAddress();
      for (let i = 0; i < 3; ++i) await createMarket(factory, alice, oa);
      expect(await factory.marketsLength()).to.eq(3n);
      const page = await factory.listMarkets(1, 2);
      expect(page.length).to.eq(2);
    });
  });
});
