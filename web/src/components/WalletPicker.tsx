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
import { MagicCard } from "@/components/ui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { RainbowButton } from "@/components/ui/rainbow-button";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ type: "spring", damping: 22, stiffness: 340 }}
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#08080c] p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 grid h-8 w-8 place-items-center rounded-full text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 text-center">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-white">
            Connect to TruthMarket
          </h2>
          <p className="mt-1 text-sm text-white/50">Choose how you want to connect</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* ── External Wallet ── */}
          <WalletOption
            onClick={handleExternal}
            icon={<Wallet className="h-5 w-5" />}
            iconGradient="from-violet-400 to-pink-500"
            iconShadow="shadow-violet-500/30"
            glowFrom="#ee4f27"
            glowTo="#6b21ef"
            innerBackground="#0c0c14"
            shineColors={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
            title="External Wallet"
            description="MetaMask, Coinbase, Rainbow, or any wallet you already have."
            features={[
              { icon: <Shield className="h-3 w-3 text-violet-400" />, label: "Full control of your keys" },
              { icon: <Fingerprint className="h-3 w-3 text-violet-400" />, label: "Signs each transaction" },
            ]}
            cta="Connect wallet"
          />

          {/* ── TruthMarket Wallet ── */}
          <WalletOption
            onClick={w3aConnector && !busy ? handleEmbedded : undefined}
            disabled={!w3aConnector || busy}
            icon={<Zap className="h-5 w-5" />}
            iconGradient="from-pink-400 to-violet-500"
            iconShadow="shadow-pink-500/30"
            glowFrom="#ee4f27"
            glowTo="#6b21ef"
            innerBackground="#0c0c14"
            shineColors={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
            title="TruthMarket Wallet"
            description="One-time deposit, then predict with zero popups or signing."
            features={[
              { icon: <Zap className="h-3 w-3 text-pink-400" />, label: "No signing per transaction" },
              { icon: <Lock className="h-3 w-3 text-pink-400" />, label: "Withdraw anytime" },
            ]}
            cta={busy ? "Connecting…" : "Connect wallet"}
          />
        </div>

        <p className="mt-5 text-center text-[11px] text-white/30">
          Both options keep your positions encrypted on-chain via Zama FHE.
        </p>
      </motion.div>
    </motion.div>
  );
}

function WalletOption({
  onClick,
  disabled,
  icon,
  iconGradient,
  iconShadow,
  glowFrom,
  glowTo,
  innerBackground,
  shineColors,
  title,
  description,
  features,
  cta,
}: {
  onClick?: () => void;
  disabled?: boolean;
  icon: ReactNode;
  iconGradient: string;
  iconShadow: string;
  glowFrom: string;
  glowTo: string;
  innerBackground: string;
  shineColors: string[];
  title: string;
  description: string;
  features: { icon: ReactNode; label: string }[];
  cta: string;
}) {
  return (
    <div
      className={`relative rounded-2xl ${disabled ? "opacity-60" : "cursor-pointer"}`}
      onClick={disabled ? undefined : onClick}
    >
      {/* ShineBorder sits outside MagicCard so inset-0 matches the wrapper */}
      <ShineBorder
        borderWidth={2}
        duration={9}
        shineColor={shineColors}
        className="rounded-2xl"
      />

      <MagicCard
        mode="orb"
        glowFrom={glowFrom}
        glowTo={glowTo}
        glowSize={360}
        glowOpacity={0.8}
        innerBackground={innerBackground}
        borderColor="rgba(255,255,255,0.10)"
        className="h-full rounded-2xl"
      >
        <div className="flex h-full flex-col items-start p-5 text-left">
          <div
            className={`mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${iconGradient} text-white shadow-lg ${iconShadow}`}
          >
            {icon}
          </div>

          <h3 className="font-display text-base font-bold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/55">{description}</p>

          <ul className="mt-3 space-y-1.5 text-[11px] text-white/45">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="shrink-0">{f.icon}</span>
                {f.label}
              </li>
            ))}
          </ul>

          <div className="mt-4 w-full">
            <RainbowButton
              size="lg"
              disabled={disabled}
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              {cta}
            </RainbowButton>
          </div>
        </div>
      </MagicCard>
    </div>
  );
}
