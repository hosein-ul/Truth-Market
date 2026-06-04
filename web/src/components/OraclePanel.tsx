"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { Gavel, ShieldAlert } from "lucide-react";
import { marketAbi, MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { humanizeError } from "@/lib/errors";
import { getFhevmInstance } from "@/lib/fhevm";
import { publicClient } from "@/lib/viem";
import { Button } from "@/components/ui/button";

/*
 * OraclePanel — resolution controls.
 * Renders for the market's resolver (oracle), and exposes "finalize" to anyone
 * once the market is resolving, plus a refund-enable safety after the window.
 */
export function OraclePanel({
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
  const [busy, setBusy] = useState(false);

  const isOracle = isConnected && address?.toLowerCase() === oracle.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const canResolve = isOracle && status === MARKET_STATUS.OPEN && now >= deadline;
  const canFinalize = status === MARKET_STATUS.RESOLVING;
  const canRefund = status === MARKET_STATUS.OPEN && now >= deadline + disputeWindow;

  if (!isOracle && !canFinalize && !canRefund) return null;

  async function doResolve(outcomeYes: boolean) {
    const toastId = toast.loading(`Recording outcome: ${outcomeYes ? "YES" : "NO"}…`);
    try {
      setBusy(true);
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "resolve",
        args: [outcomeYes],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Outcome recorded. Anyone can now finalize the pools.", { id: toastId });
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  async function doFinalize() {
    const toastId = toast.loading("Revealing final pools…");
    try {
      setBusy(true);
      const instance = await getFhevmInstance();
      const [yesH, noH] = await publicClient.multicall({
        allowFailure: false,
        contracts: [
          { address: marketAddress, abi: marketAbi, functionName: "getYesPool" },
          { address: marketAddress, abi: marketAbi, functionName: "getNoPool" },
        ],
      });
      const res = await instance.publicDecrypt([yesH as string, noH as string]);
      const cv = res.clearValues as Record<string, bigint | boolean | string>;
      const yClear = BigInt(cv[yesH as string] as any);
      const nClear = BigInt(cv[noH as string] as any);

      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "finalize",
        args: [yClear, nClear, res.decryptionProof as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Market finalized. Winners can claim now.", { id: toastId });
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  async function doRefunds() {
    const toastId = toast.loading("Voiding market…");
    try {
      setBusy(true);
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "enableRefunds",
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Market voided. Bettors can withdraw refunds.", { id: toastId });
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600 text-white">
          <Gavel className="h-4 w-4" />
        </span>
        <h3 className="font-display text-base font-bold tracking-tight text-violet-900">
          {isOracle ? "Resolver controls" : "Resolution"}
        </h3>
      </div>

      <div className="space-y-2.5">
        {canResolve && (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => doResolve(true)} disabled={busy} variant="yes">
              Resolve YES
            </Button>
            <Button onClick={() => doResolve(false)} disabled={busy} variant="no">
              Resolve NO
            </Button>
          </div>
        )}
        {canFinalize && (
          <Button onClick={doFinalize} disabled={busy} variant="gradient" className="w-full">
            {busy ? "Working…" : "Reveal final pools & finalize"}
          </Button>
        )}
        {canRefund && (
          <Button onClick={doRefunds} disabled={busy} variant="outline" className="w-full">
            <ShieldAlert className="h-4 w-4" />
            Void market (resolver timed out)
          </Button>
        )}
        {isOracle && status === MARKET_STATUS.OPEN && now < deadline && (
          <p className="text-xs text-violet-700">
            You're the resolver. You can record the outcome once the market deadline passes.
          </p>
        )}
      </div>
    </div>
  );
}
