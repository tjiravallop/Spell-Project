export const GEAR_SLOTS = Object.freeze(['weapon', 'armor', 'accessory']);

export const GEAR_SLOT_LABELS = Object.freeze({
  weapon: 'อาวุธ',
  armor: 'ชุดคลุม',
  accessory: 'เครื่องประดับ',
});

export const GEAR_SLOT_ICONS = Object.freeze({
  weapon: '🪄',
  armor: '🧥',
  accessory: '💍',
});

export const GEAR_RARITY_LABELS = Object.freeze({
  common: 'ธรรมดา',
  rare: 'หายาก',
  special: 'พิเศษ',
  epic: 'มหากาพย์',
  legendary: 'ตำนาน',
});

export const MAX_GEAR_REFINE = 5;

export const GEAR_REFINE_SUCCESS_RATES = Object.freeze([100, 90, 75, 60, 45]);

export const GEAR_REFINE_COSTS = Object.freeze({
  common: Object.freeze([20, 35, 60, 95, 150]),
  rare: Object.freeze([45, 75, 120, 180, 280]),
  special: Object.freeze([80, 130, 200, 300, 440]),
  epic: Object.freeze([120, 190, 290, 420, 620]),
  legendary: Object.freeze([180, 280, 420, 600, 880]),
});

export const GEAR_REFINE_MATERIALS = Object.freeze([
  null,
  null,
  'smithing_stone',
  'smithing_stone',
  'smithing_crystal',
]);

