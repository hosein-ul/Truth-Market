"use client";

import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";
import { getWeb3Auth } from "@/lib/web3auth";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "8e0a5c2f3b1d4e9a7c6b8d2e4f1a3b5c";

const RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

const rkConnectors = connectorsForWallets(
  [
    {
      groupName: "External Wallets",
      wallets: [metaMaskWallet, walletConnectWallet, coinbaseWallet, rainbowWallet],
    },
  ],
  { appName: "TruthMarket", projectId },
);

// Build the embedded-wallet connector defensively: if Web3Auth can't init
// (e.g. missing/invalid client id, offline), we still ship the app with the
// external-wallet (RainbowKit) flow intact instead of crashing at module load.
function buildWeb3AuthConnector() {
  if (typeof window === "undefined") return null;
  try {
    return Web3AuthConnector({ web3AuthInstance: getWeb3Auth() as any });
  } catch (e) {
    console.warn("[wagmi] Web3Auth connector unavailable:", e);
    return null;
  }
}

const web3AuthConnector = buildWeb3AuthConnector();

export const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(RPC_URL),
  },
  connectors: web3AuthConnector ? [...rkConnectors, web3AuthConnector] : rkConnectors,
  ssr: true,
});
