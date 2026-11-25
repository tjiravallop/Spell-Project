import { getOpaqueBounds } from './summon-sizes.js';

export { getOpaqueBounds };

export const BOSS_SIZE_TIERS = Object.freeze({
  standard: 76,
  large: 88,
  grand: 96,
});

export const BOSS_SIZE_V2 = Object.freeze({
  ember_overlord: {
    defaultTier: 'large',
    defaultHeight: BOSS_SIZE_TIERS.large,
    tiers: BOSS_SIZE_TIERS,
    offset: { x: 0, baseline: 0 },
    layer: 'foreground',
    // Primary armored body & helmet bounds inside 92x80 grid (excludes extended scepter flame & far cape tip)
    bodyBox: { minX: 28, maxX: 68, minY: 14, maxY: 79 },
    anchors: {
      head: { x: 47, y: 24 },
      chest: { x: 47, y: 40 },
      weapon: { x: 14, y: 24 },
      bodyCenter: { x: 47, y: 46 },
    },
  },
  tempest_archon: {
    defaultTier: 'large',
    defaultHeight: 96,
    tiers: Object.freeze({ standard: 88, large: 96, grand: 104 }),
    offset: { x: 0, baseline: -8 },
    layer: 'foreground',
    // Primary armored body, helmet & robes inside 119x92 grid (excludes wide wingspan & scepter)
    bodyBox: { minX: 40, maxX: 78, minY: 12, maxY: 84 },
    anchors: {
      head: { x: 58, y: 20 },
      chest: { x: 58, y: 36 },
      weapon: { x: 18, y: 18 },
      bodyCenter: { x: 58, y: 46 },
    },
  },
  crown_archivist: {
    defaultTier: 'large',
    defaultHeight: 104,
    tiers: Object.freeze({ standard: 96, large: 104, grand: 112 }),
    offset: { x: 0, baseline: 0 },
    layer: 'rear',
    // Primary archmage body, crown, torso, held grimoire & robes inside 98x104 grid (excludes detached floating grimoires)
    bodyBox: { minX: 25, maxX: 73, minY: 6, maxY: 103 },
    anchors: {
      head: { x: 48, y: 20 },
      chest: { x: 47, y: 40 },
      weapon: { x: 19, y: 17 },
      rightBook: { x: 87, y: 23 },
      bodyCenter: { x: 48, y: 52 },
    },
  },
  mirror_regent: {
    defaultTier: 'large',
    defaultHeight: 112,
    tiers: Object.freeze({ standard: 104, large: 112, grand: 120 }),
    offset: { x: 0, baseline: -6 },
    layer: 'rear',
    // Primary frost monarch body, crown & torso inside 120x108 grid (excludes mirror staff orb & detached shards)
    bodyBox: { minX: 33, maxX: 88, minY: 10, maxY: 107 },
    anchors: {
      head: { x: 60, y: 28 },
      chest: { x: 60, y: 48 },
      weapon: { x: 24, y: 28 },
      bodyCenter: { x: 60, y: 56 },
    },
  },
  loom_sovereign: {
    defaultTier: 'large',
    defaultHeight: 120,
    tiers: Object.freeze({ standard: 112, large: 120, grand: 128 }),
    offset: { x: 0, baseline: -6 },
    layer: 'rear',
    // Primary circular loom frame, void eye & central tapestry inside 154x116 grid
    bodyBox: { minX: 44, maxX: 110, minY: 14, maxY: 108 },
    anchors: {
      head: { x: 77, y: 38 },
      eye: { x: 77, y: 38 },
      chest: { x: 77, y: 48 },
      weapon: { x: 26, y: 31 },
      leftSpool: { x: 26, y: 31 },
      rightSpool: { x: 128, y: 31 },
      leftOrnament: { x: 31, y: 13 },
      rightOrnament: { x: 122, y: 13 },
      tapestry: { x: 77, y: 82 },
      bodyCenter: { x: 77, y: 58 },
    },
  },
  volcano_colossus: {
    defaultTier: 'large',
    defaultHeight: 104,
    tiers: Object.freeze({ standard: 96, large: 104, grand: 112 }),
    offset: { x: 0, baseline: 0 },
    layer: 'rear',
    // Primary volcanic carapace & torso inside 163x104 grid (excludes far snout/tail/smoke)
    bodyBox: { minX: 28, maxX: 138, minY: 22, maxY: 103 },
    anchors: {
      head: { x: 24, y: 40 },
      jaw: { x: 18, y: 58 },
      eye: { x: 24, y: 38 },
      chest: { x: 64, y: 62 },
      weapon: { x: 18, y: 58 },
      craterA: { x: 84, y: 24 },
      craterB: { x: 108, y: 30 },
      craterC: { x: 130, y: 40 },
      frontFoot: { x: 70, y: 100 },
      rearFoot: { x: 130, y: 98 },
      bodyCenter: { x: 82, y: 64 },
    },
  },
  thunder_drake_emperor: {
    defaultTier: 'grand',
    defaultHeight: 120,
    tiers: Object.freeze({ standard: 104, large: 112, grand: 120, extended: 128 }),
    offset: { x: 0, baseline: -8 },
    layer: 'rear',
    // Primary serpentine body & head inside 158x124 grid (excludes detached twin thunder orbs & far tail tips)
    bodyBox: { minX: 22, maxX: 138, minY: 12, maxY: 114 },
    anchors: {
      head: { x: 32, y: 34 },
      jaw: { x: 24, y: 50 },
      eye: { x: 35, y: 34 },
      leftHorn: { x: 48, y: 12 },
      rightHorn: { x: 64, y: 14 },
      neck: { x: 64, y: 46 },
      chest: { x: 66, y: 68 },
      weapon: { x: 22, y: 48 },
      tailRoot: { x: 118, y: 90 },
      tailTip: { x: 56, y: 116 },
      leftThunderOrb: { x: 10, y: 66 },
      rightThunderOrb: { x: 145, y: 26 },
      bodyCenter: { x: 76, y: 64 },
    },
  },
});

