import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';

async function rulesFor(name) {
  const {document} = parseHTML('<html><head></head><body></body></html>');
  const style = document.createElement('style');
  style.textContent = await readFile(new URL('../dist/assets/'+name,import.meta.url),'utf8');
  document.head.append(style);
  return [...style.sheet.cssRules];
}
const rule = (rules,selector) => rules.find(r=>r.selectorText === selector).style;

test('the mode selector fits its displayed label and the reading surfaces share one width', async () => {
  const styles = await rulesFor('character-reading.css');
  const mode = rule(styles,'.character-session-actions [data-control=model]');
  for (const [key,width] of [['width','auto'],['min-width','108px'],['max-width','200px'],['white-space','nowrap']]) {
    assert.equal(mode.getPropertyValue(key),width);
  }
  assert.match(rule(styles,'.character-reading').getPropertyValue('--chat-reading-width'),/740px/);
  for (const s of ['.character-reading .session-messages','.character-reading .character-composer-wrap','.character-conversation-tools']) {
    assert.equal(rule(styles,s).getPropertyValue('width'),'var(--chat-reading-width)');
  }
  assert.equal(rule(styles,'.character-reading .character-composer-wrap').getPropertyValue('flex-grow'),'0');
  const interaction = await rulesFor('interaction.css');
  assert.equal(rule(interaction,'.xc-chat-bridge').getPropertyValue('width'),'var(--chat-reading-width)');
  assert.equal(rule(interaction,'.xc-chat-story p').getPropertyValue('text-overflow'),'ellipsis');
  assert.equal(rule(interaction,'.xc-chat-story a').getPropertyValue('border-radius'),'8px');
  const phone = interaction.find(r=>r.media?.mediaText==='(max-width:767px)' && [...r.cssRules].some(s=>s.selectorText==='.character-reading .session-suggestions'));
  assert.equal(rule([...phone.cssRules],'.character-reading .session-suggestions').getPropertyValue('overflow-x'),'auto');
  assert.equal(rule([...phone.cssRules],'.character-reading .session-suggestions button').getPropertyValue('min-height'),'44px');
});

test('the guest account hint is normal-flow muted text', async () => {
  const hint = rule(await rulesFor('site-shell.css'),'.shell-signin-note');
  assert.equal(hint.getPropertyValue('position'),'');
  assert.equal(hint.getPropertyValue('transform'),'');
  assert.equal(hint.getPropertyValue('color'),'#8e8e93');
});
