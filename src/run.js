import { makeShield, shieldLayers } from './shields.js';
import { WORDS, START_WORDS, ELEMENTS, ATTACK_FORMS, SECOND_TIER_ELEMENTS, CREATURE_WORDS, CREATURE_STATS, lightDamagePenalty, ascensionCost } from './words.js';
import { RIFT_ENEMIES, RIFT_TOWER, SPACED_FLOORS } from './upper-tower.js';
import { MIDDLE_BATTLES, MIDDLE_ENEMIES } from './middle-tower.js';
import {
  ENDGAME_ENEMIES,
  ENDGAME_RELICS,
  ENDGAME_SHOP_ITEMS,
  ENDGAME_SPACED_FLOORS,
  KRAKEN_TENTACLE_KINDS,
  NETHER_PILLAR_KINDS,
  ETERNITY_SHIFT_AFFINITIES,
  ETERNITY_PHASE_HP,
  buildEndgameTowerRooms,
} from './endgame-tower.js';
export { KRAKEN_TENTACLE_KINDS, NETHER_PILLAR_KINDS, ETERNITY_SHIFT_AFFINITIES, ETERNITY_PHASE_HP };

export function getEternityShiftAffinity(turn) {
  return ETERNITY_SHIFT_AFFINITIES[turn % 4];
}

export const ENEMIES = Object.freeze({
  striker: { name: 'อิมพ์หมึก', hp: 16, armor: 0, ward: 0, attack: 3, color: '#ba7862', exp: 10, gold: 8, isBoss: false },
  warden: { name: 'ผู้ถือม่าน', hp: 16, armor: 0, ward: 1, attack: 3, color: '#9d8ad1', exp: 12, gold: 10, isBoss: false },
  armored: { name: 'อัศวินหม้อเหล็ก', hp: 17, armor: 3, ward: 0, attack: 3, color: '#9aaca5', exp: 14, gold: 11, isBoss: false },
  swarm: { name: 'หยดหมึก', hp: 5, armor: 0, ward: 0, attack: 2, color: '#a8c784', exp: 6, gold: 5, isBoss: false },
  charger: { name: 'โกเลมไส้ตะเกียง', hp: 17, armor: 0, ward: 0, attack: 7, color: '#d1a45e', exp: 15, gold: 12, isBoss: false },
  support: { name: 'บรรณารักษ์เชื้อรา', hp: 11, armor: 0, ward: 0, attack: 3, color: '#83b5ad', exp: 11, gold: 9, isBoss: false },
  elite: { name: 'ผู้เฝ้าชั้นหนึ่ง', hp: 29, armor: 0, ward: 1, attack: 4, color: '#b6a0cf', exp: 30, gold: 25, isBoss: true },
  sentinel: { name: 'ผู้พิทักษ์หอเหล็ก', hp: 34, armor: 2, ward: 0, attack: 7, color: '#c39570', exp: 40, gold: 35, isBoss: true },
  boss: { name: 'ตำราต้องห้าม', hp: 43, armor: 0, ward: 0, attack: 4, color: '#dab87a', exp: 55, gold: 45, isBoss: true },
  ember_imp: { name: 'อิมพ์เพลิง', hp: 22, armor: 0, ward: 0, attack: 5, color: '#e29d83', exp: 18, gold: 15, isBoss: false, affinity: 'fire' },
  iron_warden: { name: 'ผู้พิทักษ์ม่านเหล็ก', hp: 24, armor: 2, ward: 1, attack: 4, color: '#907ba6', exp: 22, gold: 18, isBoss: false, affinity: 'earth' },
  rune_golem: { name: 'โกเลมรูน', hp: 30, armor: 2, ward: 0, attack: 9, color: '#e4b659', exp: 26, gold: 21, isBoss: false, affinity: 'earth' },
  mirror_mage: { name: 'จอมเวทกระจกเงา', hp: 58, armor: 1, ward: 1, attack: 6, color: '#bca5d2', exp: 68, gold: 58, isBoss: true, affinity: 'ice' },
  frost_lich: { name: 'ลิชเหมันต์', hp: 64, armor: 2, ward: 1, attack: 5, color: '#8bb7a0', exp: 78, gold: 66, isBoss: true, affinity: 'ice' },
  storm_titan: { name: 'ไททันอัสนี', hp: 76, armor: 3, ward: 0, attack: 11, color: '#f5db87', exp: 92, gold: 78, isBoss: true, affinity: 'lightning' },
  arch_codex: { name: 'อาร์คโคเด็กซ์ต้องห้าม', hp: 92, armor: 2, ward: 1, attack: 6, color: '#f5db87', exp: 115, gold: 95, isBoss: true },
  ember_overlord: { name: 'จ้าวอัคคีบรรพกาล', hp: 135, armor: 3, ward: 1, attack: 8, color: '#ffad42', exp: 180, gold: 150, isBoss: true, affinity: 'fire' },
  void_imp: { name: 'กบอัคนี', hp: 34, armor: 1, ward: 0, attack: 7, color: '#e27b46', exp: 32, gold: 26, isBoss: false, affinity: 'fire' },
  aether_warden: { name: 'ผู้คุมม่านอาคม', hp: 38, armor: 2, ward: 1, attack: 6, color: '#907ba6', exp: 36, gold: 30, isBoss: false, affinity: 'wind', swapTurn: 2 },
  obsidian_golem: { name: 'หมูป่าหินผา', hp: 46, armor: 3, ward: 0, attack: 12, color: '#718063', exp: 42, gold: 35, isBoss: false, affinity: 'earth' },
  chrono_sage: { name: 'นักปราชญ์กาลเวลา', hp: 30, armor: 1, ward: 1, attack: 6, color: '#83b5ad', exp: 38, gold: 32, isBoss: false },
  prism_watcher: { name: 'ผู้เฝ้าปริซึมชั้นสูง', hp: 105, armor: 2, ward: 1, attack: 8, color: '#b6a0cf', exp: 125, gold: 105, isBoss: true, affinity: 'water' },
  astral_sentinel: { name: 'ผู้พิทักษ์หอดารา', hp: 118, armor: 4, ward: 0, attack: 14, color: '#e4b659', exp: 140, gold: 115, isBoss: true, affinity: 'lightning' },
  elder_grimoire: { name: 'คัมภีร์ปฐมกาลต้องห้าม', hp: 132, armor: 2, ward: 1, attack: 8, color: '#dab87a', exp: 165, gold: 135, isBoss: true, affinity: 'earth' },
  eclipse_mage: { name: 'จอมเวทจันทรคราส', hp: 148, armor: 2, ward: 1, attack: 9, color: '#bca5d2', exp: 185, gold: 150, isBoss: true },
  glacial_sovereign: { name: 'ราชันเหมันตนิรันดร์', hp: 162, armor: 3, ward: 1, attack: 9, color: '#8bb7a0', exp: 205, gold: 165, isBoss: true, affinity: 'ice' },
  thunder_colossus: { name: 'ยักษ์อัสนีบรรพกาล', hp: 178, armor: 4, ward: 0, attack: 16, color: '#f5db87', exp: 225, gold: 185, isBoss: true, affinity: 'lightning' },
  nexus_codex: { name: 'เน็กซัสโคเด็กซ์ต้องห้าม', hp: 196, armor: 3, ward: 1, attack: 10, color: '#f5db87', exp: 250, gold: 210, isBoss: true },
  tempest_archon: { name: 'จ้าวพายุอสุนีบาต', hp: 255, armor: 4, ward: 1, attack: 11, color: '#ffe53b', exp: 360, gold: 300, isBoss: true, affinity: 'lightning' },
  ward_scribe: { name: 'อาลักษณ์ทอม่าน', hp: 32, armor: 1, ward: 0, attack: 5, color: '#bc8ae8', exp: 44, gold: 37, sprite: 'chrono_sage' },
  ward_keeper: { name: 'ด้วงเกราะเพลิง', hp: 44, armor: 2, ward: 0, attack: 7, color: '#e27b46', exp: 55, gold: 43, affinity: 'fire' },
  rune_ram: { name: 'แพะผาศิลา', hp: 52, armor: 2, ward: 0, attack: 6, color: '#c49a6c', exp: 64, gold: 50, affinity: 'earth' },
  seal_curator: { name: 'พยัคฆ์เพลิงบรรพกาล', hp: 175, armor: 2, ward: 2, attack: 11, color: '#ff903b', exp: 200, gold: 165, isBoss: true, affinity: 'fire' },
  crown_archivist: { name: 'เจ้าแห่งหอจารึก', hp: 235, armor: 3, ward: 2, attack: 13, color: '#ffd18e', exp: 260, gold: 215, isBoss: true },
  ...RIFT_ENEMIES,
  ...MIDDLE_ENEMIES,
  ...ENDGAME_ENEMIES,
});

export const REVISIT_REWARD_RATE = 0.2;
export const MAX_BELT_ITEMS = 3;
export const MAX_STASH_ITEMS = 12;
export const MAX_RELIC_SLOTS = 3;
export const MAX_CARD_UPGRADE = 10;
export const CARD_SECONDARY_UNLOCK_LEVEL = 7;
export const CARD_SECONDARY_MILESTONES = Object.freeze([7, 9, 10]);
export const CARD_UPGRADE_COSTS = Object.freeze([10, 14, 18, 28, 34, 41, 49, 59, 70, 84]);
export const CARD_UPGRADE_SUCCESS_RATES = Object.freeze([100, 100, 90, 70, 60, 50, 40, 30, 22, 15]);
export const SMITHING_STONE_BONUS_RATE = 15;
export const CARD_SECONDARY_GOLD_COST = 15;

export const CARD_RARITY_COST_MULTIPLIER = Object.freeze({
  common: 1.0,
  rare: 1.3,
  special: 1.6,
  epic: 2.0,
  legendary: 2.5,
});

export const CARD_RARITY_RATE_PENALTY = Object.freeze({
  common: 0,
  rare: 2,
  special: 4,
  epic: 6,
  legendary: 8,
});

export const SHOP_ITEMS = Object.freeze({
  mana_vial: {
    id: 'mana_vial',
    name: 'ขวดมานาสกัด',
    icon: '🧪',
    cost: 18,
    oneTime: false,
    manaRestore: 4,
    badge: '+4 MP ทันที',
    description: 'ฟื้นมานาสูงสุด 4 ใช้ในกระเป๋าหรือการต่อสู้โดยไม่เสียเทิร์น',
  },
  healing_draught: {
    id: 'healing_draught',
    name: 'น้ำยาสมานแผล',
    icon: '❤️',
    cost: 16,
    oneTime: false,
    hpRestore: 12,
    badge: '+12 HP ทันที',
    description: 'ฟื้นฟูพลังชีวิต +12 HP ทันทีระหว่างการต่อสู้ หรือกดใช้ในคลังไอเทม',
  },
  redraw_dust: {
    id: 'redraw_dust',
    name: 'ผงเปลี่ยนชะตา',
    icon: '🔄',
    cost: 15,
    oneTime: false,
    badge: 'จั่วใหม่ 5 ใบ',
    description: 'ทิ้งการ์ดในมือทั้งหมดแล้วจั่วการ์ดชุดใหม่ 5 ใบทันที',
  },
  smithing_stone: {
    id: 'smithing_stone',
    name: 'หินตีบวกอักษร',
    icon: '⚒️',
    cost: 350,
    oneTime: false,
    vaultOnly: true,
    badge: 'เพิ่มโอกาสสำเร็จ +15%',
    description: 'เก็บไว้ในคลังไอเทม นำไปใช้ที่แท่นตีบวกเพื่อเพิ่มโอกาสสำเร็จ 15 จุดเปอร์เซ็นต์ (ยังคงต้องจ่ายทองค่าตีบวกพื้นฐาน)',
  },
  aegis_shard: {
    id: 'aegis_shard',
    name: 'ผลึกโล่ฉุกเฉิน',
    icon: '🛡',
    cost: 22,
    oneTime: true,
    badge: 'โล่เวท +6 · จำกัด 1 ชิ้น',
    description: 'กางโล่เวทฉุกเฉิน 6 หน่วย (1 ชั้น) ทันทีโดยไม่เสียมานา (จำกัดการซื้อ 1 ครั้ง)',
  },
  ember_scroll: {
    id: 'ember_scroll',
    name: 'ม้วนเพลิงกวาดล้าง',
    icon: '🔥',
    cost: 26,
    oneTime: true,
    badge: 'ไฟกวาด 6 ดาเมจ · จำกัด 1 ชิ้น',
    description: 'ปล่อยคลื่นเพลิงเผาไหม้ศัตรูทุกตัว 6 ดาเมจทันทีโดยไม่เสียเทิร์น (จำกัดการซื้อ 1 ครั้ง)',
  },
  greater_healing: {
    id: 'greater_healing', name: 'น้ำยาสมานแผลเข้มข้น', icon: '💖', cost: 30, oneTime: false,
    hpRestore: 24, badge: '+24 HP ทันที',
    description: 'ฟื้น HP สูงสุด 24 ใช้ในกระเป๋าหรือการต่อสู้โดยไม่เสียเทิร์น',
  },
  greater_mana: {
    id: 'greater_mana', name: 'ขวดมานาเข้มข้น', icon: '🔷', cost: 32, oneTime: false,
    manaRestore: 8, badge: '+8 MP ทันที',
    description: 'ฟื้นมานาสูงสุด 8 ใช้ในกระเป๋าหรือการต่อสู้โดยไม่เสียเทิร์น',
  },
  balanced_tonic: {
    id: 'balanced_tonic', name: 'ยาเสริมกำลัง', icon: '🍵', cost: 24, oneTime: false,
    hpRestore: 8, manaRestore: 3, badge: '+8 HP · +3 MP',
    description: 'ฟื้น HP สูงสุด 8 และมานาสูงสุด 3 ใช้ในกระเป๋าหรือการต่อสู้โดยไม่เสียเทิร์น',
  },
  frost_dust: {
    id: 'frost_dust', name: 'ผงหมอกเย็น', icon: '❄️', cost: 24, oneTime: false,
    badge: 'ศัตรูทุกตัวหนาว 4',
    description: 'ลดแรงโจมตีครั้งถัดไปของศัตรูทุกตัว 4 หน่วย ใช้ผ่านม่านโดยไม่เสียเทิร์น',
  },
  veil_eraser: {
    id: 'veil_eraser', name: 'ผงสลายม่าน', icon: '✨', cost: 28, oneTime: false,
    badge: 'สลายม่านศัตรูทั้งหมด',
    description: 'ลบม่านที่มีอยู่ของศัตรูทุกตัวทันที โดยไม่สร้างดาเมจหรือเสียเทิร์น',
  },
  silence_scroll: {
    id: 'silence_scroll', name: 'ม้วนผนึกอาคม', icon: '📜', cost: 28, oneTime: false,
    badge: 'ผนึกท่าสนับสนุน',
    description: 'ผนึกศัตรูทุกตัวผ่านม่าน ให้ข้ามท่าสนับสนุนหรือสลับตำแหน่งครั้งถัดไป โดยไม่เสียเทิร์น',
  },
  draw_pages: {
    id: 'draw_pages', name: 'หน้าตำราเรียกคำ', icon: '📖', cost: 22, oneTime: false,
    badge: 'จั่วเพิ่มสูงสุด 2 ใบ',
    description: 'จั่วจากชุดคำที่พกเพิ่มสูงสุด 2 ใบโดยไม่เกิน 10 ใบในมือ ใช้ได้ในศึกโดยไม่เสียเทิร์น',
  },
  ...ENDGAME_SHOP_ITEMS,
});

export const BLESSING_CATALOG = Object.freeze({
  blessing_ember: {
    id: 'blessing_ember',
    name: 'พรอัคคีโชติช่วง',
    icon: '🔥',
    badge: 'ไฟแรงขึ้น +2 · เผาไหม้ +1',
    description: 'คาถาที่มีธาตุไฟสร้างความเสียหายเพิ่มขึ้น +2 และติดสถานะเผาไหม้แรงขึ้น +1',
  },
  blessing_frost: {
    id: 'blessing_frost',
    name: 'พรผลึกเหมันต์',
    icon: '❄️',
    badge: 'น้ำแข็ง +2 · โล่ต้นห้อง +4',
    description: 'คาถาธาตุน้ำแข็งแรงขึ้น +2 และเริ่มการต่อสู้ด้วยโล่น้ำแข็ง 4 หน่วย',
  },
  blessing_thunder: {
    id: 'blessing_thunder',
    name: 'พรอัสนีทะลวง',
    icon: '⚡',
    badge: 'สายฟ้า +2 · เจาะเกราะ +1',
    description: 'คาถาธาตุสายฟ้าแรงขึ้น +2 และคาถาโจมตีทุกชนิดเจาะเกราะศัตรูเพิ่มขึ้น +1',
  },
  blessing_aegis: {
    id: 'blessing_aegis',
    name: 'พรปราการโบราณ',
    icon: '🛡',
    badge: 'กางโล่ต้นห้อง +6 ทันที',
    description: 'เมื่อก้าวเข้าห้องต่อสู้ จะได้รับโล่เวทป้องกัน 6 หน่วย (1 ชั้น) ทันทีตั้งแต่เทิร์นแรก',
  },
  blessing_vitality: {
    id: 'blessing_vitality',
    name: 'พรตาน้ำแห่งชีวิต',
    icon: '💚',
    badge: 'ฟื้น +10 HP ทันที · Max HP +4',
    description: 'เพิ่ม Max HP +4 และฟื้นฟู HP +10 ทันที พร้อมทำให้คาถาฟื้นฟู/โล่แรงขึ้น +2',
  },
  blessing_fortune: {
    id: 'blessing_fortune',
    name: 'พรนักล่าสมบัติ',
    icon: '💰',
    badge: 'รับ +12 ทอง · ดรอปทอง/EXP +35%',
    description: 'รับทองทันที +12 ทอง และมอนสเตอร์ดรอปทองกับ EXP เพิ่มขึ้น +35%',
  },
});

export function getAvailableShopItems(state) {
  const purchased = state?.purchasedShopItems ?? [];
  const currentFloor = state?.room != null ? (getFloorInfo(state.room)?.floor ?? 1) : 1;
  return Object.values(SHOP_ITEMS).filter(item => {
    if (item.oneTime && purchased.includes(item.id)) return false;
    if (item.minFloor && currentFloor < item.minFloor) return false;
    return true;
  });
}

export function getCardUpgradeLevel(state, wordId) {
  return state?.player?.cardUpgrades?.[wordId] ?? 0;
}

export function hasCardSecondaryUpgrade(state, wordId) {
  const lv = getCardUpgradeLevel(state, wordId);
  return lv >= CARD_SECONDARY_UNLOCK_LEVEL || Boolean(state?.player?.cardSecondaryUpgrades?.[wordId]);
}

export const isAscensionActive = state => state?.phase === 'battle' && state.legendaryTurns?.ascension === state.turn - 1;
export const isBattleWordSpent = (state, id) => id === 'death' ? Boolean(state.deathSpent) : Object.hasOwn(state.legendaryTurns ?? {}, id);

export function battleSpellCost(state, parsed) {
  const { form, resource } = parsed.spell;
  if (isAscensionActive(state) || (form === 'fill' && resource === 'mana' && hasCardSecondaryUpgrade(state, 'mana'))) return 0;
  return form === 'ascension' ? ascensionCost(getCardUpgradeLevel(state, 'ascension')) : parsed.cost;
}

export function getCardUpgradeCost(currentLevel = 0, wordOrRarity = 'common') {
  const base = CARD_UPGRADE_COSTS[currentLevel] ?? 999;
  const raw = typeof wordOrRarity === 'object' && wordOrRarity !== null ? wordOrRarity.rarity : wordOrRarity;
  const rarity = typeof raw === 'string' && WORDS[raw]
    ? (WORDS[raw].rarity ?? 'common')
    : (typeof raw === 'string' && CARD_RARITY_COST_MULTIPLIER[raw] !== undefined ? raw : 'common');
  const mult = CARD_RARITY_COST_MULTIPLIER[rarity] ?? 1.0;
  return Math.round(base * mult);
}

const SMITHING_MATERIALS = [
  { id: 'godly_smithing_essence', bonus: 100 },
  { id: 'abyssal_smithing_core', bonus: 50 },
  { id: 'hyper_smithing_cluster', bonus: 40 },
  { id: 'superior_smithing_stone', bonus: 30 },
  { id: 'smithing_crystal', bonus: 20 },
  { id: 'smithing_stone', bonus: SMITHING_STONE_BONUS_RATE },
];

export function getCardUpgradeMaterial(player) {
  for (const material of SMITHING_MATERIALS) {
    for (const source of ['stash', 'items']) {
      const index = player[source]?.indexOf(material.id) ?? -1;
      if (index >= 0) return { ...material, source, index };
    }
  }
  return null;
}

export function getCardUpgradeSuccessRate(currentLevel = 0, useStone = false, bonus = SMITHING_STONE_BONUS_RATE, wordOrRarity = 'common') {
  const base = CARD_UPGRADE_SUCCESS_RATES[currentLevel] ?? 15;
  const raw = typeof wordOrRarity === 'object' && wordOrRarity !== null ? wordOrRarity.rarity : wordOrRarity;
  const rarity = typeof raw === 'string' && WORDS[raw]
    ? (WORDS[raw].rarity ?? 'common')
    : (typeof raw === 'string' && CARD_RARITY_RATE_PENALTY[raw] !== undefined ? raw : 'common');
  const penalty = currentLevel >= 5 ? (CARD_RARITY_RATE_PENALTY[rarity] ?? 0) : 0;
  const effectiveBase = Math.max(5, base - penalty);
  return Math.min(100, effectiveBase + (useStone ? bonus : 0));
}

export function getCardSecondaryTier(level = 0, unlockedFlag = false) {
  if (level >= 10) return 3;
  if (level >= 9) return 2;
  if (level >= CARD_SECONDARY_UNLOCK_LEVEL || unlockedFlag) return 1;
  return 0;
}