const PHASE1_GEAR_LIST = [
  // ======================== WEAPONS: COMMON (6) ========================
  {
    id: 'staff_apprentice_oak',
    slot: 'weapon',
    rarity: 'common',
    name: 'ไม้เท้าไม้โอ๊กฝึกหัด',
    enName: 'Apprentice Oak Staff',
    icon: '🪵',
    unlockFloor: 5,
    price: 40,
    style: 'สมดุล',
    summary: 'คาถาโจมตีทุกใบแรงขึ้น +2 ดาเมจ',
    effects: { flatSpellDamage: 2 },
  },
  {
    id: 'wand_hound_whistle',
    slot: 'weapon',
    rarity: 'common',
    name: 'นกหวีดไม้เรียกสุนัขป่า',
    enName: 'Hound Whistle Wand',
    icon: '🦴',
    unlockFloor: 5,
    price: 50,
    style: 'อัญเชิญเริ่มต้น',
    summary: 'สิ่งอัญเชิญระดับธรรมดา HP +8 และหมัดประสาน +3',
    effects: { summonCommonHp: 8, summonCommonStrike: 3 },
  },
  {
    id: 'wand_ember_torch',
    slot: 'weapon',
    rarity: 'common',
    name: 'ไม้เท้าคบเพลิงถ่าน',
    enName: 'Ember Torch Wand',
    icon: '🔥',
    unlockFloor: 5,
    price: 50,
    style: 'เพลิงเผาผลาญ',
    summary: 'คาถาธาตุไฟ +3 ดาเมจ และเพิ่มสถานะเผาไหม้ +1',
    effects: { elementDamage: { fire: 3 }, fireBurnBonus: 1 },
  },
  {
    id: 'wand_frost_pipette',
    slot: 'weapon',
    rarity: 'common',
    name: 'คทาหลอดผลึกน้ำค้างแข็ง',
    enName: 'Frost Pipette Wand',
    icon: '❄️',
    unlockFloor: 15,
    price: 60,
    style: 'เหมันต์คุมจังหวะ',
    summary: 'คาถาธาตุน้ำแข็ง +3 ดาเมจ และหนาวสะสม +1',
    effects: { elementDamage: { ice: 3 }, iceChillBonus: 1 },
  },
  {
    id: 'wand_copper_rod',
    slot: 'weapon',
    rarity: 'common',
    name: 'แท่งทองแดงล่อสายฟ้า',
    enName: 'Copper Lightning Rod',
    icon: '⚡',
    unlockFloor: 15,
    price: 60,
    style: 'อสุนีเจาะเกราะ',
    summary: 'คาถาธาตุสายฟ้า +3 ดาเมจ และเจาะเกราะ +1',
    effects: { elementDamage: { lightning: 3 }, elementPierce: { lightning: 1 } },
  },
  {
    id: 'staff_crag_pestle',
    slot: 'weapon',
    rarity: 'common',
    name: 'ไม้ตะบองหินบด',
    enName: 'Crag Stone Pestle',
    icon: '🪨',
    unlockFloor: 25,
    price: 75,
    style: 'ปฐพีทุบเกราะ',
    summary: 'คาถาธาตุดิน +4 ดาเมจ และทุบเกราะศัตรูเพิ่ม +1',
    effects: { elementDamage: { earth: 4 }, armorShredBonus: 1 },
  },

  // ======================== WEAPONS: RARE (8) ========================
  {
    id: 'staff_pack_alpha',
    slot: 'weapon',
    rarity: 'rare',
    name: 'คทาจ่าฝูงนักล่า',
    enName: 'Pack Alpha Staff',
    icon: '🐺',
    unlockFloor: 35,
    price: 120,
    style: 'ฝูงอัญเชิญ',
    summary: 'หมา/หมาป่าหมัดประสาน +8 เจาะเกราะ +2 · อัญเชิญธรรมดาคืน +1 MP',
    effects: {
      summonCreatureBonus: {
        dog: { strike: 8, pierce: 2 },
        wolf: { strike: 8, pierce: 2 },
      },
      summonCommonManaRefund: 1,
    },
  },
  {
    id: 'wand_gemini_resonance',
    slot: 'weapon',
    rarity: 'rare',
    name: 'คทาสั่นพ้องฝาแฝด',
    enName: 'Gemini Resonance Wand',
    icon: '♊',
    unlockFloor: 35,
    price: 140,
    style: 'คอมโบคู่',
    summary: 'คาถาที่ใช้คำ “คู่” ลดมานา −1 (ขั้นต่ำ 2) และนัดที่สองแรงขึ้น +15%',
    effects: { pairCostReduction: 1, pairSecondHitPct: 15 },
  },
  {
    id: 'staff_pyro_blaster',
    slot: 'weapon',
    rarity: 'rare',
    name: 'คทาปืนใหญ่เพลิงปะทุ',
    enName: 'Pyro Blaster Staff',
    icon: '💥',
    unlockFloor: 45,
    price: 150,
    style: 'ระเบิดเพลิง',
    summary: 'ธาตุไฟ +6 · ระเบิดข้างเคียง +4 · ระเบิดเป้าติดเผาปะทุ +6 ดาเมจแท้',
    effects: { elementDamage: { fire: 6 }, blastSplashBonus: 4, blastBurnDetonate: 6 },
  },
  {
    id: 'scepter_tide_caller',
    slot: 'weapon',
    rarity: 'rare',
    name: 'คทาเรียกคลื่นวารี',
    enName: 'Tide Caller Scepter',
    icon: '🌊',
    unlockFloor: 45,
    price: 150,
    style: 'วารีฟื้นฟู',
    summary: 'ธาตุน้ำ +5 · ฮีลธาตุน้ำ +2 HP · สถานะเปียกอยู่นานขึ้น +1 เทิร์น',
    effects: { elementDamage: { water: 5 }, waterHealBonus: 2, waterWetDurationBonus: 1 },
  },
  {
    id: 'wand_tempest_gale',
    slot: 'weapon',
    rarity: 'rare',
    name: 'คทาลมกรดกระโชก',
    enName: 'Tempest Gale Wand',
    icon: '🌪️',
    unlockFloor: 55,
    price: 170,
    style: 'วายุชนกำแพง',
    summary: 'ธาตุลม +5 · ดาเมจชนกำแพง/ชนกัน +5 · ธาตุลมผลักไกลขึ้น +1 ช่อง',
    effects: { elementDamage: { wind: 5 }, windPushDamageBonus: 5, windExtraPushSteps: 1 },
  },
  {
    id: 'staff_iron_aegis',
    slot: 'weapon',
    rarity: 'rare',
    name: 'ไม้เท้าโล่เหล็กกล้า',
    enName: 'Iron Aegis Staff',
    icon: '🛡️',
    unlockFloor: 55,
    price: 170,
    style: 'ป้อมปราการ',
    summary: 'โล่ทุกใบ +4 หน่วย · เมื่อกางโล่ มอบม่าน +1 ให้สิ่งอัญเชิญที่ยืนอยู่',
    effects: { shieldBonus: 4, shieldGrantsSummonWard: 1 },
  },
  {
    id: 'axe_spell_sunderer',
    slot: 'weapon',
    rarity: 'rare',
    name: 'ขวานผ่าอาคม',
    enName: 'Spell Sunderer Axe',
    icon: '🪓',
    unlockFloor: 40,
    price: 180,
    style: 'ขวานทะลวงเกราะ',
    summary: 'คาถารูปทรง “ขวาน” แรงขึ้น +6 ดาเมจ และทุบเกราะถาวร −2',
    effects: { formDamageBonus: { axe: 6 }, axeArmorShred: 2 },
  },
  {
    id: 'wand_needle_lance',
    slot: 'weapon',
    rarity: 'rare',
    name: 'หอกเข็มเจาะมิติ',
    enName: 'Needle Lance Wand',
    icon: '🔱',
    unlockFloor: 40,
    price: 190,
    style: 'หอกแทงทะลุ',
    summary: 'คาถารูปทรง “หอก” แรงขึ้น +4 เจาะเกราะ +2 และแทงตัวหลังแรงขึ้นเป็น 75%',
    effects: { formDamageBonus: { spear: 4 }, formPierceBonus: { spear: 2 }, spearBackRatioPct: 75 },
  },

  // ======================== ARMORS: COMMON (6) ========================
  {
    id: 'robe_apprentice_linen',
    slot: 'armor',
    rarity: 'common',
    name: 'เสื้อคลุมผ้าลินินฝึกหัด',
    enName: 'Apprentice Linen Robe',
    icon: '🧥',
    unlockFloor: 5,
    price: 40,
    style: 'ป้องกันพื้นฐาน',
    summary: 'Max HP +15 · เปิดห้องรับโล่เริ่มต้น +4 หน่วย',
    effects: { maxHpBonus: 15, startShield: 4 },
  },
  {
    id: 'vest_hound_fur',
    slot: 'armor',
    rarity: 'common',
    name: 'เสื้อกั๊กขนหมาป่า',
    enName: 'Hound Fur Vest',
    icon: '🦺',
    unlockFloor: 5,
    price: 50,
    style: 'แนวหน้าอัญเชิญ',
    summary: 'Max HP +18 · สิ่งอัญเชิญทุกตัว HP +6 และสวนกลับ +2',
    effects: { maxHpBonus: 18, summonAllHp: 6, summonAllCounter: 2 },
  },
  {
    id: 'robe_pyro_insulation',
    slot: 'armor',
    rarity: 'common',
    name: 'เสื้อคลุมใยทนไฟ',
    enName: 'Pyro Insulation Robe',
    icon: '🧣',
    unlockFloor: 5,
    price: 50,
    style: 'ต้านทานเพลิง',
    summary: 'Max HP +20 · ลดดาเมจจากศัตรูธาตุไฟ −2 และรับเกราะเสริม +2 เมื่อถูกศัตรูธาตุไฟตี',
    effects: { maxHpBonus: 20, fireDamageReduction: 2, fireHitGainBlock: 2 },
  },
  {
    id: 'tunic_frost_weave',
    slot: 'armor',
    rarity: 'common',
    name: 'เสื้อเกราะทอน้ำแข็ง',
    enName: 'Frost Weave Tunic',
    icon: '🧊',
    unlockFloor: 15,
    price: 60,
    style: 'ต้านทานเหมันต์',
    summary: 'Max HP +22 · ลดดาเมจจากศัตรูธาตุน้ำแข็ง −2 และสวนหนาว +2 เมื่อถูกตี',
    effects: { maxHpBonus: 22, iceDamageReduction: 2, counterChillOnHit: 2 },
  },
  {
    id: 'cloak_grounded_wool',
    slot: 'armor',
    rarity: 'common',
    name: 'ผ้าคลุมขนแกะลงดิน',
    enName: 'Grounded Wool Cloak',
    icon: '🧶',
    unlockFloor: 15,
    price: 60,
    style: 'ต้านทานสายฟ้า',
    summary: 'Max HP +22 · ลดดาเมจจากศัตรูธาตุสายฟ้าและประจุช็อต −3',
    effects: { maxHpBonus: 22, lightningDamageReduction: 3 },
  },
  {
    id: 'cuirass_light_crag',
    slot: 'armor',
    rarity: 'common',
    name: 'เกราะอกหินเบา',
    enName: 'Light Crag Cuirass',
    icon: '🪨',
    unlockFloor: 25,
    price: 75,
    style: 'เกราะแข็งแกร่ง',
    summary: 'Max HP +30 · เกราะติดตัว +2 ลดดาเมจทุกการโจมตีเข้าผู้เล่น',
    effects: { maxHpBonus: 30, naturalArmor: 2 },
  },

  // ======================== ARMORS: RARE (8) ========================
  {
    id: 'carapace_turtle_shell',
    slot: 'armor',
    rarity: 'rare',
    name: 'เกราะกระดองเต่าศิลา',
    enName: 'Turtle Shell Carapace',
    icon: '🐢',
    unlockFloor: 35,
    price: 130,
    style: 'ป้อมเต่าศิลา',
    summary: 'Max HP +42 · โล่ทุกใบ +4 · เต่าศิลา HP +10 และมอบโล่เพิ่ม +6',
    effects: {
      maxHpBonus: 42,
      shieldBonus: 4,
      summonCreatureBonus: { turtle: { hp: 10, shieldBonus: 6 } },
    },
  },
  {
    id: 'robe_pack_howl',
    slot: 'armor',
    rarity: 'rare',
    name: 'เสื้อคลุมเสียงหอนจ่าฝูง',
    enName: 'Pack Howl Robe',
    icon: '🐺',
    unlockFloor: 35,
    price: 140,
    style: 'อัญเชิญสืบพลัง',
    summary: 'Max HP +40 · สิ่งอัญเชิญทุกตัว HP +12 · เมื่อสิ่งอัญเชิญแตก ทำดาเมจสะท้อน +8',
    effects: { maxHpBonus: 40, summonAllHp: 12, summonBreakRetaliate: 8 },
  },
  {
    id: 'cloak_slime_absorber',
    slot: 'armor',
    rarity: 'rare',
    name: 'ผ้าคลุมสไลม์ดูดซับ',
    enName: 'Slime Absorber Cloak',
    icon: '🟢',
    unlockFloor: 45,
    price: 150,
    style: 'ซับดาเมจหนัก',
    summary: 'Max HP +45 · เกราะ +2 · ลดดาเมจโจมตีหนัก (≥10) −4 · สไลม์ HP +14 หนาว +2',
    effects: {
      maxHpBonus: 45,
      naturalArmor: 2,
      heavyHitReduction: 4,
      summonCreatureBonus: { slime: { hp: 14, chillBonus: 2 } },
    },
  },
  {
    id: 'hauberk_iron_bear',
    slot: 'armor',
    rarity: 'rare',
    name: 'เกราะโซ่หมีเหล็ก',
    enName: 'Iron Bear Hauberk',
    icon: '🐻',
    unlockFloor: 45,
    price: 160,
    style: 'เกราะหนัก',
    summary: 'Max HP +55 · เกราะติดตัว +3 · หมีเกราะ HP +18 และผลักเพิ่ม +1 ช่อง',
    effects: {
      maxHpBonus: 55,
      naturalArmor: 3,
      summonCreatureBonus: { bear: { hp: 18, extraPush: 1 } },
    },
  },
  {
    id: 'robe_mist_mirage',
    slot: 'armor',
    rarity: 'rare',
    name: 'ชุดคลุมภาพลวงตาหมอก',
    enName: 'Mist Mirage Robe',
    icon: '🌫️',
    unlockFloor: 55,
    price: 170,
    style: 'หลบหลีกและม่าน',
    summary: 'Max HP +48 · ลดดาเมจฮิตแรกต่อเทิร์น −4 · อัญเชิญลม/นก/อินทรีเริ่มพร้อมม่าน +1',
    effects: { maxHpBonus: 48, firstHitReduction: 4, summonAerialStartWard: 1 },
  },
  {
    id: 'mantle_croc_scute',
    slot: 'armor',
    rarity: 'rare',
    name: 'ผ้าคลุมเกล็ดจระเข้แม่น้ำ',
    enName: 'Croc Scute Mantle',
    icon: '🐊',
    unlockFloor: 55,
    price: 175,
    style: 'เกล็ดสะเทินน้ำ',
    summary: 'Max HP +52 · เกราะติดตัว +3 · จระเข้ลดดาเมจรับ −3 และหมัดประสาน +6',
    effects: {
      maxHpBonus: 52,
      naturalArmor: 3,
      summonCreatureBonus: { croc: { damageReduction: 3, strike: 6 } },
    },
  },
  {
    id: 'robe_siphon_bat',
    slot: 'armor',
    rarity: 'rare',
    name: 'ชุดคลุมค้างคาวดูดโลหิต',
    enName: 'Siphon Bat Robe',
    icon: '🦇',
    unlockFloor: 40,
    price: 180,
    style: 'ฟื้นฟูดูดเลือด',
    summary: 'Max HP +44 · ฟื้นฟู HP ทุกชนิด +3 · ค้างคาว HP +10 และดูดเลือดเพิ่ม +4',
    effects: {
      maxHpBonus: 44,
      healBonus: 3,
      summonCreatureBonus: { bat: { hp: 10, healBonus: 4 } },
    },
  },
  {
    id: 'cuirass_bone_splinter',
    slot: 'armor',
    rarity: 'rare',
    name: 'เกราะเศษกระดูกสะท้อน',
    enName: 'Bone Splinter Cuirass',
    icon: '💀',
    unlockFloor: 40,
    price: 190,
    style: 'เกราะสะท้อน',
    summary: 'Max HP +50 · เกราะ +2 · โล่แตกสะท้อน 8 ดาเมจแท้ · โครงกระดูกระเบิดแรงขึ้น +8',
    effects: {
      maxHpBonus: 50,
      naturalArmor: 2,
      shieldBreakRetaliate: 8,
      summonCreatureBonus: { skeleton: { explodeBonus: 8 } },
    },
  },

  // ======================== ACCESSORIES: COMMON (6) ========================
  {
    id: 'ring_copper_meditation',
    slot: 'accessory',
    rarity: 'common',
    name: 'แหวนสมาธิทองแดง',
    enName: 'Copper Meditation Ring',
    icon: '💍',
    unlockFloor: 5,
    price: 40,
    style: 'ขยายมานา',
    summary: 'มานาสูงสุด +2 MP (เริ่มห้องและพักฟื้นเต็มตามเพดานใหม่)',
    effects: { maxManaBonus: 2 },
  },
  {
    id: 'bracelet_red_string',
    slot: 'accessory',
    rarity: 'common',
    name: 'กำไลด้ายแดงแห่งสายใย',
    enName: 'Red String Bracelet',
    icon: '📿',
    unlockFloor: 5,
    price: 50,
    style: 'สายใยอัญเชิญ',
    summary: 'สิ่งอัญเชิญทุกตัวได้รับเกราะ +1 และหมัดประสาน +3',
    effects: { summonAllArmor: 1, summonAllStrike: 3 },
  },
  {
    id: 'pendant_spark_amber',
    slot: 'accessory',
    rarity: 'common',
    name: 'จี้อำพันประกายไฟ',
    enName: 'Spark Amber Pendant',
    icon: '🔶',
    unlockFloor: 5,
    price: 50,
    style: 'เร่งเผาไหม้',
    summary: 'คาถาธาตุไฟ +2 ดาเมจ และสถานะเผาไหม้แรงขึ้น +2',
    effects: { elementDamage: { fire: 2 }, fireBurnBonus: 2 },
  },
  {
    id: 'ring_dewdrop_pearl',
    slot: 'accessory',
    rarity: 'common',
    name: 'แหวนไข่มุกหยาดน้ำค้าง',
    enName: 'Dewdrop Pearl Ring',
    icon: '🫧',
    unlockFloor: 15,
    price: 60,
    style: 'ฮีลล้นเป็นโล่',
    summary: 'ฟื้นฟู HP ทุกชนิด +2 และฮีลส่วนเกินแปลงเป็นเกราะเสริมสูงสุด 6 หน่วย',
    effects: { healBonus: 2, healOverflowToShield: 6 },
  },
  {
    id: 'brooch_static_quartz',
    slot: 'accessory',
    rarity: 'common',
    name: 'เข็มกลัดควอตซ์ประจุสถิต',
    enName: 'Static Quartz Brooch',
    icon: '💎',
    unlockFloor: 15,
    price: 60,
    style: 'สายฟ้าชิ่งประจุ',
    summary: 'คาถาสายฟ้าชิ่ง 5 ดาเมจใส่ศัตรูข้างเคียงเมื่อเป้าเปียกหรือในเทิร์นเลขคู่',
    effects: { staticQuartzChainDmg: 5 },
  },
  {
    id: 'bangle_carved_slate',
    slot: 'accessory',
    rarity: 'common',
    name: 'กำไลหินชนวนสลัก',
    enName: 'Carved Slate Bangle',
    icon: '🪨',
    unlockFloor: 25,
    price: 75,
    style: 'เสริมเกราะทุกเทิร์น',
    summary: 'รับเกราะเสริมต้นเทิร์น +2 และคาถาโล่ทุกใบหนาขึ้น +4 หน่วย',
    effects: { turnStartBlock: 2, shieldBonus: 4 },
  },

  // ======================== ACCESSORIES: RARE (8) ========================
  {
    id: 'bell_soul_affinity',
    slot: 'accessory',
    rarity: 'rare',
    name: 'กระดิ่งสื่อวิญญาณ',
    enName: 'Soul Affinity Bell',
    icon: '🔔',
    unlockFloor: 35,
    price: 130,
    style: 'วนรอบอัญเชิญ',
    summary: 'เมื่อสิ่งอัญเชิญแตก คืน +2 มานา และจั่วการ์ดเพิ่ม +1 ใบ',
    effects: { summonBreakMana: 2, summonBreakDraw: 1 },
  },
  {
    id: 'ring_gemini_echo',
    slot: 'accessory',
    rarity: 'rare',
    name: 'แหวนเสียงสะท้อนคู่',
    enName: 'Gemini Echo Ring',
    icon: '✨',
    unlockFloor: 35,
    price: 140,
    style: 'เร่งคอมโบคู่',
    summary: 'คาถา “คู่” นัดที่สองแรงขึ้น +25% และจั่วการ์ดเพิ่ม +1 ใบ',
    effects: { pairSecondHitPct: 25, pairDrawBonus: 1 },
  },
  {
    id: 'amulet_cheetah_stride',
    slot: 'accessory',
    rarity: 'rare',
    name: 'เครื่องรางฝีเท้าเสือชีตาห์',
    enName: 'Cheetah Stride Amulet',
    icon: '🐆',
    unlockFloor: 45,
    price: 150,
    style: 'ถือไพ่คล่องตัว',
    summary: 'ถือการ์ดบนมือได้เพิ่ม +1 ใบ · ถ้าหลังร่ายยังมีไพ่ ≥3 ใบรับเกราะเสริม +4',
    effects: { handLimitBonus: 1, highHandBlock: 4 },
  },
  {
    id: 'insignia_chain_volt',
    slot: 'accessory',
    rarity: 'rare',
    name: 'ตราอสุนีชิ่งต่อเนื่อง',
    enName: 'Chain Volt Insignia',
    icon: '🌩️',
    unlockFloor: 45,
    price: 160,
    style: 'สายฟ้าชิ่งทะลุเกราะ',
    summary: 'สายฟ้าชิ่งทะลุเกราะทั้งหมด และเมื่อชิ่งโดนศัตรูคืน +1 มานา (สูงสุด 1/เทิร์น)',
    effects: { chainLightningFullPierce: true, chainLightningManaOnHit: 1 },
  },
  {
    id: 'ring_vortex_siphon',
    slot: 'accessory',
    rarity: 'rare',
    name: 'แหวนวังวนดูดกลืน',
    enName: 'Vortex Siphon Ring',
    icon: '🌀',
    unlockFloor: 55,
    price: 170,
    style: 'ดูดเลือดเป้าเปียก',
    summary: 'คาถาธาตุน้ำ +3 ดาเมจ · โจมตีเป้าที่ติดเปียกฟื้นฟู +3 HP (1 ครั้ง/เทิร์น)',
    effects: { elementDamage: { water: 3 }, wetDamageHeal: 3 },
  },
  {
    id: 'bangle_cyclone_impact',
    slot: 'accessory',
    rarity: 'rare',
    name: 'กำไลลมหมุนปะทะ',
    enName: 'Cyclone Impact Bangle',
    icon: '💨',
    unlockFloor: 55,
    price: 175,
    style: 'ผลักทุบเกราะ',
    summary: 'ดาเมจชนกำแพง/ชนกัน +6 และเมื่อศัตรูชนกันหรือชนขอบ ทุบเกราะถาวร −1',
    effects: { windPushDamageBonus: 6, wallSlamArmorShred: 1 },
  },
  {
    id: 'talisman_armor_breaker',
    slot: 'accessory',
    rarity: 'rare',
    name: 'ยันต์ทำลายเกราะ',
    enName: 'Armor Breaker Talisman',
    icon: '🗡️',
    unlockFloor: 40,
    price: 180,
    style: 'เพชฌฆาตไร้เกราะ',
    summary: 'เจาะเกราะทุกคาถา +2 · โจมตีศัตรูที่เกราะเป็น 0 แรงขึ้น +20%',
    effects: { pierceBonus: 2, zeroArmorDamagePct: 20 },
  },
  {
    id: 'ring_twin_bullet',
    slot: 'accessory',
    rarity: 'rare',
    name: 'แหวนกระสุนแฝด',
    enName: 'Twin Bullet Ring',
    icon: '🎯',
    unlockFloor: 40,
    price: 190,
    style: 'ยิงและลำแสง',
    summary: 'คาถา “ยิง/ลำแสง” +4 ดาเมจ · ยิงทุบเกราะ −1 · ลำแสงเฉือนม่าน −1',
    effects: { formDamageBonus: { shot: 4, beam: 4 }, shotArmorShred: 1, beamStripWard: 1 },
  },
];

