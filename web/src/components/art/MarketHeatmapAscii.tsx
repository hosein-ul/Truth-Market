"use client";

import { useEffect, useRef } from "react";

/**
 * MarketHeatmapAscii
 *
 * ASCII art visualization of a prediction market probability heatmap.
 * Characters are placed in a grid; their density and type follow a
 * bell-curve distribution centered at the market's YES probability.
 *
 * Dense center zone → solid block chars (market consensus)
 * Mid zone          → cipher/encrypted chars (individual positions hidden)
 * Sparse edges      → void chars (no signal)
 *
 * Individual "predictions" flash briefly as gold highlights.
 */

const YES_CHARS  = ["Y","E","S","↑","+","▲","6","4","%","■","▪"];
const NO_CHARS   = ["N","O","↓","−","▼","3","6","%","■","▪"];
const MID_CHARS  = ["░","▒","◌","○","·","⊕","⊗","∅","?","×"];
const VOID_CHARS = ["·","˙","∙"," "," "];
const ALL_CHARS  = [...YES_CHARS, ...NO_CHARS, ...MID_CHARS];

function gaussian(x: number, mu: number, sigma: number) {
  return Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
}

function cellWeight(col: number, row: number, cols: number, rows: number, yesProb: number) {
  const xn = col / cols;   // 0→1
  const yn = row / rows;   // 0→1
  // Horizontal: bell curve centred at yesProb
  const xW = gaussian(xn, yesProb, 0.2);
  // Vertical: mountain — tallest 40% from top, fade to edges
  const yW = gaussian(yn, 0.42, 0.28);
  return xW * yW;
}

function pickChar(col: number, cols: number, weight: number, t: number, yesProb: number): string {
  const xn = col / cols;
  if (weight < 0.03) return VOID_CHARS[Math.floor(Math.random() * VOID_CHARS.length)];
  if (weight < 0.16) return MID_CHARS[Math.floor((t * 0.3 + col * 0.7) % MID_CHARS.length)];
  // YES zone (left side of distribution)
  if (xn < yesProb - 0.04) return YES_CHARS[Math.floor((t * 0.2 + col * 1.3) % YES_CHARS.length)];
  // NO zone (right side)
  if (xn > yesProb + 0.04) return NO_CHARS[Math.floor((t * 0.15 + col * 1.1) % NO_CHARS.length)];
  // Boundary / cipher zone
  return MID_CHARS[Math.floor((t + col) % MID_CHARS.length)];
}

interface Flash { col: number; row: number; life: number; maxLife: number; }

export function MarketHeatmapAscii({
  className,
  yesProb = 0.62,
}: {
  className?: string;
  yesProb?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    // Sizing
    const COLS = 54;
    const ROWS = 26;
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width  = W * window.devicePixelRatio;
      canvas.height = H * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const cellW = () => W / COLS;
    const cellH = () => H / ROWS;

    // Pre-compute weights
    let weights: number[][] = [];
    const reweight = () => {
      weights = Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => cellWeight(c, r, COLS, ROWS, yesProb))
      );
    };
    reweight();

    // Char state — slow mutation
    let chars: string[][] = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => pickChar(c, COLS, weights[r][c], 0, yesProb))
    );

    // Flashing predictions
    let flashes: Flash[] = [];
    let flashTimer = 0;

    let t = 0;
    let lastMutate = 0;

    function draw(ts: number) {
      t = ts * 0.001;
      ctx.clearRect(0, 0, W, H);

      const cW = cellW();
      const cH = cellH();
      const fontSize = Math.max(9, Math.min(cW * 0.72, 14));
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign    = "center";

      // Mutate some chars every ~80ms
      if (ts - lastMutate > 80) {
        lastMutate = ts;
        const count = Math.floor(COLS * ROWS * 0.04); // 4% of cells per tick
        for (let i = 0; i < count; i++) {
          const r = Math.floor(Math.random() * ROWS);
          const c = Math.floor(Math.random() * COLS);
          chars[r][c] = pickChar(c, COLS, weights[r][c], t + Math.random(), yesProb);
        }
      }

      // Spawn new flash ~every 600ms
      flashTimer += ts;
      if (flashTimer > 600) {
        flashTimer = 0;
        // Pick a cell in the high-weight region
        let attempts = 0;
        while (attempts++ < 20) {
          const r = Math.floor(Math.random() * ROWS);
          const c = Math.floor(Math.random() * COLS);
          if (weights[r][c] > 0.3) {
            flashes.push({ col: c, row: r, life: 0, maxLife: 40 });
            break;
          }
        }
      }

      // Draw chars
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const w  = weights[r][c];
          if (w < 0.03) continue;

          const x = c * cW + cW * 0.5;
          const y = r * cH + cH * 0.5;

          // Check flash
          const flash = flashes.find(f => f.col === c && f.row === r);
          if (flash) {
            const prog = flash.life / flash.maxLife;
            const alpha = prog < 0.5 ? prog * 2 : (1 - prog) * 2;
            ctx.fillStyle = `rgba(180, 130, 10, ${alpha * 0.95})`;
            ctx.fillText(ALL_CHARS[Math.floor(flash.life % ALL_CHARS.length)], x, y);
            continue;
          }

          // Base alpha: weight-driven — stronger for better visibility
          const alpha = Math.min(0.88, w * 1.6 + 0.08);
          // YES zone darker charcoal, NO zone medium gray
          const xn = c / COLS;
          const lightness = xn < yesProb ? 20 : 55;
          ctx.fillStyle = `rgba(${lightness},${lightness - 2},${lightness - 8},${alpha})`;
          ctx.fillText(chars[r][c], x, y);
        }
      }

      // Advance flashes
      flashes = flashes
        .map(f => ({ ...f, life: f.life + 1 }))
        .filter(f => f.life < f.maxLife);

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [yesProb]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden
    />
  );
}
