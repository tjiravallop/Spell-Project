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
} from '../src/run.js';
import { simulateTurn } from '../src/combat.js';
import { playingCardFace } from '../src/ui/dom.js';

const CARDS_81_TO_92 = [
  'skeleton', 'hornet', 'golem', 'lion',
  'siren', 'gargoyle', 'sprite', 'hydra',
  'behemoth', 'kraken', 'dragon', 'phoenix'
];

test('Cards 81-92 in WORDS order exist with labels and glyphs', () => {
  const allWordKeys = Object.keys(WORDS);
  assert.equal(allWordKeys.length, 92, 'Total words in WORDS must be exactly 92');
  const slice81To92 = allWordKeys.slice(80, 92);
  assert.deepEqual(slice81To92, CARDS_81_TO_92, 'Words 81 to 92 must match the final sequence in WORDS');

  for (const id of CARDS_81_TO_92) {
    const word = WORDS[id];
    assert.ok(word, `Word ${id} must exist in WORDS`);
    assert.ok(word.label, `Word ${id} must have a label`);
    assert.ok(word.glyph, `Word ${id} must have a glyph`);
    assert.ok(word.description, `Word ${id} must have a description`);
    assert.ok(word.formula, `Word ${id} must have a formula`);
  }
});

test('Capability badges are concise and accurate for cards 81-92', () => {
  for (const id of CARDS_81_TO_92) {
    const badge = getCardCapabilityBadge(id);
    assert.ok(badge, `Badge for ${id} should exist`);
    assert.ok(badge.length <= 25, `Badge for ${id} (${badge}) should be <= 25 chars for mobile layout, was ${badge.length}`);
  }

  assert.equal(getCardCapabilityBadge('skeleton'), 'เจาะ 3/แตกยิง 14');
  assert.equal(getCardCapabilityBadge('hornet'), 'ต่อพิษ 6/ข้ามเกราะ');
  assert.equal(getCardCapabilityBadge('golem'), 'เกราะ 2/ทุบ 2/สตั๊น');
  assert.equal(getCardCapabilityBadge('lion'), 'แผงคอลด 3/คริ ×1.5');
  assert.equal(getCardCapabilityBadge('siren'), 'ม่าน 1/เปียก/สลายม่าน');
  assert.equal(getCardCapabilityBadge('gargoyle'), 'เกราะ 3/สกัด AoE');
  assert.equal(getCardCapabilityBadge('sprite'), 'คืน 2 MP/จั่ว/ฮีล 12');
  assert.equal(getCardCapabilityBadge('hydra'), 'ฟื้น 6 HP/ตีช่องติด');
  assert.equal(getCardCapabilityBadge('behemoth'), 'เกราะ 4/สกัด AoE/ทุบหมู่');
  assert.equal(getCardCapabilityBadge('kraken'), 'หนาว 6/สลายม่าน');
  assert.equal(getCardCapabilityBadge('dragon'), 'เกราะ 3/ม่าน 1/ข้ามม่าน');
  assert.equal(getCardCapabilityBadge('phoenix'), 'ม่าน 2/ชุบชีวิตเต็ม');
});

