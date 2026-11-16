import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccount} from '../dist/assets/account.js';
import {conflictMarkup} from '../dist/assets/account-sync-ui.js';
const key = 'ooc-session-v2-xichuan';
const memory = () => {const rows = new Map(); return {getItem: k => rows.get(k) ?? null, setItem: (k, v) => rows.set(k, v)};};
async function fixture({storage = memory(), cloud = new Map([[key, {stage: 'cloud'}]]), unavailable = true} = {}) {
  let callback;
  const writes = [], client = {
    subscribe: f => callback = f,
    load: async () => {if (f.unavailable) throw Error('offline'); return [...cloud].map(([k, v]) => [k, structuredClone(v)]);},
    save: async (uid, k, value) => {writes.push([uid, k, structuredClone(value)]); cloud.set(k, structuredClone(value));}
  };
  const f = {storage, cloud, writes, client, unavailable};
  f.a = createAccount({storage, fetchImpl: async () => ({ok: true, json: async () => ({auth: {config: {}, providers: {}}})}), loadClient: async () => ({connectFirebase: async () => client})});
  await f.a.init(); f.login = user => callback(user); await f.login({uid: 'alice'}); return f;
}
test('unknown cloud state blocks autosaves and survives reload until the owner chooses a copy', async () => {
  const f = await fixture();
  f.a.save(key, {stage: 'device'});
  assert.equal(await f.a.flush(), false); assert.equal(f.writes.length, 0);
  assert.deepEqual(f.cloud.get(key), {stage: 'cloud'});
  const g = await fixture({storage: f.storage, cloud: f.cloud, unavailable: false});
  assert.deepEqual(g.a.conflictKeys, [key]); assert.equal(await g.a.flush(), false);
  assert.deepEqual(g.a.read(key), {stage: 'device'});
  const previous = g.a.scope();
  await g.a.resolveConflicts('cloud');
  previous.save(key, {stage: 'late write'});
  assert.deepEqual(g.a.read(key), {stage: 'cloud'}); assert.equal(g.writes.length, 0);
  assert.deepEqual(JSON.parse(g.storage.getItem('ooc-sync-backup:alice'))[0].values[key], {stage: 'device'});
});
test('retry reads the cloud first; selecting the device version then syncs exactly that version', async () => {
  const f = await fixture(); f.a.save(key, {stage: 'device'}); f.unavailable = false;
  await f.a.retrySync(); assert.equal(f.writes.length, 0); assert.ok(f.a.conflictKeys.includes(key));
  await f.a.resolveConflicts('device');
  assert.deepEqual(f.cloud.get(key), {stage: 'device'}); assert.equal(f.writes.length, 1);
  assert.equal(f.a.syncError, ''); assert.deepEqual(f.a.conflictKeys, []);
});
test('a verified empty cloud can accept device progress without an unnecessary conflict', async () => {
  const f = await fixture({cloud: new Map()}); f.a.save(key, {stage: 'new'}); f.unavailable = false;
  await f.a.retrySync(); await f.a.flush();
  assert.deepEqual(f.a.conflictKeys, []); assert.equal(f.writes.length, 1);
  assert.deepEqual(f.cloud.get(key), {stage: 'new'});
});
test('identical cloud and device copies do not trigger a conflict or duplicate write', async () => {
  const f = await fixture(); f.a.save(key, {stage: 'cloud'}); f.unavailable = false;
  await f.a.retrySync(); await f.a.flush();
  assert.deepEqual(f.a.conflictKeys, []); assert.equal(f.writes.length, 0); assert.equal(f.a.pendingCount, 0);
});
test('a late failed save from Alice cannot display a sync error in Bob’s account', async () => {
  const f = await fixture({unavailable: false});
  let rejectSave; f.client.save = () => new Promise((_, reject) => rejectSave = reject);
  f.a.save(key, {stage: 'alice'}); const writing = f.a.flush();
  await f.login({uid: 'bob'}); rejectSave(Error('offline')); await writing;
  assert.equal(f.a.user.uid, 'bob'); assert.equal(f.a.syncError, ''); assert.equal(f.a.syncing, false);
});
test('writing another key while a save is in flight keeps both pending markers for reload', async () => {
  const f = await fixture({unavailable: false}); let finish;
  f.client.save = () => new Promise(resolve => finish = resolve);
  f.a.save(key, {stage: 'new'}); const writing = f.a.flush();
  f.a.save('ooc-profile', {name: 'local'});
  assert.deepEqual(JSON.parse(f.storage.getItem('ooc-sync-pending:alice')).sort(), ['ooc-profile', key].sort());
  finish(); await writing;
  f.client.save = async () => {}; await f.a.flush();
});
test('a failed local backup cannot discard either conflicting copy', async () => {
  const f = await fixture(); f.a.save(key, {stage: 'device'}); f.unavailable = false; await f.a.retrySync();
  const original = f.storage.setItem;
  f.storage.setItem = (k, v) => {if (k.startsWith('ooc-sync-backup')) throw Error('full'); original(k, v);};
  await assert.rejects(f.a.resolveConflicts('cloud'), /full/);
  assert.deepEqual(f.a.read(key), {stage: 'device'}); assert.deepEqual(f.cloud.get(key), {stage: 'cloud'});
  assert.deepEqual(f.a.conflictKeys, [key]);
});
test('conflict review escapes displayed summaries and never renders account identifiers', () => {
  const html = conflictMarkup([{key: 'ooc-session-v2-xichuan', device: {'game.xichuan': {G: {ch: 1, phase: 'node', v: {}, offer: [], done: []}, V: {queue: [], i: 0, log: [], sprites: {}}}}, cloud: []}], 'zh');
  assert.match(html, /汐川故事/); assert.match(html, /第 1 章/); assert.match(html, /改用云端版本/);
  assert.doesNotMatch(conflictMarkup([{key: '<script>', device: ['private sentence'], cloud: 'private sentence'}]), /<script>|private sentence/);
});


test('failed replacement rolls back device records and leaves the device choice usable', async () => {
  const cloud = new Map([[key, {stage: 'cloud'}], ['ooc-profile', {stage: 'cloud-profile'}]]);
  const f = await fixture({cloud}); f.a.save(key, {stage: 'device'}); f.a.save('ooc-profile', {stage: 'device-profile'});
  f.unavailable = false; await f.a.retrySync();
  const original = f.storage.setItem; let fail = true;
  f.storage.setItem = (k, v) => {if (fail && k.endsWith('ooc-profile') && v.includes('cloud-profile')) {fail = false; throw Error('quota');} original(k, v);};
  await assert.rejects(f.a.resolveConflicts('cloud'), /quota/);
  assert.deepEqual(f.a.read(key), {stage: 'device'});
  assert.deepEqual(f.a.read('ooc-profile'), {stage: 'device-profile'});
  assert.equal(f.a.conflictKeys.length, 2);
  await f.a.resolveConflicts('device');
  assert.deepEqual(f.cloud.get(key), {stage: 'device'});
  assert.deepEqual(f.cloud.get('ooc-profile'), {stage: 'device-profile'});
});