const PHASE2_SPECIAL_GEAR_LIST = [
  // ======================== WEAPONS: SPECIAL (10) ========================
  {
    id: 'scepter_titan_core',
    slot: 'weapon',
    rarity: 'special',
    name: 'คทาแกนศิลาไททัน',
    enName: 'Titan Core Scepter',
    icon: '🗿',
    unlockFloor: 50,
    price: 260,
    style: 'โกเลมและปฐพี',
    summary: 'โกเลมและอัญเชิญสายดิน HP +25 · เกราะ +1 · หมัดโกเลมทุบเกราะทุกตัว −2',
    effects: {
      summonCreatureBonus: { golem: { hp: 25, armor: 1 } },
      earthSummonHp: 25,
      earthSummonArmor: 1,
      golemAoeShred: 2,
    },
  },
  {
    id: 'staff_gargoyle_perch',
    slot: 'weapon',
    rarity: 'special',
    name: 'ไม้เท้ารูปสลักการ์กอยล์',
    enName: 'Gargoyle Perch Staff',
    icon: '🦇',
    unlockFloor: 50,
    price: 280,
    style: 'สกัด AoE',
    summary: 'การ์กอยล์/เบฮีมอธ HP +12 · ลดดาเมจ AoE ที่สกัด −25% · สกัดสำเร็จคืน +1 MP',
    effects: {
      summonCreatureBonus: { gargoyle: { hp: 12 }, behemoth: { hp: 12 } },
      aoeInterceptDamageReductionPct: 25,
      aoeInterceptManaGain: 1,
    },
  },
  {
    id: 'staff_akki_blaze',
    slot: 'weapon',
    rarity: 'special',
    name: 'ไม้เท้าเพลิงอัคคีพิโรธ',
    enName: 'Akki Hellfire Staff',
    icon: '🔥',
    unlockFloor: 60,
    price: 300,
    style: 'อัคคีเผาผลาญ',
    summary: 'คาถาอัคคี +8 ดาเมจ · คาถาไฟเผาเพิ่ม +2 · อัคคีตัดฮีลเป้าหมาย 100%',
    effects: {
      elementDamage: { akki: 8 },
      fireBurnBonus: 2,
      akkiFullHealCut: true,
    },
  },
  {
    id: 'scepter_heman_rime',
    slot: 'weapon',
    rarity: 'special',
    name: 'คทาผลึกเหมันต์นิรันดร์',
    enName: 'Heman Permafrost Scepter',
    icon: '❄️',
    unlockFloor: 60,
    price: 300,
    style: 'เหมันต์แช่แข็ง',
    summary: 'คาถาเหมันต์ +6 ดาเมจ · หนาวสะสม +2 และคงอยู่ถาวร · หนาว ≥8 แช่แข็งทันที',
    effects: {
      elementDamage: { heman: 6 },
      iceChillBonus: 2,
      hemanLastingFreezeThreshold: 8,
    },
  },
  {
    id: 'rod_asani_thunderclap',
    slot: 'weapon',
    rarity: 'special',
    name: 'กระบองสายฟ้าอัสนีบาต',
    enName: 'Asani Stormhammer',
    icon: '⚡',
    unlockFloor: 60,
    price: 320,
    style: 'อัสนีชิ่งเต็มแรง',
    summary: 'อัสนีชิ่งด้วยพลังเต็ม 100% · คาถาสายฟ้า/อัสนีเจาะเกราะเพิ่ม +3',
    effects: {
      asaniChainRatioPct: 100,
      elementPierce: { lightning: 3, asani: 3 },
    },
  },
  {
    id: 'staff_pathaphi_monolith',
    slot: 'weapon',
    rarity: 'special',
    name: 'ไม้เท้าปฐพีเสาศิลา',
    enName: 'Pathaphi Monolith Staff',
    icon: '⛰️',
    unlockFloor: 70,
    price: 350,
    style: 'ปฐพีปราการ',
    summary: 'ปฐพีเสริมเกราะ +4 และทุบเกราะเพิ่ม −1 · มีโล่/เกราะ ≥10 สะท้อน 6 ดาเมจแท้',
    effects: {
      pathaphiBlockBonus: 4,
      armorShredBonus: 1,
      highShieldRetaliate: 6,
    },
  },
  {
    id: 'scepter_wari_tsunami',
    slot: 'weapon',
    rarity: 'special',
    name: 'คทามหาสึนามิวารี',
    enName: 'Wari Tsunami Scepter',
    icon: '🌊',
    unlockFloor: 70,
    price: 350,
    style: 'วารีล้างม่าน',
    summary: 'คาถาวารีฟื้นเลือดเพิ่ม +4 HP · สลายม่านเป้าหมาย 1 ชั้น · เปียกนานขึ้น +1 เทิร์น',
    effects: {
      wariHealBonus: 4,
      wariStripWard: 1,
      waterWetDurationBonus: 1,
    },
  },
  {
    id: 'wand_vayu_cyclone',
    slot: 'weapon',
    rarity: 'special',
    name: 'คทาพายุไซโคลนวายุ',
    enName: 'Vayu Cyclone Wand',
    icon: '🌀',
    unlockFloor: 70,
    price: 350,
    style: 'วายุผลักกระแทก',
    summary: 'แรงผลักลม/วายุ +1 ช่อง · ดาเมจชน +4 · อัญเชิญสายลม/บินเริ่มพร้อมม่าน +1',
    effects: {
      windExtraPushSteps: 1,
      windPushDamageBonus: 4,
      summonAerialStartWard: 1,
    },
  },
  {
    id: 'wand_mana_tap_sprite',
    slot: 'weapon',
    rarity: 'special',
    name: 'ไม้กายสิทธิ์ภูตคืนเวท',
    enName: 'Sprite Mana-Siphon Wand',
    icon: '🧚',
    unlockFloor: 60,
    price: 380,
    style: 'ภูตคืนมานา',
    summary: 'ภูตพราย/ไซเรนสวนกลับคืน +2 MP และจั่ว +1 ใบ · คาถาค่าร่าย ≥6 ลด −1 MP',
    effects: {
      spriteSirenCounterMana: 2,
      spriteSirenCounterDraw: 1,
      highCostDiscount: 1,
    },
  },
  {
    id: 'blade_lion_reflection',
    slot: 'weapon',
    rarity: 'special',
    name: 'มีดกรงเล็บราชสีห์สะท้อนคม',
    enName: 'Lion Pride Cleaver',
    icon: '🦁',
    unlockFloor: 70,
    price: 400,
    style: 'หมัดประสานล่าจุดอ่อน',
    summary: 'หมัดประสานสัตว์อัญเชิญแรงขึ้น +35% ใส่เป้าติดดีบัฟ · สัตว์รับดาเมจลด −3',
    effects: {
      summonDebuffedStrikePct: 35,
      summonFlatDamageReduction: 3,
    },
  },

  // ======================== ARMORS: SPECIAL (10) ========================
  {
    id: 'stoneplate_gargoyle',
    slot: 'armor',
    rarity: 'special',
    name: 'เกราะศิลาปีกการ์กอยล์',
    enName: 'Gargoyle Winged Stoneplate',
    icon: '🦇',
    unlockFloor: 50,
    price: 280,
    style: 'สกัด AoE แกร่ง',
    summary: 'Max HP +55 · การ์กอยล์/เบฮีมอธ HP +30 เกราะ +2 · ดาเมจ AoE ที่ล้นเข้าผู้เล่นลด −50%',
    effects: {
      maxHpBonus: 55,
      summonCreatureBonus: { gargoyle: { hp: 30, armor: 2 }, behemoth: { hp: 30, armor: 2 } },
      aoeOverflowReductionPct: 50,
    },
  },
  {
    id: 'robe_titan_aegis',
    slot: 'armor',
    rarity: 'special',
    name: 'ชุดคลุมปราการมหาไททัน',
    enName: 'Titan Aegis Robe',
    icon: '🗿',
    unlockFloor: 50,
    price: 300,
    style: 'โกเลมปราการ',
    summary: 'Max HP +60 · โกเลม HP +35 เกราะ +2 ม่าน +1 · โกเลมแตกมอบโล่ผู้เล่น +20',
    effects: {
      maxHpBonus: 60,
      summonCreatureBonus: { golem: { hp: 35, armor: 2, ward: 1, breakShield: 20 } },
    },
  },
  {
    id: 'robe_lion_mane',
    slot: 'armor',
    rarity: 'special',
    name: 'เสื้อคลุมแผงคอราชสีห์ทองคำ',
    enName: 'Golden Lion Mane Robe',
    icon: '🦁',
    unlockFloor: 60,
    price: 320,
    style: 'สิงโตเกราะทอง',
    summary: 'Max HP +62 · เกราะติดตัวผู้เล่น +3 · สิงโตลดดาเมจรับเพิ่ม −2',
    effects: {
      maxHpBonus: 62,
      naturalArmor: 3,
      summonCreatureBonus: { lion: { flatReduce: 2 } },
    },
  },
  {
    id: 'robe_siren_seafoam',
    slot: 'armor',
    rarity: 'special',
    name: 'ชุดคลุมฟองคลื่นไซเรน',
    enName: 'Siren Seafoam Gown',
    icon: '🧜‍♀️',
    unlockFloor: 60,
    price: 340,
    style: 'ไซเรนสาดเปียก',
    summary: 'Max HP +58 · ไซเรนเริ่มพร้อมม่าน +1 · เมื่อผู้เล่นหรือไซเรนถูกตีสาดเปียกใส่ผู้โจมตี',
    effects: {
      maxHpBonus: 58,
      summonCreatureBonus: { siren: { ward: 1 } },
      counterWetOnHit: true,
    },
  },
  {
    id: 'robe_sprite_glamour',
    slot: 'armor',
    rarity: 'special',
    name: 'ชุดคลุมละอองภูตพราย',
    enName: 'Sprite Glamour Shroud',
    icon: '🧚',
    unlockFloor: 60,
    price: 350,
    style: 'ภูตพรายฟื้นพลัง',
    summary: 'Max HP +54 · Max MP +2 · ภูตพรายแตกฟื้น HP เพิ่ม +8 (รวม 20) และคืน +3 MP',
    effects: {
      maxHpBonus: 54,
      maxManaBonus: 2,
      summonCreatureBonus: { sprite: { breakHeal: 8, breakMana: 3 } },
    },
  },
  {
    id: 'harness_magma_forge',
    slot: 'armor',
    rarity: 'special',
    name: 'สายรัดอกเตาหลอมลาวา',
    enName: 'Magma Forge Harness',
    icon: '🌋',
    unlockFloor: 70,
    price: 360,
    style: 'แมกม่าและกันไฟ',
    summary: 'Max HP +65 · แอ่งแมกม่าปะทุ +8 ดาเมจและทุบเกราะ −1 · ลดดาเมจไฟรับ −4',
    effects: {
      maxHpBonus: 65,
      magmaPuddleBonusDmg: 8,
      magmaPuddleShred: 1,
      fireDamageReduction: 4,
    },
  },
  {
    id: 'shroud_permafrost_ice',
    slot: 'armor',
    rarity: 'special',
    name: 'ผ้าคลุมศิลาเยือกแข็ง',
    enName: 'Permafrost Shroud',
    icon: '🧊',
    unlockFloor: 70,
    price: 360,
    style: 'เยือกศิลาสะท้อนหนาว',
    summary: 'Max HP +64 · เยือกศิลาได้เกราะเสริม +4 · ศัตรูที่ตีผู้เล่นติดหนาวสะสม +4',
    effects: {
      maxHpBonus: 64,
      permafrostBlockBonus: 4,
      counterChillOnHit: 4,
    },
  },
  {
    id: 'mantle_storm_insulator',
    slot: 'armor',
    rarity: 'special',
    name: 'เสื้อคลุมฉนวนฟ้าคะนอง',
    enName: 'Storm Insulator Mantle',
    icon: '⛈️',
    unlockFloor: 70,
    price: 380,
    style: 'ฉนวนสายฟ้าสวนช็อต',
    summary: 'Max HP +62 · ลดดาเมจสายฟ้ารับ −6 · เมื่อผู้เล่นถูกโจมตีสวนสายฟ้า 8 ดาเมจใส่ตัวการ',
    effects: {
      maxHpBonus: 62,
      lightningDamageReduction: 6,
      thornsLightningDmg: 8,
    },
  },
  {
    id: 'cuirass_dust_deflector',
    slot: 'armor',
    rarity: 'special',
    name: 'เกราะอกธุลีเบี่ยงวิถี',
    enName: 'Dust Deflector Cuirass',
    icon: '🌪️',
    unlockFloor: 70,
    price: 380,
    style: 'ธุลีลมดิน',
    summary: 'Max HP +66 · ดาเมจผลักชน +4 · อัญเชิญธาตุลมและดิน HP +20',
    effects: {
      maxHpBonus: 66,
      windPushDamageBonus: 4,
      windEarthSummonHp: 20,
    },
  },
  {
    id: 'vestment_sanctuary_nun',
    slot: 'armor',
    rarity: 'special',
    name: 'ชุดนักพรตอารามศักดิ์สิทธิ์',
    enName: 'Sanctuary Vestment',
    icon: '✧',
    unlockFloor: 70,
    price: 400,
    style: 'ฮีลสร้างเกราะ',
    summary: 'Max HP +60 · ฟื้นฟู HP ทุกชนิด +4 · ทุกครั้งที่ฮีลได้รับเกราะเสริม 50% ของค่าฮีล',
    effects: {
      maxHpBonus: 60,
      healBonus: 4,
      healToBlockPct: 50,
    },
  },

  // ======================== ACCESSORIES: SPECIAL (10) ========================
  {
    id: 'pendant_titan_heart',
    slot: 'accessory',
    rarity: 'special',
    name: 'จี้ดวงใจศิลาไททัน',
    enName: 'Heart of the Colossus',
    icon: '🗿',
    unlockFloor: 50,
    price: 280,
    style: 'ส่งต่ออัญเชิญ',
    summary: 'อัญเชิญต่อช่วงเทิร์น 2+ (Relay) หมัดแรง +40% และแถมม่าน +1 ให้ตัวใหม่ · โกเลม HP +30',
    effects: {
      summonRelayBonusPct: 40,
      summonRelayWard: 1,
      summonCreatureBonus: { golem: { hp: 30 } },
    },
  },
  {
    id: 'bangle_gargoyle_wing',
    slot: 'accessory',
    rarity: 'special',
    name: 'กำไลปีกการ์กอยล์สะท้อนม่าน',
    enName: 'Gargoyle Wing Bangle',
    icon: '🦇',
    unlockFloor: 50,
    price: 300,
    style: 'สกัด AoE สะท้อนหมู่',
    summary: 'เมื่อสัตว์สกัด AoE แทนผู้เล่น สะท้อน 12 ดาเมจแท้ใส่ศัตรูทุกตัว · การ์กอยล์เกราะ +2',
    effects: {
      aoeInterceptRetaliateAll: 12,
      summonCreatureBonus: { gargoyle: { armor: 2 } },
    },
  },
  {
    id: 'insignia_lion_royalty',
    slot: 'accessory',
    rarity: 'special',
    name: 'ตราประทับราชันย์จ่าฝูงสิงโต',
    enName: 'Lion Sovereign Crest',
    icon: '🦁',
    unlockFloor: 60,
    price: 320,
    style: 'ราชันย์ฝูงอัญเชิญ',
    summary: 'สัตว์อัญเชิญทุกตัวสวนกลับและหมัดประสานแรง +25% · ออกหมัดประสานคืน +1 MP และจั่ว +1 ใบ',
    effects: {
      summonAllDmgPct: 25,
      summonStrikeMana: 1,
      summonStrikeDraw: 1,
    },
  },
  {
    id: 'pendant_siren_pearl',
    slot: 'accessory',
    rarity: 'special',
    name: 'จี้หอยมุกสมุทรไซเรน',
    enName: 'Siren Oceanic Pearl',
    icon: '🧜‍♀️',
    unlockFloor: 60,
    price: 340,
    style: 'ไซเรนสาดเปียกหมู่',
    summary: 'ไซเรนสวนกลับสาดเปียกศัตรูทุกตัว · สัตว์อัญเชิญทุกตัวโจมตีเป้าเปียกแรงขึ้น +25%',
    effects: {
      sirenCounterWetAll: true,
      summonWetBonusPct: 25,
    },
  },
  {
    id: 'ring_sprite_wellspring',
    slot: 'accessory',
    rarity: 'special',
    name: 'แหวนตาน้ำมนตราภูตพราย',
    enName: 'Sprite Wellspring Ring',
    icon: '🧚',
    unlockFloor: 60,
    price: 350,
    style: 'มานาล้นเป็นเกราะ',
    summary: 'มานาที่ฟื้นเกินเพดานแปลงเป็นเกราะ (1 MP = 4 เกราะ สูงสุด +16/เทิร์น) · ภูตพรายแตกคืน +4 MP',
    effects: {
      manaOverflowToBlock: 4,
      summonCreatureBonus: { sprite: { breakMana: 4 } },
    },
  },
  {
    id: 'seal_magma_basin',
    slot: 'accessory',
    rarity: 'special',
    name: 'ตราประทับเตาหลอมแอ่งลาวา',
    enName: 'Magma Basin Crucible Seal',
    icon: '🌋',
    unlockFloor: 70,
    price: 360,
    style: 'แอ่งแมกม่าและเกราะ',
    summary: 'แอ่งแมกม่าปะทุ +10 ดาเมจและทุบเกราะ −1 · ร่ายคาถาไฟ/ดิน/แมกม่ารับเกราะเสริม +4',
    effects: {
      magmaPuddleBonusDmg: 10,
      magmaPuddleShred: 1,
      fireEarthCastBlock: 4,
    },
  },
  {
    id: 'pendant_heman_rime',
    slot: 'accessory',
    rarity: 'special',
    name: 'จี้ผลึกละอองหนาวเหมันต์',
    enName: 'Heman Glacial Pendant',
    icon: '❄️',
    unlockFloor: 70,
    price: 360,
    style: 'เหมันต์ลดมานา',
    summary: 'เมื่อศัตรูติดแช่แข็ง กระจายหนาว +4 ใส่ตัวข้างเคียง · คาถาน้ำแข็ง/เหมันต์ลดค่าร่าย −1 MP',
    effects: {
      freezeSpreadChill: 4,
      iceCostDiscount: 1,
    },
  },
  {
    id: 'ring_asani_overcharge',
    slot: 'accessory',
    rarity: 'special',
    name: 'แหวนอัสนีบาตประจุคู่',
    enName: 'Asani Overcharge Ring',
    icon: 'ϟ',
    unlockFloor: 70,
    price: 380,
    style: 'อัสนีชิ่งสองข้าง',
    summary: 'อัสนีชิ่งใส่ศัตรูข้างเคียงทั้งซ้ายและขวา · สายฟ้าชิ่งข้ามเกราะ 100% · เจาะเกราะสายฟ้า +3',
    effects: {
      asaniChainBoth: true,
      chainLightningFullPierce: true,
      elementPierce: { lightning: 3, asani: 3 },
    },
  },
  {
    id: 'bangle_wari_deluge',
    slot: 'accessory',
    rarity: 'special',
    name: 'กำไลมหาสึนามิล้างบาง',
    enName: 'Wari Deluge Bangle',
    icon: '🌊',
    unlockFloor: 70,
    price: 380,
    style: 'วารีล้างม่านหมู่',
    summary: 'คาถาวารีสลายม่านศัตรูทุกตัวในสนาม 1 ชั้น และฟื้นเลือดผู้เล่นเพิ่ม +6 HP',
    effects: {
      wariStripAllWard: 1,
      wariHealBonus: 6,
    },
  },
  {
    id: 'seal_vayu_tempest',
    slot: 'accessory',
    rarity: 'special',
    name: 'ตราประทับพายุวายุคลั่ง',
    enName: 'Vayu Tempest Seal',
    icon: '🌪️',
    unlockFloor: 70,
    price: 400,
    style: 'วายุชนกระแทก',
    summary: 'แรงผลักลม/วายุ +1 ช่อง · ดาเมจชน +6 · อัญเชิญในเทิร์นเลขคู่เริ่มพร้อมม่าน +1 ชั้น',
    effects: {
      windExtraPushSteps: 1,
      windPushDamageBonus: 6,
      summonEvenTurnWard: 1,
    },
  },
];

