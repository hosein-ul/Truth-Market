import { CSSProperties } from "react";

/**
 * Deterministic generative market cover — pure inline SVG, zero external
 * requests (COEP-safe, works offline, never repeats). The market address
 * seeds a PRNG; the category picks a motif; the Zama palette (yellow #FFD208,
 * black, grays) keeps every cover on-brand. Same market → same cover, always.
 */

const YELLOW = "#FFD208";
const BLACK = "#0a0a0a";
const DARKGRAY = "#2D2D2D";
const LIGHTGRAY = "#F4F4F4";

function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Three brand surface variants; the seed picks one per market. */
type Surface = { bg: string; ink: string; accent: string; soft: string };
const SURFACES: Surface[] = [
  { bg: YELLOW, ink: BLACK, accent: BLACK, soft: "rgba(10,10,10,0.14)" },
  { bg: BLACK, ink: YELLOW, accent: YELLOW, soft: "rgba(255,210,8,0.22)" },
  { bg: LIGHTGRAY, ink: DARKGRAY, accent: YELLOW, soft: "rgba(45,45,45,0.14)" },
];

const W = 400;
const H = 180;

function cryptoMotif(rand: () => number, s: Surface) {
  // Circuit traces with nodes + a coin arc.
  const els: React.ReactNode[] = [];
  const n = 5 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const y = 20 + rand() * (H - 40);
    const x0 = rand() * 120;
    const midX = x0 + 60 + rand() * 120;
    const y2 = 20 + rand() * (H - 40);
    els.push(
      <polyline
        key={`t${i}`}
        points={`${x0},${y} ${midX},${y} ${midX},${y2} ${W},${y2}`}
        fill="none"
        stroke={i % 3 === 0 ? s.accent : s.soft}
        strokeWidth={i % 3 === 0 ? 2.5 : 1.5}
      />,
      <circle key={`n${i}`} cx={midX} cy={y} r={4} fill={s.ink} />,
    );
  }
  const cx = 60 + rand() * 280;
  const cy = 40 + rand() * 100;
  els.push(
    <circle key="coin" cx={cx} cy={cy} r={34} fill="none" stroke={s.ink} strokeWidth={3} />,
    <circle key="coin2" cx={cx} cy={cy} r={24} fill="none" stroke={s.soft} strokeWidth={2} />,
  );
  return els;
}

function politicsMotif(rand: () => number, s: Surface) {
  // Bold column geometry — abstract institution facade.
  const els: React.ReactNode[] = [];
  const cols = 6 + Math.floor(rand() * 4);
  const gap = W / cols;
  for (let i = 0; i < cols; i++) {
    const h = 50 + rand() * 100;
    els.push(
      <rect
        key={`c${i}`}
        x={i * gap + gap * 0.22}
        y={H - h}
        width={gap * 0.56}
        height={h}
        fill={i === Math.floor(cols / 2) ? s.accent : s.soft}
      />,
    );
  }
  els.push(
    <rect key="base" x={0} y={H - 12} width={W} height={12} fill={s.ink} />,
    <polygon
      key="pediment"
      points={`${W * 0.2},${34 + rand() * 10} ${W * 0.5},${8 + rand() * 8} ${W * 0.8},${34 + rand() * 10}`}
      fill="none"
      stroke={s.ink}
      strokeWidth={3}
    />,
  );
  return els;
}

function sportsMotif(rand: () => number, s: Surface) {
  // Pitch lines + speed diagonals.
  const els: React.ReactNode[] = [];
  const cy = H / 2;
  els.push(
    <circle key="center" cx={W / 2} cy={cy} r={30 + rand() * 14} fill="none" stroke={s.ink} strokeWidth={3} />,
    <line key="mid" x1={W / 2} y1={0} x2={W / 2} y2={H} stroke={s.ink} strokeWidth={3} />,
    <rect key="boxL" x={0} y={cy - 40} width={46} height={80} fill="none" stroke={s.soft} strokeWidth={2} />,
    <rect key="boxR" x={W - 46} y={cy - 40} width={46} height={80} fill="none" stroke={s.soft} strokeWidth={2} />,
  );
  const n = 4 + Math.floor(rand() * 4);
  for (let i = 0; i < n; i++) {
    const x = rand() * W;
    els.push(
      <line
        key={`d${i}`}
        x1={x}
        y1={H}
        x2={x + 60}
        y2={0}
        stroke={s.accent}
        strokeWidth={2}
        opacity={0.5}
      />,
    );
  }
  return els;
}

