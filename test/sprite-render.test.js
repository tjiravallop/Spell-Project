import test from 'node:test';
import assert from 'node:assert/strict';
import { Battlefield, vfxScale } from '../src/render.js';
import { parseSpell } from '../src/words.js';
import { simulateTurn } from '../src/combat.js';
import { createRun, createEnemy, prepareEnemies, FLOOR31_START_ROOM, ENEMIES } from '../src/run.js';
import { ENEMY_TRAITS } from '../src/enemy-traits.js';
import { inferDeskElement, inferDeskPower, renderSlots, renderEnemies, renderRoomTrack, renderWordBank } from '../src/ui/battle-render.js';
import { createBattleFxController } from '../src/ui/battle-fx.js';
import { cardFilterControls, applyCardFilters, bindCardFilters } from '../src/ui/card-filters.js';

test('room track renders the current tower and its sanctuary checkpoints', () => {
  const oldDocument = globalThis.document;
  const track = { innerHTML: '' };
  globalThis.document = { getElementById: id => id === 'room-track' ? track : null };
  try {
    renderRoomTrack(createRun('room-track-test', false), false);
    assert.match(track.innerHTML, /data-enter-sanctuary/);
    assert.match(track.innerHTML, /data-revisit-room/);
  } finally {
    globalThis.document = oldDocument;
  }
});

test('crowded upper-floor enemies use separate label lanes', () => {
  const oldDocument = globalThis.document;
  const list = { innerHTML: '' };
  globalThis.document = { getElementById: id => id === 'enemy-list' ? list : null };
  try {
    const state = createRun('floor39-label-test', false);
    state.room = FLOOR31_START_ROOM + 8;
    state.enemies = ['rift_runner', 'lattice_guard', 'ward_scribe'].map(createEnemy);
    prepareEnemies(state);
    const battlefield = { positions: () => [126, 167, 208] };
    renderEnemies({ state, battlefield, targetId: 'enemy-0', busy: false }, null);
    assert.deepEqual([...list.innerHTML.matchAll(/data-crowd-lane="(\d)"/g)].map(match => match[1]), ['0', '1', '0']);
    state.enemies.pop();
    renderEnemies({ state, battlefield, targetId: 'enemy-0', busy: false }, null);
    assert.doesNotMatch(list.innerHTML, /data-crowd-lane/);
  } finally {
    globalThis.document = oldDocument;
  }
});

test('battlefield draws integrated sheets at their native pivot and falls back if unavailable', () => {
  const calls = [];
  const ctx = { drawImage(...args) { calls.push(['image', ...args]); }, fillRect(...args) { calls.push(['rect', ...args]); }, save() {}, restore() {} };
  const old = { Image: globalThis.Image, document: globalThis.document, requestAnimationFrame: globalThis.requestAnimationFrame };
  globalThis.Image = class { complete = true; naturalWidth = 1; };
  globalThis.document = { createElement: () => ({ getContext: () => ctx }) };
  globalThis.requestAnimationFrame = () => 1;
  try {
    const battlefield = new Battlefield({ id: 'battle-canvas', getContext: () => ctx }, { reducedMotion: false });
    calls.length = 0;
    battlefield.sprite('elite', 216, 146, 0, 'ward');
    const boss = calls.find(call => call[0] === 'image');
    assert.deepEqual(boss.slice(2), [192, 64, 64, 64, 184, 88, 64, 64]);
    calls.length = 0;
    battlefield.sprite('prism_crab', 216, 146, 0, 'exposed');
    assert.deepEqual(calls.find(call => call[0] === 'image').slice(2), [64, 32, 32, 32, 200, 115, 32, 32]);
    calls.length = 0;
    battlefield.spriteArt.striker.naturalWidth = 0;
    battlefield.sprite('striker', 216, 146, 0, 'idle');
    assert.ok(calls.some(call => call[0] === 'rect'));
    assert.ok(!calls.some(call => call[0] === 'image'));
  } finally {
    Object.assign(globalThis, old);
  }
});

