const tokens = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
export function usageRecord({requestId, provider, model, attempt, task, usage, outcome}) {
  const input = tokens(usage?.inputTokens), output = tokens(usage?.outputTokens);
  const cached = tokens(usage?.inputTokenDetails?.cacheReadTokens);
  return {
    event: 'ai_usage', requestId,
    provider: typeof provider === 'string' ? provider.slice(0, 60) : null,
    model: typeof model === 'string' ? model.slice(0, 100) : null,
    attempt, task: ['chat', 'suggestions', 'author'].includes(task) ? task : 'chat',
    outcome: ['completed', 'failed', 'cancelled'].includes(outcome) ? outcome : 'failed',
    inputTokens: input, outputTokens: output,
    cachedInputTokens: cached !== null && input !== null && cached <= input ? cached : null,
    reasoningTokens: tokens(usage?.outputTokenDetails?.reasoningTokens)
  };
}
// Verified 2026-11-12: https://api-docs.deepseek.com/quick_start/pricing/
// Peak rates give a conservative estimate. Not a provider invoice or a retail price.
export function estimateUsage(row) {
  if (row?.provider !== 'deepseek' || row.model !== 'deepseek-flash' || tokens(row.inputTokens) === null || tokens(row.outputTokens) === null) return null;
  const hit = tokens(row.cachedInputTokens), cached = hit !== null && hit <= row.inputTokens ? hit : 0;
  return {usd: ((row.inputTokens - cached) * 0.3 + cached * 0.006 + row.outputTokens * 1.2) / 1000000,
    assumption: 'deepseek-flash peak rates, unknown cache treated as miss', verified: '2026-11-12'};
}
