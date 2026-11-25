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
  THUNDER_DRAKE_EMPEROR_V2_GRID,
  THUNDER_DRAKE_EMPEROR_V2_MATERIALS,
  THUNDER_DRAKE_EMPEROR_V2_PARTS,
} from '../src/boss-art/thunder-drake-emperor-v2.js';
import { Battlefield } from '../src/render.js';
import { FLOOR70_BOSS_ROOM } from '../src/run.js';

describe('Major Boss V2 — Thunder Drake Emperor (Phase B7.1 Reconstructed)', () => {
  it('has a valid 158x124 main grid, 32-color palette, and 3 coherent components (dragonBody 8f + twin thunder orbs 6f)', () => {
    assert.equal(THUNDER_DRAKE_EMPEROR_V2_GRID.length, 124);
    assert.equal(THUNDER_DRAKE_EMPEROR_V2_GRID[0].length, 158);
    assert.equal(Object.keys(THUNDER_DRAKE_EMPEROR_V2_MATERIALS).length, 32);

    const partKeys = Object.keys(THUNDER_DRAKE_EMPEROR_V2_PARTS);
    assert.equal(partKeys.length, 3);
    assert.deepEqual(partKeys, ['dragonBody', 'thunderOrbLeft', 'thunderOrbRight']);

    const art = BOSS_ART_V2.thunder_drake_emperor;
    assert.ok(art);
    assert.equal(resolveBossArt('thunder_drake_emperor', { v2: true }), art);
    assert.equal(resolveBossArt('thunder_drake_emperor', { v2: false }), null);
    assert.equal(art.neutralBounds.width, 152);
    assert.equal(art.neutralBounds.height, 124);

    assert.equal(art.parts.dragonBody.frames.length, 8);
    assert.equal(art.parts.thunderOrbLeft.frames.length, 6);
    assert.equal(art.parts.thunderOrbRight.frames.length, 6);
    assert.equal(art.parts.dragonBody.z, 'front');
    assert.equal(art.parts.thunderOrbLeft.z, 'front');
    assert.equal(art.parts.thunderOrbRight.z, 'front');
  });

  it('locks 120px default height, -8px floating offset, rear layer, and Floor 70 4-actor formation', () => {
    const art = BOSS_ART_V2.thunder_drake_emperor;
    assert.equal(BOSS_SIZE_V2.thunder_drake_emperor.defaultTier, 'grand');
    assert.equal(BOSS_SIZE_V2.thunder_drake_emperor.defaultHeight, 120);
    assert.equal(BOSS_SIZE_V2.thunder_drake_emperor.offset.baseline, -8);
    assert.equal(resolveBossLayer('thunder_drake_emperor'), 'rear');

    for (const [tier, targetH] of Object.entries(BOSS_SIZE_V2.thunder_drake_emperor.tiers)) {
      const scale = resolveBossScale('thunder_drake_emperor', art, { sizeTier: tier });
      assert.ok(Math.abs(art.neutralBounds.height * scale - targetH) < 1e-6);
    }

    const metrics = getBossVisualBounds('thunder_drake_emperor', 228, 146, 0, art, { v2: true });
    assert.equal(metrics.height, 120);
    assert.equal(metrics.bottom, 138);
    assert.ok(metrics.ward.width < metrics.width);
    assert.ok(metrics.jaw && metrics.leftHorn && metrics.rightHorn && metrics.neck && metrics.tailRoot && metrics.tailTip);
    assert.ok(metrics.leftThunderOrb && metrics.rightThunderOrb);

    const f70Enemies = [
      { id: 'b', kind: 'thunder_drake_emperor', slot: 0 },
      { id: 'm0', kind: 'sand_stalker', slot: 1 },
      { id: 'm1', kind: 'spark_wraith', slot: 2 },
      { id: 'm2', kind: 'sand_stalker', slot: 3 },
    ];
    const mockV2 = { state: { room: FLOOR70_BOSS_ROOM, enemies: f70Enemies }, bossVisuals: { v2: true } };
    const mockV1 = { state: { room: FLOOR70_BOSS_ROOM, enemies: f70Enemies }, bossVisuals: { v2: false } };
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f70Enemies[0]), 228);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f70Enemies[1]), 172);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f70Enemies[2]), 220);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, f70Enemies[3]), 268);
    assert.equal(Battlefield.prototype.enemyX.call(mockV1, f70Enemies[0]), 126);
  });

  it('animates continuous dragonBody + twin orbs, handles grounding & reflection, stays inside 320x180, and respects reducedMotion', () => {
    const art = BOSS_ART_V2.thunder_drake_emperor;
    const states = [
      { frame: 0, pose: 'idle', armor: 5, now: 100 },
      { frame: 2, pose: 'idle', armor: 5, now: 600 },
      { frame: 2, pose: 'charge', charging: true, armor: 3, now: 900 },
      { frame: 2, pose: 'attack', attacking: true, progress: 0.5, armor: 0, now: 1200 },
      { frame: 1, pose: 'idle', armor: 5, reflecting: true, now: 1400 },
      { frame: 1, pose: 'idle', armor: 5, grounded: true, now: 1600 },
    ];
    const overflow = detectBossComponentOverflow(art, states);
    assert.equal(overflow.hasOverflow, false, JSON.stringify(overflow.entries));

    const env = getBossAnimatedEnvelope(
      'thunder_drake_emperor',
      228,
      146,
      0,
      art,
      { v2: true },
      states.map(s => evaluateBossAnimation(art, s).partStates),
    );
    assert.equal(env.clipsBattlefield, false);

    // Grounded suppresses dynamic lightning arcs & dims orb energy
    const groundedAnim = evaluateBossAnimation(art, { frame: 1, pose: 'idle', grounded: true, now: 500 });
    assert.ok(groundedAnim.materialOverrides?.orbEnergy);
    assert.equal(groundedAnim.effects.some(e => e.type === 'linkBolt'), false);

    // Charge emits dynamic linkBolt effects from orbs to horns
    const chargeAnim = evaluateBossAnimation(art, { frame: 1, pose: 'charge', charging: true, now: 500 });
    assert.ok(chargeAnim.effects.some(e => e.type === 'linkBolt' && e.from === 'leftThunderOrb' && e.fromPart === 'thunderOrbLeft'));
    assert.ok(chargeAnim.effects.some(e => e.type === 'linkBolt' && e.from === 'rightThunderOrb' && e.fromPart === 'thunderOrbRight'));

    // Reduced motion keeps Frame 0 & zero offsets
    const rmAnim = evaluateBossAnimation(art, { frame: 3, pose: 'idle', reducedMotion: true, now: 999 });
    assert.equal(rmAnim.partStates.dragonBody.frame, 0);
    assert.equal(rmAnim.partStates.thunderOrbLeft.frame, 0);
    assert.equal(rmAnim.partStates.thunderOrbLeft.dx, 0);

    // Death hides all parts including both thunder orbs and clears effects
    const deadAnim = evaluateBossAnimation(art, { frame: 0, pose: 'dead', now: 1200 });
    assert.equal(deadAnim.partStates.hideParts, true);
    assert.equal(deadAnim.effects.length, 0);
  });
});
