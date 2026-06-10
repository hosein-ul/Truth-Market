"use client";

import { RainbowKitProvider, lightTheme, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { useEffect, useState } from "react";
import { wagmiConfig } from "@/lib/wagmi";
import { FhevmProvider } from "@/lib/useFhevm";
import { WalletPickerProvider } from "@/components/WalletPicker";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5_000, refetchOnWindowFocus: false },
  },
});

const lightRainbow = lightTheme({
  accentColor: "#f97316",
  accentColorForeground: "#ffffff",
  borderRadius: "large",
  fontStack: "system",
});

const darkRainbow = darkTheme({
  accentColor: "#f97316",
  accentColorForeground: "#ffffff",
  borderRadius: "large",
  fontStack: "system",
});

export function Providers({ children }: { children: React.ReactNode }) {
  // Mirror the html.dark class so the RainbowKit modal flips palette with the
  // site theme toggle. Without this, switching to dark mode would leave the
  // wallet modal stuck in its initial theme.
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setIsDark(el.classList.contains("dark"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={isDark ? darkRainbow : lightRainbow} modalSize="compact">
          <FhevmProvider>
            <WalletPickerProvider>
              <TooltipProvider delayDuration={200}>
                {children}
                <Toaster />
              </TooltipProvider>
            </WalletPickerProvider>
          </FhevmProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
