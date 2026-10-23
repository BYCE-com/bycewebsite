---
name: byce-editorial-theme
description: >-
  Build, style, and design web interfaces using the BYCE high-intensity technical editorial aesthetic.
  Use this skill whenever creating new pages, UI components, sections, or styling existing elements
  following the BYCE brutalist performance design language (dark carbon background, electric acid lime
  accents, ultra-tight grotesque typography, technical grid overlays, and precision interactive micro-animations).
---

# BYCE High-Intensity Technical Editorial Theme

This skill guides the design and implementation of web applications and components adopting the **BYCE aesthetic** — a high-intensity, brutalist editorial design system engineered for athletic performance clubs, luxury fitness brands, and modern technical editorial products.

---

## 1. Core Visual Principles

1. **Monochrome Void with Acid Accents**:
   - Deep matte charcoal/black base (`#101112`, `#080909`).
   - High-voltage acid lime accent (`#b8ee3e`, secondary `#5a8d18`) used with strict intention for highlights, indicators, and callouts.
   - Warm off-white chalk typography (`#f3f0e8`) with tiered opacities (`60%`, `50%`, `15%`).

2. **Extreme Typographic Contrast**:
   - **Gigantic Display Headers**: Tight leading (`leading-[.7]` to `leading-[.8]`), negative tracking (`tracking-[-.08em]` to `tracking-[-.12em]`), heavy black weights (`font-black uppercase`).
   - **Technical Monospace Micro-labels**: Bracketed technical indicators (`[ 01 / THE CLUB ]`), uppercase `10px`, heavy letter-spacing (`tracking-[.2em]`).

3. **Subtle Engineering Atmosphere**:
   - 48px hairline grid texture overlay (`site-shell::after`) with downward gradient mask.
   - Dynamic cursor-following radial ambient glow (`--spot-x`, `--spot-y`).
   - Glowing acid-lime top scroll progress indicator.
   - Low-opacity architectural typographic watermarks (e.g. 28vw watermark text).

4. **Intentional Physicality & Micro-Interactions**:
   - Staggered text reveals (`cubic-bezier(.16, 1, .3, 1)`).
   - Underline sweep-in and hover card elevation (`hover:translate-y-[-10px]`).
   - Circular trigger buttons with arrow rotation (`rotate(45deg)`) on hover.
   - Smooth horizontal card carousel rail lock for vertical scrolling.

---

## 2. Quick Design Tokens Reference

| Token Role | Value / Class | Description |
| :--- | :--- | :--- |
| **Canvas Background** | `#101112` (`bg-[#101112]`) | Primary matte carbon background |
| **Deep Void** | `#080909` (`bg-[#080909]`) | Deepest black for film/chapter zones |
| **Surface Card** | `#1a1d19` / `#1b1f19` | Surface cards with faint olive-grey tint |
| **Acid Lime Accent** | `#b8ee3e` (`text-[#b8ee3e]`, `bg-[#b8ee3e]`) | Primary focal highlight & CTA color |
| **Subdued Lime** | `#5a8d18` (`text-[#5a8d18]`) | Secondary subdued green tone |
| **Primary Type** | `#f3f0e8` (`text-[#f3f0e8]`) | Chalk white off-white text |
| **Muted Type** | `rgba(243, 240, 232, 0.6)` (`text-white/60`) | Secondary body and detail text |
| **Subtle Borders** | `rgba(255, 255, 255, 0.15)` (`border-white/15`) | Technical division lines & borders |
| **Primary Font** | `Inter`, `Arial`, sans-serif | High-contrast sans grotesque |
| **Technical Font** | `DM Mono`, monospace | Metadata, timings, chapter numbers |

For complete token definitions and CSS rules, see [references/design-tokens.md](./references/design-tokens.md).

---

## 3. Structural Layout Recipes

### A. The Site Shell (Atmosphere Wrapper)
Wrap the main view in `.site-shell` with cursor-spotlight and background grid:

```tsx
<main 
  onMouseMove={(e) => {
    e.currentTarget.style.setProperty("--spot-x", `${e.clientX}px`);
    e.currentTarget.style.setProperty("--spot-y", `${e.clientY}px`);
  }}
  className="site-shell bg-[#101112] text-[#f3f0e8] selection:bg-[#b8ee3e] selection:text-black"
>
  <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} />
  {/* Content */}
</main>
```

### B. Minimal Technical Header
Floating fixed navigation with `mix-blend-difference`:

```tsx
<header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 mix-blend-difference md:px-10">
  <a href="#top" className="flex items-center gap-2 font-black tracking-[-.12em] text-2xl">
    BYCE<span className="h-2 w-2 rounded-full bg-[#b8ee3e]" />
  </a>
  <div className="hidden items-center gap-8 text-[10px] font-bold tracking-[.16em] md:flex">
    <span>CHENNAI, IN</span>
    <span>{time} IST</span>
    <a href="#join" className="underline underline-offset-4">JOIN THE CLUB</a>
  </div>
  <button aria-label="Open navigation" className="grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/20 backdrop-blur">
    {/* Menu Icon */}
  </button>
</header>
```

