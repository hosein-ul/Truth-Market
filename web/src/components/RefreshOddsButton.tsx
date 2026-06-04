"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWriteContract } from "wagmi";
import { toast } from "sonner";
import { RefreshCw, Lock } from "lucide-react";
import { marketAbi } from "@/lib/abis";
import { humanizeError } from "@/lib/errors";
import { publicClient } from "@/lib/viem";
import { Button } from "@/components/ui/button";

/**
 * Permissionless K-anonymity snapshot trigger. Shows up only when enough new
 * bets have accumulated since the last snapshot — the contract enforces this
 * with the snapshotBatchK gate, so this is just a transparent UI hint.
 */
export function RefreshOddsButton({
  marketAddress,
  betsBehindSnapshot,
  snapshotBatchK,
}: {
  marketAddress: `0x${string}`;
  betsBehindSnapshot: number;
  snapshotBatchK: number;
}) {
  const router = useRouter();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const ready = betsBehindSnapshot >= snapshotBatchK;
  const need = Math.max(0, snapshotBatchK - betsBehindSnapshot);

  async function trigger() {
    const toastId = toast.loading("Opening odds snapshot…");
    try {
      setBusy(true);
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "refreshOdds",
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Odds refreshed.", { id: toastId });
      router.refresh();
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
        <Lock className="h-3 w-3" />
        {need} more bet{need > 1 ? "s" : ""} until next snapshot
      </div>
    );
  }
  return (
    <Button
      onClick={trigger}
      disabled={busy}
      variant="outline"
      size="sm"
      className="gap-1.5 border-orange-200 text-orange-700 hover:bg-orange-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
      Refresh odds ({betsBehindSnapshot} new)
    </Button>
  );
}
