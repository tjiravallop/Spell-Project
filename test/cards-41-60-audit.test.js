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
} from '../src/words.js';
import {
  createRun,
  createEnemy,
  MAX_CARD_UPGRADE,
} from '../src/run.js';
import { simulateTurn } from '../src/combat.js';
import { playingCardFace } from '../src/ui/dom.js';

const CARDS_41_TO_60 = [
  'meteor', 'veil', 'shield', 'chakram', 'beam',
  'wave', 'storm', 'heal', 'self', 'empower',
  'bless', 'fill', 'blood', 'mana', 'burn',
  'freeze', 'push', 'pull', 'pierce', 'large',
];

test('Cards 41-60 in WORDS order exist with labels and glyphs', () => {
  const keys = Object.keys(WORDS).slice(40, 60);
  assert.deepEqual(keys, CARDS_41_TO_60);
  for (const id of CARDS_41_TO_60) {
    assert.ok(WORDS[id].label, `${id} must have label`);
    assert.ok(WORDS[id].glyph, `${id} must have glyph`);
    assert.ok(WORDS[id].description, `${id} must have description`);
    assert.ok(WORDS[id].formula, `${id} must have formula`);
  }
});

test('Capability badges are concise and accurate for cards 41-60', () => {
  const expected = {
    meteor: 'สุ่มตก 3 ครั้ง/ข้ามม่าน',
    veil: 'ม่าน 14/กันล้น 8',
    shield: 'โล่ 6/อยู่ 2 เทิร์น',
    chakram: 'เป้าเดี่ยว 180%',
    beam: 'ทะลุม่าน',
    wave: 'โจมตีหมู่ (ทุกตัว)',
    storm: 'กระจายข้าง 150%/75%',
    heal: 'ฟื้นฟู 4 HP',
    self: 'เป้าหมายผู้ร่าย',
    empower: 'บัฟธาตุ 3 เทิร์น',
    bless: 'บัฟแรง+เจาะ 1 (3 เทิร์น)',
    fill: 'เติมเลือด/มานา',
    blood: 'ฟื้นฟู 7 HP',
    mana: 'ฟื้นฟู 6 MP',
    burn: 'เผา 3 เทิร์นหน้า',
    freeze: 'ข้ามโจมตี 1 ครั้ง',
    push: 'ผลัก 1 ช่อง (ชน 8)',
    pull: 'ดึง 1 ช่อง (ชน 8)',
    pierce: 'เจาะเกราะ 2',
    large: 'พลัง ×1.5 / โล่/ฮีล +',
  };
  for (const id of CARDS_41_TO_60) {
    const badge = getCardCapabilityBadge(id);
    assert.equal(badge, expected[id], `Badge mismatch for ${id}`);
    assert.ok(badge.length <= 25, `Badge for ${id} is too long: ${badge}`);
  }
});

