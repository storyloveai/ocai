import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {SCENES, LANGS, heroSceneMarkup, heroSceneEnabled, heroLang, heroHref, mountHeroContent, mountHeroScene} from '../dist/assets/hero-scene.js';

const store = (init = {}) => { const m = new Map(Object.entries(init)); return {getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v))}; };

test('banner offers at most three ways in, in both languages, with matching copy', () => {
  for (const page of ['home', 'character']) for (const lang of LANGS) {
    const x = SCENES[page][lang];
    assert.equal(x.choices.length, 2);
    assert.deepEqual(Object.keys(x).sort(), Object.keys(SCENES[page].en).sort());
    const {document} = parseHTML('<main>' + heroSceneMarkup(page, lang) + '</main>');
    assert.equal(document.querySelectorAll('[data-hero-choice]').length, 2);
    assert.equal(document.querySelectorAll('input').length, 1);
    assert.equal(document.querySelectorAll('form button[type=submit]').length, 1);
    assert.equal(/[一-鿿]/.test(document.querySelector('.sd-hero-copy').textContent), lang === 'zh');
  }
});

test('language follows the visitor pick, then the browser', () => {
  assert.equal(heroLang({localStorage: store(), navigator: {language: 'zh-CN'}}), 'zh');
  assert.equal(heroLang({localStorage: store(), navigator: {language: 'en-US'}}), 'en');
  assert.equal(heroLang({localStorage: store({'sd.lang': 'en'}), navigator: {language: 'zh-CN'}}), 'en');
});

test('home keeps its catalogue transition free of inserted dividers and preserves bilingual story choices',()=>{
 const {document}=parseHTML('<html><head></head><body><main><div class="pointer-events-none"></div><section><div><div data-hero-desktop></div><div class="tl:hidden">mobile carousel</div></div></section><div class="content"><div>categories</div></div></main></body></html>');
 const listeners={},routes=[];
 const win={location:{search:''},localStorage:store(),navigator:{language:'en'},matchMedia:()=>({matches:true}),addEventListener:(name,fn)=>listeners[name]=fn};
 const hero=mountHeroScene(document.body,'home',{win,navigate:path=>routes.push(path)}),library=document.querySelector('#story-library');
 assert.ok(hero.closest('.sd-home-stage'));assert.ok(library.classList.contains('sd-home-library'));
 assert.equal(document.querySelectorAll('.sd-home-old-carousel').length,2);
 assert.equal(document.querySelector('.sd-hero-footer'),null);assert.equal(document.querySelector('.sd-library-heading'),null);
 listeners['sd-lang']({detail:'zh'});assert.equal(hero.querySelector('.sd-hero-quote').textContent,SCENES.home.zh.quote);
 hero.querySelector('[data-hero-choice="0"]').click();assert.deepEqual(routes,['/play/three-kingdoms?lang=zh&choice=cover']);
 mountHeroScene(document.body,'home',{win,navigate(){}});assert.equal(document.querySelectorAll('[data-sd-hero]').length,1);
});

test('a choice goes straight in: the game in the banner language, or the chat with that line', () => {
  assert.equal(heroHref('home', 'zh'), '/play/three-kingdoms?lang=zh');
  // the home banner hands its choice or the typed words to the game (game/sanguo 决策记录 v2.9)
  assert.equal(heroHref('home', 'en', SCENES.home.en.choices[0].label, SCENES.home.en.choices[0].id), '/play/three-kingdoms?lang=en&choice=cover');
  assert.equal(heroHref('home', 'zh', '', SCENES.home.zh.choices[1].id), '/play/three-kingdoms?lang=zh&choice=speak');
  assert.equal(heroHref('home', 'en', ' I pour him more wine '), '/play/three-kingdoms?lang=en&say=I+pour+him+more+wine');
  assert.equal(heroHref('character', 'en', 'Who is listening?'), '/play/sgc-007?say=Who%20is%20listening%3F');
  assert.equal(heroHref('character', 'en', '   '), '/play/sgc-007');
  const {document, window} = parseHTML('<html><head></head><body><div><div class="hidden tl:h-10"></div><section><div><div data-hero-desktop><h1>Old</h1></div><div class="tl:hidden"><a href="#">m</a></div></div></section><div class="hidden h-4"></div><div class="tl:hidden"><img></div><div class="content"><button>Main</button></div></div></body></html>');
  const routes = [], listeners = {};
  const win = {location: {search: ''}, localStorage: store(), navigator: {language: 'en-US'}, addEventListener: (t, f) => (listeners[t] = f)};
  const hero = mountHeroScene(document.body, 'character', {navigate: r => routes.push(r), win});
  assert.ok(hero.nextElementSibling.hasAttribute('data-hero-desktop'));
  assert.ok(document.querySelector('.tl\\:h-10').classList.contains('sd-hero-gap'));
  assert.ok(document.querySelector('.h-4').classList.contains('sd-hero-gap'));
  assert.ok(document.querySelector('.content').classList.contains('sd-hero-next'));
  hero.querySelector('[data-hero-choice="0"]').click();
  assert.deepEqual(routes, [heroHref('character', 'en', SCENES.character.en.choices[0].label)]);
  listeners['sd-lang']({detail: 'zh'});
  assert.equal(hero.getAttribute('lang'), 'zh-CN');
  hero.querySelector('input').value = '你好';
  hero.querySelector('form').dispatchEvent(new window.Event('submit', {cancelable: true}));
  assert.equal(routes[1], '/play/sgc-007?say=' + encodeURIComponent('你好'));
  mountHeroScene(document.body, 'character', {navigate: () => {}, win});
  assert.equal(document.querySelectorAll('[data-sd-hero]').length, 1);
  assert.equal(heroSceneEnabled({location: {search: '?hero=classic'}}), false);
  assert.equal(heroSceneEnabled({location: {search: ''}, localStorage: store({'sd.hero': 'classic'})}), false);
});

