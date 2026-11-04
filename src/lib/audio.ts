/**
 * Sound engine.
 *
 * Browsers (Chrome, Safari, WhatsApp's in-app browser) do not allow a page to
 * start audio with sound until the visitor has interacted with it. So music
 * is "on" by default and we:
 *   1. try to start it as soon as the page loads (works where the browser
 *      already trusts the site), and otherwise
 *   2. start it on the visitor's very first tap / click / key press — in
 *      practice, the tap that opens the envelope.
 *
 * `eventConfig.music.src` is streamed through a Web Audio gain node so it can
 * fade smoothly (iOS ignores `audio.volume`). With no file configured, an
 * original music-box melody is synthesised instead.
 */

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  sfx: GainNode;
  reverb: ConvolverNode;
};

let engine: Engine | null = null;
let fileAudio: HTMLAudioElement | null = null;
let fileGain: GainNode | null = null;
let pauseTimer: number | null = null;
let schedulerTimer: number | null = null;
let nextNoteTime = 0;
let step = 0;
let playing = false;

function createEngine(): Engine | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = 0;
  const sfx = ctx.createGain();
  sfx.gain.value = 0.55;

  // Small-hall reverb from a generated impulse response.
  const reverb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 2.8);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
  }
  reverb.buffer = ir;
  const wet = ctx.createGain();
  wet.gain.value = 0.42;
  reverb.connect(wet).connect(ctx.destination);

  master.connect(ctx.destination);
  master.connect(reverb);
  sfx.connect(ctx.destination);
  sfx.connect(reverb);
  return { ctx, master, sfx, reverb };
}

/** Creates/resumes the shared AudioContext (resuming needs a user gesture). */
export function unlockAudio(): Engine | null {
  if (!engine) engine = createEngine();
  if (engine && engine.ctx.state === "suspended") void engine.ctx.resume();
  return engine;
}

/* ── Music-box voice ───────────────────────────────────────────────────── */

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function pluck(e: Engine, midi: number, time: number, vel: number, dest: AudioNode, decay = 2.4) {
  const { ctx } = e;
  const f = midiToHz(midi);
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, time);
  out.gain.linearRampToValueAtTime(vel, time + 0.006);
  out.gain.exponentialRampToValueAtTime(0.0008, time + decay);
  out.connect(dest);
  // Tine-like partials: fundamental, bright inharmonic overtones.
  const partials: [number, number][] = [
    [1, 1],
    [2.01, 0.28],
    [3.98, 0.1],
    [5.43, 0.045],
  ];
  for (const [ratio, amp] of partials) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f * ratio;
    const g = ctx.createGain();
    g.gain.value = amp;
    o.connect(g).connect(out);
    o.start(time);
    o.stop(time + decay + 0.05);
  }
}

/*
 * Original composition: 8-bar lullaby in D major, 66 bpm, eighth-note grid.
 * Each bar = 8 steps. Melody: [stepInBar, midi, lengthSteps].
 */
const CHORDS: number[][] = [
  [50, 57, 62, 66, 69, 66, 62, 57], // D
  [47, 54, 59, 62, 66, 62, 59, 54], // Bm
  [43, 50, 55, 59, 62, 59, 55, 50], // G
  [45, 52, 57, 61, 64, 61, 57, 52], // A
  [50, 57, 62, 66, 69, 66, 62, 57], // D
  [47, 54, 59, 62, 66, 62, 59, 54], // Bm
  [43, 50, 55, 59, 62, 59, 55, 50], // G
  [45, 52, 57, 61, 64, 61, 57, 50], // A → D
];
const MELODY: [number, number][][] = [
  [[0, 78], [3, 76], [4, 74]],
  [[0, 74], [2, 73], [4, 71]],
  [[0, 71], [2, 74], [4, 79], [7, 78]],
  [[0, 76]],
  [[0, 81], [3, 78], [4, 74], [6, 76]],
  [[0, 78], [4, 74], [6, 71]],
  [[0, 79], [2, 78], [4, 76], [6, 74]],
  [[0, 73], [2, 76], [4, 74]],
];
const STEP_SEC = 60 / 66 / 2;
const TOTAL_STEPS = CHORDS.length * 8;

function scheduleStep(e: Engine, s: number, time: number) {
  const bar = Math.floor(s / 8) % CHORDS.length;
  const inBar = s % 8;
  const harp = CHORDS[bar][inBar];
  pluck(e, harp + 12, time, 0.085, e.master, 2.8);
  for (const [at, note] of MELODY[bar]) {
    if (at === inBar) pluck(e, note + 12, time, 0.16, e.master, 3.2);
  }
}

function scheduler() {
  if (!engine) return;
  const ahead = 0.35;
  while (nextNoteTime < engine.ctx.currentTime + ahead) {
    scheduleStep(engine, step, nextNoteTime);
    nextNoteTime += STEP_SEC;
    step = (step + 1) % TOTAL_STEPS;
  }
}

