import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, loadSettings, storeSettings, SETTINGS_KEY } from '../src/save.js';
import {
  ACHIEVEMENTS,
  loadAccountBestiary,
  saveAccountBestiary,
  loadAccountAchievements,
  saveAccountAchievements,
  BESTIARY_KEY,
  ACHIEVEMENTS_KEY,
} from '../src/ui/storage-discovery.js';
import { Battlefield } from '../src/render.js';
import { GameAudio } from '../src/audio.js';
import { ENEMIES } from '../src/run.js';

// Mock storage helper for isolated tests
function createMockStorage(seedData = {}) {
  const store = new Map(Object.entries(seedData));
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, val) { store.set(key, String(val)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
  };
}

test('Item 2 - Combat Speed: settings persistence and validation (1x / 2x / 3x)', () => {
  assert.equal(DEFAULT_SETTINGS.combatSpeed, 1, 'Default combat speed should be 1');

  const storage = createMockStorage();

  // 1x speed roundtrip
  storeSettings({ ...DEFAULT_SETTINGS, combatSpeed: 1 }, storage);
  assert.equal(loadSettings(storage).combatSpeed, 1);

  // 2x speed roundtrip
  storeSettings({ ...DEFAULT_SETTINGS, combatSpeed: 2 }, storage);
  assert.equal(loadSettings(storage).combatSpeed, 2);

  // 3x speed roundtrip
  storeSettings({ ...DEFAULT_SETTINGS, combatSpeed: 3 }, storage);
  assert.equal(loadSettings(storage).combatSpeed, 3);

  // Invalid speed values should fallback to default 1
  storage.setItem(SETTINGS_KEY, JSON.stringify({ combatSpeed: 5 }));
  assert.equal(loadSettings(storage).combatSpeed, 1);

  storage.setItem(SETTINGS_KEY, JSON.stringify({ combatSpeed: 0 }));
  assert.equal(loadSettings(storage).combatSpeed, 1);

  storage.setItem(SETTINGS_KEY, JSON.stringify({ combatSpeed: 'turbo' }));
  assert.equal(loadSettings(storage).combatSpeed, 1);
});

test('Item 2 - Combat Speed: animation durations scale inversely with speed', () => {
  const sampleEvents = [
    { type: 'projectile', element: 'fire', blocked: false },
    { type: 'attack', target: 'enemy', damage: 25 },
    { type: 'shield', element: 'earth', value: 15 },
  ];

  function createTestBattlefield(speed) {
    const bf = Object.create(Battlefield.prototype);
    bf.settings = { combatSpeed: speed, reducedMotion: false };
    bf.buildSnapshots = () => {};
    return bf;
  }

  const bf1 = createTestBattlefield(1);
  const dur1 = bf1.animate(sampleEvents);

  const bf2 = createTestBattlefield(2);
  const dur2 = bf2.animate(sampleEvents);

  const bf3 = createTestBattlefield(3);
  const dur3 = bf3.animate(sampleEvents);

  assert.ok(dur1 > dur2, `1x duration (${dur1}ms) should be longer than 2x duration (${dur2}ms)`);
  assert.ok(dur2 > dur3, `2x duration (${dur2}ms) should be longer than 3x duration (${dur3}ms)`);
  // Approximately half for 2x
  assert.ok(Math.abs(dur1 / dur2 - 2) < 0.35, `2x duration ratio should be close to 2 (was ${dur1 / dur2})`);
  // Approximately 3x for 3x
  assert.ok(Math.abs(dur1 / dur3 - 3) < 0.45, `3x duration ratio should be close to 3 (was ${dur1 / dur3})`);
});

