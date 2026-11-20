import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun,
  enterSanctuary,
  revisitRoom,
  useBattleItem,
  getFloorInfo,
  getFloorStartRoom,
  FLOOR10_BOSS_ROOM,
  FLOOR20_BOSS_ROOM,
  FLOOR21_START_ROOM,
  FLOOR30_BOSS_ROOM,
  FLOOR100_BOSS_ROOM,
  RIFT_TIERS,
  getRiftTierBossRoom,
  getRiftStageRooms,
  isRiftUnlocked,
  isRiftTierUnlocked,
  getRiftDailyCap,
  getRiftDailyStatus,
  getRiftRewardPool,
  startRiftRun,
  hasCardReward,
  UPPER_REWARD_WORDS,
} from '../src/run.js';
import { SECOND_TIER_ELEMENTS, WORDS, START_WORDS } from '../src/words.js';
import { simulateTurn } from '../src/combat.js';
import { saveRun, loadRun, validateRun } from '../src/save.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, val) => map.set(key, String(val)),
    removeItem: key => map.delete(key),
  };
}

function makePostFloorSanctuary(floor, seed = 'rift-test') {
  const state = createRun(seed, false, []);
  const bossRoom = getRiftTierBossRoom(floor);
  state.clearedRooms = Array.from({ length: bossRoom + 1 }, (_, i) => i);
  state.highestRoom = Math.min(state.rooms.length - 1, bossRoom + 1);
  state.room = state.highestRoom;
  state.riftProgressFloor = floor;
  state.sanctuaryUnlocked = true;
  if (floor >= 20) state.sanctuaryPost20Unlocked = true;
  state.sanctuaryFloor = floor === 100 ? 95 : `post${floor}`;
  state.phase = 'sanctuary';
  state.enemies = state.rooms[state.room].map((kind, i) => ({
    id: `enemy-${i}`,
    kind,
    slot: i,
    hp: 0,
    maxHp: 10,
    armor: 0,
    ward: 0,
    affinity: null,
    chill: 0,
    freeze: 0,
    burn: 0,
    burnTurn: 0,
  }));
  return state;
}

test('Rift unlocks at Floor 20 and unlocks tiers 20..100 in steps of 10', () => {
  const early = createRun('rift-unlock-early', false, []);
  early.clearedRooms = Array.from({ length: FLOOR20_BOSS_ROOM }, (_, i) => i);
  early.highestRoom = FLOOR20_BOSS_ROOM;
  assert.equal(isRiftUnlocked(early), false);
  assert.equal(isRiftTierUnlocked(early, 20), false);

  const post20 = makePostFloorSanctuary(20);
  assert.equal(isRiftUnlocked(post20), true);
  assert.equal(isRiftTierUnlocked(post20, 20), true);
  assert.equal(isRiftTierUnlocked(post20, 30), false);
  assert.equal(isRiftTierUnlocked(post20, 100), false);

  const post30 = makePostFloorSanctuary(30);
  assert.equal(isRiftTierUnlocked(post30, 20), true);
  assert.equal(isRiftTierUnlocked(post30, 30), true);
  assert.equal(isRiftTierUnlocked(post30, 40), false);

  const post100 = makePostFloorSanctuary(100);
  for (const tier of RIFT_TIERS) {
    assert.equal(isRiftTierUnlocked(post100, tier), true, `Tier ${tier} should unlock at Floor 100`);
  }
});

test('Rift daily entry quota equals cleared floors and updates live on new floor clears (0/12 -> 2/14)', () => {
  const state = createRun('rift-quota-test', false, []);
  const day1 = new Date('2026-11-19T10:00:00');
  const day2 = new Date('2026-11-20T09:00:00');

  // Clear up to Floor 12 (room 12-3 = startRoom(12) + 2 = 30)
  const floor12Boss = getFloorStartRoom(12) + 2;
  state.clearedRooms = Array.from({ length: floor12Boss + 1 }, (_, i) => i);
  state.highestRoom = floor12Boss + 1;
  assert.equal(getRiftDailyCap(state), 12);
  assert.deepEqual(getRiftDailyStatus(state, day1), {
    date: '2026-11-19',
    used: 0,
    cap: 12,
    remaining: 12,
  });

  // Suppose 12/12 used today -> remaining 0/12
  state.riftDaily = { date: '2026-11-19', used: 12 };
  assert.deepEqual(getRiftDailyStatus(state, day1), {
    date: '2026-11-19',
    used: 12,
    cap: 12,
    remaining: 0,
  });

  // Push to Floor 14 on the same day -> remaining becomes 2/14!
  const floor14Boss = getFloorStartRoom(14) + 2;
  state.clearedRooms = Array.from({ length: floor14Boss + 1 }, (_, i) => i);
  state.highestRoom = floor14Boss + 1;
  assert.deepEqual(getRiftDailyStatus(state, day1), {
    date: '2026-11-19',
    used: 12,
    cap: 14,
    remaining: 2,
  });

  // Next calendar day resets used -> 14/14
  assert.deepEqual(getRiftDailyStatus(state, day2), {
    date: '2026-11-20',
    used: 0,
    cap: 14,
    remaining: 14,
  });
});

