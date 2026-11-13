const tokens = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
export const USAGE_TASKS = ['chat', 'suggestions', 'author', 'game.understand', 'game.express', 'image'];
export function usageRecord({requestId, provider, model, attempt, task, usage, outcome, durationMs, imageCount, game}) {
  const input = tokens(usage?.inputTokens), output = tokens(usage?.outputTokens);
  const cached = tokens(usage?.inputTokenDetails?.cacheReadTokens);
  return {
    event: 'ai_usage', requestId,
    provider: typeof provider === 'string' ? provider.slice(0, 60) : null,
    model: typeof model === 'string' ? model.slice(0, 100) : null,
    attempt, task: USAGE_TASKS.includes(task) ? task : 'unknown',
    outcome: ['completed', 'failed', 'cancelled'].includes(outcome) ? outcome : 'failed',
    inputTokens: input, outputTokens: output,
    cachedInputTokens: cached !== null && input !== null && cached <= input ? cached : null,
    reasoningTokens: tokens(usage?.outputTokenDetails?.reasoningTokens),
    durationMs: tokens(durationMs),
    imageCount: task === 'image' ? tokens(imageCount) : null,
    game: ['xichuan', 'sanguo', 'three-kingdoms', 'mortal-path', 'monte-cristo'].includes(game) ? game : null
  };
}
export const logUsage = details => console.info(JSON.stringify(usageRecord(details)));
// Failed streams can reject their usage promise. Do not delay release/response
// indefinitely or turn an unavailable provider reading into zero tokens.
export async function resultUsage(result) {
  let timer;
  try {
    const value = result?.totalUsage ?? result?.usage;
    if (!value) return undefined;
    return await Promise.race([
      Promise.resolve(value).catch(() => undefined),
      new Promise(resolve => { timer = setTimeout(resolve, 250); })
    ]);
  } catch { return undefined; }
  finally { clearTimeout(timer); }
}
// Verified 2026-11-12: https://api-docs.deepseek.com/quick_start/pricing/
// Peak rates give a conservative estimate. Not a provider invoice or a retail price.
export function estimateUsage(row) {
  if (row?.task === 'image' || row?.provider !== 'deepseek' || row.model !== 'deepseek-flash' || tokens(row.inputTokens) === null || tokens(row.outputTokens) === null) return null;
  const hit = tokens(row.cachedInputTokens), cached = hit !== null && hit <= row.inputTokens ? hit : 0;
  return {usd: ((row.inputTokens - cached) * 0.3 + cached * 0.006 + row.outputTokens * 1.2) / 1000000,
    assumption: 'deepseek-flash peak rates, unknown cache treated as miss', verified: '2026-11-12'};
}

export function summarizeUsage(rows, {malformedLines = 0} = {}) {
  const groups = {}, seen = new Map(), requestIds = new Set();
  let attempts = 0, total = 0, unknown = 0, duplicateRows = 0, conflictingRows = 0, missingRequestIds = 0;
  for (const row of rows) {
    if (row?.event !== 'ai_usage') continue;
    const hasId = typeof row.requestId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(row.requestId);
    const validAttempt = Number.isSafeInteger(row.attempt) && row.attempt > 0;
    const task = USAGE_TASKS.includes(row.task) ? row.task : 'unknown';
    const outcome = ['completed', 'failed', 'cancelled'].includes(row.outcome) ? row.outcome : 'unknown';
    const reading = JSON.stringify([task, row.provider, row.model, outcome, row.inputTokens, row.outputTokens, row.cachedInputTokens, row.imageCount]);
    if (hasId && validAttempt) {
      const key = `${row.requestId}:${row.attempt}`;
      if (seen.has(key)) {
        if (seen.get(key) === reading) duplicateRows++;
        else conflictingRows++;
        continue;
      }
      seen.set(key, reading);
    } else missingRequestIds++;
    if (hasId) requestIds.add(row.requestId);
    attempts++;
    const group = groups[task] ||= {attempts: 0, completed: 0, failed: 0, cancelled: 0, unknown: 0, estimatedAttempts: 0, unknownAttempts: 0, estimatedUsd: 0, images: 0};
    group.attempts++; group[outcome]++;
    if (task === 'image' && tokens(row.imageCount) !== null) group.images += row.imageCount;
    const estimate = task !== 'unknown' && outcome !== 'unknown' ? estimateUsage(row) : null;
    if (estimate) { total += estimate.usd; group.estimatedAttempts++; group.estimatedUsd += estimate.usd; }
    else { unknown++; group.unknownAttempts++; }
  }
  return {pricingVerified: '2026-11-12', source: 'https://api-docs.deepseek.com/quick_start/pricing/',
    requests: requestIds.size, attempts, estimatedUsd: total, unknownAttempts: unknown, malformedLines, duplicateRows, conflictingRows, missingRequestIds,
    completeEstimate: attempts > 0 && unknown === 0 && malformedLines === 0 && conflictingRows === 0 && missingRequestIds === 0,
    assumptions: 'Known-cost subtotal at the dated DeepSeek Flash peak rates; not current pricing or an invoice. Unknown cache is a miss. Images, unknown models and attempts without usage remain unpriced, never free. Includes failed/cancelled attempts with known usage. Excludes hosting, storage, payment fees and taxes. No conversation, image bytes or account IDs are printed.', groups};
}
