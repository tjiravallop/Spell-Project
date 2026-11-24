import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORDS,
  CREATURE_STATS,
  getCardCapabilityBadge,
  getCardDynamicStats,
  getCardDescription,
  getCardFormula,
  getCardUpgradeComparison,
  getCardDetails,
} from '../src/words.js';
import {
  createRun,
  createEnemy,
  MAX_CARD_UPGRADE,
} from '../src/run.js';
import { simulateTurn } from '../src/combat.js';
import { playingCardFace } from '../src/ui/dom.js';

const CARDS_61_TO_80 = [
  'grand', 'seal', 'dispel', 'brace', 'summon',
  'dog', 'bird', 'cat', 'snake', 'slime',
  'bat', 'turtle', 'frog', 'spider', 'rat',
  'wolf', 'bear', 'eagle', 'boar', 'croc'
];

test('Cards 61-80 in WORDS order exist with labels and glyphs', () => {
  const allWordKeys = Object.keys(WORDS);
  const slice61To80 = allWordKeys.slice(60, 80);
  assert.deepEqual(slice61To80, CARDS_61_TO_80, 'Words 61 to 80 must match the exact sequence in WORDS');

  for (const id of CARDS_61_TO_80) {
    const word = WORDS[id];
    assert.ok(word, `Word ${id} must exist in WORDS`);
    assert.ok(word.label, `Word ${id} must have a label`);
    assert.ok(word.glyph, `Word ${id} must have a glyph`);
    assert.ok(word.description, `Word ${id} must have a description`);
    assert.ok(word.formula, `Word ${id} must have a formula`);
  }
});

test('Capability badges are concise and accurate for cards 61-80', () => {
  for (const id of CARDS_61_TO_80) {
    const badge = getCardCapabilityBadge(id);
    assert.ok(badge, `Badge for ${id} should exist`);
    assert.ok(badge.length <= 25, `Badge for ${id} (${badge}) should be <= 25 chars for mobile layout, was ${badge.length}`);
  }

  assert.equal(getCardCapabilityBadge('grand'), 'ขยายพลังขั้นสุด');
  assert.equal(getCardCapabilityBadge('seal'), 'ผนึกฮีล/ม่าน/สลับ');
  assert.equal(getCardCapabilityBadge('dispel'), 'สลายม่านทั้งหมด');
  assert.equal(getCardCapabilityBadge('brace'), 'โล่ 6/กันแรง ≥10');
  assert.equal(getCardCapabilityBadge('summon'), 'อัญเชิญ 2 เทิร์น');
  assert.equal(getCardCapabilityBadge('dog'), 'เจาะเกราะ 2/จั่ว');
  assert.equal(getCardCapabilityBadge('bird'), 'ข้ามม่าน/หลบ 20%');
  assert.equal(getCardCapabilityBadge('cat'), 'คริติคอล ×1.5');
  assert.equal(getCardCapabilityBadge('snake'), 'กัดซ้ำ 4 ข้ามเกราะ');
  assert.equal(getCardCapabilityBadge('slime'), 'แตกติดหนาว 4');
  assert.equal(getCardCapabilityBadge('bat'), 'สวนฟื้น 2 HP');
  assert.equal(getCardCapabilityBadge('turtle'), 'เกราะ 1/แจกโล่ 8');
  assert.equal(getCardCapabilityBadge('frog'), 'เปียก/เจาะเกราะ 2');
  assert.equal(getCardCapabilityBadge('spider'), 'สวนติดหนาว 3');
  assert.equal(getCardCapabilityBadge('rat'), 'ทุบ 1/ตัดฮีล 50%');
  assert.equal(getCardCapabilityBadge('wolf'), 'เผา 4/ลดแรงโจมตี');
  assert.equal(getCardCapabilityBadge('bear'), 'เกราะ 1/ผลัก/ทุบ 2');
  assert.equal(getCardCapabilityBadge('eagle'), 'ข้ามม่าน/กระจาย 35%');
  assert.equal(getCardCapabilityBadge('boar'), 'สวนเจาะ 4/ข้ามเกราะ');
  assert.equal(getCardCapabilityBadge('croc'), 'เกราะ 1/เปียก ×1.5');
});

