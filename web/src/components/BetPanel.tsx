"use client";

import { useState, useMemo } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { encodeFunctionData } from "viem";
import { ADDRESSES } from "@/lib/addresses";
import { erc20MintAbi, erc7984Abi, marketAbi } from "@/lib/abis";
import { formatUSDC, parseUSDC, countdown } from "@/lib/format";
import { EncryptedValue } from "./EncryptedValue";
import { useFhevm } from "@/lib/useFhevm";

/*
 * BetPanel — the primary action surface on a market detail page.
 *
 * UX intent: the user thinks "I deposit USDC, then I bet YES or NO". The
 * panel hides every implementation detail:
 *   - if they don't have cUSDC: we offer "Deposit USDC" which auto-mints
 *     test USDC from the Zama faucet and wraps it
 *   - if the market isn't a registered operator on cUSDC, we set it
 *     transparently as part of the bet click
 *   - amount + side are encrypted client-side via the relayer-sdk before
 *     the placeBet tx is submitted
 *
 * The right rail of the panel always shows the user's confidential balance
 * (encrypted glyphs until they self-decrypt) so they understand state.
 */

type Side = "YES" | "NO";
type Phase =
  | "idle"
  | "needs_wallet"
  | "preparing"
  | "encrypting"
  | "approving_operator"
  | "betting"
  | "confirming"
  | "success"
  | "error";

const OPERATOR_TTL = 60 * 60 * 24 * 30; // 30 days

