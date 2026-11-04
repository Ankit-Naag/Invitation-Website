"use client";

import { useState } from "react";
import { eventConfig } from "@/config/event";
import { Icon } from "@/components/ornaments/Botanical";
import { Reveal, SectionHeading } from "@/components/ui/Reveal";
import { appleMapsUrl, directionsUrl, mapEmbedUrl } from "@/lib/event";

export function Venue() {
  const { venue } = eventConfig;
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState<"idle" | "done" | "error">("idle");

  async function copyAddress() {
    const text = [venue.name, venue.address].filter(Boolean).join(", ");
    try {
      await navigator.clipboard.writeText(text);
      setCopied("done");
    } catch {
      setCopied("error");
    }
    window.setTimeout(() => setCopied("idle"), 2500);
  }

  return (
    <section id="venue" aria-labelledby="venue-title" className="section bg-champagne/45">
      <SectionHeading
        id="venue-title"
        title="Where the celebration begins"
        lead="We would love to have you with us."
      />

      <Reveal className="relative mx-auto mt-14 max-w-5xl" delay={0.1}>
        {/* map in a gilded mount */}
        <div className="double-frame relative rounded-[20px] p-2.5 sm:p-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-champagne sm:aspect-[16/9]">
            {/* quiet placeholder while the map loads (or if it is blocked) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-brown" aria-hidden={loaded}>
              <Icon name="map" className="h-8 w-8 text-gold" />
              <p className="text-sm">{loaded ? "" : "Loading map…"}</p>
            </div>
            {mapEmbedUrl && (
              <iframe
                title={`Map showing ${venue.name ?? "the venue"}`}
                src={mapEmbedUrl}
                className="absolute inset-0 h-full w-full border-0 transition-opacity duration-700 [filter:sepia(0.18)_saturate(0.82)_contrast(0.97)]"
                style={{ opacity: loaded ? 1 : 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                onLoad={() => setLoaded(true)}
              />
            )}
            {/* warm vignette ties the map into the paper palette */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[14px]"
              style={{ boxShadow: "inset 0 0 0 1px rgba(184,155,114,0.4), inset 0 0 50px rgba(240,229,213,0.55)" }}
            />
          </div>
        </div>

        {/* location card */}
        <article className="double-frame relative z-10 mx-3 -mt-20 rounded-[16px] px-6 py-7 text-center sm:mx-auto sm:max-w-md md:absolute md:bottom-10 md:left-10 md:mt-0 md:text-left">
          <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-burgundy text-ivory shadow-[0_8px_18px_-8px_rgba(113,62,73,0.8)]">
              <Icon name="pin" className="h-5 w-5" />
            </span>
            <div>
              {venue.name && <h3 className="font-display text-[1.7rem] font-medium leading-tight text-ink">{venue.name}</h3>}
              {venue.address && (
                <address className="mt-1.5 text-[0.95rem] not-italic leading-relaxed text-brown">{venue.address}</address>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <a className="btn btn-primary w-full" href={directionsUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="map" className="h-4 w-4" />
              Get directions
            </a>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.8rem] text-brown md:justify-start">
              <a className="underline decoration-gold/60 underline-offset-4 hover:text-burgundy" href={venue.mapsUrl} target="_blank" rel="noopener noreferrer">
                Open in Google Maps
              </a>
              {appleMapsUrl && (
                <a className="underline decoration-gold/60 underline-offset-4 hover:text-burgundy" href={appleMapsUrl} target="_blank" rel="noopener noreferrer">
                  Apple Maps
                </a>
              )}
              {venue.address && (
                <button type="button" onClick={copyAddress} className="inline-flex min-h-8 items-center gap-1.5 underline decoration-gold/60 underline-offset-4 hover:text-burgundy">
                  <Icon name={copied === "done" ? "check" : "copy"} className="h-3.5 w-3.5" />
                  {copied === "done" ? "Address copied" : copied === "error" ? "Copy unavailable" : "Copy address"}
                </button>
              )}
            </div>
            <p className="sr-only" aria-live="polite">{copied === "done" ? "Address copied to clipboard" : ""}</p>
          </div>
        </article>
      </Reveal>
    </section>
  );
}
