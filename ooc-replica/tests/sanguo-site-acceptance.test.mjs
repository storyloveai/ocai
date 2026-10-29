import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {Script, createContext} from 'node:vm';
import {parseHTML} from 'linkedom';
import {mountThreeKingdoms} from '../dist/assets/three-kingdoms.js';
import {createAccount} from '../dist/assets/account.js';
import SV from '../three-kingdoms/engine.cjs';

// An optional, separately built content checkout lets the same website bridge
// run against Claude's unpublished volumes without changing generated files.
const root = process.env.SANGUO_ACCEPTANCE_ROOT || fileURLToPath(new URL('../', import.meta.url));
const CC = createRequire(import.meta.url)(join(root, 'server/sanguo-core.cjs'));
const files = (await readdir(join(root, 'sanguo/upstream')))
  .filter(f => /^campaign(?:_v\d+)?\.json$/.test(f))
  .sort((a, b) => Number(a.match(/_v(\d+)/)?.[1] || 1) - Number(b.match(/_v(\d+)/)?.[1] || 1));
const campaigns = await Promise.all(files.map(async f => JSON.parse(await readFile(join(root, 'sanguo/upstream', f), 'utf8'))));
const sessionKey = 'ooc-session-v2-three-kingdoms';
const origin = 'https://test.example';
const tick = () => new Promise(resolve => setTimeout(resolve, 20));
function memory() {
  const values = new Map();
  return {getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k)};
}
function helpersFor(storage) {
  return {read: (k, fallback) => JSON.parse(storage.getItem(k)) ?? fallback,
    save: (k, value) => storage.setItem(k, JSON.stringify(value))};
}
function seed(camp, index, g = CC.newGame(camp)) {
  Object.assign(g, {vol: `sanguo_strategist_v${index + 1}`, run: `acceptance-v${index + 1}`, n: 1, created: 1});
  const meta = {id: g.run, vol: g.vol, n: 1, created: 1, updated: 1, status: g.phase === 'end' ? 'end' : 'play', ch: g.ch,
    chap: camp.chapters[Math.min(g.ch, camp.chapters.length - 1)].id, node: g.cur};
  return {g, snapshot: {['campaign.run.' + g.run]: g, 'campaign.cur': g.run, 'campaign.runs': [meta], 'campaign.runN': 1}};
}
async function embedded({path = '/play/three-kingdoms', search = '', helpers = helpersFor(memory()), siteLang = 'zh'} = {}) {
  const shell = parseHTML('<html><body></body></html>');
  const siteStorage = memory(); siteStorage.setItem('sd.lang', siteLang);
  Object.assign(globalThis, {window: shell.window, document: shell.document, location: {origin, search}, localStorage: siteStorage});
  let frame, deliver;
  const messages = [], saves = [];
  const reference = {mountShell(html) {
    const root = shell.document.createElement('main'); root.innerHTML = html; shell.document.body.append(root);
    frame = root.querySelector('iframe');
    Object.defineProperty(frame, 'contentWindow', {value: {postMessage(message) {
      messages.push(structuredClone(message)); queueMicrotask(() => deliver(structuredClone(message)));
    }}});
    return root;
  }};
  mountThreeKingdoms(path, {reference, account: {}, helpers});
  const html = await readFile(join(root, 'dist', frame.getAttribute('src').split('?')[0]), 'utf8');
  const child = parseHTML(html), {window, document} = child;
  const parent = {postMessage(message) {
    saves.push(structuredClone(message));
    queueMicrotask(() => {
      const event = new shell.window.Event('message');
      Object.assign(event, {origin, source: frame.contentWindow, data: structuredClone(message)});
      shell.window.dispatchEvent(event);
    });
  }};
  window.parent = parent;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLElement.prototype.focus = () => {};
  window.scrollTo = () => {};
  window.matchMedia = () => ({matches: true});
  deliver = message => {
    const event = new window.Event('message'); Object.assign(event, {origin, source: parent, data: message}); window.dispatchEvent(event);
  };
  const childStorage = memory();
  const context = createContext({SV, window, parent, document, navigator: {language: 'zh-CN'},
    location: {origin, protocol: 'https:', search: frame.getAttribute('src').split('?')[1] || '', hash: ''},
    localStorage: childStorage, console, URLSearchParams, AbortController, AbortSignal, TextDecoder, DOMException,
    setTimeout, clearTimeout, performance, Intl, matchMedia: window.matchMedia, requestAnimationFrame: fn => setTimeout(() => fn(performance.now()), 0),
    fetch: async path => {assert.equal(path, '/api/config', 'offline acceptance must not call a model'); return new Response('{"configured":false}');}});
  for (const script of document.querySelectorAll('script:not([type="application/json"])')) new Script(script.textContent).runInContext(context);
  await tick();
  const click = el => {assert.ok(el, 'click target exists'); el.dispatchEvent(new window.Event('click', {bubbles: true, cancelable: true}));};
  const send = (data, source = frame.contentWindow, eventOrigin = origin) => {
    const event = new shell.window.Event('message'); Object.assign(event, {origin: eventOrigin, source, data}); shell.window.dispatchEvent(event);
  };
  return {document, frame, messages, saves, click, send, shell, helpers};
}

