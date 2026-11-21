import {
  WORDS,
  ELEMENTS,
  ELEMENT_LABELS,
  CREATURE_STATS,
  STANDALONE_WORDS,
  LARGE_SHOT_FORMULAS,
  LARGE_SHIELD_FORMULAS,
  HEAL_AND_GRAND_DEFENSE_FORMULAS,
  ASCENDED_ELEMENTS,
  SECOND_TIER_ELEMENTS,
  FUSED_ELEMENTS,
  STORM_FORMULAS,
  DEVASTATION_FORMULAS,
  BARRAGE_FORMULAS,
  CROSS_FORM_FORMULAS,
  GRAND_FORMULAS,
  ADVANCED_FORMULAS,
  fireShieldLayers,
  getSpellCatalog,
  parseSpell,
  lightDamagePenalty,
} from './words.js';
import { getHandLimit, battleSpellCost, isBattleWordSpent } from './run.js';

export const ATTACK_CANDIDATES = Object.freeze([
  ['blackhole'], ['death'], ['meteor'],
  ...STORM_FORMULAS,
  ...CROSS_FORM_FORMULAS,
  ...GRAND_FORMULAS,
  ['chakram', 'fire', 'pair'],
  ['chakram', 'ice', 'pair'],
  ['chakram', 'lightning', 'pair'],
  ['chakram', 'earth', 'pair'],
  ['chakram', 'water', 'pair'],
  ['chakram', 'wind', 'pair'],
  ['chakram', 'fire', 'large'],
  ['chakram', 'ice', 'large'],
  ['chakram', 'lightning', 'large'],
  ['chakram', 'fire', 'pierce'],
  ['chakram', 'fire', 'blast'],
  ['chakram', 'fire'],
  ['chakram', 'lightning'],
  ['chakram', 'ice'],
  ['chakram', 'earth'],
  ['chakram', 'water'],
  ['chakram', 'wind'],
  ['shot', 'blast', 'fire', 'pair'],
  ['shot', 'blast', 'fire', 'ice'],
  ['shot', 'blast', 'fire', 'large'],
  ['shot', 'blast', 'fire'],
  ['shot', 'blast', 'ice'],
  ['shot', 'blast', 'lightning'],
  ['shot', 'blast', 'earth'],
  ['shot', 'blast', 'water'],
  ['shot', 'blast', 'wind'],
  ['shot', 'blast', 'large', 'pair'],
  ['shot', 'blast', 'large'],
  ['shot', 'blast', 'pair'],
  ['shot', 'blast'],
  ['blast', 'shot', 'fire', 'pair'],
  ['blast', 'shot', 'fire', 'large'],
  ['blast', 'shot', 'fire'],
  ['blast', 'shot', 'ice'],
  ['blast', 'shot', 'lightning'],
  ['blast', 'shot', 'large', 'pair'],
  ['blast', 'shot', 'large'],
  ['blast', 'shot', 'pair'],
  ['blast', 'shot'],
  ['blast', 'fire', 'large', 'pair'],
  ['blast', 'fire', 'pair'],
  ['blast', 'pair', 'fire'],
  ['blast', 'fire'],
  ['blast', 'pair'],
  ['blast'],
  ['shot', 'fire', 'pair', 'blast'],
  ['shot', 'fire', 'blast', 'pair'],
  ['shot', 'fire', 'pair', 'ice'],
  ['shot', 'fire', 'pair', 'lightning'],
  ['shot', 'water', 'pair', 'lightning'],
  ['shot', 'ice', 'pair', 'lightning'],
  ['shot', 'fire', 'pair', 'fire'],
  ['shot', 'ice', 'pair', 'ice'],
  ['shot', 'lightning', 'pair', 'lightning'],
  ['shot', 'earth', 'pair', 'earth'],
  ['shot', 'water', 'pair', 'water'],
  ['shot', 'wind', 'pair', 'wind'],
  ['shot', 'fire', 'ice', 'pair'],
  ['shot', 'fire', 'lightning', 'pair'],
  ['shot', 'water', 'lightning', 'pair'],
  ['shot', 'ice', 'lightning', 'pair'],
  ['shot', 'fire', 'blast'],
  ['shot', 'ice', 'blast'],
  ['shot', 'lightning', 'blast'],
  ['shot', 'earth', 'blast'],
  ['shot', 'water', 'blast'],
  ['shot', 'wind', 'blast'],
  ['shot', 'fire', 'pair'],
  ['shot', 'ice', 'pair'],
  ['shot', 'lightning', 'pair'],
  ['shot', 'earth', 'pair'],
  ['shot', 'water', 'pair'],
  ['shot', 'wind', 'pair'],
  ...LARGE_SHOT_FORMULAS,
  ...ADVANCED_FORMULAS.filter(([form]) => form !== 'shield'),
  ['shot', 'fire', 'burn'],
  ['shot', 'ice', 'freeze'],
  ['shot', 'fire', 'pierce', 'blast'],
  ['shot', 'fire', 'pierce'],
  ['shot', 'lightning', 'pierce'],
  ['shot', 'ice', 'pierce'],
  ['shot', 'earth', 'pierce'],
  ['shot', 'fire', 'push'],
  ['shot', 'ice', 'push'],
  ['shot', 'lightning', 'push'],
  ['beam', 'fire', 'pair', 'ice'],
  ['beam', 'fire', 'pair', 'lightning'],
  ['beam', 'fire', 'ice', 'pair'],
  ['beam', 'lightning', 'fire', 'pair'],
  ['beam', 'fire'],
  ['beam', 'lightning'],
  ['beam', 'ice'],
  ['beam', 'earth'],
  ['beam', 'water'],
  ['beam', 'wind'],
  ['wave', 'fire', 'pair', 'ice'],
  ['wave', 'fire', 'ice', 'pair'],
  ['wave', 'fire'],
  ['wave', 'ice'],
  ['wave', 'lightning'],
  ['wave', 'earth'],
  ['wave', 'water'],
  ['wave', 'wind'],
  ['spear', 'fire', 'pair'],
  ['spear', 'ice', 'pair'],
  ['spear', 'lightning', 'pair'],
  ['spear', 'fire', 'large'],
  ['spear', 'fire', 'pierce'],
  ['spear', 'fire', 'blast'],
  ['spear', 'fire'],
  ['spear', 'lightning'],
  ['spear', 'ice'],
  ['spear', 'earth'],
  ['spear', 'water'],
  ['spear', 'wind'],
  ['shot', 'fire'],
  ['shot', 'lightning'],
  ['shot', 'earth'],
  ['shot', 'water'],
  ['shot', 'wind'],
  ['shot', 'ice'],
]);

