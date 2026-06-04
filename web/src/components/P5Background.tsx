"use client";

import { useEffect, useRef } from "react";

export function P5Background() {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || p5Ref.current) return;

    let cleanup: (() => void) | null = null;

    import("p5").then((mod) => {
      const P5 = mod.default;
      if (!containerRef.current) return;

      const sketch = (p: any) => {
        const SEED = 42;
        const particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; hue: number }[] = [];
        let w = 0;
        let h = 0;
        let time = 0;

        p.setup = () => {
          w = window.innerWidth;
          h = window.innerHeight;
          const canvas = p.createCanvas(w, h);
          canvas.style("position", "fixed");
          canvas.style("top", "0");
          canvas.style("left", "0");
          canvas.style("z-index", "-1");
          canvas.style("pointer-events", "none");
          p.randomSeed(SEED);
          p.noiseSeed(SEED);
          p.colorMode(p.HSB, 360, 100, 100, 100);

          for (let i = 0; i < 60; i++) {
            spawnParticle(p);
          }
        };

        function spawnParticle(p: any) {
          particles.push({
            x: p.random(w),
            y: p.random(h),
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: p.random(200, 600),
            hue: p.random() < 0.6 ? p.random(20, 35) : p.random(195, 210),
          });
        }

        p.draw = () => {
          p.clear();
          time += 0.003;

          for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i];
            const noiseScale = 0.002;
            const angle = p.noise(pt.x * noiseScale, pt.y * noiseScale, time) * p.TWO_PI * 2;
            pt.vx = p.cos(angle) * 0.6;
            pt.vy = p.sin(angle) * 0.6;
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.life++;

            const lifeFrac = pt.life / pt.maxLife;
            const alpha = Math.sin(lifeFrac * Math.PI) * 8;

            p.noStroke();
            p.fill(pt.hue, 30, 90, alpha);
            const size = 2 + Math.sin(lifeFrac * Math.PI) * 3;
            p.ellipse(pt.x, pt.y, size, size);

            if (pt.life > pt.maxLife || pt.x < -20 || pt.x > w + 20 || pt.y < -20 || pt.y > h + 20) {
              particles.splice(i, 1);
              spawnParticle(p);
            }
          }

          // flowing probability curves
          p.noFill();
          for (let c = 0; c < 3; c++) {
            const hue = c === 0 ? 25 : c === 1 ? 200 : 145;
            p.stroke(hue, 25, 85, 3);
            p.strokeWeight(1.5);
            p.beginShape();
            for (let x = 0; x < w; x += 4) {
              const y = h * 0.5 +
                p.noise(x * 0.003, time * 0.8 + c * 100) * h * 0.3 -
                h * 0.15 +
                Math.sin(x * 0.005 + time * 2 + c) * 30;
              p.curveVertex(x, y);
            }
            p.endShape();
          }
        };

        p.windowResized = () => {
          w = window.innerWidth;
          h = window.innerHeight;
          p.resizeCanvas(w, h);
        };
      };

      p5Ref.current = new P5(sketch, containerRef.current!);

      const handleVisibility = () => {
        if (!p5Ref.current) return;
        if (document.hidden) {
          p5Ref.current.noLoop();
        } else {
          p5Ref.current.loop();
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);

      cleanup = () => {
        document.removeEventListener("visibilitychange", handleVisibility);
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

  return <div ref={containerRef} className="pointer-events-none fixed inset-0 -z-10" aria-hidden />;
}
