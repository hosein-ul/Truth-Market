export function Footer() {
  return (
    <footer className="hairline-t mt-24">
      <div className="mx-auto max-w-[1400px] px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 font-mono text-[11px] tracking-[0.06em] text-bone-dim">
        <div>
          <div className="font-serif text-[16px] tracking-tight text-bone mb-2">
            truth<span className="text-signal">.</span>market
          </div>
          <p className="leading-relaxed max-w-[40ch]">
            Confidential prediction markets on Ethereum. The protocol encrypts
            bet amounts and sides on-chain; only the resolved outcome and
            aggregate pools ever become public.
          </p>
        </div>
        <div>
          <div className="uppercase text-bone mb-2 tracking-[0.18em]">Protocol</div>
          <ul className="space-y-1">
            <li>Ethereum Sepolia · 11155111</li>
            <li>Powered by Zama FHEVM</li>
            <li>Collateral · cUSDC (Zama)</li>
          </ul>
        </div>
        <div>
          <div className="uppercase text-bone mb-2 tracking-[0.18em]">Resources</div>
          <ul className="space-y-1">
            <li>
              <a
                className="hover:text-bone transition-colors"
                href="https://docs.zama.org/protocol"
                target="_blank"
                rel="noreferrer"
              >
                Zama Protocol docs ↗
              </a>
            </li>
            <li>
              <a
                className="hover:text-bone transition-colors"
                href="https://sepolia.etherscan.io"
                target="_blank"
                rel="noreferrer"
              >
                Sepolia Etherscan ↗
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
