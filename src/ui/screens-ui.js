import { WORDS, START_WORDS, RARITIES, ASCENDED_ELEMENTS, FUSED_ELEMENTS } from '../words.js';
import {
  MAX_CARD_UPGRADE,
  FLOOR50_BOSS_ROOM,
  getCardUpgradeLevel,
  ownsRewardWord,
  getFloorInfo,
  isSanctuaryUnlocked,
} from '../run.js';
import { icon } from '../icons.js';
import { getBossRewardStory, getLoadoutTransitionStory } from '../story.js';
import { $, escape, cardMeta, rarityClass, playingCardFace } from './dom.js';
import { formatTurnLogCard } from './combat-log.js';

export function renderRewards(state, reveal) {
  $('reward-emblem').innerHTML = icon('book');
  const fInfo = getFloorInfo(state.room, state.rooms.length);
  $('reward-subtitle').textContent = `ชนะบอสประจำชั้นที่ ${fInfo.floor} ครั้งแรก · เลือกการ์ดคำแบบสุ่ม 1 ใบ${fInfo.floor === 3 ? ' ก่อนเข้าสู่ชั้นที่ 4 (ชั้นพัก)' : fInfo.floor === 5 ? ' เพื่อเปิดผนึกเข้าสู่ด่าน 6–8' : fInfo.floor === 8 ? ' ก่อนเข้าสู่ชั้นที่ 9 (ชั้นพัก)' : fInfo.floor === 13 ? ' ก่อนเข้าสู่ชั้นที่ 14 (ชั้นพัก)' : fInfo.floor === 15 ? ' เพื่อเปิดผนึกเข้าสู่ด่าน 16–18' : fInfo.floor === 18 ? ' ก่อนเข้าสู่ชั้นที่ 19 (ชั้นพัก)' : ''}`;
  if (fInfo.floor >= 21) $('reward-subtitle').textContent = `ผ่านชั้น ${fInfo.floor} · เลือกการ์ดคำ 1 ใบ`;
  if (fInfo.floor === 32 && state.rewards.includes('pull')) $('reward-subtitle').textContent = 'ผ่านชั้น 32 · รับการ์ดดึงและจัดชุดก่อนขึ้นชั้น 33';
  if (fInfo.floor === 30 && state.rewards.every(id => Object.hasOwn(ASCENDED_ELEMENTS, id))) {
    $('reward-subtitle').textContent = 'พิชิตบอสชั้น 30 · เลือกธาตุขั้นสอง 1 ใบ';
  }
  if (fInfo.floor === 30 && state.rewards.every(id => Object.hasOwn(FUSED_ELEMENTS, id))) {
    $('reward-subtitle').textContent = 'พิชิตบอสชั้น 30 · เลือกธาตุผสมมหากาพย์ 1 ใบ';
  }
  const fixedReward = fInfo.floor === 30 && state.rewards.length === 1 && ['storm', 'devastation', 'vayu'].includes(state.rewards[0]) ? state.rewards[0] : null;
  if (fixedReward) $('reward-subtitle').textContent = `พิชิตบอสชั้น 30 · รับการ์ด${WORDS[fixedReward].label}ระดับ${RARITIES[WORDS[fixedReward].rarity]}`;
  const storyBox = $('reward-story');
  const rewardStory = getBossRewardStory(state);
  if (storyBox) {
    if (rewardStory) {
      storyBox.hidden = false;
      storyBox.innerHTML = `<div class="story-kicker">${escape(rewardStory.kicker)}</div><h2>${escape(rewardStory.title)}</h2><p class="story-body">${escape(rewardStory.body)}</p>`;
    } else {
      storyBox.hidden = true;
      storyBox.innerHTML = '';
    }
  }
  $('reward-player').textContent = `พก ${state.player.words.length}/7 คำ · สะสม ${state.collection.length} ใบ · 💰 ${state.player.gold ?? 0} ทอง`;
  $('reward-list').classList.toggle('reward-reveal', reveal);
  $('reward-list').innerHTML = state.rewards.map((id, index) => {
    const word = WORDS[id];
    const meta = cardMeta(id);
    const level = getCardUpgradeLevel(state, id);
    const selectText = ownsRewardWord(state, id)
      ? level >= MAX_CARD_UPGRADE ? 'เต็ม +10 · รับ 20 ทอง' : `การ์ดซ้ำ · +${level} → +${level + 1}`
      : 'คำใหม่ · เก็บเข้าคลัง';
    return `<button id="reward-${id}" class="reward-card playing-card word-${id} ${rarityClass(word)} ${meta.roleClass}" data-reward="${id}" style="--reveal-delay:${index * 85}ms">${playingCardFace(state, id, { bodyExtra: `<p class="reward-desc">${word.description}</p><span class="reward-select">${selectText}</span>` })}</button>`;
  }).join('');
}

