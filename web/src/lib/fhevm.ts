"use client";

// Browser-side singleton for the Zama relayer-sdk instance.
//
// KEY FIX: we initialize EAGERLY using the public Sepolia RPC URL as the
// network — NOT window.ethereum. Input encryption (createEncryptedInput) and
// public decryption do not require a connected wallet, so the encryption layer
// can be ready the moment the app loads. The wallet is only needed to *sign*
// transactions and EIP-712 user-decryption requests, which happens separately.
//
// This is why the user should never see "encryption layer not ready".

import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";

const RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

let instancePromise: Promise<FhevmInstance> | null = null;

export function getFhevmInstance(): Promise<FhevmInstance> {
  if (instancePromise) return instancePromise;

  instancePromise = (async () => {
    if (typeof window === "undefined") {
      throw new Error("getFhevmInstance() must run in the browser");
    }
    const { initSDK, createInstance, SepoliaConfig } = await import(
      "@zama-fhe/relayer-sdk/web"
    );
    // Loads the WASM module (needs COOP/COEP headers — set in next.config).
    await initSDK();
    // Use the RPC URL so the instance can be built without a wallet.
    return createInstance({ ...SepoliaConfig, network: RPC_URL });
  })().catch((e) => {
    instancePromise = null; // allow a clean retry
    throw e;
  });

  return instancePromise;
}

export function resetFhevmInstance() {
  instancePromise = null;
}

// Convenience: turn a relayer-sdk handle/bytes value into a 0x-prefixed hex.
export function toHex(v: string | Uint8Array): `0x${string}` {
  if (typeof v === "string") {
    return (v.startsWith("0x") ? v : "0x" + v) as `0x${string}`;
  }
  let s = "";
  for (let i = 0; i < v.length; i++) s += v[i].toString(16).padStart(2, "0");
  return ("0x" + s) as `0x${string}`;
}
