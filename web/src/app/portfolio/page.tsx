"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { publicClient } from "@/lib/viem";
import { ADDRESSES } from "@/lib/addresses";
import { marketFactoryAbi, marketAbi, erc7984Abi, MARKET_STATUS } from "@/lib/abis";
import { EncryptedValue } from "@/components/EncryptedValue";
import { StatusBadge } from "@/components/StatusBadge";
import { useFhevm } from "@/lib/useFhevm";
import { formatUSDC, shortAddr } from "@/lib/format";

interface Position {
  market: `0x${string}`;
  question: string;
  category: string;
  status: number;
  yesHandle: `0x${string}`;
  noHandle: `0x${string}`;
  yesClear?: bigint;
  noClear?: bigint;
  decrypted?: boolean;
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { instance, status: fhevmStatus } = useFhevm();
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [balHandle, setBalHandle] = useState<`0x${string}` | null>(null);
  const [bal, setBal] = useState<bigint | null>(null);

  // Fetch positions: for every market in the factory, check hasBet(user).
  useEffect(() => {
    if (!address) return;
    let alive = true;
    (async () => {
      const len = await publicClient.readContract({
        address: ADDRESSES.marketFactory,
        abi: marketFactoryAbi,
        functionName: "marketsLength",
      });
      const n = Number(len);
      if (n === 0) {
        if (alive) setPositions([]);
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
        if (alive) setPositions([]);
        return;
      }

      const details = await publicClient.multicall({
        allowFailure: false,
        contracts: mine.flatMap(
          (m) =>
            [
              { address: m.market, abi: marketAbi, functionName: "status" },
              { address: m.market, abi: marketAbi, functionName: "getUserYesStake", args: [address] },
              { address: m.market, abi: marketAbi, functionName: "getUserNoStake", args: [address] },
            ] as const,
        ),
      });

      const positions: Position[] = mine.map((m, i) => ({
        market: m.market,
        question: m.question,
        category: m.category,
        status: Number(details[i * 3]),
        yesHandle: details[i * 3 + 1] as `0x${string}`,
        noHandle: details[i * 3 + 2] as `0x${string}`,
      }));
      if (alive) setPositions(positions);

      // Confidential balance handle
      const cBal = await publicClient.readContract({
        address: ADDRESSES.confidentialUSDC,
        abi: erc7984Abi,
        functionName: "confidentialBalanceOf",
        args: [address],
      });
      if (alive) setBalHandle(cBal as `0x${string}`);
    })().catch((e) => console.error(e));
    return () => {
      alive = false;
    };
  }, [address]);