export function renderLoadout(state, equipped) {
  const cap = Math.min(7, START_WORDS.length + state.learned.length);
  const nextFloorInfo = getFloorInfo(Math.min(state.rooms.length - 1, state.room + 1), state.rooms.length);
  $('loadout-count').textContent = `เลือก ${equipped.length}/${cap} คำ · ฟื้น HP +12 เมื่อขึ้นสู่ชั้นที่ ${nextFloorInfo.floor} (${nextFloorInfo.displayName}) · มี 💰 ${state.player.gold ?? 0} ทอง`;
  const loadoutStoryBox = $('loadout-story');
  const transStory = getLoadoutTransitionStory(state);
  if (loadoutStoryBox) {
    if (transStory) {
      loadoutStoryBox.hidden = false;
      const milestonesHtml = transStory.milestones?.length
        ? `<ul class="story-milestones">${transStory.milestones.map(m => `<li><strong>${escape(m.floor)}</strong><span><em>${escape(m.name)}</em> — ${escape(m.detail)}</span></li>`).join('')}</ul>`
        : '';
      loadoutStoryBox.innerHTML = `<div class="story-kicker">${escape(transStory.kicker)}</div><h2>${escape(transStory.title)}</h2><p class="story-body">${escape(transStory.body)}</p>${milestonesHtml}${transStory.warning ? `<p class="story-warning">${escape(transStory.warning)}</p>` : ''}`;
    } else {
      loadoutStoryBox.hidden = true;
      loadoutStoryBox.innerHTML = '';
    }
  }
  $('loadout-words').innerHTML = [...START_WORDS, ...state.collection].map(id => {
    const checked = equipped.includes(id);
    const word = WORDS[id];
    const meta = cardMeta(id);
    const statusBadge = `<span class="equip-state-badge ${checked ? 'is-equipped' : ''}">${checked ? '✓ พกแล้ว' : 'เลือกพก'}</span>`;
    return `<button id="equip-${id}" class="secondary-button equip-card playing-card word-${id} ${rarityClass(word)} ${meta.roleClass}" data-equip="${id}" aria-pressed="${checked}" title="${word.description}">${playingCardFace(state, id, { headerRight: statusBadge })}</button>`;
  }).join('');
  $('climb-button').disabled = equipped.length !== cap;
  if ($('loadout-sanctuary-button')) {
    const sanctOk = isSanctuaryUnlocked(state);
    $('loadout-sanctuary-button').hidden = !sanctOk;
    $('loadout-sanctuary-button').disabled = !sanctOk;
  }
}

export function renderResult(state, turnLogs, lastEnemies) {
  const won = state.phase === 'won';
  const won50 = won && state.room === FLOOR50_BOSS_ROOM;
  const p = state.player;
  $('result-seal').innerHTML = icon(won ? 'book' : 'shield');
  $('result-title').textContent = won ? 'พิชิตชั้น 1–3 สำเร็จ! (เปิดทางสู่ชั้นพักที่ 4 และชั้น 5–9)' : 'การทดลองครั้งนี้จบลง';
  $('result-description').textContent = won
    ? 'คุณปราบบอสชั้น 3 สำเร็จแล้ว! กดเข้าสู่ “ชั้นที่ 4: ชั้นพัก” เพื่อเตรียมตัว ซื้อไอเทม ตีบวกการ์ด และไต่ต่อชั้น 5–8 สู่จุดพักชั้น 9'
    : 'คาถาที่ลองไปไม่สูญเปล่า รอบหน้าคุณรู้มากกว่าเดิม';
  if (won50) {
    $('result-title').textContent = 'พิชิตหอคอยถึงชั้น 50';
    $('result-description').textContent = 'ปราบราชันกี่ทอโลกแล้ว กลับจุดพักหลังบอสชั้น 45 เพื่อจัดชุดคำหรือเล่นซ้ำ';
  }
  if ($('result-sanctuary')) {
    $('result-sanctuary').hidden = !won;
    $('result-sanctuary').textContent = won50 ? '🏕 กลับจุดพักหลังบอส 45' : '🏕 เข้าสู่ชั้นที่ 4: ชั้นพัก & ไต่ต่อชั้น 5–9';
  }
  $('result-stats').innerHTML = [
    [`${(state.clearedRooms ?? []).length}/${state.rooms.length}`, 'ห้องที่ผ่าน'],
    [`Lv.${p.level ?? 1}`, `เลเวล (💰 ${p.gold ?? 0} ทอง)`],
    [state.stats.casts, 'ครั้งที่ร่าย'],
    [state.stats.discovered.length, 'คาถาที่ทดลอง'],
  ].map(([n, label]) => `<div><strong>${n}</strong><span>${label}</span></div>`).join('');
  const recentTurnHtml = turnLogs.length
    ? `<div class="result-log-section"><h2>สรุปเทิร์นล่าสุดก่อนจบศึก (เรียงล่าสุดบนสุด)</h2><ol class="combat-log result-combat-log">${turnLogs.slice(0, 5).map((entry, idx) => formatTurnLogCard(entry, idx, lastEnemies)).join('')}</ol></div>`
    : '';
  $('discoveries').innerHTML = `<h2>ร่องรอยจากการทดลอง</h2>${state.stats.discovered.slice(-6).map(text => `<div class="discovered-spell">${text.split(' ').map(id => WORDS[id].label).join(' · ')}</div>`).join('') || '<p class="muted">ยังไม่มีคาถาที่ร่ายในรอบนี้</p>'}${recentTurnHtml}`;
  $('result-seed').textContent = `SEED ${state.seed} · ความเสียหายรวม ${state.stats.damage} · ป้องกัน ${state.stats.blocked}`;
}
