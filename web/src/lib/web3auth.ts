"use client";

import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { sepolia } from "wagmi/chains";

const CLIENT_ID =
  process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ??
  "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zy6Xu-2Q5Y4Ns";

const RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

let instance: Web3Auth | null = null;

export function getWeb3Auth(): Web3Auth {
  if (instance) return instance;

  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: `0x${sepolia.id.toString(16)}`,
    rpcTarget: RPC_URL,
    displayName: sepolia.name,
    blockExplorerUrl: sepolia.blockExplorers.default.url,
    ticker: "ETH",
    tickerName: "Ethereum",
  };

  const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
  });

  instance = new Web3Auth({
    clientId: CLIENT_ID,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider,
    uiConfig: {
      appName: "TruthMarket",
      mode: "light",
      loginMethodsOrder: ["google", "twitter", "discord", "github"],
      primaryButton: "socialLogin",
    },
  });

  return instance;
}
