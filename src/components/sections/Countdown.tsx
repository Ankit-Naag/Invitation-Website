"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { SectionHeading, SILK, Reveal } from "@/components/ui/Reveal";
import { LotusDivider } from "@/components/ornaments/Botanical";
import {
  eventDayStart,
  eventEnd,
  eventStart,
  hasStartTime,
  longDate,
  startTimeLabel,
} from "@/lib/event";
import { eventConfig } from "@/config/event";

/* ── A shared one-second clock (single interval for any number of readers) ── */

let now = 0;
const listeners = new Set<() => void>();
let timer: number | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (timer === null) {
    now = Date.now();
    timer = window.setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}
const getSnapshot = () => (now === 0 ? (now = Date.now()) : now);
/** Server render has no clock: components show a neutral placeholder. */
const getServerSnapshot = () => null;

type Status =
  | { kind: "pending" }
  | { kind: "counting"; days: number; hours: number; minutes: number; seconds: number }
  | { kind: "days-only"; days: number }
  | { kind: "today" }
  | { kind: "live" }
  | { kind: "after" };

function statusAt(t: number | null): Status {
  if (t === null) return { kind: "pending" };
  if (t >= eventEnd.getTime()) return { kind: "after" };
  if (!hasStartTime) {
    if (t >= eventDayStart.getTime()) return { kind: "today" };
    // whole calendar days remaining in the event's timezone
    const days = Math.ceil((eventDayStart.getTime() - t) / 86_400_000);
    return { kind: "days-only", days };
  }
  if (t >= eventStart.getTime()) return { kind: "live" };
  const diff = Math.floor((eventStart.getTime() - t) / 1000);
  return {
    kind: "counting",
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
  };
}

export function Countdown() {
  const t = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const status = statusAt(t);
  const done = status.kind === "live" || status.kind === "after" || status.kind === "today";

  return (
    <section id="countdown" aria-labelledby="countdown-title" className="section bg-champagne/45">
      <SectionHeading
        id="countdown-title"
        title={done ? "The day is here" : "The countdown to forever"}
        lead="Every moment brings us closer to celebrating with you."
      />

      <div className="mx-auto mt-14 max-w-3xl">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: SILK }}
              className="text-center"
            >
              <p className="script text-[clamp(2rem,1.4rem+3vw,3.4rem)] leading-tight text-burgundy">
                {status.kind === "after"
                  ? "Thank you for celebrating with us"
                  : "Today, we celebrate together"}
              </p>
              <p className="prose-serif mx-auto mt-4 max-w-[36ch]">
                {status.kind === "after"
                  ? `${eventConfig.couple.partnerOne} & ${eventConfig.couple.partnerTwo} are grateful for every blessing, every smile and every one of you.`
                  : "Your blessings are the most beautiful gift. We’re so glad you are here."}
              </p>
            </motion.div>
          ) : status.kind === "days-only" ? (
            <motion.ol key="days" className="flex justify-center" aria-label="Days remaining until the engagement">
              <Unit value={status.days} label={status.days === 1 ? "Day to go" : "Days to go"} wide />
            </motion.ol>
          ) : (
            <motion.ol
              key="count"
              className="grid grid-cols-4 gap-2.5 sm:gap-5"
              aria-label="Time remaining until the engagement"
            >
              <Unit value={status.kind === "counting" ? status.days : null} label="Days" />
              <Unit value={status.kind === "counting" ? status.hours : null} label="Hours" />
              <Unit value={status.kind === "counting" ? status.minutes : null} label="Minutes" />
              <Unit value={status.kind === "counting" ? status.seconds : null} label="Seconds" />
            </motion.ol>
          )}
        </AnimatePresence>

        {!done && (
          <Reveal className="mt-10 flex flex-col items-center gap-3 text-center" delay={0.2}>
            <LotusDivider width={200} />
            <p className="text-sm tracking-[0.04em] text-brown">
              {longDate}
              {hasStartTime && startTimeLabel ? `, ${startTimeLabel} IST` : ""}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function Unit({
  value,
  label,
  wide,
}: {
  value: number | null;
  label: string;
  wide?: boolean;
}) {
  const text = value === null ? "––" : String(value).padStart(2, "0");
  return (
    <li
      className={`double-frame relative flex list-none flex-col items-center justify-center overflow-hidden rounded-[12px] py-5 sm:py-8 ${wide ? "min-w-[12rem] px-10" : ""}`}
    >
      <span
        className="relative block h-[1.1em] overflow-hidden font-numeral text-[clamp(2rem,7.5vw,4rem)] leading-[1.1] text-ink tabular-nums"
        aria-hidden="true"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            className="block"
            initial={{ y: "60%", opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-60%", opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.6, ease: SILK }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="sr-only">
        {value === null ? "" : `${value} ${label}`}
      </span>
      <span className="label mt-2 text-[0.58rem] tracking-[0.18em] sm:text-[0.68rem]">{label}</span>
    </li>
  );
}