export function getCardSecondaryEffect(wordId, level = CARD_SECONDARY_UNLOCK_LEVEL) {
  const tier = level >= 10 ? 3 : level >= 9 ? 2 : 1;
  const idx = tier - 1;
  const bonusAmount = tier === 3 ? 4 : tier === 2 ? 3 : 2;
  const extraPierce = tier === 3 ? 1 : 0;
  const tierTag = tier === 3 ? 'ขั้นสูงสุด (+10)' : tier === 2 ? 'ขั้น 2 (+9)' : 'ขั้น 1 (+7)';
  const base = {
    tier,
    tierTag,
    unlockLevel: CARD_SECONDARY_UNLOCK_LEVEL,
    shieldBonus: 0,
    healBonus: 0,
    pierceBonus: 0,
  };

  if (wordId === 'axe') {
    return {
      ...base,
      id: 'axe_sunder',
      badge: `ขวานทุบเกราะ −${tier}`,
      label: `จามเกราะแตก ${tier} หน่วย`,
      description: `ขวานที่จามโดนเป้าลดเกราะถาวร ${tier} หน่วย · ปลดที่ +7 และแรงขึ้นที่ +9/+10`,
      axeArmorShred: tier,
    };
  }
  if (wordId === 'timestop') {
    const heal = tier * 2;
    return {
      ...base,
      id: 'timestop_recovery',
      badge: `ฟื้น ${heal} HP`,
      label: `พักกาลเวลา · ฟื้น ${heal} HP`,
      description: `ฟื้น ${heal} HP เมื่อหยุดเวลาสำเร็จ · ปลดที่ +7 และแรงขึ้นที่ +9/+10`,
      timestopHeal: heal,
    };
  }
  if (wordId === 'ascension') {
    const shield = [3, 5, 8][idx];
    return {
      ...base,
      id: 'ascension_aegis',
      badge: `เทิร์นจุติ โล่ +${shield}`,
      label: `โล่จุติ ${shield} หน่วย`,
      description: `กางโล่ ${shield} หน่วยต้นเทิร์นจุติ · ปลดที่ +7 และแรงขึ้นที่ +9/+10`,
      ascensionShield: shield,
    };
  }
  if (wordId === 'light') {
    return {
      ...base,
      id: 'light_focus',
      badge: `↠ เจาะเกราะ +${tier}`,
      label: `เวทเบาเจาะเกราะเพิ่ม ${tier} หน่วย`,
      description: `ปลดล็อกที่ +7 และแรงขึ้นที่ +9/+10 · เวทที่ลงท้ายด้วย “เบา” ข้ามเกราะเพิ่ม ${tier} หน่วย`,
      pierceBonus: tier,
    };
  }
  if (wordId === 'delay') {
    const heal = tier * 2;
    return {
      ...base,
      id: 'delayed_mend',
      badge: `⌛ เทิร์นหน้า +${heal} HP`,
      label: `หน่วงโล่ฟื้นกาย +${heal} HP`,
      description: `ปลดล็อกที่ +7 และแรงขึ้นที่ +9/+10 · ฟื้น ${heal} HP ตอนโล่จาก “หน่วง” กางต้นเทิร์นหน้า`,
      delayedHeal: heal,
    };
  }

  // === Batch 1: Tailored Common (ธรรมดา) Cards ===
  if (wordId === 'shot') {
    const pierce = [1, 2, 3][idx];
    const dmgPct = [0, 0, 15][idx];
    return {
      ...base,
      id: 'shot_precision',
      badge: `↠ เจาะ +${pierce}${dmgPct ? ` · แรง +${dmgPct}%` : ''}`,
      label: `กระสุนทะลุเกราะ +${pierce}${dmgPct ? ` & แรง +${dmgPct}%` : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): คาถาที่มีคำว่าลูกเจาะเกราะเพิ่ม +${pierce}${dmgPct ? ` และเพิ่มดาเมจกระสุน +${dmgPct}%` : ''}`,
      pierceBonus: pierce,
      damagePctBonus: dmgPct,
    };
  }
  if (wordId === 'fire') {
    const burn = [2, 3, 5][idx];
    return {
      ...base,
      id: 'fire_ignite',
      badge: `♨ เผา +${burn}`,
      label: `เปลวเพลิงลุกไหม้ +${burn}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อโจมตีด้วยไฟจะติดเผาไหม้ +${burn} หน่วยทันที`,
      burnBonus: burn,
    };
  }
  if (wordId === 'ice') {
    const chill = [2, 4, 6][idx];
    const lasting = tier === 3;
    return {
      ...base,
      id: 'ice_frostbite',
      badge: `❄ หนาว +${chill}${lasting ? ' · 2 ครั้ง' : ''}`,
      label: `ไอเยือกแข็ง +${chill}${lasting ? ' (ค้าง 2 ครั้ง)' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): คาถาน้ำแข็งลดพลังโจมตีศัตรูเพิ่มอีก +${chill}${lasting ? ' และความหนาวส่งผลต่อการโจมตี 2 ครั้ง' : ''}`,
      chillBonus: chill,
      lastingChill: lasting,
    };
  }
  if (wordId === 'lightning') {
    const pierce = [2, 3, 4][idx];
    const wetMana = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'lightning_overcharge',
      badge: `ϟ เจาะ +${pierce}${wetMana ? ' · เปียก +1 MP' : ''}`,
      label: `สายฟ้าทะลวง +${pierce}${wetMana ? ' & คืน +1 MP เมื่อโดนเป้าเปียก' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): คาถาสายฟ้าเจาะเกราะเพิ่ม +${pierce}${wetMana ? ' และคืน +1 มานาเมื่อโจมตีศัตรูที่เปียก' : ''}`,
      pierceBonus: pierce,
      lightningWetMana: wetMana,
    };
  }
  if (wordId === 'earth') {
    const shield = [4, 6, 8][idx];
    const shred = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'earth_bastion',
      badge: `◆ เกราะ +${shield}${shred ? ' · ทุบเกราะ +1' : ''}`,
      label: `ปราการปฐพี +${shield}${shred ? ' & ทุบเกราะถาวร +1' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อร่ายธาตุดินจะได้รับเกราะชั่วคราวเพิ่ม +${shield}${shred ? ' และทุบเกราะถาวรศัตรูเพิ่มอีก 1 หน่วย' : ''}`,
      shieldBonus: shield,
      earthArmorShredBonus: shred,
    };
  }
  if (wordId === 'water') {
    const heal = [3, 5, 8][idx];
    const splashWet = tier === 3;
    return {
      ...base,
      id: 'water_spring',
      badge: `≈ ฮีล +${heal}${splashWet ? ' · เปียกข้างเคียง' : ''}`,
      label: `สายน้ำชุบชีวิต +${heal} HP${splashWet ? ' & ช่องข้างเปียก' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อร่ายธาตุน้ำจะฟื้นพลังชีวิตเพิ่ม +${heal} HP${splashWet ? ' และทำให้ศัตรูช่องข้างเคียงเปียกด้วย' : ''}`,
      healBonus: heal,
      waterSplashWet: splashWet,
    };
  }
  if (wordId === 'wind') {
    const slam = [3, 5, 8][idx];
    const extraSteps = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'wind_gale_impact',
      badge: `≋ ชน +${slam}${extraSteps ? ' · ผลัก 2 ช่อง' : ''}`,
      label: `ลมกระแทก +${slam}${extraSteps ? ' & ผลักไกล 2 ช่อง' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เพิ่มดาเมจชนกระแทกของธาตุลมอีก +${slam} (ทั้งสองตัวเมื่อชนศัตรู)${extraSteps ? ' และผลักไกลขึ้นเป็น 2 ช่อง' : ''}`,
      windSlamBonus: slam,
      windExtraSteps: extraSteps,
    };
  }
  if (wordId === 'pair') {
    const pct = [10, 15, 20][idx];
    const selfBonus = [3, 5, 8][idx];
    const manaRefund = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'pair_resonance',
      badge: `Ⅱ พลังคู่ +${pct}%${manaRefund ? ' · +1 MP' : ''}`,
      label: `พ้องเสียงคู่ +${pct}% / ป้องกัน +${selfBonus}${manaRefund ? ' & คืน +1 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): คาถาที่มีคำว่าคู่แรงขึ้น +${pct}% (หรือเพิ่มโล่/ฮีล +${selfBonus})${manaRefund ? ' และคืน +1 มานาหลังร่ายสำเร็จ' : ''}`,
      pairPowerPct: pct,
      pairSelfBonus: selfBonus,
      manaRefund,
    };
  }
  if (wordId === 'shield') {
    const heal = [3, 5, 8][idx];
    const healPct = [2, 3, 5][idx];
    const renewal = tier === 3 ? 4 : 0;
    return {
      ...base,
      id: 'shield_aegis_mend',
      badge: `✚ ฮีล +${heal} (+${healPct}%)${renewal ? ' · เติมโล่ +4' : ''}`,
      label: `โล่ฟื้นกาย +${heal} HP (+${healPct}% Max HP)${renewal ? ' & เติมโล่เทิร์นหน้า +4' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อกางโล่จะฟื้นฟู +${heal} HP (+${healPct}% Max HP)${renewal ? ' และเติมโล่ต้นเทิร์นถัดไปอีก +4 หากโล่ยังไม่แตก' : ''}`,
      healBonus: heal,
      healMaxHpPct: healPct,
      shieldRenewalBonus: renewal,
    };
  }
  if (wordId === 'self') {
    const shield = [5, 8, 12][idx];
    const manaRefund = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'self_sanctuary',
      badge: `🛡 เกราะ +${shield}${manaRefund ? ' · +1 MP' : ''}`,
      label: `เกราะคุ้มตน +${shield}${manaRefund ? ' & คืน +1 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อร่ายคาถาใส่ตัวเองจะได้รับเกราะป้องกันชั่วคราว +${shield}${manaRefund ? ' และคืน +1 มานาทันที' : ''}`,
      shieldBonus: shield,
      manaRefund,
    };
  }

  // === Batch 2: Tailored Rare (หายาก 8 ใบ) + Special 2 ใบแรก (akki, heman) ===
  if (wordId === 'blast') {
    const pierce = [2, 3, 4][idx];
    const splashPct = [60, 70, 75][idx];
    const shred = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'blast_shatter',
      badge: `✹ เจาะ +${pierce} · ข้าง ${splashPct}%${shred ? ' · ทุบเกราะ -1' : ''}`,
      label: `แรงระเบิดฉีกเกราะ เจาะ +${pierce} · ข้าง ${splashPct}%${shred ? ' & ทุบเกราะ -1' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): แรงระเบิดเจาะเกราะเพิ่ม +${pierce} และช่องข้างรับดาเมจเพิ่มเป็น ${splashPct}%${shred ? ' พร้อมทุบเกราะถาวรศัตรูทุกตัวที่โดนระเบิด -1' : ''}`,
      pierceBonus: pierce,
      blastSplashPct: splashPct,
      blastArmorShred: shred,
    };
  }
  if (wordId === 'beam') {
    const dmgPct = [10, 15, 20][idx];
    const wardBonus = [4, 7, 10][idx];
    const stripWard = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'beam_prism_piercer',
      badge: `━ แรง +${dmgPct}% · ทะลุม่าน +${wardBonus}${stripWard ? ' · ลบม่าน 1' : ''}`,
      label: `ลำแสงทะลวงม่าน +${dmgPct}% (โดนเป้ามีม่าน +${wardBonus})${stripWard ? ' & เฉือนม่าน -1' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ลำแสงแรงขึ้น +${dmgPct}% และหากเป้าหมายมีม่านอยู่จะได้ดาเมจเพิ่ม +${wardBonus}${stripWard ? ' พร้อมเฉือนม่านออก 1 ชั้นทันที' : ''}`,
      damagePctBonus: dmgPct,
      beamWardBonusDmg: wardBonus,
      beamStripWard: stripWard,
    };
  }
  if (wordId === 'wave') {
    const pierce = [1, 2, 2][idx];
    const dmgPct = [10, 15, 20][idx];
    const alwaysPct = tier === 3;
    const chill = tier === 3 ? 2 : 0;
    return {
      ...base,
      id: 'wave_sweeping_surge',
      badge: `≈ แรง +${dmgPct}% · เจาะ +${pierce}${chill ? ' · หนาว +2' : ''}`,
      label: `คลื่นซัดกวาด +${dmgPct}%${alwaysPct ? '' : ' (≥2 เป้า)'} · เจาะ +${pierce}${chill ? ' & ลดโจมตี -2' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): คลื่นเจาะเกราะเพิ่ม +${pierce} และแรงขึ้น +${dmgPct}%${alwaysPct ? ' ทุกกรณี พร้อมลดแรงโจมตีศัตรูทุกตัวที่โดน -2' : ' เมื่อมีศัตรูตั้งแต่ 2 ตัวขึ้นไป'}`,
      pierceBonus: pierce,
      waveDamagePct: dmgPct,
      waveAlwaysPct: alwaysPct,
      waveChillBonus: chill,
    };
  }
  if (wordId === 'heal') {
    const pct = [5, 8, 12][idx];
    const regen = [0, 5, 8][idx];
    const overhealCap = tier === 3 ? 15 : 0;
    return {
      ...base,
      id: 'heal_vital_bloom',
      badge: `✚ +${pct}% HP${regen ? ` · เทิร์นหน้า +${regen}` : ''}${overhealCap ? ' · ล้น→เกราะ' : ''}`,
      label: `พรฟื้นฟูต่อเนื่อง +${pct}% Max HP${regen ? ` · เทิร์นหน้า +${regen} HP` : ''}${overhealCap ? ' & ส่วนเกิน→เกราะ' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ฟื้นฟูเพิ่มทันที +${pct}% Max HP${regen ? ` และฟื้นต่อเนื่องต้นเทิร์นถัดไป +${regen} HP` : ''}${overhealCap ? ' พร้อมแปลงฮีลส่วนเกินเป็นเกราะชั่วคราว (สูงสุด 15)' : ''}`,
      healMaxHpPct: pct,
      nextTurnHealBonus: regen,
      overhealShieldCap: overhealCap,
    };
  }
  if (wordId === 'burn') {
    const extraBurn = [3, 5, 8][idx];
    const linger = tier === 3;
    return {
      ...base,
      id: 'burn_spreading_embers',
      badge: `♨ เผา +${extraBurn} · ลามข้างเคียง${linger ? ' · ไฟค้าง 50%' : ''}`,
      label: `เพลิงลุกลาม +${extraBurn} · ลามช่องข้าง 50%${linger ? ' & ไฟค้าง 50%' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เพิ่มแรงเผาไหม้อีก +${extraBurn} และลามเผาครึ่งหนึ่งใส่ศัตรูช่องติดกัน${linger ? ' พร้อมไฟค้างเหลือ 50% ในเทิร์นถัดไปหลังเผาระเบิด' : ''}`,
      burnCardBonus: extraBurn,
      burnSpreadHalf: true,
      lingeringBurn: linger,
    };
  }
  if (wordId === 'push') {
    const slam = [4, 7, 10][idx];
    const chill = [0, 2, 3][idx];
    const shred = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'push_concussive',
      badge: `› กระแทก +${slam}${chill ? ` · มึน -${chill}` : ''}${shred ? ' · ทุบเกราะ -1' : ''}`,
      label: `แรงกระแทกปลิดเกราะ +${slam}${chill ? ` · ชนกันลดโจมตี -${chill}` : ''}${shred ? ' & ทุบเกราะ -1' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เพิ่มดาเมจกระแทกชนศัตรูและชนขอบอีก +${slam} (ทะลุเกราะ)${chill ? ` และหากชนศัตรูจะลดแรงโจมตีทั้งสองตัว -${chill}` : ''}${shred ? ' พร้อมทุบเกราะถาวร -1 ทั้งสองตัว' : ''}`,
      pushSlamBonus: slam,
      pushCollideChill: chill,
      pushCollideArmorShred: shred,
    };
  }
  if (wordId === 'pull') {
    const shred = [1, 1, 2][idx];
    const slam = [3, 5, 8][idx];
    const chill = [0, 3, 4][idx];
    const extraSteps = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'pull_hook_expose',
      badge: `‹ ทุบเกราะ -${shred} · ชน +${slam}${extraSteps ? ' · ดึง 2 ช่อง' : ''}`,
      label: `กระชากทลายแนว ทุบเกราะ -${shred} · ชน +${slam}${chill ? ` · ลดโจมตี -${chill}` : ''}${extraSteps ? ' & ดึง 2 ช่อง' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เป้าที่ถูกดึงโดนทุบเกราะถาวร -${shred} และดาเมจกระชากชนเพิ่ม +${slam}${chill ? ` พร้อมลดแรงโจมตีเป้า -${chill}` : ''}${extraSteps ? ' และดึงไกลขึ้นเป็น 2 ช่อง' : ''}`,
      pullArmorShred: shred,
      pullSlamBonus: slam,
      pullChillBonus: chill,
      pullExtraSteps: extraSteps,
    };
  }
  if (wordId === 'large') {
    const dmgPct = [8, 12, 18][idx];
    const selfBonus = [4, 7, 10][idx];
    const manaRefund = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'large_amplified_scale',
      badge: `⬢ แรง +${dmgPct}% / ป้องกัน +${selfBonus}${manaRefund ? ' · +1 MP' : ''}`,
      label: `ขยายอาคม +${dmgPct}% / โล่-ฮีล +${selfBonus}${manaRefund ? ' & คืน +1 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): คาถาที่มีคำว่าใหญ่โจมตีแรงขึ้น +${dmgPct}% (หรือเพิ่มโล่/ฮีล +${selfBonus})${manaRefund ? ' และคืน +1 มานาหลังร่ายสำเร็จ' : ''}`,
      damagePctBonus: dmgPct,
      largeSelfBonus: selfBonus,
      manaRefund,
    };
  }
  if (wordId === 'akki') {
    const burn = [4, 7, 10][idx];
    const pierce = [0, 2, 3][idx];
    const execPct = tier === 3 ? 20 : 0;
    return {
      ...base,
      id: 'akki_searing_inferno',
      badge: `♨ เผา +${burn}${pierce ? ` · เจาะ +${pierce}` : ''}${execPct ? ' · ซ้ำ +20%' : ''}`,
      label: `เพลิงอัคคีผลาญชีวิต เผา +${burn} · ตัดฮีล 2 เทิร์น${pierce ? ` · เจาะ +${pierce}` : ''}${execPct ? ' & แรง +20% เป้าติดเผา/ตัดฮีล' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): อัคคีติดเผาไหม้ +${burn} และขยายเวลาตัดฮีลเป็น 2 เทิร์น${pierce ? ` พร้อมเจาะเกราะ +${pierce}` : ''}${execPct ? ' และแรงขึ้น +20% หากเป้าติดเผาหรือถูกตัดฮีลอยู่แล้ว' : ''}`,
      akkiBurnBonus: burn,
      akkiHealCutExtend: 1,
      pierceBonus: pierce,
      akkiExecutePct: execPct,
    };
  }
  if (wordId === 'heman') {
    const chill = [3, 5, 7][idx];
    const shield = [5, 8, 12][idx];
    const splashChill = [0, 3, 4][idx];
    const freezeChilled = tier === 3;
    return {
      ...base,
      id: 'heman_perpetual_winter',
      badge: `❄ หนาว +${chill} · เกราะ +${shield}${freezeChilled ? ' · แช่แข็งซ้ำ' : ''}`,
      label: `เยือกแข็งนิรันดร์ หนาว +${chill} · เกราะ +${shield}${splashChill ? ` · กระจายหนาว ${splashChill}` : ''}${freezeChilled ? ' & แช่แข็งเป้าหนาว' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เพิ่มหนาวอีก +${chill} และได้เกราะน้ำแข็ง +${shield}${splashChill ? ` พร้อมกระจายหนาว ${splashChill} ใส่ช่องข้างเคียง` : ''}${freezeChilled ? ' และแช่แข็งทันทีหากเป้าติดหนาวอยู่แล้ว' : ''}`,
      hemanChillBonus: chill,
      shieldBonus: shield,
      hemanSplashChill: splashChill,
      hemanFreezeChilled: freezeChilled,
    };
  }

  // === Batch 3: Tailored Remaining Special (พิเศษ 10 ใบที่เหลือ) ===
  if (wordId === 'asani') {
    const pierce = [3, 4, 5][idx];
    const chainPct = [65, 75, 85][idx];
    const chainBoth = tier >= 2;
    const wetMana = tier === 3 ? 2 : 0;
    return {
      ...base,
      id: 'asani_arc_lightning',
      badge: `ϟ เจาะ +${pierce} · ชิ่ง ${chainPct}%${chainBoth ? ' ×2ฝั่ง' : ''}${wetMana ? ' · เปียก +2 MP' : ''}`,
      label: `สายฟ้าฟาดชิ่งต่อเนื่อง เจาะ +${pierce} · ชิ่ง ${chainPct}%${chainBoth ? ' (2 ฝั่ง)' : ''}${wetMana ? ' & เปียกคืน +2 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เจาะเกราะเพิ่ม +${pierce} และดาเมจชิ่งเพิ่มเป็น ${chainPct}%${chainBoth ? ' พร้อมชิ่งได้ทั้งสองฝั่ง (ซ้าย+ขวา)' : ''}${wetMana ? ' และหากโดนเป้าเปียกจะคืน +2 มานาทันที' : ''}`,
      pierceBonus: pierce,
      asaniChainPct: chainPct,
      asaniChainBoth: chainBoth,
      asaniWetMana: wetMana,
    };
  }
  if (wordId === 'pathaphi') {
    const shield = [6, 10, 15][idx];
    const shred = [1, 1, 2][idx];
    const chill = [0, 3, 4][idx];
    const zeroArmorDmg = tier === 3 ? 10 : 0;
    return {
      ...base,
      id: 'pathaphi_fortress',
      badge: `◆ เกราะ +${shield} · ทุบเกราะ +${shred}${zeroArmorDmg ? ' · ไร้เกราะ +10' : ''}`,
      label: `ปราการพสุธา เกราะ +${shield} · ทุบเกราะเพิ่ม +${shred}${chill ? ` · ลดโจมตี -${chill}` : ''}${zeroArmorDmg ? ' & เป้าไร้เกราะ +10' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ได้เกราะชั่วคราวเพิ่ม +${shield} และทุบเกราะถาวรเพิ่มอีก +${shred}${chill ? ` พร้อมลดแรงโจมตีเป้า -${chill}` : ''}${zeroArmorDmg ? ' และหากเกราะเป้าเหลือ 0 จะแถมดาเมจพสุธาทะลุเกราะ +10' : ''}`,
      shieldBonus: shield,
      pathaphiShredBonus: shred,
      pathaphiChillBonus: chill,
      pathaphiZeroArmorBonusDmg: zeroArmorDmg,
    };
  }
  if (wordId === 'wari') {
    const heal = [5, 8, 12][idx];
    const pct = [4, 6, 8][idx];
    const chill = [2, 3, 4][idx];
    const wetAll = tier >= 2;
    const manaRefund = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'wari_tidal_restoration',
      badge: `≈ ฮีล +${heal} (+${pct}%)${wetAll ? ' · เปียกทั้งสนาม' : ''}${manaRefund ? ' · +1 MP' : ''}`,
      label: `กระแสวารีชุบชีพ ฮีล +${heal} (+${pct}% Max HP) · หนาว +${chill}${wetAll ? ' · เปียกทั้งสนาม' : ''}${manaRefund ? ' & +1 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ฟื้นฟูเพิ่ม +${heal} HP (+${pct}% Max HP) และเพิ่มหนาว +${chill}${wetAll ? ' พร้อมทำให้ศัตรูทั้งสนามเปียก' : ''}${manaRefund ? ' และคืน +1 มานาหลังร่าย' : ''}`,
      healBonus: heal,
      healMaxHpPct: pct,
      wariChillBonus: chill,
      wariWetAll: wetAll,
      manaRefund,
    };
  }
  if (wordId === 'vayu') {
    const slam = [5, 9, 14][idx];
    const chill = [0, 3, 4][idx];
    const shred = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'vayu_cyclone_drive',
      badge: `≋ ชน +${slam} · ผลัก 2 ช่อง${chill ? ` · มึน -${chill}` : ''}${shred ? ' · ทุบเกราะ -1' : ''}`,
      label: `พายุหมุนกวาดแนว ชน +${slam} · ผลัก 2 ช่อง${chill ? ` · ชนลดโจมตี -${chill}` : ''}${shred ? ' & ทุบเกราะ -1' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เพิ่มดาเมจกระแทกชน/ขอบอีก +${slam} และผลักไกล 2 ช่อง${chill ? ` หากชนศัตรูจะลดแรงโจมตีทั้งสองตัว -${chill}` : ''}${shred ? ' พร้อมทุบเกราะถาวร -1 ทั้งสองตัว' : ''}`,
      vayuSlamBonus: slam,
      vayuExtraSteps: 1,
      vayuCollideChill: chill,
      vayuCollideArmorShred: shred,
    };
  }
  if (wordId === 'freeze') {
    const shred = [1, 2, 2][idx];
    const chill = [3, 5, 6][idx];
    const dmgPct = [0, 15, 25][idx];
    const manaRefund = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'freeze_shatter_frost',
      badge: `❆ ทุบเกราะ -${shred} · หนาว +${chill}${dmgPct ? ` · แรง +${dmgPct}%` : ''}${manaRefund ? ' · +1 MP' : ''}`,
      label: `ผลึกน้ำแข็งเปราะบาง ทุบเกราะ -${shred} · หนาว +${chill}${dmgPct ? ` · แรง +${dmgPct}%` : ''}${manaRefund ? ' & +1 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เป้าที่ถูกแช่แข็งโดนทุบเกราะถาวร -${shred} และติดหนาวเพิ่ม +${chill}${dmgPct ? ` พร้อมเพิ่มดาเมจคาถา +${dmgPct}%` : ''}${manaRefund ? ' และคืน +1 มานา' : ''}`,
      freezeArmorShred: shred,
      freezeChillBonus: chill,
      damagePctBonus: dmgPct,
      manaRefund,
    };
  }
  if (wordId === 'pierce') {
    const overMult = [1, 1.5, 2][idx];
    const shred = [0, 1, 2][idx];
    const dmgPct = [0, 0, 15][idx];
    return {
      ...base,
      id: 'pierce_overpenetration',
      badge: `↠ เจาะล้น→ดาเมจ ×${overMult}${shred ? ` · ทุบเกราะ -${shred}` : ''}${dmgPct ? ` · แรง +${dmgPct}%` : ''}`,
      label: `เจาะจุดตาย ส่วนเกินเกราะ→ดาเมจแท้ ×${overMult}${shred ? ` · ทุบเกราะ -${shred}` : ''}${dmgPct ? ` & แรง +${dmgPct}%` : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ค่าเจาะเกราะส่วนที่เกินเกราะศัตรูจะแปลงเป็นโบนัสดาเมจแท้ ×${overMult}${shred ? ` พร้อมทุบเกราะถาวร -${shred}` : ''}${dmgPct ? ` และเพิ่มดาเมจคาถา +${dmgPct}%` : ''}`,
      overpierceMult: overMult,
      pierceArmorShred: shred,
      damagePctBonus: dmgPct,
    };
  }
  if (wordId === 'grand') {
    const dmgPct = [10, 16, 25][idx];
    const selfBonus = [6, 10, 15][idx];
    const nextBonus = [2, 4, 6][idx];
    const manaRefund = [0, 1, 2][idx];
    return {
      ...base,
      id: 'grand_mastery',
      badge: `✦ แรง +${dmgPct}% / ป้องกัน +${selfBonus}${manaRefund ? ` · +${manaRefund} MP` : ''}`,
      label: `มหามนตรา โจมตี +${dmgPct}% / โล่-ฮีล +${selfBonus} · ต่อเนื่อง +${nextBonus}${manaRefund ? ` & คืน +${manaRefund} MP` : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): คาถามหาโจมตีแรงขึ้น +${dmgPct}% (หรือโล่/ฮีล +${selfBonus} และฟื้น/เติมโล่ต้นเทิร์นหน้า +${nextBonus})${manaRefund ? ` พร้อมคืน +${manaRefund} มานาหลังร่าย` : ''}`,
      damagePctBonus: dmgPct,
      grandSelfBonus: selfBonus,
      grandNextTurnBonus: nextBonus,
      manaRefund,
    };
  }
  if (wordId === 'seal') {
    const chill = [3, 5, 6][idx];
    const splash = tier >= 2;
    const punish = tier === 3 ? 15 : 0;
    return {
      ...base,
      id: 'seal_arcane_lockdown',
      badge: `⌑ ลดโจมตี -${chill}${splash ? ' · ลามข้างเคียง' : ''}${punish ? ' · สะท้อน +15 & +1 MP' : ''}`,
      label: `ตราผนึกสะกดอาคม ลดโจมตี -${chill}${splash ? ' · ลามผนึกข้างเคียง' : ''}${punish ? ' & สะท้อน +15 (+1 MP)' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เป้าที่โดนผนึกถูกลดแรงโจมตี -${chill}${splash ? ' และลามผนึกพร้อมลดโจมตีใส่ช่องข้างเคียงด้วย' : ''}${punish ? ' หากเป้ามีม่านหรือกำลังจะใช้ท่าสนับสนุนจะโดนดาเมจแท้ +15 และคืน +1 มานา' : ''}`,
      sealChillBonus: chill,
      sealSplashAdjacent: splash,
      sealPunishDmg: punish,
    };
  }
  if (wordId === 'dispel') {
    const burst = [10, 15, 22][idx];
    const shred = [0, 1, 2][idx];
    const manaRefund = tier === 3 ? 2 : 0;
    const splashWard = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'dispel_nullify_burst',
      badge: `✧ ลบม่าน +${burst}/ชั้น · เจาะ +2${shred ? ` · ทุบเกราะ -${shred}` : ''}${manaRefund ? ' · +2 MP' : ''}`,
      label: `สลายอาคมสะท้อนกลับ ม่านแตก +${burst}/ชั้น · เจาะ +2${shred ? ` · ทุบเกราะ -${shred}` : ''}${manaRefund ? ' & +2 MP + ลบข้างเคียง' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เจาะเกราะ +2 และทำดาเมจแท้ +${burst} ต่อม่านทุกชั้นที่สลายได้${shred ? ` พร้อมทุบเกราะถาวร -${shred}` : ''}${manaRefund ? ' หากสลายม่านสำเร็จคืน +2 มานา และลบม่านช่องข้างเคียงอีก 1 ชั้น' : ''}`,
      pierceBonus: 2,
      dispelWardBurstDmg: burst,
      dispelArmorShred: shred,
      dispelManaRefund: manaRefund,
      dispelSplashWard: splashWard,
    };
  }
  if (wordId === 'brace') {
    const shield = [5, 8, 12][idx];
    const reflect = [0, 10, 16][idx];
    const chill = tier === 3 ? 4 : 0;
    const heal = tier === 3 ? 6 : 0;
    return {
      ...base,
      id: 'brace_unbreakable',
      badge: `▣ เกณฑ์ ≥6 · เกราะ +${shield}${reflect ? ` · สะท้อน ${reflect}` : ''}${chill ? ' · หนาว 4 & +6 HP' : ''}`,
      label: `ป้อมปราการไม่สั่นคลอน เกณฑ์ ≥6 · เกราะ +${shield}${reflect ? ` · สะท้อนแท้ ${reflect}` : ''}${chill ? ' & หนาว -4 + ฟื้น 6 HP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ยืนหยัดทำงานง่ายขึ้นเมื่อโดนตีแรง ≥ 6 และได้เกราะเสริม +${shield}${reflect ? ` พร้อมสะท้อนดาเมจแท้ ${reflect} ใส่ผู้โจมตีเมื่อยืนหยัดทำงาน` : ''}${chill ? ' และลดแรงโจมตีศัตรู -4 พร้อมฟื้น +6 HP' : ''}`,
      shieldBonus: shield,
      braceThreshold: 6,
      braceReflectDmg: reflect,
      braceCounterChill: chill,
      braceCounterHeal: heal,
    };
  }

  // === Batch 4: Tailored Epic Dual-Element Fusion Cards (Cards 31-40) ===
  if (wordId === 'magma') {
    const burn = [4, 6, 10][idx];
    const splashHalf = tier >= 2;
    const shredExtra = tier === 3 ? 1 : 0;
    const zeroArmorDmg = tier === 3 ? 12 : 0;
    return {
      ...base,
      id: 'magma_volcanic_eruption',
      badge: `♨ เผา +${burn}${splashHalf ? ' · ปะทุลาม' : ''}${zeroArmorDmg ? ' · ล้างเกราะ +12' : ''}`,
      label: `ภูเขาไฟปะทุ เผา +${burn}${splashHalf ? ' · แอ่งปะทุลามข้างเคียง' : ''}${zeroArmorDmg ? ' & ลดเกราะ -3 + 12 แท้' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เป้าที่โดนแมกม่าติดเผา +${burn}${splashHalf ? ' · แอ่งแมกม่าปะทุลามใส่ช่องข้างเคียงครึ่งแรง' : ''}${zeroArmorDmg ? ' · ปะทุลดเกราะเพิ่มอีก -1 (รวม -3) และหากเกราะเหลือ 0 ซ้ำด้วย +12 ดาเมจแท้' : ''}`,
      magmaBurnBonus: burn,
      magmaSplashHalf: splashHalf,
      magmaShredExtra: shredExtra,
      magmaZeroArmorDmg: zeroArmorDmg,
    };
  }
  if (wordId === 'mudmire') {
    const chill = [3, 5, 7][idx];
    const heal = [4, 7, 10][idx];
    const splashAdj = tier >= 2;
    const shred = tier === 3 ? 2 : 0;
    const dmgPct = tier === 3 ? 15 : 0;
    return {
      ...base,
      id: 'mudmire_quicksand',
      badge: `◆ หนาว +${chill} · ฮีล +${heal}${splashAdj ? ' · ลามข้าง' : ''}${dmgPct ? ' · แรง +15%' : ''}`,
      label: `โคลนดูดตรึงร่าง หนาว +${chill} & ฮีล +${heal}${splashAdj ? ' · ลามเปียก+หนาว' : ''}${shred ? ' · เจาะเกราะ -2 & +15%' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): บึงโคลนเพิ่มหนาว +${chill} และฟื้นฟู +${heal} HP${splashAdj ? ' · ลามเปียกและหนาวใส่ศัตรูช่องข้างเคียง' : ''}${shred ? ' · ทำลายเกราะถาวร -2 และเพิ่มดาเมจบึงโคลน +15%' : ''}`,
      mudmireChillBonus: chill,
      healBonus: heal,
      mudmireSplashAdjacent: splashAdj,
      mudmireArmorShred: shred,
      damagePctBonus: dmgPct,
    };
  }
  if (wordId === 'dust') {
    const slam = [5, 9, 14][idx];
    const shred = [1, 1, 2][idx];
    const obscure = tier >= 2;
    const extraSteps = tier === 3 ? 1 : 0;
    const collideDebuff = tier === 3;
    return {
      ...base,
      id: 'dust_sandstorm',
      badge: `≋ ชน +${slam} · เกราะ −${shred}${obscure ? ' · บดบัง' : ''}${extraSteps ? ' · ผลัก 2 ช่อง' : ''}`,
      label: `พายุทรายกัดกร่อน กระแทก +${slam} & ลดเกราะเพิ่ม −${shred}${obscure ? ' · บดบัง -4' : ''}${extraSteps ? ' · ผลัก 2 ช่อง' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): แรงกระแทกธุลีเพิ่ม +${slam} และลดเกราะถาวรเพิ่ม −${shred}${obscure ? ' · บดบังการเล็งเป้า (-4 โจมตี)' : ''}${collideDebuff ? ' · ผลักไกล 2 ช่อง และตัวที่ถูกชนเสียเกราะ −1 + บดบังด้วย' : ''}`,
      dustSlamBonus: slam,
      dustShredBonus: shred,
      dustObscure: obscure,
      dustExtraSteps: extraSteps,
      dustCollideDebuff: collideDebuff,
    };
  }
  if (wordId === 'permafrost') {
    const shield = [6, 10, 16][idx];
    const chill = [3, 5, 7][idx];
    const shred = [0, 1, 1][idx];
    const freezeZero = tier === 3;
    return {
      ...base,
      id: 'permafrost_glacier_fort',
      badge: `❄ เกราะ +${shield} · หนาว +${chill}${shred ? ' · เกราะ −3' : ''}${freezeZero ? ' · แช่แข็งเกราะ 0' : ''}`,
      label: `ป้อมปราการน้ำแข็ง เกราะ +${shield} & หนาว +${chill}${shred ? ' · ลดเกราะเพิ่ม -1' : ''}${freezeZero ? ' · แช่แข็งเป้าไร้เกราะ' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ได้เกราะน้ำแข็งเสริม +${shield} และทำให้เป้าติดหนาว +${chill}${shred ? ' · ลดเกราะถาวรเพิ่มอีก -1 (รวม -3)' : ''}${freezeZero ? ' · หากเกราะเป้าเหลือ 0 หลังโดนตีจะแช่แข็งเป้าทันที' : ''}`,
      shieldBonus: shield,
      permafrostChillBonus: chill,
      permafrostShredBonus: shred,
      permafrostFreezeZeroArmor: freezeZero,
    };
  }
  if (wordId === 'magnet') {
    const pierce = [2, 3, 5][idx];
    const slam = [4, 8, 12][idx];
    const pullRange = tier >= 2 ? 2 : 1;
    const collideShred = tier === 3 ? 1 : 0;
    const collideChill = tier === 3 ? 3 : 0;
    return {
      ...base,
      id: 'magnet_magnetic_field',
      badge: `ϟ เจาะ +${pierce} · ชน +${slam}${pullRange > 1 ? ' · ดูด 2 ช่อง' : ''}${collideShred ? ' · เกราะ −1/หนาว 3' : ''}`,
      label: `สนามแม่เหล็กแรงสูง เจาะ +${pierce} & ดูดชน +${slam}${pullRange > 1 ? ' · ระยะดูด 2 ช่อง' : ''}${collideShred ? ' · ชนลดเกราะ -1 & หนาว 3' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เจาะเกราะเพิ่ม +${pierce} และกระแทกดูดชนแรงขึ้น +${slam}${pullRange > 1 ? ' · ขยายระยะดูดศัตรูเป็น 2 ช่องรอบเป้าหลัก' : ''}${collideShred ? ' · ศัตรูที่ชนกันติดลดเกราะถาวร -1 และหนาว +3 ทุกตัว' : ''}`,
      pierceBonus: pierce,
      magnetSlamBonus: slam,
      magnetPullRange: pullRange,
      magnetCollideShred: collideShred,
      magnetCollideChill: collideChill,
    };
  }
  if (wordId === 'mist') {
    const shield = [5, 8, 12][idx];
    const spreadMode = tier >= 2 ? 'all' : 'adjacent';
    const chill = tier === 3 ? 6 : 0;
    const wetScald = tier === 3 ? 15 : 0;
    return {
      ...base,
      id: 'mist_scalding_veil',
      badge: `≋ เกราะ +${shield} · หมอก${spreadMode === 'all' ? 'ทั้งสนาม' : 'ข้างเคียง'}${wetScald ? ' · ลวก +15' : ''}`,
      label: `หมอกไอร้อนอำพราง เกราะ +${shield} · เปียก+บดบัง${spreadMode === 'all' ? 'ทั้งสนาม' : 'ช่องข้างเคียง'}${wetScald ? ' & หนาว 6 + ลวก 15 แท้' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ได้เกราะหมอก +${shield} และกระจายเปียก+บดบังให้${spreadMode === 'all' ? 'ศัตรูทั้งสนาม' : 'ศัตรูช่องข้างเคียง'}${wetScald ? ' · เพิ่มหนาว +6 และเป้าที่เปียกอยู่แล้วโดนไอร้อนลวกเพิ่ม +15 ดาเมจแท้' : ''}`,
      shieldBonus: shield,
      mistSpreadMode: spreadMode,
      mistChillBonus: chill,
      mistWetScaldDmg: wetScald,
    };
  }
  if (wordId === 'hail') {
    const dryChill = [3, 5, 7][idx];
    const freezeDmgPct = [15, 25, 35][idx];
    const dryWet = tier >= 2;
    const allChill = tier === 3 ? 5 : 0;
    const freezeMana = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'hail_blizzard',
      badge: `❆ แห้งหนาว +${dryChill} · แช่แรง +${freezeDmgPct}%${dryWet ? ' · เปียกต่อ' : ''}${freezeMana ? ' · หนาวทั้งสนาม/+1 MP' : ''}`,
      label: `พายุหิมะเยือกแข็ง หนาว +${dryChill} · เป้าเปียก/แช่ +${freezeDmgPct}% & ลดเกราะ -2${dryWet ? ' · แห้งติดเปียก' : ''}${freezeMana ? ' · ลามหนาว 5 & +1 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เป้าแห้งติดหนาวเพิ่ม +${dryChill}${dryWet ? ' และติดเปียกทันทีเพื่อแช่แข็งเทิร์นถัดไป' : ''} · เป้าที่โดนแช่แข็งรับดาเมจเพิ่ม +${freezeDmgPct}% พร้อมลดเกราะถาวร -2${freezeMana ? ' · ลามหนาว +5 ทั้งสนามและคืน +1 มานาเมื่อแช่แข็งสำเร็จ' : ''}`,
      hailDryChillBonus: dryChill,
      hailFreezeDmgPct: freezeDmgPct,
      hailDryApplyWet: dryWet,
      hailFreezeArmorShred: 2,
      hailAllChill: allChill,
      hailFreezeManaRefund: freezeMana,
    };
  }
  if (wordId === 'monsoon') {
    const heal = [5, 8, 12][idx];
    const maxHpPct = [4, 6, 8][idx];
    const slam = [4, 8, 12][idx];
    const pushChill = tier >= 2 ? 3 : 0;
    const slamMana = tier === 3 ? 2 : 0;
    return {
      ...base,
      id: 'monsoon_typhoon_surge',
      badge: `≈ ฮีล +${heal}+${maxHpPct}% · ชน +${slam}${pushChill ? ' · หนาว 3' : ''}${slamMana ? ' · ชนคืน 2 MP' : ''}`,
      label: `คลื่นยักษ์มรสุม ฟื้น +${heal} (+${maxHpPct}% MaxHP) & กระแทก +${slam}${pushChill ? ' · ผลักติดหนาว 3' : ''}${slamMana ? ' & ชนคืน +2 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ฟื้นฟูเพิ่ม +${heal} HP (+${maxHpPct}% MaxHP) และแรงกระแทกมรสุมเพิ่ม +${slam}${pushChill ? ' · ศัตรูทุกตัวที่โดนผลักติดหนาว +3' : ''}${slamMana ? ' · คืน +2 มานาเมื่อมรสุมผลักชนศัตรูหรือขอบสนาม' : ''}`,
      healBonus: heal,
      healMaxHpPct: maxHpPct,
      monsoonSlamBonus: slam,
      monsoonPushChill: pushChill,
      monsoonSlamManaRefund: slamMana,
    };
  }
  if (wordId === 'shockstream') {
    const pierce = [2, 4, 6][idx];
    const shockBonus = [6, 12, 18][idx];
    const wetPrimary = tier >= 2;
    const manaPerWet = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'shockstream_high_voltage',
      badge: `ϟ เจาะ +${pierce} · ช็อต +${shockBonus}${wetPrimary ? ' · เปียก+ช็อตซ้ำ' : ''}${manaPerWet ? ' · +1 MP/ตัว' : ''}`,
      label: `กระแสไฟแรงสูง เจาะ +${pierce} & ช็อตเปียก +${shockBonus}${wetPrimary ? ' · ทำให้เป้าหลักเปียก/ช็อตซ้ำ' : ''}${manaPerWet ? ' · คืน 1 MP/เป้าเปียก (สูงสุด 3)' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เจาะเกราะเพิ่ม +${pierce} และเพิ่มดาเมจช็อตเป้าเปียก +${shockBonus}${wetPrimary ? ' · ทำให้เป้าหลักติดเปียก (และถ้าเปียกอยู่แล้วจะโดนช็อตซ้ำด้วย)' : ''}${manaPerWet ? ' · คืน +1 มานาต่อเป้าเปียกที่ช็อตได้ (สูงสุด +3 มานา)' : ''}`,
      pierceBonus: pierce,
      shockstreamBonusDmg: shockBonus,
      shockstreamWetPrimary: wetPrimary,
      shockstreamManaPerWet: manaPerWet,
    };
  }
  if (wordId === 'thunderstorm') {
    const pierce = [2, 3, 5][idx];
    const chainPct = [65, 80, 95][idx];
    const chainBoth = tier >= 2;
    const slamBonus = tier === 3 ? 12 : 0;
    const collideZap = tier === 3;
    return {
      ...base,
      id: 'thunderstorm_tempest_arc',
      badge: `ϟ เจาะ +${pierce} · ชิ่ง ${chainPct}%${chainBoth ? '×2 ฝั่ง' : ''}${slamBonus ? ' · ชน+12 & ฟาดซ้ำ' : ''}`,
      label: `อัสนีบาตพายุคลั่ง เจาะ +${pierce} & ชิ่ง ${chainPct}%${chainBoth ? ' ทั้งสองฝั่ง' : ''}${slamBonus ? ' · ชน +12 & ฟาดตัวชน' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เจาะเกราะเพิ่ม +${pierce} และสายฟ้าชิ่งแรงขึ้นเป็น ${chainPct}%${chainBoth ? ' ชิ่งใส่ทั้งสองฝั่งรอบตำแหน่งใหม่หลังผลัก' : ''}${collideZap ? ' · แรงกระแทกชนเพิ่ม +12 และฟาดสายฟ้าซ้ำใส่ศัตรูที่ถูกผลักชนด้วย' : ''}`,
      pierceBonus: pierce,
      thunderstormChainPct: chainPct,
      thunderstormChainBoth: chainBoth,
      thunderstormSlamBonus: slamBonus,
      thunderstormCollideZap: collideZap,
    };
  }

  // === Batch 5 (Final): Remaining 9 Epic + 4 Legendary Cards (Cards 41-53) ===
  if (wordId === 'heatwave') {
    const primaryBurn = [4, 7, 12][idx];
    const slam = [4, 8, 12][idx];
    const linger = tier >= 2;
    const detonate = tier === 3 ? 15 : 0;
    return {
      ...base,
      id: 'heatwave_inferno_gale',
      badge: `♨ เผาหลัก +${primaryBurn} · ชน +${slam}${linger ? ' · ไฟค้าง' : ''}${detonate ? ' · ระเบิดเผา +15' : ''}`,
      label: `คลื่นเพลิงโหม เผาเป้าหลัก +${primaryBurn} & กระแทก +${slam}${linger ? ' · ไฟค้างเทิร์นหน้า' : ''}${detonate ? ' · ซ้ำเป้าติดเผา +15 แท้' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เป้าหลักติดเผาเพิ่ม +${primaryBurn} และกระแทกชนแรงขึ้น +${slam}${linger ? ' · เป้าที่ติดเผาจากระอุจะเหลือไฟค้าง 50% เทิร์นถัดไป' : ''}${detonate ? ' · เป้าที่ติดเผาอยู่แล้วโดนระเบิดความร้อนเพิ่ม +15 ดาเมจแท้' : ''}`,
      heatwavePrimaryBurn: primaryBurn,
      heatwaveSlamBonus: slam,
      heatwaveLingerBurn: linger,
      heatwaveBurnDetonateDmg: detonate,
    };
  }
  if (wordId === 'chillgale') {
    const chill = [3, 5, 8][idx];
    const slam = [4, 8, 12][idx];
    const splashChill = tier >= 2 ? 4 : 0;
    const extraSteps = tier === 3 ? 1 : 0;
    const collideFreeze = tier === 3;
    return {
      ...base,
      id: 'chillgale_blizzard_gust',
      badge: `❄ หนาว +${chill} · ชน +${slam}${splashChill ? ' · ลามหนาว 4' : ''}${extraSteps ? ' · ผลัก 2/ชนแช่แข็ง' : ''}`,
      label: `พายุหิมะพัดกระหน่ำ หนาว +${chill} & กระแทก +${slam}${splashChill ? ' · ลามหนาวข้างเคียง 4' : ''}${collideFreeze ? ' · ผลัก 2 ช่อง & ชนแช่แข็ง' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เพิ่มหนาวถาวร +${chill} และกระแทกชนแรงขึ้น +${slam}${splashChill ? ' · กระจายหนาวถาวร +4 ใส่ศัตรูช่องข้างเคียง' : ''}${collideFreeze ? ' · ผลักไกล 2 ช่อง และหากตัวที่ชนกันติดหนาวอยู่แล้วจะถูกแช่แข็งทันที' : ''}`,
      chillgaleChillBonus: chill,
      chillgaleSlamBonus: slam,
      chillgaleSplashChill: splashChill,
      chillgaleExtraSteps: extraSteps,
      chillgaleCollideFreeze: collideFreeze,
    };
  }
  if (wordId === 'plasma') {
    const pierce = [3, 5, 8][idx];
    const dmgPct = [10, 18, 28][idx];
    const burn = tier >= 2 ? 8 : 0;
    const shred = tier >= 2 ? 2 : 0;
    const overpierce = tier === 3 ? 2 : 0;
    return {
      ...base,
      id: 'plasma_meltdown',
      badge: `✦ เจาะ +${pierce} · แรง +${dmgPct}%${shred ? ' · เผา 8/เกราะ −2' : ''}${overpierce ? ' · ทะลวง ×2' : ''}`,
      label: `ลำแสงพลาสมาหลอมละลาย เจาะ +${pierce} & แรง +${dmgPct}%${shred ? ' · เผา 8 & ลดเกราะ -2' : ''}${overpierce ? ' · เจาะเกินแปลงดาเมจแท้ ×2' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เจาะเกราะเพิ่ม +${pierce} และเพิ่มดาเมจพลาสมา +${dmgPct}%${shred ? ' · เผาเป้า +8 และลดเกราะถาวร -2' : ''}${overpierce ? ' · หากเจาะเกราะเกินเกราะเป้า เปลี่ยนส่วนเกินเป็นดาเมจแท้ ×2' : ''}`,
      pierceBonus: pierce,
      damagePctBonus: dmgPct,
      plasmaBurnBonus: burn,
      plasmaArmorShred: shred,
      overpierceMult: overpierce,
    };
  }
  if (wordId === 'scald') {
    const shred = [1, 1, 2][idx];
    const chill = [4, 6, 8][idx];
    const zeroArmor = tier >= 2 ? 18 : 0;
    const wetBurn = tier === 3 ? 8 : 0;
    const mana = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'scald_thermal_shock',
      badge: `♨ เกราะ −${2 + shred} · หนาว +${chill}${zeroArmor ? ' · เกราะ 0 +18' : ''}${mana ? ' · เปียก+เผา 8/+1 MP' : ''}`,
      label: `ไอน้ำฉับพลันทำลายเกราะ ลดเกราะรวม -${2 + shred} & หนาว +${chill}${zeroArmor ? ' · ช็อกเกราะ 0 (+18 แท้)' : ''}${mana ? ' · เปียก+เผา 8 & คืน 1 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ลดเกราะถาวรเพิ่มอีก -${shred} (รวม -${2 + shred}) และลดแรงโจมตี +${chill}${zeroArmor ? ' · หากเกราะเป้าเหลือ 0 ช็อกความร้อนเพิ่ม +18 ดาเมจแท้' : ''}${mana ? ' · ทำให้เป้าเปียก+เผา +8 และคืน +1 มานา' : ''}`,
      scaldShredBonus: shred,
      scaldChillBonus: chill,
      scaldZeroArmorDmg: zeroArmor,
      scaldApplyWetBurn: wetBurn,
      manaRefund: mana,
    };
  }
  if (wordId === 'frostvolt') {
    const pierce = [2, 3, 5][idx];
    const chainPct = [65, 80, 95][idx];
    const chainBoth = tier >= 2;
    const chainFreeze = tier === 3;
    const mana = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'frostvolt_cryo_arc',
      badge: `❆ เจาะ +${pierce} · ชิ่ง ${chainPct}%${chainBoth ? '×2 ฝั่ง' : ''}${chainFreeze ? ' · ชิ่งแช่แข็ง/+1 MP' : ''}`,
      label: `ผลึกอัสนีเยือกแข็ง เจาะ +${pierce} & ชิ่ง ${chainPct}%${chainBoth ? ' ทั้งสองฝั่ง' : ''}${chainFreeze ? ' · ชิ่งแช่แข็งเป้าหนาว & +1 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เจาะเกราะเพิ่ม +${pierce} และสายฟ้าแช่แข็งชิ่งแรงขึ้นเป็น ${chainPct}%${chainBoth ? ' ชิ่งใส่ทั้งสองฝั่งพร้อมติดหนาว' : ''}${chainFreeze ? ' · เป้าที่ชิ่งโดนและติดหนาวอยู่แล้วถูกแช่แข็งทันที พร้อมคืน +1 มานา' : ''}`,
      pierceBonus: pierce,
      frostvoltChainPct: chainPct,
      frostvoltChainBoth: chainBoth,
      frostvoltChainFreezeChilled: chainFreeze,
      manaRefund: mana,
    };
  }
  if (wordId === 'meteor') {
    const pierce = [2, 4, 6][idx];
    const burn = [3, 5, 8][idx];
    const shred = tier >= 2 ? 1 : 0;
    const extraDrops = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'meteor_starfall',
      badge: `✹ เจาะ +${pierce} · เผา +${burn}${shred ? ' · เกราะ −1' : ''}${extraDrops ? ' · +1 ลูก/ชุด' : ''}`,
      label: `ฝนดาวตกถล่มฟ้า เจาะ +${pierce} & เผา +${burn}${shred ? ' · ลดเกราะ -1 ทุกเป้า' : ''}${extraDrops ? ' · เพิ่มอุกกาบาต +1 ลูกต่อชุด' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): อุกกาบาตเจาะเกราะเพิ่ม +${pierce} และเผาเป้าที่โดน +${burn}${shred ? ' · ลดเกราะถาวร -1 ทุกตัวที่โดน' : ''}${extraDrops ? ' · เพิ่มจำนวนอุกกาบาตอีก +1 ลูกต่อชุด (เป็น 4 ลูก / คู่ 8 ลูก)' : ''}`,
      pierceBonus: pierce,
      meteorBurnBonus: burn,
      meteorArmorShred: shred,
      meteorExtraDrops: extraDrops,
    };
  }
  if (wordId === 'veil') {
    const renew = [4, 7, 12][idx];
    const reflect = tier >= 2 ? 15 : 0;
    const breakHeal = tier >= 2 ? 8 : 0;
    const breakMana = tier === 3 ? 2 : 0;
    const breakChill = tier === 3 ? 6 : 0;
    return {
      ...base,
      id: 'veil_astral_mirror',
      badge: `▣ เติมม่าน +${renew}${reflect ? ' · แตกสะท้อน 15/+8 HP' : ''}${breakMana ? ' · +2 MP/หนาว 6' : ''}`,
      label: `ม่านมิติสะท้อนพลัง เติมม่านต้นเทิร์น +${renew}${reflect ? ' · แตกสะท้อน 15 แท้ & +8 HP' : ''}${breakMana ? ' · คืน +2 MP & หนาว -6' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เติมความจุม่านต้นเทิร์นถัดไป +${renew}${reflect ? ' · เมื่อม่านแตก สะท้อนดาเมจแท้ 15 ใส่ผู้โจมตีและฟื้น +8 HP' : ''}${breakMana ? ' · เมื่อม่านแตก คืน +2 มานาและลดพลังโจมตีศัตรู -6' : ''}`,
      shieldRenewalBonus: renew,
      veilBreakReflectDmg: reflect,
      veilBreakHeal: breakHeal,
      veilBreakMana: breakMana,
      veilBreakChill: breakChill,
    };
  }
  if (wordId === 'chakram') {
    const pierce = [2, 4, 6][idx];
    const dmgPct = [10, 16, 24][idx];
    const shred = tier >= 2 ? 2 : 0;
    const killMana = tier === 3 ? 3 : 0;
    const killCleave = tier === 3;
    return {
      ...base,
      id: 'chakram_executioner',
      badge: `❂ เจาะ +${pierce} · แรง +${dmgPct}%${shred ? ' · เกราะ −2' : ''}${killMana ? ' · สังหารชิ่ง/+3 MP' : ''}`,
      label: `คมจักรผ่าเกราะ เจาะ +${pierce} & แรง +${dmgPct}%${shred ? ' · ลดเกราะ -2' : ''}${killCleave ? ' · สังหารคืน 3 MP & ชิ่งเฉือนข้างเคียง' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): กรงจักรเจาะเกราะเพิ่ม +${pierce} และแรงขึ้น +${dmgPct}%${shred ? ' · ทำลายเกราะถาวร -2' : ''}${killCleave ? ' · หากสังหารเป้าหมายได้ คืน +3 มานาและชิ่งเฉือนศัตรูข้างเคียงครึ่งแรง' : ''}`,
      pierceBonus: pierce,
      damagePctBonus: dmgPct,
      chakramArmorShred: shred,
      chakramKillManaRefund: killMana,
      chakramKillCleaveHalf: killCleave,
    };
  }
  if (wordId === 'storm') {
    const sidePct = [85, 95, 100][idx];
    const pierce = [1, 2, 4][idx];
    const chill = tier >= 2 ? 3 : 0;
    const multiMana = tier === 3 ? 2 : 0;
    return {
      ...base,
      id: 'storm_eye_tempest',
      badge: `◉ ข้าง ${sidePct}% · เจาะ +${pierce}${chill ? ' · หนาว 3' : ''}${multiMana ? ' · โดน ≥2 คืน 2 MP' : ''}`,
      label: `ตาพายุโหมกระหน่ำ แรงข้างเคียง ${sidePct}% & เจาะ +${pierce}${chill ? ' · หนาวทุกเป้า 3' : ''}${multiMana ? ' · โดน ≥2 ตัวคืน +2 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): พายุเพิ่มแรงช่องข้างเคียงจาก 75% เป็น ${sidePct}% และเจาะเกราะ +${pierce}${chill ? ' · ศัตรูทุกตัวในพายุติดหนาว +3' : ''}${multiMana ? ' · หากพายุโดนศัตรู 2 ตัวขึ้นไป คืน +2 มานา' : ''}`,
      stormSidePct: sidePct,
      pierceBonus: pierce,
      stormChillBonus: chill,
      stormMultiManaRefund: multiMana,
    };
  }
  if (wordId === 'barrage') {
    const pierce = [2, 4, 6][idx];
    const mana = [2, 4, 6][idx];
    const shred = tier >= 2 ? 1 : 0;
    const finale = tier === 3;
    return {
      ...base,
      id: 'barrage_relentless',
      badge: `Ⅴ เจาะ +${pierce} · +${mana} MP${shred ? ' · เกราะ −3' : ''}${finale ? ' · นัดสุดท้าย ×2' : ''}`,
      label: `ระดมยิงไร้ปราณี เจาะ +${pierce} & คืน +${mana} มานา${shred ? ' · ลดเกราะสะสม -3' : ''}${finale ? ' · นัดที่ 5 แรง ×2!' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): กระหน่ำเจาะเกราะเพิ่ม +${pierce} และคืนมานา +${mana} หลังร่าย${shred ? ' · ลดเกราะถาวร -1 ต่อครั้งที่โดน (สูงสุด -3)' : ''}${finale ? ' · นัดสุดท้าย (ครั้งที่ 5) โจมตีแรงเป็น 2 เท่า!' : ''}`,
      pierceBonus: pierce,
      manaRefund: mana,
      barrageArmorShred: shred,
      barrageFinaleDouble: finale,
    };
  }
  if (wordId === 'devastation') {
    const blastPct = [65, 80, 100][idx];
    const pierce = [2, 4, 6][idx];
    const shred = tier >= 2 ? 2 : 0;
    const mana = tier === 3 ? 2 : 0;
    const stripWard = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'devastation_cataclysm',
      badge: `✷ ระเบิด ${blastPct}% · เจาะ +${pierce}${shred ? ' · เกราะ −2' : ''}${stripWard ? ' · ตัดม่าน/+2 MP' : ''}`,
      label: `มหาพินาศทำลายล้าง ระเบิดรัศมี 2 ช่อง ${blastPct}% & เจาะ +${pierce}${shred ? ' · ลดเกราะ -2 ทั้งรัศมี' : ''}${stripWard ? ' · สลายม่าน -1 & +2 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ระเบิดทำลายล้างรัศมี 2 ช่องแรงขึ้นเป็น ${blastPct}% และเจาะเกราะ +${pierce}${shred ? ' · ลดเกราะถาวร -2 ทุกตัวในรัศมี' : ''}${stripWard ? ' · สลายม่าน -1 ชั้นก่อนระเบิดและคืน +2 มานา' : ''}`,
      devastationBlastPct: blastPct,
      pierceBonus: pierce,
      devastationArmorShred: shred,
      manaRefund: mana,
      devastationStripWard: stripWard,
    };
  }
  if (wordId === 'blackhole') {
    const shield = [12, 20, 30][idx];
    const mana = [2, 4, 6][idx];
    const pullChill = tier >= 2 ? 6 : 0;
    const pullShred = tier >= 2 ? 2 : 0;
    const collapsePct = tier === 3 ? 25 : 0;
    return {
      ...base,
      id: 'blackhole_event_horizon',
      badge: `◉ เกราะ +${shield} · +${mana} MP${pullShred ? ' · ดูดหนาว 6/เกราะ −2' : ''}${collapsePct ? ' · ยุบ +25%/ข้าง 75%' : ''}`,
      label: `ขอบฟ้าเหตุการณ์นิรันดร์ เกราะ +${shield} & คืน +${mana} มานา${pullShred ? ' · ดูดติดหนาว 6 & เกราะ -2' : ''}${collapsePct ? ' · ยุบแรง +25% (รอบข้าง 75%)' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อเปิดหลุมดำได้เกราะมิติ +${shield} และคืน +${mana} มานา${pullShred ? ' · ศัตรูที่โดนดูดติดหนาว +6 และลดเกราะถาวร -2' : ''}${collapsePct ? ' · แรงยุบหลุมดำเพิ่มขึ้นอีก +25% และศัตรูรอบข้างรับ 75% แทน 50%' : ''}`,
      shieldBonus: shield,
      manaRefund: mana,
      blackholePullChill: pullChill,
      blackholePullShred: pullShred,
      blackholeCollapsePct: collapsePct,
    };
  }
  if (wordId === 'death') {
    const shield = [10, 18, 28][idx];
    const heal = [10, 18, 28][idx];
    const bossMult = tier >= 2 ? 1.5 : 1;
    const bossShred = tier >= 2 ? 3 : 0;
    const bossStripWard = tier >= 2 ? 2 : 0;
    const killDraw = tier === 3 ? 2 : 0;
    return {
      ...base,
      id: 'death_reaper_verdict',
      badge: `† เกราะ/ฮีล +${shield}${bossShred ? ' · บอส ×1.5/เกราะ −3/ม่าน −2' : ''}${killDraw ? ' · ปลิดชีพจั่ว +2' : ''}`,
      label: `คำพิพากษามรณะ เกราะ +${shield} & ฟื้น +${heal} HP${bossShred ? ' · บอส ×1.5 & ล้างเกราะ -3/ม่าน -2' : ''}${killDraw ? ' · ปลิดชีพจั่ว +2 ใบ' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อร่ายคำสั่งตายได้เกราะวิญญาณ +${shield} และฟื้น +${heal} HP${bossShred ? ' · แรงพิพากษาใส่บอสเพิ่มเป็น ×1.5 พร้อมลดเกราะบอส -3 และสลายม่าน -2' : ''}${killDraw ? ' · หากปลิดชีพศัตรูธรรมดาสำเร็จ จั่วเพิ่ม +2 ใบทันที' : ''}`,
      shieldBonus: shield,
      healBonus: heal,
      deathBossMult: bossMult,
      deathBossShred: bossShred,
      deathBossStripWard: bossStripWard,
      deathKillDraw: killDraw,
    };
  }
  if (wordId === 'spear') {
    const backPct = [65, 75, 85][idx];
    const pierce = [1, 2, 3][idx];
    const shred = tier >= 2 ? 1 : 0;
    const doubleMana = tier === 3 ? 1 : 0;
    return {
      ...base,
      id: 'spear_skewer',
      badge: `➶ ตัวหลัง ${backPct}% · เจาะ +${pierce}${shred ? ' · เกราะ −1' : ''}${doubleMana ? ' · แทง 2 ตัว +1 MP' : ''}`,
      label: `หอกทะลวงแถว ตัวหลัง ${backPct}% & เจาะเกราะ +${pierce}${shred ? ' · ทุบเกราะ -1' : ''}${doubleMana ? ' · โดน 2 ตัวคืน +1 มานา' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ตัวข้างหลังรับแรงเพิ่มเป็น ${backPct}% และเจาะเกราะ +${pierce}${shred ? ' · ทุบเกราะเป้าหมายที่โดน -1 ถาวร' : ''}${doubleMana ? ' · หากแทงทะลุโดนครบทั้ง 2 ตัว คืน +1 มานา' : ''}`,
      spearBackPct: backPct,
      pierceBonus: pierce,
      spearArmorShred: shred,
      spearDoubleManaRefund: doubleMana,
    };
  }
  if (wordId === 'empower') {
    const shield = [6, 10, 14][idx];
    const extraTurns = tier >= 2 ? 1 : 0;
    const mana = tier === 3 ? 2 : 0;
    return {
      ...base,
      id: 'empower_resonance',
      badge: `▲ เกราะ +${shield}${extraTurns ? ' · บัฟ +1 เทิร์น' : ''}${mana ? ` · +${mana} MP` : ''}`,
      label: `เสริมพลังสะท้อน เกราะ +${shield}${extraTurns ? ' · บัฟนานขึ้น +1 เทิร์น' : ''}${mana ? ` · คืน +${mana} มานา` : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อร่ายเสริมธาตุได้เกราะชั่วคราว +${shield}${extraTurns ? ' · ยืดระยะบัฟธาตุเพิ่มอีก +1 เทิร์น' : ''}${mana ? ` · คืน +${mana} มานาทันที` : ''}`,
      shieldBonus: shield,
      buffExtraTurns: extraTurns,
      manaRefund: mana,
    };
  }
  if (wordId === 'bless') {
    const heal = [6, 10, 15][idx];
    const shield = [8, 14, 20][idx];
    const extraPierce = [0, 1, 2][idx];
    const extraTurns = tier >= 2 ? 1 : 0;
    const mana = tier === 3 ? 2 : 0;
    return {
      ...base,
      id: 'bless_sanctuary',
      badge: `✧ ฮีล +${heal} · เกราะ +${shield}${extraPierce ? ` · เจาะ +${extraPierce}/+1 เทิร์น` : ''}${mana ? ` · +${mana} MP` : ''}`,
      label: `พรศักดิ์สิทธิ์ ฟื้น +${heal} HP & เกราะ +${shield}${extraPierce ? ` · บัฟเจาะเพิ่ม +${extraPierce} & +1 เทิร์น` : ''}${mana ? ` · คืน +${mana} มานา` : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อร่ายอวยพรจะฟื้น +${heal} HP และได้เกราะ +${shield}${extraPierce ? ` · บัฟธาตุได้เจาะเกราะเพิ่ม +${extraPierce} และอยู่นานขึ้น +1 เทิร์น` : ''}${mana ? ` · คืน +${mana} มานาทันที` : ''}`,
      healBonus: heal,
      shieldBonus: shield,
      buffExtraPierce: extraPierce,
      buffExtraTurns: extraTurns,
      manaRefund: mana,
    };
  }
  if (wordId === 'fill') {
    const shield = [5, 9, 14][idx];
    const crossMana = [0, 1, 2][idx];
    const crossHeal = [0, 3, 6][idx];
    return {
      ...base,
      id: 'fill_overflow',
      badge: `◈ เกราะ +${shield}${crossMana ? ` · เติมเลือด +${crossMana} MP / เติมมานา +${crossHeal} HP` : ''}`,
      label: `เติมเต็มเอ่อล้น เกราะ +${shield}${crossMana ? ` · เติมเลือดแถม +${crossMana} MP & เติมมานาแถม +${crossHeal} HP` : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อร่ายเติมได้เกราะ +${shield}${crossMana ? ` · เติมเลือดแถม +${crossMana} มานา และเติมมานาแถม +${crossHeal} HP` : ''}`,
      shieldBonus: shield,
      fillCrossMana: crossMana,
      fillCrossHeal: crossHeal,
    };
  }
  if (wordId === 'blood') {
    const overhealCap = [8, 14, 22][idx];
    const nextHeal = [0, 4, 8][idx];
    return {
      ...base,
      id: 'blood_vitality',
      badge: `♥ ฮีลล้น→เกราะ ${overhealCap}${nextHeal ? ` · เทิร์นหน้า +${nextHeal} HP` : ''}`,
      label: `โลหิตหล่อเลี้ยง ฮีลล้นแปลงเกราะสูงสุด ${overhealCap}${nextHeal ? ` · เทิร์นหน้าฟื้น +${nextHeal} HP` : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): พลังชีวิตที่เติมล้น Max HP แปลงเป็นเกราะชั่วคราว (สูงสุด ${overhealCap})${nextHeal ? ` · ต้นเทิร์นถัดไปฟื้นเพิ่มอีก +${nextHeal} HP` : ''}`,
      overhealShieldCap: overhealCap,
      nextTurnHealBonus: nextHeal,
    };
  }
  if (wordId === 'mana') {
    const shield = [4, 8, 12][idx];
    const freeCast = true;
    const bonusDraw = tier >= 2 ? 1 : 0;
    const overflowShieldMult = tier === 3 ? 3 : 0;
    return {
      ...base,
      id: 'mana_wellspring',
      badge: `◆ ฟรี 0 MP · เกราะ +${shield}${bonusDraw ? ' · จั่ว +1' : ''}${overflowShieldMult ? ' · ล้น→เกราะ×3' : ''}`,
      label: `ตาน้ำมานา เติมมานาใช้ 0 MP & เกราะ +${shield}${bonusDraw ? ' · จั่ว +1 ใบ' : ''}${overflowShieldMult ? ' · มานาล้นแปลงเกราะ ×3' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): ลดค่าร่าย “เติม มานา” เหลือ 0 มานา และได้เกราะ +${shield}${bonusDraw ? ' · จั่วการ์ดเพิ่ม +1 ใบทันที' : ''}${overflowShieldMult ? ' · มานาที่เติมล้น Max MP แปลงเป็นเกราะ ×3' : ''}`,
      shieldBonus: shield,
      manaFreeCast: freeCast,
      manaBonusDraw: bonusDraw,
      manaOverflowShieldMult: overflowShieldMult,
    };
  }
  if (wordId === 'summon') {
    const refund = 1;
    const startWard = tier >= 2 ? 1 : 0;
    const cheatDeath = tier === 3;
    const strikeRefund = tier === 3 ? 2 : 0;
    return {
      ...base,
      id: 'summon_sovereign_covenant',
      badge: `⛧ คืน +1 MP${startWard ? ' · ม่าน 1' : ''}${cheatDeath ? ' · สายใยรับแทนตาย/+2 MP' : ''}`,
      label: `พันธสัญญาเทวาคุ้มเกล้า คืน 1 MP${startWard ? ' & ม่าน 1 ชั้น' : ''}${cheatDeath ? ' & สละชีพรับแทนตาย & หมัดประสานคืน +2 MP' : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อร่ายอัญเชิญ คืน +1 มานาทันที${startWard ? ' · สิ่งอัญเชิญเกิดพร้อมม่านคุ้มภัย (Ward) 1 ชั้น' : ''}${cheatDeath ? ' · สายใยผูกวิญญาณสละชีพรับแทน 100% หากผู้เล่นกำลังจะได้รับความเสียหายถึงชีวิต และหมัดประสานเทิร์น 2 คืน +2 มานา' : ''}`,
      summonRefundMana: refund,
      summonStartWard: startWard,
      summonCheatDeath: cheatDeath,
      summonStrikeRefundMana: strikeRefund,
    };
  }
  if (CREATURE_STATS[wordId]) {
    const c = CREATURE_STATS[wordId];
    if (wordId === 'golem') {
      const reflect = [8, 12, 16][idx];
      const breakShield = tier >= 2 ? 15 : 0;
      const titanSunder = tier === 3;
      return {
        ...base,
        id: 'golem_colossus_core',
        badge: `🗿 สะท้อน ${reflect}${breakShield ? ' · แตกให้โล่ 15/ม่าน 1' : ''}${titanSunder ? ' · หมัด 45 แท้/เกราะ 0/สตั๊น' : ''}`,
        label: `แกนศิลาไททัน สะท้อน ${reflect} แท้${breakShield ? ' & แตกมอบโล่ 15/ม่าน 1' : ''}${titanSunder ? ' & หมัดกัมปนาท 45 แท้ ลบเกราะ 0 สตั๊น 1 เทิร์น' : ''}`,
        description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): โดนตีสะท้อน ${reflect} ดาเมจแท้${breakShield ? ' · เมื่อแตกโอนพลังเป็นโล่ 15 หน่วยและม่าน 1 ชั้นให้ผู้เล่น' : ''}${titanSunder ? ' · หมัดประสานกัมปนาท 45 ดาเมจแท้ ลบเกราะเป้าหมายเป็น 0 ถาวร และสตั๊น 1 เทิร์น' : ''}`,
        golemReflectDmg: reflect,
        golemBreakShield: breakShield,
        golemTitanSunder: titanSunder,
      };
    }
    if (wordId === 'dragon') {
      const reflectPct = [50, 65, 80][idx];
      const roarDebuff = tier >= 2 ? 6 : 0;
      const trueDmg = tier === 3;
      return {
        ...base,
        id: 'dragon_drake_sovereign',
        badge: `🐲 สะท้อน ${reflectPct}%${roarDebuff ? ' · คำรามลดโจมตี 6' : ''}${trueDmg ? ' · หมัดมหาวินาศดาเมจแท้ 100%' : ''}`,
        label: `ราชันมังกรโบราณ เกล็ดสะท้อน ${reflectPct}%${roarDebuff ? ' & คำรามข่มขวัญลดโจมตี 6' : ''}${trueDmg ? ' & หมัดประสานเป็นดาเมจแท้ข้ามเกราะและม่าน' : ''}`,
        description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เกล็ดมังกรสะท้อนความเสียหาย ${reflectPct}% คืนผู้โจมตี${roarDebuff ? ' · เมื่อลงสนาม คำรามลดพลังโจมตีศัตรูทุกคน -6 หน่วย 2 เทิร์น' : ''}${trueDmg ? ' · หมัดประสานเทิร์น 2 แปลงเป็นดาเมจแท้ 100% ข้ามม่านและเกราะทั้งหมด' : ''}`,
        dragonReflectPct: reflectPct,
        dragonRoarDebuff: roarDebuff,
        dragonTrueDamage: trueDmg,
      };
    }
    if (wordId === 'phoenix') {
      const eggRevive = true;
      const cleanseHeal = tier >= 2 ? 15 : 0;
      const playerRevive = tier === 3;
      return {
        ...base,
        id: 'phoenix_immortal_rebirth',
        badge: `🪶 จุติไข่ 1 ครั้ง${cleanseHeal ? ' · ล้างดีบัฟ/ฮีล 15' : ''}${playerRevive ? ' · ชุบชีวิตผู้เล่น 100%' : ''}`,
        label: `วิหคเพลิงอมตะ จุติจากไข่ 1 ครั้ง${cleanseHeal ? ' & ล้างดีบัฟ & ฮีล 15 HP' : ''}${playerRevive ? ' & ชุบชีวิตผู้เล่นเลือดเต็ม/มานาเต็ม' : ''}`,
        description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อฟีนิกซ์แตก จะกลายเป็นไข่และฟื้นคืนชีพ 1 ครั้งด้วย 50% HP${cleanseHeal ? ' · สวนกลับชำระล้างดีบัฟผู้เล่นและฟื้น +15 HP' : ''}${playerRevive ? ' · หากผู้เล่นพลาดท่าถึงชีวิต ฟีนิกซ์สละชีพชุบชีวิตผู้เล่นกลับมาด้วยเลือดเต็ม 100% และมานาเต็ม 12 MP ทันที' : ''}`,
        phoenixEggRevive: eggRevive,
        phoenixCleanseHeal: cleanseHeal,
        phoenixPlayerRevive: playerRevive,
      };
    }
    if (wordId === 'dog') {
      const drawBonus = 1;
      const pierceBonus = [2, 4, 6][idx];
      const alphaDouble = tier === 3;
      return {
        ...base,
        id: 'dog_pack_alpha',
        badge: `🐕 จั่ว +1 · เจาะ +${pierceBonus}${alphaDouble ? ' · หมัดแฝดจั่ว +1' : ''}`,
        label: `จ่าฝูงหมาล่าเนื้อ จั่ว +1 ใบ & เจาะ +${pierceBonus}${alphaDouble ? ' & หมัดประสานคู่' : ''}`,
        description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เมื่อลงสนามจั่ว +1 ใบ และเจาะเกราะ +${pierceBonus}${alphaDouble ? ' · หมัดประสานออกท่าเบิ้ล 2 ครั้งและจั่วเพิ่มอีก +1 ใบ' : ''}`,
        creatureDrawOnSummon: drawBonus,
        pierceBonus,
        dogAlphaDoubleStrike: alphaDouble,
      };
    }
    const bonusHp = [10, 20, 35][idx];
    const bonusDmg = [4, 8, 15][idx];
    const extraPierce = tier >= 2 ? 2 : 0;
    return {
      ...base,
      id: `${wordId}_awakened_beast`,
      badge: `${c.glyph} HP +${bonusHp} · ดาเมจ +${bonusDmg}${extraPierce ? ` · เจาะ +${extraPierce}` : ''}`,
      label: `${c.name}ตื่นรู้ HP +${bonusHp} & ดาเมจ +${bonusDmg}${extraPierce ? ` & เจาะเกราะ +${extraPierce}` : ''}`,
      description: `ปลดล็อกที่ +7 (+9/+10 แรงขึ้น): เพิ่ม HP สิ่งอัญเชิญ +${bonusHp} และพลังโจมตี/สวนกลับ +${bonusDmg}${extraPierce ? ` พร้อมเจาะเกราะ +${extraPierce}` : ''}`,
      creatureBonusHp: bonusHp,
      creatureBonusDmg: bonusDmg,
      pierceBonus: extraPierce,
    };
  }
  if (ATTACK_FORMS.includes(wordId)) {
    return {
      ...base,
      id: 'minor_shield',
      badge: `🛡 เกราะเสริม +${bonusAmount}${extraPierce ? ` · เจาะ +${extraPierce}` : ''}`,
      label: `เกราะสะท้อนเวท +${bonusAmount}${extraPierce ? ` & เจาะเกราะ +${extraPierce}` : ''}`,
      description: `ปลดล็อกเมื่อตีบวกถึง +7 (+9/+10 แรงขึ้น): เมื่อร่ายคาถาโจมตีที่มีคำนี้ จะได้เกราะป้องกันชั่วคราว +${bonusAmount} หน่วยทันที${extraPierce ? ` และเจาะเกราะ +${extraPierce}` : ''}`,
      shieldBonus: bonusAmount,
      pierceBonus: extraPierce,
    };
  }
  if (ELEMENTS.includes(wordId)) {
    return {
      ...base,
      id: 'aegis_ward',
      badge: `🛡 เกราะธาตุ +${bonusAmount}${extraPierce ? ` · เจาะ +${extraPierce}` : ''}`,
      label: `เกราะธาตุคุ้มกาย +${bonusAmount}${extraPierce ? ` & เจาะเกราะ +${extraPierce}` : ''}`,
      description: `ปลดล็อกเมื่อตีบวกถึง +7 (+9/+10 แรงขึ้น): เมื่อร่ายคาถาที่มีธาตุนี้ จะได้เกราะป้องกันชั่วคราว +${bonusAmount} หน่วยทันที${extraPierce ? ` และเจาะเกราะ +${extraPierce}` : ''}`,
      shieldBonus: bonusAmount,
      pierceBonus: extraPierce,
    };
  }
  return {
    ...base,
    id: 'arcane_guard',
    badge: `🛡 เกราะ +${bonusAmount} · เจาะ +${1 + extraPierce}`,
    label: `เกราะรูนเสริม +${bonusAmount} & เจาะเกราะ +${1 + extraPierce}`,
    description: `ปลดล็อกเมื่อตีบวกถึง +7 (+9/+10 แรงขึ้น): เมื่อร่ายคาถาที่มีคำนี้ จะได้เกราะป้องกันชั่วคราว +${bonusAmount} หน่วย และเจาะเกราะศัตรูเพิ่ม +${1 + extraPierce}`,
    shieldBonus: bonusAmount,
    pierceBonus: 1 + extraPierce,
  };
}

