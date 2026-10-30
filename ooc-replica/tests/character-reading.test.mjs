import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {markdown} from '../dist/assets/stream.js';
import {balanceCharacterAction, characterReadingHTML} from '../dist/assets/character-reading.js';

const render = source => parseHTML(characterReadingHTML(markdown(balanceCharacterAction(source)), source)).document;
test('quoted speech and physical action retain separate readable layers in Chinese and English', () => {
  for (const source of ['*他将信推近一些。*\n\n“这次，你先决定。”', '*She sets down the photograph.*\n\n"You can keep the tear, if you want."']) {
    const document = render(source);
    assert.ok(document.querySelector('.character-prose[data-no-i18n]'));
    assert.ok(document.querySelector('em .character-narration'));
    assert.ok(document.querySelector('.character-spoken'));
    assert.equal(document.querySelector('.character-prose').textContent.replace(/\s/g, ''), source.replace(/[\s*]/g, ''));
  }
});
test('speech inside an action paragraph stays speech; code and generated attributes remain intact', () => {
  const document = render('*她问：“这道裂痕，要留下吗？”*\n\n```js\nconst value = "a*b";\n```');
  assert.match([...document.querySelectorAll('.character-spoken')].map(e => e.textContent).join(''), /要留下吗/);
  assert.equal(document.querySelector('code').textContent.trim(), 'const value = "a*b";');
  assert.equal(document.querySelector('code .character-spoken'), null);
  const html = characterReadingHTML('<p title="a quoted attribute">“Hello.”</p>', '“Hello.”');
  assert.equal(parseHTML(html).document.querySelector('p').getAttribute('title'), 'a quoted attribute');
});
test('streamed prefixes preserve all spoken characters and keep an open action italic', () => {
  const source = '*他停了停。*\n\n“我没拆。你想先说什么？”';
  let prefix = '';
  for (const letter of source) {
    prefix += letter;
    const document = render(prefix);
    assert.equal(document.querySelector('.character-prose').textContent.replace(/\s/g, ''), prefix.replace(/[\s*]/g, ''));
  }
  assert.ok(render('*他停在门边').querySelector('em'));
  assert.equal(render('“还没说完').querySelector('.character-prose').textContent, '“还没说完');
});
test('escaped markup cannot become executable or inject reading-layer attributes', () => {
  const source = '*<img src=x onerror=alert(1)>*\n\n“</span><script>alert(2)</script>”';
  const document = render(source);
  assert.equal(document.querySelector('script,img,[onerror]'), null);
  assert.match(document.querySelector('.character-prose').textContent, /<script>alert\(2\)<\/script>/);
});
test('an unquoted direct reply stays ordinary readable prose', () => {
  const document = render('Take your time. I am listening.');
  assert.equal(document.querySelector('.character-spoken,.character-narration'), null);
  assert.equal(document.querySelector('.character-prose').textContent, 'Take your time. I am listening.');
});
