import { ENEMIES, FLOOR21_START_ROOM } from './run.js';
import { elementFamily } from './words.js';
import { middleSprites } from './middle-sprites.js';
import { loadSpriteArt, spriteFrame } from './sprite-art.js';

export const PALETTE = ['#10191b', '#172326', '#203033', '#2b3d3c', '#3b4b46', '#536454', '#718063', '#9da77c', '#cbd5a1', '#eff0c4', '#332d2b', '#514036', '#765740', '#a57a50', '#d3aa6b', '#efd19a', '#4d3036', '#7b464c', '#b46c67', '#e29d83', '#3d374e', '#60516f', '#907ba6', '#bca5d2', '#335250', '#53857b', '#8bb7a0', '#b7d9bd', '#7e512e', '#b98745', '#e4b659', '#f5db87'];
const C = PALETTE;
const LARGE_BOSS_KINDS = new Set([
  'boss', 'mirror_mage', 'frost_lich', 'storm_titan', 'arch_codex', 'ember_overlord',
  'prism_watcher', 'astral_sentinel', 'elder_grimoire', 'eclipse_mage', 'glacial_sovereign', 'thunder_colossus', 'nexus_codex', 'tempest_archon',
  'seal_curator', 'crown_archivist',
]);
const arcaneBeamSheets = new Map();
const arcaneBeam = {
  frameWidth: 264, frameHeight: 100, columns: 3, frames: 22,
  startX: 41, endX: 209, centerY: 60,
};
const combatSpriteSheets = {
  iceLance: { file: 'ice-lance.png', width: 176, height: 64, columns: 2, frames: 10, pivotX: 146, pivotY: 32 },
  shieldBlock: { file: 'shield-block.png', width: 148, height: 104, columns: 4, frames: 14, pivotX: 40, pivotY: 88 },
  fireBurst: { file: 'fire-burst.png', width: 144, height: 112, columns: 4, frames: 16, pivotX: 72, pivotY: 84 },
};

export const fizzleLabel = cost => `คาถาสลาย · เสีย ${cost} มานา`;
export const damageLabel = event => event.amount > 0 ? `−${event.actual ?? event.amount} HP` : 'เกราะกันหมด';
export const wardLabel = remaining => remaining > 0 ? 'ติดม่าน · −1 ชั้น' : 'ติดม่าน · ม่านแตก';

function drawCombatSprite(ctx, sheet, progress, x, y, scale) {
  if (!sheet.image?.complete || !sheet.image.naturalWidth) return false;
  const { width, height, columns, frames, pivotX, pivotY } = sheet;
  const index = Math.min(frames - 1, Math.floor(progress * frames));
  ctx.drawImage(sheet.image, (index % columns) * width, Math.floor(index / columns) * height, width, height,
    Math.round(x - pivotX * scale), Math.round(y - pivotY * scale), Math.round(width * scale), Math.round(height * scale));
  return true;
}
const ELEMENT_IMPACT = Object.freeze({
  fire: {
    core: '#fff7d6',
    primary: '#ff7722',
    secondary: '#e63917',
    rim: '#ffad42',
  },
  ice: {
    core: '#f2ffff',
    primary: '#29d6ff',
    secondary: '#0077c2',
    rim: '#a6f4ff',
  },
  lightning: {
    core: '#ffffff',
    primary: '#ffe53b',
    secondary: '#9b5de5',
    rim: '#fff699',
  },
  blast: {
    core: '#fff8db',
    primary: '#ff5719',
    secondary: '#c62828',
    rim: '#ffb74d',
  },
  ward: {
    core: '#f9eeff',
    primary: '#c77dff',
    secondary: '#7b2cbf',
    rim: '#e0aaff',
  },
  akki: { core: '#fff6b7', primary: '#ff5741', secondary: '#a32251', rim: '#ffad69' },
  heman: { core: '#e7f1ff', primary: '#7aa8ff', secondary: '#4a50be', rim: '#9ed8ff' },
  asani: { core: '#fff2ff', primary: '#dba1ff', secondary: '#7934ca', rim: '#ffda98' },
  magma: { core: '#ffed99', primary: '#ff8543', secondary: '#b73e23', rim: '#ffc354' },
  mist: { core: '#f2fff7', primary: '#93dbc6', secondary: '#4e807b', rim: '#c0eade' },
  hail: { core: '#f5fdff', primary: '#b7e9ff', secondary: '#518bcf', rim: '#d0e1ff' },
  thunderstorm: { core: '#fcffee', primary: '#abef79', secondary: '#557b9f', rim: '#eaffaa' },
  storm: { core: '#efffe8', primary: '#a7dcc0', secondary: '#4e807b', rim: '#d2f1cf' },
  blackhole: { core: '#f8e0ff', primary: '#bd75fa', secondary: '#46236b', rim: '#d9b1ff' },
  death: { core: '#fff3fa', primary: '#e679af', secondary: '#672245', rim: '#ffacca' },
  meteor: { core: '#fff6cf', primary: '#ff9a50', secondary: '#aa3824', rim: '#ffd263' },
  veil: { core: '#f2ecff', primary: '#b3b1ff', secondary: '#484893', rim: '#d8d3ff' },
  vayu: { core: '#f3fff3', primary: '#94e7ae', secondary: '#398d82', rim: '#c8f9c0' },
});
const elementColor = Object.fromEntries(Object.entries(ELEMENT_IMPACT).map(([id, palette]) => [id, palette.primary]));
elementColor['akki-blast'] = elementColor.akki;

