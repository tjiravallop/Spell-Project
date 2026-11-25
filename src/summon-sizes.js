/**
 * Centralized species-specific visual size configuration (Size System V2).
 * Normal and Grand scales are independently configured and kept separate from
 * elemental palettes and combat statistics.
 */

export const SUMMON_SIZE_V2 = Object.freeze({
  // XS — Tiny (Normal ~12–18 px, Grand ~32–48 px)
  rat: {
    sizeClass: 'XS', normalScale: 0.75, grandScale: 2.0,  normalOffset: { x: 0, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.58, grandScale: 1.54 },
  },
  bat: {
    sizeClass: 'XS', normalScale: 0.75, grandScale: 2.0,  normalOffset: { x: 0, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.60, grandScale: 1.55 },
  },
  hornet: {
    sizeClass: 'XS', normalScale: 0.72, grandScale: 1.8,  normalOffset: { x: 0, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.60, grandScale: 1.57 },
  },

  // S — Small (Normal ~18–26 px, Grand ~48–64 px)
  cat: {
    sizeClass: 'S',  normalScale: 0.85, grandScale: 2.2,  normalOffset: { x: 0, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.77, grandScale: 1.93 },
  },
  bird: {
    sizeClass: 'S',  normalScale: 1.0,  grandScale: 2.75, normalOffset: { x: 0, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.79, grandScale: 1.90 },
  },
  frog: {
    sizeClass: 'S',  normalScale: 0.9,  grandScale: 2.4,  normalOffset: { x: 0, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.85, grandScale: 2.07 },
  },
  slime: {
    sizeClass: 'S',  normalScale: 1.0,  grandScale: 2.5,  normalOffset: { x: 0, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.95, grandScale: 2.36 },
  },
  sprite: {
    sizeClass: 'S',  normalScale: 0.95, grandScale: 2.3,  normalOffset: { x: 0, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.72, grandScale: 1.81 },
  },

  // M — Medium (Normal ~26–35 px, Grand ~64–80 px)
  dog: {
    sizeClass: 'M',  normalScale: 1.15, grandScale: 2.8,  normalOffset: { x: 0, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 1.00, grandScale: 2.41 },
  },
  wolf: {
    sizeClass: 'M',  normalScale: 1.1,  grandScale: 2.65, normalOffset: { x: 2, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.86, grandScale: 2.06 },
  },
  snake: {
    sizeClass: 'M',  normalScale: 1.15, grandScale: 2.75, normalOffset: { x: 0, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 1.00, grandScale: 2.37 },
  },
  turtle: {
    sizeClass: 'M',  normalScale: 1.25, grandScale: 3.0,  normalOffset: { x: 2, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.94, grandScale: 2.16 },
  },
  spider: {
    sizeClass: 'M',  normalScale: 1.3,  grandScale: 3.0,  normalOffset: { x: 2, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.94, grandScale: 2.25 },
  },

  // L — Large (Normal ~35–45 px, Grand ~80–96 px)
  lion: {
    sizeClass: 'L',  normalScale: 1.35, grandScale: 3.0,  normalOffset: { x: 4, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 1.00, grandScale: 2.20 },
  },
  bear: {
    sizeClass: 'L',  normalScale: 1.3,  grandScale: 2.85, normalOffset: { x: 4, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 1.02, grandScale: 2.25 },
  },
  boar: {
    sizeClass: 'L',  normalScale: 1.45, grandScale: 3.2,  normalOffset: { x: 4, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 1.15, grandScale: 2.58 },
  },
  croc: {
    sizeClass: 'L',  normalScale: 1.35, grandScale: 3.0,  normalOffset: { x: 4, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 1.16, grandScale: 2.08 },
  },
  eagle: {
    sizeClass: 'L',  normalScale: 1.3,  grandScale: 2.9,  normalOffset: { x: 4, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 1.08, grandScale: 2.22 },
  },
  skeleton: {
    sizeClass: 'L',  normalScale: 1.2,  grandScale: 2.7,  normalOffset: { x: 0, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.93, grandScale: 1.93 },
  },
  siren:    {
    sizeClass: 'L',  normalScale: 1.25, grandScale: 2.75, normalOffset: { x: 2, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.91, grandScale: 1.90 },
  },

  // XL — Massive (Normal ~45–52 px, Grand ~96–115 px)
  dragon:   { sizeClass: 'XL', normalScale: 1.5,  grandScale: 3.0,  normalOffset: { x: 6, baseline: 0 }, grandOffset: { x: 0, baseline: 0 } },
  phoenix:  {
    sizeClass: 'XL', normalScale: 1.35, grandScale: 2.9,
    normalOffset: { x: 4, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 1.1, grandScale: 2.3 },
  },
  golem:    {
    sizeClass: 'XL', normalScale: 1.45, grandScale: 3.15, normalOffset: { x: 4, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.91, grandScale: 1.94, grandOffset: { x: 4, baseline: 0 } },
  },
  gargoyle: {
    sizeClass: 'XL', normalScale: 1.5, grandScale: 3.2,
    normalOffset: { x: 6, baseline: 0 }, grandOffset: { x: 0, baseline: 0 },
    templateV2: { normalScale: 0.9, grandScale: 1.96, grandOffset: { x: 10, baseline: 0 } },
  },

  // XXL — Colossal (Normal ~52–58 px, Grand ~130–140 px)
  hydra:    {
    sizeClass: 'XXL', normalScale: 1.6, grandScale: 3.9,
    normalOffset: { x: 6, baseline: 0 }, grandOffset: { x: -2, baseline: 2 },
    templateV2: { normalScale: 0.88, grandScale: 2.06, grandOffset: { x: 16, baseline: 2 } },
  },
  kraken:   {
    sizeClass: 'XXL', normalScale: 1.65, grandScale: 3.95,
    normalOffset: { x: 6, baseline: 0 }, grandOffset: { x: 0, baseline: 2 },
    templateV2: { normalScale: 0.86, grandScale: 2.03, grandOffset: { x: 24, baseline: 2 } },
  },
  behemoth: {
    sizeClass: 'XXL', normalScale: 1.65, grandScale: 3.95,
    normalOffset: { x: 6, baseline: 0 }, grandOffset: { x: 1, baseline: 2 },
    templateV2: { normalScale: 0.88, grandScale: 2.03, grandOffset: { x: 26, baseline: 2 } },
  },
});

