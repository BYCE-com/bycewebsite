"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";

type RefractedTextProps = {
  /** Each entry renders on its own line. */
  lines: readonly string[];
  /** Optional classes per line, e.g. a different face or size for one line. */
  lineClassNames?: readonly string[];
  className?: string;
  /** Seconds for the opening sweep of the beam across the word. */
  openDuration?: number;
  /** Where the beam settles after the opening sweep, in % along the beam axis. */
  rest?: number;
  /** How much the beam jumps between neighbouring glass letters, in %. */
  refraction?: number;
};

const hash = (i: number) => {
  const v = Math.sin(i * 12.9898 + 1.7) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * Glass letters lit by a dispersed light beam. Letters lift into place when the heading
 * scrolls into view, then the beam sweeps across and keeps drifting; the pointer pulls
 * the beam toward it and bends it through nearby letters.
 */
function RefractedTextImpl({ lines, lineClassNames, className = "", openDuration = 5.5, rest = 62, refraction = 8 }: RefractedTextProps) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const glyphs = Array.from(root.querySelectorAll<HTMLElement>(".refract__glyph"));
    const seeds = glyphs.map((_, i) => hash(i));
    const box = { left: 0, w: 1, h: 1 };
    let centers: number[] = glyphs.map(() => 0.5);

    // Every glyph paints a slice of one shared background, so the beam reads as a
    // single sheet of light across all lines. Offsets ignore transforms, so this
    // stays valid while letters are lifting.
    const measure = () => {
      if (!glyphs.length) return;
      const rects = glyphs.map((g) => ({ l: g.offsetLeft, t: g.offsetTop, w: g.offsetWidth, h: g.offsetHeight }));
      const minL = Math.min(...rects.map((r) => r.l));
      const minT = Math.min(...rects.map((r) => r.t));
      box.left = minL;
      box.w = Math.max(1, Math.max(...rects.map((r) => r.l + r.w)) - minL);
      box.h = Math.max(1, Math.max(...rects.map((r) => r.t + r.h)) - minT);
      root.style.setProperty("--hw", `${box.w}px`);
      root.style.setProperty("--hh", `${box.h}px`);
      glyphs.forEach((g, i) => {
        g.style.setProperty("--gx", `${rects[i].l - minL}px`);
        g.style.setProperty("--gy", `${rects[i].t - minT}px`);
      });
      centers = rects.map((r) => (r.l - minL + r.w / 2) / box.w);
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    const resize = new ResizeObserver(measure);
    resize.observe(root);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.setProperty("--beam", String(rest));
      root.style.setProperty("--angle", "110deg");
      glyphs.forEach((g, i) => g.style.setProperty("--r", ((seeds[i] - 0.5) * refraction).toFixed(2)));
      setLifted(true);
      return () => resize.disconnect();
    }

    const pointer = { x: 0.5, target: 0.5, influence: 0, want: 0 };
    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointer.target = (event.clientX - rect.left - box.left) / box.w;
      pointer.want = 1;
    };
    const onLeave = () => {
      pointer.want = 0;
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let last = 0;
    let t0 = 0;
    let started = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      const t = (now - t0) / 1000;
      const k = Math.min(t / openDuration, 1);
      const open = 1 - Math.pow(1 - k, 4); // fast start, long settle

      const angle = 98 + 14 * open + 3 * Math.sin(t * 0.27) * open;
      const drift = (7 * Math.sin(t * 0.31) + 3 * Math.sin(t * 0.77 + 1.3)) * open;
      let beam = -30 + (rest + 30) * open + drift;

      // Smoothed pointer, eased in quickly and out slowly.
      pointer.x += (pointer.target - pointer.x) * (1 - Math.exp(-dt * 7));
      const rate = pointer.want > pointer.influence ? 6 : 3;
      pointer.influence += (pointer.want - pointer.influence) * (1 - Math.exp(-dt * rate));

      // Convert the pointer's x into a position along the angled gradient axis.
      const a = (angle * Math.PI) / 180;
      const axis = Math.abs(box.w * Math.sin(a)) + Math.abs(box.h * Math.cos(a));
      const aimed = 50 + (((pointer.x - 0.5) * box.w * Math.sin(a)) / axis) * 100;
      beam += (aimed - beam) * pointer.influence * 0.9;

      root.style.setProperty("--beam", beam.toFixed(2));
      root.style.setProperty("--angle", `${angle.toFixed(2)}deg`);
      glyphs.forEach((g, i) => {
        const d = centers[i] - pointer.x;
        const lens = pointer.influence * 70 * d * Math.exp(-(d * d) / 0.02);
        g.style.setProperty("--r", ((seeds[i] - 0.5) * refraction * open + lens).toFixed(2));
      });
    };

    const play = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // Lift and start the beam the first time the heading is mostly on screen;
    // only animate while it is visible.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return pause();
        if (!started && entry.intersectionRatio >= 0.35) {
          started = true;
          t0 = performance.now();
          setLifted(true);
        }
        if (started) play();
      },
      { threshold: [0, 0.35] },
    );
    visibility.observe(root);

    return () => {
      pause();
      visibility.disconnect();
      resize.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [openDuration, rest, refraction]);

  let index = 0;
  return (
    <h2 ref={rootRef} className={`refract ${className}`} aria-label={lines.join(" ")} data-lifted={lifted} data-own-motion="">
      {lines.map((line, li) => (
        <span className={`refract__line ${lineClassNames?.[li] ?? ""}`} aria-hidden="true" key={li}>
          {Array.from(line).map((ch, ci) => (
            <span className="refract__glyph" key={ci} style={{ "--i": index++ } as CSSProperties}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
      ))}
    </h2>
  );
}

export const RefractedText = memo(RefractedTextImpl);
