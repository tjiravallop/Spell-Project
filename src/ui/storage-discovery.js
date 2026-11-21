import { getSpellCatalog } from '../words.js';

export const COMBAT_LOG_KEY = 'spell-foundry.combat-log.v1';
export const DISCOVERED_KEY = 'spell-foundry.discovered.v1';
export const BESTIARY_KEY = 'spell-foundry.bestiary.v1';
export const ACHIEVEMENTS_KEY = 'spell-foundry.achievements.v1';

export const ACHIEVEMENTS = Object.freeze([
  { id: 'first_spell', name: 'คำแรกแห่งเวทมนตร์', desc: 'ร่ายคาถาโจมตีสำเร็จครั้งแรก', icon: '✨' },
  { id: 'dual_fusion', name: 'เจ้าแห่งสองธาตุ', desc: 'ผสานสองธาตุเข้าด้วยกันในการร่ายครั้งเดียว', icon: '⚡' },
  { id: 'grand_spell', name: 'มหาเวทโบราณ', desc: 'ร่ายคาถาที่มีคำว่า “มหา” สำเร็จ', icon: '🌟' },
  { id: 'chakram_blade', name: 'กงจักรสะบั้นมิติ', desc: 'ร่ายคาถารูปแบบ “กงจักร” โจมตีศัตรู', icon: '🪓' },
  { id: 'barrage_burst', name: 'ห่ากระสุนระดมยิง', desc: 'ร่ายคาถาที่มีคำต่อท้าย “ระดมยิง” 5 ฮิต', icon: '🏹' },
  { id: 'shield_fortress', name: 'ปราการสะท้อนมนตรา', desc: 'กางโล่ธาตุสะท้อนหรือตอบโต้ศัตรู', icon: '🛡' },
  { id: 'boss_10', name: 'ผู้ดับเพลิงผลาญ', desc: 'พิชิตบอสใหญ่ Ember Overlord ประจำชั้น 10', icon: '🔥' },
  { id: 'boss_20', name: 'ผู้สยบพายุคลั่ง', desc: 'พิชิตบอสใหญ่ Tempest Archon ประจำชั้น 20', icon: '🌪' },
  { id: 'boss_50', name: 'ผู้ฉีกม่านด้ายดารา', desc: 'พิชิตบอสใหญ่ Loom Sovereign ประจำชั้น 50', icon: '👑' },
  { id: 'boss_80', name: 'ผู้สะกดหมึกสมุทร', desc: 'พิชิตบอสใหญ่ Abyssal Kraken ประจำชั้น 80', icon: '🐙' },
  { id: 'boss_90', name: 'ผู้ทำลายพันธสัญญา', desc: 'พิชิตบอสใหญ่ Nether Dread Lord ประจำชั้น 90', icon: '💀' },
  { id: 'boss_100', name: 'จอมเวทแห่งอนันตกาล', desc: 'พิชิตมหาเทพ Eternity Overlord & Reborn ประจำชั้น 100', icon: '👑' },
  { id: 'rift_clear', name: 'ผู้ผ่ารอยแยกมิติ', desc: 'พิชิตด่านท้าทาย Rift Dungeon ครบ 3 สเตจ', icon: '🌀' },
  { id: 'deck_master', name: 'คลังคำสมบูรณ์', desc: 'สะสมการ์ดคำในคลังครบ 7 ใบ', icon: '📜' },
]);

export function loadTurnLogs(seed) {
  if (!seed) return [];
  try {
    const raw = JSON.parse(localStorage.getItem(COMBAT_LOG_KEY) || 'null');
    if (raw && raw.seed === seed && Array.isArray(raw.logs)) return raw.logs;
  } catch { /* Ignore storage errors */ }
  return [];
}

export function saveTurnLogs(seed, turnLogs) {
  if (!seed) return;
  try {
    localStorage.setItem(COMBAT_LOG_KEY, JSON.stringify({ seed, logs: turnLogs }));
  } catch { /* Ignore storage errors */ }
}

export function loadAccountDiscovered() {
  try {
    const raw = JSON.parse(localStorage.getItem(DISCOVERED_KEY) || '[]');
    if (!Array.isArray(raw)) return new Set();
    const catalog = getSpellCatalog();
    return new Set(raw.filter(phrase => catalog.has(phrase)));
  } catch {
    return new Set();
  }
}

export function saveAccountDiscovered(accountDiscovered) {
  try {
    localStorage.setItem(DISCOVERED_KEY, JSON.stringify([...accountDiscovered]));
  } catch { /* Ignore storage quota errors */ }
}

export function loadAccountBestiary() {
  try {
    const raw = JSON.parse(localStorage.getItem(BESTIARY_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

export function saveAccountBestiary(bestiary) {
  try {
    localStorage.setItem(BESTIARY_KEY, JSON.stringify([...bestiary]));
  } catch { /* Ignore storage quota errors */ }
}

export function loadAccountAchievements() {
  try {
    const raw = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

export function saveAccountAchievements(achievements) {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...achievements]));
  } catch { /* Ignore storage quota errors */ }
}
