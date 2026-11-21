// Floors 51–100 Endgame Tower Expansion: Monsters, Encounters, Relics, and High-Tier Shop Items

export const KRAKEN_TENTACLE_KINDS = Object.freeze([
  'kraken_ward_tentacle',
  'kraken_heal_tentacle',
  'kraken_ink_tentacle',
  'kraken_crush_tentacle',
]);

export const NETHER_PILLAR_KINDS = Object.freeze([
  'nether_leech_pillar',
  'nether_curse_pillar',
  'nether_doom_pillar',
]);

export const ETERNITY_PHASE_HP = Object.freeze([3500, 3500, 4500]);
export const ETERNITY_SHIFT_AFFINITIES = Object.freeze(['earth', 'fire', 'ice', 'lightning']);

export const ENDGAME_ENEMIES = {
  // --- Floors 51–55: Abyssal Depths (Water 💧) ---
  abyss_crawler: { name: 'ปูเกราะบาดาล', hp: 260, armor: 4, ward: 0, attack: 26, color: '#3b82a6', exp: 60, gold: 50, affinity: 'water' },
  hydra_serpent: { name: 'อสรพิษวารี', hp: 220, armor: 2, ward: 0, attack: 32, color: '#2a9d8f', exp: 58, gold: 48, affinity: 'water' },
  leviathan_tide: { name: 'พญานาคีสมุทร', hp: 950, armor: 3, ward: 2, attack: 38, color: '#1d3557', exp: 160, gold: 150, isBoss: true, swapTurn: 2, wardTurn: 1, heavy: 58, affinity: 'water' },

  // --- Floors 56–60: Infernal Magma (Fire 🔥) ---
  magma_tortoise: { name: 'เต่าศิลาลาวา', hp: 340, armor: 3, ward: 0, attack: 30, color: '#d94e34', exp: 68, gold: 58, affinity: 'fire' },
  cinder_drake: { name: 'มังกรสะเก็ดไฟ', hp: 280, armor: 1, ward: 0, attack: 36, color: '#f77f00', exp: 65, gold: 55, affinity: 'fire' },
  volcano_colossus: { name: 'ยักษ์อัคนีภูเขาไฟ', hp: 1500, armor: 3, ward: 1, attack: 46, color: '#e63946', exp: 240, gold: 220, isBoss: true, affinity: 'fire' },

  // --- Floors 61–65: Gale Peaks (Wind 💨) ---
  gale_harpy: { name: 'ปักษาพายุหมุน', hp: 360, armor: 2, ward: 0, attack: 40, color: '#8ecae6', exp: 70, gold: 60, distanceAttack: true, affinity: 'wind' },
  cloud_elemental: { name: 'จิตวิญญาณเมฆา', hp: 420, armor: 2, ward: 2, attack: 36, color: '#a8dadc', exp: 72, gold: 62, wardTurn: 1, affinity: 'wind' },
  storm_roc: { name: 'วิหคสายลมคำราม', hp: 1800, armor: 3, ward: 2, attack: 50, color: '#457b9d', exp: 190, gold: 180, isBoss: true, swapTurn: 2, wardTurn: 1, heavy: 74, affinity: 'wind' },

  // --- Floors 66–70: Thunder Wastes (Lightning ⚡) ---
  sand_stalker: { name: 'แมงป่องสายฟ้าทราย', hp: 500, armor: 3, ward: 0, attack: 44, color: '#ee9b00', exp: 76, gold: 65, affinity: 'lightning' },
  spark_wraith: { name: 'ภูตอัสนีไร้ร่าง', hp: 440, armor: 1, ward: 1, attack: 48, color: '#ffd166', exp: 74, gold: 64, swapTurn: 1, affinity: 'lightning' },
  thunder_drake_emperor: { name: 'จักรพรรดิมังกรอสุนี', hp: 2800, armor: 5, ward: 1, attack: 58, color: '#ffb703', exp: 260, gold: 240, isBoss: true, affinity: 'lightning' },

  // --- Floors 71–75: Glacial Permafrost (Ice ❄️) ---
  frost_crystal_golem: { name: 'โกเลมผลึกหิมะ', hp: 620, armor: 5, ward: 1, attack: 46, color: '#bde0fe', exp: 82, gold: 70, affinity: 'ice' },
  blizzard_wolf: { name: 'พญาหมาป่าเหมันต์', hp: 540, armor: 2, ward: 0, attack: 54, color: '#a2d2ff', exp: 80, gold: 68, affinity: 'ice' },
  glacial_hydra: { name: 'ไฮดราน้ำแข็งพันปี', hp: 3000, armor: 4, ward: 2, attack: 62, color: '#90e0ef', exp: 210, gold: 200, isBoss: true, swapTurn: 2, wardTurn: 1, heavy: 92, affinity: 'ice' },

  // --- Floors 76–80: Toxic Overgrowth & Abyssal Trench (Floor 80★ Water Kraken Boss 💧) ---
  venom_spore_beast: { name: 'อสูรสปอร์พิษ', hp: 640, armor: 3, ward: 1, attack: 54, color: '#588157', exp: 86, gold: 74, affinity: 'earth' },
  crag_titan_sentinel: { name: 'ทมิฬศิลายักษ์', hp: 760, armor: 6, ward: 0, attack: 50, color: '#344e41', exp: 90, gold: 78, affinity: 'earth' },
  ancient_chitin_behemoth: { name: 'เบฮีมอธเกราะปฐพี', hp: 4600, armor: 6, ward: 2, attack: 70, color: '#3a5a40', exp: 280, gold: 260, isBoss: true, swapTurn: 1, wardTurn: 2, heavy: 104, repeatReduction: 70, affinity: 'earth' },
  kraken_ward_tentacle: { name: 'หนวดม่านวารี', hp: 1000, armor: 4, ward: 1, attack: 38, color: '#00b4d8', exp: 40, gold: 35, isBoss: true, affinity: 'water' },
  kraken_heal_tentacle: { name: 'หนวดฟื้นสมุทร', hp: 950, armor: 3, ward: 0, attack: 34, color: '#2ec4b6', exp: 40, gold: 35, isBoss: true, affinity: 'water' },
  kraken_ink_tentacle: { name: 'หนวดหมึกดำบาดาล', hp: 1050, armor: 3, ward: 0, attack: 42, color: '#5a189a', exp: 40, gold: 35, isBoss: true, affinity: 'water' },
  kraken_crush_tentacle: { name: 'หนวดยักษ์บดขยี้', hp: 1250, armor: 5, ward: 0, attack: 52, color: '#023e8a', exp: 45, gold: 40, isBoss: true, affinity: 'water' },
  abyssal_kraken: { name: 'มหาคราเค่นแห่งห้วงบาดาล', hp: 4600, armor: 5, ward: 1, attack: 72, color: '#0077b6', exp: 280, gold: 260, isBoss: true, affinity: 'water' },

  // --- Floors 81–85: Solar Citadel (Fire/Light 🔥) ---
  solar_sentinel: { name: 'หุ่นสุริยันพิฆาต', hp: 880, armor: 4, ward: 1, attack: 64, color: '#fb8500', exp: 94, gold: 80, distanceAttack: true, affinity: 'fire' },
  radiant_phoenix: { name: 'วิหคสุริยคราส', hp: 780, armor: 3, ward: 2, attack: 60, color: '#ffb703', exp: 92, gold: 78, wardTurn: 1, affinity: 'fire' },
  sun_archon: { name: 'อัครทูตแห่งดวงอาทิตย์', hp: 4800, armor: 4, ward: 2, attack: 76, color: '#f39c12', exp: 230, gold: 220, isBoss: true, swapTurn: 2, wardTurn: 1, heavy: 114, affinity: 'fire' },

  // --- Floors 86–90: Abyssal Shadow Necropolis (Void/Shadow 🌌) ---
  dread_reaper: { name: 'ยมทูตเงาจันทรา', hp: 900, armor: 3, ward: 1, attack: 74, color: '#4a154b', exp: 98, gold: 85, affinity: 'wind' },
  void_devourer: { name: 'มารสุญญากาศ', hp: 1020, armor: 4, ward: 1, attack: 64, color: '#3c096c', exp: 102, gold: 88, affinity: 'wind' },
  nether_dread_lord: { name: 'จอมอสูรนรกานต์', hp: 7000, armor: 5, ward: 2, attack: 84, color: '#240046', exp: 300, gold: 280, isBoss: true, repeatReduction: 70, affinity: 'wind' },
  nether_leech_pillar: { name: 'เสาดูดวิญญาณ', hp: 1100, armor: 4, ward: 1, attack: 48, color: '#7b2cbf', exp: 55, gold: 48, isBoss: true, affinity: 'wind' },
  nether_curse_pillar: { name: 'เสาคำสาปต้องห้าม', hp: 1050, armor: 3, ward: 1, attack: 54, color: '#9d0208', exp: 55, gold: 48, isBoss: true, affinity: 'fire' },
  nether_doom_pillar: { name: 'เสาพิพากษานรกานต์', hp: 1250, armor: 5, ward: 0, attack: 52, color: '#3a0ca3', exp: 60, gold: 52, isBoss: true, affinity: 'ice' },

  // --- Floors 91–95: Chamber of Cosmic Chaos (Cosmic 🌌) ---
  chaos_weaver: { name: 'ผู้ถักทอความโกลาหล', hp: 1080, armor: 4, ward: 2, attack: 72, color: '#7209b7', exp: 106, gold: 92, swapTurn: 1, affinity: 'lightning' },
  astral_chimera: { name: 'คิเมร่าดวงดาว', hp: 1200, armor: 4, ward: 1, attack: 82, color: '#560bad', exp: 110, gold: 96, affinity: 'lightning' },
  primordial_avatar: { name: 'อวตารปฐมกาล', hp: 6800, armor: 5, ward: 2, attack: 90, color: '#480ca8', exp: 250, gold: 240, isBoss: true, swapTurn: 2, wardTurn: 1, heavy: 136, affinity: 'lightning' },

  // --- Floors 96–100: The Celestial Zenith (Endgame Climax 🌌) ---
  zenith_templar: { name: 'อัศวินดวงดาวนิรันดร์', hp: 1380, armor: 5, ward: 2, attack: 88, color: '#4cc9f0', exp: 120, gold: 105, affinity: 'ice' },
  chronos_keeper: { name: 'ผู้คุมเวลาดึกดำบรรพ์', hp: 1250, armor: 4, ward: 2, attack: 78, color: '#4895ef', exp: 115, gold: 100, affinity: 'ice' },
  eternity_overlord: { name: 'มหาเทพราชันอนันตกาล', hp: 10000, armor: 6, ward: 2, attack: 98, color: '#f72585', exp: 500, gold: 500, isBoss: true, repeatReduction: 75, affinity: 'ice' },
  eternity_reborn: { name: 'มหาเทพอนันตกาล · ร่างจุตินิรันดร์', hp: ETERNITY_PHASE_HP[2], armor: 6, ward: 2, attack: 124, color: '#ffd166', exp: 500, gold: 500, isBoss: true, repeatReduction: 50, affinity: 'fire' },
};

