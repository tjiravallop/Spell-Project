import assert from 'node:assert/strict';
import test from 'node:test';
import { Battlefield, getSummonAnchor } from '../src/render.js';
import { resolveSummonArt, SUMMON_ART } from '../src/summon-art.js';
import { FUSION_SUMMON_PALETTES } from '../src/summon-palettes.js';
import { getOpaqueBounds, resolveCreatureScale } from '../src/summon-sizes.js';

const prototypes = [
  { id: 'eagle', grid: [50, 36], scales: [1.08, 2.22], forms: [[54, 39], [111, 80]] },
  { id: 'bird', grid: [34, 28], scales: [0.79, 1.90], forms: [[27, 22], [65, 53]] },
  { id: 'bat', grid: [47, 28], scales: [0.60, 1.55], forms: [[28, 17], [73, 43]] },
  { id: 'hornet', grid: [35, 27], scales: [0.60, 1.57], forms: [[21, 16], [55, 42]] },
  { id: 'wolf', grid: [55, 36], scales: [0.86, 2.06], forms: [[47, 31], [113, 74]] },
];

function paint(summon, options, frame = 0) {
  const pixels = [];
  const ctx = { fillRect(x, y, w, h) { pixels.push({ x, y, w, h, color: this.fillStyle }); } };
  const { x, baseline } = getSummonAnchor(summon, options);
  Battlefield.prototype.drawSummonSprite.call(
    { ctx, settings: { reducedMotion: false }, summonVisuals: options },
    summon, x, baseline, frame, null, 0, true,
  );
  return pixels.slice(1).filter(({ w, h }) => w > 0 && h > 0);
}

function paintedBounds(pixels) {
  return [
    Math.min(...pixels.map(p => p.x)), Math.min(...pixels.map(p => p.y)),
    Math.max(...pixels.map(p => p.x + p.w)), Math.max(...pixels.map(p => p.y + p.h)),
  ];
}

for (const { id, grid, scales, forms } of prototypes) {
  const options = { [id + 'V2']: true, sizeV2: true, v2: true, aura: false };
  const art = resolveSummonArt(id, options);

  test(id + ' V2 preserves the opt-in and fits both production idle forms', () => {
    const original = SUMMON_ART[id];
    assert.equal(resolveSummonArt(id, { sizeV2: true }), original);
    assert.notEqual(art, original);
    assert.equal(art.lift, original.lift);
    assert.deepEqual([art.width, art.height], grid);
    assert.deepEqual([getOpaqueBounds(art).width, getOpaqueBounds(art).height], grid);

    for (const [form, isGrand] of [false, true].entries()) {
      const summon = { creatureId: id, isGrand };
      assert.equal(resolveCreatureScale(id, isGrand, art, options), scales[form]);
      for (let frame = 0; frame < 4; frame++) {
        const pixels = paint(summon, options, frame);
        const bounds = paintedBounds(pixels);
        if (frame === 0) assert.deepEqual([bounds[2] - bounds[0], bounds[3] - bounds[1]], forms[form]);
        assert.ok(bounds[0] >= 0 && bounds[1] >= 0 && bounds[2] <= 320 && bounds[3] <= 180);
        assert.ok(pixels.some(p => p.color === art.colors.core && p.x > getSummonAnchor(summon, options).x));
      }
    }
  });

  test(id + ' V2 renders Magma and Hail and keeps marks on its body', () => {
    for (const isGrand of [false, true]) {
      for (const element of ['magma', 'hail']) {
        const palette = FUSION_SUMMON_PALETTES[element];
        const summon = { creatureId: id, isGrand, element };
        const body = paint(summon, { ...options, marks: false });
        const marked = paint(summon, options);
        assert.deepEqual(marked.slice(0, body.length), body, element);
        assert.ok(body.some(p => p.color === palette.core), element);
        const marks = marked.slice(body.length);
        assert.ok(marks.length > 0, element);
        for (const mark of marks) {
          assert.ok(Object.values(palette.markColors).includes(mark.color), element);
          const base = body.find(p => mark.x >= p.x && mark.x < p.x + p.w
            && mark.y >= p.y && mark.y < p.y + p.h);
          assert.ok(base && ![art.colors.ink, palette.core, palette.spark].includes(base.color), element);
        }
      }
    }
  });
}

