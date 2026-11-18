const ray = 'ink_ray';
const crab = 'prism_crab';
const light = 'lantern_wisp';
const moth = 'scroll_moth';
const hound = 'chain_hound';

export const MIDDLE_ENEMIES = {
  [ray]: { name: 'กระเบนหมึก', hp: 33, armor: 0, ward: 0, attack: 6, exp: 34, gold: 27, color: '#bca5d2', affinity: 'water' },
  [crab]: { name: 'ปูเกราะปริซึม', hp: 42, armor: 5, ward: 0, attack: 5, exp: 43, gold: 35, color: '#8bb7a0', affinity: 'water' },
  [light]: { name: 'โคมวิญญาณ', hp: 31, armor: 1, ward: 0, attack: 6, exp: 38, gold: 32, color: '#f5db87', affinity: 'fire' },
  [moth]: { name: 'ผีเสื้อคัมภีร์', hp: 28, armor: 0, ward: 0, attack: 6, exp: 34, gold: 29, color: '#efd19a', affinity: 'wind' },
  [hound]: { name: 'สุนัขโซ่อาคม', hp: 39, armor: 2, ward: 0, attack: 7, exp: 39, gold: 34, color: '#e29d83', affinity: 'earth' },
};

// Two rooms per floor, followed by the existing boss. Floors 14 and 19 are rests.
export const MIDDLE_BATTLES = {
  22: [[ray, moth]],
  23: [[crab, ray], [crab, moth]],
  25: [[crab, hound]],
  26: [[hound, moth], [crab, light, ray]],
  28: [[light, crab]],
  29: [[ray, light, moth], [hound, crab, ray]],
  31: [[hound, ray]],
  32: [[moth, crab], [light, hound]],
  34: [[ray, light]],
  35: [[moth, light, crab], [hound, ray, crab]],
  37: [[hound, light]],
  38: [[hound, moth, ray], [crab, hound, light]],
  40: [[crab, moth, hound]],
  41: [[light, hound, ray], [crab, moth, light]],
};
