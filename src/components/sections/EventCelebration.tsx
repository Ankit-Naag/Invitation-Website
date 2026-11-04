"use client";

import { eventConfig } from "@/config/event";
import { Bloom, Branch, Icon, type IconName } from "@/components/ornaments/Botanical";
import { Reveal, SectionHeading } from "@/components/ui/Reveal";
import { coupleNames, dayOfMonth, googleCalendarUrl, longDate, monthName, timeRangeLabel, year } from "@/lib/event";

export function EventCelebration() {
  const { event, venue } = eventConfig;
  const rows: { icon: IconName; label: string; value: string | null }[] = [
    { icon: "rings", label: "Event", value: event.name },
    { icon: "letter", label: "Couple", value: coupleNames },
    { icon: "calendar", label: "Date", value: longDate },
    { icon: "clock", label: "Time", value: timeRangeLabel },
    { icon: "pin", label: "Venue", value: [venue.name, venue.locality].filter(Boolean).join(", ") || null },
  ];

  return (
    <section id="celebration" aria-labelledby="celebration-title" className="section">
      <SectionHeading id="celebration-title" title="Let’s celebrate together" />

      <Reveal className="mt-10 text-center" delay={0.1}>
        <p className="flex items-baseline justify-center gap-3 text-ink sm:gap-5" aria-label={longDate}>
          <span className="font-numeral text-[clamp(4rem,3rem+6vw,7.5rem)] leading-none">{dayOfMonth}</span>
          <span className="script text-[clamp(2rem,1.5rem+2.5vw,3.5rem)] text-burgundy">{monthName}</span>
          <span className="font-numeral text-[clamp(1.4rem,1rem+1.6vw,2.2rem)] tracking-[0.2em] text-brown">{year}</span>
        </p>
      </Reveal>

      <Reveal className="mx-auto mt-12 max-w-xl" delay={0.2}>
        <article className="double-frame relative overflow-hidden rounded-[18px] px-6 pb-8 pt-8 sm:px-12 sm:pb-10 sm:pt-10">
          <svg viewBox="0 0 120 50" className="mx-auto -mt-3 mb-1 block w-28" aria-hidden="true">
            <Branch curve={[[60, 30], [44, 22], [26, 26], [6, 16]]} leaves={5} leafSize={14} buds={false} />
            <Branch curve={[[60, 30], [76, 22], [94, 26], [114, 16]]} leaves={5} leafSize={14} buds={false} delay={0.1} />
            <Bloom cx={60} cy={28} r={16} delay={0.5} />
          </svg>

          <h3 className="sr-only">Event details</h3>
          <dl className="relative divide-y divide-gold/25">
            {rows
              .filter((r) => r.value)
              .map((r) => (
                <div key={r.label} className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3 py-4 sm:grid-cols-[2.5rem_7rem_minmax(0,1fr)] sm:items-center">
                  <span className="row-span-2 mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 text-gold-deep sm:row-span-1 sm:mt-0">
                    <Icon name={r.icon} className="h-[1.1rem] w-[1.1rem]" />
                  </span>
                  <dt className="label text-[0.65rem]">{r.label}</dt>
                  <dd className="font-display text-[1.25rem] leading-snug text-ink sm:text-[1.3rem]">{r.value}</dd>
                </div>
              ))}
          </dl>

          <div className="relative mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <a className="btn btn-primary" href={googleCalendarUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="calendar" className="h-4 w-4" />
              Google Calendar
            </a>
            <a className="btn btn-ghost" href="/engagement.ics" download="ankit-sakshi-engagement.ics">
              <Icon name="calendar" className="h-4 w-4" />
              Apple / Outlook
            </a>
          </div>
        </article>
      </Reveal>
    </section>
  );
}
