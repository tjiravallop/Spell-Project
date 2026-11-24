import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, CREATURE_WORDS, CREATURE_STATS, parseSpell } from '../src/words.js';
import { createRun, createEnemy, enterRoom, enterSanctuary, updateSanctuaryLoadout, revisitRoom, FLOOR5_START_ROOM, makeRewards, chooseReward, equipWords, getRewardPoolForRoom, getCardSecondaryEffect, hasCardSecondaryUpgrade, battleSpellCost, drawCards } from '../src/run.js';
import { simulateTurn } from '../src/combat.js';
import { validateRun, saveRun, loadRun, SAVE_KEY } from '../src/save.js';
import { Battlefield } from '../src/render.js';

test('Summon System: Grammar, Syntax, and Parsing', () => {
  // 1. Verify summon card and all 27 creatures exist in WORDS
  assert.equal(WORDS.summon.label, 'อัญเชิญ');
  assert.equal(WORDS.summon.cost, 3);
  assert.equal(CREATURE_WORDS.length, 27);
  for (const cid of CREATURE_WORDS) {
    assert.ok(WORDS[cid], `Creature ${cid} must exist in WORDS`);
    assert.ok(CREATURE_STATS[cid], `Creature ${cid} stats must exist`);
  }

  // 2. 2-word formula: summon + creature
  const p2 = parseSpell(['summon', 'dog']);
  assert.ok(p2.ok);
  assert.equal(p2.spell.form, 'summon');
  assert.equal(p2.spell.creature, 'dog');
  assert.equal(p2.spell.cost, WORDS.summon.cost + WORDS.dog.cost); // 3 + 1 = 4

  // 3. 3-word formula: summon + creature + element
  const p3 = parseSpell(['summon', 'golem', 'fire']);
  assert.ok(p3.ok);
  assert.equal(p3.spell.form, 'summon');
  assert.equal(p3.spell.creature, 'golem');
  assert.equal(p3.spell.element, 'fire');
  assert.equal(p3.spell.cost, WORDS.summon.cost + WORDS.golem.cost + WORDS.fire.cost); // 3 + 4 + 2 = 9

  // 4. 4-word formula: grand + summon + creature + element
  const p4 = parseSpell(['grand', 'summon', 'golem', 'fire']);
  assert.ok(p4.ok);
  assert.equal(p4.spell.form, 'summon');
  assert.equal(p4.spell.creature, 'golem');
  assert.equal(p4.spell.element, 'fire');
  assert.equal(p4.spell.grand, true);
  const baseCost = WORDS.summon.cost + WORDS.golem.cost + WORDS.fire.cost;
  assert.equal(p4.spell.cost, Math.ceil(baseCost * 1.5)); // Math.ceil(9 * 1.5) = 14

  // 5. Invalid sequences should fail
  assert.ok(!parseSpell(['summon']).ok);
  assert.ok(!parseSpell(['dog']).ok);
  assert.ok(!parseSpell(['summon', 'fire']).ok);
  assert.ok(!parseSpell(['dog', 'summon']).ok);
});

test('Summon System: Reward Pool gating (Creatures drop only if player owns summon)', () => {
  const stateWithoutSummon = createRun('no-summon-test', true);
  stateWithoutSummon.collection = ['shot', 'fire'];
  const poolNoSummon = getRewardPoolForRoom(stateWithoutSummon, 1);
  for (const cid of CREATURE_WORDS) {
    assert.ok(!poolNoSummon.includes(cid), `Creature ${cid} should not drop before player owns summon`);
  }

  const stateWithSummon = createRun('with-summon-test', true);
  stateWithSummon.collection = ['shot', 'fire', 'summon'];
  const poolWithSummon = getRewardPoolForRoom(stateWithSummon, 1);
  const hasCreature = CREATURE_WORDS.some(cid => poolWithSummon.includes(cid));
  assert.ok(hasCreature, 'Creature cards should be allowed to drop when player owns summon');
});

