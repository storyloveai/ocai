import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { interludeDraft, resolveChoice } from '../dist/assets/living-manga/episode.js';
import source from '../dist/assets/living-manga/episodes/sanguo-plum.js';

const episode = JSON.parse(JSON.stringify(source));
const dist = new URL('../dist/', import.meta.url);
const bilingual = value => {
  for (const lang of ['zh', 'en']) assert.ok(value?.[lang]?.trim(), 'missing ' + lang + ' copy');
};

test('a JSON-only episode carries five original paintings, reusable camera crops and bilingual panels', () => {
  assert.deepEqual(episode, source);
  bilingual(episode.title);
  bilingual(episode.subtitle);
  bilingual(episode.decision.prompt);
  bilingual(episode.decision.freeInput.placeholder);
  assert.equal(episode.theme, 'color');
  const art = Object.values(episode.assets);
  assert.equal(new Set(art.map(asset => asset.image)).size, 5);
  assert.equal(new Set(art.map(asset => asset.depth)).size, 5);
  for (const { image, depth, crop: [x, y, width, height], strength, alt } of art) {
    bilingual(alt);
    assert.match(image, /^\/assets\/sanguo-art\/(cg|scenes)\//);
    assert.ok(existsSync(new URL(image.slice(1), dist)), image);
    assert.match(depth, /^\/assets\/living-manga\/depth\/\w+_depth\.webp$/);
    const bytes = readFileSync(new URL(depth.slice(1), dist));
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.ok(bytes.length >= 20_000 && bytes.length <= 45 * 1024, depth + ': ' + bytes.length);
    assert.ok(x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= 1 && y + height <= 1);
    assert.ok(strength > 0);
  }
  assert.deepEqual(episode.openingRows.map(row => [row.layout, row.panels.length]), [['cols-1', 1], ['cols-2-asym', 2]]);
  const [wide, cut, flash] = episode.openingRows.flatMap(row => row.panels);
  assert.ok(wide.fx.includes('rain'));
  assert.ok(flash.fx.includes('lightning'));
  const closeUp = episode.assets[cut.scene];
  const fullShot = episode.assets[flash.scene];
  assert.equal(closeUp.image, fullShot.image);
  assert.equal(closeUp.depth, fullShot.depth);
  assert.notDeepEqual(closeUp.crop, fullShot.crop);
  for (const panel of [wide, cut, flash, ...Object.values(episode.branches).flatMap(branch => branch.reactionPanels)]) {
    assert.ok(episode.assets[panel.scene]);
    for (const overlay of panel.overlays) {
      assert.ok(Number.isFinite(overlay.z));
      if (overlay.speaker) bilingual(overlay.speaker);
      if (overlay.type !== 'player-bubble') bilingual(overlay.text);
    }
  }
});

test('each preset produces its localized first-person line, two new panels and suitable interludes', () => {
  const characterIds = {
    cover: ['sgc-002', 'sgc-003'],
    speak: ['sgc-002', 'sgc-003'],
    still: ['sgc-001', 'sgc-003'],
  };
  assert.equal(episode.decision.options.length, 3);
  for (const option of episode.decision.options) {
    bilingual(option.label);
    bilingual(option.playerText);
    for (const lang of ['zh', 'en']) {
      const choice = resolveChoice(episode, { optionId: option.id }, lang);
      assert.deepEqual(choice, { branchId: option.branchId, playerText: option.playerText[lang] });
    }
    assert.deepEqual(episode.branches[option.branchId].interlude.map(entry => entry.characterId), characterIds[option.id]);
  }
  for (const branch of Object.values(episode.branches)) {
    assert.equal(branch.reactionPanels.length, 2);
    assert.ok(branch.reactionPanels[0].overlays.some(layer => layer.type === 'player-bubble'));
    assert.ok(['lamp', 'letter'].includes(branch.reactionPanels[1].scene));
    assert.ok(branch.consequenceTags.length);
    branch.consequenceTags.forEach(bilingual);
    assert.ok(branch.interlude.length >= 1 && branch.interlude.length <= 2);
    for (const entry of branch.interlude) {
      assert.ok(['sgc-001', 'sgc-002', 'sgc-003'].includes(entry.characterId));
      bilingual(entry.label);
      bilingual(entry.draft);
    }
  }
});

test('local intent rules hear both languages independently of the selected language', () => {
  const utterances = [
    ['warn_liu', ['主公快走！', '离开许都', '使君早些走。', 'My lord, leave Xuchang.', 'ＧＥＴ ＯＵＴ now!']],
    ['hero_liu', ['刘使君才是真英雄', '真正的英雄是玄德。', 'Liu Bei is the real hero.', 'My lord is the true hero.']],
    ['challenge', ['曹公何必试探？', '丞相为何这样相试？', 'Why test us, Chancellor?', 'Cao Cao, why are you testing him?']],
    ['custom', ['再温一盏如何？', '刘备不是英雄', '不要离开许都', 'Don’t leave Xuchang!', 'There is rain on my sleeve.']],
  ];
  for (const [branchId, lines] of utterances) {
    for (const line of lines) {
      for (const lang of ['zh', 'en']) {
        assert.deepEqual(resolveChoice(episode, { text: ' ' + line + ' ' }, lang), { branchId, playerText: line });
      }
    }
  }
});

test('unmatched text survives unchanged in the player panel and in a URL-encoded chat draft', () => {
  const line = '<b>听雨</b> & "$&" {playerText}?\n🌧';
  const choice = resolveChoice(episode, { text: line }, 'en');
  assert.deepEqual(choice, { branchId: 'custom', playerText: line });
  for (const entry of episode.branches.custom.interlude) {
    for (const lang of ['zh', 'en']) {
      const draft = interludeDraft(entry, choice, lang);
      assert.ok(draft.includes(line));
      const params = new URLSearchParams({ draft });
      assert.equal(new URLSearchParams(params.toString()).get('draft'), draft);
    }
  }
});

test('a different JSON episode supplies its own option, rule priorities, fallback, and input limit', () => {
  const other = JSON.parse(JSON.stringify({
    decision: {
      options: [{ id: 'wait', branchId: 'platform', playerText: { zh: '等车。', en: 'I wait.' } }],
      freeInput: {
        maxLength: 30,
        rules: [{ pattern: 'night train', branchId: 'sleeper' }, { pattern: 'train', branchId: 'platform' }],
        fallbackBranchId: 'station',
      },
    },
    branches: { platform: {}, sleeper: {}, station: {} },
  }));
  assert.deepEqual(resolveChoice(other, { optionId: 'wait', text: 'ignored' }, 'en'), { branchId: 'platform', playerText: 'I wait.' });
  assert.deepEqual(resolveChoice(other, { text: ' Night   train? ' }), { branchId: 'sleeper', playerText: 'Night   train?' });
  assert.equal(resolveChoice(other, { text: 'Train' }).branchId, 'platform');
  assert.equal(resolveChoice(other, { text: '主公快走' }).branchId, 'station');
  for (const input of [null, { text: 100 }, { text: ' \n ' }, { optionId: 'invalid' }, { text: 'a'.repeat(31) }]) {
    assert.equal(resolveChoice(other, input), null);
  }
  assert.equal(resolveChoice(other, { text: 'a'.repeat(30) }).playerText.length, 30);
});