test('Each Rift tier 20..100 runs 3 stages: (T-2)-3 mini-boss, (T-1)-3 mini-boss, and T★ Major Boss', () => {
  const base = createRun('rift-stages', false, []);
  for (const tier of RIFT_TIERS) {
    const rooms = getRiftStageRooms(tier);
    assert.equal(rooms.length, 3);
    const info1 = getFloorInfo(rooms[0], base.rooms.length);
    const info2 = getFloorInfo(rooms[1], base.rooms.length);
    const info3 = getFloorInfo(rooms[2], base.rooms.length);
    assert.equal(info1.code, `${tier - 2}-3`, `Tier ${tier} stage 1 should be ${tier - 2}-3`);
    assert.equal(info2.code, `${tier - 1}-3`, `Tier ${tier} stage 2 should be ${tier - 1}-3`);
    assert.equal(info3.floor, tier, `Tier ${tier} stage 3 should be Floor ${tier} Major Boss`);
    assert.equal(info3.isBoss, true);
  }
});

test('Rift reward pool respects tier floor ceiling (20 vs 30 vs 40+)', () => {
  const state = makePostFloorSanctuary(100);
  const pool20 = getRiftRewardPool(state, 20);
  const pool30 = getRiftRewardPool(state, 30);
  const pool40 = getRiftRewardPool(state, 40);

  for (const w of UPPER_REWARD_WORDS) {
    assert.equal(pool20.includes(w), false, `Tier 20 should not contain upper word ${w}`);
    assert.equal(pool30.includes(w), true, `Tier 30 should contain upper word ${w}`);
  }
  for (const elem of Object.keys(SECOND_TIER_ELEMENTS)) {
    assert.equal(pool20.includes(elem), false, `Tier 20 should not contain 2nd-tier element ${elem}`);
    assert.equal(pool30.includes(elem), true, `Tier 30 should contain 2nd-tier element ${elem}`);
  }
  assert.equal(pool20.includes('pull'), false);
  assert.equal(pool30.includes('pull'), false);
  assert.equal(pool40.includes('pull'), true);
});

