import { WORDS, START_WORDS, ELEMENTS, ATTACK_FORMS, ASCENDED_ELEMENTS, SECOND_TIER_ELEMENTS, FUSED_ELEMENTS } from './words.js';
import { RIFT_ENEMIES, RIFT_TOWER, SPACED_FLOORS } from './upper-tower.js';
import { MIDDLE_BATTLES, MIDDLE_ENEMIES } from './middle-tower.js';

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
  ember_imp: { name: 'อิมพ์เพลิง', hp: 22, armor: 0, ward: 0, attack: 5, color: '#e29d83', exp: 18, gold: 15, isBoss: false },
  iron_warden: { name: 'ผู้พิทักษ์ม่านเหล็ก', hp: 24, armor: 2, ward: 1, attack: 4, color: '#907ba6', exp: 22, gold: 18, isBoss: false },
  rune_golem: { name: 'โกเลมรูน', hp: 30, armor: 2, ward: 0, attack: 9, color: '#e4b659', exp: 26, gold: 21, isBoss: false },
  mirror_mage: { name: 'จอมเวทกระจกเงา', hp: 58, armor: 1, ward: 1, attack: 6, color: '#bca5d2', exp: 68, gold: 58, isBoss: true },
  frost_lich: { name: 'ลิชเหมันต์', hp: 64, armor: 2, ward: 1, attack: 5, color: '#8bb7a0', exp: 78, gold: 66, isBoss: true },
  storm_titan: { name: 'ไททันอัสนี', hp: 76, armor: 3, ward: 0, attack: 11, color: '#f5db87', exp: 92, gold: 78, isBoss: true },
  arch_codex: { name: 'อาร์คโคเด็กซ์ต้องห้าม', hp: 92, armor: 2, ward: 1, attack: 6, color: '#f5db87', exp: 115, gold: 95, isBoss: true },
  ember_overlord: { name: 'จ้าวอัคคีบรรพกาล', hp: 135, armor: 3, ward: 1, attack: 8, color: '#ffad42', exp: 180, gold: 150, isBoss: true },
  void_imp: { name: 'อิมพ์สุญญากาศ', hp: 34, armor: 1, ward: 0, attack: 7, color: '#bca5d2', exp: 32, gold: 26, isBoss: false },
  aether_warden: { name: 'ผู้คุมม่านอาคม', hp: 38, armor: 2, ward: 1, attack: 6, color: '#907ba6', exp: 36, gold: 30, isBoss: false },
  obsidian_golem: { name: 'โกเลมศิลานิล', hp: 46, armor: 3, ward: 0, attack: 12, color: '#718063', exp: 42, gold: 35, isBoss: false },
  chrono_sage: { name: 'นักปราชญ์กาลเวลา', hp: 30, armor: 1, ward: 1, attack: 6, color: '#83b5ad', exp: 38, gold: 32, isBoss: false },
  prism_watcher: { name: 'ผู้เฝ้าปริซึมชั้นสูง', hp: 105, armor: 2, ward: 1, attack: 8, color: '#b6a0cf', exp: 125, gold: 105, isBoss: true },
  astral_sentinel: { name: 'ผู้พิทักษ์หอดารา', hp: 118, armor: 4, ward: 0, attack: 14, color: '#e4b659', exp: 140, gold: 115, isBoss: true },
  elder_grimoire: { name: 'คัมภีร์ปฐมกาลต้องห้าม', hp: 132, armor: 2, ward: 1, attack: 8, color: '#dab87a', exp: 165, gold: 135, isBoss: true },
  eclipse_mage: { name: 'จอมเวทจันทรคราส', hp: 148, armor: 2, ward: 1, attack: 9, color: '#bca5d2', exp: 185, gold: 150, isBoss: true },
  glacial_sovereign: { name: 'ราชันเหมันตนิรันดร์', hp: 162, armor: 3, ward: 1, attack: 9, color: '#8bb7a0', exp: 205, gold: 165, isBoss: true },
  thunder_colossus: { name: 'ยักษ์อัสนีบรรพกาล', hp: 178, armor: 4, ward: 0, attack: 16, color: '#f5db87', exp: 225, gold: 185, isBoss: true },
  nexus_codex: { name: 'เน็กซัสโคเด็กซ์ต้องห้าม', hp: 196, armor: 3, ward: 1, attack: 10, color: '#f5db87', exp: 250, gold: 210, isBoss: true },
  tempest_archon: { name: 'จ้าวพายุอสุนีบาต', hp: 255, armor: 4, ward: 1, attack: 11, color: '#ffe53b', exp: 360, gold: 300, isBoss: true },
  ward_scribe: { name: 'อาลักษณ์ทอม่าน', hp: 32, armor: 1, ward: 0, attack: 5, color: '#bc8ae8', exp: 44, gold: 37, sprite: 'chrono_sage' },
  ward_keeper: { name: 'ผู้พิทักษ์ตราคุ้มกัน', hp: 42, armor: 2, ward: 0, attack: 7, color: '#d0a8ff', exp: 55, gold: 43, sprite: 'aether_warden' },
  rune_ram: { name: 'โกเลมระฆังรูน', hp: 52, armor: 2, ward: 0, attack: 6, color: '#ffc58c', exp: 64, gold: 50, sprite: 'rune_golem' },
  seal_curator: { name: 'ผู้เฝ้าตราประสาน', hp: 175, armor: 2, ward: 2, attack: 11, color: '#d0a8ff', exp: 200, gold: 165, isBoss: true, sprite: 'eclipse_mage' },
  crown_archivist: { name: 'เจ้าแห่งหอจารึก', hp: 235, armor: 3, ward: 2, attack: 13, color: '#ffd18e', exp: 260, gold: 215, isBoss: true, sprite: 'nexus_codex' },
  ...RIFT_ENEMIES,
  ...MIDDLE_ENEMIES,
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
    badge: '+4 MP ทันที',
    description: 'ดื่มในเทิร์นต่อสู้เพื่อฟื้นฟู +4 มานาทันทีโดยไม่เสียเทิร์น',
  },
  healing_draught: {
    id: 'healing_draught',
    name: 'น้ำยาสมานแผล',
    icon: '❤️',
    cost: 16,
    oneTime: false,
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
  return Object.values(SHOP_ITEMS).filter(item => !(item.oneTime && purchased.includes(item.id)));
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

export function getCardUpgradeSuccessRate(currentLevel = 0, useStone = false) {
  const base = CARD_UPGRADE_SUCCESS_RATES[currentLevel] ?? 20;
  return Math.min(100, base + (useStone ? SMITHING_STONE_BONUS_RATE : 0));
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
    summary: 'ช่องประกอบคาถาคำที่ 4 ไม่คิดค่ามานาเพิ่ม และศัตรูคลั่งช้าลง 1 เทิร์น',
    status: 'ดราฟรอเปิดใช้งาน (ดรอปจากบอสชั้น 30)',
  },
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
  return { hpGain: middleLevel ? 8 : 4, mpGain: level % 5 === 0 ? (middleLevel ? 4 : 2) : 0 };
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
      player.mana = Math.min(player.maxMana, player.mana + mpGain);
    }
    levelUps.push({ level: player.level, hpGain, mpGain });
  }
  return levelUps;
}