test('Dynamic stats scale accurately from +0 through +10 for cards 41-60', () => {
  // meteor: main 24/39/54, splash 12/22/32
  assert.equal(getCardDynamicStats('meteor', 0).mainDamage, 24);
  assert.equal(getCardDynamicStats('meteor', 5).mainDamage, 39);
  assert.equal(getCardDynamicStats('meteor', 10).mainDamage, 54);
  assert.equal(getCardDynamicStats('meteor', 0).splashDamage, 12);
  assert.equal(getCardDynamicStats('meteor', 5).splashDamage, 22);
  assert.equal(getCardDynamicStats('meteor', 10).splashDamage, 32);

  // veil: capacity 14/29/44, overflow 8/18/28
  assert.equal(getCardDynamicStats('veil', 0).capacity, 14);
  assert.equal(getCardDynamicStats('veil', 5).capacity, 29);
  assert.equal(getCardDynamicStats('veil', 10).capacity, 44);
  assert.equal(getCardDynamicStats('veil', 0).overflowGate, 8);
  assert.equal(getCardDynamicStats('veil', 5).overflowGate, 18);
  assert.equal(getCardDynamicStats('veil', 10).overflowGate, 28);

  // shield: capacity 6/16/26
  assert.equal(getCardDynamicStats('shield', 0).capacity, 6);
  assert.equal(getCardDynamicStats('shield', 5).capacity, 16);
  assert.equal(getCardDynamicStats('shield', 10).capacity, 26);

  // chakram: baseBonus 0/10/20
  assert.equal(getCardDynamicStats('chakram', 0).baseBonus, 0);
  assert.equal(getCardDynamicStats('chakram', 5).baseBonus, 10);
  assert.equal(getCardDynamicStats('chakram', 10).baseBonus, 20);

  // beam: damageBonus 0/5/10, pierce 0/1/3
  assert.equal(getCardDynamicStats('beam', 0).damageBonus, 0);
  assert.equal(getCardDynamicStats('beam', 5).damageBonus, 5);
  assert.equal(getCardDynamicStats('beam', 10).damageBonus, 10);
  assert.equal(getCardDynamicStats('beam', 0).pierce, 0);
  assert.equal(getCardDynamicStats('beam', 5).pierce, 1);
  assert.equal(getCardDynamicStats('beam', 10).pierce, 3);

  // wave: baseBonus 0/10/20
  assert.equal(getCardDynamicStats('wave', 0).baseBonus, 0);
  assert.equal(getCardDynamicStats('wave', 5).baseBonus, 10);
  assert.equal(getCardDynamicStats('wave', 10).baseBonus, 20);

  // storm: center 12/22/32, side 6/11/16, elementBonus 0/10/20
  assert.equal(getCardDynamicStats('storm', 0).standaloneCenter, 12);
  assert.equal(getCardDynamicStats('storm', 5).standaloneCenter, 22);
  assert.equal(getCardDynamicStats('storm', 10).standaloneCenter, 32);
  assert.equal(getCardDynamicStats('storm', 0).standaloneSide, 6);
  assert.equal(getCardDynamicStats('storm', 5).standaloneSide, 11);
  assert.equal(getCardDynamicStats('storm', 10).standaloneSide, 16);
  assert.equal(getCardDynamicStats('storm', 0).elementBonus, 0);
  assert.equal(getCardDynamicStats('storm', 5).elementBonus, 10);
  assert.equal(getCardDynamicStats('storm', 10).elementBonus, 20);

  // heal: baseHeal 4/14/24, maxHpPct 0/2/5
  assert.equal(getCardDynamicStats('heal', 0).baseHeal, 4);
  assert.equal(getCardDynamicStats('heal', 5).baseHeal, 14);
  assert.equal(getCardDynamicStats('heal', 10).baseHeal, 24);
  assert.equal(getCardDynamicStats('heal', 0).maxHpPct, 0);
  assert.equal(getCardDynamicStats('heal', 5).maxHpPct, 2);
  assert.equal(getCardDynamicStats('heal', 10).maxHpPct, 5);

  // self: extraHeal 0/10/20, extraShield 0/5/10
  assert.equal(getCardDynamicStats('self', 0).extraHeal, 0);
  assert.equal(getCardDynamicStats('self', 5).extraHeal, 10);
  assert.equal(getCardDynamicStats('self', 10).extraHeal, 20);
  assert.equal(getCardDynamicStats('self', 0).extraShield, 0);
  assert.equal(getCardDynamicStats('self', 5).extraShield, 5);
  assert.equal(getCardDynamicStats('self', 10).extraShield, 10);

  // empower: bonusPct 0/15/30, basePct 25/40/55
  assert.equal(getCardDynamicStats('empower', 0).bonusPct, 0);
  assert.equal(getCardDynamicStats('empower', 5).bonusPct, 15);
  assert.equal(getCardDynamicStats('empower', 10).bonusPct, 30);
  assert.equal(getCardDynamicStats('empower', 0).basePct, 25);
  assert.equal(getCardDynamicStats('empower', 5).basePct, 40);
  assert.equal(getCardDynamicStats('empower', 10).basePct, 55);

  // bless: bonusPct 0/20/40, basePct 40/60/80
  assert.equal(getCardDynamicStats('bless', 0).bonusPct, 0);
  assert.equal(getCardDynamicStats('bless', 5).bonusPct, 20);
  assert.equal(getCardDynamicStats('bless', 10).bonusPct, 40);
  assert.equal(getCardDynamicStats('bless', 0).basePct, 40);
  assert.equal(getCardDynamicStats('bless', 5).basePct, 60);
  assert.equal(getCardDynamicStats('bless', 10).basePct, 80);

  // fill: bloodHeal 7/12/17, manaGain 6/8/11
  assert.equal(getCardDynamicStats('fill', 0).bloodHeal, 7);
  assert.equal(getCardDynamicStats('fill', 5).bloodHeal, 12);
  assert.equal(getCardDynamicStats('fill', 10).bloodHeal, 17);
  assert.equal(getCardDynamicStats('fill', 0).manaGain, 6);
  assert.equal(getCardDynamicStats('fill', 5).manaGain, 8);
  assert.equal(getCardDynamicStats('fill', 10).manaGain, 11);

  // blood: heal 7/12/17, largeHeal 12/17/22
  assert.equal(getCardDynamicStats('blood', 0).heal, 7);
  assert.equal(getCardDynamicStats('blood', 5).heal, 12);
  assert.equal(getCardDynamicStats('blood', 10).heal, 17);
  assert.equal(getCardDynamicStats('blood', 0).largeHeal, 12);
  assert.equal(getCardDynamicStats('blood', 5).largeHeal, 17);
  assert.equal(getCardDynamicStats('blood', 10).largeHeal, 22);

  // mana: manaGain 6/9/11, largeManaGain 10/13/15
  assert.equal(getCardDynamicStats('mana', 0).manaGain, 6);
  assert.equal(getCardDynamicStats('mana', 5).manaGain, 9);
  assert.equal(getCardDynamicStats('mana', 10).manaGain, 11);
  assert.equal(getCardDynamicStats('mana', 0).largeManaGain, 10);
  assert.equal(getCardDynamicStats('mana', 5).largeManaGain, 13);
  assert.equal(getCardDynamicStats('mana', 10).largeManaGain, 15);

  // burn: burn 3/13/23
  assert.equal(getCardDynamicStats('burn', 0).burn, 3);
  assert.equal(getCardDynamicStats('burn', 5).burn, 13);
  assert.equal(getCardDynamicStats('burn', 10).burn, 23);

  // freeze: phraseBonus 0/10/20, chill 0/1/3
  assert.equal(getCardDynamicStats('freeze', 0).phraseBonus, 0);
  assert.equal(getCardDynamicStats('freeze', 5).phraseBonus, 10);
  assert.equal(getCardDynamicStats('freeze', 10).phraseBonus, 20);
  assert.equal(getCardDynamicStats('freeze', 0).chill, 0);
  assert.equal(getCardDynamicStats('freeze', 5).chill, 1);
  assert.equal(getCardDynamicStats('freeze', 10).chill, 3);

  // push: phraseBonus 0/5/10, slam 8/13/18
  assert.equal(getCardDynamicStats('push', 0).phraseBonus, 0);
  assert.equal(getCardDynamicStats('push', 5).phraseBonus, 5);
  assert.equal(getCardDynamicStats('push', 10).phraseBonus, 10);
  assert.equal(getCardDynamicStats('push', 0).slam, 8);
  assert.equal(getCardDynamicStats('push', 5).slam, 13);
  assert.equal(getCardDynamicStats('push', 10).slam, 18);

  // pull: phraseBonus 0/5/10, slam 8/13/18
  assert.equal(getCardDynamicStats('pull', 0).phraseBonus, 0);
  assert.equal(getCardDynamicStats('pull', 5).phraseBonus, 5);
  assert.equal(getCardDynamicStats('pull', 10).phraseBonus, 10);
  assert.equal(getCardDynamicStats('pull', 0).slam, 8);
  assert.equal(getCardDynamicStats('pull', 5).slam, 13);
  assert.equal(getCardDynamicStats('pull', 10).slam, 18);

  // pierce: phraseBonus 0/5/10, pierce 2/4/7
  assert.equal(getCardDynamicStats('pierce', 0).phraseBonus, 0);
  assert.equal(getCardDynamicStats('pierce', 5).phraseBonus, 5);
  assert.equal(getCardDynamicStats('pierce', 10).phraseBonus, 10);
  assert.equal(getCardDynamicStats('pierce', 0).pierce, 2);
  assert.equal(getCardDynamicStats('pierce', 5).pierce, 4);
  assert.equal(getCardDynamicStats('pierce', 10).pierce, 7);

  // large: attackBonus 0/5/10, shieldBonus 9/19/29, healBonus 8/18/28
  assert.equal(getCardDynamicStats('large', 0).attackBonus, 0);
  assert.equal(getCardDynamicStats('large', 5).attackBonus, 5);
  assert.equal(getCardDynamicStats('large', 10).attackBonus, 10);
  assert.equal(getCardDynamicStats('large', 0).shieldBonus, 9);
  assert.equal(getCardDynamicStats('large', 5).shieldBonus, 19);
  assert.equal(getCardDynamicStats('large', 10).shieldBonus, 29);
  assert.equal(getCardDynamicStats('large', 0).healBonus, 8);
  assert.equal(getCardDynamicStats('large', 5).healBonus, 18);
  assert.equal(getCardDynamicStats('large', 10).healBonus, 28);
});

