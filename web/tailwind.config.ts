import type { Config } from "tailwindcss";

// TruthMarket design system.
// Aesthetic: "Encrypted Terminal" — dark-first, dense, monospace-forward.
//
// Color semantics:
//   ink       → backgrounds (deep near-black with a hint of blue)
//   bone      → primary text/foreground (warm off-white)
//   wire      → low-contrast UI lines, borders, secondary text
//   signal    → "ENCRYPTED / ACTIVE" — electric lime. Sealed, in-flight.
//   reveal    → "DECRYPTED / RESOLVED" — warm amber. Settled, known.
//   bleed     → "LOSS / ERROR" — pulled-back red.
//   chalk     → optional light-mode counterpart (not used in v1).

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#07080A",
          800: "#0B0D11",
          700: "#11141A",
          600: "#161A22",
          500: "#1E2330",
          400: "#2A3142",
        },
        bone: {
          DEFAULT: "#E8E6DF",
          dim: "#B5B2A8",
          dark: "#7F7C73",
        },
        wire: {
          DEFAULT: "#2E3441",
          dim: "#1B2029",
        },
        signal: {
          DEFAULT: "#B6FF3C",
          dim: "#7FB829",
          glow: "rgba(182,255,60,0.18)",
        },
        reveal: {
          DEFAULT: "#FFB347",
          dim: "#C7841F",
          glow: "rgba(255,179,71,0.18)",
        },
        bleed: {
          DEFAULT: "#FF6B5B",
          dim: "#B84A3E",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.02em",
      },
      animation: {
        scramble: "scramble 1.6s steps(20, end) forwards",
        pulse_signal: "pulse_signal 2.4s ease-in-out infinite",
        marquee: "marquee 80s linear infinite",
      },
      keyframes: {
        scramble: {
          "0%": { opacity: "0.4" },
          "100%": { opacity: "1" },
        },
        pulse_signal: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(182,255,60,0.4)" },
          "50%": { boxShadow: "0 0 0 6px rgba(182,255,60,0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      backgroundImage: {
        "grid-noise":
          "radial-gradient(circle at 1px 1px, rgba(232,230,223,0.04) 1px, transparent 0)",
      },
      backgroundSize: {
        "grid-cell": "24px 24px",
      },
    },
  },
};

export default config;
