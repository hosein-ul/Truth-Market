# TruthMarket — Zama FHE Confidentiality Audit Prompt

Use this prompt with Claude (Computer Use mode) to verify that TruthMarket
transactions are genuinely confidential on Ethereum Sepolia.

---

## Prompt (copy-paste into Claude Computer Use session)

```
You are auditing TruthMarket, a confidential prediction market built on Zama's
FHEVM (Fully Homomorphic Encryption Virtual Machine) on Ethereum Sepolia. Your
job is to verify that bets are ACTUALLY encrypted on-chain — not just claimed
to be.

## Key addresses

- App URL: https://truth-market-app.netlify.app (or localhost:3000)
- MarketFactory: 0x1e7702db95be7CCE29075ad6E5b76fC88B8B3D44
- Confidential USDC (cUSDC, Zama official): 0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639
- Underlying USDC (Zama official): 0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF
- Sepolia Etherscan: https://sepolia.etherscan.io
- Zama official token list: https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia

## Step-by-step audit checklist

### Phase 1: Verify official Zama token addresses

1. Open https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia
2. Confirm these addresses appear on that page:
   - Underlying USDC Mock: 0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF
   - Confidential USDC Mock (cUSDCMock): 0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639
3. Open each on Etherscan and confirm they are verified contracts:
   - https://sepolia.etherscan.io/address/0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF#code
     → Should be "ERC20Mock", verified
   - https://sepolia.etherscan.io/address/0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639#code
     → Should be ERC1967Proxy -> ConfidentialWrapperV3, verified
4. SCREENSHOT each confirmation.

### Phase 2: Verify MarketFactory is using Zama's cUSDC

1. Open https://sepolia.etherscan.io/address/0x1e7702db95be7CCE29075ad6E5b76fC88B8B3D44#readContract
2. Read the `cUsdc()` public variable — it should return 0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639
3. This proves our contract points to Zama's official confidential token.
4. SCREENSHOT.

### Phase 3: Place a test bet and inspect the transaction

1. Open the app and connect a MetaMask wallet (Sepolia network)
2. Get test USDC from the faucet (top bar)
3. Open any market and place a bet (e.g., $25 on YES)
4. After the transaction confirms, open the TX hash on Etherscan
5. Click "Click to decode input data" or view raw input:
   - The function should be `placeBet(bytes32, bytes, bytes32, bytes)`
   - The bytes32 parameters are FHE ciphertext HANDLES — NOT readable numbers
   - The bytes parameters are input PROOFS
   - There should be NO plaintext amount or side visible anywhere
6. SCREENSHOT the transaction input data.

### Phase 4: Verify on-chain state is encrypted

1. Go to the market contract on Etherscan (address from the MarketFactory)
2. Read contract → call `getUserYesStake(YOUR_ADDRESS)`
   - Should return a bytes32 handle (0x...), NOT a number
3. Read contract → call `getUserNoStake(YOUR_ADDRESS)`
   - Should also return a bytes32 handle
4. These handles are references to encrypted values in Zama's FHE coprocessor.
   Without the user's wallet signature, they CANNOT be decrypted.
5. SCREENSHOT.

### Phase 5: Verify event logs reveal nothing

1. On the market contract Etherscan page, go to Events tab
2. Find a "BetPlaced" event from your transaction
3. Verify it has NO indexed parameters — no wallet address, no amount, no side
4. An observer watching events learns only "someone bet on this market" — nothing else.
5. SCREENSHOT.

### Phase 6: Verify the wrap flow (USDC → cUSDC)

1. In the same bet transaction (or the preceding ones), find the `wrap()` call
   to 0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639
2. This converts plaintext USDC into encrypted cUSDC via Zama's official wrapper
3. After wrapping, the user's cUSDC balance is an encrypted handle — not readable
4. Verify by calling `confidentialBalanceOf(YOUR_ADDRESS)` on the cUSDC contract
   → Returns bytes32, not a number.
5. SCREENSHOT.

### Phase 7: Verify the resolve/claim flow

1. If a resolved market exists, inspect the `finalize()` transaction:
   - It should contain a `decryptionProof` (bytes) from Zama's KMS
   - The contract calls `FHE.checkSignatures()` to verify the proof on-chain
2. Inspect the `claim()` transaction:
   - Payout is computed in FHE (encrypted multiplication + division)
   - Transferred via `confidentialTransfer` — amount is encrypted
3. SCREENSHOT.

### Phase 8: Cross-reference source code

1. Open https://sepolia.etherscan.io/address/0x1e7702db95be7CCE29075ad6E5b76fC88B8B3D44#code
2. Find the ConfidentialMarket source (may be in the factory or linked)
3. Verify these patterns exist in the verified source:
   - `FHE.fromExternal(encAmount, amountProof)` — input binding
   - `FHE.select(side, transferred, zero)` — side selection without decryption
   - `FHE.add(yesPoolEnc, yesPart)` — encrypted pool accumulation
   - `FHE.allow(userYesStake[msg.sender], msg.sender)` — ACL per user
   - `confidentialTransferFrom` — encrypted token transfer
   - `FHE.checkSignatures` — KMS proof verification
4. SCREENSHOT the key sections.

## Summary checklist

After completing all phases, confirm:

- [ ] Token addresses match Zama's official docs page
- [ ] Contracts are verified on Etherscan
- [ ] MarketFactory references Zama's official cUSDC
- [ ] placeBet() input data contains only encrypted handles + proofs (no plaintext)
- [ ] getUserYesStake / getUserNoStake return bytes32 handles (not numbers)
- [ ] BetPlaced event has no parameters (anonymous)
- [ ] cUSDC balances are encrypted handles
- [ ] Source code uses FHE.select, FHE.add, FHE.allow, confidentialTransferFrom
- [ ] Finalize uses FHE.checkSignatures for KMS proof verification
- [ ] Claim payouts use confidentialTransfer (encrypted)

If ALL boxes are checked, TruthMarket's confidentiality claims are verified
against Zama's actual protocol implementation.
```

---

## Links for reference

- Zama FHEVM docs: https://docs.zama.org/fhevm
- Zama Protocol addresses (Sepolia): https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia
- OpenZeppelin Confidential Contracts: https://github.com/OpenZeppelin/openzeppelin-confidential-contracts
- ERC-7984 spec: https://eips.ethereum.org/EIPS/eip-7984
- MarketFactory (verified): https://sepolia.etherscan.io/address/0x1e7702db95be7CCE29075ad6E5b76fC88B8B3D44
- cUSDC wrapper (verified): https://sepolia.etherscan.io/address/0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639
- Underlying USDC mock (verified): https://sepolia.etherscan.io/address/0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF
