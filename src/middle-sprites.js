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
};