test('Dynamic stats scale accurately from +0 through +10 for cards 61-80', () => {
  // grand: attackBonus lv*2, selfBonus lv*3
  assert.equal(getCardDynamicStats('grand', 0).attackBonus, 0);
  assert.equal(getCardDynamicStats('grand', 5).attackBonus, 10);
  assert.equal(getCardDynamicStats('grand', 10).attackBonus, 20);
  assert.equal(getCardDynamicStats('grand', 0).selfBonus, 0);
  assert.equal(getCardDynamicStats('grand', 5).selfBonus, 15);
  assert.equal(getCardDynamicStats('grand', 10).selfBonus, 30);

  // seal: phraseBonus lv*2
  assert.equal(getCardDynamicStats('seal', 0).phraseBonus, 0);
  assert.equal(getCardDynamicStats('seal', 5).phraseBonus, 10);
  assert.equal(getCardDynamicStats('seal', 10).phraseBonus, 20);

  // dispel: phraseBonus lv*2
  assert.equal(getCardDynamicStats('dispel', 0).phraseBonus, 0);
  assert.equal(getCardDynamicStats('dispel', 5).phraseBonus, 10);
  assert.equal(getCardDynamicStats('dispel', 10).phraseBonus, 20);

  // brace: capacity 6 + lv*2, braceBonus 6 + lv*2
  assert.equal(getCardDynamicStats('brace', 0).capacity, 6);
  assert.equal(getCardDynamicStats('brace', 5).capacity, 16);
  assert.equal(getCardDynamicStats('brace', 10).capacity, 26);
  assert.equal(getCardDynamicStats('brace', 0).braceBonus, 6);
  assert.equal(getCardDynamicStats('brace', 5).braceBonus, 16);
  assert.equal(getCardDynamicStats('brace', 10).braceBonus, 26);

  // summon: globalHpBonus lv*2, globalDmgPct lv*2
  assert.equal(getCardDynamicStats('summon', 0).globalHpBonus, 0);
  assert.equal(getCardDynamicStats('summon', 5).globalHpBonus, 10);
  assert.equal(getCardDynamicStats('summon', 10).globalHpBonus, 20);
  assert.equal(getCardDynamicStats('summon', 0).globalDmgPct, 0);
  assert.equal(getCardDynamicStats('summon', 5).globalDmgPct, 10);
  assert.equal(getCardDynamicStats('summon', 10).globalDmgPct, 20);

  // dog: baseHp 14 (growth 1.5), baseCounter 4 (growth 1.0), baseStrike 12 (growth 1.0)
  assert.equal(getCardDynamicStats('dog', 0).hp, 14);
  assert.equal(getCardDynamicStats('dog', 5).hp, 22); // 14 + round(7.5) = 22
  assert.equal(getCardDynamicStats('dog', 10).hp, 29); // 14 + 15 = 29
  assert.equal(getCardDynamicStats('dog', 0).counter, 4);
  assert.equal(getCardDynamicStats('dog', 5).counter, 9);
  assert.equal(getCardDynamicStats('dog', 10).counter, 14);
  assert.equal(getCardDynamicStats('dog', 0).strike, 12);
  assert.equal(getCardDynamicStats('dog', 5).strike, 17);
  assert.equal(getCardDynamicStats('dog', 10).strike, 22);

  // turtle: baseHp 20 (growth 2.2), armor 1, baseCounter 3 (growth 0.7), baseStrike 8 (growth 0.7)
  assert.equal(getCardDynamicStats('turtle', 0).hp, 20);
  assert.equal(getCardDynamicStats('turtle', 5).hp, 31); // 20 + round(11.0) = 31
  assert.equal(getCardDynamicStats('turtle', 10).hp, 42); // 20 + 22 = 42
  assert.equal(getCardDynamicStats('turtle', 0).armor, 1);
  assert.equal(getCardDynamicStats('turtle', 0).counter, 3);
  assert.equal(getCardDynamicStats('turtle', 5).counter, 7); // 3 + round(3.5) = 7
  assert.equal(getCardDynamicStats('turtle', 10).counter, 10); // 3 + 7 = 10
  assert.equal(getCardDynamicStats('turtle', 0).strike, 8);
  assert.equal(getCardDynamicStats('turtle', 5).strike, 12); // 8 + round(3.5) = 12
  assert.equal(getCardDynamicStats('turtle', 10).strike, 15); // 8 + 7 = 15

  // wolf: baseHp 24 (growth 2.2), baseCounter 8 (growth 1.4), baseStrike 20 (growth 1.4)
  assert.equal(getCardDynamicStats('wolf', 0).hp, 24);
  assert.equal(getCardDynamicStats('wolf', 5).hp, 35); // 24 + round(11.0) = 35
  assert.equal(getCardDynamicStats('wolf', 10).hp, 46); // 24 + 22 = 46
  assert.equal(getCardDynamicStats('wolf', 0).counter, 8);
  assert.equal(getCardDynamicStats('wolf', 5).counter, 15); // 8 + round(7.0) = 15
  assert.equal(getCardDynamicStats('wolf', 10).counter, 22); // 8 + 14 = 22
  assert.equal(getCardDynamicStats('wolf', 0).strike, 20);
  assert.equal(getCardDynamicStats('wolf', 5).strike, 27); // 20 + round(7.0) = 27
  assert.equal(getCardDynamicStats('wolf', 10).strike, 34); // 20 + 14 = 34

  // croc: baseHp 26 (growth 2.4), armor 1, baseCounter 8 (growth 1.6), baseStrike 22 (growth 1.6)
  assert.equal(getCardDynamicStats('croc', 0).hp, 26);
  assert.equal(getCardDynamicStats('croc', 5).hp, 38); // 26 + round(12.0) = 38
  assert.equal(getCardDynamicStats('croc', 10).hp, 50); // 26 + 24 = 50
  assert.equal(getCardDynamicStats('croc', 0).armor, 1);
  assert.equal(getCardDynamicStats('croc', 0).counter, 8);
  assert.equal(getCardDynamicStats('croc', 5).counter, 16); // 8 + round(8.0) = 16
  assert.equal(getCardDynamicStats('croc', 10).counter, 24); // 8 + 16 = 24
  assert.equal(getCardDynamicStats('croc', 0).strike, 22);
  assert.equal(getCardDynamicStats('croc', 5).strike, 30); // 22 + round(8.0) = 30
  assert.equal(getCardDynamicStats('croc', 10).strike, 38); // 22 + 16 = 38
});

