# BYCE Design Tokens & Styling Guide

Comprehensive tokens, utilities, and CSS snippets for implementing the BYCE editorial theme.

---

## 1. Color Palette

### Base Canvas & Neutral Surfaces
- **Canvas Base**: `#101112` — Primary deep dark matte finish.
- **Deep Void**: `#080909` — Ultra-dark backdrop used for focal chapter rails / film sections.
- **Card Surface**: `#1a1d19` / `#1b1f19` — Dark charcoal with subtle olive/forest undertone.
- **Chalk Off-White**: `#f3f0e8` — Main headline and primary body color.
- **White 65%**: `rgba(243, 240, 232, 0.65)` (`text-white/65`) — Standard body copy.
- **White 50%**: `rgba(243, 240, 232, 0.50)` (`text-white/50`) — Captions and micro-labels.
- **White 30%**: `rgba(243, 240, 232, 0.30)` (`text-white/30`) — Ghost metadata & links.
- **Hairline Border**: `rgba(255, 255, 255, 0.15)` (`border-white/15`) — Strict 1px division borders.

### Accents & Electrical Neon
- **Acid Lime (Primary)**: `#b8ee3e` — High-voltage neon accent for focus dots, bracket indicators, CTAs, and active states.
- **Subdued Olive Lime**: `#5a8d18` — Earthy mid-tone green for contrast and secondary emphasis.
- **Electric Cyan/Blue (Secondary Accent)**: `rgba(70, 90, 255, 0.38)` — Ambient gradient secondary card depth.
- **Warm Chalk Glow**: `rgba(234, 237, 228, 0.32)` — Tertiary ambient gradient bloom.

---

## 2. Typography Rules

### Google Fonts Import
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700;800;900&display=swap');
```

### Font Scales & Settings

| Usage | Classes / Properties | Example |
| :--- | :--- | :--- |
| **Hero Title** | `text-[17vw] md:text-[12vw] font-black uppercase leading-[.76] tracking-[-.115em]` | `MOVE WITH INTENT.` |
| **Section Title** | `text-4xl md:text-7xl font-black leading-[.93] tracking-[-.075em]` | `WE DON’T CHASE...` |
| **Chapter Numbers** | `text-5xl md:text-7xl font-black tracking-[-.09em]` | `THE LOAD.` |
| **Watermark Text** | `text-[28vw] font-black leading-[.7] tracking-[-.15em] opacity-[0.035]` | `BYCE` |
| **Micro-Label / Tag**| `text-[10px] font-bold tracking-[.2em] uppercase text-[#b8ee3e]` | `[ 01 / THE CLUB ]` |
| **Editorial Body** | `text-base md:text-lg leading-relaxed text-white/65` | General prose |
| **Action / Link** | `text-xs font-bold tracking-[.14em] uppercase` | `MEET THE CLUB ↗` |

---

## 3. Atmospheric CSS Utilities

### Atmospheric Grid & Cursor Spotlight
```css
.site-shell {
  --spot-x: 50vw;
  --spot-y: 30vh;
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

/* Mouse-following spotlight */
.site-shell::before {
  content: "";
  position: fixed;
  z-index: 20;
  inset: 0;
  pointer-events: none;
  opacity: .16;
  background: radial-gradient(500px circle at var(--spot-x) var(--spot-y), rgba(184,238,62,.18), transparent 58%);
  mix-blend-mode: screen;
  transition: background 180ms ease-out;
}

/* Hairline technical grid texture */
.site-shell::after {
  content: "";
  position: fixed;
  z-index: 20;
  inset: 0;
  pointer-events: none;
  opacity: .045;
  background-image:
    linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, black, transparent 80%);
}

/* Top Scroll Progress Line */
.scroll-progress {
  position: fixed;
  z-index: 60;
  top: 0;
  left: 0;
  height: 3px;
  width: 100%;
  transform-origin: left;
  background: #b8ee3e;
  box-shadow: 0 0 18px #b8ee3e;
}
```

### Staggered Reveal Animation
```css
.reveal {
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 700ms cubic-bezier(.16,1,.3,1), transform 700ms cubic-bezier(.16,1,.3,1);
}
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.reveal:nth-child(2) { transition-delay: 110ms; }
.reveal:nth-child(3) { transition-delay: 180ms; }
```

### Kinetic Schedule Card
```css
.schedule-card {
  position: relative;
  overflow: hidden;
  transition: transform 500ms cubic-bezier(.16,1,.3,1), background 500ms ease;
}
.schedule-card::after {
  content: "";
  position: absolute;
  inset: auto -20% 0;
  height: 2px;
  background: #b8ee3e;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 500ms cubic-bezier(.16,1,.3,1);
}
.schedule-card:hover {
  transform: translateY(-10px);
  background: #1b1f19;
}
.schedule-card:hover::after {
  transform: scaleX(1);
}
```
