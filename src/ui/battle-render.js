import { WORDS } from '../words.js';
import {
  HAND_LIMIT,
  MAX_BELT_ITEMS,
  MAX_STASH_ITEMS,
  SHOP_ITEMS,
  FLOOR10_BOSS_ROOM,
  FLOOR11_START_ROOM,
  FLOOR20_BOSS_ROOM,
  FLOOR21_START_ROOM,
  FLOOR31_START_ROOM,
  UPPER_RESTS,
  firstClimaxTurn,
  enemyClimaxBonus,
  getFloorInfo,
  getFloorStartRoom,
  isSanctuaryUnlocked,
  isSanctuary9Unlocked,
  isSanctuaryPost10Unlocked,
  isSanctuary14Unlocked,
  isSanctuary19Unlocked,
  isSanctuaryPost20Unlocked,
  ENEMIES,
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
  upperCheckpoint,
  checkpointFloor,
  cardMeta,
  rarityClass,
  playingCardFace,
} from './dom.js';
import { renderPlayerHp } from './battle-fx.js';

export function renderTurnLabel(state) {
  const el = $('turn-label');
  if (!el || !state) return;
  const turn = state.turn;
  const climaxTurn = firstClimaxTurn(state.room);
  const climaxBonus = enemyClimaxBonus(turn, state.room);
  const turnsUntilClimax = Math.max(0, climaxTurn - turn);
  const stateClass = turnsUntilClimax === 0 ? 'turn-climax' : turnsUntilClimax === 1 ? 'turn-critical' : turnsUntilClimax === 2 ? 'turn-caution' : 'turn-calm';
  el.className = `turn-label ${stateClass}`;
  const pips = Array.from({ length: climaxTurn - 1 }, (_, i) => {
    const step = i + 1;
    const filled = turn >= step;
    const current = turn === step;
    const warn = step >= climaxTurn - 2 && filled;
    return `<i class="turn-pip ${filled ? 'filled' : ''} ${current ? 'current' : ''} ${warn ? 'warn' : ''}"></i>`;
  }).join('') + `<i class="turn-pip climax-pip ${climaxBonus > 0 ? 'active' : turnsUntilClimax === 1 ? 'imminent' : ''}"></i>`;
  const frequency = state.room >= FLOOR31_START_ROOM ? 'ทุก 2 เทิร์น' : 'ทุกเทิร์น';
  let statusText = `คลั่งเทิร์น ${climaxTurn}`;
  let titleText = `เทิร์น ${turn} · ศัตรูเริ่มคลั่งเทิร์น ${climaxTurn} และเพิ่มดาเมจ +1 ${frequency}`;
  if (turnsUntilClimax === 2) {
    statusText = '⚠ อีก 2 เทิร์นคลั่ง';
  } else if (turnsUntilClimax === 1) {
    statusText = '🔥 เทิร์นหน้าคลั่ง +1!';
  } else if (climaxBonus > 0) {
    statusText = `⚡ คลั่ง +${climaxBonus} ดาเมจ`;
    titleText = `ศัตรูโจมตีแรงขึ้น +${climaxBonus} หน่วย · เพิ่ม +1 ${frequency}`;
  }
  el.title = titleText;
  el.setAttribute('aria-label', `เทิร์น ${turn} ${statusText} ${turnsUntilClimax > 0 ? `เหลือ ${turnsUntilClimax} เทิร์นก่อนคลั่ง` : ''}`);
  el.innerHTML = `<span class="turn-pips" aria-hidden="true">${pips}</span><strong class="turn-num">เทิร์น ${turn}${turn < climaxTurn ? `/${climaxTurn - 1}` : ''}</strong><span class="turn-sep" aria-hidden="true">·</span><span class="turn-status">${statusText}</span>`;
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

  const sanct4Cluster = renderSanctuaryCluster(
    4, '🏕 ชั้นพัก 4', '🔒 ชั้น 4 (ผ่าน 1–3)', isSanctuaryUnlocked(state),
    'เดินทางไปชั้นที่ 4: ชั้นพักจอมเวท & ร้านค้าเวทมนตร์ (แพ้ในชั้น 5–8 จะร่วงกลับมาพักที่นี่)',
    '🔒 ชั้นที่ 4 (ชั้นพัก) · ต้องผ่านด่านชั้น 1–3 (ปราบบอสชั้น 3) ให้ครบก่อนจึงจะเข้าได้',
    'ชั้น 4', 'ชั้นพัก',
  );
  const sanct9Cluster = state.rooms.length > 9
    ? renderSanctuaryCluster(
        9, '🏕 ชั้นพัก 9', '🔒 ชั้น 9 (ผ่าน 5–8)', isSanctuary9Unlocked(state),
        'เดินทางไปชั้นที่ 9: ชั้นพัก & ร้านค้าเวทมนตร์ (จุดเตรียมตัวก่อนท้าทายบอสชั้น 10)',
        '🔒 ชั้นที่ 9 (ชั้นพัก) · ต้องปราบบอสชั้น 8 (8-3) ให้สำเร็จก่อนจึงจะเข้าได้',
        'ชั้น 9', 'ชั้นพัก',
      )
    : '';

  let floor10Cluster = '';
  let sanctPost10Cluster = '';
  if (state.rooms.length >= 22) {
    const f10Current = state.phase === 'battle' && state.room === FLOOR10_BOSS_ROOM;
    const f10Cleared = cleared.includes(FLOOR10_BOSS_ROOM);
    const f10Unlocked = FLOOR10_BOSS_ROOM <= highest || f10Cleared;
    const f10Cls = f10Current ? 'current' : f10Cleared ? 'done' : f10Unlocked ? 'unlocked' : 'locked';
    const f10Title = f10Cleared
      ? 'บอสพิเศษชั้นที่ 10 · ผ่านแล้ว (คลิกเพื่อท้าทายซ้ำ: ทอง/EXP เหลือ 20%)'
      : f10Current
        ? 'ตำแหน่งปัจจุบัน: บอสพิเศษชั้นที่ 10 (ดรอปอาติแฟคชิ้นแรก)'
        : f10Unlocked
          ? 'บอสพิเศษชั้นที่ 10 · คลิกเพื่อท้าทาย (ดรอปอาติแฟคชิ้นแรก: แก่นเพลิงบรรพกาล)'
          : '🔒 บอสพิเศษชั้นที่ 10 · ผ่านบอสชั้น 8 และเข้าชั้น 9 เพื่อปลดล็อก';
    floor10Cluster = `<div class="floor-cluster ${activeFloorInfo?.floor === 10 ? 'active-floor' : ''}"><span class="floor-cluster-label">ชั้น 10 <small>(บอสพิเศษ)</small></span><div class="floor-cluster-nodes"><button type="button" class="room-node boss-node ${f10Cls}" data-revisit-room="${FLOOR10_BOSS_ROOM}" ${!f10Unlocked || busy ? 'disabled' : ''} ${f10Current ? 'aria-current="step"' : ''} title="${f10Title}" aria-label="${f10Title}"><span class="room-code">บอส 10★</span>${f10Cleared && !f10Current ? '<i class="room-check">✓</i>' : ''}</button></div></div>`;

    sanctPost10Cluster = renderSanctuaryCluster(
      'post10', '🏕 จุดพักหลังบอส 10', '🔒 จุดพัก (ปราบบอส 10)', isSanctuaryPost10Unlocked(state),
      'เข้าสู่จุดพักพิเศษหลังพิชิตบอสชั้น 10 (แพ้ในชั้น 11–13 จะร่วงกลับมาพักที่นี่)',
      '🔒 จุดพักหลังบอส 10 · ปราบบอสพิเศษชั้น 10 เพื่อเปิดจุดพักนี้',
      'หลังบอส 10', 'จุดพักพิเศษ',
    );
  }

  let midUpperPart = '';
  if (state.rooms.length >= 44) {
    const floors11to13 = [11, 12, 13].map(renderFloorCluster).join('');
    const sanct14Cluster = renderSanctuaryCluster(
      14, '🏕 ชั้นพัก 14', '🔒 ชั้น 14 (ผ่าน 11–13)', isSanctuary14Unlocked(state),
      'เดินทางไปชั้นที่ 14: ชั้นพักจอมเวท & ร้านค้าเวทมนตร์ (แพ้ในชั้น 15–18 จะร่วงกลับมาพักที่นี่)',
      '🔒 ชั้นที่ 14 (ชั้นพัก) · ต้องปราบบอสชั้น 13 (13-3) ให้สำเร็จก่อนจึงจะเข้าได้',
      'ชั้น 14', 'ชั้นพัก',
    );
    const floors15to18 = [15, 16, 17, 18].map(renderFloorCluster).join('');
    const sanct19Cluster = renderSanctuaryCluster(
      19, '🏕 ชั้นพัก 19', '🔒 ชั้น 19 (ผ่าน 15–18)', isSanctuary19Unlocked(state),
      'เดินทางไปชั้นที่ 19: ชั้นพัก & ร้านค้าเวทมนตร์ (จุดเตรียมตัวก่อนท้าทายบอสพิเศษชั้น 20)',
      '🔒 ชั้นที่ 19 (ชั้นพัก) · ต้องปราบบอสชั้น 18 (18-3) ให้สำเร็จก่อนจึงจะเข้าได้',
      'ชั้น 19', 'ชั้นพัก',
    );
    const f20Current = state.phase === 'battle' && state.room === FLOOR20_BOSS_ROOM;
    const f20Cleared = cleared.includes(FLOOR20_BOSS_ROOM);
    const f20Unlocked = FLOOR20_BOSS_ROOM <= highest || f20Cleared;
    const f20Cls = f20Current ? 'current' : f20Cleared ? 'done' : f20Unlocked ? 'unlocked' : 'locked';
    const f20Title = f20Cleared
      ? 'บอสพิเศษชั้นที่ 20 · ผ่านแล้ว (คลิกเพื่อท้าทายซ้ำ: ทอง/EXP เหลือ 20%)'
      : f20Current
        ? 'ตำแหน่งปัจจุบัน: บอสพิเศษชั้นที่ 20 (ดรอปอาติแฟคชิ้นที่ 2)'
        : f20Unlocked
          ? 'บอสพิเศษชั้นที่ 20 · คลิกเพื่อท้าทาย (ดรอปอาติแฟคชิ้นที่ 2: ลูกตุ้มสายฟ้าฟาด)'
          : '🔒 บอสพิเศษชั้นที่ 20 · ผ่านบอสชั้น 18 และเข้าชั้น 19 เพื่อปลดล็อก';
    const floor20Cluster = `<div class="floor-cluster ${activeFloorInfo?.floor === 20 ? 'active-floor' : ''}"><span class="floor-cluster-label">ชั้น 20 <small>(บอสพิเศษ)</small></span><div class="floor-cluster-nodes"><button type="button" class="room-node boss-node ${f20Cls}" data-revisit-room="${FLOOR20_BOSS_ROOM}" ${!f20Unlocked || busy ? 'disabled' : ''} ${f20Current ? 'aria-current="step"' : ''} title="${f20Title}" aria-label="${f20Title}"><span class="room-code">บอส 20★</span>${f20Cleared && !f20Current ? '<i class="room-check">✓</i>' : ''}</button></div></div>`;
    const sanctPost20Cluster = renderSanctuaryCluster(
      'post20', '🏕 จุดพักหลังบอส 20', '🔒 จุดพัก (ปราบบอส 20)', isSanctuaryPost20Unlocked(state),
      'เข้าสู่จุดพักพิเศษหลังพิชิตบอสชั้น 20 (ฟังก์ชันครบเหมือนจุดพักทุกชั้น)',
      '🔒 จุดพักหลังบอส 20 · ปราบบอสพิเศษชั้น 20 เพื่อเปิดจุดพักนี้',
      'หลังบอส 20', 'จุดพักพิเศษ',
    );
    midUpperPart = `${floors11to13}${sanct14Cluster}${floors15to18}${sanct19Cluster}${floor20Cluster}${sanctPost20Cluster}`;
  }

  const lowerFloors = [1, 2, 3].map(renderFloorCluster).join('');
  const upperFloors = state.rooms.length > 9 ? [5, 6, 7, 8].map(renderFloorCluster).join('') : '';
  const annex = state.rooms.length > FLOOR21_START_ROOM ? Array.from({ length: state.rooms.length - FLOOR21_START_ROOM }, (_, i) => {
    const floor = 21 + i;
    const key = `post${floor}`;
    const rest = upperCheckpoint(key) ? renderSanctuaryCluster(key, `🏕 พักหลังบอส ${floor}`, `🔒 พักหลังบอส ${floor}`,
      cleared.includes(UPPER_RESTS[key]), `ไปจุดพักหลังบอสชั้น ${floor}`, `ผ่านชั้น ${floor} เพื่อปลดล็อก`, `หลังบอส ${floor}`, 'จุดพัก') : '';
    return renderFloorCluster(floor) + rest;
  }).join('') : '';
  trackEl.innerHTML = `${lowerFloors}${sanct4Cluster}${upperFloors}${sanct9Cluster}${floor10Cluster}${sanctPost10Cluster}${midUpperPart}${annex}`;
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
  if ($('mana-value')) $('mana-value').textContent = `${p.mana} / ${p.maxMana}`;
  if ($('mana-pips')) {
    const count = Math.min(p.maxMana, 16);
    const filled = Math.ceil(count * p.mana / p.maxMana);
    $('mana-pips').innerHTML = Array.from({ length: count }, (_, i) => `<i class="mana-pip ${i < filled ? 'full' : ''}"></i>`).join('');
  }

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
  if (statusEl) {
    statusEl.innerHTML = `<span class="sanctuary-level" title="EXP ${p.exp}/${nextExp}">Lv.${p.level}</span><span class="sanctuary-hp" aria-label="HP ${p.hp}/${p.maxHp}">${icon('heart')} ${p.hp}/${p.maxHp}</span><span class="sanctuary-mana" aria-label="MP ${p.mana}/${p.maxMana}">${icon('mana')} ${p.mana}/${p.maxMana}</span><span id="sanctuary-gold-pill" class="sanctuary-gold" data-gold="${p.gold}" aria-label="${p.gold} ทอง">${icon('coin')} ${p.gold}</span>`;
  }
  renderItemBelt(ctx);
}