test('Item 3 - Grimoire Compendium: Bestiary definitions & persistence', () => {
  // Check that all 39 monsters in ENEMIES exist and have required fields
  const kinds = Object.keys(ENEMIES);
  assert.ok(kinds.length >= 35, `Expected at least 35 enemies across floors 1-100, found ${kinds.length}`);

  for (const kind of kinds) {
    const enemy = ENEMIES[kind];
    assert.ok(enemy.name, `Enemy ${kind} must have a name`);
    assert.ok(typeof enemy.hp === 'number' && enemy.hp > 0, `Enemy ${kind} must have positive HP`);
  }

  // Bestiary storage round-trip using mock localStorage
  const prevStorage = globalThis.localStorage;
  const mockStorage = createMockStorage();
  globalThis.localStorage = mockStorage;

  try {
    const initialBestiary = loadAccountBestiary();
    assert.ok(initialBestiary instanceof Set);
    assert.equal(initialBestiary.size, 0);

    const testSet = new Set(['goblin', 'ember_overlord', 'abyssal_cthulhu', 'eternity_overlord']);
    saveAccountBestiary(testSet);

    const restored = loadAccountBestiary();
    assert.equal(restored.size, 4);
    assert.ok(restored.has('goblin'));
    assert.ok(restored.has('ember_overlord'));
    assert.ok(restored.has('abyssal_cthulhu'));
    assert.ok(restored.has('eternity_overlord'));
    assert.ok(!restored.has('void_devourer'));
  } finally {
    globalThis.localStorage = prevStorage;
  }
});

test('Item 3 - Grimoire Compendium: Achievements definitions & persistence', () => {
  assert.ok(Array.isArray(ACHIEVEMENTS));
  assert.ok(ACHIEVEMENTS.length >= 12, `Expected at least 12 achievements, found ${ACHIEVEMENTS.length}`);

  const ids = new Set();
  for (const ach of ACHIEVEMENTS) {
    assert.ok(ach.id && typeof ach.id === 'string', 'Achievement must have id string');
    assert.ok(ach.name && typeof ach.name === 'string', 'Achievement must have name');
    assert.ok(ach.desc && typeof ach.desc === 'string', 'Achievement must have description');
    assert.ok(ach.icon && typeof ach.icon === 'string', 'Achievement must have icon');
    assert.ok(!ids.has(ach.id), `Duplicate achievement ID: ${ach.id}`);
    ids.add(ach.id);
  }

  // Check key milestone achievements exist
  assert.ok(ids.has('first_spell'), 'Should have first_spell achievement');
  assert.ok(ids.has('dual_fusion'), 'Should have dual_fusion achievement');
  assert.ok(ids.has('grand_spell'), 'Should have grand_spell achievement');
  assert.ok(ids.has('chakram_blade'), 'Should have chakram_blade achievement');
  assert.ok(ids.has('barrage_burst'), 'Should have barrage_burst achievement');
  assert.ok(ids.has('shield_fortress'), 'Should have shield_fortress achievement');
  assert.ok(ids.has('boss_10'), 'Should have boss_10 achievement');
  assert.ok(ids.has('boss_100'), 'Should have boss_100 achievement');
  assert.ok(ids.has('deck_master'), 'Should have deck_master achievement');

  // Achievements storage roundtrip
  const prevStorage = globalThis.localStorage;
  const mockStorage = createMockStorage();
  globalThis.localStorage = mockStorage;

  try {
    const initialAch = loadAccountAchievements();
    assert.ok(initialAch instanceof Set);
    assert.equal(initialAch.size, 0);

    const unlocked = new Set(['first_spell', 'boss_10', 'deck_master']);
    saveAccountAchievements(unlocked);

    const loaded = loadAccountAchievements();
    assert.equal(loaded.size, 3);
    assert.ok(loaded.has('first_spell'));
    assert.ok(loaded.has('boss_10'));
    assert.ok(loaded.has('deck_master'));
    assert.ok(!loaded.has('boss_100'));
  } finally {
    globalThis.localStorage = prevStorage;
  }
});