test('Dynamic stats scale accurately from +0 through +10 for cards 81-92', () => {
  // skeleton: baseHp 20 (growth 2.0), baseCounter 6 (growth 1.7), baseStrike 18 (growth 1.7)
  assert.equal(getCardDynamicStats('skeleton', 0).hp, 20);
  assert.equal(getCardDynamicStats('skeleton', 5).hp, 30);
  assert.equal(getCardDynamicStats('skeleton', 10).hp, 40);
  assert.equal(getCardDynamicStats('skeleton', 0).counter, 6);
  assert.equal(getCardDynamicStats('skeleton', 5).counter, 15); // 6 + round(8.5) = 15
  assert.equal(getCardDynamicStats('skeleton', 10).counter, 23); // 6 + 17 = 23
  assert.equal(getCardDynamicStats('skeleton', 0).strike, 18);
  assert.equal(getCardDynamicStats('skeleton', 5).strike, 27); // 18 + round(8.5) = 27
  assert.equal(getCardDynamicStats('skeleton', 10).strike, 35); // 18 + 17 = 35

  // golem: baseHp 30 (growth 3.0), armor 2, baseCounter 10 (growth 1.8), baseStrike 26 (growth 1.8)
  assert.equal(getCardDynamicStats('golem', 0).hp, 30);
  assert.equal(getCardDynamicStats('golem', 5).hp, 45);
  assert.equal(getCardDynamicStats('golem', 10).hp, 60);
  assert.equal(getCardDynamicStats('golem', 0).armor, 2);
  assert.equal(getCardDynamicStats('golem', 0).counter, 10);
  assert.equal(getCardDynamicStats('golem', 5).counter, 19); // 10 + 9 = 19
  assert.equal(getCardDynamicStats('golem', 10).counter, 28); // 10 + 18 = 28
  assert.equal(getCardDynamicStats('golem', 0).strike, 26);
  assert.equal(getCardDynamicStats('golem', 5).strike, 35);
  assert.equal(getCardDynamicStats('golem', 10).strike, 44);

  // siren: baseHp 24 (growth 2.2), ward 1, baseCounter 8 (growth 1.6), baseStrike 22 (growth 1.6)
  assert.equal(getCardDynamicStats('siren', 0).hp, 24);
  assert.equal(getCardDynamicStats('siren', 5).hp, 35);
  assert.equal(getCardDynamicStats('siren', 10).hp, 46);
  assert.equal(getCardDynamicStats('siren', 0).ward, 1);
  assert.equal(getCardDynamicStats('siren', 0).counter, 8);
  assert.equal(getCardDynamicStats('siren', 5).counter, 16);
  assert.equal(getCardDynamicStats('siren', 10).counter, 24);
  assert.equal(getCardDynamicStats('siren', 0).strike, 22);
  assert.equal(getCardDynamicStats('siren', 5).strike, 30);
  assert.equal(getCardDynamicStats('siren', 10).strike, 38);

  // gargoyle: baseHp 32 (growth 3.0), armor 3, baseCounter 10 (growth 1.9), baseStrike 24 (growth 1.9)
  assert.equal(getCardDynamicStats('gargoyle', 0).hp, 32);
  assert.equal(getCardDynamicStats('gargoyle', 5).hp, 47);
  assert.equal(getCardDynamicStats('gargoyle', 10).hp, 62);
  assert.equal(getCardDynamicStats('gargoyle', 0).armor, 3);
  assert.equal(getCardDynamicStats('gargoyle', 0).counter, 10);
  assert.equal(getCardDynamicStats('gargoyle', 5).counter, 20); // 10 + round(9.5) = 20
  assert.equal(getCardDynamicStats('gargoyle', 10).counter, 29); // 10 + 19 = 29
  assert.equal(getCardDynamicStats('gargoyle', 0).strike, 24);
  assert.equal(getCardDynamicStats('gargoyle', 5).strike, 34);
  assert.equal(getCardDynamicStats('gargoyle', 10).strike, 43);

  // behemoth: baseHp 55 (growth 5.0), armor 4, baseCounter 16 (growth 3.0), baseStrike 40 (growth 3.0)
  assert.equal(getCardDynamicStats('behemoth', 0).hp, 55);
  assert.equal(getCardDynamicStats('behemoth', 5).hp, 80);
  assert.equal(getCardDynamicStats('behemoth', 10).hp, 105);
  assert.equal(getCardDynamicStats('behemoth', 0).armor, 4);
  assert.equal(getCardDynamicStats('behemoth', 0).counter, 16);
  assert.equal(getCardDynamicStats('behemoth', 5).counter, 31);
  assert.equal(getCardDynamicStats('behemoth', 10).counter, 46);
  assert.equal(getCardDynamicStats('behemoth', 0).strike, 40);
  assert.equal(getCardDynamicStats('behemoth', 5).strike, 55);
  assert.equal(getCardDynamicStats('behemoth', 10).strike, 70);

  // dragon: baseHp 60 (growth 6.0), armor 3, ward 1, baseCounter 20 (growth 4.0), baseStrike 45 (growth 4.0)
  assert.equal(getCardDynamicStats('dragon', 0).hp, 60);
  assert.equal(getCardDynamicStats('dragon', 5).hp, 90);
  assert.equal(getCardDynamicStats('dragon', 10).hp, 120);
  assert.equal(getCardDynamicStats('dragon', 0).armor, 3);
  assert.equal(getCardDynamicStats('dragon', 0).ward, 1);
  assert.equal(getCardDynamicStats('dragon', 0).counter, 20);
  assert.equal(getCardDynamicStats('dragon', 5).counter, 40);
  assert.equal(getCardDynamicStats('dragon', 10).counter, 60);
  assert.equal(getCardDynamicStats('dragon', 0).strike, 45);
  assert.equal(getCardDynamicStats('dragon', 5).strike, 65);
  assert.equal(getCardDynamicStats('dragon', 10).strike, 85);

  // phoenix: baseHp 50 (growth 5.0), ward 2, baseCounter 18 (growth 3.5), baseStrike 42 (growth 3.5)
  assert.equal(getCardDynamicStats('phoenix', 0).hp, 50);
  assert.equal(getCardDynamicStats('phoenix', 5).hp, 75);
  assert.equal(getCardDynamicStats('phoenix', 10).hp, 100);
  assert.equal(getCardDynamicStats('phoenix', 0).ward, 2);
  assert.equal(getCardDynamicStats('phoenix', 0).counter, 18);
  assert.equal(getCardDynamicStats('phoenix', 5).counter, 36); // 18 + round(17.5) = 36
  assert.equal(getCardDynamicStats('phoenix', 10).counter, 53); // 18 + 35 = 53
  assert.equal(getCardDynamicStats('phoenix', 0).strike, 42);
  assert.equal(getCardDynamicStats('phoenix', 5).strike, 60);
  assert.equal(getCardDynamicStats('phoenix', 10).strike, 77);
});

