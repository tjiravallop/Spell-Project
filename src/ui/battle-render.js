import { WORDS, BATTLE_LIMITED_WORDS, CREATURE_WORDS, elementFamily, fireShieldLayers, SECOND_TIER_ELEMENTS, FUSED_ELEMENTS, ELEMENT_VULNERABILITY, ELEMENT_SECONDARY_VULNERABILITY, ELEMENT_LABELS, ELEMENT_GLYPHS, ELEMENT_ICONS } from '../words.js';
import {
  getHandLimit,
  battleSpellCost,
  isAscensionActive,
  getMaxMana,
  MAX_BELT_ITEMS,
  MAX_STASH_ITEMS,
  SHOP_ITEMS,
  FLOOR10_BOSS_ROOM,
  FLOOR11_START_ROOM,
  FLOOR20_BOSS_ROOM,
  FLOOR21_START_ROOM,
  FLOOR30_BOSS_ROOM,
  FLOOR31_START_ROOM,
  FLOOR40_BOSS_ROOM,
  FLOOR50_BOSS_ROOM,
  FLOOR60_BOSS_ROOM,
  FLOOR70_BOSS_ROOM,
  FLOOR80_BOSS_ROOM,
  FLOOR90_BOSS_ROOM,
  FLOOR100_BOSS_ROOM,
  ETERNITY_PHASE_HP,
  UPPER_RESTS,
  firstClimaxTurn,
  enemyClimaxBonus,
  getFloorInfo,
  getFloorStartRoom,
  isSanctuaryFloorUnlocked,
  isSanctuaryUnlocked,
  isSanctuary9Unlocked,
  isSanctuaryPost10Unlocked,
  isSanctuary14Unlocked,
  isSanctuary19Unlocked,
  isSanctuaryPost20Unlocked,
  ENEMIES,
  NETHER_PILLAR_KINDS,
  intent,
} from '../run.js';
import { estimateWordCost } from '../combat.js';
import { icon } from '../icons.js';
import { RIFT_EXPOSED_BONUS, isRiftBossExposed } from '../upper-tower.js';
import { MIDDLE_ENEMIES } from '../middle-tower.js';
import { getBattleStory } from '../story.js';
import { ENEMY_TRAITS } from '../enemy-traits.js';
import { canFormCardsInHand, canFormPhraseInHand, describeFormulaEffect } from '../combos.js';
import {
  $,
  escape,
  restLocationLabel,
  cardMeta,
  rarityClass,
  playingCardFace,
} from './dom.js';
import { renderPlayerHp, renderPlayerMana } from './battle-fx.js';

export function renderTurnLabel(state) {
  const el = $('turn-label');
  if (!el || !state) return;
  const turn = state.turn;
  const climaxTurn = firstClimaxTurn(state.room);
  const climaxBonus = enemyClimaxBonus(turn, state.room);
  const ascendedTurn = isAscensionActive(state);
  const turnsUntilClimax = Math.max(0, climaxTurn - turn);
  const stateClass = turnsUntilClimax === 0 ? 'turn-climax' : turnsUntilClimax === 1 ? 'turn-critical' : turnsUntilClimax === 2 ? 'turn-caution' : 'turn-calm';
  el.className = `turn-label ${stateClass}${ascendedTurn ? ' turn-ascension' : ''}`;
  const pips = Array.from({ length: climaxTurn - 1 }, (_, i) => {
    const step = i + 1;
    const filled = turn >= step;
    const current = turn === step;
    const warn = step >= climaxTurn - 2 && filled;
    return `<i class="turn-pip ${filled ? 'filled' : ''} ${current ? 'current' : ''} ${warn ? 'warn' : ''}"></i>`;
  }).join('') + `<i class="turn-pip climax-pip ${climaxBonus > 0 ? 'active' : turnsUntilClimax === 1 ? 'imminent' : ''}"></i>`;
  const frequency = state.room >= FLOOR31_START_ROOM ? 'ทุก 2 เทิร์น' : 'ทุกเทิร์น';
  let statusText = `ศัตรูคลั่งเทิร์น ${climaxTurn}`;
  let titleText = `เทิร์น ${turn} · ศัตรูเริ่มคลั่งเทิร์น ${climaxTurn} และโจมตีแรงขึ้น 1 หน่วย ${frequency}`;
  if (turnsUntilClimax === 2) {
    statusText = 'อีก 2 เทิร์นก่อนศัตรูคลั่ง';
  } else if (turnsUntilClimax === 1) {
    statusText = 'เทิร์นหน้าศัตรูโจมตีแรงขึ้น';
  } else if (climaxBonus > 0) {
    statusText = `ศัตรูคลั่ง +${climaxBonus}`;
    titleText = `ศัตรูโจมตีแรงขึ้น +${climaxBonus} หน่วย · เพิ่ม +1 ${frequency}`;
  }
  if (ascendedTurn) {
    statusText = 'จุติ +10 · ร่ายฟรี';
    titleText = 'การ์ดในมือเป็น +10 ชั่วคราวและร่ายคาถาฟรีในเทิร์นนี้';
  }
  el.title = titleText;
  el.setAttribute('aria-label', `เทิร์น ${turn} ${statusText} ${turnsUntilClimax > 0 ? `เหลือ ${turnsUntilClimax} เทิร์นก่อนคลั่ง` : ''}`);
  el.innerHTML = `<span class="turn-pips" aria-hidden="true">${pips}</span><strong class="turn-num">เทิร์น ${turn}</strong><span class="turn-sep" aria-hidden="true">·</span><span class="turn-status">${statusText}</span>`;
}

export function renderRoomTrack(state, busy) {
  const trackEl = $('room-track');
  if (!trackEl || !state) return;
  const cleared = state.clearedRooms ?? [];
  const rewardedBosses = state.rewardedBossRooms ?? [];
  const highest = Math.max(state.highestRoom ?? 0, state.room);
  const activeFloorInfo = state.phase === 'battle' ? getFloorInfo(state.room, state.rooms.length) : null;
  const currentSanctuaryFloor = state.phase === 'sanctuary' ? (state.sanctuaryFloor ?? 4) : null;

  const renderFloorCluster = floorNum => {
    const startIdx = getFloorStartRoom(floorNum);
    const roomCount = getFloorInfo(startIdx, state.rooms.length).perFloor;
    const nodes = Array.from({ length: roomCount }, (_, subOffset) => {
      const idx = startIdx + subOffset;
      if (idx >= state.rooms.length) return '';
      const info = getFloorInfo(idx, state.rooms.length);
      const isCurrent = state.phase === 'battle' && idx === state.room;
      const isCleared = cleared.includes(idx);
      const isUnlocked = idx <= highest || isCleared;
      const stateCls = isCurrent ? 'current' : isCleared ? 'done' : isUnlocked ? 'unlocked' : 'locked';
      const nodeLabel = info.isBoss ? `บอส ${floorNum}★` : info.code;
      const roomName = info.title;
      const alreadyGotBossCard = rewardedBosses.includes(idx);
      const titleText = isCleared
        ? `${roomName} · ผ่านแล้ว (คลิกเพื่อวนกลับไปซ้ำ: ทอง/EXP เหลือ 20%${info.isBoss ? ' · บอสไม่ดรอปการ์ดคำซ้ำ' : ''})`
        : isCurrent
          ? `ตำแหน่งปัจจุบัน: ${roomName}`
          : isUnlocked
            ? `${roomName} · คลิกเพื่อเดินทางไปห้องนี้${info.isBoss && alreadyGotBossCard ? ' (รับการ์ดแล้ว · ดรอปทอง/EXP)' : ''}`
            : `${roomName} · ต้องผ่านห้องก่อนหน้าเพื่อปลดล็อก`;
      return `<button type="button" class="room-node ${stateCls} ${info.isBoss ? 'boss-node' : ''}" data-revisit-room="${idx}" ${!isUnlocked || busy ? 'disabled' : ''} ${isCurrent ? 'aria-current="step"' : ''} title="${titleText}" aria-label="${titleText}"><span class="room-code">${nodeLabel}</span>${isCleared && !isCurrent ? '<i class="room-check">✓</i>' : ''}</button>`;
    }).join('');
    return `<div class="floor-cluster ${activeFloorInfo?.floor === floorNum ? 'active-floor' : ''}"><span class="floor-cluster-label">ชั้น ${floorNum}${roomCount > 1 ? ` <small>(${roomCount - 1} ย่อย+1 บอส)</small>` : ''}</span><div class="floor-cluster-nodes">${nodes}</div></div>`;
  };

  const renderSanctuaryCluster = (floorKey, shortLabel, lockedLabel, unlocked, titleUnlocked, titleLocked, clusterTitle, clusterSub) => {
    const cls = currentSanctuaryFloor === floorKey ? 'current' : unlocked ? 'unlocked' : 'locked';
    const title = unlocked ? titleUnlocked : titleLocked;
    const label = unlocked ? shortLabel : lockedLabel;
    return `<div class="floor-cluster sanctuary-cluster ${currentSanctuaryFloor === floorKey ? 'active-floor' : ''}"><span class="floor-cluster-label">${clusterTitle} <small>(${clusterSub})</small></span><div class="floor-cluster-nodes"><button type="button" class="room-node sanctuary-node ${cls}" data-enter-sanctuary="${floorKey}" ${!unlocked || busy ? 'disabled' : ''} title="${title}" aria-label="${title}">${label}</button></div></div>`;
  };

  const zoneParts = [];
  const totalZones = Math.ceil(state.rooms.length / 25);
  for (let d = 0; d < totalZones; d++) {
    const baseFloor = d * 10;
    // 1-4
    for (let f = 1; f <= 4; f++) {
      const floorNum = baseFloor + f;
      const startIdx = getFloorStartRoom(floorNum);
      if (startIdx < state.rooms.length) zoneParts.push(renderFloorCluster(floorNum));
    }
    // Mid sanctuary: baseFloor + 5
    const midSanct = baseFloor + 5;
    const midBoundary = d * 25 + 11;
    if (midBoundary < state.rooms.length) {
      const unlocked = isSanctuaryFloorUnlocked(state, midSanct);
      zoneParts.push(renderSanctuaryCluster(
        midSanct,
        `🏕 ชั้นพัก ${midSanct}`,
        `🔒 ชั้น ${midSanct} (ผ่าน ${baseFloor + 1}–${baseFloor + 4})`,
        unlocked,
        `เดินทางไปชั้นที่ ${midSanct}: ชั้นพักจอมเวท & ร้านค้าเวทมนตร์ (แพ้ในชั้น ${baseFloor + 6}–${baseFloor + 9} จะร่วงกลับมาพักที่นี่)`,
        `🔒 ชั้นที่ ${midSanct} (ชั้นพัก) · ต้องผ่านด่านชั้น ${baseFloor + 1}–${baseFloor + 4} ให้ครบก่อนจึงจะเข้าได้`,
        `ชั้น ${midSanct}`,
        'ชั้นพัก',
      ));
    }
    // 6-9
    for (let f = 6; f <= 9; f++) {
      const floorNum = baseFloor + f;
      const startIdx = getFloorStartRoom(floorNum);
      if (startIdx < state.rooms.length) zoneParts.push(renderFloorCluster(floorNum));
    }
    // Pre-boss sanctuary: `pre${baseFloor + 10}`
    const bossFloor = baseFloor + 10;
    const preBossKey = `pre${bossFloor}`;
    const preBoundary = d * 25 + 23;
    if (preBoundary < state.rooms.length) {
      const unlocked = isSanctuaryFloorUnlocked(state, preBossKey);
      zoneParts.push(renderSanctuaryCluster(
        preBossKey,
        `🏕 จุดพักก่อนบอส ${bossFloor}`,
        `🔒 พักก่อนบอส ${bossFloor}`,
        unlocked,
        `เดินทางไปจุดพักก่อนท้าทายบอสใหญ่ชั้น ${bossFloor} (แพ้บอสจะร่วงกลับมาพักที่นี่)`,
        `🔒 จุดพักก่อนบอสใหญ่ชั้น ${bossFloor} · ต้องผ่านด่านชั้น ${baseFloor + 6}–${baseFloor + 9} ให้สำเร็จก่อน`,
        `ก่อนบอส ${bossFloor}`,
        'จุดพัก',
      ));
    }
    // Major Boss Floor: bossFloor
    const bossRoom = d * 25 + 24;
    if (bossRoom < state.rooms.length) {
      zoneParts.push(renderFloorCluster(bossFloor));
    }
    // Post-boss sanctuary: `post${bossFloor}`
    if (bossRoom < state.rooms.length) {
      const postBossKey = `post${bossFloor}`;
      const unlocked = isSanctuaryFloorUnlocked(state, postBossKey);
      zoneParts.push(renderSanctuaryCluster(
        postBossKey,
        `🏕 พักหลังบอส ${bossFloor}`,
        `🔒 พักหลังบอส ${bossFloor}`,
        unlocked,
        `จุดพักพิเศษหลังพิชิตบอสใหญ่ชั้น ${bossFloor}`,
        `🔒 จุดพักหลังบอส ${bossFloor} · ต้องพิชิตบอสใหญ่ชั้น ${bossFloor} เพื่อเปิดจุดพักนี้`,
        `หลังบอส ${bossFloor}`,
        'จุดพักพิเศษ',
      ));
    }
  }
  trackEl.innerHTML = zoneParts.join('');
}