export function resolveBossTargetHeight(kind, { sizeTier = null, customHeight = null } = {}) {
  if (Number.isFinite(customHeight) && customHeight > 0) return customHeight;
  const spec = BOSS_SIZE_V2[kind];
  if (sizeTier) {
    if (spec?.tiers && Object.hasOwn(spec.tiers, sizeTier)) return spec.tiers[sizeTier];
    if (Object.hasOwn(BOSS_SIZE_TIERS, sizeTier)) return BOSS_SIZE_TIERS[sizeTier];
  }
  return spec?.defaultHeight ?? BOSS_SIZE_TIERS.large;
}

export function resolveBossBounds(art) {
  return art?.neutralBounds ?? art?.opaqueBounds ?? getOpaqueBounds(art);
}

export function resolveBossScale(kind, art, options = {}) {
  const bounds = resolveBossBounds(art);
  const opaqueHeight = Math.max(1, bounds.height || art?.height || 1);
  const targetHeight = resolveBossTargetHeight(kind, options);
  return targetHeight / opaqueHeight;
}

export function resolveBossOffset(kind, { offsetX = 0, offsetY = 0 } = {}) {
  const base = BOSS_SIZE_V2[kind]?.offset ?? { x: 0, baseline: 0 };
  return {
    x: base.x + (Number.isFinite(offsetX) ? offsetX : 0),
    baseline: base.baseline + (Number.isFinite(offsetY) ? offsetY : 0),
  };
}

export function resolveBossLayer(kind, bossVisuals = null) {
  if (bossVisuals?.layer === 'rear' || bossVisuals?.layer === 'foreground') {
    return bossVisuals.layer;
  }
  return BOSS_SIZE_V2[kind]?.layer ?? 'foreground';
}