test('Summon System: Invocation, Stats, and Elemental Modifiers', () => {
  const state = createRun('combat-summon-test', true);
  state.player.mana = 20;
  state.player.words = ['summon', 'golem', 'earth'];
  state.player.hand = ['summon', 'golem', 'earth'];
  state.enemies = [{ id: 'e1', kind: 'striker', hp: 50, maxHp: 50, armor: 0, slot: 0 }];

  // Invoke golem + earth: 30 base HP + 20% earth bonus = 36 maxHp
  const res = simulateTurn(state, ['summon', 'golem', 'earth'], 'e1');
  assert.ok(res.ok);
  assert.ok(res.state.player.summon, 'Summon should be active on player in returned state');
  assert.equal(res.state.player.summon.creatureId, 'golem');
  assert.equal(res.state.player.summon.element, 'earth');
  assert.equal(res.state.player.summon.maxHp, 36);
  // Striker attacked for 3, golem absorbed 2 with armor, took 1 damage -> 35 HP left
  assert.equal(res.state.player.summon.hp, 35);
  assert.equal(res.state.player.summon.armor, 2);
});

test('Summon System: Single-Target Taunt and Overkill Shield-Gate', () => {
  const state = createRun('shield-gate-test', true);
  state.player.hp = 30;
  state.player.maxHp = 30;
  state.player.mana = 20;
  state.player.words = ['summon', 'dog', 'fire'];
  state.player.hand = ['summon', 'dog', 'fire'];
  // 5 strikers attack for 3 each = 15 total damage, exceeding Dog's 14 HP
  state.enemies = [
    { id: 's1', kind: 'striker', hp: 20, maxHp: 20, armor: 0, slot: 0 },
    { id: 's2', kind: 'striker', hp: 20, maxHp: 20, armor: 0, slot: 1 },
    { id: 's3', kind: 'striker', hp: 20, maxHp: 20, armor: 0, slot: 2 },
    { id: 's4', kind: 'striker', hp: 20, maxHp: 20, armor: 0, slot: 3 },
    { id: 's5', kind: 'striker', hp: 20, maxHp: 20, armor: 0, slot: 4 },
  ];

  // Turn 1: Player summons dog (14 HP). Strikers focus-fire the frontline summon.
  const res = simulateTurn(state, ['summon', 'dog', 'fire'], 's1');
  assert.ok(res.ok);

  // Dog took lethal damage, died, but Overkill Shield-Gate completely protected the player!
  assert.equal(res.state.player.hp, 30, 'Player HP must be untouched due to Overkill Shield-Gate');
  assert.equal(res.state.player.summon, undefined, 'Dog should be broken and deleted');
  // Fire on-break burst deals damage to enemies
  assert.ok(res.state.enemies.some(e => e.hp < 20), 'On-break fire burst should damage enemies');
});

test('Summon System: Counter-Attack ("ตีสวน ไม่หาย")', () => {
  const state = createRun('counter-test', true);
  state.player.hp = 30;
  state.player.mana = 20;
  state.player.words = ['summon', 'golem', 'fire'];
  state.player.hand = ['summon', 'golem', 'fire'];
  // Striker attacks for 3 damage on turn 1
  state.enemies = [{ id: 'e1', kind: 'striker', hp: 30, maxHp: 30, armor: 0, slot: 0 }];

  // Turn 1: Summon Golem (30 HP, 2 armor).
  // Striker attacks 3 damage -> Golem absorbs 2 armor -> takes 1 damage -> HP remains 29.
  const res = simulateTurn(state, ['summon', 'golem', 'fire'], 'e1');
  assert.ok(res.ok);
  assert.ok(res.state.player.summon, 'Golem should survive and remain on board');
  assert.equal(res.state.player.summon.hp, 29);
  // Golem counters back with fire element (+25% bonus)
  assert.ok(res.summary.sequence.some(msg => msg.includes('สวนกลับ')), 'Counter-attack should trigger');
  assert.ok(res.state.enemies[0].hp < 30, 'Enemy should take counter-attack damage');
});