export function updateInventoryNavBadge(state) {
  const navBtn = $('inventory-open');
  if (!navBtn) return;
  const beltCount = state?.player.items?.length ?? 0;
  const stashCount = state?.player.stash?.length ?? 0;
  navBtn.title = `กระเป๋า · ${beltCount + stashCount}/${MAX_BELT_ITEMS + MAX_STASH_ITEMS} ชิ้น`;
  navBtn.dataset.count = beltCount + stashCount || '';
}

export function renderItemBelt({ state, screen, busy }) {
  const bar = $('item-belt-bar');
  updateInventoryNavBadge(state);
  if (!bar || !state) return;
  const items = state.player.items ?? [];
  const slotsHtml = Array.from({ length: MAX_BELT_ITEMS }, (_, idx) => {
    const itemId = items[idx];
    const item = itemId ? SHOP_ITEMS[itemId] : null;
    if (!item) {
      return `<button type="button" class="belt-slot empty" data-open-inventory="true" ${busy ? 'disabled' : ''} title="ช่องเข็มขัดว่าง · คลิกเพื่อเปิดกระเป๋าไอเทมและจัดเรียงของ">ช่อง ${idx + 1} ว่าง (จัดกระเป๋า)</button>`;
    }
    return `<button type="button" class="belt-slot filled" data-use-item="${idx}" ${busy ? 'disabled' : ''} title="${escape(item.description)} (กดใช้ทันที ไม่เสียเทิร์น)"><span class="belt-icon">${item.icon}</span><span class="belt-copy"><strong>${escape(item.name)}</strong><small>${escape(item.badge)}</small></span></button>`;
  }).join('');

  bar.hidden = screen !== 'battle' || items.length === 0;
  bar.innerHTML = `<div class="belt-head"><strong>ใช้ไอเทมด่วน</strong><small>${items.length}/${MAX_BELT_ITEMS}</small></div><div class="belt-slots">${slotsHtml}</div>`;
}

export function syncRpgResourceBar(ctx, levelUpRewards, nextExpForLevel) {
  const { state } = ctx;
  if (!state?.player) return;
  const p = state.player;
  p.level ??= 1;
  p.exp ??= 0;
  p.gold ??= 0;
  p.items ??= [];

  renderPlayerHp(p.hp, p.maxHp);
  syncManaPipsPreview(state, 0);

  const nextExp = nextExpForLevel(p.level);
  const nextMpLevel = Math.ceil((p.level + 1) / 5) * 5;
  if ($('level-value')) {
    $('level-value').textContent = `Lv.${p.level}`;
    $('level-value').title = `เลเวลถัดไป HP สูงสุด +${levelUpRewards(p.level + 1).hpGain} · ที่ Lv.${nextMpLevel} มานาสูงสุด +${levelUpRewards(nextMpLevel).mpGain}`;
  }
  if ($('exp-value')) $('exp-value').textContent = `EXP ${p.exp}/${nextExp}`;
  if ($('exp-meter')) $('exp-meter').style.width = `${Math.min(100, (p.exp / nextExp) * 100)}%`;
  if ($('gold-value')) {
    $('gold-value').textContent = `💰 ${p.gold} ทอง`;
    $('gold-value').dataset.gold = String(p.gold);
  }
  if ($('sanctuary-shop-gold')) {
    $('sanctuary-shop-gold').textContent = `💰 ${p.gold} ทอง`;
    $('sanctuary-shop-gold').dataset.gold = String(p.gold);
  }
  if ($('sanctuary-forge-gold')) {
    $('sanctuary-forge-gold').textContent = `💰 ${p.gold} ทอง`;
    $('sanctuary-forge-gold').dataset.gold = String(p.gold);
  }
  const statusEl = $('sanctuary-status');
  const maxMana = getMaxMana(p);
  if (statusEl) {
    statusEl.innerHTML = `<span class="sanctuary-level" title="EXP ${p.exp}/${nextExp}">Lv.${p.level}</span><span class="sanctuary-hp" aria-label="HP ${p.hp}/${p.maxHp}">${icon('heart')} ${p.hp}/${p.maxHp}</span><span class="sanctuary-mana" aria-label="MP ${p.mana}/${maxMana}">${icon('mana')} ${p.mana}/${maxMana}</span><span id="sanctuary-gold-pill" class="sanctuary-gold" data-gold="${p.gold}" aria-label="${p.gold} ทอง">${icon('coin')} ${p.gold}</span>`;
  }
  renderItemBelt(ctx);
}

export function syncManaPipsPreview(state, pendingCost = 0) {
  const p = state?.player;
  if (!p) return;
  const maxMana = getMaxMana(p);
  renderPlayerMana(p.mana, maxMana, { pendingCost, animate: !(Number(pendingCost) > 0) });
}

export function renderBattleStory(state, collapsedStoryIds) {
  const banner = $('story-banner');
  if (!banner) return;
  if (state?.rift) {
    banner.hidden = true;
    banner.innerHTML = '';
    return;
  }
  const story = getBattleStory(state);
  if (!story) {
    banner.hidden = true;
    banner.innerHTML = '';
    return;
  }
  const collapsed = collapsedStoryIds.has(story.id);
  banner.hidden = false;
  banner.classList.toggle('is-collapsed', collapsed);
  if (collapsed) {
    banner.innerHTML = `<div><span class="story-kicker">${escape(story.kicker)}</span> · <strong class="story-title">${escape(story.title)}</strong></div><button type="button" class="story-toggle-btn" data-toggle-story="${escape(story.id)}">อ่านเนื้อเรื่อง</button>`;
    return;
  }
  const milestonesHtml = story.milestones?.length
    ? `<ul class="story-milestones">${story.milestones.map(m => `<li><strong>${escape(m.floor)}</strong><span><em>${escape(m.name)}</em> — ${escape(m.detail)}</span></li>`).join('')}</ul>`
    : '';
  banner.innerHTML = `<div class="story-banner-head"><div><div class="story-kicker">${escape(story.kicker)}</div><h2 class="story-title">${escape(story.title)}</h2></div><button type="button" class="story-toggle-btn" data-toggle-story="${escape(story.id)}">ย่อ</button></div><p class="story-body">${escape(story.body)}</p>${milestonesHtml}${story.hint ? `<p class="story-hint">${escape(story.hint)}</p>` : ''}`;
}

export function renderCastFxBanner(busy, castFxState) {
  const banner = $('cast-fx-banner');
  const slotsEl = $('spell-slots');
  if (slotsEl) {
    slotsEl.classList.remove('cast-fx-discover', 'cast-fx-success', 'cast-fx-fizzle');
    if (busy && castFxState?.type && !castFxState.isGuard) {
      slotsEl.classList.add(`cast-fx-${castFxState.type}`);
      if (castFxState.type === 'fizzle') {
        slotsEl.classList.remove('cast-burst-fire', 'cast-burst-ice', 'cast-burst-lightning', 'cast-elem-fire', 'cast-elem-ice', 'cast-elem-lightning', 'cast-elem-earth', 'cast-elem-water', 'cast-elem-wind', 'cast-elem-shield', 'cast-elem-heal');
      }
    } else {
      slotsEl.classList.remove('cast-burst-fire', 'cast-burst-ice', 'cast-burst-lightning', 'cast-elem-fire', 'cast-elem-ice', 'cast-elem-lightning', 'cast-elem-earth', 'cast-elem-water', 'cast-elem-wind', 'cast-elem-shield', 'cast-elem-heal');
    }
  }
  if (!banner) return;
  if (!castFxState) {
    banner.hidden = true;
    banner.className = 'cast-fx-banner';
    banner.innerHTML = '';
    return;
  }
  banner.hidden = false;
  banner.className = `cast-fx-banner fx-${castFxState.type}`;
  banner.innerHTML = `<span class="cast-fx-badge">${castFxState.badge}</span><div class="cast-fx-copy"><strong>${escape(castFxState.title)}</strong><span>${escape(castFxState.detail)}</span></div>`;
}

function intentIconHtml(action) {
  if (action.type === 'attack') return icon('sword');
  if (action.type === 'heal') return icon('heal');
  if (action.type === 'charge') return icon('mana');
  if (action.type === 'ward-grant' || action.type === 'ward-grant-all') return icon('veil');
  if (action.type === 'sealed') return icon('seal');
  if (action.type === 'frozen') return icon('freeze');
  if (action.type === 'recover') return icon('book');
  if (action.type === 'brace' || action.type === 'guard') return icon('brace');
  return icon('arrow');
}

