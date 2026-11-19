import { WORDS, START_WORDS, STANDALONE_WORDS, fireShieldLayers, parseSpell } from './words.js';
import {
  HAND_LIMIT,
  MAX_CARD_UPGRADE,
  SHOP_ITEMS,
  RELIC_DRAFT_CATALOG,
  getEquippedRelics,
  equipRelic,
  unequipRelic,
  getCardUpgradeLevel,
  ownsRewardWord,
  nextExpForLevel,
  levelUpRewards,
  getFloorInfo,
  FLOOR10_BOSS_ROOM,
  FLOOR20_BOSS_ROOM,
  FLOOR50_BOSS_ROOM,
  FLOOR100_BOSS_ROOM,
  UPPER_RESTS,
  enemyClimaxBonus,
  hasCardReward,
  isBossRoom,
  isRoomRevisit,
  isSanctuaryUnlocked,
  isSanctuary9Unlocked,
  isSanctuaryPost10Unlocked,
  isSanctuary14Unlocked,
  isSanctuary19Unlocked,
  isSanctuaryPost20Unlocked,
  roomsPerFloor,
  discardOverflow,
  createRun,
  createEnemy,
  chooseReward,
  equipWords,
  enterSanctuary,
  moveBeltToStash,
  moveStashToBelt,
  useInventoryItem,
  discardInventoryItem,
  upgradeWordCard,
  revisitRoom,
  useBattleItem,
  buyShopItem,
  ENEMIES,
} from './run.js';
import { simulateTurn, estimateWordCost } from './combat.js';
import { loadRun, saveRun, loadSettings, storeSettings, tutorialSeen, completeTutorial } from './save.js';
import { Battlefield, fizzleLabel } from './render.js';
import { GameAudio } from './audio.js';
import { icon } from './icons.js';
import { RIFT_SPELL_BONUS } from './upper-tower.js';
import { canFormPhraseInHand, computePlayableCombos } from './combos.js';
import {
  $,
  upperCheckpoint,
  checkpointFloor,
  queueFxClassRestart,
  focusAfterRender,
  preserveFocus,
} from './ui/dom.js';
import {
  loadTurnLogs,
  saveTurnLogs as storeTurnLogs,
  loadAccountDiscovered,
  saveAccountDiscovered as storeAccountDiscovered,
} from './ui/storage-discovery.js';
import { renderLog as renderCombatLog } from './ui/combat-log.js';
import {
  CAMERA_SHAKE_CLASSES,
  BATTLE_VIEW_SHAKE_CLASSES,
  resetPlayerHpFx,
  pulsePlayerHud,
  createBattleFxController,
} from './ui/battle-fx.js';
import {
  renderTurnLabel,
  renderRoomTrack,
  updateInventoryNavBadge,
  syncRpgResourceBar as syncResourceBarView,
  syncManaPipsPreview,
  renderBattleStory,
  renderCastFxBanner,
  renderEnemies,
  renderSlots,
  renderQuickCombos,
  renderWordBank,
  renderForecast,
  renderTutorial,
} from './ui/battle-render.js';
import { renderRewards, renderLoadout, renderResult } from './ui/screens-ui.js';
import { renderSanctuary as renderSanctuaryView, bindSanctuaryEvents } from './ui/sanctuary-ui.js';
import { createModalsController } from './ui/modals-ui.js';
import { initDragDrop } from './ui/drag-drop.js';
import { bindCardFilters } from './ui/card-filters.js';

const settings = loadSettings();
let hasStoredSettings = false;
try { hasStoredSettings = localStorage.getItem('spell-foundry.settings.v1') !== null; } catch { /* Settings still work in memory. */ }
if (!hasStoredSettings) settings.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio = new GameAudio(settings);
const battlefield = new Battlefield($('battle-canvas'), settings);
const homeArt = new Battlefield($('home-canvas'), settings);
const sanctuaryMenu = $('sanctuary-menu');
const homeState = createRun('home-art', true);
homeState.rooms[0] = ['warden', 'swarm'];
homeState.enemies = ['warden', 'swarm'].map(createEnemy);
homeArt.set(homeState, null);

let loaded = loadRun();
let state = null;
bindCardFilters(() => state);
let screen = 'home';
let words = [];
let selectedSlot = null;
let targetId = null;
let secondTargetId = null;
let equipped = [];
let lastEnemies = [];
let collection = loaded.state?.collection ?? [];
let busy = false;
let pending = null;
let animationTimer = null;
let castRafBatch1 = 0;
let castRafBatch2 = 0;
let lastEvents = [];
let turnLogs = [];
let toastTimer;
let dismissedRoom = -1;
const collapsedStoryIds = new Set();
let recentRelicDropId = null;
let newSeed = null;
let suppressNextClick = false;
let castFxState = null;
let castFxTimer = null;
let lastJustUnlockedKey = null;

const accountDiscovered = loadAccountDiscovered();
const simCache = new Map();
let comboCache = { sig: '', combos: null };
let workerReqId = 0;
let combatWorker = null;

try {
  if (typeof Worker !== 'undefined') {
    combatWorker = new Worker(new URL('./combat-worker.js', import.meta.url), { type: 'module' });
    combatWorker.addEventListener('message', event => {
      const data = event.data;
      if (!data || !data.ok || data.type !== 'batch-preview') return;
      if (data.reqSig !== getBattleSignature(state)) return;
      const t1 = data.targetId;
      const t2 = data.secondTargetId ?? t1;
      if (data.forecast && data.words?.length) {
        setSimCache(getSimCacheKey(data.reqSig, data.words, t1, t2, false), data.forecast);
      }
      if (data.commitSim && data.words?.length) {
        setSimCache(getSimCacheKey(data.reqSig, data.words, t1, t2, true), data.commitSim);
      }
      if (data.guardSim) {
        setSimCache(getSimCacheKey(data.reqSig, 'guard', t1, t2, true), data.guardSim);
      }
      if (Array.isArray(data.combos)) {
        comboCache = { sig: `${data.reqSig}|${(data.words ?? []).join(' ')}|${accountDiscovered.size}`, combos: data.combos };
      }
    });
  }
} catch { /* Fallback to main-thread memoized simulation if Worker is blocked */ }

function getBattleSignature(s = state) {
  if (!s || !s.player) return '';
  const p = s.player;
  const sh = JSON.stringify(p.shield);
  const en = JSON.stringify(s.enemies);
  const cleared = (s.clearedRooms ?? []).join(',');
  const upg = Object.entries(p.cardUpgrades ?? {}).map(([k, v]) => `${k}:${v}`).join(',');
  const sec = Object.keys(p.cardSecondaryUpgrades ?? {}).filter(k => p.cardSecondaryUpgrades[k]).join(',');
  const rel = getEquippedRelics(p).join(',');
  const bls = (p.blessings ?? []).join(',');
  return `${s.seed}|${s.room}|${s.turn}|${s.rng}|${s.handRng}|${p.hp}|${p.maxHp}|${p.mana}|${p.maxMana}|${p.level ?? 1}|${p.exp ?? 0}|${p.gold ?? 0}|${cleared}|${upg}|${sec}|${rel}|${bls}|${p.hand.join(',')}|${sh}|${en}|${s.magmaPuddles?.join(',') ?? ''}|${s.blackhole?.slot ?? ''}:${s.blackhole?.power ?? ''}|${Boolean(s.deathSpent)}`;
}

function getSimCacheKey(sig, spellInput, t1, t2, allowFizzle) {
  const spellKey = spellInput === 'guard' ? 'guard' : Array.isArray(spellInput) ? spellInput.filter(Boolean).join(' ') : '';
  return `${sig}||${spellKey}||${t1 ?? ''}||${t2 ?? ''}||${allowFizzle ? 1 : 0}`;
}

function setSimCache(key, value) {
  if (simCache.size >= 48) {
    const oldest = simCache.keys().next().value;
    if (oldest !== undefined) simCache.delete(oldest);
  }
  simCache.set(key, value);
}

function getCachedSimulation(s, spellInput, t1, t2 = t1, options = {}) {
  const allowFizzle = Boolean(options?.allowFizzle);
  const sig = getBattleSignature(s);
  const key = getSimCacheKey(sig, spellInput, t1, t2, allowFizzle);
  if (simCache.has(key)) return simCache.get(key);
  const computed = simulateTurn(s, spellInput, t1, t2, options);
  setSimCache(key, computed);
  return computed;
}

function requestWorkerPreview(knownSpell = false) {
  if (!combatWorker || !state || state.phase !== 'battle' || busy) return;
  const reqSig = getBattleSignature(state);
  try {
    combatWorker.postMessage({
      id: ++workerReqId,
      type: 'batch-preview',
      reqSig,
      state,
      words: [...words],
      targetId,
      secondTargetId: secondTargetId ?? targetId,
      knownSpell,
      discoveredKeys: [...accountDiscovered],
    });
  } catch { /* Ignore structured clone errors */ }
}

function saveTurnLogs() {
  storeTurnLogs(state?.seed, turnLogs);
}

function saveAccountDiscovered() {
  storeAccountDiscovered(accountDiscovered);
}