test('battlefield renders tailored pixel VFX across attack, barrier, and heal variants', () => {
  const calls = [];
  const ctx = {
    globalAlpha: 1,
    fillStyle: '#000',
    font: '10px sans-serif',
    textAlign: 'center',
    imageSmoothingEnabled: false,
    drawImage(...args) { calls.push(['image', ...args]); },
    fillRect(...args) { calls.push(['rect', ...args]); },
    measureText(t) { return { width: String(t).length * 6 }; },
    fillText(...args) { calls.push(['text', ...args]); },
    save() {},
    restore() {},
    translate() {},
  };
  const old = { Image: globalThis.Image, document: globalThis.document, requestAnimationFrame: globalThis.requestAnimationFrame };
  globalThis.Image = class { complete = false; naturalWidth = 0; };
  globalThis.document = { createElement: () => ({ getContext: () => ctx }) };
  globalThis.requestAnimationFrame = () => 1;
  try {
    const bf = new Battlefield({ id: 'battle-canvas', width: 320, height: 180, getContext: () => ctx }, { reducedMotion: false });
    const attackElems = ['fire', 'akki', 'ice', 'heman', 'hail', 'lightning', 'asani', 'thunderstorm', 'earth', 'pathaphi', 'magma', 'water', 'wari', 'mist', 'wind', 'vayu'];
    for (const elem of attackElems) {
      calls.length = 0;
      bf.drawShotVfx(76, 120, 210, 140, 110, 0.5, 0.35, { element: elem, elements: [elem], grand: elem === 'akki', shellBlast: elem === 'pathaphi' }, '#fff', 500);
      bf.drawBeamVfx(76, 120, 210, elem, '#fff', false, 0.45, 500, { element: elem, elements: [elem], grand: elem === 'asani' });
      bf.drawWaveVfx(76, 210, '#fff', '#aaa', false, 0.6, elem, 500, elem === 'wari');
      bf.drawStormVfx(210, elem, 0.5, 'fire', 500, elem === 'thunderstorm');
      bf.drawHitBurstVfx(210, 122, '#fff', 0.4, elem, 500);
      assert.ok(calls.some(c => c[0] === 'rect'), `expected rect calls for ${elem}`);
    }

    for (const blastElem of ['fire', 'blast', 'ice', 'lightning', 'earth', 'water', 'wind', 'meteor', 'blackhole']) {
      calls.length = 0;
      bf.drawExplosionVfx(210, 126, 0.5, ['enemy-0'], [210], blastElem, 1.2, 'fire', blastElem === 'blast');
      assert.ok(calls.some(c => c[0] === 'rect'), `expected blast rects for ${blastElem}`);
    }

    calls.length = 0;
    bf.drawDeathVfx(210, 122, 0.45, 500);
    assert.ok(calls.some(c => c[0] === 'rect'));

    for (const healKind of ['heal', 'large', 'grand', 'regen', 'shield-heal', 'pair']) {
      calls.length = 0;
      bf.drawHealVfx(51, 146, 0.5, 500, { source: 'player', target: 'player', healKind });
      assert.ok(calls.some(c => c[0] === 'rect'), `expected heal rects for ${healKind}`);
    }
    calls.length = 0;
    bf.drawHealVfx(210, 146, 0.5, 500, { source: 'enemy-0', target: 'enemy-1', healKind: 'heal' });
    assert.ok(calls.some(c => c[0] === 'rect'));

    for (const kind of ['shield', 'veil', 'brace', 'guard', 'earth', 'ice', 'lightning', 'water', 'wind', 'fire', 'ward']) {
      calls.length = 0;
      bf.barrier(51, 100, 44, '#5ce6d6', false, kind, 500, 1, false, { grand: kind === 'fire', large: kind === 'ice', restored: kind === 'water', shieldKind: kind });
      assert.ok(calls.some(c => c[0] === 'rect'), `expected barrier rects for ${kind}`);
    }
  } finally {
    Object.assign(globalThis, old);
  }
});

test('hybrid spell accents use distinct shapes and ignore ordinary elements', () => {
  const calls = [];
  const ctx = { fillStyle: '', globalAlpha: 1, save() {}, restore() {}, fillRect(...args) { calls.push([this.fillStyle, ...args]); } };
  const bf = Object.create(Battlefield.prototype);
  bf.ctx = ctx;
  const patterns = new Set();
  const all15Hybrids = [
    'magma', 'mist', 'hail', 'thunderstorm',
    'mudmire', 'dust', 'permafrost', 'magnet',
    'monsoon', 'shockstream', 'heatwave', 'chillgale',
    'plasma', 'scald', 'frostvolt',
  ];
  for (const element of all15Hybrids) {
    calls.length = 0;
    bf.drawHybridVfx(element, 120, 110, 0.4, 1, true);
    assert.ok(calls.length > 0, `${element} should draw an accent`);
    patterns.add(JSON.stringify(calls));
  }
  assert.equal(patterns.size, 15);
  calls.length = 0;
  bf.drawHybridVfx('fire', 120, 110, 0.4, 1, true);
  assert.equal(calls.length, 0);
});

