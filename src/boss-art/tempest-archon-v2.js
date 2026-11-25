import {
  TEMPEST_ARCHON_V2_BODY_GRID,
  TEMPEST_ARCHON_V2_HALO,
  TEMPEST_ARCHON_V2_LEFTWING,
  TEMPEST_ARCHON_V2_RIGHTWING,
  TEMPEST_ARCHON_V2_ROBELEFT,
  TEMPEST_ARCHON_V2_ROBERIGHT,
  TEMPEST_ARCHON_V2_SCEPTERORB,
  TEMPEST_ARCHON_V2_STORMARCS,
} from './tempest-archon-parts.js';

// Indexed 119×92 24-color pixel grid for Floor 20 Major Boss: Tempest Archon (V2).
// Separated animated components (halo, wings, robes, scepterOrb, stormArcs) are stored in
// tempest-archon-parts.js and removed from the main body grid to prevent duplicate rendering.
export const TEMPEST_ARCHON_V2_GRID = TEMPEST_ARCHON_V2_BODY_GRID;

export const TEMPEST_ARCHON_V2_MATERIALS = {
  i: ['ink', '#161428'],
  d: ['armorDeep', '#2c2947'],
  s: ['armorShadow', '#4c476e'],
  m: ['armorMid', '#747096'],
  l: ['armorLight', '#a8a4c2'],
  v: ['silverMid', '#ccd0e0'],
  u: ['silverLight', '#eef2fc'],
  b: ['goldDark', '#8c5a2b'],
  g: ['goldMid', '#d4963b'],
  y: ['goldBright', '#f7cf62'],
  k: ['clothDeep', '#1b2566'],
  c: ['clothMid', '#2e49b3'],
  r: ['clothLight', '#5a7df0'],
  w: ['wingShadow', '#7f89c4'],
  p: ['wingMid', '#b8c3f0'],
  h: ['wingHighlight', '#f2f6ff'],
  q: ['crystalDark', '#1655ad'],
  a: ['crystal', '#2e9ef5'],
  z: ['crystalBright', '#7ad8ff'],
  t: ['stormDark', '#386fe0'],
  f: ['storm', '#6bc4ff'],
  e: ['stormBright', '#b5eeff'],
  o: ['core', '#ffffff'],
  n: ['robeCream', '#ded6d0'],
};

const IDLE_WING_SEQ = [0, 1, 2, 1, 0, 3];
const CHARGE_WING_SEQ = [1, 2, 2, 1];

