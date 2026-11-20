import assert from 'node:assert/strict';
import test from 'node:test';
import {boot, waitFor} from './fixtures/character-loop-dom.mjs';
import {createRain} from '../dist/assets/living-manga/rain.js';

test('the lazy reader grows panels, hands unsent drafts to three real chat routes and restores the page on Back', async () => {
  const f = await boot();
  const doc = f.document;
  const one = selector => doc.querySelector(selector);
  const frames = () => [...doc.querySelectorAll('.lm-frame')];
  const pilot = '/pilot/sanguo-manga';
  const style = 'link[href*="living-manga/reader.css"]';
  assert.equal(one(style), null);
  try {
    await f.go(pilot);
    await waitFor(() => frames().length === 3, 'opening panels never appeared');
    assert.ok(one(style));
    assert.equal(one('.lm-reader').lang, 'zh-CN');
    assert.ok(frames().every(frame => frame.querySelector('img').src && frame.querySelector('img').alt));
    await f.click('[data-lm-action="ink"]');
    assert.equal(one('.lm-reader').dataset.theme, 'ink');
    const free = '窗外那一枝梅 <em>还青着</em> & it is late.';
    for (const [option, actor] of [['cover', 'sgc-002'], ['still', 'sgc-001'], [null, 'sgc-003']]) {
      if (option) {
        await f.click('[data-lm-option="' + option + '"]');
      } else {
        const field = one('.lm-free input');
        field.value = free;
        field.dispatchEvent(new f.window.Event('input'));
        assert.equal(one('[data-lm-action="speak"]').disabled, false);
        one('.lm-free').dispatchEvent(new f.window.Event('submit', {bubbles:true, cancelable:true}));
        assert.equal(one('[data-lm-player]').textContent, free);
        assert.equal(one('[data-lm-player] em'), null);
        await f.click('[data-lm-action="language"]');
        assert.equal(one('.lm-reader').lang, 'en');
      }
      assert.equal(frames().length, 5);
      assert.equal(one('.lm-decision').hidden, true);
      assert.ok(one('.lm-tags li'));
      const link = '[data-lm-character="' + actor + '"]';
      const url = new URL(one(link).getAttribute('href'), f.location.href);
      const draft = url.searchParams.get('draft');
      assert.ok(draft?.length);
      if (!option) assert.ok(draft.includes(free));
      const transfers = f.requests.length;
      await f.click(link);
      await waitFor(() => one('#session-input')?.value === draft, 'chat did not receive the selected draft');
      assert.equal(f.location.pathname, '/play/' + actor);
      assert.equal(one(style), null);
      assert.equal(one('.lm-reader'), null);
      assert.equal(one('[data-session-back]').getAttribute('href'), pilot);
      assert.deepEqual(f.requests.slice(transfers).filter(([path, method]) => method !== 'GET' || /chat|wallet|credits|suggestions/.test(path)), []);
      await f.click('[data-session-back]');
      await waitFor(() => frames().length === 5, 'interlude Back lost the panels');
      assert.equal(f.location.pathname, pilot);
      assert.equal(one('.lm-reader').dataset.theme, 'ink');
      const characterLink = one(link);
      assert.equal(new URL(characterLink.getAttribute('href'), f.location.href).searchParams.get('draft'), draft);
      await f.click('[data-lm-action="again"]');
      assert.equal(frames().length, 3);
    }
    // Full navigation and a BFCache restore follow the same resource lifecycle.
    f.window.dispatchEvent(new f.window.Event('pagehide'));
    assert.equal(frames().length, 0);
    const show = new f.window.Event('pageshow');
    show.persisted = true;
    f.window.dispatchEvent(show);
    assert.equal(frames().length, 3);
    await f.go('/characters');
    assert.equal(one(style), null);
    assert.equal(doc.body.classList.contains('lm-reading'), false);
    assert.equal(f.requests.filter(([, method]) => method === 'POST').length, 0);
    assert.equal(f.chatBodies.length, 0);
  } finally {
    clearInterval(f.window.carousel);
  }
});

test('rain is opt-in and closing the reader while audio unlock is pending releases the context', async () => {
  let opened = 0, closed = 0, unlock;
  class Audio {
    constructor() { opened++; }
    resume() { return new Promise(resolve => { unlock = resolve; }); }
    async close() { closed++; this.state = 'closed'; }
  }
  const rain = createRain({AudioContext:Audio});
  assert.equal(opened, 0);
  const pending = rain.start();
  assert.equal(opened, 1);
  rain.stop();
  unlock();
  assert.equal(await pending, false);
  rain.stop();
  assert.equal(closed, 1);
});