test('blast accents use both elements and distinguish detonations', () => {
  const calls = [];
  const ctx = { fillStyle: '', globalAlpha: 1, save() {}, restore() {}, fillRect(...args) { calls.push([this.fillStyle, ...args]); } };
  const bf = Object.create(Battlefield.prototype);
  bf.ctx = ctx;
  bf.drawBlastAccents(150, 126, 0.4, 1, ['fire', 'ice'], false, false);
  assert.ok(calls.some(call => call[0] === '#ff7722'));
  assert.ok(calls.some(call => call[0] === '#29d6ff'));
  const ordinary = JSON.stringify(calls);
  calls.length = 0;
  bf.drawBlastAccents(150, 126, 0.4, 1, ['fire', 'ice'], false, true);
  assert.notEqual(JSON.stringify(calls), ordinary);
  calls.length = 0;
  bf.drawNeutralStormVfx(150, 0.4, 1);
  assert.ok(calls.length > 0);
});

test('hybrid accents appear in blast and shield casts for each distinct element', () => {
  const ctx = { fillStyle: '', globalAlpha: 1, save() {}, restore() {}, fillRect() {} };
  const bf = Object.create(Battlefield.prototype);
  bf.ctx = ctx;
  const accents = [];
  bf.drawHybridVfx = (...args) => accents.push(args);
  bf.drawBlastAccents(150, 126, 0.4, 1, ['magma', 'frostvolt', 'magma']);
  assert.deepEqual(accents.map(args => args[0]), ['magma', 'frostvolt']);
  assert.ok(accents.every(args => args[5] === true));
  accents.length = 0;
  bf.drawShieldCastVfx(51, 119, 0.4, 1, ['magma', 'frostvolt', 'magma'], 'shield', 2);
  assert.deepEqual(accents.map(args => args[0]), ['magma', 'frostvolt']);
});

test('shield accents preserve both elements and healing has its own sigil', () => {
  const calls = [];
  const ctx = { fillStyle: '', globalAlpha: 1, save() {}, restore() {}, fillRect(...args) { calls.push([this.fillStyle, ...args]); } };
  const bf = Object.create(Battlefield.prototype);
  bf.ctx = ctx;
  bf.drawShieldCastVfx(51, 119, 0.4, 1, ['fire', 'ice'], 'shield', 2);
  assert.ok(calls.some(call => call[0] === '#ff7722'));
  assert.ok(calls.some(call => call[0] === '#29d6ff'));
  const shieldPattern = JSON.stringify(calls);
  calls.length = 0;
  bf.drawHealingSigil(51, 146, 0.4, 'heal', 1);
  assert.ok(calls.length > 0);
  assert.notEqual(JSON.stringify(calls), shieldPattern);
});

test('special spells have distinct visual accents', () => {
  const calls = [];
  const ctx = { fillStyle: '', globalAlpha: 1, save() {}, restore() {}, fillRect(...args) { calls.push([this.fillStyle, ...args]); } };
  const bf = Object.create(Battlefield.prototype);
  bf.ctx = ctx;
  const patterns = new Set();
  for (const kind of ['blackhole', 'meteor', 'death', 'veil']) {
    calls.length = 0;
    bf.drawSpecialVfx(kind, 120, 110, 0.4, 1);
    assert.ok(calls.length > 0, `${kind} should draw an accent`);
    patterns.add(JSON.stringify(calls));
  }
  assert.equal(patterns.size, 4);
  calls.length = 0;
  bf.drawSpecialVfx('fire', 120, 110, 0.4, 1);
  assert.equal(calls.length, 0);
});

test('basic elements have distinct pixel accents', () => {
  const calls = [];
  const ctx = { fillStyle: '', globalAlpha: 1, save() {}, restore() {}, fillRect(...args) { calls.push([this.fillStyle, ...args]); } };
  const bf = Object.create(Battlefield.prototype);
  bf.ctx = ctx;
  const patterns = new Set();
  for (const element of ['fire', 'ice', 'lightning', 'earth', 'water', 'wind']) {
    calls.length = 0;
    bf.drawBasicElementVfx(element, 120, 110, 0.4, 1, true);
    assert.ok(calls.length > 0, `${element} should draw an accent`);
    patterns.add(JSON.stringify(calls));
  }
  assert.equal(patterns.size, 6);
  calls.length = 0;
  bf.drawBasicElementVfx('akki', 120, 110, 0.4, 1, true);
  assert.equal(calls.length, 0);
});

test('second-tier elements have distinct pixel accents', () => {
  const calls = [];
  const ctx = { fillStyle: '', globalAlpha: 1, save() {}, restore() {}, fillRect(...args) { calls.push([this.fillStyle, ...args]); } };
  const bf = Object.create(Battlefield.prototype);
  bf.ctx = ctx;
  const patterns = new Set();
  for (const element of ['akki', 'heman', 'asani', 'pathaphi', 'wari', 'vayu']) {
    calls.length = 0;
    bf.drawAscendedVfx(element, 120, 110, 0.4, 1, true);
    assert.ok(calls.length > 0, `${element} should draw an accent`);
    patterns.add(JSON.stringify(calls));
  }
  assert.equal(patterns.size, 6);
  calls.length = 0;
  bf.drawAscendedVfx('fire', 120, 110, 0.4, 1, true);
  assert.equal(calls.length, 0);
});

