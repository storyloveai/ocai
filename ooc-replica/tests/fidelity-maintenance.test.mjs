import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML,DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {historyIds,lastSessionText} from '../dist/assets/history.js';
import {buildPrompt} from '../server/prompt-engine.js';
import {cloudKey} from '../dist/assets/account-storage.js';
const dist=fileURLToPath(new URL('../dist/',import.meta.url));
test('object-shaped Three Kingdoms progress remains in shared history after opening another session',()=>{
 const values=new Map([['ooc-history',['other']],['ooc-session-v2-three-kingdoms',{'game.sg08_arrows_from_fog':{turn:3}}],['ooc-session-v2-other',[{role:'assistant',text:'Still here'}]]]);
 const read=(k,f)=>values.get(k)??f;
 assert.deepEqual(historyIds(read,[{id:'three-kingdoms'},{id:'other'}]),['other','three-kingdoms']);assert.match(lastSessionText(read('ooc-session-v2-three-kingdoms')),/继续/);assert.equal(lastSessionText(read('ooc-session-v2-other')),'Still here');
});
test('all eight author fields use server-owned prompts, bounded data and the existing provider stream',()=>{
 for(const field of ['title','description','details','prologue','scenario','opening','guide','suggestions']){
  const p=buildPrompt({task:'author',type:'story',field,idea:'一个被流放的将军回到故乡',draft:{details:'x'.repeat(9000)}});assert.equal(p.mode,'author');assert.equal(p.promptVersion,'storylove-author-v2');assert.match(p.system,/same language as the seed/);assert.match(p.messages[0].content,/被流放/);assert.ok(p.messages[0].content.length<7000);assert.ok(!p.system.includes('被流放'));
 }
 assert.throws(()=>buildPrompt({task:'author',type:'story',field:'image',idea:'Cover'}));assert.throws(()=>buildPrompt({task:'author',type:'character',field:'details',idea:''}));assert.equal(cloudKey('ooc-comments-social-follows'),true);
});
test('all title kinds float, search preserves background, tabs update only content, creator comments and follow persist',async()=>{
 const {document,window}=parseHTML('<html><head><link href="/style.css"></head><body><button id="focus">Open</button><dialog id="modal"></dialog></body></html>');
 const append=window.HTMLElement.prototype.append;window.HTMLElement.prototype.append=function(...nodes){const r=append.apply(this,nodes);for(const n of nodes)if(n.tagName==='LINK')queueMicrotask(()=>n.onload?.());return r;};
 window.HTMLElement.prototype.focus=function(){};window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};window.HTMLElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
 Object.assign(globalThis,{document,window,DOMParser,location:{pathname:'/',search:'',origin:'https://example.test'},matchMedia:()=>({matches:true}),fetch:async path=>new Response(await readFile(join(dist,path)),{headers:{'Content-Type':'application/json'}})});
 const values=new Map(),routes=[];const h={read:(k,f)=>values.get(k)??f,save:(k,v)=>values.set(k,structuredClone(v)),navigate:p=>routes.push(p),show:html=>{document.querySelector('#modal').innerHTML=html;},categories:['Main','New Ranking','Rankings','Today'],data:[]};
 const reference=await import('../dist/assets/reference.js');h.data=reference.extraStories;reference.show('/',h);
 for(const id of ['mortal-path','monte-cristo']){
  const card=document.querySelector('a[href="/story/'+id+'"]');assert.ok(card);assert.ok(!card.querySelector('img[alt="ORIGINAL"]'));
  for(const img of card.querySelectorAll('img'))assert.equal(img.getAttribute('src'),'/assets/'+id+'-cover.svg');
 }
 const hero=document.querySelector('[data-hero-desktop]');
 const ranking=[...document.querySelectorAll('button')].find(b=>b.textContent==='Rankings');ranking.click();assert.equal(document.querySelector('[data-hero-desktop]'),hero);assert.equal(routes.length,0);assert.ok(document.querySelector('[data-category-panel] [data-category-grid] a'));assert.ok(!document.querySelector('[data-category-panel]').closest('.sticky'));
 const main=[...document.querySelectorAll('button')].find(b=>b.textContent==='Main');main.click();assert.equal(document.querySelector('[data-category-panel]').hidden,true);assert.equal(document.querySelector('[data-hero-desktop]'),hero);
 reference.openSearch(h,'#fantasy');assert.ok(document.querySelectorAll('[data-search-results] a').length>0);document.querySelector('[data-preview-close]').click();
 reference.openSearch(h,'三国');assert.equal(document.querySelector('[data-hero-desktop]'),hero);assert.match(document.querySelector('[data-search-results]').textContent,/三国/);assert.equal(document.querySelector('dialog[open]').getAttribute('aria-label'),'Search');document.querySelector('[data-preview-close]').click();
 for(const story of [h.data.find(d=>d.id==='three-kingdoms'),h.data.find(d=>d.type==='character'),h.data.find(d=>d.id==='sgc-007'),h.data.find(d=>d.id==='story-005')]){
  assert.equal(reference.preview('/'+(story.type==='character'?'character':'story')+'/'+story.id,h),true);const dialog=document.querySelector('#title-preview');assert.match(dialog.textContent,new RegExp(story.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.ok(dialog.querySelector('[data-preview-play]'));if(story.id==='sgc-007'){assert.equal(dialog.querySelector('[data-preview-close]').getAttribute('aria-label'),'Close Character Information');assert.ok(dialog.querySelector('a[href^="/search?q="]'));dialog.querySelector('[data-preview-bookmark]').click();assert.ok(values.get('ooc-favorites').includes(story.id));}dialog.querySelector('[data-preview-close]').click();
 }
 // captured OOC titles are no longer listed or previewable; comments work on our own titles
 assert.equal(reference.preview('/story/69f414d90abbab6f6a2c8131',h),false);
 reference.preview('/story/story-005',h);let dialog=document.querySelector('#title-preview');dialog.querySelector('[data-comment-reply]')?.click();const form=dialog.querySelector('[data-comment-form]');if(form){dialog.querySelector('[name=comment]').value='A useful reply';form.onsubmit({preventDefault(){}});assert.equal(values.get('ooc-comments-story-005')[0].text,'A useful reply');}dialog.querySelector('[data-preview-close]').click();
 const community=await import('../dist/assets/community.js');const path=new DOMParser().parseFromString((await import('../dist/assets/social.js')).creatorLink('StoryDate Studio'),'text/html').querySelector('a').getAttribute('href');community.show(path,h);document.querySelector('[data-creator-follow]').click();assert.equal(document.querySelector('[data-creator-follow]').textContent,'Following');assert.equal(document.querySelector('[data-creator-follow]').getAttribute('aria-label'),'Unfollow StoryDate Studio');community.show(path,h);assert.equal(document.querySelector('[data-creator-follow]').getAttribute('aria-pressed'),'true');document.querySelector('[data-creator-kind=character]').click();document.querySelector('[data-creator-tab=Feed]').click();assert.equal(document.querySelector('.creator-work-controls').hidden,true);
});
