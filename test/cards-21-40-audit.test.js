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
  ascensionCost,
} from '../src/words.js';
import {
  createRun,
  createEnemy,
  MAX_CARD_UPGRADE,
} from '../src/run.js';
import { simulateTurn } from '../src/combat.js';
import { playingCardFace } from '../src/ui/dom.js';

const CARDS_21_TO_40 = [
  'permafrost', 'magnet', 'mist', 'hail', 'monsoon',
  'shockstream', 'thunderstorm', 'heatwave', 'chillgale', 'plasma',
  'scald', 'frostvolt', 'pair', 'barrage', 'blast',
  'devastation', 'blackhole', 'death', 'timestop', 'ascension',
];

test('Cards 21-40 in WORDS order exist with labels and glyphs', () => {
  const keys = Object.keys(WORDS).slice(20, 40);
  assert.deepEqual(keys, CARDS_21_TO_40);
  for (const id of CARDS_21_TO_40) {
    assert.ok(WORDS[id].label, `${id} must have label`);
    assert.ok(WORDS[id].glyph, `${id} must have glyph`);
    assert.ok(WORDS[id].description, `${id} must have description`);
    assert.ok(WORDS[id].formula, `${id} must have formula`);
  }
});

test('Capability badges are concise and accurate for cards 21-40', () => {
  const expected = {
    permafrost: 'ทุบ 2/เกราะ 6',
    magnet: 'เจาะ 2/ดูดชน 6',
    mist: 'เปียก/ลดโจมตี 4',
    hail: 'แช่แข็งเปียก/หนาว 2',
    monsoon: 'ผลักหมู่/เปียก/ฮีล 4',
    shockstream: 'เจาะ 2/ช็อตเปียก 10',
    thunderstorm: 'เจาะ 2/ผลัก/ชิ่ง 50%',
    heatwave: 'ผลัก/เผาข้างเคียง 4',
    chillgale: 'ผลัก/หนาว 4 (2 ครั้ง)',
    plasma: 'ดาเมจ 24/เจาะ 2',
    scald: 'ทุบเกราะ 2/ชะงัก',
    frostvolt: 'เจาะ 2/ชิ่ง 50%/หนาว 4',
    pair: 'ร่าย 2 ครั้ง/คู่ธาตุ',
    barrage: 'ยิง 5 ครั้ง/ร่าย ×3.5',
    blast: 'กระจายข้าง 50%',
    devastation: 'พลัง ×2/รัศมี 2 ช่อง',
    blackhole: 'ดูด 100/ยุบ 300',
    death: 'ปลิดชีพ/บอส 100 แท้',
    timestop: 'ข้ามรอบศัตรู 1 รอบ',
    ascension: 'จุติ +10/ร่ายฟรี',
  };
  for (const id of CARDS_21_TO_40) {
    const badge = getCardCapabilityBadge(id);
    assert.equal(badge, expected[id], `Badge mismatch for ${id}`);
    assert.ok(badge.length <= 25, `Badge for ${id} is too long: ${badge}`);
  }
});

test('Dynamic stats scale accurately from +0 through +10 for cards 21-40', () => {
  // plasma: 24 at +0, 39 at +5, 54 at +10
  assert.equal(getCardDynamicStats('plasma', 0).damage, 24);
  assert.equal(getCardDynamicStats('plasma', 5).damage, 39);
  assert.equal(getCardDynamicStats('plasma', 10).damage, 54);

  // ascension: cost 8 at +0, 3 at +5, 1 at +7, 1 at +10
  assert.equal(getCardDynamicStats('ascension', 0).cost, 8);
  assert.equal(getCardDynamicStats('ascension', 5).cost, 3);
  assert.equal(getCardDynamicStats('ascension', 7).cost, 1);
  assert.equal(getCardDynamicStats('ascension', 10).cost, 1);

  // death: boss damage 100 at +0, 225 at +5, 350 at +10
  assert.equal(getCardDynamicStats('death', 0).bossDmg, 100);
  assert.equal(getCardDynamicStats('death', 5).bossDmg, 225);
  assert.equal(getCardDynamicStats('death', 10).bossDmg, 350);

  // blackhole: collapse 300 at +0, 375 at +5, 450 at +10; slam 100 at +0, 125 at +5
  assert.equal(getCardDynamicStats('blackhole', 0).collapsePower, 300);
  assert.equal(getCardDynamicStats('blackhole', 5).collapsePower, 375);
  assert.equal(getCardDynamicStats('blackhole', 10).collapsePower, 450);
  assert.equal(getCardDynamicStats('blackhole', 0).slamPower, 100);
  assert.equal(getCardDynamicStats('blackhole', 5).slamPower, 125);

  // blast: 6 at +0, 16 at +5, 26 at +10
  assert.equal(getCardDynamicStats('blast', 0).blastDmg, 6);
  assert.equal(getCardDynamicStats('blast', 5).blastDmg, 16);
  assert.equal(getCardDynamicStats('blast', 10).blastDmg, 26);

  // shockstream: shock 10 at +0, 20 at +5, 30 at +10
  assert.equal(getCardDynamicStats('shockstream', 0).shockDmg, 10);
  assert.equal(getCardDynamicStats('shockstream', 5).shockDmg, 20);
  assert.equal(getCardDynamicStats('shockstream', 10).shockDmg, 30);

  // monsoon: heal 4 at +0, 9 at +5; slam 6 at +0, 11 at +5
  assert.equal(getCardDynamicStats('monsoon', 0).heal, 4);
  assert.equal(getCardDynamicStats('monsoon', 5).heal, 9);
  assert.equal(getCardDynamicStats('monsoon', 0).slam, 6);
  assert.equal(getCardDynamicStats('monsoon', 5).slam, 11);

  // permafrost: damage 18, block 6 at +0; damage 28, block 16 at +5
  assert.equal(getCardDynamicStats('permafrost', 0).damage, 18);
  assert.equal(getCardDynamicStats('permafrost', 0).block, 6);
  assert.equal(getCardDynamicStats('permafrost', 5).damage, 28);
  assert.equal(getCardDynamicStats('permafrost', 5).block, 16);
});

