import {readFile} from 'node:fs/promises';
import {summarizeUsage} from '../server/usage-meter.js';
const path = process.argv[2];
if (!path) {console.error('Usage: node scripts/chat-cost-report.mjs /path/to/sanitized-usage.jsonl'); process.exit(2);}
let malformedLines = 0;
const rows = (await readFile(path, 'utf8')).split('\n').filter(line => line.trim()).flatMap(line => {try {const r = JSON.parse(line); return r?.event === 'ai_usage' ? [r] : [];} catch {malformedLines++; return [];}});
console.log(JSON.stringify(summarizeUsage(rows, {malformedLines}), null, 2));
