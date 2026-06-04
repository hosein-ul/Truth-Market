"use client";

import { useEffect, useState } from "react";
import { useFhevm } from "@/lib/useFhevm";
import { ProbabilityBar } from "./ProbabilityBar";
import { pct } from "@/lib/utils";

/**
 * Renders K-anonymous odds by publicDecrypting the current pool ciphertexts via
 * the relayer. If the server-side render already supplied a snapshot value
 * (initialYes/initialNo > 0), shows it instantly; otherwise the client SDK
 * tries to decrypt and renders when ready. If the K-anonymity gate hasn't been
 * tripped yet, the relayer rejects and we render a "snapshot pending" hint.
 */
export function LiveOdds({
  yesHandle,
  noHandle,
  initialYes,
  initialNo,
  betsBehindSnapshot,
  snapshotBatchK,
  layout = "bar",
}: {
  yesHandle: `0x${string}`;
  noHandle: `0x${string}`;
  initialYes: bigint;
  initialNo: bigint;
  betsBehindSnapshot: number;
  snapshotBatchK: number;
  layout?: "bar" | "hero";
}) {
  const { instance, status } = useFhevm();
  const [yes, setYes] = useState<bigint>(initialYes);
  const [no, setNo] = useState<bigint>(initialNo);

  useEffect(() => {
    if (yes + no > 0n) return; // server-side already populated
    if (status !== "ready" || !instance) return;
    if (yesHandle === "0x0" || noHandle === "0x0") return;
    let cancelled = false;
    (async () => {
      try {
        const res: any = await instance.publicDecrypt([yesHandle, noHandle]);
        const clear = res.clearValues ?? res;
        if (cancelled) return;
        const y = clear[yesHandle];
        const n = clear[noHandle];
        if (y !== undefined) setYes(BigInt(y));
        if (n !== undefined) setNo(BigInt(n));
      } catch {
        // No snapshot yet (K-anonymity gate hasn't opened) — leave at 0n.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [instance, status, yesHandle, noHandle, yes, no]);

  const total = yes + no;
  const yesPct = pct(yes, total, 0);
  const hasOdds = total > 0n;
  const need = Math.max(0, snapshotBatchK - betsBehindSnapshot);

  if (!hasOdds) {
    if (layout === "hero") {
      return (
        <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-sky-700">
          Decrypting K-anonymous snapshot from Zama relayer…
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
        Decrypting K-anon snapshot…
      </div>
    );
  }
  return (
    <div className={layout === "hero" ? "space-y-2" : undefined}>
      <ProbabilityBar yesPct={yesPct} />
      {layout === "hero" && (
        <p className="text-xs text-muted-foreground">
          {yesPct}% YES · ${(Number(total) / 1_000_000).toLocaleString()} revealed volume
        </p>
      )}
    </div>
  );
}
