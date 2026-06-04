import type { Config } from "tailwindcss";

/*
 * TruthMarket design system — Dark Navy + Electric Blue
 * No purple. Premium dark crypto-tech. Emerald=YES, Rose=NO.
 */

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Semantic brand colors
        yes: {
          DEFAULT: "#10b981",
          fg: "#34d399",
          bg: "#022c22",
          ring: "#059669",
        },
        no: {
          DEFAULT: "#f43f5e",
          fg: "#fb7185",
          bg: "#2d0a14",
          ring: "#e11d48",
        },
        // Electric blue palette (replaces violet)
        blue: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        cyan: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        gold: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        navy: {
          900: "#080c16",
          800: "#0d1422",
          700: "#111927",
          600: "#162035",
          500: "#1d2d45",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.3)",
        card: "0 2px 8px -2px rgb(0 0 0 / 0.4), 0 4px 16px -4px rgb(0 0 0 / 0.3)",
        lift: "0 8px 24px -6px rgb(0 0 0 / 0.5), 0 2px 8px -2px rgb(0 0 0 / 0.3)",
        "blue-glow": "0 0 0 1px rgba(59,130,246,0.2), 0 4px 20px rgba(59,130,246,0.12)",
        "cyan-glow": "0 0 0 1px rgba(34,211,238,0.2), 0 4px 20px rgba(34,211,238,0.12)",
        "gold-glow": "0 0 0 1px rgba(245,158,11,0.3), 0 4px 20px rgba(245,158,11,0.15)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 40%, #22d3ee 100%)",
        "brand-gradient-subtle":
          "linear-gradient(135deg, rgba(29,78,216,0.8) 0%, rgba(59,130,246,0.8) 50%, rgba(34,211,238,0.8) 100%)",
        "sealed-gradient":
          "linear-gradient(135deg, #0d1829 0%, #0e1f35 50%, #0a1b2e 100%)",
        "mesh":
          "radial-gradient(at 0% 0%, rgba(59,130,246,0.12) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(34,211,238,0.10) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(29,78,216,0.08) 0px, transparent 50%)",
        "glow-blue":
          "radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)",
        "glow-cyan":
          "radial-gradient(ellipse at center, rgba(34,211,238,0.12) 0%, transparent 70%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(59,130,246,0)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(59,130,246,0.3)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(2deg)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "blink-cursor": {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        "scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(400%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        "fade-up": "fade-up 0.5s ease-out forwards",
        float: "float 5s ease-in-out infinite",
        "spin-slow": "spin-slow 12s linear infinite",
        "blink-cursor": "blink-cursor 1s step-end infinite",
        scanline: "scanline 4s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