const PHASE3_EPIC_GEAR_LIST = [
  // ======================== WEAPONS: EPIC (10) ========================
  {
    id: 'staff_dual_crucible',
    slot: 'weapon',
    rarity: 'epic',
    name: 'ไม้เท้าเตาหลอมสองธาตุ',
    enName: 'Dual Crucible Staff',
    icon: '⚗️',
    unlockFloor: 70,
    price: 550,
    style: 'ธาตุผสม',
    summary: 'คาถาธาตุผสมแรงขึ้น +35% และคืน +1 MP ทันทีเมื่อร่ายสำเร็จ',
    effects: {
      dualFusionDamagePct: 35,
      dualFusionManaRefund: 1,
    },
  },
  {
    id: 'scepter_behemoth_quake',
    slot: 'weapon',
    rarity: 'epic',
    name: 'คทามหาอสูรแผ่นดินไหว',
    enName: 'Behemoth Earthshaker',
    icon: '🦏',
    unlockFloor: 80,
    price: 600,
    style: 'เบฮีมอธ',
    summary: 'เบฮีมอธ HP +40 เกราะ +2 ทุบเกราะทั้งสนาม −3 · สกัด AoE สะท้อน 20 ดาเมจแท้ทั้งสนาม',
    effects: {
      summonCreatureBonus: { behemoth: { hp: 40, armor: 2 } },
      behemothAoeShred: 3,
      behemothInterceptRetaliate: 20,
    },
  },
  {
    id: 'staff_hydra_vitality',
    slot: 'weapon',
    rarity: 'epic',
    name: 'ไม้เท้าเก้าเศียรฟื้นชีพ',
    enName: 'Hydra Rebirth Staff',
    icon: '🐉',
    unlockFloor: 80,
    price: 600,
    style: 'ไฮดราฟื้นชีพ',
    summary: 'ไฮดราฟื้นฟูเพิ่ม +6 HP/เทิร์น (รวม 12) · สวนกลับเพิ่ม 2 ฮิตพร้อมพิษเจาะเกราะ 6',
    effects: {
      hydraRegenBonus: 6,
      hydraCounterExtraHits: 2,
      hydraCounterPoisonDmg: 6,
    },
  },
  {
    id: 'scepter_kraken_depths',
    slot: 'weapon',
    rarity: 'epic',
    name: 'คทาหนวดหมึกห้วงบาดาล',
    enName: 'Abyssal Kraken Rod',
    icon: '🐙',
    unlockFloor: 80,
    price: 600,
    style: 'คราเคนคุมสนาม',
    summary: 'คราเคนลดพลังโจมตีศัตรูทั้งสนาม −25% · หมัดคราเคนสลายม่านศัตรูทั้งสนามทั้งหมด',
    effects: {
      krakenEnemyDmgReductionPct: 25,
      krakenStripAllWard: true,
    },
  },
  {
    id: 'wand_plasma_singularity',
    slot: 'weapon',
    rarity: 'epic',
    name: 'คทาพลาสมาดวงดาว',
    enName: 'Plasma Star Wand',
    icon: '✦',
    unlockFloor: 80,
    price: 650,
    style: 'พลาสมาดาวฤกษ์',
    summary: 'คาถาพลาสมาแรงขึ้น +40% เจาะเกราะ +4 · สังหารด้วยพลาสมาระเบิด 20 ดาเมจแท้รอบข้าง',
    effects: {
      elementDamagePct: { plasma: 40 },
      elementPierce: { plasma: 4 },
      plasmaKillSplashDmg: 20,
    },
  },
  {
    id: 'staff_frostvolt_spire',
    slot: 'weapon',
    rarity: 'epic',
    name: 'ไม้เท้าผลึกช็อตน้ำแข็ง',
    enName: 'Frostvolt Spire',
    icon: '❆',
    unlockFloor: 80,
    price: 650,
    style: 'ผลึกช็อตเยือกแข็ง',
    summary: 'ผลึกช็อตใส่เป้าติดหนาวแรงขึ้น +50% เจาะเกราะ +3 · ชิ่งแล้วแช่แข็งข้างเคียง + หนาวเพิ่ม +3',
    effects: {
      frostvoltChilledDmgPct: 50,
      frostvoltFreezeAdjacent: true,
      elementPierce: { frostvolt: 3 },
      iceChillBonus: 3,
    },
  },
  {
    id: 'scepter_scald_boiler',
    slot: 'weapon',
    rarity: 'epic',
    name: 'คทาไอเดือดสะเทือนผิว',
    enName: 'Scald Thermal Scepter',
    icon: '♨️',
    unlockFloor: 85,
    price: 680,
    style: 'ไอเดือดหลอมเกราะ',
    summary: 'คาถาไอเดือดทุบเกราะเพิ่ม −2 ถาวร (รวม −4) และทำให้เป้าชะงักข้ามเทิร์น 1 รอบ',
    effects: {
      scaldShredBonus: 2,
      scaldStunTarget: true,
    },
  },
  {
    id: 'staff_shockstream_hydra',
    slot: 'weapon',
    rarity: 'epic',
    name: 'ไม้เท้ากระแสช็อตวารี',
    enName: 'Shockstream Torrent',
    icon: 'ϟ',
    unlockFloor: 85,
    price: 700,
    style: 'กระแสช็อตหมู่',
    summary: 'กระแสช็อตชิ่งใส่เป้าเปียกทั้งหมดเต็ม 100% พลังคาถา และคืน +1 MP ต่อเป้าเปียกที่โดน',
    effects: {
      shockstreamFullPower: true,
      shockstreamManaPerWet: 1,
    },
  },
  {
    id: 'wand_barrage_repeater',
    slot: 'weapon',
    rarity: 'epic',
    name: 'คทากระหน่ำห้าวิถี',
    enName: 'Barrage Repeater Wand',
    icon: 'Ⅴ',
    unlockFloor: 90,
    price: 720,
    style: 'กระหน่ำจักรกล',
    summary: 'ลดค่าร่ายคาถา “กระหน่ำ” ลง −20% · แต่ละนัดเร่งความแรงซ้อนทับนัดละ +10% (สูงสุด +40%)',
    effects: {
      barrageCostDiscountPct: 20,
      barrageRampPctPerHit: 10,
    },
  },
  {
    id: 'catalyst_devastation',
    slot: 'weapon',
    rarity: 'epic',
    name: 'สื่อเวทผลาญพิภพทำลายล้าง',
    enName: 'Devastation Catalyst',
    icon: '✷',
    unlockFloor: 90,
    price: 750,
    style: 'ทำลายล้างวงกว้าง',
    summary: 'ระเบิดซ้ำของ “ทำลายล้าง” ขยายรัศมีเป็น 3 ช่อง แรง 75% และทะลุม่านศัตรูทั้งหมด',
    effects: {
      devastationRadiusBonus: 1,
      devastationRatioPct: 75,
      devastationBypassWard: true,
    },
  },

  // ======================== ARMORS: EPIC (10) ========================
  {
    id: 'hide_behemoth_colossus',
    slot: 'armor',
    rarity: 'epic',
    name: 'ชุดคลุมหนังมหาเบฮีมอธ',
    enName: 'Colossal Behemoth Hide',
    icon: '🦏',
    unlockFloor: 80,
    price: 600,
    style: 'มหาแทงก์ AoE',
    summary: 'เบฮีมอธ HP +50 เกราะ +3 และดูดซับดาเมจ AoE แทนผู้เล่น 100% ไม่มีดาเมจล้น',
    effects: {
      summonCreatureBonus: { behemoth: { hp: 50, armor: 3 } },
      behemothZeroOverflow: true,
    },
  },
  {
    id: 'scales_hydra_endurance',
    slot: 'armor',
    rarity: 'epic',
    name: 'เกราะเกล็ดไฮดราเก้าชีวิต',
    enName: 'Hydra Regenerative Scales',
    icon: '🐉',
    unlockFloor: 80,
    price: 600,
    style: 'ฟื้นฟูต่อเนื่อง',
    summary: 'ไฮดราและผู้เล่นฟื้นฟู +6 HP ทุกต้นเทิร์น · เมื่อ HP ผู้เล่น ≤ 30% กางโล่ฉุกเฉิน 2 ชั้น×15 (1 ครั้ง/ศึก)',
    effects: {
      hydraRegenBonus: 6,
      turnStartHeal: 6,
      lowHpEmergencyShield: 15,
    },
  },
  {
    id: 'cloak_abyssal_ink',
    slot: 'armor',
    rarity: 'epic',
    name: 'เสื้อคลุมหมึกดำห้วงบาดาล',
    enName: 'Abyssal Inksilk Cloak',
    icon: '🐙',
    unlockFloor: 80,
    price: 600,
    style: 'ม่านหมึกลดดาเมจ',
    summary: 'คราเคน HP +40 และลดพลังโจมตีศัตรูทั้งสนาม −30% · ผู้เล่นกันดาเมจเผา/แอ่งลาวา/คำสาป 100%',
    effects: {
      summonCreatureBonus: { kraken: { hp: 40 } },
      krakenEnemyDmgReductionPct: 30,
      immuneHazardDamage: true,
    },
  },
  {
    id: 'plate_scald_steamburst',
    slot: 'armor',
    rarity: 'epic',
    name: 'เกราะแผ่นไอร้อนเดือดพล่าน',
    enName: 'Scald Steamplate',
    icon: '♨️',
    unlockFloor: 85,
    price: 650,
    style: 'ไอเดือดโต้กลับ',
    summary: 'ศัตรูที่โจมตีผู้เล่นหรือสัตว์อัญเชิญถูกพ่นไอร้อนลดเกราะ −2 ถาวร · คาถาไอเดือดคืน +2 MP',
    effects: {
      counterShredOnHit: 2,
      scaldCastManaRefund: 2,
    },
  },
  {
    id: 'cuirass_plasma_radiance',
    slot: 'armor',
    rarity: 'epic',
    name: 'เกราะอกสะท้อนความร้อนพลาสมา',
    enName: 'Plasma Radiant Cuirass',
    icon: '✦',
    unlockFloor: 85,
    price: 680,
    style: 'สะท้อนพลาสมา',
    summary: 'สะท้อน 30% ของดาเมจที่ศัตรูโจมตีผู้เล่นกลับคืน · สัตว์อัญเชิญสวนกลับแรงขึ้น +25%',
    effects: {
      reflectIncomingPct: 30,
      summonCounterDmgPct: 25,
    },
  },
  {
    id: 'robe_monsoon_tempest',
    slot: 'armor',
    rarity: 'epic',
    name: 'ชุดคลุมมรสุมปัดป้องพิโรธ',
    enName: 'Monsoon Stormwarden Robe',
    icon: '🌊',
    unlockFloor: 85,
    price: 700,
    style: 'มรสุมพิทักษ์',
    summary: 'คาถามรสุมฟื้นเพิ่ม +4 HP และผลัก 2 ช่อง · ทุก 3 เทิร์นกางโล่วายุ +14 หน่วยอัตโนมัติ',
    effects: {
      monsoonHealBonus: 4,
      monsoonExtraPushSteps: 1,
      periodicBarrierEvery3Turns: 14,
    },
  },
  {
    id: 'shroud_void_singularity',
    slot: 'armor',
    rarity: 'epic',
    name: 'ผ้าคลุมมิติสุญญากาศ',
    enName: 'Void Singularity Shroud',
    icon: '🕳️',
    unlockFloor: 90,
    price: 720,
    style: 'ซับท่าหนัก & หลุมดำ',
    summary: 'ลดดาเมจท่าหนักและท่าบอสลง −30% · คาถา “หลุมดำ” ใช้มานาลดลง −3 MP',
    effects: {
      bossHeavyReductionPct: 30,
      blackholeCostDiscount: 3,
    },
  },
  {
    id: 'tunic_barrage_overdrive',
    slot: 'armor',
    rarity: 'epic',
    name: 'เสื้อกั๊กกลไกกระหน่ำยิง',
    enName: 'Barrage Overdrive Tunic',
    icon: '⚙️',
    unlockFloor: 90,
    price: 720,
    style: 'กระหน่ำสะสมเกราะ',
    summary: 'Max HP +20 · ทุกนัดของคาถา “กระหน่ำ” ที่กระทบศัตรูมอบเกราะ +2 หน่วย (สูงสุด +10/ครั้ง)',
    effects: {
      maxHpBonus: 20,
      barrageHitBlock: 2,
    },
  },
  {
    id: 'mantle_devastation_core',
    slot: 'armor',
    rarity: 'epic',
    name: 'เสื้อคลุมแกนทำลายล้าง',
    enName: 'Devastation Core Mantle',
    icon: '💥',
    unlockFloor: 90,
    price: 750,
    style: 'กันระเบิด & เกราะทำลายล้าง',
    summary: 'กันดาเมจเผา/แอ่งลาวา/คำสาป 100% ลดดาเมจไฟ −6 · ร่าย “ทำลายล้าง” ได้โล่ +15 หน่วย',
    effects: {
      immuneHazardDamage: true,
      fireDamageReduction: 6,
      devastationCastBlock: 15,
    },
  },
  {
    id: 'robe_archmage_prismatic',
    slot: 'armor',
    rarity: 'epic',
    name: 'ชุดคลุมมหาจอมเวทปริซึม',
    enName: 'Archmage Prismatic Robe',
    icon: '🌈',
    unlockFloor: 90,
    price: 750,
    style: 'มหาจอมเวททุกธาตุ',
    summary: 'เกราะดิน +4 · ฮีลน้ำ +4 · ดาเมจไฟ/สายฟ้า/ลม +4 · Max MP +2',
    effects: {
      earthBlockBonus: 4,
      waterHealBonus: 4,
      elementDamage: { fire: 4, akki: 4, lightning: 4, asani: 4, wind: 4, vayu: 4 },
      maxManaBonus: 2,
    },
  },

  // ======================== ACCESSORIES: EPIC (10) ========================
  {
    id: 'bell_behemoth_quake',
    slot: 'accessory',
    rarity: 'epic',
    name: 'กระดิ่งมหาอสูรแผ่นดินไหว',
    enName: 'Behemoth Quake Bell',
    icon: '🦏',
    unlockFloor: 80,
    price: 600,
    style: 'เบฮีมอธทุบสนาม',
    summary: 'เมื่ออัญเชิญเบฮีมอธ ทุบเกราะศัตรูทั้งหมด −3 และทำ 15 ดาเมจแท้ทันที · หมัดเบฮีมอธ +20',
    effects: {
      behemothInvokeShred: 3,
      behemothInvokeTrueDmg: 15,
      summonCreatureBonus: { behemoth: { strike: 20 } },
    },
  },
  {
    id: 'bangle_hydra_vitality',
    slot: 'accessory',
    rarity: 'epic',
    name: 'กำไลเกล็ดไฮดราสมานแผล',
    enName: 'Hydra Vitality Bangle',
    icon: '🐉',
    unlockFloor: 80,
    price: 600,
    style: 'ไฮดรา & มหาฮีล',
    summary: 'ไฮดราฟื้นเพิ่ม +9 HP/เทิร์น และสวนกลับพิษแรงขึ้น · คาถาฮีล/เติมเลือดแรงขึ้น +50%',
    effects: {
      hydraRegenBonus: 9,
      hydraCounterExtraHits: 3,
      hydraCounterPoisonDmg: 8,
      healSpellPctBonus: 50,
    },
  },
  {
    id: 'ring_kraken_eye',
    slot: 'accessory',
    rarity: 'epic',
    name: 'แหวนเนตรหมึกดำคราเคน',
    enName: 'Eye of the Deep Kraken',
    icon: '🐙',
    unlockFloor: 80,
    price: 600,
    style: 'เนตรทะลุม่าน',
    summary: 'คราเคนสลายม่านทั้งสนามและลดดาเมจบอส −30% · สัตว์อัญเชิญทุกตัวโจมตีข้ามม่าน 100%',
    effects: {
      krakenStripAllWard: true,
      krakenBossDmgReductionPct: 30,
      summonBypassWard: true,
    },
  },
  {
    id: 'crucible_fusion_catalyst',
    slot: 'accessory',
    rarity: 'epic',
    name: 'ตราประทับเตาหลอมสองธาตุ',
    enName: 'Dual Fusion Alchemical Catalyst',
    icon: '⚗️',
    unlockFloor: 85,
    price: 650,
    style: 'เร่งเวทผสมธาตุ',
    summary: 'คาถาธาตุผสมลดค่าร่าย −2 MP (ขั้นต่ำ 5) · เอฟเฟกต์รองธาตุผสม (เผา/หนาว/ทุบเกราะ) แรงขึ้นสองเท่า',
    effects: {
      dualFusionCostDiscount: 2,
      dualFusionSecondaryBonus: true,
    },
  },
  {
    id: 'pendant_plasma_flare',
    slot: 'accessory',
    rarity: 'epic',
    name: 'จี้พลาสมาดาวฤกษ์ระเบิด',
    enName: 'Plasma Stellar Pendant',
    icon: '✦',
    unlockFloor: 85,
    price: 680,
    style: 'พลาสมาระเบิดล้น',
    summary: 'คาถาพลาสมาแรงขึ้น +50% เจาะเกราะ +6 · ดาเมจส่วนเกินจากการสังหารระเบิดใส่ศัตรูที่เหลือทั้งหมด',
    effects: {
      elementDamagePct: { plasma: 50 },
      elementPierce: { plasma: 6 },
      plasmaOverkillSplash: true,
    },
  },
  {
    id: 'ring_frostvolt_chain',
    slot: 'accessory',
    rarity: 'epic',
    name: 'แหวนผลึกช็อตเยือกแข็ง',
    enName: 'Frostvolt Superconductor Ring',
    icon: '❆',
    unlockFloor: 85,
    price: 680,
    style: 'ผลึกช็อตตัวนำยิ่งยวด',
    summary: 'ผลึกช็อตชิ่งเต็มพลัง 100% และแช่แข็งเป้าหมายข้างเคียงที่ติดหนาวทันที 1 เทิร์น',
    effects: {
      frostvoltChainFreezeChilled: true,
      frostvoltChainRatioPct: 100,
    },
  },
  {
    id: 'seal_scald_melter',
    slot: 'accessory',
    rarity: 'epic',
    name: 'ตราประทับไอเดือดหลอมเหล็ก',
    enName: 'Scald Steam Melter Seal',
    icon: '♨️',
    unlockFloor: 90,
    price: 700,
    style: 'ไอเดือดล้างเกราะ 0',
    summary: 'คาถาไอเดือดล้างเกราะเป้าหมายเหลือ 0 ถาวรและชะงัก 1 เทิร์น · คืน +2 MP เมื่อใช้ใส่เป้าที่มีเกราะ',
    effects: {
      scaldZeroArmor: true,
      scaldStunTarget: true,
      scaldArmoredManaRefund: 2,
    },
  },
  {
    id: 'bangle_shockstream_grid',
    slot: 'accessory',
    rarity: 'epic',
    name: 'กำไลกระแสช็อตสายฟ้าฟาด',
    enName: 'Shockstream Arc Grid Bangle',
    icon: 'ϟ',
    unlockFloor: 90,
    price: 720,
    style: 'ตาข่ายกระแสช็อต',
    summary: 'กระแสช็อตชิ่งเป้าเปียกแรงขึ้น +15 และผลักถอย 1 ช่อง · หากศัตรูเปียก ≥ 3 ตัว ร่ายฟรี 0 MP',
    effects: {
      shockstreamBonusDmg: 15,
      shockstreamPush: 1,
      shockstreamFreeIf3Wet: true,
    },
  },
  {
    id: 'ring_barrage_overclock',
    slot: 'accessory',
    rarity: 'epic',
    name: 'แหวนจักรกลกระหน่ำยิงโอเวอร์คล็อก',
    enName: 'Barrage Overclocked Ring',
    icon: '⚙️',
    unlockFloor: 90,
    price: 720,
    style: 'กระหน่ำจั่ว & ฮีล',
    summary: 'ร่าย “กระหน่ำ” จั่วการ์ดเพิ่ม +3 ใบ · แต่ละนัดที่ยิงโดนฟื้น +1 HP ให้ผู้ร่าย',
    effects: {
      barrageDrawCards: 3,
      barrageHitHeal: 1,
    },
  },
  {
    id: 'catalyst_devastation_rupture',
    slot: 'accessory',
    rarity: 'epic',
    name: 'ตราประทับกลียุคทำลายล้าง',
    enName: 'Devastation Rupture Seal',
    icon: '✷',
    unlockFloor: 90,
    price: 750,
    style: 'กลียุคทลายเกราะ',
    summary: 'คาถา “ทำลายล้าง” แรงขึ้น +25% · ระเบิดซ้ำทุบเกราะศัตรูทุกคนในรัศมี −3 ถาวร',
    effects: {
      devastationDamagePctBonus: 25,
      devastationArmorShred: 3,
    },
  },
];

