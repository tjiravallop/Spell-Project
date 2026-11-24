import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORDS,
  getCardCapabilityBadge,
  getCardDynamicStats,
  getCardDescription,
  getCardFormula,
  getCardUpgradeComparison,
  getCardDetails,
  lightDamagePenalty,
} from '../src/words.js';
import {
  createRun,
  createEnemy,
  getCardUpgradeLevel,
  chooseReward,
  MAX_CARD_UPGRADE,
} from '../src/run.js';
import { simulateTurn } from '../src/combat.js';
import { playingCardFace } from '../src/ui/dom.js';

const FIRST_20_CARDS = [
  'shot', 'spear', 'axe', 'light', 'delay',
  'fire', 'ice', 'lightning', 'earth', 'water', 'wind',
  'akki', 'heman', 'asani', 'pathaphi', 'wari', 'vayu',
  'magma', 'mudmire', 'dust',
];

test('First 20 cards in WORDS order exist with labels and glyphs', () => {
  const keys = Object.keys(WORDS).slice(0, 20);
  assert.deepEqual(keys, FIRST_20_CARDS);
  for (const id of FIRST_20_CARDS) {
    assert.ok(WORDS[id].label, `${id} must have label`);
    assert.ok(WORDS[id].glyph, `${id} must have glyph`);
    assert.ok(WORDS[id].description, `${id} must have description`);
    assert.ok(WORDS[id].formula, `${id} must have formula`);
  }
});

test('Capability badges are concise and accurate for first 20 cards', () => {
  const expected = {
    shot: 'เป้าเดี่ยว',
    spear: 'แทง 2 ช่อง',
    axe: 'ข้ามเกราะ',
    light: 'ลดร่าย 1 MP',
    delay: 'หน่วงโล่',
    fire: 'ดาเมจตรง',
    ice: 'หนาว',
    lightning: 'เจาะเกราะ 2',
    earth: 'เกราะ+ทุบ',
    water: 'ฮีล/เปียก',
    wind: 'ผลักชน',
    akki: 'ตัดฮีล 50%',
    heman: 'หนาว 2 ครั้ง',
    asani: 'ชิ่ง 50%',
    pathaphi: 'เกราะ+ทุบ 2',
    wari: 'ฮีล/เปียกหมู่',
    vayu: 'ผลักชน 6',
    magma: 'แอ่งปะทุ',
    mudmire: 'เปียก/หนาว',
    dust: 'ทุบ+ผลักชน',
  };
  for (const id of FIRST_20_CARDS) {
    const badge = getCardCapabilityBadge(id);
    assert.equal(badge, expected[id], `Badge mismatch for ${id}`);
    assert.ok(badge.length <= 15, `Badge for ${id} is too long: ${badge}`);
  }
});

test('Dynamic stats scale accurately from +0 through +10 without hardcoding', () => {
  // light: 25% at +0, 15% at +5, 13% at +6, 5% at +10
  assert.equal(getCardDynamicStats('light', 0).penalty, 25);
  assert.equal(getCardDynamicStats('light', 5).penalty, 15);
  assert.equal(getCardDynamicStats('light', 6).penalty, 13);
  assert.equal(getCardDynamicStats('light', 10).penalty, 5);

  // delay: shield 4 at +0, 9 at +5, 14 at +10
  assert.equal(getCardDynamicStats('delay', 0).shield, 4);
  assert.equal(getCardDynamicStats('delay', 5).shield, 9);
  assert.equal(getCardDynamicStats('delay', 10).shield, 14);

  // fire: 10 at +0, 15 at +5, 20 at +10
  assert.equal(getCardDynamicStats('fire', 0).damage, 10);
  assert.equal(getCardDynamicStats('fire', 5).damage, 15);
  assert.equal(getCardDynamicStats('fire', 10).damage, 20);

  // ice: damage 6, chill 4 at +0; damage 11, chill 5 at +5; damage 16, chill 7 at +10
  const ice0 = getCardDynamicStats('ice', 0);
  assert.equal(ice0.damage, 6);
  assert.equal(ice0.chill, 4);
  const ice5 = getCardDynamicStats('ice', 5);
  assert.equal(ice5.damage, 11);
  assert.equal(ice5.chill, 5);
  const ice10 = getCardDynamicStats('ice', 10);
  assert.equal(ice10.damage, 16);
  assert.equal(ice10.chill, 7);

  // spear: damage 0 bonus, 0 pierce at +0; 1 pierce at +3; 3 pierce at +9
  assert.equal(getCardDynamicStats('spear', 0).pierce, 0);
  assert.equal(getCardDynamicStats('spear', 3).pierce, 1);
  assert.equal(getCardDynamicStats('spear', 9).pierce, 3);

  // magma: 22 dmg, 6 erupt at +0; 32 dmg, 16 erupt at +5; 42 dmg, 26 erupt at +10
  const m0 = getCardDynamicStats('magma', 0);
  assert.equal(m0.damage, 22);
  assert.equal(m0.eruptDmg, 6);
  const m5 = getCardDynamicStats('magma', 5);
  assert.equal(m5.damage, 32);
  assert.equal(m5.eruptDmg, 16);
  const m10 = getCardDynamicStats('magma', 10);
  assert.equal(m10.damage, 42);
  assert.equal(m10.eruptDmg, 26);

  // mudmire: 18 dmg, chill 3, block 0 at +0; 28 dmg, chill 5, block 5 at +5
  const mud0 = getCardDynamicStats('mudmire', 0);
  assert.equal(mud0.damage, 18);
  assert.equal(mud0.chill, 3);
  assert.equal(mud0.block, 0);
  const mud5 = getCardDynamicStats('mudmire', 5);
  assert.equal(mud5.damage, 28);
  assert.equal(mud5.chill, 5);
  assert.equal(mud5.block, 5);
});

