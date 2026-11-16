import test from 'node:test';
import assert from 'node:assert/strict';
import {readDiscoveryState, patchDiscoveryState, discoveryUrl} from '../dist/assets/flywheel/discovery-state.js';

const worlds = new Set(['xichuan', 'sanguo', 'westlin', 'baker', 'original']);
const defaults = {world: 'all', chat: false, query: ''};
const asUrl = value => new URL(value, 'https://preview.example');

test('every directory visit reads explicit defaults instead of inheriting another URL’s filters', () => {
  assert.deepEqual(readDiscoveryState('', worlds), defaults);
  const selected = readDiscoveryState('?world=xichuan&chat=1&q=夏知遥', worlds);
  assert.deepEqual(selected, {world: 'xichuan', chat: true, query: '夏知遥'});
  for (const search of ['', '?world=all', '?world=', '?world=unknown']) assert.deepEqual(readDiscoveryState(search, worlds), defaults);
  assert.deepEqual(readDiscoveryState('?world=unknown&chat=1&q=曹操', worlds), {world: 'all', chat: true, query: '曹操'}, 'an unknown world does not erase independent search and chat choices');
  assert.deepEqual(selected, {world: 'xichuan', chat: true, query: '夏知遥'}, 'reading another visit never mutates an earlier state');
});

test('worlds require an explicit whitelist entry, including dictionary prototype names', () => {
  const dictionary = Object.assign(Object.create({inherited: true}), {xichuan: true});
  for (const allowed of [worlds, ['xichuan'], dictionary]) {
    assert.equal(readDiscoveryState('?world=xichuan', allowed).world, 'xichuan');
    for (const world of ['toString', '__proto__', 'constructor', 'inherited', 'XICHUAN']) {
      assert.equal(readDiscoveryState('?world=' + world, allowed).world, 'all', world);
      assert.equal(patchDiscoveryState({world: 'xichuan'}, {world}, allowed).world, 'all', world);
    }
  }
  assert.equal(readDiscoveryState('?world=xichuan').world, 'all', 'no whitelist grants no world-specific filter');
});

test('patches preserve the other filter dimensions and do not mutate their inputs', () => {
  const current = Object.freeze({world: 'xichuan', chat: true, query: '  夏知遥  '});
  const patch = Object.freeze({world: 'sanguo'});
  assert.deepEqual(patchDiscoveryState(current, patch, worlds), {world: 'sanguo', chat: true, query: '  夏知遥  '});
  assert.deepEqual(patchDiscoveryState(current, {chat: false}, worlds), {...current, chat: false});
  assert.deepEqual(patchDiscoveryState(current, {query: ''}, worlds), {...current, query: ''});
  assert.deepEqual(patchDiscoveryState(current, {world: 'all'}, worlds), {...current, world: 'all'});
  assert.deepEqual(patchDiscoveryState(current, {}, worlds), current);
  assert.deepEqual(current, {world: 'xichuan', chat: true, query: '  夏知遥  '});
  assert.deepEqual(patch, {world: 'sanguo'});
});

test('query round trips preserve partial input, case, whitespace and URL punctuation exactly', () => {
  for (const query of ['夏', '夏知', '夏知遥 ', '  Cao Cao  ', '票根 & a=b? #cinema + 100%', '字'.repeat(2000)]) {
    const state = patchDiscoveryState(defaults, {query}, worlds);
    const url = asUrl(discoveryUrl(state));
    assert.equal(url.pathname, '/characters');
    assert.equal(url.searchParams.get('q'), query);
    assert.deepEqual(readDiscoveryState(url.search, worlds), state);
  }
  const whitespace = patchDiscoveryState(defaults, {query: '   '}, worlds);
  assert.equal(asUrl(discoveryUrl(whitespace)).searchParams.get('q'), '   ', 'matching may trim, but unfinished input is not rewritten');
});

test('only the explicit chat flag is active and malformed values return stable defaults', () => {
  assert.equal(readDiscoveryState('?chat=1', worlds).chat, true);
  for (const value of ['', '0', 'true', 'false', 'yes', '01']) assert.equal(readDiscoveryState('?chat=' + value, worlds).chat, false);
  assert.deepEqual(patchDiscoveryState(defaults, {world: null, chat: 'true', query: 42}, worlds), defaults);
  assert.deepEqual(readDiscoveryState(null, worlds), defaults);
});

test('serialization removes obsolete owned fields while preserving unrelated query values and the anchor', () => {
  const context = {search: '?source=home&tag=one&world=xichuan&tag=two&chat=1&q=old&world=sanguo', hash: '#cast'};
  const url = asUrl(discoveryUrl(defaults, context));
  assert.equal(url.pathname, '/characters');
  assert.equal(url.hash, '#cast');
  assert.equal(url.searchParams.get('source'), 'home');
  assert.deepEqual(url.searchParams.getAll('tag'), ['one', 'two']);
  for (const key of ['world', 'chat', 'q']) assert.equal(url.searchParams.has(key), false, `${key} default is omitted`);
  assert.equal(context.search, '?source=home&tag=one&world=xichuan&tag=two&chat=1&q=old&world=sanguo');
  assert.equal(discoveryUrl(defaults), '/characters');
  assert.equal(discoveryUrl(defaults, {hash: 'cast'}), '/characters#cast');
});

test('share, refresh and history URLs reconstruct the same normalized discovery state', () => {
  const first = readDiscoveryState('?source=home&world=xichuan', worlds);
  const searched = patchDiscoveryState(first, {query: '夏知遥', chat: true}, worlds);
  const changedWorld = patchDiscoveryState(searched, {world: 'sanguo', query: '曹操'}, worlds);
  const visits = [first, searched, changedWorld, {...defaults}].map(state => discoveryUrl(state, {search: '?source=home', hash: '#cast'}));
  assert.deepEqual(visits.map(href => readDiscoveryState(asUrl(href).search, worlds)), [first, searched, changedWorld, defaults]);
  for (const href of visits) {
    const url = asUrl(href);
    assert.equal(url.searchParams.get('source'), 'home');
    assert.equal(url.hash, '#cast');
  }
  assert.deepEqual(readDiscoveryState(asUrl(visits[1]).search, worlds), searched, 'Back reconstructs the earlier search without using the later world');
});

test('duplicate owned parameters canonicalize once and search text cannot inject another filter', () => {
  const search = '?world=xichuan&world=sanguo&chat=1&chat=0&q=first&q=second&source=a&source=b';
  const state = readDiscoveryState(search, worlds);
  assert.deepEqual(state, {world: 'xichuan', chat: true, query: 'first'});
  const canonical = asUrl(discoveryUrl(state, {search}));
  for (const key of ['world', 'chat', 'q']) assert.equal(canonical.searchParams.getAll(key).length, 1);
  assert.deepEqual(canonical.searchParams.getAll('source'), ['a', 'b']);
  const injected = patchDiscoveryState(defaults, {query: 'x&world=xichuan&chat=1#cast'}, worlds);
  const url = asUrl(discoveryUrl(injected));
  assert.equal(url.searchParams.get('q'), injected.query);
  assert.equal(url.searchParams.has('world'), false);
  assert.equal(url.searchParams.has('chat'), false);
  assert.equal(url.hash, '');
});

test('the URL serializer ignores unrelated state such as private hero or chat drafts', () => {
  const state = {...defaults, heroDraft: 'a private unfinished reply', chatMessage: 'private chat text'};
  assert.equal(discoveryUrl(state), '/characters');
  assert.deepEqual(patchDiscoveryState(defaults, state, worlds), defaults);
});
