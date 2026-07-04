// Local record of the user's own positions.
//
// The protocol keeps every stake encrypted on-chain — but the bettor's OWN
// browser is where the bet was composed, so it already knows the cleartext. We
// persist that locally (per wallet, per market) and show it back instantly. Your
// position is never hidden from you; the encryption only hides it from everyone
// else. (An on-chain user-decrypt path still exists as the authoritative proof.)

export interface LocalPosition {
  yes: string; // micro-USDC as decimal string (bigint-safe)
  no: string;
  updatedAt: number;
}

const KEY = "tm:positions:v1";

type Store = Record<string, LocalPosition>; // key = `${wallet}:${market}`

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

function write(store: Store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

function slot(wallet: string, market: string) {
  return `${wallet.toLowerCase()}:${market.toLowerCase()}`;
}

export function getLocalPosition(
  wallet: string | undefined,
  market: string,
): LocalPosition | null {
  if (!wallet) return null;
  return read()[slot(wallet, market)] ?? null;
}

/** Reconcile the local mirror with an authoritative on-chain reveal. */
export function setLocalPosition(
  wallet: string,
  market: string,
  yes: bigint,
  no: bigint,
) {
  const store = read();
  store[slot(wallet, market)] = {
    yes: yes.toString(),
    no: no.toString(),
    updatedAt: Date.now(),
  };
  write(store);
}

/** Add an encrypted bet the user just placed to their local running total. */
export function recordLocalBet(
  wallet: string,
  market: string,
  side: "YES" | "NO",
  amountMicro: bigint,
) {
  const store = read();
  const k = slot(wallet, market);
  const cur = store[k] ?? { yes: "0", no: "0", updatedAt: 0 };
  const yes = BigInt(cur.yes) + (side === "YES" ? amountMicro : 0n);
  const no = BigInt(cur.no) + (side === "NO" ? amountMicro : 0n);
  store[k] = { yes: yes.toString(), no: no.toString(), updatedAt: Date.now() };
  write(store);
}
