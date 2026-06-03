import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

// Server-side viem client used by RSC pages to read on-chain state without
// requiring a wallet. Public RPC is fine for view calls.
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com",
  ),
});
