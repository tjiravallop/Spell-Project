import test from 'node:test';
import assert from 'node:assert/strict';
import { Battlefield, PALETTE } from '../src/render.js';
import { drawSummonArt, SUMMON_ART } from '../src/summon-art.js';
import { FUSION_SUMMON_PALETTES } from '../src/summon-palettes.js';
import { CREATURE_WORDS, FUSION_COMPONENTS, SECOND_TIER_ELEMENTS } from '../src/words.js';

const hexColor = /^#[0-9a-f]{6}$/i;
const lightness = hex => [0.213, 0.715, 0.072].reduce((sum, weight, i) => {
  const channel = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  return sum + weight * (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
}, 0);
const body = material => material && !['ink', 'spark', 'core'].includes(material);

function recordDraw() {
  const pixels = [];
  const ctx = { fillRect(...geometry) { pixels.push([...geometry, this.fillStyle]); } };
  return { ctx, pixels };
}

function summonFrame(creatureId, element, isGrand, summonVisuals, event = null, reducedMotion = true) {
  const { ctx, pixels } = recordDraw();
  const rings = [];
  const battlefield = { ctx, settings: { reducedMotion }, summonVisuals, pixelEllipse: (...ring) => rings.push(ring) };
  Battlefield.prototype.drawSummonSprite.call(battlefield, {
    creatureId, element, isGrand, hp: 20, maxHp: 20,
  }, 88, 147, 1, event, 0.28, true);
  return { pixels, rings };
}

test('V2 defines 15 valid, ordered ramps and independent accents for all 27 species', () => {
  assert.equal(Object.keys(FUSION_SUMMON_PALETTES).length, 15);
  assert.equal(Object.keys(SUMMON_ART).length, 27);
  assert.deepEqual(Object.keys(FUSION_SUMMON_PALETTES).sort(), Object.keys(FUSION_COMPONENTS).sort());
  assert.deepEqual(Object.keys(SUMMON_ART).sort(), [...CREATURE_WORDS].sort());
  for (const [id, { shadow, midtone, highlight, spark, core, markColors, aura, rim }] of Object.entries(FUSION_SUMMON_PALETTES)) {
    for (const color of [shadow, midtone, highlight, spark, core, aura, rim, markColors['#'], markColors['+']]) {
      assert.match(color, hexColor, id);
    }
    assert.ok(lightness(shadow) < lightness(midtone) && lightness(midtone) < lightness(highlight), id);
    assert.notEqual(markColors['#'], markColors['+'], id);
  }
});

test('Full V2 matrix preserves Normal and Grand geometry, ink, mark placement, and material order', () => {
  for (const [creature, art] of Object.entries(SUMMON_ART)) {
    const materials = art.rows.flat().map(([material]) => material);
    for (const [id, palette] of Object.entries(FUSION_SUMMON_PALETTES)) {
      for (const grand of [false, true]) {
        const label = `${creature} ${id} ${grand ? 'Grand' : 'Normal'}`;
        const v1 = summonFrame(creature, id, grand);
        const v2 = summonFrame(creature, id, grand, { v2: true });
        assert.deepEqual(v2.pixels.map(paint => paint.slice(0, 4)),
          v1.pixels.map(paint => paint.slice(0, 4)), label);
        assert.deepEqual(v2.rings.map(ring => ring[4]), grand ? [palette.aura, palette.rim] : [palette.aura], label);

        const renderedBody = new Map();
        materials.forEach((material, i) => {
          const color = v2.pixels[i + 1][4];
          assert.match(color, hexColor, label);
          if (material === 'ink') assert.equal(color, art.colors.ink, label);
          else if (material === 'spark' || material === 'core') assert.equal(color, palette[material], label);
          else if (body(material)) renderedBody.set(material, color);
        });
        const ordered = [...renderedBody].sort(([a], [b]) => lightness(art.colors[a]) - lightness(art.colors[b]));
        for (let i = 1; i < ordered.length; i++) {
          // RGB quantization can move a near-equal luminance by one channel step.
          assert.ok(lightness(ordered[i][1]) + 0.003 >= lightness(ordered[i - 1][1]), label);
        }
        assert.ok(new Set(renderedBody.values()).size > 3, label);
        const marks = v2.pixels.slice(1 + materials.length);
        assert.ok(marks.length >= 8, label);
        assert.deepEqual(new Set(marks.map(mark => mark[4])), new Set(Object.values(palette.markColors)), label);
      }
    }
  }
});

test('V2 selects midtone for equal luminance and safely handles a sprite with no body', () => {
  const palette = FUSION_SUMMON_PALETTES.plasma;
  const { ctx, pixels } = recordDraw();
  drawSummonArt(ctx, {
    colors: { ink: '#123456', one: '#777777', two: '#777777' },
    rows: [[['ink', 0, 1], ['one', 1, 2], ['two', 2, 3]]],
  }, 0, 0, 1, palette);
  assert.deepEqual(pixels.map(paint => paint[4].toUpperCase()),
    ['#123456', palette.midtone, palette.midtone]);
  pixels.length = 0;
  drawSummonArt(ctx, {
    colors: { ink: '#123456', spark: '#abcdef' },
    rows: [[['ink', 0, 1], ['spark', 1, 2]]],
  }, 0, 0, 1, palette);
  assert.deepEqual(pixels.map(paint => paint[4]), ['#123456', palette.spark]);
});

test('Variant cache reuses art and palette identity across scales and isolates visual toggles', () => {
  const source = SUMMON_ART.golem;
  let paletteReads = 0;
  const art = { ...source, get colors() { paletteReads++; return source.colors; } };
  const magma = FUSION_SUMMON_PALETTES.magma;
  const { ctx, pixels } = recordDraw();
  const draw = (palette, scale) => {
    pixels.length = 0;
    drawSummonArt(ctx, art, 0, 0, scale, palette);
    return pixels.map(paint => paint[4]);
  };
  const original = draw(magma, 1);
  assert.notDeepEqual(draw(FUSION_SUMMON_PALETTES.mist, 1), original);
  const readsAfterMisses = paletteReads;
  assert.deepEqual(draw(magma, 2), original);
  assert.equal(paletteReads, readsAfterMisses);
  assert.ok(Object.isFrozen(magma) && Object.isFrozen(magma.markColors));

  const visible = summonFrame('golem', 'magma', true, { v2: true });
  const hidden = summonFrame('golem', 'magma', true, { v2: true, marks: false, aura: false });
  assert.deepEqual(hidden.pixels, visible.pixels.slice(0, 1 + art.rows.flat().length));
  assert.deepEqual(hidden.rings, []);
  assert.deepEqual(summonFrame('golem', 'magma', true, { v2: true }), visible);
  assert.deepEqual(summonFrame('golem', 'magma', true, { v2: false }), summonFrame('golem', 'magma', true));
});

test('V2 follows summon animation poses and colors the legacy fallback', () => {
  const palette = FUSION_SUMMON_PALETTES.shockstream;
  for (const type of ['summon_invoke', 'summon_strike', 'summon_relay', 'summon_counter',
    'summon_hit', 'attack', 'summon_rebirth', 'summon_break']) {
    const event = { type, target: 'summon' };
    const v1 = summonFrame('dragon', 'shockstream', true, { v2: false, aura: false }, event, false);
    const v2 = summonFrame('dragon', 'shockstream', true, { v2: true, aura: false }, event, false);
    assert.deepEqual(v2.pixels.map(paint => paint.slice(0, 4)), v1.pixels.map(paint => paint.slice(0, 4)), type);
    assert.ok(v2.pixels.some(paint => paint[4] === palette.core), type);
  }
  const fallback = summonFrame('legacy-creature', 'shockstream', true, { v2: true }, null, false);
  assert.deepEqual(new Set(fallback.pixels.map(paint => paint[4])),
    new Set([PALETTE[0], palette.shadow, palette.highlight, palette.core, palette.spark, palette.rim]));
  assert.equal(fallback.rings[0][4], palette.aura);
});

test('Enabling V2 preserves non-fusion summon appearance, including legacy fallback', () => {
  const elements = [null, 'fire', 'ice', 'water', 'earth', 'lightning', 'wind', ...Object.keys(SECOND_TIER_ELEMENTS), 'storm'];
  for (const creature of [...CREATURE_WORDS, 'legacy-creature']) {
    for (const grand of [false, true]) {
      for (const element of elements) {
        assert.deepEqual(summonFrame(creature, element, grand, { v2: true }),
          summonFrame(creature, element, grand), `${creature} ${element} ${grand}`);
      }
    }
  }
});
