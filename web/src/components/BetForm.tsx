"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { Lock, Check, BarChart3, Wallet, Cpu } from "lucide-react";
import { useWalletPicker } from "@/components/WalletPicker";
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
  yesPct,
}: {
  marketAddress: `0x${string}`;
  deadline: number;
  /** Current implied YES probability (0–100) — enables the payout preview. */
  yesPct?: number;
}) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { instance, status: fhStatus } = useFhevm();
  const walletPicker = useWalletPicker();

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

  // Plaintext test-USDC balance — topped up via the faucet, never minted here.
  const { data: rawUsdc, refetch: refetchRaw } = useReadContract({
    address: ADDRESSES.underlyingUSDC,
    abi: erc20MintAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 12000 },
  });
  const underlyingBal = (rawUsdc as bigint | undefined) ?? 0n;

  // Existing allowance toward the cUSDC wrapper. We approve ONCE for an enormous
  // amount, then every later prediction skips approve → saves one signature per
  // bet. allowanceLeft → only need to re-approve when it drops below the wrap
  // amount we're about to ask for.
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ADDRESSES.underlyingUSDC,
    abi: erc20MintAbi,
    functionName: "allowance",
    args: address ? [address, ADDRESSES.confidentialUSDC] : undefined,
    query: { enabled: !!address, refetchInterval: 12000 },
  });
  const allowanceLeft = (allowance as bigint | undefined) ?? 0n;

  const amountWei = useMemo(() => {
    try { return parseUSDC(amount); } catch { return 0n; }
  }, [amount]);

  const expired = deadline - Math.floor(Date.now() / 1000) <= 0;
  const needsWrap = amountWei > localBal;
  const shortBy = needsWrap ? amountWei - localBal : 0n;
  const canCover = shortBy <= underlyingBal;

  // Parimutuel payout preview at the current implied odds: winners split the
  // whole pool pro-rata, so payout ≈ stake / P(side). Estimate only — odds
  // move until the market closes.
  const sidePct = side === "YES" ? yesPct : yesPct !== undefined ? 100 - yesPct : undefined;
  const estPayout =
    sidePct !== undefined && sidePct > 0 && amountWei > 0n
      ? (amountWei * 100n) / BigInt(Math.max(1, Math.round(sidePct)))
      : undefined;
  /** Total spendable: confidential balance + wrappable test USDC. */
  const maxSpend = localBal + underlyingBal;

  async function handleBet() {
    if (!address) return;
    if (amountWei <= 0n) { toast.error("Enter an amount greater than zero."); return; }
    if (shortBy > 0n && !canCover) {
      toast.error('Not enough test USDC — use the faucet at the top to add funds first.');
      return;
    }
    const toastId = toast.loading("Preparing your confidential position…");
    try {
      setBusy(true);
      if (!instance) throw new Error("encryption layer not ready");

      // 1. Wrap the exact shortfall from existing test USDC.
      //    Never mint here — the faucet is the single source of test funds.
      //    Approve happens at most ONCE per wallet (MAX_UINT256). Future
      //    predictions skip straight to wrap.
      if (shortBy > 0n) {
        if (allowanceLeft < shortBy) {
          setStage("approve");
          toast.loading("Approving the confidential wrapper (one-time)…", { id: toastId });
          const MAX = (1n << 256n) - 1n;
          const ha = await writeContractAsync({
            address: ADDRESSES.underlyingUSDC,
            abi: erc20MintAbi,
            functionName: "approve",
            args: [ADDRESSES.confidentialUSDC, MAX],
          });
          await publicClient.waitForTransactionReceipt({ hash: ha });
          refetchAllowance();
        }

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
        refetchRaw();
      }

      // 2. One-time operator authorization for this market on cUSDC.
      //    Authorize until uint48 max (~year 8921) so the user never has to
      //    re-authorize this market again.
      if (!isOp) {
        setStage("approve");
        toast.loading("Authorizing this market on cUSDC (one-time)…", { id: toastId });
        // uint48 max is 2^48 − 1 ≈ 281T, well within Number.MAX_SAFE_INTEGER.
        const UINT48_MAX = 281474976710655;
        const hop = await writeContractAsync({
          address: ADDRESSES.confidentialUSDC,
          abi: erc7984Abi,
          functionName: "setOperator",
          args: [marketAddress, UINT48_MAX],
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
      toast.loading("Submitting confidential position…", { id: toastId });
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
      toast.success(`Position placed on ${side} — encrypted.`, { id: toastId });
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
          This market has closed — predictions are no longer accepted.
        </div>
      </div>
    );
  }

  if (stage !== "idle") return <WrapFlow stage={stage} amount={amount} />;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold tracking-tight">Take a position</h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground">
          <Lock className="h-3 w-3 text-primary" strokeWidth={2.5} />
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
        <div className="mt-2 grid grid-cols-5 gap-2">
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
          <button
            type="button"
            onClick={() => setAmount(formatUSDC(maxSpend, { decimals: 0 }).replace(/,/g, ""))}
            disabled={maxSpend <= 0n}
            className="rounded-lg border border-border py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Payout preview — the number every bettor actually cares about */}
      {estPayout !== undefined && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5">
          <span className="text-xs font-semibold text-muted-foreground">
            To win (at {Math.round(sidePct!)}% implied)
          </span>
          <span className="font-display text-base font-extrabold tabular-nums text-foreground">
            ≈ ${formatUSDC(estPayout)}
          </span>
        </div>
      )}

      {/* Privacy explainer — emphasise it's the protocol, not just the browser */}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.25} />
        <span>
          Your position stays encrypted end to end. Amount and side are sealed before
          leaving your device — the contract operates on ciphertext only. No node,
          indexer, or oracle can read your position. Only your wallet can decrypt it.
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2.5">
        {!isConnected ? (
          <Button onClick={walletPicker.open} size="lg" variant="gradient" className="w-full">
            Connect wallet to predict
          </Button>
        ) : (
          <Button
            onClick={handleBet}
            disabled={busy || amountWei <= 0n || fhStatus !== "ready"}
            size="lg"
            variant={side === "YES" ? "yes" : "no"}
            className="w-full text-base"
          >
            {busy ? "Working…" : `Predict ${side} · $${amount || "0"} sealed`}
          </Button>
        )}
        {needsWrap && amountWei > 0n && isConnected && (
          canCover ? (
            <p className="text-center text-[11px] text-muted-foreground">
              We&apos;ll wrap the ${formatUSDC(shortBy, { decimals: 0 })} shortfall from your test USDC — one extra signature.
            </p>
          ) : (
            <p className="text-center text-[11px] font-medium text-destructive">
              Not enough test USDC. Tap <span className="font-bold">Test USDC</span> at the top to top up first.
            </p>
          )
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
