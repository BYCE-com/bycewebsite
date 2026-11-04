// @ts-nocheck — vendored HorizonX renderer, kept as supplied apart from the photo-only face
// mode (BYCE shows photographs on every card, no lettering). Typed props live on the wrapper.
/* eslint-disable */
"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";

const CSS = `
.ge-host{width:100%;height:100%}
.ge-frame{display:grid;place-items:center;width:100%;height:100%;overflow:hidden;background:transparent}
.ge-root{position:relative;width:min(100%,var(--ge-width));height:min(100%,var(--ge-height));border-radius:var(--ge-radius);background:var(--ge-bg);overflow:hidden;outline:none;container-type:size;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
.ge-root:focus-visible::after{content:'';position:absolute;inset:0;z-index:3;border-radius:inherit;box-shadow:inset 0 0 0 2px var(--ge-ink);pointer-events:none}
.ge-gl,.ge-shade,.ge-labels{position:absolute;inset:0;pointer-events:none}
.ge-gl{z-index:1}
.ge-canvas{display:block;width:100%;height:100%}
.ge-shade{top:auto;height:calc(min(100cqh,100cqw * 1200 / 760) * 262 / 1200);background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.03) 45%,rgba(0,0,0,.07) 100%)}
.ge-shade[hidden],.ge-labels[hidden],.ge-toggle[hidden]{display:none}
.ge-still{display:none;position:absolute;left:50%;top:50%;z-index:1;height:min(31cqh,48.9cqw * 1.274);aspect-ratio:292/372;object-fit:cover;transform:translate(-50%,-50%)}
.ge-root[data-ge-fallback] .ge-still{display:block}
.ge-toggle{position:absolute;left:16px;top:16px;z-index:3;display:grid;place-items:center;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:var(--ge-bg);color:var(--ge-ink);cursor:pointer;clip-path:inset(50%);opacity:0}
.ge-toggle svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.ge-toggle .ge-play,.ge-toggle[aria-pressed="true"] .ge-pause{display:none}
.ge-toggle[aria-pressed="true"] .ge-play{display:block}
.ge-toggle:focus-visible{clip-path:none;opacity:1;outline:2px solid var(--ge-ink);outline-offset:2px}
.ge-sr,.ge-live{position:absolute;width:1px;height:1px;margin:0;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
`;

/**
 * Glass Exit Carousel: a diagonal conveyor of cards that steps down-right one
 * slot at a time. The cards in the middle of the stage lie flat and readable;
 * as a card is pushed toward the edge of the frame, the part of it furthest
 * from the centre stays crisp while the rest lifts toward the lens, lags
 * behind (stretched, so the picture smears into streaks) and fans open across
 * the travel axis. A post pass then splits that flare into a thin spectral
 * fringe and a hue-shifted haze. Cards entering at the lower right do the same
 * in reverse, so the glass reads on both sides of the frame.
 *
 * Units: one design unit is one pixel of the reference recording. The stage is
 * `SW x SH` design units, world x to the right, y up, z toward the camera, and
 * the camera sits at (0, 0, camZ) so that the plane z = 0 maps one design unit
 * to `unit` CSS pixels.
 */

const REF_W = 760;
const REF_H = 1200;
const CARD_W = 292;
const CARD_H = 372;
/** One slot down-right, in design units. */
const STEP = { x: 252.499, y: 173.801 };
const DEG_PER_SLOT = 15;
/** Seconds per step at speed 1, and how much of it is spent moving. */
const PERIOD = 44 / 60;
const MOVE = 0.459999;
const FIRST_MOVE = 0.47;
/** Card kinds along the path; the loop repeats every KINDS steps. BYCE: 18 (was 9), so a
 *  full-screen path of about 18 cards shows 18 different photos instead of 9 twice. */
const KINDS = 18;
const MAX_SETS = 3;
const BASE = -1;
const FOV = 30;
const SEGMENTS = 48;
const GLYPH_PERIOD = PERIOD / 3;
const LOOP = PERIOD * KINDS;
const REST_START = FIRST_MOVE + MOVE - PERIOD;
/** Entering cards are drawn over the readable ones, so their flare is shorter. */
const ENTER_SCALE = 0.600001;

const JP_FAMILY = '"GEC Noto Sans JP","Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif';
const LATIN_FAMILY = 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const ENGINE_DEFAULTS = {
  glyphs: ['光', '夜', '夢', '空', '風', '月', '星', '雨', '花'],
  yellow: { bg: '#fdcd03', mark: '眼鏡', title: 'サングラス', brand: 'OOLA EYEWEAR' },
  photos: [],
  solids: [],
  photosOnly: false,
  speed: 1,
  playing: true,
  glass: 1,
  flare: 1,
  haze: 1,
  fontUrl: '',
  preview: false
};