export function renderBattleStory(state, collapsedStoryIds) {
  const banner = $('story-banner');
  if (!banner) return;
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
    if (busy && castFxState?.type) slotsEl.classList.add(`cast-fx-${castFxState.type}`);
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

export function renderEnemies({ state, battlefield, targetId, busy }, forecast) {
  const xPositions = battlefield.positions();
  const positions = new Map(state.enemies.map((enemy, index) => [enemy.id, xPositions[index]]));
  $('enemy-list').innerHTML = [...state.enemies].sort((a, b) => a.slot - b.slot).filter(enemy => enemy.hp > 0).map(enemy => {
    const base = ENEMIES[enemy.kind];
    const trait = ENEMY_TRAITS[enemy.kind];
    const action = intent(enemy, state.turn, state.enemies, state.room);
    const after = forecast?.ok ? forecast.summary.enemyHp[enemy.id] : null;
    const finalHp = forecast?.ok ? forecast.summary.finalEnemyHp[enemy.id] : null;
    const status = forecast?.ok ? forecast.summary.enemyStatus[enemy.id] : enemy;
    const projectedAction = after === null ? action : forecast.summary.enemyActions?.[enemy.id] ?? { type: 'dead' };
    const badges = [];
    // Show slot number from Floor 11+ so slot-targeted intents (ฮีล #N, ม่าน #N, เข้าช่อง N) are legible at a glance
    if (state.room >= FLOOR11_START_ROOM) badges.push(`<span class="enemy-badge">#${enemy.slot + 1}</span>`);
    if (enemy.armor > 0) badges.push(`<span class="enemy-badge badge-armor" title="เกราะหักดาเมจทุกครั้งที่โดนโจมตี (สายฟ้าข้ามเกราะได้ 2)">🛡 เกราะ ${enemy.armor}</span>`);
    if (enemy.ward > 0) badges.push(`<span class="enemy-badge badge-ward" title="ม่านเวทบล็อกกระสุนลูกแรก (ใช้คู่เปิดม่าน หรือใช้ลำแสงทะลุม่าน)">🔮 ม่าน ${enemy.ward}</span>`);
    const exposedHint = isRiftBossExposed(enemy.kind, state.turn) ? `เปิดช่อง · รับดาเมจเวทเพิ่ม ${RIFT_EXPOSED_BONUS}%` : '';
    if (exposedHint) badges.push(`<span class="enemy-badge badge-push" title="${exposedHint}">เปิดช่อง +${RIFT_EXPOSED_BONUS}%</span>`);
    const readLabel = enemy.readForm ? WORDS[enemy.readForm].label : '';
    const readHint = base.repeatReduction ? `จำรูปเวทที่ทำดาเมจล่าสุด · ร่ายรูปเดิมซ้ำลดดาเมจ ${base.repeatReduction}% · เทิร์นเปิดช่องร่ายซ้ำได้เต็มแรง` : '';
    if (readHint) badges.push(`<span class="enemy-badge badge-ward" title="${readHint}">${readLabel ? `จำ ${readLabel}${exposedHint ? '' : ` −${base.repeatReduction}%`}` : 'อ่านทางเวท'}</span>`);
    if (status.chill > 0) badges.push(`<span class="enemy-badge badge-chill">❄ หนาว −${status.chill}</span>`);
    if (status.freeze > 0) badges.push(`<span class="enemy-badge badge-freeze">🧊 แช่แข็ง ${status.freeze}</span>`);
    if (status.burn > 0) badges.push(`<span class="enemy-badge badge-burn">🔥 เผา ${status.burn}</span>`);
    if (status.wetUntil >= state.turn) badges.push('<span class="enemy-badge badge-chill">เปียก</span>');
    if (status.obscured) badges.push('<span class="enemy-badge badge-ward">เล็ง −4</span>');
    if (state.magmaPuddles?.includes(enemy.slot)) badges.push('<span class="enemy-badge badge-burn">แอ่งแมกม่า</span>');
    if (status.armor < enemy.armor) badges.push(`<span class="enemy-badge badge-armor">เกราะ → ${status.armor}</span>`);
    if (status.healCutUntil >= state.turn) badges.push('<span class="enemy-badge badge-burn">ฮีล ½</span>');
    if (status.lastingChill) badges.push('<span class="enemy-badge badge-chill">หนาว 2 ครั้ง</span>');
    if (status.sealed) badges.push('<span class="enemy-badge badge-ward badge-sealed">ผนึก</span>');
    if (status.slot !== enemy.slot) badges.push(`<span class="enemy-badge badge-push">↪ ไปช่อง ${status.slot + 1}</span>`);

    const intentClass = action.type === 'attack' && action.amount >= 6 ? 'heavy' : action.type;
    const intentLabel = action.shortLabel ?? (action.type === 'attack' ? `${icon('sword')} ${action.amount}` : action.type === 'heal' ? `${icon('heal')} ${action.amount}` : action.type === 'charge' ? 'ชาร์จ' : action.type === 'sealed' ? 'ติดผนึก' : action.type === 'recover' ? 'เปิดช่อง' : 'แช่แข็ง');
    const description = [base.name, `ช่อง ${enemy.slot + 1}`, `HP ${enemy.hp}/${enemy.maxHp}`, action.label, exposedHint, readLabel && `รูปเวทที่จำ ${readLabel}`, readHint, trait?.passive(state.turn), trait?.counter].filter(Boolean).join(' · ');
    const predicted = finalHp ?? after;
    const projectedLabel = projectedAction.type === 'dead' ? ' → 0'
      : projectedAction.type === 'sealed' && action.type !== 'sealed' ? ' → ผนึก'
        : projectedAction.type === 'frozen' && action.type !== 'frozen' ? ' → แช่แข็ง'
        : projectedAction.shortLabel && projectedAction.shortLabel !== action.shortLabel ? ` → ${projectedAction.shortLabel}`
          : action.type === 'attack' && projectedAction.type === 'attack' && projectedAction.amount !== action.amount ? ` → ${projectedAction.amount}` : '';
    const middleLane = Object.hasOwn(MIDDLE_ENEMIES, enemy.kind) ? ` data-middle-lane="${enemy.slot % 2}"` : '';
    const hpPct = `${Math.max(0, Math.min(100, enemy.hp / enemy.maxHp * 100))}%`;
    return `<button type="button" id="target-${enemy.id}" class="enemy-card enemy-kind-${enemy.kind} ${targetId === enemy.id ? 'target' : ''}" style="--enemy-x:${positions.get(enemy.id) / 3.2}%;--enemy-y:${ENEMIES[enemy.kind]?.isBoss ? 42 : 56}%" data-target="${enemy.id}"${middleLane} aria-pressed="${targetId === enemy.id}" ${busy ? 'disabled' : ''} title="${escape(description)}" aria-label="${escape(description)}${escape(projectedLabel)} เกราะ ${enemy.armor} ม่าน ${enemy.ward}"><span class="enemy-intent intent-${intentClass}">${intentLabel}${projectedLabel}</span><span class="enemy-hp-text">${enemy.hp}/${enemy.maxHp}${predicted !== null && predicted !== enemy.hp ? ` <em>→ ${predicted}</em>` : ''}</span><span class="enemy-hp"><i class="enemy-hp-trail" style="width:${hpPct}"></i><i class="enemy-hp-fill" style="width:${hpPct}"></i></span><span class="enemy-info">${badges.join('')}</span></button>`;
  }).join('');
}

export function renderSlots({ state, words, selectedSlot, busy, castFxState }, parsed, knownSpell = false) {
  const fxClass = busy && castFxState?.type ? `slot-fx-${castFxState.type}` : '';
  $('spell-slots').innerHTML = Array.from({ length: 4 }, (_, index) => {
    const id = words[index];
    const word = WORDS[id];
    const meta = word ? cardMeta(id) : null;
    const stepLabel = `ช่อง ${index + 1}`;
    if (!word) {
      return `<div class="spell-slot empty-slot ${selectedSlot === index ? 'selected' : ''}" data-slot="${index}"><button id="slot-${index}" class="slot-main empty" data-select-slot="${index}" aria-pressed="${selectedSlot === index}" aria-label="${stepLabel} ว่าง" ${busy ? 'disabled' : ''}><span class="slot-socket-frame"><span class="slot-top"><span class="slot-number">${stepLabel}</span></span><span class="slot-empty-emblem" aria-hidden="true">+</span><span class="slot-empty-text">ว่าง</span></span></button></div>`;
    }
    const slotTag = `<span class="slot-pill-num">${stepLabel}</span>`;
    return `<div class="spell-slot filled playing-card word-${id} ${rarityClass(word)} ${meta.roleClass} ${selectedSlot === index ? 'selected' : ''} ${knownSpell ? 'valid-slot' : 'untested-slot'} ${fxClass}" style="--slot-idx:${index}" data-slot="${index}"><button id="slot-${index}" class="slot-main" data-select-slot="${index}" data-drag-slot="${index}" aria-pressed="${selectedSlot === index}" aria-label="${stepLabel} ${word.label}" ${busy ? 'disabled' : ''}>${playingCardFace(state, id, { headerRight: slotTag })}</button><button type="button" class="slot-remove" data-remove-slot="${index}" aria-label="ถอดคำ ${word.label} ออกจาก${stepLabel}" title="ถอดกลับมือ" ${busy ? 'disabled' : ''}>×</button><button class="drag-handle" data-drag-slot="${index}" tabindex="-1" aria-label="ลากคำ ${word.label}" ${busy ? 'disabled' : ''}></button></div>`;
  }).join('');
}

export function getKnownCastableInHand(state, accountDiscovered) {
  const knownKeys = new Set([...accountDiscovered, ...(state?.stats?.discovered ?? [])]);
  const catOrder = { combo_attack: 0, combo_shield: 1, combo_heal: 2 };
  const castable = [];
  let cardsOnlyCount = 0;
  for (const key of knownKeys) {
    const phrase = key.split(' ').filter(Boolean);
    if (!phrase.length) continue;
    const recipe = canFormPhraseInHand(state, phrase);
    if (!recipe) {
      if (canFormCardsInHand(state, phrase)) cardsOnlyCount += 1;
      continue;
    }
    const isHeal = recipe.spell.form === 'heal' || recipe.spell.healing > 0;
    const isDefense = recipe.spell.type === 'self';
    const category = isHeal ? 'ฟื้นฟู' : isDefense ? 'โล่' : 'โจมตี';
    const kindClass = isHeal ? 'combo-heal' : isDefense ? 'combo-shield' : 'combo-attack';
    const catRank = isHeal ? catOrder.combo_heal : isDefense ? catOrder.combo_shield : catOrder.combo_attack;
    const effectDesc = describeFormulaEffect({ phrase: recipe.ids, spell: recipe.spell });
    castable.push({
      key,
      phrase: recipe.ids,
      expression: recipe.expression,
      cost: recipe.cost,
      category,
      kindClass,
      catRank,
      effectDesc,
    });
  }
  castable.sort((a, b) => a.catRank - b.catRank || a.cost - b.cost || a.phrase.length - b.phrase.length || a.key.localeCompare(b.key));
  return { castable, cardsOnlyCount, totalDiscovered: knownKeys.size };
}

export function renderQuickCombos(ctx, parsed, knownSpell = false) {
  const { state, words, busy, accountDiscovered, getPlayableCombos, lastJustUnlockedKey } = ctx;
  const shortcuts = $('known-shortcuts');
  const labelEl = $('known-formulas-label');
  const emptyEl = $('known-formulas-empty');
  const barEl = $('known-formulas-bar');
  const scrollLeft = shortcuts.scrollLeft;
  const selected = words.filter(Boolean).join(' ');
  const { castable, cardsOnlyCount, totalDiscovered } = getKnownCastableInHand(state, accountDiscovered);

  if (labelEl) labelEl.innerHTML = `สูตรที่รู้ · พร้อมร่าย <span class="known-formulas-count">${castable.length}</span>`;
  if (barEl) barEl.classList.toggle('has-formulas', castable.length > 0);
  if (emptyEl) {
    if (castable.length > 0) {
      emptyEl.textContent = 'แตะสูตรเพื่อวางลงแท่น';
      emptyEl.className = 'known-formulas-empty is-hint';
    } else if (state?.player?.hand?.length > HAND_LIMIT) {
      emptyEl.textContent = 'กรุณาทิ้งไพ่ส่วนเกินในมือก่อน';
      emptyEl.className = 'known-formulas-empty';
    } else if (cardsOnlyCount > 0) {
      emptyEl.textContent = `มี ${cardsOnlyCount} สูตรที่ตรงไพ่ในมือ แต่มานา/เงื่อนไขยังไม่พอ`;
      emptyEl.className = 'known-formulas-empty is-warn';
    } else if (totalDiscovered === 0) {
      emptyEl.textContent = 'ยังไม่มีสูตรที่ค้นพบ · วางไพ่แล้วกด “ทดลองร่าย” เพื่อบันทึกสูตรแรก';
      emptyEl.className = 'known-formulas-empty';
    } else {
      emptyEl.textContent = 'ยังไม่มีสูตรที่ร่ายได้จากการ์ดในมือขณะนี้';
      emptyEl.className = 'known-formulas-empty';
    }
  }

  shortcuts.innerHTML = castable.map(item => {
    const active = item.key === selected;
    const label = escape(item.expression);
    const desc = item.effectDesc ? `${item.effectDesc} · คลิกเพื่อวางลงแท่นร่าย` : 'คลิกเพื่อวางลงแท่นร่าย';
    return `<button type="button" id="shortcut-${item.phrase.join('-')}" class="known-chip ${item.kindClass} ${active ? 'is-active' : ''}" data-combo="${item.key}" aria-pressed="${active}" aria-label="วางสูตร ${label} ใช้ ${item.cost} มานา" title="${escape(desc)}" ${busy ? 'disabled' : ''}><span class="known-chip-cat">${item.category}</span><span class="known-chip-name">${label}</span><small class="known-chip-cost">${item.cost} MP</small>${active ? '<span class="known-chip-badge">✓ บนแท่น</span>' : ''}</button>`;
  }).join('');
  shortcuts.hidden = !castable.length;
  shortcuts.scrollLeft = scrollLeft;

  const container = $('quick-combos');
  if (!container) return;
  const combos = getPlayableCombos();
  if (!combos.length || state.player.hand.length > HAND_LIMIT) {
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
  $('hand-count').textContent = `ในมือ ${hand.length}/${HAND_LIMIT}`;
  const ordered = Object.keys(WORDS).filter(id => hand.includes(id));
  const overflow = hand.length - HAND_LIMIT;
  const discard = $('discard-panel');
  const bank = $('word-bank');
  const scrollLeft = bank.scrollLeft;
  $('word-bank').hidden = overflow > 0;
  $('enemy-list').inert = overflow > 0;
  $('discard-title').textContent = `มือเกิน ${overflow} ใบ · เลือกทิ้ง ${overflow === 1 ? '1–2' : overflow} ใบ`;
  $('discard-cards').innerHTML = overflow > 0 ? hand.map((id, index) => {
    const word = WORDS[id];
    const meta = cardMeta(id);
    return `<label class="discard-card playing-card word-${id} ${rarityClass(word)} ${meta.roleClass}"><input type="checkbox" value="${index}">${playingCardFace(state, id, { headerRight: '<span class="discard-check-mark">ทิ้ง</span>' })}</label>`;
  }).join('') : '';
  $('confirm-discard').disabled = true;
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
    return `<div class="word-item playing-card word-${id} ${rarityClass(word)} ${meta.roleClass} ${count > 1 ? 'has-stack' : ''} ${available <= 0 ? 'depleted' : ''} ${inUse > 0 && available > 0 ? 'partially-used' : ''}" data-copies="${Math.min(4, Math.max(1, available))}" data-total-copies="${count}" style="--fan-angle:${fanAngle}deg;--fan-lift:${fanLift}px">${stackSheets}<button id="word-${id}" class="word-add" data-word="${id}" data-drag-word="${id}" ${busy || overflow > 0 ? 'disabled' : ''}>${playingCardFace(state, id, { headerRight: countBadge })}</button><button class="drag-handle" data-drag-word="${id}" tabindex="-1" aria-label="ลากคำ ${word.label}" ${busy || overflow > 0 ? 'disabled' : ''}></button></div>`;
  }).join('');
  bank.scrollLeft = scrollLeft;
  if (!busy && overflow > 0 && !discard.open) {
    $('battle-tools').close();
    discard.showModal();
  } else if (overflow <= 0) discard.close();
}

