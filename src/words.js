import { shieldLayers } from './shields.js';

export const RARITIES = Object.freeze({
  common: 'ธรรมดา',
  rare: 'หายาก',
  special: 'พิเศษ',
  epic: 'มหากาพย์',
  legendary: 'ตำนาน',
});

export const lightDamagePenalty = (level = 0) => 25 - 2 * level;

export const CREATURE_STATS = Object.freeze({
  // 10 Common (1-2 MP)
  dog: { name: 'สุนัข', rarity: 'common', cost: 1, baseHp: 14, baseCounter: 4, baseStrike: 12, growthHp: 1.5, growthDmg: 1.0, glyph: '🐕', description: 'หมัดประสานเจาะเกราะ 2 · +7 จั่วเมื่อลงสนาม · +10 ตีซ้ำแรง 50%', formula: '1 MP · สถิต 14 HP / สวน 4 / ตีตาม 12' },
  bird: { name: 'นก', rarity: 'common', cost: 1, baseHp: 12, baseCounter: 3, baseStrike: 10, growthHp: 1.4, growthDmg: 0.9, glyph: '🦅', description: 'หมัดประสานข้ามม่าน · โอกาสหลบ 20% จนกว่าจะหลบสำเร็จหนึ่งครั้ง', formula: '1 MP · สถิต 12 HP / สวน 3 / ตีตาม 10' },
  cat: { name: 'แมว', rarity: 'common', cost: 1, baseHp: 14, baseCounter: 4, baseStrike: 11, growthHp: 1.5, growthDmg: 1.0, glyph: '🐈', description: 'หมัดประสานคริติคอล ×1.5 เมื่อเป้าติดสถานะลบ', formula: '1 MP · สถิต 14 HP / สวน 4 / ตีตาม 11' },
  snake: { name: 'งู', rarity: 'common', cost: 1, baseHp: 13, baseCounter: 5, baseStrike: 12, growthHp: 1.4, growthDmg: 1.1, glyph: '🐍', description: 'สวนกลับโดนเป้าแล้วกัดซ้ำ 4 ดาเมจข้ามเกราะและม่าน', formula: '1 MP · สถิต 13 HP / สวน 5 / ตีตาม 12' },
  slime: { name: 'สไลม์', rarity: 'common', cost: 2, baseHp: 18, baseCounter: 3, baseStrike: 10, growthHp: 2.0, growthDmg: 0.8, glyph: '🫧', description: 'เมื่อแตก ตัวที่โจมตีติดหนาว 4', formula: '2 MP · สถิต 18 HP / สวน 3 / ตีตาม 10' },
  bat: { name: 'ค้างคาว', rarity: 'common', cost: 1, baseHp: 11, baseCounter: 4, baseStrike: 10, growthHp: 1.3, growthDmg: 1.0, glyph: '🦇', description: 'เมื่อสวนกลับโดนเป้าหมาย ฟื้นผู้เล่น 2 HP', formula: '1 MP · สถิต 11 HP / สวน 4 / ตีตาม 10' },
  turtle: { name: 'เต่า', rarity: 'common', cost: 2, baseHp: 20, baseCounter: 3, baseStrike: 8, armor: 1, growthHp: 2.2, growthDmg: 0.7, glyph: '🐢', description: 'ลงสนามพร้อมโล่ผู้เล่น 6 + ระดับตีบวก · เมื่อแตกมอบโล่ 8 หน่วย', formula: '2 MP · สถิต 20 HP / เกราะ 1 / สวน 3' },
  frog: { name: 'กบ', rarity: 'common', cost: 1, baseHp: 13, baseCounter: 4, baseStrike: 11, growthHp: 1.4, growthDmg: 1.0, glyph: '🐸', description: 'สวนกลับทำให้เป้าเปียก · หมัดประสานเจาะเกราะ 2', formula: '1 MP · สถิต 13 HP / สวน 4 / ตีตาม 11' },
  spider: { name: 'แมงมุม', rarity: 'common', cost: 1, baseHp: 13, baseCounter: 4, baseStrike: 12, growthHp: 1.4, growthDmg: 1.1, glyph: '🕷️', description: 'สวนกลับทำให้เป้าติดหนาว 3', formula: '1 MP · สถิต 13 HP / สวน 4 / ตีตาม 12' },
  rat: { name: 'หนู', rarity: 'common', cost: 1, baseHp: 12, baseCounter: 4, baseStrike: 12, growthHp: 1.3, growthDmg: 1.1, glyph: '🐀', description: 'สวนกลับทุบเกราะถาวร 1 · เมื่อแตกตัดฮีลตัวที่โจมตี 50%', formula: '1 MP · สถิต 12 HP / สวน 4 / ตีตาม 12' },

  // 7 Rare (2-3 MP)
  wolf: { name: 'หมาป่า', rarity: 'rare', cost: 2, baseHp: 24, baseCounter: 8, baseStrike: 20, growthHp: 2.2, growthDmg: 1.4, glyph: '🐺', description: 'สวนกลับวางเผา 4 · เมื่อแตกคำรามลดแรงโจมตีตัวที่โจมตี', formula: '2 MP · สถิต 24 HP / สวน 8 / ตีตาม 20' },
  bear: { name: 'หมี', rarity: 'rare', cost: 3, baseHp: 28, baseCounter: 8, baseStrike: 20, armor: 1, growthHp: 2.8, growthDmg: 1.6, glyph: '🐻', description: 'สวนกลับผลักศัตรู · หมัดประสานทุบเกราะถาวร 2', formula: '3 MP · สถิต 28 HP / เกราะ 1 / สวน 8' },
  eagle: { name: 'อินทรี', rarity: 'rare', cost: 2, baseHp: 22, baseCounter: 7, baseStrike: 20, growthHp: 2.0, growthDmg: 1.5, glyph: '🦅', description: 'สวนกลับข้ามม่าน · หมัดประสานกระจายดาเมจ 35% ไปช่องติดกัน', formula: '2 MP · สถิต 22 HP / สวน 7 / ตีตาม 20' },
  boar: { name: 'หมูป่า', rarity: 'rare', cost: 2, baseHp: 25, baseCounter: 8, baseStrike: 20, growthHp: 2.2, growthDmg: 1.6, glyph: '🐗', description: 'สวนกลับเจาะเกราะ 4 · หมัดประสานข้ามเกราะ', formula: '2 MP · สถิต 25 HP / สวน 8 / ตีตาม 20' },
  croc: { name: 'จระเข้', rarity: 'rare', cost: 3, baseHp: 26, baseCounter: 8, baseStrike: 22, armor: 1, growthHp: 2.4, growthDmg: 1.6, glyph: '🐊', description: 'หนังหนาลดดาเมจรับอีก 2 · หมัดประสานแรง ×1.5 ใส่เป้าเปียก', formula: '3 MP · สถิต 26 HP / เกราะ 1 / สวน 8' },
  skeleton: { name: 'โครงกระดูก', rarity: 'rare', cost: 2, baseHp: 20, baseCounter: 6, baseStrike: 18, growthHp: 2.0, growthDmg: 1.7, glyph: '💀', description: 'สวนกลับเจาะเกราะ 3 · เมื่อแตกยิงเศษกระดูก 14 ข้ามเกราะและม่าน', formula: '2 MP · สถิต 20 HP / สวน 6 / ตีตาม 18' },
  hornet: { name: 'ผึ้งยักษ์', rarity: 'rare', cost: 2, baseHp: 18, baseCounter: 6, baseStrike: 22, growthHp: 1.8, growthDmg: 1.7, glyph: '🐝', description: 'สวนกลับโดนเป้าแล้วต่อพิษ 6 ข้ามเกราะและม่าน · หมัดประสานข้ามเกราะ', formula: '2 MP · สถิต 18 HP / สวน 6 / ตีตาม 22' },

  // 5 Special (4-5 MP)
  golem: { name: 'โกเลม', rarity: 'special', cost: 5, baseHp: 30, baseCounter: 10, baseStrike: 26, armor: 2, growthHp: 3.0, growthDmg: 1.8, glyph: '🗿', description: 'หมัดประสานทุบเกราะถาวร 2 · ไฟระเบิดแรงขึ้น · +10 ทลายเกราะและสตั๊น', formula: '5 MP · สถิต 30 HP / เกราะ 2 / สวน 10' },
  lion: { name: 'สิงโต', rarity: 'special', cost: 4, baseHp: 28, baseCounter: 10, baseStrike: 26, growthHp: 2.6, growthDmg: 2.0, glyph: '🦁', description: 'แผงคอลดดาเมจรับ 3 · หมัดประสานคริติคอล ×1.5', formula: '4 MP · สถิต 28 HP / สวน 10 / ตีตาม 26' },
  siren: { name: 'ไซเรน', rarity: 'special', cost: 4, baseHp: 24, baseCounter: 8, baseStrike: 22, ward: 1, growthHp: 2.2, growthDmg: 1.6, glyph: '🧜‍♀️', description: 'ม่านพื้นฐาน 1 · สวนกลับทำให้เป้าเปียก · หมัดประสานสลายม่านเพิ่ม 1 ชั้น', formula: '4 MP · สถิต 24 HP / ม่าน 1 / สวน 8' },
  gargoyle: { name: 'การ์กอยล์', rarity: 'special', cost: 5, baseHp: 32, baseCounter: 10, baseStrike: 24, armor: 3, aoeIntercept: true, growthHp: 3.0, growthDmg: 1.9, glyph: '🦇', description: 'สกัด AoE แทนผู้เล่น ส่วนที่เกิน HP ทะลุถึงผู้เล่น', formula: '5 MP · สถิต 32 HP / เกราะ 3 / สวน 10' },
  sprite: { name: 'ภูตพราย', rarity: 'special', cost: 4, baseHp: 22, baseCounter: 6, baseStrike: 20, growthHp: 2.0, growthDmg: 1.5, glyph: '🧚', description: 'ลงสนามคืน 2 MP และจั่ว 1 ใบ · เมื่อแตกฟื้นผู้เล่น 12 HP', formula: '4 MP · สถิต 22 HP / สวน 6 / ตีตาม 20' },

  // 3 Epic (6-7 MP)
  hydra: { name: 'ไฮดรา', rarity: 'epic', cost: 6, baseHp: 45, baseCounter: 14, baseStrike: 35, growthHp: 4.0, growthDmg: 2.5, glyph: '🐉', description: 'ฟื้น 6 HP ก่อนเทิร์นถัดไป · สวนกับหมัดประสานโจมตีช่องติดกัน', formula: '6 MP · สถิต 45 HP / สวน 14 / ตีตาม 35' },
  behemoth: { name: 'เบฮีมอธ', rarity: 'epic', cost: 7, baseHp: 55, baseCounter: 16, baseStrike: 40, armor: 4, aoeIntercept: true, growthHp: 5.0, growthDmg: 3.0, glyph: '🦏', description: 'สกัด AoE แทนผู้เล่น · สวนกลับทุบเกราะศัตรูทุกตัว 2', formula: '7 MP · สถิต 55 HP / เกราะ 4 / สวน 16' },
  kraken: { name: 'คราเคน', rarity: 'epic', cost: 6, baseHp: 50, baseCounter: 15, baseStrike: 38, growthHp: 4.5, growthDmg: 2.8, glyph: '🐙', description: 'สวนกลับทำให้เป้าติดหนาว 6 · หมัดประสานสลายม่านเพิ่ม 1 ชั้น', formula: '6 MP · สถิต 50 HP / สวน 15 / ตีตาม 38' },

  // 2 Legendary (8-9 MP)
  dragon: { name: 'มังกร', rarity: 'legendary', cost: 8, baseHp: 60, baseCounter: 20, baseStrike: 45, armor: 3, ward: 1, growthHp: 6.0, growthDmg: 4.0, glyph: '🐲', description: 'ม่านพื้นฐาน 1 · +7 สะท้อนดาเมจเมื่อเสีย HP · +10 หมัดประสานข้ามเกราะและม่าน', formula: '8 MP · สถิต 60 HP / เกราะ 3 / ม่าน 1 / สวน 20' },
  phoenix: { name: 'ฟีนิกซ์', rarity: 'legendary', cost: 9, baseHp: 50, baseCounter: 18, baseStrike: 42, ward: 2, growthHp: 5.0, growthDmg: 3.5, glyph: '🪶', description: 'ม่านพื้นฐาน 2 · +7 เกิดจากไข่ได้ครั้งเดียว · +10 สละชีพชุบผู้เล่นเต็ม HP และ MP', formula: '9 MP · สถิต 50 HP / ม่าน 2 / สวน 18' },
});

