export const RARITIES = Object.freeze({
  common: 'ทั่วไป',
  rare: 'หายาก',
  special: 'พิเศษ',
  epic: 'มหากาพย์',
  legendary: 'ตำนาน',
});

export const WORDS = Object.freeze({
  shot: { label: 'ลูก', glyph: '●', description: 'ยิงกระสุนใส่ศัตรูที่เลือก', formula: '1 มานา + ค่าธาตุ' },
  fire: { label: 'ไฟ', glyph: '♨', damage: 10, cost: 2, description: 'ทำความเสียหายทันที', formula: 'พลัง 10 · 2 มานา' },
  ice: { label: 'น้ำแข็ง', glyph: '❄', damage: 6, cost: 2, description: 'ลดพลังโจมตีครั้งถัดไป 2 ต่อครั้งที่โดน', formula: 'พลัง 6 · 2 มานา' },
  lightning: { rarity: 'rare', label: 'สายฟ้า', glyph: 'ϟ', damage: 8, cost: 2, description: 'ข้ามเกราะ 2 หน่วย', formula: 'พลัง 8 · 2 มานา' },
  akki: { rarity: 'special', label: 'อัคคี', glyph: '♨', damage: 20, cost: 5, description: 'ไฟขั้นสอง · เป้าที่โดนรับฮีลครึ่งเดียวจนจบเทิร์นถัดไป', formula: 'พลัง 20 · 5 มานา' },
  heman: { rarity: 'special', label: 'เหมันต์', glyph: '❄', damage: 12, cost: 5, description: 'น้ำแข็งขั้นสอง · หนาว 2 ส่งผลต่อการโจมตีจริงสองครั้ง', formula: 'พลัง 12 · 5 มานา' },
  asani: { rarity: 'special', label: 'อัสนี', glyph: 'ϟ', damage: 16, cost: 5, description: 'สายฟ้าขั้นสอง · ข้ามเกราะ 2 และชิ่งหาเป้าข้างเคียงหนึ่งตัวด้วยพลังครึ่งหนึ่ง', formula: 'พลัง 16 · 5 มานา' },
  vayu: { rarity: 'special', label: 'วายุ', glyph: '≋', damage: 14, cost: 5, description: 'ผลักศัตรูที่โดนถอยหนึ่งช่องถ้าช่องถัดไปว่าง', formula: 'พลัง 14 · 5 มานา' },
  magma: { rarity: 'epic', label: 'แมกม่า', glyph: '♨', damage: 22, cost: 7, description: 'ดิน + อัคคี · ทิ้งแอ่งตรงจุดกระทบ หลังแอ็กชันผู้เล่นเทิร์นถัดไป ปะทุใส่ตัวที่ยืนตรงนั้น 6 และลดเกราะ 2 ถึงจบเทิร์นหลังปะทุ', formula: 'พลัง 22 · 7 มานา' },
  mist: { rarity: 'epic', label: 'หมอก', glyph: '≋', damage: 16, cost: 7, description: 'น้ำ + อัคคี · ทำให้เป้าเปียกถึงจบเทิร์นถัดไป และบดบังการเล็ง ลดแรงโจมตีครั้งถัดไป 4', formula: 'พลัง 16 · 7 มานา' },
  hail: { rarity: 'epic', label: 'ลูกเห็บ', glyph: '❆', damage: 18, cost: 7, description: 'น้ำ + เหมันต์ · เป้าแห้งติดหนาว 2 เป้าเปียกเสียสถานะเปียกและข้ามการโจมตีครั้งถัดไป', formula: 'พลัง 18 · 7 มานา' },
  thunderstorm: { rarity: 'epic', label: 'ฟ้าคะนอง', glyph: 'ϟ', damage: 20, cost: 7, description: 'วายุ + อัสนี · ข้ามเกราะ 2 ผลักเป้าไปขวาหนึ่งช่องถ้าว่าง แล้วชิ่งครึ่งพลังหาเป้าข้างตำแหน่งใหม่', formula: 'พลัง 20 · 7 มานา' },
  pair: { label: 'คู่', glyph: 'Ⅱ', description: 'ร่ายเวทสองครั้ง หรือเชื่อมสองธาตุเป็นเวทเดียว พายุระลอกสองใช้แรง 60%', formula: 'สองครั้งคิดมานา ×2 · พายุ +3 · ผสานลด 1' },
  blast: { rarity: 'rare', label: 'ระเบิด', glyph: '✹', damage: 6, cost: 4, description: 'วางต้นคาถาเพื่อระเบิดตรงเป้า เติมธาตุหรือคู่ได้ ใช้ต่อท้ายเพื่อระเบิดเมื่อโจมตีโดน หรือสั่งระเบิดโล่ไฟที่มีอยู่', formula: 'ร่ายเดี่ยว 4 มานา · คำต่อท้าย +2 · สั่งระเบิดโล่ 2' },
  devastation: { rarity: 'legendary', label: 'ทำลายล้าง', glyph: '✷', cost: 5, description: 'ใช้เป็นคำสุดท้ายของคาถาโจมตีเท่านั้น เพิ่มแรงโจมตีเป็น 2 เท่าและระเบิดซ้ำหนึ่งครั้งด้วยครึ่งพลังในรัศมี 2 ช่องเมื่อโจมตีโดน', formula: '+5 มานา · พลัง ×2 · ระเบิดรัศมี 2 ช่อง' },
  blackhole: { rarity: 'legendary', label: 'หลุมดำ', glyph: '◉', cost: 10, description: 'เลือกช่องบนสนาม ดึงศัตรูในรัศมี 2 ช่องเข้ามาหนึ่งช่อง ช่องถัดไปต้องว่าง ยุบตัวหลังการเล่นของคุณในเทิร์นถัดไป', formula: '10 มานา · จุดกลาง 30 / รอบข้าง 15 · ข้ามม่าน' },
  death: { rarity: 'legendary', label: 'ตาย', glyph: '†', cost: 10, description: 'ปราบศัตรูหนึ่งตัวทันที บอสต้านคำสั่งนี้ ใช้สำเร็จได้ครั้งเดียวต่อศึก แล้วการ์ดจะหายจากมือและกองจั่วจนจบศึก', formula: '10 มานา · ข้ามม่านและเกราะ' },
  meteor: { rarity: 'epic', label: 'อุกกาบาต', glyph: '✹', cost: 9, description: 'อุกกาบาตตกใส่ศัตรูที่เลือก สะเก็ดกระทบศัตรูในช่องติดกัน ข้ามม่านแล้วหักเกราะตามปกติ', formula: '9 มานา · เป้าหลัก 28 / ช่องติดกัน 10' },
  veil: { rarity: 'epic', label: 'ม่าน', glyph: '▣', cost: 7, description: 'กางม่านรับความเสียหาย 14 อยู่ถึงจบเทิร์นถัดไป เมื่อการโจมตีทำให้ม่านแตก กันส่วนที่ล้นเพิ่มได้อีกสูงสุด 8', formula: '7 มานา · กัน 14 + กันส่วนล้นสูงสุด 8' },
  shield: { label: 'โล่', glyph: '⬡', description: 'กันความเสียหาย 6 ใช้ส่วนที่เหลือได้อีกหนึ่งเทิร์น', formula: '3 มานา' },
  beam: { rarity: 'rare', label: 'ลำแสง', glyph: '━', description: 'โจมตีเป้าหมายเดียวผ่านม่านกระสุน', formula: '2 มานา + ค่าธาตุ' },
  wave: { rarity: 'rare', label: 'คลื่น', glyph: '≈', description: 'โจมตีทุกตัวเท่ากัน ม่านของแต่ละตัวกันได้', formula: '3 มานา + ค่าธาตุ' },
  storm: { rarity: 'epic', label: 'พายุ', glyph: '◉', damage: 12, cost: 5, description: 'เลือกเป้าหลักและโดนช่องติดซ้ายขวา ร่ายเดี่ยวได้ หรือเติมธาตุใดก็ได้เพื่อใช้พลังและผลธาตุ ม่านของแต่ละตัวกันได้', formula: '5 มานา + ค่าธาตุ · พลังเดี่ยว 12/6 · เติมธาตุ 150%/75%' },
  heal: { rarity: 'rare', label: 'ฮีล', glyph: '+', description: 'ร่าย “ฮีล ตัวเอง” เพื่อฟื้น 4 HP ทันที หรือร่าย “โล่ ฮีล” เพื่อป้องกันพร้อมฟื้นเลือด', formula: 'ฮีล ตัวเอง 3 มานา · โล่ ฮีล 5 มานา' },
  self: { label: 'ตัวเอง', glyph: '◇', description: 'ระบุผู้ร่ายเป็นเป้าหมายของฮีล', formula: 'ใช้ต่อท้ายฮีล' },
  burn: { rarity: 'rare', label: 'เผา', glyph: '♨', description: 'เผา 3 ก่อนศัตรูทำแอ็กชันในเทิร์นถัดไป ผลเผาซ้ำรวมกัน', formula: '+1 มานา' },
  freeze: { rarity: 'special', label: 'แช่แข็ง', glyph: '❆', description: 'ต่อท้ายลูกหรือลำแสงตระกูลน้ำแข็ง ให้เป้าข้ามการโจมตีหนึ่งครั้ง', formula: '+3 มานา' },
  push: { rarity: 'rare', label: 'ผลัก', glyph: '›', description: 'ต่อท้ายลูกหรือพายุ เลื่อนเป้าหลักหนึ่งช่องถ้าช่องว่าง ศัตรูยังเก็บการชาร์จ', formula: '+1 มานา' },
  pull: { rarity: 'rare', label: 'ดึง', glyph: '‹', description: 'ต่อท้ายลูกหรือลำแสง ดึงเป้าที่โดนเข้าหาผู้ร่ายหนึ่งช่องเมื่อช่องว่าง', formula: '+1 มานา' },
  pierce: { rarity: 'special', label: 'ทะลวง', glyph: '↠', description: 'ต่อท้ายลูก คลื่น หรือพายุ เพื่อข้ามเกราะเพิ่ม 2 หน่วย ทั้งตอนกระทบและระเบิด', formula: '+1 มานา' },
  large: { rarity: 'rare', label: 'ใหญ่', glyph: '⬢', description: 'เพิ่มพลังลูก 1.5 เท่า เพิ่มโล่เป็น 9 ต่อชั้น หรือเพิ่มฮีลทันทีเป็น 8', formula: '+2 มานา' },
  grand: { rarity: 'special', label: 'มหา', glyph: '✦', description: 'วางหน้าคาถาโจมตีเพื่อเพิ่มแรง มหาระเบิดขยายรัศมี ใช้คู่กับลูก ระเบิด หรือพายุที่มีธาตุเดียวได้ มหาโล่และมหาฮีลมีผลเสริมต้นเทิร์นถัดไป', formula: 'โจมตี +3 มานา · มหาลูกคู่ +6 · มหาพายุคู่ +5 · มหาโล่ 6 · มหาฮีล 7' },
  seal: { rarity: 'special', label: 'ผนึก', glyph: '⌑', description: 'ต่อท้ายลูกธาตุเพื่อหยุดการฮีล เติมม่าน หรือสลับช่องครั้งถัดไปเมื่อโดนเป้า', formula: '+2 มานา' },
  dispel: { rarity: 'special', label: 'สลาย', glyph: '✧', description: 'ต่อท้ายลูกธาตุเพื่อสลายม่านทั้งหมดก่อนลูกนี้กระทบ', formula: '+2 มานา' },
  brace: { rarity: 'special', label: 'ยืนหยัด', glyph: '▣', description: 'ต่อท้ายโล่เพื่อให้กันเพิ่ม 6 เมื่อรับการโจมตีแรง 10 ขึ้นไปครั้งแรก', formula: 'โล่ ยืนหยัด · 4 มานา' },
});

