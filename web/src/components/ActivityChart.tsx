"use client";

import { Activity, TrendingUp } from "lucide-react";
import { AreaChart, Area, CartesianGrid, XAxis } from "recharts";
import type { ActivityItem } from "@/lib/activity";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const POINTS = 24;

function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededSeries(seed: string): number[] {
  let s = fnv1a(seed) || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const out: number[] = [];
  let v = 0.3 + rand() * 0.2;
  for (let i = 0; i < POINTS; i++) {
    const drift = (i / POINTS) * 0.45;
    v += (rand() - 0.42) * 0.18;
    v = Math.max(0.08, Math.min(1, v));
    out.push(Math.max(0.05, Math.min(1, v * 0.55 + drift)));
  }
  return out;
}

function realSeries(items: ActivityItem[]): number[] | null {
  const blocks = items.map((i) => Number(i.blockNumber)).filter((n) => n > 0);
  if (blocks.length === 0) return null;
  const counts = new Array(POINTS).fill(0);
  const min = Math.min(...blocks);
  const max = Math.max(...blocks);
  const span = Math.max(max - min, 1);
  for (const b of blocks) {
    const idx = Math.min(POINTS - 1, Math.floor(((b - min) / span) * (POINTS - 1)));
    counts[idx]++;
  }
  const peak = Math.max(...counts, 1);
  return counts.map((c) => c / peak);
}

const chartConfig: ChartConfig = {
  momentum: { label: "Momentum", color: "hsl(var(--primary))" },
};

export function ActivityChart({
  items,
  seed = "",
  betCount,
}: {
  items: ActivityItem[];
  seed?: string;
  betCount?: number;
}) {
  const real = realSeries(items);
  const values = real ?? seededSeries(seed || "truthmarket");
  const indicative = !real;
  const total = real ? items.length : betCount ?? 0;

  const data = values.map((v, i) => ({ index: i, momentum: Math.round(v * 100) }));

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Prediction flow</CardTitle>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-primary" />
            {indicative ? "Indicative" : "Live flow"}
          </span>
        </div>
        <CardDescription>
          Prediction momentum over time. Individual positions stay private.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-32 w-full">
          <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
            <defs>
              <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-momentum)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-momentum)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--border))"
              strokeDasharray="3 4"
              opacity={0.6}
            />
            <XAxis dataKey="index" hide />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelFormatter={() => "Momentum"}
                  valueFormatter={(v) => `${v}%`}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="momentum"
              stroke="var(--color-momentum)"
              strokeWidth={2.5}
              fill="url(#momentumFill)"
              dot={false}
              activeDot={{ r: 4, stroke: "hsl(var(--card))", strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ChartContainer>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            {indicative ? "Trending up" : "Updated from chain"}
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {total.toLocaleString()} positions
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
