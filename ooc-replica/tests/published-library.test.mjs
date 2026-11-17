import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML, DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveLibraryRecords, withVisitedTitle, VISITED_TITLES_KEY} from '../dist/assets/library-records.js';
import {cloudKey} from '../dist/assets/account-storage.js';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

test('private library resolution prefers current catalog and never invents an unavailable title', () => {
  const current = Object.freeze({id: 'u-current', type: 'character', title: 'Current catalog title', image: '/current.png'});
  const drafts = Object.freeze([
    Object.freeze({id: 'draft-own', publishedId: 'u-own', status: 'published', type: 'story', title: 'My private published story', visibility: 'private', details: 'Private author instructions'}),
    Object.freeze({id: 'draft-current', publishedId: 'u-current', status: 'published', type: 'story', title: 'An older local title'}),
    Object.freeze({id: 'draft-not-published', publishedId: 'u-draft', status: 'draft', type: 'story', title: 'Unpublished draft'}),
    Object.freeze({id: 'draft-wrong-kind', publishedId: 'u-invalid', status: 'published', type: 'background', title: 'Not a playable title'}),
    Object.freeze({id: 'draft-missing-public-id', status: 'published', type: 'character', title: 'Incomplete legacy record'}),
  ]);
  const catalog = Object.freeze([current]);
  const ids = Object.freeze(['u-current', 'u-own', 'u-remote-unavailable', 'u-draft', 'u-invalid', 'draft-own', 'u-own']);
  const resolved = resolveLibraryRecords(ids, catalog, drafts);
  assert.deepEqual(resolved.map(d => d.id), ['u-current', 'u-own']);
  assert.equal(resolved[0], current);
  assert.equal(resolved[1].type, 'story');
  assert.equal(resolved[1].title, 'My private published story');
  assert.equal(resolved[1].publishedId, 'u-own');
  assert.equal(resolved[1].image, '/assets/cover-0.webp');
  assert.equal('details' in resolved[1], false);
  assert.equal(catalog.length, 1);
  assert.deepEqual(resolveLibraryRecords(['u-own'], catalog, []), []);
});

test('visited display cache keeps a bounded public whitelist and cannot become an owned playable draft', () => {
  const publicTitle = Object.freeze({id: 'u-visited', type: 'character', title: 'A'.repeat(70), image: 'data:image/png;base64,' + 'A'.repeat(9000), details: 'Private canon', prologue: 'Private opening', canon: {secret: true}, status: 'published', publishedId: 'u-pretend-owner'});
  const snapshot = withVisitedTitle(null, publicTitle);
  assert.deepEqual(Object.keys(snapshot), ['version', 'titles']);
  assert.deepEqual(Object.keys(snapshot.titles[0]), ['id', 'title', 'type', 'image']);
  assert.equal(snapshot.titles[0].title.length, 50);
  assert.equal(snapshot.titles[0].image, '/assets/cover-0.webp');
  assert.doesNotMatch(JSON.stringify(snapshot), /Private|canon|prologue|publishedId|status/);
  assert.equal(cloudKey(VISITED_TITLES_KEY), false);

  const metadata = resolveLibraryRecords(['u-visited', 'u-never-seen'], [], [], snapshot);
  assert.deepEqual(metadata, [{...snapshot.titles[0], playUrl: '/play/u-visited'}]);
  for (const key of ['publishedId', 'status', 'details', 'opening', 'prologue']) assert.equal(key in metadata[0], false);
  assert.deepEqual(resolveLibraryRecords(['u-visited'], [], [], null), []);
  assert.deepEqual(resolveLibraryRecords(['u-visited'], [], [], {version: 2, titles: snapshot.titles}), []);
  assert.equal(withVisitedTitle(snapshot, {...publicTitle, id: 'not-a-public-title'}), null);
  assert.equal(withVisitedTitle(snapshot, {...publicTitle, id: 'u-' + 'a'.repeat(101)}), null);
  assert.equal(withVisitedTitle(snapshot, {...publicTitle, type: 'background'}), null);
  assert.equal(withVisitedTitle(snapshot, {...publicTitle, title: '  '}), null);

  const many = Object.freeze({version: 1, titles: Object.freeze(Array.from({length: 205}, (_, i) => Object.freeze({id: 'u-old-' + i, title: 'Old ' + i, type: 'story', image: '/cover.png', details: 'Never persist this'})))});
  const bounded = withVisitedTitle(many, {id: 'u-new', title: 'New visit', type: 'story', image: 'javascript:alert(1)'});
  assert.equal(bounded.titles.length, 200);
  assert.equal(bounded.titles[0].id, 'u-new');
  assert.equal(bounded.titles[0].image, '/assets/cover-0.webp');
  assert.doesNotMatch(JSON.stringify(bounded), /details|Never persist/);
  const refreshed = withVisitedTitle(bounded, {id: 'u-old-3', title: 'Updated title', type: 'story', image: '/new.png'});
  assert.equal(refreshed.titles[0].title, 'Updated title');
  assert.equal(refreshed.titles.filter(d => d.id === 'u-old-3').length, 1);

  const own = {id: 'draft-own', publishedId: 'u-visited', status: 'published', type: 'story', title: 'Owned title'};
  assert.equal(resolveLibraryRecords(['u-visited'], [], [own], snapshot)[0].title, 'Owned title');
  assert.equal(resolveLibraryRecords(['u-visited'], [{id: 'u-visited', title: 'Catalog title'}], [own], snapshot)[0].title, 'Catalog title');
});

