import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {storydateCharacters} from '../dist/assets/storydate-originals.js';

test('rejoining uses an explicit action, keeps the draft and transcript, and retries a failed greeting without fabricating user lines',async()=>{
 const {document,window}=parseHTML('<html lang="zh"><head></head><body></body></html>');
 const keep={document:globalThis.document,matchMedia:globalThis.matchMedia,fetch:globalThis.fetch,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator')};
 const pages=JSON.parse(await readFile(new URL('../dist/assets/interaction-pages.json',import.meta.url))),requests=[];
 let fail=false;
 globalThis.document=document;globalThis.matchMedia=()=>({matches:true});Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async()=>{}}}});
 window.HTMLElement.prototype.focus=function(){};window.HTMLElement.prototype.scrollIntoView=function(){};window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};window.HTMLElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
 const append=document.head.append.bind(document.head);document.head.append=node=>{append(node);queueMicrotask(()=>node.onload?.());};
 globalThis.fetch=async(url,options)=>{
  if(url!=='/api/chat')return {ok:true,json:async()=>url.includes('interaction-pages')?pages:url.includes('scenarios')?{stories:{}}:{configured:true,model:'verification-model'}};
  const body=JSON.parse(options.body);requests.push(body);
  if(fail&&body.task==='character-reunion')return new Response(JSON.stringify({code:'AI_UPSTREAM',error:'Unavailable'}),{status:503});
  const text=body.task==='suggestions'?JSON.stringify(['我想先喝口水，再慢慢聊。','我问他还有什么想说的。','我们先聊点工作以外的事吧。']):'*顾承野合上笔。*\n\n“好，方案先放一边。”';
  return new Response(JSON.stringify({type:'text',text})+'\n'+JSON.stringify({type:'done'})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});
 };
 const source=await readFile(new URL('../dist/assets/interaction.js',import.meta.url),'utf8');
 const adapted=source.replace("import {mountInteraction} from './reference.js';",'const mountInteraction=html=>{document.body.innerHTML=html;return document.body;};').replace(/from '(\.\/[^']+)'/g,(_m,p)=>'from '+JSON.stringify(new URL('../dist/assets/'+p.slice(2),import.meta.url).href));
 let show;const id='oc-gu-chengye',key='ooc-session-v2-'+id,original=[{role:'user',text:'今晚先不谈工作。'},{role:'assistant',text:'“可以，我把模型挪开。”'}];
 const values=new Map([[key,structuredClone(original)],['ooc-profile',{name:'Alex',audience:'Neutral'}]]);
 const h={data:storydateCharacters,read:(k,f)=>structuredClone(values.get(k)??f),save:(k,v)=>values.set(k,structuredClone(v)),navigate(){}};
 const wait=async pred=>{for(let i=0;i<200;i++){if(pred())return;await new Promise(r=>setTimeout(r,10));}assert.fail('reunion did not settle');};
 try{
  ({show}=await import('data:text/javascript;base64,'+Buffer.from(adapted).toString('base64')));
  show('/play/'+id,h);await new Promise(r=>setImmediate(r));assert.equal(requests.length,0);assert.ok(document.querySelector('[data-character-reunion]'));assert.deepEqual(values.get(key),original);
  const input=document.querySelector('#session-input');if(input.tagName==='TEXTAREA')input.value='我还没发出的草稿';else input.textContent='我还没发出的草稿';
  document.querySelector('[data-character-reunion]').click();await wait(()=>values.get(key)?.at(-1)?.kind==='reunion'&&values.get(key)?.at(-1)?.suggestionsLanguage==='zh');
  const body=requests.find(r=>r.task==='character-reunion');assert.deepEqual(body.messages,original.map(m=>({role:m.role,content:m.text})));assert.equal(body.language,'zh');assert.match(body.memory,/今晚先不谈工作/);
  assert.equal(values.get(key).filter(m=>m.role==='user').length,1);assert.deepEqual(values.get(key).slice(0,2),original);assert.equal(input.tagName==='TEXTAREA'?input.value:input.textContent,'我还没发出的草稿');
  assert.ok(document.querySelector('.character-relationship-note'));assert.match(requests.find(r=>r.task==='suggestions').memory,/今晚先不谈工作/);
  values.set(key,structuredClone(original));show('/play/'+id,h);fail=true;document.querySelector('[data-character-reunion]').click();await wait(()=>values.get(key)?.at(-1)?.failed);
  assert.equal(values.get(key).length,3);assert.deepEqual(values.get(key).slice(0,2),original);assert.ok(document.querySelector('[data-regenerate="2"]'));
  document.querySelectorAll('.interaction-modal[open]').forEach(d=>d.close());fail=false;document.querySelector('[data-regenerate="2"]').click();await wait(()=>values.get(key)?.at(-1)?.suggestionsLanguage==='zh'&&!values.get(key).at(-1).failed);
  assert.equal(values.get(key).length,3);assert.equal(values.get(key).filter(m=>m.role==='user').length,1);assert.equal(requests.filter(r=>r.task==='character-reunion').length,3);
 }finally{show?.('/play/not-found',h);globalThis.document=keep.document;globalThis.matchMedia=keep.matchMedia;globalThis.fetch=keep.fetch;if(keep.navigator)Object.defineProperty(globalThis,'navigator',keep.navigator);else delete globalThis.navigator;}
});
