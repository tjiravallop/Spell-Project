// One character is a 2×2 pixel tile on the battlefield's 32×32 grid.
// . transparent, s shadow, m body, l light, h highlight, a accent, e eye/core.
const MATERIALS = {
  mirror: ['#322337', '#604470', '#9573ac', '#c09eda', '#ffd3e8', '#fff1c4'],
  ice: ['#24374f', '#3b6990', '#6eaacf', '#a8e2ef', '#e2f8f0', '#eafdff'],
  brass: ['#473036', '#78513c', '#ac783e', '#e4ad5d', '#ffdb89', '#ffefb1'],
  fire: ['#422533', '#743447', '#aa473a', '#e17743', '#ffb851', '#fff2ba'],
  stone: ['#293034', '#41504d', '#627367', '#9da57e', '#c7d397', '#f4df9d'],
  moss: ['#292c39', '#414c42', '#647d45', '#9aaa62', '#d3d682', '#fbf3a1'],
  water: ['#252d4b', '#365376', '#3f8192', '#71b6b3', '#b4f2d6', '#effddd'],
  wind: ['#2d3650', '#4c5e78', '#75969e', '#a0cec6', '#c3f0dc', '#f6ffe0'],
  ink: ['#2f2a42', '#4d405e', '#7d5885', '#b381a5', '#e4afc0', '#ffe9b9'],
  astral: ['#27223c', '#463865', '#6a5995', '#9f90cc', '#c3ddfc', '#f9e5ff'],
  paper: ['#483444', '#75535b', '#b38272', '#dab18d', '#f5d2a4', '#fff2c1'],
};

