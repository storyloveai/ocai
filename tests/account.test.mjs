import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/account.js',import.meta.url),'utf8');
function setup() {
 const entries=new Map(),events=[];
 const context=vm.createContext({window:{dispatchEvent:event=>events.push(event.type)},Event,URL,AbortSignal,setTimeout,clearTimeout,fetch:async()=>Response.json({auth:null,payments:false}),location:{href:'https://storylove.ai/#chat/lara',hash:'#chat/lara',origin:'https://storylove.ai',pathname:'/',search:''},sessionStorage:{getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)},history:{replaceState(){}}});
 vm.runInContext(source,context);
 return {context,entries,events,account:context.window.storyAccount,run:s=>vm.runInContext(s,context)};
}
test('concurrent wallet refreshes share one request and do not wait on their own initialization',async()=>{
 const t=setup();await t.context.window.accountReady;
 let calls=0,resolve;
 const pending=new Promise(r=>resolve=r);
 t.account.user={id:'user-1'};
 t.account.api=async()=>{calls++;return pending;};
 const one=t.account.refreshWallet(),two=t.account.refreshWallet();
 assert.equal(calls,1);
 resolve({balance:100,checked:true});await Promise.all([one,two]);
 assert.equal(t.account.wallet.balance,100);assert.equal(t.account.walletRequest,null);
});
test('a wallet response from the prior account cannot overwrite the new account',async()=>{
 const t=setup();await t.context.window.accountReady;
 let resolve;t.account.user={id:'user-1'};t.account.api=()=>new Promise(r=>resolve=r);
 const request=t.account.refreshWallet();t.account.user={id:'user-2'};t.account.wallet=null;
 resolve({balance:999});await request;assert.equal(t.account.wallet,null);
});
test('login starts once, preserves checkout intent and skips redundant login for an existing user',async()=>{
 const t=setup();await t.context.window.accountReady;
 let calls=0;t.account.ready=true;t.account.provider='supabase';t.account.client={auth:{signInWithOAuth:async()=>{calls++;return {};}}};
 const intent={route:'#credits',action:'checkout',pack:200};
 await Promise.all([t.account.login(intent),t.account.login(intent)]);assert.equal(calls,1);
 t.account.user={id:'user-1'};const recovered=t.account.takeIntent();
 assert.equal(recovered.pack,200);assert.equal(recovered.route,'#credits');assert.equal(t.account.takeIntent(),null);
 await t.account.login();assert.equal(calls,1);
});
test('expired and external redirect intents cannot be resumed',async()=>{
 const t=setup();await t.context.window.accountReady;t.account.user={id:'user-1'};
 for(const intent of [{route:'https://evil.example',created:Date.now()},{route:'#credits',created:1}]){
  t.entries.set('storylove-auth-intent',JSON.stringify(intent));assert.equal(t.account.takeIntent(),null);
 }
});
