import assert from 'node:assert/strict';
import test from 'node:test';
import { Battlefield, getSummonAnchor, getSummonBounds, getSummonHudLayout } from '../src/render.js';
import { PHOENIX_ART_V2, resolveSummonArt, SUMMON_ART } from '../src/summon-art.js';
import { FUSION_SUMMON_PALETTES } from '../src/summon-palettes.js';

const visuals = { phoenixV2: true, sizeV2: true, v2: true, aura: false };

function paint(summon, options = visuals, event = null, progress = 0, frame = 0) {
  const calls = [];
  const ctx = { fillRect(x, y, w, h) { calls.push({ x, y, w, h, color: this.fillStyle }); } };
  const { x, baseline } = getSummonAnchor(summon, options);
  Battlefield.prototype.drawSummonSprite.call(
    { ctx, settings: { reducedMotion: false }, summonVisuals: options },
    summon, x, baseline, frame, event, progress, true,
  );
  return calls.slice(1);
}

test('Phoenix V2 is opt-in and shares its rendered sizing with the adaptive HUD', () => {
  const normal = { creatureId: 'phoenix', isGrand: false };
  const grand = { ...normal, isGrand: true };
  assert.equal(resolveSummonArt('phoenix'), SUMMON_ART.phoenix);
  assert.equal(resolveSummonArt('phoenix', visuals), PHOENIX_ART_V2);
  assert.equal(resolveSummonArt('dragon', visuals), SUMMON_ART.dragon);
  assert.equal(PHOENIX_ART_V2.lift, SUMMON_ART.phoenix.lift);
  assert.deepEqual([PHOENIX_ART_V2.width, PHOENIX_ART_V2.height], [56, 46]);
  for (const row of PHOENIX_ART_V2.pixels) {
    assert.equal(row.length, PHOENIX_ART_V2.width);
    assert.ok(row.every(material => material === null || Object.hasOwn(PHOENIX_ART_V2.colors, material)));
  }
  assert.deepEqual([getSummonBounds(normal, visuals).width, getSummonBounds(normal, visuals).height], [62, 51]);
  assert.deepEqual([getSummonBounds(grand, visuals).width, getSummonBounds(grand, visuals).height], [129, 106]);
  assert.deepEqual([getSummonBounds(grand, { sizeV2: true }).width, getSummonBounds(grand, { sizeV2: true }).height], [104, 104]);
  assert.equal(getSummonHudLayout(normal, visuals).placement, 'above');
  assert.equal(getSummonHudLayout(grand, visuals).placement, 'side');
});

test('All fusion ramps and marks render on both Phoenix V2 sizes', () => {
  const art = PHOENIX_ART_V2;
  const materials = art.rows.flat().map(([material]) => material);
  for (const isGrand of [false, true]) {
    for (const [element, palette] of Object.entries(FUSION_SUMMON_PALETTES)) {
      const summon = { creatureId: 'phoenix', isGrand, element };
      const body = paint(summon, { ...visuals, marks: false });
      const marked = paint(summon);
      assert.equal(body.length, materials.length, element);
      assert.deepEqual(marked.slice(0, body.length), body);
      const marks = marked.slice(body.length);
      assert.ok(marks.length >= 8, element);
      for (const mark of marks) {
        assert.ok(Object.values(palette.markColors).includes(mark.color), element);
        const span = body.findIndex(pixel =>
          mark.x >= pixel.x && mark.x < pixel.x + pixel.w && mark.y >= pixel.y && mark.y < pixel.y + pixel.h);
        assert.ok(span >= 0 && !['ink', 'core', 'spark'].includes(materials[span]), element);
      }
      materials.forEach((material, i) => {
        if (material === 'ink') assert.equal(body[i].color, art.colors.ink);
        if (material === 'core' || material === 'spark') assert.equal(body[i].color, palette[material]);
      });
    }
  }
});

test('Phoenix V2 fits the battlefield through both size paths and existing summon motion', () => {
  for (const isGrand of [false, true]) {
    for (const sizeV2 of [false, true]) {
      const summon = { creatureId: 'phoenix', isGrand, element: 'ice' };
      for (const [type, progress, frame] of [
        [null, 0, 0], ['summon_invoke', 0.28, 0], ['summon_strike', 0.5, 0],
        ['summon_counter', 0.5, 0], ['summon_hit', 0.65, 1], ['summon_rebirth', 0.5, 3],
      ]) {
        const options = { ...visuals, sizeV2 };
        const calls = paint(summon, options, type ? { type } : null, progress, frame);
        assert.ok(calls.length > 0);
        assert.ok(calls.every(({ x, y, w, h }) => x >= 0 && y >= 0 && x + w <= 320 && y + h <= 180),
          `${type ?? 'idle'} Grand=${isGrand} Size V2=${sizeV2}`);
      }
    }
  }
});
