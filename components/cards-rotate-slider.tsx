// Built using Hyperiux Vault: https://vault.hyperiux.com (hyperiux/cards-rotate-slider on 21st.dev)
// Adapted for BYCE: background is a prop (carbon here), captions use the site's display type,
// and ScrollTrigger re-measures once images and fonts above have loaded.
"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// True when the user has asked the OS to minimise animation. Safe during render.
function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

// Reduced motion: a much larger perspective flattens the 3D rotation.
const REDUCED_PERSPECTIVE = "4800px";

const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 1025;

const MOBILE_STEP = 2;
const TABLET_STEP = 6;
const DESKTOP_STEP = 10;

const MOBILE_ROTATE_IN = -60;
const TABLET_ROTATE_IN = -80;
const DESKTOP_ROTATE_IN = -100;

const MOBILE_ROTATE_OUT = 50;
const TABLET_ROTATE_OUT = 65;
const DESKTOP_ROTATE_OUT = 80;

const ROTATE_X_NEGATIVE = 5;
const ROTATE_X_POSITIVE = -5;

// Reduced motion: cut the card rotation down a lot.
const ROTATION_REDUCTION_FACTOR = 0.15;

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface CardsRotateSliderImage {
  src?: string;
  text?: string;
}

export interface CardsRotateSliderProps {
  images: CardsRotateSliderImage[];
  /** Multiplier on the per-breakpoint rotateY entrance/exit strength. */
  rotationAmount?: number;
  /** Multiplier on the per-breakpoint vertical offset each card travels. */
  verticalDrift?: number;
  /** ScrollTrigger scrub on the main track — higher lags/smooths more. */
  scrollSmoothing?: number;
  /** 3D perspective distance in px — lower looks deeper. */
  perspective?: number;
  showCaptions?: boolean;
  textColor?: string;
  background?: string;
}

/**
 * A horizontally scroll-pinned track of cards that rotate in from one side, settle flat,
 * then rotate out the other — GSAP ScrollTrigger with a nested per-card timeline.
 */
export default function CardsRotateSlider({
  images,
  rotationAmount = 1,
  verticalDrift = 1,
  scrollSmoothing = 1,
  perspective = 1200,
  showCaptions = true,
  textColor = "#ffffff",
  background = "#ffffff",
}: CardsRotateSliderProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const wrappersRef = useRef<(HTMLDivElement | null)[]>([]);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    if (!outer || !track) return;

    const onResize = () => {
      const travel = track.scrollWidth - window.innerWidth;
      outer.style.height = `${travel + window.innerHeight}px`;
    };
    onResize();
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(track);
    window.addEventListener("resize", onResize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [images]);

  useIsomorphicLayoutEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    if (!outer || !track) return;

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const isTablet = window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT;

    const context = gsap.context(() => {
      const horizontalTween = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: outer,
          start: "top top",
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          scrub: reducedMotion ? true : scrollSmoothing,
          invalidateOnRefresh: true,
        },
      });

      cardsRef.current.forEach((card, index) => {
        const wrapper = wrappersRef.current[index];
        if (!card || !wrapper) return;

        const total = images.length;
        const mid = Math.floor(total / 2);
        const step = (isMobile ? MOBILE_STEP : isTablet ? TABLET_STEP : DESKTOP_STEP) * verticalDrift;
        const offset = index < mid ? -((mid - index) * step) : (index - mid + 1) * step;

        const rotationScale = reducedMotion ? ROTATION_REDUCTION_FACTOR : 1;
        const rotateXValue = (offset < 0 ? ROTATE_X_NEGATIVE : ROTATE_X_POSITIVE) * rotationScale;
        const rotateInValue = (isMobile ? MOBILE_ROTATE_IN : isTablet ? TABLET_ROTATE_IN : DESKTOP_ROTATE_IN) * rotationScale * rotationAmount;
        const rotateOutValue = (isMobile ? MOBILE_ROTATE_OUT : isTablet ? TABLET_ROTATE_OUT : DESKTOP_ROTATE_OUT) * rotationScale * rotationAmount;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapper,
            containerAnimation: horizontalTween,
            start: "left 100%",
            end: "right 0%",
            scrub: true,
          },
        });

        tl.fromTo(
          card,
          { rotateY: rotateInValue, rotateX: rotateXValue, opacity: 0.8, y: `${offset}vh` },
          { rotateY: 0, rotateX: 0, opacity: 1, y: 0, ease: "none" },
        ).to(card, { rotateY: rotateOutValue, opacity: 0.9, y: `${-offset}vh`, ease: "none" });
      });

      ScrollTrigger.refresh();
    });

    // BYCE: sections above change height as images and fonts arrive; re-measure the
    // trigger positions then so the pin starts exactly at this section.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh).catch(() => {});
    const late = window.setTimeout(refresh, 1500);

    return () => {
      window.removeEventListener("load", refresh);
      window.clearTimeout(late);
      context.revert();
    };
  }, [images, rotationAmount, verticalDrift, scrollSmoothing]);

  // overflowX "clip" (not "hidden") so it doesn't hijack the sticky track's containing block.
  return (
    <div ref={outerRef} className="relative" style={{ overflowX: "clip", background }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden" style={{ perspective: reducedMotion ? REDUCED_PERSPECTIVE : `${perspective}px` }}>
        <div
          ref={trackRef}
          className="flex h-full items-center gap-[5vw] pl-[31vw] pr-[31vw] will-change-transform max-[1025px]:gap-[8vw] max-[1025px]:pl-[22vw] max-[1025px]:pr-[22vw] max-md:gap-[12vw] max-md:pl-[12vw] max-md:pr-[12.5vw]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {images.map((img, index) => (
            <div
              key={index}
              ref={(element) => {
                wrappersRef.current[index] = element;
              }}
              className="relative flex h-[45vh] w-[38vw] shrink-0 items-center justify-center max-[1025px]:h-[40vh] max-[1025px]:w-[55vw] max-md:h-[35vh] max-md:w-[75vw] max-[1025px]:[&>div]:h-[40vh] max-[1025px]:[&>div]:w-[50vw] max-md:[&>div]:h-[35vh] max-md:[&>div]:w-[75vw]"
              style={{ transformStyle: "preserve-3d" }}
            >
              <RotationCard
                ref={(element) => {
                  cardsRef.current[index] = element;
                }}
                src={img.src}
                text={img.text}
                index={index}
                total={images.length}
                showCaptions={showCaptions}
                textColor={textColor}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface RotationCardProps {
  src?: string;
  index: number;
  total: number;
  text?: string;
  showCaptions: boolean;
  textColor: string;
}

const RotationCard = forwardRef<HTMLDivElement, RotationCardProps>(({ src, index, total, text, showCaptions, textColor }, ref) => {
  return (
    <div
      ref={ref}
      className="absolute h-[45vh] w-[38vw] origin-right overflow-hidden rounded-[6px] opacity-0 max-md:h-[35vh] max-md:w-[75vw]"
      style={{ transformStyle: "preserve-3d", zIndex: total - index }}
    >
      <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
        <img src={src} alt={text || "slide"} loading="lazy" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,9,9,.75),transparent_55%)]" />
      </div>

      {showCaptions && text && (
        <div className="absolute inset-x-[4%] bottom-[7%] z-10 flex items-end justify-between gap-4" style={{ color: textColor }}>
          <div className="t-display text-[2.3vw] max-[1025px]:text-[3.9vw] max-md:text-[5.8vw]">{text}</div>
        </div>
      )}
    </div>
  );
});

RotationCard.displayName = "RotationCard";
