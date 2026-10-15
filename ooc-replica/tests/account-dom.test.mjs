import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML,DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const dist=fileURLToPath(new URL('../dist/',import.meta.url));
test('real app renders captured home with unavailable Firebase, keeps browsing, and does not fake OAuth',async()=>{
 const html=await readFile(join(dist,'index.html'),'utf8');const {document,window}=parseHTML(html);const memory=new Map([['ooc-preference','"All"']]);
 const append=window.HTMLElement.prototype.append;
 window.HTMLElement.prototype.append=function(...nodes){const r=append.apply(this,nodes);for(const node of nodes)if(node.tagName==='LINK')queueMicrotask(()=>node.onload?.());return r;};
 Object.assign(globalThis,{document,window,DOMParser,localStorage:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)},location:{pathname:'/',search:'',href:'http://localhost/'},matchMedia:()=>({matches:true}),fetch:async path=>{if(path==='/api/config')return Response.json({auth:null,configured:false});return new Response(await readFile(join(dist,path)),{headers:{'Content-Type':'application/json'}});}});
 document.getElementById('modal').showModal=function(){this.open=true;};document.getElementById('modal').close=function(){this.open=false;};
 try{
  await import('../dist/app.js');await new Promise(r=>setTimeout(r,50));
  assert.match(document.querySelector('#account-status').textContent,/Firebase/);
  assert.equal(document.querySelector('#precision-view').inert,false);
  assert.ok(document.querySelector('a[href^="/story/"]'));
  assert.ok(document.querySelector('link[href="/assets/account.css"]'));
  assert.equal(document.querySelector('[data-action=login][data-provider=apple]').hidden,true);
  const google=[...document.querySelectorAll('[data-action=login][data-provider=google]')].find(b=>!b.hidden);
  google.click();assert.equal(location.pathname,'/');assert.match(document.querySelector('#toast').textContent,/Firebase/);
 }finally{clearInterval(window.carousel);}
});
