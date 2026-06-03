"use client";

import { useState, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ADDRESSES } from "@/lib/addresses";
import { erc20MintAbi, erc7984Abi, marketAbi } from "@/lib/abis";
import { formatUSDC, parseUSDC, countdown } from "@/lib/format";
import { EncryptedValue } from "./EncryptedValue";
import { useFhevm } from "@/lib/useFhevm";

type Side = "YES" | "NO";
type Phase =
  | "idle"
  | "preparing"
  | "encrypting"
  | "approving_operator"
  | "betting"
  | "confirming"
  | "success"
  | "error";

const OPERATOR_TTL = 60 * 60 * 24 * 30;
const ZERO32 = "0x" + "0".repeat(64);

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
  const [errMsg, setErrMsg] = useState("");

  useWaitForTransactionReceipt({ hash: txHash });

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
    try { return parseUSDC(amount); } catch { return 0n; }
  }, [amount]);

  const expired = deadline - Math.floor(Date.now() / 1000) <= 0;
  const cBalKnown = cBalHandle && cBalHandle !== "0x" && cBalHandle !== ZERO32;
  const busy =
    phase === "preparing" ||
    phase === "encrypting" ||
    phase === "approving_operator" ||
    phase === "betting" ||
    phase === "confirming";

  async function deposit() {
    if (!address) return;
    try {
      setPhase("preparing");
      const want = amountWei > 0n ? amountWei : parseUSDC("100");
      const cur = (publicBal as bigint | undefined) ?? 0n;
      if (cur < want) {
        setStepMsg("Minting test USDC from faucet…");
        const h = await writeContractAsync({
          address: ADDRESSES.underlyingUSDC,
          abi: erc20MintAbi,
          functionName: "mint",
          args: [address, want - cur],
        });
        setTxHash(h);
      }
      setStepMsg("Approving cUSDC wrapper…");
      const ap = await writeContractAsync({
        address: ADDRESSES.underlyingUSDC,
        abi: erc20MintAbi,
        functionName: "approve",
        args: [ADDRESSES.confidentialUSDC, want],
      });
      setTxHash(ap);
      setStepMsg("Sealing USDC into cUSDC…");
      const wr = await writeContractAsync({
        address: ADDRESSES.confidentialUSDC,
        abi: erc7984Abi,
        functionName: "wrap",
        args: [address, want],
      });
      setTxHash(wr);
      setPhase("success");
      setStepMsg("Deposit complete — balance sealed");
    } catch (e: any) {
      setPhase("error");
      setErrMsg(humanError(e));
    }
  }

  async function placeBet() {
    if (!address || !instance) {
      setPhase("error");
      setErrMsg(
        !address
          ? "Connect a wallet first."
          : "Encryption layer not ready — try again in a moment."
      );
      return;
    }
    if (amountWei === 0n) {
      setPhase("error");
      setErrMsg("Enter an amount greater than zero.");
      return;
    }
    try {
      if (!isOperator) {
        setPhase("approving_operator");
        setStepMsg("Authorizing market on your cUSDC…");
        const expires = Math.floor(Date.now() / 1000) + OPERATOR_TTL;
        const h = await writeContractAsync({
          address: ADDRESSES.confidentialUSDC,
          abi: erc7984Abi,
          functionName: "setOperator",
          args: [marketAddress, expires],
        });
        setTxHash(h);
      }
      setPhase("encrypting");
      setStepMsg("Encrypting (amount, side) via Zama FHEVM…");
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
        args: [
          handles[0] as `0x${string}`,
          handles[1] as `0x${string}`,
          proof as `0x${string}`,
        ],
      });
      setTxHash(hash);
      setPhase("confirming");
      setStepMsg("Awaiting on-chain confirmation…");
    } catch (e: any) {
      setPhase("error");
      setErrMsg(humanError(e));
    }
  }

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel-header">
        <span>Sealed Bet</span>
        <span className="font-mono text-[9px] text-bone-dark">
          {expired
            ? "Deadline passed"
            : `Closes in ${countdown(deadline, Math.floor(Date.now() / 1000))}`}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Not connected */}
        {!isConnected && (
          <div className="hairline bg-ink-900/50 px-4 py-3 font-mono text-[11px] text-bone-dim text-center">
            Connect a wallet to place a bet
          </div>
        )}

        {/* Side selector */}
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone-dark mb-2">
            Prediction
          </div>
          <div className="flex gap-px" style={{ boxShadow: "inset 0 0 0 0.5px rgba(46,52,65,1)" }}>
            <button
              type="button"
              onClick={() => setSide("YES")}
              className={`bet-side-btn ${side === "YES" ? "yes-active" : "inactive"}`}
            >
              YES
            </button>
            <button
              type="button"
              onClick={() => setSide("NO")}
              className={`bet-side-btn ${side === "NO" ? "no-active" : "inactive"}`}
            >
              NO
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone-dark mb-2">
            Stake Amount
          </div>
          <div
            className="flex items-center bg-ink-900"
            style={{ boxShadow: "inset 0 0 0 0.5px rgba(46,52,65,1)" }}
          >
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              className="flex-1 bg-transparent px-3 py-3 font-mono num text-[22px] text-bone outline-none"
              placeholder="0"
            />
            <span className="px-3 font-mono text-[11px] uppercase tracking-[0.16em] text-bone-dark flex-shrink-0">
              USDC
            </span>
          </div>
          <div className="mt-1.5 flex gap-1">
            {["10", "50", "100", "500"].map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className="flex-1 btn-ghost-sm"
                type="button"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy proof */}
        <div
          className="bg-ink-900 p-3 space-y-1.5"
          style={{ boxShadow: "inset 0 0 0 0.5px rgba(46,52,65,0.5)" }}
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone-dark mb-2">
            Privacy Guarantee
          </div>
          {[
            { label: "Amount", hint: "Encrypted via FHEVM" },
            { label: "Side", hint: "Encrypted via FHEVM" },
            { label: "Identity", hint: "Sealed on-chain" },
          ].map(({ label, hint }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EncryptedValue revealed={false} width={3} className="text-[10px]" tone="signal" />
                <span className="font-mono text-[10px] text-bone-dim">{label}</span>
              </div>
              <span className="font-mono text-[9px] text-signal">{hint}</span>
            </div>
          ))}
        </div>

        {/* Status messages */}
        {busy && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-ink-900 hairline font-mono text-[11px] text-signal">
            <span className="dot-live" />
            {stepMsg}
          </div>
        )}
        {phase === "success" && (
          <div className="px-3 py-2.5 bg-ink-900 hairline font-mono text-[11px] text-signal">
            ✓ {stepMsg}
          </div>
        )}
        {phase === "error" && (
          <div className="px-3 py-2.5 hairline font-mono text-[11px] text-bleed" style={{ background: "rgba(255,107,91,0.06)" }}>
            ✕ {errMsg}
            <button className="ml-2 underline" onClick={() => setPhase("idle")}>dismiss</button>
          </div>
        )}

        {/* FHEVM status */}
        {isConnected && fhevmStatus === "loading" && (
          <div className="font-mono text-[9px] text-bone-dark">
            Loading Zama encryption layer…
          </div>
        )}
        {isConnected && fhevmStatus === "error" && (
          <div className="flex items-center justify-between font-mono text-[9px]">
            <span className="text-bleed">Encryption layer failed</span>
            <button onClick={retry} className="text-signal underline">retry</button>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={deposit}
            disabled={!isConnected || busy}
            className={isConnected && !busy ? "btn-ghost" : "btn-disabled"}
          >
            + Deposit USDC
          </button>
          <button
            type="button"
            onClick={placeBet}
            disabled={!isConnected || expired || busy || fhevmStatus !== "ready"}
            className={
              isConnected && !expired && !busy && fhevmStatus === "ready"
                ? `btn-primary ${side === "YES" ? "" : "!bg-bleed"}`
                : "btn-disabled"
            }
          >
            {phase === "encrypting"
              ? "Encrypting…"
              : phase === "betting" || phase === "confirming"
                ? "Sealing…"
                : `Bet ${side}`}
          </button>
        </div>

        {/* Balance row */}
        {isConnected && (
          <div className="flex items-center justify-between pt-1 font-mono text-[10px]">
            <span className="text-bone-dark">Sealed balance</span>
            {cBalKnown ? (
              <EncryptedValue revealed={false} width={8} className="text-[11px]" />
            ) : (
              <span className="text-bone-dim">
                ${formatUSDC((publicBal as bigint | undefined) ?? 0n)}
                <span className="text-bone-dark ml-1">public</span>
              </span>
            )}
          </div>
        )}
      </div>
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
  if (m.includes("insufficient funds")) return "Insufficient ETH for gas.";
  if (m.length > 200) return m.slice(0, 200) + "…";
  return m;
}
