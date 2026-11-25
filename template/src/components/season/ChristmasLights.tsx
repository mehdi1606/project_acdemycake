/**
 * A garland of miniature Christmas lights hung under a top bar, drawn to read
 * as a real object rather than a pattern:
 *  - a thin evergreen wire hung from small clips, every span with its own sag,
 *    a cast shadow and a faint highlight along its top;
 *  - each bulb a C9-style glass drop on a dark-green socket: a bright inner
 *    core, a translucent body darkening to its edge, a specular highlight,
 *    a small soft halo and a faint spill of light up onto the bar;
 *  - bulbs hang at slightly different angles, brightness varies a little, and
 *    each one breathes on its own slow cycle (never in sync, never flashing).
 * Desktop and mobile are two compositions (span length, bulbs per span, sag,
 * bulb size), not one scaled down. Pure SVG + one opacity animation per bulb,
 * no blur filters. Nothing renders outside the Christmas season.
 */
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { isChristmasSeason } from '../../config/season';
import './xmas.css';

type Tone = 'warm' | 'red' | 'green' | 'gold';
const TONES: Record<Tone, { core: string; body: string; edge: string; glow: string }> = {
  warm:  { core: '#FFFBEF', body: '#FFE2A6', edge: '#E9A94A', glow: '#FFD98A' },
  red:   { core: '#FFE3E0', body: '#F2404E', edge: '#A3121F', glow: '#FF5A5F' },
  green: { core: '#E6FFEF', body: '#3CC575', edge: '#137A3E', glow: '#53E08E' },
  gold:  { core: '#FFF6D8', body: '#F7BE45', edge: '#B97A12', glow: '#FFC94F' },
};
const ORDER: Tone[] = ['warm', 'red', 'gold', 'green', 'warm', 'gold', 'red', 'green'];

/** Small seeded generator so a garland looks the same on every render. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Bulb { x: number; y: number; angle: number; tone: Tone; dur: number; delay: number; dim: number }
interface Garland { wire: string; clips: { x: number; y: number }[]; bulbs: Bulb[]; height: number }

const TOP = 12; // wire anchor line inside the svg (room above for the light spill)

function build(width: number, mobile: boolean, seed: number): Garland {
  const r = rng(seed + (mobile ? 7 : 0));
  const spanBase = mobile ? 128 : 168;
  const perSpan = mobile ? 2 : 3;
  const sagMin = mobile ? 10 : 13;
  const sagMax = mobile ? 17 : 24;
  // anchors run past both edges so the wire never visibly ends
  const anchors: { x: number; y: number }[] = [];
  let x = -spanBase * (0.3 + r() * 0.3);
  while (x < width + spanBase) {
    anchors.push({ x, y: TOP + (r() - 0.5) * 2.2 });
    x += spanBase * (0.86 + r() * 0.28);
  }
  let wire = `M${anchors[0].x.toFixed(1)} ${anchors[0].y.toFixed(1)}`;
  const bulbs: Bulb[] = [];
  let k = Math.floor(r() * ORDER.length);
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    const sag = sagMin + r() * (sagMax - sagMin);
    // a slightly off-centre low point, as a real hand-hung wire would sit
    const cx = a.x + (b.x - a.x) * (0.44 + r() * 0.12);
    const cy = (a.y + b.y) / 2 + sag * 2;
    wire += ` Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    for (let j = 1; j <= perSpan; j++) {
      const t = j / (perSpan + 1) + (r() - 0.5) * 0.08;
      const px = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cx + t * t * b.x;
      const py = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y;
      if (px < -12 || px > width + 12) { k++; continue; }
      const dx = 2 * (1 - t) * (cx - a.x) + 2 * t * (b.x - cx);
      const dy = 2 * (1 - t) * (cy - a.y) + 2 * t * (b.y - cy);
      const slope = Math.atan2(dy, dx) * (180 / Math.PI);
      let tone = ORDER[k % ORDER.length];
      if (r() < 0.18) tone = ORDER[(k + 2) % ORDER.length]; // break the pattern now and then
      k++;
      bulbs.push({
        x: px, y: py,
        angle: slope * 0.35 + (r() - 0.5) * 22,
        tone,
        dur: 3.2 + r() * 3.8,
        delay: -r() * 7,
        dim: 0.82 + r() * 0.18,
      });
    }
  }
  const clips = anchors.filter((p) => p.x > -4 && p.x < width + 4);
  return { wire, clips, bulbs, height: TOP + sagMax + (mobile ? 38 : 44) };
}

interface Props {
  /** Kept for compatibility: the garland always hangs under its bar. */
  edge?: 'bottom' | 'top';
  /** Ignored (bulb spacing is part of each composition). */
  spacing?: number;
  className?: string;
}

