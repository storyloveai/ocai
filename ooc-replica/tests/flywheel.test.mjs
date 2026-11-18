import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML, DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHistory} from './fixtures/character-loop-dom.mjs';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));

test('detail stages and secondary story covers follow the same responsive layout contract', async () => {
  const {document} = parseHTML('<html><head></head><body></body></html>');
  async function rules(file) {
    const sheet = document.createElement('style');
    sheet.textContent = await readFile(join(dist, 'assets', file), 'utf8');
    document.head.append(sheet);
    return Array.from(sheet.sheet.cssRules);
  }
  const media = (list, query) => list.find(rule => rule.media?.mediaText === query).cssRules;
  const value = (list, selector, prop) => Array.from(list).find(rule => rule.selectorText === selector).style.getPropertyValue(prop).replace(/\s*,\s*/g, ',');
  const [stages, character] = await Promise.all([rules('story-surfaces.css'), rules('flywheel/flywheel.css')]);
  const selectedPill = 'body[data-reference=true] .fw-page .fw-chip[aria-pressed=true]';
  for (const [property, expected] of [['background', '#303033'], ['color', '#fafafa'], ['border-color', '#d4a853'], ['box-shadow', '0 0 0 1px #d4a853']]) {
    assert.equal(value(stages, selectedPill, property), expected);
  }
  assert.equal(value(character, '.fw-filter-bar.native-carousel', 'overflow-x'), 'auto');
  assert.equal(value(character, '.fw-filter-bar .fw-chip', 'white-space'), 'nowrap');
  assert.equal(value(stages, '.sd-card-quote', 'padding'), '28px 12px 12px');
  assert.equal(value(stages, '.sd-card-quote', 'font-size'), '12px');
  assert.equal(value(stages, '.sd-card-quote', 'line-height'), '1.45');
  assert.equal(value(stages, '.sd-card-quote > span,.sd-card-meta', '-webkit-line-clamp'), '2');
  const tablet = media(stages, '(min-width: 768px) and (max-width: 1023px)');
  const phone = media(stages, '(max-width: 767px)');
  assert.equal(value(stages, '.sd-stage-layout', 'grid-template-columns'), '340px minmax(0,1fr)');
  assert.equal(value(stages, '.sd-stage-layout', 'min-height'), '440px');
  assert.equal(value(tablet, '.sd-stage-layout', 'grid-template-columns'), '260px minmax(0,1fr)');
  assert.equal(value(phone, '.sd-stage-layout', 'grid-template-columns'), 'minmax(0,1fr)');
  assert.equal(value(phone, '.sd-stage-art', 'height'), 'clamp(260px,66vw,300px)');
  assert.equal(value(character, '.fw-story-card', 'grid-template-columns'), '72px minmax(0,1fr) auto');
  const phoneCharacter = media(character, '(max-width: 767px)');
  assert.equal(value(phoneCharacter, '.fw-story-card', 'grid-template-columns'), '64px minmax(0,1fr)');
  assert.equal(value(character, '.fw-conversation-input', 'grid-template-columns'), 'minmax(0,1fr) auto');
  assert.equal(value(phoneCharacter, '.fw-conversation-input', 'grid-template-columns'), 'minmax(0,1fr)');
  assert.equal(value(phoneCharacter, '.fw-conversation-input', 'gap'), '10px');
  assert.equal(value(character, '.fw-conversation-input input', 'width'), '100%');
  assert.equal(value(phoneCharacter, 'body[data-reference=true] .fw-chat-dock .fw-conversation-input .fw-btn[data-fw-chat-entry]', 'width'), '100%');
  assert.equal(value(phoneCharacter, '.fw-chat-dock [data-fw-starter]', 'padding'), '8px 12px');
  assert.equal(value(character, '.fw-chat-dock [data-fw-starter]', 'border-radius'), '999px');
  assert.equal(value(phoneCharacter, '.fw-chat-dock [data-fw-starter]', 'border-radius'), '10px');
});

