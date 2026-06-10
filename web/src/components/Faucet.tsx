"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useWalletPicker } from "@/components/WalletPicker";
import { toast } from "sonner";
import { Droplets, Coins, ArrowRight, Lock, Check } from "lucide-react";
import { ADDRESSES } from "@/lib/addresses";
import { erc20MintAbi } from "@/lib/abis";
import { formatUSDC } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { publicClient } from "@/lib/viem";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MINT_AMOUNT = 1_000_000_000n; // 1,000 USDC (6 decimals)
const AMOUNT_LABEL = "1,000";

/**
 * On-site faucet. Mints Zama's official testnet USDC mock — the SAME underlying
 * token its confidential cUSDC wrapper accepts — so the bet flow can wrap it
 * into encrypted cUSDC on-chain. (Circle's Sepolia USDC can't be used here: the
 * Zama wrapper is bound to this specific token.)
 */
export function Faucet({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const walletPicker = useWalletPicker();
  const [busy, setBusy] = useState(false);
  const [justMinted, setJustMinted] = useState(false);

  const { data: bal, refetch } = useReadContract({
    address: ADDRESSES.underlyingUSDC,
    abi: erc20MintAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  async function handleMint() {
    if (!address) return;
    const toastId = toast.loading("Requesting test USDC…");
    try {
      setBusy(true);
      const hash = await writeContractAsync({
        address: ADDRESSES.underlyingUSDC,
        abi: erc20MintAbi,
        functionName: "mint",
        args: [address, MINT_AMOUNT],
      });
      toast.loading("Minting on Sepolia…", { id: toastId });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success(`${AMOUNT_LABEL} test USDC added to your wallet.`, { id: toastId });
      setJustMinted(true);
      setTimeout(() => setJustMinted(false), 2500);
      refetch();
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Droplets className="h-4 w-4 text-sky-500" />
            <span className="hidden sm:inline">Test USDC</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-gradient text-white shadow-orange-glow">
              <Droplets className="h-4 w-4" />
            </span>
            Get test USDC
          </DialogTitle>
          <DialogDescription>
            Free testnet tokens so you can try the market. No real money — Sepolia only.
          </DialogDescription>
        </DialogHeader>

        {/* balance */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Coins className="h-4 w-4 text-orange-500" />
            Your balance
          </span>
          <span className="font-display text-lg font-extrabold tabular-nums">
            ${formatUSDC((bal as bigint | undefined) ?? 0n, { decimals: 0 })}
          </span>
        </div>

        {/* how it flows */}
        <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-sky-800">
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 shadow-soft">
              <Coins className="h-3.5 w-3.5 text-orange-500" /> USDC
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-sky-400" />
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 shadow-soft">
              <Lock className="h-3.5 w-3.5 text-sky-500" /> cUSDC
            </span>
          </div>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-sky-700/80">
            Step 1 — get test USDC here. On your first bet, the market wraps it
            into Zama&apos;s confidential cUSDC so amounts and sides stay
            encrypted on-chain.
          </p>
        </div>

        {!isConnected ? (
          <Button onClick={walletPicker.open} variant="gradient" size="lg" className="w-full">
            Connect wallet
          </Button>
        ) : (
          <Button
            onClick={handleMint}
            disabled={busy}
            variant={justMinted ? "yes" : "gradient"}
            size="lg"
            className="w-full"
          >
            {justMinted ? (
              <>
                <Check className="h-4 w-4" strokeWidth={3} /> Added {AMOUNT_LABEL} USDC
              </>
            ) : busy ? (
              "Minting…"
            ) : (
              <>
                <Droplets className="h-4 w-4" /> Get {AMOUNT_LABEL} test USDC
              </>
            )}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
