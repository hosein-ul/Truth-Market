import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";

const META: Record<
  MarketStatusValue,
  { label: string; tone: "signal" | "reveal" | "bleed" | "wire"; dot: boolean }
> = {
  [MARKET_STATUS.OPEN]: { label: "OPEN", tone: "signal", dot: true },
  [MARKET_STATUS.RESOLVING]: { label: "RESOLVING", tone: "reveal", dot: true },
  [MARKET_STATUS.RESOLVED]: { label: "RESOLVED", tone: "reveal", dot: false },
  [MARKET_STATUS.VOIDED]: { label: "VOIDED", tone: "bleed", dot: false },
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: MarketStatusValue;
  className?: string;
}) {
  const m = META[status];
  const toneClass =
    m.tone === "signal"
      ? "text-signal hairline"
      : m.tone === "reveal"
        ? "text-reveal hairline"
        : m.tone === "bleed"
          ? "text-bleed hairline"
          : "text-bone-dim hairline";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${toneClass} ${className}`}
    >
      {m.dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            m.tone === "signal"
              ? "bg-signal"
              : m.tone === "reveal"
                ? "bg-reveal"
                : "bg-bleed"
          } ${m.tone === "signal" ? "animate-pulse_signal" : ""}`}
        />
      )}
      {m.label}
    </span>
  );
}