export function describeCardUpgradeEffect(wordId, level = 0) {
  const nextLv = Math.max(1, level);
  if (wordId === 'summon') return `HP สิ่งอัญเชิญทุกตัว +${nextLv * 2} · ดาเมจ +${nextLv * 2}% · ลดดาเมจรับ -${Math.floor(nextLv / 3)}`;
  if (CREATURE_STATS[wordId]) {
    const stats = CREATURE_STATS[wordId];
    const hpInc = (stats.growthHp * nextLv).toFixed(1).replace(/\.0$/, '');
    const dmgInc = (stats.growthDmg * nextLv).toFixed(1).replace(/\.0$/, '');
    return `HP สิ่งอัญเชิญ +${hpInc} · ดาเมจสวน/ตีประสาน +${dmgInc}`;
  }
  if (wordId === 'light') return `ค่าร่าย −1 มานา · โทษพลังเหลือ −${lightDamagePenalty(nextLv)}%`;
  if (wordId === 'delay') return `โล่เทิร์นหน้า ${WORDS.delay.shieldHp + nextLv} หน่วย (+${nextLv})`;
  if (wordId === 'axe') return `พลังขวานพื้นฐาน +${nextLv} ก่อนคิดตัวคูณ 80%`;
  if (wordId === 'timestop') return `ต้นเทิร์นหลังหยุดเวลา ฟื้นมานาเพิ่ม ${nextLv} หน่วย (สูงสุด Max MP)`;
  if (wordId === 'ascension') return `เปิดจุติใช้ ${ascensionCost(nextLv)} มานา · เทิร์นจุติร่ายฟรี`;
  if (wordId === 'veil') return `ความจุม่าน +${nextLv * 3} · กันส่วนล้น +${nextLv * 2}`;
  if (wordId === 'blackhole') return `แรงยุบหลุมดำ +${nextLv * 15} · กระแทกดูดชน +${nextLv * 5}`;
  if (wordId === 'meteor') return `แรงหลักอุกกาบาต +${nextLv * 3} · กระจาย +${nextLv * 2}`;
  if (wordId === 'death') return `คืนมานา +${nextLv} · พิพากษาบอส ${100 + nextLv * 25} แท้`;
  if (wordId === 'ice') {
    const extraChill = Math.floor(nextLv / 3);
    return `ดาเมจพื้นฐาน +${nextLv}${extraChill > 0 ? ` · หนาวลดโจมตี +${extraChill}` : ' (หนาว +1 ทุก 3 ขั้น)'}`;
  }
  if (wordId === 'earth') {
    const extraBlock = Math.floor(nextLv / 2);
    return `ดาเมจพื้นฐาน +${nextLv}${extraBlock > 0 ? ` · เกราะดิน +${extraBlock}` : ' (เกราะดิน +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'water') {
    const extraHeal = Math.floor(nextLv / 2);
    return `ดาเมจพื้นฐาน +${nextLv}${extraHeal > 0 ? ` · ฟื้นฟู +${extraHeal} HP` : ' (ฮีล +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'wind') {
    const extraSlam = Math.floor(nextLv / 2);
    return `ดาเมจพื้นฐาน +${nextLv}${extraSlam > 0 ? ` · กระแทกชน +${extraSlam}` : ' (กระแทกชน +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'self') {
    return `ฟื้นฟู +${nextLv * 2} HP · เกราะคุ้มตัว +${nextLv}`;
  }
  if (wordId === 'blast') {
    return `แรงระเบิด +${nextLv * 2}`;
  }
  if (wordId === 'beam') {
    const extraPierce = Math.floor(nextLv / 3);
    return `ดาเมจลำแสง +${nextLv}${extraPierce > 0 ? ` · เจาะเกราะ +${extraPierce}` : ' (เจาะเกราะ +1 ทุก 3 ขั้น)'}`;
  }
  if (wordId === 'wave') {
    return `ดาเมจคลื่น +${nextLv * 2} (ก่อนคูณ 0.6×)`;
  }
  if (wordId === 'heal') {
    const extraPct = Math.floor(nextLv / 2);
    return `ฟื้นฟู +${nextLv * 2} HP${extraPct > 0 ? ` · +${extraPct}% Max HP` : ' (+1% Max HP ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'burn') {
    return `เผาไหม้แรงขึ้น +${nextLv * 2}`;
  }
  if (wordId === 'push') {
    return `พลังร่วมวลี +${nextLv} · กระแทกชน/ขอบ +${nextLv}`;
  }
  if (wordId === 'pull') {
    return `พลังร่วมวลี +${nextLv} · กระชากชน/ขอบ +${nextLv}`;
  }
  if (wordId === 'large') {
    return `โจมตี +${nextLv} · โล่/ฮีล +${nextLv * 2}`;
  }
  if (wordId === 'akki') {
    return `ดาเมจพื้นฐานอัคคี +${nextLv * 2}`;
  }
  if (wordId === 'heman') {
    const extraChill = Math.floor(nextLv / 2);
    return `ดาเมจพื้นฐานเหมันต์ +${nextLv * 2}${extraChill > 0 ? ` · หนาว +${extraChill}` : ' (หนาว +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'asani') {
    return `ดาเมจพื้นฐานอัสนี +${nextLv * 2}`;
  }
  if (wordId === 'pathaphi') {
    return `ดาเมจพื้นฐานปฐพี +${nextLv * 2} · เกราะดิน +${nextLv}`;
  }
  if (wordId === 'wari') {
    return `ดาเมจพื้นฐานวารี +${nextLv * 2} · ฟื้นฟู +${nextLv} HP`;
  }
  if (wordId === 'vayu') {
    return `ดาเมจพื้นฐานวายุ +${nextLv * 2} · กระแทกชน/ขอบ +${nextLv}`;
  }
  if (wordId === 'freeze') {
    const extraChill = Math.floor(nextLv / 3);
    return `พลังร่วมวลี +${nextLv * 2}${extraChill > 0 ? ` · หนาว +${extraChill}` : ' (หนาว +1 ทุก 3 ขั้น)'}`;
  }
  if (wordId === 'pierce') {
    const extraPierce = Math.floor(nextLv / 2);
    return `พลังร่วมวลี +${nextLv}${extraPierce > 0 ? ` · เจาะเกราะ +${extraPierce}` : ' (เจาะเกราะ +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'grand') {
    return `โจมตี +${nextLv * 2} · โล่/ฮีล +${nextLv * 3}`;
  }
  if (wordId === 'seal') {
    return `พลังร่วมวลี +${nextLv * 2}`;
  }
  if (wordId === 'dispel') {
    return `พลังร่วมวลี +${nextLv * 2}`;
  }
  if (wordId === 'brace') {
    return `ความจุโล่ +${nextLv * 2} · โบนัสยืนหยัด +${nextLv * 2}`;
  }
  if (wordId === 'magma') {
    return `ดาเมจพื้นฐานแมกม่า +${nextLv * 2} · แอ่งปะทุ +${nextLv * 2}`;
  }
  if (wordId === 'mudmire') {
    const extraChill = Math.floor(nextLv / 2);
    return `ดาเมจพื้นฐานบึงโคลน +${nextLv * 2} · เกราะโคลน +${nextLv}${extraChill > 0 ? ` · หนาว +${extraChill}` : ' (หนาว +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'dust') {
    return `ดาเมจพื้นฐานธุลี +${nextLv * 2} · กระแทกชน/ขอบ +${nextLv}`;
  }
  if (wordId === 'permafrost') {
    return `ดาเมจพื้นฐานเยือกศิลา +${nextLv * 2} · เกราะน้ำแข็ง +${nextLv * 2}`;
  }
  if (wordId === 'magnet') {
    return `ดาเมจพื้นฐานแม่เหล็ก +${nextLv * 2} · กระแทกดูดชน +${nextLv * 2}`;
  }
  if (wordId === 'mist') {
    const extraChill = Math.floor(nextLv / 2);
    return `ดาเมจพื้นฐานหมอก +${nextLv * 2} · เผา +${nextLv}${extraChill > 0 ? ` · หนาว +${extraChill}` : ' (หนาว +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'hail') {
    const extraChill = Math.floor(nextLv / 2);
    return `ดาเมจพื้นฐานหิมะ +${nextLv * 2}${extraChill > 0 ? ` · เป้าแห้งหนาว +${extraChill}` : ' (เป้าแห้งหนาว +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'monsoon') {
    return `ดาเมจพื้นฐานมรสุม +${nextLv * 2} · กระแทกชน +${nextLv} · ฟื้นฟู +${nextLv} HP`;
  }
  if (wordId === 'shockstream') {
    return `ดาเมจพื้นฐานกระแสช็อต +${nextLv * 2} · ช็อตเป้าเปียก +${nextLv * 2}`;
  }
  if (wordId === 'thunderstorm') {
    return `ดาเมจพื้นฐานฟ้าคะนอง +${nextLv * 2} · กระแทกชน +${nextLv}`;
  }
  if (wordId === 'heatwave') {
    return `ดาเมจพื้นฐานระอุ +${nextLv * 2} · เผาข้างเคียง +${nextLv} · กระแทกชน +${nextLv}`;
  }
  if (wordId === 'chillgale') {
    const extraChill = Math.floor(nextLv / 2);
    return `ดาเมจพื้นฐานไอหนาว +${nextLv * 2} · กระแทกชน +${nextLv}${extraChill > 0 ? ` · หนาว +${extraChill}` : ' (หนาว +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'plasma') {
    return `ดาเมจพื้นฐานพลาสมา +${nextLv * 3}`;
  }
  if (wordId === 'scald') {
    const extra = Math.floor(nextLv / 2);
    return `ดาเมจพื้นฐานไอเดือด +${nextLv * 2}${extra > 0 ? ` · เผา/หนาว +${extra}` : ' (เผา/หนาว +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'frostvolt') {
    const extraChill = Math.floor(nextLv / 2);
    return `ดาเมจพื้นฐานผลึกช็อต +${nextLv * 2}${extraChill > 0 ? ` · หนาว +${extraChill}` : ' (หนาว +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'chakram') {
    return `ดาเมจกรงจักร +${nextLv * 2} (ก่อนคูณ 180%)`;
  }
  if (wordId === 'storm') {
    return `ดาเมจพายุ +${nextLv * 2} (ก่อนคูณ 150%/75%)`;
  }
  if (wordId === 'barrage') {
    return `พลังร่วมวลี +${nextLv * 2} ต่อครั้ง (×5 ครั้ง)`;
  }
  if (wordId === 'devastation') {
    return `พลังหลัก +${nextLv * 2} · แรงระเบิดกระจาย +${nextLv * 3}`;
  }
  if (wordId === 'spear') {
    const extraPierce = Math.floor(nextLv / 3);
    return `ดาเมจหอก +${nextLv}${extraPierce > 0 ? ` · เจาะเกราะ +${extraPierce}` : ' (เจาะเกราะ +1 ทุก 3 ขั้น)'}`;
  }
  if (wordId === 'empower') {
    return `บัฟพลังธาตุแรงขึ้น +${nextLv * 3}%`;
  }
  if (wordId === 'bless') {
    return `บัฟพลังธาตุอวยพรแรงขึ้น +${nextLv * 4}%`;
  }
  if (wordId === 'fill') {
    const extraMp = Math.floor(nextLv / 2);
    return `เติมเลือด +${nextLv} HP${extraMp > 0 ? ` · เติมมานา +${extraMp} MP` : ' (เติมมานา +1 ทุก 2 ขั้น)'}`;
  }
  if (wordId === 'blood') {
    return `เติมเลือดแรงขึ้น +${nextLv} HP`;
  }
  if (wordId === 'mana') {
    return `เติมมานาแรงขึ้น +${Math.ceil(nextLv / 2)} MP`;
  }
  if (ELEMENTS.includes(wordId)) {
    return `ดาเมจพื้นฐานธาตุ +${nextLv}`;
  }
  if (ATTACK_FORMS.includes(wordId)) {
    return `โบนัสดาเมจรูปทรง +${nextLv}`;
  }
  if (wordId === 'shield') {
    return `ความจุโล่ +${nextLv * 2} ต่อชั้น`;
  }
  return `พลังเวทเมื่อร่วมวลี +${nextLv}`;
}

export const RELIC_DRAFT_CATALOG = Object.freeze([
  {
    id: 'ember_core_10',
    name: 'แก่นเพลิงบรรพกาล',
    dropFloor: 10,
    icon: '🔥',
    summary: 'ดาเมจธาตุไฟทั้งหมด +2 และสถานะเผาไหม้แรงขึ้น +1',
    status: 'ดรอปจากบอสพิเศษชั้นที่ 10 (พร้อมใช้งาน)',
  },
  {
    id: 'storm_pendulum_20',
    name: 'ลูกตุ้มสายฟ้าฟาด',
    dropFloor: 20,
    icon: '⚡',
    summary: 'คาถาที่มีคำว่า “คู่” คืนมานา +1 หลังร่ายสำเร็จ',
    status: 'ดรอปจากบอสพิเศษชั้นที่ 20 (พร้อมใช้งาน)',
  },
  {
    id: 'forbidden_crown_30',
    name: 'มงกุฎอักษรต้องห้าม',
    dropFloor: 30,
    icon: '👑',
    summary: 'ร่ายคาถา 4 คำสำเร็จ คืนมานา 2 หลังร่าย',
    status: 'ดรอปจากบอสหลักชั้น 30',
  },
  {
    id: 'mirror_prism_40', name: 'ปริซึมกระจกจันทรา', dropFloor: 40, icon: '💎',
    summary: 'คาถาลำแสงข้ามเกราะเพิ่ม 3 หน่วย',
    status: 'ดรอปจากบอสหลักชั้น 40',
  },
  {
    id: 'worldloom_50', name: 'แกนกี่ทอโลก', dropFloor: 50, icon: '🧵',
    summary: 'ตั้งรับพื้นฐานกันเพิ่ม 3 และโล่เวทแต่ละชั้นเพิ่ม 3',
    status: 'ดรอปจากบอสหลักชั้น 50',
  },
  ...ENDGAME_RELICS,
]);

export function getEquippedRelics(player) {
  const owned = Array.isArray(player?.relics) ? player.relics : [];
  if (Array.isArray(player?.equippedRelics)) {
    return player.equippedRelics
      .filter((id, idx, arr) => owned.includes(id) && arr.indexOf(id) === idx)
      .slice(0, MAX_RELIC_SLOTS);
  }
  return owned
    .filter((id, idx, arr) => arr.indexOf(id) === idx)
    .slice(0, MAX_RELIC_SLOTS);
}

export function grantBossRelic(player, floor) {
  const relic = RELIC_DRAFT_CATALOG.find(entry => entry.dropFloor === floor);
  if (!relic || (player.relics ?? []).includes(relic.id)) return null;
  const equipped = getEquippedRelics(player);
  player.relics ??= [];
  player.relics.push(relic.id);
  if (equipped.length < MAX_RELIC_SLOTS) player.equippedRelics = [...equipped, relic.id];
  return relic.id;
}

export function equipRelic(original, relicId) {
  if (!original || original.phase !== 'sanctuary') {
    throw new Error('ปรับเปลี่ยนเครื่องรางได้เฉพาะในจุดพักและร้านค้า');
  }
  const catalogEntry = RELIC_DRAFT_CATALOG.find(r => r.id === relicId);
  if (!catalogEntry) throw new Error('ไม่พบข้อมูลอาติแฟคนี้');
  const owned = original.player?.relics ?? [];
  if (!owned.includes(relicId)) {
    throw new Error('ยังไม่ได้ครอบครองอาติแฟคชิ้นนี้');
  }
  const current = getEquippedRelics(original.player);
  if (current.includes(relicId)) {
    throw new Error(`สวมใส่ “${catalogEntry.name}” อยู่ในช่องเครื่องรางแล้ว`);
  }
  if (current.length >= MAX_RELIC_SLOTS) {
    throw new Error(`ช่องใส่เครื่องรางเต็มแล้ว (${MAX_RELIC_SLOTS}/${MAX_RELIC_SLOTS} ช่อง) · ถอดชิ้นอื่นออกก่อน`);
  }
  const state = structuredClone(original);
  state.player.equippedRelics = [...current, relicId];
  return state;
}

export function getHandLimit(player) {
  return HAND_LIMIT + (getEquippedRelics(player).includes('crown_of_eternity_100') ? 2 : 0);
}

export function getMaxMana(player) {
  return (player?.maxMana ?? MAX_MANA) + (getEquippedRelics(player).includes('crown_of_eternity_100') ? 3 : 0);
}

export function unequipRelic(original, relicId) {
  if (!original || original.phase !== 'sanctuary') {
    throw new Error('ปรับเปลี่ยนเครื่องรางได้เฉพาะในจุดพักและร้านค้า');
  }
  const catalogEntry = RELIC_DRAFT_CATALOG.find(r => r.id === relicId);
  const current = getEquippedRelics(original.player);
  if (!current.includes(relicId)) {
    throw new Error(`ไม่ได้สวมใส่ “${catalogEntry?.name ?? relicId}” อยู่ในช่องเครื่องราง`);
  }
  const state = structuredClone(original);
  state.player.equippedRelics = current.filter(id => id !== relicId);
  state.player.mana = Math.min(state.player.mana, getMaxMana(state.player));
  return state;
}

// Keep the opening climb at its original pace through the first major boss.
const EARLY_LEVEL_CAP = 25;
const LATE_LEVEL_START = 80;

export function nextExpForLevel(level = 1) {
  if (level < EARLY_LEVEL_CAP) return 25;
  if (level <= LATE_LEVEL_START) return 55;
  return 55 + (level - LATE_LEVEL_START) * 10;
}

export function levelUpRewards(level) {
  const middleLevel = level > EARLY_LEVEL_CAP && level <= LATE_LEVEL_START;
  return { hpGain: middleLevel ? 5 : level <= EARLY_LEVEL_CAP ? 3 : 2, mpGain: level % 5 === 0 ? (middleLevel ? 4 : 2) : 0 };
}

export function applyExpAndGold(player, expGain = 0, goldGain = 0) {
  player.level ??= 1;
  player.exp = (player.exp ?? 0) + expGain;
  player.gold = (player.gold ?? 0) + goldGain;
  const levelUps = [];
  while (player.exp >= nextExpForLevel(player.level)) {
    player.exp -= nextExpForLevel(player.level);
    player.level += 1;
    const { hpGain, mpGain } = levelUpRewards(player.level);
    player.maxHp += hpGain;
    player.hp = Math.min(player.maxHp, player.hp + hpGain);
    if (mpGain > 0) {
      player.maxMana += mpGain;
      player.mana = Math.min(getMaxMana(player), player.mana + mpGain);
    }
    levelUps.push({ level: player.level, hpGain, mpGain });
  }
  return levelUps;
}

export const FLOOR4_BOUNDARY_ROOM = 11;
export const FLOOR5_SANCTUARY = 5;
export const FLOOR6_START_ROOM = 12;
export const FLOOR9_BOUNDARY_ROOM = 23;
export const FLOOR10_BOSS_ROOM = 24;
export const FLOOR11_START_ROOM = 25;
export const FLOOR14_BOUNDARY_ROOM = 36;
export const FLOOR15_SANCTUARY = 15;
export const FLOOR16_START_ROOM = 37;
export const FLOOR19_BOUNDARY_ROOM = 48;
export const FLOOR20_BOSS_ROOM = 49;
export const FLOOR21_START_ROOM = 50;
export const FLOOR24_BOUNDARY_ROOM = 61;
export const FLOOR25_SANCTUARY = 25;
export const FLOOR26_START_ROOM = 62;
export const FLOOR29_BOUNDARY_ROOM = 73;
export const FLOOR30_BOSS_ROOM = 74;
export const FLOOR31_START_ROOM = 75;
export const FLOOR34_BOUNDARY_ROOM = 86;
export const FLOOR35_SANCTUARY = 35;
export const FLOOR36_START_ROOM = 87;
export const FLOOR39_BOUNDARY_ROOM = 98;
export const FLOOR40_BOSS_ROOM = 99;
export const FLOOR41_START_ROOM = 100;
export const FLOOR44_BOUNDARY_ROOM = 111;
export const FLOOR45_SANCTUARY = 45;
export const FLOOR46_START_ROOM = 112;
export const FLOOR49_BOUNDARY_ROOM = 123;
export const FLOOR50_BOSS_ROOM = 124;
export const FLOOR51_START_ROOM = 125;
export const FLOOR54_BOUNDARY_ROOM = 136;
export const FLOOR55_SANCTUARY = 55;
export const FLOOR56_START_ROOM = 137;
export const FLOOR59_BOUNDARY_ROOM = 148;
export const FLOOR60_BOSS_ROOM = 149;
export const FLOOR61_START_ROOM = 150;
export const FLOOR64_BOUNDARY_ROOM = 161;
export const FLOOR65_SANCTUARY = 65;
export const FLOOR66_START_ROOM = 162;
export const FLOOR69_BOUNDARY_ROOM = 173;
export const FLOOR70_BOSS_ROOM = 174;
export const FLOOR71_START_ROOM = 175;
export const FLOOR74_BOUNDARY_ROOM = 186;
export const FLOOR75_SANCTUARY = 75;
export const FLOOR76_START_ROOM = 187;
export const FLOOR79_BOUNDARY_ROOM = 198;
export const FLOOR80_BOSS_ROOM = 199;
export const FLOOR81_START_ROOM = 200;
export const FLOOR84_BOUNDARY_ROOM = 211;
export const FLOOR85_SANCTUARY = 85;
export const FLOOR86_START_ROOM = 212;
export const FLOOR89_BOUNDARY_ROOM = 223;
export const FLOOR90_BOSS_ROOM = 224;
export const FLOOR91_START_ROOM = 225;
export const FLOOR94_BOUNDARY_ROOM = 236;
export const FLOOR95_SANCTUARY = 95;
export const FLOOR96_START_ROOM = 237;
export const FLOOR99_BOUNDARY_ROOM = 248;
export const FLOOR100_BOSS_ROOM = 249;
export const ETERNITY_FIRST_FORM_HP = ETERNITY_PHASE_HP[0] + ETERNITY_PHASE_HP[1];
export const ETERNITY_TOTAL_HP = ETERNITY_FIRST_FORM_HP + ETERNITY_PHASE_HP[2];

export function encounterMaxHp(kind, room) {
  return kind === 'eternity_overlord' && room === FLOOR100_BOSS_ROOM ? ETERNITY_FIRST_FORM_HP : ENEMIES[kind].hp;
}

export function eternityDamageLimit(state, enemy) {
  return state.room === FLOOR100_BOSS_ROOM && !state.rift && !state.eternityPhase && enemy.kind === 'eternity_overlord'
    ? Math.max(0, enemy.hp - ETERNITY_PHASE_HP[1])
    : enemy.hp;
}

export function eternityHealth(state, phase = state.eternityPhase ?? 1, hp = null) {
  if (state.room !== FLOOR100_BOSS_ROOM || state.rift) return null;
  const boss = state.enemies.find(enemy => enemy.kind === (phase === 3 ? 'eternity_reborn' : 'eternity_overlord'));
  if (!boss && hp === null) return null;
  const formHp = hp ?? boss.hp;
  if (phase === 3) {
    return { phase: 3, remaining: formHp, total: ETERNITY_PHASE_HP[2], revealed: true };
  }
  return { phase, remaining: formHp, total: ETERNITY_FIRST_FORM_HP, revealed: false };
}

export const TOTAL_TOWER_ROOMS = 250;

// Aliases for legacy exports
export const FLOOR5_START_ROOM = FLOOR6_START_ROOM;
export const FLOOR8_BOSS_ROOM = FLOOR9_BOUNDARY_ROOM;
export const FLOOR13_BOSS_ROOM = FLOOR14_BOUNDARY_ROOM;
export const FLOOR15_START_ROOM = FLOOR16_START_ROOM;
export const FLOOR18_BOSS_ROOM = FLOOR19_BOUNDARY_ROOM;
export const FLOOR25_BOSS_ROOM = FLOOR24_BOUNDARY_ROOM;

export const UPPER_RESTS = Object.freeze(Object.fromEntries(
  [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map(floor => [`post${floor}`, Math.floor((floor - 1) / 10) * 25 + 24]),
));
const PULL_REWARD_ROOM = 76;
const UPPER_TOWER = [
  [['aether_warden', 'ward_scribe']],
  [['rune_ram', 'void_imp']],
  [['ward_keeper', 'obsidian_golem']],
  [['rune_ram', 'void_imp', 'ward_scribe']],
  [['seal_curator', 'ward_keeper']],
  [['ward_keeper', 'rune_ram'], ['void_imp', 'ward_keeper', 'ward_scribe']],
  [['rune_ram', 'void_imp', 'ward_scribe'], ['ward_keeper', 'rune_ram', 'ward_scribe']],
  [['void_imp', 'rune_ram', 'ward_keeper'], ['rune_ram', 'ward_keeper', 'obsidian_golem']],
  [['ward_keeper', 'rune_ram', 'ward_scribe']],
  [['crown_archivist', 'rune_ram', 'ward_scribe']],
];
export const UPPER_REWARD_WORDS = ['seal', 'dispel', 'brace'];
const UPPER_CARD_ROOMS = [51, 53, 61, 74];
export const isUpperCacheRoom = room => room === PULL_REWARD_ROOM || room === 51 || room === 53;

export function unlockUpperTower(state) {
  state.highestRoom = Math.max(state.highestRoom ?? 0, FLOOR21_START_ROOM);
  if (state.phase === 'won' && state.room === FLOOR20_BOSS_ROOM) {
    state.phase = 'sanctuary';
    state.sanctuaryFloor = 'post20';
  }
}

export function unlockEndgameTower(state) {
  state.highestRoom = Math.max(state.highestRoom ?? 0, FLOOR51_START_ROOM);
  if (state.phase === 'won' && state.room === FLOOR50_BOSS_ROOM) {
    state.phase = 'sanctuary';
    state.sanctuaryFloor = 'post50';
  }
}

export function upperCacheAvailable(state) {
  return UPPER_CARD_ROOMS.includes(state.room) && !state.rewardedBossRooms?.includes(state.room)
    && UPPER_REWARD_WORDS.some(id => !state.learned.includes(id) && getCardUpgradeLevel(state, id) < MAX_CARD_UPGRADE);
}

export function hasCardReward(state) {
  if (state?.rift) return false;
  if (state.rewardedBossRooms?.includes(state.room) || isRoomRevisit(state)) return false;
  const rel = state.room % 25;
  if (rel === 24) return false;
  return isBossRoom(state) && getRewardPool(state).length > 0;
}

export function cardRewardReplacesBounty(state) {
  return true;
}

export function completeUpperFloor(state) {
  if (state.room === FLOOR30_BOSS_ROOM) {
    if ((state.rooms?.length ?? 0) < TOTAL_TOWER_ROOMS) {
      state.rooms = buildTowerRooms(state.seed, state.tutorial);
    }
    state.phase = 'sanctuary';
    state.sanctuaryFloor = 'post30';
    state.sanctuaryRested = false;
    state.highestRoom = Math.max(state.highestRoom ?? 0, FLOOR31_START_ROOM);
    return true;
  }
  if (state.room === FLOOR50_BOSS_ROOM) {
    if ((state.rooms?.length ?? 0) < TOTAL_TOWER_ROOMS) {
      state.rooms = buildTowerRooms(state.seed, state.tutorial);
    }
    state.sanctuaryUnlocked = true;
    state.phase = 'sanctuary';
    state.sanctuaryFloor = 'post50';
    state.sanctuaryRested = false;
    state.highestRoom = Math.max(state.highestRoom ?? 0, FLOOR51_START_ROOM);
    return true;
  }
  if (state.room === FLOOR100_BOSS_ROOM) {
    state.phase = 'won';
    return true;
  }
  return false;
}
export const TOWER_COMBAT_FLOORS = Object.freeze(
  Array.from({ length: 100 }, (_, i) => i + 1).filter(f => f % 10 !== 5)
);

export function getFloorStartRoom(floorNum) {
  const D = Math.floor((floorNum - 1) / 10);
  const rem = ((floorNum - 1) % 10) + 1;
  if (rem >= 1 && rem <= 4) {
    return D * 25 + (rem - 1) * 3;
  }
  if (rem === 5) {
    return D * 25 + 12;
  }
  if (rem >= 6 && rem <= 9) {
    return D * 25 + 12 + (rem - 6) * 3;
  }
  if (rem === 10) {
    return D * 25 + 24;
  }
  return 0;
}

export function getFloorInfo(roomIndex = 0, totalRooms = TOTAL_TOWER_ROOMS) {
  if (totalRooms === 6) {
    const perFloor = 2;
    const floor = Math.floor(roomIndex / perFloor) + 1;
    const sub = (roomIndex % perFloor) + 1;
    const isBoss = sub === perFloor;
    const code = `${floor}-${sub}`;
    return {
      floor, sub, subRoomCount: 1, perFloor, code,
      displayName: isBoss ? `บอสชั้น ${floor}` : `ห้องย่อย ${code}`,
      roomRole: isBoss ? `ห้องบอสประจำชั้น ${floor}` : `ห้องย่อยที่ ${sub}/1`,
      isBoss,
      title: isBoss ? `ชั้นที่ ${floor} · ห้องบอสประจำชั้น ${floor} (${code})` : `ชั้นที่ ${floor} · ห้องย่อยที่ ${sub}/1 (${code})`,
    };
  }

  const D = Math.floor(roomIndex / 25);
  const rel = roomIndex % 25;

  if (rel < 12) {
    const floorOffset = Math.floor(rel / 3);
    const sub = (rel % 3) + 1;
    const floor = D * 10 + 1 + floorOffset;
    const isBoss = sub === 3;
    const code = `${floor}-${sub}`;
    const displayName = isBoss ? `บอสชั้น ${floor}` : `ห้องย่อย ${code}`;
    const roomRole = isBoss ? `ห้องบอสประจำชั้น ${floor}` : `ห้องย่อยที่ ${sub}/2`;
    return {
      floor,
      sub,
      subRoomCount: 2,
      perFloor: 3,
      code,
      displayName,
      roomRole,
      isBoss,
      title: isBoss
        ? `ชั้นที่ ${floor} · ห้องบอสประจำชั้น ${floor} (${code})`
        : `ชั้นที่ ${floor} · ห้องย่อยที่ ${sub}/2 (${code})`,
    };
  }

  if (rel < 24) {
    const floorOffset = Math.floor((rel - 12) / 3);
    const sub = ((rel - 12) % 3) + 1;
    const floor = D * 10 + 6 + floorOffset;
    const isBoss = sub === 3;
    const code = `${floor}-${sub}`;
    const displayName = isBoss ? `บอสชั้น ${floor}` : `ห้องย่อย ${code}`;
    const roomRole = isBoss ? `ห้องบอสประจำชั้น ${floor}` : `ห้องย่อยที่ ${sub}/2`;
    return {
      floor,
      sub,
      subRoomCount: 2,
      perFloor: 3,
      code,
      displayName,
      roomRole,
      isBoss,
      title: isBoss
        ? `ชั้นที่ ${floor} · ห้องบอสประจำชั้น ${floor} (${code})`
        : `ชั้นที่ ${floor} · ห้องย่อยที่ ${sub}/2 (${code})`,
    };
  }

  // rel === 24: Major Boss
  const floor = D * 10 + 10;
  const isFinalBoss = floor === 100;
  const code = `${floor}★`;
  const displayName = isFinalBoss ? 'บอสใหญ่สุดชั้น 100 (Endgame Final Boss)' : floor === 50 ? 'บอสใหญ่ชั้น 50' : `บอสพิเศษชั้น ${floor}`;
  const roomRole = isFinalBoss ? 'ห้องบอสใหญ่สุดประจำหอคอย' : `ห้องบอสพิเศษประจำชั้น ${floor}`;
  return {
    floor,
    sub: 1,
    subRoomCount: 0,
    perFloor: 1,
    code,
    displayName,
    roomRole,
    isBoss: true,
    isFinalBoss,
    title: `ชั้นที่ ${floor} · ${roomRole} (${code})`,
  };
}

export function random(state) {
  let x = state.rng >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.rng = x >>> 0;
  return state.rng / 4294967296;
}

function pick(state, values) { return values[Math.floor(random(state) * values.length)]; }

export function seedNumber(seed) {
  let hash = 2166136261;
  for (const char of String(seed)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0 || 1;
}

export const MAX_MANA = 12;
export const HAND_LIMIT = 10;
export const TURN_DRAW = 3;

const activeBattleDeck = state => state.player.words.filter(id => !isBattleWordSpent(state, id));

export function openHand(state) {
  const deck = activeBattleDeck(state);
  const draw = { rng: seedNumber(JSON.stringify([state.seed, state.room, state.turn])) };
  const form = pick(draw, deck.filter(id => ATTACK_FORMS.includes(id)));
  const element = pick(draw, deck.filter(id => ELEMENTS.includes(id)));
  const hand = [form, element];
  const openingSize = 5 + (getEquippedRelics(state.player).includes('crown_of_eternity_100') ? 2 : 0);
  const remaining = deck.filter(id => !hand.includes(id));
  while (hand.length < openingSize && remaining.length) {
    const id = pick(draw, remaining);
    hand.push(id);
    remaining.splice(remaining.indexOf(id), 1);
  }
  while (hand.length < openingSize && deck.length) {
    hand.push(pick(draw, deck));
  }
  state.player.hand = hand;
  state.handRng = draw.rng;
}

export function drawCards(state, count = TURN_DRAW) {
  const { hand } = state.player;
  const deck = activeBattleDeck(state);
  const draw = { rng: state.handRng };
  for (let i = 0; i < count; i++) hand.push(pick(draw, deck));
  state.handRng = draw.rng;
}

export function discardOverflow(original, indices) {
  const hand = original.player.hand;
  const excess = hand.length - getHandLimit(original.player);
  if (original.phase !== 'battle' || excess < 1) throw new Error('ทิ้งได้เมื่อจั่วแล้วมือเกิน');
  if (!Array.isArray(indices) || indices.length < excess || indices.length > Math.max(2, excess) ||
      new Set(indices).size !== indices.length || indices.some(index => !Number.isInteger(index) || index < 0 || index >= hand.length)) {
    throw new Error(`เลือกทิ้ง ${excess === 1 ? '1–2' : excess} ใบ`);
  }
  const state = structuredClone(original);
  state.player.hand = hand.filter((_, index) => !indices.includes(index));
  return state;
}

export function createEnemy(kind, index = 0, room = null) {
  const base = ENEMIES[kind];
  const hp = encounterMaxHp(kind, room);
  return { id: `enemy-${index}`, kind, slot: index, hp, maxHp: hp, armor: base.armor, ward: base.ward, affinity: base.affinity ?? null, chill: 0, freeze: 0, burn: 0, burnTurn: 0 };
}

export function prepareEnemies(state) {
  for (const enemy of state.enemies) {
    const base = ENEMIES[enemy.kind];
    enemy.armor = base.armor;
    enemy.ward = enemy.hp > 0 ? base.ward : 0;
    if (base.wardTurn !== undefined && state.turn % 3 !== base.wardTurn) enemy.ward = 0;
    if (base.heavy && state.turn % 3 === 0) enemy.armor = Math.max(0, base.armor - 2);
    if (enemy.kind === 'prism_crab' && state.turn % 3 === 2) enemy.armor = 1;
    if (enemy.kind === 'seal_curator' || enemy.kind === 'crown_archivist') {
      enemy.ward = enemy.hp > 0 && state.turn % 3 === 1 ? base.ward : 0;
      if (state.turn % 3 === 0) enemy.armor = 0;
    }
    if (enemy.kind === 'ward_keeper' && enemy.hp > 0 && state.turn % 3 === 1) enemy.ward = 1;
    if (enemy.kind === 'elite' && state.turn % 2 === 0) enemy.ward = 0;
    if (enemy.kind === 'boss') {
      enemy.ward = enemy.hp > 0 && state.turn % 3 === 1 ? 1 : 0;
      enemy.armor = state.turn % 3 === 0 ? 3 : 0;
    }
    if (enemy.kind === 'mirror_mage') {
      const phase = state.turn % 3;
      enemy.ward = enemy.hp > 0 && phase === 1 ? 1 : 0;
      enemy.armor = phase === 1 ? 1 : phase === 2 ? 3 : 0;
    }
    if (enemy.kind === 'frost_lich') {
      enemy.ward = enemy.hp > 0 && state.turn % 3 === 1 ? 1 : 0;
      enemy.armor = 2;
    }
    if (enemy.kind === 'arch_codex') {
      enemy.ward = enemy.hp > 0 && state.turn % 3 === 1 ? 1 : 0;
      enemy.armor = state.turn % 3 === 0 ? 4 : 2;
    }
    if (enemy.kind === 'ember_overlord') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 || phase === 3) ? 1 : 0;
      enemy.armor = phase === 1 ? 3 : phase === 2 ? 4 : phase === 3 ? 2 : 0;
    }
    if (enemy.kind === 'prism_watcher') {
      enemy.ward = enemy.hp > 0 && state.turn % 2 === 1 ? 1 : 0;
      enemy.armor = 2;
    }
    if (enemy.kind === 'elder_grimoire') {
      const phase = state.turn % 3;
      enemy.ward = enemy.hp > 0 && phase === 1 ? 1 : 0;
      enemy.armor = phase === 0 ? 4 : phase === 2 ? 2 : 1;
    }
    if (enemy.kind === 'eclipse_mage') {
      const phase = state.turn % 3;
      enemy.ward = enemy.hp > 0 && phase === 1 ? 1 : 0;
      enemy.armor = phase === 1 ? 2 : phase === 2 ? 4 : 0;
    }
    if (enemy.kind === 'glacial_sovereign') {
      enemy.ward = enemy.hp > 0 && state.turn % 3 === 1 ? 1 : 0;
      enemy.armor = 3;
    }
    if (enemy.kind === 'nexus_codex') {
      enemy.ward = enemy.hp > 0 && state.turn % 3 === 1 ? 1 : 0;
      enemy.armor = state.turn % 3 === 0 ? 5 : 3;
    }
    if (enemy.kind === 'tempest_archon') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 || phase === 3) ? 1 : 0;
      enemy.armor = phase === 1 ? 4 : phase === 2 ? 5 : phase === 3 ? 3 : 0;
    }
    if (enemy.kind === 'volcano_colossus') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && phase === 1 ? 1 : 0;
      enemy.armor = phase === 1 ? 3 : phase === 2 ? 4 : phase === 3 ? 2 : 0;
    }
    if (enemy.kind === 'thunder_drake_emperor') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 || phase === 3) ? 1 : 0;
      enemy.armor = phase === 1 ? 4 : phase === 2 ? 6 : phase === 3 ? 3 : 0;
    }
    if (enemy.kind === 'ancient_chitin_behemoth') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 || phase === 3) ? 1 : 0;
      enemy.armor = phase === 1 ? 5 : phase === 2 ? 7 : phase === 3 ? 4 : 2;
    }
    if (enemy.kind === 'abyssal_kraken') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 || phase === 3) ? 1 : 0;
      enemy.armor = phase === 1 ? 5 : phase === 2 ? 6 : phase === 3 ? 4 : 0;
    }
    if (enemy.kind === 'nether_dread_lord') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 ? 2 : phase === 3 ? 1 : 0);
      enemy.armor = phase === 1 ? 5 : phase === 2 ? 6 : phase === 3 ? 4 : 0;
    }
    if (enemy.kind === 'eternity_overlord') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 || phase === 3) ? 2 : 0;
      enemy.armor = phase === 1 ? 6 : phase === 2 ? 8 : phase === 3 ? 5 : 0;
      enemy.affinity = state.eternityPhase === 2 ? getEternityShiftAffinity(state.turn) : base.affinity;
    }
    if (enemy.kind === 'eternity_reborn') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 || phase === 3 ? 2 : phase === 2 ? 1 : 0);
      enemy.armor = phase === 1 ? 6 : phase === 2 ? 7 : phase === 3 ? 5 : 0;
      enemy.affinity = getEternityShiftAffinity(state.turn);
    }
    if (enemy.magmaArmorUntil >= state.turn) enemy.armor = Math.max(0, enemy.armor - 2);
    if (enemy.abyssalShockUntil >= state.turn) enemy.armor = Math.max(0, enemy.armor - 2);
    if (enemy.netherPurgeUntil >= state.turn) enemy.armor = Math.max(0, enemy.armor - 2);
    if (enemy.eternityShatterUntil >= state.turn) enemy.armor = Math.max(0, enemy.armor - 3);
    if (enemy.netherExposedTurn === state.turn) {
      enemy.armor = 0;
      enemy.ward = 0;
    }
    if (enemy.permanentArmorShred) enemy.armor = Math.max(0, enemy.armor - enemy.permanentArmorShred);
    else if (enemy.earthArmorUntil >= state.turn) enemy.armor = Math.max(0, enemy.armor - (enemy.earthArmorShred ?? 1));
    if (enemy.wardGrant) {
      if (enemy.hp > 0) enemy.ward = Math.min(3, enemy.ward + enemy.wardGrant);
      delete enemy.wardGrant;
    }
  }
}

