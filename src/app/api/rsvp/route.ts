import { rsvpMessage, validateRsvp } from "@/lib/rsvp";

/**
 * Forwards an RSVP to a private webhook (e.g. a Google Apps Script web app
 * that appends rows to a Google Sheet). The webhook URL stays server-side.
 *
 * Responds 2xx only when the webhook confirms receipt, so the client never
 * shows a success message for an RSVP that wasn't stored.
 */
export async function POST(request: Request) {
  const webhook = process.env.RSVP_WEBHOOK_URL;
  if (!webhook) {
    return Response.json({ ok: false, error: "RSVP storage is not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const result = validateRsvp(body);
  if (typeof result === "string") {
    return Response.json({ ok: false, error: result }, { status: 422 });
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...result, summary: rsvpMessage(result), receivedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[rsvp] delivery failed", err);
    return Response.json(
      { ok: false, error: "We couldn't save your RSVP just now. Please try again in a moment." },
      { status: 502 },
    );
  }
}
