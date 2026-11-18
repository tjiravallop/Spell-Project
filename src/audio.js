import { elementFamily, FUSION_COMPONENTS } from './words.js';

export class GameAudio {
  constructor(settings = {}) {
    this.settings = settings;
    this.step = 0;
    this.active = false;
    this.voices = 0;
    this.noiseBuffer = null;
    this.context = null;
    this.master = null;
    this.buses = null;
    this.musicDuckGain = null;
    this.interval = null;
  }

  async unlock() {
    try {
      if (!this.context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return;
        this.context = new Audio();

        // Master Limiter / Compressor for clean headroom (-1 dBTP) and distortion prevention
        this.limiter = this.context.createDynamicsCompressor();
        this.limiter.threshold.setValueAtTime(-1.0, this.context.currentTime);
        this.limiter.knee.setValueAtTime(3.0, this.context.currentTime);
        this.limiter.ratio.setValueAtTime(20.0, this.context.currentTime);
        this.limiter.attack.setValueAtTime(0.002, this.context.currentTime);
        this.limiter.release.setValueAtTime(0.08, this.context.currentTime);

        this.master = this.context.createGain();
        this.master.gain.value = 0.28;
        this.master.connect(this.limiter);
        this.limiter.connect(this.context.destination);

        // Buses architecture: Music, SFX, UI
        this.buses = {};
        for (const name of ['music', 'sfx', 'ui']) {
          this.buses[name] = this.context.createGain();
        }

        // Dedicated ducking gain node for music (ducking never overwrites user slider)
        this.musicDuckGain = this.context.createGain();
        this.musicDuckGain.gain.value = 1.0;
        this.buses.music.connect(this.musicDuckGain);
        this.musicDuckGain.connect(this.master);

        this.buses.sfx.connect(this.master);
        this.buses.ui.connect(this.master);

        // Pre-generate 1-second white noise buffer for procedural synthesis
        this.initNoiseBuffer();

        this.configure(this.settings);
        this.interval = setInterval(() => this.music(), 540);
      }
      if (this.context.state === 'suspended') await this.context.resume();
    } catch {
      /* Audio is optional; unavailable audio devices must not break combat or game flow. */
    }
  }