export function checkNetherPhase2(state, summary = null, events = null) {
  if (state.netherPhase) return false;
  const boss = state.enemies?.find(e => e.kind === 'nether_dread_lord' && e.hp > 0);
  if (!boss) return false;
  const pillars = state.enemies.filter(e => NETHER_PILLAR_KINDS.includes(e.kind));
  if (!pillars.length) return false;
  const livePillars = pillars.filter(e => e.hp > 0);

  if (livePillars.length === 0) {
    state.netherPhase = 2;
    boss.netherExposedTurn = state.turn + 1;
    delete boss.readForm;
    if (events) {
      events.push({
        type: 'boss-phase',
        source: boss.id,
        sourceKind: 'nether_dread_lord',
        phase: 2,
        mode: 'broken',
        label: '🔥 เสาทั้งสามพังทลาย! พันธสัญญาแตก — จอมอสูรนรกานต์เปิดช่อง +35% เทิร์นหน้าและเข้าสู่โหมดปลดผนึก!',
      });
    }
    if (summary) {
      summary.netherPhase2 = 'broken';
      if (Array.isArray(summary.sequence)) {
        summary.sequence.push('🔥 พันธสัญญาสามเสาแตก! จอมอสูรนรกานต์สูญเสียเกราะคุ้มกันและเปิดช่อง +35% เทิร์นหน้า (เข้าสู่โหมดปลดผนึก)');
      }
    }
    return true;
  }

  if (boss.hp <= Math.floor(boss.maxHp / 2)) {
    state.netherPhase = 2;
    const sacrificed = livePillars.length;
    for (const pillar of livePillars) pillar.hp = 0;
    const rawHeal = sacrificed * 350;
    const effectiveHeal = boss.healCutUntil >= state.turn ? Math.floor(rawHeal / 2) : rawHeal;
    const healed = Math.min(boss.maxHp - boss.hp, effectiveHeal);
    boss.hp += healed;
    delete boss.readForm;
    if (events) {
      events.push({
        type: 'boss-phase',
        source: boss.id,
        sourceKind: 'nether_dread_lord',
        phase: 2,
        mode: 'sacrifice',
        sacrificed,
        healed,
        label: `💀 จอมอสูรนรกานต์สังเวยเสาที่เหลือ ${sacrificed} ต้น ฟื้น +${healed} HP และเข้าสู่โหมดปลดผนึก!`,
      });
      if (healed > 0) {
        events.push({ type: 'heal', source: boss.id, target: boss.id, amount: healed });
      }
    }
    if (summary) {
      summary.netherPhase2 = 'sacrifice';
      if (Array.isArray(summary.sequence)) {
        summary.sequence.push(`💀 จอมอสูรนรกานต์สังเวยเสาที่เหลือ ${sacrificed} ต้น ฟื้น +${healed} HP และเข้าสู่โหมดปลดผนึก!`);
      }
    }
    return true;
  }
  return false;
}

