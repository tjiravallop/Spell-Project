import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_ART_V2, resolveBossArt } from '../src/boss-art-v2.js';
import {
  BOSS_SIZE_TIERS,
  BOSS_SIZE_V2,
  getBossVisualBounds,
  getOpaqueBounds,
  resolveBossLayer,
  resolveBossOffset,
  resolveBossScale,
} from '../src/boss-sizes.js';
import { EMBER_OVERLORD_V2_GRID, EMBER_OVERLORD_V2_MATERIALS } from '../src/boss-art/ember-overlord-v2.js';
import { TEMPEST_ARCHON_V2_GRID, TEMPEST_ARCHON_V2_MATERIALS } from '../src/boss-art/tempest-archon-v2.js';
import {
  CROWN_ARCHIVIST_V2_GRID,
  CROWN_ARCHIVIST_V2_LEFT_GRIMOIRE,
  CROWN_ARCHIVIST_V2_MATERIALS,
  CROWN_ARCHIVIST_V2_RIGHT_GRIMOIRE,
} from '../src/boss-art/crown-archivist-v2.js';
import { Battlefield } from '../src/render.js';
import { FLOOR30_BOSS_ROOM } from '../src/run.js';

describe('Major Boss V2 — Ember Overlord (Phase B1.1)', () => {
  it('has a valid 92x80 indexed pixel grid and 24-color material mapping', () => {
    assert.equal(EMBER_OVERLORD_V2_GRID.length, 80);
    const width = EMBER_OVERLORD_V2_GRID[0].length;
    assert.equal(width, 92);
    assert.equal(Object.keys(EMBER_OVERLORD_V2_MATERIALS).length, 24);
    for (const row of EMBER_OVERLORD_V2_GRID) {
      assert.equal(row.length, width);
      for (const ch of row) {
        assert.ok(ch === '.' || Object.hasOwn(EMBER_OVERLORD_V2_MATERIALS, ch), `Unknown material key: ${ch}`);
      }
    }
    const art = BOSS_ART_V2.ember_overlord;
    assert.equal(art.width, 92);
    assert.equal(art.height, 80);
    // Combined neutral bounds remain 92x80 while body-only bounds exclude separated components
    assert.equal(art.opaqueBounds.width, 92);
    assert.equal(art.opaqueBounds.height, 80);
    assert.ok(art.bodyBounds.width <= art.opaqueBounds.width);
    assert.ok(art.bodyBounds.height <= art.opaqueBounds.height);
  });

  it('resolves Boss V2 only when bossArt=v2 is enabled and only for implemented bosses', () => {
    assert.equal(resolveBossArt('ember_overlord', null), null);
    assert.equal(resolveBossArt('tempest_archon', { v2: false }), null);
    assert.ok(resolveBossArt('ember_overlord', { v2: true }));
    assert.ok(resolveBossArt('tempest_archon', { v2: true }));
    assert.ok(resolveBossArt('crown_archivist', { v2: true }));
    assert.ok(resolveBossArt('mirror_regent', { v2: true }));
    assert.equal(resolveBossArt('seal_curator', { v2: true }), null);
  });

  it('has a valid 119x92 indexed pixel grid and 24-color material mapping for Tempest Archon', () => {
    assert.equal(TEMPEST_ARCHON_V2_GRID.length, 92);
    const width = TEMPEST_ARCHON_V2_GRID[0].length;
    assert.equal(width, 119);
    assert.equal(Object.keys(TEMPEST_ARCHON_V2_MATERIALS).length, 24);
    for (const row of TEMPEST_ARCHON_V2_GRID) {
      assert.equal(row.length, width);
      for (const ch of row) {
        assert.ok(ch === '.' || Object.hasOwn(TEMPEST_ARCHON_V2_MATERIALS, ch), `Unknown material key: ${ch}`);
      }
    }
    const art = BOSS_ART_V2.tempest_archon;
    const bounds = art.opaqueBounds;
    assert.equal(bounds.width, 119);
    assert.equal(bounds.height, 86);
    assert.equal(art.bodyBounds.width, 78);
    assert.equal(art.bodyBounds.height, 80);

    assert.equal(BOSS_SIZE_V2.tempest_archon.defaultTier, 'large');
    assert.equal(BOSS_SIZE_V2.tempest_archon.defaultHeight, 96);
    assert.equal(BOSS_SIZE_V2.tempest_archon.offset.baseline, -8);
    for (const [tier, targetH] of Object.entries(BOSS_SIZE_V2.tempest_archon.tiers)) {
      const scale = resolveBossScale('tempest_archon', art, { sizeTier: tier });
      assert.ok(Math.abs(bounds.height * scale - targetH) < 1e-6);
    }
    const metrics = getBossVisualBounds('tempest_archon', 235, 146, 0, art, { v2: true });
    assert.equal(metrics.height, 96);
    assert.equal(metrics.bottom, 138);
    assert.ok(metrics.ward.width < metrics.width);

    const bobUp = getBossVisualBounds('tempest_archon', 235, 146, -1, art, { v2: true });
    const bobDown = getBossVisualBounds('tempest_archon', 235, 146, 1, art, { v2: true });
    assert.equal(bobUp.ward.top, metrics.ward.top - 1);
    assert.equal(bobDown.ward.top, metrics.ward.top + 1);
    assert.equal(bobUp.bottom, metrics.bottom - 1);
    assert.equal(bobDown.bottom, metrics.bottom + 1);
  });

  it('locks 88px (1.10x) as the default Ember Overlord V2 size and computes uniform scales', () => {
    const art = BOSS_ART_V2.ember_overlord;
    assert.equal(BOSS_SIZE_V2.ember_overlord.defaultTier, 'large');
    assert.equal(BOSS_SIZE_V2.ember_overlord.defaultHeight, 88);
    assert.ok(Math.abs(resolveBossScale('ember_overlord', art) - 1.1) < 1e-6);

    const bounds = art.opaqueBounds;
    for (const [tier, targetH] of Object.entries(BOSS_SIZE_TIERS)) {
      const scale = resolveBossScale('ember_overlord', art, { sizeTier: tier });
      assert.ok(Math.abs(bounds.height * scale - targetH) < 1e-6);
    }
    assert.deepEqual(resolveBossOffset('ember_overlord'), BOSS_SIZE_V2.ember_overlord.offset);
    assert.equal(resolveBossLayer('ember_overlord'), 'foreground');
    assert.equal(resolveBossLayer('ember_overlord', { layer: 'rear' }), 'rear');
  });

  it('computes tight body-aware Ward bounds and semantic anchors inside rendered sprite bounds', () => {
    const art = BOSS_ART_V2.ember_overlord;
    const metrics = getBossVisualBounds('ember_overlord', 235, 146, 0, art, { v2: true });
    assert.equal(metrics.height, 88);
    assert.equal(metrics.bottom, 146);
    assert.ok(metrics.ward.width < metrics.width);
    assert.ok(metrics.ward.left >= metrics.left);
    assert.ok(metrics.ward.right <= metrics.right);
    assert.ok(metrics.head.y < metrics.chest.y);
    assert.ok(metrics.chest.y < metrics.ground.y);
    assert.ok(metrics.weapon.x < metrics.chest.x);
  });

  it('has a valid 98x104 3-component indexed grid, 32-color palette, and rear-layer Floor 30 placement for Crown Archivist', () => {
    assert.equal(CROWN_ARCHIVIST_V2_GRID.length, 104);
    assert.equal(CROWN_ARCHIVIST_V2_GRID[0].length, 98);
    assert.equal(Object.keys(CROWN_ARCHIVIST_V2_MATERIALS).length, 32);

    const art = BOSS_ART_V2.crown_archivist;
    assert.ok(art.parts?.leftGrimoire);
    assert.ok(art.parts?.rightGrimoire);

    // Verify detached grimoires have zero pixel overlap with main body grid
    for (const part of [CROWN_ARCHIVIST_V2_LEFT_GRIMOIRE, CROWN_ARCHIVIST_V2_RIGHT_GRIMOIRE]) {
      for (let py = 0; py < part.grid.length; py++) {
        for (let px = 0; px < part.grid[py].length; px++) {
          if (part.grid[py][px] !== '.') {
            assert.equal(CROWN_ARCHIVIST_V2_GRID[part.anchor.y + py][part.anchor.x + px], '.');
          }
        }
      }
    }

    assert.equal(art.opaqueBounds.width, 98);
    assert.equal(art.opaqueBounds.height, 104);
    assert.equal(BOSS_SIZE_V2.crown_archivist.defaultTier, 'large');
    assert.equal(BOSS_SIZE_V2.crown_archivist.defaultHeight, 104);
    assert.equal(resolveBossLayer('crown_archivist'), 'rear');

    for (const [tier, targetH] of Object.entries(BOSS_SIZE_V2.crown_archivist.tiers)) {
      const scale = resolveBossScale('crown_archivist', art, { sizeTier: tier });
      assert.ok(Math.abs(art.opaqueBounds.height * scale - targetH) < 1e-6);
    }

    const metrics = getBossVisualBounds('crown_archivist', 244, 146, 0, art, { v2: true });
    assert.equal(metrics.height, 104);
    assert.equal(metrics.bottom, 146);
    assert.ok(metrics.ward.width < metrics.width);
    assert.ok(metrics.weapon.x < metrics.chest.x);
    assert.ok(metrics.rightBook.x > metrics.chest.x);

    const rearEnemies = [{ kind: 'crown_archivist', slot: 0 }, { kind: 'rune_ram', slot: 1 }, { kind: 'ward_scribe', slot: 2 }];
    const mockV2 = { state: { room: FLOOR30_BOSS_ROOM, enemies: rearEnemies }, bossVisuals: { v2: true } };
    const mockV1 = { state: { room: FLOOR30_BOSS_ROOM, enemies: rearEnemies }, bossVisuals: { v2: false } };
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, rearEnemies[0]), 230);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, rearEnemies[1]), 195);
    assert.equal(Battlefield.prototype.enemyX.call(mockV2, rearEnemies[2]), 260);
    assert.equal(Battlefield.prototype.enemyX.call(mockV1, rearEnemies[0]), 126);
  });
});
