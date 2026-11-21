import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSpell, WORDS, RARITIES, START_WORDS, ELEMENTS, SECOND_TIER_ELEMENTS, FUSED_ELEMENTS, FUSION_COMPONENTS, ELEMENT_WEAKNESS, ELEMENT_VULNERABILITY, getWeaknessReaction, getElementComponents, DEVASTATION_FORMULAS, getSpellCatalog, elementFamily } from '../src/words.js';
import {
  createRun, createEnemy, prepareEnemies, chooseReward, equipWords, makeRewards, intent, discardOverflow, isBossRoom, ENEMIES,
  getFloorInfo, nextExpForLevel, levelUpRewards, isSanctuaryUnlocked, isSanctuary9Unlocked, isSanctuaryPre10Unlocked, isSanctuaryPost10Unlocked, isSanctuary14Unlocked, isSanctuary19Unlocked, isSanctuaryPost20Unlocked,
  enterSanctuary, restAtSanctuary, buyShopItem, getAvailableShopItems, moveBeltToStash, moveStashToBelt, useInventoryItem, upgradeWordCard, useBattleItem, revisitRoom,
  getRewardPool, RELIC_DRAFT_CATALOG, MAX_RELIC_SLOTS, getEquippedRelics, equipRelic, unequipRelic,
  getCardSecondaryEffect, describeCardUpgradeEffect, getCardUpgradeCost, getCardUpgradeSuccessRate, CARD_RARITY_COST_MULTIPLIER, CARD_RARITY_RATE_PENALTY, SHOP_ITEMS,
  FLOOR5_START_ROOM, FLOOR6_START_ROOM, FLOOR10_BOSS_ROOM, FLOOR11_START_ROOM, FLOOR13_BOSS_ROOM, FLOOR14_BOUNDARY_ROOM, FLOOR15_START_ROOM, FLOOR16_START_ROOM, FLOOR18_BOSS_ROOM, FLOOR19_BOUNDARY_ROOM, FLOOR20_BOSS_ROOM,
  FLOOR21_START_ROOM, FLOOR24_BOUNDARY_ROOM, FLOOR25_BOSS_ROOM, FLOOR26_START_ROOM, FLOOR29_BOUNDARY_ROOM, FLOOR30_BOSS_ROOM, FLOOR31_START_ROOM, FLOOR40_BOSS_ROOM, FLOOR50_BOSS_ROOM, TOTAL_TOWER_ROOMS, UPPER_RESTS,
} from '../src/run.js';
import { simulateTurn } from '../src/combat.js';
import { Battlefield } from '../src/render.js';
import { GameAudio } from '../src/audio.js';
import { cardMeta } from '../src/ui/dom.js';
import { saveRun, loadRun, validateRun, SAVE_KEY, BACKUP_KEY, loadSettings, storeSettings } from '../src/save.js';
import { getBattleStory, getBossRewardStory, getLoadoutTransitionStory, getSanctuaryStory } from '../src/story.js';
import { computePlayableCombos, canFormPhraseInHand, describeFormulaEffect, MASTER_FORMULAS } from '../src/combos.js';

test('second-tier cards replace the element in attack and shield formulas', () => {
  for (const [id, power] of [['akki', 20], ['heman', 12], ['asani', 16]]) {
    assert.equal(WORDS[id].rarity, 'special');
    assert.equal(parseSpell(['shot', id]).cost, 6);
    assert.equal(parseSpell(['shot', id, 'pair']).cost, 12);
    assert.equal(parseSpell(['beam', id]).cost, 7);
    assert.equal(parseSpell(['wave', id]).cost, 8);
    assert.equal(parseSpell(['shield', id]).cost, 7);
    assert.equal(cast(battle(['rune_ram']), `shot ${id}`).events.find(e => e.type === 'damage').amount, power - (id === 'asani' ? 0 : 2));
  }
  assert.equal(parseSpell(['shot', 'akki', 'pair', 'ice']).cost, 8);
  assert.equal(parseSpell(['shot', 'ice', 'pair', 'akki']).cost, 8);
  assert.equal(parseSpell(['shield', 'akki', 'heman', 'pair']).cost, 14);
});

test('second-tier elements halve healing, preserve chill, and chain to one neighbor', () => {
  const fireTarget = battle(['rune_ram', 'ward_scribe']);
  const first = cast(fireTarget, 'shot akki');
  assert.equal(first.events.find(e => e.type === 'heal').amount, 3);
  const coldTarget = battle(['rune_ram']);
  const frozen = cast(coldTarget, 'shot heman');
  assert.equal(frozen.events.find(e => e.type === 'attack').rawAttack, 2);
  assert.equal(frozen.state.enemies[0].chill, 4);
  const charge = cast(frozen.state, 'guard');
  assert.equal(charge.state.enemies[0].chill, 4);
  const heavy = cast(charge.state, 'guard');
  assert.equal(heavy.events.find(e => e.type === 'attack').rawAttack, 11);
  assert.equal(heavy.state.enemies[0].chill, 0);
  const chainTarget = battle(['striker', 'rune_ram', 'striker']);
  const shock = cast(chainTarget, 'shot asani', 'enemy-1');
  assert.deepEqual(shock.events.filter(e => e.type === 'damage').map(e => [e.target, e.amount]), [['enemy-1',16], ['enemy-0',8]]);
  assert.equal(cast(chainTarget, 'wave asani').events.filter(e => e.type === 'chain-lightning').length, 1);
  const ward = battle(['warden', 'striker']);
  assert.equal(cast(ward, 'shot asani').events.some(e => e.type === 'chain-lightning'), false);
});

