"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { marketAbi, MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { useFhevm } from "@/lib/useFhevm";
import { getFhevmInstance } from "@/lib/fhevm";

/*
 * OracleControls — tucked-away panel for the designated oracle of a market.
 * Only renders if the connected wallet matches the oracle address. Also
 * exposes the "enable refunds" action to anyone after the dispute window.
 */

export function OracleControls({
  marketAddress,
  oracle,
  deadline,
  disputeWindow,
  status,
}: {
  marketAddress: `0x${string}`;
  oracle: `0x${string}`;
  deadline: number;
  disputeWindow: number;
  status: MarketStatusValue;
}) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string>("");
  const [info, setInfo] = useState<string>("");

  const isOracle = isConnected && address?.toLowerCase() === oracle.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const canResolve = isOracle && status === MARKET_STATUS.OPEN && now >= deadline;
  const canRefund = status === MARKET_STATUS.OPEN && now >= deadline + disputeWindow;
  const canFinalize = status === MARKET_STATUS.RESOLVING;

  if (!isOracle && !canRefund && !canFinalize) return null;

  async function doResolve(outcomeYes: boolean) {
    try {
      setBusy(outcomeYes ? "Resolving YES…" : "Resolving NO…");
      await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "resolve",
        args: [outcomeYes],
      });
      setInfo("Resolution submitted. Pools are now publicly decryptable. Anyone can finalize.");
    } catch (e: any) {
      setErr(human(e));
    } finally {
      setBusy(null);
    }
  }

  // Anyone can finalize: pull the relayer's decryption + KMS proof and
  // post it on-chain. This is the second leg of the two-phase resolution.
  async function doFinalize() {
    try {
      setBusy("Fetching KMS decryption…");
      const instance = await getFhevmInstance();
      // Re-read pool handles
      const { publicClient } = await import("@/lib/viem");
      const [yesH, noH] = await publicClient.multicall({
        allowFailure: false,
        contracts: [
          { address: marketAddress, abi: marketAbi, functionName: "getYesPool" },
          { address: marketAddress, abi: marketAbi, functionName: "getNoPool" },
        ],
      });
      const res = await instance.publicDecrypt([yesH as string, noH as string]);
      // clearValues is keyed by handle; values can be bigint | boolean | string
      const cv = res.clearValues as Record<string, bigint | boolean | string>;
      const yClear = BigInt(cv[yesH as string] as any);
      const nClear = BigInt(cv[noH as string] as any);

      setBusy("Submitting finalization tx…");
      await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "finalize",
        args: [yClear, nClear, res.decryptionProof as `0x${string}`],
      });
      setInfo("Finalized. Winners can claim now.");
    } catch (e: any) {
      setErr(human(e));
    } finally {
      setBusy(null);
    }
  }

  async function doEnableRefunds() {
    try {
      setBusy("Voiding market…");
      await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "enableRefunds",
      });
      setInfo("Market voided. Bettors can withdraw refunds.");
    } catch (e: any) {
      setErr(human(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="hairline bg-ink-800/40">
      <div className="px-5 py-3 hairline-b flex items-center justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone-dim">
          {isOracle ? "Oracle controls" : "Resolution actions"}
        </h3>
        {isOracle && (
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-reveal">
            ◆ you are oracle
          </span>
        )}
      </div>
      <div className="p-5 space-y-3">
        {canResolve && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => doResolve(true)}
              disabled={!!busy}
              className="btn-ghost"
            >
              Resolve YES
            </button>
            <button
              onClick={() => doResolve(false)}
              disabled={!!busy}
              className="btn-ghost"
            >
              Resolve NO
            </button>
          </div>
        )}

        {canFinalize && (
          <button onClick={doFinalize} disabled={!!busy} className="btn-primary w-full">
            Finalize via KMS proof
          </button>
        )}

        {canRefund && (
          <button onClick={doEnableRefunds} disabled={!!busy} className="btn-ghost w-full">
            Enable refunds (dispute timeout)
          </button>
        )}

        {busy && (
          <div className="hairline bg-ink-900 px-3 py-2.5 font-mono text-[11px] text-signal flex items-center gap-2">
            <span className="dot-live" /> {busy}
          </div>
        )}
        {info && (
          <div className="hairline bg-ink-900 px-3 py-2.5 font-mono text-[11px] text-bone-dim">
            ✓ {info}
          </div>
        )}
        {err && (
          <div className="hairline bg-bleed/10 px-3 py-2.5 font-mono text-[11px] text-bleed">
            ✕ {err}
          </div>
        )}
      </div>
    </div>
  );
}

function human(e: any): string {
  const m = String(e?.shortMessage ?? e?.message ?? e ?? "");
  if (m.includes("User rejected")) return "Wallet rejected the transaction.";
  if (m.length > 220) return m.slice(0, 220) + "…";
  return m;
}
