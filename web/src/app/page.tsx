import { getMarketSummaries } from "@/lib/markets";
import { MarketCard } from "@/components/MarketCard";
import { CipherCanvas } from "@/components/CipherCanvas";
import { MARKET_STATUS } from "@/lib/abis";

export const revalidate = 30;

export default async function HomePage() {
  const markets = await getMarketSummaries();
  const open = markets.filter((m) => m.status === MARKET_STATUS.OPEN);
  const settling = markets.filter((m) => m.status === MARKET_STATUS.RESOLVING);
  const resolved = markets.filter(
    (m) => m.status === MARKET_STATUS.RESOLVED || m.status === MARKET_STATUS.VOIDED,
  );

  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <CipherCanvas seed={11} density={0.44} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900/95 via-ink-900/70 to-ink-900/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-900" />
        </div>

        <div className="mx-auto max-w-[1400px] px-6 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal mb-5 flex items-center gap-2">
                <span className="dot-live" />
                Sealed market protocol · Live on Sepolia
              </div>
              <h1 className="font-serif text-[64px] md:text-[88px] leading-[0.96] tracking-[-0.02em] text-bone">
                Prediction <br />
                without <span className="text-signal italic">spectacle.</span>
              </h1>
              <p className="mt-7 max-w-[58ch] text-[16px] leading-[1.6] text-bone-dim">
                On every other prediction market your size, side, and identity
                are public the moment you click. Whales lead herds, insiders are
                exposed, and a political bet can become a personal record.
                TruthMarket encrypts <em className="text-bone">amount</em> and{" "}
                <em className="text-bone">side</em> on-chain at the protocol
                level. Only the resolved outcome and final aggregate pools ever
                become public; your payout is decryptable only by the wallet
                that earned it.
              </p>
            </div>
            <div className="lg:col-span-4 lg:pl-8">
              <div className="hairline bg-ink-800/70 backdrop-blur p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone-dim mb-3">
                  Protocol stats
                </div>
                <Stat label="Markets opened" value={String(markets.length)} />
                <Stat label="Currently sealed" value={String(open.length)} />
                <Stat label="Resolving" value={String(settling.length)} />
                <Stat label="Settled" value={String(resolved.length)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Markets */}
      <section className="mx-auto max-w-[1400px] px-6 pb-24">
        <FeedBlock title="Sealed · open for betting" markets={open} />
        {settling.length > 0 && (
          <FeedBlock title="Resolving · awaiting finalization" markets={settling} />
        )}
        {resolved.length > 0 && <FeedBlock title="Settled" markets={resolved} />}
        {markets.length === 0 && (
          <div className="hairline p-12 text-center text-bone-dim font-mono text-sm mt-8">
            no markets created yet — be the first
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-2 hairline-b last:shadow-none">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim">
        {label}
      </span>
      <span className="font-mono num text-[20px] text-bone">{value}</span>
    </div>
  );
}

function FeedBlock({
  title,
  markets,
}: {
  title: string;
  markets: Awaited<ReturnType<typeof getMarketSummaries>>;
}) {
  if (markets.length === 0) return null;
  return (
    <div className="mt-12">
      <div className="flex items-baseline justify-between hairline-b pb-3 mb-5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone">
          {title}
        </h2>
        <span className="font-mono num text-[11px] text-bone-dim">
          {markets.length.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-wire">
        {markets.map((m) => (
          <MarketCard key={m.address} m={m} />
        ))}
      </div>
    </div>
  );
}
