const ART = {
  wizard: { file: 'caster-rig/runescribe-sheet.png', size: 32, pivot: [16, 31] },
  striker: { file: 'floor1-monsters/imp-sheet.png', size: 32, pivot: [16, 31] },
  swarm: { file: 'floor1-monsters/slime-sheet.png', size: 32, pivot: [16, 31] },
  prism_crab: { file: 'prism-crab/prism-crab-sheet.png', size: 32, pivot: [16, 31] },
  elite: { file: 'floor1-warden-v2/warden-sheet.png', size: 64, pivot: [32, 58] },
  charger: { file: 'floor2-golems/lantern-golem-sheet.png', size: 32, pivot: [16, 31] },
  sentinel: { file: 'floor2-golems/iron-sentinel-sheet.png', size: 64, pivot: [32, 62] },
  armored: { file: 'floor3-monsters/armored-sheet.png', size: 32, pivot: [16, 31] },
  warden: { file: 'floor3-monsters/warden-sheet.png', size: 32, pivot: [16, 31] },
  support: { file: 'floor3-monsters/support-sheet.png', size: 32, pivot: [16, 31] },
  boss: { file: 'floor3-monsters/boss-sheet.png', size: 64, pivot: [32, 62] },
  ember_imp: { file: 'floor5-8/ember_imp-sheet.png', size: 32, pivot: [16, 31] },
  iron_warden: { file: 'floor5-8/iron_warden-sheet.png', size: 32, pivot: [16, 31] },
  rune_golem: { file: 'floor5-8/rune_golem-sheet.png', size: 32, pivot: [16, 31] },
  mirror_mage: { file: 'floor5-8/mirror_mage-sheet.png', size: 64, pivot: [32, 62] },
  frost_lich: { file: 'floor5-8/frost_lich-sheet.png', size: 64, pivot: [32, 62] },
  storm_titan: { file: 'floor5-8/storm_titan-sheet.png', size: 64, pivot: [32, 62] },
  arch_codex: { file: 'floor5-8/arch_codex-sheet.png', size: 64, pivot: [32, 62] },
};
const wardCenters = [
  [[31, 36], [31, 35], [31, 36]],
  [[29, 37], [28, 38], [28, 38], [28, 38]],
  [[34, 37], [36, 37], [31, 36]],
  [[32, 37], [32, 37], [30, 37], [30, 37], [31, 36]],
];
const sequenceIndex = (progress, cuts) => cuts.filter(cut => progress >= cut).length;

export function spriteFrame(kind, pose, frame, progress = 0, reducedMotion = false) {
  if (!ART[kind] || pose === 'dead' || (kind === 'wizard' && pose === 'hurt')) return null;
  const idleFrame = reducedMotion ? 0 : frame;
  let row = 0, index = 0;
  if (kind === 'wizard') {
    if (pose === 'cast') { row = 1; index = reducedMotion ? 3 : sequenceIndex(progress, [0.2, 0.4, 0.65, 0.85]); }
    else index = idleFrame % 4;
  } else if (kind === 'elite') {
    if (pose === 'ward') { row = 1; index = 3; }
    else if (pose === 'break') { row = 2; index = reducedMotion ? 1 : sequenceIndex(progress, [0.45, 0.85]); }
    else if (pose === 'attack') { row = 3; index = reducedMotion ? 2 : sequenceIndex(progress, [0.3, 0.62, 0.8, 0.93]); }
    else index = idleFrame % 3;
  } else if (['charger', 'sentinel', 'rune_golem', 'storm_titan'].includes(kind)) {
    if (pose === 'charge') { row = 1; index = reducedMotion ? 2 : Math.min(2, Math.floor(progress * 3)); }
    else if (pose === 'ready') { row = 1; index = 2; }
    else if (pose === 'attack') { row = 2; index = reducedMotion ? 2 : sequenceIndex(progress, [0.3, 0.62, 0.8, 0.93]); }
    else if (pose === 'hurt') { row = 3; index = reducedMotion ? 0 : Math.min(1, Math.floor(progress * 2)); }
    else index = idleFrame % 3;
  } else if (kind === 'prism_crab') {
    if (pose === 'exposed') { row = 1; index = 2; }
    else if (pose === 'attack') { row = 2; index = reducedMotion ? 2 : sequenceIndex(progress, [0.3, 0.62, 0.8, 0.93]); }
    else index = idleFrame % 3;
  } else {
    if (pose === 'attack') { row = 1; index = reducedMotion ? 2 : sequenceIndex(progress, [0.3, 0.62, 0.85]); }
    else if (pose === 'hurt') { row = 2; index = reducedMotion ? 0 : Math.min(1, Math.floor(progress * 2)); }
    else index = idleFrame % 3;
  }
  return { ...ART[kind], row, index, wardCenter: kind === 'elite' ? wardCenters[row][index] : null };
}

export function loadSpriteArt() {
  return Object.fromEntries(Object.entries(ART).map(([kind, art]) => {
    const image = new Image();
    image.src = new URL(`../assets/${art.file}`, import.meta.url).href;
    return [kind, image];
  }));
}