function syncDiscoveredFromState() {
  if (!state?.stats?.discovered) return;
  let changed = false;
  for (const phrase of state.stats.discovered) {
    if (!accountDiscovered.has(phrase)) {
      accountDiscovered.add(phrase);
      changed = true;
    }
  }
  if (changed) saveAccountDiscovered();
}

function isFormulaDiscovered(key) {
  return Boolean(state?.stats?.discovered?.includes(key) || accountDiscovered.has(key));
}

function isKnownValidSpell(wordIds = words) {
  if (!Array.isArray(wordIds) || !wordIds.length || !state) return false;
  const ids = wordIds.filter(Boolean);
  if (!ids.length) return false;
  const key = ids.join(' ');
  if (!STANDALONE_WORDS.includes(key) && !isFormulaDiscovered(key)) return false;
  const parsed = parseSpell(ids, state.player.words);
  if (!parsed.ok) return false;
  if (parsed.spell.form === 'detonate' && !fireShieldLayers(state.player.shield, parsed.spell.element).length) return false;
  return true;
}

function toast(message) {
  const notice = $('toast');
  const layer = screen === 'sanctuary' ? document.querySelector('dialog:modal') ?? document.body : document.body;
  if (notice.parentElement !== layer) layer.append(notice);
  notice.textContent = message;
  notice.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3200);
}

function persist() {
  const result = saveRun(state);
  if (!result.ok) {
    $('storage-warning').textContent = result.error;
    $('storage-warning').hidden = false;
  } else {
    $('storage-warning').hidden = true;
  }
}

function renderLog() {
  renderCombatLog({ state, turnLogs, lastEvents, lastEnemies });
}

const modals = createModalsController({
  getState: () => state,
  getScreen: () => screen,
  getBusy: () => busy,
  accountDiscovered,
  syncDiscoveredFromState,
  renderLog,
});

function recordFormulaDiscovery(parsed, deferStorage = false) {
  if (!parsed?.ok || !state) return false;
  const key = parsed.ids.join(' ');
  const alreadyInRun = state.stats.discovered.includes(key);
  const alreadyKnown = isFormulaDiscovered(key);
  if (!alreadyInRun) {
    state.stats.discovered.push(key);
    if (!deferStorage) persist();
  }
  if (!accountDiscovered.has(key)) {
    accountDiscovered.add(key);
    if (!deferStorage) saveAccountDiscovered();
  }
  modals.updateGuideButtonBadge();
  if (!alreadyKnown) {
    lastJustUnlockedKey = key;
    return true;
  }
  return false;
}

function getPlayableCombos() {
  if (!state?.player || state.player.hand.length > HAND_LIMIT) return [];
  const cacheSig = `${getBattleSignature(state)}|${words.join(' ')}|${accountDiscovered.size}`;
  if (comboCache.sig === cacheSig && Array.isArray(comboCache.combos)) {
    return comboCache.combos;
  }
  const combined = computePlayableCombos(state, words, accountDiscovered);
  comboCache = { sig: cacheSig, combos: combined };
  return combined;
}

function syncRpgResourceBar() {
  syncResourceBarView({ state, screen, busy }, levelUpRewards, nextExpForLevel);
}

function setCastFx(fx) {
  clearTimeout(castFxTimer);
  castFxState = fx;
  renderCastFxBanner(busy, castFxState);
}

function changeScreen(next) {
  if (screen !== next) {
    $('battle-tools').close();
    if (next !== 'battle' || screen !== 'battle') resetPlayerHpFx();
  }
  if (next !== 'sanctuary') sanctuaryMenu.close();
  if (next !== 'battle') {
    try { $('discard-panel')?.close(); } catch {}
    $('discard-panel')?.removeAttribute('open');
  }
  screen = next;
  for (const name of ['home', 'battle', 'reward', 'loadout', 'sanctuary', 'result']) {
    const el = $(`${name}-view`);
    if (el) el.hidden = name !== next;
  }
  audio.active = next !== 'home';
  $('settings-open').disabled = busy;
  document.body.dataset.screen = next;
  for (const id of ['guide-open', 'inventory-open']) $(id).disabled = busy;
}

function showHome() {
  if (busy) return;
  try { $('discard-panel')?.close(); } catch {}
  $('discard-panel')?.removeAttribute('open');
  loaded = loadRun();
  changeScreen('home');
  const saved = loaded.state;
  collection = [...new Set([...collection, ...(saved?.collection ?? [])])];
  $('collection-summary').textContent = collection.length ? `การ์ดที่สะสม ${collection.length} ใบ · ${collection.map(id => WORDS[id].label).join(' · ')}` : '';
  $('continue-run').hidden = !saved;
  $('continue-run').textContent = saved && ['won', 'lost'].includes(saved.phase) ? 'ดูผลรอบล่าสุด' : 'เล่นต่อ';
  if (saved) {
    const fInfo = getFloorInfo(saved.room, saved.rooms.length);
    const locLabel = saved.phase === 'sanctuary'
      ? (upperCheckpoint(saved.sanctuaryFloor)
        ? `จุดพักหลังบอสชั้น ${checkpointFloor(saved.sanctuaryFloor)}`
        : saved.sanctuaryFloor === 'post10'
          ? 'จุดพักพิเศษ (หลังบอสชั้น 10)'
          : `ชั้น ${[4, 9, 14, 19].includes(saved.sanctuaryFloor) ? saved.sanctuaryFloor : 4} (ชั้นพัก & ร้านค้า)`)
      : `ชั้น ${fInfo.floor} ห้อง ${fInfo.code}`;
    $('save-notice').textContent = loaded.error || `เซฟล่าสุด · ${locLabel} · Lv.${saved.player.level ?? 1} · 💰 ${saved.player.gold ?? 0} ทอง · HP ${saved.player.hp}/${saved.player.maxHp}${loaded.recovered ? ' · กู้จากสำเนาก่อนหน้า' : ''}`;
  } else {
    $('save-notice').textContent = loaded.error || '';
  }
  $('storage-warning').hidden = true;
  focusAfterRender(saved ? 'continue-run' : 'new-run');
}

function startRun(seed = null, tutorial = null) {
  const value = seed || Array.from(crypto.getRandomValues(new Uint32Array(1)), x => x.toString(16).toUpperCase().padStart(8, '0'))[0];
  state = createRun(value, tutorial ?? !tutorialSeen(), collection);
  equipped = [...state.player.words];
  words = [];
  selectedSlot = null;
  lastEvents = [];
  turnLogs = [];
  dismissedRoom = -1;
  saveTurnLogs();
  targetId = state.enemies[0].id;
  secondTargetId = null;
  persist();
  renderLog();
  render();
  focusAfterRender('word-shot');
}

function requestNew(seed = null) {
  newSeed = seed;
  if ((state && !['won', 'lost'].includes(state.phase)) || (screen === 'home' && (loaded.state && !['won', 'lost'].includes(loaded.state.phase) || loaded.error))) {
    $('replace-dialog').showModal();
  } else {
    startRun(seed);
  }
}

function restore() {
  loaded = loadRun();
  if (!loaded.state) { toast(loaded.error || 'ยังไม่มีเซฟ'); return; }
  state = loaded.state;
  equipped = [...state.player.words];
  secondTargetId = null;
  words = [];
  selectedSlot = null;
  lastEvents = [];
  turnLogs = loadTurnLogs(state.seed);
  targetId = state.enemies.find(e => e.hp > 0)?.id ?? null;
  if (loaded.recovered) toast('กู้การทดลองจากสำเนาสถานะก่อนหน้าแล้ว');
  renderLog();
  render();
}

const sanctuaryCtx = {
  getState: () => state,
  setState: next => { state = next; },
  getEquipped: () => equipped,
  setEquipped: next => { equipped = next; },
  syncRpgResourceBar,
  getRecentRelicDropId: () => recentRelicDropId,
  syncDiscoveredFromState,
  isFormulaDiscovered,
  accountDiscovered,
  audio,
  persist,
  toast,
  recordFormulaDiscovery,
  saveAccountDiscovered,
  openTools: name => modals.openTools(name),
};

function renderSanctuary() {
  renderSanctuaryView(sanctuaryCtx);
}

function render() {
  if (!state) { showHome(); return; }
  const previous = screen;
  if (state.phase === 'battle') {
    changeScreen('battle');
    preserveFocus(renderBattle);
    if (previous !== 'battle') { scrollTo({ top: 0, behavior: 'instant' }); focusAfterRender('word-shot'); }
  } else if (state.phase === 'reward') {
    changeScreen('reward');
    renderRewards(state, previous !== 'reward');
    if (previous !== 'reward') { scrollTo({ top: 0, behavior: 'instant' }); focusAfterRender(`reward-${state.rewards[0]}`); }
  } else if (state.phase === 'loadout') {
    changeScreen('loadout');
    renderLoadout(state, equipped);
    if (previous !== 'loadout') { scrollTo({ top: 0, behavior: 'instant' }); focusAfterRender('climb-button'); }
  } else if (state.phase === 'sanctuary') {
    changeScreen('sanctuary');
    renderSanctuary();
    if (previous !== 'sanctuary') { scrollTo({ top: 0, behavior: 'instant' }); focusAfterRender('sanctuary-next-room-btn'); }
  } else {
    changeScreen('result');
    renderResult(state, turnLogs, lastEnemies);
    if (previous !== 'result') { scrollTo({ top: 0, behavior: 'instant' }); focusAfterRender('result-new'); }
  }
}