test('Item 4 - Retro 16-bit Web Audio: SFX synthesizers and presets execute cleanly', () => {
  const audio = new GameAudio({ sfx: 0.8, ui: 0.6, music: 0.4 });

  // In Node.js without AudioContext, play() and combat() should safely no-op without exceptions
  const presets = [
    'place', 'remove', 'cast', 'discover', 'ward', 'hit', 'weakness', 'resisted',
    'wall-slam', 'win', 'lose', 'invalid',
    'chakram', 'barrage', 'prism-shatter', 'boss-phase', 'chronos-rewind', 'soul-drain', 'shield-counter',
    'trash-bite', 'trash-strike', 'trash-squish', 'trash-shoot', 'trash-hit', 'trash-kill',
    'miniboss-strike', 'miniboss-charge', 'miniboss-kill',
    'boss-strike', 'boss-charge', 'boss-kill',
    'shield-block', 'shield-heavy-block',
    'ward-grant', 'armor-shred', 'dispel', 'mana-drain',
    'coin', 'forge', 'rest', 'potion',
    'death-spell', 'blackhole-spell', 'meteor-spell',
  ];

  for (const preset of presets) {
    assert.doesNotThrow(() => {
      audio.play(preset);
    }, `audio.play("${preset}") should not throw even when AudioContext is uninitialized`);
  }

  // Event handlers with trash mobs, mini-bosses, boss events and elemental spell casts
  const events = [
    { type: 'chakram' },
    { type: 'barrage' },
    { type: 'boss-phase' },
    { type: 'chronos-rewind' },
    { type: 'soul-drain' },
    { type: 'shield-counter' },
    { type: 'prism-shatter' },
    { type: 'ward-grant' },
    { type: 'armor-shred', target: 'enemy-0', amount: 2, armor: 1 },
    { type: 'dispel', target: 'enemy-0', amount: 1 },
    { type: 'projectile', form: 'shot', element: 'death' },
    { type: 'projectile', form: 'blackhole', element: 'blackhole' },
    { type: 'projectile', form: 'meteor', element: 'meteor' },
    { type: 'attack', sourceKind: 'fire_bat', amount: 4, absorbed: 0 },
    { type: 'attack', sourceKind: 'frost_slime', amount: 3, absorbed: 0 },
    { type: 'attack', sourceKind: 'water_sprite', amount: 3, absorbed: 0 },
    { type: 'attack', sourceKind: 'goblin', amount: 4, absorbed: 0 },
    { type: 'attack', sourceKind: 'goblin', amount: 0, absorbed: 4 }, // Full shield block (trash)
    { type: 'attack', sourceKind: 'sentinel', amount: 7, absorbed: 0, isBoss: true, heavy: true },
    { type: 'attack', sourceKind: 'sentinel', amount: 0, absorbed: 7, isBoss: true, heavy: true }, // Heavy shield block
    { type: 'attack', sourceKind: 'abyssal_cthulhu', amount: 12, specialBoss: true },
    { type: 'attack', sourceKind: 'cthulhu_ink_tentacle', amount: 4, manaDrain: 2 },
    { type: 'charge', sourceKind: 'ember_overlord', specialBoss: true },
    { type: 'charge', sourceKind: 'charger', isBoss: false },
    { type: 'charge', sourceKind: 'sentinel', isBoss: true },
    { type: 'damage', targetKind: 'goblin', isBoss: false, amount: 10, killed: true },
    { type: 'damage', targetKind: 'sentinel', isBoss: true, amount: 15, killed: true },
    { type: 'damage', targetKind: 'ember_overlord', isBoss: true, amount: 20, killed: true },
    { type: 'status', status: 'freeze' },
    { type: 'status', status: 'chill' },
    { type: 'status', status: 'burn' },
    { type: 'status', status: 'sealed' },
    { type: 'swap' },
    { type: 'push' },
  ];

  for (const ev of events) {
    assert.doesNotThrow(() => {
      audio.combat(ev);
    }, `audio.combat(${JSON.stringify(ev)}) should not throw`);
  }

  // Ensure audio dispose doesn't throw
  assert.doesNotThrow(() => {
    audio.dispose();
  });
});