export const ASCENDED_ELEMENTS = Object.freeze({ akki: 'fire', heman: 'ice', asani: 'lightning' });
export const FUSED_ELEMENTS = Object.freeze({ magma: 'fire', mist: 'ice', hail: 'ice', thunderstorm: 'lightning' });
export const elementFamily = id => ASCENDED_ELEMENTS[id] ?? FUSED_ELEMENTS[id] ?? id;
export function fireShieldLayers(shield, element) {
  if (!shield) return [];
  if (shield.layerEffects) return shield.layerEffects.flatMap((layer, index) => layer.elements.includes(element) ? [index] : []);
  const effect = element === 'akki' ? 'akki-blast' : 'blast';
  return [element, effect].includes(shield.effect) ? shield.layers.map((_, index) => index) : [];
}
export const ELEMENTS = ['fire', 'ice', 'lightning', ...Object.keys(ASCENDED_ELEMENTS), 'vayu', ...Object.keys(FUSED_ELEMENTS)];
export const ATTACK_FORMS = ['shot', 'beam', 'wave', 'storm'];
export const STANDALONE_WORDS = ['blackhole', 'death', 'meteor', 'veil'];
const SPELL_STARTS = {
  shot: ELEMENTS,
  beam: [...ELEMENTS, 'pair'],
  wave: [...ELEMENTS, 'pair'],
  storm: ELEMENTS,
  ...Object.fromEntries(STANDALONE_WORDS.map(id => [id, []])),
  shield: [...ELEMENTS, 'pair', 'large', 'heal', 'brace'],
  heal: ['self', 'large'],
  blast: ['shield', ...ELEMENTS],
  grand: [...ATTACK_FORMS, 'blast', 'heal', 'shield'],
};
export const STORM_FORMULAS = [
  ['storm'],
  ...ELEMENTS.flatMap(id => [
    ['storm', id], ['storm', id, 'pair'], ['storm', id, 'blast'], ['storm', id, 'pierce'], ['storm', id, 'push'],
    ...ELEMENTS.filter(other => other !== id).flatMap(other => [['storm', id, other], ['storm', id, other, 'blast']]),
  ]),
];
export const ADVANCED_FORMULAS = [...Object.keys(ASCENDED_ELEMENTS), 'vayu', ...Object.keys(FUSED_ELEMENTS)].flatMap(id => [
  ['shot', id], ['beam', id], ['wave', id], ['shot', id, 'pair'], ['shield', id], ['shield', id, 'pair'],
]);
export const START_WORDS = ['shot', 'fire', 'ice', 'pair', 'shield'];
export const LARGE_SHIELD_HP = 9;
export const LARGE_SHOT_FORMULAS = ELEMENTS.flatMap(id => [
  ['shot', id, 'large'],
  ['shot', id, 'large', 'pair'],
]);
export const LARGE_SHIELD_FORMULAS = [
  ['shield', 'large'], ['shield', 'large', 'pair'], ['shield', 'large', 'heal'],
  ...ELEMENTS.flatMap(id => [['shield', id, 'large'], ['shield', id, 'large', 'pair']]),
];
export const HEAL_AND_GRAND_DEFENSE_FORMULAS = [
  ['heal', 'large'], ['heal', 'self', 'large'], ['grand', 'heal'], ['grand', 'heal', 'self'], ['grand', 'shield'],
];
export const CROSS_FORM_FORMULAS = ELEMENTS.flatMap(id => [
  ['beam', id, 'pair'], ['wave', id, 'pair'], ['wave', id, 'blast'], ['wave', id, 'pierce'],
  ...(elementFamily(id) === 'ice' ? [['beam', id, 'freeze']] : []),
  ['shot', id, 'pull'], ['beam', id, 'pull'],
]);
export const GRAND_FORMULAS = [
  ['grand', 'storm'],
  ...ATTACK_FORMS.flatMap(form => ELEMENTS.map(id => ['grand', form, id])),
  ...ELEMENTS.map(id => ['grand', 'storm', id, 'pair']),
];