test('Upgrade comparison formatting matches requirements for cards 41-60', () => {
  const compMeteor0 = getCardUpgradeComparison('meteor', 0);
  assert.match(compMeteor0, /24 → 27/);
  assert.match(compMeteor0, /12 → 14/);

  const compVeil0 = getCardUpgradeComparison('veil', 0);
  assert.match(compVeil0, /14 → 17/);
  assert.match(compVeil0, /8 → 10/);

  const compShield0 = getCardUpgradeComparison('shield', 0);
  assert.match(compShield0, /6 → 8/);

  const compChakram0 = getCardUpgradeComparison('chakram', 0);
  assert.match(compChakram0, /\+0 → \+2/);

  const compWave0 = getCardUpgradeComparison('wave', 0);
  assert.match(compWave0, /\+0 → \+2/);

  const compStorm0 = getCardUpgradeComparison('storm', 0);
  assert.match(compStorm0, /12\/6 → 14\/7/);

  const compHeal0 = getCardUpgradeComparison('heal', 0);
  assert.match(compHeal0, /4 → 6/);

  const compSelf0 = getCardUpgradeComparison('self', 0);
  assert.match(compSelf0, /\+0 → \+2/);
  assert.match(compSelf0, /\+0 → \+1/);

  const compEmpower0 = getCardUpgradeComparison('empower', 0);
  assert.match(compEmpower0, /\+25% → \+28%/);

  const compBless0 = getCardUpgradeComparison('bless', 0);
  assert.match(compBless0, /\+40% → \+44%/);

  const compFill0 = getCardUpgradeComparison('fill', 0);
  assert.match(compFill0, /7 → 8/);

  const compBlood0 = getCardUpgradeComparison('blood', 0);
  assert.match(compBlood0, /7 → 8/);

  const compMana0 = getCardUpgradeComparison('mana', 0);
  assert.match(compMana0, /\+6 → \+7/);

  const compBurn0 = getCardUpgradeComparison('burn', 0);
  assert.match(compBurn0, /3 → 5/);

  const compPush0 = getCardUpgradeComparison('push', 0);
  assert.match(compPush0, /8 → 9/);

  const compPull0 = getCardUpgradeComparison('pull', 0);
  assert.match(compPull0, /8 → 9/);

  const compPierce0 = getCardUpgradeComparison('pierce', 0);
  assert.match(compPierce0, /\+0 → \+1/);

  const compLarge0 = getCardUpgradeComparison('large', 0);
  assert.match(compLarge0, /\+0 → \+1/);
  assert.match(compLarge0, /9 → 11/);
  assert.match(compLarge0, /8 → 10/);
});

