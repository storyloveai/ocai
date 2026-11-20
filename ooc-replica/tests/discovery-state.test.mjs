import test from 'node:test';
import assert from 'node:assert/strict';
import {readDiscoveryState, discoveryUrl} from '../dist/assets/flywheel/discovery-state.js';

const worlds = new Set(['xichuan', 'sanguo', 'westlin', 'baker', 'original']);
const defaults = {world: 'all', chat: false};
const asUrl = value => new URL(value, 'https://preview.example');

test('an unfiltered directory visit never inherits a previous visit’s pill selection', () => {
  const selected = readDiscoveryState('?world=xichuan&chat=1', worlds);
  for (const query of ['', '?world=all', '?world=', '?world=unknown', '?q=previous']) {
    assert.deepEqual(readDiscoveryState(query, worlds), defaults);
  }
  assert.deepEqual(selected, {world: 'xichuan', chat: true});
});

test('worlds require an explicit whitelist entry, including dictionary prototype names', () => {
  const dictionary = Object.assign(Object.create({inherited: true}), {xichuan: true});
  for (const allowed of [worlds, ['xichuan'], dictionary]) {
    assert.equal(readDiscoveryState('?world=xichuan', allowed).world, 'xichuan');
    for (const world of ['toString', '__proto__', 'constructor', 'inherited', 'XICHUAN']) {
      assert.equal(readDiscoveryState('?world=' + world, allowed).world, 'all', world);
    }
  }
  assert.equal(readDiscoveryState('?world=xichuan').world, 'all');
});

test('chat is selected only by the documented URL value', () => {
  assert.deepEqual(readDiscoveryState('?chat=1', worlds), {world: 'all', chat: true});
  for (const value of ['', 'true', '0', '2']) {
    assert.deepEqual(readDiscoveryState('?chat=' + value, worlds), defaults);
  }
});

test('old combined links retain both valid filters and discard the retired local search', () => {
  const search = '?world=xichuan&chat=1&q=' + encodeURIComponent('夏 &world=baker&chat=0#oops');
  const state = readDiscoveryState(search, worlds);
  assert.deepEqual(state, {world: 'xichuan', chat: true});
  assert.equal(discoveryUrl(state, {search}), '/characters?world=xichuan&chat=1');
  assert.deepEqual(readDiscoveryState('?world=unknown&chat=1', worlds), {world: 'all', chat: true});
});

test('return URLs keep unrelated navigation context and the anchor when switching to All', () => {
  const search = '?source=home&tag=one&world=xichuan&tag=two&chat=1&q=old&world=sanguo';
  const url = asUrl(discoveryUrl(defaults, {search, hash: '#cast'}));
  assert.equal(url.pathname, '/characters');
  assert.equal(url.hash, '#cast');
  assert.equal(url.searchParams.get('source'), 'home');
  assert.deepEqual(url.searchParams.getAll('tag'), ['one', 'two']);
  for (const key of ['world', 'chat', 'q']) assert.equal(url.searchParams.has(key), false);
  assert.equal(discoveryUrl(defaults, {hash: 'cast'}), '/characters#cast');
});

test('share, reload and browser history reconstruct every world and the chat-only pill', () => {
  const visits = [defaults, {world: 'all', chat: true}, ...[...worlds].map(world => ({world, chat: false}))];
  for (const state of visits) {
    const url = asUrl(discoveryUrl(state, {search: '?source=home', hash: '#cast'}));
    assert.deepEqual(readDiscoveryState(url.search, worlds), state);
    assert.equal(url.searchParams.get('source'), 'home');
    assert.equal(url.hash, '#cast');
  }
});

test('duplicate owned parameters canonicalize once while unrelated repeated parameters survive', () => {
  const search = '?world=xichuan&world=sanguo&chat=1&chat=0&q=first&q=second&source=a&source=b';
  const canonical = asUrl(discoveryUrl(readDiscoveryState(search, worlds), {search}));
  assert.deepEqual(canonical.searchParams.getAll('world'), ['xichuan']);
  assert.deepEqual(canonical.searchParams.getAll('chat'), ['1']);
  assert.equal(canonical.searchParams.has('q'), false);
  assert.deepEqual(canonical.searchParams.getAll('source'), ['a', 'b']);
});

test('the serializer never puts an old search term, private hero draft or chat message into the URL', () => {
  const state = {...defaults, query: 'old search', heroDraft: 'private reply', chatMessage: 'private text'};
  assert.equal(discoveryUrl(state), '/characters');
});