export class Battlefield {
  constructor(canvas, settings) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false });
    this.settings = settings; this.state = null; this.target = null; this.events = []; this.started = 0; this.duration = 0;
    this.spriteArt = loadSpriteArt();
    this.background = document.createElement('canvas'); this.background.width = 320; this.background.height = 180;
    const backgroundContext = this.background.getContext('2d');
    this.paintRoom(backgroundContext);
    const backdrop = new Image();
    backdrop.onload = () => {
      backgroundContext.imageSmoothingEnabled = false;
      backgroundContext.drawImage(backdrop, 0, 0, this.background.width, this.background.height);
    };
    backdrop.src = new URL('../assets/library-tower.png', import.meta.url).href;
    this.lastFrame = 0;
    this.frame = now => {
      if (!document.hidden && this.canvas.offsetParent !== null && now - this.lastFrame >= (this.events.length ? 25 : this.settings.reducedMotion ? 150 : 33)) { this.draw(now); this.lastFrame = now; }
      this.raf = requestAnimationFrame(this.frame);
    };
    this.raf = requestAnimationFrame(this.frame);
  }
  set(state, target) {
    this.state = state;
    this.target = target;
    if (state && !this.settings.reducedMotion && this.canvas.id === 'battle-canvas') {
      for (const sheet of Object.values(combatSpriteSheets)) {
        sheet.image ??= new Image();
        if (!sheet.image.src) sheet.image.src = new URL(`../assets/pixelfx/${sheet.file}`, import.meta.url).href;
      }
    }
    if (state?.player.words?.includes('beam') && !this.settings.reducedMotion) {
      for (const element of ['fire', 'ice', 'lightning']) {
        if (!state.player.words.includes(element) || arcaneBeamSheets.has(element)) continue;
        const sheet = new Image();
        sheet.src = new URL(`../assets/pixelfx/arcane-beam-${element}.png`, import.meta.url).href;
        arcaneBeamSheets.set(element, sheet);
      }
    }
  }
  animate(combatEvents, onEvent, onComplete = null) {
    const events = [];
    for (let i = 0; i < combatEvents.length; i++) {
      const event = combatEvents[i];
      const next = combatEvents[i + 1];
      if (['projectile', 'chain-lightning', 'magma-erupt'].includes(event.type) && !event.blocked && next?.type === 'damage' && next.target === event.target) {
        events.push({ ...event, damage: next });
        i++;
      } else if (event.type === 'blast') {
        const hits = [];
        // The simulator emits each blast target's damage followed by any statuses.
        const end = i + (event.effectCount ?? 0);
        while (i < end) {
          const effect = combatEvents[++i];
          if (effect.type === 'damage') hits.push({ damage: effect, statuses: [] });
          else hits.at(-1).statuses.push(effect);
        }
        events.push({ ...event, hits });
      } else {
        events.push(event);
      }
    }
    this.onEvent = onEvent;
    this.onComplete = onComplete;
    this.playedIndex = 0;
    this.events = events;
    this.started = performance.now();
    this.duration = 0;
    const lastEvent = events.at(-1);
    const victoryHold = lastEvent?.type === 'room-clear' ? 900 : 0;
    const actionEvents = victoryHold ? events.slice(0, -1) : events;
    const rawEnds = actionEvents.map(event => {
      const action = ['projectile', 'attack', 'mirror-reflect', 'ember-thorns', 'storm-static', 'blast', 'shield', 'fizzle', 'blackhole-open'].includes(event.type)
        || Boolean(event.specialBoss && event.type === 'charge');
      const ultBonus = event.ultimate && event.type === 'attack' ? 180 : 0;
      const wardHold = event.type === 'projectile' && event.blocked ? 160 : 0;
      this.duration += (this.settings.reducedMotion ? (action ? 200 : 110) : (action ? 520 : 260) + wardHold + ultBonus);
      return this.duration;
    });
    const minDuration = this.settings.reducedMotion ? 500 : 1500;
    const maxDuration = this.settings.reducedMotion ? 1200 : 3400;
    if (this.duration > maxDuration && this.duration > 0) {
      const scale = maxDuration / this.duration;
      this.eventEnds = rawEnds.map(end => Math.round(end * scale));
      this.duration = maxDuration;
    } else if (this.duration > 0 && this.duration < minDuration) {
      const scale = minDuration / this.duration;
      this.eventEnds = rawEnds.map(end => Math.round(end * scale));
      this.duration = minDuration;
    } else {
      this.eventEnds = rawEnds;
    }
    if (victoryHold) {
      this.duration += victoryHold;
      this.eventEnds.push(this.duration);
    }
    this.buildSnapshots();
    return this.duration;
  }
  buildSnapshots() {
    const enemies = this.state?.enemies ?? [];
    const basePositions = this.positions();
    const shield = this.state?.player.shield;
    let curProtection = {
      amount: shield?.layers.reduce((sum, hp) => sum + hp, 0) ?? 0,
      layers: shield?.layers.length ?? 0,
      element: shield?.effect,
      layerEffects: shield?.layerEffects?.map(layer => layer.elements),
    };
    const curPositions = [...basePositions];
    const curDead = new Set();
    const curWards = Object.fromEntries(enemies.map(e => [e.id, e.ward]));
    const oldPuddles = new Set(this.state?.magmaPuddles);
    const newPuddles = new Set();
    let oldBlackhole = this.state?.blackhole?.slot;
    let newBlackhole;
    const deathStartMs = {};
    this.snapshots = [];
    this.contacts = [];
    for (let i = 0; i <= this.events.length; i++) {
      this.snapshots.push({
        positions: [...curPositions],
        dead: new Set(curDead),
        protection: curProtection,
        wards: { ...curWards },
        puddles: new Set([...oldPuddles, ...newPuddles]),
        blackholes: new Set([oldBlackhole, newBlackhole].filter(slot => slot !== undefined)),
      });
      const ev = this.events[i];
      if (!ev) break;
      const start = this.eventStart(i);
      const contact = start + this.eventContactDelay(i);
      if ((ev.killed || ev.damage?.killed) && ev.target && deathStartMs[ev.target] === undefined) {
        curDead.add(ev.target);
        deathStartMs[ev.target] = contact;
      }
      if (ev.type === 'push') {
        const idx = enemies.findIndex(enemy => enemy.id === ev.target);
        if (idx >= 0) curPositions[idx] = this.enemyX(enemies[idx], ev.slot);
      }
      if (ev.type === 'swap') {
        const source = enemies.findIndex(enemy => enemy.id === ev.source);
        const target = enemies.findIndex(enemy => enemy.id === ev.target);
        curPositions[source] = this.enemyX(enemies[source], ev.sourceSlot);
        curPositions[target] = this.enemyX(enemies[target], ev.slot);
      }
      if (ev.type === 'magma-puddle') newPuddles.add(ev.slot);
      if (ev.type === 'magma-erupt') oldPuddles.delete(ev.slot);
      if (ev.type === 'blackhole-open') newBlackhole = ev.slot;
      if (ev.type === 'blast' && ev.element === 'blackhole') oldBlackhole = undefined;
      if (ev.type === 'projectile' && ev.blocked && ev.target) {
        curWards[ev.target] = Math.max(0, (curWards[ev.target] ?? 0) - 1);
        ev.wardRemaining = curWards[ev.target];
      }
      this.contacts.push({ event: ev, at: contact, index: i });
      if (ev.type === 'blast') {
        const centerIndex = enemies.findIndex(enemy => enemy.id === ev.target);
        const center = this.blastX(ev, enemies[centerIndex], curPositions[centerIndex] ?? 230);
        const duration = this.eventEnds[i] - start;
        for (const hit of ev.hits) {
          const index = enemies.findIndex(enemy => enemy.id === hit.damage.target);
          hit.x = curPositions[index] ?? center;
          hit.labelLift = index % 2 === 1 ? 14 : 0;
          hit.arrival = this.blastArrival(hit.x, center);
        }
        ev.hits.sort((a, b) => a.arrival - b.arrival);
        for (const { damage, statuses, arrival } of ev.hits) {
          const at = start + duration * arrival;
          this.contacts.push({ event: damage, at, index: i });
          for (const status of statuses) this.contacts.push({ event: status, at, index: i });
          if (damage.killed) {
            curDead.add(damage.target);
            deathStartMs[damage.target] = at;
          }
        }
      }
      if (ev.type === 'dispel') curWards[ev.target] = 0;
      if (ev.type === 'shield') curProtection = ev;
      else if (ev.type === 'brace') curProtection = ev.protection;
      else if (ev.type === 'attack' || ev.type === 'mirror-reflect' || ev.type === 'ember-thorns' || ev.type === 'storm-static') curProtection = ev.protection;
      else if (ev.type === 'blast' && ev.protection) curProtection = ev.protection;
    }
    this.deathStartMs = deathStartMs;
  }
  eventStart(index) {
    return this.eventEnds[index - 1] ?? 0;
  }
  eventContactDelay(index) {
    if (this.settings.reducedMotion) return 0;
    const event = this.events[index];
    const contact = ['projectile', 'mirror-reflect', 'ember-thorns', 'storm-static'].includes(event.type)
      ? 0.65
      : event.type === 'attack' ? 0.62 : 0;
    return (this.eventEnds[index] - this.eventStart(index)) * contact;
  }
  stop() {
    this.events = [];
    this.duration = 0;
    this.onEvent = null;
    this.onComplete = null;
    this.snapshots = null;
    this.contacts = [];
  }
  configure(settings) { this.settings = settings; }
  enemyX(enemy, slot = enemy.slot) {
    if (this.state?.room >= FLOOR21_START_ROOM) return 126 + slot * 41;
    if (LARGE_BOSS_KINDS.has(enemy.kind)) return 235 + slot * 10;
    return this.state?.enemies.length === 1 ? 216 + slot * 17 : 149 + slot * 33;
  }
  positions() {
    return this.state?.enemies.map(enemy => this.enemyX(enemy)) ?? [];
  }
  puddleX(slot) {
    const enemy = this.state.enemies.find(candidate => candidate.slot === slot) ?? this.state.enemies[0];
    return this.enemyX(enemy, slot);
  }
  blastX(event, enemy, targetX) {
    if (event?.target === 'player') return 51;
    if (event?.element === 'blackhole' && event.originSlot !== undefined) return this.puddleX(event.originSlot);
    return enemy && event?.originSlot !== undefined ? this.enemyX(enemy, event.originSlot) : targetX;
  }
  hitTest(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * 320 / rect.width;
    const y = (clientY - rect.top) * 180 / rect.height;
    if (y < 70 || y > 153) return null;
    const positions = this.positions();
    return this.state?.enemies.find((enemy, i) => enemy.hp > 0 && Math.abs(positions[i] - x) < (LARGE_BOSS_KINDS.has(enemy.kind) || ['elite', 'sentinel'].includes(enemy.kind) ? 30 : 23))?.id || null;
  }
  paintRoom(g) {
    const r = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };
    r(0, 0, 320, 180, C[0]);
    for (let row = 0; row < 8; row++) for (let column = 0; column < 12; column++) {
      const x = column * 30 - (row % 2) * 15;
      r(x, row * 16, 28, 14, C[(column * 3 + row) % 5 === 0 ? 2 : 1]);
      r(x + 2, row * 16 + 1, 22, 1, C[2]);
    }
    for (const x of [18, 138, 258]) {
      r(x, 34, 44, 78, C[10]); r(x + 4, 29, 36, 6, C[11]); r(x + 9, 25, 26, 5, C[11]);
      r(x + 4, 36, 36, 72, C[0]);
      for (const shelf of [54, 79, 104]) {
        for (let book = 0; book < 6; book++) {
          const height = 11 + (book * 7 + x + shelf) % 10;
          const color = [C[12], C[21], C[24], C[16], C[5], C[13]][book];
          r(x + 6 + book * 5, shelf - height, 4, height, color);
          r(x + 7 + book * 5, shelf - height + 3, 2, 1, C[14]);
        }
        r(x + 3, shelf, 38, 3, C[12]); r(x + 3, shelf + 3, 38, 1, C[10]);
      }
    }
    r(82, 15, 42, 79, C[3]); r(87, 11, 32, 5, C[3]); r(93, 7, 20, 5, C[3]);
    r(87, 21, 32, 67, C[0]); r(94, 20, 5, 67, C[24]); r(100, 17, 5, 71, C[25]); r(106, 20, 5, 67, C[24]);
    r(88, 44, 30, 3, C[3]); r(88, 66, 30, 3, C[3]);
    r(0, 112, 320, 7, C[3]); r(0, 119, 320, 2, C[0]);
    r(0, 121, 320, 59, C[2]);
    for (let row = 0; row < 4; row++) for (let x = -30; x < 350; x += 40) {
      r(x + (row % 2) * 20, 123 + row * 16, 38, 14, row % 2 ? C[1] : C[2]);
      r(x + 2 + (row % 2) * 20, 123 + row * 16, 33, 1, C[3]);
    }
    for (const x of [76, 156, 307]) {
      r(x, 66, 3, 23, C[11]); r(x - 3, 88, 9, 3, C[12]);
      r(x, 59, 3, 8, C[14]); r(x, 55, 2, 6, C[30]); r(x + 1, 57, 1, 3, C[31]);
    }
    r(15, 146, 72, 2, C[4]); r(21, 141, 60, 1, C[4]); r(21, 153, 60, 1, C[4]);
    for (let i = 0; i < 9; i++) r(22 + i * 7, 146 + (i % 2 ? -4 : 5), 2, 2, C[5]);
    r(309, 10, 2, 28, C[3]); r(301, 16, 8, 2, C[3]); r(301, 18, 2, 5, C[3]);
  }
  sprite(kind, x, baseline, frame, pose = 'idle', hitElement = null, progress = 0) {
    const g = this.ctx;
    const boss = LARGE_BOSS_KINDS.has(kind);
    const originalKind = kind;
    kind = ENEMIES[kind]?.sprite ?? kind;
    const scale = boss ? 2 : 1;
    const bob = this.settings.reducedMotion ? 0 : [0, -1, 0, 1][frame % 4];
    const baseY = baseline - (boss ? 64 : 32) + bob;
    const left = Math.round(x - (boss ? 32 : 16));
    const r = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(left + a * scale, baseY + b * scale, w * scale, h * scale); };
    if (pose === 'dead') {
      const width = Math.max(4, 18 - frame % 4 * 3);
      g.fillStyle = C[4]; g.fillRect(x - width / 2, baseline - 3, width, 3);
      return;
    }
    const art = spriteFrame(originalKind, pose, frame, progress, this.settings.reducedMotion);
    const image = this.spriteArt[originalKind];
    if (art && image?.complete && image.naturalWidth) {
      g.drawImage(image, art.index * art.size, art.row * art.size, art.size, art.size,
        Math.round(x - art.pivot[0]), Math.round(baseline - art.pivot[1]), art.size, art.size);
      return;
    }
    if (kind === 'wizard') {
      r(10, 0, 4, 3, C[7]); r(8, 3, 9, 4, C[6]); r(6, 7, 14, 4, C[5]); r(3, 10, 21, 3, C[7]);
      r(9, 12, 10, 8, C[15]); r(10, 13, 8, 4, C[19]); r(15, 14, 2, 2, C[0]); r(10, 18, 9, 2, C[12]);
      r(8, 20, 13, 10, C[5]); r(6, 26, 18, 4, C[6]); r(10, 22, 3, 7, C[7]);
      r(7, 30, 6, 2, C[0]); r(18, 30, 5, 2, C[0]);
      r(pose === 'cast' ? 19 : 21, pose === 'cast' ? 17 : 22, 6, 4, C[19]);
      r(27, 9, 2, 23, C[13]); r(25, 5, 6, 7, C[25]); r(26, 6, 4, 4, C[27]);
      r(26, 4, 4, 1, C[7]); r(9, 6, 3, 1, C[14]);
    } else if (kind === 'swarm') {
      r(6, 17, 20, 3, C[5]); r(3, 20, 26, 8, C[6]); r(1, 26, 30, 4, C[5]); r(4, 29, 25, 3, C[4]);
      r(7, 20, 6, 3, C[8]); r(9, 24, 3, 3, C[0]); r(21, 24, 3, 3, C[0]); r(15, 28, 4, 1, C[0]);
      r(4, 27, 3, 2, C[7]);
    } else if (kind === 'striker' || kind === 'ember_imp' || kind === 'void_imp') {
      const dark = kind === 'void_imp' ? C[20] : kind === 'ember_imp' ? C[16] : C[17];
      const body = kind === 'void_imp' ? C[21] : kind === 'ember_imp' ? C[19] : C[18];
      const horn = kind === 'void_imp' ? C[23] : kind === 'ember_imp' ? C[30] : C[14];
      r(3, 6, 5, 8, dark); r(24, 6, 5, 8, dark); r(5, 11, 23, 12, body);
      r(9, 8, 14, 6, body); r(8, 14, 5, 4, C[15]); r(20, 14, 5, 4, C[15]);
      r(10, 14, 2, 3, C[0]); r(20, 14, 2, 3, C[0]); r(13, 21, 7, 2, C[16]);
      r(8, 23, 17, 7, kind === 'void_imp' ? C[20] : C[16]); r(10, 30, 5, 2, body); r(21, 30, 5, 2, body);
      r(1, 19, 5, 8, dark); r(27, 19, 4, 8, dark); r(4, 3, 2, 5, horn); r(26, 3, 2, 5, horn);
      if (kind === 'ember_imp') {
        r(13, 2, 6, 4, C[30]); r(15, 0, 2, 3, C[31]);
        r(12, 25, 8, 3, C[30]);
      } else if (kind === 'void_imp') {
        r(13, 2, 6, 4, C[23]); r(15, 0, 2, 3, C[27]);
        r(12, 25, 8, 3, C[22]);
      }
    } else if (['boss', 'arch_codex', 'elder_grimoire', 'nexus_codex'].includes(kind)) {
      const cover = kind === 'nexus_codex' ? C[21] : kind === 'elder_grimoire' ? C[16] : kind === 'arch_codex' ? C[20] : C[12];
      const pageA = ['arch_codex', 'nexus_codex'].includes(kind) ? C[23] : kind === 'elder_grimoire' ? C[15] : C[15];
      const pageB = ['arch_codex', 'nexus_codex'].includes(kind) ? C[22] : kind === 'elder_grimoire' ? C[31] : C[14];
      const trim = kind === 'boss' ? C[11] : C[30];
      r(0, 6, 15, 22, cover); r(17, 6, 15, 22, cover); r(1, 4, 14, 21, pageA); r(17, 4, 14, 21, pageB);
      r(14, 5, 4, 24, trim); r(15, 7, 2, 21, C[31]);
      for (let row = 0; row < 5; row++) { r(3, 7 + row * 3, 8 - row % 2 * 2, 1, C[12]); r(20, 7 + row * 3, 8 - row % 2 * 2, 1, C[12]); }
      r(6, 12, 4, 4, C[16]); r(22, 12, 4, 4, C[16]); r(7, 13, 2, 2, C[30]); r(23, 13, 2, 2, C[30]);
      r(11, 21, 4, 2, C[0]); r(18, 21, 4, 2, C[0]);
      r(4, 27, 2, 5, C[17]); r(25, 26, 2, 6, C[17]); r(9, 2, 4, 2, C[23]);
      if (kind !== 'boss') {
        r(13, 1, 6, 4, C[31]); r(14, 2, 4, 2, kind === 'nexus_codex' ? C[27] : C[26]);
        r(2, 1, 3, 2, C[30]); r(27, 1, 3, 2, C[30]);
      }
    } else if (kind === 'mirror_mage' || kind === 'eclipse_mage') {
      const hover = this.settings.reducedMotion ? 0 : [0, -1, 0, 1][frame % 4];
      const eclipse = kind === 'eclipse_mage';
      r(11, 1, 10, 5, eclipse ? C[20] : C[22]); r(12, 0, 8, 1, eclipse ? C[31] : C[30]); r(15, 0, 2, 3, eclipse ? C[30] : C[27]);
      r(9, 6, 14, 8, eclipse ? C[20] : C[21]); r(11, 7, 10, 4, C[0]);
      r(12, 8, 3, 2, eclipse ? C[31] : C[27]); r(17, 8, 3, 2, eclipse ? C[31] : C[27]);
      r(8, 14, 16, 14, eclipse ? C[0] : C[20]); r(6, 26, 20, 5, C[21]); r(13, 15, 6, 12, eclipse ? C[22] : C[23]);
      r(14, 16, 4, 4, eclipse ? C[30] : C[27]); r(15, 17, 2, 2, C[9]);
      r(1, 9 + hover, 5, 13, eclipse ? C[22] : C[26]); r(2, 11 + hover, 3, 9, eclipse ? C[30] : C[27]); r(3, 13 + hover, 1, 5, C[9]);
      r(26, 9 - hover, 5, 13, eclipse ? C[22] : C[26]); r(27, 11 - hover, 3, 9, eclipse ? C[30] : C[27]); r(28, 13 - hover, 1, 5, C[9]);
      r(2, 7 + hover, 3, 1, C[30]); r(27, 7 - hover, 3, 1, C[30]);
    } else if (kind === 'frost_lich' || kind === 'glacial_sovereign') {
      const sovereign = kind === 'glacial_sovereign';
      r(10, 0, 3, 4, sovereign ? C[31] : C[27]); r(14, 0, 4, 5, C[9]); r(19, 0, 3, 4, sovereign ? C[31] : C[27]);
      r(9, 4, 14, 9, sovereign ? C[25] : C[24]); r(11, 6, 10, 5, C[0]); r(12, 7, 3, 2, C[26]); r(17, 7, 3, 2, C[26]);
      r(7, 13, 18, 16, C[1]); r(9, 14, 14, 13, C[24]); r(13, 15, 6, 10, sovereign ? C[27] : C[26]);
      r(4, 15, 4, 10, C[25]); r(24, 15, 4, 10, C[25]);
      r(27, 4, 2, 27, C[13]); r(25, 1, 6, 5, C[27]); r(26, 2, 4, 3, C[9]);
      if (sovereign) { r(6, 12, 5, 3, C[27]); r(21, 12, 5, 3, C[27]); }
    } else if (kind === 'ember_overlord') {
      const flicker = this.settings.reducedMotion ? 0 : (frame % 2);
      // Flame crown & horns (animated flicker)
      r(7, 1 - flicker, 3, 5 + flicker, C[30]); r(11, 0, 3, 4, C[31]); r(15, 0, 2, 5, C[31]); r(18, 0, 3, 4, C[31]); r(22, 1 - (1 - flicker), 3, 5 + (1 - flicker), C[30]);
      r(4, 3, 3, 6, C[16]); r(25, 3, 3, 6, C[16]);
      // Helm & glowing eyes
      r(9, 5, 14, 8, C[10]); r(10, 6, 12, 3, C[16]); r(11, 8, 10, 4, C[0]);
      r(12, 9, 3, 2, C[31]); r(17, 9, 3, 2, C[31]);
      // Blazing armor & magma core
      r(5, 13, 22, 14, C[16]); r(8, 14, 16, 11, C[10]);
      r(12, 15, 8, 7, C[30]); r(14, 16, 4, 5, flicker ? C[9] : C[31]);
      r(6, 12, 5, 4, C[30]); r(21, 12, 5, 4, C[30]);
      // Flame gauntlets, cape & greaves
      r(1, 14, 5, 10, C[17]); r(2, 15, 3, 6, C[30]);
      r(26, 14, 5, 10, C[17]); r(27, 15, 3, 6, C[30]);
      r(8, 27, 6, 5, C[10]); r(18, 27, 6, 5, C[10]);
      r(10, 28, 2, 3, C[30]); r(20, 28, 2, 3, C[30]);
      // Magma scepter & floating ember sparks
      r(29, 6, 2, 25, C[11]); r(27, 2, 6, 5, C[30]); r(28, 3, 4, 3, C[31]);
      if (!this.settings.reducedMotion) {
        r(0, 7 + (frame % 3), 2, 2, C[30]);
        r(30, 12 - (frame % 3), 2, 2, C[31]);
      }
    } else if (kind === 'tempest_archon') {
      const spark = this.settings.reducedMotion ? 0 : (frame % 2);
      // Storm crown & lightning wings
      r(7, 1 - spark, 3, 5 + spark, C[31]); r(11, 0, 3, 4, C[27]); r(15, 0, 2, 5, C[9]); r(18, 0, 3, 4, C[27]); r(22, 1 - (1 - spark), 3, 5 + (1 - spark), C[31]);
      r(1, 5 + spark, 4, 12, C[22]); r(27, 5 + (1 - spark), 4, 12, C[22]);
      r(2, 7 + spark, 2, 8, C[31]); r(28, 7 + (1 - spark), 2, 8, C[31]);
      // Astral helm & glowing storm visor
      r(9, 5, 14, 8, C[20]); r(10, 6, 12, 3, C[22]); r(11, 8, 10, 4, C[0]);
      r(12, 9, 3, 2, C[31]); r(17, 9, 3, 2, C[31]);
      // Tempest armor & arc reactor core
      r(5, 13, 22, 14, C[20]); r(8, 14, 16, 11, C[21]);
      r(12, 15, 8, 7, C[27]); r(14, 16, 4, 5, spark ? C[9] : C[31]);
      r(6, 12, 5, 4, C[31]); r(21, 12, 5, 4, C[31]);
      // Storm gauntlets, lightning staff & greaves
      r(1, 16, 5, 9, C[21]); r(2, 17, 3, 5, C[31]);
      r(26, 16, 5, 9, C[21]); r(27, 17, 3, 5, C[31]);
      r(8, 27, 6, 5, C[20]); r(18, 27, 6, 5, C[20]);
      r(10, 28, 2, 3, C[31]); r(20, 28, 2, 3, C[31]);
      r(29, 4, 2, 27, C[22]); r(27, 1, 6, 5, C[31]); r(28, 2, 4, 3, C[9]);
      if (!this.settings.reducedMotion) {
        r(0, 10 + (frame % 3), 2, 2, C[27]);
        r(30, 14 - (frame % 3), 2, 2, C[31]);
      }
    } else if (kind === 'support' || kind === 'chrono_sage') {
      const cap = kind === 'chrono_sage' ? C[22] : C[25];
      const trim = kind === 'chrono_sage' ? C[31] : C[27];
      r(8, 1, 16, 4, cap); r(4, 5, 24, 5, cap); r(1, 10, 30, 7, kind === 'chrono_sage' ? C[20] : C[24]);
      r(7, 6, 4, 3, trim); r(20, 9, 5, 3, trim); r(11, 2, 4, 2, trim);
      r(11, 17, 11, 8, C[15]); r(12, 19, 2, 2, C[0]); r(19, 19, 2, 2, C[0]);
      r(9, 25, 15, 5, cap); r(7, 30, 7, 2, C[12]); r(20, 30, 7, 2, C[12]);
      r(25, 21, 3, 11, C[12]); r(24, 19, 6, 4, trim);
    } else if (Object.hasOwn(middleSprites, kind)) {
      middleSprites[kind](r, C, pose, this.settings.reducedMotion ? 0 : frame);
    } else if (['charger', 'sentinel', 'rune_golem', 'storm_titan', 'obsidian_golem', 'astral_sentinel', 'thunder_colossus'].includes(kind)) {
      const shell = ['storm_titan', 'thunder_colossus'].includes(kind) ? C[10] : kind === 'obsidian_golem' ? C[1] : kind === 'astral_sentinel' ? C[20] : kind === 'rune_golem' ? C[11] : C[12];
      const body = ['storm_titan', 'thunder_colossus'].includes(kind) ? C[28] : kind === 'obsidian_golem' ? C[3] : kind === 'astral_sentinel' ? C[21] : C[13];
      const trim = ['storm_titan', 'astral_sentinel', 'thunder_colossus'].includes(kind) ? C[30] : kind === 'obsidian_golem' ? C[26] : C[14];
      const core = ['rune_golem', 'storm_titan', 'obsidian_golem', 'thunder_colossus'].includes(kind) ? C[26] : kind === 'astral_sentinel' ? C[31] : C[29];
      r(7, 4, 18, 5, shell); r(4, 9, 24, 19, body); r(7, 7, 18, 4, trim);
      r(9, 13, 14, 12, C[10]); r(12, 14, 8, 9, core); r(14, 16, 4, 6, C[31]);
      r(0, 13, 5, 13, shell); r(27, 13, 5, 13, shell); r(5, 28, 8, 4, C[11]); r(20, 28, 8, 4, C[11]);
      r(10, 1, 12, 3, shell); r(12, 4, 2, 3, C[0]); r(19, 4, 2, 3, C[0]);
      if (['storm_titan', 'thunder_colossus', 'astral_sentinel'].includes(kind)) {
        r(2, 6, 3, 6, C[31]); r(27, 6, 3, 6, C[31]);
      }
    } else {
      const robe = ['armored', 'iron_warden', 'aether_warden'].includes(kind) ? (kind === 'aether_warden' ? C[24] : C[5]) : ['elite', 'prism_watcher'].includes(kind) ? C[21] : C[20];
      r(9, 2, 14, 13, robe); r(7, 4, 18, 8, C[4]); r(9, 7, 14, 3, C[0]); r(11, 8, 3, 1, C[30]); r(19, 8, 3, 1, C[30]);
      r(8, 15, 17, 15, robe); r(5, 28, 23, 4, robe); r(14, 15, 4, 14, ['armored', 'iron_warden', 'aether_warden'].includes(kind) ? C[7] : C[22]);
      r(4, 17, 5, 11, C[4]); r(25, 17, 4, 10, C[4]);
      if (kind !== 'armored') { r(27, 7, 2, 25, C[13]); r(25, 5, 6, 6, C[22]); r(27, 6, 2, 3, C[23]); }
      if (['armored', 'iron_warden', 'aether_warden'].includes(kind)) { r(1, 17, 8, 13, C[6]); r(3, 20, 4, 7, C[7]); r(27, 12, 2, 18, C[8]); }
      if (['elite', 'prism_watcher'].includes(kind)) { r(10, 0, 3, 4, kind === 'prism_watcher' ? C[27] : C[14]); r(15, 0, 3, 4, kind === 'prism_watcher' ? C[9] : C[14]); r(20, 0, 3, 4, kind === 'prism_watcher' ? C[27] : C[14]); }
      if (['iron_warden', 'aether_warden'].includes(kind)) { r(11, 1, 10, 2, kind === 'aether_warden' ? C[27] : C[23]); }
    }
    if (pose === 'hurt' && !this.settings.reducedMotion) {
      const pal = ELEMENT_IMPACT[hitElement] ?? ELEMENT_IMPACT.fire;
      g.save();
      g.globalAlpha = frame % 2 === 0 ? 0.68 : 0.42;
      g.fillStyle = frame % 2 === 0 ? pal.primary : pal.core;
      g.fillRect(left + 2 * scale, baseY + 4 * scale, 28 * scale, 25 * scale);
      g.globalAlpha = 0.85;
      g.fillStyle = pal.core;
      g.fillRect(left + 6 * scale, baseY + 9 * scale, 20 * scale, 14 * scale);
      g.restore();
    }
  }

  pixelCircle(cx, cy, radius, color, filled = false) {
    const g = this.ctx;
    const r = Math.max(1, Math.round(radius));
    const r2 = r * r;
    const inner2 = (r - 1.35) * (r - 1.35);
    g.fillStyle = color;
    for (let dy = -r; dy <= r; dy++) {
      const dy2 = dy * dy;
      const maxDx = Math.floor(Math.sqrt(Math.max(0, r2 - dy2)));
      if (filled) {
        g.fillRect(Math.round(cx - maxDx), Math.round(cy + dy), maxDx * 2 + 1, 1);
      } else {
        const minDx = dy2 < inner2 ? Math.ceil(Math.sqrt(inner2 - dy2)) : 0;
        const span = Math.max(1, maxDx - minDx + 1);
        g.fillRect(Math.round(cx - maxDx), Math.round(cy + dy), span, 1);
        if (maxDx > 0) g.fillRect(Math.round(cx + minDx), Math.round(cy + dy), span, 1);
      }
    }
  }

  pixelEllipse(cx, cy, rx, ry, color, filled = false) {
    const g = this.ctx;
    const a = Math.max(1, Math.round(rx));
    const b = Math.max(1, Math.round(ry));
    g.fillStyle = color;
    for (let dy = -b; dy <= b; dy++) {
      const normY = dy / b;
      const maxDx = Math.round(a * Math.sqrt(Math.max(0, 1 - normY * normY)));
      if (filled) {
        g.fillRect(Math.round(cx - maxDx), Math.round(cy + dy), maxDx * 2 + 1, 1);
      } else {
        g.fillRect(Math.round(cx - maxDx), Math.round(cy + dy), 2, 1);
        g.fillRect(Math.round(cx + maxDx - 1), Math.round(cy + dy), 2, 1);
      }
    }
  }

  pixelDiamond(cx, cy, size, outerColor, coreColor = C[9]) {
    const g = this.ctx;
    const s = Math.max(1, Math.round(size));
    const x = Math.round(cx);
    const y = Math.round(cy);
    g.fillStyle = outerColor;
    for (let dy = -s; dy <= s; dy++) {
      const span = s - Math.abs(dy);
      g.fillRect(x - span, y + dy, span * 2 + 1, 1);
    }
    if (s >= 2) {
      g.fillStyle = coreColor;
      g.fillRect(x - 1, y, 3, 1);
      g.fillRect(x, y - 1, 1, 3);
    }
  }

  pixelBolt(x1, y1, x2, y2, seed, auraColor, coreColor = C[9]) {
    const g = this.ctx;
    const steps = Math.max(4, Math.floor(Math.hypot(x2 - x1, y2 - y1) / 8));
    let px = x1;
    let py = y1;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const jitter = i === steps ? 0 : Math.sin(seed * 3.7 + i * 2.3) * 6;
      const nx = Math.round(x1 + (x2 - x1) * t);
      const ny = Math.round(y1 + (y2 - y1) * t + jitter);
      const segSteps = Math.max(1, Math.abs(nx - px), Math.abs(ny - py));
      for (let s = 0; s <= segSteps; s++) {
        const lx = Math.round(px + (nx - px) * (s / segSteps));
        const ly = Math.round(py + (ny - py) * (s / segSteps));
        g.fillStyle = auraColor;
        g.fillRect(lx - 1, ly - 1, 3, 3);
        g.fillStyle = coreColor;
        g.fillRect(lx, ly, 1, 1);
      }
      if (i % 2 === 1 && i < steps) {
        const bx = nx + (i % 4 === 1 ? 5 : -4);
        const by = ny + (i % 4 === 1 ? -5 : 5);
        g.fillStyle = auraColor;
        g.fillRect(Math.round((nx + bx) / 2), Math.round((ny + by) / 2), 2, 2);
        g.fillRect(bx, by, 1, 1);
      }
      px = nx;
      py = ny;
    }
  }

  drawMagmaPuddle(x) {
    const g = this.ctx;
    g.fillStyle = ELEMENT_IMPACT.magma.secondary;
    g.fillRect(x - 10, 151, 20, 4);
    g.fillRect(x - 7, 149, 14, 2);
    g.fillStyle = ELEMENT_IMPACT.magma.primary;
    g.fillRect(x - 6, 151, 13, 2);
    g.fillStyle = ELEMENT_IMPACT.magma.core;
    g.fillRect(x - 3, 151, 4, 1);
    g.fillRect(x + 4, 152, 2, 1);
  }

  drawGravityWell(x, scale) {
    const width = Math.round(16 * scale);
    const height = Math.round(7 * scale);
    this.pixelEllipse(x, 147, width + 5, height + 3, ELEMENT_IMPACT.blackhole.secondary, false);
    this.pixelEllipse(x, 147, width, height, ELEMENT_IMPACT.blackhole.primary, true);
    this.pixelEllipse(x, 147, Math.max(1, width - 3), Math.max(1, height - 2), C[0], true);
  }

  drawCasterAura(now, color, fraction = 0.5) {
    const g = this.ctx;
    const pulse = Math.sin(now / 90) * 2;
    this.pixelEllipse(51, 146, Math.round(17 + pulse), 4, color, false);
    this.pixelEllipse(51, 146, Math.round(11 - pulse * 0.5), 2, C[9], false);
    for (let i = 0; i < 6; i++) {
      const ang = now / 180 + (i * Math.PI) / 3;
      const rx = Math.round(51 + Math.cos(ang) * 16);
      const ry = Math.round(145 + Math.sin(ang) * 3 - ((now / 35 + i * 7) % 14));
      g.fillStyle = i % 2 ? C[9] : color;
      g.fillRect(rx, ry, 2, 2);
    }
    const orbX = 77;
    const orbY = 118;
    const orbR = Math.round(3 + Math.sin(fraction * Math.PI) * 3);
    this.pixelDiamond(orbX, orbY, orbR, color, C[9]);
  }

  draw(now) {
    const g = this.ctx;
    g.imageSmoothingEnabled = false;
    const elapsed = Math.max(0, now - this.started);
    const hadEvents = this.events.length > 0;
    const playing = hadEvents && elapsed < this.duration;
    const eventIndex = playing ? this.eventEnds.findIndex(end => end > elapsed) : -1;
    const eventStart = playing ? this.eventStart(eventIndex) : 0;
    const segment = (this.eventEnds?.[eventIndex] ?? 1) - eventStart;
    const event = playing ? this.events[eventIndex] : null;
    const localTime = elapsed - eventStart;
    const contactDelay = event ? this.eventContactDelay(eventIndex) : 0;
    const impact = playing && localTime >= contactDelay;
    const hitStop = !this.settings.reducedMotion && impact && event?.type === 'attack' && event.isBoss && event.heavy
      ? Math.min(event.ultimate ? 70 : 50, (segment - contactDelay) / 2)
      : 0;
    const held = hitStop > 0 && localTime < contactDelay + hitStop;
    const animationTime = hitStop
      ? contactDelay + Math.max(0, localTime - contactDelay - hitStop) * (segment - contactDelay) / (segment - contactDelay - hitStop)
      : localTime;
    const progress = playing ? Math.max(0, Math.min(1, animationTime / segment)) : 0;
    const frame = Math.floor((held ? this.started + eventStart + contactDelay : now) / 180) % 4;

    let shakeX = 0;
    let shakeY = 0;
    if (!this.settings.reducedMotion && event) {
      let mag = 0;
      if (impact && event.type === 'attack' && event.isBoss && event.heavy) mag = event.ultimate ? 5 : 2;
      if (mag > 0) {
        const sinceHit = localTime - contactDelay;
        const decay = (1 - Math.min(1, sinceHit / 180)) ** 2;
        shakeX = Math.round(Math.cos(sinceHit * 0.052) * mag * decay);
        shakeY = Math.round(Math.sin(sinceHit * 0.048) * mag * decay * 0.45);
      }
    }

    g.save();
    if (shakeX || shakeY) g.translate(shakeX, shakeY);
    g.drawImage(this.background, 0, 0);

    if (!this.settings.reducedMotion && event?.type === 'attack' && event.ultimate && progress >= 0.58 && progress <= 0.88) {
      const strobe = Math.sin((progress - 0.58) * Math.PI * 3.4);
      if (strobe > 0) {
        g.save();
        g.globalAlpha = 0.16 * strobe;
        g.fillStyle = event.sourceKind === 'tempest_archon' ? C[31] : C[16];
        g.fillRect(-10, -10, 340, 200);
        g.globalAlpha = 0.26 * strobe;
        g.fillStyle = event.sourceKind === 'tempest_archon' ? C[9] : C[30];
        g.fillRect(-10, 144, 340, 6);
        g.restore();
      }
    }

    const snap = playing && this.snapshots?.[eventIndex] ? this.snapshots[eventIndex] : null;
    const dead = snap ? snap.dead : null;
    const positions = snap ? snap.positions : this.positions();
    const eventTargetIndex = this.state?.enemies.findIndex(enemy => enemy.id === (event?.target || event?.source));
    const eventX = positions[eventTargetIndex] ?? 230;
    const blastX = this.blastX(event, this.state?.enemies[eventTargetIndex], eventX);
    for (const slot of snap?.puddles ?? this.state?.magmaPuddles ?? []) {
      this.drawMagmaPuddle(this.puddleX(slot));
    }
    const blackholes = snap?.blackholes ?? (this.state?.blackhole ? [this.state.blackhole.slot] : []);
    for (const slot of blackholes) this.drawGravityWell(this.puddleX(slot), 1);
    if (event?.type === 'blackhole-open') this.drawGravityWell(this.puddleX(event.slot), this.settings.reducedMotion ? 1 : Math.max(0.25, progress));
    if (!playing && this.target?.startsWith('slot-')) {
      this.pixelEllipse(this.puddleX(Number(this.target.at(-1))), 150, 15, 4, elementColor.blackhole, false);
    }

    const isCastingEvent = ['projectile', 'shield', 'heal', 'blast', 'fizzle'].includes(event?.type);
    const playerPose = isCastingEvent ? 'cast' : event?.type === 'attack' && impact && event.amount > 0 ? 'hurt' : this.state?.player.hp === 0 ? 'dead' : 'idle';
    g.fillStyle = C[0]; g.fillRect(38, 146, 27, 3);
    if (isCastingEvent && event.type !== 'fizzle' && !this.settings.reducedMotion) {
      const castColor = elementColor[event?.element] ?? (event?.type === 'heal' ? C[26] : event?.type === 'shield' ? C[27] : C[31]);
      this.drawCasterAura(now, castColor, progress);
    }
    this.sprite('wizard', 51 + (playerPose === 'hurt' && !this.settings.reducedMotion && frame % 2 ? -2 : 0), 147, frame, playerPose, null, progress);

    const shield = this.state?.player.shield;
    let protection = snap ? snap.protection : {
      amount: shield?.layers.reduce((sum, hp) => sum + hp, 0) ?? 0,
      layers: shield?.layers.length ?? 0,
      element: shield?.effect,
      layerEffects: shield?.layerEffects?.map(layer => layer.elements),
    };
    if (event?.type === 'shield') protection = event;
    if (event?.type === 'brace') protection = event.protection;
    if (event?.type === 'blast' && event.protection) protection = event.protection;
    const shieldHit = impact && event?.absorbed > 0;
    const shieldCasting = event?.type === 'shield';
    if (protection.amount || shieldHit) {
      const [front, back] = protection.layerEffects ?? [];
      const primaryElem = front?.[0] ?? protection.element;
      const secondaryElem = back?.[0] ?? front?.[1] ?? protection.element;
      if (protection.layers === 2 || front?.[1]) {
        this.barrier(51, 99, 48, elementColor[secondaryElem] ?? C[26], false, secondaryElem, now, shieldCasting ? progress : 1, true);
      }
      const shieldBroke = shieldHit && protection.layers > (event.protection?.layers ?? 0);
      const shieldImpact = shieldHit && protection.layers > 0 && event.type === 'attack' && !this.settings.reducedMotion
        && drawCombatSprite(g, combatSpriteSheets.shieldBlock, Math.max(0, (progress - 0.62) / 0.38) * (shieldBroke ? 1 : 0.40), 51, 146, 0.76);
      if (!shieldImpact || !shieldBroke) {
        this.barrier(51, 103, 42, elementColor[primaryElem] ?? C[27], shieldHit && !shieldImpact && !this.settings.reducedMotion, primaryElem, now, shieldCasting && !this.settings.reducedMotion ? progress : 1, false);
      }
      const shieldName = protection.element === 'veil' ? 'ม่าน' : 'โล่';
      this.barrierLabel(51, 79, shieldHit ? `กัน ${event.absorbed}${shieldBroke ? ` · ${shieldName}แตก` : ''}` : `${shieldName} ${protection.amount}`, shieldHit ? C[9] : C[8]);
    }

    if (this.state) this.state.enemies.forEach((enemy, index) => {
      const x = positions[index];
      let moveSlot;
      if (event?.type === 'swap' && event.source === enemy.id) moveSlot = event.sourceSlot;
      else if (['swap', 'push'].includes(event?.type) && event.target === enemy.id) moveSlot = event.slot;
      const movingX = moveSlot === undefined ? x : Math.round(x + (this.enemyX(enemy, moveSlot) - x) * (this.settings.reducedMotion ? 1 : progress));
      const blastHit = event?.type === 'blast' ? event.hits.find(hit => hit.damage.target === enemy.id) : null;
      const blastLanded = blastHit && (this.settings.reducedMotion || progress >= blastHit.arrival);
      const landed = blastLanded ? blastHit.damage : impact && event?.target === enemy.id ? event.damage : null;
      const gone = enemy.hp <= 0 || Boolean(dead?.has(enemy.id)) || Boolean(landed?.killed);
      g.fillStyle = C[0]; g.fillRect(x - 14, 146, 28, 3);
      const hurt = (event?.type === 'damage' && event.target === enemy.id && event.amount > 0)
        || Boolean(landed?.amount)
        || (event?.type === 'status' && event.target === enemy.id);
      const hurtElement = event?.type === 'blast'
        ? 'blast'
        : event?.type === 'status'
          ? (event.status === 'burn' ? 'fire' : 'ice')
          : (event?.element ?? 'fire');
      const attacking = event?.type === 'attack' && event.source === enemy.id;
      const charging = event?.type === 'charge' && event.source === enemy.id;
      const lunge = attacking && !this.settings.reducedMotion ? [0, -6, -14, -4][Math.min(3, Math.floor(progress * 4))] : 0;
      const deathStart = this.deathStartMs?.[enemy.id];
      const deathFrame = playing && deathStart !== undefined ? Math.max(0, Math.min(3, Math.floor((elapsed - deathStart) / 260 * 4))) : 3;

      if (!gone && this.target === enemy.id) {
        this.pixelEllipse(x, 147, LARGE_BOSS_KINDS.has(enemy.kind) || ['elite', 'sentinel'].includes(enemy.kind) ? 22 : 15, 3, C[30], false);
        g.fillStyle = C[9];
        g.fillRect(x - 6, 153, 12, 1); g.fillRect(x - 3, 155, 6, 1);
      }

      const ward = snap ? (snap.wards[enemy.id] ?? enemy.ward) : enemy.ward;
      const wardBroke = enemy.kind === 'elite' && event?.type === 'projectile' && event.target === enemy.id
        && event.blocked && event.wardRemaining === 0 && impact;
      const artProgress = wardBroke && !this.settings.reducedMotion ? Math.max(0, (progress - 0.65) / 0.35) : progress;
      const supporting = enemy.kind === 'support' && event?.type === 'heal' && event.source === enemy.id;
      const pose = gone ? 'dead' : wardBroke ? 'break' : attacking || supporting ? 'attack'
        : enemy.kind === 'prism_crab' ? (enemy.armor <= 1 ? 'exposed' : 'idle')
        : hurt ? 'hurt' : ['charger', 'sentinel', 'rune_golem', 'storm_titan'].includes(enemy.kind) && charging ? 'charge'
        : ['charger', 'sentinel', 'rune_golem', 'storm_titan'].includes(enemy.kind) && this.state.turn % 2 === 0 ? 'ready'
        : enemy.kind === 'elite' && ward > 0 ? 'ward' : 'idle';
      const spriteX = movingX + lunge + (hurt && frame % 2 && !this.settings.reducedMotion ? 3 : 0);
      if (attacking && lunge < -4 && !this.settings.reducedMotion) {
        g.save();
        g.globalAlpha = 0.28;
        this.sprite(enemy.kind, x + Math.round(lunge * 0.45), 146, frame, 'attack', null, progress);
        g.restore();
      }

      this.sprite(enemy.kind, spriteX, 146, gone ? deathFrame : frame, pose, hurt ? hurtElement : null, artProgress);

      if ((enemy.hp > 0 && !dead?.has(enemy.id)) && ward > 0) {
        const isLargeBoss = LARGE_BOSS_KINDS.has(enemy.kind);
        const bossArt = enemy.kind === 'elite' && this.spriteArt.elite?.complete && this.spriteArt.elite.naturalWidth
          ? spriteFrame('elite', pose, frame, artProgress, this.settings.reducedMotion) : null;
        const wardX = bossArt ? Math.round(spriteX - bossArt.pivot[0] + bossArt.wardCenter[0]) : x;
        const top = bossArt ? Math.round(146 - bossArt.pivot[1] + bossArt.wardCenter[1] - 30) : isLargeBoss ? 74 : 103;
        const contact = event?.type === 'projectile' && event.target === enemy.id && impact;
        const blocked = contact && event.blocked;
        const width = bossArt ? 50 : isLargeBoss ? 58 : 42;
        if (!blocked || ward > 1) {
          this.barrier(wardX, top, width, '#d6a2ff', false, 'ward', now, 1, false);
        }
        if (blocked) {
          if (!this.settings.reducedMotion) this.drawWardImpact(wardX, top, width, ward === 1, (progress - 0.65) / 0.35);
          this.barrierLabel(wardX, top - 6, wardLabel(event.wardRemaining), '#d6a2ff');
        } else if (contact && event.form === 'beam') {
          this.barrierLabel(wardX, top - 6, 'ทะลุม่าน', '#d6a2ff');
        }
      }

      if (!gone && enemy.chill) {
        for (let i = 0; i < 3; i++) {
          const sx = x - 12 + i * 12;
          const sy = 138 - ((Math.floor(now / 150) + i * 3) % 10);
          this.pixelDiamond(sx, sy, 2, C[27], C[9]);
        }
      }
      if (!gone && enemy.freeze) {
        g.save();
        g.globalAlpha = 0.35;
        g.fillStyle = C[27];
        g.fillRect(x - 13, 118, 26, 28);
        g.fillRect(x - 10, 112, 20, 6);
        g.fillRect(x - 6, 108, 12, 4);
        g.globalAlpha = 0.85;
        g.fillStyle = C[9];
        g.fillRect(x - 13, 118, 2, 28); g.fillRect(x + 11, 118, 2, 28);
        g.fillRect(x - 10, 112, 20, 2); g.fillRect(x - 6, 108, 12, 2);
        this.pixelDiamond(x - 6, 122, 2, C[9], C[27]);
        this.pixelDiamond(x + 6, 132, 2, C[9], C[27]);
        g.restore();
      }
      if (!gone && enemy.burn) {
        for (let i = 0; i < 4; i++) {
          const fx = x - 10 + i * 7;
          const fh = 5 + ((frame + i) % 3) * 3;
          g.fillStyle = C[19]; g.fillRect(fx - 1, 146 - fh, 4, fh);
          g.fillStyle = C[30]; g.fillRect(fx, 146 - fh + 1, 2, fh - 1);
          g.fillStyle = C[31]; g.fillRect(fx, 144 - fh - ((frame + i) % 4), 2, 2);
        }
      }
      if (!gone && charging) {
        if (event?.specialBoss) {
          const isStorm = enemy.kind === 'tempest_archon';
          const primaryC = isStorm ? C[31] : C[16];
          const secondaryC = isStorm ? C[27] : C[19];
          const coreC = isStorm ? C[9] : C[30];
          this.pixelEllipse(x, 146, Math.round(28 + Math.sin(progress * Math.PI) * 10), 6, secondaryC, false);
          this.pixelEllipse(x, 146, 20, 4, primaryC, false);
          if (isStorm) {
            this.pixelBolt(x + Math.round(Math.sin(now / 40) * 8), 8, x, 114, now * 0.07, primaryC, coreC);
            this.pixelBolt(x - 16, 18, x - 6, 136, now * 0.05 + 2, C[22], coreC);
            this.pixelBolt(x + 16, 18, x + 6, 136, now * 0.05 + 5, C[22], coreC);
          } else {
            const pillarH = Math.round(28 + Math.sin(progress * Math.PI) * 34);
            g.save();
            g.globalAlpha = 0.55;
            g.fillStyle = secondaryC;
            g.fillRect(x - 22, 146 - pillarH, 44, pillarH);
            g.fillStyle = primaryC;
            g.fillRect(x - 14, 142 - pillarH, 28, pillarH);
            g.fillStyle = coreC;
            g.fillRect(x - 6, 138 - pillarH, 12, pillarH);
            g.restore();
          }
          for (let i = 0; i < 12; i++) {
            const ang = now / 95 + i * (Math.PI / 6);
            const dist = Math.round((1 - progress) * 34 + 6);
            const cx = Math.round(x + Math.cos(ang) * dist);
            const cy = Math.round(120 + Math.sin(ang) * (dist * 0.65));
            this.pixelDiamond(cx, cy, i % 2 === 0 ? 3 : 2, primaryC, coreC);
          }
        } else {
          this.pixelEllipse(x, 146, 18, 4, C[30], false);
          for (let i = 0; i < 6; i++) {
            const ang = now / 120 + i * 1.05;
            const dist = Math.round((1 - progress) * 20 + 4);
            const cx = Math.round(x + Math.cos(ang) * dist);
            const cy = Math.round(128 + Math.sin(ang) * (dist * 0.6));
            this.pixelDiamond(cx, cy, 2, C[30], C[31]);
          }
        }
      }
    });

    if (!this.settings.reducedMotion) {
      for (let i = 0; i < 10; i++) {
        const x = Math.round((i * 37 + now / (170 + i * 25)) % 320);
        const y = 18 + (i * 29) % 115;
        g.fillStyle = i % 3 === 0 ? C[8] : i % 2 ? C[5] : C[4];
        g.fillRect(x, y, 1, 1);
      }
    }

    if (event) {
      const fraction = this.settings.reducedMotion ? 1 : progress;
      const x = eventX;
      if (event.type === 'dispel' || event.type === 'seal' || event.type === 'ward-grant') {
        const targetIndex = this.state.enemies.findIndex(enemy => enemy.id === event.target);
        const targetX = positions[targetIndex] ?? x;
        const label = event.type === 'dispel' ? `สลายม่าน ${event.amount} ชั้น` : event.type === 'seal' ? 'ติดผนึก' : 'ม่านเทิร์นหน้า';
        this.barrierLabel(targetX, 94, label, '#d6a2ff');
      }
      if (event.type === 'projectile') {
        const travel = Math.min(1, fraction / 0.65);
        const startX = 76;
        const startY = 120;
        const px = Math.round(startX + (x - startX) * travel);
        const arcLift = event.form === 'shot' ? Math.sin(travel * Math.PI) * 16 : 0;
        const py = Math.round(startY - arcLift);
        const color = elementColor[event.element] ?? C[30];
        const secondColor = event.elements?.[1] ? (elementColor[event.elements[1]] ?? C[31]) : C[9];

        if (event.form === 'beam') {
          this.drawBeamVfx(startX, startY, px, event.element, secondColor, Boolean(event.elements?.[1]), fraction, now);
        } else if (event.form === 'wave') {
          this.drawWaveVfx(startX, x, color, secondColor, Boolean(event.elements?.[1]), travel);
        } else if (event.form === 'storm') {
          this.drawStormVfx(x, event.element, fraction, event.elements?.[1]);
        } else {
          this.drawShotVfx(startX, startY, x, px, py, travel, fraction, event, secondColor, now);
        }
        if (impact && event.damage) {
          const sinceHit = this.settings.reducedMotion ? 0 : Math.max(0, (fraction - 0.65) / 0.35);
          if (event.form === 'wave' && event.damage.amount > 0 && !this.settings.reducedMotion) {
            this.drawHitBurstVfx(x, 126, color, sinceHit, event.element, now);
          }
          this.drawDamagePopup(x, sinceHit, event.damage, color);
        }
      }

      if (event.type === 'chain-lightning' && event.damage) {
        const sourceIndex = this.state.enemies.findIndex(enemy => enemy.id === event.source);
        const palette = ELEMENT_IMPACT[event.element] ?? ELEMENT_IMPACT.asani;
        if (!this.settings.reducedMotion) {
          this.pixelBolt(positions[sourceIndex], 120, x, 120, now * 0.04, palette.primary, palette.core);
        }
        this.drawDamagePopup(x, this.settings.reducedMotion ? 0 : fraction, event.damage, palette.primary);
      }

      if (event.type === 'magma-puddle' || event.type === 'magma-erupt') {
        const center = this.puddleX(event.slot);
        this.drawMagmaPuddle(center);
        if (event.type === 'magma-erupt' && !this.settings.reducedMotion) {
          this.drawElementalImpactFlash(center, 143 - Math.round(Math.sin(fraction * Math.PI) * 15), 'magma', fraction);
        }
        if (event.damage) this.drawDamagePopup(center, this.settings.reducedMotion ? 0 : fraction, event.damage, elementColor.magma);
      }

      if (event.type === 'blast') {
        const center = blastX;
        const elem = event.element ?? 'blast';
        if (elem === 'meteor' && !this.settings.reducedMotion && fraction < 0.34) {
          const descent = fraction / 0.34;
          const y = Math.round(27 + 102 * descent);
          g.fillStyle = ELEMENT_IMPACT.meteor.secondary;
          g.fillRect(center + 4, y - 21, 7, 25);
          g.fillStyle = ELEMENT_IMPACT.meteor.primary;
          g.fillRect(center - 6, y, 13, 9);
          g.fillStyle = ELEMENT_IMPACT.meteor.core;
          g.fillRect(center - 3, y + 3, 6, 5);
        } else if (elem === 'fire' && !event.devastation && !event.radius) {
          this.drawFireBurst(center, fraction, event.targets, positions);
        } else {
          if (!this.settings.reducedMotion) this.drawElementalImpactFlash(center, 126, elem, fraction);
          const scale = (event.devastation || event.radius === 2 ? 1.6 : 1) * (event.scale === 0.6 ? 0.8 : 1);
          this.drawExplosionVfx(center, 126, fraction, event.targets, positions, elem, scale, event.elements?.[1]);
        }
        for (const { damage, arrival, x: hitX, labelLift } of event.hits) {
          if (fraction < arrival) continue;
          const sinceHit = this.settings.reducedMotion ? 0 : (fraction - arrival) / (1 - arrival);
          this.drawDamagePopup(hitX, sinceHit, damage, elementColor[elem] ?? ELEMENT_IMPACT.blast.primary, labelLift);
        }
      }

      if (event.type === 'damage') {
        const elem = event.element ?? 'fire';
        const color = elementColor[elem] ?? ELEMENT_IMPACT.fire.primary;
        if (event.amount > 0 && !this.settings.reducedMotion) {
          this.drawElementalImpactFlash(x, 124, elem, fraction);
          this.drawHitBurstVfx(x, 124, color, fraction, elem, now);
        }
        this.drawDamagePopup(x, this.settings.reducedMotion ? 0 : fraction, event, color);
      }

      if (event.type === 'heal') {
        const px = event.target === 'player' ? 51 : x;
        this.drawHealVfx(px, 146, fraction, now);
        this.drawFloatingPopup(px, 96 - Math.round(fraction * 12), `+${event.amount} HP`, C[9], C[26]);
      }

      if (event.type === 'attack') {
        this.drawEnemyAttackVfx(x, 51, fraction, impact, event, now);
        if (impact) {
          if (event.ultimate) {
            const ultTitle = event.sourceKind === 'tempest_archon' ? '⚡ อสุนีพิพากษา!' : '💥 พิพากษาเพลิง!';
            const ultText = event.amount > 0 ? `${ultTitle} −${event.amount} HP` : `${ultTitle} ติดโล่!`;
            const ultFg = event.sourceKind === 'tempest_archon' ? C[31] : C[30];
            const ultEdge = event.sourceKind === 'tempest_archon' ? C[27] : C[19];
            this.drawFloatingPopup(51, 86 - Math.round((fraction - 0.5) * 18), ultText, ultFg, ultEdge);
          } else if (event.amount > 0) {
            this.drawFloatingPopup(51, 94 - Math.round((fraction - 0.5) * 16), `−${event.amount} HP`, C[9], C[19]);
          }
        }
      }

      if (event.type === 'mirror-reflect') {
        const travel = Math.min(1, fraction / 0.65);
        const rx = Math.round(x + (51 - x) * travel);
        const ry = Math.round(112 - Math.sin(travel * Math.PI) * 10);
        g.fillStyle = C[22];
        g.fillRect(rx - 4, ry - 4, 8, 8);
        g.fillStyle = C[27];
        g.fillRect(rx - 2, ry - 2, 4, 4);
        if (impact) {
          this.drawElementalImpactFlash(51, 124, 'lightning', fraction);
          this.drawFloatingPopup(51, 92 - Math.round((fraction - 0.5) * 16), event.amount > 0 ? `สะท้อน −${event.amount} HP` : 'สะท้อนติดโล่!', C[9], C[22]);
        }
      }

      if (event.type === 'ember-thorns') {
        const travel = Math.min(1, fraction / 0.65);
        const rx = Math.round(x + (51 - x) * travel);
        const ry = Math.round(114 - Math.sin(travel * Math.PI) * 14);
        this.pixelCircle(rx, ry, 5, C[19], true);
        this.pixelDiamond(rx, ry, 4, C[16], C[30]);
        if (impact) {
          this.drawElementalImpactFlash(51, 124, 'blast', fraction);
          this.drawHitBurstVfx(51, 124, C[16], Math.min(1, (fraction - 0.55) / 0.45), 'fire', now);
          this.drawFloatingPopup(51, 92 - Math.round((fraction - 0.5) * 16), event.amount > 0 ? `เกล็ดแมกมา −${event.amount} HP` : 'เกล็ดแมกมาติดโล่!', C[9], C[16]);
        }
      }

      if (event.type === 'storm-static') {
        const travel = Math.min(1, fraction / 0.65);
        const rx = Math.round(x + (51 - x) * travel);
        const ry = Math.round(112 - Math.sin(travel * Math.PI) * 12);
        this.pixelBolt(x - 10, 110, rx, ry, now * 0.06, C[31], C[9]);
        this.pixelBolt(x - 10, 118, rx, ry + 4, now * 0.07 + 3, C[27], C[9]);
        if (impact) {
          this.drawElementalImpactFlash(51, 124, 'lightning', fraction);
          this.drawHitBurstVfx(51, 124, C[31], Math.min(1, (fraction - 0.55) / 0.45), 'lightning', now);
          this.drawFloatingPopup(51, 92 - Math.round((fraction - 0.5) * 16), event.amount > 0 ? `เกราะอสุนี −${event.amount} HP` : 'เกราะอสุนีติดโล่!', C[31], C[22]);
        }
      }

      if (event.type === 'relic') {
        this.drawHealVfx(51, 134, fraction, now);
        const relicPopup = event.relicId === 'storm_pendulum_20' ? '⚡ ดรอปอาติแฟคชิ้นที่ 2!' : '🔥 ดรอปอาติแฟคชิ้นแรก!';
        this.drawFloatingPopup(160, 74 - Math.round(fraction * 12), relicPopup, C[31], C[16]);
      }

      if (event.type === 'status' || event.type === 'frozen') {
        const ice = event.status !== 'burn';
        const elem = ice ? 'ice' : 'fire';
        this.drawElementalImpactFlash(x, 126, elem, fraction);
        this.drawStatusBurstVfx(x, 126, ice, fraction);
        this.drawFloatingPopup(x, 94 - Math.round(fraction * 10), ice ? '🧊 แช่แข็ง!' : '🔥 ติดไฟ!', ELEMENT_IMPACT[elem].core, ELEMENT_IMPACT[elem].primary);
      }

      if (event.type === 'charge') {
        if (event.specialBoss) {
          const isStorm = event.sourceKind === 'tempest_archon';
          this.drawFloatingPopup(
            x,
            84 - Math.round(fraction * 12),
            isStorm ? '⚡ ชาร์จมหาพายุ!' : '🔥 หลอมแก่นเพลิง!',
            isStorm ? C[31] : C[30],
            isStorm ? C[27] : C[19],
          );
        } else {
          this.drawFloatingPopup(x, 94 - Math.round(fraction * 10), '⚡ ชาร์จพลัง!', C[31], C[29]);
        }
      }

      if (event.type === 'fizzle') {
        const lift = Math.round(fraction * 18);
        if (!this.settings.reducedMotion) {
          this.pixelCircle(75, 118 - Math.round(lift * 0.4), Math.round(4 + fraction * 10), C[18], false);
          for (const [dx, dy, size] of [[-8, -2, 3], [3, -7, 4], [10, -1, 3], [-3, -12, 3], [7, -13, 2], [0, -4, 4]]) {
            g.fillStyle = fraction < 0.45 ? C[19] : C[5];
            g.fillRect(75 + dx, 118 + dy - Math.round(lift * 0.8), size, size);
          }
        }
        this.drawFloatingPopup(75, 94 - Math.round(fraction * 10), fizzleLabel(event.cost), C[9], C[18]);
      }
    }
    g.restore();

    if (hadEvents) {
      while (this.contacts[this.playedIndex]?.at <= elapsed) {
        const { event: landed, index } = this.contacts[this.playedIndex++];
        try { this.onEvent?.(landed, index, this.events.length); } catch { /* Keep animation loop resilient */ }
      }
    }
    if (hadEvents && !playing) {
      const done = this.onComplete;
      this.stop();
      try { done?.(); } catch { /* Keep animation loop resilient */ }
    }
  }

  drawElementalImpactFlash(targetX, targetY, element = 'fire', fraction = 0) {
    if (this.settings.reducedMotion) return;
    const pal = ELEMENT_IMPACT[element] ?? ELEMENT_IMPACT.fire;
    const g = this.ctx;
    const flashWindow = Math.max(0, 1 - fraction / 0.72);
    if (flashWindow <= 0) return;

    g.save();
    if (element === 'ice') {
      // Crystalline Blue Prism Spires rising around impact point
      for (const [dx, w, maxH] of [[-12, 6, 26], [0, 8, 36], [12, 6, 24]]) {
        const h = Math.max(4, Math.round(maxH * Math.sin((1 - flashWindow * 0.4) * Math.PI * 0.85)));
        const sx = Math.round(targetX + dx - w / 2);
        const sy = 146 - h;
        g.globalAlpha = flashWindow * 0.55;
        g.fillStyle = pal.secondary;
        g.fillRect(sx - 1, sy + 2, w + 2, h - 2);
        g.globalAlpha = flashWindow * 0.88;
        g.fillStyle = pal.primary;
        g.fillRect(sx, sy, w, h);
        g.globalAlpha = flashWindow * 0.96;
        g.fillStyle = pal.core;
        g.fillRect(sx + Math.floor(w / 2) - 1, sy - 2, 2, h + 2);
      }
    } else if (element === 'fire' || element === 'blast') {
      // Fiery Orange Solar Flare & Ground Magma Plume
      g.globalAlpha = flashWindow * 0.52;
      this.pixelCircle(targetX, targetY, Math.round(24 + (1 - flashWindow) * 16), pal.secondary, true);
      g.globalAlpha = flashWindow * 0.78;
      this.pixelCircle(targetX, targetY, Math.round(16 + (1 - flashWindow) * 10), pal.primary, true);
    }

    // Concentrate the glow and ground reflection around the impact.
    g.globalAlpha = flashWindow * 0.5;
    this.pixelCircle(targetX, targetY, Math.round(20 + (1 - flashWindow) * 14), pal.primary, true);
    g.globalAlpha = flashWindow * 0.82;
    this.pixelCircle(targetX, targetY, Math.round(10 + (1 - flashWindow) * 6), pal.core, true);
    this.pixelEllipse(targetX, 146, Math.round(24 + (1 - flashWindow) * 12), 5, pal.primary, true);
    this.pixelEllipse(targetX, 146, Math.round(15 + (1 - flashWindow) * 5), 2, pal.core, true);
    g.restore();
  }

  drawShotVfx(startX, startY, targetX, px, py, travel, fraction, event, secondColor, now) {
    const g = this.ctx;
    const size = event.size > 1 ? 6 : 4;
    const elem = event.element ?? 'fire';
    const pal = ELEMENT_IMPACT[elem] ?? ELEMENT_IMPACT.fire;
    if (travel < 1) {
      if (elem === 'ice' && event.elements?.length === 1 && !this.settings.reducedMotion
        && drawCombatSprite(g, combatSpriteSheets.iceLance, travel, px, py, event.size > 1 ? 0.78 : 0.55)) return;
      for (let t = 1; t <= 7; t++) {
        const trailT = Math.max(0, travel - t * 0.055);
        const tx = Math.round(startX + (targetX - startX) * trailT);
        const ty = Math.round(startY - Math.sin(trailT * Math.PI) * 16 + Math.sin(now / 45 + t) * (event.elements?.length === 2 ? 3 : 1));
        const tSize = Math.max(1, Math.round((size - t * 0.6)));
        g.fillStyle = t % 2 === 1 && event.elements?.length === 2 ? secondColor : t > 4 ? pal.secondary : pal.primary;
        g.fillRect(tx - Math.floor(tSize / 2), ty - Math.floor(tSize / 2), tSize, tSize);
      }

      if (elementFamily(elem) === 'lightning') {
        this.pixelBolt(Math.max(startX, px - 26), py, px + 4, py, now * 0.04, pal.primary, pal.core);
        this.pixelDiamond(px, py, size + 1, pal.primary, pal.core);
      } else if (elementFamily(elem) === 'ice') {
        this.pixelDiamond(px, py, size + 2, pal.primary, pal.core);
        g.fillStyle = pal.core;
        g.fillRect(px - size - 2, py, size * 2 + 5, 1);
        g.fillRect(px, py - size - 2, 1, size * 2 + 5);
      } else {
        this.pixelCircle(px, py, size + 1, pal.secondary, true);
        this.pixelCircle(px, py, size, pal.primary, true);
        this.pixelCircle(px + 1, py, Math.max(2, size - 2), pal.core, true);
      }

      if (event.elements?.length === 2) {
        const orbitY = Math.round(py + Math.sin(now / 40) * (size + 2));
        this.pixelDiamond(px - 2, orbitY, 3, secondColor, C[9]);
      }
      if (event.pierce) {
        this.pixelEllipse(px + 3, py, 3, size + 3, pal.core, false);
        g.fillStyle = pal.core;
        g.fillRect(px + size, py - 1, 8, 2);
      }
    } else if (!event.blocked && event.damage?.amount > 0 && !this.settings.reducedMotion) {
      const imp = Math.max(0, (fraction - 0.65) / 0.35);
      this.drawElementalImpactFlash(targetX, 122, elem, imp);
      this.drawHitBurstVfx(targetX, 122, pal.primary, imp, elem, now);
    }
  }

  drawBeamVfx(startX, startY, targetX, element, secondColor, dual, fraction, now) {
    const g = this.ctx;
    const width = Math.max(0, targetX - startX);
    if (width < 1) return;
    const sheet = arcaneBeamSheets.get(element);
    if (!this.settings.reducedMotion && sheet?.complete && sheet.naturalWidth) {
      const { frameWidth, frameHeight, columns, frames, startX: source, endX, centerY } = arcaneBeam;
      const index = Math.min(frames - 1, Math.floor(fraction * frames));
      const scaleX = width / (endX - source);
      const scaleY = 0.75;
      g.save();
      g.globalAlpha = Math.min(1, fraction / 0.18, (1 - fraction) / 0.12);
      g.drawImage(sheet, index % columns * frameWidth, Math.floor(index / columns) * frameHeight,
        frameWidth, frameHeight, Math.round(startX - source * scaleX),
        Math.round(startY - centerY * scaleY), Math.max(1, Math.round(frameWidth * scaleX)), frameHeight * scaleY);
      if (dual) {
        for (let x = startX + 4; x < targetX - 4; x += 8) {
          const y = startY + Math.round(Math.sin(x * 0.22 - fraction * 20) * 5);
          g.fillStyle = secondColor;
          g.fillRect(x, y, 3, 2);
        }
      }
      g.restore();
      return;
    }
    if (this.settings.reducedMotion) now = 0;
    const pulse = Math.round(Math.sin(now / 35) * 2);
    const pal = ELEMENT_IMPACT[element] ?? ELEMENT_IMPACT.fire;
    if (fraction > 0.25 && fraction < 0.85) {
      this.drawElementalImpactFlash(targetX, startY, element, Math.abs(fraction - 0.5) * 1.4);
    }
    g.save();
    g.globalAlpha = 0.38;
    g.fillStyle = pal.secondary;
    g.fillRect(startX, startY - 6 - pulse, width, 13 + pulse * 2);
    g.globalAlpha = 0.9;
    g.fillStyle = pal.primary;
    g.fillRect(startX, startY - 3, width, 7);
    if (dual) {
      g.fillStyle = secondColor;
      for (let bx = startX; bx < targetX; bx += 8) {
        const waveY = Math.round(Math.sin((bx + now * 0.25) * 0.18) * 4);
        g.fillRect(bx, startY + waveY - 1, 5, 3);
      }
    }
    g.globalAlpha = 1;
    g.fillStyle = pal.core;
    g.fillRect(startX, startY - 1, width, 3);
    for (let bx = startX + ((Math.floor(now / 20)) % 14); bx < targetX; bx += 14) {
      this.pixelDiamond(bx, startY, 3, pal.primary, pal.core);
    }
    this.pixelDiamond(startX, startY, 6, pal.primary, pal.core);
    this.pixelCircle(targetX, startY, Math.round(7 + Math.sin(fraction * Math.PI) * 9), pal.primary, false);
    this.pixelDiamond(targetX, startY, 8, dual ? secondColor : pal.primary, pal.core);
    g.restore();
  }

  drawWaveVfx(startX, targetX, color, secondColor, dual, travel) {
    const g = this.ctx;
    const elem = color === elementColor.ice ? 'ice' : color === elementColor.lightning ? 'lightning' : 'fire';
    const pal = ELEMENT_IMPACT[elem];
    const waveX = Math.round(startX + (targetX - startX) * travel);
    for (let dy = -18; dy <= 16; dy++) {
      const curve = Math.round(Math.cos((dy / 18) * (Math.PI / 2)) * 10);
      const wx = waveX + curve;
      const wy = 128 + dy;
      const c = dual && Math.abs(dy) % 4 < 2 ? secondColor : pal.primary;
      g.fillStyle = pal.secondary;
      g.fillRect(wx - 9, wy, 3, 1);
      g.fillStyle = c;
      g.fillRect(wx - 6, wy, 7, 1);
      g.fillStyle = pal.core;
      g.fillRect(wx + 1, wy, 2, 1);
    }
    this.pixelEllipse(waveX + 4, 146, 15, 3, pal.core, false);
  }

  drawStormVfx(x, element, fraction, secondaryElement) {
    const g = this.ctx;
    const palette = ELEMENT_IMPACT[element] ?? ELEMENT_IMPACT.storm;
    const grow = Math.min(1, fraction / 0.65);
    g.save();
    g.globalAlpha = this.settings.reducedMotion ? 0.75 : 1 - Math.max(0, fraction - 0.72) * 2;
    for (let ring = 0; ring < 4; ring++) {
      const radius = Math.round((6 + ring * 4) * (0.4 + grow * 0.6));
      const angle = fraction * Math.PI * 4 + ring * 1.3;
      const y = 145 - ring * 9;
      const color = ring % 2 ? palette.primary : elementColor[secondaryElement] ?? palette.secondary;
      this.pixelEllipse(x, y, radius, 2 + ring, color, false);
      g.fillStyle = palette.core;
      g.fillRect(x + Math.round(Math.cos(angle) * radius) - 2, y + Math.round(Math.sin(angle) * 3), 5, 1);
    }
    g.restore();
  }

  drawFireBurst(centerX, fraction, targets, positions) {
    const g = this.ctx;
    const pal = ELEMENT_IMPACT.blast;
    const reduced = this.settings.reducedMotion;
    g.save();
    if (!reduced) {
      g.globalAlpha = Math.min(1, (1 - fraction) / 0.35);
      if (!drawCombatSprite(g, combatSpriteSheets.fireBurst, fraction, centerX, 145, 0.7)) {
        this.drawExplosionVfx(centerX, 126, fraction, [], [], 'blast');
      }
    } else {
      this.pixelEllipse(centerX, 145, 20, 5, pal.primary, false);
    }
    g.globalAlpha = reduced ? 1 : Math.min(1, (1 - fraction) / 0.22);
    for (const [index, enemy] of this.state.enemies.entries()) {
      const x = positions[index];
      if (x === centerX || !targets?.includes(enemy.id)) continue;
      const arrival = this.blastArrival(x, centerX);
      if (fraction < arrival) {
        const edge = Math.round(centerX + (x - centerX) * fraction / arrival);
        this.pixelEllipse(edge, 146, 7, 2, pal.rim, false);
      } else {
        const local = reduced ? 0.45 : (fraction - arrival) / (1 - arrival);
        const lift = Math.round(Math.sin(local * Math.PI) * 11);
        this.pixelEllipse(x, 146, Math.round(7 + local * 7), 3, pal.rim, false);
        for (const dx of [-6, 0, 6]) {
          this.pixelDiamond(x + dx, 141 - lift + Math.abs(dx), dx === 0 ? 3 : 2, pal.primary, pal.core);
        }
      }
    }
    g.restore();
  }

  blastArrival(x, centerX) {
    if (this.settings.reducedMotion) return 0;
    return x === centerX ? 0 : Math.min(0.5, 0.10 + Math.abs(x - centerX) / 420);
  }

  drawExplosionVfx(centerX, centerY, fraction, targets = [], positions = [], elem = 'blast', scale = 1, secondElement) {
    const g = this.ctx;
    const pal = ELEMENT_IMPACT[elem] ?? ELEMENT_IMPACT.blast;
    const outerR = Math.round((8 + fraction * 28) * scale);
    const innerR = Math.round((5 + Math.sin(fraction * Math.PI) * 16) * scale);
    this.pixelEllipse(centerX, 146, outerR + 6, 6, pal.secondary, false);
    this.pixelEllipse(centerX, 146, outerR, 4, pal.primary, false);
    this.pixelCircle(centerX, centerY, outerR, pal.primary, false);
    this.pixelCircle(centerX, centerY, Math.max(2, outerR - 3), ELEMENT_IMPACT[secondElement]?.primary ?? pal.rim, false);
    if (fraction < 0.78) {
      this.pixelCircle(centerX, centerY, innerR, pal.primary, true);
      this.pixelCircle(centerX, centerY, Math.max(2, Math.round(innerR * 0.6)), pal.core, true);
    }
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI) / 6 + fraction * 1.25;
      const dist = Math.round(fraction * 30);
      const ex = Math.round(centerX + Math.cos(ang) * dist);
      const ey = Math.round(centerY + Math.sin(ang) * dist * 0.75);
      this.pixelDiamond(ex, ey, fraction < 0.5 ? 3 : 2, pal.primary, pal.core);
    }
    for (const id of targets ?? []) {
      const idx = this.state?.enemies.findIndex(enemy => enemy.id === id) ?? -1;
      const hitX = positions[idx];
      if (!hitX) continue;
      const arrival = this.blastArrival(hitX, centerX);
      if (fraction < arrival) continue;
      const pillarH = Math.round(Math.sin((fraction - arrival) / (1 - arrival) * Math.PI) * 34);
      if (pillarH > 2) {
        g.fillStyle = pal.secondary;
        g.fillRect(hitX - 8, 146 - pillarH, 16, pillarH);
        g.fillStyle = pal.primary;
        g.fillRect(hitX - 5, 146 - pillarH, 10, pillarH);
        g.fillStyle = pal.core;
        g.fillRect(hitX - 2, 146 - pillarH, 4, pillarH);
      }
    }
  }

  drawHitBurstVfx(x, y, color, fraction, elem = null, now = 0) {
    const g = this.ctx;
    const f = Math.max(0, Math.min(1, fraction));
    const resolvedElem = elem ?? (color === elementColor.ice ? 'ice' : color === elementColor.lightning ? 'lightning' : 'fire');
    const pal = ELEMENT_IMPACT[resolvedElem] ?? ELEMENT_IMPACT.fire;

    if (resolvedElem === 'ice') {
      // Crystalline Blue Impact: 8-pointed frost lance burst + shattering ice diamonds + dual frost rings
      const r = Math.round(6 + f * 22);
      this.pixelCircle(x, y, r, pal.secondary, false);
      this.pixelCircle(x, y, Math.max(3, r - 2), pal.primary, false);
      this.pixelCircle(x, y, Math.max(2, r - 5), pal.core, false);
      if (f < 0.72) {
        this.pixelDiamond(x, y, Math.round(11 - f * 9), pal.primary, pal.core);
      }
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        const innerD = Math.round(2 + f * 4);
        const outerD = Math.round(12 + f * 20);
        for (let s = innerD; s <= outerD; s += 2) {
          const lx = Math.round(x + Math.cos(ang) * s);
          const ly = Math.round(y + Math.sin(ang) * s);
          g.fillStyle = s > (innerD + outerD) / 2 ? pal.primary : pal.core;
          g.fillRect(lx - 1, ly - 1, 2, 2);
        }
        const shardX = Math.round(x + Math.cos(ang + 0.39) * (7 + f * 18));
        const shardY = Math.round(y + Math.sin(ang + 0.39) * (7 + f * 18));
        this.pixelDiamond(shardX, shardY, f < 0.55 ? 3 : 2, pal.primary, pal.core);
      }
    } else if (resolvedElem === 'lightning') {
      // Electric Gold-Violet Impact: vertical sky-strike bolt + branching radial arcs + bright flash core
      if (f < 0.75) {
        this.pixelBolt(x + Math.round(Math.sin(f * 20) * 6), 14, x, y, now * 0.06 + f * 10, pal.primary, pal.core);
      }
      const r = Math.round(6 + f * 19);
      this.pixelCircle(x, y, r, pal.secondary, false);
      this.pixelCircle(x, y, Math.max(2, r - 2), pal.primary, false);
      if (f < 0.65) {
        this.pixelDiamond(x, y, Math.round(9 - f * 7), pal.primary, pal.core);
      }
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + 0.78;
        const tx = Math.round(x + Math.cos(ang) * (12 + f * 18));
        const ty = Math.round(y + Math.sin(ang) * (12 + f * 18));
        this.pixelBolt(x, y, tx, ty, i * 3.1 + f * 8, i % 2 ? pal.secondary : pal.primary, pal.core);
      }
    } else {
      // Fiery Orange Impact: erupting flame column + double fiery shockwave ring + rising ember sparks
      const r = Math.round(6 + f * 22);
      const flameH = Math.round(Math.sin(f * Math.PI) * 32);
      if (flameH > 2) {
        g.fillStyle = pal.secondary;
        g.fillRect(x - 10, 146 - flameH, 20, flameH);
        g.fillStyle = pal.primary;
        g.fillRect(x - 6, 146 - flameH + 2, 12, flameH - 2);
        g.fillStyle = pal.core;
        g.fillRect(x - 3, 146 - flameH + 4, 6, Math.max(2, flameH - 4));
      }
      this.pixelCircle(x, y, r + 2, pal.secondary, false);
      this.pixelCircle(x, y, r, pal.primary, false);
      this.pixelCircle(x, y, Math.max(2, r - 3), pal.rim, false);
      if (f < 0.68) {
        this.pixelCircle(x, y, Math.max(2, Math.round(10 - f * 10)), pal.core, true);
        this.pixelDiamond(x, y, Math.round(11 - f * 9), pal.primary, pal.core);
      }
      for (let i = 0; i < 10; i++) {
        const ang = (i * Math.PI) / 5 + f * 0.7;
        const d = Math.round(5 + f * 22);
        const sx = Math.round(x + Math.cos(ang) * d);
        const sy = Math.round(y + Math.sin(ang) * d - f * 10);
        this.pixelDiamond(sx, sy, i % 2 === 0 && f < 0.65 ? 3 : 2, i % 3 === 0 ? pal.secondary : pal.primary, pal.core);
      }
    }
  }

  drawEnemyAttackVfx(enemyX, playerX, fraction, impact, event, now) {
    const g = this.ctx;
    const isSpecial = Boolean(event.specialBoss);
    const isUltimate = Boolean(event.ultimate);
    const isStormBoss = event.sourceKind === 'tempest_archon';

    if (isUltimate) {
      if (fraction < 0.62) {
        const t = fraction / 0.62;
        const projX = Math.round(enemyX - 18 - (enemyX - 18 - (playerX + 10)) * t);
        if (isStormBoss) {
          this.pixelBolt(enemyX - 16, 108, projX, 118, now * 0.08, C[31], C[9]);
          this.pixelBolt(enemyX - 16, 116, projX + 8, 124, now * 0.09 + 2, C[27], C[9]);
          this.pixelDiamond(projX, 118, 6, C[31], C[9]);
          // Sky thundercloud gather above wizard
          this.pixelEllipse(playerX + 4, 24, Math.round(12 + t * 22), 5, C[22], true);
          this.pixelBolt(playerX + 4, 24, playerX + 4 + Math.round(Math.sin(now / 35) * 6), Math.round(36 + t * 34), now * 0.06, C[31], C[9]);
        } else {
          // Giant blazing meteor-wave hurtling across battlefield
          for (let trail = 1; trail <= 6; trail++) {
            const tx = Math.round(projX + trail * 12);
            const r = Math.max(2, 10 - trail);
            this.pixelCircle(tx, 118 + Math.round(Math.sin(now / 50 + trail) * 3), r, trail % 2 ? C[19] : C[16], true);
          }
          this.pixelCircle(projX, 118, 12, C[19], true);
          this.pixelCircle(projX, 118, 8, C[16], true);
          this.pixelCircle(projX - 2, 117, 4, C[30], true);
        }
      } else {
        const imp = Math.min(1, (fraction - 0.62) / 0.38);
        const hitX = event.absorbed > 0 ? playerX + 16 : playerX + 4;
        if (isStormBoss) {
          // Triple sky-to-ground thunderbolts crashing onto player
          this.pixelBolt(hitX, 0, hitX, 144, now * 0.09, C[31], C[9]);
          this.pixelBolt(hitX - 16, 0, hitX - 10, 146, now * 0.09 + 1.8, C[27], C[9]);
          this.pixelBolt(hitX + 16, 0, hitX + 10, 146, now * 0.09 + 3.4, C[22], C[9]);
          this.drawElementalImpactFlash(hitX, 122, 'lightning', imp);
          this.pixelCircle(hitX, 122, Math.round(10 + imp * 30), C[27], false);
          this.pixelCircle(hitX, 122, Math.round(6 + imp * 22), C[31], false);
          this.pixelDiamond(hitX, 120, Math.round(14 - imp * 8), C[31], C[9]);
          for (let i = 0; i < 10; i++) {
            const ang = (i * Math.PI) / 5 + imp * 0.4;
            const d = Math.round(8 + imp * 32);
            const sx = Math.round(hitX + Math.cos(ang) * d);
            const sy = Math.round(120 + Math.sin(ang) * d);
            this.pixelBolt(hitX, 120, sx, sy, i * 2.1 + now * 0.05, C[31], C[9]);
          }
        } else {
          // Volcanic magma eruption & ground fissure slam
          const colH = Math.round(Math.sin(imp * Math.PI) * 68);
          if (colH > 3) {
            g.fillStyle = C[19]; g.fillRect(hitX - 18, 147 - colH, 36, colH);
            g.fillStyle = C[16]; g.fillRect(hitX - 12, 147 - colH + 3, 24, colH - 3);
            g.fillStyle = C[30]; g.fillRect(hitX - 6, 147 - colH + 6, 12, Math.max(2, colH - 6));
            g.fillStyle = C[9]; g.fillRect(hitX - 2, 147 - colH + 10, 4, Math.max(2, colH - 10));
          }
          this.drawElementalImpactFlash(hitX, 122, 'blast', imp);
          this.pixelCircle(hitX, 124, Math.round(10 + imp * 32), C[19], false);
          this.pixelCircle(hitX, 124, Math.round(7 + imp * 24), C[16], false);
          this.pixelCircle(hitX, 124, Math.round(4 + imp * 14), C[30], false);
          for (let i = 0; i < 12; i++) {
            const ang = (i * Math.PI) / 6 + imp * 0.6;
            const d = Math.round(8 + imp * 34);
            const sx = Math.round(hitX + Math.cos(ang) * d);
            const sy = Math.round(124 + Math.sin(ang) * d - imp * 12);
            this.pixelDiamond(sx, sy, i % 2 === 0 ? 4 : 3, i % 3 === 0 ? C[19] : C[16], C[30]);
          }
        }
      }
      return;
    }

    if (fraction < 0.62) {
      const t = fraction / 0.62;
      const waveX = Math.round(enemyX - 12 - (enemyX - 12 - (playerX + 16)) * t);
      if (isSpecial) {
        if (isStormBoss) {
          this.pixelBolt(enemyX - 14, 118, waveX, 122, now * 0.06, C[31], C[9]);
          this.pixelDiamond(waveX, 122, 4, C[31], C[27]);
        } else {
          for (let dy = -11; dy <= 11; dy++) {
            const curve = Math.round((dy * dy) / 10);
            g.fillStyle = Math.abs(dy) < 4 ? C[30] : Math.abs(dy) < 8 ? C[16] : C[19];
            g.fillRect(waveX + curve, 122 + dy, 6, 1);
          }
        }
      } else {
        for (let dy = -8; dy <= 8; dy++) {
          const curve = Math.round((dy * dy) / 10);
          g.fillStyle = Math.abs(dy) < 3 ? C[9] : C[19];
          g.fillRect(waveX + curve, 123 + dy, 4, 1);
        }
      }
    } else {
      const imp = Math.min(1, (fraction - 0.62) / 0.38);
      const hitX = event.absorbed > 0 ? playerX + 17 : playerX + 4;
      const slashColor = isSpecial
        ? (isStormBoss ? C[31] : C[16])
        : (event.absorbed > 0 ? C[27] : C[19]);
      for (let s = -10; s <= 10; s++) {
        g.fillStyle = slashColor;
        g.fillRect(hitX + s - 1, 122 + s - 1, 3, 3);
        g.fillStyle = C[9];
        g.fillRect(hitX + s, 122 + s, 1, 1);
        g.fillStyle = slashColor;
        g.fillRect(hitX + s - 1, 122 - s - 1, 3, 3);
      }
      this.pixelCircle(hitX, 122, Math.round((isSpecial ? 7 : 5) + imp * (isSpecial ? 18 : 13)), slashColor, false);
      if (isSpecial) {
        this.drawElementalImpactFlash(hitX, 124, isStormBoss ? 'lightning' : 'fire', imp);
      }
    }
  }

  drawHealVfx(x, baselineY, fraction, now) {
    const g = this.ctx;
    this.pixelEllipse(x, baselineY, 16, 4, C[26], false);
    this.pixelEllipse(x, baselineY, 10, 2, C[9], false);
    for (let i = 0; i < 6; i++) {
      const cx = Math.round(x - 10 + i * 4 + Math.sin(now / 90 + i) * 3);
      const cy = Math.round(baselineY - 6 - ((fraction * 32 + i * 6) % 32));
      g.fillStyle = i % 2 ? C[9] : C[26];
      g.fillRect(cx - 2, cy, 5, 1);
      g.fillRect(cx, cy - 2, 1, 5);
    }
  }

  drawStatusBurstVfx(x, y, isIce, fraction) {
    const color = isIce ? C[27] : C[30];
    this.pixelCircle(x, y, Math.round(6 + fraction * 14), color, false);
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3 + fraction;
      const px = Math.round(x + Math.cos(ang) * (6 + fraction * 10));
      const py = Math.round(y + Math.sin(ang) * (6 + fraction * 10));
      this.pixelDiamond(px, py, 2, color, C[9]);
    }
  }

  drawDamagePopup(x, fraction, event, color, labelLift = 0) {
    if (event.amount === 0 && !this.settings.reducedMotion && fraction < 0.3) {
      this.pixelDiamond(x - 6, 121, 3, C[7], C[9]);
    }
    this.drawFloatingPopup(x, 96 - labelLift - Math.round(fraction * 12), damageLabel(event), C[9], event.amount > 0 ? color : C[7]);
  }

  drawFloatingPopup(x, y, text, textColor, borderColor) {
    const g = this.ctx;
    g.save();
    g.font = 'bold 10px sans-serif';
    g.textAlign = 'center';
    const width = Math.ceil(g.measureText(text).width) + 10;
    const rx = Math.round(Math.max(2, Math.min(x - width / 2, this.canvas.width - width - 2)));
    const ry = Math.round(y - 10);
    g.fillStyle = C[0];
    g.fillRect(rx - 1, ry - 1, width + 2, 14);
    g.fillStyle = borderColor;
    g.fillRect(rx, ry, width, 12);
    g.fillStyle = C[1];
    g.fillRect(rx + 1, ry + 1, width - 2, 10);
    g.fillStyle = textColor;
    g.fillText(text, rx + width / 2, Math.round(y));
    g.restore();
  }

  barrier(x, top, width, color, hit, kind = 'shield', now = 0, appearProgress = 1, isOuterLayer = false) {
    const g = this.ctx;
    const rx = Math.round((width / 2) * Math.min(1, 0.4 + appearProgress * 0.6));
    const bottom = 148;
    const height = Math.max(12, bottom - top);
    const cy = bottom - Math.round(height * 0.45);
    const ry = Math.round(height * 0.56);

    g.save();
    this.pixelEllipse(x, bottom - 1, rx + 2, 4, hit ? C[9] : color, false);

    for (let dy = -ry; dy <= Math.round(ry * 0.78); dy++) {
      const normY = dy / ry;
      const span = Math.round(rx * Math.sqrt(Math.max(0, 1 - normY * normY)));
      if (span <= 0) continue;
      const py = cy + dy;
      if (py > bottom) continue;

      if (!isOuterLayer) {
        g.globalAlpha = hit ? 0.36 : (dy % 4 === 0 ? 0.20 : 0.11);
        g.fillStyle = hit ? C[9] : color;
        g.fillRect(Math.round(x - span), py, span * 2 + 1, 1);
      }

      g.globalAlpha = hit ? 1 : isOuterLayer ? 0.65 : 0.92;
      g.fillStyle = hit ? C[9] : color;
      const edgeW = dy < -ry * 0.6 ? 3 : 2;
      g.fillRect(Math.round(x - span), py, edgeW, 1);
      g.fillRect(Math.round(x + span - edgeW + 1), py, edgeW, 1);

      if (!isOuterLayer && dy > -ry + 3 && dy < 0 && span > 5) {
        g.globalAlpha = 0.45;
        g.fillStyle = C[9];
        g.fillRect(Math.round(x - span + 3), py, 1, 1);
      }
    }

    g.globalAlpha = 1;
    if (!this.settings.reducedMotion) {
      const nodeCount = 4;
      for (let i = 0; i < nodeCount; i++) {
        const ang = (now / 260) + (i * Math.PI * 2) / nodeCount;
        const nx = Math.round(x + Math.cos(ang) * (rx - 1));
        const ny = Math.round(cy + Math.sin(ang) * (ry * 0.55));
        if (ny <= bottom) {
          this.pixelDiamond(nx, ny, kind === 'fire' || kind === 'blast' ? 2 : 1, color, C[9]);
        }
      }
    }

    if (hit) {
      this.pixelCircle(x + (x < 100 ? 12 : -12), cy, Math.round(rx * 0.55), C[9], false);
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        const sx = Math.round(x + Math.cos(ang) * (rx + 4));
        const sy = Math.round(cy + Math.sin(ang) * (ry * 0.6));
        this.pixelDiamond(sx, sy, 2, color, C[9]);
      }
    }
    g.restore();
  }

  barrierLabel(x, y, label, color) {
    this.drawFloatingPopup(x, y, label, C[9], color);
  }

  drawWardImpact(x, top, width, broke, progress) {
    const g = this.ctx;
    const pal = ELEMENT_IMPACT.ward;
    const radius = width / 2;
    const p = Math.max(0, progress);
    const y = Math.round((top + 148) / 2);
    const contact = x - radius + 3;
    g.save();
    if (broke && p < 0.42) {
      g.globalAlpha = 1 - p / 0.42;
      this.barrier(x, top, width, pal.primary, false, 'ward', 0, 1, false);
      g.globalAlpha = 1 - p / 0.42;
      this.pixelBolt(contact, y, x + radius * 0.65, y - 9, 2, pal.secondary, pal.core);
      this.pixelBolt(x - 4, y - 4, x + 5, top + 5, 4, pal.secondary, pal.core);
      this.pixelBolt(x - 4, y - 4, x + 10, y + 14, 3, pal.secondary, pal.core);
    }
    g.globalAlpha = 1 - p;
    this.pixelCircle(contact, y, Math.round(4 + p * 16), pal.rim, false);
    const count = broke ? 12 : 5;
    for (let i = 0; i < count; i++) {
      const angle = i * Math.PI * 2 / count;
      const spread = p * (10 + (i * 7) % 15);
      const sx = x + Math.cos(angle) * ((broke ? radius - 4 : 5) + spread) - (broke ? 0 : radius - 3);
      const sy = y + Math.sin(angle) * ((broke ? (148 - top) * 0.37 : 6) + spread) + p * p * 14;
      this.pixelDiamond(sx, sy, p < 0.56 && broke ? 3 : 1, pal.primary, pal.core);
    }
    g.restore();
  }
  dispose() { cancelAnimationFrame(this.raf); }
}