function artFixture(page, lang) {
  const {document, window} = parseHTML('<html><head></head><body><section></section></body></html>');
  const routes = [], listeners = {};
  const win = {location: {search: ''}, localStorage: store(), navigator: {language: lang}, addEventListener: (type, fn) => { listeners[type] = fn; }};
  const hero = mountHeroContent(document.querySelector('section'), page, {win, lang, navigate: href => routes.push(href)});
  return {document, window, hero, routes, listeners};
}

// Linkedom does not track browser focus. Model the browser's connected-node
// rule: removing a focused input makes activeElement fall back to the body.
function modelFocus(document, window) {
  let active = null;
  Object.defineProperty(document, 'activeElement', {configurable: true,
    get: () => active?.isConnected ? active : document.body,
    set: node => { active = node; }});
  window.HTMLElement.prototype.focus = function (options) {
    this.focusedFrom = this.ownerDocument.activeElement;
    this.focusOptions = options;
    this.ownerDocument.activeElement = this;
  };
  window.HTMLElement.prototype.setSelectionRange = function (start, end, direction = 'none') {
    this.selectionStart = start; this.selectionEnd = end; this.selectionDirection = direction;
  };
}

test('failed banner artwork keeps the scene and reply actions usable, then recovers without replacing them', () => {
  for (const page of ['home', 'character']) for (const lang of LANGS) {
    const {window, hero, routes} = artFixture(page, lang);
    const figure = hero.querySelector('.sd-hero-figure'), blur = hero.querySelector('.sd-hero-blur');
    const placeholder = hero.querySelector('.sd-hero-placeholder'), input = hero.querySelector('input');
    const form = hero.querySelector('form'), choice = hero.querySelector('[data-hero-choice="0"]');
    const originalImages = [...hero.querySelectorAll('img')];
    input.value = '  Keep this draft / 保留这句话  ';

    figure.dispatchEvent(new window.Event('load'));
    blur.dispatchEvent(new window.Event('error'));
    assert.equal(hero.dataset.heroArtState, 'ready', 'a missing blur must not remove the main portrait');
    assert.equal(figure.hidden, false);
    assert.equal(blur.hidden, true);
    assert.equal(placeholder.hidden, true);

    figure.dispatchEvent(new window.Event('error'));
    assert.equal(hero.dataset.heroArtState, 'unavailable');
    assert.equal(placeholder.hidden, false);
    assert.equal(figure.hidden, true);
    assert.equal(blur.hidden, true);
    assert.equal(placeholder.querySelector('.sd-hero-placeholder-name').textContent, page === 'character' ? SCENES.character[lang].name : SCENES.home[lang].eyebrow[0]);
    assert.match(placeholder.textContent, lang === 'zh' ? /插画暂不可用/ : /Artwork unavailable/);
    assert.equal(hero.querySelector('input'), input);
    assert.equal(input.value, '  Keep this draft / 保留这句话  ');
    choice.click();
    form.dispatchEvent(new window.Event('submit', {cancelable: true}));
    const selected = SCENES[page][lang].choices[0];
    assert.deepEqual(routes, [heroHref(page, lang, selected.label, selected.id || ''), heroHref(page, lang, input.value)]);

    figure.dispatchEvent(new window.Event('load'));
    assert.equal(hero.dataset.heroArtState, 'ready');
    assert.equal(placeholder.hidden, true);
    assert.equal(figure.hidden, false);
    assert.equal(blur.hidden, true, 'the independently failed blur stays hidden');
    blur.dispatchEvent(new window.Event('load'));
    assert.equal(blur.hidden, false);
    assert.deepEqual([...hero.querySelectorAll('img')], originalImages, 'settling artwork does not create retry images or replace reply controls');
    assert.ok(originalImages.every(image => image.getAttribute('src') === SCENES[page].image));
  }
});

