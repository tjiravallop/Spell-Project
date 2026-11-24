const runner = 'rift_runner';
const guard = 'lattice_guard';
const archer = 'thread_archer';
const scribe = 'ward_scribe';

export const RIFT_ENEMIES = {
  [runner]: { name: 'วิหคสลับรอยแยก', hp: 60, armor: 1, ward: 0, attack: 8, color: '#c7a9f4', exp: 42, gold: 38, swapTurn: 1, affinity: 'lightning' },
  [guard]: { name: 'โกเลมแนวศิลา', hp: 72, armor: 3, ward: 1, attack: 10, color: '#89abc0', exp: 50, gold: 46, wardTurn: 1, affinity: 'earth' },
  [archer]: { name: 'พรานศรด้ายวายุ', hp: 48, armor: 1, ward: 0, attack: 6, color: '#b1d38d', exp: 34, gold: 34, distanceAttack: true, affinity: 'wind' },
  gate_weaver: { name: 'จ้าวทวารสานมิติ', hp: 255, armor: 2, ward: 1, attack: 12, color: '#bcb0e8', exp: 125, gold: 125, isBoss: true, swapTurn: 2, wardTurn: 1, heavy: 23, affinity: 'wind' },
  mirror_regent: { name: 'ราชันกระจกผลึกเหมันต์', hp: 325, armor: 3, ward: 2, attack: 14, color: '#95c7e6', exp: 150, gold: 150, isBoss: true, swapTurn: 1, wardTurn: 1, heavy: 28, affinity: 'ice' },
  seam_warden: { name: 'จ้าวผู้เฝ้ารอยต่อ', hp: 400, armor: 4, ward: 1, attack: 17, color: '#e5a387', exp: 180, gold: 174, isBoss: true, swapTurn: 2, wardTurn: 2, heavy: 31, repeatReduction: 50, affinity: 'earth' },
  loom_sovereign: { name: 'ราชันกี่ทอโลก', hp: 530, armor: 4, ward: 2, attack: 19, color: '#ddccfb', exp: 220, gold: 210, isBoss: true, swapTurn: 1, wardTurn: 1, heavy: 36, repeatReduction: 70 },
};

export const RIFT_SPELL_BONUS = 25;
export const RIFT_EXPOSED_BONUS = 35;
export const isRiftBossExposed = (kind, turn) => Boolean(
  (RIFT_ENEMIES[kind]?.isBoss && turn % 3 === 0)
  || (['volcano_colossus', 'thunder_drake_emperor', 'ancient_chitin_behemoth', 'abyssal_kraken', 'nether_dread_lord', 'eternity_overlord', 'eternity_reborn', 'magma_core_juggernaut', 'chitin_bastion_behemoth', 'storm_sovereign_drake', 'void_kraken_leviathan', 'nether_forge_overlord', 'eternity_armory_god'].includes(kind) && turn % 4 === 0)
);

// Floors 1-30: 0%, Floors 31-50: +25% (unchanged), Floors 51-100: progressive Endgame Arcane Resonance
export function getTowerSpellBonus(room = 0) {
  if (room < 75) return 0;
  if (room < 125) return RIFT_SPELL_BONUS;
  if (room < 150) return 50;
  if (room < 175) return 80;
  if (room < 200) return 120;
  if (room < 225) return 170;
  return 230;
}

// Floors 1-50: +3 MP/turn (unchanged), Floors 51-100: +4 to +8 MP/turn to sustain high-tier grand spells
export function getTurnManaRegen(room = 0) {
  if (room < 125) return 3;
  if (room < 150) return 4;
  if (room < 175) return 5;
  if (room < 200) return 6;
  if (room < 225) return 7;
  return 8;
}

// Each entry is one floor. Alternatives are chosen once from the run seed.
export const RIFT_TOWER = [
  [[archer, archer], [archer, guard]],                      // 31
  [[guard, archer], [archer, guard, archer]],
  [[runner, archer], [runner, scribe]],
  [[guard, runner, archer], [archer, runner, scribe]],
  [['gate_weaver', archer]],                               // 35
  [[archer, guard, archer], [guard, scribe, archer]],
  [[runner, guard, runner], [guard, runner, archer]],
  [[archer, scribe, guard], [runner, archer, archer]],
  [[runner, guard, scribe], [guard, runner, archer]],
  [['mirror_regent', scribe, archer]],                     // 40
  [[guard, archer, guard], [runner, archer, guard]],
  [[runner, scribe, guard], [guard, runner, archer]],
  [[archer, guard, archer, runner], [runner, guard, scribe]],
  [[guard, runner, guard], [archer, runner, guard, archer]],
  [['seam_warden', runner, guard]],                        // 45
  [[runner, archer, guard, archer], [guard, runner, scribe]],
  [[guard, archer, guard, scribe], [runner, guard, archer]],
  [[archer, runner, guard, runner], [guard, archer, scribe]],
  [[guard, runner, archer, scribe], [runner, guard, archer, guard]],
  [['loom_sovereign', runner, scribe, archer]],             // 50
];

export const SPACED_FLOORS = new Set([31, 33, 35, 38, 40, 42, 45, 47, 49, 50]);
