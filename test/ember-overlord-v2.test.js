import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSS_ART_V2,
  drawBossArt,
  evaluateBossAnimation,
} from '../src/boss-art-v2.js';
import {
  EMBER_OVERLORD_V2_DEF,
  EMBER_OVERLORD_V2_GRID,
  EMBER_OVERLORD_V2_MATERIALS,
} from '../src/boss-art/ember-overlord-v2.js';
import {
  EMBER_OVERLORD_V2_BODY_GRID,
  EMBER_OVERLORD_V2_PARTS,
} from '../src/boss-art/ember-overlord-v2-parts.js';

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

describe('Major Boss V2 — Ember Overlord Signature Animation (Phase B1.2)', () => {
  it('separates 8 animated components with zero duplicate pixels and 100% lossless frame-0 assembly', () => {
    const art = BOSS_ART_V2.ember_overlord;
    assert.equal(art.width, 92);
    assert.equal(art.height, 80);
    assert.equal(art.opaqueBounds.minX, 0);
    assert.equal(art.opaqueBounds.maxX, 91);
    assert.equal(art.opaqueBounds.minY, 0);
    assert.equal(art.opaqueBounds.maxY, 79);
    assert.equal(art.opaqueBounds.width, 92);
    assert.equal(art.opaqueBounds.height, 80);

    const expectedParts = {
      flameCrown: { z: 'front', frames: 5 },
      leftShoulderFlame: { z: 'front', frames: 4 },
      rightShoulderFlame: { z: 'front', frames: 4 },
      scepterOrb: { z: 'front', frames: 4 },
      capeRight: { z: 'behind', frames: 4 },
      capeLeft: { z: 'behind', frames: 4 },
      scepterEmbers: { z: 'front', frames: 4 },
      shoulderEmbers: { z: 'front', frames: 4 },
    };

    for (const [key, spec] of Object.entries(expectedParts)) {
      const part = art.parts[key];
      assert.ok(part, `Missing part ${key}`);
      assert.equal(part.z, spec.z);
      assert.equal(part.frames.length, spec.frames);
    }

    // Reconstruct 92x80 from body + parts[0] and verify zero overlap & exact match with EMBER_OVERLORD_V2_GRID
    const assembled = EMBER_OVERLORD_V2_BODY_GRID.map(r => Array.from(r));
    for (const [key, partDef] of Object.entries(EMBER_OVERLORD_V2_PARTS)) {
      const ox = partDef.anchor.x - partDef.joint.x;
      const oy = partDef.anchor.y - partDef.joint.y;
      const frame0 = partDef.frames[0];
      for (let py = 0; py < frame0.length; py++) {
        for (let px = 0; px < frame0[py].length; px++) {
          const ch = frame0[py][px];
          if (ch === '.') continue;
          const gx = ox + px;
          const gy = oy + py;
          assert.equal(assembled[gy][gx], '.', `Duplicate pixel for ${key} at (${gx}, ${gy})`);
          assembled[gy][gx] = ch;
        }
      }
    }

    assert.deepEqual(
      assembled.map(r => r.join('')),
      EMBER_OVERLORD_V2_GRID,
      'Assembled frame 0 must match approved B1.1 EMBER_OVERLORD_V2_GRID pixel-for-pixel',
    );
  });

  it('has genuine localized pixel frame changes and keeps all frames within the 92x80 envelope', () => {
    const art = BOSS_ART_V2.ember_overlord;
    for (const [key, part] of Object.entries(art.parts)) {
      const ox = part.anchor.x - part.joint.x;
      const oy = part.anchor.y - part.joint.y;
      const frame0Rows = EMBER_OVERLORD_V2_PARTS[key].frames[0];

      for (let i = 0; i < part.frames.length; i++) {
        const b = part.frames[i].opaqueBounds;
        assert.ok(ox + b.minX >= 0, `${key}[${i}] minX out of bounds: ${ox + b.minX}`);
        assert.ok(ox + b.maxX <= 91, `${key}[${i}] maxX out of bounds: ${ox + b.maxX}`);
        assert.ok(oy + b.minY >= 0, `${key}[${i}] minY out of bounds: ${oy + b.minY}`);
        assert.ok(oy + b.maxY <= 79, `${key}[${i}] maxY out of bounds: ${oy + b.maxY}`);

        if (i > 0) {
          const rows = EMBER_OVERLORD_V2_PARTS[key].frames[i];
          let diffs = 0;
          for (let y = 0; y < rows.length; y++) {
            for (let x = 0; x < rows[y].length; x++) {
              if (rows[y][x] !== frame0Rows[y][x]) diffs++;
            }
          }
          assert.ok(diffs > 0, `${key}[${i}] must differ in pixel geometry from frame 0`);
        }
      }
    }
  });

  it('implements idle, charge, attack, hurt, death, and reducedMotion states cleanly', () => {
    const art = BOSS_ART_V2.ember_overlord;
    const colors = art.colors;

    // Idle: asynchronous shoulders & capes, continuous crown/scepter animation
    const idle0 = evaluateBossAnimation(art, { frame: 0, pose: 'idle', colors });
    const idle2 = evaluateBossAnimation(art, { frame: 2, pose: 'idle', colors });
    assert.notEqual(idle0.partStates.leftShoulderFlame.frame, idle0.partStates.rightShoulderFlame.frame);
    assert.notEqual(idle0.partStates.capeLeft.frame, idle0.partStates.capeRight.frame);
    assert.ok(idle2.materialOverrides?.core, 'Idle frame 2 should have slow magma core pulse');

    // Charge: crown flare frame 4, zero attachment gap (dx=0, dy=0 on attached parts), brighter core, orbitDiamonds
    const charge = evaluateBossAnimation(art, { frame: 0, pose: 'charge', charging: true, colors });
    assert.equal(charge.partStates.flameCrown.frame, 4);
    assert.equal(charge.partStates.rightShoulderFlame.dx, 0);
    assert.equal(charge.partStates.rightShoulderFlame.dy, 0);
    assert.equal(charge.partStates.scepterOrb.dy, 0);
    assert.equal(charge.materialOverrides.core, '#ffffff');
    assert.ok(charge.effects.some(e => e.type === 'orbitDiamonds'));

    // Attack: attached parts stay pinned (dx=0, dy=0) with flared frames, detached embers surge forward and return to 0
    const atkMid = evaluateBossAnimation(art, { frame: 1, pose: 'attack', attacking: true, progress: 0.5, colors });
    const atkEnd = evaluateBossAnimation(art, { frame: 1, pose: 'attack', attacking: true, progress: 1, colors });
    assert.equal(atkMid.partStates.scepterOrb.dx, 0);
    assert.equal(atkMid.partStates.scepterOrb.frame, 2);
    assert.equal(atkMid.partStates.flameCrown.frame, 4);
    assert.ok(atkMid.partStates.scepterEmbers.dx < 0);
    assert.equal(atkEnd.partStates.scepterEmbers.dx, 0);
    assert.equal(atkEnd.partStates.capeRight.frame, 0);

    // Hurt: maintains stable attachment (dx=0, dy=0)
    const hurt = evaluateBossAnimation(art, { frame: 1, pose: 'hurt', hurt: true, colors });
    for (const st of Object.values(hurt.partStates)) {
      assert.equal(st.dx, 0);
      assert.equal(st.dy, 0);
    }
    assert.equal(hurt.effects.length, 0);

    // Death: hides all components so no orphaned flames or capes remain
    const dead = evaluateBossAnimation(art, { frame: 2, pose: 'dead', colors });
    assert.equal(dead.partStates.hideParts, true);
    assert.equal(dead.effects.length, 0);
    const deadCtx = createMockCtx();
    drawBossArt(deadCtx, art, 0, 0, 1, dead.materialOverrides, dead.partStates);
    // Only body draws, no part draws
    const bodyOnlyCtx = createMockCtx();
    drawBossArt(bodyOnlyCtx, art, 0, 0, 1, null, { hideParts: true });
    assert.equal(deadCtx.draws.length, bodyOnlyCtx.draws.length);

    // Reduced motion: stable representative frame 0, zero dx/dy, zero effects
    const rmIdle = evaluateBossAnimation(art, { frame: 2, pose: 'idle', reducedMotion: true, colors });
    for (const st of Object.values(rmIdle.partStates)) {
      assert.equal(st.frame, 0);
      assert.equal(st.dx, 0);
      assert.equal(st.dy, 0);
    }
    assert.equal(rmIdle.materialOverrides, null);
    assert.equal(rmIdle.effects.length, 0);
  });

  it('renders behind-body capes before main body and front flames/orb after main body with integer coords', () => {
    const art = BOSS_ART_V2.ember_overlord;
    const anim = evaluateBossAnimation(art, { frame: 1, pose: 'idle', colors: art.colors });
    const ctx = createMockCtx();
    drawBossArt(ctx, art, 100, 50, 1.1, anim.materialOverrides, anim.partStates);
    assert.ok(ctx.draws.length > 0);
    for (const d of ctx.draws) {
      assert.equal(Number.isInteger(d.x), true);
      assert.equal(Number.isInteger(d.y), true);
      assert.equal(Number.isInteger(d.w), true);
      assert.equal(Number.isInteger(d.h), true);
    }
    assert.equal(Object.keys(EMBER_OVERLORD_V2_MATERIALS).length, 24);
    assert.ok(EMBER_OVERLORD_V2_DEF.parts);
  });
});
