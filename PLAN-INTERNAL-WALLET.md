# Plan — Internal (Embedded) Wallet for TruthMarket

A Polymarket-style embedded EOA that lives in the user's browser, signs every
prediction silently, and lets the funding wallet (MetaMask/OKX/Rabby) be used
just **once** for the initial deposit.

---

## Why

Today every prediction triggers between **1 and 4** wallet popups (approve, wrap,
setOperator, placeBet) — exactly the friction that pushed Polymarket toward
embedded wallets. The cryptography we use (Zama FHEVM) does NOT require an
external wallet for `placeBet`: it just needs an EOA that the smart contract
trusts. So we can let a locally-generated key sign everything, while the user's
"real" wallet (the one they own outside TruthMarket) only deposits funds and
withdraws winnings.

The Zama privacy guarantees survive perfectly: the encrypted amount + side is
still tied to that EOA, the contract still only sees ciphertext, and only the
embedded key can decrypt the resulting position handle.

---

## UX

```
┌──────────────────────────────────────────────────────────┐
│  First time on TruthMarket                                │
├──────────────────────────────────────────────────────────┤
│  1. Click "Get started"  → page generates a fresh EOA in  │
│     the browser (random 32-byte key, AES-GCM encrypted in │
│     IndexedDB with a passphrase-derived key OR Web Auth   │
│     biometric).                                           │
│  2. UI shows the embedded address (e.g. 0xAB12…) + a QR.  │
│  3. "Fund your TruthMarket wallet" → opens the user's     │
│     MetaMask/Rabby/OKX with a tx that:                    │
│         a) mints/sends test USDC to the embedded EOA      │
│         b) sends ~0.05 ETH for gas to the embedded EOA    │
│  4. After 1 confirmation: the user is done with MetaMask. │
├──────────────────────────────────────────────────────────┤
│  Every prediction after that:                             │
│   • Slider → amount → YES/NO → Predict                    │
│   • ZERO popups. The embedded key signs locally, dapp     │
│     submits the tx, FHE encryption happens in-tab.        │
├──────────────────────────────────────────────────────────┤
│  Withdraw                                                 │
│   • One-click "Withdraw to my external wallet" → unwrap   │
│     cUSDC → ERC20 USDC → transfer to chosen address (one  │
│     embedded sig, no external popup).                     │
└──────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Next.js client)                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ EmbeddedWalletProvider (React context)                    │  │
│  │  - private key sealed in IndexedDB                        │  │
│  │  - exposes signer (viem WalletClient w/ privateKeyAccount) │  │
│  │  - sign / sendTransaction / signTypedData                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────▼────────────────────────────────────┐  │
│  │ wagmi config — registers the embedded EOA as a connector. │  │
│  │ All existing useWriteContract() calls work unchanged.     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────▼────────────────────────────────────┐  │
│  │ FundingFlow — runs ONCE per device. Uses RainbowKit to    │  │
│  │ connect the user's external wallet, sends USDC + ETH to   │  │
│  │ the embedded address, then tears down the RainbowKit      │  │
│  │ session.                                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼ (RPC, no relayer needed for v1)
                  Sepolia + Zama FHEVM
```

**Key insight:** wagmi already supports multiple connectors. We just add an
"Embedded" connector that wraps a `privateKeyToAccount(key)` from viem. Then the
ENTIRE existing `BetForm.tsx` / `Faucet.tsx` / `Portfolio.tsx` code works
unmodified — they call `useWriteContract`, wagmi routes it to the embedded
signer, no popup.

---

## Security

| Concern | Mitigation |
|--------|-----------|
| Browser key theft (XSS) | Key is sealed with WebCrypto AES-GCM using a key derived from either (a) a user passphrase via Argon2id, or (b) WebAuthn PRF extension (biometric). Plaintext key never lives in JS heap longer than the signing call. |
| Lost device | Show a one-time recovery phrase at setup ("12-word seed for your TruthMarket wallet — write it down"). Optional: encrypted backup to user's existing wallet (signed envelope). |
| Phishing site impersonation | Embedded wallet is bound to the origin (IndexedDB is per-origin). A fake site cannot read it. |
| Replay attacks | Standard EVM nonces. |
| Gas exhaustion | UI shows ETH balance prominently; "Top up gas" button refunds from the external wallet without re-setup. |
| User wants their funds back | "Withdraw to external wallet" works at any time, fully on-chain, no permission needed from anyone. |

