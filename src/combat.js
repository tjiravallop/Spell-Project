import { makeShield, shieldLayers, shieldProtection } from './shields.js';
import { ATTACK_FORMS, FUSED_ELEMENTS, WORDS, elementFamily, getElementComponents, fireShieldLayers, parseSpell, getWeaknessReaction, ELEMENT_LABELS } from './words.js';
import { RIFT_SPELL_BONUS, RIFT_EXPOSED_BONUS, isRiftBossExposed } from './upper-tower.js';
import {
  ENEMIES,
  FLOOR4_BOUNDARY_ROOM,
  FLOOR5_START_ROOM,
  FLOOR8_BOSS_ROOM,
  FLOOR10_BOSS_ROOM,
  FLOOR11_START_ROOM,
  FLOOR13_BOSS_ROOM,
  FLOOR15_START_ROOM,
  FLOOR18_BOSS_ROOM,
  FLOOR20_BOSS_ROOM,
  FLOOR21_START_ROOM,
  FLOOR30_BOSS_ROOM,
  FLOOR31_START_ROOM,
  FLOOR40_BOSS_ROOM,
  REVISIT_REWARD_RATE,
  applyExpAndGold,
  fallBackOnDefeat,
  fallBackToFloor4Sanctuary,
  fallBackToFloor9Sanctuary,
  fallBackToPost10Sanctuary,
  fallBackToFloor14Sanctuary,
  fallBackToFloor19Sanctuary,
  fallBackToUpperSanctuary,
  getCardSecondaryEffect,
  getEquippedRelics,
  getHandLimit,
  getMaxMana,
  grantBossRelic,
  getFloorInfo,
  hasCardSecondaryUpgrade,
  hasCardReward,
  cardRewardReplacesBounty,
  isUpperCacheRoom,
  unlockUpperTower,
  completeUpperFloor,
  intent,
  makeRewards,
  recoverAfterRoom,
  enterRoom,
  prepareEnemies,
  drawCards,
  isBossRoom,
  isRoomRevisit,
  recordClearedFloorProgress,
  resolveRiftBattleVictory,
  resolveRiftDefeat,
  completeRevisitVictoryToSanctuary,
  isSanctuaryUnlocked,
} from './run.js';

export const WORD_BASE_COST = Object.freeze({
  shot: 1,
  beam: 2,
  wave: 3,
  storm: WORDS.storm.cost,
  blackhole: WORDS.blackhole.cost,
  death: WORDS.death.cost,
  meteor: WORDS.meteor.cost,
  veil: WORDS.veil.cost,
  fire: 2,
  ice: 2,
  lightning: 2,
  earth: 2,
  water: 2,
  wind: 2,
  akki: 5,
  heman: 5,
  asani: 5,
  pathaphi: 5,
  wari: 5,
  vayu: WORDS.vayu.cost,
  magma: 7,
  mudmire: 7,
  dust: 7,
  permafrost: 7,
  magnet: 7,
  mist: 7,
  hail: 7,
  monsoon: 7,
  shockstream: 7,
  thunderstorm: 7,
  heatwave: 7,
  chillgale: 7,
  plasma: 7,
  scald: 7,
  frostvolt: 7,
  pair: 2,
  blast: 2,
  devastation: WORDS.devastation.cost,
  shield: 3,
  heal: 3,
  self: 0,
  burn: 1,
  freeze: 3,
  push: 1,
  pull: 1,
  pierce: 1,
  large: 2,
  grand: 3,
  seal: 2,
  dispel: 2,
  brace: 1,
});

export function estimateWordCost(wordIds, library = Object.keys(WORDS)) {
  if (!Array.isArray(wordIds)) return 0;
  const ids = wordIds.filter(id => id !== null && id !== '');
  if (!ids.length) return 0;
  const parsed = parseSpell(ids, library);
  if (parsed.ok) return parsed.cost;
  return Math.max(1, ids.reduce((sum, id) => sum + (WORD_BASE_COST[id] ?? 1), 0));
}

