import { elementFamily, FUSION_COMPONENTS } from './words.js';

export const MAJOR_BOSS_KINDS = new Set([
  'ember_overlord', 'tempest_archon', 'crown_archivist', 'mirror_regent',
  'loom_sovereign', 'volcano_colossus', 'thunder_drake_emperor',
  'abyssal_kraken', 'nether_dread_lord', 'eternity_overlord', 'eternity_reborn',
]);

export const MINI_BOSS_KINDS = new Set([
  'elite', 'sentinel', 'boss', 'charger',
  'arch_codex', 'elder_grimoire', 'nexus_codex', 'mirror_mage', 'eclipse_mage',
  'flame_viper', 'rime_gargoyle', 'ice_maiden', 'shock_sentinel', 'lightning_stalker',
  'gale_strider', 'wind_dancer', 'dune_beast', 'coral_scuttler', 'tide_lurker',
  'spark_wraith', 'ancient_chitin_behemoth', 'venom_spore_beast', 'crag_titan_sentinel',
  'kraken_ward_tentacle', 'kraken_heal_tentacle', 'kraken_ink_tentacle', 'kraken_crush_tentacle',
  'nether_leech_pillar', 'nether_curse_pillar', 'nether_doom_pillar',
  'dread_reaper', 'void_devourer', 'zenith_templar', 'chronos_keeper', 'chaos_weaver',
]);

export const BEAST_TRASH_KINDS = new Set([
  'fire_bat', 'ice_wolf', 'cinder_bat', 'volt_skitterer', 'breeze_raptor', 'ash_goblin', 'swarm', 'sand_stalker', 'ember_imp',
]);

export const SLIME_TRASH_KINDS = new Set([
  'frost_slime', 'magma_slime', 'mudmire',
]);