export const FLOOR4_BOUNDARY_ROOM = 8;
export const FLOOR5_START_ROOM = 9;
export const FLOOR8_BOSS_ROOM = 20;
export const FLOOR10_BOSS_ROOM = 21;
export const FLOOR11_START_ROOM = 22;
export const FLOOR13_BOSS_ROOM = 30;
export const FLOOR15_START_ROOM = 31;
export const FLOOR18_BOSS_ROOM = 42;
export const FLOOR20_BOSS_ROOM = 43;
export const FLOOR21_START_ROOM = FLOOR20_BOSS_ROOM + 1;
export const FLOOR25_BOSS_ROOM = FLOOR21_START_ROOM + 4;
export const FLOOR30_BOSS_ROOM = FLOOR21_START_ROOM + 9;
export const FLOOR31_START_ROOM = FLOOR30_BOSS_ROOM + 1;
export const FLOOR50_BOSS_ROOM = FLOOR30_BOSS_ROOM + RIFT_TOWER.length;
export const UPPER_RESTS = Object.freeze(Object.fromEntries(
  [20, 25, 30, 35, 40, 45].map(floor => [`post${floor}`, FLOOR20_BOSS_ROOM + floor - 20]),
));
const PULL_REWARD_ROOM = FLOOR31_START_ROOM + 1;
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
const UPPER_CARD_ROOMS = [FLOOR21_START_ROOM + 1, FLOOR21_START_ROOM + 3, FLOOR25_BOSS_ROOM, FLOOR30_BOSS_ROOM];
export const isUpperCacheRoom = room => room === PULL_REWARD_ROOM || room === FLOOR21_START_ROOM + 1 || room === FLOOR21_START_ROOM + 3;

export function unlockUpperTower(state) {
  if (state.rooms.length !== FLOOR21_START_ROOM) return;
  const draw = { rng: seedNumber(`${state.seed}:upper-tower`) };
  state.rooms.push(...UPPER_TOWER.map(variants => [...pick(draw, variants)]));
  state.highestRoom = Math.max(state.highestRoom ?? 0, FLOOR21_START_ROOM);
  if (state.phase === 'won' && state.room === FLOOR20_BOSS_ROOM) {
    state.phase = 'sanctuary';
    state.sanctuaryFloor = 'post20';
  }
}

export function upperCacheAvailable(state) {
  return UPPER_CARD_ROOMS.includes(state.room) && !state.rewardedBossRooms?.includes(state.room)
    && UPPER_REWARD_WORDS.some(id => !state.learned.includes(id) && getCardUpgradeLevel(state, id) < MAX_CARD_UPGRADE);
}

export function hasCardReward(state) {
  if (state.rewardedBossRooms?.includes(state.room) || isRoomRevisit(state)) return false;
  if (state.room === FLOOR30_BOSS_ROOM) return floor30Rewards(state).length > 0 || getRewardPool(state).length > 0;
  if (state.room === PULL_REWARD_ROOM && getCardUpgradeLevel(state, 'pull') < MAX_CARD_UPGRADE) return true;
  if (upperCacheAvailable(state)) return true;
  return (state.room >= FLOOR21_START_ROOM || isBossRoom(state))
    && state.room !== FLOOR10_BOSS_ROOM && state.room !== FLOOR20_BOSS_ROOM && getRewardPool(state).length > 0;
}

export function cardRewardReplacesBounty(state) {
  const { floor } = getFloorInfo(state.room, state.rooms.length);
  // Floors 17 and 18 already awarded EXP on a standard climb before duplicate drafts.
  return floor !== 17 && floor !== 18;
}

export function completeUpperFloor(state) {
  if (state.room === FLOOR30_BOSS_ROOM) {
    if (floor30Rewards(state).length) {
      makeRewards(state);
      return true;
    }
    if (state.rooms.length === FLOOR31_START_ROOM) {
      const draw = { rng: seedNumber(`${state.seed}:rift-tower`) };
      state.rooms.push(...RIFT_TOWER.map(variants => [...pick(draw, variants)]));
    }
  }
  if (state.room === FLOOR50_BOSS_ROOM) {
    state.phase = 'won';
    return true;
  }
  const checkpoint = Object.entries(UPPER_RESTS).find(([key, room]) => key !== 'post20' && room === state.room);
  if (!checkpoint) return false;
  state.phase = 'sanctuary';
  state.sanctuaryFloor = checkpoint[0];
  state.sanctuaryRested = false;
  state.highestRoom = Math.max(state.highestRoom ?? 0, state.room + 1);
  return true;
}
export const TOWER_COMBAT_FLOORS = Object.freeze([1, 2, 3, 5, 6, 7, 8, 11, 12, 13, 15, 16, 17, 18]);

export function getFloorStartRoom(floorNum) {
  if (floorNum >= 21 && floorNum <= 50) return FLOOR21_START_ROOM + floorNum - 21;
  if (floorNum === 10) return FLOOR10_BOSS_ROOM;
  if (floorNum === 20) return FLOOR20_BOSS_ROOM;
  if (floorNum <= 3) return (floorNum - 1) * 3;
  if (floorNum >= 5 && floorNum <= 8) return (floorNum - 5) * 3 + FLOOR5_START_ROOM;
  if (floorNum >= 11 && floorNum <= 13) return (floorNum - 11) * 3 + FLOOR11_START_ROOM;
  if (floorNum >= 15 && floorNum <= 18) return (floorNum - 15) * 3 + FLOOR15_START_ROOM;
  return 0;
}

