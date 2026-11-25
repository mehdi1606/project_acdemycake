// Camera path through the artwork (ported from the standalone intro).
// Keyframes { t, x, y, s }: x, y = view centre (fractions of the artwork);
// s = view size (geometric mean of visible width and height, in artwork widths);
// s = -1 means "the homepage framing": the artwork covering the viewport.
import { ART_ASPECT } from './renderer';

export interface CamKey { t: number; x: number; y: number; s: number }
export interface CamView { x: number; y: number; w: number; h: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** View size that makes the artwork cover a viewport of the given aspect. */
export function coverSize(aspect: number): number {
  const visW = aspect > ART_ASPECT ? 1 : aspect / ART_ASPECT;
  return visW / Math.sqrt(aspect);
}

export class CameraPath {
  private keys: CamKey[];
  private times: number[];

  constructor(keys: CamKey[]) {
    this.keys = keys;
    this.times = keys.map((k) => k.t);
  }

  at(tIn: number, aspect: number): CamView {
    const { keys, times } = this;
    const last = keys.length - 1;
    const t = clamp(tIn, times[0], times[last]);
    let i = 0;
    while (i < last - 1 && t >= times[i + 1]) i++;

    const value = (j: number, f: 'x' | 'y' | 's') => {
      const k = keys[j];
      if (f !== 's') return k[f];
      return Math.log(k.s < 0 ? coverSize(aspect) : k.s); // zoom is interpolated in log space
    };
    const tangent = (j: number, f: 'x' | 'y' | 's') =>
      j === 0 || j === last ? 0 : (value(j + 1, f) - value(j - 1, f)) / (times[j + 1] - times[j - 1]);

    const span = times[i + 1] - times[i];
    const u = (t - times[i]) / span;
    const u2 = u * u, u3 = u2 * u;
    const hermite = (f: 'x' | 'y' | 's') =>
      (2 * u3 - 3 * u2 + 1) * value(i, f) + (u3 - 2 * u2 + u) * span * tangent(i, f) +
      (-2 * u3 + 3 * u2) * value(i + 1, f) + (u3 - u2) * span * tangent(i + 1, f);

    const s = Math.exp(hermite('s'));
    const w = Math.min(s * Math.sqrt(aspect), 1);
    const h = Math.min((s / Math.sqrt(aspect)) * ART_ASPECT, 1);
    return { x: clamp(hermite('x'), w / 2, 1 - w / 2), y: clamp(hermite('y'), h / 2, 1 - h / 2), w, h };
  }
}