test('Upgrade comparison formatting matches requirements for cards 61-80', () => {
  const compGrand0 = getCardUpgradeComparison('grand', 0);
  assert.match(compGrand0, /\+0 → \+2/);
  assert.match(compGrand0, /\+0 → \+3/);

  const compSeal0 = getCardUpgradeComparison('seal', 0);
  assert.match(compSeal0, /\+0 → \+2/);

  const compDispel0 = getCardUpgradeComparison('dispel', 0);
  assert.match(compDispel0, /\+0 → \+2/);

  const compBrace0 = getCardUpgradeComparison('brace', 0);
  assert.match(compBrace0, /6 → 8/);

  const compSummon0 = getCardUpgradeComparison('summon', 0);
  assert.match(compSummon0, /\+0 → \+2/);
  assert.match(compSummon0, /\+0% → \+2%/);

  const compDog0 = getCardUpgradeComparison('dog', 0);
  assert.match(compDog0, /14 → 16/);
  assert.match(compDog0, /4 → 5/);
  assert.match(compDog0, /12 → 13/);

  const compTurtle0 = getCardUpgradeComparison('turtle', 0);
  assert.match(compTurtle0, /20 → 22/);
  assert.match(compTurtle0, /3 → 4/);
  assert.match(compTurtle0, /8 → 9/);

  const compWolf0 = getCardUpgradeComparison('wolf', 0);
  assert.match(compWolf0, /24 → 26/);
  assert.match(compWolf0, /8 → 9/);
  assert.match(compWolf0, /20 → 21/);

  const compCroc0 = getCardUpgradeComparison('croc', 0);
  assert.match(compCroc0, /26 → 28/);
  assert.match(compCroc0, /8 → 10/);
  assert.match(compCroc0, /22 → 24/);
});