function scienceMotif(rand: () => number, s: Surface) {
  // Orbits + electron dots.
  const els: React.ReactNode[] = [];
  const cx = W * (0.3 + rand() * 0.4);
  const cy = H * (0.35 + rand() * 0.3);
  const orbits = 3;
  for (let i = 0; i < orbits; i++) {
    const rx = 40 + i * (24 + rand() * 10);
    const ry = rx * (0.34 + rand() * 0.18);
    const rot = rand() * 180;
    els.push(
      <ellipse
        key={`o${i}`}
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={i === 1 ? s.accent : s.soft}
        strokeWidth={i === 1 ? 2.5 : 1.5}
        transform={`rotate(${rot} ${cx} ${cy})`}
      />,
      <circle
        key={`e${i}`}
        cx={cx + rx * Math.cos(rand() * Math.PI * 2) * 0.9}
        cy={cy + ry * Math.sin(rand() * Math.PI * 2) * 0.9}
        r={4}
        fill={s.ink}
      />,
    );
  }
  els.push(<circle key="core" cx={cx} cy={cy} r={9} fill={s.accent} />);
  // Faint lattice dots
  for (let i = 0; i < 14; i++) {
    els.push(
      <circle key={`l${i}`} cx={rand() * W} cy={rand() * H} r={1.6} fill={s.soft} />,
    );
  }
  return els;
}

function financeMotif(rand: () => number, s: Surface) {
  // Candlesticks over a rising baseline.
  const els: React.ReactNode[] = [];
  const n = 9 + Math.floor(rand() * 4);
  const gap = W / n;
  let level = H * (0.6 + rand() * 0.2);
  const points: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * gap + gap / 2;
    const drift = (rand() - 0.42) * 34; // slight upward bias
    const open = level;
    const close = Math.max(24, Math.min(H - 24, level - drift));
    const hi = Math.min(open, close) - rand() * 16;
    const lo = Math.max(open, close) + rand() * 16;
    const up = close < open;
    els.push(
      <line key={`w${i}`} x1={x} y1={hi} x2={x} y2={lo} stroke={s.soft} strokeWidth={2} />,
      <rect
        key={`b${i}`}
        x={x - gap * 0.22}
        y={Math.min(open, close)}
        width={gap * 0.44}
        height={Math.max(4, Math.abs(open - close))}
        fill={up ? s.accent : s.soft}
      />,
    );
    points.push(`${x},${close - 8}`);
    level = close;
  }
  els.push(
    <polyline key="trend" points={points.join(" ")} fill="none" stroke={s.ink} strokeWidth={2} opacity={0.6} />,
  );
  return els;
}

function otherMotif(rand: () => number, s: Surface) {
  // Concentric contour rings drifting across the frame.
  const els: React.ReactNode[] = [];
  const groups = 3;
  for (let g = 0; g < groups; g++) {
    const cx = rand() * W;
    const cy = rand() * H;
    const rings = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < rings; i++) {
      els.push(
        <circle
          key={`g${g}r${i}`}
          cx={cx}
          cy={cy}
          r={14 + i * (14 + rand() * 8)}
          fill="none"
          stroke={g === 0 && i === 0 ? s.accent : s.soft}
          strokeWidth={g === 0 && i === 0 ? 3 : 1.5}
        />,
      );
    }
    els.push(<circle key={`g${g}c`} cx={cx} cy={cy} r={4} fill={s.ink} />);
  }
  return els;
}

const MOTIFS: Record<string, (rand: () => number, s: Surface) => React.ReactNode[]> = {
  Crypto: cryptoMotif,
  Politics: politicsMotif,
  Sports: sportsMotif,
  Science: scienceMotif,
  Finance: financeMotif,
  Other: otherMotif,
};

export function MarketCover({
  address,
  category,
  className,
  style,
}: {
  address: string;
  category: string;
  className?: string;
  style?: CSSProperties;
}) {
  const seed = fnv1a(address.toLowerCase());
  const rand = mulberry32(seed);
  const surface = SURFACES[seed % SURFACES.length];
  const motif = MOTIFS[category] ?? otherMotif;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
      role="img"
      aria-label={`${category} market cover`}
    >
      <rect width={W} height={H} fill={surface.bg} />
      {motif(rand, surface)}
      {/* subtle vignette so overlaid chips stay readable */}
      <rect width={W} height={H} fill="url(#tm-cover-fade)" opacity={0.25} />
      <defs>
        <linearGradient id="tm-cover-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor={surface.bg} stopOpacity="0" />
          <stop offset="1" stopColor={surface.ink} stopOpacity="0.35" />
        </linearGradient>
      </defs>
    </svg>
  );
}
