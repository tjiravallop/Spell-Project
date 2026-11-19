import { WORDS, RARITIES, elementFamily } from '../words.js';
import {
  UPPER_RESTS,
  getCardUpgradeLevel,
  hasCardSecondaryUpgrade,
  getCardSecondaryEffect,
  describeCardUpgradeEffect,
} from '../run.js';
import { icon } from '../icons.js';

export const $ = id => document.getElementById(id);

export const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[char]);

export const upperCheckpoint = key => Object.hasOwn(UPPER_RESTS, key);
export const checkpointFloor = key => Number(key.slice(4));

export function restLocationLabel(checkpoint) {
  if (typeof checkpoint === 'number') return `จุดพักชั้น ${checkpoint}`;
  if (checkpoint.startsWith('pre')) return `จุดพักก่อนบอสชั้น ${checkpoint.slice(3)}`;
  return `จุดพักหลังบอสชั้น ${checkpointFloor(checkpoint)}`;
}

export const CARD_META = Object.freeze({
  shot: { roleClass: 'role-form' },
  beam: { roleClass: 'role-form' },
  wave: { roleClass: 'role-form' },
  storm: { roleClass: 'role-form' },
  blackhole: { roleClass: 'role-form' },
  death: { roleClass: 'role-form' },
  meteor: { roleClass: 'role-form' },
  veil: { roleClass: 'role-defense' },
  fire: { roleClass: 'role-element' },
  ice: { roleClass: 'role-element' },
  lightning: { roleClass: 'role-element' },
  earth: { roleClass: 'role-element' },
  water: { roleClass: 'role-element' },
  wind: { roleClass: 'role-element' },
  pair: { roleClass: 'role-mod' },
  blast: { roleClass: 'role-mod' },
  devastation: { roleClass: 'role-mod' },
  vayu: { roleClass: 'role-element' },
  shield: { roleClass: 'role-defense' },
  heal: { roleClass: 'role-support' },
  self: { roleClass: 'role-support' },
  burn: { roleClass: 'role-mod' },
  freeze: { roleClass: 'role-mod' },
  push: { roleClass: 'role-mod' },
  pull: { roleClass: 'role-mod' },
  pierce: { roleClass: 'role-mod' },
  seal: { roleClass: 'role-mod' },
  dispel: { roleClass: 'role-mod' },
  brace: { roleClass: 'role-defense' },
  large: { roleClass: 'role-mod' },
  grand: { roleClass: 'role-mod' },
});

export function cardMeta(id) {
  return CARD_META[elementFamily(id)] ?? { roleClass: 'role-mod' };
}

export function rarityClass(word) {
  return `rarity-${word.rarity ?? 'common'}`;
}

export function rarityBadge(word) {
  return `<small class="rarity-badge">${RARITIES[word.rarity ?? 'common']}</small>`;
}

export function playingCardFace(state, id, { headerRight = '', footerSub = '', bodyExtra = '' } = {}) {
  const word = WORDS[id];
  const upgLv = getCardUpgradeLevel(state, id);
  const hasSec = hasCardSecondaryUpgrade(state, id);
  const secEffect = hasSec ? getCardSecondaryEffect(id) : null;
  const upgTags = [];
  if (upgLv > 0) upgTags.push(`<span class="card-upg-pip stat-pip" title="${escape(describeCardUpgradeEffect(id, upgLv))}">+${upgLv}</span>`);
  if (hasSec && secEffect) upgTags.push(`<span class="card-upg-pip sec-pip" title="${escape(secEffect.description)}">${escape(secEffect.badge)}</span>`);
  const upgRow = upgTags.length ? `<span class="card-upg-row">${upgTags.join('')}</span>` : '';
  return `<span class="playing-card-inner ${upgLv > 0 || hasSec ? 'is-upgraded-card' : ''}"><span class="card-corner card-corner-top"><span class="corner-index"><span class="corner-icon">${icon(id)}</span><span class="corner-name">${word.label}${upgLv > 0 ? ` +${upgLv}` : ''}</span></span>${headerRight}</span><span class="card-art-frame"><span class="card-art-ring" aria-hidden="true"></span><span class="card-emblem">${icon(id)}</span></span><span class="card-nameplate"><strong class="card-title">${word.label}${upgLv > 0 ? ` <em class="card-plus">+${upgLv}</em>` : ''}</strong>${rarityBadge(word)}${upgRow}${footerSub}</span>${bodyExtra}<span class="card-corner card-corner-bottom" aria-hidden="true"><span class="corner-index"><span class="corner-icon">${icon(id)}</span><span class="corner-name">${word.label}</span></span></span></span>`;
}

let fxRafId = 0;
const pendingFxRestarts = new Map();

export function queueFxClassRestart(el, removeClasses, addClass) {
  if (!el) return;
  el.classList.remove(...removeClasses);
  const queued = pendingFxRestarts.get(el);
  if (queued) {
    for (const cls of removeClasses) queued.delete(cls);
  }
  const nextClasses = typeof addClass === 'string' ? addClass.trim().split(/\s+/).filter(Boolean) : [];
  if (!nextClasses.length) return;
  const targetSet = queued ?? new Set();
  for (const cls of nextClasses) targetSet.add(cls);
  pendingFxRestarts.set(el, targetSet);
  if (!fxRafId) {
    fxRafId = requestAnimationFrame(() => {
      fxRafId = 0;
      for (const [node, classes] of pendingFxRestarts.entries()) {
        if (node.isConnected && classes.size) node.classList.add(...classes);
      }
      pendingFxRestarts.clear();
    });
  }
}

export function focusAfterRender(id) {
  requestAnimationFrame(() => $(id)?.focus({ preventScroll: true }));
}

export function preserveFocus(render) {
  const id = document.activeElement?.id;
  render();
  if (id && $(id) && !$(id).disabled) $(id).focus({ preventScroll: true });
}
