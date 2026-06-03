"use client";

import { useEffect, useRef } from "react";

/*
 * CipherCanvas — generative hero visual.
 *
 * Algorithmic philosophy:
 *   A noise field steers a population of glyphs across the canvas. Each glyph
 *   is a single monospace character pulled from a cipher pool. The field is
 *   sampled with simplex-style 3D noise (custom value-noise impl, no extra
 *   deps) and time. Glyphs drift along the field; when they cross certain
 *   contour bands they "leak" — briefly resolving into a digit before
 *   re-encrypting.
 *
 *   The visual reads as: order beneath turbulence. Encrypted data that has
 *   structure — which is exactly what FHE provides. Seeded randomness keeps
 *   the loop deterministic across reloads if a seed is passed.
 */

const GLYPHS = "▒░▓█╳╱╲║┃╪◇◆⌬◊⎔✦✧";
const DIGITS = "0123456789";

function makeRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xffffff) / 0xffffff;
  };
}

// Cheap 3D value noise.
function makeNoise(rand: () => number) {
  const N = 64;
  const grid = new Float32Array(N * N * N);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();
  const wrap = (x: number) => ((x % N) + N) % N;
  const fade = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number, z: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    const fx = fade(x - ix);
    const fy = fade(y - iy);
    const fz = fade(z - iz);
    const sample = (X: number, Y: number, Z: number) =>
      grid[wrap(X) * N * N + wrap(Y) * N + wrap(Z)];
    const c000 = sample(ix, iy, iz);
    const c100 = sample(ix + 1, iy, iz);
    const c010 = sample(ix, iy + 1, iz);
    const c110 = sample(ix + 1, iy + 1, iz);
    const c001 = sample(ix, iy, iz + 1);
    const c101 = sample(ix + 1, iy, iz + 1);
    const c011 = sample(ix, iy + 1, iz + 1);
    const c111 = sample(ix + 1, iy + 1, iz + 1);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const x00 = lerp(c000, c100, fx);
    const x10 = lerp(c010, c110, fx);
    const x01 = lerp(c001, c101, fx);
    const x11 = lerp(c011, c111, fx);
    const y0 = lerp(x00, x10, fy);
    const y1 = lerp(x01, x11, fy);
    return lerp(y0, y1, fz);
  };
}

export function CipherCanvas({
  seed = 42,
  density = 0.45,
  className = "",
}: {
  seed?: number;
  density?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rand = makeRand(seed);
    const noise = makeNoise(rand);

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const fit = () => {
      const parent = canvas.parentElement!;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas.parentElement!);

    const cell = 14;
    let t = 0;
    let raf = 0;

    const tick = () => {
      ctx.fillStyle = "#07080A";
      ctx.fillRect(0, 0, w, h);

      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textBaseline = "top";

      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // sample noise at this cell
          const nx = c * 0.04;
          const ny = r * 0.04;
          const nz = t * 0.004;
          const n = noise(nx, ny, nz);

          // density gate — many cells stay empty for breathing room
          if (n < density) continue;

          const isLeak = n > 0.78 && Math.floor((t + c * 7 + r * 11) % 23) === 0;
          const ch = isLeak
            ? DIGITS[(c * 31 + r * 13 + Math.floor(t)) % DIGITS.length]
            : GLYPHS[Math.floor(n * 89 + r * 3 + c) % GLYPHS.length];

          // color by noise band, gently varying alpha
          const alpha = 0.08 + (n - density) * 0.55;
          if (isLeak) {
            ctx.fillStyle = `rgba(255,179,71,${Math.min(0.9, alpha + 0.35)})`;
          } else {
            ctx.fillStyle = `rgba(182,255,60,${alpha})`;
          }
          ctx.fillText(ch, c * cell, r * cell);
        }
      }

      t += 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [seed, density]);

  return (
    <canvas
      ref={ref}
      className={`block ${className}`}
      aria-hidden
    />
  );
}
