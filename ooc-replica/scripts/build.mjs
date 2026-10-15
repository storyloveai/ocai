import { build } from 'esbuild';
await build({ entryPoints: ['src/firebase-client.js'], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, outfile: 'dist/assets/firebase-client.js' });
