import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {translate, getLang} from '../dist/assets/site-i18n.js';
import announcements from '../dist/assets/announcements.js';

test('interface strings switch both ways; captured OOC branding never shows', () => {
  assert.equal(translate('Top Ranked', 'zh'), '热门榜');
  assert.equal(translate('热门榜', 'en'), 'Top Ranked');
  assert.equal(translate('  Continue with Google ', 'zh'), '  使用 Google 继续 ');
  assert.equal(translate('OOC Originals', 'en'), 'StoryDate Originals');
  assert.equal(translate('© 2026 New AI Entertainment Inc. All rights reserved.', 'en'), '© 2026 StoryDate. All rights reserved.');
  assert.equal(translate('24 stories', 'zh'), '24 个故事');
  assert.equal(translate('#SliceOfLife', 'zh'), '#日常');
  assert.equal(translate('#恋爱', 'en'), '#Romance');
  assert.equal(translate('三国演义 · 谋士', 'en'), 'Three Kingdoms: The Strategist');
  assert.equal(translate('Some creator story title', 'zh'), 'Some creator story title');
});

test('our notices replace the captured ones and carry both languages', () => {
  assert.ok(announcements.items.length >= 1);
  for (const a of announcements.items) {
    assert.ok(a.href.startsWith('/announcement/sd-'));
    assert.ok(a.title && a.title_zh && a.body && a.body_zh);
    assert.equal(translate(a.title, 'zh'), a.title_zh);
  }
  assert.ok(!JSON.stringify(announcements).includes('ooc'));
});

test('language defaults to the browser until the visitor picks', () => {
  const ls = v => ({getItem: () => v});
  assert.equal(getLang({localStorage: ls(null), navigator: {language: 'zh-TW'}}), 'zh');
  assert.equal(getLang({localStorage: ls('en'), navigator: {language: 'zh-TW'}}), 'en');
  assert.equal(getLang({localStorage: ls(null), navigator: {language: 'fr'}}), 'en');
});
