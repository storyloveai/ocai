import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';

const pages=JSON.parse(await readFile(new URL('../dist/assets/interaction-pages.json',import.meta.url),'utf8'));
const source=await readFile(new URL('../dist/assets/interaction.js',import.meta.url),'utf8');

test('captured chat shell keeps working suggestions, rich code copy, local history and accessible settings',async()=>{
 const {document,window}=parseHTML('<html><head></head><body></body></html>');
 const original={document:globalThis.document,fetch:globalThis.fetch,matchMedia:globalThis.matchMedia,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator')};
 let focused,copied;
 globalThis.document=document;globalThis.matchMedia=()=>({matches:false});
 Object.defineProperty(document,'activeElement',{get:()=>focused});
 window.HTMLElement.prototype.focus=function(){focused=this;};
 window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};
 window.HTMLElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{copied=text;}}}});
 const append=document.head.append.bind(document.head);document.head.append=(link)=>{append(link);queueMicrotask(()=>link.onload?.());};
 globalThis.fetch=async url=>({ok:true,json:async()=>url.includes('interaction-pages')?pages:url.includes('scenarios')?{stories:{}}:{configured:true,model:'gemini-test-flash'}});
 try{
  const adapted=source.replace("import {mountInteraction} from './reference.js';",'const mountInteraction=html=>{document.body.innerHTML=html;return document.body;};').replace("'./stream.js'",JSON.stringify(new URL('../dist/assets/stream.js',import.meta.url).href));
  const {show}=await import('data:text/javascript;base64,'+Buffer.from(adapted).toString('base64'));
  const id='69f414d90abbab6f6a2c8131',other='6aaad8746c080a5d3ff0402a';
  const values=new Map([['ooc-session-v2-'+id,[{role:'user',text:'Hello'},{role:'assistant',text:'A reply\n\n```info\nTier: Beginner\n```'}]],['ooc-session-v2-'+other,[{role:'user',text:'A second story'}]]]);
  const routes=[];const helpers={data:[{id,title:'Lumencia Academy',image:'assets/cover.webp'},{id:other,title:'APEX Heroes Academy',image:'assets/apex.webp'}],read:(key,fallback)=>values.get(key)??fallback,save:(key,value)=>values.set(key,value),navigate:path=>routes.push(path)};
  assert.equal(show('/play/'+id,helpers),true);
  assert.equal(document.querySelectorAll('.suggestion-send').length,3);
  assert.equal(document.querySelectorAll('.message-tools button').length,4);
  assert.ok(document.querySelector('[data-control=model] img'),'model identity icon stays in the captured shell');
  assert.ok(!document.querySelector('#session-messages [data-mode]'),'live model configuration stays out of story text');
  document.querySelector('[data-edit="0"]').click();
  assert.equal(document.querySelector('#session-input').textContent,'Where can I find the library?');
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
  show('/',helpers);
 }finally{
  for(const key of ['document','fetch','matchMedia'])if(original[key]===undefined)delete globalThis[key];else globalThis[key]=original[key];
  if(original.navigator)Object.defineProperty(globalThis,'navigator',original.navigator);else delete globalThis.navigator;
 }
});
