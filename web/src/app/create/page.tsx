"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import { ADDRESSES } from "@/lib/addresses";
import { marketFactoryAbi } from "@/lib/abis";
import { decodeEventLog } from "viem";
import { publicClient } from "@/lib/viem";

const CATEGORIES = ["Crypto", "Politics", "Sports", "Science", "Other"];

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [q, setQ] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("Crypto");
  const [days, setDays] = useState("7");
  const [oracle, setOracle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) return;
    if (!q.trim()) {
      setErr("Question is required.");
      return;
    }
    const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(days) * 86400);
    const oracleAddr = (oracle && /^0x[0-9a-fA-F]{40}$/.test(oracle) ? oracle : address) as `0x${string}`;
    try {
      setBusy(true);
      setErr("");
      const hash = await writeContractAsync({
        address: ADDRESSES.marketFactory,
        abi: marketFactoryAbi,
        functionName: "createMarket",
        args: [oracleAddr, deadline, q, desc, cat],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      for (const log of receipt.logs) {
        try {
          const ev = decodeEventLog({
            abi: marketFactoryAbi,
            data: log.data,
            topics: log.topics,
          });
          if (ev.eventName === "MarketCreated") {
            router.push(`/markets/${(ev.args as any).market}`);
            return;
          }
        } catch {
          // ignore unrelated logs
        }
      }
      router.push("/");
    } catch (e: any) {
      setErr(String(e?.shortMessage ?? e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[860px] px-5 pt-8 pb-20">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone-dark mb-2 flex items-center gap-2">
          <span className="dot-live" /> Open a sealed market
        </div>
        <h1 className="font-serif text-[34px] md:text-[44px] leading-[1.05] tracking-[-0.02em]">
          Frame a question.
        </h1>
        <p className="mt-3 text-bone-dim leading-[1.6] text-[14px] max-w-[62ch]">
          Binary YES / NO market. Pools stay encrypted on-chain until the deadline;
          the designated oracle records the outcome and pools unlock for payout.
          You can delegate the oracle role to a third party or keep it yourself.
        </p>
      </div>

      {/* ASCII separator */}
      <div className="font-mono text-[9px] text-bone-dark flex items-center gap-3 mb-8 select-none">
        <span>─────</span>
        <span className="uppercase tracking-[0.22em]">Market parameters</span>
        <span className="flex-1 border-t border-wire" />
      </div>

      <form onSubmit={submit} className="space-y-7">
        <Field label="Question" hint="One sentence. Resolves YES or NO.">
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            rows={2}
            placeholder="Will BTC close above $200k on 2026-12-31?"
            className="w-full bg-transparent px-3 py-3 font-serif text-[18px] outline-none resize-none"
          />
        </Field>

        <Field
          label="Resolution criteria"
          hint="How exactly will the outcome be decided? Be specific — source, time, threshold."
        >
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            placeholder="Resolves YES if the daily close on Coinbase BTC-USD on Dec 31 2026 (UTC) is greater than $200,000."
            className="w-full bg-transparent px-3 py-3 font-mono text-[13px] leading-[1.6] outline-none resize-none"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Category">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="w-full bg-transparent px-3 py-3 font-mono text-[13px] outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-ink-800">
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Open for (days)">
            <input
              value={days}
              onChange={(e) => setDays(e.target.value.replace(/[^\d]/g, ""))}
              className="w-full bg-transparent px-3 py-3 font-mono num text-[16px] outline-none"
            />
          </Field>
          <Field label="Oracle" hint="Leave blank to use your wallet">
            <input
              value={oracle}
              onChange={(e) => setOracle(e.target.value)}
              placeholder="0x…"
              className="w-full bg-transparent px-3 py-3 font-mono text-[12px] outline-none"
            />
          </Field>
        </div>

        {err && (
          <div className="hairline bg-bleed/10 px-3 py-2.5 font-mono text-[11px] text-bleed">
            ✕ {err}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-bone-dark max-w-[48ch] leading-[1.6]">
            Creating this market commits you to the resolution criteria above. Oracle cannot modify the question after deployment.
          </p>
          <button
            type="submit"
            disabled={!isConnected || busy || !q.trim()}
            className={isConnected && q.trim() && !busy ? "btn-primary flex-shrink-0" : "btn-disabled flex-shrink-0"}
          >
            {busy ? "Deploying…" : "◈ Open sealed market"}
          </button>
        </div>
      </form>

      {/* Info note */}
      <div className="mt-8 panel p-5">
        <div className="font-mono text-[9px] text-bone-dark leading-[1.7] grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <div>◈ Binary YES / NO — no multi-outcome markets in v1</div>
          <div>◈ Pool sizes encrypted until resolution</div>
          <div>◈ Oracle resolves after deadline (not before)</div>
          <div>◈ 7-day dispute window before finalization</div>
          <div>◈ Winners claim pro-rata share of total pool</div>
          <div>◈ Market auto-voids if unresolved after dispute window</div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim">
          {label}
        </span>
        {hint && (
          <span className="font-mono text-[10px] text-bone-dark">{hint}</span>
        )}
      </div>
      <div className="hairline bg-ink-900">{children}</div>
    </label>
  );
}
