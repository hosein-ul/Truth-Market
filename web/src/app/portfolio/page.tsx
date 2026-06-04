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
    <div className="mx-auto max-w-[1200px] px-5 pt-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone-dark mb-2">
            Account · {isConnected ? shortAddr(address) : "—"}
          </div>
          <h1 className="font-serif text-[34px] md:text-[42px] leading-[1.05] tracking-[-0.02em]">
            Portfolio
          </h1>
        </div>
      </div>

      {!isConnected ? (
        <div className="panel p-16 text-center">
          <div className="font-mono text-[32px] text-bone-dark mb-4">◈</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone-dim mb-2">
            Wallet not connected
          </div>
          <p className="font-mono text-[11px] text-bone-dark">
            Connect a wallet to view your sealed positions.
          </p>
        </div>
      ) : (
        <>
          {/* Balance card */}
          <div className="panel mb-6">
            <div className="panel-header">
              Confidential Balance
              <span className="font-mono text-[9px] text-signal">● SEALED</span>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-dark mb-2">
                  cUSDC (Zama confidential wrapper)
                </div>
                {bal !== null ? (
                  <div className="font-mono num text-[32px] text-reveal fade-in">
                    ${formatUSDC(bal)}
                  </div>
                ) : (
                  <EncryptedValue revealed={false} width={14} className="text-[28px]" />
                )}
              </div>
              {bal === null && (
                <button
                  onClick={decryptBalance}
                  disabled={fhevmStatus !== "ready"}
                  className={fhevmStatus === "ready" ? "btn-ghost" : "btn-disabled"}
                >
                  🔓 Decrypt balance
                </button>
              )}
            </div>
          </div>

          {/* Positions */}
          <div className="font-mono text-[9px] text-bone-dark mb-4 flex items-center gap-3 select-none">
            <span>─────</span>
            <span className="uppercase tracking-[0.22em]">
              Positions · {positions?.length ?? "—"}
            </span>
            <span className="flex-1 border-t border-wire" />
          </div>

          {positions === null && (
            <div className="panel p-8 text-center font-mono text-[11px] text-bone-dark">
              Loading positions…
            </div>
          )}

          {positions?.length === 0 && (
            <div className="panel p-12 text-center">
              <div className="font-mono text-[32px] text-bone-dark mb-3">◈</div>
              <div className="font-mono text-[11px] text-bone-dim mb-4">
                No positions found
              </div>
              <Link href="/" className="btn-ghost">
                Browse markets
              </Link>
            </div>
          )}

          {(positions ?? []).length > 0 && (
            <div style={{ boxShadow: "inset 0 0 0 0.5px rgba(46,52,65,1)" }}>
              {/* Table header */}
              <div
                className="grid grid-cols-12 gap-2 px-5 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-bone-dark"
                style={{ boxShadow: "inset 0 -0.5px 0 0 rgba(46,52,65,0.6)", background: "#07080a" }}
              >
                <div className="col-span-5">Market</div>
                <div className="col-span-2">YES Stake</div>
                <div className="col-span-2">NO Stake</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1" />
              </div>
              {(positions ?? []).map((p) => (
                <PositionRow
                  key={p.market}
                  p={p}
                  fhevmReady={fhevmStatus === "ready"}
                  onDecrypt={() => decryptStake(p)}
                />
              ))}
            </div>
          )}
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
    <div
      className="grid grid-cols-12 gap-2 px-5 py-4 items-center"
      style={{
        boxShadow: "inset 0 -0.5px 0 0 rgba(46,52,65,0.5)",
        background: "#0b0d11",
      }}
    >
      <div className="col-span-12 md:col-span-5">
        <div className="chip chip-cat mb-1 inline-flex">{p.category}</div>
        <Link
          href={`/markets/${p.market}`}
          className="block font-serif text-[16px] leading-[1.3] text-bone hover:text-signal transition-colors line-clamp-2"
        >
          {p.question}
        </Link>
      </div>
      <div className="col-span-5 md:col-span-2">
        {p.decrypted ? (
          <span className="font-mono num text-[14px] text-signal fade-in">
            ${formatUSDC(p.yesClear ?? 0n)}
          </span>
        ) : (
          <EncryptedValue revealed={false} width={5} className="text-[12px]" />
        )}
      </div>
      <div className="col-span-5 md:col-span-2">
        {p.decrypted ? (
          <span className="font-mono num text-[14px] text-bleed fade-in">
            ${formatUSDC(p.noClear ?? 0n)}
          </span>
        ) : (
          <EncryptedValue revealed={false} width={5} className="text-[12px]" />
        )}
      </div>
      <div className="col-span-2 md:col-span-2">
        <StatusBadge status={p.status as any} />
      </div>
      <div className="col-span-12 md:col-span-1 flex md:justify-end">
        {!p.decrypted && (
          <button
            onClick={onDecrypt}
            disabled={!fhevmReady}
            className="font-mono text-[9px] uppercase tracking-[0.16em] text-signal hover:underline disabled:text-bone-dark"
          >
            🔓 decrypt
          </button>
        )}
      </div>
    </div>
  );
}
