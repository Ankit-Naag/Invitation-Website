"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import { useId, type CSSProperties } from "react";

/* ──────────────────────────────────────────────────────────────────────────
 * Fine-line botanical ornaments.
 * Geometry is computed deterministically (no randomness) so the server and
 * client render identical SVG.
 * ────────────────────────────────────────────────────────────────────────── */

type Pt = [number, number];

const GOLD = "var(--color-gold)";
const TAUPE = "var(--color-taupe)";
const r2 = (n: number) => Math.round(n * 100) / 100;

function bezier(p: Pt[], t: number): { pt: Pt; angle: number } {
  const [p0, p1, p2, p3] = p;
  const mt = 1 - t;
  const x =
    mt ** 3 * p0[0] + 3 * mt ** 2 * t * p1[0] + 3 * mt * t ** 2 * p2[0] + t ** 3 * p3[0];
  const y =
    mt ** 3 * p0[1] + 3 * mt ** 2 * t * p1[1] + 3 * mt * t ** 2 * p2[1] + t ** 3 * p3[1];
  const dx =
    3 * mt ** 2 * (p1[0] - p0[0]) + 6 * mt * t * (p2[0] - p1[0]) + 3 * t ** 2 * (p3[0] - p2[0]);
  const dy =
    3 * mt ** 2 * (p1[1] - p0[1]) + 6 * mt * t * (p2[1] - p1[1]) + 3 * t ** 2 * (p3[1] - p2[1]);
  return { pt: [x, y], angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

const leafPath = (len: number, w: number) =>
  `M0 0 C${r2(len * 0.28)} ${r2(-w)} ${r2(len * 0.72)} ${r2(-w * 0.9)} ${len} 0 C${r2(len * 0.7)} ${r2(w * 0.85)} ${r2(len * 0.3)} ${r2(w)} 0 0Z`;

/** Shared draw-in behaviour for every stroked path. */
function useDraw(play: boolean | "inView", delay = 0, duration = 1.6) {
  const reduce = useReducedMotion();
  const transition: Transition = { duration, delay, ease: [0.65, 0, 0.35, 1] };
  if (reduce) return { initial: false as const };
  const hidden = { pathLength: 0, opacity: 0 };
  const shown = { pathLength: 1, opacity: 1, transition };
  if (play === "inView")
    return {
      initial: hidden,
      whileInView: shown,
      viewport: { once: true, margin: "0px 0px -10% 0px" },
    };
  return { initial: hidden, animate: play ? shown : hidden };
}

function useBloom(play: boolean | "inView", delay = 0) {
  const reduce = useReducedMotion();
  const transition: Transition = { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] };
  if (reduce) return { initial: false as const };
  const hidden = { opacity: 0, scale: 0.6 };
  const shown = { opacity: 1, scale: 1, transition };
  if (play === "inView")
    return { initial: hidden, whileInView: shown, viewport: { once: true } };
  return { initial: hidden, animate: play ? shown : hidden };
}

/* ── Branch: a curved stem with alternating leaves ─────────────────────── */

type BranchProps = {
  curve: Pt[];
  leaves?: number;
  leafSize?: number;
  play?: boolean | "inView";
  delay?: number;
  buds?: boolean;
};

export function Branch({
  curve,
  leaves = 7,
  leafSize = 26,
  play = "inView",
  delay = 0,
  buds = true,
}: BranchProps) {
  const stem = `M${curve[0].join(" ")} C${curve[1].join(" ")} ${curve[2].join(" ")} ${curve[3].join(" ")}`;
  const drawStem = useDraw(play, delay, 1.8);
  const items = Array.from({ length: leaves }, (_, i) => {
    const t = 0.14 + (i / Math.max(1, leaves - 1)) * 0.8;
    const { pt, angle } = bezier(curve, t);
    const side = i % 2 === 0 ? -1 : 1;
    const size = leafSize * (1 - t * 0.45);
    return { pt, rot: angle + side * 48, size, i };
  });
  const tip = bezier(curve, 1);
  return (
    <g>
      <motion.path
        d={stem}
        fill="none"
        stroke={GOLD}
        strokeWidth={1.1}
        strokeLinecap="round"
        {...drawStem}
      />
      {items.map(({ pt, rot, size, i }) => (
        <Leaf key={i} at={pt} rot={rot} size={size} play={play} delay={delay + 0.35 + i * 0.09} />
      ))}
      {buds && <Bud at={tip.pt} rot={tip.angle} play={play} delay={delay + 1.2} />}
    </g>
  );
}

function Leaf({
  at,
  rot,
  size,
  play,
  delay,
}: {
  at: Pt;
  rot: number;
  size: number;
  play: boolean | "inView";
  delay: number;
}) {
  const draw = useDraw(play, delay, 1.1);
  const w = size * 0.32;
  return (
    <g transform={`translate(${r2(at[0])} ${r2(at[1])}) rotate(${r2(rot)})`}>
      <motion.path
        d={leafPath(size, w)}
        fill="var(--color-blush)"
        fillOpacity={0.45}
        stroke={GOLD}
        strokeWidth={0.9}
        {...draw}
      />
      <motion.path
        d={`M${r2(size * 0.08)} 0 L${r2(size * 0.82)} 0`}
        stroke={TAUPE}
        strokeWidth={0.6}
        strokeLinecap="round"
        fill="none"
        {...draw}
      />
    </g>
  );
}

function Bud({
  at,
  rot,
  play,
  delay,
}: {
  at: Pt;
  rot: number;
  play: boolean | "inView";
  delay: number;
}) {
  const bloom = useBloom(play, delay);
  return (
    <g transform={`translate(${r2(at[0])} ${r2(at[1])}) rotate(${r2(rot + 90)})`}>
      <motion.g {...bloom} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <path
          d="M0 0 C-5 -4 -5 -11 0 -15 C5 -11 5 -4 0 0Z"
          fill="var(--color-blush)"
          stroke={TAUPE}
          strokeWidth={0.8}
        />
        <path d="M0 0 C-2 -5 -2 -9 0 -12" stroke={GOLD} strokeWidth={0.6} fill="none" />
      </motion.g>
    </g>
  );
}

/* ── Bloom: layered peony/rose seen from above ─────────────────────────── */

export function Bloom({
  cx,
  cy,
  r = 30,
  play = "inView",
  delay = 0,
  tone = "blush",
}: {
  cx: number;
  cy: number;
  r?: number;
  play?: boolean | "inView";
  delay?: number;
  tone?: "blush" | "ivory";
}) {
  const bloom = useBloom(play, delay);
  const rings = [
    { n: 7, len: r, w: r * 0.62, off: 0, fill: tone === "blush" ? "#EBD9D1" : "#F6EEE2" },
    { n: 6, len: r * 0.74, w: r * 0.5, off: 25, fill: tone === "blush" ? "#E3C9C0" : "#F0E5D5" },
    { n: 5, len: r * 0.5, w: r * 0.38, off: 9, fill: tone === "blush" ? "#D9B9AF" : "#E9D7D0" },
  ];
  return (
    <g transform={`translate(${cx} ${cy})`}>
    <motion.g {...bloom} style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}>
      {rings.map((ring, ri) =>
        Array.from({ length: ring.n }, (_, i) => {
          const a = (360 / ring.n) * i + ring.off;
          const l = ring.len;
          const w = ring.w / 2;
          return (
            <path
              key={`${ri}-${i}`}
              transform={`rotate(${r2(a)})`}
              d={`M0 0 C${r2(-w)} ${r2(-l * 0.35)} ${r2(-w * 0.9)} ${r2(-l * 0.95)} 0 ${r2(-l)} C${r2(w * 0.9)} ${r2(-l * 0.95)} ${r2(w)} ${r2(-l * 0.35)} 0 0Z`}
              fill={ring.fill}
              stroke={ri === 0 ? GOLD : TAUPE}
              strokeWidth={ri === 0 ? 0.9 : 0.7}
              strokeOpacity={0.9}
            />
          );
        }),
      )}
      <circle r={r * 0.16} fill="#D3AE8E" stroke={GOLD} strokeWidth={0.8} />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 9;
        return (
          <circle
            key={i}
            cx={r2(Math.cos(a) * r * 0.26)}
            cy={r2(Math.sin(a) * r * 0.26)}
            r={r * 0.035}
            fill="var(--color-gold)"
          />
        );
      })}
    </motion.g>
    </g>
  );
}

