import { getMarketSummaries } from "@/lib/markets";
import { MARKET_STATUS } from "@/lib/abis";
import { ACTIVE_THEME } from "@/theme.config";
import { LandingNoir } from "@/components/landing/LandingNoir";
import { LandingQuantum } from "@/components/landing/LandingQuantum";
import { LandingLattice } from "@/components/landing/LandingLattice";
import { LandingPremium } from "@/components/landing/LandingPremium";

export const dynamic = "force-dynamic";
export const revalidate = 30;

const LANDING_MAP = {
  premium: LandingPremium,
  noir: LandingNoir,
  quantum: LandingQuantum,
  lattice: LandingLattice,
} as const;

export default async function HomePage() {
  const markets = await getMarketSummaries();
  const open = markets.filter((m) => m.status === MARKET_STATUS.OPEN);
  const featured = (open.length > 0 ? open : markets).slice(0, 3);
  const LandingComponent = LANDING_MAP[ACTIVE_THEME];
  return <LandingComponent featured={featured} />;
}
