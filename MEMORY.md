# TruthMarket — Project Memory

> **Purpose of this file.** A persistent, running log of everything built in this
> project: the goal, the architecture, every decision, every fix, and the steps
> that remain. Update it after each working session so context is never lost
> between conversations. (See also `CLAUDE.md` for the short operating guide.)

**Last updated:** 2026-06-21 (Session 14)
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
- **Session 6 (this one).** Full UI redesign #2 — rejected the dark+lime terminal
  look; rebuilt on **shadcn/ui** with a light, premium "Sealed Markets" language.
  - **Brand:** violet/indigo = privacy; emerald YES / rose NO; soft shadows,
    rounded cards. Fonts: Plus Jakarta Sans (display) + Inter (body).
  - **shadcn primitives** added under `web/src/components/ui/` (button, card,
    badge, input, textarea, label, tabs, select, dialog, dropdown-menu,
    separator, skeleton, tooltip, sonner). Deps: cva, clsx, tailwind-merge,
    lucide-react, sonner, tailwindcss-animate, radix primitives.
  - **Sealed visual** (`Sealed.tsx`): elegant frosted blur + violet shimmer +
    lock — replaces the ASCII glyph scramble.
  - New components: Navbar, SiteFooter, MarketCard (Polymarket-style),
    MarketsExplorer (search/filter/sort), ProbabilityBar, Countdown,
    CategoryChip, MarketStatusBadge, BetForm, ClaimCard, OraclePanel,
    PositionCard, ActivityChart, ActivityList, SettlementCard.
  - Pages rebuilt: Home (hero + value props + explorer), Market detail (2-col,
    responsive), Create (form + live preview), Portfolio (sealed balance reveal,
    claimable/active/history). Removed 16 obsolete components.
  - **FHEVM bug fixed:** `fhevm.ts` now inits eagerly via the RPC URL (not gated
    on wallet) and `useFhevm` is an app-wide `FhevmProvider`. BetForm/OraclePanel
    also `await getFhevmInstance()` directly. "Encryption layer not ready" no
    longer shown.
  - **Jargon hidden:** `lib/errors.ts` `humanizeError()` maps all reverts to
    plain language; UI only says USDC / Deposit / Sealed / Reveal.
  - Responsive verified to 375px via Playwright screenshots. `npm run build` ✓.
  - **Deploy:** Netlify MCP was disconnected this session — could NOT trigger
    deploy programmatically. `netlify.toml` is correct for the new deps
    (`npm install --legacy-peer-deps`, base `web/`, COOP/COEP headers). Pushing
    to the branch auto-deploys **once the GitHub repo link is completed** (still
    the pending manual step — see §8).
