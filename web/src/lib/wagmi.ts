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

const web3AuthConnector =
  typeof window !== "undefined"
    ? Web3AuthConnector({ web3AuthInstance: getWeb3Auth() as any })
    : null;

export const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(RPC_URL),
  },
  connectors: web3AuthConnector ? [...rkConnectors, web3AuthConnector] : rkConnectors,
  ssr: true,
});