/* ── Public API ────────────────────────────────────────────────────────── */

/** Create the <audio> element early so the file is buffered before the first tap. */
export function preloadMusic(src: string | null) {
  if (!src || fileAudio || typeof window === "undefined") return;
  fileAudio = new Audio(src);
  fileAudio.loop = true;
  fileAudio.preload = "auto";
  fileAudio.setAttribute("playsinline", "");
}

function routeFileThroughGain(e: Engine | null) {
  if (!fileAudio || fileGain || !e) return;
  try {
    const node = e.ctx.createMediaElementSource(fileAudio);
    fileGain = e.ctx.createGain();
    fileGain.gain.value = 0;
    node.connect(fileGain).connect(e.ctx.destination);
  } catch {
    fileGain = null; // fall back to element volume
  }
}

function rampTo(gain: GainNode, ctx: AudioContext, value: number, seconds: number) {
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(value, now + seconds);
}

export function isMusicPlaying() {
  return playing;
}

/**
 * Start music. Resolves `true` once audio is actually playing, `false` if the
 * browser blocked it (call again from the next user gesture).
 *
 * Every attempt runs independently (no de-duplication): for one tap the
 * browser fires pointerdown → touchend → click, and on iOS only the later
 * ones count as a gesture — each must get its own synchronous play() call.
 * Repeated play()/resume()/ramps are harmless.
 */
export async function startMusic(src: string | null, volume: number): Promise<boolean> {
  if (playing) return true;
  if (pauseTimer !== null) {
    window.clearTimeout(pauseTimer);
    pauseTimer = null;
  }

  if (src) {
    preloadMusic(src);
    const audio = fileAudio!;
    const e = unlockAudio();
    routeFileThroughGain(e);
    try {
      if (e && fileGain) {
        // Kick off both synchronously — iOS only honours play() inside the gesture.
        const played = audio.play();
        const resumed = e.ctx.state === "running" ? Promise.resolve() : e.ctx.resume();
        const [p] = await Promise.allSettled([played, resumed]);
        // A suspended context would play silently, so treat that as blocked.
        if (p.status === "rejected") return playing;
        if (e.ctx.state !== "running") {
          if (!playing) audio.pause(); // would play silently
          return false;
        }
        rampTo(fileGain, e.ctx, volume, 2.5);
      } else {
        audio.volume = volume;
        await audio.play();
      }
      playing = true;
      return true;
    } catch {
      return false;
    }
  }

  const e = unlockAudio();
  if (!e) return false;
  if (e.ctx.state !== "running") await e.ctx.resume().catch(() => {});
  if (e.ctx.state !== "running") return false;
  playing = true;
  rampTo(e.master, e.ctx, volume, 1.8);
  nextNoteTime = e.ctx.currentTime + 0.12;
  if (schedulerTimer === null) schedulerTimer = window.setInterval(scheduler, 90);
  scheduler();
  return true;
}

export function stopMusic() {
  if (!playing) return;
  playing = false;
  if (fileAudio) {
    const audio = fileAudio;
    if (engine && fileGain) {
      rampTo(fileGain, engine.ctx, 0, 0.6);
      pauseTimer = window.setTimeout(() => {
        pauseTimer = null;
        if (!playing) audio.pause();
      }, 650);
    } else {
      audio.pause();
    }
    return;
  }
  if (!engine) return;
  rampTo(engine.master, engine.ctx, 0, 0.6);
  if (schedulerTimer !== null) {
    window.clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

/** Soft paper rustle + card slide for the envelope opening. */
export function playPaper() {
  const e = unlockAudio();
  if (!e) return;
  const { ctx } = e;
  const t0 = ctx.currentTime + 0.02;
  const dur = 1.1;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / ctx.sampleRate;
    // crinkle: sparse spikes + a smooth "slide" bed
    const crinkle = Math.random() < 0.012 ? (Math.random() * 2 - 1) * 0.9 : 0;
    const bed = (Math.random() * 2 - 1) * 0.18 * Math.sin(Math.PI * Math.min(1, t / dur));
    d[i] = crinkle * Math.exp(-t * 2.2) + bed;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(2600, t0);
  bp.frequency.linearRampToValueAtTime(1200, t0 + dur);
  bp.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(bp).connect(g).connect(e.sfx);
  src.start(t0);
}

/** Three-note celebratory chime for the date reveal. */
export function playChime() {
  const e = unlockAudio();
  if (!e) return;
  const t = e.ctx.currentTime + 0.03;
  [86, 90, 93, 98].forEach((n, i) => pluck(e, n, t + i * 0.11, 0.12, e.sfx, 2.6));
}