export const DEFENSE_CANDIDATES = Object.freeze([
  ['veil'],
  ['grand', 'veil'],
  ['veil', 'large'],
  ['veil', 'pair'],
  ...HEAL_AND_GRAND_DEFENSE_FORMULAS,
  ['blast', 'shield', 'fire'],
  ['shield', 'fire', 'blast'],
  ['shield', 'fire', 'heal'],
  ['shield', 'heal', 'large'],
  ['shield', 'heal', 'pair'],
  ['shield', 'heal'],
  ['shield', 'brace', 'pair'],
  ['shield', 'large', 'brace'],
  ['shield', 'brace'],
  ['heal', 'self', 'pair'],
  ['heal', 'self'],
  ['shield', 'fire', 'pair', 'ice'],
  ['shield', 'fire', 'pair', 'lightning'],
  ['shield', 'ice', 'pair', 'lightning'],
  ['shield', 'fire', 'ice', 'pair'],
  ['shield', 'fire', 'lightning', 'pair'],
  ['shield', 'ice', 'lightning', 'pair'],
  ['shield', 'fire', 'pair'],
  ['shield', 'ice', 'pair'],
  ['shield', 'lightning', 'pair'],
  ['shield', 'earth', 'pair'],
  ['shield', 'water', 'pair'],
  ['shield', 'wind', 'pair'],
  ['shield', 'pair'],
  ...LARGE_SHIELD_FORMULAS,
  ...ADVANCED_FORMULAS.filter(([form]) => form === 'shield'),
  ['fill', 'blood', 'large'],
  ['fill', 'blood'],
  ['fill', 'mana', 'large'],
  ['fill', 'mana'],
  ['grand', 'bless', 'fire'],
  ['grand', 'bless', 'ice'],
  ['grand', 'bless', 'lightning'],
  ['grand', 'bless', 'wari'],
  ['bless', 'fire', 'large'],
  ['bless', 'akki', 'large'],
  ['bless', 'fire'],
  ['bless', 'ice'],
  ['bless', 'lightning'],
  ['bless', 'earth'],
  ['bless', 'water'],
  ['bless', 'wind'],
  ['grand', 'empower', 'fire'],
  ['empower', 'fire', 'large'],
  ['empower', 'fire'],
  ['empower', 'ice'],
  ['empower', 'lightning'],
  ['empower', 'earth'],
  ['empower', 'water'],
  ['empower', 'wind'],
  ['shield', 'fire'],
  ['shield', 'ice'],
  ['shield', 'lightning'],
  ['shield', 'earth'],
  ['shield', 'water'],
  ['shield', 'wind'],
  ['shield'],
]);