// Timing: stepped, fast attack, long settle (a cubic-bezier fitted to the reference).
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}

const ease = bezier(0.359999, 0, 0.119999, 1);

/** Steps completed by time t, eased: whole numbers while the cards rest. */
function travelled(t) {
  const u = t - FIRST_MOVE;
  if (u < 0) return 0;
  const n = Math.floor(u / PERIOD);
  const f = Math.min(1, (u - n * PERIOD) / MOVE);
  return n + ease(f);
}

/** Wraps a slot offset into [-n/2, n/2). */
function wrapN(p, n) {
  const h = n / 2;
  return ((((p + h) % n) + n) % n) - h;
}

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function glyphAt(t, glyphs) {
  const list = glyphs?.length ? glyphs : ENGINE_DEFAULTS.glyphs;
  const i = Math.floor(Math.max(0, t) / GLYPH_PERIOD);
  return list[i % list.length];
}

// Layout
function goneAt(SW, SH) {
  for (let p = 0; p < 20; p += 0.0100001) {
    const th = (DEG_PER_SLOT * p * Math.PI) / 180;
    const c = Math.abs(Math.cos(th));
    const s = Math.abs(Math.sin(th));
    const ex = (CARD_W * c + CARD_H * s) / 2;
    const ey = (CARD_W * s + CARD_H * c) / 2;
    if (STEP.x * p - ex > SW / 2 || STEP.y * p - ey > SH / 2) return p;
  }
  return 20;
}

function layoutFor(W, H) {
  const width = Math.max(1, W);
  const height = Math.max(1, H);
  const unit = Math.min(height / REF_H, width / REF_W);
  const SW = width / unit;
  const SH = height / unit;
  const gone = goneAt(SW, SH);
  const fadeOut = gone - 0.150001;
  const fadeIn = Math.min(Math.max(gone - 2.9, 1.14999), fadeOut - 0.349999);
  const n = Math.min(MAX_SETS, Math.ceil((2 * (gone + 0.9)) / KINDS)) * KINDS;
  const camZ = SH / 2 / Math.tan((FOV / 2) * (Math.PI / 180));
  const room = Math.min(1, Math.max(0.300001, (fadeOut - fadeIn) / 2.74999));
  return { unit, SW, SH, cx: SW / 2, cy: SH / 2 + 1, gone, fadeIn, fadeOut, n, camZ, room };
}

const exitOf = (p, layout) => smoothstep(layout.fadeIn, layout.fadeOut, Math.abs(p));

function flareOf(p, layout, cfg) {
  const g = Math.max(0, Number(cfg.glass) || 0);
  const f = Math.max(0, Number(cfg.flare) || 0);
  const side = p >= 0 ? ENTER_SCALE : 1;
  const k = g * f * layout.room * side;
  return { stretch: 1.2 * k, fan: 1.2 * k, lift: Math.min(0.799999, 0.360001 * k) };
}

// Shaders
const CARD_VERTEX = /* glsl */ `
  uniform vec2 uCentre;   // world, y up
  uniform float uAngle;   // radians, counter-clockwise positive
  uniform float uExit;    // 0 while readable, 1 once it has left the frame
  uniform vec2 uBack;     // unit, toward the centre of the stage
  uniform vec2 uHalf;
  uniform float uStretch; // how far the trailing part lags, in card lengths
  uniform float uFan;     // how far the flare opens across the axis
  uniform float uLift;    // fraction of the camera distance the flare rises
  uniform float uCamZ;
  uniform float uLayer;
  varying vec2 vUv;
  varying float vSmear;
  varying float vSheen;
  varying float vMask;
  varying vec2 vDirUv;
  void main() {
    vUv = uv;
    float c = cos(uAngle), s = sin(uAngle);
    mat2 R = mat2(c, s, -s, c);
    vec2 r = R * position.xy;
    vec2 ax = R * vec2(uHalf.x, 0.0), ay = R * vec2(0.0, uHalf.y);
    float ext = abs(dot(ax, uBack)) + abs(dot(ay, uBack));
    float L = 1.99999 * ext;
    vec2 n = vec2(-uBack.y, uBack.x);
    float along = dot(r, uBack);
    float across = dot(r, n);
    float b = (along + ext) / L;            // 0 leading edge .. 1 trailing edge
    float e = uExit;
    float alongS = along + uStretch * L * e * pow(b, 1.6);
    float fan = 1.0 + uFan * e * pow(b, 1.50001);
    vec2 screen = uCentre + uBack * alongS + n * across * fan;
    float z = uCamZ * uLift * e * pow(b, 1.20001);
    // Un-project so the point lands on that screen position with real
    // foreshortening as it rises toward the lens.
    vec2 world = screen * (uCamZ - z) / uCamZ;
    vSmear = clamp(e * (0.25 + 1.60001 * uStretch * b), 0.0, 0.99999);
    vSheen = e * smoothstep(0.150001, 0.450001, b) * (1.00001 - smoothstep(0.549999, 1.00001, b));
    vMask = e * (0.45 + 0.549999 * b);
    vec2 local = transpose(R) * uBack;
    vDirUv = local / (2.00001 * uHalf);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, z + uLayer, 1.0);
  }
`;

