import { makeShield, shieldLayers } from './shields.js';
import { WORDS, START_WORDS, ELEMENTS, ATTACK_FORMS, SECOND_TIER_ELEMENTS } from './words.js';
import { RIFT_ENEMIES, RIFT_TOWER, SPACED_FLOORS } from './upper-tower.js';
import { MIDDLE_BATTLES, MIDDLE_ENEMIES } from './middle-tower.js';
import {
  ENDGAME_ENEMIES,
  ENDGAME_RELICS,
  ENDGAME_SHOP_ITEMS,
  ENDGAME_SPACED_FLOORS,
  buildEndgameTowerRooms,
} from './endgame-tower.js';

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
    cost: 14,
    oneTime: false,
    vaultOnly: true,
    badge: 'ตีบวกฟรี 1 ครั้ง · โอกาสสำเร็จ +15%',
    description: 'เก็บไว้ในคลังไอเทม ใช้ตีบวกการ์ดคำที่แท่นตีบวกได้ฟรี พร้อมเพิ่มโอกาสสำเร็จ 15 จุดเปอร์เซ็นต์',
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

export function getCardUpgradeCost(currentLevel = 0) {
  return CARD_UPGRADE_COSTS[currentLevel] ?? 999;
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

export function getCardUpgradeSuccessRate(currentLevel = 0, useStone = false, bonus = SMITHING_STONE_BONUS_RATE) {
  const base = CARD_UPGRADE_SUCCESS_RATES[currentLevel] ?? 20;
  return Math.min(100, base + (useStone ? bonus : 0));
}

export function getCardSecondaryTier(level = 0, unlockedFlag = false) {
  if (level >= 10) return 3;
  if (level >= 9) return 2;
  if (level >= CARD_SECONDARY_UNLOCK_LEVEL || unlockedFlag) return 1;
  return 0;
}

export function getCardSecondaryEffect(wordId, level = CARD_SECONDARY_UNLOCK_LEVEL) {
  const tier = level >= 10 ? 3 : level >= 9 ? 2 : 1;
  const bonusAmount = tier === 3 ? 4 : tier === 2 ? 3 : 2;
  const extraPierce = tier === 3 ? 1 : 0;
  const tierTag = tier === 3 ? 'ขั้นสูงสุด (+10)' : tier === 2 ? 'ขั้น 2 (+9)' : 'ขั้น 1 (+7)';

  if (ATTACK_FORMS.includes(wordId)) {
    return {
      id: 'minor_shield',
      tier,
      tierTag,
      unlockLevel: CARD_SECONDARY_UNLOCK_LEVEL,
      badge: `🛡 เกราะเสริม +${bonusAmount}${extraPierce ? ` · เจาะ +${extraPierce}` : ''}`,
      label: `เกราะสะท้อนเวท +${bonusAmount}${extraPierce ? ` & เจาะเกราะ +${extraPierce}` : ''}`,
      description: `ปลดล็อกเมื่อตีบวกถึง +7 (+9/+10 แรงขึ้น): เมื่อร่ายคาถาโจมตีที่มีคำนี้ จะได้เกราะป้องกันชั่วคราว +${bonusAmount} หน่วยทันที${extraPierce ? ` และเจาะเกราะ +${extraPierce}` : ''}`,
      shieldBonus: bonusAmount,
      healBonus: 0,
      pierceBonus: extraPierce,
    };
  }
  if (ELEMENTS.includes(wordId)) {
    return {
      id: 'aegis_ward',
      tier,
      tierTag,
      unlockLevel: CARD_SECONDARY_UNLOCK_LEVEL,
      badge: `🛡 เกราะธาตุ +${bonusAmount}${extraPierce ? ` · เจาะ +${extraPierce}` : ''}`,
      label: `เกราะธาตุคุ้มกาย +${bonusAmount}${extraPierce ? ` & เจาะเกราะ +${extraPierce}` : ''}`,
      description: `ปลดล็อกเมื่อตีบวกถึง +7 (+9/+10 แรงขึ้น): เมื่อร่ายคาถาที่มีธาตุนี้ จะได้เกราะป้องกันชั่วคราว +${bonusAmount} หน่วยทันที${extraPierce ? ` และเจาะเกราะ +${extraPierce}` : ''}`,
      shieldBonus: bonusAmount,
      healBonus: 0,
      pierceBonus: extraPierce,
    };
  }
  if (['shield', 'heal', 'self'].includes(wordId)) {
    return {
      id: 'vital_surge',
      tier,
      tierTag,
      unlockLevel: CARD_SECONDARY_UNLOCK_LEVEL,
      badge: `✚ ฟื้นเลือด +${bonusAmount}`,
      label: `ละอองฟื้นฟู +${bonusAmount} HP`,
      description: `ปลดล็อกเมื่อตีบวกถึง +7 (+9/+10 แรงขึ้น): เมื่อร่ายคาถาที่มีคำนี้ จะฟื้นฟูพลังชีวิต +${bonusAmount} HP ให้ผู้เล่นเพิ่มทันที`,
      shieldBonus: tier === 3 ? 2 : 0,
      healBonus: bonusAmount,
      pierceBonus: 0,
    };
  }
  return {
    id: 'arcane_guard',
    tier,
    tierTag,
    unlockLevel: CARD_SECONDARY_UNLOCK_LEVEL,
    badge: `🛡 เกราะ +${bonusAmount} · เจาะ +${1 + extraPierce}`,
    label: `เกราะรูนเสริม +${bonusAmount} & เจาะเกราะ +${1 + extraPierce}`,
    description: `ปลดล็อกเมื่อตีบวกถึง +7 (+9/+10 แรงขึ้น): เมื่อร่ายคาถาที่มีคำนี้ จะได้เกราะป้องกันชั่วคราว +${bonusAmount} หน่วย และเจาะเกราะศัตรูเพิ่ม +${1 + extraPierce}`,
    shieldBonus: bonusAmount,
    healBonus: 0,
    pierceBonus: 1 + extraPierce,
  };
}

export function describeCardUpgradeEffect(wordId, level = 0) {
  const nextLv = Math.max(1, level);
  if (wordId === 'veil') return `ความจุม่าน +${nextLv * 2}`;
  if (wordId === 'blackhole' || wordId === 'meteor') return `แรงกระทบ +${nextLv}`;
  if (wordId === 'death') return `คืนมานา ${nextLv} เมื่อร่ายสำเร็จ`;
  if (ELEMENTS.includes(wordId)) {
    return `ดาเมจพื้นฐานธาตุ +${nextLv}`;
  }
  if (ATTACK_FORMS.includes(wordId)) {
    return `โบนัสดาเมจรูปทรง +${nextLv}`;
  }
  if (wordId === 'shield') {
    return `ความจุโล่ +${nextLv * 2} ต่อชั้น`;
  }
  if (wordId === 'heal') {
    return `ฟื้นฟูพลังชีวิต +${nextLv * 2} HP`;
  }
  if (wordId === 'pierce') {
    return `เจาะเกราะเพิ่ม +${nextLv}`;
  }
  if (wordId === 'burn') {
    return `เผาไหม้แรงขึ้น +${nextLv}`;
  }
  if (wordId === 'blast' || wordId === 'devastation') {
    return `แรงระเบิดกระจาย +${nextLv}`;
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
  return level < EARLY_LEVEL_CAP ? 25 : 55;
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

export function openHand(state) {
  const deck = state.player.words.filter(id => id !== 'death' || !state.deathSpent);
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

export function drawCards(state) {
  const { hand, words } = state.player;
  const deck = state.deathSpent ? words.filter(id => id !== 'death') : words;
  const draw = { rng: state.handRng };
  for (let i = 0; i < TURN_DRAW; i++) hand.push(pick(draw, deck));
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

export function createEnemy(kind, index = 0) {
  const base = ENEMIES[kind];
  return { id: `enemy-${index}`, kind, slot: index, hp: base.hp, maxHp: base.hp, armor: base.armor, ward: base.ward, affinity: base.affinity ?? null, chill: 0, freeze: 0, burn: 0, burnTurn: 0 };
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
    if (enemy.kind === 'volcano_colossus' || enemy.kind === 'thunder_drake_emperor') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 || phase === 3) ? 1 : 0;
      enemy.armor = phase === 1 ? 4 : phase === 2 ? 6 : phase === 3 ? 3 : 1;
    }
    if (enemy.kind === 'ancient_chitin_behemoth') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 || phase === 3) ? 1 : 0;
      enemy.armor = phase === 1 ? 5 : phase === 2 ? 7 : phase === 3 ? 4 : 2;
    }
    if (enemy.kind === 'nether_dread_lord') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 || phase === 3) ? 2 : 0;
      enemy.armor = phase === 1 ? 4 : phase === 2 ? 6 : phase === 3 ? 3 : 1;
    }
    if (enemy.kind === 'eternity_overlord') {
      const phase = state.turn % 4;
      enemy.ward = enemy.hp > 0 && (phase === 1 || phase === 3) ? 2 : 0;
      enemy.armor = phase === 1 ? 6 : phase === 2 ? 8 : phase === 3 ? 5 : 2;
    }
    if (enemy.magmaArmorUntil >= state.turn) enemy.armor = Math.max(0, enemy.armor - 2);
    if (enemy.permanentArmorShred) enemy.armor = Math.max(0, enemy.armor - enemy.permanentArmorShred);
    else if (enemy.earthArmorUntil >= state.turn) enemy.armor = Math.max(0, enemy.armor - (enemy.earthArmorShred ?? 1));
    if (enemy.wardGrant) {
      if (enemy.hp > 0) enemy.ward = Math.min(3, enemy.ward + enemy.wardGrant);
      delete enemy.wardGrant;
    }
  }
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
  state.enemies = state.rooms[state.room].map(createEnemy);
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
      words: [...START_WORDS], shield: null,
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
  state.rewards = [];
  state.enemies = (state.rooms?.[state.room] ?? []).map((kind, index) => {
    const enemy = createEnemy(kind, index);
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
  state.turn = 1;
  state.player.hp = Math.max(10, Math.ceil(state.player.maxHp * 0.5));
  state.player.mana = getMaxMana(state.player);
  state.player.shield = null;
  state.rewards = [];
  state.pendingBlessings = [];
  state.pendingTargetRoom = null;
  state.enemies = (state.rooms?.[state.room] ?? []).map((kind, index) => {
    const enemy = createEnemy(kind, index);
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
  const goldCost = getCardUpgradeCost(currentLevel);
  const material = getCardUpgradeMaterial(p);
  const usedStone = Boolean(material);
  if (material) {
    p[material.source].splice(material.index, 1);
  } else {
    if (p.gold < goldCost) {
      throw new Error(`ทองไม่พอสำหรับการตีบวก · ต้องใช้ ${goldCost} ทอง (มีอยู่ ${p.gold} ทอง)`);
    }
    p.gold -= goldCost;
  }

  const chancePercent = getCardUpgradeSuccessRate(currentLevel, usedStone, material?.bonus);
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
    cost: usedStone ? 0 : goldCost,
    goldCost: usedStone ? 0 : goldCost,
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
  state.room = Math.min((state.rooms?.length ?? TOTAL_TOWER_ROOMS) - 1, Math.max(0, targetRoom));
  state.sanctuaryUnlocked = true;
  state.sanctuaryFloor = targetFloor;
  state.sanctuaryRested = false;
  state.phase = 'sanctuary';
  state.turn = 1;
  state.player.shield = null;
  state.rewards = [];
  state.pendingBlessings = [];
  state.pendingTargetRoom = null;
  state.enemies = (state.rooms?.[state.room] ?? []).map((kind, index) => {
    const enemy = createEnemy(kind, index);
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
      const dmg = Math.min(enemy.hp, afterArmor);
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
    if (state.enemies.every(e => e.hp <= 0)) {
      if (state.rift) {
        resolveRiftBattleVictory(state, summary, events);
        return totalDmg;
      }
      delete state.magmaPuddles;
      delete state.blackhole;
      delete state.deathSpent;
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
      const deck = state.deathSpent ? p.words.filter(id => id !== 'death') : p.words;
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
    const total = state.enemies.reduce((sum, enemy) => sum + (enemy.hp > 0 ? enemy.ward : 0), 0);
    if (!total) throw new Error('ศัตรูไม่มีม่านให้สลาย');
    for (const enemy of state.enemies) if (enemy.hp > 0) enemy.ward = 0;
    effectText = `โปรยผงสลายม่าน · สลายม่านรวม ${total} ชั้น`;
  } else if (itemId === 'silence_scroll') {
    const targets = state.enemies.filter(enemy => enemy.hp > 0 && !enemy.sealed);
    if (!targets.length) throw new Error('ศัตรูทุกตัวถูกผนึกอยู่แล้ว');
    for (const enemy of targets) enemy.sealed = true;
    effectText = `เปิดม้วนผนึกอาคม · ผนึกศัตรู ${targets.length} ตัว`;
  } else if (itemId === 'draw_pages') {
    const amount = Math.min(2, Math.max(0, handLimit - p.hand.length));
    if (!amount) throw new Error('มือเต็มแล้ว ต้องมีที่ว่างก่อนจั่ว');
    const deck = state.deathSpent ? p.words.filter(id => id !== 'death') : p.words;
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
    let clearedCount = 0;
    for (const enemy of state.enemies) {
      if (enemy.hp > 0 && enemy.ward > 0) {
        clearedCount += enemy.ward;
        enemy.ward = 0;
      }
    }
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
      target.ward = 0;
      const dmg = Math.min(target.hp, 24);
      target.hp -= dmg;
      effectText = `ฟาดสายล่อฟ้าทองคำ · ล้างม่านและทำ 24 ดาเมจใส่ ${ENEMIES[target.kind]?.name ?? target.kind}!`;
      if (state.enemies.every(e => e.hp <= 0)) dealAoeConsumable(0, 'lightning', '');
    }
  } else if (itemId === 'sea_serpent_fang') {
    const target = state.enemies.find(e => e.hp > 0);
    if (target) {
      const dmg = Math.min(target.hp, 18);
      target.hp -= dmg;
      effectText = `ซัดเขี้ยวอสรพิษสมุทร · ทำ 18 ดาเมจเจาะเกราะใส่ ${ENEMIES[target.kind]?.name ?? target.kind}!`;
      if (state.enemies.every(e => e.hp <= 0)) dealAoeConsumable(0, 'water', '');
    }
  } else if (itemId === 'chain_lightning_orb') {
    const targets = state.enemies.filter(e => e.hp > 0).slice(0, 2);
    for (const t of targets) {
      const dmg = Math.min(t.hp, 18);
      t.hp -= dmg;
    }
    effectText = 'ปลดปล่อยลูกแก้วอสุนีบาตลูกโซ่ · สายฟ้าชิ่งทำดาเมจ 18 หน่วย!';
    if (state.enemies.every(e => e.hp <= 0)) dealAoeConsumable(0, 'lightning', '');
  } else if (itemId === 'pyro_core_extract') {
    const target = state.enemies.find(e => e.hp > 0);
    if (target) {
      const dmg = Math.min(target.hp, 15);
      target.hp -= dmg;
      target.burn += 5;
      effectText = `สาดสารสกัดแก่นเพลิงใส่ ${ENEMIES[target.kind]?.name ?? target.kind} · 15 ดาเมจและเผาไหม้ 5!`;
      if (state.enemies.every(e => e.hp <= 0)) dealAoeConsumable(0, 'fire', '');
    }
  }

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
    const next = Math.max(0, 12 + enemyClimaxBonus(turn + 1, room) - enemy.chill - (enemy.obscured ? 4 : 0));
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
  const isMajorClimaxRelease = ['ember_overlord', 'tempest_archon', 'volcano_colossus', 'thunder_drake_emperor', 'ancient_chitin_behemoth', 'nether_dread_lord', 'eternity_overlord'].includes(enemy.kind) && turn % 4 === 0;
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
    const next = Math.max(0, base + enemyClimaxBonus(turn + 1, room) - enemy.chill);
    return { type: 'charge', amount: 0, shortLabel: `ชาร์จ ${next}`, label: `เตรียมโจมตีหนัก ${next} เทิร์นถัดไป` };
  }
  if (boss && cycle === 0) return { type: 'recover', amount: 0, label: 'เปิดช่อง · เกราะ 0 และพักโจมตี' };
  if (enemy.kind === 'ember_imp' && cycle === 2) {
    const next = Math.max(0, 9 + enemyClimaxBonus(turn + 1, room) - enemy.chill - (enemy.obscured ? 4 : 0));
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
    return { type: 'charge', amount: 0, label: 'ชาร์จแมกม่ากลืนพิภพ · เทิร์นหน้าทุบ 24!' };
  }
  if (enemy.kind === 'thunder_drake_emperor' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'สะสมกระแสไฟฟ้าดารากระหน่ำ · เทิร์นหน้าฟาด 26!' };
  }
  if (enemy.kind === 'ancient_chitin_behemoth' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'สะเทือนธรณีปฐมกาล · เทิร์นหน้ากระแทก 28!' };
  }
  if (enemy.kind === 'nether_dread_lord' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'รวบรวมลมดับดวงวิญญาณ · เทิร์นหน้าเฉือน 30!' };
  }
  if (enemy.kind === 'eternity_overlord' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'รวบรวมพลังงานกาลอวกาศนิรันดร์ · เทิร์นหน้าปลดปล่อยคลื่นทำลาย 36!' };
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
    if (turn % 4 === 0) base = 24;
    else if (turn % 4 === 2) base = 16;
  }
  else if (enemy.kind === 'thunder_drake_emperor') {
    if (turn % 4 === 0) base = 26;
    else if (turn % 4 === 2) base = 17;
  }
  else if (enemy.kind === 'ancient_chitin_behemoth') {
    if (turn % 4 === 0) base = 28;
    else if (turn % 4 === 2) base = 18;
  }
  else if (enemy.kind === 'nether_dread_lord') {
    if (turn % 4 === 0) base = 30;
    else if (turn % 4 === 2) base = 20;
  }
  else if (enemy.kind === 'eternity_overlord') {
    if (turn % 4 === 0) base = 36;
    else if (turn % 4 === 2) base = 24;
  }
  const loomAllies = enemy.kind === 'loom_sovereign' && room === FLOOR50_BOSS_ROOM && cycle === 2
    ? enemies.filter(other => other.hp > 0 && other.id !== enemy.id).length : 0;
  const eternityAllies = enemy.kind === 'eternity_overlord' && room === FLOOR100_BOSS_ROOM && cycle === 2
    ? enemies.filter(other => other.hp > 0 && other.id !== enemy.id).length : 0;
  base += loomAllies * 3 + eternityAllies * 4;
  const amount = Math.max(0, base + enemyClimaxBonus(turn, room) - enemy.chill - (enemy.obscured ? 4 : 0));
  return { type: 'attack', amount, label: `โจมตี ${amount}${loomAllies ? ` · ลูกสมุน ${loomAllies} ตัวเสริม ${loomAllies * 3}` : ''}${eternityAllies ? ` · ลูกสมุนมิติ ${eternityAllies} ตัวเสริม ${eternityAllies * 4}` : ''}` };
}