export const CREATURE_WORDS = Object.freeze(Object.keys(CREATURE_STATS));

export const WORDS = Object.freeze({
  shot: { label: 'ลูก', glyph: '●', description: 'ยิงกระสุนใส่ศัตรูที่เลือก ต่อกับธาตุหรือ “ระเบิด” ได้', formula: '1 มานา + ค่าธาตุ' },
  spear: { label: 'หอก', glyph: '➶', description: 'แทงทะลุ 2 ช่อง · เป้าหลักรับพลัง 80% และตัวข้างหลังรับ 50% (ม่านกันแยกแต่ละตัว)', formula: '1 มานา + ค่าธาตุ · เป้าหลัก 80% / ตัวหลัง 50%' },
  axe: { label: 'ขวาน', glyph: '⚒', description: 'จามเป้าเดียวด้วยพลัง 80% ของลูก ข้ามเกราะทั้งหมด แต่ม่านยังกันได้', formula: '1 มานา + ค่าธาตุ · พลัง 80% · ข้ามเกราะ' },
  light: { label: 'เบา', glyph: '⌁', description: 'วางท้ายรูปทรงโจมตีและธาตุหนึ่งคำ ลดค่าร่าย 1 มานา (ขั้นต่ำ 1) แลกกับพลังโจมตีลดลง 25% ก่อนคิดเกราะ ตีบวกช่วยลดโทษนี้', formula: 'รูปทรง ธาตุ เบา · −1 มานา · พลัง −25%' },
  delay: { label: 'หน่วง', glyph: '⌛', cost: 2, shieldHp: 4, description: 'วางหน้า “โล่” แล้วรอดจนถึงต้นเทิร์นหน้าเพื่อกางโล่ 4 หน่วยหนึ่งชั้น อยู่สองเทิร์นนับจากตอนกาง', formula: 'หน่วง โล่ · 2 มานา · เทิร์นหน้ากางโล่ 4' },
  fire: { label: 'ไฟ', glyph: '♨', damage: 10, cost: 2, description: 'ทำความเสียหายทันที', formula: 'พลัง 10 · 2 มานา' },
  ice: { label: 'น้ำแข็ง', glyph: '❄', damage: 6, cost: 2, description: 'ลดพลังโจมตีครั้งถัดไป 4 ต่อครั้งที่โดน', formula: 'พลัง 6 · 2 มานา' },
  lightning: { rarity: 'common', label: 'สายฟ้า', glyph: 'ϟ', damage: 8, cost: 2, description: 'ข้ามเกราะ 2 หน่วย', formula: 'พลัง 8 · 2 มานา' },
  earth: { label: 'ดิน', glyph: '◆', damage: 7, cost: 2, description: 'เพิ่มเกราะชั่วคราว 2 และทำลายเกราะเป้า 1 ถาวร', formula: 'พลัง 7 · 2 มานา' },
  water: { label: 'น้ำ', glyph: '≈', damage: 6, cost: 2, description: 'ฟื้นพลังชีวิต 2 HP และทำให้เป้าเปียกถึงจบเทิร์นถัดไป · สายฟ้าแรงขึ้น +2 และหิมะแช่แข็งได้', formula: 'พลัง 6 · 2 มานา' },
  wind: { label: 'ลม', glyph: '≋', damage: 7, cost: 2, description: 'ผลักศัตรูที่โดนถอยหนึ่งช่องถ้าช่องถัดไปว่าง หากชนศัตรูอีกตัวจะกระแทกทะลุเกราะ 3 ทั้งสองตัว (ชนขอบ 3)', formula: 'พลัง 7 · 2 มานา' },
  akki: { rarity: 'special', label: 'อัคคี', glyph: '♨', damage: 20, cost: 5, description: 'ไฟขั้นสอง · เป้าที่โดนรับฮีลครึ่งเดียวจนจบเทิร์นถัดไป', formula: 'พลัง 20 · 5 มานา' },
  heman: { rarity: 'special', label: 'เหมันต์', glyph: '❄', damage: 12, cost: 5, description: 'น้ำแข็งขั้นสอง · หนาว 4 ส่งผลต่อการโจมตีจริงสองครั้ง', formula: 'พลัง 12 · 5 มานา' },
  asani: { rarity: 'special', label: 'อัสนี', glyph: 'ϟ', damage: 16, cost: 5, description: 'สายฟ้าขั้นสอง · ข้ามเกราะ 2 และชิ่งหาเป้าข้างเคียงหนึ่งตัวด้วยพลังครึ่งหนึ่ง', formula: 'พลัง 16 · 5 มานา' },
  pathaphi: { rarity: 'special', label: 'ปฐพี', glyph: '◆', damage: 14, cost: 5, description: 'ดินขั้นสอง · เพิ่มเกราะชั่วคราว 4 และทำลายเกราะเป้า 2 ถาวร', formula: 'พลัง 14 · 5 มานา' },
  wari: { rarity: 'special', label: 'วารี', glyph: '≈', damage: 12, cost: 5, description: 'น้ำขั้นสอง · ฟื้นพลังชีวิต 4 HP และทำให้เป้ารวมช่องข้างเคียงเปียกถึงจบเทิร์นถัดไป', formula: 'พลัง 12 · 5 มานา' },
  vayu: { rarity: 'special', label: 'วายุ', glyph: '≋', damage: 14, cost: 5, description: 'ลมขั้นสอง · ผลักศัตรูที่โดนถอยหนึ่งช่องถ้าช่องถัดไปว่าง หากชนศัตรูอีกตัวจะกระแทกทะลุเกราะ 6 ทั้งสองตัว (ชนขอบ 6)', formula: 'พลัง 14 · 5 มานา' },
  magma: { rarity: 'epic', label: 'แมกม่า', glyph: '♨', damage: 22, cost: 7, description: 'ดิน + ไฟ · ทิ้งแอ่งตรงจุดกระทบ หลังแอ็กชันผู้เล่นเทิร์นถัดไป ปะทุใส่ตัวที่ยืนตรงนั้น 6 และลดเกราะ 2 ถาวร', formula: 'พลัง 22 · 7 มานา' },
  mudmire: { rarity: 'epic', label: 'บึงโคลน', glyph: '◆', damage: 18, cost: 7, description: 'ดิน + น้ำ · สร้างบึงโคลนตรึงเป้าหมาย ทำให้เปียกและลดพลังโจมตี 3 จนจบเทิร์นถัดไป', formula: 'พลัง 18 · 7 มานา' },
  dust: { rarity: 'epic', label: 'ธุลี', glyph: '≋', damage: 18, cost: 7, description: 'ดิน + ลม · ทำลายเกราะเป้า 1 ถาวร และผลักเป้าถอยหนึ่งช่อง (ชนศัตรูอีกตัวกระแทกทะลุเกราะ 6 ทั้งสองตัว · ชนขอบ 6)', formula: 'พลัง 18 · 7 มานา' },
  permafrost: { rarity: 'epic', label: 'เยือกศิลา', glyph: '❄', damage: 18, cost: 7, description: 'ดิน + น้ำแข็ง · ทำลายเกราะเป้า 2 ถาวร และเพิ่มเกราะชั่วคราวให้ผู้ร่าย 6', formula: 'พลัง 18 · 7 มานา' },
  magnet: { rarity: 'epic', label: 'แม่เหล็ก', glyph: 'ϟ', damage: 18, cost: 7, description: 'ดิน + สายฟ้า · ข้ามเกราะ 2 และส่งแรงแม่เหล็กดึงศัตรูข้างเคียงเข้ามาชนเป้าหลัก (ชนกันกระแทกทะลุเกราะ 6 ทั้งสองตัว)', formula: 'พลัง 18 · 7 มานา' },
  mist: { rarity: 'epic', label: 'หมอก', glyph: '≋', damage: 18, cost: 7, description: 'น้ำ + ไฟ · ทำให้เป้าเปียกถึงจบเทิร์นถัดไป และบดบังการเล็ง ลดแรงโจมตีครั้งถัดไป 4', formula: 'พลัง 18 · 7 มานา' },
  hail: { rarity: 'epic', label: 'หิมะ', glyph: '❆', damage: 18, cost: 7, description: 'น้ำ + น้ำแข็ง · เป้าแห้งติดหนาว 2 เป้าเปียกเสียสถานะเปียกและข้ามการโจมตีครั้งถัดไป', formula: 'พลัง 18 · 7 มานา' },
  monsoon: { rarity: 'epic', label: 'มรสุม', glyph: '≈', damage: 18, cost: 7, description: 'น้ำ + ลม · ผลักศัตรูทั้งหมด 1 ช่อง (ชนกันกระแทกทะลุเกราะ 6 ทั้งสองตัว) ทำให้เปียก และฟื้นพลังชีวิตผู้ร่าย 4 HP', formula: 'พลัง 18 · 7 มานา' },
  shockstream: { rarity: 'epic', label: 'กระแสช็อต', glyph: 'ϟ', damage: 18, cost: 7, description: 'น้ำ + สายฟ้า · ข้ามเกราะ 2 ช็อตสายฟ้าทะลวงเป้าหมายที่เปียกทั้งหมดในสนาม', formula: 'พลัง 18 · 7 มานา' },
  thunderstorm: { rarity: 'epic', label: 'ฟ้าคะนอง', glyph: 'ϟ', damage: 20, cost: 7, description: 'ลม + สายฟ้า · ข้ามเกราะ 2 ผลักเป้าถอยหนึ่งช่อง (ชนศัตรูกระแทกทะลุเกราะ 6 ทั้งสองตัว) แล้วชิ่งครึ่งพลังหาเป้าข้างตำแหน่งใหม่', formula: 'พลัง 20 · 7 มานา' },
  heatwave: { rarity: 'epic', label: 'ระอุ', glyph: '♨', damage: 22, cost: 7, description: 'ลม + ไฟ · ผลักเป้าถอยหนึ่งช่อง (ชนศัตรูกระแทกทะลุเกราะ 6 ทั้งสองตัว) และเผา 4 หน่วยกระจายใส่ศัตรูช่องข้างเคียง', formula: 'พลัง 22 · 7 มานา' },
  chillgale: { rarity: 'epic', label: 'ไอหนาว', glyph: '❄', damage: 18, cost: 7, description: 'ลม + น้ำแข็ง · ผลักเป้าถอยหนึ่งช่อง (ชนศัตรูกระแทกทะลุเกราะ 6 ทั้งสองตัว) และกระจายละอองหนาว 4 ลดการโจมตีสองครั้ง', formula: 'พลัง 18 · 7 มานา' },
  plasma: { rarity: 'epic', label: 'พลาสมา', glyph: '✦', damage: 24, cost: 7, description: 'ไฟ + สายฟ้า · ระเบิดพลังงานความร้อนสูง ข้ามเกราะ 2 ดาเมจเดี่ยวรุนแรงสูงสุด', formula: 'พลัง 24 · 7 มานา' },
  scald: { rarity: 'epic', label: 'ไอเดือด', glyph: '♨', damage: 20, cost: 7, description: 'ไฟ + น้ำแข็ง · สลับอุณหภูมิฉับพลัน ทำลายเกราะเป้า 2 ถาวร และทำให้ชะงัก', formula: 'พลัง 20 · 7 มานา' },
  frostvolt: { rarity: 'epic', label: 'ผลึกช็อต', glyph: '❆', damage: 20, cost: 7, description: 'น้ำแข็ง + สายฟ้า · ข้ามเกราะ 2 และชิ่งสายฟ้าแช่แข็งใส่เป้าข้างเคียงพร้อมติดหนาว 4', formula: 'พลัง 20 · 7 มานา' },
  pair: { label: 'คู่', glyph: 'Ⅱ', description: 'ร่ายเวทสองครั้ง หรือเชื่อมสองธาตุเป็นเวทเดียว พายุระลอกสองใช้แรง 60%', formula: 'สองครั้งคิดมานา ×2 · พายุ +3 · ผสานลด 1' },
  barrage: { rarity: 'legendary', label: 'กระหน่ำ', glyph: 'Ⅴ', description: 'วางไว้ท้ายสุดของคาถาโจมตีเท่านั้น (ห้ามใช้ร่วมกับคู่/ทำลายล้าง) ปล่อยพลังนั้นซ้ำ 5 ครั้งต่อเนื่อง', formula: 'ท้ายประโยคเท่านั้น · โจมตี 5 ครั้ง · ค่าร่าย ×3.5' },
  blast: { rarity: 'rare', label: 'ระเบิด', glyph: '✹', damage: 6, cost: 4, description: 'วางต้นคาถาหรือต่อหลัง “ลูก” เพื่อยิงกระสุนหัวระเบิด เติมธาตุหรือคู่ได้ ใช้ต่อท้ายเพื่อระเบิดเมื่อโจมตีโดน หรือสั่งระเบิดโล่ไฟที่มีอยู่', formula: 'ร่ายเดี่ยว 4 มานา · ลูกระเบิด +1 · คำต่อท้าย +2 · สั่งระเบิดโล่ 2' },
  devastation: { rarity: 'legendary', label: 'ทำลายล้าง', glyph: '✷', cost: 5, description: 'ใช้เป็นคำสุดท้ายของคาถาโจมตีเท่านั้น เพิ่มแรงโจมตีเป็น 2 เท่าและระเบิดซ้ำหนึ่งครั้งด้วยครึ่งพลังในรัศมี 2 ช่องเมื่อโจมตีโดน', formula: '+5 มานา · พลัง ×2 · ระเบิดรัศมี 2 ช่อง' },
  blackhole: { rarity: 'legendary', label: 'หลุมดำ', glyph: '◉', cost: 20, description: 'เลือกช่องบนสนาม ดูดศัตรูทั้งหมดเข้าหาจุดศูนย์กลาง ชนกันทำดาเมจกระแทก 100 ต่อตัว (ทับซ้อนได้) ยุบตัวเทิร์นถัดไป จุดกลาง 300 / รอบข้าง 150 · ข้ามม่านและเกราะทั้งหมด', formula: '20 มานา · กระแทก 100/ตัว · ยุบ 300 / 150 · ข้ามม่าน/เกราะ' },
  death: { rarity: 'legendary', label: 'ตาย', glyph: '†', cost: 10, description: 'ปราบศัตรูธรรมดาหนึ่งตัวทันที (หากใช้กับบอสจะสร้างดาเมจแท้ 100+ ทะลุเกราะและม่าน) ใช้สำเร็จได้ครั้งเดียวต่อศึก แล้วการ์ดจะหายจากมือและกองจั่วจนจบศึก', formula: '10 มานา · ปลิดชีพทันที / บอส 100+ แท้ · ข้ามม่านและเกราะ' },
  timestop: { rarity: 'legendary', label: 'หยุดเวลา', glyph: '◷', cost: 10, description: 'ร่ายเดี่ยวเพื่อข้ามการกระทำของศัตรูทุกตัวหนึ่งรอบ แล้วเริ่มเทิร์นของผู้เล่นทันที ใช้ได้หนึ่งครั้งต่อศึก', formula: '10 มานา · ข้ามรอบศัตรู 1 ครั้ง · ครั้งเดียวต่อศึก' },
  ascension: { rarity: 'legendary', label: 'จุติ', glyph: '✺', cost: 8, description: 'ร่ายเดี่ยว เมื่อรอดถึงเทิร์นถัดไป การ์ดบนมือเป็น +10 ชั่วคราวและร่ายฟรีหนึ่งเทิร์น รวมเอฟเฟกต์รอง ใช้ได้หนึ่งครั้งต่อศึก', formula: '8 มานา · เทิร์นถัดไปการ์ด +10 และร่าย 0 มานา · ครั้งเดียวต่อศึก' },
  meteor: { rarity: 'epic', label: 'อุกกาบาต', glyph: '✹', cost: 9, description: 'อุกกาบาตตกแบบสุ่มตำแหน่ง 3 ครั้ง ทำดาเมจเป้าหลัก 24 และกระจายช่องติดกัน 12 ต่อลูก ข้ามม่านแล้วหักเกราะตามปกติ', formula: '9 มานา · สุ่มตก 3 ครั้ง · หลัก 24 / กระจาย 12 · ข้ามม่าน' },
  veil: { rarity: 'epic', label: 'ม่าน', glyph: '▣', cost: 7, description: 'กางม่านรับความเสียหาย 14 อยู่ถึงจบเทิร์นถัดไป เมื่อการโจมตีทำให้ม่านแตก กันส่วนที่ล้นเพิ่มได้อีกสูงสุด 8', formula: '7 มานา · กัน 14 + กันส่วนล้นสูงสุด 8' },
  shield: { label: 'โล่', glyph: '⬡', description: 'กันความเสียหาย 6 ใช้ส่วนที่เหลือได้อีกหนึ่งเทิร์น', formula: '3 มานา' },
  chakram: { rarity: 'epic', label: 'กรงจักร', glyph: '❂', cost: 3, description: 'ขว้างกรงจักรเจาะเป้าเดี่ยวรุนแรง (พลังธาตุ 180%) ไม่กระจายดาเมจออกนอกหากไม่เสริมวลีอื่น', formula: '3 มานา + ค่าธาตุ · เป้าเดี่ยว 180%' },
  beam: { rarity: 'rare', label: 'ลำแสง', glyph: '━', description: 'โจมตีเป้าหมายเดียวผ่านม่านกระสุน', formula: '2 มานา + ค่าธาตุ' },
  wave: { rarity: 'rare', label: 'คลื่น', glyph: '≈', description: 'โจมตีทุกตัวเท่ากัน ม่านของแต่ละตัวกันได้', formula: '3 มานา + ค่าธาตุ' },
  storm: { rarity: 'epic', label: 'พายุ', glyph: '◉', damage: 12, cost: 5, description: 'เลือกเป้าหลักและโดนช่องติดซ้ายขวา ร่ายเดี่ยวได้ หรือเติมธาตุใดก็ได้เพื่อใช้พลังและผลธาตุ ม่านของแต่ละตัวกันได้', formula: '5 มานา + ค่าธาตุ · พลังเดี่ยว 12/6 · เติมธาตุ 150%/75%' },
  heal: { rarity: 'rare', label: 'ฮีล', glyph: '+', description: 'ร่าย “ฮีล ตัวเอง” เพื่อฟื้น 4 HP ทันที หรือร่าย “โล่ ฮีล” เพื่อป้องกันพร้อมฟื้นเลือด', formula: 'ฮีล ตัวเอง 3 มานา · โล่ ฮีล 5 มานา' },
  self: { label: 'ตัวเอง', glyph: '◇', description: 'ระบุผู้ร่ายเป็นเป้าหมายของฮีล', formula: 'ใช้ต่อท้ายฮีล' },
  empower: { rarity: 'rare', label: 'เสริม', glyph: '▲', cost: 2, description: 'เสริมพลังธาตุที่ร่ายให้ผู้ร่ายเป็นเวลา 3 เทิร์น (+25% / ขั้นสอง +40% / ผสาน +45%) ต่อ “ใหญ่” หรือขึ้นต้น “มหา” ได้', formula: '2 มานา + ค่าธาตุ · บัฟพลังธาตุ 3 เทิร์น' },
  bless: { rarity: 'special', label: 'อวยพร', glyph: '✧', cost: 3, description: 'อวยพรพลังธาตุระดับสูงให้ผู้ร่ายเป็นเวลา 3 เทิร์น (+40% / ขั้นสอง +60% / ผสาน +70%) พร้อมเจาะเกราะ +1 ต่อ “ใหญ่” หรือขึ้นต้น “มหา” ได้', formula: '3 มานา + ค่าธาตุ · บัฟพลังธาตุแรง 3 เทิร์น + เจาะเกราะ' },
  fill: { label: 'เติม', glyph: '◈', cost: 1, description: 'ใช้คู่กับ “เลือด” (3 มานา ฟื้น 7 HP แรงกว่าฮีล) หรือ “มานา” (1 มานา ฟื้น 6 MP) · ต่อท้าย “ใหญ่” ได้เท่านั้น ห้ามใช้ร่วมกับ “มหา”', formula: 'เติม เลือด 3 มานา (7 HP) · เติม มานา 1 มานา (+6 MP)' },
  blood: { label: 'เลือด', glyph: '♥', cost: 2, description: 'ร่ายเดี่ยวไม่ได้ · ใช้ต่อท้าย “เติม” เพื่อฟื้นเลือดแรงกว่าฮีล (7 HP · เติม เลือด ใหญ่ 12 HP)', formula: 'ใช้คู่ “เติม” เท่านั้น · ต่อท้าย “ใหญ่” ได้' },
  mana: { label: 'มานา', glyph: '◆', cost: 0, description: 'ร่ายเดี่ยวไม่ได้ · ใช้ต่อท้าย “เติม” เพื่อฟื้นมานาทันที (+6 MP · เติม มานา ใหญ่ +10 MP)', formula: 'ใช้คู่ “เติม” เท่านั้น · ต่อท้าย “ใหญ่” ได้' },
  burn: { rarity: 'rare', label: 'เผา', glyph: '♨', description: 'เผา 3 ก่อนศัตรูทำแอ็กชันในเทิร์นถัดไป ผลเผาซ้ำรวมกัน', formula: '+1 มานา' },
  freeze: { rarity: 'special', label: 'แช่แข็ง', glyph: '❆', description: 'ต่อท้ายลูกหรือลำแสงตระกูลน้ำแข็ง ให้เป้าข้ามการโจมตีหนึ่งครั้ง', formula: '+3 มานา' },
  push: { rarity: 'rare', label: 'ผลัก', glyph: '›', description: 'ต่อท้ายคาถาโจมตี เลื่อนเป้าถอย 1 ช่อง (ใช้กับธาตุลมผลักไกล 2 ช่อง) หากผลักชนศัตรูอีกตัวจะกระแทกทะลุเกราะ 8 ใส่ทั้งสองตัว (ชนขอบ 4 · แรงขึ้นตามตัวคูณคาถา)', formula: '+1 มานา · ชนศัตรู 8×2 (ทะลุเกราะ) · ชนขอบ 4' },
  pull: { rarity: 'rare', label: 'ดึง', glyph: '‹', description: 'ต่อท้ายคาถาโจมตี ดึงเป้าที่โดนเข้าหาผู้ร่าย 1 ช่อง หากดึงชนศัตรูข้างหน้าจะกระแทกทะลุเกราะ 8 ใส่ทั้งสองตัว (ชนขอบหน้า 4 · แรงขึ้นตามตัวคูณคาถา)', formula: '+1 มานา · ดึงชนศัตรู 8×2 (ทะลุเกราะ) · ชนขอบหน้า 4' },
  pierce: { rarity: 'special', label: 'ทะลวง', glyph: '↠', description: 'ต่อท้ายลูก คลื่น หรือพายุ เพื่อข้ามเกราะเพิ่ม 2 หน่วย ทั้งตอนกระทบและระเบิด', formula: '+1 มานา' },
  large: { rarity: 'rare', label: 'ใหญ่', glyph: '⬢', description: 'เพิ่มพลังลูก 1.5 เท่า เพิ่มโล่เป็น 9 ต่อชั้น หรือเพิ่มฮีลทันทีเป็น 8', formula: '+2 มานา' },
  grand: { rarity: 'special', label: 'มหา', glyph: '✦', description: 'วางหน้าคาถาโจมตีเพื่อเพิ่มแรง มหาระเบิดขยายรัศมี ใช้คู่กับลูก ระเบิด หรือพายุที่มีธาตุเดียวได้ มหาโล่และมหาโล่คู่เติมโล่ต้นเทิร์นถัดไป มหาฮีลฟื้นเลือดต่อเนื่อง', formula: 'โจมตี +3 มานา · มหาลูกคู่ +6 · มหาพายุคู่ +5 · มหาโล่ 6 / คู่ 12 · มหาฮีล 7' },
  seal: { rarity: 'special', label: 'ผนึก', glyph: '⌑', description: 'ต่อท้ายลูกธาตุเพื่อหยุดการฮีล เติมม่าน หรือสลับช่องครั้งถัดไปเมื่อโดนเป้า', formula: '+2 มานา' },
  dispel: { rarity: 'special', label: 'สลาย', glyph: '✧', description: 'ต่อท้ายลูกธาตุเพื่อสลายม่านทั้งหมดก่อนลูกนี้กระทบ', formula: '+2 มานา' },
  brace: { rarity: 'special', label: 'ยืนหยัด', glyph: '▣', description: 'ต่อท้ายโล่เพื่อให้กันเพิ่ม 6 เมื่อรับการโจมตีแรง 10 ขึ้นไปครั้งแรก', formula: 'โล่ ยืนหยัด · 4 มานา' },
  summon: {
    rarity: 'common',
    label: 'อัญเชิญ',
    glyph: '⛧',
    cost: 1,
    role: 'summon',
    description: 'เปิดประตูมิติอัญเชิญสิ่งมีชีวิตมายืนแนวหน้า รับดาเมจเดี่ยวและสวนครั้งแรกที่เสีย HP ถ้ารอดจะตีตามเทิร์นถัดไป ม่านที่สัตว์ตีจะหยุดฟื้น 1 เทิร์น',
    formula: '1 มานา + ค่าสัตว์ + ค่าธาตุ · ทวิเทิร์น',
  },
  ...Object.fromEntries(
    Object.entries(CREATURE_STATS).map(([id, stats]) => [
      id,
      {
        rarity: stats.rarity,
        label: stats.name,
        glyph: stats.glyph,
        cost: stats.cost,
        role: 'creature',
        description: stats.description,
        formula: stats.formula,
      },
    ]),
  ),
});

