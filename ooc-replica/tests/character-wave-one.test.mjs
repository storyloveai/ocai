import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {waveOneCharacters} from '../dist/assets/character-wave-one.js';
import {storydateCharacters} from '../dist/assets/storydate-originals.js';
import {characterScene, characterById} from '../dist/assets/character-profiles.js';
import {buildPrompt} from '../server/prompt-engine.js';
import {roleFor} from '../server/roles.js';

test('wave one has ten discoverable adults with distinct images, voices and existing genre filters', async () => {
  assert.equal(waveOneCharacters.length, 10);
  const supported = new Set(['Romance', 'Slice of Life', 'Oriental Fantasy', 'Sci-Fi']);
  const art = JSON.parse(await readFile(new URL('../character-art/wave-one/GENERATION.json', import.meta.url)));
  const voices = new Set();
  for (const c of waveOneCharacters) {
    assert.ok(c.age >= 25); assert.ok(!c.apparentAge || c.apparentAge >= 25);
    assert.ok(supported.has(c.genre), `${c.id} must work with the existing genre picker`);
    assert.equal(storydateCharacters.filter(t => t.id === c.id).length, 1);
    assert.ok(art.images.some(i => i.key === c.key && '/' + i.web_asset.replace(/^dist\//, '') === c.image));
    voices.add(roleFor(c.id).character.voice);
    for (const lang of ['zh', 'en']) {
      const profile = characterScene(characterById.get(c.id), c.scenes[1].id);
      assert.equal(profile.opening[lang], c.scenes[1].opening[lang]);
      const packet = buildPrompt({titleId:c.id, characterScene:profile.selectedScene, language:lang, messages:[{role:'user',content:'I changed my mind. Let’s discuss something else.'}]});
      assert.ok(packet.system.includes(JSON.stringify(c.scenes[1].opening[lang])));
      assert.ok(packet.system.includes(lang === 'zh' ? 'visitor selected Simplified Chinese' : 'visitor selected English'));
      assert.doesNotMatch([c.title,c.description,...c.tags.en,...c.scenes.map(s=>s.opening.en)].join(' '), /[\u3400-\u9fff]/);
    }
  }
  assert.equal(voices.size, 10);
  assert.equal(new Set(waveOneCharacters.map(c=>c.image)).size, 10);
});