test('Upgrade comparison formatting matches requirements for cards 81-92', () => {
  const compSkel0 = getCardUpgradeComparison('skeleton', 0);
  assert.match(compSkel0, /20 → 22/);
  assert.match(compSkel0, /6 → 8/);
  assert.match(compSkel0, /18 → 20/);

  const compGolem0 = getCardUpgradeComparison('golem', 0);
  assert.match(compGolem0, /30 → 33/);
  assert.match(compGolem0, /10 → 12/);
  assert.match(compGolem0, /26 → 28/);

  const compSiren0 = getCardUpgradeComparison('siren', 0);
  assert.match(compSiren0, /24 → 26/);
  assert.match(compSiren0, /8 → 10/);
  assert.match(compSiren0, /22 → 24/);

  const compGargoyle0 = getCardUpgradeComparison('gargoyle', 0);
  assert.match(compGargoyle0, /32 → 35/);
  assert.match(compGargoyle0, /10 → 12/);
  assert.match(compGargoyle0, /24 → 26/);

  const compSprite0 = getCardUpgradeComparison('sprite', 0);
  assert.match(compSprite0, /22 → 24/);
  assert.match(compSprite0, /6 → 8/);
  assert.match(compSprite0, /20 → 22/);

  const compHydra0 = getCardUpgradeComparison('hydra', 0);
  assert.match(compHydra0, /45 → 49/);
  assert.match(compHydra0, /14 → 17/);
  assert.match(compHydra0, /35 → 38/);

  const compBehemoth0 = getCardUpgradeComparison('behemoth', 0);
  assert.match(compBehemoth0, /55 → 60/);
  assert.match(compBehemoth0, /16 → 19/);
  assert.match(compBehemoth0, /40 → 43/);

  const compKraken0 = getCardUpgradeComparison('kraken', 0);
  assert.match(compKraken0, /50 → 55/);
  assert.match(compKraken0, /15 → 18/);
  assert.match(compKraken0, /38 → 41/);

  const compDragon0 = getCardUpgradeComparison('dragon', 0);
  assert.match(compDragon0, /60 → 66/);
  assert.match(compDragon0, /20 → 24/);
  assert.match(compDragon0, /45 → 49/);

  const compPhoenix0 = getCardUpgradeComparison('phoenix', 0);
  assert.match(compPhoenix0, /50 → 55/);
  assert.match(compPhoenix0, /18 → 22/);
  assert.match(compPhoenix0, /42 → 46/);
});

test('Card details structure provides cost, target, duration, condition and stats for 81-92', () => {
  for (const id of CARDS_81_TO_92) {
    const d = getCardDetails(id, 0);
    assert.equal(d.id, id);
    assert.ok(d.label);
    assert.ok(d.cost);
    assert.equal(d.target, 'แนวหน้าฝั่งผู้เล่น (รับดาเมจแทน)');
    assert.equal(d.duration, 'อยู่ 2 เทิร์น');
    assert.equal(d.condition, 'ใช้ต่อหลัง “อัญเชิญ” เท่านั้น');
    assert.ok(d.description);
    assert.ok(d.formula);
    assert.ok(d.stats);
  }

  assert.equal(getCardDetails('golem', 0).cost, '5 มานา');
  assert.equal(getCardDetails('dragon', 0).cost, '8 มานา');
  assert.equal(getCardDetails('phoenix', 0).cost, '9 มานา');
});

