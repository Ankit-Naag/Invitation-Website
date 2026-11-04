"use client";

import { MotionConfig } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { eventConfig } from "@/config/event";
import { playChime, playPaper, preloadMusic, startMusic, stopMusic, unlockAudio } from "@/lib/audio";

type Experience = {
  /** True once the guest has opened the envelope. */
  opened: boolean;
  markOpened: () => void;
  /** Music preference — on by default, guest can mute (remembered per session). */
  soundOn: boolean;
  /** True while music is audibly playing. */
  playing: boolean;
  /** Toggle music; call from a click/tap handler. */
  toggleSound: () => void;
  /** Start music if wanted (call from a gesture handler). */
  resumeIfOptedIn: () => void;
  sfx: { paper: () => void; chime: () => void };
};

const ExperienceContext = createContext<Experience | null>(null);
const STORAGE_KEY = "as-engagement-sound";

/** Events that count as a "user activation" for audio in Chrome/Safari. */
const GESTURES = ["pointerdown", "touchend", "click", "keydown"] as const;

function readMuted(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    return false;
  }
}
function writePref(on: boolean) {
  try {
    sessionStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable (private mode) — preference just isn't remembered */
  }
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [opened, setOpened] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [playing, setPlaying] = useState(false);
  const soundOnRef = useRef(true);
  const { src, volume } = eventConfig.music;

  const tryStart = useCallback(() => {
    void startMusic(src, volume).then((ok) => {
      if (!ok) return;
      // The guest may have muted while the browser was still deciding.
      if (!soundOnRef.current) stopMusic();
      else setPlaying(true);
    });
  }, [src, volume]);

  // Respect a mute from earlier in this session, otherwise begin right away:
  // play immediately if the browser allows it, else on the first interaction.
  useEffect(() => {
    if (readMuted()) {
      soundOnRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from sessionStorage
      setSoundOn(false);
      return;
    }
    preloadMusic(src);
    tryStart();
  }, [src, tryStart]);

  // Until music is actually playing, every tap / click / key press retries.
  useEffect(() => {
    if (!soundOn || playing) return;
    const onGesture = () => tryStart();
    GESTURES.forEach((g) => window.addEventListener(g, onGesture, { capture: true, passive: true }));
    return () => GESTURES.forEach((g) => window.removeEventListener(g, onGesture, { capture: true }));
  }, [soundOn, playing, tryStart]);

  // Pause when the tab/app is in the background; resume on return.
  useEffect(() => {
    if (!soundOn || !playing) return;
    const onVis = () => {
      if (document.hidden) stopMusic();
      // If the browser won't resume without a tap, fall back to gesture listeners.
      else void startMusic(src, volume).then((ok) => !ok && setPlaying(false));
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [soundOn, playing, src, volume]);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    soundOnRef.current = next;
    setSoundOn(next);
    writePref(next);
    if (next) {
      unlockAudio();
      tryStart();
    } else {
      stopMusic();
      setPlaying(false);
    }
  }, [soundOn, tryStart]);

  const resumeIfOptedIn = useCallback(() => {
    if (soundOnRef.current) tryStart();
  }, [tryStart]);

  const markOpened = useCallback(() => setOpened(true), []);

  const sfx = useMemo(
    () => ({
      paper: () => soundOn && playPaper(),
      chime: () => soundOn && playChime(),
    }),
    [soundOn],
  );

  const value = useMemo(
    () => ({ opened, markOpened, soundOn, playing, toggleSound, resumeIfOptedIn, sfx }),
    [opened, markOpened, soundOn, playing, toggleSound, resumeIfOptedIn, sfx],
  );

  return (
    <ExperienceContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ExperienceContext.Provider>
  );
}

export function useExperience(): Experience {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used inside <ExperienceProvider>");
  return ctx;
}
