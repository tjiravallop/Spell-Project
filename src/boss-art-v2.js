import { EMBER_OVERLORD_V2_DEF } from './boss-art/ember-overlord-v2.js';
import { TEMPEST_ARCHON_V2_DEF } from './boss-art/tempest-archon-v2.js';
import { CROWN_ARCHIVIST_V2_DEF } from './boss-art/crown-archivist-v2.js';
import { MIRROR_REGENT_V2_DEF } from './boss-art/mirror-regent-v2.js';
import { LOOM_SOVEREIGN_V2_DEF } from './boss-art/loom-sovereign-v2.js';
import { VOLCANO_COLOSSUS_V2_DEF } from './boss-art/volcano-colossus-v2.js';
import { THUNDER_DRAKE_EMPEROR_V2_DEF } from './boss-art/thunder-drake-emperor-v2.js';
import { getOpaqueBounds } from './boss-sizes.js';

function pixelSpans(row) {
  const spans = [];
  for (let start = 0; start < row.length;) {
    let end = start + 1;
    while (end < row.length && row[end] === row[start]) end++;
    if (row[start]) spans.push([row[start], start, end]);
    start = end;
  }
  return spans;
}

export function validateBossGrid(grid, materials, label = 'boss') {
  if (!Array.isArray(grid) || grid.length === 0 || typeof grid[0] !== 'string' || grid[0].length === 0) {
    throw new Error(`Invalid grid for ${label}: must be a non-empty array of strings`);
  }
  const width = grid[0].length;
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (typeof row !== 'string' || row.length !== width) {
      throw new Error(`Invalid row width in ${label} at row ${y}: expected ${width}, got ${row?.length}`);
    }
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch !== '.' && !Object.hasOwn(materials, ch)) {
        throw new Error(`Unknown material key '${ch}' in ${label} at (${x}, ${y})`);
      }
    }
  }
}

export function indexedBossArt(grid, materials, label = 'boss') {
  validateBossGrid(grid, materials, label);
  const pixels = grid.map(row => Array.from(row, key => materials[key]?.[0] ?? null));
  const art = {
    width: grid[0].length,
    height: grid.length,
    colors: Object.freeze(Object.fromEntries(Object.values(materials))),
    pixels,
    rows: pixels.map(pixelSpans),
  };
  art.opaqueBounds = getOpaqueBounds(art);
  return Object.freeze(art);
}

export function indexedPartArt(part, materials, label = 'part') {
  const rawFrames = Array.isArray(part.frames) && part.frames.length > 0 ? part.frames : [part.grid];
  const frames = Object.freeze(rawFrames.map((grid, idx) => indexedBossArt(grid, materials, `${label}[${idx}]`)));
  const anchor = Object.freeze({ x: part.anchor?.x ?? 0, y: part.anchor?.y ?? 0 });
  const joint = Object.freeze({ x: part.joint?.x ?? 0, y: part.joint?.y ?? 0 });
  const z = part.z === 'behind' ? 'behind' : 'front';
  const base = frames[0];
  return Object.freeze({
    ...base,
    anchor,
    joint,
    z,
    frames,
  });
}

function combinedPartsBounds(bodyBounds, parts, { allFrames = false } = {}) {
  let { minX, maxX, minY, maxY } = bodyBounds;
  for (const part of Object.values(parts)) {
    const ox = part.anchor.x - part.joint.x;
    const oy = part.anchor.y - part.joint.y;
    const framesToScan = allFrames ? part.frames : [part.frames[0]];
    for (const frameArt of framesToScan) {
      const b = frameArt.opaqueBounds;
      if (!b || b.width <= 0 || b.height <= 0) continue;
      minX = Math.min(minX, ox + b.minX);
      maxX = Math.max(maxX, ox + b.maxX);
      minY = Math.min(minY, oy + b.minY);
      maxY = Math.max(maxY, oy + b.maxY);
    }
  }
  return Object.freeze({
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  });
}

export function createBossArt(definition, label = 'boss') {
  const base = indexedBossArt(definition.grid, definition.materials, label);
  const bodyBounds = base.opaqueBounds;
  const partEntries = Object.entries(definition.parts ?? {});
  const parts = partEntries.length > 0
    ? Object.freeze(Object.fromEntries(
      partEntries.map(([key, part]) => [key, indexedPartArt(part, definition.materials, `${label}.${key}`)]),
    ))
    : null;
  const neutralBounds = parts ? combinedPartsBounds(bodyBounds, parts, { allFrames: false }) : bodyBounds;
  const envelopeBounds = parts ? combinedPartsBounds(bodyBounds, parts, { allFrames: true }) : bodyBounds;
  const overflow = Object.freeze({
    left: envelopeBounds.minX < 0,
    top: envelopeBounds.minY < 0,
    right: envelopeBounds.maxX >= base.width,
    bottom: envelopeBounds.maxY >= base.height,
    hasOverflow: envelopeBounds.minX < 0 || envelopeBounds.minY < 0 || envelopeBounds.maxX >= base.width || envelopeBounds.maxY >= base.height,
    bounds: envelopeBounds,
  });
  return Object.freeze({
    ...base,
    parts,
    bodyBounds,
    neutralBounds,
    envelopeBounds,
    overflow,
    opaqueBounds: neutralBounds,
    animate: typeof definition.animate === 'function' ? definition.animate : null,
  });
}

