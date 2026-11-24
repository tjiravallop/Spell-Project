import { makeShield, shieldLayers, shieldProtection } from './shields.js';
import { ATTACK_FORMS, BATTLE_LIMITED_WORDS, FUSED_ELEMENTS, WORDS, CREATURE_STATS, CREATURE_WORDS, elementFamily, getElementComponents, getFusedElementFromComponents, fireShieldLayers, parseSpell, getWeaknessReaction, ELEMENT_LABELS, lightDamagePenalty } from './words.js';
import { RIFT_EXPOSED_BONUS, isRiftBossExposed, getTowerSpellBonus, getTurnManaRegen } from './upper-tower.js';
import {
  ENEMIES,
  FLOOR4_BOUNDARY_ROOM,
  FLOOR5_START_ROOM,
  FLOOR8_BOSS_ROOM,
  FLOOR10_BOSS_ROOM,
  FLOOR11_START_ROOM,
  FLOOR13_BOSS_ROOM,
  FLOOR15_START_ROOM,
  FLOOR18_BOSS_ROOM,
  FLOOR20_BOSS_ROOM,
  FLOOR21_START_ROOM,
  FLOOR30_BOSS_ROOM,
  FLOOR31_START_ROOM,
  FLOOR40_BOSS_ROOM,
  FLOOR100_BOSS_ROOM,
  REVISIT_REWARD_RATE,
  applyExpAndGold,
  fallBackOnDefeat,
  fallBackToFloor4Sanctuary,
  fallBackToFloor9Sanctuary,
  fallBackToPost10Sanctuary,
  fallBackToFloor14Sanctuary,
  fallBackToFloor19Sanctuary,
  fallBackToUpperSanctuary,
  getCardSecondaryEffect,
  battleSpellCost,
  isAscensionActive,
  isAscensionUpgradesActive,
  isBattleWordSpent,
  MAX_CARD_UPGRADE,
  getEquippedRelics,
  getHandLimit,
  getMaxMana,
  grantBossRelic,
  getFloorInfo,
  hasCardSecondaryUpgrade,
  hasCardReward,
  cardRewardReplacesBounty,
  isUpperCacheRoom,
  unlockUpperTower,
  completeUpperFloor,
  intent,
  makeRewards,
  recoverAfterRoom,
  enterRoom,
  clearSummon,
  prepareEnemies,
  drawCards,
  isBossRoom,
  isRoomRevisit,
  recordClearedFloorProgress,
  resolveRiftBattleVictory,
  resolveRiftDefeat,
  completeRevisitVictoryToSanctuary,
  isSanctuaryUnlocked,
  random,
  KRAKEN_TENTACLE_KINDS,
  NETHER_PILLAR_KINDS,
  triggerKrakenPhase2,
  checkNetherPhase2,
  checkEternityPhase2,
  checkArmoryGodPhase,
  clearPhase3BattleFlags,
  eternityDamageLimit,
  triggerEternityPhase3,
  computeGearModifiers,
} from './run.js';

export const WORD_BASE_COST = Object.freeze({
  shot: 1,
  spear: 1,
  axe: 1,
  chakram: WORDS.chakram.cost,
  beam: 2,
  wave: 3,
  storm: WORDS.storm.cost,
  blackhole: WORDS.blackhole.cost,
  death: WORDS.death.cost,
  timestop: WORDS.timestop.cost,
  ascension: WORDS.ascension.cost,
  meteor: WORDS.meteor.cost,
  veil: WORDS.veil.cost,
  fire: 2,
  ice: 2,
  lightning: 2,
  earth: 2,
  water: 2,
  wind: 2,
  akki: 5,
  heman: 5,
  asani: 5,
  pathaphi: 5,
  wari: 5,
  vayu: WORDS.vayu.cost,
  magma: 7,
  mudmire: 7,
  dust: 7,
  permafrost: 7,
  magnet: 7,
  mist: 7,
  hail: 7,
  monsoon: 7,
  shockstream: 7,
  thunderstorm: 7,
  heatwave: 7,
  chillgale: 7,
  plasma: 7,
  scald: 7,
  frostvolt: 7,
  pair: 2,
  barrage: 6,
  blast: 2,
  devastation: WORDS.devastation.cost,
  shield: 3,
  heal: 3,
  self: 0,
  empower: 2,
  bless: 3,
  fill: 1,
  blood: 2,
  mana: 0,
  burn: 1,
  freeze: 3,
  push: 1,
  pull: 1,
  pierce: 1,
  large: 2,
  grand: 3,
  seal: 2,
  dispel: 2,
  brace: 1,
  summon: 1,
  ...Object.fromEntries(CREATURE_WORDS.map(id => [id, CREATURE_STATS[id]?.cost ?? 1])),
});

export function estimateWordCost(wordIds, library = Object.keys(WORDS)) {
  if (!Array.isArray(wordIds)) return 0;
  const ids = wordIds.filter(id => id !== null && id !== '');
  if (!ids.length) return 0;
  const parsed = parseSpell(ids, library);
  if (parsed.ok) return parsed.cost;
  return Math.max(1, ids.reduce((sum, id) => sum + (WORD_BASE_COST[id] ?? 1), 0));
}

