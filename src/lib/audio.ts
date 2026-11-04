/**
 * Sound engine.
 *
 * - Nothing here runs until the visitor explicitly enables sound; the
 *   AudioContext is only created inside a user gesture.
 * - If `eventConfig.music.src` points to a licensed audio file, that file is
 *   streamed. Otherwise an original music-box lullaby is synthesised live
 *   (composed for this site — no third-party recording involved).
 */

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  sfx: GainNode;
  reverb: ConvolverNode;
};

let engine: Engine | null = null;
let fileAudio: HTMLAudioElement | null = null;
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

/** Must be called synchronously inside a click/tap handler. */
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

export function startMusic(src: string | null, volume: number) {
  if (playing) return;
  playing = true;
  if (src) {
    if (!fileAudio) {
      fileAudio = new Audio(src);
      fileAudio.loop = true;
      fileAudio.preload = "auto";
    }
    fileAudio.volume = volume;
    void fileAudio.play().catch(() => {
      playing = false;
    });
    return;
  }
  const e = unlockAudio();
  if (!e) {
    playing = false;
    return;
  }
  const now = e.ctx.currentTime;
  e.master.gain.cancelScheduledValues(now);
  e.master.gain.setValueAtTime(e.master.gain.value, now);
  e.master.gain.linearRampToValueAtTime(volume, now + 1.8);
  nextNoteTime = now + 0.12;
  if (schedulerTimer === null) schedulerTimer = window.setInterval(scheduler, 90);
  scheduler();
}

export function stopMusic() {
  if (!playing) return;
  playing = false;
  if (fileAudio) {
    fileAudio.pause();
    return;
  }
  if (!engine) return;
  const now = engine.ctx.currentTime;
  engine.master.gain.cancelScheduledValues(now);
  engine.master.gain.setValueAtTime(engine.master.gain.value, now);
  engine.master.gain.linearRampToValueAtTime(0, now + 0.6);
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
