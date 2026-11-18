import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createContext, Script} from 'node:vm';
import {parseHTML} from 'linkedom';

const html = await readFile(new URL('../dist/assets/xichuan/index.html', import.meta.url), 'utf8');
const origin = 'https://storydate.example';

// Exercise the shipped native HTML and campaign through its controls and public frame protocol.
function game({standalone = false, storage = {}, config, Audio} = {}) {
  const {document, Event} = parseHTML(html);
  const listeners = new Map(), messages = [], requests = [];
  const root = {
    document, URL, URLSearchParams, Audio, navigator: {language:'zh'}, screen: {width:390, height:844},
    location: new URL('/assets/xichuan/index.html' + (standalone ? '' : '?site=1'), origin),
    Image: function () { return document.createElement('img'); },
    setInterval: () => 1, clearInterval() {}, setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame() {},
    localStorage: {getItem: k => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; }},
    fetch: async path => { requests.push(path); return config && path === '/api/config' ? config : {ok:false}; },
    addEventListener: (type, fn) => listeners.set(type, fn),
  };
  root.window = root;
  root.parent = standalone ? root : {postMessage: (m, o) => { assert.equal(o, origin); messages.push(structuredClone(m)); }};
  const context = createContext(root);
  for (const script of document.querySelectorAll('script')) new Script(script.textContent).runInContext(context);
  const element = selector => document.querySelector(selector);
  const button = (selector, label) => [...element(selector).querySelectorAll('button')].find(el => el.textContent === label);
  function init(snapshot = {}, entry, source = root.parent, from = origin) {
    listeners.get('message')({data:{type:'xc-init', entry, snapshot:structuredClone(snapshot)}, source, origin:from});
  }
  return {
    init, messages, requests, element, button,
    next: () => element('#box').click(),
    tapStage: () => element('#stage').dispatchEvent(new Event('pointerdown', {bubbles:true})),
    last: key => messages.findLast(m => m.type === 'xc-save' && m.key === key)?.value,
  };
}

function playToChoice() {
  const g = game();
  g.init();
  g.button('#title', '开始游戏').click();
  const initial = g.last('auto');
  let line;
  for (let i = 0; i < 300 && g.element('#menu').hidden; i++) {
    line = g.last('auto');
    g.next();
  }
  const menu = g.last('auto');
  assert.ok(!g.element('#menu').hidden && menu.V.menu);
  assert.equal(line.V.i, menu.V.i);
  return {g, initial, line, menu};
}

test('native handoff restores both final dialogue and choices at the same cursor without writing or replaying', () => {
  const {g, initial, line, menu} = playToChoice();
  const options = g.element('#menu').textContent;
  for (const lang of ['zh', 'en']) {
    const reader = game();
    reader.init({lang, latest:line, auto:initial}, 'resume');
    assert.ok(reader.element('#title').hidden && reader.element('#menu').hidden);
    assert.equal(reader.element('#text').textContent, line.V.queue[line.V.i - 1].t[lang]);
    assert.deepEqual(reader.messages.map(m => m.type), ['xc-ready']);
    reader.next();
    assert.equal(reader.element('#menu').hidden, false);
    assert.deepEqual(reader.last('auto').V.log, line.V.log);
  }
  const reader = game();
  reader.init({latest:menu, auto:initial}, 'resume');
  assert.ok(reader.element('#title').hidden && !reader.element('#menu').hidden);
  assert.equal(reader.element('#menu').textContent, options);
  assert.deepEqual(reader.messages.map(m => m.type), ['xc-ready']);
  reader.element('#menu button').click();
  assert.equal(reader.messages.filter(m => m.action === 'choice').length, 1);
  assert.ok(reader.last('auto').G.log.length > menu.G.log.length);
  assert.deepEqual(reader.requests, ['/api/config']);
});