function renderBattle() {
  const p = state.player;
  p.level ??= 1;
  p.exp ??= 0;
  p.gold ??= 0;
  p.items ??= [];
  syncDiscoveredFromState();
  modals.updateGuideButtonBadge();
  const floorInfo = getFloorInfo(state.room, state.rooms.length);
  const revisit = isRoomRevisit(state, state.room);
  const floorArtifact = floorInfo.isBoss ? RELIC_DRAFT_CATALOG.find(relic => relic.dropFloor === floorInfo.floor) : null;
  const isSpecialFloorBoss = Boolean(floorArtifact);
  const specialArtifactName = floorArtifact?.name ?? '';
  const specialArtifactOrder = `ชิ้นที่ ${floorInfo.floor / 10}`;
  const roomTypeLabel = floorInfo.floor >= 21 ? floorInfo.roomRole : isSpecialFloorBoss
    ? `ห้องบอสพิเศษประจำชั้น ${floorInfo.floor}`
    : floorInfo.isBoss
      ? `ห้องบอสประจำชั้น ${floorInfo.floor}`
      : `ห้องย่อยที่ ${floorInfo.sub}/2 (${floorInfo.code})`;
  $('tower-heading-title').textContent = floorInfo.isBoss ? `บอส ${floorInfo.floor}` : floorInfo.floor >= 21 ? `ชั้น ${floorInfo.floor}` : `ห้อง ${floorInfo.code}`;
  $('tower-heading-title').title = roomTypeLabel;
  $('room-subtitle').textContent = revisit
    ? `กำลังวนซ้ำ${roomTypeLabel} · ได้รับทองและ EXP ลดลงเหลือ 20%${floorInfo.isBoss ? (isSpecialFloorBoss ? ' (อาติแฟครับไปแล้ว)' : ' (บอสไม่ดรอปการ์ดคำซ้ำ)') : ''}`
    : isSpecialFloorBoss
      ? `ปราบบอสพิเศษประจำชั้นที่ ${floorInfo.floor} เพื่อรับอาติแฟค${specialArtifactOrder} “${specialArtifactName}” และเปิดทางสู่จุดพักพิเศษ!`
      : isBossRoom(state)
        ? `ปราบบอสประจำชั้น ${floorInfo.floor} เพื่อเลือกการ์ดคำใหม่${floorInfo.floor === 3 ? ' และเปิดทางสู่ชั้นที่ 4 (ชั้นพัก)' : floorInfo.floor === 8 ? ' และเปิดทางสู่ชั้นที่ 9 (ชั้นพัก)' : floorInfo.floor === 13 ? ' และเปิดทางสู่ชั้นที่ 14 (ชั้นพัก)' : floorInfo.floor === 18 ? ' และเปิดทางสู่ชั้นที่ 19 (ชั้นพัก)' : ' และขึ้นสู่ชั้นถัดไป'}`
        : `กำจัดมอนสเตอร์ใน${roomTypeLabel} เพื่อรับทอง + EXP (ผ่านครบ 2 ห้องย่อยจะพบบอสประจำชั้น ${floorInfo.floor})`;
  if (floorInfo.floor >= 21 && !revisit && !isSpecialFloorBoss) {
    $('room-subtitle').textContent = hasCardReward(state) ? 'ชนะศึกเพื่อเลือกการ์ดคำ' : 'ชนะศึกเพื่อรับทองและ EXP';
  }
  renderRoomTrack(state, busy);
  syncRpgResourceBar();
  renderTurnLabel(state);
  if ($('stage-bounty-note')) {
    const climbWarn = floorInfo.floor === 20
      ? ' · หากแพ้บอสชั้น 20 จะร่วงกลับไปพักฟื้นที่ชั้น 19'
      : floorInfo.floor >= 15
        ? ' · หากแพ้ในชั้น 15–18 จะร่วงกลับไปพักชั้น 14 และเริ่มไต่ชั้น 15 ใหม่'
        : floorInfo.floor >= 11
          ? ' · หากแพ้ในชั้น 11–13 จะร่วงกลับไปพักหลังบอส 10 และเริ่มไต่ชั้น 11 ใหม่'
          : floorInfo.floor === 10
            ? ' · หากแพ้บอสชั้น 10 จะร่วงกลับไปพักฟื้นที่ชั้น 9'
            : floorInfo.floor >= 5
              ? ' · หากแพ้ในชั้น 5–8 จะร่วงกลับไปพักชั้น 4 และเริ่มไต่ชั้น 5 ใหม่'
              : '';
    $('stage-bounty-note').textContent = revisit
      ? `วนซ้ำชั้นเดิม: ทอง/EXP เหลือ 20% · ฟื้นมานา +3/เทิร์น${climbWarn}`
      : isSpecialFloorBoss
        ? `บอสพิเศษชั้น ${floorInfo.floor}: ปราบครั้งแรกดรอปอาติแฟค “${specialArtifactName}” · ฟื้นมานา +3/เทิร์น${climbWarn}`
        : floorInfo.isBoss
          ? `ห้องบอสประจำชั้น: ปราบครั้งแรกดรอปการ์ดคำ · ฟื้นมานา +3/เทิร์น${climbWarn}`
          : `ห้องย่อย ${floorInfo.sub}/2: มอนย่อยดรอปทอง + EXP 100% · ฟื้นมานา +3/เทิร์น${climbWarn}`;
    if (floorInfo.floor >= 21) {
      $('stage-bounty-note').textContent = `${revisit ? 'เล่นซ้ำ · ทอง/EXP 20%' : isSpecialFloorBoss ? `ชนะรับอาติแฟค “${specialArtifactName}”` : 'ฟื้นมานา +3/เทิร์น'}${floorInfo.floor >= 31 ? ` · ดาเมจเวท +${RIFT_SPELL_BONUS}%` : ''} · ถ้าแพ้ กลับจุดพักหลังบอส ${Math.floor((floorInfo.floor - 1) / 5) * 5}`;
    }
  }
  $('seed-label').textContent = `SEED ${state.seed}`;
  const parsed = parseSpell(words, p.words);
  const knownSpell = isKnownValidSpell(words);
  const pendingCost = busy || !words.length
    ? 0
    : parsed.ok
      ? parsed.cost
      : estimateWordCost(words, p.words);
  syncManaPipsPreview(state, pendingCost);
  if (!knownSpell || parsed.ids.join(' ') !== lastJustUnlockedKey) lastJustUnlockedKey = null;
  const selectable = state.enemies.filter(enemy => enemy.hp > 0);
  const aimingBlackhole = parsed.ok && parsed.spell.form === 'blackhole';
  const blackholeSelect = $('blackhole-target');
  $('blackhole-target-label').hidden = !aimingBlackhole;
  if (aimingBlackhole) {
    const selected = selectable.find(enemy => enemy.id === targetId);
    if (selected) targetId = `slot-${selected.slot}`;
    blackholeSelect.innerHTML = Array.from({ length: 5 }, (_, slot) => {
      const enemy = selectable.find(candidate => candidate.slot === slot);
      return `<option value="slot-${slot}">ช่อง ${slot + 1} · ${enemy ? ENEMY_LABEL(enemy) : 'ว่าง'}</option>`;
    }).join('');
    if (!targetId?.startsWith('slot-')) targetId = 'slot-2';
    blackholeSelect.value = targetId;
    blackholeSelect.disabled = busy;
  } else if (targetId?.startsWith('slot-')) {
    targetId = selectable.find(enemy => `slot-${enemy.slot}` === targetId)?.id ?? selectable[0]?.id ?? null;
  } else if (!selectable.some(enemy => enemy.id === targetId)) {
    targetId = selectable[0]?.id ?? null;
  }
  if (!selectable.some(enemy => enemy.id === secondTargetId)) secondTargetId = null;
  $('second-target-label').hidden = !knownSpell || !parsed.ok || parsed.spell.shots !== 2;
  const secondSelect = $('second-target');
  secondSelect.innerHTML = '<option value="">ใช้เป้าหมายแรก</option>' + selectable.map(enemy => `<option value="${enemy.id}">${ENEMY_LABEL(enemy)} · ช่อง ${enemy.slot + 1}</option>`).join('');
  secondSelect.value = secondTargetId ?? '';
  secondSelect.disabled = busy;
  const protection = p.shield?.layers.reduce((sum, amount) => sum + amount, 0) ?? 0;
  $('shield-status').textContent = protection ? `${p.shield.effect === 'veil' ? 'ม่าน' : 'โล่'} ${protection} · ${p.shield.layers.length} ชั้น · ถึงเทิร์น ${p.shield.expires}` : '';
  $('shield-status').hidden = !protection;
  const forecast = busy || !knownSpell ? null : getCachedSimulation(state, words, targetId, secondTargetId ?? targetId);
  battlefield.set(state, targetId);
  renderEnemies({ state, battlefield, targetId, busy }, forecast);
  renderCastFxBanner(busy, castFxState);
  renderSlots({ state, words, selectedSlot, busy, castFxState }, parsed, knownSpell);
  renderQuickCombos({ state, words, busy, accountDiscovered, getPlayableCombos, lastJustUnlockedKey }, parsed, knownSpell);
  renderWordBank({ state, words, busy });
  renderForecast({ state, words, busy }, parsed, forecast, knownSpell);
  $('expression').textContent = words.length ? (knownSpell ? 'สูตรที่ค้นพบ' : 'วลีทดลอง') : 'แตะหรือลากไพ่ขึ้นแท่น';
  $('cast-label').textContent = words.length && !knownSpell ? 'ทดลองร่าย' : 'ร่ายคาถา';
  $('move-left').disabled = busy || selectedSlot === null || selectedSlot <= 0 || selectedSlot >= words.length;
  $('move-right').disabled = busy || selectedSlot === null || selectedSlot >= words.length - 1;
  $('remove-word').disabled = busy || selectedSlot === null || selectedSlot >= words.length;
  $('clear-spell').disabled = busy || !words.length;
  $('guard-button').disabled = busy || p.hand.length > HAND_LIMIT;
  $('guard-button').title = `ใช้ 0 มานา กันความเสียหาย ${getEquippedRelics(p).includes('worldloom_50') ? 6 : 3}`;
  for (const id of ['map-open', 'log-open', 'guide-open', 'inventory-open', 'combos-open']) $(id).disabled = busy;
  $('settings-open').disabled = busy;
  $('animation-controls').hidden = !busy;
  renderBattleStory(state, collapsedStoryIds);
  renderTutorial({ state, settings, dismissedRoom });
  renderLog();
  requestWorkerPreview(knownSpell);
}

