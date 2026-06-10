"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function QuantumMeshBg() {
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
        const N = 80;
        const FOV = 300;
        let rotY = 0;
        let W = 0;
        let H = 0;
        let pulseNode = -1;
        let pulseR = 0;
        let lastPulse = 0;

        interface Node3D {
          x: number; y: number; z: number;
          vx: number; vy: number; vz: number;
          glimmer: number;
        }
        let nodes: Node3D[] = [];

        function project(x: number, y: number, z: number) {
          const cosY = Math.cos(rotY);
          const sinY = Math.sin(rotY);
          const rx = x * cosY - z * sinY;
          const rz = x * sinY + z * cosY;
          const scale = FOV / (FOV + rz + 300);
          return {
            sx: W / 2 + rx * scale,
            sy: H / 2 + y * scale,
            scale,
            depth: rz,
          };
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
          p.colorMode(p.RGB, 255, 255, 255, 255);

          const R = Math.min(W, H) * 0.38;
          nodes = Array.from({ length: N }, () => {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            return {
              x: R * Math.sin(phi) * Math.cos(theta) * (0.5 + Math.random() * 0.5),
              y: R * Math.sin(phi) * Math.sin(theta) * (0.5 + Math.random() * 0.5),
              z: R * Math.cos(phi) * (0.5 + Math.random() * 0.5),
              vx: (Math.random() - 0.5) * 0.08,
              vy: (Math.random() - 0.5) * 0.08,
              vz: (Math.random() - 0.5) * 0.08,
              glimmer: Math.random() * Math.PI * 2,
            };
          });
        };

        p.draw = () => {
          p.background(9, 14, 26, 30);
          rotY += 0.0018;

          const now = Date.now();
          if (now - lastPulse > 5500) {
            pulseNode = Math.floor(Math.random() * N);
            pulseR = 0;
            lastPulse = now;
          }
          if (pulseR < 300) pulseR += 3.5;

          // project all nodes
          const proj = nodes.map((n) => {
            n.glimmer += 0.04;
            // gentle drift
            n.x += n.vx;
            n.y += n.vy;
            n.z += n.vz;
            const damp = 0.992;
            n.vx *= damp; n.vy *= damp; n.vz *= damp;
            const bounce = 200;
            if (Math.abs(n.x) > bounce) n.vx *= -1;
            if (Math.abs(n.y) > bounce) n.vy *= -1;
            if (Math.abs(n.z) > bounce) n.vz *= -1;
            return project(n.x, n.y, n.z);
          });

          p.blendMode(p.ADD);

          // draw edges
          for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
              const dx = nodes[i].x - nodes[j].x;
              const dy = nodes[i].y - nodes[j].y;
              const dz = nodes[i].z - nodes[j].z;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dist > 160) continue;

              const a = p.map(dist, 0, 160, 55, 3);
              const isPulseEdge =
                pulseNode >= 0 &&
                (i === pulseNode || j === pulseNode) &&
                pulseR < 200;
              const edgeA = isPulseEdge ? Math.min(a * 4, 200) : a;

              // cyan-dominant edges with violet tint on deep ones
              const depthBlend = p.map(
                (proj[i].depth + proj[j].depth) / 2,
                -300, 300, 0, 1
              );
              const r = Math.round(p.lerp(8, 139, depthBlend));
              const g = Math.round(p.lerp(247, 92, depthBlend));
              const b = Math.round(p.lerp(247, 246, depthBlend));

              p.stroke(r, g, b, edgeA);
              p.strokeWeight(isPulseEdge ? 1.5 : 0.7);
              p.line(proj[i].sx, proj[i].sy, proj[j].sx, proj[j].sy);
            }
          }

          // draw pulse ring from pulseNode
          if (pulseNode >= 0 && pulseR < 280) {
            const pn = proj[pulseNode];
            const ra = p.map(pulseR, 0, 280, 120, 0);
            p.noFill();
            p.stroke(8, 247, 247, ra);
            p.strokeWeight(1.2);
            p.ellipse(pn.sx, pn.sy, pulseR * pn.scale * 2, pulseR * pn.scale * 2);
          }

          // draw nodes
          p.noStroke();
          for (let i = 0; i < N; i++) {
            const { sx, sy, scale, depth } = proj[i];
            const glow = 0.5 + 0.5 * Math.sin(nodes[i].glimmer);
            const brightness = p.map(depth, -300, 300, 220, 60);
            const r = p.map(depth, -300, 300, 30, 90);
            const sz = Math.max(1.5, scale * 5);

            p.fill(r, brightness, 220, brightness * glow * 0.8);
            p.ellipse(sx, sy, sz, sz);

            if (i === pulseNode && pulseR < 100) {
              p.fill(8, 247, 247, 180 * (1 - pulseR / 100));
              p.ellipse(sx, sy, sz * 3, sz * 3);
            }
          }

          p.blendMode(p.BLEND);
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