/* ── Corner floral composition ─────────────────────────────────────────── */

export function CornerFloral({
  className,
  style,
  play = "inView",
  delay = 0,
  flip,
}: {
  className?: string;
  style?: CSSProperties;
  play?: boolean | "inView";
  delay?: number;
  flip?: "x" | "y" | "xy";
}) {
  const transform =
    flip === "x" ? "scale(-1,1)" : flip === "y" ? "scale(1,-1)" : flip === "xy" ? "scale(-1,-1)" : undefined;
  return (
    <svg
      viewBox="0 0 260 260"
      className={className}
      style={{ ...style, transform }}
      aria-hidden="true"
      focusable="false"
    >
      <Branch curve={[[8, 8], [70, 30], [130, 40], [228, 28]]} leaves={8} leafSize={30} play={play} delay={delay} />
      <Branch curve={[[8, 8], [30, 70], [40, 130], [26, 230]]} leaves={8} leafSize={30} play={play} delay={delay + 0.15} />
      <Branch curve={[[30, 30], [80, 70], [110, 92], [168, 118]]} leaves={5} leafSize={22} play={play} delay={delay + 0.3} />
      <Bloom cx={46} cy={46} r={34} play={play} delay={delay + 0.6} />
      <Bloom cx={104} cy={22} r={13} play={play} delay={delay + 0.9} />
      <Bloom cx={22} cy={104} r={13} play={play} delay={delay + 1} />
    </svg>
  );
}

