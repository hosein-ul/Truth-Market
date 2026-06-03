export function PoolBar({ yes, no }: { yes: bigint; no: bigint }) {
  const total = yes + no;
  if (total === 0n) return null;
  const yesPct = Number((yes * 1000n) / total) / 10;
  return (
    <div className="h-2 hairline relative overflow-hidden bg-ink-900">
      <div
        className="absolute inset-y-0 left-0 bg-signal"
        style={{ width: `${yesPct}%` }}
      />
      <div
        className="absolute inset-y-0 right-0 bg-bleed/70"
        style={{ width: `${100 - yesPct}%` }}
      />
    </div>
  );
}