function ENEMY_LABEL(enemy) {
  return ENEMIES[enemy.kind]?.name ?? enemy.kind;
}

function renderBattleCastStart(parsed, knownSpell) {
  cancelAnimationFrame(castRafBatch1);
  cancelAnimationFrame(castRafBatch2);
  renderCastFxBanner(busy, castFxState);
  renderForecast({ state, words, busy }, parsed, null, knownSpell);
  $('move-left').disabled = true;
  $('move-right').disabled = true;
  $('remove-word').disabled = true;
  $('clear-spell').disabled = true;
  $('guard-button').disabled = true;
  $('settings-open').disabled = true;
  $('second-target').disabled = true;
  $('blackhole-target').disabled = true;
  $('animation-status-text').textContent = 'กำลังร่ายคาถา…';
  $('skip-animation').textContent = 'ข้ามภาพ';
  $('animation-controls').classList.remove('room-cleared');
  $('animation-controls').hidden = false;
  battlefield.set(state, targetId);

  castRafBatch1 = requestAnimationFrame(() => {
    castRafBatch1 = 0;
    if (!busy) return;
    const fxClass = castFxState?.type && !castFxState.isGuard ? `slot-fx-${castFxState.type}` : '';
    document.querySelectorAll('#spell-slots .spell-slot.filled').forEach(slotEl => {
      slotEl.classList.remove('slot-fx-discover', 'slot-fx-success', 'slot-fx-fizzle');
      if (fxClass) slotEl.classList.add(fxClass);
    });
    document.querySelectorAll('#spell-slots button, #word-bank button, #known-shortcuts button, #quick-combos button, #enemy-list .enemy-card, #room-track button, #item-belt-bar button').forEach(btn => {
      btn.disabled = true;
    });
  });
}

function describeWord() {
  const el = $('word-description');
  if (el) {
    el.textContent = '';
    el.hidden = true;
  }
}

function addWord(id, index = selectedSlot) {
  if (busy) return;
  if (state.player.hand.length > HAND_LIMIT) {
    const excess = state.player.hand.length - HAND_LIMIT;
    toast(`⚠️ ไพ่ในมือเกิน ${excess} ใบ (${state.player.hand.length}/${HAND_LIMIT}) · ต้องเลือกทิ้งก่อนเล่นต่อ`);
    try {
      $('battle-tools').close();
      if (!$('discard-panel').open) $('discard-panel').showModal();
    } catch {
      $('discard-panel').setAttribute('open', '');
    }
    updateDiscardUI();
    $('discard-cards')?.querySelector('button')?.focus({ preventScroll: true });
    return;
  }
  const at = index === null ? words.length : Math.min(index, words.length);
  const replacing = words.length >= 4 && at < words.length && words[at] === id;
  if (!replacing && words.filter(word => word === id).length >= state.player.hand.filter(card => card === id).length) {
    toast(`การ์ด “${WORDS[id].label}” ในมือไม่พอ (ถอดจากช่องก่อนหากต้องการย้าย)`);
    return;
  }
  if (words.length >= 4) {
    if (index === null || index >= 4) { toast('ครบสี่ช่องแล้ว ลากทับช่องที่ต้องการเปลี่ยน หรือลากการ์ดเดิมออกก่อน'); return; }
    words[at] = id;
  } else {
    words.splice(at, 0, id);
  }
  selectedSlot = at + 1 < 4 ? at + 1 : null;
  audio.play('place');
  describeWord(id);
  preserveFocus(renderBattle);
}

function removeSlotAt(index) {
  if (busy || index < 0 || index >= words.length) return;
  words.splice(index, 1);
  selectedSlot = words.length ? Math.min(index, words.length - 1) : null;
  audio.play('remove');
  preserveFocus(renderBattle);
}

function editWord(action) {
  if (busy) return;
  if (action === 'clear') {
    words = [];
    selectedSlot = null;
  } else if (selectedSlot !== null && selectedSlot < words.length) {
    if (action === 'remove') {
      words.splice(selectedSlot, 1);
      selectedSlot = words.length ? Math.min(selectedSlot, words.length) : null;
    } else {
      const next = selectedSlot + (action === 'left' ? -1 : 1);
      if (next < 0 || next >= words.length) return;
      [words[next], words[selectedSlot]] = [words[selectedSlot], words[next]];
      selectedSlot = next;
    }
  }
  audio.play('remove');
  preserveFocus(renderBattle);
}

const battleFx = createBattleFxController({
  getState: () => state,
  getTargetId: () => targetId,
  getSettings: () => settings,
  getAudio: () => audio,
  getBattlefield: () => battlefield,
});

function commit(guard = false) {
  if (busy || !state || state.phase !== 'battle') return;
  const parsed = guard ? null : parseSpell(words, state.player.words);
  const result = getCachedSimulation(state, guard ? 'guard' : words, targetId, secondTargetId ?? targetId, { allowFizzle: true });
  if (!result.ok) { toast(result.error); return; }
  const phraseLabel = guard ? 'ป้องกันพื้นฐาน' : words.map(id => WORDS[id]?.label ?? id).join(' ');
  let newlyDiscovered = false;
  if (!guard) {
    if (result.summary.fizzled) {
      lastJustUnlockedKey = null;
      setCastFx({
        type: 'fizzle',
        badge: 'ร่ายเฟล',
        title: fizzleLabel(result.summary.cost),
        detail: phraseLabel,
      });
    } else if (parsed?.ok) {
      const impactDetail = result.summary.damage > 0
        ? `สร้างความเสียหายรวม ${result.summary.damage} หน่วย`
        : result.events.some(event => event.type === 'damage' && event.amount === 0)
          ? 'เกราะกันความเสียหายทั้งหมด'
          : result.summary.wards > 0 ? `ติดม่าน · ลดม่าน ${result.summary.wards} ชั้น`
            : parsed.spell.form === 'blackhole' ? 'หลุมดำจะยุบในเทิร์นถัดไป'
              : parsed.spell.type === 'attack' ? 'สร้างความเสียหาย 0 หน่วย' : 'เวทป้องกัน/สนับสนุนทำงานสำเร็จ';
      newlyDiscovered = recordFormulaDiscovery(parsed, true);
      if (newlyDiscovered) {
        audio.play('discover');
        setCastFx({
          type: 'discover',
          badge: '★ ค้นพบสูตรใหม่!',
          title: `${parsed.expression} (${parsed.cost} มานา)`,
          detail: `${impactDetail} · บันทึกสูตรเข้าตำราคาถาแล้ว`,
        });
      } else {
        audio.play('cast');
        setCastFx({
          type: 'success',
          badge: '✦ ร่ายคาถาสำเร็จ',
          title: `${parsed.expression} (${parsed.cost} มานา)`,
          detail: impactDetail,
        });
      }
    }
  } else {
    const guardAmount = result.events.find(event => event.type === 'shield' && event.shieldKind === 'guard')?.amount ?? 3;
    setCastFx({
      type: 'success',
      isGuard: true,
      badge: '🛡 ตั้งรับพื้นฐาน',
      title: `ตั้งการ์ดป้องกัน (+${guardAmount} เกราะชั่วคราว)`,
      detail: `ลดความเสียหายที่ได้รับในเทิร์นนี้ลง ${guardAmount} หน่วย`,
    });
  }
  const shieldCreated = result.events
    .filter(e => e.type === 'shield')
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const fInfo = getFloorInfo(state.room, state.rooms.length);
  const turnEntry = {
    room: state.room + 1,
    roomCode: fInfo.code,
    totalRooms: state.rooms.length,
    isBoss: isBossRoom(state),
    turn: state.turn,
    climaxBonus: enemyClimaxBonus(state.turn, state.room),
    actionType: guard ? 'guard' : result.summary.fizzled ? 'fizzle' : 'cast',
    expression: guard ? 'ตั้งรับพื้นฐาน' : parsed?.ok && !result.summary.fizzled ? parsed.expression : phraseLabel,
    cost: result.summary.cost ?? 0,
    manaBefore: state.player.mana,
    manaAfter: result.summary.manaAfterCast ?? state.player.mana,
    hpBefore: state.player.hp,
    hpAfter: result.summary.hp ?? result.state.player.hp,
    damage: result.summary.damage ?? 0,
    shieldCreated,
    blocked: result.summary.blocked ?? 0,
    incoming: result.summary.incoming ?? 0,
    healed: (result.summary.healed ?? 0) + (result.summary.roomRecovery ?? 0),
    roomRecovery: result.summary.roomRecovery ?? 0,
    wards: result.summary.wards ?? 0,
    expGain: result.summary.expGain ?? 0,
    goldGain: result.summary.goldGain ?? 0,
    levelUps: result.summary.levelUps ?? [],
    revisit: Boolean(result.summary.revisit),
    roomCleared: state.room !== result.state.room && !result.summary?.fellToFloor && !result.summary?.fellToFloor4 || ['reward', 'won'].includes(result.state.phase) || (result.state.phase === 'sanctuary' && !result.summary?.fellToFloor && !result.summary?.fellToFloor4),
    playerDefeated: result.state.phase === 'lost' || Boolean(result.summary?.fellToFloor || result.summary?.fellToFloor4),
    fellToFloor: result.summary?.fellToFloor ?? (result.summary?.fellToFloor4 ? 4 : null),
    enemies: state.enemies.map(e => ({ id: e.id, kind: e.kind, slot: e.slot })),
    events: result.events,
  };
  turnLogs.unshift(turnEntry);
  if (turnLogs.length > 30) turnLogs.length = 30;
  playTurn(result, parsed, !guard && isKnownValidSpell(words), newlyDiscovered);
}

