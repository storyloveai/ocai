import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML, DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setLang, startI18n} from '../dist/assets/site-i18n.js';
import {withVisitedTitle, VISITED_TITLES_KEY} from '../dist/assets/library-records.js';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

test('language switches translate library UI but preserve creator titles, identities and quoted messages', async () => {
  const {document, window} = parseHTML('<html><head><link href="/style.css"></head><body><main id="main"></main><dialog id="modal"></dialog></body></html>');
  const append = window.HTMLElement.prototype.append;
  window.HTMLElement.prototype.append = function (...nodes) {
    const result = append.apply(this, nodes);
    for (const node of nodes) if (node.tagName === 'LINK') queueMicrotask(() => node.onload?.());
    return result;
  };
  const language = new Map([['sd.lang', 'en']]);
  window.localStorage = {getItem: key => language.get(key) ?? null, setItem: (key, value) => language.set(key, value)};
  const location = {pathname: '/history', search: '', href: 'https://replica.example/history'};
  Object.assign(globalThis, {
    document, window, DOMParser, location, localStorage: window.localStorage, addEventListener: window.addEventListener.bind(window),
    matchMedia: () => ({matches: true}),
    fetch: async path => path === '/api/titles' ? Response.json({titles: [{id: 'u-public-title', type: 'story', title: 'Default', description: 'Profile', ownerName: 'Profile', image: '/public.png'}]}) : new Response(await readFile(join(dist, path)), {headers: {'Content-Type': 'application/json'}}),
  });
  const values = new Map([
    ['ooc-profile', {name: 'Profile',audience:'All',bio:'retained legacy biography'}],
    ['ooc-custom', [
      {id: 'draft-user-title', publishedId: 'u-user-title', status: 'published', type: 'story', title: 'Profile', description: 'Default', image: '/own.png', visibility: 'private'},
      {id: 'draft-not-published', status: 'draft', type: 'character', title: 'Default', description: 'Profile'},
    ]],
    ['ooc-history', ['u-user-title', 'u-visited-title', 'catalog-original', 'catalog-empty', 'catalog-game']],
    ['ooc-favorites', ['u-user-title', 'u-visited-title', 'catalog-original']],
    ['ooc-session-v2-u-user-title', [{role: 'assistant', text: 'Default'}]],
    ['ooc-session-v2-catalog-original', [{role: 'user', text: 'Profile'}]],
    ['ooc-session-v2-catalog-game', {'game.saved': true}],
    [VISITED_TITLES_KEY, withVisitedTitle(null, {id: 'u-visited-title', type: 'character', title: 'Profile', image: '/visited.png'})],
  ]);
  const original = structuredClone([...values]), writes = [];
  const account = {user: {uid: 'alice'}, providers: {google: true}, api: async () => ({balance: 0})};
  const h = {
    read: (key, fallback) => values.get(key) ?? fallback,
    save: (key, value) => {writes.push(key); values.set(key, value);},
    navigate() {}, show() {}, categories: [], account,
    data: ['catalog-original', 'catalog-empty', 'catalog-game'].map(id => ({id, type: 'story', title: 'Story', image: '/catalog.png'})),
  };
  const reference = await import('../dist/assets/reference.js');
  const community = await import('../dist/assets/community.js');
  startI18n({win: window, doc: document});
  const chooseLanguage = async lang => { setLang(lang, {win: window, doc: document}); await tick(); };
  const open = async path => { location.pathname = path; community.show(path, h); reference.syncAccount(account); await tick(); };

  await open('/history'); await chooseLanguage('zh');
  const listTitle = id => document.querySelector(`.library-items a[href="/play/${id}"] h2`).textContent;
  assert.equal(listTitle('u-user-title'), 'Profile');
  assert.equal(listTitle('u-visited-title'), 'Profile');
  assert.equal(listTitle('catalog-original'), '故事', 'known catalog title continues to use site translations');
  assert.equal(document.querySelector('.library-header h1').textContent, '历史');
  const sideRow = id => document.querySelector(`.shell-history-list a[href="/play/${id}"]`);
  assert.equal(sideRow('u-user-title').querySelector('strong').textContent, 'Profile');
  assert.equal(sideRow('u-user-title').querySelector('p').textContent, 'Default');
  assert.equal(sideRow('catalog-original').querySelector('p').textContent, 'Profile');
  assert.equal(sideRow('catalog-empty').querySelector('p').textContent, '继续故事');
  assert.equal(sideRow('catalog-empty').querySelector('p').hasAttribute('data-no-i18n'), false);
  assert.equal(sideRow('catalog-game').querySelector('p').hasAttribute('data-no-i18n'), false, 'game progress is system copy rather than a quoted message');
  assert.equal(document.querySelector('.shell-account [data-no-i18n]').textContent, 'Profile');
  await chooseLanguage('en');
  assert.equal(listTitle('catalog-original'), 'Story');
  assert.equal(listTitle('u-user-title'), 'Profile');
  assert.equal(sideRow('u-user-title').querySelector('p').textContent, 'Default');
  assert.equal(sideRow('catalog-empty').querySelector('p').textContent, 'Continue story');

  await open('/liked'); await chooseLanguage('zh');
  assert.equal(listTitle('u-user-title'), 'Profile');
  assert.equal(listTitle('u-visited-title'), 'Profile');
  await open('/my-title');
  assert.equal(document.querySelector('.library-header h1').textContent, '我的作品');
  const owned = document.querySelector('.library-items a[href="/builder/story/draft-user-title"]');
  const draft = document.querySelector('.library-items a[href="/builder/character/draft-not-published"]');
  assert.equal(owned.querySelector('h2').textContent, 'Profile');
  assert.equal(owned.querySelector('p').textContent, 'Default');
  assert.equal(owned.querySelector('small').textContent,'故事 · 已发布 · 私密 · 编辑');
  assert.equal(draft.querySelector('h2').textContent, 'Default');
  assert.equal(draft.querySelector('p').textContent, 'Profile');
  assert.equal(document.querySelector('[data-library-count]').textContent,'全部 2');
  const visibility=document.querySelector('.library-controls select[aria-label]');
  assert.deepEqual([...visibility.querySelectorAll('option')].map(option=>option.getAttribute('value')),['All','Published','Draft']);
  visibility.onchange({target:{value:'Published'}});
  assert.equal(document.querySelectorAll('.library-draft').length,1,'published filter works after Chinese labels');
  assert.match(document.querySelector('[data-library-edit]').getAttribute('aria-label'),/^编辑 Profile$/);
  await chooseLanguage('en');
  assert.equal(document.querySelector('[data-library-count]').textContent,'All 1');
  assert.equal(document.querySelector('.library-draft small').textContent,'Story · Published · Private · Edit');
  visibility.onchange({target:{value:'Draft'}});
  assert.equal(document.querySelectorAll('.library-draft').length,1);
  assert.equal(document.querySelector('.library-draft h2').textContent,'Default');
  assert.deepEqual([...document.querySelector('.library-controls select:last-child').querySelectorAll('option')].map(option=>option.getAttribute('value')),['Latest','Title A–Z']);
  visibility.onchange({target:{value:'All'}});
  await chooseLanguage('zh');
  assert.equal(owned.querySelector('h2').textContent, 'Profile');
  assert.equal(draft.querySelector('p').textContent, 'Profile');

  await open('/community'); await tick();
  const publicCard = document.querySelector('.community-card');
  assert.equal(document.querySelector('.library-header h1').textContent, '社区');
  assert.equal(publicCard.querySelector('h2').textContent, 'Default');
  assert.equal(publicCard.querySelector('p').textContent, 'Profile');
  assert.equal(publicCard.querySelector('small span[data-no-i18n]:not([data-library-copy])').textContent, 'Profile');
  await chooseLanguage('en'); await chooseLanguage('zh');
  assert.equal(publicCard.querySelector('h2').textContent, 'Default');
  assert.equal(publicCard.querySelector('small span[data-no-i18n]:not([data-library-copy])').textContent, 'Profile');

  await open('/profile');
  assert.equal(document.querySelector('.profile-identity strong').textContent, 'Profile');
  assert.equal(document.querySelector('.shell-footer a[href="/profile"]').textContent, '个人资料');
  assert.equal(document.querySelector('.profile-menu a[href="/profile/setting/chat"] span').textContent, '会话设置');
  await open('/profile/setting/personalization');
  const audience=document.querySelector('select[name="audience"]');
  assert.deepEqual([...audience.querySelectorAll('option')].map(option=>option.getAttribute('value')),['Male','Female','Neutral']);
  assert.equal(audience.value,'Neutral','legacy All preference displays the supported neutral value');
  assert.equal(audience.selectedOptions?.[0]?.textContent || audience.querySelector('option[selected]').textContent,'不限');
  assert.equal(document.querySelector('#profile-bio'),null,'unused biography editor is no longer advertised');
  assert.equal(document.querySelector('#profile-name').value,'Profile');
  await chooseLanguage('en');
  assert.equal(audience.value,'Neutral');
  assert.equal(document.querySelector('#profile-name').value,'Profile');
  assert.deepEqual([...values], original);
  assert.deepEqual(writes, []);
});