// lift is the space beneath floating creatures. Each drawing has its own silhouette.
const DESIGNS = {
  mirror_mage: ['mirror', 2, `
......h.h
.....hlhlh
...a..lml..a
..ala.les.ala
..aha.mms.aha
...a.smlms.a
.....lmlmms
....smlhlms
...smmhlmlms
...smlmmlmms
....mls.smm
.....s...s
`],
  frost_lich: ['ice', 1, `
.....h.h..h
.....lmh.h
....mlmlll
....lseeems
...sllmssml
..m.lmlhlm.a
..hslmlmls.ah
..alsmmlmss.a
..a.smlmmls.a
..a.smmmlms.a
..a..lmmls..a
......ms
`],
  storm_titan: ['brass', 0, `
...a........a
...ah..m...ha
...as.lml..sa
...ml.mees.ml
..slsmlhlmsls
..lmlmmhlmlml
..lmlsmaaasmms
..smlsmhlaslml
...sssmahssmm
.....mallsms
.....ml..ml
....mml..mml
`],
  arch_codex: ['paper', 2, `
......aha
.....ahmha
..ls..aha..sl
.lhml..s..lmhl
.lhhlmlaahlhhl
.lmlhlhlhlhlml
.lhmhlleslhmhl
.lmmmhlhlhmmml
.slmllhahlmlms
..sslmhlhmlss
...s.shaa.s
......sl
`],
  void_imp: ['fire', 0, `
........a
......aha
.....h.h...a
....lmlml.al
..hllemlhlml
..lelmlmlmmls
..sllllmlhllms
...smmsmlmlmls
....smmlmmmms
..hlllsmsmlms
..ssms...smls
`],
  obsidian_golem: ['stone', 0, `
..........a
.........am
.......mmlml
.....mllmmls
....mmlmlmms
..s.lllmmlmlss
..hmllmlmlmml
.shmemmlsmmms
..smlmhslsmls
...sssmmsslls
....slls.smls
`],
  ward_keeper: ['fire', 0, `
........h.h
.......l.l
......llmlmlm
....smlhllhlls
...mlhllmhllhl
..smmlmlmllmms
.slmlmlmlmmmmm
..smsmsmsmsms
..sls.sls.sls
`],
  rune_ram: ['stone', 0, `
.....hhl
...hhmlms
..hlmmhhs
..lmmmlmlmmm
..mmemsmlmlls
..slmmlllmmlms
...ssmlmlmllms
.....smmsmsms
.....sls.sl.sl
.....sls.sl.sl
`],
  seal_curator: ['fire', 0, `
....a.......a
...aha.....aha
..hlaal...aha
..lehslmm.lha
.ahlhsmhmlhls
.heelhllmllls
..smhmlslmlms
...shmlmlslms
...smlss.sms
..smml...smml
`],
  rift_runner: ['wind', 1, `
...h......a
...lm...al
....l...ls
....ll.lmlsl
.h.mllmmlllmss
..llemmhllmls
....smhllms
......mmls
......smsh
.....am.am
`],
  lattice_guard: ['stone', 0, `
........a
.......lal
..a....lml
..hl..mlmml
..lss.lmeel
..lhlasmsmm.aa
..lmmalmlms.ma
..slmalsmsmsml
...slssmsmssml
.....smsms.sm
....sms..ms
`],
  thread_archer: ['moss', 0, `
.........a
........am
......lmll
..h...meems
..l...slmlm
.lm....lmlms
.lslsalsslmls
.lm.lmslmlms
..l...smlmms
..a....l.ss
......sl.sls
`],
  ward_scribe: ['mirror', 1, `
........a
.......aha
......hmlh
......lssl
.....sleesl
..hl.smlhls
..hllmlahlms
..mllsmlmlms
...ss.mlmlms
.....smllms
....smms.s
`],
  gate_weaver: ['wind', 1, `
....a..h..a
...ah.hl.aha
..alslsmlslla
..as..lhl..sa
...s..lehs.s
...lsmlmlmsl
..ahssmlmssa
...llmlalml
....smlmlms
....l.sas.l
.....s.h.s
`],
  seam_warden: ['brass', 0, `
......h..h
....s.lhhl
...mhmlssls
..hhlaalels
..mlmhlaslls
..slssmlmmls
.hhhassalmas
.lmmlsmlmmls
..llssmlmlms
.....smslms
....sls.sls
`],
  abyss_crawler: ['water', 0, `
.......a..a
..l...lm..m..l
.hml..l..l..lh
.lmms.lmlm.smll
..mmlleelmmll
..lmslmlmlmsl
..smlmmmmmmls
..lss.sll.ssl
.sm.sls..sls.ms
`],
  hydra_serpent: ['water', 0, `
...a
...hla
..lhlml
.llelmms
...mllms
.....lms....a
.....lmls..lm
......lml..lm
....sllmlsmls
...lmlhlmmls
..smlmlmmls
....ssss
`],
  leviathan_tide: ['water', 0, `
...a...a.h
..aha.ahah
..lmlahlha..a
.hlelmlhll.aha
.lmmmhaahh.hla
...smlhllms.lh
....smhllms.lh
..hlmlmlhmslh
.hmlhllmlmslh
.smlmmmlmlms
..smmhllmms
....ssssss
`],
  magma_tortoise: ['fire', 0, `
.......a
......lhl
.....mlalm
....mlmmalm
...mllammlls
..lmmmlmmlmms
.llemslmlahlmms
.slmmssmlmmls.s
...sms.ssms
...sls..sls
`],
  cinder_drake: ['fire', 1, `
.........h...a
....h.h..al.ah
....l.l..lhlah
...llhml.lmlh
..leleml.lmm
...smmlalmls
....mlhmlmls
.....lmmlls
......smms.a
.....ss.sla
`],
  gale_harpy: ['wind', 2, `
........a...h
......hha..hh
......lml.hhl
.....llemhlms
......sllmsll
..h..mlmlslls
..llmlmlhlls
....smlmls
......sms
.....sa.ma
`],
  cloud_elemental: ['wind', 3, `
.......h.h
.....hhlhlh
....hlmlhmllh
..hhllleelmlhh
.hllmlmlmlmlhl
.llhlhlhlhlhs
..smmsmlmsms
...hlhlhlh
.....sms
......a.a
`],
  storm_roc: ['ice', 1, `
..........a...h
.......a.ll..hh
...h..hahhl.hll
..hllleelmlhlmm
.lhlllmmslmlms
....smlhlmmlms
....smlmlmmls
.....lmlsmls
....smms..la
...a.a....s
`],
  sand_stalker: ['brass', 0, `
...........ha
............hl
.............lm
..l..........hm
.hml......sllms
.lmml...slmls
..lmlmleelmmls
..slmmlmlmmlms
...sms.ss.ss
..slss.sl.sls
`],
  spark_wraith: ['brass', 3, `
......e
......ah
.....hla
...hlhamla
..hmmeemls
...lmmlls
....smlha.a
...asmlhlla
..a.lmls.a
....al
...a
`],
  frost_crystal_golem: ['ice', 0, `
..a...a....a
..hl.hlh..hla
..hl.lhl..hlh
..lhlleellhlms
..slmlmlhmllms
.smlmlhlhlmlms
..shmlhlalhms
...slmlmllms
....lms.sllm
...slls.smlls
`],
  blizzard_wolf: ['ice', 0, `
...h.h
...hlms
..lllmml...a
.llellmlhllla
.sllmlmllmmlsa
...slmlmllmms
....mlslsmls
....ss.s.sls
...sss..sls
`],
  glacial_hydra: ['ice', 0, `
......h
..h...lh....h
..lh..mlh..hl
.llel.llel.lell
..sml..sml.lms
...mls.ml.lhs
....mlsmlhls
.....mlmhlms
....smlhlmls
...smlmlhmlls
....ssmmllms
.......sss
`],
  venom_spore_beast: ['moss', 0, `
.........a
........ha..a
......lhlhl.a
...hh.lalalm
..hllmmlhlmms
.lelemmlmmams
.slmmllmmlmms
...smmlssms
...slsls..sls
..sss.....sss
`],
  solar_sentinel: ['brass', 0, `
.........a
.......ahha
.......hllha
...h..lleehl
..hla.slmlm
.lhalehlmlmla
..hlsmmlhmll
...s.lalahs
.....smllms
.....sl..sl
....sll..sll
`],
  dread_reaper: ['astral', 0, `
..aaa
.ahlha
..l..a..h
..l....hml
..l...hlsml
..l...leesl
..llssslmlms
..lsmmlmlmls
..l..smlmlsms
..l..slmlmms
..l.smlmsmls
.....s...s
`],
  void_devourer: ['ink', 1, `
..a.........a
..la...l...al
...hllmlmlhl
....hleehll
..hlmlmlmlml
..sllhlhlhllms
.smlhsmsmhlmls
.slmahhlhamsls
..smlmlmlmlms
....mssmssm
...sls....sls
`],
  astral_chimera: ['astral', 0, `
...h..ha..a
...lh.lml.ah
..hllmllmhlh
.lelemsmlmlms
..smmmlmllmmsa
...mllhmlmmmsa
....smlmssms
...slsm..sls
..smsls.smls
`],
  chronos_keeper: ['astral', 2, `
......ahah
.....ahlhla
.....alssla
.....aseesa
..h..smlmls
..amsslhsmls
..ahhlhlmls
...asmlmmls
...a.smlms
......sms
.....s...s
`],
  ironforge_automaton: ['brass', 0, `
..h.......h
..m..lll..m
..mslmhmlsm
.smlmmeemlms
.lmlmmllmllm
smhlmaeaamhlm
smmlmaaaammls
.mmlmhllmhlm
.ssmlmmmmms
...smm..mms
..smml..lmms
..ssss..ssss
`],
  tempest_blade_seraph: ['wind', 2, `
.....ahah
..h..hllh..h
.hlm.leel.mlh
hlhlmslmlsmhlh
.lmlhmahamhlml
..slhhaeahhls
...a.lmlml.a
..al.smlms.la
..ah..lml..ha
..a...sms...a
......s.s
`],
  abyssal_tide_colossus: ['water', 0, `
....h..h..h
...hlmlmlmlh
..smlmeemlmls
.hlmllhhlmllh
smhlmhaeahmhlm
smmlmaaaammlms
.mmlmhaeahmlm
.slmlmmmmmlms
..smlmllmms
...smm..mms
..smls..slms
..sss....sss
`],
  magma_core_juggernaut: ['fire', 0, `
..a.......a
.hal.hhh.lah
smhlmlmmlhlms
smmlmeeemlmms
smhllhaehllhms
smmlmaaaammlms
smmlmhaehmmlms
.smmlmmmmmlms
..smmlmlmmms
...smm..mms
..smml..lmms
..ssss..ssss
`],
  chitin_bastion_behemoth: ['stone', 0, `
....h.h.h.h
...hlmlmlmlh
..hlmmllmmlh
.slmhlmmlhlms
smhlmmeemmhlms
smmlmhlhlmmlms
smhlmaaaamhlms
smmlmlmmlmmlms
.smmlmmmmmlms
..smms..smms
..slls..slls
`],
  storm_sovereign_drake: ['wind', 1, `
.a...h..h...a
ala.hlmmlh.ala
a.lhmlmmlhlh.a
..hlmmeemmlh
.slmhlmmlhlms
smlmaahhaamlms
smlmlmhhmlmlms
.smlmllllmlms
..smml..lmms
...sm....ms
..sll....lls
`],
  void_kraken_leviathan: ['ink', 1, `
....hlmmlh
...hlmllmlh
..hlmmllmmlh
.slmmehhmemls
.smmlmllmlmms
..smmhaaamms
.slmlmmmmmlms
slm.smlmls.mls
sm..sm..ms..ms
s..sm....ms..s
...s......s
`],
  void_rift_tentacle: ['ink', 0, `
.....hh
....hlmh
...slmml
...smelm
....smml
...slmms
..smmlm
..smmms
...smms
...ssss
`],
  nether_forge_overlord: ['fire', 0, `
..a..h..h..a
..alhlmmlhla
...hlmllmlh
..slmmeemmls
.smhlmhhmlhms
smmlmaaammlms
smmlmhahmmlms
.smmlmmmmmlms
..smmlmlmmms
..smm....mms
..ssss..ssss
`],
  nether_forge_pillar: ['fire', 1, `
.....aa
....haah
...hlmmlh
...smelms
...smamms
...smlmms
...smamms
...smmlms
....smms
....ssss
`],
  eternity_armory_god: ['astral', 2, `
..a..h.ah..a
.ala.hlmlh.ala
..a.hlmllmlh.a
...slmmeemmls
.a.smhlmmlhms.a
ala.smhaaams.ala
.a.smmlmmlmms.a
...smlmllmms
....smmlmms
.....smms
......aa
`],
};

