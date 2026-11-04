"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { eventConfig } from "@/config/event";
import { Icon } from "@/components/ornaments/Botanical";
import { Reveal, SectionHeading, SILK } from "@/components/ui/Reveal";
import { rsvpBackendEnabled, validateRsvp, whatsappRsvpUrl, type RsvpPayload } from "@/lib/rsvp";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "saved"; attending: boolean }
  | { kind: "whatsapp"; url: string; attending: boolean }
  | { kind: "error"; message: string };

export function Rsvp() {
  const uid = useId();
  const [attending, setAttending] = useState<boolean | null>(null);
  const [guests, setGuests] = useState(1);
  const [state, setState] = useState<State>({ kind: "idle" });
  const max = eventConfig.rsvp.maxGuests;
  const cardRef = useRef<HTMLDivElement>(null);
  const isDone = state.kind === "saved" || state.kind === "whatsapp";

  // The form collapses into a short confirmation — keep it in view.
  useEffect(() => {
    if (!isDone || !cardRef.current) return;
    const t = window.setTimeout(() => {
      const r = cardRef.current?.getBoundingClientRect();
      if (r && (r.top < 0 || r.bottom > window.innerHeight)) {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 450);
    return () => window.clearTimeout(t);
  }, [isDone]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = validateRsvp({
      name: form.get("name"),
      attending,
      guests,
      message: form.get("message") ?? "",
    });
    if (typeof result === "string") {
      setState({ kind: "error", message: result });
      return;
    }
    const payload: RsvpPayload = result;

    if (!rsvpBackendEnabled) {
      const url = whatsappRsvpUrl(payload);
      window.open(url, "_blank", "noopener,noreferrer");
      setState({ kind: "whatsapp", url, attending: payload.attending });
      return;
    }

    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) setState({ kind: "saved", attending: payload.attending });
      else setState({ kind: "error", message: data.error ?? "Your RSVP couldn't be sent. Please try again." });
    } catch {
      setState({ kind: "error", message: "No connection — check your internet and try again." });
    }
  }

  const done = isDone;

  return (
    <section id="rsvp" aria-labelledby="rsvp-title" className="section bg-champagne/45">
      <SectionHeading
        id="rsvp-title"
        title="Your presence would mean the world to us"
        lead="Having you celebrate this special milestone with us would make our happiness even more complete."
      />

      <Reveal className="mx-auto mt-14 max-w-xl" delay={0.1}>
        <div ref={cardRef} className="double-frame scroll-mt-24 rounded-[18px] px-6 py-9 sm:px-11 sm:py-11">
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.div
                key="done"
                role="status"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: SILK }}
                className="flex flex-col items-center py-6 text-center"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold text-burgundy">
                  <Icon name={state.kind === "saved" ? "check" : "letter"} className="h-6 w-6" />
                </span>
                {state.kind === "saved" ? (
                  <>
                    <p className="script mt-5 text-[2rem] text-burgundy">
                      {state.attending ? "We can’t wait to see you!" : "Thank you for letting us know"}
                    </p>
                    <p className="prose-serif mt-2 max-w-[32ch] text-[1.1rem]">
                      {state.attending
                        ? "Your RSVP has been received. Your blessings mean everything to us."
                        : "Your RSVP has been received. You will be in our hearts on the day."}
                    </p>
                  </>
                ) : (
                  state.kind === "whatsapp" && (
                    <>
                      <p className="script mt-5 text-[2rem] text-burgundy">One last step</p>
                      <p className="prose-serif mt-2 max-w-[32ch] text-[1.1rem]">
                        Your RSVP message is ready in WhatsApp. Press send there to deliver it to the family.
                      </p>
                      <a className="btn btn-primary mt-6" href={state.url} target="_blank" rel="noopener noreferrer">
                        Open WhatsApp again
                      </a>
                    </>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setState({ kind: "idle" })}
                  className="mt-6 text-[0.8rem] text-brown underline decoration-gold/60 underline-offset-4 hover:text-burgundy"
                >
                  Edit my response
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={onSubmit}
                noValidate
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-7"
              >
                <Field label="Your name" htmlFor={`${uid}-name`}>
                  <input
                    id={`${uid}-name`}
                    name="name"
                    required
                    autoComplete="name"
                    maxLength={80}
                    placeholder="Full name"
                    className="w-full border-0 border-b border-gold/60 bg-transparent px-0 py-2.5 font-display text-[1.35rem] text-ink placeholder:text-taupe/80 focus:border-burgundy focus:outline-none focus-visible:outline-none"
                  />
                </Field>

                <fieldset>
                  <legend className="label">Will you join us?</legend>
                  <div role="radiogroup" aria-label="Will you join us?" className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { v: true, label: "Joyfully accept" },
                      { v: false, label: "Regretfully decline" },
                    ].map((o) => {
                      const on = attending === o.v;
                      return (
                        <button
                          key={o.label}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setAttending(o.v)}
                          className={`btn w-full ${on ? "btn-primary" : "btn-ghost"} normal-case tracking-[0.06em]`}
                          style={{ fontSize: "0.9rem" }}
                        >
                          {on && <Icon name="check" className="h-4 w-4" />}
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <AnimatePresence initial={false}>
                  {attending && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.45, ease: SILK }}
                      className="overflow-hidden"
                    >
                      <Field label="Number of guests, including you" htmlFor={`${uid}-guests`}>
                        <div className="mt-1 flex items-center gap-4">
                          <StepButton label="Fewer guests" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1}>
                            −
                          </StepButton>
                          <output
                            id={`${uid}-guests`}
                            aria-live="polite"
                            className="min-w-[3ch] text-center font-numeral text-[2rem] text-ink tabular-nums"
                          >
                            {guests}
                          </output>
                          <StepButton label="More guests" onClick={() => setGuests((g) => Math.min(max, g + 1))} disabled={guests >= max}>
                            +
                          </StepButton>
                        </div>
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field label="A message for the couple (optional)" htmlFor={`${uid}-msg`}>
                  <textarea
                    id={`${uid}-msg`}
                    name="message"
                    rows={3}
                    maxLength={600}
                    placeholder="Your wishes and blessings"
                    className="w-full resize-none rounded-[10px] border border-gold/50 bg-ivory/60 px-3.5 py-3 font-display text-[1.15rem] leading-snug text-ink placeholder:text-taupe/80 focus:border-burgundy focus:outline-none focus-visible:outline-none"
                  />
                </Field>

                {state.kind === "error" && (
                  <p role="alert" className="rounded-[10px] border border-burgundy/30 bg-blush/50 px-4 py-3 text-sm text-burgundy-deep">
                    {state.message}
                  </p>
                )}

                <div className="flex flex-col items-center gap-3">
                  <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={state.kind === "sending" || attending === null}>
                    {state.kind === "sending" ? "Sending…" : rsvpBackendEnabled ? "Send RSVP" : "Send RSVP on WhatsApp"}
                  </button>
                  {!rsvpBackendEnabled && (
                    <p className="max-w-[40ch] text-center text-[0.78rem] leading-relaxed text-brown">
                      This opens WhatsApp with your reply written out — just press send.
                    </p>
                  )}
                  {attending === null && <p className="text-[0.78rem] text-brown">Choose accept or decline to continue.</p>}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </Reveal>
    </section>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/70 text-xl text-ink transition-colors hover:bg-champagne disabled:opacity-35"
    >
      {children}
    </button>
  );
}
