import { publicClient } from "./viem";
import { shortAddr } from "./format";
import type { Address } from "viem";

export interface ActivityItem {
  trader: string;
  txHash: string;
  blockNumber: bigint;
  ageLabel: string;
}

const BET_PLACED_EVENT = {
  type: "event" as const,
  name: "BetPlaced",
  inputs: [{ type: "address" as const, name: "bettor", indexed: true }],
};

export async function getMarketActivity(
  address: Address,
  limit = 10
): Promise<ActivityItem[]> {
  try {
    const latest = await publicClient.getBlockNumber();
    const fromBlock = latest > 5000n ? latest - 5000n : 0n;

    const logs = await publicClient.getLogs({
      address,
      event: BET_PLACED_EVENT,
      fromBlock,
      toBlock: "latest",
    });

    const recent = logs.slice(-limit).reverse();

    return recent.map((log) => {
      const blocksAgo = Number(latest - (log.blockNumber ?? latest));
      const sec = blocksAgo * 12; // ~12s/block on Sepolia
      let ageLabel: string;
      if (sec < 60) ageLabel = `${sec}s ago`;
      else if (sec < 3600) ageLabel = `${Math.floor(sec / 60)}m ago`;
      else if (sec < 86400) ageLabel = `${Math.floor(sec / 3600)}h ago`;
      else ageLabel = `${Math.floor(sec / 86400)}d ago`;

      const bettor = (log.args as any)?.bettor ?? "0x0000000000000000000000000000000000000000";
      return {
        trader: shortAddr(bettor),
        txHash: log.transactionHash ?? "",
        blockNumber: log.blockNumber ?? 0n,
        ageLabel,
      };
    });
  } catch {
    return [];
  }
}