export function parseSpell(wordIds, library = Object.keys(WORDS)) {
  const fail = (index, error) => ({ ok: false, index, error });
  if (!Array.isArray(wordIds)) return fail(0, 'ลำดับคำไม่ถูกต้อง');
  const ids = wordIds.filter(id => id !== null && id !== '');
  if (!ids.length) return fail(0, 'เลือกคำจากคลังเพื่อประกอบคาถา');
  if (ids.length > 4) return fail(4, 'คาถานี้เกินสี่ช่องคำ');
  for (const [index, id] of ids.entries()) {
    if (!Object.hasOwn(WORDS, id)) return fail(index, 'ไม่รู้จักคำนี้');
    if (!library.includes(id)) return fail(index, `ยังไม่มีคำ “${WORDS[id].label}” ในชุดที่พก`);
  }

  const suffixIndex = ids.indexOf('devastation');
  const devastating = suffixIndex !== -1;
  if (devastating && suffixIndex !== ids.length - 1) return fail(suffixIndex, 'วาง “ทำลายล้าง” ไว้ท้ายสุดเท่านั้น');
  const baseIds = devastating ? ids.slice(0, -1) : ids;
  const allowedSecond = Object.hasOwn(SPELL_STARTS, baseIds[0]) ? SPELL_STARTS[baseIds[0]] : null;
  if (!allowedSecond) {
    return fail(0, devastating ? '“ทำลายล้าง” ใช้ต่อท้ายคาถาโจมตีเท่านั้น' : 'คำนี้ต่อกับวลีตรงนี้ไม่ได้');
  }
  if (baseIds[1] && !allowedSecond.includes(baseIds[1])) {
    return fail(1, ATTACK_FORMS.includes(baseIds[0]) ? 'เติมธาตุหลังรูปทรง' : 'คำนี้ต่อกับวลีตรงนี้ไม่ได้');
  }
  const grand = baseIds[0] === 'grand';
  const [head, ...tail] = grand ? baseIds.slice(1) : baseIds;
  if (grand && !SPELL_STARTS.grand.includes(head)) return fail(1, 'วางรูปเวท ฮีล หรือโล่หลัง “มหา”');
  const grandPair = ['shot', 'blast', 'storm'].includes(head) && tail.length === 2 && ELEMENTS.includes(tail[0]) && tail[1] === 'pair';
  if (grand && tail.length > 1 && !grandPair) return fail(3, '“มหา” ใช้คู่กับลูก พายุ หรือระเบิดที่มีธาตุหนึ่งคำได้');
  if (devastating && !ATTACK_FORMS.includes(head)) return fail(suffixIndex, '“ทำลายล้าง” ใช้ต่อท้ายคาถาโจมตีเท่านั้น');
  const [second, third, fourth] = ['beam', 'wave', 'shield'].includes(head) && tail[0] === 'pair' &&
    ELEMENTS.includes(tail[1]) && ELEMENTS.includes(tail[2])
    ? [tail[1], tail[2], 'pair'] : tail;
  const finish = spell => {
    if (grand && spell.type === 'attack') {
      const extraCost = spell.stormPair ? 5 : spell.form === 'shot' && spell.shots === 2 ? 6 : 3;
      const extraPierce = spell.stormPair ? 2 : 0;
      spell = {
        ...spell,
        grand: true,
        multiplier: spell.multiplier * 1.5,
        ...(extraPierce ? { pierce: (spell.pierce ?? 0) + extraPierce } : {}),
        cost: spell.cost + extraCost,
      };
    }
    if (devastating) spell = { ...spell, devastation: true, multiplier: spell.multiplier * 2, cost: spell.cost + WORDS.devastation.cost };
    return { ok: true, spell, cost: spell.cost, ids, expression: ids.map(id => WORDS[id].label).join(' ') };
  };
  const invalid = index => fail(index, 'คำนี้ต่อกับวลีตรงนี้ไม่ได้');
  if (head === 'veil') return finish({ type: 'self', form: 'shield', layers: 1, layerHp: 14, effect: 'veil', cost: WORDS.veil.cost });
  if (STANDALONE_WORDS.includes(head)) return finish({ type: 'attack', form: head, cost: WORDS[head].cost });
  if (head === 'blast') {
    if (!grand && second === 'shield') {
      if (!['fire', 'akki'].includes(third)) return invalid(2);
      return fourth ? invalid(3) : finish({ type: 'self', form: 'detonate', element: third, cost: 2 });
    }
    if (second ? !ELEMENTS.includes(second) : grand) return fail(grand ? 2 : 1, 'เติมธาตุหลัง “ระเบิด”');
    const paired = third === 'pair';
    const dual = ELEMENTS.includes(third);
    if (third && !dual && !paired) return invalid(2);
    if (dual && second === third) return fail(2, 'ระเบิดสองธาตุต้องใช้คำธาตุคนละชื่อ');
    if (fourth) return invalid(3);
    const elements = (dual ? [second, third] : second ? [second] : []).sort();
    const cost = WORDS.blast.cost + elements.reduce((sum, id) => sum + WORDS[id].cost, 0) - (dual ? 1 : 0) + (paired ? 3 : 0);
    return finish({ type: 'attack', form: 'blast', elements, multiplier: 1, blastPair: paired, cost });
  }
  if (head === 'heal') {
    if (grand) {
      if (second && second !== 'self') return invalid(2);
      return finish({ type: 'self', form: 'heal', healing: 6, nextHealing: 6, cost: 7 });
    }
    if (second === 'large' && !third || second === 'self' && third === 'large' && !fourth) {
      return finish({ type: 'self', form: 'heal', healing: 8, cost: 5 });
    }
    return second === 'self' && !third
      ? finish({ type: 'self', form: 'heal', healing: 4, cost: 3 }) : invalid(second === 'self' ? 2 : 1);
  }
  if (head === 'storm') {
    const dual = ELEMENTS.includes(third);
    const elements = ELEMENTS.includes(second) ? [second] : [];
    if (second && !elements.length) return invalid(grand ? 2 : 1);
    if (third && (!elements.length || (!dual && !['pair', 'blast', 'pierce', 'push'].includes(third)))) return invalid(2);
    if (fourth && !(dual && fourth === 'blast')) return invalid(3);
    if (dual && second === third) return fail(2, 'พายุสองธาตุต้องใช้คำธาตุคนละชื่อ');
    if (dual) elements.push(third);
    const stormPair = third === 'pair';
    const stormBlast = third === 'blast' || fourth === 'blast';
    const pierce = third === 'pierce' ? 2 : 0;
    const cost = WORDS.storm.cost + elements.reduce((total, id) => total + WORDS[id].cost, 0)
      - (dual ? 1 : 0) + (stormPair ? 3 : 0) + (stormBlast ? 2 : 0) + (pierce || third === 'push' ? 1 : 0);
    const spell = { type: 'attack', form: 'storm', elements: elements.sort(), shots: 1, blasts: 0, multiplier: elements.length ? 1.5 : 1, cost, stormPair, stormBlast };
    if (third === 'push') return finish({ ...spell, push: true });
    return finish(pierce ? { ...spell, pierce } : spell);
  }
  const fused = ELEMENTS.includes(second) && third === 'pair' && ELEMENTS.includes(fourth);
  const split = ELEMENTS.includes(second) && ELEMENTS.includes(third) && fourth === 'pair';
  if (head === 'shield') {
    if (grand) {
      if (second) return invalid(2);
      return finish({ type: 'self', form: 'shield', layers: 1, layerHp: 12, effect: null, shieldRenewal: 3, cost: 6 });
    }
    if (second === 'brace' && !third) {
      return finish({ type: 'self', form: 'shield', layers: 1, effect: 'brace', cost: 4 });
    }
    if (second === 'large') {
      if (third && !['pair', 'heal'].includes(third)) return invalid(2);
      if (fourth) return invalid(3);
      const layers = third === 'pair' ? 2 : 1;
      const healing = third === 'heal' ? 4 : 0;
      return finish({ type: 'self', form: 'shield', layers, layerHp: LARGE_SHIELD_HP, effect: null, healing, cost: 5 * layers + healing / 2 });
    }
    if (ELEMENTS.includes(second) && third === 'large') {
      if (fourth && fourth !== 'pair') return invalid(3);
      const layers = fourth ? 2 : 1;
      return finish({ type: 'self', form: 'shield', layers, layerHp: LARGE_SHIELD_HP, effect: second, cost: (4 + WORDS[second].cost) * layers });
    }
    if (fused || split) {
      const layerEffects = fused ? [[...new Set([second, fourth])].sort()] : [[second], [third]];
      return finish({ type: 'self', form: 'shield', layers: layerEffects.length, layerEffects, effect: null, healing: 0, cost: (fused ? 7 : 8) + (WORDS[second].cost - 2) + (WORDS[fused ? fourth : third].cost - 2) });
    }
    if (second === 'pair' && third) return invalid(2);
    if (second && !['pair', 'heal', ...ELEMENTS].includes(second)) return invalid(1);
    if (third && third !== 'pair' && !(['fire', 'akki'].includes(second) && third === 'blast')) return invalid(2);
    if (fourth) return invalid(3);
    const layers = second === 'pair' || third === 'pair' && second !== 'heal' ? 2 : 1;
    const healing = second === 'heal' ? third === 'pair' ? 8 : 4 : 0;
    const effect = third === 'blast' ? (second === 'akki' ? 'akki-blast' : 'blast') : ELEMENTS.includes(second) ? second : null;
    const premium = ELEMENTS.includes(second) ? WORDS[second].cost - 2 : 0;
    const cost = (3 + (effect ? 1 : 0) + premium) * layers + healing / 2 + (third === 'blast' ? 1 : 0);
    return finish({ type: 'self', form: 'shield', layers, effect, healing, cost });
  }

  const form = head;
  const element = second;
  if (!ATTACK_FORMS.includes(form)) return invalid(0);
  if (!ELEMENTS.includes(element)) return fail(grand ? 2 : 1, 'เติมธาตุหลังรูปทรง');
  const baseCost = { shot: 1, beam: 2, wave: 3 }[form] + WORDS[element].cost;
  const spell = { type: 'attack', form, elements: [element], shots: 1, blasts: 0, multiplier: 1, cost: baseCost };
  if (!third) return finish(spell);
  if (fused) {
    return finish({ ...spell, elements: [element, fourth].sort(), multiplier: element === fourth ? 1.5 : 1, cost: 2 * baseCost + WORDS[fourth].cost - WORDS[element].cost - 1 });
  }
  if (split) {
    return finish({ ...spell, secondElement: third, shots: form === 'wave' ? 1 : 2, cost: 2 * baseCost + WORDS[third].cost - WORDS[element].cost });
  }
  if (third === 'pull' && !fourth && ['shot', 'beam'].includes(form)) {
    return finish({ ...spell, pull: true, cost: baseCost + 1 });
  }
  if (form !== 'shot') {
    if (fourth) return invalid(3);
    if (third === 'pair') {
      return finish(form === 'wave'
        ? { ...spell, wavePair: true, cost: 2 * baseCost }
        : { ...spell, shots: 2, cost: 2 * baseCost });
    }
    if (form === 'wave' && third === 'blast') return finish({ ...spell, waveBlast: true, cost: baseCost + 2 });
    if (form === 'wave' && third === 'pierce') return finish({ ...spell, pierce: 2, cost: baseCost + 1 });
    if (form === 'beam' && third === 'freeze' && elementFamily(element) === 'ice') {
      return finish({ ...spell, freeze: 1, cost: baseCost + 3 });
    }
    return invalid(2);
  }
  if (third === 'pair' && (!fourth || fourth === 'blast')) {
    return finish({ ...spell, shots: 2, blasts: fourth ? 1 : 0, cost: 2 * (baseCost + (fourth ? 2 : 0)) });
  }
  if (third === 'blast' && (!fourth || fourth === 'pair')) {
    return finish({ ...spell, blasts: fourth ? 2 : 1, cost: baseCost + (fourth ? 4 : 2) });
  }
  if (third === 'pierce' && (!fourth || fourth === 'blast')) {
    return finish({ ...spell, pierce: 2, blasts: fourth ? 1 : 0, cost: baseCost + 1 + (fourth ? 2 : 0) });
  }
  if (third === 'large' && (!fourth || fourth === 'pair')) {
    const shots = fourth === 'pair' ? 2 : 1;
    return finish({ ...spell, shots, multiplier: 1.5, cost: (baseCost + 2) * shots });
  }
  if (fourth) return invalid(3);
  if (third === 'seal' || third === 'dispel') return finish({ ...spell, [third]: true, cost: baseCost + 2 });
  if (third === 'burn' && elementFamily(element) === 'fire') return finish({ ...spell, burn: 3, cost: baseCost + 1 });
  if (third === 'freeze' && elementFamily(element) === 'ice') return finish({ ...spell, freeze: 1, cost: baseCost + 3 });
  if (third === 'push') return finish({ ...spell, push: true, cost: baseCost + 1 });
  return invalid(2);
}

