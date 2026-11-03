"use client";

// Animated Gallery blocks (after youcefbnm/animated-gallery on 21st.dev), rebuilt with
// motion/react: a tall scroll container whose sticky stage holds a 3-column photo wall
// that stands up from a steep perspective tilt and whose columns then drift at their
// own rates.

import { motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { createContext, useContext, useRef, type ReactNode } from "react";

const ScrollContext = createContext<{ progress: MotionValue<number> | null; still: boolean }>({ progress: null, still: false });

/** Tall scroll track; shares its scroll progress with the gallery inside. */
export function ContainerScroll({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <ScrollContext.Provider value={{ progress: scrollYProgress, still }}>
      <div ref={ref} className={still ? "" : className}>
        {children}
      </div>
    </ScrollContext.Provider>
  );
}

/** Pins its content to the viewport while the track scrolls past. */
export function ContainerSticky({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { still } = useContext(ScrollContext);
  return <div className={`${still ? "" : "sticky top-0"} overflow-hidden ${className}`}>{children}</div>;
}

/** The photo wall: starts lying back at a steep angle and stands upright with scroll. */
export function GalleryContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { progress, still } = useContext(ScrollContext);
  const idle = useMotionValue(1); // outside a ContainerScroll the wall just sits upright
  const p = progress ?? idle;
  const rotateX = useTransform(p, [0, 0.5], [75, 0]);
  const scale = useTransform(p, [0.5, 0.9], [1.2, 1]);
  return (
    <div className="relative flex h-full w-full items-center justify-center [perspective:1000px]">
      <motion.div
        className={`grid w-full max-w-6xl grid-cols-3 gap-2 px-3 md:gap-4 md:px-6 ${className}`}
        style={still ? undefined : { rotateX, scale, transformOrigin: "50% 50%" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** One overlay line: rises and un-blurs over [from, to] of the track's scroll. */
function OverlayLine({ p, from, to, children }: { p: MotionValue<number>; from: number; to: number; children: ReactNode }) {
  // Function transforms keep these on Motion's JS path (keyframe opacity gets handed to the
  // native scroll timeline, which can stick at its first frame).
  const t = useTransform(p, (v) => clamp01((v - from) / (to - from)));
  const opacity = useTransform(t, (v) => v);
  const y = useTransform(t, (v) => `${(1 - v) * 0.6}em`);
  const filter = useTransform(t, (v) => `blur(${(1 - v) * 10}px)`);
  return <motion.div style={{ opacity, y, filter }}>{children}</motion.div>;
}

/**
 * Heading that appears over the wall once it has stood up and its columns start drifting
 * (the second half of the track). Lines enter one after another; a dark wash behind them
 * keeps the type readable over the photos. Scroll-linked, so it plays back in reverse.
 */
export function GalleryOverlay({ lines, start = 0.55, className = "" }: { lines: ReactNode[]; start?: number; className?: string }) {
  const { progress, still } = useContext(ScrollContext);
  const idle = useMotionValue(1);
  const p = progress ?? idle;
  const wash = useTransform(p, (v) => clamp01((v - start + 0.04) / 0.12));
  if (still) {
    return (
      <div className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(8,9,9,.85),rgba(8,9,9,.35)_70%)] text-center ${className}`}>
        {lines}
      </div>
    );
  }
  return (
    <div className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center text-center ${className}`}>
      <motion.div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,9,9,.88),rgba(8,9,9,.45)_55%,rgba(8,9,9,.15))]" style={{ opacity: wash }} />
      <div className="relative">
        {lines.map((line, i) => (
          <OverlayLine key={i} p={p} from={start + i * 0.05} to={start + i * 0.05 + 0.12}>
            {line}
          </OverlayLine>
        ))}
      </div>
    </div>
  );
}

/** One column of the wall; drifts through `yRange` over the second half of the scroll. */
export function GalleryCol({ children, className = "", yRange = ["0%", "0%"] }: { children: ReactNode; className?: string; yRange?: [string, string] }) {
  const { progress, still } = useContext(ScrollContext);
  const idle = useMotionValue(1);
  const p = progress ?? idle;
  const y = useTransform(p, [0.5, 1], yRange);
  return (
    <motion.div className={`flex w-full flex-col gap-2 md:gap-4 ${className}`} style={still ? undefined : { y }}>
      {children}
    </motion.div>
  );
}