test('classic English entry reaches the actual embedded UI and preserves edition settings', async () => {
  const helpers = helpersFor(memory());
  helpers.save(sessionKey, {settings: {lang: 'zh', textMode: 'fixed_first'}, 'campaign.settings': {lang: 'zh', creator: false}});
  const p = await embedded({search: '?edition=classic&lang=en', helpers});
  assert.equal(p.document.documentElement.lang, 'en');
  assert.match(p.document.body.textContent, /Romance of the Three Kingdoms/);
  const snapshot = p.messages.at(-1).snapshot;
  assert.equal(snapshot.settings.textMode, 'fixed_first');
  assert.equal(snapshot['campaign.settings'].lang, 'zh', 'entering classic must preserve modern settings');
});

test('classic entry inherits the site language when no URL language was provided', async () => {
  const p = await embedded({search: '?edition=classic', siteLang: 'en'});
  assert.equal(p.document.documentElement.lang, 'en');
});

test('banner choice is saved once and remains present after refresh', async () => {
  const helpers = helpersFor(memory());
  const p = await embedded({search: '?choice=cover', helpers});
  const snapshot = helpers.read(sessionKey, {}), id = snapshot['campaign.cur'];
  const g = snapshot['campaign.run.' + id];
  assert.equal(g.log.filter(e => e.k === 'choice' && e.c === 'cover').length, 1);
  const r = await embedded({helpers}); r.click(r.document.querySelector('.resume .btn')); await tick();
  assert.equal(helpers.read(sessionKey, {})['campaign.run.' + id].log.filter(e => e.k === 'choice' && e.c === 'cover').length, 1);
  assert.equal(r.document.querySelector('#story').textContent, p.document.querySelector('#story').textContent);
});

for (const [index, camp] of campaigns.entries()) test(`volume ${index + 1}: resume, refresh and ink/illustrated switch preserve authored progress`, async () => {
  const helpers = helpersFor(memory()), {g, snapshot} = seed(camp, index);
  helpers.save(sessionKey, snapshot);
  let story;
  for (const path of ['/play/three-kingdoms', '/play/three-kingdoms', '/play/three-kingdoms-ink']) {
    const p = await embedded({path, helpers});
    p.click(p.document.querySelector('.resume .btn')); await tick();
    // Ink drawings contain SVG labels; compare the authored narrative rather
    // than illustration-specific labels or SVG formatting whitespace.
    const text = [...p.document.querySelectorAll('#story p,.scene h3,.choice')].map(e => e.textContent.replace(/\s+/g, '')).join('|');
    assert.ok(text.length > 50, 'the authored opening renders');
    if (story) assert.equal(text, story); else story = text;
    const saved = helpers.read(sessionKey, {});
    assert.equal(saved['campaign.cur'], g.run);
    assert.deepEqual(saved['campaign.run.' + g.run], snapshot['campaign.run.' + g.run]);
    assert.deepEqual(helpers.read('ooc-history', []), ['three-kingdoms']);
  }
});

