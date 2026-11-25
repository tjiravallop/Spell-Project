import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_ART_V2, detectBossComponentOverflow, evaluateBossAnimation, resolveBossArt } from '../src/boss-art-v2.js';
import {
  BOSS_SIZE_V2,
  getBossAnimatedEnvelope,
  getBossVisualBounds,
  resolveBossLayer,
  resolveBossScale,
} from '../src/boss-sizes.js';
import {
  VOLCANO_COLOSSUS_V2_GRID,
  VOLCANO_COLOSSUS_V2_MATERIALS,
  VOLCANO_COLOSSUS_V2_PARTS,
} from '../src/boss-art/volcano-colossus-v2.js';
import { Battlefield } from '../src/render.js';
import { FLOOR60_BOSS_ROOM } from '../src/run.js';

describe('Major Boss V2 — Volcano Colossus (Phase B6)', () => {
  it('has a valid 163x104 main grid, 32-color palette, and 9 non-overlapping 4-frame components', () => {
    assert.equal(VOLCANO_COLOSSUS_V2_GRID.length, 104);
    assert.equal(VOLCANO_COLOSSUS_V2_GRID[0].length, 163);
    assert.equal(Object.keys(VOLCANO_COLOSSUS_V2_MATERIALS).length, 32);

    const partKeys = Object.keys(VOLCANO_COLOSSUS_V2_PARTS);
    assert.equal(partKeys.length, 9);

    const art = BOSS_ART_V2.volcano_colossus;
    assert.ok(art);
    assert.equal(resolveBossArt('volcano_colossus', { v2: true }), art);
    assert.equal(resolveBossArt('volcano_colossus', { v2: false }), null);
    assert.equal(art.neutralBounds.width, 163);
    assert.equal(art.neutralBounds.height, 104);
    assert.ok(art.bodyBounds.width <= art.neutralBounds.width);

    for (const key of partKeys) {
      const part = art.parts[key];
      assert.equal(part.frames.length, 4);
      const fr0 = VOLCANO_COLOSSUS_V2_PARTS[key].frames[0];
      for (let py = 0; py < fr0.length; py++) {
        for (let px = 0; px < fr0[py].length; px++) {
          if (fr0[py][px] !== '.') {
            assert.equal(VOLCANO_COLOSSUS_V2_GRID[part.anchor.y + py][part.anchor.x + px], '.');
          }
        }
      }
    }
    assert.equal(art.parts.smokePlumes.z, 'behind');
    assert.equal(art.parts.leftForeleg.z, 'behind');
    assert.equal(art.parts.hindLegs.z, 'behind');
    assert.equal(art.parts.tail.z, 'behind');
    assert.equal(art.parts.headJaw.z, 'front');
    assert.equal(art.parts.volcanoCore.z, 'front');
    assert.equal(art.parts.rightForeleg.z, 'front');
  });

  it('locks 104px default height, 0px baseline offset, rear layer, and Floor 60 4-actor formation', () => {
    const art = BOSS_ART_V2.volcano_colossus;
    assert.equal(BOSS_SIZE_V2.volcano_colossus.defaultTier, 'large');
    assert.equal(BOSS_SIZE_V2.volcano_colossus.defaultHeight, 104);
    assert.equal(BOSS_SIZE_V2.volcano_colossus.offset.baseline, 0);
    assert.equal(resolveBossLayer('volcano_colossus'), 'rear');

    for (const [tier, targetH] of Object.entries(BOSS_SIZE_V2.volcano_colossus.tiers)) {
      const scale = resolveBossScale('volcano_colossus', art, { sizeTier: tier });
      assert.ok(Math.abs(art.neutralBounds.height * scale - targetH) < 1e-6);
    }

    const metrics = getBossVisualBounds('volcano_colossus', 228, 146, 0, art, { v2: true });
    assert.equal(metrics.height, 104);
    assert.equal(metrics.bottom, 146);
    assert.ok(metrics.ward.width < metrics.width);
    assert.ok(metrics.jaw && metrics.craterA && metrics.craterB && metrics.craterC && metrics.frontFoot && metrics.rearFoot);

    const f60Enemies = [
      { id: 'b', kind: 'volcano_colossus', slot: 0 },
      { id: 'm0', kind: 'magma_tortoise', slot: 1 },
      { id: 'm1', kind: 'cinder_drake', slot: 2 },
      { id: 'm2', kind: 'magma_tortoise', slot: 3 },
    ];
    const mockV2 = { state: { room: FLOOR60_BOSS_ROOM, enemies: f60Enemies }, bossVisuals: { v2: true } };
    const mockV1 = { state: { room: FLOOR60_BOSS_ROOM, enemies: f60Enemies }, bossVisuals: { v2: false } };
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f60Enemies[0]), 228);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f60Enemies[1]), 172);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f60Enemies[2]), 220);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f60Enemies[3]), 268);
    assert.equal(Battlefield.prototype.enemyX.call(mockV1, f60Enemies[0]), 126);
  });

  it('animates jaw/craters/magma, reflects cooled armor=0, stays inside 320x180, and respects reducedMotion', () => {
    const art = BOSS_ART_V2.volcano_colossus;
    const states = [
      { frame: 0, pose: 'idle', armor: 4 },
      { frame: 1, pose: 'idle', armor: 4 },
      { frame: 2, pose: 'charge', charging: true, armor: 2 },
      { frame: 2, pose: 'attack', attacking: true, progress: 0.5, armor: 0 },
    ];
    const overflow = detectBossComponentOverflow(art, states);
    assert.equal(overflow.hasOverflow, false);

    const env = getBossAnimatedEnvelope('volcano_colossus', 228, 146, 0, art, { v2: true }, states.map(s => evaluateBossAnimation(art, { ...s, reducedMotion: false, colors: art.colors }).partStates));
    assert.equal(env.clipsBattlefield, false, `Volcano Colossus clips battlefield: ${JSON.stringify(env)}`);

    const cooled = evaluateBossAnimation(art, { frame: 0, pose: 'idle', armor: 0, reducedMotion: false, colors: art.colors });
    assert.equal(cooled.materialOverrides.magmaMid, art.colors.magmaDark);

    const rm = evaluateBossAnimation(art, { frame: 2, pose: 'charge', charging: true, reducedMotion: true, colors: art.colors });
    assert.equal(rm.partStates.smokePlumes.visible, false);
    assert.equal(rm.partStates.headJaw.dx, 0);
    assert.equal(rm.partStates.headJaw.dy, 0);
    assert.equal(rm.partStates.headJaw.frame, 0);
  });
});
