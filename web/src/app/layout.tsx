import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemedBackground } from "@/components/ThemedBackground";
import { ColorModeScript } from "@/components/ThemeToggle";
import { ACTIVE_THEME } from "@/theme.config";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});
const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
const ceremony = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-ceremony",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TruthMarket — Public Odds, Private Positions",
  description:
    "A prediction market with public odds and private positions. See where the crowd leans, but keep your wallet untrackable — powered by Zama FHEVM.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${serif.variable} ${mono.variable} ${ceremony.variable} theme-${ACTIVE_THEME}`}
    >
      <head>
        <ColorModeScript />
      </head>
      <body className="min-h-screen bg-background font-sans">
        <Providers>
          <ThemedBackground />
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
