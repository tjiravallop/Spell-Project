import test from 'node:test';
import assert from 'node:assert/strict';
import { Battlefield } from '../src/render.js';

test('battlefield draws integrated sheets at their native pivot and falls back if unavailable', () => {
  const calls = [];
  const ctx = { drawImage(...args) { calls.push(['image', ...args]); }, fillRect(...args) { calls.push(['rect', ...args]); }, save() {}, restore() {} };
  const old = { Image: globalThis.Image, document: globalThis.document, requestAnimationFrame: globalThis.requestAnimationFrame };
  globalThis.Image = class { complete = true; naturalWidth = 1; };
  globalThis.document = { createElement: () => ({ getContext: () => ctx }) };
  globalThis.requestAnimationFrame = () => 1;
  try {
    const battlefield = new Battlefield({ id: 'battle-canvas', getContext: () => ctx }, { reducedMotion: false });
    calls.length = 0;
    battlefield.sprite('elite', 216, 146, 0, 'ward');
    const boss = calls.find(call => call[0] === 'image');
    assert.deepEqual(boss.slice(2), [192, 64, 64, 64, 184, 88, 64, 64]);
    calls.length = 0;
    battlefield.sprite('prism_crab', 216, 146, 0, 'exposed');
    assert.deepEqual(calls.find(call => call[0] === 'image').slice(2), [64, 32, 32, 32, 200, 115, 32, 32]);
    calls.length = 0;
    battlefield.spriteArt.striker.naturalWidth = 0;
    battlefield.sprite('striker', 216, 146, 0, 'idle');
    assert.ok(calls.some(call => call[0] === 'rect'));
    assert.ok(!calls.some(call => call[0] === 'image'));
  } finally {
    Object.assign(globalThis, old);
  }
});
