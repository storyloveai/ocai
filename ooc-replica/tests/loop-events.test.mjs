import test from 'node:test';
import assert from 'node:assert/strict';
import {chatAttempt, xichuanAction, consumeStoryReturn} from '../dist/assets/loop-events.js';
import {usageRecord, estimateUsage} from '../server/usage-meter.js';
test('chat success and failure are separate from sending, emitted once without text', () => {
  const sent = [], send = (n, p) => sent.push([n, p]); let time = 100;
  const a = chatAttempt('xc-zhiyao', 'ai', send, () => time);
  time = 200; a.receivedText(); a.receivedText(); time = 300; a.finish('completed'); a.finish('failed', 'secret');
  assert.deepEqual(sent.map(x => x[0]), ['chat_reply_started', 'chat_reply_completed']);
  assert.equal(sent[1][1].duration_ms, 200);
  const b = chatAttempt('xc-zhiyao', 'ai', send); b.finish('failed', 'raw private service error');
  assert.equal(sent.at(-1)[1].error_code, null);
  const c = chatAttempt('xc-zhiyao', 'ai', send); c.finish('cancelled');
  assert.equal(sent.at(-1)[0], 'chat_reply_cancelled');
  assert.doesNotMatch(JSON.stringify(sent), /secret|private/);
});
test('game actions use explicit user actions and fixed IDs, dropping extra payloads', () => {
  const sent = [], send = (...v) => sent.push(v);
  assert.equal(xichuanAction({action: 'choice', node: 'c1_fair', choice: 'join', text: 'private words'}, send), true);
  assert.equal(xichuanAction({action: 'resume', node: 'p_return'}, send), true);
  assert.equal(xichuanAction({action: 'start', node: 'p_return'}, send), true);
  assert.equal(xichuanAction({action: 'choice', node: 'bad node', choice: 'x'}, send), false);
  assert.equal(xichuanAction({action: 'private words'}, send), false);
  assert.deepEqual(sent.map(x => x[0]), ['xichuan_choice_selected', 'xichuan_game_resumed', 'game_run_started']);
  assert.doesNotMatch(JSON.stringify(sent), /private words/);
});
test('return to chat is a consumed navigation marker, not every refresh with an existing save', () => {
  const location = {href: 'https://test.example/play/xc-zhiyao?from=xichuan&encounter=cinema#top'};
  const history = {state: {}, replaceState(s, t, path) {location.href = 'https://test.example' + path;}};
  assert.equal(consumeStoryReturn(location, history), true);
  assert.equal(location.href, 'https://test.example/play/xc-zhiyao?encounter=cinema#top');
  assert.equal(consumeStoryReturn(location, history), false);
});
test('usage records use the installed SDK token fields; unknown usage never becomes zero', () => {
  const row = usageRecord({requestId: 'a', provider: 'deepseek', model: 'deepseek-flash', attempt: 1, task: 'chat', outcome: 'completed',
    usage: {inputTokens: 10000, inputTokenDetails: {cacheReadTokens: 0}, outputTokens: 500, outputTokenDetails: {reasoningTokens: 40}, raw: {text: 'private'}}});
  assert.equal(row.reasoningTokens, 40); assert.equal(estimateUsage(row).usd, 0.0036);
  assert.doesNotMatch(JSON.stringify(row), /private/);
  assert.equal(estimateUsage({...row, model: 'unknown'}), null);
  assert.equal(estimateUsage(usageRecord({provider: 'deepseek', model: 'deepseek-flash', outcome: 'cancelled'})), null);
  assert.equal(estimateUsage({...row, cachedInputTokens: 10000}).usd, 0.00066);
});
