import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {sanguoCharacters} from '../dist/assets/sanguo-characters.js';

const pages=JSON.parse(await readFile(new URL('../dist/assets/interaction-pages.json',import.meta.url),'utf8'));
const source=await readFile(new URL('../dist/assets/interaction.js',import.meta.url),'utf8');

test('captured chat shell keeps working suggestions, rich code copy, local history and accessible settings',async()=>{
 const {document,window}=parseHTML('<html><head></head><body></body></html>');
 const original={document:globalThis.document,fetch:globalThis.fetch,matchMedia:globalThis.matchMedia,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator')};
 let focused,copied,suggestionRequest,failNarration=false;
 const configuration={configured:true,model:'gemini-test-flash'},narrationRequests=[];
 const waitFor=async predicate=>{for(let i=0;i<200;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,10));}assert.fail('chat did not settle');};
 globalThis.document=document;globalThis.matchMedia=()=>({matches:false});
 Object.defineProperty(document,'activeElement',{get:()=>focused});
 window.HTMLElement.prototype.focus=function(){focused=this;};
 window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};
 window.HTMLElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{copied=text;}}}});
 const append=document.head.append.bind(document.head);document.head.append=(link)=>{append(link);queueMicrotask(()=>link.onload?.());};
 globalThis.fetch=async (url,options)=>{if(url==='/api/chat'){
   suggestionRequest=JSON.parse(options.body);
   if(suggestionRequest.task!=='suggestions'){narrationRequests.push(suggestionRequest);if(failNarration)return new Response(JSON.stringify({error:'角色对话暂时无法连接，请稍后重试。',code:'AI_NOT_CONFIGURED'}),{status:503});return new Response(JSON.stringify({type:'text',text:'貂蝉听见你的问题，停下了脚步。'})+'\n'+JSON.stringify({type:'done'})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});}
   const text=JSON.stringify(['Read the letter on the desk.','Wait behind the shelves.','Ask who is approaching.']);
   return new Response(JSON.stringify({type:'text',text})+'\n'+JSON.stringify({type:'done'})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});
  }return {ok:true,json:async()=>url.includes('interaction-pages')?pages:url.includes('scenarios')?{stories:{}}:configuration};};
 try{
  const adapted=source.replace("'./sanguo-characters.js'",JSON.stringify(new URL('../dist/assets/sanguo-characters.js',import.meta.url).href)).replace("'./sanguo-character-hub.js'",JSON.stringify(new URL('../dist/assets/sanguo-character-hub.js',import.meta.url).href)).replace("import {mountInteraction} from './reference.js';",'const mountInteraction=html=>{document.body.innerHTML=html;return document.body;};').replace("'./analytics.js'",JSON.stringify(new URL('../dist/assets/analytics.js',import.meta.url).href)).replace("'./suggestions.js'",JSON.stringify(new URL('../dist/assets/suggestions.js',import.meta.url).href)).replace("'./stream.js'",JSON.stringify(new URL('../dist/assets/stream.js',import.meta.url).href)).replace("'./site-shell.js'",JSON.stringify(new URL('../dist/assets/site-shell.js',import.meta.url).href)).replace("'./history.js'",JSON.stringify(new URL('../dist/assets/history.js',import.meta.url).href)).replace("'./public-config.js'",JSON.stringify(new URL('../dist/assets/public-config.js',import.meta.url).href));
  const {show}=await import('data:text/javascript;base64,'+Buffer.from(adapted).toString('base64'));
  const id='69f414d90abbab6f6a2c8131',other='6aaad8746c080a5d3ff0402a';
  const values=new Map([['ooc-session-v2-'+id,[{role:'user',text:'Hello'},{role:'assistant',text:'A reply\n\n```info\nTier: Beginner\n```',suggestions:['Inspect the academy guide.','Ask about the hall.','Listen for the courtyard bell.']}]],['ooc-session-v2-'+other,[{role:'user',text:'A second story'}]]]);
  const routes=[];const helpers={data:[{id,title:'Lumencia Academy',image:'assets/cover.webp'},{id:other,title:'APEX Heroes Academy',image:'assets/apex.webp'}],read:(key,fallback)=>values.get(key)??fallback,save:(key,value)=>values.set(key,value),navigate:path=>routes.push(path)};
  assert.equal(show('/play/'+id,helpers),true);
  assert.equal(document.querySelectorAll('.suggestion-send').length,3);
  assert.equal(document.querySelectorAll('.message-tools button').length,4);
  assert.ok(document.querySelector('[data-control=model] img'),'model identity icon stays in the captured shell');
  assert.ok(!document.querySelector('#session-messages [data-mode]'),'live model configuration stays out of story text');
  document.querySelector('[data-edit="0"]').click();
  assert.equal(document.querySelector('#session-input').textContent,'Inspect the academy guide.');
  assert.equal(focused,document.querySelector('#session-input'));
  const copy=document.querySelector('[data-copy-code]');assert.ok(copy);copy.click();await Promise.resolve();
  assert.equal(copied,'Tier: Beginner\n');assert.equal(copy.getAttribute('aria-label'),'Copied');
  document.querySelector('[data-copy-message]').click();await Promise.resolve();assert.match(copied,/A reply/);
  const toggle=document.querySelector('[data-control=suggest]');toggle.click();
  assert.equal(document.querySelector('.session-suggestions'),null);assert.equal(toggle.getAttribute('aria-pressed'),'false');
  assert.equal(values.get('ooc-suggestions-visible'),false);toggle.click();assert.equal(document.querySelectorAll('.suggestion-send').length,3);
  const settings=document.querySelector('#session-settings'),settingsToggle=document.querySelector('[data-control=settings]');
  assert.equal(settings.inert,true);settingsToggle.click();assert.equal(settings.inert,false);assert.equal(settingsToggle.getAttribute('aria-expanded'),'true');
  const escape=new window.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(escape,'key',{value:'Escape'});document.dispatchEvent(escape);
  assert.equal(settings.inert,true);assert.equal(settingsToggle.getAttribute('aria-expanded'),'false');assert.equal(focused,settingsToggle);
  assert.equal(document.querySelectorAll('.session-history-item').length,2);
  const sidebar=document.querySelector('[data-shrink]');[...sidebar.querySelectorAll('button')].find(button=>button.textContent.trim()==='Character').click();assert.ok(document.querySelector('.session-history-empty'));
  [...sidebar.querySelectorAll('button')].find(button=>button.textContent.trim()==='Search').click();assert.deepEqual(routes,['/search']);
  // Older saved conversations acquire scene-based suggestions, then reuse the cached result.
  delete values.get('ooc-session-v2-'+id).at(-1).suggestions;
  show('/play/'+id,helpers);assert.equal(document.querySelectorAll('.suggestion-send').length,0);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(suggestionRequest.task,'suggestions');assert.equal(suggestionRequest.titleId,id);
  assert.match(suggestionRequest.messages.at(-1).content,/A reply/);
  assert.equal(document.querySelectorAll('.suggestion-send').length,3);
  assert.equal(document.querySelector('.suggestion-content').textContent,'Read the letter on the desk.');
  assert.equal(values.get('ooc-session-v2-'+id).at(-1).suggestions[0],'Read the letter on the desk.');
  // A mode switch stays on this URL, so it must remount without a no-op navigation.
  // With a configured server a stale saved Demo preference is ignored: replies always come from the AI.
  values.set('ooc-response-mode','demo');show('/play/'+id,helpers);
  assert.equal(document.querySelector('[data-mode]'),null);
  assert.match(document.querySelector('[data-control=model]').textContent,/Gemini test Flash/);
  assert.match(document.querySelector('#session-messages').textContent,/A reply/);
  assert.deepEqual(routes,['/search'],'same-page mode switches do not rely on navigation');
  // The active history category and its handlers survive translated labels and async saves.
  const character={id:'sgc-007',title:'Diaochan',title_zh:'貂蝉',description:'Diaochan of the Three Kingdoms.',description_zh:'与貂蝉对话。',type:'character',image:'/assets/originals/sgc-007.webp'};
  helpers.data.push(character);
  values.set('ooc-custom',[{publishedId:'u-published',status:'published',type:'character',title:'Published character',image:'/character.webp'}]);
  values.set('ooc-history',[id,other,'u-published','unknown-title']);
  show('/play/'+character.id,helpers);await new Promise(resolve=>setImmediate(resolve));
  const historyTab=kind=>document.querySelector(`[data-history-mode="${kind}"]`);
  assert.equal(historyTab('character').getAttribute('aria-pressed'),'true');
  assert.equal(historyTab('story').getAttribute('aria-pressed'),'false');
  assert.equal(document.querySelectorAll('.session-history-item').length,2);
  assert.ok(document.querySelector('.session-history-item a[href="/play/u-published"]'));
  assert.equal(document.querySelector('.session-history-item a[href="/play/unknown-title"]'),null);
  assert.doesNotMatch(document.querySelector('#session-messages').textContent,/Ashley|neighbour/);
  historyTab('story').textContent='故事';historyTab('character').textContent='角色';historyTab('story').click();
  assert.equal(historyTab('story').getAttribute('aria-pressed'),'true');
  assert.equal(document.querySelectorAll('.session-history-item').length,2);
  document.querySelector('#session-input').textContent='谁在听？';document.querySelector('[data-control=send]').click();
  await waitFor(()=>values.get('ooc-session-v2-sgc-007')?.at(-1)?.text==='貂蝉听见你的问题，停下了脚步。'&&!values.get('ooc-session-v2-sgc-007').at(-1).streaming);
  assert.equal(narrationRequests.at(-1).titleId,'sgc-007');
  assert.equal(narrationRequests.at(-1).messages.at(-1).content,'谁在听？');
  assert.equal(historyTab('story').getAttribute('aria-pressed'),'true','a completed reply keeps the manually selected history category');
  assert.equal(document.querySelector('.session-history-item a[href="/play/sgc-007"]'),null);
  historyTab('character').click();assert.ok(document.querySelector('.session-history-item a[href="/play/sgc-007"]'));
  assert.equal(historyTab('character').getAttribute('aria-pressed'),'true');
  // A missing model must report an error rather than send Ashley's canned response as Diaochan.
  configuration.configured=false;failNarration=true;values.set('ooc-response-mode','demo');
  const previous=structuredClone(values.get('ooc-session-v2-sgc-007'));
  show('/play/sgc-007',helpers);assert.equal(document.querySelector('[data-mode]'),null);
  assert.equal(document.querySelector('[data-control=model]').textContent.trim(),'AI');
  document.querySelector('#session-input').textContent='你是谁？';document.querySelector('[data-control=send]').click();
  await waitFor(()=>values.get('ooc-session-v2-sgc-007')?.at(-1)?.failed===true);
  assert.equal(narrationRequests.at(-1).titleId,'sgc-007');
  assert.deepEqual(values.get('ooc-session-v2-sgc-007').slice(0,previous.length),previous,'saved messages remain intact');
  assert.doesNotMatch(document.querySelector('#session-messages').textContent,/Ashley|lovely café/);
  assert.match(document.querySelector('.session-error').textContent,/角色对话暂时无法连接/);
  // These six openings and first moves do not depend on a model being online.
  // They stay attached to the selected person rather than a captured demo shell.
  helpers.data.push(...sanguoCharacters.map(c=>({...c,type:'character'})));
  const lastSuggestionRequest=suggestionRequest;
  for(const lang of ['zh','en'])for(const c of sanguoCharacters){
   document.documentElement.lang=lang;
   show('/play/'+c.id,helpers);
   assert.equal(document.querySelector('.sg-chat-intro h2').textContent,lang==='zh'?c.title_zh:c.title);
   assert.equal(document.querySelector('.sg-chat-intro img').getAttribute('src'),c.image);
   assert.equal(document.querySelector('.session-empty-preview'),null);
   assert.deepEqual([...document.querySelectorAll('.suggestion-content')].map(el=>el.textContent),c.starters[lang]);
   assert.equal(suggestionRequest,lastSuggestionRequest,'authored first moves make no model request');
  }
  configuration.configured=true;failNarration=false;
  // Profiles written through settings or migrated from older versions omit genres.
  for(const genres of [undefined,null,'Fantasy']){
   values.set('ooc-profile',{name:'Existing player',audience:'Female',...(genres===undefined?{}:{genres})});
   assert.doesNotThrow(()=>show('/onboarding/3',helpers));
   const fantasy=[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Fantasy');
   assert.equal(fantasy.getAttribute('aria-pressed'),'true');fantasy.click();
   assert.ok(Array.isArray(values.get('ooc-profile').genres));
   assert.equal(values.get('ooc-profile').genres.includes('Fantasy'),false);
   assert.equal(values.get('ooc-profile').name,'Existing player');
  }
  values.set('ooc-profile',{name:'Existing player',genres:[]});show('/onboarding/3',helpers);
  assert.equal([...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Fantasy').getAttribute('aria-pressed'),'false','an intentionally empty selection remains empty');
  show('/',helpers);
 }finally{
  for(const key of ['document','fetch','matchMedia'])if(original[key]===undefined)delete globalThis[key];else globalThis[key]=original[key];
  if(original.navigator)Object.defineProperty(globalThis,'navigator',original.navigator);else delete globalThis.navigator;
 }
});