export function triggerKrakenPhase2(state, summary = null, events = null) {
  state.krakenPhase = 2;
  delete state.magmaPuddles;
  delete state.blackhole;
  const kraken = createEnemy('abyssal_kraken', 0);
  kraken.slot = 2;
  state.enemies = [kraken];
  if (events) {
    events.push({
      type: 'boss-phase',
      source: kraken.id,
      sourceKind: 'abyssal_kraken',
      phase: 2,
      label: '🐙 หนวดทั้งสี่ขาดสะบั้น! มหาคราเค่นแห่งห้วงบาดาลปรากฏร่างจริง!',
    });
  }
  if (summary) {
    summary.krakenPhase2 = true;
    if (Array.isArray(summary.sequence)) {
      summary.sequence.push('🐙 หนวดทั้งสี่ขาดสะบั้น! มหาคราเค่นแห่งห้วงบาดาล (4,600 HP) โผล่ขึ้นจากห้วงบาดาล!');
    }
  }
  return kraken;
}

export function checkEternityPhase2(state, summary = null, events = null, { absorbCouncil = true } = {}) {
  if (state.room !== FLOOR100_BOSS_ROOM || state.rift || state.eternityPhase) return false;
  const boss = state.enemies?.find(e => e.kind === 'eternity_overlord' && e.hp > 0);
  if (!boss || boss.hp > ETERNITY_PHASE_HP[1]) return false;

  state.eternityPhase = 2;
  let absorbed = 0;
  for (const ally of state.enemies) {
    if (ally.id !== boss.id && ally.hp > 0) {
      ally.hp = 0;
      if (absorbCouncil) absorbed++;
    }
  }
  const preHealHp = boss.hp;
  let healed = 0;
  if (absorbed > 0) {
    boss.eternityAbsorbed = Math.min(3, (boss.eternityAbsorbed ?? 0) + absorbed);
    const rawHeal = absorbed * 600;
    const effectiveHeal = boss.healCutUntil >= state.turn ? Math.floor(rawHeal / 2) : rawHeal;
    healed = Math.min(boss.maxHp - boss.hp, effectiveHeal);
    boss.hp += healed;
  }
  boss.affinity = getEternityShiftAffinity(state.turn);
  boss.ward = Math.min(3, (boss.ward ?? 0) + 2);
  boss.wardGrant = Math.max(boss.wardGrant ?? 0, 2);
  const label = absorbed > 0
    ? `🌌 เฟส 2: มหาเทพกลืนกินสภากาลอวกาศ (${absorbed} ตน) ฟื้น +${healed} HP & โจมตี +${absorbed * 12}! · เข้าสู่ร่างปฏิพากย์สลับธาตุ!`
    : '🌌 เฟส 2: มหาเทพปลดปล่อยร่างปฏิพากย์สลับธาตุทุกเทิร์น & ม่านสะท้อนดาราจักร!';
  if (events) {
    events.push({
      type: 'boss-phase',
      source: boss.id,
      sourceKind: 'eternity_overlord',
      phase: 2,
      mode: 'prism',
      absorbed,
      healed,
      eternity: eternityHealth(state, 2, preHealHp),
      label,
    });
    if (healed > 0) {
      events.push({ type: 'heal', source: boss.id, target: boss.id, amount: healed });
    }
  }
  if (summary) {
    summary.eternityPhase = 2;
    if (absorbed > 0) {
      summary.eternityAbsorbed = absorbed;
      summary.eternityAbsorbHeal = healed;
    }
    if (Array.isArray(summary.sequence)) {
      summary.sequence.push(label);
    }
  }
  return true;
}

export function triggerEternityPhase3(state, summary = null, events = null) {
  state.eternityPhase = 3;
  delete state.magmaPuddles;
  delete state.blackhole;
  const reborn = createEnemy('eternity_reborn', 0);
  reborn.slot = 2;
  reborn.affinity = getEternityShiftAffinity(state.turn);
  state.enemies = [reborn];

  // Tower Resonance Mercy Blessing aids the wizard for the secret final duel
  const p = state.player;
  const mercyHeal = Math.min(p.maxHp - p.hp, Math.ceil(p.maxHp * 0.25));
  if (mercyHeal > 0) p.hp += mercyHeal;
  p.mana = getMaxMana(p);

  const label = `เฟส 3 · ร่างจุตินิรันดร์คืนชีพ · ${reborn.maxHp.toLocaleString('en-US')} HP`;
  if (events) {
    events.push({
      type: 'boss-phase',
      source: reborn.id,
      sourceKind: 'eternity_reborn',
      phase: 3,
      mode: 'reborn',
      eternity: eternityHealth(state),
      mercyHeal,
      label,
    });
    if (mercyHeal > 0) {
      events.push({ type: 'heal', source: 'player', target: 'player', amount: mercyHeal, healKind: 'grand' });
    }
  }
  if (summary) {
    summary.eternityPhase = 3;
    if (Array.isArray(summary.sequence)) {
      summary.sequence.push(label);
      summary.sequence.push(`✦ พลังหอคอยเกื้อหนุน! ฟื้น HP +${mercyHeal} และมานาเต็ม ${p.mana} เพื่อศึกชี้ชะตาเฟส 3`);
    }
  }
  return reborn;
}

export function roomsPerFloor(state) {
  return state?.rooms?.length === 6 ? 2 : 3;
}

export function isBossRoom(state) {
  if (!state) return false;
  return getFloorInfo(state.room, state.rooms?.length ?? 44).isBoss;
}

export function isRoomRevisit(state, roomIndex = state.room) {
  return Array.isArray(state?.clearedRooms) && state.clearedRooms.includes(roomIndex);
}

export function recoverAfterRoom(state) {
  const { floor, isBoss } = getFloorInfo(state.room, state.rooms.length);
  const recovery = Math.min(!isBoss && floor >= 21 ? 20 : !isBoss && floor >= 6 && floor <= 8 ? 12 : 8, state.player.maxHp - state.player.hp);
  state.player.hp += recovery;
  return recovery;
}

export function enterRoom(state) {
  delete state.magmaPuddles;
  delete state.blackhole;
  delete state.deathSpent;
  delete state.legendaryTurns;
  delete state.krakenPhase;
  delete state.netherPhase;
  delete state.eternityPhase;
  state.turn = 1;
  state.phase = 'battle';
  state.player.mana = getMaxMana(state.player);
  const blessings = state.player.blessings ?? [];
  if (blessings.includes('blessing_aegis')) {
    state.player.shield = { layers: [6], expires: 2, effect: null, triggered: false };
  } else if (blessings.includes('blessing_frost')) {
    state.player.shield = { layers: [4], expires: 2, effect: 'ice', triggered: false };
  } else {
    state.player.shield = null;
  }
  state.player.elementBuffs = {};
  state.enemies = state.rooms[state.room].map((kind, index) => createEnemy(kind, index, state.room));
  const roomFloor = getFloorInfo(state.room, state.rooms.length).floor;
  if (SPACED_FLOORS.has(roomFloor) || ENDGAME_SPACED_FLOORS.has(roomFloor)) {
    const slots = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4] }[state.enemies.length];
    if (slots) state.enemies.forEach((enemy, index) => { enemy.slot = slots[index]; });
  }
  if (state.room >= FLOOR21_START_ROOM) prepareEnemies(state);
  state.rewards = [];
  state.pendingBlessings = [];
  state.pendingTargetRoom = null;
  openHand(state);
  return state;
}

function middleBattle(seed, room) {
  const draw = { rng: seedNumber(`${seed}:middle-tower:${room}`) };
  return [...pick(draw, MIDDLE_BATTLES[room])];
}

export function refreshMiddleTowerRooms(state) {
  if (!state?.rooms) return;
  const fresh = buildTowerRooms(state.seed, state.tutorial);
  for (let room = state.room + 1; room < Math.min(state.rooms.length, FLOOR20_BOSS_ROOM); room++) {
    if (!isRoomRevisit(state, room)) state.rooms[room] = fresh[room];
  }
}

