let ctx = null;
let muted = false;
try {
  muted = localStorage.getItem("corper_muted") === "1";
} catch (e) {
  muted = false;
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, at, dur, type, vol, slideTo) {
  if (muted) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(at, dur, vol, cutoff) {
  if (muted) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime + at;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start(t);
}

const coin = (at) => {
  tone(988, at, 0.09, "square", 0.08);
  tone(1319, at + 0.09, 0.22, "square", 0.08);
};

export const isMuted = () => muted;

export function setMuted(m) {
  muted = m;
  try {
    localStorage.setItem("corper_muted", m ? "1" : "0");
  } catch (e) {
    // ignore
  }
}

export const sfx = {
  click() { tone(520, 0, 0.07, "square", 0.06); },
  denied() { tone(200, 0, 0.25, "square", 0.08, 120); },
  steps() { [0, 0.3, 0.6].forEach((t) => noise(t, 0.09, 0.14, 800)); },
  cds() { tone(784, 0.9, 0.6, "sine", 0.12); tone(988, 1.1, 0.7, "sine", 0.1); },
  hustle() { coin(0.9); coin(1.15); },
  rest() { tone(330, 0.9, 0.9, "sine", 0.08); tone(262, 1.2, 1.1, "sine", 0.07); },
  food() {
    noise(0.9, 0.8, 0.07, 3500);
    tone(300, 1.0, 0.12, "triangle", 0.08);
    tone(380, 1.15, 0.12, "triangle", 0.08);
  },
  eventBad() {
    tone(240, 1.3, 0.2, "sawtooth", 0.09, 160);
    tone(200, 1.55, 0.3, "sawtooth", 0.09, 120);
  },
  eventGood() { coin(1.3); coin(1.55); },
  allowance() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 1.7 + i * 0.1, 0.25, "square", 0.08));
  },
  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 1.6 + i * 0.25, 0.4, "triangle", 0.12));
  },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 1.6 + i * 0.15, 0.4, "square", 0.08));
  },
};