const CARD_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform float uSmear;
  uniform float uSheen;
  uniform float uMaskPass;
  varying vec2 vUv;
  varying float vSmear;
  varying float vSheen;
  varying float vMask;
  varying vec2 vDirUv;
  void main() {
    if (uMaskPass > 0.5) {
      if (texture2D(map, vUv).a < 0.02) discard;
      gl_FragColor = vec4(vMask, vMask, vMask, 1.0);
      return;
    }
    float spread = vSmear * uSmear;
    vec4 acc = vec4(0.0);
    for (int i = 0; i < 13; i++) {
      float o = (float(i) / 12.0) * spread;
      vec4 t = texture2D(map, clamp(vUv - vDirUv * o, 0.0, 1.0));
      acc += vec4(t.rgb * t.a, t.a);
    }
    acc /= 13.0;
    vec4 base = texture2D(map, vUv);
    vec4 tex = mix(vec4(base.rgb * base.a, base.a), acc, smoothstep(0.0, 0.05, vSmear));
    if (tex.a < 0.02) discard;
    vec3 col = tex.rgb / tex.a;
    // Light catching the bend of the sheet.
    col = mix(col, vec3(1.0), vSheen * uSheen);
    gl_FragColor = vec4(col, tex.a);
  }
`;

const POST_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.500001 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 0.99999);
  }
`;

// Spectral split plus a hue-shifted haze, applied only where the mask says a
// pixel belongs to (or sits just past) a folding card, so the readable cards
// stay sharp.
const POST_FRAGMENT = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D tMask;
  uniform vec2 resolution;
  uniform float strength;
  uniform float haze;
  uniform vec2 axis;      // unit travel axis in buffer pixels (y up)
  uniform vec2 centre;    // buffer pixels
  varying vec2 vUv;
  const int TAPS = 24;
  const int HAZE_TAPS = 14;
  const float HAZE_HUE = -1.22;
  const float HAZE_LIGHT = 0.35;
  const float HAZE_SAT = 1.8;
  const float HAZE_ALPHA = 0.9;
  vec3 spectrum(float t) {
    return max(vec3(
      1.0 - abs(t - 1.0) * 1.9,
      1.0 - abs(t - 0.5) * 2.4,
      1.0 - abs(t) * 1.9
    ), 0.0) + 0.02;
  }
  vec3 hueRotate(vec3 c, float a) {
    const vec3 k = vec3(0.57735027);
    float ca = cos(a);
    return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
  }
  vec3 hazeTint(vec3 c) {
    vec3 ghost = hueRotate(c, HAZE_HUE);
    float luma = dot(ghost, vec3(0.299, 0.587, 0.114));
    return clamp(mix(vec3(luma), ghost, HAZE_SAT), 0.0, 1.0);
  }
  void main() {
    vec2 cpx = vUv * resolution - centre;
    float along = dot(cpx, axis);
    vec2 dir = normalize(cpx + 1e-4);
    vec2 a0 = axis * along;
    vec2 hdir = normalize((cpx - a0) + a0 * 0.3 + 1e-4);
    vec2 offMax = dir * strength / resolution;
    vec2 hoffMax = hdir * haze / resolution;
    float k = texture2D(tMask, vUv).r;
    k = max(k, texture2D(tMask, vUv - offMax).r);
    k = max(k, texture2D(tMask, vUv - hoffMax * 0.5).r * 0.9);
    k = max(k, texture2D(tMask, vUv - hoffMax).r * 0.75);
    k = clamp(k, 0.0, 1.0);
    k = k * k * (3.0 - 2.0 * k);
    if (k <= 0.001) {
      gl_FragColor = texture2D(tDiffuse, vUv);
      return;
    }
    vec2 off = dir * strength * k / resolution;
    vec3 acc = vec3(0.0), cover = vec3(0.0), wsum = vec3(0.0);
    for (int i = 0; i < TAPS; i++) {
      float t = float(i) / float(TAPS - 1);
      vec3 w = spectrum(t);
      vec4 sm = texture2D(tDiffuse, vUv - off * t);
      acc += sm.rgb * w;
      cover += sm.a * w;
      wsum += w;
    }
    vec3 col = acc / wsum;
    cover /= wsum;
    float alpha = max(max(cover.r, cover.g), cover.b);
    col += alpha - cover;

    vec2 hoff = hdir * haze * k / resolution;
    vec3 hc = vec3(0.0);
    float cov = 0.0, wt = 0.0;
    for (int i = 0; i < HAZE_TAPS; i++) {
      float t = (float(i) + 0.5) / float(HAZE_TAPS);
      vec4 sm = texture2D(tDiffuse, vUv - hoff * t);
      float w = 1.0 - 0.7 * t;
      float m = smoothstep(0.015, 0.05, sm.a) * w;
      hc += sm.rgb / max(sm.a, 1e-3) * m;
      cov += m;
      wt += w;
    }
    float self = smoothstep(0.015, 0.05, texture2D(tDiffuse, vUv).a);
    if (cov > 0.0) {
      vec3 ghost = hazeTint(hc / cov);
      float ha = sqrt(cov / wt) * (1.0 - self) * HAZE_ALPHA * (1.0 - HAZE_LIGHT) * smoothstep(0.25, 0.7, k);
      col += ghost * ha * (1.0 - alpha);
      alpha += ha * (1.0 - alpha);
    }
    gl_FragColor = vec4(col, alpha);
  }
