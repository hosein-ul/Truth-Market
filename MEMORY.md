# TruthMarket — Project Memory

> **Purpose of this file.** A persistent, running log of everything built in this
> project: the goal, the architecture, every decision, every fix, and the steps
> that remain. Update it after each working session so context is never lost
> between conversations. (See also `CLAUDE.md` for the short operating guide.)

**Last updated:** 2026-06-03 (Session 5)
**Repo:** `hosein-ul/Truth-Market` · **Dev branch:** `claude/loving-meitner-VH1fm`
**Network:** Ethereum Sepolia (testnet only)

---

## 1. What we are building

**TruthMarket** — a production-grade **confidential prediction market** on Zama
Protocol's FHEVM.

On Polymarket / Kalshi, *who* bet, *how much*, and *which side* are all public.
That turns prediction markets into a copy-trading game: whales drive herds,
insiders are exposed, and a visible political bet is a personal risk.
TruthMarket fixes this at the protocol level — **bet amount and side are
encrypted on-chain** for the entire market lifecycle via Fully Homomorphic
Encryption. The only things that ever become public are the resolved outcome and
the aggregate pool sizes (once the market closes). Individual payouts are
decryptable only by the wallet that earned them.

**Requirements:**
- (a) Anyone can create binary YES/NO markets.
- (b) Bets are encrypted on-chain (amount + side hidden).
- (c) Pools are revealed only on market resolution.
- (d) Payouts are decryptable only by winners.

**Phases:**
- **Phase A** — Smart contracts, full test suite, Sepolia deploy. ✅ DONE
- **Phase B** — Next.js frontend with "Deposit USDC" UX hiding all FHE wrapping. ✅ BUILT (deploy pending)

---

## 2. Current status — at a glance

| Item | Status |
|------|--------|
| Contracts (`ConfidentialMarket`, `MarketFactory`) | ✅ Done |
| Test suite (FHEVM mock) | ✅ 10/10 passing |
| Sepolia deploy of `MarketFactory` | ✅ `0x2Aed78F76fD40a1BAf6F00BDEe30Ec0ABcb06A30` (verified) |
| Migration to Zama official tokens | ✅ Done (custom tokens removed) |
| Demo markets seeded on Sepolia | ✅ 3 markets |
| Live on-chain confidential bet | ✅ block 10981523 |
| Next.js frontend (`web/`) | ✅ Built |
| `netlify.toml` + COOP/COEP headers | ✅ Done |
| Netlify project created | ✅ `truth-market-app` (siteId `afc34bb1-9e63-4d38-b572-4bd17baae82a`) |
| Netlify ↔ GitHub repo link | ⏳ **PENDING — manual step (see §8)** |

---

## 3. Deployed addresses (Sepolia)

We deploy **only `MarketFactory`**. Collateral uses **Zama's official
confidential tokens** — we do not deploy our own.

| Contract | Address | Owner |
|----------|---------|-------|
| `MarketFactory` (ours) | `0x2Aed78F76fD40a1BAf6F00BDEe30Ec0ABcb06A30` | TruthMarket (verified on Etherscan) |
| Confidential USDC `cUSDCMock` | `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639` | **Zama official** |
| Underlying USDC (public mint) | `0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF` | **Zama official** |
| Wrappers registry | `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` | **Zama official** |

Addresses are recorded in `deployments/sepolia/addresses.json` and surfaced to
the frontend via `config/zama.ts`.

---

## 4. Architecture & cryptographic design

### Contracts (`contracts/`)
```
contracts/
├─ ConfidentialMarket.sol  per-market: betting, resolution, claim
├─ MarketFactory.sol       deploys + indexes markets (registry)
└─ mocks/
   └─ TokenMocks.sol       TEST-ONLY local stand-ins for the official Zama
                           tokens (real ones only exist on Sepolia)
```

**`ConfidentialMarket.sol`** — `is ZamaEthereumConfig` (FHEVM base config).
- Encrypted state: `yesPool`, `noPool`, per-user `userYesStake`, `userNoStake`
  (all `euint64`).
- `placeBet(externalEuint64 amt, externalEbool side, bytes proof)`:
  - `FHE.allowTransient(amount, address(collateral))` **before** the transfer
    (the wrapper internally does `FHE.ge(balance, amount)` and needs transient
    ACL on the amount — omitting this caused `ACLNotAllowed`).
  - Pulls collateral via `confidentialTransferFrom` and **credits using the
    returned `euint64`** (this fn does NOT revert on insufficient balance).
  - Splits with `FHE.select`:
    `yesPart = FHE.select(side, transferred, 0)`,
    `noPart  = FHE.select(side, 0, transferred)`.
    Both branches evaluate, so an observer only sees "an opaque amount moved" —
    side and amount both hidden.
- `resolve(bool outcomeYes)` — **oracle only, after deadline**. Records outcome,
  calls `FHE.makePubliclyDecryptable(yesPool)` + `...(noPool)`.
- `finalize(uint64 yes, uint64 no, bytes proof)` — **anyone**. Verifies KMS
  threshold signatures via `FHE.checkSignatures`, stores cleartext pools, voids
  if the winning pool == 0.
