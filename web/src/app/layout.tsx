import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { Ticker } from "@/components/Ticker";
import { Footer } from "@/components/Footer";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TruthMarket — Sealed prediction markets",
  description:
    "Confidential prediction markets on Ethereum. Bets are encrypted on-chain; only outcomes become public.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${serif.variable} dark`}
    >
      <body className="min-h-screen bg-ink-900 text-bone antialiased">
        <Providers>
          <Ticker />
          <Header />
          <main className="min-h-[calc(100vh-180px)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