export function simulateTurn(original, spellInput, targetId, secondTargetId = targetId, options = {}) {
  if (original.phase !== 'battle') return { ok: false, error: 'ยังร่ายในช่วงนี้ไม่ได้' };
  if (original.player.hand.length > getHandLimit(original.player)) return { ok: false, error: 'เลือกทิ้งการ์ดที่เกินก่อนเล่นต่อ' };
  const guard = spellInput === 'guard';
  const allowFizzle = Boolean(options?.allowFizzle);
  const rawIds = guard ? [] : Array.isArray(spellInput) ? spellInput.filter(id => id !== null && id !== '') : [];
  if (!guard) {
    if (!Array.isArray(spellInput)) return { ok: false, index: 0, error: 'ลำดับคำไม่ถูกต้อง' };
    if (!rawIds.length) return { ok: false, index: 0, error: 'เลือกคำจากคลังเพื่อประกอบคาถา' };
    if (rawIds.length > 4) return { ok: false, index: 4, error: 'คาถานี้เกินสี่ช่องคำ' };
    for (const [index, id] of rawIds.entries()) {
      if (!Object.hasOwn(WORDS, id)) return { ok: false, index, error: 'ไม่รู้จักคำนี้' };
      if (!original.player.words.includes(id)) return { ok: false, index, error: `ยังไม่มีคำ “${WORDS[id].label}” ในชุดที่พก` };
    }
  }
  const parsed = guard ? null : parseSpell(rawIds, original.player.words);
  const detonateInvalid = Boolean(parsed?.ok && parsed.spell.form === 'detonate'
    && !fireShieldLayers(original.player.shield, parsed.spell.element).length);
  const fizzled = !guard && (!parsed.ok || detonateInvalid);
  if (!guard && !allowFizzle) {
    if (!parsed.ok) return parsed;
    if (detonateInvalid) return { ok: false, error: `ต้องมีโล่${WORDS[parsed.spell.element].label}อยู่ก่อนจึงระเบิดได้` };
  }
  const spell = !fizzled ? parsed?.spell : null;
  const cost = guard ? 0 : !fizzled ? parsed.cost : estimateWordCost(rawIds, original.player.words);
  if (cost > original.player.mana) return { ok: false, error: `ต้องใช้ ${cost} มานา ขณะนี้มี ${original.player.mana}` };
  const target = original.enemies.find(enemy => enemy.id === targetId && enemy.hp > 0);
  const slotTarget = typeof targetId === 'string' && /^slot-[0-4]$/.test(targetId) ? Number(targetId.at(-1)) : null;
  if (spell?.form === 'blackhole' && (slotTarget ?? target?.slot) === undefined) return { ok: false, error: 'เลือกช่องที่จะเปิดหลุมดำ' };
  if (spell?.type === 'attack' && !['wave', 'blackhole'].includes(spell.form) && !target) return { ok: false, error: 'เลือกศัตรูเป้าหมาย' };
  if (spell?.form === 'death') {
    if (original.deathSpent) return { ok: false, error: 'ใช้คำสั่งตายในศึกนี้ไปแล้ว' };
    if (ENEMIES[target.kind].isBoss) return { ok: false, error: 'บอสต้านคำสั่งตาย' };
  }
  if (spell?.shots === 2 && !original.enemies.some(enemy => enemy.id === secondTargetId && enemy.hp > 0)) return { ok: false, error: 'เลือกเป้าหมายสำหรับการโจมตีครั้งที่สอง' };

  const remainingHand = [...original.player.hand];
  for (const id of guard ? [] : rawIds) {
    const index = remainingHand.indexOf(id);
    if (index < 0) return { ok: false, error: `การ์ด “${WORDS[id]?.label ?? id}” ในมือไม่พอ` };
    remainingHand.splice(index, 1);
  }

  const state = structuredClone(original);
  const { player, enemies, turn } = state;
  const magmaPuddles = state.magmaPuddles ?? [];
  const nextMagmaPuddles = new Set();
  const pendingBlackhole = state.blackhole;
  delete state.blackhole;
  player.level ??= 1;
  player.exp ??= 0;
  player.gold ??= 0;
  player.items ??= [];
  player.stash ??= [];
  player.relics ??= [];
  player.blessings ??= [];
  player.cardUpgrades ??= {};
  player.cardSecondaryUpgrades ??= {};
  state.clearedRooms ??= [];
  state.highestRoom ??= state.room;
  const revisit = isRoomRevisit(state, state.room);
  const dropsCardReward = hasCardReward(state);
  const skipBossBounty = dropsCardReward && cardRewardReplacesBounty(state);
  const upgrades = player.cardUpgrades;
  const secondaryUpgrades = player.cardSecondaryUpgrades;
  const blessings = player.blessings;
  const equippedRelics = getEquippedRelics(player);
  const hasEmberCore = equippedRelics.includes('ember_core_10');
  const hasStormPendulum = equippedRelics.includes('storm_pendulum_20');
  const hasCrown = equippedRelics.includes('forbidden_crown_30');
  const hasMirrorPrism = equippedRelics.includes('mirror_prism_40');
  const hasWorldloom = equippedRelics.includes('worldloom_50');
  const hasMagmaHeart = equippedRelics.includes('magma_heart_60');
  const hasThunderConduit = equippedRelics.includes('thunder_conduit_70');
  const hasGaiaEmblem = equippedRelics.includes('gaia_emblem_80');
  const hasVoidAnnihilator = equippedRelics.includes('void_annihilator_90');
  const hasCrownOfEternity = equippedRelics.includes('crown_of_eternity_100');
  const inRift = state.room >= FLOOR31_START_ROOM;

  // Calculate card upgrade bonuses from the words placed in this spell phrase
  const uniquePhraseIds = [...new Set(rawIds)];
  const phraseUpgradeSum = filterFn => uniquePhraseIds.filter(filterFn).reduce((sum, id) => sum + (upgrades[id] ?? 0), 0);
  const unlockedSecondaryEffects = !guard && !fizzled
    ? uniquePhraseIds
        .filter(id => hasCardSecondaryUpgrade(state, id))
        .map(id => getCardSecondaryEffect(id, Math.max(7, upgrades[id] ?? 0)))
    : [];
  const secondaryShieldBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.shieldBonus ?? 0), 0);
  const secondaryHealBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.healBonus ?? 0), 0);
  const secondaryPierceBonus = unlockedSecondaryEffects.reduce((sum, eff) => sum + (eff.pierceBonus ?? 0), 0);

  const formUpgradeBonus = phraseUpgradeSum(id => ATTACK_FORMS.includes(id));
  const auxUpgradeBonus = phraseUpgradeSum(id => ['pair', 'large', 'grand', 'push', 'pull', 'freeze', 'self', 'seal', 'dispel', 'brace'].includes(id));
  const pierceUpgradeBonus = (rawIds.includes('pierce') ? (upgrades.pierce ?? 0) : 0) + secondaryPierceBonus;
  const burnUpgradeBonus = rawIds.includes('burn') ? (upgrades.burn ?? 0) : 0;
  const blastUpgradeBonus = phraseUpgradeSum(id => id === 'blast');
  const devastationUpgradeBonus = phraseUpgradeSum(id => id === 'devastation');
  const shieldUpgradeBonus = phraseUpgradeSum(id => id === 'shield' || id === 'veil') * 2 + auxUpgradeBonus + (blessings.includes('blessing_vitality') ? 2 : 0);
  const healUpgradeBonus = (rawIds.includes('heal') ? (upgrades.heal ?? 0) * 2 : 0) + auxUpgradeBonus + (blessings.includes('blessing_vitality') ? 2 : 0);

  player.hand = remainingHand;
  const events = [];
  const summary = {
    cost,
    manaAfterCast: player.mana - cost,
    damage: 0,
    incoming: 0,
    blocked: 0,
    wards: 0,
    healed: 0,
    secondaryShield: secondaryShieldBonus,
    expGain: 0,
    goldGain: 0,
    levelUps: [],
    revisit,
    sequence: [],
    fizzled,
  };
  const live = () => enemies.filter(enemy => enemy.hp > 0).sort((a, b) => a.slot - b.slot);
  const enemyById = id => enemies.find(enemy => enemy.id === id);
  const newBurn = new Map();
  let block = (guard ? 3 + (hasWorldloom ? 3 : 0) : 0) + secondaryShieldBonus + (hasGaiaEmblem ? 3 : 0);
  player.mana -= cost;
  if (!guard && !fizzled && spell && hasThunderConduit) {
    const castElements = [...(spell.elements ?? []), ...(spell.secondElement ? [spell.secondElement] : [])];
    const isLightning = castElements.some(id => getElementComponents(id).includes('lightning'));
    if (isLightning) {
      const manaRefund = Math.min(getMaxMana(player) - player.mana, 1);
      if (manaRefund > 0) {
        player.mana += manaRefund;
        summary.manaRefunded = (summary.manaRefunded ?? 0) + manaRefund;
        summary.manaAfterCast = player.mana;
        events.push({ type: 'mana-refund', amount: manaRefund, relicId: 'thunder_conduit_70' });
        summary.sequence.push(`แกนนำอสุนีบาตคืน +${manaRefund} มานา`);
      }
    }
  }

  function awardEnemyBounty(enemy) {
    const base = ENEMIES[enemy.kind];
    if (!base) return;
    const bossEnemy = Boolean(base.isBoss || isBossRoom(state));
    // Regular monsters and Floor 10/20 relic bosses always drop Gold & EXP; Card bosses drop Gold & EXP when revisited or already rewarded earlier
    if (bossEnemy && skipBossBounty) return;
    const rate = (revisit ? REVISIT_REWARD_RATE : 1) * (blessings.includes('blessing_fortune') ? 1.35 : 1);
    const expGain = Math.max(1, Math.floor((base.exp ?? 8) * rate));
    const goldGain = Math.max(1, Math.floor((base.gold ?? 6) * rate));
    summary.expGain += expGain;
    summary.goldGain += goldGain;
    const gainedLevels = applyExpAndGold(player, expGain, goldGain);
    if (gainedLevels.length) summary.levelUps.push(...gainedLevels);
  }

  const formsHit = new Map();
  let spellVfxFlags = !guard && !fizzled && spell
    ? { ...(spell.grand ? { grand: true } : {}), ...(spell.large ? { large: true } : {}) }
    : {};

  function damage(enemy, strength, element, pierce = 0, attackForm = null) {
    if (enemy.hp <= 0) return;
    const spellBonus = state.room >= FLOOR31_START_ROOM && element !== 'death' ? RIFT_SPELL_BONUS : 0;
    const empowered = strength + strength * spellBonus / 100;
    const exposedBonus = isRiftBossExposed(enemy.kind, turn) ? RIFT_EXPOSED_BONUS : 0;
    const afterArmor = Math.max(0, Math.ceil(empowered + empowered * exposedBonus / 100) - Math.max(0, enemy.armor - pierce));
    const reduction = attackForm && attackForm === enemy.readForm && !exposedBonus ? ENEMIES[enemy.kind].repeatReduction ?? 0 : 0;
    const guardedByAllies = state.room === FLOOR30_BOSS_ROOM && enemy.kind === 'crown_archivist'
      && live().some(ally => ally.id !== enemy.id);
    const baseDmg = Math.ceil(afterArmor * (100 - reduction) / 100 * (guardedByAllies ? 0.75 : 1));
    if (guardedByAllies && afterArmor > 0) summary.sequence.push('ตราประสานลดดาเมจบอส 25% เพราะยังมีลูกสมุน');

    const enemyAffinity = enemy.affinity ?? ENEMIES[enemy.kind]?.affinity ?? null;
    const reaction = getWeaknessReaction(element, enemyAffinity);
    let amount = baseDmg;
    let weakBonus = 0;
    let resistLoss = 0;

    if (baseDmg > 0 && reaction.isWeak) {
      weakBonus = Math.ceil(baseDmg * 0.25);
      amount = baseDmg + weakBonus;
      summary.sequence.push(`⚡ โจมตีเข้าจุดอ่อน! ${ENEMIES[enemy.kind]?.name ?? enemy.kind} แพ้ทาง ${ELEMENT_LABELS[reaction.triggerElement]} (+${weakBonus} ดาเมจ)`);
    } else if (baseDmg > 0 && reaction.isResist) {
      amount = Math.max(1, Math.floor(baseDmg * 0.8));
      resistLoss = baseDmg - amount;
      summary.sequence.push(`🛡 ${ENEMIES[enemy.kind]?.name ?? enemy.kind} ต้านทาน ${ELEMENT_LABELS[reaction.triggerElement]} (−${resistLoss} ดาเมจ)`);
    }

    if (amount > 0 && attackForm && ENEMIES[enemy.kind]?.repeatReduction) {
      if (reduction && !formsHit.has(enemy.id)) summary.sequence.push(`${ENEMIES[enemy.kind].name} อ่านทาง${WORDS[attackForm].label} · ลดดาเมจ ${reduction}%`);
      formsHit.set(enemy.id, attackForm);
    }
    const actual = Math.min(amount, enemy.hp);
    enemy.hp -= actual;
    summary.damage += actual;
    const killed = enemy.hp === 0;
    const event = {
      type: 'damage',
      target: enemy.id,
      amount,
      actual,
      element,
      killed,
      ...spellVfxFlags,
      ...(reduction && { reduction }),
      ...(reaction.isWeak && { weakness: true, weakBonus, triggerElement: reaction.triggerElement }),
      ...(reaction.isResist && { resisted: true, resistLoss, triggerElement: reaction.triggerElement }),
    };
    events.push(event);
    if (killed) {
      const hpBefore = player.hp;
      const maxHpBefore = player.maxHp;
      awardEnemyBounty(enemy);
      if (hasVoidAnnihilator) {
        const manaRefund = Math.min(getMaxMana(player) - player.mana, 3);
        if (manaRefund > 0) {
          player.mana += manaRefund;
          summary.manaRefunded = (summary.manaRefunded ?? 0) + manaRefund;
          summary.manaAfterCast = player.mana;
          events.push({ type: 'mana-refund', amount: manaRefund, relicId: 'void_annihilator_90' });
          summary.sequence.push(`ศิลาล้างมิติคืน +${manaRefund} มานาจากการสังหาร`);
        }
      }
      if (player.maxHp > maxHpBefore) {
        event.levelHp = player.hp - hpBefore;
        event.levelMaxHp = player.maxHp - maxHpBefore;
      }
    }
  }

  function applyEarthArmorShred(enemy, amount) {
    if (enemy.hp <= 0 || amount <= 0) return;
    const actual = Math.min(enemy.armor, amount);
    enemy.armor = Math.max(0, enemy.armor - amount);
    enemy.permanentArmorShred = Math.min(10, (enemy.permanentArmorShred ?? 0) + amount);
    if (actual > 0) {
      events.push({ type: 'armor-shred', target: enemy.id, amount: actual, armor: enemy.armor });
      summary.sequence.push(`ทุบเกราะช่อง ${enemy.slot + 1} ถาวร −${actual} (เหลือ ${enemy.armor})`);
    }
  }

  function applyMoisture(enemy, elements) {
    if (elements.includes('hail')) {
      if (enemy.wetUntil >= turn) {
        delete enemy.wetUntil;
        enemy.freeze++;
        events.push({ type: 'status', status: 'freeze', target: enemy.id });
      } else enemy.chill += 2;
    }
    if (elements.includes('mist')) {
      enemy.wetUntil = turn + 1;
      enemy.obscured = true;
    }
    if (elements.includes('mudmire')) {
      enemy.wetUntil = turn + 1;
      enemy.chill += 3;
    }
    if (elements.includes('water')) enemy.wetUntil = turn + 1;
    if (elements.includes('wari')) {
      enemy.wetUntil = turn + 1;
      for (const candidate of live()) {
        if (Math.abs(candidate.slot - enemy.slot) === 1) candidate.wetUntil = turn + 1;
      }
    }
    if (elements.includes('monsoon')) {
      for (const candidate of live()) {
        candidate.wetUntil = turn + 1;
      }
    }
  }

  function hit(enemy, strength, pierce, elements) {
    const families = elements.map(elementFamily);
    const conductivity = families.includes('lightning') && (enemy.wetUntil >= turn || families.includes('water')) ? 2 : 0;
    damage(enemy, strength + conductivity, elements.length > 1 ? elements : (elements[0] ?? spell.form), pierce, spell.form);
    const earthGain = elements.includes('permafrost') ? 6
      : elements.includes('pathaphi') ? 4
      : elements.includes('earth') ? 2 : 0;
    if (earthGain > 0) {
      block += earthGain;
      events.push({
        type: 'shield',
        amount: earthGain,
        secondary: true,
        element: elements.includes('permafrost') ? 'permafrost' : elements.includes('pathaphi') ? 'pathaphi' : 'earth',
        protection: protection(),
      });
    }
    if (elements.includes('monsoon') && !summary.monsoonHealed) {
      summary.monsoonHealed = true;
      heal(4, false, 'water');
      summary.sequence.push('คลื่นมรสุมฟื้นฟู +4 HP');
    }
    if (elements.includes('wari') && !summary.wariHealed) {
      summary.wariHealed = true;
      heal(4, false, 'water');
      summary.sequence.push('คลื่นวารีฟื้นฟู +4 HP');
    } else if (elements.includes('water') && !summary.waterHealed) {
      summary.waterHealed = true;
      heal(2, false, 'water');
      summary.sequence.push('ละอองวารีฟื้นฟู +2 HP');
    }
    if (enemy.hp <= 0) return;
    const frozen = elements.some(id => ['ice', 'heman', 'wari', 'chillgale', 'frostvolt'].includes(id));
    if (frozen) enemy.chill += (elements.includes('ice') || elements.includes('heman') || elements.includes('chillgale') || elements.includes('frostvolt')) ? 4 : 2;
    if (elements.includes('heman') || elements.includes('chillgale')) enemy.lastingChill = true;
    if (elements.includes('akki')) enemy.healCutUntil = turn + 1;
    if (elements.includes('permafrost') || elements.includes('scald') || elements.includes('pathaphi')) {
      applyEarthArmorShred(enemy, 2);
    } else if (elements.includes('earth') || elements.includes('dust')) {
      applyEarthArmorShred(enemy, 1);
    }
    applyMoisture(enemy, elements);
    if (elements.includes('heatwave')) burnNearby(enemy);
    if (elements.includes('shockstream')) shockWetEnemies(enemy, spell.form);
    if (spell.freeze) {
      enemy.freeze += spell.freeze;
      events.push({ type: 'status', status: 'freeze', target: enemy.id });
    }
    if (spell.burn) {
      const burnAmount = spell.burn
        + burnUpgradeBonus
        + (blessings.includes('blessing_ember') && elements.some(id => elementFamily(id) === 'fire') ? 1 : 0)
        + (hasEmberCore && elements.some(id => getElementComponents(id).includes('fire')) ? 1 : 0);
      newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + burnAmount);
      events.push({ type: 'status', status: 'burn', target: enemy.id });
    }
  }

  function burnNearby(enemy) {
    for (const target of live().filter(candidate => Math.abs(candidate.slot - enemy.slot) <= 1)) {
      newBurn.set(target.id, (newBurn.get(target.id) ?? 0) + 4);
      events.push({ type: 'status', status: 'burn', target: target.id });
    }
  }

  function shockWetEnemies(enemy, attackForm) {
    for (const target of live()) {
      if (target.id !== enemy.id && target.wetUntil >= turn) {
        damage(target, 10, 'shockstream', 2, attackForm);
        summary.sequence.push(`กระแสช็อตชิ่งไปช่อง ${target.slot + 1}`);
      }
    }
  }

  function chainLightning(enemy, strength, pierce, sweep, element = 'asani', attackForm = null, flatBonus = 0) {
    if (sweep?.chained) return;
    const neighbor = live().find(target => Math.abs(target.slot - enemy.slot) === 1 && !sweep?.warded?.has(target.id));
    if (!neighbor) return;
    if (sweep) sweep.chained = true;
    events.push({ type: 'chain-lightning', source: enemy.id, target: neighbor.id, element, ...spellVfxFlags });
    damage(neighbor, strength / 2 + flatBonus + (neighbor.wetUntil >= turn ? 2 : 0), element, pierce, attackForm);
    if (element === 'frostvolt') {
      neighbor.chill += 4;
      events.push({ type: 'status', status: 'chill', target: neighbor.id });
    }
    summary.sequence.push(`${WORDS[element].label}ชิ่งไปช่อง ${neighbor.slot + 1}`);
  }

  function pushEnemy(enemy, direction = 1) {
    const slot = enemy.slot + direction;
    if (enemy.hp <= 0) return;
    if (slot < 0 || slot > 4 || live().some(other => other.slot === slot)) {
      const isWind = (spell?.elements ?? []).some(id => elementFamily(id) === 'wind') || direction === 1;
      if (isWind) {
        const isBoostedSlam = (spell?.elements ?? []).some(id => ['vayu', 'dust', 'heatwave', 'chillgale'].includes(id));
        const slamDmg = isBoostedSlam ? 6 : 3;
        damage(enemy, slamDmg, 'wind', 0, spell.form);
        summary.sequence.push(`ลมกระแทกชน +${slamDmg} ดาเมจ`);
        events.push({ type: 'wall-slam', target: enemy.id, amount: slamDmg });
      }
      return;
    }
    enemy.slot = slot;
    events.push({ type: 'push', target: enemy.id, slot, ...(direction < 0 ? { pulled: true } : {}) });
  }

  function leaveMagma(slot) {
    if (nextMagmaPuddles.has(slot)) return;
    nextMagmaPuddles.add(slot);
    events.push({ type: 'magma-puddle', slot });
    summary.sequence.push(`วางแอ่งแมกม่าช่อง ${slot + 1}`);
  }

  function enemyHealing(target, amount) {
    const effective = target.healCutUntil >= turn ? Math.floor(amount / 2) : amount;
    return Math.min(effective, target.maxHp - target.hp);
  }

  function blast(target, targets, element, applyHit, extra) {
    const event = { type: 'blast', target, targets: targets.map(enemy => enemy.id), element, ...extra };
    events.push(event);
    const start = events.length;
    targets.forEach(applyHit);
    event.effectCount = events.length - start;
  }

  function expandedBlast(trigger, warded, kind) {
    if (!trigger) return;
    const devastation = kind === 'devastation';
    const radius = kind === 'wave' || kind === 'grand' ? 1 : 2;
    const { center, slot, strength, pierce, elements } = trigger;
    const targets = live().filter(enemy => Math.abs(enemy.slot - slot) <= radius && enemy.ward === 0
      && (kind !== 'grand' || enemy.slot !== slot)
      && (devastation && enemy === center || !warded.has(enemy.id)));
    const name = kind === 'wave' ? WORDS.blast.label : WORDS[kind].label;
    const bonus = devastation ? devastationUpgradeBonus : blastUpgradeBonus;
    blast(center.id, targets, elements[0] ?? spell.form, enemy => {
      hit(enemy, strength / 2 + bonus, pierce, elements);
    }, { originSlot: slot, devastation, grand: Boolean(spell.grand), large: Boolean(spell.large), elements: [...new Set(elements)] });
    summary.sequence.push(`${name} · ${targets.length} เป้าหมาย`);
  }

  function applyIncomingToPlayer(rawAmount, triggerShieldEffects = true) {
    let remaining = rawAmount;
    const guarded = Math.min(block, remaining);
    block -= guarded;
    remaining -= guarded;
    const layers = shieldLayers(player.shield);
    let broken = 0;
    let veilBroke = false;
    const effects = new Set();
    const explosions = [];
    while (remaining > 0 && layers.length) {
      const layer = layers[0];
      if (triggerShieldEffects && rawAmount >= 10 && layer.effect === 'brace' && !layer.triggered) {
        layer.hp += 6;
        for (const brace of layers) {
          if (brace.effect === 'brace' && brace.expires === layer.expires) brace.triggered = true;
        }
        player.shield = makeShield(layers);
        events.push({ type: 'brace', amount: 6, protection: protection() });
        summary.sequence.push('โล่ยืนหยัดเสริมการป้องกัน 6');
      }
      const absorbedLayer = Math.min(layer.hp, remaining);
      remaining -= absorbedLayer;
      layer.hp -= absorbedLayer;
      if (triggerShieldEffects && absorbedLayer > 0) {
        for (const effect of layer.elements ?? (WORDS[layer.effect]?.damage ? [layer.effect] : [])) effects.add(effect);
      }
      if (!layer.hp) {
        layers.shift();
        broken++;
        if (layer.effect === 'veil') veilBroke = true;
        if (layer.effect === 'blast' || layer.effect === 'akki-blast') explosions.push(layer.effect === 'akki-blast' ? 'akki' : 'fire');
      }
    }
    player.shield = makeShield(layers);
    if (triggerShieldEffects && broken && hasMagmaHeart) {
      for (const enemy of live()) damage(enemy, 12, 'fire', 0);
      summary.sequence.push('หัวใจแมกมาปะทุ · ระเบิดเพลิง 12 ใส่ศัตรูทั้งหมดเมื่อโล่แตก');
    }
    if (triggerShieldEffects && veilBroke && remaining > 0) {
      const extra = Math.min(remaining, 8);
      remaining -= extra;
      summary.sequence.push(`ม่านแตก · กันส่วนล้น ${extra}`);
    }
    const absorbed = rawAmount - remaining;
    const actual = Math.min(remaining, player.hp);
    player.hp -= actual;
    summary.blocked += absorbed;
    summary.incoming += actual;
    return { actual, absorbed, effects, explosions };
  }

  function attackPower(elements, targetScale = 1) {
    const families = elements.map(elementFamily);
    const base = elements.length ? elements.reduce((sum, id) => {
      const elemUpgrade = upgrades[id] ?? 0;
      const family = elementFamily(id);
      const blessingBonus = (family === 'fire' && blessings.includes('blessing_ember') ? 2 : 0)
        + (family === 'ice' && blessings.includes('blessing_frost') ? 2 : 0)
        + (family === 'lightning' && blessings.includes('blessing_thunder') ? 2 : 0);
      const relicBonus = (hasEmberCore && getElementComponents(id).includes('fire') ? 2 : 0)
        + (hasMagmaHeart && (getElementComponents(id).includes('fire') || getElementComponents(id).includes('earth')) ? 3 : 0)
        + (hasThunderConduit && getElementComponents(id).includes('lightning') ? 6 : 0);
      return sum + WORDS[id].damage + elemUpgrade + blessingBonus + relicBonus;
    }, 0) / elements.length : (spell.shellDamage ?? WORDS[spell.form].damage);
    let strength = (base + formUpgradeBonus + auxUpgradeBonus) * spell.multiplier * targetScale;
    const isDualFusion = elements.length > 1 || elements.some(id => Boolean(FUSED_ELEMENTS[id]));
    if (hasCrownOfEternity && isDualFusion) {
      strength = Math.round(strength * 1.5);
    }
    const pierce = (spell.pierce ?? 0)
      + pierceUpgradeBonus
      + (hasMirrorPrism && spell.form === 'beam' ? 3 : 0)
      + (hasVoidAnnihilator ? 4 : 0)
      + (families.includes('lightning') || elements.some(id => ['plasma', 'shockstream', 'frostvolt', 'magnet', 'thunderstorm'].includes(id)) ? 2 : 0)
      + (blessings.includes('blessing_thunder') ? 1 : 0);
    return { strength, pierce };
  }

  function pullNeighborsToward(enemy) {
    for (const neighbor of live()) {
      if (neighbor.slot < enemy.slot) pushEnemy(neighbor, 1);
      else if (neighbor.slot > enemy.slot) pushEnemy(neighbor, -1);
    }
  }

  function elementAfterHit(enemy, elements, strength, pierce, sweep, slot) {
    if (elements.includes('magma')) leaveMagma(slot);
    const gust = elements.some(id => ['wind', 'vayu', 'thunderstorm', 'dust', 'heatwave', 'chillgale'].includes(id));
    if (gust) pushEnemy(enemy);
    if (elements.includes('monsoon')) {
      for (const target of live()) {
        if (target.id !== enemy.id) pushEnemy(target);
      }
    }
    if (elements.includes('magnet')) pullNeighborsToward(enemy);
    const conduitBonus = hasThunderConduit ? 6 : 0;
    const hasLightningElem = elements.some(id => getElementComponents(id).includes('lightning'));
    if (elements.includes('frostvolt')) chainLightning(enemy, strength, pierce, sweep, 'frostvolt', spell.form, conduitBonus);
    else if (elements.includes('thunderstorm')) chainLightning(enemy, strength, pierce, sweep, 'thunderstorm', spell.form, conduitBonus);
    else if (elements.includes('asani')) chainLightning(enemy, strength, pierce, sweep, 'asani', spell.form, conduitBonus);
    else if (hasThunderConduit && hasLightningElem) chainLightning(enemy, 0, pierce, sweep, 'lightning', spell.form, 6);
    return gust;
  }

  function impact(enemy, elements = spell.elements, sweep, targetScale = 1) {
    if (player.hp <= 0 || enemy.hp <= 0) return;
    const { strength, pierce } = attackPower(elements, targetScale);
    if (spell.dispel && enemy.ward > 0) {
      const amount = enemy.ward;
      summary.wards += amount;
      enemy.ward = 0;
      events.push({ type: 'dispel', target: enemy.id, amount });
      summary.sequence.push(`สลายม่านช่อง ${enemy.slot + 1} ${amount} ชั้น`);
    }
    const blocked = spell.form !== 'beam' && enemy.ward > 0;
    if (blocked) { enemy.ward--; summary.wards++; }
    const element = elements[0] ?? (spell.shellBlast ? 'blast' : spell.form);
    const uniqueElements = [...new Set(elements)];
    events.push({
      type: 'projectile',
      form: spell.form,
      target: enemy.id,
      blocked,
      pierce,
      size: spell.multiplier,
      element,
      elements: uniqueElements,
      grand: Boolean(spell.grand),
      large: Boolean(spell.large),
      shellBlast: Boolean(spell.shellBlast),
      visualModifiers: rawIds.filter(id => ['burn', 'freeze', 'pierce', 'seal', 'dispel', 'push', 'pull'].includes(id)),
    });
    const name = [
      WORDS[spell.form].label,
      spell.shellBlast ? WORDS.blast.label : spell.blastShot ? WORDS.shot.label : '',
      uniqueElements.map(id => WORDS[id].label).join('+'),
    ].filter(Boolean).join(' ');
    summary.sequence.push(`${name} → ${enemy.slot + 1}${blocked ? ' (ติดม่าน)' : ''}`);
    if (blocked) {
      if (enemy.kind === 'mirror_mage' || enemy.kind === 'eclipse_mage'
        || (enemy.kind === 'mirror_regent' && state.room === FLOOR40_BOSS_ROOM)) {
        const reflectAmt = enemy.kind === 'mirror_regent' ? 4 : enemy.kind === 'eclipse_mage' ? 3 : 2;
        const reflected = applyIncomingToPlayer(reflectAmt, false);
        events.push({
          type: 'mirror-reflect',
          source: enemy.id,
          amount: reflected.actual,
          absorbed: reflected.absorbed,
          rawAttack: reflectAmt,
          protection: protection(),
        });
        summary.sequence.push(
          reflected.actual > 0
            ? `กระจกสะท้อน −${reflected.actual} HP`
            : `กระจกสะท้อน 0 (กันได้ ${reflected.absorbed})`
        );
      }
      return;
    }
    const center = enemy.slot;
    hit(enemy, strength, pierce, elements);
    const gust = elementAfterHit(enemy, elements, strength, pierce, sweep, center);
    if (spell.seal && enemy.hp > 0) {
      enemy.sealed = true;
      events.push({ type: 'seal', target: enemy.id });
      summary.sequence.push(`ผนึกท่าสนับสนุนช่อง ${enemy.slot + 1}`);
    }
    if (spell.shellBlast) {
      const targets = live().filter(candidate => Math.abs(candidate.slot - center) <= 1);
      blast(enemy.id, targets, element, target => hit(target, Math.ceil(strength * 0.6) + blastUpgradeBonus, pierce, elements), {
        originSlot: center,
        ...(uniqueElements.length > 1 ? { radius: 1 } : {}),
        grand: Boolean(spell.grand),
        large: Boolean(spell.large),
        elements: uniqueElements,
      });
    }
    for (let count = 0; count < spell.blasts; count++) {
      const targets = live().filter(candidate => Math.abs(candidate.slot - center) <= 1);
      blast(enemy.id, targets, elements[0], target => hit(target, (target === enemy ? 5 : 3) + blastUpgradeBonus, pierce, elements), {
        grand: Boolean(spell.grand),
        large: Boolean(spell.large),
      });
    }
    if (spell.grand && spell.form === 'shot') {
      const targets = live().filter(candidate => Math.abs(candidate.slot - center) === 1);
      blast(enemy.id, targets, elements[0], target => hit(target, strength / 2 + blastUpgradeBonus, pierce, elements), {
        grand: true,
        large: Boolean(spell.large),
      });
    }
    if (spell.push && (spell.form === 'storm' ? enemy.id === targetId : !gust)) pushEnemy(enemy);
    if (spell.pull) pushEnemy(enemy, -1);
    reactToAttack(enemy, elements);
    return { strength, pierce };
  }

  function reactToAttack(enemy, elements) {
    const families = elements.map(elementFamily);
    if (enemy.kind === 'ember_overlord' && enemy.hp > 0 && enemy.armor > 0 && !families.includes('ice')) {
      const thorns = applyIncomingToPlayer(2, false);
      events.push({
        type: 'ember-thorns',
        source: enemy.id,
        sourceKind: enemy.kind,
        specialBoss: true,
        amount: thorns.actual,
        absorbed: thorns.absorbed,
        rawAttack: 2,
        protection: protection(),
      });
      summary.sequence.push(
        thorns.actual > 0
          ? `เกล็ดแมกมาเผา −${thorns.actual} HP`
          : `เกล็ดแมกมา 0 (กันได้ ${thorns.absorbed})`
      );
    }
    if (enemy.kind === 'tempest_archon' && enemy.hp > 0 && enemy.armor > 0 && !families.includes('lightning') && !spell.pierce) {
      const staticHit = applyIncomingToPlayer(3, false);
      events.push({
        type: 'storm-static',
        source: enemy.id,
        sourceKind: enemy.kind,
        specialBoss: true,
        amount: staticHit.actual,
        absorbed: staticHit.absorbed,
        rawAttack: 3,
        protection: protection(),
      });
      summary.sequence.push(
        staticHit.actual > 0
          ? `ประจุอัสนีช็อต −${staticHit.actual} HP`
          : `ประจุอัสนี 0 (กันได้ ${staticHit.absorbed})`
      );
    }
  }

  function heal(amount, nextTurn = false, healKind = null) {
    const actual = Math.min(amount, player.maxHp - player.hp);
    player.hp += actual;
    summary.healed += actual;
    const resolvedKind = healKind
      ?? (spell?.grand ? 'grand' : spell?.large ? 'large' : spell?.multiplier > 1 ? 'pair' : spell?.form === 'shield' ? 'shield-heal' : nextTurn ? 'regen' : 'heal');
    const event = {
      type: 'heal',
      source: 'player',
      target: 'player',
      amount: actual,
      healKind: resolvedKind,
      grand: Boolean(resolvedKind === 'grand' || resolvedKind === 'regen' || (!nextTurn && spell?.grand)),
      large: Boolean(resolvedKind === 'large' || (!nextTurn && spell?.large)),
    };
    if (nextTurn) event.nextTurn = true;
    events.push(event);
  }

  function protection() {
    return shieldProtection(player.shield, block);
  }

  function shieldBlast(count, element = 'fire') {
    summary.sequence.push(`โล่ระเบิด ${count} ครั้ง`);
    for (let i = 0; i < count; i++) {
      const targets = live();
      blast('player', targets, element, enemy => {
        damage(enemy, 5 + blastUpgradeBonus + (upgrades.shield ?? 0) + (hasEmberCore ? 2 : 0), element);
        if (element === 'akki' && enemy.hp > 0) enemy.healCutUntil = turn + 1;
      }, { protection: protection() });
    }
  }

  if (guard) {
    events.push({ type: 'shield', amount: block, shieldKind: 'guard', protection: protection() });
  } else if (fizzled) {
    const expression = rawIds.map(id => WORDS[id].label).join(' ');
    events.push({ type: 'fizzle', ids: rawIds, cost, expression });
    summary.sequence.push(`คาถาล้มเหลว (${expression}) · เสีย ${cost} มานาฟรีโดยไม่มีผล`);
  } else if (spell.form === 'death') {
    state.deathSpent = true;
    player.hand = player.hand.filter(id => id !== 'death');
    const enemy = enemyById(targetId);
    damage(enemy, enemy.hp, 'death', enemy.armor);
    const refund = upgrades.death ?? 0;
    if (refund) {
      player.mana += refund;
      summary.manaRefunded = refund;
      summary.manaAfterCast = player.mana;
      events.push({ type: 'mana-refund', amount: refund });
    }
    summary.sequence.push('คำสั่งตายสำเร็จ · ใช้ไปแล้วในศึกนี้');
  } else if (spell.form === 'blackhole') {
    const slot = slotTarget ?? target.slot;
    state.blackhole = {
      slot,
      power: Math.round(30 * (spell.multiplier ?? 1)) + (upgrades.blackhole ?? 0),
      ...(spell.grand ? { grand: true } : {}),
      ...(spell.large ? { large: true } : {}),
    };
    events.push({ type: 'blackhole-open', slot, element: 'blackhole', grand: Boolean(spell.grand), large: Boolean(spell.large) });
    const nearby = live().filter(enemy => enemy.slot !== slot && Math.abs(enemy.slot - slot) <= 2)
      .sort((a, b) => Math.abs(a.slot - slot) - Math.abs(b.slot - slot) || a.slot - b.slot);
    for (const enemy of nearby) pushEnemy(enemy, Math.sign(slot - enemy.slot));
    summary.sequence.push(`หลุมดำช่อง ${slot + 1} · ยุบหลังแอ็กชันของคุณเทิร์นหน้า`);
  } else if (spell.form === 'meteor') {
    const mult = spell.multiplier ?? 1;
    const strikeTargets = spell.meteorPair ? [targetId, secondTargetId] : [targetId];
    for (const strikeId of strikeTargets) {
      if (player.hp <= 0) break;
      const intended = enemyById(strikeId);
      const center = intended && intended.hp > 0
        ? intended
        : live().sort((a, b) => a.hp - b.hp || Math.abs(a.slot - (intended?.slot ?? 0)) - Math.abs(b.slot - (intended?.slot ?? 0)) || a.slot - b.slot)[0];
      if (!center) break;
      const targets = live().filter(enemy => Math.abs(enemy.slot - center.slot) <= 1);
      blast(center.id, targets, 'meteor', enemy => {
        damage(enemy, Math.round((enemy === center ? 28 : 10) * mult) + (upgrades.meteor ?? 0), 'meteor', 0, 'meteor');
      }, { originSlot: center.slot, grand: Boolean(spell.grand), large: Boolean(spell.large) });
      summary.sequence.push(`อุกกาบาตช่อง ${center.slot + 1} · กระทบ ${targets.length} เป้า`);
      if (spell.devastation && targets.length) {
        const devTargets = live().filter(enemy => Math.abs(enemy.slot - center.slot) <= 2);
        blast(center.id, devTargets, 'meteor', enemy => {
          damage(enemy, Math.round(14 * mult) + devastationUpgradeBonus, 'meteor', 0, 'meteor');
        }, { originSlot: center.slot, devastation: true, grand: Boolean(spell.grand) });
        summary.sequence.push(`${WORDS.devastation.label} · ${devTargets.length} เป้าหมาย`);
      }
    }
  } else if (spell.form === 'detonate') {
    const detonated = fireShieldLayers(player.shield, spell.element);
    player.shield = makeShield(shieldLayers(player.shield).filter((_, index) => !detonated.includes(index)));
    shieldBlast(detonated.length, spell.element);
  } else if (spell.form === 'shield') {
    const baseLayerCap = (spell.layerHp ?? 6) + shieldUpgradeBonus;
    const riftDefenseBonus = inRift ? Math.ceil(baseLayerCap * RIFT_SPELL_BONUS / 100) + Math.floor((player.maxHp ?? 36) * 0.025) : 0;
    const layerCap = baseLayerCap + riftDefenseBonus + (hasWorldloom ? 3 : 0);
    const created = Array.from({ length: spell.layers }, (_, index) => ({
      hp: layerCap,
      expires: turn + 1,
      effect: spell.effect,
      triggered: false,
      ...(spell.layerEffects && { elements: spell.layerEffects[index] }),
      ...(spell.grand && { grand: true }),
      ...(spell.large && { large: true }),
    }));
    player.shield = makeShield([...shieldLayers(player.shield), ...created]);
    events.push({
      type: 'shield',
      amount: spell.layers * layerCap + secondaryShieldBonus,
      layers: spell.layers,
      element: spell.effect,
      shieldKind: spell.effect ?? 'shield',
      grand: Boolean(spell.grand),
      large: Boolean(spell.large),
      elements: spell.elements ?? [],
      protection: protection(),
    });
    if (spell.healing || secondaryHealBonus > 0) {
      const rawHeal = (spell.healing ?? 0) + healUpgradeBonus + secondaryHealBonus;
      const riftHealBonus = inRift && rawHeal > 0 ? Math.ceil(rawHeal * RIFT_SPELL_BONUS / 100) + Math.floor((player.maxHp ?? 36) * 0.03) : 0;
      heal(rawHeal + riftHealBonus, false, 'shield-heal');
    }
    if (hasGaiaEmblem) {
      heal(4, false, 'gaia');
      summary.sequence.push('ตราพระแม่ธรณีฟื้นฟู +4 HP จากการกางโล่');
    }
  } else if (spell.form === 'heal') {
    const rawHeal = spell.healing + healUpgradeBonus + secondaryHealBonus;
    const riftHealBonus = inRift && rawHeal > 0 ? Math.ceil(rawHeal * RIFT_SPELL_BONUS / 100) + Math.floor((player.maxHp ?? 36) * 0.04) : 0;
    heal(rawHeal + riftHealBonus);
    if (secondaryShieldBonus > 0) {
      events.push({ type: 'shield', amount: secondaryShieldBonus, secondary: true, shieldKind: 'bonus', protection: protection() });
      summary.sequence.push(`เกราะเสริมจากการ์ด +${secondaryShieldBonus}`);
    }
  } else {
    const lateGrand = spell.grand && ['beam', 'wave', 'storm'].includes(spell.form);
    const warded = spell.devastation || spell.stormBlast || spell.waveBlast || lateGrand
      ? new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) : null;
    let ignition;
    let secondGrandTrigger = null;
    function strikeForBlast(enemy, elements = spell.elements, sweep, scale = 1) {
      const slot = enemy.slot;
      const strike = impact(enemy, elements, sweep, scale);
      if (!strike || !warded) return undefined;
      const trigger = { ...strike, center: enemy, slot, elements };
      if (!ignition || spell.form === 'wave' && enemy.id === targetId) ignition = trigger;
      return trigger;
    }
    if (spell.form === 'blast' && spell.blastShot) {
      const radius = spell.grand ? 2 : 1;
      const elements = spell.elements;
      const element = elements[0] ?? 'blast';
      const { strength, pierce } = attackPower(elements);
      const name = [spell.grand ? 'มหาระเบิดลูก' : 'ระเบิดลูก', elements.map(id => WORDS[id].label).join('+')].filter(Boolean).join(' ');
      const strikeTargets = spell.shots === 2 ? [targetId, secondTargetId] : [targetId];
      for (const [round, strikeId] of strikeTargets.entries()) {
        if (player.hp <= 0) break;
        const intended = enemyById(strikeId);
        const center = intended && intended.hp > 0
          ? intended
          : live().sort((a, b) => a.hp - b.hp || Math.abs(a.slot - (intended?.slot ?? 0)) - Math.abs(b.slot - (intended?.slot ?? 0)) || a.slot - b.slot)[0];
        if (!center) break;
        const slot = center.slot;
        if (spell.dispel && center.ward > 0) {
          const amount = center.ward;
          summary.wards += amount;
          center.ward = 0;
          events.push({ type: 'dispel', target: center.id, amount });
          summary.sequence.push(`สลายม่านช่อง ${slot + 1} ${amount} ชั้น`);
        }
        const nearby = live().filter(enemy => Math.abs(enemy.slot - slot) <= radius);
        const targets = nearby.filter(enemy => enemy.ward === 0);
        const wardedTargets = nearby.filter(enemy => enemy.ward > 0).map(enemy => enemy.id);
        const powerAt = enemy => (strength + blastUpgradeBonus) * (enemy.slot === slot ? 1 : 0.5);
        const hits = targets.map(enemy => ({ enemy, slot: enemy.slot, power: powerAt(enemy) }));
        blast(center.id, targets, element, enemy => hit(enemy, powerAt(enemy), pierce, elements),
          { originSlot: slot, radius, elements, scale: 1, grand: Boolean(spell.grand), large: Boolean(spell.large), wardedTargets });
        const sweep = { chained: false, warded: new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) };
        for (const h of hits) {
          elementAfterHit(h.enemy, elements, h.power, pierce, sweep, h.slot);
          reactToAttack(h.enemy, elements);
        }
        const wave = spell.shots === 2 ? ` ระลอก ${round + 1}` : '';
        const blocked = wardedTargets.length ? ` · ติดม่าน ${wardedTargets.length} เป้า` : '';
        summary.sequence.push(`${name}${wave} · ${targets.length} เป้า${blocked}`);
        if (center.hp > 0 && player.hp > 0) {
          impact(center, elements, sweep, 0.6);
        }
        if (spell.devastation && round === 0 && targets.length && !ignition) {
          ignition = { center: targets.includes(center) ? center : targets[0], slot, strength, pierce, elements };
        }
      }
    } else if (spell.form === 'blast') {
      const center = enemyById(targetId);
      const slot = center.slot;
      const radius = spell.grand ? 2 : 1;
      const elements = spell.elements;
      const element = elements[0] ?? 'blast';
      const { strength, pierce } = attackPower(elements);
      const name = [spell.grand ? 'มหาระเบิด' : 'ระเบิด', elements.map(id => WORDS[id].label).join('+')].filter(Boolean).join(' ');
      const scales = !spell.blastPair ? [1] : [1, spell.grand ? 0.6 : 1];
      for (const [round, scale] of scales.entries()) {
        if (player.hp <= 0) break;
        const nearby = live().filter(enemy => Math.abs(enemy.slot - slot) <= radius);
        const targets = nearby.filter(enemy => enemy.ward === 0);
        const wardedTargets = nearby.filter(enemy => enemy.ward > 0).map(enemy => enemy.id);
        const powerAt = enemy => (strength + blastUpgradeBonus) * scale * (enemy.slot === slot ? 1 : 0.5);
        const hits = targets.map(enemy => ({ enemy, slot: enemy.slot, power: powerAt(enemy) }));
        blast(center.id, targets, element, enemy => hit(enemy, powerAt(enemy), pierce, elements),
          { originSlot: slot, radius, elements, scale, grand: Boolean(spell.grand), large: Boolean(spell.large), wardedTargets });
        const sweep = { chained: false, warded: new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) };
        for (const hit of hits) {
          elementAfterHit(hit.enemy, elements, hit.power, pierce, sweep, hit.slot);
          reactToAttack(hit.enemy, elements);
        }
        if (spell.devastation && round === 0 && targets.length && !ignition) {
          ignition = { center: targets.includes(center) ? center : targets[0], slot, strength, pierce, elements };
        }
        const wave = spell.blastPair ? ` ระลอก ${round + 1}` : '';
        const blocked = wardedTargets.length ? ` · ติดม่าน ${wardedTargets.length} เป้า` : '';
        summary.sequence.push(`${name}${wave} · ${targets.length} เป้า${blocked}`);
      }
    } else if (spell.form === 'wave') {
      const sweeps = [spell.elements];
      if (spell.secondElement) sweeps.push([spell.secondElement]);
      else if (spell.wavePair) sweeps.push(spell.elements);
      for (const [round, elements] of sweeps.entries()) {
        const secondWarded = round === 1 && lateGrand && spell.wavePair ? new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) : null;
        const sweep = { chained: false };
        for (const enemy of live()) {
          const trigger = strikeForBlast(enemy, elements, sweep, 0.6);
          if (secondWarded && trigger && (!secondGrandTrigger || enemy.id === targetId)) {
            secondGrandTrigger = { trigger, warded: secondWarded };
          }
        }
      }
    } else if (spell.form === 'storm') {
      const center = enemyById(targetId);
      const neighbors = live().filter(enemy => Math.abs(enemy.slot - center.slot) === 1);
      const sweep = { chained: false, warded: new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) };
      const first = strikeForBlast(center, spell.elements, sweep);
      for (const enemy of neighbors) impact(enemy, spell.elements, sweep, 0.5);
      if (spell.stormPair) {
        const secondWarded = lateGrand ? new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) : null;
        const secondSweep = { chained: false, warded: new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) };
        const secondCenter = impact(center, spell.elements, secondSweep, 0.6);
        if (secondCenter && lateGrand) {
          secondGrandTrigger = {
            trigger: { ...secondCenter, center, slot: center.slot, elements: spell.elements },
            warded: secondWarded,
          };
        }
        for (const enemy of neighbors) impact(enemy, spell.elements, secondSweep, 0.3);
      }
      if (spell.stormBlast && first) {
        if (spell.devastation) expandedBlast({ ...first, strength: first.strength / 2 }, warded, 'blast');
        else expandedBlast(first, warded, 'blast');
      }
    } else {
      const first = enemyById(targetId);
      strikeForBlast(first);
      if (spell.shots === 2) {
        const secondWarded = lateGrand ? new Set(live().filter(enemy => enemy.ward > 0).map(enemy => enemy.id)) : null;
        const intended = enemyById(secondTargetId);
        const replacement = intended.hp > 0 ? intended : live().sort((a, b) => a.hp - b.hp || Math.abs(a.slot - intended.slot) - Math.abs(b.slot - intended.slot) || a.slot - b.slot)[0];
        if (replacement) {
          const secondTrigger = strikeForBlast(replacement, spell.secondElement ? [spell.secondElement] : spell.elements);
          if (secondWarded && secondTrigger) secondGrandTrigger = { trigger: secondTrigger, warded: secondWarded };
        }
      }
    }
    if (spell.waveBlast) expandedBlast(ignition, warded, 'wave');
    if (lateGrand) expandedBlast(ignition, warded, 'grand');
    if (secondGrandTrigger) expandedBlast(secondGrandTrigger.trigger, secondGrandTrigger.warded, 'grand');
    if (spell.devastation) expandedBlast(ignition, warded, 'devastation');
    if (secondaryShieldBonus > 0) {
      events.push({ type: 'shield', amount: secondaryShieldBonus, secondary: true, shieldKind: 'bonus', protection: protection() });
      summary.sequence.push(`เกราะเสริมจากการ์ด +${secondaryShieldBonus}`);
    }
    if (secondaryHealBonus > 0) {
      heal(secondaryHealBonus, false, 'bonus');
    }
  }

  spellVfxFlags = {};

  if (!guard && !fizzled && hasStormPendulum && rawIds.includes('pair')) {
    const manaRefund = Math.min(getMaxMana(player) - player.mana, 1);
    if (manaRefund > 0) {
      player.mana += manaRefund;
      summary.manaRefunded = (summary.manaRefunded ?? 0) + manaRefund;
      summary.manaAfterCast = player.mana;
      events.push({ type: 'mana-refund', amount: manaRefund, relicId: 'storm_pendulum_20' });
      summary.sequence.push(`ลูกตุ้มสายฟ้าคืน +${manaRefund} มานา`);
    }
  }
  if (!guard && !fizzled && hasCrown && rawIds.length === 4) {
    const manaRefund = Math.min(getMaxMana(player) - player.mana, 2);
    if (manaRefund > 0) {
      player.mana += manaRefund;
      summary.manaRefunded = (summary.manaRefunded ?? 0) + manaRefund;
      summary.manaAfterCast = player.mana;
      events.push({ type: 'mana-refund', amount: manaRefund, relicId: 'forbidden_crown_30' });
      summary.sequence.push(`มงกุฎอักษรคืน +${manaRefund} มานา`);
    }
  }

  if (pendingBlackhole) {
    const { slot, power } = pendingBlackhole;
    const targets = live().filter(enemy => Math.abs(enemy.slot - slot) <= 2);
    blast('blackhole', targets, 'blackhole', enemy => {
      damage(enemy, enemy.slot === slot ? power : power / 2, 'blackhole', 0, 'blackhole');
    }, { originSlot: slot, grand: Boolean(pendingBlackhole.grand), large: Boolean(pendingBlackhole.large) });
    summary.sequence.push(`หลุมดำช่อง ${slot + 1} ยุบ · กระทบ ${targets.length} เป้า`);
  }
  for (const slot of magmaPuddles) {
    const target = live().find(enemy => enemy.slot === slot);
    events.push({ type: 'magma-erupt', slot, target: target?.id, element: 'magma' });
    if (!target) continue;
    damage(target, 6, 'magma', target.armor);
    applyEarthArmorShred(target, 2);
  }
  delete state.magmaPuddles;
  for (const [id, form] of formsHit) enemyById(id).readForm = form;
  summary.enemyHp = Object.fromEntries(enemies.map(enemy => [enemy.id, enemy.hp]));
  summary.enemyStatus = Object.fromEntries(enemies.map(enemy => [enemy.id, {
    chill: enemy.chill, freeze: enemy.freeze, burn: enemy.burn + (newBurn.get(enemy.id) ?? 0),
    slot: enemy.slot, ward: enemy.ward, sealed: enemy.sealed,
    healCutUntil: enemy.healCutUntil, lastingChill: enemy.lastingChill,
    wetUntil: enemy.wetUntil, obscured: enemy.obscured, armor: enemy.armor,
  }]));
  summary.enemyActions = {};
  for (const enemy of live()) {
    if (!enemy.hp || !player.hp) continue;
    if (enemy.burn && enemy.burnTurn <= turn) {
      events.push({ type: 'status', status: 'burn', target: enemy.id });
      damage(enemy, enemy.burn, 'fire', enemy.armor);
      enemy.burn = 0;
      enemy.burnTurn = 0;
    }
    const action = intent(enemy, turn, enemies, state.room);
    summary.enemyActions[enemy.id] = action;
    if (action.type === 'attack') {
      enemy.chill = enemy.lastingChill ? 4 : 0;
      delete enemy.lastingChill;
      delete enemy.obscured;
      const { actual, absorbed, effects, explosions } = applyIncomingToPlayer(action.amount, true);
      const attackerBase = ENEMIES[enemy.kind];
      const isBossAttacker = Boolean(attackerBase?.isBoss || isBossRoom(state));
      const isSpecialBoss = enemy.kind === 'ember_overlord' || enemy.kind === 'tempest_archon';
      const isUltimateSkill = Boolean(isSpecialBoss && turn % 4 === 0);
      const isHeavyAttack = Boolean(
        action.amount >= 6 ||
        (isBossAttacker && (
          action.amount >= 5 ||
          ['sentinel', 'storm_titan', 'ember_overlord', 'astral_sentinel', 'thunder_colossus', 'tempest_archon'].includes(enemy.kind) ||
          (['boss', 'arch_codex', 'elder_grimoire', 'nexus_codex'].includes(enemy.kind) && turn % 3 === 2) ||
          (['mirror_mage', 'eclipse_mage'].includes(enemy.kind) && turn % 3 !== 1)
        ))
      );
      events.push({
        type: 'attack',
        source: enemy.id,
        sourceKind: enemy.kind,
        amount: actual,
        absorbed,
        rawAttack: action.amount,
        isBoss: isBossAttacker,
        specialBoss: isSpecialBoss,
        ultimate: isUltimateSkill,
        heavy: isHeavyAttack,
        protection: protection(),
      });
      if (effects.size) {
        const shieldRank = upgrades.shield ?? 0;
        for (const effect of effects) {
          if (enemy.hp <= 0) break;
          events.push({ type: 'shield-counter', target: enemy.id, element: effect });
          const elemRank = upgrades[effect] ?? 0;
          const wetBonus = enemy.wetUntil >= turn ? 2 : 0;
          const counterBurn = 3 + (hasEmberCore ? 1 : 0) + Math.floor(shieldRank / 2) + Math.floor(elemRank / 2);
          const counterDmg = 5 + Math.floor(shieldRank / 2) + elemRank;
          if (effect === 'fire') newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + counterBurn);
          if (['ice', 'chillgale', 'frostvolt'].includes(effect)) enemy.chill += 4;
          if (effect === 'water') heal(2, false, 'water');
          if (['lightning', 'plasma', 'magnet', 'shockstream', 'frostvolt'].includes(effect)) {
            damage(enemy, counterDmg + wetBonus, effect, 2);
          }
          if (effect === 'earth') {
            applyEarthArmorShred(enemy, 1);
            damage(enemy, Math.max(3, counterDmg - 2), 'earth');
          }
          if (effect === 'akki') {
            enemy.healCutUntil = turn + 1;
            newBurn.set(enemy.id, (newBurn.get(enemy.id) ?? 0) + counterBurn);
          }
          if (effect === 'heman') enemy.chill += 2;
          if (effect === 'heman' || effect === 'chillgale') enemy.lastingChill = true;
          if (effect === 'asani') {
            damage(enemy, counterDmg + wetBonus, 'asani', 2);
            chainLightning(enemy, 5 + Math.floor(elemRank / 2), 2);
          }
          if (effect === 'pathaphi') {
            applyEarthArmorShred(enemy, 2);
            damage(enemy, counterDmg, 'pathaphi');
          }
          if (effect === 'wari') enemy.chill += 2;
          if (effect === 'magma') leaveMagma(enemy.slot);
          if (effect === 'dust') applyEarthArmorShred(enemy, 1);
          if (effect === 'permafrost' || effect === 'scald') applyEarthArmorShred(enemy, 2);
          if (effect === 'heatwave') burnNearby(enemy);
          if (['wind', 'vayu', 'dust', 'heatwave', 'chillgale'].includes(effect)) pushEnemy(enemy);
          if (effect === 'monsoon') {
            heal(4, false, 'water');
            for (const target of live()) pushEnemy(target);
          }
          if (effect === 'magnet') pullNeighborsToward(enemy);
          if (effect === 'shockstream') shockWetEnemies(enemy);
          if (effect === 'frostvolt') chainLightning(enemy, counterDmg, 2, undefined, effect);
          applyMoisture(enemy, [effect]);
          if (effect === 'thunderstorm') {
            damage(enemy, counterDmg + wetBonus, effect, 2);
            pushEnemy(enemy);
            chainLightning(enemy, 5 + Math.floor(elemRank / 2), 2, undefined, effect);
          }
        }
      }
      for (const element of explosions) shieldBlast(1, element);
    } else if (action.type === 'heal') {
      const target = action.target ? enemyById(action.target) : live().reduce((best, candidate) => candidate.hp / candidate.maxHp < best.hp / best.maxHp ? candidate : best);
      const amount = enemyHealing(target, action.amount);
      target.hp += amount;
      events.push({ type: 'heal', source: enemy.id, target: target.id, amount });
    } else if (action.type === 'ward-grant') {
      const target = enemyById(action.target);
      target.wardGrant = Math.min(2, (target.wardGrant ?? 0) + 1);
      events.push({ type: 'ward-grant', source: enemy.id, target: target.id, slot: target.slot });
      summary.sequence.push(`ช่อง ${target.slot + 1} ได้ม่านเพิ่มเทิร์นหน้า`);
    } else if (action.type === 'advance') {
      enemy.slot = action.slot;
      events.push({ type: 'push', target: enemy.id, slot: action.slot, advancing: true });
      summary.sequence.push(`${ENEMIES[enemy.kind].name} ไล่ประชิดช่อง ${action.slot + 1}`);
    } else if (action.type === 'swap') {
      const ally = enemyById(action.target);
      [enemy.slot, ally.slot] = [ally.slot, enemy.slot];
      events.push({ type: 'swap', source: enemy.id, target: ally.id, sourceSlot: enemy.slot, slot: ally.slot });
      summary.sequence.push(`สลับช่อง ${ally.slot + 1} กับ ${enemy.slot + 1}`);
    } else if (action.type === 'sealed') {
      delete enemy.sealed;
      events.push({ type: 'sealed', source: enemy.id });
      summary.sequence.push(`ช่อง ${enemy.slot + 1} ข้ามท่าสนับสนุน`);
    } else if (action.type === 'recover') {
      events.push({ type: 'recover', source: enemy.id, label: action.shortLabel });
    } else if (action.type === 'frozen') {
      enemy.freeze--;
      events.push({ type: 'frozen', source: enemy.id });
    } else if (action.type === 'charge') {
      if (enemy.kind === 'ember_overlord') {
        const regen = enemyHealing(enemy, 5);
        if (regen > 0) {
          enemy.hp += regen;
          events.push({ type: 'heal', source: enemy.id, target: enemy.id, amount: regen });
          summary.sequence.push(`จ้าวอัคคีหลอมแก่นเพลิงฟื้น +${regen} HP`);
        }
      } else if (enemy.kind === 'tempest_archon') {
        const regen = enemyHealing(enemy, 8);
        if (regen > 0) {
          enemy.hp += regen;
          events.push({ type: 'heal', source: enemy.id, target: enemy.id, amount: regen });
          summary.sequence.push(`จ้าวพายุชาร์จประจุฟื้น +${regen} HP`);
        }
      }
      const isSpecialBoss = enemy.kind === 'ember_overlord' || enemy.kind === 'tempest_archon';
      events.push({
        type: 'charge',
        label: action.label,
        source: enemy.id,
        sourceKind: enemy.kind,
        specialBoss: isSpecialBoss,
        ultimate: isSpecialBoss,
      });
    }
  }
  for (const enemy of live()) {
    const amount = newBurn.get(enemy.id);
    if (amount) { enemy.burn += amount; enemy.burnTurn = turn + 1; }
  }
  for (const enemy of enemies) {
    if (enemy.healCutUntil <= turn) delete enemy.healCutUntil;
    if (enemy.wetUntil <= turn) delete enemy.wetUntil;
    if (enemy.magmaArmorUntil <= turn) delete enemy.magmaArmorUntil;
    if (enemy.earthArmorUntil <= turn) {
      delete enemy.earthArmorUntil;
      delete enemy.earthArmorShred;
    }
  }
  if (player.shield?.expires <= turn || player.shield?.layerDetails) {
    player.shield = makeShield(shieldLayers(player.shield).filter(layer => layer.expires > turn));
  }
  summary.enemyArmorAfterTurn = Object.fromEntries(enemies.map(enemy => [enemy.id, enemy.armor]));

  summary.finalEnemyHp = Object.fromEntries(enemies.map(enemy => [enemy.id, enemy.hp]));
  state.stats.turns++;
  state.stats.damage += summary.damage;
  state.stats.blocked += summary.blocked;
  if (!guard) {
    state.stats.casts++;
    if (!fizzled) {
      const phrase = parsed.ids.join(' ');
      if (!state.stats.discovered.includes(phrase)) state.stats.discovered.push(phrase);
    }
  }
  if (player.hp <= 0) {
    delete state.blackhole;
    delete state.deathSpent;
    player.hp = 0;
    if (state.rift) {
      resolveRiftDefeat(state, summary, events);
    } else {
      const fallback = fallBackOnDefeat(state);
      if (fallback.phase === 'sanctuary') {
        summary.fellToFloor = fallback.targetFloor;
        if (fallback.targetFloor === 5 || fallback.targetFloor === 4) summary.fellToFloor4 = true;
        events.push({ type: 'fall', targetFloor: fallback.targetFloor });
      } else {
        state.phase = 'lost';
      }
    }
  } else if (!live().length) {
    if (state.rift) {
      resolveRiftBattleVictory(state, summary, events);
    } else {
      delete state.blackhole;
      delete state.deathSpent;
      if (!state.clearedRooms.includes(state.room)) {
        state.clearedRooms.push(state.room);
      }
      recordClearedFloorProgress(state, state.room);
      state.highestRoom = Math.max(state.highestRoom ?? 0, Math.min(state.rooms.length - 1, state.room + 1));
      if (dropsCardReward) {
        if (!isBossRoom(state) && !isUpperCacheRoom(state.room)) summary.roomRecovery = recoverAfterRoom(state);
        makeRewards(state);
      } else if (revisit && (state.replayReturn || isSanctuaryUnlocked(state))) {
        summary.roomRecovery = recoverAfterRoom(state);
        completeRevisitVictoryToSanctuary(state, summary);
      } else {
        summary.roomRecovery = recoverAfterRoom(state);
        const rel = state.room % 25;
        const D = Math.floor(state.room / 25);
        if (rel === 11) {
          state.sanctuaryUnlocked = true;
          state.sanctuaryFloor = D * 10 + 5;
          state.sanctuaryRested = false;
          state.highestRoom = Math.max(state.highestRoom ?? 0, state.room + 1);
          state.phase = 'sanctuary';
        } else if (rel === 23) {
          state.sanctuaryUnlocked = true;
          state.sanctuaryFloor = `pre${(D + 1) * 10}`;
          state.sanctuaryRested = false;
          state.highestRoom = Math.max(state.highestRoom ?? 0, state.room + 1);
          state.phase = 'sanctuary';
        } else if (rel === 24) {
          const majorBossFloor = (D + 1) * 10;
          const relicId = grantBossRelic(player, majorBossFloor);
          if (relicId) {
            summary.relicDropped = relicId;
            events.push({ type: 'relic', relicId });
          }
          if (majorBossFloor === 100 || state.room >= (state.rooms?.length ?? 250) - 1) {
            state.phase = 'won';
          } else {
            state.sanctuaryUnlocked = true;
            state.sanctuaryFloor = `post${majorBossFloor}`;
            state.sanctuaryRested = false;
            state.highestRoom = Math.max(state.highestRoom ?? 0, state.room + 1);
            state.phase = 'sanctuary';
          }
        } else {
          state.room++;
          enterRoom(state);
        }
      }
    }
  } else {
    state.turn++;
    if (spell?.nextHealing && player.hp < player.maxHp) {
      const beforeHeal = player.hp;
      heal(spell.nextHealing, true);
      summary.sequence.push(`ต้นเทิร์นถัดไปฟื้น +${player.hp - beforeHeal} HP`);
    }
    if (spell?.shieldRenewal && player.shield) {
      const layer = player.shield.layers[0];
      const renewal = Math.max(0, Math.min(spell.shieldRenewal, spell.layerHp + shieldUpgradeBonus + (hasWorldloom ? 3 : 0) - layer));
      if (renewal > 0) {
        player.shield.layers[0] += renewal;
        events.push({ type: 'shield', protection: protection(), amount: renewal, restored: renewal, grand: Boolean(spell.grand), large: Boolean(spell.large), shieldKind: spell.effect ?? 'shield' });
        summary.sequence.push(`ต้นเทิร์นถัดไปเติมโล่ +${renewal}`);
      }
    }
    if (nextMagmaPuddles.size) state.magmaPuddles = [...nextMagmaPuddles];
    drawCards(state);
    player.mana = Math.min(getMaxMana(player), player.mana + 3);
    prepareEnemies(state);
  }
  summary.hp = player.hp;
  summary.nextMana = player.mana;
  summary.phase = state.phase;
  summary.nextRoom = state.room;
  summary.shield = player.shield?.layers.reduce((sum, value) => sum + value, 0) ?? 0;
  return { ok: true, state, events, summary };
}
