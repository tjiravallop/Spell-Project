import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, CREATURE_WORDS, CREATURE_STATS, parseSpell } from '../src/words.js';
import { createRun, getRewardPoolForRoom, getCardSecondaryEffect, hasCardSecondaryUpgrade, battleSpellCost } from '../src/run.js';
import { simulateTurn } from '../src/combat.js';
import { validateRun } from '../src/save.js';

test('Summon System: Grammar, Syntax, and Parsing', () => {
  // 1. Verify summon card and all 27 creatures exist in WORDS
  assert.equal(WORDS.summon.label, 'อัญเชิญ');
  assert.equal(WORDS.summon.cost, 1);
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
  assert.equal(p2.spell.cost, 1 + WORDS.dog.cost); // 1 + 2 = 3

  // 3. 3-word formula: summon + creature + element
  const p3 = parseSpell(['summon', 'golem', 'fire']);
  assert.ok(p3.ok);
  assert.equal(p3.spell.form, 'summon');
  assert.equal(p3.spell.creature, 'golem');
  assert.equal(p3.spell.element, 'fire');
  assert.equal(p3.spell.cost, 1 + WORDS.golem.cost + WORDS.fire.cost); // 1 + 4 + 2 = 7

  // 4. 4-word formula: grand + summon + creature + element
  const p4 = parseSpell(['grand', 'summon', 'golem', 'fire']);
  assert.ok(p4.ok);
  assert.equal(p4.spell.form, 'summon');
  assert.equal(p4.spell.creature, 'golem');
  assert.equal(p4.spell.element, 'fire');
  assert.equal(p4.spell.grand, true);
  const baseCost = 1 + WORDS.golem.cost + WORDS.fire.cost;
  assert.equal(p4.spell.cost, Math.ceil(baseCost * 1.5)); // Math.ceil(7 * 1.5) = 11

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
