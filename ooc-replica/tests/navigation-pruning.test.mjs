import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML, DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

test('account navigation exposes working destinations and help never loops to unavailable support', async t => {
  const {document, window} = parseHTML('<html><head><link href="/style.css"></head><body><main id="main"></main><dialog id="modal"></dialog></body></html>');
  const append = window.HTMLElement.prototype.append;
  window.HTMLElement.prototype.append = function (...nodes) {
    const result = append.apply(this, nodes);
    for (const node of nodes) if (node.tagName === 'LINK') queueMicrotask(() => node.onload?.());
    return result;
  };
  const language = new Map([['sd.lang', 'en']]);
  Object.assign(globalThis, {
    document, window, DOMParser,
    location: {pathname: '/profile', search: '', href: 'https://replica.example/profile'},
    localStorage: {getItem: key => language.get(key) ?? null},
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
    matchMedia: () => ({matches: true}),
    fetch: async path => new Response(await readFile(join(dist, path)), {headers: {'Content-Type': 'application/json'}}),
  });
  const values = new Map([
    ['ooc-profile', {name: 'Current owner', audience: 'All', bio: 'Keep my details'}],
    ['ooc-favorites', ['story']],
    ['ooc-custom', [{id: 'draft-kept', title: 'My draft'}]],
    ['ooc-session-v2-story', [{role: 'assistant', text: 'Keep my conversation'}]],
    ['ooc-output-length', 'short'],
    ['ooc-suggestions-visible', false],
  ]);
  const original = structuredClone([...values]);
  const writes = [];
  const account = {user: {uid: 'alice'}, providers: {google: true}, api: async () => ({balance: 23})};
  const h = {
    read: (key, fallback) => values.get(key) ?? fallback,
    save: (key, value) => {writes.push(key); values.set(key, value);},
    navigate() {}, show() {}, categories: [], account,
    data: [{id: 'story', title: 'Saved story', type: 'story', image: '/cover.webp'}],
  };
  const reference = await import('../dist/assets/reference.js');
  const community = await import('../dist/assets/community.js');
  const {legalMarkup} = await import('../dist/assets/legal.js');

  await t.test('profile keeps notices, favorites, settings and real credit entry without empty feature links', async () => {
    community.show('/profile', h); reference.syncAccount(account); await Promise.resolve();
    const profile = document.querySelector('.profile-content');
    assert.equal(profile.querySelector('[data-profile-balance]').textContent, '23');
    for (const href of ['/announcement', '/liked', '/profile/setting/chat', '/profile/setting/personalization', '/my-title', '/credit', '/credit?creditTab=free', '/support']) {
      assert.ok(profile.querySelector(`a[href="${href}"]`), href);
    }
    assert.equal(profile.querySelector('a[href="/profile/setting/block-management"]'), null);
    assert.equal(profile.querySelector('a[href="/profile/setting/customer-support"]'), null);
    assert.equal([...profile.querySelectorAll('a')].some(a => a.textContent.trim() === 'Credit History'), false);
    assert.equal(document.querySelector('[data-shell-notifications]'), null);

    // A shell that was mounted before the cleanup must lose its stale entry, too.
    const group = document.querySelector('[data-shrink]').children[1].children[1].children[2];
    group.insertAdjacentHTML('beforeend', '<a role="button" data-shell-notifications>Notifications</a>');
    reference.syncAccount(account);
    assert.equal(document.querySelector('[data-shell-notifications]'), null);
    assert.deepEqual([...values], original);
    assert.deepEqual(writes, []);
  });

  await t.test('support and old support bookmarks show the same truthful state with working onward routes', () => {
    for (const lang of ['en', 'zh']) {
      const support = new DOMParser().parseFromString(legalMarkup('/support', lang), 'text/html');
      assert.match(support.querySelector('.legal-page').textContent, lang === 'zh' ? /在线客服暂未开放/ : /Online support is not available yet/);
      assert.equal(support.querySelector('a[href="/profile/setting/customer-support"]'), null);
      for (const href of ['/credit', '/history', '/profile', '/']) assert.ok(support.querySelector(`a[href="${href}"]`), href);
      for (const path of ['/terms', '/privacy']) assert.doesNotMatch(legalMarkup(path, lang), /My → Settings → Customer Support|我的 → 设置 → 客服/);
    }
    location.pathname = '/profile/setting/customer-support';
    assert.equal(community.show(location.pathname, h), true);
    assert.match(document.querySelector('.legal-page').textContent, /Online support is not available yet/);
    language.set('sd.lang', 'zh');
    window.dispatchEvent(new window.Event('sd-lang'));
    assert.match(document.querySelector('.legal-page').textContent, /在线客服暂未开放/);
    assert.deepEqual([...values], original);
    assert.deepEqual(writes, []);
  });

  await t.test('working session settings still save without touching other account content', () => {
    location.pathname = '/profile/setting/chat';
    community.show(location.pathname, h);
    const output = document.querySelector('[data-output-length]');
    output.querySelectorAll('option').forEach(option => option.removeAttribute('selected'));
    output.querySelector('[value=long]').setAttribute('selected', '');
    output.onchange();
    const suggestion = document.querySelector('[data-suggestion-preference]');
    suggestion.checked = true; suggestion.onchange();
    assert.equal(values.get('ooc-output-length'), 'long');
    assert.equal(values.get('ooc-suggestions-visible'), true);
    assert.deepEqual(writes, ['ooc-output-length', 'ooc-suggestions-visible']);
    for (const [key, value] of original.filter(([key]) => !writes.includes(key))) assert.deepEqual(values.get(key), value, key);
  });
});