test('Upgrade comparison formatting matches requirements for cards 21-40', () => {
  const compAsc0 = getCardUpgradeComparison('ascension', 0);
  assert.match(compAsc0, /8 → 7 มานา/);
  const compAsc5 = getCardUpgradeComparison('ascension', 5);
  assert.match(compAsc5, /3 → 2 มานา/);

  const compDeath0 = getCardUpgradeComparison('death', 0);
  assert.match(compDeath0, /100 → 125 แท้/);

  const compPlasma0 = getCardUpgradeComparison('plasma', 0);
  assert.match(compPlasma0, /24 → 27/);

  const compShock0 = getCardUpgradeComparison('shockstream', 0);
  assert.match(compShock0, /10 → 12/);

  const compDevast0 = getCardUpgradeComparison('devastation', 0);
  assert.match(compDevast0, /หลัก \+0 → \+2/);
  assert.match(compDevast0, /กระจาย \+0 → \+3/);
});

test('Card details structure provides cost, target, duration, condition and stats for 21-40', () => {
  for (const id of CARDS_21_TO_40) {
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

test('Hail, Death, Timestop, and Blackhole combat parity', () => {
  // 1. Hail: Dry target takes chill 2; Wet target gets frozen and wet is cleared
  const stateDry = createRun('test-hail-dry');
  stateDry.phase = 'battle';
  stateDry.player.words = ['shot', 'hail'];
  stateDry.player.hand = ['shot', 'hail'];
  stateDry.player.mana = 10;
  const enemyDry = createEnemy('striker', 0);
  enemyDry.hp = enemyDry.maxHp = 50;
  stateDry.enemies = [enemyDry];

  const resDry = simulateTurn(stateDry, ['shot', 'hail'], enemyDry.id);
  // Striker base attack 3 is reduced by 2 chill to 1:
  assert.equal(resDry.summary.enemyActions[enemyDry.id].amount, 1);

  // Wet target
  const stateWet = createRun('test-hail-wet');
  stateWet.phase = 'battle';
  stateWet.player.words = ['shot', 'hail'];
  stateWet.player.hand = ['shot', 'hail'];
  stateWet.player.mana = 10;
  const enemyWet = createEnemy('striker', 0);
  enemyWet.hp = enemyWet.maxHp = 50;
  enemyWet.wetUntil = 2;
  stateWet.enemies = [enemyWet];

  const resWet = simulateTurn(stateWet, ['shot', 'hail'], enemyWet.id);
  assert.ok(resWet.events.some(e => e.type === 'status' && e.status === 'freeze'));
  // Wet status consumed/cleared:
  assert.equal(resWet.state.enemies[0].wetUntil, undefined);

  // 2. Death: Non-boss is defeated immediately
  const stateDeath = createRun('test-death');
  stateDeath.phase = 'battle';
  stateDeath.player.words = ['death'];
  stateDeath.player.hand = ['death'];
  stateDeath.player.mana = 10;
  const targetMinion = createEnemy('striker', 0);
  targetMinion.hp = targetMinion.maxHp = 100;
  targetMinion.armor = 20;
  targetMinion.ward = 3;
  const secondMinion = createEnemy('warden', 1);
  stateDeath.enemies = [targetMinion, secondMinion];

  const resDeath = simulateTurn(stateDeath, ['death'], targetMinion.id);
  const deadEnemy = resDeath.state.enemies.find(e => e.id === targetMinion.id);
  assert.equal(deadEnemy.hp, 0, 'Minion should be instantly defeated by death');
  assert.ok(resDeath.events.some(e => e.type === 'damage' && e.target === targetMinion.id && e.killed));

  // 3. Timestop: Skips enemy action
  const stateTS = createRun('test-timestop');
  stateTS.phase = 'battle';
  stateTS.player.words = ['timestop'];
  stateTS.player.hand = ['timestop'];
  stateTS.player.mana = 10;
  stateTS.player.cardUpgrades = { timestop: 3 };
  const enemyTS = createEnemy('striker', 0);
  stateTS.enemies = [enemyTS];

  const resTS = simulateTurn(stateTS, ['timestop'], enemyTS.id);
  assert.equal(resTS.summary.enemyActions[enemyTS.id].type, 'timestop');
  assert.equal(resTS.summary.enemyActions[enemyTS.id].amount, 0);
});

test('Playing card face renders capability badge and info trigger for cards 21-40', () => {
  const state = createRun('test-face-21-40');
  state.player.cardUpgrades = { permafrost: 2, plasma: 5, blackhole: 10 };

  for (const id of CARDS_21_TO_40) {
    const html = playingCardFace(state, id);
    assert.ok(html.includes('class="card-cap-badge"'), `Card ${id} must contain cap badge`);
    assert.ok(html.includes(`data-card-detail="${id}"`), `Card ${id} must contain info trigger with data-card-detail`);
    assert.ok(html.includes(getCardCapabilityBadge(id)), `Card ${id} must render correct badge text`);
  }

  const plasmaHtml = playingCardFace(state, 'plasma');
  assert.ok(plasmaHtml.includes('+5'), 'Plasma should display +5');
});

test('Card descriptions and formulas at all levels have no undefined, null, or NaN for 21-40', () => {
  for (const id of CARDS_21_TO_40) {
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
