"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { Trophy, RotateCcw, Lock } from "lucide-react";
import { useWalletPicker } from "@/components/WalletPicker";
import { marketAbi } from "@/lib/abis";
import { humanizeError } from "@/lib/errors";
import { publicClient } from "@/lib/viem";
import { Button } from "@/components/ui/button";

export function ClaimCard({
  marketAddress,
  voided,
  outcomeYes,
}: {
  marketAddress: `0x${string}`;
  voided: boolean;
  outcomeYes: boolean;
}) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const walletPicker = useWalletPicker();
  const [busy, setBusy] = useState(false);

  const { data: hasBet } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "hasBet",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: claimed, refetch: refetchClaimed } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "claimed",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  async function handleClaim() {
    const toastId = toast.loading(voided ? "Processing refund…" : "Claiming your payout…");
    try {
      setBusy(true);
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "claim",
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success(
        voided
          ? "Refund sent to your sealed balance."
          : "Payout claimed — it's in your sealed balance.",
        { id: toastId },
      );
      refetchClaimed();
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white">
          {voided ? <RotateCcw className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
        </span>
        <h3 className="font-display text-lg font-bold tracking-tight">
          {voided ? "Refund available" : "Claim your winnings"}
        </h3>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {voided ? (
          <>This market was voided, so every bettor can withdraw their full stake. Your refund is delivered privately to your sealed balance.</>
        ) : (
          <>
            This market settled{" "}
            <strong className={outcomeYes ? "text-yes-fg" : "text-no-fg"}>
              {outcomeYes ? "YES" : "NO"}
            </strong>
            . If you backed the winning side, claim your share of the pool. Your
            payout is private — only your wallet can reveal it.
          </>
        )}
      </p>

      <div className="mt-4">
        {!isConnected ? (
          <Button onClick={walletPicker.open} variant="gradient" className="w-full">
            Connect wallet
          </Button>
        ) : !hasBet ? (
          <div className="rounded-xl bg-secondary px-3 py-2.5 text-sm text-muted-foreground">
            You don't have a position in this market.
          </div>
        ) : claimed ? (
          <div className="flex items-center gap-2 rounded-xl bg-yes-bg px-3 py-2.5 text-sm font-semibold text-yes-fg">
            <Lock className="h-4 w-4" />
            Already claimed — funds are in your sealed balance.
          </div>
        ) : (
          <Button
            onClick={handleClaim}
            disabled={busy}
            variant="gradient"
            size="lg"
            className="w-full"
          >
            {busy ? "Working…" : voided ? "Withdraw refund" : "Claim payout"}
          </Button>
        )}
      </div>
    </div>
  );
}
