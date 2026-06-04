# TruthMarket — Confidential Prediction Markets on Zama FHEVM

A binary prediction market where **bet amount and side are encrypted on-chain**
for the entire market lifecycle, while aggregate market metadata stays public.
Built on Zama Protocol's FHEVM and Ethereum Sepolia.

The privacy boundary is explicit and documented at the protocol level:

| Layer                    | Visible to everyone           | Visible to the bettor (off-chain decrypt) | Never visible                                                              |
|--------------------------|-------------------------------|-------------------------------------------|----------------------------------------------------------------------------|
| Market metadata          | question, description, category, deadline, status, K-anon parameter | —                                | —                                                                          |
| Public counters          | `betCount`, `lastSnapshotBetCount`, `snapshotCounter` | —                          | —                                                                          |
| Aggregate odds           | K-anonymous snapshot (released only after ≥K=3 new bets) | —                  | live per-bet pool delta                                                    |
| Bet input                | —                              | own bet                                   | bet amount, bet side, per-wallet cumulative stake                          |
| Per-user stake           | —                              | self (via EIP-712 user decryption)        | other wallets' stakes                                                      |
| Payout                   | —                              | self (encrypted cUSDC credit)             | payout amount                                                              |
| Final pools (post-settle)| cleartext (needed for claim math) | —                                      | —                                                                          |
| ERC-20 deposit (`wrap()`)| public USDC top-up amount     | —                                         | — (decoupled from per-bet amounts)                                         |

## How it works

### Encrypted bet
1. The user has wrapped some plain USDC into Zama's confidential **cUSDC** once
   ("top up") and granted the market operator status on the wrapper.
2. The browser uses the Zama relayer SDK to encrypt `(amount, side)`:
   ```
   createEncryptedInput(market, user).add64(amount).addBool(side).encrypt()
   ```
3. `placeBet(externalEuint64 amount, bytes amountProof, externalEbool side, bytes sideProof)`
   binds the ciphertexts via `FHE.fromExternal`, calls `confidentialTransferFrom`
   on cUSDC (returns the encrypted actually-transferred amount), splits it with
   `FHE.select`, and accumulates into encrypted pools + per-user stakes.
4. The emitted `BetPlaced()` event has **no arguments** — no amount, no side, no address.

### K-anonymous odds
Pools are stored as `euint64`. They are only revealed publicly through a
**snapshot** that's gated by a K-anonymity threshold:

```solidity
function refreshOdds() external {
    if (betCount - lastSnapshotBetCount < snapshotBatchK) revert TooFewBetsSinceSnapshot();
    FHE.makePubliclyDecryptable(yesPoolEnc);
    FHE.makePubliclyDecryptable(noPoolEnc);
    ...
}
```

Each successful bet creates a **new ciphertext handle** for the pool (via
`FHE.add`), and the public-decryption ACL applies to a specific handle — it
doesn't carry over. So the relayer can only return cleartext for the handle that
was active **at the moment a snapshot was triggered**. Because the snapshot
requires ≥K=3 new bets since the previous one, the diff between snapshots covers
at least K bets and can't be attributed to any individual wallet.

### Resolution and claim
- **`resolve(bool outcomeYes)`** (oracle, after deadline) — records the outcome
  and marks the final pool handles publicly decryptable.
- **`finalize(uint64 yes, uint64 no, bytes proof)`** (permissionless) — anyone
  pulls the cleartext pool values plus a KMS proof from the Zama relayer and
  submits them on-chain. `FHE.checkSignatures(handles, encoded, proof)` verifies
  the proof. The contract stores `yesPoolFinal` / `noPoolFinal` (now plaintext).
- **`claim()`** — payout is computed entirely in FHE:
  ```
  euint128 stake128 = FHE.asEuint128(userYesStake[msg.sender]);
  euint128 num      = FHE.mul(stake128, uint128(totalPool));
  euint64  payout   = FHE.asEuint64(FHE.div(num, uint128(winningPool)));
  cUsdc.confidentialTransfer(msg.sender, payout);
  ```
  The 128-bit intermediate prevents the `stake × totalPool` overflow that
  64-bit math would silently hit. The payout is delivered via ERC-7984
  `confidentialTransfer` — only the recipient can decrypt their credited balance.

Void paths (empty winning pool, or oracle missed `deadline + disputeWindow`)
refund the full stake via the same encrypted-transfer channel.

