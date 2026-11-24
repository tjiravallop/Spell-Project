import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  GEAR_SLOTS,
  GEAR_CATALOG,
  GEAR_LIST,
  GEAR_RIFT_DROP_RATES,
  getGearById,
  getGearRiftDropRates,
  rollGearRiftChoices,
  getGearDuplicateReward,
  computeGearModifiers,
} from '../src/gear.js';
import {
  ENEMIES,
  GEAR_RIFT_BOSS_BY_TIER,
  ARMORY_GOD_PHASE_THRESHOLDS,
  getGearRiftStage3Kinds,
  createRun,
  enterRoom,
  battleSpellCost,
  getHandLimit,
  startGearRiftRun,
  intent,
} from '../src/run.js';
import { parseSpell, START_WORDS } from '../src/words.js';
import { simulateTurn } from '../src/combat.js';
import { validateRun, saveRun, loadRun } from '../src/save.js';
import { GEAR_RIFT_SPRITE_KINDS, newTowerSpriteKinds, drawNewTowerSprite } from '../src/tower-pixel-sprites.js';
import { LARGE_BOSS_KINDS, PALETTE } from '../src/render.js';
import { ENEMY_TRAITS } from '../src/enemy-traits.js';
import { isRiftBossExposed } from '../src/upper-tower.js';

