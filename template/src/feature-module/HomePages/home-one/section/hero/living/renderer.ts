// WebGL2 renderer for The Living Pattern (ported from the standalone intro).
// It owns the canvas, the baked textures and the shader, and never animates by
// itself: call render(state) whenever something changes.
import { VERT, FRAG } from './shaders';

export const ART_ASPECT = 841.89 / 595.276;
const SDF_UNITS = 4096;          // SDF distances are baked in 4k-texel units for every size
const MAX_CANVAS_SIDE = 2560;

export type Edition = 'classic' | 'winter';
export interface RenderState {
  cam: { x: number; y: number; w: number; h: number };
  t: number;
  seed: { x: number; y: number };
  seedAmt: number;
  veil: number;
  now: number;
}

async function loadBitmap(url: string, signal: AbortSignal): Promise<ImageBitmap> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  // raw bytes, please: these are data, not pictures
  return createImageBitmap(await res.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
  return s;
}

const UNIFORMS = ['uInk', 'uField', 'uFieldSize', 'uCam', 'uRes', 'uArtAspect', 'uSdfW', 'uT', 'uSeed', 'uSeedAmt',
  'uVeil', 'uVeilR', 'uLights', 'uTint', 'uWinter', 'uNow'] as const;

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly winter: boolean;
  /** Folder of this edition's textures (ends with /). */
  readonly dir: string;
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private buffer: WebGLBuffer;
  private u = {} as Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  private textures: WebGLTexture[] = [];
  ready = false;

  constructor(canvas: HTMLCanvasElement, edition: Edition, baseDir: string) {
    this.canvas = canvas;
    this.winter = edition === 'winter';
    this.dir = baseDir + (this.winter ? 'tex/winter/' : 'tex/');
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
    gl.useProgram(prog);
    this.prog = prog;
    for (const name of UNIFORMS) this.u[name] = gl.getUniformLocation(prog, name);

    this.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one big triangle
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.resize();
  }

  /** Smaller SDF for phones and modest GPUs. */
  private pickInk(): string {
    const gl = this.gl;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const small = Math.max(window.screen.width, window.screen.height) * Math.min(window.devicePixelRatio || 1, 2) < 1500
      || gl.getParameter(gl.MAX_TEXTURE_SIZE) < 4096
      || (mem !== undefined && mem <= 4);
    return this.dir + (small ? 'ink-2k.webp' : 'ink-4k.webp');
  }

  async load(signal: AbortSignal): Promise<void> {
    const gl = this.gl;
    const [sdf, field, lights, tint] = await Promise.all([
      loadBitmap(this.pickInk(), signal),
      loadBitmap(this.dir + 'time.webp', signal),
      this.winter ? loadBitmap(this.dir + 'lights.webp', signal) : Promise.resolve(null),
      this.winter ? loadBitmap(this.dir + 'tint.webp', signal) : Promise.resolve(null),
    ]);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    const make = (unit: number, bmp: ImageBitmap, internal: number, format: number, filter: number, mips = false) => {
      const tex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, format, gl.UNSIGNED_BYTE, bmp);
      if (mips) gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.textures.push(tex);
    };
    make(0, sdf, gl.RGB8, gl.RGB, gl.LINEAR, true);
    make(1, field, gl.RGBA8, gl.RGBA, gl.NEAREST);
    if (lights) { make(2, lights, gl.RGB8, gl.RGB, gl.LINEAR, true); lights.close(); }
    if (tint) { make(3, tint, gl.RGB8, gl.RGB, gl.LINEAR, true); tint.close(); }

    gl.uniform1i(this.u.uLights, lights ? 2 : 0);
    gl.uniform1i(this.u.uTint, tint ? 3 : 0);
    gl.uniform1f(this.u.uWinter, this.winter ? 1 : 0);
    gl.uniform1i(this.u.uInk, 0);
    gl.uniform1i(this.u.uField, 1);
    gl.uniform2f(this.u.uFieldSize, field.width, field.height);
    gl.uniform1f(this.u.uArtAspect, ART_ASPECT);
    gl.uniform1f(this.u.uSdfW, SDF_UNITS);
    sdf.close();
    field.close();
    this.ready = true;
  }

  get aspect(): number {
    return this.canvas.width / this.canvas.height;
  }

  /** Match the canvas backing store to its CSS box. Returns true if it changed. */
  resize(): boolean {
    const box = this.canvas.getBoundingClientRect();
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const longest = Math.max(box.width, box.height) * dpr;
    if (longest > MAX_CANVAS_SIDE) dpr *= MAX_CANVAS_SIDE / longest;
    const w = Math.max(2, Math.round(box.width * dpr));
    const h = Math.max(2, Math.round(box.height * dpr));
    if (w === this.canvas.width && h === this.canvas.height) return false;
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
    return true;
  }

  render(state: RenderState): void {
    if (!this.ready) return;
    const gl = this.gl, u = this.u;
    const portrait = this.aspect < 0.8;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform4f(u.uCam, state.cam.x, state.cam.y, state.cam.w, state.cam.h);
    gl.uniform1f(u.uT, state.t);
    gl.uniform2f(u.uSeed, state.seed.x, state.seed.y);
    gl.uniform1f(u.uSeedAmt, state.seedAmt);
    gl.uniform1f(u.uVeil, state.veil);
    gl.uniform1f(u.uNow, state.now || 0);
    // the homepage clearing behind the words (taller on phones, where the copy is long)
    gl.uniform2f(u.uVeilR, portrait ? 1.0 : 0.56, portrait ? 0.62 : 0.66);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose(): void {
    const gl = this.gl;
    this.ready = false;
    this.textures.forEach((t) => gl.deleteTexture(t));
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.prog);
  }
}
