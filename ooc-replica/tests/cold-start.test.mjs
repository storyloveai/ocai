import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
// Vercel's loader does not support CommonJS require(ESM), even on Node 24.
test('API imports work without Node native require(ESM) support',()=>{
 const result=spawnSync(process.execPath,['--no-experimental-require-module','--input-type=module','-e',"await import('./api/config.js'); await import('./api/checkout.js'); await import('./api/webhook.js');"],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
