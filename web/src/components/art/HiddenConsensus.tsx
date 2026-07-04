"use client";

import { useEffect, useRef } from "react";

/**
 * "Hidden Consensus" — algorithmic art (see web/art/hidden-consensus.md).
 *
 * A layered Perlin flow field stands in for the public probability surface. A
 * dense population of particles — each carrying a private, never-exposed "side" —
 * streams along the field and accumulates into luminous density ridges. A
 * particle's color is the LOCAL CONSENSUS of the region it crosses (warm
 * conviction ↔ cool doubt), never its own hidden value: per-agent privacy,
 * aggregate transparency, rendered as motion.
 *
 * Deterministic (seeded) so the structure is reproducible, but the consensus
 * current drifts on a slow noise z-axis so it breathes continuously. Pauses when
 * the tab is hidden; re-seeds on resize. Tuned for a light canvas.
 */
export function HiddenConsensus({ className, seed = 42 }: { className?: string; seed?: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<any>(null);

  useEffect(() => {
    if (!hostRef.current || p5Ref.current) return;
    let cleanup: (() => void) | null = null;

    import("p5").then((mod) => {
      const P5 = mod.default;
      const host = hostRef.current;
      if (!host) return;

      const sketch = (p: any) => {
        // Polarized charges: conviction (Zama yellow) ↔ doubt (charcoal).
        const CONVICTION = [255, 210, 8];
        const DOUBT = [45, 45, 45];

        let w = 0;
        let h = 0;
        let z = 0; // consensus current drifts through the noise volume
        let particles: {
          x: number; y: number; vx: number; vy: number;
          side: number; life: number; maxLife: number; speed: number;
        }[] = [];

        // Density scales with area — a master flow integrator stays lively but light.
        let COUNT = 900;
        const FIELD = 0.0019; // primary octave
        const FIELD2 = 0.0041; // turbulence octave
        const Z_DRIFT = 0.0011;

        function reseed() {
          p.randomSeed(seed);
          p.noiseSeed(seed);
          COUNT = Math.round(p.constrain((w * h) / 1500, 600, 1800));
          particles = [];
          for (let i = 0; i < COUNT; i++) particles.push(spawn(true));
        }

        function spawn(initial: boolean) {
          const maxLife = p.random(60, 200);
          return {
            x: p.random(w),
            y: p.random(h),
            vx: 0,
            vy: 0,
            // a particle's private side — never drawn directly, only ever
            // nudges the density it contributes to.
            side: p.random() < 0.5 ? 0 : 1,
            life: initial ? p.random(maxLife) : 0,
            maxLife,
            speed: p.random(0.6, 1.7),
          };
        }

        // Local consensus of a point: layered noise → [0,1], warm↔cool.
        function consensus(x: number, y: number) {
          const a = p.noise(x * FIELD, y * FIELD, z);
          const b = p.noise(x * FIELD2 + 31.7, y * FIELD2 + 9.2, z * 1.6);
          return p.constrain(a * 0.72 + b * 0.28, 0, 1);
        }

        function fieldAngle(x: number, y: number) {
          const n = p.noise(x * FIELD, y * FIELD, z);
          const t = p.noise(x * FIELD2 + 100, y * FIELD2 + 100, z * 1.6);
          // two octaves compose into turbulent-yet-coherent flow
          return (n * 2.2 + t * 1.1) * p.TWO_PI;
        }

        p.setup = () => {
          w = host!.clientWidth;
          h = host!.clientHeight;
          const c = p.createCanvas(w, h);
          c.style("display", "block");
          p.background(255);
          reseed();
        };

        p.draw = () => {
          z += Z_DRIFT;
          // Sub-pixel trail accumulation: fade toward white so ridges build up
          // where many trajectories converge, and quiet zones dissolve.
          p.noStroke();
          p.fill(255, 255, 255, 9);
          p.rect(0, 0, w, h);

          for (let i = 0; i < particles.length; i++) {
            const s = particles[i];
            const ang = fieldAngle(s.x, s.y);
            s.vx = Math.cos(ang) * s.speed;
            s.vy = Math.sin(ang) * s.speed;

            const px = s.x;
            const py = s.y;
            s.x += s.vx;
            s.y += s.vy;
            s.life++;

            // Color is the LOCAL consensus, with only a faint private bias —
            // the hidden side perturbs hue slightly but is never legible.
            const cVal = p.constrain(
              consensus(s.x, s.y) + (s.side === 0 ? -0.05 : 0.05),
              0,
              1,
            );
            const r = p.lerp(CONVICTION[0], DOUBT[0], cVal);
            const g = p.lerp(CONVICTION[1], DOUBT[1], cVal);
            const b = p.lerp(CONVICTION[2], DOUBT[2], cVal);

            // fade in/out over lifetime; convergence reads as brighter ridges
            const lifeT = s.life / s.maxLife;
            const env = Math.sin(lifeT * Math.PI); // 0→1→0
            const alpha = 28 + env * 66;

            p.stroke(r, g, b, alpha);
            p.strokeWeight(1.0 + env * 1.35);
            p.line(px, py, s.x, s.y);

            const off =
              s.x < -10 || s.x > w + 10 || s.y < -10 || s.y > h + 10;
            if (s.life >= s.maxLife || off) particles[i] = spawn(false);
          }
        };

        p.windowResized = () => {
          // The ResizeObserver fires immediately on observe — before p5 has
          // run setup() and created the renderer. Bail until the canvas exists.
          if (!host || !p.canvas) return;
          w = host.clientWidth;
          h = host.clientHeight;
          p.resizeCanvas(w, h);
          p.background(255);
          reseed();
        };
      };

      p5Ref.current = new P5(sketch, host);

      const ro = new ResizeObserver(() => {
        if (p5Ref.current?.windowResized) p5Ref.current.windowResized();
      });
      ro.observe(host);

      const onVis = () => {
        if (!p5Ref.current) return;
        if (document.hidden) p5Ref.current.noLoop();
        else p5Ref.current.loop();
      };
      document.addEventListener("visibilitychange", onVis);

      cleanup = () => {
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        if (p5Ref.current) {
          p5Ref.current.remove();
          p5Ref.current = null;
        }
      };
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [seed]);

  return (
    <div ref={hostRef} className={className} aria-hidden style={{ pointerEvents: "none" }} />
  );
}
