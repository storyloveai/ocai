import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML, DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));

test('flywheel card data is complete, bilingual, and points at real assets and routes', async () => {
  const {CHARACTER_CARDS, WORKS, UNIVERSES, FRAMEWORKS} = await import('../dist/assets/flywheel/cards-data.js');
  const {storydateCharacters} = await import('../dist/assets/storydate-originals.js');
  const {roleFor} = await import('../server/roles.js');
  const chatIds = new Set(storydateCharacters.map((c) => c.id));
  assert.equal(CHARACTER_CARDS.length, 33);
  const ids = new Set();
  for (const c of CHARACTER_CARDS) {
    assert.ok(!ids.has(c.id), `duplicate card id ${c.id}`);
    ids.add(c.id);
    for (const field of ['name', 'tagline', 'persona', 'locked']) {
      assert.ok(c[field]?.zh && c[field]?.en, `${c.id}.${field} must be bilingual`);
    }
    for (const sample of c.voice?.samples || []) {
      assert.ok(sample.from?.zh && sample.from?.en, `${c.id} quote attribution must be bilingual`);
      assert.doesNotMatch(sample.from.en, /[\u4e00-\u9fff]/, `${c.id} English attribution must be translated`);
    }
    assert.ok(WORKS[c.source.work] && UNIVERSES[c.source.universe] && FRAMEWORKS[c.source.framework], `${c.id} references unknown work/universe/framework`);
    const portrait = join(dist, c.portrait.replace(/^\//, ''));
    await assert.doesNotReject(() => readFile(portrait), `${c.id} portrait missing: ${c.portrait}`);
    if (c.chat) {
      assert.ok(chatIds.has(c.chat.split('/').pop()), `${c.id} chat target ${c.chat} is not in the chat whitelist`);
      assert.equal(c.chatId, c.chat.split('/').pop(), `${c.id} retains its existing chat storage identity`);
      assert.equal(roleFor(c.chatId).mode, 'character', `${c.id} resolves to a real character role`);
    }
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
  const xichuan = CHARACTER_CARDS.filter(c => c.source.work === 'xichuan');
  assert.equal(xichuan.length, 5);
  assert.equal(WORKS.xichuan.url, '/play/xichuan');
  assert.ok(xichuan.every(c => c.appearances.every(a => a.url === '/play/xichuan')), 'every Xichuan appearance uses the account-aware host');
  assert.equal(xichuan.find(c => c.id === 'xc-zhiyao').chat, '/play/xc-zhiyao');
});

test('scene artwork uses existing empty settings for transparent sprites and preserves complete portraits', async () => {
  const {CHARACTER_CARDS} = await import('../dist/assets/flywheel/cards-data.js');
  const {CHARACTER_ART, characterArt} = await import('../dist/assets/flywheel/character-art.js');
  assert.deepEqual(Object.keys(CHARACTER_ART).sort(), CHARACTER_CARDS.map(card => card.id).sort());
  let scenes = 0, portraits = 0;
  for (const card of CHARACTER_CARDS) {
    const art = characterArt(card);
    assert.equal(characterArt(card.id), art, 'both supported inputs select the same artwork');
    if (['sanguo', 'character'].includes(card.source.work)) {
      assert.equal(art, null, `${card.id} already has a complete, opaque portrait`);
      portraits++;
    } else {
      assert.ok(art?.background, `${card.id} transparent sprite needs its approved scene`);
      assert.ok(art.background.startsWith('/assets/'));
      assert.match(art.background, /\/(bg|background)\//, 'the backdrop comes from a scene collection, not a character CG');
      const bytes = await readFile(join(dist, art.background.replace(/^\//, '')));
      assert.ok(bytes.length > 100, `${card.id} scene is a real deployed image`);
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
      scenes++;
    }
  }
  assert.equal(scenes, 21);
  assert.equal(portraits, 12);
  assert.equal(characterArt('unknown-character'), null);
  assert.equal(characterArt(null), null);
});

test('character discovery stays useful without duplicate navigation or demo editors', async (t) => {
  const {document, window, values, writes, go, setLang, storageState, navigations, requests} = await boot();
  const {CHARACTER_CARDS, UNIVERSES} = await import('../dist/assets/flywheel/cards-data.js');
  const page = kind => document.querySelector(`[data-fw-page="${kind}"]`);
  const input = value => {
    const search = document.getElementById('fw-search');
    search.value = value;
    search.focus();
    search.dispatchEvent(new window.Event('input', {bubbles: true}));
    assert.equal(document.getElementById('fw-search'), search, 'typing keeps the same input node');
    assert.equal(document.activeElement, search, 'typing keeps keyboard focus');
  };
  const language = lang => setLang(lang, {win: globalThis, doc: document});

  await t.test('home offers one character discovery action and one canonical sidebar entry', () => {
    const strip = document.querySelector('#fw-home-strip .fw-strip');
    assert.ok(strip);
    assert.equal(strip.querySelectorAll('.fw-strip-row').length, 4);
    assert.equal(strip.querySelectorAll('.fw-btn:not(.fw-btn-secondary)').length, 1, 'one primary action');
    assert.ok(strip.querySelector('a[href="/characters"]'));
    assert.equal(document.querySelectorAll('[data-shrink] a[href="/characters"]').length, 1, 'existing Character entry uses the canonical library');
    assert.equal(document.querySelector('[data-shrink] a[href="/character"]'), null);
    assert.equal(document.querySelectorAll('[data-shell-flywheel]').length, 0);
    for (const href of ['/universe', '/frameworks', '/studio']) {
      assert.equal(document.querySelector(`[data-shrink] a[href="${href}"]`), null, `no duplicate sidebar entry ${href}`);
    }
  });

  await t.test('the restored Diaochan feature sends chosen and typed replies to her existing chat without API calls', () => {
    go('/characters');
    const feature = () => page('characters').querySelector('[data-sd-hero="character"]');
    const apiBefore = requests.filter(path => path.startsWith('/api/'));
    const assertFeature = lang => {
      const hero = feature();
      assert.equal(page('characters').querySelectorAll('[data-sd-hero="character"]').length, 1);
      assert.equal(hero.querySelector('.sd-hero-figure').getAttribute('src'), '/assets/originals/sg-007.webp');
      assert.ok(hero.querySelector('.sd-hero-fade'));
      assert.equal(hero.querySelector('.sd-hero-name').textContent, lang === 'zh' ? '貂蝉' : 'Diaochan');
      assert.equal(hero.querySelectorAll('[data-hero-choice]').length, 2);
      assert.ok(hero.querySelector('[data-hero-form] input'));
      assert.ok(hero.querySelector('[data-hero-form] button[type="submit"]'));
      return hero;
    };
    const assertDestination = say => {
      const url = new URL(navigations.at(-1), location.href);
      assert.equal(url.pathname, '/play/sgc-007', 'the feature reuses Diaochan’s established chat and storage identity');
      assert.equal(url.searchParams.get('say'), say);
      assert.deepEqual([...url.searchParams.keys()], ['say']);
    };
    const choose = (lang, index = 0) => {
      const button = assertFeature(lang).querySelector(`[data-hero-choice="${index}"]`);
      const reply = button.querySelector('.sd-hero-choice-label').textContent;
      const before = navigations.length;
      button.click();
      assert.equal(navigations.length, before + 1, 'each recommendation has one bound navigation');
      assertDestination(reply);
    };
    const submit = (lang, reply) => {
      const hero = assertFeature(lang);
      hero.querySelector('input').value = '  ' + reply + '  ';
      const before = navigations.length;
      const event = new window.Event('submit', {bubbles: true, cancelable: true});
      hero.querySelector('[data-hero-form]').dispatchEvent(event);
      assert.equal(event.defaultPrevented, true);
      assert.equal(navigations.length, before + 1);
      assertDestination(reply);
    };
    choose('zh');
    submit('zh', '我想听你的故事，貂蝉。 & 然后呢？');
    assert.equal(page('characters').querySelectorAll('.fw-card').length, CHARACTER_CARDS.length);
    const unfinishedZh = '  还没说完：那张旧票根 & 后来的事……  ';
    feature().querySelector('input').value = unfinishedZh;
    document.querySelector('[data-fw-filter="xichuan"]').click();
    assert.equal(page('characters').querySelectorAll('.fw-card').length, 5);
    assert.equal(assertFeature('zh').querySelector('input').value, unfinishedZh, 'filtering preserves the unfinished reply exactly');
    choose('zh', 1);
    input('夏知遥');
    assert.equal(page('characters').querySelectorAll('.fw-card').length, 1);
    assert.equal(feature().querySelector('input').value, unfinishedZh, 'searching the directory leaves the separate hero draft intact');
    language('en');
    assert.equal(document.getElementById('fw-search').value, '夏知遥');
    assert.equal(page('characters').querySelectorAll('.fw-card').length, 1);
    assert.equal(assertFeature('en').querySelector('input').value, unfinishedZh, 'changing language preserves typed words without translating or trimming them');
    choose('en');
    submit('en', 'What would you choose? & why?');
    const unfinishedEn = '  A half-written reply: what if… & why?  ';
    feature().querySelector('input').value = unfinishedEn;
    input('');
    document.querySelector('[data-fw-filter="all"]').click();
    assert.equal(page('characters').querySelectorAll('.fw-card').length, CHARACTER_CARDS.length);
    assert.equal(assertFeature('en').querySelector('input').value, unfinishedEn);
    choose('en', 1);
    language('zh');
    assert.equal(assertFeature('zh').querySelector('input').value, unfinishedEn, 'switching back also retains the unsent draft');
    choose('zh');
    assert.equal(page('characters').querySelectorAll('.fw-card').length, CHARACTER_CARDS.length);
    assert.deepEqual(requests.filter(path => path.startsWith('/api/')), apiBefore, 'hero actions only hand off navigation, without model or payment operations');
    assert.equal(writes.some(([key]) => key.startsWith('ooc-session-v2-')), false, 'hero interactions do not open or rewrite a chat session');
  });

  await t.test('directory names stay below their artwork and only transparent portraits receive separate scene layers', async () => {
    const {characterArt} = await import('../dist/assets/flywheel/character-art.js');
    go('/characters');
    for (const card of CHARACTER_CARDS) {
      const node = page('characters').querySelector(`.fw-card[href="/characters/${card.id}"]`);
      const portrait = node.querySelector('.fw-card-portrait'), body = node.querySelector('.fw-card-body');
      assert.equal(portrait.nextElementSibling, body, `${card.id} readable information follows the image`);
      assert.equal(portrait.querySelector('.fw-card-name'), null);
      assert.equal(body.querySelector('.fw-card-name').textContent, card.name.zh);
      assert.ok(body.querySelector('.fw-card-badges').textContent.trim(), 'source remains visible outside the image');
      const background = portrait.querySelector('.fw-scene-background');
      const foreground = [...portrait.querySelectorAll('img')].find(img => !img.classList.contains('fw-scene-background'));
      assert.equal(foreground.getAttribute('src'), card.portrait);
      assert.ok(foreground.nextElementSibling.classList.contains('fw-art-fallback'), 'image fallback remains attached to the foreground');
      if (characterArt(card)) {
        assert.equal(background.getAttribute('src'), characterArt(card).background);
        assert.equal(background.nextElementSibling, foreground, 'the sprite remains separate from its scenery');
        assert.equal(background.getAttribute('alt'), '');
      } else assert.equal(background, null, `${card.id} retains its complete original image`);
    }
    for (const card of CHARACTER_CARDS) {
      go('/characters/' + card.id);
      const scene = page('profile').querySelector('.fw-profile-scene');
      const background = scene.querySelector('.fw-scene-background');
      if (characterArt(card)) assert.equal(background.getAttribute('src'), characterArt(card).background);
      else assert.equal(background, null, `${card.id} profile also preserves its complete portrait`);
    }
    go('/characters');
  });

  await t.test('library filters, empty states and bilingual search work without losing focus', () => {
    go('/characters');
    const assertCharacterNavigation = () => {
      assert.equal(document.querySelectorAll('[data-shrink] a[href="/characters"][aria-current="page"]').length, 1, 'the canonical Character entry stays selected exactly once');
      assert.equal(document.querySelectorAll('[data-shrink] a[href="/"][aria-current="page"]').length, 0);
    };
    assertCharacterNavigation();
    assert.ok(page('characters').hasAttribute('data-no-i18n'));
    assert.ok(page('characters').querySelector('.fw-mobile-bar img'));
    for (const href of ['/characters', '/universe', '/builder']) {
      assert.ok(page('characters').querySelector(`.fw-nav a[href="${href}"]`));
    }
    assert.equal(page('characters').querySelectorAll('.fw-card').length, CHARACTER_CARDS.length);
    document.querySelector('[data-fw-filter="xichuan"]').click();
    assertCharacterNavigation();
    assert.equal(page('characters').querySelectorAll('.fw-card').length, 5);
    document.querySelector('[data-fw-chat]').click();
    assertCharacterNavigation();
    assert.equal(page('characters').querySelectorAll('.fw-card').length, 1, 'only the established Xia Zhiyao chat is available');
    assert.ok(page('characters').querySelector('.fw-card[href="/characters/xc-zhiyao"]'));
    document.querySelector('[data-fw-filter="all"]').click();
    assert.equal(page('characters').querySelectorAll('.fw-card').length, CHARACTER_CARDS.filter(c => c.chat).length);
    input('一盏酒');
    assert.equal(document.querySelectorAll('#fw-lib-results .fw-card').length, 1);
    language('en');
    assertCharacterNavigation();
    assert.equal(document.getElementById('fw-search').value, '一盏酒', 'language change preserves the query');
    assert.equal(document.querySelectorAll('#fw-lib-results .fw-card').length, 1, 'Chinese query still works in English');
    input('Cao Cao');
    language('zh');
    assert.equal(document.querySelectorAll('#fw-lib-results .fw-card').length, 1, 'English name works in Chinese');
    input('no-such-character-123');
    assert.ok(document.querySelector('#fw-lib-results .fw-empty'));
    input('');
    document.querySelector('[data-fw-chat]').click();
    assert.equal(page('characters').querySelectorAll('.fw-card').length, CHARACTER_CARDS.length);
  });

  await t.test('profiles preserve real entry points and expose details only on request', () => {
    go('/characters/xc-zhiyao');
    let profile = page('profile');
    assert.ok(profile.querySelector('h1').textContent.includes('夏知遥'));
    assert.ok(profile.querySelectorAll('.fw-quote').length >= 2);
    assert.ok(profile.querySelector('.fw-quote cite').textContent.trim());
    assert.ok(profile.querySelector('details.fw-details'));
    assert.equal(profile.querySelector('details.fw-details').hasAttribute('open'), false);
    const story = profile.querySelector('.fw-ctas a[href="/play/xichuan"]');
    assert.ok(story);
    assert.equal(story.getAttribute('target'), null, 'Xichuan enters the shared account-aware host');
    assert.ok(profile.querySelector('.fw-ctas a[href="/play/xc-zhiyao"]'));
    let expressions = profile.querySelectorAll('[data-fw-expr]');
    assert.equal(expressions.length, 6);
    for (const button of expressions) {
      assert.ok(button.getAttribute('aria-label'));
      assert.ok(!/^(normal|smile|shy|sad|angry|surprised)$/.test(button.getAttribute('aria-label')), 'Chinese expression labels are localized');
    }
    const before = document.getElementById('fw-portrait-main').getAttribute('src');
    const scene = profile.querySelector('.fw-profile-scene .fw-scene-background');
    const background = scene.getAttribute('src');
    expressions[2].click();
    assert.notEqual(document.getElementById('fw-portrait-main').getAttribute('src'), before);
    assert.equal(expressions[2].getAttribute('aria-pressed'), 'true');
    assert.equal([...expressions].filter(b => b.getAttribute('aria-pressed') === 'true').length, 1);
    assert.equal(profile.querySelector('.fw-profile-scene .fw-scene-background'), scene, 'expression changes preserve the independently mounted scene');
    assert.equal(scene.getAttribute('src'), background);
    assert.equal(scene.nextElementSibling.id, 'fw-portrait-main');
    language('en');
    profile = page('profile');
    assert.ok(profile.querySelector('h1').textContent.includes('Zhiyao'));
    expressions = profile.querySelectorAll('[data-fw-expr]');
    assert.ok([...expressions].every(b => !/[\u4e00-\u9fff]/.test(b.getAttribute('aria-label'))));
    go('/characters/sg-caocao');
    profile = page('profile');
    assert.ok(profile.querySelector('.fw-ctas a[href="/play/sgc-002"]'));
    assert.ok(profile.querySelector('.fw-quote cite'));
    assert.ok(profile.querySelectorAll('.fw-starters li').length >= 3);
    go('/characters/oc-shen-yanzhou');
    assert.ok(page('profile').querySelectorAll('a[href*="encounter="]').length >= 2);
    go('/characters/wn-lamp');
    assert.equal(page('profile').querySelectorAll('[data-fw-expr]').length, 0);
  });

  await t.test('world tabs have linked panels, visibility and keyboard navigation', () => {
    go('/universe');
    assert.equal(page('universes').querySelectorAll('.fw-uni-card').length, Object.keys(UNIVERSES).length);
    go('/universe/westlin');
    const world = page('universe');
    const tabs = [...world.querySelectorAll('[data-fw-tab]')];
    assert.equal(tabs.length, 4);
    for (const tab of tabs) {
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      assert.ok(panel, 'tab controls an existing panel');
      assert.equal(panel.getAttribute('role'), 'tabpanel');
      assert.equal(panel.getAttribute('aria-labelledby'), tab.id);
    }
    const assertSelected = index => {
      tabs.forEach((tab, i) => {
        assert.equal(tab.getAttribute('aria-selected'), String(i === index));
        assert.equal(tab.getAttribute('tabindex'), i === index ? '0' : '-1');
        assert.equal(document.getElementById(tab.getAttribute('aria-controls')).hidden, i !== index);
      });
    };
    assertSelected(0);
    tabs[3].click();
    assertSelected(3);
    assert.ok(world.querySelectorAll('.fw-era').length >= 3);
    const key = key => {
      const event = new window.Event('keydown', {bubbles: true, cancelable: true});
      event.key = key;
      document.activeElement.dispatchEvent(event);
    };
    tabs[3].focus();
    key('ArrowRight'); assertSelected(0);
    key('End'); assertSelected(3);
    key('Home'); assertSelected(0);
    key('ArrowLeft'); assertSelected(3);
    go('/universe/xichuan');
    assert.ok(page('universe').querySelector('[data-fw-tab="timeline"]'));
    go('/universe/sanguo');
    assert.match(page('universe').querySelector('[data-fw-pane="rules"]').textContent, /子衡|Ziheng/);
  });

  await t.test('play guide describes real modes without fake response simulations', () => {
    go('/frameworks');
    const guide = page('frameworks');
    assert.ok(guide);
    for (const id of ['strategist', 'galgame', 'detective', 'chat']) {
      const section = guide.querySelector(`#fw-${id}`);
      assert.ok(section);
      assert.ok(section.querySelector('a[href^="/"]'), 'mode links to real content');
    }
    assert.equal(guide.querySelector('.fw-boss,.fw-pot,.fw-demo,[data-fw-line]'), null);
    assert.ok(!/the boss|厨房|食材|锅|阶段二/i.test(guide.textContent));
  });

  await t.test('creation reuses the existing workshop and preserves old drafts read-only', async () => {
    const key = 'sd-flywheel-drafts';
    const raw = JSON.stringify([{name: {zh: '夜航', en: 'Night Watch'}, persona: '修钟表的守夜人。', auth: 2, savedAt: '2026-11-16T00:00:00.000Z'}]);
    values.set(key, raw);
    go('/studio');
    let studio = page('studio');
    assert.ok(studio.querySelector('a[href="/builder"]'));
    assert.equal(studio.querySelector('form,input,textarea,select,[data-fw-save],[data-fw-edit],[data-fw-del],[data-fw-mix]'), null);
    assert.ok(studio.querySelector('#fw-drafts'));
    assert.ok(studio.textContent.includes('Night Watch') || studio.textContent.includes('夜航'));
    const exportButton = studio.querySelector('[data-fw-export]');
    assert.ok(exportButton);
    let exported;
    const createObjectURL = URL.createObjectURL;
    const revokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = blob => { exported = blob; return 'blob:legacy-drafts'; };
    URL.revokeObjectURL = () => {};
    try {
      exportButton.click();
      assert.ok(exported instanceof Blob, 'download contains a real JSON file');
      assert.deepEqual(JSON.parse(await exported.text()), JSON.parse(raw), 'export preserves every legacy draft field');
    } finally {
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = revokeObjectURL;
    }
    language('zh');
    go('/characters'); go('/studio');
    assert.equal(values.get(key), raw, 'navigation and localization never rewrite legacy data');
    assert.equal(writes.filter(([k]) => k === key).length, 0);
    values.set(key, '{bad json');
    go('/studio');
    assert.ok(page('studio').querySelector('.fw-local-notice'), 'corrupt data reports a readable recovery notice');
    assert.equal(values.get(key), '{bad json', 'corrupt data remains recoverable');
    values.set(key, raw);
    storageState.denied = true;
    go('/studio');
    studio = page('studio');
    assert.ok(studio.querySelector('.fw-local-notice'), 'unavailable storage is not presented as an empty successful save');
    assert.equal(values.get(key), raw);
    storageState.denied = false;
    go('/');
    assert.ok(document.querySelector('#fw-home-strip .fw-strip'));
    go('/characters'); // Stops the home carousel interval before the test process exits.
  });
});

async function boot() {
  const {document, window} = parseHTML(await readFile(join(dist, 'index.html'), 'utf8'));
  const values = new Map([['sd.lang', 'zh']]);
  const writes = [];
  const navigations = [], requests = [];
  const storageState = {denied: false};
  const append = window.HTMLElement.prototype.append;
  window.HTMLElement.prototype.append = function (...nodes) { const result = append.apply(this, nodes); for (const node of nodes) if (node.tagName === 'LINK') queueMicrotask(() => node.onload?.()); return result; };
  Object.defineProperty(document, 'activeElement', {configurable: true, writable: true, value: null});
  window.HTMLElement.prototype.focus = function () { document.activeElement = this; };
  const location = {href: 'https://replica.example/', pathname: '/', search: ''};
  const setLocation = path => { const url = new URL(path, location.href); Object.assign(location, {href: url.href, pathname: url.pathname, search: url.search}); };
  window.history = {pushState(_s, _t, path) { setLocation(path); }, replaceState(){}};
  window.scrollTo = () => {};
  Object.assign(globalThis, {
    window, document, DOMParser, location, history: window.history, CustomEvent: window.CustomEvent,
    addEventListener: window.addEventListener.bind(window), dispatchEvent: window.dispatchEvent.bind(window),
    matchMedia: () => ({matches: true}),
    localStorage: {getItem: k => { if (k === 'sd-flywheel-drafts' && storageState.denied) throw new Error('storage denied'); return values.get(k) ?? null; }, setItem: (k, v) => { writes.push([k, v]); values.set(k, v); }},
    sessionStorage: {getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k)},
    fetch: async path => { requests.push(String(path)); return new Response(await readFile(join(dist, path)), {headers: {'Content-Type': 'application/json'}}); },
  });
  await import('../dist/app.js');
  const {show} = await import('../dist/assets/flywheel/flywheel.js');
  const {setLang} = await import('../dist/assets/site-i18n.js');
  const data = JSON.parse(await readFile(join(dist, 'data.json'), 'utf8'));
  const helpers = {data, categories: [], read: (key, fallback) => { try { return JSON.parse(values.get(key)) ?? fallback; } catch { return fallback; } }, save: (key, value) => values.set(key, JSON.stringify(value)), show: () => {}, navigate: path => navigations.push(path)};
  const go = path => { setLocation(path); assert.ok(show(location.pathname, helpers), `route ${path} is handled`); };
  return {document, window, values, writes, storageState, go, setLang, navigations, requests};
}
