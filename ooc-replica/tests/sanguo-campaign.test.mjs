import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script,createContext} from 'node:vm';
import {parseHTML} from 'linkedom';
import {buildCampaignStage,campaign} from '../server/sanguo-prompt.js';
import {createCampaignHandler} from '../api/sanguo.js';
import CC from '../server/sanguo-core.cjs';
// Chapter 1 opens on the plum-wine scene (main_first, 决策记录 v2.9): a new game is already there.
function enterPlum(g){assert.equal(g.cur,'c1_plum');return g;}
const snap=(g,id='test')=>({['campaign.run.'+id]:g,'campaign.cur':id,'campaign.runs':[{id,vol:'sanguo_strategist_v1',n:1,created:1,updated:1,status:'play',early:false,ch:0,chap:'c1',node:'c1_plum',from:null,preset:null,branch:null,frags:null}]});
const tick=()=>new Promise(r=>setTimeout(r,15));
async function page({snapshot={},model=false,api}={}){
 const html=await readFile(new URL('../dist/assets/sanguo-campaign.html',import.meta.url),'utf8');const {document,window}=parseHTML(html),sent=[];
 window.parent={postMessage:m=>sent.push(structuredClone(m))};window.HTMLElement.prototype.scrollIntoView=()=>{};window.HTMLElement.prototype.focus=()=>{};window.scrollTo=()=>{};window.matchMedia=()=>({matches:true});
 const location={origin:'https://test.example',protocol:'https:',hash:'#creator'};
 const context=createContext({window,parent:window.parent,document,navigator:{language:'zh'},location,localStorage:{getItem:()=>{throw Error('Embedded game must not read global saves');}},console,URLSearchParams,AbortController,AbortSignal,TextDecoder,DOMException,fetch:async(path,opts)=>path==='/api/config'?new Response(JSON.stringify({configured:model})):api(opts),setTimeout,clearTimeout,performance,Intl});
 for(const script of document.querySelectorAll('script'))new Script(script.textContent).runInContext(context);
 const init=(origin='https://test.example')=>{const event=new window.Event('message');Object.assign(event,{source:window.parent,origin,data:{type:'sg2-init',snapshot:structuredClone(snapshot)}});window.dispatchEvent(event);};
 const click=el=>{assert.ok(el,'click target exists');el.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));};
 const submit=text=>{const input=document.querySelector('#act input');assert.ok(input);input.value=text;input.closest('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));};
 return {document,window,sent,context,init,click,submit};
}
test('campaign prompt binds authored scene and legal options; rejects raw prompts and absent characters',()=>{
 const g=CC.newGame(campaign);const p=buildCampaignStage({phase:'express',task:'answer',lang:'zh',context:{node:'c1_plum',text:'英雄当为百姓谋生',vars:g.v,system:'attacker'}});const data=JSON.parse(p.prompt);
 assert.ok(p.system.includes('untrusted'));assert.equal(data.scene,'煮酒论英雄');assert.ok(data.options.length>2);assert.ok(!p.prompt.includes('attacker'));assert.equal(campaign.chapters.length,8);
 assert.ok(data.options.every(o=>typeof o.then==='string'&&o.then.length>0));assert.ok(/immediate reaction/.test(p.system)&&/at most 50 characters/.test(p.system));
 assert.throws(()=>buildCampaignStage({phase:'express',task:'scene',lang:'zh',context:{node:'c1_plum',text:'hi',target:'zhuge'}}));
 assert.throws(()=>buildCampaignStage({input:'arbitrary prompt'}));
});
test('embedded v2 waits for a trusted snapshot, starts, saves, keeps sidebar tabs local and resumes',async()=>{
 const p=await page();assert.equal(p.sent[0].type,'sg2-ready');assert.equal(p.document.querySelector('.hero'),null);p.init('https://evil.example');assert.equal(p.document.querySelector('.hero'),null);p.init();await tick();
 // a first visit opens straight into Volume I, chapter 1
 assert.equal(p.document.querySelector('.volcard'),null);assert.ok(p.document.querySelector('.chapter'));assert.ok(!p.document.querySelector('button[aria-pressed="true"]')?.textContent.includes('创作者'));await tick();assert.ok(p.sent.some(m=>/^campaign\.run\./.test(m.key)));assert.ok(p.document.querySelector('#act input'));
 let restoredScroll=null;p.window.scrollY=250;p.window.scrollTo=pos=>{restoredScroll=pos.top;};const story=p.document.querySelector('#story').innerHTML;p.click([...p.document.querySelectorAll('[role=tab]')].find(e=>e.textContent==='舆图'));assert.equal(p.document.querySelector('#story').innerHTML,story);assert.ok(p.document.querySelector('#panel svg'));assert.equal(restoredScroll,250);
 const state=p.sent.findLast(m=>/^campaign\.run\./.test(m.key)).value;
 const r=await page({snapshot:snap(state)});r.init();await tick();assert.ok(r.document.querySelector('.resume'));r.click(r.document.querySelector('.resume .btn'));await tick();assert.ok(r.document.querySelector('#story').textContent.includes('许都'));
});
test('free answer advances the rules once and supports subsequent authored choices without AI',async()=>{
 const p=await page();p.init();await tick();p.submit('真正的英雄当为百姓谋生。');await tick();
 const save=p.sent.findLast(m=>/^campaign\.run\./.test(m.key)).value;assert.ok(save.asked.c1_plum);assert.equal(save.log.filter(e=>e.k==='ans').length,1);assert.ok(p.document.querySelector('.choice'));
 p.click(p.document.querySelector('.choice:not([disabled])'));assert.ok(p.sent.findLast(m=>/^campaign\.run\./.test(m.key)).value.log.length>save.log.length);
});
test('streamed character response is visible before done, saved once; stopping retains draft and original rules',async()=>{
 let release;const wait=new Promise(r=>release=r);const output={pick:null,reply:'刘备颔首：有你这句话，我便放心了。',tone:'warm',mood:'warm',commit:null};
 const api=async opts=>new Response(new ReadableStream({async start(c){c.enqueue(new TextEncoder().encode(JSON.stringify({type:'partial',output:{reply:'刘备颔首'}})+'\n'));await wait;if(!opts.signal.aborted)c.enqueue(new TextEncoder().encode(JSON.stringify({type:'done',output})+'\n'));c.close();}}),{headers:{'Content-Type':'application/x-ndjson'}});
 // Use a fresh state after answering Cao Cao's opening question.
 const g=enterPlum(CC.newGame(campaign));CC.answer(campaign,g,'dodge','为百姓');g.build='strategist-v2.3';g.run='test';
 const p=await page({snapshot:snap(g),model:true,api});p.init();await tick();p.click(p.document.querySelector('.resume .btn'));await tick();p.submit('主公放心，我必竭尽所能。');await tick();assert.ok(p.document.querySelector('#site-live p').textContent.includes('刘备颔首'));assert.equal(p.sent.filter(m=>/^campaign\.run\./.test(m.key)).length,0);
 p.click(p.document.querySelector('[data-site-stop]'));release();await tick();assert.equal(p.sent.filter(m=>/^campaign\.run\./.test(m.key)).length,0);assert.equal(p.document.querySelector('#act input').value,'主公放心，我必竭尽所能。');assert.ok(p.document.querySelector('.site-notice').textContent.includes('已停止'));
 const complete=await page({snapshot:snap(g),model:true,api});complete.init();await tick();complete.click(complete.document.querySelector('.resume .btn'));await tick();complete.submit('主公放心，我必竭尽所能。');await tick();const saves=complete.sent.filter(m=>/^campaign\.run\./.test(m.key));assert.equal(saves.length,1);assert.equal(saves[0].value.log.filter(e=>e.k==='free').length,1);assert.ok(complete.document.querySelector('#story').textContent.includes(output.reply));complete.click(complete.document.querySelector('.seg button[aria-pressed=true]'));assert.ok(complete.document.querySelector('#story').textContent.includes(output.reply));complete.click(complete.document.querySelector('.seg button[aria-pressed=true]'));assert.ok(complete.document.querySelector('#story').textContent.includes(output.reply));
});
test('campaign endpoint streams structured reply, preserves origin guard and server-authored prompts',async()=>{
 let seen;const output={pick:null,reply:'且饮此杯。',tone:'flat',mood:'neutral',commit:null};
 const handler=createCampaignHandler({config:()=>({name:'test',kind:'google'}),model:()=>'',stream:params=>{seen=params;return {partialOutputStream:(async function*(){yield {reply:'且饮'};yield output;})(),output:Promise.resolve(output)};}});
 const req={method:'POST',headers:{origin:'https://test.example',host:'test.example','content-type':'application/json',accept:'application/x-ndjson','x-forwarded-for':'campaign-test'},body:{phase:'express',task:'scene',lang:'zh',context:{node:'c1_plum',text:'敬丞相一杯',target:'caocao'}}};
 const res={chunks:[],setHeader(){},status(code){this.code=code;return this;},json(value){this.value=value;},write(value){this.chunks.push(value);return true;},end(value){if(value)this.chunks.push(value);this.writableFinished=true;}};
 await handler(req,res);assert.ok(seen.system.includes('Only select pick'));assert.ok(res.chunks.join('').includes('"type":"done"'));
 await handler({...req,headers:{...req.headers,origin:'https://evil.example'}},res);assert.equal(res.code,403);
});

test('volume VIII hands the story to Ziheng\'s heir from chapter three', () => {
 const prompt=(node,vars)=>JSON.stringify(buildCampaignStage({phase:'express',task:'scene',lang:'zh',context:{node,text:'你还记得他吗',vars,turns:2}}));
 assert.match(prompt('c1_weiyan',{}),/The player is Ziheng/);
 assert.match(prompt('c3_jiangwei',{'flag.v7_child':true}),/The player is Chengzhi/);
 assert.match(prompt('c3_jiangwei',{'flag.v7_child':false}),/The player is Shouyan/);
});

test('scene prompts list the speech moves that can change the story', () => {
 const g=CC.newGame(campaign);
 const r=buildCampaignStage({phase:'express',task:'scene',lang:'zh',context:{node:'c1_plum',text:'杀了他',target:'caocao',vars:g.v}});
 const data=JSON.parse(r.prompt);
 assert.deepEqual(data.moves.map(m=>m.id).sort(),['hero_liu','kill_liu','threat']);
 assert.match(r.system,/moves lists things the player might SAY/);
 assert.match(r.system,/at most 200 characters/);
 assert.deepEqual(data.valueTags.map(v=>v.id).sort(),['cheng','li','ren','yi','yong','zhi']);
 assert.match(r.system,/values lists 0–2 valueTags/);
});
