// audio.js — every sound is synthesised with the Web Audio API, no files.
// A soft sizzle while the wok is hot, a bubbling blip for the pot, a chop
// tick, a bell ding, a coin arpeggio, and a little pluck melody that
// quickens when the Ember Rush starts.

export class SoundEngine {
  constructor() {
    this.context = null;
    this.muted = false;
    this.sizzleNodes = null;
    this.melodyTimer = null;
    this.melodyStep = 0;
  }

  // The context only starts after the player's first click, so nothing
  // auto-plays before they have touched the game.
  ensure() {
    if (this.context) {
      if (this.context.state === "suspended") void this.context.resume();
      return true;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      this.context = new Ctor();
    } catch {
      return false;
    }
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  tone(freq, seconds, type, gain, when = 0, slideTo = null) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const amp = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(amp).connect(this.context.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  noiseBurst(seconds, gain, filterFreq) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime;
    const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    const amp = this.context.createGain();
    amp.gain.value = gain;
    source.connect(filter).connect(amp).connect(this.context.destination);
    source.start(start);
  }

  chop() {
    this.noiseBurst(0.07, 0.25, 1800);
    this.tone(180, 0.06, "triangle", 0.12);
  }

  pickup() {
    this.tone(520, 0.07, "sine", 0.08, 0, 700);
  }

  place() {
    this.tone(340, 0.08, "triangle", 0.1, 0, 260);
  }

  bubble() {
    this.tone(220 + Math.random() * 160, 0.09, "sine", 0.05, 0, 420);
  }

  ding() {
    this.tone(1046, 0.5, "sine", 0.16);
    this.tone(1568, 0.35, "sine", 0.1, 0.02);
  }

  coin() {
    this.tone(988, 0.09, "square", 0.06);
    this.tone(1319, 0.14, "square", 0.06, 0.08);
    this.tone(1568, 0.2, "square", 0.05, 0.16);
  }

  thud() {
    this.tone(140, 0.25, "sine", 0.2, 0, 60);
    this.noiseBurst(0.12, 0.12, 300);
  }

  tick() {
    this.tone(880, 0.05, "square", 0.05);
  }

  burn() {
    this.noiseBurst(0.3, 0.15, 500);
    this.tone(220, 0.3, "sawtooth", 0.06, 0, 110);
  }

  fanfare() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, i) => this.tone(freq, 0.22, "triangle", 0.1, i * 0.11));
  }

  startSizzle() {
    if (!this.context || this.muted || this.sizzleNodes) return;
    const length = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 4000;
    const amp = this.context.createGain();
    amp.gain.value = 0.035;
    source.connect(filter).connect(amp).connect(this.context.destination);
    source.start();
    this.sizzleNodes = { source, amp };
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try {
      this.sizzleNodes.source.stop();
    } catch {
      // already stopped
    }
    this.sizzleNodes = null;
  }

  // A gentle pentatonic pluck that plays through the shift; the rush
  // version is the same tune at a faster step.
  startMelody(rush) {
    if (!this.context || this.melodyTimer) return;
    const scale = [262, 294, 330, 392, 440, 523, 587, 659];
    const pattern = [0, 2, 4, 7, 4, 2, 5, 3, 0, 2, 4, 5, 7, 5, 4, 2];
    this.melodyTimer = window.setInterval(() => {
      if (this.muted) return;
      const step = pattern[this.melodyStep % pattern.length];
      this.melodyStep += 1;
      this.tone(scale[step], 0.32, "triangle", 0.045);
      if (this.melodyStep % 4 === 0) this.tone(scale[step] / 2, 0.4, "sine", 0.04);
    }, rush ? 260 : 420);
  }

  setRush(rush) {
    if (!this.melodyTimer) return;
    window.clearInterval(this.melodyTimer);
    this.melodyTimer = null;
    this.startMelody(rush);
  }

  stopMelody() {
    if (this.melodyTimer) window.clearInterval(this.melodyTimer);
    this.melodyTimer = null;
  }
}
