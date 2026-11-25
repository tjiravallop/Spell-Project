import assert from 'node:assert/strict';
import test from 'node:test';
import { Battlefield, getSummonAnchor, getSummonBounds, getSummonHudLayout } from '../src/render.js';
import { KRAKEN_ART_V2, resolveSummonArt, SUMMON_ART } from '../src/summon-art.js';
import { FUSION_SUMMON_PALETTES } from '../src/summon-palettes.js';
import { getOpaqueBounds } from '../src/summon-sizes.js';
import { makeSummonScenario } from '../dev/hydra-scenario.js';
import { loadRun, saveRun } from '../src/save.js';

const visuals = { krakenV2: true, sizeV2: true, v2: true, aura: false };

function paint(summon, options, event = null, progress = 0, frame = 0) {
  const pixels = [];
  const ctx = { fillRect(x, y, w, h) { pixels.push({ x, y, w, h, color: this.fillStyle }); } };
  const { x, baseline } = getSummonAnchor(summon, options);
  Battlefield.prototype.drawSummonSprite.call(
    { ctx, settings: { reducedMotion: false }, summonVisuals: options },
    summon, x, baseline, frame, event, progress, true,
  );
  return pixels.slice(1).filter(pixel => pixel.w > 0 && pixel.h > 0);
}

function paintedBounds(pixels) {
  return {
    left: Math.min(...pixels.map(pixel => pixel.x)),
    right: Math.max(...pixels.map(pixel => pixel.x + pixel.w)),
    top: Math.min(...pixels.map(pixel => pixel.y)),
    bottom: Math.max(...pixels.map(pixel => pixel.y + pixel.h)),
  };
}

test('Kraken V2 is opt-in and resolves XXL art, bounds, and the adaptive HUD together', () => {
  assert.equal(resolveSummonArt('kraken'), SUMMON_ART.kraken);
  assert.equal(resolveSummonArt('kraken', visuals), KRAKEN_ART_V2);
  assert.equal(resolveSummonArt('behemoth', visuals), SUMMON_ART.behemoth);
  assert.deepEqual(getOpaqueBounds(KRAKEN_ART_V2),
    { minX: 1, minY: 0, maxX: 93, maxY: 65, width: 93, height: 66 });
  const normal = { creatureId: 'kraken', isGrand: false };
  const grand = { ...normal, isGrand: true };
  assert.deepEqual(paintedBounds(paint(normal, visuals)), { left: 55, right: 135, top: 90, bottom: 147 });
  assert.deepEqual(paintedBounds(paint(grand, visuals)), { left: 8, right: 197, top: 11, bottom: 145 });
  assert.equal(getSummonHudLayout(grand, visuals).placement, 'side');
  assert.equal(getSummonBounds(grand, { sizeV2: true }).width, 154);
});

test('Kraken V2 has a connected silhouette and distinct suction-cup materials', () => {
  const { pixels, width } = KRAKEN_ART_V2;
  const start = pixels[0].findIndex(Boolean);
  const visit = [[start, 0]];
  const seen = new Set([start]);
  for (const [x, y] of visit) {
    for (const dy of [-1, 0, 1]) {
      for (const dx of [-1, 0, 1]) {
        const [nx, ny] = [x + dx, y + dy];
        const key = ny * width + nx;
        if (!pixels[ny]?.[nx] || seen.has(key)) continue;
        seen.add(key);
        visit.push([nx, ny]);
      }
    }
  }
  const materials = pixels.flat().filter(Boolean);
  assert.equal(seen.size, materials.length);
  assert.ok(materials.includes('cupRim') && materials.includes('cupInterior'));
  assert.ok(materials.includes('cranialRidge') && materials.includes('rearTentacle'));
});

test('All fifteen fusion marks stay on Kraken mantle material and away from its eye', () => {
  for (const isGrand of [false, true]) {
    for (const [element, palette] of Object.entries(FUSION_SUMMON_PALETTES)) {
      const summon = { creatureId: 'kraken', element, isGrand };
      const body = paint(summon, { ...visuals, marks: false });
      const marked = paint(summon, visuals);
      assert.deepEqual(marked.slice(0, body.length), body, element);
      const eye = body.filter(pixel => pixel.color === palette.core);
      assert.ok(eye.length > 0, element);
      const eyeTop = Math.min(...eye.map(pixel => pixel.y));
      const marks = marked.slice(body.length);
      assert.ok(marks.length >= 6, element);
      for (const mark of marks) {
        assert.ok(mark.y + mark.h <= eyeTop, element);
        assert.ok(Object.values(palette.markColors).includes(mark.color), element);
        assert.ok(body.some(pixel => ![KRAKEN_ART_V2.colors.ink, palette.core, palette.spark].includes(pixel.color)
          && mark.x >= pixel.x && mark.x < pixel.x + pixel.w && mark.y >= pixel.y && mark.y < pixel.y + pixel.h), element);
      }
    }
  }
});

test('Kraken V2 stays inside the canvas through shared summon motion and resumes review encounters', () => {
  for (const isGrand of [false, true]) {
    for (const sizeV2 of [false, true]) {
      for (const [type, progress, frame] of [
        [null, 0, 0], ['summon_invoke', 0.28, 0], ['summon_invoke', 1, 0],
        ['summon_strike', 0.5, 0], ['summon_counter', 0.5, 0], ['summon_hit', 0.65, 1],
        ['summon_break', 0.5, 3], ['summon_depart', 0.5, 3],
      ]) {
        const pixels = paint({ creatureId: 'kraken', isGrand, element: 'hail' }, { ...visuals, sizeV2 },
          type ? { type } : null, progress, frame);
        assert.ok(pixels.length > 0);
        const { left, right, top, bottom } = paintedBounds(pixels);
        assert.ok(left >= 0 && top >= 0 && right <= 320 && bottom <= 180, type ?? 'idle');
      }
    }
  }
  for (const [encounter, count] of [['single', 1], ['two', 2], ['three', 3], ['floor21', 3]]) {
    const state = makeSummonScenario('kraken', { encounter, grand: true, element: 'monsoon' });
    const data = new Map();
    const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
    assert.equal(saveRun(state, storage).ok, true);
    const loaded = loadRun(storage).state;
    assert.equal(loaded.enemies.length, count);
    assert.equal(loaded.player.summon.creatureId, 'kraken');
    assert.equal(loaded.player.summon.element, 'monsoon');
    assert.equal(loaded.room >= 50, encounter === 'floor21');
  }
});
