import { ATTACK_FORMS, ELEMENTS, WORDS, START_WORDS, LARGE_SHIELD_HP, getSpellCatalog } from './words.js';
import {
  ENEMIES,
  getHandLimit,
  getMaxMana,
  MAX_MANA,
  TURN_DRAW,
  SHOP_ITEMS,
  MAX_BELT_ITEMS,
  MAX_RELIC_SLOTS,
  MAX_CARD_UPGRADE,
  FLOOR21_START_ROOM,
  FLOOR30_BOSS_ROOM,
  FLOOR40_BOSS_ROOM,
  FLOOR50_BOSS_ROOM,
  FLOOR60_BOSS_ROOM,
  FLOOR70_BOSS_ROOM,
  FLOOR80_BOSS_ROOM,
  FLOOR90_BOSS_ROOM,
  FLOOR100_BOSS_ROOM,
  ETERNITY_PHASE_HP,
  encounterMaxHp,
  getEternityShiftAffinity,
  checkEternityPhase2,
  TOTAL_TOWER_ROOMS,
  UPPER_RESTS,
  openHand,
  isBossRoom,
  isSanctuaryPost20Unlocked,
  isUpperCacheRoom,
  unlockUpperTower,
  unlockEndgameTower,
  refreshMiddleTowerRooms,
  offerMissedElementReward,
  fillRewardChoices,
  grantBossRelic,
  clearLostRunProgress,
  repairEarlyDeck,
  RIFT_TIERS,
} from './run.js';

