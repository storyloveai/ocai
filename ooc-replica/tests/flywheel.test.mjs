import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML, DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));

test('flywheel card data is complete, bilingual, and points at real assets and routes', async () => {
  const {CHARACTER_CARDS, WORKS, UNIVERSES, FRAMEWORKS} = await import('../dist/assets/flywheel/cards-data.js');
  const {characterProfiles} = await import('../dist/assets/character-profiles.js');
  const chatIds = new Set(characterProfiles.map((c) => c.id));
  assert.ok(CHARACTER_CARDS.length >= 30, `expected 30+ cards, got ${CHARACTER_CARDS.length}`);
  const ids = new Set();
  for (const c of CHARACTER_CARDS) {
    assert.ok(!ids.has(c.id), `duplicate card id ${c.id}`);
    ids.add(c.id);
    for (const field of ['name', 'tagline', 'persona', 'locked']) {
      assert.ok(c[field]?.zh && c[field]?.en, `${c.id}.${field} must be bilingual`);
    }
    assert.ok(WORKS[c.source.work] && UNIVERSES[c.source.universe] && FRAMEWORKS[c.source.framework], `${c.id} references unknown work/universe/framework`);
    const portrait = join(dist, c.portrait.replace(/^\//, ''));
    await assert.doesNotReject(() => readFile(portrait), `${c.id} portrait missing: ${c.portrait}`);
    if (c.chat) assert.ok(chatIds.has(c.chat.split('/').pop()), `${c.id} chat target ${c.chat} is not in the chat whitelist`);
    for (const a of c.appearances) {
      assert.ok(a.url.startsWith('/'), `${c.id} appearance URL must be site-relative`);
      if (a.url.startsWith('/assets/')) {
        await assert.doesNotReject(() => readFile(join(dist, a.url.replace(/^\//, '').split('?')[0])), `${c.id} appearance target missing: ${a.url}`);
      }
    }
  }
  for (const w of Object.keys(WORKS)) {
    if (WORKS[w].cover) await assert.doesNotReject(() => readFile(join(dist, WORKS[w].cover.replace(/^\//, ''))), `work ${w} cover missing`);
    if (WORKS[w].url.startsWith('/assets/')) {
      await assert.doesNotReject(() => readFile(join(dist, WORKS[w].url.replace(/^\//, ''))), `work ${w} entry missing: ${WORKS[w].url}`);
    }
  }
});

test('flywheel pages work end to end on a single boot', async () => {
  const {document, window, values, go, location} = await boot();

  // —— 首页：动线 strip + 侧栏入口，且不破坏既有结构 ——
  const strip = document.querySelector('#fw-home-strip .fw-strip');
  assert.ok(strip, 'home strip mounts');
  assert.ok(document.querySelector('#fw-home-strip a[href="/characters"]'));
  assert.equal(document.querySelectorAll('#fw-home-strip .fw-strip-row').length, 4);
  for (const href of ['/characters', '/universe', '/frameworks', '/studio']) {
    assert.ok(document.querySelector(`[data-shrink] a[href="${href}"]`), `sidebar entry ${href} missing`);
  }
  go('/characters');
  assert.equal(location.pathname, '/characters');
  assert.ok(document.querySelector('[data-fw-page="characters"]'));
  assert.ok(document.querySelector('[data-fw-page="characters"]').hasAttribute('data-no-i18n'));
  assert.ok(document.querySelector('[data-fw-page="characters"] .fw-mobile-bar img'), 'mobile toolbar carries the brand logo');

  // —— 角色库：筛选 ——
  const {CHARACTER_CARDS, UNIVERSES} = await import('../dist/assets/flywheel/cards-data.js');
  assert.equal(document.querySelectorAll('[data-fw-page="characters"] .fw-card').length, CHARACTER_CARDS.length);
  document.querySelector('[data-fw-filter="xichuan"]').click();
  assert.equal(document.querySelectorAll('[data-fw-page="characters"] .fw-card').length, 5);
  assert.ok(document.querySelector('[data-fw-page="characters"]').textContent.includes('夏知遥'));
  document.querySelector('[data-fw-chat]').click();
  assert.equal(document.querySelectorAll('[data-fw-page="characters"] .fw-card').length, 0, 'no xichuan chat on main — empty state must show');
  assert.ok(document.querySelector('[data-fw-page="characters"] .fw-empty'));
  document.querySelector('[data-fw-filter="all"]').click();
  assert.equal(document.querySelectorAll('[data-fw-page="characters"] .fw-card').length, CHARACTER_CARDS.filter(c => c.chat).length, 'chat filter stays on across universe switches');
  const search = document.getElementById('fw-search');
  assert.ok(search, 'library search box renders');
  search.value = '一盏酒';
  search.dispatchEvent(new window.Event('input', {bubbles: true}));
  const hits = document.querySelectorAll('#fw-lib-results .fw-card').length;
  assert.ok(hits >= 1 && hits < CHARACTER_CARDS.filter(c => c.chat).length, `search narrows the grid (${hits} hits)`);
  search.value = '';
  search.dispatchEvent(new window.Event('input', {bubbles: true}));
  assert.equal(document.querySelectorAll('#fw-lib-results .fw-card').length, CHARACTER_CARDS.filter(c => c.chat).length, 'clearing search restores the filtered set');
  document.querySelector('[data-fw-chat]').click();
  assert.equal(document.querySelectorAll('[data-fw-page="characters"] .fw-card').length, CHARACTER_CARDS.length);

  // —— 角色档案 ——
  go('/characters/xc-zhiyao');
  let page = document.querySelector('[data-fw-page="profile"]');
  assert.ok(page, 'profile page renders');
  assert.ok(page.querySelector('h1').textContent.includes('夏知遥'));
  assert.ok(page.querySelectorAll('.fw-quote').length >= 2, 'voice samples render as quotes');
  const xichuanLink = [...page.querySelectorAll('.fw-appearance')].find(a => a.getAttribute('href') === '/assets/xichuan/index.html');
  assert.ok(xichuanLink, 'appearance links to the xichuan game');
  assert.equal(xichuanLink.getAttribute('target'), '_top', 'standalone game links leave the SPA');
  assert.equal(page.querySelector('.fw-ctas a[href="/assets/xichuan/index.html"]').getAttribute('target'), '_top');
  go('/characters');
  go('/characters/sg-caocao');
  page = document.querySelector('[data-fw-page="profile"]');
  assert.ok(page.querySelector('.fw-ctas a[href="/play/sgc-002"]'), 'sanguo chat CTA uses the whitelisted profile id');
  assert.ok(page.querySelector('.fw-quote'), 'sanguo opening line becomes a voice quote');
  assert.ok(page.querySelector('.fw-quote cite').textContent.includes('许都'), 'quote cites the scene');
  assert.ok(page.querySelectorAll('.fw-starters li').length >= 3, 'sanguo starters render as conversation topics');
  go('/characters');
  go('/characters/oc-shen-yanzhou');
  page = document.querySelector('[data-fw-page="profile"]');
  assert.ok(page.querySelectorAll('.fw-quote').length >= 1, 'original opening becomes a voice quote');
  const encounters = page.querySelectorAll('a[href*="encounter="]');
  assert.ok(encounters.length >= 2, 'original encounter links render');
  go('/characters');
  go('/characters/xc-zhiyao');
  page = document.querySelector('[data-fw-page="profile"]');
  const exprButtons = page.querySelectorAll('[data-fw-expr]');
  assert.equal(exprButtons.length, 6, 'zhiyao exposes six expressions');
  const mainImg = document.getElementById('fw-portrait-main');
  const beforeSrc = mainImg.getAttribute('src');
  exprButtons[2].click();
  assert.notEqual(document.getElementById('fw-portrait-main').getAttribute('src'), beforeSrc, 'clicking an expression swaps the portrait');
  assert.equal(exprButtons[2].getAttribute('aria-pressed'), 'true');
  go('/characters');
  go('/characters/wn-lamp');
  assert.equal(document.querySelectorAll('[data-fw-expr]').length, 0, 'single-expression characters render no switcher');

  // —— 宇宙 ——
  go('/universe');
  assert.equal(document.querySelectorAll('[data-fw-page="universes"] .fw-uni-card').length, Object.keys(UNIVERSES).length);
  go('/universe/westlin');
  page = document.querySelector('[data-fw-page="universe"]');
  assert.ok(page, 'westlin page renders');
  assert.equal(page.querySelector('[data-fw-pane="rules"]').hidden, false);
  assert.ok(/维斯特林|Westlin/.test(page.querySelector('[data-fw-pane="rules"]').textContent));
  page.querySelector('[data-fw-tab="timeline"]').click();
  assert.equal(page.querySelector('[data-fw-pane="rules"]').hidden, true);
  assert.equal(page.querySelector('[data-fw-pane="timeline"]').hidden, false);
  assert.ok(page.querySelectorAll('.fw-era').length >= 3);
  assert.ok(page.querySelectorAll('.fw-card').length >= 10, 'westlin lists its cast');
  go('/universe');
  go('/universe/xichuan');
  assert.ok(document.querySelector('[data-fw-page="universe"]'), 'universe without shared rules still renders');
  assert.ok(document.querySelector('[data-fw-tab="timeline"]'), 'xichuan now carries its own timeline');
  go('/universe');
  go('/universe/sanguo');
  assert.ok(document.querySelector('[data-fw-pane="rules"]').textContent.includes('子衡'), 'sanguo universe quotes the strategist premise');

  // —— 框架 ——
  go('/frameworks');
  page = document.querySelector('[data-fw-page="frameworks"]');
  assert.ok(page);
  assert.ok(page.querySelector('.fw-boss'), 'the boss analogy is quoted');
  assert.equal(page.querySelectorAll('.fw-pot').length, 4);
  for (const id of ['strategist', 'galgame', 'detective', 'chat']) {
    assert.ok(page.querySelector(`#fw-${id}`), `framework ${id} section missing`);
  }
  assert.equal(page.querySelectorAll('#fw-demo-out .fw-demo-col').length, 2);
  const before = document.querySelector('#fw-demo-out').textContent;
  document.querySelector('[data-fw-line="2"]').click();
  const after = document.querySelector('#fw-demo-out').textContent;
  assert.notEqual(before, after, 'picking another line changes the demo');

  // —— 工作台 ——
  go('/studio');
  page = () => document.querySelector('[data-fw-page="studio"]');
  assert.ok(page());
  assert.ok(/原型演示|Prototype/.test(page().textContent));
  document.getElementById('fw-f-zh').value = '夜航';
  document.getElementById('fw-f-persona').value = '修钟表的守夜人。';
  page().querySelector('[data-fw-wstep="1"]').click();
  assert.equal(document.querySelector('[data-fw-sstep="0"]').hidden, true, 'step 1 hides in place');
  assert.equal(document.getElementById('fw-f-zh').value, '夜航', 'input survives the step change');
  document.querySelector('[data-fw-save]').click();
  const stored = JSON.parse(values.get('sd-flywheel-drafts'));
  assert.equal(stored.length, 1);
  assert.equal(stored[0].name.zh, '夜航');
  assert.ok(document.querySelector('#fw-drafts:not([hidden])'), 'draft list appears after save');
  document.querySelector('[data-fw-stab="mix"]').click();
  assert.equal(document.querySelector('[data-fw-spane="mix"]').hidden, false);
  document.querySelector('[data-fw-mix]').click();
  document.querySelectorAll('[data-fw-mix]')[1].click();
  document.querySelector('[data-fw-mixgo]').click();
  assert.ok(document.querySelector('#fw-mix-out .fw-quote'), 'mix premise renders');
  assert.ok(document.querySelector('#fw-mix-out .fw-quote').textContent.includes('×'), 'the premise cites both cards');

  // —— 回主页：strip 仍在、SPA 正常 ——
  go('/');
  assert.equal(location.pathname, '/');
  assert.ok(document.querySelector('#fw-home-strip .fw-strip'), 'returning home keeps the strip');
});

async function boot() {
  const {document, window} = parseHTML(await readFile(join(dist, 'index.html'), 'utf8'));
  const values = new Map([['sd.lang', 'zh']]);
  const append = window.HTMLElement.prototype.append;
  window.HTMLElement.prototype.append = function (...nodes) { const result = append.apply(this, nodes); for (const node of nodes) if (node.tagName === 'LINK') queueMicrotask(() => node.onload?.()); return result; };
  const location = {href: 'https://replica.example/', pathname: '/', search: ''};
  window.history = {pushState(_s, _t, path) { const url = new URL(path, location.href); Object.assign(location, {href: url.href, pathname: url.pathname, search: url.search}); }, replaceState(){}};
  window.scrollTo = () => {};
  Object.assign(globalThis, {window, document, DOMParser, location, history: window.history, matchMedia: () => ({matches: true}), localStorage: {getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v)}, sessionStorage: {getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k)}, fetch: async path => new Response(await readFile(join(dist, path)), {headers: {'Content-Type': 'application/json'}})});
  await import('../dist/app.js');
  const go = path => { const event = new window.Event('click', {bubbles: true, cancelable: true}); event.button = 0; document.querySelector(`a[href="${path}"]`).dispatchEvent(event); };
  return {document, window, values, go, location};
}
