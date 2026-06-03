// Official Zama Protocol token addresses on Ethereum Sepolia.
// Source: https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia
//
// TruthMarket uses Zama's official confidential USDC wrapper as betting
// collateral. Users mint the underlying USDC (public faucet, 1M cap) and the
// app wraps it into the confidential token under the hood.

export const ZAMA_SEPOLIA = {
  // Underlying public ERC20 USDC — has a public mint(address,uint256), 1M cap.
  underlyingUSDC: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
  // Confidential USDC wrapper (cUSDCMock), an ERC7984ERC20Wrapper.
  confidentialUSDC: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
  // Wrappers registry (informational).
  wrappersRegistry: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
} as const;
