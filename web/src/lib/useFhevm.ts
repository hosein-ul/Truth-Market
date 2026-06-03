"use client";

import { useEffect, useState } from "react";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { useAccount } from "wagmi";
import { getFhevmInstance, resetFhevmInstance } from "./fhevm";

export interface UseFhevmResult {
  instance: FhevmInstance | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  retry: () => void;
}

/**
 * Hook that resolves the Zama relayer-sdk instance for the current connected
 * wallet. Returns { instance, status, error, retry }. Components should treat
 * `instance` as null until status === "ready".
 */
export function useFhevm(): UseFhevmResult {
  const { isConnected } = useAccount();
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [status, setStatus] = useState<UseFhevmResult["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!isConnected) {
      setInstance(null);
      setStatus("idle");
      setError(null);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);

    getFhevmInstance()
      .then((inst) => {
        if (cancelled) return;
        setInstance(inst);
        setStatus("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e?.message ?? e));
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [isConnected, nonce]);

  return {
    instance,
    status,
    error,
    retry: () => {
      resetFhevmInstance();
      setNonce((n) => n + 1);
    },
  };
}
