"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { marketAbi } from "@/lib/abis";

export function ClaimPanel({
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

  const [phase, setPhase] = useState<"idle" | "claiming" | "done" | "error">("idle");
  const [err, setErr] = useState<string>("");

  const { data: hasBet } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "hasBet",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: claimed } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "claimed",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  async function claim() {
    try {
      setPhase("claiming");
      await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "claim",
      });
      setPhase("done");
    } catch (e: any) {
      setErr(String(e?.shortMessage ?? e?.message ?? e));
      setPhase("error");
    }
  }

  return (
    <div className="hairline bg-ink-800/60">
      <div className="px-5 py-3 hairline-b">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone">
          {voided ? "Refund available" : "Claim winnings"}
        </h3>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-bone-dim text-[13px] leading-relaxed">
          {voided ? (
            <>
              This market was voided. Anyone who placed a bet may withdraw
              their full stake. Payout is delivered as confidential USDC —
              only your wallet can decrypt the amount you received.
            </>
          ) : (
            <>
              The market resolved <strong className={outcomeYes ? "text-signal" : "text-bleed"}>{outcomeYes ? "YES" : "NO"}</strong>.
              If you bet on the winning side, you can claim a pro-rata share
              of the total pool. The payout is confidential — only you will
              be able to decrypt it.
            </>
          )}
        </p>

        {isConnected && !hasBet && (
          <div className="hairline bg-ink-900 px-3 py-2.5 font-mono text-[11px] text-bone-dim">
            No position in this market.
          </div>
        )}

        {isConnected && claimed && (
          <div className="hairline bg-ink-900 px-3 py-2.5 font-mono text-[11px] text-bone-dim">
            ✓ Already claimed.
          </div>
        )}

        {phase === "error" && (
          <div className="hairline bg-bleed/10 px-3 py-2.5 font-mono text-[11px] text-bleed">
            ✕ {err}
          </div>
        )}

        <button
          onClick={claim}
          disabled={!isConnected || !hasBet || !!claimed || phase === "claiming"}
          className={isConnected && hasBet && !claimed ? "btn-primary w-full" : "btn-disabled w-full"}
        >
          {phase === "claiming" ? "Claiming…" : voided ? "Withdraw refund" : "Claim payout"}
        </button>
      </div>
    </div>
  );
}
