import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {usageRecord, summarizeUsage, resultUsage} from '../server/usage-meter.js';
import {createWalletReport, addWalletReport, finishWalletReport} from '../server/wallet-report.js';
import {createCredits, digest} from '../server/credits.js';
import {PRICE_VERSION} from '../server/credit-policy.js';
import {database} from './helpers/credit-db.mjs';
const row = extra => usageRecord({requestId:'op-1', provider:'deepseek',model:'deepseek-flash',attempt:1,task:'game.understand',outcome:'completed',usage:{inputTokens:10000,outputTokens:500},...extra});
test('all generation tasks retain their category, and image units never borrow text pricing',()=>{
 const image=row({requestId:'op-3',task:'image',imageCount:1,provider:'openai',model:'image-fixture',usage:{inputTokens:800,outputTokens:2000},prompt:'private prompt',b64:'private image',uid:'private account'});
 const report=summarizeUsage([row(),row({requestId:'op-2',task:'game.express',outcome:'failed'}),image]);
 assert.equal(report.groups['game.understand'].attempts,1);
 assert.equal(report.groups['game.express'].failed,1);
 assert.equal(report.groups.image.images,1);
 assert.equal(report.groups.image.unknownAttempts,1);
 assert.equal(report.completeEstimate,false);
 assert.ok(Math.abs(report.estimatedUsd-.0072)<1e-10);
 assert.doesNotMatch(JSON.stringify(image),/private/);
 assert.equal(row({task:'user supplied words'}).task,'unknown');
 assert.equal(summarizeUsage([row({task:'user supplied words'})]).completeEstimate,false);
});
test('cost exports deduplicate attempts without collapsing fallback or hiding conflicting readings',()=>{
 const first=row({outcome:'failed'}),fallback=row({attempt:2,provider:'unknown',usage:undefined,outcome:'completed'});
 const report=summarizeUsage([first,first,fallback,{...first,inputTokens:1}]);
 assert.equal(report.attempts,2);assert.equal(report.requests,1);
 assert.equal(report.duplicateRows,1);assert.equal(report.conflictingRows,1);
 assert.equal(report.groups['game.understand'].failed,1);
 assert.equal(report.unknownAttempts,1);assert.equal(report.completeEstimate,false);
 const missing=summarizeUsage([row({requestId:undefined})],{malformedLines:1});
 assert.equal(missing.missingRequestIds,1);assert.equal(missing.completeEstimate,false);
});
test('usage promise rejection and hung streams do not block completion, known usage survives',async()=>{
 assert.deepEqual(await resultUsage({totalUsage:Promise.resolve({inputTokens:3})}),{inputTokens:3});
 assert.equal(await resultUsage({totalUsage:Promise.reject(Error('private'))}),undefined);
 assert.equal(await resultUsage({totalUsage:new Promise(()=>{})}),undefined);
});
test('wallet audit accounts for reserved units, net reversals and uncovered refunded purchases',async()=>{
 const db=database(),store=createCredits(db,'test');
 await store.purchase('private-alice','cs_audit',200);
 await store.checkin('private-alice');
 const request={id:'e13cf29d-61c3-4536-9d85-f6feee73133a',fingerprint:digest('private words'),amount:80,sku:'image.cover',version:PRICE_VERSION};
 await store.reserve('private-alice',request);
 let raw=[...db.rows].find(([k])=>k.startsWith('replica-wallets-test/'))[1];
 const before=structuredClone(raw),report=createWalletReport();addWalletReport(report,raw);
 assert.deepEqual(raw,before);assert.equal(report.reserved,80);
 assert.equal(finishWalletReport(report).consistentSnapshot,true);
 await store.finish('private-alice',request.id,true);
 await store.reconcilePurchase('private-alice','cs_audit',200,{refundCredits:200});
 raw=[...db.rows].find(([k])=>k.startsWith('replica-wallets-test/'))[1];
 const after=createWalletReport();addWalletReport(after,raw);const result=finishWalletReport(after);
 // Gifts were consumed first (3), then purchased (77). Refunds never take gifts.
 assert.equal(result.spent.grant,3);assert.equal(result.spent.purchased,77);
 assert.equal(result.reversed.purchased,200);assert.equal(result.uncoveredCredits,77);
 assert.equal(result.fundingPausedAccounts,1);assert.equal(result.conservationDelta,0);
 assert.equal(result.consistentSnapshot,true);assert.doesNotMatch(JSON.stringify(result),/private-alice|private words|cs_audit/);
});
test('opposite per-wallet discrepancies cannot cancel into a successful aggregate audit',()=>{
 const base={schema:2,balance:5,holds:{},stats:{issued:{grant:0,purchased:5,legacy:0},spent:{grant:0,purchased:0,legacy:0},expired:0}};
 const r=createWalletReport();addWalletReport(r,{...base,balance:4});addWalletReport(r,{...base,balance:6});
 assert.equal(finishWalletReport(r).conservationDelta,0);
 assert.equal(finishWalletReport(r).unbalancedWallets,2);
 assert.equal(finishWalletReport(r).consistentSnapshot,false);
 addWalletReport(r,{balance:7});addWalletReport(r,{schema:2,balance:4,stats:{}});
 assert.equal(r.legacyWallets,1);assert.equal(r.invalidWallets,1);
 addWalletReport(r,{schema:3,balance:7});assert.equal(r.invalidWallets,2);
 assert.equal(finishWalletReport(r,{truncated:true}).completeHistory,false);
});
test('audit defaults to zero remote reads and offline input produces only an anonymous summary',async()=>{
 const result=JSON.parse(execFileSync(process.execPath,['scripts/credit-audit.mjs'],{encoding:'utf8'}));
 assert.equal(result.dryRun,true);assert.equal(result.reads,0);assert.equal(result.writes,0);
 const dir=await mkdtemp(path.join(tmpdir(),'storydate-wallet-audit-'));
 try{
  const file=path.join(dir,'input.jsonl');await writeFile(file,JSON.stringify({balance:25,uid:'private-user'})+'\n');
  const summary=execFileSync(process.execPath,['scripts/credit-audit.mjs',`--input=${file}`],{encoding:'utf8'});
  assert.equal(JSON.parse(summary).available,25);assert.doesNotMatch(summary,/private-user/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
