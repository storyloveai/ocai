import test from 'node:test';
import assert from 'node:assert/strict';
import {createCharacterThreads} from '../dist/assets/character-threads.js';
import {cloudKey} from '../dist/assets/account-storage.js';

function fixture(id = 'oc-test', data = new Map()) {
  let count = 0;
  const helpers = {read: (key, fallback) => structuredClone(data.get(key) ?? fallback), save: (key, value) => data.set(key, structuredClone(value))};
  const make = () => createCharacterThreads({id, ...helpers, defaultScene: 'first', now: () => 100, newId: () => 'branch-' + (++count)});
  return {data, helpers, make, key: 'ooc-session-v2-' + id};
}
const conversation = () => [
  {role: 'user', text: '我不喝酒。'},
  {role: 'assistant', text: '*他收起酒杯。*\n\n“那就喝茶。”'},
  {role: 'user', text: '我决定明天离开。'},
  {role: 'assistant', text: '“我会替你留好车票。”'}
];

test('an existing v2 conversation opens without reset or a forced migration write', () => {
  const f = fixture(); f.data.set(f.key, conversation()); const before = structuredClone([...f.data]);
  const state = f.make().initial(); assert.deepEqual(state.messages, conversation());
  assert.equal(state.active, 'main'); assert.deepEqual([...f.data], before);
});
test('a branch keeps the original, copies only the chosen prefix, and excludes later memories', () => {
  const f = fixture(); f.data.set(f.key, conversation()); const original = f.make();
  original.pin(0, conversation()); original.pin(3, conversation());
  const branch = original.fork(conversation(), 1, {label: '另一种选择'});
  const current = f.make(); assert.equal(current.initial().active, branch);
  assert.deepEqual(current.initial().messages, conversation().slice(0, 2));
  assert.equal(current.pins(current.initial().messages).length, 1);
  assert.doesNotMatch(current.memory(current.initial().messages), /车票|明天离开/);
  assert.deepEqual(f.data.get(f.key + '-branch-main'), conversation());
  assert.equal(original.saveMessages([{role: 'assistant', text: 'late old response'}]), false);
});
test('returning to the original branch does not revive an old request’s write permission', () => {
  const f = fixture(); f.data.set(f.key, conversation()); const old = f.make();
  old.fork(conversation(), 1); const branch = f.make();
  assert.ok(branch.select('main', branch.initial().messages));
  const returned = f.make(); assert.deepEqual(returned.initial().messages, conversation());
  assert.equal(old.saveMessages([{role: 'assistant', text: 'late response after switching back'}]), false);
  assert.deepEqual(returned.initial().messages, conversation());
});
test('even a new view of the same branch prevents a disposed view from overwriting it', () => {
  const f = fixture(); const old = f.make(); const fresh = f.make();
  fresh.saveMessages([{role: 'user', text: 'new conversation'}]);
  assert.equal(old.saveMessages([{role: 'user', text: 'old view'}]), false);
  assert.equal(f.data.get(f.key)[0].text, 'new conversation');
});
test('a new encounter starts clean and retains the previous encounter and its memories', () => {
  const f = fixture(); f.data.set(f.key, conversation()); const old = f.make(); old.pin(0, conversation());
  old.begin('second', '另一次初见', conversation()); const second = f.make();
  assert.equal(second.initial().thread.sceneId, 'second'); assert.deepEqual(second.initial().messages, []);
  assert.deepEqual(second.pins([]), []); assert.equal(second.memory([]), '');
  second.select('main', []); const first = f.make(); assert.deepEqual(first.initial().messages, conversation());
  assert.equal(first.pins(conversation()).length, 1);
});
test('choosing the first encounter creates only one branch', () => {
  const f = fixture(); const m = f.make(); m.begin('second', '初次相遇', []);
  assert.equal(m.initial().threads.length, 1); assert.equal(m.initial().thread.sceneId, 'second');
});
test('a new scene cannot inherit a different scene’s old conversation', () => {
  const f = fixture(); const m = f.make();
  assert.throws(() => m.fork(conversation(), 1, {sceneId: 'second'}), /fresh conversation/);
});
test('memories preserve speaker attribution and disappear when their source is edited', () => {
  const f = fixture(); const m = f.make(); m.pin(0, conversation()); m.pin(1, conversation());
  assert.match(m.memory(conversation()), /Visitor previously said: 我不喝酒/);
  assert.match(m.memory(conversation()), /Character previously said \(a statement, not verified fact\)/);
  const changed = conversation(); changed[0].text = '我改主意了。'; m.saveMessages(changed);
  assert.equal(m.pins(changed).length, 1); assert.doesNotMatch(m.memory(changed), /我不喝酒/);
  m.removePin(0, changed); assert.equal(m.memory(changed), '');
});
test('a failed branch-pointer write rolls back the active conversation', () => {
  const f = fixture(); f.data.set(f.key, conversation()); let fail = true;
  const save = (key, value) => {if (key === f.key + '-threads' && fail) {fail = false; throw Error('quota');} f.helpers.save(key, value);};
  const m = createCharacterThreads({id: 'oc-test', read: f.helpers.read, save, newId: () => 'new-branch'});
  assert.throws(() => m.fork(conversation(), 1), /quota/);
  assert.deepEqual(m.initial().messages, conversation()); assert.equal(m.initial().active, 'main');
});
test('different character keys never share messages, branches or memories', () => {
  const data = new Map(), a = fixture('oc-alice', data), b = fixture('oc-bob', data);
  const one = a.make(), two = b.make(); one.saveMessages(conversation()); one.pin(0, conversation());
  assert.deepEqual(two.initial().messages, []); assert.equal(two.memory([]), '');
  assert.equal(two.initial().threads.length, 1);
});
test('deleting another branch keeps the current conversation, and the active branch cannot be deleted', () => {
  const f = fixture(); f.data.set(f.key, conversation()); const one = f.make(); const id = one.fork(conversation(), 1);
  const branch = f.make(); assert.equal(branch.remove(id), false); assert.equal(branch.remove('main'), true);
  assert.equal(branch.initial().threads.length, 1); assert.deepEqual(branch.initial().messages, conversation().slice(0, 2));
  assert.equal(f.data.get(f.key + '-branch-main'), null);
});
test('branch and memory keys remain eligible for existing account cloud sync', () => {
  assert.equal(cloudKey('ooc-session-v2-oc-shen-yanzhou-threads'), true);
  assert.equal(cloudKey('ooc-session-v2-oc-shen-yanzhou-branch-branch-1'), true);
});
test('all six remembered excerpts fit the model continuity budget without splitting surrogate pairs', () => {
  const f = fixture(), m = f.make();
  const messages = Array.from({length: 6}, () => ({role: 'assistant', text: '😀'.repeat(150)}));
  for(let i=0;i<6;i++)m.pin(i,messages);
  const memory=m.memory(messages);assert.equal(memory.split('Character previously said').length-1,6);
  assert.ok(memory.length<=1600);assert.ok(m.pins(messages).every(p=>!/[\uD800-\uDBFF]$/.test(p.text)));
});
