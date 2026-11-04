"use client";

import { MotionConfig } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { eventConfig } from "@/config/event";
import { playChime, playPaper, startMusic, stopMusic, unlockAudio } from "@/lib/audio";

type Experience = {
  /** True once the guest has opened the envelope. */
  opened: boolean;
  markOpened: () => void;
  /** Guest's sound preference (remembered for this browser session). */
  soundOn: boolean;
  /** Toggle music; must be called from a click/tap handler. */
  toggleSound: () => void;
  /** Start music if the guest has opted in (call from a gesture). */
  resumeIfOptedIn: () => void;
  sfx: { paper: () => void; chime: () => void };
};

const ExperienceContext = createContext<Experience | null>(null);
const STORAGE_KEY = "as-engagement-sound";

function readPref(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "on";
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
  const [soundOn, setSoundOn] = useState(false);
  const { src, volume } = eventConfig.music;

  // Restore preference after hydration (server always renders "off").
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from sessionStorage
    if (readPref()) setSoundOn(true);
  }, []);

  // Pause when the tab is hidden; resume when it returns.
  useEffect(() => {
    if (!soundOn || !opened) return;
    const onVis = () => {
      if (document.hidden) stopMusic();
      else startMusic(src, volume);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [soundOn, opened, src, volume]);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    writePref(next);
    if (next) {
      unlockAudio();
      // Music begins once the invitation is open; before that we only arm it.
      if (opened) startMusic(src, volume);
    } else {
      stopMusic();
    }
  }, [soundOn, opened, src, volume]);

  const resumeIfOptedIn = useCallback(() => {
    if (soundOn) startMusic(src, volume);
  }, [soundOn, src, volume]);

  const markOpened = useCallback(() => setOpened(true), []);

  const sfx = useMemo(
    () => ({
      paper: () => soundOn && playPaper(),
      chime: () => soundOn && playChime(),
    }),
    [soundOn],
  );

  const value = useMemo(
    () => ({ opened, markOpened, soundOn, toggleSound, resumeIfOptedIn, sfx }),
    [opened, markOpened, soundOn, toggleSound, resumeIfOptedIn, sfx],
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