  async function decryptStake(position: Position) {
    if (!instance || !address) return;
    try {
      const { privateKey, publicKey } = instance.generateKeypair();
      const startTs = Math.floor(Date.now() / 1000);
      const durDays = 7;
      const eip712 = instance.createEIP712(
        publicKey,
        [position.market],
        startTs,
        durDays,
      );
      // Sign via window.ethereum
      const eth = (window as any).ethereum;
      const sig: string = await eth.request({
        method: "eth_signTypedData_v4",
        params: [address, JSON.stringify(eip712)],
      });
      const res = await instance.userDecrypt(
        [
          { handle: position.yesHandle, contractAddress: position.market },
          { handle: position.noHandle, contractAddress: position.market },
        ],
        privateKey,
        publicKey,
        sig.replace(/^0x/, ""),
        [position.market],
        address,
        startTs,
        durDays,
      );
      setPositions((prev) =>
        prev
          ? prev.map((p) =>
              p.market === position.market
                ? {
                    ...p,
                    yesClear: BigInt(res[position.yesHandle] as any),
                    noClear: BigInt(res[position.noHandle] as any),
                    decrypted: true,
                  }
                : p,
            )
          : prev,
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function decryptBalance() {
    if (!instance || !address || !balHandle) return;
    try {
      const { privateKey, publicKey } = instance.generateKeypair();
      const startTs = Math.floor(Date.now() / 1000);
      const durDays = 7;
      const eip712 = instance.createEIP712(
        publicKey,
        [ADDRESSES.confidentialUSDC],
        startTs,
        durDays,
      );
      const eth = (window as any).ethereum;
      const sig: string = await eth.request({
        method: "eth_signTypedData_v4",
        params: [address, JSON.stringify(eip712)],
      });
      const res = await instance.userDecrypt(
        [{ handle: balHandle, contractAddress: ADDRESSES.confidentialUSDC }],
        privateKey,
        publicKey,
        sig.replace(/^0x/, ""),
        [ADDRESSES.confidentialUSDC],
        address,
        startTs,
        durDays,
      );
      setBal(BigInt(res[balHandle] as any));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-24">
      <div className="mb-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone-dim mb-3">
          Account · {shortAddr(address)}
        </div>
        <h1 className="font-serif text-[44px] leading-[1.05] tracking-[-0.02em]">
          Portfolio
        </h1>
      </div>

      {!isConnected && (
        <div className="hairline p-10 text-center text-bone-dim font-mono text-sm">
          Connect a wallet to view your positions.
        </div>
      )}

      {isConnected && (
        <>
          {/* Confidential balance */}
          <div className="hairline bg-ink-800/40 p-5 mb-10 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim mb-1">
                Sealed wallet balance
              </div>
              <div className="flex items-baseline gap-3">
                {bal !== null ? (
                  <span className="font-mono num text-[28px] text-reveal">
                    ${formatUSDC(bal)}{" "}
                    <span className="text-bone-dim text-[12px] uppercase tracking-[0.18em]">
                      cUSDC
                    </span>
                  </span>
                ) : (
                  <EncryptedValue revealed={false} width={12} className="text-[28px]" />
                )}
              </div>
            </div>
            {bal === null && (
              <button
                onClick={decryptBalance}
                disabled={fhevmStatus !== "ready"}
                className={fhevmStatus === "ready" ? "btn-ghost" : "btn-disabled"}
              >
                Decrypt balance
              </button>
            )}
          </div>

          {/* Positions list */}
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone hairline-b pb-3 mb-5">
            Positions · {positions?.length ?? "—"}
          </h2>

          {positions === null && (
            <div className="font-mono text-[11px] text-bone-dim">loading…</div>
          )}
          {positions?.length === 0 && (
            <div className="hairline p-10 text-center text-bone-dim font-mono text-sm">
              No positions. <Link href="/" className="text-signal">Browse markets →</Link>
            </div>
          )}

          <div className="grid grid-cols-1 gap-px bg-wire hairline">
            {(positions ?? []).map((p) => (
              <PositionRow
                key={p.market}
                p={p}
                fhevmReady={fhevmStatus === "ready"}
                onDecrypt={() => decryptStake(p)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PositionRow({
  p,
  fhevmReady,
  onDecrypt,
}: {
  p: Position;
  fhevmReady: boolean;
  onDecrypt: () => void;
}) {
  return (
    <div className="bg-ink-900 p-5 grid grid-cols-12 items-center gap-4">
      <div className="col-span-12 md:col-span-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim mb-1">
          {p.category}
        </div>
        <Link
          href={`/markets/${p.market}`}
          className="font-serif text-[20px] text-bone hover:text-signal transition-colors"
        >
          {p.question}
        </Link>
      </div>
      <div className="col-span-6 md:col-span-2">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-dark mb-1">
          YES stake
        </div>
        {p.decrypted ? (
          <span className="font-mono num text-[14px] text-signal">
            ${formatUSDC(p.yesClear ?? 0n)}
          </span>
        ) : (
          <EncryptedValue revealed={false} width={6} />
        )}
      </div>
      <div className="col-span-6 md:col-span-2">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-dark mb-1">
          NO stake
        </div>
        {p.decrypted ? (
          <span className="font-mono num text-[14px] text-bleed">
            ${formatUSDC(p.noClear ?? 0n)}
          </span>
        ) : (
          <EncryptedValue revealed={false} width={6} />
        )}
      </div>
      <div className="col-span-12 md:col-span-2 flex md:justify-end items-center gap-3">
        <StatusBadge status={p.status as any} />
        {!p.decrypted && (
          <button
            onClick={onDecrypt}
            disabled={!fhevmReady}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal hover:underline disabled:text-bone-dark"
          >
            decrypt
          </button>
        )}
      </div>
    </div>
  );
}
