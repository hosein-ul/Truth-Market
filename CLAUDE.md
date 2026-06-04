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
- `MarketFactory` (ours, verified): `0x2Aed78F76fD40a1BAf6F00BDEe30Ec0ABcb06A30`
- cUSDCMock (Zama official): `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639`
- Underlying USDC (Zama official): `0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF`

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

## Design system (session 7)
- **Color palette:** electric blue `#3b82f6` (primary), cyan `#22d3ee` (accent), gold `#f59e0b`. NO purple/violet.
- **framer-motion v12** installed. GlareCard: spring damping=12, scale 1.02, mouse-tracking glare.
- **HeroTerminal** = animated FHE code typewriter. **FloatingOrbs** = glassy 3D CSS blobs.
- **ZamaExplainer** section on home page — critical for hackathon judges to see FHEVM stack.
- Dark navy background — use `rgba(8,12,22,...)` for glassmorphism overlays.

## Lessons learned (avoid repeating)
- Never duplicate `@keyframes` in CSS. Never use quoted `"0%"` syntax in raw CSS `@keyframes` (only valid in Tailwind config JS, not emitted CSS).
- `useTransform` with function arg in framer-motion: `useTransform([a,b], ([x,y]) => ...)` — works in v12.
- For `playwright-core` screenshots, use `domcontentloaded` not `networkidle` (FHEVM SDK hangs network).
- `lightTheme` → `darkTheme` in RainbowKit when switching to dark design.
- Tailwind `bg-amber-50`/`bg-slate-100` etc. are light-only; on dark bg use `/10` opacity variants instead.

## Outstanding
- Link Netlify project `truth-market-app` to GitHub repo + branch (manual; see `MEMORY.md` §8).
- Cloudflare Workers deployment not yet set up (user requested; blocked on wrangler config for Next.js).
