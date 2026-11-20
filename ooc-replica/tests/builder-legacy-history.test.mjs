import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {parseHTML,DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const dist=fileURLToPath(new URL('../dist/',import.meta.url));
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function scenario(mode){
 const {document,window}=parseHTML(await readFile(join(dist,'index.html'),'utf8'));
 const location={origin:'https://replica.example'};
 const setLocation=path=>{const url=new URL(path,location.href||location.origin);Object.assign(location,{href:url.href,pathname:url.pathname,search:url.search,hash:url.hash});};
 setLocation('/my-title');
 const stack=[{url:location.href,state:{legacy:true}}];let index=0;const traversals=[];
 const history=window.history={
  get state(){return stack[index].state;},get length(){return stack.length;},
  replaceState(state,_title,url){if(url!=null)setLocation(url);stack[index]={url:location.href,state:structuredClone(state)};},
  pushState(state,_title,url){if(url!=null)setLocation(url);stack.splice(index+1);stack.push({url:location.href,state:structuredClone(state)});index++;},
  go(delta){const next=index+delta;if(next<0||next>=stack.length||next===index)return;traversals.push(delta);index=next;setLocation(stack[index].url);const event=new window.Event('popstate');event.state=structuredClone(stack[index].state);window.dispatchEvent(event);},
  back(){this.go(-1);},forward(){this.go(1);},
 };
 // These entries predate the application's history index. The forward target
 // remains available when the editor is mounted, as in an upgraded browser tab.
 history.pushState({from:'/my-title',characterReturn:'/characters/xc-zhiyao'},'', '/builder/story/new');
 history.pushState({legacyForward:true,scroll:[7,9]},'', '/profile');history.back();traversals.length=0;
 if(mode==='failed-native')Object.defineProperty(window,'navigation',{value:{get currentEntry(){return {index};}},configurable:true});
 const append=window.HTMLElement.prototype.append;
 window.HTMLElement.prototype.append=function(...nodes){const result=append.apply(this,nodes);for(const node of nodes)if(node.tagName==='LINK')queueMicrotask(()=>node.onload?.());return result;};
 window.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};
 Object.defineProperty(window.HTMLElement.prototype,'open',{configurable:true,get(){return this.hasAttribute('open');}});
 window.HTMLElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
 window.HTMLElement.prototype.scrollIntoView=()=>{};window.scrollTo=()=>{};window.requestAnimationFrame=callback=>setTimeout(callback,0);
 const values=new Map([['sd.lang','zh']]);let failWrites=mode!=='success';const requests=[];
 const storage={getItem:key=>values.get(key)??null,setItem(key,value){if(failWrites&&key.includes('ooc-custom'))throw Error('fixture quota');values.set(key,value);},removeItem:key=>values.delete(key)};
 Object.assign(globalThis,{document,window,DOMParser,location,history,localStorage:storage,sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},CustomEvent:window.CustomEvent,Event:window.Event,addEventListener:window.addEventListener.bind(window),removeEventListener:window.removeEventListener.bind(window),dispatchEvent:window.dispatchEvent.bind(window),matchMedia:()=>({matches:true}),fetch:async(path,options)=>{requests.push([String(path),options?.method||'GET']);if(path==='/api/config')return Response.json({auth:null,configured:false,billing:{enabled:false}});if(String(path).startsWith('/api/'))throw Error('Unexpected operation');return new Response(await readFile(join(dist,path)));}});
 await import('../dist/app.js');
 for(let n=0;n<40&&(document.body.hasAttribute('data-booting')||document.querySelector('[data-action=login]')?.disabled);n++)await tick();
 const input=document.querySelector('.builder-fields [name=title]');input.value='Legacy navigation draft';input.dispatchEvent(new window.Event('input',{bubbles:true}));
 const form=document.querySelector('.builder-fields'),sourceState=structuredClone(history.state),length=history.length;
 history.forward();await tick();
 assert.equal(history.length,length);
 if(mode==='success'){
  assert.equal(index,2);assert.equal(location.pathname,'/profile');assert.equal(history.state.legacyForward,true);assert.deepEqual(history.state.scroll,[7,9]);assert.match(document.querySelector('#toast').textContent,/草稿已保留/);
 }else{
  assert.equal(document.querySelector('.builder-fields'),form);assert.equal(document.querySelector('.builder-fields [name=title]'),input);assert.equal(input.value,'Legacy navigation draft');assert.equal(location.pathname,'/builder/story/new');assert.match(document.querySelector('#toast').textContent,/草稿未保存/);assert.doesNotMatch(document.querySelector('#toast').textContent,/已保留/);assert.equal(values.has('ooc-custom'),false);
  assert.equal(history.state.characterReturn,sourceState.characterReturn);
  if(mode==='failed-native'){
   assert.equal(index,1);assert.deepEqual(traversals,[1,-1]);assert.equal(stack[2].state.legacyForward,true);
  }else{
   assert.equal(index,2);assert.deepEqual(traversals,[1]);
   // Without native indices a reached legacy entry is replaced with the editor.
   // Another failed departure keeps the same form rather than guessing a delta.
   history.back();await tick();assert.equal(index,1);assert.equal(document.querySelector('.builder-fields'),form);assert.deepEqual(traversals,[1,-1]);
  }
  failWrites=false;history.forward();await tick();
  assert.equal(index,2);assert.equal(history.length,length);assert.match(document.querySelector('#toast').textContent,/草稿已保留/);
  if(mode==='failed-native')assert.equal(location.pathname,'/profile');
 }
 const saved=JSON.parse(values.get('ooc-custom'));assert.equal(saved[0].title,'Legacy navigation draft');assert.equal(saved[0].status,'draft');assert.equal(saved[0].publishedId,undefined);
 assert.equal(requests.some(([,method])=>method==='POST'),false);
}

if(isMainThread){
 for(const mode of ['success','failed-native','failed-no-native'])test('legacy history preserves private creation: '+mode,async()=>{
  const result=await new Promise((resolve,reject)=>{const worker=new Worker(new URL(import.meta.url),{workerData:mode});worker.once('message',resolve);worker.once('error',reject);worker.once('exit',code=>{if(code)reject(Error('worker exited '+code));});});
  assert.equal(result.error,undefined,result.error);
 });
}else{
 try{await scenario(workerData);parentPort.postMessage({ok:true});}catch(error){parentPort.postMessage({error:error.stack});}
}