test('spell modifier accents have distinct pixel patterns', () => {
  const calls = [];
  const ctx = { fillStyle: '', globalAlpha: 1, save() {}, restore() {}, fillRect(...args) { calls.push([this.fillStyle, ...args]); } };
  const bf = Object.create(Battlefield.prototype);
  bf.ctx = ctx;
  const patterns = new Set();
  for (const modifier of ['burn', 'freeze', 'pierce', 'seal', 'dispel', 'push', 'pull']) {
    calls.length = 0;
    bf.drawModifierVfx(modifier, 120, 110, 0.4, false);
    assert.ok(calls.length > 0, `${modifier} should draw an accent`);
    patterns.add(JSON.stringify(calls));
  }
  assert.equal(patterns.size, 7);
});

test('inferDeskElement, inferDeskPower, and renderSlots reflect dominant placed element', () => {
  assert.equal(inferDeskElement([]), '');
  assert.equal(inferDeskElement(['ice', 'fire', 'fire']), 'fire');
  assert.equal(inferDeskElement(['fire', 'asani']), 'lightning');
  assert.equal(inferDeskElement(['shot', 'wari'], parseSpell(['shot', 'wari'])), 'water');
  assert.equal(inferDeskElement(['shield', 'pathaphi'], parseSpell(['shield', 'pathaphi'])), 'earth');
  assert.equal(inferDeskElement(['grand', 'heal'], parseSpell(['grand', 'heal'])), 'heal');
  assert.equal(inferDeskElement(['shield', 'pair'], parseSpell(['shield', 'pair'])), 'shield');
  assert.equal(inferDeskElement(['blackhole']), 'arcane');

  assert.equal(inferDeskPower(['fire'], null, 'fire'), 'base');
  assert.equal(inferDeskPower(['shot', 'fire'], parseSpell(['shot', 'fire']), 'fire'), 'charged');
  assert.equal(inferDeskPower(['shot', 'akki'], parseSpell(['shot', 'akki']), 'fire'), 'surge');
  assert.equal(inferDeskPower(['grand', 'heal'], parseSpell(['grand', 'heal']), 'heal'), 'surge');

  const classSet = new Set();
  const fakeSlots = {
    dataset: {},
    innerHTML: '',
    classList: {
      toggle(cls, force) {
        if (force) classSet.add(cls);
        else classSet.delete(cls);
      },
      contains(cls) { return classSet.has(cls); },
    },
  };
  const oldDoc = globalThis.document;
  globalThis.document = {
    getElementById(id) { return id === 'spell-slots' ? fakeSlots : null; },
  };
  try {
    const state = { room: 0, player: { upgrades: {} } };
    const words = ['ice', 'akki'];
    const parsed = parseSpell(words);
    renderSlots({ state, words, selectedSlot: 0, busy: false, castFxState: null }, parsed, true);
    assert.equal(fakeSlots.dataset.deskElem, 'fire');
    assert.equal(fakeSlots.dataset.elemPower, 'surge');

    renderSlots({ state, words: [], selectedSlot: 0, busy: false, castFxState: null }, null, false);
    assert.equal(fakeSlots.dataset.deskElem, undefined);
    assert.equal(fakeSlots.dataset.elemPower, undefined);
  } finally {
    globalThis.document = oldDoc;
  }
});