test('Summon System: Turn 2 Proactive Strike & Departure ("ตีแล้วหาย")', () => {
  const state = createRun('strike-turn2-test', true);
  state.player.hp = 30;
  state.player.mana = 20;
  state.player.words = ['summon', 'golem', 'fire', 'shot', 'ice'];
  state.player.hand = ['summon', 'golem', 'fire'];
  state.enemies = [{ id: 'e1', kind: 'striker', hp: 60, maxHp: 60, armor: 2, slot: 0 }];

  // Turn 1: Summon Golem
  const res1 = simulateTurn(state, ['summon', 'golem', 'fire'], 'e1');
  assert.ok(res1.ok);
  assert.ok(res1.state.player.summon, 'Golem exists after turn 1');

  // Turn 2: Player casts ice attack. Golem performs Turn 2 Proactive Strike!
  res1.state.player.hand = ['shot', 'ice'];
  const resTurn2 = simulateTurn(res1.state, ['shot', 'ice'], 'e1');
  assert.ok(resTurn2.ok);

  // Proactive strike executed, dual fusion scald triggered (ice + fire = -2 armor shred)
  assert.ok(resTurn2.summary.sequence.some(msg => msg.includes('ออกหมัดประสาน') || msg.includes('ไอเดือด') || msg.includes('ปฏิบัติหน้าที่เสร็จสิ้น')), 'Proactive strike or dual fusion should trigger');
  assert.equal(resTurn2.state.player.summon, undefined, 'Summon must depart and expire on turn 2');
});

test('Summon System: Sovereign Soul Aegis (+10 Summon) Cheat-Death', () => {
  const state = createRun('cheat-death-test', true);
  state.player.hp = 5;
  state.player.mana = 20;
  state.player.words = ['shot', 'fire'];
  state.player.hand = ['shot', 'fire'];
  state.player.cardUpgrades = { summon: 10 };
  state.player.cardSecondaryUpgrades = { summon: ['sovereign_soul_aegis'] };

  // Manually give player a summon on this turn (turn 4)
  state.player.summon = {
    creatureId: 'dog',
    name: 'สุนัข',
    hp: 14,
    maxHp: 14,
    armor: 0,
    ward: 0,
    counter: 4,
    strike: 12,
    turnCreated: 4,
  };

  // Fatal attack on player: ember_overlord turn 4 ultimate deals 16+ damage
  state.enemies = [{ id: 'boss', kind: 'ember_overlord', hp: 100, maxHp: 100, armor: 0, slot: 0 }];
  state.turn = 4; // Turn 4 is ultimate AoE attack for ember_overlord

  const res = simulateTurn(state, ['shot', 'fire'], 'boss');
  assert.ok(res.ok);

  // Player survives at 1 HP through Sovereign Soul Aegis cheat-death!
  assert.equal(res.state.player.hp, 1, 'Player should be preserved at 1 HP');
  assert.equal(res.state.player.summon, undefined, 'Summon sacrificed itself');
});

test('Summon System: Save & Load Persistence', () => {
  const state = createRun('save-summon-test', true);
  state.player.summon = {
    creatureId: 'dragon',
    name: 'มังกรเพลิงโบราณ',
    element: 'fire',
    isGrand: true,
    hp: 80,
    maxHp: 80,
    armor: 5,
    ward: 1,
    counter: 28,
    strike: 75,
    turnCreated: 2,
    aoeIntercept: false,
  };

  const validated = validateRun(state);
  assert.ok(validated.player.summon, 'Summon must be preserved in validated save data');
  assert.equal(validated.player.summon.creatureId, 'dragon');
  assert.equal(validated.player.summon.hp, 80);
});

