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
import { Wallet, Shield, Zap, X, Lock, Fingerprint } from "lucide-react";
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

function RainbowButton({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "btn-rainbow w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none disabled:bg-gray-400",
      )}
    >
      {children}
    </button>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ type: "spring", damping: 22, stiffness: 340 }}
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d0d14] p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 text-center">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-white">
            Connect to TruthMarket
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Choose how you want to connect
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* ── External Wallet Card ── */}
          <div
            className={cn(
              "wallet-card-shine group flex flex-col items-start rounded-2xl p-5 text-left cursor-pointer",
              "bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900",
              "border border-white/10 hover:border-cyan-400/40 transition-all duration-300",
              "hover:shadow-[0_0_24px_rgba(34,211,238,0.15)]",
            )}
            onClick={handleExternal}
          >
            {/* icon */}
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
              <Wallet className="h-5 w-5" />
            </div>

            <h3 className="font-display text-base font-bold text-white">
              External Wallet
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              MetaMask, Coinbase, Rainbow, or any wallet you already have.
            </p>

            <ul className="mt-3 space-y-1.5 text-[11px] text-white/45">
              <li className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 shrink-0 text-cyan-400" />
                Full control of your keys
              </li>
              <li className="flex items-center gap-1.5">
                <Fingerprint className="h-3 w-3 shrink-0 text-cyan-400" />
                Signs each transaction
              </li>
            </ul>

            <div className="mt-4 w-full">
              <RainbowButton onClick={handleExternal}>
                Connect wallet
              </RainbowButton>
            </div>
          </div>

          {/* ── TruthMarket Embedded Wallet Card ── */}
          <div
            className={cn(
              "wallet-card-shine group flex flex-col items-start rounded-2xl p-5 text-left",
              "bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-900",
              "border border-white/10 transition-all duration-300",
              w3aConnector && !busy
                ? "cursor-pointer hover:border-primary/40 hover:shadow-[0_0_24px_rgba(255,210,8,0.15)]"
                : "cursor-not-allowed opacity-60",
            )}
            onClick={w3aConnector && !busy ? handleEmbedded : undefined}
          >
            {/* icon */}
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-zinc-950 shadow-lg shadow-primary/30">
              <Zap className="h-5 w-5" />
            </div>

            <h3 className="font-display text-base font-bold text-white">
              TruthMarket Wallet
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              One-time deposit, then predict with zero popups or signing.
            </p>

            <ul className="mt-3 space-y-1.5 text-[11px] text-white/45">
              <li className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 shrink-0 text-amber-400" />
                No signing per transaction
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 shrink-0 text-amber-400" />
                Withdraw anytime
              </li>
            </ul>

            <div className="mt-4 w-full">
              <RainbowButton onClick={handleEmbedded} disabled={busy || !w3aConnector}>
                {busy ? "Connecting…" : "Connect wallet"}
              </RainbowButton>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-white/30">
          Both options keep your positions encrypted on-chain via Zama FHE.
        </p>
      </motion.div>
    </motion.div>
  );
}
