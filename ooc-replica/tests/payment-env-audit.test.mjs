import test from 'node:test';import assert from 'node:assert/strict';
import {auditNames,auditVercel} from '../scripts/audit-payment-env.mjs';
test('payment environment audit reports only Production names and presence, never values',async()=>{
 let called;const result=await auditVercel({token:'private-token',fetchImpl:async(url,options)=>{called={url,options};return Response.json({envs:[{key:'STRIPE_SECRET_KEY',target:['production'],value:'sk_live_PRIVATE'},{key:'STRIPE_PRICE_200',target:['preview'],value:'price_PRIVATE'}]});}});
 assert.equal(called.url.searchParams.get('decrypt'),'false');assert.equal(called.url.searchParams.get('target'),'production');assert.equal(called.options.headers.Authorization,'Bearer private-token');
 assert.equal(result.checks.find(c=>c.names.includes('STRIPE_SECRET_KEY')).present,true);assert.equal(result.checks.find(c=>c.names.includes('STRIPE_PRICE_200')).present,false);assert.doesNotMatch(JSON.stringify(result),/sk_live_PRIVATE|price_PRIVATE|private-token/);
 assert.ok(auditNames([]).every(check=>!check.present));await assert.rejects(auditVercel({}),/VERCEL_TOKEN/);
});
test('Preview audit cannot count production/live aliases or another branch as a testing environment',async()=>{
 const result=await auditVercel({token:'fixture',target:'preview',branch:'codex/credits-v1-20261112',fetchImpl:async url=>{
  assert.equal(url.searchParams.get('target'),'preview');assert.equal(url.searchParams.get('decrypt'),'false');
  return Response.json({envs:[{key:'FIREBASE_PROJECT_ID',target:['production'],value:'private-project'},{key:'STRIPE_LIVE_SECRET_KEY',target:['preview'],value:'private-live'},{key:'STRIPE_SECRET_KEY',target:['preview'],gitBranch:'other',value:'private-other'},{key:'CREDIT_BILLING_MODE',target:['preview'],value:'test'}]});
 }});
 assert.equal(result.checks.find(c=>c.names.includes('FIREBASE_PROJECT_ID')).present,false);
 assert.equal(result.checks.find(c=>c.names.includes('STRIPE_SECRET_KEY')).present,false);
 assert.equal(result.checks.find(c=>c.names.includes('CREDIT_BILLING_MODE')).present,true);
 assert.doesNotMatch(JSON.stringify(result),/private-project|private-live|private-other/);
 await assert.rejects(auditVercel({token:'fixture',target:'evil'}),/Unsupported/);
});
