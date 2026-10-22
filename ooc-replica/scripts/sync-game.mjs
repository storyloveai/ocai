#!/usr/bin/env node
// Copy the gameplay files the website uses from game/ into ooc-replica/, so the Vercel build
// (which only sees ooc-replica/) gets the current engine and Three Kingdoms build.
//   node scripts/sync-game.mjs          copy and rewrite sanguo/upstream/manifest.json
//   node scripts/sync-game.mjs --check  exit 1 if any copy differs from game/ (used by CI)
// Never edit the copies by hand: change game/, then run this.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const site = new URL('../', import.meta.url), repo = new URL('../', site);
const FILES = [
  ['game/sanguo/web/index.html', 'sanguo/upstream/index.html'],
  ['game/sanguo/web/illus.html', 'sanguo/upstream/illus.html'],
  ['game/sanguo/content/campaign.json', 'sanguo/upstream/campaign.json'],
  ['game/sanguo/content/v2/campaign_v2.json', 'sanguo/upstream/campaign_v2.json'],
  ['game/sanguo/content/v3/campaign_v3.json', 'sanguo/upstream/campaign_v3.json'],
  ['game/engine/campaign_core.js', 'sanguo/upstream/campaign_core.js'],
  ['game/engine/campaign_core.js', 'book-campaigns/engine/campaign_core.js'],
];
// The illustrated edition's pictures, served to the site at /assets/sanguo-art/.
for (const dir of ['portraits', 'scenes', 'cg', 'ending']) {
  const names = await readdir(new URL(`game/sanguo/art/${dir}/`, repo)).catch(() => []);
  for (const name of names.filter(n => n.endsWith('.webp')).sort()) FILES.push([`game/sanguo/art/${dir}/${name}`, `dist/assets/sanguo-art/${dir}/${name}`]);
}
for (const name of ['cover.webp']) if (await readFile(new URL(`game/sanguo/art/${name}`, repo)).catch(() => null)) FILES.push([`game/sanguo/art/${name}`, `dist/assets/sanguo-art/${name}`]);
const blob = b => createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex');
const check = process.argv.includes('--check');
let drift = 0;
for (const [from, to] of FILES) {
  const src = await readFile(new URL(from, repo)), dst = await readFile(new URL(to, site)).catch(() => null);
  if (dst && Buffer.compare(src, dst) === 0) continue;
  if (check) { console.error(`out of date: ooc-replica/${to} (from ${from})`); drift++; continue; }
  await mkdir(new URL('.', new URL(to, site)), { recursive: true });
  await writeFile(new URL(to, site), src); console.log(`updated ooc-replica/${to}`);
}
if (check) {
  if (drift) { console.error('Run `node ooc-replica/scripts/sync-game.mjs` and commit the copies.'); process.exit(1); }
  console.log('game copies are up to date');
} else {
  let commit = 'unknown';
  try { commit = execFileSync('git', ['log', '-1', '--format=%H', '--', 'game'], { cwd: new URL('.', repo) }).toString().trim(); } catch {}
  const blobs = {};
  for (const [, to] of FILES.filter(([, t]) => t.startsWith('sanguo/upstream/'))) blobs[to.split('/').pop()] = blob(await readFile(new URL(to, site)));
  await writeFile(new URL('sanguo/upstream/manifest.json', site), JSON.stringify({ commit, blobs }, null, 2));
}
