import { makeShield, shieldLayers, shieldProtection } from './shields.js';
import { ATTACK_FORMS, BATTLE_LIMITED_WORDS, FUSED_ELEMENTS, WORDS, elementFamily, getElementComponents, fireShieldLayers, parseSpell, getWeaknessReaction, ELEMENT_LABELS, lightDamagePenalty } from './words.js';
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
  eternityDamageLimit,
  triggerEternityPhase3,
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
  const upgrades = ascended
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
  const inRift = state.room >= FLOOR31_START_ROOM;

  // Calculate card upgrade bonuses from the words placed in this spell phrase
  const uniquePhraseIds = [...new Set(rawIds)];
  const phraseUpgradeSum = filterFn => uniquePhraseIds.filter(filterFn).reduce((sum, id) => sum + (upgrades[id] ?? 0), 0);
  const secondaryActive = id => (ascended && uniquePhraseIds.includes(id)) || hasCardSecondaryUpgrade(state, id);
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
  const secondaryBeamStripWard = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.beamStripWard ?? 0), 0);
  const secondaryWaveChillBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.waveChillBonus ?? 0), 0);
  const secondaryNextTurnHealBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.nextTurnHealBonus ?? 0), 0);
  const secondaryOverhealShieldCap = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.overhealShieldCap ?? 0), 0);
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
  const axeArmorShred = unlockedSecondaryEffects.find(eff => eff.id === 'axe_sunder')?.axeArmorShred ?? 0;
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
    + (blessings.includes('blessing_vitality') ? 2 : 0);
  const healUpgradeBonus = (rawIds.includes('heal') ? (upgrades.heal ?? 0) * 2 + healMainPctBonus : 0)
    + (rawIds.includes('self') ? (upgrades.self ?? 0) * 2 : 0)
    + auxUpgradeBonus
    + largeExtraSelfUpgrade
    + grandExtraSelfUpgrade
    + secondaryPairSelfBonus
    + secondaryLargeSelfBonus
    + secondaryGrandSelfBonus
    + (blessings.includes('blessing_vitality') ? 2 : 0);
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
  let block = (guard ? 3 + (hasWorldloom ? 3 : 0) : 0) + secondaryShieldBonus + (hasGaiaEmblem ? 3 : 0);
  player.mana -= cost;
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
    const afterArmor = Math.max(0, Math.ceil(empowered + empowered * exposedBonus / 100) - Math.max(0, enemy.armor - pierce)) + overpierceBonus;
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
    const liveEternityCouncil = state.room === FLOOR100_BOSS_ROOM && enemy.kind === 'eternity_overlord' && !state.eternityPhase
      ? live().filter(ally => ally.id !== enemy.id).length
      : 0;
    const councilFactor = liveEternityCouncil > 0 ? Math.max(0.55, 1 - liveEternityCouncil * 0.15) : 1;
    const baseDmg = Math.ceil(afterArmor * (100 - reduction) / 100 * (guardedByAllies ? 0.75 : 1) * pactFactor * councilFactor);
    if (guardedByAllies && afterArmor > 0) summary.sequence.push('ตราประสานลดดาเมจบอส 25% เพราะยังมีลูกสมุน');
    if (liveNetherPillars > 0 && afterArmor > 0) summary.sequence.push(`พันธสัญญา ${liveNetherPillars} เสาลดดาเมจบอส −${liveNetherPillars * 25}%`);
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
          const curse = applyIncomingToPlayer(8);
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
    const limit = eternityDamageLimit(state, enemy);
    const actual = Math.min(amount, limit);
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
    if (killed) {
      const hpBefore = player.hp;
      const maxHpBefore = player.maxHp;
      awardEnemyBounty(enemy);
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

  function applyMoisture(enemy, elements) {
    if (elements.includes('hail')) {
      if (enemy.wetUntil >= turn) {
        delete enemy.wetUntil;
        enemy.freeze++;
        events.push({ type: 'status', status: 'freeze', target: enemy.id });
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
    if (elements.includes('water')) {
      enemy.wetUntil = turn + 1;
      if (secondaryWaterSplashWet) {
        for (const candidate of live()) {
          if (Math.abs(candidate.slot - enemy.slot) === 1) candidate.wetUntil = turn + 1;
        }
      }
    }
    if (elements.includes('wari')) {
      if (secondaryWariWetAll) {
        for (const candidate of live()) candidate.wetUntil = turn + 1;
      } else {
        enemy.wetUntil = turn + 1;
        for (const candidate of live()) {
          if (Math.abs(candidate.slot - enemy.slot) === 1) candidate.wetUntil = turn + 1;
        }
      }
    }
    if (elements.includes('monsoon')) {
      for (const candidate of live()) {
        candidate.wetUntil = turn + 1;
      }
    }
  }

  function hit(enemy, strength, pierce, elements) {
    const families = elements.map(elementFamily);
    const wasWet = enemy.wetUntil >= turn;
    const wasChilledBeforeHit = enemy.chill > 0;
    const wasBurnedBeforeHit = enemy.burn > 0;
    const wasBurnOrHealCut = enemy.burn > 0 || enemy.healCutUntil >= turn;
    let finalStrength = strength;
    if (elements.includes('akki') && secondaryAkkiExecutePct > 0 && wasBurnOrHealCut) {
      finalStrength = Math.round(finalStrength * (100 + secondaryAkkiExecutePct) / 100);
    }
    if (elements.includes('hail') && secondaryHailFreezeDmgPct > 0 && (wasWet || enemy.freeze > 0)) {
      finalStrength = Math.round(finalStrength * (100 + secondaryHailFreezeDmgPct) / 100);
    }
    const conductivity = families.includes('lightning') && (wasWet || families.includes('water')) ? 2 : 0;
    const effectivePierce = spell.form === 'axe' ? Math.max(enemy.armor, pierce) : pierce;
    damage(enemy, finalStrength + conductivity, elements.length > 1 ? elements : (elements[0] ?? spell.form), effectivePierce, spell.form);
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
      + (elements.includes('mudmire') ? (upgrades.mudmire ?? 0) : 0);
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
      const monsoonHeal = 4 + (upgrades.monsoon ?? 0);
      heal(monsoonHeal, false, 'water');
      summary.sequence.push(`คลื่นมรสุมฟื้นฟู +${monsoonHeal} HP`);
    }
    if (elements.includes('wari') && !summary.wariHealed) {
      summary.wariHealed = true;
      const wariHeal = 4 + (upgrades.wari ?? 0);
      heal(wariHeal, false, 'water');
      summary.sequence.push(`คลื่นวารีฟื้นฟู +${wariHeal} HP`);
    } else if (elements.includes('water') && !summary.waterHealed) {
      summary.waterHealed = true;
      const waterHeal = 2 + Math.floor((upgrades.water ?? 0) / 2);
      heal(waterHeal, false, 'water');
      summary.sequence.push(`ละอองวารีฟื้นฟู +${waterHeal} HP`);
    }
    if (enemy.hp <= 0) {
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
    const frozen = elements.some(id => ['ice', 'heman', 'wari', 'chillgale', 'frostvolt'].includes(id));
    if (frozen) {
      const iceUpgradeChill = elements.includes('ice') ? Math.floor((upgrades.ice ?? 0) / 3) + secondaryChillBonus : 0;
      const hemanUpgradeChill = elements.includes('heman') ? Math.floor((upgrades.heman ?? 0) / 2) + secondaryHemanChillBonus : 0;
      const wariUpgradeChill = elements.includes('wari') ? secondaryWariChillBonus : 0;
      const chillgaleUpgradeChill = elements.includes('chillgale') ? Math.floor((upgrades.chillgale ?? 0) / 2) + secondaryChillgaleChillBonus : 0;
      const frostvoltUpgradeChill = elements.includes('frostvolt') ? Math.floor((upgrades.frostvolt ?? 0) / 2) : 0;
      enemy.chill += ((elements.includes('ice') || elements.includes('heman') || elements.includes('chillgale') || elements.includes('frostvolt')) ? 4 : 2)
        + iceUpgradeChill + hemanUpgradeChill + wariUpgradeChill + chillgaleUpgradeChill + frostvoltUpgradeChill;
    }
    if (elements.includes('pathaphi') && secondaryPathaphiChillBonus > 0) {
      enemy.chill += secondaryPathaphiChillBonus;
    }
    if (elements.includes('permafrost') && secondaryPermafrostChillBonus > 0) {
      enemy.chill += secondaryPermafrostChillBonus;
    }
    if (elements.includes('mist')) {
      const mistChill = Math.floor((upgrades.mist ?? 0) / 2) + secondaryMistChillBonus;
      if (mistChill > 0) enemy.chill += mistChill;
    }
    if (elements.includes('scald')) {
      const scaldChill = Math.floor((upgrades.scald ?? 0) / 2) + secondaryScaldChillBonus;
      if (scaldChill > 0) enemy.chill += scaldChill;
    }
    if (elements.includes('dust') && secondaryDustObscure) {
      enemy.obscured = true;
    }
    if (elements.includes('heman') && secondaryHemanSplashChill > 0) {
      for (const adj of live()) {
        if (Math.abs(adj.slot - enemy.slot) === 1) {
          adj.chill += secondaryHemanSplashChill;
          events.push({ type: 'status', status: 'chill', target: adj.id });
        }
      }
    }
    if (elements.includes('chillgale') && secondaryChillgaleSplashChill > 0) {
      for (const adj of live()) {
        if (Math.abs(adj.slot - enemy.slot) === 1) {
          adj.chill += secondaryChillgaleSplashChill;
          adj.lastingChill = true;
          events.push({ type: 'status', status: 'chill', target: adj.id });
        }
      }
    }
    if (elements.includes('heman') && secondaryHemanFreezeChilled && wasChilledBeforeHit) {
      enemy.freeze += 1;
      events.push({ type: 'status', status: 'freeze', target: enemy.id });
      summary.sequence.push(`เหมันต์เยือกแข็งแช่แข็งช่อง ${enemy.slot + 1}!`);
    }
    if (elements.includes('heman') || elements.includes('chillgale') || (elements.includes('ice') && secondaryLastingChill)) {
      enemy.lastingChill = true;
    }
    if (elements.includes('akki')) enemy.healCutUntil = turn + 1 + secondaryAkkiHealCutExtend;
    if (elements.includes('pathaphi')) {
      applyEarthArmorShred(enemy, 2 + secondaryPathaphiShredBonus);
      if (secondaryPathaphiZeroArmorDmg > 0 && enemy.hp > 0 && enemy.armor === 0) {
        damage(enemy, secondaryPathaphiZeroArmorDmg, 'pathaphi', enemy.armor);
        summary.sequence.push(`ปฐพีกระแทกเป้าไร้เกราะ +${secondaryPathaphiZeroArmorDmg} ดาเมจแท้`);
      }
    } else if (elements.includes('permafrost')) {
      applyEarthArmorShred(enemy, 2 + secondaryPermafrostShredBonus);
      if (secondaryPermafrostFreezeZeroArmor && enemy.hp > 0 && enemy.armor === 0) {
        enemy.freeze += 1;
        events.push({ type: 'status', status: 'freeze', target: enemy.id });
        summary.sequence.push(`เยือกศิลาแช่แข็งเป้าไร้เกราะช่อง ${enemy.slot + 1}!`);
      }
    } else if (elements.includes('scald')) {
      applyEarthArmorShred(enemy, 2 + secondaryScaldShredBonus);
      if (secondaryScaldZeroArmorDmg > 0 && enemy.hp > 0 && enemy.armor === 0) {
        damage(enemy, secondaryScaldZeroArmorDmg, 'scald', enemy.armor);
        summary.sequence.push(`ไอเดือดช็อกเป้าไร้เกราะ +${secondaryScaldZeroArmorDmg} ดาเมจแท้`);
      }
    } else if (elements.includes('earth')) {
      applyEarthArmorShred(enemy, 1 + secondaryEarthShredBonus);
    } else if (elements.includes('dust')) {
      applyEarthArmorShred(enemy, 1 + secondaryDustShredBonus);
    }
    if (elements.includes('mudmire') && secondaryMudmireArmorShred > 0 && enemy.hp > 0) {
      applyEarthArmorShred(enemy, secondaryMudmireArmorShred);
    }
    if (elements.includes('plasma') && secondaryPlasmaArmorShred > 0 && enemy.hp > 0) {
      applyEarthArmorShred(enemy, secondaryPlasmaArmorShred);
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
    if (enemy.kind === 'thunder_drake_emperor' && hasEarthElement) {
      const alreadyGrounded = enemy.groundedUntil >= turn + 1;
      enemy.groundedUntil = turn + 1;
      if (!alreadyGrounded) {
        summary.sequence.push(`ธาตุดินลงกราวด์ · สลายประจุดาราของ${ENEMIES[enemy.kind].name}จนถึงเทิร์นหน้า`);
      }
    }
    const hasLightningElement = elements.some(id => getElementComponents(id).includes('lightning'));
    if (enemy.kind === 'abyssal_kraken' && hasLightningElement && enemy.hp > 0) {
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
    if (enemy.kind === 'nether_dread_lord' && hasPurgeElement && enemy.hp > 0) {
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
    applyMoisture(enemy, elements);
    if (elements.includes('magma') && secondaryMagmaBurnBonus > 0 && enemy.hp > 0) {
      newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + secondaryMagmaBurnBonus);
      events.push({ type: 'status', status: 'burn', target: enemy.id });
    }
    if (elements.includes('mist') && (upgrades.mist ?? 0) > 0 && enemy.hp > 0) {
      newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + (upgrades.mist ?? 0));
      events.push({ type: 'status', status: 'burn', target: enemy.id });
    }
    if (elements.includes('plasma') && secondaryPlasmaBurnBonus > 0 && enemy.hp > 0) {
      newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + secondaryPlasmaBurnBonus);
      events.push({ type: 'status', status: 'burn', target: enemy.id });
    }
    if (elements.includes('scald') && enemy.hp > 0) {
      const scaldBurn = Math.floor((upgrades.scald ?? 0) / 2) + secondaryScaldApplyWetBurn;
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
    if (elements.includes('shockstream')) shockWetEnemies(enemy, spell.form, wasWet);
    if (spell.freeze) {
      enemy.freeze += spell.freeze;
      const freezeMainChill = Math.floor((upgrades.freeze ?? 0) / 3) + secondaryFreezeChillBonus;
      if (freezeMainChill > 0) enemy.chill += freezeMainChill;
      if (secondaryFreezeArmorShred > 0) applyEarthArmorShred(enemy, secondaryFreezeArmorShred);
      events.push({ type: 'status', status: 'freeze', target: enemy.id });
    }
    if (spell.burn) {
      const burnAmount = spell.burn
        + burnUpgradeBonus
        + secondaryBurnCardBonus
        + (blessings.includes('blessing_ember') && elements.some(id => elementFamily(id) === 'fire') ? 1 : 0)
        + (hasEmberCore && elements.some(id => getElementComponents(id).includes('fire')) ? 1 : 0);
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

  function shockWetEnemies(enemy, attackForm, primaryWasWet = false) {
    const shockDmg = 10 + (upgrades.shockstream ?? 0) * 2 + secondaryShockstreamBonusDmg;
    const shockPierce = 2 + pierceUpgradeBonus;
    for (const target of live()) {
      const isPrimaryReshock = target.id === enemy.id && primaryWasWet && secondaryShockstreamWetPrimary;
      if ((target.id !== enemy.id && target.wetUntil >= turn) || isPrimaryReshock) {
        damage(target, shockDmg, 'shockstream', shockPierce, attackForm);
        summary.sequence.push(`กระแสช็อตชิ่งไปช่อง ${target.slot + 1}`);
        if (secondaryShockstreamManaPerWet > 0 && shockstreamManaRefunded < 3) {
          const refund = Math.min(3 - shockstreamManaRefunded, getMaxMana(player) - player.mana, secondaryShockstreamManaPerWet);
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
    const targets = ((isAsani && secondaryAsaniChainBoth)
      || (isThunderstorm && secondaryThunderstormChainBoth)
      || (isFrostvolt && secondaryFrostvoltChainBoth)) ? candidates : [candidates[0]];
    const chainRatio = isAsani && secondaryAsaniChainPct > 0 ? secondaryAsaniChainPct / 100
      : isThunderstorm && secondaryThunderstormChainPct > 0 ? secondaryThunderstormChainPct / 100
      : isFrostvolt && secondaryFrostvoltChainPct > 0 ? secondaryFrostvoltChainPct / 100 : 0.5;
    for (const neighbor of targets) {
      const neighborWet = neighbor.wetUntil >= turn;
      const neighborWasChilled = neighbor.chill > 0;
      events.push({ type: 'chain-lightning', source: enemy.id, target: neighbor.id, element, ...spellVfxFlags });
      damage(neighbor, strength * chainRatio + flatBonus + (neighborWet ? 2 : 0), element, pierce, attackForm);
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
        if (secondaryFrostvoltChainFreezeChilled && neighborWasChilled) {
          neighbor.freeze += 1;
          events.push({ type: 'status', status: 'freeze', target: neighbor.id });
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
      + (usesChillgale && direction === 1 ? secondaryChillgaleExtraSteps : 0);

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
          const collisionDmg = Math.round((hasBoostedSlam ? 10 : 8) * mult) + pullUpgrade;
          events.push({ type: 'wall-slam', target: enemy.id, collider: blocker.id, amount: collisionDmg, collision: true });
          damage(enemy, collisionDmg, impactElement, enemy.armor);
          if (blocker.hp > 0) {
            events.push({ type: 'wall-slam', target: blocker.id, collider: enemy.id, amount: collisionDmg, collision: true });
            damage(blocker, collisionDmg, impactElement, blocker.armor);
          }
          summary.sequence.push(`กระชากชนกัน! ช่อง ${enemy.slot + 1} ชนช่อง ${blocker.slot + 1} · ดาเมจตัวละ ${collisionDmg} (ทะลุเกราะ)`);
        } else if (fromPushCard || allowCollision || hasWindFamily) {
          const collisionDmg = (fromPushCard
            ? Math.round((hasBoostedSlam ? 10 : 8) * mult) + pushUpgrade
            : (hasBoostedSlam ? 6 : 3)) + windUpgradeSlam;
          events.push({ type: 'wall-slam', target: enemy.id, collider: blocker.id, amount: collisionDmg, collision: true });
          damage(enemy, collisionDmg, impactElement, enemy.armor);
          if (blocker.hp > 0) {
            events.push({ type: 'wall-slam', target: blocker.id, collider: enemy.id, amount: collisionDmg, collision: true });
            damage(blocker, collisionDmg, impactElement, blocker.armor);
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
          const slamDmg = Math.max(hasBoostedSlam ? 6 : 4, Math.round(4 * mult) + pullUpgrade);
          events.push({ type: 'wall-slam', target: enemy.id, amount: slamDmg });
          damage(enemy, slamDmg, impactElement, enemy.armor);
          summary.sequence.push(`กระชากชนขอบหน้า · ดาเมจ ${slamDmg} (ทะลุเกราะ)`);
        } else if (fromPushCard || hasWindFamily) {
          const slamDmg = (fromPushCard
            ? Math.max(hasBoostedSlam ? 6 : 4, Math.round(4 * mult) + pushUpgrade)
            : (hasBoostedSlam ? 6 : 3)) + windUpgradeSlam;
          events.push({ type: 'wall-slam', target: enemy.id, amount: slamDmg });
          damage(enemy, slamDmg, impactElement, fromPushCard ? enemy.armor : 0, fromPushCard ? null : (spell?.form ?? null));
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
    const effective = target.healCutUntil >= turn ? Math.floor(amount / 2) : amount;
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
    const radius = kind === 'wave' || kind === 'grand' ? 1 : 2;
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
    const targets = live().filter(enemy => Math.abs(enemy.slot - slot) <= radius && enemy.ward === 0
      && (kind !== 'grand' || enemy.slot !== slot)
      && (devastation && enemy === center || !warded.has(enemy.id)));
    const name = kind === 'wave' ? WORDS.blast.label : WORDS[kind].label;
    const bonus = devastation ? devastationUpgradeBonus : blastUpgradeBonus;
    const ratio = devastation ? ((secondaryDevastationBlastPct || 50) / 100) : blastSplashFactor;
    blast(center.id, targets, elements[0] ?? spell.form, enemy => {
      hit(enemy, strength * ratio + bonus, pierce, elements);
      if (!devastation && secondaryBlastArmorShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, secondaryBlastArmorShred);
      if (devastation && secondaryDevastationArmorShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, secondaryDevastationArmorShred);
    }, { originSlot: slot, devastation, grand: Boolean(spell.grand), large: Boolean(spell.large), elements: [...new Set(elements)] });
    summary.sequence.push(`${name} · ${targets.length} เป้าหมาย`);
  }

  function applyIncomingToPlayer(rawAmount, triggerShieldEffects = true, attacker = null) {
    let remaining = rawAmount;
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
    const absorbed = rawAmount - remaining;
    const actual = Math.min(remaining, player.hp);
    player.hp -= actual;
    summary.blocked += absorbed;
    summary.incoming += actual;
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
      return sum + WORDS[id].damage + elemUpgrade + blessingBonus + relicBonus;
    }, 0) / elements.length : (spell.shellDamage ?? WORDS[spell.form].damage);
    let strength = (base + formUpgradeBonus + auxUpgradeBonus) * spell.multiplier * targetScale;
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
    const isDualFusion = elements.length > 1 || elements.some(id => Boolean(FUSED_ELEMENTS[id]));
    if (hasCrownOfEternity && isDualFusion) {
      strength = Math.round(strength * 1.5);
    }
    const pierce = (spell.pierce ?? 0)
      + pierceUpgradeBonus
      + elementBuffPierce
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
    if (elements.includes('magma')) leaveMagma(slot);
    const gust = elements.some(id => ['wind', 'vayu', 'thunderstorm', 'dust', 'heatwave', 'chillgale'].includes(id));
    if (gust) {
      const zapOpts = elements.includes('thunderstorm') ? { zapStrength: strength, zapPierce: pierce } : {};
      pushEnemy(enemy, 1, pushCardEmpowers ? { fromPushCard: true, steps: 2, ...zapOpts } : zapOpts);
    }
    if (elements.includes('monsoon')) {
      for (const target of live()) {
        if (target.id !== enemy.id || !pushCardEmpowers) pushEnemy(target, 1, { sourceElement: 'monsoon' });
      }
    }
    if (elements.includes('magnet')) pullNeighborsToward(enemy);
    const conduitBonus = hasThunderConduit ? 6 : 0;
    const hasLightningElem = elements.some(id => getElementComponents(id).includes('lightning'));
    if (elements.includes('frostvolt')) chainLightning(enemy, strength, pierce, sweep, 'frostvolt', spell.form, conduitBonus);
    else if (elements.includes('thunderstorm')) chainLightning(enemy, strength, pierce, sweep, 'thunderstorm', spell.form, conduitBonus);
    else if (elements.includes('asani')) chainLightning(enemy, strength, pierce, sweep, 'asani', spell.form, conduitBonus);
    else if (hasThunderConduit && hasLightningElem) chainLightning(enemy, 0, pierce, sweep, 'lightning', spell.form, 6);
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
        const reflected = applyIncomingToPlayer(reflectAmt, false);
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
        const reflected = applyIncomingToPlayer(reflectAmt, false);
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
      const plannedAction = intent(enemy, turn, enemies, state.room);
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
        hit(target, Math.ceil(strength * shellRatio) + blastUpgradeBonus, pierce, elements);
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
        hit(target, (target === enemy ? 5 : 3) + blastUpgradeBonus, pierce, elements);
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
      const thorns = applyIncomingToPlayer(2, false);
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
      const staticHit = applyIncomingToPlayer(3, false);
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
    if (enemy.kind === 'thunder_drake_emperor' && enemy.hp > 0 && enemy.armor > 0
      && !(enemy.groundedUntil >= turn) && !groundedCast && !spell.pierce) {
      const starStatic = applyIncomingToPlayer(4, false);
      events.push({
        type: 'storm-static',
        source: enemy.id,
        sourceKind: enemy.kind,
        specialBoss: true,
        amount: starStatic.actual,
        absorbed: starStatic.absorbed,
        rawAttack: 4,
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

  if (guard) {
    events.push({ type: 'shield', amount: block, shieldKind: 'guard', protection: protection() });
  } else if (fizzled) {
    const expression = rawIds.map(id => WORDS[id].label).join(' ');
    events.push({ type: 'fizzle', ids: rawIds, cost, expression });
    summary.sequence.push(`คาถาล้มเหลว (${expression}) · เสีย ${cost} มานาฟรีโดยไม่มีผล`);
  } else if (BATTLE_LIMITED_WORDS.includes(spell.form)) {
    state.legendaryTurns ??= {};
    state.legendaryTurns[spell.form] = turn;
    player.hand = player.hand.filter(id => id !== spell.form);
    events.push({ type: spell.form });
    if (timeStopped) {
      summary.timeStopped = true;
      summary.sequence.push('หยุดเวลา · ข้ามรอบศัตรูทุกตัว');
      const recovery = unlockedSecondaryEffects.find(eff => eff.id === 'timestop_recovery')?.timestopHeal ?? 0;
      if (recovery > 0 && player.hp < player.maxHp) heal(recovery);
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
      const bossDmg = Math.round((100 + (upgrades.death ?? 0) * 25) * secondaryDeathBossMult);
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
    const bhPower = Math.round(300 * mult) + bhLv * 15;
    const slamDamage = Math.round(100 * mult) + bhLv * 5;
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
      const devTargets = live().filter(enemy => Math.abs(enemy.slot - lastImpact.slot) <= 2);
      if (devTargets.length) {
        blast(lastImpact.id, devTargets, 'meteor', enemy => {
          const devRatio = (secondaryDevastationBlastPct || 50) / 50;
          damage(enemy, Math.round(14 * mult * devRatio) + devastationUpgradeBonus, 'meteor', pierceUpgradeBonus, 'meteor');
          if (secondaryDevastationArmorShred > 0 && enemy.hp > 0) applyEarthArmorShred(enemy, secondaryDevastationArmorShred);
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
    heal(rawHeal + riftHealBonus);
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
      heal(rawHeal + riftHealBonus);
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
        const nearby = live().filter(enemy => Math.abs(enemy.slot - slot) <= radius);
        const targets = nearby.filter(enemy => enemy.ward === 0);
        const wardedTargets = nearby.filter(enemy => enemy.ward > 0).map(enemy => enemy.id);
        const powerAt = enemy => (strength + blastUpgradeBonus) * (enemy.slot === slot ? 1 : blastSplashFactor);
        const hits = targets.map(enemy => ({ enemy, slot: enemy.slot, power: powerAt(enemy) }));
        blast(center.id, targets, element, enemy => {
          hit(enemy, powerAt(enemy), pierce, elements);
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
        const nearby = live().filter(enemy => Math.abs(enemy.slot - slot) <= radius);
        const targets = nearby.filter(enemy => enemy.ward === 0);
        const wardedTargets = nearby.filter(enemy => enemy.ward > 0).map(enemy => enemy.id);
        const powerAt = enemy => (strength + blastUpgradeBonus) * scale * (enemy.slot === slot ? 1 : blastSplashFactor);
        const hits = targets.map(enemy => ({ enemy, slot: enemy.slot, power: powerAt(enemy) }));
        blast(center.id, targets, element, enemy => {
          hit(enemy, powerAt(enemy), pierce, elements);
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
        const roundScale = (spell.barrage && secondaryBarrageFinaleDouble && round === sweeps.length - 1) ? 1.2 : 0.6;
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
        const finaleMult = (spell.barrage && secondaryBarrageFinaleDouble && round === stormRounds - 1) ? 2 : 1;
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
        const secondCenter = impact(center, spell.elements, secondSweep, 0.6);
        if (secondCenter) stormHitSet.add(center.id);
        if (secondCenter && lateGrand) {
          secondGrandTrigger = {
            trigger: { ...secondCenter, center, slot: center.slot, elements: spell.elements },
            warded: secondWarded,
          };
        }
        for (const enemy of neighbors) {
          if (impact(enemy, spell.elements, secondSweep, stormSideScale * 0.6)) stormHitSet.add(enemy.id);
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
      const spearBackFactor = (secondarySpearBackPct || 50) / 100;
      const totalShots = spell.shots ?? 1;
      for (let shotIndex = 0; shotIndex < totalShots; shotIndex++) {
        if (player.hp <= 0) break;
        const intended = enemyById(shotIndex === 0 ? targetId : (shotIndex === 1 && totalShots === 2 ? secondTargetId : targetId));
        const currentTarget = intended && intended.hp > 0
          ? intended
          : live().sort((a, b) => a.hp - b.hp || Math.abs(a.slot - (intended?.slot ?? 0)) - Math.abs(b.slot - (intended?.slot ?? 0)) || a.slot - b.slot)[0];
        if (!currentTarget) break;
        const shotElements = shotIndex === 1 && spell.secondElement ? [spell.secondElement] : spell.elements;
        const finaleScale = (spell.barrage && secondaryBarrageFinaleDouble && shotIndex === totalShots - 1) ? 2 : 1;
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
        const finaleScale = (spell.barrage && secondaryBarrageFinaleDouble && shotIndex === totalShots - 1) ? 2 : 1;
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
  const magmaEruptDmg = 6 + magmaLv * 2;
  const magmaEruptShred = 2 + (magmaSec?.magmaShredExtra ?? 0);
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
  if (player.hp > 0) {
    checkNetherPhase2(state, summary, events);
    checkEternityPhase2(state, summary, events);
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
  summary.enemyActions = timeStopped
    ? Object.fromEntries(live().map(enemy => [enemy.id, { type: 'timestop', amount: 0, label: 'หยุดเวลา' }]))
    : {};
  for (const enemy of timeStopped ? [] : live()) {
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
      if (player.hp > 0) checkEternityPhase2(state, summary, events);
    }
    const action = intent(enemy, turn, enemies, state.room);
    summary.enemyActions[enemy.id] = action;
    if (action.type === 'attack') {
      enemy.chill = enemy.lastingChill ? 4 : 0;
      delete enemy.lastingChill;
      delete enemy.obscured;
      const { actual, absorbed, effects, explosions } = applyIncomingToPlayer(action.amount, true, enemy);
      const attackerBase = ENEMIES[enemy.kind];
      const isBossAttacker = Boolean(attackerBase?.isBoss || isBossRoom(state));
      const isSpecialBoss = ['ember_overlord', 'tempest_archon', 'volcano_colossus', 'thunder_drake_emperor', 'abyssal_kraken', 'nether_dread_lord', 'eternity_overlord', 'eternity_reborn'].includes(enemy.kind);
      const isUltimateSkill = Boolean(isSpecialBoss && turn % 4 === 0);
      const isHeavyAttack = Boolean(
        action.amount >= 6 ||
        (isBossAttacker && (
          action.amount >= 5 ||
          ['sentinel', 'storm_titan', 'ember_overlord', 'astral_sentinel', 'thunder_colossus', 'tempest_archon', 'kraken_crush_tentacle', 'abyssal_kraken', 'nether_doom_pillar', 'nether_dread_lord', 'eternity_overlord', 'eternity_reborn'].includes(enemy.kind) ||
          (['boss', 'arch_codex', 'elder_grimoire', 'nexus_codex'].includes(enemy.kind) && turn % 3 === 2) ||
          (['mirror_mage', 'eclipse_mage'].includes(enemy.kind) && turn % 3 !== 1)
        ))
      );
      let manaDrained = 0;
      if (action.manaDrain && player.hp > 0) {
        manaDrained = Math.min(player.mana, action.manaDrain);
        if (manaDrained > 0) {
          player.mana -= manaDrained;
          summary.manaDrained = (summary.manaDrained ?? 0) + manaDrained;
          summary.sequence.push(
            enemy.kind === 'eternity_reborn'
              ? `🌌 มหาเทพอนันตกาลกัดกร่อนมานา −${manaDrained} MP`
              : `หนวดหมึกดำสูบมานา −${manaDrained} MP`,
          );
        }
      }
      events.push({
        type: 'attack',
        source: enemy.id,
        sourceKind: enemy.kind,
        amount: actual,
        absorbed,
        rawAttack: action.amount,
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
          summary.sequence.push(`มหาคราเค่นดูดกลืนกระแสน้ำฟื้น +${regen} HP`);
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
          summary.sequence.push('ติดสถานะชำระมลทิน · จอมอสูรนรกานต์สูบวิญญาณไม่สำเร็จ!');
        } else {
          const drained = enemyHealing(enemy, action.soulDrain);
          if (drained > 0) {
            enemy.hp += drained;
            events.push({ type: 'heal', source: enemy.id, target: enemy.id, amount: drained, isSoulDrain: true });
            summary.sequence.push(`💀 จอมอสูรนรกานต์สูบวิญญาณฟื้น +${drained} HP`);
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
    } else if (action.type === 'frozen') {
      enemy.freeze--;
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
      const isSpecialBoss = ['ember_overlord', 'tempest_archon', 'volcano_colossus', 'thunder_drake_emperor', 'abyssal_kraken', 'nether_dread_lord', 'eternity_overlord', 'eternity_reborn'].includes(enemy.kind);
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
    checkEternityPhase2(state, summary, events);
  }
  for (const enemy of live()) {
    const amount = newBurn.get(enemy.id);
    if (amount) { enemy.burn += amount; enemy.burnTurn = turn + 1; }
    if (newLingeringBurn.has(enemy.id)) enemy.lingeringBurn = true;
  }
  for (const enemy of enemies) {
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
  if (player.shield?.expires <= turn || player.shield?.layerDetails) {
    player.shield = makeShield(shieldLayers(player.shield).filter(layer => layer.expires > turn));
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
    delete state.blackhole;
    delete state.deathSpent;
    delete state.legendaryTurns;
    delete state.krakenPhase;
    delete state.netherPhase;
    delete state.eternityPhase;
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
      + ((spell?.form === 'heal' || (spell?.form === 'shield' && spell?.healing) || (spell?.form === 'fill' && spell?.resource === 'blood')) ? secondaryNextTurnHealBonus : 0);
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
    drawCards(state);
    player.mana = Math.min(getMaxMana(player), player.mana + getTurnManaRegen(state.room));
    if (timeStopped) {
      const amount = Math.min(getMaxMana(player) - player.mana, upgrades.timestop ?? 0);
      if (amount) {
        player.mana += amount;
        events.push({ type: 'mana-refund', amount });
        summary.sequence.push(`มานาจากหยุดเวลา +${amount}`);
      }
    } else prepareEnemies(state);
  }
  summary.hp = player.hp;
  summary.nextMana = player.mana;
  summary.phase = state.phase;
  summary.nextRoom = state.room;
  summary.shield = player.shield?.layers.reduce((sum, value) => sum + value, 0) ?? 0;
  return { ok: true, state, events, summary };
}