test('Full 3-stage Rift clear drops 1 random card directly (no 3-choice pick) and saves/loads cleanly', () => {
  const storage = createMemoryStorage();
  const day = new Date('2026-11-19T14:00:00');
  let state = makePostFloorSanctuary(20, 'rift-full-run');
  const originalClearedCount = state.clearedRooms.length;
  const originalHighestRoom = state.highestRoom;

  // Enter Rift Tier 20 -> deducts 1 daily entry (19/20 remaining)
  state = startRiftRun(state, 20, day);
  assert.equal(state.phase, 'battle');
  assert.equal(state.rift.tier, 20);
  assert.equal(state.rift.stage, 0);
  assert.equal(state.room, getRiftStageRooms(20)[0]);
  assert.equal(hasCardReward(state), false);
  assert.equal(getRiftDailyStatus(state, day).remaining, 19);

  // Mid-Rift save/load round-trip must validate cleanly
  assert.equal(saveRun(state, storage).ok, true);
  const midLoaded = loadRun(storage);
  assert.equal(midLoaded.ok, true);
  assert.equal(midLoaded.state.rift.tier, 20);
  assert.equal(midLoaded.state.rift.stage, 0);

  // Defeat Stage 1 (18-3) -> advances to Stage 2 (19-3), still in battle, no reward screen
  for (const e of state.enemies) { e.hp = 1; e.ward = 0; e.armor = 0; }
  state.player.hand = ['shot', 'fire', 'ice', 'pair', 'shield'];
  state.player.mana = 12;
  let res = simulateTurn(state, ['shot', 'fire'], state.enemies[0].id);
  assert.equal(res.ok, true);
  assert.equal(res.summary.riftStageCleared, 1);
  assert.equal(res.state.phase, 'battle');
  assert.equal(res.state.rift.stage, 1);
  assert.equal(res.state.room, getRiftStageRooms(20)[1]);
  state = res.state;

  // Defeat Stage 2 (19-3) via AoE item -> advances to Stage 3 (20★)
  for (const e of state.enemies) { e.hp = 1; e.ward = 0; e.armor = 0; }
  state.player.items = ['ember_scroll'];
  const itemRes = useBattleItem(state, 0);
  assert.equal(itemRes.ok, true);
  assert.equal(itemRes.summary.riftStageCleared, 2);
  assert.equal(itemRes.state.phase, 'battle');
  assert.equal(itemRes.state.rift.stage, 2);
  assert.equal(itemRes.state.room, getRiftStageRooms(20)[2]);
  state = itemRes.state;

  // Defeat Stage 3 (20★) -> immediately grants 1 random card from Tier 20 pool, returns to sanctuary!
  const beforeCollectionSize = state.collection.length;
  for (const e of state.enemies) { e.hp = 1; e.ward = 0; e.armor = 0; }
  state.player.hand = ['shot', 'fire', 'ice', 'pair', 'shield'];
  state.player.mana = 12;
  res = simulateTurn(state, ['shot', 'fire'], state.enemies[0].id);
  assert.equal(res.ok, true);
  assert.ok(res.summary.riftCleared, 'Expected riftCleared summary after Stage 3');
  const reward = res.summary.riftCleared;
  assert.equal(reward.tier, 20);
  assert.ok(Object.hasOwn(WORDS, reward.wordId));
  assert.ok(getRiftRewardPool(state, 20).includes(reward.wordId), 'Dropped card must be within Tier 20 ceiling');
  assert.equal(res.state.phase, 'sanctuary', 'Must skip 3-choice reward screen and return directly to sanctuary');
  assert.equal(res.state.rift, undefined);
  assert.equal(res.state.rewards.length, 0);
  assert.equal(res.state.clearedRooms.length, originalClearedCount);
  assert.equal(res.state.highestRoom, originalHighestRoom);
  assert.equal(res.state.player.relics.length, 0, 'Rift boss must not re-drop tower boss relics');

  if (reward.outcome === 'new') {
    assert.equal(res.state.collection.length, beforeCollectionSize + 1);
    assert.equal(res.state.collection.includes(reward.wordId), true);
  } else if (reward.outcome === 'upgrade') {
    assert.equal(res.state.player.cardUpgrades[reward.wordId], reward.newLevel);
  }

  // Post-Rift sanctuary state validates & saves cleanly
  validateRun(res.state);
  assert.equal(saveRun(res.state, storage).ok, true);
  const postLoaded = loadRun(storage);
  assert.equal(postLoaded.ok, true);
  assert.equal(postLoaded.state.phase, 'sanctuary');
  assert.equal(getRiftDailyStatus(postLoaded.state, day).remaining, 19);
});

test('Defeat or retreat in Rift returns safely to Sanctuary without wiping tower progress', () => {
  const day = new Date('2026-11-19T15:00:00');
  const base = makePostFloorSanctuary(30, 'rift-defeat');
  const expectedCleared = [...base.clearedRooms];
  const expectedHighest = base.highestRoom;

  // Test defeat on Stage 1
  const active = startRiftRun(base, 30, day);
  active.player.hp = 1;
  active.player.shield = null;
  active.turn = 2; // Ensure enemies attack
  const res = simulateTurn(active, 'guard', active.enemies[0].id);
  assert.equal(res.ok, true);
  assert.ok(res.summary.riftFailed, 'Defeat in Rift should set summary.riftFailed');
  assert.equal(res.state.phase, 'sanctuary');
  assert.equal(res.state.rift, undefined);
  assert.deepEqual(res.state.clearedRooms, expectedCleared);
  assert.equal(res.state.highestRoom, expectedHighest);
  assert.equal(getRiftDailyStatus(res.state, day).used, 1, 'Spent entry stays consumed after defeat');
  validateRun(res.state);

  // Test retreat via enterSanctuary
  const active2 = startRiftRun(res.state, 30, day);
  const retreated = enterSanctuary(active2, { floor: 'post30' });
  assert.equal(retreated.phase, 'sanctuary');
  assert.equal(retreated.rift, undefined);
  assert.equal(retreated.room, expectedHighest);
  validateRun(retreated);
});

