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
} from '../src/run.js';
import { simulateTurn } from '../src/combat.js';
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
import { saveRun, loadRun } from '../src/save.js';

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
  assert.deepEqual(state.rooms[FLOOR80_BOSS_ROOM], ['ancient_chitin_behemoth', 'venom_spore_beast', 'crag_titan_sentinel', 'venom_spore_beast']);
  assert.deepEqual(state.rooms[FLOOR90_BOSS_ROOM], ['nether_dread_lord', 'dread_reaper', 'void_devourer', 'dread_reaper']);
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

test('Endgame Monsters: All 30 monsters have authentic stats, traits, and Canvas 2D silhouettes', () => {
  const enemyKeys = Object.keys(ENDGAME_ENEMIES);
  assert.equal(enemyKeys.length, 30);
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

  // Verify large boss kinds includes all 5 major endgame bosses
  const expectedBosses = ['volcano_colossus', 'thunder_drake_emperor', 'ancient_chitin_behemoth', 'nether_dread_lord', 'eternity_overlord'];
  for (const b of expectedBosses) {
    assert.ok(LARGE_BOSS_KINDS.has(b), `LARGE_BOSS_KINDS must have ${b}`);
  }
});

test('Endgame Boss Intents: Bosses 60, 70, 80, 90, 100 charge and heavy strike mechanics', () => {
  const b60 = createEnemy('volcano_colossus');
  const b70 = createEnemy('thunder_drake_emperor');
  const b80 = createEnemy('ancient_chitin_behemoth');
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
    createEnemy('zenith_templar', 0), // non-boss, 145 HP, 5 armor
    createEnemy('volcano_colossus', 1), // boss, 580 HP, 5 armor
  ];

  const res = useBattleItem(state, 0);
  assert.equal(res.ok, true);
  assert.equal(res.state.enemies[0].hp, 0);
  assert.equal(res.state.enemies[1].hp, 580 - 45);
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

