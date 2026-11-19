import { WORDS } from '../words.js';
import { ENEMIES, RELIC_DRAFT_CATALOG, isBossRoom } from '../run.js';
import { damageLabel, fizzleLabel } from '../render.js';
import { $, escape, restLocationLabel } from './dom.js';

export function formatTurnLogCard(entry, index, fallbackEnemies = []) {
  const enemyList = entry.enemies ?? fallbackEnemies ?? [];
  const names = id => id === 'player' ? 'คุณ' : ENEMIES[enemyList.find(enemy => enemy.id === id)?.kind]?.name || 'เป้าหมาย';
  const isLatest = index === 0;
  const actionHtml = entry.actionType === 'guard'
    ? `<span class="log-action-title action-guard">ตั้งรับ <small>(0 มานา · ป้องกันได้สูงสุด ${entry.shieldCreated ?? 3})</small></span>`
    : entry.actionType === 'fizzle'
      ? `<span class="log-action-title action-fizzle">ร่ายไม่สำเร็จ “${escape(entry.expression)}” <small>(เสีย ${entry.cost} มานา)</small></span>`
      : `<span class="log-action-title action-cast">ร่ายคาถา “${escape(entry.expression)}” <small>(ใช้ ${entry.cost} มานา)</small></span>`;

  const pills = [];
  if (entry.damage > 0 || entry.actionType !== 'guard') {
    pills.push(`<span class="log-pill ${entry.damage > 0 ? 'pill-damage' : 'pill-muted'}">⚔ ทำความเสียหาย <strong>${entry.damage}</strong></span>`);
  }
  if (entry.shieldCreated > 0 || entry.blocked > 0 || entry.actionType === 'guard') {
    const shieldParts = [];
    if (entry.shieldCreated > 0) shieldParts.push(`สร้างโล่ <strong>+${entry.shieldCreated}</strong>`);
    shieldParts.push(`ป้องกันได้ <strong>${entry.blocked}</strong>`);
    pills.push(`<span class="log-pill ${(entry.shieldCreated > 0 || entry.blocked > 0) ? 'pill-shield' : 'pill-muted'}">🛡 ${shieldParts.join(' · ')}</span>`);
  }
  if (entry.incoming > 0) {
    pills.push(`<span class="log-pill pill-taken">💔 รับความเสียหาย <strong>−${entry.incoming}</strong> <small>(HP ${entry.hpBefore}→${entry.hpAfter})</small></span>`);
  } else {
    pills.push(`<span class="log-pill pill-safe">✓ ไม่เสีย HP <small>(HP ${entry.hpAfter})</small></span>`);
  }
  if (entry.healed > 0) {
    pills.push(`<span class="log-pill pill-heal">✚ ฟื้น HP <strong>+${entry.healed}</strong></span>`);
  }
  if (entry.wards > 0) {
    pills.push(`<span class="log-pill pill-ward">✦ ทำลายม่าน <strong>${entry.wards}</strong></span>`);
  }
  if ((entry.goldGain ?? 0) > 0 || (entry.expGain ?? 0) > 0) {
    pills.push(`<span class="log-pill pill-heal">💰 +${entry.goldGain ?? 0} ทอง · ✨ +${entry.expGain ?? 0} EXP${entry.revisit ? ' (ซ้ำ 20%)' : ''}</span>`);
  }
  if (entry.levelUps?.length) {
    const lv = entry.levelUps[entry.levelUps.length - 1];
    pills.push(`<span class="log-pill pill-ward">🎉 เลเวลอัพ Lv.${lv.level}! (+${lv.hpGain} Max HP${lv.mpGain ? `, +${lv.mpGain} Max MP` : ''})</span>`);
  }

  const eventsHtml = (entry.events ?? []).map(event => {
    if (event.type === 'fizzle') {
      return `<li class="log-ev ev-taken"><span class="ev-tag tag-taken">ร่ายไม่สำเร็จ</span><span><strong>“${escape(event.expression)}”</strong> · ${fizzleLabel(event.cost)}</span></li>`;
    }
    if (event.type === 'projectile') {
      const action = event.form === 'storm' ? 'พายุซัด' : `${escape(WORDS[event.form]?.label ?? event.form)} พุ่งกระทบ`;
      return `<li class="log-ev ev-cast"><span class="ev-tag tag-cast">ร่ายเวท</span><span>${action} <strong class="hl-target">${escape(names(event.target))}</strong>${event.blocked ? ' · <strong class="hl-ward">ติดม่าน · ม่านลด 1 ชั้น</strong>' : ''}</span></li>`;
    }
    if (event.type === 'blast') {
      const label = event.element === 'blackhole' ? 'หลุมดำยุบ' : event.element === 'meteor' ? 'อุกกาบาต' : event.devastation ? 'ทำลายล้าง' : event.radius === 2 ? 'มหาระเบิด' : 'ระเบิด';
      const elements = (event.elements ?? []).map(id => WORDS[id].label).join('+');
      const blocked = event.wardedTargets?.length;
      return `<li class="log-ev ev-damage"><span class="ev-tag tag-damage">${label}</span><span>${elements ? `${escape(elements)} · ` : ''}แรงระเบิดกระจายโดน <strong class="hl-damage">${event.targets.length} เป้าหมาย</strong>${blocked ? ` · ติดม่าน ${blocked} เป้า` : ''}</span></li>`;
    }
    if (event.type === 'blackhole-open') return `<li class="log-ev ev-cast"><span class="ev-tag tag-cast">หลุมดำ</span><span>ช่อง ${event.slot + 1} · ยุบเทิร์นหน้า</span></li>`;
    if (event.type === 'damage') {
      const source = event.element === 'storm' ? WORDS.storm.label : `ธาตุ${escape(WORDS[event.element]?.label ?? event.element)}`;
      return `<li class="log-ev ev-damage"><span class="ev-tag tag-damage">${event.amount > 0 ? 'ความเสียหาย' : 'เกราะ'}</span><span><strong class="hl-target">${escape(names(event.target))}</strong> · ${source} · <strong class="hl-damage">${damageLabel(event)}</strong>${event.reduction ? ` · อ่านทาง −${event.reduction}%` : ''}${event.killed ? ' · <strong class="hl-kill">ปราบสำเร็จ!</strong>' : ''}</span></li>`;
    }
    if (event.type === 'armor-shred') {
      return `<li class="log-ev ev-status"><span class="ev-tag tag-status">ทุบเกราะ</span><span>${escape(names(event.target))} เสียเกราะ ${event.amount} หน่วย · เหลือ ${event.armor}</span></li>`;
    }
    if (event.type === 'shield-counter') {
      return `<li class="log-ev ev-status"><span class="ev-tag tag-status">โล่ตอบโต้</span><span>โล่${WORDS[event.element].label} ตอบโต้ ${escape(names(event.target))}</span></li>`;
    }
    if (event.type === 'shield') {
      if (event.restored) return `<li class="log-ev ev-shield"><span class="ev-tag tag-shield">มหาโล่</span><span>ต้นเทิร์นถัดไปเติมโล่ <strong class="hl-shield">+${event.restored}</strong></span></li>`;
      return `<li class="log-ev ev-shield"><span class="ev-tag tag-shield">โล่ป้องกัน</span><span>สร้างการป้องกัน <strong class="hl-shield">+${event.amount} หน่วย</strong>${event.layers > 1 ? ` (${event.layers} ชั้น)` : ''}</span></li>`;
    }
    if (event.type === 'attack') {
      return `<li class="log-ev ${event.amount > 0 ? 'ev-taken' : 'ev-shield'}"><span class="ev-tag ${event.amount > 0 ? 'tag-taken' : 'tag-shield'}">ศัตรูโจมตี</span><span><strong class="hl-target">${escape(names(event.source))}</strong> โจมตี · <strong class="hl-shield">ป้องกันได้ ${event.absorbed}</strong> · ${event.amount > 0 ? `เสีย <strong class="hl-taken">−${event.amount} HP</strong>` : '<strong class="hl-shield">ไม่เสีย HP</strong>'}</span></li>`;
    }
    if (event.type === 'mirror-reflect') {
      return `<li class="log-ev ${event.amount > 0 ? 'ev-taken' : 'ev-shield'}"><span class="ev-tag ${event.amount > 0 ? 'tag-taken' : 'tag-shield'}">กระจกสะท้อน</span><span>ม่านของ <strong class="hl-target">${escape(names(event.source))}</strong> สะท้อนกระสุนกลับ · <strong class="hl-shield">ป้องกันได้ ${event.absorbed}</strong> · ${event.amount > 0 ? `โดนสะท้อน <strong class="hl-taken">−${event.amount} HP</strong>` : '<strong class="hl-shield">ไม่เสีย HP</strong>'}</span></li>`;
    }
    if (event.type === 'ember-thorns') {
      return `<li class="log-ev ${event.amount > 0 ? 'ev-taken' : 'ev-shield'}"><span class="ev-tag ${event.amount > 0 ? 'tag-taken' : 'tag-shield'}">เกล็ดแมกมา</span><span>เกราะไฟของ <strong class="hl-target">${escape(names(event.source))}</strong> เผาสวนกลับ · <strong class="hl-shield">ป้องกันได้ ${event.absorbed}</strong> · ${event.amount > 0 ? `โดนเผา <strong class="hl-taken">−${event.amount} HP</strong>` : '<strong class="hl-shield">ไม่เสีย HP</strong>'}</span></li>`;
    }
    if (event.type === 'storm-static') {
      return `<li class="log-ev ${event.amount > 0 ? 'ev-taken' : 'ev-shield'}"><span class="ev-tag ${event.amount > 0 ? 'tag-taken' : 'tag-shield'}">เกราะอสุนี</span><span>พายุสายฟ้าของ <strong class="hl-target">${escape(names(event.source))}</strong> ช็อตกลับ · <strong class="hl-shield">ป้องกันได้ ${event.absorbed}</strong> · ${event.amount > 0 ? `โดนช็อต <strong class="hl-taken">−${event.amount} HP</strong>` : '<strong class="hl-shield">ไม่เสีย HP</strong>'}</span></li>`;
    }
    if (event.type === 'mana-refund') {
      const relic = RELIC_DRAFT_CATALOG.find(r => r.id === event.relicId);
      return `<li class="log-ev ev-heal"><span class="ev-tag tag-heal">คืนมานา</span><span>${escape(relic?.name ?? 'คาถา')} คืนมานาให้คุณ <strong class="hl-heal">+${event.amount} MP</strong></span></li>`;
    }
    if (event.type === 'relic') {
      const dropped = RELIC_DRAFT_CATALOG.find(r => r.id === event.relicId);
      return `<li class="log-ev ev-heal"><span class="ev-tag tag-heal">อาติแฟค</span><span>ได้รับอาติแฟคชั้น ${dropped?.dropFloor ?? '?'} <strong class="hl-heal">${dropped?.icon ?? '✦'} ${escape(dropped?.name ?? 'เครื่องราง')}</strong></span></li>`;
    }
    if (event.type === 'heal') {
      return `<li class="log-ev ev-heal"><span class="ev-tag tag-heal">ฟื้นฟู</span><span>${escape(names(event.source))} ฟื้นพลังชีวิต <strong class="hl-heal">+${event.amount} HP</strong> ให้ ${escape(names(event.target))}</span></li>`;
    }
    if (event.type === 'status') {
      return `<li class="log-ev ev-status"><span class="ev-tag tag-status">สถานะ</span><span><strong class="hl-target">${escape(names(event.target))}</strong> ${`ติดสถานะ <strong class="hl-status">${{ burn: 'เผาไหม้', chill: 'หนาว', freeze: 'แช่แข็ง' }[event.status]}</strong>`}</span></li>`;
    }
    if (event.type === 'push') {
      const move = event.advancing ? 'ไล่ประชิด' : event.pulled ? 'ดึง' : 'ผลัก';
      return `<li class="log-ev ev-status"><span class="ev-tag tag-status">${move}</span><span><strong class="hl-target">${escape(names(event.target))}</strong> ไปช่อง ${event.slot + 1}</span></li>`;
    }
    if (event.type === 'swap') {
      return `<li class="log-ev ev-status"><span class="ev-tag tag-status">สลับช่อง</span><span>${escape(names(event.source))} สลับกับ ${escape(names(event.target))}</span></li>`;
    }
    if (event.type === 'frozen') {
      return `<li class="log-ev ev-shield"><span class="ev-tag tag-shield">แช่แข็ง</span><span><strong class="hl-target">${escape(names(event.source))}</strong> <strong class="hl-shield">ข้ามการโจมตีเพราะถูกแช่แข็ง</strong></span></li>`;
    }
    if (event.type === 'charge') {
      return `<li class="log-ev ev-status"><span class="ev-tag tag-status">ชาร์จพลัง</span><span><strong class="hl-target">${escape(names(event.source))}</strong> เตรียมโจมตีแรงในเทิร์นถัดไป</span></li>`;
    }
    if (event.type === 'fall') {
      return `<li class="log-ev ev-taken"><span class="ev-tag tag-taken">แพ้ศึก</span><span>กลับ${restLocationLabel(event.targetFloor)}</span></li>`;
    }
    return '';
  }).filter(Boolean).join('');

  let diagnosis = '';
  if (entry.playerDefeated) {
    diagnosis = `<div class="log-turn-diagnosis diag-danger">${entry.fellToFloor != null ? `แพ้ศึก · กลับ${restLocationLabel(entry.fellToFloor)}` : 'HP เหลือ 0 · รอบจบลง'}</div>`;
  } else if (entry.actionType === 'fizzle') {
    diagnosis = `<div class="log-turn-diagnosis diag-warn">คำที่เรียงร่ายไม่ได้ การ์ดและมานาถูกใช้ไป</div>`;
  } else if ((entry.events ?? []).some(e => e.type === 'projectile' && e.blocked) && entry.damage === 0) {
    diagnosis = `<div class="log-turn-diagnosis diag-warn">ม่านกันการโจมตีทั้งหมด ลองใช้ “คู่” ยิงเปิดม่าน หรือใช้ “ลำแสง” ทะลุม่าน</div>`;
  } else if (entry.incoming > 0 && entry.blocked === 0 && entry.shieldCreated === 0) {
    diagnosis = `<div class="log-turn-diagnosis diag-warn">ลองร่าย “โล่” หรือกด “ตั้งรับ” เมื่อศัตรูเตรียมโจมตีหนัก</div>`;
  } else if (entry.incoming > 0 && entry.blocked > 0) {
    diagnosis = `<div class="log-turn-diagnosis diag-info">ป้องกันได้ ${entry.blocked} หน่วย · เสีย ${entry.incoming} HP</div>`;
  } else if (entry.roomCleared) {
    diagnosis = `<div class="log-turn-diagnosis diag-good">✦ ปราบศัตรูครบทุกตัวในห้อง ${entry.roomCode ?? entry.room}!${entry.roomRecovery > 0 ? ` ฟื้นพลังชีวิตหลังจบห้อง +${entry.roomRecovery} HP` : ''}</div>`;
  }

  const roomLabel = entry.roomCode ? `ชั้น ${entry.roomCode}` : `ห้อง ${entry.room}`;
  return `<li class="log-turn-card ${isLatest ? 'is-latest' : ''} ${entry.incoming > 0 || entry.actionType === 'fizzle' ? 'has-warning' : ''}"><div class="log-turn-head"><div class="log-turn-meta">${isLatest ? '<span class="log-latest-badge">เทิร์นล่าสุด</span>' : ''}<span class="log-turn-badge">${roomLabel}${entry.isBoss ? ' (บอส)' : ''} · เทิร์น ${entry.turn}</span>${entry.climaxBonus > 0 ? `<span class="log-climax-badge">⚡ คลั่ง +${entry.climaxBonus}</span>` : ''}${actionHtml}</div><div class="log-turn-pills">${pills.join('')}</div></div><ul class="log-event-list">${eventsHtml || '<li class="log-ev">ไม่มีเหตุการณ์เพิ่มเติมในเทิร์นนี้</li>'}</ul>${diagnosis}</li>`;
}

