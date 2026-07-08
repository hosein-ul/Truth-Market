"use client";

// Shared user-decryption helper (the "reveal" path).
//
// Fixes the broken reveal flow: the old code signed the EIP-712 request with
// raw `window.ethereum`, which fails for the Web3Auth embedded wallet and
// WalletConnect (no injected provider) and can sign with the WRONG account
// when several extensions inject providers. We now sign through the wagmi
// connector the user is actually connected with.
//
// One signature covers every contract in the request list for `DUR_DAYS`, so
// we cache the keypair+signature per (wallet, contract-set) in sessionStorage
// and batch as many handles as possible into a single request — revealing a
// whole portfolio costs exactly one wallet popup.

import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";

export interface DecryptPair {
  handle: string;
  contractAddress: `0x${string}`;
}

export type SignTypedDataFn = (args: {
  domain: Record<string, unknown>;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
}) => Promise<`0x${string}` | string>;

const DUR_DAYS = 7;
const CACHE_KEY = "tm:decrypt-session:v2";

interface CachedSession {
  privateKey: string;
  publicKey: string;
  signature: string;
  startTs: number;
  durDays: number;
}

type SessionStore = Record<string, CachedSession>; // key = `${wallet}:${contracts.sorted.joined}`

function readStore(): SessionStore {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}") as SessionStore;
  } catch {
    return {};
  }
}

function writeStore(s: SessionStore) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(s));
  } catch {
    /* private mode — non-fatal */
  }
}

function sessionSlot(wallet: string, contracts: string[]) {
  return `${wallet.toLowerCase()}:${contracts.map((c) => c.toLowerCase()).sort().join(",")}`;
}

function getValidSession(wallet: string, contracts: string[]): CachedSession | null {
  const s = readStore()[sessionSlot(wallet, contracts)];
  if (!s) return null;
  const now = Math.floor(Date.now() / 1000);
  // Leave a day of margin before the signed window expires.
  if (now >= s.startTs + (s.durDays - 1) * 86400) return null;
  return s;
}

function saveSession(wallet: string, contracts: string[], s: CachedSession) {
  const store = readStore();
  store[sessionSlot(wallet, contracts)] = s;
  writeStore(store);
}

function clearSession(wallet: string, contracts: string[]) {
  const store = readStore();
  delete store[sessionSlot(wallet, contracts)];
  writeStore(store);
}

/** An euint64 handle that was never written is ZeroHash — nothing to decrypt. */
export function isZeroHandle(handle: string | undefined | null): boolean {
  return !handle || /^0x0*$/.test(handle);
}

async function signSession(
  instance: FhevmInstance,
  wallet: `0x${string}`,
  contracts: `0x${string}`[],
  signTypedData: SignTypedDataFn,
): Promise<CachedSession> {
  const { privateKey, publicKey } = instance.generateKeypair();
  const startTs = Math.floor(Date.now() / 1000);
  const eip712 = instance.createEIP712(publicKey, contracts, startTs, DUR_DAYS);
  // wagmi/viem reject an `EIP712Domain` entry inside `types` — pass only the
  // primary type, exactly as the Zama wagmi examples do.
  const primaryType = "UserDecryptRequestVerification";
  const types = { [primaryType]: (eip712.types as Record<string, unknown>)[primaryType] };
  const signature = String(
    await signTypedData({
      domain: eip712.domain as unknown as Record<string, unknown>,
      types,
      primaryType,
      message: eip712.message as unknown as Record<string, unknown>,
    }),
  );
  return { privateKey, publicKey, signature, startTs, durDays: DUR_DAYS };
}

/**
 * Decrypt a batch of (handle, contract) pairs for `wallet`, signing through
 * the connected wagmi connector. Returns cleartexts keyed by handle
 * (case-normalized lookup — use `getClear`). Reuses a cached session
 * signature when one is still valid; retries once with a fresh signature if
 * the relayer rejects the cached one.
 */
export async function userDecryptHandles(opts: {
  instance: FhevmInstance;
  wallet: `0x${string}`;
  pairs: DecryptPair[];
  signTypedData: SignTypedDataFn;
}): Promise<Record<string, bigint>> {
  const { instance, wallet, signTypedData } = opts;
  const pairs = opts.pairs.filter((p) => !isZeroHandle(p.handle));
  if (pairs.length === 0) return {};

  const contracts = [...new Set(pairs.map((p) => p.contractAddress))] as `0x${string}`[];

  const run = async (session: CachedSession) => {
    const res = (await instance.userDecrypt(
      pairs.map((p) => ({ handle: p.handle, contractAddress: p.contractAddress })),
      session.privateKey,
      session.publicKey,
      session.signature.replace(/^0x/, ""),
      contracts,
      wallet,
      session.startTs,
      session.durDays,
    )) as Record<string, unknown>;
    // Normalize: SDK keys results by handle, but hex casing may differ.
    const byLower: Record<string, bigint> = {};
    for (const [k, v] of Object.entries(res)) {
      if (v === undefined || v === null) continue;
      byLower[k.toLowerCase()] = BigInt(v as string | number | bigint | boolean);
    }
    const out: Record<string, bigint> = {};
    for (const p of pairs) {
      const v = byLower[p.handle.toLowerCase()];
      if (v !== undefined) out[p.handle] = v;
    }
    return out;
  };

  const cached = getValidSession(wallet, contracts);
  if (cached) {
    try {
      return await run(cached);
    } catch {
      clearSession(wallet, contracts); // stale/rejected — re-sign below
    }
  }
  const fresh = await signSession(instance, wallet, contracts, signTypedData);
  const result = await run(fresh);
  saveSession(wallet, contracts, fresh);
  return result;
}

/** Case-insensitive lookup into a `userDecryptHandles` result. */
export function getClear(
  res: Record<string, bigint>,
  handle: string | undefined | null,
): bigint | undefined {
  if (!handle) return undefined;
  if (res[handle] !== undefined) return res[handle];
  const lower = handle.toLowerCase();
  for (const [k, v] of Object.entries(res)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

/** True if a still-valid cached reveal session exists (no popup needed). */
export function hasCachedSession(wallet: string | undefined, contracts: string[]): boolean {
  if (!wallet || typeof window === "undefined") return false;
  return getValidSession(wallet, contracts) !== null;
}