function playTurn(result, parsed = null, knownSpell = false, newlyDiscovered = false) {
  const openingRoomCleared = !isBossRoom(state) && !isRoomRevisit(state)
    && !result.summary?.fellToFloor && !result.summary?.fellToFloor4
    && (result.state.phase === 'reward' || result.state.room !== state.room && result.state.phase === 'battle');
  const events = openingRoomCleared ? [...result.events, {
    type: 'room-clear',
    code: getFloorInfo(state.room, state.rooms.length).code,
    recovered: result.summary.roomRecovery,
  }] : result.events;
  busy = true;
  pending = result;
  battleFx.beginTurnAnimation(state);
  try {
    lastEvents = result.events;
    lastEnemies = state.enemies;
    for (const enemy of state.enemies) {
      const health = $(`target-${enemy.id}`)?.querySelector('.enemy-hp-text');
      if (health) health.textContent = `${enemy.hp}/${enemy.maxHp}`;
    }
    renderBattleCastStart(parsed, knownSpell);
    const duration = battlefield.animate(
      events,
      battleFx.handleCombatStep,
      finishTurn,
    );
    clearTimeout(animationTimer);
    animationTimer = setTimeout(finishTurn, duration + 60);
    castRafBatch2 = requestAnimationFrame(() => {
      castRafBatch2 = requestAnimationFrame(() => {
        castRafBatch2 = 0;
        const saved = saveRun(result.state);
        if (!saved.ok) { $('storage-warning').textContent = saved.error; $('storage-warning').hidden = false; }
        saveTurnLogs();
        if (newlyDiscovered) saveAccountDiscovered();
      });
    });
  } catch {
    finishTurn();
  }
}

function playItemRoomClear(result) {
  if (state.phase !== 'battle' || isBossRoom(state) || (state.room === result.state.room && result.state.phase !== 'reward')) return false;
  $('battle-tools').close();
  playTurn(result);
  return true;
}

function finishTurn() {
  clearTimeout(animationTimer);
  cancelAnimationFrame(castRafBatch1);
  if ($('canvas-impact-layer')) $('canvas-impact-layer').innerHTML = '';
  if ($('battlefield-wrap')) $('battlefield-wrap').classList.remove(...CAMERA_SHAKE_CLASSES);
  if ($('battle-view')) $('battle-view').classList.remove(...BATTLE_VIEW_SHAKE_CLASSES);
  if (castRafBatch2) {
    cancelAnimationFrame(castRafBatch2);
    castRafBatch2 = 0;
    if (pending) {
      const saved = saveRun(pending.state);
      if (!saved.ok) { $('storage-warning').textContent = saved.error; $('storage-warning').hidden = false; }
      saveTurnLogs();
      saveAccountDiscovered();
    }
  }
  if (!pending) {
    if (busy) { busy = false; render(); }
    return;
  }
  const result = pending;
  pending = null;
  busy = false;
  battlefield.stop();
  const enteredRoom = state.room !== result.state.room;
  state = result.state;
  equipped = [...state.player.words];
  words = [];
  if (enteredRoom) {
    setCastFx(null);
    secondTargetId = null;
    targetId = state.enemies[0]?.id ?? null;
    lastEvents = [];
  }
  if (!state.enemies.some(enemy => enemy.id === targetId && enemy.hp > 0)) {
    targetId = state.enemies.find(enemy => enemy.hp > 0)?.id ?? null;
  }
  selectedSlot = null;
  if (result.summary?.levelUps?.length) {
    const lv = result.summary.levelUps[result.summary.levelUps.length - 1];
    const mpBonusText = lv.mpGain > 0 ? ` · เพิ่ม Max MP +${lv.mpGain}!` : '';
    toast(`🎉 เลเวลอัพเป็น Lv.${lv.level}! เพิ่ม Max HP +${lv.hpGain}${mpBonusText}`);
  }
  if (upperCheckpoint(result.summary?.fellToFloor)) {
    setCastFx(null);
    audio.play('lose');
    toast(`กลับจุดพักหลังบอส ${checkpointFloor(result.summary.fellToFloor)}`);
  } else if (result.summary?.fellToFloor === 19) {
    setCastFx(null);
    audio.play('lose');
    words = [];
    toast('💫 พ่ายแพ้บอสชั้น 20! ร่วงกลับมาพักฟื้นที่ชั้น 19 แล้ว');
  } else if (result.summary?.fellToFloor === 14) {
    setCastFx(null);
    audio.play('lose');
    words = [];
    toast('💫 พ่ายแพ้ระหว่างไต่ชั้น 15–18! ร่วงกลับมาพักฟื้นที่ชั้น 14 แล้ว (ต้องเริ่มไต่ใหม่ตั้งแต่ 15-1)');
  } else if (result.summary?.fellToFloor === 'post10') {
    setCastFx(null);
    audio.play('lose');
    words = [];
    toast('💫 พ่ายแพ้ระหว่างไต่ชั้น 11–13! ร่วงกลับมาพักที่จุดพักหลังบอส 10 แล้ว (ต้องเริ่มไต่ใหม่ตั้งแต่ 11-1)');
  } else if (result.summary?.fellToFloor === 9) {
    setCastFx(null);
    audio.play('lose');
    words = [];
    toast('💫 พ่ายแพ้บอสชั้น 10! ร่วงกลับมาพักฟื้นที่ชั้น 9 แล้ว');
  } else if (result.summary?.fellToFloor4 || result.summary?.fellToFloor === 4) {
    setCastFx(null);
    audio.play('lose');
    words = [];
    toast('💫 พ่ายแพ้ระหว่างไต่ชั้น 5–8! ร่วงกลับมาพักฟื้นที่ชั้น 4 แล้ว (ต้องเริ่มไต่ใหม่ตั้งแต่ 5-1)');
  } else if (result.summary?.relicDropped) {
    recentRelicDropId = result.summary.relicDropped;
    setCastFx(null);
    audio.play('win');
    words = [];
    const dropped = RELIC_DRAFT_CATALOG.find(r => r.id === result.summary.relicDropped);
    toast(`${dropped?.icon ?? '✦'} ปราบบอสชั้น ${dropped?.dropFloor} สำเร็จ! ได้รับอาติแฟค “${dropped?.name}” (${dropped?.summary})${state.phase === 'won' ? ' · กลับจุดพักเพื่อจัดเครื่องราง' : ' · เข้าสู่จุดพักแล้ว'}`);
  } else if (['reward', 'sanctuary', 'won'].includes(state.phase)) {
    setCastFx(null);
    audio.play('win');
    words = [];
  } else if (state.phase === 'lost') {
    setCastFx(null);
    audio.play('lose');
  } else if (castFxState) {
    castFxTimer = setTimeout(() => setCastFx(null), 2800);
  }
  if (state.tutorial && (state.room >= roomsPerFloor(state) || ['won', 'lost'].includes(state.phase))) completeTutorial();
  renderLog();
  render();
  if (state.phase === 'battle') {
    if (state.player.hand.length > HAND_LIMIT) { selectedDiscardIndices.clear(); $('discard-cards').querySelector('button')?.focus({ preventScroll: true }); updateDiscardUI(); }
    else focusAfterRender($('cast-button').disabled ? 'guard-button' : 'cast-button');
  }
}

