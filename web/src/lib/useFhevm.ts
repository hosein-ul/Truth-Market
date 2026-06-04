"use client";

import { createContext, createElement, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { getFhevmInstance, resetFhevmInstance } from "./fhevm";

export interface FhevmState {
  instance: FhevmInstance | null;
  status: "loading" | "ready" | "error";
  error: string | null;
  retry: () => void;
}

const FhevmContext = createContext<FhevmState | null>(null);

/**
 * App-wide provider that eagerly initializes the encryption layer on mount —
 * independent of wallet connection. By the time a user wants to bet, the
 * instance is almost always already "ready".
 */
export function FhevmProvider({ children }: { children: ReactNode }) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [status, setStatus] = useState<FhevmState["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
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
  }, [nonce]);

  const value: FhevmState = {
    instance,
    status,
    error,
    retry: () => {
      resetFhevmInstance();
      setNonce((n) => n + 1);
    },
  };

  return createElement(FhevmContext.Provider, { value }, children);
}

export function useFhevm(): FhevmState {
  const ctx = useContext(FhevmContext);
  if (!ctx) {
    // Defensive default so consumers never crash outside the provider.
    return { instance: null, status: "loading", error: null, retry: () => {} };
  }
  return ctx;
}
