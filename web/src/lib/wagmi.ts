"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "viem";

// Public WalletConnect project id — replace via env in production, but a
// recognizable fallback keeps the connector working for local testing.
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "8e0a5c2f3b1d4e9a7c6b8d2e4f1a3b5c";

export const wagmiConfig = getDefaultConfig({
  appName: "TruthMarket",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com",
    ),
  },
  ssr: true,
});
