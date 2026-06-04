// Server-side reads against MarketFactory + each ConfidentialMarket.
//
// Per-market metadata + public counters are plain on-chain reads. Aggregate odds
// are derived from the LAST PUBLICLY-DECRYPTED SNAPSHOT — fetched via the Zama
// relayer (Node-side SDK). If a market has not yet hit its K-anonymity gate
// (snapshotBatchK bets), there is no snapshot yet and odds are intentionally
// blank for everyone — that's the privacy property, not a bug.

import { ADDRESSES } from "./addresses";
import { marketFactoryAbi, marketAbi } from "./abis";
import { publicClient } from "./viem";

export interface MarketSummary {
  address: `0x${string}`;
  creator: `0x${string}`;
  oracle: `0x${string}`;
  deadline: number;
  question: string;
  category: string;
  status: number;
  /** YES pool revealed at the last odds snapshot (0n if no snapshot yet, set server-side if available, otherwise 0). */
  yesPoolSnapshot: bigint;
  noPoolSnapshot: bigint;
  /** Encrypted pool HANDLES so the client can publicDecrypt on its own if RSC couldn't. */
  yesPoolHandle: `0x${string}`;
  noPoolHandle: `0x${string}`;
  /** After Resolved: cleartext finals used for claim math. */
  yesPoolFinal: bigint;
  noPoolFinal: bigint;
  outcomeYes: boolean;
  betCount: number;
  lastSnapshotBetCount: number;
  snapshotBatchK: number;
  hasUnsnappedBets: boolean;
}

async function publicDecryptHandles(handles: string[]): Promise<Record<string, bigint>> {
  if (handles.length === 0) return {};
  // Only attempt if all handles are non-zero (an unintialized euint64 is ZeroHash).
  if (handles.some((h) => /^0x0+$/.test(h))) return {};
  try {
    const mod = await import("@zama-fhe/relayer-sdk/node");
    const rpc =
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
      process.env.SEPOLIA_RPC_URL ??
      "https://ethereum-sepolia-rpc.publicnode.com";
    const inst = await mod.createInstance({ ...mod.SepoliaConfig, network: rpc });
    const result: any = await inst.publicDecrypt(handles);
    // SDK shape: { clearValues: { [handle]: bigint }, decryptionProof, ... }
    const clear = result.clearValues ?? result;
    const out: Record<string, bigint> = {};
    for (const h of handles) {
      const v = clear[h];
      if (v !== undefined && v !== null) out[h] = BigInt(v);
    }
    return out;
  } catch {
    return {}; // gracefully degrade — UI shows "snapshot pending"
  }
}