export const ENDGAME_RELICS = Object.freeze([
  {
    id: 'magma_heart_60',
    name: 'ดวงใจแมกมา',
    dropFloor: 60,
    icon: '🌋',
    summary: 'เวทไฟและดินแรงขึ้น +3 ดาเมจ และเมื่อเกราะแตกจะระเบิดสะเก็ดไฟ 12 ดาเมจใส่ศัตรูทั้งหมด',
    status: 'ดรอปจากบอสหลักชั้น 60',
  },
  {
    id: 'thunder_conduit_70',
    name: 'แกนนำอสุนีบาต',
    dropFloor: 70,
    icon: '⚡',
    summary: 'คาถาที่มีธาตุสายฟ้าสร้างช็อกไฟฟ้าลูกโซ่ +6 ดาเมจ และคืนมานา 1 หน่วย',
    status: 'ดรอปจากบอสหลักชั้น 70',
  },
  {
    id: 'gaia_emblem_80',
    name: 'ตราประทับมหาสมุทร',
    dropFloor: 80,
    icon: '🌊',
    summary: 'เกราะป้องกันพื้นฐาน +3 ทุกเทิร์น และฟื้นฟู 4 HP เมื่อได้รับโล่เวท',
    status: 'ดรอปจากบอสหลักชั้น 80',
  },
  {
    id: 'void_annihilator_90',
    name: 'ศิลาล้างมิติอนันต์',
    dropFloor: 90,
    icon: '🌌',
    summary: 'เวทโจมตีทุกบทเพิกเฉยต่อเกราะศัตรู 4 หน่วย และสังหารศัตรูจะได้รับ 3 มานา',
    status: 'ดรอปจากบอสหลักชั้น 90',
  },
  {
    id: 'crown_of_eternity_100',
    name: 'มงกุฎอนันตกาล',
    dropFloor: 100,
    icon: '👑',
    summary: 'สุดยอดอาติแฟคจบเกม: เพิ่มมานาเริ่มต้น +3, เพิ่มขนาดมือ +2 ใบ, และเวทผสานธาตุคู่ (Dual Fusion) แรงขึ้น 50%!',
    status: 'ดรอปจากบอสใหญ่สุดชั้น 100 (Endgame Final Boss)',
  },
]);

