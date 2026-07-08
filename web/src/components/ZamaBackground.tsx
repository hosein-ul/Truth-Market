"use client";

import { useEffect, useRef } from "react";

/**
 * Site-wide ambient background — a slow, deterministic "consensus field":
 * drifting nodes connected when close, in Zama yellow on the page surface.
 * Seeded (no Math.random) so every load renders the same field; adapts to
 * light/dark via the `html.dark` class; pauses when the tab is hidden.
 */
export function ZamaBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mulberry32 — tiny seeded PRNG, fixed seed for a stable composition.
    let s = 42;
    const rand = () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const N = 42;
    const nodes = Array.from({ length: N }, () => ({
      x: rand(),
      y: rand(),
      vx: (rand() - 0.5) * 0.00022,
      vy: (rand() - 0.5) * 0.00022,
      r: 1 + rand() * 1.8,
    }));

    let raf = 0;
    let running = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      if (!running) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dark = document.documentElement.classList.contains("dark");
      ctx.clearRect(0, 0, w, h);

      const nodeColor = dark ? "255, 210, 8" : "166, 131, 0";
      const linkColor = dark ? "255, 210, 8" : "120, 95, 0";
      const nodeAlpha = dark ? 0.35 : 0.22;
      const linkAlpha = dark ? 0.1 : 0.07;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -0.02) n.x = 1.02;
        if (n.x > 1.02) n.x = -0.02;
        if (n.y < -0.02) n.y = 1.02;
        if (n.y > 1.02) n.y = -0.02;
      }

      // Links between close nodes.
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = (nodes[i].x - nodes[j].x) * w;
          const dy = (nodes[i].y - nodes[j].y) * h;
          const d2 = dx * dx + dy * dy;
          if (d2 < 170 * 170) {
            const a = linkAlpha * (1 - Math.sqrt(d2) / 170);
            ctx.strokeStyle = `rgba(${linkColor}, ${a})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * w, nodes[i].y * h);
            ctx.lineTo(nodes[j].x * w, nodes[j].y * h);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = `rgba(${nodeColor}, ${nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(n.x * w, n.y * h, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running) raf = requestAnimationFrame(draw);
      else cancelAnimationFrame(raf);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