export const ASCENDED_ELEMENTS = Object.freeze({ akki: 'fire', heman: 'ice', asani: 'lightning' });
export const SECOND_TIER_ELEMENTS = Object.freeze({ ...ASCENDED_ELEMENTS, pathaphi: 'earth', wari: 'water', vayu: 'wind' });
export const FUSED_ELEMENTS = Object.freeze({
  magma: 'fire',
  mudmire: 'earth',
  dust: 'wind',
  permafrost: 'ice',
  magnet: 'lightning',
  mist: 'water',
  hail: 'ice',
  monsoon: 'water',
  shockstream: 'lightning',
  thunderstorm: 'lightning',
  heatwave: 'fire',
  chillgale: 'ice',
  plasma: 'fire',
  scald: 'fire',
  frostvolt: 'lightning',
});

export const FUSION_COMPONENTS = Object.freeze({
  magma: ['earth', 'fire'],
  mudmire: ['earth', 'water'],
  dust: ['earth', 'wind'],
  permafrost: ['earth', 'ice'],
  magnet: ['earth', 'lightning'],
  mist: ['water', 'fire'],
  hail: ['water', 'ice'],
  monsoon: ['water', 'wind'],
  shockstream: ['water', 'lightning'],
  thunderstorm: ['wind', 'lightning'],
  heatwave: ['wind', 'fire'],
  chillgale: ['wind', 'ice'],
  plasma: ['fire', 'lightning'],
  scald: ['fire', 'ice'],
  frostvolt: ['ice', 'lightning'],
});

