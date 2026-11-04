"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { eventConfig } from "@/config/event";
import { Bloom, Branch, LotusDivider } from "@/components/ornaments/Botanical";
import { ArchCard } from "@/components/ui/ArchCard";
import { useExperience } from "@/components/experience/ExperienceProvider";
import { SILK, inkIn } from "@/components/ui/Reveal";

function Letters({ word, start, play }: { word: string; start: number; play: boolean }) {
  return (
    <span aria-hidden="true" className="inline-block whitespace-nowrap">
      {[...word].map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: "0.35em", filter: "blur(8px)" }}
          animate={play ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          transition={{ duration: 1.1, delay: start + i * 0.07, ease: SILK }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

export function Invitation() {
  const { opened } = useExperience();
  const { partnerOne, partnerTwo } = eventConfig.couple;
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const floraY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -90]);
  const floraY2 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -40]);
  const nudge = useScrollNudge(opened, !!reduce);

  const show = (delay: number) => ({
    variants: inkIn,
    initial: "hidden" as const,
    animate: opened ? ("show" as const) : ("hidden" as const),
    transition: { duration: 1.2, delay, ease: SILK },
  });

  return (
    <section
      ref={ref}
      id="invitation"
      aria-labelledby="couple-names"
      className="section relative flex min-h-svh flex-col items-center justify-center overflow-hidden"
      style={{ paddingTop: "max(4rem, calc(env(safe-area-inset-top) + 2rem))" }}
    >
      {/* side botanicals — desktop composition */}
      <motion.div style={{ y: floraY }} className="pointer-events-none absolute -left-10 top-[12%] hidden w-[22rem] md:block" aria-hidden="true">
        <svg viewBox="0 0 300 420" className="w-full">
          <Branch curve={[[10, 410], [60, 300], [40, 160], [150, 20]]} leaves={10} leafSize={34} play={opened} delay={0.8} />
          <Branch curve={[[40, 300], [110, 270], [150, 230], [210, 220]]} leaves={5} leafSize={24} play={opened} delay={1.1} />
          <Bloom cx={70} cy={250} r={38} play={opened} delay={1.4} />
          <Bloom cx={148} cy={92} r={18} play={opened} delay={1.7} />
        </svg>
      </motion.div>
      <motion.div style={{ y: floraY2 }} className="pointer-events-none absolute -right-12 bottom-[8%] hidden w-[20rem] md:block" aria-hidden="true">
        <svg viewBox="0 0 300 420" className="w-full" style={{ transform: "scale(-1,1)" }}>
          <Branch curve={[[10, 410], [70, 330], [30, 200], [160, 80]]} leaves={9} leafSize={32} play={opened} delay={1} />
          <Bloom cx={58} cy={300} r={34} play={opened} delay={1.6} />
          <Bloom cx={120} cy={170} r={15} play={opened} delay={1.9} />
        </svg>
      </motion.div>

      <motion.div
        className="relative w-full max-w-[34rem]"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={opened ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ duration: 1.4, ease: SILK }}
      >
        <ArchCard
          cap={
            <motion.div {...show(0.5)} className="flex flex-col items-center" style={{ paddingBottom: "1cqw" }}>
              <Monogram />
            </motion.div>
          }
        >
          <div className="flex flex-col items-center pt-2 text-center">
            <motion.p {...show(0.7)} className="prose-serif max-w-[30ch] text-[clamp(1.08rem,0.95rem+0.6vw,1.3rem)]">
              With immense joy and the blessings of our families, we invite you to celebrate a beautiful new beginning.
            </motion.p>

            <h1
              id="couple-names"
              aria-label={`${partnerOne} and ${partnerTwo}`}
              className="script my-[clamp(1.5rem,6cqw,2.75rem)] flex flex-col items-center text-[clamp(3.6rem,17cqw,6.5rem)] leading-[0.92] text-ink"
            >
              <Letters word={partnerOne} start={1.0} play={opened} />
              <motion.span
                aria-hidden="true"
                className="my-[0.08em] text-[0.55em] text-gold"
                initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                animate={opened ? { opacity: 1, scale: 1, rotate: 0 } : undefined}
                transition={{ duration: 1.2, delay: 1.45, ease: SILK }}
              >
                &amp;
              </motion.span>
              <Letters word={partnerTwo} start={1.6} play={opened} />
            </h1>

            <LotusDivider play={opened} delay={2.1} width={260} />

            <motion.p {...show(2.3)} className="prose-serif mt-6 max-w-[30ch] text-[clamp(1.08rem,0.95rem+0.6vw,1.3rem)]">
              Together with our families, we invite you to be part of our engagement celebration.
            </motion.p>
          </div>
        </ArchCard>
      </motion.div>

      {opened && <ScrollCue show={nudge.cue} beat={nudge.beat} reduce={!!reduce} />}
    </section>
  );
}

