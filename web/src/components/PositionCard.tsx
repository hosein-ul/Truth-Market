"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { toast } from "sonner";
import { ShieldCheck, BadgeCheck } from "lucide-react";
import { marketAbi } from "@/lib/abis";
import { useFhevm } from "@/lib/useFhevm";
import { formatUSDC } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { getLocalPosition } from "@/lib/positions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Your own position is NEVER hidden from you. The bet was composed in this
 * browser, so we show the cleartext stake immediately from local storage. The
 * encryption only hides it from everyone else. An optional "verify on-chain"
 * action decrypts the canonical ciphertext with your wallet signature.
 */
export function PositionCard({ marketAddress }: { marketAddress: `0x${string}` }) {
  const { address, isConnected } = useAccount();
  const { instance } = useFhevm();
  const [local, setLocal] = useState<{ yes: bigint; no: bigint } | null>(null);
  const [verified, setVerified] = useState<{ yes: bigint; no: bigint } | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: hasBet } = useReadContract({
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

  // Nothing to show unless the wallet has a position (locally known or on-chain).
  if (!isConnected || (!hasBet && !local)) return null;

  const shown = verified ?? local ?? { yes: 0n, no: 0n };

  async function verifyOnChain() {
    const inst = instance ?? null;
    if (!inst || !address || !yesHandle || !noHandle) {
      toast.error("Give it a second — preparing the on-chain check.");
      return;
    }
    const toastId = toast.loading("Sign to decrypt your on-chain stake…");
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
      setVerified({
        yes: BigInt(res[yesHandle as string]),
        no: BigInt(res[noHandle as string]),
      });
      toast.success("Verified against the encrypted on-chain stake.", { id: toastId });
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          Your position
        </CardTitle>
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

        {!verified && hasBet && (
          <Button onClick={verifyOnChain} disabled={busy} variant="outline" className="w-full">
            <BadgeCheck className="h-4 w-4" />
            {busy ? "Verifying…" : "Verify on-chain"}
          </Button>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Only your wallet can decrypt this stake. To everyone else — including the
          market creator — it stays encrypted on-chain.
        </p>
      </CardContent>
    </Card>
  );
}
