"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useConnect, useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Wallet, Shield, Zap, ChevronRight, X, Lock, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface WalletPickerCtx {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const Ctx = createContext<WalletPickerCtx>({
  open: () => {},
  close: () => {},
  isOpen: false,
});

export const useWalletPicker = () => useContext(Ctx);

export function WalletPickerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) setIsOpen(false);
  }, [isConnected]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <AnimatePresence>{isOpen && <PickerDialog onClose={close} />}</AnimatePresence>
    </Ctx.Provider>
  );
}

function PickerDialog({ onClose }: { onClose: () => void }) {
  const { openConnectModal } = useConnectModal();
  const { connectAsync, connectors } = useConnect();
  const [busy, setBusy] = useState(false);

  const w3aConnector = connectors.find(
    (c) => c.id === "web3auth" || c.name.toLowerCase().includes("web3auth"),
  );

  async function handleEmbedded() {
    if (!w3aConnector || busy) return;
    try {
      setBusy(true);
      await connectAsync({ connector: w3aConnector });
      onClose();
    } catch {
      setBusy(false);
    }
  }

  function handleExternal() {
    onClose();
    setTimeout(() => openConnectModal?.(), 80);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", damping: 24, stiffness: 350 }}
        className="relative w-full max-w-lg rounded-3xl border border-border bg-background p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 text-center">
          <h2 className="font-display text-xl font-extrabold tracking-tight">
            Connect to TruthMarket
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how you want to connect
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* External Wallet Card */}
          <button
            onClick={handleExternal}
            className={cn(
              "group relative flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all",
              "border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50",
              "hover:border-sky-400 hover:shadow-lg hover:shadow-sky-100/50",
            )}
          >
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md">
              <Wallet className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-bold text-sky-900">
              External Wallet
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-sky-700/80">
              MetaMask, Coinbase, Rainbow, or any wallet you already have.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-sky-700/70">
              <li className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 shrink-0" />
                Full control of your keys
              </li>
              <li className="flex items-center gap-1.5">
                <Fingerprint className="h-3 w-3 shrink-0" />
                Signs each transaction
              </li>
            </ul>
            <div className="mt-auto pt-4 flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:text-sky-700">
              Connect wallet
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Embedded Wallet Card */}
          <button
            onClick={handleEmbedded}
            disabled={busy || !w3aConnector}
            className={cn(
              "group relative flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all",
              "border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50",
              "hover:border-violet-400 hover:shadow-lg hover:shadow-violet-100/50",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-bold text-violet-900">
              TruthMarket Wallet
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-violet-700/80">
              One-time deposit, then predict with zero popups or signing.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-violet-700/70">
              <li className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 shrink-0" />
                No signing per transaction
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 shrink-0" />
                Withdraw anytime
              </li>
            </ul>
            <div className="mt-auto pt-4 flex items-center gap-1 text-xs font-bold text-violet-600 group-hover:text-violet-700">
              {busy ? "Connecting..." : "Connect wallet"}
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Both options keep your positions encrypted on-chain via Zama FHE.
        </p>
      </motion.div>
    </motion.div>
  );
}
