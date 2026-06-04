/*
 * Human-readable error mapping. The user must NEVER see a raw contract revert,
 * an RPC blob, or protocol jargon (ERC7984, cUSDC, FHE, wrap, shield).
 */

const RULES: { match: RegExp; message: string }[] = [
  { match: /user rejected|user denied|rejected the request/i, message: "You declined the request in your wallet." },
  { match: /insufficient funds/i, message: "Not enough ETH to cover network fees. Add Sepolia ETH and try again." },
  { match: /insufficient.*balance|transfer amount exceeds/i, message: "Your USDC balance is too low for this bet." },
  { match: /deadline|market.*closed|not open|betting.*closed/i, message: "This market is closed for betting." },
  { match: /already claimed|claimed/i, message: "You've already claimed your payout for this market." },
  { match: /not resolved|still open|cannot claim/i, message: "This market hasn't settled yet." },
  { match: /not.*oracle|only oracle|unauthorized/i, message: "Only the market's resolver can perform this action." },
  { match: /nonce|replacement transaction underpriced/i, message: "A previous transaction is still pending. Please wait a moment and retry." },
  { match: /chain mismatch|wrong network|chain id/i, message: "Please switch your wallet to the Sepolia network." },
  { match: /timeout|timed out|network error|failed to fetch/i, message: "Network issue — please check your connection and try again." },
  { match: /relayer|gateway|kms|decryption/i, message: "The encryption service is busy. Please try again in a moment." },
  { match: /acl|not allowed|allowtransient/i, message: "Permission step failed. Please retry the action." },
];

export function humanizeError(e: unknown): string {
  const raw = String(
    (e as any)?.shortMessage ??
      (e as any)?.details ??
      (e as any)?.message ??
      e ??
      "",
  );
  for (const rule of RULES) {
    if (rule.match.test(raw)) return rule.message;
  }
  // Generic fallback — never leak the raw blob
  if (raw.length === 0) return "Something went wrong. Please try again.";
  return "We couldn't complete that action. Please try again.";
}
