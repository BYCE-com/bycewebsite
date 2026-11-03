"use client";

import { useEffect, useRef } from "react";

type RGB = [number, number, number];

/** Five light lobes (largest/darkest first) plus the two streak colours. */
type Palette = { lobes: [RGB, RGB, RGB, RGB, RGB]; streakA: RGB; streakB: RGB };

// BYCE colours: acid lime #b8ee3e, subdued lime #5a8d18, chalk #f3f0e8 over carbon.
const LIME: RGB = [0.72, 0.93, 0.24];
const MOSS: RGB = [0.35, 0.55, 0.09];
const CHALK: RGB = [0.95, 0.94, 0.91];
const k = (c: RGB, s: number): RGB => [c[0] * s, c[1] * s, c[2] * s];

export const HALO_PALETTES = {
  lime: { lobes: [[0.17, 0.23, 0.07], [0.06, 0.24, 0.16], MOSS, k(LIME, 0.85), k(CHALK, 0.35)], streakA: LIME, streakB: MOSS },
  indigo: { lobes: [[0.1, 0.12, 0.42], [0.2, 0.28, 0.85], [0.3, 0.18, 0.62], k(LIME, 0.45), k(CHALK, 0.3)], streakA: [0.45, 0.55, 1.0], streakB: LIME },
  stone: { lobes: [[0.26, 0.27, 0.24], [0.14, 0.15, 0.13], MOSS, k(CHALK, 0.5), k(LIME, 0.55)], streakA: CHALK, streakB: LIME },
} satisfies Record<string, Palette>;

type HaloDriftProps = {
  /** Colour set; see HALO_PALETTES. */
  palette?: keyof typeof HALO_PALETTES;
  /** "drift": round glows wander with one sweeping streak. "aurora": tall glows sway and
   *  breathe with two rippling vertical curtains, on a slower loop. */
  motion?: "drift" | "aurora";
  /** Seconds into the loop to start at, so neighbouring panels don't move in step. */
  offset?: number;
  /** Light speed multiplier (1 = one full loop every LOOP seconds). */
  speed?: number;
  exposure?: number;
  saturation?: number;
  vignette?: number;
  grain?: number;
  className?: string;
};

/** Seconds per light loop for each motion; every path is a whole number of turns per loop. */
const LOOP = { drift: 12, aurora: 18 } as const;

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// Soft lobes of coloured light drift on looping paths through a gently warped
// "glass", with a dispersed streak sweeping across; then exposure, saturation, a
// highlight shoulder, vignette and grain.
const FRAGMENT = `
precision highp float;
uniform vec2 res;
uniform float phase;     // 0..2π over one loop
uniform float exposure;
uniform float saturation;
uniform float vignette;
uniform float grain;
uniform float seed;
uniform vec3 c0;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;
uniform vec3 c4;
uniform vec3 sA;
uniform vec3 sB;
uniform float mode;      // 0 drift, 1 aurora

const float TAU = 6.2831853;

float hash(vec2 q) { return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 spectrum(float x) {
  return clamp(abs(fract(x + vec3(0.0, 0.6667, 0.3333)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
}

vec3 lobe(vec2 p, vec2 c, float r, vec3 col) {
  vec2 d = p - c;
  return col * exp(-dot(d, d) / (r * r));
}

// Tall light that sways and slowly rises and falls (an anisotropic lobe).
vec3 column(vec2 p, vec2 c, float r, vec3 col) {
  vec2 d = (p - c) * vec2(1.0, 0.42);
  return col * exp(-dot(d, d) / (r * r));
}

// Aurora: tall glows sway side to side and breathe up and down, crossed by two thin
// rippling curtains of light instead of one sweeping streak.
vec3 aurora(vec2 p, float aspect, float T) {
  vec2 g = p + 0.05 * vec2(sin(p.y * 3.0 + T), 0.0) + 0.02 * vec2(sin(p.y * 9.0 - 2.0 * T), 0.0);
  float ax = 0.4 * max(aspect, 1.0);
  vec3 c = vec3(0.0);
  c += column(g, vec2(ax * sin(T + 0.6), 0.2 * sin(T - 0.4)), 0.42, c0);
  c += column(g, vec2(ax * 0.9 * sin(-T + 2.4), 0.25 * cos(T + 0.8)), 0.36, c1);
  c += column(g, vec2(ax * 0.7 * sin(2.0 * T + 1.0), 0.3 * sin(-T + 2.0)), 0.3, c2);
  c += column(g, vec2(ax * 0.6 * cos(T - 0.9), 0.28 * sin(2.0 * T + 0.3)), 0.24, c3);
  c += column(g, vec2(ax * 0.45 * sin(-2.0 * T + 0.5), 0.2 * cos(T + 1.6)), 0.14, c4);
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float x0 = ax * (0.55 * sin(T + fi * 3.1) + 0.12 * sin(-2.0 * T + fi)) + 0.06 * sin(p.y * 4.0 + 2.0 * T + fi * 2.0);
    float dx = p.x - x0;
    float fade = smoothstep(-0.75, 0.15, p.y + 0.25 * sin(T + fi)) * (1.0 - smoothstep(0.2, 0.8, p.y));
    float curtain = exp(-dx * dx / 0.0022) * fade;
    vec3 tint = mix(sA, sB, clamp(0.5 + p.y + 0.3 * sin(T + fi), 0.0, 1.0));
    c += mix(tint, spectrum(p.y * 0.8 + T / TAU + dx * 8.0), 0.1) * curtain * 0.42;
    c += vec3(0.95, 0.94, 0.91) * exp(-dx * dx / 0.0002) * fade * 0.12;
  }
  return c;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y);
  float aspect = res.x / res.y;
  float T = phase;
  vec3 c = vec3(0.0);

  if (mode > 0.5) {
    c = aurora(p, aspect, T);
  } else {

  // Glass: a slow two-axis ripple bends the light field.
  vec2 g = p + 0.06 * vec2(sin(p.y * 5.0 + T * 2.0), cos(p.x * 4.0 - T)) + 0.03 * vec2(sin(p.x * 11.0 - T * 3.0), sin(p.y * 9.0 + T * 2.0));

  float ax = 0.42 * max(aspect, 1.0);
  c += lobe(g, vec2(ax * sin(T + 0.3), 0.26 * cos(2.0 * T)), 0.5, c0);
  c += lobe(g, vec2(ax * sin(-T + 2.1), 0.3 * sin(T + 1.0)), 0.42, c1);
  c += lobe(g, vec2(ax * 0.8 * cos(2.0 * T + 1.2), 0.22 * sin(-T + 0.4)), 0.36, c2);
  c += lobe(g, vec2(ax * 0.7 * sin(T - 1.4), 0.24 * cos(T + 2.4)), 0.3, c3);
  c += lobe(g, vec2(ax * 0.5 * cos(-T + 0.2), 0.18 * sin(2.0 * T + 2.0)), 0.16, c4);

  // Streak: a thin band between the palette's two streak colours along a slowly turning
  // axis, with only a faint dispersion at its edges.
  float a = 0.35 + 0.25 * sin(T);
  vec2 dir = vec2(cos(a), sin(a));
  vec2 n = vec2(-dir.y, dir.x);
  float across = dot(g, n) + 0.12 * sin(T);
  float along = dot(g, dir);
  float band = exp(-across * across / 0.004) * (0.55 + 0.45 * sin(along * 3.0 - T));
  vec3 streak = mix(sA, sB, 0.5 + 0.5 * sin(along * 2.0 + T));
  c += mix(streak, spectrum(along * 0.9 + T / TAU + across * 6.0), 0.12) * band * 0.5;
  c += vec3(0.95, 0.94, 0.91) * exp(-across * across / 0.0004) * 0.18;
  }

  // Tone.
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = max(mix(vec3(luma), c, saturation), 0.0) * exposure;
  vec2 q = p / vec2(max(aspect, 1.0) * 0.5, 0.5);
  c *= 1.0 - vignette * min(dot(q, q) / 2.2, 1.0);
  c = 1.0 - exp(-c * 1.25);                      // soft highlight shoulder
  c += grain * (hash(gl_FragCoord.xy + seed) - 0.5);
  c += (hash(gl_FragCoord.xy * 1.37 + 17.0) - 0.5) / 255.0; // dither against banding
  gl_FragColor = vec4(c, 1.0);
}
`;