### C. Hero Section (Scale & Impact)
Hero titles must be colossal and stacked with high negative tracking:

```tsx
<section id="top" className="relative isolate flex min-h-screen overflow-hidden px-5 pb-8 pt-28 md:px-10">
  {/* Background Video / Graphic */}
  <video autoPlay muted loop playsInline className="hero-video absolute inset-0 -z-20 h-full w-full object-cover opacity-80">
    <source src="/your-video.mp4" type="video/mp4" />
  </video>
  <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,11,10,.94)_0%,rgba(10,11,10,.47)_54%,rgba(10,11,10,.2)_100%),linear-gradient(0deg,rgba(10,11,10,.75),transparent_55%)]" />

  <div className="mt-auto w-full">
    <p className="mb-3 text-[10px] font-bold tracking-[.22em] text-[#b8ee3e]">[ 00 / PROLOGUE ]</p>
    <h1 className="hero-title max-w-5xl text-[17vw] font-black uppercase leading-[.76] tracking-[-.115em] md:text-[12vw]">
      MOVE<br/>
      <span className="ml-[10vw] text-[#b8ee3e]">WITH</span><br/>
      INTENT.
    </h1>
    <div className="mt-8 flex items-end justify-between border-t border-white/30 pt-4 text-[11px] font-bold tracking-[.12em]">
      <span>LOCATION / COORDINATES</span>
      <a href="#explore" className="flex items-center gap-2">SCROLL TO EXPLORE ↘</a>
    </div>
  </div>
</section>
```

### D. 12-Column Asymmetric Editorial Section
Sections feature wide offsets with the marker on the left and the headline/body on the right:

```tsx
<section className="grid gap-10 px-5 py-24 md:grid-cols-12 md:px-10 md:py-36">
  <p className="reveal text-[10px] font-bold tracking-[.2em] text-[#b8ee3e] md:col-span-3">
    [ 01 / THE CLUB ]
  </p>
  <div className="reveal md:col-span-8 md:col-start-5">
    <h2 className="text-4xl font-black leading-[.93] tracking-[-.075em] md:text-7xl">
      WE DON’T CHASE THE AESTHETIC. WE BUILD THE CAPACITY.
    </h2>
    <p className="mt-9 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
      Detailed editorial paragraph copy explaining the discipline and philosophy.
    </p>
    <a href="#action" className="mt-10 inline-flex items-center gap-3 border-b border-[#b8ee3e] pb-2 text-xs font-bold tracking-[.14em] text-[#b8ee3e]">
      MEET THE CLUB ↗
    </a>
  </div>
</section>
```

### E. Technical Grid Schedule Board
Bordered grid with 1px gutters and interactive slide-in accent bottom bar:

```tsx
<div className="grid gap-px bg-white/15 md:grid-cols-3">
  {items.map((item) => (
    <div className="schedule-card bg-[#101112] p-6" key={item.id}>
      <p className="text-xs font-bold text-[#b8ee3e]">{item.tag}</p>
      <p className="mt-14 text-4xl font-black tracking-[-.08em]">{item.headline}</p>
      <p className="mt-2 text-xs font-bold tracking-[.11em] text-white/60">{item.detail}</p>
      <span className="mt-8 inline-block text-[10px] font-bold tracking-[.18em] text-white/30">RESERVE A PLACE ↗</span>
    </div>
  ))}
</div>
```

---

## 4. Key Do's and Don'ts

| Do | Don't |
| :--- | :--- |
| Use high negative tracking (`tracking-[-.08em]` to `tracking-[-.12em]`) on bold display titles. | Don't use default browser letter spacing for large headers. |
| Use technical brackets (`[ 01 / CHAPTER ]`) with `tracking-[.2em]`. | Don't use rounded bubbly badges or soft pastel pills. |
| Use sharp hairline borders (`border-white/15`, `gap-px bg-white/15`). | Don't use heavy colored borders or generic shadow drops. |
| Keep the primary dark background `#101112` consistent across pages. | Don't use pure grey `#808080` or generic Bootstrap darks `#212529`. |
| Reserve `#b8ee3e` for high-impact accents, numbers, and focal CTAs. | Don't paint entire screens in neon lime unless it's a dramatic final callout banner. |
| Keep motion springy and premium with `cubic-bezier(.16, 1, .3, 1)`. | Don't use bouncy playful cartoonish spring animations. |

---

## 5. References & Resources

- [Design Tokens & CSS Reference](./references/design-tokens.md) — Comprehensive variables, keyframe animations, and utility rules.
- [Component Blueprints](./references/components.md) — Ready-to-use patterns for hero, horizontal locked cards, schedule boards, and full-bleed banners.
