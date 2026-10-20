"use client";

import { ArrowDownRight, ArrowUpRight, Menu, Play, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

const chapters = ["01 / The club", "02 / The method", "03 / The sessions", "04 / The space"];
const sessions = [
  ["01", "STRENGTH", "Build force you can use."],
  ["02", "CONDITIONING", "Make your engine last."],
  ["03", "RECOVERY", "Restore. Repeat. Evolve."],
];

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [time, setTime] = useState("06:42");
  useEffect(() => { const tick = () => setTime(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date())); tick(); const id = setInterval(tick, 30000); return () => clearInterval(id); }, []);
  return <main className="bg-[#101112] text-[#f3f0e8] selection:bg-[#b8ee3e] selection:text-black">
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 mix-blend-difference md:px-10">
      <a href="#top" className="flex items-center gap-2 font-black tracking-[-.12em] text-2xl">BYCE<span className="h-2 w-2 rounded-full bg-[#b8ee3e]" /></a>
      <div className="hidden items-center gap-8 text-[10px] font-bold tracking-[.16em] md:flex"><span>CHENNAI, IN</span><span>{time} IST</span><a href="#join" className="underline underline-offset-4">JOIN THE CLUB</a></div>
      <button onClick={() => setMenu(!menu)} aria-label="Open navigation" className="grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/20 backdrop-blur"><Menu className={menu ? "hidden" : "block"} size={18}/><X className={menu ? "block" : "hidden"} size={18}/></button>
    </header>
    {menu && <nav className="fixed inset-0 z-30 grid place-items-center bg-[#b8ee3e] text-[#101112]"><div className="text-center"><p className="mb-8 text-[10px] font-bold tracking-[.25em]">SELECT YOUR CHAPTER</p>{["THE CLUB", "THE METHOD", "SCHEDULE", "VISIT BYCE"].map((x,i)=><a onClick={()=>setMenu(false)} href={i===3?"#join":"#method"} className="block text-5xl font-black leading-[1.05] tracking-[-.09em] hover:italic md:text-8xl" key={x}>{x}</a>)}</div></nav>}

    <section id="top" className="relative isolate flex min-h-screen overflow-hidden px-5 pb-8 pt-28 md:px-10">
      <div className="absolute inset-0 -z-20 bg-[url('/images/byce-hero.png')] bg-cover bg-[center_54%] opacity-80" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,11,10,.94)_0%,rgba(10,11,10,.47)_54%,rgba(10,11,10,.2)_100%),linear-gradient(0deg,rgba(10,11,10,.75),transparent_55%)]" />
      <div className="mt-auto w-full"><p className="mb-3 text-[10px] font-bold tracking-[.22em] text-[#b8ee3e]">A NEW KIND OF TRAINING CLUB — EST. 2026</p><h1 className="max-w-5xl text-[17vw] font-black uppercase leading-[.76] tracking-[-.115em] md:text-[12vw]">MOVE<br/><span className="ml-[10vw] text-[#b8ee3e]">WITH</span><br/>INTENT.</h1><div className="mt-8 flex items-end justify-between border-t border-white/30 pt-4 text-[11px] font-bold tracking-[.12em]"><span>CHENNAI / INDIA</span><a href="#method" className="flex items-center gap-2">SCROLL TO EXPLORE <ArrowDownRight size={18}/></a></div></div>
    </section>

    <section className="grid gap-10 px-5 py-24 md:grid-cols-12 md:px-10 md:py-36"><p className="text-[10px] font-bold tracking-[.2em] text-[#b8ee3e] md:col-span-3">[ 01 / THE CLUB ]</p><div className="md:col-span-8 md:col-start-5"><h2 className="text-4xl font-black leading-[.93] tracking-[-.075em] md:text-7xl">WE DON’T CHASE THE AESTHETIC. WE BUILD THE CAPACITY.</h2><p className="mt-9 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">BYCE is a training ground for people who like their movement useful, their effort honest and their progress measurable. No mirrors to perform for. Just a room built to become more capable.</p><a href="#join" className="mt-10 inline-flex items-center gap-3 border-b border-[#b8ee3e] pb-2 text-xs font-bold tracking-[.14em] text-[#b8ee3e]">MEET THE CLUB <ArrowUpRight size={17}/></a></div></section>

    <section id="method" className="border-y border-white/15 px-5 md:px-10"><div className="py-8 text-[10px] font-bold tracking-[.2em] text-white/50">[ THE BYCE METHOD ]</div>{sessions.map(([number,title,body], index)=><article key={title} className="group grid items-center border-t border-white/15 py-7 md:grid-cols-12 md:py-10"><span className="text-xs font-bold text-[#b8ee3e] md:col-span-2">{number}</span><h3 className="mt-5 text-5xl font-black tracking-[-.09em] transition-all group-hover:pl-4 group-hover:text-[#b8ee3e] md:col-span-6 md:mt-0 md:text-7xl">{title}</h3><p className="mt-4 max-w-48 text-sm text-white/55 md:col-span-3 md:mt-0">{body}</p><Plus className="mt-4 md:mt-0 md:justify-self-end" />{index === 2 && null}</article>)}</section>

    <section className="relative min-h-[70vh] overflow-hidden px-5 py-24 md:px-10"><div className="absolute inset-0 bg-[#d8dfc7] opacity-95"/><div className="relative z-10 grid gap-12 text-[#101112] md:grid-cols-12"><p className="text-[10px] font-bold tracking-[.2em] md:col-span-3">[ TRAINING IS A PRACTICE ]</p><div className="md:col-span-8 md:col-start-5"><p className="text-[11vw] font-black uppercase leading-[.8] tracking-[-.1em] md:text-[8vw]">THE<br/>WORK<br/><span className="text-[#5a8d18]">SHOWS.</span></p><div className="mt-12 flex max-w-md items-center justify-between border-t border-black/30 pt-4"><span className="text-xs font-bold">03 DISCIPLINES / ONE STANDARD</span><button className="grid h-14 w-14 place-items-center rounded-full bg-[#101112] text-[#b8ee3e]" aria-label="Play BYCE film"><Play size={17} fill="currentColor"/></button></div></div></div></section>

    <section className="px-5 py-24 md:px-10 md:py-36"><div className="mb-12 flex items-end justify-between"><div><p className="text-[10px] font-bold tracking-[.2em] text-[#b8ee3e]">[ THIS WEEK AT BYCE ]</p><h2 className="mt-4 text-5xl font-black tracking-[-.08em] md:text-7xl">THE BOARD.</h2></div><span className="hidden text-xs font-bold text-white/50 md:block">VIEW FULL SCHEDULE ↗</span></div><div className="grid gap-px bg-white/15 md:grid-cols-3">{[["MON", "06:30", "FULL BODY / 60"],["WED", "18:45", "ENGINE / 45"],["SAT", "08:00", "CLUB RUN / 5K"]].map(([day,time,session])=><div className="bg-[#101112] p-6" key={day}><p className="text-xs font-bold text-[#b8ee3e]">{day}</p><p className="mt-14 text-4xl font-black tracking-[-.08em]">{time}</p><p className="mt-2 text-xs font-bold tracking-[.11em] text-white/60">{session}</p></div>)}</div></section>

    <section id="join" className="mx-3 mb-3 overflow-hidden rounded-sm bg-[#b8ee3e] px-5 py-16 text-[#101112] md:mx-6 md:px-10 md:py-24"><div className="grid gap-10 md:grid-cols-12"><p className="text-[10px] font-bold tracking-[.2em] md:col-span-3">[ BEGIN HERE ]</p><div className="md:col-span-9"><h2 className="max-w-4xl text-[13vw] font-black uppercase leading-[.79] tracking-[-.11em] md:text-[9vw]">YOUR NEXT<br/>REP STARTS<br/>HERE.</h2><a href="mailto:hello@byce.club?subject=BYCE%20trial" className="mt-12 inline-flex items-center gap-4 rounded-full bg-[#101112] px-7 py-4 text-xs font-bold tracking-[.14em] text-[#f3f0e8]">BOOK A FIRST SESSION <ArrowUpRight size={17}/></a></div></div></section>
    <footer className="flex flex-col gap-6 px-5 py-8 text-[10px] font-bold tracking-[.13em] text-white/50 md:flex-row md:items-center md:justify-between md:px-10"><span>© 2026 BYCE TRAINING CLUB</span><span>CHENNAI / IN</span><span>INSTAGRAM · WHATSAPP</span></footer>
  </main>;
}
