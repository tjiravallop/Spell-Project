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
  dog: { name: 'สุนัข', rarity: 'common', cost: 1, baseHp: 14, baseCounter: 4, baseStrike: 12, growthHp: 1.5, growthDmg: 1.0, glyph: '🐕', description: 'หมัดประสานเจาะเกราะ 2 · +7 จั่วเมื่อลงสนาม · +10 ตีซ้ำแรง 50%', formula: '1 MP · HP 14 / สวน 4 / ตีตาม 12' },
  bird: { name: 'นก', rarity: 'common', cost: 1, baseHp: 12, baseCounter: 3, baseStrike: 10, growthHp: 1.4, growthDmg: 0.9, glyph: '🦅', description: 'หมัดประสานข้ามม่าน · โอกาสหลบ 20% จนกว่าจะหลบสำเร็จ 1 ครั้ง', formula: '1 MP · HP 12 / สวน 3 / ตีตาม 10' },
  cat: { name: 'แมว', rarity: 'common', cost: 1, baseHp: 14, baseCounter: 4, baseStrike: 11, growthHp: 1.5, growthDmg: 1.0, glyph: '🐈', description: 'หมัดประสานคริติคอล ×1.5 เมื่อเป้าติดสถานะลบ', formula: '1 MP · HP 14 / สวน 4 / ตีตาม 11' },
  snake: { name: 'งู', rarity: 'common', cost: 1, baseHp: 13, baseCounter: 5, baseStrike: 12, growthHp: 1.4, growthDmg: 1.1, glyph: '🐍', description: 'สวนกลับโดนเป้าแล้วกัดซ้ำ 4 ดาเมจข้ามเกราะและม่าน', formula: '1 MP · HP 13 / สวน 5 / ตีตาม 12' },
  slime: { name: 'สไลม์', rarity: 'common', cost: 2, baseHp: 18, baseCounter: 3, baseStrike: 10, growthHp: 2.0, growthDmg: 0.8, glyph: '🫧', description: 'เมื่อแตก ศัตรูที่ตีติดหนาว 4', formula: '2 MP · HP 18 / สวน 3 / ตีตาม 10' },
  bat: { name: 'ค้างคาว', rarity: 'common', cost: 1, baseHp: 11, baseCounter: 4, baseStrike: 10, growthHp: 1.3, growthDmg: 1.0, glyph: '🦇', description: 'เมื่อสวนกลับโดนเป้าหมาย ฟื้นผู้เล่น 2 HP', formula: '1 MP · HP 11 / สวน 4 / ตีตาม 10' },
  turtle: { name: 'เต่า', rarity: 'common', cost: 2, baseHp: 20, baseCounter: 3, baseStrike: 8, armor: 1, growthHp: 2.2, growthDmg: 0.7, glyph: '🐢', description: 'ลงสนามพร้อมโล่ผู้เล่น 6 + ระดับตีบวก · เมื่อแตกมอบโล่ 8 หน่วย', formula: '2 MP · HP 20 / เกราะ 1 / สวน 3' },
  frog: { name: 'กบ', rarity: 'common', cost: 1, baseHp: 13, baseCounter: 4, baseStrike: 11, growthHp: 1.4, growthDmg: 1.0, glyph: '🐸', description: 'สวนกลับทำให้เป้าเปียก · หมัดประสานเจาะเกราะ 2', formula: '1 MP · HP 13 / สวน 4 / ตีตาม 11' },
  spider: { name: 'แมงมุม', rarity: 'common', cost: 1, baseHp: 13, baseCounter: 4, baseStrike: 12, growthHp: 1.4, growthDmg: 1.1, glyph: '🕷️', description: 'สวนกลับทำให้เป้าติดหนาว 3', formula: '1 MP · HP 13 / สวน 4 / ตีตาม 12' },
  rat: { name: 'หนู', rarity: 'common', cost: 1, baseHp: 12, baseCounter: 4, baseStrike: 12, growthHp: 1.3, growthDmg: 1.1, glyph: '🐀', description: 'สวนกลับทุบเกราะถาวร 1 · เมื่อแตกตัดฮีลศัตรูที่ตี 50%', formula: '1 MP · HP 12 / สวน 4 / ตีตาม 12' },

  // 7 Rare (2-3 MP)
  wolf: { name: 'หมาป่า', rarity: 'rare', cost: 2, baseHp: 24, baseCounter: 8, baseStrike: 20, growthHp: 2.2, growthDmg: 1.4, glyph: '🐺', description: 'สวนกลับวางเผา 4 · เมื่อแตกคำรามลดแรงโจมตีศัตรูที่ตี', formula: '2 MP · HP 24 / สวน 8 / ตีตาม 20' },
  bear: { name: 'หมี', rarity: 'rare', cost: 3, baseHp: 28, baseCounter: 8, baseStrike: 20, armor: 1, growthHp: 2.8, growthDmg: 1.6, glyph: '🐻', description: 'สวนกลับผลักศัตรู · หมัดประสานทุบเกราะถาวร 2', formula: '3 MP · HP 28 / เกราะ 1 / สวน 8' },
  eagle: { name: 'อินทรี', rarity: 'rare', cost: 2, baseHp: 22, baseCounter: 7, baseStrike: 20, growthHp: 2.0, growthDmg: 1.5, glyph: '🦅', description: 'สวนกลับข้ามม่าน · หมัดประสานกระจายดาเมจ 35% ไปช่องติดกัน', formula: '2 MP · HP 22 / สวน 7 / ตีตาม 20' },
  boar: { name: 'หมูป่า', rarity: 'rare', cost: 2, baseHp: 25, baseCounter: 8, baseStrike: 20, growthHp: 2.2, growthDmg: 1.6, glyph: '🐗', description: 'สวนกลับเจาะเกราะ 4 · หมัดประสานข้ามเกราะ', formula: '2 MP · HP 25 / สวน 8 / ตีตาม 20' },
  croc: { name: 'จระเข้', rarity: 'rare', cost: 3, baseHp: 26, baseCounter: 8, baseStrike: 22, armor: 1, growthHp: 2.4, growthDmg: 1.6, glyph: '🐊', description: 'หนังหนาลดดาเมจรับอีก 2 · หมัดประสานแรง ×1.5 ใส่เป้าเปียก', formula: '3 MP · HP 26 / เกราะ 1 / สวน 8' },
  skeleton: { name: 'โครงกระดูก', rarity: 'rare', cost: 2, baseHp: 20, baseCounter: 6, baseStrike: 18, growthHp: 2.0, growthDmg: 1.7, glyph: '💀', description: 'สวนกลับเจาะเกราะ 3 · เมื่อแตกยิงเศษกระดูก 14 ข้ามเกราะและม่าน', formula: '2 MP · HP 20 / สวน 6 / ตีตาม 18' },
  hornet: { name: 'ผึ้งยักษ์', rarity: 'rare', cost: 2, baseHp: 18, baseCounter: 6, baseStrike: 22, growthHp: 1.8, growthDmg: 1.7, glyph: '🐝', description: 'สวนกลับโดนเป้าแล้วต่อพิษ 6 ข้ามเกราะและม่าน · หมัดประสานข้ามเกราะ', formula: '2 MP · HP 18 / สวน 6 / ตีตาม 22' },

  // 5 Special (4-5 MP)
  golem: { name: 'โกเลม', rarity: 'special', cost: 5, baseHp: 30, baseCounter: 10, baseStrike: 26, armor: 2, growthHp: 3.0, growthDmg: 1.8, glyph: '🗿', description: 'หมัดประสานทุบเกราะถาวร 2 · ไฟระเบิดแรงขึ้น · +10 ทลายเกราะและสตั๊น', formula: '5 MP · HP 30 / เกราะ 2 / สวน 10' },
  lion: { name: 'สิงโต', rarity: 'special', cost: 4, baseHp: 28, baseCounter: 10, baseStrike: 26, growthHp: 2.6, growthDmg: 2.0, glyph: '🦁', description: 'แผงคอลดดาเมจรับ 3 · หมัดประสานคริติคอล ×1.5', formula: '4 MP · HP 28 / สวน 10 / ตีตาม 26' },
  siren: { name: 'ไซเรน', rarity: 'special', cost: 4, baseHp: 24, baseCounter: 8, baseStrike: 22, ward: 1, growthHp: 2.2, growthDmg: 1.6, glyph: '🧜‍♀️', description: 'ม่านพื้นฐาน 1 · สวนกลับทำให้เป้าเปียก · หมัดประสานสลายม่านเพิ่ม 1 ชั้น', formula: '4 MP · HP 24 / ม่าน 1 / สวน 8' },
  gargoyle: { name: 'การ์กอยล์', rarity: 'special', cost: 5, baseHp: 32, baseCounter: 10, baseStrike: 24, armor: 3, aoeIntercept: true, growthHp: 3.0, growthDmg: 1.9, glyph: '🦇', description: 'สกัด AoE แทนผู้เล่น ส่วนที่เกิน HP ทะลุถึงผู้เล่น', formula: '5 MP · HP 32 / เกราะ 3 / สวน 10' },
  sprite: { name: 'ภูตพราย', rarity: 'special', cost: 4, baseHp: 22, baseCounter: 6, baseStrike: 20, growthHp: 2.0, growthDmg: 1.5, glyph: '🧚', description: 'ลงสนามคืน 2 MP และจั่ว 1 ใบ · เมื่อแตกฟื้นผู้เล่น 12 HP', formula: '4 MP · HP 22 / สวน 6 / ตีตาม 20' },

  // 3 Epic (6-7 MP)
  hydra: { name: 'ไฮดรา', rarity: 'epic', cost: 6, baseHp: 45, baseCounter: 14, baseStrike: 35, growthHp: 4.0, growthDmg: 2.5, glyph: '🐉', description: 'ฟื้น 6 HP ก่อนเทิร์นถัดไป · สวนกับหมัดประสานโจมตีช่องติดกัน', formula: '6 MP · HP 45 / สวน 14 / ตีตาม 35' },
  behemoth: { name: 'เบฮีมอธ', rarity: 'epic', cost: 7, baseHp: 55, baseCounter: 16, baseStrike: 40, armor: 4, aoeIntercept: true, growthHp: 5.0, growthDmg: 3.0, glyph: '🦏', description: 'สกัด AoE แทนผู้เล่น · สวนกลับทุบเกราะศัตรูทุกตัว 2', formula: '7 MP · HP 55 / เกราะ 4 / สวน 16' },
  kraken: { name: 'คราเคน', rarity: 'epic', cost: 6, baseHp: 50, baseCounter: 15, baseStrike: 38, growthHp: 4.5, growthDmg: 2.8, glyph: '🐙', description: 'สวนกลับทำให้เป้าติดหนาว 6 · หมัดประสานสลายม่านเพิ่ม 1 ชั้น', formula: '6 MP · HP 50 / สวน 15 / ตีตาม 38' },

  // 2 Legendary (8-9 MP)
  dragon: { name: 'มังกร', rarity: 'legendary', cost: 8, baseHp: 60, baseCounter: 20, baseStrike: 45, armor: 3, ward: 1, growthHp: 6.0, growthDmg: 4.0, glyph: '🐲', description: 'ม่านพื้นฐาน 1 · +7 สะท้อนดาเมจเมื่อเสีย HP · +10 หมัดประสานข้ามเกราะและม่าน', formula: '8 MP · HP 60 / เกราะ 3 / ม่าน 1 / สวน 20' },
  phoenix: { name: 'ฟีนิกซ์', rarity: 'legendary', cost: 9, baseHp: 50, baseCounter: 18, baseStrike: 42, ward: 2, growthHp: 5.0, growthDmg: 3.5, glyph: '🪶', description: 'ม่านพื้นฐาน 2 · +7 เกิดจากไข่ได้ครั้งเดียว · +10 สละชีพชุบผู้เล่นเต็ม HP และ MP', formula: '9 MP · HP 50 / ม่าน 2 / สวน 18' },
});

export const CREATURE_WORDS = Object.freeze(Object.keys(CREATURE_STATS));

