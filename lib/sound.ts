// Tiny Web Audio helpers — no asset files (CSP-safe), no dependencies.
// The AudioContext is created lazily on the first sound, which always
// follows a user gesture (answering a problem), so autoplay policy is happy.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function note(freq: number, startAt: number, dur: number, type: OscillatorType = "sine", peak = 0.14) {
  const a = audio();
  if (!a) return;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = a.currentTime + startAt;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function playCorrect(muted?: boolean) {
  if (muted) return;
  note(660, 0, 0.12, "sine"); // E5
  note(880, 0.09, 0.16, "sine"); // A5 — a happy little rise
}

export function playLevelUp(muted?: boolean) {
  if (muted) return;
  // Ascending arpeggio C–E–G–C.
  [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.1, 0.22, "triangle", 0.16));
}

export function playWrong(muted?: boolean) {
  if (muted) return;
  // Soft, non-punishing "let's try" — two gentle low notes, quiet.
  note(300, 0, 0.14, "sine", 0.08);
  note(240, 0.12, 0.18, "sine", 0.08);
}
