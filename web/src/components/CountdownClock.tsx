"use client";

import { useEffect, useState } from "react";
import { countdown } from "@/lib/format";

export function CountdownClock({
  deadlineSec,
  className = "",
  compact = false,
}: {
  deadlineSec: number;
  className?: string;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const txt = countdown(deadlineSec, now);
  const expired = deadlineSec - now <= 0;
  if (compact) {
    return (
      <span
        className={`chip chip-cat ${expired ? "opacity-50" : ""} ${className}`}
      >
        {expired ? "expired" : txt}
      </span>
    );
  }
  return (
    <span
      className={`font-mono num text-[11px] tracking-[0.08em] ${
        expired ? "text-bone-dark" : "text-bone-dim"
      } ${className}`}
    >
      {expired ? "EXPIRED" : `T-${txt.toUpperCase()}`}
    </span>
  );
}
