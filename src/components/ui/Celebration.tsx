"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

type Piece = {
  kind: "petal" | "dust";
  x: number;
  y: number;
  rot: number;
  size: number;
  delay: number;
  dur: number;
  color: string;
};

const PETAL_COLORS = ["#E9D7D0", "#DDBFB6", "#C9A39A", "#F0E5D5"];
const DUST_COLORS = ["#B89B72", "#D9C29A", "#C8AC80"];

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const petal = i % 3 !== 0;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.25;
    const dist = 120 + Math.random() * 180;
    return {
      kind: petal ? "petal" : "dust",
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.75,
      rot: (Math.random() - 0.5) * 540,
      size: petal ? 10 + Math.random() * 10 : 3 + Math.random() * 4,
      delay: Math.random() * 0.25,
      dur: 2.4 + Math.random() * 1.4,
      color: petal
        ? PETAL_COLORS[i % PETAL_COLORS.length]
        : DUST_COLORS[i % DUST_COLORS.length],
    };
  });
}

/** A restrained one-shot burst of petals and gold dust. */
export function Celebration({ count = 30 }: { count?: number }) {
  const reduce = useReducedMotion();
  const [pieces] = useState(() => makePieces(count));
  const [done, setDone] = useState(false);
  // Remove the pieces once they've fallen, so nothing lingers off-screen.
  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), 4500);
    return () => window.clearTimeout(t);
  }, []);
  if (reduce || done) return null;
  return (
    <div className="pointer-events-none absolute -inset-x-4 -inset-y-24 z-10 flex items-center justify-center overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{ width: p.size, height: p.kind === "petal" ? p.size * 1.35 : p.size }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
          animate={{
            x: [0, p.x, p.x * 1.08],
            y: [0, p.y, p.y + 160],
            opacity: [0, 1, 0],
            rotate: [0, p.rot * 0.6, p.rot],
            scale: [0.4, 1, 0.9],
          }}
          transition={{ duration: p.dur, delay: p.delay, ease: [0.16, 0.84, 0.44, 1], times: [0, 0.35, 1] }}
        >
          {p.kind === "petal" ? (
            <svg viewBox="0 0 10 14" className="h-full w-full">
              <path d="M5 0 C9 3 9.5 9 5 14 C0.5 9 1 3 5 0Z" fill={p.color} stroke="#B89B72" strokeWidth="0.4" strokeOpacity="0.7" />
            </svg>
          ) : (
            <span className="block h-full w-full rounded-full" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
          )}
        </motion.span>
      ))}
    </div>
  );
}
