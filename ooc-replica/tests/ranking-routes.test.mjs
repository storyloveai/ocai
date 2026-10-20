import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML,DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const dist=fileURLToPath(new URL('../dist/',import.meta.url));
test('home ranking destinations populate story and character collections and keep sorting usable',async()=>{
 const {document,window}=parseHTML('<html><head><link href="/style.css"></head><body><main id="main"></main><dialog id="modal"></dialog></body></html>');
 const append=window.HTMLElement.prototype.append;
 window.HTMLElement.prototype.append=function(...nodes){const result=append.apply(this,nodes);for(const node of nodes)if(node.tagName==='LINK')queueMicrotask(()=>node.onload?.());return result;};
 Object.assign(globalThis,{document,window,DOMParser,location:{pathname:'/collection',search:'',href:'https://replica.example/collection'},matchMedia:()=>({matches:true}),fetch:async path=>new Response(await readFile(join(dist,path)),{headers:{'Content-Type':'application/json'}})});
 const reference=await import('../dist/assets/reference.js');
 const helpers={read:(_key,fallback)=>fallback,save(){},navigate(){},show(){},data:reference.extraStories,categories:['Main','New Ranking','Rankings','Today']};
 for(const type of ['story','character'])for(const name of ['New Ranking','Rankings','Today']){
  location.search='?name='+encodeURIComponent(name)+(type==='character'?'&type=character':'');
  assert.equal(reference.show('/collection',helpers),true);
  const count=Number(document.querySelector('.collection-count').textContent.split(' ')[0]);
  const links=[...document.querySelectorAll('[data-collection-grid] a')];
  assert.ok(count>0,`${type} ${name} must not be an empty genre filter`);
  assert.equal(links.length,count);
  assert.ok(links.every(link=>link.getAttribute('href').startsWith('/'+type+'/')));
  const select=document.querySelector('[aria-label="Sort collection"]');
  select.querySelector('[value=featured]').removeAttribute('selected');select.querySelector('[value=title]').setAttribute('selected','');select.onchange();
  assert.equal(document.querySelectorAll('[data-collection-grid] a').length,count,'changing order preserves every title');
 }
});