export function BetPanel({
  marketAddress,
  deadline,
}: {
  marketAddress: `0x${string}`;
  deadline: number;
}) {
  const { address, isConnected } = useAccount();
  const { instance, status: fhevmStatus, error: fhevmError, retry } = useFhevm();
  const { writeContractAsync } = useWriteContract();

  const [side, setSide] = useState<Side>("YES");
  const [amount, setAmount] = useState("10");
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepMsg, setStepMsg] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [errMsg, setErrMsg] = useState<string>("");

  useWaitForTransactionReceipt({ hash: txHash });

  // ── Reads
  const { data: publicBal } = useReadContract({
    address: ADDRESSES.underlyingUSDC,
    abi: erc20MintAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  const { data: cBalHandle } = useReadContract({
    address: ADDRESSES.confidentialUSDC,
    abi: erc7984Abi,
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  const { data: isOperator } = useReadContract({
    address: ADDRESSES.confidentialUSDC,
    abi: erc7984Abi,
    functionName: "isOperator",
    args: address ? [address, marketAddress] : undefined,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  const amountWei = useMemo(() => {
    try {
      return parseUSDC(amount);
    } catch {
      return 0n;
    }
  }, [amount]);

  // ── Deposit USDC = mint(test) + approve + wrap, all in sequence
  async function deposit() {
    if (!address) return;
    try {
      setPhase("preparing");
      const want = amountWei > 0n ? amountWei : parseUSDC("100");
      const cur = (publicBal as bigint | undefined) ?? 0n;

      if (cur < want) {
        setStepMsg("Minting test USDC…");
        const hash = await writeContractAsync({
          address: ADDRESSES.underlyingUSDC,
          abi: erc20MintAbi,
          functionName: "mint",
          args: [address, want - cur],
        });
        setTxHash(hash);
      }

      setStepMsg("Approving wrapper…");
      const ap = await writeContractAsync({
        address: ADDRESSES.underlyingUSDC,
        abi: erc20MintAbi,
        functionName: "approve",
        args: [ADDRESSES.confidentialUSDC, want],
      });
      setTxHash(ap);

      setStepMsg("Sealing into cUSDC…");
      const wr = await writeContractAsync({
        address: ADDRESSES.confidentialUSDC,
        abi: erc7984Abi,
        functionName: "wrap",
        args: [address, want],
      });
      setTxHash(wr);

      setPhase("success");
      setStepMsg("Deposit complete");
    } catch (e: any) {
      setPhase("error");
      setErrMsg(humanError(e));
    } finally {
      setTimeout(() => {
        if (phase !== "error") setPhase("idle");
      }, 1500);
    }
  }

  // ── Place bet flow
  async function placeBet() {
    if (!address) {
      setPhase("needs_wallet");
      return;
    }
    if (!instance) {
      setPhase("error");
      setErrMsg("Encryption layer is not ready yet — try again in a moment.");
      return;
    }
    if (amountWei === 0n) {
      setPhase("error");
      setErrMsg("Enter an amount greater than zero.");
      return;
    }
    try {
      // Make sure the market is an operator on the user's cUSDC, so it can
      // pull collateral. We do this silently when needed.
      if (!isOperator) {
        setPhase("approving_operator");
        setStepMsg("Authorizing market…");
        const expires = Math.floor(Date.now() / 1000) + OPERATOR_TTL;
        const hOp = await writeContractAsync({
          address: ADDRESSES.confidentialUSDC,
          abi: erc7984Abi,
          functionName: "setOperator",
          args: [marketAddress, expires],
        });
        setTxHash(hOp);
      }

      // Encrypt (amount, side) — single input, both proofs share.
      setPhase("encrypting");
      setStepMsg("Encrypting (amount, side) client-side…");
      const enc = await instance
        .createEncryptedInput(marketAddress, address)
        .add64(amountWei)
        .addBool(side === "YES")
        .encrypt();

      const handles = enc.handles.map(toHex0x) as [string, string];
      const proof = toHex0x(enc.inputProof);

      setPhase("betting");
      setStepMsg("Submitting sealed bet…");
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "placeBet",
        args: [handles[0] as `0x${string}`, handles[1] as `0x${string}`, proof as `0x${string}`],
      });
      setTxHash(hash);
      setPhase("confirming");
      setStepMsg("Awaiting confirmation…");
    } catch (e: any) {
      setPhase("error");
      setErrMsg(humanError(e));
    }
  }

  const expired = deadline - Math.floor(Date.now() / 1000) <= 0;
  const cBalKnown = cBalHandle && cBalHandle !== "0x" && cBalHandle !== ZERO32;

  return (
    <div className="hairline bg-ink-800/60">
      <div className="px-5 py-3 hairline-b flex items-center justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone">
          Place sealed bet
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone-dim">
          {expired ? "DEADLINE PASSED" : `T-${countdown(deadline, Math.floor(Date.now() / 1000)).toUpperCase()}`}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {!isConnected && (
          <div className="hairline bg-ink-900 p-3 font-mono text-[11px] text-bone-dim">
            Connect a wallet to place a bet.
          </div>
        )}

        {/* Side toggle */}
        <div className="grid grid-cols-2 gap-px bg-wire hairline">
          <SideButton
            label="YES"
            active={side === "YES"}
            tone="signal"
            onClick={() => setSide("YES")}
          />
          <SideButton
            label="NO"
            active={side === "NO"}
            tone="bleed"
            onClick={() => setSide("NO")}
          />
        </div>

        {/* Amount */}
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim">
              Amount (USDC)
            </label>
            <button
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone-dim hover:text-signal"
              onClick={() => setAmount("100")}
              type="button"
            >
              Max preset
            </button>
          </div>
          <div className="relative hairline bg-ink-900">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              className="w-full bg-transparent px-3 py-3 font-mono num text-[24px] text-bone outline-none"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] tracking-[0.18em] text-bone-dim">
              USDC
            </span>
          </div>
          <div className="mt-2 flex gap-1">
            {["10", "50", "100", "500"].map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className="flex-1 hairline py-1 font-mono text-[10px] text-bone-dim hover:text-bone hover:bg-ink-700"
                type="button"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Wallet state line */}
        {isConnected && (
          <div className="hairline bg-ink-900 px-3 py-2.5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone-dim">
              Your sealed balance
            </span>
            {cBalKnown ? (
              <EncryptedValue revealed={false} width={9} className="text-[13px]" />
            ) : (
              <span className="font-mono num text-[13px] text-bone-dim">
                ${formatUSDC((publicBal as bigint | undefined) ?? 0n)}{" "}
                <span className="text-bone-dark">public</span>
              </span>
            )}
          </div>
        )}

        {/* Phase line */}
        {phase !== "idle" && phase !== "success" && phase !== "error" && (
          <div className="hairline bg-ink-900 px-3 py-2.5 font-mono text-[11px] text-signal flex items-center gap-2">
            <span className="dot-live" />
            {stepMsg}
          </div>
        )}
        {phase === "success" && (
          <div className="hairline bg-ink-900 px-3 py-2.5 font-mono text-[11px] text-signal">
            ✓ {stepMsg}
          </div>
        )}
        {phase === "error" && (
          <div className="hairline bg-bleed/10 px-3 py-2.5 font-mono text-[11px] text-bleed">
            ✕ {errMsg}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={deposit}
            disabled={!isConnected || phase === "preparing"}
            className={isConnected ? "btn-ghost" : "btn-disabled"}
          >
            Deposit USDC
          </button>
          <button
            type="button"
            onClick={placeBet}
            disabled={
              !isConnected ||
              expired ||
              phase === "encrypting" ||
              phase === "betting" ||
              phase === "approving_operator" ||
              phase === "confirming"
            }
            className={
              isConnected && !expired ? "btn-primary" : "btn-disabled"
            }
          >
            {phase === "encrypting"
              ? "Encrypting…"
              : phase === "betting" || phase === "confirming"
                ? "Submitting…"
                : `Place ${side}`}
          </button>
        </div>

        <FhevmStatusLine status={fhevmStatus} error={fhevmError} retry={retry} />
      </div>
    </div>
  );
}

const ZERO32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

function SideButton({
  label,
  active,
  tone,
  onClick,
}: {
  label: string;
  active: boolean;
  tone: "signal" | "bleed";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 font-mono text-[13px] tracking-[0.2em] transition-colors ${
        active
          ? tone === "signal"
            ? "bg-signal text-ink-900"
            : "bg-bleed text-ink-900"
          : "bg-ink-900 text-bone-dim hover:text-bone"
      }`}
    >
      {label}
    </button>
  );
}

function FhevmStatusLine({
  status,
  error,
  retry,
}: {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  retry: () => void;
}) {
  if (status === "ready" || status === "idle") return null;
  return (
    <div className="font-mono text-[10px] tracking-[0.1em] text-bone-dim flex items-center justify-between hairline-t pt-2">
      {status === "loading" ? (
        <span>Initializing encryption layer (Zama relayer)…</span>
      ) : (
        <>
          <span className="text-bleed">{error ?? "Encryption layer failed."}</span>
          <button onClick={retry} className="text-signal underline">
            retry
          </button>
        </>
      )}
    </div>
  );
}

function toHex0x(v: string | Uint8Array): string {
  if (typeof v === "string") return v.startsWith("0x") ? v : "0x" + v;
  let s = "";
  for (let i = 0; i < v.length; i++) s += v[i].toString(16).padStart(2, "0");
  return "0x" + s;
}

function humanError(e: any): string {
  const m = String(e?.shortMessage ?? e?.message ?? e ?? "Unknown error");
  if (m.includes("User rejected")) return "Wallet rejected the transaction.";
  if (m.includes("insufficient funds")) return "Wallet has insufficient ETH for gas.";
  if (m.length > 220) return m.slice(0, 220) + "…";
  return m;
}
