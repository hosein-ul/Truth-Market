"use client";

import { P5Canvas } from "./P5Canvas";

type RGB = [number, number, number];
interface BgProps {
  className?: string;
  seed?: number;
  /** primary / secondary accent colors */
  a?: RGB;
  b?: RGB;
  /** background fill for clear() — set for dark themes (default transparent) */
  bg?: RGB | null;
}

const ORANGE: RGB = [249, 115, 22];
const SKY: RGB = [14, 165, 233];

function clearFrame(p: any, w: number, h: number, bg: RGB | null | undefined) {
  if (bg) {
    p.noStroke();
    p.fill(bg[0], bg[1], bg[2]);
    p.rect(0, 0, w, h);
  } else {
    p.clear();
  }
}

/* ─────────────────────────── 1. Particle Network ───────────────────────────
   Drifting nodes joined by lines when close — an elegant constellation. */
export function ParticleNetwork({ className, seed = 42, a = ORANGE, b = SKY, bg = null }: BgProps) {
  return (
    <P5Canvas
      className={className}
      seedKey={`pn-${seed}`}
      build={(p, host) => {
        let w = 0, h = 0;
        let nodes: { x: number; y: number; vx: number; vy: number; t: number; r: number }[] = [];
        const LINK = 150;

        function reseed() {
          p.randomSeed(seed);
          const n = Math.round(p.constrain((w * h) / 14000, 40, 130));
          nodes = [];
          for (let i = 0; i < n; i++) {
            nodes.push({
              x: p.random(w), y: p.random(h),
              vx: p.random(-0.35, 0.35), vy: p.random(-0.35, 0.35),
              t: p.random(), r: p.random(1.4, 3.2),
            });
          }
        }
        function col(t: number, alpha: number) {
          return p.color(p.lerp(a[0], b[0], t), p.lerp(a[1], b[1], t), p.lerp(a[2], b[2], t), alpha);
        }
        p.setup = () => { w = host.clientWidth; h = host.clientHeight; p.createCanvas(w, h); reseed(); };
        p.draw = () => {
          clearFrame(p, w, h, bg);
          for (const nd of nodes) {
            nd.x += nd.vx; nd.y += nd.vy;
            if (nd.x < 0 || nd.x > w) nd.vx *= -1;
            if (nd.y < 0 || nd.y > h) nd.vy *= -1;
          }
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
              const d = Math.hypot(dx, dy);
              if (d < LINK) {
                p.stroke(col((nodes[i].t + nodes[j].t) / 2, (1 - d / LINK) * 60));
                p.strokeWeight(1);
                p.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
              }
            }
          }
          p.noStroke();
          for (const nd of nodes) { p.fill(col(nd.t, 150)); p.circle(nd.x, nd.y, nd.r * 2); }
        };
        p.windowResized = () => { w = host.clientWidth; h = host.clientHeight; p.resizeCanvas(w, h); reseed(); };
      }}
    />
  );
}

/* ─────────────────────────── 2. Geometric Mesh ─────────────────────────────
   A noise-perturbed triangulated grid — refined low-poly wireframe. */
