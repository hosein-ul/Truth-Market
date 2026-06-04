import { publicClient } from "./viem";
import { shortAddr } from "./format";
import { FACTORY_DEPLOY_BLOCK } from "./addresses";
import type { Address } from "viem";

export interface ActivityItem {
  trader: string;
  fullAddress: string;
  txHash: string;
  blockNumber: bigint;
  ageLabel: string;
}

const BET_PLACED_EVENT = {
  type: "event" as const,
  name: "BetPlaced",
  inputs: [{ type: "address" as const, name: "bettor", indexed: true }],
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
        const bettor =
          (log.args as any)?.bettor ??
          "0x0000000000000000000000000000000000000000";
        return {
          trader: shortAddr(bettor),
          fullAddress: bettor,
          txHash: log.transactionHash ?? "",
          blockNumber: log.blockNumber ?? 0n,
          ageLabel: ageLabel(blocksAgo),
        };
      });
  } catch {
    return [];
  }
}

/** Unique-bettor count for a market (best effort). */
export async function getTraderCount(address: Address): Promise<number> {
  try {
    const { logs } = await fetchBetLogs(address);
    const unique = new Set(
      logs.map((l) => ((l.args as any)?.bettor ?? "").toLowerCase()),
    );
    unique.delete("");
    return unique.size;
  } catch {
    return 0;
  }
}
