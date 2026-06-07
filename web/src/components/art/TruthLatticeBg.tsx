"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function TruthLatticeBg() {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<any>(null);
  const pathname = usePathname();
  const enabled = pathname === "/";

  useEffect(() => {
    if (!enabled) return;
    if (!containerRef.current || p5Ref.current) return;
    let cleanup: (() => void) | null = null;

    import("p5").then((mod) => {
      const P5 = mod.default;
      if (!containerRef.current) return;

      const sketch = (p: any) => {
        const N = 62;
        let W = 0;
        let H = 0;

        interface LatticeNode {
          x: number; y: number;
          tx: number; ty: number; // spring targets
          phase: number;
          sparkTimer: number;
        }
        let nodes: LatticeNode[] = [];
        let targetShiftTimer = 0;
        let hexOffset = 0;

        function shiftTargets() {
          for (const n of nodes) {
            n.tx = p.random(W * 0.05, W * 0.95);
            n.ty = p.random(H * 0.05, H * 0.95);
          }
        }

        p.setup = () => {
          W = window.innerWidth;
          H = window.innerHeight;
          const canvas = p.createCanvas(W, H);
          canvas.style("position", "fixed");
          canvas.style("top", "0");
          canvas.style("left", "0");
          canvas.style("z-index", "-1");
          canvas.style("pointer-events", "none");

          nodes = Array.from({ length: N }, () => {
            const x = p.random(W * 0.05, W * 0.95);
            const y = p.random(H * 0.05, H * 0.95);
            return { x, y, tx: x, ty: y, phase: p.random(p.TWO_PI), sparkTimer: 0 };
          });
          targetShiftTimer = p.millis();
        };

        p.draw = () => {
          p.background(10, 8, 15, 18);
          hexOffset += 0.003;

          // shift targets every ~9s for crystal phase transition
          if (p.millis() - targetShiftTimer > 9000) {
            shiftTargets();
            targetShiftTimer = p.millis();
            // trigger random sparks
            for (let i = 0; i < 4; i++) {
              nodes[Math.floor(Math.random() * N)].sparkTimer = 60;
            }
          }

          // isometric hex grid (very faint)
          p.stroke(155, 77, 255, 7);
          p.strokeWeight(0.5);
          const hexSize = 44;
          for (let row = -2; row < H / hexSize + 2; row++) {
            for (let col = -2; col < W / (hexSize * 1.732) + 2; col++) {
              const hx = col * hexSize * 1.732 + (row % 2 === 0 ? 0 : hexSize * 0.866);
              const hy = row * hexSize * 1.5 + (Math.sin(hexOffset + col * 0.3) * 3);
              p.noFill();
              // draw hex
              p.beginShape();
              for (let a = 0; a < 6; a++) {
                const ang = (p.PI / 3) * a;
                p.vertex(hx + hexSize * 0.44 * Math.cos(ang), hy + hexSize * 0.44 * Math.sin(ang));
              }
              p.endShape(p.CLOSE);
            }
          }

          // spring physics — nodes drift toward targets
          for (const n of nodes) {
            n.x += (n.tx - n.x) * 0.009;
            n.y += (n.ty - n.y) * 0.009;
            n.phase += 0.025;
            if (n.sparkTimer > 0) n.sparkTimer--;
          }

          // draw edges (Delaunay-like: connect nearby nodes)
          for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
              const dx = nodes[i].x - nodes[j].x;
              const dy = nodes[i].y - nodes[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 185) continue;

              const a = p.map(dist, 0, 185, 60, 4);
              const hasSpark = nodes[i].sparkTimer > 0 || nodes[j].sparkTimer > 0;

              if (hasSpark) {
                p.stroke(204, 102, 204, Math.min(a * 5, 200));
                p.strokeWeight(1.5);
              } else {
                p.stroke(155, 77, 255, a);
                p.strokeWeight(0.8);
              }
              p.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);

              // sparkle midpoint on spark edges
              if (hasSpark && dist < 120) {
                const mx = (nodes[i].x + nodes[j].x) / 2;
                const my = (nodes[i].y + nodes[j].y) / 2;
                const sparkA = p.map(
                  Math.max(nodes[i].sparkTimer, nodes[j].sparkTimer),
                  0, 60, 0, 180
                );
                p.noStroke();
                p.fill(204, 102, 204, sparkA);
                p.ellipse(mx, my, 4, 4);
              }
            }
          }

          // draw nodes
          p.noStroke();
          for (const n of nodes) {
            const glow = 0.5 + 0.5 * Math.sin(n.phase);
            const base = 4 + glow * 2;
            const a = 70 + glow * 80;

            if (n.sparkTimer > 0) {
              // bright spark
              p.fill(204, 102, 204, 220 * (n.sparkTimer / 60));
              p.ellipse(n.x, n.y, base * 3, base * 3);
              p.fill(255, 220, 255, 180 * (n.sparkTimer / 60));
              p.ellipse(n.x, n.y, base, base);
            } else {
              p.fill(155, 77, 255, a);
              p.ellipse(n.x, n.y, base, base);
            }
          }
        };

        p.windowResized = () => {
          W = window.innerWidth;
          H = window.innerHeight;
          p.resizeCanvas(W, H);
        };
      };

      p5Ref.current = new P5(sketch, containerRef.current!);

      const onVisibility = () => {
        if (!p5Ref.current) return;
        document.hidden ? p5Ref.current.noLoop() : p5Ref.current.loop();
      };
      document.addEventListener("visibilitychange", onVisibility);
      cleanup = () => {
        document.removeEventListener("visibilitychange", onVisibility);
        p5Ref.current?.remove();
        p5Ref.current = null;
      };
    });

    return () => cleanup?.();
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={containerRef} className="pointer-events-none fixed inset-0 -z-10" aria-hidden />;
}
