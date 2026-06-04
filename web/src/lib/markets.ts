// Server-side reads against MarketFactory + each ConfidentialMarket.
//
// We hit listMarkets() on the factory for discovery, then multicall each
// market's metadata + status in one batch.

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
  yesPoolClear: bigint;
  noPoolClear: bigint;
  outcomeYes: boolean;
  traderCount: number;
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

  // Multicall per-market dynamic fields. Pools are now PUBLIC plaintext so
  // odds are always available; betCount gives the public participant count.
  const contracts = list.flatMap((m) => [
    { address: m.market, abi: marketAbi, functionName: "status" } as const,
    { address: m.market, abi: marketAbi, functionName: "yesPool" } as const,
    { address: m.market, abi: marketAbi, functionName: "noPool" } as const,
    { address: m.market, abi: marketAbi, functionName: "outcomeYes" } as const,
    { address: m.market, abi: marketAbi, functionName: "betCount" } as const,
  ]);
  const reads = await publicClient.multicall({ contracts, allowFailure: true });

  return list.map((m, i) => {
    const status = reads[i * 5];
    const yesP = reads[i * 5 + 1];
    const noP = reads[i * 5 + 2];
    const outc = reads[i * 5 + 3];
    const bets = reads[i * 5 + 4];
    return {
      address: m.market,
      creator: m.creator,
      oracle: m.oracle,
      deadline: Number(m.deadline),
      question: m.question,
      category: m.category,
      status: status.status === "success" ? Number(status.result) : 0,
      yesPoolClear: yesP.status === "success" ? (yesP.result as bigint) : 0n,
      noPoolClear: noP.status === "success" ? (noP.result as bigint) : 0n,
      outcomeYes: outc.status === "success" ? Boolean(outc.result) : false,
      traderCount: bets.status === "success" ? Number(bets.result) : 0,
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
    "yesPool",
    "noPool",
    "outcomeYes",
    "betCount",
  ] as const;
  const contracts = fns.map(
    (fn) => ({ address, abi: marketAbi, functionName: fn }) as const,
  );
  const reads = await publicClient.multicall({ contracts, allowFailure: false });
  const [
    question,
    description,
    category,
    creator,
    oracle,
    deadline,
    disputeWindow,
    status,
    yesPool,
    noPool,
    outcomeYes,
    betCount,
  ] = reads;
  return {
    address,
    question: question as string,
    description: description as string,
    category: category as string,
    creator: creator as `0x${string}`,
    oracle: oracle as `0x${string}`,
    deadline: Number(deadline),
    disputeWindow: Number(disputeWindow),
    status: Number(status),
    yesPoolClear: yesPool as bigint,
    noPoolClear: noPool as bigint,
    outcomeYes: outcomeYes as boolean,
    betCount: Number(betCount),
  };
}

export type MarketDetail = Awaited<ReturnType<typeof getMarketDetail>>;
