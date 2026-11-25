import assert from 'node:assert/strict';
import test from 'node:test';
import { Battlefield, getSummonAnchor, getSummonBounds, getSummonHudLayout } from '../src/render.js';
import { BEHEMOTH_ART_V2, resolveSummonArt, SUMMON_ART } from '../src/summon-art.js';
import { FUSION_SUMMON_PALETTES } from '../src/summon-palettes.js';
import { getOpaqueBounds } from '../src/summon-sizes.js';
import { makeSummonScenario } from '../dev/hydra-scenario.js';
import { loadRun, saveRun } from '../src/save.js';

const visuals = { behemothV2: true, sizeV2: true, v2: true, aura: false };

function paint(summon, options, type, progress = 0, frame = 0) {
  const pixels = [];
  const ctx = { fillRect(x, y, w, h) { pixels.push({ x, y, w, h, color: this.fillStyle }); } };
  const { x, baseline } = getSummonAnchor(summon, options);
  Battlefield.prototype.drawSummonSprite.call(
    { ctx, settings: { reducedMotion: false }, summonVisuals: options },
    summon, x, baseline, frame, type ? { type } : null, progress, true,
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

test('Behemoth V2 is opt-in and uses proportional XXL size and the adaptive HUD', () => {
  assert.equal(resolveSummonArt('behemoth'), SUMMON_ART.behemoth);
  assert.equal(resolveSummonArt('behemoth', visuals), BEHEMOTH_ART_V2);
  assert.equal(resolveSummonArt('hydra', visuals), SUMMON_ART.hydra);
  assert.deepEqual(getOpaqueBounds(BEHEMOTH_ART_V2),
    { minX: 1, minY: 1, maxX: 94, maxY: 64, width: 94, height: 64 });
  const normal = { creatureId: 'behemoth', isGrand: false };
  const grand = { ...normal, isGrand: true };
  assert.deepEqual(paintedBounds(paint(normal, visuals)), { left: 53, right: 136, top: 91, bottom: 147 });
  assert.deepEqual(paintedBounds(paint(grand, visuals)), { left: 8, right: 199, top: 15, bottom: 145 });
  assert.equal(getSummonHudLayout(grand, visuals).placement, 'side');
  assert.equal(getSummonBounds(grand, { sizeV2: true }).width, 158);
});

test('All fifteen fusion marks fit on the Behemoth torso in both forms', () => {
  for (const isGrand of [false, true]) {
    for (const [element, palette] of Object.entries(FUSION_SUMMON_PALETTES)) {
      const summon = { creatureId: 'behemoth', element, isGrand };
      const body = paint(summon, { ...visuals, marks: false });
      const marked = paint(summon, visuals);
      assert.deepEqual(marked.slice(0, body.length), body, element);
      assert.ok(body.some(pixel => pixel.color === palette.core), element);
      const marks = marked.slice(body.length);
      assert.ok(marks.length >= 8, element);
      const { left, right } = paintedBounds(body);
      for (const mark of marks) {
        assert.ok(Object.values(palette.markColors).includes(mark.color), element);
        assert.ok(mark.x >= left + (right - left) * 0.25 && mark.x < left + (right - left) * 0.60, element);
        assert.ok(body.some(pixel => ![BEHEMOTH_ART_V2.colors.ink, palette.core, palette.spark].includes(pixel.color)
          && mark.x >= pixel.x && mark.x < pixel.x + pixel.w && mark.y >= pixel.y && mark.y < pixel.y + pixel.h), element);
      }
    }
  }
});

test('Behemoth V2 stays inside the battlefield through shared summon motion', () => {
  for (const isGrand of [false, true]) {
    for (const sizeV2 of [false, true]) {
      for (const [type, progress, frame] of [
        [null, 0, 0], ['summon_invoke', 0.28, 0], ['summon_invoke', 1, 0],
        ['summon_strike', 0.5, 0], ['summon_counter', 0.5, 0], ['summon_hit', 0.65, 1],
        ['summon_break', 0.5, 3], ['summon_depart', 0.5, 3],
      ]) {
        const pixels = paint({ creatureId: 'behemoth', isGrand, element: 'hail' }, { ...visuals, sizeV2 }, type, progress, frame);
        assert.ok(pixels.length > 0);
        const { left, right, top, bottom } = paintedBounds(pixels);
        assert.ok(left >= 0 && top >= 0 && right <= 320 && bottom <= 180, type ?? 'idle');
      }
    }
  }
});

test('Behemoth gameplay fixtures round-trip through production save validation', () => {
  for (const [encounter, count] of [['single', 1], ['two', 2], ['three', 3], ['floor21', 3]]) {
    const state = makeSummonScenario('behemoth', { encounter, grand: true, element: 'hail' });
    const data = new Map();
    const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
    assert.equal(saveRun(state, storage).ok, true);
    const loaded = loadRun(storage).state;
    assert.equal(loaded.enemies.length, count);
    assert.equal(loaded.player.summon.creatureId, 'behemoth');
    assert.equal(loaded.player.summon.element, 'hail');
    assert.equal(loaded.room >= 50, encounter === 'floor21');
  }
});