- `claim()` — payout `= FHE.div(FHE.mul(winningStake, totalPool), winningPool)`.
  Legal because `totalPool`/`winningPool` are now plaintext (FHE division
  requires a cleartext divisor — exactly what resolution provides). Paid via
  confidential transfer; only the claimer can decrypt the amount. Voided markets
  refund full stake. Per-address `claimed` flag blocks double-claim.
- `enableRefunds()` — after `deadline + disputeWindow`, anyone can void a market
  the oracle never resolved.
- Status enum: `Open(0)`, `Resolving(1)`, `Resolved(2)`, `Voided(3)`.

**`MarketFactory.sol`**
- `createMarket(oracle, deadline, question, description, category)` →
  `new ConfidentialMarket(...)`, stores registry.
- `listMarkets(offset, limit)` — paginated.
- Emits `MarketCreated(id, market, creator, oracle, deadline, question, category)`.

### Two-phase resolution (the key design)
`FHE.div` needs a **plaintext** divisor, so pools must be public before payout
math. Hence: oracle `resolve()` → `makePubliclyDecryptable` → anyone fetches the
KMS-signed cleartext from the relayer and submits `finalize()` →
`FHE.checkSignatures` verifies on-chain → cleartext pools stored → `claim()` math
becomes legal.

### Edge cases handled
- Empty winning pool → market voids, everyone refunds full stake.
- Oracle never resolves → `enableRefunds()` after dispute window.
- Double claim → per-address `claimed` flag.
- Bet after deadline → plaintext `require` reverts.

---

## 5. Tech stack (pinned)

**Contracts / Hardhat**
- `@fhevm/solidity@0.11.1` — `FHE`, `euint64`, `ebool`, `externalEuint64`,
  `externalEbool`, `ZamaEthereumConfig`.
- `@openzeppelin/confidential-contracts@0.4.0` — ERC-7984, `ERC7984ERC20Wrapper`,
  `FHESafeMath`.
- `@fhevm/hardhat-plugin@0.4.2` (must be the **first** import in
  `hardhat.config.ts`), ethers v6.
- Etherscan API **v2**: `etherscan.apiKey` must be a single string (not an
  object) — v1 is deprecated.

**Frontend (`web/`)**
- Next.js 15 App Router + RSC, wagmi v2 + viem, RainbowKit, Tailwind v3.
- `@zama-fhe/relayer-sdk@0.4.1` — `createInstance`, `SepoliaConfig`,
  `createEncryptedInput`, `userDecrypt`, `publicDecrypt`.
  - **Pinned to 0.4.1** because `@fhevm/mock-utils` requires exactly 0.4.1
    (0.4.3 caused a peer-dep conflict).
- Netlify with `@netlify/plugin-nextjs`; **COOP/COEP headers required** for the
  WASM Web Worker + SharedArrayBuffer.

---

## 6. Key files

| File | Role |
|------|------|
| `contracts/ConfidentialMarket.sol` | Per-market betting / resolution / claim |
| `contracts/MarketFactory.sol` | Market registry + factory |
| `contracts/mocks/TokenMocks.sol` | TEST-ONLY local token stand-ins |
| `config/zama.ts` | Official Zama Sepolia token addresses |
| `scripts/deploy.ts` | Network-aware deploy (Sepolia: factory only; local: mocks too) |
| `scripts/verify.ts` | Etherscan verification |
| `scripts/seed-demo-markets.ts` | Seeds demo markets |
| `scripts/smoke-bet-sepolia.ts` | Live end-to-end confidential bet |
| `deployments/sepolia/addresses.json` | Deployed addresses |
| `test/ConfidentialMarket.test.ts` | 10/10 lifecycle + edge-case tests |
| `hardhat.config.ts` | Networks, FHEVM plugin, Etherscan v2 |
| `web/src/lib/fhevm.ts` | Lazy browser SDK singleton |
| `web/src/components/EncryptedValue.tsx` | Signature primitive — animated cipher glyphs |
| `web/src/components/CipherCanvas.tsx` | Generative hero (value-noise field) |
| `web/src/components/BetPanel.tsx` | Deposit USDC + encrypted placeBet |
| `web/src/components/OracleControls.tsx` | resolve / finalize / void |
| `web/src/app/portfolio/page.tsx` | Per-handle user-decryption via EIP-712 |
| `netlify.toml` | Netlify build + COOP/COEP headers |

### Frontend pages
| Route | Purpose |
|-------|---------|
| `/` | Market feed (RSC). Hero + grouped sealed / resolving / settled. |
| `/markets/[address]` | Detail: encrypted pools, bet panel, claim, oracle controls. |
| `/create` | Open a new sealed market. |
| `/portfolio` | Positions; per-handle user-decryption via EIP-712. |

### Collateral UX (USDC in / USDC out)
End users never see "ERC-7984", "cUSDC", or "wrap". **Deposit USDC** silently
mints from Zama's faucet → approves the wrapper → `wrap()`s into cUSDC.
**Place bet** sets the market as operator if needed → encrypts `(amount, side)`
client-side → single `placeBet` tx. **Decrypt** uses `generateKeypair` + EIP-712
sign + `userDecrypt`.