export const ELEMENT_ADVANTAGE = Object.freeze({
  fire: 'ice',
  ice: 'wind',
  wind: 'earth',
  earth: 'lightning',
  lightning: 'water',
  water: 'fire',
});

export const ELEMENT_VULNERABILITY = Object.freeze({
  ice: 'fire',
  wind: 'ice',
  earth: 'wind',
  lightning: 'earth',
  water: 'lightning',
  fire: 'water',
});

export const ELEMENT_WEAKNESS = ELEMENT_VULNERABILITY;

export const ELEMENT_SECONDARY_VULNERABILITY = Object.freeze({
  fire: 'ice', ice: 'earth', wind: 'lightning', earth: 'water', lightning: 'water', water: 'ice',
});

export const ELEMENT_LABELS = Object.freeze({
  fire: 'ไฟ',
  ice: 'น้ำแข็ง',
  wind: 'ลม',
  earth: 'ดิน',
  lightning: 'สายฟ้า',
  water: 'น้ำ',
});

export const ELEMENT_GLYPHS = Object.freeze({
  fire: '♨',
  ice: '❄',
  wind: '≋',
  earth: '◆',
  lightning: 'ϟ',
  water: '≈',
});

export const ELEMENT_ICONS = Object.freeze({
  fire: '🔥',
  ice: '❄️',
  wind: '💨',
  earth: '🪨',
  lightning: '⚡',
  water: '💧',
});

export function getElementComponents(element) {
  if (!element) return [];
  if (Array.isArray(element)) return [...new Set(element.flatMap(getElementComponents))];
  if (FUSION_COMPONENTS[element]) return FUSION_COMPONENTS[element];
  if (SECOND_TIER_ELEMENTS[element]) return [SECOND_TIER_ELEMENTS[element]];
  if (['fire', 'ice', 'wind', 'earth', 'lightning', 'water'].includes(element)) return [element];
  return [];
}

export function getFusedElementFromComponents(elem1, elem2) {
  if (!elem1 || !elem2 || elem1 === elem2) return null;
  const comps1 = getElementComponents(elem1);
  const comps2 = getElementComponents(elem2);
  const allComps = [...new Set([...comps1, ...comps2])];
  if (allComps.length !== 2) return null;
  for (const [fused, comps] of Object.entries(FUSION_COMPONENTS)) {
    if (comps.includes(allComps[0]) && comps.includes(allComps[1])) return fused;
  }
  return null;
}

