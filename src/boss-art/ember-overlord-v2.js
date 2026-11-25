import {
  EMBER_OVERLORD_V2_BODY_GRID,
  EMBER_OVERLORD_V2_PARTS,
} from './ember-overlord-v2-parts.js';

// Indexed 92×80 refined 24-color pixel grid for Floor 10 Major Boss: Ember Overlord (V2).
// One character per logical pixel. A dot (.) is transparent.
export const EMBER_OVERLORD_V2_GRID = [
  '...................................ck.......................................................',
  '..................vvvv.............vrc......................................................',
  '...............nnkaqqqqannvv.......ncrv.....................................................',
  '..............nvaffffqvknnnnvc....kncrr...........av........................................',
  '.............nafffhfqvnnnnkcrrcknnnvarv..........nafkn......................................',
  '............kqffhttfqvnkvvcraqarkkcqqrn..........nbhzn......................................',
  '.......gb..evfhhtthfqavcqqrqffqqaaqqqcn..........evhgnn.....................................',
  '.......ybnnvfffhttyfffffffffavcqqqqqank.........nngthvn.....................................',
  '........eenkbrfffythfhffffqcknkraqacnn...b.....nnzhthbn.....................................',
  '.......knbnnnvfffhtthfrrfqcnnnnnvvknn...zznnknnnzfffann.........vkn.........................',
  '.......nzznnnrffftwhqrrrrrvnnneeennnn..nnnnkrnnafffcnnnn.......cqqvnn.......................',
  '...nbbnnzznvaffhtoyfrrrrrrknneeeenban..nnnnfznzffhqnnnnnn......nvfffvnnn....................',
  '...nybnnzkvffhtwwyhqqrqaknnneeeeeebne.nnnnbhznffthqnnvnkbn......naffhzkbnn..................',
  '..ezynnnnkfhtygrrrrrqqqvnvkneeeeeeeeeebbnkgtznzhthfvnakbgnn.....kkvqfhffbnnn................',
  '..ezbnnnnzhttzaagyyoogqknaaneeeeeeeeekgbnbwwakftwthqcqkzhbn......nnvqghhznebz...............',
  '..nnnkbkbhtttwgbkvzwyygznbfveeeeeeeenggnngowaahwoytffqvgtzne.....nnnafhhfkebhb...c..........',
  '...nnazkgtfgwoooozkkzhggznbaneeeeeeenygnngowfhooygthffgwtznee....nnnrfhhfvnnbb..............',
  '..nnvfbkyhqtoooooorcnbgggbnnneeeeeeekwobngyytoooggtffywwhzneeennnnnkfhtffvnnnn..............',
  '..enghvvyfgoghwoofrrcnnzrgbneeeeeeeenywyzaggyooyzrfqyywyfvnnebnnnnkafhthfqvnn...............',
  '..evhtfvfqyoqhtwtfrccvebzzzneeeeeeeengfywgbggczgvkfgyzhfannnbgnnnzffffttffce................',
  '.nnvhttfrqrzrfhthqrkrrnnzzzkeeeeeeeeezqvyznggdzgzbgzvvfqknnngznnbffffhthffve................',
  'ennkghttqarcrrqffrcvrfknbqrbeeeeeeeeenfvzgbygythggrbvvqvnnnggrbnzfqfhtyqqfve................',
  'nngbvfhtbrrcrrrrrrrcqqknbffkeeeeeeeeeebvbfhwygbbgzniekknnezybrrncqqfytfqqann....zf..........',
  'nggknvffvkrqrfqrqfqqfvnnbgbeeeeeebzeeeebffzzeinndeiiiennebyzccrrqffhttfqrnne................',
  'nggnnbnavnnahthfhthhcknngbeneeeenfzeeeebgneenbhvknddebrkbygvkkrrfhtttthqvnne................',
  'nbfnnzbkknnkbgtywogvzybnbnnnnnengrzneeenbnvggzbncsdezbnewwbnsmkrfytfrfhfvnnee...............',
  '.nvnncgbnnnnvrggggrvnggbennznnnbhranenbenznzbeevkdbgzsdoogksmmmkcrfckkcfannebb....bbn.......',
  '...knvrgznnnzzggggzznbffbnnggnnzzkcvbgbenbneeincsbgbsddowznmbllmmkkmpsncrnnngb...nbyn.......',
  '....nnbrgygbnenvgvnnngfbnnngtgvgkdnzhbibbkneeikkbgbdskbygksmlllmbbbbbnnnnnnzgk...ebtb.......',
  '.....nebrrgywwevgbenyhbeennfhgrfbsmygibbenniiekezmdbgbzggnsmmmzyyhhgggzzzgwyrk...bgbn.......',
  '......eebbcrrgzegbzwwzeeeenaqcsbgsbybibmibobibgkkszhzkgggdsmmgooyyggrzrghtgcck..............',
  '......bbnnzbkcgbbbgygneeeeebrnsszgyweingbyoyzygesyybibhggzmszhyo......fczzvvcn..............',
  '....z.nzznneenzbzzngnnneebnnkbmszhyweddghgggygnizynddywygggbgg..pddds...rvvvvn..qf..........',
  '.......kznnennbrybbgkbneeggbbhbbggbzebzggoyqyggbzbdsbwgzgggggw.dppsvdd...bcvn...r...........',
  '........n..nngbvgbzbkrneebhgzzggziiibghggotfgyhgbsmm.w...ohgy.dpmmzfrnd..rcv................',
  '........k...enzebzznkbeeengfzzggeiisbbzghttfgznnblmmm...s.oyypsmzywygrb..v..................',
  '.......gz....ebkebbebeeeebfbenhzidekpskgfthggcbsspmbmp.kcnptydbgyww..frz....................',
  '........y.....eenbbkeeeeezbiiizzineknzzbggggrzggbmzbss..fgvbbzht...d...fz...................',
  '...............ngywgkeeeeeeeeieennnezbekzggbvr.tggbsssp..tgzzhw.knssp...r...................',
  '...............bznnkbeeeeeeeenknkcnezeevnggevvsp.g..nss..noyy.kkkcksd.......................',
  '...............eidpdeeeeezggbkkrakdiennndgbdnsnck....ck..k..o..crrrckk......................',
  '................ekcneeeenkbyyeskksdiinckdnespvrkdd....r..c..dss.rrrrrccn....................',
  '................enckeengbmbgygndddiiiikrsddsrrnddulmp......dsmpdd..gfrrc....................',
  '...............eebzbbzbbyzzmbggedeiikddknsskrddbblmss......sslmpd.ogz..rc...................',
  '...............ebllmsmlizzpmsbzeiiiibbinzwenndggkssdd.......dsssdyhcb...k...................',
  '...............emsssssmibzssdbceieednhbbyygnbygnssssdk.....vnszebybsbf..k...................',
  '...............emmlmddsinbdddcbiieepnzzhrrggzgzdmlmsbzr....kszogyzlpnr..kk....aaark.........',
  '...............rmmssdiiibknnkceiebbmkbzfyyagggzsmllghgbc....byygbmlmk.kknn...rackrckk.......',
  '................mmspsiinvnenzbiekfybzbzqhtqggyfzbpzwybebr..gfggnmmmsc.nvck....nnnvqqvn......',
  '................vmseennneeeeeeenb.yygkngffgg..ghgbyyeiiiv...cbgmmmsd.eencrvn..nnnvqqqrn.....',
  '................r..kkkneeeeeneekr.gygcnzggg.k.oygggbissdn...bsgbmmbz.eeekrrcv.nnnrqqffc.....',
  '..................kcrneeeeenneevssdgwqvngg.nc..yyggedpsss....sbbpmyg.eeeencccknnnvkaffak....',
  '..................krqneeeeennennsss..tcnztnkr..o.ogismpssp...dzbsygcneeeeenvrrvnnnnvqfan....',
  '...................gzneeeenkeenkmmss.tckkbkkg...k.ybslzbnn..szyggybrdnvennnnnkcvvvkahqan....',
  '..................ffkkeeeekkeekbl.ssdtckknckg.pprk.gzgyzbbb.ggwyhzb.dkreekknnnnnvrfhtfann...',
  '..................rkrveeekkkekr..pbbsyrckkckg.ddkck.yy...bb..bdntgrfdeccencnnnnkkkvgffqvvnn.',
  '..................edrkeekkknev..sbggvyrckcrcg.psncc.o..n..c.glmpdfzbeenravcvnnnkkkkkcrqffann',
  '...................ekmekkkknekesngg..wrccqrcg.pmncrk.kkkn..zbmlms..nneeevqrcckkknccccccqhfrn',
  '...................ekmnckkkeenepbzds.orcrqrcg.pmscrcnnrckk.lsmlmss.ennenebfrccccccrrcccrftgb',
  '..............ccc..emmnckkneenobbssdsgccfrccgysmscrrknrrkk.ssmlppsnenknnnnzhrrrrfqrqqqfqqytg',
  '.............ccc...dslekkkneebwo.ssd.gccgzccrh.mmnrrckvfrkk.smsssp.enkknnnnghhghhhfrrqhhfyhg',
  '.............ck.....ekskkkneegwyoddd.gccggccry..pnrrckkrfrk.lpdss..eekkknnnngzkvzghrrrqhttqv',
  '.............nnn....sbskkneebgbygyz..hggzzgzyy....rrcccccfrkc.....eeenkkknnnnnnnnkvrqqqqttgc',
  '.............nnvk..kslmnkneezbmmzygg.wggccgggt.dd.rrrcccccrckkk...eeenkkkknnnnnnnnnnvrqqhttf',
  '.............krrnnkknkknkeeezbmsbzcrr.bgcchbn.psdbfrrckcvccrrckk..eeeekkkkkknnnnkcknnvqqhtth',
  '............krrrvkkknkmnneeinzpkrr.r.rkzggznc..sdzgcrckkcckccrrcc..enenkkcckknnnkrrrccqftttt',
  '...........nrrckkkkknbbdeeeeebbbf.ss.tcnggnkr..pngbnrrckcrkkkcccccckneenkkcrcknnnvrrrrqfttth',
  '.........cnvrckkkkkkebybeeeeebzr.dsbstrkbbkcrg..gfderrckcrrvkkkkccccknnekkkrfckknkqqrrqffvgf',
  '........vrrrckkkkkknbgogbeeeibgrdpbbdyrckkccfb..zbndcqrcccrrckccckkcccckkkkcrfckkkrqraqqvnvf',
  '........cqqrcrrcckkebzzbbeeeenwssmksdwrcrcccfg....bnnqqqrcrrrccccckccrrrrvkcchfcckcqckqaknnq',
  '........aqqrrrrrvkkeezgzkieeed.ssmsd.trcggccfgdn..mkdcqqqqrqrrccrrcrrqqrrrccchhacccfcnrvnnnr',
  '.......qffqvknvckkkeebggneeeeefksbsd.grgccgcg.dn...ssnr...qqqrrrqqffffvnnnnkchtfrcqhvnnnnnnr',
  '.......qfrknnnnkkcneenggeeeeedggbzss.grgccgrg...n..nbnvvc..qqqqqfffffbennnnnkgttffthznnnnrv.',
  '........qnnnnnnkccneeeggeeeed.gyggnb.grggggcgy.nee.bzzrrvc.kzffvnghhgnnnnnkkkrttttthznn.....',
  '........cn....nrrqkeeezgeee...ul.gzr.ggggggcg....d.rzgmp.rf...zznnggnnnnnkcccrtttgyhznn.....',
  '.........nvc..kqqrcneebgeeeowullp.zr.ggw..ggg.....ggypplmkv...ennebznnnnkcrrrhtyykghzn......',
  '.........rav..cffknneebwz.wywybmmphz.g.....hy.....zfpmboynn.eeeeeennnnnkrrrqhtzkbnbfvn......',
  '..........a....baneeeezyg.ygbzgsssp....s....g....eb.sbyzzfkp..eeennn.nn.rqfhttbnneban.......',
  '...............nbeeeeezgftgmmmbbbbs...dd.........n..bgbmmbzz...eenn......nvgtgneeevke.......',
  '...............eeeeeedpgzgbmmpszf....sdss..........mgbmlmsbz...nn..mmm...eezgneeenv.........',
];