export const GEAR_RIFT_SPRITE_KINDS = new Set([
  'ironforge_automaton',
  'tempest_blade_seraph',
  'abyssal_tide_colossus',
  'magma_core_juggernaut',
  'chitin_bastion_behemoth',
  'storm_sovereign_drake',
  'void_kraken_leviathan',
  'void_rift_tentacle',
  'nether_forge_overlord',
  'nether_forge_pillar',
  'eternity_armory_god',
]);

const INKS = 'smlhae';
const atlas = Object.fromEntries(Object.entries(DESIGNS).map(([kind, [material, lift, pixels]]) => {
  const colors = MATERIALS[material];
  const rows = pixels.trim().split('\n');
  const top = 30 - rows.length * 2 - lift;
  const marks = [];
  const outline = [];
  for (const [row, line] of rows.entries()) {
    const y = top + row * 2;
    for (let col = 0; col < line.length; col++) {
      const ink = INKS.indexOf(line[col]);
      if (ink < 0) continue;
      const x = col * 2 + 1;
      marks.push([x, y, ink]);
      if (!INKS.includes(line[col - 1] ?? '.')) outline.push([x - 1, y, 1, 2]);
      if (!INKS.includes(line[col + 1] ?? '.')) outline.push([x + 2, y, 1, 2]);
      if (!INKS.includes(rows[row - 1]?.[col] ?? '.')) outline.push([x, y - 1, 2, 1]);
      if (!INKS.includes(rows[row + 1]?.[col] ?? '.')) outline.push([x, y + 2, 2, 1]);
    }
  }
  return [kind, { colors, marks, outline }];
}));

export const newTowerSpriteKinds = Object.freeze(Object.keys(atlas));

export function drawNewTowerSprite(kind, r, palette, pose, frame, reducedMotion, alternate) {
  const art = atlas[kind];
  if (!art) return false;
  const xOffset = pose === 'attack' && !reducedMotion ? -1 : 0;
  const powered = pose === 'attack' || pose === 'charge' || pose === 'ready';
  for (const [x, y, width, height] of art.outline) r(Math.max(0, x + xOffset), y, width, height, '#171524');
  for (const [x, y, ink] of art.marks) {
    let color = art.colors[ink];
    if (ink === 4 && (alternate || powered)) color = alternate ? palette[31] : art.colors[5];
    if (ink === 5 && pose === 'hurt' && frame % 2 === 0) color = palette[9];
    r(x + xOffset, y, 2, 2, color);
  }
  return true;
}
