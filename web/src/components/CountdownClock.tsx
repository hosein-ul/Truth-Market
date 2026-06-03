"use client";

import { useEffect, useState } from "react";
import { countdown } from "@/lib/format";

export function CountdownClock({
  deadlineSec,
  className = "",
}: {
  deadlineSec: number;
  className?: string;
}) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const txt = countdown(deadlineSec, now);
  const expired = deadlineSec - now <= 0;
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