export function renderEnemies({ state, battlefield, targetId, busy }, forecast) {
  const xPositions = battlefield.positions();
  const positions = new Map(state.enemies.map((enemy, index) => [enemy.id, xPositions[index]]));
  const visibleEnemies = [...state.enemies].sort((a, b) => a.slot - b.slot).filter(enemy => enemy.hp > 0);
  $('enemy-list').innerHTML = visibleEnemies.map(enemy => {
    const base = ENEMIES[enemy.kind];
    const trait = ENEMY_TRAITS[enemy.kind];
    const action = intent(enemy, state.turn, state.enemies, state.room, Boolean(state.rift?.instability));
    const after = forecast?.ok ? forecast.summary.enemyHp[enemy.id] : null;
    const finalHp = forecast?.ok ? forecast.summary.finalEnemyHp[enemy.id] : null;
    const status = forecast?.ok ? forecast.summary.enemyStatus[enemy.id] : enemy;
    const projectedAction = after === null ? action : forecast.summary.enemyActions?.[enemy.id] ?? { type: 'dead' };
    const badges = [];
    const enemyAffinity = enemy.affinity ?? base.affinity ?? null;
    let weakNames = '';
    if (enemyAffinity && ELEMENT_VULNERABILITY[enemyAffinity]) {
      const primaryWeak = ELEMENT_VULNERABILITY[enemyAffinity];
      const secondaryWeak = ELEMENT_SECONDARY_VULNERABILITY[enemyAffinity];
      weakNames = [primaryWeak, secondaryWeak].map(id => ELEMENT_LABELS[id]).join(' / ');
      const weakIcons = `${ELEMENT_ICONS[primaryWeak] || ''} ${ELEMENT_ICONS[secondaryWeak] || ''}`.trim();
      const affIcon = ELEMENT_ICONS[enemyAffinity] || ELEMENT_GLYPHS[enemyAffinity] || '';
      badges.push(`<span class="enemy-badge badge-affinity affinity-${enemyAffinity}" title="ธาตุ ${ELEMENT_LABELS[enemyAffinity]} · ต้านทาน ${ELEMENT_LABELS[enemyAffinity]} (−20% ดาเมจ)">${affIcon} ${ELEMENT_LABELS[enemyAffinity]}</span>`);
      badges.push(`<span class="enemy-badge badge-weakness" title="จุดอ่อน (+25% ดาเมจ): ${weakNames} (${weakIcons})">แพ้: ${weakIcons}</span>`);
    }
    // Show slot number from Floor 11+ so slot-targeted intents (ฮีล #N, ม่าน #N, เข้าช่อง N) are legible at a glance
    if (state.room >= FLOOR11_START_ROOM) badges.push(`<span class="enemy-badge">#${enemy.slot + 1}</span>`);
    const projectedArmor = forecast?.ok ? forecast.summary.enemyArmorAfterTurn?.[enemy.id] ?? enemy.armor : enemy.armor;
    const armorText = projectedArmor < enemy.armor ? `${enemy.armor} → ${projectedArmor}` : enemy.armor;
    if (enemy.armor > 0 || enemy.permanentArmorShred) badges.push(`<span class="enemy-badge badge-armor badge-armor-value" title="เกราะลดความเสียหายต่อการโจมตีหนึ่งครั้ง${enemy.permanentArmorShred ? ` · ถูกทุบถาวร ${enemy.permanentArmorShred} หน่วยในศึกนี้` : ''}">🛡 เกราะ ${armorText}</span>`);
    if (enemy.ward > 0) badges.push(`<span class="enemy-badge badge-ward" data-ward-layers title="ม่านกันกระสุน 1 ลูกต่อชั้น ลำแสงทะลุม่านได้">🔮 ม่าน ${enemy.ward}</span>`);
    const exposedPct = RIFT_EXPOSED_BONUS;
    const exposedHint = (isRiftBossExposed(enemy.kind, state.turn) || enemy.netherExposedTurn === state.turn)
      ? `เปิดช่อง · รับดาเมจเวทเพิ่ม ${exposedPct}%`
      : '';
    if (exposedHint) badges.push(`<span class="enemy-badge badge-push" title="${exposedHint}">เปิดช่อง +${exposedPct}%</span>`);
    const readLabel = enemy.readForm ? WORDS[enemy.readForm].label : '';
    const hasNetherPillars = enemy.kind === 'nether_dread_lord' && state.enemies.some(ally => NETHER_PILLAR_KINDS.includes(ally.kind));
    const cursePillarAlive = !hasNetherPillars || state.enemies.some(ally => ally.kind === 'nether_curse_pillar' && ally.hp > 0);
    const readHint = base.repeatReduction && cursePillarAlive
      ? (hasNetherPillars
        ? `คำสาปจากเสาคำสาป · ร่ายรูปเวทเดิมซ้ำลดดาเมจ ${base.repeatReduction}% และโดนสาปย้อนศร −8 HP · โค่นเสาคำสาปเพื่อล้าง!`
        : `จำรูปเวทที่ทำดาเมจล่าสุด · ร่ายรูปเดิมซ้ำลดดาเมจ ${base.repeatReduction}% · เทิร์นเปิดช่องร่ายซ้ำได้เต็มแรง`)
      : '';
    if (readHint) badges.push(`<span class="enemy-badge badge-ward" title="${readHint}">${readLabel ? `จำ ${readLabel}${exposedHint ? '' : ` −${base.repeatReduction}%`}` : 'อ่านทางเวท'}</span>`);
    let bossHint = '';
    if (state.room === FLOOR30_BOSS_ROOM && enemy.kind === 'crown_archivist') {
      const guarded = state.enemies.some(ally => ally.id !== enemy.id && ally.hp > 0);
      bossHint = guarded ? 'ตราคุ้มกัน · ลูกสมุนที่ยังอยู่ลดดาเมจบอส 25% · กำจัดลูกสมุนเพื่อทำลายการคุ้มกัน' : 'ตราคุ้มกันสลาย · ไม่มีลูกสมุนเหลือ';
      badges.push(`<span class="enemy-badge badge-armor" title="${bossHint}">${guarded ? 'ลูกสมุนคุ้มกัน −25%' : 'ตราสลาย'}</span>`);
    } else if (state.room === FLOOR40_BOSS_ROOM && enemy.kind === 'mirror_regent') {
      bossHint = 'ม่านกระจกสะท้อน 4 ดาเมจเมื่อกันกระสุน · ใช้ลำแสงทะลุหรือสลายม่านก่อนยิง';
      badges.push(`<span class="enemy-badge badge-ward" title="${bossHint}">ม่านสะท้อน 4</span>`);
    } else if (state.room === FLOOR50_BOSS_ROOM && enemy.kind === 'loom_sovereign') {
      bossHint = 'ท่าหนักทุกสามเทิร์นเพิ่ม 3 ดาเมจต่อลูกสมุนที่ยังอยู่ · กำจัดลูกสมุนเพื่อลดแรงโจมตี';
      badges.push(`<span class="enemy-badge badge-push" title="${bossHint}">ท่าหนัก +3/ลูกสมุน</span>`);
    } else if (enemy.kind === 'volcano_colossus') {
      bossHint = 'เกราะแมกมา · ใช้น้ำหรือน้ำแข็งดับเกราะ −2 และเปิดช่อง +35% ดาเมจทุกบทที่ 4';
      badges.push(`<span class="enemy-badge badge-burn" title="${bossHint}">ดับลาวาได้</span>`);
    } else if (enemy.kind === 'thunder_drake_emperor') {
      const isGrounded = (status.groundedUntil ?? enemy.groundedUntil ?? 0) >= state.turn;
      bossHint = isGrounded
        ? 'ลงกราวด์แล้ว · เกราะมหาประจุดาราไม่ช็อตคืนจนจบเทิร์นนี้'
        : 'เกราะมหาประจุดารา · สะท้อนสายฟ้า 4 เมื่อมีเกราะ หากไม่ใช้ธาตุดิน (ลงกราวด์) หรือคำว่าเจาะ · เปิดช่อง +35% ในบทที่ 4';
      badges.push(`<span class="enemy-badge ${isGrounded ? 'badge-armor' : 'badge-ward'}" title="${bossHint}">${isGrounded ? 'ลงกราวด์แล้ว' : 'ประจุดารา 4'}</span>`);
    } else if (enemy.kind === 'kraken_ward_tentacle') {
      bossHint = 'เฟส 1/2 · คูลดาวน์ 2 เทิร์น: เทิร์นคี่กางม่าน +1 ให้หนวดอื่นทุกเส้น (ผนึกหยุดได้) · ปราบหนวดครบ 4 เส้นเพื่อเรียกร่างจริง';
      badges.push(`<span class="enemy-badge badge-ward" title="${bossHint}">ม่านทุก 2 เทิร์น</span>`);
    } else if (enemy.kind === 'kraken_heal_tentacle') {
      bossHint = 'เฟส 1/2 · คูลดาวน์ 2 เทิร์น: เทิร์นคู่ฟื้นหนวดที่ HP% ต่ำสุด +220 HP (อัคคีลดฮีลครึ่งหนึ่ง)';
      badges.push(`<span class="enemy-badge badge-chill" title="${bossHint}">ฮีล +220</span>`);
    } else if (enemy.kind === 'kraken_ink_tentacle') {
      bossHint = 'เฟส 1/2 · คูลดาวน์ 3 เทิร์น: พ่นหมึกดำ 42 ดาเมจ + สูบมานา −2 MP';
      badges.push(`<span class="enemy-badge badge-ward" title="${bossHint}">สูบ −2 MP</span>`);
    } else if (enemy.kind === 'kraken_crush_tentacle') {
      bossHint = 'เฟส 1/2 · วัฏจักร 3 เทิร์น: โจมตี 52 → ชาร์จพลัง → ฟาดบดขยี้ 92 ดาเมจ!';
      badges.push(`<span class="enemy-badge badge-push" title="${bossHint}">ชาร์จ 92</span>`);
    } else if (enemy.kind === 'abyssal_kraken') {
      const isShocked = (status.abyssalShockUntil ?? enemy.abyssalShockUntil ?? 0) >= state.turn;
      bossHint = isShocked
        ? 'ผิวน้ำบาดาลนำไฟฟ้า · ถูกช็อตแล้ว! เกราะลด −2 จนจบเทิร์นนี้ (โดนสายฟ้า +15 ดาเมจแท้)'
        : 'เฟส 2 ร่างจริง · ผิวน้ำนำไฟฟ้า: โดนสายฟ้า +15 ดาเมจแท้ & ลดเกราะ −2 · บท 2 ฟื้น +120 HP · บท 4 สึนามิ 108 & เปิดช่อง +35%';
      badges.push(`<span class="enemy-badge ${isShocked ? 'badge-push' : 'badge-chill'}" title="${bossHint}">${isShocked ? 'ช็อตแล้ว −2 เกราะ' : 'นำไฟฟ้า +15 / −2 เกราะ'}</span>`);
    } else if (enemy.kind === 'ancient_chitin_behemoth') {
      bossHint = 'เกราะไคตินเปลี่ยนตามเทิร์น · ทุบเกราะเพื่อลดค่าป้องกัน หรือใช้คาถาทะลวง';
      badges.push(`<span class="enemy-badge badge-armor" title="${bossHint}">ไคตินหนา</span>`);
    } else if (enemy.kind === 'nether_leech_pillar') {
      bossHint = 'เสาดูดวิญญาณ · เทิร์นคี่ฟื้นบอส +180 HP (ผนึกหยุดได้/อัคคีลดครึ่ง) · ลดดาเมจบอส −25%';
      badges.push(`<span class="enemy-badge badge-chill" title="${bossHint}">ฮีลบอส +180</span>`);
    } else if (enemy.kind === 'nether_curse_pillar') {
      bossHint = 'เสาคำสาปต้องห้าม · เทิร์นคี่กางม่านบอส +1 · คงคำสาปร่ายซ้ำ −70% & ย้อนศร −8 HP · ลดดาเมจบอส −25%';
      badges.push(`<span class="enemy-badge badge-ward" title="${bossHint}">คำสาปห้ามซ้ำ −8</span>`);
    } else if (enemy.kind === 'nether_doom_pillar') {
      bossHint = 'เสาพิพากษานรกานต์ · เสริมดาเมจบอส +18 ตลอดเวลา · บท 3 ชาร์จลำแสง 88 ดาเมจ · ลดดาเมจบอส −25%';
      badges.push(`<span class="enemy-badge badge-push" title="${bossHint}">เสริมบอส +18 · ชาร์จ 88</span>`);
    } else if (state.room === FLOOR90_BOSS_ROOM && enemy.kind === 'nether_dread_lord') {
      const livePillars = state.enemies.filter(ally => NETHER_PILLAR_KINDS.includes(ally.kind) && ally.hp > 0).length;
      const isPurged = (status.netherPurgeUntil ?? enemy.netherPurgeUntil ?? 0) >= state.turn;
      if (livePillars > 0) {
        bossHint = `พันธสัญญาสามเสา · เสาที่เหลือ ${livePillars} ต้นลดดาเมจบอส −${livePillars * 25}% · โค่นครบ 3 ต้นก่อน HP ≤50% เพื่อเปิดช่อง +35% เทิร์นหน้า (หาก HP ≤50% ก่อน บอสจะสังเวยเสาฮีล +350/ต้น!)`;
        badges.push(`<span class="enemy-badge badge-armor" title="${bossHint}">พันธสัญญา −${livePillars * 25}%</span>`);
      } else {
        bossHint = isPurged
          ? 'ชำระมลทินแล้ว! · ปิดการสูบเลือด +150 และลดเกราะ −2 จนจบเทิร์นนี้'
          : 'โหมดปลดผนึก · โจมตีทะลุโล่จะสูบเลือด +150 HP · ใช้ “ไฟ” หรือ “สายฟ้า” ชำระมลทินเพื่อปิดสูบเลือด & ลดเกราะ −2!';
        badges.push(`<span class="enemy-badge badge-burn" title="${bossHint}">ปลดผนึก · สูบชีพ 150</span>`);
      }
      badges.push(`<span class="enemy-badge ${isPurged ? 'badge-push' : 'badge-chill'}" title="${isPurged ? 'ถูกชำระด้วยไฟ/สายฟ้า · ปิดสูบชีพ & เกราะ −2' : 'โจมตีด้วยธาตุไฟหรือสายฟ้าเพื่อชำระมลทิน (−2 เกราะ & ปิดสูบเลือด)'}">${isPurged ? 'ชำระมลทินแล้ว' : 'ไฟ·สายฟ้าชำระ −2 เกราะ'}</span>`);
    } else if (state.room === FLOOR100_BOSS_ROOM && enemy.kind === 'eternity_overlord') {
      if (state.eternityPhase === 2) {
        const isShattered = (status.eternityShatterUntil ?? enemy.eternityShatterUntil ?? 0) >= state.turn;
        const absorbed = enemy.eternityAbsorbed ?? 0;
        bossHint = isShattered
          ? 'เฟส 2 ปฏิพากย์เบญจธาตุ · ทลายผลึกแล้ว! (−3 เกราะจนจบเทิร์นนี้) · ม่านสะท้อน 10'
          : 'เฟส 2 ปฏิพากย์เบญจธาตุ · สลับธาตุทุกเทิร์น (ไฟ→น้ำแข็ง→สายฟ้า→ดิน) · ม่านสะท้อน 10 · ตีจุดอ่อนทลายผลึก +60 แท้ / −3 เกราะ / −1 ม่าน!';
        badges.push(`<span class="enemy-badge badge-ward" title="${bossHint}">เฟส 2 · สลับธาตุ · สะท้อนม่าน 10</span>`);
        if (absorbed > 0) badges.push(`<span class="enemy-badge badge-burn" title="กลืนพลังสภากาลอวกาศ ${absorbed} ตน · เสริมพลังโจมตีถาวร +${absorbed * 12}">กลืนสภา +${absorbed * 12} โจมตี</span>`);
        badges.push(`<span class="enemy-badge ${isShattered ? 'badge-push' : 'badge-chill'}" title="${bossHint}">${isShattered ? 'ทลายผลึกแล้ว' : 'ตีจุดอ่อนทลายผลึก'}</span>`);
      } else {
        const eternityGuarded = state.enemies.filter(ally => ally.id !== enemy.id && ally.hp > 0).length;
        bossHint = eternityGuarded > 0
          ? `เฟส 1 สภากาลอวกาศ · ลูกสมุน ${eternityGuarded} ตัวลดดาเมจบอส −${eternityGuarded * 15}% และเสริมบท 2 +${eternityGuarded * 10} · หากไม่โค่นก่อน ≤${ETERNITY_PHASE_HP[1].toLocaleString('en-US')} HP บอสจะกลืนพลังฟื้น +600 HP & +12 โจมตี/ตน!`
          : `เฟส 1 · สภาถูกโค่นหมดแล้ว · เข้าเฟส 2 เมื่อเหลือ ${ETERNITY_PHASE_HP[1].toLocaleString('en-US')} HP โดยไม่เสียพลังกลืนสภา`;
        badges.push(`<span class="enemy-badge ${eternityGuarded > 0 ? 'badge-armor' : 'badge-push'}" title="${bossHint}">${eternityGuarded > 0 ? `เฟส 1 · สภา −${eternityGuarded * 15}% / +${eternityGuarded * 10}` : 'เฟส 1 · ไร้สภา'}</span>`);
      }
    } else if (enemy.kind === 'eternity_reborn') {
      const isShattered = (status.eternityShatterUntil ?? enemy.eternityShatterUntil ?? 0) >= state.turn;
      bossHint = isShattered
        ? 'เฟส 3 ร่างจุตินิรันดร์ · ผลึกแตกแล้ว! (−3 เกราะ & หยุดย้อนเวลาฟื้น +400 HP ในบท 2) · ม่านสะท้อน 10'
        : 'เฟส 3 ร่างจุตินิรันดร์ · สลับธาตุทุกเทิร์น · ต้านทานคาถาซ้ำ −50% · ม่านสะท้อน 10 · ตีจุดอ่อนทลายผลึก +100 แท้ / −3 เกราะ / −1 ม่าน & หยุดย้อนเวลา! · บท 4 เปิดช่อง +35%';
      badges.push(`<span class="enemy-badge badge-burn" title="${bossHint}">เฟส 3 ร่างจุติ · สลับธาตุ · สะท้อน 10</span>`);
      badges.push(`<span class="enemy-badge ${isShattered ? 'badge-push' : 'badge-chill'}" title="${bossHint}">${isShattered ? 'ผลึกแตก (เวลาหยุด)' : 'ตีจุดอ่อน +100 · หยุดเวลา'}</span>`);
    } else if (enemy.kind === 'storm_sovereign_drake') {
      const isGrounded = (status.groundedUntil ?? enemy.groundedUntil ?? 0) >= state.turn;
      bossHint = isGrounded
        ? 'ลงกราวด์แล้ว · ประจุพายุไม่ช็อตคืนจนจบเทิร์นนี้'
        : 'ประจุพายุสะท้อน 4 ดาเมจเมื่อยังมีเกราะ (ใช้ธาตุดินลงกราวด์หรือเจาะเกราะ) · บท 4 มหาพายุ AoE & เปิดช่อง +35%';
      badges.push(`<span class="enemy-badge ${isGrounded ? 'badge-armor' : 'badge-ward'}" title="${bossHint}">${isGrounded ? 'ลงกราวด์แล้ว' : 'ประจุพายุ 4'}</span>`);
    } else if (enemy.kind === 'void_rift_tentacle') {
      bossHint = 'หนวดมิติคุ้มกันเลเวียธาน · ตราบใดที่หนวดยังอยู่ เลเวียธานเป็นอมตะ! · สูบมานา −1 MP';
      badges.push(`<span class="enemy-badge badge-ward" title="${bossHint}">คุ้มกันบอส · −1 MP</span>`);
    } else if (enemy.kind === 'void_kraken_leviathan') {
      const liveTentacles = state.enemies.filter(ally => ally.kind === 'void_rift_tentacle' && ally.hp > 0).length;
      const isShocked = (status.abyssalShockUntil ?? enemy.abyssalShockUntil ?? 0) >= state.turn;
      if (liveTentacles > 0) {
        bossHint = `เกราะมิติอมตะ · โค่นหนวดมิติที่เหลือ ${liveTentacles} เส้นก่อนจึงจะทำความเสียหายเลเวียธานได้!`;
        badges.push(`<span class="enemy-badge badge-ward" title="${bossHint}">อมตะ · เหลือหนวด ${liveTentacles}</span>`);
      } else {
        bossHint = isShocked
          ? 'ผิวน้ำมิติถูกช็อตแล้ว! (−2 เกราะจนจบเทิร์นนี้ · โดนสายฟ้า +15 ดาเมจแท้)'
          : 'ผิวน้ำนำไฟฟ้า · โดนสายฟ้า +15 ดาเมจแท้ & ลดเกราะ −2 · บท 2 ฟื้น +80 HP · บท 4 เปิดช่อง +35%';
        badges.push(`<span class="enemy-badge ${isShocked ? 'badge-push' : 'badge-chill'}" title="${bossHint}">${isShocked ? 'ช็อตแล้ว −2 เกราะ' : 'นำไฟฟ้า +15 / −2 เกราะ'}</span>`);
      }
    } else if (enemy.kind === 'nether_forge_pillar') {
      bossHint = 'เสาเตาหลอมเนเธอร์ · ลดดาเมจจอมอสูรเตาหลอม −20% ต่อต้น และเสริมม่าน +1 ให้บอส · โค่นครบ 3 ต้นเพื่อเปิดช่องบอส!';
      badges.push(`<span class="enemy-badge badge-armor" title="${bossHint}">ลดดาเมจบอส −20% · ม่านบอส</span>`);
    } else if (enemy.kind === 'nether_forge_overlord') {
      const liveForgePillars = state.enemies.filter(ally => ally.kind === 'nether_forge_pillar' && ally.hp > 0).length;
      const isPurged = (status.netherPurgeUntil ?? enemy.netherPurgeUntil ?? 0) >= state.turn;
      if (liveForgePillars > 0) {
        bossHint = `เตาหลอมพิทักษ์ · เสาที่เหลือ ${liveForgePillars} ต้นลดดาเมจบอส −${liveForgePillars * 20}% และเสริมหลอมสูบวิญญาณ +30 HP · โค่นครบ 3 ต้นเพื่อเปิดช่อง +35%!`;
        badges.push(`<span class="enemy-badge badge-armor" title="${bossHint}">เตาหลอม −${liveForgePillars * 20}% · สูบ 30</span>`);
      } else {
        bossHint = isPurged
          ? 'ชำระมลทินแล้ว! (−2 เกราะจนจบเทิร์นนี้)'
          : 'เสาเตาหลอมพังหมดแล้ว · ใช้ธาตุไฟหรือสายฟ้าเพื่อชำระมลทิน (−2 เกราะ)';
        badges.push(`<span class="enemy-badge ${isPurged ? 'badge-push' : 'badge-burn'}" title="${bossHint}">${isPurged ? 'ชำระมลทินแล้ว' : 'ไฟ·สายฟ้าชำระ −2 เกราะ'}</span>`);
      }
    } else if (enemy.kind === 'eternity_armory_god') {
      const armoryPhase = state.armoryGodPhase ?? (enemy.hp <= 2500 ? 3 : enemy.hp <= 5000 ? 2 : 1);
      bossHint = armoryPhase === 3
        ? 'เฟส 3/3 โอเวอร์ไดรฟ์ศาสตรานิรันดร์ · ทะลุเกราะกายหนัก & ต้านทานคาถาซ้ำ −50% · บท 4 เปิดช่อง +35%'
        : armoryPhase === 2
          ? 'เฟส 2/3 ม่านศาสตราสะท้อน · สะท้อน 10 ดาเมจทุกครั้งที่โดนคาถา · เข้าเฟส 3 เมื่อ HP ≤ 2,500'
          : 'เฟส 1/3 มหาเทพอารักษ์คลังศาสตรา · ต้านทานคาถาซ้ำ −50% · เข้าเฟส 2 (สะท้อน 10) เมื่อ HP ≤ 5,000';
      badges.push(`<span class="enemy-badge ${armoryPhase === 3 ? 'badge-burn' : armoryPhase === 2 ? 'badge-ward' : 'badge-armor'}" title="${bossHint}">เฟส ${armoryPhase}/3${armoryPhase === 2 ? ' · สะท้อน 10' : armoryPhase === 3 ? ' · โอเวอร์ไดรฟ์' : ''}</span>`);
    }
    if (status.chill > 0) badges.push(`<span class="enemy-badge badge-chill">❄ หนาว −${status.chill}</span>`);
    if (status.freeze > 0) badges.push(`<span class="enemy-badge badge-freeze">🧊 แช่แข็ง ${status.freeze}</span>`);
    if (status.burn > 0) badges.push(`<span class="enemy-badge badge-burn">🔥 เผา ${status.burn}</span>`);
    if (status.wetUntil >= state.turn) badges.push('<span class="enemy-badge badge-chill">เปียก</span>');
    if (status.obscured) badges.push('<span class="enemy-badge badge-ward">เล็ง −4</span>');
    if (state.magmaPuddles?.includes(enemy.slot)) badges.push('<span class="enemy-badge badge-burn">แอ่งแมกม่า</span>');
    if (status.groundedUntil >= state.turn && enemy.kind !== 'thunder_drake_emperor') badges.push('<span class="enemy-badge badge-armor">ลงกราวด์</span>');
    if (status.healCutUntil >= state.turn) badges.push('<span class="enemy-badge badge-burn">ฮีล ½</span>');
    if (status.lastingChill) badges.push('<span class="enemy-badge badge-chill">หนาว 2 ครั้ง</span>');
    if (status.sealed) badges.push('<span class="enemy-badge badge-ward badge-sealed">ผนึก</span>');
    if (status.slot !== enemy.slot) badges.push(`<span class="enemy-badge badge-push">↪ ไปช่อง ${status.slot + 1}</span>`);

    const activeSummon = state.player?.summon;
    const targetLabel = activeSummon?.hp > 0 && action.type === 'attack'
      ? action.aoe && !activeSummon.aoeIntercept
        ? ' <small class="text-danger">AoE · โดนผู้เล่น</small>'
        : action.aoe ? ' <small class="text-warning">AoE · แนวหน้าสกัด</small>' : ' <small class="text-warning">🎯แนวหน้า</small>'
      : '';

    const intentClass = action.type === 'attack' && action.amount >= 6 ? 'heavy' : action.type;
    const baseIntentLabel = action.shortLabel ?? (action.type === 'attack' ? `${icon('sword')} ${action.amount}` : action.type === 'heal' ? `${icon('heal')} ${action.amount}` : action.type === 'charge' ? 'ชาร์จ' : action.type === 'sealed' ? 'ติดผนึก' : action.type === 'recover' ? 'เปิดช่อง' : 'แช่แข็ง');
    const intentLabel = String(baseIntentLabel).includes('<svg') ? `${baseIntentLabel}${targetLabel}` : `${intentIconHtml(action)} ${baseIntentLabel}${targetLabel}`;
    const description = [base.name, `ช่อง ${enemy.slot + 1}`, `HP ${enemy.hp}/${enemy.maxHp}`, enemyAffinity && weakNames && `ธาตุ ${ELEMENT_LABELS[enemyAffinity]} (แพ้ ${weakNames})`, action.label, exposedHint, readLabel && `รูปเวทที่จำ ${readLabel}`, readHint, bossHint, trait?.passive(state.turn), trait?.counter].filter(Boolean).join(' · ');
    const predicted = finalHp ?? after;
    const projectedLabel = projectedAction.type === 'dead' ? ' → 0'
      : projectedAction.type === 'timestop' ? ' → หยุดเวลา'
      : projectedAction.type === 'summon-stunned' ? ' → สตั๊น'
      : projectedAction.type === 'sealed' && action.type !== 'sealed' ? ' → ผนึก'
        : projectedAction.type === 'frozen' && action.type !== 'frozen' ? ' → แช่แข็ง'
        : projectedAction.shortLabel && projectedAction.shortLabel !== action.shortLabel ? ` → ${projectedAction.shortLabel}`
          : action.type === 'attack' && projectedAction.type === 'attack' && projectedAction.amount !== action.amount ? ` → ${projectedAction.amount}` : '';
    const middleLane = Object.hasOwn(MIDDLE_ENEMIES, enemy.kind) ? ` data-middle-lane="${enemy.slot % 2}"` : '';
    const crowdLane = state.room >= FLOOR21_START_ROOM && visibleEnemies.length >= 3 ? ` data-crowd-lane="${enemy.slot % 2}"` : '';
    const hpPct = `${Math.max(0, Math.min(100, enemy.hp / enemy.maxHp * 100))}%`;
    return `<button type="button" id="target-${enemy.id}" class="enemy-card enemy-kind-${enemy.kind} ${targetId === enemy.id ? 'target' : ''}" style="--enemy-x:${positions.get(enemy.id) / 3.2}%;--enemy-y:${ENEMIES[enemy.kind]?.isBoss ? 42 : 56}%" data-target="${enemy.id}"${middleLane}${crowdLane} aria-pressed="${targetId === enemy.id}" ${busy ? 'disabled' : ''} title="${escape(description)}" aria-label="${escape(description)}${escape(projectedLabel)} เกราะ ${armorText} ม่าน ${enemy.ward}"><span class="enemy-mobile-heading"><strong>${escape(base.name)}</strong><small data-enemy-slot-label>ช่อง ${enemy.slot + 1}</small></span><span class="enemy-intent intent-${intentClass}">${intentLabel}${projectedLabel}</span><span class="enemy-hp-text">${enemy.hp}/${enemy.maxHp}${predicted !== null && predicted !== enemy.hp ? ` <em>→ ${predicted}</em>` : ''}</span><span class="enemy-hp"><i class="enemy-hp-trail" style="width:${hpPct}"></i><i class="enemy-hp-fill" style="width:${hpPct}"></i></span><span class="enemy-info">${badges.join('')}</span></button>`;
  }).join('');

  if (state.player?.summon && state.player.summon.hp > 0) {
    $('enemy-list').innerHTML = renderSummonCardHtml(state.player.summon) + $('enemy-list').innerHTML;
  }
}