test('Summon System: Turn 2 Summon Chaining / Succession Relay Strike ("ลืมกฎแล้วร่ายอัญเชิญซ้ำในเทิร์นถัดไป")', () => {
  const state = createRun('relay-strike-test', true);
  state.player.hp = 30;
  state.player.mana = 20;
  state.player.words = ['summon', 'dog', 'fire', 'golem', 'water'];
  state.player.hand = ['summon', 'dog', 'fire'];
  state.enemies = [{ id: 'e1', kind: 'armored', hp: 50, maxHp: 50, armor: 3, slot: 0 }];

  // Turn 1: Summon dog (Fire)
  const res1 = simulateTurn(state, ['summon', 'dog', 'fire'], 'e1');
  assert.ok(res1.ok);
  assert.ok(res1.state.player.summon, 'Dog is on field after turn 1');
  assert.equal(res1.state.player.summon.creatureId, 'dog');

  // Turn 2: Player forgets or chains summon: casts Golem (Water)!
  // Dog must NOT simply vanish! It must perform a Succession Relay Strike, deal strike damage,
  // trigger Mist (Fire + Water) to obscure the enemy, and hand off the frontline to Golem!
  res1.state.player.hand = ['summon', 'golem', 'water'];
  res1.state.player.mana = 20;
  const res2 = simulateTurn(res1.state, ['summon', 'golem', 'water'], 'e1');
  assert.ok(res2.ok);

  // 1. Dog executed proactive strike
  const strikeEvt = res2.events.find(e => e.type === 'summon_strike' && e.creature === 'dog');
  assert.ok(strikeEvt, 'Prior summon (Dog) must execute its proactive strike on turn 2 relay');
  assert.ok(strikeEvt.amount > 0, 'Dog strike damage must be positive');

  // 2. Relay & Depart events fired
  const relayEvt = res2.events.find(e => e.type === 'summon_relay');
  assert.ok(relayEvt, 'Summon relay event must fire');
  assert.equal(relayEvt.oldCreature, 'dog');
  assert.equal(relayEvt.newCreature, 'golem');
  assert.ok(res2.events.some(e => e.type === 'summon_depart' && e.creature === 'dog'), 'Dog departed after relay');

  // Mist obscures the next enemy attack; the enemy consumes it on action.
  assert.ok(res2.summary.sequence.some(line => line.includes(WORDS.mist.label)));
  assert.equal(res2.state.enemies[0].armor, 3);

  // 4. New summon (Golem) is active with full stats
  assert.ok(res2.state.player.summon, 'New summon (Golem) must be active on field');
  assert.equal(res2.state.player.summon.creatureId, 'golem');
  assert.equal(res2.state.player.summon.element, 'water');
  assert.equal(res2.state.player.summon.turnCreated, 2, 'Golem turnCreated must be turn 2');
});

test('Summon System: All 27 Creatures drawSummonSprite and Audio presets execute without errors', async () => {
  const { Battlefield } = await import('../src/render.js');
  const { GameAudio } = await import('../src/audio.js');

  const mockCtx = {
    fillStyle: '',
    fillRect: () => {},
  };
  const fakeBf = {
    ctx: mockCtx,
    settings: { reducedMotion: false },
    pixelEllipse: () => {},
  };

  // Verify all 27 creatures render cleanly with various elements
  for (const cid of CREATURE_WORDS) {
    for (const elem of ['fire', 'ice', 'lightning', 'earth', 'water', 'wind', null]) {
      assert.doesNotThrow(() => {
        Battlefield.prototype.drawSummonSprite.call(fakeBf, {
          creatureId: cid,
          name: cid,
          element: elem,
          hp: 20,
          maxHp: 20,
        }, 88, 147, 0, null, 0);
      }, `Drawing creature ${cid} with element ${elem} should not throw`);
    }
  }

  // Verify GameAudio presets execute without errors
  const ga = new GameAudio({ muted: true });
  for (const name of ['summon-invoke', 'summon-strike', 'summon-counter', 'summon-break', 'summon-depart', 'summon-relay']) {
    assert.doesNotThrow(() => {
      ga.play(name);
    }, `Audio preset ${name} should execute cleanly`);
  }
  for (const elem of ['fire', 'ice', 'lightning', 'earth', 'water', 'wind']) {
    assert.doesNotThrow(() => {
      ga.playElementalBurst(elem);
    }, `Audio elemental burst for ${elem} should execute cleanly`);
  }
});

