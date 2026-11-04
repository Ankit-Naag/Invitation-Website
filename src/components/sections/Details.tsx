import type { ReactNode } from "react";
import { eventConfig } from "@/config/event";
import { Icon, type IconName } from "@/components/ornaments/Botanical";
import { Reveal, SectionHeading } from "@/components/ui/Reveal";
import { directionsUrl, longDate, timeRangeLabel } from "@/lib/event";

type Item = { icon: IconName; title: string; body: ReactNode };

/** Builds only the cards whose information has been confirmed in the config. */
function confirmedItems(): Item[] {
  const { venue, details, contact, rsvp } = eventConfig;
  const items: (Item | null)[] = [
    timeRangeLabel
      ? {
          icon: "clock",
          title: "Celebration hours",
          body: (
            <>
              <span className="block font-display text-[1.45rem] text-ink">{timeRangeLabel}</span>
              <span className="mt-1 block">{longDate} (IST)</span>
            </>
          ),
        }
      : null,
    venue.name || venue.address
      ? {
          icon: "pin",
          title: "Venue",
          body: (
            <>
              {venue.name && <span className="block font-display text-[1.45rem] text-ink">{venue.name}</span>}
              {venue.address && <span className="mt-1 block">{venue.address}</span>}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-burgundy underline decoration-gold/60 underline-offset-4"
              >
                Plan your route
              </a>
            </>
          ),
        }
      : null,
    details.dressCode ? { icon: "dress", title: "Dress code", body: details.dressCode } : null,
    details.parking ? { icon: "car", title: "Parking", body: details.parking } : null,
    contact.name || contact.phone
      ? {
          icon: "phone",
          title: "Questions?",
          body: (
            <>
              {contact.name && <span className="block font-display text-[1.35rem] text-ink">{contact.name}</span>}
              {contact.phone && (
                <a className="mt-1 inline-block underline decoration-gold/60 underline-offset-4" href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>
                  {contact.phone}
                </a>
              )}
            </>
          ),
        }
      : null,
    rsvp.respondBy ? { icon: "letter", title: "Kindly reply by", body: rsvp.respondBy } : null,
    details.familyNote ? { icon: "rings", title: "A note from the family", body: details.familyNote } : null,
  ];
  return items.filter((i): i is Item => i !== null);
}

export function Details() {
  const items = confirmedItems();
  if (!items.length) return null;
  const cols = items.length === 1 ? "max-w-md" : items.length === 2 ? "max-w-3xl sm:grid-cols-2" : "max-w-5xl sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section id="details" aria-labelledby="details-title" className="section">
      <SectionHeading id="details-title" title="Every little detail" />
      <ul className={`mx-auto mt-14 grid gap-5 ${cols}`}>
        {items.map((item, i) => (
          <Reveal as="li" key={item.title} delay={i * 0.08} className="list-none">
            <div className="double-frame flex h-full flex-col items-center rounded-[16px] px-7 py-9 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-gold-deep">
                <Icon name={item.icon} className="h-5 w-5" />
              </span>
              <h3 className="label mt-5">{item.title}</h3>
              <div className="mt-3 max-w-[30ch] text-[0.95rem] leading-relaxed text-brown">{item.body}</div>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
