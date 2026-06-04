"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { toast } from "sonner";
import { Lock, ShieldCheck, Wallet, Check } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ADDRESSES } from "@/lib/addresses";
import { erc20MintAbi, erc7984Abi, marketAbi } from "@/lib/abis";
import { formatUSDC, parseUSDC } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { useFhevm } from "@/lib/useFhevm";
import { getFhevmInstance, toHex } from "@/lib/fhevm";
import { publicClient } from "@/lib/viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Side = "YES" | "NO";
const OPERATOR_TTL = 60 * 60 * 24 * 30;
const PRESETS = ["10", "50", "100", "250"];

export function BetForm({
  marketAddress,
  deadline,
}: {
  marketAddress: `0x${string}`;
  deadline: number;
}) {
  const { address, isConnected } = useAccount();
  const { status: fhevmStatus } = useFhevm();
  const { writeContractAsync } = useWriteContract();

  const [side, setSide] = useState<Side>("YES");
  const [amount, setAmount] = useState("25");
  const [busy, setBusy] = useState(false);

  const { data: publicBal, refetch: refetchPublic } = useReadContract({
    address: ADDRESSES.underlyingUSDC,
    abi: erc20MintAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 8000 },
  });

  const { data: cBalHandle, refetch: refetchSealed } = useReadContract({
    address: ADDRESSES.confidentialUSDC,
    abi: erc7984Abi,
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 8000 },
  });

  const { data: isOperator, refetch: refetchOperator } = useReadContract({
    address: ADDRESSES.confidentialUSDC,
    abi: erc7984Abi,
    functionName: "isOperator",
    args: address ? [address, marketAddress] : undefined,
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
  const hasSealedFunds =
    !!cBalHandle &&
    cBalHandle !== "0x" &&
    cBalHandle !== "0x" + "0".repeat(64);

  async function handleDeposit() {
    if (!address) return;
    const want = amountWei > 0n ? amountWei : parseUSDC("100");
    const toastId = toast.loading("Preparing your deposit…");
    try {
      setBusy(true);
      const cur = (publicBal as bigint | undefined) ?? 0n;
      if (cur < want) {
        toast.loading("Adding test USDC to your wallet…", { id: toastId });
        const h = await writeContractAsync({
          address: ADDRESSES.underlyingUSDC,
          abi: erc20MintAbi,
          functionName: "mint",
          args: [address, want - cur],
        });
        await publicClient.waitForTransactionReceipt({ hash: h });
      }

      toast.loading("Confirming your USDC…", { id: toastId });
      const ap = await writeContractAsync({
        address: ADDRESSES.underlyingUSDC,
        abi: erc20MintAbi,
        functionName: "approve",
        args: [ADDRESSES.confidentialUSDC, want],
      });
      await publicClient.waitForTransactionReceipt({ hash: ap });

      toast.loading("Sealing your funds…", { id: toastId });
      const wr = await writeContractAsync({
        address: ADDRESSES.confidentialUSDC,
        abi: erc7984Abi,
        functionName: "wrap",
        args: [address, want],
      });
      await publicClient.waitForTransactionReceipt({ hash: wr });

      toast.success(`Deposited $${formatUSDC(want)} into your sealed balance`, {
        id: toastId,
      });
      refetchPublic();
      refetchSealed();
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  async function handleBet() {
    if (!address) return;
    if (amountWei <= 0n) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    const toastId = toast.loading("Sealing your bet…");
    try {
      setBusy(true);

      // Authorize the market to move sealed funds (silent, one-time).
      if (!isOperator) {
        toast.loading("Authorizing this market…", { id: toastId });
        const expires = Math.floor(Date.now() / 1000) + OPERATOR_TTL;
        const hOp = await writeContractAsync({
          address: ADDRESSES.confidentialUSDC,
          abi: erc7984Abi,
          functionName: "setOperator",
          args: [marketAddress, expires],
        });
        await publicClient.waitForTransactionReceipt({ hash: hOp });
        refetchOperator();
      }

      // Encryption layer — await directly so we never block on "not ready".
      toast.loading("Encrypting your position…", { id: toastId });
      const instance = await getFhevmInstance();
      const enc = await instance
        .createEncryptedInput(marketAddress, address)
        .add64(amountWei)
        .addBool(side === "YES")
        .encrypt();

      toast.loading("Submitting your sealed bet…", { id: toastId });
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "placeBet",
        args: [toHex(enc.handles[0]), toHex(enc.handles[1]), toHex(enc.inputProof)],
      });
      await publicClient.waitForTransactionReceipt({ hash });

      toast.success(`Sealed bet placed on ${side}. Your position is private.`, {
        id: toastId,
      });
      refetchSealed();
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  if (expired) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Lock className="h-4 w-4" />
          Betting is closed for this market.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold tracking-tight">Place a bet</h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
          <Lock className="h-3 w-3" strokeWidth={2.5} />
          Sealed
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
            {hasSealedFunds ? "Funds ready" : "Deposit to fund"}
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
                  ? "border-primary/30 bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              ${p}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-xs leading-relaxed text-violet-700">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span>
          Your amount and side are encrypted before they leave your browser.
          No one can see your position until the market settles.
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
          <>
            <Button
              onClick={handleBet}
              disabled={busy || amountWei <= 0n}
              size="lg"
              variant={side === "YES" ? "yes" : "no"}
              className="w-full text-base"
            >
              {busy ? "Working…" : `Place sealed bet on ${side}`}
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={busy}
              variant="outline"
              className="w-full"
            >
              + Deposit USDC
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Wallet balance: ${formatUSDC((publicBal as bigint | undefined) ?? 0n)} USDC
              {fhevmStatus === "ready" && (
                <span className="ml-1.5 inline-flex items-center gap-1 text-violet-600">
                  · <Lock className="h-3 w-3" /> encryption ready
                </span>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
