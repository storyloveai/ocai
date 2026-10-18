import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createPayments} from '../dist/assets/payments.js';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup(){
 const {document}=parseHTML('<html><body><div id="wallet"></div><dialog></dialog></body></html>');
 const modal=document.querySelector('dialog');modal.close=()=>{modal.open=false;modal.dispatchEvent(new Event('close'));};
 const rows=new Map(),storage={getItem:k=>rows.get(k)??null,setItem:(k,v)=>rows.set(k,v),removeItem:k=>rows.delete(k)};
 globalThis.location={href:'https://replica.example/credit'};globalThis.history={replaceState(){}};
 const account={user:{uid:'alice'},paymentConfig:{walletConfigured:true,payments:true,embeddedPayments:true,walletMode:'test',auth:{config:{projectId:'fixture'}},creditPacks:[{credits:200,amount:199,label:'Small'}]},async api(path){return {balance:321,checked:false,ledger:[]};}};
 const redirects=[];const payments=createPayments({account,modal,storage,show(){throw Error("Hosted checkout must not open an embedded form");},notify(){},redirect:url=>redirects.push(url)});
 return {account,payments,root:document.querySelector('#wallet'),storage,redirects};
}
test('credit UI shows server balance and configured catalog; daily claim reloads ledger',async()=>{
 const f=setup();f.payments.sync();f.payments.mount(f.root);await tick();
 assert.match(f.root.textContent,/321/);assert.doesNotMatch(f.root.textContent,/Demo balance|500/);assert.match(f.root.textContent,/\$1\.99/);assert.equal(f.root.querySelector('[data-buy-selected]').disabled,false);
 f.account.api=async()=>({balance:421,checked:true,ledger:[{at:'now',type:'checkin',amount:100}]});f.root.querySelector('[data-credit-tab=free]').click();f.root.querySelector('[data-checkin]').click();await tick();assert.match(f.root.textContent,/421/);assert.equal(f.root.querySelector('[data-checkin]').disabled,true);
});
test('late wallet response from another account cannot overwrite current balance',async()=>{
 const f=setup();let resolve;f.account.api=()=>new Promise(r=>resolve=r);f.payments.sync();
 f.account.user={uid:'bob'};f.account.api=async()=>({balance:22,checked:false,ledger:[]});f.payments.sync();f.payments.mount(f.root);await tick();resolve({balance:999,checked:false,ledger:[]});await tick();assert.match(f.root.textContent,/22/);assert.doesNotMatch(f.root.textContent,/999/);
 f.account.user=null;f.payments.sync();assert.doesNotMatch(f.root.textContent,/22/);assert.ok(f.root.querySelector('[data-action=login]'));
});
test('return URL queries fulfillment but cannot mutate balance locally',async()=>{
 const f=setup();globalThis.location={href:'https://replica.example/credit?checkout=success&session_id=cs_fixture'};globalThis.history={replaceState(){}};
 const calls=[];f.account.api=async path=>{calls.push(path);return path.startsWith('checkout-status')?{paid:true,credited:true}:{balance:200,checked:false,ledger:[]};};f.payments.sync();f.payments.mount(f.root);await tick();assert.ok(calls.includes('checkout-status?session_id=cs_fixture'));assert.ok(calls.every(p=>p==='wallet'||p.startsWith('checkout-status')));assert.match(f.root.textContent,/充值已到账/);assert.equal(f.storage.getItem('replica-payment:fixture:test:alice'),null);
});

test('guest page receives catalog after async public config without an identity change',async()=>{
 const f=setup();f.account.user=null;const config=f.account.paymentConfig;f.account.paymentConfig={};f.payments.sync();f.payments.mount(f.root);assert.equal(f.root.querySelectorAll('[name=credits-pack]').length,0);f.account.paymentConfig=config;f.payments.sync();assert.equal(f.root.querySelectorAll('[name=credits-pack]').length,1);assert.match(f.root.textContent,/\$1\.99/);
});

test('initial guest mount before account sync never reads a payment session',async()=>{
 const {document}=parseHTML('<html><body><div id="wallet"></div><dialog></dialog></body></html>');
 const account={user:null,paymentConfig:{}};
 const payments=createPayments({account,modal:document.querySelector('dialog'),storage:{getItem(){throw Error('guest must not read payment storage');}},show(){},notify(){}});
 payments.mount(document.querySelector('#wallet'));await tick();assert.match(document.querySelector('#wallet').textContent,/Sign in to view your balance/);
});

test('hosted checkout redirects to Stripe without requiring an embedded publishable key',async()=>{
 const f=setup();f.account.paymentConfig.embeddedPayments=false;let payload;
 f.account.api=async(path,body)=>{if(path==='checkout'){payload=body;return {url:'https://checkout.stripe.com/c/pay/fixture',session_id:'cs_hosted'};}return {balance:100,checked:false,ledger:[]};};
 f.payments.sync();f.payments.mount(f.root);await tick();
 assert.equal(f.root.querySelector('[data-buy-selected]').disabled,false);
 f.root.querySelector('[data-buy-selected]').click();await tick();
 assert.equal(payload.ui_mode,'hosted');assert.equal(payload.pack,200);
 assert.deepEqual(f.redirects,['https://checkout.stripe.com/c/pay/fixture']);assert.equal(f.storage.getItem('replica-payment:fixture:test:alice'),'cs_hosted');
});
test('checkout refuses a provider response redirecting outside Stripe',async()=>{
 const f=setup();f.account.api=async path=>path==='checkout'?{url:'https://checkout.stripe.com.evil.example/pay'}:{balance:100,ledger:[]};
 f.payments.sync();f.payments.mount(f.root);await tick();f.root.querySelector('[data-buy-selected]').click();await tick();
 assert.deepEqual(f.redirects,[]);assert.match(f.root.textContent,/安全付款页面/);
});
test('cancel return clears the pending session and does not report an unpaid order',async()=>{
 const f=setup();f.storage.setItem('replica-payment:fixture:test:alice','cs_old');globalThis.location={href:'https://replica.example/credit?checkout=cancelled'};
 const calls=[];f.account.api=async path=>{calls.push(path);return {balance:100,ledger:[]};};f.payments.sync();f.payments.mount(f.root);await tick();
 assert.equal(f.storage.getItem('replica-payment:fixture:test:alice'),null);assert.ok(calls.every(p=>p==='wallet'));assert.match(f.root.textContent,/付款已取消/);
});
