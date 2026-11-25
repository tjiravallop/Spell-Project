import { shieldProtection } from './shields.js';
import { ENEMIES, FLOOR21_START_ROOM, FLOOR30_BOSS_ROOM, FLOOR40_BOSS_ROOM, FLOOR50_BOSS_ROOM, FLOOR60_BOSS_ROOM, FLOOR70_BOSS_ROOM, RELIC_DRAFT_CATALOG, getFloorInfo } from './run.js';
import { elementFamily, FUSION_COMPONENTS } from './words.js';
import { middleSprites } from './middle-sprites.js';
import { loadSpriteArt, spriteFrame } from './sprite-art.js';
import { drawTowerFittings, towerArtPalette, towerEnemyArt } from './tower-enemy-art.js';
import { drawNewTowerSprite, GEAR_RIFT_SPRITE_KINDS } from './tower-pixel-sprites.js';
import { drawSummonArt, resolveSummonArt, SUMMON_ART } from './summon-art.js';
import { resolveCreatureOffset, resolveCreatureScale } from './summon-sizes.js';
import { FUSION_SUMMON_PALETTES } from './summon-palettes.js';
import { drawBossArt, evaluateBossAnimation, resolveBossArt } from './boss-art-v2.js';
import { getBossVisualBounds, resolveBossLayer, resolveBossOffset, resolveBossScale } from './boss-sizes.js';

export const PALETTE = ['#10191b', '#172326', '#203033', '#2b3d3c', '#3b4b46', '#536454', '#718063', '#9da77c', '#cbd5a1', '#eff0c4', '#332d2b', '#514036', '#765740', '#a57a50', '#d3aa6b', '#efd19a', '#4d3036', '#7b464c', '#b46c67', '#e29d83', '#3d374e', '#60516f', '#907ba6', '#bca5d2', '#335250', '#53857b', '#8bb7a0', '#b7d9bd', '#7e512e', '#b98745', '#e4b659', '#f5db87'];
const C = PALETTE;
const vfxFamily = element => element === 'mist' ? 'water' : elementFamily(element);
export const LARGE_BOSS_KINDS = new Set([
  'boss', 'mirror_mage', 'frost_lich', 'storm_titan', 'arch_codex', 'ember_overlord',
  'prism_watcher', 'astral_sentinel', 'elder_grimoire', 'eclipse_mage', 'glacial_sovereign', 'thunder_colossus', 'nexus_codex', 'tempest_archon',
  'seal_curator', 'crown_archivist',
  'gate_weaver', 'mirror_regent', 'seam_warden', 'loom_sovereign',
  'volcano_colossus', 'thunder_drake_emperor', 'ancient_chitin_behemoth', 'abyssal_cthulhu', 'nether_dread_lord', 'eternity_overlord', 'eternity_reborn',
  'ironforge_automaton', 'tempest_blade_seraph', 'abyssal_tide_colossus', 'magma_core_juggernaut', 'chitin_bastion_behemoth',
  'storm_sovereign_drake', 'void_kraken_leviathan', 'nether_forge_overlord', 'eternity_armory_god',
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
export const damageLabel = event => {
  if (event.phaseGate) return 'ถึงขอบเขตเฟส';
  if (event.amount <= 0) return 'เกราะกันหมด';
  const tag = event.weakness ? ' (จุดอ่อน!)' : event.resisted ? ' (ต้านทาน)' : '';
  return `−${event.actual ?? event.amount} HP${tag}`;
};
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
    summonTint: '#9ceeff',
    secondary: '#0077c2',
    rim: '#a6f4ff',
  },
  lightning: {
    core: '#ffffff',
    primary: '#ffe53b',
    secondary: '#9b5de5',
    rim: '#fff699',
  },
  earth: {
    core: '#fff2cf',
    primary: '#c9944c',
    secondary: '#6b4725',
    rim: '#e8c17d',
  },
  water: {
    core: '#ebffff',
    primary: '#3cb9f5',
    summonTint: '#387dea',
    secondary: '#175a94',
    rim: '#8ee3ff',
  },
  wind: {
    core: '#f3fff6',
    primary: '#86e3b6',
    secondary: '#2d7f6e',
    rim: '#c2fae0',
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
  akki: {
    core: '#fff6b7', primary: '#ff5741', secondary: '#a32251', rim: '#ffad69',
    summonTint: '#ee3050', summonMark: ['..+..', '..#+.', '.+##.', '+###+', '.+#+.'],
  },
  heman: {
    core: '#e7f1ff', primary: '#7aa8ff', secondary: '#4a50be', rim: '#9ed8ff',
    summonTint: '#8b92ff', summonMark: ['+.+.+', '.###.', '+###+', '.###.', '+.+.+'],
  },
  asani: {
    core: '#fff2ff', primary: '#dba1ff', secondary: '#7934ca', rim: '#ffda98',
    summonTint: '#bd6bff', summonMark: ['..+#.', '.+#..', '.##+.', '..#+.', '.#+..'],
  },
  pathaphi: {
    core: '#fff3c4', primary: '#e0a84d', secondary: '#74481e', rim: '#f7d588',
    summonTint: '#af755d', summonMark: ['..+..', '.+#+.', '+###+', '.+#+.', '..+..'],
  },
  wari: {
    core: '#e9ffff', primary: '#44d0ff', secondary: '#14629c', rim: '#a8f2ff',
    summonTint: '#28c7cd', summonMark: ['..+..', '.+#+.', '.###.', '+###+', '.+++.'],
  },
  magma: { core: '#ffed99', primary: '#ff8543', secondary: '#b73e23', rim: '#ffc354' },
  mudmire: { core: '#f5ecd5', primary: '#8b6c42', secondary: '#4e3b20', rim: '#c2a677' },
  dust: { core: '#f7f4ea', primary: '#b8a98a', secondary: '#6b5e43', rim: '#e2d8c3' },
  permafrost: { core: '#eaf6ff', primary: '#6fb2d2', secondary: '#315674', rim: '#b5e1f7' },
  magnet: { core: '#fff0f0', primary: '#e65c7b', secondary: '#5a3d7a', rim: '#9bb8ff' },
  mist: { core: '#f2fff7', primary: '#93dbc6', secondary: '#4e807b', rim: '#c0eade' },
  hail: { core: '#f5fdff', primary: '#b7e9ff', secondary: '#518bcf', rim: '#d0e1ff' },
  monsoon: { core: '#e6ffff', primary: '#3cbcd0', secondary: '#1d5a73', rim: '#88f3ff' },
  shockstream: { core: '#f0ffff', primary: '#4dd2ff', secondary: '#4343a8', rim: '#bfeaff' },
  thunderstorm: { core: '#fcffee', primary: '#abef79', secondary: '#557b9f', rim: '#eaffaa' },
  heatwave: { core: '#fff0d0', primary: '#ff6e30', secondary: '#962015', rim: '#ffb566' },
  chillgale: { core: '#f0faff', primary: '#8cd5e8', secondary: '#3a6b88', rim: '#c8f2ff' },
  plasma: { core: '#ffffff', primary: '#e040fb', secondary: '#7c0099', rim: '#ff80ab' },
  scald: { core: '#fff5f0', primary: '#ff7052', secondary: '#703858', rim: '#ffc0a8' },
  frostvolt: { core: '#f5f0ff', primary: '#a78bfa', secondary: '#4338ca', rim: '#c4b5fd' },
  storm: { core: '#efffe8', primary: '#a7dcc0', secondary: '#4e807b', rim: '#d2f1cf' },
  blackhole: { core: '#f8e0ff', primary: '#bd75fa', secondary: '#46236b', rim: '#d9b1ff' },
  death: { core: '#fff3fa', primary: '#e679af', secondary: '#672245', rim: '#ffacca' },
  meteor: { core: '#fff6cf', primary: '#ff9a50', secondary: '#aa3824', rim: '#ffd263' },
  veil: { core: '#f2ecff', primary: '#b3b1ff', secondary: '#484893', rim: '#d8d3ff' },
  vayu: {
    core: '#f3fff3', primary: '#94e7ae', secondary: '#398d82', rim: '#c8f9c0',
    summonTint: '#65d56e', summonMark: ['..+++', '.+#..', '+###+', '...#+', '.+++.'],
  },
});
const elementColor = Object.fromEntries(Object.entries(ELEMENT_IMPACT).map(([id, palette]) => [id, palette.primary]));
const fusedSummonMarks = {
  magma:      ['..++...', '...##..', '.###++.', '+##.##.', '.+...#+'],
  mudmire:    ['....+..', '..##...', '.####+.', '+##..##', '..+++..'],
  dust:       ['...++..', '.###...', '+..###+', '...##..', '.++....'],
  permafrost: ['...#...', '..#+#..', '+#..##.', '.##+#.+', '..+#...'],
  magnet:     ['.#+.+#.', '+##.##+', '.#...#.', '.##.##.', '...+...'],
  mist:       ['..+++..', '.##..++', '...###.', '+##....', '..+##+.'],
  hail:       ['.+...+.', '..#.#..', '.#+#..+', '+..##..', '..+..#.'],
  monsoon:    ['..###+.', '.##...+', '+#..##.', '.#...#+', '..###..'],
  shockstream:['...#+..', '..##...', '.+####.', '....##+', '..##+..'],
  thunderstorm:['..++##.', '.###...', '+##.##+', '...##..', '..#+...'],
  heatwave:   ['.+..#+.', '..##.#.', '.##.##+', '+#..##.', '.+##+..'],
  chillgale:  ['...#..+', '.##+##.', '+..#...', '.##+##+', '...#...'],
  plasma:     ['..#..+.', '.+###..', '##+.+##', '..###+.', '.+..#..'],
  scald:      ['..#..+.', '.#+.#..', '.#..#+.', '..##...', '+####+.'],
  frostvolt:  ['...##..', '..##.+.', '.+####+', '...##..', '..##...'],
};
const fusedSummonPalettes = new Map(Object.entries(FUSION_COMPONENTS).map(([id, [base, accent]]) => {
  const body = ELEMENT_IMPACT[base];
  const mark = ELEMENT_IMPACT[accent];
  return [id, {
    ...ELEMENT_IMPACT[id],
    summonTint: body.summonTint ?? body.primary,
    summonMark: fusedSummonMarks[id],
    markColors: { '#': mark.rim, '+': mark.primary },
  }];
}));
const fusionSummonPalettesV2 = new Map(Object.entries(FUSION_SUMMON_PALETTES).map(([id, palette]) => [
  id, Object.freeze({ ...palette, summonMark: fusedSummonMarks[id] }),
]));
const fusionSummonPalette = (element, visuals) => visuals?.v2 ? fusionSummonPalettesV2.get(element) : undefined;
elementColor['akki-blast'] = elementColor.akki;
export const vfxScale = source => (source?.grand ? 5 : source?.large ? 2 : 1);

export const NORMAL_SUMMON_ANCHOR = Object.freeze({ x: 88, baseline: 147 });
export const GRAND_SUMMON_ANCHOR = Object.freeze({ x: 78, baseline: 143 });

export function getSummonAnchor(summon, options) {
  const grand = Boolean(summon?.isGrand && Object.hasOwn(SUMMON_ART, summon?.creatureId));
  const base = grand ? GRAND_SUMMON_ANCHOR : NORMAL_SUMMON_ANCHOR;
  const offset = resolveCreatureOffset(summon?.creatureId, grand, options);
  return offset.x || offset.baseline
    ? { x: base.x + offset.x, baseline: base.baseline + offset.baseline }
    : base;
}

export function getSummonBounds(summon, options = {}) {
  const { x, baseline } = getSummonAnchor(summon, options);
  const cid = summon?.creatureId;
  const art = resolveSummonArt(cid, options);
  if (!art) {
    return { x, baseline, left: x - 12, right: x + 12, top: baseline - 24, bottom: baseline, width: 24, height: 24, isGrand: false };
  }
  const grand = Boolean(summon?.isGrand);
  const scale = resolveCreatureScale(cid, grand, art, options);
  const width = Math.round(art.width * scale);
  const height = Math.round(art.height * scale);
  const lift = Math.min(Math.round(art.lift * scale), Math.max(0, baseline - height - 6));
  const left = x - Math.floor(width / 2);
  const top = baseline - height - lift;
  return { x, baseline, left, right: left + width, top, bottom: top + height, width, height, isGrand: grand };
}

export function getSummonHudLayout(summon, options = {}) {
  const bounds = getSummonBounds(summon, options);
  const gap = bounds.isGrand ? 5 : 10;
  const aboveY = Math.max(4, bounds.top - gap);
  const sideX = Math.min(240, bounds.right + 6);
  const sideY = Math.max(6, Math.min(96, bounds.top));
  return {
    bounds,
    placement: bounds.top < 46 ? 'side' : 'above',
    aboveX: Number((bounds.x / 3.2).toFixed(3)),
    aboveY: Number((aboveY / 1.8).toFixed(3)),
    sideX: Number((sideX / 3.2).toFixed(3)),
    sideY: Number((sideY / 1.8).toFixed(3)),
  };
}