const PHASE3_LEGENDARY_GEAR_LIST = [
  // ======================== WEAPONS: LEGENDARY (6) ========================
  {
    id: 'scepter_dragon_sovereign',
    slot: 'weapon',
    rarity: 'legendary',
    name: 'คทาราชันเพลิงมังกรโบราณ',
    enName: 'Drake Sovereign Scepter',
    icon: '🐲',
    unlockFloor: 90,
    price: 1500,
    style: 'ราชันมังกรดาเมจแท้',
    summary: 'มังกร HP +50 เกราะ +3 ม่าน +1 · สะท้อนเพลิง 100% · หมัดมังกรเป็นดาเมจแท้ทะลุเกราะและม่าน',
    effects: {
      summonCreatureBonus: { dragon: { hp: 50, armor: 3, ward: 1 } },
      dragonReflectPct: 100,
      dragonTrueStrike: true,
    },
  },
  {
    id: 'staff_phoenix_immortal',
    slot: 'weapon',
    rarity: 'legendary',
    name: 'ไม้เท้าเพลิงจุตินิรันดร์',
    enName: 'Phoenix Immortality Staff',
    icon: '🪶',
    unlockFloor: 90,
    price: 1500,
    style: 'ฟีนิกซ์จุติอมตะ',
    summary: 'ฟีนิกซ์เริ่มพร้อมม่าน +2 และชุบชีวิตผู้เล่นได้ถึง 2 ครั้ง/ศึก (เต็ม HP+MP) · ร่ายอัญเชิญฮีล +20 HP',
    effects: {
      summonCreatureBonus: { phoenix: { ward: 2 } },
      phoenixExtraPlayerRevives: 1,
      summonCastHeal: 20,
    },
  },
  {
    id: 'wand_chronos_timeweaver',
    slot: 'weapon',
    rarity: 'legendary',
    name: 'ไม้เท้าทอสถิตกาลเวลา',
    enName: 'Chronos Time-Weaver Wand',
    icon: '◷',
    unlockFloor: 100,
    price: 1800,
    style: 'หยุดเวลาสองรอบ',
    summary: 'คาถา “หยุดเวลา” ร่ายได้ 2 ครั้ง/ศึก · เทิร์นหยุดเวลาคืน +6 MP และจั่วการ์ดเต็มมือ',
    effects: {
      timestopExtraUses: 1,
      timestopBonusMana: 6,
      timestopFullHandDraw: true,
    },
  },
  {
    id: 'orb_void_blackhole',
    slot: 'weapon',
    rarity: 'legendary',
    name: 'ลูกแก้วแกนหลุมดำเอกภพ',
    enName: 'Singularity Void Orb',
    icon: '◉',
    unlockFloor: 100,
    price: 1800,
    style: 'หลุมดำเอกภพ',
    summary: 'หลุมดำดูดชน +50 (150) และยุบตัว +150 (450/225) · ดูดศัตรูแต่ละตัวคืน +1 MP',
    effects: {
      blackholeSlamBonus: 50,
      blackholePowerBonus: 150,
      blackholeManaPerPulled: 1,
    },
  },
  {
    id: 'scythe_thanatos_death',
    slot: 'weapon',
    rarity: 'legendary',
    name: 'เคียวพิพากษาดับดวงจิต',
    enName: 'Thanatos Judgement Scythe',
    icon: '†',
    unlockFloor: 100,
    price: 1800,
    style: 'เคียวคำสั่งตาย',
    summary: 'คาถา “ตาย” ใส่บอสแรงขึ้น +150 แท้ (ฐาน 250) · สังหารสำเร็จคืน 10 MP และคงการ์ดไว้ในมือ',
    effects: {
      deathBossDmgBonus: 150,
      deathKillFullManaRefund: true,
      deathKillKeepCard: true,
    },
  },
  {
    id: 'scepter_genesis_ascension',
    slot: 'weapon',
    rarity: 'legendary',
    name: 'คทาจุติมหาเทวะปฐมกาล',
    enName: 'Genesis Ascension Scepter',
    icon: '✺',
    unlockFloor: 100,
    price: 2000,
    style: 'จุติมหาเทวะ',
    summary: 'หลังร่าย “จุติ” การ์ดทุกใบเป็น +10 ถาวรจนจบศึก · พลังคาถา +25% · พลังอัญเชิญ +35%',
    effects: {
      ascensionPermanentUpgrades: true,
      flatSpellDamagePct: 25,
      summonAllDmgPct: 35,
    },
  },

  // ======================== ARMORS: LEGENDARY (6) ========================
  {
    id: 'scales_dragon_sovereign',
    slot: 'armor',
    rarity: 'legendary',
    name: 'เกราะเกล็ดราชันมังกรโบราณ',
    enName: 'Dragon Sovereign Scaleplate',
    icon: '🐲',
    unlockFloor: 90,
    price: 1600,
    style: 'เกล็ดราชันมังกร',
    summary: 'มังกร HP +60 เกราะ +4 สะท้อนดาเมจ 100% · ผู้เล่นเกราะติดตัว +3 และลดดาเมจบอส −25%',
    effects: {
      summonCreatureBonus: { dragon: { hp: 60, armor: 4 } },
      dragonReflectPct: 100,
      naturalArmor: 3,
      bossDamageReductionPct: 25,
    },
  },
  {
    id: 'shroud_phoenix_rebirth',
    slot: 'armor',
    rarity: 'legendary',
    name: 'ผ้าคลุมเพลิงวิหคจุตินิรันดร์',
    enName: 'Phoenix Rebirth Shroud',
    icon: '🪶',
    unlockFloor: 90,
    price: 1600,
    style: 'คืนชีพคู่',
    summary: 'ฟีนิกซ์เริ่มพร้อมม่าน +3 และเกิดจากไข่ได้ 2 ครั้ง · ผ้าคลุมชุบชีวิตผู้เล่นเต็ม 100% ได้ 1 ครั้ง/ศึก',
    effects: {
      summonCreatureBonus: { phoenix: { ward: 3 } },
      phoenixExtraEggRebirths: 1,
      armorSelfReviveOnce: true,
    },
  },
  {
    id: 'robe_chronos_timeless',
    slot: 'armor',
    rarity: 'legendary',
    name: 'ชุดคลุมเหนือกาลเวลาแห่งโครนอส',
    enName: 'Chronos Timeless Robe',
    icon: '⏳',
    unlockFloor: 100,
    price: 1800,
    style: 'เหนือกาลเวลา',
    summary: 'ทุกเทิร์นที่ 4 (4, 8, 12...) ข้ามรอบโจมตีศัตรูอัตโนมัติ · เทิร์นหยุดเวลาโล่ผู้เล่นไม่หมดอายุ',
    effects: {
      chronosAutoSkipEvery4Turns: true,
      timestopPreserveShield: true,
    },
  },
  {
    id: 'cuirass_void_eater',
    slot: 'armor',
    rarity: 'legendary',
    name: 'เกราะอกกลืนกินความว่างเปล่า',
    enName: 'Void Devourer Cuirass',
    icon: '🕳️',
    unlockFloor: 100,
    price: 1800,
    style: 'กลืนกินดาเมจล้น',
    summary: 'ลบล้างดาเมจล้น (Overkill) เหลือ 1 HP เมื่อถูกตีถึงตายจาก HP > 1 · แปลง 20% ดาเมจที่รับเป็น MP',
    effects: {
      voidOverkillNegate: true,
      damageToManaPct: 20,
    },
  },
  {
    id: 'mantle_nether_emperor',
    slot: 'armor',
    rarity: 'legendary',
    name: 'เสื้อคลุมจอมอสูรนรกานต์',
    enName: 'Nether Emperor Mantle',
    icon: '💀',
    unlockFloor: 100,
    price: 1800,
    style: 'สูบวิญญาณ & ล้างเกราะ',
    summary: 'หมัดและสวนกลับสัตว์อัญเชิญฮีลผู้เล่น 50% ของดาเมจ · ต้นทุกเทิร์นลดเกราะศัตรูทั้งสนาม −2',
    effects: {
      summonDmgLifestealPct: 50,
      turnStartEnemyArmorShred: 2,
    },
  },
  {
    id: 'vestment_omni_ascendant',
    slot: 'armor',
    rarity: 'legendary',
    name: 'ชุดคลุมมหาจุตินิรันดร์ปฐมกาล',
    enName: 'Genesis Ascendant Vestment',
    icon: '✺',
    unlockFloor: 100,
    price: 2000,
    style: 'เกราะมหาเทวะ',
    summary: 'เริ่มศึกได้โล่ 3 ชั้น×10 และสัตว์อัญเชิญทุกตัวเริ่มพร้อมม่าน +3 · เกราะติดตัว +4 · กันคำสาป/เผา 100%',
    effects: {
      startShieldLayers3x10: true,
      summonAllWard: 3,
      immuneHazardDamage: true,
      naturalArmor: 4,
    },
  },

  // ======================== ACCESSORIES: LEGENDARY (6) ========================
  {
    id: 'ring_dragon_eye',
    slot: 'accessory',
    rarity: 'legendary',
    name: 'แหวนเนตรราชันมังกรโบราณ',
    enName: 'Eye of the Drake Sovereign',
    icon: '🐲',
    unlockFloor: 90,
    price: 1600,
    style: 'มังกรดับเบิลดาเมจแท้',
    summary: 'มังกรออกหมัดประสานเป็นดาเมจแท้ทะลุม่านซ้ำ 2 ครั้งรวด · ฟื้นมานาเพิ่ม +2 MP ทุกเทิร์น',
    effects: {
      dragonTrueStrike: true,
      dragonDoubleStrike: true,
      turnStartManaBonus: 2,
    },
  },
  {
    id: 'pendant_phoenix_feather',
    slot: 'accessory',
    rarity: 'legendary',
    name: 'จี้ขนนกฟีนิกซ์ทองคำอมตะ',
    enName: 'Golden Phoenix Feather Amulet',
    icon: '🪶',
    unlockFloor: 90,
    price: 1600,
    style: 'เปลวเพลิงอมตะ',
    summary: 'เมื่อคืนชีพจากฟีนิกซ์/ผ้าคลุม ร่ายฟรี 0 MP นาน 2 เทิร์น · ทุกครั้งที่สัตว์โจมตีฟื้น +10 HP',
    effects: {
      phoenixReviveFreeManaTurns: 2,
      summonAttackPlayerHeal: 10,
    },
  },
  {
    id: 'hourglass_chronos_infinite',
    slot: 'accessory',
    rarity: 'legendary',
    name: 'นาฬิกาทรายหยุดกาลโครนอส',
    enName: 'Chronos Infinite Hourglass',
    icon: '⏳',
    unlockFloor: 100,
    price: 1800,
    style: 'หยุดเวลาอนันต์',
    summary: 'ร่าย “หยุดเวลา” ฟื้นมานาเต็ม + จั่วการ์ดเต็มมือ และเทิร์นถัดไปร่ายฟรี 0 MP',
    effects: {
      timestopRefillHandAndMana: true,
      timestopNextTurnFreeCast: true,
    },
  },
  {
    id: 'ring_singularity_void',
    slot: 'accessory',
    rarity: 'legendary',
    name: 'แหวนหลุมดำยุบเอกภพ',
    enName: 'Singularity Collapse Ring',
    icon: '◉',
    unlockFloor: 100,
    price: 1800,
    style: 'ยุบเอกภพ & ดูดพลังชีวิต',
    summary: 'หลุมดำยุบตัวแรงขึ้น +200 แท้ที่ศูนย์กลาง (ฐาน 500) · สังหารศัตรูด้วยหลุมดำเพิ่ม Max HP +10 ถาวร',
    effects: {
      blackholePowerBonus: 200,
      blackholeKillMaxHpGain: 10,
    },
  },
  {
    id: 'seal_thanatos_reaper',
    slot: 'accessory',
    rarity: 'legendary',
    name: 'ตราประทับเคียวมรณะยมทูต',
    enName: 'Thanatos Grim Reaper Seal',
    icon: '†',
    unlockFloor: 100,
    price: 1800,
    style: 'ปลิดชีพต่อเนื่อง',
    summary: 'คาถา “ตาย” ใส่บอสแรงขึ้น +250 แท้ (ฐาน 350) · สังหารเป้าสำเร็จร่าย “ตาย” ซ้ำได้ไม่จำกัด',
    effects: {
      deathBossDmgBonus: 250,
      deathKillKeepCard: true,
      deathKillResetSpent: true,
    },
  },
  {
    id: 'crown_omni_genesis',
    slot: 'accessory',
    rarity: 'legendary',
    name: 'มงกุฎจุติมหาเทวะสมบูรณ์แบบ',
    enName: 'Genesis Ascendant Diadem',
    icon: '✺',
    unlockFloor: 100,
    price: 2000,
    style: 'มหาเทวะอนันต์',
    summary: 'ร่าย “จุติ” แล้วคงสภาพ +10 และร่ายฟรีตลอดศึก · ขนาดมือ +3 ใบ และจั่วเต็มมือทุกเทิร์น',
    effects: {
      ascensionPermanentFreeCast: true,
      ascensionPermanentUpgrades: true,
      handLimitBonus: 3,
      drawToFullHand: true,
    },
  },
];

