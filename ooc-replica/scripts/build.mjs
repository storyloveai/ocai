import {buildThreeKingdoms} from '../three-kingdoms/build.mjs';
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Decode captured image payloads once during the build, not in every browser.
// Original captures remain intact; runtime indexes contain only cacheable URLs.
await mkdir('dist/assets/media', { recursive: true });
for (const name of ['core-assets', 'catalog-assets']) {
  const source = JSON.parse(await readFile(`dist/assets/${name}.json`, 'utf8'));
  const index = {};
  for (const [url, value] of Object.entries(source)) {
    const match = /^data:image\/(webp|png|jpeg|gif|svg\+xml|avif);base64,(.+)$/s.exec(value);
    if (!match) { index[url] = value; continue; }
    const bytes = Buffer.from(match[2], 'base64');
    const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 24);
    const extension = match[1] === 'svg+xml' ? 'svg' : match[1] === 'jpeg' ? 'jpg' : match[1];
    const path = `/assets/media/${digest}.${extension}`;
    await writeFile(`dist${path}`, bytes);
    index[url] = path;
  }
  await writeFile(`dist/assets/${name}-index.json`, JSON.stringify(index));
}
await build({ entryPoints: ['src/firebase-client.js'], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, outfile: 'dist/assets/firebase-client.js' });

await build({ entryPoints: ['src/checkout.js'], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, outfile: 'dist/assets/checkout.js' });

await buildThreeKingdoms();