export function buildTowerRooms(seed, tutorial = false) {
  const draw = { rng: seedNumber(seed) };
  function p(options) {
    return pick(draw, options);
  }

  return [
    // ZONE 1: Floors 1-4 (rooms 0-11)
    ['striker'],
    ['swarm'],
    ['elite'], // 1-3 boss
    tutorial ? ['swarm', 'swarm', 'swarm'] : p([['swarm', 'swarm', 'swarm'], ['charger', 'swarm']]),
    ['charger'],
    ['sentinel'], // 2-3 boss
    p([['support', 'armored', 'swarm'], ['warden', 'charger']]),
    ['armored', 'swarm'],
    ['boss'], // 3-3 boss
    p([['armored', 'charger', 'swarm'], ['warden', 'support', 'swarm']]),
    p([['charger', 'armored', 'warden'], ['charger', 'charger', 'support']]),
    p([['warden', 'iron_warden'], ['sentinel', 'support']]), // 4-3 boss

    // ZONE 1: Floors 6-9 (rooms 12-23)
    ['ember_imp', 'swarm'],
    p([['iron_warden', 'ember_imp'], ['warden', 'charger']]),
    ['mirror_mage'], // 6-3 boss
    ['iron_warden', 'ember_imp'],
    p([['rune_golem', 'swarm'], ['support', 'iron_warden']]),
    ['frost_lich'], // 7-3 boss
    ['rune_golem', 'ember_imp'],
    p([['iron_warden', 'rune_golem'], ['armored', 'support', 'ember_imp']]),
    ['storm_titan'], // 8-3 boss
    ['rune_golem', 'iron_warden'],
    p([['rune_golem', 'ember_imp', 'support'], ['iron_warden', 'rune_golem', 'swarm']]),
    ['arch_codex'], // 9-3 boss

    // Floor 10★ Major Boss (room 24)
    ['ember_overlord'],

    // ZONE 2: Floors 11-14 (rooms 25-36)
    ['void_imp', 'swarm'],
    p([['void_imp', 'aether_warden'], ['ember_imp', 'void_imp']]),
    ['prism_watcher'], // 11-3 boss
    ['obsidian_golem', 'void_imp'],
    p([['obsidian_golem', 'aether_warden'], ['chrono_sage', 'obsidian_golem']]),
    ['astral_sentinel'], // 12-3 boss
    ['chrono_sage', 'aether_warden'],
    p([['chrono_sage', 'obsidian_golem', 'void_imp'], ['aether_warden', 'obsidian_golem']]),
    ['elder_grimoire'], // 13-3 boss
    ['void_imp', 'obsidian_golem', 'chrono_sage'],
    p([['aether_warden', 'chrono_sage', 'obsidian_golem'], ['obsidian_golem', 'obsidian_golem']]),
    ['eclipse_mage'], // 14-3 boss

    // ZONE 2: Floors 16-19 (rooms 37-48)
    ['ward_scribe', 'void_imp'],
    p([['ward_scribe', 'obsidian_golem'], ['ward_keeper', 'void_imp']]),
    ['glacial_sovereign'], // 16-3 boss
    ['ward_keeper', 'rune_ram'],
    p([['ward_keeper', 'rune_ram', 'ward_scribe'], ['rune_ram', 'obsidian_golem']]),
    ['thunder_colossus'], // 17-3 boss
    ['rune_ram', 'ward_scribe', 'ward_keeper'],
    p([['rune_ram', 'obsidian_golem', 'ward_scribe'], ['ward_keeper', 'ward_keeper', 'rune_ram']]),
    ['nexus_codex'], // 18-3 boss
    ['seal_curator', 'ward_scribe'],
    p([['seal_curator', 'ward_keeper'], ['seal_curator', 'rune_ram']]),
    ['seal_curator', 'rune_ram'], // 19-3 boss

    // Floor 20★ Major Boss (room 49)
    ['tempest_archon'],

    // ZONE 3: Floors 21-24 (rooms 50-61)
    ['ward_scribe', 'aether_warden'],
    p([['ward_keeper', 'void_imp'], ['ward_scribe', 'rune_ram']]),
    ['seal_curator', 'ward_scribe'], // 21-3 boss
    ['rune_ram', 'void_imp'],
    p([['rune_ram', 'ward_keeper'], ['obsidian_golem', 'ward_scribe']]),
    ['astral_sentinel', 'ward_keeper'], // 22-3 boss
    ['ward_keeper', 'obsidian_golem'],
    p([['chrono_sage', 'rune_ram'], ['ward_keeper', 'void_imp']]),
    ['elder_grimoire', 'ward_scribe'], // 23-3 boss
    ['rune_ram', 'void_imp', 'ward_scribe'],
    p([['ward_keeper', 'rune_ram'], ['obsidian_golem', 'chrono_sage']]),
    ['eclipse_mage', 'rune_ram'], // 24-3 boss

    // ZONE 3: Floors 26-29 (rooms 62-73)
    ['ward_keeper', 'rune_ram'],
    p([['void_imp', 'ward_keeper', 'ward_scribe'], ['rune_ram', 'obsidian_golem']]),
    ['glacial_sovereign', 'ward_scribe'], // 26-3 boss
    ['rune_ram', 'void_imp', 'ward_scribe'],
    p([['ward_keeper', 'rune_ram', 'ward_scribe'], ['obsidian_golem', 'rune_ram']]),
    ['thunder_colossus', 'ward_keeper'], // 27-3 boss
    ['void_imp', 'rune_ram', 'ward_keeper'],
    p([['rune_ram', 'ward_keeper', 'obsidian_golem'], ['ward_scribe', 'rune_ram', 'void_imp']]),
    ['nexus_codex', 'ward_scribe'], // 28-3 boss
    ['ward_keeper', 'rune_ram', 'ward_scribe'],
    p([['ward_keeper', 'obsidian_golem', 'ward_scribe'], ['rune_ram', 'ward_keeper', 'void_imp']]),
    ['seal_curator', 'rune_ram', 'ward_scribe'], // 29-3 boss

    // Floor 30★ Major Boss (room 74)
    ['crown_archivist', 'rune_ram', 'ward_scribe'],

    // ZONE 4: Floors 31-34 (rooms 75-86)
    ['thread_archer', 'thread_archer'],
    p([['thread_archer', 'lattice_guard'], ['thread_archer', 'ward_scribe']]),
    ['gate_weaver'], // 31-3 boss
    ['lattice_guard', 'thread_archer'],
    p([['thread_archer', 'lattice_guard', 'thread_archer'], ['rift_runner', 'thread_archer']]),
    ['gate_weaver', 'thread_archer'], // 32-3 boss
    ['rift_runner', 'thread_archer'],
    p([['rift_runner', 'ward_scribe'], ['lattice_guard', 'rift_runner']]),
    ['mirror_regent'], // 33-3 boss
    ['lattice_guard', 'rift_runner', 'thread_archer'],
    p([['thread_archer', 'rift_runner', 'ward_scribe'], ['lattice_guard', 'thread_archer', 'lattice_guard']]),
    ['mirror_regent', 'thread_archer'], // 34-3 boss

    // ZONE 4: Floors 36-39 (rooms 87-98)
    ['thread_archer', 'lattice_guard', 'thread_archer'],
    p([['lattice_guard', 'ward_scribe', 'thread_archer'], ['rift_runner', 'lattice_guard']]),
    ['gate_weaver', 'lattice_guard'], // 36-3 boss
    ['rift_runner', 'lattice_guard', 'rift_runner'],
    p([['lattice_guard', 'rift_runner', 'thread_archer'], ['thread_archer', 'ward_scribe', 'lattice_guard']]),
    ['mirror_regent', 'rift_runner'], // 37-3 boss
    ['thread_archer', 'ward_scribe', 'lattice_guard'],
    p([['rift_runner', 'thread_archer', 'thread_archer'], ['lattice_guard', 'rift_runner', 'ward_scribe']]),
    ['seam_warden'], // 38-3 boss
    ['rift_runner', 'lattice_guard', 'ward_scribe'],
    p([['lattice_guard', 'rift_runner', 'thread_archer'], ['thread_archer', 'lattice_guard', 'rift_runner']]),
    ['seam_warden', 'thread_archer'], // 39-3 boss

    // Floor 40★ Major Boss (room 99)
    ['mirror_regent', 'ward_scribe', 'thread_archer'],

    // ZONE 5: Floors 41-44 (rooms 100-111)
    ['lattice_guard', 'thread_archer', 'lattice_guard'],
    p([['rift_runner', 'thread_archer', 'lattice_guard'], ['thread_archer', 'lattice_guard', 'ward_scribe']]),
    ['gate_weaver', 'rift_runner', 'thread_archer'], // 41-3 boss
    ['rift_runner', 'ward_scribe', 'lattice_guard'],
    p([['lattice_guard', 'rift_runner', 'thread_archer'], ['thread_archer', 'lattice_guard', 'thread_archer']]),
    ['mirror_regent', 'lattice_guard', 'thread_archer'], // 42-3 boss
    ['thread_archer', 'lattice_guard', 'thread_archer', 'rift_runner'],
    p([['rift_runner', 'lattice_guard', 'ward_scribe'], ['lattice_guard', 'thread_archer', 'rift_runner']]),
    ['seam_warden', 'rift_runner'], // 43-3 boss
    ['lattice_guard', 'rift_runner', 'lattice_guard'],
    p([['thread_archer', 'rift_runner', 'lattice_guard', 'thread_archer'], ['rift_runner', 'thread_archer', 'ward_scribe']]),
    ['seam_warden', 'lattice_guard', 'thread_archer'], // 44-3 boss

    // ZONE 5: Floors 46-49 (rooms 112-123)
    ['rift_runner', 'thread_archer', 'lattice_guard', 'thread_archer'],
    p([['lattice_guard', 'rift_runner', 'ward_scribe'], ['rift_runner', 'lattice_guard', 'thread_archer']]),
    ['gate_weaver', 'seam_warden'], // 46-3 boss
    ['lattice_guard', 'thread_archer', 'lattice_guard', 'ward_scribe'],
    p([['rift_runner', 'lattice_guard', 'thread_archer'], ['lattice_guard', 'rift_runner', 'thread_archer', 'ward_scribe']]),
    ['mirror_regent', 'seam_warden'], // 47-3 boss
    ['thread_archer', 'rift_runner', 'lattice_guard', 'rift_runner'],
    p([['lattice_guard', 'thread_archer', 'ward_scribe'], ['rift_runner', 'thread_archer', 'lattice_guard', 'ward_scribe']]),
    ['seam_warden', 'lattice_guard', 'rift_runner'], // 48-3 boss
    ['lattice_guard', 'rift_runner', 'thread_archer', 'ward_scribe'],
    p([['rift_runner', 'lattice_guard', 'thread_archer', 'lattice_guard'], ['thread_archer', 'rift_runner', 'seam_warden']]),
    ['seam_warden', 'mirror_regent', 'thread_archer'], // 49-3 boss

    // Floor 50★ Major Boss (room 124)
    ['loom_sovereign', 'rift_runner', 'ward_scribe', 'thread_archer'],

    // Floors 51–100 Endgame Tower (rooms 125–249)
    ...buildEndgameTowerRooms(p),
  ];
}

export function createRun(seed = String(Date.now()), tutorial = false, collection = []) {
  const state = {
    version: 2, rulesVersion: 3, hpCurveVersion: 1, seed: String(seed), rng: seedNumber(seed), tutorial,
    room: 0, highestRoom: 0, clearedRooms: [], rewardedBossRooms: [],
    riftProgressFloor: 0, riftDaily: null,
    sanctuaryRested: false, sanctuaryFloor: 5,
    sanctuaryUnlocked: false,
    sanctuary9Unlocked: false, sanctuaryPost10Unlocked: false,
    sanctuary14Unlocked: false, sanctuary19Unlocked: false, sanctuaryPost20Unlocked: false,
    purchasedShopItems: [],
    pendingBlessings: [], pendingTargetRoom: null,
    turn: 1, phase: 'battle', rooms: [], enemies: [], rewards: [], learned: [], collection: [...collection],
    player: {
      hp: 36, maxHp: 36, mana: MAX_MANA, maxMana: MAX_MANA,
      level: 1, exp: 0, gold: 0, items: [], stash: [], relics: [], blessings: [], cardUpgrades: {}, cardSecondaryUpgrades: {},
      words: [...START_WORDS], shield: null, elementBuffs: {},
    },
    stats: { casts: 0, damage: 0, blocked: 0, turns: 0, discovered: [] },
  };
  state.rooms = buildTowerRooms(state.seed, tutorial);
  return enterRoom(state);
}

export function ownsRewardWord(state, id) {
  return START_WORDS.includes(id) || state.collection.includes(id);
}

export function getRewardPoolForRoom(state, roomIndex) {
  return Object.keys(WORDS).filter(id => {
    if (id === 'self' && !ownsRewardWord(state, 'heal')) return false;
    if ((id === 'blood' || id === 'mana') && !ownsRewardWord(state, 'fill')) return false;
    if (CREATURE_WORDS.includes(id) && !ownsRewardWord(state, 'summon')) return false;
    if (id === 'pull') return roomIndex >= PULL_REWARD_ROOM;
    if (UPPER_REWARD_WORDS.includes(id)) return roomIndex >= FLOOR25_BOSS_ROOM;
    if (Object.hasOwn(SECOND_TIER_ELEMENTS, id)) return roomIndex >= FLOOR30_BOSS_ROOM;
    return roomIndex >= getFloorStartRoom(3) || !START_WORDS.includes(id);
  });
}

export function getRewardPool(state) {
  return getRewardPoolForRoom(state, state.room);
}

export function rewardRarityRates(floor) {
  if (floor <= 10) return { epic: 1, legendary: 0.1 };
  if (floor <= 20) return { epic: 2.5, legendary: 0.25 };
  if (floor <= 30) return { epic: 5, legendary: 0.75 };
  if (floor <= 40) return { epic: 10, legendary: 2 };
  if (floor <= 50) return { epic: 16, legendary: 4 };
  if (floor <= 60) return { epic: 20, legendary: 5 };
  if (floor <= 70) return { epic: 23, legendary: 6 };
  if (floor <= 80) return { epic: 26, legendary: 8 };
  if (floor <= 90) return { epic: 29, legendary: 10 };
  return { epic: 32, legendary: 12 };
}

export function drawRewardForFloor(state, pool, floor) {
  const { epic, legendary } = rewardRarityRates(floor);
  const roll = random(state) * 100;
  const regular = pool.filter(id => !['epic', 'legendary'].includes(WORDS[id].rarity));
  const rarity = roll < legendary ? 'legendary' : roll < legendary + epic ? 'epic' : null;
  const high = rarity ? pool.filter(id => WORDS[id].rarity === rarity) : [];
  return pick(state, high.length ? high : regular.length ? regular : pool);
}

function drawReward(state, pool) {
  const { floor } = getFloorInfo(state.room, state.rooms.length);
  return drawRewardForFloor(state, pool, floor);
}

// === RIFT DUNGEON (ดันเจี้ยนรอยแยก) ===
export const RIFT_TIERS = Object.freeze([20, 30, 40, 50, 60, 70, 80, 90, 100]);

export function getLocalDateKey(now = new Date()) {
  const d = now instanceof Date ? now : new Date(now);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRiftTierBossRoom(tier) {
  const D = Math.floor(tier / 10) - 1;
  return D * 25 + 24;
}

export function getRiftStageRooms(tier) {
  const D = Math.floor(tier / 10) - 1;
  // Stage 1: mini-boss (T-2)-3, Stage 2: mini-boss (T-1)-3, Stage 3: Major Boss T★
  return [D * 25 + 20, D * 25 + 23, D * 25 + 24];
}

export function isRiftTierUnlocked(state, tier) {
  if (!state || state.phase === 'lost' || (state.rooms?.length ?? 0) <= 6) return false;
  if (!RIFT_TIERS.includes(tier)) return false;
  const bossRoom = getRiftTierBossRoom(tier);
  if (bossRoom >= (state.rooms?.length ?? 0)) return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    cleared.includes(bossRoom)
    || (state.highestRoom ?? 0) > bossRoom
    || (state.riftProgressFloor ?? 0) >= tier
    || (tier === 20 && isSanctuaryPost20Unlocked(state))
    || (tier === 100 && state.phase === 'won' && state.room >= FLOOR100_BOSS_ROOM)
  );
}

export function isRiftUnlocked(state) {
  return isRiftTierUnlocked(state, 20);
}

export function getRiftDailyCap(state) {
  if (!state || !Array.isArray(state.rooms) || state.rooms.length <= 6) return 0;
  const cleared = new Set(state.clearedRooms ?? []);
  const highest = state.highestRoom ?? 0;
  let maxFloor = state.riftProgressFloor ?? 0;
  for (let r = 0; r < state.rooms.length; r++) {
    const info = getFloorInfo(r, state.rooms.length);
    if (!info.isBoss) continue;
    const isCleared = cleared.has(r)
      || highest > r
      || (r === FLOOR100_BOSS_ROOM && state.phase === 'won' && state.room >= FLOOR100_BOSS_ROOM);
    if (isCleared && info.floor > maxFloor) {
      maxFloor = info.floor;
    }
  }
  return maxFloor;
}

export function getRiftDailyStatus(state, now = new Date()) {
  const date = getLocalDateKey(now);
  const cap = getRiftDailyCap(state);
  const used = state?.riftDaily?.date === date ? Math.max(0, state.riftDaily.used ?? 0) : 0;
  const remaining = Math.max(0, cap - used);
  return { date, used, cap, remaining };
}

export function getRiftRewardPool(state, tier) {
  return getRewardPoolForRoom(state, getRiftTierBossRoom(tier));
}

export function recordClearedFloorProgress(state, roomIndex = state.room) {
  if (!state || state.rift || !Array.isArray(state.rooms) || state.rooms.length <= 6) return;
  const info = getFloorInfo(roomIndex, state.rooms.length);
  if (info.isBoss) {
    state.riftProgressFloor = Math.max(state.riftProgressFloor ?? 0, info.floor);
  }
}

export function startRiftRun(original, tier, now = new Date()) {
  if (!original || original.phase !== 'sanctuary') {
    throw new Error('เข้าดันเจี้ยนรอยแยกได้จากจุดพักเท่านั้น');
  }
  if (!RIFT_TIERS.includes(tier)) {
    throw new Error('ไม่พบระดับรอยแยกที่เลือก');
  }
  if (!isRiftTierUnlocked(original, tier)) {
    throw new Error(`ต้องผ่านบอสใหญ่ชั้น ${tier} ก่อนเพื่อปลดล็อกรอยแยกนี้`);
  }
  const status = getRiftDailyStatus(original, now);
  if (status.remaining <= 0) {
    throw new Error(`โควต้ารอยแยกวันนี้หมดแล้ว (${status.remaining}/${status.cap}) · ไต่หอคอยผ่านชั้นเพิ่มเพื่อรับรอบเพิ่ม หรือรอวันถัดไป`);
  }
  const state = structuredClone(original);
  delete state.replayReturn;
  const stageRooms = getRiftStageRooms(tier);
  state.riftProgressFloor = Math.max(state.riftProgressFloor ?? 0, status.cap);
  state.riftDaily = { date: status.date, used: status.used + 1 };
  state.rift = {
    tier,
    stage: 0,
    stageRooms,
    returnRoom: original.room,
    returnSanctuaryFloor: original.sanctuaryFloor ?? 5,
  };
  state.room = stageRooms[0];
  return enterRoom(state);
}

export function resolveRiftBattleVictory(state, summary, events) {
  const rift = state.rift;
  delete state.magmaPuddles;
  delete state.blackhole;
  delete state.deathSpent;
  delete state.legendaryTurns;

  if (rift.stage < rift.stageRooms.length - 1) {
    const healAmount = Math.max(12, Math.round(state.player.maxHp * 0.2));
    const recovered = Math.min(healAmount, state.player.maxHp - state.player.hp);
    state.player.hp += recovered;
    summary.roomRecovery = recovered;
    summary.riftStageCleared = rift.stage + 1;
    rift.stage += 1;
    state.room = rift.stageRooms[rift.stage];
    enterRoom(state);
    return state;
  }

  // Stage 3/3 cleared — automatically draw and grant 1 random card from this tier's ceiling pool
  const tier = rift.tier;
  const pool = getRiftRewardPool(state, tier);
  const wordId = drawRewardForFloor(state, pool, tier);
  const wasOwned = ownsRewardWord(state, wordId);
  const prevLevel = getCardUpgradeLevel(state, wordId);
  let outcome = 'new';
  let newLevel = prevLevel;
  let goldBonus = 0;

  if (wasOwned) {
    if (prevLevel < MAX_CARD_UPGRADE) {
      newLevel = prevLevel + 1;
      (state.player.cardUpgrades ??= {})[wordId] = newLevel;
      outcome = 'upgrade';
    } else {
      goldBonus = 20;
      state.player.gold = (state.player.gold ?? 0) + goldBonus;
      outcome = 'gold';
    }
  } else {
    if (!START_WORDS.includes(wordId)) {
      if (!state.learned.includes(wordId)) state.learned.push(wordId);
      if (!state.collection.includes(wordId)) state.collection.push(wordId);
    }
    const cap = deckCapacity(state);
    if (state.player.words.length < cap && !state.player.words.includes(wordId)) {
      state.player.words.push(wordId);
    }
  }

  const returnRoom = rift.returnRoom;
  const returnSanctuaryFloor = rift.returnSanctuaryFloor ?? 5;
  delete state.rift;
  state.room = returnRoom;
  state.sanctuaryFloor = returnSanctuaryFloor;
  state.sanctuaryUnlocked = true;
  state.sanctuaryRested = false;
  state.phase = 'sanctuary';
  state.turn = 1;
  state.player.mana = getMaxMana(state.player);
  state.player.shield = null;
  state.player.elementBuffs = {};
  state.rewards = [];
  state.enemies = (state.rooms?.[state.room] ?? []).map((kind, index) => {
    const enemy = createEnemy(kind, index, state.room);
    enemy.hp = 0;
    return enemy;
  });

  const rewardInfo = { tier, wordId, outcome, prevLevel, newLevel, goldBonus };
  summary.riftCleared = rewardInfo;
  events.push({ type: 'rift-reward', ...rewardInfo });
  return state;
}

export function resolveRiftDefeat(state, summary, events) {
  const rift = state.rift;
  const tier = rift.tier;
  const stage = rift.stage;
  const returnRoom = rift.returnRoom;
  const returnSanctuaryFloor = rift.returnSanctuaryFloor ?? 5;
  delete state.rift;
  state.room = returnRoom;
  state.sanctuaryFloor = returnSanctuaryFloor;
  state.sanctuaryUnlocked = true;
  state.sanctuaryRested = false;
  state.phase = 'sanctuary';
  resetPlayerForSanctuaryFallback(state);
  summary.riftFailed = { tier, stage };
  summary.fellToFloor = returnSanctuaryFloor;
  events.push({ type: 'fall', targetFloor: returnSanctuaryFloor, riftTier: tier });
  return state;
}

export function fillRewardChoices(state) {
  const pool = getRewardPool(state);
  for (const id of state.rewards) {
    const index = pool.indexOf(id);
    if (index !== -1) pool.splice(index, 1);
  }
  while (state.rewards.length < 3 && pool.length) {
    const word = drawReward(state, pool);
    state.rewards.push(word);
    pool.splice(pool.indexOf(word), 1);
  }
}

export function makeRewards(state) {
  state.rewards = [];
  fillRewardChoices(state);
  state.phase = 'reward';
}

function earlyBossRewards(state) {
  return [2, 5].filter(room => (state.rewardedBossRooms ?? []).includes(room)
    || ((state.highestRoom ?? state.room) > room && !(state.phase === 'reward' && state.room === room))).length;
}

export function deckCapacity(state) {
  const owned = new Set([...START_WORDS, ...(state.collection ?? [])]).size;
  const unlocked = Math.max(START_WORDS.length + earlyBossRewards(state), START_WORDS.length + (state.learned?.length ?? 0), state.player?.words?.length ?? 0);
  return Math.min(7, owned, unlocked);
}

export function repairEarlyDeck(state, fillWords = true) {
  if (state.phase === 'lost') return;
  const needed = Math.min(7, START_WORDS.length + earlyBossRewards(state));
  const savedRng = state.rng;
  try {
    while (new Set([...START_WORDS, ...state.collection]).size < needed) {
      const candidates = getRewardPool(state).filter(id => !ownsRewardWord(state, id));
      if (!candidates.length) break;
      const id = drawReward(state, candidates);
      state.collection.push(id);
    }
  } finally {
    state.rng = savedRng;
  }
  if (!fillWords) return;
  const cap = deckCapacity(state);
  for (const id of [...START_WORDS, ...state.collection]) {
    if (state.player.words.length >= cap) break;
    if (!state.player.words.includes(id)) state.player.words.push(id);
  }
}

export function offerMissedElementReward(state) {
  if (state.room !== FLOOR30_BOSS_ROOM || state.phase !== 'won') return;
  completeUpperFloor(state);
}

export function completeBossVictoryTransition(state) {
  state.clearedRooms ??= [];
  if (!state.clearedRooms.includes(state.room)) state.clearedRooms.push(state.room);
  recordClearedFloorProgress(state, state.room);
  const rel = state.room % 25;
  const D = Math.floor(state.room / 25);

  if (rel === 11) {
    const rest = D * 10 + 5;
    state.sanctuaryUnlocked = true;
    state.sanctuaryFloor = rest;
    state.sanctuaryRested = false;
    state.highestRoom = Math.max(state.highestRoom ?? 0, state.room + 1);
    state.phase = 'sanctuary';
    return state;
  }
  if (rel === 23) {
    const rest = `pre${(D + 1) * 10}`;
    state.sanctuaryUnlocked = true;
    state.sanctuaryFloor = rest;
    state.sanctuaryRested = false;
    state.highestRoom = Math.max(state.highestRoom ?? 0, state.room + 1);
    state.phase = 'sanctuary';
    return state;
  }
  if (rel === 24) {
    const majorBossFloor = (D + 1) * 10;
    grantBossRelic(state.player, majorBossFloor);
    if (majorBossFloor === 100 || state.room >= (state.rooms?.length ?? TOTAL_TOWER_ROOMS) - 1) {
      state.phase = 'won';
      return state;
    }
    state.sanctuaryUnlocked = true;
    state.sanctuaryFloor = `post${majorBossFloor}`;
    state.sanctuaryRested = false;
    state.highestRoom = Math.max(state.highestRoom ?? 0, state.room + 1);
    state.phase = 'sanctuary';
    return state;
  }
  if (state.room >= (state.rooms?.length ?? TOTAL_TOWER_ROOMS) - 1) {
    state.phase = 'won';
    return state;
  }
  state.phase = 'loadout';
  return state;
}

export function chooseReward(original, id) {
  if (original.phase !== 'reward') throw new Error('ไม่ได้อยู่ในช่วงเลือกการ์ด');
  if (!original.rewards.includes(id)) throw new Error('ไม่พบการ์ดคำนี้');
  const state = structuredClone(original);
  if (ownsRewardWord(original, id)) {
    const level = getCardUpgradeLevel(state, id);
    if (level < MAX_CARD_UPGRADE) {
      (state.player.cardUpgrades ??= {})[id] = level + 1;
    } else {
      state.player.gold = (state.player.gold ?? 0) + 20;
    }
  }
  if (!START_WORDS.includes(id)) {
    if (!state.learned.includes(id)) state.learned.push(id);
    if (!state.collection.includes(id)) state.collection.push(id);
  }
  state.rewardedBossRooms ??= [];
  if (!state.rewardedBossRooms.includes(state.room)) state.rewardedBossRooms.push(state.room);
  state.rewards = [];
  repairEarlyDeck(state, false);
  const cap = deckCapacity(state);
  if (state.player.words.length < cap && !state.player.words.includes(id)) {
    state.player.words.push(id);
  }
  for (const candidate of [...START_WORDS, ...state.collection]) {
    if (state.player.words.length >= cap) break;
    if (!state.player.words.includes(candidate)) state.player.words.push(candidate);
  }
  completeBossVictoryTransition(state);
  offerMissedElementReward(state);
  return state;
}

export function isSanctuaryUnlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    state.sanctuaryUnlocked ||
    state.phase === 'won' ||
    state.phase === 'sanctuary' ||
    cleared.includes(FLOOR4_BOUNDARY_ROOM) ||
    state.room > FLOOR4_BOUNDARY_ROOM
  );
}

export function isSanctuaryPre10Unlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    cleared.includes(FLOOR9_BOUNDARY_ROOM) ||
    state.room >= FLOOR10_BOSS_ROOM ||
    (state.phase === 'sanctuary' && state.sanctuaryFloor === 'pre10')
  );
}

export function isSanctuaryPost10Unlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    state.sanctuaryPost10Unlocked ||
    cleared.includes(FLOOR10_BOSS_ROOM) ||
    state.room > FLOOR10_BOSS_ROOM ||
    (state.phase === 'sanctuary' && state.sanctuaryFloor === 'post10')
  );
}

export function isSanctuary15Unlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    cleared.includes(FLOOR14_BOUNDARY_ROOM) ||
    state.room > FLOOR14_BOUNDARY_ROOM ||
    (state.phase === 'sanctuary' && state.sanctuaryFloor === 15)
  );
}

export function isSanctuaryPre20Unlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    cleared.includes(FLOOR19_BOUNDARY_ROOM) ||
    state.room >= FLOOR20_BOSS_ROOM ||
    (state.phase === 'sanctuary' && state.sanctuaryFloor === 'pre20')
  );
}

export function isSanctuaryPost20Unlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    state.sanctuaryPost20Unlocked ||
    cleared.includes(FLOOR20_BOSS_ROOM) ||
    state.room > FLOOR20_BOSS_ROOM ||
    (state.phase === 'sanctuary' && state.sanctuaryFloor === 'post20')
  );
}

// Aliases for legacy exports
export const isSanctuary9Unlocked = isSanctuaryPre10Unlocked;
export const isSanctuary14Unlocked = isSanctuary15Unlocked;
export const isSanctuary19Unlocked = isSanctuaryPre20Unlocked;

export function isSanctuaryFloorUnlocked(state, floorKey) {
  if (!state || state.phase === 'lost') return false;
  const cleared = new Set(state.clearedRooms ?? []);
  if (floorKey === 4 || floorKey === 5) return isSanctuaryUnlocked(state);
  if (floorKey === 9 || floorKey === 'pre10') return isSanctuaryPre10Unlocked(state);
  if (floorKey === 'post10') return isSanctuaryPost10Unlocked(state);
  if (floorKey === 14 || floorKey === 15) return isSanctuary15Unlocked(state);
  if (floorKey === 19 || floorKey === 'pre20') return isSanctuaryPre20Unlocked(state);
  if (floorKey === 'post20') return isSanctuaryPost20Unlocked(state);

  if (typeof floorKey === 'number') {
    const D = Math.floor((floorKey - 5) / 10);
    const boundaryRoom = D * 25 + 11;
    return cleared.has(boundaryRoom) || state.room > boundaryRoom || (state.phase === 'sanctuary' && state.sanctuaryFloor === floorKey);
  }
  if (typeof floorKey === 'string') {
    if (floorKey.startsWith('pre')) {
      const targetFloor = Number(floorKey.slice(3));
      const D = Math.floor((targetFloor - 10) / 10);
      const boundaryRoom = D * 25 + 23;
      return cleared.has(boundaryRoom) || state.room >= (D * 25 + 24) || (state.phase === 'sanctuary' && state.sanctuaryFloor === floorKey);
    }
    if (floorKey.startsWith('post')) {
      const targetFloor = Number(floorKey.slice(4));
      const D = Math.floor((targetFloor - 10) / 10);
      const bossRoom = D * 25 + 24;
      return cleared.has(bossRoom) || state.room > bossRoom || (state.phase === 'sanctuary' && state.sanctuaryFloor === floorKey);
    }
  }
  return false;
}

function resetPlayerForSanctuaryFallback(state) {
  delete state.magmaPuddles;
  delete state.blackhole;
  delete state.deathSpent;
  delete state.legendaryTurns;
  state.turn = 1;
  state.player.hp = Math.max(10, Math.ceil(state.player.maxHp * 0.5));
  state.player.mana = getMaxMana(state.player);
  state.player.shield = null;
  state.player.elementBuffs = {};
  state.rewards = [];
  state.pendingBlessings = [];
  state.pendingTargetRoom = null;
  state.enemies = (state.rooms?.[state.room] ?? []).map((kind, index) => {
    const enemy = createEnemy(kind, index, state.room);
    enemy.hp = 0;
    return enemy;
  });
}

export function clearLostRunProgress(state) {
  state.collection = [];
  state.learned = [];
  state.player.words = [...START_WORDS];
  state.player.hand = [];
  state.stats.discovered = [];
}