const ALL_GEAR_LIST = [
  ...PHASE1_GEAR_LIST,
  ...PHASE2_SPECIAL_GEAR_LIST,
  ...PHASE3_EPIC_GEAR_LIST,
  ...PHASE3_LEGENDARY_GEAR_LIST,
];

export const GEAR_CATALOG = Object.freeze(
  Object.fromEntries(ALL_GEAR_LIST.map(item => [item.id, Object.freeze(item)])),
);

export const GEAR_LIST = Object.freeze(ALL_GEAR_LIST.map(item => GEAR_CATALOG[item.id]));

export const GEAR_RIFT_DROP_RATES = Object.freeze({
  20: Object.freeze({ common: 60, rare: 40, special: 0, epic: 0, legendary: 0 }),
  30: Object.freeze({ common: 35, rare: 65, special: 0, epic: 0, legendary: 0 }),
  40: Object.freeze({ common: 15, rare: 75, special: 10, epic: 0, legendary: 0 }),
  50: Object.freeze({ common: 0, rare: 55, special: 40, epic: 5, legendary: 0 }),
  60: Object.freeze({ common: 0, rare: 30, special: 55, epic: 15, legendary: 0 }),
  70: Object.freeze({ common: 0, rare: 0, special: 45, epic: 45, legendary: 10 }),
  80: Object.freeze({ common: 0, rare: 0, special: 25, epic: 60, legendary: 15 }),
  90: Object.freeze({ common: 0, rare: 0, special: 0, epic: 70, legendary: 30 }),
  100: Object.freeze({ common: 0, rare: 0, special: 0, epic: 40, legendary: 60 }),
});

