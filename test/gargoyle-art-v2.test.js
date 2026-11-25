import assert from 'node:assert/strict';
import test from 'node:test';
import { Battlefield, getSummonAnchor, getSummonBounds } from '../src/render.js';
import { GARGOYLE_ART_V2, resolveSummonArt, SUMMON_ART } from '../src/summon-art.js';
import { FUSION_SUMMON_PALETTES } from '../src/summon-palettes.js';
import { getOpaqueBounds } from '../src/summon-sizes.js';

const visuals = { gargoyleV2: true, sizeV2: true, v2: true, aura: false };

function paint(summon, options = visuals) {
  const pixels = [];
  const ctx = { fillRect(x, y, w, h) { pixels.push({ x, y, w, h, color: this.fillStyle }); } };
  const { x, baseline } = getSummonAnchor(summon, options);
  Battlefield.prototype.drawSummonSprite.call(
    { ctx, settings: { reducedMotion: false }, summonVisuals: options },
    summon, x, baseline, 0, null, 0, true,
  );
  return pixels.slice(1).filter(({ w, h }) => w > 0 && h > 0);
}

test('Gargoyle V2 is opt-in and fits the XL idle bounds in both forms', () => {
  assert.equal(resolveSummonArt('gargoyle'), SUMMON_ART.gargoyle);
  assert.equal(resolveSummonArt('gargoyle', visuals), GARGOYLE_ART_V2);
  assert.equal(resolveSummonArt('dragon', visuals), SUMMON_ART.dragon);
  assert.deepEqual(getOpaqueBounds(GARGOYLE_ART_V2),
    { minX: 0, minY: 0, maxX: 81, maxY: 55, width: 82, height: 56 });
  const grand = { creatureId: 'gargoyle', isGrand: true };
  assert.equal(getSummonBounds(grand, { sizeV2: true }).height, 99);
  for (const [isGrand, expected] of [
    [false, [58, 97, 132, 147]], [true, [8, 33, 169, 143]],
  ]) {
    const pixels = paint({ ...grand, isGrand });
    assert.deepEqual([
      Math.min(...pixels.map(pixel => pixel.x)), Math.min(...pixels.map(pixel => pixel.y)),
      Math.max(...pixels.map(pixel => pixel.x + pixel.w)), Math.max(...pixels.map(pixel => pixel.y + pixel.h)),
    ], expected);
    assert.ok(pixels.some(pixel => pixel.color === GARGOYLE_ART_V2.colors.core));
  }
});

test('All fifteen fusion palettes render Gargoyle V2 and keep marks in its shoulder region', () => {
  for (const isGrand of [false, true]) {
    for (const [element, palette] of Object.entries(FUSION_SUMMON_PALETTES)) {
      const summon = { creatureId: 'gargoyle', element, isGrand };
      const body = paint(summon, { ...visuals, marks: false });
      const marked = paint(summon);
      assert.deepEqual(marked.slice(0, body.length), body, element);
      const eyeX = Math.min(...body.filter(pixel => pixel.color === palette.core).map(pixel => pixel.x));
      assert.ok(Number.isFinite(eyeX), element);
      const marks = marked.slice(body.length);
      assert.ok(marks.length >= 6, element);
      for (const mark of marks) {
        assert.ok(mark.x + mark.w < eyeX, element);
        assert.ok(Object.values(palette.markColors).includes(mark.color), element);
        assert.ok(body.some(pixel => ![GARGOYLE_ART_V2.colors.ink, palette.core, palette.spark].includes(pixel.color)
          && mark.x >= pixel.x && mark.x < pixel.x + pixel.w
          && mark.y >= pixel.y && mark.y < pixel.y + pixel.h), element);
      }
    }
  }
});
