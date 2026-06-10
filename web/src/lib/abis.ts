// Minimal ABIs — only the functions the frontend actually calls.
// Pulled from the Solidity sources in ../contracts and the OZ ERC7984 library.

export const erc20MintAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const erc7984Abi = [
  {
    type: "function",
    name: "wrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "setOperator",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "until", type: "uint48" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isOperator",
    stateMutability: "view",
    inputs: [
      { name: "holder", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "confidentialBalanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bytes32" }],
  },
] as const;

export const marketFactoryAbi = [
  {
    type: "function",
    name: "marketsLength",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "cUsdc",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "createMarket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "oracle", type: "address" },
      { name: "deadline", type: "uint64" },
      { name: "question", type: "string" },
      { name: "description", type: "string" },
      { name: "category", type: "string" },
    ],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "listMarkets",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "market", type: "address" },
          { name: "creator", type: "address" },
          { name: "oracle", type: "address" },
          { name: "deadline", type: "uint64" },
          { name: "question", type: "string" },
          { name: "category", type: "string" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "MarketCreated",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "market", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "oracle", type: "address" },
      { name: "deadline", type: "uint64" },
      { name: "question", type: "string" },
      { name: "category", type: "string" },
    ],
  },
] as const;

// v3 ConfidentialMarket — encrypted bets, snapshot odds, two-phase resolve.
export const marketAbi = [
  // --- metadata / public counters ---
  { type: "function", name: "status", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "outcomeYes", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "betCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "lastSnapshotBetCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "lastSnapshotAt", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { type: "function", name: "snapshotCounter", stateMutability: "view", inputs: [], outputs: [{ type: "uint32" }] },
  { type: "function", name: "snapshotBatchK", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "betsToNextSnapshot", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "deadline", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { type: "function", name: "disputeWindow", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { type: "function", name: "creator", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "oracle", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "cUsdc", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "question", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "description", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "category", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "claimed", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "hasBet", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "bool" }] },

  // --- encrypted handles for the frontend's user/public decryption ---
  { type: "function", name: "getUserYesStake", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "getUserNoStake", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "getYesPoolHandle", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "getNoPoolHandle", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },

  // --- final pools (post-finalize) for claim math ---
  { type: "function", name: "yesPoolFinal", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { type: "function", name: "noPoolFinal", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },

  // --- writes ---
  {
    type: "function",
    name: "placeBet",
    stateMutability: "nonpayable",
    inputs: [
      { name: "encAmount", type: "bytes32" },
      { name: "amountProof", type: "bytes" },
      { name: "encSide", type: "bytes32" },
      { name: "sideProof", type: "bytes" },
    ],
    outputs: [],
  },
  { type: "function", name: "refreshOdds", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "cashOut", stateMutability: "nonpayable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "resolve",
    stateMutability: "nonpayable",
    inputs: [{ name: "outcomeYes_", type: "bool" }],
    outputs: [],
  },
  {
    type: "function",
    name: "finalize",
    stateMutability: "nonpayable",
    inputs: [
      { name: "yesClear", type: "uint64" },
      { name: "noClear", type: "uint64" },
      { name: "decryptionProof", type: "bytes" },
    ],
    outputs: [],
  },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "enableRefunds", stateMutability: "nonpayable", inputs: [], outputs: [] },

  // --- events (anonymous BetPlaced — no amount, no side, no address) ---
  { type: "event", name: "BetPlaced", inputs: [] },
  {
    type: "event",
    name: "OddsSnapshotReady",
    inputs: [
      { name: "snapshotId", type: "uint32", indexed: true },
      { name: "betCountAtSnapshot", type: "uint256" },
    ],
  },
  { type: "event", name: "MarketResolving", inputs: [{ name: "outcomeYes", type: "bool" }] },
  {
    type: "event",
    name: "MarketResolved",
    inputs: [
      { name: "outcomeYes", type: "bool" },
      { name: "yesPool", type: "uint64" },
      { name: "noPool", type: "uint64" },
    ],
  },
  { type: "event", name: "MarketVoided", inputs: [{ name: "reason", type: "string" }] },
  { type: "event", name: "Claimed", inputs: [{ name: "user", type: "address", indexed: true }] },
  { type: "event", name: "PositionClosed", inputs: [] },
] as const;

export const MARKET_STATUS = {
  OPEN: 0,
  RESOLVING: 1,
  RESOLVED: 2,
  VOIDED: 3,
} as const;

export type MarketStatusValue = (typeof MARKET_STATUS)[keyof typeof MARKET_STATUS];
