import { WORDS, START_WORDS, ELEMENT_LABELS } from '../words.js';
import { ENEMY_TRAITS } from '../enemy-traits.js';
import { ENDGAME_ENEMIES } from '../endgame-tower.js';
import { ACHIEVEMENTS } from './storage-discovery.js';
import {
  ENEMIES,
  getHandLimit,
  getMaxMana,
  MAX_BELT_ITEMS,
  MAX_STASH_ITEMS,
  MAX_CARD_UPGRADE,
  CARD_SECONDARY_UNLOCK_LEVEL,
  SHOP_ITEMS,
  BLESSING_CATALOG,
  RELIC_DRAFT_CATALOG,
  getEquippedRelics,
  getCardUpgradeLevel,
  hasCardSecondaryUpgrade,
  getCardUpgradeSuccessRate,
  getCardUpgradeMaterial,
  getCardSecondaryTier,
  getCardSecondaryEffect,
  describeCardUpgradeEffect,
  nextExpForLevel,
  isSanctuaryUnlocked,
  isSanctuary9Unlocked,
  isSanctuaryPost10Unlocked,
  isSanctuary14Unlocked,
  isSanctuary19Unlocked,
  isSanctuaryPost20Unlocked,
  GEAR_SLOTS,
  GEAR_SLOT_LABELS,
  GEAR_SLOT_ICONS,
  GEAR_RARITY_LABELS,
  getEquippedGearEntries,
  describeGearRefineBonus,
} from '../run.js';
import { icon } from '../icons.js';
import { MASTER_FORMULAS, canFormPhraseInHand, describeFormulaEffect } from '../combos.js';
import { $, escape, rarityBadge } from './dom.js';
import { renderItemBelt, renderRoomTrack } from './battle-render.js';
import { cardFilterControls, applyCardFilters } from './card-filters.js';

const GRIMOIRE_PAGE_SIZE = 24;

