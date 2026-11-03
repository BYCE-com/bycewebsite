"use client";

import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { motion, useTransform, type MotionValue } from "motion/react";

export type FanGalleryItem = {
  src: string;
  alt: string;
  /** Small tag in the card's top-left corner, e.g. "PULL". */
  label: string;
  /** Display title printed on the card. */
  title: string;
  /** Sentence shown in the caption while the card is raised. */
  detail: string;
};

type FanGalleryProps = {
  items: readonly FanGalleryItem[];
  /** Distance between card centres, as a fraction of card width. */
  spacing?: number;
  /** How far the outermost cards drop, as a fraction of card height. */
  curve?: number;
  /** Rotation of the outermost cards, in degrees. */
  tilt?: number;
  /** How far the active card rises, in px. */
  lift?: number;
  /** How far neighbours move aside from the active card, in card widths. */
  spread?: number;
  /** Delay between rings of cards during the entrance, in ms. */
  stagger?: number;
  /**
   * Scroll-driven scatter (replaces the deal-out entrance when given): -1 = cards in a loose
   * pile, 0 = the fan exactly as at rest, 1 = cards distributed wide. Hover waits for 0.
   */
  scatter?: MotionValue<number>;
  className?: string;
};

const hash01 = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const ease = (t: number) => t * t * (3 - 2 * t);