export function getWeaknessReaction(element, targetAffinity) {
  if (!targetAffinity || !ELEMENT_VULNERABILITY[targetAffinity]) {
    return { isWeak: false, isResist: false, multiplier: 1, triggerElement: null };
  }
  const components = getElementComponents(element);
  if (!components.length) {
    return { isWeak: false, isResist: false, multiplier: 1, triggerElement: null };
  }
  const weaknessElement = [ELEMENT_VULNERABILITY[targetAffinity], ELEMENT_SECONDARY_VULNERABILITY[targetAffinity]]
    .find(weakness => components.includes(weakness));
  const isWeak = Boolean(weaknessElement);
  if (isWeak) {
    return {
      isWeak: true,
      isResist: false,
      multiplier: 1.25,
      triggerElement: weaknessElement,
    };
  }
  const isResist = components.includes(targetAffinity);
  if (isResist) {
    return {
      isWeak: false,
      isResist: true,
      multiplier: 0.8,
      triggerElement: targetAffinity,
    };
  }
  return { isWeak: false, isResist: false, multiplier: 1, triggerElement: null };
}
export const elementFamily = id => SECOND_TIER_ELEMENTS[id] ?? FUSED_ELEMENTS[id] ?? id;
export function fireShieldLayers(shield, element) {
  const explosive = element === 'akki' ? 'akki-blast' : 'blast';
  return shieldLayers(shield).flatMap((layer, index) =>
    layer.elements?.includes(element) || layer.effect === element || layer.effect === explosive ? [index] : []);
}
export const ELEMENTS = [
  'fire', 'ice', 'lightning', 'earth', 'water', 'wind',
  ...Object.keys(SECOND_TIER_ELEMENTS),
  ...Object.keys(FUSED_ELEMENTS),
];
export const ATTACK_FORMS = ['shot', 'spear', 'axe', 'chakram', 'beam', 'wave', 'storm'];
export const BATTLE_LIMITED_WORDS = ['timestop', 'ascension'];
export const STANDALONE_WORDS = ['blackhole', 'death', 'meteor', 'veil', ...BATTLE_LIMITED_WORDS];
export const ascensionCost = (level = 0) => Math.max(1, WORDS.ascension.cost - level);
const SPELL_STARTS = {
  shot: [...ELEMENTS, 'blast'],
  spear: [...ELEMENTS],
  axe: [...ELEMENTS],
  chakram: [...ELEMENTS],
  beam: [...ELEMENTS, 'pair'],
  wave: [...ELEMENTS, 'pair'],
  storm: ELEMENTS,
  blackhole: ['large', 'devastation'],
  death: [],
  timestop: [],
  ascension: [],
  meteor: ['large', 'pair', 'devastation', 'barrage'],
  veil: ['large', 'pair'],
  shield: [...ELEMENTS, 'pair', 'large', 'heal', 'brace'],
  heal: ['self', 'large', 'pair'],
  delay: ['shield'],
  empower: [...ELEMENTS],
  bless: [...ELEMENTS],
  fill: ['blood', 'mana'],
  blast: ['shield', 'shot', ...ELEMENTS, 'pair', 'large'],
  summon: [...CREATURE_WORDS],
  ...Object.fromEntries(CREATURE_WORDS.map(id => [id, [...ELEMENTS]])),
  grand: [...ATTACK_FORMS, 'blast', 'heal', 'shield', 'veil', 'meteor', 'blackhole', 'empower', 'bless', 'summon'],
};
export const STORM_FORMULAS = [
  ['storm'],
  ...ELEMENTS.flatMap(id => [
    ['storm', id], ['storm', id, 'pair'], ['storm', id, 'large'], ['storm', id, 'large', 'pair'],
    ['storm', id, 'blast'], ['storm', id, 'pierce'], ['storm', id, 'push'],
    ...ELEMENTS.filter(other => other !== id).flatMap(other => [['storm', id, other], ['storm', id, other, 'blast']]),
  ]),
];
export const ADVANCED_FORMULAS = [...Object.keys(SECOND_TIER_ELEMENTS), ...Object.keys(FUSED_ELEMENTS)].flatMap(id => [
  ['shot', id], ['spear', id], ['chakram', id], ['beam', id], ['wave', id],
  ['shot', id, 'pair'], ['spear', id, 'pair'], ['chakram', id, 'pair'],
  ['shield', id], ['shield', id, 'pair'],
  ['empower', id], ['bless', id],
]);
export const START_WORDS = ['shot', 'fire', 'ice', 'pair', 'shield'];
export const LARGE_SHIELD_HP = 9;
export const LARGE_SHOT_FORMULAS = ELEMENTS.flatMap(id => [
  ['shot', id, 'large'],
  ['shot', id, 'large', 'pair'],
  ['spear', id, 'large'],
  ['spear', id, 'large', 'pair'],
]);
export const LARGE_SHIELD_FORMULAS = [
  ['shield', 'large'], ['shield', 'large', 'pair'], ['shield', 'large', 'heal'],
  ...ELEMENTS.flatMap(id => [['shield', id, 'large'], ['shield', id, 'large', 'pair']]),
];
export const HEAL_AND_GRAND_DEFENSE_FORMULAS = [
  ['heal', 'large'], ['heal', 'self', 'large'], ['heal', 'pair'], ['heal', 'self', 'pair'],
  ['fill', 'blood'], ['fill', 'blood', 'large'], ['fill', 'mana'], ['fill', 'mana', 'large'],
  ['grand', 'heal'], ['grand', 'heal', 'self'], ['grand', 'heal', 'large'], ['grand', 'heal', 'self', 'large'],
  ['grand', 'shield'], ['grand', 'shield', 'pair'], ['grand', 'shield', 'large'], ['grand', 'shield', 'brace'],
  ...ELEMENTS.map(id => ['grand', 'shield', id]),
  ...ELEMENTS.flatMap(id => [
    ['empower', id], ['empower', id, 'large'], ['grand', 'empower', id], ['grand', 'empower', id, 'large'],
    ['bless', id], ['bless', id, 'large'], ['grand', 'bless', id], ['grand', 'bless', id, 'large'],
  ]),
  ['grand', 'veil'], ['veil', 'large'], ['veil', 'pair'], ['veil', 'large', 'pair'],
];
export const CROSS_FORM_FORMULAS = ELEMENTS.flatMap(id => [
  ['beam', id, 'pair'], ['beam', id, 'large', 'pair'],
  ['wave', id, 'pair'], ['wave', id, 'large', 'pair'],
  ['wave', id, 'blast'], ['wave', id, 'pierce'],
  ...(elementFamily(id) === 'ice' ? [['beam', id, 'freeze']] : []),
  ['shot', id, 'pull'], ['spear', id, 'pull'], ['beam', id, 'pull'],
]);
export const GRAND_FORMULAS = [
  ['grand', 'storm'], ['grand', 'meteor'], ['grand', 'blackhole'],
  ...ATTACK_FORMS.flatMap(form => ELEMENTS.map(id => ['grand', form, id])),
  ...ELEMENTS.map(id => ['grand', 'spear', id, 'pair']),
  ...ELEMENTS.map(id => ['grand', 'chakram', id, 'pair']),
  ...ELEMENTS.map(id => ['grand', 'storm', id, 'pair']),
  ...ELEMENTS.map(id => ['grand', 'beam', id, 'pair']),
  ...ELEMENTS.map(id => ['grand', 'wave', id, 'pair']),
];

