import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/30">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient">
              <Lock className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </span>
            <span className="font-display text-base font-extrabold tracking-tight">
              Truth<span className="text-gradient">Market</span>
            </span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Prediction markets where your position stays private. Bets are sealed
            and encrypted on-chain until the market settles — no herding, no
            front-running, no exposure.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-violet-700">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-semibold">Secured by Zama confidential computing</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Running on Sepolia testnet</span>
            <a
              href="https://sepolia.etherscan.io/address/0x2Aed78F76fD40a1BAf6F00BDEe30Ec0ABcb06A30"
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:text-foreground"
            >
              Contract ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
