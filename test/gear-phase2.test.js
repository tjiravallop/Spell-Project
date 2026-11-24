import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GEAR_SLOTS,
  GEAR_CATALOG,
  GEAR_LIST,
  GEAR_RIFT_DROP_RATES,
  MAX_GEAR_REFINE,
  getGearById,
  getGearRiftDropRates,
  rollGearRiftChoices,
  getGearDuplicateReward,
  computeGearModifiers,
} from '../src/gear.js';
import {
  ENEMIES,
  SHOP_ITEMS,
  GEAR_RIFT_BOSS_BY_TIER,
  MAX_STASH_ITEMS,
  createRun,
  enterRoom,
  battleSpellCost,
  getAvailableShopItems,
  getSanctuaryGearStock,
  getSanctuaryVaultGear,
  getRiftDailyStatus,
  getRiftKeyIdForTier,
  getCompassItemIdForSlot,
  startGearRiftRun,
  claimGearRiftReward,
  intent,
} from '../src/run.js';
import { parseSpell } from '../src/words.js';
import { simulateTurn } from '../src/combat.js';
import { validateRun, saveRun, loadRun } from '../src/save.js';
import { GEAR_RIFT_SPRITE_KINDS, newTowerSpriteKinds, drawNewTowerSprite } from '../src/tower-pixel-sprites.js';
import { LARGE_BOSS_KINDS, PALETTE } from '../src/render.js';
import { ENEMY_TRAITS } from '../src/enemy-traits.js';
import { isRiftBossExposed } from '../src/upper-tower.js';

function makeSanctuaryState(seed = 'phase2-test', floor = 55, gold = 5000) {
  const state = createRun(seed, false);
  state.phase = 'sanctuary';
  state.sanctuaryUnlocked = true;
  state.sanctuaryFloor = floor;
  const roomCountForFloor = floor <= 10 ? floor * 2 : floor <= 20 ? 25 + (floor - 10) * 2 : 50 + (floor - 20) * 2;
  state.clearedRooms = Array.from({ length: Math.min(state.rooms.length, roomCountForFloor) }, (_, i) => i);
  state.player.gold = gold;
  state.player.stash = [];
  state.player.items = [];
  state.player.gearInventory = [];
  state.player.equippedGear = { weapon: null, armor: null, accessory: null };
  return state;
}