export function fallBackOnDefeat(state) {
  delete state.replayReturn;
  const room = state.room;
  const D = Math.floor(room / 25);
  const rel = room % 25;

  if (rel < 12) {
    if (D === 0) {
      state.phase = 'lost';
      clearLostRunProgress(state);
      return { phase: 'lost' };
    }
    const rest = `post${D * 10}`;
    const restartRoom = D * 25;
    state.phase = 'sanctuary';
    state.sanctuaryFloor = rest;
    state.sanctuaryRested = false;
    if (D === 1) {
      state.sanctuary14Unlocked = false;
      state.sanctuary19Unlocked = false;
      state.sanctuaryPost20Unlocked = false;
    }
    state.clearedRooms = (state.clearedRooms ?? []).filter(r => r < restartRoom);
    state.highestRoom = Math.min((state.rooms?.length ?? TOTAL_TOWER_ROOMS) - 1, restartRoom);
    state.room = state.highestRoom;
    resetPlayerForSanctuaryFallback(state);
    return { phase: 'sanctuary', targetFloor: rest };
  }

  if (rel < 24) {
    const rest = D * 10 + 5;
    const restartRoom = D * 25 + 12;
    state.phase = 'sanctuary';
    state.sanctuaryFloor = rest;
    state.sanctuaryRested = false;
    if (D === 0) {
      state.sanctuaryPre10Unlocked = false;
      state.sanctuary9Unlocked = false;
      state.sanctuaryPost10Unlocked = false;
      state.sanctuary14Unlocked = false;
      state.sanctuary19Unlocked = false;
      state.sanctuaryPost20Unlocked = false;
    } else if (D === 1) {
      state.sanctuary19Unlocked = false;
      state.sanctuaryPost20Unlocked = false;
    }
    state.clearedRooms = (state.clearedRooms ?? []).filter(r => r < restartRoom);
    state.highestRoom = Math.min((state.rooms?.length ?? TOTAL_TOWER_ROOMS) - 1, restartRoom);
    state.room = state.highestRoom;
    resetPlayerForSanctuaryFallback(state);
    return { phase: 'sanctuary', targetFloor: rest };
  }

  const rest = `pre${(D + 1) * 10}`;
  const bossRoom = D * 25 + 24;
  state.phase = 'sanctuary';
  state.sanctuaryFloor = rest;
  state.sanctuaryRested = false;
  state.highestRoom = Math.max(state.highestRoom ?? 0, bossRoom);
  state.room = bossRoom;
  resetPlayerForSanctuaryFallback(state);
  return { phase: 'sanctuary', targetFloor: rest };
}

export function fallBackToFloor4Sanctuary(state) {
  return fallBackOnDefeat(Object.assign(state, { room: 12 }));
}

export function fallBackToFloor9Sanctuary(state) {
  return fallBackOnDefeat(Object.assign(state, { room: 24 }));
}

export function fallBackToPost10Sanctuary(state) {
  return fallBackOnDefeat(Object.assign(state, { room: 25 }));
}

export function fallBackToFloor14Sanctuary(state) {
  return fallBackOnDefeat(Object.assign(state, { room: 37 }));
}

export function fallBackToFloor19Sanctuary(state) {
  return fallBackOnDefeat(Object.assign(state, { room: 49 }));
}

export function fallBackToUpperSanctuary(state) {
  return fallBackOnDefeat(state);
}

export function validateDeckWords(original, words) {
  const available = [...START_WORDS, ...original.collection];
  const cap = deckCapacity(original);
  if (!Array.isArray(words) || words.length !== cap || new Set(words).size !== words.length || words.some(word => !available.includes(word))) {
    throw new Error('ชุดคำไม่ถูกต้อง');
  }
  if (!words.some(word => ATTACK_FORMS.includes(word)) || !words.some(word => ELEMENTS.includes(word))) {
    throw new Error('พกอย่างน้อยหนึ่งรูปทรงโจมตีและหนึ่งธาตุ');
  }
}

export function equipWords(original, words) {
  if (original.phase !== 'loadout') throw new Error('จัดชุดคำได้ก่อนขึ้นชั้น');
  validateDeckWords(original, words);
  const state = structuredClone(original);
  state.player.words = [...words];
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 12);
  state.room++;
  state.highestRoom = Math.max(state.highestRoom ?? 0, state.room);
  return enterRoom(state);
}

export function getSanctuaryNextRoom(state, sanctuaryFloor) {
  if (sanctuaryFloor === undefined || sanctuaryFloor === null) {
    sanctuaryFloor = state?.sanctuaryFloor ?? 5;
  }
  if (sanctuaryFloor === 4 || sanctuaryFloor === 5) return FLOOR6_START_ROOM;
  if (sanctuaryFloor === 9 || sanctuaryFloor === 'pre10') return FLOOR10_BOSS_ROOM;
  if (sanctuaryFloor === 'post10') return FLOOR11_START_ROOM;
  if (sanctuaryFloor === 14 || sanctuaryFloor === 15) return FLOOR16_START_ROOM;
  if (sanctuaryFloor === 19 || sanctuaryFloor === 'pre20') return FLOOR20_BOSS_ROOM;
  if (sanctuaryFloor === 'post20') return FLOOR21_START_ROOM;

  if (typeof sanctuaryFloor === 'number') {
    const D = Math.floor((sanctuaryFloor - 5) / 10);
    return Math.min((state?.rooms?.length ?? TOTAL_TOWER_ROOMS) - 1, D * 25 + 12);
  }
  if (typeof sanctuaryFloor === 'string') {
    if (sanctuaryFloor.startsWith('pre')) {
      const target = Number(sanctuaryFloor.slice(3));
      const D = Math.floor((target - 10) / 10);
      return Math.min((state?.rooms?.length ?? TOTAL_TOWER_ROOMS) - 1, D * 25 + 24);
    }
    if (sanctuaryFloor.startsWith('post')) {
      const target = Number(sanctuaryFloor.slice(4));
      const D = Math.floor((target - 10) / 10);
      return Math.min((state?.rooms?.length ?? TOTAL_TOWER_ROOMS) - 1, (D + 1) * 25);
    }
  }
  return 0;
}

export function getSanctuaryCheckpoints(state) {
  const lastFloor = getFloorInfo(state.rooms.length - 1, state.rooms.length).floor;
  const checkpoints = [];
  for (let boss = 10; boss <= lastFloor; boss += 10) {
    checkpoints.push(boss - 5, `pre${boss}`);
    if (boss < lastFloor) checkpoints.push(`post${boss}`);
  }
  return checkpoints;
}

export function getSanctuaryContinueRoom(state) {
  const highest = Math.min(state.rooms.length - 1, Math.max(state.highestRoom ?? 0, state.room));
  const start = Math.min(getSanctuaryNextRoom(state), highest);
  const cleared = new Set(state.clearedRooms ?? []);
  for (let room = start; room <= highest; room++) {
    if (!cleared.has(room)) return room;
  }
  return start;
}

export function enterSanctuary(original, options = {}) {
  if (!original || original.phase === 'lost') throw new Error('ไม่สามารถเข้าชั้นพักได้ในขณะนี้');
  const rawOpt = options.floor;
  const requestedFloor = rawOpt !== undefined ? rawOpt : (original.sanctuaryFloor ?? 5);
  if (!options.force) {
    if (requestedFloor === 'post10' && !isSanctuaryPost10Unlocked(original)) {
      throw new Error('ต้องปราบบอสพิเศษชั้นที่ 10 ก่อนเพื่อเปิดชั้นพักนี้');
    }
    if (requestedFloor === 'post20' && !isSanctuaryPost20Unlocked(original)) {
      throw new Error('ต้องปราบบอสพิเศษชั้นที่ 20 ก่อนเพื่อเปิดชั้นพักนี้');
    }
    if (typeof requestedFloor === 'string' && requestedFloor.startsWith('post') && !isSanctuaryFloorUnlocked(original, requestedFloor)) {
      throw new Error(`ต้องปราบบอสพิเศษชั้นที่ ${requestedFloor.slice(4)} ก่อนเพื่อเปิดชั้นพักนี้`);
    }
    if (!isSanctuaryFloorUnlocked(original, requestedFloor)) {
      throw new Error(`ต้องผ่านด่านก่อนหน้าเพื่อปลดล็อกจุดพักนี้`);
    }
  }
  const state = structuredClone(original);
  delete state.replayReturn;
  if (state.rift) {
    state.room = state.rift.returnRoom;
    delete state.rift;
    state.enemies = (state.rooms?.[state.room] ?? []).map((kind, index) => {
      const enemy = createEnemy(kind, index);
      enemy.hp = 0;
      return enemy;
    });
  } else {
    for (const enemy of state.enemies) enemy.hp = 0;
  }
  state.sanctuaryUnlocked = true;
  state.sanctuaryFloor = requestedFloor;
  state.phase = 'sanctuary';
  state.sanctuaryRested = false;
  state.rewards = [];
  delete state.magmaPuddles;
  delete state.blackhole;
  delete state.deathSpent;
  delete state.legendaryTurns;
  return state;
}

export function restAtSanctuary(original) {
  if (original.phase !== 'sanctuary') throw new Error('พักฟื้นได้เฉพาะที่ชั้นพักเท่านั้น');
  if (original.sanctuaryRested) throw new Error('คุณได้พักฟื้นที่กองไฟในรอบการแวะนี้แล้ว');
  const state = structuredClone(original);
  state.player.hp = state.player.maxHp;
  state.player.mana = getMaxMana(state.player);
  state.sanctuaryRested = true;
  return state;
}

export function buyShopItem(original, itemId) {
  if (original.phase !== 'sanctuary') throw new Error('ซื้อไอเทมได้เฉพาะในร้านค้าที่ชั้นพักเท่านั้น');
  const item = SHOP_ITEMS[itemId];
  if (!item) throw new Error('ไม่พบไอเทมนี้ในร้านค้า');
  const state = structuredClone(original);
  state.player.gold ??= 0;
  state.player.items ??= [];
  state.player.stash ??= [];
  state.purchasedShopItems ??= [];
  if (item.oneTime && state.purchasedShopItems.includes(itemId)) {
    throw new Error('ไอเทมชิ้นนี้จำกัดการซื้อครั้งเดียวและซื้อไปแล้ว');
  }
  const canPutInBelt = !item.vaultOnly && state.player.items.length < MAX_BELT_ITEMS;
  const canPutInStash = state.player.stash.length < MAX_STASH_ITEMS;
  if (!canPutInBelt && !canPutInStash) {
    throw new Error(`เข็มขัด (${MAX_BELT_ITEMS}) และคลังไอเทม (${MAX_STASH_ITEMS}) เต็มแล้ว`);
  }
  if (state.player.gold < item.cost) {
    throw new Error(`ทองไม่พอ · ต้องใช้ ${item.cost} ทอง (มีอยู่ ${state.player.gold} ทอง)`);
  }
  state.player.gold -= item.cost;
  if (canPutInBelt) {
    state.player.items.push(itemId);
  } else {
    state.player.stash.push(itemId);
  }
  if (item.oneTime) {
    state.purchasedShopItems.push(itemId);
  }
  return state;
}

export function moveBeltToStash(original, beltIndex) {
  if (!original?.player) throw new Error('ไม่พบข้อมูลผู้เล่น');
  const state = structuredClone(original);
  state.player.items ??= [];
  state.player.stash ??= [];
  if (!Number.isInteger(beltIndex) || beltIndex < 0 || beltIndex >= state.player.items.length) {
    throw new Error('ไม่พบไอเทมในช่องเข็มขัด');
  }
  if (state.player.stash.length >= MAX_STASH_ITEMS) {
    throw new Error(`คลังเก็บไอเทมเต็มแล้ว (สูงสุด ${MAX_STASH_ITEMS} ชิ้น)`);
  }
  const [itemId] = state.player.items.splice(beltIndex, 1);
  state.player.stash.push(itemId);
  return state;
}

export function moveStashToBelt(original, stashIndex) {
  if (!original?.player) throw new Error('ไม่พบข้อมูลผู้เล่น');
  const state = structuredClone(original);
  state.player.items ??= [];
  state.player.stash ??= [];
  if (!Number.isInteger(stashIndex) || stashIndex < 0 || stashIndex >= state.player.stash.length) {
    throw new Error('ไม่พบไอเทมในคลัง');
  }
  const itemId = state.player.stash[stashIndex];
  const item = SHOP_ITEMS[itemId];
  if (item?.vaultOnly) {
    throw new Error('วัตถุดิบตีบวกใช้ที่แท่นตีบวกการ์ด ไม่ต้องพกขึ้นเข็มขัดต่อสู้');
  }
  if (state.player.items.length >= MAX_BELT_ITEMS) {
    throw new Error(`เข็มขัดไอเทมด่วนเต็มแล้ว (${MAX_BELT_ITEMS}/${MAX_BELT_ITEMS}) · เก็บของจากเข็มขัดเข้าคลังก่อน`);
  }
  state.player.stash.splice(stashIndex, 1);
  state.player.items.push(itemId);
  return state;
}

export function discardInventoryItem(original, source = 'belt', index = 0) {
  if (!original?.player) throw new Error('ไม่พบข้อมูลผู้เล่น');
  const state = structuredClone(original);
  const p = state.player;
  p.items ??= [];
  p.stash ??= [];
  const list = source === 'stash' ? p.stash : p.items;
  if (!Number.isInteger(index) || index < 0 || index >= list.length) {
    throw new Error('ไม่พบไอเทมที่ต้องการทิ้ง');
  }
  const [removedId] = list.splice(index, 1);
  return { state, item: SHOP_ITEMS[removedId] ?? { id: removedId, name: removedId } };
}

export function useInventoryItem(original, source = 'belt', index = 0) {
  if (!original?.player) throw new Error('ไม่พบข้อมูลผู้เล่น');
  const p = original.player;
  const list = source === 'stash' ? (p.stash ?? []) : (p.items ?? []);
  if (!Number.isInteger(index) || index < 0 || index >= list.length) {
    throw new Error('ไม่พบไอเทมที่เลือก');
  }
  const itemId = list[index];
  const item = SHOP_ITEMS[itemId];
  if (!item) throw new Error('ไม่รู้จักไอเทมนี้');
  if (item.vaultOnly) {
    throw new Error('หินตีบวกอักษรเป็นวัตถุดิบสำหรับใช้ที่แท่นตีบวกการ์ดในชั้นพัก');
  }
  if (original.phase === 'battle') {
    if (source === 'belt') {
      return useBattleItem(original, index);
    }
    const cloned = structuredClone(original);
    cloned.player.stash.splice(index, 1);
    cloned.player.items ??= [];
    cloned.player.items.push(itemId);
    return useBattleItem(cloned, cloned.player.items.length - 1);
  }
  const state = structuredClone(original);
  const targetList = source === 'stash' ? (state.player.stash ??= []) : (state.player.items ??= []);
  if (!item.battleOnly && (item.hpRestore || item.manaRestore)) {
    const hp = Math.min(item.hpRestore ?? 0, state.player.maxHp - state.player.hp);
    const mana = Math.min(item.manaRestore ?? 0, getMaxMana(state.player) - state.player.mana);
    if (!hp && !mana) throw new Error('พลังชีวิตและมานาที่ไอเทมนี้ฟื้นได้เต็มอยู่แล้ว');
    targetList.splice(index, 1);
    state.player.hp += hp;
    state.player.mana += mana;
    const gains = [hp ? `HP +${hp}` : '', mana ? `MP +${mana}` : ''].filter(Boolean).join(' · ');
    return { ok: true, state, item, effectText: `ใช้${item.name} · ${gains}` };
  }
  throw new Error('ไอเทมชิ้นนี้ต้องกดใช้ระหว่างอยู่ในฉากต่อสู้เท่านั้น');
}

export function useSanctuaryItem(original, source, index) {
  const res = useInventoryItem(original, source, index);
  return { state: res.state, item: res.item, message: res.effectText };
}

export function upgradeWordCard(original, wordId, mode = 'stat', options = {}) {
  if (original.phase !== 'sanctuary') throw new Error('อัปเกรดการ์ดได้เฉพาะที่แท่นตีบวกในชั้นพักเท่านั้น');
  const available = [...START_WORDS, ...(original.collection ?? []), ...(original.player?.words ?? [])];
  if (!available.includes(wordId) || !WORDS[wordId]) {
    throw new Error('ยังไม่มีการ์ดคำนี้ในครอบครอง');
  }
  const state = structuredClone(original);
  const p = state.player;
  p.gold ??= 0;
  p.items ??= [];
  p.stash ??= [];
  p.cardUpgrades ??= {};
  p.cardSecondaryUpgrades ??= {};

  if (mode === 'secondary') {
    if (hasCardSecondaryUpgrade(state, wordId)) {
      throw new Error(`การ์ด “${WORDS[wordId].label}” ปลดล็อกเอฟเฟกต์รองไปแล้ว`);
    }
    const goldCost = CARD_SECONDARY_GOLD_COST;
    if (p.gold < goldCost) {
      throw new Error(`ทองไม่พอสำหรับปลดล็อกเอฟเฟกต์รอง · ต้องใช้ ${goldCost} ทอง (มีอยู่ ${p.gold} ทอง)`);
    }
    p.gold -= goldCost;
    const currentLv = p.cardUpgrades[wordId] ?? 0;
    const effect = getCardSecondaryEffect(wordId, Math.max(CARD_SECONDARY_UNLOCK_LEVEL, currentLv));
    p.cardSecondaryUpgrades[wordId] = true;
    return {
      state,
      mode: 'secondary',
      wordId,
      upgraded: true,
      failed: false,
      chancePercent: 100,
      rollPercent: 1,
      newLevel: currentLv,
      secondaryUnlocked: true,
      milestoneUnlocked: true,
      effect,
      usedStone: false,
      cost: goldCost,
      goldCost,
    };
  }

  const currentLevel = p.cardUpgrades[wordId] ?? 0;
  if (currentLevel >= MAX_CARD_UPGRADE) {
    throw new Error(`การ์ด “${WORDS[wordId].label}” ตีบวกสเตตัสถึงระดับสูงสุด (+${MAX_CARD_UPGRADE}) แล้ว`);
  }
  const goldCost = getCardUpgradeCost(currentLevel, wordId);
  if (p.gold < goldCost) {
    throw new Error(`ทองไม่พอสำหรับการตีบวก · ต้องใช้ ${goldCost} ทอง (มีอยู่ ${p.gold} ทอง)`);
  }
  p.gold -= goldCost;

  const material = getCardUpgradeMaterial(p);
  const usedStone = Boolean(material);
  if (material) {
    p[material.source].splice(material.index, 1);
  }

  const chancePercent = getCardUpgradeSuccessRate(currentLevel, usedStone, material?.bonus, wordId);
  const rollPercent = typeof options.roll === 'number'
    ? Math.max(1, Math.min(100, Math.floor(options.roll)))
    : chancePercent >= 100
      ? 1
      : Math.floor(random(state) * 100) + 1;
  const succeeded = rollPercent <= chancePercent;
  const targetLevel = currentLevel + 1;
  const newLevel = succeeded ? targetLevel : currentLevel;
  p.cardUpgrades[wordId] = newLevel;

  const milestoneUnlocked = succeeded && CARD_SECONDARY_MILESTONES.includes(newLevel);
  if (newLevel >= CARD_SECONDARY_UNLOCK_LEVEL) {
    p.cardSecondaryUpgrades[wordId] = true;
  }

  return {
    state,
    mode: 'stat',
    wordId,
    upgraded: succeeded,
    failed: !succeeded,
    attemptedLevel: targetLevel,
    newLevel,
    chancePercent,
    rollPercent,
    secondaryUnlocked: hasCardSecondaryUpgrade(state, wordId),
    milestoneUnlocked,
    secondaryEffect: hasCardSecondaryUpgrade(state, wordId) ? getCardSecondaryEffect(wordId, Math.max(CARD_SECONDARY_UNLOCK_LEVEL, newLevel)) : null,
    effect: describeCardUpgradeEffect(wordId, newLevel),
    usedStone,
    materialId: material?.id,
    cost: goldCost,
    goldCost,
  };
}

export function rollBlessingChoices(original, targetRoomIndex = null) {
  if (!original || original.phase === 'lost') throw new Error('ไม่สามารถสุ่มพรได้ในขณะนี้');
  const state = structuredClone(original);
  const nextRoom = targetRoomIndex !== null
    ? targetRoomIndex
    : Math.min(state.rooms.length - 1, Math.max(state.highestRoom ?? 0, state.room));
  const cleared = state.clearedRooms ?? [];
  const highest = Math.max(state.highestRoom ?? 0, state.room);
  if (!Number.isInteger(nextRoom) || nextRoom < 0 || nextRoom >= state.rooms.length || (nextRoom > highest && !cleared.includes(nextRoom))) {
    throw new Error('ห้องปลายทางยังไม่ปลดล็อก');
  }
  const allIds = Object.keys(BLESSING_CATALOG);
  const pool = [...allIds];
  const choices = [];
  while (choices.length < 3 && pool.length) {
    const picked = pick(state, pool);
    choices.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }
  state.pendingBlessings = choices;
  state.pendingTargetRoom = nextRoom;
  return state;
}

export function chooseBlessingAndProceed(original, blessingId, targetRoomIndex = null) {
  const blessing = BLESSING_CATALOG[blessingId];
  if (!blessing) throw new Error('ไม่พบพรที่เลือก');
  if (Array.isArray(original.pendingBlessings) && original.pendingBlessings.length && !original.pendingBlessings.includes(blessingId)) {
    throw new Error('พรนี้ไม่ได้อยู่ในตัวเลือกที่สุ่มได้');
  }
  const state = structuredClone(original);
  const p = state.player;
  p.blessings ??= [];
  if (!p.blessings.includes(blessingId)) {
    p.blessings.push(blessingId);
  }
  if (blessingId === 'blessing_vitality') {
    p.maxHp += 4;
    p.hp = Math.min(p.maxHp, p.hp + 10);
  } else if (blessingId === 'blessing_fortune') {
    p.gold = (p.gold ?? 0) + 12;
  }
  const destRoom = targetRoomIndex ?? state.pendingTargetRoom ?? Math.min(state.rooms.length - 1, Math.max(state.highestRoom ?? 0, state.room));
  state.room = destRoom;
  return enterRoom(state);
}

export function updateSanctuaryLoadout(original, words) {
  if (original.phase !== 'sanctuary') throw new Error('ปรับชุดคำได้ในชั้นพักหรือก่อนขึ้นชั้น');
  validateDeckWords(original, words);
  const state = structuredClone(original);
  state.player.words = [...words];
  return state;
}

export function completeRevisitVictoryToSanctuary(state, summary = null) {
  const ret = state.replayReturn;
  const fallbackFloor = getSanctuaryCheckpoints(state)
    .findLast(floor => isSanctuaryFloorUnlocked(state, floor))
    ?? state.sanctuaryFloor
    ?? 5;
  const targetFloor = ret?.sanctuaryFloor ?? fallbackFloor;
  const targetRoom = ret?.room ?? state.room;
  delete state.replayReturn;
  delete state.magmaPuddles;
  delete state.blackhole;
  delete state.deathSpent;
  delete state.legendaryTurns;
  state.room = Math.min((state.rooms?.length ?? TOTAL_TOWER_ROOMS) - 1, Math.max(0, targetRoom));
  state.sanctuaryUnlocked = true;
  state.sanctuaryFloor = targetFloor;
  state.sanctuaryRested = false;
  delete state.krakenPhase;
  delete state.netherPhase;
  delete state.eternityPhase;
  state.phase = 'sanctuary';
  state.turn = 1;
  state.player.shield = null;
  state.player.elementBuffs = {};
  state.rewards = [];
  state.pendingBlessings = [];
  state.pendingTargetRoom = null;
  state.enemies = (state.rooms?.[state.room] ?? []).map((kind, index) => {
    const enemy = createEnemy(kind, index, state.room);
    enemy.hp = 0;
    return enemy;
  });
  if (summary) summary.revisitReturnedToSanctuary = targetFloor;
  return state;
}

export function revisitRoom(original, targetRoomIndex) {
  if (!original || original.phase === 'lost' || original.phase === 'reward') {
    throw new Error('ยังเปลี่ยนชั้นไม่ได้ในช่วงเปิดการ์ดรางวัล');
  }
  if (!Number.isInteger(targetRoomIndex) || targetRoomIndex < 0 || targetRoomIndex >= original.rooms.length) {
    throw new Error('ห้องที่เลือกไม่ถูกต้อง');
  }
  const cleared = original.clearedRooms ?? [];
  const highest = Math.max(original.highestRoom ?? 0, original.room);
  const canVisit = targetRoomIndex <= highest || cleared.includes(targetRoomIndex);
  if (!canVisit) {
    throw new Error('ต้องผ่านห้องก่อนหน้าเพื่อปลดล็อกเส้นทางนี้ก่อน');
  }
  const state = structuredClone(original);
  delete state.rift;
  if (cleared.includes(targetRoomIndex) && isSanctuaryUnlocked(original)) {
    const fallbackFloor = getSanctuaryCheckpoints(original)
      .findLast(floor => isSanctuaryFloorUnlocked(original, floor))
      ?? original.sanctuaryFloor
      ?? 5;
    state.replayReturn = {
      room: original.phase === 'sanctuary' ? original.room : Math.min(state.rooms.length - 1, highest),
      sanctuaryFloor: original.phase === 'sanctuary' ? (original.sanctuaryFloor ?? fallbackFloor) : fallbackFloor,
    };
  } else {
    delete state.replayReturn;
  }
  state.room = targetRoomIndex;
  return enterRoom(state);
}