export function createModalsController(ctx) {
  let grimoireTab = 'discovered';
  let grimoirePage = 1;
  let inventoryTab = 'items';

  function updateGuideButtonBadge() {
    const btn = $('guide-open');
    if (!btn) return;
    ctx.syncDiscoveredFromState();
    btn.title = `ตำราคาถา · ค้นพบ ${ctx.accountDiscovered.size}/${MASTER_FORMULAS.length} สูตร`;
  }

  function renderGrimoire() {
    ctx.syncDiscoveredFromState();
    updateGuideButtonBadge();
    const state = ctx.getState();
    const screen = ctx.getScreen();
    const busy = ctx.getBusy();
    const listEl = $('grimoire-list');
    const wordGuideEl = $('word-guide');
    const progressText = $('grimoire-progress-text');
    const progressBar = $('grimoire-progress-bar');
    if (!listEl || !wordGuideEl) return;

    const discoveredList = MASTER_FORMULAS.filter(f => ctx.accountDiscovered.has(f.key));
    const totalCount = MASTER_FORMULAS.length;
    const pct = totalCount ? Math.round((discoveredList.length / totalCount) * 100) : 0;
    if (progressText) progressText.textContent = `${discoveredList.length} / ${totalCount} สูตร (${pct}%)`;
    if (progressBar) progressBar.style.width = `${pct}%`;

    const tabsEl = $('grimoire-tabs');
    if (tabsEl) {
      for (const btn of tabsEl.querySelectorAll('[data-grimoire-tab]')) {
        const tab = btn.dataset.grimoireTab;
        const active = tab === grimoireTab;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
        if (tab === 'discovered') btn.textContent = `ค้นพบแล้ว (${discoveredList.length})`;
        else if (tab === 'all') btn.textContent = `สูตรทั้งหมด (${totalCount})`;
      }
    }

    const showingWords = grimoireTab === 'words';
    listEl.hidden = showingWords;
    wordGuideEl.hidden = !showingWords;
    $('grimoire-filters').hidden = showingWords;
    $('grimoire-pages').hidden = true;
    if (showingWords) return;

    let filtered = MASTER_FORMULAS;
    if (grimoireTab === 'discovered') filtered = discoveredList;
    else if (grimoireTab === 'attack') filtered = MASTER_FORMULAS.filter(f => f.group === 'attack');
    else if (grimoireTab === 'defense') filtered = MASTER_FORMULAS.filter(f => f.group === 'defense');
    else if (grimoireTab === 'summon') filtered = MASTER_FORMULAS.filter(f => f.group === 'summon');

    const inBattle = screen === 'battle' && state?.phase === 'battle' && !busy && state.player.hand.length <= getHandLimit(state.player);
    $('grimoire-castable-label').hidden = !inBattle;
    const word = $('grimoire-word-filter').value;
    if (word) filtered = filtered.filter(f => f.phrase.includes(word));
    const castableOnly = inBattle && $('grimoire-castable').checked;
    if (castableOnly) filtered = filtered.filter(f => ctx.accountDiscovered.has(f.key) && canFormPhraseInHand(state, f.phrase));

    if (!filtered.length) {
      const emptyText = castableOnly ? 'ไม่มีสูตรที่ค้นพบซึ่งร่ายได้จากไพ่และมานาตอนนี้'
        : word ? 'ไม่มีสูตรที่ตรงกับคำและหมวดที่เลือก' : 'ลองร่ายคาถาให้สำเร็จเพื่อบันทึกสูตรลงตำรา';
      listEl.innerHTML = `<p class="grimoire-empty">${emptyText}</p>`;
      return;
    }

    const pageCount = Math.ceil(filtered.length / GRIMOIRE_PAGE_SIZE);
    grimoirePage = Math.min(Math.max(grimoirePage, 1), pageCount);
    $('grimoire-pages').hidden = pageCount <= 1;
    $('grimoire-prev').disabled = grimoirePage <= 1;
    $('grimoire-next').disabled = grimoirePage >= pageCount;
    $('grimoire-page-number').textContent = `หน้า ${grimoirePage} / ${pageCount} · ${filtered.length} สูตร`;
    const first = (grimoirePage - 1) * GRIMOIRE_PAGE_SIZE;
    listEl.scrollTop = 0;
    const tomePanel = $('tools-tome');
    if (tomePanel) tomePanel.scrollTop = 0;
    listEl.innerHTML = filtered.slice(first, first + GRIMOIRE_PAGE_SIZE).map(f => {
      const discovered = ctx.accountDiscovered.has(f.key);
      const playableNow = castableOnly || inBattle && discovered && Boolean(canFormPhraseInHand(state, f.phrase));
      if (discovered) {
        const chips = f.phrase.map(id => `<span class="grimoire-word-pill word-${id}">${icon(id)}<span>${WORDS[id]?.label ?? id}</span></span>`).join('<span class="grimoire-word-arrow" aria-hidden="true">+</span>');
        return `<article class="grimoire-card is-discovered ${f.kindClass} ${playableNow ? 'is-playable' : ''}"><div class="grimoire-card-head"><span class="grimoire-cat">${f.category}</span><strong class="grimoire-title">${escape(f.expression)}</strong><span class="grimoire-cost">${f.cost} มานา</span></div><div class="grimoire-words">${chips}</div><div class="grimoire-card-foot"><p class="grimoire-desc">${escape(describeFormulaEffect(f))}</p>${playableNow ? `<button type="button" class="secondary-button small-button grimoire-use-btn" data-grimoire-combo="${f.key}">วางลงแท่นร่าย</button>` : ''}</div></article>`;
      }
      const maskedChips = f.phrase.map(() => `<span class="grimoire-word-pill is-locked">??</span>`).join('<span class="grimoire-word-arrow" aria-hidden="true">+</span>');
      return `<article class="grimoire-card is-locked ${f.kindClass}"><div class="grimoire-card-head"><span class="grimoire-cat">${f.category}</span><strong class="grimoire-title">สูตรที่ยังไม่ค้นพบ (${f.phrase.length} คำ)</strong><span class="grimoire-cost">${f.cost} มานา</span></div><div class="grimoire-words">${maskedChips}</div><div class="grimoire-card-foot"><p class="grimoire-desc">ต้องเรียงคำ ${f.phrase.length} ใบและกด “ร่ายคาถา” ให้สำเร็จเพื่อบันทึกสูตรนี้</p></div></article>`;
    }).join('');
  }

  function renderInventoryModal() {
    const heroEl = $('inventory-hero-stats');
    const bodyEl = $('inventory-body');
    const tabsEl = $('inventory-tabs');
    if (!heroEl || !bodyEl || !tabsEl) return;

    const state = ctx.getState();
    const busy = ctx.getBusy();
    for (const btn of tabsEl.querySelectorAll('[data-inventory-tab]')) {
      const active = btn.dataset.inventoryTab === inventoryTab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    }

    if (!state?.player) {
      heroEl.innerHTML = `<div class="inv-empty-run">ยังไม่ได้เริ่มรอบการไต่หอคอย · กด “เริ่มไต่หอคอย” เพื่อสร้างตัวละครและเปิดใช้กระเป๋า</div>`;
      bodyEl.innerHTML = `<p class="muted">เมื่อเริ่มรอบการเล่น คุณจะสามารถจัดเรียงเข็มขัดด่วน (3 ช่อง), คลังกระเป๋าสำรอง (12 ช่อง) และตรวจดูการ์ดตีบวกได้ที่นี่ทุกเวลา</p>`;
      return;
    }

    const p = state.player;
    p.level ??= 1;
    p.exp ??= 0;
    p.gold ??= 0;
    p.items ??= [];
    p.stash ??= [];
    p.blessings ??= [];
    const nextExp = nextExpForLevel(p.level);
    const sanctOk = isSanctuaryUnlocked(state);
    const sanctParts = ['ชั้น 4'];
    if (isSanctuary9Unlocked(state)) sanctParts.push('9');
    if (isSanctuaryPost10Unlocked(state)) sanctParts.push('หลังบอส 10');
    if (isSanctuary14Unlocked(state)) sanctParts.push('14');
    if (isSanctuary19Unlocked(state)) sanctParts.push('19');
    if (isSanctuaryPost20Unlocked(state)) sanctParts.push('หลังบอส 20');
    const sanctListText = sanctParts.join(', ');
    const clearedCount = (state.clearedRooms ?? []).length;

    const maxMana = getMaxMana(p);
    heroEl.innerHTML = `
      <div class="inv-stat-chip"><strong>Lv.${p.level}</strong><span>✨ EXP ${p.exp}/${nextExp}</span></div>
      <div class="inv-stat-chip"><strong>❤️ HP ${p.hp}/${p.maxHp}</strong><span>💧 MP ${p.mana}/${maxMana}</span></div>
      <div class="inv-stat-chip gold"><strong>💰 ${p.gold} ทอง</strong><span>🎒 ไอเทม ${p.items.length + p.stash.length}/${MAX_BELT_ITEMS + MAX_STASH_ITEMS} ชิ้น</span></div>
      <div class="inv-stat-chip ${sanctOk ? 'unlocked' : 'locked'}"><strong>${sanctOk ? `🔓 จุดพักเปิดแล้ว (${sanctListText})` : '🔒 ชั้นที่ 4 (ชั้นพัก) ล็อกอยู่'}</strong><span>${sanctOk ? 'เดินทางไปร้านค้า/ตีบวกได้' : `ต้องผ่านชั้น 1–3 ก่อน (${clearedCount}/${state.rooms.length} ห้อง)`}</span></div>
    `;

    if (inventoryTab === 'items') {
      const canUseItemNow = item => {
        if (!item || item.vaultOnly) return false;
        if (state.phase === 'battle') return true;
        return Boolean(!item.battleOnly && (item.hpRestore || item.manaRestore));
      };

      const beltGrid = Array.from({ length: MAX_BELT_ITEMS }, (_, idx) => {
        const itemId = p.items[idx];
        const item = itemId ? SHOP_ITEMS[itemId] : null;
        if (!item) {
          return `<div class="inv-slot-card empty"><div class="inv-slot-index">เข็มขัด #${idx + 1}</div><div class="inv-slot-empty-copy"><strong>ช่องว่าง</strong><span>เลือกไอเทมจากคลังกระเป๋าด้านล่างเพื่อติดตั้งขึ้นเข็มขัดด่วน</span></div></div>`;
        }
        const usable = canUseItemNow(item);
        return `<div class="inv-slot-card filled belt"><div class="inv-slot-top"><span class="inv-slot-index">เข็มขัด #${idx + 1}</span><span class="inv-slot-badge">${escape(item.badge)}</span></div><div class="inv-slot-main"><span class="inv-slot-icon">${item.icon}</span><div><strong>${escape(item.name)}</strong><p>${escape(item.description)}</p></div></div><div class="inv-slot-actions"><button type="button" class="secondary-button small-button" data-inv-use="belt:${idx}" ${!usable || busy ? 'disabled' : ''}>⚡ ใช้ทันที</button><button type="button" class="text-button small-button" data-inv-to-stash="${idx}" ${p.stash.length >= MAX_STASH_ITEMS || busy ? 'disabled' : ''}>📥 เก็บเข้าคลัง</button><button type="button" class="text-button small-button inv-danger-btn" data-inv-discard="belt:${idx}" ${busy ? 'disabled' : ''}>🗑 ทิ้ง</button></div></div>`;
      }).join('');

      const stashGrid = Array.from({ length: MAX_STASH_ITEMS }, (_, idx) => {
        const itemId = p.stash[idx];
        const item = itemId ? SHOP_ITEMS[itemId] : null;
        if (!item) {
          return `<div class="inv-slot-card stash-empty"><span class="inv-slot-index">ช่องเก็บของ #${idx + 1}</span><small>ว่าง</small></div>`;
        }
        const usable = canUseItemNow(item);
        const canEquipBelt = !item.vaultOnly && p.items.length < MAX_BELT_ITEMS;
        return `<div class="inv-slot-card filled stash"><div class="inv-slot-top"><span class="inv-slot-index">ช่องเก็บของ #${idx + 1}</span><span class="inv-slot-badge">${escape(item.badge)}</span></div><div class="inv-slot-main"><span class="inv-slot-icon">${item.icon}</span><div><strong>${escape(item.name)}</strong><p>${escape(item.description)}</p></div></div><div class="inv-slot-actions">${!item.vaultOnly ? `<button type="button" class="secondary-button small-button" data-inv-to-belt="${idx}" ${!canEquipBelt || busy ? 'disabled' : ''}>📤 ใส่เข็มขัด</button>` : ''}<button type="button" class="secondary-button small-button" data-inv-use="stash:${idx}" ${!usable || busy ? 'disabled' : ''}>⚡ ใช้ทันที</button><button type="button" class="text-button small-button inv-danger-btn" data-inv-discard="stash:${idx}" ${busy ? 'disabled' : ''}>🗑 ทิ้ง</button></div></div>`;
      }).join('');

      bodyEl.innerHTML = `
        <section class="inv-section">
          <div class="inv-section-head">
            <h3>⚡ เข็มขัดไอเทมด่วน (${p.items.length}/${MAX_BELT_ITEMS} ช่อง)</h3>
            <span>ปรากฏบนหน้าจอต่อสู้ กดใช้ได้ทันทีโดยไม่เสียเทิร์น</span>
          </div>
          <div class="inv-belt-grid">${beltGrid}</div>
        </section>
        <section class="inv-section">
          <div class="inv-section-head">
            <h3>🎒 คลังกระเป๋าสำรอง (${p.stash.length}/${MAX_STASH_ITEMS} ช่อง)</h3>
            <span>เก็บไอเทมสำรองและหินตีบวก · สลับขึ้นเข็มขัดด่วนได้ทุกเมื่อ</span>
          </div>
          <div class="inv-stash-grid">${stashGrid}</div>
        </section>
      `;
      return;
    }

    if (inventoryTab === 'cards') {
      const ownedCards = [...new Set([...START_WORDS, ...(state.collection ?? []), ...(p.words ?? [])])];
      const cardsHtml = ownedCards.map(id => {
        const word = WORDS[id];
        const lv = getCardUpgradeLevel(state, id);
        const secUnlocked = hasCardSecondaryUpgrade(state, id);
        const secTier = getCardSecondaryTier(lv, Boolean(p.cardSecondaryUpgrades?.[id]));
        const secInfo = getCardSecondaryEffect(id, Math.max(CARD_SECONDARY_UNLOCK_LEVEL, lv));
        const inActiveDeck = p.words.includes(id);
        const material = getCardUpgradeMaterial(state.player);
        const chancePercent = getCardUpgradeSuccessRate(lv, Boolean(material), material?.bonus, id);
        return `<article class="inv-card-row ${lv > 0 || secUnlocked ? 'is-upgraded' : ''}" data-filter-card="${id}"><div class="inv-card-head"><span class="forge-card-icon">${icon(id)}</span><div><strong>${escape(word.label)}${lv > 0 ? ` +${lv}` : ''}</strong><small class="forge-deck-tag ${inActiveDeck ? 'active' : ''}">${inActiveDeck ? '✓ พกในสำรับต่อสู้' : 'เก็บในคลังสะสม'}</small></div><div class="forge-badges"><span class="forge-lv-pill ${lv > 0 ? 'has-lv' : ''}">+${lv}/${MAX_CARD_UPGRADE}</span>${lv < MAX_CARD_UPGRADE ? `<span class="forge-chance-pill">${chancePercent}% ที่แท่นตีบวก</span>` : ''}${secUnlocked ? `<span class="forge-sec-pill unlocked">ขั้น ${secTier}: ${escape(secInfo.badge)}</span>` : `<span class="forge-sec-pill locked">ปลดล็อกที่ +7: ${escape(secInfo.badge)}</span>`}</div></div><p class="forge-stat-desc">⚡ ${escape(lv > 0 ? describeCardUpgradeEffect(id, lv) : word.description)}</p></article>`;
      }).join('');
      bodyEl.innerHTML = `<div data-card-filter-panel="inventory">${cardFilterControls('inventory')}<div class="inv-cards-list">${cardsHtml}</div></div>`;
      applyCardFilters(bodyEl.querySelector('[data-card-filter-panel="inventory"]'), state);
      return;
    }

    const blessingsHtml = (p.blessings ?? []).length
      ? p.blessings.map(bId => {
          const b = BLESSING_CATALOG[bId];
          if (!b) return '';
          return `<article class="relic-draft-card"><div><strong>${b.icon} ${escape(b.name)}</strong> <span class="relic-floor-badge">${escape(b.badge)}</span></div><p class="relic-draft-desc">${escape(b.description)}</p></article>`;
        }).join('')
      : `<p class="muted">ยังไม่มีพรติดตัวในรอบนี้</p>`;

    const ownedRelics = p.relics ?? [];
    const equippedRelics = getEquippedRelics(p);
    const relicsHtml = RELIC_DRAFT_CATALOG.map(relic => {
      const owned = ownedRelics.includes(relic.id);
      const equippedIdx = equippedRelics.indexOf(relic.id);
      const isEquipped = equippedIdx >= 0;
      const statusText = !owned
        ? `⏳ ${relic.status}`
        : isEquipped
          ? `✅ สวมใส่อยู่ (ช่องที่ ${equippedIdx + 1}) · ใช้งานอยู่`
          : '📦 เก็บในคลัง (ถอดไว้ — ปรับสวมใส่ได้ในหน้าจุดพัก)';
      return `<article class="relic-draft-card ${owned ? 'is-owned' : ''} ${isEquipped ? 'is-equipped' : ''}"><div class="relic-draft-head"><span class="relic-draft-icon">${relic.icon}</span><div><strong>${escape(relic.name)}</strong><span class="relic-floor-badge">ดรอปจากบอสชั้นที่ ${relic.dropFloor}</span></div></div><p class="relic-draft-desc">${escape(relic.summary)}</p><small class="relic-draft-status">${escape(statusText)}</small></article>`;
    }).join('');

    const equippedGear = getEquippedGearEntries(p);
    const gearSummaryHtml = GEAR_SLOTS.map(slot => {
      const entry = equippedGear[slot];
      if (!entry) {
        return `<article class="relic-draft-card inv-gear-card is-empty"><div class="relic-draft-head"><span class="relic-draft-icon">${GEAR_SLOT_ICONS[slot]}</span><div><strong>${GEAR_SLOT_LABELS[slot]}</strong><span class="relic-floor-badge">ว่าง</span></div></div><p class="relic-draft-desc">ยังไม่ได้สวมใส่ · ปรับเปลี่ยนและตีบวกได้ที่จุดพัก</p></article>`;
      }
      const { def, refine } = entry;
      const refineCopy = refine > 0 ? ` · โบนัส +${refine}: ${describeGearRefineBonus(def, refine)}` : '';
      return `<article class="relic-draft-card inv-gear-card is-owned is-equipped gear-rarity-${def.rarity}"><div class="relic-draft-head"><span class="relic-draft-icon">${escape(def.icon)}</span><div><strong>${escape(def.name)}${refine > 0 ? ` +${refine}` : ''}</strong><span class="relic-floor-badge">${GEAR_SLOT_LABELS[slot]} · ${GEAR_RARITY_LABELS[def.rarity]}</span></div></div><p class="relic-draft-desc">${escape(def.summary)}${escape(refineCopy)}</p></article>`;
    }).join('');

    bodyEl.innerHTML = `
      <section class="inv-section">
        <div class="inv-section-head">
          <h3>🛡️ อุปกรณ์สวมใส่ (3 ช่อง)</h3>
          <span>ซื้อ เปลี่ยน และตีบวกได้ที่จุดพัก</span>
        </div>
        <div class="sanctuary-relic-list inv-gear-grid">${gearSummaryHtml}</div>
      </section>
      <section class="inv-section">
        <div class="inv-section-head"><h3>✨ พรจอมเวทที่ได้รับ</h3></div>
        <div class="sanctuary-relic-list">${blessingsHtml}</div>
      </section>
      <section class="inv-section">
        <div class="inv-section-head"><h3>👑 ช่องเครื่องรางบอสชั้นลึก (ชั้น 10–100)</h3></div>
        <div class="sanctuary-relic-list">${relicsHtml}</div>
      </section>
    `;
  }

  let bestiaryTab = 'all';

  function renderBestiary() {
    const listEl = $('bestiary-list');
    const progressText = $('bestiary-progress-text');
    const progressBar = $('bestiary-progress-bar');
    if (!listEl) return;
    const accountBestiary = ctx.getAccountBestiary?.() ?? new Set();

    const allKinds = Object.keys(ENEMIES);
    let filteredKinds = allKinds;
    if (bestiaryTab === 'bosses') {
      filteredKinds = allKinds.filter(k => ENEMIES[k].isBoss);
    } else if (bestiaryTab === 'endgame') {
      filteredKinds = allKinds.filter(k => Object.hasOwn(ENDGAME_ENEMIES, k));
    }

    const discoveredCount = allKinds.filter(k => accountBestiary.has(k)).length;
    const totalCount = allKinds.length;
    const pct = totalCount ? Math.round((discoveredCount / totalCount) * 100) : 0;
    if (progressText) progressText.textContent = `ค้นพบอสูร ${discoveredCount} / ${totalCount} ชนิด (${pct}%)`;
    if (progressBar) progressBar.style.width = `${pct}%`;

    const tabsEl = $('bestiary-tabs');
    if (tabsEl) {
      for (const btn of tabsEl.querySelectorAll('[data-bestiary-tab]')) {
        const tab = btn.dataset.bestiaryTab;
        const active = tab === bestiaryTab;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
      }
    }

    listEl.innerHTML = filteredKinds.map(kind => {
      const e = ENEMIES[kind];
      const trait = ENEMY_TRAITS[kind];
      const discovered = accountBestiary.has(kind);
      const aff = e.affinity ? `<span class="elem-badge elem-${e.affinity}">${ELEMENT_LABELS[e.affinity] ?? e.affinity}</span>` : '<span class="elem-badge elem-none">ไร้ธาตุ</span>';
      if (!discovered) {
        return `<div class="bestiary-card is-undiscovered">
          <div class="bestiary-head">
            <span class="bestiary-icon">❓</span>
            <strong>???</strong>
            <small class="muted">${e.isBoss ? 'บอส' : 'อสูรทั่วไป'}</small>
          </div>
          <p class="bestiary-desc muted">ยังไม่เคยเผชิญหน้าในหอคอย</p>
        </div>`;
      }
      return `<div class="bestiary-card is-discovered ${e.isBoss ? 'is-boss' : ''}">
        <div class="bestiary-head">
          <span class="bestiary-icon">${e.isBoss ? '👑' : '👾'}</span>
          <strong>${escape(e.name)}</strong>
          ${aff}
        </div>
        <div class="bestiary-stats">
          <span>HP <strong>${e.hp}</strong></span>
          <span>เกราะ <strong>${e.armor}</strong></span>
          <span>ม่าน <strong>${e.ward}</strong></span>
          <small class="badge-role">${escape(trait?.role ?? 'ศัตรู')}</small>
        </div>
        <div class="bestiary-trait">
          <p>${typeof trait?.passive === 'function' ? escape(trait.passive()) : 'มีพฤติกรรมการโจมตีเฉพาะตัว'}</p>
          ${trait?.counter ? `<p class="bestiary-counter">💡 <em>แก้ทาง:</em> ${escape(trait.counter)}</p>` : ''}
        </div>
        <div class="bestiary-foot">
          <span class="tag-defeated">✓ บันทึกข้อมูลแล้ว</span>
        </div>
      </div>`;
    }).join('');
  }

  function renderAchievements() {
    const listEl = $('achievements-list');
    const progressText = $('achievements-progress-text');
    const progressBar = $('achievements-progress-bar');
    if (!listEl) return;
    const accountAchievements = ctx.getAccountAchievements?.() ?? new Set();

    const unlockedCount = ACHIEVEMENTS.filter(a => accountAchievements.has(a.id)).length;
    const totalCount = ACHIEVEMENTS.length;
    const pct = totalCount ? Math.round((unlockedCount / totalCount) * 100) : 0;
    if (progressText) progressText.textContent = `ปลดล็อก ${unlockedCount} / ${totalCount} ความสำเร็จ (${pct}%)`;
    if (progressBar) progressBar.style.width = `${pct}%`;

    listEl.innerHTML = ACHIEVEMENTS.map(a => {
      const unlocked = accountAchievements.has(a.id);
      return `<div class="achievement-card ${unlocked ? 'is-unlocked' : 'is-locked'}">
        <span class="achievement-icon" aria-hidden="true">${unlocked ? a.icon : '🔒'}</span>
        <div class="achievement-info">
          <strong>${escape(a.name)}</strong>
          <p>${escape(a.desc)}</p>
          <span class="achievement-status">${unlocked ? '✓ สำเร็จแล้ว' : 'ยังไม่ปลดล็อก'}</span>
        </div>
      </div>`;
    }).join('');
  }

  function selectSurfaceTab(tab) {
    const state = ctx.getState();
    const screen = ctx.getScreen();
    const busy = ctx.getBusy();
    for (const sibling of tab.parentElement.querySelectorAll('[role="tab"]')) {
      const active = sibling === tab;
      sibling.tabIndex = active ? 0 : -1;
      sibling.setAttribute('aria-selected', String(active));
      $(sibling.getAttribute('aria-controls')).hidden = !active;
    }
    if (tab.id === 'tools-tome-tab') {
      if (screen !== 'battle') $('quick-combos').hidden = true;
      renderGrimoire();
    } else if (tab.id === 'tools-bestiary-tab') {
      renderBestiary();
    } else if (tab.id === 'tools-achievements-tab') {
      renderAchievements();
    } else if (tab.id === 'tools-bag-tab') {
      renderItemBelt({ state, screen, busy });
      renderInventoryModal();
    } else if (tab.id === 'tools-map-tab') {
      renderRoomTrack(state, busy);
    } else if (tab.id === 'tools-log-tab') {
      ctx.renderLog();
    }
    if (tab.closest('#battle-tools')) $('tools-title').textContent = tab.textContent;
    const activePanel = $(tab.getAttribute('aria-controls'));
    if (activePanel) activePanel.scrollTop = 0;
  }

  function openTools(name, showHandFormulas = false) {
    if (ctx.getBusy()) return;
    $('tools-hand-formulas').hidden = !showHandFormulas;
    for (const id of ['tools-map-tab', 'tools-log-tab']) $(id).hidden = ctx.getScreen() !== 'battle';
    const tab = $(`tools-${name}-tab`);
    selectSurfaceTab(tab);
    const sheet = $('battle-tools');
    if (!sheet.open) sheet.showModal();
    tab.focus();
  }

  function initStaticGuide() {
    $('word-guide').innerHTML = Object.entries(WORDS).map(([id, word]) => `<div class="guide-word word-${id}">${icon(id)}<strong>${word.label}</strong><div><p>${word.description}</p><small>${word.formula}</small> ${rarityBadge(word)}</div></div>`).join('');
    const bestiaryTabs = $('bestiary-tabs');
    if (bestiaryTabs) {
      bestiaryTabs.addEventListener('click', event => {
        const btn = event.target.closest('[data-bestiary-tab]');
        if (!btn) return;
        bestiaryTab = btn.dataset.bestiaryTab;
        renderBestiary();
      });
    }
    const grimoireWordFilter = $('grimoire-word-filter');
    for (const [id, word] of Object.entries(WORDS)) grimoireWordFilter.add(new Option(word.label, id));
    for (const control of [grimoireWordFilter, $('grimoire-castable')]) {
      control.addEventListener('change', () => {
        grimoirePage = 1;
        renderGrimoire();
      });
    }
    for (const [id, direction] of [['grimoire-prev', -1], ['grimoire-next', 1]]) {
      $(id).addEventListener('click', () => {
        grimoirePage += direction;
        renderGrimoire();
        if ($(id).disabled) $(direction < 0 ? 'grimoire-next' : 'grimoire-prev').focus();
      });
    }
    for (const list of document.querySelectorAll('.surface-tabs')) {
      list.addEventListener('click', event => {
        const tab = event.target.closest('[role="tab"]');
        if (tab) selectSurfaceTab(tab);
      });
      list.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const tabs = [...list.querySelectorAll('[role="tab"]:not([hidden])')];
        const index = tabs.indexOf(event.target);
        if (index < 0) return;
        event.preventDefault();
        const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs[(index + (event.key === 'ArrowLeft' ? -1 : 1) + tabs.length) % tabs.length];
        selectSurfaceTab(next);
        next.focus();
      });
    }
  }

  return {
    initStaticGuide,
    updateGuideButtonBadge,
    renderGrimoire,
    renderInventoryModal,
    renderBestiary,
    renderAchievements,
    selectSurfaceTab,
    openTools,
    setGrimoireTab: tab => { grimoireTab = tab; grimoirePage = 1; },
    setInventoryTab: tab => { inventoryTab = tab; },
  };
}