function updateSettings() {
  settings.music = Number($('music-volume').value) / 100;
  settings.sfx = Number($('sfx-volume').value) / 100;
  settings.ui = Number($('ui-volume').value) / 100;
  settings.reducedMotion = $('reduce-motion').checked;
  settings.tips = $('show-tips').checked;
  applySettings();
  if (!storeSettings(settings)) toast('เก็บการตั้งค่าไม่ได้ แต่ใช้ได้ในแท็บนี้');
}

function applySettings() {
  for (const bus of ['music', 'sfx', 'ui']) {
    $(`${bus}-volume`).value = settings[bus] * 100;
    $(`${bus}-output`).textContent = `${Math.round(settings[bus] * 100)}%`;
  }
  $('reduce-motion').checked = settings.reducedMotion;
  $('show-tips').checked = settings.tips;
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
  battlefield.configure(settings);
  homeArt.configure(settings);
  audio.configure(settings);
  if (state?.phase === 'battle' && screen === 'battle') renderTutorial({ state, settings, dismissedRoom });
}

function refreshActiveScreen() {
  updateInventoryNavBadge(state);
  if (!state) return;
  if (screen === 'battle' && state.phase === 'battle') renderBattle();
  else if (screen === 'sanctuary' && state.phase === 'sanctuary') renderSanctuary();
  else if (screen === 'loadout' && state.phase === 'loadout') renderLoadout(state, equipped);
}

$('hp-icon').innerHTML = icon('heart');
$('mana-icon').innerHTML = icon('mana');
$('tutorial-icon').innerHTML = icon('book');

modals.initStaticGuide();
modals.updateGuideButtonBadge();
bindSanctuaryEvents(sanctuaryCtx);
initDragDrop({
  getBusy: () => busy,
  getWords: () => words,
  getState: () => state,
  setSuppressNextClick: value => { suppressNextClick = value; },
  addWord,
  setSelectedSlot: slot => { selectedSlot = slot; },
  describeWord,
  renderBattle,
  audio,
  removeSlotAt,
});

$('new-run').addEventListener('click', () => requestNew());
$('result-new').addEventListener('click', () => { state = null; startRun(); });
$('result-sanctuary')?.addEventListener('click', () => {
  try {
    const target = state.room >= FLOOR100_BOSS_ROOM ? 95 : state.room === FLOOR50_BOSS_ROOM ? 'post50' : 4;
    state = enterSanctuary(state, { floor: target });
    equipped = [...state.player.words];
    persist(); audio.play('place'); render();
  } catch (error) { toast(error.message); }
});
$('loadout-sanctuary-button')?.addEventListener('click', () => {
  try {
    const latestRiftRest = Object.entries(UPPER_RESTS).findLast(([key, room]) => key !== 'post20' && state.clearedRooms.includes(room));
    const targetFloor = latestRiftRest?.[0] ?? (isSanctuaryPost20Unlocked(state)
      ? 'post20'
      : isSanctuary19Unlocked(state)
        ? 19
        : isSanctuary14Unlocked(state)
          ? 14
          : isSanctuaryPost10Unlocked(state)
            ? 'post10'
            : isSanctuary9Unlocked(state)
              ? 9
              : 4);
    state = enterSanctuary(state, { floor: targetFloor });
    equipped = [...state.player.words];
    persist(); audio.play('place'); render();
  } catch (error) { toast(error.message); }
});
$('confirm-new').addEventListener('click', () => { $('replace-dialog').close(); startRun(newSeed); });
$('continue-run').addEventListener('click', restore);
$('replay-seed').addEventListener('click', () => startRun(state.seed, state.tutorial));
$('brand').addEventListener('click', showHome);
$('result-home').addEventListener('click', showHome);
$('settings-open').addEventListener('click', () => { applySettings(); $('settings-dialog').showModal(); });
$('guide-open').addEventListener('click', () => modals.openTools('tome'));
$('map-open').addEventListener('click', () => modals.openTools('map'));
$('log-open').addEventListener('click', () => modals.openTools('log'));
$('combos-open').addEventListener('click', () => {
  modals.openTools('tome', true);
  $('quick-combos').scrollIntoView({ block: 'nearest' });
});
$('pause-home').addEventListener('click', () => { $('settings-dialog').close(); showHome(); });
$('mute-all').addEventListener('click', () => { settings.music = settings.sfx = settings.ui = 0; applySettings(); storeSettings(settings); });
for (const id of ['music-volume', 'sfx-volume', 'ui-volume', 'reduce-motion', 'show-tips']) $(id).addEventListener('input', updateSettings);
$('move-left').addEventListener('click', () => editWord('left'));
$('move-right').addEventListener('click', () => editWord('right'));
$('remove-word').addEventListener('click', () => editWord('remove'));
$('clear-spell').addEventListener('click', () => editWord('clear'));
$('second-target').addEventListener('change', event => { secondTargetId = event.target.value || null; preserveFocus(renderBattle); });
$('blackhole-target').addEventListener('change', event => { targetId = event.target.value; preserveFocus(renderBattle); });
$('climb-button').addEventListener('click', () => {
  try {
    state = equipWords(state, equipped);
    words = []; selectedSlot = null; secondTargetId = null; targetId = state.enemies[0].id; lastEvents = [];
    persist(); renderLog(); render();
  } catch (error) { toast(error.message); }
});
$('cast-button').addEventListener('click', () => commit());
$('close-discard-btn')?.addEventListener('click', () => {
  try { $('discard-panel').close(); } catch {}
  $('discard-panel').removeAttribute('open');
});
$('discard-panel')?.addEventListener('cancel', () => {
  $('discard-panel').removeAttribute('open');
});

// Dialog explicit close buttons & backdrop tap-to-dismiss for mobile/touch
$('battle-tools')?.querySelector('.dialog-heading button')?.addEventListener('click', () => {
  $('battle-tools').close();
});
$('settings-dialog')?.querySelector('.dialog-heading button')?.addEventListener('click', () => {
  $('settings-dialog').close();
});
$('sanctuary-menu')?.querySelector('.sanctuary-menu-head button')?.addEventListener('click', () => {
  sanctuaryMenu.close();
});

for (const id of ['battle-tools', 'settings-dialog', 'sanctuary-menu', 'discard-panel']) {
  const dialog = $(id);
  if (!dialog) continue;
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      if (id === 'sanctuary-menu') sanctuaryMenu.close();
      else {
        try { dialog.close(); } catch {}
        dialog.removeAttribute('open');
      }
    }
  });
}
$('reopen-discard-btn')?.addEventListener('click', () => {
  try {
    $('battle-tools').close();
    if (!$('discard-panel').open) $('discard-panel').showModal();
  } catch {
    $('discard-panel').setAttribute('open', '');
  }
  updateDiscardUI();
  $('discard-cards')?.querySelector('button')?.focus({ preventScroll: true });
});
const selectedDiscardIndices = new Set();

function updateDiscardUI() {
  if (!state?.player) return;
  const excess = state.player.hand.length - HAND_LIMIT;
  const limit = Math.max(2, excess);
  const cards = $('discard-cards')?.querySelectorAll('[data-discard-index]') ?? [];
  for (const card of cards) {
    const idx = Number(card.dataset.discardIndex);
    const isSelected = selectedDiscardIndices.has(idx);
    const isMaxReached = selectedDiscardIndices.size >= limit;
    card.classList.toggle('is-checked', isSelected);
    card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    card.classList.toggle('is-disabled', !isSelected && isMaxReached);
    const text = card.querySelector('.check-box-text');
    if (text) text.textContent = isSelected ? '✓ ทิ้งใบนี้' : 'เลือกทิ้ง';
  }
  const confirmBtn = $('confirm-discard');
  if (confirmBtn) {
    const count = selectedDiscardIndices.size;
    confirmBtn.disabled = count < excess || count > limit;
    confirmBtn.textContent = count >= excess
      ? `ยืนยันทิ้ง ${count} ใบ`
      : `เลือกทิ้งอีก ${excess - count} ใบ`;
  }
}

$('discard-cards').addEventListener('click', event => {
  const card = event.target.closest('[data-discard-index]');
  if (!card || card.disabled) return;
  const index = Number(card.dataset.discardIndex);
  if (!Number.isInteger(index)) return;
  const excess = state.player.hand.length - HAND_LIMIT;
  const limit = Math.max(2, excess);
  if (selectedDiscardIndices.has(index)) {
    selectedDiscardIndices.delete(index);
    audio.play('remove');
  } else {
    if (selectedDiscardIndices.size >= limit) {
      toast(`เลือกทิ้งได้สูงสุด ${limit} ใบ`);
      return;
    }
    selectedDiscardIndices.add(index);
    audio.play('place');
  }
  updateDiscardUI();
});

