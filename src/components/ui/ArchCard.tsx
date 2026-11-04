import type { ReactNode } from "react";

/**
 * Jharokha-arched invitation card. The cap scales with the card's width (via
 * container units) so the arch keeps its proportions on every screen; the
 * inner gold hairline runs continuously from arch into the body.
 */
const OUTER =
  "M0 160 L0 118 C0 72 106 52 168 28 C184 22 194 12 200 0 C206 12 216 22 232 28 C294 52 400 72 400 118 L400 160 Z";
const INNER =
  "M9 160 L9 120 C9 80 110 62 170 38 C185 32 195 23 200 13 C205 23 215 32 230 38 C290 62 391 80 391 120 L391 160";
const INNER_2 =
  "M15 160 L15 122 C15 86 113 69 172 45 C186 39 195 31 200 22 C205 31 214 39 228 45 C287 69 385 86 385 122 L385 160";

export function ArchCard({
  children,
  cap,
  className = "",
}: {
  children: ReactNode;
  /** Content centred inside the arch (monogram, ornament). */
  cap?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full [container-type:inline-size] ${className}`}
      style={{ filter: "drop-shadow(0 28px 40px rgba(102,87,77,0.22)) drop-shadow(0 6px 10px rgba(102,87,77,0.12))" }}
    >
      <svg viewBox="0 0 400 160" className="block w-full" aria-hidden="true" focusable="false">
        <path d={OUTER} fill="var(--color-ivory)" />
        <path d={INNER} fill="none" stroke="var(--color-gold)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={INNER_2} fill="none" stroke="var(--color-gold)" strokeOpacity="0.5" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
      </svg>
      {cap && (
        <div className="absolute inset-x-0 top-0 flex aspect-[400/160] items-end justify-center pb-[2%]">
          {cap}
        </div>
      )}
      <div className="relative -mt-px bg-ivory">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 border-x border-b border-gold"
          style={{ left: "2.25%", right: "2.25%", bottom: "10px" }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 border-x border-b border-gold/50"
          style={{ left: "3.75%", right: "3.75%", bottom: "16px", borderWidth: "0 0.7px 0.7px" }}
        />
        {/* % padding resolves against the card width — works without container queries */}
        <div className="relative" style={{ padding: "0 9% 11%" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