export function useBattleItem(original, beltIndex) {
  if (original.phase !== 'battle') throw new Error('ใช้ไอเทมได้เฉพาะในเทิร์นต่อสู้เท่านั้น');
  const items = original.player.items ?? [];
  if (!Number.isInteger(beltIndex) || beltIndex < 0 || beltIndex >= items.length) {
    throw new Error('ไม่พบไอเทมในช่องเข็มขัดนี้');
  }
  const itemId = items[beltIndex];
  const item = SHOP_ITEMS[itemId];
  if (!item) throw new Error('ไม่รู้จักไอเทมนี้');

  const state = structuredClone(original);
  state.player.items.splice(beltIndex, 1);
  const p = state.player;
  p.level ??= 1;
  p.exp ??= 0;
  p.gold ??= 0;
  state.clearedRooms ??= [];
  state.highestRoom ??= state.room;
  let effectText = '';
  const events = [];
  const summary = { roomRecovery: 0 };

  function stripWard(enemy) {
    const amount = enemy.ward;
    if (enemy.hp <= 0 || !amount) return 0;
    enemy.ward = 0;
    events.push({ type: 'dispel', target: enemy.id, amount });
    return amount;
  }

  function dealAoeConsumable(amount, element, label, pierceArmor = false) {
    let totalDmg = 0;
    const revisit = isRoomRevisit(state, state.room);
    const dropsCard = hasCardReward(state);
    const skipBossBounty = dropsCard && cardRewardReplacesBounty(state);
    const rate = revisit ? REVISIT_REWARD_RATE : 1;
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue;
      const rawAmount = typeof amount === 'function' ? amount(enemy) : amount;
      const afterArmor = pierceArmor ? rawAmount : Math.max(1, rawAmount - enemy.armor);
      const dmg = Math.min(eternityDamageLimit(state, enemy), afterArmor);
      enemy.hp -= dmg;
      totalDmg += dmg;
      events.push({ type: 'damage', target: enemy.id, amount: dmg, actual: dmg, element, killed: enemy.hp === 0 });
      if (enemy.hp === 0) {
        const base = ENEMIES[enemy.kind];
        const bossEnemy = Boolean(base?.isBoss || isBossRoom(state));
        if (!bossEnemy || revisit || !skipBossBounty) {
          const expGain = Math.max(1, Math.floor((base?.exp ?? 8) * rate));
          const goldGain = Math.max(1, Math.floor((base?.gold ?? 6) * rate));
          applyExpAndGold(p, expGain, goldGain);
        }
      }
    }
    checkNetherPhase2(state, summary, events);
    checkEternityPhase2(state, summary, events);
    if (state.enemies.every(e => e.hp <= 0)) {
      if (!state.krakenPhase && state.enemies.some(e => KRAKEN_TENTACLE_KINDS.includes(e.kind))) {
        triggerKrakenPhase2(state, summary, events);
        prepareEnemies(state);
        return totalDmg;
      }
      if (state.room === FLOOR100_BOSS_ROOM && state.eternityPhase !== 3 && state.enemies.some(e => e.kind === 'eternity_overlord')) {
        triggerEternityPhase3(state, summary, events);
        prepareEnemies(state);
        return totalDmg;
      }
      if (state.rift) {
        resolveRiftBattleVictory(state, summary, events);
        return totalDmg;
      }
      delete state.magmaPuddles;
      delete state.blackhole;
      delete state.deathSpent;
      delete state.legendaryTurns;
      delete state.krakenPhase;
      delete state.netherPhase;
      delete state.eternityPhase;
      if (!state.clearedRooms.includes(state.room)) state.clearedRooms.push(state.room);
      recordClearedFloorProgress(state, state.room);
      state.highestRoom = Math.max(state.highestRoom ?? 0, Math.min(state.rooms.length - 1, state.room + 1));
      if (dropsCard) {
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
          const relicId = grantBossRelic(p, majorBossFloor);
          if (relicId) {
            summary.relicDropped = relicId;
            events.push({ type: 'relic', relicId });
          }
          if (majorBossFloor === 100 || state.room >= (state.rooms?.length ?? TOTAL_TOWER_ROOMS) - 1) {
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
    return totalDmg;
  }

  const maxMana = getMaxMana(p);
  const handLimit = getHandLimit(p);
  if (itemId === 'chronos_hourglass') {
    const manaGain = Math.min(6, Math.max(0, maxMana - p.mana));
    const drawCount = Math.max(0, handLimit - p.hand.length);
    if (!manaGain && !drawCount) throw new Error('มานาและการ์ดในมือเต็มอยู่แล้ว');
    p.mana += manaGain;
    if (drawCount > 0) {
      const deck = activeBattleDeck(state);
      const draw = { rng: state.handRng };
      for (let i = 0; i < drawCount; i++) p.hand.push(pick(draw, deck));
      state.handRng = draw.rng;
    }
    const parts = [
      manaGain ? `ฟื้น +${manaGain} MP` : '',
      drawCount ? `จั่วเพิ่ม ${drawCount} ใบจนเต็มมือ (${p.hand.length}/${handLimit})` : '',
    ].filter(Boolean);
    effectText = `หมุนนาฬิกาทรายกาลเวลา · ${parts.join(' และ ')}!`;
  } else if (item.hpRestore || item.manaRestore) {
    const hp = Math.min(item.hpRestore ?? 0, p.maxHp - p.hp);
    const mana = Math.min(item.manaRestore ?? 0, maxMana - p.mana);
    if (!hp && !mana) throw new Error('พลังชีวิตและมานาที่ไอเทมนี้ฟื้นได้เต็มอยู่แล้ว');
    p.hp += hp;
    p.mana += mana;
    effectText = `ใช้${item.name} · ${[hp ? `HP +${hp}` : '', mana ? `MP +${mana}` : ''].filter(Boolean).join(' · ')}`;
  } else if (itemId === 'frost_dust') {
    for (const enemy of state.enemies.filter(e => e.hp > 0)) enemy.chill += 4;
    effectText = 'โปรยผงหมอกเย็น · ศัตรูทุกตัวหนาว 4';
  } else if (itemId === 'veil_eraser') {
    const total = state.enemies.reduce((sum, enemy) => sum + stripWard(enemy), 0);
    if (!total) throw new Error('ศัตรูไม่มีม่านให้สลาย');
    effectText = `โปรยผงสลายม่าน · สลายม่านรวม ${total} ชั้น`;
  } else if (itemId === 'silence_scroll') {
    const targets = state.enemies.filter(enemy => enemy.hp > 0 && !enemy.sealed);
    if (!targets.length) throw new Error('ศัตรูทุกตัวถูกผนึกอยู่แล้ว');
    for (const enemy of targets) enemy.sealed = true;
    effectText = `เปิดม้วนผนึกอาคม · ผนึกศัตรู ${targets.length} ตัว`;
  } else if (itemId === 'draw_pages') {
    const amount = Math.min(2, Math.max(0, handLimit - p.hand.length));
    if (!amount) throw new Error('มือเต็มแล้ว ต้องมีที่ว่างก่อนจั่ว');
    const deck = activeBattleDeck(state);
    const draw = { rng: state.handRng };
    for (let i = 0; i < amount; i++) p.hand.push(pick(draw, deck));
    state.handRng = draw.rng;
    effectText = `เปิดหน้าตำราเรียกคำ · จั่วเพิ่ม ${amount} ใบ`;
  } else if (itemId === 'aegis_shard') {
    p.shield = makeShield([...shieldLayers(p.shield), { hp: 6, expires: state.turn + 1, effect: null, triggered: false }]);
    effectText = 'บดผลึกโล่ฉุกเฉิน · กางโล่เวทป้องกัน +6 หน่วยทันที!';
  } else if (itemId === 'coral_barrier_tome') {
    p.shield = { layers: [20], expires: state.turn + 1, effect: null, triggered: false };
    effectText = 'เปิดคัมภีร์ปะการังศิลา · กางกำแพงปะการังป้องกัน +20 หน่วยทันที!';
  } else if (itemId === 'oceanic_bubble') {
    p.shield = { layers: [15], expires: state.turn + 1, effect: 'water', triggered: false };
    effectText = 'กางฟองอากาศมหาป้อง · มอบโล่ดูดซับ +15 ดาเมจ!';
  } else if (itemId === 'obsidian_armor_flask') {
    p.shield = { layers: [25], expires: state.turn + 1, effect: 'earth', triggered: false };
    effectText = 'ดื่มน้ำยาผลึกออบซิเดียน · เคลือบเกราะหินดำมอบโล่ +25 หน่วย!';
  } else if (itemId === 'galvanic_shield_generator') {
    p.shield = { layers: [30], expires: state.turn + 1, effect: 'lightning', triggered: false };
    effectText = 'เปิดเครื่องสร้างสนามแม่เหล็ก · กางบาเรียสายฟ้าป้องกัน +30 หน่วย!';
  } else if (itemId === 'titan_wall_scroll') {
    p.shield = { layers: [40], expires: state.turn + 1, effect: 'earth', triggered: false };
    effectText = 'ร่ายม้วนคาถากำแพงไททัน · อัญเชิญกำแพงหินศิลาโบราณมอบโล่ +40 หน่วย!';
  } else if (itemId === 'omega_ward_prism') {
    p.shield = { layers: [50], expires: state.turn + 1, effect: null, triggered: false };
    effectText = 'ปลดปล่อยปริซึมเกราะโอเมก้า · มหาโล่ครอบคลุมร่างกาย +50 หน่วย!';
  } else if (itemId === 'frost_shield_rune') {
    p.shield = { layers: [35], expires: state.turn + 1, effect: 'ice', triggered: false };
    for (const enemy of state.enemies.filter(e => e.hp > 0)) enemy.chill += 3;
    effectText = 'สลักรูนโล่น้ำแข็งศักดิ์สิทธิ์ · มอบโล่ +35 หน่วยและศัตรูหนาวจัด!';
  } else if (itemId === 'cyclone_feather') {
    p.shield = { layers: [20], expires: state.turn + 1, effect: 'wind', triggered: false };
    openHand(state);
    effectText = 'สะบัดขนนกพายุหมุนคลั่ง · มอบโล่ +20 หน่วยและสลับการ์ดเต็มมือ!';
  } else if (itemId === 'absolute_zero_vial') {
    for (const enemy of state.enemies.filter(e => e.hp > 0)) enemy.freeze += 1;
    effectText = 'โปรยขวดความเย็นสัมบูรณ์ · แช่แข็งศัตรูทุกตัวในสนาม 1 เทิร์น!';
  } else if (itemId === 'ignite_scroll') {
    const clearedCount = state.enemies.reduce((sum, enemy) => sum + stripWard(enemy), 0);
    effectText = `เผาทำลายม่านเวทด้วยม้วนจุดเพลิง · สลายม่านศัตรูรวม ${clearedCount} ชั้น!`;
  } else if (itemId === 'redraw_dust') {
    openHand(state);
    effectText = 'โปรยผงเปลี่ยนชะตา · จั่วการ์ดในมือใหม่ 5 ใบ!';
  } else if (itemId === 'ember_scroll') {
    const totalDmg = dealAoeConsumable(6, 'fire', 'ม้วนเพลิงกวาดล้าง');
    effectText = `เปิดม้วนเพลิงกวาดล้าง · เผาศัตรูทุกตัวรวม ${totalDmg} ดาเมจ!`;
  } else if (itemId === 'volcanic_ash_bomb') {
    const totalDmg = dealAoeConsumable(22, 'fire', 'ระเบิดเถ้าภูเขาไฟ');
    effectText = `ขว้างระเบิดเถ้าภูเขาไฟ · สร้าง ${totalDmg} ดาเมจไฟใส่ศัตรูทั้งหมด!`;
  } else if (itemId === 'zenith_blade_sigil') {
    const totalDmg = dealAoeConsumable(50, 'lightning', 'ตราดาบแห่งเซนิธ', true);
    effectText = `ปลดปล่อยตราดาบแห่งเซนิธ · ฟาดดาบดวงดาวทำลาย ${totalDmg} ดาเมจจริง!`;
  } else if (itemId === 'supernova_core') {
    const totalDmg = dealAoeConsumable(35, 'fire', 'แกนซูเปอร์โนวา');
    effectText = `ระเบิดแกนซูเปอร์โนวา · สร้างคลื่นทำลาย ${totalDmg} ดาเมจ!`;
  } else if (itemId === 'void_singularity_flask') {
    const totalDmg = dealAoeConsumable(enemy => (ENEMIES[enemy.kind]?.isBoss ? 45 : enemy.hp), 'wind', 'ขวดสุญญากาศเอกภพ', true);
    effectText = `เปิดมิติหลุมดำจากขวดสุญญากาศเอกภพ · ทำลายศัตรูทั่วไปและสร้างความเสียหายรวม ${totalDmg}!`;
  } else if (itemId === 'pure_lightning_rod') {
    const target = state.enemies.find(e => e.hp > 0);
    if (target) {
      stripWard(target);
      const dmg = Math.min(eternityDamageLimit(state, target), 24);
      target.hp -= dmg;
      events.push({ type: 'damage', target: target.id, amount: dmg, actual: dmg, element: 'lightning', killed: target.hp === 0 });
      effectText = `ฟาดสายล่อฟ้าทองคำ · ล้างม่านและทำ ${dmg} ดาเมจใส่ ${ENEMIES[target.kind]?.name ?? target.kind}!`;
      if (state.enemies.every(e => e.hp <= 0)) dealAoeConsumable(0, 'lightning', '');
    }
  } else if (itemId === 'sea_serpent_fang') {
    const target = state.enemies.find(e => e.hp > 0);
    if (target) {
      const dmg = Math.min(eternityDamageLimit(state, target), 18);
      target.hp -= dmg;
      events.push({ type: 'damage', target: target.id, amount: dmg, actual: dmg, element: 'water', killed: target.hp === 0 });
      effectText = `ซัดเขี้ยวอสรพิษสมุทร · ทำ ${dmg} ดาเมจเจาะเกราะใส่ ${ENEMIES[target.kind]?.name ?? target.kind}!`;
      if (state.enemies.every(e => e.hp <= 0)) dealAoeConsumable(0, 'water', '');
    }
  } else if (itemId === 'chain_lightning_orb') {
    const targets = state.enemies.filter(e => e.hp > 0).slice(0, 2);
    let total = 0;
    for (const t of targets) {
      const dmg = Math.min(eternityDamageLimit(state, t), 18);
      t.hp -= dmg;
      total += dmg;
      events.push({ type: 'damage', target: t.id, amount: dmg, actual: dmg, element: 'lightning', killed: t.hp === 0 });
    }
    effectText = `ปลดปล่อยลูกแก้วอสุนีบาตลูกโซ่ · ทำความเสียหายรวม ${total}`;
    if (state.enemies.every(e => e.hp <= 0)) dealAoeConsumable(0, 'lightning', '');
  } else if (itemId === 'pyro_core_extract') {
    const target = state.enemies.find(e => e.hp > 0);
    if (target) {
      const dmg = Math.min(eternityDamageLimit(state, target), 15);
      target.hp -= dmg;
      events.push({ type: 'damage', target: target.id, amount: dmg, actual: dmg, element: 'fire', killed: target.hp === 0 });
      target.burn += 5;
      effectText = `สาดสารสกัดแก่นเพลิงใส่ ${ENEMIES[target.kind]?.name ?? target.kind} · ${dmg} ดาเมจและเผาไหม้ 5!`;
      if (state.enemies.every(e => e.hp <= 0)) dealAoeConsumable(0, 'fire', '');
    }
  }

  checkEternityPhase2(state, summary, events);
  return { ok: true, state, item, effectText, events, summary };
}

export const firstClimaxTurn = room => room >= FLOOR31_START_ROOM ? 8 : 7;
export function enemyClimaxBonus(turn, room) {
  const sinceStart = turn - firstClimaxTurn(room);
  if (sinceStart < 0) return 0;
  return 1 + Math.floor(sinceStart / (room >= FLOOR31_START_ROOM ? 2 : 1));
}

export function intent(enemy, turn, enemies = [], room = 0) {
  if (enemy.hp <= 0) return { type: 'dead', amount: 0, label: 'ปราบแล้ว' };
  const cycle = turn % 3;
  const profile = ENEMIES[enemy.kind];
  if (enemy.kind === 'ink_ray' && cycle === 2) {
    const next = Math.max(0, 12 + enemyClimaxBonus(turn + 1, room) - (enemy.chill || 0) - (enemy.obscured ? 4 : 0));
    return { type: 'charge', amount: 0, shortLabel: `พุ่ง ${next}`, label: `รวบปีกเตรียมพุ่ง ${next} เทิร์นถัดไป` };
  }
  if (enemy.kind === 'prism_crab' && cycle === 1) {
    return { type: 'charge', amount: 0, shortLabel: 'ปิดกระดอง', label: 'เทิร์นหน้ากระดองเปิด เกราะเหลือ 1 ก่อนโจมตีด้วยก้ามหนัก' };
  }
  if (['chain_hound', 'void_imp'].includes(enemy.kind) && turn % 2 === 1 && enemy.slot > 0
    && !enemies.some(other => other.hp > 0 && other.slot === enemy.slot - 1)) {
    return { type: 'advance', amount: 0, slot: enemy.slot - 1, shortLabel: `เข้าช่อง ${enemy.slot}`, label: `ไล่ประชิดไปช่อง ${enemy.slot} · โจมตีแรงขึ้นเมื่ออยู่ช่อง 1` };
  }
  const healingLight = enemy.kind === 'lantern_wisp' && turn % 2 === 1;
  const wardingMoth = ['scroll_moth', 'iron_warden'].includes(enemy.kind) && cycle === 1;
  if (healingLight || wardingMoth) {
    const allies = enemies.filter(other => other.id !== enemy.id && other.hp > 0);
    const target = healingLight
      ? allies.filter(other => other.hp < other.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.slot - b.slot)[0]
      : allies.filter(other => !other.ward && !other.wardGrant).sort((a, b) => a.slot - b.slot)[0];
    if (target) {
      if (enemy.sealed) return { type: 'sealed', amount: 0, label: 'ติดผนึก · ข้ามท่าสนับสนุน' };
      return healingLight
        ? { type: 'heal', amount: 6, target: target.id, shortLabel: `ฮีล #${target.slot + 1}`, label: `ฟื้น 6 HP ให้เพื่อนช่อง ${target.slot + 1}` }
        : { type: 'ward-grant', amount: 1, target: target.id, shortLabel: `ม่าน #${target.slot + 1}`, label: `ถักม่าน 1 ชั้นให้เพื่อนช่อง ${target.slot + 1} ในเทิร์นถัดไป` };
    }
  }
  // Floor 80★ Kraken Tentacles (Phase 1): distinct cooldown roles
  if (enemy.kind === 'kraken_ward_tentacle' && turn % 2 === 1) {
    const allies = enemies.filter(other => other.id !== enemy.id && other.hp > 0);
    if (allies.length) {
      if (enemy.sealed) return { type: 'sealed', amount: 0, label: 'ติดผนึก · ข้ามการกางม่านให้หนวดอื่น' };
      return {
        type: 'ward-grant-all',
        amount: 1,
        targets: allies.map(other => other.id),
        shortLabel: `ม่าน ×${allies.length}`,
        label: `กางม่านวารี +1 ชั้นให้หนวดเส้นอื่นทั้งหมด (${allies.length} เส้น) ในเทิร์นถัดไป · คูลดาวน์ 2 เทิร์น`,
      };
    }
  }
  if (enemy.kind === 'kraken_heal_tentacle' && turn % 2 === 0) {
    const injured = enemies
      .filter(other => other.hp > 0 && other.hp < other.maxHp)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.slot - b.slot)[0];
    if (injured) {
      if (enemy.sealed) return { type: 'sealed', amount: 0, label: 'ติดผนึก · ข้ามการฟื้นฟูหนวด' };
      return {
        type: 'heal',
        amount: 220,
        target: injured.id,
        shortLabel: `ฮีล #${injured.slot + 1} +220`,
        label: `ฟื้นฟู +220 HP ให้ ${ENEMIES[injured.kind].name} (ช่อง ${injured.slot + 1}) · คูลดาวน์ 2 เทิร์น`,
      };
    }
  }
  if (enemy.kind === 'kraken_crush_tentacle' && cycle === 2) {
    if (enemy.freeze > 0) return { type: 'frozen', amount: 0, label: 'แช่แข็ง · ข้ามการชาร์จ' };
    const next = Math.max(0, 92 + enemyClimaxBonus(turn + 1, room) - (enemy.chill || 0) - (enemy.obscured ? 4 : 0));
    return { type: 'charge', amount: 0, shortLabel: `ชาร์จ ${next}`, label: `ยกหนวดยักษ์บดขยี้ · เทิร์นหน้าฟาดหนัก ${next}!` };
  }
  // Floor 90★ Nether Dread Lord Tri-Pillar Pact: distinct pillar cooldown roles
  if (enemy.kind === 'nether_leech_pillar' && turn % 2 === 1) {
    const bossTarget = enemies.find(other => other.kind === 'nether_dread_lord' && other.hp > 0 && other.hp < other.maxHp);
    if (bossTarget) {
      if (enemy.sealed) return { type: 'sealed', amount: 0, label: 'ติดผนึก · ข้ามการถ่ายวิญญาณฟื้นบอส' };
      return {
        type: 'heal',
        amount: 180,
        target: bossTarget.id,
        shortLabel: 'ดูดวิญญาณ +180',
        label: `ถ่ายวิญญาณฟื้น +180 HP ให้ ${ENEMIES[bossTarget.kind].name} · คูลดาวน์ 2 เทิร์น`,
      };
    }
  }
  if (enemy.kind === 'nether_curse_pillar' && turn % 2 === 1) {
    const bossTarget = enemies.find(other => other.kind === 'nether_dread_lord' && other.hp > 0 && other.ward < 3);
    if (bossTarget) {
      if (enemy.sealed) return { type: 'sealed', amount: 0, label: 'ติดผนึก · ข้ามการถักม่านมืดให้บอส' };
      return {
        type: 'ward-grant',
        amount: 1,
        target: bossTarget.id,
        shortLabel: 'ม่านบอส +1',
        label: `ถักม่านมืด +1 ชั้นให้ ${ENEMIES[bossTarget.kind].name} ในเทิร์นถัดไป · คูลดาวน์ 2 เทิร์น`,
      };
    }
  }
  if (enemy.kind === 'nether_doom_pillar' && cycle === 2) {
    if (enemy.freeze > 0) return { type: 'frozen', amount: 0, label: 'แช่แข็ง · ข้ามการชาร์จลำแสงทัณฑ์' };
    const next = Math.max(0, 88 + enemyClimaxBonus(turn + 1, room) - enemy.chill - (enemy.obscured ? 4 : 0));
    return { type: 'charge', amount: 0, shortLabel: `ชาร์จ ${next}`, label: `รวบรวมทัณฑ์นรกานต์ · เทิร์นหน้ายิงลำแสง ${next}!` };
  }
  if (enemy.kind === 'chronos_keeper' && room === FLOOR100_BOSS_ROOM && turn % 2 === 1) {
    const allies = enemies.filter(other => other.hp > 0 && other.id !== enemy.id);
    const target = allies.reduce((best, other) => !best || other.hp * best.maxHp < best.hp * other.maxHp
      || (other.hp * best.maxHp === best.hp * other.maxHp && other.slot < best.slot) ? other : best, null);
    if (target) {
      if (enemy.sealed) return { type: 'sealed', amount: 0, label: 'ติดผนึก · ข้ามการกางม่านเวลา' };
      return {
        type: 'ward-grant',
        amount: 1,
        target: target.id,
        shortLabel: `ม่านเวลา #${target.slot + 1}`,
        label: `กางม่านเวลา +1 ชั้นในเทิร์นถัดไปให้ ${ENEMIES[target.kind].name} (ช่อง ${target.slot + 1})`,
      };
    }
  }
  const isMajorClimaxRelease = ['ember_overlord', 'tempest_archon', 'volcano_colossus', 'thunder_drake_emperor', 'ancient_chitin_behemoth', 'abyssal_kraken', 'nether_dread_lord', 'eternity_overlord', 'eternity_reborn'].includes(enemy.kind) && turn % 4 === 0;
  if (!isMajorClimaxRelease && profile.swapTurn === cycle) {
    const target = enemies.filter(other => other.hp > 0 && other.id !== enemy.id)
      .sort((a, b) => Math.abs(b.slot - enemy.slot) - Math.abs(a.slot - enemy.slot) || a.slot - b.slot)[0];
    if (target) {
      if (enemy.sealed) return { type: 'sealed', amount: 0, label: 'ติดผนึก · ข้ามการสลับช่อง' };
      return { type: 'swap', amount: 0, target: target.id, shortLabel: `สลับ #${target.slot + 1}`,
        label: `สลับช่องกับ ${ENEMIES[target.kind].name} ที่ช่อง ${target.slot + 1}` };
    }
    if (profile.heavy) return { type: 'recover', amount: 0, shortLabel: 'เสียจังหวะ', label: 'ไม่มีลูกสมุนให้สลับ · พักโจมตีรอบนี้' };
  }
  const boss = enemy.kind === 'seal_curator' || enemy.kind === 'crown_archivist';
  const bossBloodied = boss && (enemy.hp <= enemy.maxHp / 2 || (enemy.kind === 'crown_archivist' && room === FLOOR30_BOSS_ROOM));
  if (enemy.kind === 'ward_scribe' || enemy.kind === 'ward_keeper' || (bossBloodied && cycle === 1)) {
    const allies = enemies.filter(other => other.hp > 0 && other.id !== enemy.id);
    const target = allies.reduce((best, other) => !best || other.hp * best.maxHp < best.hp * other.maxHp
      || (other.hp * best.maxHp === best.hp * other.maxHp && other.slot < best.slot) ? other : best, null);
    const heals = enemy.kind === 'ward_scribe' && turn % 2 === 1;
    const guards = (enemy.kind === 'ward_scribe' && !heals) || ((enemy.kind === 'ward_keeper' || bossBloodied) && cycle === 1);
    if (target && (heals || guards)) {
      if (enemy.sealed) return { type: 'sealed', amount: 0, label: 'ติดผนึก · ข้ามท่าสนับสนุน' };
      const type = heals ? 'heal' : 'ward-grant';
      const amount = heals ? 6 : 1;
      return { type, amount, target: target.id, shortLabel: `${heals ? 'ฮีล' : 'ม่าน'} #${target.slot + 1}`,
        label: `${heals ? 'ฟื้น HP 6' : 'เพิ่มม่าน 1 ชั้นในเทิร์นถัดไป'} ให้ช่อง ${target.slot + 1} · เลือกเพื่อนที่สัดส่วน HP ต่ำสุด` };
    }
  }
  if ((enemy.kind === 'rune_ram' && cycle === 2) || (boss && cycle === 1)) {
    const base = enemy.kind === 'rune_ram' ? 15 : enemy.kind === 'seal_curator' ? 17 : 20;
    const next = Math.max(0, base + enemyClimaxBonus(turn + 1, room) - (enemy.chill || 0));
    return { type: 'charge', amount: 0, shortLabel: `ชาร์จ ${next}`, label: `เตรียมโจมตีหนัก ${next} เทิร์นถัดไป` };
  }
  if (boss && cycle === 0) return { type: 'recover', amount: 0, label: 'เปิดช่อง · เกราะ 0 และพักโจมตี' };
  if (enemy.kind === 'ember_imp' && cycle === 2) {
    const next = Math.max(0, 9 + enemyClimaxBonus(turn + 1, room) - (enemy.chill || 0) - (enemy.obscured ? 4 : 0));
    return { type: 'charge', amount: 0, shortLabel: `ชาร์จ ${next}`, label: `รวบเพลิงเตรียมโจมตี ${next} เทิร์นถัดไป` };
  }
  if (['charger', 'sentinel', 'rune_golem', 'storm_titan', 'obsidian_golem', 'astral_sentinel', 'thunder_colossus'].includes(enemy.kind) && turn % 2 === 1) {
    return { type: 'charge', amount: 0, label: `เตรียมโจมตี ${ENEMIES[enemy.kind].attack}` };
  }
  if (enemy.kind === 'ember_overlord' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'ชาร์จเพลิงบรรพกาล · เทิร์นหน้าทุบ 16!' };
  }
  if (enemy.kind === 'tempest_archon' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'ชาร์จมหาพายุอัสนี · เทิร์นหน้าฟาด 20!' };
  }
  if (enemy.kind === 'volcano_colossus' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'ชาร์จแมกม่ากลืนพิภพ · เทิร์นหน้าทุบ 68!' };
  }
  if (enemy.kind === 'thunder_drake_emperor' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'สะสมกระแสไฟฟ้าดารากระหน่ำ · เทิร์นหน้าฟาด 84!' };
  }
  if (enemy.kind === 'ancient_chitin_behemoth' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'สะเทือนธรณีปฐมกาล · เทิร์นหน้ากระแทก 104!' };
  }
  if (enemy.kind === 'abyssal_kraken' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'รวบรวมมหาคลื่นสึนามิบาดาล · เทิร์นหน้าซัด 108!' };
  }
  if (enemy.kind === 'nether_dread_lord' && turn % 4 === 3) {
    const doomBonus = enemies.some(other => other.kind === 'nether_doom_pillar' && other.hp > 0) ? 18 : 0;
    return { type: 'charge', amount: 0, label: `รวบรวมเปลวเพลิงนรกานต์ · เทิร์นหน้าเฉือน ${128 + doomBonus}!` };
  }
  if (enemy.kind === 'eternity_overlord' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'รวบรวมพลังงานกาลอวกาศนิรันดร์ · เทิร์นหน้าปลดปล่อยคลื่นทำลาย 152!' };
  }
  if (enemy.kind === 'eternity_reborn' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'รวบรวมดาราจักรดับสูญ · เทิร์นหน้าซัดซูเปอร์โนวา 188!' };
  }
  if (enemy.kind === 'support' && turn % 2 === 1) return { type: 'heal', amount: 3, label: 'ฟื้น HP พวกเดียวกัน 3' };
  if (enemy.kind === 'chrono_sage' && turn % 2 === 1) return { type: 'heal', amount: 5, label: 'ฟื้น HP พวกเดียวกัน 5' };
  if (enemy.freeze > 0) return { type: 'frozen', amount: 0, label: 'แช่แข็ง · ข้ามการโจมตี' };
  let base = ENEMIES[enemy.kind].attack;
  if (enemy.kind === 'ember_imp' && cycle === 0) base = 9;
  if (enemy.kind === 'void_imp' && enemy.slot === 0) base += 3;
  if (enemy.kind === 'ink_ray' && cycle === 0) base = 12;
  if (enemy.kind === 'prism_crab' && cycle === 2) base = 13;
  if (enemy.kind === 'chain_hound' && enemy.slot === 0) base += 3;
  if (profile.distanceAttack) base += enemy.slot * 2;
  if (profile.heavy && cycle === (profile.swapTurn === 1 ? 2 : 0)) base = profile.heavy;
  if (enemy.kind === 'rune_ram' && cycle === 0) base = 15;
  if (boss && cycle === 2) base = enemy.kind === 'seal_curator' ? 17 : 20;
  if (enemy.kind === 'boss' && turn % 3 === 2) base = 8;
  else if (enemy.kind === 'mirror_mage') {
    const phase = turn % 3;
    if (phase === 2) base = 8;
    else if (phase === 0) base = 10;
  }
  else if (enemy.kind === 'frost_lich' && turn % 3 === 2) base = 9;
  else if (enemy.kind === 'arch_codex' && turn % 3 === 2) base = 11;
  else if (enemy.kind === 'ember_overlord') {
    if (turn % 4 === 0) base = 16;
    else if (turn % 4 === 2) base = 10;
  }
  else if (enemy.kind === 'prism_watcher' && turn % 2 === 0) base = 11;
  else if (enemy.kind === 'elder_grimoire' && turn % 3 === 2) base = 13;
  else if (enemy.kind === 'eclipse_mage') {
    const phase = turn % 3;
    if (phase === 2) base = 12;
    else if (phase === 0) base = 14;
  }
  else if (enemy.kind === 'glacial_sovereign' && turn % 3 === 2) base = 13;
  else if (enemy.kind === 'nexus_codex' && turn % 3 === 2) base = 15;
  else if (enemy.kind === 'tempest_archon') {
    if (turn % 4 === 0) base = 20;
    else if (turn % 4 === 2) base = 14;
  }
  else if (enemy.kind === 'volcano_colossus') {
    if (turn % 4 === 0) base = 68;
    else if (turn % 4 === 2) base = 38;
  }
  else if (enemy.kind === 'thunder_drake_emperor') {
    if (turn % 4 === 0) base = 84;
    else if (turn % 4 === 2) base = 48;
  }
  else if (enemy.kind === 'ancient_chitin_behemoth') {
    if (turn % 4 === 0) base = 104;
    else if (turn % 4 === 2) base = 58;
  }
  else if (enemy.kind === 'abyssal_kraken') {
    if (turn % 4 === 0) base = 108;
    else if (turn % 4 === 2) base = 58;
  }
  else if (enemy.kind === 'kraken_crush_tentacle' && cycle === 0) {
    base = 92;
  }
  else if (enemy.kind === 'nether_dread_lord') {
    if (turn % 4 === 0) base = 128;
    else if (turn % 4 === 2) base = 70;
  }
  else if (enemy.kind === 'nether_doom_pillar' && cycle === 0) {
    base = 88;
  }
  else if (enemy.kind === 'eternity_overlord') {
    if (turn % 4 === 0) base = 152;
    else if (turn % 4 === 2) base = 82;
  }
  else if (enemy.kind === 'eternity_reborn') {
    if (turn % 4 === 0) base = 188;
    else if (turn % 4 === 2) base = 112;
  }
  const loomAllies = enemy.kind === 'loom_sovereign' && room === FLOOR50_BOSS_ROOM && cycle === 2
    ? enemies.filter(other => other.hp > 0 && other.id !== enemy.id).length : 0;
  const eternityAllies = enemy.kind === 'eternity_overlord' && room === FLOOR100_BOSS_ROOM && turn % 4 === 2
    ? enemies.filter(other => other.hp > 0 && other.id !== enemy.id).length : 0;
  const eternityAbsorbedBonus = enemy.kind === 'eternity_overlord' && room === FLOOR100_BOSS_ROOM
    ? (enemy.eternityAbsorbed ?? 0) * 12 : 0;
  const netherDoomBonus = enemy.kind === 'nether_dread_lord' && enemies.some(other => other.kind === 'nether_doom_pillar' && other.hp > 0) ? 18 : 0;
  base += loomAllies * 3 + eternityAllies * 10 + eternityAbsorbedBonus + netherDoomBonus;
  const amount = Math.max(0, base + enemyClimaxBonus(turn, room) - (enemy.chill || 0) - (enemy.obscured ? 4 : 0));
  if (enemy.kind === 'eternity_reborn' && turn % 4 === 1) {
    return {
      type: 'attack',
      amount,
      manaDrain: 2,
      shortLabel: `โจมตี ${amount} · −2 MP`,
      label: `คลื่นสุญญากาศอนันต์โจมตี ${amount} + สูบมานา −2 MP`,
    };
  }
  if (enemy.kind === 'eternity_reborn' && turn % 4 === 2) {
    const shattered = (enemy.eternityShatterUntil ?? 0) >= turn;
    return {
      type: 'attack',
      amount,
      chronoRewind: 400,
      shortLabel: shattered ? `โจมตี ${amount} (หยุดเวลา)` : `โจมตี ${amount} + ย้อนเวลา 400`,
      label: shattered
        ? `โจมตี ${amount} · ผลึกธาตุแตกแล้ว (ตัดการย้อนเวลาฟื้นเลือด!)`
        : `ย้อนกาลเวลาโจมตี ${amount} และฟื้นฟู +400 HP (ตีจุดอ่อนเพื่อทลายผลึกและหยุดเวลา!)`,
    };
  }
  if (enemy.kind === 'kraken_ink_tentacle' && cycle === 2) {
    return {
      type: 'attack',
      amount,
      manaDrain: 2,
      shortLabel: `หมึก ${amount} · −2 MP`,
      label: `พ่นหมึกดำบาดาลโจมตี ${amount} + สูบมานา −2 MP · คูลดาวน์ 3 เทิร์น`,
    };
  }
  if (enemy.kind === 'abyssal_kraken' && turn % 4 === 2) {
    return {
      type: 'attack',
      amount,
      selfHeal: 120,
      shortLabel: `โจมตี ${amount} + ฮีล 120`,
      label: `ดูดกลืนกระแสน้ำโจมตี ${amount} และฟื้นเลือดตนเอง +120 HP`,
    };
  }
  const inNetherOverdrive = enemy.kind === 'nether_dread_lord'
    && enemies.some(other => NETHER_PILLAR_KINDS.includes(other.kind))
    && !enemies.some(other => NETHER_PILLAR_KINDS.includes(other.kind) && other.hp > 0);
  if (inNetherOverdrive) {
    const purged = enemy.netherPurgeUntil >= turn;
    return {
      type: 'attack',
      amount,
      soulDrain: 150,
      shortLabel: purged ? `โจมตี ${amount} (ชำระแล้ว)` : `โจมตี ${amount} · สูบชีพ 150`,
      label: purged
        ? `โจมตี ${amount} · ติดสถานะชำระมลทิน (ตัดการสูบวิญญาณ)`
        : `โหมดปลดผนึก: โจมตี ${amount} · หากทะลุโล่เข้าเลือดจะสูบวิญญาณฟื้น +150 HP`,
    };
  }
  return { type: 'attack', amount, label: `โจมตี ${amount}${netherDoomBonus ? ` (เสาพิพากษาเสริม +${netherDoomBonus})` : ''}${loomAllies ? ` · ลูกสมุน ${loomAllies} ตัวเสริม ${loomAllies * 3}` : ''}${eternityAllies ? ` · สภาแห่งกาล ${eternityAllies} ตัวเสริม ${eternityAllies * 10}` : ''}` };
}
