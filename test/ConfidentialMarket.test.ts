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
  const factory = await MarketFactory.deploy(await usdc.getAddress(), await cusdc.getAddress());
  await factory.waitForDeployment();

  return { deployer, oracle, alice, bob, carol, usdc, cusdc, factory };
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

/**
 * Place a bet. Amount and side are PUBLIC now (so odds update live). The user
 * just needs plain USDC + an approval to the market.
 */
async function placeBet(
  market: any,
  usdc: any,
  marketAddr: string,
  user: Signer,
  amount: bigint,
  yes: boolean,
) {
  await (await usdc.mint(await user.getAddress(), amount)).wait();
  await (await usdc.connect(user).approve(marketAddr, amount)).wait();
  return market.connect(user).placeBet(amount, yes);
}

async function userBalanceClear(cusdc: any, user: Signer): Promise<bigint> {
  const handle = await cusdc.confidentialBalanceOf(await user.getAddress());
  if (handle === ethers.ZeroHash) return 0n;
  return fhevm.userDecryptEuint(FhevmType.euint64, handle, await cusdc.getAddress(), user);
}

// Suite ──────────────────────────────────────────────────────────────────────

describe("TruthMarket — public odds, private positions", function () {
  before(function () {
    if (!fhevm.isMock) this.skip();
  });

  describe("Public odds", function () {
    it("exposes pool totals and implied probability as plaintext", async function () {
      const { usdc, factory, oracle, alice, bob } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());

      await (await placeBet(market, usdc, marketAddr, alice, USDC(300), true)).wait();
      await (await placeBet(market, usdc, marketAddr, bob, USDC(100), false)).wait();

      expect(await market.yesPool()).to.eq(USDC(300));
      expect(await market.noPool()).to.eq(USDC(100));
      expect(await market.betCount()).to.eq(2n);
      // 300 / 400 = 75% → 7500 bps
      expect(await market.yesProbabilityBps()).to.eq(7500n);
    });

    it("keeps per-user stakes encrypted (only the owner can decrypt)", async function () {
      const { usdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());

      await (await placeBet(market, usdc, marketAddr, alice, USDC(250), true)).wait();

      const aliceYes = await market.getUserYesStake(await alice.getAddress());
      const aliceYesClear = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        aliceYes,
        await market.getAddress(),
        alice,
      );
      expect(aliceYesClear).to.eq(USDC(250));
    });
  });

  describe("Lifecycle: bet → resolve → claim", function () {
    it("pays winners pro-rata and loser receives nothing", async function () {
      const { usdc, cusdc, factory, oracle, alice, bob, carol } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());

      // Bets: alice YES 300, bob NO 100, carol YES 100
      await (await placeBet(market, usdc, marketAddr, alice, USDC(300), true)).wait();
      await (await placeBet(market, usdc, marketAddr, bob, USDC(100), false)).wait();
      await (await placeBet(market, usdc, marketAddr, carol, USDC(100), true)).wait();

      expect(await market.yesPool()).to.eq(USDC(400));
      expect(await market.noPool()).to.eq(USDC(100));

      // Time travel past deadline.
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);

      // Single-step resolve — pools are already public.
      await (await market.connect(oracle).resolve(true)).wait();
      expect(await market.status()).to.eq(1n); // Resolved

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
      const { usdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await (await placeBet(market, usdc, marketAddr, alice, USDC(50), true)).wait();
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await (await market.connect(oracle).resolve(true)).wait();
      await (await market.connect(alice).claim()).wait();
      await expect(market.connect(alice).claim()).to.be.revertedWithCustomError(market, "AlreadyClaimed");
    });

    it("rejects claim from a non-bettor", async function () {
      const { usdc, factory, oracle, alice, bob } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await (await placeBet(market, usdc, marketAddr, alice, USDC(50), true)).wait();
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await (await market.connect(oracle).resolve(true)).wait();
      await expect(market.connect(bob).claim()).to.be.revertedWithCustomError(market, "NoPosition");
    });
  });

  describe("Deadline & oracle gating", function () {
    it("rejects bets after deadline", async function () {
      const { usdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(placeBet(market, usdc, marketAddr, alice, USDC(50), true)).to.be.revertedWithCustomError(
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
      await (await placeBet(market, usdc, marketAddr, alice, USDC(50), true)).wait();
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await (await market.connect(oracle).resolve(false)).wait(); // NO wins, but no NO bets
      expect(await market.status()).to.eq(2n); // Voided

      const aliceBefore = await userBalanceClear(cusdc, alice);
      await (await market.connect(alice).claim()).wait();
      const aliceAfter = await userBalanceClear(cusdc, alice);
      expect(aliceAfter - aliceBefore).to.eq(USDC(50));
    });

    it("enableRefunds works only after dispute window", async function () {
      const { usdc, cusdc, factory, oracle, alice } = await deployAll();
      const { market, marketAddr } = await createMarket(factory, alice, await oracle.getAddress());
      await (await placeBet(market, usdc, marketAddr, alice, USDC(50), true)).wait();
      await ethers.provider.send("evm_increaseTime", [DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(market.enableRefunds()).to.be.revertedWithCustomError(market, "TooEarlyToVoid");

      await ethers.provider.send("evm_increaseTime", [8 * DAY]);
      await ethers.provider.send("evm_mine", []);
      await (await market.enableRefunds()).wait();
      expect(await market.status()).to.eq(2n); // Voided

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
