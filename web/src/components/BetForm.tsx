"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { Lock, Check, BarChart3, Wallet, Cpu } from "lucide-react";
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
import { recordLocalBet } from "@/lib/positions";
import { addToLocalBalance, getLocalBalance } from "@/lib/balance";
import { cn } from "@/lib/utils";

type Side = "YES" | "NO";
const PRESETS = ["10", "25", "50", "100"];

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
  const [localBal, setLocalBal] = useState<bigint>(0n);

  useEffect(() => {
    setLocalBal(getLocalBalance(address));
  }, [address]);

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
  const needsWrap = amountWei > localBal;
  const shortBy = needsWrap ? amountWei - localBal : 0n;

  /**
   * Place a confidential bet. If the user's confidential balance can't cover
   * the bet, we silently top it up by the exact shortfall first — no large
   * pre-fund prompt. Approve→wrap→setOperator happens just-in-time.
   */
  async function handleBet() {
    if (!address) return;
    if (amountWei <= 0n) { toast.error("Enter an amount greater than zero."); return; }
    const toastId = toast.loading("Preparing your confidential bet…");
    try {
      setBusy(true);
      if (!instance) throw new Error("encryption layer not ready");

      // 1. Top up the exact shortfall (mint test USDC + wrap to cUSDC) so the
      //    user only ever funds what this bet needs.
      if (shortBy > 0n) {
        setStage("mint");
        toast.loading(`Minting $${formatUSDC(shortBy, { decimals: 0 })} test USDC…`, { id: toastId });
        const h = await writeContractAsync({
          address: ADDRESSES.underlyingUSDC,
          abi: erc20MintAbi,
          functionName: "mint",
          args: [address, shortBy],
        });
        await publicClient.waitForTransactionReceipt({ hash: h });

        setStage("approve");
        toast.loading("Approving the confidential wrapper…", { id: toastId });
        const ha = await writeContractAsync({
          address: ADDRESSES.underlyingUSDC,
          abi: erc20MintAbi,
          functionName: "approve",
          args: [ADDRESSES.confidentialUSDC, shortBy],
        });
        await publicClient.waitForTransactionReceipt({ hash: ha });

        setStage("wrap");
        toast.loading("Wrapping into confidential cUSDC…", { id: toastId });
        const hw = await writeContractAsync({
          address: ADDRESSES.confidentialUSDC,
          abi: erc7984Abi,
          functionName: "wrap",
          args: [address, shortBy],
        });
        await publicClient.waitForTransactionReceipt({ hash: hw });
        addToLocalBalance(address, shortBy);
      }

      // 2. One-time operator authorization for this market on cUSDC.
      if (!isOp) {
        setStage("approve");
        toast.loading("Authorizing this market on cUSDC…", { id: toastId });
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

      // 3. Encrypt + submit.
      setStage("wrap");
      toast.loading("Encrypting (amount + side) with Zama FHE…", { id: toastId });
      const enc = await instance
        .createEncryptedInput(marketAddress, address)
        .add64(amountWei)
        .addBool(side === "YES")
        .encrypt();

      setStage("seal");
      toast.loading("Submitting confidential bet…", { id: toastId });
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "placeBet",
        args: [toHex(enc.handles[0]), toHex(enc.inputProof), toHex(enc.handles[1]), toHex(enc.inputProof)],
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // 4. Local mirrors: deduct from confidential balance, log the position.
      addToLocalBalance(address, -amountWei);
      recordLocalBet(address, marketAddress, side, amountWei);
      setLocalBal(getLocalBalance(address));

      setStage("done");
      toast.success(`Encrypted bet placed on ${side}.`, { id: toastId });
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

  if (stage !== "idle") return <WrapFlow stage={stage} amount={amount} />;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold tracking-tight">Place a bet</h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
          <Lock className="h-3 w-3" strokeWidth={2.5} />
          Encrypted on-chain
        </span>
      </div>

      {/* Confidential balance — cleartext mirror so the user always sees it */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Wallet className="h-3.5 w-3.5" />
          Confidential balance
        </span>
        <span className="font-display text-sm font-extrabold tabular-nums text-foreground">
          ${formatUSDC(localBal)} <span className="text-[10px] font-semibold text-muted-foreground">USDC</span>
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
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              ${p}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy explainer — emphasise it's the protocol, not just the browser */}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-800">
        <Cpu className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span>
          Your bet stays encrypted from end to end. The amount and side are encrypted
          before they leave your device, and the smart contract operates directly on
          the ciphertext — no node, indexer, or even the contract itself ever sees the
          cleartext. Only your wallet can decrypt your stake.
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2.5">
        {!isConnected ? (
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button onClick={openConnectModal} size="lg" variant="gradient" className="w-full">
                Connect wallet to bet
              </Button>
            )}
          </ConnectButton.Custom>
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
        {needsWrap && amountWei > 0n && isConnected && (
          <p className="text-center text-[11px] text-muted-foreground">
            We&apos;ll mint &amp; wrap the ${formatUSDC(shortBy, { decimals: 0 })} you need automatically — no separate top-up.
          </p>
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