export function getAvailableGearRarities() {
  const set = new Set();
  for (const item of GEAR_LIST) set.add(item.rarity);
  return set;
}

export function getGearRiftDropRates(tier, instability = false) {
  const base = GEAR_RIFT_DROP_RATES[tier] ?? GEAR_RIFT_DROP_RATES[20];
  const rates = { ...base };
  if (instability) {
    // Shift +20% upward into higher rarity tiers and remove common/rare when higher tiers exist
    if (rates.epic > 0 || rates.legendary > 0 || tier >= 50) {
      const removed = rates.common + rates.rare;
      rates.common = 0;
      rates.rare = 0;
      const boostHigh = Math.min(20, Math.max(removed, 20));
      if (rates.legendary > 0) {
        if (rates.special > 0) {
          const shift = Math.min(boostHigh, rates.special);
          rates.special -= shift;
          rates.legendary += Math.ceil(shift / 2);
          rates.epic += Math.floor(shift / 2);
          if (removed > 0) {
            rates.legendary += Math.ceil(removed / 2);
            rates.epic += Math.floor(removed / 2);
          }
        } else {
          const shift = Math.min(20, rates.epic);
          rates.epic -= shift;
          rates.legendary += shift;
          if (removed > 0) rates.legendary += removed;
        }
      } else {
        rates.epic += boostHigh;
        rates.special = Math.max(0, 100 - rates.epic);
      }
    } else {
      const shift = Math.min(rates.common, 20);
      rates.common -= shift;
      if (tier >= 40) rates.special += shift;
      else rates.rare += shift;
    }
  }
  // Fold rarities not yet in the catalog down to the highest available rarity so rolls never empty
  const available = getAvailableGearRarities();
  const order = ['legendary', 'epic', 'special', 'rare', 'common'];
  for (let i = 0; i < order.length; i++) {
    const r = order[i];
    if (!available.has(r) && rates[r] > 0) {
      const fallback = order.slice(i + 1).find(k => available.has(k)) ?? 'common';
      rates[fallback] += rates[r];
      rates[r] = 0;
    }
  }
  const total = order.reduce((s, k) => s + rates[k], 0);
  if (total !== 100 && total > 0) {
    const top = order.find(k => rates[k] > 0) ?? 'common';
    rates[top] += 100 - total;
  }
  return rates;
}

export function rollGearRiftChoices(rngFn, tier, { compassSlot = null, instability = false } = {}) {
  const rates = getGearRiftDropRates(tier, instability);
  const order = ['legendary', 'epic', 'special', 'rare', 'common'];
  const pickRarity = () => {
    const roll = rngFn() * 100;
    let acc = 0;
    for (const r of order) {
      acc += rates[r];
      if (roll < acc && rates[r] > 0) return r;
    }
    return order.find(r => rates[r] > 0) ?? 'common';
  };

  const targetSlots = compassSlot && GEAR_SLOTS.includes(compassSlot)
    ? [compassSlot, compassSlot, compassSlot]
    : [...GEAR_SLOTS];

  const chosenIds = [];
  for (const slot of targetSlots) {
    const rarity = pickRarity();
    const bySlot = GEAR_LIST.filter(g => g.slot === slot && !chosenIds.includes(g.id));
    let pool = bySlot.filter(g => g.rarity === rarity);
    if (!pool.length) {
      const fallbackOrder = [rarity, 'special', 'rare', 'common', 'epic', 'legendary'];
      for (const fb of fallbackOrder) {
        pool = bySlot.filter(g => g.rarity === fb);
        if (pool.length) break;
      }
    }
    if (!pool.length) pool = GEAR_LIST.filter(g => g.slot === slot);
    const pickItem = pool[Math.floor(rngFn() * pool.length)] ?? pool[0];
    if (pickItem) chosenIds.push(pickItem.id);
  }
  return chosenIds;
}

export function getGearDuplicateReward(gearOrId) {
  const gear = typeof gearOrId === 'string' ? getGearById(gearOrId) : gearOrId;
  if (!gear) return { gold: 50, materialId: 'smithing_stone', materialCount: 1 };
  if (gear.rarity === 'legendary') return { gold: 800, materialId: 'godly_smithing_essence', materialCount: 1 };
  if (gear.rarity === 'epic') return { gold: 400, materialId: 'superior_smithing_stone', materialCount: 1 };
  if (gear.rarity === 'special') return { gold: 200, materialId: 'smithing_crystal', materialCount: 1 };
  if (gear.rarity === 'rare') return { gold: 100, materialId: 'smithing_stone', materialCount: 2 };
  return { gold: 50, materialId: 'smithing_stone', materialCount: 1 };
}

export function getGearById(id) {
  return typeof id === 'string' && Object.hasOwn(GEAR_CATALOG, id) ? GEAR_CATALOG[id] : null;
}

export function getGearListBySlot(slot) {
  if (!slot || slot === 'all') return GEAR_LIST;
  return GEAR_LIST.filter(item => item.slot === slot);
}

export function getOwnedGear(player) {
  return Array.isArray(player?.gearInventory) ? player.gearInventory : [];
}

export function getEquippedGear(player) {
  const eq = player?.equippedGear;
  return {
    weapon: typeof eq?.weapon === 'string' && getGearById(eq.weapon)?.slot === 'weapon' ? eq.weapon : null,
    armor: typeof eq?.armor === 'string' && getGearById(eq.armor)?.slot === 'armor' ? eq.armor : null,
    accessory: typeof eq?.accessory === 'string' && getGearById(eq.accessory)?.slot === 'accessory' ? eq.accessory : null,
  };
}

export function getOwnedGearEntry(player, gearId) {
  return getOwnedGear(player).find(entry => entry.id === gearId) ?? null;
}

export function getEquippedGearEntries(player) {
  const equipped = getEquippedGear(player);
  const ownedMap = new Map(getOwnedGear(player).map(entry => [entry.id, entry]));
  const result = {};
  for (const slot of GEAR_SLOTS) {
    const id = equipped[slot];
    const def = id ? getGearById(id) : null;
    const entry = id ? ownedMap.get(id) : null;
    result[slot] = def && entry ? { def, refine: entry.refine ?? 0 } : null;
  }
  return result;
}

export function getGearRefineCost(gearOrId, currentRefine = 0) {
  const gear = typeof gearOrId === 'string' ? getGearById(gearOrId) : gearOrId;
  if (!gear || currentRefine >= MAX_GEAR_REFINE) return 0;
  const table = GEAR_REFINE_COSTS[gear.rarity] ?? GEAR_REFINE_COSTS.common;
  return table[currentRefine] ?? table[table.length - 1];
}

export function getGearRefineSuccessRate(currentRefine = 0) {
  if (currentRefine >= MAX_GEAR_REFINE) return 0;
  return GEAR_REFINE_SUCCESS_RATES[currentRefine] ?? 45;
}

export function getGearRefineMaterialId(currentRefine = 0) {
  if (currentRefine < 0 || currentRefine >= MAX_GEAR_REFINE) return null;
  return GEAR_REFINE_MATERIALS[currentRefine] ?? null;
}

export function getGearSellPrice(gearOrId, refine = 0) {
  const gear = typeof gearOrId === 'string' ? getGearById(gearOrId) : gearOrId;
  if (!gear) return 0;
  const baseSell = Math.max(10, Math.floor(gear.price * 0.4));
  const perRefine = gear.rarity === 'legendary' ? 40
    : gear.rarity === 'epic' ? 28
    : gear.rarity === 'special' ? 20
    : gear.rarity === 'rare' ? 12
    : 6;
  return baseSell + refine * perRefine;
}

export function getGearSalvageReward(gearOrId, refine = 0) {
  const gear = typeof gearOrId === 'string' ? getGearById(gearOrId) : gearOrId;
  if (!gear) return null;
  if (gear.rarity === 'legendary') return { materialId: 'godly_smithing_essence', count: 1 };
  if (gear.rarity === 'epic') return { materialId: 'superior_smithing_stone', count: 1 };
  const materialId = gear.rarity === 'special' || gear.rarity === 'rare' || refine >= 3 ? 'smithing_crystal' : 'smithing_stone';
  return { materialId, count: 1 };
}