export function parseSpell(wordIds, library = Object.keys(WORDS)) {
  const fail = (index, error) => ({ ok: false, index, error });
  if (!Array.isArray(wordIds)) return fail(0, 'ลำดับคำไม่ถูกต้อง');
  const ids = wordIds.filter(id => id !== null && id !== '');
  if (!ids.length) return fail(0, 'เลือกคำจากคลังเพื่อประกอบคาถา');
  if (ids.length > 4) return fail(4, 'คาถานี้เกินสี่ช่องคำ');
  for (const [index, id] of ids.entries()) {
    if (!Object.hasOwn(WORDS, id)) return fail(index, 'ไม่รู้จักคำนี้');
    if (!library.includes(id)) return fail(index, `ยังไม่มีคำ “${WORDS[id].label}” ในชุดที่พก`);
  }
  const limited = ids.find(id => BATTLE_LIMITED_WORDS.includes(id));
  if (limited) {
    if (ids.length !== 1) return fail(ids[0] === limited ? 1 : ids.indexOf(limited), `ร่าย “${WORDS[limited].label}” เดี่ยวเท่านั้น`);
    const cost = WORDS[limited].cost;
    return { ok: true, spell: { type: 'self', form: limited, cost }, cost, ids, expression: WORDS[limited].label };
  }

  if (ids.includes('delay') && (ids[0] !== 'delay' || ids[1] !== 'shield' || ids.length !== 2)) {
    return fail(ids[0] === 'delay' ? (ids[1] === 'shield' ? 2 : 1) : ids.indexOf('delay'), 'ใช้วลี “หน่วง โล่” สองคำตามลำดับนี้');
  }
  const lightIndex = ids.indexOf('light');
  const lightened = lightIndex !== -1;
  if (lightened && (ids.length !== 3 || lightIndex !== 2 || !ATTACK_FORMS.includes(ids[0]) || !ELEMENTS.includes(ids[1]))) {
    return fail(lightIndex, 'ใช้ “เบา” ต่อท้ายรูปทรงโจมตีและธาตุหนึ่งคำ เช่น หอก ไฟ เบา');
  }
  const suffixIndex = ids.indexOf('devastation');
  const devastating = suffixIndex !== -1;
  if (devastating && suffixIndex !== ids.length - 1) return fail(suffixIndex, 'วาง “ทำลายล้าง” ไว้ท้ายสุดเท่านั้น');
  const barrageIndex = ids.indexOf('barrage');
  const barraging = barrageIndex !== -1;
  if (barraging && barrageIndex !== ids.length - 1) return fail(barrageIndex, 'วาง “กระหน่ำ” ไว้ท้ายสุดเท่านั้น');
  if (devastating && barraging) return fail(barrageIndex, 'ใช้ “กระหน่ำ” ร่วมกับ “ทำลายล้าง” ไม่ได้');
  const baseIds = (devastating || barraging || lightened) ? ids.slice(0, -1) : ids;
  if (baseIds[0] === 'blood') return fail(0, 'ใช้ “เลือด” เดี่ยวไม่ได้ ต้องวางหลัง “เติม” เช่น เติม เลือด');
  if (baseIds[0] === 'mana') return fail(0, 'ใช้ “มานา” เดี่ยวไม่ได้ ต้องวางหลัง “เติม” เช่น เติม มานา');
  if (baseIds.includes('fill') && baseIds.includes('grand')) {
    return fail(baseIds.indexOf('grand'), 'คำว่า “เติม” ใช้ร่วมกับ “มหา” ไม่ได้ ใช้ได้เฉพาะ “ใหญ่” ต่อท้ายเท่านั้น');
  }
  const allowedSecond = Object.hasOwn(SPELL_STARTS, baseIds[0]) ? SPELL_STARTS[baseIds[0]] : null;
  if (!allowedSecond) {
    return fail(0, devastating ? '“ทำลายล้าง” ใช้ต่อท้ายคาถาโจมตีเท่านั้น' : barraging ? '“กระหน่ำ” ใช้ต่อท้ายคาถาโจมตีเท่านั้น' : 'คำนี้ต่อกับวลีตรงนี้ไม่ได้');
  }
  if (baseIds[1] && !allowedSecond.includes(baseIds[1])) {
    if (baseIds[0] === 'fill') return fail(1, 'วาง “เลือด” หรือ “มานา” หลัง “เติม” เท่านั้น');
    if (baseIds[0] === 'empower' || baseIds[0] === 'bless') return fail(1, 'เติมธาตุหลัง “เสริม” หรือ “อวยพร”');
    return fail(1, ATTACK_FORMS.includes(baseIds[0]) ? 'เติมธาตุหลังรูปทรง' : 'คำนี้ต่อกับวลีตรงนี้ไม่ได้');
  }
  const grand = baseIds[0] === 'grand';
  const [head, ...tail] = grand ? baseIds.slice(1) : baseIds;
  if (grand && !SPELL_STARTS.grand.includes(head)) return fail(1, 'วางรูปเวท เสริม อวยพร ฮีล โล่ ม่าน อุกกาบาต หลุมดำ หรืออัญเชิญหลัง “มหา”');
  const [second, third, fourth] = ['beam', 'wave', 'shield'].includes(head) && tail[0] === 'pair' &&
    ELEMENTS.includes(tail[1]) && ELEMENTS.includes(tail[2])
    ? [tail[1], tail[2], 'pair'] : tail;
  const finish = spell => {
    if (devastating && spell.type !== 'attack') return fail(suffixIndex, '“ทำลายล้าง” ใช้ต่อท้ายคาถาโจมตีเท่านั้น');
    if (barraging) {
      if (spell.type !== 'attack' || ['death', 'blackhole'].includes(spell.form)) {
        return fail(barrageIndex, '“กระหน่ำ” ใช้ต่อท้ายคาถาโจมตีเท่านั้น (ยกเว้นหลุมดำและตาย)');
      }
      if (baseIds.includes('pair') || spell.shots > 1 || spell.wavePair || spell.stormPair || spell.blastPair || spell.meteorPair || spell.secondElement) {
        return fail(barrageIndex, 'ใช้ “กระหน่ำ” ร่วมกับ “คู่” ไม่ได้');
      }
    }
    if (grand && spell.type === 'attack') {
      const extraCost = spell.stormPair ? 5 : (spell.shots === 2 || spell.wavePair) ? 6 : 3;
      const extraPierce = spell.stormPair ? 2 : 0;
      spell = {
        ...spell,
        grand: true,
        multiplier: spell.multiplier * 1.5,
        ...(extraPierce ? { pierce: (spell.pierce ?? 0) + extraPierce } : {}),
        cost: spell.cost + extraCost,
      };
    } else if (grand) {
      spell = { ...spell, grand: true };
    }
    if (ids.includes('large')) spell = { ...spell, large: true };
    if (devastating) spell = { ...spell, devastation: true, multiplier: spell.multiplier * 2, cost: spell.cost + WORDS.devastation.cost };
    if (barraging) {
      const multiShotForm = ['shot', 'spear', 'axe', 'chakram', 'beam', 'meteor'].includes(spell.form) || (spell.form === 'blast' && spell.blastShot);
      spell = {
        ...spell,
        barrage: true,
        repeatCount: 5,
        ...(multiShotForm ? { shots: 5 } : {}),
        cost: Math.round(spell.cost * 3.5),
      };
    }
    if (lightened) spell = { ...spell, lightened: true, cost: Math.max(1, spell.cost - 1) };
    return { ok: true, spell, cost: spell.cost, ids, expression: ids.map(id => WORDS[id].label).join(' ') };
  };
  const invalid = index => fail(index, 'คำนี้ต่อกับวลีตรงนี้ไม่ได้');
  if (head === 'delay') return finish({ type: 'self', form: 'shield', delayed: true, layers: 1, layerHp: WORDS.delay.shieldHp, effect: null, cost: WORDS.delay.cost });
  if (head === 'summon') {
    if (!second || !CREATURE_WORDS.includes(second)) {
      return fail(grand ? 2 : 1, 'เลือกสัตว์อัญเชิญหลัง “อัญเชิญ” เช่น อัญเชิญ สุนัข ไฟ');
    }
    if (third && !ELEMENTS.includes(third)) {
      return fail(grand ? 3 : 2, 'ต่อท้ายสัตว์อัญเชิญด้วยธาตุ เช่น ไฟ หรือ น้ำแข็ง');
    }
    if (fourth) {
      return fail(grand ? 4 : 3, 'คาถาอัญเชิญใช้สูงสุด 3 คำ (หรือ 4 คำเมื่อขึ้นต้นด้วย “มหา”)');
    }
    const elemCost = third ? (WORDS[third]?.cost ?? 0) : 0;
    const baseCost = WORDS.summon.cost + WORDS[second].cost + elemCost;
    const spellCost = grand ? Math.ceil(baseCost * 1.5) : baseCost;
    return finish({
      type: 'summon',
      form: 'summon',
      creature: second,
      element: third ?? null,
      cost: spellCost,
    });
  }
  if (head === 'veil') {
    const finishVeil = spec => finish(grand ? { ...spec, layerHp: spec.layerHp + 4, shieldRenewal: 4, cost: spec.cost + 3 * spec.layers } : spec);
    if (!second) return finishVeil({ type: 'self', form: 'shield', layers: 1, layerHp: 14, effect: 'veil', cost: WORDS.veil.cost });
    if (second === 'pair') {
      if (!third) return finishVeil({ type: 'self', form: 'shield', layers: 2, layerHp: 14, effect: 'veil', cost: WORDS.veil.cost * 2 });
      return invalid(2);
    }
    if (second === 'large') {
      if (!third) return finishVeil({ type: 'self', form: 'shield', layers: 1, layerHp: 21, effect: 'veil', cost: WORDS.veil.cost + 2 });
      if (!grand && third === 'pair' && !fourth) return finishVeil({ type: 'self', form: 'shield', layers: 2, layerHp: 21, effect: 'veil', cost: (WORDS.veil.cost + 2) * 2 });
      return invalid(third === 'pair' ? 3 : 2);
    }
    return invalid(grand ? 2 : 1);
  }
  if (head === 'meteor') {
    if (!second) return finish({ type: 'attack', form: 'meteor', multiplier: 1, cost: WORDS.meteor.cost });
    if (second === 'large') {
      if (!third) return finish({ type: 'attack', form: 'meteor', multiplier: 1.5, cost: WORDS.meteor.cost + 2 });
      if (!grand && third === 'pair' && !fourth) return finish({ type: 'attack', form: 'meteor', shots: 2, meteorPair: true, multiplier: 1.5, cost: (WORDS.meteor.cost + 2) * 2 });
      return invalid(third === 'pair' ? 3 : 2);
    }
    if (second === 'pair') {
      if (!third) return finish({ type: 'attack', form: 'meteor', shots: 2, meteorPair: true, multiplier: 1, cost: WORDS.meteor.cost * 2 });
      return invalid(2);
    }
    return invalid(grand ? 2 : 1);
  }
  if (head === 'blackhole') {
    if (!second) return finish({ type: 'attack', form: 'blackhole', multiplier: 1, cost: WORDS.blackhole.cost });
    if (second === 'large' && !third) return finish({ type: 'attack', form: 'blackhole', multiplier: 1.5, cost: WORDS.blackhole.cost + 2 });
    return invalid(third ? (grand ? 3 : 2) : (grand ? 2 : 1));
  }
  if (head === 'death') {
    if (grand || second) return invalid(1);
    return finish({ type: 'attack', form: 'death', cost: WORDS.death.cost });
  }
  if (head === 'blast') {
    if (!grand && second === 'shield') {
      if (!['fire', 'akki'].includes(third)) return invalid(2);
      return fourth ? invalid(3) : finish({ type: 'self', form: 'detonate', element: third, cost: 2 });
    }
    if (second === 'shot') {
      const shell = { type: 'attack', form: 'blast', elements: [], shots: 1, blasts: 0, blastShot: true, shellDamage: 8, multiplier: 1, cost: 5 };
      if (!third) return finish(shell);
      if (third === 'pair') {
        if (!fourth) return finish({ ...shell, shots: 2, cost: 10 });
        if (ELEMENTS.includes(fourth)) return finish({ ...shell, elements: [fourth], shots: 2, cost: 2 * (5 + WORDS[fourth].cost) });
        return invalid(3);
      }
      if (third === 'large') {
        if (!fourth) return finish({ ...shell, multiplier: 1.5, cost: 7 });
        if (fourth === 'pair') return finish({ ...shell, shots: 2, multiplier: 1.5, cost: 14 });
        if (ELEMENTS.includes(fourth)) return finish({ ...shell, elements: [fourth], multiplier: 1.5, cost: 7 + WORDS[fourth].cost });
        return invalid(3);
      }
      if (ELEMENTS.includes(third)) {
        const elemCost = 5 + WORDS[third].cost;
        const elemShell = { ...shell, elements: [third], cost: elemCost };
        if (!fourth) return finish(elemShell);
        if (fourth === 'pair') return finish({ ...elemShell, shots: 2, cost: 2 * elemCost });
        if (fourth === 'large') return finish({ ...elemShell, multiplier: 1.5, cost: 7 + WORDS[third].cost });
        if (fourth === 'pierce') return finish({ ...elemShell, pierce: 2, cost: elemCost + 1 });
        if (fourth === 'push') return finish({ ...elemShell, push: true, cost: elemCost + 1 });
        if (fourth === 'pull') return finish({ ...elemShell, pull: true, cost: elemCost + 1 });
        if (fourth === 'seal' || fourth === 'dispel') return finish({ ...elemShell, [fourth]: true, cost: elemCost + 2 });
        if (fourth === 'burn' && elementFamily(third) === 'fire') return finish({ ...elemShell, burn: 3, cost: elemCost + 1 });
        if (fourth === 'freeze' && elementFamily(third) === 'ice') return finish({ ...elemShell, freeze: 1, cost: elemCost + 3 });
        if (ELEMENTS.includes(fourth)) {
          if (third === fourth) return fail(3, 'ระเบิดลูกสองธาตุต้องใช้คำธาตุคนละชื่อ');
          return finish({ ...shell, elements: [third, fourth].sort(), cost: 4 + WORDS[third].cost + WORDS[fourth].cost });
        }
        return invalid(3);
      }
      return invalid(2);
    }
    if (second === 'pair') {
      if (!third) return finish({ type: 'attack', form: 'blast', elements: [], multiplier: 1, blastPair: true, cost: 7 });
      if (ELEMENTS.includes(third)) {
        if (!fourth) return finish({ type: 'attack', form: 'blast', elements: [third], multiplier: 1, blastPair: true, cost: 7 + WORDS[third].cost });
        return invalid(3);
      }
      return invalid(2);
    }
    if (second === 'large') {
      if (!third) return finish({ type: 'attack', form: 'blast', elements: [], multiplier: 1.5, blastPair: false, cost: 6 });
      if (third === 'pair') {
        if (!fourth) return finish({ type: 'attack', form: 'blast', elements: [], multiplier: 1.5, blastPair: true, cost: 9 });
        if (ELEMENTS.includes(fourth)) return finish({ type: 'attack', form: 'blast', elements: [fourth], multiplier: 1.5, blastPair: true, cost: 9 + WORDS[fourth].cost });
        return invalid(3);
      }
      if (ELEMENTS.includes(third)) {
        if (!fourth) return finish({ type: 'attack', form: 'blast', elements: [third], multiplier: 1.5, blastPair: false, cost: 6 + WORDS[third].cost });
        if (fourth === 'pair') return finish({ type: 'attack', form: 'blast', elements: [third], multiplier: 1.5, blastPair: true, cost: 9 + WORDS[third].cost });
        return invalid(3);
      }
      return invalid(2);
    }
    if (second ? !ELEMENTS.includes(second) : grand) return fail(grand ? 2 : 1, 'เติมธาตุหลัง “ระเบิด”');
    if (second && third === 'large') {
      if (fourth && fourth !== 'pair') return invalid(3);
      const paired = fourth === 'pair';
      return finish({ type: 'attack', form: 'blast', elements: [second], multiplier: 1.5, blastPair: paired, cost: 6 + WORDS[second].cost + (paired ? 3 : 0) });
    }
    const paired = third === 'pair' || fourth === 'pair';
    const dual = ELEMENTS.includes(third);
    if (third && !dual && !paired) return invalid(2);
    if (dual && second === third) return fail(2, 'ระเบิดสองธาตุต้องใช้คำธาตุคนละชื่อ');
    if (fourth && !(dual && fourth === 'pair')) return invalid(3);
    const elements = (dual ? [second, third] : second ? [second] : []).sort();
    const cost = WORDS.blast.cost + elements.reduce((sum, id) => sum + WORDS[id].cost, 0) - (dual ? 1 : 0) + (paired ? 3 : 0);
    return finish({ type: 'attack', form: 'blast', elements, multiplier: 1, blastPair: paired, cost });
  }
  if (head === 'heal') {
    if (grand) {
      if (second === 'pair' && !third || second === 'self' && third === 'pair' && !fourth) {
        return finish({ type: 'self', form: 'heal', healing: 12, nextHealing: 10, cost: 14 });
      }
      if (second === 'large' && !third || second === 'self' && third === 'large' && !fourth) {
        return finish({ type: 'self', form: 'heal', healing: 10, nextHealing: 8, cost: 9 });
      }
      if (second && second !== 'self') return invalid(2);
      if (third) return invalid(3);
      return finish({ type: 'self', form: 'heal', healing: 6, nextHealing: 6, cost: 7 });
    }
    if (second === 'pair' && !third || second === 'self' && third === 'pair' && !fourth) {
      return finish({ type: 'self', form: 'heal', healing: 8, cost: 6 });
    }
    if (second === 'large' && third === 'pair' && !fourth) {
      return finish({ type: 'self', form: 'heal', healing: 16, cost: 10 });
    }
    if (second === 'self' && third === 'large' && fourth === 'pair') {
      return finish({ type: 'self', form: 'heal', healing: 16, cost: 10 });
    }
    if (second === 'large' && !third || second === 'self' && third === 'large' && !fourth) {
      return finish({ type: 'self', form: 'heal', healing: 8, cost: 5 });
    }
    return second === 'self' && !third
      ? finish({ type: 'self', form: 'heal', healing: 4, cost: 3 }) : invalid(second === 'self' ? 2 : 1);
  }
  if (head === 'fill') {
    if (grand) return fail(0, 'คำว่า “เติม” ใช้ร่วมกับ “มหา” ไม่ได้ ใช้ได้เฉพาะ “ใหญ่” ต่อท้ายเท่านั้น');
    if (second !== 'blood' && second !== 'mana') return fail(1, 'เติมต้องใช้คู่กับ “เลือด” หรือ “มานา”');
    if (third && third !== 'large') return fail(2, 'คำว่า “เติม” ต่อท้ายได้เฉพาะ “ใหญ่” เท่านั้น');
    if (fourth) return invalid(3);
    const isLarge = third === 'large';
    if (second === 'blood') {
      return finish({
        type: 'self',
        form: 'fill',
        resource: 'blood',
        healing: isLarge ? 12 : 7,
        cost: isLarge ? 5 : 3,
      });
    }
    return finish({
      type: 'self',
      form: 'fill',
      resource: 'mana',
      manaGain: isLarge ? 10 : 6,
      cost: isLarge ? 2 : 1,
    });
  }
  if (head === 'empower' || head === 'bless') {
    if (!ELEMENTS.includes(second)) return fail(grand ? 2 : 1, `เติมธาตุหลัง “${WORDS[head].label}”`);
    const isBless = head === 'bless';
    const baseHeadCost = WORDS[head].cost;
    const elemTierPct = elemId => {
      if (Object.hasOwn(FUSED_ELEMENTS, elemId)) return isBless ? 70 : 45;
      if (Object.hasOwn(SECOND_TIER_ELEMENTS, elemId)) return isBless ? 60 : 40;
      return isBless ? 40 : 25;
    };
    let elements = [second];
    let buffPct = elemTierPct(second);
    let buffTurns = 3;
    let cost = baseHeadCost + WORDS[second].cost;
    let buffPierce = isBless ? 1 : 0;
    if (third === 'large') {
      if (fourth) return invalid(grand ? 3 : 3);
      buffPct = Math.round(buffPct * 1.5);
      cost += 2;
    } else if (third === 'pair') {
      if (!fourth) {
        buffPct = Math.round(buffPct * 1.5);
        buffTurns += 1;
        cost += 3;
      } else if (!grand && ELEMENTS.includes(fourth)) {
        if (fourth === second) {
          buffPct = Math.round(buffPct * 1.5);
          buffTurns += 1;
          cost += 3;
        } else {
          elements = [second, fourth].sort();
          buffPct = Math.round((elemTierPct(second) + elemTierPct(fourth)) / 2);
          cost = baseHeadCost + WORDS[second].cost + WORDS[fourth].cost - 1;
        }
      } else {
        return invalid(3);
      }
    } else if (ELEMENTS.includes(third) && fourth === 'pair') {
      if (third === second) {
        buffPct = Math.round(buffPct * 1.5);
        buffTurns += 1;
        cost += 3;
      } else {
        elements = [second, third].sort();
        buffPct = Math.round((elemTierPct(second) + elemTierPct(third)) / 2);
        cost = baseHeadCost + WORDS[second].cost + WORDS[third].cost - 1;
      }
    } else if (third) {
      return invalid(grand ? 3 : 2);
    }
    if (grand) {
      buffPct = Math.round(buffPct * 1.5);
      buffTurns += 1;
      cost += 3;
      if (isBless) buffPierce += 1;
    }
    return finish({
      type: 'self',
      form: head,
      elements,
      buffPct,
      buffTurns,
      buffPierce,
      cost,
    });
  }
  if (head === 'storm') {
    const dual = ELEMENTS.includes(third);
    const elements = ELEMENTS.includes(second) ? [second] : [];
    const stormMods = ['pair', 'blast', 'pierce', 'push', 'large', 'pull', 'seal', 'dispel'];
    if (ELEMENTS.includes(second) && elementFamily(second) === 'fire') stormMods.push('burn');
    if (ELEMENTS.includes(second) && elementFamily(second) === 'ice') stormMods.push('freeze');
    if (second && !elements.length) return invalid(grand ? 2 : 1);
    if (third && (!elements.length || (!dual && !stormMods.includes(third)))) return invalid(2);
    const largePairCombo = third === 'large' && fourth === 'pair';
    if (fourth && !(dual && (fourth === 'blast' || fourth === 'pair')) && !largePairCombo) return invalid(3);
    if (dual && second === third) return fail(2, 'พายุสองธาตุต้องใช้คำธาตุคนละชื่อ');
    if (dual) elements.push(third);
    const stormPair = third === 'pair' || fourth === 'pair';
    const stormBlast = third === 'blast' || fourth === 'blast';
    const stormLarge = third === 'large' || fourth === 'large';
    const pierce = third === 'pierce' ? 2 : 0;
    const extraModCost = (stormPair ? 3 : 0) + (stormLarge ? 2 : 0)
      + (stormBlast || third === 'seal' || third === 'dispel' ? 2 : 0)
      + (third === 'freeze' ? 3 : 0)
      + (pierce || ['push', 'pull', 'burn'].includes(third) ? 1 : 0);
    const cost = WORDS.storm.cost + elements.reduce((total, id) => total + WORDS[id].cost, 0)
      - (dual ? 1 : 0) + extraModCost;
    const multiplier = (elements.length ? 1.5 : 1) * (stormLarge ? 1.5 : 1);
    const spell = { type: 'attack', form: 'storm', elements: elements.sort(), shots: 1, blasts: 0, multiplier, cost, stormPair, stormBlast };
    if (third === 'push') return finish({ ...spell, push: true });
    if (third === 'pull') return finish({ ...spell, pull: true });
    if (third === 'burn') return finish({ ...spell, burn: 3 });
    if (third === 'freeze') return finish({ ...spell, freeze: 1 });
    if (third === 'seal' || third === 'dispel') return finish({ ...spell, [third]: true });
    return finish(pierce ? { ...spell, pierce } : spell);
  }
  const fused = ELEMENTS.includes(second) && third === 'pair' && ELEMENTS.includes(fourth);
  const split = ELEMENTS.includes(second) && ELEMENTS.includes(third) && fourth === 'pair';
  if (head === 'shield') {
    const finishShield = spec => {
      if (!grand) return finish(spec);
      const layers = spec.layers ?? 1;
      const layerHp = (spec.layerHp ?? 6) + 6;
      const healing = spec.healing ? spec.healing + 2 : 0;
      const nextHealing = spec.healing ? (spec.healing >= 8 ? 6 : 4) : 0;
      return finish({
        ...spec,
        layerHp,
        shieldRenewal: 3,
        ...(healing ? { healing, nextHealing } : {}),
        cost: spec.cost + 3 * layers + (spec.healing ? 1 : 0),
      });
    };
    if (second === 'brace') {
      if (!third) return finishShield({ type: 'self', form: 'shield', layers: 1, effect: 'brace', cost: 4 });
      if (third === 'pair' && !fourth) return finishShield({ type: 'self', form: 'shield', layers: 2, effect: 'brace', cost: 8 });
      if (third === 'large') {
        const layers = fourth === 'pair' ? 2 : 1;
        if (fourth && fourth !== 'pair') return invalid(3);
        return finishShield({ type: 'self', form: 'shield', layers, layerHp: LARGE_SHIELD_HP, effect: 'brace', cost: 6 * layers });
      }
      return invalid(2);
    }
    if (second === 'large') {
      if (third && !['pair', 'heal', 'brace'].includes(third)) return invalid(2);
      if (third === 'brace') {
        if (fourth && fourth !== 'pair') return invalid(3);
        const layers = fourth === 'pair' ? 2 : 1;
        return finishShield({ type: 'self', form: 'shield', layers, layerHp: LARGE_SHIELD_HP, effect: 'brace', cost: 6 * layers });
      }
      if (fourth) return invalid(3);
      const layers = third === 'pair' ? 2 : 1;
      const healing = third === 'heal' ? 4 : 0;
      return finishShield({ type: 'self', form: 'shield', layers, layerHp: LARGE_SHIELD_HP, effect: null, healing, cost: 5 * layers + healing / 2 });
    }
    if (ELEMENTS.includes(second) && third === 'large') {
      if (fourth && fourth !== 'pair') return invalid(3);
      const layers = fourth ? 2 : 1;
      return finishShield({ type: 'self', form: 'shield', layers, layerHp: LARGE_SHIELD_HP, effect: second, cost: (4 + WORDS[second].cost) * layers });
    }
    if (ELEMENTS.includes(second) && third === 'heal') {
      if (fourth && fourth !== 'pair') return invalid(3);
      const healing = fourth === 'pair' ? 8 : 4;
      return finishShield({ type: 'self', form: 'shield', layers: 1, effect: second, healing, cost: 4 + WORDS[second].cost + (fourth === 'pair' ? 2 : 0) });
    }
    if (ELEMENTS.includes(second) && third === 'pair' && fourth === 'heal') {
      return finishShield({ type: 'self', form: 'shield', layers: 2, effect: second, healing: 4, cost: (2 + WORDS[second].cost) * 2 + 2 });
    }
    if (second === 'heal' && third === 'large' && !fourth) {
      return finishShield({ type: 'self', form: 'shield', layers: 1, effect: null, healing: 8, cost: 7 });
    }
    if (second === 'pair' && third === 'brace' && !fourth) {
      return finishShield({ type: 'self', form: 'shield', layers: 2, effect: 'brace', cost: 8 });
    }
    if (fused || split) {
      const layerEffects = fused ? [[...new Set([second, fourth])].sort()] : [[second], [third]];
      return finishShield({ type: 'self', form: 'shield', layers: layerEffects.length, layerEffects, effect: null, healing: 0, cost: (fused ? 7 : 8) + (WORDS[second].cost - 2) + (WORDS[fused ? fourth : third].cost - 2) });
    }
    if (second === 'pair' && third) return invalid(2);
    if (second && !['pair', 'heal', ...ELEMENTS].includes(second)) return invalid(1);
    if (third && third !== 'pair' && !(['fire', 'akki'].includes(second) && third === 'blast')) return invalid(2);
    if (fourth) return invalid(3);
    const layers = second === 'pair' || third === 'pair' && second !== 'heal' ? 2 : 1;
    const healing = second === 'heal' ? third === 'pair' ? 8 : 4 : 0;
    const effect = third === 'blast' ? (second === 'akki' ? 'akki-blast' : 'blast') : ELEMENTS.includes(second) ? second : null;
    const premium = ELEMENTS.includes(second) ? WORDS[second].cost - 2 : 0;
    const cost = (3 + (effect ? 1 : 0) + premium) * layers + healing / 2 + (third === 'blast' ? 1 : 0);
    return finishShield({ type: 'self', form: 'shield', layers, effect, healing, cost });
  }

  const form = head;
  const element = second;
  if (!ATTACK_FORMS.includes(form)) return invalid(0);
  if (form === 'shot' && element === 'blast') {
    const shell = { type: 'attack', form: 'shot', elements: [], shots: 1, blasts: 0, shellBlast: true, shellDamage: 8, multiplier: 1, cost: 5 };
    if (!third) return finish(shell);
    if (third === 'pair') {
      if (!fourth) return finish({ ...shell, shots: 2, cost: 10 });
      if (ELEMENTS.includes(fourth)) return finish({ ...shell, elements: [fourth], shots: 2, cost: 2 * (5 + WORDS[fourth].cost) });
      return invalid(3);
    }
    if (third === 'large') {
      if (!fourth) return finish({ ...shell, multiplier: 1.5, cost: 7 });
      if (fourth === 'pair') return finish({ ...shell, shots: 2, multiplier: 1.5, cost: 14 });
      if (ELEMENTS.includes(fourth)) return finish({ ...shell, elements: [fourth], multiplier: 1.5, cost: 7 + WORDS[fourth].cost });
      return invalid(3);
    }
    if (ELEMENTS.includes(third)) {
      const elemCost = 5 + WORDS[third].cost;
      const elemShell = { ...shell, elements: [third], cost: elemCost };
      if (!fourth) return finish(elemShell);
      if (fourth === 'pair') return finish({ ...elemShell, shots: 2, cost: 2 * elemCost });
      if (fourth === 'large') return finish({ ...elemShell, multiplier: 1.5, cost: 7 + WORDS[third].cost });
      if (fourth === 'pierce') return finish({ ...elemShell, pierce: 2, cost: elemCost + 1 });
      if (fourth === 'push') return finish({ ...elemShell, push: true, cost: elemCost + 1 });
      if (fourth === 'pull') return finish({ ...elemShell, pull: true, cost: elemCost + 1 });
      if (fourth === 'seal' || fourth === 'dispel') return finish({ ...elemShell, [fourth]: true, cost: elemCost + 2 });
      if (fourth === 'burn' && elementFamily(third) === 'fire') return finish({ ...elemShell, burn: 3, cost: elemCost + 1 });
      if (fourth === 'freeze' && elementFamily(third) === 'ice') return finish({ ...elemShell, freeze: 1, cost: elemCost + 3 });
      if (ELEMENTS.includes(fourth)) {
        if (third === fourth) return fail(3, 'ลูกระเบิดสองธาตุต้องใช้คำธาตุคนละชื่อ');
        return finish({ ...shell, elements: [third, fourth].sort(), cost: 4 + WORDS[third].cost + WORDS[fourth].cost });
      }
      return invalid(3);
    }
    return invalid(2);
  }
  if (!ELEMENTS.includes(element)) return fail(grand ? 2 : 1, 'เติมธาตุหลังรูปทรง');
  const baseCost = { shot: 1, spear: 1, axe: 1, chakram: 3, beam: 2, wave: 3 }[form] + WORDS[element].cost;
  const baseMult = form === 'chakram' ? 1.8 : form === 'axe' ? 0.8 : 1;
  const spell = { type: 'attack', form, elements: [element], shots: 1, blasts: 0, multiplier: baseMult, cost: baseCost };
  if (!third) return finish(spell);
  if (grand && ELEMENTS.includes(third) && !fourth) {
    if (third === element) return fail(3, 'คาถาผสานสองธาตุต้องใช้คำธาตุคนละชื่อ');
    const dualCost = baseCost + WORDS[third].cost - 1;
    return finish({ ...spell, elements: [element, third].sort(), cost: dualCost });
  }
  if (fused) {
    return finish({ ...spell, elements: [element, fourth].sort(), multiplier: baseMult * (element === fourth ? 1.5 : 1), cost: 2 * baseCost + WORDS[fourth].cost - WORDS[element].cost - 1 });
  }
  if (split) {
    return finish({ ...spell, secondElement: third, shots: form === 'wave' ? 1 : 2, cost: 2 * baseCost + WORDS[third].cost - WORDS[element].cost });
  }
  if (third === 'pull' && !fourth && ['shot', 'spear', 'axe', 'chakram', 'beam', 'wave'].includes(form)) {
    return finish({ ...spell, pull: true, cost: baseCost + 1 });
  }
  if (!['shot', 'spear', 'axe', 'chakram'].includes(form)) {
    if (third === 'large' && fourth === 'pair') {
      return finish(form === 'wave'
        ? { ...spell, wavePair: true, multiplier: 1.5, cost: 2 * (baseCost + 2) }
        : { ...spell, shots: 2, multiplier: 1.5, cost: 2 * (baseCost + 2) });
    }
    if (fourth) return invalid(3);
    if (third === 'pair') {
      return finish(form === 'wave'
        ? { ...spell, wavePair: true, cost: 2 * baseCost }
        : { ...spell, shots: 2, cost: 2 * baseCost });
    }
    if (third === 'large') return finish({ ...spell, multiplier: 1.5, cost: baseCost + 2 });
    if (third === 'pierce') return finish({ ...spell, pierce: 2, cost: baseCost + 1 });
    if (third === 'push') return finish({ ...spell, push: true, cost: baseCost + 1 });
    if (third === 'seal' || third === 'dispel') return finish({ ...spell, [third]: true, cost: baseCost + 2 });
    if (third === 'burn' && elementFamily(element) === 'fire') return finish({ ...spell, burn: 3, cost: baseCost + 1 });
    if (third === 'freeze' && elementFamily(element) === 'ice') return finish({ ...spell, freeze: 1, cost: baseCost + 3 });
    if (form === 'wave' && third === 'blast') return finish({ ...spell, waveBlast: true, cost: baseCost + 2 });
    if (form === 'beam' && third === 'blast') return finish({ ...spell, blasts: 1, cost: baseCost + 2 });
    return invalid(2);
  }
  if (third === 'pair' && (!fourth || fourth === 'blast')) {
    const isBlast = fourth === 'blast';
    return finish({
      ...spell,
      shots: 2,
      blasts: isBlast ? 1 : 0,
      cost: 2 * (baseCost + (isBlast ? 2 : 0)),
    });
  }
  if (third === 'blast' && (!fourth || fourth === 'pair')) {
    return finish({ ...spell, blasts: fourth ? 2 : 1, cost: baseCost + (fourth ? 4 : 2) });
  }
  if (third === 'pierce' && (!fourth || fourth === 'blast')) {
    return finish({ ...spell, pierce: 2, blasts: fourth ? 1 : 0, cost: baseCost + 1 + (fourth ? 2 : 0) });
  }
  if (third === 'large' && (!fourth || fourth === 'pair')) {
    const shots = fourth === 'pair' ? 2 : 1;
    return finish({ ...spell, shots, multiplier: baseMult * 1.5, cost: (baseCost + 2) * shots });
  }
  if (fourth) return invalid(3);
  if (third === 'seal' || third === 'dispel') return finish({ ...spell, [third]: true, cost: baseCost + 2 });
  if (third === 'burn' && elementFamily(element) === 'fire') return finish({ ...spell, burn: 3, cost: baseCost + 1 });
  if (third === 'freeze' && elementFamily(element) === 'ice') return finish({ ...spell, freeze: 1, cost: baseCost + 3 });
  if (third === 'push') return finish({ ...spell, push: true, cost: baseCost + 1 });
  return invalid(2);
}

