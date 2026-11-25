import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSS_ART_V2,
  drawBossArt,
  evaluateBossAnimation,
  resolveBossArt,
} from '../src/boss-art-v2.js';
import {
  TEMPEST_ARCHON_V2_GRID,
  TEMPEST_ARCHON_V2_MATERIALS,
} from '../src/boss-art/tempest-archon-v2.js';
import {
  TEMPEST_ARCHON_V2_HALO,
  TEMPEST_ARCHON_V2_LEFTWING,
  TEMPEST_ARCHON_V2_RIGHTWING,
  TEMPEST_ARCHON_V2_ROBELEFT,
  TEMPEST_ARCHON_V2_ROBERIGHT,
  TEMPEST_ARCHON_V2_SCEPTERORB,
  TEMPEST_ARCHON_V2_STORMARCS,
} from '../src/boss-art/tempest-archon-parts.js';

function createMockCtx() {
  const draws = [];
  return {
    draws,
    fillStyle: '#000000',
    fillRect(x, y, w, h) {
      draws.push({ color: this.fillStyle, x, y, w, h });
    },
  };
}

function countNonEmptyPixels(grid) {
  let count = 0;
  for (const row of grid) {
    for (const ch of row) {
      if (ch !== '.') count++;
    }
  }
  return count;
}

