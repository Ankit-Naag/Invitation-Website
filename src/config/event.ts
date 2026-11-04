/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CENTRAL EVENT CONFIGURATION
 *  Every piece of event information shown on the site comes from this file.
 *  Update a value here and it changes everywhere.
 *
 *  Rule: anything not confirmed by the family stays `null`. Components never
 *  render a field whose value is `null`, so nothing unconfirmed is shown.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type EventConfig = typeof eventConfig;

export const eventConfig = {
  couple: {
    partnerOne: "Ankit",
    partnerTwo: "Sakshi",
    /** Used on the wax seal, favicon and monogram. */
    initials: { one: "A", two: "S" },
  },

  event: {
    name: "Engagement Ceremony",
    /** Local calendar date of the event (YYYY-MM-DD) in `timezone`. */
    date: "2026-11-22",
    /**
     * Local start / end time (24h "HH:mm") in `timezone`.
     * Set `startTime` to `null` if the time is not confirmed — the countdown
     * then switches to a date-only "days to go" mode automatically.
     */
    startTime: "11:00" as string | null,
    endTime: "15:00" as string | null,
    /** IANA zone, shown for clarity, and its fixed UTC offset (India has no DST). */
    timezone: "Asia/Kolkata",
    utcOffset: "+05:30",
  },

  venue: {
    name: "Hotel Tara" as string | null,
    address:
      "Vill. & P.O. Behdala, Nangal Road, NH 503, Una, Himachal Pradesh 174306" as
        | string
        | null,
    /** Short locality line used in compact places (cards, share text). */
    locality: "Una, Himachal Pradesh" as string | null,
    /** The original link supplied by the family — always kept as a fallback. */
    mapsUrl: "https://maps.app.goo.gl/JCT4XUosqS6rJZnYA",
    /**
     * Resolved from the short link above (it redirects to
     * google.com/maps/place/Hotel+Tara/@31.4504656,76.3129841).
     */
    coordinates: { lat: 31.4504656, lng: 76.3129841 } as {
      lat: number;
      lng: number;
    } | null,
  },

  /** Optional details. Leave `null` until confirmed — empty cards are hidden. */
  details: {
    dressCode: null as string | null,
    parking: null as string | null,
    familyNote: null as string | null,
  },

  contact: {
    /** e.g. "Ankit's family" */
    name: null as string | null,
    /** International format with country code, e.g. "+91 98765 43210". */
    phone: null as string | null,
  },

  rsvp: {
    /**
     * RSVP delivery.
     * 1. If the server env var `RSVP_WEBHOOK_URL` is set (e.g. a Google Apps
     *    Script web-app that appends to a Sheet) AND `NEXT_PUBLIC_RSVP_BACKEND`
     *    is "on", the form posts to /api/rsvp and only shows success after the
     *    webhook confirms.
     * 2. Otherwise the form prepares a WhatsApp message the guest sends
     *    themselves. If `whatsappNumber` is set, it is addressed to that number;
     *    if not, WhatsApp asks the guest to pick the contact.
     */
    whatsappNumber: null as string | null,
    /** Optional "please reply by" date, e.g. "15 November 2026". */
    respondBy: null as string | null,
    maxGuests: 10,
  },

  /**
   * Photographs. Only real photographs supplied by the family belong here.
   * `src` is resolved in `src/components/sections/OurStory.tsx` via static
   * import so Next.js can optimise and blur-preload it.
   */
  gallery: [
    {
      id: "childhood",
      alt: "A childhood photograph of Ankit and Sakshi standing side by side in a garden — Ankit in a black embroidered kurta, Sakshi in a teal suit with a pink dupatta, both smiling.",
      caption: "Once upon a time",
    },
  ],

  music: {
    /**
     * Path to a licensed audio file in /public (e.g. "/audio/our-song.mp3").
     * When `null`, the site plays its own original, procedurally generated
     * music-box melody (Web Audio) — no third-party recording is used.
     */
    src: null as string | null,
    title: "An original music-box lullaby",
    volume: 0.5,
  },

  share: {
    title: "Ankit & Sakshi — Engagement Invitation",
    text: "With joy in our hearts, we invite you to celebrate the engagement of Ankit & Sakshi.",
  },
} as const;
