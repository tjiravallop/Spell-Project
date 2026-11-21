// Accent palettes follow the floors, including the second half of each endgame biome.
const WINGS = [
  [6, '#c66b63', '#ffd098'], [7, '#6396bc', '#cff4ff'],
  [8, '#b59147', '#fff0a3'], [9, '#9a72ad', '#efc4ff'], [10, '#ce5343', '#ffdd80'],
  [11, '#4b9e96', '#a4f2d5'], [16, '#7561aa', '#e0c9ff'],
  [21, '#527b9e', '#9fe0e4'], [26, '#b47851', '#ffe1a0'],
  [31, '#4d9e92', '#abf0d7'], [36, '#577bc2', '#bdd9ff'],
  [41, '#bc7c53', '#ffdea4'], [46, '#985cab', '#efbeff'],
  [51, '#407cb6', '#a1dcff'], [56, '#c2593b', '#ffd179'],
  [61, '#5cb4bc', '#c7ffed'], [66, '#ad8039', '#fff3a1'],
  [71, '#668bd2', '#cdf0ff'], [76, '#779b47', '#d9f58d'], [80, '#347fae', '#adf7ff'],
  [81, '#ca8034', '#fff0a6'], [86, '#9253ae', '#e4b6ff'],
  [91, '#925bd6', '#fbd2ff'], [96, '#508fbd', '#bcfaff'],
];

export function towerArtPalette(floor, palette, alternate = false) {
  const wing = WINGS.findLast(([start]) => floor >= start);
  if (!wing) return palette;
  const [, color, light] = wing;
  const result = [...palette];
  result[22] = color;
  result[23] = light;
  if (floor >= 51 && floor % 2 === 0) {
    // Repeated endgame species have a second material palette within their own biome.
    const accents = floor < 56 || (floor >= 61 && floor < 66) || (floor >= 71 && floor <= 80)
      ? [25, 26] : floor < 86 ? [18, 30] : [21, 27];
    result[accents[0]] = color;
    result[accents[1]] = light;
  }
  if (alternate) {
    for (const index of [18, 25, 29]) result[index] = color;
    for (const index of [19, 26, 30]) result[index] = light;
    result[22] = palette[21];
    result[31] = floor >= 86 ? '#ffd0ec' : '#e8f9c7';
  }
  return result;
}