test('native handoff prefers a completed ending over auto and reviews it without another settlement', () => {
  const {g, initial} = playToChoice();
  // Click through the actual campaign. Keep only the current writes to bound the fixture memory.
  let ending, sideMenu;
  for (let i = 0; i < 10000 && !ending; i++) {
    if (g.element('#menu').hidden) g.next();
    else g.element('#menu button:not([disabled])').click();
    const checkpoint = g.last('auto');
    if (checkpoint?.G.phase === 'side' && checkpoint.V.menu) sideMenu = checkpoint;
    ending = g.last('latest');
    g.messages.length = 0;
  }
  assert.equal(ending?.G.phase, 'end');
  assert.ok(sideMenu, 'the native playthrough visited a side menu');
  const side = game();
  side.init({latest:sideMenu}, 'resume');
  assert.ok(!side.element('#menu').hidden);
  assert.equal(side.element('#menu').querySelectorAll('button').length, sideMenu.G.offer.length);
  assert.deepEqual(side.messages.map(m => m.type), ['xc-ready']);
  const title = g.element('#endscreen h2').textContent;
  for (const auto of [null, initial]) {
    let playAttempts = 0;
    class Sound {
      paused = true;
      play() { playAttempts++; return Promise.reject(Error('Autoplay unavailable')); }
      pause() { this.paused = true; }
    }
    const reader = game({Audio:Sound});
    reader.init({latest:ending, auto}, 'resume');
    assert.ok(reader.element('#title').hidden && !reader.element('#endscreen').hidden);
    assert.equal(reader.element('#endscreen h2').textContent, title);
    assert.deepEqual(reader.messages.map(m => m.type), ['xc-ready']);
    assert.equal(playAttempts, 1);
    reader.tapStage();
    assert.equal(playAttempts, 2, 'the first gesture can retry the ending song');
    reader.button('#endscreen', '回到标题').click();
    assert.equal(reader.element('#title').hidden, false);
  }
  const slot = game();
  slot.init({latest:initial, auto:initial, slot1:ending}, 'resume');
  slot.button('#bar', '读档').click();
  slot.element('#panel .slot').click();
  assert.equal(slot.last('latest').G.phase, 'end');
  assert.equal(slot.last('auto'), null);
});

test('a late config adds free conversation to the visible choice without replacing controls or writing saves', async () => {
  const {menu} = playToChoice();
  let finish;
  const config = new Promise(resolve => { finish = resolve; });
  const reader = game({config});
  reader.init({latest:menu}, 'resume');
  const choices = reader.element('#menu'), first = choices.querySelector('button');
  assert.equal(choices.querySelector('.talk-opt'), null);
  finish({ok:true, json:async () => ({configured:true})});
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(choices.querySelector('.talk-opt'));
  assert.ok(choices.contains(first), 'the original button and its focus remain valid');
  assert.deepEqual(reader.messages.map(m => m.type), ['xc-ready']);
  choices.querySelector('.talk-opt').click();
  assert.ok(choices.querySelector('input'));
  assert.deepEqual(reader.requests, ['/api/config']);
});

test('native handoff honors the parent and origin, title and direct entry, and ignores unusable latest', () => {
  const {initial, menu} = playToChoice();
  const reader = game();
  reader.init({latest:menu}, 'resume', {});
  reader.init({latest:menu}, 'resume', undefined, 'https://other.example');
  assert.equal(reader.element('#title').textContent, '');
  reader.init({latest:menu});
  assert.ok(reader.button('#title', '开始游戏'));
  reader.init({latest:menu}, 'resume');
  assert.equal(reader.element('#title').hidden, false);
  for (const latest of [null, {...menu, G:{...menu.G, ch:-1}}, {...menu, V:{...menu.V, queue:[null]}}]) {
    const bad = game();
    bad.init(latest ? {latest, auto:initial} : {}, 'resume');
    assert.ok(bad.button('#title', '开始游戏'));
    assert.deepEqual(bad.messages.map(m => m.type), ['xc-ready']);
  }
  const legacy = structuredClone(initial);
  delete legacy.V.menu;
  const fallback = game();
  fallback.init({auto:legacy}, 'resume');
  assert.ok(fallback.element('#title').hidden);
  assert.equal(fallback.element('#text').textContent, legacy.V.queue[legacy.V.i - 1].t.zh);
  const standalone = game({standalone:true, storage:{'xc.auto':JSON.stringify(initial)}});
  assert.ok(standalone.button('#title', '继续'));
  const slot = game();
  slot.init({latest:menu, auto:menu, slot1:initial}, 'resume');
  slot.button('#bar', '读档').click();
  slot.element('#panel .slot').click();
  const rollback = slot.last('auto');
  assert.equal(rollback.V.i, initial.V.i);
  assert.deepEqual(rollback.V.log, initial.V.log);
  assert.ok(slot.element('#menu').hidden);
  assert.equal(slot.messages.filter(m => m.action === 'resume').length, 1);
});