export function getOpaqueBounds(art) {
  if (!art?.pixels) return { minX: 0, minY: 0, maxX: (art?.width ?? 1) - 1, maxY: (art?.height ?? 1) - 1, width: art?.width ?? 0, height: art?.height ?? 0 };
  let minX = art.width, minY = art.height, maxX = -1, maxY = -1;
  for (let y = 0; y < art.height; y++) {
    for (let x = 0; x < art.width; x++) {
      if (art.pixels[y][x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function resolveSizeSpec(creatureId, options = {}) {
  if (!options.sizeV2) return null;
  const size = SUMMON_SIZE_V2[creatureId];
  return size?.templateV2 && options[`${creatureId}V2`] ? { ...size, ...size.templateV2 } : size;
}

export function resolveCreatureScale(creatureId, isGrand, art, options) {
  const spec = resolveSizeSpec(creatureId, options);
  if (spec) return isGrand ? spec.grandScale : spec.normalScale;
  return isGrand ? (art?.grandScale ?? 1) : 1;
}

export function resolveCreatureOffset(creatureId, isGrand, options) {
  const spec = resolveSizeSpec(creatureId, options);
  if (!spec) return { x: 0, baseline: 0 };
  return isGrand ? (spec.grandOffset ?? { x: 0, baseline: 0 }) : (spec.normalOffset ?? { x: 0, baseline: 0 });
}
