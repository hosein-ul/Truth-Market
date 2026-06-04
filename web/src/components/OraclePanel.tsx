"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { Gavel, ShieldAlert, KeyRound } from "lucide-react";
import { marketAbi, MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { humanizeError } from "@/lib/errors";
import { publicClient } from "@/lib/viem";
import { useFhevm } from "@/lib/useFhevm";
import { Button } from "@/components/ui/button";

/*
 * Resolution is two-phase:
 *   1) Oracle calls resolve(outcome) — opens the pool ciphertexts for public decrypt.
 *   2) ANYONE calls finalize(yes, no, proof) — fetches the cleartext + KMS proof
 *      from the relayer and submits it. FHE.checkSignatures verifies on-chain.
 * After finalize, winners can claim.
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
  const { instance } = useFhevm();
  const [busy, setBusy] = useState(false);

  const { data: yesHandle } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "getYesPoolHandle",
    query: { enabled: status === MARKET_STATUS.RESOLVING },
  });
  const { data: noHandle } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "getNoPoolHandle",
    query: { enabled: status === MARKET_STATUS.RESOLVING },
  });

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
    const toastId = toast.loading("Fetching KMS-decrypted pools from the Zama relayer…");
    try {
      setBusy(true);
      if (!instance) throw new Error("encryption layer not ready");
      if (!yesHandle || !noHandle) throw new Error("pool handles unavailable");
      const res = (await instance.publicDecrypt([yesHandle as string, noHandle as string])) as any;
      const clear = res.clearValues ?? res; // SDK shapes vary slightly
      const proof: string = res.decryptionProof ?? res.proof ?? "0x";
      const yesClear = BigInt(clear[yesHandle as string] ?? clear[0]);
      const noClear = BigInt(clear[noHandle as string] ?? clear[1]);

      toast.loading("Submitting cleartext pools + KMS proof on-chain…", { id: toastId });
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "finalize",
        args: [yesClear, noClear, proof as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Pools finalized — winners can claim.", { id: toastId });
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
          {canFinalize ? "Finalize pools" : isOracle ? "Resolver controls" : "Resolution"}
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
          <>
            <Button onClick={doFinalize} disabled={busy} variant="gradient" className="w-full">
              <KeyRound className="h-4 w-4" />
              {busy ? "Working…" : "Finalize via KMS proof"}
            </Button>
            <p className="text-xs text-orange-700/80">
              Permissionless — anyone can submit. Pulls the cleartext pools from the
              Zama relayer with a KMS signature; the contract verifies it.
            </p>
          </>
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
