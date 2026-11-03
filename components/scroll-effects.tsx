"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

/**
 * A heading whose words rise one by one out of a clip as it comes into view, then
 * brighten one after another as it scrolls through the viewport.
 */
export function ScrollWords({
  text,
  className = "",
  offset = ["start 85%", "end 40%"],
}: {
  text: string;
  className?: string;
  /** Scroll range over which the words brighten (Motion `useScroll` offsets). */
  offset?: [string, string];
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.4 });
  // @ts-expect-error Motion types offsets as template literals; plain strings are fine at runtime.
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const words = text.split(" ");
  return (
    <h2 ref={ref} className={className} aria-label={text} data-own-motion="">
      {words.map((word, i) => (
        <span key={i}>
          <Word progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} still={!!reduce} shown={inView} index={i}>
            {word}
          </Word>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </h2>
  );
}

function Word({ progress, range, still, shown, index, children }: { progress: MotionValue<number>; range: [number, number]; still: boolean; shown: boolean; index: number; children: string }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    // The clip box is padded so the rising glyphs aren't cut while settled.
    <span aria-hidden="true" className="-my-[.12em] inline-block overflow-hidden py-[.12em] align-bottom">
      <motion.span
        className="inline-block"
        style={still ? undefined : { opacity }}
        initial={still ? false : { y: "110%", rotate: 6, filter: "blur(6px)" }}
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