The user owns their key entirely — TruthMarket NEVER sees or stores it server-side.

---

## Implementation plan (estimate: 1 well-scoped PR)

### Phase 1 — Embedded signer (no UI changes elsewhere)
1. Add `viem` `privateKeyToAccount` based connector under `src/lib/embedded-wallet/`:
   - `keystore.ts`  — generate / load / unlock the key (WebCrypto + IndexedDB)
   - `connector.ts` — wagmi v2 custom connector that returns the local EOA
   - `useEmbeddedWallet.ts` — React hook: `address`, `status`, `unlock(passphrase)`, `lock()`, `wipe()`
2. Register the connector in `wagmi.ts` alongside existing RainbowKit ones.
3. No UI work yet — existing `useAccount()` returns the embedded address as soon
   as it's unlocked.

### Phase 2 — Onboarding flow
1. New page `/onboarding` (or modal on first visit when localStorage flag is
   absent):
   - **Step A** "Create your TruthMarket wallet" → generate, show address.
   - **Step B** "Back it up" → display recovery phrase, require user to confirm.
   - **Step C** "Fund it" → RainbowKit connects external wallet, sends
     - 50 test USDC via `MockUSDC.transfer` (or call the existing faucet on
       behalf of the embedded address, see Phase 4)
     - 0.05 SepoliaETH for gas
   - **Step D** "Done" → external wallet disconnects, embedded wallet stays.
2. Repeat-funding button: "Add funds to my TruthMarket wallet" — same flow,
   skip key creation.

### Phase 3 — Switch BetForm/Portfolio to the embedded signer
1. Remove the existing approve/wrap/setOperator dance from `BetForm.tsx` and
   instead bundle them into a single multicall executed once per market on
   first prediction. Optional but nice.
2. Loading states are now "Encrypting…" → "Submitting…" with no wallet popups.

### Phase 4 — Withdraw
1. New `WithdrawCard`: enter destination address + amount → unwraps cUSDC to
   USDC inside the contract (already supported), then transfers USDC to dest.
   One embedded signature, no external popup.

### Phase 5 — Polish
1. "Lock" button in the Profile menu — wipes the in-memory plaintext key, asks
   for passphrase next time.
2. Auto-lock after N minutes of inactivity.
3. Export key (for power users who want to import into MetaMask).

---

## Open questions

1. **Gas tank / sponsorship?** Polymarket sponsors gas via a relayer (Biconomy
   / Gelato). For Sepolia testnet we can skip this entirely — users get free
   testnet ETH. For mainnet we'd want sponsorship; out of scope for now.
2. **Recovery phrase UX?** 12-word BIP-39 or single-block hex? BIP-39 is more
   familiar; we generate a real seed and derive a single EOA.
3. **Multi-device sync?** Out of scope for v1. User funds one wallet per
   device; can withdraw + re-fund on another.
4. **Compatibility with existing wallets?** We'll keep the RainbowKit
   connector available behind a "Power user mode" toggle — anyone who wants
   to use MetaMask end-to-end still can.

---

## Estimated effort

- Phase 1 (connector):   half a day
- Phase 2 (onboarding):  one day
- Phase 3 (form rewire): half a day
- Phase 4 (withdraw):    half a day
- Phase 5 (polish):      half a day
- Tests + docs:          half a day

**Total: ≈ 3-4 days of focused work for a clean, demo-ready embedded wallet.**

---

## Recommended next step

Start with Phase 1 only (purely additive — no existing flow changes), wire it
into a `/embedded` route as a preview, confirm it can sign a `placeBet` end-to-
end against Sepolia. If that works (it will — it's just an EOA), we know the
rest of the plan is sound and can roll out behind a feature flag.
