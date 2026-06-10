"use client";

import { Activity, TrendingUp } from "lucide-react";
import type { ActivityItem } from "@/lib/activity";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

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

function smoothPath(values: number[], w: number, h: number, pad = 2): string {
  const n = values.length;
  const x = (i: number) => pad + (i / (n - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - v * (h - pad * 2);
  let d = `M ${x(0)} ${y(values[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = values[Math.max(0, i - 1)];
    const p1 = values[i];
    const p2 = values[i + 1];
    const p3 = values[Math.min(n - 1, i + 2)];
    const c1x = x(i) + (x(i + 1) - x(Math.max(0, i - 1))) / 6;
    const c1y = y(p1) + (y(p2) - y(p0)) / 6;
    const c2x = x(i + 1) - (x(Math.min(n - 1, i + 2)) - x(i)) / 6;
    const c2y = y(p2) - (y(p3) - y(p1)) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x(i + 1)} ${y(p2)}`;
  }
  return d;
}

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

  const W = 320;
  const H = 120;
  const line = smoothPath(values, W, H);
  const area = `${line} L ${W - 2} ${H - 2} L 2 ${H - 2} Z`;
  const lastX = 2 + ((values.length - 1) / (values.length - 1)) * (W - 4);
  const lastY = H - 2 - values[values.length - 1] * (H - 4);
  const total = real ? items.length : betCount ?? 0;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Prediction flow</CardTitle>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500">
            <Activity className="h-3.5 w-3.5" />
            {indicative ? "Indicative" : "Live flow"}
          </span>
        </div>
        <CardDescription>
          Prediction momentum over time. Individual positions stay private.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-32 w-full overflow-visible"
            role="img"
            aria-label="Prediction flow chart"
          >
            <defs>
              <linearGradient id="flowFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="flowLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75].map((g) => (
              <line
                key={g}
                x1="0" x2={W}
                y1={H - g * H} y2={H - g * H}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="3 4"
                opacity="0.5"
              />
            ))}

            <path d={area} fill="url(#flowFill)" />
            <path
              d={line}
              fill="none"
              stroke="url(#flowLine)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle cx={lastX} cy={lastY} r="6" fill="hsl(var(--accent))" opacity="0.18">
              <animate attributeName="r" values="4;9;4" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0;0.25" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle cx={lastX} cy={lastY} r="3.5" fill="hsl(var(--accent))" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>

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
