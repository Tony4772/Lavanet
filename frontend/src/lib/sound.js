// Simple Web Audio synth for factory-floor confirmation sounds
let ctx = null;
const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Klass = window.AudioContext || window.webkitAudioContext;
    if (!Klass) return null;
    ctx = new Klass();
  }
  return ctx;
};

const tone = (freq, ms, vol = 0.14, type = "sine", delay = 0) => {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + ms / 1000);
};

// Pleasant "ding" (two-tone) for step advance
export const dingAdvance = () => {
  const c = getCtx(); if (!c) return;
  tone(880, 120, 0.16);
  tone(1320, 180, 0.14, "sine", 0.11);
};

// Deeper "success" chime for stage completion / delivery
export const dingSuccess = () => {
  const c = getCtx(); if (!c) return;
  tone(660, 130, 0.14);
  tone(880, 130, 0.14, "sine", 0.12);
  tone(1320, 200, 0.16, "sine", 0.24);
};