const NUDGE_FIRST_DELAY = 3200;
const NUDGE_INTERVAL = 4200;
const NUDGE_MAX_BOUNCES = 6;
const NUDGE_DURATION = 1500;

/**
 * "Peek" nudge: once the invitation has settled, the whole page lifts a little
 * and drops back, hinting there is more below. Repeats a few times and stops for
 * good as soon as the guest scrolls. Any touch or wheel cancels the bounce in
 * progress so it never fights the guest's finger.
 *
 * Returns whether the scroll cue should be visible and a `beat` counter that
 * ticks on every bounce so the cue can move in time with the page.
 */
function useScrollNudge(play: boolean, reduce: boolean) {
  const [cue, setCue] = useState(false);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (!play) return;

    const main = document.getElementById("main");
    const canAnimate = !reduce && !!main && typeof main.animate === "function";

    let count = 0;
    let done = false;
    let anim: Animation | undefined;
    let timer: number | undefined;

    const bounce = () => {
      if (done) return;
      if (canAnimate) {
        anim = main!.animate(
          [
            { transform: "translate3d(0,0,0)", easing: "cubic-bezier(0.33,0,0.2,1)" },
            { transform: "translate3d(0,-48px,0)", offset: 0.32, easing: "cubic-bezier(0.5,0,0.75,0)" },
            { transform: "translate3d(0,0,0)", offset: 0.6, easing: "cubic-bezier(0.33,0,0.2,1)" },
            { transform: "translate3d(0,-16px,0)", offset: 0.78, easing: "cubic-bezier(0.5,0,0.75,0)" },
            { transform: "translate3d(0,0,0)" },
          ],
          { duration: NUDGE_DURATION },
        );
        setBeat((b) => b + 1);
        count += 1;
        if (count < NUDGE_MAX_BOUNCES) timer = window.setTimeout(bounce, NUDGE_INTERVAL);
      }
    };

    const cancelCurrent = () => anim?.cancel();
    const stop = () => {
      done = true;
      setCue(false);
      window.clearTimeout(timer);
      cancelCurrent();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", cancelCurrent);
      window.removeEventListener("wheel", cancelCurrent);
    };
    const onScroll = () => {
      if (window.scrollY > 40) stop();
    };

    if (window.scrollY > 40) return;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", cancelCurrent, { passive: true });
    window.addEventListener("wheel", cancelCurrent, { passive: true });
    timer = window.setTimeout(() => {
      if (done) return;
      setCue(true);
      bounce();
    }, NUDGE_FIRST_DELAY);
    return stop;
  }, [play, reduce]);

  return { cue, beat };
}

/**
 * Quiet "scroll down" hint at the foot of the screen — text and a chevron on a
 * soft ivory fade, no bubble. Portalled to <body> because <main> is transformed
 * during the bounce, which would otherwise drag a fixed element along with it.
 */
function ScrollCue({ show, beat, reduce }: { show: boolean; beat: number; reduce: boolean }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          key="scroll-cue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8, ease: SILK } }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center bg-gradient-to-t from-ivory via-ivory/80 to-transparent pt-12"
          style={{ paddingBottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))" }}
        >
          <a href="#save-the-date" className="pointer-events-auto flex flex-col items-center gap-1 px-4 py-1">
            <span className="label whitespace-nowrap">Scroll down</span>
            <motion.svg
              key={beat}
              viewBox="0 0 24 24"
              className="h-6 w-6 text-burgundy"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              initial={false}
              animate={reduce ? undefined : { y: [0, 9, 0, 4, 0] }}
              transition={{ duration: NUDGE_DURATION / 1000, times: [0, 0.32, 0.6, 0.78, 1], ease: "easeInOut" }}
            >
              <path d="M6 9l6 6 6-6" />
              <path d="M6 4l6 6 6-6" opacity="0.4" />
            </motion.svg>
          </a>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Monogram() {
  const { one, two } = eventConfig.couple.initials;
  return (
    <span className="relative flex aspect-square w-[16cqw] items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx="50" cy="50" r="47" fill="none" stroke="var(--color-gold)" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="var(--color-gold)" strokeOpacity="0.5" strokeWidth="0.6" />
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return <circle key={i} cx={(50 + Math.cos(a) * 45).toFixed(2)} cy={(50 + Math.sin(a) * 45).toFixed(2)} r="0.7" fill="var(--color-gold)" />;
        })}
      </svg>
      <span className="script relative text-[6.5cqw] leading-none text-burgundy">
        {one}
        <span className="mx-[0.06em] text-[0.6em] text-gold">&amp;</span>
        {two}
      </span>
    </span>
  );
}