export function renderSummonCardHtml(s) {
  if (!s || !(s.hp > 0)) return '';
  const elemLabel = s.element ? (ELEMENT_LABELS[s.element] || WORDS[s.element]?.label || s.element) : 'ไร้ธาตุ';
  const summonBadges = [
    `<span class="enemy-badge badge-affinity">ธาตุ ${escape(elemLabel)}</span>`,
    s.armor > 0 ? `<span class="enemy-badge badge-armor">🛡 เกราะ ${s.armor}</span>` : '',
    s.ward > 0 ? `<span class="enemy-badge badge-ward" data-summon-ward>🔮 ม่าน ${s.ward}</span>` : '',
    `<span class="enemy-badge badge-burn">⚔ สวน ${s.counter ?? 0}</span>`,
    `<span class="enemy-badge badge-push">⚡ หมัด ${s.strike ?? 0}</span>`,
  ].filter(Boolean).join('');
  const maxHp = Math.max(1, s.maxHp ?? s.hp);
  const sHpPct = `${Math.max(0, Math.min(100, (s.hp / maxHp) * 100))}%`;
  return `<div class="enemy-card summon-card" data-summon-card="true" style="--enemy-x:27.5%;--enemy-y:54%;border:1px solid #ffd700;box-shadow:0 0 8px rgba(255,215,0,0.3);pointer-events:none;" title="${escape(s.name)} · แนวหน้าคุ้มกัน"><span class="enemy-mobile-heading"><strong>⭐ ${escape(s.name)}</strong><small>แนวหน้า</small></span><span class="enemy-intent intent-attack">🛡️ คุ้มกันผู้เล่น</span><span class="enemy-hp-text">${s.hp}/${maxHp}</span><span class="enemy-hp"><i class="enemy-hp-trail" style="width:${sHpPct}"></i><i class="enemy-hp-fill" style="width:${sHpPct};background:#4ade80;"></i></span><span class="enemy-info">${summonBadges}</span></div>`;
}

