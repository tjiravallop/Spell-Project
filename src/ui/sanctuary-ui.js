import { WORDS, START_WORDS, parseSpell } from '../words.js';
import {
  MAX_BELT_ITEMS,
  MAX_STASH_ITEMS,
  MAX_RELIC_SLOTS,
  MAX_CARD_UPGRADE,
  CARD_SECONDARY_UNLOCK_LEVEL,
  RELIC_DRAFT_CATALOG,
  getAvailableShopItems,
  buyShopItem,
  getEquippedRelics,
  getMaxMana,
  getCardUpgradeLevel,
  deckCapacity,
  hasCardSecondaryUpgrade,
  getCardUpgradeCost,
  getCardUpgradeSuccessRate,
  getCardUpgradeMaterial,
  upgradeWordCard,
  SHOP_ITEMS,
  getCardSecondaryEffect,
  describeCardUpgradeEffect,
  getFloorInfo,
  isSanctuaryFloorUnlocked,
  getSanctuaryCheckpoints,
  getSanctuaryContinueRoom,
  restAtSanctuary,
  updateSanctuaryLoadout,
  ENEMIES,
  RIFT_TIERS,
  isRiftUnlocked,
  isRiftTierUnlocked,
  getRiftDailyStatus,
  getRiftStageRooms,
  getRiftRewardPool,
  rewardRarityRates,
  ownsRewardWord,
} from '../run.js';
import { icon } from '../icons.js';
import { getSanctuaryStory } from '../story.js';
import { MASTER_FORMULAS } from '../combos.js';
import { cardFilterControls, applyCardFilters } from './card-filters.js';
import {
  $,
  escape,
  restLocationLabel,
  cardMeta,
  rarityClass,
  playingCardFace,
  queueFxClassRestart,
  preserveFocus,
} from './dom.js';

let forgeWord = START_WORDS[0];
let forgeResult = null;
let forgeImpactTimer = 0;

function renderForge(state) {
  const { player } = state;
  const list = $('sanctuary-upgrade-list');
  const owned = [...new Set([...START_WORDS, ...state.collection, ...player.words])];
  if (!owned.includes(forgeWord)) forgeWord = owned[0];
  const scroll = list.scrollTop;
  list.innerHTML = owned.map(id => {
    const level = getCardUpgradeLevel(state, id);
    return `<button id="forge-choice-${id}" type="button" class="forge-choice ${rarityClass(WORDS[id])}" data-forge-word="${id}" data-filter-card="${id}" aria-pressed="${id === forgeWord}">${icon(id)}<span>${escape(WORDS[id].label)}</span><small>+${level}</small></button>`;
  }).join('');
  const filters = $('sanctuary-card-filters');
  if (!filters.firstElementChild) filters.innerHTML = cardFilterControls('forge');
  applyCardFilters($('sanctuary-upgrade-panel'), state);
  list.scrollTop = scroll;

  const word = WORDS[forgeWord];
  const level = getCardUpgradeLevel(state, forgeWord);
  const maxed = level >= MAX_CARD_UPGRADE;
  const next = Math.min(MAX_CARD_UPGRADE, level + 1);
  const material = getCardUpgradeMaterial(player);
  const goldCost = getCardUpgradeCost(level, forgeWord);
  const affordable = player.gold >= goldCost;
  const chance = getCardUpgradeSuccessRate(level, Boolean(material), material?.bonus, forgeWord);
  const secondary = hasCardSecondaryUpgrade(state, forgeWord);
  const secondaryInfo = getCardSecondaryEffect(forgeWord, Math.max(CARD_SECONDARY_UNLOCK_LEVEL, level));

  $('forge-stage-card').className = `forge-stage-card ${rarityClass(word)}`;
  $('forge-stage-card').innerHTML = `${icon(forgeWord)}<span>+${level}</span>`;
  $('forge-word-name').textContent = word.label;
  $('forge-level-change').textContent = maxed ? `เต็มระดับ +${level}` : `+${level} → +${next}`;
  $('forge-next-effect').textContent = describeCardUpgradeEffect(forgeWord, next);
  $('forge-terms').hidden = maxed;
  $('forge-chance').textContent = `${chance}%`;
  const materialName = material ? (SHOP_ITEMS[material.id]?.name || 'วัตถุดิบตีบวก') : null;
  $('forge-cost').textContent = material ? `${goldCost} ทอง + ${materialName}` : `${goldCost} ทอง`;
  $('sanctuary-forge-gold').textContent = `${player.gold} ทอง`;
  $('forge-secondary-title').textContent = secondary ? `เอฟเฟกต์รอง · ${secondaryInfo.label}` : `เอฟเฟกต์รอง · ปลดที่ +${CARD_SECONDARY_UNLOCK_LEVEL}`;
  $('forge-secondary-description').textContent = secondaryInfo.description;

  const button = $('forge-upgrade-btn');
  button.disabled = maxed || !affordable;
  button.setAttribute('aria-disabled', String(Boolean(forgeImpactTimer) || button.disabled));
  button.textContent = maxed ? 'ตีบวกเต็มแล้ว' : affordable ? `ตีบวกเป็น +${next}` : `ขาดอีก ${goldCost - player.gold} ทอง`;
  const result = $('forge-result');
  const attempt = forgeResult?.wordId === forgeWord ? forgeResult : null;
  const outcome = forgeImpactTimer ? 'pending' : attempt?.failed ? 'fail' : attempt ? 'success' : 'idle';
  $('forge-stage').dataset.outcome = outcome;
  result.dataset.outcome = outcome;
  if (forgeImpactTimer) {
    result.textContent = 'กำลังตีบวก…';
  } else if (attempt) {
    const effect = attempt.milestoneUnlocked && attempt.secondaryEffect ? ` · ${attempt.secondaryEffect.label}` : '';
    result.textContent = attempt.failed
      ? `ตี +${attempt.attemptedLevel} พลาด · คงระดับ +${attempt.newLevel}`
      : `ตีบวกสำเร็จ · +${attempt.newLevel}${effect}`;
  } else {
    result.textContent = 'ถ้าตีพลาด ระดับจะคงเดิม';
  }
}

