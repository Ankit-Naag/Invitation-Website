import { buildIcs } from "@/lib/event";

/** Calendar file for Apple Calendar / Outlook. Static — prerendered at build. */
export function GET() {
  return new Response(buildIcs(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ankit-sakshi-engagement.ics"',
    },
  });
}
