"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * CipherLightBg — ink-on-paper cipher streams for light mode.
 *
 * Encrypted characters slowly fall like ink drops onto parchment,
 * accumulate into columns, then fade. Very low opacity — creates
 * a subtle document-texture feel, not distracting.
 * Occasional horizontal scan pulse (lighter sweep, barely visible).
 */

const GLYPHS =
  "0123456789ABCDEFabcdef▓▒░│┤┐└┴┬├─┼┘┌█▄▀■□▪▫◆◇○●⊕⊗⊘∅∞≠≡≈∑∫∂∇";

export function CipherLightBg() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const pathname = usePathname();
  const enabled = pathname === "/";

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      pointer-events:none;z-index:-1;
    `;
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;

    const COLS = 48;
    let W = 0, H = 0;
    let drops: { y: number; speed: number; len: number; phase: number }[] = [];
    let colW = 0;
    let scanY = -1;
    let lastScan = 0;

    function rng(max: number) { return Math.random() * max; }

    function init() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      colW = W / COLS;
      drops = Array.from({ length: COLS }, () => ({
        y: rng(-H * 1.5),
        speed: rng(0.6) + 0.3,
        len: Math.floor(rng(14) + 6),
        phase: rng(Math.PI * 2),
      }));
    }

    init();
    window.addEventListener("resize", init);

    let t = 0;
    let lastMut = 0;
    const charCache: string[][] = Array.from({ length: COLS }, () =>
      Array.from({ length: 20 }, () => GLYPHS[Math.floor(rng(GLYPHS.length))])
    );

    function draw(ts: number) {
      t = ts * 0.001;

      // Translucent fill — creates persistent but fading trails on white
      ctx.fillStyle = "rgba(249,249,251,0.14)";
      ctx.fillRect(0, 0, W, H);

      // Scan pulse every ~6s
      const now = Date.now();
      if (now - lastScan > 6000) { scanY = 0; lastScan = now; }
      if (scanY >= 0 && scanY < H + 40) {
        scanY += 1.8;
        ctx.fillStyle = "rgba(200,200,200,0.04)";
        ctx.fillRect(0, scanY - 2, W, 4);
      }

      // Mutate chars slowly
      if (ts - lastMut > 120) {
        lastMut = ts;
        for (let c = 0; c < COLS; c++) {
          if (Math.random() < 0.3) {
            const j = Math.floor(Math.random() * charCache[c].length);
            charCache[c][j] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }
      }

      ctx.font = `11px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let c = 0; c < COLS; c++) {
        const d = drops[c];
        d.y += d.speed;
        if (d.y - d.len * 14 > H + 100) {
          d.y = rng(-200) - 50;
          d.speed = rng(0.6) + 0.3;
        }

        const x = c * colW + colW * 0.5;

        for (let j = 0; j < d.len; j++) {
          const cy = d.y - j * 14;
          if (cy < 0 || cy > H) continue;

          // Very subtle opacity gradient — leading char darkest, tail fades
          const lifeFrac = j / d.len;
          const alpha = j === 0
            ? 0.22
            : j < 3
            ? 0.14 - j * 0.03
            : (1 - lifeFrac) * 0.08;

          ctx.fillStyle = `rgba(10,10,10,${alpha})`;
          ctx.fillText(charCache[c][j % charCache[c].length], x, cy);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(rafRef.current);
      else rafRef.current = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", init);
      document.removeEventListener("visibilitychange", onVis);
      canvas.remove();
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={containerRef} className="pointer-events-none fixed inset-0" style={{ zIndex: -1 }} aria-hidden />;
}
