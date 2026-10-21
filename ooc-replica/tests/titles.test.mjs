import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeTitle,titlesHandler,publicView} from '../server/titles.js';
const env={FIREBASE_PROJECT_ID:'p',FIREBASE_CLIENT_EMAIL:'e',FIREBASE_PRIVATE_KEY:'k'};
const reply=()=>({code:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(b){this.body=b;return this;}});
function fakeDb(){const store=new Map();const doc=id=>({async get(){return {exists:store.has(id),data:()=>store.get(id)};},async set(v){store.set(id,v);},async delete(){store.delete(id);}});
 return {store,collection:()=>({doc,orderBy:()=>({limit:()=>({async get(){return {docs:[...store.values()].map(v=>({data:()=>v}))};}})})})};}
const good={id:'u-abcdef12-3456',type:'story',title:'雾城',description:'钟楼里的城',details:'设定',opening:'开场',visibility:'public'};
test('sanitizeTitle bounds fields and rejects incomplete titles',()=>{
 assert.equal(sanitizeTitle({...good,details:'x'.repeat(9000)}).details.length,6000);
 assert.equal(sanitizeTitle({...good,image:'javascript:alert(1)'}).image,'');
 assert.throws(()=>sanitizeTitle({...good,id:'../x'}));assert.throws(()=>sanitizeTitle({...good,opening:''}));
 assert.equal(sanitizeTitle({...good,visibility:'private'}).visibility,'public','server never stores private titles');
});
test('publishing requires auth and ownership; public list hides the canon',async()=>{
 const db=fakeDb();const services=()=>({db,auth:{verifyIdToken:async t=>{if(t==='bad')throw Error('x');return {uid:t,name:t==='alice'?'Alice':'Bob'};}}});
 const post=(token,body)=>{const res=reply();return titlesHandler({method:'POST',headers:{host:'a.com',origin:'https://a.com',authorization:token?'Bearer '+token:''},body},res,env,services).then(()=>res);};
 assert.equal((await post('',{action:'publish',title:good})).code,401);
 assert.equal((await post('bad',{action:'publish',title:good})).code,401);
 assert.equal((await post('alice',{action:'publish',title:good})).code,200);
 assert.equal((await post('bob',{action:'publish',title:good})).code,403);
 assert.equal((await post('bob',{action:'unpublish',id:good.id})).code,403);
 const list=reply();await titlesHandler({method:'GET',query:{}},list,env,services);assert.equal(list.body.titles.length,1);assert.equal(list.body.titles[0].details,undefined);assert.equal(list.body.titles[0].ownerName,'Alice');
 const one=reply();await titlesHandler({method:'GET',query:{id:good.id}},one,env,services);assert.equal(one.body.title.details,'设定');
 await post('alice',{action:'publish',title:{...good,visibility:'link'}});
 const after=reply();await titlesHandler({method:'GET',query:{}},after,env,services);assert.equal(after.body.titles.length,0,'link-only titles are not listed');
 assert.equal((await post('alice',{action:'unpublish',id:good.id})).code,200);
 const gone=reply();await titlesHandler({method:'GET',query:{id:good.id}},gone,env,services);assert.equal(gone.code,404);
});
test('unconfigured server reports unavailable and cross-origin writes are refused',async()=>{
 const r=reply();await titlesHandler({method:'GET',query:{}},r,{});assert.equal(r.code,503);
 const w=reply();await titlesHandler({method:'POST',headers:{host:'a.com',origin:'https://evil.com'}},w,env,()=>({db:fakeDb(),auth:{}}));assert.equal(w.code,403);
});