export function getBossVisualBounds(kind, x, baseline, bob, art, bossVisuals = null) {
  const bounds = resolveBossBounds(art);
  const bodyBounds = art?.bodyBounds ?? getOpaqueBounds(art);
  const scale = resolveBossScale(kind, art, bossVisuals ?? {});
  const offset = resolveBossOffset(kind, bossVisuals ?? {});
  const centerX = (bounds.minX + bounds.maxX + 1) / 2;
  const left = Math.round(x + offset.x - centerX * scale);
  const top = Math.round(baseline + bob + offset.baseline - (bounds.maxY + 1) * scale);
  const width = Math.round(bounds.width * scale);
  const height = Math.round(bounds.height * scale);

  const spec = BOSS_SIZE_V2[kind];
  const box = spec?.bodyBox ?? bodyBounds;
  const wardLeft = Math.round(left + box.minX * scale);
  const wardRight = Math.round(left + (box.maxX + 1) * scale);
  const wardTop = Math.round(top + box.minY * scale);
  const wardBottom = Math.round(top + (box.maxY + 1) * scale);
  const wardWidth = Math.max(24, wardRight - wardLeft);
  const wardCenterX = Math.round((wardLeft + wardRight) / 2);

  const mapAnchor = (pt, fallbackX, fallbackY) => ({
    x: Math.round(left + (pt?.x ?? fallbackX) * scale),
    y: Math.round(top + (pt?.y ?? fallbackY) * scale),
  });

  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    scale,
    ground: { x: wardCenterX, y: Math.round(baseline + offset.baseline) },
    head: mapAnchor(spec?.anchors?.head, centerX, bounds.minY + bounds.height * 0.22),
    chest: mapAnchor(spec?.anchors?.chest, centerX, bounds.minY + bounds.height * 0.45),
    weapon: mapAnchor(spec?.anchors?.weapon, bounds.minX + bounds.width * 0.2, bounds.minY + bounds.height * 0.35),
    ...(spec?.anchors?.rightBook ? { rightBook: mapAnchor(spec.anchors.rightBook, bounds.maxX - bounds.width * 0.15, bounds.minY + bounds.height * 0.25) } : {}),
    ...(spec?.anchors?.eye ? { eye: mapAnchor(spec.anchors.eye, centerX, bounds.minY + bounds.height * 0.33) } : {}),
    ...(spec?.anchors?.leftSpool ? { leftSpool: mapAnchor(spec.anchors.leftSpool, bounds.minX + 26, bounds.minY + 31) } : {}),
    ...(spec?.anchors?.rightSpool ? { rightSpool: mapAnchor(spec.anchors.rightSpool, bounds.maxX - 26, bounds.minY + 31) } : {}),
    ...(spec?.anchors?.leftOrnament ? { leftOrnament: mapAnchor(spec.anchors.leftOrnament, bounds.minX + 31, bounds.minY + 13) } : {}),
    ...(spec?.anchors?.rightOrnament ? { rightOrnament: mapAnchor(spec.anchors.rightOrnament, bounds.maxX - 31, bounds.minY + 13) } : {}),
    ...(spec?.anchors?.tapestry ? { tapestry: mapAnchor(spec.anchors.tapestry, centerX, bounds.minY + 82) } : {}),
    ...(spec?.anchors?.jaw ? { jaw: mapAnchor(spec.anchors.jaw, bounds.minX + 18, bounds.minY + 58) } : {}),
    ...(spec?.anchors?.craterA ? { craterA: mapAnchor(spec.anchors.craterA, bounds.minX + 84, bounds.minY + 24) } : {}),
    ...(spec?.anchors?.craterB ? { craterB: mapAnchor(spec.anchors.craterB, bounds.minX + 108, bounds.minY + 30) } : {}),
    ...(spec?.anchors?.craterC ? { craterC: mapAnchor(spec.anchors.craterC, bounds.minX + 130, bounds.minY + 40) } : {}),
    ...(spec?.anchors?.frontFoot ? { frontFoot: mapAnchor(spec.anchors.frontFoot, bounds.minX + 70, bounds.maxY - 4) } : {}),
    ...(spec?.anchors?.rearFoot ? { rearFoot: mapAnchor(spec.anchors.rearFoot, bounds.maxX - 33, bounds.maxY - 6) } : {}),
    ...(spec?.anchors?.leftHorn ? { leftHorn: mapAnchor(spec.anchors.leftHorn, bounds.minX + 48, bounds.minY + 12) } : {}),
    ...(spec?.anchors?.rightHorn ? { rightHorn: mapAnchor(spec.anchors.rightHorn, bounds.minX + 64, bounds.minY + 14) } : {}),
    ...(spec?.anchors?.neck ? { neck: mapAnchor(spec.anchors.neck, bounds.minX + 64, bounds.minY + 46) } : {}),
    ...(spec?.anchors?.tailRoot ? { tailRoot: mapAnchor(spec.anchors.tailRoot, bounds.maxX - 40, bounds.maxY - 30) } : {}),
    ...(spec?.anchors?.tailTip ? { tailTip: mapAnchor(spec.anchors.tailTip, bounds.minX + 56, bounds.maxY - 8) } : {}),
    ...(spec?.anchors?.leftThunderOrb ? { leftThunderOrb: mapAnchor(spec.anchors.leftThunderOrb, bounds.minX + 10, bounds.minY + 66) } : {}),
    ...(spec?.anchors?.rightThunderOrb ? { rightThunderOrb: mapAnchor(spec.anchors.rightThunderOrb, bounds.maxX - 13, bounds.minY + 26) } : {}),
    bodyCenter: mapAnchor(spec?.anchors?.bodyCenter, centerX, bounds.minY + bounds.height * 0.55),
    ward: {
      left: wardLeft,
      top: wardTop,
      right: wardRight,
      bottom: wardBottom,
      width: wardWidth,
      centerX: wardCenterX,
    },
  };
}

