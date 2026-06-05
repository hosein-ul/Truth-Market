// Local cleartext mirror of the user's confidential cUSDC balance.
//
// The contract stores cUSDC as encrypted euint64s; reading the cleartext
// on-chain requires a wallet signature + relayer round-trip. But every change
// to that balance — wrap, bet, cash-out, claim — is initiated by THIS browser,
// so we already know the amounts. We mirror them here so the user always sees a
// fresh number without signing for it. The on-chain ciphertext stays the
// authoritative source for everyone else.

const KEY = "tm:balance:v1";

type Store = Record<string, { micro: string; updatedAt: number }>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}
function write(s: Store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota-safe */
  }
}
function slot(wallet: string) {
  return wallet.toLowerCase();
}

export function getLocalBalance(wallet: string | undefined): bigint {
  if (!wallet) return 0n;
  const r = read()[slot(wallet)];
  return r ? BigInt(r.micro) : 0n;
}

export function addToLocalBalance(wallet: string, deltaMicro: bigint) {
  const s = read();
  const k = slot(wallet);
  const cur = s[k] ? BigInt(s[k].micro) : 0n;
  const next = cur + deltaMicro;
  const clamped = next < 0n ? 0n : next;
  s[k] = { micro: clamped.toString(), updatedAt: Date.now() };
  write(s);
}

export function setLocalBalance(wallet: string, micro: bigint) {
  const s = read();
  s[slot(wallet)] = { micro: micro.toString(), updatedAt: Date.now() };
  write(s);
}