test('Special, Epic, and Legendary summon combat mechanics parity', () => {
  // 1. Sprite: refunds 2 MP and draws 1 card on summon
  const stateSprite = createRun('test-sprite');
  stateSprite.phase = 'battle';
  stateSprite.player.words = ['summon', 'sprite', 'water', 'shot'];
  stateSprite.player.deck = ['shot'];
  stateSprite.player.hand = ['summon', 'sprite', 'water'];
  stateSprite.player.mana = 10;
  const enemySprite = createEnemy('striker', 0);
  stateSprite.enemies = [enemySprite];

  const resSprite = simulateTurn(stateSprite, ['summon', 'sprite', 'water'], enemySprite.id);
  assert.ok(resSprite.events.some(e => e.type === 'mana-refund' && e.amount === 2), 'Sprite should refund 2 mana');
  assert.ok(resSprite.state.player.summon, 'Sprite summon should be active');
  assert.equal(resSprite.state.player.summon.creatureId, 'sprite');

  // 2. Siren: has base ward 1
  const stateSiren = createRun('test-siren');
  stateSiren.phase = 'battle';
  stateSiren.player.words = ['summon', 'siren', 'water'];
  stateSiren.player.hand = ['summon', 'siren', 'water'];
  stateSiren.player.mana = 10;
  const enemySiren = createEnemy('striker', 0);
  stateSiren.enemies = [enemySiren];

  const resSiren = simulateTurn(stateSiren, ['summon', 'siren', 'water'], enemySiren.id);
  const sirenInvoke = resSiren.events.find(e => e.type === 'summon_invoke');
  assert.ok(sirenInvoke, 'Siren invoke event should exist');
  assert.equal(sirenInvoke.ward, 1, 'Siren should be invoked with 1 ward');
  assert.ok(resSiren.state.player.summon, 'Siren should remain active on board');

  // 3. Dragon: has base armor 3 and ward 1
  const stateDragon = createRun('test-dragon');
  stateDragon.phase = 'battle';
  stateDragon.player.words = ['summon', 'dragon', 'fire'];
  stateDragon.player.hand = ['summon', 'dragon', 'fire'];
  stateDragon.player.mana = 20;
  const enemyDragon = createEnemy('striker', 0);
  stateDragon.enemies = [enemyDragon];

  const resDragon = simulateTurn(stateDragon, ['summon', 'dragon', 'fire'], enemyDragon.id);
  const dragonInvoke = resDragon.events.find(e => e.type === 'summon_invoke');
  assert.ok(dragonInvoke, 'Dragon invoke event should exist');
  assert.equal(dragonInvoke.armor, 3, 'Dragon should be invoked with 3 armor');
  assert.equal(dragonInvoke.ward, 1, 'Dragon should be invoked with 1 ward');

  // 4. Phoenix: has base ward 2 (after 1 enemy hit, 1 ward remains)
  const statePhoenix = createRun('test-phoenix');
  statePhoenix.phase = 'battle';
  statePhoenix.player.words = ['summon', 'phoenix', 'fire'];
  statePhoenix.player.hand = ['summon', 'phoenix', 'fire'];
  statePhoenix.player.mana = 20;
  const enemyPhoenix = createEnemy('striker', 0);
  statePhoenix.enemies = [enemyPhoenix];

  const resPhoenix = simulateTurn(statePhoenix, ['summon', 'phoenix', 'fire'], enemyPhoenix.id);
  const phoenixInvoke = resPhoenix.events.find(e => e.type === 'summon_invoke');
  assert.ok(phoenixInvoke, 'Phoenix invoke event should exist');
  assert.equal(phoenixInvoke.ward, 2, 'Phoenix should be invoked with 2 ward');
  assert.equal(resPhoenix.state.player.summon.ward, 1, 'Phoenix should have 1 ward remaining after absorbing 1 attack');
});

test('Playing card face renders capability badge and info trigger for cards 81-92', () => {
  const state = createRun('test-render-81-92');
  state.player.words = [...CARDS_81_TO_92];

  for (const id of CARDS_81_TO_92) {
    const html = playingCardFace(state, id);
    assert.ok(html.includes('class="card-cap-badge"'), `Card ${id} should render capability badge`);
    assert.ok(html.includes(`data-card-detail="${id}"`), `Card ${id} should render info trigger with data-card-detail`);
    assert.ok(html.includes(getCardCapabilityBadge(id)), `Card ${id} should render badge text`);
  }
});

test('Card descriptions and formulas at all levels have no undefined, null, or NaN for 81-92', () => {
  for (const id of CARDS_81_TO_92) {
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