test('vfxScale returns 5x for grand and 2x for large, and combat propagates flags without leaking to enemies', () => {
  assert.equal(vfxScale(null), 1);
  assert.equal(vfxScale({}), 1);
  assert.equal(vfxScale({ large: true }), 2);
  assert.equal(vfxScale({ grand: true }), 5);
  assert.equal(vfxScale({ grand: true, large: true }), 5);

  const largeShield = parseSpell(['shield', 'fire', 'large']);
  assert.equal(largeShield.spell.large, true);
  assert.equal(largeShield.spell.grand, undefined);

  const grandShield = parseSpell(['grand', 'shield', 'fire']);
  assert.equal(grandShield.spell.grand, true);

  const grandHeal = parseSpell(['grand', 'heal']);
  assert.equal(grandHeal.spell.grand, true);

  const largeBlast = parseSpell(['blast', 'fire', 'large']);
  assert.equal(largeBlast.spell.large, true);

  const grandBlackhole = parseSpell(['grand', 'blackhole']);
  assert.equal(grandBlackhole.spell.grand, true);

  // Verify combat event emission and enemy non-leakage
  const makeTestState = hand => {
    const run = createRun(42);
    run.player.mana = 20;
    run.player.words = [...new Set([...run.player.words, ...hand])];
    run.player.hand = [...hand];
    run.enemies = [createEnemy('striker', 0), createEnemy('striker', 1)];
    prepareEnemies(run);
    run.enemies[0].hp = run.enemies[0].maxHp = 200;
    run.enemies[1].hp = run.enemies[1].maxHp = 200;
    return run;
  };

  const largeTurn = simulateTurn(makeTestState(['shot', 'fire', 'large']), ['shot', 'fire', 'large'], 'enemy-0');
  assert.equal(largeTurn.ok, true);
  const largeProj = largeTurn.events.find(e => e.type === 'projectile');
  const largeDmg = largeTurn.events.find(e => e.type === 'damage');
  assert.equal(largeProj.large, true);
  assert.equal(largeDmg.large, true);
  const enemyAtk1 = largeTurn.events.find(e => e.type === 'attack');
  assert.equal(enemyAtk1?.large, undefined);
  assert.equal(enemyAtk1?.grand, undefined);

  const grandTurn = simulateTurn(makeTestState(['grand', 'blast', 'fire']), ['grand', 'blast', 'fire'], 'enemy-0');
  assert.equal(grandTurn.ok, true);
  const grandBlastEv = grandTurn.events.find(e => e.type === 'blast');
  const grandHitDmg = grandTurn.events.find(e => e.type === 'damage');
  assert.equal(grandBlastEv.grand, true);
  assert.equal(grandHitDmg.grand, true);
  const enemyAtk2 = grandTurn.events.find(e => e.type === 'attack');
  assert.equal(enemyAtk2?.grand, undefined);

  const shieldTurn = simulateTurn(makeTestState(['grand', 'shield', 'fire']), ['grand', 'shield', 'fire'], 'enemy-0');
  assert.equal(shieldTurn.ok, true);
  const shieldEv = shieldTurn.events.find(e => e.type === 'shield');
  assert.equal(shieldEv.grand, true);
  assert.equal(shieldTurn.state.player.shield.grand, true);

  const healTurn = simulateTurn(makeTestState(['heal', 'large']), ['heal', 'large'], 'enemy-0');
  assert.equal(healTurn.ok, true);
  const healEv = healTurn.events.find(e => e.type === 'heal' && e.target === 'player');
  assert.equal(healEv.large, true);
});