const ChristmasLights: React.FC<Props> = ({ className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [on] = useState(isChristmasSeason);
  const [width, setWidth] = useState(0);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    if (!on || !ref.current) return;
    const el = ref.current;
    const measure = () => setWidth(Math.round(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [on]);

  const mobile = width > 0 && width < 640;
  const g = useMemo(() => (width ? build(width, mobile, 1207) : null), [width, mobile]);
  if (!on) return null;

  const L = mobile ? 15 : 17;     // bulb length
  const W = mobile ? 8.6 : 10;    // bulb width
  const bulbPath = `M-2.4 0 C${-W / 2} ${L * 0.22} ${-W / 2} ${L * 0.72} 0 ${L} C${W / 2} ${L * 0.72} ${W / 2} ${L * 0.22} 2.4 0 Z`;

  return (
    <div ref={ref} className={`sl-garland ${mobile ? 'sl-garland--m' : ''} ${className}`} aria-hidden="true" style={{ height: g ? g.height : 0 }}>
      {g && (
        <svg width={width} height={g.height} viewBox={`0 0 ${width} ${g.height}`}>
          <defs>
            {(Object.keys(TONES) as Tone[]).map((tone) => (
              <React.Fragment key={tone}>
                <radialGradient id={`${uid}b${tone}`} cx="0.42" cy="0.6" r="0.62">
                  <stop offset="0" stopColor={TONES[tone].core} />
                  <stop offset="0.38" stopColor={TONES[tone].body} />
                  <stop offset="1" stopColor={TONES[tone].edge} stopOpacity="0.92" />
                </radialGradient>
                <radialGradient id={`${uid}g${tone}`}>
                  <stop offset="0" stopColor={TONES[tone].glow} stopOpacity="0.78" />
                  <stop offset="0.3" stopColor={TONES[tone].glow} stopOpacity="0.34" />
                  <stop offset="0.62" stopColor={TONES[tone].glow} stopOpacity="0.1" />
                  <stop offset="1" stopColor={TONES[tone].glow} stopOpacity="0" />
                </radialGradient>
              </React.Fragment>
            ))}
            <linearGradient id={`${uid}sock`} x1="0" x2="1">
              <stop offset="0" stopColor="#0d2214" /><stop offset="0.45" stopColor="#2f5a3a" /><stop offset="1" stopColor="#0b1c10" />
            </linearGradient>
          </defs>

          {/* wire: cast shadow, the wire, a thin highlight on top */}
          <path d={g.wire} transform="translate(0 2.6)" className="sl-wire sl-wire--shadow" />
          <path d={g.wire} className="sl-wire" />
          <path d={g.wire} transform="translate(0 -0.55)" className="sl-wire sl-wire--hi" />
          {g.clips.map((c, i) => (
            <rect key={i} x={c.x - 2.2} y={c.y - 4} width={4.4} height={5.5} rx={1.2} className="sl-clip" />
          ))}

          {/* light falling back onto the bottom edge of the bar */}
          {g.bulbs.map((b, i) => (
            <ellipse key={`s${i}`} cx={b.x.toFixed(1)} cy={TOP - 3} rx={L * 1.7} ry={L * 0.5} fill={`url(#${uid}g${b.tone})`} className="sl-spill"
              style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`, ['--o' as string]: (0.34 * b.dim).toFixed(2) } as React.CSSProperties} />
          ))}

          {g.bulbs.map((b, i) => (
            <g key={i} transform={`translate(${b.x.toFixed(1)} ${(b.y + 1).toFixed(1)}) rotate(${b.angle.toFixed(1)})`}>
              {/* halo */}
              <circle cx="0" cy={L * 0.62} r={L * 1.55} fill={`url(#${uid}g${b.tone})`} className="sl-halo"
                style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`, ['--o' as string]: b.dim.toFixed(2) } as React.CSSProperties} />
              {/* socket */}
              <rect x="-2.7" y="-5.6" width="5.4" height="6.6" rx="1.3" fill={`url(#${uid}sock)`} />
              <path d="M-2.7 -2.2 H2.7" className="sl-ridge" />
              {/* glass body with its inner glow */}
              <path d={bulbPath} fill={`url(#${uid}b${b.tone})`} className="sl-glass" />
              <ellipse cx="0" cy={L * 0.6} rx={W * 0.2} ry={L * 0.2} fill={TONES[b.tone].core} className="sl-core"
                style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` } as React.CSSProperties} />
              {/* specular highlight */}
              <ellipse cx={-W * 0.17} cy={L * 0.34} rx={W * 0.09} ry={L * 0.16} fill="#fff" opacity="0.7" transform={`rotate(14 ${-W * 0.17} ${L * 0.34})`} />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
};

export default ChristmasLights;