let lastRenderedSlotState = { room: null, words: [] };

const CORE_ELEMENT_FAMILIES = new Set(['fire', 'ice', 'lightning', 'earth', 'water', 'wind']);

export function inferDeskElement(words = [], parsed = null) {
  const placed = words.filter(Boolean);
  if (!placed.length) return '';
  const scores = Object.create(null);
  const addScore = (key, weight) => {
    if (!key) return;
    scores[key] = (scores[key] ?? 0) + weight;
  };

  for (const id of placed) {
    const fam = elementFamily(id);
    if (SECOND_TIER_ELEMENTS[id] || FUSED_ELEMENTS[id]) {
      addScore(fam, 3);
    } else if (CORE_ELEMENT_FAMILIES.has(fam)) {
      addScore(fam, 2);
    } else if (id === 'burn') {
      addScore('fire', 1.5);
    } else if (id === 'freeze') {
      addScore('ice', 1.5);
    } else if (id === 'meteor') {
      addScore('fire', 2);
    } else if (id === 'blast') {
      addScore('fire', 0.8);
    } else if (id === 'heal') {
      addScore('heal', 2.2);
    } else if (id === 'shield' || id === 'veil' || id === 'brace') {
      addScore('shield', 2);
    } else if (id === 'blackhole' || id === 'death') {
      addScore('arcane', 2.5);
    }
  }

  if (parsed?.ok && parsed.spell) {
    const spellElems = parsed.spell.elements?.length
      ? parsed.spell.elements
      : parsed.spell.layerEffects?.flat() ?? (parsed.spell.effect ? [parsed.spell.effect] : []);
    if (parsed.spell.form === 'heal' || parsed.spell.healing > 0) addScore('heal', 2.5);
    let hasElementalAura = false;
    for (let i = 0; i < spellElems.length; i++) {
      const raw = spellElems[i] === 'akki-blast' || spellElems[i] === 'blast' ? 'fire' : spellElems[i];
      const fam = elementFamily(raw);
      if (CORE_ELEMENT_FAMILIES.has(fam)) {
        addScore(fam, i === 0 ? 1.8 : 1.2);
        hasElementalAura = true;
      }
    }
    if (!hasElementalAura && parsed.spell.type === 'self') {
      addScore('shield', 1.5);
    } else if (!hasElementalAura && (parsed.spell.form === 'blast' || parsed.spell.shellBlast)) {
      addScore('fire', 1);
    }
  }

  let bestElem = '';
  let bestScore = 0;
  for (const [key, value] of Object.entries(scores)) {
    if (value > bestScore) {
      bestScore = value;
      bestElem = key;
    }
  }
  return bestElem || 'arcane';
}

