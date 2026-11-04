"use client";

import { useState } from "react";
import { eventConfig } from "@/config/event";
import { Bloom, Branch, CornerFloral, Icon, LotusDivider } from "@/components/ornaments/Botanical";
import { ArchCard } from "@/components/ui/ArchCard";
import { GoldDust } from "@/components/ui/GoldDust";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";

type ShareState = "idle" | "shared" | "copied" | "error";

export function Closing() {
  const { partnerOne, partnerTwo } = eventConfig.couple;
  const [share, setShare] = useState<ShareState>("idle");

  async function onShare() {
    const url = window.location.href.split("#")[0];
    const data = { title: eventConfig.share.title, text: eventConfig.share.text, url };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
        await navigator.share(data);
        setShare("shared");
      } else {
        await navigator.clipboard.writeText(`${data.text}\n${url}`);
        setShare("copied");
      }
    } catch (err) {
      // The guest closing the share sheet is not an error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setShare("copied");
      } catch {
        setShare("error");
      }
    }
    window.setTimeout(() => setShare("idle"), 3000);
  }

  return (
    <section id="closing" aria-labelledby="closing-title" className="section relative overflow-hidden pb-16">
      <GoldDust />

      <div className="relative mx-auto max-w-[30rem]">
        {/* blooms flanking the card */}
        <svg viewBox="0 0 220 300" className="pointer-events-none absolute -left-24 top-[30%] hidden w-48 sm:block" aria-hidden="true">
          <Branch curve={[[210, 290], [150, 220], [160, 120], [60, 20]]} leaves={9} leafSize={30} />
          <Bloom cx={168} cy={196} r={30} delay={0.6} />
        </svg>
        <svg viewBox="0 0 220 300" className="pointer-events-none absolute -right-24 top-[45%] hidden w-48 sm:block" style={{ transform: "scale(-1,1)" }} aria-hidden="true">
          <Branch curve={[[210, 290], [140, 230], [170, 110], [70, 30]]} leaves={8} leafSize={28} delay={0.2} />
          <Bloom cx={156} cy={150} r={22} delay={0.9} />
        </svg>

        <ArchCard
          cap={
            <svg viewBox="0 0 100 60" className="w-[22cqw]" aria-hidden="true">
              <Bloom cx={50} cy={34} r={22} />
            </svg>
          }
        >
          <Stagger className="flex flex-col items-center text-center" gap={0.25}>
            <StaggerItem as="p" className="script text-[clamp(1.45rem,7cqw,2.1rem)] leading-snug text-ink">
              Some beginnings are beautiful.
              <br />
              Ours becomes even more special with you.
            </StaggerItem>
            <StaggerItem className="mt-8 w-full">
              <LotusDivider width={240} className="mx-auto" />
            </StaggerItem>
            <StaggerItem as="p" className="label mt-7">
              With love,
            </StaggerItem>
            <StaggerItem>
              <h2 id="closing-title" className="script mt-2 text-[clamp(2.4rem,13cqw,3.9rem)] leading-none text-burgundy">
                {partnerOne} <span className="text-gold">&amp;</span> {partnerTwo}
              </h2>
            </StaggerItem>
          </Stagger>
        </ArchCard>
        <CornerFloral flip="y" className="pointer-events-none absolute -bottom-8 -left-8 w-28 sm:w-32" />
        <CornerFloral flip="xy" className="pointer-events-none absolute -bottom-8 -right-8 w-28 sm:w-32" />
      </div>

      <Reveal className="relative mt-16 flex flex-col items-center gap-4" delay={0.2}>
        <button type="button" onClick={onShare} className="btn btn-primary">
          <Icon name={share === "copied" || share === "shared" ? "check" : "share"} className="h-4 w-4" />
          {share === "copied" ? "Link copied" : share === "shared" ? "Shared with love" : "Share this invitation"}
        </button>
        <p className="sr-only" aria-live="polite">
          {share === "copied" ? "Invitation link copied to clipboard" : share === "error" ? "Sharing is unavailable on this device" : ""}
        </p>
        {share === "error" && <p className="text-sm text-burgundy">Sharing isn&rsquo;t available here — copy the link from your browser bar.</p>}

        <a href="#invitation" className="group mt-10 flex flex-col items-center gap-2 text-brown hover:text-burgundy">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 transition-transform duration-500 group-hover:-translate-y-1">
            <Icon name="arrow-up" className="h-4 w-4" />
          </span>
          <span className="label text-[0.62rem]">Back to the top</span>
        </a>
      </Reveal>
    </section>
  );
}
