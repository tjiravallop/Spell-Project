import test from 'node:test';
import assert from 'node:assert/strict';
import { Battlefield, vfxScale } from '../src/render.js';
import { parseSpell } from '../src/words.js';
import { simulateTurn } from '../src/combat.js';
import { createRun, createEnemy, prepareEnemies } from '../src/run.js';
import { inferDeskElement, inferDeskPower, renderSlots } from '../src/ui/battle-render.js';
import { createBattleFxController } from '../src/ui/battle-fx.js';

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


