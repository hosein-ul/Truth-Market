"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { Gavel, ShieldAlert } from "lucide-react";
import { marketAbi, MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { humanizeError } from "@/lib/errors";
import { publicClient } from "@/lib/viem";
import { Button } from "@/components/ui/button";

/*
 * OraclePanel — resolution controls.
 * Resolution is single-step: pools are already public plaintext, so the oracle
 * just records the outcome. A refund-enable safety appears after the window.
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
  const canRefund = status === MARKET_STATUS.OPEN && now >= deadline + disputeWindow;

  if (!isOracle && !canRefund) return null;

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
      toast.success("Outcome recorded. Winners can claim now.", { id: toastId });
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
    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white">
          <Gavel className="h-4 w-4" />
        </span>
        <h3 className="font-display text-base font-bold tracking-tight text-foreground">
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
        {canRefund && (
          <Button onClick={doRefunds} disabled={busy} variant="outline" className="w-full">
            <ShieldAlert className="h-4 w-4" />
            Void market (resolver timed out)
          </Button>
        )}
        {isOracle && status === MARKET_STATUS.OPEN && now < deadline && (
          <p className="text-xs text-orange-700">
            You&apos;re the resolver. You can record the outcome once the market deadline passes.
          </p>
        )}
      </div>
    </div>
  );
}