export function GeometricMesh({ className, seed = 42, a = ORANGE, b = SKY, bg = null }: BgProps) {
  return (
    <P5Canvas
      className={className}
      seedKey={`gm-${seed}`}
      build={(p, host) => {
        let w = 0, h = 0, z = 0, cols = 0, rows = 0;
        const STEP = 92, AMP = 34, S = 0.0016;
        p.setup = () => { w = host.clientWidth; h = host.clientHeight; p.createCanvas(w, h); p.noiseSeed(seed); cols = Math.ceil(w / STEP) + 2; rows = Math.ceil(h / STEP) + 2; };
        function pt(i: number, j: number) {
          const bx = i * STEP, by = j * STEP;
          const nx = p.noise(i * 0.3, j * 0.3, z) - 0.5;
          const ny = p.noise(i * 0.3 + 50, j * 0.3 + 50, z) - 0.5;
          return { x: bx + nx * AMP * 2, y: by + ny * AMP * 2 };
        }
        function col(t: number, alpha: number) {
          return p.color(p.lerp(a[0], b[0], t), p.lerp(a[1], b[1], t), p.lerp(a[2], b[2], t), alpha);
        }
        p.draw = () => {
          clearFrame(p, w, h, bg); z += 0.0017;
          for (let j = 0; j < rows - 1; j++) {
            for (let i = 0; i < cols - 1; i++) {
              const A2 = pt(i, j), B2 = pt(i + 1, j), C = pt(i, j + 1), D = pt(i + 1, j + 1);
              const t = i / cols;
              p.noStroke(); p.fill(col(t, 6 + p.noise(i, j, z) * 10));
              p.triangle(A2.x, A2.y, B2.x, B2.y, C.x, C.y);
              p.triangle(B2.x, B2.y, D.x, D.y, C.x, C.y);
              p.stroke(col(t, 38)); p.strokeWeight(0.7);
              p.line(A2.x, A2.y, B2.x, B2.y); p.line(A2.x, A2.y, C.x, C.y); p.line(A2.x, A2.y, D.x, D.y);
            }
          }
        };
        p.windowResized = () => { w = host.clientWidth; h = host.clientHeight; p.resizeCanvas(w, h); cols = Math.ceil(w / STEP) + 2; rows = Math.ceil(h / STEP) + 2; };
      }}
    />
  );
}

/* ─────────────────────────── 3. Contour Lines ──────────────────────────────
   Stacked topographic isolines from a drifting noise field — quiet, luxe. */
export function ContourLines({ className, seed = 42, a = ORANGE, b = SKY, bg = null }: BgProps) {
  return (
    <P5Canvas
      className={className}
      seedKey={`cl-${seed}`}
      build={(p, host) => {
        let w = 0, h = 0, z = 0;
        const LINES = 26, S = 0.0021;
        p.setup = () => { w = host.clientWidth; h = host.clientHeight; p.createCanvas(w, h); p.noiseSeed(seed); };
        function col(t: number, alpha: number) {
          return p.color(p.lerp(a[0], b[0], t), p.lerp(a[1], b[1], t), p.lerp(a[2], b[2], t), alpha);
        }
        p.draw = () => {
          clearFrame(p, w, h, bg); z += 0.0016; p.noFill();
          for (let l = 0; l < LINES; l++) {
            const baseY = (h / (LINES - 1)) * l;
            const t = l / LINES;
            p.stroke(col(t, 34)); p.strokeWeight(1.1);
            p.beginShape();
            for (let x = -10; x <= w + 10; x += 12) {
              const y = baseY + (p.noise(x * S, l * 0.32, z) - 0.5) * 150 + Math.sin(x * 0.004 + l) * 14;
              p.curveVertex(x, y);
            }
            p.endShape();
          }
        };
        p.windowResized = () => { w = host.clientWidth; h = host.clientHeight; p.resizeCanvas(w, h); };
      }}
    />
  );
}

/* ─────────────────────────── 4. Orbital Rings ──────────────────────────────
   Concentric dashed arcs + orbiting nodes — precise, technical, premium. */