export const WORDS = Object.freeze({
  shot: { label: 'ลูก', glyph: '●', description: 'ยิงกระสุนเดี่ยวใส่เป้าหมาย พลัง 100% ตามธาตุ (ม่านกันได้) · ต่อท้ายด้วยธาตุ', formula: '1 มานา + ค่าธาตุ' },
  spear: { label: 'หอก', glyph: '➶', description: 'แทงทะลุ 2 ช่องในแนวเดียวกัน ตัวหน้าโดน 80% ตัวหลังโดน 50% · ม่านกันแยกตัว', formula: '1 มานา + ค่าธาตุ · หน้า 80% / หลัง 50%' },
  axe: { label: 'ขวาน', glyph: '⚒', description: 'จามเป้าเดี่ยวด้วยพลัง 80% ข้ามเกราะทั้งหมด (ม่านกันได้) · ต่อท้ายด้วยธาตุ', formula: '1 มานา + ค่าธาตุ · พลัง 80% · ข้ามเกราะ' },
  light: { label: 'เบา', glyph: '⌁', description: 'ลดค่าร่ายคาถาโจมตีลง 1 มานา (ขั้นต่ำ 1) แลกกับดาเมจลดลง 25% ก่อนคิดเกราะ · วางเป็นคำที่ 3 ต่อท้าย [รูปทรง + ธาตุ]', formula: 'รูปทรง ธาตุ เบา · −1 มานา · พลัง −25%' },
  delay: { label: 'หน่วง', glyph: '⌛', cost: 2, shieldHp: 4, description: 'กางโล่ 4 หน่วย 1 ชั้นที่ต้นเทิร์นถัดไป (ชั้นโล่อยู่ได้ 2 เทิร์น) · เฉพาะวลี “หน่วง โล่” (2 มานา)', formula: 'หน่วง โล่ · 2 มานา · ต้นเทิร์นหน้ากางโล่ 4' },
  fire: { label: 'ไฟ', glyph: '♨', damage: 10, cost: 2, description: 'โจมตีธาตุไฟพลัง 10 ทันที (ชนะน้ำแข็ง +25% / แพ้น้ำ -20%) · 2 มานา', formula: 'พลัง 10 · 2 มานา' },
  ice: { label: 'น้ำแข็ง', glyph: '❄', damage: 6, cost: 2, description: 'โจมตีธาตุน้ำแข็งพลัง 6 และลดพลังโจมตีครั้งถัดไปของเป้าหมาย 4 หน่วย (ชนะลม +25% / แพ้ไฟ -20%) · 2 มานา', formula: 'พลัง 6 · ลดโจมตี 4 · 2 มานา' },
  lightning: { rarity: 'common', label: 'สายฟ้า', glyph: 'ϟ', damage: 8, cost: 2, description: 'โจมตีธาตุสายฟ้าพลัง 8 ข้ามเกราะ 2 หน่วย (เป้าเปียกแรงขึ้น +2, ชนะน้ำ +25% / แพ้ดิน -20%) · 2 มานา', formula: 'พลัง 8 · เจาะเกราะ 2 · 2 มานา' },
  earth: { label: 'ดิน', glyph: '◆', damage: 7, cost: 2, description: 'โจมตีธาตุดินพลัง 7 มอบเกราะชั่วคราว 2 หน่วย และทุบเกราะเป้าหมายถาวร 1 หน่วย (ชนะสายฟ้า +25% / แพ้ลม -20%) · 2 มานา', formula: 'พลัง 7 · เกราะ 2 / ทุบเกราะ 1 · 2 มานา' },
  water: { label: 'น้ำ', glyph: '≈', damage: 6, cost: 2, description: 'โจมตีธาตุน้ำพลัง 6 ฟื้นฟู 2 HP และทำให้เป้าหมายเปียกจนจบเทิร์นถัดไป (ชนะไฟ +25% / แพ้สายฟ้า -20%) · 2 มานา', formula: 'พลัง 6 · ฮีล 2 / เปียก · 2 มานา' },
  wind: { label: 'ลม', glyph: '≋', damage: 7, cost: 2, description: 'โจมตีธาตุลมพลัง 7 ผลักเป้าหมายถอย 1 ช่อง หากชนศัตรูหรือชนขอบเกิดดาเมจกระแทกทะลุเกราะ 3 (ชนศัตรูโดนทั้งคู่, ชนะดิน +25% / แพ้น้ำแข็ง -20%) · 2 มานา', formula: 'พลัง 7 · ผลัก 1 ช่อง (กระแทก 3) · 2 มานา' },
  akki: { rarity: 'special', label: 'อัคคี', glyph: '♨', damage: 20, cost: 5, description: 'โจมตีอัคคีพลัง 20 ตัดฮีลเป้าหมาย 50% จนจบเทิร์นถัดไป · 5 มานา', formula: 'พลัง 20 · ตัดฮีล 50% · 5 มานา' },
  heman: { rarity: 'special', label: 'เหมันต์', glyph: '❄', damage: 12, cost: 5, description: 'โจมตีเหมันต์พลัง 12 และลดพลังโจมตีของเป้าหมาย 4 หน่วย ส่งผลต่อเนื่อง 2 ครั้ง · 5 มานา', formula: 'พลัง 12 · ลดโจมตี 4 (2 ครั้ง) · 5 มานา' },
  asani: { rarity: 'special', label: 'อัสนี', glyph: 'ϟ', damage: 16, cost: 5, description: 'โจมตีอัสนีพลัง 16 ข้ามเกราะ 2 หน่วย และชิ่งใส่ศัตรูช่องติดกัน 1 ตัวด้วยพลัง 50% · 5 มานา', formula: 'พลัง 16 · เจาะเกราะ 2 · ชิ่ง 50% · 5 มานา' },
  pathaphi: { rarity: 'special', label: 'ปฐพี', glyph: '◆', damage: 14, cost: 5, description: 'โจมตีปฐพีพลัง 14 มอบเกราะชั่วคราว 4 หน่วย และทุบเกราะเป้าหมายถาวร 2 หน่วย · 5 มานา', formula: 'พลัง 14 · เกราะ 4 / ทุบเกราะ 2 · 5 มานา' },
  wari: { rarity: 'special', label: 'วารี', glyph: '≈', damage: 12, cost: 5, description: 'โจมตีวารีพลัง 12 ฟื้นฟู 4 HP และทำให้เป้าหมายรวมถึงช่องติดกันเปียกจนจบเทิร์นถัดไป · 5 มานา', formula: 'พลัง 12 · ฮีล 4 / เปียกหมู่ · 5 มานา' },
  vayu: { rarity: 'special', label: 'วายุ', glyph: '≋', damage: 14, cost: 5, description: 'โจมตีวายุพลัง 14 ผลักเป้าหมายถอย 1 ช่อง หากชนศัตรูหรือชนขอบเกิดดาเมจกระแทกทะลุเกราะ 6 (ชนศัตรูโดนทั้งคู่) · 5 มานา', formula: 'พลัง 14 · ผลัก 1 ช่อง (กระแทก 6) · 5 มานา' },
  magma: { rarity: 'epic', label: 'แมกม่า', glyph: '♨', damage: 22, cost: 7, description: 'โจมตีแมกม่าพลัง 22 และทิ้งแอ่งไว้ หลังผู้เล่นลงมือในเทิร์นถัดไปจะปะทุใส่ช่องนั้นพลัง 6 พร้อมทุบเกราะ 2 หน่วยถาวร · 7 มานา', formula: 'พลัง 22 · แอ่งปะทุ 6 (ทุบเกราะ 2) · 7 มานา' },
  mudmire: { rarity: 'epic', label: 'บึงโคลน', glyph: '◆', damage: 18, cost: 7, description: 'โจมตีบึงโคลนพลัง 18 ทำให้เป้าหมายเปียกจนจบเทิร์นถัดไป และลดพลังโจมตีครั้งถัดไป 3 หน่วย · 7 มานา', formula: 'พลัง 18 · เปียก · ลดโจมตี 3 · 7 มานา' },
  dust: { rarity: 'epic', label: 'ธุลี', glyph: '≋', damage: 18, cost: 7, description: 'โจมตีธุลีพลัง 18 ทุบเกราะเป้าหมาย 1 หน่วยถาวร และผลักถอย 1 ช่อง หากชนศัตรูหรือชนขอบเกิดดาเมจกระแทกทะลุเกราะ 6 (ชนศัตรูโดนทั้งคู่) · 7 มานา', formula: 'พลัง 18 · ทุบเกราะ 1 · ผลัก 1 ช่อง (กระแทก 6) · 7 มานา' },
  permafrost: { rarity: 'epic', label: 'เยือกศิลา', glyph: '❄', damage: 18, cost: 7, description: 'โจมตีเยือกศิลาพลัง 18 มอบเกราะชั่วคราวให้ผู้ร่าย 6 หน่วย และทำลายเกราะเป้าหมาย 2 หน่วยถาวร · 7 มานา', formula: 'พลัง 18 · เกราะ 6 / ทุบเกราะ 2 · 7 มานา' },
  magnet: { rarity: 'epic', label: 'แม่เหล็ก', glyph: 'ϟ', damage: 18, cost: 7, description: 'โจมตีแม่เหล็กพลัง 18 ข้ามเกราะ 2 หน่วย และดูดศัตรูข้างเคียงเข้ามาชนเป้าหลัก (ชนกันกระแทกทะลุเกราะ 6 ทั้งสองตัว) · 7 มานา', formula: 'พลัง 18 · ข้ามเกราะ 2 · ดูดชน 6 · 7 มานา' },
  mist: { rarity: 'epic', label: 'หมอก', glyph: '≋', damage: 18, cost: 7, description: 'โจมตีหมอกพลัง 18 ทำให้เป้าหมายเปียกจนจบเทิร์นถัดไป และบดบังลดพลังโจมตีครั้งถัดไป 4 หน่วย · 7 มานา', formula: 'พลัง 18 · เปียก · ลดโจมตี 4 · 7 มานา' },
  hail: { rarity: 'epic', label: 'หิมะ', glyph: '❆', damage: 18, cost: 7, description: 'โจมตีหิมะพลัง 18 หากเป้าเปียกจะล้างสถานะเปียกและแช่แข็งข้ามการโจมตี 1 ครั้งทันที หากเป้าแห้งจะติดหนาวลดพลังโจมตีครั้งถัดไป 2 หน่วย · 7 มานา', formula: 'พลัง 18 · เปียกแช่แข็ง / แห้งหนาว 2 · 7 มานา' },
  monsoon: { rarity: 'epic', label: 'มรสุม', glyph: '≈', damage: 18, cost: 7, description: 'โจมตีมรสุมพลัง 18 ฟื้นฟู 4 HP ให้ผู้ร่าย ทำให้เป้าหมายเปียกจนจบเทิร์นถัดไป และผลักศัตรูทั้งหมด 1 ช่อง (ชนกันกระแทกทะลุเกราะ 6 ทั้งสองตัว) · 7 มานา', formula: 'พลัง 18 · ฮีล 4 · เปียก · ผลักทั้งสนาม (กระแทก 6) · 7 มานา' },
  shockstream: { rarity: 'epic', label: 'กระแสช็อต', glyph: 'ϟ', damage: 18, cost: 7, description: 'โจมตีกระแสช็อตพลัง 18 ข้ามเกราะ 2 หน่วย และช็อตสายฟ้าทะลวงเป้าหมายที่เปียกทั้งหมดในสนามพลัง 10 (ข้ามเกราะ 2 หน่วย) · 7 มานา', formula: 'พลัง 18 · ข้ามเกราะ 2 · ช็อตเปียก 10 · 7 มานา' },
  thunderstorm: { rarity: 'epic', label: 'ฟ้าคะนอง', glyph: 'ϟ', damage: 20, cost: 7, description: 'โจมตีฟ้าคะนองพลัง 20 ข้ามเกราะ 2 หน่วย ผลักเป้าหมายถอย 1 ช่อง (ชนศัตรูกระแทกทะลุเกราะ 6 ทั้งคู่) และชิ่งครึ่งพลังหาเป้าข้างเคียง 1 ตัว · 7 มานา', formula: 'พลัง 20 · ข้ามเกราะ 2 · ผลัก 1 ช่อง · ชิ่ง 50% · 7 มานา' },
  heatwave: { rarity: 'epic', label: 'ระอุ', glyph: '♨', damage: 22, cost: 7, description: 'โจมตีระอุพลัง 22 ผลักเป้าหมายถอย 1 ช่อง (ชนศัตรูกระแทกทะลุเกราะ 6 ทั้งคู่) และเผาไหม้ 4 หน่วยกระจายใส่ศัตรูช่องข้างเคียง · 7 มานา', formula: 'พลัง 22 · ผลัก 1 ช่อง · เผาข้างเคียง 4 · 7 มานา' },
  chillgale: { rarity: 'epic', label: 'ไอหนาว', glyph: '❄', damage: 18, cost: 7, description: 'โจมตีไอหนาวพลัง 18 ผลักเป้าหมายถอย 1 ช่อง (ชนศัตรูกระแทกทะลุเกราะ 6 ทั้งคู่) และลดพลังโจมตี 4 หน่วย ส่งผลต่อการโจมตี 2 ครั้งถัดไป · 7 มานา', formula: 'พลัง 18 · ผลัก 1 ช่อง · หนาว 4 (2 ครั้ง) · 7 มานา' },
  plasma: { rarity: 'epic', label: 'พลาสมา', glyph: '✦', damage: 24, cost: 7, description: 'โจมตีพลาสมาพลัง 24 ข้ามเกราะ 2 หน่วย เน้นดาเมจเดี่ยวรุนแรง · 7 มานา', formula: 'พลัง 24 · ข้ามเกราะ 2 · 7 มานา' },
  scald: { rarity: 'epic', label: 'ไอเดือด', glyph: '♨', damage: 20, cost: 7, description: 'โจมตีไอเดือดพลัง 20 ทุบเกราะเป้าหมายถาวร 2 หน่วย และทำให้ชะงัก · 7 มานา', formula: 'พลัง 20 · ทุบเกราะ 2 · 7 มานา' },
  frostvolt: { rarity: 'epic', label: 'ผลึกช็อต', glyph: '❆', damage: 20, cost: 7, description: 'โจมตีผลึกช็อตพลัง 20 ข้ามเกราะ 2 หน่วย ลดพลังโจมตีครั้งถัดไป 4 หน่วย และชิ่งสายฟ้าแช่แข็งใส่เป้าข้างเคียงพร้อมติดหนาว 4 หน่วย · 7 มานา', formula: 'พลัง 20 · ข้ามเกราะ 2 · ชิ่ง 50% · หนาว 4 · 7 มานา' },
  pair: { label: 'คู่', glyph: 'Ⅱ', description: 'ร่ายเวทสองครั้ง หรือเชื่อมสองธาตุเป็นเวทเดียว พายุระลอกสองใช้แรง 60% โล่กาง 2 ชั้น', formula: 'ร่ายสองครั้งคิดมานา ×2 · พายุ +3 · ผสานลด 1' },
  barrage: { rarity: 'legendary', label: 'กระหน่ำ', glyph: 'Ⅴ', description: 'วางไว้ท้ายสุดของคาถาโจมตีเท่านั้น (ห้ามใช้ร่วมกับคู่/ทำลายล้าง/หลุมดำ/ตาย) ปล่อยพลังนั้นซ้ำ 5 ครั้งต่อเนื่อง · ค่าร่าย ×3.5', formula: 'ท้ายประโยคเท่านั้น · โจมตี 5 ครั้ง · ค่าร่าย ×3.5' },
  blast: { rarity: 'rare', label: 'ระเบิด', glyph: '✹', damage: 6, cost: 4, description: 'วางต้นคาถาเพื่อยิงลูกระเบิด หรือวางต่อท้ายคาถาโจมตี (+2 มานา) เพื่อระเบิดกระจายดาเมจ 50% ใส่ช่องข้างเคียง (หรือสั่งระเบิดโล่ไฟ 2 มานา)', formula: 'ร่ายเดี่ยว 4 มานา · ลูกระเบิด +1 · คำต่อท้าย +2' },
  devastation: { rarity: 'legendary', label: 'ทำลายล้าง', glyph: '✷', cost: 5, description: 'ใช้เป็นคำสุดท้ายของคาถาโจมตีเท่านั้น (+5 มานา · ห้ามใช้ร่วมกับกระหน่ำ) เพิ่มแรงโจมตีเป็น 2 เท่าและระเบิดซ้ำครึ่งพลังในรัศมี 2 ช่อง', formula: '+5 มานา · พลัง ×2 · ระเบิดรัศมี 2 ช่อง' },
  blackhole: { rarity: 'legendary', label: 'หลุมดำ', glyph: '◉', cost: 20, description: 'เลือกช่อง ดูดศัตรูทั้งหมดเข้าจุดศูนย์กลาง ชนกันกระแทก 100 ต่อตัว ทะลุเกราะและม่าน เทิร์นถัดไปยังยุบตัวทำดาเมจแท้ 300 (ช่องข้าง 150) · 20 มานา', formula: '20 มานา · กระแทก 100 · ยุบ 300 / ข้าง 150 · ทะลุเกราะ/ม่าน' },
  death: { rarity: 'legendary', label: 'ตาย', glyph: '†', cost: 10, description: 'ปลิดชีพศัตรูธรรมดา 1 ตัวทันที ทะลุเกราะและม่านทั้งหมด (หากใช้กับบอสทำดาเมจแท้ 100) ใช้สำเร็จได้ครั้งเดียวต่อศึก · 10 มานา', formula: '10 มานา · ปลิดชีพทันที / บอส 100 แท้ · ข้ามม่าน/เกราะ · ครั้งเดียวต่อศึก' },
  timestop: { rarity: 'legendary', label: 'หยุดเวลา', glyph: '◷', cost: 10, description: 'ร่ายเดี่ยวเพื่อหยุดเวลาข้ามเทิร์นศัตรู 1 รอบ แล้วต่อเทิร์นผู้เล่นทันที ใช้ได้ครั้งเดียวต่อศึก · 10 มานา', formula: '10 มานา · ข้ามรอบศัตรู 1 ครั้ง · ครั้งเดียวต่อศึก' },
  ascension: { rarity: 'legendary', label: 'จุติ', glyph: '✺', cost: 8, description: 'ร่ายเดี่ยวเพื่อเตรียมจุติ เมื่อรอดถึงเทิร์นถัดไป การ์ดบนมือเป็น +10 ชั่วคราวและร่ายฟรี 1 เทิร์น ใช้ได้ครั้งเดียวต่อศึก · 8 มานา (ลดตาม +Lv)', formula: '8 มานา (ลดตาม +Lv) · เทิร์นหน้าการ์ด +10 & ร่ายฟรี · ครั้งเดียวต่อศึก' },
  meteor: { rarity: 'epic', label: 'อุกกาบาต', glyph: '✹', cost: 9, description: 'อุกกาบาตตกแบบสุ่มตำแหน่ง 3 ครั้ง ทำดาเมจเป้าหลัก 24 และกระจายช่องติดกัน 12 ต่อลูก ข้ามม่านแล้วหักเกราะตามปกติ · 9 มานา', formula: '9 มานา · สุ่มตก 3 ครั้ง · หลัก 24 / กระจาย 12 · ข้ามม่าน' },
  veil: { rarity: 'epic', label: 'ม่าน', glyph: '▣', cost: 7, description: 'กางม่านรับความเสียหาย 14 หน่วย อยู่ถึงจบเทิร์นถัดไป เมื่อการโจมตีทำให้ม่านแตก กันส่วนที่ล้นเพิ่มได้อีกสูงสุด 8 หน่วย · 7 มานา', formula: '7 มานา · กัน 14 + กันส่วนล้นสูงสุด 8' },
  shield: { label: 'โล่', glyph: '⬡', description: 'กางโล่ป้องกัน 6 หน่วยต่อชั้น ชั้นโล่อยู่ได้นาน 2 เทิร์น (ใช้ส่วนที่เหลือได้อีก 1 เทิร์น) · 3 มานา', formula: '3 มานา · ป้องกัน 6 หน่วย (2 เทิร์น)' },
  chakram: { rarity: 'epic', label: 'กรงจักร', glyph: '❂', cost: 3, description: 'ขว้างกรงจักรเจาะเป้าเดี่ยวรุนแรง พลัง 180% ของธาตุ (ม่านกันได้) ไม่กระจายดาเมจออกนอกหากไม่เสริมวลีอื่น · 3 มานา + ค่าธาตุ', formula: '3 มานา + ค่าธาตุ · เป้าเดี่ยว 180%' },
  beam: { rarity: 'rare', label: 'ลำแสง', glyph: '━', description: 'ยิงลำแสงทะลุม่าน โจมตีเป้าหมายเดี่ยวโดยตรงไม่ติดม่าน · 2 มานา + ค่าธาตุ', formula: '2 มานา + ค่าธาตุ · ทะลุม่าน' },
  wave: { rarity: 'rare', label: 'คลื่น', glyph: '≈', description: 'ซัดคลื่นโจมตีศัตรูทุกตัวในสนามเท่ากันด้วยพลัง 60% ของธาตุ (ม่านของแต่ละตัวกันได้แยกกัน) · 3 มานา + ค่าธาตุ', formula: '3 มานา + ค่าธาตุ · โจมตีทุกตัว 60%' },
  storm: { rarity: 'epic', label: 'พายุ', glyph: '◉', damage: 12, cost: 5, description: 'ร่ายพายุโจมตีเป้าหลักและกระจายช่องซ้ายขวา ร่ายเดี่ยวทำดาเมจ 12/6 หรือเติมธาตุเพื่อทำดาเมจ 150%/75% พร้อมเอฟเฟกต์ธาตุ (ม่านของแต่ละตัวกันได้แยกกัน) · 5 มานา + ค่าธาตุ', formula: '5 มานา + ค่าธาตุ · เดี่ยว 12/6 · เติมธาตุ 150%/75%' },
  heal: { rarity: 'rare', label: 'ฮีล', glyph: '+', description: 'ร่าย “ฮีล ตัวเอง” เพื่อฟื้นฟู 4 HP ทันที หรือร่าย “โล่ ฮีล” เพื่อกางโล่พร้อมฟื้นเลือด · 3 มานา (ฮีล ตัวเอง)', formula: 'ฮีล ตัวเอง 3 มานา (4 HP) · โล่ ฮีล 5 มานา' },
  self: { label: 'ตัวเอง', glyph: '◇', description: 'ใช้ต่อท้าย “ฮีล” เพื่อรักษาตัวเอง', formula: 'ใช้ต่อท้ายฮีล' },
  empower: { rarity: 'rare', label: 'เสริม', glyph: '▲', cost: 2, description: 'เสริมพลังธาตุที่ร่ายให้ผู้ร่ายเป็นเวลา 3 เทิร์น (+25% / ขั้นสอง +40% / ผสาน +45%) ต่อ “ใหญ่” หรือขึ้นต้น “มหา” ได้ · 2 มานา + ค่าธาตุ', formula: '2 มานา + ค่าธาตุ · บัฟพลังธาตุ 3 เทิร์น' },
  bless: { rarity: 'special', label: 'อวยพร', glyph: '✧', cost: 3, description: 'อวยพรพลังธาตุระดับสูงให้ผู้ร่ายเป็นเวลา 3 เทิร์น (+40% / ขั้นสอง +60% / ผสาน +70%) พร้อมมอบเจาะเกราะ +1 ต่อ “ใหญ่” หรือขึ้นต้น “มหา” ได้ · 3 มานา + ค่าธาตุ', formula: '3 มานา + ค่าธาตุ · บัฟพลังธาตุแรง 3 เทิร์น + เจาะเกราะ' },
  fill: { label: 'เติม', glyph: '◈', cost: 1, description: 'ใช้คู่กับ “เลือด” (3 มานา ฟื้น 7 HP) หรือ “มานา” (1 มานา ฟื้น 6 MP) · ต่อท้าย “ใหญ่” ได้เท่านั้น ห้ามใช้ร่วมกับ “มหา”', formula: 'เติม เลือด 3 มานา (7 HP) · เติม มานา 1 มานา (+6 MP)' },
  blood: { label: 'เลือด', glyph: '♥', cost: 2, description: 'ร่ายเดี่ยวไม่ได้ · ใช้ต่อท้าย “เติม” เพื่อฟื้นฟูพลังชีวิต (7 HP · เติม เลือด ใหญ่ 12 HP) · รวมค่าร่าย 3 มานา', formula: 'ใช้คู่ “เติม” (3 มานา) · ฟื้น 7 HP (ใหญ่ 12 HP)' },
  mana: { label: 'มานา', glyph: '◆', cost: 0, description: 'ร่ายเดี่ยวไม่ได้ · ใช้ต่อท้าย “เติม” เพื่อฟื้นฟูมานาทันที (+6 MP · เติม มานา ใหญ่ +10 MP) · รวมค่าร่าย 1 มานา', formula: 'ใช้คู่ “เติม” (1 มานา) · ฟื้น +6 MP (ใหญ่ +10 MP)' },
  burn: { rarity: 'rare', label: 'เผา', glyph: '♨', description: 'ต่อท้ายคาถาโจมตีเพื่อเผาไหม้เป้าหมาย 3 หน่วยก่อนศัตรูลงมือในแต่ละเทิร์น (ผลเผาไหม้ทับซ้อนได้) · +1 มานา', formula: '+1 มานา · เผาไหม้ 3 หน่วย' },
  freeze: { rarity: 'special', label: 'แช่แข็ง', glyph: '❆', description: 'ต่อท้ายลูกหรือลำแสงตระกูลน้ำแข็ง ทำให้เป้าหมายถูกแช่แข็งข้ามการโจมตี 1 ครั้งทันที · +3 มานา', formula: '+3 มานา · ข้ามการโจมตี 1 ครั้ง' },
  push: { rarity: 'rare', label: 'ผลัก', glyph: '›', description: 'ต่อท้ายคาถาโจมตี เลื่อนเป้าถอย 1 ช่อง (ใช้กับธาตุลมผลัก 2 ช่อง) หากผลักชนศัตรูจะเกิดดาเมจกระแทกทะลุเกราะ 8 ใส่ทั้งคู่ (ชนขอบ 4 · แรงขึ้นตามตัวคูณคาถา) · +1 มานา', formula: '+1 มานา · ชนศัตรู 8×2 (ทะลุเกราะ) · ชนขอบ 4' },
  pull: { rarity: 'rare', label: 'ดึง', glyph: '‹', description: 'ต่อท้ายคาถาโจมตี ดึงเป้าเข้าหาผู้ร่าย 1 ช่อง หากดึงชนศัตรูข้างหน้าจะเกิดดาเมจกระแทกทะลุเกราะ 8 ใส่ทั้งคู่ (ชนขอบหน้า 4 · แรงขึ้นตามตัวคูณคาถา) · +1 มานา', formula: '+1 มานา · ดึงชนศัตรู 8×2 (ทะลุเกราะ) · ชนขอบหน้า 4' },
  pierce: { rarity: 'special', label: 'ทะลวง', glyph: '↠', description: 'ต่อท้ายลูก คลื่น หรือพายุ เพื่อข้ามเกราะเป้าหมายเพิ่ม 2 หน่วย ทั้งตอนกระทบและระเบิด · +1 มานา', formula: '+1 มานา · เจาะเกราะ 2' },
  large: { rarity: 'rare', label: 'ใหญ่', glyph: '⬢', description: 'เพิ่มพลังคาถาโจมตี 1.5 เท่า เพิ่มโล่เป็น 9 หน่วยต่อชั้น หรือเพิ่มฮีลทันทีเป็น 8 HP (เติมเลือดใหญ่ 12 HP / เติมมานาใหญ่ 10 MP) · +2 มานา', formula: '+2 มานา · โจมตี ×1.5 · โล่ 9 · ฮีล 8' },
  grand: { rarity: 'special', label: 'มหา', glyph: '✦', description: 'วางหน้าคาถาโจมตีเพื่อเพิ่มพลัง มหาระเบิดขยายรัศมี มหาโล่และมหาโล่คู่เติมโล่ต้นเทิร์นถัดไป มหาฮีลฟื้นเลือดต่อเนื่อง · +3 มานา (โจมตี)', formula: 'โจมตี +3 มานา · มหาลูกคู่ +6 · มหาพายุคู่ +5 · มหาโล่ 6 / คู่ 12 · มหาฮีล 7' },
  seal: { rarity: 'special', label: 'ผนึก', glyph: '⌑', description: 'ต่อท้ายลูกธาตุเพื่อหยุดการฮีล เติมม่าน หรือสลับช่องครั้งถัดไปเมื่อโจมตีโดนเป้าหมาย · +2 มานา', formula: '+2 มานา · ผนึกฮีล/ม่าน/สลับช่อง' },
  dispel: { rarity: 'special', label: 'สลาย', glyph: '✧', description: 'ต่อท้ายลูกธาตุเพื่อสลายม่านของเป้าหมายทั้งหมดก่อนคาถานี้กระทบ · +2 มานา', formula: '+2 มานา · สลายม่านทั้งหมด' },
  brace: { rarity: 'special', label: 'ยืนหยัด', glyph: '▣', description: 'ต่อท้ายโล่เพื่อกางโล่ 6 หน่วย และหากรับการโจมตีแรงตั้งแต่ 10 ขึ้นไปครั้งแรก จะมอบเกราะป้องกันเพิ่มอีก 6 หน่วยทันที · 4 มานา', formula: 'โล่ ยืนหยัด · 4 มานา · โล่ 6 (เกณฑ์ ≥10 รับเพิ่ม +6)' },
  summon: {
    rarity: 'common',
    label: 'อัญเชิญ',
    glyph: '⛧',
    cost: 3,
    role: 'summon',
    description: 'อัญเชิญสัตว์มายืนแนวหน้า รับดาเมจเดี่ยวแทนผู้เล่นและสวนกลับครั้งแรกที่โดนตี ถ้ารอดจะตีตามในเทิร์นถัดไป (ม่านที่โดนสัตว์ตีจะหยุดฟื้น 1 เทิร์น) · 3 มานา + ค่าสัตว์ + ค่าธาตุ',
    formula: '3 มานา + ค่าสัตว์ + ค่าธาตุ · อยู่ 2 เทิร์น',
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

export function getCardCapabilityBadge(wordId) {
  const badges = {
    shot: 'เป้าเดี่ยว',
    spear: 'แทง 2 ช่อง',
    axe: 'ข้ามเกราะ',
    light: 'ลดร่าย 1 MP',
    delay: 'หน่วงโล่',
    fire: 'ดาเมจตรง',
    ice: 'หนาว',
    lightning: 'เจาะเกราะ 2',
    earth: 'เกราะ+ทุบ',
    water: 'ฮีล/เปียก',
    wind: 'ผลักชน',
    akki: 'ตัดฮีล 50%',
    heman: 'หนาว 2 ครั้ง',
    asani: 'ชิ่ง 50%',
    pathaphi: 'เกราะ+ทุบ 2',
    wari: 'ฮีล/เปียกหมู่',
    vayu: 'ผลักชน 6',
    magma: 'แอ่งปะทุ',
    mudmire: 'เปียก/หนาว',
    dust: 'ทุบ+ผลักชน',
    permafrost: 'ทุบ 2/เกราะ 6',
    magnet: 'เจาะ 2/ดูดชน 6',
    mist: 'เปียก/ลดโจมตี 4',
    hail: 'แช่แข็งเปียก/หนาว 2',
    monsoon: 'ผลักหมู่/เปียก/ฮีล 4',
    shockstream: 'เจาะ 2/ช็อตเปียก 10',
    thunderstorm: 'เจาะ 2/ผลัก/ชิ่ง 50%',
    heatwave: 'ผลัก/เผาข้างเคียง 4',
    chillgale: 'ผลัก/หนาว 4 (2 ครั้ง)',
    plasma: 'ดาเมจ 24/เจาะ 2',
    scald: 'ทุบเกราะ 2/ชะงัก',
    frostvolt: 'เจาะ 2/ชิ่ง 50%/หนาว 4',
    pair: 'ร่าย 2 ครั้ง/คู่ธาตุ',
    barrage: 'ยิง 5 ครั้ง/ร่าย ×3.5',
    blast: 'กระจายข้าง 50%',
    devastation: 'พลัง ×2/รัศมี 2 ช่อง',
    blackhole: 'ดูด 100/ยุบ 300',
    death: 'ปลิดชีพ/บอส 100 แท้',
    timestop: 'ข้ามรอบศัตรู 1 รอบ',
    ascension: 'จุติ +10/ร่ายฟรี',
    meteor: 'สุ่มตก 3 ครั้ง/ข้ามม่าน',
    veil: 'ม่าน 14/กันล้น 8',
    shield: 'โล่ 6/อยู่ 2 เทิร์น',
    chakram: 'เป้าเดี่ยว 180%',
    beam: 'ทะลุม่าน',
    wave: 'โจมตีหมู่ (ทุกตัว)',
    storm: 'กระจายข้าง 150%/75%',
    heal: 'ฟื้นฟู 4 HP',
    self: 'เป้าหมายผู้ร่าย',
    empower: 'บัฟธาตุ 3 เทิร์น',
    bless: 'บัฟแรง+เจาะ 1 (3 เทิร์น)',
    fill: 'เติมเลือด/มานา',
    blood: 'ฟื้นฟู 7 HP',
    mana: 'ฟื้นฟู 6 MP',
    burn: 'เผา 3 เทิร์นหน้า',
    freeze: 'ข้ามโจมตี 1 ครั้ง',
    push: 'ผลัก 1 ช่อง (ชน 8)',
    pull: 'ดึง 1 ช่อง (ชน 8)',
    pierce: 'เจาะเกราะ 2',
    large: 'พลัง ×1.5 / โล่/ฮีล +',
    grand: 'ขยายพลังขั้นสุด',
    seal: 'ผนึกฮีล/ม่าน/สลับ',
    dispel: 'สลายม่านทั้งหมด',
    brace: 'โล่ 6/กันแรง ≥10',
    summon: 'อัญเชิญ 2 เทิร์น',
    dog: 'เจาะเกราะ 2/จั่ว',
    bird: 'ข้ามม่าน/หลบ 20%',
    cat: 'คริติคอล ×1.5',
    snake: 'กัดซ้ำ 4 ข้ามเกราะ',
    slime: 'แตกติดหนาว 4',
    bat: 'สวนฟื้น 2 HP',
    turtle: 'เกราะ 1/แจกโล่ 8',
    frog: 'เปียก/เจาะเกราะ 2',
    spider: 'สวนติดหนาว 3',
    rat: 'ทุบ 1/ตัดฮีล 50%',
    wolf: 'เผา 4/ลดแรงโจมตี',
    bear: 'เกราะ 1/ผลัก/ทุบ 2',
    eagle: 'ข้ามม่าน/กระจาย 35%',
    boar: 'สวนเจาะ 4/ข้ามเกราะ',
    croc: 'เกราะ 1/เปียก ×1.5',
    skeleton: 'เจาะ 3/แตกยิง 14',
    hornet: 'ต่อพิษ 6/ข้ามเกราะ',
    golem: 'เกราะ 2/ทุบ 2/สตั๊น',
    lion: 'แผงคอลด 3/คริ ×1.5',
    siren: 'ม่าน 1/เปียก/สลายม่าน',
    gargoyle: 'เกราะ 3/สกัด AoE',
    sprite: 'คืน 2 MP/จั่ว/ฮีล 12',
    hydra: 'ฟื้น 6 HP/ตีช่องติด',
    behemoth: 'เกราะ 4/สกัด AoE/ทุบหมู่',
    kraken: 'หนาว 6/สลายม่าน',
    dragon: 'เกราะ 3/ม่าน 1/ข้ามม่าน',
    phoenix: 'ม่าน 2/ชุบชีวิตเต็ม',
  };
  return badges[wordId] ?? (WORDS[wordId]?.label ?? wordId);
}

export function getCardDynamicStats(wordId, level = 0) {
  const lv = Math.max(0, level);
  switch (wordId) {
    case 'shot':
      return { level: lv, damageBonus: lv };
    case 'spear':
      return { level: lv, damageBonus: lv, pierce: Math.floor(lv / 3) };
    case 'axe':
      return { level: lv, damageBonus: lv };
    case 'light':
      return { level: lv, penalty: lightDamagePenalty(lv) };
    case 'delay':
      return { level: lv, shield: (WORDS.delay?.shieldHp ?? 4) + lv };
    case 'fire':
      return { level: lv, damage: (WORDS.fire?.damage ?? 10) + lv };
    case 'ice':
      return { level: lv, damage: (WORDS.ice?.damage ?? 6) + lv, chill: 4 + Math.floor(lv / 3) };
    case 'lightning':
      return { level: lv, damage: (WORDS.lightning?.damage ?? 8) + lv, pierce: 2 };
    case 'earth':
      return { level: lv, damage: (WORDS.earth?.damage ?? 7) + lv, block: 2 + Math.floor(lv / 2), shred: 1 };
    case 'water':
      return { level: lv, damage: (WORDS.water?.damage ?? 6) + lv, heal: 2 + Math.floor(lv / 2) };
    case 'wind':
      return { level: lv, damage: (WORDS.wind?.damage ?? 7) + lv, slam: 3 + Math.floor(lv / 2) };
    case 'akki':
      return { level: lv, damage: (WORDS.akki?.damage ?? 20) + lv * 2, healCut: 50 };
    case 'heman':
      return { level: lv, damage: (WORDS.heman?.damage ?? 12) + lv * 2, chill: 4 + Math.floor(lv / 2) };
    case 'asani':
      return { level: lv, damage: (WORDS.asani?.damage ?? 16) + lv * 2, pierce: 2, chainPct: 50 };
    case 'pathaphi':
      return { level: lv, damage: (WORDS.pathaphi?.damage ?? 14) + lv * 2, block: 4 + lv, shred: 2 };
    case 'wari':
      return { level: lv, damage: (WORDS.wari?.damage ?? 12) + lv * 2, heal: 4 + lv };
    case 'vayu':
      return { level: lv, damage: (WORDS.vayu?.damage ?? 14) + lv * 2, slam: 6 + lv };
    case 'magma':
      return { level: lv, damage: (WORDS.magma?.damage ?? 22) + lv * 2, eruptDmg: 6 + lv * 2, shred: 2 };
    case 'mudmire':
      return { level: lv, damage: (WORDS.mudmire?.damage ?? 18) + lv * 2, chill: 3 + Math.floor(lv / 2), block: lv };
    case 'dust':
      return { level: lv, damage: (WORDS.dust?.damage ?? 18) + lv * 2, slam: 6 + lv, shred: 1 };
    case 'permafrost':
      return { level: lv, damage: (WORDS.permafrost?.damage ?? 18) + lv * 2, block: 6 + lv * 2, shred: 2 };
    case 'magnet':
      return { level: lv, damage: (WORDS.magnet?.damage ?? 18) + lv * 2, pierce: 2, slam: 6 + lv * 2 };
    case 'mist':
      return { level: lv, damage: (WORDS.mist?.damage ?? 18) + lv * 2, reduceAtk: 4, burn: lv, chill: Math.floor(lv / 2) };
    case 'hail':
      return { level: lv, damage: (WORDS.hail?.damage ?? 18) + lv * 2, dryChill: 2 + Math.floor(lv / 2) };
    case 'monsoon':
      return { level: lv, damage: (WORDS.monsoon?.damage ?? 18) + lv * 2, heal: 4 + lv, slam: 6 + lv };
    case 'shockstream':
      return { level: lv, damage: (WORDS.shockstream?.damage ?? 18) + lv * 2, pierce: 2, shockDmg: 10 + lv * 2 };
    case 'thunderstorm':
      return { level: lv, damage: (WORDS.thunderstorm?.damage ?? 20) + lv * 2, pierce: 2, slam: 6 + lv, chainPct: 50 };
    case 'heatwave':
      return { level: lv, damage: (WORDS.heatwave?.damage ?? 22) + lv * 2, nearbyBurn: 4 + lv, slam: 6 + lv };
    case 'chillgale':
      return { level: lv, damage: (WORDS.chillgale?.damage ?? 18) + lv * 2, chill: 4 + Math.floor(lv / 2), slam: 6 + lv };
    case 'plasma':
      return { level: lv, damage: (WORDS.plasma?.damage ?? 24) + lv * 3, pierce: 2 };
    case 'scald':
      return { level: lv, damage: (WORDS.scald?.damage ?? 20) + lv * 2, shred: 2, extra: Math.floor(lv / 2) };
    case 'frostvolt':
      return { level: lv, damage: (WORDS.frostvolt?.damage ?? 20) + lv * 2, pierce: 2, chill: 4 + Math.floor(lv / 2), chainPct: 50 };
    case 'pair':
      return { level: lv, phraseBonus: lv };
    case 'barrage':
      return { level: lv, perHitBonus: lv * 2 };
    case 'blast':
      return { level: lv, blastDmg: (WORDS.blast?.damage ?? 6) + lv * 2 };
    case 'devastation':
      return { level: lv, mainBonus: lv * 2, blastBonus: lv * 3 };
    case 'blackhole':
      return { level: lv, collapsePower: 300 + lv * 15, slamPower: 100 + lv * 5, sidePower: 150 + Math.round(lv * 7.5) };
    case 'death':
      return { level: lv, bossDmg: 100 + lv * 25, manaRefund: lv };
    case 'timestop':
      return { level: lv, manaBonus: lv };
    case 'ascension':
      return { level: lv, cost: ascensionCost(lv) };
    case 'meteor':
      return { level: lv, mainDamage: 24 + lv * 3, splashDamage: 12 + lv * 2, drops: 3 };
    case 'veil':
      return { level: lv, capacity: 14 + lv * 3, overflowGate: 8 + lv * 2 };
    case 'shield':
      return { level: lv, capacity: 6 + lv * 2 };
    case 'chakram':
      return { level: lv, baseBonus: lv * 2, multiplierPct: 180 };
    case 'beam':
      return { level: lv, damageBonus: lv, pierce: Math.floor(lv / 3), pierceWard: true };
    case 'wave':
      return { level: lv, baseBonus: lv * 2, multiplierPct: 60 };
    case 'storm':
      return { level: lv, standaloneCenter: 12 + lv * 2, standaloneSide: 6 + lv, elementBonus: lv * 2 };
    case 'heal':
      return { level: lv, baseHeal: 4 + lv * 2, maxHpPct: Math.floor(lv / 2) };
    case 'self':
      return { level: lv, extraHeal: lv * 2, extraShield: lv };
    case 'empower':
      return { level: lv, bonusPct: lv * 3, basePct: 25 + lv * 3, tier2Pct: 40 + lv * 3, fusedPct: 45 + lv * 3 };
    case 'bless':
      return { level: lv, bonusPct: lv * 4, basePct: 40 + lv * 4, tier2Pct: 60 + lv * 4, fusedPct: 70 + lv * 4, pierce: 1 };
    case 'fill':
      return { level: lv, bloodHeal: 7 + lv, manaGain: 6 + Math.floor(lv / 2) };
    case 'blood':
      return { level: lv, heal: 7 + lv, largeHeal: 12 + lv };
    case 'mana':
      return { level: lv, manaGain: 6 + Math.ceil(lv / 2), largeManaGain: 10 + Math.ceil(lv / 2) };
    case 'burn':
      return { level: lv, burn: 3 + lv * 2 };
    case 'freeze':
      return { level: lv, phraseBonus: lv * 2, chill: Math.floor(lv / 3) };
    case 'push':
      return { level: lv, phraseBonus: lv, slam: 8 + lv, edgeSlam: 4 + lv };
    case 'pull':
      return { level: lv, phraseBonus: lv, slam: 8 + lv, edgeSlam: 4 + lv };
    case 'pierce':
      return { level: lv, phraseBonus: lv, pierce: 2 + Math.floor(lv / 2) };
    case 'large':
      return { level: lv, attackBonus: lv, shieldBonus: 9 + lv * 2, healBonus: 8 + lv * 2 };
    case 'grand':
      return { level: lv, attackBonus: lv * 2, selfBonus: lv * 3 };
    case 'seal':
      return { level: lv, phraseBonus: lv * 2 };
    case 'dispel':
      return { level: lv, phraseBonus: lv * 2 };
    case 'brace':
      return { level: lv, capacity: 6 + lv * 2, braceBonus: 6 + lv * 2 };
    case 'summon':
      return { level: lv, globalHpBonus: lv * 2, globalDmgPct: lv * 2 };
    default:
      if (CREATURE_STATS[wordId]) {
        const stats = CREATURE_STATS[wordId];
        const hpInc = Math.round(stats.growthHp * lv);
        const dmgInc = Number((stats.growthDmg * lv).toFixed(1));
        return {
          level: lv,
          hp: stats.baseHp + hpInc,
          counter: Math.round(stats.baseCounter + dmgInc),
          strike: Math.round(stats.baseStrike + dmgInc),
          armor: stats.armor ?? 0,
          ward: stats.ward ?? 0,
          growthHp: stats.growthHp,
          growthDmg: stats.growthDmg,
        };
      }
      return { level: lv };
  }
}

export function getCardDescription(wordId, level = 0) {
  const lv = Math.max(0, level);
  const s = getCardDynamicStats(wordId, lv);
  switch (wordId) {
    case 'shot':
      return lv > 0
        ? `ยิงกระสุนเดี่ยวใส่เป้าหมาย พลัง 100% ตามธาตุ (ดาเมจพื้นฐาน +${s.damageBonus}) · ม่านกันได้`
        : 'ยิงกระสุนเดี่ยวใส่เป้าหมาย พลัง 100% ตามธาตุ (ม่านกันได้) · ต่อท้ายด้วยธาตุ';
    case 'spear':
      return `แทงทะลุ 2 ช่องในแนวเดียวกัน ตัวหน้าโดน 80% ตัวหลังโดน 50%${s.pierce > 0 ? ` (เจาะเกราะ ${s.pierce})` : ''} · ม่านกันแยกตัว`;
    case 'axe':
      return lv > 0
        ? `จามเป้าเดี่ยวด้วยพลัง 80% ข้ามเกราะทั้งหมด (พลังพื้นฐาน +${s.damageBonus} ก่อนคูณ 80%) · ม่านกันได้`
        : 'จามเป้าเดี่ยวด้วยพลัง 80% ข้ามเกราะทั้งหมด (ม่านกันได้) · ต่อท้ายด้วยธาตุ';
    case 'light':
      return `ลดค่าร่ายคาถาโจมตีลง 1 มานา (ขั้นต่ำ 1) แลกกับดาเมจลดลง ${s.penalty}% ก่อนคิดเกราะ · วางเป็นคำที่ 3 ต่อท้าย [รูปทรง + ธาตุ]`;
    case 'delay':
      return `กางโล่ ${s.shield} หน่วย 1 ชั้นที่ต้นเทิร์นถัดไป (ชั้นโล่อยู่ได้ 2 เทิร์น) · เฉพาะวลี “หน่วง โล่” (2 มานา)`;
    case 'fire':
      return `โจมตีธาตุไฟพลัง ${s.damage} ทันที (ชนะน้ำแข็ง +25% / แพ้น้ำ -20%) · 2 มานา`;
    case 'ice':
      return `โจมตีธาตุน้ำแข็งพลัง ${s.damage} และลดพลังโจมตีครั้งถัดไปของเป้าหมาย ${s.chill} หน่วย (ชนะลม +25% / แพ้ไฟ -20%) · 2 มานา`;
    case 'lightning':
      return `โจมตีธาตุสายฟ้าพลัง ${s.damage} ข้ามเกราะ 2 หน่วย (เป้าเปียกแรงขึ้น +2, ชนะน้ำ +25% / แพ้ดิน -20%) · 2 มานา`;
    case 'earth':
      return `โจมตีธาตุดินพลัง ${s.damage} มอบเกราะชั่วคราว ${s.block} หน่วย และทุบเกราะเป้าหมายถาวร 1 หน่วย (ชนะสายฟ้า +25% / แพ้ลม -20%) · 2 มานา`;
    case 'water':
      return `โจมตีธาตุน้ำพลัง ${s.damage} ฟื้นฟู ${s.heal} HP และทำให้เป้าหมายเปียกจนจบเทิร์นถัดไป (ชนะไฟ +25% / แพ้สายฟ้า -20%) · 2 มานา`;
    case 'wind':
      return `โจมตีธาตุลมพลัง ${s.damage} ผลักเป้าหมายถอย 1 ช่อง หากชนศัตรูหรือชนขอบเกิดดาเมจกระแทกทะลุเกราะ ${s.slam} (ชนศัตรูโดนทั้งคู่, ชนะดิน +25% / แพ้น้ำแข็ง -20%) · 2 มานา`;
    case 'akki':
      return `โจมตีอัคคีพลัง ${s.damage} ตัดฮีลเป้าหมาย 50% จนจบเทิร์นถัดไป · 5 มานา`;
    case 'heman':
      return `โจมตีเหมันต์พลัง ${s.damage} และลดพลังโจมตีของเป้าหมาย ${s.chill} หน่วย ส่งผลต่อเนื่อง 2 ครั้ง · 5 มานา`;
    case 'asani':
      return `โจมตีอัสนีพลัง ${s.damage} ข้ามเกราะ 2 หน่วย และชิ่งใส่ศัตรูช่องติดกัน 1 ตัวด้วยพลัง 50% · 5 มานา`;
    case 'pathaphi':
      return `โจมตีปฐพีพลัง ${s.damage} มอบเกราะชั่วคราว ${s.block} หน่วย และทุบเกราะเป้าหมายถาวร 2 หน่วย · 5 มานา`;
    case 'wari':
      return `โจมตีวารีพลัง ${s.damage} ฟื้นฟู ${s.heal} HP และทำให้เป้าหมายรวมถึงช่องติดกันเปียกจนจบเทิร์นถัดไป · 5 มานา`;
    case 'vayu':
      return `โจมตีวายุพลัง ${s.damage} ผลักเป้าหมายถอย 1 ช่อง หากชนศัตรูหรือชนขอบเกิดดาเมจกระแทกทะลุเกราะ ${s.slam} (ชนศัตรูโดนทั้งคู่) · 5 มานา`;
    case 'magma':
      return `โจมตีแมกม่าพลัง ${s.damage} และทิ้งแอ่งไว้ หลังผู้เล่นลงมือในเทิร์นถัดไปจะปะทุใส่ช่องนั้นพลัง ${s.eruptDmg} พร้อมทุบเกราะ 2 หน่วยถาวร · 7 มานา`;
    case 'mudmire':
      return `โจมตีบึงโคลนพลัง ${s.damage} ทำให้เป้าหมายเปียกจนจบเทิร์นถัดไป และลดพลังโจมตีครั้งถัดไป ${s.chill} หน่วย${s.block > 0 ? ` (มอบเกราะโคลน ${s.block})` : ''} · 7 มานา`;
    case 'dust':
      return `โจมตีธุลีพลัง ${s.damage} ทุบเกราะเป้าหมาย 1 หน่วยถาวร และผลักถอย 1 ช่อง หากชนศัตรูหรือชนขอบเกิดดาเมจกระแทกทะลุเกราะ ${s.slam} (ชนศัตรูโดนทั้งคู่) · 7 มานา`;
    case 'permafrost':
      return `โจมตีเยือกศิลาพลัง ${s.damage} มอบเกราะชั่วคราวให้ผู้ร่าย ${s.block} หน่วย และทำลายเกราะเป้าหมาย 2 หน่วยถาวร · 7 มานา`;
    case 'magnet':
      return `โจมตีแม่เหล็กพลัง ${s.damage} ข้ามเกราะ 2 หน่วย และดูดศัตรูข้างเคียงเข้ามาชนเป้าหลัก หากชนกันจะเกิดดาเมจกระแทกทะลุเกราะ ${s.slam} ใส่ทั้งสองตัว · 7 มานา`;
    case 'mist':
      return `โจมตีหมอกพลัง ${s.damage} ทำให้เป้าหมายเปียกจนจบเทิร์นถัดไป และบดบังลดพลังโจมตีครั้งถัดไป 4 หน่วย${s.burn > 0 ? ` (เผา +${s.burn})` : ''} · 7 มานา`;
    case 'hail':
      return `โจมตีหิมะพลัง ${s.damage} หากเป้าเปียกจะล้างสถานะเปียกและแช่แข็งข้ามการโจมตี 1 ครั้งทันที หากเป้าแห้งจะติดหนาวลดพลังโจมตีครั้งถัดไป ${s.dryChill} หน่วย · 7 มานา`;
    case 'monsoon':
      return `โจมตีมรสุมพลัง ${s.damage} ฟื้นฟู ${s.heal} HP ให้ผู้ร่าย ทำให้เป้าหมายเปียกจนจบเทิร์นถัดไป และผลักศัตรูทั้งหมด 1 ช่อง หากชนกันหรือชนขอบเกิดดาเมจกระแทกทะลุเกราะ ${s.slam} (ชนศัตรูโดนทั้งคู่) · 7 มานา`;
    case 'shockstream':
      return `โจมตีกระแสช็อตพลัง ${s.damage} ข้ามเกราะ 2 หน่วย และช็อตสายฟ้าทะลวงเป้าหมายที่เปียกทั้งหมดในสนามพลัง ${s.shockDmg} (ข้ามเกราะ 2 หน่วย) · 7 มานา`;
    case 'thunderstorm':
      return `โจมตีฟ้าคะนองพลัง ${s.damage} ข้ามเกราะ 2 หน่วย ผลักเป้าหมายถอย 1 ช่อง หากชนศัตรูหรือชนขอบเกิดดาเมจกระแทกทะลุเกราะ ${s.slam} และชิ่งสายฟ้าใส่เป้าข้างเคียง 1 ตัวด้วยพลัง 50% · 7 มานา`;
    case 'heatwave':
      return `โจมตีระอุพลัง ${s.damage} ผลักเป้าหมายถอย 1 ช่อง หากชนศัตรูหรือชนขอบเกิดดาเมจกระแทกทะลุเกราะ ${s.slam} และเผาไหม้ ${s.nearbyBurn} หน่วยกระจายใส่ศัตรูในช่องข้างเคียง · 7 มานา`;
    case 'chillgale':
      return `โจมตีไอหนาวพลัง ${s.damage} ผลักเป้าหมายถอย 1 ช่อง หากชนศัตรูหรือชนขอบเกิดดาเมจกระแทกทะลุเกราะ ${s.slam} และลดพลังโจมตี ${s.chill} หน่วย ส่งผลต่อการโจมตีจริง 2 ครั้งถัดไป · 7 มานา`;
    case 'plasma':
      return `โจมตีพลาสมาพลัง ${s.damage} ข้ามเกราะ 2 หน่วย เน้นดาเมจเดี่ยวรุนแรง · 7 มานา`;
    case 'scald':
      return `โจมตีไอเดือดพลัง ${s.damage} ทุบเกราะเป้าหมายถาวร 2 หน่วย และทำให้ชะงัก${s.extra > 0 ? ` (เผา/หนาว +${s.extra})` : ''} · 7 มานา`;
    case 'frostvolt':
      return `โจมตีผลึกช็อตพลัง ${s.damage} ข้ามเกราะ 2 หน่วย ลดพลังโจมตีครั้งถัดไปของเป้าหมาย ${s.chill} หน่วย และชิ่งสายฟ้าแช่แข็งใส่เป้าข้างเคียง 1 ตัวด้วยพลัง 50% พร้อมติดหนาว ${s.chill} หน่วย · 7 มานา`;
    case 'pair':
      return lv > 0
        ? `ร่ายเวทซ้ำ 2 ครั้ง หรือเชื่อมสองธาตุเข้าด้วยกันเป็นเวทผสาน (พายุระลอกสองใช้พลัง 60% · โล่กาง 2 ชั้น · พลังเวทเมื่อร่วมวลี +${s.phraseBonus})`
        : 'ร่ายเวทสองครั้ง หรือเชื่อมสองธาตุเป็นเวทเดียว พายุระลอกสองใช้แรง 60% โล่กาง 2 ชั้น';
    case 'barrage':
      return `วางไว้ท้ายสุดของคาถาโจมตีเท่านั้น (ห้ามใช้ร่วมกับคู่/ทำลายล้าง/หลุมดำ/ตาย) ปล่อยพลังนั้นซ้ำ 5 ครั้งต่อเนื่อง${s.perHitBonus > 0 ? ` (พลังร่วมวลี +${s.perHitBonus} ต่อครั้ง)` : ''} · ค่าร่าย ×3.5`;
    case 'blast':
      return `วางต้นคาถาเพื่อยิงลูกระเบิด หรือวางต่อท้ายคาถาโจมตี (+2 มานา) เพื่อระเบิดกระจายดาเมจ 50% ใส่ศัตรูในช่องซ้ายขวาเมื่อโจมตีโดน (พลังระเบิดพื้นฐาน ${s.blastDmg}) · หรือสั่งระเบิดโล่ไฟ 2 มานา`;
    case 'devastation':
      return `ใช้เป็นคำสุดท้ายของคาถาโจมตีเท่านั้น (+5 มานา · ห้ามใช้ร่วมกับกระหน่ำ) เพิ่มแรงโจมตีเป็น 2 เท่า${s.mainBonus > 0 ? ` (พลังหลัก +${s.mainBonus})` : ''} และระเบิดซ้ำครึ่งพลังในรัศมี 2 ช่อง${s.blastBonus > 0 ? ` (แรงระเบิด +${s.blastBonus})` : ''} เมื่อโจมตีโดน`;
    case 'blackhole':
      return `เลือกช่องบนสนาม ดูดศัตรูทั้งหมดเข้าจุดศูนย์กลาง ชนกันทำดาเมจกระแทก ${s.slamPower} ต่อตัว ทะลุเกราะและม่านทั้งหมด ในเทิร์นถัดไปจะยุบตัวทำดาเมจแท้ ${s.collapsePower} ที่จุดกลาง และ ${s.sidePower} ที่ช่องติดกัน · 20 มานา`;
    case 'death':
      return `ปลิดชีพศัตรูธรรมดา 1 ตัวทันที ทะลุเกราะและม่านทั้งหมด (หากใช้กับบอสทำดาเมจแท้ ${s.bossDmg})${s.manaRefund > 0 ? ` พร้อมคืน ${s.manaRefund} มานา` : ''} ใช้สำเร็จได้ 1 ครั้งต่อศึก · 10 มานา`;
    case 'timestop':
      return `ร่ายเดี่ยวเพื่อหยุดเวลาข้ามเทิร์นศัตรู 1 รอบ แล้วต่อเทิร์นผู้เล่นทันที${s.manaBonus > 0 ? ` (ต้นเทิร์นถัดไปฟื้นมานาเพิ่ม ${s.manaBonus} MP)` : ''} ใช้ได้ 1 ครั้งต่อศึก · 10 มานา`;
    case 'ascension':
      return `ร่ายเดี่ยวเพื่อเตรียมจุติ เมื่อรอดถึงเทิร์นถัดไป การ์ดบนมือทั้งหมดจะกลายเป็น +10 ชั่วคราว (รวมเอฟเฟกต์รอง) และร่ายฟรี 0 มานาตลอดทั้งเทิร์น ใช้ได้ 1 ครั้งต่อศึก · ค่าร่าย ${s.cost} มานา (ลดลงตามระดับตีบวก)`;
    case 'meteor':
      return `อุกกาบาตตกแบบสุ่มตำแหน่ง 3 ครั้ง ทำดาเมจเป้าหลัก ${s.mainDamage} และกระจายช่องติดกัน ${s.splashDamage} ต่อลูก ข้ามม่านแล้วหักเกราะตามปกติ · 9 มานา`;
    case 'veil':
      return `กางม่านรับความเสียหาย ${s.capacity} หน่วย อยู่ถึงจบเทิร์นถัดไป เมื่อการโจมตีทำให้ม่านแตก กันส่วนที่ล้นเพิ่มได้อีกสูงสุด ${s.overflowGate} หน่วย · 7 มานา`;
    case 'shield':
      return `กางโล่ป้องกัน ${s.capacity} หน่วยต่อชั้น ชั้นโล่อยู่ได้นาน 2 เทิร์น (ใช้ส่วนที่เหลือได้อีก 1 เทิร์น) · 3 มานา`;
    case 'chakram':
      return lv > 0
        ? `ขว้างกรงจักรเจาะเป้าเดี่ยวรุนแรง พลัง 180% ของธาตุ (พลังพื้นฐาน +${s.baseBonus} ก่อนคูณ 180%) · ม่านกันได้`
        : 'ขว้างกรงจักรเจาะเป้าเดี่ยวรุนแรง พลัง 180% ของธาตุ (ม่านกันได้) ไม่กระจายดาเมจออกนอกหากไม่เสริมวลีอื่น · 3 มานา + ค่าธาตุ';
    case 'beam':
      return `ยิงลำแสงทะลุม่าน โจมตีเป้าหมายเดี่ยวโดยตรงไม่ติดม่าน${s.damageBonus > 0 ? ` (ดาเมจพื้นฐาน +${s.damageBonus})` : ''}${s.pierce > 0 ? ` (เจาะเกราะ ${s.pierce})` : ''} · 2 มานา + ค่าธาตุ`;
    case 'wave':
      return `ซัดคลื่นโจมตีศัตรูทุกตัวในสนามเท่ากันด้วยพลัง 60% ของธาตุ (ม่านของแต่ละตัวกันได้แยกกัน)${s.baseBonus > 0 ? ` (พลังพื้นฐาน +${s.baseBonus} ก่อนคูณ 60%)` : ''} · 3 มานา + ค่าธาตุ`;
    case 'storm':
      return `ร่ายพายุโจมตีเป้าหลักและกระจายช่องซ้ายขวา ร่ายเดี่ยวทำดาเมจ ${s.standaloneCenter}/${s.standaloneSide} หรือเติมธาตุเพื่อทำดาเมจ 150%/75% พร้อมเอฟเฟกต์ธาตุ (ม่านของแต่ละตัวกันได้แยกกัน) · 5 มานา + ค่าธาตุ`;
    case 'heal':
      return `ร่าย “ฮีล ตัวเอง” เพื่อฟื้นฟู ${s.baseHeal} HP ทันที${s.maxHpPct > 0 ? ` (+${s.maxHpPct}% Max HP)` : ''} หรือร่าย “โล่ ฮีล” เพื่อกางโล่พร้อมฟื้นเลือด · 3 มานา (ฮีล ตัวเอง)`;
    case 'self':
      return `ใช้ต่อท้าย “ฮีล” เพื่อรักษาตัวเอง${lv > 0 ? ` (ฟื้นฟูเพิ่ม +${s.extraHeal} HP และเกราะ +${s.extraShield} หน่วย)` : ''}`;
    case 'empower':
      return `เสริมพลังธาตุที่ร่ายให้ผู้ร่ายเป็นเวลา 3 เทิร์น (+${s.basePct}% / ขั้นสอง +${s.tier2Pct}% / ผสาน +${s.fusedPct}%) ต่อ “ใหญ่” หรือขึ้นต้น “มหา” ได้ · 2 มานา + ค่าธาตุ`;
    case 'bless':
      return `อวยพรพลังธาตุระดับสูงให้ผู้ร่ายเป็นเวลา 3 เทิร์น (+${s.basePct}% / ขั้นสอง +${s.tier2Pct}% / ผสาน +${s.fusedPct}%) พร้อมมอบเจาะเกราะ +1 ต่อ “ใหญ่” หรือขึ้นต้น “มหา” ได้ · 3 มานา + ค่าธาตุ`;
    case 'fill':
      return `ใช้คู่กับ “เลือด” (3 มานา ฟื้น ${s.bloodHeal} HP) หรือ “มานา” (1 มานา ฟื้น ${s.manaGain} MP) · ต่อท้าย “ใหญ่” ได้เท่านั้น ห้ามใช้ร่วมกับ “มหา”`;
    case 'blood':
      return `ร่ายเดี่ยวไม่ได้ · ใช้ต่อท้าย “เติม” เพื่อฟื้นฟูพลังชีวิต (${s.heal} HP · เติม เลือด ใหญ่ ${s.largeHeal} HP) · รวมค่าร่าย 3 มานา`;
    case 'mana':
      return `ร่ายเดี่ยวไม่ได้ · ใช้ต่อท้าย “เติม” เพื่อฟื้นฟูมานาทันที (+${s.manaGain} MP · เติม มานา ใหญ่ +${s.largeManaGain} MP) · รวมค่าร่าย 1 มานา`;
    case 'burn':
      return `ต่อท้ายคาถาโจมตีเพื่อเผาไหม้เป้าหมาย ${s.burn} หน่วยก่อนศัตรูลงมือในแต่ละเทิร์น (ผลเผาไหม้ทับซ้อนได้) · +1 มานา`;
    case 'freeze':
      return `ต่อท้ายลูกหรือลำแสงตระกูลน้ำแข็ง ทำให้เป้าหมายถูกแช่แข็งข้ามการโจมตี 1 ครั้งทันที${s.phraseBonus > 0 ? ` (พลังร่วมวลี +${s.phraseBonus})` : ''}${s.chill > 0 ? ` (หนาว +${s.chill})` : ''} · +3 มานา`;
    case 'push':
      return `ต่อท้ายคาถาโจมตี เลื่อนเป้าถอย 1 ช่อง (ใช้กับธาตุลมผลัก 2 ช่อง) หากผลักชนศัตรูจะเกิดดาเมจกระแทกทะลุเกราะ ${s.slam} ใส่ทั้งคู่ (ชนขอบ ${s.edgeSlam} · แรงขึ้นตามตัวคูณคาถา)${s.phraseBonus > 0 ? ` · พลังร่วมวลี +${s.phraseBonus}` : ''} · +1 มานา`;
    case 'pull':
      return `ต่อท้ายคาถาโจมตี ดึงเป้าเข้าหาผู้ร่าย 1 ช่อง หากดึงชนศัตรูข้างหน้าจะเกิดดาเมจกระแทกทะลุเกราะ ${s.slam} ใส่ทั้งคู่ (ชนขอบหน้า ${s.edgeSlam} · แรงขึ้นตามตัวคูณคาถา)${s.phraseBonus > 0 ? ` · พลังร่วมวลี +${s.phraseBonus}` : ''} · +1 มานา`;
    case 'pierce':
      return `ต่อท้ายลูก คลื่น หรือพายุ เพื่อข้ามเกราะเป้าหมายเพิ่ม ${s.pierce} หน่วย ทั้งตอนกระทบและระเบิด${s.phraseBonus > 0 ? ` (พลังร่วมวลี +${s.phraseBonus})` : ''} · +1 มานา`;
    case 'large':
      return `เพิ่มพลังคาถาโจมตี 1.5 เท่า${s.attackBonus > 0 ? ` (พลังพื้นฐาน +${s.attackBonus})` : ''} เพิ่มโล่เป็น ${s.shieldBonus} หน่วยต่อชั้น หรือเพิ่มฮีลทันทีเป็น ${s.healBonus} HP (เติมเลือดใหญ่ 12 HP / เติมมานาใหญ่ 10 MP) · +2 มานา`;
    case 'grand':
      return `วางหน้าคาถาเพื่อเพิ่มพลังสูงสุด มหาโจมตีแรงขึ้น${s.attackBonus > 0 ? ` (พลังพื้นฐาน +${s.attackBonus})` : ''} มหาระเบิดขยายรัศมี มหาโล่/มหาฮีลเพิ่มการป้องกันและฟื้นฟู${s.selfBonus > 0 ? ` (+${s.selfBonus})` : ''} พร้อมส่งผลต่อเนื่องต้นเทิร์นถัดไป`;
    case 'seal':
      return `ต่อท้ายลูกธาตุเพื่อหยุดการฮีล เติมม่าน หรือสลับช่องครั้งถัดไปเมื่อโจมตีโดนเป้าหมาย${s.phraseBonus > 0 ? ` (พลังร่วมวลี +${s.phraseBonus})` : ''} · +2 มานา`;
    case 'dispel':
      return `ต่อท้ายลูกธาตุเพื่อสลายม่านของเป้าหมายทั้งหมดก่อนคาถานี้กระทบ${s.phraseBonus > 0 ? ` (พลังร่วมวลี +${s.phraseBonus})` : ''} · +2 มานา`;
    case 'brace':
      return `ต่อท้ายโล่เพื่อกางโล่ ${s.capacity} หน่วย และหากรับการโจมตีแรงตั้งแต่ 10 ขึ้นไปครั้งแรก จะมอบเกราะป้องกันเพิ่มอีก ${s.braceBonus} หน่วยทันที · 4 มานา`;
    case 'summon':
      return lv > 0
        ? `อัญเชิญสัตว์มายืนแนวหน้า รับดาเมจเดี่ยวแทนผู้เล่นและสวนกลับครั้งแรกที่โดนตี ถ้ารอดจะตีตามในเทิร์นถัดไป (HP สัตว์ทุกตัว +${s.globalHpBonus} · ดาเมจ +${s.globalDmgPct}%) ม่านที่โดนสัตว์ตีจะหยุดฟื้น 1 เทิร์น · 3 มานา`
        : 'อัญเชิญสัตว์มายืนแนวหน้า รับดาเมจเดี่ยวแทนผู้เล่นและสวนกลับครั้งแรกที่โดนตี ถ้ารอดจะตีตามในเทิร์นถัดไป (ม่านที่โดนสัตว์ตีจะหยุดฟื้น 1 เทิร์น) · 3 มานา + ค่าสัตว์ + ค่าธาตุ';
    default:
      if (CREATURE_STATS[wordId]) {
        const c = CREATURE_STATS[wordId];
        const traitDesc = c.description.replace(/^ม่านพื้นฐาน \d+ · /, '');
        return `HP ${s.hp} / สวน ${s.counter} / ตีตาม ${s.strike}${s.armor ? ` / เกราะ ${s.armor}` : ''}${s.ward ? ` / ม่าน ${s.ward}` : ''} · ${traitDesc} · ${c.cost} มานา`;
      }
      return WORDS[wordId]?.description ?? '';
  }
}

export function getCardFormula(wordId, level = 0) {
  const lv = Math.max(0, level);
  const s = getCardDynamicStats(wordId, lv);
  switch (wordId) {
    case 'shot':
      return '1 มานา + ค่าธาตุ';
    case 'spear':
      return `1 มานา + ค่าธาตุ · หน้า 80% / หลัง 50%${s.pierce > 0 ? ` · เจาะ ${s.pierce}` : ''}`;
    case 'axe':
      return '1 มานา + ค่าธาตุ · พลัง 80% · ข้ามเกราะ';
    case 'light':
      return `รูปทรง ธาตุ เบา · −1 มานา · พลัง −${s.penalty}%`;
    case 'delay':
      return `หน่วง โล่ · 2 มานา · ต้นเทิร์นหน้ากางโล่ ${s.shield}`;
    case 'fire':
      return `พลัง ${s.damage} · 2 มานา`;
    case 'ice':
      return `พลัง ${s.damage} · ลดโจมตี ${s.chill} · 2 มานา`;
    case 'lightning':
      return `พลัง ${s.damage} · เจาะเกราะ 2 · 2 มานา`;
    case 'earth':
      return `พลัง ${s.damage} · เกราะ ${s.block} / ทุบเกราะ 1 · 2 มานา`;
    case 'water':
      return `พลัง ${s.damage} · ฮีล ${s.heal} / เปียก · 2 มานา`;
    case 'wind':
      return `พลัง ${s.damage} · ผลัก 1 ช่อง (กระแทก ${s.slam}) · 2 มานา`;
    case 'akki':
      return `พลัง ${s.damage} · ตัดฮีล 50% · 5 มานา`;
    case 'heman':
      return `พลัง ${s.damage} · ลดโจมตี ${s.chill} (2 ครั้ง) · 5 มานา`;
    case 'asani':
      return `พลัง ${s.damage} · เจาะเกราะ 2 · ชิ่ง 50% · 5 มานา`;
    case 'pathaphi':
      return `พลัง ${s.damage} · เกราะ ${s.block} / ทุบเกราะ 2 · 5 มานา`;
    case 'wari':
      return `พลัง ${s.damage} · ฮีล ${s.heal} / เปียกหมู่ · 5 มานา`;
    case 'vayu':
      return `พลัง ${s.damage} · ผลัก 1 ช่อง (กระแทก ${s.slam}) · 5 มานา`;
    case 'magma':
      return `พลัง ${s.damage} · แอ่งปะทุ ${s.eruptDmg} (ทุบเกราะ 2) · 7 มานา`;
    case 'mudmire':
      return `พลัง ${s.damage} · เปียก · ลดโจมตี ${s.chill}${s.block > 0 ? ` · เกราะ ${s.block}` : ''} · 7 มานา`;
    case 'dust':
      return `พลัง ${s.damage} · ทุบเกราะ 1 · ผลัก 1 ช่อง (กระแทก ${s.slam}) · 7 มานา`;
    case 'permafrost':
      return `พลัง ${s.damage} · เกราะ ${s.block} / ทุบเกราะ 2 · 7 มานา`;
    case 'magnet':
      return `พลัง ${s.damage} · ข้ามเกราะ 2 · ดูดชน ${s.slam} · 7 มานา`;
    case 'mist':
      return `พลัง ${s.damage} · เปียก · ลดโจมตี 4${s.burn > 0 ? ` · เผา ${s.burn}` : ''} · 7 มานา`;
    case 'hail':
      return `พลัง ${s.damage} · เปียกแช่แข็ง / แห้งหนาว ${s.dryChill} · 7 มานา`;
    case 'monsoon':
      return `พลัง ${s.damage} · ฮีล ${s.heal} · เปียก · ผลักทั้งสนาม (กระแทก ${s.slam}) · 7 มานา`;
    case 'shockstream':
      return `พลัง ${s.damage} · ข้ามเกราะ 2 · ช็อตเปียก ${s.shockDmg} · 7 มานา`;
    case 'thunderstorm':
      return `พลัง ${s.damage} · ข้ามเกราะ 2 · ผลัก 1 ช่อง (กระแทก ${s.slam}) · ชิ่ง 50% · 7 มานา`;
    case 'heatwave':
      return `พลัง ${s.damage} · ผลัก 1 ช่อง (กระแทก ${s.slam}) · เผาข้างเคียง ${s.nearbyBurn} · 7 มานา`;
    case 'chillgale':
      return `พลัง ${s.damage} · ผลัก 1 ช่อง (กระแทก ${s.slam}) · หนาว ${s.chill} (2 ครั้ง) · 7 มานา`;
    case 'plasma':
      return `พลัง ${s.damage} · ข้ามเกราะ 2 · 7 มานา`;
    case 'scald':
      return `พลัง ${s.damage} · ทุบเกราะ 2${s.extra > 0 ? ` · เผา/หนาว ${s.extra}` : ''} · 7 มานา`;
    case 'frostvolt':
      return `พลัง ${s.damage} · ข้ามเกราะ 2 · ชิ่ง 50% · หนาว ${s.chill} · 7 มานา`;
    case 'pair':
      return `ร่ายสองครั้งคิดมานา ×2 · พายุ +3 · ผสานลด 1${lv > 0 ? ` · ร่วมวลี +${s.phraseBonus}` : ''}`;
    case 'barrage':
      return `ท้ายประโยคเท่านั้น · โจมตี 5 ครั้ง · ค่าร่าย ×3.5${s.perHitBonus > 0 ? ` · +${s.perHitBonus}/ครั้ง` : ''}`;
    case 'blast':
      return `ร่ายเดี่ยว 4 มานา · ลูกระเบิด +1 · คำต่อท้าย +2 · แรงระเบิด ${s.blastDmg}`;
    case 'devastation':
      return `+5 มานา · พลัง ×2 · ระเบิดรัศมี 2 ช่อง${s.mainBonus > 0 ? ` · หลัก +${s.mainBonus}/กระจาย +${s.blastBonus}` : ''}`;
    case 'blackhole':
      return `20 มานา · กระแทก ${s.slamPower} · ยุบ ${s.collapsePower} / ข้าง ${s.sidePower} · ทะลุเกราะ/ม่าน`;
    case 'death':
      return `10 มานา · ปลิดชีพทันที / บอส ${s.bossDmg} แท้${s.manaRefund > 0 ? ` · คืน +${s.manaRefund} MP` : ''} · ครั้งเดียวต่อศึก`;
    case 'timestop':
      return `10 มานา · ข้ามรอบศัตรู 1 ครั้ง${s.manaBonus > 0 ? ` · ฟื้น +${s.manaBonus} MP` : ''} · ครั้งเดียวต่อศึก`;
    case 'ascension':
      return `ค่าร่าย ${s.cost} มานา · เทิร์นหน้าการ์ด +10 & ร่าย 0 มานา · ครั้งเดียวต่อศึก`;
    case 'meteor':
      return `9 มานา · สุ่มตก 3 ครั้ง · หลัก ${s.mainDamage} / กระจาย ${s.splashDamage} · ข้ามม่าน`;
    case 'veil':
      return `7 มานา · กัน ${s.capacity} + กันส่วนล้นสูงสุด ${s.overflowGate}`;
    case 'shield':
      return `3 มานา · ป้องกัน ${s.capacity} หน่วย (2 เทิร์น)`;
    case 'chakram':
      return `3 มานา + ค่าธาตุ · เป้าเดี่ยว 180%${lv > 0 ? ` · พื้นฐาน +${s.baseBonus}` : ''}`;
    case 'beam':
      return `2 มานา + ค่าธาตุ · ทะลุม่าน${s.pierce > 0 ? ` · เจาะ ${s.pierce}` : ''}`;
    case 'wave':
      return `3 มานา + ค่าธาตุ · โจมตีทุกตัว 60%${lv > 0 ? ` · พื้นฐาน +${s.baseBonus}` : ''}`;
    case 'storm':
      return `5 มานา + ค่าธาตุ · เดี่ยว ${s.standaloneCenter}/${s.standaloneSide} · เติมธาตุ 150%/75%${lv > 0 ? ` · พื้นฐาน +${s.elementBonus}` : ''}`;
    case 'heal':
      return `ฮีล ตัวเอง 3 มานา · ฟื้น ${s.baseHeal} HP${s.maxHpPct > 0 ? ` (+${s.maxHpPct}%)` : ''} · โล่ ฮีล 5 มานา`;
    case 'self':
      return `ใช้ต่อท้ายฮีล${lv > 0 ? ` · ฟื้นฟู +${s.extraHeal} HP / เกราะ +${s.extraShield}` : ''}`;
    case 'empower':
      return `2 มานา + ค่าธาตุ · บัฟธาตุ +${s.basePct}% (+${s.tier2Pct}% / +${s.fusedPct}%) · 3 เทิร์น`;
    case 'bless':
      return `3 มานา + ค่าธาตุ · บัฟธาตุ +${s.basePct}% (+${s.tier2Pct}% / +${s.fusedPct}%) · เจาะ 1 · 3 เทิร์น`;
    case 'fill':
      return `เติม เลือด 3 มานา (${s.bloodHeal} HP) · เติม มานา 1 มานา (+${s.manaGain} MP)`;
    case 'blood':
      return `ใช้คู่ “เติม” (3 มานา) · ฟื้น ${s.heal} HP (ใหญ่ ${s.largeHeal} HP)`;
    case 'mana':
      return `ใช้คู่ “เติม” (1 มานา) · ฟื้น +${s.manaGain} MP (ใหญ่ +${s.largeManaGain} MP)`;
    case 'burn':
      return `+1 มานา · เผาไหม้ ${s.burn} หน่วย`;
    case 'freeze':
      return `+3 มานา · ข้ามการโจมตี 1 ครั้ง${s.phraseBonus > 0 ? ` · พลัง +${s.phraseBonus}` : ''}${s.chill > 0 ? ` · หนาว +${s.chill}` : ''}`;
    case 'push':
      return `+1 มานา · ชนศัตรู ${s.slam}×2 (ทะลุเกราะ) · ชนขอบ ${s.edgeSlam}${s.phraseBonus > 0 ? ` · พลัง +${s.phraseBonus}` : ''}`;
    case 'pull':
      return `+1 มานา · ดึงชนศัตรู ${s.slam}×2 (ทะลุเกราะ) · ชนขอบหน้า ${s.edgeSlam}${s.phraseBonus > 0 ? ` · พลัง +${s.phraseBonus}` : ''}`;
    case 'pierce':
      return `+1 มานา · เจาะเกราะ ${s.pierce}${s.phraseBonus > 0 ? ` · พลัง +${s.phraseBonus}` : ''}`;
    case 'large':
      return `+2 มานา · โจมตี ×1.5${s.attackBonus > 0 ? ` (+${s.attackBonus})` : ''} · โล่ ${s.shieldBonus} · ฮีล ${s.healBonus}`;
    case 'grand':
      return `โจมตี +3 มานา${s.attackBonus > 0 ? ` · โจมตี +${s.attackBonus}` : ''}${s.selfBonus > 0 ? ` · โล่/ฮีล +${s.selfBonus}` : ''}`;
    case 'seal':
      return `+2 มานา · ผนึกฮีล/ม่าน/สลับช่อง${s.phraseBonus > 0 ? ` · พลัง +${s.phraseBonus}` : ''}`;
    case 'dispel':
      return `+2 มานา · สลายม่านทั้งหมด${s.phraseBonus > 0 ? ` · พลัง +${s.phraseBonus}` : ''}`;
    case 'brace':
      return `โล่ ยืนหยัด · 4 มานา · โล่ ${s.capacity} (เกณฑ์ ≥10 รับเพิ่ม +${s.braceBonus})`;
    case 'summon':
      return `3 มานา + ค่าสัตว์ + ค่าธาตุ · อยู่ 2 เทิร์น${lv > 0 ? ` · HP +${s.globalHpBonus} / ดาเมจ +${s.globalDmgPct}%` : ''}`;
    default:
      if (CREATURE_STATS[wordId]) {
        const c = CREATURE_STATS[wordId];
        return `${c.cost} มานา · HP ${s.hp} / สวน ${s.counter} / ตีตาม ${s.strike}${s.armor ? ` / เกราะ ${s.armor}` : ''}${s.ward ? ` / ม่าน ${s.ward}` : ''}`;
      }
      return WORDS[wordId]?.formula ?? '';
  }
}

export function getCardUpgradeComparison(wordId, currentLevel = 0) {
  const cur = Math.max(0, currentLevel);
  const next = cur + 1;
  const s0 = getCardDynamicStats(wordId, cur);
  const s1 = getCardDynamicStats(wordId, next);
  switch (wordId) {
    case 'shot':
      return `ดาเมจกระสุน +${s0.damageBonus} → +${s1.damageBonus}`;
    case 'spear': {
      const pDiff = s1.pierce > s0.pierce ? ` · เจาะเกราะ ${s0.pierce} → ${s1.pierce}` : ' (เจาะเกราะ +1 ทุก 3 ขั้น)';
      return `ดาเมจหอก +${s0.damageBonus} → +${s1.damageBonus}${pDiff}`;
    }
    case 'axe':
      return `พลังขวานพื้นฐาน +${s0.damageBonus} → +${s1.damageBonus} (ก่อนคูณ 80%)`;
    case 'light':
      return `ลดโทษพลัง ${s0.penalty}% → ${s1.penalty}%`;
    case 'delay':
      return `โล่ต้นเทิร์นหน้า ${s0.shield} → ${s1.shield} หน่วย`;
    case 'fire':
      return `พลังไฟ ${s0.damage} → ${s1.damage}`;
    case 'ice': {
      const cDiff = s1.chill > s0.chill ? ` · ลดโจมตี ${s0.chill} → ${s1.chill}` : ' (หนาว +1 ทุก 3 ขั้น)';
      return `พลังน้ำแข็ง ${s0.damage} → ${s1.damage}${cDiff}`;
    }
    case 'lightning':
      return `พลังสายฟ้า ${s0.damage} → ${s1.damage}`;
    case 'earth': {
      const bDiff = s1.block > s0.block ? ` · เกราะดิน ${s0.block} → ${s1.block}` : ' (เกราะ +1 ทุก 2 ขั้น)';
      return `พลังดิน ${s0.damage} → ${s1.damage}${bDiff}`;
    }
    case 'water': {
      const hDiff = s1.heal > s0.heal ? ` · ฮีล ${s0.heal} → ${s1.heal} HP` : ' (ฮีล +1 ทุก 2 ขั้น)';
      return `พลังน้ำ ${s0.damage} → ${s1.damage}${hDiff}`;
    }
    case 'wind': {
      const sDiff = s1.slam > s0.slam ? ` · กระแทกชน ${s0.slam} → ${s1.slam}` : ' (กระแทก +1 ทุก 2 ขั้น)';
      return `พลังลม ${s0.damage} → ${s1.damage}${sDiff}`;
    }
    case 'akki':
      return `พลังอัคคี ${s0.damage} → ${s1.damage}`;
    case 'heman': {
      const cDiff = s1.chill > s0.chill ? ` · หนาว ${s0.chill} → ${s1.chill}` : ' (หนาว +1 ทุก 2 ขั้น)';
      return `พลังเหมันต์ ${s0.damage} → ${s1.damage}${cDiff}`;
    }
    case 'asani':
      return `พลังอัสนี ${s0.damage} → ${s1.damage}`;
    case 'pathaphi':
      return `พลังปฐพี ${s0.damage} → ${s1.damage} · เกราะดิน ${s0.block} → ${s1.block}`;
    case 'wari':
      return `พลังวารี ${s0.damage} → ${s1.damage} · ฮีล ${s0.heal} → ${s1.heal} HP`;
    case 'vayu':
      return `พลังวายุ ${s0.damage} → ${s1.damage} · กระแทกชน ${s0.slam} → ${s1.slam}`;
    case 'magma':
      return `พลังแมกม่า ${s0.damage} → ${s1.damage} · แอ่งปะทุ ${s0.eruptDmg} → ${s1.eruptDmg}`;
    case 'mudmire': {
      const cDiff = s1.chill > s0.chill ? ` · หนาว ${s0.chill} → ${s1.chill}` : ' (หนาว +1 ทุก 2 ขั้น)';
      return `พลังบึงโคลน ${s0.damage} → ${s1.damage} · เกราะโคลน ${s0.block} → ${s1.block}${cDiff}`;
    }
    case 'dust':
      return `พลังธุลี ${s0.damage} → ${s1.damage} · กระแทกชน ${s0.slam} → ${s1.slam}`;
    case 'permafrost':
      return `พลังเยือกศิลา ${s0.damage} → ${s1.damage} · เกราะน้ำแข็ง ${s0.block} → ${s1.block}`;
    case 'magnet':
      return `พลังแม่เหล็ก ${s0.damage} → ${s1.damage} · กระแทกดูดชน ${s0.slam} → ${s1.slam}`;
    case 'mist': {
      const cDiff = s1.chill > s0.chill ? ` · หนาว ${s0.chill} → ${s1.chill}` : ' (หนาว +1 ทุก 2 ขั้น)';
      return `พลังหมอก ${s0.damage} → ${s1.damage} · เผา ${s0.burn} → ${s1.burn}${cDiff}`;
    }
    case 'hail': {
      const cDiff = s1.dryChill > s0.dryChill ? ` · แห้งหนาว ${s0.dryChill} → ${s1.dryChill}` : ' (แห้งหนาว +1 ทุก 2 ขั้น)';
      return `พลังหิมะ ${s0.damage} → ${s1.damage}${cDiff}`;
    }
    case 'monsoon':
      return `พลังมรสุม ${s0.damage} → ${s1.damage} · ฮีล ${s0.heal} → ${s1.heal} HP · กระแทกชน ${s0.slam} → ${s1.slam}`;
    case 'shockstream':
      return `พลังกระแสช็อต ${s0.damage} → ${s1.damage} · ช็อตเป้าเปียก ${s0.shockDmg} → ${s1.shockDmg}`;
    case 'thunderstorm':
      return `พลังฟ้าคะนอง ${s0.damage} → ${s1.damage} · กระแทกชน ${s0.slam} → ${s1.slam}`;
    case 'heatwave':
      return `พลังระอุ ${s0.damage} → ${s1.damage} · เผาข้างเคียง ${s0.nearbyBurn} → ${s1.nearbyBurn} · กระแทกชน ${s0.slam} → ${s1.slam}`;
    case 'chillgale': {
      const cDiff = s1.chill > s0.chill ? ` · หนาว ${s0.chill} → ${s1.chill}` : ' (หนาว +1 ทุก 2 ขั้น)';
      return `พลังไอหนาว ${s0.damage} → ${s1.damage} · กระแทกชน ${s0.slam} → ${s1.slam}${cDiff}`;
    }
    case 'plasma':
      return `พลังพลาสมา ${s0.damage} → ${s1.damage}`;
    case 'scald': {
      const eDiff = s1.extra > s0.extra ? ` · เผา/หนาว ${s0.extra} → ${s1.extra}` : ' (เผา/หนาว +1 ทุก 2 ขั้น)';
      return `พลังไอเดือด ${s0.damage} → ${s1.damage}${eDiff}`;
    }
    case 'frostvolt': {
      const cDiff = s1.chill > s0.chill ? ` · หนาว ${s0.chill} → ${s1.chill}` : ' (หนาว +1 ทุก 2 ขั้น)';
      return `พลังผลึกช็อต ${s0.damage} → ${s1.damage}${cDiff}`;
    }
    case 'pair':
      return `พลังเวทเมื่อร่วมวลี +${s0.phraseBonus} → +${s1.phraseBonus}`;
    case 'barrage':
      return `พลังร่วมวลี +${s0.perHitBonus} → +${s1.perHitBonus} ต่อครั้ง (×5 ครั้ง)`;
    case 'blast':
      return `แรงระเบิด ${s0.blastDmg} → ${s1.blastDmg}`;
    case 'devastation':
      return `พลังหลัก +${s0.mainBonus} → +${s1.mainBonus} · แรงระเบิดกระจาย +${s0.blastBonus} → +${s1.blastBonus}`;
    case 'blackhole':
      return `แรงยุบหลุมดำ ${s0.collapsePower} → ${s1.collapsePower} · กระแทกดูดชน ${s0.slamPower} → ${s1.slamPower}`;
    case 'death':
      return `พิพากษาบอส ${s0.bossDmg} → ${s1.bossDmg} แท้${s1.manaRefund > s0.manaRefund ? ` · คืนมานา +${s0.manaRefund} → +${s1.manaRefund}` : ''}`;
    case 'timestop':
      return `ต้นเทิร์นหลังหยุดเวลา ฟื้นมานา +${s0.manaBonus} → +${s1.manaBonus} MP`;
    case 'ascension':
      return `ค่าร่ายเปิดจุติ ${s0.cost} → ${s1.cost} มานา`;
    case 'meteor':
      return `แรงหลักอุกกาบาต ${s0.mainDamage} → ${s1.mainDamage} · กระจาย ${s0.splashDamage} → ${s1.splashDamage}`;
    case 'veil':
      return `ความจุม่าน ${s0.capacity} → ${s1.capacity} · กันส่วนล้น ${s0.overflowGate} → ${s1.overflowGate}`;
    case 'shield':
      return `ความจุโล่ ${s0.capacity} → ${s1.capacity} หน่วยต่อชั้น`;
    case 'chakram':
      return `ดาเมจกรงจักรพื้นฐาน +${s0.baseBonus} → +${s1.baseBonus} (ก่อนคูณ 180%)`;
    case 'beam': {
      const pDiff = s1.pierce > s0.pierce ? ` · เจาะเกราะ ${s0.pierce} → ${s1.pierce}` : ' (เจาะเกราะ +1 ทุก 3 ขั้น)';
      return `ดาเมจลำแสง +${s0.damageBonus} → +${s1.damageBonus}${pDiff}`;
    }
    case 'wave':
      return `ดาเมจคลื่นพื้นฐาน +${s0.baseBonus} → +${s1.baseBonus} (ก่อนคูณ 60%)`;
    case 'storm':
      return `พายุเดี่ยว ${s0.standaloneCenter}/${s0.standaloneSide} → ${s1.standaloneCenter}/${s1.standaloneSide} · เสริมธาตุพื้นฐาน +${s0.elementBonus} → +${s1.elementBonus}`;
    case 'heal': {
      const pDiff = s1.maxHpPct > s0.maxHpPct ? ` · +${s0.maxHpPct}% → +${s1.maxHpPct}% Max HP` : ' (+1% Max HP ทุก 2 ขั้น)';
      return `ฟื้นฟู ${s0.baseHeal} → ${s1.baseHeal} HP${pDiff}`;
    }
    case 'self':
      return `ฟื้นฟู +${s0.extraHeal} → +${s1.extraHeal} HP · เกราะคุ้มตัว +${s0.extraShield} → +${s1.extraShield}`;
    case 'empower':
      return `บัฟพลังธาตุ +${s0.basePct}% → +${s1.basePct}% (+3% ทุกขั้น)`;
    case 'bless':
      return `บัฟอวยพรธาตุ +${s0.basePct}% → +${s1.basePct}% (+4% ทุกขั้น)`;
    case 'fill': {
      const mDiff = s1.manaGain > s0.manaGain ? ` · เติมมานา ${s0.manaGain} → ${s1.manaGain} MP` : ' (เติมมานา +1 ทุก 2 ขั้น)';
      return `เติมเลือด ${s0.bloodHeal} → ${s1.bloodHeal} HP${mDiff}`;
    }
    case 'blood':
      return `เติมเลือด ${s0.heal} → ${s1.heal} HP (ใหญ่ ${s0.largeHeal} → ${s1.largeHeal} HP)`;
    case 'mana': {
      const mDiff = s1.manaGain > s0.manaGain ? ` · เติมมานา +${s0.manaGain} → +${s1.manaGain} MP` : ' (ฟื้นฟู +1 ทุก 2 ขั้น)';
      return `เติมมานา +${s0.manaGain} → +${s1.manaGain} MP${mDiff}`;
    }
    case 'burn':
      return `ความแรงเผาไหม้ ${s0.burn} → ${s1.burn} หน่วย`;
    case 'freeze': {
      const cDiff = s1.chill > s0.chill ? ` · หนาว ${s0.chill} → ${s1.chill}` : ' (หนาว +1 ทุก 3 ขั้น)';
      return `พลังร่วมวลี +${s0.phraseBonus} → +${s1.phraseBonus}${cDiff}`;
    }
    case 'push':
      return `พลังร่วมวลี +${s0.phraseBonus} → +${s1.phraseBonus} · กระแทกชนศัตรู ${s0.slam} → ${s1.slam} (ชนขอบ ${s0.edgeSlam} → ${s1.edgeSlam})`;
    case 'pull':
      return `พลังร่วมวลี +${s0.phraseBonus} → +${s1.phraseBonus} · กระชากชนศัตรู ${s0.slam} → ${s1.slam} (ชนขอบ ${s0.edgeSlam} → ${s1.edgeSlam})`;
    case 'pierce': {
      const pDiff = s1.pierce > s0.pierce ? ` · เจาะเกราะ ${s0.pierce} → ${s1.pierce}` : ' (เจาะเกราะ +1 ทุก 2 ขั้น)';
      return `พลังร่วมวลี +${s0.phraseBonus} → +${s1.phraseBonus}${pDiff}`;
    }
    case 'large':
      return `โจมตี +${s0.attackBonus} → +${s1.attackBonus} · โล่ ${s0.shieldBonus} → ${s1.shieldBonus} · ฮีล ${s0.healBonus} → ${s1.healBonus}`;
    case 'grand':
      return `โจมตี +${s0.attackBonus} → +${s1.attackBonus} · โล่/ฮีล +${s0.selfBonus} → +${s1.selfBonus}`;
    case 'seal':
      return `พลังร่วมวลี +${s0.phraseBonus} → +${s1.phraseBonus}`;
    case 'dispel':
      return `พลังร่วมวลี +${s0.phraseBonus} → +${s1.phraseBonus}`;
    case 'brace':
      return `ความจุโล่ ${s0.capacity} → ${s1.capacity} · โบนัสยืนหยัด ${s0.braceBonus} → ${s1.braceBonus}`;
    case 'summon':
      return `HP สิ่งอัญเชิญทุกตัว +${s0.globalHpBonus} → +${s1.globalHpBonus} · ดาเมจ +${s0.globalDmgPct}% → +${s1.globalDmgPct}%`;
    default:
      if (CREATURE_STATS[wordId]) {
        return `HP ${s0.hp} → ${s1.hp} · สวน ${s0.counter} → ${s1.counter} · ตีตาม ${s0.strike} → ${s1.strike}`;
      }
      return '';
  }
}

export function getCardDetails(wordId, level = 0) {
  const lv = Math.max(0, level);
  const word = WORDS[wordId] ?? {};
  const stats = getCardDynamicStats(wordId, lv);
  const desc = getCardDescription(wordId, lv);
  const formula = getCardFormula(wordId, lv);
  const badge = getCardCapabilityBadge(wordId);
  
  const targets = {
    shot: 'ศัตรู 1 ตัวที่เลือก',
    spear: 'แถวตรง 2 ช่อง (ตัวหน้า + ตัวหลัง)',
    axe: 'ศัตรู 1 ตัวที่เลือก',
    light: 'ตามคาถาหลักที่เสริม',
    delay: 'ผู้ร่าย (ตัวเอง)',
    fire: 'ตามรูปทรงที่ร่าย',
    ice: 'ตามรูปทรงที่ร่าย',
    lightning: 'ตามรูปทรงที่ร่าย',
    earth: 'ตามรูปทรงที่ร่าย',
    water: 'ตามรูปทรงที่ร่าย',
    wind: 'ตามรูปทรงที่ร่าย',
    akki: 'ตามรูปทรงที่ร่าย',
    heman: 'ตามรูปทรงที่ร่าย',
    asani: 'เป้าหมายหลัก + ช่องข้างเคียง 1 ตัว',
    pathaphi: 'ตามรูปทรงที่ร่าย',
    wari: 'เป้าหมายหลัก + ช่องข้างเคียงทั้งหมด',
    vayu: 'ตามรูปทรงที่ร่าย',
    magma: 'ตามรูปทรงที่ร่าย (แอ่งตกช่องเป้าหมาย)',
    mudmire: 'ตามรูปทรงที่ร่าย',
    dust: 'ตามรูปทรงที่ร่าย',
    permafrost: 'ตามรูปทรงที่ร่าย',
    magnet: 'เป้าหมายหลัก + ดึงศัตรูช่องข้างเคียง',
    mist: 'ตามรูปทรงที่ร่าย',
    hail: 'ตามรูปทรงที่ร่าย',
    monsoon: 'เป้าหมายหลัก + ผลักศัตรูทั้งหมดในสนาม',
    shockstream: 'เป้าหมายหลัก + ศัตรูที่เปียกทั้งหมดในสนาม',
    thunderstorm: 'เป้าหมายหลัก + ช่องข้างเคียง 1 ตัว',
    heatwave: 'เป้าหมายหลัก + ช่องข้างเคียง (เผาไหม้)',
    chillgale: 'ตามรูปทรงที่ร่าย',
    plasma: 'ตามรูปทรงที่ร่าย',
    scald: 'ตามรูปทรงที่ร่าย',
    frostvolt: 'เป้าหมายหลัก + ช่องข้างเคียง 1 ตัว',
    pair: 'ตามคาถาหลักที่เสริม',
    barrage: 'ตามคาถาหลักที่เสริม',
    blast: 'เป้าหมายหลัก + ช่องซ้ายขวาติดกัน',
    devastation: 'เป้าหมายหลัก + ศัตรูในรัศมี 2 ช่อง',
    blackhole: 'เลือกช่องศูนย์กลางบนสนาม (มีผลต่อศัตรูทั้งหมด)',
    death: 'ศัตรู 1 ตัวที่เลือก',
    timestop: 'ผู้ร่าย / ศัตรูทั้งหมดในสนาม',
    ascension: 'ผู้ร่าย (ตัวเอง)',
    meteor: 'สุ่มเลือกศัตรู 3 ครั้ง (มีผลต่อเป้าหมายและช่องข้างเคียง)',
    veil: 'ผู้ร่าย (ตัวเอง)',
    shield: 'ผู้ร่าย (ตัวเอง)',
    chakram: 'ศัตรู 1 ตัวที่เลือก',
    beam: 'ศัตรู 1 ตัวที่เลือก (ทะลุม่าน)',
    wave: 'ศัตรูทุกตัวในสนาม',
    storm: 'เป้าหมายหลัก + ช่องข้างเคียง (ซ้ายและขวา)',
    heal: 'ผู้ร่าย (ตัวเอง)',
    self: 'ผู้ร่าย (ตัวเอง)',
    empower: 'ผู้ร่าย (ตัวเอง)',
    bless: 'ผู้ร่าย (ตัวเอง)',
    fill: 'ผู้ร่าย (ตัวเอง)',
    blood: 'ผู้ร่าย (ตัวเอง)',
    mana: 'ผู้ร่าย (ตัวเอง)',
    burn: 'ตามคาถาหลักที่เสริม',
    freeze: 'ตามคาถาหลักที่เสริม',
    push: 'ตามคาถาหลักที่เสริม',
    pull: 'ตามคาถาหลักที่เสริม',
    pierce: 'ตามคาถาหลักที่เสริม',
    large: 'ตามคาถาหลักที่เสริม',
    grand: 'ตามคาถาหลักที่เสริม',
    seal: 'ตามคาถาหลักที่เสริม',
    dispel: 'ตามคาถาหลักที่เสริม',
    brace: 'ผู้ร่าย (ตัวเอง)',
    summon: 'แนวหน้าฝั่งผู้เล่น (รับดาเมจแทน)',
  };
  
  const durations = {
    shot: 'ทันที',
    spear: 'ทันที',
    axe: 'ทันที',
    light: 'ทันที (มีผลตลอดทั้งคาถา)',
    delay: 'กางต้นเทิร์นถัดไป (คงอยู่ 2 เทิร์น)',
    fire: 'ทันที',
    ice: 'ทันที (ผลลดโจมตีส่งผลต่อการโจมตีครั้งถัดไป)',
    lightning: 'ทันที',
    earth: 'ทันที (ทุบเกราะลดถาวร / เกราะดินคงอยู่ตามกฎเกราะ)',
    water: 'ทันที (สถานะเปียกคงอยู่จนจบเทิร์นถัดไป)',
    wind: 'ทันที',
    akki: 'ทันที (ผลตัดฮีลคงอยู่จนจบเทิร์นถัดไป)',
    heman: 'ทันที (ผลลดโจมตีส่งผลต่อการโจมตี 2 ครั้งถัดไป)',
    asani: 'ทันที',
    pathaphi: 'ทันที (ทุบเกราะลดถาวร)',
    wari: 'ทันที (สถานะเปียกคงอยู่จนจบเทิร์นถัดไป)',
    vayu: 'ทันที',
    magma: 'ทันที (แอ่งปะทุหลังผู้เล่นลงมือในเทิร์นถัดไป)',
    mudmire: 'เปียกจนจบเทิร์นถัดไป (ผลลดโจมตีส่งผลต่อการโจมตีครั้งถัดไป)',
    dust: 'ทันที (ทุบเกราะลดถาวร)',
    permafrost: 'ทันที (ทุบเกราะลดถาวร / เกราะคงอยู่ตามกฎเกราะ)',
    magnet: 'ทันที',
    mist: 'เปียกจนจบเทิร์นถัดไป (ผลลดโจมตีส่งผลต่อการโจมตีครั้งถัดไป)',
    hail: 'ทันที (แช่แข็งข้ามโจมตี 1 ครั้ง / หนาวส่งผลครั้งถัดไป)',
    monsoon: 'ทันที (สถานะเปียกคงอยู่จนจบเทิร์นถัดไป)',
    shockstream: 'ทันที',
    thunderstorm: 'ทันที',
    heatwave: 'ทันที (สถานะเผาคงอยู่ตามกฎเผา)',
    chillgale: 'ทันที (ผลลดโจมตีส่งผลต่อการโจมตี 2 ครั้งถัดไป)',
    plasma: 'ทันที',
    scald: 'ทันที (ทุบเกราะลดถาวร)',
    frostvolt: 'ทันที (ผลลดโจมตีส่งผลต่อการโจมตีครั้งถัดไป)',
    pair: 'ทันที',
    barrage: 'ทันที',
    blast: 'ทันที',
    devastation: 'ทันที',
    blackhole: 'ดูดทันที · ยุบตัวระเบิดในเทิร์นถัดไป',
    death: 'ทันที',
    timestop: 'ข้ามเทิร์นศัตรู 1 รอบ',
    ascension: 'มีผลในเทิร์นถัดไปตลอด 1 เทิร์น',
    meteor: 'ทันที',
    veil: 'คงอยู่จนจบเทิร์นถัดไป',
    shield: 'คงอยู่ 2 เทิร์น',
    chakram: 'ทันที',
    beam: 'ทันที',
    wave: 'ทันที',
    storm: 'ทันที',
    heal: 'ทันที',
    self: 'ตามคาถาหลัก',
    empower: '3 เทิร์น',
    bless: '3 เทิร์น',
    fill: 'ทันที',
    blood: 'ทันที',
    mana: 'ทันที',
    burn: 'เผาไหม้ก่อนศัตรูลงมือ 3 เทิร์นหน้า',
    freeze: 'ข้ามการโจมตี 1 ครั้ง',
    push: 'ทันที',
    pull: 'ทันที',
    pierce: 'ทันที',
    large: 'ทันที',
    grand: 'ทันที (มหาโล่/มหาฮีลมีผลต่อเนื่องต้นเทิร์นหน้า)',
    seal: 'ปิดผนึกท่าสนับสนุนในเทิร์นถัดไปของเป้าหมาย',
    dispel: 'ทันที (ก่อนดาเมจกระทบ)',
    brace: 'คงอยู่ 2 เทิร์น (หรือจนกว่าเกราะแตก)',
    summon: 'อยู่ 2 เทิร์น',
  };

  const conditions = {
    shot: 'ต้องตามด้วยธาตุ (คำที่ 2)',
    spear: 'ต้องตามด้วยธาตุ (คำที่ 2)',
    axe: 'ต้องตามด้วยธาตุ (คำที่ 2)',
    light: 'ต้องวางเป็นคำที่ 3 ต่อท้าย [รูปทรง, ธาตุ]',
    delay: 'ต้องใช้วลี “หน่วง โล่” สองคำพอดี',
    fire: 'ใช้ต่อท้ายรูปทรงโจมตี',
    ice: 'ใช้ต่อท้ายรูปทรงโจมตี',
    lightning: 'ใช้ต่อท้ายรูปทรงโจมตี',
    earth: 'ใช้ต่อท้ายรูปทรงโจมตี',
    water: 'ใช้ต่อท้ายรูปทรงโจมตี',
    wind: 'ใช้ต่อท้ายรูปทรงโจมตี',
    akki: 'ใช้ต่อท้ายรูปทรงโจมตี',
    heman: 'ใช้ต่อท้ายรูปทรงโจมตี',
    asani: 'ใช้ต่อท้ายรูปทรงโจมตี',
    pathaphi: 'ใช้ต่อท้ายรูปทรงโจมตี',
    wari: 'ใช้ต่อท้ายรูปทรงโจมตี',
    vayu: 'ใช้ต่อท้ายรูปทรงโจมตี',
    magma: 'ใช้ต่อท้ายรูปทรงโจมตี (ดิน + ไฟ)',
    mudmire: 'ใช้ต่อท้ายรูปทรงโจมตี (ดิน + น้ำ)',
    dust: 'ใช้ต่อท้ายรูปทรงโจมตี (ดิน + ลม)',
    permafrost: 'ใช้ต่อท้ายรูปทรงโจมตี (ดิน + น้ำแข็ง)',
    magnet: 'ใช้ต่อท้ายรูปทรงโจมตี (ดิน + สายฟ้า)',
    mist: 'ใช้ต่อท้ายรูปทรงโจมตี (น้ำ + ลม)',
    hail: 'ใช้ต่อท้ายรูปทรงโจมตี (น้ำ + น้ำแข็ง)',
    monsoon: 'ใช้ต่อท้ายรูปทรงโจมตี (น้ำ + ลม)',
    shockstream: 'ใช้ต่อท้ายรูปทรงโจมตี (น้ำ + สายฟ้า)',
    thunderstorm: 'ใช้ต่อท้ายรูปทรงโจมตี (ลม + สายฟ้า)',
    heatwave: 'ใช้ต่อท้ายรูปทรงโจมตี (ไฟ + ลม)',
    chillgale: 'ใช้ต่อท้ายรูปทรงโจมตี (น้ำแข็ง + ลม)',
    plasma: 'ใช้ต่อท้ายรูปทรงโจมตี (ไฟ + สายฟ้า)',
    scald: 'ใช้ต่อท้ายรูปทรงโจมตี (ไฟ + น้ำ)',
    frostvolt: 'ใช้ต่อท้ายรูปทรงโจมตี (น้ำแข็ง + สายฟ้า)',
    pair: 'วางคู่กับรูปทรงโจมตี หรือวางเชื่อมระหว่าง 2 ธาตุ',
    barrage: 'ต้องวางเป็นคำสุดท้ายของคาถาโจมตี',
    blast: 'วางต้นคาถาเดี่ยวๆ, ต่อหลัง “ลูก”, หรือวางต่อท้ายคาถาโจมตี',
    devastation: 'ต้องวางเป็นคำสุดท้ายของคาถาโจมตี (+5 มานา)',
    blackhole: 'ร่ายเดี่ยว (20 มานา) หรือต่อท้ายด้วยคำเสริม',
    death: 'ร่ายเดี่ยว (10 มานา) · สำเร็จได้ครั้งเดียวต่อศึก',
    timestop: 'ร่ายเดี่ยว (10 มานา) · ครั้งเดียวต่อศึก',
    ascension: 'ร่ายเดี่ยว · ครั้งเดียวต่อศึก',
    meteor: 'ร่ายเดี่ยว (9 มานา) หรือต่อคำเสริม',
    veil: 'ร่ายเดี่ยว (7 มานา) หรือขึ้นต้นด้วย “มหา”',
    shield: 'ร่ายเดี่ยว (3 มานา) หรือใช้วลี “โล่ ฮีล”, “โล่ ยืนหยัด”, “โล่ คู่”',
    chakram: 'ต้องวางเป็นคำแรก ตามด้วยธาตุ',
    beam: 'ต้องวางเป็นคำแรก ตามด้วยธาตุ',
    wave: 'ต้องวางเป็นคำแรก ตามด้วยธาตุ',
    storm: 'ร่ายเดี่ยว (5 มานา) หรือวางเป็นคำแรกตามด้วยธาตุ',
    heal: 'ใช้วลี “ฮีล ตัวเอง” (3 มานา) หรือ “โล่ ฮีล” (5 มานา)',
    self: 'ใช้ต่อท้าย “ฮีล” เท่านั้น',
    empower: 'ต้องวางเป็นคำแรก ตามด้วยธาตุ',
    bless: 'ต้องวางเป็นคำแรก ตามด้วยธาตุ',
    fill: 'ต้องใช้คู่กับ “เลือด” หรือ “มานา”',
    blood: 'ใช้ต่อท้าย “เติม” เท่านั้น',
    mana: 'ใช้ต่อท้าย “เติม” เท่านั้น',
    burn: 'ใช้ต่อท้ายคาถาโจมตี (+1 มานา)',
    freeze: 'ใช้ต่อท้ายลูกหรือลำแสงตระกูลน้ำแข็ง (+3 มานา)',
    push: 'ใช้ต่อท้ายคาถาโจมตี (+1 มานา)',
    pull: 'ใช้ต่อท้ายคาถาโจมตี (+1 มานา)',
    pierce: 'ใช้ต่อท้ายลูก คลื่น หรือพายุ (+1 มานา)',
    large: 'ใช้ต่อท้ายคาถาโจมตี โล่ หรือฮีล (+2 มานา)',
    grand: 'วางหน้าคาถาโจมตี, มหาโล่, หรือมหาฮีล (+3 มานาสำหรับโจมตี)',
    seal: 'ต่อท้ายลูกธาตุ (+2 มานา)',
    dispel: 'ต่อท้ายลูกธาตุ (+2 มานา)',
    brace: 'ต่อท้าย “โล่” เท่านั้น (รวม 4 มานา)',
    summon: 'ต้องวางเป็นคำแรก ตามด้วยสัตว์และธาตุ',
  };

  const costs = {
    shot: '1 มานา + ค่าธาตุ',
    spear: '1 มานา + ค่าธาตุ',
    axe: '1 มานา + ค่าธาตุ',
    light: '−1 มานา (ขั้นต่ำ 1)',
    delay: '2 มานา',
    fire: '2 มานา',
    ice: '2 มานา',
    lightning: '2 มานา',
    earth: '2 มานา',
    water: '2 มานา',
    wind: '2 มานา',
    akki: '5 มานา',
    heman: '5 มานา',
    asani: '5 มานา',
    pathaphi: '5 มานา',
    wari: '5 มานา',
    vayu: '5 มานา',
    magma: '7 มานา',
    mudmire: '7 มานา',
    dust: '7 มานา',
    permafrost: '7 มานา',
    magnet: '7 มานา',
    mist: '7 มานา',
    hail: '7 มานา',
    monsoon: '7 มานา',
    shockstream: '7 มานา',
    thunderstorm: '7 มานา',
    heatwave: '7 มานา',
    chillgale: '7 มานา',
    plasma: '7 มานา',
    scald: '7 มานา',
    frostvolt: '7 มานา',
    pair: 'มานา ×2 (โจมตี) / +3 (พายุ) / −1 (ผสาน)',
    barrage: 'ค่าร่ายรวม ×3.5',
    blast: '4 มานา (เดี่ยว) / +1 (ลูกระเบิด) / +2 (ต่อท้าย)',
    devastation: '+5 มานา',
    blackhole: '20 มานา',
    death: '10 มานา',
    timestop: '10 มานา',
    ascension: '8 มานา (ลดลงตามระดับตีบวก ขั้นต่ำ 1)',
    meteor: '9 มานา',
    veil: '7 มานา',
    shield: '3 มานา',
    chakram: '3 มานา + ค่าธาตุ',
    beam: '2 มานา + ค่าธาตุ',
    wave: '3 มานา + ค่าธาตุ',
    storm: '5 มานา (เดี่ยว) / 5 มานา + ค่าธาตุ',
    heal: '3 มานา (ฮีล ตัวเอง) / 5 มานา (โล่ ฮีล)',
    self: 'ตามคาถาหลัก',
    empower: '2 มานา + ค่าธาตุ',
    bless: '3 มานา + ค่าธาตุ',
    fill: '3 มานา (เติม เลือด) / 1 มานา (เติม มานา)',
    blood: '+2 มานา (รวมเติมเป็น 3 มานา)',
    mana: '+0 มานา (รวมเติมเป็น 1 มานา)',
    burn: '+1 มานา',
    freeze: '+3 มานา',
    push: '+1 มานา',
    pull: '+1 มานา',
    pierce: '+1 มานา',
    large: '+2 มานา',
    grand: '+3 มานา (โจมตี) / ตามคาถาหลัก',
    seal: '+2 มานา',
    dispel: '+2 มานา',
    brace: '4 มานา',
    summon: '3 มานา + ค่าสัตว์ + ค่าธาตุ',
  };

  return {
    id: wordId,
    label: word.label ?? wordId,
    glyph: word.glyph ?? '✦',
    rarity: word.rarity ?? 'common',
    level: lv,
    badge,
    cost: costs[wordId] ?? (CREATURE_STATS[wordId] ? `${CREATURE_STATS[wordId].cost} มานา` : word.cost ? `${word.cost} มานา` : '-'),
    target: targets[wordId] ?? (CREATURE_STATS[wordId] ? 'แนวหน้าฝั่งผู้เล่น (รับดาเมจแทน)' : 'เป้าหมายที่เลือก'),
    duration: durations[wordId] ?? (CREATURE_STATS[wordId] ? 'อยู่ 2 เทิร์น' : 'ทันที'),
    condition: conditions[wordId] ?? (CREATURE_STATS[wordId] ? 'ใช้ต่อหลัง “อัญเชิญ” เท่านั้น' : 'ตามสูตรคาถา'),
    description: desc,
    formula,
    stats,
  };
}


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