export const MASTER_FORMULAS = Object.freeze(
  Array.from(getSpellCatalog(), ([key, parsed]) => {
    const isSummon = parsed.spell?.form === 'summon';
    const isBuff = ['empower', 'bless', 'ascension', 'timestop'].includes(parsed.spell?.form);
    const isManaFill = parsed.spell?.form === 'fill' && parsed.spell?.resource === 'mana';
    const isHeal = parsed.spell?.form === 'heal' || (parsed.spell?.healing ?? 0) > 0;
    const isDefense = parsed.spell?.type === 'self';
    const category = isSummon ? 'อัญเชิญ' : isBuff ? 'บัพ' : isManaFill ? 'มานา' : isHeal ? 'ฟื้นฟู' : isDefense ? 'โล่' : 'โจมตี';
    const group = isSummon ? 'summon' : (isDefense || isHeal ? 'defense' : 'attack');
    const kindClass = isSummon ? 'combo-summon' : (isHeal || isManaFill ? 'combo-heal' : isDefense ? 'combo-shield' : 'combo-attack');
    return Object.freeze({
      key,
      phrase: parsed.ids,
      expression: parsed.expression,
      cost: parsed.cost,
      category,
      group,
      kindClass,
      spell: parsed.spell,
    });
  }).sort((a, b) => a.phrase.length - b.phrase.length)
);

export function canFormCardsInHand(state, phrase) {
  if (!state?.player) return null;
  const { hand, words: deck } = state.player;
  if (hand.length > getHandLimit(state.player)) return null;
  const counts = {};
  for (const id of hand) counts[id] = (counts[id] ?? 0) + 1;
  const needed = {};
  for (const id of phrase) {
    needed[id] = (needed[id] ?? 0) + 1;
    if ((counts[id] ?? 0) < needed[id]) return null;
  }
  const p = parseSpell(phrase, deck);
  return p.ok && !isBattleWordSpent(state, p.spell.form) ? p : null;
}

export function canFormPhraseInHand(state, phrase) {
  const p = canFormCardsInHand(state, phrase);
  if (!p) return null;
  const effectiveCost = battleSpellCost(state, p);
  if (effectiveCost > state.player.mana) return null;
  if (p.spell.form === 'detonate' && !fireShieldLayers(state.player.shield, p.spell.element).length) return null;
  return effectiveCost === p.cost ? p : { ...p, cost: effectiveCost };
}

export function computePlayableCombos(state, words = [], discoveredKeys = []) {
  if (!state?.player || state.player.hand.length > getHandLimit(state.player)) return [];
  const discoveredSet = new Set([
    ...(state.stats?.discovered ?? []),
    ...(Array.isArray(discoveredKeys) ? discoveredKeys : [...discoveredKeys]),
  ]);
  const buildEntry = (phrase, parsed) => {
    const key = phrase.join(' ');
    const isBuff = ['empower', 'bless', 'ascension', 'timestop'].includes(parsed.spell.form);
    const isManaFill = parsed.spell.form === 'fill' && parsed.spell.resource === 'mana';
    const isHeal = parsed.spell.form === 'heal' || parsed.spell.healing > 0;
    const isDefense = parsed.spell.type === 'self';
    const category = isBuff ? 'บัพ' : isManaFill ? 'มานา' : isHeal ? 'ฟื้นฟู' : isDefense ? 'โล่' : 'โจมตี';
    const kindClass = isHeal || isManaFill ? 'combo-heal' : isDefense ? 'combo-shield' : 'combo-attack';
    return {
      key,
      phrase,
      expression: parsed.expression,
      cost: parsed.cost,
      category,
      kindClass,
      discovered: discoveredSet.has(key),
    };
  };
  const attacks = [];
  const attackCandidates = [
    ...(state.player.hand.includes('barrage') ? BARRAGE_FORMULAS : []),
    ...(state.player.hand.includes('devastation') ? DEVASTATION_FORMULAS : []),
    ...ATTACK_CANDIDATES,
  ];
  for (const phrase of attackCandidates) {
    const parsed = canFormPhraseInHand(state, phrase);
    if (parsed) {
      attacks.push(buildEntry(phrase, parsed));
      if (attacks.length >= 5) break;
    }
  }
  const defenses = [];
  for (const phrase of DEFENSE_CANDIDATES) {
    const parsed = canFormPhraseInHand(state, phrase);
    if (parsed) {
      defenses.push(buildEntry(phrase, parsed));
      if (defenses.length >= 4) break;
    }
  }
  const combined = [...attacks, ...defenses];
  if (words.length) {
    const activeParsed = canFormPhraseInHand(state, words);
    const activeKey = activeParsed ? activeParsed.ids.join(' ') : '';
    if (activeParsed && discoveredSet.has(activeKey) && !combined.some(c => c.key === activeKey)) {
      combined.unshift(buildEntry(activeParsed.ids, activeParsed));
    }
  }
  return combined;
}

