/* eslint-disable */
// GLSL for The Living Pattern (ported unchanged from the standalone intro).

export const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);   // y down, like the artwork
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uInk;      // R: signed distance to the ink edge, G: anti-aliased coverage, B: snow + frost (winter)
uniform sampler2D uLights;   // winter: R halo, G core, B per-light colour + phase
uniform sampler2D uTint;     // winter: R = ink printed in evergreen instead of crimson
uniform float uWinter;       // 0 = classic, 1 = Christmas edition
uniform float uNow;          // wall-clock seconds, for snowfall and twinkling
uniform sampler2D uField;    // growth field: arrival time, 16 bit in RG
uniform vec2  uFieldSize;
uniform vec4  uCam;          // xy = view centre, zw = view size (fractions of the artwork)
uniform vec2  uRes;          // canvas pixels
uniform float uArtAspect;    // artwork width / height
uniform float uSdfW;         // SDF distances are expressed in texels of a texture this wide
uniform float uT;            // growth clock, seconds
uniform vec2  uSeed;         // first point of life (artwork uv)
uniform float uSeedAmt;
uniform float uVeil;         // homepage: soft clearing behind the headline
uniform vec2  uVeilR;

const vec3 PAPER    = vec3(0.9608, 0.8549, 0.8745);   // #F5DADF
const vec3 CRIMSON  = vec3(0.6510, 0.0980, 0.1804);   // #A6192E
const vec3 BURGUNDY = vec3(0.3961, 0.1098, 0.1961);   // #651C32

const vec3 SNOW      = vec3(1.0, 0.978, 0.976);
const vec3 CHAMPAGNE = vec3(1.0, 0.95, 0.83);
const vec3 GOLD      = vec3(0.7725, 0.5686, 0.1725);  // #C5912C
const vec3 EVERGREEN = vec3(0.118, 0.318, 0.243);     // brand forest #1D3C34, lifted a little to read as green on blush
const vec3 BULB_RED   = vec3(0.80, 0.07, 0.13);
const vec3 BULB_GREEN = vec3(0.07, 0.46, 0.27);

const float SDF_RANGE = 8.0;
const float FIELD_MAX = 16.0;
const float SWELL     = 0.5;   // seconds for a line to go from hairline to full weight
const float INSET     = 1.5;   // how thin a newborn line is (texels inside the final edge)

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return s;
}

float fieldTexel(ivec2 p) {
  p = clamp(p, ivec2(0), ivec2(uFieldSize) - 1);
  vec2 rg = texelFetch(uField, p, 0).rg;
  return dot(rg, vec2(65280.0, 255.0)) / 65535.0 * FIELD_MAX;
}
// 16-bit values cannot be filtered by the GPU once packed in two bytes: filter by hand.
float fieldAt(vec2 uv) {
  vec2 p = uv * uFieldSize - 0.5;
  ivec2 i = ivec2(floor(p));
  vec2 f = fract(p);
  return mix(mix(fieldTexel(i), fieldTexel(i + ivec2(1, 0)), f.x),
             mix(fieldTexel(i + ivec2(0, 1)), fieldTexel(i + ivec2(1, 1)), f.x), f.y);
}
float sdfAt(vec2 uv) {
  return (textureLod(uInk, uv, 0.0).r * 255.0 - 128.0) / 127.0 * SDF_RANGE;
}

// One sheet of falling snow. Flakes live in a grid of cells: at most one per cell,
// so the cost is the same however many there are.
//   scale  cells per screen height     fall   screen heights per second
//   size   flake radius, in cells      keep   fraction of cells left empty
float snowfall(vec2 p, float scale, float fall, float size, float keep, float seed, float crystal) {
  vec2 q = vec2(p.x + sin(uNow * 0.21 + seed) * 0.03 + uNow * 0.006, p.y - uNow * fall) * scale;
  vec2 cell = floor(q), f = fract(q);
  float h = hash(cell + seed);
  if (h < keep) return 0.0;
  float h2 = hash(cell + seed + 7.31);
  vec2 pos = 0.3 + 0.4 * vec2(h2, hash(cell + seed + 3.17));
  pos.x += 0.09 * sin(uNow * (0.7 + h2) + h * 31.0);            // each flake wanders a little
  vec2 d = f - pos;
  float r = size * (0.55 + 0.45 * h2);
  float dist = length(d);
  float a = smoothstep(r, r * 0.25, dist);
  if (crystal > 0.5 && h > 0.86) {
    // a few of the nearest flakes resolve into six-armed crystals, slowly turning
    float ang = atan(d.y, d.x) + uNow * 0.25 * (h2 - 0.5);
    float arm = abs(sin(ang * 3.0));                            // 0 along each of the six arms
    float star = smoothstep(0.22, 0.0, arm * dist / r) * smoothstep(r * 1.9, r * 0.5, dist);
    a = max(a * 0.6, star);
  }
  return a * (0.55 + 0.45 * h2);
}