export function inferDeskPower(words = [], parsed = null, deskElem = '') {
  if (!deskElem) return '';
  const placed = words.filter(Boolean);
  if (
    parsed?.spell?.grand ||
    parsed?.spell?.large ||
    placed.some(id => id === 'grand' || SECOND_TIER_ELEMENTS[id] || FUSED_ELEMENTS[id])
  ) {
    return 'surge';
  }
  const elemMatches = placed.filter(id => elementFamily(id) === deskElem).length;
  if (elemMatches >= 2 || (parsed?.ok && parsed.spell && placed.length >= 2)) {
    return 'charged';
  }
  return 'base';
}

export function renderSlots({ state, words, selectedSlot, busy, castFxState }, parsed, knownSpell = false) {
  const slotsEl = $('spell-slots');
  const fxClass = busy && castFxState?.type ? `slot-fx-${castFxState.type}` : '';
  const deskElem = inferDeskElement(words, parsed);
  const elemPower = inferDeskPower(words, parsed, deskElem);
  if (deskElem) {
    slotsEl.dataset.deskElem = deskElem;
    slotsEl.dataset.elemPower = elemPower;
  } else {
    delete slotsEl.dataset.deskElem;
    delete slotsEl.dataset.elemPower;
  }

  const filledCount = words.filter(Boolean).length;
  slotsEl.classList.toggle('is-combo-linked', Boolean(!busy && filledCount >= 2 && (knownSpell || parsed?.ok)));
  slotsEl.classList.toggle('is-known-ready', Boolean(!busy && knownSpell && parsed?.ok));

  const canAnimateSnap = !busy && lastRenderedSlotState.room === state.room;
  const prevWords = lastRenderedSlotState.words;

  slotsEl.innerHTML = Array.from({ length: 4 }, (_, index) => {
    const id = words[index];
    const word = WORDS[id];
    const meta = word ? cardMeta(id) : null;
    const stepLabel = `ช่อง ${index + 1}`;
    if (!word) {
      return `<div class="spell-slot empty-slot ${selectedSlot === index ? 'selected' : ''}" data-slot="${index}"><button id="slot-${index}" class="slot-main empty" data-select-slot="${index}" aria-pressed="${selectedSlot === index}" aria-label="${stepLabel} ว่าง" ${busy ? 'disabled' : ''}><span class="slot-socket-frame"><span class="slot-top"><span class="slot-number">${stepLabel}</span></span><span class="slot-empty-emblem" aria-hidden="true">+</span><span class="slot-empty-text">ว่าง</span></span></button></div>`;
    }
    const justPlaced = canAnimateSnap && prevWords[index] !== id;
    const slotTag = `<span class="slot-pill-num">${stepLabel}</span>`;
    return `<div class="spell-slot filled playing-card word-${id} ${rarityClass(word)} ${meta.roleClass} ${selectedSlot === index ? 'selected' : ''} ${knownSpell ? 'valid-slot' : 'untested-slot'} ${justPlaced ? 'slot-just-placed' : ''} ${fxClass}" style="--slot-idx:${index}" data-slot="${index}"><button id="slot-${index}" class="slot-main" data-select-slot="${index}" data-drag-slot="${index}" aria-pressed="${selectedSlot === index}" aria-label="${stepLabel} ${word.label}" ${busy ? 'disabled' : ''}>${playingCardFace(state, id, { headerRight: slotTag, battle: true })}</button><button type="button" class="slot-remove" data-remove-slot="${index}" aria-label="ถอดคำ ${word.label} ออกจาก${stepLabel}" title="ถอดกลับมือ" ${busy ? 'disabled' : ''}>×</button><button class="drag-handle" data-drag-slot="${index}" tabindex="-1" aria-label="ลากคำ ${word.label}" ${busy ? 'disabled' : ''}></button></div>`;
  }).join('');

  lastRenderedSlotState = {
    room: state.room,
    words: busy ? [] : Array.from({ length: 4 }, (_, i) => words[i] ?? null),
  };
}

export function getKnownCastableInHand(state, accountDiscovered) {
  const knownKeys = new Set([...accountDiscovered, ...(state?.stats?.discovered ?? []), ...state.player.hand.filter(id => BATTLE_LIMITED_WORDS.includes(id))]);
  const categoryFor = spell => {
    if (spell.type === 'summon') return { category: 'อัญเชิญ', kindClass: 'combo-summon', catRank: 1 };
    if (spell.form === 'heal' || spell.healing > 0) return { category: 'ฟื้นฟู', kindClass: 'combo-heal', catRank: 3 };
    if (spell.type === 'self') return { category: 'โล่', kindClass: 'combo-shield', catRank: 2 };
    return { category: 'โจมตี', kindClass: 'combo-attack', catRank: 0 };
  };
  const castable = [];
  const shortMana = [];
  let cardsOnlyCount = 0;
  for (const key of knownKeys) {
    const phrase = key.split(' ').filter(Boolean);
    if (!phrase.length) continue;
    const recipe = canFormPhraseInHand(state, phrase);
    if (!recipe) {
      const cardsMatch = canFormCardsInHand(state, phrase);
      if (cardsMatch) {
        cardsOnlyCount += 1;
        const detonateOk = cardsMatch.spell.form !== 'detonate' || fireShieldLayers(state.player.shield, cardsMatch.spell.element).length > 0;
        const cost = battleSpellCost(state, cardsMatch);
        if (detonateOk && cost > state.player.mana) {
          shortMana.push({
            key,
            phrase: cardsMatch.ids,
            expression: cardsMatch.expression,
            cost,
            ...categoryFor(cardsMatch.spell),
          });
        }
      }
      continue;
    }
    const effectDesc = describeFormulaEffect({ phrase: recipe.ids, spell: recipe.spell });
    castable.push({
      key,
      phrase: recipe.ids,
      expression: recipe.expression,
      cost: recipe.cost,
      ...categoryFor(recipe.spell),
      effectDesc,
    });
  }
  castable.sort((a, b) => a.catRank - b.catRank || a.cost - b.cost || a.phrase.length - b.phrase.length || a.key.localeCompare(b.key));
  shortMana.sort((a, b) => a.cost - b.cost || a.catRank - b.catRank || a.phrase.length - b.phrase.length || a.key.localeCompare(b.key));
  return { castable, shortMana, cardsOnlyCount, totalDiscovered: knownKeys.size };
}

export function renderQuickCombos(ctx, parsed, knownSpell = false) {
  const { state, words, busy, accountDiscovered, getPlayableCombos, lastJustUnlockedKey } = ctx;
  const shortcuts = $('known-shortcuts');
  const labelEl = $('known-formulas-label');
  const emptyEl = $('known-formulas-empty');
  const barEl = $('known-formulas-bar');
  const scrollLeft = shortcuts.scrollLeft;
  const selected = words.filter(Boolean).join(' ');
  const { castable, shortMana, cardsOnlyCount, totalDiscovered } = getKnownCastableInHand(state, accountDiscovered);

  if (labelEl) labelEl.innerHTML = `สูตรที่รู้ · พร้อมร่าย <span class="known-formulas-count">${castable.length}</span>`;
  if (barEl) barEl.classList.toggle('has-formulas', castable.length > 0);
  if (emptyEl) {
    if (castable.length > 0) {
      emptyEl.textContent = 'เลือกสูตรเพื่อวางการ์ดบนแท่นร่าย';
      emptyEl.className = 'known-formulas-empty is-hint';
    } else if (state?.player?.hand?.length > getHandLimit(state.player)) {
      emptyEl.textContent = 'เลือกทิ้งการ์ดส่วนเกินก่อนร่าย';
      emptyEl.className = 'known-formulas-empty';
    } else if (shortMana.length > 0) {
      emptyEl.textContent = `มี ${shortMana.length} สูตรที่มีการ์ดครบ แต่มานาไม่พอ`;
      emptyEl.className = 'known-formulas-empty is-warn';
    } else if (cardsOnlyCount > 0) {
      emptyEl.textContent = `มี ${cardsOnlyCount} สูตรที่มีการ์ดครบ แต่ยังร่ายไม่ได้`;
      emptyEl.className = 'known-formulas-empty is-warn';
    } else if (totalDiscovered === 0) {
      emptyEl.textContent = 'สูตรที่ค้นพบจะปรากฏที่นี่เมื่อมีการ์ดครบ';
      emptyEl.className = 'known-formulas-empty';
    } else {
      emptyEl.textContent = 'ยังไม่มีสูตรที่ร่ายได้จากการ์ดในมือขณะนี้';
      emptyEl.className = 'known-formulas-empty';
    }
  }

  const readyHtml = castable.map(item => {
    const active = item.key === selected;
    const label = escape(item.expression);
    const desc = item.effectDesc ? `${item.effectDesc} · คลิกเพื่อวางลงแท่นร่าย` : 'คลิกเพื่อวางลงแท่นร่าย';
    return `<button type="button" id="shortcut-${item.phrase.join('-')}" class="known-chip ${item.kindClass} ${active ? 'is-active' : ''}" data-combo="${item.key}" aria-pressed="${active}" aria-label="วางสูตร ${label} ใช้ ${item.cost} มานา" title="${escape(desc)}" ${busy ? 'disabled' : ''}><span class="known-chip-cat">${item.category}</span><span class="known-chip-name">${label}</span><small class="known-chip-cost">${item.cost} MP</small>${active ? '<span class="known-chip-badge">✓ บนแท่น</span>' : ''}</button>`;
  }).join('');
  const shortHtml = shortMana.slice(0, 4).map(item => {
    const label = escape(item.expression);
    const missing = Math.max(1, item.cost - state.player.mana);
    return `<button type="button" class="known-chip is-short-mana ${item.kindClass}" disabled aria-label="สูตร ${label} ใช้ ${item.cost} มานา ขาดอีก ${missing} มานา" title="มีไพ่ครบแล้ว แต่มานาขาดอีก ${missing} หน่วย (ต้องใช้ ${item.cost} MP)"><span class="known-chip-cat">${item.category}</span><span class="known-chip-name">${label}</span><small class="known-chip-cost is-short">${item.cost} MP · ขาด ${missing}</small></button>`;
  }).join('');
  shortcuts.innerHTML = readyHtml + shortHtml;
  shortcuts.hidden = !(castable.length || shortMana.length);
  shortcuts.scrollLeft = scrollLeft;

  const container = $('quick-combos');
  if (!container) return;
  const combos = getPlayableCombos();
  if (!combos.length || state.player.hand.length > getHandLimit(state.player)) {
    container.hidden = true;
    container.classList.remove('combo-matched', 'combo-prefix-active');
    container.innerHTML = '';
    return;
  }
  container.hidden = false;
  const currentKey = words.filter(Boolean).join(' ');
  const matchedCombo = knownSpell && parsed?.ok ? combos.find(c => c.key === currentKey && c.discovered) : null;
  const prefixMatches = !matchedCombo && currentKey ? combos.filter(c => c.discovered && c.key.startsWith(`${currentKey} `)) : [];
  const isJustUnlocked = Boolean(matchedCombo && lastJustUnlockedKey === matchedCombo.key);
  container.classList.toggle('combo-matched', Boolean(matchedCombo));
  container.classList.toggle('combo-prefix-active', prefixMatches.length > 0);
  const unlockedCount = combos.filter(c => c.discovered).length;
  const headRight = matchedCombo
    ? `<span class="quick-combos-match-status">${isJustUnlocked ? '★ ปลดล็อกสูตรใหม่สำเร็จ' : '✦ ตรงกับสูตรคาถา'}: <strong>${matchedCombo.expression}</strong> (${matchedCombo.cost} มานา)</span>`
    : prefixMatches.length
      ? `<small class="quick-combos-hint prefix-hint">ต่อยอดจากคำบนแท่นได้อีก ${prefixMatches.length} สูตรที่เคยค้นพบ</small>`
      : `<small class="quick-combos-hint">ต้องเรียงคำแล้วกด “ร่ายคาถา” ให้สำเร็จ จึงจะค้นพบและเปิดสูตร ??</small>`;
  container.innerHTML = `<div class="quick-combos-head"><span class="quick-combos-label">สูตรที่ประกอบได้ในมือ (${unlockedCount}/${combos.length} ค้นพบแล้ว)</span>${headRight}</div><div class="quick-combos-list">${combos.map(c => {
    const active = Boolean(matchedCombo && c.key === matchedCombo.key);
    const isPrefix = Boolean(!active && c.discovered && currentKey && c.key.startsWith(`${currentKey} `));
    if (c.discovered) {
      const chipUnlockedNew = active && isJustUnlocked;
      return `<button type="button" class="combo-chip unlocked ${c.kindClass} ${active ? 'active matched' : ''} ${chipUnlockedNew ? 'just-unlocked' : ''} ${isPrefix ? 'prefix-match' : ''}" data-combo="${c.key}" ${active ? 'aria-current="true"' : ''} ${busy ? 'disabled' : ''} title="คลิกเพื่อวางเรียง “${c.expression}” ลงในช่องคาถา"><span class="combo-cat">${c.category}</span><strong>${c.expression}</strong><span class="combo-cost">${c.cost} มานา</span>${active ? `<span class="combo-match-badge">${chipUnlockedNew ? '★ ปลดล็อกใหม่' : '✓ ตรงสูตร'}</span>` : ''}</button>`;
    }
    const masked = c.phrase.map(() => '??').join(' · ');
    return `<button type="button" class="combo-chip locked ${c.kindClass}" data-locked-combo="${c.category} ${c.phrase.length} คำ (${c.cost} มานา)" ${busy ? 'disabled' : ''} title="ยังไม่ถูกค้นพบ · ต้องเรียงคำ ${c.phrase.length} ใบแล้วกดร่ายคาถาเพื่อพิสูจน์สูตร"><span class="combo-cat">${c.category}</span><strong>${masked}</strong><span class="combo-cost">${c.cost} มานา</span></button>`;
  }).join('')}</div>`;
}

