import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { Battlefield, getSummonAnchor, getSummonBounds } from '../src/render.js';
import { CREATURE_15_27_V2 } from '../src/creature-15-27-art-v2.js';
import { resolveSummonArt, SUMMON_ART } from '../src/summon-art.js';
import { FUSION_SUMMON_PALETTES } from '../src/summon-palettes.js';
import { getOpaqueBounds, SUMMON_SIZE_V2 } from '../src/summon-sizes.js';

const expected = {
  dog: ['M', 40, 29, 29, 70],
  cat: ['S', 39, 30, 23, 58],
  lion: ['L', 63, 40, 40, 88],
  bear: ['L', 60, 40, 41, 90],
  boar: ['L', 53, 33, 38, 85],
  croc: ['L', 72, 32, 37, 67],
  snake: ['M', 47, 30, 30, 71],
  turtle: ['M', 48, 32, 30, 69],
  spider: ['M', 49, 32, 30, 72],
  frog: ['S', 40, 27, 23, 56],
  rat: ['XS', 35, 28, 16, 43],
  slime: ['S', 34, 22, 21, 52],
  sprite: ['S', 29, 32, 23, 58],
};
assert.deepEqual(Object.keys(CREATURE_15_27_V2), Object.keys(expected));

const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

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

for (const [id, [sizeClass, width, height, normalHeight, grandHeight]] of Object.entries(expected)) {
  test(id + ' V2 registers indexed art and fits Normal and Grand with fusion marks', () => {
    const { grid, materials, markAnchor } = CREATURE_15_27_V2[id];
    const options = { [id + 'V2']: true, sizeV2: true, v2: true, aura: false };
    const art = resolveSummonArt(id, options);
    assert.ok(app.includes(id + "V2: localDev && devOptions.get('" + id + "Art') === 'v2'"));
    assert.equal(resolveSummonArt(id), SUMMON_ART[id]);
    assert.equal(resolveSummonArt(id, { sizeV2: true }), SUMMON_ART[id]);
    assert.notEqual(art, SUMMON_ART[id]);
    assert.equal(art.lift, SUMMON_ART[id].lift);
    assert.equal(SUMMON_SIZE_V2[id].sizeClass, sizeClass);
    assert.deepEqual([art.width, art.height], [width, height]);
    assert.deepEqual(getOpaqueBounds(art), {
      minX: 0, minY: 0, maxX: width - 1, maxY: height - 1, width, height,
    });
    const used = new Set(grid.join('').replaceAll('.', ''));
    assert.deepEqual([...used].sort(), Object.keys(materials).sort());
    assert.ok(grid.every(row => row.length === width));
    assert.ok(Object.values(materials).every(([, color]) => /^#[0-9a-f]{6}$/.test(color)));
    assert.equal(Object.keys(art.colors).length, used.size);
    assert.ok(used.has('C') && used.has('i'));
    assert.ok([markAnchor.x, markAnchor.y].every(value => value > 0 && value < 1));

    for (const isGrand of [false, true]) {
      const summon = { creatureId: id, isGrand };
      const bounds = getSummonBounds(summon, options);
      assert.equal(bounds.height, isGrand ? grandHeight : normalHeight);
      for (let frame = 0; frame < 4; frame++) {
        const pixels = paint(summon, options, frame);
        const left = Math.min(...pixels.map(p => p.x));
        const right = Math.max(...pixels.map(p => p.x + p.w));
        const top = Math.min(...pixels.map(p => p.y));
        const bottom = Math.max(...pixels.map(p => p.y + p.h));
        assert.ok(left >= 0 && top >= 0 && right <= 320 && bottom <= 180);
        if (frame === 0) {
          assert.deepEqual([right - left, bottom - top], [bounds.width, bounds.height]);
        }
      }

      for (const element of ['magma', 'hail']) {
        const palette = FUSION_SUMMON_PALETTES[element];
        const fused = { ...summon, element };
        const body = paint(fused, { ...options, marks: false });
        const marked = paint(fused, options);
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
