"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CornerFloral, LotusDivider } from "@/components/ornaments/Botanical";
import { SectionHeading, SILK } from "@/components/ui/Reveal";
import { useExperience } from "@/components/experience/ExperienceProvider";
import { dayOfMonth, longDate, monthName, weekday, year } from "@/lib/event";
import { Celebration } from "@/components/ui/Celebration";

const REVEAL_AT = 0.45;
const GRID_X = 28;
const GRID_Y = 18;

/** Paints the champagne-gold foil once per size. */
function paintFoil(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const serif = getComputedStyle(document.documentElement).getPropertyValue("--font-cormorant").trim() || "Georgia";
  const sans = getComputedStyle(document.documentElement).getPropertyValue("--font-manrope").trim() || "system-ui";
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);

  // brushed foil base
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#C8AC80");
  g.addColorStop(0.22, "#E8D5B0");
  g.addColorStop(0.45, "#BC9E70");
  g.addColorStop(0.62, "#DCC49A");
  g.addColorStop(0.82, "#B2925F");
  g.addColorStop(1, "#D5BC8E");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // fine brushing
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = `rgba(255,248,232,${0.03 + Math.random() * 0.06})`;
    ctx.fillRect(0, y, w, 1);
  }
  // metallic grain
  const grains = Math.floor((w * h) / 90);
  for (let i = 0; i < grains; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,250,236,0.28)" : "rgba(110,84,48,0.16)";
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  // soft sheen
  const sheen = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.3, h * 0.2, w * 0.8);
  sheen.addColorStop(0, "rgba(255,250,235,0.35)");
  sheen.addColorStop(1, "rgba(255,250,235,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // embossed double border
  const m = Math.min(w, h) * 0.06;
  const emboss = (inset: number, alpha: number) => {
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(255,248,230,${alpha})`;
    ctx.strokeRect(inset + 0.8, inset + 0.8, w - inset * 2, h - inset * 2);
    ctx.strokeStyle = `rgba(98,74,40,${alpha * 0.8})`;
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  };
  emboss(m, 0.75);
  emboss(m + 6, 0.45);

  // corner flourishes
  const flourish = (cx: number, cy: number, sx: number, sy: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sx, sy);
    const s = Math.min(w, h) * 0.13;
    const draw = (dx: number, dy: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(dx, s + dy);
      ctx.bezierCurveTo(dx, s * 0.4 + dy, s * 0.15 + dx, s * 0.15 + dy, s * 0.55 + dx, s * 0.12 + dy);
      ctx.moveTo(s + dx, dy);
      ctx.bezierCurveTo(s * 0.4 + dx, dy, s * 0.15 + dx, s * 0.15 + dy, s * 0.12 + dx, s * 0.55 + dy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.3 + dx, s * 0.3 + dy, s * 0.07, 0, Math.PI * 2);
      ctx.stroke();
      // leaf pair
      ctx.beginPath();
      ctx.ellipse(s * 0.62 + dx, s * 0.3 + dy, s * 0.13, s * 0.05, -0.5, 0, Math.PI * 2);
      ctx.ellipse(s * 0.3 + dx, s * 0.62 + dy, s * 0.13, s * 0.05, -1.07, 0, Math.PI * 2);
      ctx.stroke();
    };
    draw(0.8, 0.8, "rgba(255,248,230,0.7)");
    draw(0, 0, "rgba(98,74,40,0.55)");
    ctx.restore();
  };
  const c = m + 12;
  flourish(c, c, 1, 1);
  flourish(w - c, c, -1, 1);
  flourish(c, h - c, 1, -1);
  flourish(w - c, h - c, -1, -1);

  // engraved centre text
  const engrave = (text: string, y: number, font: string, spacing = 0) => {
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
    ctx.fillStyle = "rgba(255,248,230,0.75)";
    ctx.fillText(text, w / 2 + 0.8, y + 0.8);
    ctx.fillStyle = "rgba(92,68,36,0.78)";
    ctx.fillText(text, w / 2, y);
  };
  const base = Math.min(w * 0.075, h * 0.13, 40);
  engrave("Scratch to reveal", h * 0.44, `italic 500 ${base}px ${serif}`);
  engrave("OUR SPECIAL DAY", h * 0.6, `600 ${Math.max(9, base * 0.32)}px ${sans}`, Math.max(2, base * 0.12));
}

export function ScratchReveal() {
  const { sfx } = useExperience();
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const revealedRef = useRef(false);

  // mutable scratch state kept outside React to avoid re-renders per move
  const s = useRef({
    drawing: false,
    last: null as null | [number, number],
    w: 0,
    h: 0,
    grid: new Uint8Array(GRID_X * GRID_Y),
    cleared: 0,
    brush: 24,
  });

  const reveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    setProgress(1);
    sfx.chime();
  }, [sfx]);

  // Size + paint the foil. Only repaints when the width actually changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let lastW = 0;
    let cancelled = false;

    const setup = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (!w || !h || w === lastW || revealedRef.current) return;
      lastW = w;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintFoil(ctx, w, h);
      const st = s.current;
      st.w = w;
      st.h = h;
      st.grid.fill(0);
      st.cleared = 0;
      st.brush = Math.max(18, Math.min(34, w * 0.065));
      setProgress(0);
      setReady(true);
    };

    // wait for the serif to load so the engraved text uses it
    void document.fonts.ready.then(() => !cancelled && setup());
    setup();
    const ro = new ResizeObserver(setup);
    ro.observe(wrap);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, []);

  const markCells = (x0: number, y0: number, x1: number, y1: number) => {
    const st = s.current;
    const cw = st.w / GRID_X;
    const ch = st.h / GRID_Y;
    const r = st.brush;
    const minX = Math.max(0, Math.floor((Math.min(x0, x1) - r) / cw));
    const maxX = Math.min(GRID_X - 1, Math.floor((Math.max(x0, x1) + r) / cw));
    const minY = Math.max(0, Math.floor((Math.min(y0, y1) - r) / ch));
    const maxY = Math.min(GRID_Y - 1, Math.floor((Math.max(y0, y1) + r) / ch));
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy || 1;
    for (let gy = minY; gy <= maxY; gy++) {
      for (let gx = minX; gx <= maxX; gx++) {
        const i = gy * GRID_X + gx;
        if (st.grid[i]) continue;
        const cx = (gx + 0.5) * cw;
        const cy = (gy + 0.5) * ch;
        const t = Math.max(0, Math.min(1, ((cx - x0) * dx + (cy - y0) * dy) / len2));
        const px = x0 + t * dx - cx;
        const py = y0 + t * dy - cy;
        if (px * px + py * py <= r * r) {
          st.grid[i] = 1;
          st.cleared++;
        }
      }
    }
  };

  const scratchTo = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    const st = s.current;
    if (!ctx) return;
    const [lx, ly] = st.last ?? [x, y];
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = st.brush * 2;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
    markCells(lx, ly, x, y);
    st.last = [x, y];
  };

  const local = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (revealedRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    s.current.drawing = true;
    s.current.last = null;
    if (!touched) setTouched(true);
    const [x, y] = local(e);
    scratchTo(x, y);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!s.current.drawing || revealedRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      scratchTo(ev.clientX - r.left, ev.clientY - r.top);
    }
    const p = s.current.cleared / (GRID_X * GRID_Y);
    if (p >= REVEAL_AT) reveal();
  };
  const onUp = () => {
    s.current.drawing = false;
    s.current.last = null;
    const p = s.current.cleared / (GRID_X * GRID_Y);
    setProgress(p);
    if (p >= REVEAL_AT) reveal();
  };

  return (
    <section id="save-the-date" aria-labelledby="save-the-date-title" className="section">
      <SectionHeading
        id="save-the-date-title"
        title="A special day awaits"
        lead={
          <>
            There&rsquo;s a little surprise hidden here.
            <br className="hidden sm:block" /> Scratch to discover our special day.
          </>
        }
      />

      <div className="mx-auto mt-12 flex max-w-[34rem] flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{ duration: 1.1, ease: SILK }}
          className="relative w-full"
        >
          <div
            ref={wrapRef}
            className="double-frame relative aspect-[4/3] w-full overflow-hidden rounded-[14px] sm:aspect-[3/2]"
          >
            {/* the hidden message */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-opacity duration-300 ${ready || revealed ? "opacity-100" : "opacity-0"}`}
              aria-hidden={!revealed}
            >
              <CornerFloral play={revealed} className="absolute left-0 top-0 w-20 sm:w-24" />
              <CornerFloral play={revealed} flip="xy" className="absolute bottom-0 right-0 w-20 sm:w-24" />
              <p className="label">Save the date</p>
              <p className="mt-3 flex items-baseline justify-center gap-3 text-ink sm:gap-4">
                <span className="font-numeral text-[clamp(3.5rem,14vw,5.5rem)] leading-none">{dayOfMonth}</span>
                <span className="flex flex-col items-start leading-none">
                  <span className="script text-[clamp(1.7rem,6.5vw,2.6rem)] text-burgundy">{monthName}</span>
                  <span className="font-numeral mt-1 text-[clamp(1rem,3.6vw,1.35rem)] tracking-[0.3em] text-brown">{year}</span>
                </span>
              </p>
              <p className="engraved mt-3 text-[clamp(0.85rem,2.6vw,1rem)] text-gold-deep">{weekday}</p>
              <LotusDivider play={revealed} width={200} className="mt-3" delay={0.4} />
              <p className="label mt-2 text-[clamp(0.6rem,2vw,0.7rem)] text-brown">An exciting new chapter begins</p>
            </div>

            {/* foil layer */}
            <AnimatePresence>
              {!revealed && (
                <motion.div
                  key="foil"
                  className="absolute inset-0"
                  style={ready ? undefined : { background: "linear-gradient(135deg,#C8AC80,#E8D5B0 30%,#BC9E70 55%,#DCC49A 80%)" }}
                  exit={{ opacity: 0, scale: reduce ? 1 : 1.03, filter: "blur(6px)" }}
                  transition={{ duration: 0.9, ease: SILK }}
                >
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                    aria-hidden="true"
                  />
                  {!touched && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 overflow-hidden"
                    >
                      <span
                        className="reduce-still absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                        style={{ animation: "foil-glint 4.5s var(--ease-silk) infinite 1s" }}
                      />
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {revealed && <Celebration />}
        </motion.div>

        {/* instruction + accessible alternative */}
        <div className="mt-8 flex min-h-[6.5rem] flex-col items-center gap-4 text-center">
          <AnimatePresence mode="wait">
            {!revealed ? (
              <motion.div
                key="hint"
                className="flex flex-col items-center gap-4"
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
              >
                <p className="flex items-center gap-2 text-sm text-brown">
                  <ScratchHintIcon />
                  {touched
                    ? `Keep going — ${Math.min(99, Math.round((progress / REVEAL_AT) * 100))}% there`
                    : "Scratch the gold foil with your finger or cursor"}
                </p>
                <button type="button" className="btn btn-ghost" onClick={reveal}>
                  Reveal date
                </button>
              </motion.div>
            ) : (
              <motion.p
                key="done"
                className="script text-[1.45rem] text-burgundy"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.3, ease: SILK }}
              >
                We can&rsquo;t wait to celebrate with you.
              </motion.p>
            )}
          </AnimatePresence>
          <p className="sr-only" aria-live="polite">
            {revealed ? `Date revealed: ${longDate}. An exciting new chapter begins.` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

function ScratchHintIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold-deep" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-.7a6 6 0 0 1-4.6-2.2L4.6 15.7a1.5 1.5 0 0 1 2.3-1.9L9 16" />
      <path d="M3 4.5c1.2-.9 2.4-.9 3.6 0M16.5 3c.9.4 1.6 1 2 1.9" />
    </svg>
  );
}
