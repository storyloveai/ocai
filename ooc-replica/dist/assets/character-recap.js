const excerpt = (value, limit) => {
  const points = Array.from(String(value || '').trim());
  return points.length > limit ? points.slice(0, limit).join('') + '…' : points.join('');
};
const complete = m => m && ['user', 'assistant'].includes(m.role) && typeof m.text === 'string' && m.text.trim() && !m.failed && !m.streaming && !m.stopped;

// A view over this branch's actual dialogue. No new inferred story, model
// request, relationship score, save operation or cross-branch lookup.
export function characterRecap({messages, pins = []}) {
  const remembered = pins.filter(p => Number.isInteger(p.turn) && p.turn >= 0 && complete(messages[p.turn]) &&
    messages[p.turn].role === p.role && typeof p.text === 'string' && messages[p.turn].text.startsWith(p.text))
    .slice(0, 6).sort((a, b) => a.turn - b.turn).map(p => ({turn: p.turn, role: p.role, text: excerpt(p.text, 200)}));
  let last = messages.length - 1;
  while (last >= 0 && !(messages[last]?.role === 'assistant' && complete(messages[last]))) last--;
  const recent = [];
  if (last >= 0 && messages[last - 1]?.role === 'user' && complete(messages[last - 1])) {
    recent.push({turn: last - 1, role: 'user', text: excerpt(messages[last - 1].text, 240)});
    recent.push({turn: last, role: 'assistant', text: excerpt(messages[last].text, 480)});
  }
  return {remembered, recent, hasConversation: recent.length > 0};
}
