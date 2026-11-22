import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSpell, WORDS, getWeaknessReaction } from '../src/words.js';
import { simulateTurn } from '../src/combat.js';

function createBattleState(handWords, enemies = [{ id: 'target-0', kind: 'striker', name: 'สไตรเกอร์', hp: 60, maxHp: 60, armor: 0, ward: 0, slot: 0 }]) {
  return {
    phase: 'battle',
    room: 1,
    turn: 1,
    stats: { turns: 0, discovered: [] },
    player: {
      hp: 50,
      maxHp: 50,
      mana: 25,
      maxMana: 25,
      words: ['shot', 'spear', 'axe', 'chakram', 'beam', 'wave', 'storm', 'blast', 'shield', 'empower', 'bless', 'grand', 'pair', 'fire', 'ice', 'lightning', 'earth', 'water', 'wind'],
      hand: [...handWords],
      relics: [],
      upgrades: {},
      cardUpgrades: {},
      cardSecondaryUpgrades: {},
      elementBuffs: {},
    },
    enemies,
  };
}

test('Dual-Element Fusion & Split: Attack Forms Comparison', () => {
  // Split [shot fire ice pair]: 2 distinct shots, separate elements
  const splitRes = parseSpell(['shot', 'fire', 'ice', 'pair']);
  assert.equal(splitRes.ok, true);
  assert.equal(splitRes.spell.shots, 2);
  assert.equal(splitRes.spell.elements[0], 'fire');
  assert.equal(splitRes.spell.secondElement, 'ice');
  assert.equal(splitRes.cost, 6);

  // Fused [shot fire pair ice]: 1 fused shot containing both elements, discounted cost
  const fusedRes = parseSpell(['shot', 'fire', 'pair', 'ice']);
  assert.equal(fusedRes.ok, true);
  assert.equal(fusedRes.spell.shots, 1);
  assert.deepEqual(fusedRes.spell.elements, ['fire', 'ice']);
  assert.equal(fusedRes.cost, 5);

  // Combat Execution
  const stateSplit = createBattleState(['shot', 'fire', 'ice', 'pair']);
  const simSplit = simulateTurn(stateSplit, ['shot', 'fire', 'ice', 'pair'], 'target-0', 'target-0');
  assert.equal(simSplit.ok, true);
  const dmgEventsSplit = simSplit.events.filter(e => e.type === 'damage');
  assert.equal(dmgEventsSplit.length, 2);
  assert.equal(dmgEventsSplit[0].element, 'fire');
  assert.equal(dmgEventsSplit[1].element, 'ice');

  const stateFused = createBattleState(['shot', 'fire', 'pair', 'ice']);
  const simFused = simulateTurn(stateFused, ['shot', 'fire', 'pair', 'ice'], 'target-0', 'target-0');
  assert.equal(simFused.ok, true);
  const dmgEventsFused = simFused.events.filter(e => e.type === 'damage');
  assert.equal(dmgEventsFused.length, 1);
  assert.deepEqual(dmgEventsFused[0].element, ['fire', 'ice']);
});

test('Dual-Element Fusion & Split: Buffs (empower & bless)', () => {
  // Fused syntax: [empower fire pair ice]
  const pFused = parseSpell(['empower', 'fire', 'pair', 'ice']);
  assert.equal(pFused.ok, true);
  assert.deepEqual(pFused.spell.elements, ['fire', 'ice']);
  assert.equal(pFused.cost, 5);

  // Split syntax: [empower fire ice pair] is now symmetrically supported!
  const pSplit = parseSpell(['empower', 'fire', 'ice', 'pair']);
  assert.equal(pSplit.ok, true);
  assert.deepEqual(pSplit.spell.elements, ['fire', 'ice']);
  assert.equal(pSplit.cost, 5);

  // Bless symmetric syntax
  const bFused = parseSpell(['bless', 'fire', 'pair', 'ice']);
  const bSplit = parseSpell(['bless', 'fire', 'ice', 'pair']);
  assert.equal(bFused.ok, true);
  assert.equal(bSplit.ok, true);
  assert.deepEqual(bSplit.spell.elements, ['fire', 'ice']);
  assert.equal(bSplit.cost, 6);

  // Combat simulation applies buff to both element families
  const state = createBattleState(['empower', 'fire', 'ice', 'pair']);
  const sim = simulateTurn(state, ['empower', 'fire', 'ice', 'pair'], 'target-0');
  assert.equal(sim.ok, true);
  assert.ok(sim.state.player.elementBuffs.fire);
  assert.ok(sim.state.player.elementBuffs.ice);
});

test('Dual-Element 4-word Grand Attacks (grand + form + elem1 + elem2)', () => {
  const gShot = parseSpell(['grand', 'shot', 'fire', 'ice']);
  assert.equal(gShot.ok, true);
  assert.equal(gShot.spell.grand, true);
  assert.deepEqual(gShot.spell.elements, ['fire', 'ice']);
  assert.equal(gShot.spell.multiplier, 1.5);

  const gSpear = parseSpell(['grand', 'spear', 'fire', 'ice']);
  assert.equal(gSpear.ok, true);
  assert.equal(gSpear.spell.grand, true);
  assert.deepEqual(gSpear.spell.elements, ['fire', 'ice']);

  const gChakram = parseSpell(['grand', 'chakram', 'fire', 'ice']);
  assert.equal(gChakram.ok, true);
  assert.equal(gChakram.spell.grand, true);
  assert.equal(gChakram.spell.multiplier, 1.8 * 1.5);

  // Duplicate elements are rejected
  assert.equal(parseSpell(['grand', 'shot', 'fire', 'fire']).ok, false);
});