$('confirm-discard').addEventListener('click', () => {
  const indices = [...selectedDiscardIndices].sort((a, b) => a - b);
  try {
    state = discardOverflow(state, indices);
    selectedDiscardIndices.clear();
    persist();
    if (state.player.hand.length <= HAND_LIMIT) {
      try { $('discard-panel').close(); } catch {}
      $('discard-panel').removeAttribute('open');
    }
    renderBattle();
    focusAfterRender('guard-button');
    toast(`ทิ้งไพ่ส่วนเกิน ${indices.length} ใบเรียบร้อยแล้ว`);
  } catch (error) { toast(error.message); }
});
$('guard-button').addEventListener('click', () => commit(true));
$('skip-animation').addEventListener('click', finishTurn);
$('dismiss-tip').addEventListener('click', () => { dismissedRoom = state.room; $('tutorial').hidden = true; });
$('battle-canvas').addEventListener('click', event => {
  const id = battlefield.hitTest(event.clientX, event.clientY);
  if (id && !busy && state.player.hand.length <= HAND_LIMIT) {
    targetId = id;
    preserveFocus(renderBattle);
  }
});

document.addEventListener('click', event => {
  audio.unlock();
  const openInvEl = !busy ? event.target.closest('[data-open-inventory]') : null;
  if (openInvEl && !openInvEl.disabled) {
    modals.openTools('bag');
    audio.play('place');
    return;
  }
  const invTabBtn = event.target.closest('[data-inventory-tab]');
  if (invTabBtn) {
    modals.setInventoryTab(invTabBtn.dataset.inventoryTab || 'items');
    audio.play('place');
    modals.renderInventoryModal();
    return;
  }
  const invToStashBtn = !busy ? event.target.closest('[data-inv-to-stash]') : null;
  if (invToStashBtn && !invToStashBtn.disabled && state) {
    try {
      const idx = Number(invToStashBtn.dataset.invToStash);
      const item = SHOP_ITEMS[state.player.items?.[idx]];
      state = moveBeltToStash(state, idx);
      persist(); audio.play('place');
      modals.renderInventoryModal(); refreshActiveScreen();
      toast(`📥 เก็บ “${item?.name ?? 'ไอเทม'}” เข้าคลังกระเป๋าสำรองแล้ว`);
    } catch (error) { toast(error.message); }
    return;
  }
  const invToBeltBtn = !busy ? event.target.closest('[data-inv-to-belt]') : null;
  if (invToBeltBtn && !invToBeltBtn.disabled && state) {
    try {
      const idx = Number(invToBeltBtn.dataset.invToBelt);
      const item = SHOP_ITEMS[state.player.stash?.[idx]];
      state = moveStashToBelt(state, idx);
      persist(); audio.play('place');
      modals.renderInventoryModal(); refreshActiveScreen();
      toast(`📤 ติดตั้ง “${item?.name ?? 'ไอเทม'}” ขึ้นเข็มขัดไอเทมด่วนแล้ว`);
    } catch (error) { toast(error.message); }
    return;
  }
  const invUseBtn = !busy ? event.target.closest('[data-inv-use]') : null;
  if (invUseBtn && !invUseBtn.disabled && state) {
    const [source, rawIdx] = String(invUseBtn.dataset.invUse).split(':');
    try {
      const res = useInventoryItem(state, source, Number(rawIdx));
      if (playItemRoomClear(res)) return;
      if (res.summary?.relicDropped) recentRelicDropId = res.summary.relicDropped;
      state = res.state;
      if (state.phase === 'battle') {
        words = words.filter(id => state.player.hand.includes(id));
        if (res.item.hpRestore) pulsePlayerHud('heal');
        else if (res.item.manaRestore || res.item.id === 'aegis_shard') pulsePlayerHud('shield');
        if (res.item.id === 'ember_scroll') battleFx.pulseBattleCanvasImpact();
        if (!state.enemies.some(e => e.id === targetId && e.hp > 0)) {
          targetId = state.enemies.find(e => e.hp > 0)?.id ?? null;
        }
      }
      persist(); audio.play('discover');
      modals.renderInventoryModal(); render();
      toast(`${res.item.icon} ${res.effectText}`);
    } catch (error) { toast(error.message); }
    return;
  }
  const invDiscardBtn = !busy ? event.target.closest('[data-inv-discard]') : null;
  if (invDiscardBtn && !invDiscardBtn.disabled && state) {
    const [source, rawIdx] = String(invDiscardBtn.dataset.invDiscard).split(':');
    try {
      const res = discardInventoryItem(state, source, Number(rawIdx));
      state = res.state;
      persist(); audio.play('remove');
      modals.renderInventoryModal(); refreshActiveScreen();
      toast(`🗑 ทิ้ง “${res.item?.name ?? 'ไอเทม'}” ออกจากกระเป๋าแล้ว`);
    } catch (error) { toast(error.message); }
    return;
  }
  const shopCardBuyEl = !busy ? event.target.closest('#sanctuary-shop-list [data-buy-item]') : null;
  if (shopCardBuyEl && !shopCardBuyEl.disabled) {
    const itemId = shopCardBuyEl.dataset.buyItem;
    try {
      const item = SHOP_ITEMS[itemId];
      const beltBefore = (state.player.items ?? []).length;
      state = buyShopItem(state, itemId);
      const wentToBelt = (state.player.items ?? []).length > beltBefore;
      persist(); audio.play('discover');
      renderSanctuary(); updateInventoryNavBadge(state);
      for (const id of ['gold-value', 'sanctuary-shop-gold', 'sanctuary-forge-gold', 'sanctuary-gold-pill', 'rpg-resource']) {
        const el = $(id);
        if (el) queueFxClassRestart(el, ['gold-balance-flash'], 'gold-balance-flash');
      }
      toast(
        item.oneTime
          ? `🛒 ซื้อ “${item.name}” สำเร็จ! (−${item.cost} ทอง · สินค้าชิ้นเดียวถูกนำออกจากร้านแล้ว)`
          : wentToBelt
            ? `🛒 ซื้อ “${item.name}” สำเร็จ! (−${item.cost} ทอง · เก็บเข้าเข็มขัดไอเทมด่วนแล้ว)`
            : `🛒 ซื้อ “${item.name}” สำเร็จ! (−${item.cost} ทอง · เก็บเข้าคลังกระเป๋าสำรองแล้ว)`,
      );
    } catch (error) { toast(error.message); }
    return;
  }
  const upgradeBtnEl = !busy ? event.target.closest('[data-upgrade-card]') : null;
  if (upgradeBtnEl && !upgradeBtnEl.disabled && state?.phase === 'sanctuary') {
    const wordId = upgradeBtnEl.dataset.upgradeCard;
    const mode = upgradeBtnEl.dataset.upgradeMode || 'stat';
    try {
      const res = upgradeWordCard(state, wordId, mode);
      state = res.state;
      persist();
      audio.play(res.failed ? 'invalid' : 'discover');
      renderSanctuary(); updateInventoryNavBadge(state);
      const forgeCardEl = document.querySelector(`#sanctuary-upgrade-list [data-forge-card="${wordId}"]`);
      if (forgeCardEl) {
        const fxCls = res.failed
          ? 'forge-fail-shake'
          : (res.milestoneUnlocked || mode === 'secondary')
            ? 'forge-milestone-flash'
            : 'forge-success-flash';
        queueFxClassRestart(forgeCardEl, ['forge-success-flash', 'forge-milestone-flash', 'forge-fail-shake'], fxCls);
      }
      for (const id of ['gold-value', 'sanctuary-shop-gold', 'sanctuary-forge-gold', 'sanctuary-gold-pill']) {
        const el = $(id);
        if (el) queueFxClassRestart(el, ['gold-balance-flash'], 'gold-balance-flash');
      }
      const wordLabel = WORDS[wordId]?.label ?? wordId;
      if (res.failed) {
        toast(`⚠️ ตีบวก “${wordLabel} +${res.attemptedLevel}” พลาด! (โอกาสสำเร็จ ${res.chancePercent}% · การ์ดไม่แตก คงอยู่ที่ +${res.newLevel})`);
      } else if (mode === 'secondary') {
        toast(`🌟 ปลุกพลังการ์ด “${wordLabel}” สำเร็จ! ปลดล็อก ${res.effect.label} (−${res.goldCost} ทอง)`);
      } else if (res.milestoneUnlocked && res.secondaryEffect) {
        toast(`🌟 ตีบวก “${wordLabel} +${res.newLevel}” สำเร็จ! ปลดล็อกเอฟเฟกต์รอง ${res.secondaryEffect.tierTag}: ${res.secondaryEffect.label}!`);
      } else if (res.usedStone) {
        toast(`⚒️ ตีบวกการ์ด “${wordLabel} +${res.newLevel}” สำเร็จด้วยหินตีบวกอักษร! (โอกาส ${res.chancePercent}% · ${res.effect})`);
      } else {
        toast(`⚒️ ตีบวกการ์ด “${wordLabel} +${res.newLevel}” สำเร็จ! (โอกาส ${res.chancePercent}% · ${res.effect} · −${res.goldCost} ทอง)`);
      }
    } catch (error) { toast(error.message); }
    return;
  }
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.grimoireTab) {
    modals.setGrimoireTab(button.dataset.grimoireTab);
    audio.play('place');
    modals.renderGrimoire();
    return;
  }
  if (button.dataset.grimoireCombo) {
    if (busy || screen !== 'battle' || state?.phase !== 'battle') return;
    const recipe = canFormPhraseInHand(state, button.dataset.grimoireCombo.split(' '));
    if (!recipe) return;
    words = [...recipe.ids];
    selectedSlot = null;
    $('battle-tools').close();
    audio.play('place');
    describeWord(words[0]);
    preserveFocus(renderBattle);
    return;
  }
  if (button.dataset.toggleStory) {
    const storyId = button.dataset.toggleStory;
    if (collapsedStoryIds.has(storyId)) collapsedStoryIds.delete(storyId);
    else collapsedStoryIds.add(storyId);
    audio.play('place');
    renderBattleStory(state, collapsedStoryIds);
    return;
  }
  if (busy) return;
  if (button.dataset.enterSanctuary !== undefined) {
    try {
      const raw = button.dataset.enterSanctuary;
      const targetFloor = raw === 'post10' || upperCheckpoint(raw) ? raw : Number(raw);
      state = enterSanctuary(state, { floor: targetFloor });
      $('battle-tools').close();
      sanctuaryMenu.close();
      $('sanctuary-floor-select').value = '';
      equipped = [...state.player.words];
      words = []; selectedSlot = null;
      persist(); audio.play('place'); render();
      toast(upperCheckpoint(targetFloor)
        ? `🏕 เดินทางเข้าสู่จุดพักหลังบอสชั้น ${checkpointFloor(targetFloor)}`
        : targetFloor === 'post10'
          ? '🏕 เดินทางเข้าสู่จุดพักพิเศษหลังบอสชั้น 10 (ร้านค้า & แท่นตีบวก)'
          : `🏕 เดินทางเข้าสู่ชั้นที่ ${targetFloor}: ชั้นพักจอมเวท & ร้านค้าเวทมนตร์`);
    } catch (error) { toast(error.message); }
    return;
  }
  if (button.dataset.revisitRoom !== undefined) {
    const targetRoom = Number(button.dataset.revisitRoom);
    try {
      const fInfo = getFloorInfo(targetRoom, state.rooms.length);
      const wasCleared = isRoomRevisit(state, targetRoom);
      state = revisitRoom(state, targetRoom);
      recentRelicDropId = null;
      $('battle-tools').close();
      sanctuaryMenu.close();
      $('sanctuary-floor-select').value = '';
      words = []; selectedSlot = null; secondTargetId = null; targetId = state.enemies[0]?.id ?? null; lastEvents = [];
      persist(); audio.play('place'); renderLog(); render();
      toast(wasCleared
        ? `🧭 วนกลับไปห้อง ${fInfo.code} (ห้องที่ผ่านแล้ว: ได้รับทอง/EXP 20%${fInfo.isBoss ? ' · บอสไม่ดรอปการ์ดคำซ้ำ' : ''})`
        : fInfo.floor >= 21 ? `⚔ เดินทางสู่ชั้น ${fInfo.floor}` : `⚔ เดินทางสู่ชั้น ${fInfo.floor} ห้อง ${fInfo.code}!`);
    } catch (error) { toast(error.message); }
    return;
  }
  if (button.dataset.equipRelic) {
    const relicId = button.dataset.equipRelic;
    try {
      state = equipRelic(state, relicId);
      const relic = RELIC_DRAFT_CATALOG.find(r => r.id === relicId);
      persist(); audio.play('place');
      preserveFocus(renderSanctuary);
      toast(`🔮 สวมใส่ “${relic?.name ?? relicId}” ลงในช่องเครื่องรางแล้ว (${relic?.summary ?? ''})`);
    } catch (error) { toast(error.message); }
    return;
  }
  if (button.dataset.unequipRelic) {
    const relicId = button.dataset.unequipRelic;
    try {
      state = unequipRelic(state, relicId);
      const relic = RELIC_DRAFT_CATALOG.find(r => r.id === relicId);
      persist(); audio.play('remove');
      preserveFocus(renderSanctuary);
      toast(`📦 ถอด “${relic?.name ?? relicId}” ออกจากช่องเครื่องรางเก็บเข้าคลังแล้ว`);
    } catch (error) { toast(error.message); }
    return;
  }
  if (button.dataset.useItem !== undefined) {
    const idx = Number(button.dataset.useItem);
    try {
      const res = useBattleItem(state, idx);
      if (playItemRoomClear(res)) return;
      if (res.summary?.relicDropped) recentRelicDropId = res.summary.relicDropped;
      state = res.state;
      words = words.filter(id => state.player.hand.includes(id));
      if (res.item.hpRestore) pulsePlayerHud('heal');
      else if (res.item.manaRestore || res.item.id === 'aegis_shard') pulsePlayerHud('shield');
      if (res.item.id === 'ember_scroll') battleFx.pulseBattleCanvasImpact();
      if (!state.enemies.some(e => e.id === targetId && e.hp > 0)) {
        targetId = state.enemies.find(e => e.hp > 0)?.id ?? null;
      }
      persist(); audio.play('discover');
      const droppedRelic = res.summary?.relicDropped
        ? RELIC_DRAFT_CATALOG.find(r => r.id === res.summary.relicDropped)
        : null;
      toast(droppedRelic
        ? `${droppedRelic.icon} ปราบบอสชั้น ${droppedRelic.dropFloor} สำเร็จ! ได้รับอาติแฟค “${droppedRelic.name}”${state.phase === 'won' ? ' · กลับจุดพักเพื่อจัดเครื่องราง' : ' · เข้าสู่จุดพักแล้ว'}`
        : `${res.item.icon} ${res.effectText}`);
      render();
    } catch (error) { toast(error.message); }
    return;
  }
  if (button.dataset.sanctuaryEquip && state.phase === 'sanctuary') {
    const id = button.dataset.sanctuaryEquip;
    const cap = Math.min(7, START_WORDS.length + state.learned.length);
    if (equipped.includes(id)) equipped = equipped.filter(word => word !== id);
    else if (equipped.length < cap) equipped.push(id);
    else { toast('ถอดการ์ดหนึ่งใบก่อนเลือกใบใหม่'); return; }
    preserveFocus(renderSanctuary);
    return;
  }
  if (button.dataset.removeSlot !== undefined) {
    removeSlotAt(Number(button.dataset.removeSlot));
    return;
  }
  if (button.dataset.lockedCombo) {
    toast(`สูตรยังไม่ถูกค้นพบ (${button.dataset.lockedCombo}) · ต้องเรียงคำแล้วกด “ร่ายคาถา” เพื่อปลดล็อก (ระวัง: ผิดสูตรเสียมานาฟรี)`);
    return;
  }
  if (button.dataset.combo) {
    words = button.dataset.combo.split(' ');
    selectedSlot = null;
    $('battle-tools').close();
    audio.play('place');
    describeWord(words[0]);
    preserveFocus(renderBattle);
    return;
  }
  if (suppressNextClick && (button.dataset.word || button.dataset.selectSlot !== undefined)) {
    suppressNextClick = false;
    return;
  }
  if (button.dataset.word) addWord(button.dataset.word);
  if (button.dataset.selectSlot !== undefined) {
    selectedSlot = Number(button.dataset.selectSlot);
    if (words[selectedSlot]) describeWord(words[selectedSlot]);
    preserveFocus(renderBattle);
  }
  if (button.dataset.target) {
    targetId = button.dataset.target;
    audio.play('place');
    preserveFocus(renderBattle);
  }
  if (button.dataset.reward && state.phase === 'reward') {
    try {
      const id = button.dataset.reward;
      const duplicate = ownsRewardWord(state, id);
      const previousLevel = getCardUpgradeLevel(state, id);
      state = chooseReward(state, id);
      collection = [...state.collection];
      equipped = [...state.player.words];
      persist(); audio.play('place'); render();
      if (duplicate) {
        toast(previousLevel < MAX_CARD_UPGRADE
          ? `${WORDS[id].label} อัปเกรดเป็น +${getCardUpgradeLevel(state, id)}`
          : 'การ์ดเต็ม +10 · รับ 20 ทอง');
      }
    } catch (error) { toast(error.message); }
  }
  if (button.dataset.equip && state.phase === 'loadout') {
    const id = button.dataset.equip;
    if (equipped.includes(id)) equipped = equipped.filter(word => word !== id);
    else if (equipped.length < Math.min(7, START_WORDS.length + state.learned.length)) equipped.push(id);
    else { toast('ถอดการ์ดหนึ่งใบก่อนเลือกใบใหม่'); return; }
    preserveFocus(() => renderLoadout(state, equipped));
  }
});

document.addEventListener('keydown', event => { if (event.key === 'Escape' && busy) finishTurn(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && busy) finishTurn(); });
window.addEventListener('pagehide', () => { audio.active = false; });
window.addEventListener('pageshow', () => { audio.active = screen !== 'home'; });
for (const [id, glyph, label] of [
  ['guide-open', 'book', 'ตำราคาถา'],
  ['inventory-open', 'bag', 'กระเป๋า'],
  ['map-open', 'map', 'แผนที่'],
  ['log-open', 'log', 'บันทึกการต่อสู้'],
]) {
  $(id).classList.add('icon-button');
  $(id).innerHTML = icon(glyph);
  $(id).setAttribute('aria-label', label);
  $(id).setAttribute('aria-haspopup', 'dialog');
  $(id).title = label;
}
applySettings();
try { $('discard-panel')?.close(); } catch {}
$('discard-panel')?.removeAttribute('open');
showHome();