- **Session 7 (this one).** Complete visual redesign #3 — dark navy + electric blue (zero purple).
  - **User requirement:** no purple/violet; premium hackathon-winning UI showing Zama infra.
  - **Install:** `framer-motion@^12` added to `web/package.json` (--legacy-peer-deps).
  - **Color system:** replaced `--primary: 258 90% 58%` (violet) with `213 94% 59%` (blue).
    Electric blue (#3b82f6) as primary, cyan (#22d3ee) as accent, gold (#f59e0b) for CTA.
    Dark background #080c16 navy. All Tailwind violet tokens → blue/cyan tokens.
  - **New components:**
    - `GlareCard.tsx` — Framer Motion spring hover (scale 1.02, damping=12, stiffness=180),
      3D tilt via useSpring(mouseX/Y), mouse-tracking radial glare overlay. Also exports `SpringCard`.
    - `HeroTerminal.tsx` — Animated FHE code typewriter showing `euint64/ebool/FHE.select`
      with scan-line animation. Makes Zama tech visually prominent. Client component.
    - `FloatingOrbs.tsx` — CSS-animated glassy orbs (blue, cyan, gold radial gradients)
      + jelly-shaped blobs (border-radius morphing). Client component.
    - `ZamaExplainer.tsx` — 4-card FHEVM step explainer + collateral flow diagram (USDC→cUSDC→placeBet→claim).
      Uses framer-motion whileInView for entrance animations. Key for hackathon judges.
  - **Modified:** MarketCard uses GlareCard; Navbar has layoutId active-link indicator;
    Sealed uses blue palette; all badges/chips use dark-mode-ready tints; RainbowKit darkTheme.
  - **Hero:** Two-column layout: left=headline+CTA+stats, right=HeroTerminal + tech tags. Full-vh.
    FloatingOrbs in background. Animated scrolldown indicator.
  - **CSS fix:** Had duplicate @keyframes shimmer with invalid quoted syntax — cleaned up.
  - `npm run build` ✓, `tsc --noEmit` ✓ (zero errors), Playwright screenshots taken.
  - Commit: `feat: dark navy + electric blue redesign with Framer Motion` pushed to branch.
  - **Lesson:** Avoid duplicate @keyframes blocks and invalid quoted CSS syntax (the
    quoted `"0%"` syntax in Tailwind config keyframes does NOT work in raw CSS @keyframes).
- **Session 8 (this one).** MAJOR rearchitecture + "Solar Burst" redesign.
  - **Privacy model fixed (was backwards):** pools now PUBLIC plaintext
    (`uint256 yesPool/noPool`) so odds/price-discovery work; per-user stakes
    PRIVATE (`euint64` via `FHE.add`) so wallets can't be tracked. `BetPlaced`
    event is anonymous (amount+side, no address).
  - **Contract v2:** `placeBet(uint64 amount, bool side)` plaintext via USDC
    `approve`; contract wraps to cUSDC internally; single-step `resolve()` (no
    finalize/decrypt); added `betCount` + `yesProbabilityBps`; status enum
    Open/Resolved/Voided. Uses `IERC7984ERC20Wrapper`. Factory ctor (usdc, cUsdc).
  - **Redeployed Sepolia:** MarketFactory v2 `0x6702fB99B26CC37292c5b93d5aDFA5789Fa27334`
    (verified). Seeded 3 demo markets + placed live bets → odds 60%/40%/100% YES.
    Updated `web/src/lib/addresses.ts` + FACTORY_DEPLOY_BLOCK=10987800.
  - **Tests rewritten** for plaintext bets — 11/11 passing, pro-rata 375/125/0 verified.
  - **Solar Burst UI (design V1):** light theme, vivid orange + sky blue + white.
    NO dark, NO purple. New `P5Background.tsx` (p5.js generative probability
    particle field — seeded, pauses on tab hide). Market cards show REAL odds
    (ProbabilityBar + % + volume + betCount). Removed ALL emojis → Lucide icons.
    Rewrote ZamaExplainer to "Public odds, Private positions". Deleted dark
    components (HeroTerminal, FloatingOrbs) + v1/v2/v3 demo pages.
  - **Lesson:** `IERC7984` has no `wrap()` — use `IERC7984ERC20Wrapper`. Picked
    user's chosen design (V1 Solar Burst) and built it for real with shadcn/ui.
- **Session 9 (this one).** Faucet + confidential-conversion visual + hero algorithmic art.
  - **On-chain verification first:** confirmed via Sepolia `eth_call` that the Zama
    cUSDC wrapper `0x7c5B…3639` is hard-bound (`underlying()`) to the USDCMock
    `0x9b5C…dFFfF`, and that USDCMock exposes a public `mint(address,uint256)`
    (selector `40c10f19` present in bytecode). Conclusion: **Circle's Sepolia USDC
    CANNOT be wrapped into Zama cUSDC** — the wrapper only accepts that one token.
    So the on-site faucet mints Zama's USDCMock (the only token the wrapper takes).
  - **`Faucet.tsx`** (new): shadcn Dialog faucet. Mints 1,000 test USDCMock to the
    user, shows balance + a USDC→cUSDC mini-explainer. Wired into Navbar (desktop
    "Test USDC" button + mobile menu).
  - **`WrapFlow.tsx`** (new): framer-motion visualization of the REAL on-chain
    wrap that already happens inside `placeBet` (USDC → encrypt/FHE wrap → sealed
    cUSDC), with a traveling token + per-stage captions. `BetForm` now drives it
    through stages mint→approve→wrap→seal→done (replaces the form while active).
  - **`GenerativeHero.tsx`** (new): algorithmic art for the homepage hero — a
    Perlin-noise FLOW FIELD drawn as flowing ribbons that lerp YES-orange → NO-sky,
    seeded (42), re-integrated each frame as noise-z drifts; signal streamlines
    pulse. Mounted behind hero text with a radial mask. (The named Anthropic
    `algorithmic-art` skill was NOT installed this session, so built directly.)
  - **p5 2.x BUG fixed:** p5 `2.3.0` removed `curveVertex` (→ `splineVertex`).
    Both `GenerativeHero` and the pre-existing `P5Background` used `curveVertex`
    and threw `curveVertex is not a function` at runtime (the ambient bg was
    silently broken too). Switched both to `p.vertex` (dense points stay smooth).
  - Verified with playwright-core screenshots: hero ribbons visible, faucet dialog,
    WrapFlow wrap+done states. `npm run build` ✓.
  - **Policy:** per user, changes go out as a **PR** (no self-merge).
- **Session 10 (this one).** Full privacy refactor — make confidentiality real.
  - **Why:** Session 9 audit showed v2's privacy claim was theatrical: amount,
    side, and sender were all visible in calldata + events + pool deltas.
  - **Contract v3 (`ConfidentialMarket.sol` rewritten):**
    - `placeBet(externalEuint64 encAmount, bytes amountProof, externalEbool encSide, bytes sideProof)`:
      FHE.fromExternal → confidentialTransferFrom(user, this, encAmount) → split via FHE.select →
      accumulate encrypted pools + per-user stakes (all euint64).
    - `event BetPlaced()` — anonymous, zero args.
    - Encrypted `yesPoolEnc`/`noPoolEnc` (`euint64`, private).
    - K-anonymity gate `refreshOdds()`: rejects until `betCount - lastSnapshotBetCount >= snapshotBatchK` (default 3); then `FHE.makePubliclyDecryptable` on the CURRENT handles only. Each FHE.add returns new handles, so the ACL doesn't carry over → next bet "stales" the snapshot until another K bets pass.
    - Two-phase resolve: oracle `resolve(bool)` opens public-decrypt; anyone `finalize(yes, no, decryptionProof)` submits + FHE.checkSignatures verifies → `yesPoolFinal`/`noPoolFinal` stored.
    - `claim()` uses **euint128 intermediate** (`FHE.asEuint128 → FHE.mul → FHE.div → FHE.asEuint64`) so `stake × totalPool` can't overflow euint64.
    - Status enum Open(0) / Resolving(1) / Resolved(2) / Voided(3).
  - **MarketFactory v3:** constructor takes only `IERC7984 cUsdc` (no plaintext USDC needed in the contract). Default snapshot K = 3.
  - **Deployed Sepolia (verified):** `MarketFactory v3 = 0x69Dbcf4426dF9f6AD16c035b005635efF22579F6`. Seeded 3 demo markets. Smoke test placed 3 encrypted bets + refreshOdds + public-decrypt: $250 YES / $80 NO → 75.75% YES.
  - **Tests:** 9/9 passing — encrypted bets, K-anon gate, finalize w/ KMS proof, pro-rata payouts (375/125/0), double-claim, void paths.
  - **Frontend rewrite:**
    - ABIs updated for new bet signature + status enum + handles.
    - `BetForm.tsx`: full encrypted flow — checks cUSDC balance + operator, runs top-up (mint USDC → wrap → setOperator) if needed, then `createEncryptedInput.add64.addBool.encrypt()` and submits ciphertexts.
    - `LiveOdds.tsx` (NEW): client-side relayer publicDecrypt of current pool handles (RSC-side calls to SDK fail silently in Next bundling — moved to client where SDK works reliably). Shows "Decrypting K-anon snapshot…" while in flight.
    - `RefreshOddsButton.tsx` (NEW): permissionless refreshOdds with K-anonymity progress indicator.
    - `OraclePanel.tsx` extended for the two-phase resolve → publicDecrypt → finalize path via the relayer.
    - `ActivityList.tsx` rewritten: heterogeneous activity kinds (encrypted bet / snapshot / resolving / settled / voided) — no per-bet amounts or sides.
    - `MarketCard.tsx`, market detail, page.tsx, ZamaExplainer.tsx all updated to match the real model: "Public market. Private positions. K-anonymous odds."
    - `markets.ts` returns encrypted pool handles in addition to (best-effort) cleartext snapshots so the client can finish the job.
  - **Docs:** README rewritten with the explicit privacy table; MEMORY updated.
  - **Notes:** `force-dynamic` on the home page so RSC reads stay live; `serverExternalPackages: ["@zama-fhe/relayer-sdk"]` in next.config to keep the Node SDK out of webpack bundling. Headless playwright cert validation blocks the relayer call to the Zama gateway, but the real browser path works (verified the same publicDecrypt directly in Node).
- **Session 11 (this one).** Landing/dashboard split + UX/copy overhaul from user's 7-point review.
  - **Verification (point 7):** explained on-chain that the bet IS confidential — `placeBet` calldata carries only `externalEuint64`/`externalEbool` handles + ZK proof (etherscan `VerifyInput` `inputType: 5` = euint64, `0` = ebool), the `BetPlaced()` event has zero args, and cUSDC `confidentialTransferFrom` emits only a ciphertext handle. No plaintext amount/side anywhere.
  - **Own position never hidden (point 1):** `lib/positions.ts` keeps a local cleartext record of the user's own bets (the browser composed them). `PositionCard` + `/portfolio` now show the stake immediately; on-chain `userDecrypt` kept as an optional "verify" path. `BetForm` calls `recordLocalBet` on success.
  - **Public odds + demo data (points 2,3):** `lib/demo.ts` — deterministic, address-seeded baseline odds (28–74%), modest volume ($2.1k–$29k) and position counts (11–88), blended with any real on-chain snapshot/finals. No "demo" label. Removed the "Decrypting K-anon snapshot…" placeholder.
  - **Removed resolver mentions (point 2):** `OraclePanel` heading → "Market resolution", dropped "you're the resolver" text; `SettlementCard` dropped the Resolver address line (→ "Settlement: Pro-rata payout").
  - **Copy rewrite (point 4):** researched Polymarket/Kalshi problems (whale-tracking/copy-trading, front-running, permanent belief exposure, herding). New landing copy frames problem→solution→comparison. Removed all K-anonymity jargon from user-facing UI (kept in dev README as the true protocol mechanism). Deleted now-dead `ZamaExplainer`, `LiveOdds`, `RefreshOddsButton`, `GenerativeHero`.
  - **Algorithmic art (point 5):** used the `/mnt/skills/examples/algorithmic-art` skill. Wrote philosophy `web/art/hidden-consensus.md` ("Hidden Consensus" — encrypted private particles aggregating into a public probability field) and implemented `components/art/HiddenConsensus.tsx` (layered Perlin flow field, trail accumulation, polarized orange↔sky local-consensus color, slow z-drift, particle rebirth, seeded, tab-pause).
  - **Landing page (point 5):** new `/` = `components/landing/Landing.tsx` — hero with art + framer-motion, Problem (4 cards), Solution (3 cards), side-by-side comparison table, How-it-works (4 steps), featured markets, final CTA. Solar Burst (orange/sky) palette.
  - **Dashboard split + theme (point 6):** feed moved to `/markets` (new `markets/page.tsx`), detail stays `/markets/[address]`. Added `.theme-dash` (light theme, golden-yellow `--primary` + near-black `--primary-foreground` + black `--accent`) scoped via `layout.tsx` in markets/create/portfolio, and remapped `bg-brand-gradient`→black, `text-gradient`→gold inside it. `Navbar` is theme-aware (adds `theme-dash` on app routes). `P5Background` now renders only on `/`.
  - **Build:** `npm run build` ✓ all routes. Verified screenshots: landing hero (visible flow-field art), problem/solution/comparison sections animate on scroll, dashboard (yellow "New market" button, black logo/chips, demo odds 59/39/62%, $56k vol, 158 positions), market detail (no resolver text). PR #4 updated (same branch).
- **Session 12 (this one).** Five user-review fixes; involved a contract redeploy.
  - **(1) Sealed balance now visible.** Mirror cleartext locally — `lib/balance.ts` tracks every wrap/bet/close in this browser; `/portfolio` shows the cleartext immediately and exposes a small "Verify on-chain" action that runs `userDecrypt` against the canonical ciphertext.
  - **(2) Removed the $500 top-up CTA.** `BetForm` now does just-in-time mint+wrap of exactly the shortfall — single user-facing button "Bet $X on YES/NO — encrypted". A small italic line explains the auto-wrap when needed.
  - **(3) Confidential balance + clearer privacy text.** `BetForm` shows `Confidential balance: $X USDC` at the top. Rewrote the privacy explainer so it doesn't sound browser-only — emphasises end-to-end encryption, that the smart contract operates on the ciphertext, and only the user's wallet can decrypt.
  - **(4) Close position (Polymarket-style exit).** Added `ConfidentialMarket.cashOut()` — pre-resolution full-stake refund using `FHE.sub(yesPoolEnc, userYesStake)` + `confidentialTransfer(total)`, anonymous `event PositionClosed()`. All 9 tests still pass. Wired into `PositionCard` (detail page) and the Active section of `/portfolio` — orange "Close position — get $X back" button, confirms before sending.
  - **(5) Fresh, concrete deadlines.** Rewrote `seed-demo-markets.ts` with UTC-fixed calendar dates anchored to the current real-world date (BTC June 30, Fed July 30, ETH/BTC July 15, SpaceX Aug 31, Apple Sep 2026, Man City PL 2026/27).
  - **Redeploy.** `MarketFactory` v4 → `0x1e7702db95be7CCE29075ad6E5b76fC88B8B3D44` on Sepolia, verified on Etherscan. Re-seeded 6 markets. Updated `web/src/lib/addresses.ts`, ABI (added `cashOut`, `PositionClosed`), `deployments/sepolia/{addresses,demo-markets}.json`.
  - **Build:** all routes ✓. Screenshots verified dashboard with fresh dates (360d, 117d, 87d, 56d countdowns), BetForm with cleartext balance + no $500 prompt.
- **Session 13 (2026-06-06).** Added 30 real Polymarket-inspired markets — metadata, cover images, seed script.
  - **`web/src/lib/market-metadata.ts`** (new): `MarketMeta` interface, `CATEGORY_GRADIENTS` map, `MARKET_META` address→metadata record (3 existing markets by address), and `getMarketMeta(address, question)` — tries address lookup first, falls back to keyword matching for newly deployed markets without an entry.
  - **`web/src/components/MarketCard.tsx`** updated: added `h-36` cover image at card top using `getMarketMeta`, `loading="lazy"`, `crossOrigin="anonymous"`, `onError` fallback to category-coloured gradient. Inner content moved into a `flex-1 flex-col p-4` sub-div; outer div uses `overflow-hidden` to clip image at rounded corners.
  - **`scripts/seed-30-markets.ts`** (new): 30 markets across Crypto (8), Politics (7), Sports (6), Science (4), Finance (3), Other (2). Same pattern as `seed-demo-markets.ts` — reads factory address from `deployments/sepolia/addresses.json`, iterates seeds, waits for `MarketCreated` event, saves to `deployments/sepolia/seed-30-markets.json`. Run with `npx hardhat run scripts/seed-30-markets.ts --network sepolia`.
  - **Category filter** already works via `MarketsExplorer` filtering on `m.category` from on-chain data. No changes needed to filter logic.
  - **Image notes:** Unsplash URLs use `crossOrigin="anonymous"` to satisfy Zama's COEP `require-corp` headers. If a photo returns 404, `onError` automatically falls back to the category gradient. After running the seed script, copy new addresses from `seed-30-markets.json` into `MARKET_META` for exact per-address image assignments.
- **Session 14 (2026-06-21).** Integrated **UMA Optimistic Oracle V3** (real Sepolia deploy) as an optional resolution layer — non-invasive adapter pattern.
  - **Design decisions (user-confirmed):** standalone adapter (not modifying `ConfidentialMarket`); permissionless asserts with bond (UMA-idiomatic); bond currency = `OOV3.defaultCurrency()` with a configurable floor. Market collateral stays Zama cUSDC — UMA bond is a *separate* whitelisted ERC-20.
  - **`contracts/UmaResolver.sol`** (new): installed as a market's `oracle`. `assertMarketOutcome(market, YES/NO)` escrows the bond, calls real `OOV3.assertTruth(claim, asserter=msg.sender, callbackRecipient=this, …)`. `assertionResolvedCallback(id, true)` → `market.resolve(outcome)` → market goes `Resolving`. Disputed/false → clears so it can be re-asserted. Constructor takes ONLY the UMA **Finder** and reads live OOV3 + `defaultCurrency` + `defaultIdentifier` from it (no hardcoded oracle). `liveness` + `bondAmount` floor configurable (`setParams`, owner-gated); effective bond = `max(floor, OOV3.getMinimumBond)`.
  - **`contracts/uma/interfaces/`** (new): vendored minimal `FinderInterface`, `OptimisticOracleV3Interface` (+ `defaultCurrency()`/`defaultLiveness()` getters), `OptimisticOracleV3CallbackRecipientInterface`. AGPL headers preserved.
  - **`config/uma.ts`** (new): UMA Sepolia addresses — Finder `0xf4C48eDAd256326086AEfbd1A53e1896815F8f13`, OOV3 `0xFd9e2642a170aDD10F53Ee14a93FcF2F31924944` (resolved dynamically from Finder; address here is for logging only). Source: `UMAprotocol/protocol` `networks/11155111.json`.
  - **`scripts/deploy-uma-resolver.ts`** (new): deploys `UmaResolver(finder, liveness, bondAmount)`, echoes resolved OOV3/currency/effective-bond, writes `deployments/sepolia/uma-resolver.json`, verifies on Etherscan. Env: `UMA_LIVENESS` (default 120s), `UMA_BOND` (default 0 ⇒ OOV3 min).
  - **`scripts/uma-e2e-demo.ts`** (new): real-Sepolia happy-path demo — create market (oracle=resolver, +90s deadline) → wait deadline → approve+assert (aborts with instructions if asserter lacks bond currency) → wait liveness → `settleAssertion` → assert market is `Resolving` with the asserted outcome. Env `UMA_OUTCOME=YES|NO`.
  - **`docs/UMA.md`** (new) + README pointer: architecture diagram, design points, deploy/demo steps, and the **Sepolia DVM limitation** — happy path is fully real; disputed assertions can't reach final DVM resolution on testnet (DVM not live), so the market stays Open and re-assertable. Mainnet DVM resolves disputes unchanged.
  - **Constraint respected:** per user's "no mock oracle unless asked", added NO local mock OOV3 / unit test for the resolver — verification is the real-Sepolia e2e script. `ConfidentialMarket.sol` + `MarketFactory.sol` untouched; existing 9 tests still pass; `npx hardhat compile` ✓; typechain ✓; new TS files typecheck clean under project tsconfig.
  - **Not yet deployed on-chain** — contracts/scripts ready; run `deploy-uma-resolver.ts` then `uma-e2e-demo.ts` on Sepolia with a funded key + bond currency.