test('a pre-expansion save opens 21–30 and both spell and item wins keep progression valid', () => {
  const old = createRun('upper-save');
  old.room = old.highestRoom = FLOOR20_BOSS_ROOM;
  old.enemies = old.rooms[old.room].map(createEnemy);
  old.enemies[0].hp = 0;
  old.clearedRooms = Array.from({ length: FLOOR20_BOSS_ROOM + 1 }, (_, i) => i);
  old.phase = 'sanctuary';
  old.sanctuaryFloor = 'post20';
  old.sanctuaryPost20Unlocked = true;
  const storage = new MemoryStorage();
  assert.equal(saveRun(old, storage).ok, true);
  let state = loadRun(storage).state;
  assert.equal(state.rng, old.rng);
  assert.deepEqual(state.rooms.slice(0, old.rooms.length), old.rooms);
  assert.deepEqual(state.rooms, loadRun(storage).state.rooms);
  assert.equal(state.rooms.length, TOTAL_TOWER_ROOMS);
  assert.throws(() => revisitRoom(state, FLOOR21_START_ROOM + 1));
  state = revisitRoom(state, FLOOR21_START_ROOM);
  const earlyLoss = structuredClone(state);
  earlyLoss.player.hp = 1;
  assert.equal(simulateTurn(earlyLoss, 'guard').summary.fellToFloor, 'post20');
  for (let room = FLOOR21_START_ROOM; room <= FLOOR30_BOSS_ROOM; room++) {
    assert.equal(state.room, room);
    if (room % 2) {
      state.enemies.forEach((enemy, i) => { enemy.hp = i ? 0 : 1; enemy.ward = 0; });
      state.player.hand = ['shot', 'fire'];
      const result = simulateTurn(state, ['shot', 'fire'], 'enemy-0');
      assert.equal(result.ok, true);
      state = result.state;
    } else {
      state.enemies.forEach(enemy => { enemy.hp = 1; enemy.ward = 0; });
      state.player.items = ['ember_scroll'];
      state = useBattleItem(state, 0).state;
    }
    assert.equal(saveRun(state, storage).ok, true, `room ${room} ${state.phase}`);
    if (state.phase === 'reward') {
      const word = state.rewards.find(id => ['seal', 'dispel', 'brace'].includes(id)) ?? state.rewards[0];
      assert.deepEqual(loadRun(storage).state.rewards, state.rewards);
      state = chooseReward(state, word);
    }
    if (room === FLOOR24_BOUNDARY_ROOM) {
      assert.equal(state.phase, 'sanctuary');
      assert.equal(state.sanctuaryFloor, 25);
      assert.equal(state.room, FLOOR24_BOUNDARY_ROOM);
      state = revisitRoom(state, state.room + 1);
      const lateLoss = structuredClone(state);
      lateLoss.player.hp = 1;
      const fallen = simulateTurn(lateLoss, 'guard').state;
      assert.equal(fallen.sanctuaryFloor, 25);
      assert.equal(revisitRoom(fallen, fallen.room).room, FLOOR26_START_ROOM);
    } else if (room === FLOOR29_BOUNDARY_ROOM) {
      assert.equal(state.phase, 'sanctuary');
      assert.equal(state.sanctuaryFloor, 'pre30');
      state = revisitRoom(state, state.room + 1);
    } else if (state.phase === 'loadout') {
      state = equipWords(state, state.player.words);
    }
  }
  assert.equal(state.phase, 'sanctuary');
  assert.equal(state.sanctuaryFloor, 'post30');
  assert.equal(state.room, FLOOR30_BOSS_ROOM);
  assert.ok(state.collection.length > 0);
  assert.equal(saveRun(state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, state);
  const oldWinner = structuredClone(state);
  oldWinner.phase = 'won';
  oldWinner.sanctuaryFloor = 25;
  oldWinner.rooms = oldWinner.rooms.slice(0, FLOOR31_START_ROOM);
  oldWinner.highestRoom = FLOOR30_BOSS_ROOM;
  oldWinner.collection = oldWinner.collection.filter(id => !['devastation', 'vayu'].includes(id));
  oldWinner.learned = oldWinner.learned.filter(id => oldWinner.collection.includes(id));
  assert.equal(saveRun(oldWinner, storage).ok, true);
  const completed = loadRun(storage).state;
  assert.equal(completed.phase, 'sanctuary');
  assert.equal(completed.sanctuaryFloor, 'post30');
  assert.equal(completed.rooms.length, TOTAL_TOWER_ROOMS);
  assert.equal(completed.highestRoom, FLOOR31_START_ROOM);
  assert.equal(saveRun(completed, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, completed);

  const towerLayout = structuredClone(completed.rooms);
  let late = revisitRoom(restAtSanctuary(completed), FLOOR31_START_ROOM);
  assert.deepEqual(late.enemies.map(e => e.slot), [0, 3]);
  for (let room = FLOOR31_START_ROOM; room <= FLOOR50_BOSS_ROOM; room++) {
    assert.equal(late.room, room);
    assert.equal(saveRun(late, storage).ok, true);
    assert.deepEqual(loadRun(storage).state.rooms, towerLayout);
    if (room === 80 || room === 90 || room === 105 || room === 120) {
      const trial = structuredClone(late);
      trial.player.hp = 1;
      trial.turn = 2;
      const defeated = simulateTurn(trial, 'guard').state;
      assert.ok(['post30', 35, 'pre40', 'post40', 45, 'pre50'].includes(defeated.sanctuaryFloor));
    }
    for (const enemy of late.enemies) enemy.hp = 1;
    late.player.items = ['ember_scroll'];
    late = useBattleItem(late, 0).state;
    if (late.phase === 'reward') {
      assert.equal(late.rewards.length, 3);
      assert.equal(saveRun(late, storage).ok, true);
      assert.deepEqual(loadRun(storage).state.rewards, late.rewards);
      late = chooseReward(late, late.rewards[0]);
    }
    if (late.phase === 'loadout') late = equipWords(late, late.player.words);
    if (late.phase === 'sanctuary' && room < FLOOR50_BOSS_ROOM) {
      late = revisitRoom(restAtSanctuary(late), room + 1);
    }
  }
  assert.equal(late.phase, 'sanctuary');
  assert.equal(late.sanctuaryFloor, 'post50');
  assert.equal(late.room, FLOOR50_BOSS_ROOM);
  assert.equal(saveRun(late, storage).ok, true);
  assert.equal(loadRun(storage).state.phase, 'sanctuary');
});

test('rift positioning uses the same intents and actions for pull, swap, and sealing', () => {
  const state = battle(['rift_runner', 'thread_archer']);
  state.enemies[1].slot = 3;
  const [runner, archer] = state.enemies;
  assert.equal(intent(archer, 1, state.enemies).amount, 12);
  assert.equal(intent(runner, 1, state.enemies).target, archer.id);
  const move = cast(state, 'guard');
  assert.equal(move.summary.enemyActions[archer.id].amount, 6);
  assert.deepEqual(move.state.enemies.map(enemy => enemy.slot), [3, 0]);
  const sealed = cast(state, 'shot fire seal', runner.id);
  assert.equal(sealed.summary.enemyActions[runner.id].type, 'sealed');
  assert.deepEqual(sealed.state.enemies.map(enemy => enemy.slot), [0, 3]);
  state.turn = 2;
  state.magmaPuddles = [2];
  const pulled = cast(state, 'beam fire pull', archer.id);
  assert.equal(pulled.summary.enemyActions[archer.id].amount, 10);
  assert.ok(pulled.events.some(event => event.type === 'magma-erupt' && event.target === archer.id));
  const boss = createEnemy('loom_sovereign', 0);
  assert.equal(intent(boss, 1, [boss], FLOOR50_BOSS_ROOM).type, 'recover');
  assert.equal(intent(boss, 8, [boss], FLOOR50_BOSS_ROOM).amount, 37);
});

test('upper floor intents match ward targeting, suppression and heavy attack timing', () => {
  const state = battle(['ward_keeper', 'rune_ram', 'ward_scribe']);
  state.enemies[1].hp = 20;
  prepareEnemies(state);
  assert.equal(intent(state.enemies[0], 1, state.enemies).target, 'enemy-1');
  const ward = cast(state, 'guard');
  assert.equal(ward.summary.enemyActions['enemy-0'].target, 'enemy-1');
  assert.equal(ward.state.enemies[1].ward, 1);
  assert.equal(intent(ward.state.enemies[1], 2).type, 'charge');
  const sealed = cast(state, 'shot fire seal', 'enemy-2');
  assert.equal(sealed.summary.enemyActions['enemy-2'].type, 'sealed');
  assert.equal(sealed.events.some(event => event.type === 'heal'), false);
  const dispelled = cast(state, 'shot fire dispel', 'enemy-0');
  assert.equal(dispelled.summary.wards, 1);
  assert.ok(dispelled.summary.damage > 0);
  const heavy = battle(['rune_ram']);
  heavy.turn = 3;
  const shielded = cast(heavy, 'shield brace');
  assert.equal(shielded.summary.incoming, 3);
  assert.ok(shielded.events.some(event => event.type === 'brace'));
});

test('rift boss damage windows stay deterministic and old saves preserve boss HP percentage', () => {
  const state = battle(['loom_sovereign']);
  state.player.words = [...START_WORDS.slice(0, 4), 'beam'];
  state.collection = ['beam'];
  state.player.hand = ['beam', 'fire'];
  state.enemies[0].maxHp = 330;
  state.enemies[0].hp = 165;
  const storage = new MemoryStorage();
  assert.equal(saveRun(state, storage).ok, true);
  const restored = loadRun(storage).state;
  assert.deepEqual([restored.enemies[0].hp, restored.enemies[0].maxHp], [265, 530]);

  restored.turn = 2;
  prepareEnemies(restored);
  assert.equal(cast(restored, 'beam fire').summary.damage, 6);
  restored.turn = 3;
  prepareEnemies(restored);
  assert.equal(cast(restored, 'beam fire').summary.damage, 12);
  restored.room = FLOOR50_BOSS_ROOM;
  const result = cast(restored, 'beam fire');
  assert.equal(result.summary.damage, 15);
  assert.equal(result.state.enemies[0].hp, 250);
  assert.deepEqual(levelUpRewards(80), { hpGain: 5, mpGain: 4 });
  assert.deepEqual(levelUpRewards(85), { hpGain: 2, mpGain: 2 });
});

test('late bosses remember damaging forms, allow alternatives and preserve the read through saving', () => {
  const state = battle(['loom_sovereign']);
  state.collection = ['beam', 'meteor'];
  state.player.words = [...START_WORDS, 'beam', 'meteor'];
  state.player.hp = state.player.maxHp = 200;
  state.player.hand = ['beam', 'fire', 'meteor'];
  const first = cast(state, 'beam fire');
  assert.equal(first.summary.damage, 6);
  assert.equal(first.state.enemies[0].readForm, 'beam');
  const storage = new MemoryStorage();
  assert.equal(saveRun(first.state, storage).ok, true);
  const restored = loadRun(storage).state;
  restored.player.hand = ['beam', 'ice', 'meteor'];
  const repeat = cast(restored, 'beam ice');
  assert.equal(repeat.summary.damage, 1);
  assert.ok(repeat.events.some(event => event.reduction === 70));
  const alternate = cast(restored, 'meteor');
  assert.equal(alternate.summary.damage, 60);
  assert.equal(alternate.state.enemies[0].readForm, 'meteor');
  const opening = repeat.state;
  opening.player.hand = ['beam', 'fire', 'pair'];
  const doubled = cast(opening, 'beam fire pair');
  assert.equal(doubled.summary.damage, 24);
  assert.equal(doubled.events.some(event => event.reduction), false);
});

function battle(kinds = ['striker']) {
  const state = createRun('test', true);
  state.player.words = Object.keys(WORDS);
  state.player.hand = [];
  state.rooms[0] = kinds;
  state.enemies = kinds.map(createEnemy);
  prepareEnemies(state);
  return state;
}
function neutralArmored(count = 1) {
  const state = battle(Array(count).fill('arch_codex'));
  for (const enemy of state.enemies) enemy.ward = 0;
  return state;
}
function cast(state, text, target = 'enemy-0', second = target) {
  const input = text === 'guard' ? text : text.split(' ');
  const prepared = state.player.words.length > 7
    ? { ...state, player: { ...state.player, hand: input === 'guard' ? [] : [...input] } }
    : state;
  const result = simulateTurn(prepared, input, target, second);
  assert.equal(result.ok, true, result.error);
  return result;
}

test('expanded shop consumables restore, control enemies and draw without consuming a turn', () => {
  const state = createRun('shop-consumables', false);
  state.player.hp = 20;
  state.player.mana = 5;
  state.player.items = ['balanced_tonic', 'frost_dust', 'draw_pages'];
  const saved = new MemoryStorage();
  assert.equal(saveRun(state, saved).ok, true);
  const loaded = loadRun(saved).state;
  const tonic = useBattleItem(loaded, 0).state;
  assert.equal(tonic.player.hp, 28);
  assert.equal(tonic.player.mana, 8);
  assert.equal(tonic.turn, loaded.turn);
  const frost = useBattleItem(tonic, 0).state;
  assert.equal(frost.enemies[0].chill, 4);
  assert.equal(intent(frost.enemies[0], frost.turn, frost.enemies, frost.room).amount, 0);
  const drawA = useBattleItem(frost, 0).state;
  const drawB = useBattleItem(frost, 0).state;
  assert.deepEqual(drawA.player.hand, drawB.player.hand);
  assert.equal(drawA.player.hand.length, frost.player.hand.length + 2);
  assert.equal(drawA.turn, frost.turn);
  assert.equal(saveRun(drawA, saved).ok, true);
  assert.deepEqual(loadRun(saved).state.player.hand, drawA.player.hand);
});

test('new consumables reject no-effect use and work from the stash', () => {
  let state = createRun('shop-items-stash', false);
  state.player.items = ['veil_eraser'];
  assert.throws(() => useBattleItem(state, 0), /ไม่มีม่าน/);
  assert.deepEqual(state.player.items, ['veil_eraser']);
  state.enemies[0].ward = 1;
  state = useBattleItem(state, 0).state;
  assert.equal(state.enemies[0].ward, 0);
  state.player.stash = ['silence_scroll'];
  const sealed = useInventoryItem(state, 'stash', 0).state;
  assert.equal(sealed.enemies[0].sealed, true);
  assert.deepEqual(sealed.player.stash, []);
  sealed.player.items = ['draw_pages'];
  sealed.player.hand = Array(10).fill(sealed.player.words[0]);
  assert.throws(() => useBattleItem(sealed, 0), /มือเต็ม/);
  assert.deepEqual(sealed.player.items, ['draw_pages']);
  sealed.phase = 'sanctuary';
  sealed.player.hp = 10;
  sealed.player.stash = ['greater_healing'];
  assert.equal(useInventoryItem(sealed, 'stash', 0).state.player.hp, 34);
});

test('major bosses award their artifacts through spells and items without duplicates', () => {
  for (const [room, id] of [[FLOOR30_BOSS_ROOM, 'forbidden_crown_30'], [FLOOR40_BOSS_ROOM, 'mirror_prism_40'], [FLOOR50_BOSS_ROOM, 'worldloom_50']]) {
    const state = battle(['striker']);
    state.room = room;
    state.enemies[0].hp = 1;
    const result = cast(state, 'shot fire');
    assert.equal(result.summary.relicDropped, id);
    assert.ok(result.state.player.relics.includes(id));
    assert.equal(result.state.phase, 'sanctuary');
    const itemState = structuredClone(state);
    itemState.player.items = ['ember_scroll'];
    const itemResult = useBattleItem(itemState, 0);
    assert.equal(itemResult.summary.relicDropped, id);
    const owned = structuredClone(state);
    owned.player.relics = [id];
    assert.equal(cast(owned, 'shot fire').summary.relicDropped, undefined);
  }
});

test('new artifact effects apply only when equipped and stack with existing refunds', () => {
  const state = battle(['rune_ram']);
  state.player.maxMana = state.player.mana = 30;
  state.player.relics = ['forbidden_crown_30', 'storm_pendulum_20', 'mirror_prism_40', 'worldloom_50'];
  state.player.equippedRelics = ['forbidden_crown_30', 'storm_pendulum_20', 'mirror_prism_40'];
  const spell = cast(state, 'shot fire pair blast');
  assert.equal(spell.summary.manaRefunded, 3);
  assert.deepEqual(spell.events.filter(e => e.type === 'mana-refund').map(e => e.relicId), ['storm_pendulum_20', 'forbidden_crown_30']);
  const prism = cast(state, 'beam fire').summary.damage;
  state.player.equippedRelics = [];
  assert.ok(prism > cast(state, 'beam fire').summary.damage);
  state.player.equippedRelics = ['worldloom_50'];
  assert.equal(cast(state, 'guard').events.find(e => e.type === 'shield' && e.shieldKind === 'guard').amount, 6);
  assert.equal(cast(state, 'shield').events.find(e => e.type === 'shield' && !e.secondary).amount, 9);
});

test('old cleared-floor saves recover earned artifacts without replacing equipped choices', () => {
  const state = createRun('legacy-relics', false);
  state.clearedRooms = [FLOOR30_BOSS_ROOM, FLOOR40_BOSS_ROOM];
  state.player.relics = ['ember_core_10', 'storm_pendulum_20'];
  state.player.equippedRelics = ['storm_pendulum_20'];
  const storage = new MemoryStorage();
  assert.equal(saveRun(state, storage).ok, true);
  const loaded = loadRun(storage).state;
  assert.ok(loaded.player.relics.includes('forbidden_crown_30'));
  assert.ok(loaded.player.relics.includes('mirror_prism_40'));
  assert.deepEqual(loaded.player.equippedRelics, ['storm_pendulum_20', 'forbidden_crown_30', 'mirror_prism_40']);
});

test('major bosses use their floor-specific mechanics and react to surviving allies', () => {
  const crown = battle(['crown_archivist', 'rune_ram']);
  crown.room = FLOOR30_BOSS_ROOM;
  const shielded = cast(crown, 'beam fire');
  const alone = structuredClone(crown);
  alone.enemies[1].hp = 0;
  const exposed = cast(alone, 'beam fire');
  assert.ok(shielded.summary.damage < exposed.summary.damage);
  assert.equal(shielded.summary.enemyActions['enemy-0'].type, 'ward-grant');

  const mirror = battle(['mirror_regent']);
  mirror.room = FLOOR40_BOSS_ROOM;
  const reflected = cast(mirror, 'shot fire');
  assert.equal(reflected.events.find(e => e.type === 'mirror-reflect').rawAttack, 4);
  assert.equal(cast(mirror, 'beam fire').events.some(e => e.type === 'mirror-reflect'), false);
  assert.equal(cast(mirror, 'shot fire dispel').events.some(e => e.type === 'mirror-reflect'), false);

  const loom = battle(['loom_sovereign', 'rift_runner', 'ward_scribe']);
  loom.room = FLOOR50_BOSS_ROOM;
  loom.turn = 2;
  const together = intent(loom.enemies[0], 2, loom.enemies, loom.room);
  loom.enemies[1].hp = 0;
  const fewer = intent(loom.enemies[0], 2, loom.enemies, loom.room);
  assert.equal(together.amount - fewer.amount, 3);
  assert.equal(cast(loom, 'guard').summary.enemyActions['enemy-0'].amount, fewer.amount);
});

test('reworked enemies telegraph and execute their distinct actions', () => {
  const ember = battle(['ember_imp']);
  ember.turn = 2;
  assert.equal(intent(ember.enemies[0], 2, ember.enemies).type, 'charge');
  const charged = cast(ember, 'guard');
  assert.equal(charged.summary.enemyActions['enemy-0'].type, 'charge');
  assert.equal(cast(charged.state, 'guard').events.find(e => e.type === 'attack').rawAttack, 9);

  const voidFight = battle(['striker', 'void_imp']);
  voidFight.enemies[0].hp = 0;
  assert.equal(intent(voidFight.enemies[1], 1, voidFight.enemies).type, 'advance');
  const advanced = cast(voidFight, 'guard');
  assert.equal(advanced.state.enemies[1].slot, 0);
  assert.equal(intent(advanced.state.enemies[1], 2, advanced.state.enemies).amount, 10);

  const guardFight = battle(['iron_warden', 'striker']);
  const wardIntent = intent(guardFight.enemies[0], 1, guardFight.enemies);
  assert.equal(wardIntent.type, 'ward-grant');
  assert.equal(wardIntent.target, 'enemy-1');
  const warded = cast(guardFight, 'guard');
  assert.equal(warded.summary.enemyActions['enemy-0'].target, wardIntent.target);
  assert.equal(warded.state.enemies[1].ward, 1);
  guardFight.enemies[0].sealed = true;
  assert.equal(intent(guardFight.enemies[0], 1, guardFight.enemies).type, 'sealed');

  const swapFight = battle(['aether_warden', 'striker', 'swarm']);
  swapFight.turn = 2;
  const swapIntent = intent(swapFight.enemies[0], 2, swapFight.enemies);
  assert.equal(swapIntent.target, 'enemy-2');
  const swapped = cast(swapFight, 'guard');
  assert.equal(swapped.state.enemies[0].slot, 2);
  assert.equal(swapped.state.enemies[2].slot, 0);
  swapFight.enemies[1].hp = swapFight.enemies[2].hp = 0;
  assert.equal(intent(swapFight.enemies[0], 2, swapFight.enemies).type, 'attack');
});

test('projectile visual modifiers follow the words actually cast', () => {
  for (const [element, modifier] of [['fire', 'burn'], ['ice', 'freeze'], ['fire', 'pierce'], ['fire', 'seal'], ['fire', 'dispel'], ['fire', 'push'], ['fire', 'pull']]) {
    const event = cast(battle(), `shot ${element} ${modifier}`).events.find(e => e.type === 'projectile');
    assert.deepEqual(event.visualModifiers, [modifier]);
  }
  const ordinary = cast(battle(), 'shot lightning').events.find(e => e.type === 'projectile');
  assert.deepEqual(ordinary.visualModifiers, []);
});

test('reward drafts have three seeded choices at every floor, even when cards are maxed', () => {
  const state = createRun('reward-rates', false);
  state.rooms = Array.from({ length: FLOOR50_BOSS_ROOM + 1 }, () => ['striker']);
  state.player.cardUpgrades = Object.fromEntries(Object.keys(WORDS).map(id => [id, 10]));
  for (const room of [2, 5, FLOOR25_BOSS_ROOM, FLOOR30_BOSS_ROOM, FLOOR31_START_ROOM + 1, FLOOR31_START_ROOM + 8, FLOOR50_BOSS_ROOM]) {
    state.room = room;
    const replay = structuredClone(state);
    makeRewards(state);
    makeRewards(replay);
    assert.equal(state.rewards.length, 3, `room ${room}`);
    assert.equal(new Set(state.rewards).size, 3);
    assert.deepEqual(state.rewards, replay.rewards);
  }
});

test('legacy health and incomplete reward migrate once without losing the offered card', () => {
  const old = createRun('legacy-hp', false, ['beam']);
  delete old.hpCurveVersion;
  old.player.level = 80;
  old.player.maxHp = 576;
  old.player.hp = 288;
  old.room = 2;
  old.phase = 'reward';
  old.enemies = [createEnemy('elite')];
  old.enemies[0].hp = 0;
  old.rewards = ['beam'];
  const storage = new MemoryStorage();
  storage.setItem(SAVE_KEY, JSON.stringify(old));
  const first = loadRun(storage).state;
  const again = loadRun(storage).state;
  assert.deepEqual(first, again);
  assert.deepEqual([first.player.maxHp, first.player.hp], [387, 194]);
  assert.equal(first.hpCurveVersion, 1);
  assert.equal(first.rewards.length, 3);
  assert.ok(first.rewards.includes('beam'));
  assert.deepEqual(first.player.hand, old.player.hand);
  assert.equal(saveRun(first, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, first);
});

class MemoryStorage {
  data = new Map();
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
}

test('old middle-tower saves replace upcoming fights while preserving the active room and bosses', () => {
  const state = createRun('middle-roster', false);
  const fresh = structuredClone(state.rooms);
  state.room = state.highestRoom = FLOOR11_START_ROOM;
  state.rooms[state.room] = ['void_imp', 'ember_imp'];
  state.rooms[state.room + 1] = ['aether_warden', 'void_imp'];
  state.enemies = state.rooms[state.room].map(createEnemy);
  state.enemies[0].hp = 12;
  const storage = new MemoryStorage();
  assert.equal(saveRun(state, storage).ok, true);
  const restored = loadRun(storage).state;
  assert.deepEqual(restored.enemies, state.enemies);
  assert.deepEqual(restored.rooms[state.room], state.rooms[state.room]);
  assert.deepEqual(restored.rooms.slice(state.room + 1), fresh.slice(state.room + 1));
  const cleared = structuredClone(restored);
  cleared.enemies.forEach(enemy => { enemy.hp = 1; });
  cleared.player.items = ['ember_scroll'];
  const next = useBattleItem(cleared, 0).state;
  assert.deepEqual(next.enemies.map(enemy => enemy.kind), fresh[state.room + 1]);
});

test('middle-tower intents telegraph shell openings, ally support and movement into vacated slots', () => {
  const state = battle(['prism_crab', 'ink_ray', 'lantern_wisp', 'scroll_moth']);
  const [crab, ray, light, moth] = state.enemies;
  assert.equal(crab.armor, 5);
  assert.equal(intent(crab, 1, state.enemies).type, 'charge');
  state.turn = 2;
  prepareEnemies(state);
  assert.equal(crab.armor, 1);
  assert.equal(intent(crab, 2, state.enemies).amount, 13);
  assert.equal(intent(ray, 2, state.enemies).type, 'charge');
  assert.equal(intent(ray, 3, state.enemies).amount, 12);
  assert.equal(intent(light, 1, state.enemies).type, 'attack');
  crab.hp = 10;
  ray.hp = 12;
  assert.equal(intent(light, 1, state.enemies).target, crab.id);
  assert.equal(intent(moth, 1, state.enemies).target, crab.id);
  state.turn = 1;
  const supported = cast(state, 'guard');
  assert.equal(supported.state.enemies[0].hp, 16);
  assert.equal(supported.state.enemies[0].ward, 1);

  const chase = battle(['striker', 'chain_hound']);
  chase.enemies[0].hp = 1;
  assert.equal(intent(chase.enemies[1], 1, chase.enemies).type, 'attack');
  const opened = cast(chase, 'shot fire');
  assert.equal(opened.summary.enemyActions['enemy-1'].type, 'advance');
  assert.equal(opened.state.enemies[1].slot, 0);
  assert.equal(intent(opened.state.enemies[1], 2, opened.state.enemies).amount, 10);
});

test('death ignores defenses, deals true verdict damage to bosses, and never returns to the hand in the same fight', () => {
  const state = battle(['armored', 'boss']);
  state.collection = ['death'];
  state.player.words = [...START_WORDS.slice(0, 4), 'death'];
  state.player.hand = ['death', 'death'];
  state.enemies[0].ward = 2;
  state.enemies[1].ward = 2;
  state.enemies[1].armor = 5;
  const bossBeforeHp = state.enemies[1].hp;
  const bossCast = cast(state, 'death', 'enemy-1');
  assert.equal(bossCast.summary.enemyHp['enemy-1'], Math.max(0, bossBeforeHp - 100));
  assert.equal(bossCast.state.deathSpent, true);
  const result = cast(state, 'death');
  assert.equal(result.summary.enemyHp['enemy-0'], 0);
  assert.equal(result.summary.enemyHp['enemy-1'], state.enemies[1].hp);
  assert.equal(result.state.deathSpent, true);
  const storage = new MemoryStorage();
  assert.equal(saveRun(result.state, storage).ok, true);
  let restored = loadRun(storage).state;
  restored.player.items = ['redraw_dust'];
  restored = useBattleItem(restored, 0).state;
  assert.ok(!restored.player.hand.includes('death'));
  assert.ok(!cast(restored, 'guard').state.player.hand.includes('death'));
  assert.equal(revisitRoom(restored, 0).deathSpent, undefined);
});

test('black hole pulls enemies inward with stacking 100 true collision damage, survives reload, and collapses for 300/150 true damage', () => {
  const state = battle(['frost_crystal_golem', 'frost_crystal_golem', 'frost_crystal_golem']);
  state.collection = ['blackhole'];
  state.player.words = [...START_WORDS, 'blackhole'];
  state.player.hand = ['blackhole'];
  state.player.maxHp = state.player.hp = 500;
  state.player.maxMana = state.player.mana = 24;
  state.enemies.forEach((enemy, i) => {
    enemy.slot = [0, 1, 4][i];
    enemy.armor = 10;
    enemy.ward = 2;
  });
  const opened = cast(state, 'blackhole', 'slot-2');
  assert.equal(opened.summary.cost, 20);
  // enemy-1 slides 1->2; enemy-0 slides 0->1 then slams into enemy-1 (100 each); enemy-2 slides 4->3 then slams into enemy-1 (100 each)
  assert.deepEqual(opened.state.enemies.map(e => e.slot), [1, 2, 3]);
  assert.deepEqual(opened.state.enemies.map(e => e.hp), [520, 420, 520]);
  assert.equal(opened.summary.damage, 400);
  const storage = new MemoryStorage();
  assert.equal(saveRun(opened.state, storage).ok, true);
  const restored = loadRun(storage).state;
  const collapsed = cast(restored, 'guard');
  // Collapse deals 150 / 300 / 150 ignoring armor (10) and ward (2)
  assert.deepEqual(collapsed.events.filter(e => e.type === 'damage').map(e => e.amount), [150, 300, 150]);
  assert.deepEqual(collapsed.state.enemies.map(e => e.hp), [370, 120, 370]);
  assert.equal(collapsed.state.blackhole, undefined);
});

test('meteor drops 3 seeded-random strikes with main/splash damage through wards, and veil catches overflow', () => {
  const bombard = battle(['obsidian_golem', 'obsidian_golem', 'obsidian_golem']);
  bombard.enemies.forEach((enemy, i) => { enemy.slot = [0, 1, 4][i]; enemy.hp = 120; enemy.maxHp = 120; enemy.ward = 1; });
  const meteor = cast(bombard, 'meteor', 'enemy-1');
  const meteorAgain = cast(bombard, 'meteor', 'enemy-1');
  assert.equal(meteor.events.filter(e => e.type === 'blast').length, 3);
  assert.deepEqual(meteor.summary.enemyHp, meteorAgain.summary.enemyHp);
  const dmgEvents = meteor.events.filter(e => e.type === 'damage');
  assert.ok(dmgEvents.length >= 3);
  for (const ev of dmgEvents) assert.ok(ev.amount === 21 || ev.amount === 9, `unexpected meteor dmg ${ev.amount}`);
  assert.equal(meteor.summary.wards, 0);
  const charge = battle(['loom_sovereign']);
  charge.turn = 2;
  const veil = cast(charge, 'veil');
  assert.equal(veil.summary.blocked, 22);
  assert.equal(veil.summary.incoming, 14);
});

test('the spell catalog and save accept discoveries outside the old manual list and ceiling', () => {
  const catalog = getSpellCatalog();
  for (const phrase of ['shot akki burn', 'blast shield akki', 'wave pair vayu ice', 'storm devastation']) {
    assert.equal(catalog.get(phrase)?.ok, true, phrase);
  }
  assert.equal(catalog.has('shield devastation'), false);
  const state = createRun('large-grimoire');
  state.stats.discovered = [...catalog.keys()];
  assert.ok(state.stats.discovered.length > 1000);
  const storage = new MemoryStorage();
  assert.equal(saveRun(state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state.stats.discovered, state.stats.discovered);
  state.stats.discovered[0] = 'shield devastation';
  assert.equal(saveRun(state, storage).ok, false);
});

test('epic storm hits a selected center and occupied adjacent slots with independent wards', () => {
  assert.equal(WORDS.storm.rarity, 'epic');
  for (const id of ELEMENTS) {
    assert.equal(parseSpell(['storm', id]).cost, 5 + WORDS[id].cost);
  }
  assert.equal(parseSpell(['storm', 'fire', 'pair', 'blast']).ok, false);
  const state = battle(['rune_ram', 'rune_ram', 'rune_ram', 'rune_ram']);
  for (const enemy of state.enemies) enemy.armor = 0;
  const hits = result => result.events.filter(event => event.type === 'damage').map(({ target, amount }) => [target, amount]);
  const centered = [['enemy-1', 12], ['enemy-0', 6], ['enemy-2', 6]];
  const storm = cast(state, 'storm', 'enemy-1');
  assert.equal(storm.summary.cost, 5);
  assert.deepEqual(hits(storm), centered);
  assert.deepEqual(hits(cast(state, 'storm fire', 'enemy-1')), [['enemy-1', 15], ['enemy-0', 8], ['enemy-2', 8]]);
  assert.deepEqual(hits(cast(state, 'storm akki', 'enemy-1')), [['enemy-1', 30], ['enemy-0', 15], ['enemy-2', 15]]);
  state.enemies[1].ward = 1;
  state.enemies[2].slot = 4;
  state.enemies[3].slot = 2;
  state.enemies[0].armor = 2;
  const shielded = cast(state, 'storm akki', 'enemy-1');
  assert.deepEqual(hits(shielded), [['enemy-0', 13], ['enemy-3', 15]]);
  assert.equal(shielded.summary.enemyStatus['enemy-1'].ward, 0);
  assert.equal(shielded.summary.enemyStatus['enemy-1'].healCutUntil, undefined);
  assert.equal(shielded.summary.enemyStatus['enemy-0'].healCutUntil, 2);
  assert.equal(shielded.summary.enemyHp['enemy-0'], 39);
});

test('storm pair, two-element and blast formulas preserve independent wards and damage', () => {
  const state = battle(['rune_ram', 'rune_ram', 'rune_ram', 'rune_ram', 'rune_ram']);
  state.player.maxHp = state.player.hp = 120;
  state.player.maxMana = state.player.mana = 24;
  for (const enemy of state.enemies) enemy.armor = 0;
  const duplicates = parseSpell(['storm', 'fire', 'fire', 'blast']);
  assert.equal(duplicates.ok, false);
  assert.equal(duplicates.index, 2);
  for (const [first, second] of [['fire', 'akki'], ['ice', 'heman'], ['lightning', 'asani'], ['akki', 'vayu'], ['fire', 'vayu']]) {
    assert.equal(parseSpell(['storm', first, second]).ok, true);
  }
  const center = 'enemy-2';
  const hp = result => Object.values(result.summary.enemyHp);
  assert.deepEqual(hp(cast(state, 'storm fire akki', center)), [52, 40, 29, 40, 52]);
  assert.deepEqual(hp(cast(state, 'storm akki fire', center)), [52, 40, 29, 40, 52]);
  const wind = battle(['rune_ram']);
  assert.equal(cast(wind, 'storm fire vayu').summary.enemyStatus['enemy-0'].slot, 1);

  state.enemies[2].ward = 1;
  const pair = cast(state, 'storm fire pair', center);
  assert.equal(pair.summary.cost, 10);
  assert.deepEqual(hp(pair), [52, 39, 43, 39, 52]);
  assert.equal(pair.summary.wards, 1);
  assert.equal(cast(state, 'storm fire blast', center).events.some(event => event.type === 'blast'), false);

  state.enemies[2].ward = 0;
  state.enemies[4].ward = 1;
  const explosive = cast(state, 'storm fire akki blast', center);
  assert.equal(explosive.summary.cost, 13);
  assert.deepEqual(hp(explosive), [40, 28, 17, 28, 52]);
  assert.equal(explosive.summary.enemyStatus['enemy-4'].ward, 1);

  const devastation = cast(state, 'shot fire devastation', center);
  assert.equal(WORDS.devastation.rarity, 'legendary');
  assert.equal(devastation.summary.cost, 8);
  assert.deepEqual(hp(devastation), [42, 42, 22, 42, 52]);
  assert.equal(devastation.events.find(event => event.type === 'blast').devastation, true);
  assert.deepEqual(hp(cast(state, 'storm fire devastation', center)), [37, 22, 7, 22, 52]);
});

test('beam pair, wave pair and blast, storm pierce, and grand work across attack forms', () => {
  const state = battle(Array(5).fill('rune_ram'));
  state.player.maxMana = state.player.mana = 20;
  state.player.maxHp = state.player.hp = 120;
  for (const enemy of state.enemies) enemy.armor = 0;
  const hp = result => Object.values(result.summary.enemyHp);
  const target = 'enemy-2';
  state.enemies[2].ward = 1;
  const beam = cast(state, 'beam fire pair', target, 'enemy-3');
  assert.equal(beam.summary.cost, 8);
  assert.equal(beam.summary.wards, 0);
  assert.deepEqual(hp(beam), [52, 52, 42, 42, 52]);
  const wave = cast(state, 'wave fire pair', target);
  assert.equal(wave.summary.cost, 10);
  assert.equal(wave.summary.wards, 1);
  assert.deepEqual(hp(wave), [40, 40, 46, 40, 40]);
  state.enemies[2].ward = 0;
  const blast = cast(state, 'wave ice blast', target);
  assert.equal(blast.summary.cost, 7);
  assert.deepEqual(hp(blast), [48, 46, 46, 46, 48]);
  assert.equal(blast.summary.enemyStatus[target].chill, 8);
  for (const enemy of state.enemies) enemy.armor = 3;
  assert.deepEqual(hp(cast(state, 'storm fire pierce', target)), [52, 45, 38, 45, 52]);
  for (const enemy of state.enemies) enemy.armor = 0;
  for (const [form, expected] of [
    ['shot', [52, 47, 43, 47, 52]], ['beam', [52, 47, 43, 47, 52]],
    ['wave', [46, 43, 46, 43, 46]], ['storm', [52, 38, 38, 38, 52]],
  ]) {
    const grand = cast(state, `grand ${form} ice`, target);
    assert.equal(grand.summary.cost, parseSpell([form, 'ice']).cost + 3);
    assert.deepEqual(hp(grand), expected);
    assert.equal(grand.events.filter(event => event.type === 'blast').length, 1);
  }
  assert.equal(parseSpell(['grand', 'storm']).cost, 8);
  assert.equal(parseSpell(['grand', 'shield', 'devastation']).ok, false);
  assert.equal(parseSpell(['wave', 'ice', 'blast', 'devastation']).ok, true);
});

test('cross-form freeze, pierce, and push keep their defenses and targets distinct', () => {
  const state = battle(['rune_ram', 'rune_ram', 'rune_ram']);
  state.enemies[1].ward = 1;
  state.enemies[1].armor = 4;
  const center = 'enemy-1';
  const freeze = cast(state, 'beam ice freeze', center);
  assert.equal(freeze.summary.cost, 7);
  assert.equal(freeze.summary.enemyHp[center], 50);
  assert.equal(freeze.summary.enemyActions[center].type, 'frozen');
  assert.equal(freeze.summary.enemyStatus[center].ward, 1);
  assert.equal(parseSpell(['beam', 'fire', 'freeze']).ok, false);

  for (const enemy of state.enemies) enemy.armor = 4;
  const wave = cast(state, 'wave lightning pierce', center);
  assert.equal(wave.summary.cost, 6);
  assert.deepEqual(Object.values(wave.summary.enemyHp), [47, 52, 47]);
  assert.equal(wave.summary.wards, 1);

  state.enemies[2].slot = 3;
  const blocked = cast(state, 'storm fire push', center);
  assert.equal(blocked.summary.enemyStatus[center].slot, 1);
  state.enemies[1].ward = 0;
  const pushed = cast(state, 'storm fire push', center);
  assert.equal(pushed.summary.cost, 8);
  assert.deepEqual(Object.values(pushed.summary.enemyStatus).map(enemy => enemy.slot), [0, 2, 3]);
  assert.equal(pushed.summary.enemyHp['enemy-2'], 52);
  state.enemies[2].slot = 2;
  assert.equal(cast(state, 'storm fire push', center).summary.enemyStatus[center].slot, 1);
  assert.equal(getSpellCatalog().has('beam ice freeze devastation'), true);
});

test('large and grand defenses keep their timing, upgrades, and save behavior', () => {
  const costs = [
    ['heal large', 5], ['heal self large', 5], ['grand heal', 7],
    ['shield large', 5], ['grand shield', 6], ['shield ice large', 6],
    ['shield ice large pair', 12], ['shield large heal', 7],
  ];
  for (const [phrase, cost] of costs) {
    assert.equal(parseSpell(phrase.split(' ')).cost, cost, phrase);
    assert.equal(parseSpell([...phrase.split(' '), 'devastation']).ok, false, phrase);
  }

  const state = battle();
  state.player.hp = 12;
  const heals = result => result.events.filter(event => event.type === 'heal');
  const largeHeal = cast(state, 'heal large');
  assert.deepEqual(heals(largeHeal).map(event => event.amount), [8]);
  assert.equal(largeHeal.state.player.hp, 17);
  const grandHeal = cast(state, 'grand heal');
  assert.deepEqual(grandHeal.events.filter(event => ['heal', 'attack'].includes(event.type)).map(event => event.amount), [6, 3, 6]);
  assert.equal(grandHeal.state.player.hp, 21);
  assert.equal(heals(grandHeal).at(-1).nextTurn, true);
  state.player.hp = state.player.maxHp;
  assert.deepEqual(heals(cast(state, 'grand heal')).map(event => event.amount), [0, 3]);

  const boss = battle(['crown_archivist']);
  boss.turn = 2;
  boss.player.hp = 10;
  const lethal = cast(boss, 'grand heal');
  assert.equal(lethal.state.phase, 'lost');
  assert.equal(heals(lethal).some(event => event.nextTurn), false);
  const broken = cast(boss, 'grand shield');
  assert.equal(broken.state.player.shield, null);
  assert.equal(broken.events.some(event => event.restored), false);

  state.player.hp = 12;
  const largeShield = cast(state, 'shield ice large');
  assert.equal(largeShield.state.player.shield.layers[0], 6);
  assert.equal(largeShield.state.player.shield.effect, 'ice');
  assert.equal(largeShield.state.enemies[0].chill, 4);
  const mixed = cast(state, 'shield large heal');
  assert.equal(mixed.state.player.hp, 16);
  assert.equal(mixed.state.player.shield.layers[0], 6);
  const renewed = cast(state, 'grand shield');
  assert.equal(renewed.summary.shield, 12);
  assert.equal(renewed.events.at(-1).restored, 3);

  state.player.hp = 700;
  state.player.maxHp = 1000;
  state.player.level = 242;
  state.collection.push('heal', 'grand', 'large');
  state.learned.push('heal', 'grand', 'large');
  state.player.words = ['shot', 'fire', 'ice', 'shield', 'heal', 'grand', 'large'];
  state.player.cardUpgrades = { heal: 10, grand: 10, shield: 10 };
  state.player.hand = ['heal', 'large'];
  // 8 base + 20 (heal+10) + 50 (5% MaxHP main) + 120 (12% MaxHP sec) = 198 immediate + 8 next-turn regen = 206
  assert.equal(cast(state, 'heal large').summary.healed, 206);
  state.player.hand = ['grand', 'heal'];
  // 6 base + 20 (heal+10) + 50 (5% main) + 30 (grand+10 main +3/lv) + 120 (heal+10 12% sec) + 15 (grand+10 sec) = 241 immediate
  // next-turn: 6 base + 6 (grand+10 sec) + 8 (heal+10 sec regen) = 20
  assert.deepEqual(heals(cast(state, 'grand heal')).map(event => event.amount), [241, 20]);
  state.player.hand = ['grand', 'shield'];
  const fortified = cast(state, 'grand shield');
  // 12 base + 20 (shield+10) + 30 (grand+10 main) + 15 (grand+10 sec) = 77 cap (restored to 77 after 3 enemy dmg)
  assert.equal(fortified.state.player.shield.layers[0], 77);
  const storage = new MemoryStorage();
  assert.equal(saveRun(fortified.state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, fortified.state);
});

test('devastation is a final attack suffix that preserves targeting and existing modifiers', () => {
  for (const phrase of ['beam ice', 'wave lightning', 'shot fire pair', 'shot ice freeze', 'shot fire dispel', 'grand shot fire', 'storm fire vayu']) {
    const words = phrase.split(' ');
    const base = parseSpell(words);
    const upgraded = parseSpell([...words, 'devastation']);
    assert.equal(upgraded.ok, true, phrase);
    assert.equal(upgraded.cost, base.cost + 5, phrase);
    assert.deepEqual(upgraded.spell, { ...base.spell, multiplier: base.spell.multiplier * 2, cost: base.cost + 5, devastation: true });
    assert.ok(DEVASTATION_FORMULAS.some(candidate => candidate.join(' ') === `${phrase} devastation`));
  }
  for (const phrase of [
    'devastation', 'devastation shot fire', 'shot devastation fire', 'shot fire devastation devastation',
    'shield devastation', 'shield fire devastation', 'shield heal devastation', 'heal self devastation',
    'blast shield fire devastation', 'storm fire akki blast devastation',
  ]) {
    assert.equal(parseSpell(phrase.split(' ')).ok, false, phrase);
  }
  const state = battle(Array(5).fill('rune_ram'));
  state.player.maxMana = state.player.mana = 20;
  state.player.maxHp = state.player.hp = 120;
  for (const enemy of state.enemies) enemy.armor = 0;
  const hp = result => Object.values(result.summary.enemyHp);
  const bursts = result => result.events.filter(event => event.type === 'blast' && event.devastation);
  state.enemies[2].ward = 1;
  const beam = cast(state, 'beam fire devastation', 'enemy-2');
  assert.deepEqual(hp(beam), [42, 42, 32, 42, 42]);
  assert.equal(beam.summary.enemyStatus['enemy-2'].ward, 1);
  const paired = cast(state, 'shot fire pair devastation', 'enemy-2');
  assert.deepEqual(hp(paired), [42, 42, 22, 42, 42]);
  assert.equal(bursts(paired).length, 1);
  const dispelled = cast(state, 'shot fire dispel devastation', 'enemy-2');
  assert.deepEqual(hp(dispelled), [42, 42, 22, 42, 42]);
  state.enemies[2].ward = 0;
  const wave = cast(state, 'wave fire devastation', 'enemy-2');
  assert.deepEqual(hp(wave), [34, 34, 34, 34, 34]);
  assert.equal(bursts(wave)[0].target, 'enemy-2');
  const doubleBlast = cast(state, 'storm fire blast devastation', 'enemy-2');
  assert.equal(doubleBlast.events.filter(event => event.type === 'blast').length, 2);
  assert.equal(bursts(doubleBlast).length, 1);
});

test('epic hybrid cards use the existing elemental slots and each has its own effect', () => {
  for (const id of Object.keys(FUSED_ELEMENTS)) {
    assert.equal(WORDS[id].rarity, 'epic');
    assert.equal(parseSpell(['shot', id]).cost, 8);
    assert.equal(parseSpell(['beam', id]).cost, 9);
    assert.equal(parseSpell(['wave', id]).cost, 10);
    assert.equal(parseSpell(['shield', id]).cost, 9);
    assert.equal(parseSpell(['shot', 'fire', 'pair', id]).ok, true);
  }
  const mist = cast(battle(['obsidian_golem']), 'shot mist');
  assert.equal(mist.state.enemies[0].wetUntil, 2);
  assert.equal(mist.state.enemies[0].obscured, true);
  mist.state.player.mana = 12;
  const hail = cast(mist.state, 'shot hail');
  assert.equal(hail.summary.enemyStatus['enemy-0'].freeze, 1);
  assert.equal(hail.summary.enemyStatus['enemy-0'].wetUntil, undefined);
  assert.equal(hail.summary.enemyActions['enemy-0'].type, 'frozen');
  const dry = cast(battle(['rune_ram']), 'shot hail');
  assert.equal(dry.summary.enemyStatus['enemy-0'].chill, 2);
  const charging = battle(['obsidian_golem']);
  const plain = cast(charging, 'guard');
  const obscured = cast(charging, 'shot mist');
  assert.equal(intent(plain.state.enemies[0], 2).amount - intent(obscured.state.enemies[0], 2).amount, 4);

  const storm = neutralArmored(2);
  storm.enemies[1].slot = 2;
  const thunder = cast(storm, 'shot thunderstorm');
  assert.equal(thunder.summary.enemyStatus['enemy-0'].slot, 1);
  assert.deepEqual(thunder.events.filter(event => event.type === 'damage').map(event => event.amount), [20, 10]);
  assert.ok(thunder.events.findIndex(event => event.type === 'push') < thunder.events.findIndex(event => event.type === 'chain-lightning'));
  const blocked = battle(['rune_ram']);
  blocked.enemies[0].ward = 1;
  assert.equal(cast(blocked, 'shot magma').state.magmaPuddles, undefined);
  const shield = cast(battle(['rune_ram']), 'shield mist');
  assert.equal(shield.state.enemies[0].wetUntil, 2);
});

test('magma survives saving, erupts on its slot, and permanently shreds armor', () => {
  const state = battle(['sentinel', 'sentinel']);
  state.player.maxHp = state.player.hp = 100;
  state.collection.push('magma');
  state.learned.push('magma');
  state.player.words = [...START_WORDS, 'magma'];
  state.player.hand = ['shot', 'magma'];
  const castResult = cast(state, 'shot magma');
  const storage = new MemoryStorage();
  assert.deepEqual(castResult.state.magmaPuddles, [0]);
  assert.equal(saveRun(castResult.state, storage).ok, true);
  const restored = loadRun(storage).state;
  assert.deepEqual(restored.magmaPuddles, [0]);
  const ripple = cast(restored, 'guard');
  assert.equal(ripple.events.find(event => event.type === 'magma-erupt').target, 'enemy-0');
  assert.equal(ripple.events.find(event => event.element === 'magma' && event.type === 'damage').amount, 6);
  assert.equal(ripple.state.enemies[0].armor, 0);
  assert.equal(ripple.state.enemies[0].permanentArmorShred, 2);
  assert.equal(cast(ripple.state, 'guard').state.enemies[0].armor, 0);
  restored.enemies[0].slot = 3;
  assert.equal(cast(restored, 'guard').events.find(event => event.type === 'magma-erupt').target, undefined);
  for (const enemy of restored.enemies) enemy.hp = 1;
  restored.player.items = ['ember_scroll'];
  const cleared = useBattleItem(restored, 0).state;
  assert.equal(cleared.magmaPuddles, undefined);
  assert.equal(saveRun(cleared, storage).ok, true);
});

test('four slots, invalid duplicates, unknown words and unavailable cards', () => {
  for (const phrase of ['', 'shot', 'fire', 'pair shot fire', 'shot fire pair pair', 'shot fire blast blast', 'shot fire pair ice blast', '__proto__', 'shield ice blast']) {
    assert.equal(parseSpell(phrase.split(' ')).ok, false, phrase);
  }
  assert.equal(parseSpell(['shot', null, 'fire']).ok, true);
  assert.equal(parseSpell(['shot', 'lightning'], START_WORDS).ok, false);
});

test('experimental fizzle spends the card and mana, then lets the enemy act', () => {
  const state = createRun('fizzle', true);
  const result = simulateTurn(state, ['shot'], 'enemy-0', 'enemy-0', { allowFizzle: true });
  assert.equal(result.ok, true);
  assert.equal(result.summary.fizzled, true);
  assert.equal(result.summary.cost, 1);
  assert.equal(result.summary.manaAfterCast, 11);
  assert.deepEqual(result.events.slice(0, 2).map(event => event.type), ['fizzle', 'attack']);
  assert.equal(result.state.player.hp, 33);
  assert.equal(result.state.turn, 2);
  assert.deepEqual(result.state.stats.discovered, []);
  assert.deepEqual(state.player.hand.slice(1), result.state.player.hand.slice(0, 4));
});

test('word order changes the number of projectiles and explosions', () => {
  const a = parseSpell(['shot', 'fire', 'pair', 'blast']).spell;
  const b = parseSpell(['shot', 'fire', 'blast', 'pair']).spell;
  assert.deepEqual([a.shots, a.blasts, a.cost], [2, 1, 10]);
  assert.deepEqual([b.shots, b.blasts, b.cost], [1, 2, 7]);
  const enemies = battle(['swarm', 'striker', 'striker']);
  const result = cast(enemies, 'shot fire blast pair');
  const effects = result => result.events.filter(event => ['projectile', 'blast'].includes(event.type)).map(event => event.type);
  assert.deepEqual(effects(result), ['projectile', 'blast', 'blast']);
  assert.deepEqual(effects(cast(enemies, 'shot fire pair blast')), ['projectile', 'blast', 'projectile', 'blast']);
  assert.deepEqual(effects(cast(battle(['warden']), 'shot fire blast pair')), ['projectile']);
  assert.equal(result.summary.enemyHp['enemy-0'], 0);
  assert.equal(result.summary.enemyHp['enemy-1'], 10);
  assert.equal(result.summary.enemyHp['enemy-2'], 16);
});

test('two projectiles can target separately and retarget by HP, distance and leftmost slot', () => {
  const state = battle(['striker', 'swarm', 'striker']);
  state.enemies[2].hp = 11;
  const same = cast(state, 'shot fire pair', 'enemy-1');
  assert.deepEqual(same.events.filter(event => event.type === 'projectile').map(event => event.target), ['enemy-1', 'enemy-2']);
  const split = cast(state, 'shot fire pair', 'enemy-1', 'enemy-0');
  assert.deepEqual(split.events.filter(event => event.type === 'projectile').map(event => event.target), ['enemy-1', 'enemy-0']);
  state.enemies[2].hp = 16;
  assert.equal(cast(state, 'shot fire pair', 'enemy-1').events.filter(event => event.type === 'projectile')[1].target, 'enemy-0');
});

test('direct blast formulas use a fixed center, apply elemental effects and respect independent wards', () => {
  const catalog = getSpellCatalog();
  assert.equal(catalog.get('blast').cost, 4);
  for (const element of ELEMENTS) {
    const cost = WORDS[element].cost;
    for (const [phrase, expected] of [
      [`blast ${element}`, 4 + cost],
      [`blast ${element} pair`, 7 + cost],
      [`grand blast ${element}`, 7 + cost],
      [`grand blast ${element} pair`, 10 + cost],
      [`grand shot ${element} pair`, 2 * (4 + cost)],
    ]) assert.equal(catalog.get(phrase)?.cost, expected, phrase);
    assert.equal(parseSpell(['blast', element, element]).ok, false);
    for (const other of ELEMENTS.filter(id => id !== element)) {
      const mixed = catalog.get(`blast ${element} ${other}`);
      assert.equal(mixed?.cost, 3 + cost + WORDS[other].cost);
      assert.deepEqual(mixed.spell, catalog.get(`blast ${other} ${element}`).spell);
    }
  }
  assert.equal(parseSpell(['grand', 'blast']).ok, false);
  assert.equal(catalog.get('blast shield fire').spell.form, 'detonate');
  const state = battle(Array(4).fill('striker'));
  for (const enemy of state.enemies) enemy.hp = 50;
  state.enemies[0].ward = 1;
  const fused = cast(state, 'blast fire ice', 'enemy-1');
  assert.equal(fused.summary.cost, 7);
  assert.equal(fused.summary.enemyHp['enemy-1'], 42);
  assert.equal(fused.summary.enemyStatus['enemy-1'].chill, 4);
  assert.equal(fused.summary.enemyStatus['enemy-0'].ward, 1);
  assert.equal(fused.events.some(event => event.type === 'projectile'), false);
  assert.deepEqual(fused.events.find(event => event.type === 'blast').elements, ['fire', 'ice']);
  const events = result => result.events.filter(event => event.type === 'blast');
  assert.equal(events(cast(state, 'blast fire pair', 'enemy-1')).length, 2);
  const grand = cast(state, 'grand blast fire pair', 'enemy-1');
  assert.deepEqual(events(grand).map(event => [event.originSlot, event.radius, event.scale]), [[1, 2, 1], [1, 2, 0.6]]);
  assert.deepEqual(grand.summary.enemyHp, { 'enemy-0': 50, 'enemy-1': 26, 'enemy-2': 37, 'enemy-3': 37 });
  const stage = Object.assign(Object.create(Battlefield.prototype), { state, settings: { reducedMotion: false } });
  stage.animate(grand.events);
  assert.deepEqual(events(stage).map(event => event.hits.length), [3, 3]);
  const defeated = cast(battle(['swarm']), 'blast fire pair');
  assert.deepEqual(events(defeated).map(event => event.targets), [['enemy-0'], []]);
});

test('grand shot pair uses both selected targets and bursts at each impact', () => {
  const state = battle(Array(4).fill('striker'));
  for (const enemy of state.enemies) enemy.hp = 50;
  const result = cast(state, 'grand shot fire pair', 'enemy-0', 'enemy-3');
  const targets = type => result.events.filter(event => event.type === type).map(event => event.target);
  assert.deepEqual(targets('projectile'), ['enemy-0', 'enemy-3']);
  assert.deepEqual(targets('blast'), ['enemy-0', 'enemy-3']);
  assert.equal(result.summary.cost, 12);
});

test('ward blocks an entire explosive projectile, wave checks each ward, beam bypasses', () => {
  const state = battle(['warden', 'striker']);
  assert.equal(cast(state, 'shot fire blast').summary.damage, 0);
  assert.equal(cast(state, 'shot fire pair').summary.damage, 10);
  assert.equal(cast(state, 'wave fire').summary.damage, 6);
  assert.equal(cast(state, 'beam fire').summary.damage, 10);
});

test('fusion is commutative, averages damage, carries ice and pierces for the whole hit', () => {
  const state = battle(['armored']);
  const first = cast(state, 'shot fire pair ice');
  const reversed = cast(state, 'shot ice pair fire');
  assert.deepEqual(first.summary, reversed.summary);
  assert.equal(first.summary.cost, 5);
  assert.equal(first.summary.damage, 5);
  assert.equal(first.summary.incoming, 0);
  assert.equal(first.events.filter(e => e.type === 'projectile').length, 1);
  assert.equal(cast(state, 'shot fire pair fire').summary.damage, 12);
  assert.equal(cast(state, 'shot fire pair lightning').summary.damage, 8);
  assert.equal(cast(state, 'shot lightning pierce').summary.damage, 8);
});

test('piercing applies to explosions, and fractional damage rounds up before armor', () => {
  const state = battle(['armored', 'armored']);
  assert.equal(cast(state, 'shot fire pierce blast').summary.enemyHp['enemy-1'], 15);
  assert.equal(cast(state, 'wave lightning').events.find(event => event.type === 'damage').amount, 4);
});

test('frost stacks and remains after skipped attacks or charge actions', () => {
  const state = battle(['charger']);
  const pair = cast(state, 'shot ice pair').state;
  assert.equal(pair.enemies[0].chill, 8);
  assert.equal(intent(pair.enemies[0], 2).amount, 0);
  const frozen = cast(state, 'shot ice freeze').state;
  const skipped = cast(frozen, 'guard');
  assert.equal(skipped.events.some(event => event.type === 'frozen'), true);
  assert.equal(skipped.state.enemies[0].chill, 4);
});

test('burn ticks before the next enemy action and a new application waits another turn', () => {
  const state = battle(['elite']);
  state.enemies[0].ward = 0;
  const first = cast(state, 'shot fire burn');
  assert.equal(first.state.enemies[0].burn, 3);
  first.state.enemies[0].ward = 0;
  const second = cast(first.state, 'shot fire burn');
  assert.deepEqual(second.events.map(event => event.type), ['projectile', 'damage', 'status', 'status', 'damage', 'attack']);
  assert.equal(second.state.enemies[0].burnTurn, 3);
});

test('push needs an empty slot and preserves the charge schedule', () => {
  assert.equal(cast(battle(['charger', 'striker']), 'shot fire push').state.enemies[0].slot, 0);
  const pushed = cast(battle(['charger']), 'shot fire push');
  assert.equal(pushed.state.enemies[0].slot, 1);
  assert.equal(intent(pushed.state.enemies[0], 2).type, 'attack');
});

test('shield protection carries one turn, and two layers detonate across the field', () => {
  const state = battle(['charger']);
  const shield = cast(state, 'shield').state;
  assert.equal(shield.player.shield.layers[0], 6);
  assert.equal(cast(shield, 'guard').state.player.shield, null);
  const twice = cast(state, 'shield fire pair').state;
  assert.deepEqual(twice.player.shield.layers, [6, 6]);
  const detonation = cast(twice, 'blast shield fire');
  assert.equal(detonation.summary.damage, 10);
  assert.equal(detonation.state.player.shield, null);
  assert.equal(simulateTurn(state, ['blast', 'shield', 'fire']).ok, false);
});

test('elemental shields counter each attacker, explosive shield only triggers on break', () => {
  const state = battle(['striker', 'striker', 'striker']);
  const fire = cast(state, 'shield fire pair');
  assert.deepEqual(fire.state.enemies.map(enemy => enemy.burn), [3, 3, 3]);
  const blast = cast(state, 'shield fire blast');
  assert.equal(blast.summary.damage, 15);
  assert.deepEqual(blast.state.enemies.map(enemy => enemy.burn), [0, 0, 0]);
  const ice = cast(state, 'shield ice');
  const stacked = cast(ice.state, 'shield fire');
  assert.deepEqual(stacked.state.player.shield.layers, [3]);
  assert.equal(stacked.state.player.shield.effect, 'fire');
});

test('stacked shield layers retain their elements and expire independently after saving', () => {
  const state = createRun('stack-and-save');
  state.player.hand = ['shield', 'fire'];
  const first = cast(state, 'shield fire').state;
  first.player.hand = ['shield', 'ice'];
  const second = cast(first, 'shield ice');
  const created = second.events.find(event => event.type === 'shield');
  assert.deepEqual(created.protection.details.map(({ hp, effect }) => [hp, effect]), [[3, 'fire'], [6, 'ice']]);
  assert.deepEqual(second.state.player.shield.layers, [6]);
  assert.equal(second.state.player.shield.effect, 'ice');
  const storage = new MemoryStorage();
  assert.equal(saveRun(second.state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state.player.shield, second.state.player.shield);
});

test('healing is immediate and pair on shield healing doubles only healing', () => {
  const state = battle(['charger']);
  state.player.hp = 18;
  const result = cast(state, 'shield heal pair');
  assert.equal(result.summary.healed, 8);
  assert.deepEqual(result.state.player.shield.layers, [6]);
  assert.equal(cast(state, 'heal self').summary.healed, 4);
});

test('preview and commit agree and leave source state and RNG intact', () => {
  const state = battle(['elite']);
  state.room = 2;
  state.enemies[0].hp = 1;
  const before = structuredClone(state);
  const result = cast(state, 'shot fire pair');
  assert.deepEqual(state, before);
  assert.deepEqual(result, cast(state, 'shot fire pair'));
  assert.equal(result.state.phase, 'reward');
  assert.equal(result.state.rewards.length, 3);
});

test('seeded tower run wins nine fights, sees three drafts, and reloads each checkpoint', () => {
  const storage = new MemoryStorage();
  let state = createRun('hand-14', true);
  state.rooms = state.rooms.slice(0, 9);
  const drafts = [];
  const steps = [];
  while (!['won', 'lost'].includes(state.phase) && steps.length < 60) {
    if (state.phase === 'battle' && state.player.hand.length > 10) {
      const ranked = state.player.hand.map((id, index) => ({
        index, score: (['shot', 'beam', 'wave'].includes(id) ? -4 : ['fire', 'ice', 'pair', 'lightning'].includes(id) ? -2 : 0)
          + state.player.hand.filter(card => card === id).length,
      }));
      ranked.sort((a, b) => b.score - a.score);
      state = discardOverflow(state, ranked.slice(0, state.player.hand.length - 10).map(card => card.index));
    }
    if (state.phase === 'reward') {
      assert.ok(isBossRoom(state));
      assert.equal(new Set(state.rewards).size, 3);
      const replay = structuredClone(state);
      assert.deepEqual(replay.rewards, state.rewards);
      drafts.push(state.room);
      state = chooseReward(
        state,
        state.rewards.find(id => !state.player.words.includes(id) && (id === 'beam' || id === 'blast'))
          ?? state.rewards.find(id => !state.player.words.includes(id))
          ?? state.rewards[0]
      );
    } else if (state.phase === 'loadout') {
      state = equipWords(state, state.player.words);
    } else {
      const choices = [];
      const phrases = ['shot fire blast', 'shot fire pair', 'shot fire', 'shot ice', 'shot ice pair', 'beam fire', 'beam ice', 'shot lightning', 'shot fire pair fire', 'wave fire', 'wave ice'];
      for (const enemy of state.enemies.filter(enemy => enemy.hp > 0)) {
        for (const phrase of phrases) {
          const result = simulateTurn(state, phrase.split(' '), enemy.id);
          if (result.ok) choices.push(result);
        }
      }
      choices.push(simulateTurn(state, 'guard'));
      const score = result => result.summary.damage - result.summary.incoming * 2 - result.summary.cost * 0.2 + (result.state.room !== state.room || result.state.phase === 'reward' ? 50 : 0);
      state = choices.sort((a, b) => score(b) - score(a))[0].state;
    }
    steps.push(state.phase);
    assert.equal(saveRun(state, storage).ok, true, state.phase);
    assert.deepEqual(loadRun(storage).state, state);
  }
  assert.equal(state.phase, 'won');
  assert.deepEqual(drafts, [2, 5, 8]);
  assert.equal(state.collection.length, 3);
  assert.equal(state.player.words.length, 7);
  const next = createRun('next', false, state.collection);
  assert.deepEqual(next.player.words, START_WORDS);
  assert.deepEqual(next.collection, state.collection);
  const a = createRun('seed'); const b = createRun('seed');
  makeRewards(a); makeRewards(b);
  assert.deepEqual(a, b);
});

test('deck cap and previously collected cards apply at the next floor', () => {
  let state = createRun('cards', true, ['beam', 'blast']);
  state.room = 2;
  state.enemies = [createEnemy('elite')];
  state.enemies[0].hp = 0;
  makeRewards(state);
  state = chooseReward(state, state.rewards[0]);
  const replacement = state.player.words.includes('beam') ? 'blast' : 'beam';
  assert.throws(() => equipWords(state, [...state.player.words, replacement]));
  const words = state.player.words.map(id => id === 'shield' ? replacement : id);
  state = equipWords(state, words);
  assert.equal(state.room, 3);
  assert.ok(state.player.words.includes(replacement));
  assert.equal(validateRun(state), state);
  state.room = 5;
  state.enemies = [createEnemy('sentinel')];
  state.enemies[0].hp = 0;
  makeRewards(state);
  assert.equal(state.rewards.length, 3);
  state = chooseReward(state, state.rewards[0]);
  assert.equal(new Set(state.player.words).size, state.player.words.length);
  assert.equal(validateRun(state), state);
});

test('duplicate early rewards do not leave the deck capped at six', () => {
  const state = createRun('duplicate-early-reward', false, ['beam']);
  state.room = 5;
  state.highestRoom = 6;
  state.rewardedBossRooms = [2];
  state.learned = ['beam'];
  state.player.words.push('beam');
  state.phase = 'reward';
  state.rewards = ['beam'];
  const chosen = chooseReward(state, 'beam');
  assert.equal(chosen.player.words.length, 7);
  assert.equal(new Set(chosen.player.words).size, 7);
  assert.equal(chosen.collection.length, 2);
  assert.deepEqual(chosen.player.words, chooseReward(state, 'beam').player.words);
});

test('loading an old six-card run repairs the missing seventh card', () => {
  const state = createRun('repair-six-cards', false, ['beam']);
  state.room = state.highestRoom = 6;
  state.enemies = state.rooms[6].map(createEnemy);
  state.rewardedBossRooms = [2, 5];
  state.learned = ['beam'];
  state.player.words.push('beam');
  const storage = new MemoryStorage();
  assert.equal(saveRun(state, storage).ok, true);
  const repaired = loadRun(storage).state;
  assert.equal(repaired.player.words.length, 7);
  assert.equal(new Set(repaired.player.words).size, 7);
  assert.deepEqual(repaired.player.words, loadRun(storage).state.player.words);
  assert.equal(saveRun(repaired, storage).ok, true);
  assert.deepEqual(loadRun(storage).state.player.words, repaired.player.words);
});

test('early game over resets cards and discovered spells in the saved run', () => {
  const state = createRun('early-loss-reset', false, ['beam']);
  state.learned = ['beam'];
  state.player.words.push('beam');
  state.stats.discovered = ['shot fire'];
  state.player.hp = 1;
  state.turn = 7;
  const result = simulateTurn(state, 'guard');
  assert.equal(result.state.phase, 'lost');
  assert.deepEqual(result.state.collection, []);
  assert.deepEqual(result.state.learned, []);
  assert.deepEqual(result.state.player.words, START_WORDS);
  assert.deepEqual(result.state.stats.discovered, []);
  const storage = new MemoryStorage();
  assert.equal(saveRun(result.state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state.collection, []);
});

test('loss stops further retaliation', () => {
  const state = battle(['striker', 'striker']);
  state.player.hp = 1;
  const result = cast(state, 'shot fire');
  assert.equal(result.state.phase, 'lost');
  assert.equal(result.events.filter(event => event.type === 'attack').length, 1);
});

test('save round trip, backup recovery, old save and denial are safe', () => {
  const storage = new MemoryStorage();
  const state = createRun('save', true);
  storage.setItem('spell-foundry.run.v1', '{"version":1}');
  assert.match(loadRun(storage).error, /ระบบคาถาเดิม/);
  assert.equal(saveRun(state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, state);
  const next = cast(state, 'shot fire').state;
  assert.equal(saveRun(next, storage).ok, true);
  assert.deepEqual(JSON.parse(storage.getItem(BACKUP_KEY)), state);
  storage.setItem(SAVE_KEY, '{broken');
  assert.equal(loadRun(storage).recovered, true);
  assert.equal(storage.getItem(SAVE_KEY), '{broken');
  assert.equal(storage.getItem('spell-foundry.run.v1'), '{"version":1}');
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } };
  assert.equal(loadRun(denied).ok, false);
  assert.equal(saveRun(state, denied).ok, false);
  assert.equal(loadSettings(denied).sfx, 0.65);
  assert.equal(storeSettings({}, denied), false);
});




test('opening hand, duplicate cost, full hand draws and overflow can be discarded', () => {
  const state = createRun('hand-check', true);
  assert.equal(state.player.hand.length, 5);
  assert.ok(state.player.hand.includes('shot') && state.player.hand.includes('fire'));
  const before = structuredClone(state);
  assert.equal(simulateTurn(state, ['shot', 'fire', 'pair', 'fire'], 'enemy-0').ok, false);
  assert.deepEqual(state, before);
  const first = cast(state, 'shot fire').state;
  assert.equal(first.player.hand.length, 6);
  assert.deepEqual(first.player.hand.slice(0, 3), before.player.hand.filter(id => id !== 'shot' && id !== 'fire'));
  assert.equal(first.rng, before.rng);
  state.player.hand = Array(10).fill('ice');
  for (const size of [8, 9, 10]) {
    state.player.hand = Array(size).fill('ice');
    const overflow = cast(state, 'guard').state;
    assert.equal(overflow.player.hand.length, size + 3);
    assert.equal(simulateTurn(overflow, 'guard').ok, false);
    assert.throws(() => discardOverflow(overflow, [0, 0]));
    const count = size + 3 - 10;
    const indices = Array.from({ length: count }, (_, index) => index === 0 ? 0 : size + index);
    if (size === 10) assert.throws(() => discardOverflow(overflow, [0, 1]));
    const cleared = discardOverflow(overflow, indices);
    assert.equal(cleared.player.hand.length, 10);
    assert.equal(cleared.turn, overflow.turn);
    assert.equal(cleared.handRng, overflow.handRng);
    const storage = new MemoryStorage();
    assert.equal(saveRun(overflow, storage).ok, true);
    assert.deepEqual(loadRun(storage).state, overflow);
    if (size === 8) assert.equal(discardOverflow(overflow, [0, 10]).player.hand.length, 9);
  }
});

test('previous tower save gains a reproducible hand without losing progress', () => {
  const storage = new MemoryStorage();
  const state = createRun('legacy-hand', true, ['blast']);
  state.turn = 3;
  state.rulesVersion = 2;
  state.player.maxMana = 10;
  state.player.mana = 7;
  delete state.handRng;
  delete state.player.hand;
  storage.setItem(SAVE_KEY, JSON.stringify(state));
  const loaded = loadRun(storage).state;
  assert.equal(loaded.rulesVersion, 3);
  assert.equal(loaded.player.maxMana, 12);
  assert.equal(loaded.player.mana, 9);
  assert.deepEqual(loaded.collection, ['blast']);
  assert.equal(loaded.turn, 3);
  assert.equal(loaded.player.hand.length, 5);
  assert.deepEqual(loadRun(storage).state, loaded);
  assert.equal(saveRun(loaded, storage).ok, true);
});


test('clearing an opening fight heals up to eight before the boss', () => {
  for (const [hp, expected] of [[20, 28], [33, 36]]) {
    const state = createRun('room-heal');
    state.player.hp = hp;
    const result = cast(state, 'shot fire pair');
    assert.equal(result.state.room, 1);
    assert.equal(result.state.player.hp, expected);
    assert.equal(result.summary.roomRecovery, expected - hp);
    assert.equal(result.summary.hp, expected);
  }
});

test('opening fight holds the last combat frame for 900 ms', () => {
  for (const reducedMotion of [false, true]) {
    const stage = { settings: { reducedMotion }, buildSnapshots() {} };
    const events = Array.from({ length: 12 }, () => ({ type: 'attack' }));
    const regularDuration = Battlefield.prototype.animate.call(stage, events);
    const duration = Battlefield.prototype.animate.call(stage, [...events, { type: 'room-clear' }]);
    assert.equal(duration - regularDuration, 900);
    assert.equal(stage.eventEnds.at(-1) - stage.eventEnds.at(-2), 900);
  }
});

test('blast damage and deaths land with the spread and unrelated burns keep their own event', () => {
  const state = battle(['striker', 'striker', 'striker', 'striker']);
  state.enemies[0].hp = 3;
  state.enemies[2].slot = 3;
  state.enemies[3].slot = 4;
  state.enemies[3].burn = 2;
  const stage = Object.assign(Object.create(Battlefield.prototype), { state, settings: { reducedMotion: false } });
  const result = cast(state, 'shot fire blast', 'enemy-1');
  stage.animate(result.events);
  const blastIndex = stage.events.findIndex(event => event.type === 'blast');
  const blastContacts = stage.contacts.filter(contact => contact.index === blastIndex);
  const [center, neighbor] = blastContacts.filter(contact => contact.event.type === 'damage');
  assert.equal(center.event.target, 'enemy-1');
  assert.equal(center.at, stage.eventStart(blastIndex));
  assert.equal(neighbor.event.target, 'enemy-0');
  assert.ok(neighbor.at > center.at && neighbor.at < stage.eventEnds[blastIndex]);
  assert.equal(stage.deathStartMs['enemy-0'], neighbor.at);
  assert.ok(!blastContacts.some(contact => contact.event.type === 'status'));
  assert.ok(stage.events.some(event => event.type === 'damage' && event.target === 'enemy-3'));
  stage.settings.reducedMotion = true;
  stage.animate(result.events);
  const reduced = stage.contacts.filter(contact => contact.index === blastIndex);
  assert.ok(reduced.every(contact => contact.at === stage.eventStart(blastIndex)));
});

test('an ember scroll can clear an opening room and report the victory recovery', () => {
  const state = createRun('ember-clear');
  state.enemies[0].hp = 6;
  state.player.hp = 23;
  state.player.items = ['ember_scroll'];
  const result = useBattleItem(state, 0);
  assert.equal(result.state.room, 1);
  assert.equal(result.summary.roomRecovery, 8);
  assert.equal(result.state.player.hp, 31);
  assert.equal(result.events[0].killed, true);
});

test('large shots work with all elements and pair doubles the volley and cost', () => {
  for (const [element, damage] of [['fire', 15], ['ice', 9], ['lightning', 12]]) {
    const single = cast(battle(), `shot ${element} large`);
    assert.equal(single.summary.cost, 5);
    assert.equal(single.summary.damage, damage);
    const pair = cast(battle(['striker', 'striker']), `shot ${element} large pair`, 'enemy-0', 'enemy-1');
    assert.equal(pair.summary.cost, 10);
    assert.deepEqual(pair.events.filter(event => event.type === 'projectile').map(event => event.target), ['enemy-0', 'enemy-1']);
    assert.equal(pair.summary.damage, damage * 2);
    if (element === 'ice') assert.equal(pair.summary.enemyStatus['enemy-1'].chill, 4);
  }
});

test('large shields add three protection per layer and upgraded shields survive a save round trip', () => {
  const single = cast(battle(), 'shield large');
  assert.equal(single.summary.cost, 5);
  assert.deepEqual(single.state.player.shield.layers, [6]);
  const state = createRun('shield-large', false, ['large']);
  state.player.words.push('large');
  state.player.hand = ['shield', 'large', 'pair'];
  state.player.cardUpgrades = { shield: 10, large: 10, pair: 10 };
  state.player.blessings = ['blessing_vitality'];
  const pair = cast(state, 'shield large pair');
  assert.equal(pair.summary.cost, 10);
  // 9 base + 20 (shield+10) + 20 (large+10 ×2) + 10 (pair+10) + 8 (pairSelf) + 10 (largeSelf) + 2 (vitality) = 79
  assert.deepEqual(pair.state.player.shield.layers, [79, 79]);
  const storage = new MemoryStorage();
  assert.equal(saveRun(pair.state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state.player.shield.layers, [79, 79]);
});

test('split elements fire in order and fusion stays one projectile', () => {
  const state = battle(['warden', 'armored']);
  const split = cast(state, 'shot fire ice pair', 'enemy-0', 'enemy-1');
  assert.equal(split.summary.cost, 6);
  assert.deepEqual(split.events.filter(event => event.type === 'projectile').map(event => [event.element, event.target, event.blocked]), [
    ['fire', 'enemy-0', true], ['ice', 'enemy-1', false],
  ]);
  const beam = cast(state, 'beam lightning fire pair', 'enemy-1', 'enemy-0');
  const prefixBeam = cast(state, 'beam pair lightning fire', 'enemy-1', 'enemy-0');
  assert.deepEqual(prefixBeam.events, beam.events);
  assert.deepEqual(prefixBeam.summary, beam.summary);
  assert.equal(parseSpell(['shot', 'pair', 'lightning', 'fire']).ok, false);
  for (const form of ['wave', 'shield']) {
    assert.deepEqual(parseSpell([form, 'pair', 'lightning', 'fire']).spell,
      parseSpell([form, 'lightning', 'fire', 'pair']).spell);
  }
  const plainShield = parseSpell(['shield', 'pair']);
  assert.equal(plainShield.cost, 6);
  assert.equal(plainShield.spell.layers, 2);
  assert.equal(plainShield.spell.effect, null);
  assert.equal(beam.summary.cost, 8);
  assert.equal(beam.summary.damage, 17);
  const fused = cast(state, 'beam fire pair ice');
  assert.equal(fused.summary.cost, 7);
  assert.equal(fused.events.filter(event => event.type === 'projectile').length, 1);
  assert.equal(cast(state, 'wave fire ice pair').summary.cost, 10);
});

test('fused shield triggers both elements and split shield waits for the next layer', () => {
  const state = createRun('shield-layers');
  state.player.hand = ['shield', 'fire', 'pair', 'ice'];
  const fused = cast(state, 'shield fire pair ice').state;
  assert.deepEqual(fused.player.shield.layers, [3]);
  assert.equal(fused.enemies[0].burn, 3);
  assert.equal(fused.enemies[0].chill, 4);
  const split = cast(state, 'shield fire ice pair').state;
  assert.deepEqual(split.player.shield.layers, [3, 6]);
  assert.equal(split.enemies[0].burn, 3);
  assert.equal(split.enemies[0].chill, 0);
  const storage = new MemoryStorage();
  assert.equal(saveRun(split, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, split);
});

test('3x3 floor subrooms, RPG level-ups (+HP every level, +MP every 5th), shop items, and boss revisit penalty', () => {
  assert.equal(getFloorInfo(0, 9).code, '1-1');
  assert.equal(getFloorInfo(2, 9).code, '1-3');
  assert.equal(getFloorInfo(2, 9).isBoss, true);
  assert.equal(getFloorInfo(8, 9).code, '3-3');
  assert.deepEqual(RELIC_DRAFT_CATALOG.map(r => r.dropFloor), [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

  let state = createRun('rpg-test', true);
  // First clear of Room 0 (1-1: striker -> 10 EXP, 8 Gold)
  const r1 = cast(state, 'shot fire pair');
  assert.equal(r1.summary.expGain, 10);
  assert.equal(r1.summary.goldGain, 8);
  assert.ok(r1.state.clearedRooms.includes(0));

  // Revisit Room 0 -> drops reduced to 20% (2 EXP, 1 Gold)
  const revisited = revisitRoom(r1.state, 0);
  const r1Repeat = cast(revisited, 'shot fire pair');
  assert.equal(r1Repeat.summary.revisit, true);
  assert.equal(r1Repeat.summary.expGain, 2);
  assert.equal(r1Repeat.summary.goldGain, 1);

  // Early levels cost 25 EXP, with +3 HP and +2 MP at Lv.5.
  const lvState = battle(['striker']);
  lvState.player.level = 4;
  lvState.player.exp = 20; // Needs 25 EXP to reach Lv.5 (20 + 10 = 30 -> Lv.5 with 5 EXP carry-over)
  const lvUp = cast(lvState, 'shot fire pair');
  assert.equal(lvUp.state.player.level, 5);
  assert.equal(lvUp.state.player.exp, 5);
  assert.equal(lvUp.state.player.maxHp, 39);
  assert.equal(lvUp.state.player.maxMana, 14);

  const transition = battle(['striker']);
  transition.player.level = 24;
  transition.player.exp = 24;
  const at25 = cast(transition, 'shot fire pair').state.player;
  assert.deepEqual([at25.level, at25.exp, nextExpForLevel(at25.level)], [25, 9, 55]);

  const late = battle(['striker']);
  late.player.level = 29;
  late.player.exp = 50;
  const at30 = cast(late, 'shot fire pair').state.player;
  assert.deepEqual([at30.level, at30.exp, at30.maxHp, at30.maxMana], [30, 5, 41, 16]);

  // Revisited Boss (Room 2 / 1-3) drops Gold & EXP instead of Word Cards
  const bossState = battle(['elite']);
  bossState.room = 2;
  bossState.clearedRooms = [0, 1, 2];
  bossState.enemies[0].hp = 1;
  const bossRevisit = cast(bossState, 'shot fire pair');
  assert.notEqual(bossRevisit.state.phase, 'reward');
  assert.equal(bossRevisit.summary.goldGain, 5);
  assert.equal(bossRevisit.summary.expGain, 6);

  // Sanctuary cannot be entered before clearing Floors 1-4 (room 11)
  assert.equal(isSanctuaryUnlocked(lvUp.state), false);
  assert.throws(() => enterSanctuary(lvUp.state), /ต้องผ่านด่าน/);

  // Once Floors 1-4 (including Boss 4-3 at room 11) are cleared, Sanctuary unlocks
  lvUp.state.clearedRooms = Array.from({ length: 12 }, (_, i) => i);
  assert.equal(isSanctuaryUnlocked(lvUp.state), true);
  lvUp.state.player.gold = 60;
  let sanct = enterSanctuary(lvUp.state);
  assert.equal(sanct.phase, 'sanctuary');
  sanct = buyShopItem(sanct, 'mana_vial');
  assert.equal(sanct.player.gold, 42);
  assert.deepEqual(sanct.player.items, ['mana_vial']);
  assert.ok(getAvailableShopItems(sanct).some(i => i.id === 'mana_vial'));

  // One-time item (aegis_shard) deducts gold, adds to inventory, and is removed from store
  sanct = buyShopItem(sanct, 'aegis_shard');
  assert.equal(sanct.player.gold, 20);
  assert.deepEqual(sanct.player.items, ['mana_vial', 'aegis_shard']);
  assert.ok(!getAvailableShopItems(sanct).some(i => i.id === 'aegis_shard'));
  assert.throws(() => buyShopItem(sanct, 'aegis_shard'), /จำกัดการซื้อ/);

  // Test Global Inventory Belt <-> Stash management
  sanct = moveBeltToStash(sanct, 0);
  assert.deepEqual(sanct.player.items, ['aegis_shard']);
  assert.deepEqual(sanct.player.stash, ['mana_vial']);
  sanct = moveStashToBelt(sanct, 0);
  assert.deepEqual(sanct.player.items, ['aegis_shard', 'mana_vial']);
  assert.deepEqual(sanct.player.stash, []);

  const backToFight = revisitRoom(sanct, 0);
  backToFight.player.mana = 4;
  const used = useInventoryItem(backToFight, 'belt', 1);
  assert.equal(used.ok, true);
  assert.equal(used.state.player.mana, 8);
  assert.deepEqual(used.state.player.items, ['aegis_shard']);

  // Boss heavy attack & regular attack event metadata for camera/screen-shake
  const heavyBossState = battle(['boss']);
  heavyBossState.room = 8;
  heavyBossState.turn = 2; // Boss heavy attack turn (8 damage)
  const heavyBossTurn = cast(heavyBossState, 'guard');
  const bossAtkEvent = heavyBossTurn.events.find(e => e.type === 'attack');
  assert.equal(bossAtkEvent.rawAttack, 8);
  assert.equal(bossAtkEvent.isBoss, true);
  assert.equal(bossAtkEvent.heavy, true);

  // Sanctuary Card Forge: spend gold to upgrade base stats or unlock a secondary effect.
  const rawForgeRun = createRun('forge', true);
  rawForgeRun.clearedRooms = Array.from({ length: 12 }, (_, i) => i);
  let forgeState = enterSanctuary(rawForgeRun);
  forgeState.player.gold = 40;
  forgeState.player.exp = 0;
  const statRes = upgradeWordCard(forgeState, 'fire', 'stat');
  assert.equal(statRes.newLevel, 1);
  assert.equal(statRes.goldCost, 10);
  assert.equal(statRes.state.player.gold, 30);
  assert.equal(statRes.state.player.exp, 0);
  assert.equal(statRes.state.player.level, 1);

  const secRes = upgradeWordCard(statRes.state, 'shot', 'secondary');
  assert.equal(secRes.secondaryUnlocked, true);
  assert.equal(secRes.goldCost, 15);
  assert.equal(secRes.state.player.gold, 15);
  assert.equal(secRes.state.player.exp, 0);
  assert.equal(secRes.state.player.level, 1);
  assert.equal(validateRun(secRes.state), secRes.state);

  const fightWithUpgrades = revisitRoom(secRes.state, 0);
  fightWithUpgrades.enemies[0].armor = 3;
  fightWithUpgrades.player.hand = ['shot', 'fire'];
  const atkTurn = cast(fightWithUpgrades, 'shot fire');
  // Base shot fire is 10 damage; with fire +1 it deals 11 raw, vs armor 3 with shot's Tier 1 secondary pierce +1 -> 11 - 2 = 9 damage
  assert.equal(atkTurn.summary.damage, 9);
  assert.equal(atkTurn.summary.secondaryShield, 0);

  // Test +7 / +9 / +10 milestone secondary unlock and % upgrade success/failure without breaking card
  const rawMilestoneRun = createRun('forge-milestone', true);
  rawMilestoneRun.clearedRooms = Array.from({ length: 12 }, (_, i) => i);
  let milestoneState = enterSanctuary(rawMilestoneRun);
  milestoneState.player.gold = 500;
  milestoneState.player.exp = 300;
  milestoneState.player.cardUpgrades.shot = 6;
  // A failed +7 roll consumes the fee and leaves the card at +6.
  const failedAttempt = upgradeWordCard(milestoneState, 'shot', 'stat', { roll: 85 });
  assert.equal(failedAttempt.failed, true);
  assert.equal(failedAttempt.chancePercent, 40);
  assert.equal(failedAttempt.goldCost, 49);
  assert.equal(failedAttempt.newLevel, 6);
  assert.equal(failedAttempt.secondaryUnlocked, false);

  // Successful roll at +6 -> +7 unlocks Tier 1 secondary effect automatically (shot: +1 pierce)
  const plus7 = upgradeWordCard(failedAttempt.state, 'shot', 'stat', { roll: 25 });
  assert.equal(plus7.upgraded, true);
  assert.equal(plus7.newLevel, 7);
  assert.equal(plus7.milestoneUnlocked, true);
  assert.equal(plus7.secondaryUnlocked, true);
  assert.equal(plus7.secondaryEffect.tier, 1);
  assert.equal(plus7.secondaryEffect.pierceBonus, 1);
  assert.equal(plus7.secondaryEffect.damagePctBonus, 0);

  // Reaching +9 and +10 scales shot secondary to Tier 2 (+2 pierce) and Tier 3 (+3 pierce, +15% damage)
  plus7.state.player.cardUpgrades.shot = 8;
  const plus9 = upgradeWordCard(plus7.state, 'shot', 'stat', { roll: 10 });
  assert.equal(plus9.newLevel, 9);
  assert.equal(plus9.milestoneUnlocked, true);
  assert.equal(plus9.secondaryEffect.tier, 2);
  assert.equal(plus9.secondaryEffect.pierceBonus, 2);
  assert.equal(plus9.secondaryEffect.damagePctBonus, 0);

  const plus10 = upgradeWordCard(plus9.state, 'shot', 'stat', { roll: 5 });
  assert.equal(plus10.newLevel, 10);
  assert.equal(plus10.milestoneUnlocked, true);
  assert.equal(plus10.secondaryEffect.tier, 3);
  assert.equal(plus10.secondaryEffect.pierceBonus, 3);
  assert.equal(plus10.secondaryEffect.damagePctBonus, 15);
  assert.equal(validateRun(plus10.state), plus10.state);
});

test('forging past +2 rolls from the run seed and charges for the attempt', () => {
  for (const [seed, expectedLevel] of [['forge-repro', 3], ['forge-test-0', 2]]) {
    const run = createRun(seed);
    run.clearedRooms = Array.from({ length: 12 }, (_, i) => i);
    let state = enterSanctuary(run);
    state.player.gold = 100;
    state.player.level = 6;
    state.player.exp = 1;
    for (const expected of [1, 2]) {
      const attempt = upgradeWordCard(state, 'fire');
      assert.equal(attempt.newLevel, expected);
      assert.equal(attempt.state.rng, state.rng);
      state = attempt.state;
    }
    const attempt = upgradeWordCard(state, 'fire');
    assert.equal(attempt.chancePercent, 90);
    assert.equal(attempt.newLevel, expectedLevel);
    assert.equal(attempt.failed, expectedLevel === 2);
    assert.notEqual(attempt.state.rng, state.rng);
    assert.equal(attempt.state.player.gold, 58);
    assert.equal(attempt.state.player.level, 6);
    assert.equal(attempt.state.player.exp, 1);
    assert.equal(validateRun(attempt.state).player.cardUpgrades.fire, expectedLevel);
  }
});

test('card upgrade rarity scaling, smithing materials pricing, and gold cost enforcement', () => {
  // 1. Rarity cost multipliers: Common 1.0, Rare 1.3, Special 1.6, Epic 2.0, Legendary 2.5
  assert.equal(getCardUpgradeCost(0, 'fire'), 10); // Common: 10 * 1.0 = 10
  assert.equal(getCardUpgradeCost(6, 'fire'), 49); // Common: 49 * 1.0 = 49
  assert.equal(getCardUpgradeCost(9, 'fire'), 84); // Common: 84 * 1.0 = 84

  assert.equal(getCardUpgradeCost(0, 'blast'), 13); // Rare: round(10 * 1.3) = 13
  assert.equal(getCardUpgradeCost(6, 'blast'), 64); // Rare: round(49 * 1.3) = 64
  assert.equal(getCardUpgradeCost(9, 'blast'), 109); // Rare: round(84 * 1.3) = 109

  assert.equal(getCardUpgradeCost(0, 'akki'), 16); // Special: round(10 * 1.6) = 16
  assert.equal(getCardUpgradeCost(6, 'akki'), 78); // Special: round(49 * 1.6) = 78
  assert.equal(getCardUpgradeCost(9, 'akki'), 134); // Special: round(84 * 1.6) = 134

  assert.equal(getCardUpgradeCost(0, 'meteor'), 20); // Epic: round(10 * 2.0) = 20
  assert.equal(getCardUpgradeCost(6, 'meteor'), 98); // Epic: round(49 * 2.0) = 98
  assert.equal(getCardUpgradeCost(9, 'meteor'), 168); // Epic: round(84 * 2.0) = 168

  assert.equal(getCardUpgradeCost(0, 'ascension'), 25); // Legendary: round(10 * 2.5) = 25
  assert.equal(getCardUpgradeCost(6, 'ascension'), 123); // Legendary: round(49 * 2.5) = 123
  assert.equal(getCardUpgradeCost(9, 'ascension'), 210); // Legendary: round(84 * 2.5) = 210

  // Direct rarity string lookup
  assert.equal(getCardUpgradeCost(9, 'legendary'), 210);

  // 2. Rarity success rate penalty starting at +5
  // Below +5: all rarities get full base rate
  assert.equal(getCardUpgradeSuccessRate(0, false, 0, 'ascension'), 100);
  assert.equal(getCardUpgradeSuccessRate(2, false, 0, 'ascension'), 90);
  assert.equal(getCardUpgradeSuccessRate(4, false, 0, 'ascension'), 60);

  // At +5 (base 50%): Common 50%, Rare 48%, Special 46%, Epic 44%, Legendary 42%
  assert.equal(getCardUpgradeSuccessRate(5, false, 0, 'fire'), 50);
  assert.equal(getCardUpgradeSuccessRate(5, false, 0, 'blast'), 48);
  assert.equal(getCardUpgradeSuccessRate(5, false, 0, 'akki'), 46);
  assert.equal(getCardUpgradeSuccessRate(5, false, 0, 'meteor'), 44);
  assert.equal(getCardUpgradeSuccessRate(5, false, 0, 'ascension'), 42);

  // At +9 (base 15%): Common 15%, Rare 13%, Special 11%, Epic 9%, Legendary 7%
  assert.equal(getCardUpgradeSuccessRate(9, false, 0, 'fire'), 15);
  assert.equal(getCardUpgradeSuccessRate(9, false, 0, 'blast'), 13);
  assert.equal(getCardUpgradeSuccessRate(9, false, 0, 'akki'), 11);
  assert.equal(getCardUpgradeSuccessRate(9, false, 0, 'meteor'), 9);
  assert.equal(getCardUpgradeSuccessRate(9, false, 0, 'ascension'), 7);

  // Material bonuses
  assert.equal(getCardUpgradeSuccessRate(9, true, 15, 'ascension'), 22); // 7 + 15 = 22%
  assert.equal(getCardUpgradeSuccessRate(9, true, 100, 'ascension'), 100); // Godly essence guarantees 100%

  // 3. Shop items pricing and badges
  assert.equal(SHOP_ITEMS.smithing_stone.cost, 70);
  assert.equal(SHOP_ITEMS.smithing_crystal.cost, 150);
  assert.equal(SHOP_ITEMS.superior_smithing_stone.cost, 280);
  assert.equal(SHOP_ITEMS.hyper_smithing_cluster.cost, 450);
  assert.equal(SHOP_ITEMS.abyssal_smithing_core.cost, 700);
  assert.equal(SHOP_ITEMS.godly_smithing_essence.cost, 1000);

  // 4. In-game upgrade: Smithing materials DO NOT waive gold fee
  const rawRun = createRun('forge-material-test', true);
  rawRun.clearedRooms = Array.from({ length: 12 }, (_, i) => i);
  let state = enterSanctuary(rawRun);
  state.player.gold = 5; // not enough for level 0 upgrade (cost 10)
  state.player.items = ['smithing_stone'];

  // Should throw when gold is insufficient even if stone is present
  assert.throws(
    () => upgradeWordCard(state, 'fire'),
    /ทองไม่พอสำหรับการตีบวก · ต้องใช้ 10 ทอง/
  );

  // With sufficient gold: both gold and stone are consumed
  state.player.gold = 100;
  const upgradeWithStone = upgradeWordCard(state, 'fire', 'stat', { roll: 1 });
  assert.equal(upgradeWithStone.upgraded, true);
  assert.equal(upgradeWithStone.usedStone, true);
  assert.equal(upgradeWithStone.materialId, 'smithing_stone');
  assert.equal(upgradeWithStone.goldCost, 10);
  assert.equal(upgradeWithStone.state.player.gold, 90); // 100 - 10 = 90
  assert.equal(upgradeWithStone.state.player.items.includes('smithing_stone'), false); // stone consumed

  // Upgrading Legendary card (e.g. ascension) at +6 with Godly Essence
  const legendaryRun = createRun('legendary-forge', true);
  legendaryRun.clearedRooms = Array.from({ length: 12 }, (_, i) => i);
  let legState = enterSanctuary(legendaryRun);
  legState.collection = ['ascension'];
  legState.player.cardUpgrades.ascension = 6;
  legState.player.stash = ['godly_smithing_essence'];
  legState.player.gold = 200;

  const legCost = getCardUpgradeCost(6, 'ascension'); // 123 gold
  assert.equal(legCost, 123);

  const legAttempt = upgradeWordCard(legState, 'ascension', 'stat');
  assert.equal(legAttempt.upgraded, true);
  assert.equal(legAttempt.chancePercent, 100);
  assert.equal(legAttempt.usedStone, true);
  assert.equal(legAttempt.materialId, 'godly_smithing_essence');
  assert.equal(legAttempt.goldCost, 123);
  assert.equal(legAttempt.state.player.gold, 200 - 123);
  assert.equal(legAttempt.state.player.cardUpgrades.ascension, 7);
  assert.equal(legAttempt.state.player.stash.length, 0); // essence consumed
});

test('Floors 5-8 (2 sub-rooms + 1 boss each), Floor 9 Sanctuary, boss random card drops, and defeat fallback to Floor 4', () => {
  const storage = new MemoryStorage();
  const baseRun = createRun('floors-5-9', true);
  assert.equal(baseRun.rooms.length, TOTAL_TOWER_ROOMS);

  // Verify room index -> floor/sub-room mapping
  assert.equal(getFloorInfo(0).code, '1-1');
  assert.equal(getFloorInfo(8).code, '3-3');
  assert.equal(getFloorInfo(9).code, '4-1');
  assert.equal(getFloorInfo(10).code, '4-2');
  assert.equal(getFloorInfo(11).code, '4-3');
  assert.equal(getFloorInfo(11).isBoss, true);
  assert.equal(getFloorInfo(12).code, '6-1');
  assert.equal(getFloorInfo(14).code, '6-3');
  assert.equal(getFloorInfo(17).code, '7-3');
  assert.equal(getFloorInfo(20).code, '8-3');
  assert.equal(getFloorInfo(23).code, '9-3');
  assert.equal(getFloorInfo(23).isBoss, true);
  assert.equal(getFloorInfo(24).code, '10★');
  assert.equal(getFloorInfo(24).floor, 10);
  assert.equal(getFloorInfo(24).isBoss, true);

  // Simulate post-Floor-4 state entering Sanctuary 5 with beam & wave unlocked
  let state = createRun('floors-5-9-climb', true, ['beam', 'wave']);
  state.learned = ['beam', 'wave'];
  state.player.words = [...START_WORDS, 'beam', 'wave'];
  state.clearedRooms = Array.from({ length: 12 }, (_, i) => i);
  state.rewardedBossRooms = [2, 5, 8, 11];
  state.sanctuaryUnlocked = true;
  state.highestRoom = 12;
  state.room = 12;
  assert.equal(isSanctuaryPre10Unlocked(state), false);
  assert.throws(() => enterSanctuary(state, { floor: 'pre10' }), /ต้องผ่านด่าน/);

  // Climb Floor 6 sequentially: 6-1 (room 12) -> 6-2 (room 13) -> 6-3 Boss (room 14)
  state = revisitRoom(state, 12);
  for (const e of state.enemies) { e.hp = 1; e.ward = 0; }
  state.player.hand = ['wave', 'fire', 'shot', 'ice', 'shield'];
  state = simulateTurn(state, ['wave', 'fire'], 'enemy-0').state;
  assert.equal(state.room, 13); // 6-2
  for (const e of state.enemies) { e.hp = 1; e.ward = 0; }
  state.player.hand = ['wave', 'fire', 'shot', 'ice', 'shield'];
  state = simulateTurn(state, ['wave', 'fire'], 'enemy-0').state;
  assert.equal(state.room, 14); // 6-3 Boss
  assert.equal(state.enemies[0].kind, 'mirror_mage');
  assert.equal(ENEMIES[state.enemies[0].kind].isBoss, true);
  state.enemies[0].hp = 1;
  state.player.hand = ['beam', 'fire', 'shot', 'ice', 'shield'];
  const beatBoss5 = simulateTurn(state, ['beam', 'fire'], 'enemy-0');
  assert.equal(beatBoss5.ok, true);
  assert.equal(beatBoss5.state.phase, 'reward');
  assert.equal(beatBoss5.state.rewards.length, 3);
  state = chooseReward(beatBoss5.state, beatBoss5.state.rewards[0]);
  assert.equal(state.phase, 'loadout');
  assert.ok(state.rewardedBossRooms.includes(14));
  assert.equal(saveRun(state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, state);

  state = equipWords(state, state.player.words);
  assert.equal(state.room, 15); // 7-1
  assert.equal(state.phase, 'battle');

  // Losing on Floor 7 (room 15 >= 12) falls back to Sanctuary 5, resets progress to 6-1, keeps Gold/Cards
  state.player.gold = 75;
  state.player.hp = 1;
  state.enemies.forEach(e => { e.chill = 0; });
  const fellTurn = simulateTurn(state, 'guard');
  assert.equal(fellTurn.ok, true);
  assert.equal(fellTurn.summary.fellToFloor, 5);
  assert.equal(fellTurn.state.phase, 'sanctuary');
  assert.equal(fellTurn.state.sanctuaryFloor, 5);
  assert.equal(fellTurn.state.room, 12);
  assert.equal(fellTurn.state.highestRoom, 12);
  assert.ok(fellTurn.state.player.hp > 0);
  assert.equal(fellTurn.state.player.gold, 75);
  assert.deepEqual(fellTurn.state.clearedRooms, Array.from({ length: 12 }, (_, i) => i));
  assert.throws(() => revisitRoom(fellTurn.state, 13), /ต้องผ่านห้องก่อนหน้า/);
  assert.equal(saveRun(fellTurn.state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, fellTurn.state);

  // Re-climbing Boss 6 after fallback does not double-drop a card, awards Boss gold/EXP and advances to 7-1
  let reclimb = revisitRoom(fellTurn.state, 12);
  for (const e of reclimb.enemies) { e.hp = 1; e.ward = 0; }
  reclimb.player.hand = ['wave', 'fire', 'shot', 'ice', 'shield'];
  reclimb = simulateTurn(reclimb, ['wave', 'fire'], 'enemy-0').state;
  for (const e of reclimb.enemies) { e.hp = 1; e.ward = 0; }
  reclimb.player.hand = ['wave', 'fire', 'shot', 'ice', 'shield'];
  reclimb = simulateTurn(reclimb, ['wave', 'fire'], 'enemy-0').state;
  assert.equal(reclimb.room, 14);
  reclimb.enemies[0].hp = 1;
  reclimb.player.hand = ['beam', 'fire', 'shot', 'ice', 'shield'];
  const reBeatBoss5 = simulateTurn(reclimb, ['beam', 'fire'], 'enemy-0');
  assert.equal(reBeatBoss5.ok, true);
  assert.equal(reBeatBoss5.state.phase, 'battle');
  assert.equal(reBeatBoss5.state.room, 15);
  assert.ok(reBeatBoss5.summary.goldGain > 0);

  // Boss 7, Boss 8 all drop random cards, and Boss 9 unlocks Sanctuary pre10
  let progressState = reBeatBoss5.state;
  for (const bossRoom of [17, 20]) {
    let s = structuredClone(progressState);
    s.highestRoom = bossRoom;
    s = revisitRoom(s, bossRoom);
    s.enemies[0].hp = 1;
    s.player.hand = ['beam', 'fire', 'shot', 'ice', 'shield'];
    const winBoss = simulateTurn(s, ['beam', 'fire'], 'enemy-0');
    assert.equal(winBoss.state.phase, 'reward');
    assert.equal(winBoss.state.rewards.length, 3);
    const chosen = chooseReward(winBoss.state, winBoss.state.rewards[0]);
    assert.equal(chosen.phase, 'loadout');
    assert.equal(saveRun(chosen, storage).ok, true);
    progressState = equipWords(chosen, chosen.player.words);
  }

  let boss8State = structuredClone(progressState);
  boss8State.highestRoom = 23;
  boss8State = revisitRoom(boss8State, 23);
  assert.equal(boss8State.enemies[0].kind, 'arch_codex');
  boss8State.enemies[0].hp = 1;
  boss8State.player.hand = ['beam', 'fire', 'shot', 'ice', 'shield'];
  const winBoss8 = simulateTurn(boss8State, ['beam', 'fire'], 'enemy-0');
  assert.equal(winBoss8.state.phase, 'reward');
  assert.equal(winBoss8.state.rewards.length, 3);
  const floor9Sanct = chooseReward(winBoss8.state, winBoss8.state.rewards[0]);
  assert.equal(floor9Sanct.phase, 'sanctuary');
  assert.equal(floor9Sanct.sanctuaryFloor, 'pre10');
  assert.equal(floor9Sanct.highestRoom, FLOOR10_BOSS_ROOM);
  assert.equal(isSanctuaryPre10Unlocked(floor9Sanct), true);
  assert.equal(saveRun(floor9Sanct, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, floor9Sanct);
});

test('Floor 10 special boss (ember_overlord), first artifact drop & passive bonus, post-10 unnumbered Sanctuary, and Floor 9 fallback', () => {
  const storage = new MemoryStorage();
  let state = createRun('floor-10-boss', true, ['beam', 'wave', 'burn', 'blast']);
  state.learned = ['beam', 'wave'];
  state.player.words = [...START_WORDS, 'beam', 'wave'];
  state.clearedRooms = Array.from({ length: 24 }, (_, i) => i);
  state.rewardedBossRooms = [2, 5, 8, 11, 14, 17, 20, 23];
  state.sanctuaryUnlocked = true;
  state.sanctuary9Unlocked = true;
  state.highestRoom = FLOOR10_BOSS_ROOM;
  state.room = FLOOR10_BOSS_ROOM;

  assert.equal(isSanctuaryPost10Unlocked(state), false);
  assert.throws(() => enterSanctuary(state, { floor: 'post10' }), /ปราบบอสพิเศษชั้นที่ 10/);

  // Enter Floor 10 boss fight
  let boss10 = revisitRoom(state, FLOOR10_BOSS_ROOM);
  assert.equal(boss10.room, 24);
  assert.equal(isBossRoom(boss10), true);
  assert.equal(boss10.enemies[0].kind, 'ember_overlord');
  assert.equal(boss10.enemies[0].hp, 135);
  assert.equal(boss10.enemies[0].armor, 3);
  assert.equal(boss10.enemies[0].ward, 1);

  // Check 4-turn cyclic behavior: T1(8, w1/a3) -> T2(10, w0/a4) -> T3(charge, w1/a2) -> T4(16, w0/a0 weak point!)
  assert.equal(intent(boss10.enemies[0], 1).amount, 8);
  boss10 = simulateTurn(boss10, 'guard').state;
  assert.equal(boss10.turn, 2);
  assert.equal(boss10.enemies[0].ward, 0);
  assert.equal(boss10.enemies[0].armor, 4);
  assert.equal(intent(boss10.enemies[0], 2).amount, 10);

  boss10 = simulateTurn(boss10, 'guard').state;
  assert.equal(boss10.turn, 3);
  assert.equal(boss10.enemies[0].ward, 1);
  assert.equal(boss10.enemies[0].armor, 2);
  assert.equal(intent(boss10.enemies[0], 3).type, 'charge');
  boss10 = discardOverflow(boss10, [0]);

  boss10 = simulateTurn(boss10, 'guard').state;
  assert.equal(boss10.turn, 4);
  assert.equal(boss10.enemies[0].ward, 0);
  assert.equal(boss10.enemies[0].armor, 0);
  assert.equal(intent(boss10.enemies[0], 4).amount, 16);
  boss10 = discardOverflow(boss10, [0, 1, 2]);

  // Losing to Floor 10 boss falls back to pre-10 Sanctuary without wiping Floors 6-9
  boss10.player.hp = 1;
  const fellTurn = simulateTurn(boss10, 'guard');
  assert.equal(fellTurn.ok, true);
  assert.equal(fellTurn.summary.fellToFloor, 'pre10');
  assert.equal(fellTurn.state.phase, 'sanctuary');
  assert.equal(fellTurn.state.sanctuaryFloor, 'pre10');
  assert.equal(fellTurn.state.clearedRooms.length, 24);
  assert.equal(saveRun(fellTurn.state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, fellTurn.state);

  // Re-challenge and defeat Floor 10 boss -> drops ember_core_10 + Gold/EXP and enters unnumbered post-10 Sanctuary
  let rematch = revisitRoom(fellTurn.state, FLOOR10_BOSS_ROOM);
  rematch.enemies[0].hp = 1;
  rematch.player.hand = ['beam', 'fire', 'shot', 'ice', 'shield'];
  const goldBefore = rematch.player.gold;
  const win10 = simulateTurn(rematch, ['beam', 'fire'], 'enemy-0');
  assert.equal(win10.ok, true);
  assert.equal(win10.summary.relicDropped, 'ember_core_10');
  assert.ok(win10.summary.goldGain >= 150);
  assert.ok(win10.state.player.gold > goldBefore);
  assert.deepEqual(win10.state.player.relics, ['ember_core_10']);
  assert.equal(win10.state.phase, 'sanctuary');
  assert.equal(win10.state.sanctuaryFloor, 'post10');
  assert.equal(isSanctuaryPost10Unlocked(win10.state), true);
  assert.equal(saveRun(win10.state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, win10.state);

  // Post-10 Sanctuary has identical functionality (rest, shop, card forge)
  let postSanct = win10.state;
  postSanct.player.hp = 20;
  postSanct = restAtSanctuary(postSanct);
  assert.ok(postSanct.player.hp > 20);
  assert.equal(postSanct.sanctuaryRested, true);
  postSanct = buyShopItem(postSanct, 'mana_vial');
  assert.ok(postSanct.player.items.includes('mana_vial'));
  const forged = upgradeWordCard(postSanct, 'fire', 'stat');
  assert.equal(forged.newLevel, 1);

  // Verify ember_core_10 relic passive: +2 Fire damage & +1 Burn (on top of +1 fire upgrade = 13 dmg, 4 burn)
  const testFire = battle(['elite']);
  testFire.enemies[0].ward = 0;
  testFire.player.relics = ['ember_core_10'];
  testFire.player.hand = ['shot', 'fire', 'burn'];
  const fireCast = simulateTurn(testFire, ['shot', 'fire', 'burn'], 'enemy-0');
  assert.equal(fireCast.ok, true);
  assert.equal(fireCast.summary.damage, 12); // Base shot fire (10) + ember_core_10 (+2)
  assert.equal(fireCast.state.enemies[0].burn, 4); // Base burn (3) + ember_core_10 (+1)

  // Revisiting Floor 10 boss does not duplicate ember_core_10
  let repeat10 = revisitRoom(win10.state, FLOOR10_BOSS_ROOM);
  repeat10.enemies[0].hp = 1;
  repeat10.player.hand = ['beam', 'fire', 'shot', 'ice', 'shield'];
  const reWin10 = simulateTurn(repeat10, ['beam', 'fire'], 'enemy-0');
  assert.equal(reWin10.ok, true);
  assert.equal(reWin10.summary.relicDropped, undefined);
  assert.deepEqual(reWin10.state.player.relics, ['ember_core_10']);
  assert.equal(reWin10.state.sanctuaryFloor, 'post10');
});

test('Floors 5-8 defeat check resets Floors 5-8 progress & upper sanctuaries to Floor 4 Sanctuary and restarts at 5-1', () => {
  const storage = new MemoryStorage();

  // Test Floors 1-4 death = Game Over (loss) as requested: เริ่มต้นยังไม่รอด ก็ให้ไปเริ่มต้นใหม่ซะ
  for (const earlyRoom of [0, 4, 11]) {
    let earlyState = createRun(`defeat-floor-1-4-${earlyRoom}`, true);
    earlyState.room = earlyState.highestRoom = earlyRoom;
    earlyState = revisitRoom(earlyState, earlyRoom);
    earlyState.player.hp = 1;
    earlyState.player.shield = null;
    earlyState.player.hand = ['fire', 'shot', 'ice', 'pair', 'shield'];
    earlyState.player.mana = earlyState.player.maxMana;
    earlyState.enemies.forEach(e => { e.chill = 0; e.freeze = 0; });
    if (earlyState.enemies.every(e => intent(e, earlyState.turn, earlyState.enemies, earlyState.room).type !== 'attack')) {
      earlyState = simulateTurn(earlyState, 'guard').state;
      earlyState.player.hp = 1;
      earlyState.player.shield = null;
    }
    const gameOver = simulateTurn(earlyState, ['fire', 'shot'], 'enemy-0', 'enemy-0', { allowFizzle: true });
    assert.equal(gameOver.state.phase, 'lost');
  }

  const sampleRooms = [12, 14, 16, 18, 20, 23]; // 6-1, 6-3 Boss, 7-2, 8-1, 8-3 Boss, 9-3 Boss

  for (const roomIndex of sampleRooms) {
    let state = createRun(`defeat-floor-5-8-${roomIndex}`, true, ['beam', 'wave']);
    state.learned = ['beam', 'wave'];
    state.player.words = [...START_WORDS, 'beam', 'wave'];
    state.clearedRooms = Array.from({ length: Math.max(roomIndex, 24) }, (_, i) => i);
    state.sanctuaryUnlocked = true;
    state.sanctuary9Unlocked = true;
    state.sanctuaryPost10Unlocked = true;
    state.highestRoom = 24;
    state = revisitRoom(state, roomIndex);
    assert.equal(state.room, roomIndex);
    assert.equal(state.phase, 'battle');

    state.player.hp = 1;
    state.player.shield = null;
    state.enemies.forEach(e => { e.chill = 0; e.freeze = 0; });
    // Advance turn if all enemies are charging/healing on turn 1
    if (state.enemies.every(e => intent(e, state.turn, state.enemies, state.room).type !== 'attack')) {
      state = simulateTurn(state, 'guard').state;
      state.player.hp = 1;
      state.player.shield = null;
    }

    state.player.hand = ['fire', 'shot', 'ice', 'pair', 'shield'];
    state.player.mana = state.player.maxMana;
    const lostTurn = simulateTurn(state, ['fire', 'shot'], 'enemy-0', 'enemy-0', { allowFizzle: true });
    assert.equal(lostTurn.ok, true);
    assert.equal(lostTurn.summary.fellToFloor, 5);
    assert.ok(lostTurn.events.some(ev => ev.type === 'fall' && ev.targetFloor === 5));

    const reset = lostTurn.state;
    assert.equal(reset.phase, 'sanctuary');
    assert.equal(reset.sanctuaryFloor, 5);
    assert.equal(reset.sanctuaryUnlocked, true);
    assert.equal(reset.sanctuary9Unlocked, false);
    assert.equal(reset.sanctuaryPost10Unlocked, false);
    assert.equal(isSanctuaryPre10Unlocked(reset), false);
    assert.equal(isSanctuaryPost10Unlocked(reset), false);
    assert.equal(reset.room, FLOOR6_START_ROOM);
    assert.equal(reset.highestRoom, FLOOR6_START_ROOM);
    assert.equal(reset.turn, 1);
    assert.deepEqual(reset.clearedRooms, Array.from({ length: 12 }, (_, i) => i));
    assert.ok(reset.player.hp >= 10);

    // Cannot enter pre-10 Sanctuary or jump back to room 13..23 without re-climbing from 6-1
    assert.throws(() => enterSanctuary(reset, { floor: 'pre10' }), /ต้องผ่านด่าน/);
    assert.throws(() => revisitRoom(reset, 13), /ต้องผ่านห้องก่อนหน้า/);
    assert.throws(() => revisitRoom(reset, 23), /ต้องผ่านห้องก่อนหน้า/);

    // Must restart climb from Floor 6 (6-1, room 12)
    const restartFloor5 = revisitRoom(reset, FLOOR6_START_ROOM);
    assert.equal(restartFloor5.phase, 'battle');
    assert.equal(restartFloor5.room, 12);
    assert.equal(getFloorInfo(restartFloor5.room, restartFloor5.rooms.length).code, '6-1');

    const savedReset = saveRun(reset, storage);
    assert.equal(savedReset.ok, true, savedReset.error);
    assert.deepEqual(loadRun(storage).state, reset);
  }
});

test('Floor 5 boss (mirror_mage) 3-phase mirror combat, ward reflect, random word drop, and Floors 6-8 story intro', () => {
  let state = createRun('floor-5-boss-story', true, ['beam', 'wave']);
  state.learned = ['beam', 'wave'];
  state.player.words = [...START_WORDS, 'beam', 'wave'];
  state.clearedRooms = Array.from({ length: 14 }, (_, i) => i);
  state.rewardedBossRooms = [2, 5, 8, 11];
  state.highestRoom = 14;
  state = revisitRoom(state, 14);

  assert.equal(state.room, 14);
  assert.equal(state.enemies[0].kind, 'mirror_mage');
  assert.equal(state.enemies[0].hp, 58);
  assert.equal(state.enemies[0].ward, 1);
  assert.equal(state.enemies[0].armor, 1);
  assert.equal(intent(state.enemies[0], 1).amount, 6);

  // Story banner present during Floor 5 boss encounter
  const battleStory5 = getBattleStory(state);
  assert.ok(battleStory5);
  assert.match(battleStory5.title, /จอมเวทกระจกเงา/);

  // Non-beam shot hits Mirror Ward -> blocked & reflects 2 damage back to player
  const hpBeforeShot = state.player.hp;
  state.player.hand = ['shot', 'fire', 'ice', 'pair', 'shield'];
  const shotBlocked = simulateTurn(state, ['shot', 'fire'], 'enemy-0');
  assert.equal(shotBlocked.ok, true);
  assert.equal(shotBlocked.summary.wards, 1);
  assert.ok(shotBlocked.events.some(ev => ev.type === 'mirror-reflect' && ev.rawAttack === 2));
  // 2 reflect + 6 turn-1 attack = 8 total incoming
  assert.equal(shotBlocked.state.player.hp, hpBeforeShot - 8);

  // Beam bypasses Mirror Ward without triggering mirror-reflect
  state.player.hand = ['beam', 'fire', 'ice', 'pair', 'shield'];
  const beamBypass = simulateTurn(state, ['beam', 'fire'], 'enemy-0');
  assert.equal(beamBypass.ok, true);
  assert.equal(beamBypass.events.some(ev => ev.type === 'mirror-reflect'), false);
  assert.ok(beamBypass.summary.damage > 0);

  // Check 3-phase cycle: Turn 2 (ward 0, armor 3, atk 8) -> Turn 3 (ward 0, armor 0, atk 10)
  let t2 = beamBypass.state;
  assert.equal(t2.turn, 2);
  assert.equal(t2.enemies[0].ward, 0);
  assert.equal(t2.enemies[0].armor, 3);
  assert.equal(intent(t2.enemies[0], 2).amount, 8);
  if (t2.player.hand.length > 6) t2 = discardOverflow(t2, [0]);

  let t3 = simulateTurn(t2, 'guard').state;
  assert.equal(t3.turn, 3);
  assert.equal(t3.enemies[0].ward, 0);
  assert.equal(t3.enemies[0].armor, 0);
  assert.equal(intent(t3.enemies[0], 3).amount, 10);

  // Defeat Floor 5 boss -> random 3-card word drop like Bosses 1-3 + reward story + Floors 6-8 transition story
  t3.enemies[0].hp = 1;
  t3.player.hand = ['shot', 'fire', 'ice', 'pair', 'shield'];
  const beat5 = simulateTurn(t3, ['shot', 'fire'], 'enemy-0');
  assert.equal(beat5.ok, true);
  assert.equal(beat5.state.phase, 'reward');
  assert.equal(beat5.state.rewards.length, 3);
  assert.ok(beat5.state.rewards.every(id => Object.hasOwn(WORDS, id)));

  const rewardStory = getBossRewardStory(beat5.state);
  assert.ok(rewardStory);
  assert.match(rewardStory.title, /(6–8|7–9)/);

  const afterPick = chooseReward(beat5.state, beat5.state.rewards[0]);
  assert.equal(afterPick.phase, 'loadout');
  const floor7 = equipWords(afterPick, afterPick.player.words);
  assert.equal(floor7.room, 15);
  assert.equal(getFloorInfo(floor7.room, floor7.rooms.length).code, '7-1');
  const battleStory6 = getBattleStory(revisitRoom(floor7, 12));
  assert.ok(battleStory6);
  assert.equal(battleStory6.milestones.length, 3);
});

test('Floor 10 special boss (ember_overlord) molten scales, charge regen, first artifact drop, and Special Sanctuary story', () => {
  let state = createRun('floor-10-special-boss', true, ['beam', 'wave']);
  state.learned = ['beam', 'wave'];
  state.player.words = [...START_WORDS, 'beam', 'wave'];
  state.clearedRooms = Array.from({ length: 21 }, (_, i) => i);
  state.sanctuary9Unlocked = true;
  state.highestRoom = FLOOR10_BOSS_ROOM;
  state = revisitRoom(state, FLOOR10_BOSS_ROOM);

  // Story banner for Floor 10 Special Boss encounter
  const boss10Story = getBattleStory(state);
  assert.ok(boss10Story);
  assert.match(boss10Story.title, /จ้าวอัคคีบรรพกาล/);
  assert.match(boss10Story.body, /เกล็ดแมกมา/);

  // Non-ice hit while ember_overlord has armor > 0 and survives triggers ember-thorns (2 scorch damage)
  state.player.hp = 40;
  state.player.hand = ['beam', 'fire', 'ice', 'shot', 'shield'];
  const fireHit = simulateTurn(state, ['beam', 'fire'], 'enemy-0');
  assert.equal(fireHit.ok, true);
  assert.ok(fireHit.events.some(ev => ev.type === 'ember-thorns' && ev.rawAttack === 2));
  // 2 thorns + 8 turn-1 attack = 10 total incoming
  assert.equal(fireHit.state.player.hp, 30);

  // Ice hit quenches Molten Scales (no ember-thorns even though armor === 4 on Turn 2)
  let t2 = fireHit.state;
  assert.equal(t2.turn, 2);
  assert.equal(t2.enemies[0].armor, 4);
  t2.player.hand = ['beam', 'ice', 'shot', 'fire', 'shield'];
  const iceHit = simulateTurn(t2, ['beam', 'ice'], 'enemy-0');
  assert.equal(iceHit.ok, true);
  assert.equal(iceHit.events.some(ev => ev.type === 'ember-thorns'), false);

  const iceAtk = iceHit.events.find(ev => ev.type === 'attack');
  assert.equal(iceAtk.sourceKind, 'ember_overlord');
  assert.equal(iceAtk.specialBoss, true);
  assert.equal(iceAtk.ultimate, false);

  // Turn 3 Charge regenerates +5 HP when injured and flags specialBoss/ultimate for boss VFX
  let t3 = iceHit.state;
  assert.equal(t3.turn, 3);
  t3.enemies[0].hp = 100;
  const chargeTurn = simulateTurn(t3, 'guard');
  assert.equal(chargeTurn.ok, true);
  assert.ok(chargeTurn.events.some(ev => ev.type === 'heal' && ev.source === 'enemy-0' && ev.amount === 5));
  assert.ok(chargeTurn.events.some(ev => ev.type === 'charge' && ev.sourceKind === 'ember_overlord' && ev.specialBoss === true && ev.ultimate === true));
  assert.equal(chargeTurn.state.enemies[0].hp, 105);

  // Turn 4 Ultimate Attack (16 dmg) flags ultimate: true
  const t4Preview = simulateTurn(structuredClone(chargeTurn.state), 'guard');
  assert.ok(t4Preview.events.some(ev => ev.type === 'attack' && ev.sourceKind === 'ember_overlord' && ev.specialBoss === true && ev.ultimate === true && ev.rawAttack === 16));

  // Defeating Floor 10 special boss drops ember_core_10 and reveals Special Sanctuary victory story
  let finisher = chargeTurn.state;
  finisher.enemies[0].hp = 1;
  finisher.player.hand = ['beam', 'fire', 'shot', 'ice', 'shield'];
  const victory = simulateTurn(finisher, ['beam', 'fire'], 'enemy-0');
  assert.equal(victory.ok, true);
  assert.equal(victory.summary.relicDropped, 'ember_core_10');
  assert.deepEqual(victory.state.player.relics, ['ember_core_10']);
  assert.equal(victory.state.phase, 'sanctuary');
  assert.equal(victory.state.sanctuaryFloor, 'post10');

  const sanctStory = getSanctuaryStory(victory.state, { recentRelicId: victory.summary.relicDropped });
  assert.ok(sanctStory);
  assert.match(sanctStory.kicker, /อาติแฟคชิ้นแรก/);
  assert.match(sanctStory.title, /จุดพักพิเศษ/);
  assert.match(sanctStory.artifactBadge, /แก่นเพลิงบรรพกาล/);
  assert.equal(sanctStory.highlights.length, 3);
});

test('Sanctuary artifact equip/unequip charm slots toggle Floor 10 artifact combat bonuses and persist in save', () => {
  const storage = new MemoryStorage();
  let state = createRun('charm-slots-test', true, ['beam', 'wave']);
  state.learned = ['beam', 'wave'];
  state.player.words = [...START_WORDS, 'beam', 'wave'];
  state.clearedRooms = Array.from({ length: 21 }, (_, i) => i);
  state.sanctuary9Unlocked = true;
  state.highestRoom = FLOOR10_BOSS_ROOM;
  state = revisitRoom(state, FLOOR10_BOSS_ROOM);
  state.enemies[0].hp = 1;
  state.player.hand = ['beam', 'fire', 'shot', 'ice', 'shield'];

  // Beat Floor 10 boss -> drops & auto-equips ember_core_10 into charm slot 1 (of 3)
  let post10 = simulateTurn(state, ['beam', 'fire'], 'enemy-0').state;
  assert.equal(post10.phase, 'sanctuary');
  assert.equal(MAX_RELIC_SLOTS, 3);
  assert.deepEqual(post10.player.relics, ['ember_core_10']);
  assert.deepEqual(getEquippedRelics(post10.player), ['ember_core_10']);

  // Unequip in Sanctuary -> remains in owned relics, removed from equipped charm slots
  let unequipped = unequipRelic(post10, 'ember_core_10');
  assert.deepEqual(unequipped.player.relics, ['ember_core_10']);
  assert.deepEqual(getEquippedRelics(unequipped.player), []);
  assert.equal(saveRun(unequipped, storage).ok, true);
  const reloadedUnequipped = loadRun(storage).state;
  assert.deepEqual(getEquippedRelics(reloadedUnequipped.player), []);

  const unequippedStory = getSanctuaryStory(reloadedUnequipped);
  assert.match(unequippedStory.artifactBadge, /ถอดเก็บไว้/);

  // Entering battle with ember_core_10 unequipped does NOT apply +2 Fire dmg / +1 Burn
  let battleUnequipped = revisitRoom(reloadedUnequipped, 0);
  battleUnequipped.player.words = ['shot', 'fire', 'burn', 'ice', 'shield'];
  battleUnequipped.player.hand = ['shot', 'fire', 'burn', 'ice', 'shield'];
  const hitWithout = simulateTurn(battleUnequipped, ['shot', 'fire', 'burn'], 'enemy-0');
  assert.equal(hitWithout.ok, true);
  assert.equal(hitWithout.summary.damage, 10);
  assert.equal(hitWithout.state.enemies[0].burn, 3);

  // Cannot equip/unequip during battle
  assert.throws(() => equipRelic(battleUnequipped, 'ember_core_10'), /จุดพักและร้านค้า/);

  // Return to Sanctuary -> re-equip ember_core_10 -> restores +2 Fire dmg / +1 Burn
  let backInSanct = enterSanctuary(reloadedUnequipped, { floor: 'post10' });
  let reEquipped = equipRelic(backInSanct, 'ember_core_10');
  assert.deepEqual(getEquippedRelics(reEquipped.player), ['ember_core_10']);
  assert.equal(saveRun(reEquipped, storage).ok, true);
  const reloadedEquipped = loadRun(storage).state;
  assert.deepEqual(getEquippedRelics(reloadedEquipped.player), ['ember_core_10']);

  const equippedStory = getSanctuaryStory(reloadedEquipped);
  assert.match(equippedStory.artifactBadge, /สวมใส่อยู่/);

  let battleEquipped = revisitRoom(reloadedEquipped, 0);
  battleEquipped.player.words = ['shot', 'fire', 'burn', 'ice', 'shield'];
  battleEquipped.player.hand = ['shot', 'fire', 'burn', 'ice', 'shield'];
  const hitWith = simulateTurn(battleEquipped, ['shot', 'fire', 'burn'], 'enemy-0');
  assert.equal(hitWith.ok, true);
  assert.equal(hitWith.summary.damage, 12);
  assert.equal(hitWith.state.enemies[0].burn, 4);
});

test('Floors 11-18 mirror structure (11-13 -> Sanct 14, 15-18 -> Sanct 19), card/gold boss rewards, and defeat fallbacks', () => {
  const storage = new MemoryStorage();
  const run = createRun('floors-11-19', true);
  assert.equal(run.rooms.length, TOTAL_TOWER_ROOMS);

  // Verify room index -> floor/sub-room mapping for Floors 11-20
  assert.equal(getFloorInfo(25).code, '11-1');
  assert.equal(getFloorInfo(27).code, '11-3');
  assert.equal(getFloorInfo(27).isBoss, true);
  assert.equal(getFloorInfo(30).code, '12-3');
  assert.equal(getFloorInfo(33).code, '13-3');
  assert.equal(getFloorInfo(36).code, '14-3');
  assert.equal(getFloorInfo(36).isBoss, true);
  assert.equal(getFloorInfo(37).code, '16-1');
  assert.equal(getFloorInfo(39).code, '16-3');
  assert.equal(getFloorInfo(42).code, '17-3');
  assert.equal(getFloorInfo(45).code, '18-3');
  assert.equal(getFloorInfo(48).code, '19-3');
  assert.equal(getFloorInfo(48).isBoss, true);
  assert.equal(getFloorInfo(49).code, '20★');
  assert.equal(getFloorInfo(49).floor, 20);
  assert.equal(getFloorInfo(49).isBoss, true);

  // Set up player having defeated Floor 10 boss and unlocked post-10 Sanctuary
  let state = createRun('climb-11-19', true, ['beam', 'wave']);
  state.learned = ['beam', 'wave'];
  state.player.words = [...START_WORDS, 'beam', 'wave'];
  state.clearedRooms = Array.from({ length: 25 }, (_, i) => i);
  state.rewardedBossRooms = [2, 5, 8, 11, 14, 17, 20, 23, 24];
  state.sanctuaryUnlocked = true;
  state.sanctuary9Unlocked = true;
  state.sanctuaryPost10Unlocked = true;
  state.highestRoom = FLOOR11_START_ROOM;
  state.room = FLOOR11_START_ROOM;

  assert.equal(isSanctuary14Unlocked(state), false);
  assert.throws(() => enterSanctuary(state, { floor: 15 }), /ต้องผ่านด่าน/);
  assert.equal(isSanctuary19Unlocked(state), false);
  assert.throws(() => enterSanctuary(state, { floor: 'pre20' }), /ต้องผ่านด่าน/);

  // Enter 11-1 -> 11-2 -> 11-3 Boss (prism_watcher)
  state = revisitRoom(state, 25);
  for (const e of state.enemies) { e.hp = 1; e.ward = 0; }
  state.player.hand = ['wave', 'fire', 'shot', 'ice', 'shield'];
  state = simulateTurn(state, ['wave', 'fire'], 'enemy-0').state;
  assert.equal(state.room, 26);

  for (const e of state.enemies) { e.hp = 1; e.ward = 0; }
  state.player.hand = ['wave', 'fire', 'shot', 'ice', 'shield'];
  state = simulateTurn(state, ['wave', 'fire'], 'enemy-0').state;
  assert.equal(state.room, 27);
  assert.equal(state.enemies[0].kind, 'prism_watcher');
  const battleStory11 = getBattleStory(state);
  assert.ok(battleStory11);
  assert.match(battleStory11.title, /ผู้เฝ้าปริซึม/);

  // Defeat Boss 11 -> random card reward
  state.enemies[0].hp = 1;
  state.player.hand = ['beam', 'fire', 'shot', 'ice', 'shield'];
  const beat11 = simulateTurn(state, ['beam', 'fire'], 'enemy-0');
  assert.equal(beat11.ok, true);
  assert.equal(beat11.state.phase, 'reward');
  assert.equal(beat11.state.rewards.length, 3);
  state = chooseReward(beat11.state, beat11.state.rewards[0]);
  state = equipWords(state, state.player.words);
  assert.equal(state.room, 28); // 12-1

  // Losing on Floor 12 (room 28 in 11-14) falls back to Post-10 Special Sanctuary & resets Floors 11-14 to 11-1
  state.player.gold = 90;
  state.player.hp = 1;
  state.player.shield = null;
  state.enemies.forEach(e => { e.chill = 0; e.freeze = 0; });
  const fellPost10 = simulateTurn(state, 'guard');
  assert.equal(fellPost10.ok, true);
  assert.equal(fellPost10.summary.fellToFloor, 'post10');
  assert.equal(fellPost10.state.phase, 'sanctuary');
  assert.equal(fellPost10.state.sanctuaryFloor, 'post10');
  assert.equal(fellPost10.state.room, FLOOR11_START_ROOM);
  assert.equal(fellPost10.state.highestRoom, FLOOR11_START_ROOM);
  assert.equal(fellPost10.state.sanctuary14Unlocked, false);
  assert.equal(fellPost10.state.player.gold, 90);
  assert.ok(!fellPost10.state.clearedRooms.includes(25));
  assert.ok(fellPost10.state.clearedRooms.includes(24));

  // Clear through Boss 14 (room 36) -> unlocks Floor 15 Sanctuary
  let pre13 = revisitRoom(fellPost10.state, FLOOR11_START_ROOM);
  pre13.clearedRooms = Array.from({ length: 36 }, (_, i) => i);
  pre13.highestRoom = FLOOR14_BOUNDARY_ROOM;
  pre13 = revisitRoom(pre13, FLOOR14_BOUNDARY_ROOM);
  assert.equal(pre13.enemies[0].kind, 'eclipse_mage');
  pre13.enemies[0].hp = 1;
  pre13.player.hand = ['beam', 'fire', 'shot', 'ice', 'shield'];
  const beat13 = simulateTurn(pre13, ['beam', 'fire'], 'enemy-0');
  assert.equal(beat13.ok, true);
  let sanct14 = beat13.state.phase === 'reward'
    ? chooseReward(beat13.state, beat13.state.rewards[0])
    : beat13.state;
  assert.equal(sanct14.phase, 'sanctuary');
  assert.equal(sanct14.sanctuaryFloor, 15);
  assert.equal(sanct14.highestRoom, FLOOR16_START_ROOM);
  assert.equal(isSanctuary14Unlocked(sanct14), true);

  // Floor 16 climb starting from room 37
  let floor16 = revisitRoom(sanct14, FLOOR16_START_ROOM);
  floor16.clearedRooms = Array.from({ length: 39 }, (_, i) => i);
  floor16.highestRoom = 39;
  floor16 = revisitRoom(floor16, 39);
  assert.equal(floor16.enemies[0].kind, 'glacial_sovereign');

  // Check defeat in Floors 16-19 (e.g. room 40) falls back to Floor 15 Sanctuary and resets to 16-1
  let f16 = structuredClone(floor16);
  f16.highestRoom = 40;
  f16 = revisitRoom(f16, 40);
  f16.player.hp = 1;
  f16.player.shield = null;
  f16.enemies.forEach(e => { e.chill = 0; e.freeze = 0; });
  if (f16.enemies.every(e => intent(e, f16.turn).type !== 'attack')) {
    f16 = simulateTurn(f16, 'guard').state;
    f16.player.hp = 1;
    f16.player.shield = null;
  }
  const fell14 = simulateTurn(f16, 'guard');
  assert.equal(fell14.ok, true);
  assert.equal(fell14.summary.fellToFloor, 15);
  assert.equal(fell14.state.phase, 'sanctuary');
  assert.equal(fell14.state.sanctuaryFloor, 15);
  assert.equal(fell14.state.room, FLOOR16_START_ROOM);
  assert.equal(fell14.state.highestRoom, FLOOR16_START_ROOM);
  assert.equal(fell14.state.sanctuary19Unlocked, false);
  assert.ok(fell14.state.clearedRooms.includes(36));
  assert.ok(!fell14.state.clearedRooms.includes(37));

  // A full collection still gets a duplicate draft before the pre-20 Sanctuary.
  let pre18 = fell14.state;
  pre18.learned = Object.keys(WORDS).filter(w => !START_WORDS.includes(w));
  pre18.collection = [...pre18.learned];
  pre18.clearedRooms = Array.from({ length: 48 }, (_, i) => i);
  pre18.highestRoom = FLOOR19_BOUNDARY_ROOM;
  pre18 = revisitRoom(pre18, FLOOR19_BOUNDARY_ROOM);
  assert.equal(pre18.enemies[0].kind, 'seal_curator');
  pre18.enemies[0].hp = 1;
  if (pre18.enemies[1]) pre18.enemies[1].hp = 0;
  pre18.player.hand = ['beam', 'fire', 'shot', 'ice', 'shield'];
  const beat18 = simulateTurn(pre18, ['beam', 'fire'], 'enemy-0');
  assert.equal(beat18.ok, true);
  assert.equal(beat18.state.phase, 'reward');
  const duplicate = beat18.state.rewards[0];
  assert.equal(saveRun(beat18.state, storage).ok, true);
  const claimed = chooseReward(loadRun(storage).state, duplicate);
  assert.equal(claimed.player.cardUpgrades[duplicate], 1);
  assert.deepEqual(claimed.collection, pre18.collection);
  assert.equal(claimed.phase, 'sanctuary');
  assert.equal(claimed.sanctuaryFloor, 'pre20');
  assert.equal(claimed.highestRoom, FLOOR20_BOSS_ROOM);
  assert.equal(isSanctuary19Unlocked(claimed), true);
  assert.equal(saveRun(claimed, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, claimed);
});

test('Floor 20 special boss (tempest_archon), Storm Carapace counter, 2nd artifact (storm_pendulum_20) pair refund, post-20 Sanctuary & Floor 19 fallback', () => {
  const storage = new MemoryStorage();
  let state = createRun('floor-20-boss', true, ['beam', 'wave', 'lightning', 'pierce']);
  state.learned = ['beam', 'wave', 'lightning', 'pierce'];
  state.player.words = ['shot', 'fire', 'ice', 'pair', 'beam', 'lightning', 'pierce'];
  state.clearedRooms = Array.from({ length: 49 }, (_, i) => i);
  state.rewardedBossRooms = [2, 5, 8, 11, 14, 17, 20, 23, 24, 27, 30, 33, 36, 39, 42, 45, 48];
  state.sanctuaryUnlocked = true;
  state.sanctuary9Unlocked = true;
  state.sanctuaryPost10Unlocked = true;
  state.sanctuary14Unlocked = true;
  state.sanctuary19Unlocked = true;
  state.highestRoom = FLOOR20_BOSS_ROOM;

  assert.equal(isSanctuaryPost20Unlocked(state), false);
  assert.throws(() => enterSanctuary(state, { floor: 'post20' }), /ปราบบอสพิเศษชั้นที่ 20/);

  // Enter Floor 20 boss fight (tempest_archon)
  let boss20 = revisitRoom(state, FLOOR20_BOSS_ROOM);
  assert.equal(boss20.room, 49);
  assert.equal(isBossRoom(boss20), true);
  assert.equal(boss20.enemies[0].kind, 'tempest_archon');
  assert.equal(boss20.enemies[0].hp, 255);
  assert.equal(boss20.enemies[0].armor, 4);
  assert.equal(boss20.enemies[0].ward, 1);

  const boss20Story = getBattleStory(boss20);
  assert.ok(boss20Story);
  assert.match(boss20Story.title, /จ้าวพายุอสุนีบาต/);

  // Non-lightning, non-pierce hit while armor > 0 triggers storm-static (3 dmg counter)
  boss20.player.hp = 40;
  boss20.player.hand = ['beam', 'fire', 'lightning', 'pierce', 'ice'];
  const fireTrigger = simulateTurn(boss20, ['beam', 'fire'], 'enemy-0');
  assert.equal(fireTrigger.ok, true);
  assert.ok(fireTrigger.events.some(ev => ev.type === 'storm-static' && ev.rawAttack === 3));
  // 3 static + 11 turn-1 attack = 14 total incoming
  assert.equal(fireTrigger.state.player.hp, 26);

  // Turn 2: Lightning bypasses Storm Carapace even though armor === 5
  let t2 = fireTrigger.state;
  assert.equal(t2.turn, 2);
  assert.equal(t2.enemies[0].armor, 5);
  assert.equal(intent(t2.enemies[0], 2).amount, 14);
  t2.player.hand = ['beam', 'lightning', 'fire', 'shot', 'ice'];
  const lightningBypass = simulateTurn(t2, ['beam', 'lightning'], 'enemy-0');
  assert.equal(lightningBypass.ok, true);
  assert.equal(lightningBypass.events.some(ev => ev.type === 'storm-static'), false);
  const t2Atk = lightningBypass.events.find(ev => ev.type === 'attack');
  assert.equal(t2Atk.sourceKind, 'tempest_archon');
  assert.equal(t2Atk.specialBoss, true);
  assert.equal(t2Atk.ultimate, false);

  // Turn 3: Charge regenerates +8 HP when injured and flags specialBoss/ultimate for boss VFX
  let t3 = lightningBypass.state;
  assert.equal(t3.turn, 3);
  assert.equal(t3.enemies[0].ward, 1);
  assert.equal(t3.enemies[0].armor, 3);
  t3.enemies[0].hp = 120;
  const chargeTurn = simulateTurn(t3, 'guard');
  assert.equal(chargeTurn.ok, true);
  assert.ok(chargeTurn.events.some(ev => ev.type === 'heal' && ev.source === 'enemy-0' && ev.amount === 8));
  assert.ok(chargeTurn.events.some(ev => ev.type === 'charge' && ev.sourceKind === 'tempest_archon' && ev.specialBoss === true && ev.ultimate === true));
  assert.equal(chargeTurn.state.enemies[0].hp, 128);

  // Turn 4: Exposed (armor 0, ward 0), heavy attack 20 -> ultimate: true & losing falls back to pre-20 Sanctuary
  let t4 = chargeTurn.state;
  assert.equal(t4.turn, 4);
  assert.equal(t4.enemies[0].armor, 0);
  assert.equal(t4.enemies[0].ward, 0);
  assert.equal(intent(t4.enemies[0], 4).amount, 20);
  t4.player.hp = 1;
  t4.player.shield = null;
  const fell19 = simulateTurn(t4, 'guard');
  assert.equal(fell19.ok, true);
  assert.ok(fell19.events.some(ev => ev.type === 'attack' && ev.sourceKind === 'tempest_archon' && ev.specialBoss === true && ev.ultimate === true && ev.rawAttack === 20));
  assert.equal(fell19.summary.fellToFloor, 'pre20');
  assert.equal(fell19.state.phase, 'sanctuary');
  assert.equal(fell19.state.sanctuaryFloor, 'pre20');
  assert.equal(fell19.state.clearedRooms.length, 49);

  // Victory over Floor 20 boss -> drops storm_pendulum_20, Gold/EXP, and opens post-20 Special Sanctuary
  let rematch20 = revisitRoom(fell19.state, FLOOR20_BOSS_ROOM);
  rematch20.enemies[0].hp = 1;
  rematch20.player.hand = ['beam', 'fire', 'shot', 'ice', 'pierce'];
  const goldBefore = rematch20.player.gold;
  const win20 = simulateTurn(rematch20, ['beam', 'fire'], 'enemy-0');
  assert.equal(win20.ok, true);
  assert.equal(win20.summary.relicDropped, 'storm_pendulum_20');
  assert.ok(win20.summary.goldGain >= 280);
  assert.ok(win20.state.player.gold > goldBefore);
  assert.ok(win20.state.player.relics.includes('storm_pendulum_20'));
  assert.ok(getEquippedRelics(win20.state.player).includes('storm_pendulum_20'));
  assert.equal(win20.state.phase, 'sanctuary');
  assert.equal(win20.state.sanctuaryFloor, 'post20');
  assert.equal(isSanctuaryPost20Unlocked(win20.state), true);
  assert.equal(saveRun(win20.state, storage).ok, true);
  assert.deepEqual(loadRun(storage).state, win20.state);

  const post20Story = getSanctuaryStory(win20.state, { recentRelicId: win20.summary.relicDropped });
  assert.ok(post20Story);
  assert.match(post20Story.kicker, /อาติแฟคชิ้นที่สอง/);
  assert.match(post20Story.artifactBadge, /ลูกตุ้มสายฟ้าฟาด/);

  // Test storm_pendulum_20 passive: +1 mana refund when casting spell containing 'pair' (toggled by equip/unequip)
  let equippedFight = revisitRoom(win20.state, 0);
  equippedFight.player.mana = 12;
  equippedFight.player.hand = ['shot', 'fire', 'pair', 'ice', 'pierce'];
  const pairWithRelic = simulateTurn(equippedFight, ['shot', 'fire', 'pair'], 'enemy-0');
  assert.equal(pairWithRelic.ok, true);
  assert.equal(pairWithRelic.summary.cost, 6); // (1 + 2) * 2 = 6
  assert.equal(pairWithRelic.summary.manaRefunded, 1);
  assert.ok(pairWithRelic.events.some(ev => ev.type === 'mana-refund' && ev.amount === 1));
  // Started at 12, spent 6, refunded 1 -> 7, then turn ends and refills to maxMana; verify manaAfterCast is 7
  assert.equal(pairWithRelic.summary.manaAfterCast, 7);

  // Unequip storm_pendulum_20 in post-20 Sanctuary -> no mana refund
  let unequipped20 = unequipRelic(win20.state, 'storm_pendulum_20');
  assert.deepEqual(getEquippedRelics(unequipped20.player), []);
  let unequippedFight = revisitRoom(unequipped20, 0);
  unequippedFight.player.mana = 12;
  unequippedFight.player.hand = ['shot', 'fire', 'pair', 'ice', 'pierce'];
  const pairNoRelic = simulateTurn(unequippedFight, ['shot', 'fire', 'pair'], 'enemy-0');
  assert.equal(pairNoRelic.ok, true);
  assert.equal(pairNoRelic.summary.manaRefunded ?? 0, 0);
  assert.equal(pairNoRelic.events.some(ev => ev.type === 'mana-refund'), false);
  assert.equal(pairNoRelic.summary.manaAfterCast, 6);
});

test('shared combos helper computes playable formulas and matches master catalog parity', () => {
  const state = createRun('combo-parity');
  state.player.hand = ['shot', 'fire', 'pair', 'shield', 'ice'];
  state.player.mana = 12;
  state.stats.discovered = ['shot fire', 'shield fire pair'];

  const combos = computePlayableCombos(state, ['shield', 'ice'], ['shield ice']);
  assert.ok(combos.some(c => c.key === 'shot fire' && c.discovered === true));
  assert.ok(combos.some(c => c.key === 'shield fire pair' && c.discovered === true));
  assert.ok(combos.some(c => c.key === 'shield ice' && c.discovered === true));
  assert.ok(combos.some(c => c.key === 'shot fire pair' && c.discovered === false));
  assert.equal(canFormPhraseInHand(state, ['blast', 'shield', 'fire']), null);

  state.player.words = [...state.player.words, 'blast', 'devastation'];
  state.player.hand = ['shot', 'fire', 'blast', 'shield', 'devastation'];
  state.player.shield = { layers: [6], expires: 2, effect: 'fire', triggered: false };
  const detonate = canFormPhraseInHand(state, ['blast', 'shield', 'fire']);
  assert.ok(detonate);
  assert.match(describeFormulaEffect({ phrase: detonate.ids, spell: detonate.spell }), /ระเบิดโล่ไฟ/);

  const devaCombos = computePlayableCombos(state, [], []);
  assert.ok(devaCombos.some(c => c.phrase.includes('devastation')));
  assert.ok(MASTER_FORMULAS.length > 50);
});

test('upgraded shield counters and Rift defense scaling preserve early-game numbers while scaling late game', () => {
  const baseState = battle(['striker']);
  baseState.player.hand = ['shield', 'lightning'];
  const baseRes = cast(baseState, 'shield lightning');
  const baseCounter = baseRes.events.find(ev => ev.type === 'damage');
  assert.equal(baseCounter.amount, 5);

  const upgState = battle(['striker']);
  upgState.player.cardUpgrades = { shield: 4, lightning: 3, fire: 4 };
  upgState.player.hand = ['shield', 'lightning'];
  const upgRes = cast(upgState, 'shield lightning');
  const upgCounter = upgRes.events.find(ev => ev.type === 'damage');
  // Base 5 + floor(4/2)=2 + 3 = 10
  assert.equal(upgCounter.amount, 10);

  const riftState = battle(['striker']);
  riftState.room = FLOOR31_START_ROOM;
  riftState.player.hp = 400;
  riftState.player.maxHp = 600;
  riftState.player.cardUpgrades = { shield: 3, heal: 3 };
  riftState.player.hand = ['shield', 'heal'];
  const riftRes = cast(riftState, 'shield heal');
  assert.ok(riftRes.summary.shield > 12);
  assert.ok(riftRes.summary.healed > 10);
});

test('grand storm element pair casts without fizzling, adds mana cost, +2 pierce, and double grand shockwave', () => {
  const state = battle(['rune_ram', 'rune_ram', 'rune_ram', 'rune_ram', 'rune_ram']);
  state.player.maxMana = state.player.mana = 24;
  state.player.maxHp = state.player.hp = 120;
  for (const enemy of state.enemies) enemy.armor = 2;

  const parsedFire = parseSpell(['grand', 'storm', 'fire', 'pair']);
  assert.equal(parsedFire.ok, true);
  assert.equal(parsedFire.cost, 15);
  assert.equal(parsedFire.spell.grand, true);
  assert.equal(parsedFire.spell.stormPair, true);
  assert.equal(parsedFire.spell.pierce, 2);
  assert.equal(getSpellCatalog().has('grand storm fire pair'), true);
  assert.match(describeFormulaEffect({ phrase: parsedFire.ids, spell: parsedFire.spell }), /ทั้งสองระลอก/);
  assert.match(describeFormulaEffect({ phrase: parsedFire.ids, spell: parsedFire.spell }), /เจาะทะลุเกราะ \+2/);

  assert.equal(parseSpell(['grand', 'storm', 'akki', 'pair']).cost, 18);
  assert.equal(parseSpell(['grand', 'storm', 'magma', 'pair']).cost, 20);
  // Still rejects invalid multi-tail grand combos (e.g. non-ice freeze)
  assert.equal(parseSpell(['grand', 'beam', 'fire', 'freeze']).ok, false);

  const center = 'enemy-2';
  const res = cast(state, 'grand storm fire pair', center);
  assert.equal(res.summary.fizzled, false);
  assert.equal(res.summary.cost, 15);
  // With armor=2 and pierce=2, armor is completely pierced!
  // Fire=10, multiplier=2.25 => strength=22.5
  // Wave 1: center=23, neighbors=12 -> grand1 blast neighbors=12
  // Wave 2: center=14, neighbors=7 -> grand2 blast neighbors=7
  // Total center=37 (52->15), neighbors=38 (52->14)
  const hp = result => Object.values(result.summary.enemyHp);
  assert.deepEqual(hp(res), [52, 14, 15, 14, 52]);
  assert.equal(res.events.filter(ev => ev.type === 'blast').length, 2);

  // If center has 1 ward, Wave 1 pops ward and Wave 2 hits center + triggers Wave 2 grand shockwave
  state.enemies[2].ward = 1;
  const warded = cast(state, 'grand storm fire pair', center);
  assert.equal(warded.summary.wards, 1);
  assert.equal(warded.events.filter(ev => ev.type === 'blast').length, 1);
  // Center takes Wave 2 (14): 52->38; neighbors take Wave 1 (12) + Wave 2 (7) + Wave 2 grand (7) = 26 -> 26
  assert.deepEqual(hp(warded), [52, 26, 38, 26, 52]);
});

test('shot blast variants and grand shield pair parse, register in catalog, and outperform plain blast', () => {
  const catalog = getSpellCatalog();
  const expectedCosts = [
    ['shot blast', 5],
    ['shot blast pair', 10],
    ['shot blast large', 7],
    ['shot blast large pair', 14],
    ['shot blast fire', 7],
    ['shot blast fire pair', 14],
    ['shot blast pair fire', 14],
    ['shot blast fire large', 9],
    ['shot blast large fire', 9],
    ['shot blast fire ice', 8],
    ['shot blast ice fire', 8],
    ['shot blast devastation', 10],
    ['shot blast fire devastation', 12],
    ['grand shot blast', 8],
    ['grand shot blast fire', 10],
    ['grand shield pair', 12],
  ];
  for (const [phrase, cost] of expectedCosts) {
    const parsed = parseSpell(phrase.split(' '));
    assert.equal(parsed.ok, true, phrase);
    assert.equal(parsed.cost, cost, phrase);
    assert.equal(catalog.has(phrase), true, `catalog missing: ${phrase}`);
  }
  assert.deepEqual(parseSpell(['shot', 'blast', 'fire', 'ice']).spell, parseSpell(['shot', 'blast', 'ice', 'fire']).spell);
  assert.deepEqual(parseSpell(['shot', 'blast', 'fire', 'pair']).spell, parseSpell(['shot', 'blast', 'pair', 'fire']).spell);
  assert.equal(parseSpell(['shot', 'blast', 'pair', 'large']).ok, false);
  assert.equal(parseSpell(['shot', 'blast', 'fire', 'fire']).ok, false);
  assert.equal(parseSpell(['shot', 'blast', 'blast']).ok, false);
  assert.equal(parseSpell(['grand', 'shield', 'pair', 'devastation']).ok, false);

  const state = battle(['rune_ram', 'rune_ram', 'rune_ram']);
  state.player.maxMana = state.player.mana = 20;
  state.player.maxHp = state.player.hp = 120;
  for (const enemy of state.enemies) enemy.armor = 0;
  const hp = result => Object.values(result.summary.enemyHp);

  // shot blast (5 MP): projectile 8 + radius-1 blast ceil(8*0.6)=5 => 13 center / 5 neighbors vs blast (6 center / 3 neighbors)
  const plainBlast = cast(state, 'blast', 'enemy-1');
  const shellBlast = cast(state, 'shot blast', 'enemy-1');
  assert.deepEqual(hp(plainBlast), [49, 46, 49]);
  assert.deepEqual(hp(shellBlast), [47, 39, 47]);
  assert.ok(shellBlast.summary.damage > plainBlast.summary.damage);

  // shot blast fire (7 MP): projectile 10 + radius-1 fire blast 6 => 16 center / 6 neighbors vs blast fire (10 center / 5 neighbors)
  const fireBlast = cast(state, 'blast fire', 'enemy-1');
  const fireShell = cast(state, 'shot blast fire', 'enemy-1');
  assert.deepEqual(hp(fireBlast), [47, 42, 47]);
  assert.deepEqual(hp(fireShell), [46, 36, 46]);
  assert.ok(fireShell.summary.damage > fireBlast.summary.damage);

  // Ward interaction differs: blast fire skips warded center without breaking ward, whereas shot blast fire pops ward as a projectile
  state.enemies[1].ward = 1;
  const wardedBlast = cast(state, 'blast fire', 'enemy-1');
  const wardedShell = cast(state, 'shot blast fire', 'enemy-1');
  assert.equal(wardedBlast.summary.enemyStatus['enemy-1'].ward, 1);
  assert.equal(wardedBlast.summary.wards, 0);
  assert.equal(wardedShell.summary.enemyStatus['enemy-1'].ward, 0);
  assert.equal(wardedShell.summary.wards, 1);
  assert.equal(wardedShell.summary.damage, 0);
  state.enemies[1].ward = 0;

  // shot blast large: 1.5x projectile (12) + blast (8) => 20 center / 8 neighbors
  const largeShell = cast(state, 'shot blast large', 'enemy-1');
  assert.deepEqual(hp(largeShell), [44, 32, 44]);

  // shot blast fire ice: dual element projectile (avg 8) + chill 2 + blast (5) => 13 center / 5 neighbors, all chilled
  const dualShell = cast(state, 'shot blast fire ice', 'enemy-1');
  assert.deepEqual(hp(dualShell), [47, 39, 47]);
  assert.equal(dualShell.summary.enemyStatus['enemy-0'].chill, 4);
  assert.equal(dualShell.summary.enemyStatus['enemy-1'].chill, 8);

  // shot blast pair & shot blast fire pair hit two selected targets
  const pairedShell = cast(state, 'shot blast fire pair', 'enemy-0', 'enemy-2');
  assert.equal(pairedShell.events.filter(ev => ev.type === 'projectile').length, 2);
  assert.equal(pairedShell.events.filter(ev => ev.type === 'blast').length, 2);
  // enemy-0: 16 direct + 6 splash from enemy-2? slot diff is 2 so no overlap -> enemy-0: 16, enemy-1: 6+6=12, enemy-2: 16
  assert.deepEqual(hp(pairedShell), [36, 40, 36]);

  // grand shield pair: 2 layers x 12 = 24 shield, renews +3 on front layer when remaining
  const defState = battle(['striker']);
  defState.player.maxMana = defState.player.mana = 15;
  const grandShieldPair = cast(defState, 'grand shield pair');
  assert.deepEqual(grandShieldPair.state.player.shield.layers, [12, 12]);
  assert.equal(grandShieldPair.events.at(-1).restored, 3);
  assert.equal(grandShieldPair.summary.shield, 24);
});

test('expanded heal, shield, blast, form modifiers, grand pairs, and epic/legendary extensions work in catalog and combat', () => {
  const catalog = getSpellCatalog();
  const validPhrases = [
    ['heal pair', 6], ['heal self pair', 6], ['heal large pair', 10], ['heal self large pair', 10],
    ['grand heal large', 9], ['grand heal self large', 9],
    ['shield heal large', 7], ['shield fire heal', 6], ['shield fire heal pair', 8],
    ['shield brace pair', 8], ['shield pair brace', 8], ['shield large brace', 6], ['shield brace large', 6],
    ['grand shield large', 8], ['grand shield fire', 7], ['grand shield brace', 7],
    ['veil pair', 14], ['veil large', 9], ['veil large pair', 18], ['grand veil', 10],
    ['blast pair', 7], ['blast large', 6], ['blast large pair', 9], ['blast fire large', 8],
    ['blast devastation', 9], ['blast fire devastation', 11], ['grand blast fire ice', 10],
    ['shot blast fire burn', 8], ['shot blast ice freeze', 10], ['shot blast fire pierce', 8],
    ['shot blast fire push', 8], ['shot blast fire dispel', 9], ['shot blast fire seal', 9],
    ['beam fire burn', 5], ['beam fire large', 6], ['beam fire blast', 6], ['beam fire pierce', 5],
    ['wave fire large', 7], ['wave ice freeze', 8], ['wave fire burn', 6], ['wave fire pull', 6],
    ['storm fire large', 9], ['storm fire burn', 8], ['storm ice freeze', 10], ['storm fire seal', 9],
    ['grand beam fire pair', 14], ['grand wave fire pair', 16],
    ['meteor large', 11], ['meteor pair', 18], ['grand meteor', 12], ['meteor devastation', 14],
    ['blackhole large', 22], ['grand blackhole', 23], ['blackhole devastation', 25],
  ];
  for (const [phrase, cost] of validPhrases) {
    const parsed = parseSpell(phrase.split(' '));
    assert.equal(parsed.ok, true, phrase);
    assert.equal(parsed.cost, cost, phrase);
    assert.equal(catalog.has(phrase), true, `catalog missing: ${phrase}`);
  }
  // Ensure ice-only freeze and grand-blast rules remain strict
  assert.equal(parseSpell(['beam', 'fire', 'freeze']).ok, false);
  assert.equal(parseSpell(['wave', 'fire', 'freeze']).ok, false);
  assert.equal(parseSpell(['storm', 'fire', 'freeze']).ok, false);
  assert.equal(parseSpell(['grand', 'blast']).ok, false);
  assert.equal(parseSpell(['death', 'pair']).ok, false);

  // Word order on shield heal + large: shield large heal (9 shield, 4 heal) vs shield heal large (6 shield, 8 heal)
  const shState = battle(['striker']);
  shState.player.hp = 10;
  const shieldBig = cast(shState, 'shield large heal');
  const healBig = cast(shState, 'shield heal large');
  assert.equal(shieldBig.summary.healed, 4);
  assert.equal(shieldBig.summary.shield, 6);
  assert.equal(healBig.summary.healed, 8);
  assert.equal(healBig.summary.shield, 3);

  // grand veil: 18 veil + renews +4 next turn; striker deals 3 => 15 + 3 = 18 (capped at 18)
  const veilRes = cast(battle(['striker']), 'grand veil');
  assert.equal(veilRes.state.player.shield.effect, 'veil');
  assert.equal(veilRes.state.player.shield.layers[0], 18);

  // meteor pair drops 6 seeded-random meteors; meteor devastation adds radius-2 burst
  const mState = battle(['rune_ram', 'rune_ram', 'rune_ram', 'rune_ram']);
  mState.player.maxMana = mState.player.mana = 24;
  for (const enemy of mState.enemies) { enemy.armor = 0; enemy.maxHp = enemy.hp = 200; }
  const pairMeteor = cast(mState, 'meteor pair', 'enemy-0', 'enemy-3');
  assert.equal(pairMeteor.events.filter(ev => ev.type === 'blast').length, 6);
  const pairMeteorReplay = cast(mState, 'meteor pair', 'enemy-0', 'enemy-3');
  assert.deepEqual(pairMeteor.summary.enemyHp, pairMeteorReplay.summary.enemyHp);
  assert.ok(pairMeteor.summary.damage >= 6 * 36);

  const devMeteor = cast(mState, 'meteor devastation', 'enemy-1');
  assert.equal(devMeteor.events.filter(ev => ev.type === 'blast').length, 4);
  assert.equal(devMeteor.events.some(ev => ev.type === 'blast' && ev.devastation), true);
  assert.ok(devMeteor.summary.damage > cast(mState, 'meteor', 'enemy-1').summary.damage);

  // blast fire devastation triggers both blast and radius-2 devastation shockwave
  const blastDev = cast(mState, 'blast fire devastation', 'enemy-1');
  assert.equal(blastDev.events.some(ev => ev.type === 'blast' && ev.devastation), true);
  assert.ok(blastDev.summary.damage > cast(mState, 'blast fire', 'enemy-1').summary.damage);

  // grand beam fire pair & grand wave fire pair execute cleanly with grand shockwaves
  const gBeam = cast(mState, 'grand beam fire pair', 'enemy-1', 'enemy-2');
  assert.equal(gBeam.events.filter(ev => ev.type === 'projectile').length, 2);
  assert.equal(gBeam.events.filter(ev => ev.type === 'blast').length, 2);
  const gWave = cast(mState, 'grand wave fire pair', 'enemy-1');
  assert.equal(gWave.events.filter(ev => ev.type === 'blast').length, 2);

  // blackhole large sets power = 450
  const bh = cast(mState, 'blackhole large', 'slot-1');
  assert.equal(bh.state.blackhole.power, 450);
});

test('grand prefix supports all valid 1-3 word attack, shield, veil, heal, meteor, and blackhole combos', () => {
  const catalog = getSpellCatalog();
  const grandPhrases = [
    ['grand shot blast pair', 16],
    ['grand shot blast large', 10],
    ['grand shot fire large', 8],
    ['grand beam fire large', 9],
    ['grand beam fire burn', 8],
    ['grand wave fire large', 10],
    ['grand storm fire large', 12],
    ['grand storm fire ice', 11],
    ['grand blast pair', 10],
    ['grand blast large', 9],
    ['grand blast fire large', 11],
    ['grand meteor large', 14],
    ['grand meteor pair', 24],
    ['grand blackhole large', 25],
    ['grand shield fire pair', 14],
    ['grand shield fire large', 9],
    ['grand shield large pair', 16],
    ['grand shield brace pair', 14],
    ['grand shield heal', 9],
    ['grand veil large', 12],
    ['grand veil pair', 20],
    ['grand heal pair', 14],
    ['grand heal self pair', 14],
  ];
  for (const [phrase, cost] of grandPhrases) {
    const parsed = parseSpell(phrase.split(' '));
    assert.equal(parsed.ok, true, phrase);
    assert.equal(parsed.cost, cost, phrase);
    assert.equal(catalog.has(phrase), true, `catalog missing: ${phrase}`);
  }
  assert.equal(parseSpell(['grand', 'death']).ok, false);
  assert.equal(parseSpell(['grand', 'blast']).ok, false);

  // Verify grand shield heal grants 12-HP shield, immediate heal 6, and next-turn heal 4 + shield renewal
  const state = battle(['striker']);
  state.player.maxMana = state.player.mana = 24;
  state.player.maxHp = 50;
  state.player.hp = 20;
  const gsh = cast(state, 'grand shield heal');
  assert.equal(gsh.state.player.shield.layers[0], 12);
  assert.equal(gsh.summary.healed, 10);
  assert.equal(gsh.state.player.hp, 30);

  // Verify grand shot blast large deals scaled projectile (18) + shell blast (11) + grand neighbor splash (9+11 = 20)
  const atkState = battle(['rune_ram', 'rune_ram', 'rune_ram']);
  atkState.player.maxMana = atkState.player.mana = 24;
  for (const enemy of atkState.enemies) { enemy.armor = 0; enemy.hp = 60; }
  const gsbl = cast(atkState, 'grand shot blast large', 'enemy-1');
  assert.deepEqual(Object.values(gsbl.summary.enemyHp), [40, 31, 40]);

  // Verify grand meteor pair drops 6 boosted seeded-random meteors (36 center / 18 splash each)
  for (const enemy of atkState.enemies) { enemy.maxHp = enemy.hp = 300; }
  const gmp = cast(atkState, 'grand meteor pair', 'enemy-0', 'enemy-2');
  assert.equal(gmp.events.filter(ev => ev.type === 'blast').length, 6);
  const gmpDamages = gmp.events.filter(ev => ev.type === 'damage').map(ev => ev.amount);
  assert.ok(gmpDamages.length >= 12);
  for (const dmg of gmpDamages) assert.ok(dmg === 36 || dmg === 18, `unexpected grand meteor dmg ${dmg}`);
});

test('earth, water, wind Tier-1 and pathaphi, wari, vayu Tier-2 elements balance, combine, react, persist, and render cleanly', () => {
  const catalog = getSpellCatalog();
  const storage = new MemoryStorage();

  // Balance & family parity: Tier-1 = 2 MP, Tier-2 = 5 MP, Tier-3 = 7 MP
  for (const [t1, t2, dmg1, dmg2] of [['earth', 'pathaphi', 7, 14], ['water', 'wari', 6, 12], ['wind', 'vayu', 7, 14]]) {
    assert.equal(WORDS[t1].cost, 2);
    assert.equal(WORDS[t1].damage, dmg1);
    assert.equal(WORDS[t2].cost, 5);
    assert.equal(WORDS[t2].damage, dmg2);
    assert.equal(WORDS[t2].rarity, 'special');
    assert.equal(SECOND_TIER_ELEMENTS[t2], t1);
    assert.equal(elementFamily(t2), t1);
    assert.equal(cardMeta(t1).roleClass, 'role-element');
    assert.equal(cardMeta(t2).roleClass, 'role-element');
    assert.equal(catalog.has(`shot ${t1}`), true);
    assert.equal(catalog.has(`shot ${t2}`), true);
    assert.equal(catalog.has(`shield ${t1}`), true);
    assert.equal(catalog.has(`shield ${t2}`), true);
    assert.equal(catalog.has(`storm ${t1}`), true);
    assert.equal(catalog.has(`grand shot ${t2}`), true);
  }

  // Early reward pool includes Tier-1 earth/water/wind, while Tier-2 pathaphi/wari/vayu gate at Floor 30+
  const earlyRun = createRun('elem-pool', false);
  earlyRun.room = 1;
  const earlyPool = getRewardPool(earlyRun);
  for (const id of ['earth', 'water', 'wind']) assert.equal(earlyPool.includes(id), true);
  for (const id of ['pathaphi', 'wari', 'vayu']) assert.equal(earlyPool.includes(id), false);
  const lateRun = createRun('elem-pool-late', false);
  lateRun.room = FLOOR30_BOSS_ROOM;
  const latePool = getRewardPool(lateRun);
  for (const id of ['pathaphi', 'wari', 'vayu']) assert.equal(latePool.includes(id), true);

  // Earth: 7 dmg - armor(2) = 5 dmg, grants +2 block (reduces sentinel attack 7 -> 5), permanently shreds 1 armor & persists in save
  const earthState = battle(['sentinel']); // neutral, constant armor 2, attacks on turn 2 for 7
  earthState.turn = 2;
  earthState.player.maxHp = earthState.player.hp = 50;
  earthState.collection.push('earth', 'pathaphi');
  earthState.learned.push('earth', 'pathaphi');
  earthState.player.words = [...START_WORDS, 'earth', 'pathaphi'];
  earthState.player.hand = ['shot', 'earth', 'pathaphi'];
  const earthHit = cast(earthState, 'shot earth');
  assert.equal(earthHit.summary.damage, 5);
  assert.equal(earthHit.summary.blocked, 2);
  assert.equal(earthHit.summary.incoming, 5);
  assert.equal(earthHit.state.enemies[0].armor, 1);
  assert.equal(saveRun(earthHit.state, storage).ok, true);
  const loadedEarth = loadRun(storage).state;
  assert.equal(loadedEarth.enemies[0].armor, 1);
  // Permanent armor destruction persists across turns
  const afterTurn2 = cast(loadedEarth, 'guard');
  assert.equal(afterTurn2.state.enemies[0].armor, 1);

  // Pathaphi: 14 dmg - armor(2) = 12 dmg, grants +4 block (reduces rune_ram 6 -> 2), shreds 2 armor (2 -> 0)
  const pathaHit = cast(earthState, 'shot pathaphi');
  assert.equal(pathaHit.summary.damage, 12);
  assert.equal(pathaHit.summary.blocked, 4);
  assert.equal(pathaHit.summary.incoming, 3);
  assert.equal(pathaHit.state.enemies[0].armor, 0);

  // Shield Earth & Shield Pathaphi counter-shred attacker armor and deal earth damage
  const earthShield = cast(neutralArmored(1), 'shield earth');
  assert.equal(earthShield.summary.damage, 2); // armor drops 2->1 first, then 3 tremor - 1 armor = 2
  assert.equal(earthShield.state.enemies[0].armor, 1);
  const pathaShield = cast(neutralArmored(1), 'shield pathaphi');
  assert.equal(pathaShield.summary.damage, 5); // armor drops 2->0 first, then 5 quake - 0 armor = 5
  assert.equal(pathaShield.state.enemies[0].armor, 0);

  // Water conductivity with Lightning & Hail freeze, plus player +2 HP recovery
  const wetComboState = battle(['striker', 'striker']); // hp 16, armor 0
  wetComboState.player.maxHp = 50;
  wetComboState.player.hp = 40;
  const waterFirst = cast(wetComboState, 'shot water', 'enemy-0');
  assert.equal(waterFirst.summary.damage, 6);
  assert.equal(waterFirst.state.enemies[0].wetUntil, 2);
  assert.equal(waterFirst.summary.healed, 2);
  assert.equal(waterFirst.state.player.hp, 36); // 40 + 2 healed - 6 striker attack = 36
  waterFirst.state.player.mana = 12;
  const lightningFollow = cast(waterFirst.state, 'shot lightning', 'enemy-0');
  // 8 base + 2 wet conductivity = 10 dmg on wet target (exceeds 16 - 6 = 10, so kills enemy-0!)
  assert.equal(lightningFollow.events.find(ev => ev.type === 'damage').amount, 10);
  assert.equal(lightningFollow.summary.enemyHp['enemy-0'], 0);

  // Dual fusion: shot water pair lightning => avg(6, 8)=7 + 2 conductivity = 9 dmg, wets target
  const fusedShock = cast(neutralArmored(1), 'shot water pair lightning');
  assert.equal(fusedShock.summary.cost, 5);
  assert.equal(fusedShock.summary.damage, 9);
  assert.equal(fusedShock.state.enemies[0].wetUntil, 2);

  // Water -> Hail freezes cleanly (use void_imp so target survives hail impact and has normal attack intent)
  const hailState = battle(['void_imp']);
  hailState.player.maxMana = 20;
  hailState.player.mana = 20;
  const wetTarget = cast(hailState, 'shot water', 'enemy-0');
  wetTarget.state.player.mana = 20;
  const wetHail = cast(wetTarget.state, 'shot hail', 'enemy-0');
  assert.equal(wetHail.summary.enemyActions['enemy-0'].type, 'frozen');

  // Wari: 12 dmg, heals 4 HP, chill +2 (reduces striker 3 -> 1), wets main target AND adjacent enemy
  const wariState = battle(['striker', 'striker', 'striker']);
  wariState.player.hp = 30;
  const wariRes = cast(wariState, 'shot wari', 'enemy-1');
  assert.equal(wariRes.summary.damage, 12);
  assert.equal(wariRes.summary.healed, 4);
  assert.equal(wariRes.state.enemies[0].wetUntil, 2);
  assert.equal(wariRes.state.enemies[1].wetUntil, 2);
  assert.equal(wariRes.state.enemies[2].wetUntil, 2);
  assert.equal(wariRes.state.enemies[1].chill, 0); // spent on striker turn 1 attack (3 - 2 = 1)
  assert.equal(wariRes.events.find(ev => ev.type === 'attack' && ev.source === 'enemy-1').rawAttack, 1);

  // Wind & Vayu push behavior (Tier-2 deals 2x Tier-1 damage)
  const windHit = cast(neutralArmored(1), 'shot wind');
  assert.equal(windHit.summary.damage, 5); // 7 - 2 armor
  assert.equal(windHit.state.enemies[0].slot, 1);
  const vayuHit = cast(neutralArmored(1), 'shot vayu');
  assert.equal(vayuHit.summary.damage, 12); // 14 - 2 armor
  assert.equal(vayuHit.state.enemies[0].slot, 1);
  assert.equal(cast(neutralArmored(1), 'shield wind').state.enemies[0].slot, 1);

  // Audio playback & formula descriptions cover all ELEMENTS without throwing
  const audio = new GameAudio({ music: 0, sfx: 0, ui: 0 });
  for (const id of ELEMENTS) {
    assert.doesNotThrow(() => audio.combat({ type: 'projectile', form: 'shot', elements: [id], element: id, size: 1, blocked: false }));
    const atkDesc = describeFormulaEffect({ phrase: ['shot', id], spell: parseSpell(['shot', id]).spell });
    const shdDesc = describeFormulaEffect({ phrase: ['shield', id], spell: parseSpell(['shield', id]).spell });
    assert.ok(atkDesc.length > 0, id);
    assert.ok(shdDesc.length > 0, id);
  }
  for (const sfx of ['place', 'remove', 'cast', 'discover', 'ward', 'hit', 'weakness', 'resisted', 'wall-slam', 'win', 'lose', 'invalid']) {
    assert.doesNotThrow(() => audio.play(sfx));
  }
  for (const combatEv of [
    { type: 'damage', amount: 10, weakness: true },
    { type: 'damage', amount: 8, resisted: true },
    { type: 'damage', amount: 15, killed: true },
    { type: 'blast', devastation: true },
    { type: 'wall-slam' },
    { type: 'chain-lightning' },
    { type: 'magma-puddle' },
    { type: 'magma-erupt' },
    { type: 'attack', specialBoss: true, ultimate: true, sourceKind: 'tempest_archon' },
  ]) {
    assert.doesNotThrow(() => audio.combat(combatEv));
  }
});

test('Tier 1-3 rarities and all 15 Tier 3 dual-element fusions work with distinct combat effects', () => {
  assert.equal(RARITIES.common, 'ธรรมดา');
  assert.equal(RARITIES.special, 'พิเศษ');
  assert.equal(RARITIES.epic, 'มหากาพย์');

  // Hail rename check
  assert.equal(WORDS.hail.label, 'หิมะ');

  // Tier 1 cards = ธรรมดา (common)
  const tier1 = ['fire', 'ice', 'lightning', 'earth', 'water', 'wind'];
  for (const id of tier1) {
    const r = WORDS[id].rarity ?? 'common';
    assert.equal(r, 'common', `${id} should be common`);
    assert.equal(RARITIES[r], 'ธรรมดา');
  }

  // Tier 2 cards = พิเศษ (special)
  const tier2 = ['akki', 'heman', 'asani', 'pathaphi', 'wari', 'vayu'];
  for (const id of tier2) {
    assert.equal(WORDS[id].rarity, 'special', `${id} should be special`);
    assert.equal(RARITIES[WORDS[id].rarity], 'พิเศษ');
  }

  // Tier 3 cards = 15 dual-element fusions, all มหากาพย์ (epic)
  assert.equal(Object.keys(FUSED_ELEMENTS).length, 15);
  for (const id of Object.keys(FUSED_ELEMENTS)) {
    assert.equal(WORDS[id].rarity, 'epic', `${id} should be epic`);
    assert.equal(RARITIES[WORDS[id].rarity], 'มหากาพย์');
    assert.equal(WORDS[id].cost, 7, `${id} should cost 7`);
  }

  // 1. Mudmire (บึงโคลน): Power 18, wets target, chill 3
  const mudRes = cast(neutralArmored(1), 'shot mudmire');
  assert.equal(mudRes.state.enemies[0].wetUntil, 2);
  assert.equal(mudRes.summary.damage, 16);
  assert.equal(mudRes.events.find(ev => ev.type === 'attack').rawAttack, 3); // 6 attack - 3 chill = 3

  // 2. Dust (ธุลี): Power 18, shreds 1 armor, pushes (wall slam 6)
  const dustRes = cast(neutralArmored(1), 'shot dust');
  assert.equal(dustRes.summary.damage, 16); // 18 - 2 armor = 16
  assert.equal(dustRes.state.enemies[0].armor, 1); // 2 - 1 = 1 armor left
  assert.equal(dustRes.state.enemies[0].permanentArmorShred, 1);

  // 3. Permafrost (เยือกศิลา): Power 18, shreds 2 armor, gives player +6 shield
  const permaRes = cast(battle(['rune_ram']), 'shot permafrost');
  assert.equal(permaRes.state.enemies[0].armor, 0);
  assert.equal(permaRes.state.enemies[0].permanentArmorShred, 2);
  assert.equal(permaRes.events.find(ev => ev.type === 'shield' && ev.element === 'permafrost').amount, 6);
  assert.equal(permaRes.summary.blocked, 6);

  // 4. Monsoon (มรสุม): Power 18, pushes all enemies, wets all, heals player +4
  const monState = battle(['striker', 'striker']);
  for (const e of monState.enemies) e.hp = 50;
  monState.player.hp = 30;
  const monRes = cast(monState, 'shot monsoon', 'enemy-0');
  assert.equal(monRes.summary.healed, 4);
  assert.equal(monRes.state.enemies[0].wetUntil, 2);
  assert.equal(monRes.state.enemies[1].wetUntil, 2);

  // 5. Shockstream (กระแสช็อต): 18 dmg + 2 pierce, shocks all other wet enemies for 10 pierce dmg
  const shockState = battle(['striker', 'striker']);
  for (const e of shockState.enemies) e.hp = 50;
  shockState.enemies[1].wetUntil = 2; // enemy-1 is wet
  const shockRes = cast(shockState, 'shot shockstream', 'enemy-0');
  assert.equal(shockRes.summary.damage, 28); // 18 main + 10 wet shock on enemy-1

  // 6. Heatwave (ระอุ): 22 dmg, push 1, burns target 4 and adjacent 4. Pushing into another enemy deals 6 collision dmg to BOTH enemies
  const heatState = battle(['striker', 'striker']);
  for (const e of heatState.enemies) e.hp = 50;
  const heatRes = cast(heatState, 'shot heatwave', 'enemy-0');
  assert.equal(heatRes.summary.damage, 34); // 22 hit + 6 collision on enemy-0 + 6 collision on enemy-1
  assert.equal(heatRes.summary.enemyHp['enemy-0'], 50 - 22 - 6);
  assert.equal(heatRes.summary.enemyHp['enemy-1'], 50 - 6);
  assert.equal(heatRes.state.enemies[0].burn, 4);
  assert.equal(heatRes.state.enemies[1].burn, 4);

  // 7. Plasma (พลาสมา): 24 dmg + 2 pierce
  const plasRes = cast(battle(['rune_ram']), 'shot plasma');
  assert.equal(plasRes.summary.damage, 24); // 24 dmg, ignores 2 armor with pierce 2

  // 8. Scald (ไอเดือด): 20 dmg, shreds 2 armor
  const scaldRes = cast(battle(['rune_ram']), 'shot scald');
  assert.equal(scaldRes.state.enemies[0].armor, 0);
  assert.equal(scaldRes.state.enemies[0].permanentArmorShred, 2);

  // 9. Frostvolt (ผลึกช็อต): 20 dmg + 2 pierce, chains to neighbor with chill 4
  const voltState = battle(['striker', 'striker']);
  for (const e of voltState.enemies) e.hp = 50;
  const voltRes = cast(voltState, 'shot frostvolt', 'enemy-0');
  assert.equal(voltRes.summary.damage, 30); // 20 main + 10 chain
  assert.equal(voltRes.events.find(ev => ev.type === 'attack' && ev.source === 'enemy-1').rawAttack, 0); // 3 attack - 4 chill = 0

  // 10. Magnet (แม่เหล็ก): pulls neighbors towards target
  const magState = battle(['striker', 'striker', 'striker']);
  for (const e of magState.enemies) e.hp = 50;
  magState.enemies[0].slot = 0;
  magState.enemies[1].slot = 2;
  magState.enemies[2].slot = 4;
  const magRes = cast(magState, 'shot magnet', 'enemy-1');
  assert.equal(magRes.state.enemies[0].slot, 1); // pulled from 0 towards 2 -> 1
  assert.equal(magRes.state.enemies[2].slot, 3); // pulled from 4 towards 2 -> 3
});

test('elemental weakness and resistance system applies +25% weakness bonus and -20% resistance across all elements and fusions', () => {
  // 1. Weakness cycle mapping
  assert.equal(ELEMENT_VULNERABILITY.ice, 'fire');
  assert.equal(ELEMENT_VULNERABILITY.wind, 'ice');
  assert.equal(ELEMENT_VULNERABILITY.earth, 'wind');
  assert.equal(ELEMENT_VULNERABILITY.lightning, 'earth');
  assert.equal(ELEMENT_VULNERABILITY.water, 'lightning');
  assert.equal(ELEMENT_VULNERABILITY.fire, 'water');

  // 2. Component extraction for Tier 1, 2, and 3
  assert.deepEqual(getElementComponents('fire'), ['fire']);
  assert.deepEqual(getElementComponents('akki'), ['fire']);
  assert.deepEqual(getElementComponents('magma'), ['earth', 'fire']);
  assert.deepEqual(getElementComponents(['water', 'fire']), ['water', 'fire']);

  // 3. Weakness reactions
  assert.equal(getWeaknessReaction('fire', 'ice').isWeak, true);
  assert.equal(getWeaknessReaction('fire', 'ice').multiplier, 1.25);
  assert.equal(getWeaknessReaction('ice', 'ice').isResist, true);
  assert.equal(getWeaknessReaction('ice', 'ice').multiplier, 0.8);
  assert.equal(getWeaknessReaction('wind', 'ice').isWeak, false);
  assert.equal(getWeaknessReaction('wind', 'ice').isResist, false);

  // 4. Combat damage on elemental enemies
  // frost_lich (hp 64, armor 2, affinity: ice)
  const iceFight = battle(['frost_lich']);
  iceFight.enemies[0].ward = 0; // Clear ward for unblocked damage test
  const fireCast = cast(iceFight, 'shot fire'); // 10 power - 2 armor = 8 base -> +25% = 10 dmg
  const fireDmgEvent = fireCast.events.find(e => e.type === 'damage');
  assert.equal(fireDmgEvent.weakness, true);
  assert.equal(fireDmgEvent.weakBonus, 2);
  assert.equal(fireDmgEvent.amount, 10);
  assert.ok(fireCast.summary.sequence.some(s => s.includes('⚡ โจมตีเข้าจุดอ่อน!')));

  // Resisted attack: ice vs ice
  const iceCast = cast(iceFight, 'shot ice'); // 6 power - 2 armor = 4 base -> -20% = 3 dmg
  const iceDmgEvent = iceCast.events.find(e => e.type === 'damage');
  assert.equal(iceDmgEvent.resisted, true);
  assert.equal(iceDmgEvent.resistLoss, 1);
  assert.equal(iceDmgEvent.amount, 3);
  assert.ok(iceCast.summary.sequence.some(s => s.includes('🛡 ลิชเหมันต์ ต้านทาน')));

  // 5. Tier 2 ascended elements
  // akki (fire) vs frost_lich (ice): 20 power - 2 armor = 18 base -> +25% = 23 dmg
  const akkiCast = cast(iceFight, 'shot akki');
  assert.equal(akkiCast.events.find(e => e.type === 'damage').amount, 23);

  // 6. Tier 3 dual-element fusions trigger weakness if EITHER element counters the affinity
  // magma (earth + fire) vs frost_lich (ice) -> fire counters ice!
  // 22 power - 2 armor = 20 base -> +25% = 25 dmg
  const magmaVsIce = cast(iceFight, 'shot magma');
  assert.equal(magmaVsIce.events.find(e => e.type === 'damage').amount, 25);
  assert.equal(magmaVsIce.events.find(e => e.type === 'damage').weakness, true);

  // magma (earth + fire) vs storm_titan (lightning) -> earth counters lightning!
  // storm_titan (hp 76, armor 3, affinity: lightning)
  // 22 power - 3 armor = 19 base -> +25% = 24 dmg
  const stormFight = battle(['storm_titan']);
  const magmaVsLightning = cast(stormFight, 'shot magma');
  assert.equal(magmaVsLightning.events.find(e => e.type === 'damage').amount, 24);
  assert.equal(magmaVsLightning.events.find(e => e.type === 'damage').weakness, true);

  // monsoon (water + wind) vs ember_imp (fire) -> water counters fire!
  // ember_imp (hp 22, armor 0, affinity: fire)
  // 18 power - 0 armor = 18 base -> +25% = 23 dmg (kills imp)
  const impFight = battle(['ember_imp']);
  const monsoonVsFire = cast(impFight, 'shot monsoon');
  assert.equal(monsoonVsFire.events.find(e => e.type === 'damage').amount, 23);
  assert.equal(monsoonVsFire.events.find(e => e.type === 'damage').weakness, true);

  // 7. Forecast parity: simulateTurn preview gives exact same result as actual combat
  const forecastState = structuredClone(iceFight);
  forecastState.player.hand = ['shot', 'fire'];
  const preview = simulateTurn(forecastState, ['shot', 'fire'], 'enemy-0');
  assert.equal(preview.ok, true);
  assert.equal(preview.summary.damage, 10);
  assert.equal(preview.summary.enemyHp['enemy-0'], 64 - 10);
});

test('each affinity has a second weakness and fused weakness takes precedence over resistance', () => {
  for (const [affinity, weakness] of Object.entries({ fire: 'ice', ice: 'earth', wind: 'lightning', earth: 'water', lightning: 'water', water: 'ice' })) {
    const reaction = getWeaknessReaction(weakness, affinity);
    assert.equal(reaction.isWeak, true, `${weakness} should counter ${affinity}`);
    assert.equal(reaction.multiplier, 1.25);
    assert.equal(reaction.triggerElement, weakness);
  }
  const mixed = getWeaknessReaction('permafrost', 'ice');
  assert.equal(mixed.isWeak, true);
  assert.equal(mixed.isResist, false);
  assert.equal(mixed.multiplier, 1.25);
});

test('worldloom_50 rift shield survives save validation and ember_core_10 boosts hybrid fire', () => {
  const state = battle(['loom_sovereign']);
  state.room = FLOOR50_BOSS_ROOM;
  state.rooms[FLOOR50_BOSS_ROOM] = ['loom_sovereign'];
  state.collection = ['veil', 'grand', 'magma'];
  state.learned = ['veil', 'grand', 'magma'];
  state.player.words = [...START_WORDS, 'veil', 'grand'];
  state.player.maxHp = state.player.hp = 400;
  state.player.maxMana = state.player.mana = 60;
  state.player.cardUpgrades = { veil: 10, grand: 10 };
  state.player.relics = ['worldloom_50', 'ember_core_10'];
  state.player.equippedRelics = ['worldloom_50', 'ember_core_10'];
  state.player.hand = ['grand', 'veil'];
  const shielded = simulateTurn(state, ['grand', 'veil'], 'enemy-0');
  assert.equal(shielded.ok, true);
  assert.ok(shielded.state.player.shield.layers[0] > 57);
  const storage = new MemoryStorage();
  assert.equal(saveRun(shielded.state, storage).ok, true);
  assert.equal(loadRun(storage).state.player.shield.layers[0], shielded.state.player.shield.layers[0]);

  const hybridBase = neutralArmored(1);
  const noRelic = cast(hybridBase, 'shot magma').summary.damage;
  hybridBase.player.relics = ['ember_core_10'];
  hybridBase.player.equippedRelics = ['ember_core_10'];
  const withEmberCore = cast(hybridBase, 'shot magma').summary.damage;
  assert.equal(withEmberCore, noRelic + 2);
});

test('large pair rules across shot, beam, wave, storm, and blast parse cleanly, reject pair-before-large (คู่ ใหญ่), and match combat forecasts', () => {
  const catalog = getSpellCatalog();
  const cases = [
    ['shot fire large pair', 10],
    ['beam fire large pair', 12],
    ['wave fire large pair', 14],
    ['storm fire large pair', 12],
    ['blast pair', 7],
    ['blast pair fire', 9],
    ['blast fire pair', 9],
    ['blast fire large pair', 11],
    ['blast large pair', 9],
    ['blast large fire pair', 11],
    ['blast large pair fire', 11],
    ['heal large pair', 10],
    ['heal self large pair', 10],
    ['veil large pair', 18],
    ['meteor large pair', 22],
  ];
  for (const [phrase, cost] of cases) {
    const parsed = parseSpell(phrase.split(' '));
    assert.equal(parsed.ok, true, phrase);
    assert.equal(parsed.cost, cost, phrase);
    assert.equal(parsed.spell.large, phrase.includes('large') ? true : undefined, phrase);
    assert.equal(catalog.has(phrase), true, `catalog missing: ${phrase}`);
  }

  const rejectedPairLarge = [
    'shot fire pair large',
    'beam fire pair large',
    'wave fire pair large',
    'storm fire pair large',
    'blast pair large',
    'blast pair large fire',
    'blast pair fire large',
    'blast fire pair large',
    'blast shot pair large',
    'shot blast pair large',
    'heal pair large',
    'heal self pair large',
    'veil pair large',
    'meteor pair large',
  ];
  for (const phrase of rejectedPairLarge) {
    assert.equal(parseSpell(phrase.split(' ')).ok, false, `should reject คู่ ใหญ่: ${phrase}`);
    assert.equal(catalog.has(phrase), false, `catalog should exclude คู่ ใหญ่: ${phrase}`);
  }

  assert.deepEqual(parseSpell(['blast', 'fire', 'pair']).spell, parseSpell(['blast', 'pair', 'fire']).spell);
  assert.deepEqual(parseSpell(['blast', 'fire', 'large', 'pair']).spell, parseSpell(['blast', 'large', 'pair', 'fire']).spell);

  assert.equal(parseSpell(['storm', 'fire', 'pair', 'blast']).ok, false);
  assert.equal(parseSpell(['beam', 'fire', 'large', 'blast']).ok, false);

  const state = battle(['rune_ram', 'rune_ram', 'rune_ram']);
  state.player.maxMana = state.player.mana = 24;
  state.player.maxHp = state.player.hp = 120;
  for (const enemy of state.enemies) { enemy.armor = 0; enemy.hp = 60; }
  const hp = result => Object.values(result.summary.enemyHp);

  state.enemies[0].ward = 1;
  state.enemies[2].ward = 1;
  const beamLp = cast(state, 'beam fire large pair', 'enemy-0', 'enemy-2');
  assert.deepEqual(hp(beamLp), [45, 60, 45]);
  state.enemies[0].ward = 0;
  state.enemies[2].ward = 0;

  const waveLp = cast(state, 'wave fire large pair', 'enemy-1');
  assert.deepEqual(hp(waveLp), [42, 42, 42]);

  const stormLp = cast(state, 'storm fire large pair', 'enemy-1');
  assert.deepEqual(hp(stormLp), [41, 23, 41]);

  const blastPairFire = cast(state, 'blast pair fire', 'enemy-1');
  assert.deepEqual(hp(blastPairFire), [50, 40, 50]);
  const blastLargePairFire = cast(state, 'blast large pair fire', 'enemy-1');
  assert.deepEqual(hp(blastLargePairFire), [44, 30, 44]);
});

test('blast shot variants (ระเบิด ลูก / ระเบิด ลูก ธาตุ / ระเบิด ลูก ธาตุ คู่) parse, register in catalog, and differ by word order', () => {
  const catalog = getSpellCatalog();
  const cases = [
    ['blast shot', 5],
    ['blast shot pair', 10],
    ['blast shot large', 7],
    ['blast shot large pair', 14],
    ['blast shot fire', 7],
    ['blast shot fire pair', 14],
    ['blast shot pair fire', 14],
    ['blast shot fire large', 9],
    ['blast shot large fire', 9],
    ['blast shot fire ice', 8],
    ['blast shot fire burn', 8],
    ['blast shot ice freeze', 10],
    ['blast shot fire dispel', 9],
    ['blast shot fire devastation', 12],
    ['grand blast shot', 8],
    ['grand blast shot fire', 10],
    ['grand blast shot pair', 16],
    ['grand blast shot large', 10],
  ];
  for (const [phrase, cost] of cases) {
    const parsed = parseSpell(phrase.split(' '));
    assert.equal(parsed.ok, true, phrase);
    assert.equal(parsed.cost, cost, phrase);
    assert.equal(catalog.has(phrase), true, `catalog missing: ${phrase}`);
    assert.ok(describeFormulaEffect({ phrase: parsed.ids, spell: parsed.spell }).length > 0, phrase);
  }
  assert.equal(parseSpell(['blast', 'shot', 'pair', 'large']).ok, false);
  assert.equal(parseSpell(['blast', 'shot', 'fire', 'fire']).ok, false);

  const state = battle(['rune_ram', 'rune_ram', 'rune_ram']);
  state.player.maxMana = state.player.mana = 24;
  state.player.maxHp = state.player.hp = 120;
  for (const enemy of state.enemies) { enemy.armor = 0; enemy.hp = 60; }
  const hp = result => Object.values(result.summary.enemyHp);

  const bsf = cast(state, 'blast shot fire', 'enemy-1');
  assert.deepEqual(hp(bsf), [55, 44, 55]);

  state.enemies[1].ward = 1;
  const wardedBlastShot = cast(state, 'blast shot fire', 'enemy-1');
  const wardedShotBlast = cast(state, 'shot blast fire', 'enemy-1');
  assert.deepEqual(hp(wardedBlastShot), [55, 60, 55]);
  assert.equal(wardedBlastShot.summary.wards, 1);
  assert.deepEqual(hp(wardedShotBlast), [60, 60, 60]);
  assert.equal(wardedShotBlast.summary.wards, 1);

  const pairedDualTarget = cast(state, 'blast shot fire pair', 'enemy-0', 'enemy-2');
  assert.deepEqual(hp(pairedDualTarget), [44, 60, 44]);
  state.enemies[1].ward = 0;

  const previewState = structuredClone(state);
  previewState.player.hand = ['blast', 'shot', 'fire', 'pair'];
  const preview = simulateTurn(previewState, ['blast', 'shot', 'fire', 'pair'], 'enemy-0', 'enemy-2');
  assert.equal(preview.ok, true);
  assert.deepEqual(hp(preview), [44, 50, 44]);
});

test('chakram epic form deals heavy pure single-target damage without splash unless modified', () => {
  const catalog = getSpellCatalog();
  assert.equal(WORDS.chakram.rarity, 'epic');
  assert.equal(cardMeta('chakram').roleClass, 'role-form');
  for (const [phrase, cost] of [
    ['chakram fire', 5],
    ['chakram fire pair', 10],
    ['chakram fire large', 7],
    ['chakram fire pierce', 6],
    ['chakram fire blast', 7],
    ['grand chakram fire', 8],
    ['grand chakram fire pair', 16],
    ['chakram fire devastation', 10],
  ]) {
    const parsed = parseSpell(phrase.split(' '));
    assert.equal(parsed.ok, true, phrase);
    assert.equal(parsed.cost, cost, phrase);
    assert.equal(catalog.has(phrase), true, `catalog missing: ${phrase}`);
    assert.ok(describeFormulaEffect({ phrase: parsed.ids, spell: parsed.spell }).length > 0, phrase);
  }

  const state = battle(['rune_ram', 'rune_ram', 'rune_ram']);
  state.player.maxMana = state.player.mana = 24;
  state.player.maxHp = state.player.hp = 100;
  for (const enemy of state.enemies) { enemy.armor = 0; enemy.maxHp = enemy.hp = 100; }

  const shotFire = cast(state, 'shot fire', 'enemy-1');
  const chakramFire = cast(state, 'chakram fire', 'enemy-1');
  assert.ok(chakramFire.summary.damage > shotFire.summary.damage);
  assert.deepEqual(Object.values(chakramFire.summary.enemyHp), [100, 82, 100]);

  // grand chakram fire scales x1.5 purely on single target with ZERO splash to neighbors
  const grandChakram = cast(state, 'grand chakram fire', 'enemy-1');
  assert.deepEqual(Object.values(grandChakram.summary.enemyHp), [100, 73, 100]);

  // Adding blast modifier explicitly allows splash damage
  const blastChakram = cast(state, 'chakram fire blast', 'enemy-1');
  assert.ok(blastChakram.summary.enemyHp['enemy-0'] < 100);
  assert.ok(blastChakram.summary.enemyHp['enemy-2'] < 100);
});

test('barrage legendary suffix only works at end of attack spells and fires 5 times', () => {
  const catalog = getSpellCatalog();
  assert.equal(WORDS.barrage.rarity, 'legendary');
  assert.equal(cardMeta('barrage').roleClass, 'role-mod');

  // Strict suffix-only & incompatibility checks
  assert.equal(parseSpell(['barrage', 'shot', 'fire']).ok, false);
  assert.equal(parseSpell(['shot', 'barrage', 'fire']).ok, false);
  assert.equal(parseSpell(['shot', 'fire', 'barrage', 'large']).ok, false);
  assert.equal(parseSpell(['shot', 'fire', 'pair', 'barrage']).ok, false);
  assert.equal(parseSpell(['shot', 'fire', 'devastation', 'barrage']).ok, false);
  assert.equal(parseSpell(['shield', 'fire', 'barrage']).ok, false);
  assert.equal(parseSpell(['heal', 'barrage']).ok, false);
  assert.equal(parseSpell(['blackhole', 'barrage']).ok, false);
  assert.equal(parseSpell(['death', 'barrage']).ok, false);

  // Valid barrage attack formulas
  for (const [phrase, cost] of [
    ['shot fire barrage', 11],
    ['grand shot fire barrage', 21],
    ['chakram fire barrage', 18],
    ['grand chakram fire barrage', 28],
    ['beam fire barrage', 14],
    ['wave fire barrage', 18],
    ['storm fire barrage', 25],
    ['blast fire barrage', 21],
    ['meteor barrage', 32],
  ]) {
    const parsed = parseSpell(phrase.split(' '));
    assert.equal(parsed.ok, true, phrase);
    assert.equal(parsed.cost, cost, phrase);
    assert.equal(parsed.spell.barrage, true, phrase);
    assert.equal(catalog.has(phrase), true, `catalog missing: ${phrase}`);
  }

  // Grand shot fire barrage fires 5 shots and auto-retargets when the first enemy dies mid-barrage
  const state = battle(['rune_ram', 'rune_ram', 'rune_ram']);
  state.player.maxMana = state.player.mana = 40;
  state.player.maxHp = state.player.hp = 120;
  for (const enemy of state.enemies) { enemy.armor = 0; enemy.maxHp = enemy.hp = 200; }
  const gsfb = cast(state, 'grand shot fire barrage', 'enemy-1');
  assert.equal(gsfb.events.filter(ev => ev.type === 'projectile').length, 5);
  assert.equal(gsfb.summary.enemyHp['enemy-1'], 200 - 5 * 15);

  // Auto-retarget check when target dies on shot 2
  const fragState = structuredClone(state);
  fragState.enemies[1].hp = 20;
  const retargetRes = cast(fragState, 'grand shot fire barrage', 'enemy-1');
  assert.equal(retargetRes.summary.enemyHp['enemy-1'], 0);
  assert.ok(retargetRes.summary.enemyHp['enemy-0'] < 200 || retargetRes.summary.enemyHp['enemy-2'] < 200);
  assert.equal(retargetRes.events.filter(ev => ev.type === 'projectile').length, 5);

  // Chakram barrage hits 5x purely single-target
  const chBarrage = cast(state, 'chakram fire barrage', 'enemy-1');
  assert.equal(chBarrage.events.filter(ev => ev.type === 'projectile').length, 5);
  assert.deepEqual(Object.values(chBarrage.summary.enemyHp), [200, 200 - 5 * 18, 200]);

  // Meteor barrage drops 15 seeded-random meteors
  for (const enemy of state.enemies) { enemy.maxHp = enemy.hp = 500; }
  const metBarrage = cast(state, 'meteor barrage', 'enemy-1');
  assert.equal(metBarrage.events.filter(ev => ev.type === 'blast').length, 15);

  // Wave barrage sweeps 5 times
  const waveBarrage = cast(state, 'wave fire barrage', 'enemy-1');
  assert.equal(waveBarrage.events.filter(ev => ev.type === 'projectile').length, 15);
});

test('push card rework: enemy-to-enemy collision damages both enemies (piercing armor), scales with multiplier, synergizes with wind for 2-slot push, and slams walls', () => {
  // 1. Armored enemy-0 (slot 0) pushed into armored enemy-1 (slot 1) -> BOTH take 8 armor-piercing collision damage
  const clash = battle(['rune_ram', 'rune_ram']);
  for (const e of clash.enemies) { e.armor = 4; e.maxHp = e.hp = 60; }
  const res = cast(clash, 'shot fire push', 'enemy-0');
  assert.equal(res.ok, true);
  assert.equal(res.state.enemies[0].slot, 0);
  assert.equal(res.state.enemies[1].slot, 1);
  // enemy-0: 10 - 4 armor = 6 fire hit + 8 true collision = 14 -> 46 HP
  // enemy-1: 8 true collision = 8 -> 52 HP
  assert.equal(res.summary.enemyHp['enemy-0'], 46);
  assert.equal(res.summary.enemyHp['enemy-1'], 52);
  const slamEvents = res.events.filter(ev => ev.type === 'wall-slam' && ev.collision);
  assert.equal(slamEvents.length, 2);
  assert.deepEqual(slamEvents.map(ev => ev.target), ['enemy-0', 'enemy-1']);

  // 2. Multiplier scaling: storm fire push (1.5x) deals 12 true collision dmg to BOTH enemies
  const stormClash = battle(['rune_ram', 'rune_ram']);
  for (const e of stormClash.enemies) { e.armor = 4; e.maxHp = e.hp = 80; }
  const stormRes = cast(stormClash, 'storm fire push', 'enemy-0');
  // enemy-0: (10*1.5 - 4 = 11) + 12 collision = 23 -> 57 HP
  // enemy-1: (10*1.5*0.5 = 8 - 4 = 4) + 12 collision = 16 -> 64 HP
  assert.equal(stormRes.summary.enemyHp['enemy-0'], 57);
  assert.equal(stormRes.summary.enemyHp['enemy-1'], 64);

  // 3. Wind + Push synergy: pushes 2 slots! Slides from slot 0 -> slot 1, then crashes into slot 2 (damaging both!)
  const windSynergy = battle(['striker', 'striker']);
  windSynergy.enemies[0].slot = 0;
  windSynergy.enemies[1].slot = 2;
  for (const e of windSynergy.enemies) { e.armor = 0; e.maxHp = e.hp = 60; }
  const windPushRes = cast(windSynergy, 'shot wind push', 'enemy-0');
  assert.equal(windPushRes.state.enemies[0].slot, 1, 'Wind + Push should slide enemy-0 into slot 1 before colliding with slot 2');
  assert.equal(windPushRes.state.enemies[1].slot, 2);
  assert.equal(windPushRes.summary.enemyHp['enemy-0'], 60 - 7 - 8);
  assert.equal(windPushRes.summary.enemyHp['enemy-1'], 60 - 8);

  // 4. Pushing against the back edge (slot 4) deals 4 armor-piercing wall slam damage
  const wall = battle(['rune_ram']);
  wall.enemies[0].slot = 4;
  wall.enemies[0].armor = 4;
  wall.enemies[0].maxHp = wall.enemies[0].hp = 60;
  const wallRes = cast(wall, 'shot fire push', 'enemy-0');
  assert.equal(wallRes.summary.enemyHp['enemy-0'], 60 - 6 - 4);
  assert.ok(wallRes.events.some(ev => ev.type === 'wall-slam' && !ev.collision && ev.amount === 4));

  // 5. Magnet pulling an adjacent enemy directly into target deals 6 collision damage to BOTH
  const magClash = battle(['striker', 'striker']);
  magClash.enemies[0].slot = 1;
  magClash.enemies[1].slot = 2;
  for (const e of magClash.enemies) { e.maxHp = e.hp = 60; }
  const magRes = cast(magClash, 'shot magnet', 'enemy-1');
  // enemy-1: 18 magnet hit + 6 collision = 24 -> 36 HP; enemy-0: 6 collision -> 54 HP
  assert.equal(magRes.summary.enemyHp['enemy-1'], 36);
  assert.equal(magRes.summary.enemyHp['enemy-0'], 54);
});

test('Batch 1 Common cards: tailored main scaling and +7/+9/+10 secondary effects work in combat and match forecast', () => {
  // 1. shot +10: +3 pierce & +15% damage
  const shotState = battle(['armored']);
  shotState.enemies[0].hp = shotState.enemies[0].maxHp = 80;
  shotState.enemies[0].armor = 5;
  shotState.player.cardUpgrades = { shot: 10 };
  const shotRes = cast(shotState, 'shot fire');
  // (10 + 10) * 1.15 = 23 raw; armor 5 - 3 pierce = 2 -> 21 damage
  assert.equal(shotRes.summary.damage, 21);

  // 2. fire +10: inflicts +5 burn automatically
  const fireState = battle(['striker']);
  fireState.enemies[0].hp = fireState.enemies[0].maxHp = 80;
  fireState.player.cardUpgrades = { fire: 10 };
  const fireRes = cast(fireState, 'shot fire');
  assert.equal(fireRes.summary.enemyStatus['enemy-0'].burn, 5);

  // 3. ice +10: +3 main chill (floor(10/3)) + 6 secondary chill = 13 total chill, plus lastingChill (persists 4 after attack)
  const iceState = battle(['striker']);
  iceState.enemies[0].hp = iceState.enemies[0].maxHp = 80;
  iceState.player.cardUpgrades = { ice: 10 };
  const iceRes = cast(iceState, 'shot ice');
  assert.equal(iceRes.summary.enemyStatus['enemy-0'].chill, 13);
  assert.equal(iceRes.summary.enemyStatus['enemy-0'].lastingChill, true);
  assert.equal(iceRes.state.enemies[0].chill, 4);

  // 4. lightning +10: +4 secondary pierce (total 6) & refunds +1 MP when hitting wet target
  const boltState = battle(['armored']);
  boltState.enemies[0].hp = boltState.enemies[0].maxHp = 80;
  boltState.enemies[0].armor = 6;
  boltState.enemies[0].wetUntil = 5;
  boltState.player.cardUpgrades = { lightning: 10 };
  const boltRes = cast(boltState, 'shot lightning');
  // 8 base + 10 upg + 2 wet = 20 damage, armor 6 - (2+4) = 0 -> 20 dmg, and +1 MP refunded
  assert.equal(boltRes.summary.damage, 20);
  assert.equal(boltRes.summary.manaRefunded, 1);

  // 5. earth +10: +5 main block + 8 secondary block = 15 total earth block, and shreds 2 permanent armor
  const earthState = battle(['armored']);
  earthState.enemies[0].hp = earthState.enemies[0].maxHp = 80;
  earthState.player.cardUpgrades = { earth: 10 };
  const earthRes = cast(earthState, 'shot earth');
  assert.equal(earthRes.state.enemies[0].armor, 1);
  assert.equal(earthRes.summary.secondaryShield, 8);
  assert.equal(earthRes.summary.blocked, 3);
  assert.equal(earthRes.summary.incoming, 0);

  // 6. water +10: 2 + 5 main heal + 8 secondary heal = 15 HP healed, and splashes wet to adjacent enemies
  const waterState = battle(['striker', 'striker']);
  for (const e of waterState.enemies) { e.hp = e.maxHp = 80; }
  waterState.player.hp = 10;
  waterState.player.cardUpgrades = { water: 10 };
  const waterRes = cast(waterState, 'shot water', 'enemy-0');
  assert.equal(waterRes.summary.healed, 15);
  assert.ok(waterRes.state.enemies[0].wetUntil >= 2);
  assert.ok(waterRes.state.enemies[1].wetUntil >= 2);

  // 7. wind +10: pushes 2 slots and deals 3 + 5 (floor(10/2)) + 8 (secondary) = 16 collision damage to BOTH
  const windState = battle(['striker', 'striker']);
  windState.enemies[0].slot = 0;
  windState.enemies[1].slot = 2;
  for (const e of windState.enemies) { e.hp = e.maxHp = 80; }
  windState.player.cardUpgrades = { wind: 10 };
  const windRes = cast(windState, 'shot wind', 'enemy-0');
  assert.equal(windRes.state.enemies[0].slot, 1);
  // enemy-0: (7+10) + 16 collision = 33 -> 47 HP; enemy-1: 16 collision -> 64 HP
  assert.equal(windRes.summary.enemyHp['enemy-0'], 47);
  assert.equal(windRes.summary.enemyHp['enemy-1'], 64);

  // 8. pair +10: +20% attack damage & +1 MP refund
  const pairState = battle(['striker']);
  pairState.enemies[0].hp = pairState.enemies[0].maxHp = 100;
  pairState.player.cardUpgrades = { pair: 10 };
  const pairRes = cast(pairState, 'shot fire pair', 'enemy-0', 'enemy-0');
  // Each shot: (10 + 10 aux) * 1.2 = 24 -> 48 total; +1 MP refund
  assert.equal(pairRes.summary.damage, 48);
  assert.equal(pairRes.summary.manaRefunded, 1);

  // 9. shield +10: heals 8 + ceil(5% MaxHP) and renews +4 HP on intact shield layer at end of turn
  const shieldState = battle(['void_imp']);
  shieldState.player.maxHp = 40;
  shieldState.player.hp = 20;
  shieldState.player.cardUpgrades = { shield: 10 };
  const shieldRes = cast(shieldState, 'shield');
  // Heal: 8 + ceil(40 * 0.05) = 10 HP; void_imp at slot 0 deals 10 -> Shield layer: 6 + 20 = 26 -> 16 -> renewed +4 = 20
  assert.equal(shieldRes.summary.healed, 10);
  assert.deepEqual(shieldRes.state.player.shield.layers, [20]);

  // 10. self +10: +20 HP main heal, +10 main block + 12 secondary block = 22 block, and +1 MP refund
  const selfState = battle(['void_imp']);
  selfState.player.maxHp = 60;
  selfState.player.hp = 10;
  selfState.player.cardUpgrades = { self: 10 };
  const selfRes = cast(selfState, 'heal self');
  // Heal: 4 base + 20 self = 24 HP; Block: 10 + 12 = 22 -> absorbs all 10 dmg; +1 MP refund
  assert.equal(selfRes.summary.healed, 24);
  assert.equal(selfRes.summary.blocked, 10);
  assert.equal(selfRes.summary.incoming, 0);
  assert.equal(selfRes.summary.manaRefunded, 1);
});

test('Batch 2 Rare & first 2 Special cards: tailored main scaling and +7/+9/+10 secondary effects work in combat', () => {
  // 11. blast +10: +20 blast bonus, +4 pierce, 75% splash, permanent armor -1 on all hit targets
  const blastState = battle(['armored', 'armored']);
  for (const e of blastState.enemies) { e.hp = e.maxHp = 100; }
  blastState.player.cardUpgrades = { blast: 10 };
  const blastRes = cast(blastState, 'blast fire', 'enemy-0');
  // Center: (10 + 20) = 30 vs armor 3 (pierce 4 -> 0) = 30 -> 70 HP; Splash: 30 * 0.75 = 22.5 -> ceil 23 -> 77 HP; both armor 3 -> 2
  assert.equal(blastRes.summary.enemyHp['enemy-0'], 70);
  assert.equal(blastRes.summary.enemyHp['enemy-1'], 77);
  assert.equal(blastRes.state.enemies[0].armor, 2);
  assert.equal(blastRes.state.enemies[1].armor, 2);

  // 12. beam +10: +10 dmg, +3 main pierce, +20% dmg, +10 bonus dmg vs warded enemy, and strips 1 ward
  const beamState = battle(['warden']);
  beamState.enemies[0].hp = beamState.enemies[0].maxHp = 100;
  beamState.enemies[0].armor = 3;
  beamState.enemies[0].ward = 2;
  beamState.player.cardUpgrades = { beam: 10 };
  const beamRes = cast(beamState, 'beam fire', 'enemy-0');
  // (10 + 10) * 1.2 = 24 + 10 ward bonus = 34; armor 3 - 3 pierce = 0 -> 34 dmg, ward 2 -> 1
  assert.equal(beamRes.summary.damage, 34);
  assert.equal(beamRes.state.enemies[0].ward, 1);

  // 13. wave +10: +20 form dmg (2x), +2 pierce, +20% dmg always, and +2 chill on all hit targets
  const waveState = battle(['armored']);
  waveState.enemies[0].hp = waveState.enemies[0].maxHp = 100;
  waveState.player.cardUpgrades = { wave: 10 };
  const waveRes = cast(waveState, 'wave fire', 'enemy-0');
  // (10 + 20) * 0.6 = 18 -> * 1.2 = 21.6 -> round 22; armor 3 - 2 pierce = 1 -> 21 dmg; chill +2
  assert.equal(waveRes.summary.damage, 21);
  assert.equal(waveRes.summary.enemyStatus['enemy-0'].chill, 2);

  // 14. heal +10: overheal converts to block up to 15, plus next-turn regen +8 HP
  const healState = battle(['void_imp']);
  healState.player.maxHp = 100;
  healState.player.hp = 95;
  healState.player.cardUpgrades = { heal: 10 };
  const healRes = cast(healState, 'heal self');
  // Heal amount: 4 + 20 + 5 (5% main) + 12 (12% sec) = 41 -> heals 5 to 100, overflow 36 -> 15 block!
  // void_imp slot 0 deals 10 -> blocked 10, incoming 0!
  assert.equal(healRes.summary.overhealShield, 15);
  assert.equal(healRes.summary.blocked, 10);
  assert.equal(healRes.summary.incoming, 0);

  // 15. burn +10: +20 main burn + 8 sec burn = 31 total burn, spreads 15 to neighbor, and lingers 50% next turn
  const burnState = battle(['striker', 'striker']);
  for (const e of burnState.enemies) { e.hp = e.maxHp = 120; }
  burnState.player.cardUpgrades = { burn: 10 };
  const burnRes = cast(burnState, 'shot fire burn', 'enemy-0');
  assert.equal(burnRes.state.enemies[0].burn, 31);
  assert.equal(burnRes.state.enemies[1].burn, 15);
  assert.equal(burnRes.state.enemies[0].lingeringBurn, true);
  // Next turn (guard): burn ticks 31 on enemy-0 and leaves floor(31/2)=15 lingering!
  const burnTurn2 = cast(burnRes.state, 'guard');
  assert.equal(burnTurn2.state.enemies[0].burn, 15);
  assert.equal(burnTurn2.state.enemies[1].burn, 7);

  // 16. push +10: collision deals 8 + 10 + 10 = 28 true dmg, +3 chill, and -1 permanent armor on BOTH
  const pushState = battle(['armored', 'armored']);
  for (const e of pushState.enemies) { e.hp = e.maxHp = 100; }
  pushState.player.cardUpgrades = { push: 10 };
  const pushRes = cast(pushState, 'shot fire push', 'enemy-0');
  // enemy-0: (10 + 10 aux - 3 armor = 17) + 28 collision = 45 -> 55 HP; enemy-1: 28 collision -> 72 HP
  assert.equal(pushRes.summary.enemyHp['enemy-0'], 55);
  assert.equal(pushRes.summary.enemyHp['enemy-1'], 72);
  assert.equal(pushRes.summary.enemyStatus['enemy-0'].chill, 3);
  assert.equal(pushRes.summary.enemyStatus['enemy-1'].chill, 3);
  assert.equal(pushRes.state.enemies[0].armor, 2);
  assert.equal(pushRes.state.enemies[1].armor, 2);

  // 17. pull +10: pulls 2 slots, collides into front enemy for 8+10+8 = 26 true dmg each (matching push 8x2), shreds -2 armor & +4 chill
  const pullState = battle(['armored', 'armored']);
  pullState.enemies[0].slot = 0;
  pullState.enemies[1].slot = 2;
  for (const e of pullState.enemies) { e.hp = e.maxHp = 100; }
  pullState.player.cardUpgrades = { pull: 10 };
  const pullRes = cast(pullState, 'shot fire pull', 'enemy-1');
  // enemy-1 slides 2 -> 1, then collides into slot 0 for 26 true dmg to BOTH! And enemy-1 armor 3 -> 1, chill +4
  assert.equal(pullRes.state.enemies[1].slot, 1);
  assert.equal(pullRes.summary.enemyHp['enemy-0'], 74);
  assert.equal(pullRes.summary.enemyHp['enemy-1'], 100 - 17 - 26);
  assert.equal(pullRes.state.enemies[1].armor, 1);
  assert.equal(pullRes.summary.enemyStatus['enemy-1'].chill, 4);

  // 17b. pull front-edge slam parity with push: base slot-0 pull deals 4 true edge-slam, +10 deals 4+10+8 = 22 true edge-slam
  const pullEdgeBase = battle(['armored']);
  pullEdgeBase.enemies[0].slot = 0;
  pullEdgeBase.enemies[0].hp = pullEdgeBase.enemies[0].maxHp = 100;
  const pullEdgeBaseRes = cast(pullEdgeBase, 'shot fire pull', 'enemy-0');
  // (10 - 3 armor = 7) + 4 edge slam = 11 dmg -> 89 HP
  assert.equal(pullEdgeBaseRes.summary.enemyHp['enemy-0'], 89);

  const pullEdgeMax = battle(['armored']);
  pullEdgeMax.enemies[0].slot = 0;
  pullEdgeMax.enemies[0].hp = pullEdgeMax.enemies[0].maxHp = 100;
  pullEdgeMax.player.cardUpgrades = { pull: 10 };
  const pullEdgeMaxRes = cast(pullEdgeMax, 'shot fire pull', 'enemy-0');
  // (10 + 10 aux - 3 armor = 17) + (4 + 10 + 8 = 22 edge slam) = 39 dmg -> 61 HP
  assert.equal(pullEdgeMaxRes.summary.enemyHp['enemy-0'], 61);

  // 18. large +10: +18% attack damage & +1 MP refund
  const largeState = battle(['striker']);
  largeState.enemies[0].hp = largeState.enemies[0].maxHp = 100;
  largeState.player.cardUpgrades = { large: 10 };
  const largeRes = cast(largeState, 'shot fire large', 'enemy-0');
  // (10 + 10 aux) * 1.5 = 30 -> * 1.18 = 35.4 -> round 35; +1 MP refund
  assert.equal(largeRes.summary.damage, 35);
  assert.equal(largeRes.summary.manaRefunded, 1);

  // 19. akki +10: +20 base dmg (40 total), +10 burn, +3 pierce, 2-turn healCut, and +20% execute vs burned/healCut target
  const akkiState = battle(['armored']);
  akkiState.enemies[0].hp = akkiState.enemies[0].maxHp = 120;
  akkiState.enemies[0].burn = 5;
  akkiState.enemies[0].burnTurn = 99;
  akkiState.player.cardUpgrades = { akki: 10 };
  const akkiRes = cast(akkiState, 'shot akki', 'enemy-0');
  // 40 * 1.2 (execute) = 48, armor 3 - 3 pierce = 0 -> 48 dmg; burn 5 + 10 = 15; healCutUntil = 1 + 1 + 1 = 3
  assert.equal(akkiRes.summary.damage, 48);
  assert.equal(akkiRes.state.enemies[0].burn, 15);
  assert.equal(akkiRes.state.enemies[0].healCutUntil, 3);

  // 20. heman +10: +20 base dmg (32 total), +5 main chill + 7 sec chill (total 16), +12 shield, splash chill 4, and freezes already-chilled enemy
  const hemanState = battle(['striker', 'striker']);
  for (const e of hemanState.enemies) { e.hp = e.maxHp = 120; }
  hemanState.enemies[0].chill = 2;
  hemanState.player.cardUpgrades = { heman: 10 };
  const hemanRes = cast(hemanState, 'shot heman', 'enemy-0');
  assert.equal(hemanRes.summary.damage, 32);
  assert.equal(hemanRes.summary.secondaryShield, 12);
  assert.equal(hemanRes.summary.enemyStatus['enemy-0'].chill, 18);
  assert.equal(hemanRes.summary.enemyStatus['enemy-0'].freeze, 1);
  assert.equal(hemanRes.summary.enemyStatus['enemy-1'].chill, 4);
});

test('Batch 3 remaining 10 Special cards: tailored main scaling and +7/+9/+10 secondary effects work in combat', () => {
  // 21. asani +10: +20 base dmg (36), pierce +5 (total 7), chains BOTH sides at 85%, refunds +2 MP on wet target
  const asaniState = battle(['armored', 'armored', 'armored']);
  asaniState.enemies[0].slot = 0;
  asaniState.enemies[1].slot = 1;
  asaniState.enemies[2].slot = 2;
  for (const e of asaniState.enemies) { e.hp = e.maxHp = 120; }
  asaniState.enemies[1].wetUntil = 5;
  asaniState.player.cardUpgrades = { asani: 10 };
  const asaniRes = cast(asaniState, 'shot asani', 'enemy-1');
  // primary: 36 + 2 wet conductivity = 38 (armor 3 pierced by 7 -> 38 dmg); neighbors: round(36 * 0.85) = 31 each!
  assert.equal(asaniRes.summary.enemyHp['enemy-1'], 120 - 38);
  assert.equal(asaniRes.summary.enemyHp['enemy-0'], 120 - 31);
  assert.equal(asaniRes.summary.enemyHp['enemy-2'], 120 - 31);
  assert.equal(asaniRes.summary.manaRefunded, 2);

  // 22. pathaphi +10: +20 base dmg (34), +10 earth block (+14 total) + 15 sec shield = 29 block, shreds 2+2=4 armor, +4 chill, +10 true dmg when armor hits 0
  const pathaphiState = battle(['armored']);
  pathaphiState.enemies[0].hp = pathaphiState.enemies[0].maxHp = 120;
  pathaphiState.player.cardUpgrades = { pathaphi: 10 };
  const pathaphiRes = cast(pathaphiState, 'shot pathaphi', 'enemy-0');
  // 34 - 3 armor = 31, armor shredded 3 -> 0 -> triggers +10 true dmg = 41 total dmg; chill +4; block = 14 + 15 = 29 -> absorbs striker/armored hit
  assert.equal(pathaphiRes.summary.damage, 41);
  assert.equal(pathaphiRes.state.enemies[0].armor, 0);
  assert.equal(pathaphiRes.summary.enemyStatus['enemy-0'].chill, 4);
  assert.equal(pathaphiRes.summary.secondaryShield, 15);

  // 23. wari +10: +20 base dmg (32), +14 main heal + 12 sec heal + 8% MaxHP (8) = 34 heal, chill 2+4=6, wet ALL enemies, +1 MP refund
  const wariState = battle(['striker', 'striker', 'striker']);
  wariState.enemies[0].slot = 0;
  wariState.enemies[1].slot = 2;
  wariState.enemies[2].slot = 4;
  for (const e of wariState.enemies) { e.hp = e.maxHp = 120; }
  wariState.player.maxHp = 100;
  wariState.player.hp = 50;
  wariState.player.cardUpgrades = { wari: 10 };
  const wariRes = cast(wariState, 'shot wari', 'enemy-0');
  assert.equal(wariRes.summary.damage, 32);
  assert.equal(wariRes.summary.healed, 34);
  assert.equal(wariRes.summary.enemyStatus['enemy-0'].chill, 6);
  assert.ok(wariRes.state.enemies.every(e => e.wetUntil >= 2));
  assert.equal(wariRes.summary.manaRefunded, 1);

  // 24. vayu +10: +20 base dmg (34), pushes 2 slots, collision deals 6 + 10 + 14 = 30 true dmg to BOTH, +4 chill & -1 armor to BOTH
  const vayuState = battle(['armored', 'armored']);
  vayuState.enemies[0].slot = 0;
  vayuState.enemies[1].slot = 2;
  for (const e of vayuState.enemies) { e.hp = e.maxHp = 120; }
  vayuState.player.cardUpgrades = { vayu: 10 };
  const vayuRes = cast(vayuState, 'shot vayu', 'enemy-0');
  // enemy-0: (34 - 3 armor = 31) + 30 collision = 61 -> 59 HP; slides 0 -> 1 then collides into slot 2!
  // enemy-1: 30 collision -> 90 HP; BOTH get +4 chill and armor 3 -> 2
  assert.equal(vayuRes.state.enemies[0].slot, 1);
  assert.equal(vayuRes.summary.enemyHp['enemy-0'], 59);
  assert.equal(vayuRes.summary.enemyHp['enemy-1'], 90);
  assert.equal(vayuRes.summary.enemyStatus['enemy-0'].chill, 4);
  assert.equal(vayuRes.summary.enemyStatus['enemy-1'].chill, 4);
  assert.equal(vayuRes.state.enemies[0].armor, 2);
  assert.equal(vayuRes.state.enemies[1].armor, 2);

  // 25. freeze +10: +20 aux dmg (6+20=26), +25% dmg -> round(26*1.25)=33, armor shred -2, chill 4 + 3 (main) + 6 (sec) = 13, freeze +1, +1 MP refund
  const freezeState = battle(['armored']);
  freezeState.enemies[0].hp = freezeState.enemies[0].maxHp = 120;
  freezeState.player.cardUpgrades = { freeze: 10 };
  const freezeRes = cast(freezeState, 'shot ice freeze', 'enemy-0');
  // (6 + 20) * 1.25 = 32.5 -> 33; minus 3 armor = 30 dmg; armor shredded 3 -> 1; chill 4 + 3 + 6 = 13; freeze = 1; +1 MP
  assert.equal(freezeRes.summary.damage, 30);
  assert.equal(freezeRes.state.enemies[0].armor, 1);
  assert.equal(freezeRes.summary.enemyStatus['enemy-0'].chill, 13);
  assert.equal(freezeRes.summary.enemyStatus['enemy-0'].freeze, 1);
  assert.equal(freezeRes.summary.manaRefunded, 1);

  // 26. pierce +10: +10 aux dmg, +5 main pierce (total 2+5=7), +15% dmg, overpenetration (7-3=4 * 2 = +8 true dmg), permanent -2 armor
  const pierceState = battle(['armored']);
  pierceState.enemies[0].hp = pierceState.enemies[0].maxHp = 120;
  pierceState.player.cardUpgrades = { pierce: 10 };
  const pierceRes = cast(pierceState, 'shot fire pierce', 'enemy-0');
  // (10 + 10) * 1.15 = 23 + overpierce (7 - 3) * 2 = +8 -> 31 dmg; armor 3 -> 1
  assert.equal(pierceRes.summary.damage, 31);
  assert.equal(pierceRes.state.enemies[0].armor, 1);

  // 27. grand +10 on attack: +20 aux dmg, *1.5 mult, +25% dmg, +2 MP refund
  const grandAtkState = battle(['striker']);
  grandAtkState.enemies[0].hp = grandAtkState.enemies[0].maxHp = 120;
  grandAtkState.player.cardUpgrades = { grand: 10 };
  const grandAtkRes = cast(grandAtkState, 'grand shot fire', 'enemy-0');
  // (10 + 20) * 1.5 = 45 -> * 1.25 = 56.25 -> 56 dmg; +2 MP refund
  assert.equal(grandAtkRes.summary.damage, 56);
  assert.equal(grandAtkRes.summary.manaRefunded, 2);

  // 28. seal +10: +20 aux dmg, +6 chill, splashes seal+chill to adjacent enemy, +15 true punish dmg & +1 MP on support/warded enemy
  const sealState = battle(['scroll_moth', 'striker']);
  sealState.enemies[0].slot = 0;
  sealState.enemies[1].slot = 1;
  sealState.enemies[0].hp = sealState.enemies[0].maxHp = 120;
  sealState.enemies[1].hp = sealState.enemies[1].maxHp = 120;
  sealState.enemies[0].ward = 0; // scroll_moth casts ward on ally on turn 1 -> support intent triggers seal punish +15 true dmg & +1 MP!
  sealState.player.cardUpgrades = { seal: 10 };
  const sealRes = cast(sealState, 'shot fire seal', 'enemy-0');
  // enemy-0: (10 + 20) = 30 + 15 punish true dmg = 45; both enemy-0 & enemy-1 sealed & chilled +6; +1 MP refund
  assert.equal(sealRes.summary.damage, 45);
  assert.equal(sealRes.events.some(e => e.type === 'seal' && e.target === 'enemy-0'), true);
  assert.equal(sealRes.events.some(e => e.type === 'seal' && e.target === 'enemy-1'), true);
  assert.equal(sealRes.summary.enemyStatus['enemy-0'].chill, 6);
  assert.equal(sealRes.summary.enemyStatus['enemy-1'].chill, 6);
  assert.equal(sealRes.summary.manaRefunded, 1);

  // 29. dispel +10: +20 aux dmg, +2 pierce, bursts 22 true dmg per ward stripped, strips 1 ward from adjacent, -2 armor, +2 MP refund
  const dispelState = battle(['armored', 'armored']);
  dispelState.enemies[0].slot = 0;
  dispelState.enemies[1].slot = 1;
  for (const e of dispelState.enemies) { e.hp = e.maxHp = 120; }
  dispelState.enemies[0].ward = 2;
  dispelState.enemies[1].ward = 1;
  dispelState.player.cardUpgrades = { dispel: 10 };
  const dispelRes = cast(dispelState, 'shot fire dispel', 'enemy-0');
  // 2 wards stripped -> 44 true burst dmg + (10 + 20 - max(0, 3-2) = 29) = 73 total dmg!
  // enemy-0 armor 3 -> 1; enemy-1 ward 1 -> 0; +2 MP refund
  assert.equal(dispelRes.summary.damage, 73);
  assert.equal(dispelRes.state.enemies[0].ward, 0);
  assert.equal(dispelRes.state.enemies[1].ward, 0);
  assert.equal(dispelRes.state.enemies[0].armor, 1);
  assert.equal(dispelRes.summary.manaRefunded, 2);

  // 30. brace +10: +20 main shield + 12 sec shield (total 38), triggers at >= 6 incoming dmg (+26 bonus brace!), reflects 16 true dmg, chills +4, heals +6 HP
  const braceState = battle(['void_imp']);
  braceState.enemies[0].slot = 0; // void_imp at slot 0 deals 7+3=10 dmg (triggers brace >= 6!)
  braceState.enemies[0].hp = braceState.enemies[0].maxHp = 100;
  braceState.player.maxHp = 60;
  braceState.player.hp = 40;
  braceState.player.cardUpgrades = { brace: 10 };
  const braceRes = cast(braceState, 'shield brace');
  // Shield layer cap = 6 + 20 (brace+10 main) = 26, plus 12 sec bonus block, plus 26 brace trigger = absorbs 10 easily (0 hp loss)
  // Reflects 16 true dmg -> enemy-0 at 84 HP, chills +4, heals +6 HP -> 46 HP
  assert.equal(braceRes.summary.incoming, 0);
  assert.equal(braceRes.state.enemies[0].hp, 84);
  assert.equal(braceRes.state.enemies[0].chill, 4);
  assert.equal(braceRes.state.player.hp, 46);
});

test('Batch 4 first 10 Epic Fusion cards: tailored main scaling and +7/+9/+10 secondary effects work in combat', () => {
  // 31. magma +10: +20 base dmg (42), +10 burn, puddle erupts for 6+20=26 true dmg, -3 armor, +12 zero-armor true dmg, & splashes 13 true dmg to adjacent
  const magmaState = battle(['armored', 'armored']);
  magmaState.enemies[0].slot = 0;
  magmaState.enemies[1].slot = 1;
  for (const e of magmaState.enemies) { e.hp = e.maxHp = 150; }
  magmaState.player.cardUpgrades = { magma: 10 };
  const magmaHit = cast(magmaState, 'shot magma', 'enemy-0');
  // 42 - 3 armor = 39 dmg -> 111 HP; burn = 10; puddle at slot 0
  assert.equal(magmaHit.summary.enemyHp['enemy-0'], 111);
  assert.equal(magmaHit.state.enemies[0].burn, 10);
  assert.deepEqual(magmaHit.state.magmaPuddles, [0]);
  // Next turn guard: puddle erupts on slot 0 -> 26 true dmg, shreds armor 3->0, triggers +12 zero-armor true dmg (total 38), splashes 13 true dmg to slot 1!
  // (plus burn ticks 10 on enemy-0 after player action during enemy phase -> enemy-0 takes 38 during eruption + 10 burn = 48 -> 63 HP)
  const magmaErupt = cast(magmaHit.state, 'guard');
  assert.equal(magmaErupt.summary.enemyHp['enemy-0'], 111 - 26 - 12);
  assert.equal(magmaErupt.summary.enemyHp['enemy-1'], 150 - 13);
  assert.equal(magmaErupt.state.enemies[0].armor, 0);

  // 32. mudmire +10: +20 base dmg (38) * 1.15 = 44, +10 mud block, +10 heal, chill 3+5+7=15, splashes wet+chill 15 to adjacent, -2 armor
  const mudState = battle(['armored', 'striker']);
  mudState.enemies[0].slot = 0;
  mudState.enemies[1].slot = 1;
  for (const e of mudState.enemies) { e.hp = e.maxHp = 150; }
  mudState.player.maxHp = 100;
  mudState.player.hp = 60;
  mudState.player.cardUpgrades = { mudmire: 10 };
  const mudRes = cast(mudState, 'shot mudmire', 'enemy-0');
  // 38 * 1.15 = 43.7 -> 44; 44 - 3 armor = 41 dmg; armor 3 -> 1; both chilled 15 & wet; healed 10
  assert.equal(mudRes.summary.damage, 41);
  assert.equal(mudRes.state.enemies[0].armor, 1);
  assert.equal(mudRes.summary.enemyStatus['enemy-0'].chill, 15);
  assert.equal(mudRes.summary.enemyStatus['enemy-1'].chill, 15);
  assert.ok(mudRes.state.enemies[1].wetUntil >= 2);
  assert.equal(mudRes.summary.healed, 10);

  // 33. dust +10: +20 base dmg (38), shreds 1+2=3 armor, obscures primary, pushes 2 slots, collides for 6+10+14=30 true dmg each, collider loses -1 armor & obscured
  const dustState = battle(['armored', 'armored']);
  dustState.enemies[0].slot = 0;
  dustState.enemies[1].slot = 2;
  for (const e of dustState.enemies) { e.hp = e.maxHp = 150; }
  dustState.player.cardUpgrades = { dust: 10 };
  const dustRes = cast(dustState, 'shot dust', 'enemy-0');
  // enemy-0: (38 - 3 = 35) + 30 collision = 65 -> 85 HP; armor 3->0; obscured; slides 0->1
  // enemy-1: 30 collision -> 120 HP; armor 3->2; obscured
  assert.equal(dustRes.state.enemies[0].slot, 1);
  assert.equal(dustRes.summary.enemyHp['enemy-0'], 85);
  assert.equal(dustRes.summary.enemyHp['enemy-1'], 120);
  assert.equal(dustRes.state.enemies[0].armor, 0);
  assert.equal(dustRes.state.enemies[1].armor, 2);
  assert.equal(dustRes.summary.enemyStatus['enemy-0'].obscured, true);
  assert.equal(dustRes.summary.enemyStatus['enemy-1'].obscured, true);

  // 34. permafrost +10: +20 base dmg (38), +26 earth block + 16 sec shield = 42, chill +7, shreds 2+1=3 armor (3->0) -> freezes target!
  const permaState = battle(['armored']);
  permaState.enemies[0].hp = permaState.enemies[0].maxHp = 150;
  permaState.player.cardUpgrades = { permafrost: 10 };
  const permaRes = cast(permaState, 'shot permafrost', 'enemy-0');
  assert.equal(permaRes.summary.damage, 35);
  assert.equal(permaRes.state.enemies[0].armor, 0);
  assert.equal(permaRes.summary.enemyStatus['enemy-0'].chill, 7);
  assert.equal(permaRes.summary.enemyStatus['enemy-0'].freeze, 1);
  assert.equal(permaRes.summary.secondaryShield, 16);

  // 35. magnet +10: +20 base dmg (38), pierce 2+5=7, pulls range 2 into primary, collision deals 6+20+12=38 true dmg each, -1 armor & +3 chill on colliders
  const magState = battle(['armored', 'armored']);
  magState.enemies[0].slot = 0;
  magState.enemies[1].slot = 2;
  for (const e of magState.enemies) { e.hp = e.maxHp = 150; }
  magState.player.cardUpgrades = { magnet: 10 };
  const magRes = cast(magState, 'shot magnet', 'enemy-0');
  // enemy-0: 38 (armor pierced by 7) + 38 collision = 76 -> 74 HP; enemy-1 slides 2->1 then collides into slot 0 for 38 -> 112 HP; both armor 3->2 & chill +3
  assert.equal(magRes.state.enemies[1].slot, 1);
  assert.equal(magRes.summary.enemyHp['enemy-0'], 74);
  assert.equal(magRes.summary.enemyHp['enemy-1'], 112);
  assert.equal(magRes.state.enemies[0].armor, 2);
  assert.equal(magRes.state.enemies[1].armor, 2);
  assert.equal(magRes.summary.enemyStatus['enemy-0'].chill, 3);
  assert.equal(magRes.summary.enemyStatus['enemy-1'].chill, 3);

  // 36. mist +10: +20 base dmg (38), +10 burn, chill 5+6=11, +12 sec shield, spreads wet+obscured to ALL enemies, +15 true scald dmg vs already-wet target
  const mistState = battle(['striker', 'striker', 'striker']);
  mistState.enemies[0].slot = 0;
  mistState.enemies[1].slot = 2;
  mistState.enemies[2].slot = 4;
  for (const e of mistState.enemies) { e.hp = e.maxHp = 150; }
  mistState.enemies[0].wetUntil = 5;
  mistState.player.cardUpgrades = { mist: 10 };
  const mistRes = cast(mistState, 'shot mist', 'enemy-0');
  // 38 + 15 true scald = 53 dmg; burn 10; chill 11; ALL enemies wet & obscured; +12 sec shield
  assert.equal(mistRes.summary.damage, 53);
  assert.equal(mistRes.state.enemies[0].burn, 10);
  assert.equal(mistRes.summary.enemyStatus['enemy-0'].chill, 11);
  assert.equal(mistRes.summary.secondaryShield, 12);
  assert.ok(mistRes.state.enemies.every(e => e.wetUntil >= 2 && mistRes.summary.enemyStatus[e.id].obscured === true));

  // 37. hail +10: wet target gets +35% dmg (38*1.35=51), freezes, -2 armor, spreads +5 chill to others, +1 MP; dry target gets chill 2+5+7=14 & becomes wet!
  const hailWetState = battle(['armored', 'striker']);
  for (const e of hailWetState.enemies) { e.hp = e.maxHp = 150; }
  hailWetState.enemies[0].wetUntil = 5;
  hailWetState.player.cardUpgrades = { hail: 10 };
  const hailWetRes = cast(hailWetState, 'shot hail', 'enemy-0');
  // round(38 * 1.35) = 51 - 3 armor = 48 dmg; freeze = 1; armor 3->1; enemy-1 chill +5; +1 MP refund
  assert.equal(hailWetRes.summary.damage, 48);
  assert.equal(hailWetRes.summary.enemyStatus['enemy-0'].freeze, 1);
  assert.equal(hailWetRes.state.enemies[0].armor, 1);
  assert.equal(hailWetRes.summary.enemyStatus['enemy-1'].chill, 5);
  assert.equal(hailWetRes.summary.manaRefunded, 1);

  const hailDryState = battle(['striker']);
  hailDryState.enemies[0].hp = hailDryState.enemies[0].maxHp = 150;
  hailDryState.player.cardUpgrades = { hail: 10 };
  const hailDryRes = cast(hailDryState, 'shot hail', 'enemy-0');
  assert.equal(hailDryRes.summary.enemyStatus['enemy-0'].chill, 14);
  assert.ok(hailDryRes.state.enemies[0].wetUntil >= 2);

  // 38. monsoon +10: +20 base dmg (38), pushes all (collision 6+10+12=28 true dmg), heals 14 + 12 + 8% MaxHP (8) = 34, chill +3 on pushed, +2 MP refund on collision
  const monState = battle(['armored', 'armored']);
  monState.enemies[0].slot = 0;
  monState.enemies[1].slot = 1;
  for (const e of monState.enemies) { e.hp = e.maxHp = 150; }
  monState.player.maxHp = 100;
  monState.player.hp = 50;
  monState.player.cardUpgrades = { monsoon: 10 };
  const monRes = cast(monState, 'shot monsoon', 'enemy-0');
  // enemy-0: (38 - 3 = 35) + 28 collision = 63 -> 87 HP; enemy-1: 28 collision -> 122 HP (then slides 1->2); both wet & chill +3; healed 34; +2 MP refund
  assert.equal(monRes.summary.enemyHp['enemy-0'], 87);
  assert.equal(monRes.summary.enemyHp['enemy-1'], 122);
  assert.equal(monRes.summary.healed, 34);
  assert.equal(monRes.summary.enemyStatus['enemy-0'].chill, 3);
  assert.equal(monRes.summary.enemyStatus['enemy-1'].chill, 3);
  assert.equal(monRes.summary.manaRefunded, 2);

  // 39. shockstream +10: +20 base dmg (38), pierce 2+6=8, shocks wet enemies for 10+20+18=48 (including already-wet primary!), +1 MP per wet shocked (up to 3)
  const shockState = battle(['armored', 'armored', 'armored']);
  for (const e of shockState.enemies) { e.hp = e.maxHp = 150; e.wetUntil = 5; }
  shockState.player.cardUpgrades = { shockstream: 10 };
  const shockRes = cast(shockState, 'shot shockstream', 'enemy-0');
  // primary: (38 + 2 wet conductivity = 40) + 48 reshock = 88 -> 62 HP; others: 48 each -> 102 HP; 3 wet shocked -> +3 MP refund!
  assert.equal(shockRes.summary.enemyHp['enemy-0'], 150 - 40 - 48);
  assert.equal(shockRes.summary.enemyHp['enemy-1'], 150 - 48);
  assert.equal(shockRes.summary.enemyHp['enemy-2'], 150 - 48);
  assert.equal(shockRes.summary.manaRefunded, 3);

  // 40. thunderstorm +10: +20 base dmg (40), pierce 2+5=7, collision 6+10+12=28 true dmg + zaps collided blocker (95% = 38) + chains BOTH sides at 95% (38)!
  const thState = battle(['armored', 'armored', 'armored']);
  thState.enemies[0].slot = 0;
  thState.enemies[1].slot = 1;
  thState.enemies[2].slot = 2;
  for (const e of thState.enemies) { e.hp = e.maxHp = 200; }
  thState.player.cardUpgrades = { thunderstorm: 10 };
  const thRes = cast(thState, 'shot thunderstorm', 'enemy-1');
  // enemy-1 (slot 1): 40 primary (pierced) + 28 collision into slot 2 = 68 -> 132 HP
  // enemy-2 (slot 2): 28 collision + 38 collide-zap + 38 chain = 104 -> 96 HP
  // enemy-0 (slot 0): 38 chain (both sides!) -> 162 HP
  assert.equal(thRes.summary.enemyHp['enemy-1'], 200 - 40 - 28);
  assert.equal(thRes.summary.enemyHp['enemy-2'], 200 - 28 - 38 - 38);
  assert.equal(thRes.summary.enemyHp['enemy-0'], 200 - 38);
});

test('Batch 5 (Cards 41–53: remaining Epic & all Legendary) upgrade scaling and +10 secondary effects', () => {
  const batch5 = [
    'heatwave', 'chillgale', 'plasma', 'scald', 'frostvolt',
    'meteor', 'veil', 'chakram', 'storm',
    'barrage', 'devastation', 'blackhole', 'death',
  ];
  for (const id of batch5) {
    assert.ok(getCardSecondaryEffect(id, 10), `${id} should have +10 secondary effect`);
    assert.ok(describeCardUpgradeEffect(id, 10).length > 0, `${id} should describe upgrade`);
  }

  // 41. heatwave +10: +20 dmg (42), burn 4+10+12=26 primary & 14 adj with lingeringBurn, push collision 6+10+12=28 true dmg each, +15 true detonate vs already-burning target
  const heatState = battle(['striker', 'striker']);
  heatState.enemies[0].slot = 0;
  heatState.enemies[1].slot = 1;
  for (const e of heatState.enemies) { e.hp = e.maxHp = 200; }
  heatState.enemies[0].burn = 5;
  heatState.enemies[0].burnTurn = 1;
  heatState.player.cardUpgrades = { heatwave: 10 };
  const heatRes = cast(heatState, 'shot heatwave', 'enemy-0');
  // enemy-0: 42 primary + 15 burn detonate + 28 collision = 85 -> 115 HP (burn 5 ticks at start of turn? no, burn ticks at turn end -> check newBurn + remaining)
  assert.equal(heatRes.summary.enemyHp['enemy-0'], 200 - 42 - 15 - 28);
  assert.equal(heatRes.summary.enemyHp['enemy-1'], 200 - 28);
  assert.equal(heatRes.state.enemies[0].lingeringBurn, true);
  assert.equal(heatRes.state.enemies[1].lingeringBurn, true);
  assert.ok(heatRes.state.enemies[0].burn >= 26);
  assert.equal(heatRes.state.enemies[1].burn, 14);

  // 42. chillgale +10: +20 dmg (38), chill 4+5+8=17 + splash 4 lastingChill, pushes 2 slots, collision 6+10+12=28 true dmg each + FREEZES chilled colliders!
  const cgState = battle(['striker', 'striker']);
  cgState.enemies[0].slot = 0;
  cgState.enemies[1].slot = 2;
  for (const e of cgState.enemies) { e.hp = e.maxHp = 200; }
  cgState.enemies[1].chill = 3;
  cgState.player.cardUpgrades = { chillgale: 10 };
  const cgRes = cast(cgState, 'shot chillgale', 'enemy-0');
  assert.equal(cgRes.state.enemies[0].slot, 1);
  assert.equal(cgRes.summary.enemyHp['enemy-0'], 200 - 38 - 28);
  assert.equal(cgRes.summary.enemyHp['enemy-1'], 200 - 28);
  assert.equal(cgRes.summary.enemyStatus['enemy-0'].freeze, 1);
  assert.equal(cgRes.summary.enemyStatus['enemy-1'].freeze, 1);
  assert.ok(cgRes.summary.enemyStatus['enemy-0'].chill >= 17);

  // 43. plasma +10: (24+30)=54 * 1.28 = 69, pierce 2+8=10 vs armor 3 => overpierce 7*2=14 -> 83 dmg, +8 burn, -2 armor!
  const plState = battle(['armored']);
  plState.enemies[0].hp = plState.enemies[0].maxHp = 200;
  plState.player.cardUpgrades = { plasma: 10 };
  const plRes = cast(plState, 'shot plasma', 'enemy-0');
  assert.equal(plRes.summary.damage, 83);
  assert.equal(plRes.state.enemies[0].burn, 8);
  assert.equal(plRes.state.enemies[0].armor, 1);

  // 44. scald +10: +20 dmg (40), shreds 2+2=4 armor (3->0) -> +18 true zero-armor dmg, chill 5+8=13, burn 5+8=13, applies wet, +1 MP refund!
  const scState = battle(['armored']);
  scState.enemies[0].hp = scState.enemies[0].maxHp = 200;
  scState.player.cardUpgrades = { scald: 10 };
  const scRes = cast(scState, 'shot scald', 'enemy-0');
  // 40 - 3 armor = 37 + 18 zero-armor true = 55 dmg
  assert.equal(scRes.summary.damage, 55);
  assert.equal(scRes.state.enemies[0].armor, 0);
  assert.equal(scRes.state.enemies[0].burn, 13);
  assert.ok(scRes.state.enemies[0].wetUntil >= 2);
  assert.equal(scRes.summary.enemyStatus['enemy-0'].chill, 13);
  assert.equal(scRes.summary.manaRefunded, 1);

  // 45. frostvolt +10: +20 dmg (40), pierce 2+5+5=12, chains BOTH sides at 95% (38), freezes already-chilled neighbor, +1 MP refund
  const fvState = battle(['armored', 'armored', 'armored']);
  fvState.enemies[0].slot = 0;
  fvState.enemies[1].slot = 1;
  fvState.enemies[2].slot = 2;
  for (const e of fvState.enemies) { e.hp = e.maxHp = 200; }
  fvState.enemies[0].chill = 3;
  fvState.player.cardUpgrades = { frostvolt: 10 };
  const fvRes = cast(fvState, 'shot frostvolt', 'enemy-1');
  assert.equal(fvRes.summary.enemyHp['enemy-1'], 200 - 40);
  assert.equal(fvRes.summary.enemyHp['enemy-0'], 200 - 38);
  assert.equal(fvRes.summary.enemyHp['enemy-2'], 200 - 38);
  assert.equal(fvRes.summary.enemyStatus['enemy-0'].freeze, 1);
  assert.equal(fvRes.summary.manaRefunded, 1);

  // 46. meteor +10: 4 drops (3+1), direct 24+30=54 (pierce 6 ignores armor 3), burn +8 per hit, -1 armor per hit!
  const metState = battle(['armored']);
  metState.enemies[0].hp = metState.enemies[0].maxHp = 300;
  metState.player.maxMana = metState.player.mana = 20;
  metState.player.cardUpgrades = { meteor: 10 };
  const metRes = cast(metState, 'meteor', 'enemy-0');
  // 4 drops on single enemy: 4 * 54 = 216 direct damage, armor shredded 3->0, burn 4 * 8 = 32
  assert.equal(metRes.summary.damage, 216);
  assert.equal(metRes.state.enemies[0].armor, 0);
  assert.equal(metRes.state.enemies[0].burn, 32);

  // 47. veil +10: layerCap = 8 + 10*2 = 28; breaking a veil layer absorbs overflow (8+20=28), reflects 15 true dmg, heals 8, +6 chill, +2 MP!
  const veilBreakState = battle(['boss']);
  veilBreakState.enemies[0].hp = veilBreakState.enemies[0].maxHp = 200;
  veilBreakState.enemies[0].armor = 4;
  veilBreakState.turn = 2;
  veilBreakState.player.maxHp = 100;
  veilBreakState.player.hp = 60;
  veilBreakState.player.maxMana = veilBreakState.player.mana = 20;
  veilBreakState.player.cardUpgrades = { veil: 10 };
  const veilCast = cast(veilBreakState, 'veil');
  assert.ok(veilCast.summary.shield >= 28);
  // Break veil layer on turn 1: rune_ram attacks for 6 (minus guard 4 block = 2 > 1-HP veil layer -> breaks!)
  const breakTest = structuredClone(veilCast.state);
  breakTest.turn = 1;
  breakTest.enemies = [createEnemy('rune_ram', 0)];
  breakTest.enemies[0].hp = breakTest.enemies[0].maxHp = 200;
  breakTest.player.shield.layers = [1];
  breakTest.player.shield.layerDetails = [{ hp: 1, expires: breakTest.turn + 1, effect: 'veil', triggered: false }];
  breakTest.player.hp = 60;
  breakTest.player.mana = 10;
  const broke = cast(breakTest, 'guard');
  assert.equal(broke.summary.damage, 15); // 15 true reflect dmg
  assert.equal(broke.summary.healed, 8);
  assert.equal(broke.summary.manaRefunded, 2);
  assert.equal(broke.state.enemies[0].chill, 6);

  // 48. chakram +10: pierce +6, +24% dmg, -2 armor on hit; killing enemy refunds +3 MP and cleaves adjacent for 50%!
  const chkState = battle(['armored', 'armored']);
  chkState.enemies[0].slot = 0;
  chkState.enemies[1].slot = 1;
  chkState.enemies[0].hp = 15; // will die to chakram
  chkState.enemies[1].hp = chkState.enemies[1].maxHp = 200;
  chkState.player.maxMana = chkState.player.mana = 20;
  chkState.player.cardUpgrades = { chakram: 10 };
  const chkRes = cast(chkState, 'chakram fire', 'enemy-0');
  assert.equal(chkRes.summary.enemyHp['enemy-0'], 0);
  assert.ok(chkRes.summary.enemyHp['enemy-1'] < 200); // cleaved adjacent!
  assert.equal(chkRes.summary.manaRefunded, 3);

  // 49. storm +10: side enemies take 100% power, pierce +4, +3 chill on hit, hitting 2+ targets refunds +2 MP!
  const stmState = battle(['armored', 'armored', 'armored']);
  stmState.enemies[0].slot = 0;
  stmState.enemies[1].slot = 1;
  stmState.enemies[2].slot = 2;
  for (const e of stmState.enemies) { e.hp = e.maxHp = 200; }
  stmState.player.maxMana = stmState.player.mana = 20;
  stmState.player.cardUpgrades = { storm: 10 };
  const stmRes = cast(stmState, 'storm fire', 'enemy-1');
  assert.equal(stmRes.summary.enemyHp['enemy-0'], stmRes.summary.enemyHp['enemy-2']);
  assert.equal(stmRes.summary.enemyStatus['enemy-1'].chill, 3);
  assert.equal(stmRes.summary.manaRefunded, 2);

  // 50. barrage +10: 4 hits with pierce +6, +6 MP refund, -1 armor (up to 3), finale (4th hit) deals 2x damage!
  const barState = battle(['armored']);
  barState.enemies[0].hp = barState.enemies[0].maxHp = 300;
  barState.player.maxMana = barState.player.mana = 24;
  barState.player.cardUpgrades = { barrage: 10 };
  const barRes = cast(barState, 'shot fire barrage', 'enemy-0');
  assert.equal(barRes.state.enemies[0].armor, 0); // shredded 3 armor across hits
  assert.equal(barRes.summary.manaRefunded, 6);
  const dmgEvents = barRes.events.filter(ev => ev.type === 'damage');
  assert.equal(dmgEvents.length, 5);
  assert.equal(dmgEvents[4].amount, dmgEvents[0].amount * 2); // finale 2x!

  // 51. devastation +10: 100% blast splash in radius 2, strips 1 ward from secondary targets, -2 armor, +2 MP refund!
  const devState = battle(['armored', 'armored', 'armored']);
  devState.enemies[0].slot = 0;
  devState.enemies[1].slot = 2;
  devState.enemies[2].slot = 4;
  for (const e of devState.enemies) { e.hp = e.maxHp = 200; }
  devState.enemies[0].ward = 1;
  devState.player.maxMana = devState.player.mana = 24;
  devState.player.cardUpgrades = { devastation: 10 };
  const devRes = cast(devState, 'shot fire devastation', 'enemy-1');
  assert.equal(devRes.state.enemies[0].ward, 0);
  assert.equal(devRes.state.enemies[0].armor, 1);
  assert.equal(devRes.state.enemies[2].armor, 1);
  assert.equal(devRes.summary.manaRefunded, 2);
  assert.equal(devRes.summary.enemyHp['enemy-0'], devRes.summary.enemyHp['enemy-2']); // both take 100% blast splash!

  // 52. blackhole +10: +30 sec shield, +6 MP refund, pulls apply +6 chill & -2 armor, slam 150 true, collapse +25% (563 center / 422 other)!
  const bhState = battle(['armored', 'armored']);
  bhState.enemies[0].slot = 0;
  bhState.enemies[1].slot = 4;
  for (const e of bhState.enemies) { e.hp = e.maxHp = 800; }
  bhState.player.maxHp = bhState.player.hp = 200;
  bhState.player.maxMana = bhState.player.mana = 30;
  bhState.player.cardUpgrades = { blackhole: 10 };
  const bhOpen = cast(bhState, 'blackhole', 'slot-2');
  assert.equal(bhOpen.summary.secondaryShield, 30);
  assert.equal(bhOpen.summary.manaRefunded, 6);
  assert.equal(bhOpen.state.enemies[0].armor, 1);
  assert.equal(bhOpen.summary.enemyStatus['enemy-0'].chill, 6);
  // Collapse next turn: power = 450 * 1.25 = 563 center (slot 2), 75% = 422 others!
  const bhCollapse = cast(bhOpen.state, 'guard');
  assert.equal(bhCollapse.events.find(ev => ev.type === 'damage' && ev.target === 'enemy-0').amount, 563);
  assert.equal(bhCollapse.events.find(ev => ev.type === 'damage' && ev.target === 'enemy-1').amount, 422);

  // 53. death +10: on boss deals (100+250)*1.5 = 525 true dmg, strips 2 ward, -3 armor, +28 shield, +28 heal, +10 MP refund; on non-boss kills & draws +2 bonus cards!
  const dBossState = battle(['boss']);
  dBossState.enemies[0].hp = dBossState.enemies[0].maxHp = 1000;
  dBossState.enemies[0].ward = 2;
  dBossState.enemies[0].armor = 5;
  dBossState.player.maxHp = 100;
  dBossState.player.hp = 50;
  dBossState.player.maxMana = dBossState.player.mana = 30;
  dBossState.player.cardUpgrades = { death: 10 };
  const dBossRes = cast(dBossState, 'death', 'enemy-0');
  assert.equal(dBossRes.summary.enemyHp['enemy-0'], 1000 - 525);
  assert.equal(dBossRes.state.enemies[0].ward, 0);
  assert.equal(dBossRes.state.enemies[0].permanentArmorShred, 3);
  assert.equal(dBossRes.state.enemies[0].armor, 0);
  assert.equal(dBossRes.summary.healed, 28);
  assert.equal(dBossRes.summary.secondaryShield, 28);
  assert.equal(dBossRes.summary.manaRefunded, 10);

  const dMobState = battle(['armored', 'striker']);
  dMobState.player.maxMana = dMobState.player.mana = 30;
  dMobState.player.hand = ['death'];
  dMobState.player.cardUpgrades = { death: 10 };
  const dMobRes = cast(dMobState, 'death', 'enemy-0');
  assert.equal(dMobRes.summary.enemyHp['enemy-0'], 0);
  // Normal end-of-turn draw (TURN_DRAW = 3) + death +10 kill bonus draw (2) = 5 cards in hand!
  assert.equal(dMobRes.state.player.hand.length, 5);
});

test('new cards (spear, empower, bless, fill, blood, mana) respect rarities, grammar rules, combat behavior, save/load, and +10 upgrades', () => {
  // Verify exact rarity counts across all 59 cards
  const byRarity = Object.values(WORDS).reduce((acc, w) => {
    const r = w.rarity ?? 'common';
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});
  assert.equal(Object.keys(WORDS).length, 64);
  assert.deepEqual(byRarity, { common: 17, rare: 9, special: 13, epic: 19, legendary: 6 });
  assert.equal(WORDS.spear.rarity ?? 'common', 'common');
  assert.equal(WORDS.empower.rarity, 'rare');
  assert.equal(WORDS.bless.rarity, 'special');
  assert.equal(WORDS.fill.rarity ?? 'common', 'common');
  assert.equal(WORDS.blood.rarity ?? 'common', 'common');
  assert.equal(WORDS.mana.rarity ?? 'common', 'common');

  // 1. SPEAR (หอก): 80% primary + 50% behind (slot + 1), ignores slot + 2 and slot - 1
  const spState = battle(['striker', 'striker', 'striker']);
  spState.enemies[0].slot = 1;
  spState.enemies[1].slot = 2;
  spState.enemies[2].slot = 3;
  for (const e of spState.enemies) { e.hp = e.maxHp = 100; e.armor = 0; }
  const spHit = cast(spState, 'spear fire', 'enemy-0');
  assert.equal(spHit.ok, true);
  assert.equal(spHit.summary.cost, 3);
  // fire base damage = 10 -> 80% = 8 on enemy-0, 50% = 5 on enemy-1, 0 on enemy-2!
  assert.equal(spHit.summary.enemyHp['enemy-0'], 100 - 8);
  assert.equal(spHit.summary.enemyHp['enemy-1'], 100 - 5);
  assert.equal(spHit.summary.enemyHp['enemy-2'], 100);

  // SPEAR when nobody is directly behind (slot + 1 is empty)
  const spSolo = battle(['striker', 'striker']);
  spSolo.enemies[0].slot = 0;
  spSolo.enemies[1].slot = 2; // gap at slot 1
  for (const e of spSolo.enemies) { e.hp = e.maxHp = 100; e.armor = 0; }
  const spSoloHit = cast(spSolo, 'spear fire', 'enemy-0');
  assert.equal(spSoloHit.summary.enemyHp['enemy-0'], 100 - 8);
  assert.equal(spSoloHit.summary.enemyHp['enemy-1'], 100);

  // SPEAR +10 secondary (spear_skewer): back 85%, pierce +3 (+3 main = +6), shred -1 armor, double-hit refunds +1 MP
  const sp10 = battle(['armored', 'armored']);
  sp10.enemies[0].slot = 1;
  sp10.enemies[1].slot = 2;
  for (const e of sp10.enemies) { e.hp = e.maxHp = 100; e.armor = 3; }
  sp10.player.maxMana = sp10.player.mana = 12;
  sp10.player.cardUpgrades = { spear: 10 };
  const sp10Hit = cast(sp10, 'spear fire', 'enemy-0');
  // base (10 + 10) = 20 -> primary 80% = 16 (pierce 6 >= armor 3 -> full 16), behind 85% = 17!
  assert.equal(sp10Hit.summary.enemyHp['enemy-0'], 100 - 16);
  assert.equal(sp10Hit.summary.enemyHp['enemy-1'], 100 - 17);
  assert.equal(sp10Hit.state.enemies[0].armor, 2);
  assert.equal(sp10Hit.state.enemies[1].armor, 2);
  assert.equal(sp10Hit.summary.manaRefunded, 1);

  // 2. EMPOWER (เสริม, rare) & BLESS (อวยพร, special): user's example phrases & 3-turn buff duration
  const pBlessFire = parseSpell(['bless', 'fire']);
  assert.equal(pBlessFire.ok, true);
  assert.equal(pBlessFire.spell.buffPct, 40);
  assert.equal(pBlessFire.spell.buffTurns, 3);
  assert.equal(pBlessFire.spell.buffPierce, 1);

  const pBlessAkkiLarge = parseSpell(['bless', 'akki', 'large']);
  assert.equal(pBlessAkkiLarge.ok, true);
  assert.equal(pBlessAkkiLarge.spell.buffPct, 90); // 60 * 1.5
  assert.equal(pBlessAkkiLarge.spell.buffTurns, 3);

  const pGrandBlessWari = parseSpell(['grand', 'bless', 'wari']);
  assert.equal(pGrandBlessWari.ok, true);
  assert.equal(pGrandBlessWari.spell.buffPct, 90); // 60 * 1.5
  assert.equal(pGrandBlessWari.spell.buffTurns, 4); // 3 + 1
  assert.equal(pGrandBlessWari.spell.buffPierce, 2); // 1 + 1

  const pEmpowerFire = parseSpell(['empower', 'fire']);
  assert.equal(pEmpowerFire.ok, true);
  assert.equal(pEmpowerFire.spell.buffPct, 25);
  assert.equal(pEmpowerFire.spell.buffTurns, 3);
  assert.equal(pEmpowerFire.spell.buffPierce, 0);

  // Buff lasts exactly 3 turns, boosts matching element attacks (including T2/fusion), does not boost other elements, and saves/loads cleanly
  let bState = battle(['armored']);
  bState.enemies[0].hp = bState.enemies[0].maxHp = 200; // armored has natural armor = 3
  bState.player.maxHp = bState.player.hp = 100;
  bState.player.maxMana = bState.player.mana = 20;
  const bCast = cast(bState, 'bless fire');
  assert.equal(bCast.ok, true);
  assert.deepEqual(bCast.summary.buffApplied, { families: ['fire'], pct: 40, turns: 3, pierce: 1, source: 'bless' });
  assert.equal(bCast.state.player.elementBuffs.fire.pct, 40);
  assert.equal(bCast.state.player.elementBuffs.fire.expires, 4); // cast on turn 1 -> active turns 2, 3, 4

  // Validate save/load with active elementBuffs
  const saveStorage = new MemoryStorage();
  const savable = createRun('buff-save');
  savable.collection = ['bless'];
  savable.learned = ['bless'];
  savable.player.words = ['shot', 'fire', 'ice', 'pair', 'shield', 'bless'];
  savable.player.hand = ['shot', 'fire', 'ice', 'bless', 'shield'];
  savable.enemies[0].hp = savable.enemies[0].maxHp;
  const savedTurn = simulateTurn(savable, ['bless', 'fire']);
  assert.equal(savedTurn.ok, true);
  assert.equal(saveRun(savedTurn.state, saveStorage).ok, true);
  const loadedBuffState = loadRun(saveStorage).state;
  assert.deepEqual(loadedBuffState.player.elementBuffs, savedTurn.state.player.elementBuffs);
  const badBuffState = structuredClone(savedTurn.state);
  badBuffState.player.elementBuffs = { invalid_elem: { pct: 40, expires: 4, source: 'bless' } };
  assert.throws(() => validateRun(badBuffState));

  // Turn 2: Fire shot gets +40% (10 * 1.4 = 14) & +1 pierce (armor 3 -> 2 => 12 dmg!)
  const t2Fire = cast(bCast.state, 'shot fire', 'enemy-0');
  assert.equal(t2Fire.events.find(ev => ev.type === 'damage').amount, 12);
  // Turn 3: Ice shot does NOT get Fire buff (6 base - 3 armor = 3 dmg)
  const t3Ice = cast(t2Fire.state, 'shot ice', 'enemy-0');
  assert.equal(t3Ice.events.find(ev => ev.type === 'damage').amount, 3);
  // Turn 4 (last active turn): Akki (fire family) gets +40% (20 * 1.4 = 28) & +1 pierce (armor 3 -> 2 => 26 dmg), then buff expires!
  const t4Akki = cast(t3Ice.state, 'shot akki', 'enemy-0');
  assert.equal(t4Akki.events.find(ev => ev.type === 'damage').amount, 26);
  assert.equal(t4Akki.state.player.elementBuffs.fire, undefined);
  // Turn 5: Fire shot back to unbuffed (10 - 3 armor = 7 dmg)
  const t5Fire = cast(t4Akki.state, 'shot fire', 'enemy-0');
  assert.equal(t5Fire.events.find(ev => ev.type === 'damage').amount, 7);

  // Bless +10 secondary (bless_sanctuary): +40% lv bonus (80% total), +1 turn (4 turns), +2 pierce (3 total), +15 heal, +20 shield, +2 MP refund
  const bl10 = battle(['armored']);
  bl10.player.maxHp = 100;
  bl10.player.hp = 60;
  bl10.player.maxMana = bl10.player.mana = 20;
  bl10.player.cardUpgrades = { bless: 10 };
  const bl10Res = cast(bl10, 'bless fire');
  assert.equal(bl10Res.summary.buffApplied.pct, 80);
  assert.equal(bl10Res.summary.buffApplied.turns, 4);
  assert.equal(bl10Res.summary.buffApplied.pierce, 3);
  assert.equal(bl10Res.summary.healed, 15);
  assert.equal(bl10Res.summary.secondaryShield, 20);
  assert.equal(bl10Res.summary.manaRefunded, 2);

  // 3. FILL (เติม) + BLOOD (เลือด) / MANA (มานา): strict grammar, stronger heal than heal+self, mana restore, gating, and +10 upgrades
  // Strict grammar rejections
  assert.equal(parseSpell(['blood']).ok, false);
  assert.equal(parseSpell(['mana']).ok, false);
  assert.equal(parseSpell(['fill']).ok, false);
  assert.equal(parseSpell(['grand', 'fill', 'blood']).ok, false);
  assert.equal(parseSpell(['grand', 'fill', 'mana']).ok, false);
  assert.equal(parseSpell(['fill', 'grand', 'blood']).ok, false);
  assert.equal(parseSpell(['large', 'fill', 'blood']).ok, false);
  assert.equal(parseSpell(['fill', 'large', 'blood']).ok, false);
  assert.equal(parseSpell(['fill', 'blood', 'pair']).ok, false);
  assert.equal(parseSpell(['fill', 'mana', 'pair']).ok, false);

  // Valid fill combos
  assert.equal(parseSpell(['fill', 'blood']).ok, true);
  assert.equal(parseSpell(['fill', 'blood', 'large']).ok, true);
  assert.equal(parseSpell(['fill', 'mana']).ok, true);
  assert.equal(parseSpell(['fill', 'mana', 'large']).ok, true);

  // เติม เลือด (7 HP) > ฮีล ตัวเอง (4 HP), เติม เลือด ใหญ่ (12 HP) > ฮีล ใหญ่ (8 HP)
  const hCompare = battle(['armored']);
  hCompare.player.maxHp = 100;
  hCompare.player.hp = 50;
  hCompare.player.maxMana = hCompare.player.mana = 12;
  const healSelfRes = cast(hCompare, 'heal self');
  const fillBloodRes = cast(hCompare, 'fill blood');
  const healLargeRes = cast(hCompare, 'heal large');
  const fillBloodLargeRes = cast(hCompare, 'fill blood large');
  assert.equal(healSelfRes.summary.healed, 4);
  assert.equal(fillBloodRes.summary.healed, 7);
  assert.ok(fillBloodRes.summary.healed > healSelfRes.summary.healed);
  assert.equal(healLargeRes.summary.healed, 8);
  assert.equal(fillBloodLargeRes.summary.healed, 12);
  assert.ok(fillBloodLargeRes.summary.healed > healLargeRes.summary.healed);

  // เติม มานา (+6 MP for 1 MP -> net +5), เติม มานา ใหญ่ (+10 MP for 2 MP -> net +8)
  const mState = battle(['armored']);
  mState.player.maxMana = 20;
  mState.player.mana = 4;
  const fillManaRes = cast(mState, 'fill mana');
  assert.equal(fillManaRes.summary.cost, 1);
  assert.equal(fillManaRes.summary.manaRestored, 6);
  assert.equal(fillManaRes.summary.manaAfterCast, 9); // 4 - 1 + 6 = 9
  const fillManaLargeRes = cast(mState, 'fill mana large');
  assert.equal(fillManaLargeRes.summary.cost, 2);
  assert.equal(fillManaLargeRes.summary.manaRestored, 10);
  assert.equal(fillManaLargeRes.summary.manaAfterCast, 12); // 4 - 2 + 10 = 12

  // Reward pool gating: blood & mana require owning fill
  const gateRun = createRun('fill-gating');
  const poolBefore = getRewardPool(gateRun);
  assert.equal(poolBefore.includes('blood'), false);
  assert.equal(poolBefore.includes('mana'), false);
  gateRun.collection.push('fill');
  const poolAfter = getRewardPool(gateRun);
  assert.equal(poolAfter.includes('blood'), true);
  assert.equal(poolAfter.includes('mana'), true);

  // fill +10 & blood +10: overheal shield + next-turn heal + cross-mana refund
  const fb10 = battle(['armored']);
  fb10.player.maxHp = 100;
  fb10.player.hp = 95;
  fb10.player.maxMana = 20;
  fb10.player.mana = 10;
  fb10.player.cardUpgrades = { fill: 10, blood: 10 };
  const fb10Res = cast(fb10, 'fill blood');
  // Base 7 + 10 (fill) + 10 (blood) = 27 heal -> heals 5 to 100, overflow 22 -> overhealShield = 22!
  assert.equal(fb10Res.summary.healed, 5);
  assert.equal(fb10Res.summary.overhealShield, 22);
  assert.equal(fb10Res.summary.secondaryShield, 14);
  assert.equal(fb10Res.summary.manaRefunded, 2);

  // mana +10: free cast even at 0 MP, +5 extra MP gain (11 total), +12 sec shield, +1 bonus draw, overflow MP ×3 shield!
  const fm10 = battle(['armored']);
  fm10.player.maxMana = 12;
  fm10.player.mana = 0; // 0 MP!
  fm10.player.hand = ['fill', 'mana'];
  fm10.player.cardUpgrades = { mana: 10 };
  const fm10Res = cast(fm10, 'fill mana');
  assert.equal(fm10Res.ok, true);
  assert.equal(fm10Res.summary.cost, 0); // manaFreeCast!
  assert.equal(fm10Res.summary.manaRestored, 11); // 6 + ceil(10/2)=5 = 11
  assert.equal(fm10Res.summary.manaAfterCast, 11);
  assert.equal(fm10Res.summary.secondaryShield, 12);
  // 1 bonus draw + 3 normal turn draw = 4 cards in hand
  assert.equal(fm10Res.state.player.hand.length, 4);
  // Forecast/UI helper parity for free mana fill at 0 MP
  assert.ok(canFormPhraseInHand(fm10, ['fill', 'mana']));
  assert.equal(canFormPhraseInHand(fm10, ['fill', 'mana']).cost, 0);
});









