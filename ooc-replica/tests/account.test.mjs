import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountStorage,cloudKey} from '../dist/assets/account-storage.js';
import {createAccount} from '../dist/assets/account.js';
import {firebaseConfig} from '../server/firebase-config.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
test('guest and different accounts cannot see one another’s cache',()=>{
 const store=createAccountStorage(memory());store.save('ooc-profile',{name:'guest'});store.useAccount('alice');assert.equal(store.read('ooc-profile',null),null);store.save('ooc-profile',{name:'alice'});store.useAccount('bob');assert.equal(store.read('ooc-profile',null),null);store.useAccount(null);assert.equal(store.read('ooc-profile',null).name,'guest');store.useAccount('alice');assert.equal(store.read('ooc-profile',null).name,'alice');assert.equal(cloudKey('wallet'),false);
});
test('public configuration never contains private credentials and Apple is opt-in',()=>{
 const env={FIREBASE_API_KEY:'public-key',FIREBASE_AUTH_DOMAIN:'test.firebaseapp.com',FIREBASE_PROJECT_ID:'test',FIREBASE_APP_ID:'test',FIREBASE_PRIVATE_KEY:'SECRET',SUPABASE_SERVICE_ROLE_KEY:'SECRET'};
 assert.equal(firebaseConfig({}),null);const cfg=firebaseConfig(env);assert.equal(cfg.providers.apple,false);assert.ok(!JSON.stringify(cfg).includes('SECRET'));assert.equal(firebaseConfig({...env,FIREBASE_APPLE_ENABLED:'true'}).providers.apple,true);
});
test('login, cloud hydrate, failure retry, logout and account switch use verified UID',async()=>{
 let callback;const writes=[];let fail=false,loggedOut=false;
 const client={subscribe:fn=>callback=fn,load:async uid=>[['ooc-profile',{name:uid}]],login:async()=>callback({uid:'alice'}),logout:async()=>{loggedOut=true;await callback(null);},save:async(...args)=>{if(fail)throw Error();writes.push(args);}};
 const a=createAccount({storage:memory(),fetchImpl:async()=>({ok:true,json:async()=>({auth:{config:{},providers:{google:true,apple:true}}})}),loadClient:async()=>({connectFirebase:async()=>client})});
 await a.init();await callback(null);await a.login();assert.equal(a.user.uid,'alice');assert.equal(a.read('ooc-profile',{}).name,'alice');
 const value=['one'];a.save('ooc-favorites',value);value.push('two');fail=true;await a.logout();assert.equal(loggedOut,false);assert.ok(a.syncError);fail=false;await a.logout();assert.equal(loggedOut,true);assert.deepEqual(writes[0],['alice','ooc-favorites',['one']]);assert.equal(a.read('ooc-profile',null),null);await callback({uid:'bob'});assert.equal(a.read('ooc-favorites',null),null);
});
test('missing Firebase config leaves browsing available and reports login unavailability',async()=>{
 let message;const a=createAccount({storage:memory(),fetchImpl:async()=>({ok:true,json:async()=>({auth:null})}),notify:m=>message=m});await a.init();assert.equal(a.busy,false);await a.login();assert.match(message,/Firebase/);
});
test('late writes from an old chat are discarded after account switching',async()=>{
 let callback;const a=createAccount({storage:memory(),fetchImpl:async()=>({ok:true,json:async()=>({auth:{config:{},providers:{google:true}}})}),loadClient:async()=>({connectFirebase:async()=>({subscribe:fn=>callback=fn,load:async()=>[],save:async()=>{}})})});await a.init();await callback({uid:'alice'});const oldChat=a.scope();await callback({uid:'bob'});oldChat.save('ooc-session-v2-story',[{text:'private to Alice'}]);assert.equal(a.read('ooc-session-v2-story',null),null);
});
test('unsynced local values survive reload and take precedence over old cloud data',async()=>{
 const storage=memory();let callback,fail=true;const writes=[];
 const client={subscribe:fn=>callback=fn,load:async()=>[['ooc-profile',{name:'old cloud'}]],save:async(...args)=>{if(fail)throw Error();writes.push(args);}};
 const make=()=>createAccount({storage,fetchImpl:async()=>({ok:true,json:async()=>({auth:{config:{},providers:{google:true}}})}),loadClient:async()=>({connectFirebase:async()=>client})});
 const first=make();await first.init();await callback({uid:'alice'});first.save('ooc-profile',{name:'new local'});await first.flush();assert.ok(first.syncError);
 const reloaded=make();await reloaded.init();await callback({uid:'alice'});assert.equal(reloaded.read('ooc-profile',{}).name,'new local');fail=false;await reloaded.flush();assert.deepEqual(writes.at(-1),['alice','ooc-profile',{name:'new local'}]);
});