/* ── Lotus divider: the recurring Indian motif ─────────────────────────── */

export function LotusDivider({
  className,
  play = "inView",
  delay = 0,
  width = 320,
}: {
  className?: string;
  play?: boolean | "inView";
  delay?: number;
  width?: number;
}) {
  const line = useDraw(play, delay, 1.4);
  const petals = useDraw(play, delay + 0.4, 1.2);
  const dots = useBloom(play, delay + 1.1);
  const c = width / 2;
  return (
    <svg
      viewBox={`0 0 ${width} 40`}
      className={className}
      style={{ width: "100%", maxWidth: width }}
      aria-hidden="true"
      focusable="false"
    >
      <motion.path d={`M${c - 34} 24 L12 24`} stroke={GOLD} strokeWidth={0.9} fill="none" {...line} />
      <motion.path d={`M${c + 34} 24 L${width - 12} 24`} stroke={GOLD} strokeWidth={0.9} fill="none" {...line} />
      <motion.path
        d={`M${c - 34} 28 L${c - 90} 28 M${c + 34} 28 L${c + 90} 28`}
        stroke={GOLD}
        strokeWidth={0.6}
        strokeOpacity={0.6}
        fill="none"
        {...line}
      />
      <g transform={`translate(${c} 26)`}>
        {/* centre petal */}
        <motion.path d="M0 0 C-7 -8 -7 -18 0 -24 C7 -18 7 -8 0 0Z" fill="var(--color-blush)" fillOpacity={0.6} stroke={GOLD} strokeWidth={0.9} {...petals} />
        {/* side petals */}
        <motion.path d="M0 0 C-10 -4 -18 -10 -20 -19 C-11 -18 -4 -10 0 0Z" fill="none" stroke={GOLD} strokeWidth={0.9} {...petals} />
        <motion.path d="M0 0 C10 -4 18 -10 20 -19 C11 -18 4 -10 0 0Z" fill="none" stroke={GOLD} strokeWidth={0.9} {...petals} />
        <motion.path d="M0 0 C-12 0 -24 -3 -30 -8 C-20 -10 -9 -6 0 0Z" fill="none" stroke={GOLD} strokeWidth={0.8} {...petals} />
        <motion.path d="M0 0 C12 0 24 -3 30 -8 C20 -10 9 -6 0 0Z" fill="none" stroke={GOLD} strokeWidth={0.8} {...petals} />
        <motion.g {...dots}>
          <circle cx={-48} cy={-2} r={1.6} fill={GOLD} />
          <circle cx={48} cy={-2} r={1.6} fill={GOLD} />
          <circle cx={0} cy={5} r={1.3} fill={GOLD} />
        </motion.g>
      </g>
    </svg>
  );
}