test('Rift refuses entry when daily quota is exhausted', () => {
  const day = new Date('2026-11-19T16:00:00');
  const state = makePostFloorSanctuary(20, 'rift-empty-quota');
  state.riftDaily = { date: '2026-11-19', used: 20 };
  assert.throws(() => startRiftRun(state, 20, day), /โควต้ารอยแยกวันนี้หมดแล้ว/);
  assert.throws(() => startRiftRun(state, 30, day), /ต้องผ่านบอสใหญ่ชั้น 30/);
});

test('Replaying a cleared floor/room bounces straight back to Sanctuary on victory (spell & item), while uncleared progression advances normally', () => {
  const storage = createMemoryStorage();
  const base = makePostFloorSanctuary(20, 'replay-return-test');
  if (!base.collection.includes('wave')) base.collection.push('wave');
  if (!base.player.words.includes('wave')) base.player.words.push('wave');
  const expectedHighest = base.highestRoom;

  // 1. Replay cleared normal room 6-1 (room 12) from Sanctuary post20 -> winning returns straight to Sanctuary post20
  let replaySub = revisitRoom(base, 12);
  assert.equal(replaySub.phase, 'battle');
  assert.equal(replaySub.room, 12);
  assert.deepEqual(replaySub.replayReturn, { room: expectedHighest, sanctuaryFloor: 'post20' });
  assert.equal(saveRun(replaySub, storage).ok, true);
  assert.deepEqual(loadRun(storage).state.replayReturn, replaySub.replayReturn);

  for (const e of replaySub.enemies) { e.hp = 1; e.ward = 0; e.armor = 0; }
  replaySub.player.hand = ['wave', 'fire', 'shot', 'ice', 'shield'];
  replaySub.player.mana = 12;
  const subWin = simulateTurn(replaySub, ['wave', 'fire'], replaySub.enemies[0].id);
  assert.equal(subWin.ok, true);
  assert.equal(subWin.summary.revisit, true);
  assert.equal(subWin.summary.revisitReturnedToSanctuary, 'post20');
  assert.equal(subWin.state.phase, 'sanctuary');
  assert.equal(subWin.state.sanctuaryFloor, 'post20');
  assert.equal(subWin.state.room, expectedHighest);
  assert.equal(subWin.state.highestRoom, expectedHighest);
  assert.equal(subWin.state.replayReturn, undefined);
  validateRun(subWin.state);

  // 2. Replay cleared Major Boss 10★ (room 24) via AoE item -> returns to Sanctuary post20 (not post10)
  let replayBoss = revisitRoom(subWin.state, FLOOR10_BOSS_ROOM);
  assert.deepEqual(replayBoss.replayReturn, { room: expectedHighest, sanctuaryFloor: 'post20' });
  for (const e of replayBoss.enemies) { e.hp = 1; e.ward = 0; e.armor = 0; }
  replayBoss.player.items = ['ember_scroll'];
  const bossWin = useBattleItem(replayBoss, 0);
  assert.equal(bossWin.ok, true);
  assert.equal(bossWin.summary.revisitReturnedToSanctuary, 'post20');
  assert.equal(bossWin.state.phase, 'sanctuary');
  assert.equal(bossWin.state.sanctuaryFloor, 'post20');
  assert.equal(bossWin.state.room, expectedHighest);
  assert.equal(bossWin.state.replayReturn, undefined);
  validateRun(bossWin.state);

  // 3. Uncleared progression room 21-1 (room 50) from Sanctuary post20 -> advances normally to 21-2 (room 51)
  let advanceRoom = revisitRoom(bossWin.state, FLOOR21_START_ROOM);
  assert.equal(advanceRoom.replayReturn, undefined);
  for (const e of advanceRoom.enemies) { e.hp = 1; e.ward = 0; e.armor = 0; }
  advanceRoom.player.hand = ['wave', 'fire', 'shot', 'ice', 'shield'];
  advanceRoom.player.mana = 12;
  const advanceWin = simulateTurn(advanceRoom, ['wave', 'fire'], advanceRoom.enemies[0].id);
  assert.equal(advanceWin.ok, true);
  assert.equal(advanceWin.state.phase, 'battle');
  assert.equal(advanceWin.state.room, FLOOR21_START_ROOM + 1);
  assert.equal(advanceWin.summary.revisitReturnedToSanctuary, undefined);
});

