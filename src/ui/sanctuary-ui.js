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
  getSanctuaryDeckPresets,
  saveSanctuaryDeckPreset,
  applySanctuaryDeckPreset,
  deleteSanctuaryDeckPreset,
  ENEMIES,
  RIFT_TIERS,
  isRiftUnlocked,
  isRiftTierUnlocked,
  getRiftDailyStatus,
  getRiftStageRooms,
  getRiftRewardPool,
  rewardRarityRates,
  ownsRewardWord,
  GEAR_RIFT_BOSS_BY_TIER,
  getRiftKeyIdForTier,
  getCompassItemIdForSlot,
  countOwnedShopItem,
  GEAR_SLOTS,
  GEAR_SLOT_LABELS,
  GEAR_SLOT_ICONS,
  GEAR_RARITY_LABELS,
  MAX_GEAR_REFINE,
  getGearById,
  getOwnedGear,
  getEquippedGear,
  getEquippedGearEntries,
  getGearRefineCost,
  getGearRefineSuccessRate,
  getGearRefineMaterialId,
  getGearSellPrice,
  getGearSalvageReward,
  getGearRiftDropRates,
  getGearDuplicateReward,
  describeGearRefineBonus,
  summarizeActiveGearStats,
  getSanctuaryGearStock,
  getSanctuaryVaultGear,
  buyGearItem,
  equipGearItem,
  unequipGearItem,
  refineGearItem,
  sellGearItem,
  salvageGearItem,
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
let selectedArmoryGearId = null;
let armorySlotFilter = 'all';
let armoryFeedback = '';