`;

// Card faces, painted in card units (292 x 372) at the face's texture scale.
const jp = (weight, size) => `${weight} ${size}px ${JP_FAMILY}`;
const latin = (weight, size) => `${weight} ${size}px ${LATIN_FAMILY}`;

function shade(ctx, a) {
  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.549999, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
}

function fitSize(ctx, lines, weight, size, maxWidth) {
  ctx.font = jp(weight, size);
  const widest = Math.max(1, ...lines.map((line) => ctx.measureText(line).width));
  return Math.max(8, Math.min(size, Math.floor((size * maxWidth) / widest)));
}

function paintGlyph(ctx, glyph) {
  ctx.fillStyle = '#121214';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = '#ffffff';
  const size = fitSize(ctx, [glyph], 900, 168, CARD_W - 40);
  ctx.font = jp(900, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, CARD_W / 2, CARD_H / 2 + 4);
  shade(ctx, 0.06);
}

function paintYellow(ctx, card) {
  ctx.fillStyle = card.bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = '#000000';
  if (card.mark) {
    const size = fitSize(ctx, [card.mark], 900, 104, CARD_W - 80);
    ctx.font = jp(900, size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(card.mark, 146, 200);
  }
  if (card.title) {
    const size = fitSize(ctx, [card.title], 900, 50, CARD_W - 36);
    ctx.font = jp(900, size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(card.title, 143, 283);
  }
  if (card.brand) {
    const [head, ...rest] = card.brand.split(' ');
    const tail = rest.join(' ');
    ctx.textAlign = 'left';
    ctx.font = latin(800, 7);
    const aw = ctx.measureText(head).width;
    ctx.font = latin(300, 7);
    const bw = tail ? ctx.measureText(tail).width + 1 : 0;
    const x0 = 139 - (aw + bw) / 2;
    ctx.font = latin(800, 7);
    ctx.fillText(head, x0, 329);
    if (tail) {
      ctx.font = latin(300, 7);
      ctx.fillText(tail, x0 + aw + 1, 329);
    }
  }
  shade(ctx, 0.100001);
}

const headlineLines = (headline) =>
  String(headline ?? '').split(/\s+/).filter(Boolean).slice(0, 3);

function paintSolid(ctx, card) {
  ctx.fillStyle = card.bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = card.ink;
  ctx.textBaseline = 'alphabetic';
  if (card.caption) {
    ctx.font = latin(500, 9);
    ctx.textAlign = 'left';
    ctx.fillText(card.caption, 14, 22);
  }
  if (card.no) {
    ctx.font = latin(500, 9);
    ctx.textAlign = 'right';
    ctx.fillText(card.no, CARD_W - 14, 22);
  }
  const lines = headlineLines(card.headline);
  let subY = CARD_H - 20;
  if (lines.length && card.vertical) {
    const chars = [...lines.join('')].slice(0, 8);
    const size = Math.max(8, Math.min(card.size, Math.floor((CARD_H - 92) / (chars.length * 1.01999))));
    ctx.font = jp(900, size);
    ctx.textAlign = 'center';
    const lh = size * 1.02;
    const top = CARD_H - 28 - lh * chars.length + size * 0.879999;
    chars.forEach((ch, i) => ctx.fillText(ch, CARD_W - 22 - size / 2, top + i * lh));
  } else if (lines.length) {
    let size = fitSize(ctx, lines, 900, card.size, CARD_W - 28);
    size = Math.min(size, Math.floor((CARD_H * 0.550001) / (lines.length * 1.08001)));
    ctx.font = jp(900, size);
    ctx.textAlign = 'left';
    lines.forEach((line, i) => ctx.fillText(line, 14, CARD_H - 22 - (lines.length - 1 - i) * size * 1.07999));
    subY = CARD_H - 22 - size * 1.07999 * lines.length - 6;
  }
  if (card.sub) {
    ctx.font = latin(400, 8);
    ctx.textAlign = 'left';
    ctx.fillText(card.sub, 14, subY);
  }
  shade(ctx, 0.100001);
}

function paintPhoto(ctx, image) {
  if (image) {
    const r = Math.max(CARD_W / image.width, CARD_H / image.height);
    const w = image.width * r;
    const h = image.height * r;
    ctx.drawImage(image, (CARD_W - w) / 2, (CARD_H - h) / 2, w, h);
  } else {
    ctx.fillStyle = '#8a8a8e';
    ctx.fillRect(0, 0, CARD_W, CARD_H);
  }
}

// Loading
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    // The picture is uploaded to the GPU, which needs a same-origin or CORS image.
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const registered = new Map();
function registerFont(url) {
  if (!url || typeof FontFace !== 'function' || typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  if (!registered.has(url)) {
    const face = new FontFace('GEC Noto Sans JP', `url(${JSON.stringify(url)}) format("woff2")`, { weight: '900', display: 'block' });
    registered.set(url, face.load().then((loaded) => { document.fonts.add(loaded); }).catch(() => {}));
  }
  return registered.get(url);
}

function waitForFonts(url) {
  const fonts = typeof document !== 'undefined' ? document.fonts : null;
  const loads = Promise.all([
    registerFont(url),
    fonts?.load?.(latin(800, 7)),
    fonts?.load?.(latin(500, 9)),
    fonts?.load?.(latin(300, 7)),
  ]).catch(() => {});
  return Promise.race([loads, new Promise((resolve) => setTimeout(resolve, 2500))]);
}

const SLOW_FRAME_MS = 120;
const SLOW_FRAMES = 3;
const SLOW_SCALE = 0.5;
const countSlowFrames = (count, gap) => (gap > SLOW_FRAME_MS ? count + 1 : 0);

// Engine
function buildGlassExitCarousel(root, config) {
  if (!root) return null;
  let cfg = { ...ENGINE_DEFAULTS, ...config };
  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = root.querySelector('.ge-gl') ?? root;
  const live = root.querySelector('.ge-live');
  const toggle = root.querySelector('.ge-toggle');

  let disposed = false;
  let scene = null;
  let paused = false;
  let onScreen = true;
  let pageVisible = typeof document === 'undefined' || document.visibilityState !== 'hidden';
  let clock = REST_START;
  const cleanups = [];
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };

  const running = () =>
    cfg.playing && !paused && !reducedMotion && onScreen && pageVisible && Number(cfg.speed) > 0;

  function syncToggle() {
    if (!toggle) return;
    const playing = cfg.playing && !paused && !reducedMotion;
    toggle.setAttribute('aria-pressed', playing ? 'false' : 'true');
    toggle.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
    toggle.toggleAttribute('hidden', !cfg.playing || reducedMotion || cfg.preview);
  }

  function setPaused(next) {
    paused = next;
    syncToggle();
    if (live && !cfg.preview) live.textContent = paused ? 'Paused' : 'Playing';
    scene?.invalidate();
  }

  listen(root, 'keydown', (e) => {
    if (cfg.preview || e.target !== root || !cfg.playing) return;
    if (e.key === ' ' || e.key === 'Enter') {
      setPaused(!paused);
      e.preventDefault();
    }
  });
  if (toggle) listen(toggle, 'click', () => setPaused(!paused));

  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      scene?.invalidate();
    })
    : null;
  observer?.observe(root);
  cleanups.push(() => observer?.disconnect());
  if (typeof document !== 'undefined') {
    listen(document, 'visibilitychange', () => {
      pageVisible = document.visibilityState !== 'hidden';
      scene?.invalidate();
    });
  }

  function fail() {
    if (disposed) return;
    root.setAttribute('data-ge-fallback', '');
  }

  function createScene(THREE) {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
    } catch {
      fail();
      return null;
    }
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.className = 'ge-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    stage.replaceChildren(canvas);

    const world = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 50, 10000);
    const target = new THREE.WebGLRenderTarget(1, 1, { samples: 4, depthBuffer: true });
    const maskTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });

    const len = Math.hypot(STEP.x, STEP.y);
    const OUT_POS = new THREE.Vector2(STEP.x / len, -STEP.y / len);
    const OUT_NEG = OUT_POS.clone().multiplyScalar(-1);

    const post = new THREE.Mesh(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3)
      ),
      new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: target.texture },
          tMask: { value: maskTarget.texture },
          resolution: { value: new THREE.Vector2(1, 1) },
          strength: { value: 1 },
          haze: { value: 1 },
          axis: { value: OUT_POS.clone() },
          centre: { value: new THREE.Vector2() }
        },
        vertexShader: POST_VERTEX,
        fragmentShader: POST_FRAGMENT,
        depthTest: false,
        depthWrite: false
      })
    );
    post.frustumCulled = false;
    const postScene = new THREE.Scene();
    postScene.add(post);
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let texScale = 2;
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    function makeTexture(canvas2d) {
      const texture = new THREE.CanvasTexture(canvas2d);
      texture.colorSpace = THREE.NoColorSpace;
      texture.anisotropy = maxAnisotropy;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      return texture;
    }
    const faces = Array.from({ length: KINDS }, () => {
      const canvas2d = document.createElement('canvas');
      canvas2d.width = CARD_W * texScale;
      canvas2d.height = CARD_H * texScale;
      return { canvas: canvas2d, ctx: canvas2d.getContext('2d'), texture: makeTexture(canvas2d), key: null, ready: false };
    });

    const geometry = new THREE.PlaneGeometry(CARD_W, CARD_H, SEGMENTS, SEGMENTS);
    const cards = [];
    for (let s = 0; s < MAX_SETS; s++) {
      faces.forEach((face, kind) => {
        const material = new THREE.ShaderMaterial({
          uniforms: {
            map: { value: face.texture },
            uCentre: { value: new THREE.Vector2() },
            uAngle: { value: 0 },
            uExit: { value: 0 },
            uBack: { value: OUT_POS.clone() },
            uMaskPass: { value: 0 },
            uHalf: { value: new THREE.Vector2(CARD_W / 2, CARD_H / 2) },
            uStretch: { value: 0 },
            uFan: { value: 0 },
            uLift: { value: 0 },
            uCamZ: { value: 2000 },
            uLayer: { value: 0 },
            uSmear: { value: 0.319999 },
            uSheen: { value: 0.320001 }
          },
          vertexShader: CARD_VERTEX,
          fragmentShader: CARD_FRAGMENT,
          transparent: true,
          depthTest: true,
          depthWrite: true,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        mesh.visible = false;
        world.add(mesh);
        cards.push({ kind, material, mesh });
      });
    }

    // Faces
    const photos = new Map();
    function photo(src) {
      if (!src) return { image: null, promise: Promise.resolve(null), done: true };
      if (!photos.has(src)) {
        const entry = { image: null, done: false, promise: null };
        entry.promise = loadImage(src).then((image) => {
          entry.image = image;
          entry.done = true;
          if (!disposed) invalidate();
          return image;
        });
        photos.set(src, entry);
      }
      return photos.get(src);
    }

    let fontsReady = false;
    waitForFonts(cfg.fontUrl).then(() => {
      if (disposed) return;
      fontsReady = true;
      for (const face of faces) face.key = null;
      invalidate();
    });

    function photoFace(src) {
      const entry = photo(src);
      if (!entry.done) return null;
      return [`p${src}|${entry.image ? 1 : 0}`, (ctx) => paintPhoto(ctx, entry.image)];
    }

    // [repaint key, painter] for kind k at time t; null while it is not ready.
    function faceOf(kind, t) {
      // BYCE: a photograph on every card, no lettering.
      if (cfg.photosOnly && cfg.photos.length) return photoFace(cfg.photos[kind % cfg.photos.length]);
      if (kind === 0) {
        const glyph = glyphAt(t, cfg.glyphs);
        return [`g${glyph}`, (ctx) => paintGlyph(ctx, glyph)];
      }
      if (kind === 1) {
        const y = cfg.yellow;
        return [`y${y.bg}|${y.mark}|${y.title}|${y.brand}`, (ctx) => paintYellow(ctx, y)];
      }
      if (kind % 2 === 0) {
        const list = cfg.photos.length ? cfg.photos : [''];
        return photoFace(list[(kind / 2 - 1) % list.length]);
      }
      const solid = cfg.solids[(kind - 3) / 2];
      if (!solid) return [`s-`, (ctx) => paintPhoto(ctx, null)];
      return [`s${JSON.stringify(solid)}`, (ctx) => paintSolid(ctx, solid)];
    }

    function paintFaces(t) {
      let ready = true;
      faces.forEach((face, kind) => {
        if (!fontsReady) { ready = false; return; }
        const next = faceOf(kind, t);
        if (!next) { ready = ready && face.ready; return; }
        const [key, paint] = next;
        const fullKey = `${texScale}|${key}`;
        if (fullKey === face.key) return;
        const { ctx } = face;
        ctx.setTransform(texScale, 0, 0, texScale, 0, 0);
        ctx.clearRect(0, 0, CARD_W, CARD_H);
        paint(ctx);
        // A picture served without CORS taints the canvas; fall back to a plain face.
        try { ctx.getImageData(0, 0, 1, 1); } catch {
          face.canvas.width = face.canvas.width;
          ctx.setTransform(texScale, 0, 0, texScale, 0, 0);
          paintPhoto(ctx, null);
        }
        face.texture.needsUpdate = true;
        face.key = fullKey;
        face.ready = true;
      });
      return ready && faces.every((face) => face.ready);
    }

    function setTexScale(next) {
      if (next === texScale) return;
      texScale = next;
      faces.forEach((face) => {
        face.canvas.width = CARD_W * texScale;
        face.canvas.height = CARD_H * texScale;
        face.texture.dispose();
        face.texture = makeTexture(face.canvas);
        face.key = null;
      });
      for (const card of cards) card.material.uniforms.map.value = faces[card.kind].texture;
    }

    // Layout
    let L = layoutFor(1, 1);
    let dpr = 1;
    let scale = 1;
    let slowFrames = 0;
    function resize() {
      const W = Math.max(1, root.clientWidth);
      const H = Math.max(1, root.clientHeight);
      L = layoutFor(W, H);
      dpr = Math.min(window.devicePixelRatio || 1, 2) * scale;
      renderer.setPixelRatio(dpr);
      renderer.setSize(W, H, false);
      const bw = Math.max(1, Math.round(W * dpr));
      const bh = Math.max(1, Math.round(H * dpr));
      target.setSize(bw, bh);
      maskTarget.setSize(bw, bh);
      camera.aspect = L.SW / L.SH;
      camera.far = L.camZ * 3;
      camera.position.set(0, 0, L.camZ);
      camera.updateProjectionMatrix();
      const px = L.unit * dpr;
      const pu = post.material.uniforms;
      pu.resolution.value.set(bw, bh);
      pu.centre.value.set(L.cx * px, (L.SH - L.cy) * px);
      setTexScale(Math.min(3, Math.max(1, Math.ceil(L.unit * dpr * 1.60001))));
      cards.forEach((card, i) => { if (i >= L.n) card.mesh.visible = false; });
      applyOptics();
      invalidate();
    }
    function applyOptics() {
      const g = Math.max(0, Number(cfg.glass) || 0);
      const px = L.unit * dpr;
      post.material.uniforms.strength.value = 0.0500001 * 960 * px * g;
      post.material.uniforms.haze.value = 0.14 * 960 * px * g * Math.max(0, Number(cfg.haze) || 0);
      for (const card of cards) {
        const u = card.material.uniforms;
        u.uSmear.value = 0.319999 * g;
        u.uSheen.value = 0.319999 * Math.min(1, g);
        u.uCamZ.value = L.camZ;
      }
    }
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(root);
    window.addEventListener('resize', resize);

    // Render
    const order = [];
    function render(t) {
      const ready = paintFaces(t);
      if (!ready) return false;
      const d = travelled(t);
      order.length = 0;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (i >= L.n) { card.mesh.visible = false; continue; }
        const p = wrapN(i + BASE - d, L.n);
        const u = card.material.uniforms;
        const x = L.cx + STEP.x * p;
        const y = L.cy + STEP.y * p;
        u.uCentre.value.set(x - L.SW / 2, -(y - L.SH / 2));
        u.uAngle.value = -(DEG_PER_SLOT * p * Math.PI) / 180;
        const e = exitOf(p, L);
        u.uExit.value = e;
        u.uBack.value.copy(p >= 0 ? OUT_NEG : OUT_POS);
        const flare = flareOf(p, L, cfg);
        u.uStretch.value = flare.stretch;
        u.uFan.value = flare.fan;
        u.uLift.value = flare.lift;
        card.mesh.visible = e < 0.999001;
        order.push([p, card]);
      }
      order.sort((a, b) => a[0] - b[0]).forEach(([, card], i) => {
        card.mesh.renderOrder = i;
        card.material.uniforms.uLayer.value = i * 0.400001;
      });

      for (const card of cards) card.material.uniforms.uMaskPass.value = 1;
      renderer.setRenderTarget(maskTarget);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
      renderer.render(world, camera);
      for (const card of cards) card.material.uniforms.uMaskPass.value = 0;
      renderer.setClearColor(0x000000, 0);
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(world, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCamera);
      if (!root.hasAttribute('data-ge-ready')) root.setAttribute('data-ge-ready', '');
      return true;
    }

    let frame = 0;
    let last = 0;
    let started = false;
    function tick(now) {
      frame = 0;
      if (disposed) return;
      const gap = last ? now - last : 1000 / 60;
      last = now;
      const moving = running();
      if (moving && started) {
        clock += (Math.min(gap, 100) / 1000) * Math.min(2, Math.max(0, Number(cfg.speed) || 0));
        if (scale === 1) {
          slowFrames = countSlowFrames(slowFrames, gap);
          if (slowFrames >= SLOW_FRAMES) {
            scale = SLOW_SCALE;
            resize();
          }
        }
      }
      const drawn = onScreen ? render(reducedMotion ? REST_START : clock) : true;
      if (drawn && onScreen) started = true;
      if ((moving || !drawn) && !disposed) frame = requestAnimationFrame(tick);
      else last = 0;
    }
    function invalidate() {
      if (!frame && !disposed) frame = requestAnimationFrame(tick);
    }

    const lost = (e) => { e.preventDefault(); cancelAnimationFrame(frame); frame = 0; };
    const restored = () => {
      for (const face of faces) face.texture.needsUpdate = true;
      invalidate();
    };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);

    resize();

    return {
      invalidate,
      renderNow: () => render(reducedMotion ? REST_START : clock),
      update() {
        if (cfg.fontUrl) registerFont(cfg.fontUrl);
        applyOptics();
        invalidate();
      },
      destroy() {
        cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        window.removeEventListener('resize', resize);
        canvas.removeEventListener('webglcontextlost', lost);
        canvas.removeEventListener('webglcontextrestored', restored);
        for (const card of cards) {
          world.remove(card.mesh);
          card.material.dispose();
        }
        geometry.dispose();
        for (const face of faces) face.texture.dispose();
        post.geometry.dispose();
        post.material.dispose();
        target.dispose();
        maskTarget.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      }
    };
  }

  syncToggle();
  import('three')
    .then((THREE) => {
      if (disposed) return;
      scene = createScene(THREE);
    })
    .catch(fail);

  return {
    setConfig(next) {
      if (disposed) return;
      cfg = { ...ENGINE_DEFAULTS, ...next };
      syncToggle();
      scene?.update();
    },
    setTime(seconds) {
      if (disposed || !Number.isFinite(seconds)) return;
      clock = Math.max(0, seconds);
      scene?.invalidate();
    },
    get time() { return clock; },
    get paused() { return paused; },
    setPaused,
    destroy() {
      disposed = true;
      cleanups.forEach((cleanup) => cleanup());
      cleanups.length = 0;
      scene?.destroy();
      scene = null;
      root.removeAttribute('data-ge-ready');
    }
  };
}

type GlassExitCarouselProps = {
  /** Card photos (CORS-enabled URLs, portrait 292:372 works best). */
  photos: string[];
  label?: string;
  speed?: number;
  className?: string;
};

/** Diagonal conveyor of photo cards that smear through glass as they leave the frame. */
export function GlassExitCarousel({ photos, label = "Photo cards", speed = 1, className = "" }: GlassExitCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!document.querySelector("style[data-glass-exit-carousel]")) {
      const tag = document.createElement("style");
      tag.setAttribute("data-glass-exit-carousel", "");
      tag.textContent = CSS;
      document.head.append(tag);
    }
    const carousel = buildGlassExitCarousel(rootRef.current, {
      photos, photosOnly: true, speed, playing: true, glass: 1, flare: 1, haze: 1, fontUrl: "", preview: false,
    });
    return () => carousel?.destroy();
  }, [photos, speed]);

  const vars = { "--ge-width": "100%", "--ge-height": "100%", "--ge-radius": "0px", "--ge-bg": "transparent", "--ge-ink": "#f3f0e8" } as CSSProperties;

  return (
    <div className={className} data-own-motion="">
      <div className="ge-host">
        <div className="ge-frame" style={vars}>
          <div ref={rootRef} className="ge-root" tabIndex={0} role="region" aria-roledescription="carousel" aria-label={label}>
            <div className="ge-gl" aria-hidden="true" />
            <img className="ge-still" src={photos[0]} alt="" draggable={false} decoding="async" />
            <div className="ge-shade" aria-hidden="true" />
            <button type="button" className="ge-toggle" aria-pressed="false" aria-label="Pause animation">
              <svg className="ge-pause" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9M11 3.5v9" /></svg>
              <svg className="ge-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5l8 4.5-8 4.5z" /></svg>
            </button>
            <ol className="ge-sr">{photos.map((_, i) => <li key={i}>Photo {i + 1}</li>)}</ol>
            <div className="ge-live" aria-live="polite" />
          </div>
        </div>
      </div>
    </div>
  );
}
