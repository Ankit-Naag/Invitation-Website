import { eventConfig } from "@/config/event";
import { coupleNames, longDate } from "@/lib/event";

export type RsvpPayload = {
  name: string;
  attending: boolean;
  guests: number;
  message: string;
};

/** True only when a real backend is wired up (see README → RSVP). */
export const rsvpBackendEnabled = process.env.NEXT_PUBLIC_RSVP_BACKEND === "on";

export function validateRsvp(input: unknown): RsvpPayload | string {
  if (!input || typeof input !== "object") return "Invalid request.";
  const o = input as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const message = typeof o.message === "string" ? o.message.trim() : "";
  const attending = o.attending === true;
  const guests = Number(o.guests);
  if (name.length < 2 || name.length > 80) return "Please enter your name.";
  if (typeof o.attending !== "boolean") return "Please choose whether you can attend.";
  if (attending && (!Number.isInteger(guests) || guests < 1 || guests > eventConfig.rsvp.maxGuests))
    return `Number of guests must be between 1 and ${eventConfig.rsvp.maxGuests}.`;
  if (message.length > 600) return "Your message is a little long — please keep it under 600 characters.";
  return { name, attending, guests: attending ? guests : 0, message };
}

export function rsvpMessage(p: RsvpPayload): string {
  const lines = [
    `RSVP — ${coupleNames}'s engagement (${longDate})`,
    "",
    `Name: ${p.name}`,
    p.attending
      ? `Response: Joyfully accepts (${p.guests} ${p.guests === 1 ? "guest" : "guests"})`
      : "Response: Regretfully declines",
  ];
  if (p.message) lines.push("", `Message: ${p.message}`);
  return lines.join("\n");
}

export function whatsappRsvpUrl(p: RsvpPayload): string {
  const number = eventConfig.rsvp.whatsappNumber?.replace(/[^\d]/g, "");
  const text = encodeURIComponent(rsvpMessage(p));
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}