test('late artwork events from an earlier language or removed route cannot alter the current fallback', () => {
  const {window, hero, listeners} = artFixture('character', 'en');
  const oldFigure = hero.querySelector('.sd-hero-figure'), oldBlur = hero.querySelector('.sd-hero-blur');
  hero.querySelector('input').value = '仍未发送 / still typing';
  oldFigure.dispatchEvent(new window.Event('error'));
  assert.equal(hero.dataset.heroArtState, 'unavailable');
  listeners['sd-lang']({detail: 'zh'});
  const figure = hero.querySelector('.sd-hero-figure'), blur = hero.querySelector('.sd-hero-blur');
  const placeholder = hero.querySelector('.sd-hero-placeholder');
  assert.notEqual(figure, oldFigure);
  assert.equal(hero.querySelector('input').value, '仍未发送 / still typing');
  assert.equal(placeholder.querySelector('.sd-hero-placeholder-name').textContent, '貂蝉');
  figure.dispatchEvent(new window.Event('load'));
  oldFigure.dispatchEvent(new window.Event('error'));
  oldBlur.dispatchEvent(new window.Event('error'));
  assert.equal(hero.dataset.heroArtState, 'ready');
  assert.equal(placeholder.hidden, true);
  assert.equal(figure.hidden, false);
  assert.equal(blur.hidden, false);
  figure.dispatchEvent(new window.Event('error'));
  oldFigure.dispatchEvent(new window.Event('load'));
  oldBlur.dispatchEvent(new window.Event('load'));
  assert.equal(hero.dataset.heroArtState, 'unavailable');
  assert.equal(placeholder.hidden, false);
  hero.remove();
  figure.dispatchEvent(new window.Event('load'));
  assert.equal(hero.dataset.heroArtState, 'unavailable', 'detached routes no longer settle artwork');
  assert.equal(placeholder.hidden, false);
});

test('language repaint restores a focused banner draft and its selection after the old input detaches', () => {
  for (const page of ['home', 'character']) {
    const {document, window, hero, listeners} = artFixture(page, 'en');
    modelFocus(document, window);
    const original = hero.querySelector('input'), oldFigure = hero.querySelector('.sd-hero-figure');
    original.value = '  尚未发送 / still editing  ';
    original.focus(); original.setSelectionRange(3, 11, 'backward');
    oldFigure.dispatchEvent(new window.Event('error'));
    listeners['sd-lang']({detail: 'zh'});
    const input = hero.querySelector('input');
    assert.equal(original.isConnected, false);
    assert.notEqual(input, original);
    assert.equal(input.focusedFrom, document.body, 'focus was restored after detachment, not kept on a stale DOM node');
    assert.equal(document.activeElement, input);
    assert.deepEqual(input.focusOptions, {preventScroll: true});
    assert.equal(input.value, '  尚未发送 / still editing  ');
    assert.deepEqual([input.selectionStart, input.selectionEnd, input.selectionDirection], [3, 11, 'backward']);
    hero.querySelector('.sd-hero-figure').dispatchEvent(new window.Event('load'));
    oldFigure.dispatchEvent(new window.Event('error'));
    assert.equal(hero.dataset.heroArtState, 'ready');
    assert.equal(document.activeElement, input, 'artwork events never repaint the reply controls');
    assert.deepEqual([input.selectionStart, input.selectionEnd, input.selectionDirection], [3, 11, 'backward']);
    listeners['sd-lang']({detail: 'en'});
    const returned = hero.querySelector('input');
    assert.equal(document.activeElement, returned);
    assert.deepEqual([returned.selectionStart, returned.selectionEnd, returned.selectionDirection], [3, 11, 'backward']);
  }
});

test('a language repaint does not take focus from another control or a route that has left', () => {
  const {document, window, hero, listeners} = artFixture('character', 'en');
  modelFocus(document, window);
  const other = document.createElement('button'); document.body.append(other);
  const original = hero.querySelector('input');
  original.value = 'Keep this without focusing it';
  other.focus();
  listeners['sd-lang']({detail: 'zh'});
  assert.equal(document.activeElement, other);
  assert.equal(hero.querySelector('input').value, 'Keep this without focusing it');
  assert.equal(hero.querySelector('input').focusOptions, undefined);
  hero.remove();
  listeners['sd-lang']({detail: 'en'});
  assert.equal(document.activeElement, other);
  assert.equal(hero.getAttribute('lang'), 'zh-CN', 'the disconnected route is not repainted');
});