test('real private publication remains playable in both histories and favorites without crossing account scope', async () => {
  const {document, window} = parseHTML('<html><head><link href="/style.css"></head><body><main id="main"></main><dialog id="modal"></dialog></body></html>');
  const append = window.HTMLElement.prototype.append;
  window.HTMLElement.prototype.append = function (...nodes) {
    const result = append.apply(this, nodes);
    for (const node of nodes) if (node.tagName === 'LINK') queueMicrotask(() => node.onload?.());
    return result;
  };
  window.HTMLElement.prototype.close = function () { this.open = false; };
  const location = {pathname: '/builder/story/draft-library-story', search: '', href: 'https://replica.example/builder/story/draft-library-story'};
  window.history = {replaceState(_state, _title, path) { location.pathname = path; }};
  const requests = [];
  Object.assign(globalThis, {
    document, window, DOMParser, location,
    matchMedia: () => ({matches: true}),
    fetch: async path => {
      requests.push(String(path));
      if (path === '/api/config') return Response.json({configured: false, billing: {enabled: false}});
      return new Response(await readFile(join(dist, path)), {headers: {'Content-Type': 'application/json'}});
    },
  });
  const draft = (id, type, title, image = '') => ({id, type, title, image, status: 'draft', visibility: 'private', description: 'A one-line introduction', details: 'The premise and original cast.', opening: 'A familiar door opens.'});
  const accounts = new Map([
    ['alice', new Map([['ooc-custom', [draft('draft-library-story', 'story', 'Alice private story', '/alice-story.png'), draft('draft-library-character', 'character', 'Alice private character')]]])],
    ['bob', new Map([['ooc-custom', [{...draft('draft-bob', 'story', 'Bob private story'), status: 'published', publishedId: 'u-bob'}]], ['ooc-history', ['u-library-story', 'u-bob', 'u-visited-remote', 'u-bob-visited']], [VISITED_TITLES_KEY, withVisitedTitle(null, {id: 'u-bob-visited', type: 'story', title: 'Bob visited story', image: '/bob-visited.png'})]])],
  ]);
  let owner = 'alice';
  const reads = [], writes = [];
  const data = [{id: 'catalog-story', type: 'story', title: 'Catalog story', image: '/catalog.png'}];
  const originalCatalog = structuredClone(data);
  const account = {user: {uid: owner}, providers: {google: true}, api: async () => { throw Error('Private publication must not call a sharing or wallet API'); }};
  const h = {
    read(key, fallback) { reads.push([owner, key]); return accounts.get(owner).get(key) ?? fallback; },
    save(key, value) { writes.push([owner, key]); accounts.get(owner).set(key, structuredClone(value)); },
    navigate() {},
    show(html) { const dialog = document.querySelector('#modal'); dialog.innerHTML = html; dialog.open = true; },
    account, data, categories: [],
  };
  const {showBuilder} = await import('../dist/assets/builder.js');
  const community = await import('../dist/assets/community.js');
  const reference = await import('../dist/assets/reference.js');
  for (const [type, id] of [['story', 'library-story'], ['character', 'library-character']]) {
    location.pathname = `/builder/${type}/draft-${id}`;
    showBuilder(location.pathname, h);
    document.querySelector('[data-draft-review]').click();
    await document.querySelector('[data-review-publish]').onclick();
    assert.ok(document.querySelector('[data-published-play]'));
  }
  const published = accounts.get('alice').get('ooc-custom');
  assert.deepEqual(published.map(d => [d.status, d.publishedId, d.type, d.visibility]), [
    ['published', 'u-library-story', 'story', 'private'],
    ['published', 'u-library-character', 'character', 'private'],
  ]);

  // These are the same scoped history and session shapes saved after sending a
  // message. A remote id without a current catalog or owned publication stays out.
  accounts.get('alice').set('ooc-history', ['u-library-character', 'u-visited-remote', 'u-remote-unavailable', 'u-library-story', 'catalog-story']);
  accounts.get('alice').set('ooc-session-v2-u-library-story', [{role: 'user', text: 'Keep going'}, {role: 'assistant', text: 'The story continues.'}]);
  accounts.get('alice').set(VISITED_TITLES_KEY, withVisitedTitle(null, {id: 'u-visited-remote', type: 'story', title: 'Alice visited shared story', image: '/shared.png', details: 'Remote private canon'}));
  accounts.get('alice').set('ooc-favorites', ['u-library-story', 'u-library-character', 'u-visited-remote', 'u-never-seen']);
  const afterPublication = structuredClone([...accounts.get('alice')]);
  writes.length = 0;

  location.pathname = '/history';
  community.show(location.pathname, h); reference.syncAccount(account);
  const history = () => [...document.querySelectorAll('.library-items article a')].map(a => a.getAttribute('href'));
  assert.deepEqual(history(), ['/play/u-library-character', '/play/u-visited-remote', '/play/u-library-story', '/play/catalog-story']);
  document.querySelector('[data-library-type=Character]').click();
  assert.deepEqual(history(), ['/play/u-library-character']);
  document.querySelector('[data-library-type=Story]').click();
  assert.deepEqual(history(), ['/play/u-visited-remote', '/play/u-library-story', '/play/catalog-story']);
  assert.match(document.querySelector('.shell-history-list').textContent, /Alice private story/);
  assert.match(document.querySelector('.shell-history-list').textContent, /Alice visited shared story/);
  document.querySelector('[data-history-mode=character]').click();
  assert.match(document.querySelector('.shell-history-list').textContent, /Alice private character/);
  assert.doesNotMatch(document.querySelector('.shell-history-list').textContent, /Alice private story/);

  location.pathname = '/liked'; community.show(location.pathname, h);
  assert.deepEqual(history(), ['/play/u-library-story', '/play/u-library-character', '/play/u-visited-remote']);
  // A cached visit, including one later withdrawn by its owner, cannot satisfy
  // the builder's owned-draft source or appear as an editable work in My Titles.
  location.pathname = '/my-title'; community.show(location.pathname, h);
  assert.equal(document.querySelectorAll('.library-draft').length, 2);
  assert.doesNotMatch(document.querySelector('.library-items').textContent, /visited shared story/);
  assert.deepEqual([...accounts.get('alice')], afterPublication);
  assert.deepEqual(writes, []);
  assert.deepEqual(data, originalCatalog);
  assert.equal(requests.some(path => path.startsWith('/api/titles')), false);

  owner = 'bob'; account.user = {uid: owner};
  location.pathname = '/history'; community.show(location.pathname, h); reference.syncAccount(account);
  assert.deepEqual(history(), ['/play/u-bob', '/play/u-bob-visited']);
  assert.match(document.querySelector('.shell-history-list').textContent, /Bob private story/);
  assert.match(document.querySelector('.shell-history-list').textContent, /Bob visited story/);
  assert.doesNotMatch(document.querySelector('.library-content').textContent + document.querySelector('.shell-history').textContent, /Alice private|Alice visited/);
  assert.ok(reads.every(([, key]) => key.startsWith('ooc-')));
  assert.equal(reads.some(([scope, key]) => scope === 'bob' && key === 'ooc-session-v2-u-library-story'), false);
  assert.equal(reads.some(([scope, key]) => scope === 'bob' && key === 'ooc-session-v2-u-visited-remote'), false);
  assert.deepEqual(writes, []);
  assert.deepEqual(data, originalCatalog);
});