/** Moves one card's visuals between the pile, the fan and the wide spread. */
function ScatterLayer({ scatter, i, restX, w, h, children }: { scatter: MotionValue<number>; i: number; restX: number; w: number; h: number; children: ReactNode }) {
  // Latest geometry, read inside the scroll transform.
  const geo = useRef({ restX, w, h });
  geo.current = { restX, w, h };
  const a = hash01(i * 3 + 1) * 2 - 1;
  const b = hash01(i * 3 + 2) * 2 - 1;
  const c = hash01(i * 3 + 3) * 2 - 1;
  const transform = useTransform(scatter, (sv) => {
    if (sv === 0) return "none";
    const { restX: rx, w: cw, h: ch } = geo.current;
    const k = ease(Math.min(1, Math.abs(sv)));
    let x, y, r, sc;
    if (sv < 0) {
      // A loose, overlapping pile towards the middle.
      x = (-rx * 0.78 + a * cw * 0.55) * k;
      y = (b * ch * 0.35 + ch * 0.08) * k;
      r = c * 16 * k;
      sc = 1 - 0.18 * k;
    } else {
      // Distributed wide: pushed outward, up and down, turned and resized.
      x = (rx * 0.9 + a * cw * 0.9) * k;
      y = b * ch * 0.95 * k;
      r = c * 26 * k;
      sc = 1 - (0.2 - Math.abs(a) * 0.12) * k;
    }
    return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${r.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
  });
  return (
    <motion.div className="absolute inset-0" style={{ transform }}>
      {children}
    </motion.div>
  );
}

/** The caption only reads while the cards sit in the fan. */
function CaptionFade({ scatter, children }: { scatter: MotionValue<number>; children: ReactNode }) {
  const opacity = useTransform(scatter, (sv) => 1 - Math.min(1, Math.abs(sv) * 1.6));
  return <motion.div style={{ opacity }}>{children}</motion.div>;
}

type Phase = "stacked" | "dealing" | "settled";

const ASPECT = 1.25; // card height / width
const DEAL_MS = 1000;
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const pad = (n: number) => String(n).padStart(2, "0");

/** Pick a card size and spacing that keeps the fan inside the container. */
function fitFan(width: number, count: number, spacing: number, spread: number) {
  if (width >= 640) {
    // Keep the spacing (it sets the hover gap) and shrink the cards instead, leaving
    // room on both sides for the hover spread to push the end cards into.
    const target = width < 1024 ? 200 : 250;
    const w = Math.min(target, width / (1 + (count - 1) * spacing + 0.3 + 2 * spread));
    return { w, h: w * ASPECT, s: spacing };
  }
  // Phones: tighten the spacing first, then shrink, and allow a slight bleed into the gutters.
  const room = width * 1.15;
  const footprint = (w: number, s: number) => w * (1 + (count - 1) * s + 0.3);
  let s = spacing;
  let w = 140;
  if (footprint(w, s) > room) {
    s = Math.max(0.36, (room / w - 1.3) / Math.max(count - 1, 1));
    if (footprint(w, s) > room) w = room / (1 + (count - 1) * s + 0.3);
  }
  return { w, h: w * ASPECT, s };
}

function FanGalleryImpl({
  items,
  spacing = 0.62,
  curve = 0.12,
  tilt = 13,
  lift = 40,
  spread = 0.55,
  stagger = 70,
  scatter,
  className = "",
}: FanGalleryProps) {
  const stageRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const pointerKind = useRef("mouse");
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("stacked");
  const [active, setActive] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(Math.floor((items.length - 1) / 2));

  const n = items.length;
  const mid = (n - 1) / 2;
  const { w, h, s } = fitFan(width || 1200, n, spacing, spread);
  const step = w * s;
  const tiltRad = (tilt * Math.PI) / 180;
  // Furthest a pushed card's centre may travel before its tilted corner leaves the stage
  // (plus a small bleed into the section gutter).
  const pushedTilt = ((tilt + 2.5) * Math.PI) / 180;
  const edge = Math.max(
    mid * step + w * 0.12,
    (width || 1200) / 2 - (w / 2) * Math.cos(pushedTilt) - w * ASPECT * Math.sin(pushedTilt) + 32,
  );
  const top = lift + h * 0.06 + 12;
  const stageHeight = top + h + curve * h + (w / 2) * Math.sin(tiltRad) + 20;

  // Measure the stage and refit on resize. Transitions switch on a frame later
  // so the first measurement doesn't animate.
  useIsoLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setWidth(stage.clientWidth);
    measure();
    const raf = requestAnimationFrame(() => setReady(true));
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  // Fan the deck out the first time it scrolls into view.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // With a scroll scatter the cards assemble from the pile instead of dealing out.
    if (scatter || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("settled");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setPhase("dealing");
      },
      { threshold: 0.45 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "dealing") return;
    const id = window.setTimeout(() => setPhase("settled"), DEAL_MS + Math.ceil(mid) * stagger);
    return () => window.clearTimeout(id);
  }, [phase, mid, stagger]);

  // A tap or click anywhere else lowers the raised card.
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      if (!stageRef.current?.contains(event.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  /**
   * Map a pointer x-position to the card whose visible strip is under it,
   * using resting geometry so cards moving on hover can't cause flicker.
   */
  const indexAt = (clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    const px = clientX - (rect.left + rect.width / 2);
    // Keep the raised card while the pointer is anywhere over its full width.
    if (active !== null && Math.abs(px - (active - mid) * step) <= w / 2) return active;
    const i =
      px < 0
        ? Math.min(Math.floor((px + w / 2) / step + mid), Math.floor(mid))
        : Math.max(Math.ceil((px - w / 2) / step + mid), Math.ceil(mid));
    return i >= 0 && i < n ? i : null;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLUListElement>) => {
    pointerKind.current = event.pointerType;
    if (event.pointerType === "touch" || phase !== "settled") return;
    // Cards aren't at their resting spots while scattered, so hover waits for the fan.
    if (scatter && scatter.get() !== 0) {
      if (active !== null) setActive(null);
      return;
    }
    setActive(indexAt(event.clientX));
  };

  const onPointerLeave = (event: ReactPointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== "touch") setActive(null);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    const current = active ?? focusIndex;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = Math.min(n - 1, current + 1);
    else if (event.key === "ArrowLeft") next = Math.max(0, current - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = n - 1;
    else if (event.key === "Escape") {
      setActive(null);
      (document.activeElement as HTMLElement | null)?.blur();
      return;
    }
    if (next === null) return;
    event.preventDefault();
    cardRefs.current[next]?.focus({ preventScroll: true });
  };

  const poseFor = (i: number) => {
    const t = i - mid;
    const u = mid === 0 ? 0 : t / mid;
    const z = n - Math.round(Math.abs(t));
    if (phase === "stacked") {
      // A slightly messy closed deck, with the centre card squared on top.
      const jitter = ((i * 5) % 7) - 3;
      return { x: jitter * 2, y: h * 0.08, r: t === 0 ? 0 : jitter * 1.4, sc: 0.9, z };
    }
    let x = t * step;
    let y = curve * h * u * u;
    let r = tilt * u;
    let sc = 1;
    let zi = z;
    if (active !== null) {
      if (i === active) {
        y -= lift;
        r *= 0.12;
        sc = 1.05;
        zi = n + 2;
      } else {
        const d = i - active;
        x += (Math.sign(d) * spread * w) / (1 + 0.3 * (Math.abs(d) - 1));
        x = Math.max(-edge, Math.min(edge, x));
        r += Math.sign(d) * 2.5;
      }
    }
    return { x, y, r, sc, z: zi };
  };

  const current = active === null ? null : items[active];

  return (
    <div className={className}>
      <ul
        ref={stageRef}
        className="fan-stage"
        aria-label="Photos of the BYCE training floor"
        data-phase={phase}
        data-ready={ready}
        data-engaged={active !== null}
        style={{ height: stageHeight }}
        onPointerDown={(event) => (pointerKind.current = event.pointerType)}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActive(null);
        }}
      >
        {items.map((item, i) => {
          const p = poseFor(i);
          const style = {
            width: w,
            height: h,
            left: `calc(50% - ${(w / 2).toFixed(2)}px)`,
            top,
            zIndex: p.z,
            transform: `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${p.r.toFixed(2)}deg) scale(${p.sc})`,
            transitionDelay: phase === "dealing" ? `${Math.round(Math.abs(i - mid)) * stagger}ms` : undefined,
            "--card-w": `${w.toFixed(2)}px`,
            "--i": i,
          } as CSSProperties;
          return (
            <li
              key={item.src}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="fan-card"
              data-active={active === i}
              data-side={i < mid ? "left" : i > mid ? "right" : "center"}
              tabIndex={i === (active ?? focusIndex) ? 0 : -1}
              aria-label={`${pad(i + 1)} of ${pad(n)}. ${item.title}. ${item.detail}`}
              style={style}
              onFocus={() => {
                setFocusIndex(i);
                setActive(i);
              }}
              onClick={() => {
                if (pointerKind.current === "touch" && phase === "settled") setActive(i);
              }}
            >
              {(() => {
                // The body bobs on its own animation so it never fights the fan pose above.
                const body = (
                  <div className="fan-card__body">
                    <img className="fan-card__img" src={item.src} alt={item.alt} loading="lazy" decoding="async" draggable={false} />
                    <div className="fan-card__shade" aria-hidden="true" />
                    <div className="fan-card__meta" aria-hidden="true">
                      <div>{item.label}</div>
                    </div>
                    <strong className="fan-card__title" aria-hidden="true">
                      {item.title}
                    </strong>
                  </div>
                );
                return scatter ? (
                  <ScatterLayer scatter={scatter} i={i} restX={(i - mid) * step} w={w} h={h}>
                    {body}
                  </ScatterLayer>
                ) : (
                  body
                );
              })()}
            </li>
          );
        })}
      </ul>

      {(() => {
        const caption = (
          <div className="fan-caption" aria-hidden="true">
            <div className="fan-caption__count">
              {active === null ? "--" : pad(active + 1)} / {pad(n)}
            </div>
            <div className="fan-caption__body" key={active ?? "idle"}>
              <strong>{current ? current.title : "RAISE A FRAME"}</strong>
              <div>{current ? current.detail : "Hover or tap a card to pull it from the fan. Arrow keys work too."}</div>
            </div>
          </div>
        );
        return scatter ? <CaptionFade scatter={scatter}>{caption}</CaptionFade> : caption;
      })()}
    </div>
  );
}

/** Memoised: the page re-renders on every scroll frame. */
export const FanGallery = memo(FanGalleryImpl);
