# CLAUDE.md — Operating guide for this repo

Short, durable instructions for any AI/coding agent working in TruthMarket.
For the full project history, decisions, and remaining steps, read **`MEMORY.md`**.

## What this project is
**TruthMarket** — a confidential binary (YES/NO) prediction market on **Zama
FHEVM**, deployed to **Ethereum Sepolia**. Bet **amount and side are encrypted
on-chain** for the whole lifecycle; only the resolved outcome and aggregate pools
become public; payouts are decryptable only by the winner.

## Golden rules
- 🔐 **NEVER commit the private key (or any secret) to the repo.** Secrets stay in
  `.env` (gitignored) / environment only.
- Develop on branch **`claude/loving-meitner-VH1fm`**. Do **not** push elsewhere
  without explicit permission. Do **not** open a PR unless asked.
- **Sepolia testnet only.**
- **Always update `MEMORY.md`** at the end of a session (and the "Last updated"
  date + session log) so context survives between conversations.

## Layout
- `contracts/` — `ConfidentialMarket.sol`, `MarketFactory.sol`, `mocks/` (TEST-ONLY).
- `config/zama.ts` — official Zama Sepolia token addresses.
- `scripts/` — `deploy.ts`, `verify.ts`, `seed-demo-markets.ts`, `smoke-bet-sepolia.ts`.
- `test/` — Hardhat tests against the FHEVM mock.
- `deployments/sepolia/addresses.json` — deployed addresses.
- `web/` — Next.js 15 frontend (App Router, wagmi/viem, RainbowKit, relayer SDK).
- `netlify.toml` — Netlify build + required COOP/COEP headers.

## Key addresses (Sepolia)
- `MarketFactory` v4 (encrypted bets + cashOut, verified): `0x1e7702db95be7CCE29075ad6E5b76fC88B8B3D44`
- cUSDCMock (Zama official): `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639`
- Underlying USDC (Zama official): `0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF`
- (deprecated: v3 `0x69Dbcf4426dF9f6AD16c035b005635efF22579F6`, v2 `0x6702fB99B26CC37292c5b93d5aDFA5789Fa27334`, v1 `0x2Aed78F76fD40a1BAf6F00BDEe30Ec0ABcb06A30`)

## Privacy model (v2 — CORRECT)
- **Pools are PUBLIC** plaintext (`uint256 yesPool/noPool`) → implied odds always
  visible → real price discovery. A prediction market needs visible odds.
- **Per-user stakes are PRIVATE** (`euint64` via `FHE.add`) → nobody can look up a
  specific wallet's position. Whale-tracking is impossible.
- `BetPlaced(amount, side)` is **anonymous** (no wallet address).
- `placeBet(uint64 amount, bool side)` — plaintext bet via USDC `approve`; contract
  wraps to cUSDC internally; payouts via ERC-7984 `confidentialTransfer`.
- Single-step `resolve()` (pools already public — no finalize/decrypt phase).
- Status enum: Open=0, Resolved=1, Voided=2.

## Stack gotchas (don't relearn the hard way)
- `@zama-fhe/relayer-sdk` is **pinned to 0.4.1** (mock-utils requires it).
- `@fhevm/hardhat-plugin` must be the **first** import in `hardhat.config.ts`.
- `etherscan.apiKey` is a **single string** (Etherscan API v2; v1 deprecated).
- Before `confidentialTransferFrom`, call
  `FHE.allowTransient(amount, address(collateral))` (avoids `ACLNotAllowed`).
- `confidentialTransferFrom` does **not** revert on low balance — credit the
  **returned** `euint64`.
- `FHE.div` needs a **plaintext** divisor → only do payout math **after**
  `finalize()` reveals the pools.
- In Hardhat, decrypt pools with `hre.fhevm.publicDecrypt([h1, h2])` →
  `{ clearValues, decryptionProof }`.
- Frontend deploy needs **COOP/COEP** headers (WASM Web Worker + SharedArrayBuffer).

## Common commands
```bash
npm run compile
npm test
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/verify.ts --network sepolia
cd web && npm install --legacy-peer-deps && npm run dev
```

## Build / push
```bash
git push -u origin claude/loving-meitner-VH1fm
```
Retry only on network errors with exponential backoff (2s/4s/8s/16s).

## Design system (session 8 — "Solar Burst", CURRENT)
- **Light theme.** Vivid orange `#f97316` (primary), sky blue `#0ea5e9` (accent), white bg.
  NO dark, NO purple. `--primary: 25 95% 53%`.
- **framer-motion v12** — GlareCard spring (damping=12, scale 1.02, mouse glare).
- **p5.js** generative background (`P5Background.tsx`) — flowing probability particle
  field, seeded (42), pauses on tab hide, fixed -z-10 behind all UI.
- **No emojis anywhere** — all Lucide icons (Lock, Award, Check, AlertTriangle, etc.).
- Market cards show **real odds**: animated YES/NO ProbabilityBar + %, volume, betCount,
  countdown. Empty state: "No bets yet — be the first".
- **ZamaExplainer** = "Public odds, Private positions" 4-step breakdown for judges.
- (Earlier dark-navy/electric-blue look from session 7 was replaced.)

## Lessons learned (avoid repeating)
- Never duplicate `@keyframes` in CSS. Never use quoted `"0%"` syntax in raw CSS `@keyframes` (only valid in Tailwind config JS, not emitted CSS).
- `useTransform` with function arg in framer-motion: `useTransform([a,b], ([x,y]) => ...)` — works in v12.
- For `playwright-core` screenshots, use `domcontentloaded` not `networkidle` (FHEVM SDK hangs network).
- `lightTheme` → `darkTheme` in RainbowKit when switching to dark design.
- Tailwind `bg-amber-50`/`bg-slate-100` etc. are light-only; on dark bg use `/10` opacity variants instead.

## Outstanding
- Link Netlify project `truth-market-app` to GitHub repo + branch (manual; see `MEMORY.md` §8).
- Cloudflare Workers deployment not yet set up (user requested; blocked on wrangler config for Next.js).
