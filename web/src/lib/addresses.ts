// Deployed contract addresses on Ethereum Sepolia.
// Source of truth: ../deployments/sepolia/addresses.json (kept in sync).

export const CHAIN_ID = 11155111;

export const ADDRESSES = {
  // Zama official tokens (we do not deploy these)
  underlyingUSDC: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
  confidentialUSDC: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
  // Our protocol — v4 (encrypted bets + cashOut + fresh seed dates)
  marketFactory: "0x1e7702db95be7CCE29075ad6E5b76fC88B8B3D44",
  // UMA Optimistic Oracle V3 resolution adapter — markets whose `oracle` field
  // equals this address are resolved via UMA's real OOV3 on Sepolia instead of
  // a trusted EOA. See deployments/sepolia/uma-resolver.json and docs/UMA.md.
  umaResolver: "0x62BB9b5f6bde7eFb1905b1a3d946B1A2875E8F8B",
} as const;

export const FACTORY_DEPLOY_BLOCK = 11005800n; // approx — narrows event scans