test('Summon starter reward unlocks the pair and the loaded deck keeps access to it', () => {
  let state = createRun('summon-starter');
  state.room = 2;
  makeRewards(state);
  assert.ok(state.rewards.includes('summon'));
  state = chooseReward(state, 'summon');
  assert.ok(state.collection.includes('dog'));
  state = equipWords(state, ['shot', 'fire', 'ice', 'shield', 'pair', 'summon', 'dog']);
  assert.ok(state.player.hand.includes('summon'));
  assert.ok(state.player.hand.includes('dog'));
  const next = simulateTurn(state, ['summon', 'dog']);
  assert.ok(next.ok);
  assert.ok(next.state.player.hand.length > 0);
  assert.ok(next.state.player.hand.every(w => state.player.words.includes(w)));
});

test('Summon strike applies one tower bonus without mutating the input target', () => {
  const state = createRun('summon-scaling', false, ['summon', 'dog']);
  state.room = 75;
  state.player.words = ['shot', 'fire', 'ice', 'summon', 'dog'];
  state.player.hand = [];
  state.enemies = [{ ...createEnemy('striker'), hp: 60, maxHp: 60 }];
  state.turn = 2;
  state.player.summon = { creatureId: 'dog', name: 'สุนัข', hp: 14, strike: 12, turnCreated: 1 };
  const before = structuredClone(state);
  const next = simulateTurn(state, 'guard', state.enemies[0].id);
  assert.deepEqual(state, before);
  assert.equal(next.events.find(event => event.type === 'summon_strike').amount, 15);
  assert.equal(next.state.enemies[0].hp, 45);
});

test('Summon hits absorb a ward layer and leave an opening against a renewable ward', () => {
  const state = createRun('summon-ward', false, ['summon', 'dog']);
  state.room = 50;
  state.player.words = ['shot', 'fire', 'ice', 'summon', 'dog'];
  state.player.hand = ['summon', 'dog'];
  state.enemies = [createEnemy('aether_warden', 0, 50)];
  state.enemies[0].ward = 2;
  const first = simulateTurn(state, ['summon', 'dog']);
  const counter = first.events.find(event => event.type === 'summon_counter');
  assert.equal(counter.blocked, true);
  assert.equal(first.state.enemies[0].hp, state.enemies[0].hp);
  assert.equal(first.state.enemies[0].ward, 0);
  const followup = simulateTurn(first.state, 'guard', state.enemies[0].id);
  assert.ok(followup.events.find(event => event.type === 'summon_strike').amount > 0);
});

test('A lethal single hit triggers the first counter before the summon breaks', () => {
  const state = createRun('summon-lethal', false, ['summon', 'golem']);
  state.player.words = ['shot', 'fire', 'ice', 'summon', 'golem'];
  state.player.hand = ['summon', 'golem', 'fire'];
  state.turn = 49;
  state.enemies = [{ ...createEnemy('striker'), hp: 100, maxHp: 100 }];
  const result = simulateTurn(state, ['summon', 'golem', 'fire']);
  const types = result.events.map(event => event.type);
  const counter = result.events.find(event => event.type === 'summon_counter');
  assert.equal(counter.amount, 13);
  assert.ok(types.indexOf('summon_counter') < types.indexOf('summon_break'));
  assert.equal(result.state.enemies[0].burn, 3);
  assert.equal(result.state.player.hp, state.player.hp);
  assert.equal(result.state.player.summon, undefined);
});

