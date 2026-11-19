import { WORDS, START_WORDS, parseSpell } from '../words.js';
import {
  MAX_BELT_ITEMS,
  MAX_STASH_ITEMS,
  MAX_RELIC_SLOTS,
  MAX_CARD_UPGRADE,
  CARD_SECONDARY_UNLOCK_LEVEL,
  RELIC_DRAFT_CATALOG,
  getAvailableShopItems,
  getEquippedRelics,
  getCardUpgradeLevel,
  deckCapacity,
  hasCardSecondaryUpgrade,
  getCardUpgradeCost,
  getCardUpgradeSuccessRate,
  getCardSecondaryTier,
  getCardSecondaryEffect,
  describeCardUpgradeEffect,
  getFloorInfo,
  isSanctuaryFloorUnlocked,
  getSanctuaryCheckpoints,
  getSanctuaryContinueRoom,
  restAtSanctuary,
  updateSanctuaryLoadout,
  ENEMIES,
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
} from './dom.js';

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
  const canHeal = healPreview > 0 || p.mana < p.maxMana;
  const restBtn = $('sanctuary-rest-btn');
  restBtn.disabled = state.sanctuaryRested || !canHeal;
  $('sanctuary-rest-label').textContent = state.sanctuaryRested ? 'พักแล้ว' : canHeal ? 'พักฟื้น' : 'พลังเต็ม';
  $('sanctuary-rest-gain').textContent = !restBtn.disabled
    ? [healPreview ? `+${healPreview} HP` : '', p.mana < p.maxMana ? 'เติมมานาเต็ม' : ''].filter(Boolean).join(' · ')
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
  const shopList = $('sanctuary-shop-list');
  if (shopList) {
    const availableItems = getAvailableShopItems(state);
    if (!availableItems.length) {
      shopList.innerHTML = `<div class="shop-empty-notice">สินค้าในร้านถูกซื้อครบหมดแล้ว</div>`;
    } else {
      const groups = [
        { label: 'ฟื้นฟู HP และมานา', items: availableItems.filter(item => item.hpRestore || item.manaRestore) },
        { label: 'เครื่องมือในสนาม', items: availableItems.filter(item => !item.hpRestore && !item.manaRestore && !item.vaultOnly) },
        { label: 'วัตถุดิบตีบวก', items: availableItems.filter(item => item.vaultOnly) },
      ];
      const card = item => {
        const canAfford = p.gold >= item.cost;
        const hasSpace = (!item.vaultOnly && p.items.length < MAX_BELT_ITEMS) || p.stash.length < MAX_STASH_ITEMS;
        const disabled = !hasSpace || !canAfford;
        const stockTag = item.oneTime
          ? `<span class="shop-stock-tag once">จำกัด 1 ชิ้น</span>`
          : `<span class="shop-stock-tag repeat">ซื้อซ้ำได้</span>`;
        const btnLabel = !hasSpace
          ? `กระเป๋าเต็ม (${MAX_BELT_ITEMS + MAX_STASH_ITEMS}/${MAX_BELT_ITEMS + MAX_STASH_ITEMS})`
          : !canAfford
            ? `ทองไม่พอ (${item.cost} ทอง)`
            : `ซื้อไอเทม · 💰 ${item.cost} ทอง`;
        return `<article class="shop-item-card ${item.oneTime ? 'is-one-time' : ''} ${disabled ? 'is-disabled' : 'is-selectable'}" data-shop-item="${item.id}" ${disabled ? '' : `data-buy-item="${item.id}"`}><div class="shop-item-head"><span class="shop-item-icon">${item.icon}</span><div class="shop-item-title"><strong>${escape(item.name)}</strong><span class="shop-item-badge">${escape(item.badge)}</span></div><div class="shop-item-price-group"><span class="shop-item-price">💰 ${item.cost}</span>${stockTag}</div></div><p class="shop-item-desc">${escape(item.description)}</p><button type="button" class="secondary-button shop-buy-btn" data-buy-item="${item.id}" ${disabled ? 'disabled' : ''}>${btnLabel}</button></article>`;
      };
      shopList.innerHTML = groups.filter(group => group.items.length)
        .map(group => `<h3 class="shop-group-heading">${group.label}</h3>${group.items.map(card).join('')}`).join('');
    }
  }

  renderSanctuaryTravel(state);

  const activeEquipped = ctx.getEquipped();
  const cap = deckCapacity(state);
  if ($('sanctuary-deck-count')) {
    $('sanctuary-deck-count').textContent = `เลือก ${activeEquipped.length} / ${cap} คำ`;
  }
  const ownedCards = [...new Set([...START_WORDS, ...(state.collection ?? []), ...(p.words ?? [])])];
  const upgradeListEl = $('sanctuary-upgrade-list');
  if (upgradeListEl) {
    const filterControls = $('sanctuary-card-filters');
    if (filterControls && !filterControls.firstElementChild) filterControls.innerHTML = cardFilterControls('forge');
    const hasStone = (p.stash ?? []).includes('smithing_stone') || (p.items ?? []).includes('smithing_stone');
    upgradeListEl.innerHTML = ownedCards.map(id => {
      const word = WORDS[id];
      const lv = getCardUpgradeLevel(state, id);
      const secUnlocked = hasCardSecondaryUpgrade(state, id);
      const secTier = getCardSecondaryTier(lv, Boolean(p.cardSecondaryUpgrades?.[id]));
      const secInfo = getCardSecondaryEffect(id, Math.max(CARD_SECONDARY_UNLOCK_LEVEL, lv));
      const inActiveDeck = p.words.includes(id);
      const statGoldCost = getCardUpgradeCost(lv);
      const chancePercent = getCardUpgradeSuccessRate(lv, hasStone);
      const isMaxStat = lv >= MAX_CARD_UPGRADE;
      const canStatUpgrade = !isMaxStat && (hasStone || p.gold >= statGoldCost);

      const nextMilestone = lv < 7 ? 7 : lv < 9 ? 9 : 10;
      const chanceTone = chancePercent >= 80 ? 'safe' : chancePercent >= 50 ? 'mid' : 'risky';
      const chancePill = isMaxStat
        ? `<span class="forge-chance-pill safe">✦ ตีบวกสูงสุด +${MAX_CARD_UPGRADE}</span>`
        : `<span class="forge-chance-pill ${chanceTone}" title="หากตีบวกไม่ติด การ์ดจะไม่แตกและไม่ลดระดับ">🎲 โอกาสติด ${chancePercent}%${hasStone ? ' (+หิน 15%)' : ''}</span>`;

      const currentStatDesc = lv > 0
        ? `สเตตัสปัจจุบัน (+${lv}): ${describeCardUpgradeEffect(id, lv)} · ถัดไป (+${Math.min(MAX_CARD_UPGRADE, lv + 1)}): ${describeCardUpgradeEffect(id, Math.min(MAX_CARD_UPGRADE, lv + 1))}`
        : `เมื่อตีบวก (+1): ${describeCardUpgradeEffect(id, 1)}`;
      const nextStatBtnLabel = isMaxStat
        ? `✓ ตีบวกเต็มระดับสูงสุด (+${MAX_CARD_UPGRADE})`
        : hasStone
          ? `⚒️ ตีบวก +${lv + 1} (โอกาส ${chancePercent}%) · ใช้หินตีบวกฟรี`
          : `⚒️ ตีบวก +${lv + 1} (โอกาส ${chancePercent}%) · 💰 ${statGoldCost} ทอง`;

      const milestoneStatusText = secUnlocked
        ? `🌟 ปลดล็อกเอฟเฟกต์รอง ${secInfo.tierTag} แล้ว (${secInfo.badge})${lv < 10 ? ` · ตีบวกถึง +${nextMilestone} เพื่อยกระดับขั้นถัดไป!` : ' · ระดับสูงสุด!'}`
        : `🔒 เอฟเฟกต์รองจะปลดล็อกอัตโนมัติเมื่อตีบวกถึง +7 (+9 / +10 แรงขึ้น): ${secInfo.badge}`;

      return `<article class="forge-card word-${id} ${rarityClass(word)} ${lv > 0 || secUnlocked ? 'is-upgraded' : ''}" data-forge-card="${id}" data-filter-card="${id}"><div class="forge-card-head"><div class="forge-card-title"><span class="forge-card-icon">${icon(id)}</span><div><strong>${escape(word.label)}${lv > 0 ? ` +${lv}` : ''}</strong><small class="forge-deck-tag ${inActiveDeck ? 'active' : ''}">${inActiveDeck ? '✓ พกในสำรับ' : 'ในคลังสะสม'}</small></div></div><div class="forge-badges"><span class="forge-lv-pill ${lv > 0 ? 'has-lv' : ''}">+${lv}/${MAX_CARD_UPGRADE}</span>${chancePill}${secUnlocked ? `<span class="forge-sec-pill unlocked">ขั้น ${secTier}: ${escape(secInfo.badge)}</span>` : `<span class="forge-sec-pill locked">ปลดล็อกที่ +7: ${escape(secInfo.badge)}</span>`}</div></div><p class="forge-stat-desc">⚡ ${escape(currentStatDesc)}</p><p class="forge-sec-desc">${escape(milestoneStatusText)} — ${escape(secInfo.description)}</p><div class="forge-actions"><button type="button" class="secondary-button forge-btn forge-stat-btn" data-upgrade-card="${id}" data-upgrade-mode="stat" ${!canStatUpgrade ? 'disabled' : ''}>${nextStatBtnLabel}</button></div></article>`;
    }).join('');
    applyCardFilters($('sanctuary-upgrade-panel'), state);
  }
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
      button.focus({ preventScroll: true });
      sanctuaryMenu.showModal();
      sanctuaryMenu.scrollTop = 0;
      ctx.audio.play('place');
    });
  }

  $('sanctuary-rest-btn')?.addEventListener('click', () => {
    try {
      ctx.setState(restAtSanctuary(ctx.getState()));
      ctx.persist();
      ctx.audio.play('win');
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