/* ── Jharokha arch frame ───────────────────────────────────────────────── */

/** Normalised (0..1) Mughal arch outline, used for clipping & strokes. */
export const ARCH_PATH =
  "M0 1 L0 0.36 C0 0.2 0.2 0.12 0.36 0.07 C0.44 0.045 0.48 0.02 0.5 0 C0.52 0.02 0.56 0.045 0.64 0.07 C0.8 0.12 1 0.2 1 0.36 L1 1 Z";

export function ArchClipDefs({ id }: { id: string }) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={id} clipPathUnits="objectBoundingBox">
          <path d={ARCH_PATH} />
        </clipPath>
      </defs>
    </svg>
  );
}

export function ArchOutline({
  className,
  inset = 0,
  play = "inView",
  delay = 0,
}: {
  className?: string;
  inset?: number;
  play?: boolean | "inView";
  delay?: number;
}) {
  // A stretched viewBox needs non-scaling strokes, which breaks pathLength
  // dashing — so the arch fades in rather than drawing.
  const reduce = useReducedMotion();
  const s = 1 - inset * 2;
  const hidden = { opacity: 0 };
  const shown = { opacity: 1, transition: { duration: 1.6, delay, ease: [0.22, 1, 0.36, 1] as const } };
  const anim = reduce
    ? { initial: false as const }
    : play === "inView"
      ? { initial: hidden, whileInView: shown, viewport: { once: true } }
      : { initial: hidden, animate: play ? shown : hidden };
  return (
    <motion.svg viewBox="0 0 1 1" preserveAspectRatio="none" className={className} aria-hidden="true" focusable="false" {...anim}>
      <path
        d={ARCH_PATH}
        transform={`translate(${inset} ${inset}) scale(${s})`}
        fill="none"
        stroke={GOLD}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </motion.svg>
  );
}

/* ── Small line icons (1.25px, rounded) ────────────────────────────────── */

export type IconName =
  | "calendar"
  | "clock"
  | "pin"
  | "dress"
  | "car"
  | "phone"
  | "letter"
  | "rings"
  | "map"
  | "share"
  | "arrow-up"
  | "check"
  | "copy";

const ICONS: Record<IconName, string> = {
  calendar:
    "M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V8A1.5 1.5 0 0 1 5 6.5ZM3.5 10.5h17M8 4v4M16 4v4M12 13.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3Z",
  clock: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM12 7.5V12l3 2",
  pin: "M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11ZM12 12.3a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z",
  dress: "M9 3.5h6l-1 4 4 13H6l4-13-1-4ZM10 7.5h4",
  car: "M5 16.5h14M4.5 16.5V12l2-4.5h11l2 4.5v4.5M6.5 16.5v2M17.5 16.5v2M7.5 13.2h.01M16.5 13.2h.01",
  phone:
    "M6.6 3.8 9 3.5l1.6 4-2 1.3a10.6 10.6 0 0 0 6.6 6.6l1.3-2 4 1.6-.3 2.4a2 2 0 0 1-2.1 1.7C11 18.7 5.3 13 4.9 5.9a2 2 0 0 1 1.7-2.1Z",
  letter: "M4 6.5h16v11H4zM4 7l8 6 8-6",
  rings:
    "M9 20a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM15 20a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM10.5 4.5 12 3l1.5 1.5L12 7Z",
  map: "M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5ZM9 4v13.5M15 6.5V20",
  share: "M12 15V3.5M8 7.5l4-4 4 4M5 11.5v7a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-7",
  "arrow-up": "M12 19.5V5M6 10.5l6-6 6 6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  copy: "M8.5 8.5h10v11h-10zM5.5 15.5v-11h10",
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Stable id helper for SVG defs (useId contains ':' which is fine in url(#)). */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/:/g, "")}`;
}
