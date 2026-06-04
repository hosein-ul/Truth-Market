import { publicClient } from "./viem";
import { FACTORY_DEPLOY_BLOCK } from "./addresses";
import type { Address } from "viem";

export type ActivityKind = "bet" | "snapshot" | "resolving" | "resolved" | "voided";

export interface ActivityItem {
  txHash: string;
  blockNumber: bigint;
  ageLabel: string;
  kind: ActivityKind;
}

// All bet activity is intentionally ANONYMOUS on-chain. The BetPlaced event
// carries no fields — not amount, not side, not address. We surface these as
// "encrypted bet placed" entries so the market still feels alive in the UI.
const BET_PLACED_EVENT = {
  type: "event" as const,
  name: "BetPlaced",
  inputs: [],
};
const ODDS_SNAPSHOT_EVENT = {
  type: "event" as const,
  name: "OddsSnapshotReady",
  inputs: [
    { type: "uint32" as const, name: "snapshotId", indexed: true },
    { type: "uint256" as const, name: "betCountAtSnapshot" },
  ],
};
const RESOLVING_EVENT = {
  type: "event" as const,
  name: "MarketResolving",
  inputs: [{ type: "bool" as const, name: "outcomeYes" }],
};
const RESOLVED_EVENT = {
  type: "event" as const,
  name: "MarketResolved",
  inputs: [
    { type: "bool" as const, name: "outcomeYes" },
    { type: "uint64" as const, name: "yesPool" },
    { type: "uint64" as const, name: "noPool" },
  ],
};
const VOIDED_EVENT = {
  type: "event" as const,
  name: "MarketVoided",
  inputs: [{ type: "string" as const, name: "reason" }],
};

function ageLabel(blocksAgo: number): string {
  const sec = blocksAgo * 12;
  if (sec < 60) return `${Math.max(sec, 1)}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

async function getLogsResilient(address: Address, event: any) {
  const latest = await publicClient.getBlockNumber();
  const attempts: bigint[] = [
    FACTORY_DEPLOY_BLOCK,
    latest > 100_000n ? latest - 100_000n : 0n,
    latest > 10_000n ? latest - 10_000n : 0n,
  ];
  for (const fromBlock of attempts) {
    try {
      const logs = await publicClient.getLogs({ address, event, fromBlock, toBlock: "latest" });
      return { logs, latest };
    } catch {}
  }
  return { logs: [], latest };
}

export async function getMarketActivity(address: Address, limit = 18): Promise<ActivityItem[]> {
  try {
    const [bets, snaps, resolving, resolved, voided] = await Promise.all([
      getLogsResilient(address, BET_PLACED_EVENT),
      getLogsResilient(address, ODDS_SNAPSHOT_EVENT),
      getLogsResilient(address, RESOLVING_EVENT),
      getLogsResilient(address, RESOLVED_EVENT),
      getLogsResilient(address, VOIDED_EVENT),
    ]);
    const latest = bets.latest;
    const all: ActivityItem[] = [];
    const push = (k: ActivityKind, log: any) => {
      const blocksAgo = Number(latest - (log.blockNumber ?? latest));
      all.push({
        txHash: log.transactionHash ?? "",
        blockNumber: log.blockNumber ?? 0n,
        ageLabel: ageLabel(blocksAgo),
        kind: k,
      });
    };
    bets.logs.forEach((l) => push("bet", l));
    snaps.logs.forEach((l) => push("snapshot", l));
    resolving.logs.forEach((l) => push("resolving", l));
    resolved.logs.forEach((l) => push("resolved", l));
    voided.logs.forEach((l) => push("voided", l));
    all.sort((a, b) => Number(b.blockNumber - a.blockNumber));
    return all.slice(0, limit);
  } catch {
    return [];
  }
}
