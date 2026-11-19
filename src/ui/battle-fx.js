import { WORDS, elementFamily } from '../words.js';
import { ENEMIES, RELIC_DRAFT_CATALOG } from '../run.js';
import { damageLabel, fizzleLabel, wardLabel } from '../render.js';
import { $, queueFxClassRestart, upperCheckpoint, checkpointFloor } from './dom.js';

export const CAMERA_SHAKE_CLASSES = [
  'camera-shake-damage',
  'camera-shake-boss-heavy',
  'camera-shake-boss-ultimate-fire',
  'camera-shake-boss-ultimate-storm',
  'camera-shake-tremor',
];

export const BATTLE_VIEW_SHAKE_CLASSES = [
  'battle-shake-damage',
  'battle-shake-boss-heavy',
  'battle-shake-boss-ultimate',
];

let lastPlayerHpWidth = null;

export function resetPlayerHpFx() {
  lastPlayerHpWidth = null;
}

export function renderPlayerHp(hp, maxHp) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(100, hp / maxHp * 100)) : 0;
  const pctStr = `${pct}%`;
  const valueEl = $('hp-value');
  const meterEl = $('hp-meter');
  const trailEl = $('hp-meter-trail');
  const resourceEl = meterEl?.closest('.hp-resource');
  const meterWrap = meterEl?.closest('.resource-meter');
  if (valueEl) valueEl.textContent = `${hp} / ${maxHp}`;
  if (meterWrap) meterWrap.classList.toggle('is-healing', lastPlayerHpWidth !== null && pct > lastPlayerHpWidth);
  if (trailEl) trailEl.style.width = pctStr;
  if (meterEl) meterEl.style.width = pctStr;
  if (lastPlayerHpWidth !== null && pct !== lastPlayerHpWidth) {
    const fxClass = pct < lastPlayerHpWidth ? 'hp-change-hit' : 'hp-change-heal';
    if (resourceEl) queueFxClassRestart(resourceEl, ['hp-change-hit', 'hp-change-heal'], fxClass);
    if (valueEl) queueFxClassRestart(valueEl, ['hp-value-hit', 'hp-value-heal'], pct < lastPlayerHpWidth ? 'hp-value-hit' : 'hp-value-heal');
  }
  lastPlayerHpWidth = pct;
}

export function triggerEnemyCardFx(enemyId, fxClass) {
  const card = $(`target-${enemyId}`);
  if (!card) return;
  queueFxClassRestart(card, ['enemy-hit-shake', 'enemy-acting-lunge', 'enemy-targeted-pulse'], fxClass);
}

export function renderShieldStatus(protection) {
  const el = $('shield-status');
  const layers = protection?.details ?? [];
  el.hidden = !layers.length;
  el.textContent = layers.length ? `โล่ ${layers.length} ชั้น · ${layers.map(layer => {
    const elements = layer.elements ?? (layer.effect ? [layer.effect] : []);
    const name = elements.map(id => WORDS[id]?.label ?? (id === 'akki-blast' ? 'อัคคีระเบิด' : id)).join('+');
    return `${name ? name + ' ' : ''}${layer.hp}`;
  }).join(' / ')}` : '';
}

export function pulsePlayerHud(kind = 'shield') {
  const bar = document.querySelector('.resource-bar');
  const shieldEl = $('shield-status');
  if (bar) {
    queueFxClassRestart(bar, ['hud-pulse-shield', 'hud-pulse-hit', 'hud-pulse-heal'], `hud-pulse-${kind}`);
  }
  if (shieldEl && (kind === 'shield' || kind === 'hit')) {
    queueFxClassRestart(shieldEl, ['shield-active-glow', 'shield-absorb-flash'], kind === 'shield' ? 'shield-active-glow' : 'shield-absorb-flash');
  }
}

const CAST_ELEM_CLASSES = ['cast-elem-fire', 'cast-elem-ice', 'cast-elem-lightning', 'cast-elem-earth', 'cast-elem-water', 'cast-elem-wind', 'cast-elem-shield', 'cast-elem-heal'];
const CAST_BURST_CLASSES = ['cast-burst-fire', 'cast-burst-ice', 'cast-burst-lightning'];
const CANVAS_IMPACT_CLASSES = [
  'canvas-impact-fire', 'canvas-impact-ice', 'canvas-impact-lightning',
  'canvas-impact-earth', 'canvas-impact-water', 'canvas-impact-wind',
  'canvas-impact-blast', 'canvas-impact-ward', 'canvas-impact-shield',
  'canvas-impact-heal', 'canvas-impact-death', 'canvas-impact-meteor',
  'canvas-impact-blackhole', 'canvas-impact-veil', 'canvas-impact-brace',
  'canvas-impact-grand',
];
const DIRECT_OVERLAY_THEMES = new Set(['death', 'meteor', 'blackhole', 'veil', 'brace', 'grand', 'blast', 'ward', 'shield', 'heal']);