export const RANGED_TRASH_KINDS = new Set([
  'water_sprite', 'wind_crow', 'spark_scout', 'spore_spitter', 'echo_wraith', 'breeze_dancer',
]);

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
    this.currentTrack = 'battle';
    this.trackTempos = { battle: 520, boss: 420, sanctuary: 640 };
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
    this.settings = { ...this.settings, ...settings };
    if (!this.buses || !this.context) return;
    const t = this.context.currentTime;
    const isMasterMuted = Boolean(this.settings.muted);
    const isMusicMuted = isMasterMuted || this.settings.musicEnabled === false;
    const isSfxMuted = isMasterMuted || this.settings.sfxEnabled === false;

    if (this.master) {
      this.master.gain.setTargetAtTime(isMasterMuted ? 0 : 0.28, t, 0.03);
    }

    for (const key of ['music', 'sfx', 'ui']) {
      if (this.buses[key]) {
        const slider = Math.max(0, Math.min(1, Number(this.settings[key]) ?? 1));
        const muted = key === 'music' ? isMusicMuted : isSfxMuted;
        const targetGain = muted ? 0 : (slider ** 2 * (key === 'music' ? 0.24 : 0.85));
        this.buses[key].gain.setTargetAtTime(targetGain, t, 0.03);
      }
    }
  }

  toggleMute() {
    this.settings.muted = !this.settings.muted;
    this.configure(this.settings);
    return this.settings.muted;
  }

  setMuted(muted) {
    this.settings.muted = Boolean(muted);
    this.configure(this.settings);
    return this.settings.muted;
  }

  setMusicTrack(trackName) {
    if (!['battle', 'boss', 'sanctuary'].includes(trackName)) return;
    if (this.currentTrack === trackName) return;
    this.currentTrack = trackName;
    this.step = 0;
    if (this.interval) {
      clearInterval(this.interval);
      const tempo = this.trackTempos[trackName] ?? 520;
      this.interval = setInterval(() => this.music(), tempo);
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

  haptic(name) {
    if (this.settings?.reducedMotion) return;
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      if (name === 'place' || name === 'select') navigator.vibrate(15);
      else if (name === 'remove') navigator.vibrate(10);
      else if (name === 'cast' || name === 'chakram' || name === 'spear' || name === 'trash-strike' || name === 'trash-bite') navigator.vibrate(20);
      else if (name === 'hit' || name === 'trash-hit' || name === 'armor-shred' || name === 'shield-block') navigator.vibrate(25);
      else if (name === 'barrage') navigator.vibrate([10, 15, 10, 15, 20]);
      else if (name === 'prism-shatter') navigator.vibrate([20, 30, 40]);
      else if (name === 'miniboss-charge' || name === 'miniboss-strike' || name === 'miniboss-kill') navigator.vibrate([30, 25, 45]);
      else if (name === 'boss-phase' || name === 'boss-strike' || name === 'boss-kill') navigator.vibrate([45, 30, 60]);
      else if (name === 'weakness') navigator.vibrate([25, 40, 35]);
      else if (name === 'wall-slam') navigator.vibrate([20, 25, 20]);
      else if (name === 'win' || name === 'discover' || name === 'coin' || name === 'forge') navigator.vibrate([15, 30, 20]);
      else if (name === 'invalid') navigator.vibrate([10, 30, 10]);
      else if (name === 'potion' || name === 'rest') navigator.vibrate([15, 25]);
    } catch {}
  }

  play(name) {
    this.haptic(name);
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
    else if (name === 'chakram') {
      this.tone(1480, 0.12, 'sfx', 'sawtooth', 0, 740, { gain: 0.32 });
      this.tone(880, 0.15, 'sfx', 'triangle', 0.02, 1760, { gain: 0.24 });
      this.noise(0.11, { bus: 'sfx', filterType: 'bandpass', filterFreq: 2600, filterQ: 3, gain: 0.28 });
    }
    else if (name === 'spear') {
      this.tone(1040, 0.10, 'sfx', 'triangle', 0, 380, { gain: 0.30 });
      this.tone(1560, 0.08, 'sfx', 'sine', 0.015, 780, { gain: 0.22 });
      this.noise(0.09, { bus: 'sfx', filterType: 'highpass', filterFreq: 2200, gain: 0.24 });
    }
    else if (name === 'barrage') {
      for (let i = 0; i < 5; i++) {
        const f = 520 + i * 65;
        this.tone(f, 0.045, 'sfx', 'square', i * 0.038, f * 0.7, { gain: 0.26 });
        this.noise(0.03, { bus: 'sfx', filterType: 'highpass', filterFreq: 1800, delay: i * 0.038, gain: 0.18 });
      }
    }
    else if (name === 'prism-shatter') {
      this.duckMusic(0.28, 0.35);
      [1174.66, 1479.98, 1760.00, 2349.32].forEach((f, i) => {
        this.tone(f, 0.22, 'sfx', 'sine', i * 0.025, f * 1.05, { gain: 0.25 });
        this.tone(f * 1.5, 0.15, 'sfx', 'triangle', i * 0.025 + 0.01, f * 1.5, { gain: 0.15 });
      });
      this.noise(0.16, { bus: 'sfx', filterType: 'highpass', filterFreq: 3200, gain: 0.24 });
    }
    else if (name === 'boss-phase') {
      this.duckMusic(0.18, 0.7);
      this.subThump(0.45, 120, 24, 0.65);
      [220.00, 277.18, 329.63, 440.00, 554.37].forEach((f, i) => {
        this.tone(f, 0.55, 'sfx', 'triangle', i * 0.06, f, { gain: 0.28, attack: 0.02 });
        this.tone(f * 2, 0.40, 'sfx', 'sine', i * 0.06 + 0.02, f * 2, { gain: 0.18 });
      });
      this.noise(0.35, { bus: 'sfx', filterType: 'bandpass', filterFreq: 1400, filterEndFreq: 400, gain: 0.30 });
    }
    else if (name === 'chronos-rewind') {
      this.duckMusic(0.3, 0.4);
      this.tone(180, 0.32, 'sfx', 'sine', 0, 720, { gain: 0.32, attack: 0.03 });
      this.tone(360, 0.28, 'sfx', 'triangle', 0.04, 1080, { gain: 0.20 });
      [0.05, 0.12, 0.19, 0.26].forEach(delay => {
        this.tone(1200, 0.03, 'sfx', 'square', delay, 1200, { gain: 0.16 });
      });
    }
    else if (name === 'soul-drain') {
      this.tone(280, 0.34, 'sfx', 'sawtooth', 0, 85, { gain: 0.35 });
      this.tone(140, 0.38, 'sfx', 'triangle', 0.02, 55, { gain: 0.30 });
      this.noise(0.32, { bus: 'sfx', filterType: 'bandpass', filterFreq: 600, filterEndFreq: 180, gain: 0.28 });
    }
    else if (name === 'shield-counter') {
      this.tone(820, 0.10, 'sfx', 'triangle', 0, 410, { gain: 0.26 });
      this.noise(0.06, { bus: 'sfx', filterType: 'highpass', filterFreq: 2000, gain: 0.20 });
    }
    else if (name === 'trash-bite' || name === 'trash-strike') {
      // Beast / Vermin swift claw swipe or bite
      this.tone(360, 0.075, 'sfx', 'sawtooth', 0, 130, { gain: 0.28 });
      this.noise(0.045, { bus: 'sfx', filterType: 'bandpass', filterFreq: 1800, gain: 0.18 });
    }
    else if (name === 'trash-squish') {
      // Slime squishy blunt strike
      this.tone(150, 0.11, 'sfx', 'triangle', 0, 55, { gain: 0.32 });
      this.noise(0.06, { bus: 'sfx', filterType: 'bandpass', filterFreq: 420, filterQ: 2, gain: 0.22 });
    }
    else if (name === 'trash-shoot') {
      // Ranged sprite / spore spit
      this.tone(580, 0.08, 'sfx', 'sine', 0, 260, { gain: 0.25 });
      this.noise(0.05, { bus: 'sfx', filterType: 'highpass', filterFreq: 2400, gain: 0.15 });
    }
    else if (name === 'trash-hit') {
      // General trash mob physical hit
      this.subThump(0.12, 85, 38, 0.35);
      this.tone(260, 0.065, 'sfx', 'square', 0, 95, { gain: 0.24 });
      this.noise(0.06, { bus: 'sfx', filterType: 'bandpass', filterFreq: 750, gain: 0.22 });
    }
    else if (name === 'trash-kill') {
      // Satisfying 16-bit retro enemy vanish pop
      this.tone(440, 0.09, 'sfx', 'square', 0, 90, { gain: 0.26 });
      this.noise(0.08, { bus: 'sfx', filterType: 'bandpass', filterFreq: 1200, filterQ: 1.5, gain: 0.22 });
    }
    else if (name === 'miniboss-strike') {
      // Heavy cleaving attack from mini-bosses
      this.duckMusic(0.35, 0.35);
      this.subThump(0.28, 95, 28, 0.52);
      this.tone(240, 0.18, 'sfx', 'sawtooth', 0, 65, { gain: 0.40 });
      this.noise(0.14, { bus: 'sfx', filterType: 'lowpass', filterFreq: 420, gain: 0.36 });
    }
    else if (name === 'miniboss-charge') {
      // Ominous warning hum when mini-boss powers up
      this.tone(180, 0.30, 'sfx', 'triangle', 0, 480, { gain: 0.28, attack: 0.04 });
      this.tone(220, 0.26, 'sfx', 'sine', 0.04, 550, { gain: 0.20 });
      this.noise(0.20, { bus: 'sfx', filterType: 'bandpass', filterFreq: 650, filterEndFreq: 1400, gain: 0.16 });
    }
    else if (name === 'miniboss-kill') {
      // Rewarding 2-stage defeat sound with crystal sparkles
      this.duckMusic(0.25, 0.5);
      this.subThump(0.32, 105, 26, 0.56);
      this.noise(0.22, { bus: 'sfx', filterType: 'lowpass', filterFreq: 480, gain: 0.35 });
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        this.tone(f, 0.32, 'sfx', 'sine', 0.12 + i * 0.045, f * 1.01, { gain: 0.22 });
      });
    }
    else if (name === 'boss-strike') {
      // Seismic earth-shaking strike from major floor bosses
      this.duckMusic(0.2, 0.55);
      this.subThump(0.42, 125, 22, 0.65);
      this.tone(220, 0.28, 'sfx', 'sawtooth', 0, 45, { gain: 0.45 });
      this.noise(0.25, { bus: 'sfx', filterType: 'lowpass', filterFreq: 360, gain: 0.48 });
    }
    else if (name === 'boss-charge') {
      this.duckMusic(0.3, 0.45);
      this.tone(140, 0.35, 'sfx', 'sawtooth', 0, 380, { gain: 0.36 });
      this.tone(260, 0.32, 'sfx', 'triangle', 0.05, 520, { gain: 0.30 });
      this.subThump(0.32, 65, 28, 0.40);
    }
    else if (name === 'boss-kill') {
      this.duckMusic(0.15, 0.85);
      this.subThump(0.55, 130, 20, 0.70);
      this.noise(0.45, { bus: 'sfx', filterType: 'lowpass', filterFreq: 320, gain: 0.50 });
      [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        this.tone(f, 0.45, 'sfx', 'triangle', 0.18 + i * 0.06, f, { gain: 0.26 });
        this.tone(f * 2, 0.35, 'sfx', 'sine', 0.20 + i * 0.06, f * 2, { gain: 0.16 });
      });
    }
    else if (name === 'shield-block') {
      // Clean energetic shield deflect ping when absorbing 100% of damage
      this.tone(780, 0.09, 'sfx', 'sine', 0, 1180, { gain: 0.28 });
      this.tone(390, 0.11, 'sfx', 'triangle', 0.01, 780, { gain: 0.22 });
      this.noise(0.05, { bus: 'sfx', filterType: 'highpass', filterFreq: 2200, gain: 0.18 });
    }
    else if (name === 'shield-heavy-block') {
      // Heavy shield deflection against mini-bosses
      this.subThump(0.20, 95, 38, 0.40);
      this.tone(520, 0.14, 'sfx', 'triangle', 0, 880, { gain: 0.30 });
      this.tone(180, 0.18, 'sfx', 'sawtooth', 0.01, 85, { gain: 0.26 });
      this.noise(0.08, { bus: 'sfx', filterType: 'bandpass', filterFreq: 1400, gain: 0.24 });
    }
    else if (name === 'ward-grant') {
      // Ethereal protective shimmer
      [783.99, 1046.50, 1318.51].forEach((f, i) => {
        this.tone(f, 0.22, 'sfx', 'sine', i * 0.04, f * 1.02, { gain: 0.20 });
      });
      this.noise(0.12, { bus: 'sfx', filterType: 'bandpass', filterFreq: 2000, gain: 0.14 });
    }
    else if (name === 'armor-shred') {
      // Crunchy armor crack
      this.tone(170, 0.15, 'sfx', 'sawtooth', 0, 55, { gain: 0.34 });
      this.subThump(0.16, 90, 32, 0.38);
      this.noise(0.12, { bus: 'sfx', filterType: 'bandpass', filterFreq: 950, filterQ: 2, gain: 0.30 });
    }
    else if (name === 'dispel') {
      // Shimmering glass ward shatter
      this.tone(1320, 0.14, 'sfx', 'sine', 0, 440, { gain: 0.28 });
      this.tone(880, 0.18, 'sfx', 'triangle', 0.02, 220, { gain: 0.22 });
      this.noise(0.10, { bus: 'sfx', filterType: 'highpass', filterFreq: 2400, gain: 0.24 });
    }
    else if (name === 'mana-drain') {
      // Sinister reverse suction drone
      this.tone(420, 0.24, 'sfx', 'sawtooth', 0, 140, { gain: 0.32 });
      this.tone(210, 0.28, 'sfx', 'triangle', 0.02, 70, { gain: 0.26 });
      this.noise(0.20, { bus: 'sfx', filterType: 'bandpass', filterFreq: 750, filterEndFreq: 250, gain: 0.24 });
    }
    else if (name === 'coin') {
      // Sanctuary shop coin jingle
      this.tone(987.77, 0.07, 'ui', 'sine', 0, 987.77, { gain: 0.25 });
      this.tone(1318.51, 0.25, 'ui', 'sine', 0.06, 1318.51, { gain: 0.28 });
    }
    else if (name === 'forge') {
      // Blacksmith anvil hammer strike
      this.subThump(0.18, 110, 45, 0.40);
      this.tone(880, 0.24, 'ui', 'sine', 0, 880, { gain: 0.30 });
      this.tone(1760, 0.18, 'ui', 'triangle', 0.01, 1760, { gain: 0.16 });
      this.noise(0.08, { bus: 'ui', filterType: 'highpass', filterFreq: 2600, gain: 0.28 });
    }
    else if (name === 'rest') {
      // Campfire recovery harp arpeggio
      this.duckMusic(0.28, 0.5);
      [164.81, 207.65, 246.94, 329.63].forEach((f, i) => {
        this.tone(f, 0.45, 'sfx', 'triangle', i * 0.07, f, { gain: 0.26, attack: 0.02 });
        this.tone(f * 2, 0.35, 'sfx', 'sine', i * 0.07 + 0.02, f * 2, { gain: 0.15 });
      });
    }
    else if (name === 'potion') {
      // Refreshing elixir bottle pop & gulp
      this.tone(360, 0.045, 'ui', 'sine', 0, 720, { gain: 0.26 });
      this.tone(480, 0.11, 'ui', 'triangle', 0.06, 320, { gain: 0.22 });
      this.tone(560, 0.13, 'ui', 'sine', 0.13, 390, { gain: 0.24 });
    }
    else if (name === 'death-spell') {
      this.duckMusic(0.25, 0.4);
      this.subThump(0.32, 85, 22, 0.55);
      this.tone(320, 0.28, 'sfx', 'sawtooth', 0, 50, { gain: 0.38 });
      this.noise(0.25, { bus: 'sfx', filterType: 'bandpass', filterFreq: 600, filterEndFreq: 120, gain: 0.32 });
    }
    else if (name === 'blackhole-spell') {
      this.tone(115, 0.35, 'sfx', 'square', 0, 145, { gain: 0.30, filterType: 'bandpass', filterFreq: 380, filterQ: 3 });
      this.subThump(0.28, 70, 25, 0.45);
      this.noise(0.30, { bus: 'sfx', filterType: 'bandpass', filterFreq: 500, filterEndFreq: 180, gain: 0.28 });
    }
    else if (name === 'meteor-spell') {
      this.duckMusic(0.25, 0.5);
      this.noise(0.22, { bus: 'sfx', filterType: 'bandpass', filterFreq: 900, filterEndFreq: 300, gain: 0.35 });
      [0.08, 0.16, 0.24].forEach((delay, i) => {
        this.subThump(0.22, 100 - i * 15, 28, 0.48 - i * 0.06);
      });
    }
    else if (name === 'summon-invoke') {
      [220.00, 329.63, 440.00, 659.25, 880.00].forEach((f, i) => {
        this.tone(f, 0.30, 'sfx', 'triangle', i * 0.045, f * 1.02, { gain: 0.24 });
        this.tone(f * 1.5, 0.18, 'sfx', 'sine', i * 0.045 + 0.015, f * 1.5, { gain: 0.12 });
      });
      this.noise(0.18, { bus: 'sfx', filterType: 'bandpass', filterFreq: 1400, filterQ: 2, gain: 0.20 });
    }
    else if (name === 'summon-strike') {
      this.subThump(0.24, 115, 30, 0.52);
      this.tone(320, 0.14, 'sfx', 'sawtooth', 0, 110, { gain: 0.28 });
      this.noise(0.12, { bus: 'sfx', filterType: 'bandpass', filterFreq: 750, gain: 0.30 });
    }
    else if (name === 'summon-counter') {
      this.tone(880, 0.10, 'sfx', 'triangle', 0, 440, { gain: 0.28 });
      this.tone(1320, 0.08, 'sfx', 'sine', 0.015, 660, { gain: 0.22 });
      this.noise(0.08, { bus: 'sfx', filterType: 'highpass', filterFreq: 2400, gain: 0.24 });
    }
    else if (name === 'summon-break') {
      this.subThump(0.18, 90, 25, 0.40);
      [440.00, 329.63, 246.94].forEach((f, i) => {
        this.tone(f, 0.25, 'sfx', 'triangle', i * 0.04, f * 0.95, { gain: 0.22 });
      });
      this.noise(0.14, { bus: 'sfx', filterType: 'bandpass', filterFreq: 900, gain: 0.26 });
    }
    else if (name === 'summon-depart') {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        this.tone(f, 0.24, 'sfx', 'sine', i * 0.035, f, { gain: 0.14 });
      });
    }
    else if (name === 'summon-relay') {
      [349.23, 440.00, 523.25, 698.46, 880.00, 1046.50].forEach((f, i) => {
        this.tone(f, 0.32, 'sfx', 'triangle', i * 0.04, f, { gain: 0.22 });
      });
      this.noise(0.10, { bus: 'sfx', filterType: 'highpass', filterFreq: 2200, gain: 0.16 });
    }
  }

  playElementalBurst(elem) {
    if (!this.context || !elem) return;
    const fam = elementFamily(elem);
    switch (fam) {
      case 'fire':
        this.tone(260, 0.15, 'sfx', 'sawtooth', 0, 95, { gain: 0.28 });
        this.noise(0.16, { bus: 'sfx', filterType: 'lowpass', filterFreq: 800, gain: 0.22 });
        break;
      case 'ice':
        this.tone(780, 0.18, 'sfx', 'sine', 0, 1170, { gain: 0.26 });
        this.noise(0.10, { bus: 'sfx', filterType: 'highpass', filterFreq: 2400, gain: 0.18 });
        break;
      case 'lightning':
        this.tone(1150, 0.12, 'sfx', 'square', 0, 380, { gain: 0.32 });
        this.noise(0.10, { bus: 'sfx', filterType: 'bandpass', filterFreq: 1800, gain: 0.24 });
        break;
      case 'earth':
        this.subThump(0.22, 85, 28, 0.45);
        this.tone(200, 0.15, 'sfx', 'triangle', 0, 80, { gain: 0.28 });
        break;
      case 'water':
        this.tone(480, 0.16, 'sfx', 'sine', 0, 680, { gain: 0.24 });
        this.noise(0.14, { bus: 'sfx', filterType: 'bandpass', filterFreq: 700, gain: 0.20 });
        break;
      case 'wind':
        this.tone(320, 0.16, 'sfx', 'triangle', 0, 160, { gain: 0.24 });
        this.noise(0.20, { bus: 'sfx', filterType: 'bandpass', filterFreq: 950, filterEndFreq: 1600, gain: 0.22 });
        break;
      default:
        this.tone(340, 0.12, 'sfx', 'triangle', 0, 170, { gain: 0.22 });
    }
  }

  combat(event = {}) {
    if (!event || !event.type) return;

    if (event.type === 'projectile') {
      if (event.blocked) {
        this.play('ward');
      } else if (event.spearPierceSilentLaunch) {
        this.playElementalBurst(event.element ?? 'fire');
      } else if (event.form === 'chakram') {
        this.play('chakram');
      } else if (event.form === 'spear') {
        this.play('spear');
      } else if (event.element === 'death') {
        this.play('death-spell');
      } else if (event.form === 'blackhole' || event.element === 'blackhole') {
        this.play('blackhole-spell');
      } else if (event.form === 'meteor' || event.element === 'meteor') {
        this.play('meteor-spell');
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
      if (event.barrage) {
        this.play('barrage');
      }
      if (event.grand) {
        this.duckMusic(0.3, 0.4);
      }
    }
    else if (event.type === 'prism-shatter') {
      this.play('prism-shatter');
    }
    else if (event.type === 'boss-phase') {
      this.play('boss-phase');
    }
    else if (event.type === 'shield-counter') {
      this.play('shield-counter');
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
        const isMajorBoss = MAJOR_BOSS_KINDS.has(event.targetKind);
        const isMini = event.isBoss || MINI_BOSS_KINDS.has(event.targetKind);
        if (isMajorBoss) {
          this.play('boss-kill');
        } else if (isMini) {
          this.play('miniboss-kill');
        } else {
          this.play('trash-kill');
        }
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
      const isMajor = event.specialBoss || MAJOR_BOSS_KINDS.has(event.sourceKind);
      const isMini = event.isBoss || event.heavy || MINI_BOSS_KINDS.has(event.sourceKind);

      if (event.absorbed > 0 && (!event.amount || event.amount <= 0)) {
        // Attack completely repelled by player's shield!
        if (isMini || isMajor) {
          this.play('shield-heavy-block');
        } else {
          this.play('shield-block');
        }
      } else {
        // Attack landed on player HP (or partially broke shield)
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
        } else if (isMajor) {
          this.play('boss-strike');
        } else if (isMini) {
          this.play('miniboss-strike');
        } else {
          // Normal Trash Mob Attack
          if (BEAST_TRASH_KINDS.has(event.sourceKind)) {
            this.play('trash-bite');
          } else if (SLIME_TRASH_KINDS.has(event.sourceKind)) {
            this.play('trash-squish');
          } else if (RANGED_TRASH_KINDS.has(event.sourceKind)) {
            this.play('trash-shoot');
          } else {
            this.play('trash-hit');
          }
        }
        if (event.absorbed > 0) {
          this.tone(620, 0.08, 'sfx', 'triangle', 0, 310, { gain: 0.20 });
        }
      }

      if (event.manaDrain > 0) {
        this.play('mana-drain');
      }
    }
    else if (event.type === 'charge') {
      const isMajor = event.specialBoss || MAJOR_BOSS_KINDS.has(event.sourceKind);
      if (isMajor) {
        this.play('boss-charge');
      } else {
        this.play('miniboss-charge');
      }
    }
    else if (event.type === 'ward-grant') {
      this.play('ward-grant');
    }
    else if (event.type === 'armor-shred') {
      this.play('armor-shred');
    }
    else if (event.type === 'dispel') {
      this.play('dispel');
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
    else if (event.type === 'nether-curse') {
      this.tone(240, 0.16, 'sfx', 'sawtooth', 0, 75, { gain: 0.32 });
      this.tone(420, 0.12, 'sfx', 'triangle', 0.03, 140, { gain: 0.24 });
      if (event.amount) this.play('hit');
    }
    else if (event.type === 'cosmic-echo') {
      this.tone(1180, 0.14, 'sfx', 'sine', 0, 590, { gain: 0.30 });
      this.tone(880, 0.18, 'sfx', 'triangle', 0.02, 330, { gain: 0.28 });
      if (event.amount) this.play('hit');
    }
    else if (event.type === 'buff') {
      const notes = event.source === 'bless' ? [523.25, 659.25, 783.99, 1046.50] : [440, 554.37, 659.25];
      notes.forEach((f, i) => {
        this.tone(f, 0.18, 'sfx', 'sine', i * 0.035, f * 1.03, { gain: 0.22 });
      });
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
      if (event.isChronosRewind || (event.amount === 400 && event.source === 'enemy-0')) {
        this.play('chronos-rewind');
      } else if (event.isSoulDrain) {
        this.play('soul-drain');
      } else {
        // Gentle restorative arpeggio
        this.tone(440, 0.14, 'sfx', 'sine', 0, 659.25, { gain: 0.24 });
        this.tone(659.25, 0.16, 'sfx', 'sine', 0.05, 880, { gain: 0.20 });
      }
    }
    else if (event.type === 'swap') {
      this.tone(320, 0.10, 'sfx', 'sine', 0, 640, { gain: 0.22 });
      this.tone(640, 0.10, 'sfx', 'triangle', 0.04, 200, { gain: 0.18 });
    }
    else if (event.type === 'push') {
      this.tone(280, 0.14, 'sfx', 'triangle', 0, 110, { gain: 0.28 });
      this.noise(0.10, { bus: 'sfx', filterType: 'bandpass', filterFreq: 650, gain: 0.22 });
    }
    else if (event.type === 'status') {
      if (event.status === 'burn') {
        this.tone(210, 0.12, 'sfx', 'sawtooth', 0, 90, { gain: 0.26 });
        this.noise(0.12, { bus: 'sfx', filterType: 'lowpass', filterFreq: 800, gain: 0.22 });
      } else if (event.status === 'freeze') {
        [1046.50, 1567.98, 2093.00].forEach((f, i) => {
          this.tone(f, 0.16, 'sfx', 'sine', i * 0.03, f * 1.02, { gain: 0.24 });
        });
        this.noise(0.08, { bus: 'sfx', filterType: 'highpass', filterFreq: 2800, gain: 0.18 });
      } else if (event.status === 'chill') {
        this.tone(480, 0.16, 'sfx', 'triangle', 0, 320, { gain: 0.24 });
        this.noise(0.12, { bus: 'sfx', filterType: 'bandpass', filterFreq: 950, gain: 0.18 });
      } else if (event.status === 'sealed') {
        this.tone(320, 0.14, 'sfx', 'square', 0, 160, { gain: 0.28 });
        this.tone(960, 0.10, 'sfx', 'sine', 0.02, 960, { gain: 0.20 });
      } else {
        this.tone(1280, 0.16, 'sfx', 'sine', 0, 640, { gain: 0.24 });
      }
    }
    else if (event.type === 'fizzle') {
      this.tone(210, 0.16, 'sfx', 'sawtooth', 0, 65, { gain: 0.28 });
      this.tone(135, 0.20, 'sfx', 'triangle', 0.08, 45, { gain: 0.28 });
    }
    else if (event.type === 'summon' || event.type === 'summon_invoke') {
      this.play('summon-invoke');
      if (event.element) this.playElementalBurst(event.element);
    }
    else if (event.type === 'summon_strike') {
      this.play('summon-strike');
      if (event.element) this.playElementalBurst(event.element);
    }
    else if (event.type === 'summon_counter') {
      this.play('summon-counter');
      if (event.element) this.playElementalBurst(event.element);
    }
    else if (event.type === 'summon_relay') {
      this.play('summon-relay');
      if (event.newElement || event.element) this.playElementalBurst(event.newElement || event.element);
    }
    else if (event.type === 'summon_break') {
      this.play('summon-break');
    }
    else if (event.type === 'summon_depart') {
      this.play('summon-depart');
    }
  }

  music() {
    if (!this.active || this.settings.muted || this.settings.musicEnabled === false || (this.settings.music ?? 1) === 0) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    const track = this.currentTrack ?? 'battle';
    const stepIdx = this.step++;

    if (track === 'boss') {
      // Tense, driving harmonic minor boss theme with urgent bass pulses
      const bossMelody = [
        146.83, 174.61, 220.00, 277.18, // D3, F3, A3, C#4 (Harmonic Minor)
        293.66, 349.23, 440.00, 349.23, // D4, F4, A4, F4
        261.63, 311.13, 392.00, 311.13, // C4, Eb4, G4, Eb4 (Tense Diminished)
        246.94, 293.66, 370.00, 293.66, // B3, D4, F#4, D4
      ];
      const bossBass = [73.42, 87.31, 65.41, 61.74]; // D2, F2, C2, B1

      const note = bossMelody[stepIdx % bossMelody.length];
      // Punchy square/saw arpeggio flourish with rapid decay
      this.tone(note, 0.38, 'music', 'sawtooth', 0, note, { gain: 0.12, attack: 0.01 });

      // Driving bass stabs on every 2 steps
      if (stepIdx % 2 === 0) {
        const chordIdx = Math.floor((stepIdx % bossMelody.length) / 4);
        const bass = bossBass[chordIdx % bossBass.length];
        this.tone(bass, 0.40, 'music', 'triangle', 0, bass * 0.98, { gain: 0.26, attack: 0.015 });
      }

      // Snappy chiptune percussion ticks on offbeats
      if (stepIdx % 2 === 1) {
        this.noise(0.035, { bus: 'music', filterType: 'highpass', filterFreq: 2600, gain: 0.10 });
      }
      // Low impact kick every 4 steps
      if (stepIdx % 4 === 0) {
        this.tone(110, 0.07, 'music', 'sine', 0, 40, { gain: 0.18 });
      }
    } else if (track === 'sanctuary') {
      // Serene, gentle sanctuary theme (warm Lydian/Major chords, tranquil harp arpeggio)
      const sanctuaryMelody = [
        261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5
        329.63, 392.00, 493.88, 587.33, // E4, G4, B4, D5
        349.23, 440.00, 523.25, 659.25, // F4, A4, C5, E5
        293.66, 369.99, 440.00, 587.33, // D4, F#4, A4, D5
      ];
      const sanctuaryBass = [130.81, 164.81, 174.61, 146.83]; // C3, E3, F3, D3

      const note = sanctuaryMelody[stepIdx % sanctuaryMelody.length];
      // Soothing sine/triangle arpeggio with soft envelope
      this.tone(note, 0.95, 'music', 'sine', 0, note, { gain: 0.16, attack: 0.04 });

      // Deep, peaceful sub-bass foundation on chord roots (every 4 steps)
      if (stepIdx % 4 === 0) {
        const chordIdx = Math.floor((stepIdx % sanctuaryMelody.length) / 4);
        const bass = sanctuaryBass[chordIdx % sanctuaryBass.length];
        this.tone(bass, 2.2, 'music', 'triangle', 0, bass, { gain: 0.22, attack: 0.06 });
      }
      // Warm chord shimmer on beat 2
      if (stepIdx % 4 === 2) {
        const chordIdx = Math.floor((stepIdx % sanctuaryMelody.length) / 4);
        const midNote = sanctuaryMelody[chordIdx * 4 + 1];
        this.tone(midNote, 1.2, 'music', 'sine', 0, midNote, { gain: 0.10, attack: 0.05 });
      }
    } else {
      // Atmospheric retro 16-bit tower ascent battle theme (A Aeolian / D Dorian modal arpeggios)
      const battleMelody = [
        220.00, 261.63, 329.63, 261.63, // A3 - C4 - E4 - C4
        293.66, 329.63, 392.00, 329.63, // D4 - E4 - G4 - E4
        196.00, 246.94, 293.66, 246.94, // G3 - B3 - D4 - B3
        174.61, 220.00, 261.63, 329.63, // F3 - A3 - C4 - E4
      ];
      const battleBass = [110.00, 146.83, 98.00, 87.31]; // A2, D3, G2, F2

      const note = battleMelody[stepIdx % battleMelody.length];
      // Gentle triangle melody arpeggio
      this.tone(note, 0.75, 'music', 'triangle', 0, note, { gain: 0.18, attack: 0.02 });

      // Smooth bass foundation on chord roots (every 4 steps)
      if (stepIdx % 4 === 0) {
        const chordIdx = Math.floor((stepIdx % battleMelody.length) / 4);
        const bass = battleBass[chordIdx % battleBass.length];
        this.tone(bass, 1.5, 'music', 'sine', 0, bass, { gain: 0.26, attack: 0.03 });
      }
      // Chiptune rhythm tick on beats 1 & 3
      if (stepIdx % 2 === 1) {
        this.noise(0.03, { bus: 'music', filterType: 'bandpass', filterFreq: 1900, gain: 0.06 });
      }
      // Subtle pulse sub on step 2
      if (stepIdx % 4 === 2) {
        const chordIdx = Math.floor((stepIdx % battleMelody.length) / 4);
        const bass = battleBass[chordIdx % battleBass.length] * 1.5;
        this.tone(bass, 0.45, 'music', 'triangle', 0, bass, { gain: 0.14, attack: 0.02 });
      }
    }
  }

  dispose() {
    if (this.interval) clearInterval(this.interval);
    this.context?.close().catch(() => {});
  }
}