/**
 * Halo Drift: a full-canvas WebGL light field, soft coloured light drifting through
 * glass like a lens flare. Loops seamlessly, draws only while visible, and holds a
 * still frame for reduced motion.
 */
export function HaloDrift({ palette = "lime", motion = "drift", offset = 0, speed = 1, exposure = 0.85, saturation = 1, vignette = 0.45, grain = 0.03, className = "" }: HaloDriftProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "high-performance" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn("HaloDrift shader:", gl.getShaderInfoLog(s));
      return s;
    };
    const program = gl.createProgram()!;
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "position");
    gl.linkProgram(program);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const uRes = u("res"), uPhase = u("phase"), uSeed = u("seed");
    gl.uniform1f(u("exposure"), exposure);
    gl.uniform1f(u("saturation"), saturation);
    gl.uniform1f(u("vignette"), vignette);
    gl.uniform1f(u("grain"), grain);
    const pal = HALO_PALETTES[palette];
    pal.lobes.forEach((col, i) => gl.uniform3fv(u(`c${i}`), col));
    gl.uniform3fv(u("sA"), pal.streakA);
    gl.uniform3fv(u("sB"), pal.streakB);
    gl.uniform1f(u("mode"), motion === "aurora" ? 1 : 0);
    const loop = LOOP[motion];

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let time = offset;
    let last = 0;
    let raf = 0;
    let visible = false;
    let lost = false;

    const draw = () => {
      if (lost) return;
      const box = canvas.getBoundingClientRect();
      // Cap the backing store at ~3.5 MP so large panels stay smooth.
      const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3_500_000 / Math.max(1, box.width * box.height)));
      const w = Math.max(1, Math.round(box.width * ratio));
      const h = Math.max(1, Math.round(box.height * ratio));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uPhase, ((time % loop) / loop) * Math.PI * 2);
      gl.uniform1f(uSeed, (Math.floor(time * 24) % 997) * 7.31);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const tick = (now: number) => {
      raf = 0;
      time += (last ? Math.min((now - last) / 1000, 0.05) : 1 / 60) * speed;
      last = now;
      draw();
      schedule();
    };
    const schedule = () => {
      if (!raf && visible && !document.hidden && !reduce && !lost && speed > 0) raf = requestAnimationFrame(tick);
    };
    const refresh = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      draw();
      schedule();
    };

    const ro = new ResizeObserver(refresh);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      refresh();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", refresh);
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    canvas.addEventListener("webglcontextlost", onLost);
    refresh();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", refresh);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [palette, motion, offset, speed, exposure, saturation, vignette, grain]);

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} aria-hidden="true" />;
}
