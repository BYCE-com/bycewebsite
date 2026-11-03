// Cinematic Orbit Hero (daiwiikharihar/cinematic-orbit-hero on 21st.dev).
// Adapted for BYCE: images and the centre copy are props, the light/dark palette is fixed
// to BYCE carbon and chalk, and the glow is lime instead of rose.
"use client";

import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type OrbitImage = { src: string; alt: string };

type OrbitCard = {
  item: OrbitImage;
  linearOffset: { x: number; y: number };
  linearRotate: number;
  target: { x: number; y: number; rotate: number; scale: number; w: number; h: number };
  targetSm: { x: number; y: number; rotate: number; scale: number; w: number; h: number };
  z: number;
};

// Cards spread evenly round a flattened ellipse; those at the bottom (y > 0) read as closer.
function generateOrbitCards(images: readonly OrbitImage[]): OrbitCard[] {
  const radiusX = 42; // wide X spread (vw)
  const radiusY = 15; // flattened Y spread for the 3D effect (vh)
  const total = images.length;

  return images.map((item, i) => {
    const angle = (i * (Math.PI * 2)) / total;
    const x = Math.cos(angle - Math.PI / 2) * radiusX;
    const y = Math.sin(angle - Math.PI / 2) * radiusY;
    // -1 at the back of the ellipse, 1 at the front
    const depthScale = Math.sin(angle - Math.PI / 2);
    const targetScale = 0.8 + depthScale * 0.25; // 0.55 .. 1.05
    // z-index follows depth so front cards overlap back cards
    const calculatedZIndex = Math.round((depthScale + 1) * 100);
    // a slight outward lean
    const rotate = Math.cos(angle - Math.PI / 2) * 15;

    return {
      item,
      linearOffset: { x: (i - total / 2) * 4, y: (i - total / 2) * 3 },
      linearRotate: (i - total / 2) * 3,
      target: { x, y: y + 8, rotate, scale: targetScale, w: 15, h: 22 }, // sits below the copy
      targetSm: { x: x * 0.7, y: y * 1.5 + 10, rotate, scale: targetScale, w: 32, h: 24 },
      z: calculatedZIndex,
    };
  });
}

// A heavier spring for a more cinematic, weighty feel.
const SPRING_CONFIG = { stiffness: 40, damping: 25, mass: 1 };
const PROGRESS_SPRING = { stiffness: 60, damping: 30, restDelta: 0.001 };

function usePointerParallax(active: boolean, enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  useEffect(() => {
    if (!enabled || !active) return;
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [active, enabled, rawX, rawY]);

  return { x, y };
}

type CardProps = {
  card: OrbitCard;
  progress: MotionValue<number>;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  isSpreadActive: boolean;
  isMobile: boolean;
};

function Card({ card, progress, pointer, isSpreadActive, isMobile }: CardProps) {
  const { item, linearOffset, linearRotate, z } = card;
  const activeTarget = isMobile ? card.targetSm : card.target;
  // Parallax is stronger for closer cards (higher z).
  const depthFactor = 0.2 + z / 200;

  const translate = useTransform([progress, pointer.x, pointer.y], ([p, px, py]: number[]) => {
    const easeP = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const tx = linearOffset.x + (activeTarget.x - linearOffset.x) * easeP;
    const ty = linearOffset.y + (activeTarget.y - linearOffset.y) * easeP;
    const dx = tx - px * 5 * depthFactor * p;
    const dy = ty - py * 5 * depthFactor * p;
    return `calc(-50% + ${dx}vw) calc(-50% + ${dy}vh)`;
  });

  const rotate = useTransform(progress, [0, 1], [linearRotate, activeTarget.rotate]);
  const scale = useTransform(progress, [0, 1], [0.6, activeTarget.scale]); // starts smaller for a bigger reveal

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 cursor-pointer will-change-transform"
      style={{ width: `${activeTarget.w}vw`, height: `${activeTarget.h}vh`, zIndex: z, translate, rotate, scale }}
      whileHover={isSpreadActive ? { scale: activeTarget.scale * 1.15, zIndex: 999, transition: SPRING_CONFIG } : undefined}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-xl shadow-black/40 ring-1 ring-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-black/80">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-white/10 opacity-70" />
        <img src={item.src} alt={item.alt} loading="lazy" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
      </div>
    </motion.div>
  );
}

type CinematicOrbitHeroProps = {
  images: readonly OrbitImage[];
  /** Copy shown in the centre as the cards spread. */
  children?: ReactNode;
  className?: string;
};

export default function CinematicOrbitHero({ images, children, className = "" }: CinematicOrbitHeroProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const cards = useMemo(() => generateOrbitCards(images), [images]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, PROGRESS_SPRING);
  const progress = useTransform(smoothProgress, [0.1, 0.9], [0, 1]);

  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => setSpread(p > 0.95));

  const pointer = usePointerParallax(spread, !reduce);
  const textScale = useTransform(progress, [0, 1], [0.85, 1]);
  const textOpacity = useTransform(progress, [0.2, 0.8], [0, 1]);

  return (
    // Pure black, stacked above the site-wide grid and spotlight overlays (z-20) so nothing tints it.
    <section ref={wrapRef} data-own-motion="" className={`relative z-[21] h-[350vh] w-full bg-black text-[#f3f0e8] ${className}`}>
      <div className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden">

        {/* BYCE: the copy sits above the orbit rather than mid-frame, where the back card covered it. */}
        <motion.div className="pointer-events-none z-[5] mt-[-62vh] flex flex-col items-center px-6 text-center md:mt-[-54vh]" style={{ opacity: textOpacity, scale: textScale }}>
          {children}
        </motion.div>

        <div className="absolute inset-0 z-10">
          {cards.map((card, i) => (
            <Card key={i} card={card} progress={progress} pointer={pointer} isSpreadActive={spread} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  );
}