export function detectBossComponentOverflow(art, animStates = []) {
  if (!art?.parts) return { hasOverflow: false, entries: [] };
  const entries = [];
  const states = animStates.length ? animStates : [{}];
  for (const state of states) {
    const anim = evaluateBossAnimation(art, state);
    for (const [key, part] of Object.entries(art.parts)) {
      const ps = anim.partStates?.[key];
      if (ps?.visible === false) continue;
      const frameCount = part.frames.length;
      const rawIdx = Number.isFinite(ps?.frame) ? Math.floor(ps.frame) : 0;
      const frameIdx = ((rawIdx % frameCount) + frameCount) % frameCount;
      const b = part.frames[frameIdx].opaqueBounds;
      const ox = part.anchor.x - part.joint.x + Math.round(ps?.dx ?? 0);
      const oy = part.anchor.y - part.joint.y + Math.round(ps?.dy ?? 0);
      const minX = ox + b.minX;
      const maxX = ox + b.maxX;
      const minY = oy + b.minY;
      const maxY = oy + b.maxY;
      if (minX < 0 || minY < 0 || maxX >= art.width || maxY >= art.height) {
        entries.push({ part: key, pose: state.pose ?? 'idle', frame: state.frame ?? 0, minX, maxX, minY, maxY });
      }
    }
  }
  return { hasOverflow: entries.length > 0, entries };
}

const EMPTY_ANIM = Object.freeze({ materialOverrides: null, partStates: null, effects: [] });

export function evaluateBossAnimation(art, animState) {
  if (!art?.animate) return EMPTY_ANIM;
  const res = art.animate({ colors: art.colors, ...animState }) ?? {};
  return {
    materialOverrides: res.materialOverrides ?? null,
    partStates: res.partStates ?? null,
    effects: Array.isArray(res.effects) ? res.effects : [],
  };
}

export const BOSS_ART_V2 = Object.freeze({
  ember_overlord: createBossArt(EMBER_OVERLORD_V2_DEF, 'ember_overlord'),
  tempest_archon: createBossArt(TEMPEST_ARCHON_V2_DEF, 'tempest_archon'),
  crown_archivist: createBossArt(CROWN_ARCHIVIST_V2_DEF, 'crown_archivist'),
  mirror_regent: createBossArt(MIRROR_REGENT_V2_DEF, 'mirror_regent'),
  loom_sovereign: createBossArt(LOOM_SOVEREIGN_V2_DEF, 'loom_sovereign'),
  volcano_colossus: createBossArt(VOLCANO_COLOSSUS_V2_DEF, 'volcano_colossus'),
  thunder_drake_emperor: createBossArt(THUNDER_DRAKE_EMPEROR_V2_DEF, 'thunder_drake_emperor'),
});

export function resolveBossArt(kind, bossVisuals) {
  if (!bossVisuals?.v2) return null;
  return Object.hasOwn(BOSS_ART_V2, kind) ? BOSS_ART_V2[kind] : null;
}

function drawSpans(ctx, art, left, top, scale, materialOverrides) {
  for (const [row, spans] of art.rows.entries()) {
    const y = Math.round(row * scale);
    const height = Math.round((row + 1) * scale) - y;
    if (height <= 0) continue;
    for (const [material, start, end] of spans) {
      const x = Math.round(start * scale);
      const width = Math.round(end * scale) - x;
      if (width <= 0) continue;
      ctx.fillStyle = materialOverrides?.[material] ?? art.colors[material];
      ctx.fillRect(left + x, top + y, width, height);
    }
  }
}

function drawPartLayer(ctx, parts, layer, left, top, scale, materialOverrides, partStates) {
  for (const [key, part] of Object.entries(parts)) {
    if (part.z !== layer) continue;
    const cfg = partStates?.[key];
    if (cfg?.visible === false) continue;
    const frameCount = part.frames.length;
    const rawIdx = Number.isFinite(cfg?.frame) ? Math.floor(cfg.frame) : 0;
    const frameIdx = ((rawIdx % frameCount) + frameCount) % frameCount;
    const frameArt = part.frames[frameIdx];
    const dx = Math.round(cfg?.dx ?? 0);
    const dy = Math.round(cfg?.dy ?? 0);
    const partLeft = Math.round(left + (part.anchor.x - part.joint.x) * scale) + dx;
    const partTop = Math.round(top + (part.anchor.y - part.joint.y) * scale) + dy;
    drawSpans(ctx, frameArt, partLeft, partTop, scale, cfg?.overrides ?? materialOverrides);
  }
}

export function drawBossArt(ctx, art, left, top, scale, materialOverrides = null, partStates = null) {
  const showParts = Boolean(art.parts) && !partStates?.hideParts;
  if (showParts) {
    drawPartLayer(ctx, art.parts, 'behind', left, top, scale, materialOverrides, partStates);
  }
  drawSpans(ctx, art, left, top, scale, materialOverrides);
  if (showParts) {
    drawPartLayer(ctx, art.parts, 'front', left, top, scale, materialOverrides, partStates);
  }
}
