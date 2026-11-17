import test from 'node:test';
import assert from 'node:assert/strict';
import {boot, waitFor} from './fixtures/character-loop-dom.mjs';
import {VISITED_TITLES_KEY} from '../dist/assets/library-records.js';
import {cloudKey} from '../dist/assets/account-storage.js';

const drain = () => new Promise(resolve => setImmediate(resolve));
const remoteTitle = id => ({id, type: 'character', title: 'Remote character', image: '/assets/cover-0.webp', description: 'A public introduction.', details: 'PRIVATE AUTHOR CANON', opening: 'An original opening.', ownerUid: 'not-display-metadata'});

test('remote title completions respect the active route and account, while visited metadata never grants access', async t => {
  const f = await boot({path: '/characters'});
  const originalFetch = globalThis.fetch, pending = [], writes = [];
  const records = new Map([['alice', new Map()], ['bob', new Map()], ['guest', new Map()]]);
  const account = {user: {uid: 'alice'}, busy: false, restored: true, providers: {}};
  let generation = 0;
  const scope = () => {
    const version = generation, owner = account.user?.uid || 'guest';
    return {
      account, data: [], categories: [], navigate() {}, show() {},
      read: (key, fallback) => version === generation ? structuredClone(records.get(owner).get(key) ?? fallback) : fallback,
      save: (key, value) => { if (version === generation) { writes.push([owner, key]); records.get(owner).set(key, structuredClone(value)); } },
    };
  };
  globalThis.fetch = (path, options) => {
    if (!String(path).startsWith('/api/titles?id=')) return originalFetch(path, options);
    let resolve, reject;
    // Deliberately allow completion after abort to exercise the consumer guard,
    // including transports that have already received a response body.
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    pending.push({id: new URL(path, f.location.origin).searchParams.get('id'), options, resolve, reject});
    return promise;
  };
  const interaction = await import('../dist/assets/interaction.js');
  const reference = await import('../dist/assets/reference.js');
  // Activate the app's lazy interaction handle as well as importing the module,
  // so a real navigation away invokes the same production cleanup callback.
  await f.go('/play/xc-zhiyao');
  await waitFor(() => f.document.querySelector('#session-input'), 'the app did not activate its interaction route');
  assert.ok(f.document.querySelector('a[href="/characters/xc-zhiyao"] [data-session-title]'), 'a curated character keeps its real profile link');
  await f.go('/characters');
  const open = (id, pathname = '/play/' + id) => {
    f.history.pushState({}, '', pathname);
    const count = pending.length;
    assert.equal(interaction.show(f.location.pathname, scope()), true);
    assert.equal(pending.length, count + 1, 'every remote visit starts a fresh GET');
    return pending.at(-1);
  };
  const settle = async (request, outcome, id = request.id) => {
    if (outcome === 'reject') request.reject(Error('late network failure'));
    else request.resolve(Response.json({title: remoteTitle(id)}));
    await drain();
  };
  const resetAlice = () => {
    interaction.show('/characters', scope());
    generation++; account.user = {uid: 'alice'}; account.busy = false; account.restored = true;
  };
  const marker = label => reference.mountShell(`<section data-remote-destination>${label}</section>`, scope(), 'remote-test').querySelector('[data-remote-destination]');
  const visited = uid => structuredClone(records.get(uid).get(VISITED_TITLES_KEY));
  try {
    await t.test('leaving a pending remote title aborts it and both late outcomes leave the real directory intact', async () => {
      for (const outcome of ['reject', 'success']) {
        resetAlice();
        const before = visited('alice'), request = open('u-leave-' + outcome);
        await f.go('/characters');
        const directory = f.document.querySelector('[data-fw-page="characters"]');
        assert.ok(directory);
        assert.equal(request.options.signal.aborted, true);
        await settle(request, outcome);
        assert.ok(f.document.querySelector('[data-fw-page="characters"]') === directory, 'a late completion does not remount the destination');
        assert.equal(f.document.querySelector('#session-input'), null);
        assert.deepEqual(visited('alice'), before);
      }
    });

    await t.test('a different account or replacement auth object rejects both late success and late failure', async () => {
      for (const nextUid of ['bob', 'alice']) for (const outcome of ['reject', 'success']) {
        resetAlice();
        const request = open('u-account-' + nextUid + '-' + outcome), alice = visited('alice'), bob = visited('bob');
        generation++; account.user = {uid: nextUid};
        const destination = marker('Current account view');
        await settle(request, outcome);
        assert.ok(f.document.querySelector('[data-remote-destination]') === destination, 'an earlier auth object cannot replace the current view');
        assert.deepEqual(visited('alice'), alice); assert.deepEqual(visited('bob'), bob);
      }
    });

    await t.test('busy and unrestored accounts cannot accept a response even when their user object has not changed', async () => {
      for (const state of [{busy: true, restored: true}, {busy: false, restored: false}]) for (const outcome of ['reject', 'success']) {
        resetAlice();
        const request = open('u-restoring-' + outcome), before = visited('alice');
        Object.assign(account, state);
        const destination = marker('Restoring account');
        await settle(request, outcome);
        assert.ok(f.document.querySelector('[data-remote-destination]') === destination);
        assert.deepEqual(visited('alice'), before);
      }
    });

    await t.test('a same-prefix play or episode URL cannot accept a queued completion', async () => {
      for (const pathname of ['/play/u-prefix-title', '/story/u-prefix-title/episode/1', '/character/u-prefix-title/episode/1']) for (const outcome of ['reject', 'success']) {
        resetAlice();
        const request = open('u-prefix-title', pathname), before = visited('alice');
        // Isolate the exact-path guard while the old request token is current.
        f.history.pushState({}, '', pathname + '-other');
        const destination = marker('A different title');
        await settle(request, outcome);
        assert.ok(f.document.querySelector('[data-remote-destination]') === destination);
        assert.deepEqual(visited('alice'), before);
      }
    });

    await t.test('successful access caches only scoped display metadata and a later 404 still blocks play', async () => {
      resetAlice();
      const id = 'u-verified-remote', request = open(id);
      await settle(request, 'success');
      await waitFor(() => f.document.querySelector('#session-input'), 'verified remote title did not mount');
      assert.ok(f.document.querySelector('a[href="/community"] [data-session-title]'), 'a remote title returns to its accessible Community source');
      assert.equal(f.document.querySelector(`a[href="/character/${id}"]`), null, 'remote titles have no fabricated character details route');
      const snapshot = visited('alice');
      assert.equal(snapshot.version, 1); assert.equal(snapshot.titles.length, 1);
      assert.deepEqual(snapshot.titles[0], {id, title: 'Remote character', type: 'character', image: '/assets/cover-0.webp'});
      assert.equal(JSON.stringify(snapshot).includes('PRIVATE AUTHOR CANON'), false);
      assert.equal(JSON.stringify(snapshot).includes('not-display-metadata'), false);
      assert.equal(cloudKey(VISITED_TITLES_KEY), false, 'visited labels stay in the device account scope');
      assert.equal(records.get('alice').has('ooc-custom'), false, 'visited metadata never becomes an owned publication');
      assert.equal(visited('bob'), undefined);
      await f.go('/characters');
      const reopened = open(id);
      assert.equal(reopened.id, id);
      assert.equal(f.document.querySelector('#session-input'), null, 'cached display metadata cannot open the player while the GET is pending');
      reopened.resolve(Response.json({error: 'The creator withdrew this title.'}, {status: 404}));
      await drain();
      assert.equal(f.document.querySelector('#session-input'), null);
      assert.match(f.document.querySelector('#precision-view').textContent, /Story unavailable/);
      assert.deepEqual(visited('alice'), snapshot, 'a display label may remain in History but never bypasses the denied access');
    });

    await t.test('a mismatched response ID is neither playable nor cacheable', async () => {
      resetAlice();
      const before = visited('alice'), request = open('u-requested-title');
      await settle(request, 'success', 'u-different-title');
      assert.equal(f.document.querySelector('#session-input'), null);
      assert.match(f.document.querySelector('#precision-view').textContent, /Story unavailable/);
      assert.deepEqual(visited('alice'), before);
      assert.ok(writes.every(([, key]) => key === VISITED_TITLES_KEY), 'remote loading writes no canonical drafts, chat messages or game saves');
    });

    await t.test('both legacy episode entrances finish loading and ignore success or failure after leaving', async () => {
      for (const kind of ['story', 'character']) {
        for (const outcome of ['success', 'reject', '404']) {
          resetAlice();
          const id = 'u-episode-' + kind + '-' + outcome, pathname = `/${kind}/${id}/episode/1`;
          const before = visited('alice'), request = open(id, pathname);
          if (outcome === 'success') request.resolve(Response.json({title: {...remoteTitle(id), type: kind}}));
          else if (outcome === '404') request.resolve(Response.json({error: 'Withdrawn title'}, {status: 404}));
          else request.reject(Error('network failure'));
          await drain();
          assert.equal(f.location.pathname, pathname, 'a legacy URL stays the accepted route for this request');
          if (outcome === 'success') {
            assert.ok(f.document.querySelector('#session-input'), 'a valid legacy episode opens its session');
            assert.ok(f.document.querySelector('a[href="/community"] [data-session-title]'));
            assert.equal(visited('alice').titles[0].id, id);
          } else {
            assert.equal(f.document.querySelector('#session-input'), null);
            assert.match(f.document.querySelector('#precision-view').textContent, /Story unavailable/);
            assert.deepEqual(visited('alice'), before);
          }
        }
        for (const outcome of ['success', 'reject']) {
          resetAlice();
          const id = 'u-left-episode-' + kind + '-' + outcome, request = open(id, `/${kind}/${id}/episode/1`), before = visited('alice');
          await f.go('/characters');
          const directory = f.document.querySelector('[data-fw-page="characters"]');
          assert.ok(directory); assert.equal(request.options.signal.aborted, true);
          await settle(request, outcome);
          assert.ok(f.document.querySelector('[data-fw-page="characters"]') === directory);
          assert.equal(f.document.querySelector('#session-input'), null);
          assert.deepEqual(visited('alice'), before);
        }
      }
    });

    await t.test('both kinds of an owned published title return to My Titles without a remote lookup', async () => {
      for (const type of ['story', 'character']) {
        resetAlice();
        const id = 'u-owned-' + type;
        records.get('alice').set('ooc-custom', [{id: 'draft-' + type, publishedId: id, status: 'published', type, title: 'My published ' + type, description: 'My introduction.', opening: 'My opening.'}]);
        const requests = pending.length;
        f.history.pushState({}, '', '/play/' + id);
        assert.equal(interaction.show(f.location.pathname, scope()), true);
        assert.ok(f.document.querySelector('#session-input'));
        assert.ok(f.document.querySelector('a[href="/my-title"] [data-session-title]'), 'the current account can return to its owned publication');
        assert.equal(f.document.querySelector(`a[href="/${type}/${id}"]`), null, 'published titles have no fabricated details route');
        assert.equal(pending.length, requests, 'the owned published record already supplies the playable title');
      }
    });
  } finally {
    interaction.show('/characters', scope());
    globalThis.fetch = originalFetch;
    await f.go('/characters'); clearInterval(f.window.carousel);
  }
});
