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
| Dress code, parking, contact person/phone, family note, RSVP-by date, WhatsApp number | `null`: hidden until you fill them in |

Any field left as `null` is hidden. Nothing unconfirmed is shown.

Theme tokens (colours, fonts, easing) are in `src/app/globals.css` under `@theme`.

## Deploying and the WhatsApp link preview

WhatsApp needs an **absolute** image URL to show the preview card.

- **Vercel:** works automatically, using the production URL.
- **Anywhere else:** set `NEXT_PUBLIC_SITE_URL=https://your-domain.com` before building.

The preview image is `src/app/opengraph-image.jpg` (1200×630, about 70 KB). WhatsApp caches previews, so send the link to yourself to check it before sharing it widely.

## RSVP

RSVPs are never faked. There are two modes.

1. **Default (no setup).** The form writes the guest's reply into a WhatsApp message, and the guest presses send. To send replies to one person, set `rsvp.whatsappNumber` in the config (for example `"+91 98xxxxxxx"`). If it's left blank, WhatsApp asks the guest to pick a contact.
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

No commercial recording is bundled. By default the site plays a short music-box lullaby written for this site and generated live in the browser with the Web Audio API. Sound plays only after the guest turns it on.

To use your own licensed track, put it in `public/audio/` and set `music.src` (for example `"/audio/our-song.mp3"`).

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
