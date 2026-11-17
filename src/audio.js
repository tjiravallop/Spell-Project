import { elementFamily } from './words.js';

export class GameAudio {
  constructor(settings) { this.settings = settings; this.step = 0; this.active = false; this.voices = 0; }
  async unlock() {
    try {
      if (!this.context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return;
        this.context = new Audio();
        this.master = this.context.createGain();
        this.master.gain.value = 0.22;
        this.master.connect(this.context.destination);
        this.buses = {};
        for (const name of ['music', 'sfx', 'ui']) {
          this.buses[name] = this.context.createGain();
          this.buses[name].connect(this.master);
        }
        this.configure(this.settings);
        this.interval = setInterval(() => this.music(), 650);
      }
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* Audio is optional; unavailable devices must not prevent a turn. */ }
  }
  configure(settings) {
    this.settings = settings;
    if (!this.buses) return;
    for (const key of Object.keys(this.buses)) this.buses[key].gain.setTargetAtTime(settings[key] ** 2 * (key === 'music' ? 0.25 : 1), this.context.currentTime, 0.03);
  }
  tone(frequency, duration, bus = 'sfx', type = 'triangle', delay = 0, endFrequency = frequency) {
    if (!this.context || this.context.state !== 'running' || this.voices >= 16 || this.settings[bus] === 0) return;
    const t = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, t);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), t + duration);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    oscillator.connect(gain); gain.connect(this.buses[bus]);
    this.voices++;
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.voices--; };
    oscillator.start(t); oscillator.stop(t + duration + 0.02);
  }
  play(name) {
    if (name === 'place') this.tone(390, 0.08, 'ui', 'triangle', 0, 620);
    if (name === 'remove') this.tone(310, 0.07, 'ui', 'triangle', 0, 200);
    if (name === 'cast') {
      this.tone(330, 0.09, 'sfx', 'triangle', 0, 494);
      this.tone(494, 0.12, 'sfx', 'sine', 0.05, 659);
    }
    if (name === 'discover') {
      [392, 493.88, 587.33, 783.99].forEach((f, i) => this.tone(f, 0.24, 'sfx', 'triangle', i * 0.07, f * 1.02));
    }
    if (name === 'ward') this.tone(850, 0.18, 'sfx', 'square', 0, 300);
    if (name === 'hit') this.tone(100, 0.18, 'sfx', 'triangle', 0, 45);
    if (name === 'win') [262, 330, 392, 523].forEach((f, i) => this.tone(f, 0.35, 'sfx', 'triangle', i * 0.1));
    if (name === 'lose') [220, 196, 130].forEach((f, i) => this.tone(f, 0.4, 'sfx', 'triangle', i * 0.16));
  }
  combat(event) {
    if (event.type === 'projectile') {
      if (event.blocked) this.play('ward');
      else if (event.form === 'storm' && !event.elements.length) this.tone(240, 0.20, 'sfx', 'triangle', 0, 82);
      else for (const element of event.elements) {
        const fam = elementFamily(element);
        const [start, end, wave] = ({
          fire: [240, 100, 'sawtooth'],
          ice: [690, 970, 'sine'],
          lightning: [950, 410, 'square'],
          earth: [165, 68, 'triangle'],
          water: [520, 740, 'sine'],
          wind: [450, 155, 'triangle'],
          vayu: [450, 155, 'triangle'],
        }[fam] ?? [330, 180, 'triangle']);
        this.tone(event.size > 1 ? start / 1.4 : start, event.form === 'beam' ? 0.15 : 0.10, 'sfx', wave, 0, end);
      }
      if (event.pierce && !event.blocked) this.tone(1150, 0.065, 'sfx', 'triangle', 0.02, 520);
    } else if (event.type === 'damage' && event.amount > 0) this.play('hit');
    else if (event.type === 'blast') this.tone(150, event.devastation ? 0.32 : 0.15, 'sfx', 'sawtooth', 0, 38);
    else if (event.type === 'attack') {
      if (event.absorbed > 0) this.tone(560, 0.11, 'sfx', 'triangle', 0, 280);
      if (event.ultimate) {
        if (event.sourceKind === 'tempest_archon') {
          this.tone(980, 0.08, 'sfx', 'square', 0, 220);
          this.tone(540, 0.14, 'sfx', 'sawtooth', 0.04, 72);
          this.tone(110, 0.34, 'sfx', 'sawtooth', 0.06, 36);
        } else {
          this.tone(220, 0.28, 'sfx', 'sawtooth', 0, 52);
          this.tone(140, 0.36, 'sfx', 'triangle', 0.04, 34);
          this.tone(420, 0.12, 'sfx', 'square', 0.08, 130);
        }
      } else if (event.specialBoss || event.heavy) {
        this.tone(135, 0.24, 'sfx', 'sawtooth', 0, 44);
        if (event.amount) this.play('hit');
      } else if (event.amount) {
        this.play('hit');
      }
    } else if (event.type === 'charge') {
      if (event.specialBoss) {
        if (event.sourceKind === 'tempest_archon') {
          this.tone(320, 0.18, 'sfx', 'square', 0, 960);
          this.tone(160, 0.24, 'sfx', 'triangle', 0.04, 480);
        } else {
          this.tone(110, 0.24, 'sfx', 'sawtooth', 0, 280);
          this.tone(220, 0.22, 'sfx', 'triangle', 0.05, 440);
        }
      }
    } else if (event.type === 'mirror-reflect') {
      this.tone(760, 0.08, 'sfx', 'triangle', 0, 480);
      if (event.amount) this.play('hit');
    } else if (event.type === 'ember-thorns') {
      this.tone(260, 0.12, 'sfx', 'sawtooth', 0, 105);
      if (event.amount) this.play('hit');
    } else if (event.type === 'storm-static') {
      this.tone(960, 0.10, 'sfx', 'square', 0, 380);
      if (event.amount) this.play('hit');
    } else if (event.type === 'mana-refund') {
      this.tone(523, 0.09, 'sfx', 'sine', 0, 784);
    } else if (event.type === 'relic') {
      this.play('discover');
    }
    else if (event.type === 'shield') this.tone(event.element === 'ice' ? 570 : 330, 0.12, 'sfx', 'sine', 0, 660);
    else if (event.type === 'heal') this.tone(440, 0.12, 'sfx', 'sine', 0, 880);
    else if (event.type === 'push') this.tone(430, 0.10, 'sfx', 'triangle', 0, 100);
    else if (event.type === 'status') {
      if (event.status === 'burn') this.tone(195, 0.10, 'sfx', 'sawtooth', 0, 95);
      else this.tone(1200, 0.13, 'sfx', 'sine', 0, 620);
    } else if (event.type === 'fizzle') {
      this.tone(190, 0.14, 'sfx', 'sawtooth', 0, 72);
      this.tone(125, 0.18, 'sfx', 'triangle', 0.08, 48);
    }
  }
  music() {
    if (!this.active || document.hidden) return;
    const notes = [130.81, 164.81, 196, 164.81, 146.83, 174.61, 220, 174.61, 130.81, 164.81, 196, 261.63, 123.47, 146.83, 196, 146.83];
    const frequency = notes[this.step++ % notes.length];
    this.tone(frequency, 1.1, 'music', 'triangle');
    if (this.step % 4 === 1) this.tone(frequency / 2, 1.6, 'music', 'sine');
  }
  dispose() { clearInterval(this.interval); this.context?.close().catch(() => {}); }
}

