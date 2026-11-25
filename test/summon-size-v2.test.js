import assert from 'node:assert/strict';
import test from 'node:test';
import { Battlefield, getSummonAnchor, getSummonBounds, getSummonHudLayout } from '../src/render.js';
import { DRAGON_ART_V2, SUMMON_ART } from '../src/summon-art.js';
import { SUMMON_SIZE_V2, getOpaqueBounds, resolveCreatureScale } from '../src/summon-sizes.js';
import { CREATURE_WORDS } from '../src/words.js';

test('Size System V2 covers all 27 creatures with independent Normal and Grand scales', () => {
  const creatures = Object.values(CREATURE_WORDS);
  assert.equal(creatures.length, 27);
  for (const cid of creatures) {
    const spec = SUMMON_SIZE_V2[cid];
    assert.ok(spec, `Missing Size V2 spec for ${cid}`);
    assert.ok(['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(spec.sizeClass), cid);
    assert.ok(spec.normalScale > 0 && spec.grandScale > spec.normalScale, cid);
  }
});

test('Size V2 keeps Dragon V2 benchmark bounds and XXL Grand summons within 320x180 battlefield', () => {
  const dragonNormal = getSummonBounds({ creatureId: 'dragon', isGrand: false }, { dragonV2: true, sizeV2: true });
  const dragonGrand = getSummonBounds({ creatureId: 'dragon', isGrand: true }, { dragonV2: true, sizeV2: true });
  assert.deepEqual([dragonNormal.width, dragonNormal.height], [60, 51]);
  assert.deepEqual([dragonGrand.width, dragonGrand.height], [120, 102]);
  assert.ok(dragonGrand.left >= 0 && dragonGrand.top >= 0 && dragonGrand.right <= 320);

  for (const cid of ['hydra', 'kraken', 'behemoth']) {
    const xxl = getSummonBounds({ creatureId: cid, isGrand: true }, { sizeV2: true });
    assert.ok(xxl.height >= 130 && xxl.height <= 140, `${cid} height ${xxl.height}`);
    assert.ok(xxl.top >= 7 && xxl.top <= 17, `${cid} top ${xxl.top}`);
    assert.ok(xxl.left >= 0 && xxl.right <= 320, `${cid} horizontal bounds [${xxl.left}, ${xxl.right}]`);
    const hud = getSummonHudLayout({ creatureId: cid, isGrand: true }, { sizeV2: true });
    assert.equal(hud.placement, 'side', `${cid} XXL should use side HUD placement`);
  }
});

test('Size V2 defaults to off and summon_invoke pulse never clips XXL creatures', () => {
  const defaultScale = resolveCreatureScale('dragon', false, DRAGON_ART_V2, { sizeV2: false });
  assert.equal(defaultScale, 1);

  const paints = [];
  const ctx = {
    imageSmoothingEnabled: false,
    fillStyle: '#000',
    fillRect(x, y, w, h) { paints.push({ x, y, w, h }); },
    save() {}, restore() {},
  };
  const anchor = getSummonAnchor({ creatureId: 'behemoth', isGrand: true }, { sizeV2: true });
  Battlefield.prototype.drawSummonSprite.call({
    ctx,
    settings: { reducedMotion: false },
    summonVisuals: { sizeV2: true, aura: false },
    pixelEllipse() {},
    pixelDiamond() {},
  }, { creatureId: 'behemoth', isGrand: true, hp: 90, maxHp: 90 }, anchor.x, anchor.baseline, 0, { type: 'summon_invoke' }, 0.28, true);

  for (const p of paints) {
    assert.ok(p.x >= 0 && p.y >= 0 && p.x + p.w <= 320 && p.y + p.h <= 180, `clipped rect ${JSON.stringify(p)}`);
  }
});

test('getOpaqueBounds matches SUMMON_ART pixel grids', () => {
  const ratOpaque = getOpaqueBounds(SUMMON_ART.rat);
  assert.deepEqual([ratOpaque.width, ratOpaque.height], [28, 17]);
  const dv2Opaque = getOpaqueBounds(DRAGON_ART_V2);
  assert.deepEqual([dv2Opaque.width, dv2Opaque.height], [40, 34]);
});
