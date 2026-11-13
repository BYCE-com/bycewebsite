"use client";

import { ArrowUpRight, Menu, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion, useMotionTemplate, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { FloatingGallery } from "../components/floating-gallery";
import { MethodReveal, type MethodItem } from "../components/method-reveal";
import { HeroParallax, type ParallaxItem } from "../components/hero-parallax";
import CardsRotateSlider from "../components/cards-rotate-slider";
import CinematicOrbitHero from "../components/cinematic-orbit-hero";
import { ContainerScroll, ContainerSticky, GalleryCol, GalleryContainer, GalleryOverlay } from "../components/animated-gallery";
import { FanGallery, type FanGalleryItem } from "../components/fan-gallery";
import { ScrollWords, settle } from "../components/scroll-effects";
import { RefractedText } from "../components/refracted-text";
import { HaloDrift } from "../components/halo-drift";
import { GlassExitCarousel } from "../components/glass-exit-carousel";

const methodPhoto = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=800&q=72`;
const methodItems: MethodItem[] = [
  { title: "STRENGTH", body: "Build force you can use.", image: methodPhoto("1793393443234-fcd6369b3894"), alt: "Lifter in a singlet and knee sleeves pulling a heavy barbell" },
  { title: "CONDITIONING", body: "Make your engine last.", image: methodPhoto("1669322779651-5ca89652492e"), alt: "Athlete working heavy battle ropes in a gym" },
  { title: "RECOVERY", body: "Restore. Repeat. Evolve.", image: methodPhoto("1782297383356-fcffe56db9e8"), alt: "Runner lacing up on a track while a teammate stretches" },
];
const storyChapters = [
  ["PRIME", "Arrive with a plan. Leave with proof."],
  ["LOAD", "The work gets heavy. Your standards do not."],
  ["RESET", "Recover with as much intention as you train."],
];
const roomTitle = ["THE", "ROOM"] as const;
/** "THE" in the wide face, "ROOM" in the tall one. Module-level so the memoised heading keeps it. */
const roomLineClasses = ["t-wide", ""] as const;
/**
 * Over the glass carousel. The two faces alternate word by word (flat, slanted, flat …)
 * rather than splitting the heading in two, so every line mixes them.
 */
const clubWords = [
  { text: "WE", className: "t-flat" },
  { text: "DON’T" },
  { text: "CHASE", className: "t-flat" },
  { text: "THE" },
  { text: "AESTHETIC", className: "t-flat text-[#b8ee3e]" },
  { text: "WE", newLine: true },
  { text: "BUILD", className: "t-flat" },
  { text: "THE" },
  { text: "CAPACITY", className: "t-flat text-[#b8ee3e]" },
] as const;
/** Light palette per ritual chapter: PRIME, LOAD, RESET. */
const chapterHalos = ["lime", "indigo", "stone"] as const;
// Every photo on the page is a different Unsplash image; none is reused between sections.
// Eighteen portrait (292:372) crops for the glass conveyor, one per card on its path, people
// and equipment alternating; served with CORS so WebGL can use them.
const cardPhotos = [
  "1757911943473-d655859cefb7", "1720784713799-1e95cfeb81a9", "1726867894160-f8f6f5da16c7", "1685633225160-9b965f1715ff", "1772450014713-19bc36041593", "1709315872247-644b7ff5ed10",
  "1639511205273-7af2f8805d10", "1623428455276-c5243d302dbe", "1732440290008-c092bda3ccbc", "1608947325823-976b1c65d14c", "1606889464198-fcb18894cf50", "1549719386-74dfcbf7dbed",
  "1647456753452-e5d7cbf16df1", "1709315847224-6c8a812e886a", "1605720789771-a7fb8ab19d04", "1623874228601-f4193c7b1818", "1666121365392-b6f502f8b1c9", "1709315849916-bcd31d054deb",
].map((id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=584&h=744&q=72`);
const floatPhotos = [
  ["1737381508529-a110d717d5a7", "Boxer in a hoodie in the ring"],
  ["1606328500899-38351f33df8a", "Lifter carrying a loaded barbell"],
  ["1745329532629-8e1768963d3a", "Man lifting heavy weights"],
  ["1778828450043-48a970748001", "Man doing dips on a machine"],
  ["1772450014229-2a8b006893e9", "Man doing pull-ups"],
  ["1774864107003-bc458669509d", "Athlete carrying kettlebells"],
  ["1773289338378-2d083b1e5b84", "Two men training on heavy bags"],
  ["1780398585038-d77d3817c3c6", "Man training on a rowing machine"],
  ["1754630591156-ef00f2e0d888", "Hanging punching bags in a boxing gym"],
].map(([id, alt]) => ({ src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=760&q=70`, alt }));
// Three rows of five for the hero parallax; landscape (5:4) crops.
const parallaxItems: ParallaxItem[] = [
  ["1689877020200-403d8542d95d", "Open Floor", "Gym floor full of machines and weights"],
  ["1521804906057-1df8fdb718b7", "Deadlift Clinic", "Lifter pulling a heavy barbell off a rubber floor"],
  ["1519505907962-0a6cb0167c73", "Engine Room", "Athlete on a rowing machine"],
  ["1761839258420-5c3e2f2e2a74", "Overhead Press", "Woman lifting weights in a gym"],
  ["1554284126-aa88f22d8b74", "Barbell Club", "Three people lifting barbells together"],
  ["1780319679390-9a8600c1355f", "Track Intervals", "Runner on a red athletics track"],
  ["1784798228092-659924b1a15b", "Squat Bay", "Empty power rack with barbells and plates"],
  ["1734630341082-0fec0e10126c", "Iron Row", "Row of dumbbells on a rack"],
  ["1685633225009-9a612a71b945", "Core & Mobility", "Kettlebells and mats laid out for mobility work"],
  ["1605296867724-fa87a8ef53fd", "Late Lift", "Lifter beside a barbell in a dark gym"],
  ["1526401485004-46910ecc8e51", "Bumper Plates", "Stacks of coloured bumper plates"],
  ["1623874514711-0f321325f318", "Strength Floor", "Benches and racks in a wide industrial gym"],
  ["1517838277536-f5f99be501cd", "Grip Work", "Hands gripping a barbell"],
  ["1758875569256-f37c438cac65", "Coached Sets", "Woman lifting while a coach watches"],
  ["1641337221253-fdc7237f6b61", "Dumbbell Day", "Man holding a dumbbell in a gym"],
].map(([id, title, alt]) => ({ title, alt, image: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=960&h=768&q=70` }));
// Three columns of four for the pinned photo wall; 16:9 crops.
const galleryCols: [string, string][][] = [
  [["1757924284732-4189190321cf", "Treadmills by tall windows"], ["1601422407692-ec4eeec1d9b3", "Kettlebell get-up"], ["1434596922112-19c563067271", "Woman holding battle ropes"], ["1558611848-73f7eb4001a1", "Barbell on a rack"]],
  [["1671970922029-0430d2ae122c", "Gym full of equipment"], ["1758875569334-27579a49ed0b", "Push-ups with a partner spotting"], ["1571902943202-507ec2618e8f", "Equipment lined up in a gym"], ["1544033527-b192daee1f5b", "Dumbbells in black and white"]],
  [["1534258936925-c58bed479fcb", "Two people training together"], ["1767404890859-73752f06716c", "Close-up of a 45 lb plate"], ["1570829460005-c840387bb1ca", "Gym interior"], ["1728486145245-d4cb0c9c3470", "Large gym floor with machines"]],
];
// Eight cards for the orbit around "THE BOARD"
const orbitPhotos = [
  ["1646656130703-8f95eed6a79b", "Gym with a checkered floor"],
  ["1590771998996-8589ec9b5ac6", "Man setting up under a barbell in a rack"],
  ["1598971475122-95a9004e2922", "Man holding a dumbbell"],
  ["1597452485670-5f32106899c3", "Man training on a bar"],
  ["1570440828762-ab7a993dbde8", "Man holding a kettlebell"],
  ["1765302907822-33032f78eb2c", "Kettlebell push-up"],
  ["1549476464-37392f717541", "Man holding a bumper plate"],
  ["1592588253414-887759037c2a", "Woman holding a barbell"],
].map(([id, alt]) => ({ alt, src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&h=700&q=70` }));
// The cards-rotate slider walks through one session, block by block; 16:9 crops.
const sequenceCards = [
  ["1771586791190-97ed536c54af", "Arrive & Prime"],
  ["1738524108491-9a0db4067897", "Mobility Flow"],
  ["1571019614242-c5c5dee9f50b", "Activation"],
  ["1517836357463-d25dfeac3438", "Main Lift"],
  ["1605296867304-46d5465a13f1", "Back-off Sets"],
  ["1581009146145-b5ef050c2e1e", "Accessory Work"],
  ["1599058917212-d750089bc07e", "Engine Block"],
  ["1578763363228-6e8428de69b2", "Intervals"],
  ["1541534741688-6078c6bfb5c5", "Grip & Carries"],
  ["1517963879433-6ad2b056d712", "Rack It"],
  ["1761839257789-20147513121a", "Breathe Down"],
  ["1758875569414-120ebc62ada3", "Log the Session"],
].map(([id, text]) => ({ text, src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&h=675&q=70` }));
const workVideo = "https://assets.mixkit.co/videos/23056/23056-720.mp4";
// Placeholder photography from Unsplash — swap for real BYCE shots when available.
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=720&h=900&q=70`;
const spaces: FanGalleryItem[] = [
  { src: unsplash("1762744827085-7c1a2573ecdb"), alt: "Man gripping a pull-up bar", title: "THE RIG", detail: "Pull-ups, rings and long hangs. Grip strength is earned here, one rep at a time." },
  { src: unsplash("1791002630482-6a066253659c"), alt: "Stacks of dumbbells on gym shelves", title: "IRON ROW", detail: "Every dumbbell racked in order. Pick your weight and get to work." },
  { src: unsplash("1590487988274-946a8635e5d6"), alt: "Row of squat racks", title: "THE CAGE", detail: "Racks with safeties set, so heavy days stay honest and stay safe." },
  { src: unsplash("1772450014622-1c209d012c2e"), alt: "Woman lifting a heavy barbell", title: "PLATFORM", detail: "Rubber floors and bumper plates. The heaviest lifts in the club happen here." },
  { src: unsplash("1636645370272-59e7a8911844"), alt: "Athlete gripping battle ropes", title: "ENGINE ROOM", detail: "Ropes, sleds and bikes for conditioning that is short, hard and measured." },
  { src: unsplash("1680759170087-3c4659fa9244"), alt: "Lifter squatting in a rack", title: "SQUAT BAY", detail: "Depth, bracing and tempo, coached one working set at a time." },
  { src: unsplash("1605490855119-94921710a47f"), alt: "Lifter carrying a dumbbell in a dark gym", title: "LAST REP", detail: "The late hours are quieter. The standard stays exactly the same." },
];

export default function Home() {
  const [menu, setMenu] = useState(false);
  const filmRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const workRef = useRef<HTMLElement>(null);
  const joinRef = useRef<HTMLDivElement>(null);
  const reduce = !!useReducedMotion();
  const spotRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const workVideoRef = useRef<HTMLVideoElement>(null);

  // Scroll-linked motion values update the DOM directly, so scrolling never re-renders the page.
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const videoScale = useTransform(heroP, [0, 1], [1, 1.14]);
  const videoY = useTransform(heroP, [0, 1], ["0%", "12%"]);
  const titleY = useTransform(heroP, [0, 1], ["0%", "12%"]);
  const titleScale = useTransform(heroP, [0, 1], [1, 0.9]);
  const heroFade = useTransform(heroP, [0, 0.75], [1, 0.15]);

  const { scrollYProgress: workP } = useScroll({ target: workRef, offset: ["start end", "end start"] });
  const panelInset = useTransform(workP, [0, 0.35], ["6%", "0%"]);
  const panelRadius = useTransform(workP, [0, 0.35], [36, 0]);
  const workImageScale = useTransform(workP, [0, 1], [1.18, 1]);
  const lineLeft = useTransform(workP, [0, 1], ["-14%", "10%"]);
  const lineRight = useTransform(workP, [0, 1], ["14%", "-10%"]);

  const { scrollYProgress: joinP } = useScroll({ target: joinRef, offset: ["start end", "end end"] }); // settles full-bleed by the bottom of the page
  const joinScale = useTransform(joinP, [0, 1], [0.88, 1]);
  const joinY = useTransform(joinP, [0, 1], [80, 0]);

  // Floating gallery: opens from a rounded inset to full-bleed, its headline rises and
  // fades through the section, and page scroll speed pushes the drift (up reverses it).
  // Fan gallery, pinned while you scroll its track: the cards assemble from a loose pile into
  // the fan (-1 → 0), hold there untouched (0), then distribute wide again (0 → 1).
  const fanRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: fanP } = useScroll({ target: fanRef, offset: ["start start", "end end"] });
  const fanSmooth = useSpring(fanP, { stiffness: 70, damping: 26, restDelta: 0.0005 });
  const fanScatter = useTransform(fanSmooth, (p) => (p < 0.32 ? -(1 - p / 0.32) : p > 0.68 ? (p - 0.68) / 0.32 : 0));

  // Floating gallery, pinned while you scroll its track. The rounded-inset reveal plays as the
  // track arrives; then the cards appear out of thin air (-1 → 0), hold as the normal collage
  // (0), and vanish again (0 → 1).
  const floatRef = useRef<HTMLElement>(null);
  const { scrollYProgress: floatEnter } = useScroll({ target: floatRef, offset: ["start end", "start start"] });
  const floatInset = useTransform(floatEnter, [0.1, 1], [9, 0]);
  const floatRadius = useTransform(floatEnter, [0.1, 1], [32, 0]);
  const floatClip = useMotionTemplate`inset(${floatInset}% ${floatInset}% round ${floatRadius}px)`;
  const { scrollYProgress: floatP } = useScroll({ target: floatRef, offset: ["start start", "end end"] });
  const floatSmooth = useSpring(floatP, { stiffness: 70, damping: 26, restDelta: 0.0005 });
  const floatScatter = useTransform(floatSmooth, (p) => (p < 0.32 ? -(1 - p / 0.32) : p > 0.68 ? (p - 0.68) / 0.32 : 0));
  // The heading simply fades in and out with the collage.
  const floatHeadFade = useTransform(floatScatter, (v) => Math.max(0, 1 - Math.abs(v) * 1.6));
  const { scrollY } = useScroll();
  const scrollSpeed = useVelocity(scrollY);
  const floatBoost = useSpring(useTransform(scrollSpeed, [-2500, 0, 2500], [-5, 1, 7]), { stiffness: 120, damping: 30 });
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const film = filmRef.current;
    const rail = railRef.current;
    if (!film || !rail) return;
    let targetScroll = rail.scrollLeft;
    let animId = 0;
    const smoothScroll = () => {
      const current = rail.scrollLeft;
      const max = rail.scrollWidth - rail.clientWidth;
      const diff = targetScroll - current;
      if (Math.abs(diff) > 0.5) {
        rail.scrollLeft = Math.max(0, Math.min(max, current + diff * 0.25));
        animId = requestAnimationFrame(smoothScroll);
      } else {
        rail.scrollLeft = targetScroll;
        animId = 0;
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || e.deltaY === 0) return;
      const railRect = rail.getBoundingClientRect();
      const vh = window.innerHeight;

      const maxScroll = rail.scrollWidth - rail.clientWidth;
      if (maxScroll <= 10) return;
      const current = rail.scrollLeft;

      if (e.deltaY > 0) {
        // Scrolling DOWN: only start when the entire cards UI component is in view (not half screen)
        const isEntireComponentInViewDown = railRect.top <= 90 && railRect.bottom >= vh * 0.8;
        if (!isEntireComponentInViewDown) return;

        // Must complete 1 to 3 before allowing remaining scroll downwards
        if (targetScroll < maxScroll - 10 || current < maxScroll - 15) {
          e.preventDefault();
          targetScroll = Math.max(0, Math.min(maxScroll, (animId ? targetScroll : current) + e.deltaY));
          if (!animId) animId = requestAnimationFrame(smoothScroll);
        }
      } else if (e.deltaY < 0) {
        // Scrolling UP: only start when the entire cards UI component is in view (not half screen)
        const isEntireComponentInViewUp = railRect.top >= -60 && railRect.top <= 90 && railRect.bottom >= vh * 0.8;
        if (!isEntireComponentInViewUp) return;

        // Must complete 3 to 1 before allowing remaining scroll upwards
        if (targetScroll > 10 || current > 15) {
          e.preventDefault();
          targetScroll = Math.max(0, Math.min(maxScroll, (animId ? targetScroll : current) + e.deltaY));
          if (!animId) animId = requestAnimationFrame(smoothScroll);
        }
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);
  useEffect(() => {
    // Reveal once, then stop watching that element.
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: 0.12 });
    document.querySelectorAll("main h1, main h2, main h3, main p, main a, main button, main span, .reveal").forEach((item, index) => {
      if (item.closest("[data-own-motion]")) return; // components that animate themselves
      item.classList.add("motion-text");
      (item as HTMLElement).style.setProperty("--motion-delay", `${Math.min((index % 6) * 55, 260)}ms`);
      observer.observe(item);
    });
    return () => observer.disconnect();
  }, []);
  // Cursor spotlight: write the position to the spotlight layer at most once per frame.
  useEffect(() => {
    const el = spotRef.current;
    if (!el) return;
    let raf = 0, x = 0, y = 0;
    const apply = () => { raf = 0; el.style.setProperty("--spot-x", `${x}px`); el.style.setProperty("--spot-y", `${y}px`); };
    const onMove = (e: MouseEvent) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  // Background videos only decode while on screen; they resume where they left off.
  useEffect(() => {
    const videos = [heroVideoRef.current, workVideoRef.current].filter((v): v is HTMLVideoElement => !!v);
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      const v = entry.target as HTMLVideoElement;
      if (entry.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }));
    videos.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, []);
  return <MotionConfig reducedMotion="user"><main className="site-shell bg-[#101112] text-[#f3f0e8] selection:bg-[#b8ee3e] selection:text-black">
    <div ref={spotRef} className="spotlight" aria-hidden="true" />
    {/* Logo centred, menu on the right; the empty first column keeps the logo truly centred. */}
    <header className="fixed inset-x-0 top-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center px-5 py-5 mix-blend-difference md:px-10">
      <span aria-hidden="true" />
      <a href="#top" className="t-display flex items-center gap-2 text-[1.35rem]">BYCE<span className="h-2 w-2 rounded-full bg-[#b8ee3e]" /></a>
      <button onClick={() => setMenu(!menu)} aria-label="Open navigation" className="grid h-11 w-11 justify-self-end place-items-center rounded-full border border-white/30 bg-black/20 backdrop-blur"><Menu className={menu ? "hidden" : "block"} size={18}/><X className={menu ? "block" : "hidden"} size={18}/></button>
    </header>
    {menu && <nav className="fixed inset-0 z-30 grid place-items-center bg-[#b8ee3e] text-[#101112]"><div className="text-center">{["THE CLUB", "THE METHOD", "SCHEDULE", "VISIT BYCE"].map((x,i)=><a onClick={()=>setMenu(false)} href={i===3?"#join":"#method"} className="t-display block text-[7.5vw] leading-[.95] transition-[font-weight] duration-300 hover:font-light md:text-[5.6vw]" key={x}>{x}</a>)}</div></nav>}

    <section ref={heroRef} id="top" className="relative isolate flex min-h-screen overflow-hidden px-5 pb-8 pt-28 md:px-10">
      <motion.video
        ref={heroVideoRef}
        autoPlay
        muted
        loop
        playsInline
        style={reduce ? undefined : { scale: videoScale, y: videoY }}
        className="hero-video absolute inset-0 -z-20 h-full w-full object-cover opacity-80"
      >
        <source src="https://assets.mixkit.co/active_storage/video_items/100546/1725385655/100546-video-720.mp4" type="video/mp4" />
      </motion.video>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,11,10,.94)_0%,rgba(10,11,10,.47)_54%,rgba(10,11,10,.2)_100%),linear-gradient(0deg,rgba(10,11,10,.75),transparent_55%)]" />
      <motion.div className="mt-auto w-full" style={reduce ? undefined : { opacity: heroFade }}><motion.div data-own-motion="" style={reduce ? undefined : { y: titleY, scale: titleScale }} className="hero-title"><motion.h1 initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: settle, delay: 0.15 }} className="t-display text-[7vw] md:text-[5.6vw]"><span className="block">MAKE MOVE</span><span className="block text-[#b8ee3e] md:ml-[6vw]">BREAK LIMITS</span></motion.h1></motion.div></motion.div>
    </section>

    {/* Full-screen glass conveyor; the cards run top-left to bottom-right, so the headline sits in the clear lower-left corner. */}
    <section className="relative isolate h-[100svh] min-h-[620px] overflow-hidden">
      <GlassExitCarousel photos={cardPhotos} label="Photos from the BYCE training floor" className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(16,17,18,.85),rgba(16,17,18,.4)_35%,transparent_60%)]" />
      <div className="pointer-events-none absolute bottom-10 left-5 z-10 max-w-[88vw] md:bottom-14 md:left-10 md:max-w-[min(72rem,66vw)]"><ScrollWords segments={clubWords} offset={["start end", "end end"]} className="t-display text-[7vw] md:text-[3.9vw]" /></div>
    </section>

    <section id="method" className="border-y border-white/15 px-5 md:px-10"><div className="h-10" aria-hidden="true" /><MethodReveal items={methodItems} /></section>

    <section ref={filmRef} className="chapter-film py-20 md:py-28">
      <div className="chapter-film__heading px-5 md:px-10"><h2 className="t-tall"><span className="t-wide block t-flat">THE</span>RITUAL</h2></div>
      <div ref={railRef} className="chapter-rail">{storyChapters.map(([title, description], index) => <article className={`chapter-card chapter-card--${index + 1}`} key={title}><div className="chapter-card__halo" aria-hidden="true"><HaloDrift palette={chapterHalos[index]} motion="aurora" offset={index * 6} exposure={0.72} /></div><div className="chapter-card__body"><p>{description}</p><h3>{title}</h3><button aria-label={`Explore ${title}`}><ArrowUpRight size={22}/></button></div></article>)}</div>
    </section>

    <section ref={workRef} className="relative min-h-[70vh] overflow-hidden px-5 py-24 md:px-10"><motion.div className="absolute overflow-hidden bg-[#101112]" style={reduce ? { inset: 0 } : { top: panelInset, bottom: panelInset, left: panelInset, right: panelInset, borderRadius: panelRadius }}><motion.video ref={workVideoRef} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={reduce ? undefined : { scale: workImageScale }}><source src={workVideo} type="video/mp4" /></motion.video><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,11,10,.82)_0%,rgba(10,11,10,.55)_45%,rgba(10,11,10,.35)_100%),linear-gradient(0deg,rgba(10,11,10,.7),transparent_60%)]" /></motion.div><div className="relative z-10 grid gap-12 text-[#f3f0e8] md:grid-cols-12"><div className="md:col-span-8 md:col-start-5"><p data-own-motion="" className="t-display text-[13vw] md:text-[8vw]"><motion.span className="block t-flat" style={reduce ? undefined : { x: lineLeft }}>THE</motion.span><motion.span className="block" style={reduce ? undefined : { x: lineRight }}>WORK</motion.span><motion.span className="block t-flat text-[#b8ee3e]" style={reduce ? undefined : { x: lineLeft }}>SHOWS</motion.span></p><div className="mt-12"><button className="grid h-14 w-14 place-items-center rounded-full bg-[#b8ee3e] text-[#101112] transition-transform hover:scale-110" aria-label="Play BYCE film"><Play size={17} fill="currentColor"/></button></div></div></div></section>

    <section aria-label="Every session at BYCE" className="bg-[#0b0c0d]">
      <HeroParallax
        items={parallaxItems}
        header={
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 1, ease: settle }}>
            
            <h2 className="t-display mt-6 text-[9.5vw] text-[#f3f0e8] md:text-[7vw]"><span className="t-flat">THE</span> CLUB,<span className="block text-[#b8ee3e]">IN <span className="t-flat">MOTION</span></span></h2>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-white/60 md:text-lg">Strength, engine and recovery, coached to the same standard every session. Scroll through the floor.</p>
          </motion.div>
        }
      />
    </section>

    <section id="space" className="fan-section overflow-clip px-5 py-24 md:px-10 md:py-32">
      <div className="grid gap-10 md:grid-cols-12"><div className="flex flex-col gap-8 md:col-span-8 md:col-start-5 lg:flex-row lg:items-end lg:justify-between"><RefractedText lines={roomTitle} lineClassNames={roomLineClasses} className="text-[26vw] leading-[.86] md:text-[length:clamp(7rem,13vw,14rem)]" /><p className="max-w-xs text-sm leading-relaxed text-white/60 md:text-base">Seven corners of one floor. No mirrors to perform for, no machines you’ll never touch. Raise a frame to look closer.</p></div></div>
      <div ref={fanRef} className={reduce ? "mt-16 md:mt-24" : "relative mt-10 h-[300vh]"}>
        <div className={reduce ? "" : "sticky top-0 -mx-5 flex h-[100svh] flex-col justify-center overflow-hidden px-5 md:-mx-10 md:px-10"}>
          <FanGallery items={spaces} scatter={reduce ? undefined : fanScatter} />
        </div>
      </div>
    </section>

    {/* Pinned photo wall: lies back in perspective, stands upright, then its columns drift. */}
    <section aria-label="Photos from the BYCE floor" data-own-motion="" className="relative overflow-clip bg-[#0b0c0d]">
      <ContainerScroll className="relative h-[350vh]">
        <ContainerSticky className="h-svh">
          <GalleryContainer>
            {galleryCols.map((col, c) => (
              <GalleryCol key={c} yRange={c === 1 ? ["15%", "5%"] : ["-10%", "2%"]} className={c === 1 ? "mt-[-50%]" : "-mt-2"}>
                {col.map(([id, alt]) => <img key={id} src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=960&h=540&q=70`} alt={alt} loading="lazy" decoding="async" draggable={false} className="block aspect-video w-full rounded-md object-cover shadow-[0_20px_40px_-20px_rgba(0,0,0,.8)]" />)}
              </GalleryCol>
            ))}
          </GalleryContainer>
          <GalleryOverlay
            lines={[
              
              <h2 key="a" className="t-display text-[9vw] text-[#f3f0e8] md:text-[8vw]"><span className="t-flat">THE</span> FLOOR</h2>,
              <h2 key="b" className="t-display text-[9vw] text-[#b8ee3e] md:text-[8vw]">NEVER <span className="t-flat">LIES</span></h2>,
            ]}
          />
        </ContainerSticky>
      </ContainerScroll>
    </section>

    <section aria-label="One session, twelve moves" className="bg-[#101112]">
      <div className="px-5 pb-4 pt-24 md:px-10 md:pt-32"><div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><h2 className="t-display text-[6.5vw] md:text-[5vw]"><span className="t-flat">ONE</span> SESSION,<span className="block text-[#b8ee3e]">TWELVE <span className="t-flat">MOVES</span></span></h2><p className="max-w-xs text-sm leading-relaxed text-white/60">Keep scrolling. Every card is one block of a BYCE session, from the first step in to the last line in the log.</p></div></div>
      <CardsRotateSlider images={sequenceCards} background="#101112" textColor="#f3f0e8" rotationAmount={1.1} verticalDrift={1.2} perspective={1000} />
    </section>

    <CinematicOrbitHero images={orbitPhotos}>
      <h2 className="t-display text-xl font-normal text-[#f3f0e8] md:text-3xl">THE BOARD</h2>
    </CinematicOrbitHero>


    <section ref={floatRef} className={`relative bg-[#101112] ${reduce ? "h-[100svh] min-h-[620px] overflow-hidden" : "h-[300vh]"}`}>
      <div className={reduce ? "absolute inset-0" : "sticky top-0 h-[100svh] min-h-[620px] overflow-hidden"}>
      <motion.div className="absolute inset-0" style={reduce ? undefined : { clipPath: floatClip }}>
        <FloatingGallery images={floatPhotos} background="#0b0c0d" cardWidth={narrow ? 130 : 220} cardHeight={narrow ? 166 : 280} rounded={14} speed={narrow ? 40 : 50} fade={18} boost={reduce ? undefined : floatBoost} scatter={reduce ? undefined : floatScatter} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_45%,rgba(11,12,13,.65))]" />
      </motion.div>
      
      <div data-own-motion="" className="pointer-events-none absolute bottom-10 left-5 z-10 md:bottom-14 md:left-10">
        <motion.h2 style={reduce ? undefined : { opacity: floatHeadFade }} className="t-display text-[9.5vw] text-[#f3f0e8] md:text-[5.3vw]">SHOW <span className="t-flat">UP</span><span className="block text-[#b8ee3e]"><span className="t-flat">EVERY</span> DAY</span></motion.h2>
      </div>      </div>
    </section>

    <motion.div ref={joinRef} style={reduce ? undefined : { scale: joinScale, y: joinY }}><section id="join" className="relative isolate overflow-hidden bg-[#080909] text-[#f3f0e8]">
      {/* Drifting light behind the call to action, darkened toward the type. */}
      <div className="pointer-events-none absolute inset-0 -z-10"><HaloDrift /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,9,9,.55),rgba(8,9,9,.15)_60%,transparent)]" /></div>
      <div className="grid gap-10 px-5 pb-16 pt-24 md:grid-cols-12 md:px-10 md:pb-28 md:pt-36"><div className="md:col-span-9 md:col-start-4"><h2 className="t-display text-[8.2vw] md:text-[6.2vw]"><span className="t-flat">YOUR</span> NEXT<br/>REP <span className="t-flat">STARTS</span><span className="block t-flat text-[#b8ee3e]">HERE</span></h2><a href="mailto:info@byce.in?subject=BYCE%20trial" className="t-caps mt-12 inline-flex items-center gap-4 rounded-full bg-[#b8ee3e] px-7 py-4 text-[12px] text-[#101112]">BOOK A FIRST SESSION <ArrowUpRight size={17}/></a></div></div>
      {/* Footer sits inside the panel so the light runs to the bottom edge of the page. */}
      <footer className="px-5 pb-12 pt-8 md:px-10 md:pb-16">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <a href="#top" className="t-display flex w-fit items-center gap-3 text-5xl md:text-6xl">BYCE<span className="h-3 w-3 rounded-full bg-[#b8ee3e]" /></a>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">A training club in Chennai. Strength, engine and recovery, coached to one standard.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-col text-[15px] text-white/70 md:col-span-3">
            <a href="#top" className="w-fit py-1.5">The club</a>
            <a href="#method" className="w-fit py-1.5">The method</a>
            <a href="#space" className="w-fit py-1.5">The room</a>
          </nav>
          <div className="flex flex-col text-[15px] text-white/70 md:col-span-3">
            <a href="mailto:info@byce.in" className="w-fit py-1.5">info@byce.in</a>
            <address className="py-1.5 text-sm not-italic leading-relaxed text-white/55">BYCE Technologies LLP<br />2/1149/I 100, Hilite Business Park<br />Olavanna, Kozhikode</address>
            <span className="py-1.5">Instagram</span>
            <span className="py-1.5">WhatsApp</span>
          </div>
        </div>
      </footer>
    </section></motion.div>
  </main></MotionConfig>;
}