  initNoiseBuffer() {
    if (!this.context) return;
    const sampleRate = this.context.sampleRate || 44100;
    const buffer = this.context.createBuffer(1, sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleRate; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  configure(settings = {}) {
    this.settings = settings;
    if (!this.buses || !this.context) return;
    const t = this.context.currentTime;
    for (const key of ['music', 'sfx', 'ui']) {
      if (this.buses[key]) {
        const slider = Math.max(0, Math.min(1, Number(settings[key]) ?? 1));
        // Square slider value for natural logarithmic perceived volume curve
        const targetGain = slider ** 2 * (key === 'music' ? 0.24 : 0.85);
        this.buses[key].gain.setTargetAtTime(targetGain, t, 0.03);
      }
    }
  }

  duckMusic(dipTo = 0.35, duration = 0.28) {
    if (!this.context || !this.musicDuckGain || (this.settings.music ?? 1) === 0) return;
    const t = this.context.currentTime;
    this.musicDuckGain.gain.cancelScheduledValues(t);
    this.musicDuckGain.gain.setValueAtTime(this.musicDuckGain.gain.value, t);
    this.musicDuckGain.gain.linearRampToValueAtTime(dipTo, t + 0.02);
    this.musicDuckGain.gain.setTargetAtTime(1.0, t + 0.06, duration);
  }

  tone(frequency, duration, bus = 'sfx', type = 'triangle', delay = 0, endFrequency = frequency, options = {}) {
    if (!this.context || this.context.state !== 'running' || this.voices >= 28 || (this.settings[bus] ?? 1) === 0) return;
    const t = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const maxGain = options.gain ?? 0.3;

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, frequency), t);
    if (endFrequency && endFrequency !== frequency) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), t + duration);
    }

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(maxGain, t + (options.attack ?? 0.012));
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    let outputNode = gain;
    if (options.filterType && options.filterFreq) {
      const filter = this.context.createBiquadFilter();
      filter.type = options.filterType;
      filter.frequency.setValueAtTime(Math.max(20, options.filterFreq), t);
      if (options.filterQ) filter.Q.setValueAtTime(options.filterQ, t);
      if (options.filterEndFreq) {
        filter.frequency.exponentialRampToValueAtTime(Math.max(20, options.filterEndFreq), t + duration);
      }
      gain.connect(filter);
      outputNode = filter;
    }

    osc.connect(gain);
    outputNode.connect(this.buses[bus] ?? this.master);

    this.voices++;
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
        if (outputNode !== gain) outputNode.disconnect();
      } catch {}
      this.voices--;
    };
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  noise(duration, { bus = 'sfx', filterType = 'lowpass', filterFreq = 1000, filterEndFreq = null, filterQ = 1, gain = 0.25, delay = 0, attack = 0.008 } = {}) {
    if (!this.context || this.context.state !== 'running' || this.voices >= 28 || !this.noiseBuffer || (this.settings[bus] ?? 1) === 0) return;
    const t = this.context.currentTime + delay;
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const filter = this.context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(Math.max(20, filterFreq), t);
    filter.Q.setValueAtTime(filterQ, t);
    if (filterEndFreq) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, filterEndFreq), t + duration);
    }

    const gainNode = this.context.createGain();
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(gain, t + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.buses[bus] ?? this.master);

    this.voices++;
    source.onended = () => {
      try {
        source.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      } catch {}
      this.voices--;
    };
    source.start(t);
    source.stop(t + duration + 0.03);
  }

  subThump(duration = 0.22, baseFreq = 75, endFreq = 30, gain = 0.45) {
    this.tone(baseFreq, duration, 'sfx', 'sine', 0, endFreq, { gain, attack: 0.005 });
    this.noise(duration * 0.75, { bus: 'sfx', filterType: 'lowpass', filterFreq: 180, gain: gain * 0.6 });
  }

  play(name) {
    if (!this.context) return;
    if (name === 'place') {
      // Tactile wooden card snap with slight organic pitch variation
      const pitchVar = (Math.random() - 0.5) * 35;
      this.tone(420 + pitchVar, 0.065, 'ui', 'triangle', 0, 600 + pitchVar, { gain: 0.22 });
      this.noise(0.035, { bus: 'ui', filterType: 'bandpass', filterFreq: 1500, gain: 0.09 });
    }
    else if (name === 'remove') {
      const pitchVar = (Math.random() - 0.5) * 30;
      this.tone(360 + pitchVar, 0.055, 'ui', 'triangle', 0, 210 + pitchVar, { gain: 0.20 });
    }
    else if (name === 'cast') {
      // Mystical spell invocation sweep
      this.tone(280, 0.11, 'sfx', 'triangle', 0, 520, { gain: 0.28 });
      this.tone(440, 0.16, 'sfx', 'sine', 0.03, 784, { gain: 0.24 });
      this.noise(0.12, { bus: 'sfx', filterType: 'bandpass', filterFreq: 1200, filterEndFreq: 450, gain: 0.16 });
    }
    else if (name === 'discover') {
      // 16-bit retro crystal arpeggio fanfare (C major 9th)
      const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      chord.forEach((f, i) => {
        this.tone(f, 0.32, 'sfx', 'sine', i * 0.05, f * 1.01, { gain: 0.18 });
        if (i >= 3) this.tone(f * 2, 0.24, 'sfx', 'triangle', i * 0.05 + 0.02, f * 2, { gain: 0.10 });
      });
    }
    else if (name === 'ward') {
      // Glassy magical barrier chime + crystal shimmer
      this.tone(920, 0.16, 'sfx', 'triangle', 0, 360, { gain: 0.32 });
      this.tone(1380, 0.12, 'sfx', 'sine', 0.02, 690, { gain: 0.22 });
      this.noise(0.08, { bus: 'sfx', filterType: 'bandpass', filterFreq: 2200, gain: 0.18 });
    }
    else if (name === 'hit') {
      // Punchy combat impact with sub-bass weight
      this.subThump(0.18, 95, 34, 0.42);
      this.noise(0.09, { bus: 'sfx', filterType: 'bandpass', filterFreq: 650, gain: 0.28 });
    }
    else if (name === 'weakness') {
      // ⚡ จุดอ่อน! Resonant golden critical hit arpeggio
      this.duckMusic(0.3, 0.35);
      this.subThump(0.24, 110, 36, 0.48);
      [783.99, 1046.50, 1318.51, 1567.98].forEach((f, i) => {
        this.tone(f, 0.36, 'sfx', 'sine', i * 0.035, f * 1.02, { gain: 0.26 });
        this.tone(f * 1.5, 0.22, 'sfx', 'triangle', i * 0.035 + 0.01, f * 1.5, { gain: 0.14 });
      });
      this.noise(0.14, { bus: 'sfx', filterType: 'highpass', filterFreq: 2400, gain: 0.22 });
    }
    else if (name === 'resisted') {
      // 🛡 ต้านทาน! Muffled, deflected low metallic clang
      this.tone(160, 0.16, 'sfx', 'sawtooth', 0, 75, { gain: 0.25, filterType: 'lowpass', filterFreq: 400 });
      this.tone(110, 0.22, 'sfx', 'triangle', 0.02, 55, { gain: 0.32 });
      this.noise(0.08, { bus: 'sfx', filterType: 'lowpass', filterFreq: 320, gain: 0.24 });
    }
    else if (name === 'wall-slam') {
      // Heavy crunching slam into edge or obstacle
      this.subThump(0.26, 85, 26, 0.52);
      this.noise(0.16, { bus: 'sfx', filterType: 'lowpass', filterFreq: 380, gain: 0.38 });
    }
    else if (name === 'win') {
      // Triumphant victory fanfare progression
      this.duckMusic(0.25, 0.6);
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
      notes.forEach((f, i) => {
        this.tone(f, 0.45, 'sfx', 'triangle', i * 0.08, f, { gain: 0.26 });
        this.tone(f * 2, 0.35, 'sfx', 'sine', i * 0.08 + 0.02, f * 2, { gain: 0.16 });
      });
    }
    else if (name === 'lose') {
      // Somber descending minor tones
      const notes = [293.66, 261.63, 220.00, 174.61, 146.83];
      notes.forEach((f, i) => {
        this.tone(f, 0.50, 'sfx', 'triangle', i * 0.14, f * 0.98, { gain: 0.30 });
      });
      this.tone(73.42, 1.2, 'sfx', 'sine', 0.5, 55, { gain: 0.40 });
    }
    else if (name === 'invalid') {
      this.tone(160, 0.08, 'ui', 'square', 0, 130, { gain: 0.25 });
      this.tone(130, 0.10, 'ui', 'square', 0.09, 100, { gain: 0.25 });
    }
  }

  combat(event = {}) {
    if (!event || !event.type) return;

    if (event.type === 'projectile') {
      if (event.blocked) {
        this.play('ward');
      } else if (event.form === 'storm' && (!event.elements || !event.elements.length)) {
        // Pure raw storm: howling wind and thunder
        this.tone(220, 0.24, 'sfx', 'triangle', 0, 70, { gain: 0.32 });
        this.noise(0.28, { bus: 'sfx', filterType: 'bandpass', filterFreq: 600, filterEndFreq: 1200, gain: 0.25 });
      } else {
        const elements = event.elements ?? (event.element ? [event.element] : []);
        const sizeMult = event.size > 1 ? 0.75 : 1;
        const dur = event.form === 'beam' ? 0.20 : 0.13;

        for (const elem of elements) {
          const fam = elementFamily(elem);
          const isHybrid = Boolean(FUSION_COMPONENTS[elem]);

          if (isHybrid) {
            // Tier 3 Dual-Element Epic Syntheses
            switch (elem) {
              case 'magma':
                this.subThump(0.24, 70, 26, 0.42);
                this.tone(240, 0.18, 'sfx', 'sawtooth', 0.02, 90, { gain: 0.30 });
                this.noise(0.20, { bus: 'sfx', filterType: 'lowpass', filterFreq: 500, gain: 0.26 });
                break;
              case 'plasma':
                this.tone(960, 0.16, 'sfx', 'sawtooth', 0, 240, { gain: 0.36 });
                this.tone(480, 0.20, 'sfx', 'square', 0.02, 120, { gain: 0.28 });
                this.noise(0.14, { bus: 'sfx', filterType: 'bandpass', filterFreq: 1800, gain: 0.30 });
                break;
              case 'permafrost':
                this.subThump(0.20, 80, 32, 0.38);
                this.tone(880, 0.22, 'sfx', 'sine', 0.03, 1320, { gain: 0.28 });
                break;
              case 'shockstream':
                this.tone(520, 0.15, 'sfx', 'sine', 0, 740, { gain: 0.24 });
                this.tone(1100, 0.12, 'sfx', 'square', 0.03, 380, { gain: 0.32 });
                break;
              case 'thunderstorm':
                this.subThump(0.26, 65, 24, 0.45);
                this.tone(1050, 0.14, 'sfx', 'square', 0.02, 280, { gain: 0.36 });
                this.noise(0.22, { bus: 'sfx', filterType: 'bandpass', filterFreq: 800, gain: 0.28 });
                break;
              case 'heatwave':
                this.tone(260, 0.20, 'sfx', 'sawtooth', 0, 95, { gain: 0.32 });
                this.noise(0.24, { bus: 'sfx', filterType: 'bandpass', filterFreq: 900, filterEndFreq: 1800, gain: 0.26 });
                break;
              case 'chillgale':
                this.tone(680, 0.22, 'sfx', 'sine', 0, 980, { gain: 0.26 });
                this.noise(0.22, { bus: 'sfx', filterType: 'highpass', filterFreq: 1600, gain: 0.24 });
                break;
              case 'frostvolt':
                this.tone(1150, 0.14, 'sfx', 'square', 0, 390, { gain: 0.34 });
                this.tone(880, 0.20, 'sfx', 'sine', 0.04, 1320, { gain: 0.26 });
                break;
              case 'scald':
                this.tone(300, 0.16, 'sfx', 'sawtooth', 0, 110, { gain: 0.28 });
                this.noise(0.18, { bus: 'sfx', filterType: 'bandpass', filterFreq: 1500, gain: 0.32 });
                break;
              case 'mudmire':
                this.subThump(0.18, 90, 36, 0.38);
                this.tone(440, 0.14, 'sfx', 'sine', 0.02, 220, { gain: 0.26 });
                break;
              case 'dust':
                this.tone(180, 0.18, 'sfx', 'triangle', 0, 70, { gain: 0.30 });
                this.noise(0.20, { bus: 'sfx', filterType: 'bandpass', filterFreq: 750, gain: 0.25 });
                break;
              case 'mist':
                this.tone(540, 0.18, 'sfx', 'sine', 0, 720, { gain: 0.22 });
                this.noise(0.18, { bus: 'sfx', filterType: 'bandpass', filterFreq: 1100, gain: 0.16 });
                break;
              case 'hail':
                this.tone(920, 0.18, 'sfx', 'sine', 0, 1380, { gain: 0.28 });
                this.noise(0.12, { bus: 'sfx', filterType: 'highpass', filterFreq: 2200, gain: 0.22 });
                break;
              case 'monsoon':
                this.tone(500, 0.20, 'sfx', 'sine', 0, 680, { gain: 0.26 });
                this.noise(0.24, { bus: 'sfx', filterType: 'bandpass', filterFreq: 550, filterEndFreq: 1200, gain: 0.28 });
                break;
              case 'magnet':
                this.tone(220, 0.22, 'sfx', 'square', 0, 440, { gain: 0.25, filterType: 'bandpass', filterFreq: 660 });
                this.subThump(0.18, 80, 40, 0.30);
                break;
              default:
                this.tone(360, dur, 'sfx', 'triangle', 0, 180, { gain: 0.28 });
            }
          } else {
            // Core Tier 1 & Tier 2 Elements
            switch (fam) {
              case 'fire':
                this.tone(250 * sizeMult, dur, 'sfx', 'sawtooth', 0, 95 * sizeMult, { gain: 0.32 });
                this.noise(dur * 1.1, { bus: 'sfx', filterType: 'lowpass', filterFreq: 750, gain: 0.25 });
                break;
              case 'ice':
                this.tone(720 * sizeMult, dur * 1.2, 'sfx', 'sine', 0, 1080 * sizeMult, { gain: 0.28 });
                this.tone(1440 * sizeMult, dur * 0.8, 'sfx', 'triangle', 0.02, 1440 * sizeMult, { gain: 0.14 });
                break;
              case 'lightning':
                this.tone(1020 * sizeMult, dur * 0.9, 'sfx', 'square', 0, 340 * sizeMult, { gain: 0.35 });
                this.noise(dur * 0.7, { bus: 'sfx', filterType: 'highpass', filterFreq: 1800, gain: 0.26 });
                break;
              case 'earth':
                this.subThump(dur * 1.3, 140 * sizeMult, 48 * sizeMult, 0.44);
                break;
              case 'water':
                this.tone(480 * sizeMult, dur * 1.1, 'sfx', 'sine', 0, 720 * sizeMult, { gain: 0.26 });
                this.noise(dur, { bus: 'sfx', filterType: 'bandpass', filterFreq: 820, gain: 0.18 });
                break;
              case 'wind':
                this.tone(420 * sizeMult, dur, 'sfx', 'triangle', 0, 160 * sizeMult, { gain: 0.28 });
                this.noise(dur * 1.2, { bus: 'sfx', filterType: 'bandpass', filterFreq: 850, filterEndFreq: 1400, gain: 0.26 });
                break;
              default:
                this.tone(330 * sizeMult, dur, 'sfx', 'triangle', 0, 180 * sizeMult, { gain: 0.25 });
            }
          }
        }
      }

      if (event.pierce && !event.blocked) {
        this.tone(1250, 0.07, 'sfx', 'triangle', 0.02, 600, { gain: 0.22 });
      }
      if (event.grand) {
        this.duckMusic(0.3, 0.4);
      }
    }
    else if (event.type === 'damage' && event.amount > 0) {
      if (event.weakness) {
        this.play('weakness');
      } else if (event.resisted) {
        this.play('resisted');
      } else {
        this.play('hit');
      }
      if (event.killed) {
        this.tone(587.33, 0.18, 'sfx', 'sine', 0.03, 880, { gain: 0.24 });
      }
    }
    else if (event.type === 'blast') {
      this.duckMusic(0.3, event.devastation ? 0.6 : 0.35);
      const dur = event.devastation ? 0.45 : 0.22;
      this.subThump(dur, 110, 25, event.devastation ? 0.65 : 0.48);
      this.noise(dur * 1.1, { bus: 'sfx', filterType: 'lowpass', filterFreq: 450, gain: 0.42 });
    }
    else if (event.type === 'wall-slam') {
      this.play('wall-slam');
    }
    else if (event.type === 'chain-lightning') {
      this.tone(960, 0.11, 'sfx', 'square', 0, 360, { gain: 0.34 });
      this.noise(0.08, { bus: 'sfx', filterType: 'highpass', filterFreq: 1800, gain: 0.22 });
    }
    else if (event.type === 'magma-puddle') {
      this.tone(180, 0.12, 'sfx', 'sawtooth', 0, 80, { gain: 0.22 });
      this.noise(0.14, { bus: 'sfx', filterType: 'bandpass', filterFreq: 700, gain: 0.18 });
    }
    else if (event.type === 'magma-erupt') {
      this.duckMusic(0.35, 0.3);
      this.subThump(0.24, 90, 30, 0.46);
      this.noise(0.20, { bus: 'sfx', filterType: 'lowpass', filterFreq: 550, gain: 0.36 });
    }
    else if (event.type === 'attack') {
      if (event.absorbed > 0) {
        this.tone(580, 0.12, 'sfx', 'triangle', 0, 260, { gain: 0.28 });
      }
      if (event.ultimate) {
        this.duckMusic(0.2, 0.65);
        if (event.sourceKind === 'tempest_archon') {
          this.tone(1050, 0.14, 'sfx', 'square', 0, 190, { gain: 0.42 });
          this.tone(560, 0.24, 'sfx', 'sawtooth', 0.03, 60, { gain: 0.38 });
          this.subThump(0.48, 120, 24, 0.62);
        } else {
          this.tone(240, 0.34, 'sfx', 'sawtooth', 0, 48, { gain: 0.42 });
          this.subThump(0.44, 130, 28, 0.58);
          this.tone(440, 0.18, 'sfx', 'square', 0.06, 110, { gain: 0.32 });
        }
      } else if (event.specialBoss || event.heavy) {
        this.duckMusic(0.35, 0.35);
        this.subThump(0.30, 115, 34, 0.52);
        if (event.amount) this.play('hit');
      } else if (event.amount) {
        this.play('hit');
      }
    }
    else if (event.type === 'charge') {
      if (event.specialBoss) {
        this.tone(140, 0.32, 'sfx', 'sawtooth', 0, 380, { gain: 0.34 });
        this.tone(260, 0.28, 'sfx', 'triangle', 0.05, 520, { gain: 0.28 });
      }
    }
    else if (event.type === 'mirror-reflect') {
      this.tone(840, 0.12, 'sfx', 'triangle', 0, 420, { gain: 0.30 });
      if (event.amount) this.play('hit');
    }
    else if (event.type === 'ember-thorns') {
      this.tone(280, 0.14, 'sfx', 'sawtooth', 0, 110, { gain: 0.28 });
      if (event.amount) this.play('hit');
    }
    else if (event.type === 'storm-static') {
      this.tone(1020, 0.12, 'sfx', 'square', 0, 420, { gain: 0.32 });
      if (event.amount) this.play('hit');
    }
    else if (event.type === 'mana-refund') {
      this.tone(523.25, 0.10, 'sfx', 'sine', 0, 783.99, { gain: 0.25 });
    }
    else if (event.type === 'relic') {
      this.play('discover');
    }
    else if (event.type === 'shield') {
      const freq = event.element === 'ice' || event.element === 'permafrost' ? 620 : 340;
      this.tone(freq, 0.16, 'sfx', 'sine', 0, freq * 1.5, { gain: 0.26 });
    }
    else if (event.type === 'heal') {
      // Gentle restorative arpeggio
      this.tone(440, 0.14, 'sfx', 'sine', 0, 659.25, { gain: 0.24 });
      this.tone(659.25, 0.16, 'sfx', 'sine', 0.05, 880, { gain: 0.20 });
    }
    else if (event.type === 'push') {
      this.tone(380, 0.12, 'sfx', 'triangle', 0, 120, { gain: 0.28 });
      this.noise(0.10, { bus: 'sfx', filterType: 'bandpass', filterFreq: 750, gain: 0.20 });
    }
    else if (event.type === 'status') {
      if (event.status === 'burn') {
        this.tone(210, 0.12, 'sfx', 'sawtooth', 0, 90, { gain: 0.26 });
        this.noise(0.12, { bus: 'sfx', filterType: 'lowpass', filterFreq: 800, gain: 0.22 });
      } else {
        this.tone(1280, 0.16, 'sfx', 'sine', 0, 640, { gain: 0.24 });
      }
    }
    else if (event.type === 'fizzle') {
      this.tone(210, 0.16, 'sfx', 'sawtooth', 0, 65, { gain: 0.28 });
      this.tone(135, 0.20, 'sfx', 'triangle', 0.08, 45, { gain: 0.28 });
    }
  }

  music() {
    if (!this.active || (this.settings.music ?? 1) === 0) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    // Atmospheric retro 16-bit spellcraft progression (A Aeolian / D Dorian modal arpeggios)
    const melody = [
      220.00, 261.63, 329.63, 261.63, // A3 - C4 - E4 - C4
      196.00, 246.94, 293.66, 246.94, // G3 - B3 - D4 - B3
      174.61, 220.00, 261.63, 329.63, // F3 - A3 - C4 - E4
      164.81, 196.00, 246.94, 196.00, // E3 - G3 - B3 - G3
    ];
    const bassNotes = [110.00, 98.00, 87.31, 82.41]; // A2, G2, F2, E2

    const stepIdx = this.step++;
    const note = melody[stepIdx % melody.length];

    // Gentle triangle melody arpeggio
    this.tone(note, 0.85, 'music', 'triangle', 0, note, { gain: 0.18, attack: 0.02 });

    // Smooth sine bass foundation on chord roots (every 4 steps)
    if (stepIdx % 4 === 0) {
      const chordIdx = Math.floor((stepIdx % melody.length) / 4);
      const bass = bassNotes[chordIdx % bassNotes.length];
      this.tone(bass, 1.6, 'music', 'sine', 0, bass, { gain: 0.28, attack: 0.04 });
    }
  }

  dispose() {
    if (this.interval) clearInterval(this.interval);
    this.context?.close().catch(() => {});
  }
}