test('canvas pixel VFX scales geometry ~2x for large and ~5x for grand across all spell forms', () => {
  const rects = [];
  const ctx = {
    globalAlpha: 1,
    fillStyle: '#000',
    font: '10px sans-serif',
    textAlign: 'center',
    imageSmoothingEnabled: false,
    drawImage() {},
    fillRect(x, y, w, h) { rects.push({ x, y, w, h }); },
    measureText(t) { return { width: String(t).length * 6 }; },
    fillText() {},
    save() {},
    restore() {},
    translate() {},
  };
  const old = { Image: globalThis.Image, document: globalThis.document, requestAnimationFrame: globalThis.requestAnimationFrame };
  globalThis.Image = class { complete = false; naturalWidth = 0; };
  globalThis.document = { createElement: () => ({ getContext: () => ctx }) };
  globalThis.requestAnimationFrame = () => 1;

  const spanOf = fn => {
    rects.length = 0;
    fn();
    assert.ok(rects.length > 0, 'expected fillRect calls');
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const r of rects) {
      minX = Math.min(minX, r.x);
      maxX = Math.max(maxX, r.x + r.w);
      minY = Math.min(minY, r.y);
      maxY = Math.max(maxY, r.y + r.h);
    }
    return { w: maxX - minX, h: maxY - minY };
  };

  try {
    const bf = new Battlefield({ id: 'battle-canvas', width: 320, height: 180, getContext: () => ctx }, { reducedMotion: false });

    // Projectile shot
    const shotBase = spanOf(() => bf.drawShotVfx(76, 120, 210, 140, 110, 0.5, 0.35, { element: 'fire', elements: ['fire'] }, '#fff', 500));
    const shotLarge = spanOf(() => bf.drawShotVfx(76, 120, 210, 140, 110, 0.5, 0.35, { element: 'fire', elements: ['fire'], large: true }, '#fff', 500));
    const shotGrand = spanOf(() => bf.drawShotVfx(76, 120, 210, 140, 110, 0.5, 0.35, { element: 'fire', elements: ['fire'], grand: true }, '#fff', 500));
    assert.ok(shotLarge.h > shotBase.h * 1.5, `shot large height ${shotLarge.h} should be ~2x base ${shotBase.h}`);
    assert.ok(shotGrand.h > shotLarge.h * 1.8, `shot grand height ${shotGrand.h} should be much larger than large ${shotLarge.h}`);

    // Beam
    const beamBase = spanOf(() => bf.drawBeamVfx(76, 120, 210, 'fire', '#fff', false, 0.45, 500, { element: 'fire', elements: ['fire'] }));
    const beamLarge = spanOf(() => bf.drawBeamVfx(76, 120, 210, 'fire', '#fff', false, 0.45, 500, { element: 'fire', elements: ['fire'], large: true }));
    const beamGrand = spanOf(() => bf.drawBeamVfx(76, 120, 210, 'fire', '#fff', false, 0.45, 500, { element: 'fire', elements: ['fire'], grand: true }));
    assert.ok(beamLarge.h > beamBase.h * 1.5);
    assert.ok(beamGrand.h > beamLarge.h * 1.5);

    // Wave
    const waveBase = spanOf(() => bf.drawWaveVfx(76, 210, '#fff', '#aaa', false, 0.6, 'water', 500, false, 1));
    const waveLarge = spanOf(() => bf.drawWaveVfx(76, 210, '#fff', '#aaa', false, 0.6, 'water', 500, false, 2));
    const waveGrand = spanOf(() => bf.drawWaveVfx(76, 210, '#fff', '#aaa', false, 0.6, 'water', 500, true, 5));
    assert.ok(waveLarge.h > waveBase.h * 1.4 && waveLarge.w > waveBase.w * 1.5);
    assert.ok(waveGrand.w > waveLarge.w * 2);

    // Storm
    const stormBase = spanOf(() => bf.drawStormVfx(210, 'fire', 0.5, 'fire', 500, false, 1));
    const stormLarge = spanOf(() => bf.drawStormVfx(210, 'fire', 0.5, 'fire', 500, false, 2));
    const stormGrand = spanOf(() => bf.drawStormVfx(210, 'fire', 0.5, 'fire', 500, true, 5));
    assert.ok(stormLarge.w >= stormBase.w * 1.8);
    assert.ok(stormGrand.w >= stormLarge.w * 2.2);

    // Heal
    const healBase = spanOf(() => bf.drawHealVfx(51, 146, 0.5, 500, { source: 'player', target: 'player', healKind: 'heal' }));
    const healLarge = spanOf(() => bf.drawHealVfx(51, 146, 0.5, 500, { source: 'player', target: 'player', healKind: 'large', large: true }));
    const healGrand = spanOf(() => bf.drawHealVfx(51, 146, 0.5, 500, { source: 'player', target: 'player', healKind: 'grand', grand: true }));
    assert.ok(healLarge.w > healBase.w * 1.7);
    assert.ok(healGrand.w > healLarge.w * 2.2);

    // Barrier (width/top scaled as in Battlefield.draw)
    const barBase = spanOf(() => bf.barrier(51, 148 - 45, 42, '#5ce6d6', false, 'shield', 500, 1, false, {}));
    const barLarge = spanOf(() => bf.barrier(51, 148 - 45 * 2, 42 * 2, '#5ce6d6', false, 'shield', 500, 1, false, { large: true }));
    const barGrand = spanOf(() => bf.barrier(51, 148 - 45 * 5, 42 * 5, '#5ce6d6', false, 'shield', 500, 1, false, { grand: true }));
    assert.ok(barLarge.w > barBase.w * 1.8);
    assert.ok(barGrand.w > barLarge.w * 2.2);
  } finally {
    Object.assign(globalThis, old);
  }
});