// Pixel silhouettes use the same 32-unit grid as the existing Canvas sprites.
export const towerEnemyArt = {
  swarm(r, c, pose, frame) {
    const stretch = pose === 'attack' ? -3 : frame % 2;
    r(1, 24, 30, 7, c[0]); r(5, 19 + stretch, 23, 10 - stretch, c[21]);
    r(7, 20 + stretch, 18, 7 - stretch, c[22]); r(2, 26, 27, 3, c[22]);
    r(9, 21 + stretch, 4, 2, c[23]); r(21, 23, 3, 3, c[9]); r(22, 24, 2, 2, c[0]);
    r(15, 14 + stretch, 2, 5, c[21]); r(17, 13 + stretch, 4, 3, c[23]);
    r(4, 28, 7, 3, c[21]); r(18, 28, 8, 3, c[21]);
  },
  ember_imp(r, c, pose, frame) {
    const wing = pose === 'attack' ? -3 : frame % 2;
    r(18, 11 + wing, 11, 10, c[16]); r(23, 8 + wing, 6, 8, c[17]);
    r(25, 7 + wing, 3, 8, c[22]); r(28, 14 + wing, 3, 4, c[22]);
    r(14, 12, 9, 13, c[16]); r(9, 12, 13, 11, c[17]);
    r(3, 18, 13, 4, c[18]); r(5, 14, 12, 5, c[22]);
    r(7, 8, 4, 8, c[16]); r(8, 7, 2, 5, c[23]); r(14, 8, 3, 6, c[23]);
    r(8, 16, 4, 2, c[31]); r(9, 16, 2, 2, c[0]); r(5, 21, 5, 1, c[9]);
    r(12, 23, 10, 4, c[17]); r(9, 26, 7, 3, c[16]); r(19, 26, 7, 3, c[16]);
    r(24, 25, 7, 2, c[22]); r(28, 21, 3, 4, c[23]);
  },
  iron_warden(r, c, pose) {
    const arm = pose === 'attack' ? -2 : 0;
    r(12, 6, 13, 21, c[0]); r(14, 4, 9, 16, c[20]);
    r(16, 5, 7, 7, c[22]); r(14, 11, 8, 3, c[0]); r(14, 12, 6, 1, c[23]);
    r(10, 16, 17, 6, c[21]); r(20, 19, 7, 9, c[22]);
    r(12, 24, 13, 8, c[20]); r(13, 28, 4, 3, c[22]); r(20, 28, 5, 3, c[22]);
    r(1, 13 + arm, 12, 14, c[0]); r(3, 12 + arm, 8, 17, c[22]);
    r(3, 14 + arm, 7, 2, c[23]); r(5, 18 + arm, 4, 7, c[20]); r(6, 19 + arm, 2, 4, c[23]);
    r(27, 10, 2, 20, c[7]); r(26, 9, 4, 3, c[23]);
  },
  rune_golem(r, c, pose) {
    const ready = pose === 'charge' || pose === 'ready' || pose === 'attack';
    const fist = ready ? 11 : 20;
    r(7, 11, 22, 20, c[0]); r(9, 9, 17, 16, c[11]); r(12, 7, 12, 9, c[12]);
    r(9, 8, 5, 6, c[13]); r(23, 11, 6, 10, c[22]); r(27, 14, 4, 8, c[11]);
    r(1, fist, 11, 9, c[11]); r(2, fist, 8, 4, c[13]); r(6, fist + 3, 4, 2, c[23]);
    r(13, 14, 8, 3, c[0]); r(13, 14, 5, 1, c[23]);
    r(16, 19, 7, 7, c[0]); r(18, 18, 3, 9, ready ? c[9] : c[22]);
    r(16, 21, 7, 3, c[23]); r(8, 28, 8, 3, c[12]); r(22, 28, 7, 4, c[12]);
  },
  aether_warden(r, c, pose, frame) {
    const y = pose === 'attack' ? -2 : frame % 2;
    r(12, 4 + y, 15, 17, c[20]); r(10, 8 + y, 20, 5, c[22]); r(14, 9 + y, 10, 3, c[0]);
    r(13, 9 + y, 7, 2, c[23]); r(11, 19 + y, 16, 6, c[24]); r(17, 22 + y, 13, 4, c[22]);
    r(20, 26 + y, 8, 2, c[23]); r(25, 29 + y, 5, 1, c[22]);
    r(2, 11 + y, 4, 15, c[24]); r(6, 7 + y, 3, 22, c[22]);
    r(4, 13 + y, 2, 10, c[23]); r(9, 17 + y, 8, 3, c[23]);
  },
  chrono_sage(r, c, pose, frame) {
    const y = pose === 'attack' ? -2 : frame % 2;
    r(9, 9 + y, 14, 18, c[20]); r(8, 25 + y, 18, 4, c[21]);
    r(7, 7 + y, 18, 3, c[22]); r(12, 3 + y, 10, 5, c[21]); r(8, 10 + y, 18, 2, c[23]);
    r(11, 12 + y, 10, 6, c[0]); r(12, 14 + y, 7, 2, c[23]);
    r(2, 18 + y, 9, 2, c[31]); r(3, 19 + y, 7, 9, c[20]); r(2, 28 + y, 9, 2, c[31]);
    r(4, 20 + y, 5, 2, c[23]); r(6, 22 + y, 1, 4, c[23]); r(4, 26 + y, 5, 1, c[23]);
  },
  prism_watcher(r, c, pose, frame) {
    const y = pose === 'attack' ? -2 : frame % 2;
    r(11, 2 + y, 10, 27, c[20]); r(8, 5 + y, 16, 20, c[21]);
    r(5, 10 + y, 22, 10, c[22]); r(8, 10 + y, 16, 2, c[23]); r(11, 5 + y, 10, 3, c[23]);
    r(9, 13 + y, 14, 5, c[0]); r(12, 12 + y, 7, 7, c[0]);
    r(13, 13 + y, 5, 5, c[9]); r(14, 14 + y, 2, 3, c[22]);
    r(1, 17 - y, 3, 5, c[23]); r(28, 11 - y, 3, 5, c[23]);
    r(7, 25 - y, 3, 4, c[22]); r(22, 25 - y, 3, 4, c[22]);
  },
  astral_sentinel(r, c, pose, frame) {
    const y = pose === 'attack' ? -3 : frame % 2;
    r(10, 4, 13, 20, c[20]); r(12, 2, 9, 8, c[22]); r(13, 5, 7, 2, c[31]);
    r(11, 10, 12, 10, c[21]); r(13, 13, 8, 5, c[22]); r(16, 12, 2, 7, c[23]);
    r(10, 25, 5, 6, c[20]); r(20, 25, 6, 6, c[20]); r(20, 24, 5, 3, c[22]);
    r(2, 6 + y, 7, 10, c[20]); r(3, 7 + y, 5, 6, c[22]); r(3, 7 + y, 2, 4, c[23]);
    r(24, 7 - y, 7, 10, c[20]); r(25, 8 - y, 5, 6, c[22]); r(26, 8 - y, 3, 2, c[23]);
    r(2, 21 + y, 7, 4, c[22]); r(25, 22 - y, 5, 4, c[22]); r(4, 23 + y, 3, 4, c[23]);
  },
  elder_grimoire(r, c, pose) {
    const edge = pose === 'attack' ? 1 : 3;
    r(edge, 9, 11, 18, c[11]); r(edge + 1, 10, 10, 13, c[14]);
    r(18, 7, 14 - edge, 21, c[11]); r(19, 8, 12 - edge, 16, c[15]);
    r(13, 6, 7, 23, c[0]); r(14, 7, 5, 20, c[22]); r(15, 11, 3, 8, c[23]);
    r(6, 15, 7, 2, c[17]); r(20, 14, 6, 2, c[17]); r(5, 20, 8, 1, c[12]); r(21, 19, 6, 1, c[12]);
    r(3, 8, 4, 3, c[31]); r(24, 7, 4, 3, c[31]); r(5, 26, 3, 5, c[22]); r(24, 25, 3, 6, c[22]);
  },
  nexus_codex(r, c, pose, frame) {
    const y = pose === 'attack' ? -2 : frame % 2;
    r(11, 1, 10, 3, c[22]); r(7, 4, 4, 3, c[22]); r(21, 4, 4, 3, c[22]);
    r(4, 7, 3, 14, c[22]); r(25, 7, 3, 14, c[22]);
    r(7, 21, 4, 3, c[22]); r(21, 21, 4, 3, c[22]); r(11, 24, 10, 3, c[22]);
    r(8, 8 + y, 8, 15, c[20]); r(16, 7 + y, 8, 15, c[21]);
    r(9, 9 + y, 6, 11, c[23]); r(17, 8 + y, 6, 11, c[22]);
    r(15, 9 + y, 2, 15, c[0]); r(12, 13 + y, 8, 3, c[0]);
    r(14, 12 + y, 4, 5, c[9]); r(15, 13 + y, 2, 3, c[22]); r(14, 28, 4, 2, c[23]);
  },
  eclipse_mage(r, c, pose, frame) {
    const y = pose === 'attack' ? -2 : frame % 2;
    r(11, 3, 10, 17, c[22]); r(8, 6, 16, 10, c[22]);
    r(11, 2, 10, 15, c[0]); r(12, 13, 8, 3, c[23]); r(9, 10, 3, 4, c[23]);
    r(12, 17 + y, 9, 7, c[21]); r(10, 21 + y, 14, 7, c[20]); r(7, 26 + y, 19, 3, c[21]);
    r(6, 28 + y, 9, 2, c[22]); r(17, 27 + y, 13, 3, c[22]); r(13, 19 + y, 5, 2, c[23]);
    r(2, 17 + y, 4, 4, c[22]); r(3, 17 + y, 2, 2, c[23]); r(27, 19 - y, 4, 3, c[23]);
  },
  glacial_sovereign(r, c, pose) {
    const tip = pose === 'attack' ? 2 : 5;
    r(4, 18, 26, 12, c[20]); r(7, 14, 20, 15, c[22]);
    r(12, 8, 10, 12, c[21]); r(10, 4, 3, 9, c[23]); r(20, 4, 3, 9, c[23]);
    r(14, 3, 4, 10, c[22]); r(12, 12, 10, 3, c[0]); r(13, 12, 6, 2, c[23]);
    r(3, tip, 3, 15, c[23]); r(5, tip + 4, 3, 12, c[22]);
    r(26, tip + 1, 3, 14, c[23]); r(28, tip + 5, 2, 12, c[22]);
    r(14, 19, 5, 9, c[20]); r(15, 20, 3, 6, c[23]); r(9, 27, 7, 3, c[23]);
  },
  thunder_colossus(r, c, pose) {
    const y = pose === 'attack' ? -4 : 0;
    r(7, 10, 22, 17, c[10]); r(9, 12, 17, 14, c[12]); r(12, 8, 10, 8, c[28]);
    r(14, 10, 6, 2, c[31]); r(9, 26, 7, 6, c[11]); r(21, 26, 8, 6, c[11]);
    r(1, 11 + y, 8, 16, c[10]); r(2, 12 + y, 6, 13, c[28]); r(2, 19 + y, 7, 4, c[30]);
    r(25, 7, 5, 12, c[28]); r(27, 4, 2, 7, c[31]); r(7, 2, 3, 10, c[29]); r(7, 2, 2, 4, c[31]);
    r(14, 16, 8, 3, c[22]); r(15, 18, 4, 3, c[31]); r(13, 20, 4, 4, c[31]);
  },
};