// 38 New High-Tier Consumables / Shop Items Unlocking at Floors 50, 60, 70, 80, 90
export const ENDGAME_SHOP_ITEMS = Object.freeze({
  // --- Tier 1: Floor 50+ (Post-50 Deepwater / Ocean) ---
  abyssal_elixir: {
    id: 'abyssal_elixir', name: 'ยาฟื้นพลังบาดาล', icon: '🧪', cost: 24, minFloor: 50, hpRestore: 35,
    badge: '+35 HP ทันที', description: 'โอสถสกัดจากสายน้ำลึก ฟื้นฟู 35 HP ทันทีในการต่อสู้หรือในคลัง',
  },
  deepwater_flask: {
    id: 'deepwater_flask', name: 'ขวดน้ำลึกกลั่นบริสุทธิ์', icon: '💧', cost: 26, minFloor: 50, manaRestore: 5,
    badge: '+5 MP ทันที', description: 'สมานธารมานา ฟื้นฟู 5 MP ทันทีโดยไม่เสียเทิร์น',
  },
  coral_barrier_tome: {
    id: 'coral_barrier_tome', name: 'คัมภีร์ปะการังศิลา', icon: '🪸', cost: 28, minFloor: 50,
    badge: 'โล่เวท +20', description: 'สร้างกำแพงปะการังป้องกัน 20 หน่วยทันทีในเทิร์นนี้',
  },
  sea_serpent_fang: {
    id: 'sea_serpent_fang', name: 'เขี้ยวอสรพิษสมุทร', icon: '🗡️', cost: 30, minFloor: 50,
    badge: '18 ดาเมจเจาะเกราะ', description: 'ซัดเขี้ยวสมุทรทะลวงเกราะ สร้าง 18 ดาเมจใส่ศัตรูเป้าหมาย',
  },
  mana_surge_potion: {
    id: 'mana_surge_potion', name: 'โพชั่นคลื่นมานา', icon: '✨', cost: 32, minFloor: 50,
    badge: 'เติม 8 MP เต็มพลัง', manaRestore: 8, description: 'หลั่งไหลมานามหาศาล ฟื้นฟู 8 MP ทันที',
  },
  smithing_crystal: {
    id: 'smithing_crystal', name: 'ผลึกตีบวกชั้นกลาง', icon: '💎', cost: 150, minFloor: 50, vaultOnly: true,
    badge: 'อัตราสำเร็จ +20%', description: 'วัตถุดิบตีบวกชั้นยอด เพิ่มโอกาสสำเร็จ 20 จุดเปอร์เซ็นต์ที่แท่นตีบวก (ยังคงต้องจ่ายทองค่าตีบวกพื้นฐาน)',
  },
  oceanic_bubble: {
    id: 'oceanic_bubble', name: 'ฟองอากาศมหาป้อง', icon: '🫧', cost: 28, minFloor: 50,
    badge: 'โล่เวท +15 & ล้างเปียก', description: 'กางฟองน้ำดูดซับ 15 ดาเมจและคุ้มครองผู้เล่น',
  },
  tide_cleanser: {
    id: 'tide_cleanser', name: 'น้ำตาแห่งกระแสน้ำ', icon: '🌊', cost: 25, minFloor: 50, hpRestore: 25, manaRestore: 3,
    badge: '+25 HP & +3 MP', description: 'กระแสน้ำชำระล้าง ฟื้นฟูทั้งเลือด 25 HP และมานา 3 MP',
  },

  // --- Tier 2: Floor 60+ (Post-60 Volcanic Magma) ---
  magma_draught: {
    id: 'magma_draught', name: 'ยาหลอมเหลวภูเขาไฟ', icon: '🏺', cost: 34, minFloor: 60, hpRestore: 30,
    badge: '+30 HP & อุ่นพลัง', description: 'ความร้อนเข้มข้น ฟื้นฟู 30 HP ทันที',
  },
  volcanic_ash_bomb: {
    id: 'volcanic_ash_bomb', name: 'ระเบิดเถ้าภูเขาไฟ', icon: '💣', cost: 38, minFloor: 60,
    badge: '22 ดาเมจไฟทุกตัว', description: 'ระเบิดเถ้าหินหลอมละลาย สร้าง 22 ดาเมจไฟใส่ศัตรูทั้งหมด',
  },
  pyro_core_extract: {
    id: 'pyro_core_extract', name: 'สารสกัดแก่นเพลิง', icon: '🔥', cost: 36, minFloor: 60,
    badge: '15 ดาเมจ & เผาไหม้', description: 'สาดเพลิงเข้มข้น ทำ 15 ดาเมจไฟและเผาไหม้ 5 ดาเมจ',
  },
  ignite_scroll: {
    id: 'ignite_scroll', name: 'ม้วนคาถาจุดเพลิง', icon: '📜', cost: 32, minFloor: 60,
    badge: 'ล้างม่านศัตรูทั้งหมด', description: 'เผาทำลายม่านเวท (Ward) ของศัตรูทุกตัวในสนามทันที',
  },
  superior_smithing_stone: {
    id: 'superior_smithing_stone', name: 'หินตีบวกชั้นสูง', icon: '⚒️', cost: 280, minFloor: 60, vaultOnly: true,
    badge: 'อัตราสำเร็จ +30%', description: 'หินแร่ร้อนระอุ เพิ่มโอกาสสำเร็จ 30 จุดเปอร์เซ็นต์ที่แท่นตีบวก (ยังคงต้องจ่ายทองค่าตีบวกพื้นฐาน)',
  },
  obsidian_armor_flask: {
    id: 'obsidian_armor_flask', name: 'น้ำยาผลึกออบซิเดียน', icon: '🛡️', cost: 36, minFloor: 60,
    badge: 'โล่เวท +25', description: 'เคลือบเกราะหินดำ มอบโล่ 25 หน่วยในเทิร์นนี้',
  },
  cinder_draught: {
    id: 'cinder_draught', name: 'โอสถสะเก็ดสุริยะ', icon: '☀️', cost: 35, minFloor: 60, manaRestore: 7,
    badge: '+7 MP ทันที', description: 'ดึงพลังความร้อนแปรเป็นมานา +7 MP ทันที',
  },
  infernal_catalyst: {
    id: 'infernal_catalyst', name: 'ตัวเร่งปฏิกิริยาเพลิง', icon: '🏮', cost: 40, minFloor: 60, hpRestore: 40,
    badge: '+40 HP สมานแผล', description: 'ฟื้นฟูบาดแผลขั้นสูง +40 HP',
  },

  // --- Tier 3: Floor 70+ (Post-70 Thunder Tempest) ---
  thunder_battery: {
    id: 'thunder_battery', name: 'แบตเตอรี่อสุนีบาต', icon: '🔋', cost: 42, minFloor: 70, manaRestore: 6,
    badge: '+6 MP & สายฟ้า', description: 'ประจุไฟฟ้าเข้มข้น ฟื้นฟู 6 MP ทันที',
  },
  galvanic_shield_generator: {
    id: 'galvanic_shield_generator', name: 'เครื่องสร้างสนามแม่เหล็ก', icon: '⚡', cost: 45, minFloor: 70,
    badge: 'โล่สายฟ้า +30', description: 'กางบาเรียแม่เหล็กป้องกัน 30 หน่วยทันทีในเทิร์นนี้',
  },
  pure_lightning_rod: {
    id: 'pure_lightning_rod', name: 'สายล่อฟ้าทองคำ', icon: '🌩️', cost: 48, minFloor: 70,
    badge: '24 ดาเมจ & ล้างม่าน', description: 'ฟาดสายฟ้า 24 ดาเมจใส่เป้าหมายและทำลายม่านเวท',
  },
  chain_lightning_orb: {
    id: 'chain_lightning_orb', name: 'ลูกแก้วอสุนีบาตลูกโซ่', icon: '🔮', cost: 46, minFloor: 70,
    badge: '18 ดาเมจชิ่งสายฟ้า', description: 'สร้าง 18 ดาเมจสายฟ้าใส่เป้าหมายและชิ่งใส่ตัวข้างเคียง',
  },
  hyper_smithing_cluster: {
    id: 'hyper_smithing_cluster', name: 'กลุ่มแร่ตีบวกไฮเปอร์', icon: '💠', cost: 450, minFloor: 70, vaultOnly: true,
    badge: 'อัตราสำเร็จ +40%', description: 'ผลึกไฟฟ้าบริสุทธิ์ เพิ่มโอกาสสำเร็จ 40 จุดเปอร์เซ็นต์ที่แท่นตีบวก (ยังคงต้องจ่ายทองค่าตีบวกพื้นฐาน)',
  },
  tempest_elixir: {
    id: 'tempest_elixir', name: 'น้ำยาแก่นวายุอัสนี', icon: '🧪', cost: 44, minFloor: 70, hpRestore: 45, manaRestore: 4,
    badge: '+45 HP & +4 MP', description: 'ฟื้นฟู 45 HP และ 4 MP อย่างรวดเร็ว',
  },
  cyclone_feather: {
    id: 'cyclone_feather', name: 'ขนนกพายุหมุนคลั่ง', icon: '🪶', cost: 40, minFloor: 70,
    badge: 'โล่เวท +20 & จั่วการ์ด', description: 'มอบโล่ 20 หน่วยและสลับการ์ดบนมือ',
  },
  static_surge_vial: {
    id: 'static_surge_vial', name: 'ขวดประจุไฟฟ้าสถิต', icon: '🧪', cost: 45, minFloor: 70, manaRestore: 9,
    badge: '+9 MP ทันที', description: 'เติมเต็มพลังเวทมนตร์ด้วยประจุกลั่น +9 MP',
  },

  // --- Tier 4: Floor 80+ (Post-80 Glacial & Earth Core) ---
  glacial_nectar: {
    id: 'glacial_nectar', name: 'น้ำทิพย์ธารน้ำแข็ง', icon: '❄️', cost: 50, minFloor: 80, hpRestore: 55,
    badge: '+55 HP ทันที', description: 'น้ำแข็งพันปีสมานชีพ ฟื้นฟู 55 HP ทันที',
  },
  absolute_zero_vial: {
    id: 'absolute_zero_vial', name: 'ขวดความเย็นสัมบูรณ์', icon: '🧊', cost: 55, minFloor: 80,
    badge: 'แช่แข็งศัตรูทั้งหมด', description: 'โปรยไอเย็นศูนย์สัมบูรณ์ แช่แข็งศัตรูทุกตัว 1 เทิร์น',
  },
  titan_wall_scroll: {
    id: 'titan_wall_scroll', name: 'ม้วนคาถากำแพงไททัน', icon: '🧱', cost: 52, minFloor: 80,
    badge: 'โล่เวทมหาศาล +40', description: 'อัญเชิญกำแพงหินศิลาโบราณ มอบโล่ป้องกัน 40 หน่วยทันที',
  },
  gaia_heart_shard: {
    id: 'gaia_heart_shard', name: 'ชิ้นส่วนหัวใจพระแม่ธรณี', icon: '💚', cost: 56, minFloor: 80, hpRestore: 60, manaRestore: 5,
    badge: '+60 HP & +5 MP', description: 'พลังแห่งแผ่นดิน ฟื้นฟู 60 HP และ 5 MP',
  },
  abyssal_smithing_core: {
    id: 'abyssal_smithing_core', name: 'แกนตีบวกโลกันตร์', icon: '💎', cost: 700, minFloor: 80, vaultOnly: true,
    badge: 'อัตราสำเร็จ +50%', description: 'แกนตีบวกไร้ที่ติ เพิ่มโอกาสสำเร็จ 50 จุดเปอร์เซ็นต์ที่แท่นตีบวก (ยังคงต้องจ่ายทองค่าตีบวกพื้นฐาน)',
  },
  frost_shield_rune: {
    id: 'frost_shield_rune', name: 'รูนโล่น้ำแข็งศักดิ์สิทธิ์', icon: '🛡️', cost: 54, minFloor: 80,
    badge: 'โล่เวท +35 & หนาวจัด', description: 'กางโล่น้ำแข็ง 35 หน่วยและแผ่ไอเย็น',
  },
  permafrost_tonic: {
    id: 'permafrost_tonic', name: 'ยาบำรุงเหมันต์นิรันดร์', icon: '🍶', cost: 52, minFloor: 80, manaRestore: 10,
    badge: '+10 MP เต็มขีดจำกัด', description: 'ฟื้นฟูมานามหาศาล +10 MP ทันที',
  },

  // --- Tier 5: Floor 90+ (Post-90 Cosmic & Celestial Endgame) ---
  void_singularity_flask: {
    id: 'void_singularity_flask', name: 'ขวดสุญญากาศเอกภพ', icon: '🌌', cost: 65, minFloor: 90,
    badge: 'ทำลายล้าง 45 ดาเมจ', description: 'เปิดมิติหลุมดำ ทำลายศัตรูทั่วไปหรือสร้าง 45 ดาเมจแท้ใส่บอส',
  },
  celestial_ambrosia: {
    id: 'celestial_ambrosia', name: 'อาหารทิพย์ดาราจักร', icon: '🌟', cost: 75, minFloor: 90, hpRestore: 100, manaRestore: 12,
    badge: '+100 HP & +12 MP เต็มพิกัด', description: 'สุดยอดอาหารทิพย์ ฟื้นฟู HP 100 และมานา 12 เต็มเปี่ยม',
  },
  omega_ward_prism: {
    id: 'omega_ward_prism', name: 'ปริซึมเกราะโอเมก้า', icon: '💠', cost: 70, minFloor: 90,
    badge: 'โล่โอเมก้า +50', description: 'สร้างมหาโล่ครอบคลุมร่างกาย มอบเกราะ 50 หน่วยทันทีในเทิร์นนี้',
  },
  godly_smithing_essence: {
    id: 'godly_smithing_essence', name: 'แก่นแท้ตีบวกเทวะ', icon: '👑', cost: 1000, minFloor: 90, vaultOnly: true,
    badge: 'ตีบวกสำเร็จ 100% แน่นอน', description: 'แก่นแท้แห่งเทพเจ้า รับประกันการตีบวกสำเร็จ 100% ทันทีที่แท่นตีบวก (ยังคงต้องจ่ายทองค่าตีบวกพื้นฐาน)',
  },
  zenith_blade_sigil: {
    id: 'zenith_blade_sigil', name: 'ตราดาบแห่งเซนิธ', icon: '⚔️', cost: 80, minFloor: 90,
    badge: '50 ดาเมจจริงทุกตัว', description: 'ปลดปล่อยดาบดวงดาวสังหาร ทำ 50 ดาเมจจริงใส่ศัตรูทั้งหมดในสนาม',
  },
  chronos_hourglass: {
    id: 'chronos_hourglass', name: 'นาฬิกาทรายกาลเวลา', icon: '⏳', cost: 72, minFloor: 90, manaRestore: 6, battleOnly: true,
    badge: 'ฟื้น 6 MP & จั่วเต็มมือ', description: 'หมุนเวลา เติม 6 MP และจั่วการ์ดเต็มมือทันที',
  },
  supernova_core: {
    id: 'supernova_core', name: 'แกนซูเปอร์โนวา', icon: '💥', cost: 76, minFloor: 90,
    badge: '35 ดาเมจระเบิดทุกเป้า', description: 'ระเบิดอนุภาคดวงดาว สร้าง 35 ดาเมจใส่ศัตรูทั้งหมดในสนาม',
  },
});

