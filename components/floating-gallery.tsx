// Floating Gallery — Originkit
// Adapted for BYCE: no 1200×800 minimum, vertical touch scrolling allowed, the loop
// idles while off screen, and an optional `boost` value (e.g. scroll velocity) scales
// the drift each frame.
"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

type Motion = {
  type?: "spring" | "tween" | "keyframes" | "inertia";
  duration?: number;
  ease?: [number, number, number, number];
  delay?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  bounce?: number;
  restSpeed?: number;
  restDelta?: number;
};

interface GalleryImage {
  src?: string;
  alt?: string;
  link?: string;
}

interface Props {
  images: GalleryImage[];
  background?: string;
  cardWidth?: number; // px, the reference card (LAYOUT slot 1)
  cardHeight?: number; // px, the reference card (LAYOUT slot 1)
  rounded?: number; // percent of the max radius
  speed?: number; // 0-100, 50 = 40 px/sec
  fade?: number; // percent of the half-height over which edges fade
  /** Live drift multiplier read every frame (1 = normal; negative drifts upward). */
  boost?: { get(): number };
  /**
   * Live scroll value read every frame: -1 = nothing on screen yet, 0 = the collage as normal,
   * 1 = gone again. In between, cards appear (or vanish) out of thin air one by one, in
   * place. Clicks wait for 0.
   */
  scatter?: { get(): number };
  transition?: Motion;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_CARD_W = 220;
const DEFAULT_CARD_H = 280;
/** 50 on the Speed dial reproduces the drift the gallery shipped with. */
const SPEED_REF = 40; // px/sec
/** A picked card travels to the centre and zooms up to this, capped to fit the frame. */
const ZOOM = 1.6;
const ZOOM_FIT = 0.9;

type Particle = { x: number; y: number; dx: number; dy: number; z: number; targetZ: number; w: number; h: number; mult: number };

/** deterministic 0..1 from an index — no Math.random, so SSR and client agree */
const ease = (t: number) => t * t * (3 - 2 * t);

function hash01(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** The collage: card i takes LAYOUT[i % LAYOUT.length]; x/y are percent of the container. */
const LAYOUT: ReadonlyArray<{ w: number; h: number; x: number; y: number }> = [
  { w: 220, h: 280, x: 12, y: 10 },
  { w: 260, h: 200, x: 42, y: 35 },
  { w: 200, h: 260, x: 74, y: 8 },
  { w: 240, h: 240, x: 26, y: 62 },
  { w: 220, h: 300, x: 60, y: 74 },
  { w: 180, h: 220, x: 88, y: 48 },
];

/** Rounded corners as a clip-path; 100 is a true circle at any aspect. */
function roundedClip(w: number, h: number, pct: number): string {
  const t = Math.max(0, Math.min(100, pct)) / 100;
  const short = Math.min(w, h);
  const insetX = (t * (w - short)) / 2;
  const insetY = (t * (h - short)) / 2;
  return `inset(${insetY}px ${insetX}px round ${(t * short) / 2}px)`;
}

const DEFAULT_TRANSITION: Motion = { type: "tween", duration: 0.25, ease: [0, 0, 0.58, 1] };

export function FloatingGallery({
  images,
  background = "#0b0b0d",
  cardWidth = DEFAULT_CARD_W,
  cardHeight = DEFAULT_CARD_H,
  rounded = 16,
  speed = 50,
  fade = 0,
  boost,
  scatter,
  transition = DEFAULT_TRANSITION,
  className = "",
  style,
}: Props) {
  const slotSX = Math.max(1, cardWidth) / DEFAULT_CARD_W;
  const slotSY = Math.max(1, cardHeight) / DEFAULT_CARD_H;

  const rootRef = useRef<HTMLDivElement>(null);
  const partsRef = useRef<Particle[]>([]);
  // DOM nodes live in their own ref: ref callbacks run before the seeding effect.
  const nodesRef = useRef<Array<HTMLDivElement | null>>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const visibleRef = useRef(true);
  /** Restarts the frame loop; set by the loop effect, called when the gallery scrolls back in. */
  const wakeRef = useRef<() => void>(() => {});
  /** Puts an open card back; called from the frame loop when the collage starts to scatter. */
  const closeRef = useRef<() => void>(() => {});
  const [zoomed, setZoomed] = useState<number | null>(null);
  const transitionRef = useRef(transition);
  transitionRef.current = transition;
  const zoomAnims = useRef<Array<{ stop: () => void } | null>>([]);
  const zoomedRef = useRef<number | null>(null);
  zoomedRef.current = zoomed;
  closeRef.current = () => setZoomed(null);
  // Live prop mirror, read inside the loop so prop changes never restart it.
  const cfgRef = useRef({ speed, fade, boost, scatter });
  cfgRef.current = { speed, fade, boost, scatter };

  const count = images.length;

  /** (re)seed particles whenever the layout inputs or container size change */
  const seed = useCallback(() => {
    const { w: W, h: H } = sizeRef.current;
    if (!W || !H) return;
    partsRef.current = Array.from({ length: count }, (_, i) => {
      const slot = LAYOUT[i % LAYOUT.length];
      const w = slot.w * slotSX;
      const h = slot.h * slotSY;
      const prev = partsRef.current[i];
      // Cards past the first six get their own vertical slot so they don't stack.
      const lap = Math.floor(i / LAYOUT.length);
      return {
        x: (slot.x / 100) * W - w / 2,
        y: prev ? prev.y : (((slot.y + lap * 47) % 100) / 100) * H - h / 2,
        dx: prev ? prev.dx : 0,
        dy: prev ? prev.dy : 0,
        z: prev ? prev.z : 0,
        targetZ: prev ? prev.targetZ : 0,
        w,
        h,
        mult: 0.65 + hash01(i) * 0.7, // 0.65x .. 1.35x
      };
    });
  }, [count, slotSX, slotSY]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      sizeRef.current = { w: root.offsetWidth, h: root.offsetHeight };
      seed();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) wakeRef.current();
    });
    io.observe(root);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [seed]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tick = (now: number) => {
      // Off screen: let the loop stop entirely; the visibility observer wakes it.
      if (!visibleRef.current) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
      // clamp dt: a backgrounded tab returns a huge delta and teleports everything
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const { w: W, h: H } = sizeRef.current;
      if (!W || !H) return;

      const cfg = cfgRef.current;
      const b = cfg.boost ? cfg.boost.get() : 1;
      // How far towards "not there" the collage is (0 in place, 1 gone).
      const sv = cfg.scatter ? cfg.scatter.get() : 0;
      const sk = Math.min(1, Math.abs(sv));
      const drift = reduce ? 0 : (Math.max(0, cfg.speed) / 50) * SPEED_REF * b;
      const fadePx = (Math.max(0, Math.min(100, cfg.fade)) / 100) * (H / 2);
      const zi = zoomedRef.current;
      const kOut = 1 - Math.exp(-8 * dt);
      // An open card goes back once the collage starts to scatter.
      if (zi !== null && sk > 0.05) closeRef.current();

      for (let i = 0; i < partsRef.current.length; i++) {
        const a = partsRef.current[i];
        const node = nodesRef.current[i];
        if (!node) continue;
        const frozen = zi === i;

        if (!frozen) {
          a.y += drift * a.mult * dt;
          // seamless wrap both ways (the boost can run the drift upward)
          const span = H + a.h;
          if (a.y > H) a.y -= span;
          else if (a.y < -a.h) a.y += span;
        }

        // Cursor repulsion ships disabled (force 0); offsets just settle to zero.
        a.dx += (0 - a.dx) * kOut;
        a.dy += (0 - a.dy) * kOut;

        // Picking a card is a state change, so the transition owns the travel.
        const targetZ = frozen ? 1 : 0;
        if (a.targetZ !== targetZ) {
          a.targetZ = targetZ;
          zoomAnims.current[i]?.stop();
          const from = a.z;
          const delta = targetZ - from;
          zoomAnims.current[i] = animate(0, 1, {
            ...transitionRef.current,
            onUpdate: (t: number) => {
              a.z = from + delta * t;
            },
            onComplete: () => {
              zoomAnims.current[i] = null;
            },
          });
        }

        // A picked card travels to the centre as it grows; scale() is about its own centre.
        const baseX = a.x + a.dx;
        const baseY = a.y + a.dy;
        const z = a.z;
        const px = baseX + ((W - a.w) / 2 - baseX) * z;
        const py = baseY + ((H - a.h) / 2 - baseY) * z;
        const fit = Math.min(ZOOM, (W * ZOOM_FIT) / Math.max(1, a.w), (H * ZOOM_FIT) / Math.max(1, a.h));
        const s = 1 + (fit - 1) * z;

        // Thin air: each card has its own moment to appear (or vanish), so they come and go
        // one by one, in place — fading and growing as they rise the last few pixels.
        let shown = 1;
        if (sk > 0) {
          const at = hash01(i * 7 + (sv < 0 ? 1 : 2)) * 0.45; // this card's start in the window
          shown = ease(Math.max(0, Math.min(1, (1 - sk - at) / 0.55)));
        }
        const oy = (1 - shown) * 24;
        const ss = 0.6 + 0.4 * shown;

        node.style.transform =
          shown < 1
            ? `translate3d(${px}px, ${py + oy}px, 0) scale(${s * ss})`
            : `translate3d(${px}px, ${py}px, 0) scale(${s})`;
        node.style.zIndex = z > 0.001 ? "999" : "1";

        if (fadePx > 0) {
          const cy = py + a.h / 2;
          const edge = Math.min(cy, H - cy);
          const o = Math.max(0, Math.min(1, edge / fadePx));
          node.style.opacity = `${(o + (1 - o) * z) * shown}`;
        } else {
          node.style.opacity = `${shown}`;
        }
        // Nothing to click while a card isn't really there.
        node.style.visibility = shown < 0.02 ? "hidden" : "";
      }
    };

