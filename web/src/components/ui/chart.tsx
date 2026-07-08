"use client";

// Minimal shadcn/ui-style Recharts wrapper: a theme-aware ChartContainer that
// injects each series' color as a CSS var (so charts read design tokens
// instead of hardcoded hex) plus a themed tooltip. Kept intentionally small —
// only what TruthMarket's charts actually need — rather than vendoring every
// shadcn chart primitive (legend, multi-series config, etc.) unused.

import * as React from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label: string; color: string }>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: React.ReactElement;
}) {
  const style = Object.fromEntries(
    Object.entries(config).map(([key, v]) => [`--color-${key}`, v.color]),
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("h-full w-full", className)} style={style}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Tooltip;

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; name?: string; color?: string }>;
  label?: string | number;
  labelFormatter?: (label: string | number) => React.ReactNode;
  valueFormatter?: (value: number | string) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-card">
      {label !== undefined && (
        <div className="mb-1 font-semibold text-popover-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: p.color }}
          />
          <span className="font-medium tabular-nums text-popover-foreground">
            {p.value !== undefined && valueFormatter ? valueFormatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
