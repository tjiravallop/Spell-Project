import { simulateTurn } from '../src/combat.js';
import { getSpellCatalog } from '../src/words.js';
import { RIFT_ENEMIES } from '../src/upper-tower.js';
import {
  createRun, createEnemy, unlockUpperTower, completeUpperFloor, revisitRoom, chooseReward,
  equipWords, restAtSanctuary, discardOverflow, HAND_LIMIT, applyExpAndGold, nextExpForLevel,
  FLOOR30_BOSS_ROOM, FLOOR31_START_ROOM, FLOOR50_BOSS_ROOM, UPPER_RESTS,
} from '../src/run.js';

const profiles = {
  damage: { deck: ['beam', 'akki', 'pair', 'fire', 'devastation', 'wave', 'shield'], defense: 0.75 },
  position: { deck: ['storm', 'magma', 'beam', 'vayu', 'fire', 'shield', 'pair'], defense: 1.1 },
  defense: { deck: ['beam', 'akki', 'pair', 'fire', 'shield', 'heal', 'wave'], defense: 1.05 },
};
profiles.basic = { ...profiles.damage, repeatBeam: true };
const count = Number(process.argv[2] ?? 200);
const level = Number(process.argv[3] ?? 80);
const upgrade = Number(process.argv[4] ?? 3);
if (!Number.isInteger(level) || level < 1 || level > 1000) throw new Error('Starting level must be an integer from 1 to 1000');
const catalog = [...getSpellCatalog().values()];
const recipesByDeck = new Map();

function start(seed, profile) {
  const collected = [...new Set([...profile.deck, 'akki', 'magma', 'storm', 'devastation', 'vayu'])];
  const state = createRun(seed, false, collected.filter(id => !['shot', 'fire', 'ice', 'pair', 'shield'].includes(id)));
  unlockUpperTower(state);
  state.room = state.highestRoom = FLOOR30_BOSS_ROOM;
  state.clearedRooms = Array.from({ length: FLOOR31_START_ROOM }, (_, i) => i);
  state.rewardedBossRooms = [FLOOR30_BOSS_ROOM];
  state.sanctuaryPost20Unlocked = true;
  state.learned = [...state.collection];
  state.enemies = state.rooms[state.room].map(createEnemy);
  for (const enemy of state.enemies) enemy.hp = 0;
  while (state.player.level < level) applyExpAndGold(state.player, nextExpForLevel(state.player.level));
  Object.assign(state.player, {
    words: [...profile.deck],
    relics: ['ember_core_10', 'storm_pendulum_20'],
    cardUpgrades: Object.fromEntries(profile.deck.map(id => [id, upgrade])),
  });
  completeUpperFloor(state);
  return revisitRoom(state, FLOOR31_START_ROOM);
}

function recipes(deck) {
  const key = deck.join(' ');
  if (!recipesByDeck.has(key)) {
    const unique = new Map();
    for (const entry of catalog.filter(spell => spell.ids.every(id => deck.includes(id)))) {
      unique.set(JSON.stringify([[...entry.ids].sort(), entry.spell]), entry);
    }
    recipesByDeck.set(key, [...unique.values()]);
  }
  return recipesByDeck.get(key);
}

