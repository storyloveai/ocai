import test from 'node:test';
import assert from 'node:assert/strict';
import {boot, waitFor} from './fixtures/character-loop-dom.mjs';

test('a cast link from the home Story preview returns to that real Story information page', async () => {
  const f = await boot({path: '/'});
  try {
    for (const [storyId, characterId] of [['xichuan', 'xc-shencheng'], ['three-kingdoms', 'sg-caocao']]) {
      await f.go('/');
      await f.click(`a[href="/story/${storyId}"]`);
      const preview = await waitFor(() => f.document.querySelector('#title-preview'), 'home Story card did not open its preview');
      assert.equal(f.location.pathname, '/', 'opening a preview leaves the underlying home URL intact');
      assert.ok(preview.querySelector(`[data-story-characters="${storyId}"] a[href="/characters/${characterId}"]`));
      await f.click(`#title-preview [data-story-characters="${storyId}"] a[href="/characters/${characterId}"]`);
      const profile = await waitFor(() => f.document.querySelector(`[data-fw-character="${characterId}"]`), 'the preview cast did not reach the actual character profile');
      assert.equal(f.location.pathname, '/characters/' + characterId);
      assert.equal(profile.querySelector('.fw-back').getAttribute('href'), '/story/' + storyId);
      assert.equal(f.history.state.from, '/story/' + storyId, 'the source is the known Story, not the preview’s underlying home page');
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
