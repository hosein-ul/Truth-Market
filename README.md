# TruthMarket

**Confidential prediction markets on Ethereum, powered by Zama FHEVM.**

On Polymarket and Kalshi, *who* bet, *how much*, and *which side* are all
public. That turns prediction markets into a copy-trading game: whales drive
herds, insiders are exposed, and in some countries a visible political bet is a
personal risk.

TruthMarket fixes this at the protocol level. Bet amounts and positions are
encrypted on-chain via Fully Homomorphic Encryption throughout a market's
entire lifecycle. The only thing that ever becomes public is the resolved
outcome and the aggregate pool sizes (once the market is closed). Individual
payouts are decryptable only by the wallet that earned them.

This is **Phase A** of the build: smart contracts, full test suite, and a
verified Sepolia deployment with a live end-to-end smoke test. The Next.js
frontend lands in Phase B.

---

## Sepolia deployment

TruthMarket uses **Zama's official confidential tokens** as collateral — we do
not deploy our own. The only contract we deploy is `MarketFactory` (which in
turn deploys each `ConfidentialMarket`).

| Contract                     | Address | Owner |
|------------------------------|---------|-------|
| `MarketFactory` (ours)       | [`0x2Aed78F76fD40a1BAf6F00BDEe30Ec0ABcb06A30`](https://sepolia.etherscan.io/address/0x2Aed78F76fD40a1BAf6F00BDEe30Ec0ABcb06A30#code) | TruthMarket |
| Confidential USDC `cUSDCMock`| [`0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639`](https://sepolia.etherscan.io/address/0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639) | **Zama official** |
| Underlying USDC (public mint)| [`0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF`](https://sepolia.etherscan.io/address/0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF) | **Zama official** |

`MarketFactory` is verified on Etherscan. Three demo markets are seeded in
`deployments/sepolia/demo-markets.json`. A real confidential bet — mint official
USDC → wrap via the official cUSDCMock → encrypted `placeBet` — was placed
on-chain at block [`10981523`](https://sepolia.etherscan.io/tx/0x083277ca52d074c8af129782dd06129a2bbc0bd7fe9d661ff3abd8e3f3f0426f).

---

## How it works

### Bet privacy

A bet is a pair of encrypted values: `(amount: euint64, side: ebool)`. The
contract computes

```
yesPart = FHE.select(side, transferred, 0)
noPart  = FHE.select(side, 0, transferred)
```

and accumulates them into encrypted `yesPool` / `noPool` and per-user
`userYesStake` / `userNoStake`. Because the side is encrypted, the
yes-contribution and no-contribution branches are *both* evaluated, and the
total amount pulled from the user is the same regardless of which side it
went on. From outside the contract, all anyone sees is "an opaque
encrypted amount moved" — both side and amount remain hidden.

### Lifecycle

1. **Open.** Users place encrypted bets until `deadline`. Pools stay
   encrypted; no live odds are shown to anyone.
2. **Resolving.** After the deadline the designated `oracle` calls
   `resolve(bool outcomeYes)`. The contract records the outcome and marks the
   two pool handles as **publicly decryptable** via the Zama KMS.
3. **Resolved.** Anyone fetches the cleartext pool sizes plus the KMS-signed
   proof from the Zama relayer and submits `finalize(yes, no, proof)`. The
   on-chain `FHE.checkSignatures` verifies the KMS threshold signatures and
   stores the cleartext pools.
4. **Claim.** Winners call `claim()`. Because the pools are now plaintext
   constants, the FHE payout formula

   ```
   payout = winningStake * totalPool / winningPool
   ```

   is a legal encrypted × scalar followed by encrypted ÷ scalar (FHE division
   requires a cleartext divisor — which is *exactly* what resolution gives us).
   The payout is delivered as confidential ERC-7984 tokens — only the claimer
   can decrypt how much they received.

### Edge cases

- **Empty winning pool** — market voids, everyone refunds their full stake.
- **Oracle never resolves** — after `deadline + disputeWindow`, anyone can
  call `enableRefunds()` to void the market.
- **Double claim** — blocked by a per-address `claimed` flag.
- **Bet after deadline** — plaintext `require` reverts.

### Collateral UX: USDC in / USDC out

End users never see or hear about ERC-7984. The UI exposes only standard
USDC: users mint the underlying USDC from Zama's public faucet, deposit goes
in via the official wrapper's `wrap()`, and withdrawal goes out via `unwrap()`
+ `finalizeUnwrap()`. The confidential token layer (Zama's `cUSDCMock`) is the
implementation detail that makes encrypted betting possible — not a thing
users need to understand.

---

## Architecture

```
contracts/
├─ ConfidentialMarket.sol  per-market: betting, resolution, claim
├─ MarketFactory.sol       deploys + indexes markets (registry)
└─ mocks/
   └─ TokenMocks.sol       TEST-ONLY local stand-ins for the official Zama
                           tokens (the real ones only exist on Sepolia)
```

The deployed protocol uses **Zama's official `cUSDCMock` confidential wrapper**
and its underlying USDC (see addresses above) — it deploys no tokens of its own.
`ConfidentialMarket` and `MarketFactory` accept any `IERC7984` collateral, so
they are wired to the official wrapper at deploy time.

Built on:
- [`@fhevm/solidity ^0.11.1`](https://docs.zama.org/protocol/solidity-guides)
- [`@openzeppelin/confidential-contracts ^0.4.0`](https://github.com/OpenZeppelin/openzeppelin-confidential-contracts) (ERC-7984)
- [`@fhevm/hardhat-plugin ^0.4.2`](https://github.com/zama-ai/fhevm-hardhat-template)

---

## Development

```bash
# Install
npm install

# Compile
npm run compile

# Run the full test suite on the FHEVM mock
npm test
```

Test coverage includes the full lifecycle (multi-user pro-rata payouts),
deadline gating, oracle gating, double-claim protection, both void paths
(empty winning pool + oracle timeout), and the wrap/unwrap on-ramp.

### Deploy to Sepolia

Copy `.env.example` to `.env` and fill in `SEPOLIA_RPC_URL`, `PRIVATE_KEY`,
`ETHERSCAN_API_KEY`.

```bash
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/verify.ts --network sepolia
npx hardhat run scripts/seed-demo-markets.ts --network sepolia
npx hardhat run scripts/smoke-bet-sepolia.ts --network sepolia
```

### CLI tasks

```
npx hardhat tm:mint --to <addr> --amount 100
npx hardhat tm:wrap --amount 100
npx hardhat tm:create-market --question "Will X happen?"
npx hardhat tm:place-bet --market <addr> --amount 10 --side yes
npx hardhat tm:resolve --market <addr> --outcome yes    # mock only end-to-end
npx hardhat tm:claim --market <addr>
```

---

## What's next (Phase B)

Production-grade Next.js frontend modeled on Polymarket / Kalshi: market
feed with category filters and search, market detail with encrypted bet
form and countdown, create-market flow, portfolio with self-decryption.
Frontend abstracts wrapping entirely — users only ever see "Deposit USDC"
and "Withdraw USDC".