export function getGearRefineBonuses(slot, refine = 0) {
  const r = Math.max(0, Math.min(MAX_GEAR_REFINE, refine | 0));
  if (r === 0) return {};
  if (slot === 'weapon') {
    return {
      flatSpellDamage: r,
      summonAllStrike: r * 3,
      pierceBonus: Math.floor(r / 2),
    };
  }
  if (slot === 'armor') {
    return {
      maxHpBonus: r * 6,
      naturalArmor: Math.floor(r / 2),
      shieldBonus: r,
    };
  }
  if (slot === 'accessory') {
    return {
      maxManaBonus: Math.ceil(r / 2),
      flatSpellDamage: Math.floor(r / 2),
      summonAllStrike: Math.floor(r / 2),
      healBonus: Math.floor(r / 2),
    };
  }
  return {};
}

export function describeGearRefineBonus(gearOrId, refine = 0) {
  const gear = typeof gearOrId === 'string' ? getGearById(gearOrId) : gearOrId;
  if (!gear) return '';
  const b = getGearRefineBonuses(gear.slot, refine);
  const parts = [];
  if (b.flatSpellDamage) parts.push(`ดาเมจคาถา +${b.flatSpellDamage}`);
  if (b.summonAllStrike) parts.push(`หมัดอัญเชิญ +${b.summonAllStrike}`);
  if (b.pierceBonus) parts.push(`เจาะเกราะ +${b.pierceBonus}`);
  if (b.maxHpBonus) parts.push(`Max HP +${b.maxHpBonus}`);
  if (b.naturalArmor) parts.push(`เกราะติดตัว +${b.naturalArmor}`);
  if (b.shieldBonus) parts.push(`โล่ +${b.shieldBonus}`);
  if (b.maxManaBonus) parts.push(`Max MP +${b.maxManaBonus}`);
  if (b.healBonus) parts.push(`ฟื้นฟู +${b.healBonus}`);
  return parts.length ? parts.join(' · ') : 'ยังไม่ตีบวก';
}

export function computeGearModifiers(player) {
  const mods = {
    flatSpellDamage: 0,
    pierceBonus: 0,
    elementDamage: {},
    elementPierce: {},
    formDamageBonus: {},
    formPierceBonus: {},
    fireBurnBonus: 0,
    iceChillBonus: 0,
    armorShredBonus: 0,
    axeArmorShred: 0,
    shotArmorShred: 0,
    beamStripWard: 0,
    spearBackRatioPct: 0,
    pairCostReduction: 0,
    pairSecondHitPct: 0,
    pairDrawBonus: 0,
    blastSplashBonus: 0,
    blastBurnDetonate: 0,
    waterHealBonus: 0,
    waterWetDurationBonus: 0,
    windPushDamageBonus: 0,
    windExtraPushSteps: 0,
    wallSlamArmorShred: 0,
    zeroArmorDamagePct: 0,
    staticQuartzChainDmg: 0,
    chainLightningFullPierce: false,
    chainLightningManaOnHit: 0,
    wetDamageHeal: 0,
    maxHpBonus: 0,
    maxManaBonus: 0,
    handLimitBonus: 0,
    startShield: 0,
    shieldBonus: 0,
    turnStartBlock: 0,
    highHandBlock: 0,
    naturalArmor: 0,
    heavyHitReduction: 0,
    firstHitReduction: 0,
    fireDamageReduction: 0,
    fireHitGainBlock: 0,
    iceDamageReduction: 0,
    counterChillOnHit: 0,
    lightningDamageReduction: 0,
    shieldBreakRetaliate: 0,
    healBonus: 0,
    healOverflowToShield: 0,
    summonAllHp: 0,
    summonAllArmor: 0,
    summonAllCounter: 0,
    summonAllStrike: 0,
    summonCommonHp: 0,
    summonCommonStrike: 0,
    summonCommonManaRefund: 0,
    shieldGrantsSummonWard: 0,
    summonAerialStartWard: 0,
    summonBreakRetaliate: 0,
    summonBreakMana: 0,
    summonBreakDraw: 0,
    summonCreatureBonus: {},
    // Phase 2 Special gear modifiers
    earthSummonHp: 0,
    earthSummonArmor: 0,
    windEarthSummonHp: 0,
    golemAoeShred: 0,
    aoeInterceptDamageReductionPct: 0,
    aoeInterceptManaGain: 0,
    aoeOverflowReductionPct: 0,
    aoeInterceptRetaliateAll: 0,
    akkiFullHealCut: false,
    hemanLastingFreezeThreshold: 0,
    asaniChainRatioPct: 0,
    asaniChainBoth: false,
    pathaphiBlockBonus: 0,
    highShieldRetaliate: 0,
    wariHealBonus: 0,
    wariStripWard: 0,
    wariStripAllWard: 0,
    spriteSirenCounterMana: 0,
    spriteSirenCounterDraw: 0,
    highCostDiscount: 0,
    iceCostDiscount: 0,
    summonDebuffedStrikePct: 0,
    summonFlatDamageReduction: 0,
    counterWetOnHit: false,
    magmaPuddleBonusDmg: 0,
    magmaPuddleShred: 0,
    permafrostBlockBonus: 0,
    thornsLightningDmg: 0,
    healToBlockPct: 0,
    summonRelayBonusPct: 0,
    summonRelayWard: 0,
    summonAllDmgPct: 0,
    summonStrikeMana: 0,
    summonStrikeDraw: 0,
    sirenCounterWetAll: false,
    summonWetBonusPct: 0,
    manaOverflowToBlock: 0,
    fireEarthCastBlock: 0,
    freezeSpreadChill: 0,
    summonEvenTurnWard: 0,
    // Phase 3 Epic & Legendary gear modifiers
    elementDamagePct: {},
    flatSpellDamagePct: 0,
    dualFusionDamagePct: 0,
    dualFusionManaRefund: 0,
    dualFusionCostDiscount: 0,
    dualFusionSecondaryBonus: false,
    behemothAoeShred: 0,
    behemothInterceptRetaliate: 0,
    behemothZeroOverflow: false,
    behemothInvokeShred: 0,
    behemothInvokeTrueDmg: 0,
    hydraRegenBonus: 0,
    hydraCounterExtraHits: 0,
    hydraCounterPoisonDmg: 0,
    krakenEnemyDmgReductionPct: 0,
    krakenBossDmgReductionPct: 0,
    krakenStripAllWard: false,
    summonBypassWard: false,
    plasmaKillSplashDmg: 0,
    plasmaOverkillSplash: false,
    frostvoltChilledDmgPct: 0,
    frostvoltFreezeAdjacent: false,
    frostvoltChainFreezeChilled: false,
    frostvoltChainRatioPct: 0,
    scaldShredBonus: 0,
    scaldStunTarget: false,
    scaldCastManaRefund: 0,
    scaldZeroArmor: false,
    scaldArmoredManaRefund: 0,
    shockstreamFullPower: false,
    shockstreamManaPerWet: 0,
    shockstreamBonusDmg: 0,
    shockstreamPush: 0,
    shockstreamFreeIf3Wet: false,
    barrageCostDiscountPct: 0,
    barrageRampPctPerHit: 0,
    barrageHitBlock: 0,
    barrageDrawCards: 0,
    barrageHitHeal: 0,
    devastationRadiusBonus: 0,
    devastationRatioPct: 0,
    devastationBypassWard: false,
    devastationCastBlock: 0,
    devastationDamagePctBonus: 0,
    devastationArmorShred: 0,
    turnStartHeal: 0,
    lowHpEmergencyShield: 0,
    immuneHazardDamage: false,
    counterShredOnHit: 0,
    reflectIncomingPct: 0,
    summonCounterDmgPct: 0,
    monsoonHealBonus: 0,
    monsoonExtraPushSteps: 0,
    periodicBarrierEvery3Turns: 0,
    bossHeavyReductionPct: 0,
    bossDamageReductionPct: 0,
    blackholeCostDiscount: 0,
    earthBlockBonus: 0,
    healSpellPctBonus: 0,
    dragonReflectPct: 0,
    dragonTrueStrike: false,
    dragonDoubleStrike: false,
    phoenixExtraPlayerRevives: 0,
    phoenixExtraEggRebirths: 0,
    summonCastHeal: 0,
    armorSelfReviveOnce: false,
    phoenixReviveFreeManaTurns: 0,
    summonAttackPlayerHeal: 0,
    timestopExtraUses: 0,
    timestopBonusMana: 0,
    timestopFullHandDraw: false,
    timestopPreserveShield: false,
    timestopRefillHandAndMana: false,
    timestopNextTurnFreeCast: false,
    chronosAutoSkipEvery4Turns: false,
    blackholeSlamBonus: 0,
    blackholePowerBonus: 0,
    blackholeManaPerPulled: 0,
    blackholeKillMaxHpGain: 0,
    deathBossDmgBonus: 0,
    deathKillFullManaRefund: false,
    deathKillKeepCard: false,
    deathKillResetSpent: false,
    ascensionPermanentUpgrades: false,
    ascensionPermanentFreeCast: false,
    voidOverkillNegate: false,
    damageToManaPct: 0,
    summonDmgLifestealPct: 0,
    turnStartEnemyArmorShred: 0,
    startShieldLayers3x10: false,
    summonAllWard: 0,
    turnStartManaBonus: 0,
    drawToFullHand: false,
  };

  const entries = getEquippedGearEntries(player);
  const maxKeys = new Set([
    'spearBackRatioPct',
    'asaniChainRatioPct',
    'aoeInterceptDamageReductionPct',
    'aoeOverflowReductionPct',
    'frostvoltChainRatioPct',
    'devastationRatioPct',
    'krakenEnemyDmgReductionPct',
    'krakenBossDmgReductionPct',
    'bossHeavyReductionPct',
    'bossDamageReductionPct',
    'dragonReflectPct',
    'reflectIncomingPct',
    'damageToManaPct',
    'summonDmgLifestealPct',
    'barrageCostDiscountPct',
    'hydraCounterExtraHits',
    'hydraCounterPoisonDmg',
  ]);
  const minPositiveKeys = new Set(['hemanLastingFreezeThreshold']);
  const applyEffectMap = eff => {
    if (!eff) return;
    for (const [key, val] of Object.entries(eff)) {
      if (val == null) continue;
      if (key === 'elementDamage' || key === 'elementDamagePct' || key === 'elementPierce' || key === 'formDamageBonus' || key === 'formPierceBonus') {
        for (const [subKey, subVal] of Object.entries(val)) {
          mods[key][subKey] = (mods[key][subKey] ?? 0) + subVal;
        }
      } else if (key === 'summonCreatureBonus') {
        for (const [creatureId, bonusObj] of Object.entries(val)) {
          mods.summonCreatureBonus[creatureId] ??= {};
          for (const [statKey, statVal] of Object.entries(bonusObj)) {
            mods.summonCreatureBonus[creatureId][statKey] = (mods.summonCreatureBonus[creatureId][statKey] ?? 0) + statVal;
          }
        }
      } else if (maxKeys.has(key)) {
        mods[key] = Math.max(mods[key], val);
      } else if (minPositiveKeys.has(key)) {
        mods[key] = mods[key] > 0 ? Math.min(mods[key], val) : val;
      } else if (typeof val === 'boolean') {
        mods[key] = mods[key] || val;
      } else if (typeof val === 'number') {
        mods[key] = (mods[key] ?? 0) + val;
      }
    }
  };

  for (const slot of GEAR_SLOTS) {
    const equipped = entries[slot];
    if (!equipped) continue;
    applyEffectMap(equipped.def.effects);
    applyEffectMap(getGearRefineBonuses(slot, equipped.refine));
  }

  return mods;
}

export function getGearEquipmentSignature(player) {
  const eq = getEquippedGear(player);
  const inv = getOwnedGear(player);
  const refineById = new Map(inv.map(e => [e.id, e.refine ?? 0]));
  return GEAR_SLOTS.map(slot => {
    const id = eq[slot];
    return id ? `${id}+${refineById.get(id) ?? 0}` : '-';
  }).join(',');
}

export function summarizeActiveGearStats(player) {
  const mods = computeGearModifiers(player);
  const parts = [];
  if (mods.maxHpBonus) parts.push(`Max HP +${mods.maxHpBonus}`);
  if (mods.maxManaBonus) parts.push(`Max MP +${mods.maxManaBonus}`);
  if (mods.handLimitBonus) parts.push(`ไพ่ในมือ +${mods.handLimitBonus}`);
  if (mods.naturalArmor) parts.push(`เกราะติดตัว +${mods.naturalArmor}`);
  if (mods.flatSpellDamage) parts.push(`ดาเมจคาถา +${mods.flatSpellDamage}`);
  if (mods.pierceBonus) parts.push(`เจาะเกราะ +${mods.pierceBonus}`);
  if (mods.shieldBonus) parts.push(`โล่ +${mods.shieldBonus}`);
  if (mods.healBonus) parts.push(`ฟื้นฟู +${mods.healBonus}`);
  if (mods.summonAllHp) parts.push(`อัญเชิญ HP +${mods.summonAllHp}`);
  if (mods.summonAllStrike) parts.push(`หมัดอัญเชิญ +${mods.summonAllStrike}`);
  if (mods.summonAllDmgPct) parts.push(`พลังอัญเชิญ +${mods.summonAllDmgPct}%`);
  return parts;
}

