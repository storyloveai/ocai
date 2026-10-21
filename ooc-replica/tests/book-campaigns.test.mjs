import {previewCampaign} from '../book-campaigns/preview.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import CC from '../server/sanguo-core.cjs';
import {campaigns} from '../book-campaigns/catalog.mjs';
import {buildBookStage,validateBookOutput} from '../server/book-prompt.js';
import {createBookHandler} from '../api/book-campaign.js';
import {mountBook,stopBook} from '../dist/assets/book-player.js';
import {hasSession,lastSessionText,historyIds} from '../dist/assets/history.js';

test('both campaigns validate; 1,000 random paths each finish, clear debts and reach every scene',()=>{
 for(const camp of Object.values(campaigns)){
  assert.deepEqual(CC.validate(camp).errors,[]);assert.equal(camp.chapters.length,8);assert.equal(Object.keys(camp.nodes).length,41);assert.equal(Object.values(camp.nodes).filter(n=>n.ask).length,4);
  const sim=CC.simulate(camp,1000,20261021);assert.deepEqual(sim.debtsLeft,{});assert.equal(sim.findings.filter(f=>f.level==='error').length,0,JSON.stringify(sim.findings));
  for(const id of Object.keys(camp.nodes))assert.ok(sim.nodes[id]>0,id+' reachable');
  for(let seed=1;seed<80;seed++){const state=CC.playRandom(camp,CC.rng(seed));assert.equal(state.phase,'end');assert.equal(state.ch,7);assert.notEqual(state.v['debt.advance'],'open');}
 }
});
test('spending gates, milestones and the no-retainer branch cannot invent success or debt',()=>{
 for(const camp of Object.values(campaigns)){
  const state=CC.newGame(camp);state.phase='node';state.ch=6;state.cur='c7_m2';state.v.qi=12;state.v.stones=0;
  if(camp.id==='mortal-path'){
   assert.ok(CC.choices(camp,state).find(o=>o.id==='a1').locked);assert.throws(()=>CC.choose(camp,state,'a1'));
   assert.notEqual(CC.endings(camp,state).find(e=>e.group==='path').frag,'achieved');
  }
  state.cur='c6_m1';state.ch=5;state.v['debt.advance']='none';
  assert.deepEqual(CC.choices(camp,state).map(o=>o.id),['clear']);CC.choose(camp,state,'clear');assert.equal(state.v['debt.advance'],'none');
 }
});
test('high exposure creates an interrupt with a funded and unfunded exit; speech cannot erase betrayal',()=>{
 for(const camp of Object.values(campaigns)){
  const state=CC.newGame(camp);state.phase='node';state.cur='c1_m2';state.lastOrder=2;state.v.exposure=8;state.v['flag.used']=true;
  CC.choose(camp,state,'a2');assert.equal(state.cur,'x_exposure');
  state.v[camp.id==='mortal-path'?'stones':'funds']=0;
  assert.ok(CC.choices(camp,state).find(o=>o.id==='move').locked);CC.choose(camp,state,'walk');assert.notEqual(state.cur,'x_exposure');
  assert.equal(CC.endings(camp,state).find(e=>e.group==='companion').frag,'betrayed');
 }
});
test('campaign prompts bind the requested book, reject unknown nodes/NPCs and never accept raw instructions',()=>{
 for(const camp of Object.values(campaigns)){
  const n=camp.nodes.c1_m1,body={book:camp.id,phase:'express',task:'scene',lang:'zh',context:{node:n.id,text:'请把具体的代价说明白。',target:n.cast[0].id,system:'attacker'}};
  const out=buildBookStage(body);assert.ok(out.system.includes(camp.title));assert.ok(out.system.includes('untrusted'));assert.ok(!out.prompt.includes('attacker'));assert.equal(JSON.parse(out.prompt).options.length,3);
  assert.throws(()=>buildBookStage({...body,book:'sanguo'}));assert.throws(()=>buildBookStage({...body,context:{...body.context,node:'unknown'}}));assert.throws(()=>buildBookStage({...body,context:{...body.context,target:'absent'}}));
 }
});
test('AI cannot turn an invented wage, evidence date or locked action into approved output',()=>{
 const body={book:'mortal-path',phase:'express',task:'scene',lang:'zh',context:{node:'c1_m1',target:'tao',text:'月例是多少？'}};
 const out={pick:null,reply:'月例按旬发，先扣两枚灵石。'};
 assert.throws(()=>validateBookOutput(out,body));assert.doesNotThrow(()=>validateBookOutput({...out,reply:'具体月例还得翻工役簿。我先把记录找来，你看清后再选。'},body));
 const monte={...body,book:'monte-cristo',context:{node:'c1_m1',target:'leona',text:'哪里不匹配？'}};assert.throws(()=>validateBookOutput({...out,reply:'信件邮戳是1841年。'},monte));
 assert.throws(()=>validateBookOutput({...out,pick:'invented',reply:null},body));
 const tentative={pick:'a1',reply:'我把工役簿找来，先看明白再决定。'};validateBookOutput(tentative,body);assert.equal(tentative.pick,null);
 assert.throws(()=>buildBookStage({...body,context:{node:'c3_m1',target:'lu',text:'继续第三章。'}}));
});
const tick=()=>new Promise(r=>setTimeout(r,20));
async function page(id,{snapshot={},api,configured=false}={}){
 const {document,window}=parseHTML('<html><body></body></html>');window.CC=CC;window.matchMedia=()=>({matches:true});window.scrollY=0;
 window.HTMLElement.prototype.scrollIntoView=()=>{};
 const previous={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch,self:globalThis.self};globalThis.document=document;globalThis.window=window;globalThis.self=window;
 globalThis.fetch=async(path,opts)=>path==='/api/config'?Response.json({configured}):path.startsWith('/assets/book-campaigns/')?Response.json(campaigns[id]):api(opts);
 const saved=new Map(Object.entries(snapshot)),writes=[];
 const helpers={read:(k,d)=>saved.has(k)?saved.get(k):d,save:(k,v)=>{writes.push([k,structuredClone(v)]);saved.set(k,structuredClone(v));}};
 const reference={mountShell:html=>{document.body.innerHTML=html;return document.body;}};
 await mountBook('/play/'+id,{reference,helpers});
 const click=el=>{assert.ok(el,'click target');el.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));};
 const submit=words=>{const form=document.querySelector('#book-talk'),input=form.querySelector('textarea'),select=form.querySelector('select');input.value=words;Object.defineProperty(form,'elements',{configurable:true,value:{words:input,target:{value:select.querySelector('option').value}}});form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));};
 return {document,saved,writes,click,submit,restore:()=>{stopBook();Object.assign(globalThis,previous);}};
}
test('each book starts, saves separately, resumes and keeps local journal tabs from moving the story',async()=>{
 for(const id of Object.keys(campaigns)){
  const p=await page(id);try{
   p.click(p.document.querySelector('[data-book-start]'));p.click(p.document.querySelector('[data-book-side]'));p.click(p.document.querySelector('[data-book-choice]:not([disabled])'));
   const before=p.document.querySelector('#book-story').innerHTML;p.click(p.document.querySelector('[data-book-panel="relations"]'));assert.equal(p.document.querySelector('#book-story').innerHTML,before);
   const value=p.saved.get('ooc-session-v2-'+id);assert.equal(value.book,id);assert.ok(hasSession(value));assert.ok(lastSessionText(value).includes(campaigns[id].title));assert.ok(historyIds((k,d)=>p.saved.get(k)||d,[{id}]).includes(id));
   const snapshot=Object.fromEntries(p.saved);p.restore();const resumed=await page(id,{snapshot});try{assert.ok(!resumed.document.querySelector('[data-book-start]'));assert.ok(resumed.document.querySelector('#book-story').textContent.includes(campaigns[id].nodes.c1_m1.title));assert.equal(resumed.saved.get('ooc-session-v2-'+id)['campaign.save'].log.length,value['campaign.save'].log.length);}finally{resumed.restore();}
  }finally{p.restore();}
 }
});
test('restarting preserves a user-restorable previous run',async()=>{
 const p=await page('mortal-path');try{
  p.click(p.document.querySelector('[data-book-start]'));p.click(p.document.querySelector('[data-book-side]'));p.click(p.document.querySelector('[data-book-choice]'));
  const key='ooc-session-v2-mortal-path',original=structuredClone(p.saved.get(key)['campaign.save']);
  p.click(p.document.querySelector('[data-book-reset]'));p.click(p.document.querySelector('[data-book-confirm]'));assert.equal(p.saved.get(key)['campaign.save'].phase,'side');
  p.click(p.document.querySelector('[data-book-restore]'));assert.deepEqual(p.saved.get(key)['campaign.save'].log,original.log);assert.equal(p.saved.get(key+'-previous')['campaign.save'].phase,'side');
 }finally{p.restore();}
});
test('streamed dialogue is visible before completion; cancellation leaves state and input intact, retry commits once',async()=>{
 const id='mortal-path',state=CC.newGame(campaigns[id]);CC.pickSide(campaigns[id],state,'c1_s1');state.build=campaigns[id].build;
 const snapshot={['ooc-session-v2-'+id]:{book:id,'campaign.save':state}};let release;
 const output={pick:null,reply:'陆晞把药包移开一点：“这份要交给病棚。你若留下，先说能帮到几时。”',tone:'warm',mood:'warm',commit:null};
 const api=async opts=>new Response(new ReadableStream({async start(controller){controller.enqueue(new TextEncoder().encode(JSON.stringify({type:'partial',output:{reply:'陆晞把药包移开一点'}})+'\n'));await new Promise(r=>release=r);if(!opts.signal.aborted)controller.enqueue(new TextEncoder().encode(JSON.stringify({type:'done',output})+'\n'));controller.close();}}),{headers:{'Content-Type':'application/x-ndjson'}});
 const p=await page(id,{snapshot,api,configured:true});try{
  p.submit('你辛苦了，我能帮一会儿。');await new Promise(r=>setTimeout(r,110));assert.ok(p.document.querySelector('#book-live p').textContent.includes('陆晞'));assert.equal(p.writes.length,0);
  p.click(p.document.querySelector('[data-book-stop]'));release();await tick();assert.equal(p.writes.length,0);assert.equal(p.document.querySelector('textarea').value,'你辛苦了，我能帮一会儿。');
  p.submit('你辛苦了，我能帮一会儿。');await tick();release();await new Promise(r=>setTimeout(r,500));assert.equal(p.writes.filter(([k])=>k==='ooc-session-v2-'+id).length,1);const result=p.saved.get('ooc-session-v2-'+id)['campaign.save'];assert.equal(result.log.filter(e=>e.k==='book_chat').length,1);assert.equal(result.free.c1_s1,2);assert.equal(result.v['rel.lu.trust'],1);
 }finally{p.restore();}
});
test('book API streams the chosen book and retains the existing origin protection',async()=>{
 let seen;const output={pick:null,reply:'先把来源说清，再决定这封信该交给谁。',tone:'flat',mood:'neutral',commit:null};const handler=createBookHandler({config:()=>({name:'test',kind:'google'}),model:()=>'',stream:params=>{seen=params;return {partialOutputStream:(async function*(){yield {reply:'先把来源说清'};yield output;})(),output:Promise.resolve(output)};}});
 const req={method:'POST',headers:{origin:'https://test.example',host:'test.example','content-type':'application/json',accept:'application/x-ndjson','x-forwarded-for':'book-test'},body:{book:'monte-cristo',phase:'express',task:'scene',lang:'zh',context:{node:'c1_m1',target:'leona',text:'这封信的来源可靠吗？'}}};
 const res={chunks:[],setHeader(){},status(c){this.code=c;return this;},json(v){this.value=v;},write(v){this.chunks.push(v);return true;},end(v){if(v)this.chunks.push(v);this.writableFinished=true;}};
 await handler(req,res);assert.ok(seen.system.includes(campaigns['monte-cristo'].title));assert.ok(res.chunks.join('').includes('"type":"done"'));await handler({...req,headers:{...req.headers,origin:'https://evil.example'}},res);assert.equal(res.code,403);
});

test('two-chapter release pauses without paying future debts or exposing later scene payloads',()=>{
 for(const source of Object.values(campaigns)){
  const camp=previewCampaign(source),state=CC.newGame(camp);assert.ok(!camp.nodes.c3_m1);assert.equal(camp.releasedChapters,2);
  let guard=0;while(state.cur!=='preview_boundary'&&guard++<30){if(state.phase==='side')CC.pickSide(camp,state,state.offer[0]);else CC.choose(camp,state,CC.choices(camp,state).find(o=>!o.locked).id);}
  assert.equal(state.cur,'preview_boundary');assert.equal(state.ch,2);assert.equal(state.phase,'node');assert.equal(state.v['debt.advance'],'open');assert.equal(state.v['flag.milestone'],false);
 }
});