void main() {
  vec2 uv   = uCam.xy + (vUv - 0.5) * uCam.zw;
  vec2 artP = vec2(uv.x, uv.y / uArtAspect);                 // isotropic, width = 1
  float aspect = uRes.x / uRes.y;

  // ── paper ────────────────────────────────────────────────────────────────
  // sits a touch behind the ink (moves 10% slower with the camera)
  vec2 pp = vec2(uCam.x, uCam.y / uArtAspect) * 0.9 + (vUv - 0.5) * vec2(uCam.z, uCam.w / uArtAspect);
  float tone  = fbm(pp * 4.0);
  float fibre = fbm(pp * vec2(70.0, 110.0));
  vec3 paper = PAPER * (1.0 + (tone - 0.5) * 0.045 + (fibre - 0.5) * 0.022);
  float edge = length((vUv - 0.5) * vec2(1.0, 1.0 / max(aspect, 1.0)) * 1.25);
  paper *= 1.012 - 0.055 * smoothstep(0.25, 0.9, edge);        // soft pool of light
  if (uWinter > 0.5) {
    // winter light: the same blush, a breath deeper and cooler, so snow and
    // lamplight have something to glow against; low mist drifts across the ground
    paper *= vec3(0.935, 0.905, 0.94);
    paper *= 1.0 - 0.06 * smoothstep(0.3, 0.95, edge);
    float mist = fbm(pp * 2.4 + vec2(uNow * 0.011, 0.0)) * smoothstep(0.3, 1.0, vUv.y);
    paper = mix(paper, vec3(0.985, 0.935, 0.948), mist * 0.24);
  }
  paper += (hash(gl_FragCoord.xy) - 0.5) * 0.012;              // grain

  // ── ink ──────────────────────────────────────────────────────────────────
  float px = uCam.z * uSdfW / uRes.x;                          // SDF texels per screen pixel
  float n  = fbm(artP * 36.0);
  float age = uT - fieldAt(uv) - (n - 0.5) * 0.4;              // seconds since growth arrived here
  float g = clamp(age / SWELL, 0.0, 1.0);
  g = g * g * (3.0 - 2.0 * g);
  float inset = (1.0 - g) * INSET;

  // Two readings of the same ink, combined:
  //  - the distance field gives crisp edges up close and lets a shape start as
  //    a thin core that swells to its full weight;
  //  - the coverage map (mip-mapped) carries the hairlines and stays clean when
  //    the camera is far away.
  float aa = max(px * 0.5, 0.5);
  vec2 du = uCam.zw / uRes;                                    // uv per screen pixel
  float core = 0.0;
  core += smoothstep(-aa, aa, sdfAt(uv + vec2( 0.125,  0.375) * du) - inset);
  core += smoothstep(-aa, aa, sdfAt(uv + vec2(-0.375,  0.125) * du) - inset);
  core += smoothstep(-aa, aa, sdfAt(uv + vec2( 0.375, -0.125) * du) - inset);
  core += smoothstep(-aa, aa, sdfAt(uv + vec2(-0.125, -0.375) * du) - inset);
  core *= 0.25 * (1.0 - smoothstep(1.0, 1.7, px));
  float soft = texture(uInk, uv).g;
  soft = mix(smoothstep(0.08, 0.92, soft), soft, smoothstep(0.6, 1.1, px));   // firm up when magnified
  float cov = max(core, soft * g);

  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  cov *= inside * smoothstep(0.0, 0.08, age);

  // newborn ink is wet and dark, then settles to brand crimson
  float wet = 1.0 - smoothstep(0.15, 1.7, age);
  vec3 ink = mix(CRIMSON, BURGUNDY, wet * 0.8);
  if (uWinter > 0.5) {
    float evergreen = texture(uTint, uv).r;
    ink = mix(ink, mix(EVERGREEN, EVERGREEN * 0.55, wet), evergreen);
  }
  float density = 0.93 + 0.07 * fbm(artP * 240.0);
  vec3 col = mix(paper, ink, cov * density);

  // ── winter: snow resting on the artwork, frost along its edges ───────────
  float lamps = 0.0;
  vec3 light = vec3(0.0);
  if (uWinter > 0.5) {
    float w = texture(uInk, uv).b;
    w = mix(smoothstep(0.1, 0.9, w), w, smoothstep(0.6, 1.1, px));
    w *= inside * smoothstep(0.7, 2.1, age);                    // it settles after the line has grown
    vec2 gcell = floor(artP * 1500.0);
    float glint = step(0.988, hash(gcell)) * (0.5 + 0.5 * sin(uNow * 2.6 + hash(gcell + 9.1) * 40.0));
    col = mix(col, SNOW + glint * 0.03, w * 0.97);

    // fairy lights wake a moment after their branch has grown, then breathe
    light = texture(uLights, uv).rgb;
    float on = inside * smoothstep(0.9, 1.7, age);
    float ph = fract(light.b * 3.0);                            // twinkle phase; the colour is which third
    float flare = pow(max(sin(uNow * 0.55 + ph * 97.0), 0.0), 28.0);
    lamps = on * (0.76 + 0.2 * sin(uNow * (1.1 + ph * 1.9) + ph * 41.0) + 0.35 * flare);
  }

  // ── the first point of life ──────────────────────────────────────────────
  vec2 seedP = vec2(uSeed.x, uSeed.y / uArtAspect);
  float wpp = uCam.z / uRes.x;                                 // width units per pixel
  float r = 0.0019 * uSeedAmt;
  float dotA = smoothstep(r + wpp, r - wpp, length(artP - seedP)) * step(0.001, uSeedAmt);
  col = mix(col, BURGUNDY, dotA);

  // ── homepage veil ────────────────────────────────────────────────────────
  // the artwork stays vivid at the edges and steps back where words will sit:
  // a clearing behind the headline and a quiet band behind the navigation
  float clearing = 1.0 - smoothstep(0.38, 1.0, length((vUv - vec2(0.5, 0.54)) / uVeilR));
  float band = 1.0 - smoothstep(0.02, 0.2, vUv.y);
  float veil = uVeil * max(max(clearing * 0.95, band * 0.9), 0.1);
  col = mix(col, paper * 1.012, veil);

  if (uWinter > 0.5) {
    // lamplight is laid over the veil: warmth should still reach the words
    float through = 1.0 - veil * 0.55;
    float halo = light.r * lamps * through;
    float kind = floor(light.b * 3.0);                          // 0 gold, 1 red, 2 green
    vec3 glass = kind < 0.5 ? GOLD : (kind < 1.5 ? BULB_RED : BULB_GREEN);
    vec3 glow = kind < 0.5 ? CHAMPAGNE : mix(CHAMPAGNE, glass + 0.45, 0.5);
    col = mix(col, glow, min(halo * 0.5 + halo * halo * 0.5, 1.0) * 0.86);
    float bulb = light.g * min(lamps, 1.0) * through;
    col = mix(col, glass, smoothstep(0.1, 0.34, bulb) * 0.96);
    col = mix(col, vec3(1.0, 0.985, 0.9), smoothstep(kind < 0.5 ? 0.3 : 0.5, kind < 0.5 ? 0.7 : 0.9, bulb));

    // falling snow, three depths; nearer sheets slide more as the camera travels
    vec2 sp = vec2(vUv.x * aspect, vUv.y);
    vec2 travel = vec2(uCam.x / uCam.z * aspect, uCam.y / uCam.w);
    float snow = 0.0;
    snow += snowfall(sp + travel * 0.18, 30.0, 0.030, 0.085, 0.42, 11.0, 0.0) * 0.6;
    snow += snowfall(sp + travel * 0.42, 15.0, 0.052, 0.090, 0.50, 23.0, 0.0) * 0.82;
    snow += snowfall(sp + travel * 0.85,  6.5, 0.085, 0.085, 0.66, 37.0, 1.0) * 0.9;
    col = mix(col, SNOW, min(snow, 1.0) * (1.0 - veil * 0.35));
  }

  outColor = vec4(col, 1.0);
}`;
