import test from 'node:test';
import assert from 'node:assert/strict';
import { spriteFrame } from '../src/sprite-art.js';

test('art frames follow combat phases and never select empty cells', () => {
  assert.deepEqual([0, .31, .63, .90].map(p => spriteFrame('striker', 'attack', 0, p).index), [0, 1, 2, 3]);
  assert.deepEqual([0, .31, .63, .82, .95].map(p => spriteFrame('elite', 'attack', 0, p).index), [0, 1, 2, 3, 4]);
  assert.deepEqual([0, .5, .9].map(p => spriteFrame('elite', 'break', 0, p).index), [0, 1, 2]);
  assert.deepEqual(spriteFrame('elite', 'ward', 0).wardCenter, [28, 38]);
  assert.equal(spriteFrame('prism_crab', 'exposed', 0).index, 2);
  assert.equal(spriteFrame('wizard', 'cast', 0, 0.7).index, 3);
  assert.equal(spriteFrame('swarm', 'attack', 0, 0.1, true).index, 2);
  assert.equal(spriteFrame('wizard', 'dead', 0), null);
  assert.equal(spriteFrame('unknown', 'idle', 0), null);
});


test('golem charge, ready, strike and reduced motion use the expected frames', () => {
  for (const kind of ['charger', 'sentinel']) {
    assert.deepEqual([0, .4, .8].map(p => spriteFrame(kind, 'charge', 0, p).index), [0, 1, 2]);
    assert.deepEqual([spriteFrame(kind, 'ready', 0).row, spriteFrame(kind, 'ready', 0).index], [1, 2]);
    assert.deepEqual([0, .32, .65, .82, .95].map(p => spriteFrame(kind, 'attack', 0, p).index), [0, 1, 2, 3, 4]);
    assert.equal(spriteFrame(kind, 'charge', 3, .1, true).index, 2);
    assert.equal(spriteFrame(kind, 'hurt', 0, 0).row, 3);
  }
});

test('floor 3 characters use their own idle, attack and hurt sheets', () => {
  for (const kind of ['armored', 'warden', 'support', 'boss']) {
    assert.equal(spriteFrame(kind, 'idle', 2).index, 2);
    assert.deepEqual([spriteFrame(kind, 'attack', 0, .7).row, spriteFrame(kind, 'attack', 0, .7).index], [1, 2]);
    assert.deepEqual([spriteFrame(kind, 'hurt', 0, .6).row, spriteFrame(kind, 'hurt', 0, .6).index], [2, 1]);
    assert.equal(spriteFrame(kind, 'idle', 0).size, kind === 'boss' ? 64 : 32);
  }
});

test('floor 5–8 sprites match available frame rows and charge states', () => {
  for (const kind of ['ember_imp','iron_warden','mirror_mage','frost_lich','arch_codex']) {
    assert.equal(spriteFrame(kind,'attack',0,.7).index,2);
    assert.equal(spriteFrame(kind,'hurt',0,.7).row,2);
  }
  for (const kind of ['rune_golem','storm_titan']) {
    assert.equal(spriteFrame(kind,'ready',0).row,1);
    assert.equal(spriteFrame(kind,'charge',0,.8).index,2);
    assert.equal(spriteFrame(kind,'attack',0,.7).row,2);
  }
  assert.equal(spriteFrame('rune_ram','idle',0),null);
});
