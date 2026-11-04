"use client";

import Image, { type StaticImageData } from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { eventConfig } from "@/config/event";
import childhood from "@/assets/childhood.jpeg";
import { ArchClipDefs, ArchOutline, Bloom, Branch } from "@/components/ornaments/Botanical";
import { SectionHeading, SILK, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { shortDate } from "@/lib/event";

/** Map config gallery ids to statically imported (optimised) files. */
const PHOTOS: Record<string, StaticImageData> = { childhood };

const CHAPTERS = [
  {
    title: "Two little smiles",
    body: "Long before this invitation, two little hearts were already growing into the people they would become.",
  },
  {
    title: "Two families, one blessing",
    body: "With the love and blessings of our families, two paths have come together as one.",
  },
  {
    title: "Forever begins",
    body: `On ${shortDate}, we take our first promise — and we would love for you to be there.`,
  },
];

export function OurStory() {
  const { partnerOne, partnerTwo } = eventConfig.couple;
  const photo = eventConfig.gallery.find((g) => PHOTOS[g.id]);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-4%", "4%"]);
  const frameY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [24, -24]);

  return (
    <section id="our-story" aria-labelledby="our-story-title" className="section overflow-hidden">
      <SectionHeading
        id="our-story-title"
        title="The beginning of our forever"
      />

      <div
        ref={ref}
        className={`mx-auto mt-16 grid max-w-5xl items-center gap-14 md:gap-20 ${photo ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]" : ""}`}
      >
        {photo && (
          <figure className="relative mx-auto w-full max-w-[21rem] md:max-w-none">
            <ArchClipDefs id="story-arch" />
            {/* offset outer arch, moves a touch slower than the photo */}
            <motion.div style={{ y: frameY }} className="pointer-events-none absolute -inset-3 sm:-inset-4" aria-hidden="true">
              <ArchOutline className="h-full w-full" delay={0.2} />
            </motion.div>

            <motion.div
              className="relative aspect-[3/4] w-full"
              initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
              whileInView={{ clipPath: "inset(0% 0 0 0)" }}
              viewport={{ once: true, margin: "0px 0px -15% 0px" }}
              transition={{ duration: 1.6, ease: SILK }}
            >
              {/* the arch clip lives on an inner layer so the reveal (inset) can animate independently */}
              <div className="absolute inset-0 overflow-hidden bg-[#cbbca6]" style={{ clipPath: "url(#story-arch)" }}>
                <motion.div style={{ y: imgY }} className="absolute inset-x-0 top-[6%] -bottom-[14%]">
                  <Image
                    src={PHOTOS[photo.id]}
                    alt={photo.alt}
                    fill
                    // fetch at page load (while the entrance screen is up) instead of lazily on scroll
                    loading="eager"
                    onLoad={() => setLoaded(true)}
                    sizes="(min-width: 1024px) 420px, (min-width: 768px) 40vw, 21rem"
                    className={`object-cover object-[50%_0%] [filter:saturate(0.92)_sepia(0.1)] transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
                  />
                </motion.div>
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ boxShadow: "inset 0 0 60px rgba(102,87,77,0.28)" }}
                />
              </div>
            </motion.div>

            <svg viewBox="0 0 200 120" className="pointer-events-none absolute -bottom-10 -left-10 w-36 sm:w-44" aria-hidden="true">
              <Branch curve={[[6, 114], [40, 80], [80, 70], [190, 60]]} leaves={7} leafSize={24} delay={0.8} />
              <Bloom cx={40} cy={88} r={22} delay={1.2} />
            </svg>

            {photo.caption && (
              <figcaption className="script mt-8 text-center text-[1.5rem] text-brown">{photo.caption}</figcaption>
            )}
          </figure>
        )}

        <div className={`flex flex-col ${photo ? "items-center text-center md:items-start md:text-left" : "items-center text-center"}`}>
          <Stagger className="flex flex-col gap-1" gap={0.35}>
            {["Some moments become memories.", "Some memories become stories.", "And some stories become forever."].map(
              (line) => (
                <StaggerItem
                  key={line}
                  as="p"
                  className="script text-[clamp(1.55rem,1.2rem+1.5vw,2.25rem)] leading-snug text-ink"
                >
                  {line}
                </StaggerItem>
              ),
            )}
          </Stagger>

          <Stagger className="mt-12 w-full max-w-md" gap={0.18} delay={0.2}>
            <StaggerItem as="p" className="engraved text-[clamp(1.05rem,0.95rem+0.5vw,1.3rem)] text-burgundy">
              {partnerOne} &amp; {partnerTwo}
            </StaggerItem>
            <ol className="relative mt-8 space-y-8 border-l border-gold/50 pl-7 text-left">
              {CHAPTERS.map((c) => (
                <StaggerItem as="li" key={c.title} className="relative list-none">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[calc(1.75rem+5px)] top-[0.45rem] block h-[9px] w-[9px] rotate-45 border border-gold bg-ivory"
                  />
                  <h3 className="font-display text-[1.35rem] font-medium leading-tight text-ink">{c.title}</h3>
                  <p className="mt-1.5 text-[0.95rem] leading-relaxed text-brown">{c.body}</p>
                </StaggerItem>
              ))}
            </ol>
          </Stagger>
        </div>
      </div>
    </section>
  );
}
