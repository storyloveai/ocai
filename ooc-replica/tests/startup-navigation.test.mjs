import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML,DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const dist=fileURLToPath(new URL('../dist/',import.meta.url));

test('catalog and credit navigation work while auth is unreachable and do not load chat',async()=>{
 const {document,window}=parseHTML(await readFile(join(dist,'index.html'),'utf8'));
 const values=new Map([['ooc-preference','"All"']]),requests=[];
 const append=window.HTMLElement.prototype.append;
 window.HTMLElement.prototype.append=function(...nodes){const result=append.apply(this,nodes);for(const node of nodes)if(node.tagName==='LINK')queueMicrotask(()=>node.onload?.());return result;};
 const location={href:'https://replica.example/',pathname:'/',search:''};
 window.history={pushState(_state,_title,path){const url=new URL(path,location.href);Object.assign(location,{href:url.href,pathname:url.pathname,search:url.search});},replaceState(){}};
 window.scrollTo=()=>{};
 Object.assign(globalThis,{window,document,DOMParser,location,history:window.history,matchMedia:()=>({matches:true}),localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},sessionStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},fetch:async path=>{
  requests.push(path);if(path==='/api/config')return new Promise(()=>{});
  return new Response(await readFile(join(dist,path)),{headers:{'Content-Type':'application/json'}});
 }});
 await import('../dist/app.js');
 assert.ok(document.querySelector('#precision-view a[href^="/story/"]'));
 assert.equal(document.querySelector('[data-hero-desktop] h1').textContent,'三国演义 · 谋士');
 assert.equal(document.querySelector('section a [data-name]')?.textContent,'三国演义 · 谋士');
 assert.equal(document.querySelector('section a [data-name]').closest('[aria-roledescription="slide"]').querySelectorAll('a[data-unused],a [data-name]').length,1);
 for(const img of document.querySelector('section a [data-name]').closest('a').querySelectorAll('img'))if(img.alt!=='ORIGINAL')assert.equal(img.getAttribute('src'),'/assets/sanguo-art/cover.webp');
 assert.equal(document.body.hasAttribute('data-booting'),false);
 assert.equal(document.querySelector('#precision-view').inert,false);
 assert.ok(!requests.some(path=>/interaction-pages|scenarios/.test(path)));
 assert.equal(requests.filter(path=>path==='/api/config').length,1);
 const link=document.querySelector('a[href="/credit"]');link.href='/credit?creditTab=free';
 const click=new window.Event('click',{bubbles:true,cancelable:true});click.button=0;link.dispatchEvent(click);
 assert.equal(location.pathname,'/credit');assert.equal(document.querySelector('#credits-tab-free').getAttribute('aria-selected'),'true');
 assert.equal(document.querySelector('#precision-view').inert,false);
});
