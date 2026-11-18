import { WORDS } from '../words.js';
import { ENEMIES, RELIC_DRAFT_CATALOG, isBossRoom } from '../run.js';
import { damageLabel, fizzleLabel } from '../render.js';
import { $, escape } from './dom.js';

export function formatTurnLogCard(entry, index, fallbackEnemies = []) {
  const enemyList = entry.enemies ?? fallbackEnemies ?? [];
  const names = id => id === 'player' ? 'คุณ' : ENEMIES[enemyList.find(enemy => enemy.id === id)?.kind]?.name || 'เป้าหมาย';
  const isLatest = index === 0;
  const actionHtml = entry.actionType === 'guard'
    ? `<span class="log-action-title action-guard">ตั้งรับพื้นฐาน <small>(0 มานา · เกราะชั่วคราว +${entry.shieldCreated ?? 3})</small></span>`
    : entry.actionType === 'fizzle'
      ? `<span class="log-action-title action-fizzle">ร่ายผิดสูตร “${escape(entry.expression)}” <small>(เสีย ${entry.cost} มานาฟรี)</small></span>`
      : `<span class="log-action-title action-cast">ร่ายคาถา “${escape(entry.expression)}” <small>(ใช้ ${entry.cost} มานา)</small></span>`;

  const pills = [];
  if (entry.damage > 0 || entry.actionType !== 'guard') {
    pills.push(`<span class="log-pill ${entry.damage > 0 ? 'pill-damage' : 'pill-muted'}">⚔ ดาเมจที่ทำ <strong>${entry.damage}</strong></span>`);
  }
  if (entry.shieldCreated > 0 || entry.blocked > 0 || entry.actionType === 'guard') {
    const shieldParts = [];
    if (entry.shieldCreated > 0) shieldParts.push(`สร้างโล่ <strong>+${entry.shieldCreated}</strong>`);
    shieldParts.push(`ป้องกันได้ <strong>${entry.blocked}</strong>`);
    pills.push(`<span class="log-pill ${(entry.shieldCreated > 0 || entry.blocked > 0) ? 'pill-shield' : 'pill-muted'}">🛡 ${shieldParts.join(' · ')}</span>`);
  }
  if (entry.incoming > 0) {
    pills.push(`<span class="log-pill pill-taken">💔 รับดาเมจ <strong>−${entry.incoming}</strong> <small>(HP ${entry.hpBefore}→${entry.hpAfter})</small></span>`);
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
      return `<li class="log-ev ev-taken"><span class="ev-tag tag-taken">ร่ายเฟล</span><span><strong>“${escape(event.expression)}”</strong> · ${fizzleLabel(event.cost)}</span></li>`;
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
      return `<li class="log-ev ev-damage"><span class="ev-tag tag-damage">${event.amount > 0 ? 'ดาเมจ' : 'เกราะ'}</span><span><strong class="hl-target">${escape(names(event.target))}</strong> · ${source} · <strong class="hl-damage">${damageLabel(event)}</strong>${event.reduction ? ` · อ่านทาง −${event.reduction}%` : ''}${event.killed ? ' · <strong class="hl-kill">ปราบสำเร็จ!</strong>' : ''}</span></li>`;
    }
    if (event.type === 'shield') {
      if (event.restored) return `<li class="log-ev ev-shield"><span class="ev-tag tag-shield">มหาโล่</span><span>ต้นเทิร์นถัดไปเติมโล่ <strong class="hl-shield">+${event.restored}</strong></span></li>`;
      return `<li class="log-ev ev-shield"><span class="ev-tag tag-shield">โล่ป้องกัน</span><span>สร้างการป้องกัน <strong class="hl-shield">+${event.amount} หน่วย</strong>${event.layers > 1 ? ` (${event.layers} ชั้น)` : ''}</span></li>`;
    }
    if (event.type === 'attack') {
      return `<li class="log-ev ${event.amount > 0 ? 'ev-taken' : 'ev-shield'}"><span class="ev-tag ${event.amount > 0 ? 'tag-taken' : 'tag-shield'}">ศัตรูโจมตี</span><span><strong class="hl-target">${escape(names(event.source))}</strong> โจมตีสวนกลับ · <strong class="hl-shield">ป้องกันได้ ${event.absorbed}</strong> · ${event.amount > 0 ? `ทะลุเข้าตัว <strong class="hl-taken">−${event.amount} HP</strong>` : '<strong class="hl-shield">รับความเสียหาย 0 HP</strong>'}</span></li>`;
    }
    if (event.type === 'mirror-reflect') {
      return `<li class="log-ev ${event.amount > 0 ? 'ev-taken' : 'ev-shield'}"><span class="ev-tag ${event.amount > 0 ? 'tag-taken' : 'tag-shield'}">กระจกสะท้อน</span><span>ม่านของ <strong class="hl-target">${escape(names(event.source))}</strong> สะท้อนกระสุนกลับ · <strong class="hl-shield">ป้องกันได้ ${event.absorbed}</strong> · ${event.amount > 0 ? `โดนสะท้อน <strong class="hl-taken">−${event.amount} HP</strong>` : '<strong class="hl-shield">โล่รับไว้ได้ 0 HP</strong>'}</span></li>`;
    }
    if (event.type === 'ember-thorns') {
      return `<li class="log-ev ${event.amount > 0 ? 'ev-taken' : 'ev-shield'}"><span class="ev-tag ${event.amount > 0 ? 'tag-taken' : 'tag-shield'}">เกล็ดแมกมา</span><span>เกราะไฟของ <strong class="hl-target">${escape(names(event.source))}</strong> เผาสวนกลับ · <strong class="hl-shield">ป้องกันได้ ${event.absorbed}</strong> · ${event.amount > 0 ? `โดนเผา <strong class="hl-taken">−${event.amount} HP</strong>` : '<strong class="hl-shield">โล่รับไว้ได้ 0 HP</strong>'}</span></li>`;
    }
    if (event.type === 'storm-static') {
      return `<li class="log-ev ${event.amount > 0 ? 'ev-taken' : 'ev-shield'}"><span class="ev-tag ${event.amount > 0 ? 'tag-taken' : 'tag-shield'}">เกราะอสุนี</span><span>พายุสายฟ้าของ <strong class="hl-target">${escape(names(event.source))}</strong> ช็อตกลับ · <strong class="hl-shield">ป้องกันได้ ${event.absorbed}</strong> · ${event.amount > 0 ? `โดนช็อต <strong class="hl-taken">−${event.amount} HP</strong>` : '<strong class="hl-shield">โล่รับไว้ได้ 0 HP</strong>'}</span></li>`;
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
      return `<li class="log-ev ev-status"><span class="ev-tag tag-status">สถานะ</span><span><strong class="hl-target">${escape(names(event.target))}</strong> ${event.status === 'burn' ? 'ติดสถานะ <strong class="hl-damage">เผาไหม้</strong>' : 'ติดสถานะ <strong class="hl-shield">แช่แข็ง</strong>'}</span></li>`;
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
      const fallText = event.targetFloor === 19
        ? 'พ่ายแพ้บอสชั้น 20 · ถูกส่งกลับจุดพักชั้น 19'
        : event.targetFloor === 14
          ? 'พ่ายแพ้ระหว่างไต่ชั้น 15–18 · รีเซ็ตความคืบหน้าชั้น 15–18 และส่งกลับจุดพักชั้น 14'
          : event.targetFloor === 'post10'
            ? 'พ่ายแพ้ระหว่างไต่ชั้น 11–13 · รีเซ็ตความคืบหน้าชั้น 11–13 และส่งกลับจุดพักหลังบอส 10'
            : event.targetFloor === 9
              ? 'พ่ายแพ้บอสชั้น 10 · ถูกส่งกลับจุดพักชั้น 9'
              : 'พ่ายแพ้ระหว่างไต่ชั้น 5–8 · รีเซ็ตความคืบหน้าชั้น 5–8 และส่งกลับจุดพักชั้น 4';
      return `<li class="log-ev ev-taken"><span class="ev-tag tag-taken">ร่วงชั้น</span><span>${fallText}</span></li>`;
    }
    return '';
  }).filter(Boolean).join('');

  let diagnosis = '';
  if (entry.playerDefeated) {
    if (entry.fellToFloor === 4) {
      diagnosis = `<div class="log-turn-diagnosis diag-danger">💀 วิเคราะห์ความพ่ายแพ้: รับดาเมจทะลุเข้ามา −${entry.incoming} HP จนพลังชีวิตหมดในชั้น 5–8 (ป้องกันได้ ${entry.blocked} หน่วย) · รีเซ็ตความคืบหน้าชั้น 5–8 กลับจุดพักชั้น 4 เพื่อเริ่มไต่ 5-1 ใหม่</div>`;
    } else if (entry.fellToFloor === 9) {
      diagnosis = `<div class="log-turn-diagnosis diag-danger">💀 วิเคราะห์ความพ่ายแพ้: รับดาเมจทะลุเข้ามา −${entry.incoming} HP จนพลังชีวิตหมดหน้าบอสชั้น 10 (ป้องกันได้ ${entry.blocked} หน่วย) · กลับไปพักฟื้นที่จุดพักชั้น 9</div>`;
    } else if (entry.fellToFloor === 'post10') {
      diagnosis = `<div class="log-turn-diagnosis diag-danger">💀 วิเคราะห์ความพ่ายแพ้: รับดาเมจทะลุเข้ามา −${entry.incoming} HP จนพลังชีวิตหมดในชั้น 11–13 (ป้องกันได้ ${entry.blocked} หน่วย) · รีเซ็ตความคืบหน้าชั้น 11–13 กลับจุดพักหลังบอส 10 เพื่อเริ่มไต่ 11-1 ใหม่</div>`;
    } else if (entry.fellToFloor === 14) {
      diagnosis = `<div class="log-turn-diagnosis diag-danger">💀 วิเคราะห์ความพ่ายแพ้: รับดาเมจทะลุเข้ามา −${entry.incoming} HP จนพลังชีวิตหมดในชั้น 15–18 (ป้องกันได้ ${entry.blocked} หน่วย) · รีเซ็ตความคืบหน้าชั้น 15–18 กลับจุดพักชั้น 14 เพื่อเริ่มไต่ 15-1 ใหม่</div>`;
    } else if (entry.fellToFloor === 19) {
      diagnosis = `<div class="log-turn-diagnosis diag-danger">💀 วิเคราะห์ความพ่ายแพ้: รับดาเมจทะลุเข้ามา −${entry.incoming} HP จนพลังชีวิตหมดหน้าบอสชั้น 20 (ป้องกันได้ ${entry.blocked} หน่วย) · กลับไปพักฟื้นที่จุดพักชั้น 19</div>`;
    } else {
      diagnosis = `<div class="log-turn-diagnosis diag-danger">💀 วิเคราะห์ความพ่ายแพ้: รับดาเมจทะลุเข้ามา −${entry.incoming} HP จนพลังชีวิตหมดในเทิร์นนี้ (ป้องกันได้ ${entry.blocked} หน่วย)</div>`;
    }
  } else if (entry.actionType === 'fizzle') {
    diagnosis = `<div class="log-turn-diagnosis diag-warn">⚠ วิเคราะห์ความผิดพลาด: เรียงคำ “${escape(entry.expression)}” ไม่ตรงสูตร เสีย ${entry.cost} มานาฟรีโดยไม่มีผล และถูกศัตรูโจมตีสวนกลับ</div>`;
  } else if ((entry.events ?? []).some(e => e.type === 'projectile' && e.blocked) && entry.damage === 0) {
    diagnosis = `<div class="log-turn-diagnosis diag-warn">⚠ วิเคราะห์: การโจมตีติดม่านศัตรูทั้งหมด (0 ดาเมจ) · แนะนำใช้ “คู่” ยิงเปิดม่านลูกแรก หรือใช้ “ลำแสง” ยิงทะลุม่าน</div>`;
  } else if (entry.incoming > 0 && entry.blocked === 0 && entry.shieldCreated === 0) {
    diagnosis = `<div class="log-turn-diagnosis diag-warn">💡 วิเคราะห์: รับดาเมจเต็ม −${entry.incoming} HP โดยไม่มีโล่ป้องกัน · ลองร่าย “โล่” หรือกด “ป้องกัน” เมื่อศัตรูง้างโจมตีหนัก</div>`;
  } else if (entry.incoming > 0 && entry.blocked > 0) {
    diagnosis = `<div class="log-turn-diagnosis diag-info">ℹ วิเคราะห์: โล่ช่วยกันดาเมจไว้ได้ ${entry.blocked} หน่วย แต่ดาเมจศัตรูยังทะลุเข้ามาอีก −${entry.incoming} HP</div>`;
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