let selectedShopItem = null;
let shopCategory = 'all';

function renderShop(state) {
  const { player } = state;
  const catalog = getAvailableShopItems(state);
  const list = $('sanctuary-shop-list');
  const query = $('shop-search').value.trim().toLocaleLowerCase();
  const visible = catalog.filter(item => {
    const category = item.vaultOnly ? 'forge' : item.hpRestore || item.manaRestore ? 'restore' : 'battle';
    return (shopCategory === 'all' || shopCategory === category)
      && (!query || item.name.toLocaleLowerCase().includes(query));
  });
  const sold = state.purchasedShopItems.includes(selectedShopItem);
  const item = sold ? SHOP_ITEMS[selectedShopItem] : visible.find(candidate => candidate.id === selectedShopItem) ?? visible[0];
  selectedShopItem = item?.id ?? null;
  const scroll = list.scrollTop;
  list.innerHTML = visible.map(candidate =>
    `<button id="shop-choice-${candidate.id}" class="shop-choice" type="button" data-shop-choice="${candidate.id}" aria-pressed="${candidate.id === selectedShopItem}"><span class="shop-choice-icon" aria-hidden="true">${escape(candidate.icon)}</span><span>${escape(candidate.name)}</span><small>${candidate.cost} ทอง</small></button>`
  ).join('');
  list.scrollTop = scroll;
  for (const button of $('shop-categories').querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.shopCategory === shopCategory));
  }
  $('shop-empty').hidden = visible.length > 0;
  $('shop-empty').textContent = catalog.length ? 'ไม่พบสินค้า ลองเปลี่ยนคำค้นหรือหมวดสินค้า' : 'สินค้าหมดแล้ว';
  $('shop-detail-content').hidden = !item;
  if (!item) return;

  const beltSpace = !item.vaultOnly && player.items.length < MAX_BELT_ITEMS;
  const hasSpace = beltSpace || player.stash.length < MAX_STASH_ITEMS;
  const shortfall = item.cost - player.gold;
  $('shop-item-icon').textContent = item.icon;
  $('shop-item-name').textContent = item.name;
  $('shop-item-description').textContent = item.description;
  $('shop-item-stock').textContent = sold ? 'ซื้อครบแล้ว' : item.oneTime ? 'จำกัด 1 ชิ้น' : 'ซื้อซ้ำได้';
  $('shop-item-destination').hidden = sold;
  $('shop-item-destination').textContent = hasSpace
    ? (beltSpace ? 'เก็บเข้าเข็มขัด' : 'เก็บเข้าคลังสำรอง')
    : item.vaultOnly ? 'คลังสำรองเต็ม' : 'กระเป๋าเต็ม';
  const buy = $('shop-buy-btn');
  buy.disabled = sold || !hasSpace || shortfall > 0;
  buy.textContent = sold ? 'ซื้อแล้ว' : !hasSpace ? 'ไม่มีช่องเก็บ' : shortfall > 0 ? `ขาดอีก ${shortfall} ทอง` : `ซื้อ · ${item.cost} ทอง`;
}