export function renderForecast({ state, words, busy }, parsed, forecast, knownSpell = false) {
  const box = $('forecast');
  box.className = 'forecast';
  $('cast-button').removeAttribute('aria-label');
  if (busy) {
    box.replaceChildren();
    $('spell-feedback').textContent = '';
    $('cast-button').disabled = true;
    return;
  }
  if (!words.length) {
    $('cast-cost').textContent = '';
    $('cast-button').disabled = true;
    $('spell-feedback').textContent = '';
    box.classList.add('invalid');
    box.replaceChildren();
    return;
  }
  if (!knownSpell) {
    const attemptCost = estimateWordCost(words, state.player.words);
    const overHand = state.player.hand.length > HAND_LIMIT;
    const notEnoughMana = attemptCost > state.player.mana;
    $('cast-cost').textContent = `${attemptCost} มานา`;
    $('cast-button').disabled = overHand || notEnoughMana;
    if (overHand || notEnoughMana) {
      box.classList.add('invalid');
      box.replaceChildren();
      $('spell-feedback').textContent = overHand ? 'เลือกทิ้งการ์ดที่เกินก่อนเล่นต่อ' : `ต้องใช้ ${attemptCost} มานา ขณะนี้มี ${state.player.mana}`;
      return;
    }
    $('spell-feedback').textContent = '';
    box.classList.add('experimental');
    const phraseLabel = words.map(id => WORDS[id].label).join(' · ');
    box.innerHTML = '<strong>สูตรยังไม่ถูกค้นพบ</strong><p>ถ้าร่ายเฟล จะเสียไพ่ มานา และเทิร์น</p>';
    $('cast-button').setAttribute('aria-label', `ทดลองร่ายคาถา ${phraseLabel} ใช้ ${attemptCost} มานา`);
    return;
  }
  $('cast-cost').textContent = parsed.ok ? `${parsed.cost} มานา` : '';
  $('cast-button').disabled = !forecast?.ok;
  $('spell-feedback').textContent = '';
  if (!forecast?.ok) {
    box.classList.add('invalid');
    box.replaceChildren();
    $('spell-feedback').textContent = words.length ? forecast?.error || parsed.error : '';
    return;
  }
  const s = forecast.summary;
  const fell = Boolean(s.fellToFloor || s.fellToFloor4);
  if (s.hp <= 0 || fell) box.classList.add('danger');
  let headline = `ความเสียหาย ${s.damage} · รับ ${s.incoming} · HP เหลือ ${s.hp}`;
  if (s.fellToFloor === 4 || s.fellToFloor4) headline = `พ่ายแพ้ในชั้น 5–8 · ร่วงพักชั้น 4 (รีเซ็ตเริ่มไต่ 5-1 · ฟื้น HP ${s.hp})`;
  else if (s.fellToFloor === 9) headline = `พ่ายแพ้บอสชั้น 10 · ร่วงพักชั้น 9 (ฟื้น HP ${s.hp})`;
  else if (s.fellToFloor === 'post10') headline = `พ่ายแพ้ในชั้น 11–13 · ร่วงพักหลังบอส 10 (รีเซ็ตเริ่มไต่ 11-1 · ฟื้น HP ${s.hp})`;
  else if (s.fellToFloor === 14) headline = `พ่ายแพ้ในชั้น 15–18 · ร่วงพักชั้น 14 (รีเซ็ตเริ่มไต่ 15-1 · ฟื้น HP ${s.hp})`;
  else if (s.fellToFloor === 19) headline = `พ่ายแพ้บอสชั้น 20 · ร่วงพักชั้น 19 (ฟื้น HP ${s.hp})`;
  else if (upperCheckpoint(s.fellToFloor)) headline = `พ่ายแพ้ · กลับจุดพักหลังบอส ${checkpointFloor(s.fellToFloor)} · HP ${s.hp}`;
  else if (s.hp <= 0) headline = 'หลังศัตรูตอบโต้ HP จะเหลือ 0';
  else if (s.phase === 'reward') headline = `ผ่านศึก · เปิดการ์ดคำ · HP เหลือ ${s.hp}`;
  else if (s.nextRoom !== state.room || s.phase === 'sanctuary') headline = `ผ่านศึกเปิดทาง${s.roomRecovery ? ` · ฟื้น HP +${s.roomRecovery}` : ''} · HP เหลือ ${s.hp}`;
  const lvUpInfo = s.levelUps?.length ? s.levelUps[s.levelUps.length - 1] : null;
  const details = [
    `ใช้ ${s.cost} มานา`,
    s.manaRefunded ? `คืนมานา +${s.manaRefunded}` : '',
    `เหลือ ${s.manaAfterCast}`,
    s.wards ? `ทำลายม่าน ${s.wards}` : '',
    s.blocked ? `ป้องกัน ${s.blocked}` : '',
    s.healed ? `ฟื้น ${s.healed}` : '',
    s.shield ? `โล่เหลือ ${s.shield}` : '',
    (s.goldGain || s.expGain) ? `ได้ 💰+${s.goldGain} ทอง · ✨+${s.expGain} EXP${s.revisit ? ' (ห้องซ้ำ 20%)' : ''}` : '',
    lvUpInfo ? `🎉 เลเวลอัพ Lv.${lvUpInfo.level} (+${lvUpInfo.hpGain} Max HP${lvUpInfo.mpGain ? `, +${lvUpInfo.mpGain} Max MP` : ''})` : '',
    s.phase === 'battle' ? `เทิร์นหน้ามานา ${s.nextMana}` : '',
  ].filter(Boolean);
  box.innerHTML = `<strong>${headline}</strong><details><summary>รายละเอียด</summary><p>${details.join(' · ')}</p>${s.sequence.length ? `<p class="forecast-sequence">${s.sequence.join(' → ')}</p>` : ''}</details>`;
  $('cast-button').setAttribute('aria-label', `ร่ายคาถา ใช้ ${s.cost} มานา ${headline}`);
}

