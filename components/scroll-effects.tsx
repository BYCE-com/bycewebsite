"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Fragment, useRef } from "react";

/** One phrase of a ScrollWords heading; every word in it gets `className` (weight, colour). */
export type WordSegment = { text: string; className?: string; /** Start this phrase on a new line. */ newLine?: boolean };

/**
 * A heading whose words rise one by one out of a clip as it comes into view, then
 * brighten one after another as it scrolls through the viewport. The heading is given
 * as phrases so each can carry its own weight or colour.
 */
export function ScrollWords({
  segments,
  className = "",
  offset = ["start 85%", "end 40%"],
}: {
  segments: readonly WordSegment[];
  className?: string;
  /** Scroll range over which the words brighten (Motion `useScroll` offsets). */
  offset?: [string, string];
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.4 });
  // @ts-expect-error Motion types offsets as template literals; plain strings are fine at runtime.
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const words = segments.flatMap((segment, si) =>
    segment.text.split(" ").map((word, wi) => ({ word, className: segment.className ?? "", lineBreak: si > 0 && wi === 0 && !!segment.newLine })),
  );
  return (
    <h2 ref={ref} className={className} aria-label={segments.map((s) => s.text).join(" ")} data-own-motion="">
      {words.map(({ word, className: wordClass, lineBreak }, i) => (
        <Fragment key={i}>
          {lineBreak && <br />}
          <span>
            <Word progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} still={!!reduce} shown={inView} index={i} className={wordClass}>
              {word}
            </Word>
            {i < words.length - 1 ? " " : ""}
          </span>
        </Fragment>
      ))}
    </h2>
  );
}

function Word({ progress, range, still, shown, index, className, children }: { progress: MotionValue<number>; range: [number, number]; still: boolean; shown: boolean; index: number; className: string; children: string }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    // Clipped with clip-path rather than overflow, so the box keeps its text baseline. The
    // clip reaches past the glyphs on every side, so the italic lean and the settled word
    // are never cut.
    <span aria-hidden="true" className={`inline-block align-baseline [clip-path:inset(-.4em_-.2em_-.3em_-.2em)] ${className}`}>
      <motion.span
        className="inline-block"
        style={still ? undefined : { opacity }}
        initial={still ? false : { y: "150%", rotate: 6, filter: "blur(6px)" }}
        animate={shown || still ? { y: "0%", rotate: 0, filter: "blur(0px)" } : undefined}
        transition={{ duration: 0.9, ease: settle, delay: index * 0.06 }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Easing shared with the rest of the site (fast start, long settle). */
export const settle = [0.16, 1, 0.3, 1] as const;
