"use client";

import { useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { EyeOff, Check, Wallet, BarChart3 } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ADDRESSES } from "@/lib/addresses";
import { erc20MintAbi, marketAbi } from "@/lib/abis";
import { formatUSDC, parseUSDC } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { publicClient } from "@/lib/viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WrapFlow, type WrapStage } from "@/components/WrapFlow";
import { cn } from "@/lib/utils";

type Side = "YES" | "NO";
const PRESETS = ["10", "50", "100", "250"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function BetForm({
  marketAddress,
  deadline,
}: {
  marketAddress: `0x${string}`;
  deadline: number;
}) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [side, setSide] = useState<Side>("YES");
  const [amount, setAmount] = useState("25");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<WrapStage>("idle");

  const { data: publicBal, refetch: refetchBal } = useReadContract({
    address: ADDRESSES.underlyingUSDC,
    abi: erc20MintAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 8000 },
  });

  const amountWei = useMemo(() => {
    try {
      return parseUSDC(amount);
    } catch {
      return 0n;
    }
  }, [amount]);

  const expired = deadline - Math.floor(Date.now() / 1000) <= 0;

  async function handleBet() {
    if (!address) return;
    if (amountWei <= 0n) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    const toastId = toast.loading("Preparing your bet…");
    try {
      setBusy(true);

      // 1. Ensure the wallet has enough test USDC (mint if short).
      const cur = (publicBal as bigint | undefined) ?? 0n;
      if (cur < amountWei) {
        setStage("mint");
        toast.loading("Adding test USDC to your wallet…", { id: toastId });
        const hMint = await writeContractAsync({
          address: ADDRESSES.underlyingUSDC,
          abi: erc20MintAbi,
          functionName: "mint",
          args: [address, amountWei - cur],
        });
        await publicClient.waitForTransactionReceipt({ hash: hMint });
      }

      // 2. Approve the market to pull USDC.
      setStage("approve");
      toast.loading("Approving USDC…", { id: toastId });
      const hApprove = await writeContractAsync({
        address: ADDRESSES.underlyingUSDC,
        abi: erc20MintAbi,
        functionName: "approve",
        args: [marketAddress, amountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: hApprove });

      // 3. Place the bet. The SAME tx pulls your USDC, wraps it into Zama's
      //    confidential cUSDC, and records an encrypted per-wallet stake.
      //    Amount + side are public (live odds); your position is encrypted.
      setStage("wrap");
      toast.loading("Converting to cUSDC & placing your bet…", { id: toastId });
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "placeBet",
        args: [amountWei, side === "YES"],
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Visualize the on-chain seal step that just completed.
      setStage("seal");
      await sleep(800);
      setStage("done");
      toast.success(`Bet placed on ${side}. Your position is private.`, {
        id: toastId,
      });
      refetchBal();
      await sleep(1800);
      setStage("idle");
    } catch (e) {
      setStage("error");
      toast.error(humanizeError(e), { id: toastId });
      await sleep(1200);
      setStage("idle");
    } finally {
      setBusy(false);
    }
  }

  if (expired) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          Betting is closed for this market.
        </div>
      </div>
    );
  }

  if (stage !== "idle") {
    return <WrapFlow stage={stage} amount={amount} />;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold tracking-tight">Place a bet</h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
          <EyeOff className="h-3 w-3" strokeWidth={2.5} />
          Private position
        </span>
      </div>

      {/* Side selector */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setSide("YES")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border-2 py-3.5 font-bold transition-all",
            side === "YES"
              ? "border-yes bg-yes-bg text-yes-fg shadow-soft"
              : "border-border bg-card text-muted-foreground hover:border-yes-ring",
          )}
        >
          {side === "YES" && <Check className="h-4 w-4" strokeWidth={3} />}
          YES
        </button>
        <button
          type="button"
          onClick={() => setSide("NO")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border-2 py-3.5 font-bold transition-all",
            side === "NO"
              ? "border-no bg-no-bg text-no-fg shadow-soft"
              : "border-border bg-card text-muted-foreground hover:border-no-ring",
          )}
        >
          {side === "NO" && <Check className="h-4 w-4" strokeWidth={3} />}
          NO
        </button>
      </div>

      {/* Amount */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">Amount</label>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            ${formatUSDC((publicBal as bigint | undefined) ?? 0n, { decimals: 0 })} USDC
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
            $
          </span>
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className="h-14 pl-8 text-2xl font-bold tabular-nums"
            placeholder="0"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            USDC
          </span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              className={cn(
                "rounded-lg border py-1.5 text-sm font-semibold transition-colors",
                amount === p
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              ${p}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-700">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span>
          The odds move when you bet — that&apos;s public. But your cumulative
          position is encrypted on-chain. Nobody can look up your wallet&apos;s
          stake or side.
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2.5">
        {!isConnected ? (
          <div className="flex justify-center [&>div]:w-full [&_button]:w-full">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button onClick={openConnectModal} size="lg" variant="gradient" className="w-full">
                  Connect wallet to bet
                </Button>
              )}
            </ConnectButton.Custom>
          </div>
        ) : (
          <Button
            onClick={handleBet}
            disabled={busy || amountWei <= 0n}
            size="lg"
            variant={side === "YES" ? "yes" : "no"}
            className="w-full text-base"
          >
            {busy ? "Working…" : `Bet $${amount || "0"} on ${side}`}
          </Button>
        )}
      </div>
    </div>
  );
}
