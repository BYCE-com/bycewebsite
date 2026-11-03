// Hover Image Reveal — Originkit, adapted to the BYCE method list.
// Hovering a row dims the others, rolls its title up to a lime copy, and reveals that
// row's photo beside the cursor; moving between rows slides the stacked photos up or
// down inside one clipped frame that follows the pointer on a spring.
"use client";

import { Plus } from "lucide-react";
import { motion, useMotionValue, useSpring, type Transition } from "motion/react";
import { useRef, useState } from "react";

export type MethodItem = { number: string; title: string; body: string; image: string; alt: string };

type MethodRevealProps = {
  items: readonly MethodItem[];
  imageWidth?: number;
  imageHeight?: number;
  /** Image centre relative to the pointer, in px. */
  offsetX?: number;
  offsetY?: number;
};

const SPRING: Transition = { type: "spring", stiffness: 400, damping: 40, mass: 1 };
const settle = [0.16, 1, 0.3, 1] as const;

export function MethodReveal({ items, imageWidth = 300, imageHeight = 400, offsetX = 200, offsetY = 0 }: MethodRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 60, damping: 28, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 60, damping: 28, mass: 0.5 });
  const anyActive = hovered !== null;

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(e.clientX - rect.left + offsetX);
    rawY.set(e.clientY - rect.top + offsetY);
  };

  return (
    <div ref={rootRef} className="relative" onPointerMove={onMove} onPointerLeave={() => setHovered(null)}>
      {/* One clipped frame that follows the pointer; each photo slides in from below or above. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-20 hidden overflow-hidden rounded-[14px] md:block"
        style={{ x, y, translateX: "-50%", translateY: "-50%", width: imageWidth, height: imageHeight }}
        initial={false}
        animate={{ opacity: anyActive ? 1 : 0, scale: anyActive ? 1 : 0.92 }}
        transition={SPRING}
      >
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            className="absolute inset-0"
            initial={false}
            animate={{ y: hovered === null ? "100%" : i < hovered ? "-100%" : i > hovered ? "100%" : "0%" }}
            transition={SPRING}
          >
            <img src={item.image} alt="" draggable={false} className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </motion.div>

      {items.map((item, i) => {
        const isHovered = hovered === i;
        const dim = anyActive && !isHovered;
        return (
          <motion.article
            key={item.title}
            data-own-motion=""
            onPointerEnter={(e) => e.pointerType !== "touch" && setHovered(i)}
            onClick={() => setHovered((h) => (h === i ? null : i))}
            initial={{ opacity: 0, x: -48 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, ease: settle, delay: i * 0.08 }}
            className="grid cursor-default items-center border-t border-white/15 py-7 md:grid-cols-12 md:py-10"
          >
            <span className={`text-xs font-bold transition-colors duration-300 md:col-span-2 ${dim ? "text-white/25" : "text-[#b8ee3e]"}`}>{item.number}</span>
            {/* Title rolls up to a lime copy of itself. */}
            <h3 className="relative mt-5 overflow-hidden py-[.06em] text-5xl font-black leading-[1] tracking-[-.045em] md:col-span-6 md:mt-0 md:text-7xl">
              <motion.span className="relative block" initial={false} animate={{ y: isHovered ? "-100%" : "0%" }} transition={SPRING}>
                <span className={`block transition-colors duration-300 ${dim ? "text-[#51565a]" : "text-[#f3f0e8]"}`}>{item.title}</span>
                <span aria-hidden="true" className="absolute left-0 top-full block text-[#b8ee3e]">{item.title}</span>
              </motion.span>
            </h3>
            <p className={`mt-4 max-w-48 text-sm transition-colors duration-300 md:col-span-3 md:mt-0 ${dim ? "text-white/25" : "text-white/55"}`}>{item.body}</p>
            <motion.span className={`mt-4 inline-flex md:mt-0 md:justify-self-end ${dim ? "text-white/30" : "text-[#f3f0e8]"}`} initial={false} animate={{ rotate: isHovered ? 45 : 0 }} transition={SPRING}>
              <Plus />
            </motion.span>
          </motion.article>
        );
      })}
    </div>
  );
}
