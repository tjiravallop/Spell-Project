import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_ART_V2, evaluateBossAnimation, resolveBossArt } from '../src/boss-art-v2.js';
import {
  BOSS_SIZE_V2,
  getBossVisualBounds,
  resolveBossLayer,
  resolveBossScale,
} from '../src/boss-sizes.js';
import {
  MIRROR_REGENT_V2_GRID,
  MIRROR_REGENT_V2_MATERIALS,
  MIRROR_REGENT_V2_SHARDS,
} from '../src/boss-art/mirror-regent-v2.js';
import { Battlefield } from '../src/render.js';
import { FLOOR40_BOSS_ROOM } from '../src/run.js';

describe('Major Boss V2 — Mirror Regent (Phase B4)', () => {
  it('has a valid 120x108 body grid, 32-color palette, and 5 non-overlapping 4-frame mirror shards', () => {
    assert.equal(MIRROR_REGENT_V2_GRID.length, 108);
    assert.equal(MIRROR_REGENT_V2_GRID[0].length, 120);
    assert.equal(Object.keys(MIRROR_REGENT_V2_MATERIALS).length, 32);

    const shardKeys = Object.keys(MIRROR_REGENT_V2_SHARDS);
    assert.equal(shardKeys.length, 5);

    const art = BOSS_ART_V2.mirror_regent;
    assert.ok(art);
    assert.equal(resolveBossArt('mirror_regent', { v2: true }), art);
    assert.equal(resolveBossArt('mirror_regent', { v2: false }), null);

    for (const key of shardKeys) {
      const part = art.parts[key];
      assert.ok(part);
      assert.equal(part.z, 'front');
      assert.equal(part.frames.length, 4);
      const baseFrame = MIRROR_REGENT_V2_SHARDS[key].frames[0];
      for (let py = 0; py < baseFrame.length; py++) {
        for (let px = 0; px < baseFrame[py].length; px++) {
          if (baseFrame[py][px] !== '.') {
            assert.equal(MIRROR_REGENT_V2_GRID[part.anchor.y + py][part.anchor.x + px], '.');
          }
        }
      }
    }
  });

  it('locks 112px default height, -6px floating offset, rear layer, and Floor 40 formation', () => {
    const art = BOSS_ART_V2.mirror_regent;
    assert.equal(BOSS_SIZE_V2.mirror_regent.defaultTier, 'large');
    assert.equal(BOSS_SIZE_V2.mirror_regent.defaultHeight, 112);
    assert.equal(BOSS_SIZE_V2.mirror_regent.offset.baseline, -6);
    assert.equal(resolveBossLayer('mirror_regent'), 'rear');

    for (const [tier, targetH] of Object.entries(BOSS_SIZE_V2.mirror_regent.tiers)) {
      const scale = resolveBossScale('mirror_regent', art, { sizeTier: tier });
      assert.ok(Math.abs(art.opaqueBounds.height * scale - targetH) < 1e-6);
    }

    const metrics = getBossVisualBounds('mirror_regent', 230, 146, 0, art, { v2: true });
    assert.equal(metrics.height, 112);
    assert.equal(metrics.bottom, 140);
    assert.ok(metrics.ward.width < metrics.width);

    const rearEnemies = [{ kind: 'mirror_regent', slot: 0 }, { kind: 'ward_scribe', slot: 1 }, { kind: 'thread_archer', slot: 2 }];
    const mockV2 = { state: { room: FLOOR40_BOSS_ROOM, enemies: rearEnemies }, bossVisuals: { v2: true } };
    const mockV1 = { state: { room: FLOOR40_BOSS_ROOM, enemies: rearEnemies }, bossVisuals: { v2: false } };
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, rearEnemies[0]), 230);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, rearEnemies[1]), 195);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, rearEnemies[2]), 260);
    assert.equal(Battlefield.prototype.enemyX.call(mockV1, rearEnemies[0]), 126);
  });

  it('animates shards independently, stays inside 320x180 battlefield, and respects reducedMotion', () => {
    const art = BOSS_ART_V2.mirror_regent;
    const metrics = getBossVisualBounds('mirror_regent', 230, 146, 0, art, { v2: true });

    const idle0 = evaluateBossAnimation(art, { frame: 0, pose: 'idle', reducedMotion: false, colors: art.colors });
    const idle1 = evaluateBossAnimation(art, { frame: 1, pose: 'idle', reducedMotion: false, colors: art.colors });
    assert.notDeepEqual(idle0.partStates.shardLeftMid, idle1.partStates.shardLeftMid);
    assert.notDeepEqual(idle0.partStates.shardLeftMid, idle0.partStates.shardRightMid);

    const reflect = evaluateBossAnimation(art, { frame: 1, pose: 'reflect', reducedMotion: false, colors: art.colors });
    assert.ok(reflect.materialOverrides?.silverLight);
    assert.ok(reflect.effects.some(e => e.type === 'anchorBolt'));

    const rm = evaluateBossAnimation(art, { frame: 2, pose: 'charge', charging: true, reducedMotion: true, colors: art.colors });
    for (const st of Object.values(rm.partStates)) {
      assert.equal(st.dx, 0);
      assert.equal(st.dy, 0);
      assert.equal(st.frame, 0);
    }

    // Verify animated shard envelope remains inside 320x180 battlefield across idle, charge, attack, reflect
    for (const st of [
      { frame: 0, pose: 'idle' },
      { frame: 2, pose: 'charge', charging: true },
      { frame: 2, pose: 'attack', attacking: true, progress: 0.5 },
      { frame: 1, pose: 'reflect' },
    ]) {
      const anim = evaluateBossAnimation(art, { ...st, reducedMotion: false, colors: art.colors });
      for (const [key, part] of Object.entries(art.parts)) {
        const ps = anim.partStates[key];
        const left = Math.round(metrics.left + part.anchor.x * metrics.scale) + ps.dx;
        const top = Math.round(metrics.top + part.anchor.y * metrics.scale) + ps.dy;
        const right = left + Math.round(part.width * metrics.scale);
        const bottom = top + Math.round(part.height * metrics.scale);
        assert.ok(left >= 0 && right <= 320, `${key} X out of bounds: ${left}..${right}`);
        assert.ok(top >= 0 && bottom <= 180, `${key} Y out of bounds: ${top}..${bottom}`);
      }
    }
  });
});