## Sepolia deployment (v3 — encrypted bets only)

We deploy a single contract; collateral comes from Zama's official tokens.

| Contract                     | Address |
|------------------------------|---------|
| `MarketFactory` v3 (ours, verified) | [`0x69Dbcf4426dF9f6AD16c035b005635efF22579F6`](https://sepolia.etherscan.io/address/0x69Dbcf4426dF9f6AD16c035b005635efF22579F6#code) |
| Confidential USDC `cUSDCMock`| [`0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639`](https://sepolia.etherscan.io/address/0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639) **Zama official** |
| Underlying USDC (public mint)| [`0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF`](https://sepolia.etherscan.io/address/0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF) **Zama official** |

Three demo markets are seeded in `deployments/sepolia/demo-markets.json`.
A live confidential smoke run on Sepolia placed three encrypted bets and a
post-K-anon snapshot, available at
[`scripts/smoke-bet-sepolia.ts`](./scripts/smoke-bet-sepolia.ts).

## Architecture

```
contracts/
├─ ConfidentialMarket.sol   per-market: encrypted bet, K-anon snapshot, resolve, finalize, claim
├─ MarketFactory.sol        deploys + indexes markets
└─ mocks/                   TEST-ONLY local stand-ins for the official Zama tokens
```

Built on:
- [`@fhevm/solidity ^0.11.1`](https://docs.zama.org/protocol/solidity-guides)
- [`@openzeppelin/confidential-contracts ^0.4.0`](https://github.com/OpenZeppelin/openzeppelin-confidential-contracts) (ERC-7984)
- [`@fhevm/hardhat-plugin ^0.4.2`](https://github.com/zama-ai/fhevm-hardhat-template)

## Development

```bash
npm install
npm run compile
npm test                     # 9 tests against the FHEVM mock
```

Test coverage:
- encrypted `(amount, side)` round-trip + per-user stake accumulation
- K-anonymity gate (`refreshOdds` rejects before K, allows after, re-gates after each bet)
- resolve → finalize (with KMS proof) → claim (pro-rata, with euint128 payout math)
- double-claim guard
- void paths (empty winning pool, oracle-timeout refunds)
- deadline + oracle gating

### Deploy to Sepolia

Copy `.env.example` → `.env` and fill in `SEPOLIA_RPC_URL`, `PRIVATE_KEY`,
`ETHERSCAN_API_KEY`.

```bash
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/seed-demo-markets.ts --network sepolia
npx hardhat run scripts/smoke-bet-sepolia.ts --network sepolia
```

## Frontend (`web/`)

Next.js 15 / App Router with shadcn/ui, wagmi v2, RainbowKit, the Zama Relayer
SDK (web build), and a Solar Burst design system (light, vivid orange + sky
blue + white).

Pages:
| Route                 | Purpose |
|-----------------------|---------|
| `/`                   | Market feed. Hero with generative Perlin flow-field art, feature pillars, market explorer with live K-anonymous odds. |
| `/markets/[address]`  | Market detail: snapshot odds via client-side relayer publicDecrypt, encrypted bet panel, refresh-odds button, claim, oracle/finalize controls. |
| `/create`             | Open a new confidential market. |
| `/portfolio`          | Encrypted per-wallet position list with self-reveal (EIP-712 + `userDecrypt`). |

The collateral UX hides the confidential token under "USDC" — the first bet
triggers a one-time top-up that mints test USDC, wraps it into Zama's cUSDC,
and grants the market operator status. Subsequent bets are a single encrypted
`placeBet` tx. The USDC→cUSDC conversion is visualized live with a
`WrapFlow` animation.

A small in-site faucet (`Faucet.tsx`) mints test USDC for new users — Circle's
Sepolia USDC cannot be wrapped into Zama's cUSDC because the wrapper is
hard-bound to the USDCMock address, so we mint that one specifically.

### Run locally

```bash
cd web
npm install --legacy-peer-deps
npm run dev          # http://localhost:3000
```

`web/.env.local`:
```
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<key>
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-project-id>
```

### Deploy on Netlify

`netlify.toml` points Netlify at `web/` with the `@netlify/plugin-nextjs`
runtime and emits the `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy`
headers the Zama relayer SDK requires for SharedArrayBuffer + WASM workers.
