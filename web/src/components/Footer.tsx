import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20" style={{ boxShadow: "inset 0 0.5px 0 0 rgba(46,52,65,1)" }}>
      <div className="mx-auto max-w-[1400px] px-5 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-mono text-[12px] text-bone">
            truth<span className="text-signal">.</span>market
          </Link>
          <span className="font-mono text-[10px] text-bone-dark">
            Confidential prediction markets · Sepolia · Zama FHEVM
          </span>
        </div>
        <div className="flex items-center gap-5 font-mono text-[10px] text-bone-dark">
          <a
            href="https://docs.zama.org/protocol"
            target="_blank"
            rel="noreferrer"
            className="hover:text-bone transition-colors"
          >
            Zama docs ↗
          </a>
          <a
            href="https://sepolia.etherscan.io/address/0x2Aed78F76fD40a1BAf6F00BDEe30Ec0ABcb06A30"
            target="_blank"
            rel="noreferrer"
            className="hover:text-bone transition-colors"
          >
            Contract ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
