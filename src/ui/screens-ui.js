import { WORDS, START_WORDS, getCardDescription, getCardUpgradeComparison } from '../words.js';
import {
  MAX_CARD_UPGRADE,
  FLOOR50_BOSS_ROOM,
  FLOOR100_BOSS_ROOM,
  getCardUpgradeLevel,
  deckCapacity,
  ownsRewardWord,
  summonStarterBonus,
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
    const isOwned = ownsRewardWord(state, id);
    const level = isOwned ? getCardUpgradeLevel(state, id) : 0;
    const starter = summonStarterBonus(state, id);
    const fullDesc = getCardDescription(id, isOwned ? level : 0);

    let statusPill = '';
    let diffHtml = '';
    let selectText = '';

    if (starter) {
      statusPill = `<div class="reward-starter-badge">✨ ชุดเริ่มต้น: อัญเชิญ + ${escape(WORDS[starter].label)} (+0)</div>`;
      selectText = `รับอัญเชิญและ${WORDS[starter].label}`;
    } else if (!isOwned) {
      statusPill = '<div class="reward-status-pill is-new">✨ การ์ดใหม่ (+0)</div>';
      selectText = 'คำใหม่ · เก็บเข้าคลัง (+0)';
    } else if (level < MAX_CARD_UPGRADE) {
      const diffText = getCardUpgradeComparison(id, level);
      statusPill = `<div class="reward-status-pill is-dup">⬆ การ์ดซ้ำ · +${level} → +${level + 1}</div>`;
      if (diffText) {
        diffHtml = `<div class="reward-upg-diff"><span class="diff-arrow">+${level} → +${level + 1}</span> ${escape(diffText)}</div>`;
      }
      selectText = `อัปเกรดเป็น +${level + 1}`;
    } else {
      statusPill = '<div class="reward-status-pill is-maxed">⭐ เต็ม +10</div>';
      diffHtml = '<div class="reward-upg-diff is-gold-reward"><span class="diff-gold">💰 รับ +20 ทองทันที</span></div>';
      selectText = 'เต็ม +10 · รับ 20 ทอง';
    }

    const bodyExtra = `
      <div class="reward-card-body">
        ${statusPill}
        <p class="reward-desc">${escape(fullDesc)}</p>
        ${diffHtml}
      </div>
      <span class="reward-select">${selectText}</span>
    `;

    return `<button id="reward-${id}" class="reward-card playing-card word-${id} ${rarityClass(word)} ${meta.roleClass}" data-reward="${id}" style="--reveal-delay:${index * 85}ms">${playingCardFace(state, id, { bodyExtra })}</button>`;
  }).join('');
}

export function renderLoadout(state, equipped) {
  const cap = deckCapacity(state);
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
  const won100 = won && (state.room >= FLOOR100_BOSS_ROOM || state.room >= 249);
  const p = state.player;
  $('result-seal').innerHTML = icon(won ? 'book' : 'shield');
  $('result-title').textContent = won ? 'ผ่านช่วงเปิดหอคอย' : 'รอบนี้จบลง';
  $('result-description').textContent = won
    ? 'แวะจุดพักเพื่อฟื้นพลัง ซื้อไอเทม และจัดชุดคำก่อนไต่ต่อ'
    : 'คุณแพ้ก่อนถึงจุดพักชั้น 5 การ์ดสะสมและสูตรที่ค้นพบถูกล้างแล้ว';
  if (won100) {
    $('result-title').textContent = '👑 พิชิตหอคอยสมบูรณ์แบบชั้น 100 — จอมเวทแห่งอนันตกาล!';
    $('result-description').textContent = 'คุณปราบบอสใหญ่สุด “จ้าวแห่งกาลเวลาและมิติอนันต์” และครอบครองมงกุฎอนันตกาล สำเร็จ Endgame True Victory!';
  } else if (won50) {
    $('result-title').textContent = 'พิชิตหอคอยถึงชั้น 50';
    $('result-description').textContent = 'ปราบราชันกี่ทอโลกแล้ว มุ่งหน้าสู่ชั้น 51–100 หรือกลับจุดพัก';
  }
  if ($('result-sanctuary')) {
    $('result-sanctuary').hidden = !won;
    $('result-sanctuary').textContent = won100 ? '🏕 กลับจุดพักชั้น 95' : won50 ? '🏕 เข้าสู่จุดพักหลังบอส 50 & ไต่ต่อชั้น 51–100' : 'ไปจุดพักชั้น 5';
  }
  $('result-stats').innerHTML = [
    [`${(state.clearedRooms ?? []).length}/${state.rooms.length}`, 'ห้องที่ผ่าน'],
    [`Lv.${p.level ?? 1}`, `เลเวล (💰 ${p.gold ?? 0} ทอง)`],
    [state.stats.casts, 'ครั้งที่ร่าย'],
    [state.stats.discovered.length, 'สูตรที่ค้นพบ'],
  ].map(([n, label]) => `<div><strong>${n}</strong><span>${label}</span></div>`).join('');
  const recentTurnHtml = turnLogs.length
    ? `<div class="result-log-section"><h2>สรุปเทิร์นล่าสุดก่อนจบศึก (เรียงล่าสุดบนสุด)</h2><ol class="combat-log result-combat-log">${turnLogs.slice(0, 5).map((entry, idx) => formatTurnLogCard(entry, idx, lastEnemies)).join('')}</ol></div>`
    : '';
  $('discoveries').innerHTML = `<h2>ร่องรอยจากการทดลอง</h2>${state.stats.discovered.slice(-6).map(text => `<div class="discovered-spell">${text.split(' ').map(id => WORDS[id].label).join(' · ')}</div>`).join('') || '<p class="muted">ไม่มีสูตรที่บันทึกไว้ในรอบนี้</p>'}${recentTurnHtml}`;
  $('result-seed').textContent = `SEED ${state.seed} · ความเสียหายรวม ${state.stats.damage} · ป้องกัน ${state.stats.blocked}`;
}
