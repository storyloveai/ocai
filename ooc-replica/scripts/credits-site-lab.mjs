// Full website acceptance with real handlers and wallet transactions, fixture
// identity/provider only. Localhost, no secrets, no cloud SDK and no paid calls.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {database} from '../tests/helpers/credit-db.mjs';
import {createCredits, digest} from '../server/credits.js';
import {creditPolicy, quote} from '../server/credit-policy.js';
import {createChatBilling} from '../server/chat-billing.js';
import {createChatHandler} from '../api/chat.js';
import {createImageHandler} from '../api/image.js';
import {createHandler} from '../api/three-kingdoms.js';
const db=database(),store=createCredits(db,'test'),env={CREDIT_BILLING_MODE:'test',STRIPE_SECRET_KEY:'sk_test_fixture'},root=path.resolve('dist'),scenarios=new Map();
await store.purchase('qa-alice','cs_site_fixture',200);
await store.checkin('qa-bob');
const now=Date.now();await store.registerCampaign({id:'site-beta',amount:100,budget:100,recipients:[digest('qa-alice')],startsAt:now-1000,endsAt:now+86400000,expiresAt:now+7*86400000});
const authenticate=async req=>{const uid=req.headers.authorization==='Bearer qa-only'?'qa-alice':req.headers.authorization==='Bearer qa-only-bob'?'qa-bob':null;if(!uid)throw Object.assign(Error('请先登录模拟账号'),{status:401});return {id:uid};};
const bill=createChatBilling({env,authenticate,services:()=>({db})});
const configuration={configured:true,model:'qa-model',provider:'fixture',billing:creditPolicy(env),walletMode:'test',walletConfigured:true,payments:false,creditPacks:[],auth:null};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const provider=()=>({name:'fixture',model:'qa-model',kind:'google'});
const {coverImage:pixel}=await import('../tests/fixtures/cover-image.mjs');
const mime=file=>file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.json')?'application/json':'text/html; charset=utf-8';
http.createServer(async(req,res)=>{
 res.status=n=>{res.statusCode=n;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));return res;};
 res.setHeader('Cache-Control','no-store');
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>120000)throw Error('too long');}
   const body=raw?JSON.parse(raw):{};req.body=body;
   if(url.pathname==='/api/config')return res.json(configuration);
   if(url.pathname==='/api/titles'&&req.method==='GET')return res.json({titles:[]});
   const {id:uid}=await authenticate(req);
   if(url.pathname==='/api/qa-case'){if(!['failure','slow','disconnect'].includes(body.scenario))throw Error('Invalid fixture');scenarios.set(uid,body.scenario);return res.json({queued:body.scenario});}
   if(url.pathname==='/api/wallet'){
    if(body.action==='quote')return res.json({...quote(body,env,body.route||'chat'),wallet:await store.read(uid)});
    if(body.action==='status')return res.json(await store.status(uid,body.id));
    if(body.action==='claim')return res.json(await store.grant(uid,body.campaign));
    return res.json(await store.read(uid));
   }
   if(url.pathname==='/api/checkin')return res.json(await store.checkin(uid));
   const scenario=scenarios.get(uid)||(body.qaFailure?'failure':'success');scenarios.delete(uid);
   req.headers.origin='https://'+req.headers.host;
   if(url.pathname==='/api/chat'){
    const text=body.task==='author'?(body.field==='title'?'雨后的灯塔':body.field==='details'?'雨后的港城里，修灯人守护着一座旧灯塔。每一次选择都会改变她和旅人的关系。':'今天我们一起走过雨后的街道。'): '我记得我们在露天影院见面。你今天想聊些什么？';
    const handler=createChatHandler({bill,provider,model:()=>({}),stream:()=>({stream:(async function*(){
     const chunks=text.match(/.{1,8}/gu)||[];
     for(let i=0;i<chunks.length;i++){
      await pause(scenario==='slow'?1000:120);yield {type:'text-delta',text:chunks[i]};
      if(scenario==='disconnect'){res.destroy();throw Error('Fixture connection lost');}
      if(scenario==='failure')throw Error('Fixture model failure');
     }
     yield {type:'finish',finishReason:'stop',usage:{inputTokens:50,outputTokens:30}};
    })()})});return await handler(req,res);
   }
   if(url.pathname==='/api/image')return await createImageHandler({bill,configuration:()=>({key:'fixture-only',model:'qa-image'}),fetchImpl:async(_url,init)=>{
    await pause(scenario==='slow'?3000:300);
    if(init.signal.aborted)throw Error('Fixture cancelled');
    if(scenario==='disconnect'){res.destroy();throw Error('Fixture connection lost');}
    return scenario==='failure'?Response.json({error:{code:'fixture_failed'}},{status:503}):Response.json({data:[{b64_json:pixel}],usage:{input_tokens:10,output_tokens:20}});
   }})(req,res);
   if(['/api/sanguo','/api/three-kingdoms','/api/book-campaign'].includes(url.pathname))return await createHandler({bill,config:provider,fallback:()=>null,model:()=>({}),stage:()=>({}),hasVisible:o=>Boolean(o?.reply||o?.blocks?.length),validateOutput:()=>{},stream:()=>({
    partialOutputStream:(async function*(){await pause(scenario==='slow'?2000:200);if(scenario==='failure')throw Error('Fixture game failure');yield {reply:'今天的约定，我记住了。',mood:'warm',tone:'warm',values:[],move:null};})(),
    output:Promise.resolve({reply:'今天的约定，我记住了。',mood:'warm',tone:'warm',values:[],move:null}),finishReason:Promise.resolve('stop'),totalUsage:Promise.resolve({inputTokens:40,outputTokens:12})
   }),generate:async()=>({text:JSON.stringify({kind:'talk',reply:'你好',blocks:[{type:'dialogue',speaker:'npc',text:'你好'}]}),finishReason:'stop',usage:{inputTokens:40,outputTokens:12}})})(req,res);
   return res.status(404).json({error:'Unknown fixture API'});
  }
  let file=url.pathname==='/assets/account.js'?path.resolve('tests/fixtures/credits-site-account.js'):url.pathname==='/__qa/panel.js'?path.resolve('tests/fixtures/credits-site-panel.js'):path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)&&!file.startsWith(path.resolve('tests/fixtures')+path.sep))throw Error('Invalid path');
  let bytes;
  try{bytes=await readFile(file);}catch{if(path.extname(url.pathname))return res.status(404).end('Not found');file=path.join(root,'index.html');bytes=await readFile(file);}
  if(file===path.join(root,'index.html'))bytes=Buffer.from(bytes.toString().replace('</body>','<script type="module" src="/__qa/panel.js"></script></body>'));
  res.setHeader('Content-Type',mime(file));res.end(bytes);
 }catch(error){if(!res.destroyed&&!res.writableEnded)res.status(error.status||503).json({code:error.code,error:error.code?error.message:error.status===401?error.message:'Fixture service error'});}
}).listen(3113,'127.0.0.1',()=>console.log('Full-site credit QA: http://127.0.0.1:3113/builder/story/new — fixtures only'));
