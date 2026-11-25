import assert from 'node:assert/strict';
import test from 'node:test';
import { Battlefield } from '../src/render.js';
import { DRAGON_ART_V2, SUMMON_ART } from '../src/summon-art.js';
import { FUSION_SUMMON_PALETTES } from '../src/summon-palettes.js';

function draw({ dragonV2, isGrand = false, element = null, marks, type, progress, frame = 0, creatureId = 'dragon' }) {
  const paints = [];
  const ctx = { fillRect(x, y, w, h) { paints.push({ x, y, w, h, color: this.fillStyle }); } };
  Battlefield.prototype.drawSummonSprite.call({
    ctx, settings: { reducedMotion: false }, summonVisuals: { dragonV2, v2: true, aura: false, marks },
  }, { creatureId, element, isGrand, hp: 20, maxHp: 20 }, 88, 147, frame, type ? { type } : null, progress, true);
  return paints.slice(1);
}

test('The indexed dragon prototype keeps V1 as the default and leaves other summon art alone', () => {
  assert.deepEqual([SUMMON_ART.dragon.width, SUMMON_ART.dragon.height], [37, 34]);
  assert.deepEqual([DRAGON_ART_V2.width, DRAGON_ART_V2.height], [40, 34]);
  assert.equal(DRAGON_ART_V2.grandScale, SUMMON_ART.dragon.grandScale);
  assert.equal(DRAGON_ART_V2.lift, SUMMON_ART.dragon.lift);
  for (const row of DRAGON_ART_V2.pixels) {
    assert.equal(row.length, 40);
    assert.ok(row.every(material => material === null || Object.hasOwn(DRAGON_ART_V2.colors, material)));
  }
  assert.deepEqual(draw({}), draw({ dragonV2: false }));
  assert.notDeepEqual(draw({ dragonV2: true }), draw({}));
  assert.deepEqual(draw({ creatureId: 'phoenix', dragonV2: true }), draw({ creatureId: 'phoenix' }));
});

test('All fusion and representative non-fusion palettes preserve dragon ink and place marks on materials', () => {
  const { width, height, grandScale, rows, pixels, colors } = DRAGON_ART_V2;
  const spans = rows.flat().map(([material]) => material);
  const fusions = Object.entries(FUSION_SUMMON_PALETTES);
  for (const isGrand of [false, true]) {
    const scale = isGrand ? grandScale : 1;
    const left = 88 - Math.floor(width * scale / 2);
    const top = 147 - Math.round(height * scale);
    const markable = new Set(pixels.flatMap((row, y) => row.flatMap((material, x) =>
      material && !['ink', 'core', 'spark'].includes(material)
        ? [`${left + Math.round(x * scale)},${top + Math.round(y * scale)}`] : []
    )));
    for (const [element, palette] of [...fusions, ['fire'], ['ice'], ['earth'], ['akki'], ['heman']]) {
      const options = { dragonV2: true, isGrand, element };
      const base = draw({ ...options, marks: false });
      const marked = draw(options);
      assert.equal(base.length, spans.length, element);
      assert.deepEqual(marked.slice(0, base.length), base);
      spans.forEach((material, index) => {
        if (material === 'ink') assert.equal(base[index].color, colors.ink);
        if (material === 'core' && palette) assert.equal(base[index].color, palette.core);
      });
      const marks = marked.slice(base.length);
      if (palette || element === 'akki' || element === 'heman') assert.ok(marks.length >= 8, element);
      for (const { x, y, color } of marks) {
        assert.ok(markable.has(`${x},${y}`), element);
        if (palette) assert.ok(Object.values(palette.markColors).includes(color), element);
      }
      assert.deepEqual(draw(options), marked);
    }
  }
});

test('Both dragon templates stay inside the battlefield with the original summon motion offsets', () => {
  for (const dragonV2 of [false, true]) {
    for (const isGrand of [false, true]) {
      const art = dragonV2 ? DRAGON_ART_V2 : SUMMON_ART.dragon;
      const options = { dragonV2, isGrand };
      for (const [type, progress, frame, offset] of [
        [null, 0, 0, 0], ['summon_invoke', 0.28, 0, 0], ['summon_invoke', 1, 0, 0],
        ['summon_strike', 0.5, 0, 16], ['summon_relay', 0.5, 0, 16],
        ['summon_counter', 0.5, 0, 8], ['summon_hit', 0.65, 1, -3],
      ]) {
        const scale = isGrand ? type === 'summon_invoke' && progress === 0.28 ? 4 : art.grandScale : 1;
        const left = 88 + offset - Math.floor(art.width * scale / 2);
        const top = 147 - Math.round(art.height * scale);
        const paints = draw({ ...options, type, progress, frame });
        assert.equal(Math.min(...paints.map(paint => paint.x)), left);
        assert.equal(Math.min(...paints.map(paint => paint.y)), top);
        assert.equal(Math.max(...paints.map(paint => paint.y + paint.h)), 147);
        assert.ok(paints.every(({ x, y, w, h }) => x >= 0 && y >= 0 && x + w <= 320 && y + h <= 180));
      }
    }
  }
});
