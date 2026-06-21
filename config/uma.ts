// Official UMA Optimistic Oracle V3 addresses on Ethereum Sepolia (chain 11155111).
// Source: UMAprotocol/protocol packages/core/networks/11155111.json
//   https://github.com/UMAprotocol/protocol/blob/master/packages/core/networks/11155111.json
// Network address reference: https://docs.uma.xyz/resources/network-addresses
//
// IMPORTANT: only the `finder` is treated as the stable entry point. The OOV3
// implementation and its default bond currency are read FROM the Finder at
// deploy time (UmaResolver constructor), so they stay correct even if UMA
// upgrades the oracle. The OOV3 address below is informational / for sanity logs.

export const UMA_SEPOLIA = {
  // Stable registry — the only address we feed into the resolver.
  finder: "0xf4C48eDAd256326086AEfbd1A53e1896815F8f13",
  // Resolved dynamically from the Finder; kept here for verification/logging only.
  optimisticOracleV3: "0xFd9e2642a170aDD10F53Ee14a93FcF2F31924944",
  addressWhitelist: "0xE8DE4bcE27f6214dcE18D8a7629f233C66A97B84",
  store: "0x39e7FFA77A4ac4D34021C6BbE4C8778d47F684F2",
} as const;

// Default resolver tuning for Sepolia demos. Liveness is intentionally short so
// the assert → settle cycle is demoable in minutes; raise it for production use.
// bondAmount 0 ⇒ the resolver falls back to the live OOV3 minimum bond.
export const UMA_RESOLVER_DEFAULTS = {
  livenessSeconds: 120, // 2 minutes (override via UMA_LIVENESS env)
  bondAmount: 0n, // 0 ⇒ use OOV3 minimum (override via UMA_BOND env, base units)
} as const;
