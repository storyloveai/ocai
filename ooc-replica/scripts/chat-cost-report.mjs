import {readFile} from 'node:fs/promises';
import {estimateUsage} from '../server/usage-meter.js';
const path = process.argv[2];
if (!path) {console.error('Usage: node scripts/chat-cost-report.mjs /path/to/sanitized-usage.jsonl'); process.exit(2);}
let malformedLines = 0;
const rows = (await readFile(path, 'utf8')).split('\n').filter(line => line.trim()).flatMap(line => {try {const r = JSON.parse(line); return r?.event === 'ai_usage' ? [r] : [];} catch {malformedLines++; return [];}});
const groups = {}, requestIds = new Set(); let total = 0, unknown = 0;
for (const row of rows) {
  requestIds.add(row.requestId);
  const group = groups[['chat', 'suggestions', 'author'].includes(row.task) ? row.task : 'unknown'] ||= {attempts: 0, estimatedAttempts: 0, unknownAttempts: 0, estimatedUsd: 0};
  group.attempts++;
  const estimate = estimateUsage(row);
  if (estimate) {total += estimate.usd; group.estimatedAttempts++; group.estimatedUsd += estimate.usd;} else {unknown++; group.unknownAttempts++;}
}
console.log(JSON.stringify({pricingVerified: '2026-11-12', source: 'https://api-docs.deepseek.com/quick_start/pricing/',
  requests: requestIds.size, attempts: rows.length, estimatedUsd: total, unknownAttempts: unknown, malformedLines, completeEstimate: unknown === 0 && malformedLines === 0 && rows.length > 0,
  assumptions: 'DeepSeek Flash peak rates; unknown cache treated as miss. Unknown models, failures without usage and fallback attempts remain unpriced. Excludes hosting, storage, payment fees and taxes. No chat text or account IDs are printed.', groups}, null, 2));