test('Dual-Element Storm & Blast with pair (4-word dual pair combos)', () => {
  // storm fire ice pair: 2 storm waves with dual elements
  const stormPair = parseSpell(['storm', 'fire', 'ice', 'pair']);
  assert.equal(stormPair.ok, true);
  assert.deepEqual(stormPair.spell.elements, ['fire', 'ice']);
  assert.equal(stormPair.spell.stormPair, true);
  assert.equal(stormPair.cost, 11);

  // blast fire ice pair: 2 blast detonations with dual elements
  const blastPair = parseSpell(['blast', 'fire', 'ice', 'pair']);
  assert.equal(blastPair.ok, true);
  assert.deepEqual(blastPair.spell.elements, ['fire', 'ice']);
  assert.equal(blastPair.spell.blastPair, true);
  assert.equal(blastPair.cost, 10);
});

test('Dual-Element Shields: Split 2 layers vs Fused 1 dual layer', () => {
  const shieldSplit = parseSpell(['shield', 'fire', 'ice', 'pair']);
  assert.equal(shieldSplit.ok, true);
  assert.equal(shieldSplit.spell.layers, 2);
  assert.deepEqual(shieldSplit.spell.layerEffects, [['fire'], ['ice']]);

  const shieldFused = parseSpell(['shield', 'fire', 'pair', 'ice']);
  assert.equal(shieldFused.ok, true);
  assert.equal(shieldFused.spell.layers, 1);
  assert.deepEqual(shieldFused.spell.layerEffects, [['fire', 'ice']]);
});

test('3-Way Balance: [คำ ธาตุ คู่] vs [ธาตุ คู่ ธาตุ] vs [ธาตุ ธาตุ คู่]', () => {
  // 1. [คำ ธาตุ คู่] (Mono Double Cast): 3 words, pure element, 2 shots of same element
  const mono = parseSpell(['shot', 'fire', 'pair']);
  assert.equal(mono.ok, true);
  assert.equal(mono.ids.length, 3);
  assert.equal(mono.spell.shots, 2);
  assert.equal(mono.spell.secondElement, undefined);

  // 2. [รูปทรง ธาตุ คู่ ธาตุ] (Fused Synthesis): 4 words, 1 shot, fuses reaction, discounted cost 5 MP
  const fused = parseSpell(['shot', 'fire', 'pair', 'ice']);
  assert.equal(fused.ok, true);
  assert.equal(fused.ids.length, 4);
  assert.equal(fused.spell.shots, 1);
  assert.equal(fused.cost, 5); // Fused discount
  assert.deepEqual(fused.spell.elements, ['fire', 'ice']);

  // 3. [รูปทรง ธาตุ ธาตุ คู่] (Split Chain Combo): 4 words, 2 shots, dual targets, cost 6 MP
  const split = parseSpell(['shot', 'fire', 'ice', 'pair']);
  assert.equal(split.ok, true);
  assert.equal(split.ids.length, 4);
  assert.equal(split.spell.shots, 2);
  assert.equal(split.cost, 6); // Pays for both spells
  assert.equal(split.spell.secondElement, 'ice');

  // Combat behavior:
  // Armored target with 3 armor:
  const enemyArmored = { id: 'target-0', kind: 'armored', name: 'หุ้มเกราะ', hp: 30, maxHp: 30, armor: 3, ward: 0, slot: 0 };

  // Fused shot (Fire + Ice) triggers Scald Reaction (shreds 2 armor!)
  const stateFused = createBattleState(['shot', 'fire', 'pair', 'ice'], [{ ...enemyArmored }]);
  const simFused = simulateTurn(stateFused, ['shot', 'fire', 'pair', 'ice'], 'target-0', 'target-0');
  assert.equal(simFused.ok, true);
  // Armor was shredded by 2 from Scald reaction!
  const targetAfterFused = simFused.state.enemies.find(e => e.id === 'target-0');
  assert.equal(targetAfterFused.armor, 1); // 3 - 2 = 1 armor left!

  // Split shot (Fire, then Ice) does NOT trigger Scald reaction (it's 2 separate shots)
  const stateSplit = createBattleState(['shot', 'fire', 'ice', 'pair'], [{ ...enemyArmored }]);
  const simSplit = simulateTurn(stateSplit, ['shot', 'fire', 'ice', 'pair'], 'target-0', 'target-0');
  assert.equal(simSplit.ok, true);
  const targetAfterSplit = simSplit.state.enemies.find(e => e.id === 'target-0');
  assert.equal(targetAfterSplit.armor, 3); // Armor remains 3 (no fusion reaction)!
});
