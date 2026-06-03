// Deployed contract addresses on Ethereum Sepolia.
// Source of truth: ../deployments/sepolia/addresses.json (kept in sync).

export const CHAIN_ID = 11155111;

export const ADDRESSES = {
  // Zama official tokens (we do not deploy these)
  underlyingUSDC: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
  confidentialUSDC: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
  // Our protocol
  marketFactory: "0x2Aed78F76fD40a1BAf6F00BDEe30Ec0ABcb06A30",
} as const;

export const FACTORY_DEPLOY_BLOCK = 10981400n; // approx — narrows event scans
