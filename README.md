# Ankit & Sakshi — Engagement Invitation

An interactive digital engagement invitation, built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 and Motion.

Guests open a wax-sealed envelope, scratch a gold-foil card to reveal the date, and scroll on through the countdown, the couple's story, event details, the venue map, RSVP and a closing card.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Editing event details

All event information lives in **`src/config/event.ts`**. Change a value there and it updates everywhere.

| Field | Status |
| --- | --- |
| Couple, date, time (11:00–15:00 IST), venue, address | Confirmed |
| Map location | Resolved from the supplied link `maps.app.goo.gl/JCT4XUosqS6rJZnYA` → Hotel Tara (31.4504656, 76.3129841) |
| Contact and RSVP WhatsApp: Ankit, +91 85447 53313 | Confirmed |
| Dress code, parking, family note, RSVP-by date | `null`: hidden until you fill them in |

Any field left as `null` is hidden. Nothing unconfirmed is shown.

Theme tokens (colours, fonts, easing) are in `src/app/globals.css` under `@theme`.

## Deploying and the WhatsApp link preview

WhatsApp needs an **absolute** image URL to show the preview card.

- **Vercel:** works automatically, using the production URL.
- **Anywhere else:** set `NEXT_PUBLIC_SITE_URL=https://your-domain.com` before building.

The preview image is `src/app/opengraph-image.jpg` (1200×630, about 70 KB). WhatsApp caches previews, so send the link to yourself to check it before sharing it widely.

## RSVP

RSVPs are never faked. There are two modes.

1. **Default (no setup).** The form writes the guest's reply into a WhatsApp message to the number in `rsvp.whatsappNumber` (currently +91 85447 53313), and the guest presses send.
2. **Google Sheets or any other webhook.** Set two environment variables:
   ```
   RSVP_WEBHOOK_URL=https://script.google.com/macros/s/.../exec   # server-only
   NEXT_PUBLIC_RSVP_BACKEND=on
   ```
   The form then posts to `/api/rsvp`. That route forwards the reply to the webhook and reports success only after the webhook confirms it.

   A minimal Apps Script to put in the webhook:
   ```js
   function doPost(e) {
     const d = JSON.parse(e.postData.contents);
     SpreadsheetApp.getActive().getSheets()[0]
       .appendRow([d.receivedAt, d.name, d.attending ? "Yes" : "No", d.guests, d.message]);
     return ContentService.createTextOutput(JSON.stringify({ ok: true }));
   }
   ```

## Music

Background music is **"Dekho Dekho Jaanam"** by Udit Narayan and Alka Yagnik, supplied by the hosts.

The file is `public/audio/dekho-dekho-jaanam.mp3`: about 4 MB and 4 min 24 s. It starts at 0:50 of the original song, fades in and out so the loop joins smoothly, is level-normalised to about −16 LUFS, and loops.

**When it starts.** Music is on by default.
- Where the browser allows it, music starts as soon as the page loads.
- Phone browsers, including WhatsApp's built-in browser, don't let any website start sound before the visitor's first tap. On those, the music starts on the guest's first tap, which in practice is the tap that opens the envelope.
- Guests can mute it from the envelope screen or with the floating button. Muting is remembered for the rest of the visit.

**Changing the track.** Put a track you have the rights to in `public/audio/`, then update `music.src` (and `music.credit` if the track's licence needs one) in the config. Setting `music.src` to `null` switches to a music-box tune that's generated in the browser.

## Photos

`src/assets/childhood.jpeg` is shown in "The beginning of our forever". To add more photos:

1. Add the file to `src/assets/`.
2. Import it in `src/components/sections/OurStory.tsx` (the `PHOTOS` map).
3. Add an entry to `gallery` in the config.

## Structure

```
src/config/event.ts            all event data
src/lib/event.ts               derived dates, times, map, directions and calendar links
src/lib/audio.ts               Web Audio engine (music box, paper sound, chime)
src/lib/rsvp.ts                RSVP validation and WhatsApp message
src/components/experience/     envelope entrance, wax seal, music toggle, shared state
src/components/sections/       the nine page sections, in order
src/components/ornaments/      fine-line botanical SVG, lotus divider, arch, icons
src/components/ui/             reveal helpers, arch card, particles, gold dust
src/app/engagement.ics/        calendar file (Apple Calendar / Outlook)
src/app/api/rsvp/              optional RSVP webhook relay
```
