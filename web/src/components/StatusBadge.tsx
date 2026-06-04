import { MARKET_STATUS, type MarketStatusValue } from "@/lib/abis";

const CHIP_CLASS: Record<MarketStatusValue, string> = {
  [MARKET_STATUS.OPEN]: "chip chip-open",
  [MARKET_STATUS.RESOLVING]: "chip chip-resolving",
  [MARKET_STATUS.RESOLVED]: "chip chip-resolved",
  [MARKET_STATUS.VOIDED]: "chip chip-voided",
};

const LABEL: Record<MarketStatusValue, string> = {
  [MARKET_STATUS.OPEN]: "Open",
  [MARKET_STATUS.RESOLVING]: "Resolving",
  [MARKET_STATUS.RESOLVED]: "Resolved",
  [MARKET_STATUS.VOIDED]: "Voided",
};

const DOT_CLASS: Record<MarketStatusValue, string | null> = {
  [MARKET_STATUS.OPEN]: "bg-signal animate-pulse_signal",
  [MARKET_STATUS.RESOLVING]: "bg-reveal",
  [MARKET_STATUS.RESOLVED]: null,
  [MARKET_STATUS.VOIDED]: null,
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: MarketStatusValue;
  className?: string;
}) {
  const chipCls = CHIP_CLASS[status] ?? "chip chip-resolved";
  const dot = DOT_CLASS[status];
  return (
    <span className={`${chipCls} ${className}`}>
      {dot && (
        <span
          className={`inline-block rounded-full ${dot}`}
          style={{ width: 5, height: 5 }}
        />
      )}
      {LABEL[status] ?? "Unknown"}
    </span>
  );
}