export async function getMarketSummaries(limit = 50): Promise<MarketSummary[]> {
  const len = await publicClient.readContract({
    address: ADDRESSES.marketFactory,
    abi: marketFactoryAbi,
    functionName: "marketsLength",
  });
  const n = Number(len);
  if (n === 0) return [];

  const list = await publicClient.readContract({
    address: ADDRESSES.marketFactory,
    abi: marketFactoryAbi,
    functionName: "listMarkets",
    args: [0n, BigInt(Math.min(limit, n))],
  });

  const fns = [
    "status",
    "outcomeYes",
    "betCount",
    "lastSnapshotBetCount",
    "snapshotBatchK",
    "yesPoolFinal",
    "noPoolFinal",
    "getYesPoolHandle",
    "getNoPoolHandle",
  ] as const;
  const contracts = list.flatMap((m) =>
    fns.map((fn) => ({ address: m.market, abi: marketAbi, functionName: fn }) as const),
  );
  const reads = await publicClient.multicall({ contracts, allowFailure: true });

  // Collect all snapshot handles to decrypt in one relayer call.
  const allHandles: string[] = [];
  list.forEach((_, i) => {
    const status = reads[i * fns.length];
    const yesH = reads[i * fns.length + 7];
    const noH = reads[i * fns.length + 8];
    if (status.status !== "success") return;
    const s = Number(status.result);
    // Only decrypt while market is Open or Resolving — once Resolved, use yesPoolFinal.
    if (s === 0 || s === 1) {
      if (yesH.status === "success") allHandles.push(yesH.result as string);
      if (noH.status === "success") allHandles.push(noH.result as string);
    }
  });
  const decrypted = await publicDecryptHandles(allHandles);

  return list.map((m, i) => {
    const status = reads[i * fns.length];
    const outc = reads[i * fns.length + 1];
    const bets = reads[i * fns.length + 2];
    const lastSnap = reads[i * fns.length + 3];
    const k = reads[i * fns.length + 4];
    const yesFinal = reads[i * fns.length + 5];
    const noFinal = reads[i * fns.length + 6];
    const yesH = reads[i * fns.length + 7];
    const noH = reads[i * fns.length + 8];

    const yesPoolSnapshot =
      yesH.status === "success" ? decrypted[yesH.result as string] ?? 0n : 0n;
    const noPoolSnapshot =
      noH.status === "success" ? decrypted[noH.result as string] ?? 0n : 0n;

    return {
      address: m.market,
      creator: m.creator,
      oracle: m.oracle,
      deadline: Number(m.deadline),
      question: m.question,
      category: m.category,
      status: status.status === "success" ? Number(status.result) : 0,
      yesPoolSnapshot,
      noPoolSnapshot,
      yesPoolHandle: (yesH.status === "success" ? (yesH.result as string) : "0x0") as `0x${string}`,
      noPoolHandle: (noH.status === "success" ? (noH.result as string) : "0x0") as `0x${string}`,
      yesPoolFinal: yesFinal.status === "success" ? BigInt(yesFinal.result as bigint) : 0n,
      noPoolFinal: noFinal.status === "success" ? BigInt(noFinal.result as bigint) : 0n,
      outcomeYes: outc.status === "success" ? Boolean(outc.result) : false,
      betCount: bets.status === "success" ? Number(bets.result) : 0,
      lastSnapshotBetCount: lastSnap.status === "success" ? Number(lastSnap.result) : 0,
      snapshotBatchK: k.status === "success" ? Number(k.result) : 3,
      hasUnsnappedBets:
        bets.status === "success" && lastSnap.status === "success"
          ? Number(bets.result) > Number(lastSnap.result)
          : false,
    };
  });
}

export async function getMarketDetail(address: `0x${string}`) {
  const fns = [
    "question",
    "description",
    "category",
    "creator",
    "oracle",
    "deadline",
    "disputeWindow",
    "status",
    "outcomeYes",
    "betCount",
    "lastSnapshotBetCount",
    "snapshotBatchK",
    "yesPoolFinal",
    "noPoolFinal",
    "getYesPoolHandle",
    "getNoPoolHandle",
  ] as const;
  const contracts = fns.map(
    (fn) => ({ address, abi: marketAbi, functionName: fn }) as const,
  );
  const reads = await publicClient.multicall({ contracts, allowFailure: false });

  const status = Number(reads[7]);
  const yesH = reads[14] as string;
  const noH = reads[15] as string;
  let yesPoolSnapshot = 0n;
  let noPoolSnapshot = 0n;
  if (status === 0 || status === 1) {
    const dec = await publicDecryptHandles([yesH, noH]);
    yesPoolSnapshot = dec[yesH] ?? 0n;
    noPoolSnapshot = dec[noH] ?? 0n;
  }

  return {
    address,
    question: reads[0] as string,
    description: reads[1] as string,
    category: reads[2] as string,
    creator: reads[3] as `0x${string}`,
    oracle: reads[4] as `0x${string}`,
    deadline: Number(reads[5]),
    disputeWindow: Number(reads[6]),
    status,
    outcomeYes: reads[8] as boolean,
    betCount: Number(reads[9]),
    lastSnapshotBetCount: Number(reads[10]),
    snapshotBatchK: Number(reads[11]),
    yesPoolFinal: reads[12] as bigint,
    noPoolFinal: reads[13] as bigint,
    yesPoolSnapshot,
    noPoolSnapshot,
    yesPoolHandle: yesH as `0x${string}`,
    noPoolHandle: noH as `0x${string}`,
  };
}

export type MarketDetail = Awaited<ReturnType<typeof getMarketDetail>>;