export const EMBER_OVERLORD_V2_MATERIALS = {
  i: ['ink', '#18101c'],
  d: ['armorDeep', '#2c1e34'],
  s: ['armorShadow', '#42304c'],
  m: ['armorMid', '#614a6b'],
  l: ['armorLight', '#886e91'],
  b: ['bronzeShadow', '#935536'],
  g: ['goldMid', '#cf893f'],
  y: ['goldLight', '#f4c65d'],
  k: ['capeShadow', '#6e1d26'],
  c: ['capeMid', '#a7292c'],
  r: ['capeLight', '#d3432b'],
  v: ['lavaDark', '#801c16'],
  a: ['lavaMid', '#c93a1a'],
  f: ['flame', '#f26a1b'],
  h: ['flameLight', '#ffb838'],
  o: ['core', '#fff29c'],
  e: ['inkWarm', '#24141c'],
  p: ['armorViolet', '#523b5e'],
  u: ['armorRim', '#a589ad'],
  z: ['bronzeMid', '#b06e3a'],
  w: ['goldBright', '#ffe07d'],
  n: ['capeDeep', '#4c131d'],
  q: ['flameDeep', '#df4e18'],
  t: ['emberBright', '#ffd85e'],
};

export const EMBER_OVERLORD_V2_DEF = Object.freeze({
  grid: EMBER_OVERLORD_V2_BODY_GRID,
  materials: EMBER_OVERLORD_V2_MATERIALS,
  parts: EMBER_OVERLORD_V2_PARTS,
  animate({
    frame = 0,
    pose = 'idle',
    progress = 0,
    attacking = false,
    charging = false,
    hurt = false,
    reducedMotion = false,
    colors,
  }) {
    const f = ((Math.floor(frame) % 4) + 4) % 4;

    // Death: hide every component so no orphaned flames, cape sections, or orbs remain.
    if (pose === 'dead') {
      return {
        materialOverrides: null,
        partStates: {
          hideParts: true,
          flameCrown: { visible: false },
          leftShoulderFlame: { visible: false },
          rightShoulderFlame: { visible: false },
          scepterOrb: { visible: false },
          capeRight: { visible: false },
          capeLeft: { visible: false },
          scepterEmbers: { visible: false },
          shoulderEmbers: { visible: false },
        },
        effects: [],
      };
    }

    const isAttack = Boolean(attacking || pose === 'attack');
    const isCharge = !isAttack && Boolean(charging || pose === 'charge');
    const isHurt = !isAttack && !isCharge && Boolean(hurt || pose === 'hurt');

    // Reduced motion: stable representative frame 0, zero oscillation or particles,
    // while keeping non-oscillating charge/attack readability.
    if (reducedMotion) {
      const staticPart = { frame: 0, dx: 0, dy: 0, visible: true };
      return {
        materialOverrides: (isAttack || isCharge)
          ? {
            flame: colors.flameLight,
            flameLight: colors.core,
            core: '#ffffff',
          }
          : null,
        partStates: {
          flameCrown: staticPart,
          leftShoulderFlame: staticPart,
          rightShoulderFlame: staticPart,
          scepterOrb: staticPart,
          capeRight: staticPart,
          capeLeft: staticPart,
          scepterEmbers: staticPart,
          shoulderEmbers: staticPart,
        },
        effects: [],
      };
    }

    if (isHurt) {
      const hurtFrame = f % 2 === 0 ? 0 : 3;
      return {
        materialOverrides: null,
        partStates: {
          flameCrown: { frame: hurtFrame, dx: 0, dy: 0 },
          leftShoulderFlame: { frame: hurtFrame, dx: 0, dy: 0 },
          rightShoulderFlame: { frame: hurtFrame, dx: 0, dy: 0 },
          scepterOrb: { frame: 0, dx: 0, dy: 0 },
          capeRight: { frame: hurtFrame, dx: 0, dy: 0 },
          capeLeft: { frame: hurtFrame, dx: 0, dy: 0 },
          scepterEmbers: { frame: 0, dx: 0, dy: 0 },
          shoulderEmbers: { frame: 0, dx: 0, dy: 0 },
        },
        effects: [],
      };
    }

    if (isAttack) {
      const surge = Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI);
      const emberDx = -Math.round(surge * 2) || 0;
      const emberDy = -Math.round(surge) || 0;
      const activeFlameFrame = surge > 0.35 ? 2 : 1;
      return {
        materialOverrides: {
          flame: colors.flameLight,
          flameLight: colors.core,
          emberBright: '#fff6b0',
          core: '#ffffff',
        },
        partStates: {
          flameCrown: { frame: surge > 0.35 ? 4 : 2, dx: 0, dy: 0 },
          leftShoulderFlame: { frame: activeFlameFrame, dx: 0, dy: 0 },
          rightShoulderFlame: { frame: activeFlameFrame, dx: 0, dy: 0 },
          scepterOrb: { frame: activeFlameFrame, dx: 0, dy: 0 },
          capeRight: { frame: surge > 0.35 ? 1 : 0, dx: 0, dy: 0 },
          capeLeft: { frame: surge > 0.35 ? 2 : 3, dx: 0, dy: 0 },
          scepterEmbers: { frame: 2, dx: emberDx, dy: emberDy },
          shoulderEmbers: { frame: 2, dx: 0, dy: emberDy },
        },
        effects: [
          { type: 'groundSpark', dx: -6, y: 145, radius: 1, color: colors.flameLight, coreColor: '#ffffff' },
          { type: 'groundSpark', dx: 7, y: 145, radius: 1, color: colors.flame, coreColor: colors.core },
        ],
      };
    }

    if (isCharge) {
      const crownChargeFrame = f % 2 === 0 ? 4 : 2;
      const pulseBright = f % 2 === 1;
      return {
        materialOverrides: {
          lavaMid: colors.flame,
          flame: colors.flameLight,
          flameLight: pulseBright ? '#ffffff' : colors.core,
          emberBright: '#fff9c4',
          core: '#ffffff',
        },
        partStates: {
          flameCrown: { frame: crownChargeFrame, dx: 0, dy: 0 },
          leftShoulderFlame: { frame: (f + 1) % 4, dx: 0, dy: 0 },
          rightShoulderFlame: { frame: (f + 2) % 4, dx: 0, dy: 0 },
          scepterOrb: { frame: f % 2 === 0 ? 2 : 1, dx: 0, dy: 0 },
          capeRight: { frame: [1, 2, 1, 3][f], dx: 0, dy: 0 },
          capeLeft: { frame: [2, 1, 3, 2][f], dx: 0, dy: 0 },
          scepterEmbers: { frame: (f + 1) % 4, dx: 0, dy: -1 },
          shoulderEmbers: { frame: (f + 2) % 4, dx: 0, dy: -1 },
        },
        effects: [
          { type: 'orbitDiamonds', anchors: ['weapon'], count: 2, rx: 10, ry: 7, offsetY: -2, speed: 320, color: colors.flameLight, coreColor: '#ffffff' },
          { type: 'groundSpark', dx: f % 2 === 0 ? -7 : 7, y: 145, radius: 1, color: colors.flameLight, coreColor: colors.core },
        ],
      };
    }

    // Idle: heavy royal posture with continuous flame dance, asynchronous cape wave,
    // and slow magma core pulse.
    const slowPulse = f === 1 || f === 2;
    return {
      materialOverrides: slowPulse
        ? {
          flameLight: f === 2 ? '#ffd262' : colors.flameLight,
          emberBright: f === 2 ? '#ffe588' : colors.emberBright,
          core: f === 2 ? '#fff9c4' : colors.core,
        }
        : null,
      partStates: {
        flameCrown: { frame: f, dx: 0, dy: 0 },
        leftShoulderFlame: { frame: (f + 1) % 4, dx: 0, dy: 0 },
        rightShoulderFlame: { frame: f, dx: 0, dy: 0 },
        scepterOrb: { frame: f, dx: 0, dy: 0 },
        capeRight: { frame: f, dx: 0, dy: 0 },
        capeLeft: { frame: (f + 2) % 4, dx: 0, dy: 0 },
        scepterEmbers: { frame: f, dx: 0, dy: 0 },
        shoulderEmbers: { frame: (f + 1) % 4, dx: 0, dy: 0 },
      },
      effects: f % 2 === 0
        ? [{ type: 'groundSpark', dx: f === 0 ? -6 : 6, y: 145, radius: 1, color: colors.flame, coreColor: colors.core }]
        : [],
    };
  },
});