function resolveTurn(state, profile) {
  if (state.player.hand.length > HAND_LIMIT) {
    const hand = state.player.hand;
    const order = hand.map((id, index) => ({ index, duplicates: hand.filter(card => card === id).length }));
    order.sort((a, b) => b.duplicates - a.duplicates);
    state = discardOverflow(state, order.slice(0, hand.length - HAND_LIMIT).map(card => card.index));
  }
  const live = state.enemies.filter(enemy => enemy.hp > 0);
  const score = result => {
    const { summary, events } = result;
    if (summary.fellToFloor || summary.hp === 0) return -1e6;
    if (result.state.room !== state.room || result.state.phase !== 'battle') return 1e5 + summary.hp;
    const kills = events.filter(event => event.type === 'damage' && event.killed).length;
    const pulled = events.filter(event => event.pulled).length;
    const healthPressure = state.player.hp < state.player.maxHp * 0.3 ? 1.4 : 1;
    const manaPressure = state.player.mana < state.player.maxMana * 0.35 ? 1.2 : 0.32;
    return summary.damage + kills * 12 + healthPressure * profile.defense * (summary.healed - summary.incoming)
      + Math.max(0, summary.shield - (state.player.shield?.layers.reduce((sum, value) => sum + value, 0) ?? 0)) * 0.16
      + pulled * 2 + (result.state.magmaPuddles?.length ?? 0) * 2 - summary.cost * manaPressure;
  };
  let best = simulateTurn(state, 'guard');
  let bestScore = score(best);
  let usedPull = false;
  const forceBeam = profile.repeatBeam && live.some(enemy => RIFT_ENEMIES[enemy.kind]?.repeatReduction);
  for (const entry of recipes(state.player.words)) {
    if (forceBeam && entry.spell.form !== 'beam') continue;
    if (entry.cost > state.player.mana) continue;
    const hand = [...state.player.hand];
    if (!entry.ids.every(id => {
      const index = hand.indexOf(id);
      if (index < 0) return false;
      hand.splice(index, 1);
      return true;
    })) continue;
    const { spell } = entry;
    const needsTarget = spell.type === 'attack' && (spell.form !== 'wave' || spell.waveBlast || spell.grand || spell.devastation);
    const targets = needsTarget ? live : live.slice(0, 1);
    for (const target of targets) {
      const result = simulateTurn(state, entry.ids, target.id);
      if (result.ok && score(result) > bestScore) {
        best = result;
        bestScore = score(result);
        usedPull = result.events.some(event => event.pulled);
      }
    }
  }
  return { best, usedPull };
}

function run(seed, profile) {
  let state = start(seed, profile);
  let turns = 0;
  let furthest = state.room;
  let pushes = 0;
  const floorTurns = {};
  while (turns < 400) {
    if (state.phase === 'won') return { win: true, furthest, turns, floorTurns, pushes };
    if (state.phase === 'reward') {
      const reward = state.rewards[0];
      state = chooseReward(state, reward);
      if (state.phase === 'loadout') {
        const deck = [...state.player.words];
        if (reward === 'pull' && profile === profiles.position) deck[deck.indexOf('vayu')] = 'pull';
        state = equipWords(state, deck);
      }
      continue;
    }
    if (state.phase === 'sanctuary') {
      state = revisitRoom(restAtSanctuary(state), UPPER_RESTS[state.sanctuaryFloor] + 1);
      continue;
    }
    furthest = Math.max(furthest, state.room);
    const floor = state.room - FLOOR31_START_ROOM + 31;
    floorTurns[floor] = (floorTurns[floor] ?? 0) + 1;
    const { best, usedPull } = resolveTurn(state, profile);
    turns++;
    if (usedPull) pushes++;
    if (best.summary.fellToFloor) break;
    state = best.state;
  }
  return { win: false, furthest, turns, floorTurns, pushes };
}

for (const [name, profile] of Object.entries(profiles)) {
  const results = Array.from({ length: count }, (_, seed) => run(`rift-${seed}`, profile));
  const wins = results.filter(result => result.win);
  const failed = {};
  for (const result of results.filter(entry => !entry.win)) {
    const floor = result.furthest - FLOOR31_START_ROOM + 31;
    failed[floor] = (failed[floor] ?? 0) + 1;
  }
  const bosses = Object.fromEntries([35, 40, 45, 50].map(floor => [floor, results.filter(r => r.furthest >= FLOOR50_BOSS_ROOM + floor - 50).length]));
  const meanTurns = Object.fromEntries(Array.from({ length: 20 }, (_, i) => {
    const floor = 31 + i;
    const played = results.filter(result => result.floorTurns[floor]);
    return [floor, played.length ? +(played.reduce((total, result) => total + result.floorTurns[floor], 0) / played.length).toFixed(1) : null];
  }));
  console.log(JSON.stringify({ name, count, level, upgrade, wins: wins.length, bosses, failed, meanTurns, pulls: results.reduce((sum, r) => sum + r.pushes, 0) }));
}