---

## 7. Errors hit & how we fixed them (so we don't repeat)

1. **peer-dep conflict** — relayer-sdk `0.4.3` vs `@fhevm/mock-utils` wanting
   `0.4.1` → pinned `0.4.1`.
2. **`ConfidentialUSDC` multiple inheritance** — needed explicit overrides for
   `decimals()`, `supportsInterface()`, `_update()` (later removed when we
   switched to official tokens).
3. **`ACLNotAllowed` on `placeBet`** — `confidentialTransferFrom` does
   `FHE.ge(balance, amount)` internally → add
   `FHE.allowTransient(amount, address(collateral))` first.
4. **Pools not publicly decryptable during Open** — only `publicDecrypt` after
   `resolve()`; verify per-user stakes via `userDecryptEuint` instead.
5. **`fhevm_createDecryptionSignatures` not supported** by the Hardhat plugin →
   use `hre.fhevm.publicDecrypt([h1,h2])`, which returns
   `{ clearValues, decryptionProof }` (correct relayer path).
6. **`hardhat-deploy` `customData` error** (ethers v5/v6 mismatch) → switched to
   `scripts/deploy.ts` via `hardhat run` with ethers v6 directly.
7. **Etherscan API v1 deprecated** → `etherscan.apiKey` is now a single string.
8. **FHEVM plugin not initialized in scripts** → call
   `await fhevm.initializeCLIApi()` before `createEncryptedInput()`.
9. **OracleControls TS error** — `clearValues` keyed by `` `0x${string}` `` →
   cast to `Record<string, bigint | boolean | string>`.
10. **Netlify intermittent 502s** (Cloudflare) — retried; project eventually
    created.

---

## 8. Remaining steps

1. **Link Netlify to GitHub (manual).** The Netlify project `truth-market-app`
   (siteId `afc34bb1-9e63-4d38-b572-4bd17baae82a`) exists and has env var
   `NEXT_PUBLIC_SEPOLIA_RPC_URL` set. To finish:
   - Open https://app.netlify.com/projects/truth-market-app
   - **Build & deploy → Link repository**
   - Repo `hosein-ul/Truth-Market`, branch `claude/loving-meitner-VH1fm`
   - `netlify.toml` already provides base (`web/`), build command, publish dir,
     and the required COOP/COEP headers — it builds out of the box.
2. **(Optional) Open a PR** to merge `claude/loving-meitner-VH1fm` → default
   branch — only when the user asks.
3. **(Optional) Browser end-to-end** on Sepolia: connect wallet → deposit →
   create market → encrypted bet (confirm calldata reveals nothing) → resolve →
   finalize → claim → portfolio self-decrypt.

---

## 9. Hard constraints / reminders

- 🔐 **The private key must NEVER be committed to the GitHub repo.** Secrets live
  in env / `.env` (gitignored) only. (User emphasized this twice.)
- Sepolia **testnet only**.
- Don't push to any branch other than `claude/loving-meitner-VH1fm` without
  explicit permission. Don't open a PR unless asked.
- `FHE.div` requires a plaintext divisor — never attempt payout math before
  finalization.

---

## 10. Session log

- **Session 1 (Phase A).** Built contracts, test suite (10/10), deploy/verify/seed
  scripts. Deployed `MarketFactory` to Sepolia, verified, seeded 3 demo markets,
  placed a real on-chain confidential bet (block 10981523).
- **Session 2 (token migration).** Removed custom `MockUSDC`/`ConfidentialUSDC`;
  wired contracts + scripts to Zama's official Sepolia tokens; kept local mocks
  as TEST-ONLY fixtures.
- **Session 3 (Phase B).** Built the Next.js "Encrypted Terminal" frontend:
  feed, market detail, create, portfolio; `EncryptedValue` + `CipherCanvas`
  primitives; hidden wrap/unwrap UX; `netlify.toml` + COOP/COEP. Created the
  Netlify project; set the RPC env var. GitHub link left as a manual step.
- **Session 4.** Created `MEMORY.md` and `CLAUDE.md`.
- **Session 5 (this one).** Full production-grade frontend redesign. 19 files changed.
  - New: `ActivityFeed`, `ProbabilityDisplay`, `SettlementRules`, `MarketsFeed` (client-side filters), `PositionPanel`, `lib/activity.ts`, `lib/utils.ts`.
  - Redesigned: `MarketCard` (Polymarket probability bars + FHE sealed animation), `BetPanel` (professional bet ticket with inline privacy proof), `Header`, `Footer`, `StatusBadge` (chip system), `CountdownClock` (compact prop).
  - Pages: Home (data-dense, no hero, stat cells, filter feed, protocol pillars), Market detail (two-column: left = probability/activity/rules; right = bet/position/oracle/privacy note), Portfolio (table view + empty states), Create (cleaner layout + info grid).
  - Design system: `.panel`, `.chip-*`, `.prob-track/fill-*`, `.activity-row`, `.stat-cell`, `.market-card`, `.filter-pill`, `.bet-side-btn`, `.fade-in`.
  - Build passes cleanly: `npm run build` ✓ (19 static pages generated).
