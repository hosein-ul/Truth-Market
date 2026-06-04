import { publicClient } from "./viem";
import { FACTORY_DEPLOY_BLOCK } from "./addresses";
import type { Address } from "viem";

export interface ActivityItem {
  txHash: string;
  blockNumber: bigint;
  ageLabel: string;
  side: boolean; // true = YES, false = NO
}

// The BetPlaced event is intentionally anonymous — it carries amount + side
// (those are public, since pools are public) but NO wallet address. That means
// you can watch market momentum, but you cannot tie any bet to a specific
// wallet. Whale-tracking is impossible by construction.
const BET_PLACED_EVENT = {
  type: "event" as const,
  name: "BetPlaced",
  inputs: [
    { type: "uint64" as const, name: "amount" },
    { type: "bool" as const, name: "side" },
  ],
};

function ageLabel(blocksAgo: number): string {
  const sec = blocksAgo * 12; // ~12s/block on Sepolia
  if (sec < 60) return `${Math.max(sec, 1)}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

/** Resilient getLogs: try full history, fall back to a recent window. */
async function fetchBetLogs(address: Address) {
  const latest = await publicClient.getBlockNumber();
  const attempts: bigint[] = [
    FACTORY_DEPLOY_BLOCK,
    latest > 100_000n ? latest - 100_000n : 0n,
    latest > 10_000n ? latest - 10_000n : 0n,
  ];
  for (const fromBlock of attempts) {
    try {
      const logs = await publicClient.getLogs({
        address,
        event: BET_PLACED_EVENT,
        fromBlock,
        toBlock: "latest",
      });
      return { logs, latest };
    } catch {
      // try a narrower range
    }
  }
  return { logs: [], latest };
}

export async function getMarketActivity(
  address: Address,
  limit = 12,
): Promise<ActivityItem[]> {
  try {
    const { logs, latest } = await fetchBetLogs(address);
    return logs
      .slice(-limit)
      .reverse()
      .map((log) => {
        const blocksAgo = Number(latest - (log.blockNumber ?? latest));
        return {
          txHash: log.transactionHash ?? "",
          blockNumber: log.blockNumber ?? 0n,
          ageLabel: ageLabel(blocksAgo),
          side: Boolean((log.args as any)?.side),
        };
      });
  } catch {
    return [];
  }
}