export function getBossAnimatedEnvelope(kind, x, baseline, bob, art, bossVisuals = null, partStatesList = []) {
  const metrics = getBossVisualBounds(kind, x, baseline, bob, art, bossVisuals);
  const scale = metrics.scale;
  const env = art?.envelopeBounds ?? resolveBossBounds(art);
  let minX = Math.round(metrics.left + env.minX * scale);
  let maxX = Math.round(metrics.left + (env.maxX + 1) * scale);
  let minY = Math.round(metrics.top + env.minY * scale);
  let maxY = Math.round(metrics.top + (env.maxY + 1) * scale);
  if (art?.parts) {
    for (const partStates of partStatesList) {
      for (const [key, part] of Object.entries(art.parts)) {
        const ps = partStates?.[key];
        if (!ps || ps.visible === false) continue;
        const pLeft = Math.round(metrics.left + (part.anchor.x - part.joint.x) * scale) + Math.round(ps.dx ?? 0);
        const pTop = Math.round(metrics.top + (part.anchor.y - part.joint.y) * scale) + Math.round(ps.dy ?? 0);
        const frameCount = part.frames.length;
        const rawIdx = Number.isFinite(ps.frame) ? Math.floor(ps.frame) : 0;
        const fArt = part.frames[((rawIdx % frameCount) + frameCount) % frameCount];
        minX = Math.min(minX, pLeft + Math.round(fArt.opaqueBounds.minX * scale));
        maxX = Math.max(maxX, pLeft + Math.round((fArt.opaqueBounds.maxX + 1) * scale));
        minY = Math.min(minY, pTop + Math.round(fArt.opaqueBounds.minY * scale));
        maxY = Math.max(maxY, pTop + Math.round((fArt.opaqueBounds.maxY + 1) * scale));
      }
    }
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    clipsBattlefield: minX < 0 || minY < 0 || maxX > 320 || maxY > 180,
  };
}
