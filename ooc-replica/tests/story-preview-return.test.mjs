import test from 'node:test';
import assert from 'node:assert/strict';
import {boot, waitFor} from './fixtures/character-loop-dom.mjs';

test('a home library card opens its Story stage and the cast can return to that stage', async () => {
  const f = await boot({path: '/'});
  try {
    for (const [storyId, characterId] of [['xichuan', 'xc-shencheng'], ['three-kingdoms', 'sg-caocao']]) {
      await f.go('/');
      await f.click(`.sd-story-grid a[href="/story/${storyId}"]`);
      const stage = await waitFor(() => f.document.querySelector('.sd-stage-layout'), 'home Story card did not reach its stage');
      assert.equal(f.location.pathname, '/story/' + storyId);
      assert.equal(f.document.querySelector('#title-preview'), null);
      assert.ok(stage.querySelector(`[data-story-play="${storyId}"]`));
      await f.click(`[data-story-characters="${storyId}"] a[href="/characters/${characterId}"]`);
      const profile = await waitFor(() => f.document.querySelector(`[data-fw-character="${characterId}"]`), 'the Story cast did not reach the character profile');
      assert.equal(f.location.pathname, '/characters/' + characterId);
      assert.equal(profile.querySelector('.fw-back').getAttribute('href'), '/story/' + storyId);
      assert.equal(f.history.state.from, '/story/' + storyId, 'the profile retains the originating Story');
      assert.equal(f.location.search, '', 'the navigation needs no private query payload');
      assert.equal(f.document.querySelector('#title-preview'), null);
      await f.click('[data-fw-page="profile"] .fw-back');
      assert.equal(f.location.pathname, '/story/' + storyId);
      assert.ok(f.document.querySelector(`[data-story-characters="${storyId}"]`));
      assert.ok(f.document.querySelector(`[data-story-play="${storyId}"]`));
      assert.equal(f.document.querySelector('#title-preview'), null, 'return opens real information rather than resurrecting the popup');
      assert.equal(f.document.querySelector('#xichuan-frame'), null, 'returning to information does not start the story');
    }
    assert.deepEqual(f.requests.filter(([path]) => path.startsWith('/api/')), [['/api/config', 'GET']]);
    assert.equal([...f.values.keys()].some(key => key.startsWith('ooc-session-v2-')), false, 'public cast browsing creates no chat or game session');
  } finally { await f.go('/characters'); clearInterval(f.window.carousel); }
});