export function renderTutorial({ state, settings, dismissedRoom }) {
  $('tutorial').hidden = !settings.tips || dismissedRoom === state.room;
  let text;
  if (state.room === 0) text = 'แตะหรือลากไพ่ขึ้นแท่น แล้วกดทดลองร่าย';
  else if (state.enemies.some(e => e.hp > 0 && e.kind === 'prism_crab')) text = 'ปูเกราะปริซึมมีเกราะ 5 แต่จะเปิดกระดองเหลือเกราะ 1 ในเทิร์นถัดไปเมื่อขึ้นป้าย “ปิดกระดอง”';
  else if (state.enemies.some(e => e.hp > 0 && e.kind === 'lantern_wisp')) text = 'โคมวิญญาณจะฮีลเพื่อนที่เหลือ HP ต่ำสุดในเทิร์นคี่ ดูเลข # บนเจตนาแล้วรีบเก็บเป้าหรือสกัดโคมก่อน';
  else if (state.enemies.some(e => e.hp > 0 && e.kind === 'scroll_moth')) text = 'ผีเสื้อคัมภีร์จะถักม่านให้เพื่อนในเทิร์น 1, 4, 7… ใช้ลำแสงทะลุม่านหรือเก็บผีเสื้อก่อน';
  else if (state.enemies.some(e => e.hp > 0 && e.kind === 'chain_hound')) text = 'สุนัขโซ่อาคมจะพุ่งเข้าช่องหน้าเมื่อว่างและตีแรงขึ้น ผลักกลับหรือจัดการตัวหน้าทีละจังหวะ';
  else if (state.room === FLOOR21_START_ROOM) text = 'อาลักษณ์สลับฮีลกับเติมม่าน เลข # บนเจตนาบอกช่องของเพื่อนที่มันจะช่วย';
  else if (state.room === FLOOR21_START_ROOM + 1) text = 'โกเลมชาร์จก่อนฟาดหนักหนึ่งเทิร์น ดูเลขบนป้ายชาร์จเพื่อเตรียมโล่หรือลดแรงโจมตีด้วยน้ำแข็ง';
  else if (state.room === FLOOR21_START_ROOM + 2) text = 'ผู้พิทักษ์เลือกเติมม่านให้เพื่อนที่สัดส่วน HP ต่ำสุด ผลคาดการณ์จะแสดงเมื่อเป้าหมายเปลี่ยน';
  else if (state.enemies.some(e => e.kind === 'elite')) text = 'บอสมีม่านในเทิร์นคี่ ใช้ “ลูก ไฟ คู่” เปิดม่านแล้วทำดาเมจ หรือรอเทิร์นคู่เพื่อยิงตอนม่านหาย';
  else if (state.enemies.some(e => e.ward > 0) && state.player.words.includes('pair')) text = 'เมื่อศัตรูมีม่าน ใช้ “ลูก ไฟ คู่” ให้ลูกแรกเปิดม่านและลูกที่สองทำดาเมจ ถ้าคำยังไม่ครบ ให้ป้องกันเพื่อรอจั่ว';
  else if (state.enemies.length > 1 && state.player.words.includes('blast')) text = '“ลูก ไฟ ระเบิด” โดนเป้าหมายและตัวที่อยู่ติดซ้ายขวา ลองเล็งตัวตรงกลาง';
  else if (state.enemies.some(e => e.armor)) text = 'เกราะหักดาเมจทุกครั้ง สายฟ้าข้ามเกราะได้ 2 หน่วย และโล่ช่วยรับการโจมตีหนัก';
  else text = 'ดูเจตนาศัตรูก่อนร่าย น้ำแข็งลดแรงโจมตีครั้งถัดไป และโล่ที่เหลืออยู่ต่อได้อีกหนึ่งเทิร์น';
  $('tutorial-text').textContent = text;
}
