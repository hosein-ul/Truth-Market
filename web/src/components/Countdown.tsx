"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { countdown } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Countdown({
  deadlineSec,
  className,
  withIcon = true,
}: {
  deadlineSec: number;
  className?: string;
  withIcon?: boolean;
}) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const expired = deadlineSec - now <= 0;
  const text = expired ? "Closed" : countdown(deadlineSec, now);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums",
        expired ? "text-muted-foreground" : "",
        className,
      )}
    >
      {withIcon && <Clock className="h-3.5 w-3.5" />}
      {text}
    </span>
  );
}
