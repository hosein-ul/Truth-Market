"use client";

import { useEffect, useRef } from "react";

// Algorithmic art for the hero: a Perlin-noise FLOW FIELD rendered as flowing
// ribbons (streamlines). Each ribbon is re-integrated every frame from a fixed,
// seeded start point through the field while the noise z-axis drifts with time —
// so the structure is deterministic (seed 42) but breathes continuously.
//
// Color encodes the market metaphor: ribbons lerp from YES-orange on the left to
// NO-sky on the right, with a handful of brighter "signal" streamlines that
// pulse — a probability field you can feel, not just a flat gradient.

export function GenerativeHero({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || p5Ref.current) return;
    let cleanup: (() => void) | null = null;

    import("p5").then((mod) => {
      const P5 = mod.default;
      const host = containerRef.current;
      if (!host) return;

      const sketch = (p: any) => {
        const SEED = 42;
        const ORANGE = [249, 115, 22];
        const SKY = [14, 165, 233];
        let w = 0;
        let h = 0;
        let time = 0;
        let seeds: { x: number; y: number; signal: boolean; phase: number }[] = [];

        const COUNT = 130;
        const STEPS = 54;
        const STEP_LEN = 9;
        const NOISE_SCALE = 0.0016;

        function rebuildSeeds() {
          p.randomSeed(SEED);
          seeds = [];
          for (let i = 0; i < COUNT; i++) {
            seeds.push({
              x: p.random(-w * 0.05, w * 1.05),
              y: p.random(h),
              signal: p.random() < 0.14,
              phase: p.random(p.TWO_PI),
            });
          }
        }

        function lerpColor(t: number, a: number) {
          const r = p.lerp(ORANGE[0], SKY[0], t);
          const g = p.lerp(ORANGE[1], SKY[1], t);
          const b = p.lerp(ORANGE[2], SKY[2], t);
          return p.color(r, g, b, a);
        }

        p.setup = () => {
          w = host!.clientWidth;
          h = host!.clientHeight;
          const c = p.createCanvas(w, h);
          c.style("display", "block");
          p.noiseSeed(SEED);
          rebuildSeeds();
        };

        p.draw = () => {
          p.clear();
          time += 0.0016;

          for (let i = 0; i < seeds.length; i++) {
            const s = seeds[i];
            const t = p.constrain(s.x / w, 0, 1);
            const pulse = s.signal ? 0.5 + 0.5 * Math.sin(time * 40 + s.phase) : 0;
            const baseAlpha = s.signal ? 70 + pulse * 95 : 30;
            const weight = s.signal ? 2.1 + pulse * 1.8 : 1.4;

            p.noFill();
            p.stroke(lerpColor(t, baseAlpha));
            p.strokeWeight(weight);
            p.beginShape();

            let x = s.x;
            let y = s.y;
            for (let step = 0; step < STEPS; step++) {
              const angle =
                p.noise(x * NOISE_SCALE, y * NOISE_SCALE, time) * p.TWO_PI * 2;
              x += Math.cos(angle) * STEP_LEN;
              y += Math.sin(angle) * STEP_LEN;
              if (x < -40 || x > w + 40 || y < -40 || y > h + 40) break;
              p.vertex(x, y);
            }
            p.endShape();

            // glowing head on signal streamlines
            if (s.signal) {
              p.noStroke();
              p.fill(lerpColor(t, 70 + pulse * 90));
              p.circle(x, y, 3 + pulse * 4);
            }
          }
        };

        p.windowResized = () => {
          if (!host) return;
          w = host.clientWidth;
          h = host.clientHeight;
          p.resizeCanvas(w, h);
          rebuildSeeds();
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
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden
      style={{ pointerEvents: "none" }}
    />
  );
}