export function renderSanctuaryTravel(state) {
  const select = $('sanctuary-floor-select');
  const previous = select.value;
  const cleared = new Set(state.clearedRooms ?? []);
  const highest = Math.max(state.highestRoom ?? 0, state.room);
  const floors = new Map();
  state.rooms.forEach((enemies, index) => {
    if (index > highest && !cleared.has(index)) return;
    const info = getFloorInfo(index, state.rooms.length);
    if (!floors.has(info.floor)) floors.set(info.floor, []);
    floors.get(info.floor).push({ index, info, enemies });
  });

  const currentSanctuary = state.sanctuaryFloor ?? 5;
  const rests = getSanctuaryCheckpoints(state)
    .filter(floor => floor !== currentSanctuary && isSanctuaryFloorUnlocked(state, floor))
    .map(floor => [floor, restLocationLabel(floor)]);
  const floorOptions = [...floors.keys()].reverse().map(floor =>
    `<option value="floor-${floor}">ชั้น ${floor}</option>`).join('');
  const restOptions = rests.map(([floor, label]) =>
    `<option value="rest-${floor}">${label}</option>`).join('');
  const options = '<option value="">เลือกชั้นหรือจุดพัก</option>'
    + (floorOptions ? `<optgroup label="ชั้นต่อสู้">${floorOptions}</optgroup>` : '')
    + (restOptions ? `<optgroup label="จุดพัก">${restOptions}</optgroup>` : '');
  if (select.dataset.options !== options) {
    select.innerHTML = options;
    select.value = [...select.options].some(option => option.value === previous) ? previous : '';
    select.dataset.options = options;
  }

  const rooms = floors.get(Number(select.value.slice('floor-'.length)));
  const rest = rests.find(([floor]) => select.value === `rest-${floor}`);
  const map = $('sanctuary-floor-map');
  $('sanctuary-revisit-note').hidden = !rooms?.some(({ index }) => cleared.has(index));
  if (rest) {
    const [floor, label] = rest;
    map.innerHTML = `<button type="button" class="secondary-button" data-enter-sanctuary="${floor}">ไป${label}</button>`;
    return;
  }
  map.innerHTML = rooms ? `<div class="sanctuary-floor-rooms">${rooms.map(({ index, info, enemies }) => {
    const done = cleared.has(index);
    const title = info.isBoss ? info.displayName : `ห้อง ${info.code}`;
    const names = enemies.map(kind => ENEMIES[kind].name).join(' · ');
    return `<button type="button" class="sanctuary-room-btn ${done ? 'is-cleared' : 'is-next'}" data-revisit-room="${index}">
      <strong>${title}</strong><span class="map-room-tag ${done ? 'revisit' : 'next'}">${done ? 'ผ่านแล้ว' : 'พร้อมลุย'}</span>
      <span class="sanctuary-room-enemies">${escape(names)}</span>
    </button>`;
  }).join('')}</div>` : '';
}

export function renderRiftPanel(state) {
  const list = $('rift-tier-list');
  if (!list || !state) return;
  const status = getRiftDailyStatus(state);
  const pill = $('rift-quota-pill');
  if (pill) {
    pill.textContent = `${status.remaining} / ${status.cap} รอบ`;
    pill.classList.toggle('is-empty', status.remaining <= 0);
  }
  const sub = $('rift-quota-sub');
  if (sub) {
    sub.textContent = `ผ่านหอคอยสูงสุดชั้น ${status.cap} (ได้ ${status.cap} รอบ/วัน · ใช้ไปแล้ว ${status.used}) · ผ่านชั้นเพิ่มในวันนี้รับรอบเพิ่มทันที`;
  }
  list.innerHTML = RIFT_TIERS.map(tier => {
    const unlocked = isRiftTierUnlocked(state, tier);
    const stageRooms = getRiftStageRooms(tier);
    const stageLabels = [`${tier - 2}-3`, `${tier - 1}-3`, `บอส ${tier}★`];
    const stagesHtml = stageRooms.map((roomIdx, idx) => {
      const enemyKinds = state.rooms?.[roomIdx] ?? [];
      const names = enemyKinds.map(kind => ENEMIES[kind]?.name ?? kind).join(' · ');
      return `<li><b>ด่าน ${idx + 1} (${stageLabels[idx]})</b><span>${escape(names)}</span></li>`;
    }).join('');
    const pool = getRiftRewardPool(state, tier);
    const unowned = pool.filter(id => !ownsRewardWord(state, id)).length;
    const rates = rewardRarityRates(tier);
    const canEnter = unlocked && status.remaining > 0;
    const btnText = !unlocked
      ? `🔒 ผ่านบอสชั้น ${tier} เพื่อปลดล็อก`
      : status.remaining <= 0
        ? `โควต้าวันนี้หมดแล้ว (${status.remaining}/${status.cap})`
        : `🌀 เข้ารอยแยกชั้น ${tier} (−1 รอบ)`;
    return `<article class="rift-tier-card ${unlocked ? 'is-unlocked' : 'is-locked'}" data-rift-tier-card="${tier}">
      <div class="rift-tier-head">
        <strong>รอยแยกชั้น ${tier}</strong>
        <span class="rift-tier-badge">${unlocked ? 'เปิดแล้ว' : `ล็อกชั้น ${tier}`}</span>
      </div>
      <ul class="rift-stage-list">${stagesHtml}</ul>
      <div class="rift-tier-ceiling">เพดานรางวัลชั้น ${tier} · พูล ${pool.length} ใบ (ยังไม่มี ${unowned} ใบ) · Epic ${rates.epic}% / Legend ${rates.legendary}%</div>
      <button type="button" class="${canEnter ? 'primary-button' : 'secondary-button'} rift-enter-btn" data-enter-rift="${tier}" ${canEnter ? '' : 'disabled'}>${escape(btnText)}</button>
    </article>`;
  }).join('');
}

