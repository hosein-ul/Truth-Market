"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useSignTypedData, useWriteContract } from "wagmi";
import { toast } from "sonner";
import Link from "next/link";
import {
  Eye,
  Wallet,
  Lock,
  Trophy,
  Inbox,
  LogOut,
  Hourglass,
  BadgeCheck,
  PieChart,
} from "lucide-react";
import { useWalletPicker } from "@/components/WalletPicker";
import { publicClient } from "@/lib/viem";
import { ADDRESSES } from "@/lib/addresses";
import { marketFactoryAbi, marketAbi, erc7984Abi, MARKET_STATUS } from "@/lib/abis";
import { useFhevm } from "@/lib/useFhevm";
import { formatUSDC } from "@/lib/format";
import { humanizeError } from "@/lib/errors";
import { getLocalPosition, setLocalPosition } from "@/lib/positions";
import { getLocalBalance, addToLocalBalance, setLocalBalance } from "@/lib/balance";
import {
  userDecryptHandles,
  getClear,
  isZeroHandle,
  hasCachedSession,
  type DecryptPair,
} from "@/lib/userDecrypt";
import { SealedValue } from "@/components/Sealed";
import { CategoryChip } from "@/components/CategoryChip";
import { MarketStatusBadge } from "@/components/MarketStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Position {
  market: `0x${string}`;
  question: string;
  category: string;
  status: number;
  outcomeYes: boolean;
  claimed: boolean;
  yesHandle: `0x${string}`;
  noHandle: `0x${string}`;
  /** Cleartext stakes — from the local mirror instantly, then verified on-chain. */
  yesClear?: bigint;
  noClear?: bigint;
  verified: boolean;
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { instance, status: fhevmStatus } = useFhevm();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const walletPicker = useWalletPicker();

  const [positions, setPositions] = useState<Position[] | null>(null);
  const [balHandle, setBalHandle] = useState<`0x${string}` | null>(null);
  const [bal, setBal] = useState<bigint | null>(null);
  const [balVerified, setBalVerified] = useState(false);
  const [busyClaim, setBusyClaim] = useState<string | null>(null);
  const [busyClose, setBusyClose] = useState<string | null>(null);
  const [busyReveal, setBusyReveal] = useState(false);

  const load = useCallback(async () => {
    if (!address) return;
    const len = await publicClient.readContract({
      address: ADDRESSES.marketFactory,
      abi: marketFactoryAbi,
      functionName: "marketsLength",
    });
    const n = Number(len);

    const cBal = await publicClient.readContract({
      address: ADDRESSES.confidentialUSDC,
      abi: erc7984Abi,
      functionName: "confidentialBalanceOf",
      args: [address],
    });
    setBalHandle(cBal as `0x${string}`);

    if (n === 0) {
      setPositions([]);
      return;
    }
    const all = await publicClient.readContract({
      address: ADDRESSES.marketFactory,
      abi: marketFactoryAbi,
      functionName: "listMarkets",
      args: [0n, BigInt(n)],
    });
    const flags = await publicClient.multicall({
      allowFailure: true,
      contracts: all.map(
        (m) =>
          ({
            address: m.market,
            abi: marketAbi,
            functionName: "hasBet",
            args: [address],
          }) as const,
      ),
    });
    const mine = all.filter((_, i) => flags[i].status === "success" && flags[i].result);
    if (mine.length === 0) {
      setPositions([]);
      return;
    }
    const details = await publicClient.multicall({
      allowFailure: false,
      contracts: mine.flatMap(
        (m) =>
          [
            { address: m.market, abi: marketAbi, functionName: "status" },
            { address: m.market, abi: marketAbi, functionName: "outcomeYes" },
            { address: m.market, abi: marketAbi, functionName: "claimed", args: [address] },
            { address: m.market, abi: marketAbi, functionName: "getUserYesStake", args: [address] },
            { address: m.market, abi: marketAbi, functionName: "getUserNoStake", args: [address] },
          ] as const,
      ),
    });
    const result: Position[] = mine.map((m, i) => {
      // Your own position is never hidden from you: surface the cleartext stake
      // from this browser's local record immediately. On-chain it stays encrypted.
      const lp = getLocalPosition(address, m.market);
      return {
        market: m.market,
        question: m.question,
        category: m.category,
        status: Number(details[i * 5]),
        outcomeYes: Boolean(details[i * 5 + 1]),
        claimed: Boolean(details[i * 5 + 2]),
        yesHandle: details[i * 5 + 3] as `0x${string}`,
        noHandle: details[i * 5 + 4] as `0x${string}`,
        yesClear: lp ? BigInt(lp.yes) : undefined,
        noClear: lp ? BigInt(lp.no) : undefined,
        verified: false,
      };
    });
    setPositions(result);
  }, [address]);

  useEffect(() => {
    if (!address) {
      setPositions(null);
      setBal(null);
      setBalVerified(false);
      return;
    }
    // The browser composed every wrap/bet/claim — show the cleartext mirror
    // immediately. On-chain ciphertext remains the authoritative source.
    setBal(getLocalBalance(address));
    setBalVerified(false);
    load().catch((e) => {
      console.error(e);
      setPositions([]);
    });
  }, [address, load]);

  /** Contracts a full reveal touches: cUSDC (balance) + every market with a bet. */
  const revealContracts = useMemo(() => {
    const list: `0x${string}`[] = [];
    if (balHandle && !isZeroHandle(balHandle)) list.push(ADDRESSES.confidentialUSDC);
    for (const p of positions ?? []) list.push(p.market);
    return list;
  }, [balHandle, positions]);

  /**
   * Reveal EVERYTHING (balance + all positions) with a single wallet
   * signature — the EIP-712 request covers the whole contract list at once.
   */
  const revealAll = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!instance || !address) {
        if (!opts?.silent) toast.error("Give it a second — preparing your secure reveal.");
        return;
      }
      const pairs: DecryptPair[] = [];
      if (balHandle && !isZeroHandle(balHandle)) {
        pairs.push({ handle: balHandle, contractAddress: ADDRESSES.confidentialUSDC });
      }
      for (const p of positions ?? []) {
        if (!isZeroHandle(p.yesHandle)) pairs.push({ handle: p.yesHandle, contractAddress: p.market });
        if (!isZeroHandle(p.noHandle)) pairs.push({ handle: p.noHandle, contractAddress: p.market });
      }
      if (pairs.length === 0) {
        if (!opts?.silent) toast.info("Nothing to reveal yet — place a bet or deposit first.");
        return;
      }
      const toastId = opts?.silent
        ? undefined
        : toast.loading("One signature reveals your balance and every position…");
      try {
        setBusyReveal(true);
        const res = await userDecryptHandles({
          instance,
          wallet: address,
          pairs,
          signTypedData: signTypedDataAsync as never,
        });
        const balClear = getClear(res, balHandle);
        if (balClear !== undefined) {
          setBal(balClear);
          setBalVerified(true);
          setLocalBalance(address, balClear); // reconcile the mirror
        }
        setPositions((prev) =>
          prev
            ? prev.map((p) => {
                const yes = getClear(res, p.yesHandle);
                const no = getClear(res, p.noHandle);
                if (yes === undefined && no === undefined) return p;
                const next = {
                  ...p,
                  yesClear: yes ?? p.yesClear,
                  noClear: no ?? p.noClear,
                  verified: true,
                };
                if (yes !== undefined && no !== undefined) {
                  setLocalPosition(address, p.market, yes, no);
                }
                return next;
              })
            : prev,
        );
        if (toastId) toast.success("Verified on-chain — visible only to you.", { id: toastId });
      } catch (e) {
        if (toastId) toast.error(humanizeError(e), { id: toastId });
      } finally {
        setBusyReveal(false);
      }
    },
    [instance, address, balHandle, positions, signTypedDataAsync],
  );

  // If a still-valid reveal session is cached (same tab), refresh silently —
  // no popup, and the user lands on verified numbers instead of the mirror.
  const canSilentReveal =
    fhevmStatus === "ready" &&
    !!address &&
    positions !== null &&
    revealContracts.length > 0 &&
    hasCachedSession(address, revealContracts);
  useEffect(() => {
    if (canSilentReveal) void revealAll({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSilentReveal]);

  async function closePosition(p: Position) {
    if (!address) return;
    const stake = (p.yesClear ?? 0n) + (p.noClear ?? 0n);
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Close this position and withdraw $${formatUSDC(stake)} back to your confidential balance?`,
      )
    ) {
      return;
    }
    const toastId = toast.loading("Closing position — full stake will be refunded…");
    try {
      setBusyClose(p.market);
      const hash = await writeContractAsync({
        address: p.market,
        abi: marketAbi,
        functionName: "cashOut",
      });
      await publicClient.waitForTransactionReceipt({ hash });
      addToLocalBalance(address, stake);
      setBal(getLocalBalance(address));
      setBalVerified(false);
      toast.success(`Position closed. $${formatUSDC(stake)} returned to your balance.`, {
        id: toastId,
      });
      load();
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusyClose(null);
    }
  }

  async function claim(p: Position) {
    const toastId = toast.loading("Claiming…");
    try {
      setBusyClaim(p.market);
      const hash = await writeContractAsync({
        address: p.market,
        abi: marketAbi,
        functionName: "claim",
      });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success("Claimed — funds are in your sealed balance.", { id: toastId });
      load();
    } catch (e) {
      toast.error(humanizeError(e), { id: toastId });
    } finally {
      setBusyClaim(null);
    }
  }

  if (!isConnected) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
            Your portfolio
          </h1>
          <p className="mt-1 text-muted-foreground">
            Connect your wallet to see your sealed balance and positions.
          </p>
          <div className="mt-5 flex justify-center">
            <Button onClick={walletPicker.open} variant="gradient" size="lg">
              Connect wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const claimable = (positions ?? []).filter(
    (p) =>
      (p.status === MARKET_STATUS.RESOLVED || p.status === MARKET_STATUS.VOIDED) && !p.claimed,
  );
  const active = (positions ?? []).filter((p) => p.status === MARKET_STATUS.OPEN);
  const resolving = (positions ?? []).filter((p) => p.status === MARKET_STATUS.RESOLVING);
  const settled = (positions ?? []).filter(
    (p) =>
      (p.status === MARKET_STATUS.RESOLVED || p.status === MARKET_STATUS.VOIDED) && p.claimed,
  );

  // Summary strip totals — only from known (mirrored or verified) cleartexts.
  const knownStake = (list: Position[]) =>
    list.reduce((acc, p) => acc + (p.yesClear ?? 0n) + (p.noClear ?? 0n), 0n);
  const inPositions = knownStake(active) + knownStake(resolving);
  const unknownCount = (positions ?? []).filter((p) => p.yesClear === undefined).length;

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Portfolio</h1>
        <Button
          onClick={() => revealAll()}
          disabled={fhevmStatus !== "ready" || busyReveal || positions === null}
          variant="outline"
          size="sm"
        >
          <Eye className="h-4 w-4" />
          {busyReveal ? "Verifying…" : "Verify everything on-chain"}
        </Button>
      </div>

      {/* Summary strip */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Lock className="h-4 w-4" />
              Confidential balance
            </div>
            <div className="mt-1.5 font-display text-3xl font-extrabold tabular-nums">
              ${formatUSDC(bal ?? 0n)}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {balVerified ? (
                <>
                  <BadgeCheck className="h-3.5 w-3.5 text-yes-fg" />
                  Verified against on-chain ciphertext
                </>
              ) : (
                <>Local estimate — encrypted on-chain</>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <PieChart className="h-4 w-4" />
              In positions
            </div>
            <div className="mt-1.5 font-display text-3xl font-extrabold tabular-nums">
              ${formatUSDC(inPositions)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {unknownCount > 0
                ? `${unknownCount} position${unknownCount > 1 ? "s" : ""} still sealed — verify to include`
                : `${active.length + resolving.length} live position${active.length + resolving.length === 1 ? "" : "s"}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Trophy className="h-4 w-4" />
              Claimable
            </div>
            <div className="mt-1.5 font-display text-3xl font-extrabold tabular-nums">
              {claimable.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {claimable.length > 0 ? "Markets with payouts waiting" : "Nothing waiting to claim"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {positions === null && (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {positions?.length === 0 && (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-16 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-display text-lg font-bold">No positions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Place your first sealed bet to start a portfolio.
          </p>
          <Button asChild variant="gradient" className="mt-4">
            <Link href="/markets">Browse markets</Link>
          </Button>
        </div>
      )}

      {/* Claimable */}
      {claimable.length > 0 && (
        <Section title="Claimable" icon={<Trophy className="h-4 w-4 text-yes-fg" />}>
          {claimable.map((p) => (
            <PositionRow
              key={p.market}
              p={p}
              onReveal={() => revealAll()}
              action={
                <Button
                  onClick={() => claim(p)}
                  disabled={busyClaim === p.market}
                  variant="gradient"
                  size="sm"
                >
                  {busyClaim === p.market
                    ? "Claiming…"
                    : p.status === MARKET_STATUS.VOIDED
                      ? "Withdraw"
                      : "Claim"}
                </Button>
              }
            />
          ))}
        </Section>
      )}

      {/* Active */}
      {active.length > 0 && (
        <Section title="Active positions" icon={<Lock className="h-4 w-4 text-muted-foreground" />}>
          {active.map((p) => (
            <PositionRow
              key={p.market}
              p={p}
              onReveal={() => revealAll()}
              action={
                p.yesClear !== undefined ? (
                  <Button
                    onClick={() => closePosition(p)}
                    disabled={busyClose === p.market}
                    variant="outline"
                    size="sm"
                    className="border-no/40 text-no-fg hover:bg-no-bg"
                  >
                    <LogOut className="h-4 w-4" />
                    {busyClose === p.market ? "Closing…" : "Close"}
                  </Button>
                ) : undefined
              }
            />
          ))}
        </Section>
      )}

      {/* Resolving — outcome recorded, pools being finalized */}
      {resolving.length > 0 && (
        <Section title="Resolving" icon={<Hourglass className="h-4 w-4 text-muted-foreground" />}>
          {resolving.map((p) => (
            <PositionRow key={p.market} p={p} onReveal={() => revealAll()} />
          ))}
        </Section>
      )}

      {/* History */}
      {settled.length > 0 && (
        <Section title="History" icon={<Inbox className="h-4 w-4 text-muted-foreground" />}>
          {settled.map((p) => (
            <PositionRow key={p.market} p={p} onReveal={() => revealAll()} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold tracking-tight">
        {icon}
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function PositionRow({
  p,
  onReveal,
  action,
}: {
  p: Position;
  onReveal: () => void;
  action?: React.ReactNode;
}) {
  const revealed = p.yesClear !== undefined && p.noClear !== undefined;
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CategoryChip category={p.category} />
            <MarketStatusBadge status={p.status as never} />
            {p.verified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-yes-fg">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
          </div>
          <Link
            href={`/markets/${p.market}`}
            className="mt-2 block font-display text-base font-bold leading-snug tracking-tight hover:text-primary"
          >
            {p.question}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-4">
            <div>
              <div className="text-xs font-semibold text-yes-fg">YES</div>
              {revealed ? (
                <div className="font-bold tabular-nums text-yes-fg">${formatUSDC(p.yesClear!)}</div>
              ) : (
                <SealedValue size="sm" placeholder="$•••" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-no-fg">NO</div>
              {revealed ? (
                <div className="font-bold tabular-nums text-no-fg">${formatUSDC(p.noClear!)}</div>
              ) : (
                <SealedValue size="sm" placeholder="$•••" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!revealed && (
              <Button onClick={onReveal} variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
                Verify on-chain
              </Button>
            )}
            {action}
          </div>
        </div>
      </div>
    </Card>
  );
}
