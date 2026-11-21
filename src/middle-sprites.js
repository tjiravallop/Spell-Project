// Rectangle coordinates are on the same 32px grid as the other enemies.
export const middleSprites = {
  gate_weaver(r, c, pose, frame) {
    const glow = pose === 'attack' ? c[31] : frame % 2 ? c[23] : c[22];
    r(1, 5, 4, 25, c[20]); r(27, 5, 4, 25, c[20]);
    r(3, 2, 26, 4, c[21]); r(7, 0, 18, 3, c[22]);
    r(5, 7, 2, 19, c[23]); r(25, 7, 2, 19, c[23]);
    r(11, 8, 10, 14, c[20]); r(13, 9, 6, 4, c[22]);
    r(14, 10, 2, 2, c[31]); r(17, 10, 2, 2, c[31]);
    r(9, 22, 14, 6, c[21]); r(6, 28, 20, 3, c[20]);
    r(7, 13, 4, 1, glow); r(21, 13, 4, 1, glow);
    r(4, 19, 7, 1, glow); r(21, 19, 7, 1, glow);
    r(14, 16, 4, 4, glow); r(15, 17, 2, 2, c[9]);
  },
  mirror_regent(r, c, pose, frame) {
    const flare = pose === 'attack' ? 2 : frame % 2;
    r(12, 0, 8, 3, c[30]); r(9, 2, 14, 3, c[22]);
    r(5, 5, 22, 3, c[20]); r(3, 8, 26, 17, c[20]);
    r(5, 9, 22, 14, c[25]); r(7, 10, 18, 12, c[26]);
    r(8, 10, 3, 11, c[27]); r(12, 11, 2, 8, c[9]);
    r(14, 12, 5, 6, c[21]); r(15, 13, 1, 2, c[31]); r(18, 13, 1, 2, c[31]);
    r(20, 10, 2, 10, c[9]); r(23, 9, 2, 12, c[23]);
    r(7, 25, 18, 3, c[22]); r(4, 28, 24, 3, c[20]);
    r(0, 12 - flare, 3, 6, c[27]); r(29, 16 + flare, 3, 5, c[23]);
  },
  seam_warden(r, c, pose, frame) {
    // จ้าวอสูรเฝ้ารอยต่อ (Ancient Seam Titan - Earth boss, auto 2x scale)
    const atk = pose === 'attack';
    const arm = atk ? 4 : 0;
    const lk = atk ? -2 : frame % 2;
    const coreGlow = atk ? c[31] : frame % 2 ? c[30] : c[29];
    // Massive Crag Head & Glowing Eyes
    r(11, 1, 10, 4, c[12]);
    r(8, 4, 16, 6, c[10]);
    r(10, 5, 12, 4, c[13]);
    r(12, 6, 3, 2, c[31]); r(18, 6, 3, 2, c[31]);
    // Giant Stone Shoulder Pauldrons
    r(2, 6 - arm, 8, 8, c[11]); r(3, 4 - arm, 6, 3, c[14]);
    r(22, 6, 8, 8, c[11]); r(23, 4, 6, 3, c[14]);
    // Heavy Torso & Runic Seam Cracks
    r(6, 10, 20, 15, c[10]);
    r(8, 11, 16, 12, c[12]);
    r(14, 10, 3, 5, coreGlow);
    r(12, 15, 3, 3, coreGlow);
    r(15, 18, 3, 5, coreGlow);
    r(14, 16, 4, 3, c[31]);
    // Massive Titan Fists
    r(1, 14 - arm, 7, 13, c[10]); r(2, 15 - arm, 5, 10, c[13]);
    if (atk) r(0, 24, 8, 6, c[31]); // Shockwave impact
    r(24, 14, 7, 13, c[10]); r(25, 15, 5, 10, c[13]);
    // Sturdy Column Legs
    r(7, 24, 7, 7, c[10]); r(19, 24, 7, 7, c[10]);
    r(6 + lk, 29, 8, 3, c[12]); r(19 - lk, 29, 8, 3, c[12]);
  },
  loom_sovereign(r, c, pose, frame) {
    // ราชันกี่ทอโลก (The Loom Sovereign - Final Boss Floor 50★, auto 2x scale)
    const atk = pose === 'attack';
    const pulse = atk ? c[31] : frame % 2 ? c[23] : c[30];
    const floatY = [0, -1, 0, 1][frame % 4];
    // Giant World Loom Frame standing in background
    r(3, 1, 3, 30, c[12]); r(26, 1, 3, 30, c[12]);
    r(4, 0, 24, 3, c[14]); r(4, 29, 24, 3, c[14]);
    // Loom Strings of Reality (vibrant threads vibrating)
    r(7, 3, 1, 26, c[23]); r(10, 3, 1, 26, pulse); r(21, 3, 1, 26, pulse); r(24, 3, 1, 26, c[23]);
    // Cosmic Crown & Celestial Halo
    r(11, 2, 10, 4, c[30]); r(13, 0, 6, 3, c[31]); r(15, -2, 2, 3, c[9]);
    // Sovereign Head & Omniscient Eyes
    r(12, 5 + floatY, 8, 7, c[20]);
    r(13, 6 + floatY, 6, 5, c[15]);
    r(14, 7 + floatY, 2, 2, c[31]); r(17, 7 + floatY, 2, 2, c[31]);
    // Royal Robes of Starry Space
    r(10, 12 + floatY, 12, 16, c[20]);
    r(11, 14 + floatY, 10, 13, c[21]);
    r(13, 13 + floatY, 6, 14, c[23]);
    r(14, 15 + floatY, 4, 10, pulse);
    r(15, 17 + floatY, 2, 3, c[9]);
    // Floating Cosmic Loom Shuttles / Spindles
    r(0, 10 + floatY, 4, 6, pulse); r(1, 11 + floatY, 2, 4, c[31]);
    r(28, 10 - floatY, 4, 6, pulse); r(29, 11 - floatY, 2, 4, c[31]);
    r(0, 22 - floatY, 4, 5, c[23]); r(28, 22 + floatY, 4, 5, c[23]);
    // Attack burst: threads ignite with blinding white/gold light!
    if (atk) {
      r(6, 14, 20, 2, c[31]);
      r(12, 8, 8, 8, c[31]);
    }
  },
  rift_runner(r, c, pose, frame) {
    const drift = pose === 'attack' ? -2 : [0, -1, 0, 1][frame % 4];
    r(13, 3 + drift, 6, 4, c[23]); r(10, 7 + drift, 12, 8, c[20]);
    r(12, 9 + drift, 8, 3, c[22]); r(13, 10 + drift, 2, 1, c[31]); r(18, 10 + drift, 2, 1, c[31]);
    r(9, 15 + drift, 14, 8, c[21]); r(7, 22 + drift, 18, 4, c[20]);
    r(10, 26 + drift, 5, 3, c[22]); r(18, 27 + drift, 4, 3, c[23]);
    r(2, 11 + drift, 3, 11, c[22]); r(0, 14 + drift, 2, 5, c[23]);
    r(27, 8 + drift, 3, 13, c[22]); r(30, 12 + drift, 2, 6, c[23]);
    r(4, 23 + drift, 4, 1, c[31]); r(24, 5 + drift, 4, 1, c[31]);
  },
  lattice_guard(r, c, pose) {
    const lift = pose === 'attack' ? 3 : 0;
    r(7, 7, 18, 18, c[20]); r(9, 9, 14, 14, c[21]);
    r(11, 3, 10, 5, c[22]); r(13, 5, 6, 2, c[31]);
    r(10, 11, 12, 3, c[23]); r(14, 12, 4, 2, c[9]);
    r(4, 14 - lift, 5, 12, c[12]); r(2, 13 - lift, 3, 10, c[14]);
    r(23, 14, 6, 11, c[22]); r(25, 16, 3, 6, c[31]);
    r(8, 25, 6, 6, c[10]); r(19, 25, 6, 6, c[10]);
    r(11, 18, 10, 2, c[14]); r(15, 15, 2, 8, c[14]);
  },
  thread_archer(r, c, pose, frame) {
    const draw = pose === 'attack' ? 3 : frame % 2;
    r(11, 4, 10, 6, c[24]); r(9, 10, 14, 8, c[25]);
    r(12, 10, 8, 3, c[0]); r(13, 11, 2, 1, c[31]); r(18, 11, 2, 1, c[31]);
    r(10, 18, 12, 9, c[24]); r(8, 26, 16, 4, c[20]);
    r(9, 30, 5, 2, c[10]); r(20, 30, 4, 2, c[10]);
    r(3, 8, 2, 16, c[14]); r(5, 6, 4, 2, c[14]); r(5, 24, 4, 2, c[14]);
    r(8, 8, 1, 16, c[31]); r(5, 16, 12 + draw, 1, c[31]); r(3, 15, 3, 3, c[30]);
  },
  ward_scribe(r, c, pose, frame) {
    const hover = [0, -1, 0, 1][frame % 4];
    r(11, 4 + hover, 10, 7, c[21]); r(9, 10 + hover, 14, 7, c[22]);
    r(12, 11 + hover, 8, 3, c[20]); r(13, 12 + hover, 2, 1, c[31]); r(18, 12 + hover, 2, 1, c[31]);
    r(8, 17 + hover, 16, 10, c[20]); r(6, 26 + hover, 20, 3, c[21]);
    r(13, 19 + hover, 6, 5, c[23]); r(15, 20 + hover, 2, 3, c[31]);
    r(1, 15 + hover, 6, 9, c[15]); r(2, 17 + hover, 4, 1, c[12]); r(2, 20 + hover, 4, 1, c[12]);
    r(26, 8 + hover, 2, 19, c[12]); r(24, 6 + hover, 6, 4, pose === 'attack' ? c[31] : c[23]);
  },
  ink_ray(r, c, pose, frame) {
    const wing = pose === 'attack' ? 3 : [0, 2, 0, -2][frame % 4];
    r(1, 13 + wing, 5, 3, c[20]); r(5, 14, 8, 6, c[20]);
    r(19, 13, 8, 6, c[20]); r(25, 11 + wing, 6, 3, c[20]);
    r(6, 14, 7, 2, c[22]); r(21, 13, 6, 2, c[23]);
    r(11, 10, 10, 14, c[20]); r(12, 11, 8, 10, c[21]);
    r(13, 13, 6, 2, c[23]); r(13, 17, 2, 2, c[31]); r(17, 17, 2, 2, c[9]);
    r(15, 22, 3, 4, c[22]); r(16, 26, 5, 2, c[21]); r(20, 28, 5, 1, c[23]);
  },
  prism_crab(r, c, pose) {
    const open = pose === 'attack' || pose === 'exposed';
    r(5, 24, 4, 7, c[24]); r(10, 25, 3, 7, c[25]); r(20, 25, 3, 7, c[25]); r(24, 24, 4, 7, c[24]);
    r(8, 15, 17, 12, c[20]); r(11, 18, 12, 7, open ? c[29] : c[24]);
    r(13, 20, 2, 2, c[31]); r(18, 20, 2, 2, c[31]);
    r(9, open ? 11 : 13, 16, 4, c[25]); r(12, open ? 8 : 10, 10, 4, c[26]);
    r(12, 12, 3, 2, c[27]); r(9, 15, 4, 2, c[26]); r(22, 15, 3, 2, c[26]);
    r(3, open ? 16 : 21, 8, 5, c[25]); r(1, open ? 13 : 18, 4, 4, c[26]);
    r(24, 19, 7, 5, c[25]); r(27, 16, 4, 4, c[26]);
    if (open) r(14, 17, 5, 2, c[9]);
  },
  lantern_wisp(r, c, pose, frame) {
    const ember = frame % 2 ? c[31] : c[9];
    r(12, 4, 8, 2, c[13]); r(11, 6, 2, 3, c[14]); r(19, 6, 2, 3, c[14]);
    r(9, 9, 14, 16, c[10]); r(8, 12, 16, 11, c[13]);
    r(10, 13, 12, 9, c[30]); r(12, 14, 8, 7, ember);
    r(13, 16, 2, 3, c[17]); r(17, 16, 2, 3, c[17]); r(15, 13, 2, 3, c[31]);
    r(11, 24, 10, 3, c[13]); r(14, 28, 5, 2, c[30]); r(18, 30, 4, 1, c[19]);
    if (pose === 'attack') { r(4, 16, 3, 2, c[31]); r(25, 15, 3, 2, c[31]); }
  },
  scroll_moth(r, c, pose, frame) {
    const flap = pose === 'attack' ? 3 : [0, -2, 0, 2][frame % 4];
    r(2, 8 + flap, 10, 12, c[12]); r(20, 8 + flap, 10, 12, c[12]);
    r(3, 8 + flap, 8, 9, c[15]); r(21, 8 + flap, 8, 9, c[15]);
    r(5, 10 + flap, 5, 1, c[13]); r(5, 13 + flap, 5, 1, c[13]);
    r(22, 10 + flap, 5, 1, c[13]); r(22, 13 + flap, 5, 1, c[13]);
    r(7, 18, 6, 7, c[14]); r(19, 18, 6, 7, c[14]);
    r(13, 11, 6, 14, c[20]); r(14, 13, 4, 7, c[22]);
    r(12, 7, 2, 4, c[23]); r(18, 7, 2, 4, c[23]); r(14, 13, 4, 1, c[31]);
  },
  chain_hound(r, c, pose, frame) {
    const stride = pose === 'attack' ? 3 : frame % 2;
    r(8, 17, 19, 9, c[20]); r(12, 16, 12, 7, c[17]);
    r(3, 16, 11, 8, c[17]); r(3, 13, 3, 5, c[20]); r(8, 12, 4, 5, c[20]);
    r(1, 22, 9, 4, c[16]); r(4, 19, 2, 2, c[31]); r(2, 24, 2, 1, c[9]);
    r(8 - stride, 24, 4, 7, c[16]); r(16 + stride, 24, 4, 7, c[20]); r(23, 24, 4, 7, c[16]);
    r(26, 15, 4, 4, c[17]); r(29, 12, 2, 4, c[19]);
    r(10, 18, 3, 7, c[14]); r(13, 25, 3, 2, c[13]); r(16, 27, 4, 2, c[14]); r(20, 29, 4, 2, c[13]);
  },
  ward_keeper(r, c, pose, frame) {
    // ด้วงเกราะเพลิง (Blaze Beetle) - Heavy fire beetle with horned pincers & lava seams
    const atk = pose === 'attack';
    const lk = atk ? 3 : frame % 2;
    const glow = atk ? c[31] : frame % 2 ? c[30] : c[19];
    // Front horn & pincers
    r(1 - (atk ? 2 : 0), 6, 3, 5, c[16]);
    r(3 - (atk ? 2 : 0), 4, 3, 4, c[18]);
    r(5 - (atk ? 1 : 0), 6, 3, 5, c[17]);
    r(2 - (atk ? 2 : 0), 4, 2, 2, glow);
    r(3 - (atk ? 1 : 0), 13, 4, 3, c[16]);
    // Head & glowing eye
    r(6, 10, 6, 8, c[10]);
    r(7, 11, 5, 6, c[16]);
    r(7, 12, 2, 2, c[31]);
    // Carapace / Shell
    r(11, 8, 17, 14, c[16]);
    r(13, 9, 14, 12, c[17]);
    r(15, 11, 10, 8, c[18]);
    // Lava seams down shell
    r(14, 14, 11, 2, glow);
    r(18, 10, 2, 10, glow);
    r(10, 21, 18, 4, c[11]);
    // 6 legs
    r(7 - lk, 20, 3, 6, c[10]); r(5 - lk, 25, 3, 4, c[11]);
    r(14 + lk, 22, 4, 6, c[10]); r(13 + lk, 27, 3, 3, c[11]);
    r(22 - lk, 21, 4, 6, c[10]); r(25 - lk, 26, 4, 4, c[11]);
  },
  rune_ram(r, c, pose, frame) {
    // แพะผาศิลา (Crag Ram) - Rocky horned mountain ram
    const atk = pose === 'attack';
    const chg = pose === 'charge';
    const dip = chg ? 2 : 0;
    const lk = atk ? 4 : [0, 1, 0, -1][frame % 4];
    // Head & Muzzle
    r(5 - (atk ? 3 : 0), 9 + dip, 8, 9, c[12]);
    r(7 - (atk ? 3 : 0), 10 + dip, 6, 7, c[13]);
    r(3 - (atk ? 3 : 0), 14 + dip, 4, 5, c[11]);
    r(2 - (atk ? 3 : 0), 16 + dip, 2, 3, c[10]);
    r(6 - (atk ? 3 : 0), 12 + dip, 2, 2, c[31]);
    r(4 - (atk ? 3 : 0), 19 + dip, 3, 4, c[14]);
    // Great Curved Ram Horns (curls up, back, and down)
    r(9 - (atk ? 3 : 0), 5 + dip, 6, 5, c[28]);
    r(10 - (atk ? 3 : 0), 3 + dip, 5, 3, c[29]);
    r(14 - (atk ? 3 : 0), 4 + dip, 5, 4, c[30]);
    r(17 - (atk ? 3 : 0), 7 + dip, 4, 6, c[29]);
    r(15 - (atk ? 3 : 0), 12 + dip, 4, 5, c[28]);
    r(12 - (atk ? 3 : 0), 15 + dip, 4, 3, c[10]);
    // Sturdy Body & Rocky Crag Spines
    r(10, 12, 9, 10, c[13]);
    r(17, 13, 11, 9, c[12]);
    r(13, 9, 3, 3, c[28]);
    r(18, 10, 3, 3, c[28]);
    r(23, 11, 3, 2, c[11]);
    r(12, 20, 14, 3, c[14]);
    // 4 legs with hooves
    r(8 - lk, 21, 3, 8, c[11]); r(7 - lk, 28, 4, 3, c[10]);
    r(12 + lk, 21, 3, 7, c[12]); r(12 + lk, 27, 4, 3, c[10]);
    r(21 - lk, 21, 4, 8, c[11]); r(20 - lk, 28, 4, 3, c[10]);
    r(25 + lk, 21, 3, 7, c[12]); r(25 + lk, 27, 4, 3, c[10]);
    r(28, 14, 2, 4, c[14]);
  },
  seal_curator(r, c, pose, frame) {
    // พยัคฆ์เพลิงบรรพกาล (Ancient Blaze Tiger) - Boss (auto 2x scale)
    const atk = pose === 'attack';
    const flameTip = atk ? c[31] : frame % 2 ? c[30] : c[31];
    const leap = atk ? -3 : [0, -1, 0, 1][frame % 4];
    // Fierce Tiger Muzzle & Fangs
    r(2 + leap, 13, 5, 6, c[19]);
    r(3 + leap, 14, 3, 4, c[9]);
    r(1 + leap, 17, 2, 2, c[9]);
    // Head & Piercing Eye
    r(5 + leap, 9, 9, 10, c[18]);
    r(7 + leap, 10, 7, 8, c[19]);
    r(5 + leap, 11, 2, 2, c[31]);
    r(11 + leap, 6, 3, 4, c[17]);
    r(12 + leap, 7, 2, 2, c[30]);
    r(8 + leap, 10, 2, 4, c[10]);
    r(11 + leap, 11, 2, 3, c[10]);
    // Flaming Mane
    r(10 + leap, 6, 6, 5, flameTip);
    r(12 + leap, 4, 4, 3, flameTip);
    r(11 + leap, 9, 6, 7, c[29]);
    r(13 + leap, 8, 5, 8, c[30]);
    r(7 + leap, 18, 7, 6, c[19]);
    r(6 + leap, 19, 4, 4, c[9]);
    // Muscular Body & Tiger Stripes
    r(13, 12, 14, 9, c[18]);
    r(14, 13, 12, 7, c[19]);
    r(16, 12, 2, 7, c[10]);
    r(20, 13, 2, 6, c[10]);
    r(24, 14, 2, 5, c[10]);
    // Flame crest on spine
    r(15, 9, 3, 3, flameTip);
    r(19, 10, 3, 3, flameTip);
    r(23, 11, 3, 2, flameTip);
    // Paws & Claws
    r(6 + leap, 21, 4, 8, c[18]); r(4 + leap, 27, 6, 3, c[19]); r(3 + leap, 29, 3, 2, c[31]);
    r(11, 22, 4, 7, c[17]); r(10, 27, 5, 3, c[18]);
    r(21, 16, 6, 8, c[18]); r(22, 23, 4, 6, c[17]); r(21, 28, 5, 3, c[19]);
    r(25, 22, 3, 6, c[16]); r(25, 27, 4, 3, c[17]);
    // Long Fiery Tail
    r(27, 16, 3, 3, c[18]);
    r(29, 13, 2, 5, c[19]);
    r(28, 9, 2, 5, flameTip);
    r(27, 6, 4, 4, flameTip);
    r(28, 7, 2, 2, c[31]);
  },
  void_imp(r, c, pose, frame) {
    // กบอัคนี (Flame Toad) - Volcanic toad with pulsing molten throat & fiery tongue
    const atk = pose === 'attack';
    const puff = frame % 2 ? 1 : 0;
    const glow = atk ? c[31] : frame % 2 ? c[31] : c[30];
    // Bulging Eyes with golden slits
    r(7, 8, 5, 5, c[17]); r(8, 9, 3, 3, c[31]); r(9, 10, 1, 2, c[10]);
    r(20, 8, 5, 5, c[17]); r(21, 9, 3, 3, c[31]); r(22, 10, 1, 2, c[10]);
    // Head & Body
    r(8, 12, 16, 7, c[17]);
    r(6, 17, 20, 10, c[16]);
    // Mottled flame warts
    r(9, 13, 3, 3, c[19]); r(18, 14, 3, 3, c[19]); r(14, 11, 4, 3, c[18]);
    // Wide mouth
    r(8, 16, 16, 2, c[10]);
    // Pulsing molten throat sac
    r(11 - puff, 17, 10 + puff * 2, 8, glow);
    r(13, 19, 6, 4, c[31]);
    r(14, 20, 4, 2, c[9]);
    // Haunches & webbed feet
    r(4, 19, 5, 8, c[16]); r(23, 19, 5, 8, c[16]);
    r(8, 26, 4, 4, c[17]); r(6, 29, 6, 2, c[18]);
    r(20, 26, 4, 4, c[17]); r(20, 29, 6, 2, c[18]);
    // Attack: shoot fiery tongue!
    if (atk) {
      r(0, 15, 9, 3, c[18]);
      r(0, 15, 8, 2, c[31]);
      r(0, 14, 3, 4, c[31]);
    }
  },
  obsidian_golem(r, c, pose, frame) {
    // หมูป่าหินผา (Crag Boar) - Heavy stone boar with massive crag tusks
    const atk = pose === 'attack';
    const lk = atk ? 4 : frame % 2;
    // Rugged Head & Snout
    r(4 - (atk ? 3 : 0), 12, 10, 10, c[11]);
    r(6 - (atk ? 3 : 0), 13, 8, 8, c[12]);
    r(2 - (atk ? 3 : 0), 16, 4, 6, c[10]);
    r(1 - (atk ? 3 : 0), 18, 3, 3, c[11]);
    r(6 - (atk ? 3 : 0), 14, 2, 2, c[31]);
    r(11 - (atk ? 3 : 0), 9, 3, 4, c[11]);
    // Massive upward-curving crag tusks
    r(1 - (atk ? 3 : 0), 14, 3, 6, c[14]);
    r(0 - (atk ? 3 : 0), 12, 3, 4, c[15]);
    r(0 - (atk ? 3 : 0), 10, 2, 3, c[9]);
    // Heavy Crag Carapace & Spines on Spine
    r(10, 11, 18, 13, c[10]);
    r(12, 12, 15, 11, c[11]);
    r(11, 7, 3, 5, c[6]);
    r(16, 6, 4, 6, c[7]);
    r(22, 8, 3, 4, c[6]);
    r(14, 16, 4, 3, c[13]);
    r(20, 17, 4, 3, c[13]);
    // 4 legs with stone hooves
    r(6 - lk, 22, 4, 7, c[10]); r(5 - lk, 28, 5, 3, c[12]);
    r(11 + lk, 22, 3, 6, c[11]); r(11 + lk, 27, 4, 3, c[12]);
    r(19 - lk, 22, 4, 7, c[10]); r(19 - lk, 28, 5, 3, c[12]);
    r(24 + lk, 22, 3, 6, c[11]); r(24 + lk, 27, 4, 3, c[12]);
    r(28, 14, 2, 4, c[11]);
  },
  crown_archivist(r, c, pose, frame) {
    // เจ้าแห่งหอจารึก (The Crown Archivist - Floor 30★ Major Boss, auto 2x scale)
    const atk = pose === 'attack';
    const floatY = [0, -1, 0, 1][frame % 4];
    const light = atk ? c[31] : frame % 2 ? c[30] : c[31];
    // Radiant Golden Crown & Spires
    r(12, 2, 8, 5, c[30]);
    r(11, 0, 10, 3, c[31]);
    r(10, -1, 2, 3, c[9]);
    r(15, -2, 2, 4, c[9]);
    r(20, -1, 2, 3, c[9]);
    // Celestial Face & Arcane Eyes
    r(13, 6, 6, 6, c[15]);
    r(14, 7, 2, 2, c[31]);
    r(17, 7, 2, 2, c[31]);
    // Celestial Wings / Ethereal Mantle spreading wide
    r(2, 6 + floatY, 8, 18, c[21]);
    r(4, 8 + floatY, 6, 14, c[23]);
    r(1, 4 + floatY, 4, 6, c[31]);
    r(22, 6 + floatY, 8, 18, c[21]);
    r(22, 8 + floatY, 6, 14, c[23]);
    r(27, 4 + floatY, 4, 6, c[31]);
    // Grand Royal Robes & Golden Sash
    r(10, 11, 12, 18, c[20]);
    r(11, 13, 10, 15, c[22]);
    r(13, 12, 6, 17, c[30]);
    r(14, 13, 4, 15, c[31]);
    r(12, 21, 2, 2, c[31]);
    r(18, 21, 2, 2, c[31]);
    r(15, 25, 2, 2, c[9]);
    // Floating Runic Archive Tablets revolving around
    r(0, 13 + floatY, 5, 8, c[14]);
    r(1, 14 + floatY, 3, 6, light);
    r(27, 13 - floatY, 5, 8, c[14]);
    r(28, 14 - floatY, 3, 6, light);
    r(14, 4, 4, 2, c[9]);
  },

  // ==========================================
  // FLOORS 51–100 ENDGAME MONSTERS & BOSSES
  // ==========================================

  // --- Floors 51–55: Abyssal Depths (Water 💧) ---
  abyss_crawler(r, c, pose, frame) {
    const atk = pose === 'attack';
    const cl = atk ? 4 : 0;
    const lk = atk ? -1 : frame % 2;
    // Deepwater Teal Carapace
    r(8, 8, 16, 12, c[24]);
    r(10, 10, 12, 8, c[25]);
    r(13, 12, 6, 4, c[26]);
    // Eye stalks
    r(11, 5, 2, 4, c[25]); r(19, 5, 2, 4, c[25]);
    r(10, 4, 3, 2, c[31]); r(19, 4, 3, 2, c[31]);
    // Heavy Pincer Claws
    r(1 - cl, 7, 7, 7, c[24]); r(2 - cl, 6, 5, 4, c[26]);
    r(24 + cl, 7, 7, 7, c[24]); r(25 + cl, 6, 5, 4, c[26]);
    // 6 Scuttling legs
    r(6 - lk, 19, 3, 7, c[24]); r(10 + lk, 19, 3, 7, c[24]); r(14 - lk, 19, 3, 7, c[24]);
    r(18 + lk, 19, 3, 7, c[24]); r(22 - lk, 19, 3, 7, c[24]); r(26 + lk, 19, 3, 7, c[24]);
  },
  hydra_serpent(r, c, pose, frame) {
    const atk = pose === 'attack';
    const lunge = atk ? 4 : 0;
    const wave = [0, 1, 0, -1][frame % 4];
    // Serpentine Coiling Body
    r(6, 16 + wave, 14, 6, c[24]);
    r(12, 14 + wave, 14, 8, c[25]);
    r(8, 22, 16, 6, c[24]);
    // Neck & Crest
    r(18 - lunge, 8 + wave, 6, 10, c[25]);
    r(20 - lunge, 5 + wave, 4, 6, c[26]);
    r(19 - lunge, 2 + wave, 6, 4, c[27]); // Crown fin
    // Head & Fangs
    r(16 - lunge, 5 + wave, 8, 5, c[25]);
    r(15 - lunge, 7 + wave, 3, 2, c[31]); // Venom glow eyes
    if (atk) {
      r(12 - lunge, 9, 3, 4, c[9]); // Fangs
      r(10 - lunge, 10, 4, 2, c[27]); // Water jet
    }
  },
  leviathan_tide(r, c, pose, frame) {
    // พญานาคีสมุทร (Leviathan of the Deep - Floors 51–54 Boss)
    const atk = pose === 'attack';
    const floatY = [0, -1, 0, 1][frame % 4];
    const crest = atk ? c[31] : c[27];
    // Massive Oceanic Horned Crown & Frills
    r(8, 2 + floatY, 16, 5, c[20]);
    r(5, 0 + floatY, 6, 4, crest); r(21, 0 + floatY, 6, 4, crest);
    r(13, -2 + floatY, 6, 5, crest);
    // Leviathan Head & Radiant Sea Eyes
    r(10, 6 + floatY, 12, 10, c[24]);
    r(12, 7 + floatY, 8, 8, c[25]);
    r(9, 9 + floatY, 3, 3, c[31]); r(20, 9 + floatY, 3, 3, c[31]);
    // Powerful Armored Throat & Coils
    r(8, 16 + floatY, 16, 10, c[20]);
    r(10, 17 + floatY, 12, 8, c[25]);
    r(12, 18 + floatY, 8, 6, c[26]);
    // Tidal Water Spouts & Tail Flukes
    r(2, 20 + floatY, 8, 9, c[24]); r(3, 22 + floatY, 6, 6, c[27]);
    r(22, 20 + floatY, 8, 9, c[24]); r(23, 22 + floatY, 6, 6, c[27]);
    if (atk) {
      r(0, 10, 7, 12, c[27]); r(25, 10, 7, 12, c[27]); // Tidal Surge
    }
  },

  // --- Floors 56–60: Infernal Magma (Fire 🔥) ---
  magma_tortoise(r, c, pose, frame) {
    const atk = pose === 'attack';
    const glow = atk ? c[31] : frame % 2 ? c[19] : c[18];
    // Volcanic Basalt Carapace
    r(6, 8, 20, 14, c[10]);
    r(8, 6, 16, 16, c[11]);
    r(11, 4, 10, 18, c[12]);
    // Glowing Magma Fissures
    r(10, 9, 4, 3, glow); r(17, 10, 4, 4, glow);
    r(13, 14, 5, 4, glow); r(14, 6, 3, 3, glow);
    // Tortoise Head & Snapping Lava Beak
    r(24, 13, 6, 6, c[11]); r(27, 14, 2, 2, c[31]);
    // 4 Heavy Stumpy Legs
    r(6, 21, 5, 6, c[10]); r(12, 21, 4, 6, c[10]);
    r(17, 21, 5, 6, c[10]); r(23, 21, 4, 6, c[10]);
  },
  cinder_drake(r, c, pose, frame) {
    const atk = pose === 'attack';
    const flame = atk ? c[31] : frame % 2 ? c[19] : c[18];
    // Wing Spread
    r(2, 4, 8, 12, c[18]); r(3, 6, 6, 8, c[19]);
    r(22, 4, 8, 12, c[18]); r(23, 6, 6, 8, c[19]);
    // Dragon Body & Scaled Chest
    r(11, 8, 10, 13, c[17]);
    r(13, 10, 6, 9, c[18]);
    r(14, 12, 4, 5, flame);
    // Horned Head
    r(12, 2, 8, 6, c[17]);
    r(10, 0, 3, 4, c[12]); r(19, 0, 3, 4, c[12]);
    r(13, 4, 2, 2, c[31]); r(17, 4, 2, 2, c[31]);
    // Claws & Tail
    r(9, 21, 4, 6, c[11]); r(19, 21, 4, 6, c[11]);
    r(14, 21, 4, 8, c[17]);
    if (atk) r(10, 8, 12, 3, c[31]); // Fire breath
  },
  volcano_colossus(r, c, pose, frame) {
    // ยักษ์อัคนีภูเขาไฟ (The Volcanic Colossus - Floor 60★ Major Boss, auto 2x scale)
    const atk = pose === 'attack';
    const core = atk ? c[31] : frame % 2 ? c[19] : c[30];
    const arm = atk ? 4 : 0;
    // Volcanic Crater Crown spewing smoke & lava
    r(10, 1, 12, 4, c[10]);
    r(12, -1, 8, 3, c[18]); r(14, -2, 4, 2, c[31]);
    // Heavy Molten Rock Shoulders
    r(2, 6 - arm, 9, 9, c[11]); r(4, 8 - arm, 5, 5, core);
    r(21, 6, 9, 9, c[11]); r(23, 8, 5, 5, core);
    // Colossus Head & Fiery Slit Eyes
    r(11, 5, 10, 6, c[10]);
    r(13, 6, 2, 2, c[31]); r(17, 6, 2, 2, c[31]);
    // Massive Torso with Magma Fissures
    r(7, 11, 18, 13, c[10]);
    r(9, 13, 14, 9, c[12]);
    r(13, 12, 5, 10, core); r(10, 15, 11, 3, core);
    // Massive Fists & Shockwave
    r(1, 15 - arm, 7, 12, c[11]); r(24, 15, 7, 12, c[11]);
    r(8, 24, 6, 7, c[10]); r(18, 24, 6, 7, c[10]);
    if (atk) {
      r(0, 26, 32, 4, c[31]); // Ground volcanic eruption wave
    }
  },

  // --- Floors 61–65: Gale Peaks (Wind 💨) ---
  gale_harpy(r, c, pose, frame) {
    const atk = pose === 'attack';
    const flap = [0, -2, 0, 2][frame % 4];
    // Feathered Gale Wings
    r(1, 6 + flap, 10, 14, c[25]); r(3, 8 + flap, 6, 10, c[26]);
    r(21, 6 - flap, 10, 14, c[25]); r(23, 8 - flap, 6, 10, c[26]);
    // Harpy Torso & Feathers
    r(12, 8, 8, 12, c[24]); r(13, 10, 6, 8, c[26]);
    // Avian Crown & Eyes
    r(12, 2, 8, 6, c[25]);
    r(10, 0, 4, 4, c[27]); r(18, 0, 4, 4, c[27]);
    r(14, 4, 2, 2, c[31]); r(17, 4, 2, 2, c[31]);
    // Razor Talons
    r(10, 20, 4, 7, c[29]); r(18, 20, 4, 7, c[29]);
    if (atk) {
      r(6, 12, 20, 2, c[27]); // Wind slash arc
    }
  },
  cloud_elemental(r, c, pose, frame) {
    const atk = pose === 'attack';
    const spin = frame % 2 ? 1 : -1;
    const eye = atk ? c[31] : c[9];
    // Swirling Cloud Mist
    r(8 + spin, 6, 16, 10, c[26]);
    r(6 - spin, 10, 20, 12, c[27]);
    r(10, 4, 12, 8, c[8]);
    r(12, 14, 8, 6, c[9]);
    // Core Cyclone Vortex
    r(14, 9, 4, 4, eye);
    r(4, 16 + spin, 6, 4, c[26]); r(22, 16 - spin, 6, 4, c[26]);
    r(9, 22, 14, 5, c[25]);
  },
  storm_roc(r, c, pose, frame) {
    // วิหคสายลมคำราม (Storm Roc - Floors 61–64 Boss)
    const atk = pose === 'attack';
    const flap = atk ? 4 : [0, -2, 0, 2][frame % 4];
    // Giant Gale Wingspan
    r(0, 3 + flap, 12, 16, c[21]); r(2, 5 + flap, 8, 12, c[23]);
    r(20, 3 - flap, 12, 16, c[21]); r(22, 5 - flap, 8, 12, c[23]);
    // Roc Body & Plumed Crest
    r(11, 7, 10, 14, c[20]); r(13, 9, 6, 10, c[22]);
    r(12, 1, 8, 6, c[22]);
    r(10, -2, 4, 4, c[31]); r(18, -2, 4, 4, c[31]); // Feather spikes
    r(13, 3, 2, 2, c[31]); r(17, 3, 2, 2, c[31]); // Golden eyes
    r(14, 5, 4, 3, c[30]); // Hook beak
    // Talons & Gale Ring
    r(9, 21, 4, 7, c[30]); r(19, 21, 4, 7, c[30]);
    if (atk) r(4, 15, 24, 3, c[31]); // Sonic shockwave
  },

  // --- Floors 66–70: Thunder Wastes (Lightning ⚡) ---
  sand_stalker(r, c, pose, frame) {
    const atk = pose === 'attack';
    const stingY = atk ? -2 : frame % 2;
    // Desert Scorpion Body
    r(9, 12, 14, 10, c[13]);
    r(11, 14, 10, 6, c[14]);
    // Twin Electrified Pincers
    r(3, 7, 6, 7, c[12]); r(4, 5, 4, 4, c[30]);
    r(23, 7, 6, 7, c[12]); r(24, 5, 4, 4, c[30]);
    // Arched Stinger Tail
    r(13, 8, 6, 5, c[13]);
    r(15, 4, 4, 5, c[14]);
    r(16, 1 + stingY, 5, 4, c[30]);
    r(19, 0 + stingY, 3, 3, c[31]); // Golden Stinger
    // 6 Scuttling legs
    r(6, 21, 3, 6, c[12]); r(11, 21, 3, 6, c[12]); r(18, 21, 3, 6, c[12]); r(23, 21, 3, 6, c[12]);
  },
  spark_wraith(r, c, pose, frame) {
    const atk = pose === 'attack';
    const flicker = frame % 2 ? c[31] : c[30];
    // Crackling Electrical Body
    r(13, 3, 6, 6, flicker);
    r(14, 5, 2, 2, c[9]);
    // Jagged Lightning Torso
    r(11, 9, 10, 6, c[29]);
    r(13, 11, 6, 8, flicker);
    r(10, 16, 8, 4, c[30]);
    r(12, 19, 6, 6, flicker);
    r(14, 24, 3, 5, c[31]);
    // Arc Hands
    r(5, 8, 6, 4, flicker); r(2, 6, 4, 3, c[31]);
    r(21, 8, 6, 4, flicker); r(26, 6, 4, 3, c[31]);
  },
  thunder_drake_emperor(r, c, pose, frame) {
    // จักรพรรดิมังกรอสุนี (Emperor Thunder Drake - Floor 70★ Major Boss, auto 2x scale)
    const atk = pose === 'attack';
    const bolt = atk ? c[31] : frame % 2 ? c[30] : c[31];
    const flap = atk ? 3 : 0;
    // Colossal Electrified Wings
    r(1, 2 + flap, 11, 16, c[12]); r(3, 4 + flap, 7, 12, bolt);
    r(20, 2 - flap, 11, 16, c[12]); r(22, 4 - flap, 7, 12, bolt);
    // Dragon Horns & Imperial Crown
    r(12, 1, 8, 6, c[13]);
    r(9, -2, 4, 5, bolt); r(19, -2, 4, 5, bolt); // Jagged lightning horns
    r(13, 3, 2, 2, c[31]); r(17, 3, 2, 2, c[31]);
    // Dragon Armor Plate Torso
    r(9, 7, 14, 14, c[10]); r(11, 9, 10, 10, c[13]);
    r(13, 11, 6, 7, bolt);
    // Emperor Fists & Lightning Orbs
    r(5, 15, 6, 9, c[12]); r(21, 15, 6, 9, c[12]);
    r(3, 17, 4, 4, bolt); r(25, 17, 4, 4, bolt);
    r(9, 22, 5, 8, c[10]); r(18, 22, 5, 8, c[10]);
    if (atk) {
      r(0, 18, 32, 3, c[31]); // Chain lightning burst
    }
  },

  // --- Floors 71–75: Glacial Permafrost (Ice ❄️) ---
  frost_crystal_golem(r, c, pose, frame) {
    const atk = pose === 'attack';
    const core = atk ? c[31] : frame % 2 ? c[27] : c[26];
    // Geometric Ice Crystals
    r(11, 2, 10, 6, c[25]);
    r(12, 0, 3, 3, c[27]); r(17, 0, 3, 3, c[27]);
    r(13, 4, 2, 2, c[31]); r(17, 4, 2, 2, c[31]);
    // Crystalline Shoulder Pads
    r(3, 6, 8, 8, c[24]); r(4, 4, 6, 4, c[27]);
    r(21, 6, 8, 8, c[24]); r(22, 4, 6, 4, c[27]);
    // Solid Ice Torso & Core
    r(8, 10, 16, 12, c[24]);
    r(10, 11, 12, 10, c[25]);
    r(13, 13, 6, 6, core);
    // Frost Fists & Legs
    r(2, 14, 6, 10, c[25]); r(24, 14, 6, 10, c[25]);
    r(9, 22, 5, 8, c[24]); r(18, 22, 5, 8, c[24]);
  },
  blizzard_wolf(r, c, pose, frame) {
    const atk = pose === 'attack';
    const lunge = atk ? 4 : 0;
    const lk = atk ? -1 : frame % 2;
    // Glacial Fur Body
    r(8 - lunge, 12, 16, 9, c[8]);
    r(10 - lunge, 13, 12, 7, c[9]);
    // Wolf Head & Ice Eyes
    r(20 - lunge, 7, 8, 7, c[8]);
    r(22 - lunge, 5, 3, 3, c[27]); // Pointed ears
    r(24 - lunge, 8, 2, 2, c[31]); // Ice glow eye
    r(26 - lunge, 10, 4, 3, c[9]); // Frost muzzle
    // 4 Wolf Legs
    r(7 - lunge - lk, 21, 4, 7, c[7]); r(12 - lunge + lk, 21, 4, 7, c[8]);
    r(17 - lunge - lk, 21, 4, 7, c[7]); r(21 - lunge + lk, 21, 4, 7, c[8]);
    r(4 - lunge, 12, 4, 4, c[27]); // Plumed ice tail
  },
  glacial_hydra(r, c, pose, frame) {
    // ไฮดราน้ำแข็งพันปี (Glacial Hydra - Floors 71–74 Boss)
    const atk = pose === 'attack';
    const wave = [0, 1, 0, -1][frame % 4];
    // Massive Frozen Body
    r(8, 16, 16, 10, c[24]); r(10, 18, 12, 7, c[25]);
    // 3 Serpentine Ice Necks & Heads
    // Left Head
    r(4, 8 + wave, 5, 8, c[25]); r(2, 5 + wave, 6, 5, c[26]);
    r(3, 7 + wave, 2, 2, c[31]);
    // Center Head (Main)
    r(13, 5 - wave, 6, 11, c[25]); r(12, 1 - wave, 8, 6, c[27]);
    r(14, 3 - wave, 2, 2, c[31]); r(17, 3 - wave, 2, 2, c[31]);
    // Right Head
    r(23, 8 + wave, 5, 8, c[25]); r(24, 5 + wave, 6, 5, c[26]);
    r(26, 7 + wave, 2, 2, c[31]);
    // Frozen Claws
    r(6, 24, 6, 6, c[24]); r(20, 24, 6, 6, c[24]);
    if (atk) r(0, 12, 32, 3, c[27]); // Triple frost breath
  },

  // --- Floors 76–80: Toxic Overgrowth & Earth Catacomb (Earth 🪨) ---
  venom_spore_beast(r, c, pose, frame) {
    const atk = pose === 'attack';
    const glow = atk ? c[31] : frame % 2 ? c[27] : c[7];
    // Fungus Carapace & Spore Caps
    r(6, 10, 20, 11, c[5]);
    r(8, 6, 7, 6, c[6]); r(9, 4, 5, 3, glow); // Left Mushroom Cap
    r(17, 5, 8, 7, c[6]); r(18, 3, 6, 3, glow); // Right Mushroom Cap
    // Toxic Eyes & Jaws
    r(22, 13, 6, 6, c[5]); r(25, 14, 2, 2, c[31]);
    // 4 Sturdy Claws
    r(6, 21, 4, 7, c[4]); r(11, 21, 4, 7, c[4]);
    r(17, 21, 4, 7, c[4]); r(22, 21, 4, 7, c[4]);
    if (atk) r(20, 10, 10, 4, c[7]); // Spore Cloud
  },
  crag_titan_sentinel(r, c, pose, frame) {
    const atk = pose === 'attack';
    // Monolithic Stone Body
    r(8, 2, 16, 6, c[4]); r(12, 4, 3, 2, c[31]); r(17, 4, 2, 2, c[31]);
    // Giant Stone Tower Shield
    r(2, 6, 8, 18, c[5]); r(4, 8, 4, 14, c[6]);
    // Runic Stone Body
    r(10, 8, 14, 14, c[4]); r(12, 10, 10, 10, c[5]);
    r(14, 12, 6, 6, c[7]); // Green Moss rune
    // Right Boulder Fist & Legs
    r(22, 10, 7, 12, c[4]); r(23, 12, 5, 8, c[5]);
    r(9, 22, 5, 8, c[3]); r(18, 22, 5, 8, c[3]);
  },
  ancient_chitin_behemoth(r, c, pose, frame) {
    // เบฮีมอธเกราะปฐพี (Ancient Chitin Behemoth - Floor 80★ Major Boss, auto 2x scale)
    const atk = pose === 'attack';
    const slam = atk ? 4 : 0;
    // Ancient Multi-Layer Spiked Carapace
    r(5, 5, 22, 15, c[4]);
    r(7, 3, 18, 18, c[5]);
    r(9, 1, 14, 20, c[6]);
    // Hardened Spine Crests
    r(11, -2, 3, 4, c[12]); r(18, -2, 3, 4, c[12]);
    r(3, 2, 4, 5, c[12]); r(25, 2, 4, 5, c[12]);
    // Behemoth Head & Ancient Amber Eyes
    r(10, 9, 12, 7, c[3]);
    r(12, 10, 3, 2, c[30]); r(17, 10, 3, 2, c[30]);
    // Colossal Spiked Front Legs
    r(1, 14 + slam, 7, 14, c[4]); r(2, 16 + slam, 5, 10, c[6]);
    r(24, 14, 7, 14, c[4]); r(25, 16, 5, 10, c[6]);
    // Heavy Hind Legs
    r(8, 22, 6, 8, c[3]); r(18, 22, 6, 8, c[3]);
    if (atk) {
      r(0, 26, 32, 4, c[7]); // Earth seismic fracture
    }
  },

  // --- Floors 81–85: Solar Citadel (Fire/Light 🔥) ---
  solar_sentinel(r, c, pose, frame) {
    const atk = pose === 'attack';
    const core = atk ? c[31] : frame % 2 ? c[30] : c[15];
    // Golden Armor & Solar Crown
    r(11, 2, 10, 6, c[14]);
    r(13, 0, 6, 3, c[31]);
    r(13, 4, 6, 3, c[31]); // Solar Visor
    // Radiant Shoulder Pauldrons
    r(3, 6, 8, 8, c[13]); r(4, 7, 6, 6, c[30]);
    r(21, 6, 8, 8, c[13]); r(22, 7, 6, 6, c[30]);
    // Central Solar Engine Core
    r(8, 10, 16, 12, c[13]); r(10, 11, 12, 10, c[14]);
    r(13, 13, 6, 6, core);
    // Solar Cannons
    r(2, 14, 6, 11, c[14]); r(24, 14, 6, 11, c[14]);
    r(9, 22, 5, 8, c[12]); r(18, 22, 5, 8, c[12]);
    if (atk) {
      r(0, 18, 5, 3, c[31]); r(27, 18, 5, 3, c[31]); // Solar Beams
    }
  },
  radiant_phoenix(r, c, pose, frame) {
    const atk = pose === 'attack';
    const flap = atk ? 4 : [0, -2, 0, 2][frame % 4];
    // Solar Wings of Fire
    r(0, 4 + flap, 12, 15, c[18]); r(2, 6 + flap, 8, 11, c[30]);
    r(20, 4 - flap, 12, 15, c[18]); r(22, 6 - flap, 8, 11, c[30]);
    // Phoenix Body & Radiant Feathers
    r(11, 7, 10, 13, c[19]); r(13, 9, 6, 9, c[31]);
    // Golden Crest & Crown
    r(12, 1, 8, 6, c[30]);
    r(14, -2, 4, 4, c[31]);
    r(13, 3, 2, 2, c[31]); r(17, 3, 2, 2, c[31]);
    // Flaming Tail Streamers
    r(12, 20, 8, 10, c[18]); r(14, 22, 4, 8, c[31]);
  },
  sun_archon(r, c, pose, frame) {
    // อัครทูตแห่งดวงอาทิตย์ (Sun Archon - Floors 81–84 Boss)
    const atk = pose === 'attack';
    const floatY = [0, -1, 0, 1][frame % 4];
    // Radiant Sun Halo
    r(9, -2 + floatY, 14, 14, c[30]);
    r(11, 0 + floatY, 10, 10, c[31]);
    // Celestial Wings of Light
    r(1, 5 + floatY, 9, 16, c[30]); r(3, 7 + floatY, 6, 12, c[31]);
    r(22, 5 + floatY, 9, 16, c[30]); r(23, 7 + floatY, 6, 12, c[31]);
    // Golden Plate Archon Armor
    r(11, 6 + floatY, 10, 14, c[14]); r(13, 8 + floatY, 6, 10, c[15]);
    r(13, 3 + floatY, 6, 5, c[15]);
    r(14, 4 + floatY, 2, 2, c[31]); r(17, 4 + floatY, 2, 2, c[31]);
    // Blazing Solar Sword
    r(25, 2 + floatY, 3, 20, c[31]); r(24, 12 + floatY, 5, 2, c[30]);
    r(10, 20 + floatY, 12, 8, c[13]);
  },

  // --- Floors 86–90: Abyssal Shadow Necropolis (Void/Shadow 🌌) ---
  dread_reaper(r, c, pose, frame) {
    const atk = pose === 'attack';
    const floatY = [0, -1, 0, 1][frame % 4];
    // Dark Shadow Hood
    r(10, 2 + floatY, 12, 8, c[20]);
    r(12, 4 + floatY, 8, 5, c[0]);
    r(13, 5 + floatY, 2, 2, c[18]); r(17, 5 + floatY, 2, 2, c[18]); // Crimson eyes
    // Tattered Void Cloak
    r(8, 10 + floatY, 16, 16, c[20]);
    r(10, 12 + floatY, 12, 12, c[21]);
    r(9, 25 + floatY, 14, 4, c[20]);
    // Ethereal Reaper Scythe
    r(23, 1 + floatY, 2, 26, c[12]);
    r(17, 0 + floatY, 9, 3, c[31]);
    r(15, 2 + floatY, 4, 3, c[23]);
    if (atk) r(8, 12, 14, 4, c[18]); // Scythe slash
  },
  void_devourer(r, c, pose, frame) {
    const atk = pose === 'attack';
    const maw = atk ? 4 : frame % 2 ? 2 : 0;
    // Eldritch Cosmic Maw
    r(6, 6, 20, 18, c[20]);
    r(8, 8, 16, 14, c[21]);
    // Gaping Void Abyss
    r(10, 10 - maw, 12, 10 + maw * 2, c[0]);
    // Sharp Void Teeth
    r(11, 10 - maw, 2, 3, c[9]); r(15, 10 - maw, 2, 3, c[9]); r(19, 10 - maw, 2, 3, c[9]);
    r(12, 16 + maw, 2, 3, c[9]); r(16, 16 + maw, 2, 3, c[9]);
    // Shadow Tentacles
    r(2, 14, 5, 8, c[21]); r(25, 14, 5, 8, c[21]);
    r(8, 23, 6, 6, c[20]); r(18, 23, 6, 6, c[20]);
  },
  nether_dread_lord(r, c, pose, frame) {
    // จอมอสูรนรกานต์ (Nether Dread Lord - Floor 90★ Major Boss, auto 2x scale)
    const atk = pose === 'attack';
    const glow = atk ? c[31] : c[18];
    // Colossal Arch-Demon Horns
    r(11, 2, 10, 7, c[20]);
    r(7, -2, 4, 6, c[17]); r(21, -2, 4, 6, c[17]); // Great Curving Horns
    r(5, -4, 3, 4, c[18]); r(24, -4, 3, 4, c[18]);
    r(13, 4, 2, 2, glow); r(17, 4, 2, 2, glow); // Demon Eyes
    // Massive Void Wings
    r(0, 3, 11, 18, c[20]); r(2, 5, 7, 14, c[21]);
    r(21, 3, 11, 18, c[20]); r(23, 5, 7, 14, c[21]);
    // Nether Armor Plate & Soul Core
    r(8, 9, 16, 14, c[20]); r(10, 11, 12, 10, c[21]);
    r(13, 12, 6, 7, glow);
    // Armored Claws
    r(4, 15, 6, 11, c[17]); r(22, 15, 6, 11, c[17]);
    r(8, 23, 6, 8, c[20]); r(18, 23, 6, 8, c[20]);
    if (atk) {
      r(0, 20, 32, 5, c[18]); // Nether soul fire eruption
    }
  },
  nether_leech_pillar(r, c, pose, frame) {
    // เสาดูดวิญญาณ (Floor 90★ Soul Leech Pillar — Wind / Spectral Violet)
    const atk = pose === 'attack';
    const pulse = [0, -1, 0, 1][frame % 4];
    const orb = atk ? c[31] : frame % 2 ? c[23] : c[27];
    // Obsidian Stepped Pedestal & Rune Base
    r(6, 26, 20, 5, c[20]);
    r(8, 24, 16, 3, c[21]);
    // Tapered Shadow-Stone Obelisk Shaft
    r(10, 8, 12, 17, c[20]);
    r(11, 9, 10, 15, c[21]);
    // Glowing Soul Conduit Runes
    r(14, 12, 4, 10, c[22]);
    r(15, 13, 2, 8, orb);
    // Crown Pincers cradling floating Soul Orb
    r(8, 4, 3, 7, c[20]); r(21, 4, 3, 7, c[20]);
    r(9, 2, 2, 4, c[22]); r(21, 2, 2, 4, c[22]);
    r(12, 2 + pulse, 8, 6, c[22]);
    r(14, 3 + pulse, 4, 4, orb);
    r(15, 4 + pulse, 2, 2, c[9]);
    // Orbiting Spectral Soul Wisps
    r(4, 11 + pulse, 3, 3, c[23]); r(25, 15 - pulse, 3, 3, c[23]);
    r(5, 12 + pulse, 1, 1, c[9]); r(26, 16 - pulse, 1, 1, c[9]);
    if (atk) {
      r(2, 5, 28, 3, c[23]); // Spectral siphon beam
    }
  },
  nether_curse_pillar(r, c, pose, frame) {
    // เสาคำสาปต้องห้าม (Floor 90★ Forbidden Curse Pillar — Fire / Crimson-Black)
    const atk = pose === 'attack';
    const blink = frame % 4 === 2 && !atk;
    const eye = atk ? c[31] : c[18];
    // Charred Iron Base & Seal Chains
    r(6, 26, 20, 5, c[0]);
    r(8, 24, 16, 3, c[17]);
    // Jagged Crimson-Black Monolith
    r(9, 6, 14, 19, c[20]);
    r(11, 4, 10, 21, c[0]);
    r(13, 1, 6, 4, c[17]); // Spiked Crest
    // Blazing Cursed Eye in center
    r(11, 9, 10, 6, c[19]);
    r(12, 10, 8, 4, eye);
    if (!blink) {
      r(15, 10, 2, 4, c[0]); // Vertical slit pupil
      r(14, 11, 1, 1, c[31]); // Glint
    } else {
      r(12, 11, 8, 2, c[17]);
    }
    // Glowing Forbidden Seal Chains wrapping pillar
    r(7, 17, 18, 2, c[18]);
    r(8, 20, 16, 2, c[16]);
    r(6, 15, 3, 3, c[30]); r(23, 19, 3, 3, c[30]);
    if (atk) {
      r(4, 9, 24, 2, c[18]);
      r(11, 16, 10, 6, c[16]); // Curse sigil flare
    }
  },
  nether_doom_pillar(r, c, pose, frame) {
    // เสาพิพากษานรกานต์ (Floor 90★ Nether Doom Pillar — Ice / Indigo-Frost)
    const atk = pose === 'attack';
    const hum = [0, 1, 0, -1][frame % 4];
    const core = atk ? c[31] : frame % 2 ? c[27] : c[26];
    // Heavy Frost-Iron Pedestal
    r(5, 26, 22, 5, c[24]);
    r(7, 24, 18, 3, c[25]);
    // Twin Underworld Gate Spires
    r(7, 4, 6, 21, c[20]); r(8, 5, 4, 19, c[24]);
    r(19, 4, 6, 21, c[20]); r(20, 5, 4, 19, c[24]);
    r(8, 1, 4, 4, c[26]); r(20, 1, 4, 4, c[26]); // Frost horn tips
    // Central Arcane Conduit & Blasting Core
    r(13, 8, 6, 16, c[21]);
    r(14, 7 + hum, 4, 10, c[25]);
    r(13, 10 + hum, 6, 6, core);
    r(15, 12 + hum, 2, 2, c[9]);
    // Floating Frost Shards flanking gate
    r(3, 9 - hum, 3, 5, c[26]); r(26, 9 + hum, 3, 5, c[26]);
    r(4, 10 - hum, 1, 3, c[9]); r(27, 10 + hum, 1, 3, c[9]);
    if (atk) {
      r(0, 11, 32, 4, c[27]); // Doom Judgment Beam
      r(0, 12, 32, 2, c[9]);
    }
  },

  // --- Floors 91–95: Chamber of Cosmic Chaos (Cosmic 🌌) ---
  chaos_weaver(r, c, pose, frame) {
    const atk = pose === 'attack';
    const floatY = [0, -1, 0, 1][frame % 4];
    // Cosmic Mystic Robes
    r(10, 6 + floatY, 12, 16, c[20]); r(12, 8 + floatY, 8, 12, c[22]);
    r(12, 1 + floatY, 8, 6, c[21]);
    r(14, 3 + floatY, 2, 2, c[31]); r(17, 3 + floatY, 2, 2, c[31]);
    // Four Multi-Armed Prismatic Orbs
    r(2, 6 + floatY, 6, 4, c[21]); r(1, 4 + floatY, 4, 4, c[19]); // Fire Orb
    r(24, 6 + floatY, 6, 4, c[21]); r(27, 4 + floatY, 4, 4, c[27]); // Ice Orb
    r(3, 15 + floatY, 6, 4, c[21]); r(1, 14 + floatY, 4, 4, c[30]); // Lightning Orb
    r(23, 15 + floatY, 6, 4, c[21]); r(27, 14 + floatY, 4, 4, c[7]); // Earth Orb
    r(10, 22 + floatY, 12, 6, c[20]);
  },
  astral_chimera(r, c, pose, frame) {
    const atk = pose === 'attack';
    const lunge = atk ? 4 : 0;
    // Starlit Chimera Lion Body
    r(8 - lunge, 11, 16, 10, c[21]); r(10 - lunge, 13, 12, 7, c[23]);
    // Celestial Dragon Wings
    r(3 - lunge, 4, 8, 9, c[22]); r(19 - lunge, 4, 8, 9, c[22]);
    // Lion Head & Starlight Mane
    r(20 - lunge, 6, 9, 9, c[22]);
    r(22 - lunge, 4, 3, 3, c[31]); // Starlight ears
    r(24 - lunge, 8, 2, 2, c[31]); // Twinkling Star Eye
    // Serpent Tail
    r(2 - lunge, 9, 6, 5, c[23]); r(0 - lunge, 7, 4, 4, c[27]);
    // Starlit Paws
    r(7 - lunge, 21, 4, 7, c[20]); r(12 - lunge, 21, 4, 7, c[21]);
    r(17 - lunge, 21, 4, 7, c[20]); r(21 - lunge, 21, 4, 7, c[21]);
  },
  primordial_avatar(r, c, pose, frame) {
    // อวตารปฐมกาล (Primordial Avatar - Floors 91–94 Boss)
    const atk = pose === 'attack';
    const floatY = [0, -1, 0, 1][frame % 4];
    const rot = frame % 4;
    // Cosmic Crown & Halo
    r(13, 4 + floatY, 6, 3, c[31]);
    r(10, 6 + floatY, 12, 2, c[22]);
    // Cosmic Core
    r(11, 8 + floatY, 10, 10, c[21]);
    r(13, 10 + floatY, 6, 6, c[31]);
    r(15, 12 + floatY, 2, 2, c[9]);
    // Four Rotating Elemental Satellite Rings
    r(14 + (rot === 0 ? 8 : rot === 2 ? -8 : 0), 1 + floatY, 4, 4, c[19]); // Fire
    r(14 + (rot === 1 ? 8 : rot === 3 ? -8 : 0), 22 + floatY, 4, 4, c[27]); // Ice
    r(2 + (rot === 2 ? 4 : 0), 11 + floatY, 4, 4, c[30]); // Lightning
    r(26 - (rot === 0 ? 4 : 0), 11 + floatY, 4, 4, c[7]); // Earth
    // Ethereal Genesis Robes
    r(9, 18 + floatY, 14, 9, c[20]);
    r(11, 20 + floatY, 10, 8, c[23]);
    if (atk) r(6, 12, 20, 2, c[31]);
  },

  // --- Floors 96–100: The Celestial Zenith (Endgame Climax 🌌) ---
  zenith_templar(r, c, pose, frame) {
    const atk = pose === 'attack';
    // Star Crest Helm
    r(11, 1, 10, 6, c[25]);
    r(13, -2, 6, 4, c[31]); // Starlight Crest
    r(13, 3, 6, 2, c[31]); // Visor
    // Grand Knight Pauldrons
    r(3, 5, 8, 8, c[24]); r(4, 6, 6, 6, c[27]);
    r(21, 5, 8, 8, c[24]); r(22, 6, 6, 6, c[27]);
    // Starlight Heavy Plate
    r(8, 9, 16, 13, c[24]); r(10, 11, 12, 9, c[26]);
    r(13, 12, 6, 7, c[31]);
    // Astral Greatsword
    r(25, 0, 3, 24, c[31]); r(23, 10, 7, 2, c[30]);
    r(8, 22, 6, 8, c[23]); r(18, 22, 6, 8, c[23]);
    if (atk) r(2, 10, 20, 3, c[31]); // Blade arc
  },
  chronos_keeper(r, c, pose, frame) {
    const atk = pose === 'attack';
    const floatY = [0, -1, 0, 1][frame % 4];
    // Floating Golden Sundial / Hourglass Halo
    r(8, -2 + floatY, 16, 16, c[30]);
    r(10, 0 + floatY, 12, 12, c[31]);
    // Timeless Celestial Face
    r(12, 4 + floatY, 8, 6, c[26]);
    r(14, 5 + floatY, 2, 2, c[9]); r(17, 5 + floatY, 2, 2, c[9]);
    // Robes of Eternity
    r(9, 10 + floatY, 14, 15, c[24]); r(11, 12 + floatY, 10, 11, c[26]);
    // Temporal Staff
    r(25, 1 + floatY, 2, 26, c[30]);
    r(23, -1 + floatY, 6, 4, c[31]); // Hourglass tip
    r(10, 24 + floatY, 12, 5, c[23]);
  },
  eternity_overlord(r, c, pose, frame) {
    // มหาเทพราชันอนันตกาล (The Overlord of Eternity - Floor 100★★★ Ultimate Final Boss, auto 2x scale)
    const atk = pose === 'attack';
    const floatY = [0, -1, 0, 1][frame % 4];
    const light = atk ? c[31] : frame % 2 ? c[30] : c[31];
    // Triple Halo of Transcendent Eternity
    r(6, -4 + floatY, 20, 20, c[30]);
    r(8, -2 + floatY, 16, 16, c[31]);
    r(10, 0 + floatY, 12, 12, c[9]);
    // Imperial Crown of the Cosmos
    r(11, 1 + floatY, 10, 5, c[31]);
    r(9, -2 + floatY, 3, 4, c[31]); r(14, -3 + floatY, 4, 5, c[31]); r(20, -2 + floatY, 3, 4, c[31]);
    // Divine Face & Transcendent Starlight Eyes
    r(12, 5 + floatY, 8, 7, c[15]);
    r(13, 7 + floatY, 2, 2, c[31]); r(17, 7 + floatY, 2, 2, c[31]);
    // Cosmic Prism Wings spreading across reality
    r(0, 3 + floatY, 10, 20, c[23]); r(2, 5 + floatY, 7, 15, c[31]);
    r(22, 3 + floatY, 10, 20, c[23]); r(23, 5 + floatY, 7, 15, c[31]);
    // Overlord Mantle of Reality & Starlight Robes
    r(8, 11 + floatY, 16, 17, c[20]);
    r(10, 13 + floatY, 12, 14, c[22]);
    r(12, 12 + floatY, 8, 16, c[30]);
    r(14, 13 + floatY, 4, 15, light);
    // 4 Floating Reality Shuttles / Cosmic Runes
    r(1, 13 + floatY, 4, 6, c[19]); // Reality Rune 1 (Fire)
    r(27, 13 - floatY, 4, 6, c[27]); // Reality Rune 2 (Ice)
    r(3, 21 + floatY, 4, 5, c[30]); // Reality Rune 3 (Lightning)
    r(25, 21 - floatY, 4, 5, c[7]); // Reality Rune 4 (Earth)
    // Scepter of Eternity
    r(24, 0 + floatY, 2, 28, c[30]);
    r(22, -2 + floatY, 6, 4, light);
    if (atk) {
      r(0, 25, 32, 5, c[31]); // Transcendent Reality Wave
    }
  },
  eternity_reborn(r, c, pose, frame) {
    // มหาเทพอนันตกาล · ร่างจุตินิรันดร์ (Eternity Reborn - Floor 100★★★ Secret Phase 3 True Form, auto 2x scale)
    const atk = pose === 'attack';
    const floatY = [0, -1, -2, -1][frame % 4];
    const pulse = atk ? c[9] : frame % 2 ? c[31] : c[30];
    const prism = [c[19], c[27], c[31], c[7]][frame % 4];
    // Radiant Outer Supernova Halo Ring & Star Spikes
    r(4, -5 + floatY, 24, 2, c[30]);
    r(4, 15 + floatY, 24, 2, c[30]);
    r(3, -3 + floatY, 2, 18, c[31]); r(27, -3 + floatY, 2, 18, c[31]);
    r(14, -8 + floatY, 4, 4, c[9]); // Zenith Star Spire
    r(7, -6 + floatY, 3, 3, c[31]); r(22, -6 + floatY, 3, 3, c[31]);
    // Six Transcendent Seraphim Wings (Upper, Mid, Lower Prismatic Pairs)
    r(0, 0 + floatY, 9, 6, c[31]); r(2, 1 + floatY, 6, 4, c[9]);
    r(23, 0 + floatY, 9, 6, c[31]); r(24, 1 + floatY, 6, 4, c[9]);
    r(-2, 7 + floatY, 10, 8, c[23]); r(0, 9 + floatY, 7, 5, c[30]);
    r(24, 7 + floatY, 10, 8, c[23]); r(25, 9 + floatY, 7, 5, c[30]);
    r(1, 16 + floatY, 8, 8, c[22]); r(3, 18 + floatY, 5, 5, c[27]);
    r(23, 16 + floatY, 8, 8, c[22]); r(24, 18 + floatY, 5, 5, c[27]);
    // Shattered Prismatic Diadem & Ascended Visage
    r(10, 0 + floatY, 12, 4, c[30]);
    r(11, -3 + floatY, 2, 4, c[9]); r(15, -4 + floatY, 2, 5, c[9]); r(19, -3 + floatY, 2, 4, c[9]);
    r(12, 4 + floatY, 8, 6, c[9]);
    r(13, 6 + floatY, 2, 2, c[23]); r(17, 6 + floatY, 2, 2, c[23]); // Void-star eyes
    // Ascended Golden-Void Armor & Supernova Heart Core
    r(9, 10 + floatY, 14, 15, c[20]);
    r(11, 11 + floatY, 10, 13, c[30]);
    r(12, 12 + floatY, 8, 9, c[22]);
    r(13, 13 + floatY, 6, 6, pulse);
    r(14, 14 + floatY, 4, 4, prism);
    r(15, 15 + floatY, 2, 2, c[9]);
    // Twin Orbiting Chronos Time-Blades
    r(4, 10 - floatY, 2, 16, c[31]); r(3, 14 - floatY, 4, 2, c[9]);
    r(26, 10 + floatY, 2, 16, c[31]); r(25, 14 + floatY, 4, 2, c[9]);
    // Floating Elemental Prism Satellites
    r(2, 23 + floatY, 3, 3, c[19]); r(27, 23 - floatY, 3, 3, c[27]);
    r(9, 25 - floatY, 14, 4, c[21]); r(12, 26 - floatY, 8, 3, c[30]);
    if (atk) {
      r(0, 13, 32, 6, c[30]); // Reality-rending Supernova Beam
      r(0, 15, 32, 2, c[9]);
    }
  },

  // --- Floor 80★: Abyssal Kraken (4 Tentacles Phase 1 + True Body Phase 2, Water 💧) ---
  kraken_ward_tentacle(r, c, pose, frame) {
    // หนวดม่านวารี (Ward Tentacle - glowing prism water barrier coil)
    const atk = pose === 'attack';
    const sway = atk ? -2 : [0, 1, 0, -1][frame % 4];
    const pulse = atk ? c[9] : frame % 2 ? c[27] : c[26];
    // Foaming Abyssal Base
    r(5, 27, 22, 4, c[24]); r(8, 25, 16, 3, c[25]); r(7, 29, 4, 2, c[27]); r(21, 29, 4, 2, c[27]);
    // Coiling Cyan Tentacle Trunk
    r(11, 18, 10, 9, c[24]); r(12, 19, 8, 7, c[25]);
    r(10 + sway, 10, 9, 10, c[24]); r(11 + sway, 11, 7, 8, c[25]);
    r(13 + sway, 4, 7, 7, c[25]); r(16 + sway, 2, 6, 4, c[26]);
    r(20 + sway, 4, 3, 4, c[27]); // Curled tip
    // Luminous Suckers
    r(11 + sway, 13, 2, 2, c[27]); r(11 + sway, 17, 2, 2, c[27]); r(13, 22, 2, 2, c[27]);
    // Floating Water-Ward Prism Halo around tentacle
    r(4 + sway, 7, 24, 2, pulse);
    r(4 + sway, 15, 24, 2, pulse);
    r(3 + sway, 9, 2, 6, c[27]); r(27 + sway, 9, 2, 6, c[27]);
    r(14 + sway, 6, 4, 3, c[9]);
    if (atk) {
      r(1, 5, 30, 2, c[9]); r(2, 17, 28, 2, c[27]);
    }
  },
  kraken_heal_tentacle(r, c, pose, frame) {
    // หนวดฟื้นสมุทร (Heal Tentacle - cradling luminous oceanic pearl)
    const atk = pose === 'attack';
    const bob = atk ? -2 : [0, -1, 0, 1][frame % 4];
    const orbCore = atk ? c[9] : frame % 2 ? c[8] : c[27];
    // Seafoam Base
    r(5, 27, 22, 4, c[24]); r(8, 25, 16, 3, c[25]); r(10, 28, 12, 2, c[26]);
    // Twin Cradling Tendrils
    r(10, 18, 12, 9, c[24]); r(12, 19, 8, 7, c[26]);
    r(7, 11, 6, 10, c[25]); r(6, 7, 5, 6, c[26]); r(8, 5, 4, 3, c[27]);
    r(19, 11, 6, 10, c[25]); r(21, 7, 5, 6, c[26]); r(20, 5, 4, 3, c[27]);
    // Suckers & Coral Fin Accents
    r(11, 14, 2, 2, c[8]); r(19, 14, 2, 2, c[8]); r(14, 22, 3, 2, c[8]);
    // Glowing Healing Sea Pearl suspended between tips
    r(12, 6 + bob, 8, 8, c[26]);
    r(13, 7 + bob, 6, 6, orbCore);
    r(15, 8 + bob, 2, 2, c[9]);
    // Rising Healing Bubbles
    r(10, 2 + bob, 2, 2, c[27]); r(21, 1 + bob, 2, 2, c[8]); r(15, 0 + bob, 2, 2, c[9]);
    if (atk) {
      r(8, 10, 16, 2, c[9]); r(15, 3, 2, 14, c[8]);
    }
  },
  kraken_ink_tentacle(r, c, pose, frame) {
    // หนวดหมึกดำบาดาล (Ink Siphon Tentacle - dark violet abyssal stalk dripping ink)
    const atk = pose === 'attack';
    const sway = atk ? -3 : [0, -1, 0, 1][frame % 4];
    const dropY = (frame % 4) * 2;
    // Dark Ink Pool Base
    r(4, 27, 24, 4, c[0]); r(6, 25, 20, 3, c[20]); r(9, 28, 14, 2, c[21]);
    // Whipping Violet-Indigo Tentacle Body
    r(12, 18, 10, 9, c[20]); r(13, 19, 7, 7, c[21]);
    r(9 + sway, 10, 9, 10, c[20]); r(10 + sway, 11, 6, 8, c[21]);
    r(5 + sway, 4, 8, 8, c[21]); r(3 + sway, 6, 5, 5, c[22]);
    // Glowing Violet Mana-Siphon Suckers
    r(9 + sway, 12, 2, 2, c[23]); r(10 + sway, 16, 2, 2, c[23]); r(13, 21, 2, 2, c[22]);
    r(5 + sway, 7, 2, 2, c[31]); // Ink nozzle eye-glow
    // Dripping Abyssal Ink Globules
    r(3 + sway, 12 + dropY, 2, 3, c[0]); r(4 + sway, 12 + dropY, 1, 2, c[22]);
    r(22, 14 + (6 - dropY), 2, 3, c[0]); r(22, 15 + (6 - dropY), 1, 2, c[23]);
    if (atk) {
      r(0, 7, 10, 4, c[0]); r(1, 8, 8, 2, c[23]); r(0, 13, 7, 3, c[21]);
    }
  },
  kraken_crush_tentacle(r, c, pose, frame) {
    // หนวดยักษ์บดขยี้ (Colossal Armored Crush Tentacle - thick spined slammer)
    const atk = pose === 'attack';
    const lunge = atk ? -4 : 0;
    const lift = atk ? 3 : frame % 2 ? -1 : 0;
    // Heavy Frothing Wave Base
    r(3, 26, 26, 5, c[24]); r(6, 24, 20, 3, c[25]); r(4, 29, 24, 2, c[27]);
    // Thick Muscular Armored Tentacle Column
    r(11, 15, 13, 12, c[2]); r(13, 16, 9, 10, c[24]);
    r(8 + lunge, 7 + lift, 14, 11, c[2]); r(10 + lunge, 8 + lift, 10, 9, c[24]);
    // Coiled Heavy Club Tip
    r(4 + lunge, 2 + lift, 13, 8, c[24]); r(6 + lunge, 4 + lift, 9, 5, c[25]);
    // Sharp Barnacle / Coral Armor Spikes
    r(22, 16, 4, 3, c[8]); r(23, 21, 4, 3, c[8]);
    r(18 + lunge, 6 + lift, 4, 3, c[9]); r(12 + lunge, 0 + lift, 3, 3, c[9]);
    // Heavy Suckers underneath
    r(7 + lunge, 10 + lift, 3, 2, c[26]); r(10 + lunge, 15 + lift, 3, 2, c[26]); r(12, 21, 3, 2, c[26]);
    if (atk) {
      r(0, 18, 12, 12, c[27]); r(2, 20, 8, 8, c[9]); // Crushing wave slam
    }
  },
  abyssal_kraken(r, c, pose, frame) {
    // มหาคราเค่นแห่งห้วงบาดาล (Abyssal Kraken True Body - Floor 80★ Phase 2 Boss, auto 2x scale)
    const atk = pose === 'attack';
    const floatY = [0, -1, 0, 1][frame % 4];
    const eyeGlow = atk ? c[9] : frame % 2 ? c[31] : c[30];
    const waveShift = frame % 2 ? 1 : 0;
    // Towering Abyssal Mantle & Ocean Crown Fins
    r(10, 0 + floatY, 12, 4, c[24]); r(12, -2 + floatY, 8, 3, c[25]);
    r(6, 2 + floatY, 20, 6, c[24]); r(8, 3 + floatY, 16, 4, c[25]);
    // Sweeping Lateral Crown Fins (Spiny Leviathan Crest)
    r(2, 4 + floatY, 6, 5, c[25]); r(0, 2 + floatY, 4, 4, c[26]);
    r(24, 4 + floatY, 6, 5, c[25]); r(28, 2 + floatY, 4, 4, c[26]);
    // Bioluminescent Mantle Spots
    r(10, 4 + floatY, 2, 2, c[27]); r(15, 2 + floatY, 2, 2, c[9]); r(20, 4 + floatY, 2, 2, c[27]);
    // Heavy Armored Brow & Colossal Head
    r(7, 8 + floatY, 18, 11, c[2]); r(9, 9 + floatY, 14, 9, c[24]);
    r(11, 10 + floatY, 10, 3, c[25]);
    // Blazing Abyssal Predator Eyes
    r(8, 12 + floatY, 5, 3, c[0]); r(9, 12 + floatY, 3, 2, eyeGlow); r(10, 12 + floatY, 1, 1, c[9]);
    r(19, 12 + floatY, 5, 3, c[0]); r(20, 12 + floatY, 3, 2, eyeGlow); r(21, 12 + floatY, 1, 1, c[9]);
    // Fanged Abyssal Beak & Maw
    r(12, 16 + floatY, 8, 5, c[0]);
    r(13, 16 + floatY, 2, 2, c[9]); r(17, 16 + floatY, 2, 2, c[9]);
    r(14, 19 + floatY, 4, 2, c[19]); // Inner abyssal tongue/maw glow
    // Lower Coiling Body & Four Flanking Sub-Tentacles
    r(1, 15 + floatY, 6, 12, c[24]); r(2, 17 + floatY, 4, 8, c[25]); r(0, 13 + floatY, 3, 5, c[26]);
    r(25, 15 + floatY, 6, 12, c[24]); r(26, 17 + floatY, 4, 8, c[25]); r(29, 13 + floatY, 3, 5, c[26]);
    r(6, 20 + floatY, 6, 8, c[24]); r(20, 20 + floatY, 6, 8, c[24]);
    r(12, 21 + floatY, 8, 7, c[21]); // Deep abyssal underside
    // Glowing Tentacle Sucker Nodes
    r(2, 20 + floatY, 2, 2, c[27]); r(28, 20 + floatY, 2, 2, c[27]);
    r(8, 23 + floatY, 2, 2, c[27]); r(22, 23 + floatY, 2, 2, c[27]);
    // Roaring Tidal Foam & Abyssal Whirlpool Base
    r(0, 27, 32, 5, c[24]);
    r(2 + waveShift, 26, 8, 2, c[27]); r(12 - waveShift, 27, 8, 2, c[9]); r(22 + waveShift, 26, 8, 2, c[27]);
    if (atk) {
      r(0, 22, 32, 5, c[27]); r(2, 24, 28, 3, c[9]); // Crashing Tsunami Surge
    }
  },
};