test('CSS impact overlay separates is-compact (1x), is-boosted, is-large (2x), and is-grand (5x)', () => {
  const layer = { innerHTML: '' };
  const dummyClassList = { remove() {}, add() {}, toggle() {} };
  const dummyEl = { classList: dummyClassList, textContent: '', style: { setProperty() {} }, dataset: {}, closest: () => dummyEl, querySelector: () => null, querySelectorAll: () => [], appendChild() {} };
  const old = { document: globalThis.document, requestAnimationFrame: globalThis.requestAnimationFrame };
  globalThis.document = {
    getElementById(id) { return id === 'canvas-impact-layer' ? layer : dummyEl; },
    querySelector() { return dummyEl; },
    createElement() { return dummyEl; },
  };
  globalThis.requestAnimationFrame = () => 1;
  try {
    const fx = createBattleFxController({
      getState: () => ({ enemies: [{ id: 'enemy-0', hp: 30, maxHp: 30, kind: 'striker' }], player: { hp: 30, maxHp: 30 } }),
      getTargetId: () => 'enemy-0',
      getSettings: () => ({ reducedMotion: false }),
      getAudio: () => ({ combat() {}, play() {} }),
      getBattlefield: () => ({ enemyX: () => 210, puddleX: () => 210 }),
    });
    fx.beginTurnAnimation({ enemies: [{ id: 'enemy-0', hp: 30, maxHp: 30 }], player: { hp: 30, maxHp: 30 } });

    fx.handleCombatStep({ type: 'projectile', target: 'enemy-0', form: 'shot', element: 'fire', elements: ['fire'] });
    assert.match(layer.innerHTML, /class="canvas-impact-node is-compact elem-fire"/);

    fx.handleCombatStep({ type: 'projectile', target: 'enemy-0', form: 'shot', element: 'fire', elements: ['fire'], shellBlast: true });
    assert.match(layer.innerHTML, /class="canvas-impact-node is-boosted elem-fire"/);

    fx.handleCombatStep({ type: 'projectile', target: 'enemy-0', form: 'shot', element: 'fire', elements: ['fire'], large: true });
    assert.match(layer.innerHTML, /class="canvas-impact-node is-large elem-fire"/);

    fx.handleCombatStep({ type: 'projectile', target: 'enemy-0', form: 'shot', element: 'fire', elements: ['fire'], grand: true });
    assert.match(layer.innerHTML, /class="canvas-impact-node is-grand elem-fire"/);

    fx.handleCombatStep({ type: 'shield', shieldKind: 'shield', elements: ['ice'], large: true, amount: 8 });
    assert.match(layer.innerHTML, /class="canvas-impact-node is-large elem-ice"/);

    fx.handleCombatStep({ type: 'heal', target: 'player', healKind: 'grand', grand: true, amount: 12 });
    assert.match(layer.innerHTML, /class="canvas-impact-node is-grand elem-grand"/);
  } finally {
    Object.assign(globalThis, old);
  }
});


test('new upper-tower middleSprites render distinct pixel silhouettes without throwing', () => {
  const kinds = ['gate_weaver', 'mirror_regent', 'seam_warden', 'loom_sovereign', 'rift_runner', 'lattice_guard', 'thread_archer', 'ward_scribe', 'ward_keeper', 'rune_ram', 'seal_curator'];
  const signatures = new Set();
  for (const kind of kinds) {
    const rects = [];
    const bf = Object.create(Battlefield.prototype);
    bf.ctx = {
      fillStyle: '',
      fillRect(x, y, w, h) {
        assert.ok(typeof this.fillStyle === 'string' && this.fillStyle.startsWith('#'), `${kind} invalid fillStyle: ${this.fillStyle}`);
        rects.push(`${x},${y},${w},${h},${this.fillStyle}`);
      },
    };
    bf.settings = { reducedMotion: false };
    bf.spriteArt = {};
    bf.sprite(kind, 160, 148, 1, 'idle');
    assert.ok(rects.length >= 10, `${kind} should draw full pixel silhouette`);
    signatures.add(rects.join('|'));
  }
  assert.equal(signatures.size, kinds.length);
});

test('card filter controls filter forge and inventory cards by search, role, rarity, and status', () => {
  const html = cardFilterControls('forge');
  assert.match(html, /data-card-filter="search"/);
  assert.match(html, /data-card-filter="role"/);
  assert.match(html, /data-card-filter="rarity"/);
  assert.match(html, /data-card-filter="status"/);
  assert.match(html, /data-card-filter-reset/);

  const state = createRun('filter-test', false);
  state.player.cardUpgrades = { fire: 10, ice: 3 };
  const cards = ['shot', 'fire', 'ice', 'magma'].map(id => ({ dataset: { filterCard: id }, hidden: false }));
  const count = { textContent: '' };
  const empty = { hidden: true };
  const controls = [
    { dataset: { cardFilter: 'search' }, value: '' },
    { dataset: { cardFilter: 'role' }, value: '' },
    { dataset: { cardFilter: 'rarity' }, value: '' },
    { dataset: { cardFilter: 'status' }, value: '' },
  ];
  const panel = {
    dataset: { cardFilterPanel: 'forge' },
    querySelectorAll: selector => selector === '[data-filter-card]' ? cards : selector === '[data-card-filter]' ? controls : [],
    querySelector: selector => selector === '[data-card-filter-count]' ? count : selector === '[data-card-filter-empty]' ? empty : null,
  };
  const listeners = new Map();
  const oldDoc = globalThis.document;
  globalThis.document = { addEventListener: (type, fn) => listeners.set(type, fn) };
  try {
    bindCardFilters(() => state);
    applyCardFilters(panel, state);
    assert.equal(count.textContent, 'แสดง 4 จาก 4 ใบ');
    assert.equal(empty.hidden, true);

    const dispatchInput = (control, value) => {
      control.value = value;
      listeners.get('input')({ target: { closest: sel => sel === '[data-card-filter]' ? { ...control, closest: s => s === '[data-card-filter-panel]' ? panel : null } : null } });
    };
    dispatchInput(controls[3], 'max');
    assert.deepEqual(cards.filter(c => !c.hidden).map(c => c.dataset.filterCard), ['fire']);
    assert.equal(count.textContent, 'แสดง 1 จาก 4 ใบ');

    dispatchInput(controls[0], 'ไม่มีการ์ดนี้');
    assert.equal(count.textContent, 'แสดง 0 จาก 4 ใบ');
    assert.equal(empty.hidden, false);

    listeners.get('click')({ target: { closest: sel => sel === '[data-card-filter-reset]' ? { closest: s => s === '[data-card-filter-panel]' ? panel : null } : null } });
    assert.equal(count.textContent, 'แสดง 4 จาก 4 ใบ');
    assert.equal(empty.hidden, true);
  } finally {
    globalThis.document = oldDoc;
  }
});