test('Upgrade comparison formatting matches requirements (e.g. light 15% -> 13%)', () => {
  const compLight0 = getCardUpgradeComparison('light', 0);
  assert.match(compLight0, /25% → 23%/);

  const compLight5 = getCardUpgradeComparison('light', 5);
  assert.match(compLight5, /15% → 13%/);

  const compFire0 = getCardUpgradeComparison('fire', 0);
  assert.match(compFire0, /10 → 11/);

  const compDelay0 = getCardUpgradeComparison('delay', 0);
  assert.match(compDelay0, /4 → 5/);
});

test('Card details structure provides cost, target, duration, condition and stats', () => {
  for (const id of FIRST_20_CARDS) {
    const d = getCardDetails(id, 0);
    assert.equal(d.id, id);
    assert.ok(d.label);
    assert.ok(d.cost);
    assert.ok(d.target);
    assert.ok(d.duration);
    assert.ok(d.condition);
    assert.ok(d.description);
    assert.ok(d.formula);
  }
});

test('Mudmire and Magma combat behavior parity', () => {
  // 1. Verify Mudmire wetUntil vs chill in combat
  const state = createRun('test-mudmire');
  state.phase = 'battle';
  state.player.words = ['shot', 'mudmire'];
  state.player.hand = ['shot', 'mudmire'];
  state.player.mana = 10;
  const enemy = createEnemy('striker', 0);
  enemy.hp = enemy.maxHp = 50;
  enemy.armor = 0;
  enemy.ward = 0;
  state.enemies = [enemy];

  const res = simulateTurn(state, ['shot', 'mudmire'], enemy.id);
  const target = res.state.enemies[0];
  // Mudmire deals 18 damage at +0 (50 - 18 = 32)
  assert.equal(target.hp, 32);
  // Target is Wet until end of next turn (turn 2):
  assert.equal(target.wetUntil, 2);
  // Striker's 3 base attack is reduced by 3 chill to 0 on this turn:
  assert.equal(res.summary.enemyActions[enemy.id].amount, 0);

  // 2. Verify Magma puddle leaves puddle in turn 1 and erupts after player action in turn 2
  const state2 = createRun('test-magma');
  state2.phase = 'battle';
  state2.player.words = ['shot', 'magma', 'guard'];
  state2.player.hand = ['shot', 'magma'];
  state2.player.mana = 10;
  const striker2 = createEnemy('striker', 0); // slot 0
  striker2.hp = striker2.maxHp = 60;
  striker2.armor = 4;
  striker2.ward = 0;
  state2.enemies = [striker2];

  // Turn 1: cast shot + magma on striker2
  const resT1 = simulateTurn(state2, ['shot', 'magma'], striker2.id);
  // Magma leaves puddle on slot 0
  assert.ok(resT1.events.some(e => e.type === 'magma-puddle' && e.slot === 0));
  assert.deepEqual(resT1.state.magmaPuddles, [0]);

  // Turn 2: player casts guard
  resT1.state.player.hand = ['shot', 'magma'];
  resT1.state.player.mana = 10;
  const resT2 = simulateTurn(resT1.state, 'guard', striker2.id);
  assert.ok(resT2.ok, 'Turn 2 guard simulation should succeed');
  // Puddle erupts after player acts in turn 2
  const eruptEvent = resT2.events.find(e => e.type === 'magma-erupt' && e.slot === 0);
  assert.ok(eruptEvent, 'Magma puddle should erupt in turn 2');
  assert.equal(eruptEvent.target, striker2.id);
  // Puddles cleared after erupting
  assert.equal(resT2.state.magmaPuddles, undefined);
});

test('Playing card face renders capability badge and info trigger without layout distortion', () => {
  const state = createRun('test-face');
  state.player.cardUpgrades = { shot: 3, light: 5, magma: 10 };

  for (const id of FIRST_20_CARDS) {
    const html = playingCardFace(state, id);
    assert.ok(html.includes('class="card-cap-badge"'), `Card ${id} must contain cap badge`);
    assert.ok(html.includes(`data-card-detail="${id}"`), `Card ${id} must contain info trigger with data-card-detail`);
    assert.ok(html.includes(getCardCapabilityBadge(id)), `Card ${id} must render correct badge text`);
  }

  // With upgrade level:
  const shotHtml = playingCardFace(state, 'shot');
  assert.ok(shotHtml.includes('+3'), 'Shot should display +3');
});

test('Card descriptions and formulas at all levels have no undefined, null, or NaN', () => {
  for (const id of FIRST_20_CARDS) {
    for (const lv of [0, 1, 3, 5, 7, 9, 10]) {
      const desc = getCardDescription(id, lv);
      const formula = getCardFormula(id, lv);
      const details = getCardDetails(id, lv);

      assert.ok(desc && !desc.includes('undefined') && !desc.includes('NaN'), `${id}+${lv} desc invalid: ${desc}`);
      assert.ok(formula && !formula.includes('undefined') && !formula.includes('NaN'), `${id}+${lv} formula invalid: ${formula}`);
      assert.ok(details.target, `${id}+${lv} target missing`);
      assert.ok(details.duration, `${id}+${lv} duration missing`);
      assert.ok(details.condition, `${id}+${lv} condition missing`);
    }
  }
});