export function getFloorInfo(roomIndex = 0, totalRooms = 44) {
  if (roomIndex >= FLOOR21_START_ROOM) {
    const floor = 21 + roomIndex - FLOOR21_START_ROOM;
    const isBoss = floor % 5 === 0;
    const code = isBoss ? `${floor}★` : String(floor);
    const roomRole = isBoss ? `ห้องบอสประจำชั้น ${floor}` : 'ห้องต่อสู้';
    return { floor, sub: 1, subRoomCount: 0, perFloor: 1, code, displayName: isBoss ? `บอสชั้น ${floor}` : `ชั้น ${floor}`, roomRole, isBoss, title: `ชั้นที่ ${floor} · ${roomRole}` };
  }
  if (totalRooms >= 22 && roomIndex === FLOOR10_BOSS_ROOM) {
    return {
      floor: 10,
      sub: 1,
      subRoomCount: 0,
      perFloor: 1,
      code: '10★',
      displayName: 'บอสชั้น 10',
      roomRole: 'ห้องบอสพิเศษประจำชั้น 10',
      isBoss: true,
      title: 'ชั้นที่ 10 · ห้องบอสพิเศษประจำชั้น 10 (10★)',
    };
  }
  if (totalRooms >= 44 && roomIndex === FLOOR20_BOSS_ROOM) {
    return {
      floor: 20,
      sub: 1,
      subRoomCount: 0,
      perFloor: 1,
      code: '20★',
      displayName: 'บอสชั้น 20',
      roomRole: 'ห้องบอสพิเศษประจำชั้น 20',
      isBoss: true,
      title: 'ชั้นที่ 20 · ห้องบอสพิเศษประจำชั้น 20 (20★)',
    };
  }
  const perFloor = totalRooms === 6 ? 2 : 3;
  const subRoomCount = Math.max(1, perFloor - 1);
  let floor;
  let sub;
  if (totalRooms === 6 || roomIndex < FLOOR5_START_ROOM) {
    floor = Math.floor(roomIndex / perFloor) + 1;
    sub = (roomIndex % perFloor) + 1;
  } else if (roomIndex <= FLOOR8_BOSS_ROOM) {
    const rel = roomIndex - FLOOR5_START_ROOM;
    floor = Math.floor(rel / perFloor) + 5;
    sub = (rel % perFloor) + 1;
  } else if (roomIndex < FLOOR15_START_ROOM) {
    const rel = roomIndex - FLOOR11_START_ROOM;
    floor = Math.floor(rel / perFloor) + 11;
    sub = (rel % perFloor) + 1;
  } else {
    const rel = roomIndex - FLOOR15_START_ROOM;
    floor = Math.floor(rel / perFloor) + 15;
    sub = (rel % perFloor) + 1;
  }
  const isBoss = sub === perFloor;
  const code = `${floor}-${sub}`;
  const displayName = isBoss ? `บอสชั้น ${floor}` : `ห้องย่อย ${code}`;
  const roomRole = isBoss ? `ห้องบอสประจำชั้น ${floor}` : `ห้องย่อยที่ ${sub}/${subRoomCount}`;
  return {
    floor,
    sub,
    subRoomCount,
    perFloor,
    code,
    displayName,
    roomRole,
    isBoss,
    title: isBoss
      ? `ชั้นที่ ${floor} · ห้องบอสประจำชั้น ${floor} (${code})`
      : `ชั้นที่ ${floor} · ห้องย่อยที่ ${sub}/${subRoomCount} (${code})`,
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
  const remaining = deck.filter(id => !hand.includes(id));
  while (hand.length < 5 && remaining.length) {
    const id = pick(draw, remaining);
    hand.push(id);
    remaining.splice(remaining.indexOf(id), 1);
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
  const excess = hand.length - HAND_LIMIT;
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
  return { id: `enemy-${index}`, kind, slot: index, hp: base.hp, maxHp: base.hp, armor: base.armor, ward: base.ward, chill: 0, freeze: 0, burn: 0, burnTurn: 0 };
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
    if (enemy.magmaArmorUntil >= state.turn) enemy.armor = Math.max(0, enemy.armor - 2);
    if (enemy.earthArmorUntil >= state.turn) enemy.armor = Math.max(0, enemy.armor - (enemy.earthArmorShred ?? 1));
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
  state.player.mana = state.player.maxMana;
  if (MIDDLE_BATTLES[state.room] && !isRoomRevisit(state)) state.rooms[state.room] = middleBattle(state.seed, state.room);
  const blessings = state.player.blessings ?? [];
  if (blessings.includes('blessing_aegis')) {
    state.player.shield = { layers: [6], expires: 2, effect: null, triggered: false };
  } else if (blessings.includes('blessing_frost')) {
    state.player.shield = { layers: [4], expires: 2, effect: 'ice', triggered: false };
  } else {
    state.player.shield = null;
  }
  state.enemies = state.rooms[state.room].map(createEnemy);
  if (SPACED_FLOORS.has(getFloorInfo(state.room, state.rooms.length).floor)) {
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
  for (let room = state.room + 1; room < Math.min(state.rooms.length, FLOOR20_BOSS_ROOM); room++) {
    if (MIDDLE_BATTLES[room] && !isRoomRevisit(state, room)) state.rooms[room] = middleBattle(state.seed, room);
  }
}

export function createRun(seed = String(Date.now()), tutorial = false, collection = []) {
  const state = {
    version: 2, rulesVersion: 3, seed: String(seed), rng: seedNumber(seed), tutorial,
    room: 0, highestRoom: 0, clearedRooms: [], rewardedBossRooms: [],
    sanctuaryRested: false, sanctuaryFloor: 4,
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
  function initialMiddleBattle(room) {
    // Keep existing reward and forge rolls for the same seed.
    if (MIDDLE_BATTLES[room].length > 1) random(state);
    return middleBattle(state.seed, room);
  }
  state.rooms = [
    ['striker'],
    ['swarm'],
    ['elite'],
    tutorial ? ['swarm', 'swarm', 'swarm'] : pick(state, [['swarm', 'swarm', 'swarm'], ['charger', 'swarm']]),
    ['charger'],
    ['sentinel'],
    pick(state, [['support', 'armored', 'swarm'], ['warden', 'charger']]),
    ['armored', 'swarm'],
    ['boss'],
    ['ember_imp', 'swarm'],
    pick(state, [['iron_warden', 'ember_imp'], ['warden', 'charger']]),
    ['mirror_mage'],
    ['iron_warden', 'ember_imp'],
    pick(state, [['rune_golem', 'swarm'], ['support', 'iron_warden']]),
    ['frost_lich'],
    ['rune_golem', 'ember_imp'],
    pick(state, [['iron_warden', 'rune_golem'], ['armored', 'support', 'ember_imp']]),
    ['storm_titan'],
    ['rune_golem', 'iron_warden'],
    pick(state, [['rune_golem', 'ember_imp', 'support'], ['iron_warden', 'rune_golem', 'swarm']]),
    ['arch_codex'],
    ['ember_overlord'],
    initialMiddleBattle(22),
    initialMiddleBattle(23),
    ['prism_watcher'],
    initialMiddleBattle(25),
    initialMiddleBattle(26),
    ['astral_sentinel'],
    initialMiddleBattle(28),
    initialMiddleBattle(29),
    ['elder_grimoire'],
    initialMiddleBattle(31),
    initialMiddleBattle(32),
    ['eclipse_mage'],
    initialMiddleBattle(34),
    initialMiddleBattle(35),
    ['glacial_sovereign'],
    initialMiddleBattle(37),
    initialMiddleBattle(38),
    ['thunder_colossus'],
    initialMiddleBattle(40),
    initialMiddleBattle(41),
    ['nexus_codex'],
    ['tempest_archon'],
  ];
  return enterRoom(state);
}

export function ownsRewardWord(state, id) {
  return START_WORDS.includes(id) || state.collection.includes(id);
}

export function getRewardPool(state) {
  return Object.keys(WORDS).filter(id => {
    if (getCardUpgradeLevel(state, id) >= MAX_CARD_UPGRADE) return false;
    if (id === 'self' && !ownsRewardWord(state, 'heal')) return false;
    if (id === 'pull') return state.room >= PULL_REWARD_ROOM;
    if (UPPER_REWARD_WORDS.includes(id)) return state.room >= FLOOR25_BOSS_ROOM;
    if (Object.hasOwn(SECOND_TIER_ELEMENTS, id)) return state.room >= FLOOR30_BOSS_ROOM;
    return state.room >= getFloorStartRoom(3) || !START_WORDS.includes(id);
  });
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

function drawReward(state, pool) {
  const { floor } = getFloorInfo(state.room, state.rooms.length);
  const { epic, legendary } = rewardRarityRates(floor);
  const roll = random(state) * 100;
  const regular = pool.filter(id => !['epic', 'legendary'].includes(WORDS[id].rarity));
  const rarity = roll < legendary ? 'legendary' : roll < legendary + epic ? 'epic' : null;
  const high = rarity ? pool.filter(id => WORDS[id].rarity === rarity) : [];
  return pick(state, high.length ? high : regular.length ? regular : pool);
}

export function makeRewards(state) {
  const bossCards = state.room === FLOOR30_BOSS_ROOM ? floor30Rewards(state)
    : state.room === PULL_REWARD_ROOM && getCardUpgradeLevel(state, 'pull') < MAX_CARD_UPGRADE ? ['pull'] : [];
  if (bossCards.length) {
    state.rewards = bossCards;
    state.phase = 'reward';
    return;
  }
  const pool = getRewardPool(state);
  state.rewards = [];
  if (upperCacheAvailable(state)) {
    state.rewards.push(...UPPER_REWARD_WORDS.filter(id => !state.learned.includes(id) && getCardUpgradeLevel(state, id) < MAX_CARD_UPGRADE));
  } else if (state.room === roomsPerFloor(state) - 1 && pool.includes('beam')) state.rewards.push('beam');
  for (const id of state.rewards) {
    const index = pool.indexOf(id);
    if (index !== -1) pool.splice(index, 1);
  }
  while (state.rewards.length < 3 && pool.length) {
    const word = drawReward(state, pool);
    state.rewards.push(word);
    pool.splice(pool.indexOf(word), 1);
  }
  state.phase = 'reward';
}

function ascendedRewards(state) {
  return Object.keys(ASCENDED_ELEMENTS).filter(id => !state.collection.includes(id));
}

function fusedRewards(state) {
  const cards = Object.keys(FUSED_ELEMENTS).filter(id => !state.collection.includes(id));
  if (cards.length <= 3) return cards;
  return cards.filter((_, index) => index !== seedNumber(state.seed) % cards.length);
}

const FLOOR30_FIXED_REWARDS = ['storm', 'devastation', 'vayu'];

function floor30Rewards(state) {
  const hasFused = state.learned.some(id => Object.hasOwn(FUSED_ELEMENTS, id));
  if (!hasFused && !state.learned.some(id => Object.hasOwn(ASCENDED_ELEMENTS, id))) {
    const ascended = ascendedRewards(state);
    if (ascended.length) return ascended;
  }
  if (!hasFused) {
    const fused = fusedRewards(state);
    if (fused.length) return fused;
  }
  const nextCard = FLOOR30_FIXED_REWARDS.find(id => !state.collection.includes(id));
  return nextCard ? [nextCard] : [];
}

export function offerMissedElementReward(state) {
  if (state.room !== FLOOR30_BOSS_ROOM || state.phase !== 'won') return;
  completeUpperFloor(state);
}

export function completeBossVictoryTransition(state) {
  state.clearedRooms ??= [];
  if (!state.clearedRooms.includes(state.room)) state.clearedRooms.push(state.room);
  const totalRooms = state.rooms?.length ?? 44;
  if (completeUpperFloor(state)) return state;
  if (state.room === FLOOR4_BOUNDARY_ROOM) {
    state.sanctuaryUnlocked = true;
    state.sanctuaryFloor = 4;
    state.highestRoom = Math.max(state.highestRoom ?? 0, Math.min(totalRooms - 1, FLOOR5_START_ROOM));
    state.phase = 'won';
    return state;
  }
  if (totalRooms >= 44 && state.room === FLOOR20_BOSS_ROOM) {
    state.sanctuaryUnlocked = true;
    state.sanctuary9Unlocked = true;
    state.sanctuaryPost10Unlocked = true;
    state.sanctuary14Unlocked = true;
    state.sanctuary19Unlocked = true;
    state.sanctuaryPost20Unlocked = true;
    state.sanctuaryFloor = 'post20';
    state.sanctuaryRested = false;
    state.highestRoom = Math.max(state.highestRoom ?? 0, FLOOR20_BOSS_ROOM);
    state.phase = 'sanctuary';
    unlockUpperTower(state);
    return state;
  }
  if (totalRooms >= 44 && state.room === FLOOR18_BOSS_ROOM) {
    state.sanctuaryUnlocked = true;
    state.sanctuary9Unlocked = true;
    state.sanctuaryPost10Unlocked = true;
    state.sanctuary14Unlocked = true;
    state.sanctuary19Unlocked = true;
    state.sanctuaryFloor = 19;
    state.sanctuaryRested = false;
    state.highestRoom = Math.max(state.highestRoom ?? 0, FLOOR20_BOSS_ROOM);
    state.phase = 'sanctuary';
    return state;
  }
  if (totalRooms >= 44 && state.room === FLOOR13_BOSS_ROOM) {
    state.sanctuaryUnlocked = true;
    state.sanctuary9Unlocked = true;
    state.sanctuaryPost10Unlocked = true;
    state.sanctuary14Unlocked = true;
    state.sanctuaryFloor = 14;
    state.sanctuaryRested = false;
    state.highestRoom = Math.max(state.highestRoom ?? 0, FLOOR15_START_ROOM);
    state.phase = 'sanctuary';
    return state;
  }
  if (totalRooms >= 22 && state.room === FLOOR10_BOSS_ROOM) {
    state.sanctuaryUnlocked = true;
    state.sanctuary9Unlocked = true;
    state.sanctuaryPost10Unlocked = true;
    state.sanctuaryFloor = 'post10';
    state.sanctuaryRested = false;
    state.highestRoom = Math.max(state.highestRoom ?? 0, Math.min(totalRooms - 1, totalRooms >= 44 ? FLOOR11_START_ROOM : FLOOR10_BOSS_ROOM));
    state.phase = 'sanctuary';
    return state;
  }
  if (state.room === FLOOR8_BOSS_ROOM || (totalRooms < 22 && state.room === totalRooms - 1)) {
    state.sanctuaryUnlocked = true;
    state.sanctuary9Unlocked = true;
    state.sanctuaryFloor = 9;
    state.sanctuaryRested = false;
    state.highestRoom = Math.max(state.highestRoom ?? 0, Math.min(totalRooms - 1, FLOOR10_BOSS_ROOM));
    state.phase = 'sanctuary';
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
  const cap = Math.min(7, START_WORDS.length + state.learned.length);
  if (state.player.words.length < cap && !state.player.words.includes(id)) {
    state.player.words.push(id);
  }
  for (const candidate of [...START_WORDS, ...state.collection]) {
    if (state.player.words.length >= cap) break;
    if (!state.player.words.includes(candidate)) state.player.words.push(candidate);
  }
  if (state.room >= FLOOR21_START_ROOM && !isBossRoom(state) && !isUpperCacheRoom(state.room)) {
    state.room++;
    return enterRoom(state);
  }
  completeBossVictoryTransition(state);
  offerMissedElementReward(state);
  return state;
}

export function isSanctuaryUnlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const totalRooms = state.rooms?.length ?? 44;
  const boundaryBossRoom = totalRooms <= 9 ? totalRooms - 1 : FLOOR4_BOUNDARY_ROOM;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    state.sanctuaryUnlocked ||
    state.phase === 'won' ||
    state.phase === 'sanctuary' ||
    cleared.includes(boundaryBossRoom) ||
    cleared.includes(FLOOR8_BOSS_ROOM) ||
    cleared.includes(totalRooms - 1),
  );
}

export function isSanctuary9Unlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const totalRooms = state.rooms?.length ?? 44;
  if (totalRooms < 21) return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    state.sanctuary9Unlocked ||
    state.sanctuaryPost10Unlocked ||
    state.sanctuary14Unlocked ||
    state.sanctuary19Unlocked ||
    state.sanctuaryPost20Unlocked ||
    (state.phase === 'sanctuary' && [9, 'post10', 14, 19, 'post20'].includes(state.sanctuaryFloor)) ||
    cleared.includes(FLOOR8_BOSS_ROOM) ||
    cleared.includes(FLOOR10_BOSS_ROOM) ||
    cleared.includes(FLOOR13_BOSS_ROOM) ||
    cleared.includes(FLOOR18_BOSS_ROOM) ||
    cleared.includes(FLOOR20_BOSS_ROOM),
  );
}

export function isSanctuaryPost10Unlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const totalRooms = state.rooms?.length ?? 44;
  if (totalRooms < 22) return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    state.sanctuaryPost10Unlocked ||
    state.sanctuary14Unlocked ||
    state.sanctuary19Unlocked ||
    state.sanctuaryPost20Unlocked ||
    (state.phase === 'sanctuary' && ['post10', 14, 19, 'post20'].includes(state.sanctuaryFloor)) ||
    cleared.includes(FLOOR10_BOSS_ROOM) ||
    cleared.includes(FLOOR13_BOSS_ROOM) ||
    cleared.includes(FLOOR18_BOSS_ROOM) ||
    cleared.includes(FLOOR20_BOSS_ROOM),
  );
}

