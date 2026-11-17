import { getSpellCatalog } from '../words.js';

export const COMBAT_LOG_KEY = 'spell-foundry.combat-log.v1';
export const DISCOVERED_KEY = 'spell-foundry.discovered.v1';

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
