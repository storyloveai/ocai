// Signed Stripe events use a local response fixture; persistence, authentication,
// contention, timestamps and cleanup use real Firebase SDKs and demo emulators.
import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac, randomUUID} from 'node:crypto';
import {initializeApp, deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {createCredits, digest} from '../../server/credits.js';
import {createPlatform} from '../../server/payments.js';
import {cleanCreditCache} from '../../server/credit-maintenance.js';
import {createWalletReport, addWalletReport, finishWalletReport} from '../../server/wallet-report.js';
import {PRICE_VERSION} from '../../server/credit-policy.js';

const project='demo-storydate-credits';
for(const name of ['FIREBASE_AUTH_EMULATOR_HOST','FIRESTORE_EMULATOR_HOST'])
  assert.match(process.env[name]||'',/^127\.0\.0\.1:\d+$/,'Only loopback emulators are allowed');
assert.equal(process.env.GCLOUD_PROJECT,project);
assert.equal(process.env.VERCEL_ENV,undefined);
const app=initializeApp({projectId:project},'funding-emulator-'+randomUUID()),db=getFirestore(app),auth=getAuth(app);
after(async()=>{await db.terminate();await deleteApp(app);});

function fixture(){
 const uid='funding-'+randomUUID(),suffix=randomUUID().replaceAll('-',''),id='cs_'+suffix;
 const env={FIREBASE_PROJECT_ID:project,FIREBASE_API_KEY:'emulator-public',FIREBASE_APP_ID:'emulator-app',FIREBASE_AUTH_DOMAIN:'localhost',
  FIREBASE_CLIENT_EMAIL:'not-used@emulator.invalid',FIREBASE_PRIVATE_KEY:'not-used-emulator',
  STRIPE_SECRET_KEY:'sk_test_emulator',STRIPE_WEBHOOK_SECRET:'whsec_emulator_fixture',STRIPE_PRICE_200:'price_emulator_fixture',CREDIT_BILLING_MODE:'test'};
 const session={id,payment_intent:'pi_'+suffix,payment_status:'paid',status:'complete',mode:'payment',currency:'usd',amount_total:199,livemode:false,client_reference_id:uid,
  metadata:{user_id:uid,credits:'200',wallet_mode:'test',wallet_backend:'firebase-replica-v1',firebase_project:project},
  line_items:{data:[{quantity:1,price:{id:env.STRIPE_PRICE_200}}]}};
 const charge={id:'ch_'+suffix,payment_intent:session.payment_intent,currency:'usd',amount:199,amount_refunded:0,livemode:false,disputed:false};
 const dispute={id:'du_'+suffix,charge:charge.id,payment_intent:session.payment_intent,currency:'usd',amount:199,status:'needs_response',livemode:false};
 let reads=0;
 const platform=createPlatform({env,services:()=>({db,auth}),fetchImpl:async(url,opts)=>{
  assert.equal(opts.method,'GET');assert.equal(new URL(url).origin,'https://api.stripe.com');reads++;
  const path=new URL(url).pathname;
  if(path==='/v1/checkout/sessions/'+session.id)return Response.json(session);
  if(path==='/v1/checkout/sessions')return Response.json({data:[session],has_more:false});
  if(path==='/v1/charges/'+charge.id)return Response.json(charge);
  if(path==='/v1/disputes/'+dispute.id)return Response.json(dispute);
  if(path==='/v1/disputes')return Response.json({data:[dispute],has_more:false});
  throw Error('Unexpected Stripe fixture request');
 }});
 const event=(type,created=100,valid=true)=>{
  const objectId=type.startsWith('checkout.')?session.id:type.startsWith('charge.dispute.')?dispute.id:charge.id;
  const raw=JSON.stringify({type,created,livemode:false,data:{object:{id:objectId}}}),t=Math.floor(Date.now()/1000);
  const signature=createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(t+'.'+raw).digest('hex');
  return new Request('https://emulator.invalid/api/webhook',{method:'POST',headers:{'stripe-signature':`t=${t},v1=${valid?signature:'0'.repeat(64)}`},body:raw});
 };
 const store=createCredits(db,'test');
 return {uid,session,charge,dispute,platform,event,store,get reads(){return reads;}};
}
const spend=(amount=80)=>({id:randomUUID(),fingerprint:digest(randomUUID()),amount,sku:'image.cover',version:PRICE_VERSION});
async function assertConserved(uid){
 const raw=(await db.collection('replica-wallets-test').doc(digest(uid)).get()).data(),report=createWalletReport();
 addWalletReport(report,raw);assert.equal(finishWalletReport(report).consistentSnapshot,true);
}
async function tokenFor(uid){
 const custom=await auth.createCustomToken(uid);
 const result=await fetch('http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST+'/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=emulator-public',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:custom,returnSecureToken:true})});
 assert.equal(result.status,200);return (await result.json()).idToken;
}
const request=(token,path)=>new Request('https://emulator.invalid/api/'+path,{headers:{Authorization:'Bearer '+token}});

test('SDK payment: signed parallel delivery fulfills once; return polling and foreign accounts cannot grant or inspect',async()=>{
 const f=fixture(),token=await tokenFor(f.uid),path='checkout-status?session_id='+f.session.id;
 const before=await f.platform.checkoutStatus(request(token,path));
 assert.equal(before.status,200);assert.equal((await before.json()).credited,false);
 assert.equal((await f.store.read(f.uid)).balance,0);
 const reads=f.reads;assert.equal((await f.platform.webhook(f.event('checkout.session.completed',100,false))).status,400);assert.equal(f.reads,reads);
 const deliveries=await Promise.all(Array.from({length:4},()=>f.platform.webhook(f.event('checkout.session.completed'))));
 assert.ok(deliveries.every(r=>r.status===200));
 const wallet=await f.store.read(f.uid);assert.equal(wallet.balance,200);assert.equal(wallet.stats.issued.purchased,200);
 assert.equal((await (await f.platform.checkoutStatus(request(token,path))).json()).credited,true);
 const other=await tokenFor('other-'+randomUUID());
 assert.equal((await f.platform.checkoutStatus(request(other,path))).status,404);
 await assertConserved(f.uid);
});

test('SDK refund: reserved/consumed units reconcile once under contention without taking gifts or regranting the order',async()=>{
 const f=fixture();assert.equal((await f.platform.webhook(f.event('checkout.session.completed'))).status,200);
 await f.store.checkin(f.uid);const used=spend(),held=spend();
 await f.store.reserve(f.uid,used);await f.store.finish(f.uid,used.id,true,'already generated');
 await f.store.reserve(f.uid,held);
 const now=Date.now(),campaign='refund-gift-'+randomUUID();
 await f.store.registerCampaign({id:campaign,amount:10,budget:10,recipients:[digest(f.uid)],startsAt:now-1000,endsAt:now+60000,expiresAt:now+86400000});
 await f.store.grant(f.uid,campaign);
 f.charge.amount_refunded=199;
 const responses=await Promise.all(Array.from({length:4},()=>f.platform.webhook(f.event('charge.refunded',200))));
 assert.ok(responses.every(r=>r.status===200));
 let wallet=await f.store.read(f.uid);
 assert.equal(wallet.balance,10);assert.equal(wallet.reserved,80);assert.equal(wallet.debt,157);assert.equal(wallet.fundingPaused,true);
 await assert.rejects(f.store.reserve(f.uid,spend(1)),{code:'FUNDING_REVIEW_REQUIRED'});
 await f.store.finish(f.uid,held.id,false);
 await f.platform.webhook(f.event('checkout.session.async_payment_succeeded',300));
 wallet=await f.store.read(f.uid);
 assert.equal(wallet.balance,10);assert.equal(wallet.breakdown.grant,10);assert.equal(wallet.reserved,0);assert.equal(wallet.debt,77);
 assert.equal(wallet.stats.issued.purchased,200);assert.equal(wallet.stats.reversed.purchased,200);
 assert.equal((await f.store.status(f.uid,used.id)).reply,'already generated');
 await assertConserved(f.uid);
});

test('SDK dispute: a funding event before fulfillment, won closure and stale reopening preserve a single receipt',async()=>{
 const f=fixture();await f.store.checkin(f.uid);f.charge.disputed=true;
 assert.equal((await f.platform.webhook(f.event('charge.dispute.created',10))).status,200);
 let wallet=await f.store.read(f.uid);assert.equal(wallet.balance,3);assert.equal(wallet.fundingPaused,true);
 f.dispute.status='won';
 const closed=await Promise.all(Array.from({length:3},()=>f.platform.webhook(f.event('charge.dispute.closed',20))));
 assert.ok(closed.every(r=>r.status===200));
 f.dispute.status='under_review';
 await f.platform.webhook(f.event('charge.dispute.updated',15));
 await f.platform.webhook(f.event('checkout.session.completed',30));
 wallet=await f.store.read(f.uid);
 assert.equal(wallet.balance,203);assert.equal(wallet.fundingPaused,false);assert.equal(wallet.stats.issued.purchased,200);assert.equal(wallet.stats.reversed.purchased,0);
 await assertConserved(f.uid);
});

test('SDK cache: timestamp expiry denies recovery before physical cleanup; cleanup retains wallet, receipt and operation',async()=>{
 const f=fixture();await f.store.purchase(f.uid,f.session.id,200);
 // Use an old clock so a parallel integration file's fresh caches are outside
 // this cleanup cutoff. The shared demo project is never flushed.
 let now=Date.now()-3*86400000;const store=createCredits(db,'test',{clock:()=>now}),op=spend(),reply='cache-中文'.repeat(40000);
 await store.reserve(f.uid,op);await store.finish(f.uid,op.id,true,reply);
 const key=digest(digest(f.uid)+':'+op.id),responses=db.collection('replica-credit-responses-test'),parts=db.collection('replica-credit-response-parts-test');
 const cached=await responses.doc(key).get(),count=cached.data().partCount;
 assert.ok(count>1);assert.equal(typeof cached.data().expiresAt.toMillis,'function');
 assert.equal((await store.status(f.uid,op.id)).reply,reply);
 const fresh=responses.doc('fresh-'+randomUUID());
 await fresh.set({uid:f.uid,reply:'still available',expiresAt:new Date(Date.now()+86400000)});
 now+=86400001;
 const expired=await store.status(f.uid,op.id);assert.equal(expired.status,'settled');assert.equal(expired.reply,undefined);
 const scan=await cleanCreditCache(db,'test',{now,limit:400});assert.equal(scan.collections['replica-credit-responses-test'].deleted,0);
 assert.equal((await responses.doc(key).get()).exists,true);
 await cleanCreditCache(db,'test',{now,limit:400,apply:true});
 assert.equal((await responses.doc(key).get()).exists,false);
 assert.equal((await fresh.get()).exists,true);
 for(let i=0;i<count;i++)assert.equal((await parts.doc(key+'-'+i).get()).exists,false);
 assert.equal((await db.collection('replica-receipts-test').doc(f.session.id).get()).exists,true);
 assert.equal((await store.inspect(f.uid,op.id)).status,'settled');assert.equal((await store.read(f.uid)).balance,120);
 await assertConserved(f.uid);
});
