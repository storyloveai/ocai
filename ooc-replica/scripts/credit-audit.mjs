// Default is an offline plan. --scan is explicit, bounded and read-only.
import {readFile} from 'node:fs/promises';
import {createWalletReport, addWalletReport, finishWalletReport} from '../server/wallet-report.js';
const args = process.argv.slice(2);
const option = name => args.find(a => a.startsWith(name + '='))?.slice(name.length + 1);
const mode = option('--mode') || 'test', limit = Number(option('--max-wallets') || 1000), input = option('--input');
if (!['test', 'live'].includes(mode) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100000) throw Error('Invalid audit scope');
if (args.some(a => !['--scan', '--allow-live'].includes(a) && !['--mode=', '--max-wallets=', '--input='].some(p => a.startsWith(p)))) throw Error('Unknown audit option');
if (input && args.includes('--scan')) throw Error('Choose offline input or a remote scan');
const report = createWalletReport(); let truncated = false;
if (input) {
  const lines = (await readFile(input, 'utf8')).split('\n').filter(l => l.trim());
  truncated = lines.length > limit;
  for (const line of lines.slice(0, limit)) {
    let wallet; try { wallet = JSON.parse(line); } catch { throw Error('Invalid wallet JSONL; no source content printed'); }
    addWalletReport(report, wallet);
  }
} else if (args.includes('--scan')) {
  if (mode === 'live' && !args.includes('--allow-live')) throw Error('Live read requires --allow-live');
  const {firebaseServices} = await import('../server/firebase-admin.js');
  const {FieldPath} = await import('firebase-admin/firestore');
  const {db} = firebaseServices(); let cursor;
  while (report.accounts < limit) {
    const take = Math.min(200, limit - report.accounts);
    let query = db.collection(`replica-wallets-${mode}`).orderBy(FieldPath.documentId()).limit(take);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    for (const doc of page.docs) addWalletReport(report, doc.data());
    if (page.size < take) break;
    cursor = page.docs.at(-1);
    if (report.accounts === limit) truncated = true;
  }
} else {
  console.log(JSON.stringify({dryRun: true, mode, collection: `replica-wallets-${mode}`, maxWallets: limit, reads: 0, writes: 0,
    next: 'Use --input=/path/to/wallets.jsonl offline, or --scan for a bounded hosted read. Live additionally requires --allow-live. Remote reads can incur provider costs.'}, null, 2));
  process.exit(0);
}
console.log(JSON.stringify(finishWalletReport(report, {mode, truncated}), null, 2));
