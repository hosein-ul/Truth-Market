"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { ShieldCheck, ExternalLink, Hourglass, Gavel } from "lucide-react";
import {
  umaResolverAbi,
  oov3Abi,
  erc20MintAbi,
  MARKET_STATUS,
  type MarketStatusValue,
} from "@/lib/abis";
import { ADDRESSES, UMA_OOV3_ADDRESS } from "@/lib/addresses";
import { humanizeError } from "@/lib/errors";
import { publicClient } from "@/lib/viem";
import { formatUSDC, shortAddr } from "@/lib/format";
import { Button } from "@/components/ui/button";

const ZERO_BYTES32 = ("0x" + "0".repeat(64)) as `0x${string}`;

/**
 * Shown instead of OraclePanel for any market whose `oracle` is the
 * UmaResolver. Drives the real UMA OOV3 flow on Sepolia: permissionless
 * assert (bond), liveness countdown, then settle — which triggers the
 * on-chain callback that moves the market to Resolving. This is UMA's
 * optimistic-oracle security model (same as Polymarket's resolution layer):
 * anyone may assert with a bond at stake, anyone may dispute during the
 * window, and only an undisputed assertion resolves the market.
 */
export function UmaResolverPanel({
  marketAddress,
  deadline,
  status,
}: {
  marketAddress: `0x${string}`;
  deadline: number;
  status: MarketStatusValue;
}) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const isOpen = status === MARKET_STATUS.OPEN;
  const pastDeadline = now >= deadline;

  const { data: assertionId, refetch: refetchAssertionId } = useReadContract({
    address: ADDRESSES.umaResolver,
    abi: umaResolverAbi,
    functionName: "marketAssertion",
    args: [marketAddress],
    query: { enabled: isOpen, refetchInterval: 10_000 },
  });
  const pending = !!assertionId && assertionId !== ZERO_BYTES32;

  const { data: assertionInfo } = useReadContract({
    address: ADDRESSES.umaResolver,
    abi: umaResolverAbi,
    functionName: "assertions",
    args: pending ? [assertionId as `0x${string}`] : undefined,
    query: { enabled: pending },
  });

  const { data: oov3Assertion } = useReadContract({
    address: UMA_OOV3_ADDRESS,
    abi: oov3Abi,
    functionName: "getAssertion",
    args: pending ? [assertionId as `0x${string}`] : undefined,
    query: { enabled: pending, refetchInterval: 10_000 },
  });

  const { data: currency } = useReadContract({
    address: ADDRESSES.umaResolver,
    abi: umaResolverAbi,
    functionName: "currency",
  });
  const { data: bond } = useReadContract({
    address: ADDRESSES.umaResolver,
    abi: umaResolverAbi,
    functionName: "effectiveBond",
  });
  const { data: balance } = useReadContract({
    address: currency as `0x${string}` | undefined,
    abi: erc20MintAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!currency && !!address },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: currency as `0x${string}` | undefined,
    abi: erc20MintAbi,
    functionName: "allowance",
    args: address ? [address, ADDRESSES.umaResolver] : undefined,
    query: { enabled: !!currency && !!address },
  });

  const expirationTime = oov3Assertion ? Number(oov3Assertion.expirationTime) : 0;
  const livenessOver = pending && expirationTime > 0 && now >= expirationTime;
  const secondsLeft = expirationTime > now ? expirationTime - now : 0;
  const assertedOutcome = assertionInfo ? (assertionInfo[2] as boolean) : undefined;

  const needsApproval = !!bond && (allowance ?? 0n) < (bond as bigint);
  const insufficientBalance = !!bond && (balance ?? 0n) < (bond as bigint);

  if (!isOpen && status !== MARKET_STATUS.RESOLVING) return null;

  async function doAssert(outcomeYes: boolean) {
    const toastId = toast.loading("Posting bond and asserting outcome to UMA OOV3…");
    try {
      setBusy(true);
      if (needsApproval && currency && bond) {
        toast.loading("Approving the resolver to pull the UMA bond…", { id: toastId });
        const approveHash = await writeContractAsync({
          address: currency as `0x${string}`,
          abi: erc20MintAbi,
          functionName: "approve",
          args: [ADDRESSES.umaResolver, bond as bigint],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        await refetchAllowance();
      }
      toast.loading(`Asserting ${outcomeYes ? "YES" : "NO"} to UMA Optimistic Oracle V3…`, {
        id: toastId,
      });
      const hash = await writeContractAsync({
        address: ADDRESSES.umaResolver,
        abi: umaResolverAbi,
        functionName: "assertMarketOutcome",
        args: [marketAddress, outcomeYes],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetchAssertionId();
      toast.success("Asserted on UMA. Dispute window is now open.", { id: toastId });
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  async function doSettle() {
    const toastId = toast.loading("Settling assertion on UMA OOV3…");
    try {
      setBusy(true);
      const hash = await writeContractAsync({
        address: ADDRESSES.umaResolver,
        abi: umaResolverAbi,
        functionName: "settleAssertion",
        args: [assertionId as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Settled — market resolution callback fired.", { id: toastId });
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zama-300 bg-zama-50 p-5 dark:border-zama-800 dark:bg-zama-400/10">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold tracking-tight text-foreground">
            Resolved via UMA Optimistic Oracle V3
          </h3>
          <p className="text-xs text-zama-800/80 dark:text-zama-300/80">
            Real OOV3 on Sepolia — no trusted oracle key
          </p>
        </div>
      </div>

      {!pastDeadline && (
        <p className="text-sm text-zama-900 dark:text-zama-200">
          Once this market closes, anyone can post a bond and assert the outcome —
          that&apos;s UMA&apos;s optimistic-oracle model (the same layer Polymarket uses).
          If nobody disputes within the liveness window, it settles automatically and
          resolves this market on-chain.
        </p>
      )}

      {pastDeadline && !pending && status === MARKET_STATUS.OPEN && (
        <div className="space-y-3">
          <p className="text-sm text-zama-900 dark:text-zama-200">
            Market closed. Assert the outcome by posting a bond — permissionless, and
            economically secured: a false assertion can be disputed and the bond slashed.
          </p>
          <div className="rounded-lg bg-card/70 px-3 py-2 text-xs text-foreground">
            Bond required:{" "}
            <span className="font-semibold tabular-nums">
              ${formatUSDC((bond as bigint) ?? 0n)} USDC
            </span>
            {currency ? (
              <>
                {" "}
                <a
                  href={`https://sepolia.etherscan.io/token/${currency}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  ({shortAddr(currency as string)})
                </a>
              </>
            ) : null}
          </div>
          {insufficientBalance && isConnected && (
            <p className="text-xs text-destructive">
              Your balance of the bond currency is below the requirement. Get Sepolia
              testnet USDC from{" "}
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                faucet.circle.com
              </a>
              .
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => doAssert(true)} disabled={busy || !isConnected} variant="yes">
              Assert YES
            </Button>
            <Button onClick={() => doAssert(false)} disabled={busy || !isConnected} variant="no">
              Assert NO
            </Button>
          </div>
        </div>
      )}

      {pending && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Hourglass className="h-4 w-4" />
            Asserted: {assertedOutcome ? "YES" : "NO"}
          </div>
          {!livenessOver ? (
            <p className="text-sm text-zama-900 dark:text-zama-200">
              Dispute window open — settles in{" "}
              <span className="font-semibold tabular-nums">{secondsLeft}s</span> if
              unchallenged.
            </p>
          ) : (
            <Button onClick={doSettle} disabled={busy} variant="gradient" className="w-full">
              <Gavel className="h-4 w-4" />
              {busy ? "Settling…" : "Settle assertion"}
            </Button>
          )}
          <a
            href="https://oracle.uma.xyz"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-zama-800 underline dark:text-zama-300"
          >
            View or dispute on the UMA Oracle UI <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {status === MARKET_STATUS.RESOLVING && (
        <p className="text-sm text-zama-900 dark:text-zama-200">
          UMA resolved this market&apos;s outcome. Pools can now be finalized via the
          relayer.
        </p>
      )}
    </div>
  );
}
