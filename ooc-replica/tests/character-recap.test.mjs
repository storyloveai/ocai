import test from 'node:test';
import assert from 'node:assert/strict';
import {characterRecap} from '../dist/assets/character-recap.js';
import {createCharacterThreads} from '../dist/assets/character-threads.js';

const messages = () => [
  {role: 'user', text: '那就先不拆信。我想听你把当年的事讲完。'},
  {role: 'assistant', text: '*他收回了手。*\n\n“我会先把我知道的告诉你。”'},
  {role: 'user', text: '我暂时不答应下次再见。'},
  {role: 'assistant', text: '“好。我不会把今晚当成你的答应。”'}
];
test('a recap quotes the chosen branch, attributes speakers and shows its latest completed exchange', () => {
  const turns = messages(), before = structuredClone(turns);
  const recap = characterRecap({messages: turns, pins: [{turn: 1, role: 'assistant', text: turns[1].text}, {turn: 0, role: 'user', text: turns[0].text}]});
  assert.deepEqual(recap.remembered.map(p => p.turn), [0, 1]);
  assert.deepEqual(recap.recent, turns.slice(2).map((m, i) => ({...m, turn: i + 2})));
  assert.equal(recap.hasConversation, true); assert.deepEqual(turns, before);
});
test('a recap excludes failed, partial and pending replies without losing the last complete exchange', () => {
  for (const flag of ['failed', 'stopped', 'streaming']) {
    const turns = [...messages(), {role: 'user', text: '你能把地址给我吗？'}, {role: 'assistant', text: '地址是', [flag]: true}];
    const recap = characterRecap({messages: turns, pins: [{turn: 5, role: 'assistant', text: '地址是'}]});
    assert.deepEqual(recap.remembered, []); assert.equal(recap.recent.at(-1).turn, 3);
  }
  assert.equal(characterRecap({messages: [{role: 'user', text: '你好'}]}).hasConversation, false);
  assert.equal(characterRecap({messages: [{role: 'assistant', text: '开场'}]}).hasConversation, false);
});
test('old or out-of-range memory sources cannot appear as events in another branch', () => {
  const recap = characterRecap({messages: messages().slice(0, 2), pins: [
    {turn: 3, role: 'assistant', text: '另一走向的约定'},
    {turn: 1, role: 'user', text: messages()[1].text},
    {turn: 0, role: 'user', text: '已经改过的原话'},
    {turn: -1, role: 'assistant', text: '不存在'}
  ]});
  assert.deepEqual(recap.remembered, []); assert.equal(recap.recent.length, 2);
});
test('recap excerpts are bounded and preserve Unicode while leaving source text untouched', () => {
  const turns = [{role: 'user', text: '😀'.repeat(500)}, {role: 'assistant', text: '😀'.repeat(1000)}];
  const recap = characterRecap({messages: turns});
  assert.equal(Array.from(recap.recent[0].text).length, 241); assert.equal(Array.from(recap.recent[1].text).length, 481);
  assert.ok(!/\uFFFD/.test(recap.recent[1].text)); assert.equal(turns[1].text.length, 2000);
});
test('editing a promise beyond its displayed excerpt removes the obsolete memory from future requests', () => {
  const data = new Map(), manager = createCharacterThreads({id: 'recap-edit', read: (key, fallback) => structuredClone(data.get(key) ?? fallback), save: (key, value) => data.set(key, structuredClone(value))});
  const turns = [{role: 'user', text: '我需要先想一想。'}, {role: 'assistant', text: '前情。'.repeat(100) + '我答应明天替你取信。'}];
  manager.pin(1, turns); assert.equal(manager.pins(turns).length, 1);
  turns[1].text = '前情。'.repeat(100) + '我明天没有办法替你取信。';
  manager.saveMessages(turns); assert.equal(manager.memory(turns), ''); assert.deepEqual(manager.pins(turns), []);
});
test('legacy excerpt memories survive an unchanged save but cannot keep a promise edited beyond the excerpt', () => {
  for (const editBeforeSave of [false, true]) {
    const id = 'legacy-recap-' + editBeforeSave, key = 'ooc-session-v2-' + id;
    const turns = [{role: 'user', text: '告诉我你的决定。'}, {role: 'assistant', text: '前情。'.repeat(100) + '明天我会来。'}];
    const pin = {turn: 1, role: 'assistant', text: turns[1].text.slice(0, 200)};
    const data = new Map([[key, structuredClone(turns)], [key + '-threads', {version: 1, active: 'main', threads: [{id: 'main', pins: [pin]}]}]]);
    const manager = createCharacterThreads({id, read: (key, fallback) => structuredClone(data.get(key) ?? fallback), save: (key, value) => data.set(key, structuredClone(value))});
    if (!editBeforeSave) {manager.saveMessages(turns); assert.equal(manager.pins(turns).length, 1); assert.ok(manager.pins(turns)[0].sourceStamp);}
    turns[1].text = '前情。'.repeat(100) + '明天我不会来。';
    manager.saveMessages(turns); assert.equal(manager.memory(turns), '');
  }
});