function renderShop(state) {
  const { player } = state;
  const consumables = getAvailableShopItems(state).map(item => ({
    key: item.id,
    kind: 'item',
    category: item.category === 'rift' ? 'rift' : item.vaultOnly ? 'forge' : item.hpRestore || item.manaRestore ? 'restore' : 'battle',
    name: item.name,
    icon: item.icon,
    cost: item.cost,
    subtitle: item.category === 'rift' ? 'รอยแยกศาสตรา' : '',
    raw: item,
  }));
  const ownedGearIds = new Set(getOwnedGear(player).map(e => e.id));
  const baseStock = getSanctuaryGearStock(state);
  const vaultGear = getSanctuaryVaultGear(state);
  const combinedGear = [...baseStock];
  if (vaultGear && !combinedGear.some(g => g.id === vaultGear.id)) {
    combinedGear.push(vaultGear);
  }
  const gearEntries = combinedGear.map(gear => {
    const isVaultShowcase = Boolean(vaultGear && gear.id === vaultGear.id && gear.rarity === 'special');
    return {
      key: `gear:${gear.id}`,
      kind: 'gear',
      category: 'gear',
      name: gear.name,
      icon: gear.icon,
      cost: gear.price,
      owned: ownedGearIds.has(gear.id),
      isVaultShowcase,
      subtitle: isVaultShowcase
        ? `${GEAR_SLOT_LABELS[gear.slot]} · ${GEAR_RARITY_LABELS[gear.rarity]} · คลังนิรภัย 50+`
        : `${GEAR_SLOT_LABELS[gear.slot]} · ${GEAR_RARITY_LABELS[gear.rarity]}`,
      raw: gear,
    };
  });
  const allEntries = shopCategory === 'gear' ? gearEntries : [...consumables, ...gearEntries];
  const list = $('sanctuary-shop-list');
  const query = $('shop-search').value.trim().toLocaleLowerCase();
  const visible = allEntries.filter(entry => {
    const catMatch = shopCategory === 'all' || shopCategory === entry.category;
    const textMatch = !query
      || entry.name.toLocaleLowerCase().includes(query)
      || (entry.subtitle && entry.subtitle.toLocaleLowerCase().includes(query));
    return catMatch && textMatch;
  });

  const isSelectedGear = typeof selectedShopItem === 'string' && selectedShopItem.startsWith('gear:');
  let current = visible.find(candidate => candidate.key === selectedShopItem);
  if (!current && selectedShopItem && !isSelectedGear && state.purchasedShopItems.includes(selectedShopItem) && SHOP_ITEMS[selectedShopItem]) {
    const soldItem = SHOP_ITEMS[selectedShopItem];
    current = {
      key: soldItem.id,
      kind: 'item',
      category: soldItem.category === 'rift' ? 'rift' : soldItem.vaultOnly ? 'forge' : soldItem.hpRestore || soldItem.manaRestore ? 'restore' : 'battle',
      name: soldItem.name,
      icon: soldItem.icon,
      cost: soldItem.cost,
      sold: true,
      raw: soldItem,
    };
  }
  if (!current) current = visible[0] ?? null;
  selectedShopItem = current?.key ?? null;

  const scroll = list.scrollTop;
  list.innerHTML = visible.map(candidate => {
    const tag = candidate.kind === 'gear'
      ? (candidate.owned ? 'มีแล้ว' : `${candidate.cost} ทอง`)
      : `${candidate.cost} ทอง`;
    const rarityCls = candidate.kind === 'gear' ? `gear-rarity-${candidate.raw.rarity}` : '';
    return `<button id="shop-choice-${candidate.key.replace(':', '-')}" class="shop-choice ${rarityCls}" type="button" data-shop-choice="${escape(candidate.key)}" aria-pressed="${candidate.key === selectedShopItem}"><span class="shop-choice-icon" aria-hidden="true">${escape(candidate.icon)}</span><span class="shop-choice-text"><span>${escape(candidate.name)}</span>${candidate.subtitle ? `<em class="shop-choice-sub">${escape(candidate.subtitle)}</em>` : ''}</span><small>${tag}</small></button>`;
  }).join('');
  list.scrollTop = scroll;

  for (const button of $('shop-categories').querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.shopCategory === shopCategory));
  }
  $('shop-empty').hidden = visible.length > 0;
  $('shop-empty').textContent = allEntries.length ? 'ไม่พบสินค้า ลองเปลี่ยนคำค้นหรือหมวดสินค้า' : 'สินค้าหมดแล้ว';
  $('shop-detail-content').hidden = !current;
  if (!current) return;

  const compareEl = $('shop-item-compare');
  const buy = $('shop-buy-btn');

  if (current.kind === 'gear') {
    const gear = current.raw;
    const owned = ownedGearIds.has(gear.id);
    const shortfall = gear.price - player.gold;
    const equippedMap = getEquippedGearEntries(player);
    const equippedSlot = equippedMap[gear.slot];
    $('shop-item-icon').textContent = gear.icon;
    $('shop-item-name').textContent = gear.name;
    $('shop-item-description').textContent = `${GEAR_SLOT_LABELS[gear.slot]} · ${GEAR_RARITY_LABELS[gear.rarity]} · ${gear.style} — ${gear.summary}`;
    if (compareEl) {
      compareEl.hidden = false;
      compareEl.textContent = equippedSlot
        ? `ช่อง${GEAR_SLOT_LABELS[gear.slot]}ปัจจุบัน: ${equippedSlot.def.name}${equippedSlot.refine ? ` +${equippedSlot.refine}` : ''} (${equippedSlot.def.summary})`
        : `ช่อง${GEAR_SLOT_LABELS[gear.slot]}ยังว่าง — ซื้อแล้วสวมใส่ทันที`;
    }
    $('shop-item-stock').textContent = owned
      ? 'มีอยู่ในคลังอุปกรณ์แล้ว'
      : current.isVaultShowcase
        ? `คลังนิรภัยชั้น 50+ (ปลดล็อกชั้น ${gear.unlockFloor}+)`
        : `ปลดล็อกชั้น ${gear.unlockFloor}+`;
    $('shop-item-destination').hidden = owned;
    $('shop-item-destination').textContent = equippedSlot ? 'เก็บเข้าคลังอุปกรณ์' : 'สวมใส่อัตโนมัติ';
    buy.disabled = owned || shortfall > 0;
    buy.textContent = owned ? 'มีแล้ว' : shortfall > 0 ? `ขาดอีก ${shortfall} ทอง` : `ซื้ออุปกรณ์ · ${gear.price} ทอง`;
    return;
  }

  const item = current.raw;
  const sold = Boolean(current.sold || state.purchasedShopItems.includes(item.id));
  const beltSpace = !item.vaultOnly && player.items.length < MAX_BELT_ITEMS;
  const hasSpace = beltSpace || player.stash.length < MAX_STASH_ITEMS;
  const shortfall = item.cost - player.gold;
  $('shop-item-icon').textContent = item.icon;
  $('shop-item-name').textContent = item.name;
  $('shop-item-description').textContent = item.description;
  if (compareEl) compareEl.hidden = true;
  $('shop-item-stock').textContent = sold ? 'ซื้อครบแล้ว' : item.oneTime ? 'จำกัด 1 ชิ้น' : 'ซื้อซ้ำได้';
  $('shop-item-destination').hidden = sold;
  $('shop-item-destination').textContent = hasSpace
    ? (beltSpace ? 'เก็บเข้าเข็มขัด' : 'เก็บเข้าคลังสำรอง')
    : item.vaultOnly ? 'คลังสำรองเต็ม' : 'กระเป๋าเต็ม';
  buy.disabled = sold || !hasSpace || shortfall > 0;
  buy.textContent = sold ? 'ซื้อแล้ว' : !hasSpace ? 'ไม่มีช่องเก็บ' : shortfall > 0 ? `ขาดอีก ${shortfall} ทอง` : `ซื้อ · ${item.cost} ทอง`;
}