test('Item 5 - Audio Toggle System and Dynamic BGM Tracks', () => {
  const storage = createMockStorage();

  // Test settings persistence of audio toggles
  const initial = loadSettings(storage);
  assert.equal(initial.muted, false, 'Default muted should be false');
  assert.equal(initial.musicEnabled, true, 'Default musicEnabled should be true');
  assert.equal(initial.sfxEnabled, true, 'Default sfxEnabled should be true');

  storeSettings({
    ...DEFAULT_SETTINGS,
    muted: true,
    musicEnabled: false,
    sfxEnabled: false,
  }, storage);

  const reloaded = loadSettings(storage);
  assert.equal(reloaded.muted, true, 'Saved muted should roundtrip');
  assert.equal(reloaded.musicEnabled, false, 'Saved musicEnabled should roundtrip');
  assert.equal(reloaded.sfxEnabled, false, 'Saved sfxEnabled should roundtrip');

  // Test GameAudio mute methods and track selection
  const audio = new GameAudio(reloaded);
  assert.equal(audio.currentTrack, 'battle', 'Default BGM track should be battle');

  // Track switching
  audio.setMusicTrack('boss');
  assert.equal(audio.currentTrack, 'boss', 'Track should switch to boss');

  audio.setMusicTrack('sanctuary');
  assert.equal(audio.currentTrack, 'sanctuary', 'Track should switch to sanctuary');

  audio.setMusicTrack('unknown');
  assert.equal(audio.currentTrack, 'sanctuary', 'Invalid track should not change active track');

  // Mute toggle API
  audio.setMuted(false);
  assert.equal(audio.settings.muted, false);
  const toggled = audio.toggleMute();
  assert.equal(toggled, true);
  assert.equal(audio.settings.muted, true);
  assert.equal(audio.toggleMute(), false);

  // music() execution without errors
  audio.active = true;
  assert.doesNotThrow(() => {
    audio.music();
    audio.setMusicTrack('boss');
    audio.music();
    audio.setMusicTrack('battle');
    audio.music();
  });

  audio.dispose();
});

test('Item 6 - Polished Spell Cast VFX: Canvas drawing methods execute cleanly across all forms', () => {
  // Mock canvas context
  const mockCtx = {
    save() {},
    restore() {},
    fillRect() {},
    clearRect() {},
    drawImage() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    ellipse() {},
    fill() {},
    stroke() {},
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#ffffff',
    lineWidth: 1,
  };

  const bf = Object.create(Battlefield.prototype);
  bf.ctx = mockCtx;
  bf.settings = { reducedMotion: false };
  bf.state = { enemies: [{ id: 'enemy-0' }, { id: 'enemy-1' }] };
  bf.pixelCircle = () => {};
  bf.pixelDiamond = () => {};
  bf.pixelEllipse = () => {};
  bf.pixelBolt = () => {};
  bf.drawElementalImpactFlash = () => {};
  bf.drawHitBurstVfx = () => {};

  // Verify all polished VFX methods execute without error
  assert.doesNotThrow(() => {
    bf.drawSpecialVfx('death', 120, 100, 0.45, 1);
    bf.drawSpecialVfx('meteor', 120, 100, 0.45, 1);
    bf.drawSpecialVfx('blackhole', 120, 100, 0.45, 1);
    bf.drawDeathVfx(120, 100, 0.45, 1200);
    bf.drawChakramVfx(50, 120, 200, 120, 120, 0.5, 0.5, { element: 'fire', size: 1 }, '#29d6ff', 1200);
    bf.drawChakramVfx(50, 120, 200, 200, 120, 1, 0.8, { element: 'fire', size: 1, damage: { amount: 50 } }, '#29d6ff', 1200);
    bf.drawBeamVfx(50, 120, 200, 'fire', '#29d6ff', true, 0.5, 1200, { element: 'fire', elements: ['fire', 'ice'] });
    bf.drawWaveVfx(50, 200, '#ff7722', '#29d6ff', true, 0.5, 'fire', 1200, false, 1);
    bf.drawStormVfx(150, 'fire', 0.5, 'ice', 1200, false, 1);
    bf.drawStormVfx(150, 'storm', 0.5, 'lightning', 1200, true, 5);
  });
});
