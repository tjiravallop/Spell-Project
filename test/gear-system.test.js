import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GEAR_SLOTS,
  GEAR_CATALOG,
  GEAR_LIST,
  MAX_GEAR_REFINE,
  getGearById,
  getGearListBySlot,
  getGearRefineCost,
  getGearRefineSuccessRate,
  getGearRefineMaterialId,
  getGearSellPrice,
  computeGearModifiers,
  getGearEquipmentSignature,
  summarizeActiveGearStats,
} from '../src/gear.js';
import {
  createRun,
  enterRoom,
  battleSpellCost,
  getMaxMana,
  getHandLimit,
  getSanctuaryGearStock,
  buyGearItem,
  equipGearItem,
  unequipGearItem,
  refineGearItem,
  sellGearItem,
  salvageGearItem,
  MAX_STASH_ITEMS,
} from '../src/run.js';
import { parseSpell } from '../src/words.js';
import { simulateTurn } from '../src/combat.js';
import { validateRun, saveRun, loadRun } from '../src/save.js';

function makeSanctuaryState(seed = 'gear-test', floor = 15, gold = 2000) {
  const state = createRun(seed, true);
  state.phase = 'sanctuary';
  state.sanctuaryUnlocked = true;
  state.sanctuaryFloor = floor;
  state.player.gold = gold;
  state.player.stash = [];
  state.player.items = [];
  return state;
}