export const DEVASTATION_FORMULAS = [
  ['shot', 'blast'],
  ['shot', 'blast', 'large'],
  ['shot', 'blast', 'pair'],
  ['blast'],
  ['blast', 'large'],
  ['blast', 'pair'],
  ['meteor'],
  ['meteor', 'large'],
  ['blackhole'],
  ['blackhole', 'large'],
  ...ELEMENTS.flatMap(id => [
    ['shot', id], ['spear', id], ['chakram', id], ['beam', id], ['wave', id], ['blast', id],
    ['shot', 'blast', id],
    ...['pair', 'blast', 'pierce', 'large', 'seal', 'dispel', 'burn', 'freeze', 'push'].map(mod => ['shot', id, mod]),
    ...['pair', 'blast', 'pierce', 'large', 'seal', 'dispel', 'burn', 'freeze', 'push'].map(mod => ['spear', id, mod]),
    ...['pair', 'blast', 'pierce', 'large', 'seal', 'dispel', 'burn', 'freeze', 'push'].map(mod => ['chakram', id, mod]),
  ]),
  ...STORM_FORMULAS.filter(phrase => phrase.length < 4),
  ...CROSS_FORM_FORMULAS,
  ...GRAND_FORMULAS,
].map(phrase => [...phrase, 'devastation']).filter(phrase => parseSpell(phrase).ok);