function resolveOverlayTheme(elem, fallback = 'fire') {
  if (!elem) return fallback;
  if (DIRECT_OVERLAY_THEMES.has(elem)) return elem;
  return elementFamily(elem);
}

export function pulseSpellSlotsElem(elem = 'fire') {
  const family = elementFamily(elem);
  const slots = $('spell-slots');
  if (!slots) return;
  const burstClass = family === 'fire' || family === 'ice' || family === 'lightning' ? ` cast-burst-${family}` : '';
  queueFxClassRestart(slots, [...CAST_ELEM_CLASSES, ...CAST_BURST_CLASSES], `cast-elem-${family}${burstClass}`);
}

export function createBattleFxController({ getState, getTargetId, getSettings, getAudio, getBattlefield }) {
  let animEnemyHp = {};
  let animPlayerHp = 0;
  let animPlayerMaxHp = 0;

  function beginTurnAnimation(state) {
    const numbers = $('combat-numbers');
    if (numbers && typeof numbers.replaceChildren === 'function') numbers.replaceChildren();
    else if (numbers) numbers.innerHTML = '';
    animEnemyHp = Object.fromEntries(state.enemies.map(e => [e.id, e.hp]));
    animPlayerHp = state.player.hp;
    animPlayerMaxHp = state.player.maxHp;
  }

  function changeAnimatedPlayerHp(amount, maxGain = 0) {
    animPlayerMaxHp += maxGain;
    animPlayerHp = Math.max(0, Math.min(animPlayerMaxHp, animPlayerHp + amount));
    renderPlayerHp(animPlayerHp, animPlayerMaxHp);
  }

  function spawnEnemyPop(enemyId, text, variant) {
    const card = $(`target-${enemyId}`);
    if (!card || getSettings().reducedMotion) return;
    const existing = card.querySelectorAll('.enemy-floating-pop').length;
    const pop = document.createElement('span');
    pop.className = `enemy-floating-pop pop-${variant}`;
    pop.setAttribute('aria-hidden', 'true');
    pop.textContent = text;
    if (existing > 0) {
      const xShift = ((existing % 3) - 1) * 16;
      const yShift = -(existing * 14);
      pop.style.setProperty('--pop-x', `${xShift}px`);
      pop.style.setProperty('--pop-y', `${yShift}px`);
    }
    card.appendChild(pop);
    const cleanup = () => pop.remove();
    pop.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 950);
  }

  function changeAnimatedEnemyHp(id, amount) {
    const state = getState();
    const enemy = state?.enemies?.find(candidate => candidate.id === id);
    if (!enemy) return;
    const prevHp = animEnemyHp[id] ?? enemy.hp;
    const nextHp = Math.max(0, Math.min(enemy.maxHp, prevHp + amount));
    animEnemyHp[id] = nextHp;
    const card = $(`target-${id}`);
    if (!card) return;
    const hpTextEl = card.querySelector('.enemy-hp-text');
    const hpWrap = card.querySelector('.enemy-hp');
    const hpFill = card.querySelector('.enemy-hp-fill') ?? card.querySelector('.enemy-hp i');
    const hpTrail = card.querySelector('.enemy-hp-trail');
    const pctStr = `${enemy.maxHp > 0 ? Math.max(0, Math.min(100, nextHp / enemy.maxHp * 100)) : 0}%`;
    if (hpTextEl) {
      hpTextEl.textContent = `${nextHp}/${enemy.maxHp}`;
      if (amount !== 0) {
        queueFxClassRestart(hpTextEl, ['hp-text-hit', 'hp-text-heal'], amount < 0 ? 'hp-text-hit' : 'hp-text-heal');
      }
    }
    if (hpWrap) hpWrap.classList.toggle('is-healing', amount > 0);
    if (hpTrail) hpTrail.style.width = pctStr;
    if (hpFill) hpFill.style.width = pctStr;
    card.classList.toggle('dead', nextHp === 0);
  }

  function triggerCameraScreenShake(intensity = 'damage', bossKind = null) {
    if (getSettings().reducedMotion) return;
    const wrap = $('battlefield-wrap') ?? document.querySelector('.battlefield-wrap');
    const battleView = $('battle-view');
    const isStorm = bossKind === 'tempest_archon';
    const wrapClass = intensity === 'boss-ultimate'
      ? (isStorm ? 'camera-shake-boss-ultimate-storm' : 'camera-shake-boss-ultimate-fire')
      : intensity === 'boss-heavy'
        ? 'camera-shake-boss-heavy'
        : intensity === 'tremor'
          ? 'camera-shake-tremor'
          : 'camera-shake-damage';
    if (wrap) queueFxClassRestart(wrap, CAMERA_SHAKE_CLASSES, wrapClass);
    if (battleView && intensity !== 'tremor') {
      const viewClass = intensity === 'boss-ultimate'
        ? 'battle-shake-boss-ultimate'
        : intensity === 'boss-heavy'
          ? 'battle-shake-boss-heavy'
          : 'battle-shake-damage';
      queueFxClassRestart(battleView, BATTLE_VIEW_SHAKE_CLASSES, viewClass);
    }
  }

  function pulseBossUltimateImpact(bossKind, mode = 'attack', sourceId = 'enemy-0') {
    const layer = $('canvas-impact-layer');
    if (!layer || getSettings().reducedMotion) return;
    const state = getState();
    const battlefield = getBattlefield();
    const isStorm = bossKind === 'tempest_archon';
    const themeClass = isStorm ? 'elem-boss-ultimate-storm' : 'elem-boss-ultimate-fire';
    let impactX = 16;
    let impactY = 66;
    if (mode === 'charge') {
      const enemy = state?.enemies?.find(candidate => candidate.id === sourceId);
      impactX = enemy ? battlefield.enemyX(enemy) / 3.2 : 70;
      impactY = 58;
    }
    const shards = Array.from({ length: 8 }, (_, idx) => `<i style="--ang:${idx * 45}deg"></i>`).join('');
    layer.innerHTML = `
      <span class="canvas-impact-vignette ${themeClass}"></span>
      <span class="canvas-impact-node ${themeClass}" style="--impact-x:${impactX}%;--impact-y:${impactY}%">
        <span class="impact-core-flare"></span>
        <span class="impact-shock-ring"></span>
        <span class="impact-shock-ring ring-secondary"></span>
        <span class="impact-shards">${shards}</span>
      </span>`;
  }

  function pulseBattleCanvasImpact() {
    const layer = $('canvas-impact-layer');
    const state = getState();
    const targetId = getTargetId();
    const enemy = state?.enemies?.find(candidate => candidate.id === targetId);
    if (!layer || !enemy || getSettings().reducedMotion) return;
    const x = getBattlefield().enemyX(enemy) / 3.2;
    const y = ENEMIES[enemy.kind]?.isBoss ? 58 : 66;
    layer.innerHTML = `<span class="canvas-impact-node elem-fire" style="--impact-x:${x}%;--impact-y:${y}%"><span class="impact-shock-ring"></span></span>`;
  }

  function pulseElementalOverlay(elem, impactX = 64, impactY = 64, { grand = false, large = false, boosted = false, withVignette = false } = {}) {
    if (getSettings().reducedMotion) return;
    const theme = resolveOverlayTheme(elem, 'fire');
    const canvas = $('battle-canvas');
    if (canvas) queueFxClassRestart(canvas, CANVAS_IMPACT_CLASSES, `canvas-impact-${theme}`);
    const layer = $('canvas-impact-layer');
    if (!layer) return;
    const isGrand = Boolean(grand);
    const isLarge = Boolean(!isGrand && large);
    const isBoosted = Boolean(!isGrand && !isLarge && boosted);
    const hasSecondaryRing = isGrand || isLarge || isBoosted;
    const shardCount = isGrand ? 8 : (isLarge || isBoosted) ? 6 : 4;
    const shards = Array.from({ length: shardCount }, (_, idx) => `<i style="--ang:${Math.round(idx * (360 / shardCount))}deg"></i>`).join('');
    const sizeClass = isGrand ? 'is-grand' : isLarge ? 'is-large' : isBoosted ? 'is-boosted' : 'is-compact';
    const hasCrest = theme === 'ice' || theme === 'fire' || theme === 'blast' || theme === 'meteor';
    layer.innerHTML = `
      ${withVignette ? `<span class="canvas-impact-vignette elem-${theme}"></span>` : ''}
      <span class="canvas-impact-node ${sizeClass} elem-${theme}" style="--impact-x:${impactX}%;--impact-y:${impactY}%">
        <span class="impact-core-flare"></span>
        <span class="impact-shock-ring"></span>
        ${hasSecondaryRing ? '<span class="impact-shock-ring ring-secondary"></span>' : ''}
        ${hasCrest ? '<span class="impact-prism-crest"></span>' : ''}
        <span class="impact-shards">${shards}</span>
      </span>`;
  }

  function enemyImpactCoords(enemyId, fallbackX = 64) {
    const enemy = getState()?.enemies?.find(candidate => candidate.id === enemyId);
    if (!enemy) return { x: fallbackX, y: 64 };
    return {
      x: getBattlefield().enemyX(enemy) / 3.2,
      y: ENEMIES[enemy.kind]?.isBoss ? 58 : 66,
    };
  }

  function showCombatNumber(event, index) {
    const heals = event.type === 'heal' || event.type === 'room-clear';
    const incoming = ['attack', 'mirror-reflect', 'ember-thorns', 'storm-static'].includes(event.type);
    if (!heals && !incoming && event.type !== 'damage') return;
    const amount = event.recovered ?? event.actual ?? event.amount;
    if (!(amount > 0)) return;

    const actor = incoming || event.type === 'room-clear' ? 'player' : event.target;
    const state = getState();
    const enemyIndex = state.enemies.findIndex(enemy => enemy.id === actor);
    const battlefield = getBattlefield();
    const layer = $('combat-numbers');
    if (!layer || !layer.children) return;
    const related = [...layer.children].filter(number => number.dataset.actor === actor);
    const usedLanes = new Set(related.map(number => number.dataset.lane));
    const lane = ['0', '1', '2'].find(candidate => !usedLanes.has(candidate)) ?? related[0].dataset.lane;
    if (usedLanes.size === 3) related[0].remove();
    if (layer.childElementCount >= 12) layer.firstElementChild.remove();

    const number = document.createElement('span');
    number.className = 'combat-number';
    number.dataset.actor = actor;
    number.dataset.lane = lane;
    number.dataset.kind = heals ? 'heal' : incoming ? 'incoming' : 'damage';
    number.dataset.element = elementFamily(event.element ?? '');
    const strong = Boolean(event.grand || event.large || event.heavy || event.weakness || event.killed || amount >= (heals ? 12 : 15));
    if (strong) number.classList.add('is-strong');
    if (event.weakness || event.killed) number.classList.add('is-gold');
    const name = heals ? 'ฟื้น HP' : event.weakness ? 'จุดอ่อน' : event.killed ? 'ปิดฉาก' : event.resisted ? 'ต้านทาน' : event.ultimate ? 'ท่าบอส' : 'HP';
    const digits = document.createElement('strong');
    digits.textContent = `${heals ? '+' : '−'}${amount}`;
    const caption = document.createElement('small');
    caption.textContent = name;
    number.append(digits, caption);

    const x = actor === 'player' ? 51 : battlefield.snapshots?.[index]?.positions[enemyIndex] ?? enemyImpactCoords(actor).x;
    const stagger = enemyIndex < 0 ? 0 : (state.enemies[enemyIndex].slot % 2) * 24;
    const offset = [0, 22, -22][Number(lane)];
    number.style.setProperty('--number-x', `calc(${x / 3.2}% + ${offset}px)`);
    number.style.setProperty('--number-y', `${62 - stagger - Number(lane) * 15}%`);
    layer.appendChild(number);
    number.addEventListener('animationend', () => number.remove(), { once: true });
    setTimeout(() => number.remove(), 880);
  }

  function handleCombatStep(event, index) {
    const state = getState();
    const audio = getAudio();
    const battlefield = getBattlefield();
    audio.combat(event);
    const status = $('animation-status-text');
    if (event.protection) renderShieldStatus(event.protection);
    showCombatNumber(event, index);
    switch (event.type) {
      case 'projectile': {
        const form = WORDS[event.form]?.label ?? event.form;
        const element = (event.elements ?? [event.element]).map(id => WORDS[id]?.label ?? id).join('+');
        if (event.element !== 'storm') pulseSpellSlotsElem(event.element ?? 'fire');
        if (!event.blocked) {
          const { x, y } = enemyImpactCoords(event.target);
          pulseElementalOverlay(event.element ?? 'fire', x, y, {
            grand: Boolean(event.grand),
            large: Boolean(event.large),
            boosted: Boolean(event.shellBlast),
            withVignette: Boolean(event.grand),
          });
        }
        if (event.blocked) {
          triggerEnemyCardFx(event.target, 'enemy-targeted-pulse');
          spawnEnemyPop(event.target, 'กันม่าน', 'ward');
          const { x, y } = enemyImpactCoords(event.target);
          pulseElementalOverlay('ward', x, y);
          const wardBadge = document.querySelector(`#target-${event.target} .badge-ward:not(.badge-sealed)`);
          if (wardBadge) {
            if (event.wardRemaining > 0) wardBadge.textContent = `🔮 ม่าน ${event.wardRemaining}`;
            else wardBadge.remove();
          }
          status.textContent = `${[form, element].filter(Boolean).join(' ')} · ${wardLabel(event.wardRemaining)}`;
        } else if (event.damage) {
          handleCombatStep(event.damage, index);
        } else {
          status.textContent = `ร่าย ${[form, element].filter(Boolean).join(' ')}`;
        }
        break;
      }
      case 'damage': {
        if (event.element === 'death' && event.amount > 0) {
          const { x, y } = enemyImpactCoords(event.target);
          pulseElementalOverlay('death', x, y, {
            grand: Boolean(event.grand),
            large: Boolean(event.large),
            boosted: true,
            withVignette: true,
          });
        }
        if (event.amount > 0) {
          changeAnimatedEnemyHp(event.target, -(event.actual ?? event.amount));
          triggerEnemyCardFx(event.target, 'enemy-hit-shake');
        } else {
          triggerEnemyCardFx(event.target, 'enemy-targeted-pulse');
          spawnEnemyPop(event.target, 'เกราะกันหมด', 'target');
        }
        if (event.levelMaxHp) changeAnimatedPlayerHp(event.levelHp, event.levelMaxHp);
        status.textContent = `${damageLabel(event)}${event.killed ? ' · ปราบศัตรูแล้ว' : ''}`;
        break;
      }
      case 'armor-shred': {
        const badge = $(`target-${event.target}`)?.querySelector('.badge-armor-value');
        if (badge) {
          badge.textContent = `🛡 เกราะ ${event.armor}`;
          badge.title = 'ค่าพลังป้องกันหลังโดนทุบเกราะ';
        }
        spawnEnemyPop(event.target, `เกราะ −${event.amount}`, 'target');
        status.textContent = `ทุบเกราะ −${event.amount} · เหลือ ${event.armor}`;
        break;
      }
      case 'shield-counter':
        spawnEnemyPop(event.target, `โล่${WORDS[event.element].label}ตอบโต้`, 'status');
        status.textContent = `โล่${WORDS[event.element].label}ตอบโต้ผู้โจมตี`;
        break;
      case 'blast': {
        pulseSpellSlotsElem(event.element ?? 'fire');
        const label = event.element === 'blackhole' ? 'หลุมดำยุบ' : event.element === 'meteor' ? 'อุกกาบาตตก' : event.devastation ? 'ทำลายล้าง' : event.radius === 2 ? 'มหาระเบิด' : 'ระเบิด';
        const elements = (event.elements ?? []).map(id => WORDS[id].label).join('+');
        const targetXs = (event.targets ?? [])
          .map(id => state?.enemies?.find(candidate => candidate.id === id))
          .filter(Boolean)
          .map(enemy => battlefield.enemyX(enemy) / 3.2);
        const blastX = targetXs.length
          ? targetXs.reduce((sum, val) => sum + val, 0) / targetXs.length
          : event.slot !== undefined
            ? battlefield.puddleX(event.slot) / 3.2
            : 64;
        const blastTheme = event.element ?? 'blast';
        const isBoostedBlast = Boolean(event.devastation || event.radius === 2 || blastTheme === 'meteor' || blastTheme === 'blackhole');
        pulseElementalOverlay(blastTheme, blastX, 64, {
          grand: Boolean(event.grand),
          large: Boolean(event.large),
          boosted: isBoostedBlast,
          withVignette: Boolean(event.grand || isBoostedBlast),
        });
        for (const id of event.wardedTargets ?? []) spawnEnemyPop(id, 'กันม่าน', 'ward');
        status.textContent = `${[label, elements].filter(Boolean).join(' ')} · ${event.targets.length} เป้า`;
        break;
      }
      case 'blackhole-open':
        status.textContent = `หลุมดำเปิดที่ช่อง ${event.slot + 1} · ยุบเทิร์นหน้า`;
        break;
      case 'chain-lightning':
        status.textContent = `${WORDS[event.element].label}ชิ่ง`;
        if (event.damage) handleCombatStep(event.damage, index);
        break;
      case 'magma-puddle':
        status.textContent = `แอ่งแมกม่าช่อง ${event.slot + 1} ปะทุเทิร์นหน้า`;
        break;
      case 'magma-erupt':
        status.textContent = `แอ่งแมกม่าช่อง ${event.slot + 1} ปะทุ`;
        if (event.damage) handleCombatStep(event.damage, index);
        break;
      case 'ward-grant':
        status.textContent = `ช่อง ${event.slot + 1} ได้ม่านเพิ่มเทิร์นหน้า`;
        triggerEnemyCardFx(event.target, 'enemy-targeted-pulse');
        break;
      case 'dispel':
        $(`target-${event.target}`)?.querySelector('.badge-ward:not(.badge-sealed)')?.remove();
        spawnEnemyPop(event.target, `สลายม่าน -${event.amount}`, 'ward');
        status.textContent = `สลายม่าน ${event.amount} ชั้น`;
        break;
      case 'seal':
        status.textContent = 'ผนึกท่าสนับสนุนครั้งถัดไป';
        break;
      case 'sealed':
        status.textContent = 'ศัตรูติดผนึก · ข้ามท่าสนับสนุน';
        break;
      case 'recover':
        status.textContent = event.label ?? 'บอสพักโจมตี';
        break;
      case 'brace':
        status.textContent = 'โล่ยืนหยัด · กันเพิ่ม 6';
        pulsePlayerHud('shield');
        pulseElementalOverlay('brace', 16, 66);
        break;
      case 'shield': {
        pulseSpellSlotsElem(event.elements?.[0] ?? 'shield');
        pulsePlayerHud('shield');
        if (!event.secondary) {
          const shieldTheme = event.grand
            ? 'grand'
            : event.shieldKind === 'veil' || event.element === 'veil'
              ? 'veil'
              : event.shieldKind === 'brace'
                ? 'brace'
                : event.elements?.[0]
                  ? resolveOverlayTheme(event.elements[0], 'shield')
                  : 'shield';
          pulseElementalOverlay(shieldTheme, 16, 66, {
            grand: Boolean(event.grand),
            large: Boolean(event.large),
            withVignette: Boolean(event.grand),
          });
        }
        status.textContent = event.restored ? `ต้นเทิร์นถัดไปเติมโล่ +${event.restored}` : `กางโล่ +${event.amount}`;
        break;
      }
      case 'heal': {
        if (event.target === 'player') {
          changeAnimatedPlayerHp(event.amount);
          pulseSpellSlotsElem('heal');
          pulsePlayerHud('heal');
          if (event.amount > 0 && event.healKind !== 'bonus') {
            const isGrandHeal = Boolean(event.grand || event.healKind === 'grand' || event.healKind === 'regen');
            const isLargeHeal = Boolean(!isGrandHeal && (event.large || event.healKind === 'large'));
            pulseElementalOverlay(isGrandHeal ? 'grand' : 'heal', 16, 66, {
              grand: isGrandHeal,
              large: isLargeHeal,
              withVignette: isGrandHeal,
            });
          }
        } else {
          changeAnimatedEnemyHp(event.target, event.amount);
          triggerEnemyCardFx(event.target, 'enemy-targeted-pulse');
          if (event.amount > 0) {
            const { x, y } = enemyImpactCoords(event.target);
            pulseElementalOverlay('ward', x, y);
          }
        }
        const action = event.target !== 'player' ? 'ศัตรูฟื้น' : event.nextTurn ? 'ต้นเทิร์นถัดไปฟื้น' : 'ฟื้น';
        status.textContent = `${action} +${event.amount} HP`;
        break;
      }
      case 'status': {
        const label = { burn: 'เผาไหม้', chill: 'หนาว', freeze: 'แช่แข็ง' }[event.status];
        triggerEnemyCardFx(event.target, 'enemy-targeted-pulse');
        spawnEnemyPop(event.target, label, 'status');
        status.textContent = `ศัตรูติดสถานะ${label}`;
        break;
      }
      case 'push': {
        triggerEnemyCardFx(event.target, 'enemy-hit-shake');
        const enemy = state.enemies.find(candidate => candidate.id === event.target);
        const card = $(`target-${event.target}`);
        if (enemy && card) {
          card.style.setProperty('--enemy-x', `${battlefield.enemyX(enemy, event.slot) / 3.2}%`);
          const label = card.querySelector('[data-enemy-slot-label]');
          if (label) label.textContent = `ช่อง ${event.slot + 1}`;
          if (Object.hasOwn(card.dataset, 'middleLane')) card.dataset.middleLane = event.slot % 2;
        }
        status.textContent = event.advancing ? `ศัตรูไล่ประชิดช่อง ${event.slot + 1}` : `${event.pulled ? 'ดึง' : 'ผลัก'}ศัตรูไปช่อง ${event.slot + 1}`;
        break;
      }
      case 'swap':
        status.textContent = `ศัตรูสลับช่อง ${event.slot + 1} กับ ${event.sourceSlot + 1}`;
        for (const [id, slot] of [[event.target, event.slot], [event.source, event.sourceSlot]]) {
          const enemy = state.enemies.find(candidate => candidate.id === id);
          const card = $(`target-${id}`);
          if (enemy && card) {
            card.style.setProperty('--enemy-x', `${battlefield.enemyX(enemy, slot) / 3.2}%`);
            const label = card.querySelector('[data-enemy-slot-label]');
            if (label) label.textContent = `ช่อง ${slot + 1}`;
          }
        }
        break;
      case 'attack': {
        changeAnimatedPlayerHp(-event.amount);
        const sourceEnemy = state?.enemies?.find(candidate => candidate.id === event.source);
        const sourceKind = event.sourceKind ?? sourceEnemy?.kind;
        const isSpecialBoss = Boolean(event.specialBoss || sourceKind === 'ember_overlord' || sourceKind === 'tempest_archon');
        const isUltimate = Boolean(event.ultimate || (isSpecialBoss && (event.rawAttack ?? 0) >= 15));
        if (isUltimate) pulseBossUltimateImpact(sourceKind, 'attack', event.source);
        pulsePlayerHud(event.amount > 0 ? 'hit' : 'shield');
        if (isUltimate) {
          const skillName = sourceKind === 'tempest_archon' ? '⚡ จ้าวพายุฟาดอสุนีพิพากษา!' : '💥 จ้าวอัคคีทุบพิพากษาเพลิง!';
          status.textContent = event.amount > 0
            ? `${skillName} เสีย ${event.amount} HP`
            : `${skillName} โล่ต้านไว้ได้ ${event.absorbed}`;
        } else {
          status.textContent = [
            event.absorbed > 0 ? `ป้องกัน ${event.absorbed}` : '',
            event.amount > 0 ? `เสีย ${event.amount} HP` : '',
          ].filter(Boolean).join(' · ') || 'ศัตรูโจมตี 0 ดาเมจ';
        }
        break;
      }
      case 'mirror-reflect':
        changeAnimatedPlayerHp(-event.amount);
        if (event.amount > 0) triggerCameraScreenShake('damage');
        triggerEnemyCardFx(event.source, 'enemy-targeted-pulse');
        pulsePlayerHud(event.amount > 0 ? 'hit' : 'shield');
        status.textContent = event.amount > 0 ? `ม่านกระจกสะท้อน · เสีย ${event.amount} HP` : `โล่รับแรงสะท้อนกระจกได้ ${event.absorbed}`;
        break;
      case 'ember-thorns':
        changeAnimatedPlayerHp(-event.amount);
        triggerCameraScreenShake(event.amount > 0 ? 'boss-heavy' : 'tremor', 'ember_overlord');
        triggerEnemyCardFx(event.source, 'enemy-targeted-pulse');
        pulsePlayerHud(event.amount > 0 ? 'hit' : 'shield');
        status.textContent = event.amount > 0 ? `เกล็ดแมกมาเผา · เสีย ${event.amount} HP` : `โล่กันเกล็ดแมกมาได้ ${event.absorbed}`;
        break;
      case 'storm-static':
        changeAnimatedPlayerHp(-event.amount);
        triggerCameraScreenShake(event.amount > 0 ? 'boss-heavy' : 'tremor', 'tempest_archon');
        triggerEnemyCardFx(event.source, 'enemy-targeted-pulse');
        pulsePlayerHud(event.amount > 0 ? 'hit' : 'shield');
        status.textContent = event.amount > 0 ? `เกราะอสุนีช็อต · เสีย ${event.amount} HP` : `โล่กันเกราะอสุนีได้ ${event.absorbed}`;
        break;
      case 'mana-refund':
        pulsePlayerHud('shield');
        status.textContent = `${RELIC_DRAFT_CATALOG.find(r => r.id === event.relicId)?.name ?? 'คาถา'} · คืนมานา +${event.amount}`;
        break;
      case 'relic': {
        audio.play('discover');
        const dropped = RELIC_DRAFT_CATALOG.find(r => r.id === event.relicId);
        status.textContent = dropped
          ? `${dropped.icon} ดรอปอาติแฟค: ${dropped.name}!`
          : '✦ ได้รับอาติแฟค!';
        break;
      }
      case 'charge': {
        const sourceEnemy = state?.enemies?.find(candidate => candidate.id === event.source);
        const sourceKind = event.sourceKind ?? sourceEnemy?.kind;
        const isSpecialBoss = Boolean(event.specialBoss || sourceKind === 'ember_overlord' || sourceKind === 'tempest_archon');
        if (isSpecialBoss) {
          triggerCameraScreenShake('boss-heavy', sourceKind);
          pulseBossUltimateImpact(sourceKind, 'charge', event.source);
          status.textContent = sourceKind === 'tempest_archon'
            ? '⚡ จ้าวพายุรวมประจุอสุนี · เตรียมฟาดมหาพิพากษา 20 ดาเมจ!'
            : '🔥 จ้าวอัคคีหลอมแก่นเพลิง · เตรียมฟาดมหาประลัย 16 ดาเมจ!';
        } else {
          triggerCameraScreenShake('tremor');
          status.textContent = event.label ?? 'ศัตรูกำลังชาร์จ';
        }
        triggerEnemyCardFx(event.source, 'enemy-acting-lunge');
        break;
      }
      case 'frozen':
        triggerEnemyCardFx(event.source, 'enemy-targeted-pulse');
        status.textContent = 'ศัตรูข้ามการโจมตี';
        break;
      case 'fizzle':
        status.textContent = fizzleLabel(event.cost);
        break;
      case 'fall':
        status.textContent = upperCheckpoint(event.targetFloor)
          ? `พ่ายแพ้ · กลับจุดพักหลังบอส ${checkpointFloor(event.targetFloor)}`
          : event.targetFloor === 19
            ? 'พ่ายแพ้บอสชั้น 20 · ร่วงกลับจุดพักชั้น 19'
            : event.targetFloor === 14
              ? 'พ่ายแพ้ในชั้น 15–18 · ร่วงกลับจุดพักชั้น 14 (เริ่ม 15-1 ใหม่)'
              : event.targetFloor === 'post10'
                ? 'พ่ายแพ้ในชั้น 11–13 · ร่วงกลับจุดพักหลังบอส 10 (เริ่ม 11-1 ใหม่)'
                : event.targetFloor === 9
                  ? 'พ่ายแพ้บอสชั้น 10 · ร่วงกลับจุดพักชั้น 9'
                  : 'พ่ายแพ้ในชั้น 5–8 · ร่วงกลับจุดพักชั้น 4 (เริ่ม 5-1 ใหม่)';
        break;
      case 'room-clear':
        if (event.recovered) changeAnimatedPlayerHp(event.recovered);
        audio.play('win');
        $('tower-heading-title').textContent = `ผ่านด่าน ${event.code}`;
        status.textContent = `ผ่านด่าน ${event.code}${event.recovered ? ` · ฟื้น HP +${event.recovered}` : ''}`;
        $('animation-controls').classList.add('room-cleared');
        $('skip-animation').textContent = 'ไปต่อ';
        break;
    }
  }

  return {
    beginTurnAnimation,
    handleCombatStep,
    pulseBattleCanvasImpact,
  };
}
