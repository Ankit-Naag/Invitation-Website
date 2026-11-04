import { eventConfig } from "@/config/event";

/** Deterministic irregular wax outline. */
const BLOB = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * Math.PI * 2;
    const r =
      52 + 2.4 * Math.sin(5 * t + 0.7) + 1.5 * Math.sin(11 * t + 2.1) + 0.9 * Math.sin(17 * t + 0.4);
    pts.push(`${(Math.cos(t) * r).toFixed(2)} ${(Math.sin(t) * r).toFixed(2)}`);
  }
  return `M${pts.join(" L")}Z`;
})();

const BEADS = Array.from({ length: 28 }, (_, i) => {
  const t = (i / 28) * Math.PI * 2;
  return [Math.cos(t) * 44.5, Math.sin(t) * 44.5] as const;
});

const CRACK_L = "M-80 -80 H3 L-2 -38 L5 -14 L-3 8 L4 30 L-1 52 L2 80 H-80Z";
const CRACK_R = "M80 -80 H3 L-2 -38 L5 -14 L-3 8 L4 30 L-1 52 L2 80 H80Z";

/**
 * Burgundy wax seal with embossed monogram.
 * `half` renders one side of the crack line (used for the breaking animation).
 */
export function WaxSeal({ id, half, shimmer = true }: { id: string; half?: "l" | "r"; shimmer?: boolean }) {
  const { one, two } = eventConfig.couple.initials;
  const clip = half ? `${id}-${half}` : undefined;
  return (
    <svg viewBox="-60 -60 120 120" className="h-full w-full overflow-visible" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-wax`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#A05E6B" />
          <stop offset="0.45" stopColor="#7A4350" />
          <stop offset="1" stopColor="#4C252E" />
        </radialGradient>
        <radialGradient id={`${id}-well`} cx="55%" cy="60%" r="70%">
          <stop offset="0" stopColor="#7D4652" />
          <stop offset="1" stopColor="#5E3039" />
        </radialGradient>
        <linearGradient id={`${id}-shine`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFE9D6" stopOpacity="0.42" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-shape`}>
          <path d={BLOB} />
        </clipPath>
        {half && (
          <clipPath id={clip}>
            <path d={half === "l" ? CRACK_L : CRACK_R} />
          </clipPath>
        )}
        <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#3A1B21" floodOpacity="0.35" />
        </filter>
      </defs>

      <g clipPath={clip ? `url(#${clip})` : undefined}>
        <g filter={`url(#${id}-shadow)`}>
          <path d={BLOB} fill={`url(#${id}-wax)`} />
        </g>
        {/* pressed well */}
        <circle r="40" fill={`url(#${id}-well)`} />
        <circle r="40" fill="none" stroke="#3F1D25" strokeOpacity="0.55" strokeWidth="2.2" />
        <circle r="41.6" fill="none" stroke="#F3D3CF" strokeOpacity="0.22" strokeWidth="1" />
        {BEADS.map(([x, y], i) => (
          <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r="1.25" fill="#C79AA0" fillOpacity="0.45" />
        ))}

        {/* monogram — light offset first, then the recessed letterform = emboss */}
        <g
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
          textAnchor="middle"
          fontWeight={600}
        >
          <text x="-11.2" y="10.8" fontSize="44" fill="#3A1A20" fillOpacity="0.7">{one}</text>
          <text x="-12" y="10" fontSize="44" fill="#EBCBC5">{one}</text>
          <text x="14.8" y="19.8" fontSize="44" fill="#3A1A20" fillOpacity="0.7">{two}</text>
          <text x="14" y="19" fontSize="44" fill="#EBCBC5">{two}</text>
          <text x="1" y="-15.6" fontSize="15" fill="#E2BDB6">&amp;</text>
        </g>
        {/* tiny lotus under the monogram */}
        <path d="M0 33 C-3 29 -3 25 0 22 C3 25 3 29 0 33Z M0 33 C-5 31 -8 28 -9 24 C-5 25 -2 28 0 33Z M0 33 C5 31 8 28 9 24 C5 25 2 28 0 33Z" fill="#E2BDB6" fillOpacity="0.75" />

        {shimmer && (
          <g clipPath={`url(#${id}-shape)`}>
            <rect
              x="-12"
              y="-80"
              width="24"
              height="160"
              fill={`url(#${id}-shine)`}
              className="reduce-still"
              style={{ animation: "seal-shimmer 5.5s var(--ease-silk) infinite", transformBox: "view-box", transformOrigin: "center" }}
            />
          </g>
        )}
      </g>
    </svg>
  );
}
