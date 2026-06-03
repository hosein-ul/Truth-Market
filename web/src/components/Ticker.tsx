// Top "telex" strip — sets the technical/financial tone before anything else
// renders. Pure CSS marquee, no JS state.

const ITEMS = [
  "SEALED ORDER FLOW",
  "FHE-ENCRYPTED POSITIONS",
  "ETHEREUM SEPOLIA · CHAIN 11155111",
  "POOLS DISCLOSED ON RESOLUTION ONLY",
  "PAYOUTS DECRYPTABLE ONLY BY WINNER",
  "POWERED BY ZAMA PROTOCOL",
];

export function Ticker() {
  const items = [...ITEMS, ...ITEMS]; // duplicate for seamless loop
  return (
    <div className="hairline-b overflow-hidden bg-ink-800">
      <div className="flex animate-marquee whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.22em] text-bone-dim py-1.5">
        {items.map((s, i) => (
          <span key={i} className="px-8 inline-flex items-center gap-3">
            <span className="text-signal">◆</span> {s}
          </span>
        ))}
      </div>
    </div>
  );
}