test('Turtle break creates a persistent shield that survives saving and reloading', () => {
  const state = createRun('summon-turtle', false, ['summon', 'turtle']);
  state.player.words = ['shot', 'fire', 'ice', 'summon', 'turtle'];
  enterRoom(state);
  state.player.hand = ['summon', 'turtle'];
  state.turn = 32;
  const result = simulateTurn(state, ['summon', 'turtle']);
  assert.equal(result.state.player.summon, undefined);
  assert.deepEqual(result.state.player.shield.layers, [6, 8]);
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(saveRun(result.state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state.player.shield.layers, [6, 8]);
  const leaked = structuredClone(result.state);
  leaked.turn = 1;
  leaked.player.shield = null;
  leaked.player.summon = { creatureId: 'dog', hp: 11, turnCreated: 1 };
  values.set(SAVE_KEY, JSON.stringify(leaked));
  assert.equal(loadRun(storage).state.player.summon, undefined);
});

test('Summon +7 does not grant cheat death and Phoenix +7 hatches only once', () => {
  const state = createRun('summon-phoenix', false, ['summon', 'phoenix']);
  state.player.words = ['shot', 'fire', 'ice', 'summon', 'phoenix'];
  state.player.hp = 5;
  state.player.cardUpgrades = { summon: 7, phoenix: 7 };
  state.player.hand = [];
  state.turn = 4;
  state.player.summon = { creatureId: 'phoenix', name: 'ฟีนิกซ์', hp: 5, maxHp: 50, ward: 0, armor: 0, counter: 0, turnCreated: 4 };
  state.enemies = [{ ...createEnemy('ember_overlord'), hp: 100 }];
  const fatal = simulateTurn(state, 'guard');
  assert.equal(fatal.state.player.hp, 0);
  assert.ok(!fatal.events.some(event => event.type === 'cheat_death'));

  state.player.hp = 36;
  state.turn = 60;
  state.player.summon.turnCreated = 60;
  state.enemies = [{ ...createEnemy('striker'), hp: 100 }];
  const first = simulateTurn(state, 'guard');
  assert.equal(first.state.player.summon.hp, 25);
  assert.ok(first.events.some(event => event.type === 'summon_rebirth'));
  first.state.player.summon.turnCreated = first.state.turn;
  const next = simulateTurn(first.state, 'guard');
  assert.equal(next.state.player.summon, undefined);
});

test('Wari counter and break wet duration survives save validation', () => {
  const state = createRun('summon-wari-save', false, ['summon', 'dog', 'wari']);
  state.player.words = ['shot', 'fire', 'ice', 'summon', 'dog', 'wari'];
  enterRoom(state);
  state.player.hand = ['summon', 'dog', 'wari'];
  state.player.mana = 20;

  // Turn 1: Summon dog with wari
  const res = simulateTurn(state, ['summon', 'dog', 'wari'], state.enemies[0].id);
  assert.ok(res.ok);
  // Enemy attacks, dog counters with wari, applying wetUntil = turn + 3 (= 4)
  assert.equal(res.state.enemies[0].wetUntil, res.state.turn + 2);

  // Validate that the save system accepts wetUntil at state.turn + 2
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(saveRun(res.state, storage).ok, true);
  const loaded = loadRun(storage);
  assert.equal(loaded.ok, true);
  assert.equal(loaded.state.enemies[0].wetUntil, res.state.turn + 2);
});

test('Summon appears immediately on summon_invoke in Battlefield snapshots and draw before enemy attacks', () => {
  const state = createRun('summon-immediate-render', false, ['summon', 'dog']);
  state.player.words = ['shot', 'fire', 'ice', 'summon', 'dog'];
  state.player.hand = ['summon', 'dog', 'fire'];
  state.enemies = [{ ...createEnemy('striker'), hp: 40, maxHp: 40 }];
  assert.equal(state.player.summon, undefined);

  const res = simulateTurn(state, ['summon', 'dog', 'fire'], state.enemies[0].id);
  assert.ok(res.ok);
  const invokeIdx = res.events.findIndex(e => e.type === 'summon_invoke');
  const hitIdx = res.events.findIndex(e => e.type === 'summon_hit');
  const attackIdx = res.events.findIndex(e => e.type === 'attack');
  assert.ok(invokeIdx >= 0, 'summon_invoke event must be emitted');
  assert.ok(hitIdx > invokeIdx, 'summon_hit must follow summon_invoke');
  assert.ok(attackIdx > hitIdx, 'attack must follow summon_hit');
  assert.equal(typeof res.events[invokeIdx].counter, 'number');
  assert.equal(typeof res.events[invokeIdx].strike, 'number');

  // Minimal stub canvas/context for Battlefield headless test
  const noop = () => {};
  const ctx = {
    imageSmoothingEnabled: false,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    font: '',
    textAlign: '',
    fillRect: noop,
    clearRect: noop,
    drawImage: noop,
    save: noop,
    restore: noop,
    translate: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fill: noop,
    arc: noop,
    ellipse: noop,
    fillText: noop,
    strokeText: noop,
    measureText: () => ({ width: 20 }),
  };
  const stubCanvas = { width: 320, height: 180, id: 'test-canvas', getContext: () => ctx };
  const prevCreateElement = globalThis.document?.createElement;
  const prevDoc = globalThis.document;
  const prevImage = globalThis.Image;
  const prevRaf = globalThis.requestAnimationFrame;
  const prevCaf = globalThis.cancelAnimationFrame;
  globalThis.Image = class {
    constructor() { this.complete = false; this.naturalWidth = 0; }
    set src(v) { this._src = v; }
    get src() { return this._src; }
  };
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => {};
  globalThis.document = {
    createElement: () => ({ width: 320, height: 180, getContext: () => ctx }),
  };
  try {
    const bf = new Battlefield(stubCanvas, { reducedMotion: true, combatSpeed: 1 });
    bf.set(state, state.enemies[0].id); // pre-turn state: player.summon is undefined!
    bf.animate(res.events, noop, noop);

    // Immediately after summon_invoke (and BEFORE summon_hit / attack), snapshot has active summon!
    assert.equal(bf.snapshots[invokeIdx].summon, null);
    assert.ok(bf.snapshots[invokeIdx + 1].summon, 'Snapshot immediately after summon_invoke must contain summon');
    assert.equal(bf.snapshots[invokeIdx + 1].summon.creatureId, 'dog');
    assert.equal(bf.snapshots[invokeIdx + 1].summon.hp, res.events[invokeIdx].hp);

    // After summon_hit, snapshot reflects reduced summon HP
    assert.equal(bf.snapshots[hitIdx + 1].summon.hp, res.events[hitIdx].hpRemaining);

    // During summon_invoke event frame itself, draw() must invoke drawSummonSprite immediately!
    const drawnDuringInvoke = [];
    const origDrawSummon = bf.drawSummonSprite.bind(bf);
    bf.drawSummonSprite = (summon, ...args) => {
      drawnDuringInvoke.push(summon);
      return origDrawSummon(summon, ...args);
    };
    const invokeMidTime = bf.started + (bf.eventStart(invokeIdx) + bf.eventEnds[invokeIdx]) / 2;
    bf.draw(invokeMidTime);
    assert.equal(drawnDuringInvoke.length, 1, 'Summon sprite must draw immediately during summon_invoke event');
    assert.equal(drawnDuringInvoke[0].creatureId, 'dog');
  } finally {
    if (prevRaf === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = prevRaf;
    if (prevCaf === undefined) delete globalThis.cancelAnimationFrame;
    else globalThis.cancelAnimationFrame = prevCaf;
    if (prevImage === undefined) delete globalThis.Image;
    else globalThis.Image = prevImage;
    if (prevDoc === undefined) delete globalThis.document;
    else {
      globalThis.document = prevDoc;
      if (prevCreateElement) globalThis.document.createElement = prevCreateElement;
    }
  }
});

test('Pure summon deck without attack forms is valid in Sanctuary, loadout, opening hand, combat, and local save', () => {
  const storage = { data: new Map(), getItem(k) { return this.data.get(k) ?? null; }, setItem(k, v) { this.data.set(k, String(v)); }, removeItem(k) { this.data.delete(k); } };
  const run = createRun('pure-summon-deck');
  run.room = FLOOR5_START_ROOM;
  run.highestRoom = FLOOR5_START_ROOM;
  run.sanctuaryUnlocked = true;
  run.collection = ['summon', 'dog', 'turtle', 'wolf', 'heal', 'self'];
  run.learned = [...run.collection];
  const sanct = enterSanctuary(run);

  // 1. Pure summon deck WITH elements, ZERO attack forms (no shot/beam/wave/etc.)
  const pureWithElements = ['summon', 'dog', 'turtle', 'fire', 'ice', 'shield', 'pair'];
  const updatedWithElem = updateSanctuaryLoadout(sanct, pureWithElements);
  assert.deepEqual(updatedWithElem.player.words, pureWithElements);
  const battleWithElem = revisitRoom(updatedWithElem, FLOOR5_START_ROOM);
  assert.equal(battleWithElem.phase, 'battle');
  assert.equal(battleWithElem.player.hand.every(id => typeof id === 'string' && pureWithElements.includes(id)), true);
  assert.ok(battleWithElem.player.hand.includes('summon'));
  assert.ok(battleWithElem.player.hand.some(id => id === 'dog' || id === 'turtle'));
  assert.equal(saveRun(battleWithElem, storage).ok, true);
  assert.equal(loadRun(storage).ok, true);

  // 2. Pure colorless summon deck: ZERO attack forms AND ZERO elements!
  const pureColorless = ['summon', 'dog', 'turtle', 'wolf', 'shield', 'heal', 'self'];
  const updatedColorless = updateSanctuaryLoadout(sanct, pureColorless);
  assert.deepEqual(updatedColorless.player.words, pureColorless);
  const battleColorless = revisitRoom(updatedColorless, FLOOR5_START_ROOM);
  assert.equal(battleColorless.phase, 'battle');
  assert.equal(battleColorless.player.hand.length, 5);
  assert.equal(battleColorless.player.hand.every(id => typeof id === 'string' && pureColorless.includes(id)), true);
  assert.ok(battleColorless.player.hand.includes('summon'));
  const creatureInHand = battleColorless.player.hand.find(id => CREATURE_WORDS.includes(id));
  assert.ok(creatureInHand, 'Opening hand for pure summon deck must include a creature');
  const turn = simulateTurn(battleColorless, ['summon', creatureInHand], battleColorless.enemies[0].id);
  assert.equal(turn.ok, true);
  assert.equal(saveRun(turn.state, storage).ok, true);
  assert.equal(loadRun(storage).ok, true);

  // 3. Summon WITHOUT any creature and WITHOUT any attack form must still be rejected to prevent soft-lock
  assert.throws(
    () => updateSanctuaryLoadout(sanct, ['summon', 'fire', 'ice', 'shield', 'pair', 'heal', 'self']),
    /อัญเชิญ/,
  );
});

test('Summon Base Cost 3 MP and Weighted In-Combat Draw', () => {
  // 1. Verify 4 formulas
  const f1 = parseSpell(['summon', 'dog']);
  assert.equal(f1.cost, 4);
  const f2 = parseSpell(['summon', 'dog', 'fire']);
  assert.equal(f2.cost, 6);
  const f3 = parseSpell(['summon', 'gargoyle']);
  assert.equal(f3.cost, 8);
  const f4 = parseSpell(['grand', 'summon', 'dog', 'fire']);
  assert.equal(f4.cost, 9);

  // 2. Reject if short 1 MP
  const s = createRun('cost-verify', false);
  s.player.words = ['grand', 'summon', 'dog', 'fire'];
  s.player.hand = ['grand', 'summon', 'dog', 'fire'];
  s.player.mana = 8; // needs 9
  s.enemies = [{ id: 'e1', kind: 'striker', hp: 30, maxHp: 30, armor: 0, slot: 0 }];
  const r = simulateTurn(s, ['grand', 'summon', 'dog', 'fire'], 'e1');
  assert.equal(r.ok, false);
  assert.ok(r.error.includes('9'));

  // 3. Opening hand guarantees summon + creature, but mid-battle draw is weighted random
  const deck = ['shot', 'fire', 'ice', 'shield', 'pair', 'summon', 'dog'];
  const run = createRun('draw-guarantee-check', false);
  run.player.words = deck;
  run.room = 0;
  enterRoom(run);
  assert.ok(run.player.hand.includes('summon'));
  assert.ok(run.player.hand.includes('dog'));

  // Mid battle draw does not force summon
  const midState = {
    player: { words: deck, hand: [] },
    handRng: 42
  };
  drawCards(midState, 3);
  assert.equal(midState.player.hand.length, 3);
  assert.ok(midState.player.hand.every(w => deck.includes(w)));
});