test('flywheel card data is complete, bilingual, and points at real assets and routes', async () => {
  const {CHARACTER_CARDS, FEATURED_CHARACTER_CARDS, WORKS, UNIVERSES, FRAMEWORKS} = await import('../dist/assets/flywheel/cards-data.js');
  const {storydateCharacters} = await import('../dist/assets/storydate-originals.js');
  const {roleFor} = await import('../server/roles.js');
  const chatIds = new Set(storydateCharacters.map((c) => c.id));
  const publicIds = [
    'xc-zhiyao', 'xc-shencheng', 'xc-jibai',
    'sg-caocao', 'sg-zhuge', 'sg-wenzhi', 'sg-liubei', 'sg-guanyu', 'sg-zhaoyun', 'sg-zhouyu', 'sg-lvbu', 'sg-diaochan',
    'oc-shen-yanzhou', 'oc-lu-wensheng', 'oc-lin-zhaowan', 'wn-lamp', 'wn-evelyn', 'bk-holmes',
  ];
  assert.deepEqual(FEATURED_CHARACTER_CARDS.map(card => card.id).sort(), publicIds.sort());
  assert.equal(FEATURED_CHARACTER_CARDS.filter(card => card.chat).length, 13);
  assert.deepEqual(FEATURED_CHARACTER_CARDS.filter(card => !card.chat).map(card => card.id).sort(),
    ['bk-holmes', 'wn-evelyn', 'wn-lamp', 'xc-jibai', 'xc-shencheng']);
  assert.equal(CHARACTER_CARDS.length, 33, 'old direct profile URLs retain their source records');
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
  const {document, window, values, writes, go, setLang, storageState, navigations, requests, helpers} = await boot();
  const {CHARACTER_CARDS, FEATURED_CHARACTER_CARDS, characterCardQuote, characterCardMeta} = await import('../dist/assets/flywheel/cards-data.js');
  const page = kind => document.querySelector(`[data-fw-page="${kind}"]`);
  const language = lang => setLang(lang, {win: globalThis, doc: document});
  const pill = key => document.querySelector(key === 'chat' ? '.fw-filter-bar [data-fw-chat]' : `.fw-filter-bar [data-fw-world="${key}"]`);
  const selectStory = key => pill(key).click();
  const listed = () => [...page('characters').querySelectorAll('.fw-card')].map(node => node.getAttribute('href').split('/').pop());

  await t.test('home retains its canonical character entry without an extra world strip or role navigation', () => {
    assert.equal(document.querySelector('#fw-home-strip'), null);
    assert.equal(document.querySelector('.fw-strip-row'), null);
    assert.equal(document.querySelector('.fw-nav'), null);
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
      assert.equal(feature().querySelector('input').value, '', 'choosing a recommendation consumes the directory copy of the draft');
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
      assert.equal(feature().querySelector('input').value, '', 'submitting a reply clears the directory copy after handing it to chat');
    };
    choose('zh');
    submit('zh', '我想听你的故事，貂蝉。 & 然后呢？');
    assert.equal(page('characters').querySelectorAll('.fw-card').length, FEATURED_CHARACTER_CARDS.length);
    const unfinishedZh = '  还没说完：那张旧票根 & 后来的事……  ';
    feature().querySelector('input').value = unfinishedZh;
    const directory = location.pathname + location.search + location.hash;
    go('/characters/xc-zhiyao'); go(directory);
    assert.equal(feature().querySelector('input').value, unfinishedZh, 'ordinary profile browsing preserves an unsent directory draft');
    selectStory('xichuan');
    assert.equal(page('characters').querySelectorAll('.fw-card').length, 3);
    assert.equal(assertFeature('zh').querySelector('input').value, unfinishedZh, 'filtering preserves the unfinished reply exactly');
    choose('zh', 1);
    feature().querySelector('input').value = unfinishedZh;
    selectStory('baker');
    assert.equal(page('characters').querySelectorAll('.fw-card').length, 1);
    assert.equal(feature().querySelector('input').value, unfinishedZh, 'switching worlds preserves the separate hero draft');
    const activeReply = feature().querySelector('input'); activeReply.focus(); activeReply.setSelectionRange(3, 9, 'forward');
    language('en');
    assert.equal(pill('baker').getAttribute('aria-pressed'), 'true');
    assert.equal(page('characters').querySelectorAll('.fw-card').length, 1);
    assert.equal(assertFeature('en').querySelector('input').value, unfinishedZh, 'changing language preserves typed words without translating or trimming them');
    assert.ok(document.activeElement === feature().querySelector('input'), 'language changes restore the focused hero draft');
    assert.equal(document.activeElement.selectionStart, 3); assert.equal(document.activeElement.selectionEnd, 9);
    choose('en');
    submit('en', 'What would you choose? & why?');
    const unfinishedEn = '  A half-written reply: what if… & why?  ';
    feature().querySelector('input').value = unfinishedEn;
    selectStory('all');
    assert.equal(page('characters').querySelectorAll('.fw-card').length, FEATURED_CHARACTER_CARDS.length);
    assert.equal(assertFeature('en').querySelector('input').value, unfinishedEn);
    choose('en', 1);
    language('zh');
    assert.equal(assertFeature('zh').querySelector('input').value, '', 'a consumed draft does not return on a later repaint');
    go('/characters/xc-zhiyao'); go('/characters');
    assert.equal(feature().querySelector('input').value, '', 'returning from ordinary browsing after handoff does not resurrect the old reply');
    choose('zh');
    assert.equal(page('characters').querySelectorAll('.fw-card').length, FEATURED_CHARACTER_CARDS.length);
    assert.deepEqual(requests.filter(path => path.startsWith('/api/')), apiBefore, 'hero actions only hand off navigation, without model or payment operations');
    assert.equal(writes.some(([key]) => key.startsWith('ooc-session-v2-')), false, 'hero interactions do not open or rewrite a chat session');
  });

  await t.test('directory names stay below their artwork and only transparent portraits receive separate scene layers', async () => {
    const {characterArt} = await import('../dist/assets/flywheel/character-art.js');
    go('/characters');
    for (const lang of ['en', 'zh']) {
      language(lang);
      for (const card of FEATURED_CHARACTER_CARDS) {
        const node = page('characters').querySelector(`.fw-card[href="/characters/${card.id}"]`);
        const portrait = node.querySelector('.fw-card-portrait'), body = node.querySelector('.fw-card-body');
        assert.equal(portrait.nextElementSibling, body, `${card.id} readable information follows the image`);
        assert.equal(portrait.querySelector('.fw-card-name'), null);
        assert.equal(body.querySelector('strong.fw-card-name').textContent, card.name[lang]);
        const badge = portrait.querySelector('.sd-capability');
        assert.equal(node.querySelectorAll('.sd-capability').length, 1);
        assert.equal(badge.classList.contains('is-chat'), Boolean(card.chat));
        assert.equal(badge.textContent.trim(), card.chat ? (lang === 'en' ? 'Chat available' : '可聊天') : (lang === 'en' ? 'In the story' : '故事主角'));
        assert.equal(portrait.querySelector('.sd-card-quote > span').textContent, characterCardQuote(card, lang));
        assert.equal(body.querySelector('.sd-card-meta').textContent, characterCardMeta(card, lang));
        assert.equal(body.children.length, 2, 'the caption has only a name and a source/identity line');
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
    }
    const shen = FEATURED_CHARACTER_CARDS.find(card => card.id === 'xc-shencheng');
    assert.equal(characterCardQuote(shen, 'zh'), '七年。');
    assert.equal(characterCardQuote(shen, 'en'), 'Seven years.');
    const withoutSample = FEATURED_CHARACTER_CARDS.find(card => !card.voice?.samples?.length);
    assert.equal(characterCardQuote(withoutSample, 'zh'), withoutSample.tagline.zh);
    for (const card of CHARACTER_CARDS) {
      go('/characters/' + card.id);
      const scene = page('profile').querySelector('.fw-profile-scene');
      const background = scene.querySelector('.fw-scene-background');
      if (characterArt(card)) assert.equal(background.getAttribute('src'), characterArt(card).background);
      else assert.equal(background, null, `${card.id} profile also preserves its complete portrait`);
    }
    go('/characters');
  });

  await t.test('one bilingual world pill bar filters the public cast and keeps the shell navigation selected', () => {
    const filters = [
      ['all', '全部', 'All', 18], ['chat', '可聊天', 'Chat available', 13],
      ['xichuan', '汐川的第七个春天', 'The Seventh Spring of Xichuan', 3], ['sanguo', '三国·谋士', 'The Strategist', 9],
      ['original', '原创相遇', 'StoryDate Originals', 3], ['westlin', '灰烬王冠', 'The Ashen Crown', 2], ['baker', '贝克街', 'Baker Street', 1],
    ];
    go('/characters');
    for (const lang of ['zh', 'en']) {
      language(lang);
      const library = page('characters');
      assert.ok(library.hasAttribute('data-no-i18n'));
      assert.ok(library.querySelector('.fw-mobile-bar img'));
      assert.equal(library.querySelector('.fw-nav, #fw-search, select, .fw-library-heading'), null);
      const buttons = [...library.querySelectorAll('.fw-filter-bar button')];
      assert.deepEqual(buttons.map(b => b.textContent.replace(/^●\s*/, '').trim()), filters.map(f => f[lang === 'zh' ? 1 : 2]));
      for (const [key, , , count] of filters) {
        selectStory(key);
        assert.equal(document.querySelectorAll('[data-shrink] a[href="/characters"][aria-current="page"]').length, 1);
        assert.equal(pill(key).getAttribute('aria-pressed'), 'true');
        assert.equal(library.querySelectorAll('.fw-filter-bar [aria-pressed="true"]').length, 1);
        assert.equal(listed().length, count);
        const label = lang === 'zh' ? '位角色' : count === 1 ? 'character' : 'characters';
        assert.equal(library.querySelector('.fw-count').textContent, count + ' ' + label);
        const expected = FEATURED_CHARACTER_CARDS.filter(card => key === 'all' || (key === 'chat' ? Boolean(card.chat) : card.source.universe === key));
        assert.deepEqual(listed(), expected.map(card => card.id), key + ' only includes matching public profiles');
      }
    }
    language('zh');
    go('/characters');
  });

  await t.test('pill URLs preserve native history, support old combinations and remove obsolete query filters on selection', () => {
    go('/characters?source=home&world=xichuan&chat=1&q=retired-search#cast');
    assert.deepEqual(listed(), ['xc-zhiyao'], 'old combined links remain useful without a hidden text filter');
    assert.equal(pill('xichuan').getAttribute('aria-pressed'), 'true');
    assert.equal(pill('chat').getAttribute('aria-pressed'), 'true');
    const before = history.length;
    selectStory('sanguo');
    assert.equal(history.length, before + 1);
    const url = () => new URL(location.href);
    assert.equal(url().searchParams.get('world'), 'sanguo');
    assert.equal(url().searchParams.has('chat'), false);
    assert.equal(url().searchParams.has('q'), false);
    assert.equal(url().searchParams.get('source'), 'home');
    assert.equal(url().hash, '#cast');
    pill('sanguo').focus();
    language('en');
    assert.equal(document.activeElement, pill('sanguo'), 'language repaint restores focused world pill');
    selectStory('chat');
    assert.equal(url().searchParams.get('chat'), '1');
    assert.equal(url().searchParams.has('world'), false);
    selectStory('all');
    assert.equal(url().searchParams.has('world') || url().searchParams.has('chat'), false);
    assert.equal(listed().length, 18);
    const arrow = new window.Event('keydown', {bubbles: true, cancelable: true});
    arrow.key = 'ArrowRight';
    pill('all').dispatchEvent(arrow);
    assert.equal(document.activeElement, pill('chat'), 'arrow keys move focus without changing the selection');
    assert.equal(pill('all').getAttribute('aria-pressed'), 'true');
    go('/characters?world=baker&chat=1');
    assert.equal(listed().length, 0);
    page('characters').querySelector('.fw-empty [data-fw-reset]').click();
    assert.equal(document.activeElement, pill('all'));
    assert.equal(listed().length, 18);
    for (const world of ['__proto__', 'constructor', 'toString', 'unknown-world']) {
      go('/characters?world=' + world);
      assert.equal(listed().length, 18, world + ' never inherits a prior filter');
      assert.equal(pill('all').getAttribute('aria-pressed'), 'true');
    }
    language('zh');
    go('/characters');
  });

  await t.test('a supporting character bookmark keeps its bilingual story-only badge and work link', () => {
    go('/characters/xc-zhou');
    for (const [lang, badge] of [['en', 'In the story'], ['zh', '故事出场']]) {
      language(lang);
      const profile = page('profile');
      assert.equal(profile.querySelector('.sd-capability').textContent, badge);
      assert.ok(profile.querySelector('a[href="/story/xichuan"]'));
      assert.equal(profile.querySelector('[data-fw-chat-entry]'), null);
    }
  });

  await t.test('profiles preserve real entry points and expose details only on request', () => {
    go('/characters/xc-zhiyao');
    let profile = page('profile');
    assert.ok(profile.querySelector('h1').textContent.includes('夏知遥'));
    assert.ok(profile.querySelectorAll('.fw-quote').length >= 2);
    assert.ok(profile.querySelector('.fw-quote cite').textContent.trim());
    assert.ok(profile.querySelector('details.fw-details'));
    assert.equal(profile.querySelector('details.fw-details').hasAttribute('open'), false);
    const story = profile.querySelector('.fw-story-card [data-fw-story-entry][href="/play/xichuan"]');
    assert.ok(story);
    assert.equal(story.getAttribute('target'), null, 'Xichuan enters the shared account-aware host');
    assert.ok(profile.querySelector('[data-fw-chat-entry][href="/play/xc-zhiyao"]'));
    const identity = profile.querySelector('.fw-profile-head');
    assert.equal(identity.querySelector('[data-fw-profile-state],[data-fw-experiences],.fw-ctas'), null, 'identity and current actions are separate regions');
    assert.ok(identity.querySelector('.fw-persona a[href="/story/xichuan"]'), 'the source opens the existing Story detail');
    assert.equal(profile.querySelector('.fw-profile-summary'),null,'a fresh profile does not stack empty status or scope explanations');
    assert.equal(profile.querySelector('[data-fw-experiences]'), null, 'a fresh profile does not add an empty shared-experience panel');
    assert.equal(profile.querySelector('[data-fw-chat-entry]').classList.contains('fw-btn-secondary'), false, 'the first unplayed action is chat');
    assert.equal(profile.querySelector('[data-fw-story-entry]').classList.contains('fw-btn-secondary'), true);
    assert.equal(profile.querySelectorAll('[data-fw-expr]').length,0,'the profile uses the approved portrait rather than an expression demo');
    const before = document.getElementById('fw-portrait-main').getAttribute('src');
    assert.equal(before,CHARACTER_CARDS.find(c=>c.id==='xc-zhiyao').portrait);
    const scene = profile.querySelector('.fw-profile-scene .fw-scene-background');
    const background = scene.getAttribute('src');
    assert.equal(scene.nextElementSibling.id, 'fw-portrait-main');
    const stage = profile.querySelector('.fw-profile-hero.sd-stage-card');
    assert.ok(stage?.querySelector('.sd-stage-layout .sd-stage-art .sd-stage-fade'));
    assert.ok(stage.querySelector('.sd-stage-art #fw-portrait-main'));
    const body = stage.querySelector('.sd-stage-body');
    const quote = identity.querySelector('.fw-profile-quote blockquote');
    assert.ok(quote?.querySelector('cite')?.textContent.trim(), 'the character speaks with attribution before the chat dock');
    assert.equal(stage.querySelectorAll('.fw-profile-quote blockquote').length, 1);
    const expectedOrder = ['h1', '.fw-profile-introduction', '.fw-profile-quote', '[data-fw-profile-form]'];
    const readingOrder = [...body.querySelectorAll(expectedOrder.join(','))];
    assert.deepEqual(readingOrder.map(el => expectedOrder.find(selector => el.matches(selector))), expectedOrder,
      'name, introduction and sourced line precede the chat form in reading order');
    const strip = profile.querySelector('.fw-story-card');
    assert.ok(strip?.querySelector('.fw-story-cover img'));
    assert.ok(strip.querySelector('.fw-story-copy h3'));
    assert.ok(strip.querySelector('.fw-story-information[href="/story/xichuan"]'));
    assert.ok(!strip.querySelector('.fw-story-copy').contains(story), 'the story actions occupy their own strip column');
    assert.equal(profile.querySelector('.fw-hscroll'),null,'related cast is reached from the real Story instead of another profile directory');
    assert.equal(profile.textContent.includes(CHARACTER_CARDS.find(c=>c.id==='xc-zhiyao').locked.zh),false,'internal character constraints are not reader-facing content');
    const about=profile.querySelector('[data-fw-about]');about.setAttribute('open','');about.querySelector('summary').focus();
    language('en');
    profile = page('profile');
    assert.ok(profile.querySelector('h1').textContent.includes('Zhiyao'));
    assert.equal(document.getElementById('fw-portrait-main').getAttribute('src'),before);
    assert.equal(profile.querySelector('.fw-profile-scene .fw-scene-background').getAttribute('src'),background);
    assert.ok(profile.querySelector('[data-fw-about]').hasAttribute('open'),'language preserves the reader’s expanded about section');
    assert.equal(document.activeElement,profile.querySelector('[data-fw-about] summary'));
    go('/characters/sg-caocao');
    profile = page('profile');
    assert.ok(profile.querySelector('[data-fw-chat-entry][href="/play/sgc-002"]'));
    assert.ok(profile.querySelector('.fw-quote cite'));
    assert.equal(profile.querySelectorAll('[data-fw-starter]').length,2,'the profile offers two established opening lines without sending them');
    go('/characters/oc-shen-yanzhou');
    assert.equal(page('profile').querySelector('a[href*="encounter="]'),null);
    assert.ok(page('profile').querySelector('[data-fw-chat-entry]'),'the real chat keeps access to its scene choices');
    go('/characters/sg-diaochan');
    const genericMemories = page('profile').querySelector('[data-fw-experiences]');
    assert.equal(genericMemories, null, 'a generic character with no retained memories does not get an empty panel or unavailable pin guidance');
    const legacyKey = 'ooc-session-v2-sgc-007', legacyLine = 'A real line kept in an earlier conversation.';
    const legacyMessages = JSON.stringify([{role: 'user', text: legacyLine}]);
    values.set(legacyKey, legacyMessages);
    values.set(legacyKey + '-threads', JSON.stringify({version: 1, active: 'main', threads: [{id: 'main', pins: [{turn: 0, role: 'user', text: legacyLine}]}]}));
    const beforeLegacyRead = writes.length;
    go('/characters/sg-diaochan');
    assert.equal(page('profile').querySelector('[data-fw-experiences] blockquote p').textContent, legacyLine, 'validated older pins remain readable even when the current chat has no pin controls');
    assert.equal(page('profile').querySelector('[data-fw-experiences]').hasAttribute('open'),false,'real memories are initially a compact, closed review');
    assert.equal(values.get(legacyKey), legacyMessages);
    assert.equal(writes.length, beforeLegacyRead, 'reading an older memory does not rewrite it');
    go('/characters/wn-lamp');
    assert.equal(page('profile').querySelectorAll('[data-fw-expr]').length, 0);
    for(const card of CHARACTER_CARDS){
      go('/characters/'+card.id);
      assert.equal(document.getElementById('fw-portrait-main').getAttribute('src'),card.portrait,card.id+' keeps its approved portrait');
      const stage = page('profile').querySelector('.sd-stage-card');
      assert.ok(stage.querySelector(card.chat ? '.sd-capability.is-chat' : '.sd-capability.is-story'), card.id + ' shows its actual capability');
      assert.ok(stage.querySelector(card.chat ? '[data-fw-chat-entry]' : '[data-fw-story-jump]'), card.id + ' retains its real entry action');
      assert.equal(page('profile').querySelector('[data-fw-expr],.fw-hscroll'),null);
      assert.equal(Boolean(page('profile').querySelector('[data-fw-profile-form]')),Boolean(card.chat),'only characters with an established conversation get a draft handoff');
    }
  });

  await t.test('story-only character entry scrolls within the page without replaying navigation or losing its Story source',async()=>{
    const {show,syncAccount}=await import('../dist/assets/flywheel/flywheel.js');
    const previousMedia=globalThis.matchMedia;
    try{
      for(const [lang,reduced] of [['en',true],['zh',false]]){
        language(lang);go('/characters/xc-shencheng');
        window.history.replaceState({...window.history.state,from:'/story/xichuan',discoveryReturn:'/characters?world=xichuan&q=澄'},'',location.href);
        show(location.pathname,helpers);
        syncAccount({user:null,restored:true,busy:false});
        const profile=page('profile'),target=profile.querySelector('#fw-stories'),heading=target.querySelector('h2');
        const jump=profile.querySelector('[data-fw-story-jump]');
        assert.ok(jump,'an unavailable chat has an honest entry to its existing story');
        assert.equal(profile.querySelector('[data-fw-chat-entry]'),null);
        const state=structuredClone(window.history.state),url=location.href,navigationCount=navigations.length;
        const scrolls=[];target.scrollIntoView=options=>scrolls.push(options);
        globalThis.matchMedia=()=>({matches:reduced});
        let bubbled=0;const observe=()=>bubbled++;document.addEventListener('click',observe);
        try{
          const event=new window.Event('click',{bubbles:true,cancelable:true});Object.assign(event,{button:0});jump.dispatchEvent(event);
          assert.equal(event.defaultPrevented,true,'the same-page jump never reaches the SPA router');
          assert.equal(bubbled,0,'the handled click stops before global document navigation');
        }finally{document.removeEventListener('click',observe);}
        assert.equal(navigations.length,navigationCount);assert.equal(location.href,url);
        assert.deepEqual(window.history.state,state,'the original Story and filtered-directory context stay intact');
        assert.equal(profile.querySelector('.fw-back').getAttribute('href'),'/story/xichuan');
        assert.deepEqual(scrolls,[{block:'start',behavior:reduced?'instant':'smooth'}]);
        assert.equal(document.activeElement,heading);assert.equal(heading.tabIndex,-1,'the destination heading is programmatically focusable without adding a tab stop');
      }
    }finally{globalThis.matchMedia=previousMedia;language('zh');go('/characters');}
  });

  await t.test('real memory review keeps open and closed state and its focused summary during same-owner updates',async()=>{
    const {syncAccount}=await import('../dist/assets/flywheel/flywheel.js');
    go('/characters/sg-diaochan');
    const current=()=>page('profile').querySelector('[data-fw-experiences]');
    current().setAttribute('open','');current().querySelector('summary').focus();
    const about=page('profile').querySelector('[data-fw-about]');about.setAttribute('open','');
    values.set('ooc-Memories-sgc-007',JSON.stringify('A supplemental note from this conversation.'));
    syncAccount({user:null,restored:true,busy:false});
    assert.equal(current().hasAttribute('open'),true);
    assert.equal(document.activeElement,current().querySelector('summary'));
    assert.equal(page('profile').querySelector('[data-fw-about]'),about,'private state refresh does not rebuild public about content');
    current().removeAttribute('open');current().querySelector('summary').focus();
    values.set('ooc-Memories-sgc-007',JSON.stringify('The same owner updated this note.'));
    syncAccount({user:null,restored:true,busy:false});
    assert.equal(current().hasAttribute('open'),false);
    assert.equal(document.activeElement,current().querySelector('summary'));
    language('zh');
    assert.equal(current().hasAttribute('open'),false);assert.equal(page('profile').querySelector('[data-fw-about]').hasAttribute('open'),true);
    assert.equal(document.activeElement,current().querySelector('summary'));
  });

  await t.test('language focus returns to its active page or shell slot instead of hidden legacy copies', () => {
    const stale = document.createElement('div'); stale.hidden = true;
    stale.innerHTML = '<div class="sd-lang sd-lang-top"><button data-sd-lang="en">EN</button></div><div class="sd-lang sd-lang-side"><button data-sd-lang="en">EN</button><button data-sd-lang="zh">中文</button></div>';
    document.body.prepend(stale);
    const previousFrame = globalThis.requestAnimationFrame, frames = [];
    globalThis.requestAnimationFrame = callback => frames.push(callback);
    const addSide = lang => {
      const group = document.createElement('div'); group.className = 'sd-lang sd-lang-side';
      const button = document.createElement('button'); button.dataset.sdLang = lang; button.textContent = lang;
      group.append(button); document.getElementById('precision-view').prepend(group);
      return button;
    };
    try {
      go('/characters/sg-diaochan');
      page('profile').querySelector('[data-fw-experiences]').setAttribute('open', '');
      page('profile').querySelector('[data-fw-about]').setAttribute('open', '');
      page('profile').querySelector('.fw-mobile-bar [data-sd-lang="en"]').focus();
      language('en');
      assert.equal(document.activeElement, page('profile').querySelector('.fw-mobile-bar [data-sd-lang="en"]'));
      assert.equal(page('profile').querySelector('[data-fw-experiences]').hasAttribute('open'), true);
      assert.equal(page('profile').querySelector('[data-fw-about]').hasAttribute('open'), true);

      addSide('zh').focus();
      language('zh');
      assert.equal(stale.contains(document.activeElement), false, 'a missing new shell slot never restores into hidden legacy UI');
      const restoredSide = addSide('zh');
      frames.splice(0).forEach(callback => callback());
      assert.equal(document.activeElement, restoredSide, 'a delayed shell slot restores within the new visible shell and the same slot');
      assert.equal(document.activeElement.closest('[data-fw-page]'), null, 'desktop focus does not jump to the mobile language control');

      restoredSide.dataset.sdLang = 'en'; restoredSide.focus();
      language('en');
      addSide('en');
      const action = page('profile').querySelector('[data-fw-chat-entry]'); action.focus();
      frames.splice(0).forEach(callback => callback());
      assert.equal(document.activeElement, action, 'delayed restoration does not steal focus from a later user action');
    } finally {
      stale.remove(); globalThis.requestAnimationFrame = previousFrame;
    }
  });

  await t.test('unknown curated pages explain the missing destination without impersonating a character or writing data', () => {
    language('zh');
    const before = writes.length;
    for (const [path, back] of [['/characters/not-a-person', '/characters'], ['/universe/not-a-world', '/'], ['/universe/toString', '/'], ['/universe/__proto__', '/']]) {
      go(path);
      const missing = page('missing');
      assert.ok(missing, path + ' presents an explicit missing-page state');
      assert.match(missing.querySelector('h1').textContent, /没有找到/);
      assert.ok(missing.querySelector(`.fw-missing a[href="${back}"]`));
      assert.equal(document.querySelector('[data-fw-character]'), null);
      assert.equal(page('universe'), null);
      assert.equal(missing.querySelector('.fw-nav'), null);
      assert.equal(writes.length, before, 'a missing public route does not open or overwrite private records');
    }
  });

  await t.test('each real character source opens Story details while its one main story action keeps the true player', () => {
    for (const [id, detail, play] of [
      ['sg-caocao', '/story/three-kingdoms', '/play/three-kingdoms'],
      ['xc-zhiyao', '/story/xichuan', '/play/xichuan'],
      ['wn-lamp', '/story/ashen-crown', '/assets/ashen/index.html'],
      ['bk-holmes', '/story/baker-street', '/assets/holmes-webgal/index.html'],
    ]) {
      go('/characters/' + id);
      const profile = page('profile');
      assert.ok(profile.querySelector(`.fw-persona a[href="${detail}"]`), id + ' has a real Story source');
      assert.equal(profile.querySelectorAll(`[data-fw-story-entry][href="${play}"]`).length, 1);
      assert.equal(profile.querySelector(`.fw-appearances a[href="${play}"]`), null, 'a single work is not repeated as a second appearance action');
      assert.equal(profile.querySelector('.fw-nav'), null);
    }
    go('/characters/oc-shen-yanzhou');
    assert.equal(page('profile').querySelector('.fw-persona a[href^="/story/"]'), null, 'an original encounter is not mislabeled as a book');
    assert.ok(page('profile').querySelector('[data-fw-chat-entry]'),'original encounters remain available through their existing chat');
  });

  await t.test('the same primary action changes from start or continue to a draft handoff in either language', () => {
    const sessionKey = 'ooc-session-v2-xc-zhiyao';
    const original = values.get(sessionKey);
    try {
      for (const [lang, start, resume, take] of [
        ['zh', '开始聊天 →', '继续聊天 →', '带这句话去聊 →'],
        ['en', 'Start chatting →', 'Continue chatting →', 'Take this line to chat →'],
      ]) {
        language(lang);
        for (const hasHistory of [false, true]) {
          if (hasHistory) values.set(sessionKey, JSON.stringify([{role:'user', text:'Earlier message'}]));
          else values.delete(sessionKey);
          go('/characters/xc-zhiyao');
          const dock = page('profile').querySelector('.fw-chat-dock form');
          const primary = dock.querySelector('[data-fw-chat-entry]');
          const controls = [...dock.querySelectorAll('a,button,input[type="submit"]')].filter(el => !el.hasAttribute('data-fw-starter'));
          assert.equal(controls.length, 1, 'only one action can take the user into chat');
          assert.ok(controls[0] === primary);
          const ordinaryLabel = hasHistory ? resume : start;
          assert.equal(primary.textContent.trim(), ordinaryLabel);
          assert.equal(primary.getAttribute('href'), '/play/xc-zhiyao');
          const starter = dock.querySelector('[data-fw-starter]');
          starter.click();
          assert.equal(starter.getAttribute('aria-pressed'), 'true');
          assert.equal(primary.textContent.trim(), take);
          const input = dock.querySelector('[data-fw-profile-draft]');
          assert.equal(input.getAttribute('placeholder'), lang === 'zh' ? '想对 TA 说什么？' : 'What would you like to say?');
          assert.equal(input.value, starter.textContent);
          assert.equal(new URL(primary.getAttribute('href'), location.href).searchParams.get('draft'), input.value);
          input.value = '  ';
          input.dispatchEvent(new window.Event('input', {bubbles:true}));
          assert.equal(primary.textContent.trim(), ordinaryLabel, 'clearing a line restores this thread’s entry action');
          assert.equal(primary.getAttribute('href'), '/play/xc-zhiyao');
          assert.equal(starter.getAttribute('aria-pressed'), 'false');
          input.value = '';
          input.dispatchEvent(new window.Event('input', {bubbles:true}));
        }
      }
    } finally {
      if (original === undefined) values.delete(sessionKey);
      else values.set(sessionKey, original);
      language('zh');
      go('/characters');
    }
  });

  await t.test('conversation entry keeps owner-scoped words through language and sync, then hands off a draft without a send',async()=>{
    const {syncAccount}=await import('../dist/assets/flywheel/flywheel.js');
    language('zh');go('/characters/xc-zhiyao');
    const current=()=>page('profile').querySelector('[data-fw-profile-draft]');
    const type=text=>{current().value=text;current().dispatchEvent(new window.Event('input',{bubbles:true}));};
    const requestsBefore=requests.filter(path=>path.startsWith('/api/'));
    const before=new Map(values),line='  我想和你聊聊影院，先不要发送。 & why?  ';
    type(line);current().focus();current().setSelectionRange(3,9,'forward');
    assert.equal(new URL(page('profile').querySelector('[data-fw-chat-entry]').getAttribute('href'),location.href).searchParams.get('draft'),line.trim(),'the visible primary action includes the words already typed');
    language('en');assert.equal(current().value,line);assert.equal(document.activeElement,current());assert.equal(current().selectionStart,3);
    syncAccount({user:null,restored:true,busy:false});assert.equal(current().value,line);assert.equal(document.activeElement,current());
    go('/characters/sg-caocao');type('不同角色的另一句。');go('/characters/xc-zhiyao');assert.equal(current().value,line,'character entry drafts are separate');
    const navigationCount=navigations.length;
    page('profile').querySelector('[data-fw-starter]').click();
    assert.equal(navigations.length,navigationCount,'choosing an opening line only fills the local input');assert.ok(current().value);assert.equal(document.activeElement,current());
    assert.equal(page('profile').querySelectorAll('[data-fw-starter][aria-pressed=true]').length,1,'the chosen opening line has a visible and accessible selected state');
    syncAccount({user:null,restored:true,busy:false});
    assert.equal(page('profile').querySelectorAll('[data-fw-starter][aria-pressed=true]').length,1,'refreshing private actions keeps the selection from the existing draft');
    type('A different opening');
    assert.equal(page('profile').querySelectorAll('[data-fw-starter][aria-pressed=true]').length,0,'typing different words clears the old selected state');
    type(line);page('profile').querySelector('[data-fw-chat-entry]').click();
    const handed=new URL(navigations.at(-1),location.href);
    assert.equal(handed.pathname,'/play/xc-zhiyao');assert.equal(handed.searchParams.get('draft'),line.trim());assert.equal(handed.searchParams.has('say'),false);
    go('/characters/xc-zhiyao');assert.equal(current().value,'','explicit handoff consumes only this ephemeral entry copy');
    assert.equal(page('profile').querySelector('[data-fw-chat-entry]').getAttribute('href'),'/play/xc-zhiyao');
    assert.deepEqual([...values].filter(([key])=>key!=='sd.lang'),[...before].filter(([key])=>key!=='sd.lang'),'typing, recommendations and handoff create no persistent profile or conversation data; the explicit language preference is independent');
    assert.deepEqual(requests.filter(path=>path.startsWith('/api/')),requestsBefore,'no model, suggestions or billing request comes from profile entry');
    const submit = () => page('profile').querySelector('[data-fw-profile-form]').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
    const countBeforeSubmit = navigations.length;
    type(line);
    for (const composition of [{isComposing:true}, {keyCode:229}]) {
      const confirm = new window.Event('keydown', {bubbles:true});
      Object.assign(confirm, {key:'Enter'}, composition);
      current().dispatchEvent(confirm);
      submit();
      assert.equal(navigations.length, countBeforeSubmit, 'confirming an IME candidate keeps the user in the dock');
      assert.equal(current().value, line);
      current().dispatchEvent(new window.Event('keyup', {bubbles:true}));
    }
    submit();
    assert.equal(navigations.length, countBeforeSubmit + 1, 'the next ordinary form submission performs one handoff');
    assert.equal(new URL(navigations.at(-1),location.href).href, handed.href, 'form submission follows the same draft URL as clicking the primary action');
    go('/characters/xc-zhiyao');
    submit();
    assert.equal(navigations.at(-1), '/play/xc-zhiyao', 'an empty form uses the ordinary chat route');
    go('/characters/xc-zhiyao');
    type('一'.repeat(340));submit();
    assert.equal(new URL(navigations.at(-1),location.href).searchParams.get('draft').length,300,'draft handoff respects the declared limit');
    const previous=helpers.account,alice={user:{uid:'alice'},restored:true,busy:false};
    try{
      helpers.account=alice;go('/characters/xc-zhiyao');type('Alice 尚未发送的私有草稿');
      const staleForm=page('profile').querySelector('[data-fw-profile-form]');
      alice.user={uid:'bob'};alice.restored=false;syncAccount(alice);
      assert.equal(current(),null,'restoration does not expose the old input');assert.doesNotMatch(page('profile').textContent,/Alice 尚未发送/);
      const count=navigations.length;staleForm.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(navigations.length,count,'a detached previous-owner form cannot navigate');
      alice.restored=true;syncAccount(alice);assert.equal(current().value,'','the next owner gets no previous draft');
      alice.user={uid:'alice'};syncAccount(alice);assert.equal(current().value,'','switching owners clears the old ephemeral entry rather than reviving it');
    }finally{if(previous===undefined)delete helpers.account;else helpers.account=previous;go('/characters');}
  });

  await t.test('creation reuses the existing workshop and preserves old drafts read-only', async () => {
    const key = 'sd-flywheel-drafts';
    const raw = JSON.stringify([{name: {zh: '夜航', en: 'Night Watch'}, persona: '修钟表的守夜人。', auth: 2, savedAt: '2026-11-16T00:00:00.000Z'}]);
    values.set(key, raw);
    go('/studio');
    let studio = page('studio');
    assert.equal(studio.querySelector('.fw-nav'), null);
    assert.equal(studio.querySelector('form,input,textarea,select,[data-fw-save],[data-fw-edit],[data-fw-del],[data-fw-mix]'), null);
    assert.equal(studio.querySelectorAll('[data-fw-export]').length, 1, 'the compatibility page exposes one read-only backup action');
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
    assert.equal(document.querySelector('#fw-home-strip'), null);
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
  let activeElement = null;
  Object.defineProperty(document, 'activeElement', {configurable: true, get: () => activeElement?.isConnected ? activeElement : document.body, set: value => { activeElement = value; }});
  window.HTMLElement.prototype.focus = function () { document.activeElement = this; };
  window.HTMLElement.prototype.setSelectionRange = function (start, end, direction = 'none') { this.selectionStart = start; this.selectionEnd = end; this.selectionDirection = direction; };
  const location = {href: 'https://replica.example/', pathname: '/', search: '', hash: ''};
  const setLocation = path => { const url = new URL(path, location.href); Object.assign(location, {href: url.href, pathname: url.pathname, search: url.search, hash: url.hash}); };
  window.history = createHistory(window, location, setLocation);
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
  const reference = await import('../dist/assets/reference.js');
  const {setLang} = await import('../dist/assets/site-i18n.js');
  const data = JSON.parse(await readFile(join(dist, 'data.json'), 'utf8'));
  const helpers = {data, categories: [], read: (key, fallback) => { try { return JSON.parse(values.get(key)) ?? fallback; } catch { return fallback; } }, save: (key, value) => values.set(key, JSON.stringify(value)), show: () => {}, navigate: path => navigations.push(path)};
  const go = path => { window.history.pushState({}, '', path); assert.ok(show(location.pathname, helpers) || reference.show(location.pathname, helpers), `route ${path} is handled by its actual owner`); };
  return {document, window, values, writes, storageState, go, setLang, navigations, requests, helpers};
}