test('Card details structure provides cost, target, duration, condition and stats for 61-80', () => {
  for (const id of CARDS_61_TO_80) {
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

  // Check specific semantic tags
  const dGrand = getCardDetails('grand', 0);
  assert.equal(dGrand.target, 'ตามคาถาหลักที่เสริม');
  assert.equal(dGrand.cost, '+3 มานา (โจมตี) / ตามคาถาหลัก');

  const dSeal = getCardDetails('seal', 0);
  assert.equal(dSeal.cost, '+2 มานา');
  assert.equal(dSeal.condition, 'ต่อท้ายลูกธาตุ (+2 มานา)');

  const dDispel = getCardDetails('dispel', 0);
  assert.equal(dDispel.cost, '+2 มานา');
  assert.equal(dDispel.condition, 'ต่อท้ายลูกธาตุ (+2 มานา)');

  const dBrace = getCardDetails('brace', 0);
  assert.equal(dBrace.cost, '4 มานา');
  assert.equal(dBrace.target, 'ผู้ร่าย (ตัวเอง)');
  assert.equal(dBrace.condition, 'ต่อท้าย “โล่” เท่านั้น (รวม 4 มานา)');

  const dSummon = getCardDetails('summon', 0);
  assert.equal(dSummon.cost, '3 มานา + ค่าสัตว์ + ค่าธาตุ');
  assert.equal(dSummon.target, 'แนวหน้าฝั่งผู้เล่น (รับดาเมจแทน)');
  assert.equal(dSummon.duration, 'อยู่ 2 เทิร์น');

  const dDog = getCardDetails('dog', 0);
  assert.equal(dDog.cost, '1 มานา');
  assert.equal(dDog.target, 'แนวหน้าฝั่งผู้เล่น (รับดาเมจแทน)');
  assert.equal(dDog.duration, 'อยู่ 2 เทิร์น');
  assert.equal(dDog.condition, 'ใช้ต่อหลัง “อัญเชิญ” เท่านั้น');

  const dWolf = getCardDetails('wolf', 0);
  assert.equal(dWolf.cost, '2 มานา');
  assert.equal(dWolf.target, 'แนวหน้าฝั่งผู้เล่น (รับดาเมจแทน)');
});

test('Grand, Seal, Dispel, Brace, and Summon combat parity', () => {
  // 1. Seal: inflicts sealed status on target
  const stateSeal = createRun('test-seal');
  stateSeal.phase = 'battle';
  stateSeal.player.words = ['shot', 'fire', 'seal'];
  stateSeal.player.hand = ['shot', 'fire', 'seal'];
  stateSeal.player.mana = 10;
  const enemySeal = createEnemy('striker', 0);
  stateSeal.enemies = [enemySeal];

  const resSeal = simulateTurn(stateSeal, ['shot', 'fire', 'seal'], enemySeal.id);
  const sealedEnemy = resSeal.state.enemies.find(e => e.id === enemySeal.id);
  assert.equal(sealedEnemy.sealed, true, 'Enemy should have sealed status set to true');
  const sealEv = resSeal.events.find(e => e.type === 'seal');
  assert.ok(sealEv, 'Seal event should be emitted');

  // 2. Dispel: strips ward before attack lands
  const stateDispel = createRun('test-dispel');
  stateDispel.phase = 'battle';
  stateDispel.player.words = ['shot', 'fire', 'dispel'];
  stateDispel.player.hand = ['shot', 'fire', 'dispel'];
  stateDispel.player.mana = 10;
  const enemyDispel = createEnemy('warden', 0);
  stateDispel.enemies = [enemyDispel];
  assert.ok(enemyDispel.ward > 0, 'Warden should start with ward > 0');

  const resDispel = simulateTurn(stateDispel, ['shot', 'fire', 'dispel'], enemyDispel.id);
  const dispelEv = resDispel.events.find(e => e.type === 'dispel');
  assert.ok(dispelEv, 'Dispel event should be emitted');
  assert.equal(dispelEv.amount, 1, 'Dispel should strip 1 ward layer');
  assert.equal(resDispel.summary.wards, 1, 'Summary should record 1 ward stripped');
  const proj = resDispel.events.find(e => e.type === 'projectile');
  assert.equal(proj.blocked, false, 'Projectile should not be blocked since ward was dispelled');

  // 3. Brace: creates brace shield layer, capacity 6 (+0)
  const stateBrace = createRun('test-brace');
  stateBrace.phase = 'battle';
  stateBrace.player.words = ['shield', 'brace'];
  stateBrace.player.hand = ['shield', 'brace'];
  stateBrace.player.mana = 10;
  const enemyBrace = createEnemy('striker', 0);
  stateBrace.enemies = [enemyBrace];

  const resBrace = simulateTurn(stateBrace, ['shield', 'brace'], enemyBrace.id);
  assert.equal(resBrace.state.player.shield.effect, 'brace', 'Shield effect should be brace');

  // 4. Summon + Dog: creates active summon unit on front line
  const stateSummon = createRun('test-summon');
  stateSummon.phase = 'battle';
  stateSummon.player.words = ['summon', 'dog', 'fire'];
  stateSummon.player.hand = ['summon', 'dog', 'fire'];
  stateSummon.player.mana = 10;
  const enemySummon = createEnemy('striker', 0);
  stateSummon.enemies = [enemySummon];

  const resSummon = simulateTurn(stateSummon, ['summon', 'dog', 'fire'], enemySummon.id);
  assert.ok(resSummon.state.player.summon, 'Active summon should exist on player after invocation');
  assert.equal(resSummon.state.player.summon.creatureId, 'dog', 'Active summon creature should be dog');
  assert.equal(resSummon.state.player.summon.element, 'fire', 'Active summon element should be fire');
  assert.ok(resSummon.state.player.summon.hp > 0, 'Active summon should have HP');

  // 5. Summon + Turtle: grants immediate shield to player upon summon
  const stateTurtle = createRun('test-turtle');
  stateTurtle.phase = 'battle';
  stateTurtle.player.words = ['summon', 'turtle', 'earth'];
  stateTurtle.player.hand = ['summon', 'turtle', 'earth'];
  stateTurtle.player.mana = 10;
  const enemyTurtle = createEnemy('striker', 0);
  stateTurtle.enemies = [enemyTurtle];

  const resTurtle = simulateTurn(stateTurtle, ['summon', 'turtle', 'earth'], enemyTurtle.id);
  assert.ok(resTurtle.state.player.shield, 'Player should receive shield from turtle summon');
  assert.equal(resTurtle.state.player.summon.creatureId, 'turtle');
  assert.equal(resTurtle.state.player.summon.armor, 1, 'Turtle should have 1 armor');
});

test('Playing card face renders capability badge and info trigger for cards 61-80', () => {
  const state = createRun('test-render-61-80');
  state.player.words = [...CARDS_61_TO_80];

  for (const id of CARDS_61_TO_80) {
    const html = playingCardFace(state, id);
    assert.ok(html.includes('class="card-cap-badge"'), `Card ${id} should render capability badge`);
    assert.ok(html.includes(`data-card-detail="${id}"`), `Card ${id} should render info trigger with data-card-detail`);
    assert.ok(html.includes(getCardCapabilityBadge(id)), `Card ${id} should render badge text`);
  }
});

test('Card descriptions and formulas at all levels have no undefined, null, or NaN for 61-80', () => {
  for (const id of CARDS_61_TO_80) {
    for (let lv = 0; lv <= 10; lv++) {
      const desc = getCardDescription(id, lv);
      const formula = getCardFormula(id, lv);
      const comp = getCardUpgradeComparison(id, lv);
      const details = getCardDetails(id, lv);

      for (const str of [desc, formula, comp, details.cost, details.target, details.duration, details.condition]) {
        assert.ok(!str.includes('undefined'), `${id} at lv ${lv} contains undefined: ${str}`);
        assert.ok(!str.includes('null'), `${id} at lv ${lv} contains null: ${str}`);
        assert.ok(!str.includes('NaN'), `${id} at lv ${lv} contains NaN: ${str}`);
      }
    }
  }
});
