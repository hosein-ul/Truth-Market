"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const CIPHER_CHARS =
  "0123456789ABCDEFabcdef▓▒░█▄▀■□▪▫◆◇○●⊕⊗⊘∅∞≠≡≈∑∫∂∇⟨⟩⌬⌭⌮⌰⌱";
const KEY_FRAGS = [
  "3FA2·B91C", "ψE7D·4A2F", "FHE·0x9b5C",
  "ENC·0x1e77", "K=√2⁴⁸",   "ZKP·VERIFY",
  "ΣKEY·4096", "ε·FHE·ON",
];

export function CipherNoirBg() {
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
        const COLS = 52;
        let colW = 0;
        let H = 0;
        let scanY = -200;
        let lastScan = 0;

        interface Drop {
          y: number;
          speed: number;
          chars: string[];
          phase: number;
        }
        let drops: Drop[] = [];

        function rndChar() {
          return CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
        }

        p.setup = () => {
          const W = window.innerWidth;
          H = window.innerHeight;
          const canvas = p.createCanvas(W, H);
          canvas.style("position", "fixed");
          canvas.style("top", "0");
          canvas.style("left", "0");
          canvas.style("z-index", "-1");
          canvas.style("pointer-events", "none");
          colW = W / COLS;

          drops = Array.from({ length: COLS }, (_, i) => ({
            y: p.random(-H * 1.2, 0),
            speed: p.random(0.7, 2.2),
            chars: Array.from({ length: 28 }, rndChar),
            phase: p.random(p.TWO_PI),
          }));
        };

        p.draw = () => {
          // semi-transparent fill for trail accumulation
          p.background(10, 9, 7, 22);

          const now = Date.now();
          if (now - lastScan > 5000) {
            scanY = 0;
            lastScan = now;
          }
          if (scanY >= 0 && scanY < H + 60) {
            scanY += 2.4;
            // horizontal scan glow
            for (let x = 0; x < p.width; x += 3) {
              const a = p.map(Math.abs(x - p.width / 2), 0, p.width / 2, 18, 0);
              p.stroke(230, 168, 23, a);
              p.strokeWeight(1);
              p.point(x, scanY);
              p.point(x, scanY - 1);
            }
          }

          p.textFont("monospace");
          p.textSize(13);
          p.noStroke();

          for (let i = 0; i < drops.length; i++) {
            const d = drops[i];
            d.y += d.speed;
            if (d.y > H + 600) {
              d.y = p.random(-300, -50);
              d.speed = p.random(0.7, 2.2);
            }

            const cx = i * colW + colW * 0.5;
            const nearScan = Math.abs(d.y - scanY) < 70;

            for (let j = 0; j < 22; j++) {
              const cy = d.y - j * 15;
              if (cy < -20 || cy > H + 20) continue;

              let char = d.chars[j % d.chars.length];

              if (nearScan && j < 4) {
                const frag = KEY_FRAGS[i % KEY_FRAGS.length];
                const idx = (Math.floor(Math.abs(scanY - d.y) / 3) + j) % frag.length;
                char = frag[idx] ?? char;
                p.fill(255, 245, 160, 240);
              } else if (j === 0) {
                p.fill(255, 218, 90, 220); // leading — bright gold
              } else if (j === 1) {
                p.fill(240, 175, 40, 165);
              } else if (j === 2) {
                p.fill(210, 140, 30, 110);
              } else {
                const a = p.map(j, 3, 22, 65, 4);
                p.fill(170, 100, 18, a);
              }

              // randomly mutate chars
              if (p.random() < 0.018) {
                d.chars[j % d.chars.length] = rndChar();
              }

              p.text(char, cx, cy);
            }
          }
        };

        p.windowResized = () => {
          H = window.innerHeight;
          p.resizeCanvas(window.innerWidth, H);
          colW = window.innerWidth / COLS;
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
