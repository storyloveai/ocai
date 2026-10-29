import test from 'node:test';import assert from 'node:assert/strict';
import {auditNames,auditVercel} from '../scripts/audit-payment-env.mjs';
test('payment environment audit reports only Production names and presence, never values',async()=>{
 let called;const result=await auditVercel({token:'private-token',fetchImpl:async(url,options)=>{called={url,options};return Response.json({envs:[{key:'STRIPE_SECRET_KEY',target:['production'],value:'sk_live_PRIVATE'},{key:'STRIPE_PRICE_200',target:['preview'],value:'price_PRIVATE'}]});}});
 assert.equal(called.url.searchParams.get('decrypt'),'false');assert.equal(called.url.searchParams.get('target'),'production');assert.equal(called.options.headers.Authorization,'Bearer private-token');
 assert.equal(result.checks.find(c=>c.names.includes('STRIPE_SECRET_KEY')).present,true);assert.equal(result.checks.find(c=>c.names.includes('STRIPE_PRICE_200')).present,false);assert.doesNotMatch(JSON.stringify(result),/sk_live_PRIVATE|price_PRIVATE|private-token/);
 assert.ok(auditNames([]).every(check=>!check.present));await assert.rejects(auditVercel({}),/VERCEL_TOKEN/);
});
