# BYCE Component Blueprints

Implementation patterns for signature components in the BYCE aesthetic.

---

## 1. Chapter Rail with Vertical-to-Horizontal Scroll Lock

This signature component smoothly locks page scrolling when the section occupies the entire screen, translating vertical wheel / page scroll into horizontal progression through chapter cards (01 -> 02 -> 03), and unlocking only when the end is reached.

### React / Next.js Implementation

```tsx
"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const storyChapters = [
  ["01", "PRIME", "Neurological prep and active range calibration.", "FOUNDATION"],
  ["02", "LOAD", "Heavy functional compound sequences under monitored tempo.", "STRENGTH"],
  ["03", "RESET", "Down-regulation, tissue work and metabolic flush.", "RECOVERY"]
];

export function ChapterRailSection() {
  const filmRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cardIndex = 0;
    let isTransitioning = false;
    let touchStartY = 0;

    const scrollToIndex = (index: number) => {
      const rail = railRef.current;
      if (!rail) return;
      const cards = rail.querySelectorAll<HTMLElement>(".chapter-card");
      if (!cards[index]) return;
      isTransitioning = true;
      rail.scrollTo({ left: cards[index].offsetLeft - 40, behavior: "smooth" });
      setTimeout(() => { isTransitioning = false; }, 600);
    };

    const handleWheel = (e: WheelEvent) => {
      const film = filmRef.current;
      const rail = railRef.current;
      if (!film || !rail) return;

      const rect = film.getBoundingClientRect();
      const railRect = rail.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Lock only engages when rail is fully on screen
      const railTopWithin = railRect.top >= 0 && railRect.top <= windowHeight * 0.35;
      const railBottomWithin = railRect.bottom <= windowHeight + 40;
      const fullyOnScreen = railTopWithin && railBottomWithin;
      if (!fullyOnScreen) return;

      if (e.deltaY > 15) {
        if (cardIndex < storyChapters.length - 1) {
          e.preventDefault();
          if (!isTransitioning) {
            cardIndex++;
            scrollToIndex(cardIndex);
          }
        }
      } else if (e.deltaY < -15) {
        if (cardIndex > 0) {
          e.preventDefault();
          if (!isTransitioning) {
            cardIndex--;
            scrollToIndex(cardIndex);
          }
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <section ref={filmRef} className="chapter-film py-20 md:py-28">
      <div className="chapter-film__heading px-5 md:px-10">
        <p>[ 02 / INSIDE A SESSION ]</p>
        <h2>THE<br/>RITUAL.</h2>
        <span>SCROLL THROUGH THE CHAPTERS <ArrowDownRight size={16}/></span>
      </div>
      <div ref={railRef} className="chapter-rail">
        {storyChapters.map(([number, title, description, detail], index) => (
          <article className={`chapter-card chapter-card--${index + 1}`} key={title}>
            <div className="chapter-card__top">
              <span>{number}</span>
              <span>BYCE / {detail}</span>
            </div>
            <div className="chapter-card__body">
              <p>{description}</p>
              <h3>{title}</h3>
              <button aria-label={`Explore ${title}`}>
                <ArrowUpRight size={22} />
              </button>
            </div>
            <div className="chapter-card__count">0{index + 1} / 03</div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

---

## 2. Asymmetric 12-Column Editorial Section

Used for manifesto declarations, club ethos, and narrative blocks.

```tsx
import { ArrowUpRight } from "lucide-react";

export function EditorialSection() {
  return (
    <section className="grid gap-10 px-5 py-24 md:grid-cols-12 md:px-10 md:py-36">
      <p className="reveal text-[10px] font-bold tracking-[.2em] text-[#b8ee3e] md:col-span-3">
        [ 01 / THE CLUB ]
      </p>
      <div className="reveal md:col-span-8 md:col-start-5">
        <h2 className="text-4xl font-black leading-[.93] tracking-[-.075em] md:text-7xl">
          WE DON’T CHASE THE AESTHETIC. WE BUILD THE CAPACITY.
        </h2>
        <p className="mt-9 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
          BYCE is a training ground for people who like their movement useful, their effort honest and their progress measurable. No mirrors to perform for. Just a room built to become more capable.
        </p>
        <a 
          href="#join" 
          className="mt-10 inline-flex items-center gap-3 border-b border-[#b8ee3e] pb-2 text-xs font-bold tracking-[.14em] text-[#b8ee3e]"
        >
          MEET THE CLUB <ArrowUpRight size={17} />
        </a>
      </div>
    </section>
  );
}
```

---

## 3. High-Contrast Acid Lime Banner (Callout / CTA)

Used at the base of pages or for high-urgency callouts. Uses inverted styling: vivid acid lime canvas with matte dark ink.

```tsx
import { ArrowUpRight } from "lucide-react";

export function CalloutBanner() {
  return (
    <section className="mx-3 mb-3 overflow-hidden rounded-sm bg-[#b8ee3e] px-5 py-16 text-[#101112] md:mx-6 md:px-10 md:py-24">
      <div className="grid gap-10 md:grid-cols-12">
        <p className="text-[10px] font-bold tracking-[.2em] md:col-span-3">
          [ BEGIN HERE ]
        </p>
        <div className="md:col-span-9">
          <h2 className="max-w-4xl text-[13vw] font-black uppercase leading-[.79] tracking-[-.11em] md:text-[9vw]">
            YOUR NEXT<br/>
            REP STARTS<br/>
            HERE.
          </h2>
          <a
            href="mailto:hello@byce.club"
            className="mt-12 inline-flex items-center gap-4 rounded-full bg-[#101112] px-7 py-4 text-xs font-bold tracking-[.14em] text-[#f3f0e8] transition-transform hover:scale-105"
          >
            BOOK A FIRST SESSION <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}
```
