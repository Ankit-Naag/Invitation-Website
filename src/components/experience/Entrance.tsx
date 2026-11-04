"use client";

import {
  motion,
  useAnimate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type DOMKeyframesDefinition,
} from "motion/react";
import { useEffect, useId, useState, type PointerEvent } from "react";
import { eventConfig } from "@/config/event";
import { CornerFloral, LotusDivider } from "@/components/ornaments/Botanical";
import { useExperience } from "./ExperienceProvider";
import { WaxSeal } from "./WaxSeal";
import { SoundIcon } from "./MusicToggle";

const SILK = [0.22, 1, 0.36, 1] as const;
const PAPER = [0.65, 0, 0.35, 1] as const;

type Phase = "sealed" | "opening" | "gone";

export function Entrance() {
  const { markOpened, soundOn, toggleSound, resumeIfOptedIn, sfx } = useExperience();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("sealed");
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const uid = useId().replace(/:/g, "");
  const { partnerOne, partnerTwo } = eventConfig.couple;

  // Gentle 3D tilt that follows the pointer (fine pointers only).
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const tiltX = useSpring(rx, { stiffness: 120, damping: 18, mass: 0.6 });
  const tiltY = useSpring(ry, { stiffness: 120, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (phase === "gone") {
      document.documentElement.classList.remove("is-sealed");
      return;
    }
    document.documentElement.classList.add("is-sealed");
    return () => document.documentElement.classList.remove("is-sealed");
  }, [phase]);

  function onTilt(e: PointerEvent<HTMLDivElement>) {
    if (reduce || phase !== "sealed" || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 10);
    rx.set(-py * 8);
  }
  function resetTilt() {
    rx.set(0);
    ry.set(0);
  }

  async function open() {
    if (phase !== "sealed") return;
    setPhase("opening");
    // Audio must start inside the gesture.
    sfx.paper();
    resumeIfOptedIn();
    resetTilt();

    const go = (sel: string, kf: DOMKeyframesDefinition, duration: number, ease: readonly number[] = SILK, delay = 0) =>
      animate(sel, kf, { duration, ease: [...ease] as [number, number, number, number], delay });

    try {
      if (reduce) {
        markOpened();
        await animate(scope.current, { opacity: 0 }, { duration: 0.5 });
      } else {
        // 1 · break the seal, quiet the copy
        await Promise.all([
          go(".seal-l", { x: -22, y: 6, rotate: -16, opacity: 0 }, 0.6),
          go(".seal-r", { x: 22, y: 8, rotate: 14, opacity: 0 }, 0.6),
          go(".seal-hint", { opacity: 0 }, 0.3),
          go(".entrance-copy", { opacity: 0, y: 8 }, 0.45),
        ]);
        // 2 · lift the flap
        await go(".flap", { rotateX: 180 }, 0.85, PAPER);
        const flap = scope.current.querySelector<HTMLElement>(".flap");
        if (flap) flap.style.zIndex = "1";
        // 3 · the card slides out
        await go(".env-card", { y: "-58%" }, 0.95, SILK);
        // 4 · cinematic hand-off: card comes forward, envelope settles away
        markOpened();
        await Promise.all([
          go(".env-card", { y: "-40%", scale: 1.35, opacity: 0 }, 1.1, SILK, 0.15),
          go(".env-shell", { y: 70, opacity: 0, scale: 0.96 }, 0.9, SILK, 0.1),
          go(".entrance-florals", { opacity: 0, scale: 1.06 }, 1.1, SILK),
          animate(scope.current, { opacity: 0 }, { duration: 0.9, delay: 0.45, ease: [...SILK] }),
        ]);
      }
    } finally {
      window.scrollTo({ top: 0 });
      setPhase("gone");
    }
  }

  if (phase === "gone") return null;

  return (
    <div
      ref={scope}
      className="js-only fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-ivory"
      style={{ backgroundImage: "var(--paper-grain), var(--paper-fibres)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${uid}-title`}
    >
      {/* soft vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 45%, transparent 55%, rgba(184,155,114,0.16) 100%)",
        }}
      />

      <div className="entrance-florals pointer-events-none absolute inset-0" aria-hidden="true">
        <CornerFloral play delay={0.2} className="animate-sway absolute left-0 top-0 w-32 sm:w-52 lg:w-64" />
        <CornerFloral play delay={0.35} flip="x" className="absolute right-0 top-0 w-32 sm:w-52 lg:w-64" />
        <CornerFloral play delay={0.5} flip="y" className="absolute bottom-0 left-0 w-28 sm:w-48 lg:w-60" />
        <CornerFloral play delay={0.65} flip="xy" className="absolute bottom-0 right-0 w-28 sm:w-48 lg:w-60" />
      </div>

      <div
        className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center gap-[clamp(1.25rem,3.5svh,2.5rem)] px-5 text-center"
        style={{
          paddingTop: "max(3.5rem, calc(env(safe-area-inset-top) + 2.5rem))",
          paddingBottom: "max(2.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))",
        }}
      >
        <motion.p
          className="entrance-copy script text-[clamp(1.45rem,1.1rem+1.6vw,2.15rem)] leading-snug text-brown"
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, delay: 0.3, ease: SILK }}
        >
          A little invitation,
          <br />a lifetime of memories.
        </motion.p>

        {/* ── Envelope ─────────────────────────────────────────── */}
        <motion.div
          className="env-shell relative w-[min(86vw,34rem)]"
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.3, delay: 0.5, ease: SILK }}
          onPointerMove={onTilt}
          onPointerLeave={resetTilt}
        >
          <div className="animate-drift" style={{ perspective: 1400 }}>
            <motion.div
              className="relative aspect-[3/2] w-full cursor-pointer"
              style={{ rotateX: tiltX, rotateY: tiltY, perspective: 1100 }}
              onClick={open}
              aria-hidden="true"
            >
              <EnvelopeBack id={uid} />

              {/* the invitation card inside */}
              <div className="env-card absolute inset-x-[5%] top-[5%] z-[2] h-[90%]">
                <div className="double-frame flex h-full flex-col items-center px-[6%] pt-[7%] text-center">
                  <span className="label text-[clamp(0.5rem,1.4vw,0.65rem)]">Together with their families</span>
                  <span className="script mt-[3%] text-[clamp(1.6rem,6.2vw,3rem)] leading-[0.95] text-ink">
                    {partnerOne}
                    <span className="mx-[0.25em] text-gold">&amp;</span>
                    {partnerTwo}
                  </span>
                  <LotusDivider play className="mt-[3%] w-[55%]" width={240} />
                </div>
              </div>

              <EnvelopeFront id={uid} />
              <EnvelopeFlap id={uid} />

              {/* wax seal at the flap tip */}
              <div className="absolute left-1/2 top-[56%] z-[6] aspect-square w-[22%] -translate-x-1/2 -translate-y-1/2">
                <span className="seal-hint absolute -inset-[14%]">
                  <span
                    className="reduce-still absolute inset-0 rounded-full border border-gold/50"
                    style={{ animation: "hint-pulse 2.8s ease-in-out infinite" }}
                  />
                </span>
                <div className="seal-l absolute inset-0">
                  <WaxSeal id={`${uid}-sl`} half="l" />
                </div>
                <div className="seal-r absolute inset-0">
                  <WaxSeal id={`${uid}-sr`} half="r" shimmer={false} />
                </div>
              </div>
            </motion.div>
          </div>
          {/* contact shadow */}
          <div
            aria-hidden="true"
            className="absolute -bottom-6 left-[8%] right-[8%] h-10 rounded-[50%] bg-brown/25 blur-2xl"
          />
        </motion.div>

        <motion.div
          className="entrance-copy flex flex-col items-center gap-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: SILK }}
        >
          <div>
            <p className="label">An invitation from</p>
            <p id={`${uid}-title`} className="engraved mt-2 text-[clamp(1.25rem,1rem+1.2vw,1.75rem)]">
              {partnerOne} &amp; {partnerTwo}
            </p>
          </div>

          <button type="button" onClick={open} className="btn btn-primary" disabled={phase !== "sealed"}>
            Open your invitation
          </button>

          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.78rem] tracking-[0.08em] text-brown transition-colors hover:text-burgundy"
          >
            <SoundIcon on={soundOn} muted={!soundOn} />
            {soundOn ? "Music on · tap to mute" : "Music off · tap to play"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Envelope parts (viewBox 300×200, stretched to the 3:2 box) ─────────── */

function LinerPattern({ id }: { id: string }) {
  return (
    <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="14" height="14" fill="#713E49" />
      <path d="M7 2 L9 7 L7 12 L5 7Z" fill="none" stroke="#D9BE93" strokeOpacity="0.45" strokeWidth="0.6" />
      <circle cx="0" cy="0" r="0.9" fill="#D9BE93" fillOpacity="0.5" />
      <circle cx="14" cy="14" r="0.9" fill="#D9BE93" fillOpacity="0.5" />
    </pattern>
  );
}

function EnvelopeBack({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 300 200"
      preserveAspectRatio="none"
      className="absolute inset-0 z-[1] h-full w-full rounded-[6px]"
      style={{ boxShadow: "0 24px 50px -24px rgba(85,43,52,0.45), 0 8px 18px -10px rgba(102,87,77,0.35)" }}
    >
      <defs>
        <LinerPattern id={`${id}-liner-b`} />
        <linearGradient id={`${id}-inner`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="300" height="200" rx="5" fill="#E7D2C9" />
      <rect x="6" y="5" width="288" height="190" rx="3" fill={`url(#${id}-liner-b)`} />
      <rect x="6" y="5" width="288" height="190" rx="3" fill={`url(#${id}-inner)`} />
    </svg>
  );
}

function EnvelopeFront({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 300 200"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-[3] h-full w-full"
    >
      <defs>
        <linearGradient id={`${id}-side`} x1="0" x2="1">
          <stop offset="0" stopColor="#EAD8CF" />
          <stop offset="1" stopColor="#E3CCC2" />
        </linearGradient>
        <linearGradient id={`${id}-side-r`} x1="1" x2="0">
          <stop offset="0" stopColor="#E8D5CC" />
          <stop offset="1" stopColor="#DFC7BC" />
        </linearGradient>
        <linearGradient id={`${id}-bottom`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#EFDFD7" />
          <stop offset="1" stopColor="#E8D4CB" />
        </linearGradient>
      </defs>
      {/* side flaps */}
      <path d="M0 0 L148 108 Q150 110 148 112 L0 200Z" fill={`url(#${id}-side)`} />
      <path d="M300 0 L152 108 Q150 110 152 112 L300 200Z" fill={`url(#${id}-side-r)`} />
      {/* bottom flap */}
      <path
        d="M0 200 L138 100 Q150 92 162 100 L300 200Z"
        fill={`url(#${id}-bottom)`}
        stroke="rgba(102,87,77,0.18)"
        strokeWidth="0.6"
        vectorEffect="non-scaling-stroke"
      />
      {/* gilded hairline on the bottom flap edge */}
      <path
        d="M4 197 L138 103 Q150 95 162 103 L296 197"
        fill="none"
        stroke="#B89B72"
        strokeOpacity="0.7"
        strokeWidth="0.8"
        vectorEffect="non-scaling-stroke"
      />
      <rect width="300" height="200" rx="5" fill="none" stroke="rgba(102,87,77,0.12)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function EnvelopeFlap({ id }: { id: string }) {
  const tri = "M0 0 H300 L163 112 Q150 122 137 112 Z";
  return (
    <div
      className="flap absolute inset-x-0 top-0 z-[5] h-[60%]"
      style={{ transformOrigin: "50% 0%", transformStyle: "preserve-3d" }}
    >
      {/* outside */}
      <svg
        viewBox="0 0 300 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", filter: "drop-shadow(0 4px 5px rgba(85,43,52,0.18))" }}
      >
        <defs>
          <linearGradient id={`${id}-flap`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E6D0C6" />
            <stop offset="1" stopColor="#EEDDD5" />
          </linearGradient>
        </defs>
        <path d={tri} fill={`url(#${id}-flap)`} />
        <path
          d="M3 1.5 L162 111 Q150 120 138 111 L297 1.5"
          fill="none"
          stroke="#B89B72"
          strokeWidth="0.9"
          strokeOpacity="0.85"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* inside (liner) */}
      <svg
        viewBox="0 0 300 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
        style={{ transform: "rotateX(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
      >
        <defs>
          <LinerPattern id={`${id}-liner-f`} />
        </defs>
        {/* drawn mirrored: this face is flipped twice (its own rotateX + the flap's) */}
        <path d="M0 120 H300 L163 8 Q150 -2 137 8 Z" fill="#E7D2C9" />
        <path d="M8 116 H292 L161 14 Q150 6 139 14Z" fill={`url(#${id}-liner-f)`} />
      </svg>
    </div>
  );
}
