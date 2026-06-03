"use client";

// Lazy, browser-side singleton for the Zama relayer-sdk instance.
//
// The instance must be initialized exactly once per page load: initSDK()
// loads WASM, then createInstance() with SepoliaConfig + the user's wallet
// provider returns the object used for input encryption and user decryption.
//
// We avoid touching any of this during SSR — every consumer goes through
// useFhevm() in client components.

import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";

let instancePromise: Promise<FhevmInstance> | null = null;

export function getFhevmInstance(): Promise<FhevmInstance> {
  if (instancePromise) return instancePromise;

  instancePromise = (async () => {
    if (typeof window === "undefined") {
      throw new Error("getFhevmInstance() must be called in the browser");
    }
    const eth = (window as any).ethereum;
    if (!eth) {
      throw new Error("No EVM provider detected. Connect a wallet first.");
    }

    const { initSDK, createInstance, SepoliaConfig } = await import(
      "@zama-fhe/relayer-sdk/web"
    );

    await initSDK();
    return createInstance({ ...SepoliaConfig, network: eth });
  })().catch((e) => {
    // reset so the next attempt can succeed
    instancePromise = null;
    throw e;
  });

  return instancePromise;
}

export function resetFhevmInstance() {
  instancePromise = null;
}
