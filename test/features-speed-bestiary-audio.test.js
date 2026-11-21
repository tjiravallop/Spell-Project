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

    const testSet = new Set(['goblin', 'ember_overlord', 'abyssal_kraken', 'eternity_overlord']);
    saveAccountBestiary(testSet);

    const restored = loadAccountBestiary();
    assert.equal(restored.size, 4);
    assert.ok(restored.has('goblin'));
    assert.ok(restored.has('ember_overlord'));
    assert.ok(restored.has('abyssal_kraken'));
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

  // In Node.js without AudioContext, play() and event() should safely no-op without exceptions
  const newPresets = [
    'chakram',
    'barrage',
    'prism-shatter',
    'boss-phase',
    'chronos-rewind',
    'soul-drain',
    'shield-counter',
  ];

  for (const preset of newPresets) {
    assert.doesNotThrow(() => {
      audio.play(preset);
    }, `audio.play("${preset}") should not throw even when AudioContext is uninitialized`);
  }

  // Event handlers with new event types
  const newEvents = [
    { type: 'chakram' },
    { type: 'barrage' },
    { type: 'boss-phase' },
    { type: 'chronos-rewind' },
    { type: 'soul-drain' },
    { type: 'shield-counter' },
    { type: 'prism-shatter' },
  ];

  for (const ev of newEvents) {
    assert.doesNotThrow(() => {
      audio.combat(ev);
    }, `audio.combat(${JSON.stringify(ev)}) should not throw`);
  }

  // Ensure audio dispose doesn't throw
  assert.doesNotThrow(() => {
    audio.dispose();
  });
});
