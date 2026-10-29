import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {sanguoCharacters, characterById, mergeSanguoCharacters} from '../dist/assets/sanguo-characters.js';
import {storydateCharacters} from '../dist/assets/storydate-originals.js';
import {characterHubMarkup, characterDetailMarkup} from '../dist/assets/sanguo-character-hub.js';
import {roleFor, siteTitles} from '../server/roles.js';
import {buildPrompt} from '../server/prompt-engine.js';
import {suggestionPrompt} from '../server/suggestion-prompt.js';

const readFrom = values => (key, fallback) => values.get(key) ?? fallback;
test('character extraction keeps the eight existing IDs and adds Wen Zhi exactly once', async () => {
  assert.equal(storydateCharacters.length, 9);
  for (let i = 1; i <= 9; i++) assert.ok(storydateCharacters.some(c => c.id === 'sgc-' + String(i).padStart(3, '0')));
  assert.equal(new Set(siteTitles.map(c => c.id)).size, siteTitles.length);
  for (const c of sanguoCharacters) {
    const title = storydateCharacters.find(t => t.id === c.id);
    assert.equal(title.type, 'character');
    assert.equal(title.image, c.image);
    await access(new URL('../dist' + c.image, import.meta.url));
  }
  const before = [{id: 'sgc-002', type: 'character', replaces: 'old-id', story_id: 'sg-002'}, {id: 'unrelated', title: 'Untouched'}];
  const merged = mergeSanguoCharacters(before);
  assert.equal(merged[0].replaces, 'old-id');
  assert.equal(merged[0].story_id, 'sg-002');
  assert.deepEqual(merged[1], before[1]);
});

for (const c of sanguoCharacters) test(`${c.title}: server canon uses the adopted persona and a distinct conversation opening`, async () => {
  const role = roleFor(c.id);
  const source = JSON.parse(await readFile(new URL('../../' + role.source.file, import.meta.url), 'utf8'));
  assert.deepEqual(role.character.persona, source.chars[c.key].persona);
  assert.equal(role.character.romanceEnabled, source.chars[c.key].romance);
  assert.equal(role.mode, 'character');
  assert.deepEqual(role.scene.opening, c.opening);
  assert.ok(role.character.voice.drive.length > 25);
  assert.ok(role.character.voice.rhythm.length > 25);
  const packet = buildPrompt({titleId: c.id, profile: {name: '小林', audience: 'Neutral'}, messages: [{role: 'user', content: '今天可以不谈天下吗？'}]});
  assert.equal(packet.mode, 'character');
  assert.match(packet.system, /No campaign state is imported/);
  assert.match(packet.system, /independent adult visitor/);
  assert.ok(packet.system.includes(JSON.stringify(c.opening.zh)));
  assert.ok(packet.system.includes('小林'));
  assert.doesNotMatch(packet.system, /Ashley|Lumencia/);
  const suggestions = suggestionPrompt({titleId: c.id, messages: [{role: 'assistant', content: c.opening.zh}]});
  const canon = JSON.parse(suggestions.messages[0].content).canon;
  assert.equal(canon.character.name, c.title);
  role.character.persona.zh = 'changed by a caller';
  assert.notEqual(roleFor(c.id).character.persona.zh, role.character.persona.zh);
  for (const lang of ['zh', 'en']) {
    assert.equal(c.starters[lang].length, 3);
    assert.equal(new Set(c.starters[lang]).size, 3);
    assert.ok(c.starters[lang].every(s => s.length >= 8 && s.length <= 120));
  }
});

test('character hub lists six adopted profiles, preserves other characters, and resumes only character chats', () => {
  const values = new Map([
    ['ooc-history', ['three-kingdoms', 'sgc-009', 'sgc-002', 'sgc-002']],
    ['ooc-session-v2-three-kingdoms', {'campaign.cur': 'main-story'}],
    ['ooc-session-v2-sgc-009', [{role: 'user', text: '还没吃饭。'}]],
    ['ooc-favorites', ['sgc-009']]
  ]);
  const html = characterHubMarkup(storydateCharacters, {lang: 'zh', read: readFrom(values)});
  const {document} = parseHTML(html);
  assert.equal(document.querySelectorAll('[data-character-id]').length, 9);
  assert.equal(document.querySelectorAll('.sg-character-recent a').length, 1);
  assert.equal(document.querySelector('.sg-character-recent a').getAttribute('href'), '/play/sgc-009');
  assert.equal(document.querySelector('[data-character-bookmark="sgc-009"]').getAttribute('aria-pressed'), 'true');
  assert.match(document.querySelector('[data-character-id="sgc-009"]').textContent, /继续对话/);
  assert.ok(!document.querySelector('a[href="/play/three-kingdoms"]'));
  assert.doesNotMatch(html, /ooc\.ai|plays|排行榜/);
});

test('both language variants show the right opening and preserve the identity of the chat target', () => {
  for (const [id, c] of characterById) for (const lang of ['zh', 'en']) {
    const {document} = parseHTML(characterDetailMarkup(c, lang));
    assert.equal(document.querySelector('h1').textContent, lang === 'zh' ? c.title_zh : c.title);
    assert.equal(document.querySelector('.sg-person-chat').getAttribute('href'), '/play/' + id);
    assert.equal(document.querySelectorAll('.sg-conversation-topics li').length, 3);
    assert.ok(document.querySelector('.sg-character-opening').textContent.length > 45);
  }
});