export function isSanctuary14Unlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const totalRooms = state.rooms?.length ?? 44;
  if (totalRooms < 44) return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    state.sanctuary14Unlocked ||
    state.sanctuary19Unlocked ||
    state.sanctuaryPost20Unlocked ||
    (state.phase === 'sanctuary' && [14, 19, 'post20'].includes(state.sanctuaryFloor)) ||
    cleared.includes(FLOOR13_BOSS_ROOM) ||
    cleared.includes(FLOOR18_BOSS_ROOM) ||
    cleared.includes(FLOOR20_BOSS_ROOM),
  );
}

export function isSanctuary19Unlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const totalRooms = state.rooms?.length ?? 44;
  if (totalRooms < 44) return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    state.sanctuary19Unlocked ||
    state.sanctuaryPost20Unlocked ||
    (state.phase === 'sanctuary' && [19, 'post20'].includes(state.sanctuaryFloor)) ||
    cleared.includes(FLOOR18_BOSS_ROOM) ||
    cleared.includes(FLOOR20_BOSS_ROOM),
  );
}

export function isSanctuaryPost20Unlocked(state) {
  if (!state || state.phase === 'lost') return false;
  const totalRooms = state.rooms?.length ?? 44;
  if (totalRooms < 44) return false;
  const cleared = state.clearedRooms ?? [];
  return Boolean(
    state.sanctuaryPost20Unlocked ||
    (state.phase === 'sanctuary' && state.sanctuaryFloor === 'post20') ||
    cleared.includes(FLOOR20_BOSS_ROOM),
  );
}