function renderArmory(state) {
  const panel = $('sanctuary-armory-panel');
  if (!panel || !state?.player) return;
  const p = state.player;
  const owned = getOwnedGear(p);
  const equipped = getEquippedGear(p);
  const equippedEntries = getEquippedGearEntries(p);

  const goldEl = $('armory-gold');
  if (goldEl) goldEl.textContent = `${p.gold ?? 0} ทอง`;

  const statSummaryEl = $('armory-stat-summary');
  if (statSummaryEl) {
    const stats = summarizeActiveGearStats(p);
    statSummaryEl.textContent = stats.length
      ? stats.join(' · ')
      : 'ยังไม่ได้สวมใส่อุปกรณ์ · เลือกซื้อได้ในร้านค้าหมวด “อุปกรณ์”';
  }

  const slotsEl = $('armory-slots');
  if (slotsEl) {
    slotsEl.innerHTML = GEAR_SLOTS.map(slot => {
      const entry = equippedEntries[slot];
      const slotLabel = GEAR_SLOT_LABELS[slot];
      const slotIcon = GEAR_SLOT_ICONS[slot];
      if (!entry) {
        return `<article class="armory-slot-card is-empty" data-armory-slot="${slot}">
          <div class="armory-slot-head">
            <span class="armory-slot-label">${slotIcon} ${slotLabel}</span>
            <span class="armory-slot-state">ว่าง</span>
          </div>
          <p class="armory-slot-empty-copy">ยังไม่ได้สวมใส่${slotLabel}</p>
        </article>`;
      }
      const { def, refine } = entry;
      const selected = selectedArmoryGearId === def.id;
      return `<article class="armory-slot-card is-filled gear-rarity-${def.rarity} ${selected ? 'is-selected' : ''}" data-armory-slot="${slot}">
        <div class="armory-slot-head">
          <span class="armory-slot-label">${slotIcon} ${slotLabel}</span>
          <span class="armory-slot-state">${GEAR_RARITY_LABELS[def.rarity]}${refine > 0 ? ` · +${refine}` : ''}</span>
        </div>
        <button type="button" class="armory-slot-select" data-armory-select="${def.id}">
          <span class="armory-slot-icon" aria-hidden="true">${escape(def.icon)}</span>
          <span class="armory-slot-info">
            <strong>${escape(def.name)}${refine > 0 ? ` +${refine}` : ''}</strong>
            <small>${escape(def.summary)}</small>
          </span>
        </button>
        <div class="armory-slot-foot">
          <button type="button" class="secondary-button small-button" data-armory-unequip="${slot}">ถอดออก</button>
        </div>
      </article>`;
    }).join('');
  }

  const filteredVault = owned.filter(entry => {
    const def = getGearById(entry.id);
    return def && (armorySlotFilter === 'all' || def.slot === armorySlotFilter);
  });

  if (!owned.some(e => e.id === selectedArmoryGearId)) {
    selectedArmoryGearId = equipped.weapon || equipped.armor || equipped.accessory || filteredVault[0]?.id || owned[0]?.id || null;
  }

  for (const btn of $('armory-slot-filters').querySelectorAll('[data-armory-filter]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.armoryFilter === armorySlotFilter));
  }
  $('armory-vault-count').textContent = `${filteredVault.length} / ${owned.length} ชิ้น`;
  $('armory-vault-empty').hidden = filteredVault.length > 0;
  $('armory-vault-empty').textContent = owned.length
    ? 'ไม่พบอุปกรณ์ในหมวดที่เลือก'
    : 'ยังไม่มีอุปกรณ์ในคลัง · แวะร้านค้าหมวด “อุปกรณ์” เพื่อซื้อชิ้นแรก';

  const vaultList = $('armory-vault-list');
  vaultList.innerHTML = filteredVault.map(entry => {
    const def = getGearById(entry.id);
    if (!def) return '';
    const isEq = equipped[def.slot] === def.id;
    const isSel = selectedArmoryGearId === def.id;
    return `<button id="armory-vault-${def.id}" type="button" class="armory-vault-item gear-rarity-${def.rarity} ${isEq ? 'is-equipped' : ''}" data-armory-select="${def.id}" aria-pressed="${isSel}">
      <span class="armory-vault-icon" aria-hidden="true">${escape(def.icon)}</span>
      <span class="armory-vault-body">
        <strong>${escape(def.name)}${entry.refine > 0 ? ` +${entry.refine}` : ''}</strong>
        <small>${GEAR_SLOT_LABELS[def.slot]} · ${GEAR_RARITY_LABELS[def.rarity]}${isEq ? ' · สวมใส่อยู่' : ''}</small>
      </span>
      <span class="armory-vault-meta">${entry.refine > 0 ? `+${entry.refine}` : 'Lv.0'}</span>
    </button>`;
  }).join('');

  const selectedEntry = owned.find(e => e.id === selectedArmoryGearId) ?? null;
  const selectedDef = selectedEntry ? getGearById(selectedEntry.id) : null;
  $('armory-detail-empty').hidden = Boolean(selectedDef);
  $('armory-detail-body').hidden = !selectedDef;
  if (!selectedDef) return;

  const refine = selectedEntry.refine ?? 0;
  const maxed = refine >= MAX_GEAR_REFINE;
  const isEq = equipped[selectedDef.slot] === selectedDef.id;
  const refineCost = getGearRefineCost(selectedDef, refine);
  const refineRate = getGearRefineSuccessRate(refine);
  const reqMatId = getGearRefineMaterialId(refine);
  const hasMat = !reqMatId || (p.stash ?? []).includes(reqMatId) || (p.items ?? []).includes(reqMatId);
  const sellPrice = getGearSellPrice(selectedDef, refine);
  const salvageReward = getGearSalvageReward(selectedDef, refine);
  const salvageMatName = salvageReward ? (SHOP_ITEMS[salvageReward.materialId]?.name ?? 'หินตีบวก') : 'หินตีบวก';
  const stashFull = (p.stash ?? []).length >= MAX_STASH_ITEMS;

  $('armory-item-icon').textContent = selectedDef.icon;
  $('armory-item-name').textContent = `${selectedDef.name}${refine > 0 ? ` +${refine}` : ''}`;
  $('armory-item-meta').textContent = `${GEAR_SLOT_LABELS[selectedDef.slot]} · ${GEAR_RARITY_LABELS[selectedDef.rarity]} · ${selectedDef.style} · ${isEq ? 'สวมใส่อยู่' : 'ในคลัง'}`;
  $('armory-item-summary').textContent = selectedDef.summary;
  $('armory-item-refine-bonus').textContent = maxed
    ? `โบนัสตีบวกสูงสุด (+${refine}): ${describeGearRefineBonus(selectedDef, refine)}`
    : `โบนัสตีบวกปัจจุบัน (+${refine}): ${describeGearRefineBonus(selectedDef, refine)} → ระดับ +${refine + 1}: ${describeGearRefineBonus(selectedDef, refine + 1)}`;

  $('armory-refine-terms').hidden = maxed;
  $('armory-refine-chance').textContent = `${refineRate}% (พลาดไม่ลดระดับ)`;
  const matLabel = reqMatId ? ` + ${SHOP_ITEMS[reqMatId]?.name ?? reqMatId}${hasMat ? '' : ' (ขาด)'}` : '';
  $('armory-refine-cost').textContent = `${refineCost} ทอง${matLabel}`;

  const equipBtn = $('armory-equip-btn');
  equipBtn.textContent = isEq ? 'ถอดออก' : 'สวมใส่';
  equipBtn.dataset.armoryAction = isEq ? 'unequip' : 'equip';

  const refineBtn = $('armory-refine-btn');
  const canAffordRefine = (p.gold ?? 0) >= refineCost && hasMat;
  refineBtn.disabled = maxed || !canAffordRefine;
  refineBtn.textContent = maxed
    ? `เต็มระดับ +${MAX_GEAR_REFINE}`
    : !hasMat
      ? `ขาด${SHOP_ITEMS[reqMatId]?.name ?? 'หิน'}`
      : (p.gold ?? 0) < refineCost
        ? `ขาด ${refineCost - (p.gold ?? 0)} ทอง`
        : `ตีบวก +${refine + 1}`;

  const sellBtn = $('armory-sell-btn');
  sellBtn.textContent = `ขายคืน +${sellPrice} ทอง`;

  const salvageBtn = $('armory-salvage-btn');
  salvageBtn.disabled = stashFull;
  salvageBtn.textContent = stashFull ? 'คลังสำรองเต็ม' : `ย่อยรับ ${salvageMatName}`;

  const resultEl = $('armory-result');
  resultEl.textContent = armoryFeedback || 'ตีบวกอุปกรณ์ไม่ลดระดับเมื่อพลาด · ขายคืนได้ 40% ของราคา';
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

let riftMode = 'card';
let gearCompassSlot = null;
let gearInstability = false;

export function getGearRiftSelectionOptions() {
  return {
    compassSlot: gearCompassSlot,
    instability: gearInstability,
  };
}

export function setRiftMode(mode = 'card') {
  riftMode = mode === 'gear' ? 'gear' : 'card';
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

  for (const tab of document.querySelectorAll('#rift-mode-tabs [data-rift-mode]')) {
    tab.setAttribute('aria-pressed', String(tab.dataset.riftMode === riftMode));
  }

  if (gearCompassSlot) {
    const cid = getCompassItemIdForSlot(gearCompassSlot);
    if (!cid || countOwnedShopItem(state.player, cid) <= 0) gearCompassSlot = null;
  }
  if (gearInstability && countOwnedShopItem(state.player, 'orb_rift_instability') <= 0) {
    gearInstability = false;
  }

  const rulesNote = $('rift-rules-note');
  const modBox = $('gear-rift-modifiers');
  const pendingBanner = $('gear-rift-pending-banner');
  const modControls = $('gear-rift-modifier-controls');

  if (riftMode === 'card') {
    if (rulesNote) {
      rulesNote.innerHTML = 'สู้ต่อเนื่อง <strong>3 ด่าน</strong> (มินิบอส X8-3 → มินิบอส X9-3 → บอสใหญ่ชั้นหลักสิบ) · ผ่านครบ 3 ด่าน <strong>สุ่มรับการ์ดคำ 1 ใบทันที</strong> ตามเพดานรางวัลของชั้นนั้น (เลือกไม่ได้)';
    }
    if (modBox) modBox.hidden = true;
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
        <div class="rift-tier-ceiling">เพดานรางวัลชั้น ${tier} · พูล ${pool.length} ใบ (ยังไม่มี ${unowned} ใบ) · Epic ${rates.epic}% · Legend ${rates.legendary}%</div>
        <button type="button" class="${canEnter ? 'primary-button' : 'secondary-button'} rift-enter-btn" data-enter-rift="${tier}" ${canEnter ? '' : 'disabled'}>${escape(btnText)}</button>
      </article>`;
    }).join('');
    return;
  }

  if (rulesNote) {
    rulesNote.innerHTML = 'สู้ต่อเนื่อง <strong>3 ด่าน</strong> (ด่าน 1–2 ศัตรูประจำชั้น ฟื้น +20% Max HP หลังจบด่าน · ด่าน 3 <strong>บอสศาสตราประจำเทียร์</strong>) · เปิดหีบ <strong>เลือก 1 จาก 3 ชิ้น</strong> · ซ้ำต่ำกว่า +5 ตีบวกฟรี +1 · +5 แปลงเป็นทองและหิน';
  }
  if (modBox) modBox.hidden = false;
  if (pendingBanner) pendingBanner.hidden = !state.pendingGearReward;

  if (modControls) {
    const orbCount = countOwnedShopItem(state.player, 'orb_rift_instability');
    const compassButtons = [
      `<button type="button" class="gear-mod-btn" data-gear-compass="" aria-pressed="${gearCompassSlot === null}">สุ่มครบ 3 ประเภท</button>`,
      ...GEAR_SLOTS.map(slot => {
        const cid = getCompassItemIdForSlot(slot);
        const count = countOwnedShopItem(state.player, cid);
        const pressed = gearCompassSlot === slot;
        return `<button type="button" class="gear-mod-btn" data-gear-compass="${slot}" aria-pressed="${pressed}" ${count <= 0 ? 'disabled' : ''}>${GEAR_SLOT_ICONS[slot]} ล็อก${GEAR_SLOT_LABELS[slot]} (${count})</button>`;
      }),
    ].join('');

    modControls.innerHTML = `<div class="gear-mod-group">
        <span class="gear-mod-label">เข็มทิศเจาะจงหมวดอุปกรณ์ (ใช้ 1 ชิ้นเมื่อเข้าดันเจี้ยน)</span>
        <div class="gear-mod-options">${compassButtons}</div>
      </div>
      <div class="gear-mod-group">
        <span class="gear-mod-label">ลูกแก้วแปรปรวนมิติ (มี ${orbCount} ชิ้น)</span>
        <button type="button" class="gear-mod-btn gear-orb-btn" data-gear-instability="true" aria-pressed="${gearInstability}" ${orbCount <= 0 ? 'disabled' : ''}>🔮 เสี่ยงพลังแปรปรวน (+1 เกราะ · +15% โจมตี · ดันโอกาสดรอประดับสูง +20%)</button>
      </div>`;
  }

  const hasPending = Boolean(state.pendingGearReward);
  const clearedSet = new Set(state.clearedGearRifts ?? []);

  list.innerHTML = RIFT_TIERS.map(tier => {
    const unlocked = isRiftTierUnlocked(state, tier);
    const stageRooms = getRiftStageRooms(tier);
    const stageLabels = [`${tier - 2}-3`, `${tier - 1}-3`, `ศาสตรา ${tier}★`];
    const gearBossKind = GEAR_RIFT_BOSS_BY_TIER[tier];
    const stagesHtml = stageRooms.map((roomIdx, idx) => {
      const enemyKinds = idx === 2 && gearBossKind ? [gearBossKind] : (state.rooms?.[roomIdx] ?? []);
      const names = enemyKinds.map(kind => ENEMIES[kind]?.name ?? kind).join(' · ');
      return `<li><b>ด่าน ${idx + 1} (${stageLabels[idx]})</b><span>${escape(names)}</span></li>`;
    }).join('');

    const rates = getGearRiftDropRates(tier, gearInstability);
    const rateParts = [
      rates.common > 0 ? `ธรรมดา ${rates.common}%` : '',
      rates.rare > 0 ? `หายาก ${rates.rare}%` : '',
      rates.special > 0 ? `พิเศษ ${rates.special}%` : '',
      rates.epic > 0 ? `มหากาพย์ ${rates.epic}%` : '',
      rates.legendary > 0 ? `ตำนาน ${rates.legendary}%` : '',
    ].filter(Boolean).join(' · ');

    const keyId = getRiftKeyIdForTier(tier);
    const keyCount = countOwnedShopItem(state.player, keyId);
    const keyName = SHOP_ITEMS[keyId]?.name ?? 'กุญแจรอยแยก';
    const useKey = status.remaining <= 0;
    const canEnter = unlocked && !hasPending && (!useKey || keyCount > 0);
    const isCleared = clearedSet.has(tier);

    let btnText;
    if (hasPending) {
      btnText = '🎁 เปิดหีบศาสตราที่รอรับก่อน';
    } else if (!unlocked) {
      btnText = `🔒 ผ่านบอสชั้น ${tier} เพื่อปลดล็อก`;
    } else if (!useKey) {
      btnText = `⚔ เข้ารอยแยกศาสตราชั้น ${tier} (−1 รอบ)`;
    } else if (keyCount > 0) {
      btnText = `🗝 ใช้${keyName}เข้าชั้น ${tier} (มี ${keyCount})`;
    } else {
      btnText = `หมดโควต้า · ต้องใช้${keyName}`;
    }

    return `<article class="rift-tier-card gear-rift-card ${unlocked ? 'is-unlocked' : 'is-locked'} ${isCleared ? 'is-cleared' : ''}" data-gear-rift-card="${tier}">
      <div class="rift-tier-head">
        <strong>รอยแยกศาสตราชั้น ${tier}</strong>
        <span class="rift-tier-badge">${!unlocked ? `ล็อกชั้น ${tier}` : isCleared ? '✓ พิชิตแล้ว' : 'เปิดแล้ว'}</span>
      </div>
      <ul class="rift-stage-list">${stagesHtml}</ul>
      <div class="rift-tier-ceiling">${escape(rateParts)}${gearCompassSlot ? ` · ล็อก ${GEAR_SLOT_LABELS[gearCompassSlot]}` : ''}${gearInstability ? ' · แปรปรวน +20%' : ''}</div>
      <button type="button" class="${canEnter ? 'primary-button' : 'secondary-button'} rift-enter-btn" data-enter-gear-rift="${tier}" data-gear-rift-use-key="${useKey ? 'true' : 'false'}" ${canEnter ? '' : 'disabled'}>${escape(btnText)}</button>
    </article>`;
  }).join('');
}

export function openSanctuaryRiftPanel(ctx, mode = null) {
  const state = ctx.getState();
  if (!state || state.phase !== 'sanctuary' || !isRiftUnlocked(state)) return;
  if (mode === 'card' || mode === 'gear') setRiftMode(mode);
  const sanctuaryMenu = $('sanctuary-menu');
  const panelIds = [
    'sanctuary-shop-panel',
    'sanctuary-armory-panel',
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
  const pendingGearBtn = $('sanctuary-pending-gear-btn');
  if (pendingGearBtn) {
    pendingGearBtn.hidden = !state.pendingGearReward;
    if (state.pendingGearReward) {
      pendingGearBtn.textContent = `🎁 เปิดหีบศาสตรา (ชั้น ${state.pendingGearReward.tier})`;
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
  renderArmory(state);

  renderSanctuaryTravel(state);

  const activeEquipped = ctx.getEquipped();
  const cap = deckCapacity(state);
  const deckMatchesState = activeEquipped.length === p.words.length
    && activeEquipped.every(id => p.words.includes(id));
  if ($('sanctuary-deck-count')) {
    $('sanctuary-deck-count').textContent = activeEquipped.length === cap && deckMatchesState
      ? `เลือก ${activeEquipped.length} / ${cap} คำ · ✓ บันทึกแล้ว`
      : activeEquipped.length === cap
        ? `เลือก ${activeEquipped.length} / ${cap} คำ · รอบันทึก`
        : `เลือก ${activeEquipped.length} / ${cap} คำ · ยังไม่ครบ`;
  }
  renderForge(state);
  const presetsEl = $('sanctuary-deck-presets');
  if (presetsEl) {
    const presets = getSanctuaryDeckPresets(state);
    presetsEl.innerHTML = presets.map((preset, idx) => {
      const isActive = Boolean(
        preset
        && preset.words.length === activeEquipped.length
        && preset.words.every(id => activeEquipped.includes(id))
      );
      const cardsSummary = preset
        ? preset.words.map(id => escape(WORDS[id]?.label ?? id)).join(' · ')
        : 'ยังว่าง — จัดคำให้ครบแล้วกดบันทึกเพื่อสลับเด็คไวในคลิกเดียว';
      return `<article class="deck-preset-slot ${preset ? 'is-filled' : 'is-empty'} ${isActive ? 'is-active' : ''}" data-preset-slot="${idx}">
        <div class="deck-preset-head">
          <strong>${escape(preset ? preset.name : `ชุดคำด่วน #${idx + 1}`)}</strong>
          <span class="deck-preset-badge">${isActive ? '✦ ใช้งานอยู่' : preset ? `${preset.words.length} คำ` : 'ว่าง'}</span>
        </div>
        <p class="deck-preset-cards">${cardsSummary}</p>
        <div class="deck-preset-actions">
          ${preset ? `<button type="button" class="${isActive ? 'secondary-button' : 'primary-button'} deck-preset-btn" data-apply-preset="${idx}" ${isActive ? 'disabled' : ''}>${isActive ? '✓ ใช้อยู่' : 'ใช้ชุดนี้'}</button>` : ''}
          <button type="button" class="secondary-button deck-preset-btn" data-save-preset="${idx}" ${activeEquipped.length !== cap ? 'disabled' : ''}>${preset ? 'บันทึกทับ' : 'บันทึกชุดนี้'}</button>
          ${preset ? `<button type="button" class="secondary-button deck-preset-btn is-danger" data-delete-preset="${idx}" aria-label="ลบชุดคำช่องที่ ${idx + 1}">ลบ</button>` : ''}
        </div>
      </article>`;
    }).join('');
  }
  const deckFiltersEl = $('sanctuary-deck-filters');
  if (deckFiltersEl && !deckFiltersEl.firstElementChild) {
    deckFiltersEl.innerHTML = cardFilterControls('deck');
  }
  const wordsEl = $('sanctuary-words');
  if (wordsEl) {
    const ownedWordIds = [...new Set([...START_WORDS, ...(state.collection ?? [])])];
    wordsEl.innerHTML = ownedWordIds.map(id => {
      const checked = activeEquipped.includes(id);
      const word = WORDS[id];
      const meta = cardMeta(id);
      const statusBadge = `<span class="equip-state-badge ${checked ? 'is-equipped' : ''}">${checked ? '✓ พกแล้ว' : 'เลือกพก'}</span>`;
      return `<button type="button" class="secondary-button equip-card playing-card word-${id} ${rarityClass(word)} ${meta.roleClass}" data-sanctuary-equip="${id}" data-filter-card="${id}" aria-pressed="${checked}" title="${word.description}">${playingCardFace(state, id, { headerRight: statusBadge })}</button>`;
    }).join('');
  }
  const deckSection = $('sanctuary-deck-section');
  if (deckSection) applyCardFilters(deckSection, state);
  if ($('sanctuary-save-deck')) {
    $('sanctuary-save-deck').disabled = activeEquipped.length !== cap;
    $('sanctuary-save-deck').textContent = activeEquipped.length === cap && deckMatchesState
      ? '✓ บันทึกชุดคำแล้ว (ปิดหน้าต่าง)'
      : 'บันทึกชุดคำที่เลือก';
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
    armory: ['sanctuary-armory-panel', 'คลังอุปกรณ์'],
    forge: ['sanctuary-upgrade-panel', 'ตีบวก'],
    deck: ['sanctuary-deck-panel', 'ชุดคำ'],
    tome: ['sanctuary-tome-panel', 'ตำรา'],
    map: ['sanctuary-map-panel', 'เลือกชั้นอื่น'],
    rift: ['sanctuary-rift-panel', 'รอยแยกมิติ'],
  };

  for (const [selector, iconId] of [
    ['[data-sanctuary-menu="shop"]', 'bag'], ['#sanctuary-rest-btn', 'fire'],
    ['[data-sanctuary-menu="forge"]', 'forge'], ['[data-sanctuary-menu="armory"]', 'shield'],
    ['[data-open-inventory]', 'bag'], ['[data-sanctuary-menu="deck"]', 'pair'],
    ['[data-sanctuary-menu="tome"]', 'book'],
  ]) {
    $('sanctuary-view').querySelector(selector)?.insertAdjacentHTML('afterbegin', icon(iconId));
  }

  for (const button of $('sanctuary-view').querySelectorAll('[data-sanctuary-menu]')) {
    button.addEventListener('click', () => {
      const [activePanel, title] = sanctuaryPanels[button.dataset.sanctuaryMenu];
      for (const [panel] of Object.values(sanctuaryPanels)) $(panel).hidden = panel !== activePanel;
      $('sanctuary-menu-title').textContent = title;
      if (activePanel === 'sanctuary-upgrade-panel') renderForge(ctx.getState());
      if (activePanel === 'sanctuary-rift-panel') renderRiftPanel(ctx.getState());
      if (activePanel === 'sanctuary-armory-panel') {
        armoryFeedback = '';
        renderArmory(ctx.getState());
      }
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
    const receipt = $('shop-receipt');
    if (selectedShopItem.startsWith('gear:')) {
      const gearId = selectedShopItem.slice(5);
      try {
        const result = buyGearItem(state, gearId);
        ctx.setState(result.state);
        ctx.persist();
        ctx.audio.play('coin');
        selectedArmoryGearId = gearId;
        renderSanctuary(ctx);
        ctx.updateInventoryBadge();
        receipt.textContent = result.autoEquipped
          ? `ซื้อ “${result.gear.name}” แล้ว · สวมใส่เข้าช่อง${GEAR_SLOT_LABELS[result.gear.slot]}ทันที`
          : `ซื้อ “${result.gear.name}” แล้ว · เก็บเข้าคลังอุปกรณ์`;
        if (button.disabled) $('shop-item-name').focus({ preventScroll: true });
        for (const id of ['sanctuary-shop-gold', 'sanctuary-gold-pill', 'armory-gold']) {
          queueFxClassRestart($(id), ['gold-balance-flash'], 'gold-balance-flash');
        }
      } catch (error) {
        receipt.textContent = error.message;
      }
      return;
    }
    const item = SHOP_ITEMS[selectedShopItem];
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

  $('sanctuary-armory-panel')?.addEventListener('click', event => {
    const state = ctx.getState();
    if (!state || state.phase !== 'sanctuary') return;

    const filterBtn = event.target.closest('[data-armory-filter]');
    if (filterBtn) {
      armorySlotFilter = filterBtn.dataset.armoryFilter;
      renderArmory(state);
      return;
    }

    const selectBtn = event.target.closest('[data-armory-select]');
    if (selectBtn) {
      selectedArmoryGearId = selectBtn.dataset.armorySelect;
      armoryFeedback = '';
      preserveFocus(() => renderArmory(state));
      ctx.audio.play('place');
      return;
    }

    const unequipSlotBtn = event.target.closest('[data-armory-unequip]');
    if (unequipSlotBtn) {
      const slot = unequipSlotBtn.dataset.armoryUnequip;
      try {
        const next = unequipGearItem(state, slot);
        ctx.setState(next);
        ctx.persist();
        ctx.audio.play('clear');
        armoryFeedback = `ถอด${GEAR_SLOT_LABELS[slot]}ออกแล้ว`;
        renderSanctuary(ctx);
      } catch (error) {
        armoryFeedback = error.message;
        renderArmory(state);
      }
      return;
    }

    const equipToggle = event.target.closest('#armory-equip-btn');
    if (equipToggle && selectedArmoryGearId) {
      const def = getGearById(selectedArmoryGearId);
      if (!def) return;
      try {
        const action = equipToggle.dataset.armoryAction;
        const next = action === 'unequip'
          ? unequipGearItem(state, def.slot)
          : equipGearItem(state, def.id);
        ctx.setState(next);
        ctx.persist();
        ctx.audio.play(action === 'unequip' ? 'clear' : 'place');
        armoryFeedback = action === 'unequip'
          ? `ถอด “${def.name}” ออกแล้ว`
          : `สวมใส่ “${def.name}” เข้าช่อง${GEAR_SLOT_LABELS[def.slot]}แล้ว`;
        renderSanctuary(ctx);
      } catch (error) {
        armoryFeedback = error.message;
        renderArmory(state);
      }
      return;
    }

    const refineBtn = event.target.closest('#armory-refine-btn');
    if (refineBtn && !refineBtn.disabled && selectedArmoryGearId) {
      try {
        const res = refineGearItem(state, selectedArmoryGearId);
        const def = getGearById(selectedArmoryGearId);
        ctx.setState(res.state);
        ctx.persist();
        ctx.audio.play(res.failed ? 'invalid' : 'forge');
        armoryFeedback = res.failed
          ? `ตีบวก “${def.name}” เป็น +${res.attemptedRefine} พลาด · คงระดับ +${res.newRefine}`
          : `ตีบวก “${def.name}” สำเร็จ! ระดับใหม่ +${res.newRefine}`;
        renderSanctuary(ctx);
        ctx.updateInventoryBadge();
      } catch (error) {
        armoryFeedback = error.message;
        renderArmory(state);
      }
      return;
    }

    const sellBtn = event.target.closest('#armory-sell-btn');
    if (sellBtn && selectedArmoryGearId) {
      const def = getGearById(selectedArmoryGearId);
      try {
        const res = sellGearItem(state, selectedArmoryGearId);
        ctx.setState(res.state);
        ctx.persist();
        ctx.audio.play('coin');
        selectedArmoryGearId = null;
        armoryFeedback = `ขายคืน “${def?.name ?? res.gearId}” รับ +${res.goldGained} ทอง`;
        renderSanctuary(ctx);
        ctx.updateInventoryBadge();
      } catch (error) {
        armoryFeedback = error.message;
        renderArmory(state);
      }
      return;
    }

    const salvageBtn = event.target.closest('#armory-salvage-btn');
    if (salvageBtn && !salvageBtn.disabled && selectedArmoryGearId) {
      const def = getGearById(selectedArmoryGearId);
      try {
        const res = salvageGearItem(state, selectedArmoryGearId);
        const matName = SHOP_ITEMS[res.materialId]?.name ?? res.materialId;
        ctx.setState(res.state);
        ctx.persist();
        ctx.audio.play('forge');
        selectedArmoryGearId = null;
        armoryFeedback = `ย่อย “${def?.name ?? res.gearId}” ได้รับ ${matName} ×${res.count} เก็บเข้าคลังสำรองแล้ว`;
        renderSanctuary(ctx);
        ctx.updateInventoryBadge();
      } catch (error) {
        armoryFeedback = error.message;
        renderArmory(state);
      }
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

  $('sanctuary-rift-panel')?.addEventListener('click', event => {
    const state = ctx.getState();
    if (!state || state.phase !== 'sanctuary') return;
    const modeBtn = event.target.closest('[data-rift-mode]');
    if (modeBtn) {
      setRiftMode(modeBtn.dataset.riftMode);
      renderRiftPanel(state);
      ctx.audio.play('place');
      return;
    }
    const compassBtn = event.target.closest('[data-gear-compass]');
    if (compassBtn && !compassBtn.disabled) {
      const slot = compassBtn.dataset.gearCompass || null;
      gearCompassSlot = gearCompassSlot === slot ? null : slot;
      renderRiftPanel(state);
      ctx.audio.play('place');
      return;
    }
    const orbBtn = event.target.closest('[data-gear-instability]');
    if (orbBtn && !orbBtn.disabled) {
      gearInstability = !gearInstability;
      renderRiftPanel(state);
      ctx.audio.play('place');
    }
  });

  sanctuaryMenu.addEventListener('close', () => {
    const state = ctx.getState();
    if (state?.phase === 'sanctuary' && typeof ctx.syncSanctuaryEquipped === 'function') {
      ctx.syncSanctuaryEquipped({ requireComplete: false, notifyInvalid: false });
    }
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

  $('sanctuary-deck-presets')?.addEventListener('click', event => {
    const saveBtn = event.target.closest('[data-save-preset]');
    if (saveBtn) {
      const slot = Number(saveBtn.dataset.savePreset);
      try {
        const next = saveSanctuaryDeckPreset(ctx.getState(), slot, ctx.getEquipped());
        ctx.setState(next);
        ctx.setEquipped([...next.player.words]);
        ctx.persist();
        ctx.audio.play('place');
        const saved = getSanctuaryDeckPresets(next)[slot];
        ctx.toast(`💾 บันทึก “${saved?.name ?? `ชุดคำ #${slot + 1}`}” แล้ว`);
        renderSanctuary(ctx);
      } catch (error) { ctx.toast(error.message); }
      return;
    }
    const applyBtn = event.target.closest('[data-apply-preset]');
    if (applyBtn) {
      const slot = Number(applyBtn.dataset.applyPreset);
      try {
        const next = applySanctuaryDeckPreset(ctx.getState(), slot);
        ctx.setState(next);
        ctx.setEquipped([...next.player.words]);
        ctx.persist();
        ctx.audio.play('place');
        const applied = getSanctuaryDeckPresets(next)[slot];
        ctx.toast(`⚡ สลับเป็น “${applied?.name ?? `ชุดคำ #${slot + 1}`}” พร้อมลุยทันที`);
        renderSanctuary(ctx);
      } catch (error) { ctx.toast(error.message); }
      return;
    }
    const delBtn = event.target.closest('[data-delete-preset]');
    if (delBtn) {
      const slot = Number(delBtn.dataset.deletePreset);
      try {
        const next = deleteSanctuaryDeckPreset(ctx.getState(), slot);
        ctx.setState(next);
        ctx.persist();
        ctx.audio.play('clear');
        ctx.toast(`🗑 ล้างชุดคำด่วนช่องที่ ${slot + 1} แล้ว`);
        renderSanctuary(ctx);
      } catch (error) { ctx.toast(error.message); }
    }
  });

  $('sanctuary-save-deck')?.addEventListener('click', () => {
    try {
      const next = updateSanctuaryLoadout(ctx.getState(), ctx.getEquipped());
      ctx.setState(next);
      ctx.setEquipped([...next.player.words]);
      ctx.persist();
      ctx.audio.play('place');
      ctx.toast('📖 บันทึกชุดคำประจำตัวเรียบร้อยแล้ว');
      renderSanctuary(ctx);
      if (sanctuaryMenu.open) sanctuaryMenu.close();
    } catch (error) { ctx.toast(error.message); }
  });
}