test('renderWordBank renders button-based discard cards and alert banner during overflow', () => {
  const elements = {
    'hand-count': { textContent: '' },
    'discard-panel': { open: false, showModal() { this.open = true; }, close() { this.open = false; }, setAttribute() {}, removeAttribute() {} },
    'word-bank': { hidden: false, scrollLeft: 0, innerHTML: '' },
    'enemy-list': { inert: false },
    'discard-title': { textContent: '' },
    'discard-cards': { innerHTML: '' },
    'confirm-discard': { disabled: false, textContent: '' },
    'discard-alert': { hidden: true },
    'discard-alert-text': { textContent: '' },
    'reopen-discard-btn': { textContent: '' },
    'battle-tools': { close() {} },
  };
  const oldDocument = globalThis.document;
  globalThis.document = { getElementById: id => elements[id] ?? null };
  try {
    const state = createRun('wb-test', false);
    state.player.hand = Array(11).fill('fire');
    renderWordBank({ state, words: [], busy: false });
    assert.equal(elements['word-bank'].hidden, true);
    assert.equal(elements['discard-alert'].hidden, false);
    assert.match(elements['discard-alert-text'].textContent, /ไพ่ในมือเกิน 1 ใบ/);
    assert.match(elements['discard-cards'].innerHTML, /<button type="button" class="discard-card/);
    assert.match(elements['discard-cards'].innerHTML, /data-discard-index="0"/);
    assert.equal(elements['discard-panel'].open, true);
    assert.match(elements['confirm-discard'].textContent, /เลือกทิ้งอีก 1 ใบ/);

    state.player.hand = Array(10).fill('fire');
    renderWordBank({ state, words: [], busy: false });
    assert.equal(elements['word-bank'].hidden, false);
    assert.equal(elements['discard-alert'].hidden, true);
    assert.equal(elements['discard-panel'].open, false);
  } finally {
    globalThis.document = oldDocument;
  }
});

test('enemy affinity and weakness badges render on enemy cards with elemental icons', () => {
  const oldDocument = globalThis.document;
  const list = { innerHTML: '' };
  globalThis.document = { getElementById: id => id === 'enemy-list' ? list : null };
  try {
    const state = createRun('affinity-badge-test', false);
    state.enemies = [createEnemy('ember_imp', 0)];
    prepareEnemies(state);
    const battlefield = { positions: () => [126] };
    renderEnemies({ state, battlefield, targetId: 'enemy-0', busy: false }, null);
    assert.match(list.innerHTML, /class="enemy-badge badge-affinity affinity-fire"/);
    assert.match(list.innerHTML, /🔥 ไฟ/);
    assert.match(list.innerHTML, /class="enemy-badge badge-weakness"/);
    assert.match(list.innerHTML, /แพ้: 💧 ❄️/);
  } finally {
    globalThis.document = oldDocument;
  }
});

test('Floors 21-25 redesigned monsters have authentic names, traits, affinities and no borrowed sprites', () => {
  assert.equal(ENEMIES.ward_keeper.name, 'ด้วงเกราะเพลิง');
  assert.equal(ENEMIES.ward_keeper.affinity, 'fire');
  assert.equal(ENEMIES.ward_keeper.sprite, undefined);
  assert.ok(ENEMY_TRAITS.ward_keeper);

  assert.equal(ENEMIES.rune_ram.name, 'แพะผาศิลา');
  assert.equal(ENEMIES.rune_ram.affinity, 'earth');
  assert.equal(ENEMIES.rune_ram.sprite, undefined);
  assert.ok(ENEMY_TRAITS.rune_ram);

  assert.equal(ENEMIES.seal_curator.name, 'พยัคฆ์เพลิงบรรพกาล');
  assert.equal(ENEMIES.seal_curator.affinity, 'fire');
  assert.equal(ENEMIES.seal_curator.sprite, undefined);
  assert.ok(ENEMY_TRAITS.seal_curator);
});