describe('Major Boss V2 — Tempest Archon Signature Animation (Phase B2.1)', () => {
  it('preserves 119x92 master grid, 24 semantic colors, and 119x86 combined opaque bounds', () => {
    assert.equal(TEMPEST_ARCHON_V2_GRID.length, 92);
    assert.equal(TEMPEST_ARCHON_V2_GRID[0].length, 119);
    assert.equal(Object.keys(TEMPEST_ARCHON_V2_MATERIALS).length, 24);

    const art = BOSS_ART_V2.tempest_archon;
    assert.equal(art.width, 119);
    assert.equal(art.height, 92);
    assert.equal(art.opaqueBounds.minX, 0);
    assert.equal(art.opaqueBounds.maxX, 118);
    assert.equal(art.opaqueBounds.minY, 0);
    assert.equal(art.opaqueBounds.maxY, 85);
    assert.equal(art.opaqueBounds.width, 119);
    assert.equal(art.opaqueBounds.height, 86);
  });

  it('defines all 7 independent animated components with proper layering and >= 4 frames each', () => {
    const art = BOSS_ART_V2.tempest_archon;
    assert.ok(art.parts);
    const expected = {
      halo: 'behind',
      leftWing: 'behind',
      rightWing: 'behind',
      robeLeft: 'behind',
      robeRight: 'behind',
      scepterOrb: 'front',
      stormArcs: 'front',
    };
    for (const [name, z] of Object.entries(expected)) {
      const part = art.parts[name];
      assert.ok(part, `Missing component: ${name}`);
      assert.equal(part.z, z, `Unexpected z-layer for ${name}`);
      assert.ok(part.frames.length >= 4, `Expected >= 4 frames for ${name}, got ${part.frames.length}`);
    }
  });

  it('has genuinely distinct wing frames that preserve shoulder-root attachment and stay within 119x86 bounds', () => {
    const art = BOSS_ART_V2.tempest_archon;
    for (const [name, partDef] of [
      ['leftWing', TEMPEST_ARCHON_V2_LEFTWING],
      ['rightWing', TEMPEST_ARCHON_V2_RIGHTWING],
    ]) {
      const serialized = partDef.frames.map(fr => fr.join('\n'));
      assert.equal(new Set(serialized).size, partDef.frames.length, `${name} frames must be distinct`);

      const part = art.parts[name];
      const ox = part.anchor.x - part.joint.x;
      const oy = part.anchor.y - part.joint.y;
      for (let i = 0; i < part.frames.length; i++) {
        const b = part.frames[i].opaqueBounds;
        assert.ok(ox + b.minX >= 0, `${name}[${i}] minX out of bounds`);
        assert.ok(ox + b.maxX <= 118, `${name}[${i}] maxX out of bounds`);
        assert.ok(oy + b.minY >= 0, `${name}[${i}] minY out of bounds`);
        assert.ok(oy + b.maxY <= 85, `${name}[${i}] maxY out of bounds`);
        // Shoulder joint pixel region remains populated (pinned attachment)
        const jx = part.joint.x;
        const jy = part.joint.y;
        let nearJoint = 0;
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (part.frames[i].pixels[jy + dy]?.[jx + dx]) nearJoint++;
          }
        }
        assert.ok(nearJoint > 0, `${name}[${i}] detached from shoulder joint`);
      }
    }
  });

  it('has distinct frames for halo, robes, scepterOrb, and stormArcs with zero visible body duplication', () => {
    for (const [name, def] of [
      ['halo', TEMPEST_ARCHON_V2_HALO],
      ['robeLeft', TEMPEST_ARCHON_V2_ROBELEFT],
      ['robeRight', TEMPEST_ARCHON_V2_ROBERIGHT],
      ['scepterOrb', TEMPEST_ARCHON_V2_SCEPTERORB],
      ['stormArcs', TEMPEST_ARCHON_V2_STORMARCS],
    ]) {
      const serialized = def.frames.map(fr => fr.join('\n'));
      assert.equal(new Set(serialized).size, def.frames.length, `${name} frames must be distinct`);
    }

    // Verify front-layer parts have zero overlap with main body grid
    for (const partDef of [TEMPEST_ARCHON_V2_SCEPTERORB, TEMPEST_ARCHON_V2_STORMARCS]) {
      const ox = partDef.anchor.x - partDef.joint.x;
      const oy = partDef.anchor.y - partDef.joint.y;
      const f0 = partDef.frames[0];
      for (let y = 0; y < f0.length; y++) {
        for (let x = 0; x < f0[y].length; x++) {
          if (f0[y][x] !== '.') {
            assert.equal(TEMPEST_ARCHON_V2_GRID[oy + y][ox + x], '.', `Front part overlap at (${ox + x}, ${oy + y})`);
          }
        }
      }
    }

    assert.ok(countNonEmptyPixels(TEMPEST_ARCHON_V2_GRID) > 1500);
  });

  it('supports idle, charge, attack, hurt, dead, reducedMotion, and V1 fallback', () => {
    const art = BOSS_ART_V2.tempest_archon;
    const colors = art.colors;

    // Idle
    const idle0 = evaluateBossAnimation(art, { frame: 0, pose: 'idle', now: 0, colors });
    const idle2 = evaluateBossAnimation(art, { frame: 2, pose: 'idle', now: 440, colors });
    assert.notEqual(idle0.partStates.leftWing.frame, idle2.partStates.leftWing.frame);
    assert.ok(idle0.effects.some(e => e.type === 'groundShadow'));

    // Charge
    const charge = evaluateBossAnimation(art, { frame: 1, pose: 'charge', charging: true, now: 150, colors });
    assert.ok(charge.materialOverrides?.goldBright);
    assert.ok(charge.effects.some(e => e.type === 'anchorBolt' && e.anchor === 'weapon'));

    // Attack
    const atkWindup = evaluateBossAnimation(art, { frame: 0, pose: 'attack', attacking: true, progress: 0.15, now: 100, colors });
    const atkStrike = evaluateBossAnimation(art, { frame: 1, pose: 'attack', attacking: true, progress: 0.45, now: 200, colors });
    assert.equal(atkWindup.partStates.leftWing.frame, 2);
    assert.equal(atkStrike.partStates.leftWing.frame, 3);
    assert.ok(atkStrike.effects.some(e => e.type === 'anchorBolt' && e.anchor === 'weapon'));

    // Hurt
    const hurt = evaluateBossAnimation(art, { frame: 1, pose: 'hurt', hurt: true, now: 300, colors });
    assert.equal(hurt.partStates.leftWing.frame, 0);
    assert.equal(hurt.partStates.rightWing.frame, 0);

    // Death hides all components and clears effects
    const dead = evaluateBossAnimation(art, { frame: 0, pose: 'dead', now: 500, colors });
    assert.equal(dead.partStates.hideParts, true);
    assert.equal(dead.effects.length, 0);

    // Reduced motion locks neutral pose and suppresses oscillation/flashing
    const rm = evaluateBossAnimation(art, { frame: 2, pose: 'charge', charging: true, reducedMotion: true, now: 999, colors });
    assert.equal(rm.materialOverrides, null);
    assert.equal(rm.partStates.leftWing.frame, 0);
    assert.equal(rm.partStates.rightWing.frame, 0);
    assert.equal(rm.partStates.halo.frame, 0);
    assert.equal(rm.effects.length, 1);
    assert.equal(rm.effects[0].type, 'groundShadow');

    // Pixel-snapped rendering & V1 fallback
    const ctx = createMockCtx();
    drawBossArt(ctx, art, 100, 40, 1, idle2.materialOverrides, idle2.partStates);
    assert.ok(ctx.draws.length > 0);
    assert.equal(resolveBossArt('tempest_archon', { v2: false }), null);
    assert.equal(resolveBossArt('tempest_archon', null), null);
  });
});