export function renderWordBank({ state, words, busy }) {
  const { hand } = state.player;
  const handLimit = getHandLimit(state.player);
  $('hand-count').textContent = `ในมือ ${hand.length}/${handLimit}`;
  const ordered = Object.keys(WORDS).filter(id => hand.includes(id));
  const overflow = hand.length - handLimit;
  const discard = $('discard-panel');
  const bank = $('word-bank');
  const scrollLeft = bank.scrollLeft;
  $('word-bank').hidden = overflow > 0;
  $('enemy-list').inert = overflow > 0;
  const alertEl = $('discard-alert');
  if (alertEl) {
    alertEl.hidden = overflow <= 0;
    if (overflow > 0) {
      const alertText = $('discard-alert-text');
      if (alertText) alertText.textContent = `ไพ่ในมือเกิน ${overflow} ใบ (${hand.length}/${handLimit}) · ต้องเลือกทิ้งก่อนเล่นต่อ`;
      const reopenBtn = $('reopen-discard-btn');
      if (reopenBtn) reopenBtn.textContent = `แตะเพื่อเลือกทิ้งไพ่ (${overflow} ใบ)`;
    }
  }
  $('discard-title').textContent = `มือเกิน ${overflow} ใบ · เลือกทิ้ง ${overflow === 1 ? '1–2' : overflow} ใบ`;
  $('discard-cards').innerHTML = overflow > 0 ? hand.map((id, index) => {
    const word = WORDS[id];
    const meta = cardMeta(id);
    return `<button type="button" class="discard-card playing-card word-${id} ${rarityClass(word)} ${meta.roleClass}" data-discard-index="${index}" aria-pressed="false">${playingCardFace(state, id, { battle: true, headerRight: '<span class="discard-check-mark"><span class="check-box-text">เลือกทิ้ง</span></span>' })}</button>`;
  }).join('') : '';
  const confirmBtn = $('confirm-discard');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = overflow > 0 ? `เลือกทิ้งอีก ${overflow} ใบ` : 'ยืนยันทิ้งการ์ด';
  }
  const totalTypes = ordered.length;
  const mid = (totalTypes - 1) / 2;
  bank.innerHTML = ordered.map((id, idx) => {
    const word = WORDS[id];
    const meta = cardMeta(id);
    const count = hand.filter(card => card === id).length;
    const inUse = words.filter(w => w === id).length;
    const available = count - inUse;
    const extraCopies = Math.min(3, Math.max(0, count - 1));
    const stackSheets = Array.from({ length: extraCopies }, (_, i) => {
      const layerNum = extraCopies - i;
      const isAvailSheet = layerNum < available;
      return `<span class="card-stack-sheet stack-layer-${layerNum} ${isAvailSheet ? 'sheet-avail' : 'sheet-used'}" aria-hidden="true"><span class="sheet-inner"><span class="sheet-corner"><span class="corner-icon">${icon(id)}</span><span class="corner-name">${word.label}</span></span></span></span>`;
    }).join('');
    const copyPips = Array.from({ length: count }, (_, i) => `<i class="copy-pip ${i < available ? 'avail' : 'used'}"></i>`).join('');
    const countBadge = `<span class="card-copies ${count > 1 ? 'is-stacked' : ''}" title="พร้อมใช้ ${available} จาก ${count} ใบ"><span class="copy-pips" aria-hidden="true">${copyPips}</span><span class="copy-count ${available <= 0 ? 'zero' : ''}">${available > 0 ? `×${available}` : `ในแท่น ${inUse}`}</span></span>`;
    const offset = totalTypes > 1 ? idx - mid : 0;
    const fanAngle = (offset * 1.6).toFixed(2);
    const fanLift = (Math.abs(offset) * 2.5).toFixed(1);
    return `<div class="word-item playing-card word-${id} ${rarityClass(word)} ${meta.roleClass} ${count > 1 ? 'has-stack' : ''} ${available <= 0 ? 'depleted' : ''} ${inUse > 0 && available > 0 ? 'partially-used' : ''}" data-copies="${Math.min(4, Math.max(1, available))}" data-total-copies="${count}" style="--fan-angle:${fanAngle}deg;--fan-lift:${fanLift}px">${stackSheets}<button id="word-${id}" class="word-add" data-word="${id}" data-drag-word="${id}" ${busy || overflow > 0 ? 'disabled' : ''}>${playingCardFace(state, id, { headerRight: countBadge, battle: true })}</button><button class="drag-handle" data-drag-word="${id}" tabindex="-1" aria-label="ลากคำ ${word.label}" ${busy || overflow > 0 ? 'disabled' : ''}></button></div>`;
  }).join('');
  bank.scrollLeft = scrollLeft;
  if (!busy && overflow > 0) {
    try {
      $('battle-tools').close();
      if (!discard.open) discard.showModal();
    } catch {
      discard.setAttribute('open', '');
    }
  } else if (overflow <= 0) {
    try { discard.close(); } catch {}
    discard.removeAttribute('open');
  }
}

