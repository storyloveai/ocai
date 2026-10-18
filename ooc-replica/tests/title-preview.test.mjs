import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {openTitlePreview,closeTitlePreview} from '../dist/assets/title-preview.js';
const records=JSON.parse(await readFile(new URL('../dist/assets/title-previews.json',import.meta.url),'utf8')).titles;
const apex='6aaad8746c080a5d3ff0402a';
function setup(){const {window,document}=parseHTML('<html><body><button id="trigger">Open story</button></body></html>');globalThis.document=document;let focused=document.querySelector('#trigger');Object.defineProperty(document,'activeElement',{get:()=>focused});window.HTMLElement.prototype.focus=function(){focused=this;};window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};window.HTMLElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};return {window,document};}
test('five observed title dialogs exclude session identifiers and executable markup',()=>{assert.equal(Object.keys(records).length,5);for(const [id,record]of Object.entries(records)){const {document}=parseHTML(record.html);assert.equal(document.querySelector('h1').textContent,record.title);assert.equal(document.querySelector('[data-preview-play]').dataset.previewPlay,id);assert.ok(!document.querySelector('script,iframe,[onclick],[id]'));assert.doesNotMatch(record.html,/\/episode\/|nezukoNPPYyT|FIREBASE_PRIVATE_KEY/);}});
test('quick view preserves page state, uses current avatar, saves bookmarks and opens the selected story',()=>{const {document}=setup();const values=new Map([['ooc-profile',{name:'Test player'}]]),routes=[];document.documentElement.style.overflow='auto';const dialog=openTitlePreview(records[apex],apex,{navigate:r=>routes.push(r),read:(k,f)=>values.get(k)??f,save:(k,v)=>values.set(k,v)});assert.ok(dialog.hasAttribute('open'));assert.equal(document.documentElement.style.overflow,'hidden');assert.equal(dialog.querySelector('[data-preview-avatar] span').textContent,'Test player');const bookmark=dialog.querySelector('[data-preview-bookmark]');bookmark.click();assert.deepEqual(values.get('ooc-favorites'),[apex]);assert.equal(bookmark.getAttribute('aria-pressed'),'true');bookmark.click();assert.deepEqual(values.get('ooc-favorites'),[]);dialog.querySelector('[data-preview-play]').click();assert.deepEqual(routes,['/play/'+apex]);assert.equal(document.documentElement.style.overflow,'auto');assert.equal(document.activeElement.id,'trigger');assert.equal(document.querySelector('#title-preview'),null);});
test('Escape dismisses an open selection before the dialog, closing clears menu and scroll lock',()=>{const {window,document}=setup();const dialog=openTitlePreview(records[apex],apex,{navigate:()=>{},read:(_k,f)=>f,save:()=>{}});dialog.getBoundingClientRect=()=>({left:0,top:0});Object.defineProperty(dialog,'clientWidth',{value:768});Object.defineProperty(dialog,'clientHeight',{value:750});const select=dialog.querySelector('[data-preview-scenario]');select.getBoundingClientRect=()=>({left:24,bottom:200,width:500});select.click();assert.equal(select.getAttribute('aria-expanded'),'true');assert.equal(dialog.querySelector('[role=option]').textContent.replace('✓','').trim(),'Prologue | Hero Academy');const event=new window.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(event,'key',{value:'Escape'});dialog.dispatchEvent(event);assert.equal(dialog.querySelector('[role=listbox]'),null);assert.ok(dialog.hasAttribute('open'));assert.equal(document.activeElement,select);closeTitlePreview();assert.equal(document.querySelector('#title-preview'),null);assert.equal(document.documentElement.style.overflow,'');});

test('queued native close events cannot unlock a replacement dialog or steal route focus',()=>{
 const {window,document}=setup(),events=[];
 window.HTMLElement.prototype.close=function(){this.removeAttribute('open');events.push(()=>this.dispatchEvent(new window.Event('close')));};
 const helpers={navigate:()=>{},read:(_key,fallback)=>fallback,save:()=>{}};
 document.documentElement.style.overflow='auto';
 const first=openTitlePreview(records[apex],apex,helpers);
 const second=openTitlePreview(records[apex],apex,helpers);
 assert.equal(first.isConnected,false);assert.equal(document.querySelectorAll('#title-preview').length,1);
 events.shift()();
 assert.equal(document.documentElement.style.overflow,'hidden');assert.equal(document.activeElement,second.querySelector('[data-preview-close]'));
 closeTitlePreview();
 assert.equal(document.documentElement.style.overflow,'auto');
 const routeButton=document.createElement('button');document.body.append(routeButton);routeButton.focus();
 events.shift()();assert.equal(document.activeElement,routeButton);
});
test('native dialog cancellation restores scroll and focus immediately',()=>{
 const {window,document}=setup();
 window.HTMLElement.prototype.close=function(){this.removeAttribute('open');};
 const dialog=openTitlePreview(records[apex],apex,{navigate:()=>{},read:(_key,fallback)=>fallback,save:()=>{}});
 const cancel=new window.Event('cancel',{cancelable:true});dialog.dispatchEvent(cancel);
 assert.equal(cancel.defaultPrevented,true);assert.equal(dialog.isConnected,false);assert.equal(document.documentElement.style.overflow,'');assert.equal(document.activeElement.id,'trigger');
});
