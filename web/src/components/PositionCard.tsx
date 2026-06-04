"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { toast } from "sonner";
import { Eye, Lock } from "lucide-react";
import { marketAbi } from "@/lib/abis";
import { useFhevm } from "@/lib/useFhevm";
import { formatUSDC } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { SealedValue } from "./Sealed";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PositionCard({ marketAddress }: { marketAddress: `0x${string}` }) {
  const { address, isConnected } = useAccount();
  const { instance } = useFhevm();
  const [yesClear, setYesClear] = useState<bigint | null>(null);
  const [noClear, setNoClear] = useState<bigint | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: hasBet } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "hasBet",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

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

  if (!isConnected || !hasBet) return null;

  async function reveal() {
    const inst = instance ?? null;
    if (!inst || !address || !yesHandle || !noHandle) {
      toast.error("Give it a second — preparing your secure reveal.");
      return;
    }
    const toastId = toast.loading("Sign in your wallet to reveal your position…");
    try {
      setBusy(true);
      const { privateKey, publicKey } = inst.generateKeypair();
      const startTs = Math.floor(Date.now() / 1000);
      const durDays = 7;
      const eip712 = inst.createEIP712(publicKey, [marketAddress], startTs, durDays);
      const eth = (window as any).ethereum;
      const sig: string = await eth.request({
        method: "eth_signTypedData_v4",
        params: [address, JSON.stringify(eip712)],
      });
      const res = (await inst.userDecrypt(
        [
          { handle: yesHandle as string, contractAddress: marketAddress },
          { handle: noHandle as string, contractAddress: marketAddress },
        ],
        privateKey,
        publicKey,
        sig.replace(/^0x/, ""),
        [marketAddress],
        address,
        startTs,
        durDays,
      )) as Record<string, any>;
      setYesClear(BigInt(res[yesHandle as string]));
      setNoClear(BigInt(res[noHandle as string]));
      toast.success("Position revealed — visible only to you.", { id: toastId });
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  const revealed = yesClear !== null && noClear !== null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-sky-600" />
          Your position
        </CardTitle>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
          Private to you
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border p-3">
            <div className="text-xs font-semibold text-yes-fg">YES stake</div>
            <div className="mt-1">
              {revealed ? (
                <span className="font-display text-xl font-extrabold tabular-nums text-yes-fg">
                  ${formatUSDC(yesClear!)}
                </span>
              ) : (
                <SealedValue size="md" placeholder="$••••" />
              )}
            </div>
          </div>
          <div className="rounded-xl border border-border p-3">
            <div className="text-xs font-semibold text-no-fg">NO stake</div>
            <div className="mt-1">
              {revealed ? (
                <span className="font-display text-xl font-extrabold tabular-nums text-no-fg">
                  ${formatUSDC(noClear!)}
                </span>
              ) : (
                <SealedValue size="md" placeholder="$••••" />
              )}
            </div>
          </div>
        </div>

        {!revealed && (
          <Button onClick={reveal} disabled={busy} variant="outline" className="w-full">
            <Eye className="h-4 w-4" />
            {busy ? "Revealing…" : "Reveal my position"}
          </Button>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Revealing requires a signature from your wallet. Nothing leaves your
          browser, and no one else can decrypt these values.
        </p>
      </CardContent>
    </Card>
  );
}