function makeBattleState(seed = 'phase3-combat', {
  words = ['shot', 'fire', 'ice', 'lightning', 'earth', 'water', 'wind', 'shield'],
  hand = null,
  mana = 30,
  hp = 200,
  maxHp = 200,
  enemies = null,
  turn = 1,
  upgrades = {},
} = {}) {
  const state = createRun(seed, true);
  state.phase = 'battle';
  state.turn = turn;
  state.player.hp = hp;
  state.player.maxHp = maxHp;
  state.player.mana = mana;
  state.player.maxMana = Math.max(state.player.maxMana, mana);
  state.player.words = [...words];
  state.player.hand = hand ? [...hand] : [...words];
  state.player.upgrades = { ...state.player.upgrades, ...upgrades };
  state.player.shield = null;
  state.player.summon = null;
  state.player.gearInventory = [];
  state.player.equippedGear = { weapon: null, armor: null, accessory: null };
  for (const w of words) {
    if (!START_WORDS.includes(w) && !state.collection.includes(w)) state.collection.push(w);
  }
  state.enemies = enemies ?? [
    { id: 'e1', kind: 'striker', hp: 200, maxHp: 200, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
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
  assert.ok(forecast.ok, `Expected spell [${words.join(', ')}] to be valid, got: ${forecast.error ?? forecast.reason ?? 'unknown'}`);
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

function makeMockStorage() {
  const store = new Map();
  return {
    getItem: k => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
}

test('Phase 3 Catalog Integrity: 120 items (30 Epic + 18 Legendary) & zero unreferenced modifier keys', () => {
  assert.equal(GEAR_LIST.length, 120);
  const epics = GEAR_LIST.filter(g => g.rarity === 'epic');
  const legs = GEAR_LIST.filter(g => g.rarity === 'legendary');
  assert.equal(epics.length, 30);
  assert.equal(legs.length, 18);
  for (const slot of GEAR_SLOTS) {
    assert.equal(epics.filter(g => g.slot === slot).length, 10, `Slot ${slot} must have 10 Epic items`);
    assert.equal(legs.filter(g => g.slot === slot).length, 6, `Slot ${slot} must have 6 Legendary items`);
  }

  const baseMods = computeGearModifiers({ gearInventory: [], equippedGear: {} });
  const modKeySet = new Set(Object.keys(baseMods));
  const engineSrc = fs.readFileSync(new URL('../src/combat.js', import.meta.url), 'utf8')
    + fs.readFileSync(new URL('../src/run.js', import.meta.url), 'utf8');

  for (const item of GEAR_LIST) {
    assert.ok(GEAR_CATALOG[item.id] === item);
    const equippedMods = computeGearModifiers({
      gearInventory: [{ id: item.id, refine: 0 }],
      equippedGear: {
        weapon: item.slot === 'weapon' ? item.id : null,
        armor: item.slot === 'armor' ? item.id : null,
        accessory: item.slot === 'accessory' ? item.id : null,
      },
    });
    for (const [key, val] of Object.entries(item.effects)) {
      assert.ok(modKeySet.has(key), `Effect key ${key} on ${item.id} must exist in computeGearModifiers`);
      assert.ok(engineSrc.includes(key), `Effect key ${key} on ${item.id} must be referenced in combat.js or run.js`);
      if (typeof val === 'number' || typeof val === 'boolean') {
        assert.equal(equippedMods[key], val, `${item.id}.${key} should aggregate accurately`);
      }
    }
  }
});

test('Phase 3 Epic Gear Forecast Parity & Mechanics (Fusion, Barrage, Devastation, Behemoth, Hydra, Kraken, Hazard Immunity)', () => {
  // 1. Plasma Singularity + Plasma Flare: overkill splash + kill splash
  const plasmaState = makeBattleState('p3-plasma', {
    words: ['shot', 'plasma', 'fire', 'ice', 'shield', 'pair'],
    enemies: [
      { id: 'e1', kind: 'striker', hp: 10, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
      { id: 'e2', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
  });
  equipDirect(plasmaState, ['wand_plasma_singularity', 'pendant_plasma_flare']);
  const plasmaRes = assertForecastParity(plasmaState, ['shot', 'plasma'], 'e1');
  assert.equal(plasmaRes.state.enemies[0].hp, 0);
  assert.ok(plasmaRes.state.enemies[1].hp < 100, 'Plasma kill/overkill splash must damage adjacent e2');

  // 2. Scald Boiler + Plate + Melter Seal: zero armor + stun target + mana refund
  const scaldState = makeBattleState('p3-scald', {
    words: ['shot', 'scald', 'fire', 'ice', 'shield', 'pair'],
    mana: 14,
    enemies: [
      { id: 'e1', kind: 'striker', hp: 150, maxHp: 150, armor: 8, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
    ],
  });
  equipDirect(scaldState, ['scepter_scald_boiler', 'plate_scald_steamburst', 'seal_scald_melter']);
  const scaldRes = assertForecastParity(scaldState, ['shot', 'scald'], 'e1');
  assert.equal(scaldRes.state.enemies[0].armor, 0, 'scaldZeroArmor sets target armor to 0');
  assert.equal(scaldRes.summary.enemyActions.e1.type, 'frozen', 'scaldStunTarget stuns/freezes target for the turn');
  assert.ok(scaldRes.summary.manaRefunded >= 2, 'scaldCastManaRefund + scaldArmoredManaRefund should refund mana');

  // 3. Shockstream free when >=3 wet enemies
  const shockState = makeBattleState('p3-shock', {
    words: ['shot', 'shockstream', 'fire', 'ice', 'shield', 'pair'],
    mana: 20,
    enemies: [
      { id: 'e0', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 3, slot: 0 },
      { id: 'e1', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 3, slot: 1 },
      { id: 'e2', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 3, slot: 2 },
    ],
  });
  equipDirect(shockState, ['staff_shockstream_hydra', 'bangle_shockstream_grid']);
  const parsedShock = parseSpell(['shot', 'shockstream'], shockState.player.words);
  assert.equal(battleSpellCost(shockState, parsedShock), 0, 'shockstreamFreeIf3Wet makes shockstream cost 0 when 3 enemies are wet');
  const shockRes = assertForecastParity(shockState, ['shot', 'shockstream'], 'e1');
  assert.ok(shockRes.state.enemies[0].hp < 100 && shockRes.state.enemies[2].hp < 100);

  // 4. Barrage Repeater + Tunic + Overclock Ring: cost discount, ramp, hit block, hit heal, draw cards
  const barrageState = makeBattleState('p3-barrage', {
    words: ['shot', 'barrage', 'fire', 'ice', 'lightning', 'earth', 'water', 'wind', 'shield'],
    hand: ['shot', 'fire', 'barrage'],
    mana: 20,
    hp: 150,
    maxHp: 200,
    enemies: [
      { id: 'e1', kind: 'striker', hp: 300, maxHp: 300, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
    ],
  });
  equipDirect(barrageState, ['wand_barrage_repeater', 'tunic_barrage_overdrive', 'ring_barrage_overclock']);
  const barrageRes = assertForecastParity(barrageState, ['shot', 'fire', 'barrage'], 'e1');
  assert.ok(barrageRes.summary.healed >= 5, 'barrageHitHeal heals on barrage hits');
  assert.ok(barrageRes.summary.blocked > 0 || barrageRes.state.player.shield !== null, 'barrageHitBlock grants block per hit');

  // 5. Devastation Catalyst + Rupture: bypass ward, cast block, armor shred, extra radius
  const devState = makeBattleState('p3-dev', {
    words: ['beam', 'devastation', 'fire', 'ice', 'shield', 'pair'],
    mana: 25,
    enemies: [
      { id: 'e0', kind: 'warden', hp: 200, maxHp: 200, armor: 6, ward: 2, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
      { id: 'e1', kind: 'warden', hp: 200, maxHp: 200, armor: 6, ward: 2, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
  });
  equipDirect(devState, ['catalyst_devastation', 'mantle_devastation_core', 'catalyst_devastation_rupture']);
  const devRes = assertForecastParity(devState, ['beam', 'fire', 'devastation'], 'e0');
  assert.ok(devRes.state.enemies[0].hp < 200, 'devastationBypassWard deals damage directly through ward');
  assert.ok(devRes.state.enemies[1].hp < 200, 'devastationRadiusBonus reaches slot 2 from slot 0');
  assert.ok(devRes.state.enemies[0].armor < 6, 'devastationArmorShred shreds enemy armor');

  // 6. Behemoth Scepter + Colossus Hide + Quake Bell: zero AoE overflow + intercept retaliate + invoke shred & true dmg
  const behemothState = makeBattleState('p3-behemoth', {
    words: ['summon', 'behemoth', 'earth', 'fire', 'ice', 'shield'],
    mana: 25,
    enemies: [
      { id: 'b1', kind: 'storm_sovereign_drake', hp: 2600, maxHp: 2600, armor: 5, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
    turn: 4, // Turn 4 triggers AoE storm attack!
  });
  equipDirect(behemothState, ['scepter_behemoth_quake', 'hide_behemoth_colossus', 'bell_behemoth_quake']);
  const behRes = assertForecastParity(behemothState, ['summon', 'behemoth', 'earth'], 'b1');
  assert.equal(behRes.summary.incoming, 0, 'behemothZeroOverflow prevents all AoE overflow damage to player');
  assert.ok(behRes.state.enemies[0].hp < 2600, 'behemothInvokeTrueDmg + behemothInterceptRetaliate damages boss');

  // 7. Hydra Staff + Scales + Bangle: counter extra poison hits + turnStartHeal
  const hydraState = makeBattleState('p3-hydra', {
    words: ['summon', 'hydra', 'water', 'fire', 'ice', 'shield'],
    mana: 25,
    hp: 120,
    maxHp: 200,
    enemies: [
      { id: 'e1', kind: 'striker', hp: 300, maxHp: 300, armor: 6, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
    ],
  });
  equipDirect(hydraState, ['staff_hydra_vitality', 'scales_hydra_endurance', 'bangle_hydra_vitality']);
  const hydRes = assertForecastParity(hydraState, ['summon', 'hydra', 'water'], 'e1');
  assert.ok(hydRes.summary.sequence.some(line => line.includes('ไฮดราสวนพิษเพิ่ม')), 'Hydra counter performs extra poison hits');

  // 8. Hazard Immunity (cloak_abyssal_ink) prevents Storm Sovereign Drake static shock
  const drakeImmState = makeBattleState('p3-hazard-imm', {
    words: ['shot', 'fire', 'ice', 'shield', 'pair', 'wind'],
    enemies: [
      { id: 'b1', kind: 'storm_sovereign_drake', hp: 2600, maxHp: 2600, armor: 5, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
  });
  equipDirect(drakeImmState, ['cloak_abyssal_ink']);
  const drakeImmRes = assertForecastParity(drakeImmState, ['shot', 'fire'], 'b1');
  assert.ok(!drakeImmRes.events.some(e => e.type === 'storm-static' && e.amount > 0), 'immuneHazardDamage prevents static shock damage');
});

test('Phase 3 Legendary Gear Forecast Parity & Mechanics (Dragon, Phoenix, Chronos, Blackhole, Death, Ascension)', () => {
  // 1. Dragon Sovereign: double strike + true strike + reflect + lifesteal
  const dragonState = makeBattleState('p3-dragon', {
    words: ['summon', 'dragon', 'fire', 'shot', 'ice', 'shield'],
    mana: 30,
    hp: 140,
    maxHp: 260,
    turn: 2,
    enemies: [
      { id: 'e1', kind: 'striker', hp: 400, maxHp: 400, armor: 10, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
    ],
  });
  equipDirect(dragonState, ['scepter_dragon_sovereign', 'mantle_nether_emperor', 'ring_dragon_eye']);
  dragonState.player.summon = {
    creatureId: 'dragon', name: 'มังกร', element: 'fire', hp: 60, maxHp: 60, armor: 5, counter: 12, strike: 25, ward: 0, aoeIntercept: false, turnCreated: 1,
  };
  const dragRes = assertForecastParity(dragonState, ['shot', 'fire'], 'e1');
  assert.ok(dragRes.summary.sequence.some(line => line.includes('ออกหมัดซ้ำ')), 'dragonDoubleStrike triggers 2nd follow-up strike');
  assert.equal(dragRes.events.filter(e => e.type === 'summon_strike').length, 2, 'dragonDoubleStrike emits 2 summon_strike events');
  assert.ok(dragRes.state.player.hp > 140, 'summonDmgLifestealPct heals player on dragon strike');

  // 2. Phoenix Immortal + Rebirth Shroud + Feather Pendant: player revives & grants free mana turns
  const phxState = makeBattleState('p3-phoenix', {
    words: ['shot', 'fire', 'ice', 'shield', 'pair', 'wind'],
    mana: 20,
    hp: 5,
    maxHp: 200,
    enemies: [
      { id: 'b1', kind: 'eternity_armory_god', hp: 7500, maxHp: 7500, armor: 7, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
  });
  equipDirect(phxState, ['staff_phoenix_immortal', 'shroud_phoenix_rebirth', 'pendant_phoenix_feather']);
  const phxRes = assertForecastParity(phxState, ['shot', 'fire'], 'b1');
  assert.equal(phxRes.state.player.hp, phxRes.state.player.maxHp, 'armorSelfReviveOnce revives player to 100% HP');
  assert.equal(phxRes.state.armorReviveUsed, true);
  assert.ok(phxRes.state.freeManaUntilTurn >= 2, 'phoenixReviveFreeManaTurns activates free mana window');
  const nextParsed = parseSpell(['shot', 'fire'], phxRes.state.player.words);
  assert.equal(battleSpellCost(phxRes.state, nextParsed), 0, 'Spells cost 0 MP during freeManaUntilTurn');

  // 3. Chronos Timeweaver + Robe + Hourglass: 2-use timestop, preserve shield, refill mana, next turn free, and auto-skip on turn 4!
  const chronosState = makeBattleState('p3-chronos', {
    words: ['timestop', 'shot', 'fire', 'ice', 'shield', 'pair'],
    hand: ['timestop', 'shot', 'fire'],
    mana: 25,
    turn: 1,
    enemies: [
      { id: 'e1', kind: 'striker', hp: 300, maxHp: 300, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
    ],
  });
  chronosState.player.shield = { layers: [12], expires: 1, effect: null, triggered: false };
  equipDirect(chronosState, ['wand_chronos_timeweaver', 'robe_chronos_timeless', 'hourglass_chronos_infinite']);
  const ts1 = assertForecastParity(chronosState, ['timestop'], 'e1');
  assert.equal(ts1.summary.timeStopped, true);
  assert.equal(ts1.state.timestopUses, 1);
  assert.ok(ts1.state.player.hand.includes('timestop'), '2-use timestop stays in hand after 1st cast');
  assert.ok(ts1.state.player.shield !== null, 'timestopPreserveShield keeps shield alive across timestop');
  assert.equal(ts1.state.player.mana, ts1.state.player.maxMana, 'timestopRefillHandAndMana refills mana to full');
  assert.equal(ts1.state.player.hand.length, getHandLimit(ts1.state.player), 'timestopRefillHandAndMana draws to full hand');
  assert.equal(battleSpellCost(ts1.state, parseSpell(['shot', 'fire'], ts1.state.player.words)), 0, 'timestopNextTurnFreeCast makes next turn free');

  // Verify mid-battle save/load preserves 2-use timestop cleanly on a valid room encounter
  const storage = makeMockStorage();
  const tsSaveRoom = createRun('p3-chronos-save', true);
  tsSaveRoom.collection.push('timestop');
  tsSaveRoom.player.words = [...START_WORDS, 'timestop'];
  equipDirect(tsSaveRoom, ['wand_chronos_timeweaver', 'robe_chronos_timeless', 'hourglass_chronos_infinite']);
  enterRoom(tsSaveRoom);
  tsSaveRoom.player.mana = 25;
  tsSaveRoom.player.maxMana = 25;
  if (!tsSaveRoom.player.hand.includes('timestop')) tsSaveRoom.player.hand[0] = 'timestop';
  const tsSaveTurn = simulateTurn(structuredClone(tsSaveRoom), ['timestop'], tsSaveRoom.enemies[0].id);
  assert.equal(tsSaveTurn.ok, true);
  assert.equal(saveRun(tsSaveTurn.state, storage).ok, true);
  const loadedTs = loadRun(storage);
  assert.equal(loadedTs.state.timestopUses, 1);

  // Turn 4 auto-skip enemies via chronosAutoSkipEvery4Turns
  const autoSkipState = makeBattleState('p3-chronos-t4', {
    words: ['shot', 'fire', 'ice', 'shield', 'pair', 'wind'],
    turn: 4,
    enemies: [
      { id: 'e1', kind: 'striker', hp: 300, maxHp: 300, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
    ],
  });
  equipDirect(autoSkipState, ['robe_chronos_timeless']);
  const t4Res = assertForecastParity(autoSkipState, ['shot', 'fire'], 'e1');
  assert.equal(t4Res.summary.incoming, 0, 'chronosAutoSkipEvery4Turns skips enemy actions on turn 4');
  assert.equal(t4Res.summary.enemyActions.e1.type, 'timestop');

  // 4. Blackhole Orb + Void Eater Cuirass + Singularity Ring: power boost, voidOverkillNegate + damageToManaPct
  const bhState = makeBattleState('p3-blackhole', {
    words: ['blackhole', 'shot', 'fire', 'ice', 'shield', 'pair'],
    mana: 22,
    hp: 20,
    maxHp: 200,
    enemies: [
      { id: 'e0', kind: 'striker', hp: 250, maxHp: 250, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
      { id: 'e1', kind: 'striker', hp: 250, maxHp: 250, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
  });
  equipDirect(bhState, ['orb_void_blackhole', 'cuirass_void_eater', 'ring_singularity_void']);
  const bhRes = assertForecastParity(bhState, ['blackhole'], 'e0');
  assert.ok(bhRes.state.blackhole.power >= 350, 'blackholePowerBonus boosts singularity power');

  // Verify voidOverkillNegate survives lethal hit at 1 HP & restores mana via damageToManaPct
  const voidHitState = makeBattleState('p3-void-cap', {
    words: ['shot', 'fire', 'ice', 'shield', 'pair', 'wind'],
    mana: 5,
    hp: 50,
    maxHp: 200,
    enemies: [
      { id: 'b1', kind: 'eternity_armory_god', hp: 7500, maxHp: 7500, armor: 7, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
  });
  equipDirect(voidHitState, ['cuirass_void_eater']);
  const voidRes = assertForecastParity(voidHitState, ['shot', 'fire'], 'b1');
  assert.equal(voidRes.state.player.hp, 1, 'voidOverkillNegate leaves player alive at 1 HP against lethal hit');
  assert.ok(voidRes.summary.manaRefunded > 0, 'damageToManaPct restores mana on incoming damage');

  // 5. Death Scythe + Death Seal: boss bonus dmg + kill chain keeps card & refunds full mana!
  const deathState = makeBattleState('p3-death', {
    words: ['death', 'shot', 'fire', 'ice', 'shield', 'pair'],
    mana: 14,
    enemies: [
      { id: 'e1', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
      { id: 'e2', kind: 'striker', hp: 100, maxHp: 100, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
    ],
  });
  equipDirect(deathState, ['scythe_thanatos_death', 'seal_thanatos_reaper']);
  const deathRes = assertForecastParity(deathState, ['death'], 'e1');
  assert.equal(deathRes.state.enemies[0].hp, 0);
  assert.ok(deathRes.state.player.hand.includes('death'), 'deathKillKeepCard keeps death card in hand on kill');
  assert.ok(!deathRes.state.deathSpent, 'deathKillResetSpent clears deathSpent on kill');
  assert.equal(deathRes.state.player.mana, deathRes.state.player.maxMana, 'deathKillFullManaRefund refills full mana on kill');

  // 6. Genesis Ascension + Omni Vestment + Omni Crown: permanent +10 upgrades + permanent free cast + draw to full + 3x10 start shield
  const ascState = makeBattleState('p3-ascension', {
    words: ['ascension', 'shot', 'fire', 'ice', 'lightning', 'earth', 'water', 'wind'],
    hand: ['ascension', 'shot', 'fire'],
    mana: 20,
    enemies: [
      { id: 'e1', kind: 'striker', hp: 500, maxHp: 500, armor: 4, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 1 },
    ],
  });
  equipDirect(ascState, ['scepter_genesis_ascension', 'vestment_omni_ascendant', 'crown_omni_genesis']);
  const ascRes = assertForecastParity(ascState, ['ascension'], 'e1');
  assert.equal(ascRes.state.permanentAscension, true);
  assert.equal(ascRes.state.permanentAscensionFree, true);
  assert.equal(ascRes.state.player.hand.length, getHandLimit(ascRes.state.player), 'drawToFullHand fills hand every turn');
  assert.equal(battleSpellCost(ascRes.state, parseSpell(['shot', 'fire'], ascRes.state.player.words)), 0);

  // Verify startShieldLayers3x10 via enterRoom + saveRun round-trip
  const shieldRoomState = createRun('p3-3x10', true);
  equipDirect(shieldRoomState, ['vestment_omni_ascendant']);
  enterRoom(shieldRoomState);
  assert.deepEqual(shieldRoomState.player.shield?.layers, [10, 10, 10]);
  assert.equal(saveRun(shieldRoomState, storage).ok, true, '3x10 shield must pass save validation');
  const loaded3x10 = loadRun(storage);
  assert.deepEqual(loaded3x10.state.player.shield?.layers, [10, 10, 10]);
});

test('Phase 3 Primordial Gear Rift Bosses (Tiers 70-100): sprites, traits, mechanics, phases & save round-trip', () => {
  const bossKinds = [
    'storm_sovereign_drake',
    'void_rift_tentacle',
    'void_kraken_leviathan',
    'nether_forge_pillar',
    'nether_forge_overlord',
    'eternity_armory_god',
  ];
  for (const kind of bossKinds) {
    assert.ok(ENEMIES[kind] && ENEMIES[kind].isGearRiftBoss, `${kind} must be defined as Gear Rift boss/minion`);
    assert.ok(ENEMY_TRAITS[kind], `${kind} must have ENEMY_TRAITS`);
    assert.ok(GEAR_RIFT_SPRITE_KINDS.has(kind), `${kind} must be in GEAR_RIFT_SPRITE_KINDS`);
    assert.ok(newTowerSpriteKinds.includes(kind), `${kind} must be in newTowerSpriteKinds`);

    const fills = [];
    const r = (x, y, w, h, color) => fills.push([x, y, w, h, color]);
    assert.equal(drawNewTowerSprite(kind, r, PALETTE, 'idle', 0, false, false), true);
    assert.ok(fills.length > 20, `${kind} sprite must render pixel rects`);

    const dummy = { id: 'b1', kind, hp: ENEMIES[kind].hp, maxHp: ENEMIES[kind].hp, armor: ENEMIES[kind].armor, ward: ENEMIES[kind].ward ?? 0, slot: 2 };
    for (let t = 1; t <= 4; t++) {
      const act = intent(dummy, t, [dummy], 249, false);
      assert.ok(act && act.label, `${kind} turn ${t} must produce valid intent`);
    }
  }
  for (const mainBoss of ['storm_sovereign_drake', 'void_kraken_leviathan', 'nether_forge_overlord', 'eternity_armory_god']) {
    assert.ok(LARGE_BOSS_KINDS.has(mainBoss), `${mainBoss} must be in LARGE_BOSS_KINDS`);
    assert.equal(isRiftBossExposed(mainBoss, 4), true, `${mainBoss} should expose on turn 4`);
  }
  assert.equal(GEAR_RIFT_BOSS_BY_TIER[70], 'storm_sovereign_drake');
  assert.equal(GEAR_RIFT_BOSS_BY_TIER[80], 'void_kraken_leviathan');
  assert.equal(GEAR_RIFT_BOSS_BY_TIER[90], 'nether_forge_overlord');
  assert.equal(GEAR_RIFT_BOSS_BY_TIER[100], 'eternity_armory_god');
  assert.equal(getGearRiftStage3Kinds(80).length, 4);
  assert.equal(getGearRiftStage3Kinds(90).length, 4);

  // 1. Tier 80 Void Kraken Leviathan: immune while any void_rift_tentacle lives
  const krakenState = makeBattleState('p3-t80', {
    enemies: [
      { id: 't1', kind: 'void_rift_tentacle', hp: 500, maxHp: 500, armor: 3, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
      { id: 'boss', kind: 'void_kraken_leviathan', hp: 3600, maxHp: 3600, armor: 5, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
  });
  const immuneHit = assertForecastParity(krakenState, ['shot', 'fire'], 'boss');
  assert.equal(immuneHit.state.enemies[1].hp, 3600, 'Void Kraken Leviathan must be immune while a void_rift_tentacle lives');

  krakenState.enemies[0].hp = 0;
  const vulnHit = assertForecastParity(krakenState, ['shot', 'fire'], 'boss');
  assert.ok(vulnHit.state.enemies[1].hp < 3600, 'Void Kraken Leviathan takes damage once tentacles are defeated');

  // 2. Tier 90 Nether Forge Overlord: -20% damage per pillar + expose when all pillars fall + pillar grants boss ward (cycle === 0 on turn 3)
  const forgeState = makeBattleState('p3-t90', {
    enemies: [
      { id: 'p1', kind: 'nether_forge_pillar', hp: 8, maxHp: 750, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 0 },
      { id: 'boss', kind: 'nether_forge_overlord', hp: 4800, maxHp: 4800, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
    turn: 3,
  });
  const withPillar = assertForecastParity(forgeState, ['shot', 'ice'], 'boss');
  const killLastPillar = assertForecastParity(forgeState, ['shot', 'ice'], 'p1');
  assert.equal(killLastPillar.state.enemies[0].hp, 0);
  assert.equal(killLastPillar.state.netherPhase, 2, 'Killing last forge pillar triggers exposed state');
  assert.equal(killLastPillar.state.enemies[1].netherExposedTurn, 4);
  assert.ok(withPillar.events.some(e => e.type === 'ward-grant' && e.target === 'boss'), 'Pillar cycle 0 grants boss ward');

  // 3. Tier 100 Eternity Armory God: 3 phases (HP 5000 & 2500) + Phase 2 reflects 10 dmg per hit + mid-battle save/load
  const godState = makeBattleState('p3-t100', {
    words: ['beam', 'wind', 'pierce', 'shot', 'fire', 'shield'],
    hp: 300,
    maxHp: 300,
    upgrades: { beam: 10, wind: 10, pierce: 10 },
    enemies: [
      { id: 'boss', kind: 'eternity_armory_god', hp: ARMORY_GOD_PHASE_THRESHOLDS[0] + 5, maxHp: 7500, armor: 0, ward: 0, burn: 0, chill: 0, freeze: 0, wetUntil: 0, slot: 2 },
    ],
  });
  const toPhase2 = assertForecastParity(godState, ['shot', 'fire'], 'boss');
  assert.equal(toPhase2.state.armoryGodPhase, 2, 'Crossing 5000 HP transitions Eternity Armory God to Phase 2');
  assert.equal(toPhase2.summary.armoryGodPhase, 2);

  // In Phase 2 (earth affinity, armor 8, ward 2), beam + wind + pierce pierces ward & armor to deal > 0 dmg, triggering 10 dmg cosmic-echo reflect
  const phase2Hit = assertForecastParity(toPhase2.state, ['beam', 'wind', 'pierce'], 'boss');
  assert.ok(phase2Hit.events.some(e => e.type === 'cosmic-echo' && e.rawAttack === 10), 'Phase 2 Eternity Armory God reflects 10 dmg per spell hit');

  // Crossing 2500 HP transitions to Phase 3
  const nearP3 = structuredClone(toPhase2.state);
  nearP3.enemies[0].hp = ARMORY_GOD_PHASE_THRESHOLDS[1] + 2;
  const toPhase3 = assertForecastParity(nearP3, ['beam', 'wind', 'pierce'], 'boss');
  assert.equal(toPhase3.state.armoryGodPhase, 3, 'Crossing 2500 HP transitions Eternity Armory God to Phase 3');

  // Full Tier 100 Gear Rift start + Stage 3 entry + Save/Load round-trip
  const sanct = createRun('p3-t100-rift', false);
  sanct.phase = 'sanctuary';
  sanct.sanctuaryUnlocked = true;
  sanct.sanctuaryFloor = 'post100';
  sanct.clearedRooms = Array.from({ length: sanct.rooms.length }, (_, i) => i);
  const started100 = startGearRiftRun(sanct, 100, {}, new Date('2026-11-23T12:00:00Z'));
  started100.rift.stage = 2;
  started100.room = started100.rift.stageRooms[2];
  enterRoom(started100);
  assert.equal(started100.enemies[0].kind, 'eternity_armory_god');
  assert.ok(validateRun(started100));
  const storage = makeMockStorage();
  assert.equal(saveRun(started100, storage).ok, true);
  const loaded100 = loadRun(storage);
  assert.equal(loaded100.state.enemies[0].kind, 'eternity_armory_god');
});

test('Phase 3 Tier 70-100 Drop Rates, Instability Orb, Choice-of-3 Epic/Legendary Rolls & Over-Cap Rewards', () => {
  for (const tier of [20, 30, 40, 50, 60, 70, 80, 90, 100]) {
    const base = getGearRiftDropRates(tier, false);
    const instab = getGearRiftDropRates(tier, true);
    assert.equal(base.common + base.rare + base.special + base.epic + base.legendary, 100, `Base tier ${tier} must sum to 100`);
    assert.equal(instab.common + instab.rare + instab.special + instab.epic + instab.legendary, 100, `Instability tier ${tier} must sum to 100`);
  }
  const base100 = getGearRiftDropRates(100, false);
  const instab100 = getGearRiftDropRates(100, true);
  assert.equal(base100.epic, 40);
  assert.equal(base100.legendary, 60);
  assert.equal(instab100.epic, 20);
  assert.equal(instab100.legendary, 80, 'Instability shifts +20% into Legendary at Tier 100');
  assert.equal(GEAR_RIFT_DROP_RATES[70].epic, 45);
  assert.equal(GEAR_RIFT_DROP_RATES[90].legendary, 30);

  // Tier 100 choices strictly emit Epic or Legendary across all 3 slots
  let idx = 0;
  const rng = () => ((++idx * 29) % 100) / 100;
  const choices100 = rollGearRiftChoices(rng, 100, { compassSlot: null, instability: true });
  assert.equal(choices100.length, 3);
  for (const id of choices100) {
    const def = getGearById(id);
    assert.ok(['epic', 'legendary'].includes(def.rarity), `Tier 100 choice ${id} must be epic or legendary`);
  }

  // Over-cap duplicate rewards for Epic & Legendary
  const epicSample = GEAR_LIST.find(g => g.rarity === 'epic');
  const legSample = GEAR_LIST.find(g => g.rarity === 'legendary');
  assert.deepEqual(getGearDuplicateReward(epicSample.id), { gold: 400, materialId: 'superior_smithing_stone', materialCount: 1 });
  assert.deepEqual(getGearDuplicateReward(legSample.id), { gold: 800, materialId: 'godly_smithing_essence', materialCount: 1 });
});