export function describeFormulaEffect(formula) {
  const sp = formula.spell;
  if (!sp) return '';
  const [first] = formula.phrase;
  if (formula.phrase.length === 1 && STANDALONE_WORDS.includes(first)) return WORDS[first].description;
  if (sp.form === 'summon') {
    const cStats = CREATURE_STATS[sp.creature];
    const cName = cStats?.name || WORDS[sp.creature]?.label || sp.creature;
    const elemName = sp.element ? (ELEMENT_LABELS[sp.element] || WORDS[sp.element]?.label || sp.element) : 'ไร้ธาตุ';
    const hp = sp.grand ? Math.round((cStats?.baseHp ?? 15) * 1.5) : (cStats?.baseHp ?? 15);
    const counter = sp.grand ? Math.round((cStats?.baseCounter ?? 4) * 1.5) : (cStats?.baseCounter ?? 4);
    const strike = sp.grand ? Math.round((cStats?.baseStrike ?? 12) * 1.5) : (cStats?.baseStrike ?? 12);
    return `อัญเชิญ ${cName} (ธาตุ${elemName} · ${hp} HP) ยืนแนวหน้ารับดาเมจเดี่ยวแทนผู้เล่น · สวนกลับ ${counter} · เทิร์นหน้าออกหมัดประสาน ${strike} แล้วสลายตัว`;
  }
  if (sp.form === 'detonate') return `ระเบิดโล่${WORDS[sp.element].label}ที่มีอยู่ โจมตีศัตรูทุกตัว`;
  if (sp.delayed) return `รอดถึงต้นเทิร์นถัดไปเพื่อกางโล่ ${sp.layerHp} หน่วย 1 ชั้น · อยู่สองเทิร์นหลังเริ่มกาง`;
  if (sp.form === 'heal') {
    return `ฟื้น ${sp.healing} HP ทันที${sp.nextHealing ? ` และอีก ${sp.nextHealing} HP ต้นเทิร์นถัดไปถ้ารอด` : ''}`;
  }
  if (sp.form === 'fill') {
    return sp.resource === 'blood'
      ? `เติมเลือดฟื้น ${sp.healing} HP ทันที (แรงกว่าฮีลเพราะใช้คู่ 2 คำ)`
      : `เติมมานา +${sp.manaGain} MP ทันที`;
  }
  if (sp.form === 'empower' || sp.form === 'bless') {
    const names = (sp.elements ?? []).map(id => WORDS[id]?.label ?? id).join(' + ');
    return `บัพพลังเวทธาตุ${names} +${sp.buffPct}%${sp.buffPierce ? ` และเจาะเกราะ +${sp.buffPierce}` : ''} นาน ${sp.buffTurns} เทิร์น`;
  }
  if (sp.type === 'self') {
    const parts = [`สร้างโล่ ${sp.layers * (sp.layerHp ?? 6)} หน่วย (${sp.layers} ชั้น)`];
    if (sp.healing > 0) parts.push(`ฟื้น +${sp.healing} HP`);
    if (sp.nextHealing) parts.push(`ฟื้นอีก ${sp.nextHealing} HP ต้นเทิร์นถัดไปถ้ารอด`);
    if (sp.shieldRenewal) parts.push(`เติมโล่ ${sp.shieldRenewal} ต้นเทิร์นถัดไปถ้าโล่ยังอยู่`);
    if (sp.layerEffects) {
      const names = sp.layerEffects.map(elements => elements.map(id => WORDS[id].label).join(' + '));
      parts.push(names.length === 1 ? `ผสาน ${names[0]} ไว้ในโล่ชั้นเดียว` : `โล่ชั้นแรก ${names[0]} · ชั้นสอง ${names[1]}`);
    }
    if (sp.layerEffects || ELEMENTS.includes(sp.effect)) parts.push('ตอบโต้ศัตรูทุกครั้งที่ตีโดนชั้นโล่ธาตุ');
    if (sp.effect === 'veil') parts.push('ม่านแตกกันส่วนล้นเพิ่มได้อีก 8');
    if (sp.effect === 'brace') parts.push('กันเพิ่ม 6 เมื่อโดนโจมตีแรง 10 ขึ้นไปครั้งแรก');
    if (sp.effect === 'fire') parts.push('สะท้อนไฟใส่ผู้โจมตี');
    if (sp.effect === 'ice') parts.push('ติดหนาวผู้โจมตี');
    if (sp.effect === 'lightning') parts.push('ช็อตสายฟ้าสวนกลับ');
    if (sp.effect === 'earth') parts.push('สวนกลับด้วยดินและลดเกราะผู้โจมตี 1');
    if (sp.effect === 'water') parts.push('ทำให้ผู้โจมตีเปียก');
    if (sp.effect === 'wind') parts.push('พัดผลักผู้โจมตีถอย 1 ช่องถ้าช่องว่าง');
    if (Object.hasOwn(SECOND_TIER_ELEMENTS, sp.effect) || Object.hasOwn(FUSED_ELEMENTS, sp.effect)) parts.push(`สวนกลับด้วย${WORDS[sp.effect].label}`);
    return parts.join(' · ');
  }
  const formMap = {
    shot: sp.shellBlast ? 'ยิงกระสุนหัวระเบิด' : 'ยิงกระสุน',
    spear: 'หอกแทงทะลุ 2 ช่อง (เป้าหน้า 80% + ตัวหลังติดกัน 50%)',
    axe: 'ขวานจามเป้าเดียวด้วยพลัง 80% · ข้ามเกราะ · ม่านกันได้',
    chakram: 'กรงจักรเจาะเป้าเดี่ยวรุนแรง 180% (ไม่กระจายออกนอก)',
    beam: 'ลำแสงทะลุแถวและม่าน',
    wave: 'คลื่นกวาดศัตรูทุกตัว',
    blast: sp.blastShot
      ? `ระเบิดตรงเป้า (รัศมี ${sp.grand ? 2 : 1} ช่อง) ก่อนยิงกระสุนเสริม 60%`
      : `ระเบิดตรงเป้า · ช่องอื่นในรัศมี ${sp.grand ? 2 : 1} ช่องรับครึ่งพลัง · ม่านกันแยกเป้า`,
    storm: sp.elements.length ? 'พลังธาตุ 150% ใส่เป้าหลัก และ 75% ใส่ช่องข้าง' : 'พลัง 12 ใส่เป้าหลัก และ 6 ใส่ช่องข้าง',
    meteor: 'อุกกาบาตสุ่มตก 3 ครั้ง · เป้าหลัก 24 / กระจายช่องข้าง 12 (ข้ามม่าน)',
    blackhole: 'หลุมดำดูดศัตรูรวมจุดกลาง (ชนกันกระแทก 100 ทับซ้อนได้) · ยุบตัวเทิร์นหน้า 300 / 150 (ข้ามม่านและเกราะ)',
  };
  const parts = [formMap[sp.form] ?? 'โจมตีเวท'];
  if (sp.lightened) parts.push(`ค่าร่าย −1 มานา · พลังโจมตี −${lightDamagePenalty()}% ก่อนคิดเกราะ`);
  for (const id of new Set([...(sp.elements ?? []), sp.secondElement])) {
    if (['earth', 'water', 'wind'].includes(id) || Object.hasOwn(SECOND_TIER_ELEMENTS, id) || Object.hasOwn(FUSED_ELEMENTS, id)) parts.push(WORDS[id].description);
  }
  if (sp.form === 'storm' && sp.elements?.length === 2) parts.push('เฉลี่ยพลังสองธาตุและใช้ผลทั้งคู่');
  else if (sp.elements?.length === 2) parts.push(`ผสาน ${sp.elements.map(id => WORDS[id].label).join(' + ')} ในการโจมตีครั้งเดียว`);
  if (sp.secondElement) parts.push(`ครั้งแรกธาตุ${WORDS[sp.elements[0]].label} · ครั้งที่สองธาตุ${WORDS[sp.secondElement].label}`);
  if (sp.barrage) parts.push(sp.form === 'meteor' ? 'กระหน่ำสุ่มตก 15 ลูก (5 ชุด)' : 'กระหน่ำปล่อยพลัง 5 ครั้งต่อเนื่อง');
  if (sp.stormPair) parts.push('พายุระลอกสองที่ 60% ของระลอกแรก');
  if (sp.blastPair) parts.push(sp.grand ? 'ระเบิดซ้ำที่เดิมที่ 60% ของระลอกแรก' : 'ระเบิดสองครั้งที่จุดเดียว');
  if (sp.meteorPair) parts.push('อุกกาบาตสุ่มตก 6 ลูก (2 ชุด)');
  if (sp.wavePair) parts.push('คลื่นกวาดสนามสองระลอก');
  if (sp.waveBlast) parts.push('ระเบิดครึ่งพลังใส่จุดกระทบและช่องข้าง');
  if (sp.stormBlast) parts.push('เป้าหลักจุดระเบิดครึ่งพลังในรัศมี 2 ช่อง');
  if (sp.devastation) parts.push('แรงโจมตี ×2 · ระเบิดครึ่งพลังหนึ่งครั้งในรัศมี 2 ช่องเมื่อโจมตีโดน');
  if (sp.grand && sp.stormPair) parts.push('แรงโจมตี ×1.5 · กระจายครึ่งพลังไปช่องข้างทั้งสองระลอก');
  else if (sp.grand && sp.form === 'chakram') parts.push('แรงโจมตี ×1.5 เป้าเดี่ยวล้วน');
  else if (sp.grand && sp.form === 'spear') parts.push('แรงโจมตี ×1.5 ทะลุสองช่อง');
  else if (sp.grand && sp.form === 'axe') parts.push('แรงโจมตี ×1.5 เป้าเดียว');
  else if (sp.grand && ['blast', 'meteor', 'blackhole'].includes(sp.form)) parts.push('แรงโจมตี ×1.5');
  else if (sp.grand) parts.push('แรงโจมตี ×1.5 · กระจายครึ่งพลังไปช่องข้าง');
  if (sp.shots > 1 && !sp.meteorPair && !sp.barrage) parts.push(sp.form === 'beam' ? 'ลำแสงสองครั้ง' : sp.form === 'chakram' ? 'กรงจักรสองครั้ง' : sp.form === 'spear' ? 'พุ่งหอกสองครั้ง' : sp.blastShot ? 'ระเบิดและยิงซ้ำสองครั้ง' : `${sp.shots} ลูกต่อเนื่อง`);
  if (formula.phrase.includes('large')) parts.push('แรงเวท ×1.5');
  if (sp.blasts) parts.push('ระเบิดกระจายช่องข้างเคียง');
  if (sp.shellBlast) parts.push('ระเบิดรัศมี 1 ช่องเพิ่ม 60% (แรงกว่าระเบิดเดี่ยวและโดนทุกตัวในรัศมี)');
  if (sp.pierce) parts.push(`เจาะทะลุเกราะ +${sp.pierce}`);
  if (sp.push) {
    const hasWindSynergy = (sp.elements ?? []).some(id => ['wind', 'vayu', 'dust', 'monsoon', 'thunderstorm', 'heatwave', 'chillgale'].includes(id));
    parts.push(sp.form === 'storm'
      ? `ผลักเป้าที่เลือกถอย ${hasWindSynergy ? '2' : '1'} ช่อง (ชนศัตรูอีกตัวกระแทกทะลุเกราะทั้งสองตัว)`
      : `ผลักถอยหลัง ${hasWindSynergy ? '2' : '1'} ช่อง (ชนศัตรูอีกตัวกระแทกทะลุเกราะทั้งสองตัว)`);
  }
  if (sp.pull) parts.push('ดึงเป้าเข้าหา 1 ช่องถ้าช่องว่าง');
  if (sp.burn) parts.push('เผาไหม้ต่อเนื่อง');
  if (sp.freeze) parts.push('แช่แข็งข้ามเทิร์น');
  return parts.join(' · ');
}
