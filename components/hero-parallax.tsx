"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";

export type ParallaxItem = { title: string; image: string; alt: string };

type HeroParallaxProps = {
  /** 15 items fill three rows of five. */
  items: readonly ParallaxItem[];
  /** Header shown above the rows. */
  header: ReactNode;
};

const SPRING = { stiffness: 300, damping: 30, bounce: 100 };

/**
 * Hero Parallax (in the style of Aceternity's): a tall section whose three rows of cards
 * start tilted back in 3D and faded, then swing flat and fade up as you scroll, while the
 * rows slide sideways in alternating directions.
 */
export function HeroParallax({ items, header }: HeroParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rows = [items.slice(0, 5), items.slice(5, 10), items.slice(10, 15)];

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Springs on every value smooth out wheel steps (and keep these on Motion's JS path).
  const toRight = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), SPRING);
  const toLeft = useSpring(useTransform(scrollYProgress, [0, 1], [0, -1000]), SPRING);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), SPRING);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), SPRING);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), SPRING);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 500]), SPRING);

  return (
    <div
      ref={ref}
      data-own-motion=""
      className={`relative flex flex-col overflow-hidden antialiased [perspective:1000px] [transform-style:preserve-3d] ${reduce ? "py-24" : "h-[300vh] py-40"}`}
    >
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20 md:px-10 md:py-32">{header}</div>
      <motion.div style={reduce ? undefined : { rotateX, rotateZ, translateY, opacity }}>
        {rows.map((row, r) => (
          <div key={r} className={`mb-10 flex gap-8 md:mb-20 md:gap-20 ${r === 1 ? "flex-row" : "flex-row-reverse"}`}>
            {row.map((item) => (
              <Card key={item.title} item={item} x={r === 1 ? toLeft : toRight} still={!!reduce} />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function Card({ item, x, still }: { item: ParallaxItem; x: MotionValue<number>; still: boolean }) {
  return (
    <motion.div
      style={still ? undefined : { x }}
      whileHover={{ y: -20 }}
      className="group/card relative h-56 w-80 shrink-0 overflow-hidden rounded-[10px] md:h-96 md:w-[30rem]"
    >
      <img src={item.image} alt={item.alt} loading="lazy" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="pointer-events-none absolute inset-0 bg-[#080909] opacity-0 transition-opacity duration-300 group-hover/card:opacity-70" />
      <h3 className="pointer-events-none absolute bottom-5 left-5 text-2xl font-black uppercase tracking-[-.03em] text-[#f3f0e8] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 md:text-4xl">{item.title}</h3>
    </motion.div>
  );
}
