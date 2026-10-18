import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createPlatform } from '../server/payments.js';
import { createWallet } from '../server/wallet.js';
import { paymentHandler } from '../server/payment-handler.js';
import { Readable } from 'node:stream';

// Transactional in-memory store: each transaction commits all staged writes at once.
function database() {
 const rows = new Map(); let queue = Promise.resolve();
 const ref = key => ({ key, async get() { const value = rows.get(key); return { exists: Boolean(value), data: () => structuredClone(value) }; } });
 return { collection: name => ({ doc: id => ref(name + '/' + id) }), runTransaction(fn) {
   const job = queue.then(async () => { const staged = new Map(); const result = await fn({get: r => r.get(),set: (r,v) => staged.set(r.key,structuredClone(v)),create: (r,v) => { assert.ok(!rows.has(r.key)); staged.set(r.key,structuredClone(v)); }}); for(const [k,v] of staged) rows.set(k,v); return result; });
   queue = job.catch(() => {}); return job;
 } };
}
const env = { FIREBASE_API_KEY:'public',FIREBASE_AUTH_DOMAIN:'fixture.firebaseapp.com',FIREBASE_PROJECT_ID:'fixture',FIREBASE_APP_ID:'public-app',FIREBASE_CLIENT_EMAIL:'admin@fixture.iam.gserviceaccount.com',FIREBASE_PRIVATE_KEY:'PRIVATE',STRIPE_SECRET_KEY:'sk_live_fixture',STRIPE_PUBLISHABLE_KEY:'pk_live_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',STRIPE_LIVE_ENABLED:'true',STRIPE_PRICE_200:'price_small',STRIPE_PRICE_2500:'price_medium',STRIPE_PRICE_5000:'price_large',APP_URL:'https://replica.example' };
const request = (path, body, token='alice') => new Request('https://replica.example/api/'+path, { method: body ? 'POST':'GET', headers: { Authorization:'Bearer '+token, Origin:'https://replica.example' }, ...(body ? {body:JSON.stringify(body)}:{}) });
function fixture(overrides={}) {
 const db=database(); let paid=true, owner='alice', amount=199, mode=true, backend='firebase-replica-v1', project='fixture'; const calls=[];
 const platform=createPlatform({env:{...env,...overrides},services:()=>({db,auth:{verifyIdToken:async(token,revoked)=>{assert.equal(revoked,true);if(token==='bad')throw Error('bad token');return {uid:token};}}}),fetchImpl:async(url,options)=>{
  if(options.method==='POST'){calls.push(new URLSearchParams(options.body));return Response.json({id:'cs_fixture',client_secret:'cs_fixture_secret',url:'https://checkout.stripe.com/c/pay/fixture'});}
  return Response.json({id:'cs_fixture',livemode:mode,mode:'payment',currency:'usd',amount_total:amount,payment_status:paid?'paid':'unpaid',status:'complete',client_reference_id:owner,metadata:{user_id:owner,credits:'200',wallet_mode:mode?'live':'test',wallet_backend:backend,firebase_project:project},line_items:{data:[{quantity:1,price:{id:'price_small'}}]}});
 }});
 const event=(type='checkout.session.completed',valid=true)=>{const raw=JSON.stringify({livemode:true,type,data:{object:{id:'cs_fixture'}}});const t=Math.floor(Date.now()/1000);const sig=createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(t+'.'+raw).digest('hex');return new Request('https://replica.example/api/webhook',{method:'POST',headers:{'stripe-signature':`t=${t},v1=${valid?sig:'0'.repeat(64)}`},body:raw});};
 return {platform,db,event,calls,set:values=>{({paid=paid,owner=owner,amount=amount,mode=mode,backend=backend,project=project}=values);}};
}
test('public config enables configured Firebase wallet and never exposes Admin or Stripe secrets',async()=>{
 const {platform}=fixture();const cfg=await(await platform.config(request('config'))).json();assert.equal(cfg.payments,true);assert.equal(cfg.embeddedPayments,true);assert.equal(cfg.auth.config.projectId,'fixture');assert.equal(cfg.creditPacks.length,3);assert.doesNotMatch(JSON.stringify(cfg),/PRIVATE|sk_live|whsec|admin@/);
 const missing=fixture({FIREBASE_PRIVATE_KEY:''});assert.equal((await(await missing.platform.config(request('config'))).json()).payments,false);
});
test('verified Firebase UID owns checkout and client cannot alter catalog or amount',async()=>{
 const {platform,calls}=fixture();assert.equal((await platform.wallet(request('wallet',null,'bad'))).status,401);
 const body={pack:200,amount:1,user_id:'mallory',request_id:'12345678-1234-1234-1234-123456789012',ui_mode:'elements'};
 assert.equal((await platform.checkout(request('checkout',body))).status,200);assert.equal(calls[0].get('metadata[user_id]'),'alice');assert.equal(calls[0].get('line_items[0][price]'),'price_small');assert.equal(calls[0].get('metadata[wallet_backend]'),'firebase-replica-v1');assert.equal(calls[0].get('return_url'),'https://replica.example/credit?checkout=success&session_id={CHECKOUT_SESSION_ID}');
 const cross=new Request('https://replica.example/api/checkout',{method:'POST',headers:{Origin:'https://evil.example'},body:JSON.stringify(body)});assert.equal((await platform.checkout(cross)).status,403);
});
test('only signed paid webhook grants credits, duplicates are idempotent and status never grants',async()=>{
 const f=fixture();const status=()=>f.platform.checkoutStatus(request('checkout-status?session_id=cs_fixture'));
 assert.equal((await(await status()).json()).credited,false);assert.equal((await f.platform.webhook(f.event(undefined,false))).status,400);
 f.set({paid:false});assert.equal((await f.platform.webhook(f.event())).status,200);assert.equal((await(await f.platform.wallet(request('wallet'))).json()).balance,0);
 f.set({paid:true});const responses=await Promise.all(Array.from({length:5},()=>f.platform.webhook(f.event('checkout.session.async_payment_succeeded'))));assert.ok(responses.every(r=>r.status===200));assert.equal((await(await status()).json()).credited,true);assert.equal((await(await f.platform.wallet(request('wallet'))).json()).balance,200);
 assert.equal((await f.platform.checkoutStatus(request('checkout-status?session_id=cs_fixture',null,'bob'))).status,404);
});
test('unavailable wallet prevents new Stripe checkout and records only safe database diagnostics',async()=>{
 let contactedStripe=false;const logs=[],warn=console.warn;
 const platform=createPlatform({env,services:()=>({auth:{verifyIdToken:async()=>({uid:'alice'})},db:{collection(){const error=Error('private provider details');error.code=7;throw error;}}}),fetchImpl:async()=>{contactedStripe=true;throw Error('unexpected Stripe request');}});
 console.warn=value=>logs.push(value);
 try{
  const response=await platform.checkout(request('checkout',{pack:200,request_id:'12345678-1234-1234-1234-123456789012',ui_mode:'elements'}));
  assert.equal(response.status,503);assert.equal(contactedStripe,false);
  assert.deepEqual(JSON.parse(logs.at(-1)),{event:'firebase_wallet_failed',operation:'storylove_wallet',code:7});
  assert.doesNotMatch(JSON.stringify(logs),/private provider details/);
 }finally{console.warn=warn;}
});
test('wrong amount, Stripe mode, backend and Firebase project cannot fulfill',async()=>{
 for(const values of [{amount:1},{mode:false},{backend:'old-supabase'},{project:'other-project'}]){const f=fixture();f.set(values);assert.equal((await f.platform.webhook(f.event())).status,400);assert.equal((await(await f.platform.wallet(request('wallet'))).json()).balance,0);}
});
test('daily claim, purchase receipts and account isolation use atomic mode-specific storage',async()=>{
 const db=database(), live=createWallet(db,'live'), sandbox=createWallet(db,'test');
 const claims=await Promise.all(Array.from({length:6},()=>live.rpc('storylove_checkin',{p_user:'alice'})));assert.equal(claims.filter(c=>c.claimed).length,1);
 await Promise.all(Array.from({length:6},()=>live.rpc('storylove_purchase',{p_user:'alice',p_session:'cs_duplicate',p_credits:200})));
 assert.equal((await live.rpc('storylove_wallet',{p_user:'alice'})).balance,300);assert.equal((await sandbox.rpc('storylove_wallet',{p_user:'alice'})).balance,0);assert.equal((await live.rpc('storylove_wallet',{p_user:'bob'})).balance,0);assert.equal(await live.rpc('storylove_purchase_status',{p_user:'bob',p_session:'cs_duplicate'}),false);
 await assert.rejects(live.rpc('storylove_purchase',{p_user:'bob',p_session:'cs_duplicate',p_credits:200}));
});
test('Vercel webhook adapter preserves original signed whitespace and raw bytes',async()=>{
 const f=fixture();const event=f.event();const raw=await event.text();
 const req=Readable.from([Buffer.from(raw.slice(0,17)),Buffer.from(raw.slice(17))]);Object.assign(req,{method:'POST',url:'/api/webhook',headers:{host:'replica.example','stripe-signature':event.headers.get('stripe-signature')}});
 let status,body;const res={setHeader(){},status(s){status=s;return this;},json(v){body=v;}};await paymentHandler('webhook', f.platform)(req,res);assert.equal(status,200);assert.equal(body.received,true);assert.equal((await(await f.platform.wallet(request('wallet'))).json()).balance,200);
});
