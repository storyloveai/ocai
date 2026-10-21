import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {paintBrand} from '../dist/assets/brand.js';
import {paintSidebar} from '../dist/assets/site-shell.js';
import {returnFromAnnouncement} from '../dist/assets/back-navigation.js';
import {updateShelf} from '../dist/assets/hero-shelf.js';
const file=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('all ORIGINAL badge images use our book mark, including repeated hydration',()=>{
 const {document}=parseHTML('<div><img alt="ORIGINAL" data-asset="old-star" src="old.webp"><img alt="OOC" width="120"></div>');paintBrand(document);paintBrand(document);
 assert.equal(document.querySelector('[alt=ORIGINAL]').getAttribute('src'),'/assets/original-badge.svg');assert.equal(document.querySelector('[alt=ORIGINAL]').hasAttribute('data-asset'),false);assert.equal(document.querySelector('[alt=StoryDate]').getAttribute('src'),'/assets/storydate-logo-dark.svg');
});
test('notification sidebar copies the Credits typography rather than inheriting body size',async()=>{
 const {document}=parseHTML(JSON.parse(await file('dist/assets/reference-pages.json')).pages.home);globalThis.location={pathname:'/'};
 const h={read:(k,f)=>f,data:[],navigate(){},show(){}};paintSidebar(document,{user:{uid:'test'},providers:{}},h);
 const notification=document.querySelector('[data-shell-notifications] span'),credit=document.querySelector('[data-shrink] a[href="/credit"] span');assert.ok(notification);assert.equal(notification.className,credit.className);assert.ok(notification.className.includes('typo-text-sm_'));
});
test('announcement back returns to its owned source entry and direct visits have safe fallbacks',()=>{
 let back=0;const destinations=[],h={navigate:path=>destinations.push(path)};
 returnFromAnnouncement('/announcement/id',h,{length:4,state:{storydateNavigation:true,from:'/character?genre=Fantasy'},back(){back++;}});assert.equal(back,1);assert.deepEqual(destinations,[]);
 returnFromAnnouncement('/announcement/id',h,{length:4,state:null});returnFromAnnouncement('/announcement',h,{length:1,state:null});returnFromAnnouncement('/announcement/id',h,{length:4,state:{storydateNavigation:true,from:'//elsewhere.example'}});returnFromAnnouncement('/announcement',h,{length:4,state:{storydateNavigation:true,from:'/announcement/direct-entry'}});assert.deepEqual(destinations,['/announcement','/','/announcement','/']);
});
test('shelf keeps cover nodes while crossing slides and wrapping; a drag triggers exactly one move',()=>{
 const {document,window}=parseHTML('<section><div data-hero-desktop><div><div><img src="old.webp"></div></div></div></section>');globalThis.document=document;
 const hero=document.querySelector('[data-hero-desktop]'),features=Array.from({length:6},(_,i)=>({title:'Book '+i,href:'/story/'+i,image:'/cover-'+i+'.webp'})),steps=[];
 const shelf=updateShelf(hero,features,0,f=>f.image,n=>steps.push(n)),cards=[...shelf.cards];assert.equal(cards.filter(c=>c.getAttribute('tabindex')==='0').length,1);
 for(const index of [1,2,5,0]){updateShelf(hero,features,index,f=>f.image,n=>steps.push(n));assert.equal(hero.querySelector('[aria-current=true]').getAttribute('href'),'/story/'+index);assert.equal(hero.querySelectorAll('.storydate-shelf-card').length,6);assert.ok(cards.every(c=>c.isConnected));}
 function pointer(type,x,y){const e=new window.Event(type,{cancelable:true});Object.assign(e,{button:0,clientX:x,clientY:y,pointerId:1});shelf.stage.dispatchEvent(e);}
 pointer('pointerdown',100,20);pointer('pointermove',45,21);pointer('pointerup',45,21);assert.deepEqual(steps,[1]);
 const click=new window.Event('click',{cancelable:true});shelf.stage.dispatchEvent(click);assert.equal(click.defaultPrevented,true);
 pointer('pointerdown',100,20);pointer('pointermove',102,100);pointer('pointerup',102,100);assert.deepEqual(steps,[1]);
});
test('80 original drafts have unique identities, complete cover jobs and remain unpublished',async()=>{
 const pack=JSON.parse(await file('content/original-catalog/catalog-drafts.json')),jobs=(await file('content/original-catalog/cover-jobs.jsonl')).trim().split('\n').map(JSON.parse);
 assert.equal(pack.items.length,80);assert.equal(pack.items.filter(x=>x.type==='story').length,40);assert.equal(pack.items.filter(x=>x.type==='character').length,40);assert.ok(pack.coveragePlan.plannedReplacementPercent>=50);assert.equal(new Set(pack.items.map(x=>x.id)).size,80);assert.equal(new Set(pack.items.map(x=>x.title)).size,80);assert.equal(new Set(jobs.map(x=>x.prompt)).size,80);
 for(const r of pack.items){assert.ok(r.description.length>65);assert.ok(r.opening.length>10);assert.ok(r.cover.prompt.length>250);assert.equal(r.cover.status,'pending');assert.equal(r.cover.assetUrl,null);assert.equal(r.publicationStatus,'draft_pending_cover_review');assert.equal(r.rulesEngineReady,false);if(r.type==='character')assert.ok(r.character.age>=21);assert.equal(jobs.find(j=>j.id===r.id).output_filename,r.cover.filename);}
 assert.equal(pack.status,'prepared_not_published');
});
