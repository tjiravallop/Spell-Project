import assert from 'node:assert/strict';
import test from 'node:test';
import { Battlefield, getSummonAnchor, getSummonBounds, getSummonHudLayout } from '../src/render.js';
import { HYDRA_ART_V2, resolveSummonArt, SUMMON_ART } from '../src/summon-art.js';
import { FUSION_SUMMON_PALETTES } from '../src/summon-palettes.js';
import { getOpaqueBounds } from '../src/summon-sizes.js';
import { makeHydraScenario } from '../dev/hydra-scenario.js';
import { loadRun, saveRun } from '../src/save.js';

const visuals = { hydraV2: true, sizeV2: true, v2: true, aura: false };

function paint(summon, options, type, progress = 0, frame = 0) {
  const pixels = [];
  const ctx = { fillRect(x, y, w, h) { pixels.push({ x, y, w, h, color: this.fillStyle }); } };
  const { x, baseline } = getSummonAnchor(summon, options);
  Battlefield.prototype.drawSummonSprite.call(
    { ctx, settings: { reducedMotion: false }, summonVisuals: options },
    summon, x, baseline, frame, type ? { type } : null, progress, true,
  );
  return pixels.slice(1);
}

test('Hydra V2 is isolated, has four eyes and keeps its XXL bounds and adaptive HUD', () => {
  assert.equal(resolveSummonArt('hydra'), SUMMON_ART.hydra);
  assert.equal(resolveSummonArt('hydra', visuals), HYDRA_ART_V2);
  assert.equal(resolveSummonArt('kraken', visuals), SUMMON_ART.kraken);
  assert.deepEqual(getOpaqueBounds(HYDRA_ART_V2), { minX: 0, minY: 0, maxX: 85, maxY: 64, width: 86, height: 65 });
  const eyes = [];
  HYDRA_ART_V2.pixels.forEach((row, y) => row.forEach((material, x) => {
    if (material === 'core') eyes.push([x, y]);
  }));
  assert.deepEqual(eyes, [[64, 8], [36, 19], [77, 24], [62, 29]]);
  const normal = { creatureId: 'hydra', isGrand: false };
  const grand = { ...normal, isGrand: true };
  assert.deepEqual(getSummonBounds(normal, visuals), {
    x: 94, baseline: 147, left: 56, right: 132, top: 90, bottom: 147, width: 76, height: 57, isGrand: false,
  });
  assert.deepEqual(getSummonBounds(grand, visuals), {
    x: 94, baseline: 145, left: 6, right: 183, top: 11, bottom: 145, width: 177, height: 134, isGrand: true,
  });
  assert.equal(getSummonHudLayout(grand, visuals).placement, 'side');
  assert.equal(getSummonBounds(grand, { sizeV2: true }).width, 148);
});

test('All fifteen Hydra marks stay on body material below the eyes at both scales', () => {
  const materials = HYDRA_ART_V2.rows.flat().map(([material]) => material);
  for (const isGrand of [false, true]) {
    for (const [element, palette] of Object.entries(FUSION_SUMMON_PALETTES)) {
      const summon = { creatureId: 'hydra', element, isGrand };
      const body = paint(summon, { ...visuals, marks: false });
      const marked = paint(summon, visuals);
      assert.equal(body.length, materials.length);
      const lowestEye = Math.max(...body.filter((pixel, i) => materials[i] === 'core').map(pixel => pixel.y));
      assert.equal(body.filter((pixel, i) => materials[i] === 'core' && pixel.color === palette.core).length, 4);
      const marks = marked.slice(body.length);
      assert.ok(marks.length >= 8, element);
      for (const mark of marks) {
        assert.ok(mark.y > lowestEye, element);
        const span = body.findIndex(pixel =>
          mark.x >= pixel.x && mark.x < pixel.x + pixel.w && mark.y >= pixel.y && mark.y < pixel.y + pixel.h);
        assert.ok(span >= 0 && !['ink', 'core', 'spark'].includes(materials[span]), element);
      }
    }
  }
});

test('Hydra body and eyes stay within the canvas through the shared motion states', () => {
  for (const isGrand of [false, true]) {
    for (const sizeV2 of [false, true]) {
      for (const [type, progress, frame] of [
        [null, 0, 0], ['summon_invoke', 0.28, 0], ['summon_invoke', 1, 0],
        ['summon_strike', 0.5, 0], ['summon_counter', 0.5, 0], ['summon_hit', 0.65, 1],
        ['summon_break', 0.5, 3], ['summon_depart', 0.5, 3],
      ]) {
        const pixels = paint({ creatureId: 'hydra', isGrand, element: 'hail' }, { ...visuals, sizeV2 }, type, progress, frame);
        assert.ok(pixels.length > 0);
        assert.ok(pixels.every(({ x, y, w, h }) => x >= 0 && y >= 0 && x + w <= 320 && y + h <= 180),
          `${type ?? 'idle'} Grand=${isGrand} Size V2=${sizeV2}`);
      }
    }
  }
});

test('The seeded gameplay fixtures reload with the intended Hydra and encounter', () => {
  for (const [encounter, number] of [['single', 1], ['two', 2], ['three', 3], ['floor21', 3]]) {
    const state = makeHydraScenario({ encounter, grand: true, element: 'magma' });
    const data = new Map();
    const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
    assert.equal(saveRun(state, storage).ok, true);
    const loaded = loadRun(storage).state;
    assert.equal(loaded.enemies.length, number);
    assert.equal(loaded.player.summon.element, 'magma');
    assert.equal(loaded.player.summon.isGrand, true);
    assert.equal(loaded.room >= 50, encounter === 'floor21');
  }
});
