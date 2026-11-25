import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSS_ART_V2,
  createBossArt,
  detectBossComponentOverflow,
  drawBossArt,
  evaluateBossAnimation,
} from '../src/boss-art-v2.js';
import { getBossAnimatedEnvelope, getBossVisualBounds, resolveBossScale } from '../src/boss-sizes.js';

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

const TEST_MATERIALS = Object.freeze({
  b: ['body', '#444444'],
  w: ['wing', '#22aaee'],
  f: ['flame', '#ff6600'],
  g: ['glow', '#ffff88'],
});

describe('Boss V2 Shared Multi-Component Animation Framework (Phase B0.1)', () => {
  it('supports legacy single-grid boss definitions without parts or animate', () => {
    const art = createBossArt({
      grid: ['..b..', '.bbb.', '..b..'],
      materials: TEST_MATERIALS,
    }, 'legacy_test');

    assert.equal(art.width, 5);
    assert.equal(art.height, 3);
    assert.equal(art.parts, null);
    assert.equal(art.animate, null);
    assert.deepEqual(evaluateBossAnimation(art, { frame: 1 }), {
      materialOverrides: null,
      partStates: null,
      effects: [],
    });

    const ctx = createMockCtx();
    drawBossArt(ctx, art, 10, 20, 2);
    assert.ok(ctx.draws.length > 0);
    for (const d of ctx.draws) {
      assert.equal(Number.isInteger(d.x), true);
      assert.equal(Number.isInteger(d.y), true);
    }
  });

  it('validates component frames and rejects mismatched widths or unknown material keys', () => {
    assert.throws(() => createBossArt({
      grid: ['bb', 'bb'],
      materials: TEST_MATERIALS,
      parts: {
        badWidth: { anchor: { x: 0, y: 0 }, frames: [['ww', 'w']] },
      },
    }, 'bad_width'), /Invalid row width/);

    assert.throws(() => createBossArt({
      grid: ['bb', 'bb'],
      materials: TEST_MATERIALS,
      parts: {
        badKey: { anchor: { x: 0, y: 0 }, frames: [['wx', 'ww']] },
      },
    }, 'bad_key'), /Unknown material key/);
  });

  it('renders behind-body before main body and front-body after main body with joint-aligned pixel-snapped frames', () => {
    const def = {
      grid: [
        '......',
        '..bb..',
        '..bb..',
        '......',
      ],
      materials: TEST_MATERIALS,
      parts: {
        rearWing: {
          anchor: { x: 2, y: 1 },
          joint: { x: 1, y: 1 },
          z: 'behind',
          frames: [
            ['ww.', '.w.', '...'],
            ['.ww', '.w.', '...'],
          ],
        },
        frontFlame: {
          anchor: { x: 2, y: 0 },
          z: 'front',
          grid: ['ff'],
        },
      },
      animate({ frame, reducedMotion }) {
        return {
          partStates: {
            rearWing: { frame: reducedMotion ? 0 : frame % 2, dx: 0, dy: 0 },
            frontFlame: { dx: reducedMotion ? 0 : 1, dy: reducedMotion ? 0 : -1, overrides: { flame: '#ffffff' } },
          },
        };
      },
    };

    const art = createBossArt(def, 'synthetic_layered');
    assert.equal(art.parts.rearWing.frames.length, 2);
    assert.equal(art.parts.rearWing.z, 'behind');
    assert.equal(art.parts.frontFlame.z, 'front');
    // Combined bounds include frontFlame at y=0 and rearWing at x=1
    assert.equal(art.opaqueBounds.minY, 0);
    assert.equal(art.opaqueBounds.minX, 1);

    const ctx = createMockCtx();
    const anim = evaluateBossAnimation(art, { frame: 1, reducedMotion: false });
    drawBossArt(ctx, art, 100, 50, 2, anim.materialOverrides, anim.partStates);

    const order = ctx.draws.map(d => d.color);
    const wingIdx = order.indexOf('#22aaee');
    const bodyIdx = order.indexOf('#444444');
    const flameIdx = order.indexOf('#ffffff');
    assert.ok(wingIdx >= 0 && bodyIdx > wingIdx && flameIdx > bodyIdx, `Expected behind -> body -> front order, got ${order}`);

    // Joint-aligned rearWing frame 1: anchor(2,1) - joint(1,1) => (1,0), row 0 col 1..2 => left + 1*2 + 1*2 = 104
    assert.equal(ctx.draws[wingIdx].x, 104);
    assert.equal(ctx.draws[wingIdx].y, 50);
    // frontFlame translated dx=1, dy=-1 from (100 + 2*2, 50 + 0) => (105, 49)
    assert.equal(ctx.draws[flameIdx].x, 105);
    assert.equal(ctx.draws[flameIdx].y, 49);
  });

  it('supports component visibility, hideParts, and keeps animations isolated across bosses', () => {
    const art = createBossArt({
      grid: ['bb', 'bb'],
      materials: TEST_MATERIALS,
      parts: {
        orb: { anchor: { x: 0, y: 0 }, z: 'front', grid: ['gg'] },
      },
    }, 'vis_test');

    const ctxHidden = createMockCtx();
    drawBossArt(ctxHidden, art, 0, 0, 1, null, { orb: { visible: false } });
    assert.equal(ctxHidden.draws.some(d => d.color === '#ffff88'), false);

    const ctxNoParts = createMockCtx();
    drawBossArt(ctxNoParts, art, 0, 0, 1, null, { hideParts: true });
    assert.equal(ctxNoParts.draws.some(d => d.color === '#ffff88'), false);

    // Migrated bosses preserve independent animation outputs and respect reducedMotion
    const emberRm = evaluateBossAnimation(BOSS_ART_V2.ember_overlord, { frame: 1, attacking: false, reducedMotion: true, colors: BOSS_ART_V2.ember_overlord.colors });
    assert.equal(emberRm.materialOverrides, null);

    const tempestLive = evaluateBossAnimation(BOSS_ART_V2.tempest_archon, { frame: 1, attacking: false, charging: false, reducedMotion: false, now: 100, colors: BOSS_ART_V2.tempest_archon.colors });
    assert.ok(tempestLive.effects.some(e => e.type === 'groundShadow'));
    assert.ok(tempestLive.effects.some(e => e.type === 'anchorBolt'));

    const crownRm = evaluateBossAnimation(BOSS_ART_V2.crown_archivist, { frame: 2, attacking: false, charging: true, reducedMotion: true, colors: BOSS_ART_V2.crown_archivist.colors });
    assert.equal(crownRm.partStates.leftGrimoire.dx, 0);
    assert.equal(crownRm.partStates.leftGrimoire.dy, 0);
    assert.equal(crownRm.partStates.rightGrimoire.dx, 0);
    assert.equal(crownRm.partStates.rightGrimoire.dy, 0);
    assert.equal(crownRm.effects.length, 0);
  });

  it('distinguishes neutral assembly, body-only, and animated envelope bounds and detects overflow without rescaling', () => {
    const art = createBossArt({
      grid: [
        '......',
        '..bb..',
        '..bb..',
        '..bb..',
        '......',
      ],
      materials: TEST_MATERIALS,
      parts: {
        wing: {
          anchor: { x: 2, y: 1 },
          joint: { x: 2, y: 1 },
          z: 'behind',
          frames: [
            ['...', 'ww.', '...'],
            ['ww.', 'ww.', 'ww.'],
          ],
        },
        crest: {
          anchor: { x: 2, y: 0 },
          z: 'front',
          frames: [
            ['ff'],
            ['gg'],
          ],
        },
      },
      animate({ frame }) {
        return {
          partStates: {
            wing: { frame: frame % 2, dx: frame === 1 ? -1 : 0, dy: 0 },
            crest: { frame: frame % 2, dx: 0, dy: frame === 1 ? -2 : 0 },
          },
        };
      },
    }, 'bounds_test');

    // Body-only is 2x3 (x=2..3, y=1..3); frame-0 neutral assembly adds wing at x=0..1 and crest at y=0 => 4x4
    assert.equal(art.bodyBounds.width, 2);
    assert.equal(art.bodyBounds.height, 3);
    assert.equal(art.neutralBounds.width, 4);
    assert.equal(art.neutralBounds.height, 4);
    assert.equal(art.opaqueBounds, art.neutralBounds);

    // Scale is computed from neutralBounds (height 4), NOT bodyBounds (height 3) or frame 1
    const scale = resolveBossScale('ember_overlord', art);
    assert.equal(scale, 88 / 4);

    // Animated overflow is detected explicitly without clamping or rescaling
    const overflow = detectBossComponentOverflow(art, [{ frame: 0 }, { frame: 1 }]);
    assert.equal(overflow.hasOverflow, true);
    assert.ok(overflow.entries.some(e => e.part === 'wing' && e.minX < 0));
    assert.ok(overflow.entries.some(e => e.part === 'crest' && e.minY < 0));

    const env = getBossAnimatedEnvelope('ember_overlord', 235, 146, 0, art, { v2: true }, [
      evaluateBossAnimation(art, { frame: 1 }).partStates,
    ]);
    const metrics = getBossVisualBounds('ember_overlord', 235, 146, 0, art, { v2: true });
    assert.ok(env.minY < metrics.top);
    assert.ok(env.minX < metrics.left);
  });
});
