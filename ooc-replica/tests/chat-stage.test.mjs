import test from 'node:test';
import assert from 'node:assert/strict';
import {boot, waitFor} from './fixtures/character-loop-dom.mjs';
import {FEATURED_CHARACTER_CARDS} from '../dist/assets/flywheel/cards-data.js';
import {characterArt} from '../dist/assets/flywheel/character-art.js';
import {storiesForCharacter} from '../dist/assets/character-stories.js';
import {storydateCharacters} from '../dist/assets/storydate-originals.js';

test('all 15 chat routes share their profile art, public caption, story destination and authored opening in both languages', async () => {
  const cards = FEATURED_CHARACTER_CARDS.filter(card => card.chat?.startsWith('/play/'));
  assert.equal(cards.length, 15);
  const f = await boot({path:'/characters', configured:false});
  const {setLang} = await import('../dist/assets/site-i18n.js');
  try {
    for (const card of cards) {
      const character = storydateCharacters.find(c => c.id === card.chatId);
      const scene = character.scenes?.[0] || character;
      await f.go('/play/' + card.chatId);
      await waitFor(() => f.document.querySelector('.sg-chat-intro'), card.id);
      for (const lang of ['zh', 'en']) {
        setLang(lang, {win:globalThis, doc:f.document});
        const intro = f.document.querySelector('.sg-chat-intro');
        const stage = intro.querySelector('.sd-stage-card');
        assert.equal(stage.querySelector('h2').textContent, card.name[lang]);
        assert.equal(stage.querySelectorAll('img').length, 1, card.id);
        assert.equal(intro.querySelector('img').getAttribute('src'), character.image);
        assert.equal(stage.querySelector('.sg-chat-tagline').textContent, card.tagline[lang]);
        const background = characterArt(card)?.background;
        assert.equal(Boolean(stage.querySelector('.sg-chat-composite')), Boolean(background));
        assert.equal(stage.style.getPropertyValue('--sd-stage-image'), `url('${background || character.image}')`);
        assert.equal(stage.querySelector('.sd-capability'), null);
        const source = stage.querySelector('a[data-full-info]');
        const story = storiesForCharacter(card.id)[0];
        if (story) {
          assert.equal(source.getAttribute('href'), story.informationUrl);
          assert.ok(source.getAttribute('aria-label').includes(story.title[lang]));
        } else {
          assert.equal(source, null, 'original encounters only offer real destinations');
        }
        const opening = scene.opening?.[lang] || (lang === 'zh' ? character.description_zh : character.description);
        assert.ok(stage.nextElementSibling.classList.contains('character-prose'));
        assert.ok(stage.nextElementSibling.textContent.includes(opening.replaceAll('*', '').split('\n')[0]), card.id);
      }
    }
  } finally {
    (await import('../dist/assets/interaction.js')).show('/no-session',{});
    clearInterval(f.window.carousel);
  }
});