export const ENDGAME_SPACED_FLOORS = new Set([
  51, 53, 55, 57, 60,
  61, 63, 65, 67, 70,
  71, 73, 75, 77, 80,
  81, 83, 85, 87, 90,
  91, 93, 95, 97, 100,
]);

// 125 rooms for Floors 51 to 100 (5 decades * 25 rooms = 125 rooms)
export function buildEndgameTowerRooms(p) {
  return [
    // === ZONE 6: Floors 51–54 (rooms 125–136, Water Depths 💧) ===
    ['abyss_crawler', 'hydra_serpent'],
    p([['abyss_crawler', 'abyss_crawler'], ['hydra_serpent', 'hydra_serpent']]),
    ['leviathan_tide'], // 51-3 boss
    ['abyss_crawler', 'hydra_serpent', 'abyss_crawler'],
    p([['hydra_serpent', 'hydra_serpent', 'abyss_crawler'], ['abyss_crawler', 'hydra_serpent']]),
    ['leviathan_tide', 'abyss_crawler'], // 52-3 boss
    ['hydra_serpent', 'abyss_crawler', 'hydra_serpent'],
    p([['abyss_crawler', 'hydra_serpent', 'hydra_serpent'], ['hydra_serpent', 'abyss_crawler']]),
    ['leviathan_tide', 'hydra_serpent'], // 53-3 boss
    ['abyss_crawler', 'hydra_serpent', 'abyss_crawler', 'hydra_serpent'],
    p([['abyss_crawler', 'abyss_crawler', 'hydra_serpent'], ['hydra_serpent', 'hydra_serpent', 'abyss_crawler']]),
    ['leviathan_tide', 'abyss_crawler', 'hydra_serpent'], // 54-3 boss

    // === ZONE 6: Floors 56–59 (rooms 137–148, Magma Core 🔥) ===
    ['magma_tortoise', 'cinder_drake'],
    p([['magma_tortoise', 'magma_tortoise'], ['cinder_drake', 'cinder_drake']]),
    ['volcano_colossus'], // 56-3 boss (sub-boss form)
    ['magma_tortoise', 'cinder_drake', 'cinder_drake'],
    p([['magma_tortoise', 'cinder_drake', 'magma_tortoise'], ['cinder_drake', 'magma_tortoise']]),
    ['volcano_colossus', 'cinder_drake'], // 57-3 boss
    ['cinder_drake', 'magma_tortoise', 'cinder_drake'],
    p([['magma_tortoise', 'magma_tortoise', 'cinder_drake'], ['cinder_drake', 'cinder_drake', 'magma_tortoise']]),
    ['volcano_colossus', 'magma_tortoise'], // 58-3 boss
    ['magma_tortoise', 'cinder_drake', 'magma_tortoise', 'cinder_drake'],
    p([['cinder_drake', 'magma_tortoise', 'cinder_drake'], ['magma_tortoise', 'cinder_drake', 'magma_tortoise']]),
    ['volcano_colossus', 'magma_tortoise', 'cinder_drake'], // 59-3 boss

    // Floor 60★ Major Boss (room 149)
    ['volcano_colossus', 'magma_tortoise', 'cinder_drake', 'magma_tortoise'],

    // === ZONE 7: Floors 61–64 (rooms 150–161, Gale Peaks 💨) ===
    ['gale_harpy', 'cloud_elemental'],
    p([['gale_harpy', 'gale_harpy'], ['cloud_elemental', 'cloud_elemental']]),
    ['storm_roc'], // 61-3 boss
    ['gale_harpy', 'cloud_elemental', 'gale_harpy'],
    p([['cloud_elemental', 'gale_harpy', 'cloud_elemental'], ['gale_harpy', 'cloud_elemental']]),
    ['storm_roc', 'gale_harpy'], // 62-3 boss
    ['cloud_elemental', 'gale_harpy', 'cloud_elemental'],
    p([['gale_harpy', 'gale_harpy', 'cloud_elemental'], ['cloud_elemental', 'cloud_elemental', 'gale_harpy']]),
    ['storm_roc', 'cloud_elemental'], // 63-3 boss
    ['gale_harpy', 'cloud_elemental', 'gale_harpy', 'cloud_elemental'],
    p([['gale_harpy', 'cloud_elemental', 'gale_harpy'], ['cloud_elemental', 'gale_harpy', 'cloud_elemental']]),
    ['storm_roc', 'gale_harpy', 'cloud_elemental'], // 64-3 boss

    // === ZONE 7: Floors 66–69 (rooms 162–173, Thunder Wastes ⚡) ===
    ['sand_stalker', 'spark_wraith'],
    p([['sand_stalker', 'sand_stalker'], ['spark_wraith', 'spark_wraith']]),
    ['thunder_drake_emperor'], // 66-3 boss (sub-boss form)
    ['sand_stalker', 'spark_wraith', 'sand_stalker'],
    p([['spark_wraith', 'sand_stalker', 'spark_wraith'], ['sand_stalker', 'spark_wraith']]),
    ['thunder_drake_emperor', 'sand_stalker'], // 67-3 boss
    ['spark_wraith', 'sand_stalker', 'spark_wraith'],
    p([['sand_stalker', 'sand_stalker', 'spark_wraith'], ['spark_wraith', 'spark_wraith', 'sand_stalker']]),
    ['thunder_drake_emperor', 'spark_wraith'], // 68-3 boss
    ['sand_stalker', 'spark_wraith', 'sand_stalker', 'spark_wraith'],
    p([['sand_stalker', 'spark_wraith', 'sand_stalker'], ['spark_wraith', 'sand_stalker', 'spark_wraith']]),
    ['thunder_drake_emperor', 'sand_stalker', 'spark_wraith'], // 69-3 boss

    // Floor 70★ Major Boss (room 174)
    ['thunder_drake_emperor', 'sand_stalker', 'spark_wraith', 'sand_stalker'],

    // === ZONE 8: Floors 71–74 (rooms 175–186, Glacial Permafrost ❄️) ===
    ['frost_crystal_golem', 'blizzard_wolf'],
    p([['frost_crystal_golem', 'frost_crystal_golem'], ['blizzard_wolf', 'blizzard_wolf']]),
    ['glacial_hydra'], // 71-3 boss
    ['frost_crystal_golem', 'blizzard_wolf', 'frost_crystal_golem'],
    p([['blizzard_wolf', 'frost_crystal_golem', 'blizzard_wolf'], ['frost_crystal_golem', 'blizzard_wolf']]),
    ['glacial_hydra', 'frost_crystal_golem'], // 72-3 boss
    ['blizzard_wolf', 'frost_crystal_golem', 'blizzard_wolf'],
    p([['frost_crystal_golem', 'frost_crystal_golem', 'blizzard_wolf'], ['blizzard_wolf', 'blizzard_wolf', 'frost_crystal_golem']]),
    ['glacial_hydra', 'blizzard_wolf'], // 73-3 boss
    ['frost_crystal_golem', 'blizzard_wolf', 'frost_crystal_golem', 'blizzard_wolf'],
    p([['frost_crystal_golem', 'blizzard_wolf', 'frost_crystal_golem'], ['blizzard_wolf', 'frost_crystal_golem', 'blizzard_wolf']]),
    ['glacial_hydra', 'frost_crystal_golem', 'blizzard_wolf'], // 74-3 boss

    // === ZONE 8: Floors 76–79 (rooms 187–198, Toxic Earth 🪨) ===
    ['venom_spore_beast', 'crag_titan_sentinel'],
    p([['venom_spore_beast', 'venom_spore_beast'], ['crag_titan_sentinel', 'crag_titan_sentinel']]),
    ['ancient_chitin_behemoth'], // 76-3 boss (sub-boss form)
    ['venom_spore_beast', 'crag_titan_sentinel', 'venom_spore_beast'],
    p([['crag_titan_sentinel', 'venom_spore_beast', 'crag_titan_sentinel'], ['venom_spore_beast', 'crag_titan_sentinel']]),
    ['ancient_chitin_behemoth', 'venom_spore_beast'], // 77-3 boss
    ['crag_titan_sentinel', 'venom_spore_beast', 'crag_titan_sentinel'],
    p([['venom_spore_beast', 'venom_spore_beast', 'crag_titan_sentinel'], ['crag_titan_sentinel', 'crag_titan_sentinel', 'venom_spore_beast']]),
    ['ancient_chitin_behemoth', 'crag_titan_sentinel'], // 78-3 boss
    ['venom_spore_beast', 'crag_titan_sentinel', 'venom_spore_beast', 'crag_titan_sentinel'],
    p([['venom_spore_beast', 'crag_titan_sentinel', 'venom_spore_beast'], ['crag_titan_sentinel', 'venom_spore_beast', 'crag_titan_sentinel']]),
    ['ancient_chitin_behemoth', 'venom_spore_beast', 'crag_titan_sentinel'], // 79-3 boss

    // Floor 80★ Major Boss (room 199): 4 Kraken Tentacles -> True Abyssal Kraken Phase 2
    ['kraken_ward_tentacle', 'kraken_heal_tentacle', 'kraken_ink_tentacle', 'kraken_crush_tentacle'],

    // === ZONE 9: Floors 81–84 (rooms 200–211, Solar Citadel 🔥) ===
    ['solar_sentinel', 'radiant_phoenix'],
    p([['solar_sentinel', 'solar_sentinel'], ['radiant_phoenix', 'radiant_phoenix']]),
    ['sun_archon'], // 81-3 boss
    ['solar_sentinel', 'radiant_phoenix', 'solar_sentinel'],
    p([['radiant_phoenix', 'solar_sentinel', 'radiant_phoenix'], ['solar_sentinel', 'radiant_phoenix']]),
    ['sun_archon', 'solar_sentinel'], // 82-3 boss
    ['radiant_phoenix', 'solar_sentinel', 'radiant_phoenix'],
    p([['solar_sentinel', 'solar_sentinel', 'radiant_phoenix'], ['radiant_phoenix', 'radiant_phoenix', 'solar_sentinel']]),
    ['sun_archon', 'radiant_phoenix'], // 83-3 boss
    ['solar_sentinel', 'radiant_phoenix', 'solar_sentinel', 'radiant_phoenix'],
    p([['solar_sentinel', 'radiant_phoenix', 'solar_sentinel'], ['radiant_phoenix', 'solar_sentinel', 'radiant_phoenix']]),
    ['sun_archon', 'solar_sentinel', 'radiant_phoenix'], // 84-3 boss

    // === ZONE 9: Floors 86–89 (rooms 212–223, Abyssal Necropolis 🌌) ===
    ['dread_reaper', 'void_devourer'],
    p([['dread_reaper', 'dread_reaper'], ['void_devourer', 'void_devourer']]),
    ['nether_dread_lord'], // 86-3 boss (sub-boss form)
    ['dread_reaper', 'void_devourer', 'dread_reaper'],
    p([['void_devourer', 'dread_reaper', 'void_devourer'], ['dread_reaper', 'void_devourer']]),
    ['nether_dread_lord', 'dread_reaper'], // 87-3 boss
    ['void_devourer', 'dread_reaper', 'void_devourer'],
    p([['dread_reaper', 'dread_reaper', 'void_devourer'], ['void_devourer', 'void_devourer', 'dread_reaper']]),
    ['nether_dread_lord', 'void_devourer'], // 88-3 boss
    ['dread_reaper', 'void_devourer', 'dread_reaper', 'void_devourer'],
    p([['dread_reaper', 'void_devourer', 'dread_reaper'], ['void_devourer', 'dread_reaper', 'void_devourer']]),
    ['nether_dread_lord', 'dread_reaper', 'void_devourer'], // 89-3 boss

    // Floor 90★ Major Boss (room 224): Nether Dread Lord + Tri-Pillar Pact
    ['nether_dread_lord', 'nether_leech_pillar', 'nether_curse_pillar', 'nether_doom_pillar'],

    // === ZONE 10: Floors 91–94 (rooms 225–236, Cosmic Chaos 🌌) ===
    ['chaos_weaver', 'astral_chimera'],
    p([['chaos_weaver', 'chaos_weaver'], ['astral_chimera', 'astral_chimera']]),
    ['primordial_avatar'], // 91-3 boss
    ['chaos_weaver', 'astral_chimera', 'chaos_weaver'],
    p([['astral_chimera', 'chaos_weaver', 'astral_chimera'], ['chaos_weaver', 'astral_chimera']]),
    ['primordial_avatar', 'chaos_weaver'], // 92-3 boss
    ['astral_chimera', 'chaos_weaver', 'astral_chimera'],
    p([['chaos_weaver', 'chaos_weaver', 'astral_chimera'], ['astral_chimera', 'astral_chimera', 'chaos_weaver']]),
    ['primordial_avatar', 'astral_chimera'], // 93-3 boss
    ['chaos_weaver', 'astral_chimera', 'chaos_weaver', 'astral_chimera'],
    p([['chaos_weaver', 'astral_chimera', 'chaos_weaver'], ['astral_chimera', 'chaos_weaver', 'astral_chimera']]),
    ['primordial_avatar', 'chaos_weaver', 'astral_chimera'], // 94-3 boss

    // === ZONE 10: Floors 96–99 (rooms 237–248, Celestial Summit 🌌) ===
    ['zenith_templar', 'chronos_keeper'],
    p([['zenith_templar', 'zenith_templar'], ['chronos_keeper', 'chronos_keeper']]),
    ['eternity_overlord'], // 96-3 boss (avatar form)
    ['zenith_templar', 'chronos_keeper', 'zenith_templar'],
    p([['chronos_keeper', 'zenith_templar', 'chronos_keeper'], ['zenith_templar', 'chronos_keeper']]),
    ['eternity_overlord', 'zenith_templar'], // 97-3 boss
    ['chronos_keeper', 'zenith_templar', 'chronos_keeper'],
    p([['zenith_templar', 'zenith_templar', 'chronos_keeper'], ['chronos_keeper', 'chronos_keeper', 'zenith_templar']]),
    ['eternity_overlord', 'chronos_keeper'], // 98-3 boss
    ['zenith_templar', 'chronos_keeper', 'zenith_templar', 'chronos_keeper'],
    p([['zenith_templar', 'chronos_keeper', 'zenith_templar'], ['chronos_keeper', 'zenith_templar', 'chronos_keeper']]),
    ['eternity_overlord', 'zenith_templar', 'chronos_keeper'], // 99-3 boss

    // Floor 100★★★ Ultimate Endgame Final Boss (room 249)
    ['eternity_overlord', 'zenith_templar', 'chronos_keeper', 'chaos_weaver'],
  ];
}
