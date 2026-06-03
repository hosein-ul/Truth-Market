"use client";

import { useEffect, useRef, useState } from "react";

// EncryptedValue — visual primitive at the heart of the design.
//
// While `revealed` is false, a fixed-width band of monospace glyphs drifts
// over a deterministic per-mount character pool. The motion is *quiet* —
// this should feel sealed, not chaotic. When `revealed` becomes true with a
// `value`, the glyphs cross-fade and snap into the cleartext, with a brief
// scramble settling animation.

const GLYPHS = "▓▒░█▌▐┃║╳╲╱✦✧⌬⌭⎔◇◆◊";
const SEED_ROTATIONS = 50;

export interface EncryptedValueProps {
  revealed: boolean;
  value?: string;
  width?: number; // number of glyph columns when encrypted
  className?: string;
  tone?: "signal" | "reveal" | "dim";
}

function pickGlyph(seed: number) {
  const i = (seed * 9301 + 49297) % GLYPHS.length;
  return GLYPHS[Math.abs(i)] ?? "▒";
}

export function EncryptedValue({
  revealed,
  value,
  width = 8,
  className = "",
  tone = "signal",
}: EncryptedValueProps) {
  const [tick, setTick] = useState(0);
  const seedRef = useRef(Math.floor(Math.random() * 1e6));

  useEffect(() => {
    if (revealed) return;
    const id = setInterval(() => setTick((t) => t + 1), 220);
    return () => clearInterval(id);
  }, [revealed]);

  if (revealed && value !== undefined) {
    return (
      <span
        className={`font-mono num ${
          tone === "reveal"
            ? "text-reveal"
            : tone === "signal"
              ? "text-signal"
              : "text-bone"
        } ${className}`}
        data-revealed
      >
        {value}
      </span>
    );
  }

  // encrypted state — produce a stable-width band of glyphs
  const glyphs = Array.from({ length: width }).map((_, i) => {
    const seed = seedRef.current + i * 31 + (tick % SEED_ROTATIONS);
    return pickGlyph(seed);
  });

  return (
    <span
      className={`font-mono tracking-[0.04em] select-none ${
        tone === "dim" ? "text-bone-dim" : "text-signal"
      } ${className}`}
      aria-label="encrypted value"
      title="This value is encrypted on-chain."
    >
      {glyphs.join("")}
    </span>
  );
}
