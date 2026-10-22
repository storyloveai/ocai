import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {SCENES, heroSceneMarkup, heroSceneEnabled, mountHeroScene} from '../dist/assets/hero-scene.js';

test('banner offers at most three ways in: two choices plus a free reply', () => {
  for (const page of ['home', 'character']) {
    assert.equal(SCENES[page].choices.length, 2);
    const {document} = parseHTML('<main>' + heroSceneMarkup(page) + '</main>');
    assert.equal(document.querySelectorAll('[data-hero-choice]').length, 2);
    assert.equal(document.querySelectorAll('input').length, 1);
    assert.equal(document.querySelectorAll('form button[type=submit]').length, 1);
  }
});

test('banner mounts beside the desktop carousel, opens the right page, and can be switched back to classic', () => {
  const {document, window} = parseHTML('<html><head></head><body><section><div><div data-hero-desktop><h1>Old</h1></div><div class="tl:hidden"></div></div></section></body></html>');
  const routes = [];
  const win = {location: {search: ''}, localStorage: {getItem: () => null}};
  const hero = mountHeroScene(document.body, 'home', {navigate: r => routes.push(r), win});
  assert.ok(hero && hero.nextElementSibling.hasAttribute('data-hero-desktop'));
  assert.ok(document.querySelector('section').classList.contains('sd-hero-on'));
  assert.ok(document.getElementById('sd-hero-style'));
  hero.querySelector('[data-hero-choice="1"]').click();
  assert.equal(hero.querySelector('input').value, SCENES.home.choices[1].label);
  assert.equal(hero.querySelector('[data-hero-choice="1"]').getAttribute('aria-pressed'), 'true');
  hero.querySelector('form').dispatchEvent(new window.Event('submit', {cancelable: true}));
  assert.deepEqual(routes, ['/play/three-kingdoms']);
  mountHeroScene(document.body, 'home', {navigate: () => {}, win});
  assert.equal(document.querySelectorAll('[data-sd-hero]').length, 1);
  assert.equal(heroSceneEnabled({location: {search: '?hero=classic'}}), false);
  assert.equal(heroSceneEnabled({location: {search: ''}, localStorage: {getItem: () => 'classic'}}), false);
});
