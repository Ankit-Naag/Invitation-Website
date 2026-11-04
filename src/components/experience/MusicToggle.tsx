"use client";

import { AnimatePresence, motion } from "motion/react";
import { useExperience } from "./ExperienceProvider";

/** Three-bar equaliser when playing, a quiet note when muted. */
export function SoundIcon({ on, muted = false }: { on: boolean; muted?: boolean }) {
  return (
    <span className="relative inline-flex h-4 w-4 items-end justify-center gap-[2px]" aria-hidden="true">
      {on ? (
        [0, 0.25, 0.5].map((d) => (
          <span
            key={d}
            className="reduce-still block w-[2.5px] origin-bottom rounded-full bg-current"
            style={{ height: "100%", animation: `bar-dance 1.1s ${d}s ease-in-out infinite` }}
          />
        ))
      ) : (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <path d="M6 12.2V3.5l7-1.5v8.5" />
          <circle cx="4.3" cy="12.3" r="1.8" />
          <circle cx="11.3" cy="10.6" r="1.8" />
          {muted && <path d="M1.5 1.5l13 13" />}
        </svg>
      )}
    </span>
  );
}

/** Floating music control, shown once the invitation is open. */
export function MusicToggle() {
  const { opened, soundOn, playing, toggleSound } = useExperience();
  return (
    <AnimatePresence>
      {opened && (
        <motion.button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute music" : "Play music"}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.92 }}
          className="fixed z-50 flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-ivory/85 text-burgundy shadow-[0_10px_30px_-12px_rgba(85,43,52,0.45)] backdrop-blur-md transition-colors hover:bg-champagne"
          style={{
            right: "max(1rem, env(safe-area-inset-right))",
            bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
          }}
        >
          <SoundIcon on={soundOn && playing} muted={!soundOn} />
          {soundOn && playing && (
            <span
              aria-hidden="true"
              className="reduce-still pointer-events-none absolute inset-0 rounded-full border border-gold/50"
              style={{ animation: "hint-pulse 2.4s ease-in-out infinite" }}
            />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