export const TEMPEST_ARCHON_V2_DEF = Object.freeze({
  grid: TEMPEST_ARCHON_V2_GRID,
  materials: TEMPEST_ARCHON_V2_MATERIALS,
  parts: Object.freeze({
    halo: TEMPEST_ARCHON_V2_HALO,
    leftWing: TEMPEST_ARCHON_V2_LEFTWING,
    rightWing: TEMPEST_ARCHON_V2_RIGHTWING,
    robeLeft: TEMPEST_ARCHON_V2_ROBELEFT,
    robeRight: TEMPEST_ARCHON_V2_ROBERIGHT,
    scepterOrb: TEMPEST_ARCHON_V2_SCEPTERORB,
    stormArcs: TEMPEST_ARCHON_V2_STORMARCS,
  }),
  animate({
    frame = 0,
    pose = 'idle',
    progress = 0,
    attacking = false,
    charging = false,
    hurt = false,
    reducedMotion = false,
    colors,
    now = 0,
  }) {
    const rm = Boolean(reducedMotion);
    if (pose === 'dead') {
      return {
        materialOverrides: null,
        partStates: { hideParts: true },
        effects: [],
      };
    }

    if (rm) {
      return {
        materialOverrides: null,
        partStates: {
          halo: { frame: 0, dx: 0, dy: 0 },
          leftWing: { frame: 0, dx: 0, dy: 0 },
          rightWing: { frame: 0, dx: 0, dy: 0 },
          robeLeft: { frame: 0, dx: 0, dy: 0 },
          robeRight: { frame: 0, dx: 0, dy: 0 },
          scepterOrb: { frame: 0, dx: 0, dy: 0 },
          stormArcs: { frame: 0, dx: 0, dy: 0 },
        },
        effects: [{ type: 'groundShadow', rx: 18, ry: 3, colorIndex: 0 }],
      };
    }

    const useNow = now > 0;
    const idleStep = useNow ? Math.floor(now / 220) : frame;
    const fastStep = useNow ? Math.floor(now / 130) : frame;

    let wingFrame;
    if (attacking) {
      wingFrame = progress < 0.25 ? 2 : progress < 0.65 ? 3 : progress < 0.85 ? 0 : 1;
    } else if (charging) {
      wingFrame = CHARGE_WING_SEQ[((fastStep % 4) + 4) % 4];
    } else if (hurt) {
      wingFrame = 0;
    } else {
      wingFrame = IDLE_WING_SEQ[((idleStep % 6) + 6) % 6];
    }

    const haloFrame = (((attacking || charging ? fastStep : idleStep) % 4) + 4) % 4;
    const orbFrame = (((attacking || charging ? fastStep : (useNow ? Math.floor(now / 190) : frame)) % 4) + 4) % 4;
    const arcFrame = (((attacking || charging ? (useNow ? Math.floor(now / 100) : frame) : (useNow ? Math.floor(now / 200) : frame)) % 4) + 4) % 4;
    const robeLeftFrame = attacking
      ? (progress < 0.35 ? 2 : progress < 0.75 ? 3 : 1)
      : (((idleStep + 1) % 4) + 4) % 4;
    const robeRightFrame = attacking
      ? (progress < 0.35 ? 2 : progress < 0.75 ? 3 : 1)
      : (((idleStep + 2) % 4) + 4) % 4;

    const partStates = {
      halo: { frame: haloFrame, dx: 0, dy: 0 },
      leftWing: { frame: wingFrame, dx: 0, dy: 0 },
      rightWing: { frame: wingFrame, dx: 0, dy: 0 },
      robeLeft: { frame: robeLeftFrame, dx: 0, dy: 0 },
      robeRight: { frame: robeRightFrame, dx: 0, dy: 0 },
      scepterOrb: { frame: orbFrame, dx: 0, dy: 0 },
      stormArcs: { frame: arcFrame, dx: 0, dy: 0 },
    };

    const flicker = (frame % 2 === 1);
    const materialOverrides = (flicker || attacking || charging) ? {
      crystal: (attacking || charging) ? colors.crystalBright : (flicker ? '#48b2ff' : colors.crystal),
      crystalBright: (attacking || charging) ? colors.core : (flicker ? '#a6e7ff' : colors.crystalBright),
      storm: (attacking || charging) ? colors.stormBright : (flicker ? '#8ad6ff' : colors.storm),
      stormBright: (attacking || charging) ? '#ffffff' : colors.stormBright,
      core: (attacking || charging) ? '#ffffff' : (flicker ? '#e0f7ff' : colors.core),
      ...(charging ? { goldBright: '#ffe68c' } : {}),
    } : null;

    const effects = [{ type: 'groundShadow', rx: 18, ry: 3, colorIndex: 0 }];
    if (frame % 2 === 0) {
      effects.push({ type: 'groundSpark', dx: frame === 0 ? -7 : 7, y: 145, radius: 1, colorIndex: 27, coreIndex: 9 });
    }
    if (attacking) {
      effects.push({ type: 'anchorBolt', anchor: 'weapon', dx1: -4, dy1: -6, dx2: 6, dy2: 8, seed: now * 0.08, colorIndex: 27, coreIndex: 9 });
    } else if (charging) {
      effects.push({ type: 'anchorBolt', anchor: 'weapon', dx1: -5, dy1: -7, dx2: 5, dy2: 7, seed: now * 0.07, colorIndex: 27, coreIndex: 9 });
      effects.push({ type: 'anchorBolt', anchor: 'head', dx1: -11, dy1: -12, dx2: 11, dy2: -10, seed: now * 0.06, colorIndex: 27, coreIndex: 9 });
    } else if (frame === 1) {
      effects.push({ type: 'anchorBolt', anchor: 'head', dx1: -10, dy1: -12, dx2: 10, dy2: -10, seed: now * 0.05, colorIndex: 27, coreIndex: 9 });
    }

    return { materialOverrides, partStates, effects };
  },
});