export function drawTowerFittings(kind, floor, r, c) {
  if (floor >= 6 && floor <= 9) {
    if (kind === 'mirror_mage') {
      r(5, 16, 2, 5, c[22]); r(6, 17, 2, 2, c[23]); r(25, 13, 2, 5, c[22]); r(26, 14, 2, 2, c[23]);
    } else if (kind === 'frost_lich') {
      r(11, 4, 2, 4, c[22]); r(19, 4, 2, 4, c[22]); r(15, 2, 2, 6, c[23]);
    } else if (kind === 'storm_titan') {
      r(5, 12, 3, 3, c[22]); r(24, 12, 3, 3, c[22]); r(6, 12, 1, 3, c[23]); r(25, 12, 1, 3, c[23]);
    } else if (kind === 'arch_codex') {
      r(11, 6, 10, 1, c[22]); r(14, 5, 4, 3, c[22]); r(15, 5, 2, 2, c[23]);
    }
    return;
  }
  if (floor >= 21 && floor <= 30) {
    if (kind === 'ink_ray') {
      r(5, 15, 5, 2, c[22]); r(23, 15, 4, 2, c[22]); r(10, 15, 2, 1, c[23]);
    } else if (kind === 'prism_crab') {
      r(6, 22, 3, 2, c[22]); r(23, 22, 3, 2, c[22]); r(7, 22, 1, 2, c[23]); r(24, 22, 1, 2, c[23]);
    } else if (kind === 'scroll_moth') {
      r(4, 17, 5, 1, c[23]); r(23, 17, 5, 1, c[23]); r(6, 16, 2, 3, c[22]); r(24, 16, 2, 3, c[22]);
    } else if (kind === 'chain_hound') {
      r(18, 18, 9, 2, c[22]); r(21, 17, 3, 3, c[23]);
    } else if (kind === 'lantern_wisp') {
      r(12, 14, 8, 1, c[22]); r(14, 13, 4, 3, c[23]);
    }
    return;
  }
  if (floor < 31 || floor > 50) return;
  if (kind === 'rift_runner') {
    if (floor < 41) {
      r(22, 14, 7, 3, c[22]); r(25, 14, 4, 1, c[23]); r(26, 17, 4, 4, c[22]);
    } else {
      r(21, 19, 9, 2, c[22]); r(23, 21, 7, 2, c[23]); r(27, 23, 4, 2, c[22]);
    }
  } else if (kind === 'lattice_guard') {
    if (floor < 41) {
      r(19, 12, 8, 10, c[20]); r(20, 13, 6, 8, c[22]); r(22, 15, 2, 4, c[23]);
    } else {
      r(18, 10, 8, 3, c[22]); r(19, 7, 2, 4, c[23]); r(23, 6, 2, 5, c[23]);
    }
  } else if (kind === 'thread_archer') {
    if (floor < 41) {
      r(15, 7, 6, 3, c[22]); r(17, 5, 3, 3, c[23]);
    } else {
      r(20, 15, 6, 11, c[20]); r(22, 13, 3, 9, c[22]); r(24, 12, 2, 3, c[23]);
    }
  } else if (kind === 'ward_scribe') {
    r(20, 15, 6, 8, c[20]); r(21, 15, 4, 7, c[22]); r(22, 16, 2, 3, c[23]);
    if (floor >= 41) r(24, 21, 2, 6, c[23]);
  }
}