export function OrbitalRings({ className, seed = 42, a = ORANGE, b = SKY, bg = null }: BgProps) {
  return (
    <P5Canvas
      className={className}
      seedKey={`or-${seed}`}
      build={(p, host) => {
        let w = 0, h = 0, t = 0;
        let rings: { r: number; speed: number; dash: number; off: number; tc: number; dots: number }[] = [];
        function reseed() {
          p.randomSeed(seed);
          const maxR = Math.hypot(w, h) * 0.62;
          rings = [];
          const count = 9;
          for (let i = 0; i < count; i++) {
            rings.push({
              r: (maxR / count) * (i + 1),
              speed: p.random(0.1, 0.5) * (i % 2 ? 1 : -1),
              dash: p.random(6, 26), off: p.random(p.TWO_PI),
              tc: i / count, dots: Math.floor(p.random(1, 4)),
            });
          }
        }
        function col(tc: number, alpha: number) {
          return p.color(p.lerp(a[0], b[0], tc), p.lerp(a[1], b[1], tc), p.lerp(a[2], b[2], tc), alpha);
        }
        p.setup = () => { w = host.clientWidth; h = host.clientHeight; p.createCanvas(w, h); reseed(); };
        p.draw = () => {
          clearFrame(p, w, h, bg); t += 0.01;
          const cx = w * 0.5, cy = h * 0.5;
          p.noFill();
          for (const rg of rings) {
            const seg = (p.TWO_PI * rg.r) / rg.dash;
            const arc = p.TWO_PI / seg;
            p.stroke(col(rg.tc, 36)); p.strokeWeight(1.1);
            for (let k = 0; k < seg; k += 2) {
              const a0 = k * arc + rg.off + t * rg.speed;
              p.arc(cx, cy, rg.r * 2, rg.r * 2, a0, a0 + arc * 0.9);
            }
            p.noStroke();
            for (let d = 0; d < rg.dots; d++) {
              const ang = rg.off + t * rg.speed * 2 + (d * p.TWO_PI) / rg.dots;
              p.fill(col(rg.tc, 170));
              p.circle(cx + Math.cos(ang) * rg.r, cy + Math.sin(ang) * rg.r, 5);
            }
            p.noFill();
          }
        };
        p.windowResized = () => { w = host.clientWidth; h = host.clientHeight; p.resizeCanvas(w, h); reseed(); };
      }}
    />
  );
}

/* ─────────────────────────── 5. Floating Shapes ────────────────────────────
   Drifting geometric polygons with thin strokes — minimal, airy, lux. */
export function FloatingShapes({ className, seed = 42, a = ORANGE, b = SKY, bg = null }: BgProps) {
  return (
    <P5Canvas
      className={className}
      seedKey={`fs-${seed}`}
      build={(p, host) => {
        let w = 0, h = 0;
        let shapes: { x: number; y: number; s: number; sides: number; rot: number; spin: number; vx: number; vy: number; tc: number; fill: boolean }[] = [];
        function reseed() {
          p.randomSeed(seed);
          const n = Math.round(p.constrain((w * h) / 30000, 16, 60));
          shapes = [];
          for (let i = 0; i < n; i++) {
            shapes.push({
              x: p.random(w), y: p.random(h), s: p.random(14, 64),
              sides: p.random([3, 4, 6, 60]), rot: p.random(p.TWO_PI),
              spin: p.random(-0.004, 0.004), vx: p.random(-0.25, 0.25), vy: p.random(-0.25, 0.25),
              tc: p.random(), fill: p.random() < 0.4,
            });
          }
        }
        function col(tc: number, alpha: number) {
          return p.color(p.lerp(a[0], b[0], tc), p.lerp(a[1], b[1], tc), p.lerp(a[2], b[2], tc), alpha);
        }
        function poly(cx: number, cy: number, r: number, sides: number, rot: number) {
          p.beginShape();
          for (let i = 0; i < sides; i++) {
            const ang = rot + (i / sides) * p.TWO_PI;
            p.vertex(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
          }
          p.endShape(p.CLOSE);
        }
        p.setup = () => { w = host.clientWidth; h = host.clientHeight; p.createCanvas(w, h); reseed(); };
        p.draw = () => {
          clearFrame(p, w, h, bg);
          for (const sh of shapes) {
            sh.x += sh.vx; sh.y += sh.vy; sh.rot += sh.spin;
            if (sh.x < -80) sh.x = w + 80; if (sh.x > w + 80) sh.x = -80;
            if (sh.y < -80) sh.y = h + 80; if (sh.y > h + 80) sh.y = -80;
            if (sh.fill) { p.noStroke(); p.fill(col(sh.tc, 10)); poly(sh.x, sh.y, sh.s, sh.sides, sh.rot); }
            p.noFill(); p.stroke(col(sh.tc, 48)); p.strokeWeight(1.1);
            poly(sh.x, sh.y, sh.s, sh.sides, sh.rot);
          }
        };
        p.windowResized = () => { w = host.clientWidth; h = host.clientHeight; p.resizeCanvas(w, h); reseed(); };
      }}
    />
  );
}