export class Battlefield {
  constructor(canvas, settings, summonVisuals, bossVisuals = null) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false });
    this.hpNumbersInHud = Boolean(canvas.closest?.('.battle-scene'));
    this.settings = settings; this.state = null; this.target = null; this.events = []; this.started = 0; this.duration = 0;
    this.summonVisuals = summonVisuals;
    this.bossVisuals = bossVisuals;
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
    const floor = state ? getFloorInfo(state.room, state.rooms?.length).floor : 0;
    if (floor !== this.artFloor) {
      this.artFloor = floor;
      this.enemyPalette = towerArtPalette(floor, C);
      this.alternateEnemyPalette = towerArtPalette(floor, C, true);
    }
    this.alternateEnemyIds = new Set();
    const seenKinds = new Set();
    for (const enemy of state?.enemies ?? []) {
      if (seenKinds.delete(enemy.kind)) this.alternateEnemyIds.add(enemy.id);
      else seenKinds.add(enemy.kind);
    }
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
    const grouped = [];
    for (let i = 0; i < combatEvents.length; i++) {
      const event = combatEvents[i];
      const next = combatEvents[i + 1];
      if (['projectile', 'chain-lightning', 'magma-erupt'].includes(event.type) && !event.blocked && next?.type === 'damage' && next.target === event.target) {
        grouped.push({ ...event, damage: next });
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
        grouped.push({ ...event, hits });
      } else {
        grouped.push(event);
      }
    }
    const events = [];
    const consumed = new Set();
    for (let i = 0; i < grouped.length; i++) {
      if (consumed.has(i)) continue;
      const ev = grouped[i];
      if (ev.type === 'projectile' && ev.form === 'spear' && ev.spearPhase === 'front' && ev.spearGroup) {
        let backIdx = -1;
        for (let j = i + 1; j < grouped.length; j++) {
          if (consumed.has(j)) continue;
          const cand = grouped[j];
          if (cand.type === 'projectile' && cand.form === 'spear' && cand.spearPhase === 'pierce' && cand.spearGroup === ev.spearGroup) {
            backIdx = j;
            break;
          }
        }
        if (backIdx !== -1) {
          const backEv = grouped[backIdx];
          let backDispel = null;
          const prevIdx = backIdx - 1;
          if (prevIdx > i && !consumed.has(prevIdx) && grouped[prevIdx].type === 'dispel' && grouped[prevIdx].target === backEv.target) {
            backDispel = grouped[prevIdx];
            consumed.add(prevIdx);
          }
          consumed.add(backIdx);
          events.push({
            ...ev,
            pierceHit: backDispel ? { ...backEv, dispel: backDispel } : backEv,
          });
          continue;
        }
      }
      events.push(ev);
    }
    this.onEvent = onEvent;
    this.onComplete = onComplete;
    this.playedIndex = 0;
    this.events = events;
    this.started = performance.now();
    this.duration = 0;
    const speed = Math.max(1, Math.min(3, Number(this.settings.combatSpeed) || 1));
    const lastEvent = events.at(-1);
    const victoryHold = Math.round((lastEvent?.type === 'room-clear' ? 900 : 0) / speed);
    const actionEvents = victoryHold ? events.slice(0, -1) : events;
    const rawEnds = actionEvents.map(event => {
      const action = ['projectile', 'attack', 'mirror-reflect', 'ember-thorns', 'storm-static', 'nether-curse', 'cosmic-echo', 'blast', 'shield', 'shield-delay', 'fizzle', 'blackhole-open', 'boss-phase', 'timestop', 'ascension', 'ascension-ready', 'summon', 'summon_invoke', 'summon_hit', 'summon_strike', 'summon_relay', 'summon_counter', 'summon_break', 'summon_rebirth'].includes(event.type)
        || Boolean(event.specialBoss && event.type === 'charge');
      const ultBonus = (event.ultimate && event.type === 'attack') ? 180 : event.type === 'boss-phase' ? 280 : 0;
      const wardHold = event.type === 'projectile' && event.blocked ? 160 : 0;
      const baseStep = this.settings.reducedMotion ? (action ? 200 : 110) : (action ? 520 : 260) + wardHold + ultBonus;
      this.duration += Math.round(baseStep / speed);
      return this.duration;
    });
    const minDuration = Math.round((this.settings.reducedMotion ? 500 : 1500) / speed);
    const maxDuration = Math.round((this.settings.reducedMotion ? 1200 : 3400) / speed);
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
    let curProtection = shieldProtection(this.state?.player.shield);
    const curPositions = [...basePositions];
    const curDead = new Set();
    const curWards = Object.fromEntries(enemies.map(e => [e.id, e.ward]));
    const oldPuddles = new Set(this.state?.magmaPuddles);
    const newPuddles = new Set();
    let oldBlackhole = this.state?.blackhole?.slot;
    let newBlackhole;
    const initialSummon = this.state?.player?.summon || this.state?.summon;
    let curSummon = initialSummon && initialSummon.hp > 0 ? { ...initialSummon } : null;
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
        summon: curSummon ? { ...curSummon } : null,
      });
      const ev = this.events[i];
      if (!ev) break;
      const start = this.eventStart(i);
      const contact = start + this.eventContactDelay(i);
      if (ev.type === 'projectile' && ev.form === 'spear' && ev.pierceHit) {
        const duration = this.eventEnds[i] - start;
        const frontIdx = enemies.findIndex(enemy => enemy.id === ev.target);
        const backIdx = enemies.findIndex(enemy => enemy.id === ev.pierceHit.target);
        const frontBaseX = curPositions[frontIdx] ?? 180;
        const backBaseX = curPositions[backIdx] ?? Math.min(290, frontBaseX + 36);
        const frontTargetX = ev.blocked && enemies[frontIdx]
          ? frontBaseX - this.enemyWardWidth(enemies[frontIdx]) / 2 + 3
          : frontBaseX;
        const backTargetX = ev.pierceHit.blocked && enemies[backIdx]
          ? backBaseX - this.enemyWardWidth(enemies[backIdx]) / 2 + 3
          : backBaseX;
        const backContactFrac = this.settings.reducedMotion ? 0 : 0.72;
        const frontRatio = Math.max(0.28, Math.min(0.84, (frontTargetX - 76) / Math.max(1, backTargetX - 76)));
        const frontContactFrac = this.settings.reducedMotion ? 0 : backContactFrac * frontRatio;
        ev.frontContactFrac = frontContactFrac;
        ev.backContactFrac = backContactFrac;
        const frontAt = start + duration * frontContactFrac;
        const backAt = start + duration * backContactFrac;
        if (ev.blocked && ev.target) {
          curWards[ev.target] = Math.max(0, (curWards[ev.target] ?? 0) - 1);
          ev.wardRemaining = curWards[ev.target];
        }
        if ((ev.killed || ev.damage?.killed) && ev.target && deathStartMs[ev.target] === undefined) {
          curDead.add(ev.target);
          deathStartMs[ev.target] = frontAt;
        }
        this.contacts.push({ event: { ...ev, pierceHit: undefined }, at: frontAt, index: i });
        if (ev.pierceHit.dispel && ev.pierceHit.target) {
          const dispelEv = ev.pierceHit.dispel;
          curWards[ev.pierceHit.target] = Math.max(0, (curWards[ev.pierceHit.target] ?? 0) - (dispelEv.amount ?? 1));
          dispelEv.wardRemaining = curWards[ev.pierceHit.target];
          const dispelAt = start + duration * Math.max(frontContactFrac + 0.03, backContactFrac - 0.05);
          this.contacts.push({ event: dispelEv, at: dispelAt, index: i });
        }
        if (ev.pierceHit.blocked && ev.pierceHit.target) {
          curWards[ev.pierceHit.target] = Math.max(0, (curWards[ev.pierceHit.target] ?? 0) - 1);
          ev.pierceHit.wardRemaining = curWards[ev.pierceHit.target];
        }
        if ((ev.pierceHit.killed || ev.pierceHit.damage?.killed) && ev.pierceHit.target && deathStartMs[ev.pierceHit.target] === undefined) {
          curDead.add(ev.pierceHit.target);
          deathStartMs[ev.pierceHit.target] = backAt;
        }
        this.contacts.push({ event: { ...ev.pierceHit, spearPierceSilentLaunch: true }, at: backAt, index: i });
      } else {
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
        if ((ev.type === 'dispel' || (ev.type === 'projectile' && ev.blocked)) && ev.target) {
          const removed = ev.type === 'dispel' ? ev.amount : 1;
          curWards[ev.target] = Math.max(0, (curWards[ev.target] ?? 0) - removed);
          ev.wardRemaining = curWards[ev.target];
        }
        this.contacts.push({ event: ev, at: contact, index: i });
      }
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
      if (ev.type === 'shield') curProtection = ev.protection ?? ev;
      else if (ev.type === 'brace') curProtection = ev.protection;
      else if (ev.type === 'attack' || ev.type === 'mirror-reflect' || ev.type === 'ember-thorns' || ev.type === 'storm-static' || ev.type === 'nether-curse' || ev.type === 'cosmic-echo') curProtection = ev.protection;
      else if (ev.type === 'blast' && ev.protection) curProtection = ev.protection;
      if (ev.type === 'summon_invoke') {
        curSummon = {
          creatureId: ev.creature,
          name: ev.name || ev.creature,
          element: ev.element,
          isGrand: Boolean(ev.isGrand),
          hp: ev.hp,
          maxHp: ev.maxHp ?? ev.hp,
          armor: ev.armor ?? 0,
          ward: ev.ward ?? 0,
          counter: ev.counter ?? 0,
          strike: ev.strike ?? 0,
          aoeIntercept: Boolean(ev.aoeIntercept),
        };
      } else if (ev.type === 'summon_hit' && curSummon) {
        curSummon = {
          ...curSummon,
          hp: Math.max(0, ev.hpRemaining ?? (curSummon.hp - (ev.damage ?? 0))),
        };
      } else if (ev.type === 'ward_absorb' && ev.target === 'summon' && curSummon) {
        curSummon = { ...curSummon, ward: Math.max(0, (curSummon.ward ?? 0) - 1) };
      } else if (ev.type === 'summon_rebirth' && curSummon) {
        curSummon = { ...curSummon, hp: ev.hp ?? Math.ceil((curSummon.maxHp ?? 1) / 2) };
      } else if (['summon_break', 'summon_depart', 'phoenix_revive', 'cheat_death'].includes(ev.type)) {
        curSummon = null;
      }
    }
    this.deathStartMs = deathStartMs;
  }
  eventStart(index) {
    return this.eventEnds[index - 1] ?? 0;
  }
  eventContactDelay(index) {
    if (this.settings.reducedMotion) return 0;
    const event = this.events[index];
    const contact = ['projectile', 'mirror-reflect', 'ember-thorns', 'storm-static', 'nether-curse', 'cosmic-echo'].includes(event.type)
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
    if ((this.state?.room === FLOOR30_BOSS_ROOM || this.state?.room === FLOOR40_BOSS_ROOM || this.state?.room === FLOOR50_BOSS_ROOM || this.state?.room === FLOOR60_BOSS_ROOM || this.state?.room === FLOOR70_BOSS_ROOM) && this.state.enemies?.some(e => resolveBossArt(e.kind, this.bossVisuals) && resolveBossLayer(e.kind, this.bossVisuals) === 'rear')) {
      const mode = this.bossVisuals?.rearFormation ?? 'B';
      const isF50 = this.state?.room === FLOOR50_BOSS_ROOM;
      const isF60OrF70 = this.state?.room === FLOOR60_BOSS_ROOM || this.state?.room === FLOOR70_BOSS_ROOM;
      const map = isF60OrF70
        ? { boss: 228, m0: 172, m1: 220, m2: 268 }
        : isF50
          ? { boss: 226, m0: 172, m1: 220, m2: 268 }
          : mode === 'A'
            ? { boss: 244, m0: 167, m1: 208 }
            : mode === 'C'
              ? { boss: 225, m0: 190, m1: 260 }
              : { boss: 230, m0: 195, m1: 260 };
      if (enemy && resolveBossLayer(enemy.kind, this.bossVisuals) === 'rear') return map.boss;
      const minions = this.state.enemies.filter(e => !resolveBossArt(e.kind, this.bossVisuals) || resolveBossLayer(e.kind, this.bossVisuals) !== 'rear');
      const mIdx = minions.findIndex(e => (enemy?.id !== undefined && e.id === enemy.id) || e.slot === slot);
      if (mIdx === 0) return map.m0;
      if (mIdx === 1) return map.m1;
      if (mIdx === 2 && map.m2 !== undefined) return map.m2;
    }
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
  drawBossLocalEffects(effects, metrics, now, partStates = null) {
    if (!effects?.length || !metrics) return;
    const resolvePt = (anchorKey, partKey, dx = 0, dy = 0) => {
      const pt = metrics[anchorKey];
      if (!pt) return null;
      const ps = partKey ? partStates?.[partKey] : null;
      return {
        x: Math.round(pt.x + (ps?.dx ?? 0) + dx),
        y: Math.round(pt.y + (ps?.dy ?? 0) + dy),
      };
    };
    for (const fx of effects) {
      if (fx.type === 'groundShadow') {
        this.pixelEllipse(metrics.ground.x, 146, fx.rx ?? 18, fx.ry ?? 3, fx.color ?? C[fx.colorIndex ?? 0], false);
      } else if (fx.type === 'groundSpark') {
        this.pixelDiamond(metrics.ground.x + (fx.dx ?? 0), fx.y ?? 145, fx.radius ?? 1, fx.color ?? C[fx.colorIndex ?? 27], fx.coreColor ?? C[fx.coreIndex ?? 9]);
      } else if (fx.type === 'anchorBolt') {
        const pt = resolvePt(fx.anchor, fx.part);
        if (pt) {
          this.pixelBolt(pt.x + (fx.dx1 ?? 0), pt.y + (fx.dy1 ?? 0), pt.x + (fx.dx2 ?? 0), pt.y + (fx.dy2 ?? 0), fx.seed ?? now * 0.05, fx.color ?? C[fx.colorIndex ?? 27], fx.coreColor ?? C[fx.coreIndex ?? 9]);
        }
      } else if (fx.type === 'linkBolt') {
        const a = resolvePt(fx.from, fx.fromPart, fx.dx1 ?? 0, fx.dy1 ?? 0);
        const b = resolvePt(fx.to, fx.toPart, fx.dx2 ?? 0, fx.dy2 ?? 0);
        if (a && b) {
          this.pixelBolt(a.x, a.y, b.x, b.y, fx.seed ?? now * 0.06, fx.color ?? C[fx.colorIndex ?? 27], fx.coreColor ?? C[fx.coreIndex ?? 9]);
        }
      } else if (fx.type === 'orbitDiamonds') {
        for (const key of fx.anchors ?? []) {
          const anchor = metrics[key];
          if (!anchor) continue;
          const count = fx.count ?? 3;
          for (let i = 0; i < count; i++) {
            const ang = now / (fx.speed ?? 240) + i * ((Math.PI * 2) / count);
            const px = Math.round(anchor.x + Math.cos(ang) * (fx.rx ?? 11));
            const py = Math.round(anchor.y + (fx.offsetY ?? 0) + Math.sin(ang) * (fx.ry ?? 7));
            this.pixelDiamond(px, py, i === 0 ? 2 : 1, fx.color ?? C[27], fx.coreColor ?? C[9]);
          }
        }
      } else if (fx.type === 'fateThread') {
        const a = metrics[fx.from];
        const b = metrics[fx.to];
        if (!a || !b) continue;
        const ax = a.x + (fx.dx1 ?? 0);
        const ay = a.y + (fx.dy1 ?? 0);
        const bx = b.x + (fx.dx2 ?? 0);
        const by = b.y + (fx.dy2 ?? 0);
        const steps = 10;
        const g = this.ctx;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const px = Math.round(ax + (bx - ax) * t);
          const py = Math.round(ay + (by - ay) * t + Math.sin(t * Math.PI) * (fx.sag ?? 3));
          const isPulse = !this.settings.reducedMotion && ((i + (fx.phase ?? 0)) % 5 === 0);
          g.fillStyle = isPulse ? (fx.pulseColor ?? '#ffffff') : (fx.color ?? '#d982ff');
          g.fillRect(px, py, 1, 1);
        }
      }
    }
  }
  getEnemyVisualMetrics(enemy, x, baseline = 146, bob = 0) {
    const bossV2 = enemy ? resolveBossArt(enemy.kind, this.bossVisuals) : null;
    if (!bossV2) return null;
    return getBossVisualBounds(enemy.kind, x, baseline, bob, bossV2, this.bossVisuals);
  }
  hitTest(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * 320 / rect.width;
    const y = (clientY - rect.top) * 180 / rect.height;
    const positions = this.positions();
    // Check foreground actors first, then rear-layer bosses
    const ordered = (this.state?.enemies ?? [])
      .map((enemy, i) => ({ enemy, i, rear: resolveBossLayer(enemy.kind, this.bossVisuals) === 'rear' ? 1 : 0 }))
      .sort((a, b) => a.rear - b.rear || a.i - b.i);
    for (const { enemy, i } of ordered) {
      if (enemy.hp <= 0) continue;
      const metrics = this.getEnemyVisualMetrics(enemy, positions[i], 146, 0);
      if (metrics) {
        if (x >= metrics.left && x <= metrics.right && y >= metrics.top && y <= metrics.bottom) return enemy.id;
      } else if (y >= 70 && y <= 153 && Math.abs(positions[i] - x) < (LARGE_BOSS_KINDS.has(enemy.kind) || ['elite', 'sentinel'].includes(enemy.kind) ? 30 : 23)) {
        return enemy.id;
      }
    }
    return null;
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
  sprite(kind, x, baseline, frame, pose = 'idle', hitElement = null, progress = 0, alternate = false) {
    const g = this.ctx;
    const boss = LARGE_BOSS_KINDS.has(kind);
    const originalKind = kind;
    kind = Object.hasOwn(middleSprites, kind) ? kind : (ENEMIES[kind]?.sprite ?? kind);
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
    const bossV2 = resolveBossArt(originalKind, this.bossVisuals);
    if (bossV2) {
      const bounds = bossV2.opaqueBounds;
      const v2Scale = resolveBossScale(originalKind, bossV2, this.bossVisuals);
      const offset = resolveBossOffset(originalKind, this.bossVisuals);
      const centerX = (bounds.minX + bounds.maxX + 1) / 2;
      const v2Left = Math.round(x + offset.x - centerX * v2Scale);
      const v2Top = Math.round(baseline + bob + offset.baseline - (bounds.maxY + 1) * v2Scale);
      const attacking = pose === 'attack';
      const charging = pose === 'charge';
      const anim = evaluateBossAnimation(bossV2, {
        frame,
        pose,
        progress,
        reducedMotion: Boolean(this.settings.reducedMotion),
        now: performance.now(),
        colors: bossV2.colors,
        attacking,
        charging,
        hurt: pose === 'hurt',
        armor: this._bossArmor ?? null,
        grounded: Boolean(this._bossGrounded),
        reflecting: Boolean(this._bossReflecting),
      });
      drawBossArt(g, bossV2, v2Left, v2Top, v2Scale, anim.materialOverrides, anim.partStates);
      return;
    }
    const palette = originalKind === 'wizard' ? C : (alternate ? this.alternateEnemyPalette : this.enemyPalette) ?? C;
    const idleFrame = this.settings.reducedMotion ? 0 : frame;
    if (GEAR_RIFT_SPRITE_KINDS.has(originalKind)) {
      if (drawNewTowerSprite(originalKind, r, palette, pose, idleFrame, this.settings.reducedMotion, alternate)) return;
    }
    if (this.artFloor >= 6) {
      if (drawNewTowerSprite(originalKind, r, palette, pose, idleFrame, this.settings.reducedMotion, alternate)) return;
      if (Object.hasOwn(towerEnemyArt, originalKind)) {
        towerEnemyArt[originalKind](r, palette, pose, idleFrame);
        return;
      }
    }
    const art = spriteFrame(originalKind, pose, frame, progress, this.settings.reducedMotion);
    const image = this.spriteArt[originalKind];
    if (art && image?.complete && image.naturalWidth) {
      g.drawImage(image, art.index * art.size, art.row * art.size, art.size, art.size,
        Math.round(x - art.pivot[0]), Math.round(baseline - art.pivot[1]), art.size, art.size);
      drawTowerFittings(originalKind, this.artFloor ?? 0, r, palette);
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
    } else if (Object.hasOwn(middleSprites, kind)) {
      const colors = kind === 'eternity_overlord' || kind === 'eternity_reborn' ? C : palette;
      middleSprites[kind](r, colors, pose, idleFrame);
      drawTowerFittings(originalKind, this.artFloor ?? 0, r, colors);
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

  pixelCircle(cx, cy, radius, color, filled = false, thickness = 1) {
    const g = this.ctx;
    const r = Math.max(1, Math.round(radius));
    const t = Math.max(1, Math.min(r, Math.round(thickness)));
    const r2 = r * r;
    const inner = Math.max(0, r - 1.35 * t);
    const inner2 = inner * inner;
    g.fillStyle = color;
    const minDy = Math.max(-r, -Math.round(cy));
    const maxDy = Math.min(r, 180 - Math.round(cy));
    for (let dy = minDy; dy <= maxDy; dy++) {
      const dy2 = dy * dy;
      const maxDx = Math.floor(Math.sqrt(Math.max(0, r2 - dy2)));
      if (filled) {
        g.fillRect(Math.round(cx - maxDx), Math.round(cy + dy), maxDx * 2 + 1, 1);
      } else {
        const minDx = dy2 < inner2 ? Math.ceil(Math.sqrt(inner2 - dy2)) : 0;
        const span = Math.max(t, maxDx - minDx + 1);
        g.fillRect(Math.round(cx - maxDx), Math.round(cy + dy), span, 1);
        if (maxDx > 0) g.fillRect(Math.round(cx + minDx), Math.round(cy + dy), span, 1);
      }
    }
  }

  pixelEllipse(cx, cy, rx, ry, color, filled = false, thickness = 1) {
    const g = this.ctx;
    const a = Math.max(1, Math.round(rx));
    const b = Math.max(1, Math.round(ry));
    const t = Math.max(1, Math.round(thickness));
    g.fillStyle = color;
    const minDy = Math.max(-b, -Math.round(cy));
    const maxDy = Math.min(b, 180 - Math.round(cy));
    for (let dy = minDy; dy <= maxDy; dy++) {
      const normY = dy / b;
      const maxDx = Math.round(a * Math.sqrt(Math.max(0, 1 - normY * normY)));
      if (filled) {
        g.fillRect(Math.round(cx - maxDx), Math.round(cy + dy), maxDx * 2 + 1, 1);
      } else {
        const edgeW = Math.min(maxDx + 1, Math.max(2, t * 2));
        g.fillRect(Math.round(cx - maxDx), Math.round(cy + dy), edgeW, 1);
        g.fillRect(Math.round(cx + maxDx - edgeW + 1), Math.round(cy + dy), edgeW, 1);
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
      const coreHalf = Math.max(1, Math.floor(s / 3));
      g.fillStyle = coreColor;
      g.fillRect(x - coreHalf, y, coreHalf * 2 + 1, 1);
      g.fillRect(x, y - coreHalf, 1, coreHalf * 2 + 1);
    }
  }

  pixelBolt(x1, y1, x2, y2, seed, auraColor, coreColor = C[9], thickness = 1) {
    const g = this.ctx;
    const t = Math.max(1, Math.min(5, Math.round(thickness)));
    const steps = Math.max(4, Math.floor(Math.hypot(x2 - x1, y2 - y1) / 8));
    let px = x1;
    let py = y1;
    for (let i = 1; i <= steps; i++) {
      const frac = i / steps;
      const jitter = i === steps ? 0 : Math.sin(seed * 3.7 + i * 2.3) * 6 * Math.min(2.5, Math.sqrt(t));
      const nx = Math.round(x1 + (x2 - x1) * frac);
      const ny = Math.round(y1 + (y2 - y1) * frac + jitter);
      const segSteps = Math.max(1, Math.abs(nx - px), Math.abs(ny - py));
      for (let s = 0; s <= segSteps; s++) {
        const lx = Math.round(px + (nx - px) * (s / segSteps));
        const ly = Math.round(py + (ny - py) * (s / segSteps));
        g.fillStyle = auraColor;
        g.fillRect(lx - t, ly - t, t * 2 + 1, t * 2 + 1);
        g.fillStyle = coreColor;
        g.fillRect(lx - Math.floor((t - 1) / 2), ly - Math.floor((t - 1) / 2), t, t);
      }
      if (i % 2 === 1 && i < steps) {
        const bx = nx + (i % 4 === 1 ? 5 * t : -4 * t);
        const by = ny + (i % 4 === 1 ? -5 * t : 5 * t);
        g.fillStyle = auraColor;
        g.fillRect(Math.round((nx + bx) / 2), Math.round((ny + by) / 2), 1 + t, 1 + t);
        g.fillRect(bx, by, Math.max(1, t), Math.max(1, t));
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

  drawGravityWell(x, scale, now = 0) {
    const width = Math.round(16 * scale);
    const height = Math.round(7 * scale);
    this.pixelEllipse(x, 147, width + 5, height + 3, ELEMENT_IMPACT.blackhole.secondary, false);
    this.pixelEllipse(x, 147, width, height, ELEMENT_IMPACT.blackhole.primary, true);
    this.pixelEllipse(x, 147, Math.max(1, width - 3), Math.max(1, height - 2), C[0], true);
    if (!this.settings.reducedMotion) {
      for (let i = 0; i < 6; i++) {
        const ang = now / 130 + (i * Math.PI) / 3;
        const r = Math.round((width + 6) * (0.45 + ((i * 3 + Math.floor(now / 120)) % 4) * 0.18));
        const mx = Math.round(x + Math.cos(ang) * r);
        const my = Math.round(145 + Math.sin(ang) * Math.max(3, height * 0.65));
        this.pixelDiamond(mx, my, i % 2 ? 2 : 1, ELEMENT_IMPACT.blackhole.rim, ELEMENT_IMPACT.blackhole.core);
      }
    }
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

  drawSummonSprite(summon, x, baseline, frame, event, progress, deferHealth = false) {
    const g = this.ctx;
    const summonBeingHit = event && (
      event.type === 'summon_hit'
      || (event.type === 'attack' && event.target === 'summon' && (progress || 0) >= 0.62)
    );
    const lunge = (event && (event.type === 'summon_strike' || event.type === 'summon_relay') && !this.settings.reducedMotion)
      ? Math.round(Math.sin((progress || 0) * Math.PI) * 16)
      : (event && event.type === 'summon_counter' && !this.settings.reducedMotion)
        ? Math.round(Math.sin((progress || 0) * Math.PI) * 8)
        : (summonBeingHit && !this.settings.reducedMotion && frame % 2)
          ? -3
          : 0;
    const cid = summon.creatureId;
    const art = resolveSummonArt(cid, this.summonVisuals);
    const grand = Boolean(art && summon.isGrand);
    let scale = resolveCreatureScale(cid, grand, art, this.summonVisuals);
    if (grand && event?.type === 'summon_invoke' && !this.settings.reducedMotion) {
      const time = Math.max(0, Math.min(1, progress ?? 0));
      const pulse = Math.min(time / 0.28, (1 - time) / 0.72);
      const smooth = pulse * pulse * (3 - 2 * pulse);
      const peakScale = Math.max(scale, Math.min(4, (baseline - 2) / art.height, (x * 2) / art.width));
      scale += (peakScale - scale) * smooth;
    }
    const sx = x + lunge;
    const r = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(sx + a - 12, baseline + b - 24, w, h); };
    const bob = this.settings.reducedMotion ? 0 : [0, -1, 0, 1][frame % 4];
    const elem = summon.element;
    const artHeight = art ? Math.round(art.height * scale) : 0;
    const lift = art ? Math.min(Math.round(art.lift * scale), Math.max(0, baseline - artHeight - 6)) : 0;
    const artTop = art ? baseline - artHeight - lift + (lift ? bob : 0) : null;
    const elemImpact = ELEMENT_IMPACT[elem] || null;
    const fusion = fusionSummonPalette(elem, this.summonVisuals);
    const bodyColor = fusion?.shadow ?? elemImpact?.secondary ?? C[12];
    const highlight = fusion?.highlight ?? elemImpact?.primary ?? C[14];
    const coreColor = fusion?.core ?? elemImpact?.core ?? C[31];
    const rimColor = fusion?.rim ?? elemImpact?.rim ?? C[30];

    // Summon shadow and aura
    const auraRadius = art ? Math.round(art.width * scale * (lift ? 0.31 : 0.43)) : 12;
    g.fillStyle = C[0];
    g.fillRect(sx - auraRadius, baseline - 1, auraRadius * 2, 3);
    if (this.summonVisuals?.aura !== false) {
      const auraColor = fusion?.aura ?? elementColor[elem] ?? C[28];
      this.pixelEllipse(sx, baseline - 1, auraRadius, 3, auraColor, false);
      if (grand) this.pixelEllipse(sx, baseline - 1, auraRadius + 3, 5, rimColor, false);

      // Ambient floating elemental sparks
      if (elem && !this.settings.reducedMotion) {
        const sparkTick = Math.floor((this.summonVisuals?.previewTime ?? Date.now()) / 120);
        for (let i = 0; i < 3; i++) {
          const px = sx - 10 + ((frame * 7 + i * 9) % 20);
          const py = baseline - 8 - ((sparkTick + i * 5) % 18) + bob;
          g.fillStyle = i % 2 ? rimColor : fusion?.spark ?? highlight;
          g.fillRect(px, py, 2, 2);
        }
      }
    }

    if (art) {
      drawSummonArt(g, art, sx - Math.floor(art.width * scale / 2), artTop, scale,
        fusion ?? fusedSummonPalettes.get(elem) ?? elemImpact, this.summonVisuals?.marks);
    } else if (cid === 'bird') {
      r(13, 5 + bob, 6, 6, bodyColor);
      r(19, 7 + bob, 4, 2, rimColor);
      r(16, 6 + bob, 2, 2, coreColor);
      r(7, 9 + bob, 8, 8, bodyColor);
      r(6, 10 + bob, 7, 5, highlight);
      r(2, 12 + bob, 5, 4, highlight);
      r(9, 17 + bob, 2, 4, rimColor);
      r(12, 17 + bob, 2, 4, rimColor);
    } else if (cid === 'snake') {
      r(12, 4 + bob, 8, 7, highlight);
      r(14, 5 + bob, 6, 5, bodyColor);
      r(16, 6 + bob, 2, 2, coreColor);
      r(20, 8 + bob, 4, 1, C[18]);
      r(4, 12 + bob, 14, 5, bodyColor);
      r(6, 16 + bob, 14, 5, highlight);
      r(18, 18 + bob, 3, 3, rimColor);
    } else if (cid === 'slime') {
      r(4, 12 + bob, 16, 10, bodyColor);
      r(6, 7 + bob, 12, 6, bodyColor);
      r(9, 4 + bob, 6, 4, bodyColor);
      r(8, 6 + bob, 3, 3, coreColor);
      r(10, 13 + bob, 4, 4, rimColor);
      r(8, 11 + bob, 2, 3, C[0]);
      r(14, 11 + bob, 2, 3, C[0]);
    } else if (cid === 'turtle') {
      r(4, 8 + bob, 16, 11, bodyColor);
      r(3, 17 + bob, 18, 3, highlight);
      r(7, 10 + bob, 4, 4, highlight);
      r(13, 10 + bob, 4, 4, highlight);
      r(19, 11 + bob, 5, 5, bodyColor);
      r(21, 12 + bob, 2, 2, coreColor);
      r(5, 19 + bob, 4, 5, bodyColor);
      r(13, 19 + bob, 4, 5, bodyColor);
    } else if (cid === 'frog') {
      r(6, 4 + bob, 4, 4, highlight);
      r(14, 4 + bob, 4, 4, highlight);
      r(8, 5 + bob, 2, 2, C[0]);
      r(14, 5 + bob, 2, 2, C[0]);
      r(5, 8 + bob, 14, 4, bodyColor);
      r(6, 11 + bob, 12, 8, highlight);
      r(2, 13 + bob, 4, 9, bodyColor);
      r(18, 13 + bob, 4, 9, bodyColor);
      r(7, 19 + bob, 3, 4, bodyColor);
      r(14, 19 + bob, 3, 4, bodyColor);
    } else if (cid === 'bear') {
      r(4, 5 + bob, 16, 13, bodyColor);
      r(13, 3 + bob, 3, 3, highlight);
      r(18, 3 + bob, 3, 3, highlight);
      r(17, 8 + bob, 6, 5, highlight);
      r(16, 7 + bob, 2, 2, coreColor);
      r(5, 17 + bob, 5, 7, bodyColor);
      r(14, 17 + bob, 5, 7, bodyColor);
    } else if (cid === 'boar') {
      r(18, 9 + bob, 3, 4, coreColor);
      r(19, 7 + bob, 2, 3, coreColor);
      r(17, 10 + bob, 4, 4, highlight);
      r(15, 8 + bob, 2, 2, rimColor);
      r(6, 4 + bob, 10, 3, highlight);
      r(4, 7 + bob, 13, 11, bodyColor);
      r(5, 18 + bob, 3, 6, bodyColor);
      r(13, 18 + bob, 3, 6, bodyColor);
    } else {
      r(6, 4 + bob, 12, 16, bodyColor);
      r(8, 6 + bob, 8, 12, highlight);
      r(9, 8 + bob, 2, 2, coreColor);
      r(13, 8 + bob, 2, 2, coreColor);
      r(4, 10 + bob, 3, 8, bodyColor);
      r(17, 10 + bob, 3, 8, bodyColor);
    }

    const drawHealth = () => {
      const hpRatio = Math.max(0, Math.min(1, summon.hp / Math.max(1, summon.maxHp)));
      const barW = art ? Math.min(32, Math.max(20, Math.round(art.width * scale * 0.65))) : 20;
      const barX = sx - Math.floor(barW / 2);
      const barY = artTop === null ? baseline - 28 + bob : Math.max(5, artTop - 5);
      const fillW = hpRatio > 0 ? Math.max(1, Math.round(barW * hpRatio)) : 0;
      const fillColor = hpRatio > 0.5 ? C[26] : hpRatio > 0.25 ? C[30] : C[18];
      g.fillStyle = C[0]; g.fillRect(barX - 1, barY - 1, barW + 2, 4);
      g.fillStyle = C[16]; g.fillRect(barX, barY, barW, 2);
      if (fillW > 0) {
        g.fillStyle = fillColor; g.fillRect(barX, barY, fillW, 2);
      }
    };
    if (deferHealth) return drawHealth;
    drawHealth();
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
    const bhScale = vfxScale(this.state?.blackhole);
    for (const slot of blackholes) this.drawGravityWell(this.puddleX(slot), bhScale, now);
    if (event?.type === 'blackhole-open') {
      const openScale = vfxScale(event) * (this.settings.reducedMotion ? 1 : Math.max(0.25, progress));
      this.drawGravityWell(this.puddleX(event.slot), openScale, now);
      if (!this.settings.reducedMotion) this.drawSpecialVfx('blackhole', this.puddleX(event.slot), 140, progress, vfxScale(event));
    }
    if (!playing && this.target?.startsWith('slot-')) {
      this.pixelEllipse(this.puddleX(Number(this.target.at(-1))), 150, 15, 4, elementColor.blackhole, false);
    }

    let activeSummon = playing && snap ? snap.summon : (this.state?.player?.summon || this.state?.summon);
    if (event?.type === 'summon_invoke') {
      activeSummon = {
        creatureId: event.creature,
        name: event.name || event.creature,
        element: event.element,
        isGrand: Boolean(event.isGrand),
        hp: event.hp,
        maxHp: event.maxHp ?? event.hp,
      };
    } else if (event?.type === 'summon_hit' && activeSummon) {
      activeSummon = {
        ...activeSummon,
        hp: Math.max(0, event.hpRemaining ?? (activeSummon.hp - (event.damage ?? 0))),
      };
    } else if (event?.type === 'summon_rebirth' && activeSummon) {
      activeSummon = { ...activeSummon, hp: event.hp ?? Math.ceil((activeSummon.maxHp ?? 1) / 2) };
    }
    const showSummon = activeSummon && (activeSummon.hp > 0
      || ['summon_hit', 'summon_counter', 'summon_rebirth', 'summon_break'].includes(event?.type));
    const summonAnchor = getSummonAnchor(activeSummon, this.summonVisuals);
    const grandBehindActors = showSummon && activeSummon.isGrand
      && Object.hasOwn(SUMMON_ART, activeSummon.creatureId);
    const drawGrandHealth = grandBehindActors
      ? this.drawSummonSprite(activeSummon, summonAnchor.x, summonAnchor.baseline, frame, event, progress, true) : null;

    const isCastingEvent = ['projectile', 'shield', 'shield-delay', 'heal', 'blast', 'fizzle', 'blackhole-open', 'timestop', 'ascension', 'summon', 'summon_invoke'].includes(event?.type)
      || (event?.type === 'damage' && event.element === 'death');
    const playerPose = isCastingEvent ? 'cast' : event?.type === 'attack' && impact && event.amount > 0 ? 'hurt' : this.state?.player.hp === 0 ? 'dead' : 'idle';
    g.fillStyle = C[0]; g.fillRect(38, 146, 27, 3);
    if (isCastingEvent && event.type !== 'fizzle' && !this.settings.reducedMotion) {
      const castColor = elementColor[event?.element] ?? (event?.type === 'heal' ? C[26] : event?.type === 'shield' ? C[27] : C[31]);
      this.drawCasterAura(now, castColor, progress);
    }
    this.sprite('wizard', 51 + (playerPose === 'hurt' && !this.settings.reducedMotion && frame % 2 ? -2 : 0), 147, frame, playerPose, null, progress);

    let protection = snap?.protection ?? shieldProtection(this.state?.player.shield);
    if (event?.type === 'shield') protection = event.protection ?? event;
    if (event?.type === 'brace') protection = event.protection;
    if (event?.type === 'blast' && event.protection) protection = event.protection;
    const playerAbsorbed = event?.playerAbsorbed ?? (event?.target === 'summon' ? 0 : (event?.absorbed ?? 0));
    const shieldHit = impact && playerAbsorbed > 0;
    const shieldCasting = event?.type === 'shield';
    if (protection.amount || shieldHit) {
      const [front, back] = protection.layerEffects ?? [];
      const primaryElem = front?.[0] ?? protection.element ?? protection.elements?.[0] ?? protection.shieldKind;
      const secondaryElem = back?.[0] ?? front?.[1] ?? protection.element ?? protection.elements?.[1];
      const shieldOpts = {
        grand: Boolean(protection.grand),
        large: Boolean(protection.large),
        shieldKind: protection.shieldKind ?? protection.element ?? event?.shieldKind ?? 'shield',
        restored: Boolean(protection.restored),
      };
      const shieldScale = shieldOpts.grand ? 5 : shieldOpts.large ? 2 : 1;
      const outerLayers = Math.max(protection.layers - 1, front?.[1] ? 1 : 0);
      for (let layer = outerLayers; layer > 0; layer--) {
        const element = protection.layerEffects?.[layer]?.[0] ?? secondaryElem;
        const outerW = Math.round((42 + 6 * layer) * shieldScale);
        const outerTop = 148 - Math.round((45 + 4 * layer) * shieldScale);
        this.barrier(51, outerTop, outerW, elementColor[element] ?? C[26], false, element, now, shieldCasting ? progress : 1, true, shieldOpts);
      }
      const shieldBroke = shieldHit && protection.layers > (event.protection?.layers ?? 0);
      const shieldImpact = shieldHit && protection.layers > 0 && event.type === 'attack' && !this.settings.reducedMotion
        && drawCombatSprite(g, combatSpriteSheets.shieldBlock, Math.max(0, (progress - 0.62) / 0.38) * (shieldBroke ? 1 : 0.40), 51, 146, 0.76 * shieldScale);
      if (!shieldImpact || !shieldBroke) {
        const baseDomeW = shieldOpts.shieldKind === 'guard' ? 34 : 42;
        const baseDomeH = shieldOpts.shieldKind === 'guard' ? 38 : 45;
        const domeW = Math.round(baseDomeW * shieldScale);
        const domeTop = 148 - Math.round(baseDomeH * shieldScale);
        this.barrier(51, domeTop, domeW, elementColor[primaryElem] ?? (shieldOpts.shieldKind === 'guard' ? C[14] : C[27]), shieldHit && !shieldImpact && !this.settings.reducedMotion, primaryElem, now, shieldCasting && !this.settings.reducedMotion ? progress : 1, false, shieldOpts);
      }
      if (shieldCasting && primaryElem === 'veil' && !this.settings.reducedMotion) this.drawSpecialVfx('veil', 51, 120, progress, shieldScale);
      if (shieldCasting && !event.secondary && primaryElem !== 'veil' && !this.settings.reducedMotion) {
        const shieldElements = [...new Set((protection.layerEffects ?? []).flat().filter(Boolean))];
        if (!shieldElements.length && ELEMENT_IMPACT[primaryElem]) shieldElements.push(primaryElem);
        this.drawShieldCastVfx(51, 119, progress, shieldScale, shieldElements, shieldOpts.shieldKind, protection.layers ?? 1);
      }
      const shieldName = protection.element === 'veil' ? 'ม่าน' : protection.element === 'brace' ? 'โล่ยืนหยัด' : shieldOpts.grand ? 'มหาโล่' : 'โล่';
      this.barrierLabel(51, 79, shieldHit ? `กัน ${playerAbsorbed}${shieldBroke ? ` · ${shieldName}แตก` : ''}` : `${shieldName} ${protection.amount}`, shieldHit ? C[9] : C[8]);
    }

    if (showSummon && !grandBehindActors) {
      this.drawSummonSprite(activeSummon, summonAnchor.x, summonAnchor.baseline, frame, event, progress);
    }

    const orderedEnemies = this.state ? this.state.enemies
      .map((enemy, index) => ({ enemy, index, rear: resolveBossLayer(enemy.kind, this.bossVisuals) === 'rear' ? 0 : 1 }))
      .sort((a, b) => a.rear - b.rear || a.index - b.index) : [];
    orderedEnemies.forEach(({ enemy, index }) => {
      const alternateArt = this.alternateEnemyIds?.has(enemy.id);
      const x = positions[index];
      let moveSlot;
      if (event?.type === 'swap' && event.source === enemy.id) moveSlot = event.sourceSlot;
      else if (['swap', 'push'].includes(event?.type) && event.target === enemy.id) moveSlot = event.slot;
      const movingX = moveSlot === undefined ? x : Math.round(x + (this.enemyX(enemy, moveSlot) - x) * (this.settings.reducedMotion ? 1 : progress));
      const blastHit = event?.type === 'blast' ? event.hits.find(hit => hit.damage.target === enemy.id) : null;
      const blastLanded = blastHit && (this.settings.reducedMotion || progress >= blastHit.arrival);
      const spearFrontLanded = event?.type === 'projectile' && Boolean(event.pierceHit) && event.target === enemy.id
        && (this.settings.reducedMotion || progress >= (event.frontContactFrac ?? 0.45));
      const spearBackLanded = event?.type === 'projectile' && Boolean(event.pierceHit) && event.pierceHit.target === enemy.id
        && (this.settings.reducedMotion || progress >= (event.backContactFrac ?? 0.72));
      const landed = blastLanded
        ? blastHit.damage
        : spearFrontLanded
          ? event.damage
          : spearBackLanded
            ? event.pierceHit.damage
            : (!event?.pierceHit && impact && event?.target === enemy.id ? event.damage : null);
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

      const v2Bob = this.settings.reducedMotion ? 0 : [0, -1, 0, 1][frame % 4];
      const v2Metrics = this.getEnemyVisualMetrics(enemy, movingX + lunge, 146, v2Bob);

      if (!gone && this.target === enemy.id) {
        const ringX = v2Metrics ? v2Metrics.ground.x : x;
        const ringRx = v2Metrics ? Math.max(20, Math.round(v2Metrics.ward.width * 0.45)) : (LARGE_BOSS_KINDS.has(enemy.kind) || ['elite', 'sentinel'].includes(enemy.kind) ? 22 : 15);
        this.pixelEllipse(ringX, 147, ringRx, 3, C[30], false);
        g.fillStyle = C[9];
        g.fillRect(ringX - 6, 153, 12, 1); g.fillRect(ringX - 3, 155, 6, 1);
      }

      const ward = snap ? (snap.wards[enemy.id] ?? enemy.ward) : enemy.ward;
      const spearFrontWardHit = spearFrontLanded && event.blocked;
      const spearBackWardHit = spearBackLanded && event.pierceHit.blocked;
      const wardHit = ward > 0 && (
        spearFrontWardHit
        || spearBackWardHit
        || (!event?.pierceHit && impact && event?.target === enemy.id
          && (event.type === 'dispel' || (event.type === 'projectile' && event.blocked)))
      );
      const wardHitRemaining = spearFrontWardHit
        ? event.wardRemaining
        : spearBackWardHit
          ? event.pierceHit.wardRemaining
          : event?.wardRemaining;
      const wardBroke = wardHit && wardHitRemaining === 0;
      const wardStartFrac = spearFrontWardHit
        ? (event.frontContactFrac ?? 0.45)
        : spearBackWardHit
          ? (event.backContactFrac ?? 0.72)
          : contactDelay / segment;
      const wardProgress = this.settings.reducedMotion ? 0 : Math.max(0, (progress - wardStartFrac) / Math.max(0.05, 1 - wardStartFrac));
      const artProgress = wardBroke ? wardProgress : progress;
      const supporting = enemy.kind === 'support' && event?.type === 'heal' && event.source === enemy.id;
      const reflecting = event?.type === 'mirror-reflect' && event.source === enemy.id;
      const pose = gone ? 'dead' : reflecting ? 'reflect' : wardBroke && enemy.kind === 'elite' ? 'break' : attacking || supporting ? 'attack'
        : enemy.kind === 'prism_crab' ? (enemy.armor <= 1 ? 'exposed' : 'idle')
        : hurt ? 'hurt' : ['charger', 'sentinel', 'rune_golem', 'storm_titan'].includes(enemy.kind) && charging ? 'charge'
        : ['charger', 'sentinel', 'rune_golem', 'storm_titan'].includes(enemy.kind) && this.state.turn % 2 === 0 ? 'ready'
        : enemy.kind === 'elite' && ward > 0 ? 'ward' : 'idle';
      const spriteX = movingX + lunge + (hurt && frame % 2 && !this.settings.reducedMotion ? 3 : 0);
      if (attacking && lunge < -4 && !this.settings.reducedMotion) {
        g.save();
        g.globalAlpha = 0.28;
        this.sprite(enemy.kind, x + Math.round(lunge * 0.45), 146, frame, 'attack', null, progress, alternateArt);
        g.restore();
      }

      const bossV2Art = !gone && v2Metrics ? resolveBossArt(enemy.kind, this.bossVisuals) : null;
      const bossGrounded = Boolean(enemy.groundedUntil >= (this.state?.turn ?? 0));
      const bossReflecting = Boolean(event?.type === 'storm-static' && event.source === enemy.id);
      if (bossV2Art) {
        const v2Anim = evaluateBossAnimation(bossV2Art, {
          frame,
          pose,
          progress: artProgress,
          reducedMotion: Boolean(this.settings.reducedMotion),
          now,
          colors: bossV2Art.colors,
          attacking,
          charging,
          hurt,
          armor: enemy.armor,
          grounded: bossGrounded,
          reflecting: bossReflecting,
        });
        this.drawBossLocalEffects(v2Anim.effects, v2Metrics, now, v2Anim.partStates);
      }

      this._bossArmor = enemy.armor;
      this._bossGrounded = bossGrounded;
      this._bossReflecting = bossReflecting;
      this.sprite(enemy.kind, spriteX, 146, gone ? deathFrame : frame, pose, hurt ? hurtElement : null, artProgress, alternateArt);
      this._bossArmor = null;
      this._bossGrounded = false;
      this._bossReflecting = false;

      if ((enemy.hp > 0 && !dead?.has(enemy.id)) && ward > 0) {
        const isLargeBoss = LARGE_BOSS_KINDS.has(enemy.kind);
        const bossArt = enemy.kind === 'elite' && this.spriteArt.elite?.complete && this.spriteArt.elite.naturalWidth
          ? spriteFrame('elite', pose, frame, artProgress, this.settings.reducedMotion) : null;
        const wardX = v2Metrics ? v2Metrics.ward.centerX : bossArt ? Math.round(spriteX - bossArt.pivot[0] + bossArt.wardCenter[0]) : x;
        const top = v2Metrics ? Math.max(6, v2Metrics.ward.top - 4) : bossArt ? Math.round(146 - bossArt.pivot[1] + bossArt.wardCenter[1] - 30) : isLargeBoss ? 74 : 103;
        const width = v2Metrics ? v2Metrics.ward.width : this.enemyWardWidth(enemy);
        const remaining = wardHit ? wardHitRemaining : ward;
        if (remaining) this.drawEnemyWard(wardX, top, width, remaining);
        if (wardHit) {
          if (!this.settings.reducedMotion) this.drawWardImpact(wardX, top, width, wardBroke, wardProgress);
          const label = event.type === 'dispel' ? `สลายม่าน −${event.amount} ชั้น` : wardLabel(remaining);
          this.barrierLabel(wardX, top - 6, label, wardBroke ? '#f9eeff' : '#d6a2ff');
        } else if (impact && event?.type === 'projectile' && event.target === enemy.id && event.form === 'beam') {
          this.barrierLabel(wardX, top - 6, 'ทะลุม่าน', '#d6a2ff');
        }
      }

      if (!gone && enemy.chill) {
        const cxBase = v2Metrics ? v2Metrics.ward.centerX : x;
        const cyBase = v2Metrics ? v2Metrics.ward.bottom - 8 : 138;
        for (let i = 0; i < 3; i++) {
          const sx = cxBase - 12 + i * 12;
          const sy = cyBase - ((Math.floor(now / 150) + i * 3) % 10);
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
    drawGrandHealth?.();

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
      if (event.type === 'shield-delay' || (event.type === 'shield' && event.delayed)) {
        this.drawDelaySigil(51, event.delayed ? 91 : 109, progress, event.delayed);
      }
      if (['timestop', 'ascension', 'ascension-ready'].includes(event.type)) {
        this.drawLegendarySigil(event.type, progress);
      }
      if (event.type === 'seal' || event.type === 'ward-grant') {
        const targetIndex = this.state.enemies.findIndex(enemy => enemy.id === event.target);
        const targetX = positions[targetIndex] ?? x;
        const label = event.type === 'seal' ? 'ติดผนึก' : 'ม่านเทิร์นหน้า';
        if (!this.settings.reducedMotion && event.type !== 'ward-grant') this.drawModifierVfx(event.type, targetX, 120, fraction, true);
        this.barrierLabel(targetX, 94, label, '#d6a2ff');
      }
      if (event.type === 'projectile') {
        const isPiercingSpear = event.form === 'spear' && Boolean(event.pierceHit);
        const pierceFromIdx = !isPiercingSpear && event.form === 'spear' && event.spearPhase === 'pierce' && event.pierceFrom
          ? this.state.enemies.findIndex(enemy => enemy.id === event.pierceFrom)
          : -1;
        const startX = pierceFromIdx >= 0 ? (positions[pierceFromIdx] ?? 76) : 76;
        const startY = 120;
        const color = elementColor[event.element] ?? C[30];
        const secondColor = event.elements?.[1] ? (elementColor[event.elements[1]] ?? C[31]) : C[9];
        const projScale = vfxScale(event);

        if (isPiercingSpear) {
          const backIdx = this.state.enemies.findIndex(enemy => enemy.id === event.pierceHit.target);
          const backX = positions[backIdx] ?? Math.min(290, x + 36);
          const frontTarget = event.blocked && this.state.enemies[eventTargetIndex]
            ? x - this.enemyWardWidth(this.state.enemies[eventTargetIndex]) / 2 + 3
            : x;
          const backTarget = event.pierceHit.blocked && this.state.enemies[backIdx]
            ? backX - this.enemyWardWidth(this.state.enemies[backIdx]) / 2 + 3
            : backX;
          const frontContactFrac = event.frontContactFrac ?? 0.45;
          const backContactFrac = event.backContactFrac ?? 0.72;
          const travel = Math.min(1, fraction / Math.max(0.05, backContactFrac));
          const px = Math.round(startX + (backTarget - startX) * travel);
          const py = startY;
          const frontHit = this.settings.reducedMotion || fraction >= frontContactFrac;
          const backHit = this.settings.reducedMotion || fraction >= backContactFrac;
          if (!this.settings.reducedMotion && fraction < 0.35) {
            this.drawCastSigil(startX, startY, event.element, fraction / 0.35, projScale, secondColor, Boolean(event.elements?.[1]));
          }
          // Single continuous spear flying through front enemy to back enemy
          this.drawSpearVfx(startX, startY, backTarget, px, py, travel, fraction, event, secondColor, now, backContactFrac, {
            frontHit,
            frontTargetX: frontTarget,
            frontImpactFrac: frontHit ? Math.min(1, (fraction - frontContactFrac) / Math.max(0.12, 1 - frontContactFrac)) : 0,
            backHit,
            backEvent: event.pierceHit,
          });
          if (!this.settings.reducedMotion) {
            for (const modifier of event.visualModifiers ?? []) {
              if (travel < 1) this.drawModifierVfx(modifier, px, py, fraction, false);
            }
            for (const element of event.elements ?? [event.element]) {
              if (travel < 1) {
                this.drawHybridVfx(element, px, py, fraction, projScale, false);
                this.drawAscendedVfx(element, px, py, fraction, projScale, false);
                this.drawBasicElementVfx(element, px, py, fraction, projScale, false);
              }
              if (frontHit && !event.blocked && event.damage?.amount > 0) {
                const hitP = Math.min(1, (fraction - frontContactFrac) / Math.max(0.15, 1 - frontContactFrac));
                this.drawHybridVfx(element, x, 122, hitP, projScale, true);
                this.drawAscendedVfx(element, x, 122, hitP, projScale, true);
                this.drawBasicElementVfx(element, x, 122, hitP, projScale, true);
              }
              if (backHit && !event.pierceHit.blocked && event.pierceHit.damage?.amount > 0) {
                const hitP = Math.min(1, (fraction - backContactFrac) / Math.max(0.12, 1 - backContactFrac));
                this.drawHybridVfx(element, backX, 122, hitP, projScale, true);
                this.drawAscendedVfx(element, backX, 122, hitP, projScale, true);
                this.drawBasicElementVfx(element, backX, 122, hitP, projScale, true);
              }
            }
          }
          if (frontHit && event.damage) {
            const sinceFront = this.settings.reducedMotion ? 0 : Math.min(1, (fraction - frontContactFrac) / Math.max(0.15, 1 - frontContactFrac));
            this.drawDamagePopup(x, sinceFront, event.damage, color);
          }
          if (backHit && event.pierceHit.damage) {
            const sinceBack = this.settings.reducedMotion ? 0 : Math.min(1, (fraction - backContactFrac) / Math.max(0.12, 1 - backContactFrac));
            this.drawDamagePopup(backX, sinceBack, event.pierceHit.damage, color, 14);
          }
        } else {
          const targetEnemy = this.state.enemies[eventTargetIndex];
          const targetMetrics = this.getEnemyVisualMetrics(targetEnemy, x, 146, 0);
          const wardCenter = targetMetrics ? targetMetrics.ward.centerX : x;
          const wardW = targetMetrics ? targetMetrics.ward.width : this.enemyWardWidth(targetEnemy);
          const impactX = targetMetrics ? targetMetrics.chest.x : x;
          const impactY = targetMetrics ? targetMetrics.chest.y : startY;
          const travel = Math.min(1, fraction / 0.65);
          const target = event.blocked && ['shot', 'chakram', 'spear', 'axe'].includes(event.form)
            ? wardCenter - wardW / 2 + 3 : impactX;
          const px = Math.round(startX + (target - startX) * travel);
          const arcLift = event.form === 'shot' ? Math.sin(travel * Math.PI) * 16 : 0;
          const py = Math.round(startY + (impactY - startY) * travel - arcLift);

          if (!this.settings.reducedMotion && fraction < 0.4 && pierceFromIdx < 0) {
            this.drawCastSigil(startX, startY, event.element, fraction / 0.4, projScale, secondColor, Boolean(event.elements?.[1]));
          }
          if (event.form === 'beam') {
            this.drawBeamVfx(startX, startY, px, event.element, secondColor, Boolean(event.elements?.[1]), fraction, now, event);
          } else if (event.form === 'wave') {
            this.drawWaveVfx(startX, x, color, secondColor, Boolean(event.elements?.[1]), travel, event.element, now, Boolean(event.grand), projScale);
          } else if (event.form === 'storm') {
            this.drawStormVfx(x, event.element, fraction, event.elements?.[1], now, Boolean(event.grand), projScale);
          } else if (event.form === 'chakram') {
            this.drawChakramVfx(startX, startY, target, px, py, travel, fraction, event, secondColor, now);
          } else if (event.form === 'spear') {
            this.drawSpearVfx(startX, startY, target, px, py, travel, fraction, event, secondColor, now);
          } else if (event.form === 'axe') {
            this.drawAxeVfx(px, py, color, impact, fraction, event.blocked);
          } else {
            this.drawShotVfx(startX, startY, target, px, py, travel, fraction, event, secondColor, now);
          }
          if (!this.settings.reducedMotion) {
            if (event.lightPenalty && !impact) this.drawLightTrail(px, py, fraction);
            if (event.lightPierce && impact && !event.blocked && event.damage?.amount > 0) {
              this.drawLightTrail(target, 120, fraction, event.lightPierce);
            }
            for (const modifier of event.visualModifiers ?? []) {
              if (travel < 1) this.drawModifierVfx(modifier, event.form === 'storm' ? x : px, event.form === 'storm' ? 110 : py, fraction, false);
            }
            if (event.form === 'storm' && event.element === 'storm') this.drawNeutralStormVfx(x, fraction, projScale);
            if (event.shellBlast && travel < 1) this.drawBlastAccents(px, py, fraction, projScale, event.elements, false, false);
            for (const element of event.elements ?? [event.element]) {
              if (travel < 1) {
                const vx = event.form === 'storm' ? x : px;
                const vy = event.form === 'storm' ? 110 : py;
                this.drawHybridVfx(element, vx, vy, fraction, projScale, false);
                this.drawAscendedVfx(element, vx, vy, fraction, projScale, false);
                this.drawBasicElementVfx(element, vx, vy, fraction, projScale, false);
              } else if (!event.blocked && event.damage?.amount > 0) {
                const hitProgress = (fraction - 0.65) / 0.35;
                this.drawHybridVfx(element, x, 122, hitProgress, projScale, true);
                this.drawAscendedVfx(element, x, 122, hitProgress, projScale, true);
                this.drawBasicElementVfx(element, x, 122, hitProgress, projScale, true);
              }
            }
          }
          if (impact && event.damage) {
            const sinceHit = this.settings.reducedMotion ? 0 : Math.max(0, (fraction - 0.65) / 0.35);
            if (event.form === 'wave' && event.damage.amount > 0 && !this.settings.reducedMotion) {
              this.drawHitBurstVfx(x, 126, color, sinceHit, event.element, now, projScale);
            }
            this.drawDamagePopup(x, sinceHit, event.damage, color);
          }
        }
      }

      if (event.type === 'chain-lightning' && event.damage) {
        const sourceIndex = this.state.enemies.findIndex(enemy => enemy.id === event.source);
        const palette = ELEMENT_IMPACT[event.element] ?? ELEMENT_IMPACT.asani;
        const chainScale = vfxScale(event);
        if (!this.settings.reducedMotion) {
          this.pixelBolt(positions[sourceIndex], 120, x, 120, now * 0.04, palette.primary, palette.core, Math.min(5, chainScale));
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
        const blastMult = vfxScale(event);
        if (elem === 'meteor' && !this.settings.reducedMotion && fraction < 0.38) {
          const descent = fraction / 0.38;
          const mx = Math.round(center - 44 * (1 - descent));
          const my = Math.round(6 + 118 * descent);
          const boulderR = Math.round(7 * blastMult);
          const trailStepX = Math.round(6 * Math.min(2.5, blastMult));
          const trailStepY = Math.round(14 * Math.min(2, blastMult));
          for (let t = 1; t <= 6; t++) {
            const tx = Math.round(mx - t * trailStepX);
            const ty = Math.round(my - t * trailStepY);
            this.pixelCircle(tx, ty, Math.max(2, Math.round(boulderR * (1 - t / 7))), t % 2 ? ELEMENT_IMPACT.meteor.secondary : ELEMENT_IMPACT.meteor.primary, true);
          }
          this.pixelCircle(mx, my, boulderR + Math.max(2, Math.round(2 * blastMult)), ELEMENT_IMPACT.meteor.secondary, true);
          this.pixelCircle(mx, my, boulderR, ELEMENT_IMPACT.meteor.primary, true);
          this.pixelCircle(mx + Math.round(blastMult), my + Math.round(blastMult), Math.max(3, Math.round(boulderR * 0.6)), ELEMENT_IMPACT.meteor.core, true);
        } else if (elem === 'fire' && !event.devastation && !event.radius && !event.grand) {
          this.drawFireBurst(center, fraction, event.targets, positions, blastMult);
        } else {
          if (!this.settings.reducedMotion) this.drawElementalImpactFlash(center, 126, elem, fraction, blastMult);
          const scale = blastMult * (event.devastation ? 1.35 : !event.grand && event.radius === 2 ? 1.5 : 1) * (event.scale === 0.6 ? 0.8 : 1);
          this.drawExplosionVfx(center, 126, fraction, event.targets, positions, elem, scale, event.elements?.[1], Boolean(event.devastation));
          if (!this.settings.reducedMotion && elem === 'meteor') this.drawSpecialVfx('meteor', center, 140, (fraction - 0.38) / 0.62, blastMult);
        }
        if (!this.settings.reducedMotion && elem !== 'meteor' && elem !== 'blackhole') {
          this.drawBlastAccents(center, 126, fraction, blastMult, event.elements?.length ? event.elements : [elem], Boolean(event.devastation), event.target === 'player');
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
        const dmgScale = vfxScale(event);
        if (event.amount > 0 && !this.settings.reducedMotion) {
          if (elem === 'death') {
            this.drawDeathVfx(x, 122, fraction, now);
            this.drawSpecialVfx('death', x, 122, fraction, dmgScale);
          } else {
            this.drawElementalImpactFlash(x, 124, elem, fraction, dmgScale);
            this.drawHitBurstVfx(x, 124, color, fraction, elem, now, dmgScale);
          }
        }
        this.drawDamagePopup(x, this.settings.reducedMotion ? 0 : fraction, event, color);
      }

      if (event.type === 'heal') {
        const px = event.target === 'player' ? 51 : x;
        this.drawHealVfx(px, 146, fraction, now, event);
        if (event.source === 'player' && !this.settings.reducedMotion) this.drawHealingSigil(px, 146, fraction, event.healKind, vfxScale(event));
        const healEdge = event.healKind === 'grand' ? C[31] : event.source !== 'player' ? C[22] : C[26];
        if (!this.hpNumbersInHud) this.drawFloatingPopup(px, 96 - Math.round(fraction * 12), `+${event.amount} HP`, C[9], healEdge);
      }

      if (event.type === 'buff') {
        const px = 51;
        const elem = event.element ?? event.families?.[0] ?? 'fire';
        const pal = ELEMENT_IMPACT[elem] ?? ELEMENT_IMPACT.fire;
        if (!this.settings.reducedMotion) {
          const ringR = Math.round(10 + fraction * 14);
          this.pixelCircle(px, 128, ringR, pal.primary, false, event.grand ? 3 : 2);
          this.pixelCircle(px, 128, Math.max(4, ringR - 4), pal.core, false, 1);
          for (let i = 0; i < 6; i++) {
            const sy = 148 - Math.round(((fraction * 36 + i * 7) % 36));
            const sx = px - 12 + i * 5;
            this.ctx.fillStyle = i % 2 ? pal.core : pal.primary;
            this.ctx.fillRect(sx, sy, 2, 4);
          }
        }
        this.drawFloatingPopup(px, 92 - Math.round(fraction * 14), `+${event.pct}%`, pal.core, pal.primary);
      }

      if (event.type === 'attack') {
        const hitsSummon = event.target === 'summon';
        const attackTargetX = hitsSummon ? summonAnchor.x : 51;
        const ultPopupX = hitsSummon && !(event.amount > 0) ? summonAnchor.x : 51;
        this.drawEnemyAttackVfx(x, attackTargetX, fraction, impact, event, now);
        if (impact) {
          if (event.ultimate && (!this.hpNumbersInHud || !event.amount)) {
            const ultTitle = event.sourceKind === 'eternity_reborn'
              ? '✨ ซูเปอร์โนวาดับจักรวาล!'
              : event.sourceKind === 'eternity_overlord'
                ? '🌌 คลื่นทำลายกาลอวกาศ!'
                : event.sourceKind === 'tempest_archon'
                  ? '⚡ อสุนีพิพากษา!'
                  : event.sourceKind === 'volcano_colossus'
                    ? '🌋 ภูเขาไฟพิโรธ!'
                    : event.sourceKind === 'abyssal_cthulhu'
                      ? '🌊 มหาคลื่นสึนามิบาดาล!'
                      : event.sourceKind === 'nether_dread_lord'
                        ? '💀 เปลวเพลิงนรกานต์พิพากษา!'
                        : '💥 พิพากษาเพลิง!';
            const ultText = event.amount > 0
              ? `${ultTitle} −${event.amount} HP`
              : hitsSummon
                ? `${ultTitle} แนวหน้ารับไว้!`
                : `${ultTitle} ติดโล่!`;
            const isEternityUlt = event.sourceKind === 'eternity_overlord' || event.sourceKind === 'eternity_reborn';
            const ultFg = isEternityUlt ? C[31] : event.sourceKind === 'abyssal_cthulhu' ? C[27] : event.sourceKind === 'tempest_archon' ? C[31] : event.sourceKind === 'nether_dread_lord' ? C[23] : C[30];
            const ultEdge = isEternityUlt ? C[22] : event.sourceKind === 'abyssal_cthulhu' ? C[25] : event.sourceKind === 'tempest_archon' ? C[27] : event.sourceKind === 'nether_dread_lord' ? C[18] : C[19];
            this.drawFloatingPopup(ultPopupX, 86 - Math.round((fraction - 0.5) * 18), ultText, ultFg, ultEdge);
          } else if (event.amount > 0 && !this.hpNumbersInHud) {
            this.drawFloatingPopup(51, 94 - Math.round((fraction - 0.5) * 16), `−${event.amount} HP`, C[9], C[19]);
          }
          if (event.manaDrain > 0) {
            const drainIcon = event.sourceKind === 'eternity_reborn' ? '🌌' : '🐙';
            this.drawFloatingPopup(51, 74 - Math.round((fraction - 0.5) * 14), `${drainIcon} −${event.manaDrain} MP`, C[23], C[20]);
          }
        }
      }

      if (event.type === 'boss-phase') {
        const wave = Math.sin(fraction * Math.PI);
        const isNether = event.sourceKind === 'nether_dread_lord';
        const isEternity = event.sourceKind === 'eternity_overlord' || event.sourceKind === 'eternity_reborn';
        if (!this.settings.reducedMotion) {
          if (isEternity) {
            const isReborn = event.sourceKind === 'eternity_reborn' || event.mode === 'reborn';
            const surgeH = Math.round(wave * (isReborn ? 58 : 48));
            if (surgeH > 2) {
              g.fillStyle = C[20]; g.fillRect(0, 150 - surgeH, 320, surgeH);
              g.fillStyle = isReborn ? C[30] : C[22]; g.fillRect(0, 150 - Math.round(surgeH * 0.65), 320, Math.round(surgeH * 0.45));
              g.fillStyle = C[31]; g.fillRect(0, 150 - surgeH, 320, 3);
              g.fillStyle = C[9]; g.fillRect(0, 150 - surgeH + 1, 320, 1);
            }
            const cx = isReborn ? 208 : 160;
            this.drawElementalImpactFlash(cx, 120, 'lightning', fraction, isReborn ? 2.2 : 1.7);
            this.pixelCircle(cx, 120, Math.round(14 + fraction * 54), C[31], false, 2);
            this.pixelCircle(cx, 120, Math.round(8 + fraction * 36), C[23], false, 1);
            for (let i = 0; i < 8; i++) {
              const ang = (i * Math.PI) / 4 + fraction * 1.4;
              const d = Math.round(10 + fraction * 44);
              this.pixelDiamond(Math.round(cx + Math.cos(ang) * d), Math.round(120 + Math.sin(ang) * d), 3, isReborn ? C[30] : C[23], C[9]);
            }
          } else if (isNether) {
            const surgeH = Math.round(wave * 48);
            if (surgeH > 2) {
              g.fillStyle = C[20]; g.fillRect(0, 150 - surgeH, 320, surgeH);
              g.fillStyle = C[18]; g.fillRect(0, 150 - Math.round(surgeH * 0.65), 320, Math.round(surgeH * 0.45));
              g.fillStyle = C[23]; g.fillRect(0, 150 - surgeH, 320, 3);
              g.fillStyle = C[31]; g.fillRect(0, 150 - surgeH + 1, 320, 1);
            }
            this.drawDeathVfx(160, 122, fraction, now);
            this.pixelCircle(160, 122, Math.round(14 + fraction * 48), C[18], false, 2);
            this.pixelCircle(160, 122, Math.round(8 + fraction * 32), C[23], false, 1);
          } else {
            const tideH = Math.round(wave * 44);
            if (tideH > 2) {
              g.fillStyle = C[24]; g.fillRect(0, 150 - tideH, 320, tideH);
              g.fillStyle = C[25]; g.fillRect(0, 150 - Math.round(tideH * 0.7), 320, Math.round(tideH * 0.5));
              g.fillStyle = C[27]; g.fillRect(0, 150 - tideH, 320, 3);
              g.fillStyle = C[9]; g.fillRect(0, 150 - tideH + 1, 320, 1);
            }
            this.drawElementalImpactFlash(208, 126, 'water', fraction, 1.8);
            this.pixelCircle(208, 126, Math.round(12 + fraction * 42), C[27], false, 2);
            this.pixelCircle(208, 126, Math.round(6 + fraction * 28), C[9], false, 1);
          }
        }
        const phasePopup = isEternity
          ? (event.mode === 'reborn' || event.sourceKind === 'eternity_reborn'
            ? '✨ เฟส 3: มหาเทพจุตินิรันดร์!'
            : '🌌 เฟส 2: ร่างปฏิพากย์สลับธาตุ!')
          : isNether
            ? (event.mode === 'broken' ? '🔥 พันธสัญญาสามเสาแตก!' : '💀 จอมอสูรปลดผนึก!')
            : '🐙 มหาคราเค่นปรากฏร่างจริง!';
        const phaseFg = isEternity ? C[9] : isNether ? C[31] : C[9];
        const phaseEdge = isEternity ? C[22] : isNether ? C[18] : C[25];
        this.drawFloatingPopup(160, 72 - Math.round(fraction * 10), phasePopup, phaseFg, phaseEdge);
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
          if (!this.hpNumbersInHud || !event.amount) this.drawFloatingPopup(51, 92 - Math.round((fraction - 0.5) * 16), event.amount > 0 ? `สะท้อน −${event.amount} HP` : 'สะท้อนติดโล่!', C[9], C[22]);
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
          if (!this.hpNumbersInHud || !event.amount) this.drawFloatingPopup(51, 92 - Math.round((fraction - 0.5) * 16), event.amount > 0 ? `เกล็ดแมกมา −${event.amount} HP` : 'เกล็ดแมกมาติดโล่!', C[9], C[16]);
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
          if (!this.hpNumbersInHud || !event.amount) this.drawFloatingPopup(51, 92 - Math.round((fraction - 0.5) * 16), event.amount > 0 ? `เกราะอสุนี −${event.amount} HP` : 'เกราะอสุนีติดโล่!', C[31], C[22]);
        }
      }

      if (event.type === 'nether-curse') {
        const travel = Math.min(1, fraction / 0.65);
        const rx = Math.round(x + (51 - x) * travel);
        const ry = Math.round(112 - Math.sin(travel * Math.PI) * 16);
        this.pixelCircle(rx, ry, 6, C[20], true);
        this.pixelDiamond(rx, ry, 4, C[18], C[23]);
        if (impact) {
          this.drawDeathVfx(51, 122, Math.min(1, (fraction - 0.55) / 0.45), now);
          if (!this.hpNumbersInHud || !event.amount) {
            this.drawFloatingPopup(51, 90 - Math.round((fraction - 0.5) * 16), event.amount > 0 ? `💀 คำสาปห้ามซ้ำ −${event.amount} HP` : '💀 คำสาปติดโล่!', C[23], C[18]);
          }
        }
      }

      if (event.type === 'cosmic-echo') {
        const travel = Math.min(1, fraction / 0.65);
        const rx = Math.round(x + (51 - x) * travel);
        const ry = Math.round(112 - Math.sin(travel * Math.PI) * 14);
        this.pixelBolt(x - 10, 112, rx, ry, now * 0.07, C[31], C[23]);
        this.pixelDiamond(rx, ry, 5, C[22], C[31]);
        this.pixelCircle(rx, ry, 2, C[9], true);
        if (impact) {
          this.drawElementalImpactFlash(51, 124, 'lightning', fraction);
          this.drawHitBurstVfx(51, 124, C[31], Math.min(1, (fraction - 0.55) / 0.45), 'lightning', now);
          if (!this.hpNumbersInHud || !event.amount) {
            this.drawFloatingPopup(51, 90 - Math.round((fraction - 0.5) * 16), event.amount > 0 ? `🌌 สะท้อนดาราจักร −${event.amount} HP` : '🌌 สะท้อนติดโล่!', C[31], C[22]);
          }
        }
      }

      if (event.type === 'relic') {
        this.drawHealVfx(51, 134, fraction, now);
        const relic = RELIC_DRAFT_CATALOG.find(item => item.id === event.relicId);
        const relicPopup = relic ? `${relic.icon} อาติแฟคชั้น ${relic.dropFloor}!` : '✦ ได้รับอาติแฟค!';
        this.drawFloatingPopup(160, 74 - Math.round(fraction * 12), relicPopup, C[31], C[16]);
      }

      if (event.type === 'status' || event.type === 'frozen') {
        const ice = event.status !== 'burn';
        const elem = ice ? 'ice' : 'fire';
        this.drawElementalImpactFlash(x, 126, elem, fraction);
        this.drawStatusBurstVfx(x, 126, ice, fraction);
        this.drawFloatingPopup(x, 94 - Math.round(fraction * 10), ice ? '🧊 แช่แข็ง!' : '🔥 ติดไฟ!', ELEMENT_IMPACT[elem].core, ELEMENT_IMPACT[elem].primary);
      }

      if (event.type === 'push' && !this.settings.reducedMotion) {
        const direction = event.pulled ? -1 : 1;
        const fade = Math.sin(Math.PI * fraction);
        g.save();
        g.globalAlpha = Math.max(0, fade);
        for (let i = 0; i < 3; i++) {
          const cx = Math.round(x + direction * (4 + i * 6 + fraction * 8));
          const cy = 123 - i * 4;
          g.fillStyle = event.pulled ? C[23] : C[26];
          g.fillRect(cx, cy, 7, 2);
          g.fillRect(cx + (direction > 0 ? 5 : 0), cy - 2, 2, 6);
        }
        g.restore();
      }

      if (event.type === 'charge') {
        if (event.specialBoss) {
          const isStorm = event.sourceKind === 'tempest_archon' || event.sourceKind === 'thunder_drake_emperor';
          const isWater = event.sourceKind === 'abyssal_cthulhu';
          const isNether = event.sourceKind === 'nether_dread_lord';
          const isEternity = event.sourceKind === 'eternity_overlord' || event.sourceKind === 'eternity_reborn';
          const chargeTitle = event.sourceKind === 'eternity_reborn'
            ? '✨ รวบรวมดาราจักรดับสูญ!'
            : event.sourceKind === 'eternity_overlord'
              ? '🌌 รวบรวมพลังงานกาลอวกาศ!'
              : isNether
                ? '💀 รวบรวมเปลวเพลิงนรกานต์!'
                : isWater
                  ? '🌊 รวบรวมคลื่นห้วงบาดาล!'
                  : isStorm
                    ? '⚡ ชาร์จมหาพายุ!'
                    : event.sourceKind === 'volcano_colossus'
                      ? '🌋 หลอมแก่นแมกมา!'
                      : '🔥 หลอมแก่นเพลิง!';
          this.drawFloatingPopup(
            x,
            84 - Math.round(fraction * 12),
            chargeTitle,
            isEternity ? C[9] : isNether ? C[23] : isWater ? C[27] : isStorm ? C[31] : C[30],
            isEternity ? C[22] : isNether ? C[18] : isWater ? C[25] : isStorm ? C[27] : C[19],
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

      if (event.type === 'summon' || event.type === 'summon_invoke') {
        const elem = event.element || 'fire';
        const pal = ELEMENT_IMPACT[elem] || ELEMENT_IMPACT.fire;
        const fusion = fusionSummonPalette(elem, this.summonVisuals);
        const aura = fusion?.aura ?? pal.primary;
        const core = fusion?.core ?? pal.core;
        const frac = this.settings.reducedMotion ? 1 : progress;
        const circleR = Math.round(14 + frac * 8);
        const sx = summonAnchor.x;
        const sb = summonAnchor.baseline;
        this.pixelEllipse(sx, sb, circleR, Math.round(circleR * 0.35), aura, false);
        this.pixelEllipse(sx, sb, Math.max(4, circleR - 4), Math.max(2, Math.round((circleR - 4) * 0.35)), core, false);
        if (!this.settings.reducedMotion) {
          const pillarH = Math.round(Math.sin(frac * Math.PI) * 36);
          g.save();
          g.globalAlpha = 0.45 * Math.sin(frac * Math.PI);
          g.fillStyle = aura;
          g.fillRect(sx - 12, sb - pillarH, 24, pillarH);
          g.fillStyle = core;
          g.fillRect(sx - 6, sb - pillarH, 12, pillarH);
          g.restore();
          for (let i = 0; i < 6; i++) {
            const ang = frac * 4 + i * 1.05;
            const dist = 10 + i * 2;
            const px = Math.round(sx + Math.cos(ang) * dist);
            const py = Math.round(sb - 7 - frac * 20 + Math.sin(ang) * 4);
            this.pixelDiamond(px, py, 2, fusion?.spark ?? pal.core, aura);
          }
        }
        if (event.name || event.creature) {
          this.drawFloatingPopup(sx, sb - 39 - Math.round(frac * 16), `✨ อัญเชิญ ${event.name || event.creature}`, pal.core, pal.primary);
        }
      }

      if (event.type === 'summon_strike' || event.type === 'summon_relay') {
        const elem = event.element || 'strike';
        const pal = ELEMENT_IMPACT[elem] || ELEMENT_IMPACT.blast;
        const targetIndex = this.state.enemies.findIndex(e => e.id === event.target);
        const targetX = positions[targetIndex] ?? 180;
        const frac = this.settings.reducedMotion ? 1 : progress;
        if (!this.settings.reducedMotion && frac > 0.25) {
          const strikeFrac = (frac - 0.25) / 0.75;
          this.drawElementalImpactFlash(targetX, 124, elem, strikeFrac, 1.2);
          this.drawHitBurstVfx(targetX, 124, pal.primary, strikeFrac, elem, now, 1.2);
          g.save();
          g.strokeStyle = pal.core;
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(targetX - 10, 114);
          g.lineTo(targetX + 8, 134);
          g.moveTo(targetX - 6, 112);
          g.lineTo(targetX + 12, 132);
          g.stroke();
          g.restore();
        }
        if (event.blocked) {
          this.drawFloatingPopup(targetX, 98 - Math.round(frac * 14), 'ม่านรับหมัดประสาน', pal.core, pal.primary);
        } else if (event.amount > 0) {
          const label = event.relay ? `🔄 สตรีคส่งไม้ต่อ −${event.amount}` : `⚔️ หมัดประสาน −${event.amount}`;
          this.drawFloatingPopup(targetX, 98 - Math.round(frac * 14), label, pal.core, pal.primary);
        }
      }

      if (event.type === 'summon_counter') {
        const elem = event.element || 'strike';
        const pal = ELEMENT_IMPACT[elem] || ELEMENT_IMPACT.blast;
        const targetIndex = this.state.enemies.findIndex(e => e.id === event.target);
        const targetX = positions[targetIndex] ?? 180;
        const frac = this.settings.reducedMotion ? 1 : progress;
        if (!this.settings.reducedMotion) {
          const fusion = fusionSummonPalette(elem, this.summonVisuals);
          this.pixelDiamond(summonAnchor.x, summonAnchor.baseline - 12, 3, fusion?.core ?? pal.core, fusion?.rim ?? pal.primary);
          if (frac > 0.2) {
            this.drawHitBurstVfx(targetX, 124, pal.primary, frac, elem, now, 1);
          }
        }
        if (event.blocked) {
          this.drawFloatingPopup(targetX, 96 - Math.round(frac * 14), 'ม่านรับแรงสวน', pal.core, pal.primary);
        } else if (event.amount > 0) {
          this.drawFloatingPopup(targetX, 96 - Math.round(frac * 14), `⚡ ตีสวน −${event.amount}`, pal.core, pal.primary);
        }
      }

      if (event.type === 'summon_rebirth') {
        this.drawFloatingPopup(summonAnchor.x, summonAnchor.baseline - 53, 'ฟีนิกซ์เกิดใหม่', C[31], ELEMENT_IMPACT.fire.primary);
      }

      if (event.type === 'summon_break') {
        const elem = event.element || 'earth';
        const pal = ELEMENT_IMPACT[elem] || ELEMENT_IMPACT.earth;
        const fusion = fusionSummonPalette(elem, this.summonVisuals);
        const frac = this.settings.reducedMotion ? 1 : progress;
        if (!this.settings.reducedMotion) {
          for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const dist = Math.round(frac * 24);
            const px = Math.round(summonAnchor.x + Math.cos(ang) * dist);
            const py = Math.round(summonAnchor.baseline - 12 + Math.sin(ang) * (dist * 0.6));
            this.pixelDiamond(px, py, 2, fusion?.spark ?? pal.core, fusion?.rim ?? pal.primary);
          }
        }
        this.drawFloatingPopup(summonAnchor.x, summonAnchor.baseline - 37 - Math.round(frac * 16), 'แตกสลาย!', pal.primary, pal.secondary);
      }

      if (event.type === 'summon_hit') {
        const frac = this.settings.reducedMotion ? 1 : progress;
        if (!this.settings.reducedMotion) {
          this.drawHitBurstVfx(summonAnchor.x, summonAnchor.baseline - 15, C[18], frac, 'fire', now, 0.8);
        }
        if (event.damage > 0) {
          this.drawFloatingPopup(summonAnchor.x, summonAnchor.baseline - 43 - Math.round(frac * 14), `−${event.damage}`, C[9], C[18]);
        }
      }

      if (event.type === 'dodge' && event.target === 'summon') {
        const frac = this.settings.reducedMotion ? 1 : progress;
        this.drawFloatingPopup(summonAnchor.x, summonAnchor.baseline - 45 - Math.round(frac * 14), '💨 หลบพ้น!', C[9], C[27]);
      }

      if (event.type === 'ward_absorb' && event.target === 'summon') {
        const frac = this.settings.reducedMotion ? 1 : progress;
        this.drawFloatingPopup(summonAnchor.x, summonAnchor.baseline - 45 - Math.round(frac * 14), '🛡️ ม่านรับไว้!', '#f9eeff', '#b275f0');
      }

      if (event.type === 'summon_depart') {
        const frac = this.settings.reducedMotion ? 1 : progress;
        if (!this.settings.reducedMotion) {
          for (let i = 0; i < 4; i++) {
            const sx = 84 + i * 3;
            const sy = 140 - Math.round(frac * 24 + i * 4);
            this.pixelDiamond(sx, sy, 2, C[31], C[27]);
          }
        }
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

  drawElementalImpactFlash(targetX, targetY, element = 'fire', fraction = 0, scale = 1) {
    if (this.settings.reducedMotion) return;
    const pal = ELEMENT_IMPACT[element] ?? ELEMENT_IMPACT.fire;
    const fam = vfxFamily(element);
    const g = this.ctx;
    const flashWindow = Math.max(0, 1 - fraction / 0.72);
    if (flashWindow <= 0) return;
    const stroke = Math.max(1, Math.min(4, Math.round(scale)));

    g.save();
    if (fam === 'ice') {
      // Crystalline Prism Spires rising around impact point
      for (const [dx, w, maxH] of [[-12, 6, 26], [0, 8, 36], [12, 6, 24]]) {
        const sw = Math.round(w * scale);
        const h = Math.min(144, Math.max(4, Math.round(maxH * scale * Math.sin((1 - flashWindow * 0.4) * Math.PI * 0.85))));
        const sx = Math.round(targetX + dx * scale - sw / 2);
        const sy = Math.max(0, 146 - h);
        const drawH = 146 - sy;
        g.globalAlpha = flashWindow * 0.55;
        g.fillStyle = pal.secondary;
        g.fillRect(sx - stroke, Math.min(145, sy + 2), sw + stroke * 2, Math.max(1, drawH - 2));
        g.globalAlpha = flashWindow * 0.88;
        g.fillStyle = pal.primary;
        g.fillRect(sx, sy, sw, drawH);
        g.globalAlpha = flashWindow * 0.96;
        g.fillStyle = pal.core;
        g.fillRect(sx + Math.floor(sw / 2) - stroke, Math.max(0, sy - 2), stroke * 2, Math.min(146 - Math.max(0, sy - 2), drawH + 2));
      }
    } else if (fam === 'earth' || element === 'magma') {
      // Jagged tectonic rock spires & seismic ground crack
      for (const [dx, w, maxH] of [[-13, 6, 22], [-4, 8, 32], [6, 7, 27], [14, 5, 18]]) {
        const sw = Math.round(w * scale);
        const h = Math.min(144, Math.max(4, Math.round(maxH * scale * Math.sin((1 - flashWindow * 0.35) * Math.PI * 0.85))));
        const sx = Math.round(targetX + dx * scale - sw / 2);
        const sy = Math.max(0, 146 - h);
        const drawH = 146 - sy;
        g.globalAlpha = flashWindow * 0.9;
        g.fillStyle = pal.secondary;
        g.fillRect(sx - stroke, sy, sw + stroke * 2, drawH);
        g.fillStyle = pal.primary;
        g.fillRect(sx, sy + 2, sw, Math.max(2, drawH - 2));
        g.fillStyle = pal.core;
        g.fillRect(sx + stroke, sy, Math.max(1, sw - stroke * 2), Math.min(drawH, 2 * stroke));
      }
    } else if (fam === 'water') {
      // Rising geyser splash column & spreading pool
      const splashH = Math.min(144, Math.round(30 * scale * Math.sin((1 - flashWindow * 0.3) * Math.PI * 0.85)));
      const sy = Math.max(0, 146 - splashH);
      const drawH = 146 - sy;
      g.globalAlpha = flashWindow * 0.72;
      g.fillStyle = pal.secondary;
      g.fillRect(targetX - Math.round(9 * scale), sy, Math.round(18 * scale), drawH);
      g.fillStyle = pal.primary;
      g.fillRect(targetX - Math.round(5 * scale), Math.max(0, sy - 3), Math.round(10 * scale), Math.min(146 - Math.max(0, sy - 3), drawH + 3));
      g.fillStyle = pal.core;
      g.fillRect(targetX - Math.round(2 * scale), Math.max(0, sy - 5), Math.round(4 * scale), Math.max(3, drawH));
    } else if (fam === 'wind') {
      // Sweeping vortex rings lifting from ground
      g.globalAlpha = flashWindow * 0.78;
      this.pixelEllipse(targetX, Math.max(6, 134 - Math.round((1 - flashWindow) * 14 * scale)), Math.round((14 + (1 - flashWindow) * 10) * scale), Math.min(24, Math.round(5 * scale)), pal.primary, false, stroke);
      this.pixelEllipse(targetX, Math.max(4, 120 - Math.round((1 - flashWindow) * 18 * scale)), Math.round((9 + (1 - flashWindow) * 8) * scale), Math.min(18, Math.round(3 * scale)), pal.core, false, stroke);
    } else if (element === 'blackhole') {
      // Dark singularity flash core
      g.globalAlpha = flashWindow * 0.88;
      this.pixelCircle(targetX, targetY, Math.round((22 * flashWindow + 4) * scale), pal.secondary, true);
      this.pixelCircle(targetX, targetY, Math.round((14 * flashWindow + 2) * scale), C[0], true);
      this.pixelCircle(targetX, targetY, Math.round((22 + (1 - flashWindow) * 16) * scale), pal.rim, false, stroke);
    } else if (fam === 'fire' || element === 'blast' || element === 'meteor') {
      g.globalAlpha = flashWindow * 0.52;
      this.pixelCircle(targetX, targetY, Math.round((24 + (1 - flashWindow) * 16) * scale), pal.secondary, true);
      g.globalAlpha = flashWindow * 0.78;
      this.pixelCircle(targetX, targetY, Math.round((16 + (1 - flashWindow) * 10) * scale), pal.primary, true);
    }

    g.globalAlpha = flashWindow * 0.48;
    this.pixelCircle(targetX, targetY, Math.round((18 + (1 - flashWindow) * 14) * scale), pal.primary, true);
    g.globalAlpha = flashWindow * 0.82;
    this.pixelCircle(targetX, targetY, Math.round((9 + (1 - flashWindow) * 6) * scale), element === 'blackhole' ? C[0] : pal.core, true);
    this.pixelEllipse(targetX, 146, Math.round((24 + (1 - flashWindow) * 12) * scale), Math.min(20, Math.round(5 * scale)), pal.primary, true);
    this.pixelEllipse(targetX, 146, Math.round((14 + (1 - flashWindow) * 5) * scale), Math.min(12, Math.round(2 * scale)), pal.core, true);
    g.restore();
  }

  drawNeutralStormVfx(x, progress, scale) {
    const g = this.ctx;
    const t = Math.max(0, Math.min(1, progress));
    const s = Math.min(2, Math.max(1, scale));
    g.save();
    g.globalAlpha = Math.sin(Math.PI * t) * 0.75;
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 + t * 3;
      const radius = (8 + i * 2) * s;
      const px = Math.round(x + Math.cos(angle) * radius);
      const py = Math.round(142 - i * 8 * s + Math.sin(angle) * 4 * s);
      g.fillStyle = i % 2 ? ELEMENT_IMPACT.storm.primary : ELEMENT_IMPACT.storm.rim;
      g.fillRect(px - Math.round(3 * s), py, Math.round(6 * s), Math.max(1, Math.round(s)));
    }
    g.restore();
  }

  drawBlastAccents(x, y, progress, scale, elements = [], devastation = false, shieldDetonation = false) {
    const g = this.ctx;
    const t = Math.max(0, Math.min(1, progress));
    const s = Math.min(2.5, Math.max(1, scale));
    const radius = (6 + t * (shieldDetonation ? 30 : 22)) * s;
    const colors = elements.filter(element => ELEMENT_IMPACT[element]);
    g.save();
    g.globalAlpha = (1 - t) * 0.8;
    if (shieldDetonation) this.pixelEllipse(x, 146, Math.round(radius * 1.3), Math.max(2, Math.round(4 * s)), ELEMENT_IMPACT.blast.rim, false);
    if (devastation) this.pixelCircle(x, y, Math.round(radius * 1.2), C[31], false);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4 + t * 0.6;
      const px = Math.round(x + Math.cos(angle) * radius);
      const py = Math.round(y + Math.sin(angle) * radius * 0.7);
      const element = colors[i % Math.max(1, colors.length)] ?? 'blast';
      const pal = ELEMENT_IMPACT[element];
      const family = vfxFamily(element);
      const unit = Math.max(1, Math.round(s));
      if (family === 'lightning') {
        this.pixelBolt(x, y, px, py, i + t * 6, pal.primary, pal.core, 1);
      } else if (family === 'earth') {
        g.fillStyle = pal.secondary; g.fillRect(px - unit * 2, py - unit * 2, unit * 4, unit * 4);
        g.fillStyle = pal.rim; g.fillRect(px - unit, py - unit, unit * 2, unit);
      } else if (family === 'water' || family === 'wind') {
        this.pixelEllipse(px, py, unit * 3, unit * 2, pal.rim, false);
      } else {
        this.pixelDiamond(px, py, family === 'ice' ? unit * 2 : unit + 1, pal.primary, pal.core);
      }
    }
    g.restore();
    for (const element of new Set(colors)) this.drawHybridVfx(element, x, y, t, s, true);
  }

  drawShieldCastVfx(x, y, progress, scale, elements, kind, layers) {
    const g = this.ctx;
    const t = Math.max(0, Math.min(1, progress));
    const s = Math.min(2, Math.max(1, scale));
    const radius = (10 + t * 12) * s;
    g.save();
    g.globalAlpha = Math.sin(Math.PI * t) * 0.8;
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 + t * 0.8;
      const px = Math.round(x + Math.cos(angle) * radius);
      const py = Math.round(y + Math.sin(angle) * radius * 0.75);
      const element = elements[i % Math.max(1, elements.length)];
      const pal = ELEMENT_IMPACT[element] ?? ELEMENT_IMPACT.ward;
      const family = vfxFamily(element);
      if (family === 'lightning') {
        this.pixelBolt(px - 3, py - 3, px + 3, py + 3, i + t * 4, pal.primary, pal.core);
      } else if (family === 'earth' || kind === 'brace') {
        g.fillStyle = pal.secondary; g.fillRect(px - 3, py - 3, 6, 6);
        g.fillStyle = pal.rim; g.fillRect(px - 2, py - 2, 3, 2);
      } else if (family === 'water' || family === 'wind' || element === 'mist') {
        this.pixelEllipse(px, py, 4, 2, pal.primary, false);
      } else {
        this.pixelDiamond(px, py, family === 'ice' ? 3 : 2, pal.primary, pal.core);
      }
    }
    if (layers > 1) this.pixelEllipse(x, 146, Math.round((14 + t * 10) * s), 4, C[31], false);
    g.restore();
    for (const element of new Set(elements)) this.drawHybridVfx(element, x, y, t, s, true);
  }

  drawHealingSigil(x, baseline, progress, kind, scale) {
    const g = this.ctx;
    const t = Math.max(0, Math.min(1, progress));
    const s = Math.min(2, Math.max(1, scale));
    const radius = (9 + Math.sin(Math.PI * t) * 7) * s;
    g.save();
    g.globalAlpha = Math.sin(Math.PI * t) * 0.7;
    this.pixelEllipse(x, baseline - 1, Math.round(radius), Math.max(2, Math.round(3 * s)), C[26], false);
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 + t * 1.2;
      const px = Math.round(x + Math.cos(angle) * radius);
      const py = Math.round(baseline - 12 - t * 18 + Math.sin(angle) * radius * 0.3);
      const color = kind === 'shield-heal' ? C[27] : i % 2 ? C[26] : C[31];
      this.pixelDiamond(px, py, Math.max(1, Math.round(s)), color, C[9]);
    }
    g.restore();
  }

  drawSpecialVfx(kind, x, y, progress, scale) {
    if (!['blackhole', 'meteor', 'death', 'veil'].includes(kind)) return;
    const g = this.ctx;
    const t = Math.max(0, Math.min(1, progress));
    const s = Math.min(2.5, Math.max(1, scale));
    const pal = ELEMENT_IMPACT[kind];
    g.save();
    g.globalAlpha = Math.sin(Math.PI * t) * 0.85;
    if (kind === 'blackhole') {
      // Deep singularity core + accretion disk + inward curving graviton motes
      const holeR = Math.max(4, Math.round((8 + Math.sin(t * Math.PI) * 4) * s));
      this.pixelEllipse(x, y - 6, Math.round(holeR * 1.6), Math.round(holeR * 0.9), pal.secondary, false, Math.max(1, Math.round(s)));
      this.pixelCircle(x, y - 6, holeR, '#05000d', true);
      this.pixelCircle(x, y - 6, Math.max(2, holeR - Math.round(2 * s)), '#000000', true);
      for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI / 6 + t * 5;
        const radius = (28 - t * 22) * s;
        const px = Math.round(x + Math.cos(angle) * radius);
        const py = Math.round(y - 6 + Math.sin(angle) * radius * 0.55);
        this.pixelDiamond(px, py, Math.max(1, Math.round(s)), i % 2 ? pal.primary : pal.core, pal.rim);
      }
    } else if (kind === 'meteor') {
      // Expanding volcanic impact shockwave on ground + arc ejecta + rising embers
      this.pixelEllipse(x, 146, Math.round((12 + t * 30) * s), Math.max(3, Math.round(5 * s)), pal.secondary, false, Math.max(1, Math.round(s)));
      this.pixelEllipse(x, 146, Math.round((6 + t * 18) * s), Math.max(2, Math.round(3 * s)), pal.primary, false);
      for (let i = 0; i < 9; i++) {
        const dir = (i - 4);
        const arcX = Math.round(x + dir * (5 + t * 7) * s);
        const arcY = Math.round(146 - Math.sin(t * Math.PI) * (14 + Math.abs(dir) * 3) * s);
        g.fillStyle = i % 2 ? pal.primary : pal.core;
        g.fillRect(arcX - Math.max(1, Math.round(s)), arcY, Math.max(2, Math.round(3 * s)), Math.max(2, Math.round(3 * s)));
      }
      for (let i = 0; i < 6; i++) {
        const sparkX = Math.round(x + Math.sin(t * 5 + i * 1.5) * (10 + t * 15) * s);
        const sparkY = Math.round(140 - t * 28 * s - (i % 3) * 6 * s);
        this.pixelDiamond(sparkX, sparkY, i % 2 ? 2 : 1, pal.primary, pal.core);
      }
    } else if (kind === 'death') {
      // Ominous closing runic ring with inward collapsing void sigil & spectral skull
      const radius = Math.round((22 - t * 12) * s);
      this.pixelCircle(x, y, radius, pal.rim, false, Math.max(1, Math.round(s)));
      this.pixelCircle(x, y, Math.max(2, radius - Math.round(3 * s)), pal.primary, false);
      const sw = Math.round(5 * s);
      const sh = Math.round(6 * s);
      // Skull brow & temples
      g.fillStyle = pal.primary;
      g.fillRect(x - sw, y - sh, sw * 2, Math.round(5 * s));
      // Hollow glowing eye sockets
      g.fillStyle = '#05000d';
      g.fillRect(x - Math.round(3 * s), y - Math.round(3 * s), Math.max(1, Math.round(2 * s)), Math.max(1, Math.round(2 * s)));
      g.fillRect(x + Math.round(s), y - Math.round(3 * s), Math.max(1, Math.round(2 * s)), Math.max(1, Math.round(2 * s)));
      // Glowing eye embers
      g.fillStyle = pal.core;
      g.fillRect(x - Math.round(2 * s), y - Math.round(3 * s), 1, 1);
      g.fillRect(x + Math.round(2 * s), y - Math.round(3 * s), 1, 1);
      // Jaw and teeth
      g.fillStyle = pal.secondary;
      g.fillRect(x - Math.round(2 * s), y + Math.round(2 * s), Math.round(4 * s), Math.max(1, Math.round(2 * s)));
      // Inward spiraling soul motes
      for (let i = 0; i < 6; i++) {
        const ang = i * Math.PI / 3 + t * 4;
        const dist = (26 - t * 20) * s;
        this.pixelDiamond(Math.round(x + Math.cos(ang) * dist), Math.round(y + Math.sin(ang) * dist * 0.7), Math.max(1, Math.round(s)), pal.primary, pal.core);
      }
    } else {
      // The rising bands form a translucent curtain around the player.
      for (let i = 0; i < 5; i++) {
        const offset = (i - 2) * 6 * s;
        const top = Math.round(y + 17 - Math.sin(Math.PI * t) * (18 + (2 - Math.abs(i - 2)) * 5) * s);
        g.fillStyle = i % 2 ? pal.primary : pal.rim;
        g.fillRect(Math.round(x + offset), top, Math.max(1, Math.round(s)), Math.max(2, Math.round(9 * s)));
        this.pixelDiamond(Math.round(x + offset), top, Math.max(1, Math.round(s)), pal.primary, pal.core);
      }
    }
    g.restore();
  }

  drawBasicElementVfx(element, x, y, progress, scale, impact) {
    if (!['fire', 'ice', 'lightning', 'earth', 'water', 'wind'].includes(element)) return;
    const g = this.ctx;
    const pal = ELEMENT_IMPACT[element];
    const t = Math.max(0, Math.min(1, progress));
    const size = Math.min(2, Math.max(1, scale));
    const radius = (impact ? 5 + t * 18 : 7 + t * 3) * size;
    g.save();
    g.globalAlpha = impact ? 1 - t : 0.75;
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5 + t * 0.8;
      const px = Math.round(x + Math.cos(angle) * radius);
      const py = Math.round(y + Math.sin(angle) * radius * 0.65);
      const unit = Math.max(1, Math.round(size));
      if (element === 'fire') {
        this.pixelDiamond(px, py - Math.round(t * 6), unit + 1, pal.primary, pal.core);
      } else if (element === 'ice') {
        g.fillStyle = pal.rim;
        g.fillRect(px - unit, py - unit * 3, unit * 2, unit * 6);
        g.fillRect(px - unit * 3, py - unit, unit * 6, unit * 2);
      } else if (element === 'lightning') {
        this.pixelBolt(px - unit * 3, py - unit * 3, px + unit * 3, py + unit * 3, i + t * 4, pal.primary, pal.core, 1);
      } else if (element === 'earth') {
        g.fillStyle = pal.secondary; g.fillRect(px - unit * 2, py - unit * 2, unit * 4, unit * 4);
        g.fillStyle = pal.rim; g.fillRect(px - unit, py - unit, unit * 2, unit);
      } else if (element === 'water') {
        this.pixelDiamond(px, py, unit + 1, pal.primary, pal.core);
        g.fillStyle = pal.rim; g.fillRect(px, py - unit * 3, unit, unit * 2);
      } else {
        this.pixelEllipse(px, py, unit * 3, unit, pal.rim, false);
        g.fillStyle = pal.primary; g.fillRect(px - unit * 4, py + unit * 2, unit * 4, unit);
      }
    }
    g.restore();
  }

  drawAscendedVfx(element, x, y, progress, scale, impact) {
    if (!['akki', 'heman', 'asani', 'pathaphi', 'wari', 'vayu'].includes(element)) return;
    const g = this.ctx;
    const pal = ELEMENT_IMPACT[element];
    const t = Math.max(0, Math.min(1, progress));
    const s = Math.min(2.5, Math.max(1, scale));
    const radius = (impact ? 8 + t * 16 : 10 + t * 4) * s;
    g.save();
    g.globalAlpha = impact ? 1 - t : 0.85;
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 + t * 1.2;
      const px = Math.round(x + Math.cos(angle) * radius);
      const py = Math.round(y + Math.sin(angle) * radius * 0.65);
      if (element === 'akki') {
        this.pixelDiamond(px, py - Math.round(t * 5 * s), Math.max(2, Math.round(2 * s)), pal.secondary, pal.rim);
        g.fillStyle = pal.core;
        g.fillRect(px, py - Math.round(4 * s), Math.max(1, Math.round(s)), Math.round(3 * s));
      } else if (element === 'heman') {
        this.pixelDiamond(px, py, Math.max(2, Math.round(3 * s)), pal.secondary, pal.core);
        g.fillStyle = pal.rim;
        g.fillRect(px - Math.round(s), py - Math.round(5 * s), Math.max(1, Math.round(2 * s)), Math.round(3 * s));
      } else if (element === 'asani') {
        this.pixelBolt(x, y, px, py, i + t * 5, pal.primary, pal.core, 1);
      } else if (element === 'pathaphi') {
        const size = Math.max(2, Math.round(3 * s));
        g.fillStyle = pal.secondary; g.fillRect(px - size, py - size, size * 2, size * 2);
        g.fillStyle = pal.rim; g.fillRect(px - size + 1, py - size + 1, size, Math.max(1, Math.round(s)));
      } else if (element === 'wari') {
        this.pixelEllipse(px, py, Math.max(2, Math.round(3 * s)), Math.max(2, Math.round(4 * s)), pal.primary, true);
        g.fillStyle = pal.core; g.fillRect(px - 1, py - Math.round(2 * s), Math.max(1, Math.round(s)), Math.max(1, Math.round(s)));
      } else {
        const length = Math.round((5 + i % 2 * 3) * s);
        g.fillStyle = i % 2 ? pal.rim : pal.primary;
        g.fillRect(px - length, py, length, Math.max(1, Math.round(s)));
        g.fillRect(px - Math.round(2 * s), py - Math.round(2 * s), Math.round(2 * s), Math.round(5 * s));
      }
    }
    g.restore();
  }

  drawModifierVfx(modifier, x, y, progress, impact) {
    const g = this.ctx;
    const t = Math.max(0, Math.min(1, progress));
    const pulse = Math.round(Math.sin(t * Math.PI) * 4);
    g.save();
    if (impact) g.globalAlpha = Math.sin(t * Math.PI);
    if (modifier === 'burn') {
      for (let i = 0; i < 5; i++) {
        const dx = (i - 2) * 4;
        const rise = Math.round((t * 12 + i * 3) % 12);
        this.pixelDiamond(x + dx, y - 8 - rise, i % 2 ? 1 : 2, '#ff7722', '#fff7d6');
      }
    } else if (modifier === 'freeze') {
      this.pixelCircle(x, y, 10 + pulse, '#a6f4ff', false);
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2 + t;
        this.pixelDiamond(Math.round(x + Math.cos(angle) * 13), Math.round(y + Math.sin(angle) * 13), 2, '#29d6ff', '#f2ffff');
      }
    } else if (modifier === 'pierce') {
      g.fillStyle = '#fff7d6';
      for (let i = 0; i < 3; i++) {
        const dx = 8 + i * 4;
        g.fillRect(x + dx, y - (3 - i), 3, 2);
        g.fillRect(x + dx, y + (2 - i), 3, 2);
      }
    } else if (modifier === 'seal') {
      const radius = impact ? 10 + pulse : 9;
      this.pixelCircle(x, y, radius, '#d6a2ff', false);
      g.fillStyle = '#f2ecff';
      g.fillRect(x - 4, y - 1, 9, 2);
      g.fillRect(x - 1, y - 4, 2, 9);
    } else if (modifier === 'dispel') {
      const gap = impact ? Math.round(t * 9) : 2;
      this.pixelEllipse(x - gap, y, 9, 6, '#c77dff', false);
      g.fillStyle = '#f9eeff';
      g.fillRect(x - 2 + gap, y - 10, 2, 5);
      g.fillRect(x + 4 + gap, y + 5, 2, 5);
    } else if (modifier === 'push' || modifier === 'pull') {
      const direction = modifier === 'push' ? 1 : -1;
      g.fillStyle = modifier === 'push' ? '#86e3b6' : '#d6a2ff';
      for (let i = 0; i < 3; i++) {
        const ax = x + direction * (8 + i * 4);
        g.fillRect(ax, y - 4 + i, 2, 8 - i * 2);
      }
    }
    g.restore();
  }

  drawHybridVfx(element, x, y, progress, scale, impact) {
    const hybrids = [
      'magma', 'mist', 'hail', 'thunderstorm',
      'mudmire', 'dust', 'permafrost', 'magnet',
      'monsoon', 'shockstream', 'heatwave', 'chillgale',
      'plasma', 'scald', 'frostvolt',
    ];
    if (!hybrids.includes(element)) return;
    const g = this.ctx;
    const s = Math.min(2.5, Math.max(1, scale));
    const t = Math.max(0, Math.min(1, progress));
    const spread = (impact ? 7 + t * 14 : 6 + t * 4) * s;
    g.save();
    g.globalAlpha = impact ? Math.max(0, 1 - t) : 0.85;
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 + t * 1.5;
      const px = Math.round(x + Math.cos(angle) * spread);
      const py = Math.round(y + Math.sin(angle) * spread * 0.55 - (impact ? t * 5 : 0));
      if (element === 'magma') {
        const size = Math.max(2, Math.round((i % 2 ? 2 : 3) * s));
        g.fillStyle = i % 2 ? '#ff8543' : '#6b4725';
        g.fillRect(px - size, py - size, size * 2, size * 2);
        g.fillStyle = '#ffed99';
        g.fillRect(px, py, Math.max(1, Math.round(s)), Math.max(1, Math.round(s)));
      } else if (element === 'mist') {
        this.pixelEllipse(px, py, Math.round(4 * s), Math.max(1, Math.round(2 * s)), i % 2 ? '#c0eade' : '#4e807b', false);
      } else if (element === 'hail') {
        this.pixelDiamond(px, py, Math.max(2, Math.round(2 * s)), '#b7e9ff', '#f5fdff');
        g.fillStyle = '#518bcf';
        g.fillRect(px - Math.round(s), py - Math.round(5 * s), Math.max(1, Math.round(s)), Math.round(3 * s));
      } else if (element === 'thunderstorm') {
        this.pixelBolt(px - Math.round(3 * s), py - Math.round(4 * s), px + Math.round(3 * s), py + Math.round(4 * s), i + t * 4, '#abef79', '#fcffee', 1);
      } else if (element === 'mudmire') {
        const rad = Math.max(2, Math.round((i % 2 ? 2 : 3) * s));
        this.pixelCircle(px, py, rad, '#8b6c42', true);
        g.fillStyle = '#c2a677';
        g.fillRect(px - 1, py - rad + 1, Math.max(1, Math.round(s)), Math.max(1, Math.round(s)));
      } else if (element === 'dust') {
        const len = Math.round((3 + (i % 2) * 3) * s);
        g.fillStyle = i % 2 ? '#e2d8c3' : '#b8a98a';
        g.fillRect(px - len, py, len * 2, Math.max(1, Math.round(s)));
        g.fillStyle = '#6b5e43';
        g.fillRect(px - Math.round(s), py - Math.round(s), Math.max(1, Math.round(s)), Math.round(s));
      } else if (element === 'permafrost') {
        this.pixelDiamond(px, py, Math.max(2, Math.round(2.5 * s)), '#6fb2d2', '#b5e1f7');
        g.fillStyle = '#315674';
        g.fillRect(px - Math.round(s), py - Math.round(s), Math.max(1, Math.round(s * 1.5)), Math.max(1, Math.round(s * 1.5)));
      } else if (element === 'magnet') {
        const magCol = i % 2 === 0 ? '#e65c7b' : '#9bb8ff';
        this.pixelBolt(px - Math.round(4 * s), py, px + Math.round(4 * s), py, i + t * 4, magCol, '#fff0f0', 1);
      } else if (element === 'monsoon') {
        this.pixelEllipse(px, py, Math.round(5 * s), Math.max(1, Math.round(2 * s)), i % 2 ? '#88f3ff' : '#3cbcd0', false);
        g.fillStyle = '#1d5a73';
        g.fillRect(px - Math.round(s), py, Math.max(1, Math.round(2 * s)), 1);
      } else if (element === 'shockstream') {
        this.pixelCircle(px, py, Math.max(2, Math.round(2 * s)), '#4dd2ff', true);
        this.pixelBolt(px - Math.round(2 * s), py - Math.round(2 * s), px + Math.round(2 * s), py + Math.round(2 * s), i + t * 5, '#bfeaff', '#ffffff', 1);
      } else if (element === 'heatwave') {
        this.pixelDiamond(px, py - Math.round(t * 7 * s), Math.max(1, Math.round(2 * s)), '#ff6e30', '#ffb566');
        g.fillStyle = '#962015';
        g.fillRect(px - Math.round(s), py, Math.round(2 * s), Math.max(1, Math.round(s)));
      } else if (element === 'chillgale') {
        this.pixelEllipse(px, py, Math.round(4 * s), Math.max(1, Math.round(s)), '#8cd5e8', false);
        this.pixelDiamond(px, py, Math.max(1, Math.round(1.5 * s)), '#c8f2ff', '#ffffff');
      } else if (element === 'plasma') {
        this.pixelDiamond(px, py, Math.max(2, Math.round(3 * s)), '#e040fb', '#ffffff');
        this.pixelCircle(px, py, Math.max(1, Math.round(s)), '#ff80ab', false);
      } else if (element === 'scald') {
        this.pixelCircle(px, py, Math.max(2, Math.round(2.5 * s)), '#ff7052', false);
        this.pixelDiamond(px, py - Math.round(t * 5 * s), Math.max(1, Math.round(s)), '#ffc0a8', '#ffffff');
      } else if (element === 'frostvolt') {
        this.pixelDiamond(px, py, Math.max(2, Math.round(2 * s)), '#c4b5fd', '#ffffff');
        this.pixelBolt(px, py, px + Math.round((i % 2 ? 3 : -3) * s), py - Math.round(4 * s), i + t * 5, '#a78bfa', '#ffffff', 1);
      }
    }
    g.restore();
  }

  drawCastSigil(x, y, element, progress, scale, secondColor, dual) {
    const g = this.ctx;
    const pal = ELEMENT_IMPACT[element] ?? ELEMENT_IMPACT.fire;
    const size = Math.min(2.5, scale);
    const radius = Math.round((7 + progress * 8) * size);
    g.save();
    g.globalAlpha = (1 - progress) * 0.85;
    this.pixelEllipse(x, y, Math.round(radius * 0.6), radius, pal.primary, false);
    this.pixelEllipse(x, y, Math.round(radius * 0.4), Math.round(radius * 0.7), dual ? secondColor : pal.rim, false);
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 + progress * 1.4;
      this.pixelDiamond(Math.round(x + Math.cos(angle) * radius * 0.6), Math.round(y + Math.sin(angle) * radius), Math.max(1, Math.round(size)), i % 2 && dual ? secondColor : pal.primary, pal.core);
    }
    g.restore();
  }

  drawShotVfx(startX, startY, targetX, px, py, travel, fraction, event, secondColor, now) {
    const g = this.ctx;
    const scale = vfxScale(event);
    const baseSize = event.size > 1 ? 6 : 4;
    const size = Math.round(baseSize * scale);
    const stroke = Math.min(4, scale);
    const smallDiam = Math.round(2 * Math.min(2.5, scale));
    const elem = event.element ?? 'fire';
    const fam = vfxFamily(elem);
    const pal = ELEMENT_IMPACT[elem] ?? ELEMENT_IMPACT.fire;
    const dual = event.elements?.length === 2;

    if (travel < 1) {
      if (elem === 'ice' && !dual && !event.grand && !this.settings.reducedMotion
        && drawCombatSprite(g, combatSpriteSheets.iceLance, travel, px, py, (event.size > 1 ? 0.78 : 0.55) * scale)) return;

      for (let t = 1; t <= 7; t++) {
        const trailT = Math.max(0, travel - t * 0.055);
        const tx = Math.round(startX + (targetX - startX) * trailT);
        const waveShift = (fam === 'wind' ? Math.sin(now / 32 + t * 0.9) * 4 : Math.sin(now / 45 + t) * (dual ? 3 : 1)) * Math.min(2.5, scale);
        const ty = Math.round(startY - Math.sin(trailT * Math.PI) * 16 + waveShift);
        const tSize = Math.max(1, Math.round(size - t * 0.55 * scale));
        g.fillStyle = t % 2 === 1 && dual ? secondColor : t > 4 ? pal.secondary : pal.primary;
        g.fillRect(tx - Math.floor(tSize / 2), ty - Math.floor(tSize / 2), tSize, tSize);
      }
      if (!this.settings.reducedMotion) {
        for (let i = 0; i < 6; i++) {
          const trailT = Math.max(0, travel - (i + 1) * 0.07);
          const tx = Math.round(startX + (targetX - startX) * trailT);
          const spread = (i % 2 ? 1 : -1) * (1 + i * 0.4) * scale;
          const ty = Math.round(py + spread);
          this.pixelDiamond(tx, ty, Math.max(1, Math.round((3 - i * 0.3) * Math.min(2, scale))), dual && i % 2 ? secondColor : pal.rim, pal.core);
        }
      }

      if (fam === 'lightning') {
        const boltSpan = Math.round(28 * Math.min(2.5, scale));
        const boltThick = Math.min(5, scale);
        this.pixelBolt(Math.max(startX, px - boltSpan), py + (elem === 'asani' ? -2 * scale : 0), px + Math.round(4 * scale), py, now * 0.04, pal.primary, pal.core, boltThick);
        if (elem === 'asani' || elem === 'thunderstorm' || event.grand || event.large) {
          this.pixelBolt(Math.max(startX, px - Math.round(24 * Math.min(2.5, scale))), py + Math.round(4 * scale), px + Math.round(3 * scale), py - Math.round(2 * scale), now * 0.05 + 2, pal.secondary, pal.rim, Math.max(1, boltThick - 1));
        }
        this.pixelDiamond(px, py, size + scale, pal.primary, pal.core);
      } else if (fam === 'ice') {
        this.pixelDiamond(px, py, size + 2 * scale, pal.primary, pal.core);
        g.fillStyle = pal.core;
        const barThick = Math.max(1, Math.round(scale));
        const reach = size + 3 * scale;
        g.fillRect(px - reach, py - Math.floor(barThick / 2), reach * 2 + barThick, barThick);
        g.fillRect(px - Math.floor(barThick / 2), py - reach, barThick, reach * 2 + barThick);
        if (elem === 'hail' || elem === 'heman' || scale > 1) {
          this.pixelDiamond(px - Math.round(6 * scale), py - Math.round(4 * scale), smallDiam, pal.secondary, pal.core);
          this.pixelDiamond(px - Math.round(5 * scale), py + Math.round(5 * scale), smallDiam, pal.rim, pal.core);
        }
      } else if (fam === 'earth') {
        // Faceted angular monolith boulder projectile
        g.fillStyle = pal.secondary;
        g.fillRect(px - size - scale, py - size, size * 2 + scale, size * 2);
        g.fillStyle = pal.primary;
        g.fillRect(px - size + scale, py - size + scale, Math.max(2, size * 2 - 2 * scale), Math.max(2, size * 2 - 2 * scale));
        g.fillStyle = pal.core;
        g.fillRect(px - scale, py - size + scale, Math.max(2, size - scale), Math.max(2, 2 * Math.min(3, scale)));
        if (elem === 'pathaphi' || event.large || event.grand) {
          this.pixelDiamond(px - size - Math.round(3 * scale), py - Math.round(3 * scale), smallDiam, pal.rim, pal.core);
          this.pixelDiamond(px - size - Math.round(2 * scale), py + Math.round(4 * scale), smallDiam, pal.primary, pal.core);
        }
      } else if (fam === 'water') {
        // Surging hydro orb with crescent wake & splash beads
        this.pixelCircle(px, py, size + scale, pal.secondary, true);
        this.pixelCircle(px, py, Math.max(2, size - scale), pal.primary, true);
        g.fillStyle = pal.core;
        g.fillRect(px - scale, py - 2 * scale, 3 * scale, 2 * scale);
        this.pixelEllipse(px - 3 * scale, py, size + 2 * scale, Math.max(2, size - scale), pal.rim, false, stroke);
        if (elem === 'wari' || elem === 'mist' || scale > 1) {
          this.pixelDiamond(px - Math.round(6 * scale), py - Math.round(5 * scale), smallDiam, pal.rim, pal.core);
          this.pixelDiamond(px - Math.round(6 * scale), py + Math.round(5 * scale), smallDiam, pal.primary, pal.core);
        }
      } else if (fam === 'wind') {
        // Spinning emerald gale crescent blade
        const rad = size + scale;
        const w1 = Math.max(2, Math.round(3 * scale));
        const w2 = Math.max(2, Math.round(2 * scale));
        for (let dy = -rad; dy <= rad; dy++) {
          const curve = Math.round((1 - (dy * dy) / ((rad + 1) * (rad + 1))) * 5 * scale);
          const wy = py + dy;
          if (wy < 0 || wy > 147) continue;
          g.fillStyle = pal.secondary;
          g.fillRect(px + curve - Math.round(4 * scale), wy, w1, 1);
          g.fillStyle = pal.primary;
          g.fillRect(px + curve - scale, wy, w1, 1);
          g.fillStyle = pal.core;
          g.fillRect(px + curve + 2 * scale, wy, w2, 1);
        }
        this.pixelEllipse(px - 2 * scale, py, size + 2 * scale, Math.max(2, Math.round(size * 0.5)), pal.rim, false, stroke);
      } else {
        // Fire / Akki / Magma flaring comet fireball
        this.pixelCircle(px, py, size + 2 * scale, pal.secondary, true);
        this.pixelCircle(px, py, size, pal.primary, true);
        this.pixelCircle(px + scale, py, Math.max(2, size - 2 * scale), pal.core, true);
        const flicker = Math.round(Math.sin(now / 32) * 2 * scale);
        this.pixelDiamond(px - size - 2 * scale, py + flicker, smallDiam, pal.rim, pal.core);
        if (elem === 'akki' || elem === 'magma' || scale > 1) {
          this.pixelDiamond(px, py, size, pal.rim, pal.core);
        }
      }

      if (event.shellBlast) {
        // Volatile ignited shell aura for 'ลูก ระเบิด'
        this.pixelCircle(px, py, size + 3 * scale, C[30], false, stroke);
        this.pixelDiamond(px - size - scale, py - size - scale, smallDiam, C[16], C[9]);
      }
      if (event.grand) {
        this.pixelEllipse(px, py, size + 5 * scale, size + 3 * scale, C[31], false, stroke);
        this.pixelDiamond(px, Math.max(4, py - size - 3 * scale), smallDiam, C[31], C[9]);
      }
      if (dual) {
        const orbitY = Math.round(py + Math.sin(now / 40) * (size + 3 * scale));
        this.pixelDiamond(px - 2 * scale, Math.max(4, Math.min(144, orbitY)), Math.round(3 * Math.min(2.5, scale)), secondColor, C[9]);
      }
      if (event.pierce) {
        this.pixelEllipse(px + 3 * scale, py, Math.max(3, 3 * scale), size + 3 * scale, pal.core, false, stroke);
        g.fillStyle = pal.core;
        g.fillRect(px + size, py - Math.max(1, Math.floor(scale / 2)), 9 * scale, Math.max(2, 2 * Math.min(3, scale)));
      }
    } else if (!event.blocked && event.damage?.amount > 0 && !this.settings.reducedMotion) {
      const imp = Math.max(0, (fraction - 0.65) / 0.35);
      this.drawElementalImpactFlash(targetX, 122, elem, imp, scale);
      this.drawHitBurstVfx(targetX, 122, pal.primary, imp, elem, now, scale);
    }
  }

  drawChakramVfx(startX, startY, targetX, px, py, travel, fraction, event, secondColor, now) {
    const g = this.ctx;
    const elem = event.element ?? 'fire';
    const pal = ELEMENT_IMPACT[elem] ?? ELEMENT_IMPACT.fire;
    const dual = Boolean(event.elements?.[1]);
    const scale = vfxScale(event);
    const stroke = Math.min(4, scale);
    const radius = Math.round((event.size > 1 ? 8 : 6) * scale);
    if (travel < 1) {
      for (let t = 1; t <= 6; t++) {
        const trailT = Math.max(0, travel - t * 0.05);
        const tx = Math.round(startX + (targetX - startX) * trailT);
        const ty = Math.round(startY + Math.sin(now / 26 + t) * 2 * Math.min(2, scale));
        const alpha = (1 - t / 7) * 0.7;
        g.save();
        g.globalAlpha = alpha;
        this.pixelEllipse(tx, ty, Math.max(2, Math.round(radius * (1 - t * 0.08))), Math.max(1, Math.round(radius * 0.45)), t % 2 && dual ? secondColor : pal.primary, false, Math.max(1, stroke - 1));
        g.restore();
      }
      const spin = this.settings.reducedMotion ? 0 : now * 0.038;
      this.pixelCircle(px, py, radius + Math.max(1, Math.round(scale)), pal.secondary, false, stroke);
      this.pixelCircle(px, py, radius, pal.primary, false, stroke);
      this.pixelCircle(px, py, Math.max(2, Math.round(radius * 0.55)), pal.core, false, Math.max(1, Math.round(scale * 0.8)));
      this.pixelDiamond(px, py, Math.max(2, Math.round(3 * Math.min(2, scale))), pal.rim, pal.core);
      for (let i = 0; i < 8; i++) {
        const angle = spin + (i * Math.PI) / 4;
        const toothDist = radius + Math.round((i % 2 === 0 ? 4 : 2) * scale);
        const bx = Math.round(px + Math.cos(angle) * toothDist);
        const by = Math.round(py + Math.sin(angle) * toothDist);
        const toothColor = dual && i % 2 ? secondColor : (i % 2 === 0 ? pal.rim : pal.primary);
        this.pixelDiamond(bx, by, Math.max(1, Math.round((i % 2 === 0 ? 2.5 : 1.8) * Math.min(2.5, scale))), toothColor, pal.core);
      }
      if (event.grand) {
        this.pixelCircle(px, py, radius + Math.round(4 * scale), C[31], false, stroke);
      }
      if (event.pierce) {
        g.fillStyle = pal.core;
        g.fillRect(px + radius, py - Math.max(1, Math.floor(scale / 2)), Math.round(8 * scale), Math.max(2, Math.round(2 * Math.min(2.5, scale))));
      }
    } else if (!event.blocked && event.damage?.amount > 0 && !this.settings.reducedMotion) {
      const imp = Math.max(0, (fraction - 0.65) / 0.35);
      const slashR = Math.round((10 + imp * 10) * scale);
      g.save();
      g.globalAlpha = Math.max(0, 1 - imp);
      for (let step = -slashR; step <= slashR; step += Math.max(1, Math.round(scale))) {
        g.fillStyle = pal.primary;
        g.fillRect(targetX + step, 122 + step, Math.max(2, Math.round(2 * scale)), Math.max(2, Math.round(2 * scale)));
        g.fillRect(targetX + step, 122 - step, Math.max(2, Math.round(2 * scale)), Math.max(2, Math.round(2 * scale)));
        g.fillStyle = pal.core;
        g.fillRect(targetX + step, 122 + step, Math.max(1, Math.round(scale)), Math.max(1, Math.round(scale)));
        g.fillRect(targetX + step, 122 - step, Math.max(1, Math.round(scale)), Math.max(1, Math.round(scale)));
      }
      g.restore();
      this.drawElementalImpactFlash(targetX, 122, elem, imp, scale);
      this.drawHitBurstVfx(targetX, 122, pal.primary, imp, elem, now, scale);
    }
  }

  drawSpearVfx(startX, startY, targetX, px, py, travel, fraction, event, secondColor, now, contactFrac = 0.65, pierceOpts = null) {
    const g = this.ctx;
    const elem = event.element ?? 'fire';
    const pal = ELEMENT_IMPACT[elem] ?? ELEMENT_IMPACT.fire;
    const dual = Boolean(event.elements?.[1]);
    const scale = vfxScale(event);
    const shaftLen = Math.round(24 * scale);
    const tipLen = Math.round(9 * scale);
    const thick = Math.max(2, Math.round(2.5 * Math.min(2.2, scale)));
    if (pierceOpts?.frontHit && !event.blocked && event.damage?.amount > 0 && !this.settings.reducedMotion) {
      const fImp = pierceOpts.frontImpactFrac ?? 0;
      const fx = pierceOpts.frontTargetX;
      const thrustLen = Math.round((14 + fImp * 12) * scale);
      g.save();
      g.globalAlpha = Math.max(0, 1 - fImp);
      g.fillStyle = pal.primary;
      g.fillRect(fx - Math.round(thrustLen * 0.4), 120, thrustLen, Math.max(2, thick));
      g.fillStyle = pal.core;
      g.fillRect(fx - Math.round(thrustLen * 0.3), 121, Math.round(thrustLen * 0.8), 1);
      g.restore();
      this.drawElementalImpactFlash(fx, 122, elem, fImp, scale);
      this.drawHitBurstVfx(fx, 122, pal.primary, fImp, elem, now, scale);
    }
    if (travel < 1) {
      // Speed streaks trailing behind the spear
      for (let t = 1; t <= 4; t++) {
        const tx = px - shaftLen - t * Math.round(7 * scale);
        if (tx < startX) break;
        g.save();
        g.globalAlpha = (1 - t / 5) * 0.65;
        g.fillStyle = t % 2 && dual ? secondColor : pal.primary;
        g.fillRect(tx, py - Math.floor(thick / 2), Math.round(6 * scale), Math.max(1, thick - 1));
        g.restore();
      }
      // Spear shaft
      g.fillStyle = pal.secondary;
      g.fillRect(px - shaftLen, py - Math.floor(thick / 2) - 1, shaftLen, thick + 2);
      g.fillStyle = pal.primary;
      g.fillRect(px - shaftLen, py - Math.floor(thick / 2), shaftLen, thick);
      g.fillStyle = pal.core;
      g.fillRect(px - shaftLen + 2, py, Math.max(4, shaftLen - 2), 1);
      // Spear head / piercing blade
      g.fillStyle = dual ? secondColor : pal.rim;
      g.fillRect(px, py - thick, Math.max(2, Math.round(tipLen * 0.5)), thick * 2 + 1);
      g.fillStyle = pal.core;
      g.fillRect(px + Math.round(tipLen * 0.3), py - Math.max(1, thick - 1), Math.max(3, Math.round(tipLen * 0.7)), Math.max(2, (thick - 1) * 2 + 1));
      g.fillRect(px + tipLen, py, Math.max(2, Math.round(3 * scale)), 1);
      if (event.grand) {
        g.fillStyle = C[31];
        g.fillRect(px - shaftLen - 2, py - thick - 1, shaftLen + tipLen + 4, 1);
        g.fillRect(px - shaftLen - 2, py + thick + 1, shaftLen + tipLen + 4, 1);
      }
    } else {
      const endEvent = pierceOpts?.backEvent ?? event;
      if (!endEvent.blocked && endEvent.damage?.amount > 0 && !this.settings.reducedMotion) {
        const imp = Math.max(0, (fraction - contactFrac) / Math.max(0.1, 1 - contactFrac));
        const thrustLen = Math.round((16 + imp * 14) * scale);
        g.save();
        g.globalAlpha = Math.max(0, 1 - imp);
        g.fillStyle = pal.primary;
        g.fillRect(targetX - Math.round(thrustLen * 0.4), 120, thrustLen, Math.max(2, thick));
        g.fillStyle = pal.core;
        g.fillRect(targetX - Math.round(thrustLen * 0.3), 121, Math.round(thrustLen * 0.8), 1);
        g.restore();
        this.drawElementalImpactFlash(targetX, 122, elem, imp, scale);
        this.drawHitBurstVfx(targetX, 122, pal.primary, imp, elem, now, scale);
      }
    }
  }

  drawBeamVfx(startX, startY, targetX, element, secondColor, dual, fraction, now, event = null) {
    const g = this.ctx;
    const width = Math.max(0, targetX - startX);
    if (width < 1) return;
    const scale = vfxScale(event);
    const isGrand = Boolean(event?.grand);
    const isPierce = Boolean(event?.pierce);
    const stroke = Math.min(4, scale);
    const sheet = !isGrand ? arcaneBeamSheets.get(element) : null;
    if (!this.settings.reducedMotion && sheet?.complete && sheet.naturalWidth) {
      const { frameWidth, frameHeight, columns, frames, startX: source, endX, centerY } = arcaneBeam;
      const index = Math.min(frames - 1, Math.floor(fraction * frames));
      const scaleX = width / (endX - source);
      const scaleY = 0.75 * scale;
      g.save();
      g.globalAlpha = Math.min(1, fraction / 0.18, (1 - fraction) / 0.12);
      g.drawImage(sheet, index % columns * frameWidth, Math.floor(index / columns) * frameHeight,
        frameWidth, frameHeight, Math.round(startX - source * scaleX),
        Math.round(startY - centerY * scaleY), Math.max(1, Math.round(frameWidth * scaleX)), frameHeight * scaleY);
      if (dual) {
        for (let x = startX + 4; x < targetX - 4; x += 8) {
          const y = startY + Math.round(Math.sin(x * 0.22 - fraction * 20) * 5 * scale);
          g.fillStyle = secondColor;
          g.fillRect(x, y, 3 * scale, 2 * scale);
        }
      }
      g.restore();
      return;
    }
    if (this.settings.reducedMotion) now = 0;
    const pulse = Math.round(Math.sin(now / 35) * 2);
    const fam = vfxFamily(element ?? 'fire');
    const pal = ELEMENT_IMPACT[element] ?? ELEMENT_IMPACT.fire;
    if (fraction > 0.25 && fraction < 0.85) {
      this.drawElementalImpactFlash(targetX, startY, element, Math.abs(fraction - 0.5) * 1.4, scale);
    }
    g.save();
    const outerHalf = Math.round((6 + pulse) * scale);
    const primHalf = Math.round(3 * scale);
    const coreHalf = Math.max(1, Math.round(scale));
    g.globalAlpha = 0.42;
    g.fillStyle = pal.secondary;
    g.fillRect(startX, Math.max(0, startY - outerHalf), width, outerHalf * 2 + 1);
    g.globalAlpha = 0.92;
    g.fillStyle = pal.primary;
    g.fillRect(startX, Math.max(0, startY - primHalf), width, primHalf * 2 + 1);
    g.globalAlpha = 1;
    g.fillStyle = pal.core;
    g.fillRect(startX, Math.max(0, startY - coreHalf), width, coreHalf * 2 + 1);

    if (fam === 'lightning') {
      const boltThick = Math.min(5, scale);
      this.pixelBolt(startX, startY - 2 * scale, targetX, startY - 2 * scale, now * 0.05, pal.primary, pal.core, boltThick);
      this.pixelBolt(startX, startY + 2 * scale, targetX, startY + 2 * scale, now * 0.06 + 2.5, pal.secondary, pal.core, boltThick);
    } else if (fam === 'ice') {
      const step = Math.round(12 * Math.min(2, scale));
      for (let bx = startX + 8; bx < targetX - 6; bx += step) {
        const h = Math.round((4 + ((bx / 12) % 2) * 2) * scale);
        g.fillStyle = pal.rim;
        g.fillRect(bx, Math.max(0, startY - h - 2 * scale), Math.round(2 * scale), h);
        g.fillRect(bx + 5, startY + 3 * scale, Math.round(2 * scale), h);
      }
    } else if (fam === 'earth') {
      const step = Math.round(14 * Math.min(2, scale));
      for (let bx = startX + ((Math.floor(now / 18)) % step); bx < targetX - 4; bx += step) {
        g.fillStyle = pal.secondary;
        g.fillRect(bx - 2 * scale, Math.max(0, startY - 6 * scale), Math.round(5 * scale), Math.round(4 * scale));
        g.fillRect(bx - scale, startY + 4 * scale, Math.round(4 * scale), Math.round(4 * scale));
      }
    } else if (fam === 'water' || fam === 'wind') {
      g.fillStyle = pal.rim;
      for (let bx = startX; bx < targetX; bx += 6) {
        const wy = Math.round(Math.sin((bx - now * 0.35) * 0.16) * 5 * scale);
        g.fillRect(bx, Math.max(0, startY + wy - scale), Math.round(4 * Math.min(2.5, scale)), Math.max(2, Math.round(2 * scale)));
      }
    }

    if (dual) {
      const step = Math.max(4, Math.round(6 * Math.min(2, scale)));
      for (let bx = startX; bx < targetX; bx += step) {
        const phase = (bx * 0.16 + now * 0.05);
        const wave1 = Math.round(Math.sin(phase) * 5 * scale);
        const wave2 = -wave1;
        const strandW = Math.max(2, Math.round(3 * Math.min(2.5, scale)));
        const strandH = Math.max(2, Math.round(2.5 * scale));
        g.fillStyle = pal.primary;
        g.fillRect(bx, Math.max(0, startY + wave1 - Math.floor(strandH / 2)), strandW, strandH);
        g.fillStyle = secondColor;
        g.fillRect(bx, Math.max(0, startY + wave2 - Math.floor(strandH / 2)), strandW, strandH);
        if (Math.abs(wave1) < Math.round(1.5 * scale)) {
          this.pixelDiamond(bx, startY, Math.max(1, Math.round(2 * Math.min(2, scale))), '#ffffff', pal.core);
        }
      }
      this.pixelCircle(targetX, startY, Math.round((9 + Math.sin(fraction * Math.PI) * 10) * scale), secondColor, false, stroke);
      this.pixelDiamond(targetX, startY, Math.round(8 * Math.min(3, scale)), secondColor, '#ffffff');
    }
    const diamondStep = Math.round(14 * Math.min(2, scale));
    const diamondR = Math.round(3 * Math.min(3, scale));
    for (let bx = startX + ((Math.floor(now / 20)) % diamondStep); bx < targetX; bx += diamondStep) {
      this.pixelDiamond(bx, startY, diamondR, pal.primary, pal.core);
    }
    if (isGrand || isPierce || scale > 1) {
      this.pixelEllipse(startX + 4 * scale, startY, Math.round(4 * scale), Math.round(10 * scale), isGrand ? C[31] : pal.core, false, stroke);
    }
    this.pixelDiamond(startX, startY, Math.round(6 * Math.min(3, scale)), pal.primary, pal.core);
    this.pixelCircle(targetX, startY, Math.round((7 + Math.sin(fraction * Math.PI) * 9) * scale), pal.primary, false, stroke);
    this.pixelDiamond(targetX, startY, Math.round(8 * Math.min(3, scale)), dual ? secondColor : pal.primary, pal.core);
    g.restore();
  }

  drawWaveVfx(startX, targetX, color, secondColor, dual, travel, element = null, now = 0, isGrand = false, scale = isGrand ? 5 : 1) {
    const g = this.ctx;
    const elem = element ?? Object.keys(ELEMENT_IMPACT).find(id => ELEMENT_IMPACT[id].primary === color) ?? 'fire';
    const fam = vfxFamily(elem);
    const pal = ELEMENT_IMPACT[elem] ?? ELEMENT_IMPACT.fire;
    const waveX = Math.round(startX + (targetX - startX) * travel);
    const heightHalf = Math.round(18 * scale);
    const hScale = Math.min(3, scale);
    const stroke = Math.min(4, scale);

    if (fam === 'lightning') {
      // Sweeping curtain of crackling vertical thunderbolts
      const boltThick = Math.min(5, scale);
      const topY = Math.max(0, 126 - heightHalf);
      this.pixelBolt(waveX + Math.round(2 * scale), topY, waveX - Math.round(2 * scale), 146, now * 0.06, pal.primary, pal.core, boltThick);
      this.pixelBolt(waveX - Math.round(6 * scale), Math.max(0, topY + Math.round(4 * scale)), waveX - Math.round(9 * scale), 146, now * 0.07 + 2, pal.secondary, pal.core, boltThick);
      if (dual) this.pixelBolt(waveX + Math.round(7 * scale), Math.max(0, 130 - heightHalf), waveX + Math.round(5 * scale), 146, now * 0.05 + 4, secondColor, pal.core, boltThick);
    } else if (fam === 'earth') {
      // Tectonic rising earth spikes marching along floor
      for (const [dx, w, baseH] of [[-10, 5, 14], [-3, 7, 26], [5, 5, 19]]) {
        const sw = Math.round(w * scale);
        const h = Math.min(144, Math.round(baseH * scale));
        const sx = waveX + Math.round(dx * scale);
        const sy = Math.max(0, 146 - h);
        const drawH = 146 - sy;
        g.fillStyle = pal.secondary;
        g.fillRect(sx - stroke, sy, sw + stroke * 2, drawH);
        g.fillStyle = pal.primary;
        g.fillRect(sx, sy + 2, sw, Math.max(2, drawH - 2));
        g.fillStyle = pal.core;
        g.fillRect(sx, sy, sw, Math.min(drawH, 2 * stroke));
      }
    } else if (fam === 'ice') {
      // Sweeping glacial wall with sharp forward icicle teeth
      for (let dy = -heightHalf; dy <= 18; dy++) {
        const wy = 128 + dy;
        if (wy < 0 || wy > 146) continue;
        const normDy = dy < 0 ? dy / heightHalf : dy / 18;
        const jagged = (Math.abs(dy) % Math.round(6 * Math.min(2, scale)) < Math.round(3 * Math.min(2, scale))) ? Math.round(4 * hScale) : -Math.round(hScale);
        const wx = waveX + Math.round(Math.cos(normDy * (Math.PI / 2)) * 9 * hScale) + jagged;
        g.fillStyle = pal.secondary; g.fillRect(wx - Math.round(8 * hScale), wy, Math.round(4 * hScale), 1);
        g.fillStyle = dual && Math.abs(dy) % 4 < 2 ? secondColor : pal.primary; g.fillRect(wx - Math.round(4 * hScale), wy, Math.round(5 * hScale), 1);
        g.fillStyle = pal.core; g.fillRect(wx + Math.round(hScale), wy, Math.round(3 * hScale), 1);
      }
    } else if (fam === 'wind') {
      // Twin slicing emerald crescent blades
      for (const offset of [-5, 4]) {
        for (let dy = -heightHalf; dy <= 18; dy++) {
          const wy = 128 + dy;
          if (wy < 0 || wy > 146) continue;
          const normDy = dy < 0 ? dy / heightHalf : dy / 18;
          const curve = Math.round(Math.cos(normDy * (Math.PI / 2)) * 12 * hScale);
          const wx = waveX + curve + Math.round(offset * hScale);
          g.fillStyle = offset > 0 ? pal.core : pal.primary;
          g.fillRect(wx - Math.round(2 * hScale), wy, Math.round(4 * hScale), 1);
        }
      }
    } else if (fam === 'water') {
      // Cresting tsunami wave with curling foam lip & droplet spray
      for (let dy = -heightHalf; dy <= 18; dy++) {
        const wy = 128 + dy;
        if (wy < 0 || wy > 146) continue;
        const normDy = dy < 0 ? dy / heightHalf : dy / 18;
        const curl = dy < -Math.round(8 * scale) ? Math.round((dy + Math.round(8 * scale)) * -0.9) : 0;
        const curve = Math.round(Math.cos(normDy * (Math.PI / 2)) * 10 * hScale) + curl;
        const wx = waveX + curve;
        g.fillStyle = pal.secondary; g.fillRect(wx - Math.round(10 * hScale), wy, Math.round(4 * hScale), 1);
        g.fillStyle = dual && Math.abs(dy) % 4 < 2 ? secondColor : pal.primary; g.fillRect(wx - Math.round(6 * hScale), wy, Math.round(7 * hScale), 1);
        g.fillStyle = dy < -Math.round(7 * scale) ? pal.core : pal.rim; g.fillRect(wx + Math.round(hScale), wy, Math.round(3 * hScale), 1);
      }
      this.pixelDiamond(waveX + Math.round(10 * hScale), Math.max(8, 128 - heightHalf), Math.round(2 * Math.min(2.5, scale)), pal.rim, pal.core);
    } else {
      // Fire / Akki roaring flame crest wave
      for (let dy = -heightHalf; dy <= 18; dy++) {
        const wy = 128 + dy;
        if (wy < 0 || wy > 146) continue;
        const normDy = dy < 0 ? dy / heightHalf : dy / 18;
        const flicker = Math.round(Math.sin(dy * 0.45 + now * 0.03) * 3 * hScale);
        const curve = Math.round(Math.cos(normDy * (Math.PI / 2)) * 10 * hScale) + flicker;
        const wx = waveX + curve;
        const c = dual && Math.abs(dy) % 4 < 2 ? secondColor : pal.primary;
        g.fillStyle = pal.secondary; g.fillRect(wx - Math.round(9 * hScale), wy, Math.round(3 * hScale), 1);
        g.fillStyle = c; g.fillRect(wx - Math.round(6 * hScale), wy, Math.round(7 * hScale), 1);
        g.fillStyle = pal.core; g.fillRect(wx + Math.round(hScale), wy, Math.round(2 * hScale), 1);
      }
    }
    this.pixelEllipse(waveX + Math.round(4 * hScale), 146, Math.round(15 * scale), Math.min(14, Math.round(3 * scale)), pal.core, false, stroke);
    if (!this.settings.reducedMotion) {
      for (let i = 0; i < 6; i++) {
        const dx = Math.round((i * 6 + 4) * scale);
        const dy = Math.round((4 + (i % 3) * 7 + travel * 10) * hScale);
        this.pixelDiamond(waveX - dx, Math.max(4, 142 - dy), Math.max(1, Math.round(hScale)), i % 2 && dual ? secondColor : pal.primary, pal.core);
      }
    }
  }

  drawStormVfx(x, element, fraction, secondaryElement, now = 0, isGrand = false, scale = isGrand ? 5 : 1) {
    const g = this.ctx;
    const fam = vfxFamily(element ?? 'storm');
    const palette = ELEMENT_IMPACT[element] ?? ELEMENT_IMPACT.storm;
    const grow = Math.min(1, fraction / 0.65);
    const rings = isGrand ? 5 : 4;
    const stroke = Math.min(4, scale);
    const orbDiam = Math.round(2 * Math.min(2.5, scale));
    g.save();
    g.globalAlpha = this.settings.reducedMotion ? 0.75 : 1 - Math.max(0, fraction - 0.72) * 2;
    if (fam === 'lightning') {
      // Storm cloud canopy + sky thunderbolts crashing into cyclone
      this.pixelEllipse(x, 32, Math.round(22 * scale), Math.min(18, Math.round(6 * Math.min(3, scale))), C[21], true);
      this.pixelEllipse(x, 30, Math.round(18 * scale), Math.min(14, Math.round(4 * Math.min(3, scale))), C[20], true);
      if (fraction > 0.12 && fraction < 0.85) {
        this.pixelBolt(x + Math.round(Math.sin(now / 35) * 8 * scale), 34, x, 136, now * 0.08, palette.primary, palette.core, Math.min(5, scale));
      }
    } else if (fam === 'ice') {
      // Falling crystal hailstones & frost cyclone
      for (let s = 0; s < 5; s++) {
        const sx = Math.round(x + (-16 + s * 8 + Math.sin(fraction * 8 + s) * 3) * scale);
        const sy = Math.round(Math.max(12, 66 - (scale - 1) * 10) + ((fraction * 82 + s * 19) % (74 + (scale - 1) * 10)));
        this.pixelDiamond(sx, sy, Math.round((s % 2 ? 3 : 2) * Math.min(2.5, scale)), palette.primary, palette.core);
      }
    } else if (fam === 'earth') {
      // Levitating stone chunks orbiting rock cyclone
      const cSize = Math.min(3, scale);
      for (let b = 0; b < 5; b++) {
        const ang = fraction * Math.PI * 3.5 + b * 1.25;
        const bx = Math.round(x + Math.cos(ang) * (12 + b * 2) * scale);
        const by = Math.round(Math.max(14, 138 - b * Math.round(9 * Math.min(2.6, scale)) + Math.sin(ang) * 3 * scale));
        g.fillStyle = palette.secondary; g.fillRect(bx - Math.round(3 * cSize), by - Math.round(2 * cSize), Math.round(6 * cSize), Math.round(5 * cSize));
        g.fillStyle = palette.primary; g.fillRect(bx - Math.round(2 * cSize), by - Math.round(cSize), Math.round(4 * cSize), Math.round(3 * cSize));
      }
    }
    const stepY = Math.round(9 * Math.min(2.6, scale));
    for (let ring = 0; ring < rings; ring++) {
      const radius = Math.round((6 + ring * 4) * scale * (0.4 + grow * 0.6));
      const angle = fraction * Math.PI * 4 + ring * 1.3;
      const y = Math.max(8, 145 - ring * stepY);
      const ry = Math.min(22, Math.round((2 + ring) * Math.min(2.5, scale)));
      const color = ring % 2 ? palette.primary : elementColor[secondaryElement] ?? palette.secondary;
      this.pixelEllipse(x, y, radius, ry, color, false, stroke);
      if (fam === 'fire' || fam === 'wind' || fam === 'water') {
        this.pixelDiamond(x + Math.round(Math.cos(angle) * radius), y + Math.round(Math.sin(angle) * 3 * Math.min(2.5, scale)), orbDiam, palette.primary, palette.core);
      } else {
        g.fillStyle = palette.core;
        g.fillRect(x + Math.round(Math.cos(angle) * radius) - Math.round(2 * Math.min(2.5, scale)), y + Math.round(Math.sin(angle) * 3 * Math.min(2.5, scale)), Math.round(5 * Math.min(2.5, scale)), Math.max(1, stroke));
      }
    }
    if (isGrand || scale > 1) {
      this.pixelEllipse(x, 146, Math.round(20 * scale * grow), Math.min(16, Math.round(4 * Math.min(3, scale))), isGrand ? C[31] : palette.core, false, stroke);
    }
    if (!this.settings.reducedMotion) {
      for (let i = 0; i < 8; i++) {
        const angle = fraction * Math.PI * 3 + i * Math.PI / 4;
        const radius = (9 + i * 2) * Math.min(2.5, scale) * grow;
        const py = Math.max(5, Math.round(142 - ((fraction * 42 + i * 8) % 55) * Math.min(2, scale)));
        this.pixelDiamond(Math.round(x + Math.cos(angle) * radius), py, Math.max(1, Math.round(Math.min(2, scale))), i % 2 ? palette.rim : palette.primary, palette.core);
      }
    }
    g.restore();
  }

  drawFireBurst(centerX, fraction, targets, positions, scale = 1) {
    const g = this.ctx;
    const pal = ELEMENT_IMPACT.blast;
    const reduced = this.settings.reducedMotion;
    const stroke = Math.min(4, scale);
    g.save();
    if (!reduced) {
      g.globalAlpha = Math.min(1, (1 - fraction) / 0.35);
      if (!drawCombatSprite(g, combatSpriteSheets.fireBurst, fraction, centerX, 145, 0.7 * scale)) {
        this.drawExplosionVfx(centerX, 126, fraction, [], [], 'blast', scale);
      }
    } else {
      this.pixelEllipse(centerX, 145, Math.round(20 * scale), Math.min(18, Math.round(5 * scale)), pal.primary, false, stroke);
    }
    g.globalAlpha = reduced ? 1 : Math.min(1, (1 - fraction) / 0.22);
    const satScale = Math.min(3, scale);
    for (const [index, enemy] of this.state.enemies.entries()) {
      const x = positions[index];
      if (x === centerX || !targets?.includes(enemy.id)) continue;
      const arrival = this.blastArrival(x, centerX);
      if (fraction < arrival) {
        const edge = Math.round(centerX + (x - centerX) * fraction / arrival);
        this.pixelEllipse(edge, 146, Math.round(7 * satScale), Math.min(10, Math.round(2 * satScale)), pal.rim, false, stroke);
      } else {
        const local = reduced ? 0.45 : (fraction - arrival) / (1 - arrival);
        const lift = Math.round(Math.sin(local * Math.PI) * 11 * satScale);
        this.pixelEllipse(x, 146, Math.round((7 + local * 7) * satScale), Math.min(12, Math.round(3 * satScale)), pal.rim, false, stroke);
        for (const dx of [-6, 0, 6]) {
          this.pixelDiamond(x + Math.round(dx * satScale), Math.max(6, 141 - lift + Math.round(Math.abs(dx) * satScale)), Math.round((dx === 0 ? 3 : 2) * satScale), pal.primary, pal.core);
        }
      }
    }
    g.restore();
  }

  blastArrival(x, centerX) {
    if (this.settings.reducedMotion) return 0;
    return x === centerX ? 0 : Math.min(0.5, 0.10 + Math.abs(x - centerX) / 420);
  }

  drawExplosionVfx(centerX, centerY, fraction, targets = [], positions = [], elem = 'blast', scale = 1, secondElement, devastation = false) {
    const g = this.ctx;
    const fam = vfxFamily(elem);
    const pal = ELEMENT_IMPACT[elem] ?? ELEMENT_IMPACT.blast;
    const stroke = Math.max(1, Math.min(4, Math.round(scale)));
    const outerR = Math.round((8 + fraction * 28) * scale);
    const innerR = Math.round((5 + Math.sin(fraction * Math.PI) * 16) * scale);
    this.pixelEllipse(centerX, 146, outerR + Math.round(6 * scale), Math.min(24, Math.round(6 * Math.min(3, scale))), pal.secondary, false, stroke);
    this.pixelEllipse(centerX, 146, outerR, Math.min(18, Math.round(4 * Math.min(3, scale))), pal.primary, false, stroke);
    this.pixelCircle(centerX, centerY, outerR, pal.primary, false, stroke);
    this.pixelCircle(centerX, centerY, Math.max(2, outerR - Math.round(3 * Math.min(3, scale))), ELEMENT_IMPACT[secondElement]?.primary ?? pal.rim, false, stroke);
    if (devastation) {
      this.pixelCircle(centerX, centerY, Math.round(outerR * 1.25), C[31], false, stroke);
    }
    if (fraction < 0.78) {
      this.pixelCircle(centerX, centerY, innerR, elem === 'blackhole' ? C[0] : pal.primary, true);
      this.pixelCircle(centerX, centerY, Math.max(2, Math.round(innerR * 0.55)), elem === 'blackhole' ? pal.secondary : pal.core, true);
    }
    const rayBoltThick = Math.max(1, Math.min(5, Math.round(scale)));
    const rayDiamSize = Math.round((fraction < 0.5 ? 3 : 2) * Math.min(2.5, Math.max(1, scale)));
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI) / 6 + fraction * 1.25;
      const dist = Math.round(fraction * 30 * scale);
      const ex = Math.round(centerX + Math.cos(ang) * dist);
      const ey = Math.round(centerY + Math.sin(ang) * dist * 0.75);
      if (fam === 'lightning' && i % 3 === 0) {
        this.pixelBolt(centerX, centerY, ex, ey, i + fraction * 6, pal.primary, pal.core, rayBoltThick);
      } else {
        this.pixelDiamond(ex, ey, rayDiamSize, pal.primary, pal.core);
      }
    }
    const pScale = Math.min(3.5, Math.max(1, scale));
    const pwOuter = Math.round(8 * Math.min(3, scale));
    const pwMid = Math.round(5 * Math.min(3, scale));
    const pwCore = Math.max(2, Math.round(2 * Math.min(3, scale)));
    for (const id of targets ?? []) {
      const idx = this.state?.enemies.findIndex(enemy => enemy.id === id) ?? -1;
      const hitX = positions[idx];
      if (!hitX) continue;
      const arrival = this.blastArrival(hitX, centerX);
      if (fraction < arrival) continue;
      const pillarH = Math.min(144, Math.round(Math.sin((fraction - arrival) / (1 - arrival) * Math.PI) * 34 * pScale));
      if (pillarH > 2) {
        const py = Math.max(0, 146 - pillarH);
        const drawH = 146 - py;
        g.fillStyle = pal.secondary;
        g.fillRect(hitX - pwOuter, py, pwOuter * 2, drawH);
        g.fillStyle = pal.primary;
        g.fillRect(hitX - pwMid, py, pwMid * 2, drawH);
        g.fillStyle = elem === 'blackhole' ? C[0] : pal.core;
        g.fillRect(hitX - pwCore, py, pwCore * 2, drawH);
      }
    }
  }

  drawDeathVfx(x, y, fraction, now = 0) {
    const g = this.ctx;
    const pal = ELEMENT_IMPACT.death;
    const f = Math.max(0, Math.min(1, fraction));
    g.save();
    // 1. Vertical execution beam piercing from heavens into ground
    if (f < 0.75) {
      const beamAlpha = Math.sin((f / 0.75) * Math.PI) * 0.85;
      g.globalAlpha = beamAlpha;
      g.fillStyle = pal.secondary; g.fillRect(x - 12, 12, 24, 134);
      g.fillStyle = pal.primary; g.fillRect(x - 5, 16, 10, 130);
      g.fillStyle = pal.core; g.fillRect(x - 2, 20, 4, 126);
    }
    // 2. Twin grim scythe execution cross-slash
    g.globalAlpha = Math.max(0, 1 - f * 0.88);
    const reach = Math.round(10 + Math.min(1, f * 1.9) * 24);
    for (let s = -reach; s <= reach; s++) {
      g.fillStyle = pal.secondary;
      g.fillRect(x + s - 3, y + s - 3, 6, 6);
      g.fillRect(x + s - 3, y - s - 3, 6, 6);
      g.fillStyle = pal.primary;
      g.fillRect(x + s - 1, y + s - 1, 3, 3);
      g.fillRect(x + s - 1, y - s - 1, 3, 3);
      g.fillStyle = pal.core;
      g.fillRect(x + s, y + s, 1, 1);
      g.fillRect(x + s, y - s, 1, 1);
    }
    // 3. Central death sigil & expanding void shockwaves
    this.pixelCircle(x, y, Math.round(10 + f * 28), pal.primary, false, 2);
    this.pixelCircle(x, y, Math.round(6 + f * 16), pal.rim, false, 1);
    this.pixelEllipse(x, 146, Math.round(16 + f * 22), 5, pal.secondary, false, 2);
    // 4. Rising soul wisps (harvested soul particles ascending)
    for (let i = 0; i < 10; i++) {
      const ang = (i * Math.PI) / 5 + now * 0.003;
      const dist = Math.round(8 + f * 26);
      const sx = Math.round(x + Math.cos(ang) * dist);
      const sy = Math.round(y + Math.sin(ang) * dist * 0.6 - f * 24);
      this.pixelDiamond(sx, sy, i % 2 ? 2 : 1, pal.primary, pal.core);
    }
    g.restore();
  }

  drawHitBurstVfx(x, y, color, fraction, elem = null, now = 0, scale = 1) {
    const g = this.ctx;
    const f = Math.max(0, Math.min(1, fraction));
    const resolvedElem = elem ?? (color === elementColor.ice ? 'ice' : color === elementColor.lightning ? 'lightning' : 'fire');
    const fam = vfxFamily(resolvedElem);
    const pal = ELEMENT_IMPACT[resolvedElem] ?? ELEMENT_IMPACT.fire;
    const stroke = Math.max(1, Math.min(4, Math.round(scale)));
    const dMult = Math.min(2.5, Math.max(1, scale));

    // A brief directional star and outward fragments make contact readable at game scale.
    if (!this.settings.reducedMotion && f < 0.8) {
      const reach = Math.round((5 + f * 22) * dMult);
      g.save();
      g.globalAlpha = 1 - f / 0.8;
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const inner = reach * 0.45;
        const outerX = Math.round(x + Math.cos(angle) * reach);
        const outerY = Math.round(y + Math.sin(angle) * reach * 0.7);
        const innerX = Math.round(x + Math.cos(angle) * inner);
        const innerY = Math.round(y + Math.sin(angle) * inner * 0.7);
        this.pixelDiamond(outerX, outerY, Math.max(1, Math.round((1.8 - f) * dMult)), i % 2 ? pal.rim : pal.primary, pal.core);
        if (f < 0.35) this.pixelDiamond(innerX, innerY, Math.max(1, Math.round(dMult)), pal.primary, pal.core);
      }
      g.restore();
    }

    if (fam === 'ice') {
      const r = Math.round((6 + f * 22) * scale);
      this.pixelCircle(x, y, r, pal.secondary, false, stroke);
      this.pixelCircle(x, y, Math.max(3, r - 2 * stroke), pal.primary, false, stroke);
      this.pixelCircle(x, y, Math.max(2, r - 5 * stroke), pal.core, false, Math.max(1, stroke - 1));
      if (f < 0.72) this.pixelDiamond(x, y, Math.round((11 - f * 9) * dMult), pal.primary, pal.core);
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        const innerD = Math.round((2 + f * 4) * scale);
        const outerD = Math.round((12 + f * 20) * scale);
        const step = Math.max(2, Math.round(2 * scale));
        const dotS = Math.max(2, Math.round(2 * dMult));
        for (let s = innerD; s <= outerD; s += step) {
          g.fillStyle = s > (innerD + outerD) / 2 ? pal.primary : pal.core;
          g.fillRect(Math.round(x + Math.cos(ang) * s) - Math.floor(dotS / 2), Math.round(y + Math.sin(ang) * s) - Math.floor(dotS / 2), dotS, dotS);
        }
        this.pixelDiamond(Math.round(x + Math.cos(ang + 0.39) * (7 + f * 18) * scale), Math.round(y + Math.sin(ang + 0.39) * (7 + f * 18) * scale), Math.round((f < 0.55 ? 3 : 2) * dMult), pal.primary, pal.core);
      }
    } else if (fam === 'lightning') {
      const boltThick = Math.min(5, scale);
      if (f < 0.75) {
        this.pixelBolt(x + Math.round(Math.sin(f * 20) * 6 * scale), Math.max(0, 14 - (scale - 1) * 4), x, y, now * 0.06 + f * 10, pal.primary, pal.core, boltThick);
      }
      const r = Math.round((6 + f * 19) * scale);
      this.pixelCircle(x, y, r, pal.secondary, false, stroke);
      this.pixelCircle(x, y, Math.max(2, r - 2 * stroke), pal.primary, false, stroke);
      if (f < 0.65) this.pixelDiamond(x, y, Math.round((9 - f * 7) * dMult), pal.primary, pal.core);
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + 0.78;
        this.pixelBolt(x, y, Math.round(x + Math.cos(ang) * (12 + f * 18) * scale), Math.round(y + Math.sin(ang) * (12 + f * 18) * scale), i * 3.1 + f * 8, i % 2 ? pal.secondary : pal.primary, pal.core, Math.max(1, boltThick - 1));
      }
    } else if (fam === 'earth') {
      // Shattering stone splinters & quake ring
      this.pixelEllipse(x, 146, Math.round((10 + f * 22) * scale), Math.min(18, Math.round(5 * Math.min(3, scale))), pal.secondary, false, stroke);
      this.pixelEllipse(x, 146, Math.round((6 + f * 16) * scale), Math.min(12, Math.round(3 * Math.min(3, scale))), pal.primary, false, stroke);
      const sBox = Math.round(5 * dMult);
      const sMid = Math.round(3 * dMult);
      for (let i = 0; i < 6; i++) {
        const dx = Math.round((i - 2.5) * (6 + f * 6) * scale);
        const dy = Math.max(4, Math.round(y + 16 - Math.sin(f * Math.PI) * (18 + (i % 3) * 6) * Math.min(3, scale)));
        g.fillStyle = pal.secondary; g.fillRect(x + dx - Math.floor(sBox / 2), dy - Math.floor(sBox / 2), sBox, sBox);
        g.fillStyle = pal.primary; g.fillRect(x + dx - Math.floor(sMid / 2), dy - Math.floor(sMid / 2), sMid, sMid);
        g.fillStyle = pal.core; g.fillRect(x + dx - 1, dy - 1, Math.max(1, Math.floor(dMult)), Math.max(1, Math.floor(dMult)));
      }
    } else if (fam === 'water') {
      // Aqua hydro burst & rising splash arcs
      const r = Math.round((5 + f * 20) * scale);
      this.pixelEllipse(x, 146, r + Math.round(4 * scale), Math.min(16, Math.round(4 * Math.min(3, scale))), pal.primary, false, stroke);
      this.pixelCircle(x, y, r, pal.secondary, false, stroke);
      this.pixelCircle(x, y, Math.max(2, r - 4 * stroke), pal.core, false, Math.max(1, stroke - 1));
      for (let i = 0; i < 8; i++) {
        const ang = -Math.PI * 0.15 - (i * Math.PI) / 7;
        const dist = (5 + f * 22) * scale;
        const sx = Math.round(x + Math.cos(ang) * dist);
        const sy = Math.max(4, Math.round(y + 6 + Math.sin(ang) * dist + f * f * 14 * scale));
        this.pixelDiamond(sx, sy, Math.round(2 * dMult), pal.primary, pal.core);
      }
    } else if (fam === 'wind') {
      // Diagonal dual wind-scythe gale slashes
      const reach = Math.round((7 + f * 14) * scale);
      const thick = Math.max(2, Math.round(2 * dMult));
      for (let s = -reach; s <= reach; s++) {
        const wy1 = y + Math.round(s * 0.6);
        const wy2 = y - Math.round(s * 0.6);
        if (wy1 >= 0 && wy1 <= 146) {
          g.fillStyle = pal.secondary; g.fillRect(x + s - 1, wy1 - 1, thick + 1, thick);
        }
        if (wy2 >= 0 && wy2 <= 146) {
          g.fillStyle = pal.core; g.fillRect(x + s, wy2, thick, Math.max(1, thick - 1));
        }
      }
      this.pixelEllipse(x, y, Math.round((12 + f * 14) * scale), Math.min(36, Math.round((5 + f * 6) * scale)), pal.primary, false, stroke);
    } else {
      const r = Math.round((6 + f * 22) * scale);
      const flameH = Math.min(144, Math.round(Math.sin(f * Math.PI) * 32 * Math.min(3.5, scale)));
      if (flameH > 2) {
        const fy = Math.max(0, 146 - flameH);
        const drawH = 146 - fy;
        const fw1 = Math.round(10 * Math.min(3, scale));
        const fw2 = Math.round(6 * Math.min(3, scale));
        const fw3 = Math.round(3 * Math.min(3, scale));
        g.fillStyle = pal.secondary; g.fillRect(x - fw1, fy, fw1 * 2, drawH);
        g.fillStyle = pal.primary; g.fillRect(x - fw2, fy + 2, fw2 * 2, Math.max(2, drawH - 2));
        g.fillStyle = pal.core; g.fillRect(x - fw3, fy + 4, fw3 * 2, Math.max(2, drawH - 4));
      }
      this.pixelCircle(x, y, r + 2 * stroke, pal.secondary, false, stroke);
      this.pixelCircle(x, y, r, pal.primary, false, stroke);
      this.pixelCircle(x, y, Math.max(2, r - 3 * stroke), pal.rim, false, Math.max(1, stroke - 1));
      if (f < 0.68) {
        this.pixelCircle(x, y, Math.max(2, Math.round((10 - f * 10) * scale)), pal.core, true);
        this.pixelDiamond(x, y, Math.round((11 - f * 9) * dMult), pal.primary, pal.core);
      }
      for (let i = 0; i < 10; i++) {
        const ang = (i * Math.PI) / 5 + f * 0.7;
        const d = Math.round((5 + f * 22) * scale);
        this.pixelDiamond(Math.round(x + Math.cos(ang) * d), Math.max(4, Math.round(y + Math.sin(ang) * d - f * 10 * scale)), Math.round((i % 2 === 0 && f < 0.65 ? 3 : 2) * dMult), i % 3 === 0 ? pal.secondary : pal.primary, pal.core);
      }
    }
  }

  drawEnemyAttackVfx(enemyX, playerX, fraction, impact, event, now) {
    const g = this.ctx;
    const isSpecial = Boolean(event.specialBoss);
    const isUltimate = Boolean(event.ultimate);
    const isStormBoss = event.sourceKind === 'tempest_archon' || event.sourceKind === 'thunder_drake_emperor';
    const isWaterBoss = event.sourceKind === 'abyssal_cthulhu';
    const isArcaneBoss = event.sourceKind === 'crown_archivist';
    const isNetherBoss = event.sourceKind === 'nether_dread_lord';
    const isEternityBoss = event.sourceKind === 'eternity_overlord' || event.sourceKind === 'eternity_reborn';
    const isInkTentacle = event.sourceKind === 'cthulhu_ink_tentacle';

    const hitsSummon = event.target === 'summon';
    const playerShieldHit = (event.playerAbsorbed ?? (hitsSummon ? 0 : (event.absorbed ?? 0))) > 0;
    if (isUltimate) {
      if (fraction < 0.62) {
        const t = fraction / 0.62;
        const destX = hitsSummon ? playerX + 4 : playerX + 10;
        const projX = Math.round(enemyX - 18 - (enemyX - 18 - destX) * t);
        if (isEternityBoss) {
          // Golden-magenta cosmic supernova lance hurtling across space-time
          for (let trail = 1; trail <= 7; trail++) {
            const tx = Math.round(projX + trail * 10);
            const r = Math.max(3, 13 - trail);
            this.pixelCircle(tx, 118 + Math.round(Math.sin(now / 40 + trail) * 5), r, trail % 2 ? C[22] : C[30], true);
          }
          this.pixelCircle(projX, 118, 14, C[22], true);
          this.pixelCircle(projX, 118, 10, C[30], true);
          this.pixelDiamond(projX - 2, 118, 7, C[31], C[9]);
          this.pixelBolt(enemyX - 16, 114, projX, 118, now * 0.08, C[31], C[23]);
        } else if (isNetherBoss) {
          // Sweeping crimson-violet underworld eclipse wave hurtling across arena
          for (let trail = 1; trail <= 6; trail++) {
            const tx = Math.round(projX + trail * 11);
            const r = Math.max(3, 12 - trail);
            this.pixelCircle(tx, 118 + Math.round(Math.sin(now / 45 + trail) * 4), r, trail % 2 ? C[20] : C[18], true);
          }
          this.pixelCircle(projX, 118, 13, C[20], true);
          this.pixelCircle(projX, 118, 9, C[18], true);
          this.pixelDiamond(projX - 2, 117, 5, C[23], C[31]);
        } else if (isWaterBoss) {
          // Towering crashing tsunami wave wall surging across the arena
          const waveH = Math.round(28 + t * 22);
          for (let trail = 0; trail <= 5; trail++) {
            const tx = Math.round(projX + trail * 10);
            const h = Math.max(8, waveH - trail * 5);
            g.fillStyle = trail % 2 ? C[24] : C[25];
            g.fillRect(tx - 6, 146 - h, 12, h);
            g.fillStyle = C[27];
            g.fillRect(tx - 7, 146 - h, 14, 3);
          }
          this.pixelCircle(projX - 4, 146 - waveH + 4, 7, C[26], true);
          this.pixelCircle(projX - 6, 146 - waveH + 2, 4, C[9], true);
        } else if (isStormBoss) {
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
        const hitX = hitsSummon ? playerX : (playerShieldHit ? playerX + 16 : playerX + 4);
        if (isEternityBoss) {
          // Celestial Golden-Violet Supernova Pillar & Astral Starlight Burst
          const colH = Math.round(Math.sin(imp * Math.PI) * 84);
          if (colH > 3) {
            g.fillStyle = C[21]; g.fillRect(hitX - 22, 147 - colH, 44, colH);
            g.fillStyle = C[30]; g.fillRect(hitX - 15, 147 - colH + 3, 30, colH - 3);
            g.fillStyle = C[31]; g.fillRect(hitX - 8, 147 - colH + 6, 16, Math.max(2, colH - 6));
            g.fillStyle = C[9]; g.fillRect(hitX - 3, 147 - colH + 9, 6, Math.max(2, colH - 9));
          }
          this.drawElementalImpactFlash(hitX, 122, 'lightning', imp);
          this.pixelCircle(hitX, 122, Math.round(12 + imp * 38), C[30], false);
          this.pixelCircle(hitX, 122, Math.round(7 + imp * 26), C[23], false);
          for (let i = 0; i < 12; i++) {
            const ang = (i * Math.PI) / 6 + imp * 0.75;
            const d = Math.round(8 + imp * 38);
            const sx = Math.round(hitX + Math.cos(ang) * d);
            const sy = Math.round(122 + Math.sin(ang) * d - imp * 10);
            this.pixelDiamond(sx, sy, i % 2 === 0 ? 4 : 3, i % 2 === 0 ? C[31] : C[23], C[9]);
          }
        } else if (isNetherBoss) {
          // Crimson-violet hellfire pillar & soul-reaping eclipse burst
          const colH = Math.round(Math.sin(imp * Math.PI) * 74);
          if (colH > 3) {
            g.fillStyle = C[20]; g.fillRect(hitX - 20, 147 - colH, 40, colH);
            g.fillStyle = C[18]; g.fillRect(hitX - 13, 147 - colH + 3, 26, colH - 3);
            g.fillStyle = C[23]; g.fillRect(hitX - 7, 147 - colH + 6, 14, Math.max(2, colH - 6));
            g.fillStyle = C[31]; g.fillRect(hitX - 2, 147 - colH + 10, 4, Math.max(2, colH - 10));
          }
          this.drawDeathVfx(hitX, 122, imp, now);
          this.pixelCircle(hitX, 124, Math.round(10 + imp * 34), C[18], false);
          this.pixelCircle(hitX, 124, Math.round(6 + imp * 24), C[23], false);
          for (let i = 0; i < 12; i++) {
            const ang = (i * Math.PI) / 6 + imp * 0.65;
            const d = Math.round(8 + imp * 34);
            const sx = Math.round(hitX + Math.cos(ang) * d);
            const sy = Math.round(124 + Math.sin(ang) * d - imp * 10);
            this.pixelDiamond(sx, sy, i % 2 === 0 ? 4 : 3, i % 2 === 0 ? C[18] : C[22], C[31]);
          }
        } else if (isWaterBoss) {
          // Giant abyssal geyser & crashing tsunami foam burst
          const colH = Math.round(Math.sin(imp * Math.PI) * 70);
          if (colH > 3) {
            g.fillStyle = C[24]; g.fillRect(hitX - 20, 147 - colH, 40, colH);
            g.fillStyle = C[25]; g.fillRect(hitX - 14, 147 - colH + 3, 28, colH - 3);
            g.fillStyle = C[27]; g.fillRect(hitX - 8, 147 - colH + 6, 16, Math.max(2, colH - 6));
            g.fillStyle = C[9]; g.fillRect(hitX - 3, 147 - colH + 9, 6, Math.max(2, colH - 9));
          }
          this.drawElementalImpactFlash(hitX, 122, 'water', imp);
          this.pixelCircle(hitX, 124, Math.round(10 + imp * 34), C[25], false);
          this.pixelCircle(hitX, 124, Math.round(6 + imp * 24), C[27], false);
          for (let i = 0; i < 12; i++) {
            const ang = (i * Math.PI) / 6 + imp * 0.5;
            const d = Math.round(8 + imp * 32);
            const sx = Math.round(hitX + Math.cos(ang) * d);
            const sy = Math.round(124 + Math.sin(ang) * d - imp * 10);
            this.pixelCircle(sx, sy, i % 2 === 0 ? 3 : 2, i % 3 === 0 ? C[9] : C[27], true);
          }
        } else if (isStormBoss) {
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
      const destX = hitsSummon ? playerX + 6 : playerX + 16;
      const waveX = Math.round(enemyX - 12 - (enemyX - 12 - destX) * t);
      if (isSpecial) {
        if (isEternityBoss) {
          for (let dy = -12; dy <= 12; dy++) {
            const curve = Math.round((dy * dy) / 10);
            g.fillStyle = Math.abs(dy) < 4 ? C[9] : Math.abs(dy) < 8 ? C[31] : C[22];
            g.fillRect(waveX + curve, 122 + dy, 6, 1);
          }
          this.pixelDiamond(waveX - 2, 122, 4, C[30], C[9]);
        } else if (isNetherBoss) {
          for (let dy = -12; dy <= 12; dy++) {
            const curve = Math.round((dy * dy) / 10);
            g.fillStyle = Math.abs(dy) < 4 ? C[23] : Math.abs(dy) < 8 ? C[18] : C[20];
            g.fillRect(waveX + curve, 122 + dy, 6, 1);
          }
        } else if (isWaterBoss) {
          for (let dy = -12; dy <= 12; dy++) {
            const curve = Math.round((dy * dy) / 10);
            g.fillStyle = Math.abs(dy) < 4 ? C[9] : Math.abs(dy) < 8 ? C[27] : C[25];
            g.fillRect(waveX + curve, 122 + dy, 6, 1);
          }
        } else if (isStormBoss) {
          this.pixelBolt(enemyX - 14, 118, waveX, 122, now * 0.06, C[31], C[9]);
          this.pixelDiamond(waveX, 122, 4, C[31], C[27]);
        } else {
          for (let dy = -11; dy <= 11; dy++) {
            const curve = Math.round((dy * dy) / 10);
            g.fillStyle = Math.abs(dy) < 4 ? C[30] : Math.abs(dy) < 8 ? C[16] : C[19];
            g.fillRect(waveX + curve, 122 + dy, 6, 1);
          }
        }
      } else if (isArcaneBoss) {
        const originX = enemyX - 28;
        const originY = 62;
        const arcX = Math.round(originX + (destX - originX) * t);
        const arcY = Math.round(originY + (122 - originY) * t);
        this.pixelBolt(originX, originY, arcX, arcY, now * 0.06, '#52ebde', '#dcfffb');
        this.pixelCircle(arcX, arcY, 5, '#5a2e7a', true);
        this.pixelDiamond(arcX, arcY, 3, '#52ebde', '#dcfffb');
      } else if (isInkTentacle && event.manaDrain > 0) {
        this.pixelCircle(waveX, 122, 6, C[0], true);
        this.pixelCircle(waveX, 122, 4, C[21], true);
        this.pixelCircle(waveX - 1, 121, 2, C[23], true);
      } else {
        for (let dy = -8; dy <= 8; dy++) {
          const curve = Math.round((dy * dy) / 10);
          g.fillStyle = Math.abs(dy) < 3 ? C[9] : C[19];
          g.fillRect(waveX + curve, 123 + dy, 4, 1);
        }
      }
    } else {
      const imp = Math.min(1, (fraction - 0.62) / 0.38);
      const hitX = hitsSummon ? playerX : (playerShieldHit ? playerX + 17 : playerX + 4);
      const slashColor = isSpecial
        ? (isEternityBoss ? C[31] : isNetherBoss ? C[18] : isWaterBoss ? C[27] : isStormBoss ? C[31] : C[16])
        : (isInkTentacle && event.manaDrain > 0 ? C[22] : playerShieldHit ? C[27] : C[19]);
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
        if (isEternityBoss) this.drawElementalImpactFlash(hitX, 124, 'lightning', imp);
        else if (isNetherBoss) this.drawDeathVfx(hitX, 124, imp, now);
        else this.drawElementalImpactFlash(hitX, 124, isWaterBoss ? 'water' : isStormBoss ? 'lightning' : 'fire', imp);
      }
    }
  }

  drawHealVfx(x, baselineY, fraction, now, event = null) {
    const g = this.ctx;
    const f = this.settings.reducedMotion ? 0.55 : fraction;
    const kind = event?.healKind ?? 'heal';
    const isEnemy = Boolean(event && event.source !== 'player');
    const isGrand = Boolean(event?.grand || kind === 'grand' || kind === 'regen');
    const isLarge = Boolean(!isGrand && (event?.large || kind === 'large'));
    const isShieldHeal = kind === 'shield-heal';
    const isPair = kind === 'pair';

    if (isEnemy) {
      // Enemy ritual mend: dark violet/amber sigil + inward siphon motes
      this.pixelEllipse(x, baselineY, 15, 4, C[22], false);
      this.pixelEllipse(x, baselineY, 9, 2, C[30], false);
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3 + f * 1.4;
        const dist = Math.round((1 - f * 0.55) * 14 + 3);
        const mx = Math.round(x + Math.cos(ang) * dist);
        const my = Math.round(baselineY - 12 - f * 18 + Math.sin(ang) * 4);
        this.pixelDiamond(mx, my, i % 2 === 0 ? 2 : 1, i % 2 === 0 ? C[22] : C[30], C[23]);
      }
      return;
    }

    const scale = isGrand ? 5 : isLarge ? 2 : 1;
    const stroke = Math.min(4, scale);
    const hScale = Math.min(3.2, scale);
    const crossArm = Math.round(2 * Math.min(3, scale));
    const crossThick = Math.max(1, Math.round(Math.min(2.5, scale)));
    const drawCross = (cx, cy, color) => {
      if (cy < 2 || cy > baselineY) return;
      g.fillStyle = color;
      g.fillRect(cx - crossArm, cy - Math.floor(crossThick / 2), crossArm * 2 + 1, crossThick);
      g.fillRect(cx - Math.floor(crossThick / 2), cy - crossArm, crossThick, crossArm * 2 + 1);
    };

    if (isGrand) {
      // Sanctuary mandala + golden-jade colossal beam + twin rising helix spirals (5x scale)
      this.pixelEllipse(x, baselineY, Math.round(22 * scale), Math.min(20, Math.round(4 * scale)), C[31], false, stroke);
      this.pixelEllipse(x, baselineY, Math.round(16 * scale), Math.min(15, Math.round(3 * scale)), C[26], false, stroke);
      this.pixelEllipse(x, baselineY, Math.round(10 * scale), Math.min(10, Math.round(2 * scale)), C[9], false, Math.max(1, stroke - 1));
      const beamH = Math.min(baselineY - 2, Math.round(Math.sin(Math.min(1, f) * Math.PI) * 44 * hScale));
      if (beamH > 3) {
        const by = Math.max(0, baselineY - beamH);
        const drawH = baselineY - by;
        g.save();
        g.globalAlpha = 0.16;
        g.fillStyle = C[26]; g.fillRect(x - Math.round(10 * scale), by, Math.round(20 * scale), drawH);
        g.fillStyle = C[31]; g.fillRect(x - Math.round(5 * scale), Math.max(0, by - 4), Math.round(10 * scale), Math.min(baselineY - Math.max(0, by - 4), drawH + 4));
        g.restore();
      }
      for (let i = 0; i < 8; i++) {
        const phase = f * Math.PI * 2 + i * 0.78;
        const rise = ((f * 40 * hScale + i * 5 * hScale) % Math.max(24, baselineY - 12));
        const lx = Math.round(x + Math.sin(phase) * 11 * scale);
        const rx = Math.round(x - Math.sin(phase) * 11 * scale);
        const py = Math.round(baselineY - 5 - rise);
        drawCross(lx, py, i % 2 === 0 ? C[31] : C[26]);
        this.pixelDiamond(rx, Math.max(4, py - 2), Math.round((i % 3 === 0 ? 2 : 1.5) * Math.min(2.5, scale)), C[31], C[9]);
      }
      if (!this.settings.reducedMotion) {
        this.pixelDiamond(x, Math.max(10, baselineY - Math.round(36 * hScale) - Math.round(Math.sin(now / 120) * 2 * scale)), Math.round(3 * Math.min(2.5, scale)), C[31], C[9]);
      }
      return;
    }

    if (isLarge) {
      // Double floor rings + emerald-gold light pillar + bold crosses (2x scale)
      this.pixelEllipse(x, baselineY, Math.round(18 * scale), Math.min(14, Math.round(4 * scale)), C[26], false, stroke);
      this.pixelEllipse(x, baselineY, Math.round(12 * scale), Math.min(10, Math.round(3 * scale)), C[31], false, stroke);
      const pillarH = Math.min(baselineY - 2, Math.round(Math.sin(Math.min(1, f) * Math.PI) * 38 * scale));
      if (pillarH > 2) {
        const py = Math.max(0, baselineY - pillarH);
        const drawH = baselineY - py;
        g.save();
        g.globalAlpha = 0.2;
        g.fillStyle = C[26]; g.fillRect(x - Math.round(8 * scale), py, Math.round(16 * scale), drawH);
        g.fillStyle = C[31]; g.fillRect(x - Math.round(3 * scale), py + 2, Math.round(6 * scale), Math.max(2, drawH - 2));
        g.restore();
      }
      for (let i = 0; i < 8; i++) {
        const cx = Math.round(x + (-14 + i * 4 + Math.sin(now / 85 + i) * 2) * scale);
        const cy = Math.round(baselineY - 6 - ((f * 36 * scale + i * 5 * scale) % (36 * scale)));
        drawCross(cx, cy, i % 3 === 0 ? C[31] : i % 2 ? C[9] : C[26]);
      }
      return;
    }

    if (isShieldHeal) {
      // Aqua-emerald ward mend + shield crest sparkles
      this.pixelEllipse(x, baselineY, Math.round(17 * scale), Math.min(12, Math.round(4 * scale)), C[27], false, stroke);
      this.pixelEllipse(x, baselineY, Math.round(11 * scale), Math.min(8, Math.round(2 * scale)), C[26], false, stroke);
      this.pixelCircle(x, baselineY - Math.round(18 * scale), Math.round((14 + Math.sin(f * Math.PI) * 4) * scale), C[27], false, stroke);
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3 + f * 0.9;
        const sx = Math.round(x + Math.cos(ang) * 14 * scale);
        const sy = Math.round(baselineY - 18 * scale + Math.sin(ang) * 12 * scale);
        this.pixelDiamond(sx, sy, i % 2 === 0 ? 2 : 1, C[26], C[9]);
      }
      for (let i = 0; i < 4; i++) {
        const cx = Math.round(x + (-9 + i * 6) * scale);
        const cy = Math.round(baselineY - 6 - ((f * 28 + i * 7) % 28) * scale);
        drawCross(cx, cy, i % 2 ? C[9] : C[26]);
      }
      return;
    }

    if (isPair) {
      // Twin interlocking heal circles + mirrored rising cross columns
      this.pixelEllipse(x - 5, baselineY, 13, 3, C[26], false);
      this.pixelEllipse(x + 5, baselineY, 13, 3, C[27], false);
      for (let i = 0; i < 6; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const cx = Math.round(x + side * (6 + Math.sin(now / 90 + i) * 3));
        const cy = Math.round(baselineY - 6 - ((f * 34 + i * 6) % 34));
        drawCross(cx, cy, side < 0 ? C[26] : C[9]);
      }
      return;
    }

    this.pixelEllipse(x, baselineY, 16, 4, C[26], false);
    this.pixelEllipse(x, baselineY, 10, 2, C[9], false);
    for (let i = 0; i < 6; i++) {
      const cx = Math.round(x - 10 + i * 4 + Math.sin(now / 90 + i) * 3);
      const cy = Math.round(baselineY - 6 - ((f * 32 + i * 6) % 32));
      drawCross(cx, cy, i % 2 ? C[9] : C[26]);
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
    if (this.hpNumbersInHud && event.amount > 0) return;
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

  barrier(x, top, width, color, hit, kind = 'shield', now = 0, appearProgress = 1, isOuterLayer = false, options = {}) {
    const g = this.ctx;
    const rx = Math.round((width / 2) * Math.min(1, 0.4 + appearProgress * 0.6));
    const bottom = 148;
    const height = Math.max(12, bottom - top);
    const cy = bottom - Math.round(height * 0.45);
    const ry = Math.round(height * 0.56);
    const resolvedKind = kind || options.shieldKind || 'shield';
    const fam = resolvedKind === 'ward' || resolvedKind === 'veil' || resolvedKind === 'brace' || resolvedKind === 'guard'
      ? resolvedKind
      : vfxFamily(resolvedKind);
    const isGrand = Boolean(options.grand);
    const isLarge = Boolean(!isGrand && options.large);
    const scale = isGrand ? 5 : isLarge ? 2 : 1;
    const stroke = Math.min(3, scale);
    const dMult = Math.min(2.5, scale);

    g.save();
    this.pixelEllipse(x, bottom - 1, rx + (isGrand ? 4 * scale : 2 * scale), Math.min(16, Math.round(4 * Math.min(3, scale))), hit ? C[9] : (isGrand ? C[31] : color), false, stroke);
    if (isGrand && !isOuterLayer) {
      this.pixelEllipse(x, bottom - 1, rx + scale, Math.min(10, Math.round(2 * Math.min(3, scale))), C[9], false, Math.max(1, stroke - 1));
    }

    for (let dy = -ry; dy <= Math.round(ry * 0.78); dy++) {
      const py = cy + dy;
      if (py < 0 || py > bottom) continue;
      const normY = dy / ry;
      let span;
      if (fam === 'brace') {
        // Broad flat-topped fortress bulwark silhouette
        const taper = dy < -ry * 0.55 ? Math.round(((-dy - ry * 0.55) / (ry * 0.45)) * 4 * scale) : 0;
        span = Math.max(4, rx - taper);
      } else if (fam === 'ice') {
        // Angular hexagonal crystalline frost wall
        const bevel = Math.abs(normY);
        span = bevel < 0.42 ? rx : Math.max(3, Math.round(rx * (1.28 - bevel * 0.88)));
      } else if (fam === 'earth') {
        // Faceted tiered monolith shield wall
        const tier = (Math.floor((dy + ry) / (7 * scale)) % 2) * scale;
        span = Math.max(3, Math.round(rx * Math.sqrt(Math.max(0, 1 - normY * normY))) - tier);
      } else {
        span = Math.round(rx * Math.sqrt(Math.max(0, 1 - normY * normY)));
      }
      if (span <= 0) continue;

      if (!isOuterLayer) {
        if (fam === 'veil') {
          // Staggered translucent curtain shimmer bands
          const shimmer = Math.sin(dy * 0.45 + now / 110) > 0;
          g.globalAlpha = hit ? 0.36 : (shimmer ? 0.24 : 0.08);
        } else if (fam === 'water') {
          const ripple = Math.sin(dy * 0.45 - now / 100) > 0.25;
          g.globalAlpha = hit ? 0.36 : (ripple ? 0.25 : 0.10);
        } else {
          g.globalAlpha = hit ? 0.36 : (dy % 4 === 0 ? 0.22 : 0.11);
        }
        g.fillStyle = hit ? C[9] : color;
        g.fillRect(Math.round(x - span), py, span * 2 + 1, 1);
      }

      g.globalAlpha = hit ? 1 : isOuterLayer ? 0.68 : 0.94;
      g.fillStyle = hit ? C[9] : color;
      const edgeW = (fam === 'brace' ? 3 : dy < -ry * 0.6 ? 3 : 2) * stroke;
      g.fillRect(Math.round(x - span), py, edgeW, 1);
      g.fillRect(Math.round(x + span - edgeW + 1), py, edgeW, 1);

      if (fam === 'brace' && (dy === -ry || dy === Math.round(-ry * 0.25))) {
        g.globalAlpha = 0.72;
        g.fillStyle = C[31];
        g.fillRect(Math.round(x - span + edgeW), py, Math.max(2, span * 2 - edgeW * 2), 1);
      } else if (!isOuterLayer && dy > -ry + 3 && dy < 0 && span > 5) {
        g.globalAlpha = fam === 'ice' ? 0.75 : 0.45;
        g.fillStyle = C[9];
        g.fillRect(Math.round(x - span + edgeW + 1), py, fam === 'ice' ? 2 * stroke : stroke, 1);
      }
    }

    g.globalAlpha = 1;
    const visTop = Math.max(6, top);
    // Silhouette accents per barrier type
    if (fam === 'brace') {
      // Corner fortress rivets
      this.pixelDiamond(x - rx + 3 * stroke, visTop + 5, Math.round(2 * dMult), C[31], C[9]);
      this.pixelDiamond(x + rx - 3 * stroke, visTop + 5, Math.round(2 * dMult), C[31], C[9]);
    } else if (fam === 'guard') {
      // Compact buckler center boss rivet
      this.pixelDiamond(x, Math.max(8, cy), Math.round(2 * dMult), color, C[9]);
    } else if (fam === 'ice') {
      // Sharp crystalline apex spire
      const spireH = Math.round(6 * Math.min(3, scale));
      const sy = Math.max(2, visTop - spireH);
      g.fillStyle = color; g.fillRect(x - 2 * stroke, sy, 4 * stroke, spireH);
      g.fillStyle = C[9]; g.fillRect(x - stroke, Math.max(0, sy - 2), 2 * stroke, spireH);
    } else if (fam === 'earth') {
      // Monolith stone slab blocks along rim
      for (let b = -1; b <= 1; b += 2) {
        const bw = 4 * stroke;
        const bh = Math.round(12 * Math.min(3, scale));
        const by = Math.max(4, cy - Math.floor(bh / 2));
        g.fillStyle = C[11]; g.fillRect(x + b * (rx - 2 * stroke) - Math.floor(bw / 2), by, bw, bh);
        g.fillStyle = color; g.fillRect(x + b * (rx - 2 * stroke) - Math.floor(bw / 4), by + 1, Math.max(2, Math.floor(bw / 2)), bh - 2);
      }
    } else if (fam === 'fire') {
      // Flickering ember flame crest along arch
      for (let i = -2; i <= 2; i++) {
        const fx = x + i * Math.max(4, Math.round(rx * 0.35));
        const fh = Math.round((3 + ((Math.floor(now / 100) + Math.abs(i)) % 4)) * Math.min(3, scale));
        const fy = Math.max(2, visTop - fh + Math.abs(i) * 2 * stroke);
        g.fillStyle = color; g.fillRect(fx - stroke, fy, 3 * stroke, fh);
        g.fillStyle = C[31]; g.fillRect(fx, fy + 1, stroke, Math.max(1, fh - 1));
      }
    } else if (fam === 'wind') {
      // Sweeping emerald gale ribbons
      for (let s = -1; s <= 1; s += 2) {
        const shift = this.settings.reducedMotion ? 0 : Math.floor((now / 80) % 10) * stroke;
        g.fillStyle = C[9];
        g.fillRect(x + s * (rx - stroke), Math.max(4, cy + 6 - shift), 2 * stroke, 5 * stroke);
        g.fillStyle = color;
        g.fillRect(x + s * (rx - 3 * stroke), Math.max(4, cy - 4 - shift), 2 * stroke, 6 * stroke);
      }
    }

    if ((isLarge || isGrand) && !isOuterLayer) {
      // Outer reinforced double halo rim & grand solar crown
      this.pixelEllipse(x, bottom - 1, rx + 5 * Math.min(3, scale), Math.min(18, 5 * Math.min(3, scale)), isGrand ? C[31] : color, false, stroke);
      if (isGrand) {
        this.pixelEllipse(x, Math.max(6, visTop - 4), Math.round(rx * 0.62), Math.min(12, 3 * stroke), C[31], false, stroke);
        this.pixelDiamond(x, Math.max(4, visTop - 7), Math.round(2 * dMult), C[31], C[9]);
      }
    }

    if (options.restored) {
      this.pixelDiamond(x - Math.round(rx * 0.6), bottom - 4, Math.round(2 * dMult), C[26], C[9]);
      this.pixelDiamond(x + Math.round(rx * 0.6), bottom - 4, Math.round(2 * dMult), C[26], C[9]);
    }

    if (!this.settings.reducedMotion) {
      if (fam === 'lightning' && !isOuterLayer) {
        // Static electric arcs flickering between nodes
        const a1 = now / 210;
        const a2 = a1 + Math.PI * 0.7;
        const n1x = Math.round(x + Math.cos(a1) * (rx - 1));
        const n1y = Math.max(2, Math.round(cy + Math.sin(a1) * (ry * 0.55)));
        const n2x = Math.round(x + Math.cos(a2) * (rx - 1));
        const n2y = Math.max(2, Math.round(cy + Math.sin(a2) * (ry * 0.55)));
        this.pixelBolt(n1x, Math.min(bottom, n1y), n2x, Math.min(bottom, n2y), now * 0.05, color, C[9], Math.min(4, scale));
      }
      const nodeCount = fam === 'veil' ? 6 : isGrand ? 6 : 4;
      for (let i = 0; i < nodeCount; i++) {
        const ang = (now / (fam === 'wind' ? 180 : 260)) + (i * Math.PI * 2) / nodeCount;
        const nx = Math.round(x + Math.cos(ang) * (rx - 1));
        const ny = Math.round(cy + Math.sin(ang) * (ry * 0.55));
        if (ny >= 2 && ny <= bottom) {
          this.pixelDiamond(nx, ny, Math.round(((fam === 'fire' || isGrand) && i % 2 === 0 ? 2 : 1) * dMult), isGrand && i % 2 === 0 ? C[31] : color, C[9]);
        }
      }
    }

    if (hit) {
      this.pixelCircle(x + (x < 100 ? 12 * scale : -12 * scale), Math.max(12, cy), Math.round(rx * 0.55), C[9], false, stroke);
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        const sx = Math.round(x + Math.cos(ang) * (rx + 4 * scale));
        const sy = Math.max(4, Math.min(bottom, Math.round(cy + Math.sin(ang) * (ry * 0.6))));
        this.pixelDiamond(sx, sy, Math.round(2 * dMult), color, C[9]);
      }
    }
    g.restore();
  }

  barrierLabel(x, y, label, color) {
    this.drawFloatingPopup(x, y, label, C[9], color);
  }

  drawLightTrail(x, y, progress, pierce = 0) {
    const g = this.ctx;
    g.save();
    g.globalAlpha = pierce ? Math.max(0, (1 - progress) / 0.35) : 0.9;
    if (pierce) {
      for (let i = 0; i < pierce; i++) {
        this.pixelDiamond(x + 6 + i * 5, y - 6 - i * 3, 2, '#93e6cc', '#edfff3');
      }
    } else {
      g.fillStyle = '#edfff3';
      g.fillRect(Math.round(x - 12), Math.round(y - 3), 9, 1);
      g.fillStyle = '#93e6cc';
      g.fillRect(Math.round(x - 18), Math.round(y + 2), 12, 1);
      this.pixelDiamond(x - 5, y - 6, 2, '#93e6cc', '#edfff3');
    }
    g.restore();
  }

  drawAxeVfx(x, y, color, impact, progress, blocked) {
    const g = this.ctx;
    const stationary = this.settings.reducedMotion;
    const drop = stationary ? 0 : Math.round(Math.sin(Math.min(1, progress / 0.65) * Math.PI) * 14);
    x = Math.round(x);
    y = Math.round(y) - drop;
    if (impact && blocked) return;
    g.save();
    if (impact && !stationary) g.globalAlpha = Math.max(0, (1 - progress) / 0.35);
    g.fillStyle = C[13];
    for (let i = 0; i <= 11; i++) g.fillRect(x - 10 + i, y + 7 - i, 3, 2);
    g.fillStyle = color;
    g.fillRect(x - 3, y - 10, 9, 10);
    g.fillRect(x + 6, y - 8, 3, 6);
    g.fillStyle = C[9];
    g.fillRect(x + 7, y - 7, 2, 4);
    if (impact && !stationary) {
      this.pixelCircle(x, y, Math.round(5 + (progress - 0.65) * 38), color, false);
      this.pixelDiamond(x + 5, y + 2, 3, color, C[9]);
    }
    g.restore();
  }

  drawLegendarySigil(kind, progress) {
    const g = this.ctx;
    const still = this.settings.reducedMotion;
    const stopped = kind === 'timestop';
    const ready = kind === 'ascension-ready';
    const color = stopped ? '#b8deff' : ready ? '#fff3af' : '#e5b7ff';
    const x = stopped ? 165 : 51;
    const y = stopped ? 83 : 103;
    g.save();
    if (stopped && !still) {
      g.globalAlpha = 0.23 * Math.sin(progress * Math.PI);
      g.fillStyle = '#76b3fc';
      g.fillRect(0, 0, 320, 180);
    }
    g.globalAlpha = 1;
    const radius = stopped ? 19 : 18;
    this.pixelCircle(x, y, radius, color, false);
    if (stopped) {
      g.fillStyle = color;
      g.fillRect(x - 1, y - 12, 2, 13);
      g.fillRect(x, y - 1, 9, 2);
    } else {
      this.pixelDiamond(x, y, 7, color, C[9]);
    }
    const spread = still ? 2 : Math.round(progress * (ready ? 16 : 7));
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      this.pixelDiamond(Math.round(x + Math.cos(angle) * (radius + spread)), Math.round(y + Math.sin(angle) * (radius + spread)), 2, color, C[9]);
    }
    g.restore();
  }

  drawDelaySigil(x, y, progress, activated) {
    const g = this.ctx;
    const still = this.settings.reducedMotion;
    const color = activated ? '#ecffe8' : '#ddbcff';
    g.save();
    g.fillStyle = '#252139';
    g.fillRect(x - 7, y - 8, 14, 16);
    g.fillStyle = color;
    g.fillRect(x - 6, y - 7, 12, 2);
    g.fillRect(x - 6, y + 5, 12, 2);
    for (let i = 0; i < 5; i++) {
      g.fillRect(x - i - 1, y - i - 1, 1, 1);
      g.fillRect(x + i, y - i - 1, 1, 1);
      g.fillRect(x - i - 1, y + i, 1, 1);
      g.fillRect(x + i, y + i, 1, 1);
    }
    if (!activated) g.fillRect(x, y + (still ? 2 : Math.floor(progress * 4)), 1, 1);
    if (!still) {
      g.globalAlpha = Math.sin(progress * Math.PI);
      this.pixelCircle(x, y, 12 + Math.floor(progress * (activated ? 12 : 4)), color, false);
    }
    g.restore();
  }

  enemyWardWidth(enemy) {
    if (enemy?.kind === 'elite') return 50;
    return LARGE_BOSS_KINDS.has(enemy?.kind) ? 58 : 42;
  }

  drawEnemyWard(x, top, width, layers) {
    const g = this.ctx;
    const pal = ELEMENT_IMPACT.ward;
    this.barrier(x, top, width, pal.primary, false, 'ward');
    for (let i = 0; i < layers; i++) {
      const px = x + (i - (layers - 1) / 2) * 7;
      this.pixelDiamond(px, 150, 2, pal.secondary, pal.rim);
    }
    g.fillStyle = pal.rim;
    g.fillRect(Math.round(x - width / 2) + 2, 118, 2, 5);
  }

  drawWardImpact(x, top, width, broke, progress) {
    const g = this.ctx;
    const pal = ELEMENT_IMPACT.ward;
    const radius = width / 2;
    const p = Math.max(0, Math.min(1, progress));
    const y = 120;
    const contact = x - radius + 3;
    g.save();
    if (p < 0.35) {
      g.globalAlpha = 1 - p / 0.35;
      this.pixelDiamond(contact, y, broke ? 8 : 5, pal.primary, pal.core);
      if (broke) {
        this.pixelBolt(contact, y, x + radius * 0.65, y - 9, 2, pal.secondary, pal.core);
        this.pixelBolt(x - 4, y - 4, x + 5, top + 7, 4, pal.secondary, pal.core);
        this.pixelBolt(x - 4, y - 4, x + 10, y + 14, 3, pal.secondary, pal.core);
      }
    }
    g.globalAlpha = (1 - p) ** 1.4;
    const travel = 1 - (1 - p) ** 2;
    this.pixelCircle(contact, y, Math.round(4 + travel * (broke ? 19 : 12)), pal.rim, false);
    const count = broke ? 12 : 4;
    for (let i = 0; i < count; i++) {
      const angle = broke ? i * Math.PI * 2 / count : Math.PI * (0.65 + i * 0.23);
      const spread = travel * (9 + (i * 7) % 14);
      const sx = (broke ? x : contact) + Math.cos(angle) * ((broke ? radius - 5 : 3) + spread);
      const sy = y + Math.sin(angle) * ((broke ? (148 - top) * 0.38 : 3) + spread) + p * p * 11;
      const size = broke && p < 0.65 ? 2 + i % 2 : 1;
      this.pixelDiamond(sx, sy, size, pal.primary, pal.core);
    }
    g.restore();
  }
  dispose() { cancelAnimationFrame(this.raf); }
}