test('Card details structure provides cost, target, duration, condition and stats for 41-60', () => {
  for (const id of CARDS_41_TO_60) {
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

test('Beam, Veil, Shield, Heal, Fill, Blood, Mana, Meteor combat parity', () => {
  // 1. Beam penetrates enemy ward
  const stateBeam = createRun('test-beam');
  stateBeam.phase = 'battle';
  stateBeam.player.words = ['beam', 'fire'];
  stateBeam.player.hand = ['beam', 'fire'];
  stateBeam.player.mana = 10;
  const enemyWithWard = createEnemy('warden', 0);
  stateBeam.enemies = [enemyWithWard];

  const resBeam = simulateTurn(stateBeam, ['beam', 'fire'], enemyWithWard.id);
  // Beam fire deals 10 damage directly to HP without getting blocked by ward
  const proj = resBeam.events.find(e => e.type === 'projectile');
  assert.equal(proj.blocked, false, 'Beam projectile should not be blocked by ward');
  assert.equal(resBeam.summary.wards, 0, 'No ward should absorb the beam');

  // 2. Veil absorbs damage with overflow gate
  const stateVeil = createRun('test-veil');
  stateVeil.phase = 'battle';
  stateVeil.player.words = ['veil'];
  stateVeil.player.hand = ['veil'];
  stateVeil.player.mana = 10;
  const enemyVeil = createEnemy('striker', 0);
  stateVeil.enemies = [enemyVeil];

  const resVeil = simulateTurn(stateVeil, ['veil'], enemyVeil.id);
  const shieldEv = resVeil.events.find(e => e.type === 'shield' && e.shieldKind === 'veil');
  assert.ok(shieldEv, 'Veil should generate a shield event of kind veil');
  assert.equal(shieldEv.amount, 14, 'Veil shield base amount should be 14');
  assert.equal(resVeil.state.player.shield.effect, 'veil', 'Player shield effect should be veil');

  // 3. Heal + Self
  const stateHeal = createRun('test-heal');
  stateHeal.phase = 'battle';
  stateHeal.player.words = ['heal', 'self'];
  stateHeal.player.hand = ['heal', 'self'];
  stateHeal.player.hp = 20;
  stateHeal.player.maxHp = 36;
  stateHeal.player.mana = 10;
  const enemyHeal = createEnemy('striker', 0);
  stateHeal.enemies = [enemyHeal];

  const resHeal = simulateTurn(stateHeal, ['heal', 'self'], enemyHeal.id);
  assert.equal(resHeal.summary.healed, 4, 'Heal self should restore 4 HP at +0');

  // 4. Fill + Blood
  const stateBlood = createRun('test-blood');
  stateBlood.phase = 'battle';
  stateBlood.player.words = ['fill', 'blood'];
  stateBlood.player.hand = ['fill', 'blood'];
  stateBlood.player.hp = 20;
  stateBlood.player.maxHp = 36;
  stateBlood.player.mana = 10;
  const enemyBlood = createEnemy('striker', 0);
  stateBlood.enemies = [enemyBlood];

  const resBlood = simulateTurn(stateBlood, ['fill', 'blood'], enemyBlood.id);
  assert.equal(resBlood.summary.healed, 7, 'Fill blood should restore 7 HP at +0');

  // 5. Fill + Mana
  const stateMana = createRun('test-mana');
  stateMana.phase = 'battle';
  stateMana.player.words = ['fill', 'mana'];
  stateMana.player.hand = ['fill', 'mana'];
  stateMana.player.mana = 2;
  stateMana.player.maxMana = 15;
  const enemyMana = createEnemy('striker', 0);
  stateMana.enemies = [enemyMana];

  const resMana = simulateTurn(stateMana, ['fill', 'mana'], enemyMana.id);
  assert.equal(resMana.summary.manaRestored, 6, 'Fill mana should restore 6 MP');

  // 6. Meteor bypasses ward
  const stateMeteor = createRun('test-meteor');
  stateMeteor.phase = 'battle';
  stateMeteor.player.words = ['meteor'];
  stateMeteor.player.hand = ['meteor'];
  stateMeteor.player.mana = 15;
  const enemyMeteor1 = createEnemy('warden', 0);
  const enemyMeteor2 = createEnemy('warden', 1);
  stateMeteor.enemies = [enemyMeteor1, enemyMeteor2];

  const resMeteor = simulateTurn(stateMeteor, ['meteor'], enemyMeteor1.id);
  assert.equal(resMeteor.summary.wards, 0, 'No ward should block meteor');
  assert.ok(resMeteor.events.some(e => e.type === 'damage'), 'Meteor drops damage enemies');
});

test('Playing card face renders capability badge and info trigger for cards 41-60', () => {
  const state = createRun('test-face-41-60');
  state.player.cardUpgrades = { meteor: 2, veil: 5, large: 10 };

  for (const id of CARDS_41_TO_60) {
    const html = playingCardFace(state, id);
    assert.ok(html.includes('class="card-cap-badge"'), `Card ${id} must contain cap badge`);
    assert.ok(html.includes(`data-card-detail="${id}"`), `Card ${id} must contain info trigger with data-card-detail`);
    assert.ok(html.includes(getCardCapabilityBadge(id)), `Card ${id} must render correct badge text`);
  }

  const meteorHtml = playingCardFace(state, 'meteor');
  assert.ok(meteorHtml.includes('+2'), 'Meteor should display +2');
  const veilHtml = playingCardFace(state, 'veil');
  assert.ok(veilHtml.includes('+5'), 'Veil should display +5');
});

test('Card descriptions and formulas at all levels have no undefined, null, or NaN for 41-60', () => {
  for (const id of CARDS_41_TO_60) {
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
