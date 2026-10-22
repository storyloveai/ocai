import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {SCENES, LANGS, heroSceneMarkup, heroSceneEnabled, heroLang, mountHeroScene} from '../dist/assets/hero-scene.js';

const store = (init = {}) => { const m = new Map(Object.entries(init)); return {getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), map: m}; };

test('banner offers at most three ways in, in both languages, with matching copy', () => {
  for (const page of ['home', 'character']) for (const lang of LANGS) {
    const x = SCENES[page][lang];
    assert.equal(x.choices.length, 2);
    assert.deepEqual(Object.keys(x).sort(), Object.keys(SCENES[page].en).sort());
    const {document} = parseHTML('<main>' + heroSceneMarkup(page, lang) + '</main>');
    assert.equal(document.querySelectorAll('[data-hero-choice]').length, 2);
    assert.equal(document.querySelectorAll('input').length, 1);
    assert.equal(document.querySelectorAll('form button[type=submit]').length, 1);
    assert.equal(document.querySelector(`[data-hero-lang="${lang}"]`).getAttribute('aria-pressed'), 'true');
    assert.equal(/[一-鿿]/.test(document.querySelector('.sd-hero-copy').textContent), lang === 'zh');
  }
});

test('language follows the visitor pick, then the browser', () => {
  assert.equal(heroLang({localStorage: store(), navigator: {language: 'zh-CN'}}), 'zh');
  assert.equal(heroLang({localStorage: store(), navigator: {language: 'en-US'}}), 'en');
  assert.equal(heroLang({localStorage: store({'sd.lang': 'en'}), navigator: {language: 'zh-CN'}}), 'en');
});

test('banner mounts beside the desktop carousel, switches language, and opens the game in that language', () => {
  const {document, window} = parseHTML('<html><head></head><body><section><div><div data-hero-desktop><h1>Old</h1></div><div class="tl:hidden"></div></div></section></body></html>');
  const routes = [], ls = store();
  const win = {location: {search: ''}, localStorage: ls, navigator: {language: 'en-US'}};
  const hero = mountHeroScene(document.body, 'home', {navigate: r => routes.push(r), win});
  assert.ok(hero.nextElementSibling.hasAttribute('data-hero-desktop'));
  assert.ok(document.querySelector('section').classList.contains('sd-hero-on'));
  assert.equal(hero.getAttribute('lang'), 'en');
  hero.querySelector('[data-hero-lang="zh"]').click();
  assert.equal(hero.getAttribute('lang'), 'zh-CN');
  assert.equal(ls.getItem('sd.lang'), 'zh');
  hero.querySelector('[data-hero-choice="1"]').click();
  assert.equal(hero.querySelector('input').value, SCENES.home.zh.choices[1].label);
  assert.equal(hero.querySelector('[data-hero-choice="1"]').getAttribute('aria-pressed'), 'true');
  hero.querySelector('form').dispatchEvent(new window.Event('submit', {cancelable: true}));
  assert.deepEqual(routes, ['/play/three-kingdoms?lang=zh']);
  mountHeroScene(document.body, 'home', {navigate: () => {}, win});
  assert.equal(document.querySelectorAll('[data-sd-hero]').length, 1);
  assert.equal(heroSceneEnabled({location: {search: '?hero=classic'}}), false);
  assert.equal(heroSceneEnabled({location: {search: ''}, localStorage: store({'sd.hero': 'classic'})}), false);
});
