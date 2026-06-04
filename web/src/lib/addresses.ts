// Deployed contract addresses on Ethereum Sepolia.
// Source of truth: ../deployments/sepolia/addresses.json (kept in sync).

export const CHAIN_ID = 11155111;

export const ADDRESSES = {
  // Zama official tokens (we do not deploy these)
  underlyingUSDC: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
  confidentialUSDC: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
  // Our protocol
  marketFactory: "0x6702fB99B26CC37292c5b93d5aDFA5789Fa27334",
} as const;

export const FACTORY_DEPLOY_BLOCK = 10987800n; // approx — narrows event scans