export function renderLog({ state, turnLogs, lastEvents, lastEnemies }) {
  const logEl = $('combat-log');
  if (!logEl) return;
  if (!turnLogs.length && lastEvents.length) {
    const shieldCreated = lastEvents.filter(e => e.type === 'shield').reduce((sum, e) => sum + (e.amount ?? 0), 0);
    const damageDealt = lastEvents.filter(e => e.type === 'damage').reduce((sum, e) => sum + (e.amount ?? 0), 0);
    const blocked = lastEvents.filter(e => e.type === 'attack').reduce((sum, e) => sum + (e.absorbed ?? 0), 0);
    const incoming = lastEvents.filter(e => e.type === 'attack').reduce((sum, e) => sum + (e.amount ?? 0), 0);
    turnLogs.push({
      room: (state?.room ?? 0) + 1,
      totalRooms: state?.rooms?.length ?? 9,
      isBoss: state ? isBossRoom(state) : false,
      turn: Math.max(1, (state?.turn ?? 2) - 1),
      climaxBonus: 0,
      actionType: 'cast',
      expression: 'เทิร์นก่อนหน้า',
      cost: 0,
      hpBefore: (state?.player?.hp ?? 36) + incoming,
      hpAfter: state?.player?.hp ?? 36,
      damage: damageDealt,
      shieldCreated,
      blocked,
      incoming,
      healed: 0,
      roomRecovery: 0,
      wards: 0,
      roomCleared: false,
      playerDefeated: false,
      enemies: lastEnemies,
      events: lastEvents,
    });
  }
  logEl.innerHTML = turnLogs.length
    ? turnLogs.map((entry, idx) => formatTurnLogCard(entry, idx, lastEnemies)).join('')
    : '<li class="log-empty">ยังไม่มีประวัติเทิร์นในรอบนี้ · เมื่อร่ายคาถาหรือป้องกัน ระบบจะสรุปผลแต่ละเทิร์นไว้ที่นี่โดยเรียงเทิร์นล่าสุดไว้บนสุด</li>';
}
