"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
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

      <motion.a
        href="#save-the-date"
        {...show(2.8)}
        className="group mt-14 flex flex-col items-center gap-3 text-brown"
      >
        <span className="label">Scroll to continue</span>
        <span className="relative block h-12 w-px overflow-hidden bg-gold/30" aria-hidden="true">
          <motion.span
            className="absolute inset-x-0 top-0 block h-1/2 bg-gold"
            animate={opened && !reduce ? { y: ["-100%", "200%"] } : undefined}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          />
        </span>
      </motion.a>
    </section>
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
