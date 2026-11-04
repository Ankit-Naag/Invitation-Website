import { eventConfig } from "@/config/event";

/**
 * Derived, formatted event facts. Pure functions only — safe on server and
 * client, and deterministic so they never cause hydration mismatches
 * (formatting always uses the event's own timezone, never the visitor's).
 */

const { event, couple, venue } = eventConfig;

export const coupleNames = `${couple.partnerOne} & ${couple.partnerTwo}`;

/** Absolute instant for a local event time, e.g. "2026-11-22T11:00:00+05:30". */
function toInstant(time: string): Date {
  return new Date(`${event.date}T${time}:00${event.utcOffset}`);
}

export const hasStartTime = event.startTime !== null;

/** Start of the celebration. Falls back to local midnight (date-only mode). */
export const eventStart: Date = toInstant(event.startTime ?? "00:00");
/** End of the celebration. Falls back to end of the local day. */
export const eventEnd: Date = event.endTime
  ? toInstant(event.endTime)
  : new Date(toInstant("00:00").getTime() + 24 * 60 * 60 * 1000);
/** Local midnight at the start of the event day (for date-only countdown). */
export const eventDayStart: Date = toInstant("00:00");

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: event.timezone, ...opts });

export const weekday = fmt({ weekday: "long" }).format(eventStart); // Sunday
export const dayOfMonth = fmt({ day: "numeric" }).format(eventStart); // 22
export const monthName = fmt({ month: "long" }).format(eventStart); // November
export const year = fmt({ year: "numeric" }).format(eventStart); // 2026
/** "Sunday, 22 November 2026" */
export const longDate = `${weekday}, ${dayOfMonth} ${monthName} ${year}`;
/** "22 November 2026" */
export const shortDate = `${dayOfMonth} ${monthName} ${year}`;

function formatTime(time: string | null): string | null {
  if (!time) return null;
  return fmt({ hour: "numeric", minute: "2-digit", hour12: true })
    .format(toInstant(time))
    .replace(/\s?(am|pm)/i, (_, p: string) => ` ${p.toUpperCase()}`);
}

export const startTimeLabel = formatTime(event.startTime);
export const endTimeLabel = formatTime(event.endTime);
/** "11:00 AM – 3:00 PM" or null when the time isn't confirmed. */
export const timeRangeLabel = startTimeLabel
  ? endTimeLabel
    ? `${startTimeLabel} – ${endTimeLabel}`
    : startTimeLabel
  : null;

/* ── Maps ──────────────────────────────────────────────────────────────── */

const coords = venue.coordinates;
const coordString = coords ? `${coords.lat},${coords.lng}` : null;
const placeQuery = [venue.name, venue.address].filter(Boolean).join(", ");

/** Universal Google Maps directions URL — opens the app on Android & iOS. */
export const directionsUrl = coordString
  ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(coordString)}`
  : venue.mapsUrl;

/** Apple Maps directions (nice to offer on iPhone). */
export const appleMapsUrl = coordString
  ? `https://maps.apple.com/?daddr=${encodeURIComponent(coordString)}&q=${encodeURIComponent(venue.name ?? "Venue")}`
  : null;

/**
 * Key-less Google Maps embed. Querying the venue name + address, centred on the
 * resolved coordinates, lands on the same Google place as the supplied link
 * (place id 0x391ad1cd7da73c05), so the map shows the venue's own pin & card.
 */
export const mapEmbedUrl = placeQuery
  ? `https://www.google.com/maps?q=${encodeURIComponent(placeQuery)}${
      coordString ? `&ll=${coordString}` : ""
    }&z=15&hl=en&output=embed`
  : coordString
    ? `https://www.google.com/maps?q=${coordString}&z=15&hl=en&output=embed`
    : null;

/* ── Calendar ──────────────────────────────────────────────────────────── */

const icsStamp = (d: Date) =>
  d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsDate = event.date.replace(/-/g, "");

export const calendarTitle = `${coupleNames} — ${event.name}`;
export const calendarDetails = `${eventConfig.share.text}\n\nVenue map: ${venue.mapsUrl}`;
export const calendarLocation = placeQuery || venue.mapsUrl;

export const googleCalendarUrl = (() => {
  const dates = hasStartTime
    ? `${icsStamp(eventStart)}/${icsStamp(eventEnd)}`
    : `${icsDate}/${icsDate}`;
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: calendarTitle,
    dates,
    details: calendarDetails,
    location: calendarLocation,
    ctz: event.timezone,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
})();

export function buildIcs(): string {
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const when = hasStartTime
    ? [`DTSTART:${icsStamp(eventStart)}`, `DTEND:${icsStamp(eventEnd)}`]
    : [`DTSTART;VALUE=DATE:${icsDate}`];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ankit & Sakshi//Engagement//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:engagement-${icsDate}@ankit-sakshi`,
    `DTSTAMP:${icsStamp(new Date(`${event.date}T00:00:00Z`))}`,
    ...when,
    `SUMMARY:${esc(calendarTitle)}`,
    `DESCRIPTION:${esc(calendarDetails)}`,
    `LOCATION:${esc(calendarLocation)}`,
    coords ? `GEO:${coords.lat};${coords.lng}` : "",
    `URL:${venue.mapsUrl}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(calendarTitle)} is tomorrow`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