export function openSanctuaryRiftPanel(ctx) {
  const state = ctx.getState();
  if (!state || state.phase !== 'sanctuary' || !isRiftUnlocked(state)) return;
  const sanctuaryMenu = $('sanctuary-menu');
  const panelIds = [
    'sanctuary-shop-panel',
    'sanctuary-upgrade-panel',
    'sanctuary-deck-panel',
    'sanctuary-tome-panel',
    'sanctuary-map-panel',
    'sanctuary-rift-panel',
  ];
  for (const id of panelIds) $(id).hidden = id !== 'sanctuary-rift-panel';
  $('sanctuary-menu-title').textContent = 'รอยแยกมิติ';
  renderRiftPanel(state);
  if (!sanctuaryMenu.open) sanctuaryMenu.showModal();
  sanctuaryMenu.scrollTop = 0;
}

export function renderSanctuary(ctx) {
  const state = ctx.getState();
  if (!state) return;
  const equipped = ctx.getEquipped();
  const p = state.player;
  p.level ??= 1;
  p.exp ??= 0;
  p.gold ??= 0;
  p.items ??= [];
  state.purchasedShopItems ??= [];
  if (!equipped.length) ctx.setEquipped([...p.words]);
  ctx.syncRpgResourceBar();

  const sanctuaryFloor = state.sanctuaryFloor ?? 5;
  let floorTitle = `ชั้นพัก · ชั้น ${sanctuaryFloor}`;
  if (typeof sanctuaryFloor === 'string') {
    if (sanctuaryFloor.startsWith('pre')) {
      floorTitle = `ชั้นพัก · ก่อนบอสใหญ่ ${sanctuaryFloor.slice(3)}`;
    } else if (sanctuaryFloor.startsWith('post')) {
      floorTitle = `ชั้นพัก · หลังบอสใหญ่ ${sanctuaryFloor.slice(4)}`;
    }
  }
  $('sanctuary-title').textContent = floorTitle;
  const sanctStoryBox = $('sanctuary-story');
  const sanctStory = getSanctuaryStory(state, { recentRelicId: ctx.getRecentRelicDropId() });
  if (sanctStoryBox) {
    $('sanctuary-story-details').hidden = !sanctStory;
    if (sanctStory) {
      sanctStoryBox.hidden = false;
      const artifactHtml = sanctStory.artifactBadge
        ? `<div class="story-artifact-banner">${escape(sanctStory.artifactBadge)}</div>`
        : '';
      const highlightsHtml = sanctStory.highlights?.length
        ? `<ul class="story-highlights">${sanctStory.highlights.map(h => `<li><strong>${escape(h.label)}</strong><span>${escape(h.detail)}</span></li>`).join('')}</ul>`
        : '';
      sanctStoryBox.innerHTML = `<div class="story-kicker">${escape(sanctStory.kicker)}</div><h2>${escape(sanctStory.title)}</h2><p class="story-body">${escape(sanctStory.body)}</p>${artifactHtml}${highlightsHtml}`;
    } else {
      sanctStoryBox.hidden = true;
      sanctStoryBox.innerHTML = '';
    }
  }

  const healPreview = p.maxHp - p.hp;
  const maxMana = getMaxMana(p);
  const canHeal = healPreview > 0 || p.mana < maxMana;
  const restBtn = $('sanctuary-rest-btn');
  restBtn.disabled = state.sanctuaryRested || !canHeal;
  $('sanctuary-rest-label').textContent = state.sanctuaryRested ? 'พักแล้ว' : canHeal ? 'พักฟื้น' : 'พลังเต็ม';
  $('sanctuary-rest-gain').textContent = !restBtn.disabled
    ? [healPreview ? `+${healPreview} HP` : '', p.mana < maxMana ? 'เติมมานาเต็ม' : ''].filter(Boolean).join(' · ')
    : '';

  const nextRoomBtn = $('sanctuary-next-room-btn');
  if (nextRoomBtn) {
    const targetRoomIdx = getSanctuaryContinueRoom(state);
    const fInfo = getFloorInfo(targetRoomIdx, state.rooms.length);
    const isRepeat = state.clearedRooms?.includes(targetRoomIdx);
    nextRoomBtn.dataset.revisitRoom = String(targetRoomIdx);
    const destination = fInfo.isBoss ? `บอสชั้น ${fInfo.floor}` : `ชั้น ${fInfo.floor} · ห้อง ${fInfo.code}`;
    $('sanctuary-next-room-label').textContent = isRepeat ? `เล่นซ้ำ · ${destination}` : `ไต่ต่อ · ${destination}`;
  }

  const riftBtn = $('sanctuary-rift-btn');
  if (riftBtn) {
    const isTutorialTower = (state.rooms?.length ?? 0) <= 6;
    riftBtn.hidden = isTutorialTower;
    if (!isTutorialTower) {
      const unlocked = isRiftUnlocked(state);
      const status = getRiftDailyStatus(state);
      riftBtn.disabled = !unlocked;
      riftBtn.classList.toggle('is-locked', !unlocked);
      $('sanctuary-rift-label').textContent = unlocked ? '🌀 รอยแยก' : '🔒 รอยแยก (ชั้น 20)';
      $('sanctuary-rift-quota').textContent = unlocked ? `${status.remaining}/${status.cap}` : '';
      riftBtn.title = unlocked
        ? `ดันเจี้ยนรอยแยก · คงเหลือวันนี้ ${status.remaining}/${status.cap} รอบ (3 บอสต่อเนื่อง · สุ่มรับการ์ด 1 ใบ)`
        : 'ผ่านบอสใหญ่ชั้น 20 เพื่อปลดล็อกดันเจี้ยนรอยแยก';
    }
  }
  if ($('sanctuary-rift-panel') && !$('sanctuary-rift-panel').hidden) {
    renderRiftPanel(state);
  }

  ctx.syncDiscoveredFromState();
  const deckSet = new Set([...START_WORDS, ...(state.collection ?? []), ...(p.words ?? [])]);
  const craftableFormulas = MASTER_FORMULAS.filter(f => f.phrase.every(w => deckSet.has(w)));
  const undiscoveredCraftable = craftableFormulas.filter(f => !ctx.isFormulaDiscovered(f.key));
  const discoveredCount = ctx.accountDiscovered.size;
  if ($('sanctuary-formula-progress')) {
    $('sanctuary-formula-progress').textContent = `ค้นพบ ${discoveredCount}/${MASTER_FORMULAS.length} สูตร`;
  }
  const insightPreview = $('sanctuary-insight-preview');
  const unlockBtn = $('sanctuary-unlock-formula-btn');
  const insightCost = 12;
  if (insightPreview) {
    if (!undiscoveredCraftable.length) {
      insightPreview.innerHTML = `<div class="insight-box complete">✦ คุณค้นพบสูตรคาถาจากคลังคำที่มีครบทุกสูตรแล้ว!</div>`;
    } else {
      const nextFormula = undiscoveredCraftable[0];
      const masked = nextFormula.phrase.map((w, i) => (i === 0 ? WORDS[w]?.label : '??')).join(' · ');
      insightPreview.innerHTML = `<div class="insight-box"><span class="insight-cat">${nextFormula.category} (${nextFormula.cost} มานา)</span><strong>เบาะแสสูตรถัดไป: ${masked}</strong><small>ยังมีสูตรจากคำที่คุณมีรอการค้นพบอีก ${undiscoveredCraftable.length} สูตร</small></div>`;
    }
  }
  if (unlockBtn) {
    const canUnlock = undiscoveredCraftable.length > 0 && p.gold >= insightCost;
    unlockBtn.disabled = !canUnlock;
    unlockBtn.textContent = !undiscoveredCraftable.length
      ? '✓ ถอดรหัสสูตรที่มีครบแล้ว'
      : p.gold < insightCost
        ? `📜 ถอดรหัสสูตรใหม่ · ทองไม่พอ (${insightCost} ทอง)`
        : `📜 ถอดรหัสสูตรใหม่ · 💰 ${insightCost} ทอง`;
  }

  p.stash ??= [];
  renderShop(state);

  renderSanctuaryTravel(state);

  const activeEquipped = ctx.getEquipped();
  const cap = deckCapacity(state);
  if ($('sanctuary-deck-count')) {
    $('sanctuary-deck-count').textContent = `เลือก ${activeEquipped.length} / ${cap} คำ`;
  }
  renderForge(state);
  const wordsEl = $('sanctuary-words');
  if (wordsEl) {
    wordsEl.innerHTML = [...START_WORDS, ...state.collection].map(id => {
      const checked = activeEquipped.includes(id);
      const word = WORDS[id];
      const meta = cardMeta(id);
      const statusBadge = `<span class="equip-state-badge ${checked ? 'is-equipped' : ''}">${checked ? '✓ พกแล้ว' : 'เลือกพก'}</span>`;
      return `<button type="button" class="secondary-button equip-card playing-card word-${id} ${rarityClass(word)} ${meta.roleClass}" data-sanctuary-equip="${id}" aria-pressed="${checked}" title="${word.description}">${playingCardFace(state, id, { headerRight: statusBadge })}</button>`;
    }).join('');
  }
  if ($('sanctuary-save-deck')) {
    $('sanctuary-save-deck').disabled = activeEquipped.length !== cap;
  }

  const ownedRelics = p.relics ?? [];
  const equippedRelics = getEquippedRelics(p);
  if ($('sanctuary-charm-count')) {
    $('sanctuary-charm-count').textContent = `สวมใส่ ${equippedRelics.length} / ${MAX_RELIC_SLOTS} ช่อง`;
  }
  const charmSlotsEl = $('sanctuary-charm-slots');
  if (charmSlotsEl) {
    const sparkMarkup = '<span class="charm-sparks" aria-hidden="true"><i class="charm-spark"></i><i class="charm-spark"></i><i class="charm-spark"></i><i class="charm-spark"></i><i class="charm-spark"></i><i class="charm-spark"></i></span>';
    charmSlotsEl.innerHTML = Array.from({ length: MAX_RELIC_SLOTS }, (_, slotIdx) => {
      const relicId = equippedRelics[slotIdx];
      const relic = relicId ? RELIC_DRAFT_CATALOG.find(r => r.id === relicId) : null;
      if (!relic) {
        return `<article class="charm-slot empty" data-charm-slot="${slotIdx}"><div class="charm-slot-top"><span class="charm-slot-num">ช่องเครื่องรางที่ ${slotIdx + 1}</span><span class="charm-slot-state">ว่าง</span></div><div class="charm-slot-empty-copy"><strong>ยังไม่ได้สวมใส่เครื่องราง</strong><span>${ownedRelics.some(id => !equippedRelics.includes(id)) ? 'กด “สวมใส่เครื่องราง” จากคลังด้านล่าง' : 'ดรอปจากบอสหลักชั้น 10 / 20 / 30 / 40 / 50'}</span></div></article>`;
      }
      return `<article class="charm-slot filled" data-charm-slot="${slotIdx}" data-equipped-relic="${relic.id}">${sparkMarkup}<div class="charm-slot-top"><span class="charm-slot-num">ช่องเครื่องรางที่ ${slotIdx + 1}</span><span class="charm-slot-state">✦ ทำงานอยู่</span></div><div class="charm-slot-main"><span class="charm-icon-pedestal"><span class="charm-rune-halo" aria-hidden="true"></span><span class="relic-draft-icon">${relic.icon}</span></span><div><strong>${escape(relic.name)}</strong><p>${escape(relic.summary)}</p></div></div><button type="button" class="secondary-button relic-action-btn" data-unequip-relic="${relic.id}">ถอดเครื่องราง</button></article>`;
    }).join('');
  }

  const relicList = $('sanctuary-relic-list');
  if (relicList) {
    const slotsFull = equippedRelics.length >= MAX_RELIC_SLOTS;
    const vaultSparks = '<span class="charm-sparks is-subtle" aria-hidden="true"><i class="charm-spark"></i><i class="charm-spark"></i><i class="charm-spark"></i><i class="charm-spark"></i></span>';
    relicList.innerHTML = RELIC_DRAFT_CATALOG.map(relic => {
      const owned = ownedRelics.includes(relic.id);
      const equippedIdx = equippedRelics.indexOf(relic.id);
      const isEquipped = equippedIdx >= 0;
      const statusText = !owned
        ? `⏳ ${relic.status}`
        : isEquipped
          ? `✦ สวมใส่อยู่ (ช่องเครื่องรางที่ ${equippedIdx + 1})`
          : '📦 เก็บในคลัง (ถอดไว้ — เอฟเฟกต์ปิดชั่วคราว)';
      const actionBtn = !owned
        ? ''
        : isEquipped
          ? `<button type="button" class="secondary-button relic-action-btn" data-unequip-relic="${relic.id}">ถอดออกจากช่องเครื่องราง</button>`
          : `<button type="button" class="primary-button relic-action-btn" data-equip-relic="${relic.id}" ${slotsFull ? 'disabled' : ''}>${slotsFull ? `ช่องเครื่องรางเต็ม (${MAX_RELIC_SLOTS}/${MAX_RELIC_SLOTS})` : 'สวมใส่ในช่องเครื่องราง'}</button>`;
      const iconHtml = isEquipped
        ? `<span class="charm-icon-pedestal is-compact"><span class="charm-rune-halo" aria-hidden="true"></span><span class="relic-draft-icon">${relic.icon}</span></span>`
        : `<span class="relic-draft-icon">${relic.icon}</span>`;
      return `<article class="relic-draft-card ${owned ? 'is-owned' : ''} ${isEquipped ? 'is-equipped' : ''}" data-relic-card="${relic.id}">${isEquipped ? vaultSparks : ''}<div class="relic-draft-head">${iconHtml}<div><strong>${escape(relic.name)}</strong><span class="relic-floor-badge">ดรอปจากบอสชั้นที่ ${relic.dropFloor}</span></div></div><p class="relic-draft-desc">${escape(relic.summary)}</p><small class="relic-draft-status">${escape(statusText)}</small>${actionBtn}</article>`;
    }).join('');
  }
}

