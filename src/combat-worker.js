import { computePlayableCombos } from './combos.js';
import { simulateTurn } from './combat.js';

globalThis.addEventListener('message', event => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  const { id, type } = data;
  try {
    if (type === 'simulate') {
      const { state, spellInput, targetId, secondTargetId, options } = data;
      const result = simulateTurn(state, spellInput, targetId, secondTargetId ?? targetId, options ?? {});
      globalThis.postMessage({ id, type, ok: true, result });
    } else if (type === 'batch-preview') {
      const { reqSig, state, words, targetId, secondTargetId, knownSpell, discoveredKeys } = data;
      const forecast = knownSpell && words?.length
        ? simulateTurn(state, words, targetId, secondTargetId ?? targetId, { allowFizzle: false })
        : null;
      const commitSim = words?.length
        ? simulateTurn(state, words, targetId, secondTargetId ?? targetId, { allowFizzle: true })
        : null;
      const guardSim = simulateTurn(state, 'guard', targetId, secondTargetId ?? targetId, { allowFizzle: true });
      const combos = computePlayableCombos(state, words, discoveredKeys);
      globalThis.postMessage({
        id,
        type,
        ok: true,
        reqSig,
        words,
        targetId,
        secondTargetId,
        forecast,
        commitSim,
        guardSim,
        combos,
      });
    }
  } catch (error) {
    globalThis.postMessage({ id, type, ok: false, error: error?.message ?? 'Worker calculation error' });
  }
});
