"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useSignTypedData, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { ShieldCheck, BadgeCheck, LogOut } from "lucide-react";
import { marketAbi, MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";
import { useFhevm } from "@/lib/useFhevm";
import { formatUSDC } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { publicClient } from "@/lib/viem";
import { getLocalPosition, setLocalPosition } from "@/lib/positions";
import { addToLocalBalance } from "@/lib/balance";
import { userDecryptHandles, getClear } from "@/lib/userDecrypt";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Your own position is NEVER hidden from you. The bet was composed in this
 * browser, so we show the cleartext stake immediately from local storage. The
 * encryption only hides it from everyone else. The "Verify on-chain" action
 * decrypts the canonical ciphertext with your wallet signature; "Close
 * position" calls cashOut() to withdraw the full stake while the market is
 * still open.
 */
export function PositionCard({
  marketAddress,
  status,
  deadline,
}: {
  marketAddress: `0x${string}`;
  status: MarketStatusValue;
  deadline: number;
}) {
  const { address, isConnected } = useAccount();
  const { instance } = useFhevm();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const [local, setLocal] = useState<{ yes: bigint; no: bigint } | null>(null);
  const [verified, setVerified] = useState<{ yes: bigint; no: bigint } | null>(null);
  const [busy, setBusy] = useState<null | "verify" | "close">(null);
  const [closed, setClosed] = useState(false);

  const { data: hasBet, refetch: refetchHasBet } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "hasBet",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (!address) {
      setLocal(null);
      return;
    }
    const p = getLocalPosition(address, marketAddress);
    setLocal(p ? { yes: BigInt(p.yes), no: BigInt(p.no) } : null);
  }, [address, marketAddress]);

  const { data: yesHandle } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "getUserYesStake",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasBet },
  });
  const { data: noHandle } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "getUserNoStake",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasBet },
  });

  if (!isConnected || closed || (!hasBet && !local)) return null;

  const shown = verified ?? local ?? { yes: 0n, no: 0n };
  const totalStake = shown.yes + shown.no;
  const canClose =
    status === MARKET_STATUS.OPEN && Math.floor(Date.now() / 1000) < deadline && !!hasBet;

  async function verifyOnChain() {
    const inst = instance ?? null;
    if (!inst || !address || !yesHandle || !noHandle) {
      toast.error("Give it a second — preparing the on-chain check.");
      return;
    }
    const toastId = toast.loading("Sign to decrypt your on-chain stake…");
    try {
      setBusy("verify");
      const res = await userDecryptHandles({
        instance: inst,
        wallet: address,
        pairs: [
          { handle: yesHandle as string, contractAddress: marketAddress },
          { handle: noHandle as string, contractAddress: marketAddress },
        ],
        signTypedData: signTypedDataAsync as never,
      });
      const yes = getClear(res, yesHandle as string);
      const no = getClear(res, noHandle as string);
      if (yes === undefined || no === undefined) {
        throw new Error("decryption returned no value");
      }
      setVerified({ yes, no });
      setLocalPosition(address, marketAddress, yes, no); // reconcile the mirror
      toast.success("Verified against the encrypted on-chain stake.", { id: toastId });
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(null);
    }
  }

  async function closePosition() {
    if (!address) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Close this position and withdraw $${formatUSDC(totalStake)} back to your confidential balance?`,
      )
    ) {
      return;
    }
    const toastId = toast.loading("Closing position — full stake will be refunded…");
    try {
      setBusy("close");
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "cashOut",
      });
      await publicClient.waitForTransactionReceipt({ hash });
      addToLocalBalance(address, totalStake);
      setClosed(true);
      refetchHasBet();
      toast.success(`Position closed. $${formatUSDC(totalStake)} returned to your balance.`, {
        id: toastId,
      });
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">Your position</CardTitle>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-3 w-3" />
          {verified ? "Verified on-chain" : "Visible to you only"}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border p-3">
            <div className="text-xs font-semibold text-yes-fg">YES stake</div>
            <div className="mt-1 font-display text-xl font-extrabold tabular-nums text-yes-fg">
              ${formatUSDC(shown.yes)}
            </div>
          </div>
          <div className="rounded-xl border border-border p-3">
            <div className="text-xs font-semibold text-no-fg">NO stake</div>
            <div className="mt-1 font-display text-xl font-extrabold tabular-nums text-no-fg">
              ${formatUSDC(shown.no)}
            </div>
          </div>
        </div>

        {canClose && (
          <Button
            onClick={closePosition}
            disabled={busy !== null}
            variant="outline"
            className="w-full border-no/40 text-no-fg hover:bg-no-bg"
          >
            <LogOut className="h-4 w-4" />
            {busy === "close" ? "Closing…" : `Close position — get $${formatUSDC(totalStake)} back`}
          </Button>
        )}

        {!verified && hasBet && (
          <Button onClick={verifyOnChain} disabled={busy !== null} variant="ghost" className="w-full">
            <BadgeCheck className="h-4 w-4" />
            {busy === "verify" ? "Verifying…" : "Verify on-chain"}
          </Button>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Closing the position refunds your full stake confidentially. Only your wallet
          can decrypt the amount returned — it stays encrypted on-chain.
        </p>
      </CardContent>
    </Card>
  );
}