export const BARRAGE_FORMULAS = [
  ['meteor'],
  ['meteor', 'large'],
  ['grand', 'meteor'],
  ['storm'],
  ['grand', 'storm'],
  ['blast'],
  ['blast', 'large'],
  ...ELEMENTS.flatMap(id => [
    ['grand', 'chakram', id], ['grand', 'shot', id], ['grand', 'spear', id], ['grand', 'storm', id], ['grand', 'beam', id], ['grand', 'wave', id],
    ['chakram', id], ['shot', id], ['spear', id], ['storm', id], ['beam', id], ['wave', id], ['blast', id],
    ['chakram', id, 'large'], ['shot', id, 'large'], ['spear', id, 'large'], ['chakram', id, 'pierce'], ['shot', id, 'pierce'], ['spear', id, 'pierce'],
  ]),
].map(phrase => [...phrase, 'barrage']).filter(phrase => parseSpell(phrase).ok);

const TAIL_CANDIDATES = Object.freeze([
  ...ELEMENTS,
  'pair', 'blast', 'pierce', 'large', 'push', 'pull', 'burn', 'freeze',
  'seal', 'dispel', 'heal', 'self', 'brace', 'shield', 'shot', 'spear', 'blood', 'mana', 'devastation', 'barrage', 'light',
]);

let spellCatalog;
export function getSpellCatalog() {
  if (spellCatalog) return spellCatalog;
  const catalog = new Map();
  const library = Object.keys(WORDS);
  function addPhrase(phrase) {
    const parsed = parseSpell(phrase, library);
    if (parsed.ok) catalog.set(phrase.join(' '), parsed);
    const len = phrase.length;
    if (len >= 4) return;
    const last = phrase[len - 1];
    if (last === 'devastation' || last === 'barrage' || BATTLE_LIMITED_WORDS.includes(last)) return;
    let candidates;
    if (len === 1) {
      candidates = parsed.ok
        ? [...SPELL_STARTS[phrase[0]], 'devastation', 'barrage']
        : SPELL_STARTS[phrase[0]];
    } else if (len === 2 && phrase[0] === 'grand') {
      const headStarts = SPELL_STARTS[phrase[1]] ?? [];
      candidates = parsed.ok
        ? [...headStarts, 'devastation', 'barrage']
        : headStarts;
    } else if (len === 3 && phrase[0] !== 'grand' && !parsed.ok) {
      if (ELEMENTS.includes(last)) candidates = ['pair', ...ELEMENTS];
      else if (last === 'pair') candidates = TAIL_CANDIDATES;
      else return;
    } else {
      candidates = TAIL_CANDIDATES;
    }
    for (const id of candidates) addPhrase([...phrase, id]);
  }
  for (const head of Object.keys(SPELL_STARTS)) addPhrase([head]);
  spellCatalog = catalog;
  return catalog;
}
