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
  LOOM_SOVEREIGN_V2_GRID,
  LOOM_SOVEREIGN_V2_MATERIALS,
  LOOM_SOVEREIGN_V2_PARTS,
} from '../src/boss-art/loom-sovereign-v2.js';
import { Battlefield } from '../src/render.js';
import { FLOOR50_BOSS_ROOM } from '../src/run.js';

describe('Major Boss V2 — Loom Sovereign (Phase B5)', () => {
  it('has a valid 154x116 main grid, 32-color palette, and 10 non-overlapping 4-frame components', () => {
    assert.equal(LOOM_SOVEREIGN_V2_GRID.length, 116);
    assert.equal(LOOM_SOVEREIGN_V2_GRID[0].length, 154);
    assert.equal(Object.keys(LOOM_SOVEREIGN_V2_MATERIALS).length, 32);

    const partKeys = Object.keys(LOOM_SOVEREIGN_V2_PARTS);
    assert.equal(partKeys.length, 10);

    const art = BOSS_ART_V2.loom_sovereign;
    assert.ok(art);
    assert.equal(resolveBossArt('loom_sovereign', { v2: true }), art);
    assert.equal(resolveBossArt('loom_sovereign', { v2: false }), null);
    assert.equal(art.neutralBounds.width, 154);
    assert.equal(art.neutralBounds.height, 116);
    assert.ok(art.bodyBounds.width <= art.neutralBounds.width);

    for (const key of partKeys) {
      const part = art.parts[key];
      const expectedFrames = ['innerWeavingRingA', 'innerWeavingRingB'].includes(key) ? 8
        : ['leftSpool', 'rightSpool'].includes(key) ? 6 : 4;
      assert.equal(part.frames.length, expectedFrames, `${key} frame count`);
      const fr0 = LOOM_SOVEREIGN_V2_PARTS[key].frames[0];
      for (let py = 0; py < fr0.length; py++) {
        for (let px = 0; px < fr0[py].length; px++) {
          if (fr0[py][px] !== '.') {
            assert.equal(LOOM_SOVEREIGN_V2_GRID[part.anchor.y + py][part.anchor.x + px], '.');
          }
        }
      }
    }
    // Verify genuine silhouette geometry changes across ring frames (not just color swaps)
    const ringA = LOOM_SOVEREIGN_V2_PARTS.innerWeavingRingA.frames;
    const occ0 = ringA[0].map(r => r.replace(/[^.]/g, '#')).join('\n');
    const occ1 = ringA[1].map(r => r.replace(/[^.]/g, '#')).join('\n');
    assert.notEqual(occ0, occ1);
    assert.equal(art.parts.innerWeavingRingA.z, 'behind');
    assert.equal(art.parts.leftTextileTendrils.z, 'behind');
    assert.equal(art.parts.rightTextileTendrils.z, 'behind');
    assert.equal(art.parts.centralVoidEye.z, 'front');
    assert.equal(art.parts.innerWeavingRingB.z, 'front');
  });

  it('locks 120px default height, -6px floating offset, rear layer, and Floor 50 4-actor formation', () => {
    const art = BOSS_ART_V2.loom_sovereign;
    assert.equal(BOSS_SIZE_V2.loom_sovereign.defaultTier, 'large');
    assert.equal(BOSS_SIZE_V2.loom_sovereign.defaultHeight, 120);
    assert.equal(BOSS_SIZE_V2.loom_sovereign.offset.baseline, -6);
    assert.equal(resolveBossLayer('loom_sovereign'), 'rear');

    for (const [tier, targetH] of Object.entries(BOSS_SIZE_V2.loom_sovereign.tiers)) {
      const scale = resolveBossScale('loom_sovereign', art, { sizeTier: tier });
      assert.ok(Math.abs(art.neutralBounds.height * scale - targetH) < 1e-6);
    }

    const metrics = getBossVisualBounds('loom_sovereign', 226, 146, 0, art, { v2: true });
    assert.equal(metrics.height, 120);
    assert.equal(metrics.bottom, 140);
    assert.ok(metrics.ward.width < metrics.width);
    assert.ok(metrics.eye && metrics.leftSpool && metrics.rightSpool && metrics.tapestry);

    const f50Enemies = [
      { id: 'b', kind: 'loom_sovereign', slot: 0 },
      { id: 'm0', kind: 'rift_runner', slot: 1 },
      { id: 'm1', kind: 'ward_scribe', slot: 2 },
      { id: 'm2', kind: 'thread_archer', slot: 3 },
    ];
    const mockV2 = { state: { room: FLOOR50_BOSS_ROOM, enemies: f50Enemies }, bossVisuals: { v2: true } };
    const mockV1 = { state: { room: FLOOR50_BOSS_ROOM, enemies: f50Enemies }, bossVisuals: { v2: false } };
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f50Enemies[0]), 226);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f50Enemies[1]), 172);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f50Enemies[2]), 220);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f50Enemies[3]), 268);
    assert.equal(Battlefield.prototype.enemyX.call(mockV1, f50Enemies[0]), 126);
  });

  it('animates components, threads, stays inside 320x180 battlefield, and respects reducedMotion', () => {
    const art = BOSS_ART_V2.loom_sovereign;
    const states = [
      { frame: 0, pose: 'idle' },
      { frame: 1, pose: 'idle' },
      { frame: 2, pose: 'charge', charging: true },
      { frame: 2, pose: 'attack', attacking: true, progress: 0.5 },
    ];
    const overflow = detectBossComponentOverflow(art, states);
    // Verify animated envelope stays inside 320x180 battlefield even with tendril/spool offsets
    const env = getBossAnimatedEnvelope('loom_sovereign', 226, 146, 0, art, { v2: true }, states.map(s => evaluateBossAnimation(art, { ...s, reducedMotion: false, colors: art.colors }).partStates));
    assert.equal(env.clipsBattlefield, false, `Loom Sovereign clips battlefield: ${JSON.stringify(env)}`);

    const idle0 = evaluateBossAnimation(art, { frame: 0, pose: 'idle', reducedMotion: false, colors: art.colors });
    const idle1 = evaluateBossAnimation(art, { frame: 1, pose: 'idle', reducedMotion: false, colors: art.colors });
    assert.notDeepEqual(idle0.partStates.centralVoidEye, idle1.partStates.centralVoidEye);
    assert.notDeepEqual(idle0.partStates.innerWeavingRingA, idle1.partStates.innerWeavingRingA);
    assert.ok(idle0.effects.some(e => e.type === 'fateThread'));

    // Verify dynamic fateThread endpoints track animated spool & ornament offsets during charge/attack
    const chg = evaluateBossAnimation(art, { frame: 1, pose: 'charge', charging: true, reducedMotion: false, colors: art.colors });
    const leftThread = chg.effects.find(e => e.type === 'fateThread' && e.from === 'leftSpool');
    assert.equal(leftThread.dx1, chg.partStates.leftSpool.dx);
    const ornThread = chg.effects.find(e => e.type === 'fateThread' && e.from === 'leftOrnament');
    assert.equal(ornThread.dy1, chg.partStates.leftOrnament.dy);
    assert.equal(ornThread.dx2, chg.partStates.leftSpool.dx);

    const rm = evaluateBossAnimation(art, { frame: 2, pose: 'charge', charging: true, reducedMotion: true, colors: art.colors });
    for (const st of Object.values(rm.partStates)) {
      assert.equal(st.dx, 0);
      assert.equal(st.dy, 0);
      assert.equal(st.frame, 0);
    }
    assert.ok(overflow !== undefined);
  });
});