export const DEVASTATION_FORMULAS = [
  ...ELEMENTS.flatMap(id => [
    ['shot', id], ['beam', id], ['wave', id],
    ...['pair', 'blast', 'pierce', 'large', 'seal', 'dispel', 'burn', 'freeze', 'push'].map(mod => ['shot', id, mod]),
  ]),
  ...STORM_FORMULAS.filter(phrase => phrase.length < 4),
  ...CROSS_FORM_FORMULAS,
  ...GRAND_FORMULAS,
].map(phrase => [...phrase, 'devastation']).filter(phrase => parseSpell(phrase).ok);

let spellCatalog;
export function getSpellCatalog() {
  if (spellCatalog) return spellCatalog;
  const catalog = new Map();
  const library = Object.keys(WORDS);
  function addPhrase(phrase) {
    const parsed = parseSpell(phrase, library);
    if (parsed.ok) catalog.set(phrase.join(' '), parsed);
    if (phrase.length < 4) {
      const candidates = phrase.length === 1 ? [...SPELL_STARTS[phrase[0]], 'devastation'] : library;
      for (const id of candidates) addPhrase([...phrase, id]);
    }
  }
  for (const head of Object.keys(SPELL_STARTS)) addPhrase([head]);
  spellCatalog = catalog;
  return catalog;
}
