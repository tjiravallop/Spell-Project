import { WORDS, RARITIES } from '../words.js';
import { getCardUpgradeLevel, MAX_CARD_UPGRADE } from '../run.js';
import { cardMeta, escape } from './dom.js';

const filters = {
  forge: { search: '', role: '', rarity: '', status: '' },
  inventory: { search: '', role: '', rarity: '', status: '' },
  deck: { search: '', role: '', rarity: '', status: '' },
};

export function cardFilterControls(surface) {
  const current = filters[surface];
  const options = (entries, selected) => entries.map(([value, label]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`).join('');
  const search = `<label>ค้นหาการ์ด<input type="search" data-card-filter="search" value="${escape(current.search)}" placeholder="ชื่อการ์ด เช่น ไฟ หรือ หมา" autocomplete="off"></label>`;
  const statusOptions = surface === 'deck'
    ? [['', 'ทุกสถานะ'], ['deck', '✓ พกในสำรับ'], ['unequipped', 'ยังไม่พก'], ['upgraded', 'ตีบวกแล้ว'], ['unupgraded', 'ยังไม่ตีบวก'], ['max', 'ตีบวกเต็ม +10']]
    : [['', 'ทุกสถานะ'], ['deck', 'พกในสำรับ'], ['upgraded', 'ตีบวกแล้ว'], ['unupgraded', 'ยังไม่ตีบวก'], ['max', 'ตีบวกเต็ม +10']];
  const advanced = `<label>ประเภท<select data-card-filter="role">${options([['', 'ทุกประเภท'], ['role-form', 'รูปแบบโจมตี'], ['role-element', 'ธาตุ'], ['role-summon', 'อัญเชิญ / สัตว์'], ['role-defense', 'ป้องกัน'], ['role-support', 'ฟื้นฟู / บัพ'], ['role-mod', 'คำเสริม']], current.role)}</select></label>
    <label>ความหายาก<select data-card-filter="rarity">${options([['', 'ทุกระดับ'], ...Object.entries(RARITIES)], current.rarity)}</select></label>
    <label>สถานะ<select data-card-filter="status">${options(statusOptions, current.status)}</select></label>
    <button type="button" class="secondary-button card-filter-reset" data-card-filter-reset>ล้างตัวกรอง</button>`;
  const controls = surface === 'forge'
    ? `${search}<details class="forge-filters"><summary>ตัวกรอง</summary><div>${advanced}</div></details>`
    : search + advanced;
  return `<div class="card-filters" aria-label="ตัวกรองการ์ด">${controls}
    <p class="card-filter-count" data-card-filter-count aria-live="polite"></p>
  </div><p class="card-filter-empty" data-card-filter-empty hidden>ไม่พบการ์ดที่ตรงกับตัวกรอง ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p>`;
}

export function applyCardFilters(panel, state) {
  const surface = panel?.dataset.cardFilterPanel;
  const filter = filters[surface];
  if (!filter || !state?.player) return;
  const query = filter.search.trim().toLocaleLowerCase();
  const cards = panel.querySelectorAll('[data-filter-card]');
  let visible = 0;
  for (const card of cards) {
    const id = card.dataset.filterCard;
    const word = WORDS[id];
    if (!word) continue;
    const level = getCardUpgradeLevel(state, id);
    const isEquipped = surface === 'deck' && typeof card.getAttribute === 'function' && card.getAttribute('aria-pressed') !== null
      ? card.getAttribute('aria-pressed') === 'true'
      : state.player.words.includes(id);
    const matchesStatus = !filter.status
      || (filter.status === 'deck' && isEquipped)
      || (filter.status === 'unequipped' && !isEquipped)
      || (filter.status === 'upgraded' && level > 0)
      || (filter.status === 'unupgraded' && level === 0)
      || (filter.status === 'max' && level >= MAX_CARD_UPGRADE);
    const match = (!query || `${word.label} ${id}`.toLocaleLowerCase().includes(query))
      && (!filter.role || cardMeta(id).roleClass === filter.role)
      && (!filter.rarity || (word.rarity ?? 'common') === filter.rarity)
      && matchesStatus;
    card.hidden = !match;
    if (match) visible++;
  }
  const count = panel.querySelector('[data-card-filter-count]');
  const empty = panel.querySelector('[data-card-filter-empty]');
  if (count) count.textContent = `แสดง ${visible} จาก ${cards.length} ใบ`;
  if (empty) empty.hidden = visible !== 0;
}

export function bindCardFilters(getState) {
  document.addEventListener('input', update);
  document.addEventListener('change', update);
  function update(event) {
    const control = event.target.closest('[data-card-filter]');
    const panel = control?.closest('[data-card-filter-panel]');
    const filter = filters[panel?.dataset.cardFilterPanel];
    if (!filter) return;
    filter[control.dataset.cardFilter] = control.value;
    applyCardFilters(panel, getState());
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-card-filter-reset]');
    const panel = button?.closest('[data-card-filter-panel]');
    const filter = filters[panel?.dataset.cardFilterPanel];
    if (!filter) return;
    for (const key of Object.keys(filter)) filter[key] = '';
    for (const control of panel.querySelectorAll('[data-card-filter]')) control.value = '';
    applyCardFilters(panel, getState());
  });
}