    wakeRef.current = () => {
      if (raf) return;
      last = performance.now(); // resume without a jump
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      wakeRef.current = () => {};
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={className}
      onClick={() => {
        if (zoomed !== null) setZoomed(null);
      }}
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background, isolation: "isolate", touchAction: "pan-y", ...style }}
    >
      {images.map((im, i) => {
        const slot = LAYOUT[i % LAYOUT.length];
        const w = slot.w * slotSX;
        const h = slot.h * slotSY;
        const isZoom = zoomed === i;
        const link = im.link || "";
        // Click zooms; clicking the open card follows its link; any click while one is open closes it.
        const activate = (e?: React.SyntheticEvent) => {
          e?.stopPropagation();
          // Cards only open while the collage is in place.
          if (scatter && scatter.get() !== 0 && zoomed === null) return;
          if (isZoom && link) {
            window.open(link, "_blank", "noopener");
            return;
          }
          if (zoomed !== null) {
            setZoomed(null);
            return;
          }
          setZoomed(i);
        };
        return (
          <div
            key={i}
            ref={(n) => {
              nodesRef.current[i] = n;
            }}
            onClick={activate}
            role="button"
            tabIndex={0}
            aria-pressed={isZoom}
            aria-label={im.alt ? `${isZoom ? "Close" : "Open"} photo: ${im.alt}` : `${isZoom ? "Close" : "Open"} photo ${i + 1}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                activate(e);
              }
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: w,
              height: h,
              clipPath: roundedClip(w, h, rounded),
              cursor: "pointer",
              userSelect: "none",
              background: "rgba(255,255,255,0.06)",
              filter: isZoom ? "drop-shadow(0 30px 40px rgba(0,0,0,0.55))" : "drop-shadow(0 10px 15px rgba(0,0,0,0.35))",
              willChange: "transform",
            }}
          >
            {im.src ? (
              <img src={im.src} alt="" draggable={false} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