export function simulateTurn(original, spellInput, targetId, secondTargetId = targetId, options = {}) {
  if (original.phase !== 'battle') return { ok: false, error: 'ยังร่ายในช่วงนี้ไม่ได้' };
  if (original.player.hand.length > getHandLimit(original.player)) return { ok: false, error: 'เลือกทิ้งการ์ดที่เกินก่อนเล่นต่อ' };
  const guard = spellInput === 'guard';
  const allowFizzle = Boolean(options?.allowFizzle);
  const rawIds = guard ? [] : Array.isArray(spellInput) ? spellInput.filter(id => id !== null && id !== '') : [];
  if (!guard) {
    if (!Array.isArray(spellInput)) return { ok: false, index: 0, error: 'ลำดับคำไม่ถูกต้อง' };
    if (!rawIds.length) return { ok: false, index: 0, error: 'เลือกคำจากคลังเพื่อประกอบคาถา' };
    if (rawIds.length > 4) return { ok: false, index: 4, error: 'คาถานี้เกินสี่ช่องคำ' };
    for (const [index, id] of rawIds.entries()) {
      if (!Object.hasOwn(WORDS, id)) return { ok: false, index, error: 'ไม่รู้จักคำนี้' };
      if (!original.player.words.includes(id)) return { ok: false, index, error: `ยังไม่มีคำ “${WORDS[id].label}” ในชุดที่พก` };
    }
  }
  const parsed = guard ? null : parseSpell(rawIds, original.player.words);
  const detonateInvalid = Boolean(parsed?.ok && parsed.spell.form === 'detonate'
    && !fireShieldLayers(original.player.shield, parsed.spell.element).length);
  const fizzled = !guard && (!parsed.ok || detonateInvalid);
  if (!guard && !allowFizzle) {
    if (!parsed.ok) return parsed;
    if (detonateInvalid) return { ok: false, error: `ต้องมีโล่${WORDS[parsed.spell.element].label}อยู่ก่อนจึงระเบิดได้` };
  }
  const spell = !fizzled ? parsed?.spell : null;
  if (spell && isBattleWordSpent(original, spell.form)) return { ok: false, error: `ใช้ “${WORDS[spell.form].label}” ในศึกนี้ไปแล้ว` };
  const ascended = isAscensionActive(original);
  const cost = guard ? 0 : !fizzled ? battleSpellCost(original, parsed) : estimateWordCost(rawIds, original.player.words);
  const manaFreeCast = Boolean(spell?.form === 'fill' && spell.resource === 'mana' && cost === 0);
  const timeStopped = spell?.form === 'timestop';
  if (cost > original.player.mana) return { ok: false, error: `ต้องใช้ ${cost} มานา ขณะนี้มี ${original.player.mana}` };
  const target = original.enemies.find(enemy => enemy.id === targetId && enemy.hp > 0);
  const slotTarget = typeof targetId === 'string' && /^slot-[0-4]$/.test(targetId) ? Number(targetId.at(-1)) : null;
  if (spell?.form === 'blackhole' && (slotTarget ?? target?.slot) === undefined) return { ok: false, error: 'เลือกช่องที่จะเปิดหลุมดำ' };
  if (spell?.type === 'attack' && !['wave', 'blackhole', 'meteor'].includes(spell.form) && !target) return { ok: false, error: 'เลือกศัตรูเป้าหมาย' };
  if (spell?.shots === 2 && spell.form !== 'meteor' && !original.enemies.some(enemy => enemy.id === secondTargetId && enemy.hp > 0)) return { ok: false, error: 'เลือกเป้าหมายสำหรับการโจมตีครั้งที่สอง' };

  const remainingHand = [...original.player.hand];
  for (const id of guard ? [] : rawIds) {
    const index = remainingHand.indexOf(id);
    if (index < 0) return { ok: false, error: `การ์ด “${WORDS[id]?.label ?? id}” ในมือไม่พอ` };
    remainingHand.splice(index, 1);
  }

  const state = structuredClone(original);
  const { player, enemies, turn } = state;
  const magmaPuddles = state.magmaPuddles ?? [];
  const nextMagmaPuddles = new Set();
  const pendingBlackhole = state.blackhole;
  delete state.blackhole;
  player.level ??= 1;
  player.exp ??= 0;
  player.gold ??= 0;
  player.items ??= [];
  player.stash ??= [];
  player.relics ??= [];
  player.blessings ??= [];
  player.cardUpgrades ??= {};
  player.cardSecondaryUpgrades ??= {};
  player.elementBuffs ??= {};
  state.clearedRooms ??= [];
  state.highestRoom ??= state.room;
  const revisit = isRoomRevisit(state, state.room);
  const dropsCardReward = hasCardReward(state);
  const skipBossBounty = dropsCardReward && cardRewardReplacesBounty(state);
  const ascendedUpgrades = isAscensionUpgradesActive(original);
  const upgrades = ascendedUpgrades
    ? { ...player.cardUpgrades, ...Object.fromEntries(rawIds.map(id => [id, MAX_CARD_UPGRADE])) }
    : player.cardUpgrades;
  const secondaryUpgrades = player.cardSecondaryUpgrades;
  const blessings = player.blessings;
  const equippedRelics = getEquippedRelics(player);
  const hasEmberCore = equippedRelics.includes('ember_core_10');
  const hasStormPendulum = equippedRelics.includes('storm_pendulum_20');
  const hasCrown = equippedRelics.includes('forbidden_crown_30');
  const hasMirrorPrism = equippedRelics.includes('mirror_prism_40');
  const hasWorldloom = equippedRelics.includes('worldloom_50');
  const hasMagmaHeart = equippedRelics.includes('magma_heart_60');
  const hasThunderConduit = equippedRelics.includes('thunder_conduit_70');
  const hasGaiaEmblem = equippedRelics.includes('gaia_emblem_80');
  const hasVoidAnnihilator = equippedRelics.includes('void_annihilator_90');
  const hasCrownOfEternity = equippedRelics.includes('crown_of_eternity_100');
  const gear = computeGearModifiers(player);
  const inRift = state.room >= FLOOR31_START_ROOM;

  // Calculate card upgrade bonuses from the words placed in this spell phrase
  const uniquePhraseIds = [...new Set(rawIds)];
  const phraseUpgradeSum = filterFn => uniquePhraseIds.filter(filterFn).reduce((sum, id) => sum + (upgrades[id] ?? 0), 0);
  const secondaryActive = id => (ascendedUpgrades && uniquePhraseIds.includes(id)) || hasCardSecondaryUpgrade(state, id);
  const unlockedSecondaryEffects = !guard && !fizzled
    ? uniquePhraseIds
        .filter(secondaryActive)
        .map(id => getCardSecondaryEffect(id, Math.max(7, upgrades[id] ?? 0)))
    : [];
  const initialLiveCount = state.enemies.filter(enemy => enemy.hp > 0).length;
  const selfShieldUpgradeBonus = !guard && !fizzled && rawIds.includes('self') ? (upgrades.self ?? 0) : 0;
  const secondaryShieldBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.shieldBonus ?? 0), 0) + selfShieldUpgradeBonus;
  const secondaryHealBonus = unlockedSecondaryEffects.reduce(
    (sum, eff) => sum + (eff.healBonus ?? 0) + (eff.healMaxHpPct ? Math.ceil((player.maxHp ?? 36) * eff.healMaxHpPct / 100) : 0),
    0,
  );
  const secondaryPierceBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pierceBonus ?? 0), 0);
  const secondaryWaveDamagePct = unlockedSecondaryEffects.reduce(
    (sum, eff) => sum + (eff.waveDamagePct && (eff.waveAlwaysPct || initialLiveCount >= 2) ? eff.waveDamagePct : 0),
    0,
  );
  const secondaryDamagePct = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.damagePctBonus ?? 0) + (eff.pairPowerPct ?? 0), 0) + secondaryWaveDamagePct;
  const secondaryPairSelfBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pairSelfBonus ?? 0), 0);
  const secondaryLargeSelfBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.largeSelfBonus ?? 0), 0);
  const secondaryBurnBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.burnBonus ?? 0), 0);
  const secondaryBurnCardBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.burnCardBonus ?? 0), 0);
  const secondaryBurnSpreadHalf = unlockedSecondaryEffects.some(eff => Boolean(eff.burnSpreadHalf));
  const secondaryLingeringBurn = unlockedSecondaryEffects.some(eff => Boolean(eff.lingeringBurn));
  const secondaryChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.chillBonus ?? 0), 0);
  const secondaryLastingChill = unlockedSecondaryEffects.some(eff => Boolean(eff.lastingChill));
  const secondaryEarthShredBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.earthArmorShredBonus ?? 0), 0);
  const secondaryWaterSplashWet = unlockedSecondaryEffects.some(eff => Boolean(eff.waterSplashWet));
  const secondaryWindSlamBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.windSlamBonus ?? 0), 0);
  const secondaryWindExtraSteps = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.windExtraSteps ?? 0), 0);
  const secondaryLightningWetMana = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.lightningWetMana ?? 0), 0);
  const secondaryManaRefund = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.manaRefund ?? 0), 0);
  const secondaryShieldRenewal = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.shieldRenewalBonus ?? 0), 0);
  const secondaryBlastSplashPct = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.blastSplashPct ?? 0), 0);
  const secondaryBlastArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.blastArmorShred ?? 0), 0);
  const secondaryBeamWardBonusDmg = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.beamWardBonusDmg ?? 0), 0);
  const secondaryBeamStripWard = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.beamStripWard ?? 0), 0) + gear.beamStripWard;
  const secondaryWaveChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.waveChillBonus ?? 0), 0);
  const secondaryNextTurnHealBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.nextTurnHealBonus ?? 0), 0);
  const secondaryOverhealShieldCap = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.overhealShieldCap ?? 0), 0) + gear.healOverflowToShield;
  const secondaryPushSlamBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pushSlamBonus ?? 0), 0);
  const secondaryPushCollideChill = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pushCollideChill ?? 0), 0);
  const secondaryPushCollideArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pushCollideArmorShred ?? 0), 0);
  const secondaryPullArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pullArmorShred ?? 0), 0);
  const secondaryPullSlamBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pullSlamBonus ?? 0), 0);
  const secondaryPullChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pullChillBonus ?? 0), 0);
  const secondaryPullExtraSteps = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pullExtraSteps ?? 0), 0);
  const secondaryAkkiBurnBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.akkiBurnBonus ?? 0), 0);
  const secondaryAkkiHealCutExtend = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.akkiHealCutExtend ?? 0), 0);
  const secondaryAkkiExecutePct = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.akkiExecutePct ?? 0), 0);
  const secondaryHemanChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.hemanChillBonus ?? 0), 0);
  const secondaryHemanSplashChill = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.hemanSplashChill ?? 0), 0);
  const secondaryHemanFreezeChilled = unlockedSecondaryEffects.some(eff => Boolean(eff.hemanFreezeChilled));
  const secondaryAsaniChainPct = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.asaniChainPct ?? 0), 0);
  const secondaryAsaniChainBoth = unlockedSecondaryEffects.some(eff => Boolean(eff.asaniChainBoth));
  const secondaryAsaniWetMana = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.asaniWetMana ?? 0), 0);
  const secondaryPathaphiShredBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pathaphiShredBonus ?? 0), 0);
  const secondaryPathaphiChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pathaphiChillBonus ?? 0), 0);
  const secondaryPathaphiZeroArmorDmg = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pathaphiZeroArmorBonusDmg ?? 0), 0);
  const secondaryWariChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.wariChillBonus ?? 0), 0);
  const secondaryWariWetAll = unlockedSecondaryEffects.some(eff => Boolean(eff.wariWetAll));
  const secondaryVayuSlamBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.vayuSlamBonus ?? 0), 0);
  const secondaryVayuExtraSteps = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.vayuExtraSteps ?? 0), 0);
  const secondaryVayuCollideChill = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.vayuCollideChill ?? 0), 0);
  const secondaryVayuCollideArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.vayuCollideArmorShred ?? 0), 0);
  const secondaryFreezeArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.freezeArmorShred ?? 0), 0);
  const secondaryFreezeChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.freezeChillBonus ?? 0), 0);
  const secondaryOverpierceMult = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.overpierceMult ?? 0), 0);
  const secondaryPierceArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pierceArmorShred ?? 0), 0);
  const secondaryGrandSelfBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.grandSelfBonus ?? 0), 0);
  const secondaryGrandNextTurnBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.grandNextTurnBonus ?? 0), 0);
  const secondarySealChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.sealChillBonus ?? 0), 0);
  const secondarySealSplashAdjacent = unlockedSecondaryEffects.some(eff => Boolean(eff.sealSplashAdjacent));
  const secondarySealPunishDmg = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.sealPunishDmg ?? 0), 0);
  const secondaryDispelWardBurstDmg = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.dispelWardBurstDmg ?? 0), 0);
  const secondaryDispelArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.dispelArmorShred ?? 0), 0);
  const secondaryDispelManaRefund = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.dispelManaRefund ?? 0), 0);
  const secondaryDispelSplashWard = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.dispelSplashWard ?? 0), 0);
  const secondaryMagmaBurnBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.magmaBurnBonus ?? 0), 0);
  const secondaryMudmireChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.mudmireChillBonus ?? 0), 0);
  const secondaryMudmireSplashAdjacent = unlockedSecondaryEffects.some(eff => Boolean(eff.mudmireSplashAdjacent));
  const secondaryMudmireArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.mudmireArmorShred ?? 0), 0);
  const secondaryDustSlamBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.dustSlamBonus ?? 0), 0);
  const secondaryDustShredBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.dustShredBonus ?? 0), 0);
  const secondaryDustObscure = unlockedSecondaryEffects.some(eff => Boolean(eff.dustObscure));
  const secondaryDustExtraSteps = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.dustExtraSteps ?? 0), 0);
  const secondaryDustCollideDebuff = unlockedSecondaryEffects.some(eff => Boolean(eff.dustCollideDebuff));
  const secondaryPermafrostChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.permafrostChillBonus ?? 0), 0);
  const secondaryPermafrostShredBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.permafrostShredBonus ?? 0), 0);
  const secondaryPermafrostFreezeZeroArmor = unlockedSecondaryEffects.some(eff => Boolean(eff.permafrostFreezeZeroArmor));
  const secondaryMagnetSlamBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.magnetSlamBonus ?? 0), 0);
  const secondaryMagnetPullRange = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.magnetPullRange ?? 1), 1);
  const secondaryMagnetCollideShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.magnetCollideShred ?? 0), 0);
  const secondaryMagnetCollideChill = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.magnetCollideChill ?? 0), 0);
  const secondaryMistSpreadMode = unlockedSecondaryEffects.some(eff => eff.mistSpreadMode === 'all') ? 'all'
    : unlockedSecondaryEffects.some(eff => eff.mistSpreadMode === 'adjacent') ? 'adjacent' : null;
  const secondaryMistChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.mistChillBonus ?? 0), 0);
  const secondaryMistWetScaldDmg = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.mistWetScaldDmg ?? 0), 0);
  const secondaryHailDryChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.hailDryChillBonus ?? 0), 0);
  const secondaryHailFreezeDmgPct = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.hailFreezeDmgPct ?? 0), 0);
  const secondaryHailDryApplyWet = unlockedSecondaryEffects.some(eff => Boolean(eff.hailDryApplyWet));
  const secondaryHailFreezeArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.hailFreezeArmorShred ?? 0), 0);
  const secondaryHailAllChill = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.hailAllChill ?? 0), 0);
  const secondaryHailFreezeManaRefund = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.hailFreezeManaRefund ?? 0), 0);
  const secondaryMonsoonSlamBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.monsoonSlamBonus ?? 0), 0);
  const secondaryMonsoonPushChill = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.monsoonPushChill ?? 0), 0);
  const secondaryMonsoonSlamManaRefund = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.monsoonSlamManaRefund ?? 0), 0);
  const secondaryShockstreamBonusDmg = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.shockstreamBonusDmg ?? 0), 0);
  const secondaryShockstreamWetPrimary = unlockedSecondaryEffects.some(eff => Boolean(eff.shockstreamWetPrimary));
  const secondaryShockstreamManaPerWet = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.shockstreamManaPerWet ?? 0), 0);
  const secondaryThunderstormChainPct = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.thunderstormChainPct ?? 0), 0);
  const secondaryThunderstormChainBoth = unlockedSecondaryEffects.some(eff => Boolean(eff.thunderstormChainBoth));
  const secondaryThunderstormSlamBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.thunderstormSlamBonus ?? 0), 0);
  const secondaryThunderstormCollideZap = unlockedSecondaryEffects.some(eff => Boolean(eff.thunderstormCollideZap));
  const secondaryHeatwavePrimaryBurn = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.heatwavePrimaryBurn ?? 0), 0);
  const secondaryHeatwaveSlamBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.heatwaveSlamBonus ?? 0), 0);
  const secondaryHeatwaveLingerBurn = unlockedSecondaryEffects.some(eff => Boolean(eff.heatwaveLingerBurn));
  const secondaryHeatwaveBurnDetonateDmg = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.heatwaveBurnDetonateDmg ?? 0), 0);
  const secondaryChillgaleChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.chillgaleChillBonus ?? 0), 0);
  const secondaryChillgaleSlamBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.chillgaleSlamBonus ?? 0), 0);
  const secondaryChillgaleSplashChill = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.chillgaleSplashChill ?? 0), 0);
  const secondaryChillgaleExtraSteps = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.chillgaleExtraSteps ?? 0), 0);
  const secondaryChillgaleCollideFreeze = unlockedSecondaryEffects.some(eff => Boolean(eff.chillgaleCollideFreeze));
  const secondaryPlasmaBurnBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.plasmaBurnBonus ?? 0), 0);
  const secondaryPlasmaArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.plasmaArmorShred ?? 0), 0);
  const secondaryScaldShredBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.scaldShredBonus ?? 0), 0);
  const secondaryScaldChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.scaldChillBonus ?? 0), 0);
  const secondaryScaldZeroArmorDmg = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.scaldZeroArmorDmg ?? 0), 0);
  const secondaryScaldApplyWetBurn = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.scaldApplyWetBurn ?? 0), 0);
  const secondaryFrostvoltChainPct = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.frostvoltChainPct ?? 0), 0);
  const secondaryFrostvoltChainBoth = unlockedSecondaryEffects.some(eff => Boolean(eff.frostvoltChainBoth));
  const secondaryFrostvoltChainFreezeChilled = unlockedSecondaryEffects.some(eff => Boolean(eff.frostvoltChainFreezeChilled));
  const secondaryMeteorBurnBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.meteorBurnBonus ?? 0), 0);
  const secondaryMeteorArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.meteorArmorShred ?? 0), 0);
  const secondaryMeteorExtraDrops = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.meteorExtraDrops ?? 0), 0);
  const secondaryChakramArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.chakramArmorShred ?? 0), 0);
  const secondaryChakramKillManaRefund = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.chakramKillManaRefund ?? 0), 0);
  const secondaryChakramKillCleaveHalf = unlockedSecondaryEffects.some(eff => Boolean(eff.chakramKillCleaveHalf));
  const secondaryStormSidePct = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.stormSidePct ?? 0), 0);
  const secondaryStormChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.stormChillBonus ?? 0), 0);
  const secondaryStormMultiManaRefund = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.stormMultiManaRefund ?? 0), 0);
  const secondaryBarrageArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.barrageArmorShred ?? 0), 0);
  const secondaryBarrageFinaleDouble = unlockedSecondaryEffects.some(eff => Boolean(eff.barrageFinaleDouble));
  const secondaryDevastationBlastPct = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.devastationBlastPct ?? 0), 0);
  const secondaryDevastationArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.devastationArmorShred ?? 0), 0);
  const secondaryDevastationStripWard = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.devastationStripWard ?? 0), 0);
  const secondaryBlackholePullChill = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.blackholePullChill ?? 0), 0);
  const secondaryBlackholePullShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.blackholePullShred ?? 0), 0);
  const secondaryDeathBossMult = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.deathBossMult ?? 1), 1);
  const secondaryDeathBossShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.deathBossShred ?? 0), 0);
  const secondaryDeathBossStripWard = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.deathBossStripWard ?? 0), 0);
  const secondaryDeathKillDraw = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.deathKillDraw ?? 0), 0);
  const secondarySpearBackPct = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.spearBackPct ?? 0), 0);
  const secondarySpearArmorShred = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.spearArmorShred ?? 0), 0);
  const secondarySpearDoubleManaRefund = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.spearDoubleManaRefund ?? 0), 0);
  const secondaryBuffExtraTurns = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.buffExtraTurns ?? 0), 0);
  const secondaryBuffExtraPierce = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.buffExtraPierce ?? 0), 0);
  const secondaryFillCrossMana = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.fillCrossMana ?? 0), 0);
  const secondaryFillCrossHeal = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.fillCrossHeal ?? 0), 0);
  const secondaryManaBonusDraw = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.manaBonusDraw ?? 0), 0);
  const secondaryManaOverflowShieldMult = unlockedSecondaryEffects.reduce((max, eff) => Math.max(max, eff.manaOverflowShieldMult ?? 0), 0);

  const blastSplashFactor = (secondaryBlastSplashPct || 50) / 100;
  const formUpgradeBonus = phraseUpgradeSum(id => ATTACK_FORMS.includes(id))
    + phraseUpgradeSum(id => ['wave', 'chakram', 'storm'].includes(id));
  const auxUpgradeBonus = phraseUpgradeSum(id => ['pair', 'barrage', 'large', 'grand', 'push', 'pull', 'freeze', 'seal', 'dispel', 'brace', 'pierce', 'devastation'].includes(id))
    + phraseUpgradeSum(id => ['grand', 'freeze', 'seal', 'dispel', 'barrage', 'devastation'].includes(id));
  const beamMainPierce = rawIds.includes('beam') ? Math.floor((upgrades.beam ?? 0) / 3) : 0;
  const spearMainPierce = rawIds.includes('spear') ? Math.floor((upgrades.spear ?? 0) / 3) : 0;
  const pierceMainPierce = rawIds.includes('pierce') ? Math.floor((upgrades.pierce ?? 0) / 2) : 0;
  const pierceUpgradeBonus = pierceMainPierce + beamMainPierce + spearMainPierce + secondaryPierceBonus;
  const lightPenalty = spell?.lightened ? lightDamagePenalty(upgrades.light) : 0;
  const lightPierce = unlockedSecondaryEffects.find(eff => eff.id === 'light_focus')?.pierceBonus ?? 0;
  const axeArmorShred = (unlockedSecondaryEffects.find(eff => eff.id === 'axe_sunder')?.axeArmorShred ?? 0) + gear.axeArmorShred;
  const burnUpgradeBonus = rawIds.includes('burn') ? (upgrades.burn ?? 0) * 2 : 0;
  const blastUpgradeBonus = phraseUpgradeSum(id => id === 'blast') * 2;
  const devastationUpgradeBonus = phraseUpgradeSum(id => id === 'devastation') * 3;
  const largeExtraSelfUpgrade = rawIds.includes('large') ? (upgrades.large ?? 0) : 0;
  const grandExtraSelfUpgrade = rawIds.includes('grand') ? (upgrades.grand ?? 0) : 0;
  const braceExtraSelfUpgrade = rawIds.includes('brace') ? (upgrades.brace ?? 0) : 0;
  const veilExtraSelfUpgrade = rawIds.includes('veil') ? (upgrades.veil ?? 0) : 0;
  const healMainPctBonus = rawIds.includes('heal') && (upgrades.heal ?? 0) >= 2
    ? Math.ceil((player.maxHp ?? 36) * Math.floor((upgrades.heal ?? 0) / 2) / 100)
    : 0;
  const shieldUpgradeBonus = phraseUpgradeSum(id => id === 'shield' || id === 'veil') * 2
    + veilExtraSelfUpgrade
    + auxUpgradeBonus
    + largeExtraSelfUpgrade
    + grandExtraSelfUpgrade
    + braceExtraSelfUpgrade
    + secondaryPairSelfBonus
    + secondaryLargeSelfBonus
    + secondaryGrandSelfBonus
    + (blessings.includes('blessing_vitality') ? 2 : 0)
    + gear.shieldBonus;
  const healUpgradeBonus = (rawIds.includes('heal') ? (upgrades.heal ?? 0) * 2 + healMainPctBonus : 0)
    + (rawIds.includes('self') ? (upgrades.self ?? 0) * 2 : 0)
    + auxUpgradeBonus
    + largeExtraSelfUpgrade
    + grandExtraSelfUpgrade
    + secondaryPairSelfBonus
    + secondaryLargeSelfBonus
    + secondaryGrandSelfBonus
    + (blessings.includes('blessing_vitality') ? 2 : 0)
    + gear.healBonus;
  let overhealBlockedSoFar = 0;
  let asaniWetManaRefunded = false;
  let sealPunishManaRefunded = false;
  let dispelManaRefunded = false;
  let hailFreezeManaRefunded = false;
  let monsoonSlamManaRefunded = false;
  let shockstreamManaRefunded = 0;
  let chakramKillManaRefunded = false;
  let stormMultiManaRefunded = false;
  let spearDoubleManaRefunded = false;
  let barrageShredCount = 0;
  let gearChainManaRefunded = false;
  let gearWetHealed = false;
  let playerHitCountThisTurn = 0;
  const gearBlastDetonated = new Set();

  player.hand = remainingHand;
  const events = [];
  const summary = {
    cost,
    manaAfterCast: player.mana - cost,
    damage: 0,
    incoming: 0,
    blocked: 0,
    wards: 0,
    healed: 0,
    secondaryShield: secondaryShieldBonus,
    expGain: 0,
    goldGain: 0,
    levelUps: [],
    revisit,
    sequence: [],
    fizzled,
    ...(lightPenalty ? { lightPenalty, lightPierce } : {}),
    ...(ascended && !guard && !fizzled ? { ascended: true } : {}),
  };
  const live = () => state.enemies.filter(enemy => enemy.hp > 0).sort((a, b) => a.slot - b.slot);
  const enemyById = id => state.enemies.find(enemy => enemy.id === id);
  const newBurn = new Map();
  const newLingeringBurn = new Set();
  let netherCurseTriggered = false;
  let prismShatterTriggered = false;
  let lightningWetManaRefunded = false;
  let block = (guard ? 3 + (hasWorldloom ? 3 : 0) : 0)
    + secondaryShieldBonus
    + (hasGaiaEmblem ? 3 : 0)
    + gear.turnStartBlock
    + (gear.highHandBlock > 0 && player.hand.length >= 3 ? gear.highHandBlock : 0)
    + (gear.periodicBarrierEvery3Turns > 0 && turn % 3 === 1 ? gear.periodicBarrierEvery3Turns : 0);
  let gearWariWardStripped = false;
  let gearManaOverflowBlocked = 0;
  let gearBarrageBlockSoFar = 0;
  let gearScaldCastManaRefunded = false;
  let gearScaldArmoredManaRefunded = false;
  let gearDualFusionManaRefunded = false;
  player.mana -= cost;
  if (!guard && !fizzled && spell && gear.fireEarthCastBlock > 0) {
    const castComps = [...(spell.elements ?? []), ...(spell.secondElement ? [spell.secondElement] : []), ...(spell.element ? [spell.element] : [])]
      .flatMap(id => getElementComponents(id));
    if (castComps.includes('fire') || castComps.includes('earth')) {
      block += gear.fireEarthCastBlock;
      events.push({ type: 'shield', amount: gear.fireEarthCastBlock, secondary: true, shieldKind: 'bonus', protection: shieldProtection(player.shield, block) });
      summary.sequence.push(`ตราอ่างแมกม่ามอบเกราะ +${gear.fireEarthCastBlock}`);
    }
  }
  if (!guard && !fizzled && spell?.devastation && gear.devastationCastBlock > 0) {
    block += gear.devastationCastBlock;
    events.push({ type: 'shield', amount: gear.devastationCastBlock, secondary: true, shieldKind: 'bonus', protection: shieldProtection(player.shield, block) });
    summary.sequence.push(`เสื้อคลุมแกนทำลายล้างมอบเกราะ +${gear.devastationCastBlock}`);
  }
  if (!guard && !fizzled && spell && hasThunderConduit) {
    const castElements = [...(spell.elements ?? []), ...(spell.secondElement ? [spell.secondElement] : [])];
    const isLightning = castElements.some(id => getElementComponents(id).includes('lightning'));
    if (isLightning) {
      const manaRefund = Math.min(getMaxMana(player) - player.mana, 1);
      if (manaRefund > 0) {
        player.mana += manaRefund;
        summary.manaRefunded = (summary.manaRefunded ?? 0) + manaRefund;
        summary.manaAfterCast = player.mana;
        events.push({ type: 'mana-refund', amount: manaRefund, relicId: 'thunder_conduit_70' });
        summary.sequence.push(`แกนนำอสุนีบาตคืน +${manaRefund} มานา`);
      }
    }
  }

  function awardEnemyBounty(enemy) {
    const base = ENEMIES[enemy.kind];
    if (!base) return;
    const bossEnemy = Boolean(base.isBoss || isBossRoom(state));
    // Regular monsters and Floor 10/20 relic bosses always drop Gold & EXP; Card bosses drop Gold & EXP when revisited or already rewarded earlier
    if (bossEnemy && skipBossBounty) return;
    const rate = (revisit ? REVISIT_REWARD_RATE : 1) * (blessings.includes('blessing_fortune') ? 1.35 : 1);
    const expGain = Math.max(1, Math.floor((base.exp ?? 8) * rate));
    const goldGain = Math.max(1, Math.floor((base.gold ?? 6) * rate));
    summary.expGain += expGain;
    summary.goldGain += goldGain;
    const gainedLevels = applyExpAndGold(player, expGain, goldGain);
    if (gainedLevels.length) summary.levelUps.push(...gainedLevels);
  }

  const formsHit = new Map();
  let barrageSfxEmitted = false;
  let spellVfxFlags = !guard && !fizzled && spell
    ? { ...(spell.grand ? { grand: true } : {}), ...(spell.large ? { large: true } : {}) }
    : {};

  function damage(enemy, strength, element, pierce = 0, attackForm = null) {
    if (enemy.hp <= 0) return;
    const spellBonus = element !== 'death' ? getTowerSpellBonus(state.room) : 0;
    const empowered = strength + strength * spellBonus / 100;
    const exposedBonus = isRiftBossExposed(enemy.kind, turn)
      ? RIFT_EXPOSED_BONUS
      : (enemy.netherExposedTurn === turn ? RIFT_EXPOSED_BONUS : 0);
    const overpierceBonus = secondaryOverpierceMult > 0 && attackForm && pierce > enemy.armor
      ? Math.ceil((pierce - enemy.armor) * secondaryOverpierceMult)
      : 0;
    let afterArmor = Math.max(0, Math.ceil(empowered + empowered * exposedBonus / 100) - Math.max(0, enemy.armor - pierce)) + overpierceBonus;
    if (enemy.kind === 'chitin_bastion_behemoth' && enemy.armor > 0 && pierce < enemy.armor && afterArmor > 0) {
      afterArmor = Math.max(1, Math.round(afterArmor * 0.65));
      summary.sequence.push('กระดองเหล็กกล้าลดความเสียหาย −35%');
    }
    if (attackForm && enemy.armor === 0 && gear.zeroArmorDamagePct > 0 && afterArmor > 0) {
      afterArmor += Math.ceil(afterArmor * gear.zeroArmorDamagePct / 100);
    }
    const hasNetherPillarsInRoom = state.enemies.some(e => NETHER_PILLAR_KINDS.includes(e.kind));
    const cursePillarAlive = state.enemies.some(e => e.kind === 'nether_curse_pillar' && e.hp > 0);
    const repeatCap = enemy.kind === 'nether_dread_lord' && hasNetherPillarsInRoom && !cursePillarAlive
      ? 0
      : (ENEMIES[enemy.kind].repeatReduction ?? 0);
    const reduction = attackForm && attackForm === enemy.readForm && !exposedBonus ? repeatCap : 0;
    const guardedByAllies = state.room === FLOOR30_BOSS_ROOM && enemy.kind === 'crown_archivist'
      && live().some(ally => ally.id !== enemy.id);
    const liveNetherPillars = enemy.kind === 'nether_dread_lord'
      ? live().filter(ally => NETHER_PILLAR_KINDS.includes(ally.kind)).length
      : 0;
    const pactFactor = liveNetherPillars > 0 ? Math.max(0.25, 1 - liveNetherPillars * 0.25) : 1;
    const liveForgePillars = enemy.kind === 'nether_forge_overlord'
      ? live().filter(ally => ally.kind === 'nether_forge_pillar').length
      : 0;
    const forgeFactor = liveForgePillars > 0 ? Math.max(0.4, 1 - liveForgePillars * 0.20) : 1;
    const liveEternityCouncil = state.room === FLOOR100_BOSS_ROOM && enemy.kind === 'eternity_overlord' && !state.eternityPhase
      ? live().filter(ally => ally.id !== enemy.id).length
      : 0;
    const councilFactor = liveEternityCouncil > 0 ? Math.max(0.55, 1 - liveEternityCouncil * 0.15) : 1;
    const baseDmg = Math.ceil(afterArmor * (100 - reduction) / 100 * (guardedByAllies ? 0.75 : 1) * pactFactor * forgeFactor * councilFactor);
    if (guardedByAllies && afterArmor > 0) summary.sequence.push('ตราประสานลดดาเมจบอส 25% เพราะยังมีลูกสมุน');
    if (liveNetherPillars > 0 && afterArmor > 0) summary.sequence.push(`พันธสัญญา ${liveNetherPillars} เสาลดดาเมจบอส −${liveNetherPillars * 25}%`);
    if (liveForgePillars > 0 && afterArmor > 0) summary.sequence.push(`เสาเตาหลอม (${liveForgePillars} ต้น) ลดดาเมจบอส −${liveForgePillars * 20}%`);
    if (liveEternityCouncil > 0 && afterArmor > 0) summary.sequence.push(`สภากาลอวกาศ (${liveEternityCouncil} ตน) ลดดาเมจมหาเทพ −${liveEternityCouncil * 15}%`);

    const enemyAffinity = enemy.affinity ?? ENEMIES[enemy.kind]?.affinity ?? null;
    const reaction = getWeaknessReaction(element, enemyAffinity);
    let amount = baseDmg;
    let weakBonus = 0;
    let resistLoss = 0;

    if (baseDmg > 0 && reaction.isWeak) {
      weakBonus = Math.ceil(baseDmg * 0.25);
      amount = baseDmg + weakBonus;
      summary.sequence.push(`⚡ โจมตีเข้าจุดอ่อน! ${ENEMIES[enemy.kind]?.name ?? enemy.kind} แพ้ทาง ${ELEMENT_LABELS[reaction.triggerElement]} (+${weakBonus} ดาเมจ)`);
    } else if (baseDmg > 0 && reaction.isResist) {
      amount = Math.max(1, Math.floor(baseDmg * 0.8));
      resistLoss = baseDmg - amount;
      summary.sequence.push(`🛡 ${ENEMIES[enemy.kind]?.name ?? enemy.kind} ต้านทาน ${ELEMENT_LABELS[reaction.triggerElement]} (−${resistLoss} ดาเมจ)`);
    }

    if (amount > 0 && attackForm && repeatCap > 0) {
      if (reduction && !formsHit.has(enemy.id)) {
        summary.sequence.push(`${ENEMIES[enemy.kind].name} อ่านทาง${WORDS[attackForm].label} · ลดดาเมจ ${reduction}%`);
        if (enemy.kind === 'nether_dread_lord' && cursePillarAlive && !netherCurseTriggered && player.hp > 0) {
          netherCurseTriggered = true;
          const curse = applyIncomingToPlayer(8, true, enemy, null, 0, true);
          events.push({
            type: 'nether-curse',
            source: enemy.id,
            sourceKind: enemy.kind,
            amount: curse.actual,
            absorbed: curse.absorbed,
            rawAttack: 8,
            protection: protection(),
          });
          summary.sequence.push(curse.actual > 0
            ? `💀 เสาคำสาปต้องห้ามย้อนศรเวทซ้ำ · เสีย ${curse.actual} HP`
            : `💀 โล่กันคำสาปย้อนศรได้ ${curse.absorbed}`);
        }
      }
      formsHit.set(enemy.id, attackForm);
    }
    const krakenImmune = enemy.kind === 'void_kraken_leviathan' && live().some(ally => ally.kind === 'void_rift_tentacle');
    if (krakenImmune && amount > 0) {
      summary.sequence.push('🐙 หนวดมิตินรกานต์คุ้มกันเลเวียธานเป็นอมตะ! (ทำลายหนวดทั้งหมดก่อน)');
    }
    const limit = krakenImmune ? 0 : eternityDamageLimit(state, enemy);
    const prevHp = enemy.hp;
    const actual = Math.min(amount, limit);
    const overkill = Math.max(0, amount - prevHp);
    enemy.hp -= actual;
    summary.damage += actual;
    const killed = enemy.hp === 0;
    const event = {
      type: 'damage',
      target: enemy.id,
      targetKind: enemy.kind,
      isBoss: Boolean(enemy.isBoss),
      amount,
      actual,
      element,
      killed,
      ...(limit === 0 && amount > 0 && { phaseGate: true }),
      ...spellVfxFlags,
      ...(reduction && { reduction }),
      ...(reaction.isWeak && { weakness: true, weakBonus, triggerElement: reaction.triggerElement }),
      ...(reaction.isResist && { resisted: true, resistLoss, triggerElement: reaction.triggerElement }),
    };
    events.push(event);
    if (enemy.kind === 'eternity_armory_god' && state.armoryGodPhase === 2 && actual > 0 && attackForm && player.hp > 0) {
      const reflected = applyIncomingToPlayer(10, false, enemy);
      events.push({
        type: 'cosmic-echo',
        source: enemy.id,
        sourceKind: enemy.kind,
        amount: reflected.actual,
        absorbed: reflected.absorbed,
        rawAttack: 10,
        protection: protection(),
      });
      summary.sequence.push(reflected.actual > 0
        ? `🛡️ เกราะปราการคลังศาสตราสะท้อน −${reflected.actual} HP`
        : `🛡️ เกราะปราการสะท้อน 0 (กันได้ ${reflected.absorbed})`);
    }
    if (killed) {
      const hpBefore = player.hp;
      const maxHpBefore = player.maxHp;
      awardEnemyBounty(enemy);
      if (element === 'blackhole' && gear.blackholeKillMaxHpGain > 0) {
        const gain = gear.blackholeKillMaxHpGain;
        player.maxHp = Math.min(5000, player.maxHp + gain);
        player.hp = Math.min(player.maxHp, player.hp + gain);
        summary.sequence.push(`แหวนหลุมดำกลืนชีพ · Max HP +${gain} ถาวร!`);
      }
      if (hasVoidAnnihilator) {
        const manaRefund = Math.min(getMaxMana(player) - player.mana, 3);
        if (manaRefund > 0) {
          player.mana += manaRefund;
          summary.manaRefunded = (summary.manaRefunded ?? 0) + manaRefund;
          summary.manaAfterCast = player.mana;
          events.push({ type: 'mana-refund', amount: manaRefund, relicId: 'void_annihilator_90' });
          summary.sequence.push(`ศิลาล้างมิติคืน +${manaRefund} มานาจากการสังหาร`);
        }
      }
      if (player.maxHp > maxHpBefore) {
        event.levelHp = player.hp - hpBefore;
        event.levelMaxHp = player.maxHp - maxHpBefore;
      }
    }
    return { actual, amount, killed, overkill };
  }

  function applyEarthArmorShred(enemy, amount) {
    if (enemy.hp <= 0 || amount <= 0) return;
    const actual = Math.min(enemy.armor, amount);
    enemy.armor = Math.max(0, enemy.armor - amount);
    enemy.permanentArmorShred = Math.min(10, (enemy.permanentArmorShred ?? 0) + amount);
    if (actual > 0) {
      events.push({ type: 'armor-shred', target: enemy.id, amount: actual, armor: enemy.armor });
      summary.sequence.push(`ทุบเกราะช่อง ${enemy.slot + 1} ถาวร −${actual} (เหลือ ${enemy.armor})`);
    }
  }

  function onEnemyFrozen(frozenEnemy) {
    if (gear.freezeSpreadChill <= 0) return;
    for (const adj of live()) {
      if (Math.abs(adj.slot - frozenEnemy.slot) === 1) {
        adj.chill += gear.freezeSpreadChill;
        events.push({ type: 'status', status: 'chill', target: adj.id });
      }
    }
  }

  function applyGearWariWardStrip(primaryEnemy, elements) {
    if (gearWariWardStripped || !elements?.includes('wari')) return;
    if (!gear.wariStripAllWard && gear.wariStripWard <= 0) return;
    let strippedAny = false;
    if (gear.wariStripAllWard > 0) {
      for (const candidate of live()) {
        if (candidate.ward > 0) {
          const removed = Math.min(candidate.ward, gear.wariStripAllWard);
          candidate.ward -= removed;
          summary.wards += removed;
          events.push({ type: 'dispel', target: candidate.id, amount: removed });
          strippedAny = true;
        }
      }
      if (strippedAny) summary.sequence.push(`คลื่นวารีล้างม่านศัตรูทั้งสนาม −${gear.wariStripAllWard} ชั้น`);
    }
    if (gear.wariStripWard > 0 && primaryEnemy && primaryEnemy.hp > 0 && primaryEnemy.ward > 0) {
      const stripped = Math.min(primaryEnemy.ward, gear.wariStripWard);
      primaryEnemy.ward -= stripped;
      summary.wards += stripped;
      events.push({ type: 'dispel', target: primaryEnemy.id, amount: stripped });
      summary.sequence.push(`คทาสึนามิสลายม่านช่อง ${primaryEnemy.slot + 1} −${stripped} ชั้น`);
      strippedAny = true;
    }
    if (strippedAny) gearWariWardStripped = true;
  }

  function applyMoisture(enemy, elements) {
    if (elements.includes('hail')) {
      if (enemy.wetUntil >= turn) {
        delete enemy.wetUntil;
        enemy.freeze++;
        events.push({ type: 'status', status: 'freeze', target: enemy.id });
        onEnemyFrozen(enemy);
        if (secondaryHailFreezeArmorShred > 0) applyEarthArmorShred(enemy, secondaryHailFreezeArmorShred);
        if (secondaryHailFreezeManaRefund > 0 && !hailFreezeManaRefunded) {
          hailFreezeManaRefunded = true;
          const refund = Math.min(getMaxMana(player) - player.mana, secondaryHailFreezeManaRefund);
          if (refund > 0) {
            player.mana += refund;
            summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
            summary.manaAfterCast = player.mana;
            events.push({ type: 'mana-refund', amount: refund });
            summary.sequence.push(`พายุหิมะแช่แข็งคืน +${refund} มานา`);
          }
        }
      } else {
        enemy.chill += 2 + Math.floor((upgrades.hail ?? 0) / 2) + secondaryHailDryChillBonus;
        if (secondaryHailDryApplyWet) enemy.wetUntil = turn + 1;
      }
      if (secondaryHailAllChill > 0) {
        for (const candidate of live()) {
          if (candidate.id !== enemy.id) {
            candidate.chill += secondaryHailAllChill;
            events.push({ type: 'status', status: 'chill', target: candidate.id });
          }
        }
      }
    }
    if (elements.includes('mist')) {
      enemy.wetUntil = turn + 1;
      enemy.obscured = true;
      if (secondaryMistSpreadMode === 'adjacent' || secondaryMistSpreadMode === 'all') {
        for (const candidate of live()) {
          if (candidate.id === enemy.id) continue;
          if (secondaryMistSpreadMode === 'all' || Math.abs(candidate.slot - enemy.slot) === 1) {
            candidate.wetUntil = turn + 1;
            candidate.obscured = true;
          }
        }
      }
    }
    if (elements.includes('mudmire')) {
      const mudChill = 3 + Math.floor((upgrades.mudmire ?? 0) / 2) + secondaryMudmireChillBonus;
      enemy.wetUntil = turn + 1;
      enemy.chill += mudChill;
      if (secondaryMudmireSplashAdjacent) {
        for (const candidate of live()) {
          if (Math.abs(candidate.slot - enemy.slot) === 1) {
            candidate.wetUntil = turn + 1;
            candidate.chill += mudChill;
            events.push({ type: 'status', status: 'chill', target: candidate.id });
          }
        }
      }
    }
    if (elements.includes('shockstream') && secondaryShockstreamWetPrimary) {
      enemy.wetUntil = turn + 1;
    }
    const wetExpiry = turn + 1 + Math.min(1, gear.waterWetDurationBonus ?? 0);
    if (elements.includes('water')) {
      enemy.wetUntil = Math.max(enemy.wetUntil ?? 0, wetExpiry);
      if (secondaryWaterSplashWet) {
        for (const candidate of live()) {
          if (Math.abs(candidate.slot - enemy.slot) === 1) candidate.wetUntil = Math.max(candidate.wetUntil ?? 0, wetExpiry);
        }
      }
    }
    if (elements.includes('wari')) {
      if (secondaryWariWetAll) {
        for (const candidate of live()) candidate.wetUntil = Math.max(candidate.wetUntil ?? 0, wetExpiry);
      } else {
        enemy.wetUntil = Math.max(enemy.wetUntil ?? 0, wetExpiry);
        for (const candidate of live()) {
          if (Math.abs(candidate.slot - enemy.slot) === 1) candidate.wetUntil = Math.max(candidate.wetUntil ?? 0, wetExpiry);
        }
      }
    }
    if (elements.includes('monsoon')) {
      for (const candidate of live()) {
        candidate.wetUntil = Math.max(candidate.wetUntil ?? 0, wetExpiry);
      }
    }
  }

  function applyBossElementEffects(enemy, elements) {
    const hasCoolingElement = elements.some(id => {
      const comps = getElementComponents(id);
      return comps.includes('water') || comps.includes('ice');
    });
    if (['volcano_colossus', 'magma_tortoise'].includes(enemy.kind) && hasCoolingElement && enemy.armor > 0) {
      const cooled = Math.min(enemy.armor, 2);
      enemy.armor = Math.max(0, enemy.armor - cooled);
      enemy.magmaArmorUntil = turn + 1;
      events.push({ type: 'armor-shred', target: enemy.id, amount: cooled, armor: enemy.armor });
      summary.sequence.push(`น้ำ/น้ำแข็งดับลาวา · เกราะ${ENEMIES[enemy.kind].name} −${cooled} (เหลือ ${enemy.armor})`);
    }
    const hasEarthElement = elements.some(id => getElementComponents(id).includes('earth'));
    if ((enemy.kind === 'thunder_drake_emperor' || enemy.kind === 'storm_sovereign_drake') && hasEarthElement) {
      const alreadyGrounded = enemy.groundedUntil >= turn + 1;
      enemy.groundedUntil = turn + 1;
      if (!alreadyGrounded) {
        summary.sequence.push(`ธาตุดินลงกราวด์ · สลายประจุดาราของ${ENEMIES[enemy.kind].name}จนถึงเทิร์นหน้า`);
      }
    }
    const hasLightningElement = elements.some(id => getElementComponents(id).includes('lightning'));
    const canShockKraken = enemy.kind === 'abyssal_kraken'
      || (enemy.kind === 'void_kraken_leviathan' && !live().some(ally => ally.kind === 'void_rift_tentacle'));
    if (canShockKraken && hasLightningElement && enemy.hp > 0) {
      damage(enemy, 15, 'lightning', enemy.armor);
      const alreadyShocked = enemy.abyssalShockUntil >= turn + 1;
      enemy.abyssalShockUntil = turn + 1;
      if (!alreadyShocked && enemy.armor > 0) {
        const reduced = Math.min(enemy.armor, 2);
        enemy.armor = Math.max(0, enemy.armor - reduced);
        events.push({ type: 'armor-shred', target: enemy.id, amount: reduced, armor: enemy.armor });
        summary.sequence.push(`สายฟ้าช็อตผิวน้ำบาดาล · +15 ดาเมจทะลุเกราะ และลดเกราะ −${reduced} (เหลือ ${enemy.armor})`);
      } else {
        summary.sequence.push('สายฟ้าช็อตผิวน้ำบาดาล · +15 ดาเมจทะลุเกราะ');
      }
    }
    const hasPurgeElement = elements.some(id => {
      const comps = getElementComponents(id);
      return comps.includes('fire') || comps.includes('lightning');
    });
    if ((enemy.kind === 'nether_dread_lord' || enemy.kind === 'nether_forge_overlord') && hasPurgeElement && enemy.hp > 0) {
      const alreadyPurged = enemy.netherPurgeUntil >= turn + 1;
      enemy.netherPurgeUntil = turn + 1;
      if (!alreadyPurged && enemy.armor > 0) {
        const reduced = Math.min(enemy.armor, 2);
        enemy.armor = Math.max(0, enemy.armor - reduced);
        events.push({ type: 'armor-shred', target: enemy.id, amount: reduced, armor: enemy.armor });
        summary.sequence.push(`เพลิง/อสุนีชำระมลทิน · ตัดการสูบวิญญาณและลดเกราะจอมอสูร −${reduced} (เหลือ ${enemy.armor})`);
      } else if (!alreadyPurged) {
        summary.sequence.push('เพลิง/อสุนีชำระมลทิน · ตัดการสูบวิญญาณจอมอสูรจนถึงเทิร์นหน้า');
      }
    }
    const isPrismSovereign = (enemy.kind === 'eternity_overlord' && state.eternityPhase === 2) || enemy.kind === 'eternity_reborn';
    if (isPrismSovereign && !prismShatterTriggered && enemy.hp > 0) {
      const prismAffinity = enemy.affinity ?? ENEMIES[enemy.kind]?.affinity ?? null;
      const prismReaction = getWeaknessReaction(elements, prismAffinity);
      if (prismReaction.isWeak) {
        prismShatterTriggered = true;
        const shatterDmg = enemy.kind === 'eternity_reborn' ? 100 : 60;
        const shatterElement = prismReaction.triggerElement ?? elements[0] ?? 'lightning';
        events.push({ type: 'prism-shatter', target: enemy.id, element: shatterElement, amount: shatterDmg });
        damage(enemy, shatterDmg, shatterElement, enemy.armor);
        if (enemy.hp > 0) {
          enemy.eternityShatterUntil = turn + 1;
          const armorLost = Math.min(enemy.armor, 3);
          if (armorLost > 0) {
            enemy.armor = Math.max(0, enemy.armor - armorLost);
            events.push({ type: 'armor-shred', target: enemy.id, amount: armorLost, armor: enemy.armor });
          }
          if (enemy.ward > 0) {
            enemy.ward = Math.max(0, enemy.ward - 1);
            summary.wards++;
            events.push({ type: 'dispel', target: enemy.id, amount: 1 });
          }
          summary.sequence.push(
            enemy.kind === 'eternity_reborn'
              ? `✨ ทลายผลึกธาตุ! +${shatterDmg} ดาเมจแท้ · เกราะ −${armorLost} · หยุดการย้อนกาลเวลา!`
              : `✨ ทลายผลึกธาตุ! +${shatterDmg} ดาเมจแท้ · เกราะ −${armorLost} และสลายม่าน −1`,
          );
        }
      }
    }
  }

  function hit(enemy, strength, pierce, elements) {
    const fusedReaction = elements.length > 1 ? getFusedElementFromComponents(elements[0], elements[1]) : null;
    const effectiveElements = fusedReaction ? [...elements, fusedReaction] : elements;
    const families = effectiveElements.map(elementFamily);
    const wasWet = enemy.wetUntil >= turn;
    const wasChilledBeforeHit = enemy.chill > 0;
    const wasBurnedBeforeHit = enemy.burn > 0;
    const wasBurnOrHealCut = enemy.burn > 0 || enemy.healCutUntil >= turn;
    const hadArmorBeforeHit = enemy.armor > 0;
    let finalStrength = strength;
    if (elements.includes('akki') && secondaryAkkiExecutePct > 0 && wasBurnOrHealCut) {
      finalStrength = Math.round(finalStrength * (100 + secondaryAkkiExecutePct) / 100);
    }
    if (elements.includes('hail') && secondaryHailFreezeDmgPct > 0 && (wasWet || enemy.freeze > 0)) {
      finalStrength = Math.round(finalStrength * (100 + secondaryHailFreezeDmgPct) / 100);
    }
    if (effectiveElements.includes('frostvolt') && wasChilledBeforeHit && gear.frostvoltChilledDmgPct > 0) {
      finalStrength = Math.round(finalStrength * (100 + gear.frostvoltChilledDmgPct) / 100);
    }
    const conductivity = families.includes('lightning') && (wasWet || families.includes('water')) ? 2 : 0;
    const effectivePierce = spell.form === 'axe' ? Math.max(enemy.armor, pierce) : pierce;
    const dmgRes = damage(enemy, finalStrength + conductivity, elements.length > 1 ? elements : (elements[0] ?? spell.form), effectivePierce, spell.form);
    if (spell?.barrage && gear.barrageHitBlock > 0 && gearBarrageBlockSoFar < 10) {
      const gained = Math.min(10 - gearBarrageBlockSoFar, gear.barrageHitBlock);
      gearBarrageBlockSoFar += gained;
      block += gained;
      events.push({ type: 'shield', amount: gained, secondary: true, shieldKind: 'bonus', protection: protection() });
    }
    if (spell?.barrage && gear.barrageHitHeal > 0 && player.hp > 0) {
      heal(gear.barrageHitHeal, false, 'bonus');
    }
    if (effectiveElements.includes('scald') && gear.scaldCastManaRefund > 0 && !gearScaldCastManaRefunded) {
      gearScaldCastManaRefunded = true;
      const refund = Math.min(getMaxMana(player) - player.mana, gear.scaldCastManaRefund);
      if (refund > 0) {
        player.mana += refund;
        summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
        summary.manaAfterCast = player.mana;
        events.push({ type: 'mana-refund', amount: refund });
        summary.sequence.push(`เกราะไอร้อนเดือดคืน +${refund} มานา`);
      }
    }
    if (effectiveElements.includes('scald') && hadArmorBeforeHit && gear.scaldArmoredManaRefund > 0 && !gearScaldArmoredManaRefunded) {
      gearScaldArmoredManaRefunded = true;
      const refund = Math.min(getMaxMana(player) - player.mana, gear.scaldArmoredManaRefund);
      if (refund > 0) {
        player.mana += refund;
        summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
        summary.manaAfterCast = player.mana;
        events.push({ type: 'mana-refund', amount: refund });
        summary.sequence.push(`ตราประทับไอเดือดหลอมเกราะคืน +${refund} มานา`);
      }
    }
    if (elements.includes('mist') && secondaryMistWetScaldDmg > 0 && wasWet && enemy.hp > 0) {
      damage(enemy, secondaryMistWetScaldDmg, 'mist', enemy.armor);
      summary.sequence.push(`หมอกไอร้อนลวกเป้าเปียก +${secondaryMistWetScaldDmg} ดาเมจแท้`);
    }
    if (elements.includes('heatwave') && secondaryHeatwaveBurnDetonateDmg > 0 && wasBurnedBeforeHit && enemy.hp > 0) {
      damage(enemy, secondaryHeatwaveBurnDetonateDmg, 'heatwave', enemy.armor);
      summary.sequence.push(`ระอุระเบิดความร้อนเป้าติดเผา +${secondaryHeatwaveBurnDetonateDmg} ดาเมจแท้`);
    }
    if (elements.includes('lightning') && secondaryLightningWetMana > 0 && wasWet && !lightningWetManaRefunded) {
      lightningWetManaRefunded = true;
      const refund = Math.min(getMaxMana(player) - player.mana, secondaryLightningWetMana);
      if (refund > 0) {
        player.mana += refund;
        summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
        summary.manaAfterCast = player.mana;
        events.push({ type: 'mana-refund', amount: refund });
        summary.sequence.push(`สายฟ้าช็อตเป้าเปียกคืน +${refund} มานา`);
      }
    }
    if (elements.includes('asani') && secondaryAsaniWetMana > 0 && wasWet && !asaniWetManaRefunded) {
      asaniWetManaRefunded = true;
      const refund = Math.min(getMaxMana(player) - player.mana, secondaryAsaniWetMana);
      if (refund > 0) {
        player.mana += refund;
        summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
        summary.manaAfterCast = player.mana;
        events.push({ type: 'mana-refund', amount: refund });
        summary.sequence.push(`อัสนีช็อตเป้าเปียกคืน +${refund} มานา`);
      }
    }
    const earthBaseGain = (elements.includes('permafrost') ? 6 + (upgrades.permafrost ?? 0) * 2
      : elements.includes('pathaphi') ? 4 + (upgrades.pathaphi ?? 0)
      : elements.includes('earth') ? 2 + Math.floor((upgrades.earth ?? 0) / 2) : 0)
      + (elements.includes('mudmire') ? (upgrades.mudmire ?? 0) : 0)
      + (elements.includes('pathaphi') ? gear.pathaphiBlockBonus : 0)
      + (elements.includes('permafrost') ? gear.permafrostBlockBonus : 0)
      + ((elements.includes('earth') || elements.includes('pathaphi') || elements.includes('permafrost')) ? gear.earthBlockBonus : 0);
    if (earthBaseGain > 0) {
      block += earthBaseGain;
      events.push({
        type: 'shield',
        amount: earthBaseGain,
        secondary: true,
        element: elements.includes('permafrost') ? 'permafrost' : elements.includes('pathaphi') ? 'pathaphi' : elements.includes('mudmire') ? 'mudmire' : 'earth',
        protection: protection(),
      });
    }
    if (elements.includes('monsoon') && !summary.monsoonHealed) {
      summary.monsoonHealed = true;
      const monsoonHeal = 4 + (upgrades.monsoon ?? 0) + gear.waterHealBonus + gear.monsoonHealBonus + gear.healBonus;
      heal(monsoonHeal, false, 'water');
      summary.sequence.push(`คลื่นมรสุมฟื้นฟู +${monsoonHeal} HP`);
    }
    if (elements.includes('wari') && !summary.wariHealed) {
      summary.wariHealed = true;
      const wariHeal = 4 + (upgrades.wari ?? 0) + gear.waterHealBonus + gear.wariHealBonus + gear.healBonus;
      heal(wariHeal, false, 'water');
      summary.sequence.push(`คลื่นวารีฟื้นฟู +${wariHeal} HP`);
    } else if (elements.includes('water') && !summary.waterHealed) {
      summary.waterHealed = true;
      const waterHeal = 2 + Math.floor((upgrades.water ?? 0) / 2) + gear.waterHealBonus + gear.healBonus;
      heal(waterHeal, false, 'water');
      summary.sequence.push(`ละอองวารีฟื้นฟู +${waterHeal} HP`);
    }
    applyGearWariWardStrip(enemy, elements);
    if (wasWet && gear.wetDamageHeal > 0 && !gearWetHealed) {
      gearWetHealed = true;
      heal(gear.wetDamageHeal, false, 'water');
      summary.sequence.push(`แหวนวังวนดูดกลืนฟื้น +${gear.wetDamageHeal} HP จากเป้าเปียก`);
    }
    if (enemy.hp <= 0) {
      if (effectiveElements.includes('plasma') && gear.plasmaKillSplashDmg > 0) {
        for (const adj of live()) {
          if (Math.abs(adj.slot - enemy.slot) === 1) {
            damage(adj, gear.plasmaKillSplashDmg, 'plasma', adj.armor);
            summary.sequence.push(`พลาสมาดาวฤกษ์ระเบิดใส่ช่อง ${adj.slot + 1} (${gear.plasmaKillSplashDmg} แท้)`);
          }
        }
      }
      if (effectiveElements.includes('plasma') && gear.plasmaOverkillSplash && (dmgRes?.overkill ?? 0) > 0) {
        for (const other of live()) {
          damage(other, dmgRes.overkill, 'plasma', other.armor);
        }
        summary.sequence.push(`พลาสมาระเบิดดาเมจส่วนเกิน +${dmgRes.overkill} แท้ใส่ศัตรูที่เหลือ!`);
      }
      if (spell?.form === 'chakram') {
        if (secondaryChakramKillManaRefund > 0 && !chakramKillManaRefunded) {
          chakramKillManaRefunded = true;
          const refund = Math.min(getMaxMana(player) - player.mana, secondaryChakramKillManaRefund);
          if (refund > 0) {
            player.mana += refund;
            summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
            summary.manaAfterCast = player.mana;
            events.push({ type: 'mana-refund', amount: refund });
            summary.sequence.push(`กรงจักรสังหารคืน +${refund} มานา`);
          }
        }
        if (secondaryChakramKillCleaveHalf) {
          for (const adj of live()) {
            if (Math.abs(adj.slot - enemy.slot) === 1) {
              damage(adj, Math.round(strength * 0.5), elements[0] ?? 'chakram', pierce, 'chakram');
              summary.sequence.push(`คมจักรชิ่งเฉือนช่อง ${adj.slot + 1}`);
            }
          }
        }
      }
      return;
    }
    if (spell?.form === 'wave' && secondaryWaveChillBonus > 0) {
      enemy.chill += secondaryWaveChillBonus;
    }
    if (spell?.form === 'storm' && secondaryStormChillBonus > 0) {
      enemy.chill += secondaryStormChillBonus;
    }
    const fusionBonusMult = gear.dualFusionSecondaryBonus && effectiveElements.some(id => Boolean(FUSED_ELEMENTS[id])) ? 2 : 1;
    const frozen = effectiveElements.some(id => ['ice', 'heman', 'wari', 'chillgale', 'frostvolt'].includes(id));
    if (frozen) {
      const iceUpgradeChill = effectiveElements.includes('ice') ? Math.floor((upgrades.ice ?? 0) / 3) + secondaryChillBonus : 0;
      const hemanUpgradeChill = effectiveElements.includes('heman') ? Math.floor((upgrades.heman ?? 0) / 2) + secondaryHemanChillBonus : 0;
      const wariUpgradeChill = effectiveElements.includes('wari') ? secondaryWariChillBonus : 0;
      const chillgaleUpgradeChill = effectiveElements.includes('chillgale') ? Math.floor((upgrades.chillgale ?? 0) / 2) + secondaryChillgaleChillBonus : 0;
      const frostvoltUpgradeChill = effectiveElements.includes('frostvolt') ? Math.floor((upgrades.frostvolt ?? 0) / 2) : 0;
      const baseChillGain = ((effectiveElements.includes('ice') || effectiveElements.includes('heman') || effectiveElements.includes('chillgale') || effectiveElements.includes('frostvolt')) ? 4 : 2)
        + iceUpgradeChill + hemanUpgradeChill + wariUpgradeChill + chillgaleUpgradeChill + frostvoltUpgradeChill
        + (families.includes('ice') ? gear.iceChillBonus : 0);
      enemy.chill += baseChillGain * (effectiveElements.some(id => ['chillgale', 'frostvolt'].includes(id)) ? fusionBonusMult : 1);
    }
    if (effectiveElements.includes('pathaphi') && secondaryPathaphiChillBonus > 0) {
      enemy.chill += secondaryPathaphiChillBonus;
    }
    if (effectiveElements.includes('permafrost') && secondaryPermafrostChillBonus > 0) {
      enemy.chill += secondaryPermafrostChillBonus * fusionBonusMult;
    }
    if (effectiveElements.includes('mist')) {
      const mistChill = Math.floor((upgrades.mist ?? 0) / 2) + secondaryMistChillBonus;
      if (mistChill > 0) enemy.chill += mistChill * fusionBonusMult;
    }
    if (effectiveElements.includes('scald')) {
      const scaldChill = Math.floor((upgrades.scald ?? 0) / 2) + secondaryScaldChillBonus;
      if (scaldChill > 0) enemy.chill += scaldChill * fusionBonusMult;
    }
    if (effectiveElements.includes('dust') && secondaryDustObscure) {
      enemy.obscured = true;
    }
    if (effectiveElements.includes('heman') && secondaryHemanSplashChill > 0) {
      for (const adj of live()) {
        if (Math.abs(adj.slot - enemy.slot) === 1) {
          adj.chill += secondaryHemanSplashChill;
          events.push({ type: 'status', status: 'chill', target: adj.id });
        }
      }
    }
    if (effectiveElements.includes('chillgale') && secondaryChillgaleSplashChill > 0) {
      for (const adj of live()) {
        if (Math.abs(adj.slot - enemy.slot) === 1) {
          adj.chill += secondaryChillgaleSplashChill * fusionBonusMult;
          adj.lastingChill = true;
          events.push({ type: 'status', status: 'chill', target: adj.id });
        }
      }
    }
    if (effectiveElements.includes('heman') && secondaryHemanFreezeChilled && wasChilledBeforeHit) {
      enemy.freeze += 1;
      events.push({ type: 'status', status: 'freeze', target: enemy.id });
      onEnemyFrozen(enemy);
      summary.sequence.push(`เหมันต์เยือกแข็งแช่แข็งช่อง ${enemy.slot + 1}!`);
    } else if (effectiveElements.includes('heman') && gear.hemanLastingFreezeThreshold > 0 && enemy.chill >= gear.hemanLastingFreezeThreshold && enemy.freeze === 0) {
      enemy.freeze += 1;
      events.push({ type: 'status', status: 'freeze', target: enemy.id });
      onEnemyFrozen(enemy);
      summary.sequence.push(`คทาเหมันต์แช่แข็งช่อง ${enemy.slot + 1} (หนาวถึง ${enemy.chill})!`);
    }
    if (effectiveElements.includes('heman') || effectiveElements.includes('chillgale') || (effectiveElements.includes('ice') && secondaryLastingChill)) {
      enemy.lastingChill = true;
    }
    if (effectiveElements.includes('akki')) enemy.healCutUntil = turn + 1 + secondaryAkkiHealCutExtend;
    if (effectiveElements.includes('pathaphi')) {
      applyEarthArmorShred(enemy, 2 + secondaryPathaphiShredBonus + gear.armorShredBonus);
      if (secondaryPathaphiZeroArmorDmg > 0 && enemy.hp > 0 && enemy.armor === 0) {
        damage(enemy, secondaryPathaphiZeroArmorDmg, 'pathaphi', enemy.armor);
        summary.sequence.push(`ปฐพีกระแทกเป้าไร้เกราะ +${secondaryPathaphiZeroArmorDmg} ดาเมจแท้`);
      }
    } else if (effectiveElements.includes('permafrost')) {
      applyEarthArmorShred(enemy, (2 + secondaryPermafrostShredBonus + gear.armorShredBonus) * fusionBonusMult);
      if (secondaryPermafrostFreezeZeroArmor && enemy.hp > 0 && enemy.armor === 0) {
        enemy.freeze += 1;
        events.push({ type: 'status', status: 'freeze', target: enemy.id });
        onEnemyFrozen(enemy);
        summary.sequence.push(`เยือกศิลาแช่แข็งเป้าไร้เกราะช่อง ${enemy.slot + 1}!`);
      }
    } else if (effectiveElements.includes('scald')) {
      const scaldShred = gear.scaldZeroArmor
        ? enemy.armor
        : (2 + secondaryScaldShredBonus + gear.scaldShredBonus + gear.armorShredBonus) * fusionBonusMult;
      applyEarthArmorShred(enemy, scaldShred);
      if (gear.scaldStunTarget && enemy.hp > 0) {
        enemy.freeze += 1;
        events.push({ type: 'status', status: 'freeze', target: enemy.id });
        onEnemyFrozen(enemy);
        summary.sequence.push(`ไอเดือดช็อกช่อง ${enemy.slot + 1} ชะงัก 1 เทิร์น!`);
      }
      if (secondaryScaldZeroArmorDmg > 0 && enemy.hp > 0 && enemy.armor === 0) {
        damage(enemy, secondaryScaldZeroArmorDmg, 'scald', enemy.armor);
        summary.sequence.push(`ไอเดือดช็อกเป้าไร้เกราะ +${secondaryScaldZeroArmorDmg} ดาเมจแท้`);
      }
    } else if (effectiveElements.includes('earth')) {
      applyEarthArmorShred(enemy, 1 + secondaryEarthShredBonus + gear.armorShredBonus);
    } else if (effectiveElements.includes('dust')) {
      applyEarthArmorShred(enemy, (1 + secondaryDustShredBonus + gear.armorShredBonus) * fusionBonusMult);
    }
    if (effectiveElements.includes('mudmire') && secondaryMudmireArmorShred > 0 && enemy.hp > 0) {
      applyEarthArmorShred(enemy, secondaryMudmireArmorShred * fusionBonusMult);
    }
    if (effectiveElements.includes('plasma') && secondaryPlasmaArmorShred > 0 && enemy.hp > 0) {
      applyEarthArmorShred(enemy, secondaryPlasmaArmorShred * fusionBonusMult);
    }
    if (spell?.form === 'chakram' && secondaryChakramArmorShred > 0 && enemy.hp > 0) {
      applyEarthArmorShred(enemy, secondaryChakramArmorShred);
    }
    if (spell?.form === 'spear' && secondarySpearArmorShred > 0 && enemy.hp > 0) {
      applyEarthArmorShred(enemy, secondarySpearArmorShred);
    }
    if (spell?.barrage && secondaryBarrageArmorShred > 0 && barrageShredCount < 3 && enemy.hp > 0) {
      barrageShredCount++;
      applyEarthArmorShred(enemy, secondaryBarrageArmorShred);
    }
    if (secondaryPierceArmorShred > 0 && rawIds.includes('pierce') && enemy.hp > 0) {
      applyEarthArmorShred(enemy, secondaryPierceArmorShred);
    }
    if (secondaryDispelArmorShred > 0 && spell?.dispel && enemy.hp > 0) {
      applyEarthArmorShred(enemy, secondaryDispelArmorShred);
    }
    applyBossElementEffects(enemy, elements);
    applyMoisture(enemy, elements);
    if (elements.includes('magma') && secondaryMagmaBurnBonus > 0 && enemy.hp > 0) {
      newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + secondaryMagmaBurnBonus * fusionBonusMult);
      events.push({ type: 'status', status: 'burn', target: enemy.id });
    }
    if (elements.includes('mist') && (upgrades.mist ?? 0) > 0 && enemy.hp > 0) {
      newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + (upgrades.mist ?? 0) * fusionBonusMult);
      events.push({ type: 'status', status: 'burn', target: enemy.id });
    }
    if (elements.includes('plasma') && secondaryPlasmaBurnBonus > 0 && enemy.hp > 0) {
      newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + secondaryPlasmaBurnBonus * fusionBonusMult);
      events.push({ type: 'status', status: 'burn', target: enemy.id });
    }
    if (elements.includes('scald') && enemy.hp > 0) {
      const scaldBurn = (Math.floor((upgrades.scald ?? 0) / 2) + secondaryScaldApplyWetBurn) * fusionBonusMult;
      if (scaldBurn > 0) {
        newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + scaldBurn);
        events.push({ type: 'status', status: 'burn', target: enemy.id });
      }
      if (secondaryScaldApplyWetBurn > 0) {
        enemy.wetUntil = turn + 1;
        events.push({ type: 'status', status: 'wet', target: enemy.id });
      }
    }
    if (elements.includes('heatwave')) burnNearby(enemy);
    if (elements.includes('shockstream')) shockWetEnemies(enemy, spell.form, wasWet, finalStrength);
    if (spell.freeze) {
      enemy.freeze += spell.freeze;
      const freezeMainChill = Math.floor((upgrades.freeze ?? 0) / 3) + secondaryFreezeChillBonus;
      if (freezeMainChill > 0) enemy.chill += freezeMainChill;
      if (secondaryFreezeArmorShred > 0) applyEarthArmorShred(enemy, secondaryFreezeArmorShred);
      events.push({ type: 'status', status: 'freeze', target: enemy.id });
      onEnemyFrozen(enemy);
    }
    if (spell.burn) {
      const burnAmount = spell.burn
        + burnUpgradeBonus
        + secondaryBurnCardBonus
        + (blessings.includes('blessing_ember') && elements.some(id => elementFamily(id) === 'fire') ? 1 : 0)
        + (hasEmberCore && elements.some(id => getElementComponents(id).includes('fire')) ? 1 : 0)
        + (elements.some(id => getElementComponents(id).includes('fire')) ? gear.fireBurnBonus : 0);
      newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + burnAmount);
      if (secondaryLingeringBurn) newLingeringBurn.add(enemy.id);
      events.push({ type: 'status', status: 'burn', target: enemy.id });
      if (secondaryBurnSpreadHalf) {
        const spreadAmt = Math.floor(burnAmount / 2);
        if (spreadAmt > 0) {
          for (const adj of live()) {
            if (Math.abs(adj.slot - enemy.slot) === 1) {
              newBurn.set(adj.id, (newBurn.get(adj.id) ?? 0) + spreadAmt);
              if (secondaryLingeringBurn) newLingeringBurn.add(adj.id);
              events.push({ type: 'status', status: 'burn', target: adj.id });
            }
          }
        }
      }
    } else if (gear.fireBurnBonus > 0 && elements.some(id => getElementComponents(id).includes('fire')) && enemy.hp > 0) {
      newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + gear.fireBurnBonus);
      events.push({ type: 'status', status: 'burn', target: enemy.id });
    }
    if (elements.includes('fire') && secondaryBurnBonus > 0) {
      newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + secondaryBurnBonus);
      events.push({ type: 'status', status: 'burn', target: enemy.id });
    }
    if (elements.includes('akki') && secondaryAkkiBurnBonus > 0) {
      newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + secondaryAkkiBurnBonus);
      events.push({ type: 'status', status: 'burn', target: enemy.id });
    }
  }

  function burnNearby(enemy) {
    const baseNearbyBurn = 4 + (upgrades.heatwave ?? 0);
    for (const target of live().filter(candidate => Math.abs(candidate.slot - enemy.slot) <= 1)) {
      const amt = baseNearbyBurn + (target.id === enemy.id ? secondaryHeatwavePrimaryBurn : 0);
      newBurn.set(target.id, (newBurn.get(target.id) ?? 0) + amt);
      if (secondaryHeatwaveLingerBurn) newLingeringBurn.add(target.id);
      events.push({ type: 'status', status: 'burn', target: target.id });
    }
  }

  function shockWetEnemies(enemy, attackForm, primaryWasWet = false, primaryStrength = 0) {
    const baseShockDmg = 10 + (upgrades.shockstream ?? 0) * 2 + secondaryShockstreamBonusDmg + gear.shockstreamBonusDmg;
    const shockDmg = gear.shockstreamFullPower && primaryStrength > 0
      ? Math.max(baseShockDmg, Math.round(primaryStrength) + gear.shockstreamBonusDmg)
      : baseShockDmg;
    const shockPierce = 2 + pierceUpgradeBonus;
    const manaPerWet = secondaryShockstreamManaPerWet + gear.shockstreamManaPerWet;
    const manaCap = gear.shockstreamManaPerWet > 0 ? 5 : 3;
    for (const target of live()) {
      const isPrimaryReshock = target.id === enemy.id && primaryWasWet && secondaryShockstreamWetPrimary;
      if ((target.id !== enemy.id && target.wetUntil >= turn) || isPrimaryReshock) {
        damage(target, shockDmg, 'shockstream', shockPierce, attackForm);
        summary.sequence.push(`กระแสช็อตชิ่งไปช่อง ${target.slot + 1}`);
        if (gear.shockstreamPush > 0 && target.hp > 0) {
          pushEnemy(target, 1, { steps: gear.shockstreamPush, sourceElement: 'shockstream' });
        }
        if (manaPerWet > 0 && shockstreamManaRefunded < manaCap) {
          const refund = Math.min(manaCap - shockstreamManaRefunded, getMaxMana(player) - player.mana, manaPerWet);
          if (refund > 0) {
            shockstreamManaRefunded += refund;
            player.mana += refund;
            summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
            summary.manaAfterCast = player.mana;
            events.push({ type: 'mana-refund', amount: refund });
            summary.sequence.push(`กระแสช็อตเป้าเปียกคืน +${refund} มานา`);
          }
        }
      }
    }
  }

  function chainLightning(enemy, strength, pierce, sweep, element = 'asani', attackForm = null, flatBonus = 0) {
    if (sweep?.chained) return;
    const candidates = live().filter(target => Math.abs(target.slot - enemy.slot) === 1 && !sweep?.warded?.has(target.id));
    if (!candidates.length) return;
    if (sweep) sweep.chained = true;
    const isAsani = element === 'asani';
    const isThunderstorm = element === 'thunderstorm';
    const isFrostvolt = element === 'frostvolt';
    const targets = ((isAsani && (secondaryAsaniChainBoth || gear.asaniChainBoth))
      || (isThunderstorm && secondaryThunderstormChainBoth)
      || (isFrostvolt && secondaryFrostvoltChainBoth)) ? candidates : [candidates[0]];
    let chainRatio = isAsani && secondaryAsaniChainPct > 0 ? secondaryAsaniChainPct / 100
      : isThunderstorm && secondaryThunderstormChainPct > 0 ? secondaryThunderstormChainPct / 100
      : isFrostvolt && secondaryFrostvoltChainPct > 0 ? secondaryFrostvoltChainPct / 100 : 0.5;
    if (isAsani && gear.asaniChainRatioPct > 0) {
      chainRatio = Math.max(chainRatio, gear.asaniChainRatioPct / 100);
    }
    if (isFrostvolt && gear.frostvoltChainRatioPct > 0) {
      chainRatio = Math.max(chainRatio, gear.frostvoltChainRatioPct / 100);
    }
    for (const neighbor of targets) {
      const neighborWet = neighbor.wetUntil >= turn;
      const neighborWasChilled = neighbor.chill > 0;
      events.push({ type: 'chain-lightning', source: enemy.id, target: neighbor.id, element, ...spellVfxFlags });
      const effectiveChainPierce = gear.chainLightningFullPierce ? neighbor.armor : pierce;
      damage(neighbor, strength * chainRatio + flatBonus + (neighborWet ? 2 : 0), element, effectiveChainPierce, attackForm);
      if (gear.chainLightningManaOnHit > 0 && !gearChainManaRefunded) {
        gearChainManaRefunded = true;
        const refund = Math.min(getMaxMana(player) - player.mana, gear.chainLightningManaOnHit);
        if (refund > 0) {
          player.mana += refund;
          summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
          summary.manaAfterCast = player.mana;
          events.push({ type: 'mana-refund', amount: refund });
          summary.sequence.push(`ตราอสุนีชิ่งคืน +${refund} มานา`);
        }
      }
      if (isAsani && secondaryAsaniWetMana > 0 && neighborWet && !asaniWetManaRefunded) {
        asaniWetManaRefunded = true;
        const refund = Math.min(getMaxMana(player) - player.mana, secondaryAsaniWetMana);
        if (refund > 0) {
          player.mana += refund;
          summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
          summary.manaAfterCast = player.mana;
          events.push({ type: 'mana-refund', amount: refund });
          summary.sequence.push(`อัสนีชิ่งเป้าเปียกคืน +${refund} มานา`);
        }
      }
      if (element === 'frostvolt' && neighbor.hp > 0) {
        neighbor.chill += 4 + Math.floor((upgrades.frostvolt ?? 0) / 2);
        events.push({ type: 'status', status: 'chill', target: neighbor.id });
        if (gear.frostvoltFreezeAdjacent || ((secondaryFrostvoltChainFreezeChilled || gear.frostvoltChainFreezeChilled) && neighborWasChilled)) {
          neighbor.freeze += 1;
          events.push({ type: 'status', status: 'freeze', target: neighbor.id });
          onEnemyFrozen(neighbor);
          summary.sequence.push(`ผลึกช็อตชิ่งแช่แข็งช่อง ${neighbor.slot + 1}!`);
        }
      }
      summary.sequence.push(`${WORDS[element].label}ชิ่งไปช่อง ${neighbor.slot + 1}`);
    }
  }

  function pushEnemy(enemy, direction = 1, { fromPushCard = false, fromPullCard = false, steps = 1, sourceElement = null, allowCollision = direction === 1, zapStrength = 0, zapPierce = 0 } = {}) {
    if (enemy.hp <= 0) return;
    const boostedSlamElements = ['vayu', 'dust', 'heatwave', 'chillgale', 'monsoon', 'thunderstorm', 'magnet'];
    const windElems = spell?.elements ?? [];
    const usesBasicWind = sourceElement === 'wind' || windElems.includes('wind');
    const usesVayu = sourceElement === 'vayu' || windElems.includes('vayu');
    const usesDust = sourceElement === 'dust' || windElems.includes('dust');
    const usesMagnet = sourceElement === 'magnet' || windElems.includes('magnet');
    const usesMonsoon = sourceElement === 'monsoon' || windElems.includes('monsoon');
    const usesThunderstorm = sourceElement === 'thunderstorm' || windElems.includes('thunderstorm');
    const usesHeatwave = sourceElement === 'heatwave' || windElems.includes('heatwave');
    const usesChillgale = sourceElement === 'chillgale' || windElems.includes('chillgale');
    const windUpgradeSlam = (usesBasicWind ? Math.floor((upgrades.wind ?? 0) / 2) + secondaryWindSlamBonus : 0)
      + (usesVayu ? (upgrades.vayu ?? 0) + secondaryVayuSlamBonus : 0)
      + (usesDust ? (upgrades.dust ?? 0) + secondaryDustSlamBonus : 0)
      + (usesMagnet ? (upgrades.magnet ?? 0) * 2 + secondaryMagnetSlamBonus : 0)
      + (usesMonsoon ? (upgrades.monsoon ?? 0) + secondaryMonsoonSlamBonus : 0)
      + (usesThunderstorm ? (upgrades.thunderstorm ?? 0) + secondaryThunderstormSlamBonus : 0)
      + (usesHeatwave ? (upgrades.heatwave ?? 0) + secondaryHeatwaveSlamBonus : 0)
      + (usesChillgale ? (upgrades.chillgale ?? 0) + secondaryChillgaleSlamBonus : 0);
    const hasWindFamily = Boolean(sourceElement && (elementFamily(sourceElement) === 'wind' || boostedSlamElements.includes(sourceElement)))
      || windElems.some(id => elementFamily(id) === 'wind' || boostedSlamElements.includes(id));
    const hasBoostedSlam = Boolean(sourceElement && boostedSlamElements.includes(sourceElement))
      || windElems.some(id => boostedSlamElements.includes(id));
    const mult = (fromPushCard || fromPullCard) ? (spell?.multiplier ?? 1) : 1;
    const pushUpgrade = fromPushCard ? (upgrades.push ?? 0) + secondaryPushSlamBonus : 0;
    const pullUpgrade = fromPullCard ? (upgrades.pull ?? 0) + secondaryPullSlamBonus : 0;
    const impactElement = fromPullCard ? 'pull' : (fromPushCard && !hasWindFamily ? 'push' : (sourceElement ?? 'wind'));
    const totalSteps = steps
      + (usesBasicWind && direction === 1 ? secondaryWindExtraSteps : 0)
      + (usesVayu && direction === 1 ? secondaryVayuExtraSteps : 0)
      + (usesDust && direction === 1 ? secondaryDustExtraSteps : 0)
      + (usesChillgale && direction === 1 ? secondaryChillgaleExtraSteps : 0)
      + (usesMonsoon && direction === 1 ? gear.monsoonExtraPushSteps : 0)
      + (hasWindFamily && direction === 1 ? gear.windExtraPushSteps : 0);

    const tryMonsoonSlamMana = () => {
      if (!usesMonsoon || secondaryMonsoonSlamManaRefund <= 0 || monsoonSlamManaRefunded) return;
      monsoonSlamManaRefunded = true;
      const refund = Math.min(getMaxMana(player) - player.mana, secondaryMonsoonSlamManaRefund);
      if (refund > 0) {
        player.mana += refund;
        summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
        summary.manaAfterCast = player.mana;
        events.push({ type: 'mana-refund', amount: refund });
        summary.sequence.push(`คลื่นมรสุมกระแทกคืน +${refund} มานา`);
      }
    };

    for (let step = 0; step < totalSteps; step++) {
      if (enemy.hp <= 0) break;
      const slot = enemy.slot + direction;
      const blocker = slot >= 0 && slot <= 4 ? live().find(other => other.slot === slot) : null;
      if (blocker) {
        if (fromPullCard) {
          const collisionDmg = Math.round((hasBoostedSlam ? 10 : 8) * mult) + pullUpgrade + gear.windPushDamageBonus;
          events.push({ type: 'wall-slam', target: enemy.id, collider: blocker.id, amount: collisionDmg, collision: true });
          damage(enemy, collisionDmg, impactElement, enemy.armor);
          if (blocker.hp > 0) {
            events.push({ type: 'wall-slam', target: blocker.id, collider: enemy.id, amount: collisionDmg, collision: true });
            damage(blocker, collisionDmg, impactElement, blocker.armor);
          }
          if (gear.wallSlamArmorShred > 0) {
            if (enemy.hp > 0) applyEarthArmorShred(enemy, gear.wallSlamArmorShred);
            if (blocker.hp > 0) applyEarthArmorShred(blocker, gear.wallSlamArmorShred);
          }
          summary.sequence.push(`กระชากชนกัน! ช่อง ${enemy.slot + 1} ชนช่อง ${blocker.slot + 1} · ดาเมจตัวละ ${collisionDmg} (ทะลุเกราะ)`);
        } else if (fromPushCard || allowCollision || hasWindFamily) {
          const collisionDmg = (fromPushCard
            ? Math.round((hasBoostedSlam ? 10 : 8) * mult) + pushUpgrade
            : (hasBoostedSlam ? 6 : 3)) + windUpgradeSlam + gear.windPushDamageBonus;
          events.push({ type: 'wall-slam', target: enemy.id, collider: blocker.id, amount: collisionDmg, collision: true });
          damage(enemy, collisionDmg, impactElement, enemy.armor);
          if (blocker.hp > 0) {
            events.push({ type: 'wall-slam', target: blocker.id, collider: enemy.id, amount: collisionDmg, collision: true });
            damage(blocker, collisionDmg, impactElement, blocker.armor);
          }
          if (gear.wallSlamArmorShred > 0) {
            if (enemy.hp > 0) applyEarthArmorShred(enemy, gear.wallSlamArmorShred);
            if (blocker.hp > 0) applyEarthArmorShred(blocker, gear.wallSlamArmorShred);
          }
          const collideChill = (fromPushCard ? secondaryPushCollideChill : 0)
            + (usesVayu ? secondaryVayuCollideChill : 0)
            + (usesMagnet ? secondaryMagnetCollideChill : 0);
          const collideShred = (fromPushCard ? secondaryPushCollideArmorShred : 0)
            + (usesVayu ? secondaryVayuCollideArmorShred : 0)
            + (usesMagnet ? secondaryMagnetCollideShred : 0);
          if (collideChill > 0 || collideShred > 0) {
            for (const victim of [enemy, blocker]) {
              if (victim.hp > 0) {
                if (collideChill > 0) victim.chill += collideChill;
                if (collideShred > 0) applyEarthArmorShred(victim, collideShred);
              }
            }
          }
          if (usesDust && secondaryDustCollideDebuff && blocker.hp > 0) {
            applyEarthArmorShred(blocker, 1);
            blocker.obscured = true;
          }
          if (usesChillgale && secondaryChillgaleCollideFreeze) {
            for (const victim of [enemy, blocker]) {
              if (victim.hp > 0 && victim.chill > 0) {
                victim.freeze += 1;
                events.push({ type: 'status', status: 'freeze', target: victim.id });
                onEnemyFrozen(victim);
                summary.sequence.push(`ไอหนาวชนแช่แข็งช่อง ${victim.slot + 1}!`);
              }
            }
          }
          if (usesThunderstorm && secondaryThunderstormCollideZap && blocker.hp > 0 && zapStrength > 0) {
            const zapRatio = (secondaryThunderstormChainPct || 50) / 100;
            const blockerWet = blocker.wetUntil >= turn;
            events.push({ type: 'chain-lightning', source: enemy.id, target: blocker.id, element: 'thunderstorm', ...spellVfxFlags });
            damage(blocker, zapStrength * zapRatio + (blockerWet ? 2 : 0), 'thunderstorm', zapPierce, spell?.form ?? null);
            summary.sequence.push(`ฟ้าคะนองฟาดซ้ำตัวถูกชนช่อง ${blocker.slot + 1}`);
          }
          tryMonsoonSlamMana();
          summary.sequence.push(`กระแทกชนกัน! ช่อง ${enemy.slot + 1} ชนช่อง ${blocker.slot + 1} · ดาเมจตัวละ ${collisionDmg} (ทะลุเกราะ)`);
        }
        break;
      }
      if (slot < 0 || slot > 4) {
        if (fromPullCard) {
          const slamDmg = Math.max(hasBoostedSlam ? 6 : 4, Math.round(4 * mult) + pullUpgrade) + gear.windPushDamageBonus;
          events.push({ type: 'wall-slam', target: enemy.id, amount: slamDmg });
          damage(enemy, slamDmg, impactElement, enemy.armor);
          if (gear.wallSlamArmorShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, gear.wallSlamArmorShred);
          summary.sequence.push(`กระชากชนขอบหน้า · ดาเมจ ${slamDmg} (ทะลุเกราะ)`);
        } else if (fromPushCard || hasWindFamily) {
          const slamDmg = (fromPushCard
            ? Math.max(hasBoostedSlam ? 6 : 4, Math.round(4 * mult) + pushUpgrade)
            : (hasBoostedSlam ? 6 : 3)) + windUpgradeSlam + gear.windPushDamageBonus;
          events.push({ type: 'wall-slam', target: enemy.id, amount: slamDmg });
          damage(enemy, slamDmg, impactElement, fromPushCard ? enemy.armor : 0, fromPushCard ? null : (spell?.form ?? null));
          if (gear.wallSlamArmorShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, gear.wallSlamArmorShred);
          tryMonsoonSlamMana();
          summary.sequence.push(`กระแทกขอบสนาม · ดาเมจ ${slamDmg}`);
        }
        break;
      }
      enemy.slot = slot;
      events.push({ type: 'push', target: enemy.id, slot, ...(direction < 0 ? { pulled: true } : {}) });
    }
    if (usesMonsoon && secondaryMonsoonPushChill > 0 && enemy.hp > 0) {
      enemy.chill += secondaryMonsoonPushChill;
    }
    if (fromPullCard && enemy.hp > 0) {
      if (secondaryPullArmorShred > 0) applyEarthArmorShred(enemy, secondaryPullArmorShred);
      if (secondaryPullChillBonus > 0) enemy.chill += secondaryPullChillBonus;
    }
  }

  function leaveMagma(slot) {
    if (nextMagmaPuddles.has(slot)) return;
    nextMagmaPuddles.add(slot);
    events.push({ type: 'magma-puddle', slot });
    summary.sequence.push(`วางแอ่งแมกม่าช่อง ${slot + 1}`);
  }

  function enemyHealing(target, amount) {
    const effective = target.healCutUntil >= turn
      ? (gear.akkiFullHealCut ? 0 : Math.floor(amount / 2))
      : amount;
    return Math.min(effective, target.maxHp - target.hp);
  }

  function blast(target, targets, element, applyHit, extra) {
    const event = { type: 'blast', target, targets: targets.map(enemy => enemy.id), element, ...extra };
    events.push(event);
    const start = events.length;
    targets.forEach(applyHit);
    event.effectCount = events.length - start;
  }

  function expandedBlast(trigger, warded, kind) {
    if (!trigger) return;
    const devastation = kind === 'devastation';
    const radius = kind === 'wave' || kind === 'grand' ? 1 : (2 + (devastation ? gear.devastationRadiusBonus : 0));
    const { center, slot, strength, pierce, elements } = trigger;
    if (devastation && secondaryDevastationStripWard > 0) {
      for (const candidate of live()) {
        if (Math.abs(candidate.slot - slot) <= radius && candidate.ward > 0) {
          const stripped = Math.min(candidate.ward, secondaryDevastationStripWard);
          candidate.ward -= stripped;
          summary.wards += stripped;
          if (candidate.ward === 0) warded?.delete?.(candidate.id);
          events.push({ type: 'dispel', target: candidate.id, amount: stripped });
          summary.sequence.push(`ทำลายล้างสลายม่านช่อง ${candidate.slot + 1} −${stripped} ชั้น`);
        }
      }
    }
    const bypassWard = devastation && gear.devastationBypassWard;
    const targets = live().filter(enemy => Math.abs(enemy.slot - slot) <= radius
      && (bypassWard || enemy.ward === 0)
      && (kind !== 'grand' || enemy.slot !== slot)
      && (bypassWard || (devastation && enemy === center) || !warded.has(enemy.id)));
    const name = kind === 'wave' ? WORDS.blast.label : WORDS[kind].label;
    const bonus = devastation ? devastationUpgradeBonus : blastUpgradeBonus;
    const ratio = devastation ? (Math.max(secondaryDevastationBlastPct || 50, gear.devastationRatioPct) / 100) : blastSplashFactor;
    const totalDevShred = secondaryDevastationArmorShred + gear.devastationArmorShred;
    blast(center.id, targets, elements[0] ?? spell.form, enemy => {
      const splashAdd = enemy.slot !== slot ? gear.blastSplashBonus : 0;
      const hadBurn = enemy.burn > 0 || (newBurn.get(enemy.id) ?? 0) > 0;
      hit(enemy, strength * ratio + bonus + splashAdd, pierce, elements);
      if (hadBurn && gear.blastBurnDetonate > 0 && !gearBlastDetonated.has(enemy.id) && enemy.hp > 0) {
        gearBlastDetonated.add(enemy.id);
        damage(enemy, gear.blastBurnDetonate, 'fire', enemy.armor);
        summary.sequence.push(`เพลิงปะทุเป้าติดเผา +${gear.blastBurnDetonate} ดาเมจแท้`);
      }
      if (!devastation && secondaryBlastArmorShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, secondaryBlastArmorShred);
      if (devastation && totalDevShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, totalDevShred);
    }, { originSlot: slot, devastation, grand: Boolean(spell.grand), large: Boolean(spell.large), elements: [...new Set(elements)] });
    summary.sequence.push(`${name} · ${targets.length} เป้าหมาย`);
  }

  function applyIncomingToPlayer(rawAmount, triggerShieldEffects = true, attacker = null, damageElement = null, pierceArmor = 0, isHazard = false) {
    if (isHazard && gear.immuneHazardDamage) {
      summary.blocked += rawAmount;
      return { actual: 0, absorbed: rawAmount, effects: new Set(), explosions: [] };
    }
    const protectionBeforeHit = protection();
    let mitigated = rawAmount;
    const attackerAffinity = damageElement ?? (attacker ? (attacker.affinity ?? ENEMIES[attacker.kind]?.affinity ?? null) : null);
    let gearMitigation = Math.max(0, gear.naturalArmor - pierceArmor);
    if (triggerShieldEffects) {
      playerHitCountThisTurn++;
      if (playerHitCountThisTurn === 1 && gear.firstHitReduction > 0) gearMitigation += gear.firstHitReduction;
      if (rawAmount >= 10 && gear.heavyHitReduction > 0) gearMitigation += gear.heavyHitReduction;
    }
    if (attackerAffinity === 'fire' && gear.fireDamageReduction > 0) gearMitigation += gear.fireDamageReduction;
    if (attackerAffinity === 'ice' && gear.iceDamageReduction > 0) gearMitigation += gear.iceDamageReduction;
    if (attackerAffinity === 'lightning' && gear.lightningDamageReduction > 0) gearMitigation += gear.lightningDamageReduction;
    if (gearMitigation > 0 && mitigated > 0) {
      mitigated = Math.max(0, mitigated - gearMitigation);
    }
    if (triggerShieldEffects && attackerAffinity === 'fire' && gear.fireHitGainBlock > 0) {
      block += gear.fireHitGainBlock;
    }
    let remaining = mitigated;
    const guarded = Math.min(block, remaining);
    block -= guarded;
    remaining -= guarded;
    const layers = shieldLayers(player.shield);
    let broken = 0;
    let veilBroke = false;
    const effects = new Set();
    const explosions = [];
    const braceLv = upgrades.brace ?? 0;
    const braceSec = secondaryActive('brace') ? getCardSecondaryEffect('brace', Math.max(7, braceLv)) : null;
    const braceThreshold = braceSec?.braceThreshold ?? 10;
    const braceBonus = 6 + braceLv * 2;
    const triggerBraceLayer = layer => {
      if (!triggerShieldEffects || rawAmount < braceThreshold || layer.effect !== 'brace' || layer.triggered) return;
      layer.hp += braceBonus;
      for (const brace of layers) {
        if (brace.effect === 'brace' && brace.expires === layer.expires) brace.triggered = true;
      }
      player.shield = makeShield(layers);
      events.push({ type: 'brace', amount: braceBonus, protection: protection() });
      summary.sequence.push(`โล่ยืนหยัดเสริมการป้องกัน ${braceBonus}`);
      if (braceSec?.braceReflectDmg > 0 && attacker && attacker.hp > 0) {
        damage(attacker, braceSec.braceReflectDmg, 'shield', attacker.armor);
        summary.sequence.push(`โล่ยืนหยัดสะท้อนดาเมจแท้ ${braceSec.braceReflectDmg}`);
      }
      if (braceSec?.braceCounterChill > 0 && attacker && attacker.hp > 0) {
        attacker.chill += braceSec.braceCounterChill;
      }
      if (braceSec?.braceCounterHeal > 0 && player.hp > 0) {
        heal(braceSec.braceCounterHeal, false, 'shield-heal');
      }
    };
    if (remaining === 0 && rawAmount >= braceThreshold && layers.length) {
      triggerBraceLayer(layers[0]);
    }
    while (remaining > 0 && layers.length) {
      const layer = layers[0];
      triggerBraceLayer(layer);
      const absorbedLayer = Math.min(layer.hp, remaining);
      remaining -= absorbedLayer;
      layer.hp -= absorbedLayer;
      if (triggerShieldEffects && absorbedLayer > 0) {
        for (const effect of layer.elements ?? (WORDS[layer.effect]?.damage ? [layer.effect] : [])) effects.add(effect);
      }
      if (!layer.hp) {
        layers.shift();
        broken++;
        if (layer.effect === 'veil') veilBroke = true;
        if (layer.effect === 'blast' || layer.effect === 'akki-blast') explosions.push(layer.effect === 'akki-blast' ? 'akki' : 'fire');
      }
    }
    player.shield = makeShield(layers);
    if (triggerShieldEffects && broken && hasMagmaHeart) {
      for (const enemy of live()) damage(enemy, 12, 'fire', 0);
      summary.sequence.push('หัวใจแมกมาปะทุ · ระเบิดเพลิง 12 ใส่ศัตรูทั้งหมดเมื่อโล่แตก');
    }
    if (triggerShieldEffects && broken && gear.shieldBreakRetaliate > 0) {
      const retTarget = attacker?.hp > 0 ? attacker : live()[0];
      if (retTarget) {
        damage(retTarget, gear.shieldBreakRetaliate, 'shield', retTarget.armor);
        summary.sequence.push(`เกราะเศษกระดูกสะท้อน ${gear.shieldBreakRetaliate} ดาเมจแท้เมื่อโล่แตก`);
      }
    }
    if (triggerShieldEffects && gear.counterChillOnHit > 0 && attacker?.hp > 0) {
      attacker.chill += gear.counterChillOnHit;
      events.push({ type: 'status', status: 'chill', target: attacker.id });
    }
    if (triggerShieldEffects && gear.counterWetOnHit > 0 && attacker?.hp > 0) {
      attacker.wetUntil = Math.max(attacker.wetUntil ?? 0, turn + 2);
      events.push({ type: 'status', status: 'wet', target: attacker.id });
    }
    if (triggerShieldEffects && gear.highShieldRetaliate > 0 && protectionBeforeHit >= 10 && attacker?.hp > 0) {
      damage(attacker, gear.highShieldRetaliate, 'shield', attacker.armor);
      summary.sequence.push(`ดาบแสงสะท้อนสวนกลับ ${gear.highShieldRetaliate} ดาเมจแท้`);
    }
    if (triggerShieldEffects && gear.thornsLightningDmg > 0 && attacker?.hp > 0) {
      damage(attacker, gear.thornsLightningDmg, 'lightning', 2);
      summary.sequence.push(`ผ้าคลุมสายฟ้าช็อตสวนกลับ ${gear.thornsLightningDmg} ดาเมจ`);
    }
    if (triggerShieldEffects && gear.counterShredOnHit > 0 && attacker?.hp > 0) {
      applyEarthArmorShred(attacker, gear.counterShredOnHit);
    }
    if (triggerShieldEffects && gear.reflectIncomingPct > 0 && attacker?.hp > 0 && rawAmount > 0) {
      const reflDmg = Math.max(1, Math.round(rawAmount * gear.reflectIncomingPct / 100));
      damage(attacker, reflDmg, 'plasma', attacker.armor);
      summary.sequence.push(`เกราะพลาสมาสะท้อน ${reflDmg} ดาเมจแท้ใส่ผู้โจมตี`);
    }
    if (triggerShieldEffects && veilBroke) {
      const veilLv = upgrades.veil ?? 0;
      const veilSec = secondaryActive('veil') ? getCardSecondaryEffect('veil', Math.max(7, veilLv)) : null;
      const overflowCap = 8 + veilLv * 2;
      if (remaining > 0) {
        const extra = Math.min(remaining, overflowCap);
        remaining -= extra;
        summary.sequence.push(`ม่านแตก · กันส่วนล้น ${extra}`);
      }
      if (veilSec?.veilBreakReflectDmg > 0 && attacker && attacker.hp > 0) {
        damage(attacker, veilSec.veilBreakReflectDmg, 'veil', attacker.armor);
        summary.sequence.push(`ม่านมิติแตกสะท้อนดาเมจแท้ ${veilSec.veilBreakReflectDmg}`);
      }
      if (veilSec?.veilBreakChill > 0 && attacker && attacker.hp > 0) {
        attacker.chill += veilSec.veilBreakChill;
      }
      if (veilSec?.veilBreakHeal > 0 && player.hp > 0) {
        heal(veilSec.veilBreakHeal, false, 'shield-heal');
      }
      if (veilSec?.veilBreakMana > 0) {
        const refund = Math.min(getMaxMana(player) - player.mana, veilSec.veilBreakMana);
        if (refund > 0) {
          player.mana += refund;
          summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
          summary.manaAfterCast = player.mana;
          events.push({ type: 'mana-refund', amount: refund });
          summary.sequence.push(`ม่านมิติแตกคืน +${refund} มานา`);
        }
      }
    }
    let actual = Math.min(remaining, player.hp);
    if (gear.voidOverkillNegate && player.hp > 1 && remaining >= player.hp) {
      actual = player.hp - 1;
      summary.sequence.push('🕳️ เกราะกลืนความว่างเปล่าลบล้างดาเมจล้น · รอดชีวิตที่ 1 HP!');
    }
    const absorbed = Math.max(0, rawAmount - actual);
    player.hp -= actual;
    summary.blocked += absorbed;
    summary.incoming += actual;
    if (actual > 0 && gear.damageToManaPct > 0) {
      const gainedMp = Math.min(getMaxMana(player) - player.mana, Math.ceil(actual * gear.damageToManaPct / 100));
      if (gainedMp > 0) {
        player.mana += gainedMp;
        summary.manaRefunded = (summary.manaRefunded ?? 0) + gainedMp;
        summary.manaAfterCast = player.mana;
        events.push({ type: 'mana-refund', amount: gainedMp });
        summary.sequence.push(`เกราะกลืนความว่างเปล่าแปลงดาเมจเป็น +${gainedMp} MP`);
      }
    }
    if (player.hp > 0 && gear.lowHpEmergencyShield > 0 && !state.hydraEmergencyUsed && player.hp <= Math.ceil(player.maxHp * 0.3)) {
      state.hydraEmergencyUsed = true;
      const emergencyLayers = shieldLayers(player.shield);
      const addLayers = Math.min(2, Math.max(0, 12 - emergencyLayers.length));
      for (let i = 0; i < addLayers; i++) {
        emergencyLayers.push({ hp: gear.lowHpEmergencyShield, expires: turn + 1, effect: null, triggered: false });
      }
      player.shield = makeShield(emergencyLayers);
      events.push({ type: 'shield', amount: gear.lowHpEmergencyShield * addLayers, layers: addLayers, shieldKind: 'bonus', protection: protection() });
      summary.sequence.push(`🐉 เกราะเกล็ดไฮดรากางโล่ฉุกเฉิน ${addLayers} ชั้น×${gear.lowHpEmergencyShield}!`);
    }
    return { actual, absorbed, effects, explosions };
  }

  function attackPower(elements, targetScale = 1) {
    const families = elements.map(elementFamily);
    const base = elements.length ? elements.reduce((sum, id) => {
      const elemMult = id === 'plasma' ? 3 : ([
        'akki', 'heman', 'asani', 'pathaphi', 'wari', 'vayu',
        'magma', 'mudmire', 'dust', 'permafrost', 'magnet', 'mist', 'hail', 'monsoon', 'shockstream', 'thunderstorm',
        'heatwave', 'chillgale', 'scald', 'frostvolt',
      ].includes(id) ? 2 : 1);
      const elemUpgrade = (upgrades[id] ?? 0) * elemMult;
      const family = elementFamily(id);
      const blessingBonus = (family === 'fire' && blessings.includes('blessing_ember') ? 2 : 0)
        + (family === 'ice' && blessings.includes('blessing_frost') ? 2 : 0)
        + (family === 'lightning' && blessings.includes('blessing_thunder') ? 2 : 0);
      const relicBonus = (hasEmberCore && getElementComponents(id).includes('fire') ? 2 : 0)
        + (hasMagmaHeart && (getElementComponents(id).includes('fire') || getElementComponents(id).includes('earth')) ? 3 : 0)
        + (hasThunderConduit && getElementComponents(id).includes('lightning') ? 6 : 0);
      const gearElemBonus = getElementComponents(id).reduce((acc, comp) => acc + (gear.elementDamage[comp] ?? 0), 0);
      return sum + WORDS[id].damage + elemUpgrade + blessingBonus + relicBonus + gearElemBonus;
    }, 0) / elements.length : (spell.shellDamage ?? WORDS[spell.form].damage);
    const gearFormDmg = gear.formDamageBonus[spell.form] ?? 0;
    let strength = (base + formUpgradeBonus + auxUpgradeBonus + gear.flatSpellDamage + gearFormDmg) * spell.multiplier * targetScale;
    let elementBuffPct = 0;
    let elementBuffPierce = 0;
    if (elements.length && player.elementBuffs) {
      const comps = new Set(elements.flatMap(id => getElementComponents(id)));
      for (const comp of comps) {
        const buff = player.elementBuffs[comp];
        if (buff && buff.expires >= turn) {
          elementBuffPct = Math.max(elementBuffPct, buff.pct ?? 0);
          elementBuffPierce = Math.max(elementBuffPierce, buff.pierceBonus ?? 0);
        }
      }
    }
    if (elementBuffPct > 0) {
      strength = Math.round(strength * (100 + elementBuffPct) / 100);
    }
    if (secondaryDamagePct > 0) {
      strength = Math.round(strength * (100 + secondaryDamagePct) / 100);
    }
    if (gear.flatSpellDamagePct > 0) {
      strength = Math.round(strength * (100 + gear.flatSpellDamagePct) / 100);
    }
    const gearElemDmgPct = elements.length
      ? [...new Set([...elements, ...elements.flatMap(id => getElementComponents(id))])].reduce((acc, k) => acc + (gear.elementDamagePct[k] ?? 0), 0)
      : 0;
    if (gearElemDmgPct > 0) {
      strength = Math.round(strength * (100 + gearElemDmgPct) / 100);
    }
    const isDualFusion = elements.length > 1 || elements.some(id => Boolean(FUSED_ELEMENTS[id]));
    if (isDualFusion && gear.dualFusionDamagePct > 0) {
      strength = Math.round(strength * (100 + gear.dualFusionDamagePct) / 100);
    }
    if (spell?.devastation && gear.devastationDamagePctBonus > 0) {
      strength = Math.round(strength * (100 + gear.devastationDamagePctBonus) / 100);
    }
    if (hasCrownOfEternity && isDualFusion) {
      strength = Math.round(strength * 1.5);
    }
    const gearElemPierce = elements.length
      ? [...new Set([...elements, ...elements.flatMap(id => getElementComponents(id))])].reduce((acc, comp) => acc + (gear.elementPierce[comp] ?? 0), 0)
      : 0;
    const gearFormPierce = gear.formPierceBonus[spell.form] ?? 0;
    const pierce = (spell.pierce ?? 0)
      + pierceUpgradeBonus
      + elementBuffPierce
      + gear.pierceBonus
      + gearElemPierce
      + gearFormPierce
      + (hasMirrorPrism && spell.form === 'beam' ? 3 : 0)
      + (hasVoidAnnihilator ? 4 : 0)
      + (families.includes('lightning') || elements.some(id => ['plasma', 'shockstream', 'frostvolt', 'magnet', 'thunderstorm'].includes(id)) ? 2 : 0)
      + (blessings.includes('blessing_thunder') ? 1 : 0);
    return { strength: strength * (1 - lightPenalty / 100), pierce };
  }

  function pullNeighborsToward(enemy) {
    const pullSteps = secondaryMagnetPullRange >= 2 ? 2 : 1;
    const neighbors = live()
      .filter(other => other.id !== enemy.id)
      .sort((a, b) => Math.abs(a.slot - enemy.slot) - Math.abs(b.slot - enemy.slot) || a.slot - b.slot);
    for (const neighbor of neighbors) {
      if (enemy.hp <= 0 || neighbor.hp <= 0) continue;
      if (neighbor.slot < enemy.slot) pushEnemy(neighbor, 1, { allowCollision: true, sourceElement: 'magnet', steps: pullSteps });
      else if (neighbor.slot > enemy.slot) pushEnemy(neighbor, -1, { allowCollision: true, sourceElement: 'magnet', steps: pullSteps });
    }
  }

  function elementAfterHit(enemy, elements, strength, pierce, sweep, slot, pushCardEmpowers = false) {
    const fusedReaction = elements.length > 1 ? getFusedElementFromComponents(elements[0], elements[1]) : null;
    const effectiveElements = fusedReaction ? [...elements, fusedReaction] : elements;
    if (effectiveElements.includes('magma')) leaveMagma(slot);
    const gust = effectiveElements.some(id => ['wind', 'vayu', 'thunderstorm', 'dust', 'heatwave', 'chillgale'].includes(id));
    if (gust) {
      const zapOpts = effectiveElements.includes('thunderstorm') ? { zapStrength: strength, zapPierce: pierce } : {};
      pushEnemy(enemy, 1, pushCardEmpowers ? { fromPushCard: true, steps: 2, ...zapOpts } : zapOpts);
    }
    if (effectiveElements.includes('monsoon')) {
      for (const target of live()) {
        if (target.id !== enemy.id || !pushCardEmpowers) pushEnemy(target, 1, { sourceElement: 'monsoon' });
      }
    }
    if (effectiveElements.includes('magnet')) pullNeighborsToward(enemy);
    const conduitBonus = (hasThunderConduit ? 6 : 0)
      + (gear.staticQuartzChainDmg > 0 && (enemy.wetUntil >= turn || turn % 2 === 0) ? gear.staticQuartzChainDmg : 0);
    const hasLightningElem = effectiveElements.some(id => getElementComponents(id).includes('lightning'));
    if (effectiveElements.includes('frostvolt')) chainLightning(enemy, strength, pierce, sweep, 'frostvolt', spell.form, conduitBonus);
    else if (effectiveElements.includes('thunderstorm')) chainLightning(enemy, strength, pierce, sweep, 'thunderstorm', spell.form, conduitBonus);
    else if (effectiveElements.includes('asani')) chainLightning(enemy, strength, pierce, sweep, 'asani', spell.form, conduitBonus);
    else if ((hasThunderConduit || (gear.staticQuartzChainDmg > 0 && (enemy.wetUntil >= turn || turn % 2 === 0))) && hasLightningElem) {
      chainLightning(enemy, 0, pierce, sweep, 'lightning', spell.form, conduitBonus);
    }
    return gust;
  }

  function impact(enemy, elements = spell.elements, sweep, targetScale = 1) {
    if (player.hp <= 0 || enemy.hp <= 0) return;
    const { strength, pierce } = attackPower(elements, targetScale);
    const hadWardBeforeDispel = enemy.ward > 0;
    if (spell.dispel && enemy.ward > 0) {
      const amount = enemy.ward;
      summary.wards += amount;
      enemy.ward = 0;
      events.push({ type: 'dispel', target: enemy.id, amount });
      summary.sequence.push(`สลายม่านช่อง ${enemy.slot + 1} ${amount} ชั้น`);
      if (secondaryDispelWardBurstDmg > 0) {
        const burst = amount * secondaryDispelWardBurstDmg;
        damage(enemy, burst, 'dispel', enemy.armor);
        summary.sequence.push(`สลายม่านสะท้อนดาเมจแท้ +${burst}`);
      }
      if (secondaryDispelSplashWard > 0) {
        for (const adj of live()) {
          if (Math.abs(adj.slot - enemy.slot) === 1 && adj.ward > 0) {
            const stripped = Math.min(adj.ward, secondaryDispelSplashWard);
            adj.ward -= stripped;
            summary.wards += stripped;
            events.push({ type: 'dispel', target: adj.id, amount: stripped });
            summary.sequence.push(`สลายม่านลามช่อง ${adj.slot + 1} −${stripped} ชั้น`);
          }
        }
      }
      if (secondaryDispelManaRefund > 0 && !dispelManaRefunded) {
        dispelManaRefunded = true;
        const refund = Math.min(getMaxMana(player) - player.mana, secondaryDispelManaRefund);
        if (refund > 0) {
          player.mana += refund;
          summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
          summary.manaAfterCast = player.mana;
          events.push({ type: 'mana-refund', amount: refund });
          summary.sequence.push(`สลายม่านคืน +${refund} มานา`);
        }
      }
    }
    applyGearWariWardStrip(enemy, elements);
    if (enemy.hp <= 0) return;
    const blocked = spell.form !== 'beam' && enemy.ward > 0;
    if (blocked) { enemy.ward--; summary.wards++; }
    const element = elements[0] ?? (spell.shellBlast ? 'blast' : spell.form);
    const uniqueElements = [...new Set(elements)];
    events.push({
      type: 'projectile',
      form: spell.form,
      target: enemy.id,
      blocked,
      pierce,
      size: spell.multiplier,
      element,
      elements: uniqueElements,
      ...(lightPenalty ? { lightPenalty, lightPierce } : {}),
      grand: Boolean(spell.grand),
      large: Boolean(spell.large),
      shellBlast: Boolean(spell.shellBlast),
      ...(spell.barrage && !barrageSfxEmitted ? { barrage: true } : {}),
      visualModifiers: rawIds.filter(id => ['burn', 'freeze', 'pierce', 'seal', 'dispel', 'push', 'pull'].includes(id)),
    });
    if (spell.barrage && !barrageSfxEmitted) barrageSfxEmitted = true;
    const name = [
      WORDS[spell.form].label,
      spell.shellBlast ? WORDS.blast.label : spell.blastShot ? WORDS.shot.label : '',
      uniqueElements.map(id => WORDS[id].label).join('+'),
    ].filter(Boolean).join(' ');
    summary.sequence.push(`${name} → ${enemy.slot + 1}${blocked ? ' (ติดม่าน)' : ''}`);
    if (blocked) {
      if (enemy.kind === 'mirror_mage' || enemy.kind === 'eclipse_mage'
        || (enemy.kind === 'mirror_regent' && state.room === FLOOR40_BOSS_ROOM)) {
        const reflectAmt = enemy.kind === 'mirror_regent' ? 4 : enemy.kind === 'eclipse_mage' ? 3 : 2;
        const reflected = applyIncomingToPlayer(reflectAmt, false, enemy, null, 0, true);
        events.push({
          type: 'mirror-reflect',
          source: enemy.id,
          amount: reflected.actual,
          absorbed: reflected.absorbed,
          rawAttack: reflectAmt,
          protection: protection(),
        });
        summary.sequence.push(
          reflected.actual > 0
            ? `กระจกสะท้อน −${reflected.actual} HP`
            : `กระจกสะท้อน 0 (กันได้ ${reflected.absorbed})`
        );
      } else if ((enemy.kind === 'eternity_overlord' && state.eternityPhase === 2) || enemy.kind === 'eternity_reborn') {
        const reflectAmt = 10;
        const reflected = applyIncomingToPlayer(reflectAmt, false, enemy, null, 0, true);
        events.push({
          type: 'cosmic-echo',
          source: enemy.id,
          sourceKind: enemy.kind,
          amount: reflected.actual,
          absorbed: reflected.absorbed,
          rawAttack: reflectAmt,
          protection: protection(),
        });
        summary.sequence.push(
          reflected.actual > 0
            ? `ม่านดาราจักรสะท้อน −${reflected.actual} HP`
            : `ม่านดาราจักรสะท้อน 0 (กันได้ ${reflected.absorbed})`
        );
      }
      return;
    }
    const center = enemy.slot;
    const beamPiercedWard = spell.form === 'beam' && enemy.ward > 0;
    const beamWardBonus = beamPiercedWard ? secondaryBeamWardBonusDmg : 0;
    hit(enemy, strength + beamWardBonus, pierce, elements);
    if (spell.form === 'axe' && axeArmorShred && enemy.hp > 0) applyEarthArmorShred(enemy, axeArmorShred);
    if (spell.form === 'shot' && gear.shotArmorShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, gear.shotArmorShred);
    if (beamPiercedWard && secondaryBeamStripWard > 0 && enemy.hp > 0 && enemy.ward > 0) {
      const stripped = Math.min(enemy.ward, secondaryBeamStripWard);
      enemy.ward -= stripped;
      summary.wards += stripped;
      events.push({ type: 'dispel', target: enemy.id, amount: stripped });
      summary.sequence.push(`ลำแสงเฉือนม่านช่อง ${enemy.slot + 1} −${stripped} ชั้น`);
    }
    const pushCardEmpowers = Boolean(spell.push && (spell.form !== 'storm' || enemy.id === targetId));
    const gust = elementAfterHit(enemy, elements, strength, pierce, sweep, center, pushCardEmpowers);
    if (spell.seal && enemy.hp > 0) {
      const plannedAction = intent(enemy, turn, enemies, state.room, Boolean(state.rift?.instability));
      const isSupportOrWarded = hadWardBeforeDispel || enemy.ward > 0 || plannedAction.type !== 'attack';
      enemy.sealed = true;
      if (secondarySealChillBonus > 0) enemy.chill += secondarySealChillBonus;
      events.push({ type: 'seal', target: enemy.id });
      summary.sequence.push(`ผนึกท่าสนับสนุนช่อง ${enemy.slot + 1}`);
      if (secondarySealSplashAdjacent) {
        for (const adj of live()) {
          if (Math.abs(adj.slot - enemy.slot) === 1) {
            adj.sealed = true;
            if (secondarySealChillBonus > 0) adj.chill += secondarySealChillBonus;
            events.push({ type: 'seal', target: adj.id });
          }
        }
      }
      if (secondarySealPunishDmg > 0 && isSupportOrWarded) {
        damage(enemy, secondarySealPunishDmg, 'seal', enemy.armor);
        summary.sequence.push(`ตราผนึกสะท้อนอาคม +${secondarySealPunishDmg} ดาเมจแท้`);
        if (!sealPunishManaRefunded) {
          sealPunishManaRefunded = true;
          const refund = Math.min(getMaxMana(player) - player.mana, 1);
          if (refund > 0) {
            player.mana += refund;
            summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
            summary.manaAfterCast = player.mana;
            events.push({ type: 'mana-refund', amount: refund });
            summary.sequence.push(`ผนึกอาคมคืน +${refund} มานา`);
          }
        }
      }
    }
    if (spell.shellBlast) {
      const targets = live().filter(candidate => Math.abs(candidate.slot - center) <= 1);
      const shellRatio = Math.max(0.6, blastSplashFactor);
      blast(enemy.id, targets, element, target => {
        const splashAdd = target.slot !== center ? gear.blastSplashBonus : 0;
        const hadBurn = target.burn > 0 || (newBurn.get(target.id) ?? 0) > 0;
        hit(target, Math.ceil(strength * shellRatio) + blastUpgradeBonus + splashAdd, pierce, elements);
        if (hadBurn && gear.blastBurnDetonate > 0 && !gearBlastDetonated.has(target.id) && target.hp > 0) {
          gearBlastDetonated.add(target.id);
          damage(target, gear.blastBurnDetonate, 'fire', target.armor);
          summary.sequence.push(`เพลิงปะทุเป้าติดเผา +${gear.blastBurnDetonate} ดาเมจแท้`);
        }
        if (secondaryBlastArmorShred > 0 && target.hp > 0) applyEarthArmorShred(target, secondaryBlastArmorShred);
      }, {
        originSlot: center,
        ...(uniqueElements.length > 1 ? { radius: 1 } : {}),
        grand: Boolean(spell.grand),
        large: Boolean(spell.large),
        elements: uniqueElements,
      });
    }
    for (let count = 0; count < spell.blasts; count++) {
      const targets = live().filter(candidate => Math.abs(candidate.slot - center) <= 1);
      blast(enemy.id, targets, elements[0], target => {
        const splashAdd = target.slot !== center ? gear.blastSplashBonus : 0;
        const hadBurn = target.burn > 0 || (newBurn.get(target.id) ?? 0) > 0;
        hit(target, (target === enemy ? 5 : 3) + blastUpgradeBonus + splashAdd, pierce, elements);
        if (hadBurn && gear.blastBurnDetonate > 0 && !gearBlastDetonated.has(target.id) && target.hp > 0) {
          gearBlastDetonated.add(target.id);
          damage(target, gear.blastBurnDetonate, 'fire', target.armor);
          summary.sequence.push(`เพลิงปะทุเป้าติดเผา +${gear.blastBurnDetonate} ดาเมจแท้`);
        }
        if (secondaryBlastArmorShred > 0 && target.hp > 0) applyEarthArmorShred(target, secondaryBlastArmorShred);
      }, {
        grand: Boolean(spell.grand),
        large: Boolean(spell.large),
      });
    }
    if (spell.grand && spell.form === 'shot') {
      const targets = live().filter(candidate => Math.abs(candidate.slot - center) === 1);
      blast(enemy.id, targets, elements[0], target => hit(target, strength / 2 + blastUpgradeBonus, pierce, elements), {
        grand: true,
        large: Boolean(spell.large),
      });
    }
    if (pushCardEmpowers && !gust) {
      const steps = elements.includes('monsoon') ? 2 : 1;
      pushEnemy(enemy, 1, { fromPushCard: true, steps });
    }
    if (spell.pull) pushEnemy(enemy, -1, { fromPullCard: true, steps: 1 + secondaryPullExtraSteps, allowCollision: true });
    reactToAttack(enemy, elements);
    return { strength, pierce };
  }

  function reactToAttack(enemy, elements) {
    const families = elements.map(elementFamily);
    if (enemy.kind === 'ember_overlord' && enemy.hp > 0 && enemy.armor > 0 && !families.includes('ice')) {
      const thorns = applyIncomingToPlayer(2, false, enemy, 'fire', 0, true);
      events.push({
        type: 'ember-thorns',
        source: enemy.id,
        sourceKind: enemy.kind,
        specialBoss: true,
        amount: thorns.actual,
        absorbed: thorns.absorbed,
        rawAttack: 2,
        protection: protection(),
      });
      summary.sequence.push(
        thorns.actual > 0
          ? `เกล็ดแมกมาเผา −${thorns.actual} HP`
          : `เกล็ดแมกมา 0 (กันได้ ${thorns.absorbed})`
      );
    }
    if (enemy.kind === 'tempest_archon' && enemy.hp > 0 && enemy.armor > 0 && !families.includes('lightning') && !spell.pierce) {
      const staticHit = applyIncomingToPlayer(3, false, enemy, 'lightning', 0, true);
      events.push({
        type: 'storm-static',
        source: enemy.id,
        sourceKind: enemy.kind,
        specialBoss: true,
        amount: staticHit.actual,
        absorbed: staticHit.absorbed,
        rawAttack: 3,
        protection: protection(),
      });
      summary.sequence.push(
        staticHit.actual > 0
          ? `ประจุอัสนีช็อต −${staticHit.actual} HP`
          : `ประจุอัสนี 0 (กันได้ ${staticHit.absorbed})`
      );
    }
    const groundedCast = elements.some(id => getElementComponents(id).includes('earth'));
    if ((enemy.kind === 'thunder_drake_emperor' || enemy.kind === 'storm_sovereign_drake') && enemy.hp > 0 && enemy.armor > 0
      && !(enemy.groundedUntil >= turn) && !groundedCast && !spell.pierce) {
      const staticAmt = enemy.kind === 'storm_sovereign_drake' ? 5 : 4;
      const starStatic = applyIncomingToPlayer(staticAmt, false, enemy, 'lightning', 0, true);
      events.push({
        type: 'storm-static',
        source: enemy.id,
        sourceKind: enemy.kind,
        specialBoss: true,
        amount: starStatic.actual,
        absorbed: starStatic.absorbed,
        rawAttack: staticAmt,
        protection: protection(),
      });
      summary.sequence.push(
        starStatic.actual > 0
          ? `เกราะประจุดาราช็อต −${starStatic.actual} HP`
          : `เกราะประจุดารา 0 (กันได้ ${starStatic.absorbed})`
      );
    }
  }

  function heal(amount, nextTurn = false, healKind = null) {
    const actual = Math.min(amount, player.maxHp - player.hp);
    player.hp += actual;
    summary.healed += actual;
    const resolvedKind = healKind
      ?? (spell?.grand ? 'grand' : spell?.large ? 'large' : spell?.multiplier > 1 ? 'pair' : spell?.form === 'shield' ? 'shield-heal' : nextTurn ? 'regen' : 'heal');
    const event = {
      type: 'heal',
      source: 'player',
      target: 'player',
      amount: actual,
      healKind: resolvedKind,
      grand: Boolean(resolvedKind === 'grand' || resolvedKind === 'regen' || (!nextTurn && spell?.grand)),
      large: Boolean(resolvedKind === 'large' || (!nextTurn && spell?.large)),
    };
    if (nextTurn) event.nextTurn = true;
    events.push(event);
    if (!nextTurn && actual > 0 && gear.healToBlockPct > 0) {
      const healBlock = Math.max(1, Math.round(actual * gear.healToBlockPct / 100));
      block += healBlock;
      events.push({ type: 'shield', amount: healBlock, secondary: true, shieldKind: 'bonus', protection: protection() });
      summary.sequence.push(`อาภรณ์นักบวชแปลงการฟื้นฟูเป็นเกราะ +${healBlock}`);
    }
    if (!nextTurn && secondaryOverhealShieldCap > overhealBlockedSoFar && (spell?.form === 'heal' || (spell?.form === 'shield' && spell?.healing) || (spell?.form === 'fill' && spell?.resource === 'blood'))) {
      const overflow = Math.max(0, amount - actual);
      const granted = Math.min(overflow, secondaryOverhealShieldCap - overhealBlockedSoFar);
      if (granted > 0) {
        overhealBlockedSoFar += granted;
        block += granted;
        summary.overhealShield = (summary.overhealShield ?? 0) + granted;
        events.push({ type: 'shield', amount: granted, secondary: true, shieldKind: 'bonus', protection: protection() });
        summary.sequence.push(`ฮีลส่วนเกินแปลงเป็นเกราะ +${granted}`);
      }
    }
  }

  function protection() {
    return shieldProtection(player.shield, block);
  }

  function castShield(activationTurn) {
    const baseLayerCap = (spell.layerHp ?? 6) + shieldUpgradeBonus + (spell.delayed ? (upgrades.delay ?? 0) : 0);
    const defenseScaleBonus = Math.min(100, getTowerSpellBonus(state.room));
    const riftDefenseBonus = inRift ? Math.ceil(baseLayerCap * defenseScaleBonus / 100) + Math.floor((player.maxHp ?? 36) * 0.025) : 0;
    const layerCap = baseLayerCap + riftDefenseBonus + (hasWorldloom ? 3 : 0);
    const created = Array.from({ length: spell.layers }, (_, index) => ({
      hp: layerCap,
      expires: activationTurn + 1,
      effect: spell.effect,
      triggered: false,
      ...(spell.layerEffects && { elements: spell.layerEffects[index] }),
      ...(spell.grand && { grand: true }),
      ...(spell.large && { large: true }),
    }));
    player.shield = makeShield([...shieldLayers(player.shield), ...created]);
    events.push({
      type: 'shield',
      amount: spell.layers * layerCap + secondaryShieldBonus,
      layers: spell.layers,
      element: spell.effect,
      shieldKind: spell.effect ?? 'shield',
      grand: Boolean(spell.grand),
      large: Boolean(spell.large),
      elements: spell.elements ?? [],
      protection: protection(),
      ...(spell.delayed && { delayed: true }),
    });
    const delayedHeal = unlockedSecondaryEffects.find(eff => eff.id === 'delayed_mend')?.delayedHeal ?? 0;
    const healedBefore = summary.healed;
    if (spell.healing || secondaryHealBonus > 0 || delayedHeal > 0) {
      const rawHeal = (spell.healing ?? 0) + healUpgradeBonus + secondaryHealBonus;
      const riftHealBonus = inRift && rawHeal > 0 ? Math.ceil(rawHeal * defenseScaleBonus / 100) + Math.floor((player.maxHp ?? 36) * 0.03) : 0;
      heal(rawHeal + riftHealBonus + delayedHeal, Boolean(spell.delayed), 'shield-heal');
    }
    if (hasGaiaEmblem) {
      heal(4, Boolean(spell.delayed), 'gaia');
      summary.sequence.push('ตราพระแม่ธรณีฟื้นฟู +4 HP จากการกางโล่');
    }
    if (gear.shieldGrantsSummonWard > 0 && state.player.summon?.hp > 0) {
      state.player.summon.ward = Math.min(5, (state.player.summon.ward ?? 0) + gear.shieldGrantsSummonWard);
      summary.sequence.push(`ไม้เท้าโล่เหล็กมอบม่าน +${gear.shieldGrantsSummonWard} ให้ ${state.player.summon.name}`);
    }
    if (spell.delayed) {
      const healed = summary.healed - healedBefore;
      summary.delayedShield = { amount: layerCap, healed };
      summary.sequence.push(`ต้นเทิร์นถัดไปกางโล่ ${layerCap} หน่วย${healed ? ` · ฟื้น ${healed} HP` : ''}`);
    }
  }

  function shieldBlast(count, element = 'fire') {
    summary.sequence.push(`โล่ระเบิด ${count} ครั้ง`);
    for (let i = 0; i < count; i++) {
      const targets = live();
      blast('player', targets, element, enemy => {
        damage(enemy, 5 + blastUpgradeBonus + (upgrades.shield ?? 0) + (hasEmberCore ? 2 : 0), element, pierceUpgradeBonus);
        if (element === 'akki' && enemy.hp > 0) enemy.healCutUntil = turn + 1 + secondaryAkkiHealCutExtend;
        if (secondaryBlastArmorShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, secondaryBlastArmorShred);
      }, { protection: protection() });
    }
  }

  const summonLevel = upgrades.summon ?? 0;
  const summonInTower = getFloorInfo(state.room, state.rooms?.length).floor;
  const summonStuns = new Set();

  function summonEffect(id) {
    return hasCardSecondaryUpgrade(state, id) || (ascended && uniquePhraseIds.includes(id))
      ? getCardSecondaryEffect(id, Math.max(7, upgrades[id] ?? 0)) : null;
  }

  function refundSummonMana(amount) {
    const maxM = getMaxMana(player);
    const refund = Math.min(amount, maxM - player.mana);
    const overflow = Math.max(0, amount - refund);
    if (refund > 0) {
      player.mana += refund;
      summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
      summary.manaAfterCast = player.mana;
      events.push({ type: 'mana-refund', amount: refund });
    }
    if (overflow > 0 && gear.manaOverflowToBlock > 0 && gearManaOverflowBlocked < 16) {
      const gained = Math.min(16 - gearManaOverflowBlocked, overflow * gear.manaOverflowToBlock);
      if (gained > 0) {
        gearManaOverflowBlocked += gained;
        block += gained;
        events.push({ type: 'shield', amount: gained, secondary: true, shieldKind: 'bonus', protection: protection() });
        summary.sequence.push(`แหวนตาน้ำแปลงมานาส่วนเกินเป็นเกราะ +${gained}`);
      }
    }
  }

  function grantSummonShield(amount, expires) {
    const layers = shieldLayers(player.shield);
    if (layers.length >= 12) return;
    player.shield = makeShield([...layers, { hp: amount, expires, effect: null, triggered: false }]);
    events.push({ type: 'shield', amount, shieldKind: 'bonus', protection: protection() });
  }

  function stripSummonTargetWard(enemy, amount) {
    const removed = Math.min(amount, enemy.ward ?? 0);
    if (!removed) return false;
    enemy.ward -= removed;
    enemy.summonWardBreakUntil = turn + 1;
    events.push({ type: 'dispel', target: enemy.id, amount: removed });
    return true;
  }

  function summonHit(enemy, strength, element, pierce = 0, bypassWard = false) {
    if (strength <= 0 || enemy.hp <= 0) return { amount: 0 };
    if (!bypassWard && !gear.summonBypassWard && stripSummonTargetWard(enemy, 1)) {
      summary.wards++;
      return { amount: 0, blocked: true };
    }
    const before = enemy.hp;
    damage(enemy, strength, element || 'physical', pierce);
    const amount = before - enemy.hp;
    if (getElementComponents(element).length) applyBossElementEffects(enemy, [element]);
    return { amount };
  }

  function summonReaction(enemy, unit, castElements, strength) {
    if (!unit.element || enemy.hp <= 0) return;
    const element = castElements.find(id => id && id !== unit.element);
    const fusion = getFusedElementFromComponents(unit.element, element);
    if (!fusion) return;
    const wet = enemy.wetUntil >= turn;
    if (fusion === 'scald' || fusion === 'permafrost') applyEarthArmorShred(enemy, 2);
    if (fusion === 'hail' || fusion === 'frostvolt') {
      if (wet || enemy.chill > 0 || fusion === 'hail') {
        enemy.freeze = Math.max(enemy.freeze ?? 0, 1);
        delete enemy.wetUntil;
        events.push({ type: 'status', status: 'freeze', target: enemy.id });
        onEnemyFrozen(enemy);
      }
    } else applyMoisture(enemy, [fusion]);
    if (['shockstream', 'frostvolt', 'thunderstorm'].includes(fusion)) {
      const neighbor = live().find(other => other.id !== enemy.id && Math.abs(other.slot - enemy.slot) === 1);
      if (neighbor) summonHit(neighbor, Math.ceil(strength / 2), fusion, 2);
    }
    summary.sequence.push(`ผสานธาตุ ${WORDS[fusion].label}`);
  }

  function summonFollowup(unit, castElements, relay = false) {
    const selected = enemyById(targetId);
    const enemy = selected?.hp > 0 ? selected : live()[0];
    if (!enemy) return;
    const id = unit.creatureId;
    const effect = summonEffect(id);
    const element = unit.element || 'strike';
    const titan = Boolean(effect?.golemTitanSunder);
    const dragonTrueDamage = Boolean(effect?.dragonTrueDamage || (id === 'dragon' && gear.dragonTrueStrike));
    const creatureGear = gear.summonCreatureBonus[id] ?? {};
    let strength = unit.strike;
    let pierce = (unit.element === 'asani' ? 4 : unit.element === 'lightning' ? 2 : 0)
      + (effect?.pierceBonus ?? 0)
      + (creatureGear.pierce ?? 0);
    if (id === 'dog' || id === 'frog') pierce += 2;
    const targetDebuffed = Boolean(enemy.burn || enemy.chill || enemy.freeze || enemy.obscured || enemy.sealed || enemy.wetUntil >= turn);
    if (id === 'cat' && targetDebuffed) {
      strength = Math.ceil(strength * 1.5);
    }
    if (id === 'lion' || (id === 'croc' && enemy.wetUntil >= turn)) strength = Math.ceil(strength * 1.5);
    if (gear.summonAllDmgPct > 0) strength = Math.ceil(strength * (100 + gear.summonAllDmgPct) / 100);
    if (gear.summonDebuffedStrikePct > 0 && targetDebuffed) strength = Math.ceil(strength * (100 + gear.summonDebuffedStrikePct) / 100);
    if (gear.summonWetBonusPct > 0 && enemy.wetUntil >= turn) strength = Math.ceil(strength * (100 + gear.summonWetBonusPct) / 100);
    if (relay && gear.summonRelayBonusPct > 0) strength = Math.ceil(strength * (100 + gear.summonRelayBonusPct) / 100);
    if (id === 'boar' || id === 'hornet' || dragonTrueDamage || titan) pierce = enemy.armor;
    if (id === 'kraken' && gear.krakenStripAllWard) {
      for (const candidate of live()) {
        if (candidate.ward > 0) stripSummonTargetWard(candidate, candidate.ward);
      }
      summary.sequence.push('🐙 คราเคนสลายม่านศัตรูทั้งสนามทั้งหมด!');
    } else if (id === 'siren' || id === 'kraken') {
      stripSummonTargetWard(enemy, 1);
    }
    if (titan) strength += unit.isGrand ? 12 : 8;
    const result = summonHit(enemy, strength, element, pierce, dragonTrueDamage || id === 'bird');
    events.push({ type: 'summon_strike', source: 'summon', creature: id, element: unit.element, target: enemy.id, relay, ...result });
    summary.sequence.push(result.blocked
      ? `${unit.name} ออกหมัดประสาน · ม่านรับไว้`
      : `${unit.name} ออกหมัดประสาน ${result.amount} ดาเมจ`);
    let totalStrikeDealt = result.amount ?? 0;
    if (!result.blocked) {
      if (titan && enemy.hp > 0) {
        applyEarthArmorShred(enemy, ENEMIES[enemy.kind].armor + enemy.armor);
        summonStuns.add(enemy.id);
        events.push({ type: 'status', status: 'freeze', target: enemy.id });
      } else if (id === 'bear' || id === 'golem') applyEarthArmorShred(enemy, 2);
      if (id === 'golem' && gear.golemAoeShred > 0) {
        for (const other of live()) applyEarthArmorShred(other, gear.golemAoeShred);
        summary.sequence.push(`แกนไททันสั่นสะเทือนลดเกราะศัตรูทั้งสนาม −${gear.golemAoeShred}`);
      }
      if (id === 'behemoth' && gear.behemothAoeShred > 0) {
        for (const other of live()) applyEarthArmorShred(other, gear.behemothAoeShred);
        summary.sequence.push(`คทาเบฮีมอธทุบเกราะศัตรูทั้งสนาม −${gear.behemothAoeShred}`);
      }
      if (titan || id === 'eagle' || id === 'hydra') {
        const splash = live().filter(other => other.id !== enemy.id && (titan || Math.abs(other.slot - enemy.slot) === 1));
        for (const other of splash) {
          const sp = summonHit(other, Math.round(strength * 0.35), element, pierce);
          totalStrikeDealt += sp.amount ?? 0;
        }
      }
      if (effect?.dogAlphaDoubleStrike) {
        const d2 = summonHit(enemy, Math.ceil(strength * 0.5), element, pierce);
        totalStrikeDealt += d2.amount ?? 0;
        if (player.hand.length < getHandLimit(player)) drawCards(state, 1);
      }
      if (id === 'dragon' && gear.dragonDoubleStrike) {
        const secondTarget = enemy.hp > 0 ? enemy : live()[0];
        if (secondTarget) {
          const secondRes = summonHit(secondTarget, strength, element, dragonTrueDamage ? secondTarget.armor : pierce, dragonTrueDamage);
          totalStrikeDealt += secondRes.amount ?? 0;
          events.push({ type: 'summon_strike', source: 'summon', creature: id, element: unit.element, target: secondTarget.id, relay, ...secondRes });
          summary.sequence.push(`🐲 แหวนเนตรมังกรออกหมัดซ้ำ ${secondRes.amount} ดาเมจแท้!`);
        }
      }
      summonReaction(enemy, unit, castElements, strength);
    }
    if (totalStrikeDealt > 0 && gear.summonDmgLifestealPct > 0 && player.hp > 0) {
      const leech = Math.max(1, Math.round(totalStrikeDealt * gear.summonDmgLifestealPct / 100));
      heal(leech, false, 'bonus');
      summary.sequence.push(`เสื้อคลุมนรกานต์ดูดเลือดจากอัญเชิญ +${leech} HP`);
    }
    if (totalStrikeDealt > 0 && gear.summonAttackPlayerHeal > 0 && player.hp > 0) {
      heal(gear.summonAttackPlayerHeal, false, 'bonus');
    }
    if (summonLevel >= 10) refundSummonMana(2);
    if (gear.summonStrikeMana > 0) refundSummonMana(gear.summonStrikeMana);
    if (gear.summonStrikeDraw > 0) {
      const canDraw = Math.max(0, getHandLimit(player) - player.hand.length);
      const drawAmt = Math.min(canDraw, gear.summonStrikeDraw);
      if (drawAmt > 0) drawCards(state, drawAmt);
    }
  }

  if (guard) {
    events.push({ type: 'shield', amount: block, shieldKind: 'guard', protection: protection() });
  } else if (fizzled) {
    const expression = rawIds.map(id => WORDS[id].label).join(' ');
    events.push({ type: 'fizzle', ids: rawIds, cost, expression });
    summary.sequence.push(`คาถาล้มเหลว (${expression}) · เสีย ${cost} มานาฟรีโดยไม่มีผล`);
  } else if (spell.form === 'summon') {
    const prevSummon = state.player.summon;
    let resonanceWard = 0;
    if (prevSummon && prevSummon.turnCreated < turn && prevSummon.hp > 0) {
      summonFollowup(prevSummon, [spell.element], true);
      if (spell.element && spell.element === prevSummon.element) {
        resonanceWard = 1;
        summary.sequence.push('ธาตุตรงกัน · สิ่งอัญเชิญตัวใหม่ได้ม่าน 1 ชั้น');
      }
      if (gear.summonRelayWard > 0) {
        resonanceWard += gear.summonRelayWard;
        summary.sequence.push(`ส่งไม้ต่อพันธสัญญามอบม่าน +${gear.summonRelayWard} ชั้น`);
      }

      events.push({
        type: 'summon_relay',
        oldCreature: prevSummon.creatureId,
        newCreature: spell.creature,
        oldElement: prevSummon.element,
        newElement: spell.element,
      });
      events.push({ type: 'summon_depart', creature: prevSummon.creatureId });
      summary.sequence.push(`${prevSummon.name} ส่งไม้ต่อพันธสัญญาให้ ${WORDS[spell.creature]?.label || spell.creature} แล้วสลายตัว`);
    }

    clearSummon(state);
    const cStats = CREATURE_STATS[spell.creature] || {
      name: WORDS[spell.creature]?.label || spell.creature,
      cost: 1,
      baseHp: 15,
      baseCounter: 4,
      baseStrike: 12,
      armor: 0,
      ward: 0,
      growthHp: 1.5,
      growthDmg: 1.0,
      glyph: '⛧',
    };
    const summonLv = summonLevel;
    const creatureLv = upgrades[spell.creature] ?? 0;
    const creatureEffect = summonEffect(spell.creature);
    const creatureGear = gear.summonCreatureBonus[spell.creature] ?? {};
    const isCommonCreature = (WORDS[spell.creature]?.rarity ?? 'common') === 'common';
    const elem = spell.element;
    const isEarthSummon = elem === 'earth' || elem === 'pathaphi' || spell.creature === 'golem';
    const isWindOrEarthSummon = isEarthSummon || elem === 'wind' || elem === 'vayu' || spell.creature === 'gargoyle';
    const globalHpBonus = summonLv * 2
      + gear.summonAllHp
      + (isCommonCreature ? gear.summonCommonHp : 0)
      + (isEarthSummon ? gear.earthSummonHp : 0)
      + (isWindOrEarthSummon ? gear.windEarthSummonHp : 0)
      + (creatureGear.hp ?? 0);
    const creatureHpBonus = Math.round(cStats.growthHp * creatureLv);
    const endurance = 1 + Math.max(0, summonInTower - 5) * 0.025;
    let baseHp = (cStats.baseHp + globalHpBonus + creatureHpBonus + (creatureEffect?.creatureBonusHp ?? 0)) * endurance;

    if (elem === 'earth' || elem === 'magma') {
      baseHp = Math.round(baseHp * 1.20);
    } else if (elem === 'pathaphi') {
      baseHp = Math.round(baseHp * 1.35);
    }
    const maxHp = Math.round(baseHp * (spell.grand ? 1.5 : 1));

    const globalDmgMult = 1 + summonLv * 0.02;
    const endgameFloors = Math.max(0, summonInTower - 50);
    const creatureDmgBonus = creatureLv * cStats.growthDmg + (creatureEffect?.creatureBonusDmg ?? 0);
    const counterTraining = 1 + endgameFloors * 0.032;
    let baseCounter = Math.round((cStats.baseCounter + creatureDmgBonus) * globalDmgMult * counterTraining) + gear.summonAllCounter;
    const strikeTraining = 1 + Math.max(0, summonInTower - 5) * 0.018 + endgameFloors * (0.03 + cStats.cost / 450);
    const baseStrike = Math.round((cStats.baseStrike + creatureDmgBonus) * globalDmgMult * strikeTraining)
      + gear.summonAllStrike
      + (isCommonCreature ? gear.summonCommonStrike : 0)
      + (creatureGear.strike ?? 0);

    if (elem === 'fire' || elem === 'magma' || elem === 'scald' || elem === 'plasma') {
      baseCounter = Math.round(baseCounter * 1.25);
    } else if (elem === 'akki') {
      baseCounter = Math.round(baseCounter * 1.40);
    }

    const counter = spell.grand ? Math.round(baseCounter * 1.5) : baseCounter;
    const strike = spell.grand ? Math.round(baseStrike * 1.5) : baseStrike;

    let armor = (cStats.armor ?? 0) + gear.summonAllArmor + (isEarthSummon ? gear.earthSummonArmor : 0) + (creatureGear.armor ?? 0);
    if (elem === 'pathaphi') armor += 2;

    const isAerialSummon = ['bird', 'eagle'].includes(spell.creature) || elem === 'wind' || elem === 'vayu';
    let ward = (cStats.ward ?? 0)
      + resonanceWard
      + gear.summonAllWard
      + (isAerialSummon ? gear.summonAerialStartWard : 0)
      + (creatureGear.ward ?? 0)
      + (gear.summonEvenTurnWard > 0 && turn % 2 === 0 ? gear.summonEvenTurnWard : 0);
    if (secondaryActive('summon') && summonLv >= 9) ward += 1;

    if (secondaryActive('summon') && summonLv >= 7) refundSummonMana(1);
    if (isCommonCreature && gear.summonCommonManaRefund > 0) {
      refundSummonMana(gear.summonCommonManaRefund);
      summary.sequence.push(`คทาจ่าฝูงคืน +${gear.summonCommonManaRefund} มานา`);
    }
    if (gear.summonCastHeal > 0) {
      heal(gear.summonCastHeal, false, 'summon-water');
      summary.sequence.push(`ไม้เท้าฟีนิกซ์ฟื้น +${gear.summonCastHeal} HP จากการอัญเชิญ`);
    }
    if (spell.creature === 'behemoth' && (gear.behemothInvokeShred > 0 || gear.behemothInvokeTrueDmg > 0)) {
      for (const foe of live()) {
        if (gear.behemothInvokeShred > 0) applyEarthArmorShred(foe, gear.behemothInvokeShred);
        if (gear.behemothInvokeTrueDmg > 0 && foe.hp > 0) damage(foe, gear.behemothInvokeTrueDmg, 'earth', foe.armor);
      }
      summary.sequence.push(`🦏 กระดิ่งเบฮีมอธสั่นสะเทือน · ลดเกราะ −${gear.behemothInvokeShred} และ ${gear.behemothInvokeTrueDmg} ดาเมจแท้ทั้งสนาม!`);
    }
    if (creatureEffect?.creatureDrawOnSummon) {
      drawCards(state, creatureEffect.creatureDrawOnSummon);
      summary.sequence.push('จ่าฝูงนักล่า จั่วเพิ่ม 1 ใบ');
    }
    if (spell.creature === 'turtle') grantSummonShield(6 + creatureLv + (creatureGear.shieldBonus ?? 0), turn + 1);
    if (spell.creature === 'sprite') {
      refundSummonMana(2);
      drawCards(state, 1);
    }
    if (creatureEffect?.dragonRoarDebuff) {
      for (const enemy of live()) {
        enemy.chill += creatureEffect.dragonRoarDebuff;
        enemy.lastingChill = true;
      }
    }
    if (elem === 'water' || elem === 'wari') {
      heal((elem === 'wari' ? 4 : 2) + Math.floor(endgameFloors * 0.65), false, 'summon-water');
    } else if (elem === 'earth' || elem === 'pathaphi') {
      const cover = Math.floor(endgameFloors * (elem === 'pathaphi' ? 1.35 : 0.9));
      if (cover > 0) grantSummonShield(cover, turn + 2);
    }

    const summonUnit = {
      creatureId: spell.creature,
      name: cStats.name,
      element: spell.element,
      isGrand: Boolean(spell.grand),
      maxHp,
      hp: maxHp,
      armor,
      ward,
      counter,
      strike,
      turnCreated: turn,
      aoeIntercept: Boolean(cStats.aoeIntercept),
    };

    state.player.summon = summonUnit;
    state.summon = summonUnit;
    events.push({
      type: 'summon_invoke',
      creature: spell.creature,
      name: cStats.name,
      element: spell.element,
      hp: maxHp,
      maxHp,
      armor,
      ward,
      counter,
      strike,
      aoeIntercept: Boolean(cStats.aoeIntercept),
      isGrand: Boolean(spell.grand),
    });
    summary.sequence.push(`อัญเชิญ ${cStats.name}${spell.element ? `ธาตุ${ELEMENT_LABELS[spell.element] || spell.element}` : ''} (${maxHp} HP) ยืนแนวหน้า`);
  } else if (BATTLE_LIMITED_WORDS.includes(spell.form)) {
    state.legendaryTurns ??= {};
    state.legendaryTurns[spell.form] = turn;
    if (spell.form === 'timestop') {
      state.timestopUses = (state.timestopUses ?? 0) + 1;
      if (state.timestopUses >= 1 + gear.timestopExtraUses) {
        player.hand = player.hand.filter(id => id !== 'timestop');
      }
    } else {
      player.hand = player.hand.filter(id => id !== spell.form);
    }
    events.push({ type: spell.form });
    if (timeStopped) {
      summary.timeStopped = true;
      summary.sequence.push('หยุดเวลา · ข้ามรอบศัตรูทุกตัว');
      const recovery = unlockedSecondaryEffects.find(eff => eff.id === 'timestop_recovery')?.timestopHeal ?? 0;
      if (recovery > 0 && player.hp < player.maxHp) heal(recovery);
      if (gear.timestopNextTurnFreeCast) {
        state.freeManaUntilTurn = Math.max(state.freeManaUntilTurn ?? 0, turn + 1);
        summary.sequence.push('⏳ นาฬิกาทรายโครนอส · เทิร์นถัดไปร่ายฟรี 0 MP!');
      }
    } else {
      summary.sequence.push('เริ่มจุติ · รอดถึงเทิร์นหน้าเพื่อร่ายฟรีพร้อมการ์ด +10');
    }
  } else if (spell.form === 'death') {
    state.deathSpent = true;
    player.hand = player.hand.filter(id => id !== 'death');
    const enemy = enemyById(targetId);
    const isBossTarget = Boolean(ENEMIES[enemy.kind]?.isBoss);
    if (isBossTarget) {
      if (secondaryDeathBossStripWard > 0 && enemy.ward > 0) {
        const stripped = Math.min(enemy.ward, secondaryDeathBossStripWard);
        enemy.ward -= stripped;
        summary.wards += stripped;
        events.push({ type: 'dispel', target: enemy.id, amount: stripped });
      }
      const bossDmg = Math.round((100 + (upgrades.death ?? 0) * 25 + gear.deathBossDmgBonus) * secondaryDeathBossMult);
      damage(enemy, bossDmg, 'death', enemy.armor);
      if (enemy.hp > 0 && secondaryDeathBossShred > 0) {
        applyEarthArmorShred(enemy, secondaryDeathBossShred);
      }
      summary.sequence.push(`คำพิพากษาใส่บอส · ${bossDmg} ดาเมจแท้ทะลุเกราะและม่าน!`);
    } else {
      damage(enemy, enemy.hp, 'death', enemy.armor);
      if (secondaryDeathKillDraw > 0) {
        drawCards(state, secondaryDeathKillDraw);
        summary.sequence.push(`ปลิดชีพสำเร็จ · จั่วเพิ่ม +${secondaryDeathKillDraw} ใบ`);
      }
      summary.sequence.push('คำสั่งตายสำเร็จ · ใช้ไปแล้วในศึกนี้');
    }
    if (enemy.hp <= 0) {
      if (gear.deathKillFullManaRefund) {
        const fullRefund = Math.min(getMaxMana(player) - player.mana, 10);
        if (fullRefund > 0) {
          player.mana += fullRefund;
          summary.manaRefunded = (summary.manaRefunded ?? 0) + fullRefund;
          summary.manaAfterCast = player.mana;
          events.push({ type: 'mana-refund', amount: fullRefund });
          summary.sequence.push(`เคียวพิพากษาสังหารคืน +${fullRefund} MP!`);
        }
      }
      if (gear.deathKillKeepCard || gear.deathKillResetSpent) {
        delete state.deathSpent;
        if (gear.deathKillKeepCard && player.hand.length < getHandLimit(player)) {
          player.hand.push('death');
        }
        summary.sequence.push('† พิพากษาต่อเนื่อง · คืนการ์ดคำสั่งตายพร้อมร่ายซ้ำ!');
      }
    }
    if (secondaryShieldBonus > 0) {
      events.push({ type: 'shield', amount: secondaryShieldBonus, secondary: true, shieldKind: 'bonus', protection: protection() });
    }
    if (secondaryHealBonus > 0) {
      heal(secondaryHealBonus, false, 'bonus');
    }
    const refund = Math.min(getMaxMana(player) - player.mana, upgrades.death ?? 0);
    if (refund > 0) {
      player.mana += refund;
      summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
      summary.manaAfterCast = player.mana;
      events.push({ type: 'mana-refund', amount: refund });
    }
  } else if (spell.form === 'blackhole') {
    const slot = slotTarget ?? target.slot;
    const mult = spell.multiplier ?? 1;
    const bhLv = upgrades.blackhole ?? 0;
    const bhPower = Math.round(300 * mult) + bhLv * 15 + gear.blackholePowerBonus;
    const slamDamage = Math.round(100 * mult) + bhLv * 5 + gear.blackholeSlamBonus;
    state.blackhole = {
      slot,
      power: bhPower,
      ...(spell.grand ? { grand: true } : {}),
      ...(spell.large ? { large: true } : {}),
    };
    events.push({ type: 'blackhole-open', slot, element: 'blackhole', grand: Boolean(spell.grand), large: Boolean(spell.large) });
    const pulledTargets = live()
      .filter(enemy => enemy.slot !== slot)
      .sort((a, b) => Math.abs(a.slot - slot) - Math.abs(b.slot - slot) || a.slot - b.slot);
    if (pulledTargets.length > 0 && gear.blackholeManaPerPulled > 0) {
      const pullMp = Math.min(getMaxMana(player) - player.mana, pulledTargets.length * gear.blackholeManaPerPulled);
      if (pullMp > 0) {
        player.mana += pullMp;
        summary.manaRefunded = (summary.manaRefunded ?? 0) + pullMp;
        summary.manaAfterCast = player.mana;
        events.push({ type: 'mana-refund', amount: pullMp });
        summary.sequence.push(`ลูกแก้วหลุมดำดูดศัตรูคืน +${pullMp} MP`);
      }
    }
    for (const enemy of pulledTargets) {
      if (enemy.hp <= 0) continue;
      if (secondaryBlackholePullChill > 0) enemy.chill += secondaryBlackholePullChill;
      if (secondaryBlackholePullShred > 0) applyEarthArmorShred(enemy, secondaryBlackholePullShred);
      const dir = Math.sign(slot - enemy.slot);
      while (enemy.hp > 0 && enemy.slot !== slot) {
        const nextSlot = enemy.slot + dir;
        const blocker = live().find(other => other.slot === nextSlot);
        if (blocker) {
          events.push({ type: 'wall-slam', target: enemy.id, amount: slamDamage });
          damage(enemy, slamDamage, 'blackhole', enemy.armor, 'blackhole');
          if (blocker.hp > 0) {
            events.push({ type: 'wall-slam', target: blocker.id, amount: slamDamage });
            damage(blocker, slamDamage, 'blackhole', blocker.armor, 'blackhole');
          }
          summary.sequence.push(`หลุมดำดูดชนกัน · กระแทกทะลุเกราะ ${slamDamage} ดาเมจ`);
          break;
        }
        enemy.slot = nextSlot;
        events.push({ type: 'push', target: enemy.id, slot: nextSlot, pulled: true });
      }
    }
    if (secondaryShieldBonus > 0) {
      events.push({ type: 'shield', amount: secondaryShieldBonus, secondary: true, shieldKind: 'bonus', protection: protection() });
    }
    summary.sequence.push(`หลุมดำช่อง ${slot + 1} · ยุบหลังแอ็กชันของคุณเทิร์นหน้า (${bhPower} / ${Math.round(bhPower / 2)} ทะลุเกราะและม่าน)`);
  } else if (spell.form === 'meteor') {
    const mult = spell.multiplier ?? 1;
    const meteorLv = upgrades.meteor ?? 0;
    const dropCount = (3 + secondaryMeteorExtraDrops) * (spell.shots ?? 1);
    let lastImpact = null;
    for (let drop = 0; drop < dropCount; drop++) {
      if (player.hp <= 0) break;
      const candidates = live();
      if (!candidates.length) break;
      const center = candidates[Math.floor(random(state) * candidates.length)];
      lastImpact = center;
      const targets = live().filter(enemy => Math.abs(enemy.slot - center.slot) <= 1);
      blast(center.id, targets, 'meteor', enemy => {
        const rawDmg = enemy === center
          ? Math.round(24 * mult) + meteorLv * 3
          : Math.round(12 * mult) + meteorLv * 2;
        damage(enemy, rawDmg, 'meteor', pierceUpgradeBonus, 'meteor');
        if (enemy.hp > 0) {
          if (secondaryMeteorBurnBonus > 0) {
            newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + secondaryMeteorBurnBonus);
            events.push({ type: 'status', status: 'burn', target: enemy.id });
          }
          if (secondaryMeteorArmorShred > 0) applyEarthArmorShred(enemy, secondaryMeteorArmorShred);
        }
      }, { originSlot: center.slot, grand: Boolean(spell.grand), large: Boolean(spell.large) });
      summary.sequence.push(`อุกกาบาตลูกที่ ${drop + 1} ช่อง ${center.slot + 1} · กระทบ ${targets.length} เป้า`);
    }
    if (spell.devastation && lastImpact && player.hp > 0) {
      const devRadius = 2 + gear.devastationRadiusBonus;
      const devTargets = live().filter(enemy => Math.abs(enemy.slot - lastImpact.slot) <= devRadius);
      const totalDevShred = secondaryDevastationArmorShred + gear.devastationArmorShred;
      if (devTargets.length) {
        blast(lastImpact.id, devTargets, 'meteor', enemy => {
          const devRatio = Math.max(secondaryDevastationBlastPct || 50, gear.devastationRatioPct) / 50;
          damage(enemy, Math.round(14 * mult * devRatio) + devastationUpgradeBonus, 'meteor', pierceUpgradeBonus, 'meteor');
          if (totalDevShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, totalDevShred);
        }, { originSlot: lastImpact.slot, devastation: true, grand: Boolean(spell.grand) });
        summary.sequence.push(`${WORDS.devastation.label} · ${devTargets.length} เป้าหมาย`);
      }
    }
  } else if (spell.form === 'detonate') {
    const detonated = fireShieldLayers(player.shield, spell.element);
    player.shield = makeShield(shieldLayers(player.shield).filter((_, index) => !detonated.includes(index)));
    shieldBlast(detonated.length, spell.element);
  } else if (spell.form === 'shield') {
    if (spell.delayed) {
      events.push({ type: 'shield-delay' });
      summary.sequence.push('ตั้งหน่วงโล่ · กางต้นเทิร์นถัดไป');
    } else castShield(turn);
  } else if (spell.form === 'heal') {
    const rawHeal = spell.healing + healUpgradeBonus + secondaryHealBonus;
    const healScaleBonus = Math.min(100, getTowerSpellBonus(state.room));
    const riftHealBonus = inRift && rawHeal > 0 ? Math.ceil(rawHeal * healScaleBonus / 100) + Math.floor((player.maxHp ?? 36) * 0.04) : 0;
    const totalHealAmt = Math.round((rawHeal + riftHealBonus) * (100 + gear.healSpellPctBonus) / 100);
    heal(totalHealAmt);
    if (secondaryShieldBonus > 0) {
      events.push({ type: 'shield', amount: secondaryShieldBonus, secondary: true, shieldKind: 'bonus', protection: protection() });
      summary.sequence.push(`เกราะเสริมจากการ์ด +${secondaryShieldBonus}`);
    }
  } else if (spell.form === 'fill') {
    if (spell.resource === 'blood') {
      const fillBloodBonus = (upgrades.fill ?? 0) + (upgrades.blood ?? 0);
      const rawHeal = spell.healing + fillBloodBonus + healUpgradeBonus + secondaryHealBonus;
      const healScaleBonus = Math.min(100, getTowerSpellBonus(state.room));
      const riftHealBonus = inRift && rawHeal > 0 ? Math.ceil(rawHeal * healScaleBonus / 100) + Math.floor((player.maxHp ?? 36) * 0.04) : 0;
      const totalHealAmt = Math.round((rawHeal + riftHealBonus) * (100 + gear.healSpellPctBonus) / 100);
      heal(totalHealAmt);
      summary.sequence.push(`เติมเลือด${spell.large ? 'ใหญ่' : ''} · ฟื้นฟู +${summary.healed} HP`);
      if (secondaryShieldBonus > 0) {
        events.push({ type: 'shield', amount: secondaryShieldBonus, secondary: true, shieldKind: 'bonus', protection: protection() });
        summary.sequence.push(`เกราะเสริมจากการ์ด +${secondaryShieldBonus}`);
      }
      if (secondaryFillCrossMana > 0) {
        const crossMana = Math.min(getMaxMana(player) - player.mana, secondaryFillCrossMana);
        if (crossMana > 0) {
          player.mana += crossMana;
          summary.manaRefunded = (summary.manaRefunded ?? 0) + crossMana;
          summary.manaAfterCast = player.mana;
          events.push({ type: 'mana-refund', amount: crossMana });
          summary.sequence.push(`เติมพลังล้นคืน +${crossMana} มานา`);
        }
      }
    } else {
      const fillManaBonus = Math.floor((upgrades.fill ?? 0) / 2);
      const manaCardBonus = Math.ceil((upgrades.mana ?? 0) / 2);
      const largeManaBonus = rawIds.includes('large') ? Math.floor((upgrades.large ?? 0) / 2) : 0;
      const totalManaGain = spell.manaGain + fillManaBonus + manaCardBonus + largeManaBonus;
      const maxMana = getMaxMana(player);
      const gained = Math.max(0, Math.min(maxMana - player.mana, totalManaGain));
      const overflow = Math.max(0, totalManaGain - gained);
      player.mana += gained;
      summary.manaRestored = gained;
      summary.manaAfterCast = player.mana;
      events.push({ type: 'mana-refund', amount: gained, restored: true });
      summary.sequence.push(`เติมมานา${spell.large ? 'ใหญ่' : ''} · ฟื้น +${gained} มานา${manaFreeCast ? ' (ร่ายฟรี)' : ''}`);
      if (overflow > 0 && secondaryManaOverflowShieldMult > 0) {
        const overflowShield = overflow * secondaryManaOverflowShieldMult;
        block += overflowShield;
        events.push({ type: 'shield', amount: overflowShield, secondary: true, shieldKind: 'bonus', protection: protection() });
        summary.sequence.push(`มานาล้นแปลงเป็นเกราะ +${overflowShield}`);
      }
      if (secondaryShieldBonus > 0) {
        events.push({ type: 'shield', amount: secondaryShieldBonus, secondary: true, shieldKind: 'bonus', protection: protection() });
        summary.sequence.push(`เกราะเสริมจากการ์ด +${secondaryShieldBonus}`);
      }
      if (secondaryFillCrossHeal > 0) {
        heal(secondaryFillCrossHeal, false, 'bonus');
        summary.sequence.push(`เติมพลังล้นฟื้นฟู +${secondaryFillCrossHeal} HP`);
      }
      if (secondaryManaBonusDraw > 0) {
        drawCards(state, secondaryManaBonusDraw);
        summary.sequence.push(`ตาน้ำมานาจั่วเพิ่ม +${secondaryManaBonusDraw} ใบ`);
      }
    }
  } else if (spell.form === 'empower' || spell.form === 'bless') {
    const lvBonus = spell.form === 'bless' ? (upgrades.bless ?? 0) * 4 : (upgrades.empower ?? 0) * 3;
    const finalPct = spell.buffPct + lvBonus;
    const totalTurns = spell.buffTurns + secondaryBuffExtraTurns;
    const finalPierce = (spell.buffPierce ?? 0) + secondaryBuffExtraPierce;
    const families = [...new Set(spell.elements.flatMap(id => getElementComponents(id)))];
    for (const family of families) {
      const existing = player.elementBuffs[family];
      const activeExisting = existing && existing.expires >= turn ? existing : null;
      player.elementBuffs[family] = {
        pct: Math.max(activeExisting?.pct ?? 0, finalPct),
        expires: Math.max(activeExisting?.expires ?? 0, turn + totalTurns),
        source: activeExisting?.source === 'bless' || spell.form === 'bless' ? 'bless' : 'empower',
        pierceBonus: Math.max(activeExisting?.pierceBonus ?? 0, finalPierce),
      };
    }
    summary.buffApplied = { families, pct: finalPct, turns: totalTurns, pierce: finalPierce, source: spell.form };
    events.push({
      type: 'buff',
      source: spell.form,
      families,
      element: spell.elements[0] ?? families[0] ?? 'fire',
      pct: finalPct,
      turns: totalTurns,
      pierce: finalPierce,
      grand: Boolean(spell.grand),
      large: Boolean(spell.large),
    });
    const famText = families.map(f => ELEMENT_LABELS[f] ?? WORDS[f]?.label ?? f).join('+');
    summary.sequence.push(`${WORDS[spell.form].label}${famText} · พลังธาตุ +${finalPct}%${finalPierce ? ` เจาะเกราะ +${finalPierce}` : ''} (${totalTurns} เทิร์น)`);
    if (secondaryShieldBonus > 0) {
      events.push({ type: 'shield', amount: secondaryShieldBonus, secondary: true, shieldKind: 'bonus', protection: protection() });
      summary.sequence.push(`เกราะเสริมจากการ์ด +${secondaryShieldBonus}`);
    }
    if (secondaryHealBonus > 0) {
      heal(secondaryHealBonus, false, 'bonus');
    }
  } else {
    const lateGrand = spell.grand && ['beam', 'wave', 'storm'].includes(spell.form);
    const warded = spell.devastation || spell.stormBlast || spell.waveBlast || lateGrand
      ? new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) : null;
    let ignition;
    let secondGrandTrigger = null;
    function strikeForBlast(enemy, elements = spell.elements, sweep, scale = 1) {
      const slot = enemy.slot;
      const strike = impact(enemy, elements, sweep, scale);
      if (!strike || !warded) return undefined;
      const trigger = { ...strike, center: enemy, slot, elements };
      if (!ignition || spell.form === 'wave' && enemy.id === targetId) ignition = trigger;
      return trigger;
    }
    if (spell.form === 'blast' && spell.blastShot) {
      const radius = spell.grand ? 2 : 1;
      const elements = spell.elements;
      const element = elements[0] ?? 'blast';
      const { strength, pierce } = attackPower(elements);
      const name = [spell.grand ? 'มหาระเบิดลูก' : 'ระเบิดลูก', elements.map(id => WORDS[id].label).join('+')].filter(Boolean).join(' ');
      const strikeTargets = spell.shots === 2 ? [targetId, secondTargetId] : Array(spell.shots ?? 1).fill(targetId);
      for (const [round, strikeId] of strikeTargets.entries()) {
        if (player.hp <= 0) break;
        const intended = enemyById(strikeId);
        const center = intended && intended.hp > 0
          ? intended
          : live().sort((a, b) => a.hp - b.hp || Math.abs(a.slot - (intended?.slot ?? 0)) - Math.abs(b.slot - (intended?.slot ?? 0)) || a.slot - b.slot)[0];
        if (!center) break;
        const slot = center.slot;
        if (spell.dispel && center.ward > 0) {
          const amount = center.ward;
          summary.wards += amount;
          center.ward = 0;
          events.push({ type: 'dispel', target: center.id, amount });
          summary.sequence.push(`สลายม่านช่อง ${slot + 1} ${amount} ชั้น`);
        }
        applyGearWariWardStrip(center, elements);
        const nearby = live().filter(enemy => Math.abs(enemy.slot - slot) <= radius);
        const targets = nearby.filter(enemy => enemy.ward === 0);
        const wardedTargets = nearby.filter(enemy => enemy.ward > 0).map(enemy => enemy.id);
        const pairScale = round === 1 && rawIds.includes('pair') && gear.pairSecondHitPct > 0 ? (100 + gear.pairSecondHitPct) / 100 : 1;
        const powerAt = enemy => (strength + blastUpgradeBonus) * pairScale * (enemy.slot === slot ? 1 : blastSplashFactor) + (enemy.slot !== slot ? gear.blastSplashBonus : 0);
        const hits = targets.map(enemy => ({ enemy, slot: enemy.slot, power: powerAt(enemy) }));
        blast(center.id, targets, element, enemy => {
          const hadBurn = enemy.burn > 0 || (newBurn.get(enemy.id) ?? 0) > 0;
          hit(enemy, powerAt(enemy), pierce, elements);
          if (hadBurn && gear.blastBurnDetonate > 0 && !gearBlastDetonated.has(enemy.id) && enemy.hp > 0) {
            gearBlastDetonated.add(enemy.id);
            damage(enemy, gear.blastBurnDetonate, 'fire', enemy.armor);
            summary.sequence.push(`เพลิงปะทุเป้าติดเผา +${gear.blastBurnDetonate} ดาเมจแท้`);
          }
          if (secondaryBlastArmorShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, secondaryBlastArmorShred);
        }, { originSlot: slot, radius, elements, scale: 1, grand: Boolean(spell.grand), large: Boolean(spell.large), wardedTargets });
        const sweep = { chained: false, warded: new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) };
        for (const h of hits) {
          elementAfterHit(h.enemy, elements, h.power, pierce, sweep, h.slot);
          reactToAttack(h.enemy, elements);
        }
        const wave = strikeTargets.length > 1 ? ` ระลอก ${round + 1}` : '';
        const blocked = wardedTargets.length ? ` · ติดม่าน ${wardedTargets.length} เป้า` : '';
        summary.sequence.push(`${name}${wave} · ${targets.length} เป้า${blocked}`);
        if (center.hp > 0 && player.hp > 0) {
          impact(center, elements, sweep, 0.6);
        }
        if (spell.devastation && round === 0 && targets.length && !ignition) {
          ignition = { center: targets.includes(center) ? center : targets[0], slot, strength, pierce, elements };
        }
      }
    } else if (spell.form === 'blast') {
      const initialCenter = enemyById(targetId);
      const radius = spell.grand ? 2 : 1;
      const elements = spell.elements;
      const element = elements[0] ?? 'blast';
      const { strength, pierce } = attackPower(elements);
      const name = [spell.grand ? 'มหาระเบิด' : 'ระเบิด', elements.map(id => WORDS[id].label).join('+')].filter(Boolean).join(' ');
      const scales = spell.barrage ? Array(5).fill(1) : !spell.blastPair ? [1] : [1, spell.grand ? 0.6 : 1];
      for (const [round, scale] of scales.entries()) {
        if (player.hp <= 0) break;
        const center = spell.barrage
          ? (initialCenter && initialCenter.hp > 0
            ? initialCenter
            : live().sort((a, b) => a.hp - b.hp || Math.abs(a.slot - (initialCenter?.slot ?? 0)) - Math.abs(b.slot - (initialCenter?.slot ?? 0)) || a.slot - b.slot)[0])
          : initialCenter;
        if (!center) break;
        const slot = center.slot;
        applyGearWariWardStrip(center, elements);
        const nearby = live().filter(enemy => Math.abs(enemy.slot - slot) <= radius);
        const targets = nearby.filter(enemy => enemy.ward === 0);
        const wardedTargets = nearby.filter(enemy => enemy.ward > 0).map(enemy => enemy.id);
        const pairScale = round === 1 && spell.blastPair && gear.pairSecondHitPct > 0 ? (100 + gear.pairSecondHitPct) / 100 : 1;
        const rampScale = spell.barrage && gear.barrageRampPctPerHit > 0 ? (100 + round * gear.barrageRampPctPerHit) / 100 : 1;
        const powerAt = enemy => (strength + blastUpgradeBonus) * scale * pairScale * rampScale * (enemy.slot === slot ? 1 : blastSplashFactor) + (enemy.slot !== slot ? gear.blastSplashBonus : 0);
        const hits = targets.map(enemy => ({ enemy, slot: enemy.slot, power: powerAt(enemy) }));
        blast(center.id, targets, element, enemy => {
          const hadBurn = enemy.burn > 0 || (newBurn.get(enemy.id) ?? 0) > 0;
          hit(enemy, powerAt(enemy), pierce, elements);
          if (hadBurn && gear.blastBurnDetonate > 0 && !gearBlastDetonated.has(enemy.id) && enemy.hp > 0) {
            gearBlastDetonated.add(enemy.id);
            damage(enemy, gear.blastBurnDetonate, 'fire', enemy.armor);
            summary.sequence.push(`เพลิงปะทุเป้าติดเผา +${gear.blastBurnDetonate} ดาเมจแท้`);
          }
          if (secondaryBlastArmorShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, secondaryBlastArmorShred);
        }, { originSlot: slot, radius, elements, scale, grand: Boolean(spell.grand), large: Boolean(spell.large), wardedTargets });
        const sweep = { chained: false, warded: new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) };
        for (const hit of hits) {
          elementAfterHit(hit.enemy, elements, hit.power, pierce, sweep, hit.slot);
          reactToAttack(hit.enemy, elements);
        }
        if (spell.devastation && round === 0 && targets.length && !ignition) {
          ignition = { center: targets.includes(center) ? center : targets[0], slot, strength, pierce, elements };
        }
        const wave = scales.length > 1 ? ` ระลอก ${round + 1}` : '';
        const blocked = wardedTargets.length ? ` · ติดม่าน ${wardedTargets.length} เป้า` : '';
        summary.sequence.push(`${name}${wave} · ${targets.length} เป้า${blocked}`);
      }
    } else if (spell.form === 'wave') {
      const sweeps = spell.barrage ? Array(5).fill(spell.elements) : [spell.elements];
      if (!spell.barrage) {
        if (spell.secondElement) sweeps.push([spell.secondElement]);
        else if (spell.wavePair) sweeps.push(spell.elements);
      }
      for (const [round, elements] of sweeps.entries()) {
        if (player.hp <= 0 || !live().length) break;
        const secondWarded = round === 1 && lateGrand && spell.wavePair ? new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) : null;
        const sweep = { chained: false };
        const roundBaseScale = (spell.barrage && secondaryBarrageFinaleDouble && round === sweeps.length - 1) ? 1.2 : 0.6;
        const pairWaveMult = round === 1 && spell.wavePair && gear.pairSecondHitPct > 0 ? (100 + gear.pairSecondHitPct) / 100 : 1;
        const rampWaveMult = spell.barrage && gear.barrageRampPctPerHit > 0 ? (100 + round * gear.barrageRampPctPerHit) / 100 : 1;
        const roundScale = roundBaseScale * pairWaveMult * rampWaveMult;
        for (const enemy of live()) {
          const trigger = strikeForBlast(enemy, elements, sweep, roundScale);
          if (secondWarded && trigger && (!secondGrandTrigger || enemy.id === targetId)) {
            secondGrandTrigger = { trigger, warded: secondWarded };
          }
        }
      }
    } else if (spell.form === 'storm') {
      const initialCenter = enemyById(targetId);
      const stormRounds = spell.barrage ? 5 : 1;
      const stormSideScale = secondaryStormSidePct > 0 ? secondaryStormSidePct / 150 : 0.5;
      const stormHitSet = new Set();
      let first = null;
      for (let round = 0; round < stormRounds; round++) {
        if (player.hp <= 0) break;
        const center = round === 0
          ? initialCenter
          : (initialCenter && initialCenter.hp > 0
            ? initialCenter
            : live().sort((a, b) => a.hp - b.hp || Math.abs(a.slot - (initialCenter?.slot ?? 0)) - Math.abs(b.slot - (initialCenter?.slot ?? 0)) || a.slot - b.slot)[0]);
        if (!center) break;
        const rampStormMult = spell.barrage && gear.barrageRampPctPerHit > 0 ? (100 + round * gear.barrageRampPctPerHit) / 100 : 1;
        const finaleMult = ((spell.barrage && secondaryBarrageFinaleDouble && round === stormRounds - 1) ? 2 : 1) * rampStormMult;
        const neighbors = live().filter(enemy => Math.abs(enemy.slot - center.slot) === 1);
        const sweep = { chained: false, warded: new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) };
        const roundTrigger = strikeForBlast(center, spell.elements, sweep, finaleMult);
        if (roundTrigger) stormHitSet.add(center.id);
        if (round === 0) first = roundTrigger;
        for (const enemy of neighbors) {
          if (impact(enemy, spell.elements, sweep, stormSideScale * finaleMult)) stormHitSet.add(enemy.id);
        }
      }
      if (spell.stormPair) {
        const center = initialCenter;
        const neighbors = live().filter(enemy => Math.abs(enemy.slot - center.slot) === 1);
        const secondWarded = lateGrand ? new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) : null;
        const secondSweep = { chained: false, warded: new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) };
        const pairStormMult = gear.pairSecondHitPct > 0 ? (100 + gear.pairSecondHitPct) / 100 : 1;
        const secondCenter = impact(center, spell.elements, secondSweep, 0.6 * pairStormMult);
        if (secondCenter) stormHitSet.add(center.id);
        if (secondCenter && lateGrand) {
          secondGrandTrigger = {
            trigger: { ...secondCenter, center, slot: center.slot, elements: spell.elements },
            warded: secondWarded,
          };
        }
        for (const enemy of neighbors) {
          if (impact(enemy, spell.elements, secondSweep, stormSideScale * 0.6 * pairStormMult)) stormHitSet.add(enemy.id);
        }
      }
      if (secondaryStormMultiManaRefund > 0 && stormHitSet.size >= 2 && !stormMultiManaRefunded) {
        stormMultiManaRefunded = true;
        const refund = Math.min(getMaxMana(player) - player.mana, secondaryStormMultiManaRefund);
        if (refund > 0) {
          player.mana += refund;
          summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
          summary.manaAfterCast = player.mana;
          events.push({ type: 'mana-refund', amount: refund });
          summary.sequence.push(`ตาพายุโดนหลายเป้าคืน +${refund} มานา`);
        }
      }
      if (spell.stormBlast && first) {
        if (spell.devastation) expandedBlast({ ...first, strength: first.strength / 2 }, warded, 'blast');
        else expandedBlast(first, warded, 'blast');
      }
    } else if (spell.form === 'spear') {
      const spearBackFactor = Math.max(secondarySpearBackPct || 50, gear.spearBackRatioPct || 0) / 100;
      const totalShots = spell.shots ?? 1;
      for (let shotIndex = 0; shotIndex < totalShots; shotIndex++) {
        if (player.hp <= 0) break;
        const intended = enemyById(shotIndex === 0 ? targetId : (shotIndex === 1 && totalShots === 2 ? secondTargetId : targetId));
        const currentTarget = intended && intended.hp > 0
          ? intended
          : live().sort((a, b) => a.hp - b.hp || Math.abs(a.slot - (intended?.slot ?? 0)) - Math.abs(b.slot - (intended?.slot ?? 0)) || a.slot - b.slot)[0];
        if (!currentTarget) break;
        const shotElements = shotIndex === 1 && spell.secondElement ? [spell.secondElement] : spell.elements;
        const pairMult = shotIndex === 1 && totalShots === 2 && rawIds.includes('pair') && gear.pairSecondHitPct > 0
          ? (100 + gear.pairSecondHitPct) / 100
          : 1;
        const rampMult = spell.barrage && gear.barrageRampPctPerHit > 0 ? (100 + shotIndex * gear.barrageRampPctPerHit) / 100 : 1;
        const finaleScale = ((spell.barrage && secondaryBarrageFinaleDouble && shotIndex === totalShots - 1) ? 2 : 1) * pairMult * rampMult;
        const primarySlot = currentTarget.slot;
        const behind = live().find(enemy => enemy.slot === primarySlot + 1);
        const frontStrike = impact(currentTarget, shotElements, undefined, 0.8 * finaleScale);
        if (frontStrike && warded && !ignition) {
          ignition = { ...frontStrike, center: currentTarget, slot: primarySlot, elements: shotElements };
        }
        if (behind && behind.hp > 0 && player.hp > 0) {
          const backStrike = impact(behind, shotElements, undefined, spearBackFactor * finaleScale);
          if (frontStrike && backStrike && secondarySpearDoubleManaRefund > 0 && !spearDoubleManaRefunded) {
            spearDoubleManaRefunded = true;
            const refund = Math.min(getMaxMana(player) - player.mana, secondarySpearDoubleManaRefund);
            if (refund > 0) {
              player.mana += refund;
              summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
              summary.manaAfterCast = player.mana;
              events.push({ type: 'mana-refund', amount: refund });
              summary.sequence.push(`หอกเสียบทะลุ 2 เป้าคืน +${refund} มานา`);
            }
          }
        }
      }
    } else {
      const first = enemyById(targetId);
      strikeForBlast(first);
      const totalShots = spell.shots ?? 1;
      for (let shotIndex = 1; shotIndex < totalShots; shotIndex++) {
        if (player.hp <= 0) break;
        const secondWarded = shotIndex === 1 && totalShots === 2 && lateGrand
          ? new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id))
          : null;
        const intended = enemyById(shotIndex === 1 && totalShots === 2 ? secondTargetId : targetId);
        const replacement = intended && intended.hp > 0
          ? intended
          : live().sort((a, b) => a.hp - b.hp || Math.abs(a.slot - (intended?.slot ?? 0)) - Math.abs(b.slot - (intended?.slot ?? 0)) || a.slot - b.slot)[0];
        if (!replacement) break;
        const shotElements = shotIndex === 1 && spell.secondElement ? [spell.secondElement] : spell.elements;
        const pairMult = shotIndex === 1 && totalShots === 2 && rawIds.includes('pair') && gear.pairSecondHitPct > 0
          ? (100 + gear.pairSecondHitPct) / 100
          : 1;
        const rampMult = spell.barrage && gear.barrageRampPctPerHit > 0 ? (100 + shotIndex * gear.barrageRampPctPerHit) / 100 : 1;
        const finaleScale = ((spell.barrage && secondaryBarrageFinaleDouble && shotIndex === totalShots - 1) ? 2 : 1) * pairMult * rampMult;
        const nextTrigger = strikeForBlast(replacement, shotElements, undefined, finaleScale);
        if (secondWarded && nextTrigger) secondGrandTrigger = { trigger: nextTrigger, warded: secondWarded };
      }
    }
    if (spell.waveBlast) expandedBlast(ignition, warded, 'wave');
    if (lateGrand) expandedBlast(ignition, warded, 'grand');
    if (secondGrandTrigger) expandedBlast(secondGrandTrigger.trigger, secondGrandTrigger.warded, 'grand');
    if (spell.devastation) expandedBlast(ignition, warded, 'devastation');
    if (secondaryShieldBonus > 0) {
      events.push({ type: 'shield', amount: secondaryShieldBonus, secondary: true, shieldKind: 'bonus', protection: protection() });
      summary.sequence.push(`เกราะเสริมจากการ์ด +${secondaryShieldBonus}`);
    }
    if (secondaryHealBonus > 0) {
      heal(secondaryHealBonus, false, 'bonus');
    }
  }

  spellVfxFlags = {};

  if (!guard && !fizzled && spell?.barrage && gear.barrageDrawCards > 0) {
    const canDraw = Math.max(0, getHandLimit(player) - player.hand.length);
    const drawAmt = Math.min(canDraw, gear.barrageDrawCards);
    if (drawAmt > 0) {
      drawCards(state, drawAmt);
      summary.sequence.push(`แหวนกระหน่ำโอเวอร์คล็อกจั่วเพิ่ม +${drawAmt} ใบ`);
    }
  }
  if (!guard && !fizzled && spell && gear.dualFusionManaRefund > 0 && !gearDualFusionManaRefunded) {
    const castElems = [...(spell.elements ?? []), ...(spell.secondElement ? [spell.secondElement] : []), ...(spell.element ? [spell.element] : [])];
    if (castElems.length > 1 || castElems.some(id => Boolean(FUSED_ELEMENTS[id]))) {
      gearDualFusionManaRefunded = true;
      const refund = Math.min(getMaxMana(player) - player.mana, gear.dualFusionManaRefund);
      if (refund > 0) {
        player.mana += refund;
        summary.manaRefunded = (summary.manaRefunded ?? 0) + refund;
        summary.manaAfterCast = player.mana;
        events.push({ type: 'mana-refund', amount: refund });
        summary.sequence.push(`ไม้เท้าเตาหลอมสองธาตุคืน +${refund} มานา`);
      }
    }
  }
  if (!guard && !fizzled && secondaryManaRefund > 0) {
    const manaRefund = Math.min(getMaxMana(player) - player.mana, secondaryManaRefund);
    if (manaRefund > 0) {
      player.mana += manaRefund;
      summary.manaRefunded = (summary.manaRefunded ?? 0) + manaRefund;
      summary.manaAfterCast = player.mana;
      events.push({ type: 'mana-refund', amount: manaRefund });
      summary.sequence.push(`เอฟเฟกต์รองการ์ดคืน +${manaRefund} มานา`);
    }
  }
  if (!guard && !fizzled && hasStormPendulum && rawIds.includes('pair')) {
    const manaRefund = Math.min(getMaxMana(player) - player.mana, 1);
    if (manaRefund > 0) {
      player.mana += manaRefund;
      summary.manaRefunded = (summary.manaRefunded ?? 0) + manaRefund;
      summary.manaAfterCast = player.mana;
      events.push({ type: 'mana-refund', amount: manaRefund, relicId: 'storm_pendulum_20' });
      summary.sequence.push(`ลูกตุ้มสายฟ้าคืน +${manaRefund} มานา`);
    }
  }
  if (!guard && !fizzled && gear.pairDrawBonus > 0 && rawIds.includes('pair')) {
    const canDraw = Math.max(0, getHandLimit(player) - player.hand.length);
    const drawAmt = Math.min(canDraw, gear.pairDrawBonus);
    if (drawAmt > 0) {
      drawCards(state, drawAmt);
      summary.sequence.push(`แหวนเสียงสะท้อนคู่จั่วเพิ่ม +${drawAmt} ใบ`);
    }
  }
  if (!guard && !fizzled && hasCrown && rawIds.length === 4) {
    const manaRefund = Math.min(getMaxMana(player) - player.mana, 2);
    if (manaRefund > 0) {
      player.mana += manaRefund;
      summary.manaRefunded = (summary.manaRefunded ?? 0) + manaRefund;
      summary.manaAfterCast = player.mana;
      events.push({ type: 'mana-refund', amount: manaRefund, relicId: 'forbidden_crown_30' });
      summary.sequence.push(`มงกุฎอักษรคืน +${manaRefund} มานา`);
    }
  }

  if (pendingBlackhole) {
    const { slot, power } = pendingBlackhole;
    const bhLv = upgrades.blackhole ?? 0;
    const bhSec = hasCardSecondaryUpgrade(state, 'blackhole') ? getCardSecondaryEffect('blackhole', Math.max(7, bhLv)) : null;
    const collapsePct = bhSec?.blackholeCollapsePct ?? 0;
    const centerPower = collapsePct > 0 ? Math.round(power * (100 + collapsePct) / 100) : power;
    const sidePower = collapsePct > 0 ? Math.round(centerPower * 0.75) : Math.round(centerPower / 2);
    const targets = live().filter(enemy => Math.abs(enemy.slot - slot) <= 2);
    blast('blackhole', targets, 'blackhole', enemy => {
      damage(enemy, enemy.slot === slot ? centerPower : sidePower, 'blackhole', enemy.armor, 'blackhole');
    }, { originSlot: slot, grand: Boolean(pendingBlackhole.grand), large: Boolean(pendingBlackhole.large) });
    summary.sequence.push(`หลุมดำช่อง ${slot + 1} ยุบ · กระทบ ${targets.length} เป้า`);
  }
  const magmaLv = upgrades.magma ?? 0;
  const magmaSec = hasCardSecondaryUpgrade(state, 'magma') ? getCardSecondaryEffect('magma', Math.max(7, magmaLv)) : null;
  const magmaEruptDmg = 6 + magmaLv * 2 + gear.magmaPuddleBonusDmg;
  const magmaEruptShred = 2 + (magmaSec?.magmaShredExtra ?? 0) + gear.magmaPuddleShred;
  for (const slot of magmaPuddles) {
    const target = live().find(enemy => enemy.slot === slot);
    events.push({ type: 'magma-erupt', slot, target: target?.id, element: 'magma' });
    if (target) {
      damage(target, magmaEruptDmg, 'magma', target.armor);
      if (target.hp > 0) {
        applyEarthArmorShred(target, magmaEruptShred);
        if (magmaSec?.magmaZeroArmorDmg > 0 && target.armor === 0) {
          damage(target, magmaSec.magmaZeroArmorDmg, 'magma', target.armor);
          summary.sequence.push(`แมกม่าปะทุซ้ำเป้าไร้เกราะ +${magmaSec.magmaZeroArmorDmg} ดาเมจแท้`);
        }
      }
    }
    if (magmaSec?.magmaSplashHalf) {
      const splashDmg = Math.round(magmaEruptDmg / 2);
      for (const adj of live()) {
        if (Math.abs(adj.slot - slot) === 1) {
          damage(adj, splashDmg, 'magma', adj.armor);
          summary.sequence.push(`แอ่งแมกม่าปะทุลามช่อง ${adj.slot + 1} (${splashDmg} แท้)`);
        }
      }
    }
  }
  delete state.magmaPuddles;
  for (const [id, form] of formsHit) enemyById(id).readForm = form;
  function checkNetherForgeExposed() {
    if (state.netherPhase === 2) return;
    if (!state.enemies.some(e => e.kind === 'nether_forge_pillar')) return;
    if (live().some(e => e.kind === 'nether_forge_pillar')) return;
    const overlord = live().find(e => e.kind === 'nether_forge_overlord');
    if (!overlord) return;
    state.netherPhase = 2;
    overlord.netherExposedTurn = turn + 1;
    summary.sequence.push('🔥 เสาเตาหลอมพังทลายหมดแล้ว! จอมอสูรเตาหลอมเปิดจุดอ่อนเทิร์นหน้า (+35% ดาเมจ)');
  }
  if (player.hp > 0) {
    checkNetherPhase2(state, summary, events);
    checkNetherForgeExposed();
    checkEternityPhase2(state, summary, events);
    checkArmoryGodPhase(state, summary, events);
  }

  if (player.summon?.hp > 0 && player.summon.turnCreated < turn) {
    const unit = player.summon;
    summonFollowup(unit, spell?.elements ?? [spell?.element]);
    events.push({ type: 'summon_depart', creature: unit.creatureId });
    clearSummon(state);
  }

  summary.enemyHp = Object.fromEntries(enemies.map(enemy => [enemy.id, enemy.hp]));
  summary.enemyStatus = Object.fromEntries(enemies.map(enemy => [enemy.id, {
    chill: enemy.chill, freeze: enemy.freeze, burn: enemy.burn + (newBurn.get(enemy.id) ?? 0),
    slot: enemy.slot, ward: enemy.ward, sealed: enemy.sealed,
    healCutUntil: enemy.healCutUntil, lastingChill: enemy.lastingChill,
    wetUntil: enemy.wetUntil, obscured: enemy.obscured, armor: enemy.armor,
    groundedUntil: enemy.groundedUntil, abyssalShockUntil: enemy.abyssalShockUntil,
    netherPurgeUntil: enemy.netherPurgeUntil, netherExposedTurn: enemy.netherExposedTurn,
    eternityShatterUntil: enemy.eternityShatterUntil,
  }]));
  const effectiveTimeStopped = timeStopped || (gear.chronosAutoSkipEvery4Turns && turn % 4 === 0);
  if (effectiveTimeStopped && !timeStopped && live().length) {
    summary.sequence.push('⏳ มงกุฎผู้ปกครองกาลเวลา (เทิร์นคู่ 4): ข้ามเทิร์นศัตรูทั้งสนามอัตโนมัติ!');
  }
  summary.enemyActions = effectiveTimeStopped
    ? Object.fromEntries(live().map(enemy => [enemy.id, { type: 'timestop', amount: 0, label: timeStopped ? 'หยุดเวลา' : 'เหนือกาลเวลา' }]))
    : {};
  for (const enemy of effectiveTimeStopped ? [] : live()) {
    if (!enemy.hp || !player.hp) continue;
    if (enemy.burn && enemy.burnTurn <= turn) {
      const tickBurn = enemy.burn;
      events.push({ type: 'status', status: 'burn', target: enemy.id });
      damage(enemy, tickBurn, 'fire', enemy.armor);
      if (enemy.hp > 0 && enemy.lingeringBurn) {
        const linger = Math.floor(tickBurn / 2);
        delete enemy.lingeringBurn;
        if (linger > 0) {
          enemy.burn = linger;
          enemy.burnTurn = turn + 1;
          summary.sequence.push(`ไฟค้างช่อง ${enemy.slot + 1} ยังเหลือเผา ${linger} เทิร์นถัดไป`);
        } else {
          enemy.burn = 0;
          enemy.burnTurn = 0;
        }
      } else {
        enemy.burn = 0;
        enemy.burnTurn = 0;
      }
      if (player.hp > 0) {
        checkNetherForgeExposed();
        checkEternityPhase2(state, summary, events);
        checkArmoryGodPhase(state, summary, events);
      }
    }
    const action = summonStuns.has(enemy.id)
      ? { type: 'summon-stunned', amount: 0, label: 'สตั๊น · ข้ามเทิร์น' }
      : intent(enemy, turn, enemies, state.room, Boolean(state.rift?.instability));
    summary.enemyActions[enemy.id] = action;
    if (action.type === 'attack') {
      enemy.chill = enemy.lastingChill ? 4 : 0;
      delete enemy.lastingChill;
      delete enemy.obscured;
      const attackerBase = ENEMIES[enemy.kind];
      const isBossAttacker = Boolean(attackerBase?.isBoss || isBossRoom(state));
      const isSpecialBoss = ['ember_overlord', 'tempest_archon', 'volcano_colossus', 'thunder_drake_emperor', 'abyssal_kraken', 'nether_dread_lord', 'eternity_overlord', 'eternity_reborn', 'ironforge_automaton', 'tempest_blade_seraph', 'abyssal_tide_colossus', 'magma_core_juggernaut', 'chitin_bastion_behemoth', 'storm_sovereign_drake', 'void_kraken_leviathan', 'nether_forge_overlord', 'eternity_armory_god'].includes(enemy.kind);
      const isUltimateSkill = Boolean(action.aoe);
      const isHeavyAttack = Boolean(
        action.amount >= 6 ||
        (isBossAttacker && (
          action.amount >= 5 ||
          ['sentinel', 'storm_titan', 'ember_overlord', 'astral_sentinel', 'thunder_colossus', 'tempest_archon', 'kraken_crush_tentacle', 'abyssal_kraken', 'nether_doom_pillar', 'nether_dread_lord', 'eternity_overlord', 'eternity_reborn', 'ironforge_automaton', 'tempest_blade_seraph', 'abyssal_tide_colossus', 'magma_core_juggernaut', 'chitin_bastion_behemoth', 'storm_sovereign_drake', 'void_rift_tentacle', 'void_kraken_leviathan', 'nether_forge_pillar', 'nether_forge_overlord', 'eternity_armory_god'].includes(enemy.kind) ||
          (['boss', 'arch_codex', 'elder_grimoire', 'nexus_codex'].includes(enemy.kind) && turn % 3 === 2) ||
          (['mirror_mage', 'eclipse_mage'].includes(enemy.kind) && turn % 3 !== 1)
        ))
      );
      const isAoE = Boolean(action.aoe);
      let incomingAttackAmt = action.amount;
      if (state.player.summon?.creatureId === 'kraken' && state.player.summon.hp > 0) {
        const krakenRedPct = isBossAttacker
          ? Math.max(gear.krakenEnemyDmgReductionPct, gear.krakenBossDmgReductionPct)
          : gear.krakenEnemyDmgReductionPct;
        if (krakenRedPct > 0) {
          incomingAttackAmt = Math.max(1, Math.round(incomingAttackAmt * (100 - krakenRedPct) / 100));
        }
      }
      const bossRedPct = Math.max(
        isBossAttacker ? gear.bossDamageReductionPct : 0,
        (isBossAttacker || isHeavyAttack || isUltimateSkill) ? gear.bossHeavyReductionPct : 0,
      );
      if (bossRedPct > 0) {
        incomingAttackAmt = Math.max(1, Math.round(incomingAttackAmt * (100 - bossRedPct) / 100));
      }

      function triggerSummonCounter(sUnit, targetEnemy) {
        if (!targetEnemy || targetEnemy.hp <= 0) return;
        const id = sUnit.creatureId;
        let counterDmg = sUnit.counter || 0;
        if (gear.summonAllDmgPct > 0) counterDmg = Math.ceil(counterDmg * (100 + gear.summonAllDmgPct) / 100);
        if (gear.summonCounterDmgPct > 0) counterDmg = Math.ceil(counterDmg * (100 + gear.summonCounterDmgPct) / 100);
        if (gear.summonWetBonusPct > 0 && targetEnemy.wetUntil >= turn) counterDmg = Math.ceil(counterDmg * (100 + gear.summonWetBonusPct) / 100);
        const effect = summonEffect(id);
        const cGear = gear.summonCreatureBonus[id] ?? {};
        const pierce = (sUnit.element === 'lightning' ? 2 : sUnit.element === 'asani' ? 4 : 0)
          + (id === 'boar' ? 4 : id === 'skeleton' ? 3 : 0)
          + (effect?.pierceBonus ?? 0)
          + (cGear.pierce ?? 0);
        const result = summonHit(targetEnemy, counterDmg, sUnit.element, pierce, id === 'eagle');
        let totalCounterDealt = result.amount || 0;
        events.push({ type: 'summon_counter', source: 'summon', target: targetEnemy.id, element: sUnit.element, ...result });
        summary.sequence.push(result.blocked ? `${sUnit.name} สวนกลับ · ม่านรับไว้` : `${sUnit.name} สวนกลับ ${result.amount} ดาเมจ`);
        if (id === 'sprite' || id === 'siren') {
          if (gear.spriteSirenCounterMana > 0) refundSummonMana(gear.spriteSirenCounterMana);
          if (gear.spriteSirenCounterDraw > 0) {
            const canDraw = Math.max(0, getHandLimit(player) - player.hand.length);
            const drawAmt = Math.min(canDraw, gear.spriteSirenCounterDraw);
            if (drawAmt > 0) drawCards(state, drawAmt);
          }
        }
        if (id === 'siren' && gear.sirenCounterWetAll) {
          for (const other of live()) other.wetUntil = Math.max(other.wetUntil ?? 0, turn + 2);
          summary.sequence.push('ไข่มุกไซเรนสาดเปียกศัตรูทั้งสนาม');
        }
        if (!result.blocked && targetEnemy.hp > 0) {
          if (id === 'snake' || id === 'hornet') {
            const venomRes = summonHit(targetEnemy, id === 'snake' ? 4 : 6, 'physical', targetEnemy.armor, true);
            totalCounterDealt += venomRes.amount || 0;
          }
          if (id === 'bat') heal(2 + (cGear.healBonus ?? 0) + gear.healBonus, false, 'summon-bat');
          if (id === 'frog' || id === 'siren') targetEnemy.wetUntil = Math.max(targetEnemy.wetUntil ?? 0, turn + 2);
          if (id === 'spider' || id === 'kraken') targetEnemy.chill += id === 'spider' ? 3 : 6;
          if (id === 'rat') applyEarthArmorShred(targetEnemy, 1);
          if (id === 'wolf') newBurn.set(targetEnemy.id, (newBurn.get(targetEnemy.id) ?? 0) + 4);
          if (id === 'bear') pushEnemy(targetEnemy, 1, { steps: 1 + (cGear.extraPush ?? 0) });
          if (id === 'behemoth') {
            const behemothShredAmt = Math.max(2, gear.behemothAoeShred);
            for (const other of live()) applyEarthArmorShred(other, behemothShredAmt);
          }
          if (id === 'hydra') {
            for (const other of live().filter(e => Math.abs(e.slot - targetEnemy.slot) === 1)) {
              const splashRes = summonHit(other, Math.ceil(counterDmg * 0.5), sUnit.element, pierce);
              totalCounterDealt += splashRes.amount || 0;
            }
            if (gear.hydraCounterExtraHits > 0 && targetEnemy.hp > 0) {
              const extraPoisonDmg = gear.hydraCounterPoisonDmg > 0 ? gear.hydraCounterPoisonDmg : 8;
              for (let hi = 0; hi < gear.hydraCounterExtraHits && targetEnemy.hp > 0; hi++) {
                const pRes = summonHit(targetEnemy, extraPoisonDmg, 'physical', targetEnemy.armor, true);
                totalCounterDealt += pRes.amount || 0;
              }
              summary.sequence.push(`🐍 ไฮดราสวนพิษเพิ่ม ${gear.hydraCounterExtraHits} ฮิต (${extraPoisonDmg} แท้/ฮิต)`);
            }
          }
          if (effect?.phoenixCleanseHeal) {
            heal(effect.phoenixCleanseHeal, false, 'summon-phoenix');
          }

        const elem = sUnit.element;
        if (elem === 'fire') {
          newBurn.set(targetEnemy.id, (newBurn.get(targetEnemy.id) ?? 0) + 3);
        } else if (elem === 'akki') {
          newBurn.set(targetEnemy.id, (newBurn.get(targetEnemy.id) ?? 0) + 5);
          targetEnemy.healCutUntil = turn + 2;
        } else if (elem === 'ice') {
          targetEnemy.chill += 4;
          if (targetEnemy.wetUntil >= turn) {
            targetEnemy.freeze = Math.max(targetEnemy.freeze || 0, 1);
            delete targetEnemy.wetUntil;
            summary.sequence.push(`❄️ ไอเย็นปะทะเป้าเปียก แช่แข็ง ${ENEMIES[targetEnemy.kind]?.name || targetEnemy.kind} 1 เทิร์น!`);
          }
        } else if (elem === 'heman') {
          targetEnemy.chill += 6;
          targetEnemy.lastingChill = true;
          if (targetEnemy.chill >= 6 || targetEnemy.wetUntil >= turn) {
            targetEnemy.freeze = Math.max(targetEnemy.freeze || 0, 1);
            summary.sequence.push(`❄️ มหาเหมันต์แช่แข็ง ${ENEMIES[targetEnemy.kind]?.name || targetEnemy.kind} 1 เทิร์น!`);
          }
        } else if (elem === 'lightning') {
          if (targetEnemy.wetUntil >= turn) {
            chainLightning(targetEnemy, counterDmg + 2, 2);
          }
        } else if (elem === 'asani') {
          chainLightning(targetEnemy, counterDmg, 2);
        } else if (elem === 'earth') {
          applyEarthArmorShred(targetEnemy, 1);
        } else if (elem === 'pathaphi') {
          applyEarthArmorShred(targetEnemy, 3);
          if (targetEnemy.armor <= 0) damage(targetEnemy, 8, 'true');
        } else if (elem === 'water') {
          targetEnemy.wetUntil = Math.max(targetEnemy.wetUntil ?? 0, turn + 2);
          heal(2, false, 'water');
        } else if (elem === 'wari') {
          targetEnemy.wetUntil = Math.max(targetEnemy.wetUntil ?? 0, turn + 3);
          heal(5, false, 'water');
          if (targetEnemy.ward > 0) targetEnemy.ward--;
        } else if (elem === 'wind') {
          pushEnemy(targetEnemy, 1, { sourceElement: 'wind' });
          } else if (elem === 'vayu') {
            pushEnemy(targetEnemy, 2, { sourceElement: 'vayu' });
          }
        }
        if (totalCounterDealt > 0) {
          if (gear.summonDmgLifestealPct > 0) {
            const vampHeal = Math.max(1, Math.floor(totalCounterDealt * gear.summonDmgLifestealPct / 100));
            heal(vampHeal, false, 'summon-lifesteal');
          }
          if (gear.summonAttackPlayerHeal > 0) {
            heal(gear.summonAttackPlayerHeal, false, 'summon-heal');
          }
        }
      }

      function triggerSummonOnBreak(sUnit, attackerEnemy) {
        const elem = sUnit.element;
        events.push({ type: 'summon_break', element: elem, creature: sUnit.creatureId });
        const id = sUnit.creatureId;
        const effect = summonEffect(id);
        const cGear = gear.summonCreatureBonus[id] ?? {};
        if (id === 'wolf' && attackerEnemy?.hp > 0) {
          attackerEnemy.chill += 4;
          attackerEnemy.lastingChill = true;
        }
        if (id === 'slime' && attackerEnemy?.hp > 0) attackerEnemy.chill += 4 + (cGear.chillBonus ?? 0);
        if (id === 'rat' && attackerEnemy?.hp > 0) attackerEnemy.healCutUntil = turn + 2;
        if (id === 'skeleton' && attackerEnemy?.hp > 0) summonHit(attackerEnemy, 14 + (cGear.explodeBonus ?? 0), 'physical', attackerEnemy.armor, true);
        if (id === 'sprite') {
          heal(12 + (cGear.breakHeal ?? 0) + gear.healBonus, false, 'summon-sprite');
          if (cGear.breakMana > 0) refundSummonMana(cGear.breakMana);
        }
        const golemBreakShieldAmt = (effect?.golemBreakShield ?? 0) + (id === 'golem' ? (cGear.breakShield ?? 0) : 0);
        if (golemBreakShieldAmt > 0) grantSummonShield(golemBreakShieldAmt, turn + 2);
        if (id === 'turtle') {
          const turtleBreakShield = 8 + (cGear.shieldBonus ?? 0);
          grantSummonShield(turtleBreakShield, turn + 2);
          summary.sequence.push(`🐢 กระดองเต่าแตกสลาย มอบโล่ป้องกัน +${turtleBreakShield} ให้ผู้เล่น!`);
        }
        if (gear.summonBreakRetaliate > 0 && attackerEnemy?.hp > 0) {
          summonHit(attackerEnemy, gear.summonBreakRetaliate, 'physical', attackerEnemy.armor, true);
          summary.sequence.push(`เสียงหอนจ่าฝูงสะท้อน ${gear.summonBreakRetaliate} ดาเมจแท้เมื่ออัญเชิญแตก`);
        }
        if (gear.summonBreakMana > 0) {
          refundSummonMana(gear.summonBreakMana);
          summary.sequence.push(`กระดิ่งสื่อวิญญาณคืน +${gear.summonBreakMana} มานา`);
        }
        if (gear.summonBreakDraw > 0) {
          const canDraw = Math.max(0, getHandLimit(player) - player.hand.length);
          const drawAmt = Math.min(canDraw, gear.summonBreakDraw);
          if (drawAmt > 0) {
            drawCards(state, drawAmt);
            summary.sequence.push(`กระดิ่งสื่อวิญญาณจั่วเพิ่ม +${drawAmt} ใบ`);
          }
        }
        if (elem === 'fire') {
          const mainDmg = sUnit.creatureId === 'golem' ? 10 : 8;
          const splashDmg = sUnit.creatureId === 'golem' ? 5 : 4;
          if (attackerEnemy && attackerEnemy.hp > 0) damage(attackerEnemy, mainDmg, 'fire');
          for (const other of live()) {
            if (attackerEnemy && other.id !== attackerEnemy.id && Math.abs(other.slot - attackerEnemy.slot) === 1) {
              damage(other, splashDmg, 'fire');
            }
          }
          summary.sequence.push(`🔥 แกนเพลิงระเบิด! ทำความเสียหาย ${mainDmg} (สะเก็ดไฟข้างเคียง ${splashDmg})`);
        } else if (elem === 'akki') {
          if (attackerEnemy && attackerEnemy.hp > 0) damage(attackerEnemy, 14, 'fire', attackerEnemy.armor);
          for (const other of live()) {
            if (!attackerEnemy || other.id !== attackerEnemy.id) damage(other, 5, 'fire');
          }
          summary.sequence.push('🔥 ระเบิดมหาอัคคี! 14 ดาเมจแท้ใส่ตัวการ และ 5 ดาเมจใส่ศัตรูทุกคน!');
        } else if (elem === 'ice') {
          if (attackerEnemy && attackerEnemy.hp > 0) {
            attackerEnemy.chill += 4;
            if (attackerEnemy.wetUntil >= turn) {
              attackerEnemy.freeze = Math.max(attackerEnemy.freeze || 0, 1);
              delete attackerEnemy.wetUntil;
              summary.sequence.push('❄️ ผลึกน้ำแข็งแตก แช่แข็งตัวการทันที!');
            }
          }
        } else if (elem === 'heman') {
          for (const target of live()) {
            damage(target, 12, 'ice');
            target.chill += 6;
          }
          summary.sequence.push('❄️ ระเบิดมหาเหมันต์! 12 ดาเมจ + หนาว 6 หน่วยใส่ศัตรูทุกคน!');
        } else if (elem === 'lightning') {
          if (attackerEnemy && attackerEnemy.hp > 0) damage(attackerEnemy, 8, 'lightning', 2);
          for (const other of live()) {
            if (attackerEnemy && other.id !== attackerEnemy.id && Math.abs(other.slot - attackerEnemy.slot) === 1) {
              damage(other, 4, 'lightning', 2);
              break;
            }
          }
          summary.sequence.push('⚡ สายฟ้าปะทุ! ช็อต 8 เจาะเกราะ และชิ่งข้างเคียง 4 ดาเมจ');
        } else if (elem === 'asani') {
          if (attackerEnemy && attackerEnemy.hp > 0) damage(attackerEnemy, 14, 'asani', 4);
          for (const other of live()) {
            if (!attackerEnemy || other.id !== attackerEnemy.id) damage(other, 7, 'asani', 2);
          }
          summary.sequence.push('⚡ มหาอสุนีบาตแตกสลาย! 14 เจาะเกราะใส่ตัวการ และ 7 ดาเมจใส่รอบข้าง!');
        } else if (elem === 'earth') {
          if (attackerEnemy && attackerEnemy.hp > 0) applyEarthArmorShred(attackerEnemy, 2);
          summary.sequence.push('⛰️ เศษศิลาถล่ม! ทุบเกราะตัวการถาวร -2');
        } else if (elem === 'pathaphi') {
          for (const target of live()) applyEarthArmorShred(target, 3);
          summary.sequence.push('⛰️ มหาปฐพีถล่ม! ทุบเกราะศัตรูทุกคนถาวร -3');
        } else if (elem === 'water') {
          for (const target of live()) target.wetUntil = Math.max(target.wetUntil ?? 0, turn + 2);
          heal(2, false, 'water');
          summary.sequence.push('💧 คลื่นวารีแตกกระจาย! สาดเปียกศัตรูทุกคน 2 เทิร์น + ฮีล 2 HP');
        } else if (elem === 'wari') {
          for (const target of live()) target.wetUntil = Math.max(target.wetUntil ?? 0, turn + 3);
          heal(10, false, 'water');
          summary.sequence.push('💧 มหาสึนามิแตกกระจาย! สาดเปียกศัตรูทุกคน 3 เทิร์น + ฟื้นฟู +10 HP!');
        } else if (elem === 'wind') {
          for (const target of live()) pushEnemy(target, 1, { sourceElement: 'wind' });
          summary.sequence.push('🌪️ พายุหมุนแตกสลาย! ผลักศัตรูทุกคนถอยหลัง 1 ช่อง!');
        } else if (elem === 'vayu') {
          for (const target of live()) pushEnemy(target, 2, { sourceElement: 'vayu' });
          summary.sequence.push('🌪️ มหาทอร์นาโดแตกสลาย! ผลักศัตรูทุกคนถอยหลัง 2 ช่อง!');
        }
      }

      function hurtSummon(unit, incoming, overflowAllowed) {
        const taken = Math.min(unit.hp, incoming);
        const overflow = incoming - taken;
        unit.hp -= taken;
        events.push({ type: 'summon_hit', source: enemy.id, target: 'summon', damage: taken, hpRemaining: unit.hp });
        if (taken > 0 && !unit.countered && enemy.hp > 0) {
          unit.countered = true;
          triggerSummonCounter(unit, enemy);
        }
        if (unit.hp === 0) {
          if (!overflowAllowed && overflow > 0) summary.blocked += overflow;
          const effect = summonEffect(unit.creatureId);
          unit.rebirthCount = unit.rebirthCount ?? (unit.rebirthUsed ? 1 : 0);
          const maxRebirths = (effect?.phoenixEggRevive || (unit.creatureId === 'phoenix' && gear.phoenixExtraEggRebirths > 0))
            ? 1 + gear.phoenixExtraEggRebirths
            : 0;
          if (maxRebirths > 0 && unit.rebirthCount < maxRebirths) {
            unit.rebirthCount += 1;
            unit.rebirthUsed = true;
            unit.hp = Math.ceil(unit.maxHp / 2);
            events.push({ type: 'summon_rebirth', target: 'summon', hp: unit.hp });
            summary.sequence.push(`ฟีนิกซ์เกิดจากไข่ (${unit.rebirthCount}/${maxRebirths}) · ${unit.hp} HP`);
          } else {
            triggerSummonOnBreak(unit, enemy);
            clearSummon(state);
          }
        }
        return overflowAllowed ? overflow : 0;
      }

      let actual = 0;
      let absorbed = 0;
      let effects = new Set();
      let explosions = [];
      let manaDrained = 0;
      const summon = state.player.summon;

      if (summon && summon.hp > 0 && !isAoE) {
        let hitSummon = true;
        if ((summon.element === 'wind' || summon.element === 'vayu' || summon.creatureId === 'bird') && !summon.hasDodged) {
          const dodgeChance = Math.max(summon.creatureId === 'bird' ? 0.20 : 0,
            summon.element === 'vayu' ? 0.40 : summon.element === 'wind' ? 0.25 : 0);
          if (random(state) < dodgeChance) {
            hitSummon = false;
            summon.hasDodged = true;
            events.push({ type: 'dodge', target: 'summon', source: enemy.id });
            summary.sequence.push(`💨 ${summon.name} พลิ้วกายหลบการโจมตีของ ${attackerBase?.name || enemy.kind} ได้อย่างสมบูรณ์แบบ!`);
          }
        }

        if (hitSummon && summon.ward > 0) {
          summon.ward--;
          hitSummon = false;
          events.push({ type: 'ward_absorb', target: 'summon', source: enemy.id });
          summary.sequence.push(`🛡️ ${summon.name} ใช้ม่านคุ้มภัยสลายการโจมตีทั้งหมด! (เหลือม่าน ${summon.ward} ชั้น)`);
        }

        if (hitSummon) {
          let summonDmg = incomingAttackAmt;
          if (summon.element === 'ice') summonDmg = Math.max(1, summonDmg - 1);
          if (summon.element === 'heman') summonDmg = Math.max(1, summonDmg - 2);
          const cGearDef = gear.summonCreatureBonus[summon.creatureId] ?? {};
          const innateReduction = (summon.creatureId === 'croc' ? 2 : summon.creatureId === 'lion' ? 3 : 0)
            + (cGearDef.damageReduction ?? 0)
            + (cGearDef.flatReduce ?? 0)
            + gear.summonFlatDamageReduction;
          const armorReduction = Math.min(summon.armor + innateReduction, Math.max(0, summonDmg - 1));
          summonDmg -= armorReduction;
          if (summon.creatureId === 'siren' && gear.counterWetOnHit > 0 && enemy.hp > 0) {
            enemy.wetUntil = Math.max(enemy.wetUntil ?? 0, turn + 2);
          }
          if (gear.counterShredOnHit > 0 && enemy.hp > 0) {
            applyEarthArmorShred(enemy, gear.counterShredOnHit);
          }
          const effect = summonEffect(summon.creatureId);
          const dragonPct = summon.creatureId === 'dragon'
            ? Math.max(effect?.dragonReflectPct ?? 0, gear.dragonReflectPct)
            : (effect?.dragonReflectPct ?? 0);
          const reflect = effect?.golemReflectDmg ?? Math.floor(incomingAttackAmt * dragonPct / 100);
          summonHit(enemy, reflect, 'physical', enemy.armor, true);
          hurtSummon(summon, summonDmg, false);
          absorbed = incomingAttackAmt;
        } else {
          absorbed = incomingAttackAmt;
        }

        if (action.manaDrain && player.hp > 0) {
          if (hitSummon) {
            manaDrained = Math.min(player.mana, action.manaDrain);
            if (manaDrained > 0) {
              player.mana -= manaDrained;
              summary.manaDrained = (summary.manaDrained ?? 0) + manaDrained;
              summary.sequence.push(
                enemy.kind === 'eternity_reborn'
                  ? `🌌 มหาเทพอนันตกาลกัดกร่อนมานา −${manaDrained} MP`
                  : `${ENEMIES[enemy.kind]?.name ?? 'ศัตรู'} สูบมานา −${manaDrained} MP`,
              );
            }
          } else {
            summary.sequence.push('ม่านคุ้มภัยสลายคลื่นสูบมานาสำเร็จ!');
          }
        }
      } else if (summon && summon.hp > 0 && isAoE && summon.aoeIntercept) {
        const interceptIncoming = gear.aoeInterceptDamageReductionPct > 0
          ? Math.max(1, Math.round(incomingAttackAmt * (100 - gear.aoeInterceptDamageReductionPct) / 100))
          : incomingAttackAmt;
        const rawOverflow = hurtSummon(summon, interceptIncoming, true);
        const overflow = (summon.creatureId === 'behemoth' && gear.behemothZeroOverflow)
          ? 0
          : (rawOverflow > 0 && gear.aoeOverflowReductionPct > 0
            ? Math.max(0, Math.round(rawOverflow * (100 - gear.aoeOverflowReductionPct) / 100))
            : rawOverflow);
        const absorbedBySummon = incomingAttackAmt - overflow;
        summary.sequence.push(`${summon.name} สกัด AoE ${absorbedBySummon} ดาเมจ · ส่วนเกิน ${overflow}`);
        if (gear.aoeInterceptManaGain > 0) {
          refundSummonMana(gear.aoeInterceptManaGain);
          summary.sequence.push(`ไม้เท้าการ์กอยล์คืน +${gear.aoeInterceptManaGain} มานาจากการสกัด AoE`);
        }
        if (gear.aoeInterceptRetaliateAll > 0) {
          for (const target of live()) damage(target, gear.aoeInterceptRetaliateAll, 'earth', target.armor);
          summary.sequence.push(`กำไลปีกการ์กอยล์สะท้อนคลื่นสกัด ${gear.aoeInterceptRetaliateAll} ดาเมจแท้ทั้งสนาม`);
        }
        if (summon.creatureId === 'behemoth' && gear.behemothInterceptRetaliate > 0) {
          for (const target of live()) damage(target, gear.behemothInterceptRetaliate, 'earth', target.armor);
          summary.sequence.push(`เกราะเบฮีมอธสะท้อนคลื่นสกัด ${gear.behemothInterceptRetaliate} ดาเมจแท้ทั้งสนาม`);
        }
        if (overflow > 0) {
          const res = applyIncomingToPlayer(overflow, true, enemy, null, action.pierceArmor ?? 0);
          actual = res.actual;
          absorbed = absorbedBySummon + res.absorbed;
          effects = res.effects;
          explosions = res.explosions;
        } else {
          actual = 0;
          absorbed = absorbedBySummon;
        }
        if (action.manaDrain && player.hp > 0) {
          manaDrained = Math.min(player.mana, action.manaDrain);
          if (manaDrained > 0) {
            player.mana -= manaDrained;
            summary.manaDrained = (summary.manaDrained ?? 0) + manaDrained;
            summary.sequence.push(`หนวดหมึกดำสูบมานา −${manaDrained} MP`);
          }
        }
      } else {
        if (action.steamBurst > 0) {
          let stripLeft = action.steamBurst;
          const layers = shieldLayers(player.shield);
          while (stripLeft > 0 && layers.length) {
            const take = Math.min(layers[0].hp, stripLeft);
            layers[0].hp -= take;
            stripLeft -= take;
            if (layers[0].hp <= 0) layers.shift();
          }
          player.shield = makeShield(layers);
          if (stripLeft > 0 && block > 0) {
            const takeBlock = Math.min(block, stripLeft);
            block -= takeBlock;
            stripLeft -= takeBlock;
          }
          const stripped = action.steamBurst - stripLeft;
          if (stripped > 0) summary.sequence.push(`💨 ระเบิดไอน้ำสลายโล่ผู้เล่น −${stripped}`);
        }
        const res = applyIncomingToPlayer(incomingAttackAmt, true, enemy, null, action.pierceArmor ?? 0);
        actual = res.actual;
        absorbed = res.absorbed;
        effects = res.effects;
        explosions = res.explosions;
        if (action.manaDrain && player.hp > 0) {
          manaDrained = Math.min(player.mana, action.manaDrain);
          if (manaDrained > 0) {
            player.mana -= manaDrained;
            summary.manaDrained = (summary.manaDrained ?? 0) + manaDrained;
            summary.sequence.push(
              enemy.kind === 'eternity_reborn'
                ? `🌌 มหาเทพอนันตกาลกัดกร่อนมานา −${manaDrained} MP`
                : `${ENEMIES[enemy.kind]?.name ?? 'ศัตรู'} สูบมานา −${manaDrained} MP`,
            );
          }
        }
      }
      if (action.spawnMagma && enemy.hp > 0) {
        const hazardSlot = enemy.slot === 0 ? 1 : 0;
        leaveMagma(hazardSlot);
      }
      if (action.grantBossWard && enemy.hp > 0) {
        const bossTarget = live().find(other => other.kind === action.grantBossWard);
        if (bossTarget) {
          bossTarget.wardGrant = Math.min(2, (bossTarget.wardGrant ?? 0) + 1);
          events.push({ type: 'ward-grant', source: enemy.id, target: bossTarget.id, slot: bossTarget.slot });
          summary.sequence.push(`เสาเตาหลอมเสริมม่านให้ ${ENEMIES[bossTarget.kind]?.name ?? bossTarget.kind} +1 เทิร์นหน้า`);
        }
      }

      if (player.hp <= 0) {
        const activeS = state.player.summon || state.summon;
        const phoenixReviveCap = (activeS && activeS.creatureId === 'phoenix' && ((upgrades.phoenix ?? 0) >= 10 || gear.phoenixExtraPlayerRevives > 0))
          ? 1 + gear.phoenixExtraPlayerRevives
          : 0;
        const phoenixRevivesUsed = state.phoenixRevivesUsed ?? 0;
        if (phoenixReviveCap > 0 && phoenixRevivesUsed < phoenixReviveCap) {
          state.phoenixRevivesUsed = phoenixRevivesUsed + 1;
          player.hp = player.maxHp;
          player.mana = getMaxMana(player);
          if (state.phoenixRevivesUsed < phoenixReviveCap) {
            activeS.hp = Math.ceil(activeS.maxHp / 2);
          } else {
            clearSummon(state);
          }
          if (gear.phoenixReviveFreeManaTurns > 0) {
            state.freeManaUntilTurn = Math.max(state.freeManaUntilTurn ?? 0, turn + gear.phoenixReviveFreeManaTurns);
          }
          events.push({ type: 'phoenix_revive', target: 'player', hp: player.hp, mana: player.mana });
          summary.sequence.push(`🔥🕊️ นิพพานฟีนิกซ์ (${state.phoenixRevivesUsed}/${phoenixReviveCap})! ฟีนิกซ์ชุบชีวิตผู้เล่นคืนสู่พลังเต็มเปี่ยม (HP ${player.hp}/${player.maxHp}, MP ${player.mana})!`);
        } else if (gear.armorSelfReviveOnce && !state.armorReviveUsed) {
          state.armorReviveUsed = true;
          player.hp = player.maxHp;
          if (gear.phoenixReviveFreeManaTurns > 0) {
            state.freeManaUntilTurn = Math.max(state.freeManaUntilTurn ?? 0, turn + gear.phoenixReviveFreeManaTurns);
          }
          events.push({ type: 'phoenix_revive', target: 'player', hp: player.hp, mana: player.mana });
          summary.sequence.push(`🔥 เกราะฟีนิกซ์ชุบชีวิตผู้เล่นเต็ม 100% (HP ${player.hp}/${player.maxHp})!`);
        } else if (activeS && activeS.hp > 0 && summonLevel >= 10) {
          player.hp = 1;
          clearSummon(state);
          events.push({ type: 'cheat_death', target: 'player', hp: 1 });
          summary.sequence.push(`👑 Sovereign Soul Aegis (+10 อัญเชิญ)! ดวงจิตสิ่งอัญเชิญสละชีพรับความตายแทนผู้เล่น! (ฟื้นคืนสติที่ 1 HP)`);
        }
      }
      events.push({
        type: 'attack',
        source: enemy.id,
        sourceKind: enemy.kind,
        amount: actual,
        absorbed,
        rawAttack: incomingAttackAmt,
        ...(manaDrained > 0 ? { manaDrain: manaDrained } : {}),
        isBoss: isBossAttacker,
        specialBoss: isSpecialBoss,
        ultimate: isUltimateSkill,
        heavy: isHeavyAttack,
        protection: protection(),
      });
      if (action.selfHeal && enemy.hp > 0) {
        const regen = enemyHealing(enemy, action.selfHeal);
        if (regen > 0) {
          enemy.hp += regen;
          events.push({ type: 'heal', source: enemy.id, target: enemy.id, amount: regen });
          summary.sequence.push(`${ENEMIES[enemy.kind]?.name ?? 'มหาคราเค่น'} ดูดกลืนกระแสน้ำฟื้น +${regen} HP`);
        }
      }
      if (action.chronoRewind && enemy.hp > 0) {
        if (enemy.eternityShatterUntil >= turn) {
          summary.sequence.push('✨ ผลึกธาตุแตก! หยุดการย้อนกาลเวลาฟื้นเลือดของมหาเทพได้สำเร็จ!');
        } else {
          const rewound = enemyHealing(enemy, action.chronoRewind);
          if (rewound > 0) {
            enemy.hp += rewound;
            events.push({ type: 'heal', source: enemy.id, target: enemy.id, amount: rewound, isChronosRewind: true });
            summary.sequence.push(`⏳ มหาเทพย้อนกาลเวลาฟื้น +${rewound} HP`);
          }
        }
      }
      if (action.soulDrain && actual > 0 && enemy.hp > 0) {
        if (enemy.netherPurgeUntil >= turn) {
          summary.sequence.push('ติดสถานะชำระมลทิน · สูบวิญญาณไม่สำเร็จ!');
        } else {
          const drained = enemyHealing(enemy, action.soulDrain);
          if (drained > 0) {
            enemy.hp += drained;
            events.push({ type: 'heal', source: enemy.id, target: enemy.id, amount: drained, isSoulDrain: true });
            summary.sequence.push(`💀 ${ENEMIES[enemy.kind]?.name ?? 'จอมอสูรนรกานต์'} สูบวิญญาณฟื้น +${drained} HP`);
          }
        }
      }
      if (effects.size) {
        const shieldRank = upgrades.shield ?? 0;
        for (const effect of effects) {
          if (enemy.hp <= 0) break;
          events.push({ type: 'shield-counter', target: enemy.id, element: effect });
          const elemRank = upgrades[effect] ?? 0;
          const wetBonus = enemy.wetUntil >= turn ? 2 : 0;
          const counterBurn = 3 + (hasEmberCore ? 1 : 0) + Math.floor(shieldRank / 2) + Math.floor(elemRank / 2);
          const counterDmg = 5 + Math.floor(shieldRank / 2) + elemRank;
          if (effect === 'fire') newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + counterBurn);
          if (['ice', 'chillgale', 'frostvolt'].includes(effect)) enemy.chill += 4;
          if (effect === 'water') heal(2, false, 'water');
          if (['lightning', 'plasma', 'magnet', 'shockstream', 'frostvolt'].includes(effect)) {
            damage(enemy, counterDmg + wetBonus, effect, 2);
          }
          if (effect === 'earth') {
            applyEarthArmorShred(enemy, 1);
            damage(enemy, Math.max(3, counterDmg - 2), 'earth');
          }
          if (effect === 'akki') {
            enemy.healCutUntil = turn + 1;
            newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + counterBurn);
          }
          if (effect === 'heman') enemy.chill += 2;
          if (effect === 'heman' || effect === 'chillgale') enemy.lastingChill = true;
          if (effect === 'asani') {
            damage(enemy, counterDmg + wetBonus, 'asani', 2);
            chainLightning(enemy, 5 + Math.floor(elemRank / 2), 2);
          }
          if (effect === 'pathaphi') {
            applyEarthArmorShred(enemy, 2);
            damage(enemy, counterDmg, 'pathaphi');
          }
          if (effect === 'wari') enemy.chill += 2;
          if (effect === 'magma') leaveMagma(enemy.slot);
          if (effect === 'dust') applyEarthArmorShred(enemy, 1);
          if (effect === 'permafrost' || effect === 'scald') applyEarthArmorShred(enemy, 2);
          if (effect === 'heatwave') burnNearby(enemy);
          if (['wind', 'vayu', 'dust', 'heatwave', 'chillgale'].includes(effect)) pushEnemy(enemy, 1, { sourceElement: effect });
          if (effect === 'monsoon') {
            heal(4, false, 'water');
            for (const target of live()) pushEnemy(target, 1, { sourceElement: 'monsoon' });
          }
          if (effect === 'magnet') pullNeighborsToward(enemy);
          if (effect === 'shockstream') shockWetEnemies(enemy);
          if (effect === 'frostvolt') chainLightning(enemy, counterDmg, 2, undefined, effect);
          applyMoisture(enemy, [effect]);
          if (effect === 'thunderstorm') {
            damage(enemy, counterDmg + wetBonus, effect, 2);
            pushEnemy(enemy, 1, { sourceElement: 'thunderstorm' });
            chainLightning(enemy, 5 + Math.floor(elemRank / 2), 2, undefined, effect);
          }
        }
      }
      for (const element of explosions) shieldBlast(1, element);
    } else if (action.type === 'heal') {
      const target = action.target ? enemyById(action.target) : live().reduce((best, candidate) => candidate.hp / candidate.maxHp < best.hp / best.maxHp ? candidate : best);
      const amount = enemyHealing(target, action.amount);
      target.hp += amount;
      events.push({ type: 'heal', source: enemy.id, target: target.id, amount });
    } else if (action.type === 'ward-grant') {
      const target = enemyById(action.target);
      target.wardGrant = Math.min(2, (target.wardGrant ?? 0) + 1);
      events.push({ type: 'ward-grant', source: enemy.id, target: target.id, slot: target.slot });
      summary.sequence.push(`ช่อง ${target.slot + 1} ได้ม่านเพิ่มเทิร์นหน้า`);
    } else if (action.type === 'ward-grant-all') {
      const recipients = (action.targets ?? []).map(enemyById).filter(target => target && target.hp > 0);
      for (const target of recipients) {
        target.wardGrant = Math.min(2, (target.wardGrant ?? 0) + (action.amount ?? 1));
        events.push({ type: 'ward-grant', source: enemy.id, target: target.id, slot: target.slot });
      }
      if (recipients.length) summary.sequence.push(`หนวดม่านวารีกางม่าน +1 ให้หนวดอื่น ${recipients.length} เส้นเทิร์นหน้า`);
    } else if (action.type === 'advance') {
      enemy.slot = action.slot;
      events.push({ type: 'push', target: enemy.id, slot: action.slot, advancing: true });
      summary.sequence.push(`${ENEMIES[enemy.kind].name} ไล่ประชิดช่อง ${action.slot + 1}`);
    } else if (action.type === 'swap') {
      const ally = enemyById(action.target);
      [enemy.slot, ally.slot] = [ally.slot, enemy.slot];
      events.push({ type: 'swap', source: enemy.id, target: ally.id, sourceSlot: enemy.slot, slot: ally.slot });
      summary.sequence.push(`สลับช่อง ${ally.slot + 1} กับ ${enemy.slot + 1}`);
    } else if (action.type === 'sealed') {
      delete enemy.sealed;
      events.push({ type: 'sealed', source: enemy.id });
      summary.sequence.push(`ช่อง ${enemy.slot + 1} ข้ามท่าสนับสนุน`);
    } else if (action.type === 'recover') {
      events.push({ type: 'recover', source: enemy.id, label: action.shortLabel });
    } else if (action.type === 'frozen' || action.type === 'summon-stunned') {
      if (action.type === 'frozen') enemy.freeze--;
      events.push({ type: 'frozen', source: enemy.id });
    } else if (action.type === 'charge') {
      if (enemy.kind === 'ember_overlord') {
        const regen = enemyHealing(enemy, 5);
        if (regen > 0) {
          enemy.hp += regen;
          events.push({ type: 'heal', source: enemy.id, target: enemy.id, amount: regen });
          summary.sequence.push(`จ้าวอัคคีหลอมแก่นเพลิงฟื้น +${regen} HP`);
        }
      } else if (enemy.kind === 'tempest_archon') {
        const regen = enemyHealing(enemy, 8);
        if (regen > 0) {
          enemy.hp += regen;
          events.push({ type: 'heal', source: enemy.id, target: enemy.id, amount: regen });
          summary.sequence.push(`จ้าวพายุชาร์จประจุฟื้น +${regen} HP`);
        }
      }
      const isSpecialBoss = ['ember_overlord', 'tempest_archon', 'volcano_colossus', 'thunder_drake_emperor', 'abyssal_kraken', 'nether_dread_lord', 'eternity_overlord', 'eternity_reborn', 'ironforge_automaton', 'tempest_blade_seraph', 'abyssal_tide_colossus', 'magma_core_juggernaut', 'chitin_bastion_behemoth', 'storm_sovereign_drake', 'void_kraken_leviathan', 'nether_forge_overlord', 'eternity_armory_god'].includes(enemy.kind);
      events.push({
        type: 'charge',
        label: action.label,
        source: enemy.id,
        sourceKind: enemy.kind,
        isBoss: Boolean(enemy.isBoss),
        specialBoss: isSpecialBoss,
        ultimate: isSpecialBoss,
      });
    }
  }
  if (player.hp > 0) {
    checkNetherPhase2(state, summary, events);
    checkNetherForgeExposed();
    checkEternityPhase2(state, summary, events);
    checkArmoryGodPhase(state, summary, events);
  }
  for (const enemy of live()) {
    const amount = newBurn.get(enemy.id);
    if (amount) { enemy.burn += amount; enemy.burnTurn = turn + 1; }
    if (newLingeringBurn.has(enemy.id)) enemy.lingeringBurn = true;
  }
  for (const enemy of enemies) {
    if (enemy.summonWardBreakUntil <= turn) delete enemy.summonWardBreakUntil;
    if (enemy.healCutUntil <= turn) delete enemy.healCutUntil;
    if (enemy.wetUntil <= turn) delete enemy.wetUntil;
    if (enemy.magmaArmorUntil <= turn) delete enemy.magmaArmorUntil;
    if (enemy.abyssalShockUntil <= turn) delete enemy.abyssalShockUntil;
    if (enemy.netherPurgeUntil <= turn) delete enemy.netherPurgeUntil;
    if (enemy.netherExposedTurn <= turn) delete enemy.netherExposedTurn;
    if (enemy.eternityShatterUntil <= turn) delete enemy.eternityShatterUntil;
    if (enemy.groundedUntil <= turn) delete enemy.groundedUntil;
    if (enemy.earthArmorUntil <= turn) {
      delete enemy.earthArmorUntil;
      delete enemy.earthArmorShred;
    }
  }
  if (player.shield) {
    if (effectiveTimeStopped && gear.timestopPreserveShield) {
      player.shield = makeShield(shieldLayers(player.shield).map(layer => ({
        ...layer,
        expires: Math.min(turn + 2, layer.expires + 1),
      })));
    }
    if (player.shield?.expires <= turn || player.shield?.layerDetails) {
      player.shield = makeShield(shieldLayers(player.shield).filter(layer => layer.expires > turn));
    }
  }
  if (player.elementBuffs) {
    for (const [family, buff] of Object.entries(player.elementBuffs)) {
      if (!buff || buff.expires <= turn) delete player.elementBuffs[family];
    }
  }
  summary.enemyArmorAfterTurn = Object.fromEntries(enemies.map(enemy => [enemy.id, enemy.armor]));

  summary.finalEnemyHp = Object.fromEntries(enemies.map(enemy => [enemy.id, enemy.hp]));
  state.stats.turns++;
  state.stats.damage += summary.damage;
  state.stats.blocked += summary.blocked;
  if (!guard) {
    state.stats.casts++;
    if (!fizzled) {
      const phrase = parsed.ids.join(' ');
      if (!state.stats.discovered.includes(phrase)) state.stats.discovered.push(phrase);
    }
  }
  const krakenPhase2Triggered = player.hp > 0 && !live().length
    && !state.krakenPhase && state.enemies.some(enemy => KRAKEN_TENTACLE_KINDS.includes(enemy.kind));
  if (krakenPhase2Triggered) {
    nextMagmaPuddles.clear();
    triggerKrakenPhase2(state, summary, events);
  }
  const eternityPhase3Triggered = player.hp > 0 && !live().length
    && state.room === FLOOR100_BOSS_ROOM && state.eternityPhase !== 3
    && state.enemies.some(enemy => enemy.kind === 'eternity_overlord');
  if (eternityPhase3Triggered) {
    nextMagmaPuddles.clear();
    triggerEternityPhase3(state, summary, events);
  }
  if (player.hp <= 0) {
    clearSummon(state);
    delete state.blackhole;
    delete state.deathSpent;
    delete state.legendaryTurns;
    delete state.krakenPhase;
    delete state.netherPhase;
    delete state.eternityPhase;
    clearPhase3BattleFlags(state);
    player.elementBuffs = {};
    player.hp = 0;
    if (state.rift) {
      resolveRiftDefeat(state, summary, events);
    } else {
      const fallback = fallBackOnDefeat(state);
      if (fallback.phase === 'sanctuary') {
        summary.fellToFloor = fallback.targetFloor;
        if (fallback.targetFloor === 5 || fallback.targetFloor === 4) summary.fellToFloor4 = true;
        events.push({ type: 'fall', targetFloor: fallback.targetFloor });
      } else {
        state.phase = 'lost';
      }
    }
  } else if (!live().length) {
    clearSummon(state);
    player.elementBuffs = {};
    if (state.rift) {
      resolveRiftBattleVictory(state, summary, events);
    } else {
      delete state.blackhole;
      delete state.deathSpent;
      delete state.legendaryTurns;
      delete state.krakenPhase;
      delete state.netherPhase;
      delete state.eternityPhase;
      clearPhase3BattleFlags(state);
      if (!state.clearedRooms.includes(state.room)) {
        state.clearedRooms.push(state.room);
      }
      recordClearedFloorProgress(state, state.room);
      state.highestRoom = Math.max(state.highestRoom ?? 0, Math.min(state.rooms.length - 1, state.room + 1));
      if (dropsCardReward) {
        if (!isBossRoom(state) && !isUpperCacheRoom(state.room)) summary.roomRecovery = recoverAfterRoom(state);
        makeRewards(state);
      } else if (revisit && (state.replayReturn || isSanctuaryUnlocked(state))) {
        summary.roomRecovery = recoverAfterRoom(state);
        completeRevisitVictoryToSanctuary(state, summary);
      } else {
        summary.roomRecovery = recoverAfterRoom(state);
        const rel = state.room % 25;
        const D = Math.floor(state.room / 25);
        if (rel === 11) {
          state.sanctuaryUnlocked = true;
          state.sanctuaryFloor = D * 10 + 5;
          state.sanctuaryRested = false;
          state.highestRoom = Math.max(state.highestRoom ?? 0, state.room + 1);
          state.phase = 'sanctuary';
        } else if (rel === 23) {
          state.sanctuaryUnlocked = true;
          state.sanctuaryFloor = `pre${(D + 1) * 10}`;
          state.sanctuaryRested = false;
          state.highestRoom = Math.max(state.highestRoom ?? 0, state.room + 1);
          state.phase = 'sanctuary';
        } else if (rel === 24) {
          const majorBossFloor = (D + 1) * 10;
          const relicId = grantBossRelic(player, majorBossFloor);
          if (relicId) {
            summary.relicDropped = relicId;
            events.push({ type: 'relic', relicId });
          }
          if (majorBossFloor === 100 || state.room >= (state.rooms?.length ?? 250) - 1) {
            state.phase = 'won';
          } else {
            state.sanctuaryUnlocked = true;
            state.sanctuaryFloor = `post${majorBossFloor}`;
            state.sanctuaryRested = false;
            state.highestRoom = Math.max(state.highestRoom ?? 0, state.room + 1);
            state.phase = 'sanctuary';
          }
        } else {
          state.room++;
          enterRoom(state);
        }
      }
    }
  } else {
    state.turn++;
    if (spell?.form === 'ascension') {
      summary.ascensionReady = true;
      if (gear.ascensionPermanentUpgrades) state.permanentAscension = true;
      if (gear.ascensionPermanentFreeCast) state.permanentAscensionFree = true;
      events.push({ type: 'ascension-ready' });
      const amount = unlockedSecondaryEffects.find(eff => eff.id === 'ascension_aegis')?.ascensionShield ?? 0;
      if (amount) {
        player.shield = makeShield([...shieldLayers(player.shield), { hp: amount, expires: state.turn + 1, effect: null, triggered: false }]);
        events.push({ type: 'shield', shieldKind: 'shield', amount, layers: 1, protection: shieldProtection(player.shield) });
        summary.sequence.push(`โล่จุติ +${amount}`);
      }
    }
    if (spell?.delayed) {
      block = 0;
      castShield(state.turn);
    }
    const totalNextHealing = (spell?.nextHealing ?? 0)
      + (spell?.nextHealing ? secondaryGrandNextTurnBonus : 0)
      + ((spell?.form === 'heal' || (spell?.form === 'shield' && spell?.healing) || (spell?.form === 'fill' && spell?.resource === 'blood')) ? secondaryNextTurnHealBonus : 0)
      + gear.turnStartHeal;
    if (totalNextHealing > 0 && player.hp < player.maxHp) {
      const beforeHeal = player.hp;
      heal(totalNextHealing, true);
      summary.sequence.push(`ต้นเทิร์นถัดไปฟื้น +${player.hp - beforeHeal} HP`);
    }
    const totalShieldRenewal = (spell?.shieldRenewal ?? 0)
      + (spell?.shieldRenewal ? secondaryGrandNextTurnBonus : 0)
      + (spell?.form === 'shield' && !spell.delayed ? secondaryShieldRenewal : 0);
    if (totalShieldRenewal > 0 && player.shield) {
      const layer = player.shield.layers[0];
      const renewal = Math.max(0, Math.min(totalShieldRenewal, (spell.layerHp ?? 6) + shieldUpgradeBonus + (hasWorldloom ? 3 : 0) - layer));
      if (renewal > 0) {
        player.shield.layers[0] += renewal;
        events.push({ type: 'shield', protection: protection(), amount: renewal, restored: renewal, grand: Boolean(spell.grand), large: Boolean(spell.large), shieldKind: spell.effect ?? 'shield' });
        summary.sequence.push(`ต้นเทิร์นถัดไปเติมโล่ +${renewal}`);
      }
    }
    if (nextMagmaPuddles.size) state.magmaPuddles = [...nextMagmaPuddles];
    if (player.summon?.creatureId === 'hydra') {
      player.summon.hp = Math.min(player.summon.maxHp, player.summon.hp + 6 + gear.hydraRegenBonus);
    }
    if (gear.drawToFullHand || (timeStopped && (gear.timestopFullHandDraw || gear.timestopRefillHandAndMana))) {
      const missing = Math.max(0, getHandLimit(player) - player.hand.length);
      if (missing > 0) drawCards(state, missing);
    } else {
      drawCards(state, undefined, guard || spell?.form === 'summon');
    }
    const turnRegen = getTurnManaRegen(state.room) + gear.turnStartManaBonus;
    const maxManaCap = getMaxMana(player);
    const manaOverflow = Math.max(0, player.mana + turnRegen - maxManaCap);
    player.mana = Math.min(maxManaCap, player.mana + turnRegen);
    if (manaOverflow > 0 && gear.manaOverflowToBlock > 0 && gearManaOverflowBlocked < 16) {
      const gained = Math.min(16 - gearManaOverflowBlocked, manaOverflow * gear.manaOverflowToBlock);
      if (gained > 0) {
        gearManaOverflowBlocked += gained;
        grantSummonShield(gained, state.turn + 1);
        summary.sequence.push(`แหวนตาน้ำแปลงมานาล้น +${manaOverflow} เป็นโล่ +${gained}`);
      }
    }
    if (timeStopped) {
      if (gear.timestopRefillHandAndMana) {
        const gained = Math.max(0, getMaxMana(player) - player.mana);
        if (gained > 0) {
          player.mana = getMaxMana(player);
          events.push({ type: 'mana-refund', amount: gained });
          summary.sequence.push(`ชุดโครนอสเติมมานาเต็ม +${gained}`);
        }
      } else {
        const amount = Math.min(getMaxMana(player) - player.mana, (upgrades.timestop ?? 0) + gear.timestopBonusMana);
        if (amount > 0) {
          player.mana += amount;
          events.push({ type: 'mana-refund', amount });
          summary.sequence.push(`มานาจากหยุดเวลา +${amount}`);
        }
      }
    }
    if (!effectiveTimeStopped) prepareEnemies(state);
  }
  summary.hp = player.hp;
  summary.nextMana = player.mana;
  summary.phase = state.phase;
  summary.nextRoom = state.room;
  summary.shield = player.shield?.layers.reduce((sum, value) => sum + value, 0) ?? 0;
  return { ok: true, state, events, summary };
}