export const SAVE_KEY = 'spell-foundry.run.v2';
export const BACKUP_KEY = 'spell-foundry.backup.v2';
export const SETTINGS_KEY = 'spell-foundry.settings.v1';
export const PROFILE_KEY = 'spell-foundry.profile.v1';
export const DEFAULT_SETTINGS = { music: 0.35, sfx: 0.65, ui: 0.45, muted: false, musicEnabled: true, sfxEnabled: true, reducedMotion: false, tips: true, combatSpeed: 1 };
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const phases = ['battle', 'reward', 'loadout', 'sanctuary', 'won', 'lost'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
// Shield upgrades add twice their level, and veil/grand/rift/worldloom add their own bonuses.
const maxShieldLayerHp = 600;
const shieldEffects = [null, ...ELEMENTS, 'blast', 'akki-blast', 'brace', 'veil'];
const previousEnemyHp = {
  gate_weaver: [190],
  mirror_regent: [235],
  seam_warden: [270],
  loom_sovereign: [330],
  abyss_crawler: [85],
  hydra_serpent: [75],
  leviathan_tide: [360],
  magma_tortoise: [95, 74],
  cinder_drake: [82, 68],
  volcano_colossus: [580, 380],
  gale_harpy: [88],
  cloud_elemental: [98],
  storm_roc: [420],
  sand_stalker: [92],
  spark_wraith: [84],
  thunder_drake_emperor: [640],
  frost_crystal_golem: [110],
  blizzard_wolf: [96],
  glacial_hydra: [480],
  venom_spore_beast: [105],
  crag_titan_sentinel: [125],
  ancient_chitin_behemoth: [700],
  solar_sentinel: [115],
  radiant_phoenix: [100],
  sun_archon: [520],
  dread_reaper: [118],
  void_devourer: [130],
  nether_dread_lord: [760],
  chaos_weaver: [128],
  astral_chimera: [140],
  primordial_avatar: [580],
  zenith_templar: [145],
  chronos_keeper: [135],
  eternity_overlord: [880, 6500, 10000],
  eternity_reborn: [5500, 3500],
};

export function validateRun(state) {
  const invalid = () => { throw new Error('ข้อมูลเซฟไม่ครบหรือมีค่าไม่ถูกต้อง'); };
  if (!object(state)) invalid();
  if (state.version !== 2 || ![2, 3].includes(state.rulesVersion)) throw new Error('เวอร์ชันเซฟหรือกฎเกมนี้ยังไม่รองรับ');
  if (state.hpCurveVersion !== undefined && state.hpCurveVersion !== 1) invalid();
  if (typeof state.seed !== 'string' || state.seed.length > 200 || !integer(state.rng, 1, 4294967295) || typeof state.tutorial !== 'boolean') invalid();
  if (!integer(state.room, 0, FLOOR100_BOSS_ROOM) || !integer(state.turn, 1, 10000) || !phases.includes(state.phase)) invalid();
  if (state.magmaPuddles !== undefined && (state.phase !== 'battle' || !Array.isArray(state.magmaPuddles)
    || new Set(state.magmaPuddles).size !== state.magmaPuddles.length || state.magmaPuddles.some(slot => !integer(slot, 0, 4)))) invalid();
  if (state.blackhole !== undefined && (state.phase !== 'battle' || !object(state.blackhole)
    || !integer(state.blackhole.slot, 0, 4) || !integer(state.blackhole.power, 30, 3000))) invalid();
  if (state.krakenPhase !== undefined && (state.phase !== 'battle' || state.krakenPhase !== 2)) invalid();
  if (state.netherPhase !== undefined && (state.phase !== 'battle' || state.netherPhase !== 2)) invalid();
  if (state.eternityPhase !== undefined && (state.phase !== 'battle' || state.room !== FLOOR100_BOSS_ROOM || state.rift || ![2, 3].includes(state.eternityPhase))) invalid();
  if (!Array.isArray(state.rooms) || state.rooms.length < 1 || state.room >= state.rooms.length || state.rooms.some(room => !Array.isArray(room) || room.length < 1 || room.length > 4 || room.some(kind => !Object.hasOwn(ENEMIES, kind)))) invalid();
  const words = (list, min, max) => Array.isArray(list) && integer(list.length, min, max) && new Set(list).size === list.length && list.every(id => Object.hasOwn(WORDS, id));
  const maxUnlockableWords = Object.keys(WORDS).length - START_WORDS.length;
  if (!words(state.collection, 0, maxUnlockableWords) || state.collection.some(id => START_WORDS.includes(id))) invalid();
  if (!words(state.learned, 0, maxUnlockableWords) || state.learned.some(id => !state.collection.includes(id))) invalid();
  const p = state.player;
  if (!object(p) || !integer(p.maxHp, 36, 5000) || !integer(p.hp, 0, p.maxHp) || !integer(p.maxMana, 10, 412) || !integer(p.mana, 0, getMaxMana(p))) invalid();
  if (!words(p.words, 5, 7) || p.words.some(id => !START_WORDS.includes(id) && !state.collection.includes(id))) invalid();
  if (p.level !== undefined && !integer(p.level, 1, 1000)) invalid();
  if (p.exp !== undefined && !integer(p.exp, 0, 1000000)) invalid();
  if (p.gold !== undefined && !integer(p.gold, 0, 1000000)) invalid();
  if (p.items !== undefined && (!Array.isArray(p.items) || p.items.length > MAX_BELT_ITEMS || p.items.some(id => !Object.hasOwn(SHOP_ITEMS, id)))) invalid();
  if (p.relics !== undefined && (!Array.isArray(p.relics) || p.relics.length > 25 || p.relics.some(id => typeof id !== 'string'))) invalid();
  if (p.equippedRelics !== undefined && (
    !Array.isArray(p.equippedRelics) ||
    p.equippedRelics.length > MAX_RELIC_SLOTS ||
    new Set(p.equippedRelics).size !== p.equippedRelics.length ||
    p.equippedRelics.some(id => typeof id !== 'string' || !(p.relics ?? []).includes(id))
  )) invalid();
  if (state.clearedRooms !== undefined && (!Array.isArray(state.clearedRooms) || state.clearedRooms.some(r => !integer(r, 0, state.rooms.length - 1)))) invalid();
  if (state.rewardedBossRooms !== undefined && (!Array.isArray(state.rewardedBossRooms) || state.rewardedBossRooms.some(r => !integer(r, 0, state.rooms.length - 1)))) invalid();
  if (state.highestRoom !== undefined && !integer(state.highestRoom, 0, state.rooms.length - 1)) invalid();
  if (state.sanctuaryFloor !== undefined) {
    const valid = [4, 5, 9, 14, 15, 19, 25, 35, 45, 55, 65, 75, 85, 95].includes(state.sanctuaryFloor)
      || (typeof state.sanctuaryFloor === 'string' && (state.sanctuaryFloor.startsWith('pre') || state.sanctuaryFloor.startsWith('post')));
    if (!valid) invalid();
  }
  if (state.sanctuary9Unlocked !== undefined && typeof state.sanctuary9Unlocked !== 'boolean') invalid();
  if (state.sanctuaryPost10Unlocked !== undefined && typeof state.sanctuaryPost10Unlocked !== 'boolean') invalid();
  if (state.sanctuary14Unlocked !== undefined && typeof state.sanctuary14Unlocked !== 'boolean') invalid();
  if (state.sanctuary19Unlocked !== undefined && typeof state.sanctuary19Unlocked !== 'boolean') invalid();
  if (state.sanctuaryPost20Unlocked !== undefined && typeof state.sanctuaryPost20Unlocked !== 'boolean') invalid();
  if (state.purchasedShopItems !== undefined && (!Array.isArray(state.purchasedShopItems) || state.purchasedShopItems.length > Object.keys(SHOP_ITEMS).length || state.purchasedShopItems.some(id => !Object.hasOwn(SHOP_ITEMS, id)))) invalid();
  if (state.riftProgressFloor !== undefined && !integer(state.riftProgressFloor, 0, 100)) invalid();
  if (state.riftDaily !== undefined && state.riftDaily !== null) {
    if (!object(state.riftDaily) || typeof state.riftDaily.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(state.riftDaily.date) || !integer(state.riftDaily.used, 0, 1000)) invalid();
  }
  if (state.rift !== undefined) {
    const r = state.rift;
    const validSanctuary = v => [4, 5, 9, 14, 15, 19, 25, 35, 45, 55, 65, 75, 85, 95].includes(v)
      || (typeof v === 'string' && (v.startsWith('pre') || v.startsWith('post')));
    if (
      state.phase !== 'battle'
      || !object(r)
      || !RIFT_TIERS.includes(r.tier)
      || !integer(r.stage, 0, 2)
      || !Array.isArray(r.stageRooms)
      || r.stageRooms.length !== 3
      || r.stageRooms.some(idx => !integer(idx, 0, state.rooms.length - 1))
      || state.room !== r.stageRooms[r.stage]
      || !integer(r.returnRoom, 0, state.rooms.length - 1)
      || !validSanctuary(r.returnSanctuaryFloor)
    ) invalid();
  }
  if (state.replayReturn !== undefined) {
    const rr = state.replayReturn;
    const validSanctuary = v => [4, 5, 9, 14, 15, 19, 25, 35, 45, 55, 65, 75, 85, 95].includes(v)
      || (typeof v === 'string' && (v.startsWith('pre') || v.startsWith('post')));
    if (
      state.phase !== 'battle'
      || !object(rr)
      || !integer(rr.room, 0, state.rooms.length - 1)
      || !validSanctuary(rr.sanctuaryFloor)
    ) invalid();
  }
  if (p.shield !== null) {
    const shield = p.shield;
    if (!object(shield) || !shieldEffects.includes(shield.effect) || typeof shield.triggered !== 'boolean' || !integer(shield.expires, state.turn, state.turn + 1) || !Array.isArray(shield.layers) || !integer(shield.layers.length, 1, shield.layerDetails ? 12 : 2) || shield.layers.some(amount => !integer(amount, 1, maxShieldLayerHp))) invalid();
    if (shield.layerDetails !== undefined && (shield.layerEffects !== undefined || !Array.isArray(shield.layerDetails)
      || shield.layerDetails.length !== shield.layers.length || shield.layerDetails.some(layer => !object(layer)
        || !shieldEffects.includes(layer.effect) || !integer(layer.expires, state.turn, state.turn + 1)
        || typeof layer.triggered !== 'boolean' || (layer.elements !== undefined && (layer.effect !== null
          || !Array.isArray(layer.elements) || !integer(layer.elements.length, 1, 2)
          || new Set(layer.elements).size !== layer.elements.length || layer.elements.some(id => !ELEMENTS.includes(id))))))) invalid();
    if (shield.layerEffects !== undefined && (shield.effect !== null || !Array.isArray(shield.layerEffects) ||
        shield.layerEffects.length !== shield.layers.length || shield.layerEffects.some(layer => !object(layer) ||
          typeof layer.triggered !== 'boolean' || !Array.isArray(layer.elements) ||
          layer.elements.length < 1 || layer.elements.length > 2 ||
          new Set(layer.elements).size !== layer.elements.length || layer.elements.some(id => !ELEMENTS.includes(id))))) invalid();
  }
  const completedEternity = state.room === FLOOR100_BOSS_ROOM && !state.rift
    && (state.phase === 'won' || state.phase === 'sanctuary')
    && state.enemies?.length === 1 && state.enemies[0]?.kind === 'eternity_reborn' && state.enemies[0]?.hp === 0;
  const expectedKinds = state.krakenPhase === 2
    ? ['abyssal_kraken']
    : (state.eternityPhase === 3 || completedEternity)
      ? ['eternity_reborn']
      : state.rooms[state.room];
  if (!Array.isArray(state.enemies) || state.enemies.length !== expectedKinds.length) invalid();
  const slots = new Set();
  state.enemies.forEach((enemy, index) => {
    if (!object(enemy) || enemy.id !== `enemy-${index}` || enemy.kind !== expectedKinds[index]) invalid();
    if (enemy.sealed !== undefined && typeof enemy.sealed !== 'boolean') invalid();
    if (enemy.lastingChill !== undefined && typeof enemy.lastingChill !== 'boolean') invalid();
    if (enemy.lingeringBurn !== undefined && typeof enemy.lingeringBurn !== 'boolean') invalid();
    if (enemy.obscured !== undefined && typeof enemy.obscured !== 'boolean') invalid();
    if (enemy.readForm !== undefined && (!ENEMIES[enemy.kind].repeatReduction
      || ![...ATTACK_FORMS, 'blast', 'blackhole', 'meteor'].includes(enemy.readForm))) invalid();
    if (enemy.wetUntil !== undefined && !integer(enemy.wetUntil, state.turn, state.turn + 1)) invalid();
    if (enemy.magmaArmorUntil !== undefined && !integer(enemy.magmaArmorUntil, state.turn, state.turn + 1)) invalid();
    if (enemy.abyssalShockUntil !== undefined && !integer(enemy.abyssalShockUntil, state.turn, state.turn + 1)) invalid();
    if (enemy.netherPurgeUntil !== undefined && !integer(enemy.netherPurgeUntil, state.turn, state.turn + 1)) invalid();
    if (enemy.netherExposedTurn !== undefined && !integer(enemy.netherExposedTurn, state.turn, state.turn + 1)) invalid();
    if (enemy.eternityShatterUntil !== undefined && !integer(enemy.eternityShatterUntil, state.turn, state.turn + 1)) invalid();
    if (enemy.eternityAbsorbed !== undefined && !integer(enemy.eternityAbsorbed, 0, 3)) invalid();
    if (enemy.groundedUntil !== undefined && !integer(enemy.groundedUntil, state.turn, state.turn + 1)) invalid();
    if (enemy.earthArmorUntil !== undefined && !integer(enemy.earthArmorUntil, state.turn, state.turn + 1)) invalid();
    if (enemy.earthArmorShred !== undefined && !integer(enemy.earthArmorShred, 1, 2)) invalid();
    if (enemy.permanentArmorShred !== undefined && !integer(enemy.permanentArmorShred, 0, 10)) invalid();
    if (enemy.healCutUntil !== undefined && !integer(enemy.healCutUntil, state.turn, state.turn + 2)) invalid();
    const legacyHpList = previousEnemyHp[enemy.kind];
    if ((enemy.maxHp !== encounterMaxHp(enemy.kind, state.room) && (!legacyHpList || !legacyHpList.includes(enemy.maxHp)))
      || !integer(enemy.hp, 0, enemy.maxHp) || !integer(enemy.armor, 0, 10) || !integer(enemy.ward, 0, 3) || !integer(enemy.slot, 0, 4) || !integer(enemy.chill, 0, 40000) || !integer(enemy.freeze, 0, 10000) || !integer(enemy.burn, 0, 500) || !integer(enemy.burnTurn, 0, state.turn + 1)) invalid();
    if (enemy.hp > 0) {
      if (slots.has(enemy.slot)) invalid();
      slots.add(enemy.slot);
    }
  });
  if (!object(state.stats) || ['casts', 'damage', 'blocked', 'turns'].some(key => !integer(state.stats[key], 0, 10000000)) || !Array.isArray(state.stats.discovered)) invalid();
  if (state.stats.discovered.length) {
    const catalog = getSpellCatalog();
    if (state.stats.discovered.length > catalog.size || state.stats.discovered.some(phrase => !catalog.has(phrase))) invalid();
  }
  if (!words(state.rewards, state.phase === 'reward' ? 1 : 0, state.phase === 'reward' ? 3 : 0)) invalid();
  if (state.phase === 'lost' ? p.hp !== 0 : p.hp <= 0) invalid();
  if (state.phase === 'battle' && state.enemies.every(enemy => enemy.hp === 0)) invalid();
  if (['reward', 'loadout', 'won'].includes(state.phase) && state.enemies.some(enemy => enemy.hp > 0)) invalid();
  if (['reward', 'loadout'].includes(state.phase) && !isBossRoom(state) && !isUpperCacheRoom(state.room)
    && !(state.phase === 'reward' && state.room >= FLOOR21_START_ROOM)
    || state.phase === 'loadout' && state.room === state.rooms.length - 1
    || state.phase === 'won' && ![8, state.rooms.length - 1].includes(state.room)) invalid();
  if (!p.words.some(id => ATTACK_FORMS.includes(id)) || !p.words.some(id => ELEMENTS.includes(id))) invalid();
  if (state.rulesVersion === 2) {
    openHand(state);
    state.rulesVersion = 3;
  }
  if (!integer(state.handRng, 1, 4294967295) || !Array.isArray(p.hand) || p.hand.length > getHandLimit(p) + (state.phase === 'battle' ? TURN_DRAW : 0) || p.hand.some(id => !p.words.includes(id))) invalid();
  if (state.deathSpent !== undefined && (state.deathSpent !== true || state.phase !== 'battle'
      || !p.words.includes('death') || p.hand.includes('death'))) invalid();
  if (p.maxMana === 10) {
    p.mana += MAX_MANA - p.maxMana;
    p.maxMana = MAX_MANA;
  }
  if (p.cardUpgrades !== undefined && (!object(p.cardUpgrades) || Object.entries(p.cardUpgrades).some(([k, v]) => !Object.hasOwn(WORDS, k) || !integer(v, 0, 10)))) invalid();
  if (p.cardSecondaryUpgrades !== undefined && (!object(p.cardSecondaryUpgrades) || Object.entries(p.cardSecondaryUpgrades).some(([k, v]) => !Object.hasOwn(WORDS, k) || typeof v !== 'boolean'))) invalid();
  if (p.elementBuffs !== undefined) {
    const validFamilies = ['fire', 'ice', 'lightning', 'earth', 'water', 'wind'];
    if (!object(p.elementBuffs) || Object.entries(p.elementBuffs).some(([fam, buff]) => !validFamilies.includes(fam)
      || !object(buff)
      || !integer(buff.pct, 1, 500)
      || !integer(buff.expires, state.turn, state.turn + 10)
      || !['empower', 'bless'].includes(buff.source)
      || (buff.pierceBonus !== undefined && !integer(buff.pierceBonus, 0, 10)))) invalid();
  }
  p.level ??= 1;
  p.exp ??= 0;
  p.gold ??= 0;
  p.items ??= [];
  p.stash ??= [];
  p.relics ??= [];
  p.blessings ??= [];
  p.cardUpgrades ??= {};
  p.cardSecondaryUpgrades ??= {};
  p.elementBuffs ??= {};
  state.clearedRooms ??= [];
  state.rewardedBossRooms ??= [];
  state.highestRoom ??= state.room;
  state.sanctuaryRested ??= false;
  const legacyRest = { 4: 5, 9: 'pre10', 14: 15, 19: 'pre20' };
  state.sanctuaryFloor = legacyRest[state.sanctuaryFloor] ?? state.sanctuaryFloor ?? 5;
  const mislabeledRest = /^post([2-9])5$/.exec(state.sanctuaryFloor);
  if (mislabeledRest) state.sanctuaryFloor = `post${mislabeledRest[1]}0`;
  state.sanctuary9Unlocked ??= false;
  state.sanctuaryPost10Unlocked ??= false;
  state.sanctuary14Unlocked ??= false;
  state.sanctuary19Unlocked ??= false;
  state.sanctuaryPost20Unlocked ??= false;
  state.purchasedShopItems ??= [];
  state.riftProgressFloor ??= 0;
  state.riftDaily ??= null;
  return state;
}

export function saveRun(state, storage) {
  try {
    storage ??= globalThis.localStorage;
    validateRun(state);
    const json = JSON.stringify(state);
    const current = storage.getItem(SAVE_KEY);
    if (current) {
      let valid = false;
      try { validateRun(JSON.parse(current)); valid = true; } catch { /* Keep an existing good backup when the primary save is damaged. */ }
      if (valid) storage.setItem(BACKUP_KEY, current);
    }
    storage.setItem(SAVE_KEY, json);
    return { ok: true };
  } catch (error) { return { ok: false, error: `บันทึกไม่สำเร็จ: ${error.message} · เล่นต่อได้ แต่ความคืบหน้าอาจไม่ถูกเก็บ` }; }
}
export function loadRun(storage) {
  let hadData = false;
  let lastError;
  try {
    storage ??= globalThis.localStorage;
    for (const key of [SAVE_KEY, BACKUP_KEY]) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      hadData = true;
      try {
        const state = validateRun(JSON.parse(raw));
        if (state.phase === 'lost') clearLostRunProgress(state);
        else repairEarlyDeck(state);
        if (state.hpCurveVersion === undefined) {
          const level = state.player.level;
          const reduction = Math.max(0, Math.min(level, 25) - 1)
            + Math.max(0, Math.min(level, 80) - 25) * 3
            + Math.max(0, level - 80) * 2;
          const oldMax = state.player.maxHp;
          const newMax = Math.max(36, oldMax - reduction);
          state.player.hp = Math.ceil(state.player.hp * newMax / oldMax);
          state.player.maxHp = newMax;
          state.hpCurveVersion = 1;
        }
        if (state.phase === 'reward' && state.rewards.length < 3) fillRewardChoices(state);
        for (const [room, floor] of [
          [FLOOR30_BOSS_ROOM, 30],
          [FLOOR40_BOSS_ROOM, 40],
          [FLOOR50_BOSS_ROOM, 50],
          [FLOOR60_BOSS_ROOM, 60],
          [FLOOR70_BOSS_ROOM, 70],
          [FLOOR80_BOSS_ROOM, 80],
          [FLOOR90_BOSS_ROOM, 90],
          [FLOOR100_BOSS_ROOM, 100],
        ]) {
          if (state.clearedRooms.includes(room) || (room === FLOOR100_BOSS_ROOM && state.room === room && state.phase === 'won')) {
            grantBossRelic(state.player, floor);
          }
        }
        for (const enemy of state.enemies) {
          const rotates = enemy.kind === 'eternity_reborn' || (enemy.kind === 'eternity_overlord' && state.eternityPhase === 2);
          enemy.affinity = rotates ? getEternityShiftAffinity(state.turn) : ENEMIES[enemy.kind]?.affinity ?? null;
          const maxHp = encounterMaxHp(enemy.kind, state.room);
          if (enemy.maxHp === maxHp) continue;
          if (enemy.kind === 'eternity_overlord' && state.room === FLOOR100_BOSS_ROOM && [10000, 6500].includes(enemy.maxHp) && enemy.hp > 0) {
            const oldThreshold = enemy.maxHp === 6500 ? 3000 : enemy.maxHp / 2;
            const newThreshold = ETERNITY_PHASE_HP[1];
            const ceiling = state.eternityPhase === 2 ? newThreshold : maxHp;
            const floor = state.eternityPhase === 2 ? 0 : newThreshold;
            const progress = state.eternityPhase === 2 ? enemy.hp / oldThreshold : (enemy.hp - oldThreshold) / (enemy.maxHp - oldThreshold);
            enemy.hp = Math.max(1, floor + Math.ceil(Math.max(0, Math.min(1, progress)) * (ceiling - floor)));
          } else {
            enemy.hp = Math.ceil(enemy.hp * maxHp / enemy.maxHp);
          }
          enemy.maxHp = maxHp;
        }
        if (state.phase === 'battle') checkEternityPhase2(state, null, null, { absorbCouncil: false });
        if (isSanctuaryPost20Unlocked(state)) unlockUpperTower(state);
        if (state.clearedRooms.includes(FLOOR50_BOSS_ROOM) || state.room > FLOOR50_BOSS_ROOM) unlockEndgameTower(state);
        refreshMiddleTowerRooms(state);
        offerMissedElementReward(state);
        return { ok: true, state, recovered: key === BACKUP_KEY };
      }
      catch (error) { lastError = error.message; }
    }
    if (!hadData && ['spell-foundry.run.v1', 'spell-foundry.backup.v1'].some(key => storage.getItem(key))) {
      return { ok: false, state: null, error: 'เซฟระบบคาถาเดิมยังอยู่ในเครื่อง เริ่มรอบใหม่เพื่อเล่นหอคอย' };
    }
    return { ok: !hadData, state: null, error: hadData ? `เปิดเซฟไม่ได้: ${lastError} · เก็บข้อมูลเดิมไว้แล้ว` : null };
  } catch { return { ok: false, state: null, error: 'เบราว์เซอร์ไม่อนุญาตให้อ่านเซฟ · เริ่มเล่นรอบใหม่ได้' }; }
}
export function loadSettings(storage) {
  try {
    storage ??= globalThis.localStorage;
    const saved = JSON.parse(storage.getItem(SETTINGS_KEY));
    const settings = { ...DEFAULT_SETTINGS };
    if (!object(saved)) return settings;
    for (const key of ['music', 'sfx', 'ui']) if (Number.isFinite(saved[key]) && saved[key] >= 0 && saved[key] <= 1) settings[key] = saved[key];
    for (const key of ['muted', 'musicEnabled', 'sfxEnabled', 'reducedMotion', 'tips']) if (typeof saved[key] === 'boolean') settings[key] = saved[key];
    if ([1, 2, 3].includes(saved.combatSpeed)) settings.combatSpeed = saved.combatSpeed;
    return settings;
  } catch { return { ...DEFAULT_SETTINGS }; }
}
export function storeSettings(settings, storage) {
  try { (storage ?? globalThis.localStorage).setItem(SETTINGS_KEY, JSON.stringify(settings)); return true; } catch { return false; }
}
export function tutorialSeen(storage) {
  try { return (storage ?? globalThis.localStorage).getItem(PROFILE_KEY) === 'complete'; } catch { return false; }
}
export function completeTutorial(storage) {
  try { (storage ?? globalThis.localStorage).setItem(PROFILE_KEY, 'complete'); } catch { /* Storage can be disabled; gameplay still works. */ }
}
