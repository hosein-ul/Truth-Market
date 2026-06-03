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

| Contract           | Address |
|--------------------|---------|
| `MockUSDC`         | [`0xeBc902Cee74345DD23f63E2f132f81E5fBE1D56D`](https://sepolia.etherscan.io/address/0xeBc902Cee74345DD23f63E2f132f81E5fBE1D56D#code) |
| `ConfidentialUSDC` | [`0x795090A656f472cdddeF8cF367A4ee446b39ea84`](https://sepolia.etherscan.io/address/0x795090A656f472cdddeF8cF367A4ee446b39ea84#code) |
| `MarketFactory`    | [`0xb10655458F990335b6339d0c95D9755B5CACa168`](https://sepolia.etherscan.io/address/0xb10655458F990335b6339d0c95D9755B5CACa168#code) |

All three are verified on Etherscan. Three demo markets are seeded in
`deployments/sepolia/demo-markets.json`. A real confidential bet was placed
on-chain at block [`10980880`](https://sepolia.etherscan.io/tx/0x7f6ac3ed4a9b12587d759806806dfe7baf9ffb9423f07501c5d9dca4ab843f13).

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
USDC: deposit goes in via `ConfidentialUSDC.wrap()`, withdrawal goes out via
`unwrap()` + `finalizeUnwrap()`. The confidential token layer is the
implementation detail that makes encrypted betting possible — not a thing
users need to understand.

---

## Architecture

```
contracts/
├─ MockUSDC.sol            ERC20 6-decimals + public mint faucet
├─ ConfidentialUSDC.sol    ERC7984 + ERC7984ERC20Wrapper(MockUSDC)
├─ ConfidentialMarket.sol  per-market: betting, resolution, claim
└─ MarketFactory.sol       deploys + indexes markets (registry)
```

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