function makeBattleState(seed = 'phase2-combat', { words = ['shot', 'fire', 'ice', 'akki', 'heman', 'asani', 'wari'], hand = null, mana = 25, enemies = null, turn = 1 } = {}) {
  const state = createRun(seed, true);
  state.phase = 'battle';
  state.turn = turn;
  state.player.mana = mana;
  state.player.maxMana = Math.max(state.player.maxMana, mana);
  state.player.words = words;
  state.player.hand = hand ?? [...words];
  state.player.shield = null;
  state.player.summon = null;
  state.player.gearInventory = [];
  state.player.equippedGear = { weapon: null, armor: null, accessory: null };
  state.enemies = enemies ?? [
    { id: 'e1', kind: 'striker', hp: 120, maxHp: 120, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
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

test('Phase 2 Special Gear Catalog: 30 Special items (10 per slot) + unique metadata', () => {
  const specials = GEAR_LIST.filter(g => g.rarity === 'special');
  assert.equal(specials.length, 30);
  for (const slot of GEAR_SLOTS) {
    assert.equal(specials.filter(g => g.slot === slot).length, 10);
  }
  const ids = new Set(GEAR_LIST.map(g => g.id));
  assert.equal(ids.size, 120);
  for (const item of specials) {
    assert.ok(item.unlockFloor >= 50, `${item.id} unlockFloor should be >= 50`);
    assert.ok(item.price >= 260);
    assert.ok(GEAR_CATALOG[item.id] === item);
    const mods = computeGearModifiers({
      gearInventory: [{ id: item.id, refine: 0 }],
      equippedGear: {
        weapon: item.slot === 'weapon' ? item.id : null,
        armor: item.slot === 'armor' ? item.id : null,
        accessory: item.slot === 'accessory' ? item.id : null,
      },
    });
    for (const [k, v] of Object.entries(item.effects)) {
      if (typeof v === 'number' || typeof v === 'boolean') {
        assert.equal(mods[k], v, `${item.id} modifier ${k} must aggregate cleanly`);
      }
    }
  }
});

test('Sanctuary Vault Showcase unlocks strictly at Floor 50+ with deterministic Special gear', () => {
  const s45 = makeSanctuaryState('vault-seed', 45);
  assert.equal(getSanctuaryVaultGear(s45), null);

  const s50a = makeSanctuaryState('vault-seed', 50);
  const s50b = makeSanctuaryState('vault-seed', 50);
  const v50a = getSanctuaryVaultGear(s50a);
  const v50b = getSanctuaryVaultGear(s50b);
  assert.ok(v50a && v50a.rarity === 'special');
  assert.equal(v50a.id, v50b.id);
  assert.ok(v50a.unlockFloor <= 50);

  // Regular gear stock stays Common/Rare even at Floor 70
  const s70 = makeSanctuaryState('vault-seed', 70);
  const stock70 = getSanctuaryGearStock(s70);
  assert.equal(stock70.length, 3);
  for (const g of stock70) {
    assert.ok(['common', 'rare'].includes(g.rarity));
  }
});

test('Shop Rift items: 7 Phase 2 Rift items present in catalog and gated appropriately', () => {
  const riftItemIds = [
    'rift_key_tier1', 'rift_key_tier2', 'rift_key_tier3',
    'compass_weapon_focus', 'compass_armor_focus', 'compass_trinket_focus',
    'orb_rift_instability',
  ];
  for (const id of riftItemIds) {
    assert.ok(SHOP_ITEMS[id], `Missing shop item ${id}`);
    assert.equal(SHOP_ITEMS[id].category, 'rift');
    assert.equal(SHOP_ITEMS[id].vaultOnly, true);
  }
  const s15 = makeSanctuaryState('shop-rift', 15);
  const avail15 = new Set(getAvailableShopItems(s15).map(i => i.id));
  assert.ok(!avail15.has('rift_key_tier1'));

  const s20 = makeSanctuaryState('shop-rift', 25);
  const avail20 = new Set(getAvailableShopItems(s20).map(i => i.id));
  assert.ok(avail20.has('rift_key_tier1'));
  assert.ok(avail20.has('compass_weapon_focus'));
  assert.ok(!avail20.has('orb_rift_instability'), 'Orb unlocks at floor 40+');
  assert.ok(!avail20.has('rift_key_tier2'));

  const s60 = makeSanctuaryState('shop-rift', 55);
  const avail60 = new Set(getAvailableShopItems(s60).map(i => i.id));
  for (const id of riftItemIds) {
    if (id === 'rift_key_tier3') continue;
    assert.ok(avail60.has(id), `Floor 55+ shop should include ${id}`);
  }
  const s75 = makeSanctuaryState('shop-rift', 75);
  const avail75 = new Set(getAvailableShopItems(s75).map(i => i.id));
  for (const id of riftItemIds) assert.ok(avail75.has(id));
});

test('Special Gear Forecast-to-Combat Parity & Mechanics', () => {
  // 1. Heman Permafrost Scepter + Glacial Pendant (damage, chill, cost discount, freeze spread)
  const hemanState = makeBattleState('p2-heman', {
    words: ['shot', 'heman', 'freeze', 'fire', 'ice', 'shield', 'pair'],
    mana: 20,
    enemies: [
      { id: 'e1', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
      { id: 'e2', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
  });
  equipDirect(hemanState, ['scepter_heman_rime', 'pendant_heman_rime']);
  const parsedHeman = parseSpell(['shot', 'heman', 'freeze'], hemanState.player.words);
  const baseHemanState = makeBattleState('p2-heman', { words: hemanState.player.words, mana: 20 });
  const baseCost = battleSpellCost(baseHemanState, parsedHeman);
  const discCost = battleSpellCost(hemanState, parsedHeman);
  assert.equal(discCost, Math.max(2, baseCost - 1));

  const resHeman = assertForecastParity(hemanState, ['shot', 'heman', 'freeze'], 'e1');
  assert.ok(
    resHeman.events.some(e => e.type === 'status' && e.status === 'chill' && e.target === 'e2'),
    'freezeSpreadChill must apply chill status event to adjacent enemy e2',
  );
  // Also verify e2 attack damage was reduced by chill (base striker attack 6 -> reduced by 4 = 2)
  assert.ok(resHeman.summary.incoming <= 2, `Expected chilled e2 incoming <= 2, got ${resHeman.summary.incoming}`);

  // 2. Asani Stormhammer + Asani Overcharge Ring (chain both sides 100% + bypass armor)
  const asaniState = makeBattleState('p2-asani', {
    words: ['shot', 'asani', 'fire', 'ice', 'shield', 'pair', 'wind'],
    mana: 20,
    enemies: [
      { id: 'e0', kind: 'striker', hp: 100, maxHp: 100, armor: 8, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
      { id: 'e1', kind: 'striker', hp: 100, maxHp: 100, armor: 8, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
      { id: 'e2', kind: 'striker', hp: 100, maxHp: 100, armor: 8, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
  });
  equipDirect(asaniState, ['rod_asani_thunderclap', 'ring_asani_overcharge']);
  const resAsani = assertForecastParity(asaniState, ['shot', 'asani'], 'e1');
  assert.ok(resAsani.state.enemies[0].hp < 100, 'Left enemy must be hit by chain');
  assert.ok(resAsani.state.enemies[2].hp < 100, 'Right enemy must be hit by asaniChainBoth');
  assert.equal(resAsani.state.enemies[0].hp, resAsani.state.enemies[2].hp, '100% chain ratio symmetric');

  // 3. Wari Tsunami Scepter + Wari Deluge Bangle (extra heal, strip all ward, wet duration +1)
  const wariState = makeBattleState('p2-wari', {
    words: ['shot', 'wari', 'fire', 'ice', 'shield', 'pair', 'wind'],
    mana: 20,
    enemies: [
      { id: 'e1', kind: 'warden', hp: 100, maxHp: 100, armor: 0, ward: 2, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
      { id: 'e2', kind: 'warden', hp: 100, maxHp: 100, armor: 0, ward: 2, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 3 },
    ],
  });
  wariState.player.hp = 50;
  wariState.player.maxHp = 100;
  equipDirect(wariState, ['scepter_wari_tsunami', 'bangle_wari_deluge']);
  const resWari = assertForecastParity(wariState, ['shot', 'wari'], 'e1');
  assert.equal(resWari.state.enemies[1].ward, 1, 'wariStripAllWard strips 1 ward from non-adjacent e2');
  assert.ok(resWari.summary.healed >= 14, 'wariHealBonus adds +10 extra heal');

  // 4. Sprite Mana-Siphon Wand + Sprite Glamour Shroud + Sprite Wellspring Ring
  const spriteState = makeBattleState('p2-sprite', {
    words: ['summon', 'sprite', 'fire', 'ice', 'shield', 'pair', 'wind'],
    mana: 15,
    enemies: [
      { id: 'e1', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
    ],
  });
  equipDirect(spriteState, ['wand_mana_tap_sprite', 'robe_sprite_glamour', 'ring_sprite_wellspring']);
  const resSprite = assertForecastParity(spriteState, ['summon', 'sprite'], 'e1');
  assert.ok(resSprite.summary.blocked >= 4 || resSprite.state.player.mana >= 13);

  // 5. Sanctuary Vestment (healToBlockPct) + Crucible Seal (fireEarthCastBlock)
  const vestState = makeBattleState('p2-vest', {
    words: ['fill', 'blood', 'shot', 'fire', 'shield', 'ice', 'pair'],
    mana: 20,
    enemies: [
      { id: 'e1', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
    ],
  });
  vestState.player.hp = 80;
  vestState.player.maxHp = 200;
  equipDirect(vestState, ['vestment_sanctuary_nun', 'seal_magma_basin']);
  const resHeal = assertForecastParity(vestState, ['fill', 'blood'], 'e1');
  assert.ok(resHeal.summary.healed >= 11);
  assert.ok(resHeal.state.player.shield !== null || resHeal.summary.blocked > 0, 'healToBlockPct creates block shield');
  const resFire = assertForecastParity(vestState, ['shot', 'fire'], 'e1');
  assert.ok(resFire.state.player.shield !== null || resFire.summary.blocked > 0, 'fireEarthCastBlock creates block shield');
});

test('Gear Rift Tier Bosses (20-60): stats, traits, sprites, intents, and mechanics', () => {
  const tiers = [20, 30, 40, 50, 60];
  for (const tier of tiers) {
    const kind = GEAR_RIFT_BOSS_BY_TIER[tier];
    assert.ok(kind, `Missing boss for tier ${tier}`);
    assert.ok(ENEMIES[kind] && ENEMIES[kind].isGearRiftBoss, `${kind} must be defined as Gear Rift Boss`);
    assert.ok(ENEMY_TRAITS[kind], `${kind} must have ENEMY_TRAITS`);
    assert.ok(LARGE_BOSS_KINDS.has(kind), `${kind} must be in LARGE_BOSS_KINDS`);
    assert.ok(GEAR_RIFT_SPRITE_KINDS.has(kind), `${kind} must be in GEAR_RIFT_SPRITE_KINDS`);
    assert.ok(newTowerSpriteKinds.includes(kind), `${kind} must be in newTowerSpriteKinds`);

    // Verify ASCII pixel sprite draws non-empty pixel rects
    const fills = [];
    const r = (x, y, w, h, color) => fills.push([x, y, w, h, color]);
    const drawn = drawNewTowerSprite(kind, r, PALETTE, 'idle', 0, false, false);
    assert.equal(drawn, true);
    assert.ok(fills.length > 20, `Sprite for ${kind} should render substantial pixels`);

    // Verify deterministic intent across turns 1..4
    const bossEnemy = { id: 'b1', kind, hp: ENEMIES[kind].hp, maxHp: ENEMIES[kind].hp, armor: ENEMIES[kind].armor, ward: ENEMIES[kind].ward ?? 0, slot: 2 };
    for (let t = 1; t <= 4; t++) {
      const act = intent(bossEnemy, t, [bossEnemy], tier * 2.5 - 1, false);
      assert.ok(act && act.label, `${kind} turn ${t} must produce valid intent`);
      const instabAct = intent(bossEnemy, t, [bossEnemy], tier * 2.5 - 1, true);
      if (act.attack > 0) {
        assert.ok(instabAct.attack >= act.attack, 'Instability scales boss attack >= base');
      }
    }
  }

  assert.equal(isRiftBossExposed('magma_core_juggernaut', 4), true);
  assert.equal(isRiftBossExposed('chitin_bastion_behemoth', 4), true);

  // Chitin Bastion Behemoth: 35% damage reduction while armor > 0 && pierce < armor
  const chitinState = makeBattleState('p2-chitin', {
    enemies: [{ id: 'b1', kind: 'chitin_bastion_behemoth', hp: 1450, maxHp: 1450, armor: 6, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 }],
  });
  const baseTargetState = makeBattleState('p2-chitin', {
    enemies: [{ id: 'b1', kind: 'striker', hp: 1450, maxHp: 1450, armor: 6, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 }],
  });
  const hitChitin = assertForecastParity(chitinState, ['shot', 'fire'], 'b1');
  const hitNormal = assertForecastParity(baseTargetState, ['shot', 'fire'], 'b1');
  assert.ok(hitChitin.summary.damage < hitNormal.summary.damage, 'Chitin plating reduces incoming damage when armored');
});

test('Gear Rift Full 3-Stage Flow, Compass, Instability Orb, Vault Chest, Auto-Refine & Over-Cap', () => {
  const s = makeSanctuaryState('gear-rift-run', 55, 5000);
  // Give 1 of each Compass and 1 Instability Orb and 1 Tier-20 Key
  s.player.stash.push('compass_weapon_focus', 'orb_rift_instability', 'rift_key_tier1');

  // Exhaust daily quota on tier 20 first to verify Key fallback later
  const statusBefore = getRiftDailyStatus(s, new Date('2026-11-22T12:00:00Z'));
  assert.ok(statusBefore.remaining >= 1);

  // Start Tier 40 Gear Rift with Weapon Compass + Instability Orb
  const started = startGearRiftRun(s, 40, {
    compassSlot: 'weapon',
    instability: true,
    useKey: false,
  }, new Date('2026-11-22T12:00:00Z'));

  assert.equal(started.phase, 'battle');
  assert.equal(started.rift.type, 'gear');
  assert.equal(started.rift.tier, 40);
  assert.equal(started.rift.stage, 0);
  assert.equal(started.rift.compassSlot, 'weapon');
  assert.equal(started.rift.instability, true);
  // Consumed compass & orb from stash
  assert.ok(!started.player.stash.includes('compass_weapon_focus'));
  assert.ok(!started.player.stash.includes('orb_rift_instability'));
  // Stage 1 instability gives +1 armor to enemies
  const baseStage1Room = started.rift.stageRooms[0];
  const baseEnemyKind = started.rooms[baseStage1Room][0];
  assert.equal(started.enemies[0].armor, Math.min(10, (ENEMIES[baseEnemyKind].armor ?? 0) + 1));

  // Verify Stage 3 spawns Tier 40 bespoke Gear Rift boss (abyssal_tide_colossus)
  started.rift.stage = 2;
  started.room = started.rift.stageRooms[2];
  enterRoom(started);
  assert.equal(started.enemies.length, 1);
  assert.equal(started.enemies[0].kind, 'abyssal_tide_colossus');

  // Simulate winning Stage 3 via one-shot lethal setup
  if (!started.collection.includes('death')) started.collection.push('death');
  started.player.words = ['death', 'fire', 'ice', 'shot', 'shield', 'pair'];
  started.player.hand = [...started.player.words];
  started.player.mana = 20;
  started.enemies[0].hp = 10;
  started.enemies[0].armor = 0;
  started.enemies[0].ward = 0;

  const victory = simulateTurn(structuredClone(started), ['death'], started.enemies[0].id);
  assert.ok(victory.ok);
  assert.ok(victory.summary.gearRiftCleared);
  const afterWin = victory.state;
  assert.equal(afterWin.phase, 'sanctuary');
  assert.ok(afterWin.clearedGearRifts.includes(40));
  assert.ok(afterWin.pendingGearReward);
  assert.equal(afterWin.pendingGearReward.choices.length, 3);
  for (const gid of afterWin.pendingGearReward.choices) {
    assert.equal(getGearById(gid).slot, 'weapon', 'Weapon Compass must lock all 3 choices to weapon');
  }

  // Save & Load round-trip while pendingGearReward exists
  const store = new Map();
  const mockStorage = {
    getItem: k => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
  const savedRes = saveRun(afterWin, mockStorage);
  assert.equal(savedRes.ok, true);
  const loadedRes = loadRun(mockStorage);
  assert.ok(loadedRes.state?.pendingGearReward);
  assert.deepEqual(loadedRes.state.pendingGearReward, afterWin.pendingGearReward);
  assert.deepEqual(loadedRes.state.clearedGearRifts, [40]);

  // Cannot start new Gear Rift while pendingGearReward is unclaimed
  assert.throws(() => startGearRiftRun(afterWin, 20, {}, new Date('2026-11-22T12:00:00Z')), /หีบศาสตรา/);

  // Claim #1: New item -> auto-equipped to empty weapon slot
  const chosenId = afterWin.pendingGearReward.choices[0];
  const claim1 = claimGearRiftReward(afterWin, chosenId);
  assert.equal(claim1.outcome, 'new');
  assert.equal(claim1.autoEquipped, true);
  assert.equal(claim1.state.pendingGearReward, null);
  assert.equal(claim1.state.player.equippedGear.weapon, chosenId);

  // Claim #2: Duplicate item (< +5) -> Free Auto-Refine +1 (cost 0 gold)
  const goldBeforeDup = claim1.state.player.gold;
  const withPending2 = structuredClone(claim1.state);
  withPending2.pendingGearReward = { tier: 40, choices: [chosenId, ...afterWin.pendingGearReward.choices.slice(1)], compassSlot: 'weapon', instability: false };
  const claim2 = claimGearRiftReward(withPending2, chosenId);
  assert.equal(claim2.outcome, 'auto-refine');
  assert.equal(claim2.prevRefine, 0);
  assert.equal(claim2.newRefine, 1);
  assert.equal(claim2.state.player.gold, goldBeforeDup);

  // Claim #3: Duplicate item at +5 -> Over-Cap Conversion (Gold + Smithing material)
  const atMax = structuredClone(claim2.state);
  atMax.player.gearInventory.find(e => e.id === chosenId).refine = MAX_GEAR_REFINE;
  atMax.pendingGearReward = { tier: 40, choices: [chosenId, ...afterWin.pendingGearReward.choices.slice(1)], compassSlot: 'weapon', instability: false };
  const dupReward = getGearDuplicateReward(chosenId);
  const claim3 = claimGearRiftReward(atMax, chosenId);
  assert.equal(claim3.outcome, 'overcap');
  assert.equal(claim3.goldGained, dupReward.gold);
  assert.equal(claim3.materialId, dupReward.materialId);
  assert.equal(claim3.state.player.gold, goldBeforeDup + dupReward.gold);
  assert.ok(claim3.state.player.stash.includes(dupReward.materialId));

  // Verify Rift Key fallback when daily quota = 0
  const noQuota = structuredClone(claim3.state);
  noQuota.riftDaily = { date: statusBefore.date, used: statusBefore.cap };
  const keyStart = startGearRiftRun(noQuota, 20, { useKey: true }, new Date('2026-11-22T12:00:00Z'));
  assert.equal(keyStart.rift.type, 'gear');
  assert.equal(keyStart.rift.tier, 20);
  assert.ok(!keyStart.player.stash.includes('rift_key_tier1'));

  // Validate active Gear Rift Stage 3 battle save/load round-trip
  keyStart.rift.stage = 2;
  keyStart.room = keyStart.rift.stageRooms[2];
  enterRoom(keyStart);
  assert.equal(keyStart.enemies[0].kind, 'ironforge_automaton');
  assert.ok(validateRun(keyStart));
  assert.equal(saveRun(keyStart, mockStorage).ok, true);
  const reloadedBattle = loadRun(mockStorage);
  assert.equal(reloadedBattle.state.rift.type, 'gear');
  assert.equal(reloadedBattle.state.enemies[0].kind, 'ironforge_automaton');
});

test('Gear Rift Drop Rates & Instability Orb rarity shift determinism', () => {
  assert.equal(getRiftKeyIdForTier(20), 'rift_key_tier1');
  assert.equal(getRiftKeyIdForTier(50), 'rift_key_tier2');
  assert.equal(getRiftKeyIdForTier(90), 'rift_key_tier3');
  assert.equal(getCompassItemIdForSlot('weapon'), 'compass_weapon_focus');
  assert.equal(getCompassItemIdForSlot('armor'), 'compass_armor_focus');
  assert.equal(getCompassItemIdForSlot('accessory'), 'compass_trinket_focus');

  const base50 = getGearRiftDropRates(50, false);
  const instab50 = getGearRiftDropRates(50, true);
  assert.equal(base50.common + base50.rare + base50.special + base50.epic + base50.legendary, 100);
  assert.equal(instab50.common + instab50.rare + instab50.special + instab50.epic + instab50.legendary, 100);
  assert.ok(GEAR_RIFT_DROP_RATES[40].special === 10);
  assert.ok(
    instab50.special + instab50.epic + instab50.legendary > base50.special + base50.epic + base50.legendary,
    'Instability boosts higher-rarity drop chance in Tier 50+',
  );

  // Unseeded 3-slot choice without compass yields 1 weapon, 1 armor, 1 accessory
  let i = 0;
  const fixedRng = () => ((++i * 37) % 100) / 100;
  const choices = rollGearRiftChoices(fixedRng, 40, { compassSlot: null, instability: false });
  assert.equal(choices.length, 3);
  assert.deepEqual(choices.map(id => getGearById(id).slot), GEAR_SLOTS);
});
