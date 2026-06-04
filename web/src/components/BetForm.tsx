"use client";

import { useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { Lock, Check, BarChart3, ShieldCheck } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ADDRESSES } from "@/lib/addresses";
import { erc20MintAbi, erc7984Abi, marketAbi } from "@/lib/abis";
import { formatUSDC, parseUSDC } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { publicClient } from "@/lib/viem";
import { useFhevm } from "@/lib/useFhevm";
import { toHex } from "@/lib/fhevm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WrapFlow, type WrapStage } from "@/components/WrapFlow";
import { cn } from "@/lib/utils";

type Side = "YES" | "NO";
const PRESETS = ["10", "50", "100", "250"];
const TOPUP_USDC = 500_000_000n; // suggested one-time top-up: 500 USDC

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
  const { instance, status: fhStatus } = useFhevm();

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
  const { data: cBalHandle } = useReadContract({
    address: ADDRESSES.confidentialUSDC,
    abi: erc7984Abi,
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 8000 },
  });
  const { data: isOp, refetch: refetchOp } = useReadContract({
    address: ADDRESSES.confidentialUSDC,
    abi: erc7984Abi,
    functionName: "isOperator",
    args: address ? [address, marketAddress] : undefined,
    query: { enabled: !!address, refetchInterval: 12000 },
  });

  const amountWei = useMemo(() => {
    try { return parseUSDC(amount); } catch { return 0n; }
  }, [amount]);

  const expired = deadline - Math.floor(Date.now() / 1000) <= 0;
  // Heuristic: a brand new user has zero cUSDC handle and zero operator state.
  const ZH = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const hasConfBalance = !!cBalHandle && cBalHandle !== ZH;
  const needsTopUp = !hasConfBalance;
  const needsOperator = !isOp;

  /** Top-up: mint USDC if needed → approve cUSDC wrapper → wrap → setOperator. */
  async function handleTopUp() {
    if (!address) return;
    const toastId = toast.loading("Preparing your confidential balance…");
    try {
      setBusy(true);
      const cur = (publicBal as bigint | undefined) ?? 0n;
      if (cur < TOPUP_USDC) {
        setStage("mint");
        toast.loading("Minting test USDC for the top-up…", { id: toastId });
        const h = await writeContractAsync({
          address: ADDRESSES.underlyingUSDC,
          abi: erc20MintAbi,
          functionName: "mint",
          args: [address, TOPUP_USDC - cur],
        });
        await publicClient.waitForTransactionReceipt({ hash: h });
      }
      setStage("approve");
      toast.loading("Approving wrapper to spend USDC…", { id: toastId });
      const ha = await writeContractAsync({
        address: ADDRESSES.underlyingUSDC,
        abi: erc20MintAbi,
        functionName: "approve",
        args: [ADDRESSES.confidentialUSDC, TOPUP_USDC],
      });
      await publicClient.waitForTransactionReceipt({ hash: ha });

      setStage("wrap");
      toast.loading("Wrapping into confidential cUSDC…", { id: toastId });
      const hw = await writeContractAsync({
        address: ADDRESSES.confidentialUSDC,
        abi: erc7984Abi,
        functionName: "wrap",
        args: [address, TOPUP_USDC],
      });
      await publicClient.waitForTransactionReceipt({ hash: hw });

      // Set this market as cUSDC operator (one-time, 30-day expiry).
      const until = Math.floor(Date.now() / 1000) + 30 * 86400;
      const hop = await writeContractAsync({
        address: ADDRESSES.confidentialUSDC,
        abi: erc7984Abi,
        functionName: "setOperator",
        args: [marketAddress, until],
      });
      await publicClient.waitForTransactionReceipt({ hash: hop });

      setStage("seal");
      await sleep(700);
      setStage("done");
      toast.success("Confidential balance ready — bets are now private.", { id: toastId });
      refetchBal();
      refetchOp();
      await sleep(1600);
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

  /** Encrypted bet: (amount, side) → externalEuint64 + externalEbool + proofs. */
  async function handleBet() {
    if (!address) return;
    if (amountWei <= 0n) { toast.error("Enter an amount greater than zero."); return; }
    const toastId = toast.loading("Encrypting your bet…");
    try {
      setBusy(true);
      if (!instance) throw new Error("encryption layer not ready");

      // Ensure operator is set (cheap recheck — flips false→true after the first bet anyway).
      if (!isOp) {
        setStage("approve");
        toast.loading("Authorizing the market on cUSDC (one-time)…", { id: toastId });
        const until = Math.floor(Date.now() / 1000) + 30 * 86400;
        const hop = await writeContractAsync({
          address: ADDRESSES.confidentialUSDC,
          abi: erc7984Abi,
          functionName: "setOperator",
          args: [marketAddress, until],
        });
        await publicClient.waitForTransactionReceipt({ hash: hop });
        refetchOp();
      }

      setStage("wrap");
      toast.loading("Encrypting bet (amount + side stay sealed)…", { id: toastId });
      const enc = await instance
        .createEncryptedInput(marketAddress, address)
        .add64(amountWei)
        .addBool(side === "YES")
        .encrypt();
      // enc.handles[0] = amount handle, enc.handles[1] = side handle; both share enc.inputProof.

      setStage("seal");
      toast.loading("Submitting confidential placeBet…", { id: toastId });
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "placeBet",
        args: [toHex(enc.handles[0]), toHex(enc.inputProof), toHex(enc.handles[1]), toHex(enc.inputProof)],
      });
      await publicClient.waitForTransactionReceipt({ hash });

      setStage("done");
      toast.success(`Encrypted bet placed on ${side}.`, { id: toastId });
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
          <Lock className="h-3 w-3" strokeWidth={2.5} />
          Encrypted on-chain
        </span>
      </div>

      {/* Confidential balance status */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className={cn("h-3.5 w-3.5", hasConfBalance && isOp ? "text-emerald-600" : "text-amber-600")} />
          Confidential balance
        </span>
        <span className="text-xs font-semibold">
          {hasConfBalance ? (isOp ? "Ready" : "Authorize market") : "Top up needed"}
        </span>
      </div>

      {/* Side */}
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
        <label className="mb-1.5 block text-sm font-semibold text-foreground">Amount</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className="h-14 pl-8 text-2xl font-bold tabular-nums"
            placeholder="0"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">USDC</span>
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

      {/* Privacy explainer */}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-700">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span>
          Your bet (amount + side) is encrypted in your browser with the Zama
          relayer SDK, and the contract operates on the ciphertext. No observer
          can tie this bet — or your cumulative stake — to your wallet.
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
        ) : needsTopUp ? (
          <Button
            onClick={handleTopUp}
            disabled={busy || fhStatus !== "ready"}
            size="lg"
            variant="gradient"
            className="w-full"
          >
            {busy ? "Working…" : `Top up $${TOPUP_USDC / 1_000_000n} once to bet privately`}
          </Button>
        ) : (
          <Button
            onClick={handleBet}
            disabled={busy || amountWei <= 0n || fhStatus !== "ready"}
            size="lg"
            variant={side === "YES" ? "yes" : "no"}
            className="w-full text-base"
          >
            {busy ? "Working…" : `Bet $${amount || "0"} on ${side} — encrypted`}
          </Button>
        )}
        {fhStatus !== "ready" && (
          <p className="text-center text-xs text-muted-foreground">
            Encryption layer warming up…
          </p>
        )}
      </div>
    </div>
  );
}
