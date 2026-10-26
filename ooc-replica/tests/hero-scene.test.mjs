import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {SCENES, LANGS, heroSceneMarkup, heroSceneEnabled, heroLang, heroHref, mountHeroScene} from '../dist/assets/hero-scene.js';

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

test('home discovery scrolls to a separate library and follows language changes without duplicating sections',()=>{
 const {document}=parseHTML('<html><head></head><body><main><div class="pointer-events-none"></div><section><div><div data-hero-desktop></div><div class="tl:hidden">mobile carousel</div></div></section><div class="content"><div>categories</div></div></main></body></html>');
 const listeners={},scrolls=[],routes=[];
 const win={location:{search:''},localStorage:store(),navigator:{language:'en'},matchMedia:()=>({matches:true}),addEventListener:(name,fn)=>listeners[name]=fn};
 const hero=mountHeroScene(document.body,'home',{win,navigate:path=>routes.push(path)}),library=document.querySelector('#story-library');
 library.scrollIntoView=options=>scrolls.push(options);
 assert.ok(hero.closest('.sd-home-stage'));assert.ok(library.classList.contains('sd-home-library'));
 assert.equal(document.querySelectorAll('.sd-home-old-carousel').length,2);
 hero.querySelector('[data-explore-library]').click();assert.deepEqual(scrolls,[{behavior:'auto',block:'start'}]);
 listeners['sd-lang']({detail:'zh'});assert.equal(library.querySelector('h2').textContent,'下一段故事，由你选择。');
 assert.match(hero.querySelector('[data-explore-library]').textContent,/探索更多故事/);
 hero.querySelector('[data-hero-choice="0"]').click();assert.deepEqual(routes,['/play/three-kingdoms?lang=zh']);
 mountHeroScene(document.body,'home',{win,navigate(){}});assert.equal(document.querySelectorAll('.sd-library-heading').length,1);
});

test('a choice goes straight in: the game in the banner language, or the chat with that line', () => {
  assert.equal(heroHref('home', 'zh'), '/play/three-kingdoms?lang=zh');
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
