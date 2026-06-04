"use client";

import { useAccount, useReadContract } from "wagmi";
import { useState } from "react";
import { marketAbi } from "@/lib/abis";
import { EncryptedValue } from "./EncryptedValue";
import { useFhevm } from "@/lib/useFhevm";
import { formatUSDC } from "@/lib/format";

export function PositionPanel({ marketAddress }: { marketAddress: `0x${string}` }) {
  const { address, isConnected } = useAccount();
  const { instance, status: fhevmStatus } = useFhevm();
  const [yesClear, setYesClear] = useState<bigint | null>(null);
  const [noClear, setNoClear] = useState<bigint | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [err, setErr] = useState("");

  const { data: hasBet } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "hasBet",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: yesHandle } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "getUserYesStake",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasBet },
  });

  const { data: noHandle } = useReadContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "getUserNoStake",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasBet },
  });

  if (!isConnected || !hasBet) return null;

  async function decrypt() {
    if (!instance || !address || !yesHandle || !noHandle) return;
    try {
      setDecrypting(true);
      setErr("");
      const { privateKey, publicKey } = instance.generateKeypair();
      const startTs = Math.floor(Date.now() / 1000);
      const durDays = 7;
      const eip712 = instance.createEIP712(publicKey, [marketAddress], startTs, durDays);
      const eth = (window as any).ethereum;
      const sig: string = await eth.request({
        method: "eth_signTypedData_v4",
        params: [address, JSON.stringify(eip712)],
      });
      const res = (await instance.userDecrypt(
        [
          { handle: yesHandle as string, contractAddress: marketAddress },
          { handle: noHandle as string, contractAddress: marketAddress },
        ],
        privateKey,
        publicKey,
        sig.replace(/^0x/, ""),
        [marketAddress],
        address,
        startTs,
        durDays,
      )) as Record<string, any>;
      setYesClear(BigInt(res[yesHandle as string]));
      setNoClear(BigInt(res[noHandle as string]));
    } catch (e: any) {
      setErr(String(e?.shortMessage ?? e?.message ?? e));
    } finally {
      setDecrypting(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        My Position
        <span className="font-mono text-[9px] text-signal flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-signal" />
          Active
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="stat-cell">
            <div className="stat-label" style={{ color: "#b6ff3c" }}>YES Stake</div>
            {yesClear !== null ? (
              <div className="font-mono num text-[16px] text-signal fade-in">
                ${formatUSDC(yesClear)}
              </div>
            ) : (
              <EncryptedValue revealed={false} width={5} className="text-[14px]" />
            )}
          </div>
          <div className="stat-cell">
            <div className="stat-label" style={{ color: "#ff6b5b" }}>NO Stake</div>
            {noClear !== null ? (
              <div className="font-mono num text-[16px] text-bleed fade-in">
                ${formatUSDC(noClear)}
              </div>
            ) : (
              <EncryptedValue revealed={false} width={5} className="text-[14px]" />
            )}
          </div>
        </div>

        {yesClear === null && (
          <button
            onClick={decrypt}
            disabled={fhevmStatus !== "ready" || decrypting}
            className={
              fhevmStatus === "ready" && !decrypting
                ? "btn-ghost w-full"
                : "btn-disabled w-full"
            }
          >
            {decrypting ? "Decrypting…" : "🔓 Decrypt My Position"}
          </button>
        )}

        {err && (
          <div className="font-mono text-[10px] text-bleed">{err}</div>
        )}

        {yesClear === null && (
          <p className="font-mono text-[9px] text-bone-dark leading-[1.5]">
            Your position is encrypted on-chain. Decryption requires an EIP-712 signature from your wallet — no data leaves your browser.
          </p>
        )}
      </div>
    </div>
  );
}
