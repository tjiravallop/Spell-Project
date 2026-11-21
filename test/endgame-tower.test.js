import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun,
  createEnemy,
  prepareEnemies,
  useBattleItem,
  useInventoryItem,
  getAvailableShopItems,
  grantBossRelic,
  getEquippedRelics,
  getHandLimit,
  getMaxMana,
  equipRelic,
  unequipRelic,
  enterRoom,
  intent,
  completeBossVictoryTransition,
  revisitRoom,
  restAtSanctuary,
  getFloorInfo,
  TOTAL_TOWER_ROOMS,
  FLOOR50_BOSS_ROOM,
  FLOOR60_BOSS_ROOM,
  FLOOR70_BOSS_ROOM,
  FLOOR80_BOSS_ROOM,
  FLOOR90_BOSS_ROOM,
  FLOOR100_BOSS_ROOM,
  ENEMIES,
  SHOP_ITEMS,
  RELIC_DRAFT_CATALOG,
  nextExpForLevel,
  applyExpAndGold,
} from '../src/run.js';
import { simulateTurn } from '../src/combat.js';
import { getTowerSpellBonus, getTurnManaRegen } from '../src/upper-tower.js';
import {
  ENDGAME_ENEMIES,
  ENDGAME_RELICS,
  ENDGAME_SHOP_ITEMS,
  ENDGAME_SPACED_FLOORS,
  buildEndgameTowerRooms,
} from '../src/endgame-tower.js';
import { ENEMY_TRAITS } from '../src/enemy-traits.js';
import { middleSprites } from '../src/middle-sprites.js';
import { LARGE_BOSS_KINDS } from '../src/render.js';
import { saveRun, loadRun, SAVE_KEY } from '../src/save.js';

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.get(key) ?? null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
  removeItem(key) { this.#data.delete(key); }
  clear() { this.#data.clear(); }
}

test('Endgame Tower Structure: 250 rooms, correct boss rooms and 10 elemental zones', () => {
  const state = createRun('endgame-structure-seed');
  assert.equal(state.rooms.length, TOTAL_TOWER_ROOMS);
  assert.equal(TOTAL_TOWER_ROOMS, 250);

  // Check boss rooms
  assert.equal(FLOOR60_BOSS_ROOM, 149);
  assert.equal(FLOOR70_BOSS_ROOM, 174);
  assert.equal(FLOOR80_BOSS_ROOM, 199);
  assert.equal(FLOOR90_BOSS_ROOM, 224);
  assert.equal(FLOOR100_BOSS_ROOM, 249);

  // Check boss room encounters
  assert.deepEqual(state.rooms[FLOOR60_BOSS_ROOM], ['volcano_colossus', 'magma_tortoise', 'cinder_drake', 'magma_tortoise']);
  assert.deepEqual(state.rooms[FLOOR70_BOSS_ROOM], ['thunder_drake_emperor', 'sand_stalker', 'spark_wraith', 'sand_stalker']);
  assert.deepEqual(state.rooms[FLOOR80_BOSS_ROOM], ['kraken_ward_tentacle', 'kraken_heal_tentacle', 'kraken_ink_tentacle', 'kraken_crush_tentacle']);
  assert.deepEqual(state.rooms[FLOOR90_BOSS_ROOM], ['nether_dread_lord', 'nether_leech_pillar', 'nether_curse_pillar', 'nether_doom_pillar']);
  assert.deepEqual(state.rooms[FLOOR100_BOSS_ROOM], ['eternity_overlord', 'zenith_templar', 'chronos_keeper', 'chaos_weaver']);

  // Floor info verification for key milestones
  const info54 = getFloorInfo(136, 250);
  assert.equal(info54.floor, 54);
  assert.equal(info54.isBoss, true);

  const info60 = getFloorInfo(FLOOR60_BOSS_ROOM, 250);
  assert.equal(info60.floor, 60);
  assert.equal(info60.isBoss, true);

  const info100 = getFloorInfo(FLOOR100_BOSS_ROOM, 250);
  assert.equal(info100.floor, 100);
  assert.equal(info100.isBoss, true);
  assert.equal(info100.isFinalBoss, true);
});

test('Endgame Monsters: All 39 monsters have authentic stats, traits, and Canvas 2D silhouettes', () => {
  const enemyKeys = Object.keys(ENDGAME_ENEMIES);
  assert.equal(enemyKeys.length, 39);
  const palette = Array(35).fill('#333333');

  // Verify all 30 monsters are in ENEMIES
  for (const key of enemyKeys) {
    const enemyData = ENEMIES[key];
    assert.ok(enemyData, `ENEMIES must have ${key}`);
    assert.ok(enemyData.hp > 0, `${key} must have hp > 0`);
    assert.ok(enemyData.name, `${key} must have Thai name`);
    assert.ok(enemyData.color, `${key} must have palette color`);

    // Verify ENEMY_TRAITS
    const trait = ENEMY_TRAITS[key];
    assert.ok(trait, `ENEMY_TRAITS must have ${key}`);
    assert.ok(trait.role, `${key} trait must have role`);
    assert.equal(typeof trait.passive, 'function', `${key} trait must have passive function`);
    assert.ok(trait.counter, `${key} trait must have counter`);

    // Verify middleSprites procedural silhouette renderer
    const renderer = middleSprites[key];
    assert.equal(typeof renderer, 'function', `middleSprites must have renderer for ${key}`);

    const rects = [];
    const r = (x, y, w, h, col) => rects.push([x, y, w, h, col]);

    // Test idle pose
    assert.doesNotThrow(() => {
      renderer(r, palette, 'idle', 0);
    }, `middleSprites[${key}] idle should not throw`);
    assert.ok(rects.length >= 8, `${key} should draw at least 8 pixel rects`);

    // Test attack pose
    assert.doesNotThrow(() => {
      renderer(r, palette, 'attack', 1);
    }, `middleSprites[${key}] attack/charge should not throw`);
  }

  // Verify large boss kinds includes all major endgame bosses (including Floor 80 Abyssal Kraken and Floor 100 Phase 3 Eternity Reborn)
  const expectedBosses = ['volcano_colossus', 'thunder_drake_emperor', 'ancient_chitin_behemoth', 'abyssal_kraken', 'nether_dread_lord', 'eternity_overlord', 'eternity_reborn'];
  for (const b of expectedBosses) {
    assert.ok(LARGE_BOSS_KINDS.has(b), `LARGE_BOSS_KINDS must have ${b}`);
  }
});

test('Endgame Boss Intents: Bosses 60, 70, 80, 90, 100 charge and heavy strike mechanics', () => {
  const b60 = createEnemy('volcano_colossus');
  const b70 = createEnemy('thunder_drake_emperor');
  const b80 = createEnemy('abyssal_kraken');
  const b90 = createEnemy('nether_dread_lord');
  const b100 = createEnemy('eternity_overlord');

  // Turn 3: charge intent
  assert.equal(intent(b60, 3, [b60], FLOOR60_BOSS_ROOM).type, 'charge');
  assert.equal(intent(b70, 3, [b70], FLOOR70_BOSS_ROOM).type, 'charge');
  assert.equal(intent(b80, 3, [b80], FLOOR80_BOSS_ROOM).type, 'charge');
  assert.equal(intent(b90, 3, [b90], FLOOR90_BOSS_ROOM).type, 'charge');
  assert.equal(intent(b100, 3, [b100], FLOOR100_BOSS_ROOM).type, 'charge');

  // Turn 4: climax heavy attack
  const a60 = intent(b60, 4, [b60], FLOOR60_BOSS_ROOM);
  assert.equal(a60.type, 'attack');
  assert.ok(a60.amount >= 24, 'Floor 60 boss heavy attack should be >= 24');

  const a70 = intent(b70, 4, [b70], FLOOR70_BOSS_ROOM);
  assert.equal(a70.type, 'attack');
  assert.ok(a70.amount >= 26, 'Floor 70 boss heavy attack should be >= 26');

  const a80 = intent(b80, 4, [b80], FLOOR80_BOSS_ROOM);
  assert.equal(a80.type, 'attack');
  assert.ok(a80.amount >= 28, 'Floor 80 boss heavy attack should be >= 28');

  const a90 = intent(b90, 4, [b90], FLOOR90_BOSS_ROOM);
  assert.equal(a90.type, 'attack');
  assert.ok(a90.amount >= 30, 'Floor 90 boss heavy attack should be >= 30');

  const a100 = intent(b100, 4, [b100], FLOOR100_BOSS_ROOM);
  assert.equal(a100.type, 'attack');
  assert.ok(a100.amount >= 36, 'Floor 100 final boss heavy attack should be >= 36');
});

test('Endgame Boss Artifacts: Bosses 60, 70, 80, 90, 100 grant thematic relics and combat bonuses', () => {
  let state = createRun('relic-test');
  state.phase = 'sanctuary';
  const p = state.player;

  grantBossRelic(p, 60);
  assert.deepEqual(p.relics, ['magma_heart_60']);
  // No duplicate
  grantBossRelic(p, 60);
  assert.deepEqual(p.relics, ['magma_heart_60']);

  grantBossRelic(p, 70);
  grantBossRelic(p, 80);
  grantBossRelic(p, 90);
  grantBossRelic(p, 100);

  assert.deepEqual(p.relics, [
    'magma_heart_60',
    'thunder_conduit_70',
    'gaia_emblem_80',
    'void_annihilator_90',
    'crown_of_eternity_100',
  ]);

  // First 3 relics auto-equipped by grantBossRelic
  assert.deepEqual(getEquippedRelics(state.player), ['magma_heart_60', 'thunder_conduit_70', 'gaia_emblem_80']);

  // Max 3 equipped charm slots throws
  assert.throws(() => equipRelic(state, 'void_annihilator_90'), /ช่องใส่เครื่องรางเต็มแล้ว/);

  // Unequip and equip another relic
  state = unequipRelic(state, 'magma_heart_60');
  assert.deepEqual(getEquippedRelics(state.player), ['thunder_conduit_70', 'gaia_emblem_80']);
  state = equipRelic(state, 'crown_of_eternity_100');
  assert.deepEqual(getEquippedRelics(state.player), ['thunder_conduit_70', 'gaia_emblem_80', 'crown_of_eternity_100']);
});

test('Endgame Shop: Progressive unlocks at Floors 50, 60, 70, 80, 90 and item usage', () => {
  const state = createRun('shop-test');

  // Floor 1: only base shop items (minFloor <= 1 or no minFloor)
  state.room = 0;
  const shopF1 = getAvailableShopItems(state);
  assert.ok(shopF1.every(item => !item.minFloor || item.minFloor <= 1));

  // Floor 50: items with minFloor <= 50 become available
  state.room = FLOOR50_BOSS_ROOM;
  const shopF50 = getAvailableShopItems(state);
  const items50 = shopF50.filter(i => i.minFloor === 50);
  assert.ok(items50.length >= 7, 'Floor 50 should unlock at least 7 items');
  assert.ok(shopF50.some(i => i.id === 'coral_barrier_tome'));
  assert.ok(shopF50.some(i => i.id === 'sea_serpent_fang'));

  // Floor 60: items with minFloor <= 60 available
  state.room = FLOOR60_BOSS_ROOM;
  const shopF60 = getAvailableShopItems(state);
  const items60 = shopF60.filter(i => i.minFloor === 60);
  assert.ok(items60.length >= 7, 'Floor 60 should unlock at least 7 items');
  assert.ok(shopF60.some(i => i.id === 'volcanic_ash_bomb'));
  assert.ok(shopF60.some(i => i.id === 'pyro_core_extract'));

  // Floor 70: items with minFloor <= 70 available
  state.room = FLOOR70_BOSS_ROOM;
  const shopF70 = getAvailableShopItems(state);
  const items70 = shopF70.filter(i => i.minFloor === 70);
  assert.ok(items70.length >= 7, 'Floor 70 should unlock at least 7 items');
  assert.ok(shopF70.some(i => i.id === 'galvanic_shield_generator'));
  assert.ok(shopF70.some(i => i.id === 'chain_lightning_orb'));

  // Floor 80: items with minFloor <= 80 available
  state.room = FLOOR80_BOSS_ROOM;
  const shopF80 = getAvailableShopItems(state);
  const items80 = shopF80.filter(i => i.minFloor === 80);
  assert.ok(items80.length >= 7, 'Floor 80 should unlock at least 7 items');
  assert.ok(shopF80.some(i => i.id === 'titan_wall_scroll'));
  assert.ok(shopF80.some(i => i.id === 'frost_shield_rune'));

  // Floor 90: items with minFloor <= 90 available
  state.room = FLOOR90_BOSS_ROOM;
  const shopF90 = getAvailableShopItems(state);
  const items90 = shopF90.filter(i => i.minFloor === 90);
  assert.ok(items90.length >= 7, 'Floor 90 should unlock at least 7 items');
  assert.ok(shopF90.some(i => i.id === 'void_singularity_flask'));
  assert.ok(shopF90.some(i => i.id === 'supernova_core'));

  // Test combat consumable item usage: chain_lightning_orb
  state.player.items = ['chain_lightning_orb'];
  state.enemies = [
    { id: 'enemy-0', kind: 'striker', hp: 30, maxHp: 30, armor: 0, ward: 0, chill: 0, freeze: 0, burn: 0, slot: 0 },
    { id: 'enemy-1', kind: 'striker', hp: 30, maxHp: 30, armor: 0, ward: 0, chill: 0, freeze: 0, burn: 0, slot: 1 },
  ];
  const useRes = useBattleItem(state, 0);
  assert.equal(useRes.ok, true);
  assert.equal(useRes.state.enemies[0].hp, 12);
  assert.equal(useRes.state.enemies[1].hp, 12);
  assert.equal(useRes.state.player.items.length, 0);

  // Test combat consumable item usage: supernova_core
  state.player.items = ['supernova_core'];
  state.enemies = [
    { id: 'enemy-0', kind: 'striker', hp: 40, maxHp: 40, armor: 0, ward: 0, chill: 0, freeze: 0, burn: 0, slot: 0 },
  ];
  const novaRes = useBattleItem(state, 0);
  assert.equal(novaRes.ok, true);
  assert.equal(novaRes.state.enemies[0].hp, 5); // 40 - 35 = 5
});

test('Endgame Floor 100 Final Boss Victory: defeats trigger True Victory phase won', () => {
  const state = createRun('victory-test');
  state.room = FLOOR100_BOSS_ROOM;
  state.enemies = state.rooms[FLOOR100_BOSS_ROOM].map(createEnemy);
  state.enemies.forEach(e => { e.hp = 0; });
  state.phase = 'battle';

  completeBossVictoryTransition(state);
  assert.equal(state.phase, 'won');
  assert.ok(state.player.relics.includes('crown_of_eternity_100'));
});

test('Save System: Floors 51–100 state round trip and persistence', () => {
  const storage = new MemoryStorage();
  const state = createRun('save-roundtrip-seed');
  state.room = FLOOR60_BOSS_ROOM;
  state.enemies = state.rooms[state.room].map(createEnemy);
  state.clearedRooms = Array.from({ length: FLOOR60_BOSS_ROOM }, (_, i) => i);
  state.player.relics = ['magma_heart_60'];
  state.player.equippedRelics = ['magma_heart_60'];
  state.player.items = ['supernova_core', 'omega_ward_prism'];
  state.sanctuaryFloor = 55;
  state.phase = 'sanctuary';

  const saveRes = saveRun(state, storage);
  assert.equal(saveRes.ok, true);

  const loadRes = loadRun(storage);
  assert.equal(loadRes.ok, true);
  assert.equal(loadRes.state.room, FLOOR60_BOSS_ROOM);
  assert.equal(loadRes.state.rooms.length, TOTAL_TOWER_ROOMS);
  assert.ok(loadRes.state.player.relics.includes('magma_heart_60'));
  assert.deepEqual(loadRes.state.player.items, ['supernova_core', 'omega_ward_prism']);
});

test('Chronos Hourglass restores MP and draws to full hand limit in battle, and is battle-only', () => {
  const state = createRun('chronos-test');
  state.player.mana = 4;
  state.player.hand = ['shot', 'fire'];
  state.player.items = ['chronos_hourglass'];

  const res = useBattleItem(state, 0);
  assert.equal(res.ok, true);
  assert.equal(res.state.player.mana, 10);
  assert.equal(res.state.player.hand.length, 10);
  assert.equal(res.state.player.items.length, 0);

  // Works when MP is already full as long as hand has space
  const fullMpState = createRun('chronos-full-mp');
  fullMpState.player.mana = fullMpState.player.maxMana;
  fullMpState.player.hand = ['shot', 'fire', 'ice'];
  fullMpState.player.items = ['chronos_hourglass'];
  const drawOnly = useBattleItem(fullMpState, 0);
  assert.equal(drawOnly.ok, true);
  assert.equal(drawOnly.state.player.hand.length, 10);

  // Rejects no-effect use when both MP and hand are already full
  const noEffect = createRun('chronos-no-effect');
  noEffect.player.mana = noEffect.player.maxMana;
  noEffect.player.hand = Array(10).fill('shot');
  noEffect.player.items = ['chronos_hourglass'];
  assert.throws(() => useBattleItem(noEffect, 0), /เต็มอยู่แล้ว/);

  // Rejects outside battle
  const sanct = createRun('chronos-sanctuary');
  sanct.phase = 'sanctuary';
  sanct.player.mana = 2;
  sanct.player.items = ['chronos_hourglass'];
  assert.throws(() => useInventoryItem(sanct, 'belt', 0), /ฉากต่อสู้/);
});

test('Void Singularity Flask destroys non-bosses and deals 45 true damage to bosses', () => {
  const state = createRun('void-flask-test');
  state.player.items = ['void_singularity_flask'];
  state.enemies = [
    createEnemy('zenith_templar', 0), // non-boss, 1380 HP, 5 armor
    createEnemy('volcano_colossus', 1), // boss, 1500 HP, 3 armor
  ];

  const res = useBattleItem(state, 0);
  assert.equal(res.ok, true);
  assert.equal(res.state.enemies[0].hp, 0);
  assert.equal(res.state.enemies[1].hp, 1500 - 45);
});

test('Floor 60 Boss (volcano_colossus): crisp 4-turn cycle, exposed +35% on turn 4, and Water/Ice magma armor cooling', () => {
  const base = createRun('f60-rebalance-test');
  base.room = FLOOR60_BOSS_ROOM;
  base.collection = ['water', 'ice'];
  base.player.words = ['shot', 'fire', 'ice', 'water', 'pair', 'shield'];
  base.player.maxHp = 200;
  base.player.hp = 200;
  base.player.maxMana = 12;
  base.player.mana = 12;
  base.player.hand = ['shot', 'water', 'ice', 'fire', 'shield'];
  base.enemies = [createEnemy('volcano_colossus', 0)];

  // Check 4-turn armor/ward cycle
  base.turn = 1; prepareEnemies(base);
  assert.equal(base.enemies[0].ward, 1);
  assert.equal(base.enemies[0].armor, 3);
  assert.equal(intent(base.enemies[0], 1, base.enemies, FLOOR60_BOSS_ROOM).amount, 46);

  base.turn = 2; prepareEnemies(base);
  assert.equal(base.enemies[0].ward, 0);
  assert.equal(base.enemies[0].armor, 4);
  assert.equal(intent(base.enemies[0], 2, base.enemies, FLOOR60_BOSS_ROOM).amount, 38);

  base.turn = 3; prepareEnemies(base);
  assert.equal(base.enemies[0].ward, 0);
  assert.equal(base.enemies[0].armor, 2);
  assert.equal(intent(base.enemies[0], 3, base.enemies, FLOOR60_BOSS_ROOM).type, 'charge');

  base.turn = 4; prepareEnemies(base);
  assert.equal(base.enemies[0].ward, 0);
  assert.equal(base.enemies[0].armor, 0);
  assert.equal(intent(base.enemies[0], 4, base.enemies, FLOOR60_BOSS_ROOM).amount, 68);

  // Water/Ice hit cools magma armor by -2 immediately and carries magmaArmorUntil to next turn
  const coolState = structuredClone(base);
  coolState.turn = 2;
  prepareEnemies(coolState);
  assert.equal(coolState.enemies[0].armor, 4);
  const coolRes = simulateTurn(coolState, ['shot', 'water'], 'enemy-0');
  assert.equal(coolRes.ok, true);
  assert.equal(coolRes.summary.enemyArmorAfterTurn['enemy-0'], 2, 'Water should shred 2 magma armor immediately');
  // Next turn (turn 3) base armor is 2, minus 2 from magmaArmorUntil => 0
  assert.equal(coolRes.state.enemies[0].armor, 0, 'magmaArmorUntil should reduce next turn armor by 2');

  // Turn 4 exposed window deals +35% more damage than turn 2 (with 0 armor on both)
  const t2ZeroArmor = structuredClone(base);
  t2ZeroArmor.turn = 2;
  t2ZeroArmor.enemies[0].ward = 0;
  t2ZeroArmor.enemies[0].armor = 0;
  const t4Exposed = structuredClone(t2ZeroArmor);
  t4Exposed.turn = 4;
  const dmgT2 = simulateTurn(t2ZeroArmor, ['shot', 'water'], 'enemy-0').summary.damage;
  const dmgT4 = simulateTurn(t4Exposed, ['shot', 'water'], 'enemy-0').summary.damage;
  assert.ok(dmgT4 > dmgT2, `Turn 4 exposed damage (${dmgT4}) should exceed turn 2 (${dmgT2})`);
});

test('Floor 70 Boss (thunder_drake_emperor): preserves HP/damage, fixes 4-turn cycle, adds Star-Static reflection, Earth grounding, and Turn 4 exposed +35%', () => {
  const storage = new MemoryStorage();
  const base = createRun('f70-mechanics-test');
  base.room = FLOOR70_BOSS_ROOM;
  base.collection = ['earth', 'water', 'pierce'];
  base.player.words = ['shot', 'fire', 'earth', 'water', 'pierce', 'pair', 'shield'];
  base.player.maxHp = 200;
  base.player.hp = 200;
  base.player.maxMana = 12;
  base.player.mana = 12;
  base.player.hand = ['shot', 'fire', 'earth', 'water', 'pierce', 'shield'];
  base.enemies = base.rooms[FLOOR70_BOSS_ROOM].map(createEnemy);
  // Knock out minions to verify solo boss never gets stuck in 3-turn swap/recover collisions
  for (let i = 1; i < base.enemies.length; i++) base.enemies[i].hp = 0;

  assert.equal(base.enemies[0].hp, 2800);
  assert.equal(base.enemies[0].maxHp, 2800);

  // Check clean 4-turn armor/ward/intent cycle (no 3-turn swap/heavy override)
  base.turn = 1; prepareEnemies(base);
  assert.equal(base.enemies[0].ward, 1);
  assert.equal(base.enemies[0].armor, 4);
  assert.equal(intent(base.enemies[0], 1, base.enemies, FLOOR70_BOSS_ROOM).type, 'attack');
  assert.equal(intent(base.enemies[0], 1, base.enemies, FLOOR70_BOSS_ROOM).amount, 58);

  base.turn = 2; prepareEnemies(base);
  assert.equal(base.enemies[0].ward, 0);
  assert.equal(base.enemies[0].armor, 6);
  assert.equal(intent(base.enemies[0], 2, base.enemies, FLOOR70_BOSS_ROOM).amount, 48);

  base.turn = 3; prepareEnemies(base);
  assert.equal(base.enemies[0].ward, 1);
  assert.equal(base.enemies[0].armor, 3);
  assert.equal(intent(base.enemies[0], 3, base.enemies, FLOOR70_BOSS_ROOM).type, 'charge');

  base.turn = 4; prepareEnemies(base);
  assert.equal(base.enemies[0].ward, 0);
  assert.equal(base.enemies[0].armor, 0);
  assert.equal(intent(base.enemies[0], 4, base.enemies, FLOOR70_BOSS_ROOM).amount, 84);

  // Turn 5 must stay phase 1 (58 dmg), NOT spike to old heavy; Turn 7 must stay phase 3 (charge), NOT swap/recover
  assert.equal(intent(base.enemies[0], 5, base.enemies, FLOOR70_BOSS_ROOM).amount, 58);
  assert.equal(intent(base.enemies[0], 7, base.enemies, FLOOR70_BOSS_ROOM).type, 'charge');

  // Star-Static reflection: non-Earth, non-Pierce hit while armored triggers 4 static damage
  const shockTest = structuredClone(base);
  shockTest.turn = 2;
  prepareEnemies(shockTest);
  const shockRes = simulateTurn(shockTest, ['shot', 'water'], 'enemy-0');
  assert.equal(shockRes.ok, true);
  const staticEv = shockRes.events.find(e => e.type === 'storm-static');
  assert.ok(staticEv, 'Armored thunder_drake_emperor should trigger storm-static against Water without Pierce');
  assert.equal(staticEv.rawAttack, 4);

  // Pierce bypasses Star-Static reflection
  const pierceRes = simulateTurn(shockTest, ['shot', 'water', 'pierce'], 'enemy-0');
  assert.equal(pierceRes.ok, true);
  assert.equal(pierceRes.events.some(e => e.type === 'storm-static'), false, 'Pierce should bypass Star-Static');

  // Earth bypasses Star-Static AND grounds boss through next turn (validates & saves cleanly)
  const earthRes = simulateTurn(shockTest, ['shot', 'earth'], 'enemy-0');
  assert.equal(earthRes.ok, true);
  assert.equal(earthRes.events.some(e => e.type === 'storm-static'), false, 'Earth should bypass Star-Static');
  assert.equal(earthRes.state.enemies[0].groundedUntil, 3);
  assert.equal(saveRun(earthRes.state, storage).ok, true);
  assert.equal(loadRun(storage).state.enemies[0].groundedUntil, 3);

  // On turn 3 while grounded (armor > 0, ward cleared), Water attack does NOT trigger Star-Static
  const nextGrounded = structuredClone(earthRes.state);
  nextGrounded.enemies[0].ward = 0;
  nextGrounded.player.hand = ['shot', 'water', 'shield', 'fire', 'earth'];
  const groundedHit = simulateTurn(nextGrounded, ['shot', 'water'], 'enemy-0');
  assert.equal(groundedHit.ok, true);
  assert.equal(groundedHit.events.some(e => e.type === 'storm-static'), false, 'Grounded boss should not shock on next turn');

  // Turn 4 exposed window deals +35% more damage and does not trigger Star-Static (armor 0)
  const t2Zero = structuredClone(base);
  t2Zero.turn = 2;
  t2Zero.enemies[0].ward = 0;
  t2Zero.enemies[0].armor = 0;
  const t4Exp = structuredClone(t2Zero);
  t4Exp.turn = 4;
  const dmgT2 = simulateTurn(t2Zero, ['shot', 'water'], 'enemy-0').summary.damage;
  const resT4 = simulateTurn(t4Exp, ['shot', 'water'], 'enemy-0');
  assert.equal(resT4.events.some(e => e.type === 'storm-static'), false);
  assert.ok(resT4.summary.damage > dmgT2, `Turn 4 exposed damage (${resT4.summary.damage}) should exceed turn 2 (${dmgT2})`);
});

test('Thunder Conduit 70 chains +6 lightning shock to adjacent enemies and refunds +1 mana', () => {
  const base = createRun('thunder-conduit-test');
  base.collection = ['lightning', 'plasma'];
  base.player.words = ['shot', 'fire', 'ice', 'pair', 'shield', 'lightning', 'plasma'];
  base.player.hand = ['shot', 'lightning', 'fire', 'pair', 'plasma'];
  base.player.maxMana = 20;
  base.player.mana = 20;
  base.enemies = [
    { id: 'enemy-0', kind: 'striker', hp: 50, maxHp: 50, armor: 0, ward: 0, chill: 0, freeze: 0, burn: 0, burnTurn: 0, slot: 0 },
    { id: 'enemy-1', kind: 'striker', hp: 50, maxHp: 50, armor: 0, ward: 0, chill: 0, freeze: 0, burn: 0, burnTurn: 0, slot: 1 },
  ];

  const withoutRelic = simulateTurn(base, ['shot', 'lightning'], 'enemy-0');
  assert.equal(withoutRelic.ok, true);
  assert.equal(withoutRelic.events.some(e => e.type === 'chain-lightning'), false);
  assert.equal(withoutRelic.state.enemies[1].hp, 50);

  const withRelic = structuredClone(base);
  withRelic.player.relics = ['thunder_conduit_70'];
  withRelic.player.equippedRelics = ['thunder_conduit_70'];
  const res = simulateTurn(withRelic, ['shot', 'lightning'], 'enemy-0');
  assert.equal(res.ok, true);
  // Primary: 8 + 6 = 14 damage
  assert.equal(res.state.enemies[0].hp, 50 - 14);
  // Adjacent enemy receives 6 chain-lightning shock damage + VFX event
  assert.equal(res.state.enemies[1].hp, 50 - 6);
  const chainEv = res.events.find(e => e.type === 'chain-lightning');
  assert.ok(chainEv);
  assert.equal(chainEv.source, 'enemy-0');
  assert.equal(chainEv.target, 'enemy-1');
  assert.equal(chainEv.element, 'lightning');
  // Mana refund recorded in summary and events: 20 - 3 + 1 = 18
  assert.equal(res.summary.manaRefunded, 1);
  assert.equal(res.summary.manaAfterCast, 18);
  assert.ok(res.events.some(e => e.type === 'mana-refund' && e.relicId === 'thunder_conduit_70' && e.amount === 1));
});

test('Crown of Eternity 100 grants +3 starting/max mana, +2 hand size/limit, and +50% Dual Fusion damage', () => {
  const storage = new MemoryStorage();
  let state = createRun('crown-eternity-test');
  state.collection = ['magma'];
  state.player.words = ['shot', 'fire', 'ice', 'pair', 'shield', 'magma'];
  state.player.relics = ['crown_of_eternity_100'];
  state.player.equippedRelics = ['crown_of_eternity_100'];

  assert.equal(getMaxMana(state.player), 15);
  assert.equal(getHandLimit(state.player), 12);

  // Entering room grants +3 starting mana (15) and +2 opening hand size (7)
  enterRoom(state);
  assert.equal(state.player.mana, 15);
  assert.equal(state.player.hand.length, 7);

  // Can hold 12 cards without overflow and save/load cleanly
  state.player.hand = ['shot', 'fire', 'ice', 'pair', 'magma', 'shield', 'shot', 'fire', 'ice', 'pair', 'magma', 'shield'];
  assert.equal(saveRun(state, storage).ok, true);
  assert.equal(loadRun(storage).ok, true);

  // Dual Fusion +50% applies to both two-card fusion and single-card fused element (magma)
  state.enemies = [
    { id: 'enemy-0', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, chill: 0, freeze: 0, burn: 0, burnTurn: 0, slot: 0 },
  ];
  const noCrown = structuredClone(state);
  noCrown.player.equippedRelics = [];
  noCrown.player.hand = ['shot', 'fire', 'ice', 'pair', 'magma'];
  noCrown.player.mana = 12;

  const pairBase = simulateTurn(noCrown, ['shot', 'fire', 'pair', 'ice'], 'enemy-0');
  const pairCrown = simulateTurn(state, ['shot', 'fire', 'pair', 'ice'], 'enemy-0');
  assert.equal(pairCrown.summary.damage, Math.round(pairBase.summary.damage * 1.5));

  const magmaBase = simulateTurn(noCrown, ['shot', 'magma'], 'enemy-0');
  const magmaCrown = simulateTurn(state, ['shot', 'magma'], 'enemy-0');
  assert.equal(magmaCrown.summary.damage, Math.round(magmaBase.summary.damage * 1.5));

  // Chronos Hourglass draws up to the Crown-boosted hand limit (12) and mana cap (15)
  state.player.mana = 10;
  state.player.hand = ['shot', 'fire'];
  state.player.items = ['chronos_hourglass'];
  const chronoRes = useBattleItem(state, 0);
  assert.equal(chronoRes.state.player.mana, 15);
  assert.equal(chronoRes.state.player.hand.length, 12);

  // Unequipping Crown in sanctuary clamps mana safely back to base maxMana
  state.phase = 'sanctuary';
  state.player.mana = 15;
  state = unequipRelic(state, 'crown_of_eternity_100');
  assert.equal(getMaxMana(state.player), 12);
  assert.equal(state.player.mana, 12);
});

test('Endgame Rebalance (Option 1): progressive EXP >Lv80, 10,000 HP Floor 100 boss, tower resonance/mana regen, and legacy save migration', () => {
  // 1. EXP curve stays identical for Lv 1-80 and scales +10/lv above Lv 80
  assert.equal(nextExpForLevel(1), 25);
  assert.equal(nextExpForLevel(24), 25);
  assert.equal(nextExpForLevel(25), 55);
  assert.equal(nextExpForLevel(80), 55);
  assert.equal(nextExpForLevel(81), 65);
  assert.equal(nextExpForLevel(100), 255);

  // Simulate 1x full clear of all 250 rooms (Floor 1 -> 100)
  const sim = createRun('exp-curve-audit');
  let totalExp = 0;
  for (const roomEnemies of sim.rooms) {
    for (const kind of roomEnemies) totalExp += ENEMIES[kind].exp;
  }
  applyExpAndGold(sim.player, totalExp, 0);
  assert.ok(sim.player.level >= 165 && sim.player.level <= 185, `1x clear Floor 1-100 level (${sim.player.level}) should land around ~175 (down from 600+)`);
  assert.ok(sim.player.maxHp >= 540 && sim.player.maxHp <= 600, `1x clear Floor 1-100 maxHp (${sim.player.maxHp}) should land around ~573 (down from 1,400+)`);

  // 2. Boss HP milestones & Floor 100 = 10,000 HP
  assert.equal(ENEMIES.volcano_colossus.hp, 1500);
  assert.equal(ENEMIES.thunder_drake_emperor.hp, 2800);
  assert.equal(ENEMIES.ancient_chitin_behemoth.hp, 4600);
  assert.equal(ENEMIES.nether_dread_lord.hp, 7000);
  assert.equal(ENEMIES.eternity_overlord.hp, 10000);

  // 3. Tower Spell Resonance & Turn Mana Regen keep Floors 1-50 unchanged and ramp Floors 51-100
  assert.equal(getTowerSpellBonus(0), 0);
  assert.equal(getTowerSpellBonus(74), 0);
  assert.equal(getTowerSpellBonus(75), 25);
  assert.equal(getTowerSpellBonus(FLOOR50_BOSS_ROOM), 25);
  assert.equal(getTowerSpellBonus(FLOOR60_BOSS_ROOM), 50);
  assert.equal(getTowerSpellBonus(FLOOR70_BOSS_ROOM), 80);
  assert.equal(getTowerSpellBonus(FLOOR80_BOSS_ROOM), 120);
  assert.equal(getTowerSpellBonus(FLOOR90_BOSS_ROOM), 170);
  assert.equal(getTowerSpellBonus(FLOOR100_BOSS_ROOM), 230);

  assert.equal(getTurnManaRegen(0), 3);
  assert.equal(getTurnManaRegen(FLOOR50_BOSS_ROOM), 3);
  assert.equal(getTurnManaRegen(FLOOR60_BOSS_ROOM), 4);
  assert.equal(getTurnManaRegen(FLOOR70_BOSS_ROOM), 5);
  assert.equal(getTurnManaRegen(FLOOR80_BOSS_ROOM), 6);
  assert.equal(getTurnManaRegen(FLOOR90_BOSS_ROOM), 7);
  assert.equal(getTurnManaRegen(FLOOR100_BOSS_ROOM), 8);

  // 4. Legacy mid-battle saves with pre-rebalance endgame HP migrate cleanly to new maxHp
  const storage = new MemoryStorage();
  const legacyF100 = createRun('legacy-f100-save');
  legacyF100.room = FLOOR100_BOSS_ROOM;
  legacyF100.enemies = legacyF100.rooms[FLOOR100_BOSS_ROOM].map(createEnemy);
  // Overwrite with pre-rebalance maxHp & 50% remaining HP
  legacyF100.enemies[0].maxHp = 880;
  legacyF100.enemies[0].hp = 440;
  legacyF100.enemies[1].maxHp = 145;
  legacyF100.enemies[1].hp = 145;
  legacyF100.enemies[2].maxHp = 135;
  legacyF100.enemies[2].hp = 135;
  legacyF100.enemies[3].maxHp = 128;
  legacyF100.enemies[3].hp = 64;
  storage.setItem(SAVE_KEY, JSON.stringify(legacyF100));

  const migrated = loadRun(storage);
  assert.equal(migrated.ok, true, `Legacy Floor 100 save should load cleanly: ${migrated.error}`);
  assert.equal(migrated.state.enemies[0].maxHp, 6500);
  assert.equal(migrated.state.enemies[0].hp, 3250);
  assert.equal(migrated.state.enemies[1].maxHp, 1380);
  assert.equal(migrated.state.enemies[1].hp, 1380);
  assert.equal(migrated.state.enemies[3].maxHp, 1080);
  assert.equal(migrated.state.enemies[3].hp, 540);
});

test('Floor 80 Boss (Abyssal Kraken): Phase 1 four distinct Water tentacles -> Phase 2 True Body, cooldowns, conductivity passive, and save roundtrip', () => {
  const storage = new MemoryStorage();
  const base = createRun('f80-kraken-test');
  base.room = FLOOR80_BOSS_ROOM;
  base.collection = ['lightning', 'akki', 'seal', 'wave'];
  base.player.words = ['shot', 'wave', 'fire', 'ice', 'lightning', 'akki', 'shield'];
  base.player.maxHp = 500;
  base.player.hp = 500;
  base.player.maxMana = 20;
  base.player.mana = 20;
  base.player.hand = ['shot', 'wave', 'fire', 'ice', 'lightning', 'akki', 'shield'];
  base.enemies = base.rooms[FLOOR80_BOSS_ROOM].map(createEnemy);
  base.turn = 1;
  prepareEnemies(base);

  // Phase 1: 4 Water tentacles, all marked isBoss (no minions)
  assert.equal(base.enemies.length, 4);
  for (const t of base.enemies) {
    assert.equal(ENEMIES[t.kind].affinity, 'water');
    assert.equal(ENEMIES[t.kind].isBoss, true);
  }

  // Turn 1 intents: Ward grants all, Heal attacks 34, Ink attacks 42, Crush attacks 52
  const t1Ward = intent(base.enemies[0], 1, base.enemies, FLOOR80_BOSS_ROOM);
  assert.equal(t1Ward.type, 'ward-grant-all');
  assert.equal(intent(base.enemies[1], 1, base.enemies, FLOOR80_BOSS_ROOM).amount, 34);
  const t1Ink = intent(base.enemies[2], 1, base.enemies, FLOOR80_BOSS_ROOM);
  assert.equal(t1Ink.type, 'attack');
  assert.equal(t1Ink.amount, 42);
  assert.ok(!t1Ink.manaDrain);
  assert.equal(intent(base.enemies[3], 1, base.enemies, FLOOR80_BOSS_ROOM).amount, 52);

  // Turn 1 execution: Ward tentacle grants +1 ward to ALL other live tentacles next turn
  const t1Res = simulateTurn(structuredClone(base), ['shield'], 'enemy-0');
  assert.equal(t1Res.ok, true);
  assert.equal(t1Res.state.enemies[0].ward, 1); // own base ward
  assert.equal(t1Res.state.enemies[1].ward, 1); // granted +1 ward
  assert.equal(t1Res.state.enemies[2].ward, 1); // granted +1 ward
  assert.equal(t1Res.state.enemies[3].ward, 1); // granted +1 ward

  // Seal blocks Ward tentacle's ward-grant-all
  const sealedWardState = structuredClone(base);
  sealedWardState.player.words = ['shot', 'seal', 'fire', 'ice', 'lightning', 'akki', 'shield'];
  sealedWardState.player.hand = ['shot', 'seal', 'fire', 'ice', 'lightning', 'akki', 'shield'];
  sealedWardState.enemies[0].ward = 0;
  const sealedRes = simulateTurn(sealedWardState, ['shot', 'fire', 'seal'], 'enemy-0');
  assert.equal(sealedRes.ok, true);
  assert.equal(sealedRes.state.enemies[1].ward, 0, 'Sealed ward tentacle must not grant ward');

  // Turn 2 intents & execution: Heal tentacle heals lowest HP% +220, Ink tentacle drains -2 MP, Crush charges
  const t2State = structuredClone(base);
  t2State.turn = 2;
  t2State.enemies[0].hp = 400; // injured target for heal tentacle
  t2State.enemies[1].ward = 0;
  prepareEnemies(t2State);
  assert.equal(intent(t2State.enemies[0], 2, t2State.enemies, FLOOR80_BOSS_ROOM).amount, 38);
  const t2HealIntent = intent(t2State.enemies[1], 2, t2State.enemies, FLOOR80_BOSS_ROOM);
  assert.equal(t2HealIntent.type, 'heal');
  assert.equal(t2HealIntent.amount, 220);
  const t2InkIntent = intent(t2State.enemies[2], 2, t2State.enemies, FLOOR80_BOSS_ROOM);
  assert.equal(t2InkIntent.type, 'attack');
  assert.equal(t2InkIntent.manaDrain, 2);
  assert.equal(intent(t2State.enemies[3], 2, t2State.enemies, FLOOR80_BOSS_ROOM).type, 'charge');

  const t2Res = simulateTurn(t2State, ['shield'], 'enemy-0');
  assert.equal(t2Res.ok, true);
  assert.equal(t2Res.state.enemies[0].hp, 620, 'Heal tentacle should heal injured tentacle by +220');
  assert.equal(t2Res.summary.manaDrained, 2, 'Ink tentacle should drain 2 MP on turn 2');
  // Check Akki halves the +220 heal to +110
  const t2Akki = structuredClone(t2State);
  t2Akki.enemies[0].ward = 0;
  t2Akki.enemies[0].hp = 400;
  const t2AkkiRes = simulateTurn(t2Akki, ['shot', 'akki'], 'enemy-0');
  assert.equal(t2AkkiRes.ok, true);
  const healEv = t2AkkiRes.events.find(e => e.type === 'heal' && e.target === 'enemy-0');
  assert.equal(healEv.amount, 110, 'Akki healCutUntil should halve +220 tentacle heal to +110');

  // Turn 3 Crush tentacle delivers 92 heavy crush
  assert.equal(intent(base.enemies[3], 3, base.enemies, FLOOR80_BOSS_ROOM).amount, 92);

  // Phase 1 -> Phase 2 transition via Spell: killing all 4 tentacles spawns abyssal_kraken (4600 HP)
  const phaseTriggerState = structuredClone(base);
  phaseTriggerState.magmaPuddles = [0, 1];
  for (const t of phaseTriggerState.enemies) {
    t.hp = 1;
    t.armor = 0;
    t.ward = 0;
  }
  const p2Res = simulateTurn(phaseTriggerState, ['wave', 'lightning'], 'enemy-0');
  assert.equal(p2Res.ok, true);
  assert.equal(p2Res.state.phase, 'battle', 'Killing 4 tentacles must NOT end the battle');
  assert.equal(p2Res.state.krakenPhase, 2);
  assert.equal(p2Res.state.enemies.length, 1);
  assert.equal(p2Res.state.enemies[0].kind, 'abyssal_kraken');
  assert.equal(p2Res.state.enemies[0].hp, 4600);
  assert.equal(p2Res.state.enemies[0].slot, 2);
  assert.equal(p2Res.state.magmaPuddles, undefined, 'Phase 2 surge should wash away magma puddles');
  assert.ok(p2Res.events.some(e => e.type === 'boss-phase' && e.sourceKind === 'abyssal_kraken'));

  // Phase 2 save/load roundtrip must succeed cleanly
  assert.equal(saveRun(p2Res.state, storage).ok, true);
  const loadedP2 = loadRun(storage);
  assert.equal(loadedP2.ok, true, `Phase 2 save should load cleanly: ${loadedP2.error}`);
  assert.equal(loadedP2.state.krakenPhase, 2);
  assert.equal(loadedP2.state.enemies[0].kind, 'abyssal_kraken');

  // Phase 1 -> Phase 2 transition via Battle Consumable Item (supernova_core)
  const itemTriggerState = structuredClone(base);
  itemTriggerState.player.items = ['supernova_core'];
  for (const t of itemTriggerState.enemies) {
    t.hp = 10;
    t.armor = 0;
    t.ward = 0;
  }
  const itemRes = useBattleItem(itemTriggerState, 0);
  assert.equal(itemRes.ok, true);
  assert.equal(itemRes.state.phase, 'battle', 'Consumable finishing 4 tentacles must trigger Phase 2');
  assert.equal(itemRes.state.krakenPhase, 2);
  assert.equal(itemRes.state.enemies[0].kind, 'abyssal_kraken');

  // Phase 2 Kraken 4-turn schedule & mechanics
  const krakenState = structuredClone(p2Res.state);
  krakenState.player.hand = ['shot', 'lightning', 'ice', 'akki', 'shield', 'fire'];
  krakenState.player.mana = 20;

  krakenState.turn = 1; prepareEnemies(krakenState);
  assert.equal(krakenState.enemies[0].armor, 5);
  assert.equal(krakenState.enemies[0].ward, 1);
  assert.equal(intent(krakenState.enemies[0], 1, krakenState.enemies, FLOOR80_BOSS_ROOM).amount, 72);

  krakenState.turn = 2; prepareEnemies(krakenState);
  assert.equal(krakenState.enemies[0].armor, 6);
  assert.equal(krakenState.enemies[0].ward, 0);
  const kT2Intent = intent(krakenState.enemies[0], 2, krakenState.enemies, FLOOR80_BOSS_ROOM);
  assert.equal(kT2Intent.amount, 58);
  assert.equal(kT2Intent.selfHeal, 120);

  // Turn 2 self-heal executes (+120 HP) and Akki halves it to +60 HP
  const kHealTest = structuredClone(krakenState);
  kHealTest.enemies[0].hp = 4000;
  const kHealRes = simulateTurn(kHealTest, ['shield'], 'enemy-0');
  assert.equal(kHealRes.state.enemies[0].hp, 4120);
  const kAkkiRes = simulateTurn(structuredClone(kHealTest), ['shot', 'akki'], 'enemy-0');
  const kSelfHealEv = kAkkiRes.events.find(e => e.type === 'heal' && e.target === 'enemy-0');
  assert.equal(kSelfHealEv.amount, 60, 'Akki should halve Kraken Turn 2 self-heal from 120 to 60');

  // Lightning conductivity passive: +15 true damage & -2 armor immediately + next turn (saves cleanly)
  const shockTest = structuredClone(krakenState);
  shockTest.turn = 2;
  prepareEnemies(shockTest);
  assert.equal(shockTest.enemies[0].armor, 6);
  const iceShot = simulateTurn(structuredClone(shockTest), ['shot', 'ice'], 'enemy-0');
  const lightningShot = simulateTurn(structuredClone(shockTest), ['shot', 'lightning'], 'enemy-0');
  assert.ok(lightningShot.summary.damage >= iceShot.summary.damage + 15, 'Lightning conductivity should add +15 bonus true damage');
  assert.equal(lightningShot.summary.enemyArmorAfterTurn['enemy-0'], 4, 'Lightning should shred Kraken armor by -2 immediately');
  assert.equal(lightningShot.state.enemies[0].abyssalShockUntil, 3);
  // Turn 3 base armor is 4, minus 2 from abyssalShockUntil => 2
  assert.equal(lightningShot.state.enemies[0].armor, 2);
  assert.equal(saveRun(lightningShot.state, storage).ok, true);
  assert.equal(loadRun(storage).state.enemies[0].abyssalShockUntil, 3);

  // Turn 3 charge & Turn 4 exposed (+35%) + Tsunami 108
  krakenState.turn = 3; prepareEnemies(krakenState);
  assert.equal(krakenState.enemies[0].armor, 4);
  assert.equal(krakenState.enemies[0].ward, 1);
  assert.equal(intent(krakenState.enemies[0], 3, krakenState.enemies, FLOOR80_BOSS_ROOM).type, 'charge');

  krakenState.turn = 4; prepareEnemies(krakenState);
  assert.equal(krakenState.enemies[0].armor, 0);
  assert.equal(krakenState.enemies[0].ward, 0);
  assert.equal(intent(krakenState.enemies[0], 4, krakenState.enemies, FLOOR80_BOSS_ROOM).amount, 108);

  const kT2Zero = structuredClone(krakenState);
  kT2Zero.turn = 2; kT2Zero.enemies[0].armor = 0; kT2Zero.enemies[0].ward = 0;
  const kT4Exp = structuredClone(kT2Zero);
  kT4Exp.turn = 4;
  const dmgKT2 = simulateTurn(kT2Zero, ['shot', 'ice'], 'enemy-0').summary.damage;
  const dmgKT4 = simulateTurn(kT4Exp, ['shot', 'ice'], 'enemy-0').summary.damage;
  assert.ok(dmgKT4 > dmgKT2, `Kraken Turn 4 exposed damage (${dmgKT4}) should exceed turn 2 (${dmgKT2})`);

  // Defeating Phase 2 Abyssal Kraken clears krakenPhase, drops gaia_emblem_80, and advances to post80 sanctuary
  const finishState = structuredClone(krakenState);
  finishState.turn = 4;
  finishState.enemies[0].hp = 1;
  finishState.enemies[0].armor = 0;
  finishState.enemies[0].ward = 0;
  const winRes = simulateTurn(finishState, ['shot', 'ice'], 'enemy-0');
  assert.equal(winRes.ok, true);
  assert.equal(winRes.state.krakenPhase, undefined);
  assert.equal(winRes.state.phase, 'sanctuary');
  assert.equal(winRes.state.sanctuaryFloor, 'post80');
  assert.ok(winRes.state.player.relics.includes('gaia_emblem_80'));
});

test('Floor 90★ Nether Dread Lord: Tri-Pillar Pact, 2-Path Phase 2 (Pact Broken vs Soul Sacrifice), Soul Drain, Purge & Save/Load', () => {
  const storage = new MemoryStorage();
  const base = createRun('floor90-nether-seed');
  base.room = FLOOR90_BOSS_ROOM;
  base.collection = ['beam', 'lightning', 'akki', 'seal'];
  base.player.maxHp = 2000;
  base.player.hp = 2000;
  base.player.maxMana = 20;
  base.player.words = ['shot', 'beam', 'ice', 'fire', 'lightning', 'akki', 'seal'];
  base.player.wordUpgrades = { shot: 10, beam: 10, ice: 10, fire: 10, lightning: 10 };
  enterRoom(base);
  base.player.hand = ['shot', 'beam', 'ice', 'fire', 'lightning', 'akki', 'seal'];
  base.player.mana = 20;

  assert.deepEqual(
    base.enemies.map(e => e.kind),
    ['nether_dread_lord', 'nether_leech_pillar', 'nether_curse_pillar', 'nether_doom_pillar'],
  );
  assert.equal(base.enemies[0].hp, 7000);
  assert.equal(base.enemies[0].armor, 5);
  assert.equal(base.enemies[0].ward, 2);
  assert.equal(base.netherPhase, undefined);
  // All 3 pillars are flagged isBoss so Void Singularity Flask cannot insta-delete them
  assert.ok(base.enemies.every(e => ENEMIES[e.kind].isBoss));

  // 1. Doom Pillar aura (+18 damage to Dread Lord) + 3-turn Doom Beam (88) cycle
  const t1BossIntent = intent(base.enemies[0], 1, base.enemies, FLOOR90_BOSS_ROOM);
  assert.equal(t1BossIntent.amount, 84 + 18, 'Doom Pillar alive must add +18 damage to Dread Lord');
  assert.equal(intent(base.enemies[3], 1, base.enemies, FLOOR90_BOSS_ROOM).amount, 52);
  assert.equal(intent(base.enemies[3], 2, base.enemies, FLOOR90_BOSS_ROOM).type, 'charge');
  assert.equal(intent(base.enemies[3], 3, base.enemies, FLOOR90_BOSS_ROOM).amount, 88);

  // Killing Doom Pillar removes the +18 damage aura immediately
  const noDoom = structuredClone(base);
  noDoom.enemies[3].hp = 0;
  assert.equal(intent(noDoom.enemies[0], 1, noDoom.enemies, FLOOR90_BOSS_ROOM).amount, 84);

  // 2. Leech Pillar odd-turn +180 HP boss heal (blocked by seal, halved by akki)
  const leechTest = structuredClone(base);
  leechTest.enemies[0].hp = 6000;
  assert.equal(intent(leechTest.enemies[1], 1, leechTest.enemies, FLOOR90_BOSS_ROOM).type, 'heal');
  assert.equal(intent(leechTest.enemies[1], 1, leechTest.enemies, FLOOR90_BOSS_ROOM).amount, 180);
  const leechHealRes = simulateTurn(structuredClone(leechTest), ['beam', 'ice'], 'enemy-2');
  const bossHealEv = leechHealRes.events.find(e => e.type === 'heal' && e.target === 'enemy-0');
  assert.equal(bossHealEv.amount, 180, 'Leech Pillar should heal Dread Lord +180 on odd turns');

  const leechSealRes = simulateTurn(structuredClone(leechTest), ['beam', 'ice', 'seal'], 'enemy-1');
  assert.ok(!leechSealRes.events.some(e => e.type === 'heal' && e.target === 'enemy-0'), 'Seal should block Leech Pillar heal');

  const leechAkkiRes = simulateTurn(structuredClone(leechTest), ['beam', 'akki'], 'enemy-0');
  const bossHalfHeal = leechAkkiRes.events.find(e => e.type === 'heal' && e.target === 'enemy-0');
  assert.equal(bossHalfHeal.amount, 90, 'Akki on boss should halve Leech Pillar heal from 180 to 90');

  // 3. Curse Pillar odd-turn +1 ward to boss, plus repeat-form -70% reduction & -8 HP curse backlash
  assert.equal(intent(base.enemies[2], 1, base.enemies, FLOOR90_BOSS_ROOM).type, 'ward-grant');
  assert.equal(intent(base.enemies[2], 2, base.enemies, FLOOR90_BOSS_ROOM).amount, 54);
  const curseTest = structuredClone(base);
  curseTest.enemies[0].armor = 0;
  curseTest.enemies[0].ward = 0;
  curseTest.enemies[0].readForm = 'beam';
  const repeatedRes = simulateTurn(structuredClone(curseTest), ['beam', 'ice'], 'enemy-0');
  const curseEv = repeatedRes.events.find(e => e.type === 'nether-curse');
  assert.ok(curseEv, 'Repeating readForm while Curse Pillar is alive must emit nether-curse backlash');
  assert.equal(curseEv.amount, 8);
  const freshTest = structuredClone(curseTest);
  freshTest.enemies[0].readForm = 'shot';
  const freshRes = simulateTurn(freshTest, ['beam', 'ice'], 'enemy-0');
  assert.ok(!freshRes.events.some(e => e.type === 'nether-curse'));
  assert.ok(repeatedRes.summary.damage < freshRes.summary.damage, 'Repeat form reduction -70% must lower damage while Curse Pillar lives');

  // Destroying Curse Pillar removes repeat-form reduction & nether-curse backlash
  const noCurse = structuredClone(curseTest);
  noCurse.enemies[2].hp = 0;
  const noCurseRepeat = simulateTurn(noCurse, ['beam', 'ice'], 'enemy-0');
  assert.ok(!noCurseRepeat.events.some(e => e.type === 'nether-curse'), 'Dead Curse Pillar must not trigger nether-curse');
  const noCurseFresh = structuredClone(noCurse);
  noCurseFresh.enemies[0].readForm = 'shot';
  assert.equal(noCurseRepeat.summary.damage, simulateTurn(noCurseFresh, ['beam', 'ice'], 'enemy-0').summary.damage);

  // 4. Tri-Pillar Pact damage scaling: 3 live (-75%) < 2 live (-50%) < 1 live (-25%) < 0 live (100%)
  const pactBase = structuredClone(base);
  pactBase.enemies[0].armor = 0;
  pactBase.enemies[0].ward = 0;
  pactBase.enemies[0].readForm = null;
  const dmg3 = simulateTurn(structuredClone(pactBase), ['beam', 'ice'], 'enemy-0').summary.damage;
  const p2 = structuredClone(pactBase); p2.enemies[1].hp = 0;
  const dmg2 = simulateTurn(p2, ['beam', 'ice'], 'enemy-0').summary.damage;
  const p1 = structuredClone(p2); p1.enemies[2].hp = 0;
  const dmg1 = simulateTurn(p1, ['beam', 'ice'], 'enemy-0').summary.damage;
  const p0 = structuredClone(p1); p0.enemies[3].hp = 0;
  const dmg0 = simulateTurn(p0, ['beam', 'ice'], 'enemy-0').summary.damage;
  assert.ok(dmg3 < dmg2 && dmg2 < dmg1 && dmg1 < dmg0, `Expected pact scaling dmg3(${dmg3}) < dmg2(${dmg2}) < dmg1(${dmg1}) < dmg0(${dmg0})`);

  // 5. Path A (Pact Broken): killing the last pillar while boss HP > 50% enters Phase 2 & exposes boss next turn (+35%, Armor 0, Ward 0)
  const pathA = structuredClone(base);
  pathA.turn = 1;
  pathA.enemies[1].hp = 0;
  pathA.enemies[2].hp = 0;
  pathA.enemies[3].hp = 1;
  pathA.enemies[3].armor = 0;
  pathA.enemies[3].ward = 0;
  const pathARes = simulateTurn(pathA, ['beam', 'fire'], 'enemy-3');
  assert.equal(pathARes.ok, true);
  assert.equal(pathARes.state.netherPhase, 2);
  assert.ok(pathARes.events.some(e => e.type === 'boss-phase' && e.sourceKind === 'nether_dread_lord' && e.mode === 'broken'));
  assert.equal(pathARes.state.enemies[0].netherExposedTurn, 2, 'Pact Broken must set netherExposedTurn = next turn');
  assert.equal(pathARes.state.enemies[0].armor, 0, 'Pact Broken exposed turn must drop Armor to 0');
  assert.equal(pathARes.state.enemies[0].ward, 0, 'Pact Broken exposed turn must drop Ward to 0');
  // Save & load cleanly with netherPhase & netherExposedTurn
  assert.equal(saveRun(pathARes.state, storage).ok, true);
  const loadedA = loadRun(storage);
  assert.equal(loadedA.ok, true, `Path A save should load cleanly: ${loadedA.error}`);
  assert.equal(loadedA.state.netherPhase, 2);
  assert.equal(loadedA.state.enemies[0].netherExposedTurn, 2);

  // Confirm +35% exposed bonus actually boosts spell damage on Turn 2
  const expT2 = structuredClone(pathARes.state);
  expT2.player.hand = ['shot', 'beam', 'ice', 'fire', 'lightning', 'akki', 'seal'];
  expT2.player.mana = 20;
  const normalT2 = structuredClone(expT2);
  delete normalT2.enemies[0].netherExposedTurn;
  const expDmg = simulateTurn(expT2, ['beam', 'ice'], 'enemy-0').summary.damage;
  const normDmg = simulateTurn(normalT2, ['beam', 'ice'], 'enemy-0').summary.damage;
  assert.ok(expDmg > normDmg, `Pact Broken exposed damage (${expDmg}) should exceed unexposed (${normDmg})`);

  // 6. Path B (Soul Sacrifice): pushing Dread Lord <= 50% HP while 2 pillars live sacrifices them for +700 HP (or +350 with akki)
  const pathB = structuredClone(base);
  pathB.enemies[1].hp = 0; // 2 pillars remain alive (curse + doom)
  pathB.enemies[0].hp = 3510;
  pathB.enemies[0].armor = 0;
  pathB.enemies[0].ward = 0;
  const pathBRes = simulateTurn(structuredClone(pathB), ['beam', 'ice'], 'enemy-0');
  assert.equal(pathBRes.state.netherPhase, 2);
  assert.equal(pathBRes.state.enemies[2].hp, 0, 'Curse Pillar must be sacrificed');
  assert.equal(pathBRes.state.enemies[3].hp, 0, 'Doom Pillar must be sacrificed');
  assert.ok(pathBRes.events.some(e => e.type === 'boss-phase' && e.sourceKind === 'nether_dread_lord' && e.mode === 'sacrifice'));
  const sacHeal = pathBRes.events.find(e => e.type === 'heal' && e.target === 'enemy-0' && e.amount === 700);
  assert.ok(sacHeal, 'Sacrificing 2 live pillars must heal Dread Lord +700 HP');
  assert.equal(pathBRes.state.enemies[0].netherExposedTurn, undefined, 'Sacrifice path must NOT grant Pact Broken exposed bonus');

  // Akki halves Soul Sacrifice healing (700 -> 350)
  const pathBAkki = simulateTurn(structuredClone(pathB), ['beam', 'akki'], 'enemy-0');
  const sacHalfHeal = pathBAkki.events.find(e => e.type === 'heal' && e.target === 'enemy-0' && e.amount === 350);
  assert.ok(sacHalfHeal, 'Akki must halve Soul Sacrifice healing from 700 to 350');

  // 7. Phase 2 Overdrive Soul Drain (+150 HP on unblocked hit; 0 on full shield block; 0 when Fire/Lightning Purged) & Purge -2 armor
  const p2State = structuredClone(pathARes.state);
  p2State.turn = 2;
  p2State.player.hand = ['shot', 'beam', 'ice', 'fire', 'lightning', 'akki', 'seal'];
  p2State.player.mana = 20;
  delete p2State.enemies[0].netherExposedTurn;
  p2State.enemies[0].hp = 5000;
  prepareEnemies(p2State);
  assert.equal(p2State.enemies[0].armor, 6);
  const p2Intent = intent(p2State.enemies[0], 2, p2State.enemies, FLOOR90_BOSS_ROOM);
  assert.equal(p2Intent.amount, 70);
  assert.equal(p2Intent.soulDrain, 150);

  // Unpurged Ice hit -> boss hits player for 70 and drains +150 HP
  const drainRes = simulateTurn(structuredClone(p2State), ['beam', 'ice'], 'enemy-0');
  const drainEv = drainRes.events.find(e => e.type === 'heal' && e.target === 'enemy-0');
  assert.equal(drainEv?.amount, 150, 'Phase 2 unblocked hit should trigger +150 HP Soul Drain');

  // Full shield block -> 0 actual damage -> 0 Soul Drain
  const shieldedP2 = structuredClone(p2State);
  shieldedP2.player.shield = { layers: [200], expires: 99, effect: null, triggered: false };
  const blockedRes = simulateTurn(shieldedP2, ['beam', 'ice'], 'enemy-0');
  assert.ok(!blockedRes.events.some(e => e.type === 'heal' && e.target === 'enemy-0'), '100% shielded attack must NOT heal via Soul Drain');

  // Fire or Lightning hit -> Purge activates (shreds -2 armor immediately & next turn, disables Soul Drain, saves cleanly)
  const purgeRes = simulateTurn(structuredClone(p2State), ['beam', 'fire'], 'enemy-0');
  assert.equal(purgeRes.summary.enemyArmorAfterTurn['enemy-0'], 4, 'Fire Purge must shred -2 armor immediately (6 -> 4)');
  assert.equal(purgeRes.state.enemies[0].netherPurgeUntil, 3);
  assert.equal(purgeRes.state.enemies[0].armor, 2, 'Turn 3 base armor 4 minus 2 from netherPurgeUntil => 2');
  assert.ok(!purgeRes.events.some(e => e.type === 'heal' && e.target === 'enemy-0'), 'Fire Purge must disable Phase 2 Soul Drain');
  assert.equal(saveRun(purgeRes.state, storage).ok, true);
  assert.equal(loadRun(storage).state.enemies[0].netherPurgeUntil, 3);

  // Lightning also triggers Purge
  const lightPurgeRes = simulateTurn(structuredClone(p2State), ['beam', 'lightning'], 'enemy-0');
  assert.equal(lightPurgeRes.state.enemies[0].netherPurgeUntil, 3);
  assert.ok(!lightPurgeRes.events.some(e => e.type === 'heal' && e.target === 'enemy-0'), 'Lightning Purge must disable Phase 2 Soul Drain');

  // 8. Defeating Nether Dread Lord clears netherPhase, drops void_annihilator_90, advances to post90 sanctuary
  const finish90 = structuredClone(p2State);
  finish90.turn = 4;
  prepareEnemies(finish90);
  finish90.enemies[0].hp = 1;
  const win90 = simulateTurn(finish90, ['beam', 'ice'], 'enemy-0');
  assert.equal(win90.ok, true);
  assert.equal(win90.state.netherPhase, undefined);
  assert.equal(win90.state.phase, 'sanctuary');
  assert.equal(win90.state.sanctuaryFloor, 'post90');
  assert.ok(win90.state.player.relics.includes('void_annihilator_90'));
});

test('Floor 100★★★ Eternity Overlord: 3-Phase Tri-Cycle (Council, Prism Shift, Secret Resurrection Eternity Reborn) & Save/Load', () => {
  const storage = new MemoryStorage();
  const base = createRun('floor100-eternity-seed');
  base.room = FLOOR100_BOSS_ROOM;
  base.collection = ['beam', 'wave', 'lightning', 'akki', 'seal', 'water', 'earth', 'wind'];
  base.player.level = 100;
  base.player.maxHp = 2400;
  base.player.hp = 2400;
  base.player.maxMana = 24;
  base.player.words = ['shot', 'beam', 'fire', 'water', 'earth', 'wind', 'shield'];
  base.player.wordUpgrades = { shot: 10, beam: 10, fire: 10, water: 10, earth: 10, wind: 10, shield: 10 };
  enterRoom(base);
  base.player.hand = ['shot', 'beam', 'fire', 'water', 'earth', 'wind', 'shield'];
  base.player.mana = 24;

  // Phase 1 initial lineup & stats preserved
  assert.deepEqual(
    base.enemies.map(e => e.kind),
    ['eternity_overlord', 'zenith_templar', 'chronos_keeper', 'chaos_weaver'],
  );
  assert.equal(base.enemies[0].hp, 6500);
  assert.equal(base.enemies[0].armor, 6);
  assert.equal(base.enemies[0].ward, 2);
  assert.equal(base.eternityPhase, undefined);

  // 1. Phase 1 Council Synergy: 3 allies => -45% damage taken on boss, Turn 2 +10/ally attack bonus
  const councilHit = simulateTurn(structuredClone(base), ['beam', 'fire'], 'enemy-0');
  const soloBoss = structuredClone(base);
  for (let i = 1; i < soloBoss.enemies.length; i++) soloBoss.enemies[i].hp = 0;
  const soloHit = simulateTurn(soloBoss, ['beam', 'fire'], 'enemy-0');
  assert.ok(
    councilHit.summary.damage < soloHit.summary.damage,
    `3 live council retainers should reduce boss damage (${councilHit.summary.damage}) below solo (${soloHit.summary.damage})`,
  );

  // Turn 2 Council Attack Bonus (+10 per live ally)
  const t2Council = structuredClone(base);
  t2Council.turn = 2;
  prepareEnemies(t2Council);
  assert.equal(t2Council.enemies[0].armor, 8);
  assert.equal(t2Council.enemies[0].ward, 0);
  assert.equal(intent(t2Council.enemies[0], 2, t2Council.enemies, FLOOR100_BOSS_ROOM).amount, 82 + 30);

  // chronos_keeper odd-turn ward-grant in Room 249 (blockable by seal)
  const chronosT1 = intent(base.enemies[2], 1, base.enemies, FLOOR100_BOSS_ROOM);
  assert.equal(chronosT1.type, 'ward-grant', 'Chronos Keeper must grant ward on odd turns in Floor 100');
  const sealedChronos = structuredClone(base);
  sealedChronos.enemies[2].sealed = true;
  assert.equal(intent(sealedChronos.enemies[2], 1, sealedChronos.enemies, FLOOR100_BOSS_ROOM).type, 'sealed');

  // 2. Phase 1 -> Phase 2 Transition at 3,000 HP
  const p2Trigger = structuredClone(base);
  p2Trigger.enemies[0].hp = 3005;
  p2Trigger.enemies[0].ward = 0;
  const p2Res = simulateTurn(p2Trigger, ['beam', 'fire'], 'enemy-0');
  assert.equal(p2Res.ok, true);
  assert.equal(p2Res.state.eternityPhase, 2);
  assert.equal(p2Res.state.enemies[0].hp, 3000);
  assert.equal(p2Res.events.find(event => event.eternity?.phase === 2).eternity.remaining, 6500);
  assert.ok(p2Res.events.some(e => e.type === 'boss-phase' && e.sourceKind === 'eternity_overlord' && e.mode === 'prism'));
  assert.ok(p2Res.state.enemies.slice(1).every(e => e.hp === 0), 'Phase 2 transition must dismiss remaining council retainers');
  assert.ok(p2Res.state.enemies[0].ward >= 2, 'Phase 2 transition must grant +2 ward (capped at 3)');

  // Phase 2 save/load roundtrip
  assert.equal(saveRun(p2Res.state, storage).ok, true);
  const loadedP2 = loadRun(storage);
  assert.equal(loadedP2.ok, true, `Floor 100 Phase 2 save should load cleanly: ${loadedP2.error}`);
  assert.equal(loadedP2.state.eternityPhase, 2);

  // 3. Phase 2 Rotating Elemental Prism Affinity (Turn 1 fire, 2 ice, 3 lightning, 4 earth)
  const prismState = structuredClone(p2Res.state);
  prismState.player.hand = ['shot', 'beam', 'water', 'fire', 'earth', 'wind', 'shield'];
  prismState.player.mana = 24;
  prismState.enemies[0].hp = 2500;
  for (const [t, expectedAff] of [[1, 'fire'], [2, 'ice'], [3, 'lightning'], [4, 'earth']]) {
    prismState.turn = t;
    prepareEnemies(prismState);
    assert.equal(prismState.enemies[0].affinity, expectedAff, `Phase 2 Turn ${t} affinity should be ${expectedAff}`);
  }

  // Phase 2 Ward Astral Reflection (cosmic-echo 10 dmg) when projectile hits Ward
  const echoTest = structuredClone(prismState);
  echoTest.turn = 1;
  prepareEnemies(echoTest);
  assert.equal(echoTest.enemies[0].ward, 2);
  const echoRes = simulateTurn(echoTest, ['shot', 'water'], 'enemy-0');
  const echoEv = echoRes.events.find(e => e.type === 'cosmic-echo');
  assert.ok(echoEv, 'Projectile hitting Phase 2 Ward must emit cosmic-echo');
  assert.equal(echoEv.rawAttack, 10);

  // Phase 2 Prism Shatter: hitting current weakness (Turn 1 fire -> water) deals +60 true dmg, -3 armor immediately & next turn, -1 ward
  const shatterState = structuredClone(prismState);
  shatterState.turn = 1;
  prepareEnemies(shatterState); // fire affinity, armor 6, ward 2
  const normalBeam = simulateTurn(structuredClone(shatterState), ['beam', 'wind'], 'enemy-0'); // neutral vs fire
  const shatterBeam = simulateTurn(structuredClone(shatterState), ['beam', 'water'], 'enemy-0'); // weak vs fire
  assert.ok(
    shatterBeam.summary.damage >= normalBeam.summary.damage + 60,
    `Phase 2 Prism Shatter (${shatterBeam.summary.damage}) must include +60 bonus true damage over neutral (${normalBeam.summary.damage})`,
  );
  assert.equal(shatterBeam.summary.enemyArmorAfterTurn['enemy-0'], 3, 'Prism Shatter must shred -3 armor immediately (6 -> 3)');
  assert.equal(shatterBeam.state.enemies[0].eternityShatterUntil, 2);
  assert.equal(shatterBeam.state.enemies[0].armor, 5, 'Turn 2 base armor 8 minus 3 from eternityShatterUntil => 5');
  assert.ok(shatterBeam.events.some(e => e.type === 'dispel' && e.amount === 1), 'Prism Shatter must strip -1 ward');
  assert.equal(saveRun(shatterBeam.state, storage).ok, true);
  assert.equal(loadRun(storage).state.enemies[0].eternityShatterUntil, 2);

  // 4. Secret Phase 3 Resurrection ("นิรันดร์กาลจุติ!") via Spell AND via Consumable Item
  const p3Trigger = structuredClone(prismState);
  p3Trigger.turn = 2;
  prepareEnemies(p3Trigger);
  p3Trigger.enemies[0].hp = 1;
  p3Trigger.enemies[0].armor = 0;
  p3Trigger.enemies[0].ward = 0;
  p3Trigger.player.hp = 1000;
  p3Trigger.player.mana = 12;
  p3Trigger.magmaPuddles = [0, 2];

  const p3Res = simulateTurn(p3Trigger, ['beam', 'fire'], 'enemy-0');
  assert.equal(p3Res.ok, true);
  assert.equal(p3Res.state.phase, 'battle', 'Killing eternity_overlord must NOT end battle — Secret Phase 3 must resurrect!');
  assert.equal(p3Res.state.eternityPhase, 3);
  assert.equal(p3Res.state.enemies.length, 1);
  assert.equal(p3Res.state.enemies[0].kind, 'eternity_reborn');
  assert.equal(p3Res.state.enemies[0].hp, 3500);
  assert.equal(p3Res.state.enemies[0].slot, 2);
  assert.equal(p3Res.state.magmaPuddles, undefined, 'Phase 3 resurrection should clear magma puddles');
  const p3PhaseEv = p3Res.events.find(e => e.type === 'boss-phase' && e.sourceKind === 'eternity_reborn' && e.mode === 'reborn');
  assert.ok(p3PhaseEv, 'Phase 3 resurrection must emit boss-phase event with mode reborn');
  // Tower Resonance Mercy Blessing: +25% maxHp & full mana
  assert.equal(p3PhaseEv.mercyHeal, Math.ceil(p3Res.state.player.maxHp * 0.25), 'Phase 3 resurrection should grant +25% maxHp Mercy Blessing');
  assert.ok(p3Res.state.player.hp >= 1600, 'Phase 3 resurrection should heal player from 1000 by at least +600 HP');
  assert.equal(p3Res.state.player.mana, p3Res.state.player.maxMana, 'Phase 3 resurrection should restore full mana');

  // Phase 3 save/load roundtrip
  assert.equal(saveRun(p3Res.state, storage).ok, true);
  const loadedP3 = loadRun(storage);
  assert.equal(loadedP3.ok, true, `Floor 100 Phase 3 save should load cleanly: ${loadedP3.error}`);
  assert.equal(loadedP3.state.eternityPhase, 3);
  assert.equal(loadedP3.state.enemies[0].kind, 'eternity_reborn');

  // Phase 3 trigger via Battle Consumable Item (supernova_core)
  const itemTrigger = structuredClone(prismState);
  itemTrigger.enemies[0].hp = 10;
  itemTrigger.enemies[0].armor = 0;
  itemTrigger.enemies[0].ward = 0;
  itemTrigger.player.items = ['supernova_core'];
  const itemP3 = useBattleItem(itemTrigger, 0);
  assert.equal(itemP3.ok, true);
  assert.equal(itemP3.state.phase, 'battle', 'Consumable killing Phase 2 Overlord must trigger Secret Phase 3');
  assert.equal(itemP3.state.eternityPhase, 3);
  assert.equal(itemP3.state.enemies[0].kind, 'eternity_reborn');

  // 5. Phase 3 Eternity Reborn 4-Turn Cosmic Climax Mechanics
  const rebornState = structuredClone(p3Res.state);
  rebornState.player.hand = ['shot', 'beam', 'water', 'fire', 'earth', 'wind', 'shield'];
  rebornState.player.mana = 24;

  // Turn 1: fire affinity, Armor 6, Ward 2, 124 + manaDrain 2
  rebornState.turn = 1;
  prepareEnemies(rebornState);
  assert.equal(rebornState.enemies[0].affinity, 'fire');
  assert.equal(rebornState.enemies[0].armor, 6);
  assert.equal(rebornState.enemies[0].ward, 2);
  const rT1Intent = intent(rebornState.enemies[0], 1, rebornState.enemies, FLOOR100_BOSS_ROOM);
  assert.equal(rT1Intent.amount, 124);
  assert.equal(rT1Intent.manaDrain, 2);
  const rT1Res = simulateTurn(structuredClone(rebornState), ['shield'], 'enemy-0');
  assert.equal(rT1Res.summary.manaDrained, 2, 'Eternity Reborn Turn 1 must drain 2 MP');

  // Turn 2: ice affinity, Armor 7, Ward 1, 112 + Chronos Rewind +400 HP (halved by akki, cancelled to 0 by Prism Shatter!)
  rebornState.turn = 2;
  prepareEnemies(rebornState);
  assert.equal(rebornState.enemies[0].affinity, 'ice');
  assert.equal(rebornState.enemies[0].armor, 7);
  assert.equal(rebornState.enemies[0].ward, 1);
  const rT2Intent = intent(rebornState.enemies[0], 2, rebornState.enemies, FLOOR100_BOSS_ROOM);
  assert.equal(rT2Intent.amount, 112);
  assert.equal(rT2Intent.chronoRewind, 400);

  const rewindUnshattered = structuredClone(rebornState);
  rewindUnshattered.enemies[0].hp = 2500;
  const rewindRes = simulateTurn(rewindUnshattered, ['shield'], 'enemy-0');
  assert.equal(rewindRes.state.enemies[0].hp, 2900, 'Turn 2 Chronos Rewind must heal +400 HP when unshattered');

  // Prism Shatter on Turn 2 (ice -> fire) deals +100 true dmg, -3 armor, -1 ward AND cancels Chronos Rewind (+0 HP)
  const rewindShatter = structuredClone(rebornState);
  rewindShatter.enemies[0].hp = 2500;
  const rNeutral = simulateTurn(structuredClone(rewindShatter), ['beam', 'water'], 'enemy-0');
  const rShattered = simulateTurn(structuredClone(rewindShatter), ['beam', 'fire'], 'enemy-0');
  assert.ok(
    rShattered.summary.damage >= rNeutral.summary.damage + 100,
    `Phase 3 Prism Shatter (${rShattered.summary.damage}) must include +100 bonus true damage over neutral (${rNeutral.summary.damage})`,
  );
  assert.equal(rShattered.summary.enemyArmorAfterTurn['enemy-0'], 4, 'Phase 3 Prism Shatter must shred -3 armor (7 -> 4)');
  assert.ok(
    !rShattered.events.some(e => e.type === 'heal' && e.target === 'enemy-0'),
    'Prism Shatter on Turn 2 must completely cancel Chronos Rewind +400 HP heal',
  );

  // Turn 3: lightning affinity, Armor 5, Ward 2, Charge Supernova 188
  rebornState.turn = 3;
  prepareEnemies(rebornState);
  assert.equal(rebornState.enemies[0].affinity, 'lightning');
  assert.equal(rebornState.enemies[0].armor, 5);
  assert.equal(rebornState.enemies[0].ward, 2);
  assert.equal(intent(rebornState.enemies[0], 3, rebornState.enemies, FLOOR100_BOSS_ROOM).type, 'charge');

  // Turn 4: earth affinity, Armor 0, Ward 0, Supernova 188 + Exposed +50% (boosted above +35%)
  rebornState.turn = 4;
  prepareEnemies(rebornState);
  assert.equal(rebornState.enemies[0].affinity, 'earth');
  assert.equal(rebornState.enemies[0].armor, 0);
  assert.equal(rebornState.enemies[0].ward, 0);
  assert.equal(intent(rebornState.enemies[0], 4, rebornState.enemies, FLOOR100_BOSS_ROOM).amount, 188);

  const rBaseT2 = structuredClone(rebornState);
  rBaseT2.turn = 2; rBaseT2.enemies[0].affinity = 'earth'; rBaseT2.enemies[0].armor = 0; rBaseT2.enemies[0].ward = 0;
  const rExpT4 = structuredClone(rBaseT2);
  rExpT4.turn = 4;
  const dmgBase = simulateTurn(rBaseT2, ['beam', 'water'], 'enemy-0').summary.damage;
  const dmgExp = simulateTurn(rExpT4, ['beam', 'water'], 'enemy-0').summary.damage;
  assert.equal(dmgExp, Math.round(dmgBase * 1.5), `Phase 3 Turn 4 exposed (+50%) should scale ${dmgBase} -> ${Math.round(dmgBase * 1.5)}, got ${dmgExp}`);

  // No repeatReduction on Eternity Reborn (all-out finale)
  assert.equal(ENEMIES.eternity_reborn.repeatReduction, undefined);

  // 6. True Victory: Defeating eternity_reborn clears eternityPhase, grants crown_of_eternity_100, sets phase = 'won'
  const finish100 = structuredClone(rebornState);
  finish100.turn = 4;
  prepareEnemies(finish100);
  finish100.enemies[0].hp = 1;
  const win100 = simulateTurn(finish100, ['beam', 'wind'], 'enemy-0');
  assert.equal(win100.ok, true);
  assert.equal(win100.state.eternityPhase, undefined);
  assert.equal(win100.state.phase, 'won');
  assert.ok(win100.state.player.relics.includes('crown_of_eternity_100'));
  assert.equal(saveRun(win100.state, storage).ok, true);
  assert.equal(loadRun(storage).state.phase, 'won');
});