function resetPlayerForSanctuaryFallback(state) {
  delete state.magmaPuddles;
  delete state.blackhole;
  delete state.deathSpent;
  state.turn = 1;
  state.player.hp = Math.max(10, Math.ceil(state.player.maxHp * 0.5));
  state.player.mana = state.player.maxMana;
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

export function fallBackToFloor4Sanctuary(state) {
  state.phase = 'sanctuary';
  state.sanctuaryUnlocked = true;
  state.sanctuary9Unlocked = false;
  state.sanctuaryPost10Unlocked = false;
  state.sanctuary14Unlocked = false;
  state.sanctuary19Unlocked = false;
  state.sanctuaryPost20Unlocked = false;
  state.sanctuaryFloor = 4;
  state.sanctuaryRested = false;
  state.clearedRooms = (state.clearedRooms ?? []).filter(r => r < FLOOR5_START_ROOM);
  state.highestRoom = Math.min((state.rooms?.length ?? 44) - 1, FLOOR5_START_ROOM);
  state.room = state.highestRoom;
  resetPlayerForSanctuaryFallback(state);
  return state;
}

export function fallBackToFloor9Sanctuary(state) {
  state.phase = 'sanctuary';
  state.sanctuaryUnlocked = true;
  state.sanctuary9Unlocked = true;
  state.sanctuaryFloor = 9;
  state.sanctuaryRested = false;
  state.highestRoom = Math.max(state.highestRoom ?? 0, Math.min((state.rooms?.length ?? 44) - 1, FLOOR10_BOSS_ROOM));
  state.room = Math.min((state.rooms?.length ?? 44) - 1, FLOOR10_BOSS_ROOM);
  resetPlayerForSanctuaryFallback(state);
  return state;
}

export function fallBackToPost10Sanctuary(state) {
  state.phase = 'sanctuary';
  state.sanctuaryUnlocked = true;
  state.sanctuary9Unlocked = true;
  state.sanctuaryPost10Unlocked = true;
  state.sanctuary14Unlocked = false;
  state.sanctuary19Unlocked = false;
  state.sanctuaryPost20Unlocked = false;
  state.sanctuaryFloor = 'post10';
  state.sanctuaryRested = false;
  state.clearedRooms = (state.clearedRooms ?? []).filter(r => r < FLOOR11_START_ROOM);
  state.highestRoom = Math.min((state.rooms?.length ?? 44) - 1, FLOOR11_START_ROOM);
  state.room = state.highestRoom;
  resetPlayerForSanctuaryFallback(state);
  return state;
}

export function fallBackToFloor14Sanctuary(state) {
  state.phase = 'sanctuary';
  state.sanctuaryUnlocked = true;
  state.sanctuary9Unlocked = true;
  state.sanctuaryPost10Unlocked = true;
  state.sanctuary14Unlocked = true;
  state.sanctuary19Unlocked = false;
  state.sanctuaryPost20Unlocked = false;
  state.sanctuaryFloor = 14;
  state.sanctuaryRested = false;
  state.clearedRooms = (state.clearedRooms ?? []).filter(r => r < FLOOR15_START_ROOM);
  state.highestRoom = Math.min((state.rooms?.length ?? 44) - 1, FLOOR15_START_ROOM);
  state.room = state.highestRoom;
  resetPlayerForSanctuaryFallback(state);
  return state;
}

export function fallBackToFloor19Sanctuary(state) {
  state.phase = 'sanctuary';
  state.sanctuaryUnlocked = true;
  state.sanctuary9Unlocked = true;
  state.sanctuaryPost10Unlocked = true;
  state.sanctuary14Unlocked = true;
  state.sanctuary19Unlocked = true;
  state.sanctuaryFloor = 19;
  state.sanctuaryRested = false;
  state.highestRoom = Math.max(state.highestRoom ?? 0, Math.min((state.rooms?.length ?? 44) - 1, FLOOR20_BOSS_ROOM));
  state.room = Math.min((state.rooms?.length ?? 44) - 1, FLOOR20_BOSS_ROOM);
  resetPlayerForSanctuaryFallback(state);
  return state;
}

export function fallBackToUpperSanctuary(state) {
  const revisit = isRoomRevisit(state);
  const [rest, checkpoint] = Object.entries(UPPER_RESTS).findLast(([, room]) => room < state.room && state.clearedRooms.includes(room))
    ?? ['post20', FLOOR20_BOSS_ROOM];
  state.phase = 'sanctuary';
  state.sanctuaryFloor = rest;
  state.sanctuaryRested = false;
  if (!revisit) {
    state.clearedRooms = state.clearedRooms.filter(room => room <= checkpoint);
    state.highestRoom = checkpoint + 1;
  }
  state.room = checkpoint;
  resetPlayerForSanctuaryFallback(state);
  return state;
}

export function validateDeckWords(original, words) {
  const available = [...START_WORDS, ...original.collection];
  const cap = Math.min(7, START_WORDS.length + original.learned.length);
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

export function enterSanctuary(original, options = {}) {
  if (!original || original.phase === 'lost') throw new Error('ไม่สามารถเข้าชั้นพักได้ในขณะนี้');
  const rawOpt = options.floor;
  const nearestUpper = Object.entries(UPPER_RESTS).findLast(([key, room]) =>
    key !== 'post20' && room <= original.room && original.clearedRooms?.includes(room));
  const requestedFloor = [...Object.keys(UPPER_RESTS), 'post10', 19, 14, 9, 4].includes(rawOpt)
    ? rawOpt
    : (nearestUpper
      ? nearestUpper[0]
      : isSanctuaryPost20Unlocked(original) && original.room >= FLOOR20_BOSS_ROOM
      ? 'post20'
      : isSanctuary19Unlocked(original) && original.room >= FLOOR18_BOSS_ROOM
        ? 19
        : isSanctuary14Unlocked(original) && original.room >= FLOOR13_BOSS_ROOM
          ? 14
          : isSanctuaryPost10Unlocked(original) && original.room >= FLOOR10_BOSS_ROOM
            ? 'post10'
            : isSanctuary9Unlocked(original) && original.room >= FLOOR8_BOSS_ROOM
              ? 9
              : 4);
  if (!options.force) {
    if (requestedFloor !== 'post20' && Object.hasOwn(UPPER_RESTS, requestedFloor)
        && !original.clearedRooms?.includes(UPPER_RESTS[requestedFloor])) {
      throw new Error(`ต้องผ่านบอสชั้น ${requestedFloor.slice(4)} เพื่อเปิดจุดพักนี้`);
    }
    if (requestedFloor === 'post20' && !isSanctuaryPost20Unlocked(original)) {
      throw new Error('ต้องปราบบอสพิเศษชั้นที่ 20 ให้สำเร็จก่อน จึงจะเข้าสู่จุดพักหลังบอสชั้น 20 ได้');
    }
    if (requestedFloor === 19 && !isSanctuary19Unlocked(original)) {
      throw new Error('ต้องผ่านด่านชั้น 15–18 (ปราบบอสชั้น 18) ให้ครบก่อน จึงจะเข้าสู่ชั้นที่ 19 (ชั้นพัก) ได้');
    }
    if (requestedFloor === 14 && !isSanctuary14Unlocked(original)) {
      throw new Error('ต้องผ่านด่านชั้น 11–13 (ปราบบอสชั้น 13) ให้ครบก่อน จึงจะเข้าสู่ชั้นที่ 14 (ชั้นพัก) ได้');
    }
    if (requestedFloor === 'post10' && !isSanctuaryPost10Unlocked(original)) {
      throw new Error('ต้องปราบบอสพิเศษชั้นที่ 10 ให้สำเร็จก่อน จึงจะเข้าสู่จุดพักหลังบอสชั้น 10 ได้');
    }
    if (requestedFloor === 9 && !isSanctuary9Unlocked(original)) {
      throw new Error('ต้องผ่านด่านชั้น 5–8 (ปราบบอสชั้น 8) ให้ครบก่อน จึงจะเข้าสู่ชั้นที่ 9 (ชั้นพัก) ได้');
    }
    if (requestedFloor === 4 && !isSanctuaryUnlocked(original)) {
      throw new Error('ต้องผ่านด่านชั้น 1–3 (ปราบบอสชั้น 3) ให้ครบก่อน จึงจะเข้าสู่ชั้นที่ 4 (ชั้นพัก) ได้');
    }
  }
  const state = structuredClone(original);
  state.sanctuaryUnlocked = true;
  if ([9, 'post10', 14, 19, 'post20'].includes(requestedFloor)) state.sanctuary9Unlocked = true;
  if (['post10', 14, 19, 'post20'].includes(requestedFloor)) state.sanctuaryPost10Unlocked = true;
  if ([14, 19, 'post20'].includes(requestedFloor)) state.sanctuary14Unlocked = true;
  if ([19, 'post20'].includes(requestedFloor)) state.sanctuary19Unlocked = true;
  if (requestedFloor === 'post20') state.sanctuaryPost20Unlocked = true;
  state.sanctuaryFloor = requestedFloor;
  state.phase = 'sanctuary';
  state.sanctuaryRested = false;
  state.rewards = [];
  delete state.magmaPuddles;
  delete state.blackhole;
  delete state.deathSpent;
  for (const enemy of state.enemies) enemy.hp = 0;
  return state;
}

export function restAtSanctuary(original) {
  if (original.phase !== 'sanctuary') throw new Error('พักฟื้นได้เฉพาะที่ชั้นพักเท่านั้น');
  if (original.sanctuaryRested) throw new Error('คุณได้พักฟื้นที่กองไฟในรอบการแวะนี้แล้ว');
  const state = structuredClone(original);
  const healAmount = Math.max(10, Math.ceil(state.player.maxHp * 0.4));
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount);
  state.player.mana = state.player.maxMana;
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
  if (itemId === 'healing_draught') {
    if (state.player.hp >= state.player.maxHp) throw new Error('พลังชีวิตเต็มอยู่แล้ว');
    const before = state.player.hp;
    targetList.splice(index, 1);
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 12);
    return { ok: true, state, item, effectText: `ดื่มน้ำยาสมานแผล · ฟื้นพลังชีวิต +${state.player.hp - before} HP (${state.player.hp}/${state.player.maxHp})` };
  }
  if (itemId === 'mana_vial') {
    if (state.player.mana >= state.player.maxMana) throw new Error('มานาเต็มอยู่แล้ว');
    const before = state.player.mana;
    targetList.splice(index, 1);
    state.player.mana = Math.min(state.player.maxMana, state.player.mana + 4);
    return { ok: true, state, item, effectText: `ดื่มขวดมานาสกัด · ฟื้นมานา +${state.player.mana - before} (${state.player.mana}/${state.player.maxMana})` };
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
  const stashStoneIdx = p.stash.indexOf('smithing_stone');
  const beltStoneIdx = p.items.indexOf('smithing_stone');
  let usedStone = false;
  if (stashStoneIdx >= 0) {
    p.stash.splice(stashStoneIdx, 1);
    usedStone = true;
  } else if (beltStoneIdx >= 0) {
    p.items.splice(beltStoneIdx, 1);
    usedStone = true;
  } else {
    if (p.gold < goldCost) {
      throw new Error(`ทองไม่พอสำหรับการตีบวก · ต้องใช้ ${goldCost} ทอง (มีอยู่ ${p.gold} ทอง)`);
    }
    p.gold -= goldCost;
  }

  const chancePercent = getCardUpgradeSuccessRate(currentLevel, usedStone);
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
  if (!canVisit || (targetRoomIndex >= FLOOR21_START_ROOM && !isSanctuaryPost20Unlocked(original))) {
    throw new Error('ต้องผ่านห้องก่อนหน้าเพื่อปลดล็อกเส้นทางนี้ก่อน');
  }
  const state = structuredClone(original);
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

  if (itemId === 'mana_vial') {
    const before = p.mana;
    p.mana = Math.min(p.maxMana, p.mana + 4);
    effectText = `ดื่มขวดมานาสกัด · ฟื้นมานา +${p.mana - before} (${p.mana}/${p.maxMana})`;
  } else if (itemId === 'healing_draught') {
    const before = p.hp;
    p.hp = Math.min(p.maxHp, p.hp + 12);
    effectText = `ดื่มน้ำยาสมานแผล · ฟื้นพลังชีวิต +${p.hp - before} HP (${p.hp}/${p.maxHp})`;
  } else if (itemId === 'aegis_shard') {
    if (p.shield && Array.isArray(p.shield.layers) && p.shield.layers.length < 2) {
      p.shield.layers.push(6);
      p.shield.expires = Math.max(p.shield.expires, state.turn + 1);
      if (p.shield.layerEffects) p.shield.layerEffects.push({ elements: ['ice'], triggered: false });
    } else {
      p.shield = { layers: [6], expires: state.turn + 1, effect: null, triggered: false };
    }
    effectText = 'บดผลึกโล่ฉุกเฉิน · กางโล่เวทป้องกัน +6 หน่วยทันที!';
  } else if (itemId === 'redraw_dust') {
    openHand(state);
    effectText = 'โปรยผงเปลี่ยนชะตา · จั่วการ์ดในมือใหม่ 5 ใบ!';
  } else if (itemId === 'ember_scroll') {
    let totalDmg = 0;
    const revisit = isRoomRevisit(state, state.room);
    const dropsCard = hasCardReward(state);
    const skipBossBounty = dropsCard && cardRewardReplacesBounty(state);
    const rate = revisit ? REVISIT_REWARD_RATE : 1;
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue;
      const dmg = Math.min(enemy.hp, 6);
      enemy.hp -= dmg;
      totalDmg += dmg;
      events.push({ type: 'damage', target: enemy.id, amount: dmg, actual: dmg, element: 'fire', killed: enemy.hp === 0 });
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
      delete state.magmaPuddles;
      delete state.blackhole;
      delete state.deathSpent;
      if (!state.clearedRooms.includes(state.room)) state.clearedRooms.push(state.room);
      state.highestRoom = Math.max(state.highestRoom ?? 0, Math.min(state.rooms.length - 1, state.room + 1));
      if (dropsCard) {
        if (!isBossRoom(state) && !isUpperCacheRoom(state.room)) summary.roomRecovery = recoverAfterRoom(state);
        makeRewards(state);
      } else if (completeUpperFloor(state)) {
        summary.roomRecovery = recoverAfterRoom(state);
      } else if (state.rooms.length >= 44 && state.room === FLOOR20_BOSS_ROOM) {
        p.relics ??= [];
        if (!p.relics.includes('storm_pendulum_20')) {
          p.relics.push('storm_pendulum_20');
          const equippedNow = getEquippedRelics(p);
          if (equippedNow.length < MAX_RELIC_SLOTS && !equippedNow.includes('storm_pendulum_20')) {
            p.equippedRelics = [...equippedNow, 'storm_pendulum_20'];
          }
          summary.relicDropped = 'storm_pendulum_20';
          events.push({ type: 'relic', relicId: 'storm_pendulum_20' });
        }
        state.sanctuaryUnlocked = true;
        state.sanctuary9Unlocked = true;
        state.sanctuaryPost10Unlocked = true;
        state.sanctuary14Unlocked = true;
        state.sanctuary19Unlocked = true;
        state.sanctuaryPost20Unlocked = true;
        state.sanctuaryFloor = 'post20';
        state.sanctuaryRested = false;
        state.phase = 'sanctuary';
        unlockUpperTower(state);
      } else if (state.rooms.length >= 44 && state.room === FLOOR18_BOSS_ROOM) {
        state.sanctuaryUnlocked = true;
        state.sanctuary9Unlocked = true;
        state.sanctuaryPost10Unlocked = true;
        state.sanctuary14Unlocked = true;
        state.sanctuary19Unlocked = true;
        state.sanctuaryFloor = 19;
        state.sanctuaryRested = false;
        state.highestRoom = Math.max(state.highestRoom ?? 0, FLOOR20_BOSS_ROOM);
        state.phase = 'sanctuary';
      } else if (state.rooms.length >= 44 && state.room === FLOOR13_BOSS_ROOM) {
        state.sanctuaryUnlocked = true;
        state.sanctuary9Unlocked = true;
        state.sanctuaryPost10Unlocked = true;
        state.sanctuary14Unlocked = true;
        state.sanctuaryFloor = 14;
        state.sanctuaryRested = false;
        state.highestRoom = Math.max(state.highestRoom ?? 0, FLOOR15_START_ROOM);
        state.phase = 'sanctuary';
      } else if (state.rooms.length >= 22 && state.room === FLOOR10_BOSS_ROOM) {
        p.relics ??= [];
        if (!p.relics.includes('ember_core_10')) {
          p.relics.push('ember_core_10');
          const equippedNow = getEquippedRelics(p);
          if (equippedNow.length < MAX_RELIC_SLOTS && !equippedNow.includes('ember_core_10')) {
            p.equippedRelics = [...equippedNow, 'ember_core_10'];
          }
          summary.relicDropped = 'ember_core_10';
          events.push({ type: 'relic', relicId: 'ember_core_10' });
        }
        state.sanctuaryUnlocked = true;
        state.sanctuary9Unlocked = true;
        state.sanctuaryPost10Unlocked = true;
        state.sanctuaryFloor = 'post10';
        state.sanctuaryRested = false;
        state.highestRoom = Math.max(state.highestRoom ?? 0, Math.min(state.rooms.length - 1, state.rooms.length >= 44 ? FLOOR11_START_ROOM : FLOOR10_BOSS_ROOM));
        state.phase = 'sanctuary';
      } else if (state.room === FLOOR8_BOSS_ROOM || (state.rooms.length < 22 && state.room === state.rooms.length - 1)) {
        state.sanctuaryUnlocked = true;
        state.sanctuary9Unlocked = true;
        state.sanctuaryFloor = 9;
        state.sanctuaryRested = false;
        state.highestRoom = Math.max(state.highestRoom ?? 0, Math.min(state.rooms.length - 1, FLOOR10_BOSS_ROOM));
        state.phase = 'sanctuary';
      } else if (state.room === FLOOR4_BOUNDARY_ROOM && revisit) {
        state.sanctuaryUnlocked = true;
        state.sanctuaryFloor = 4;
        state.sanctuaryRested = false;
        state.phase = 'sanctuary';
      } else {
        summary.roomRecovery = recoverAfterRoom(state);
        state.room++;
        enterRoom(state);
      }
    }
    effectText = `เปิดม้วนเพลิงกวาดล้าง · เผาศัตรูทุกตัวรวม ${totalDmg} ดาเมจ!`;
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
  if (enemy.kind === 'chain_hound' && turn % 2 === 1 && enemy.slot > 0
    && !enemies.some(other => other.hp > 0 && other.slot === enemy.slot - 1)) {
    return { type: 'advance', amount: 0, slot: enemy.slot - 1, shortLabel: `เข้าช่อง ${enemy.slot}`, label: `ไล่ประชิดไปช่อง ${enemy.slot} · โจมตีแรงขึ้นเมื่ออยู่ช่อง 1` };
  }
  const healingLight = enemy.kind === 'lantern_wisp' && turn % 2 === 1;
  const wardingMoth = enemy.kind === 'scroll_moth' && cycle === 1;
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
  if (profile.swapTurn === cycle) {
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
  const bossBloodied = boss && enemy.hp <= enemy.maxHp / 2;
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
  if (['charger', 'sentinel', 'rune_golem', 'storm_titan', 'obsidian_golem', 'astral_sentinel', 'thunder_colossus'].includes(enemy.kind) && turn % 2 === 1) {
    return { type: 'charge', amount: 0, label: `เตรียมโจมตี ${ENEMIES[enemy.kind].attack}` };
  }
  if (enemy.kind === 'ember_overlord' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'ชาร์จเพลิงบรรพกาล · เทิร์นหน้าทุบ 16!' };
  }
  if (enemy.kind === 'tempest_archon' && turn % 4 === 3) {
    return { type: 'charge', amount: 0, label: 'ชาร์จมหาพายุอัสนี · เทิร์นหน้าฟาด 20!' };
  }
  if (enemy.kind === 'support' && turn % 2 === 1) return { type: 'heal', amount: 3, label: 'ฟื้น HP พวกเดียวกัน 3' };
  if (enemy.kind === 'chrono_sage' && turn % 2 === 1) return { type: 'heal', amount: 5, label: 'ฟื้น HP พวกเดียวกัน 5' };
  if (enemy.freeze > 0) return { type: 'frozen', amount: 0, label: 'แช่แข็ง · ข้ามการโจมตี' };
  let base = ENEMIES[enemy.kind].attack;
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
  const amount = Math.max(0, base + enemyClimaxBonus(turn, room) - enemy.chill - (enemy.obscured ? 4 : 0));
  return { type: 'attack', amount, label: `โจมตี ${amount}` };
}