export function renderForecast({ state, words, busy }, parsed, forecast, knownSpell = false) {
  const box = $('forecast');
  const castBtn = $('cast-button');
  box.className = 'forecast';
  castBtn.removeAttribute('aria-label');
  castBtn.classList.remove('cast-ready', 'cast-insufficient');
  if (busy) {
    box.replaceChildren();
    $('spell-feedback').textContent = '';
    castBtn.disabled = true;
    return;
  }
  if (!words.length) {
    $('cast-cost').textContent = '';
    castBtn.disabled = true;
    $('spell-feedback').textContent = '';
    box.classList.add('invalid');
    box.replaceChildren();
    return;
  }
  if (!knownSpell) {
    const attemptCost = parsed.ok ? battleSpellCost(state, parsed) : estimateWordCost(words, state.player.words);
    const overHand = state.player.hand.length > getHandLimit(state.player);
    const notEnoughMana = attemptCost > state.player.mana;
    if (notEnoughMana) {
      const missing = attemptCost - state.player.mana;
      $('cast-cost').innerHTML = `${attemptCost} มานา <span class="cast-cost-short">ขาด ${missing}</span>`;
      castBtn.classList.add('cast-insufficient');
    } else {
      $('cast-cost').textContent = `${attemptCost} มานา`;
    }
    castBtn.disabled = overHand || notEnoughMana;
    if (overHand || notEnoughMana) {
      box.classList.add('invalid');
      box.replaceChildren();
      $('spell-feedback').textContent = overHand ? 'เลือกทิ้งการ์ดส่วนเกินก่อนร่าย' : `ต้องใช้ ${attemptCost} มานา ขณะนี้มี ${state.player.mana}`;
      return;
    }
    castBtn.classList.add('cast-ready');
    $('spell-feedback').textContent = '';
    box.classList.add('experimental');
    const phraseLabel = words.map(id => WORDS[id].label).join(' · ');
    box.innerHTML = '<strong>สูตรทดลอง</strong><p>ถ้าร่ายไม่สำเร็จ จะเสียการ์ดและมานา แล้วศัตรูจะลงมือ</p>';
    castBtn.setAttribute('aria-label', `ทดลองร่ายคาถา ${phraseLabel} ใช้ ${attemptCost} มานา`);
    return;
  }
  const displayCost = forecast?.ok ? forecast.summary.cost : (parsed.ok ? battleSpellCost(state, parsed) : 0);
  const notEnoughMana = parsed.ok && displayCost > state.player.mana;
  if (notEnoughMana) {
    const missing = displayCost - state.player.mana;
    $('cast-cost').innerHTML = `${displayCost} มานา <span class="cast-cost-short">ขาด ${missing}</span>`;
    castBtn.classList.add('cast-insufficient');
  } else {
    $('cast-cost').textContent = parsed.ok ? `${displayCost} มานา` : '';
  }
  castBtn.disabled = !forecast?.ok;
  $('spell-feedback').textContent = '';
  if (!forecast?.ok) {
    box.classList.add('invalid');
    box.replaceChildren();
    $('spell-feedback').textContent = words.length ? forecast?.error || parsed.error : '';
    return;
  }
  castBtn.classList.add('cast-ready');
  const s = forecast.summary;
  const fallback = s.fellToFloor ?? (s.fellToFloor4 ? 4 : null);
  if (s.hp <= 0 || fallback !== null) box.classList.add('danger');
  let headline = `ทำความเสียหาย ${s.damage} · รับความเสียหาย ${s.incoming} · HP เหลือ ${s.hp}`;
  if (fallback !== null) headline = `จะแพ้ศึกและกลับ${restLocationLabel(fallback)}`;
  else if (s.phase === 'lost') headline = 'HP จะเหลือ 0 และรอบจะจบ';
  else if ((s.eternityPhase || s.armoryGodPhase) && s.phase === 'battle') headline = `บอสจะเข้าสู่เฟส ${s.eternityPhase || s.armoryGodPhase}/3 · ทำความเสียหาย ${s.damage} · HP เหลือ ${s.hp}`;
  else if (s.phase === 'won') headline = `ชนะศึก · HP เหลือ ${s.hp}`;
  else if (s.phase === 'reward') headline = `ชนะศึกและได้เลือกการ์ดคำ · HP เหลือ ${s.hp}`;
  else if (s.nextRoom !== state.room || s.phase === 'sanctuary') headline = `ชนะศึก${s.roomRecovery ? ` · ฟื้น HP ${s.roomRecovery}` : ''} · HP เหลือ ${s.hp}`;
  else if (s.buffApplied) {
    const famNames = s.buffApplied.families.map(f => `${ELEMENT_ICONS[f] ?? ''}${ELEMENT_LABELS[f] ?? f}`).join('+');
    headline = `บัพ${famNames} +${s.buffApplied.pct}% (${s.buffApplied.turns} เทิร์น) · รับดาเมจ ${s.incoming} · HP เหลือ ${s.hp}`;
  } else if (s.manaRestored) {
    headline = `เติมมานา +${s.manaRestored} (เหลือ ${s.manaAfterCast}) · รับดาเมจ ${s.incoming} · HP เหลือ ${s.hp}`;
  } else if (s.delayedShield) {
    headline = `เทิร์นหน้ากางโล่ +${s.delayedShield.amount}${s.delayedShield.healed ? ` และฟื้น ${s.delayedShield.healed} HP` : ''} · รับดาเมจ ${s.incoming} · HP เหลือ ${s.hp}`;
  } else if (s.timeStopped) {
    headline = `หยุดเวลา · ศัตรูข้ามเทิร์น · เล่นต่อทันที · HP เหลือ ${s.hp}`;
  } else if (s.ascensionReady) {
    headline = `เทิร์นหน้าจุติ · การ์ด +10 ร่ายฟรี · รับดาเมจ ${s.incoming} · HP เหลือ ${s.hp}`;
  }
  const lvUpInfo = s.levelUps?.length ? s.levelUps[s.levelUps.length - 1] : null;
  const buffDetail = s.buffApplied
    ? `บัพธาตุ ${s.buffApplied.families.map(f => ELEMENT_LABELS[f] ?? f).join('+')} +${s.buffApplied.pct}%${s.buffApplied.pierce ? ` เจาะ+${s.buffApplied.pierce}` : ''} (${s.buffApplied.turns} เทิร์น)`
    : '';
  const details = [
    s.ascended ? 'จุติ · การ์ด +10 · ใช้ 0 มานา' : `ใช้ ${s.cost} มานา`,
    s.lightPenalty ? `เบา · พลัง −${s.lightPenalty}%${s.lightPierce ? ` · เจาะเกราะ +${s.lightPierce}` : ''}` : '',
    s.manaRestored ? `เติมมานา +${s.manaRestored}` : '',
    s.manaRefunded ? `คืนมานา +${s.manaRefunded}` : '',
    `มานาเหลือ ${s.manaAfterCast}`,
    buffDetail,
    s.wards ? `ทำลายม่าน ${s.wards} ชั้น` : '',
    s.blocked ? `ป้องกันความเสียหาย ${s.blocked}` : '',
    s.healed ? `ฟื้น HP ${s.healed}` : '',
    s.shield ? `โล่เหลือ ${s.shield}` : '',
    (s.goldGain || s.expGain) ? `ได้ 💰+${s.goldGain} ทอง · ✨+${s.expGain} EXP${s.revisit ? ' (ห้องซ้ำ 20%)' : ''}` : '',
    lvUpInfo ? `🎉 เลเวลอัพ Lv.${lvUpInfo.level} (+${lvUpInfo.hpGain} Max HP${lvUpInfo.mpGain ? `, +${lvUpInfo.mpGain} Max MP` : ''})` : '',
    s.phase === 'battle' ? `เทิร์นหน้ามานา ${s.nextMana}` : '',
  ].filter(Boolean);
  box.innerHTML = `<strong>${headline}</strong><details><summary>รายละเอียดผลคาดการณ์</summary><p>${details.join(' · ')}</p>${s.sequence.length ? `<p class="forecast-sequence">${s.sequence.join(' → ')}</p>` : ''}</details>`;
  $('cast-button').setAttribute('aria-label', `ร่ายคาถา ใช้ ${s.cost} มานา ${headline}`);
}

export function renderTutorial({ state, settings, dismissedRoom, words }) {
  $('tutorial').hidden = !settings.tips || dismissedRoom === state.room;
  let text;
  if (state.room === 0 && !state.stats.discovered.length) {
    const hand = state.player.hand;
    const handLimit = getHandLimit(state.player);
    if (hand.length > handLimit) {
      text = `เลือกทิ้งการ์ดส่วนเกินให้เหลือไม่เกิน ${handLimit} ใบ แล้วค่อยเรียงคาถา`;
    } else if (hand.includes('shot') && (hand.includes('fire') || hand.includes('ice'))) {
      const element = hand.includes('fire') ? 'fire' : 'ice';
      const label = WORDS[element].label;
      if (words.length === 2 && words[0] === 'shot' && words[1] === element) {
        text = `เรียง “ลูก ${label}” ครบแล้ว กดปุ่มร่ายเพื่อโจมตี`;
      } else if (words.length === 1 && words[0] === 'shot') {
        text = `เลือก “${label}” ต่อจาก “ลูก” เพื่อให้คาถาครบ`;
      } else {
        text = `คาถาแรกของคุณ เลือก “ลูก” ก่อน แล้วตามด้วย “${label}”`;
      }
    } else if (hand.includes('shield')) {
      text = 'ใช้ “โล่” ใบเดียวเพื่อรับการโจมตี หรือกด “ตั้งรับ” เพื่อรอจั่ว';
    } else {
      text = 'กด “ตั้งรับ” เพื่อรอจั่ว เมื่อได้ “ลูก” กับการ์ดธาตุ ให้เรียงรูปเวทก่อนธาตุ';
    }
  } else if (state.room === 0) {
    text = 'ใช้สูตรที่ค้นพบเพื่อดูผลก่อนร่าย หรือลองเรียงคำใหม่ ถ้ามานาไม่พอ กด “ตั้งรับ” ได้';
  }
  else if (state.enemies.some(e => e.hp > 0 && e.kind === 'prism_crab')) text = 'ปูเกราะปริซึมมีเกราะ 5 แต่จะเปิดกระดองเหลือเกราะ 1 ในเทิร์นถัดไปเมื่อขึ้นป้าย “ปิดกระดอง”';
  else if (state.enemies.some(e => e.hp > 0 && e.kind === 'lantern_wisp')) text = 'โคมวิญญาณจะฮีลเพื่อนที่เหลือ HP ต่ำสุดในเทิร์นคี่ ดูเลข # บนเจตนาแล้วรีบเก็บเป้าหรือสกัดโคมก่อน';
  else if (state.enemies.some(e => e.hp > 0 && e.kind === 'scroll_moth')) text = 'ผีเสื้อคัมภีร์จะถักม่านให้เพื่อนในเทิร์น 1, 4, 7… ใช้ลำแสงทะลุม่านหรือเก็บผีเสื้อก่อน';
  else if (state.enemies.some(e => e.hp > 0 && e.kind === 'chain_hound')) text = 'สุนัขโซ่อาคมจะพุ่งเข้าช่องหน้าเมื่อว่างและตีแรงขึ้น ผลักกลับหรือจัดการตัวหน้าทีละจังหวะ';
  else if (state.room === FLOOR21_START_ROOM) text = 'อาลักษณ์สลับฮีลกับเติมม่าน เลข # บนเจตนาบอกช่องของเพื่อนที่มันจะช่วย';
  else if (state.room === FLOOR21_START_ROOM + 1) text = 'โกเลมชาร์จก่อนฟาดหนักหนึ่งเทิร์น ดูเลขบนป้ายชาร์จเพื่อเตรียมโล่หรือลดแรงโจมตีด้วยน้ำแข็ง';
  else if (state.room === FLOOR21_START_ROOM + 2) text = 'ผู้พิทักษ์เลือกเติมม่านให้เพื่อนที่สัดส่วน HP ต่ำสุด ผลคาดการณ์จะแสดงเมื่อเป้าหมายเปลี่ยน';
  else if (state.enemies.some(e => e.hp > 0 && e.ward > 0)) {
    const deck = state.player.words;
    if (deck.includes('summon') && deck.some(id => CREATURE_WORDS.includes(id))) {
      text = 'ม่านที่สิ่งอัญเชิญโจมตีจะหยุดฟื้น 1 เทิร์น';
    } else if (deck.includes('beam')) {
      text = 'ใช้ “ลำแสง” โจมตีทะลุม่าน';
    } else if (['shot', 'fire', 'pair'].every(id => deck.includes(id))) {
      text = 'ใช้ “ลูก ไฟ คู่” ลูกแรกเปิดม่าน ลูกถัดไปทำดาเมจ';
    } else {
      text = 'ม่านรับการโจมตีหนึ่งครั้งต่อชั้น ดูจำนวนม่านใต้แถบ HP';
    }
  } else if (state.enemies.length > 1 && state.player.words.includes('blast')) text = '“ลูก ไฟ ระเบิด” โดนเป้าหมายและตัวที่อยู่ติดซ้ายขวา ลองเล็งตัวตรงกลาง';
  else if (state.enemies.some(e => e.armor)) text = 'เกราะหักดาเมจทุกครั้ง สายฟ้าข้ามเกราะได้ 2 หน่วย และโล่ช่วยรับการโจมตีหนัก';
  else text = 'ดูเจตนาศัตรูก่อนร่าย น้ำแข็งลดแรงโจมตีครั้งถัดไป และโล่ที่เหลืออยู่ต่อได้อีกหนึ่งเทิร์น';
  $('tutorial-text').textContent = text;
}