function makeBattleState(seed = 'gear-combat', { words = ['shot', 'fire', 'bolt', 'ice', 'shield', 'pair', 'wind'], hand = null, mana = 20, enemies = null, turn = 1 } = {}) {
  const state = createRun(seed, true);
  state.phase = 'battle';
  state.turn = turn;
  state.player.mana = mana;
  state.player.words = words;
  state.player.hand = hand ?? [...words];
  state.player.shield = null;
  state.player.summon = null;
  state.player.gearInventory = [];
  state.player.equippedGear = { weapon: null, armor: null, accessory: null };
  state.enemies = enemies ?? [
    { id: 'e1', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
  ];
  return state;
}

function equipDirect(state, gearIds, refines = {}) {
  state.player.gearInventory = gearIds.map(id => ({ id, refine: refines[id] ?? 0 }));
  state.player.equippedGear = { weapon: null, armor: null, accessory: null };
  for (const id of gearIds) {
    const def = getGearById(id);
    assert.ok(def, `Gear ${id} must exist`);
    state.player.equippedGear[def.slot] = id;
  }
  const mods = computeGearModifiers(state.player);
  if (mods.maxHpBonus) {
    state.player.maxHp += mods.maxHpBonus;
    state.player.hp += mods.maxHpBonus;
  }
  return state;
}

function assertForecastParity(state, words, targetId = 'e1') {
  const forecast = simulateTurn(structuredClone(state), words, targetId);
  const actual = simulateTurn(structuredClone(state), words, targetId);
  assert.ok(forecast.ok, `Expected spell [${words.join(', ')}] to be valid, got: ${forecast.reason ?? 'unknown'}`);
  assert.equal(forecast.ok, actual.ok);
  assert.deepEqual(forecast.summary, actual.summary);
  assert.deepEqual(forecast.events, actual.events);
  assert.deepEqual(forecast.state.enemies, actual.state.enemies);
  assert.equal(forecast.state.player.hp, actual.state.player.hp);
  assert.equal(forecast.state.player.mana, actual.state.player.mana);
  assert.deepEqual(forecast.state.player.shield, actual.state.player.shield);
  assert.deepEqual(forecast.state.player.summon, actual.state.player.summon);
  return actual;
}

test('Gear Catalog: 120 items across 3 slots (40 each; 6 Common + 8 Rare + 10 Special + 10 Epic + 6 Legendary)', () => {
  assert.equal(GEAR_LIST.length, 120);
  assert.equal(Object.keys(GEAR_CATALOG).length, 120);

  for (const slot of GEAR_SLOTS) {
    const list = getGearListBySlot(slot);
    assert.equal(list.length, 40, `Slot ${slot} must have 40 items`);
    assert.equal(list.filter(g => g.rarity === 'common').length, 6, `Slot ${slot} must have 6 Common items`);
    assert.equal(list.filter(g => g.rarity === 'rare').length, 8, `Slot ${slot} must have 8 Rare items`);
    assert.equal(list.filter(g => g.rarity === 'special').length, 10, `Slot ${slot} must have 10 Special items`);
    assert.equal(list.filter(g => g.rarity === 'epic').length, 10, `Slot ${slot} must have 10 Epic items`);
    assert.equal(list.filter(g => g.rarity === 'legendary').length, 6, `Slot ${slot} must have 6 Legendary items`);
  }

  for (const item of GEAR_LIST) {
    assert.ok(item.id && typeof item.id === 'string');
    assert.ok(GEAR_SLOTS.includes(item.slot));
    assert.ok(['common', 'rare', 'special', 'epic', 'legendary'].includes(item.rarity));
    assert.ok(item.name && item.summary && item.icon);
    assert.ok(Number.isInteger(item.price) && item.price > 0);
    assert.ok(Number.isInteger(item.unlockFloor) && item.unlockFloor >= 5);
    assert.ok(item.effects && typeof item.effects === 'object' && Object.keys(item.effects).length > 0);
  }
});

test('Sanctuary Gear Shop: seeded 3-slot stock respects unlockFloor and determinism', () => {
  const s5a = makeSanctuaryState('shop-seed-A', 5);
  const s5b = makeSanctuaryState('shop-seed-A', 5);
  const stockA = getSanctuaryGearStock(s5a);
  const stockB = getSanctuaryGearStock(s5b);

  assert.equal(stockA.length, 3);
  assert.deepEqual(stockA.map(g => g.id), stockB.map(g => g.id));
  assert.deepEqual(stockA.map(g => g.slot), GEAR_SLOTS);
  for (const g of stockA) {
    assert.ok(g.unlockFloor <= 5, `Floor 5 stock must only offer unlockFloor <= 5, got ${g.id} (${g.unlockFloor})`);
  }

  const s45 = makeSanctuaryState('shop-seed-A', 45);
  const stock45 = getSanctuaryGearStock(s45);
  assert.equal(stock45.length, 3);
  assert.deepEqual(stock45.map(g => g.slot), GEAR_SLOTS);
  for (const g of stock45) {
    assert.ok(g.unlockFloor <= 45);
  }
});

test('Gear Commerce: buy, auto-equip, swap, unequip, sell, and salvage sync stats cleanly', () => {
  let state = makeSanctuaryState('commerce-seed', 25, 1000);
  const baseMaxHp = state.player.maxHp;
  const baseMaxMp = getMaxMana(state.player);

  // Buy armor -> auto-equips and increases Max HP by +15
  const boughtArmor = buyGearItem(state, 'robe_apprentice_linen');
  assert.equal(boughtArmor.autoEquipped, true);
  state = boughtArmor.state;
  assert.equal(state.player.gold, 1000 - getGearById('robe_apprentice_linen').price);
  assert.equal(state.player.equippedGear.armor, 'robe_apprentice_linen');
  assert.equal(state.player.maxHp, baseMaxHp + 15);
  assert.equal(state.player.hp, baseMaxHp + 15);

  // Duplicate buy throws
  assert.throws(() => buyGearItem(state, 'robe_apprentice_linen'));

  // Buy accessory -> auto-equips and raises getMaxMana +2
  const boughtAcc = buyGearItem(state, 'ring_copper_meditation');
  state = boughtAcc.state;
  assert.equal(getMaxMana(state.player), baseMaxMp + 2);

  // Buy second armor -> does NOT overwrite equipped armor, stays in vault
  const boughtArmor2 = buyGearItem(state, 'cuirass_light_crag');
  assert.equal(boughtArmor2.autoEquipped, false);
  state = boughtArmor2.state;
  assert.equal(state.player.equippedGear.armor, 'robe_apprentice_linen');

  // Swap to second armor (+30 Max HP instead of +15)
  state = equipGearItem(state, 'cuirass_light_crag');
  assert.equal(state.player.equippedGear.armor, 'cuirass_light_crag');
  assert.equal(state.player.maxHp, baseMaxHp + 30);

  // Unequip armor -> returns to baseMaxHp
  state = unequipGearItem(state, 'armor');
  assert.equal(state.player.equippedGear.armor, null);
  assert.equal(state.player.maxHp, baseMaxHp);

  // Sell common gear -> grants 40% gold and removes from inventory
  const goldBeforeSell = state.player.gold;
  const sold = sellGearItem(state, 'robe_apprentice_linen');
  assert.equal(sold.goldGained, getGearSellPrice('robe_apprentice_linen', 0));
  state = sold.state;
  assert.equal(state.player.gold, goldBeforeSell + sold.goldGained);
  assert.equal(state.player.gearInventory.some(e => e.id === 'robe_apprentice_linen'), false);

  // Salvage common gear -> puts smithing_stone in stash
  const salvagedCommon = salvageGearItem(state, 'cuirass_light_crag');
  assert.equal(salvagedCommon.materialId, 'smithing_stone');
  state = salvagedCommon.state;
  assert.ok(state.player.stash.includes('smithing_stone'));

  // Buy & salvage rare gear -> puts smithing_crystal in stash and auto-unequips
  state = buyGearItem(state, 'staff_pyro_blaster').state;
  assert.equal(state.player.equippedGear.weapon, 'staff_pyro_blaster');
  const salvagedRare = salvageGearItem(state, 'staff_pyro_blaster');
  assert.equal(salvagedRare.materialId, 'smithing_crystal');
  state = salvagedRare.state;
  assert.equal(state.player.equippedGear.weapon, null);
  assert.ok(state.player.stash.includes('smithing_crystal'));

  // Stash full blocks salvage
  state.player.stash = Array(MAX_STASH_ITEMS).fill('smithing_stone');
  assert.throws(() => salvageGearItem(state, 'ring_copper_meditation'));
});

test('Gear Refinement: +0 to +5 material requirements, stat sync, and zero downgrade on failure', () => {
  let state = makeSanctuaryState('refine-seed', 45, 5000);
  const baseMaxHp = state.player.maxHp;
  state = buyGearItem(state, 'robe_apprentice_linen').state; // +15 Max HP base
  assert.equal(state.player.maxHp, baseMaxHp + 15);

  // +0 -> +1 is 100% success, costs gold only
  assert.equal(getGearRefineSuccessRate(0), 100);
  assert.equal(getGearRefineMaterialId(0), null);
  const r1 = refineGearItem(state, 'robe_apprentice_linen');
  assert.equal(r1.failed, false);
  assert.equal(r1.newRefine, 1);
  assert.equal(r1.cost, getGearRefineCost('robe_apprentice_linen', 0));
  state = r1.state;
  // Armor refine +1 adds +6 Max HP -> total +21 over base
  assert.equal(state.player.maxHp, baseMaxHp + 21);

  // Set refine to 2 -> requires smithing_stone for +3
  state.player.gearInventory[0].refine = 2;
  assert.equal(getGearRefineMaterialId(2), 'smithing_stone');
  assert.throws(() => refineGearItem(state, 'robe_apprentice_linen'), /หินตีบวก/);

  // Provide smithing_stone -> attempt +3 (whether pass or fail, never downgrades below 2)
  state.player.stash.push('smithing_stone');
  const r3 = refineGearItem(state, 'robe_apprentice_linen');
  assert.equal(r3.materialUsed, 'smithing_stone');
  assert.ok(r3.newRefine >= 2 && r3.newRefine <= 3);
  state = r3.state;

  // Force +4 -> requires smithing_crystal for +5
  state.player.gearInventory[0].refine = 4;
  assert.equal(getGearRefineMaterialId(4), 'smithing_crystal');
  assert.throws(() => refineGearItem(state, 'robe_apprentice_linen'), /ผลึกตีบวก/);

  // Keep attempting +5 with crystals to verify both failure non-downgrade and eventual +5 cap
  let sawFailOrPass = false;
  let attempts = 0;
  while (state.player.gearInventory[0].refine < MAX_GEAR_REFINE && attempts < 40) {
    state.player.stash.push('smithing_crystal');
    const prevRef = state.player.gearInventory[0].refine;
    const res = refineGearItem(state, 'robe_apprentice_linen');
    assert.ok(res.newRefine >= prevRef, 'Refine must never downgrade on failure');
    sawFailOrPass = true;
    state = res.state;
    attempts++;
  }
  assert.ok(sawFailOrPass);
  assert.equal(state.player.gearInventory[0].refine, MAX_GEAR_REFINE);
  assert.throws(() => refineGearItem(state, 'robe_apprentice_linen'));
});

test('Gear Combat & Forecast Parity: Weapons (flat dmg, burn, pair cost/2nd hit, pyro blast, axe shred, spear back, iron aegis)', () => {
  // 1. Apprentice Oak Staff (+2 flat dmg) vs baseline
  const baseShotState = makeBattleState('w-oak');
  const baseRes = assertForecastParity(baseShotState, ['shot', 'wind']);
  const oakState = equipDirect(makeBattleState('w-oak'), ['staff_apprentice_oak']);
  const oakRes = assertForecastParity(oakState, ['shot', 'wind']);
  assert.equal(oakRes.state.enemies[0].hp, baseRes.state.enemies[0].hp - 2);

  // 2. Ember Torch Wand (+3 fire dmg, +1 burn)
  const baseFire = assertForecastParity(makeBattleState('w-ember'), ['shot', 'fire']);
  const emberState = equipDirect(makeBattleState('w-ember'), ['wand_ember_torch']);
  const emberRes = assertForecastParity(emberState, ['shot', 'fire']);
  assert.equal(emberRes.state.enemies[0].hp, baseFire.state.enemies[0].hp - 3);
  assert.equal(emberRes.state.enemies[0].burn, baseFire.state.enemies[0].burn + 1);

  // 3. Gemini Resonance Wand (pair cost -1, 2nd hit +20%)
  const geminiState = equipDirect(makeBattleState('w-gemini', { words: ['shot', 'fire', 'pair', 'bolt', 'ice'] }), ['wand_gemini_resonance']);
  const parsedPair = parseSpell(['shot', 'fire', 'pair']);
  const basePairCost = battleSpellCost(makeBattleState('w-gemini'), parsedPair);
  const geminiPairCost = battleSpellCost(geminiState, parsedPair);
  assert.equal(geminiPairCost, Math.max(2, basePairCost - 1));
  const basePairRes = assertForecastParity(makeBattleState('w-gemini', { words: ['shot', 'fire', 'pair', 'bolt', 'ice'] }), ['shot', 'fire', 'pair']);
  const geminiPairRes = assertForecastParity(geminiState, ['shot', 'fire', 'pair']);
  assert.ok(geminiPairRes.state.enemies[0].hp < basePairRes.state.enemies[0].hp);

  // 4. Pyro Blaster Staff (blast +4 splash, burn detonate +3)
  const pyroEnemies = [
    { id: 'e1', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 2, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
    { id: 'e2', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
  ];
  const baseBlast = assertForecastParity(
    makeBattleState('w-pyro', { words: ['blast', 'fire', 'shot', 'bolt', 'ice'], enemies: structuredClone(pyroEnemies) }),
    ['blast', 'fire'],
    'e1',
  );
  const pyroState = equipDirect(
    makeBattleState('w-pyro', { words: ['blast', 'fire', 'shot', 'bolt', 'ice'], enemies: structuredClone(pyroEnemies) }),
    ['staff_pyro_blaster'],
  );
  const pyroRes = assertForecastParity(pyroState, ['blast', 'fire'], 'e1');
  assert.ok(pyroRes.state.enemies[0].hp <= baseBlast.state.enemies[0].hp - 3);
  assert.ok(pyroRes.state.enemies[1].hp <= baseBlast.state.enemies[1].hp - 4);

  // 5. Spell-Sunderer Battleaxe (axe +4 dmg, shred 2 armor)
  const armoredEnemies = [
    { id: 'e1', kind: 'armored', hp: 100, maxHp: 100, armor: 3, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
  ];
  const axeState = equipDirect(
    makeBattleState('w-axe', { words: ['axe', 'fire', 'shot', 'bolt', 'ice'], enemies: armoredEnemies }),
    ['axe_spell_sunderer'],
  );
  const axeRes = assertForecastParity(axeState, ['axe', 'fire'], 'e1');
  assert.equal(axeRes.state.enemies[0].armor, 1);

  // 6. Needle Lance Wand (spear back pierce 75%)
  const spearEnemies = [
    { id: 'e1', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
    { id: 'e2', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
  ];
  const baseSpear = assertForecastParity(
    makeBattleState('w-spear', { words: ['spear', 'fire', 'shot', 'bolt', 'ice'], enemies: structuredClone(spearEnemies) }),
    ['spear', 'fire'],
    'e1',
  );
  const lanceState = equipDirect(
    makeBattleState('w-spear', { words: ['spear', 'fire', 'shot', 'bolt', 'ice'], enemies: structuredClone(spearEnemies) }),
    ['wand_needle_lance'],
  );
  const lanceRes = assertForecastParity(lanceState, ['spear', 'fire'], 'e1');
  assert.ok(lanceRes.state.enemies[1].hp < baseSpear.state.enemies[1].hp);

  // 7. Iron Aegis Staff (shield +4, grants active summon +1 ward)
  const aegisState = equipDirect(
    makeBattleState('w-aegis', {
      words: ['shield', 'water', 'summon', 'dog', 'fire'],
      enemies: [{ id: 'e1', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 }],
    }),
    ['staff_iron_aegis'],
  );
  aegisState.player.summon = {
    creatureId: 'dog', name: 'สุนัขเฝ้าหอคอย', hp: 16, maxHp: 16, armor: 0, ward: 0,
    element: null, rarity: 'common', counterDmg: 5, strikeDmg: 8, summonedTurn: 1, turnsLeft: 2, hasCountered: false,
  };
  const aegisRes = assertForecastParity(aegisState, ['shield', 'water'], 'e1');
  assert.equal(aegisRes.state.player.summon.ward, 1);
});

test('Gear Combat & Forecast Parity: Armors (start shield, natural armor, aerial ward, shield break retaliate, summon vest)', () => {
  // 1. Apprentice Linen Robe grants startShield (+4) on enterRoom
  const roomState = createRun('a-linen', true);
  equipDirect(roomState, ['robe_apprentice_linen']);
  enterRoom(roomState);
  assert.ok(roomState.player.shield && roomState.player.shield.layers.reduce((a, b) => a + b, 0) >= 4);

  // 2. Light Crag Cuirass (naturalArmor +2 reduces incoming damage)
  const heavyEnemy = [{ id: 'e1', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 }];
  const baseTank = assertForecastParity(makeBattleState('a-crag', { enemies: structuredClone(heavyEnemy) }), ['shot', 'wind']);
  const cragState = equipDirect(makeBattleState('a-crag', { enemies: structuredClone(heavyEnemy) }), ['cuirass_light_crag']);
  const cragRes = assertForecastParity(cragState, ['shot', 'wind']);
  const baseDamageTaken = baseTank.state.player.maxHp - baseTank.state.player.hp;
  const cragDamageTaken = cragRes.state.player.maxHp - cragRes.state.player.hp;
  assert.ok(cragDamageTaken < baseDamageTaken, `Natural armor should reduce damage (${cragDamageTaken} < ${baseDamageTaken})`);

  // 3. Mirage Mist Robe (aerial summon bird/eagle/wind starts with ward +1)
  const mistState = equipDirect(
    makeBattleState('a-mist', {
      words: ['summon', 'bird', 'shot', 'fire', 'bolt'],
      enemies: [{ id: 'e1', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 }],
    }),
    ['robe_mist_mirage'],
  );
  const mistRes = assertForecastParity(mistState, ['summon', 'bird'], 'e1');
  assert.equal(mistRes.state.player.summon.ward, 1);

  // 4. Bone-Splinter Cuirass (shield break retaliates +8 dmg to attacker)
  const boneState = equipDirect(
    makeBattleState('a-bone', {
      words: ['shot', 'wind', 'bolt', 'ice', 'shield'],
      enemies: [{ id: 'e1', kind: 'ember_imp', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 }],
    }),
    ['cuirass_bone_splinter'],
  );
  boneState.player.shield = { layers: [1], expires: 2, effect: null, triggered: false };
  const boneRes = assertForecastParity(boneState, ['shot', 'wind'], 'e1');
  const retaliateEv = boneRes.events.find(e => e.type === 'damage' && e.target === 'e1' && e.actual === 8);
  assert.ok(retaliateEv, 'Bone-Splinter Cuirass should retaliate 8 damage when shield breaks');

  // 5. Hound-Fur Vest (summonAllHp +6, summonAllCounter +2)
  const baseVest = assertForecastParity(
    makeBattleState('a-vest', {
      words: ['summon', 'dog', 'shot', 'fire', 'bolt'],
      enemies: [{ id: 'e1', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 }],
    }),
    ['summon', 'dog'],
    'e1',
  );
  const vestState = equipDirect(
    makeBattleState('a-vest', {
      words: ['summon', 'dog', 'shot', 'fire', 'bolt'],
      enemies: [{ id: 'e1', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 }],
    }),
    ['vest_hound_fur'],
  );
  const vestRes = assertForecastParity(vestState, ['summon', 'dog'], 'e1');
  assert.equal(vestRes.state.player.summon.maxHp, baseVest.state.player.summon.maxHp + 6);
  assert.equal(vestRes.state.player.summon.counter, baseVest.state.player.summon.counter + 2);
});

test('Gear Combat & Forecast Parity: Accessories (hand limit, high-hand block, overheal shield, static quartz, chain volt, zero-armor, soul bell, twin bullet)', () => {
  // 1. Cheetah-Stride Amulet (hand limit +1, high-hand block +4 when hand >= 3 after cast)
  const baseCheetahState = makeBattleState('acc-cheetah', {
    words: ['shot', 'fire', 'bolt', 'ice', 'wind'],
    hand: ['shot', 'fire', 'bolt', 'ice', 'wind'],
  });
  const baseHandLimit = getHandLimit(baseCheetahState.player);
  const baseCheetahRes = assertForecastParity(baseCheetahState, ['shot', 'fire'], 'e1');
  const cheetahState = equipDirect(
    makeBattleState('acc-cheetah', {
      words: ['shot', 'fire', 'bolt', 'ice', 'wind'],
      hand: ['shot', 'fire', 'bolt', 'ice', 'wind'],
    }),
    ['amulet_cheetah_stride'],
  );
  assert.equal(getHandLimit(cheetahState.player), baseHandLimit + 1);
  const cheetahRes = assertForecastParity(cheetahState, ['shot', 'fire'], 'e1');
  assert.ok(cheetahRes.summary.blocked > baseCheetahRes.summary.blocked, 'Cheetah-Stride Amulet should grant +4 block when hand >= 3 after cast');
  assert.ok(cheetahRes.state.player.hp > baseCheetahRes.state.player.hp);

  // 2. Dewdrop Pearl Ring (heal +2, overheal converts to shield up to 6)
  const pearlState = equipDirect(
    makeBattleState('acc-pearl', {
      words: ['heal', 'self', 'shot', 'fire', 'bolt'],
      enemies: [{ id: 'e1', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 }],
    }),
    ['ring_dewdrop_pearl'],
  );
  pearlState.player.hp = pearlState.player.maxHp;
  const pearlRes = assertForecastParity(pearlState, ['heal', 'self'], 'e1');
  assert.equal(pearlRes.summary.overhealShield, 6);

  // 3. Static Quartz Brooch (deterministic chain +5 on wet target)
  const quartzEnemies = [
    { id: 'e1', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 5, slot: 0 },
    { id: 'e2', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
  ];
  const baseQuartz = assertForecastParity(
    makeBattleState('acc-quartz', { words: ['shot', 'lightning', 'fire', 'bolt', 'ice'], enemies: structuredClone(quartzEnemies) }),
    ['shot', 'lightning'],
    'e1',
  );
  const quartzState = equipDirect(
    makeBattleState('acc-quartz', { words: ['shot', 'lightning', 'fire', 'bolt', 'ice'], enemies: structuredClone(quartzEnemies) }),
    ['brooch_static_quartz'],
  );
  const quartzRes = assertForecastParity(quartzState, ['shot', 'lightning'], 'e1');
  assert.ok(quartzRes.state.enemies[1].hp <= baseQuartz.state.enemies[1].hp - 5, 'Static Quartz should deterministically arc +5 dmg to e2 when e1 is wet');

  // 4. Chain Volt Insignia (chain lightning full pierce + +1 MP on chain hit)
  const voltEnemies = [
    { id: 'e1', kind: 'charger', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
    { id: 'e2', kind: 'armored', hp: 100, maxHp: 100, armor: 5, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
  ];
  const baseVolt = assertForecastParity(
    makeBattleState('acc-volt', { words: ['shot', 'asani', 'fire', 'bolt', 'ice'], mana: 10, enemies: structuredClone(voltEnemies) }),
    ['shot', 'asani'],
    'e1',
  );
  const voltState = equipDirect(
    makeBattleState('acc-volt', { words: ['shot', 'asani', 'fire', 'bolt', 'ice'], mana: 10, enemies: structuredClone(voltEnemies) }),
    ['insignia_chain_volt'],
  );
  const voltRes = assertForecastParity(voltState, ['shot', 'asani'], 'e1');
  assert.ok(voltRes.state.enemies[1].hp < baseVolt.state.enemies[1].hp, 'Chain Volt should pierce e2 armor');
  assert.equal(voltRes.state.player.mana, baseVolt.state.player.mana + 1, 'Chain Volt should restore +1 MP on chain hit');

  // 5. Armor-Breaker Talisman (+20% damage vs 0-armor enemy)
  const baseBreaker = assertForecastParity(makeBattleState('acc-breaker', { words: ['shot', 'fire', 'ice', 'wind', 'shield'] }), ['shot', 'fire']);
  const breakerState = equipDirect(makeBattleState('acc-breaker', { words: ['shot', 'fire', 'ice', 'wind', 'shield'] }), ['talisman_armor_breaker']);
  const breakerRes = assertForecastParity(breakerState, ['shot', 'fire']);
  assert.ok(breakerRes.state.enemies[0].hp < baseBreaker.state.enemies[0].hp);

  // 6. Soul-Affinity Bell (when summon breaks, restore +2 MP and draw 1 card)
  const bellEnemy = [{ id: 'e1', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 }];
  const bellState = equipDirect(
    makeBattleState('acc-bell', {
      words: ['shot', 'fire', 'bolt', 'ice', 'wind'],
      hand: ['shot', 'fire', 'bolt'],
      mana: 5,
      enemies: structuredClone(bellEnemy),
    }),
    ['bell_soul_affinity'],
  );
  bellState.player.summon = {
    creatureId: 'dog', name: 'สุนัข', hp: 1, maxHp: 14, armor: 0, ward: 0,
    element: null, counter: 4, strike: 12, turnCreated: 1,
  };
  const bellRes = assertForecastParity(bellState, ['shot', 'fire'], 'e1');
  assert.equal(bellRes.state.player.summon ?? null, null, '1 HP summon should break from enemy attack');
  const bellNoGear = makeBattleState('acc-bell', {
    words: ['shot', 'fire', 'bolt', 'ice', 'wind'],
    hand: ['shot', 'fire', 'bolt'],
    mana: 5,
    enemies: structuredClone(bellEnemy),
  });
  bellNoGear.player.summon = structuredClone(bellState.player.summon);
  const noBellRes = assertForecastParity(bellNoGear, ['shot', 'fire'], 'e1');
  assert.equal(bellRes.state.player.mana, noBellRes.state.player.mana + 2);
  assert.equal(bellRes.state.player.hand.length, noBellRes.state.player.hand.length + 1);

  // 7. Twin-Bullet Ring (shot +4 dmg & shred -1 armor; beam strips 1 extra ward)
  const twinShotState = equipDirect(
    makeBattleState('acc-twin-shot', {
      words: ['shot', 'beam', 'fire', 'bolt', 'ice'],
      enemies: [{ id: 'e1', kind: 'armored', hp: 100, maxHp: 100, armor: 3, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 }],
    }),
    ['ring_twin_bullet'],
  );
  const twinShotRes = assertForecastParity(twinShotState, ['shot', 'fire'], 'e1');
  assert.equal(twinShotRes.state.enemies[0].armor, 2);

  const twinBeamState = equipDirect(
    makeBattleState('acc-twin-beam', {
      words: ['shot', 'beam', 'fire', 'bolt', 'ice'],
      enemies: [{ id: 'e1', kind: 'charger', hp: 100, maxHp: 100, armor: 3, ward: 2, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 }],
    }),
    ['ring_twin_bullet'],
  );
  const twinBeamRes = assertForecastParity(twinBeamState, ['beam', 'fire'], 'e1');
  // Beam hit consumes 1 ward + ring_twin_bullet strips 1 extra ward -> 0 ward left
  assert.equal(twinBeamRes.state.enemies[0].ward, 0);
});

test('Gear Save/Load: persistence, strict validation, backward compatibility, and equipment signature', () => {
  const memoryStorage = (() => {
    const map = new Map();
    return {
      getItem: k => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: k => map.delete(k),
    };
  })();

  let state = makeSanctuaryState('save-gear-seed', 25, 1500);
  const sigEmpty = getGearEquipmentSignature(state.player);
  state = buyGearItem(state, 'staff_apprentice_oak').state;
  state = buyGearItem(state, 'robe_apprentice_linen').state;
  state = buyGearItem(state, 'ring_copper_meditation').state;
  const sigEquipped = getGearEquipmentSignature(state.player);
  assert.notEqual(sigEmpty, sigEquipped);

  state = refineGearItem(state, 'staff_apprentice_oak').state;
  const sigRefined = getGearEquipmentSignature(state.player);
  assert.notEqual(sigEquipped, sigRefined);
  assert.ok(summarizeActiveGearStats(state.player).length > 0);

  // Save & Load roundtrip
  const saved = saveRun(state, memoryStorage);
  assert.equal(saved.ok, true);
  const loaded = loadRun(memoryStorage);
  assert.equal(loaded.ok, true);
  assert.ok(loaded.state);
  assert.deepEqual(loaded.state.player.equippedGear, state.player.equippedGear);
  assert.deepEqual(loaded.state.player.gearInventory, state.player.gearInventory);
  assert.equal(loaded.state.player.maxHp, state.player.maxHp);

  // Backward compatibility: legacy save without gearInventory / equippedGear
  const legacy = structuredClone(state);
  delete legacy.player.gearInventory;
  delete legacy.player.equippedGear;
  legacy.player.maxHp = 36;
  legacy.player.hp = 36;
  legacy.player.mana = 10;
  const validatedLegacy = validateRun(legacy);
  assert.deepEqual(validatedLegacy.player.gearInventory, []);
  assert.deepEqual(validatedLegacy.player.equippedGear, { weapon: null, armor: null, accessory: null });

  // Validation rejects tampered gear states
  const badUnknownId = structuredClone(state);
  badUnknownId.player.gearInventory.push({ id: 'fake_sword', refine: 0 });
  assert.throws(() => validateRun(badUnknownId));

  const badRefine = structuredClone(state);
  badRefine.player.gearInventory[0].refine = MAX_GEAR_REFINE + 1;
  assert.throws(() => validateRun(badRefine));

  const badWrongSlot = structuredClone(state);
  badWrongSlot.player.equippedGear.armor = 'staff_apprentice_oak';
  assert.throws(() => validateRun(badWrongSlot));

  const badUnowned = structuredClone(state);
  badUnowned.player.equippedGear.weapon = 'wand_ember_torch';
  assert.throws(() => validateRun(badUnowned));
});