for (const [index, camp] of campaigns.slice(0, -1).entries()) test(`volume ${index + 1} ending continues to volume ${index + 2} with its carry and both saves intact`, async () => {
  const helpers = helpersFor(memory());
  const {g, snapshot} = seed(camp, index, CC.playRandom(camp, () => 0.5));
  assert.equal(g.phase, 'end', 'fixture must reach an authored ending');
  helpers.save(sessionKey, snapshot);
  const p = await embedded({helpers});
  p.click(p.document.querySelector('.resume .btn')); await tick();
  assert.ok(p.document.querySelector('.epi'), 'ending renders in the website');
  p.click(p.document.querySelector('.epi > .btns .btn')); await tick();
  const saved = helpers.read(sessionKey, {}), next = saved['campaign.run.' + saved['campaign.cur']];
  const expected = CC.newGame(campaigns[index + 1], CC.carryOut(g));
  assert.equal(next.vol, `sanguo_strategist_v${index + 2}`);
  assert.equal(next.from, g.run);
  assert.equal(next.n, 2);
  assert.deepEqual(next.v, expected.v);
  assert.deepEqual(next.mem, expected.mem);
  assert.deepEqual(next.commits, expected.commits);
  assert.deepEqual(saved['campaign.run.' + g.run], g, 'continuing keeps the finished playthrough');
  assert.equal(saved['campaign.runs'].length, 2);
  assert.ok(saved['campaign.ckpt.' + next.run]?.length, 'next volume creates a replay checkpoint');
});

test('legacy single-save snapshot migrates through the website bridge without losing progress', async () => {
  const helpers = helpersFor(memory()), g = CC.newGame(campaigns[0]);
  helpers.save(sessionKey, {'campaign.save': g});
  const p = await embedded({helpers});
  p.click(p.document.querySelector('.resume .btn')); await tick();
  const saved = helpers.read(sessionKey, {}), migrated = saved['campaign.run.' + saved['campaign.cur']];
  assert.equal(Object.hasOwn(saved, 'campaign.save'), false);
  assert.equal(migrated.cur, g.cur); assert.deepEqual(migrated.log, g.log);
  assert.equal(saved['campaign.runs'][0].id, migrated.run);
});

test('messages from another frame or a detached page cannot overwrite progress', async () => {
  const helpers = helpersFor(memory()), {snapshot} = seed(campaigns[0], 0);
  helpers.save(sessionKey, snapshot);
  const p = await embedded({helpers}), before = helpers.read(sessionKey, {});
  p.send({type: 'sg2-save', key: 'campaign.cur', value: 'wrong-frame'}, {});
  p.send({type: 'sg2-save', key: 'campaign.cur', value: 'wrong-origin'}, p.frame.contentWindow, 'https://other.example');
  p.frame.remove();
  p.send({type: 'sg2-save', key: 'campaign.cur', value: 'detached'});
  assert.deepEqual(helpers.read(sessionKey, {}), before);
});

test('a late save from the previous account cannot enter the next account or guest storage', async () => {
  const storage = memory(); let auth;
  const account = createAccount({storage, fetchImpl: async () => ({ok: true, json: async () => ({auth: {config: {}, providers: {google: true}}})}),
    loadClient: async () => ({connectFirebase: async () => ({subscribe: fn => auth = fn, load: async () => [], save: async () => {}})})});
  await account.init(); await auth({uid: 'alice'});
  const {snapshot} = seed(campaigns[0], 0); account.save(sessionKey, snapshot); await account.flush();
  const p = await embedded({helpers: account.scope()});
  const before = account.read(sessionKey, null); await account.flush();
  await auth({uid: 'bob'});
  p.send({type: 'sg2-save', key: 'campaign.cur', value: 'alice-late-save'});
  assert.equal(account.read(sessionKey, null), null);
  await auth(null);
  assert.equal(account.read(sessionKey, null), null);
  await auth({uid: 'alice'});
  assert.deepEqual(account.read(sessionKey, null), before);
});
