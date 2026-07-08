# UMA Optimistic Oracle V3 resolution (Sepolia)

TruthMarket markets can be resolved by **UMA's Optimistic Oracle V3 (OOV3)**
instead of a trusted EOA oracle. Resolution becomes an *optimistic* process: any
party posts a bond and asserts a market's YES/NO outcome; if nobody disputes it
within a liveness window, the assertion settles and the market is resolved
on-chain — backed by UMA's economic-security game rather than a single key.

This integration follows UMA's official **Prediction Market** tutorial pattern
(`finder` + OOV3 + `defaultCurrency` in the constructor; `assertTruth`;
`assertionResolvedCallback`).

- Tutorial: https://docs.uma.xyz/developers/optimistic-oracle-v3/prediction-market
- OOV3 docs: https://docs.uma.xyz/developers/optimistic-oracle-v3
- Network addresses: https://docs.uma.xyz/resources/network-addresses
- Oracle UI (view / dispute assertions): https://oracle.uma.xyz

## Architecture — a non-invasive adapter

`ConfidentialMarket` already exposes a clean resolution hook: an `oracle`
address is the only account allowed to call `resolve(bool outcomeYes)` after the
market's deadline. We exploit that hook instead of modifying the market.

```
                 assertMarketOutcome(market, YES/NO)
   asserter ───────────────────────────────────────────►  UmaResolver
   (posts bond)                                              │  (= market.oracle)
                                                             │ assertTruth(claim, …)
                                                             ▼
                                                    UMA OptimisticOracleV3  (real, Sepolia)
                                                             │
                                  liveness elapses, no dispute │ settleAssertion()
                                                             ▼
                                         assertionResolvedCallback(id, true)
                                                             │
                                                             ▼
                                          market.resolve(outcomeYes)  ──►  Resolving
```

`ConfidentialMarket.sol` and `MarketFactory.sol` are **unchanged**. To put a
market under UMA, simply pass the `UmaResolver` address as the `oracle` argument
to `MarketFactory.createMarket(oracle, …)`.

### Contracts

| File | Role |
|------|------|
| `contracts/UmaResolver.sol` | The adapter. Installed as a market's `oracle`. Asserts outcomes to OOV3 and resolves the market on settlement. |
| `contracts/uma/interfaces/*` | Minimal vendored UMA interfaces (`FinderInterface`, `OptimisticOracleV3Interface`, `OptimisticOracleV3CallbackRecipientInterface`). |

### Key design points

- **No hardcoded oracle address.** The constructor takes only the UMA **Finder**
  and reads the live OOV3 implementation from it
  (`finder.getImplementationAddress("OptimisticOracleV3")`). The bond currency
  and DVM identifier are read from the OOV3 itself
  (`defaultCurrency()`, `defaultIdentifier()`). If UMA upgrades the oracle, the
  resolver tracks it automatically.
- **Permissionless asserts.** Anyone can call `assertMarketOutcome`. The asserter
  posts the bond and is named as `asserter` to OOV3, so UMA returns the bond to
  them directly on honest settlement. A false assertion can be disputed and the
  bond slashed — this is what secures the outcome.
- **Configurable bond & liveness (not hardcoded).** `liveness` and a `bondAmount`
  floor are set at deploy time and adjustable by the owner via `setParams`. The
  effective bond is `max(bondAmount, OOV3.getMinimumBond(currency))`, so it is
  always ≥ the protocol minimum.
- **Bond currency ≠ market collateral.** Markets are collateralized in Zama's
  confidential **cUSDC**. UMA bonds are paid in UMA's **whitelisted default
  currency** (a plain ERC-20). They are independent tokens.

## ⚠️ Sepolia / DVM limitation (important)

On Sepolia, UMA's **Data Verification Mechanism (DVM)** — the token-holder voting
layer that adjudicates *disputed* assertions — is **not live**.

Consequence:

- ✅ The **happy path is fully real**: `assertTruth` → liveness window →
  `settleAssertion` (undisputed) → `assertionResolvedCallback(…, true)` →
  `market.resolve(...)`. This is exactly what the e2e demo exercises.
- ⚠️ If an assertion **is disputed**, there is no on-chain DVM on Sepolia to vote
  it to a final truth. In that case the resolver records the dispute
  (`assertionDisputedCallback`), leaves the market **Open**, and the outcome can
  be **re-asserted** after the failed assertion settles. There is no automated
  final resolution of a disputed outcome on testnet.

On Ethereum mainnet the DVM *is* live and disputed assertions resolve through
token-holder voting; the same contracts work there unchanged.

## Deploy

Prerequisites: a funded Sepolia deployer key in `.env` (`PRIVATE_KEY`), an RPC
URL (`SEPOLIA_RPC_URL`, e.g. Alchemy/Infura), and Sepolia ETH from a faucet
(Alchemy / Infura / PoW / LearnWeb3).

```bash
# 1) Deploy the resolver (reads OOV3 + bond currency from the UMA Finder)
npx hardhat run scripts/deploy-uma-resolver.ts --network sepolia
# optional tuning:
#   UMA_LIVENESS=120   dispute window in seconds (default 120)
#   UMA_BOND=0         bond floor in base units (0 ⇒ OOV3 minimum)
```

Writes `deployments/sepolia/uma-resolver.json` and logs the resolved OOV3
address, bond currency, and effective bond.

## End-to-end demo (real Sepolia, happy path)

```bash
# Runs: create market (oracle = resolver) → wait deadline → post bond + assert
#       → wait liveness → settle → verify market resolved as asserted.
npx hardhat run scripts/uma-e2e-demo.ts --network sepolia
#   UMA_OUTCOME=YES|NO   outcome to assert (default YES)
```

The asserter must hold the UMA **bond currency** (logged by the deploy script).
The demo reads the required bond and aborts with instructions if your balance is
short. Obtain testnet bond tokens via the UMA docs / oracle UI
(https://oracle.uma.xyz).

Timeline: market closes ~90s after creation, then a `liveness`-second dispute
window (default 120s), so a full run takes a few minutes on Sepolia.

## After resolution

UMA resolution moves the market to **`Resolving`** and sets `outcomeYes` — the
same state a trusted oracle would have produced. From there the existing flow is
unchanged: anyone calls `finalize(...)` with the relayer-decrypted cleartext
pools, then winners `claim()`. See the main README and `scripts/smoke-bet-sepolia.ts`.

## UMA Sepolia addresses

From `UMAprotocol/protocol` `packages/core/networks/11155111.json`
(mirrored in `config/uma.ts`):

| Contract | Address |
|----------|---------|
| Finder | `0xf4C48eDAd256326086AEfbd1A53e1896815F8f13` |
| OptimisticOracleV3 | `0xFd9e2642a170aDD10F53Ee14a93FcF2F31924944` (resolved dynamically from Finder) |
| AddressWhitelist | `0xE8DE4bcE27f6214dcE18D8a7629f233C66A97B84` |
| Store | `0x39e7FFA77A4ac4D34021C6BbE4C8778d47F684F2` |
