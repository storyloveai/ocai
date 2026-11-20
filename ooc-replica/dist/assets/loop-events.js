import {track} from './analytics.js';
const id = value => typeof value === 'string' && /^[a-zA-Z0-9_.-]{1,80}$/.test(value) ? value : null;
// Events contain outcomes and timing only; no prompts, replies, notes, or save contents.
export function chatAttempt(titleId, transport, send = track, now = Date.now) {
  const base = {title_id: id(titleId), transport: transport === 'ai' ? 'ai' : 'demo'}, started = now();
  let first = false, finished = false;
  return {
    receivedText() {if (first || finished) return; first = true; send('chat_reply_started', {...base, latency_ms: Math.max(0, now() - started)});},
    finish(outcome, code) {
      if (finished || !['completed', 'failed', 'cancelled'].includes(outcome)) return;
      finished = true;
      const error = ['AI_NOT_CONFIGURED', 'AI_TIMEOUT', 'AI_RATE_LIMIT', 'AI_INTERRUPTED', 'AI_AUTH', 'AI_BALANCE', 'AI_REQUEST', 'AI_UPSTREAM', 'AI_EMPTY_RESPONSE', 'AI_REASONING_ONLY', 'AI_OUTPUT_BUDGET'].includes(code) ? code : null;
      send('chat_reply_' + outcome, {...base, duration_ms: Math.max(0, now() - started), partial: first, ...(outcome === 'failed' ? {error_code: error} : {})});
    }
  };
}
export function xichuanAction(data, send = track) {
  if (!['start', 'resume', 'choice'].includes(data?.action)) return false;
  const node = data.node == null ? null : id(data.node), choice = data.action === 'choice' ? id(data.choice) : null;
  if (data.node != null && !node || data.action === 'choice' && (!node || !choice)) return false;
  send({start: 'game_run_started', resume: 'xichuan_game_resumed', choice: 'xichuan_choice_selected'}[data.action], {game: 'xichuan', node, ...(choice ? {choice} : {})});
  return true;
}
export function consumeStoryReturn(location, history) {
  const url = new URL(location.href);
  if (url.searchParams.get('from') !== 'xichuan') return false;
  url.searchParams.delete('from'); history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  return true;
}
