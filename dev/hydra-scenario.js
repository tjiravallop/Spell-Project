import { simulateTurn } from '../src/combat.js';
import { createRun, enterRoom, FLOOR21_START_ROOM } from '../src/run.js';
import { FUSION_SUMMON_PALETTES } from '../src/summon-palettes.js';
import { START_WORDS } from '../src/words.js';

export const FIXTURE_SEED = 'hydra-art-fixture';

export function makeHydraScenario(options) {
  return makeSummonScenario('hydra', options);
}

export function makeSummonScenario(creatureId, { grand, element, encounter, action }) {
  const infusion = Object.hasOwn(FUSION_SUMMON_PALETTES, element) ? element : null;
  const state = createRun(FIXTURE_SEED);
  const earlyCount = { single: 1, two: 2, three: 3 }[encounter] ?? 1;
  state.room = encounter === 'floor21'
    ? state.rooms.findIndex((room, i) => i >= FLOOR21_START_ROOM && room.length === 3)
    : state.rooms.findIndex((room, i) => i < FLOOR21_START_ROOM && room.length === earlyCount);
  state.highestRoom = state.room;
  const words = ['grand', 'summon', creatureId, infusion ?? 'fire', 'shot', 'shield', 'ice'];
  state.collection = words.filter(word => !START_WORDS.includes(word));
  Object.assign(state.player, { words, maxHp: 200, hp: 200, maxMana: 50, mana: 50 });
  enterRoom(state);
  state.player.hand = [...words];
  if (action === 'invoke') return state;

  const phrase = [...(grand ? ['grand'] : []), 'summon', creatureId, ...(infusion ? [infusion] : [])];
  const cast = simulateTurn(state, phrase, state.enemies[0].id);
  const invocation = cast.events?.find(event => event.type === 'summon_invoke');
  if (!cast.ok || !invocation) throw new Error('The prepared summon cast did not produce an invocation.');
  const { creature, name, element: infused, isGrand, maxHp, armor, ward, counter, strike, aoeIntercept } = invocation;
  state.turn = 2;
  state.player.summon = {
    creatureId: creature, name, element: infused, isGrand, hp: maxHp, maxHp, armor, ward, counter, strike, aoeIntercept, turnCreated: 1,
  };
  state.summon = state.player.summon;
  return state;
}
