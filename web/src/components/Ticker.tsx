// Top telex strip — enforces the protocol tone before anything else renders.

const ITEMS = [
  "SEALED ORDER FLOW",
  "FHE-ENCRYPTED · AMOUNT + SIDE HIDDEN",
  "ETHEREUM SEPOLIA · CHAIN 11155111",
  "POOLS DISCLOSED AT RESOLUTION ONLY",
  "PAYOUTS DECRYPTABLE ONLY BY WINNER",
  "POWERED BY ZAMA FHEVM",
  "NO HERDING BIAS · NO COPY-TRADING",
  "POSITIONS PRIVATE FROM ALL OBSERVERS",
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