export function bindSanctuaryEvents(ctx) {
  const sanctuaryMenu = $('sanctuary-menu');
  const sanctuaryPanels = {
    shop: ['sanctuary-shop-panel', 'ร้านค้า'],
    forge: ['sanctuary-upgrade-panel', 'ตีบวก'],
    deck: ['sanctuary-deck-panel', 'ชุดคำ'],
    tome: ['sanctuary-tome-panel', 'ตำรา'],
    map: ['sanctuary-map-panel', 'เลือกชั้นอื่น'],
    rift: ['sanctuary-rift-panel', 'รอยแยกมิติ'],
  };

  for (const [selector, iconId] of [
    ['[data-sanctuary-menu="shop"]', 'bag'], ['#sanctuary-rest-btn', 'fire'],
    ['[data-sanctuary-menu="forge"]', 'forge'], ['[data-open-inventory]', 'bag'],
    ['[data-sanctuary-menu="deck"]', 'pair'], ['[data-sanctuary-menu="tome"]', 'book'],
  ]) {
    $('sanctuary-view').querySelector(selector).insertAdjacentHTML('afterbegin', icon(iconId));
  }

  for (const button of $('sanctuary-view').querySelectorAll('[data-sanctuary-menu]')) {
    button.addEventListener('click', () => {
      const [activePanel, title] = sanctuaryPanels[button.dataset.sanctuaryMenu];
      for (const [panel] of Object.values(sanctuaryPanels)) $(panel).hidden = panel !== activePanel;
      $('sanctuary-menu-title').textContent = title;
      if (activePanel === 'sanctuary-upgrade-panel') renderForge(ctx.getState());
      if (activePanel === 'sanctuary-rift-panel') renderRiftPanel(ctx.getState());
      if (activePanel === 'sanctuary-shop-panel') {
        selectedShopItem = null;
        $('shop-receipt').textContent = '';
        renderShop(ctx.getState());
      }
      button.focus({ preventScroll: true });
      sanctuaryMenu.showModal();
      sanctuaryMenu.scrollTop = 0;
      ctx.audio.play('place');
    });
  }

  $('shop-search').addEventListener('input', () => {
    selectedShopItem = null;
    $('sanctuary-shop-list').scrollTop = 0;
    $('shop-receipt').textContent = '';
    renderShop(ctx.getState());
  });
  $('shop-categories').addEventListener('click', event => {
    const button = event.target.closest('[data-shop-category]');
    if (!button || button.dataset.shopCategory === shopCategory) return;
    shopCategory = button.dataset.shopCategory;
    selectedShopItem = null;
    $('sanctuary-shop-list').scrollTop = 0;
    $('shop-receipt').textContent = '';
    renderShop(ctx.getState());
  });
  $('sanctuary-shop-list').addEventListener('click', event => {
    const button = event.target.closest('[data-shop-choice]');
    if (!button || button.dataset.shopChoice === selectedShopItem) return;
    selectedShopItem = button.dataset.shopChoice;
    $('shop-receipt').textContent = '';
    preserveFocus(() => renderShop(ctx.getState()));
    ctx.audio.play('place');
  });
  $('shop-buy-btn').addEventListener('click', event => {
    const button = event.currentTarget;
    const state = ctx.getState();
    if (button.disabled || !selectedShopItem || state?.phase !== 'sanctuary') return;
    const item = SHOP_ITEMS[selectedShopItem];
    const receipt = $('shop-receipt');
    try {
      const next = buyShopItem(state, item.id);
      const storage = next.player.items.length > state.player.items.length ? 'เข็มขัด' : 'คลังสำรอง';
      ctx.setState(next);
      ctx.persist();
      ctx.audio.play('coin');
      renderSanctuary(ctx);
      ctx.updateInventoryBadge();
      receipt.textContent = `ซื้อ “${item.name}” แล้ว · เก็บใน${storage}`;
      if (button.disabled) $('shop-item-name').focus({ preventScroll: true });
      for (const id of ['sanctuary-shop-gold', 'sanctuary-gold-pill']) {
        queueFxClassRestart($(id), ['gold-balance-flash'], 'gold-balance-flash');
      }
    } catch (error) {
      receipt.textContent = error.message;
    }
  });

  const forgeStage = $('forge-stage');
  $('sanctuary-upgrade-list').addEventListener('click', event => {
    const choice = event.target.closest('[data-forge-word]');
    if (!choice || forgeImpactTimer || choice.dataset.forgeWord === forgeWord) return;
    forgeWord = choice.dataset.forgeWord;
    forgeResult = null;
    forgeStage.classList.remove('is-striking');
    preserveFocus(() => renderForge(ctx.getState()));
  });

  $('forge-upgrade-btn').addEventListener('click', event => {
    const button = event.currentTarget;
    const state = ctx.getState();
    if (forgeImpactTimer || button.disabled || state?.phase !== 'sanctuary') return;
    try {
      forgeResult = upgradeWordCard(state, forgeWord);
      ctx.setState(forgeResult.state);
      ctx.persist();
      const reveal = () => {
        forgeImpactTimer = 0;
        ctx.audio.play(forgeResult.failed ? 'invalid' : 'forge');
        renderSanctuary(ctx);
        ctx.updateInventoryBadge();
        if (button.disabled) $('forge-word-name').focus({ preventScroll: true });
      };
      if (document.body.classList.contains('reduced-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        reveal();
      } else {
        forgeStage.dataset.outcome = 'pending';
        $('forge-result').dataset.outcome = 'pending';
        $('forge-result').textContent = 'กำลังตีบวก…';
        button.setAttribute('aria-disabled', 'true');
        queueFxClassRestart(forgeStage, ['is-striking'], 'is-striking');
        forgeImpactTimer = setTimeout(reveal, 230);
      }
    } catch (error) {
      $('forge-result').textContent = error.message;
      $('forge-result').dataset.outcome = 'fail';
    }
  });

  sanctuaryMenu.addEventListener('close', () => {
    if (!forgeImpactTimer && !forgeStage.classList.contains('is-striking')) return;
    clearTimeout(forgeImpactTimer);
    forgeImpactTimer = 0;
    forgeStage.classList.remove('is-striking');
    if (ctx.getState()?.phase === 'sanctuary') {
      renderSanctuary(ctx);
      ctx.updateInventoryBadge();
    }
  });

  $('sanctuary-rest-btn')?.addEventListener('click', () => {
    try {
      ctx.setState(restAtSanctuary(ctx.getState()));
      ctx.persist();
      ctx.audio.play('rest');
      ctx.toast('พักที่กองไฟแล้ว · HP และมานาเต็ม');
      renderSanctuary(ctx);
      $('sanctuary-next-room-btn').focus({ preventScroll: true });
    } catch (error) { ctx.toast(error.message); }
  });

  $('sanctuary-floor-select').addEventListener('change', () => renderSanctuaryTravel(ctx.getState()));

  $('sanctuary-unlock-formula-btn')?.addEventListener('click', () => {
    const state = ctx.getState();
    if (!state?.player) return;
    const insightCost = 12;
    if ((state.player.gold ?? 0) < insightCost) {
      ctx.toast(`ทองไม่พอ · ต้องใช้ ${insightCost} ทอง`);
      return;
    }
    const deckSet = new Set([...START_WORDS, ...(state.collection ?? []), ...(state.player.words ?? [])]);
    const nextFormula = MASTER_FORMULAS.find(f => f.phrase.every(w => deckSet.has(w)) && !ctx.isFormulaDiscovered(f.key));
    if (!nextFormula) {
      ctx.toast('ค้นพบสูตรจากคำที่มีครบทั้งหมดแล้ว');
      return;
    }
    state.player.gold -= insightCost;
    const parsed = parseSpell(nextFormula.phrase, Object.keys(WORDS));
    if (parsed?.ok) ctx.recordFormulaDiscovery(parsed, true);
    ctx.persist();
    ctx.saveAccountDiscovered();
    ctx.audio.play('discover');
    renderSanctuary(ctx);
    for (const id of ['gold-value', 'sanctuary-shop-gold', 'sanctuary-gold-pill', 'rpg-resource']) {
      const el = $(id);
      if (el) queueFxClassRestart(el, ['gold-balance-flash'], 'gold-balance-flash');
    }
    ctx.toast(`📜 ปราชญ์ถอดรหัสสูตรสำเร็จ: “${nextFormula.expression}” (${nextFormula.cost} มานา) บันทึกเข้าตำราแล้ว!`);
  });

  $('sanctuary-open-grimoire-btn').addEventListener('click', () => {
    sanctuaryMenu.close();
    const trigger = $('sanctuary-view').querySelector('[data-sanctuary-menu="tome"]');
    trigger.focus();
    ctx.openTools('tome');
  });

  $('sanctuary-save-deck')?.addEventListener('click', () => {
    try {
      ctx.setState(updateSanctuaryLoadout(ctx.getState(), ctx.getEquipped()));
      ctx.persist();
      ctx.audio.play('place');
      ctx.toast('📖 บันทึกชุดคำประจำตัวเรียบร้อยแล้ว');
      renderSanctuary(ctx);
    } catch (error) { ctx.toast(error.message); }
  });
}
