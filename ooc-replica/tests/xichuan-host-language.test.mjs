import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {mountXichuan,stopXichuan} from '../dist/assets/xichuan-player.js';
import {attachGameCredits} from '../dist/assets/game-credit-bridge.js';
import {currentLang,setLang} from '../dist/assets/site-i18n.js';
import {XICHUAN_KEY,LATEST} from '../dist/assets/xichuan-state.js';

const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function until(condition){for(let i=0;i<100;i++){if(condition())return;await tick();}throw Error('Expected asynchronous state did not arrive');}
const played={G:{ch:1,phase:'node',cur:'c1_club',v:{'flag.joined_club':true},offer:[],done:[]},V:{queue:[],i:0,log:[],sprites:{}},at:10};
const billing={enabled:true,prices:{gameUnderstand:1,gameExpress:3}};

function host({progress=true,legacy=false}={}){
 const {window,document}=parseHTML('<html lang="zh"><head></head><body><main id="host"></main><aside id="unrelated"><div class="sd-language-slot">Other view language</div></aside></body></html>');
 const storageValues=new Map([['sd.lang','zh'],...(legacy?[['xc.auto',JSON.stringify(played)]]:[])]),storage={getItem:key=>storageValues.get(key)??null,setItem:(key,value)=>storageValues.set(key,value)};
 const initial={[LATEST]:structuredClone(played),auto:structuredClone(played),lang:'zh'};
 const draftKey='ooc-composer-draft-xc-zhiyao-main',draft={version:1,branch:'main',text:'还没发出的原话。'};
 const values=new Map([[draftKey,structuredClone(draft)],...(progress?[[XICHUAN_KEY,initial]]:[])]),writes=[],requests=[],messages=[],observers=[];
 const resizeListeners=new Set(),languageListeners=new Set(),viewportListeners=new Set();
 const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window);
 window.addEventListener=(type,callback,...args)=>{if(type==='resize')resizeListeners.add(callback);if(type==='sd-lang')languageListeners.add(callback);return add(type,callback,...args);};
 window.removeEventListener=(type,callback,...args)=>{if(type==='resize')resizeListeners.delete(callback);if(type==='sd-lang')languageListeners.delete(callback);return remove(type,callback,...args);};
 window.visualViewport={height:800,addEventListener:(type,callback)=>{if(type==='resize')viewportListeners.add(callback);},removeEventListener:(type,callback)=>{if(type==='resize')viewportListeners.delete(callback);}};
 let resolveConfig;
 Object.assign(globalThis,{window,document,localStorage:storage,location:{origin:'https://test.example',href:'https://test.example/play/xichuan',pathname:'/play/xichuan'},history:{state:{characterReturn:'/characters/xc-shencheng'}},CustomEvent:window.CustomEvent,Event:window.Event,
  addEventListener:window.addEventListener,removeEventListener:window.removeEventListener,dispatchEvent:window.dispatchEvent.bind(window),
  ResizeObserver:class{targets=[];disconnected=false;constructor(callback){this.callback=callback;observers.push(this);}observe(node){this.targets.push(node);}disconnect(){this.disconnected=true;}},
  fetch:async path=>{requests.push(path);return new Promise(resolve=>resolveConfig=()=>resolve(Response.json({billing})));},
 });
 window.localStorage=storage;setLang('zh');
 const root=document.getElementById('host');
 const account={user:{uid:'alice'},busy:false,restored:true,syncError:'',api:async()=>{throw Error('A language change must not call an account API');}};
 let failSave=false;
 const helpers={read:(key,fallback)=>values.get(key)??fallback,save:(key,value)=>{if(failSave)throw Error('Storage unavailable');writes.push([key,structuredClone(value)]);values.set(key,structuredClone(value));}};
 const reference={mountShell(html,_helpers,page){root.dataset.page=page;root.innerHTML='<aside data-shrink><button>Menu</button><div><div></div><div>Account</div></div></aside>'+html;return root;}};
 mountXichuan({reference,account,helpers,storage});
 const frame=root.querySelector('iframe'),bar=root.querySelector('[data-game-credits]'),peer={postMessage:(...args)=>messages.push(args),fetch:async()=>{throw Error('Unexpected game request');}};
 Object.defineProperty(frame,'contentWindow',{value:peer});
 let measurements=0;
 frame.getBoundingClientRect=()=>{measurements++;return {top:100+(bar.hidden?0:bar.textContent.includes('Enable optional')?96:64)};};
 const send=(data,extra={})=>{const event=new window.Event('message');Object.assign(event,{data,source:peer,origin:location.origin,...extra});window.dispatchEvent(event);};
 return {window,document,root,frame,bar,peer,send,values,writes,requests,messages,observers,resizeListeners,languageListeners,viewportListeners,initial,draftKey,draft,storageValues,
  ready:async()=>{await until(()=>resolveConfig);resolveConfig();await tick();},measurements:()=>measurements,failSave:value=>failSave=value};
}

test('native game language saves update only the mounted host and retain its frame, story, draft and opt-in controls',async()=>{
 const f=host();
 try{
  assert.equal(f.languageListeners.size,1);assert.equal(f.resizeListeners.size,1);assert.equal(f.viewportListeners.size,1);
  assert.ok(f.observers[0].targets.includes(f.bar),'the already-mounted optional AI bar participates in layout observation');
  assert.equal(f.bar.hidden,true);
  f.send({type:'xc-save',key:'lang',value:'en'});assert.equal(currentLang(),'zh','uninitialized peers cannot change the site language');
  f.send({type:'xc-ready'});assert.equal(f.messages.length,1);
  const initialized=f.messages[0][0].snapshot;assert.deepEqual(initialized.latest,played);assert.equal(initialized.lang,'zh');
  const source=f.frame.getAttribute('src'),header=f.root.querySelector('.xc-header'),back=f.root.querySelector('[data-xichuan-return]'),status=f.root.querySelector('.xc-status'),check=f.bar.querySelector('input');
  f.send({type:'xc-save',key:'lang',value:'en'},{origin:'https://outside.example'});
  f.send({type:'xc-save',key:'lang',value:'en'},{source:{}});
  f.send({type:'xc-save',key:'lang',value:'fr'});assert.equal(currentLang(),'zh');
  f.send({type:'xc-save',key:'lang',value:'en'});
  assert.equal(currentLang(),'en');assert.equal(f.document.documentElement.lang,'en');
  assert.equal(header.querySelector('h1').textContent,'The Seventh Spring of Xichuan');
  assert.match(back.textContent,/Back to character/);assert.match(status.textContent,/Account progress.*Chapter 1/);
  assert.equal(back.getAttribute('href'),'/characters/xc-shencheng');assert.equal(f.frame.getAttribute('title'),'Xichuan visual novel');
  assert.equal(f.storageValues.get('sd.lang'),'en');
  await f.ready();assert.equal(f.bar.hidden,false);assert.match(f.bar.textContent,/Enable optional AI/,'a late config response paints the current language');
  f.observers[0].callback();assert.equal(f.frame.style.getPropertyValue('--xc-frame-height'),'604px','becoming visible and wrapping reduces the available frame height');
  check.checked=true;check.onchange();
  f.send({type:'xc-save',key:'lang',value:'zh'});
  assert.equal(f.root.querySelector('iframe'),f.frame);assert.equal(f.frame.getAttribute('src'),source);assert.equal(f.root.querySelector('.xc-header'),header);
  assert.equal(f.bar.querySelector('input'),check);assert.equal(check.checked,true);
  assert.match(f.bar.textContent,/开启可选 AI/);assert.match(status.textContent,/账号进度.*第 1 章/);
  assert.equal(f.frame.getAttribute('title'),'汐川互动故事');assert.equal(f.frame.style.getPropertyValue('--xc-frame-height'),'636px');
  assert.deepEqual(f.values.get(XICHUAN_KEY),f.initial,'switching back changes only the existing lang field, never the saved story');
  assert.deepEqual(f.values.get(f.draftKey),f.draft);assert.equal(f.messages.length,1,'language changes neither reload nor send a new iframe protocol message');
  assert.ok(f.writes.every(([key])=>[XICHUAN_KEY,'ooc-history'].includes(key)));
  assert.deepEqual(f.requests,['/api/config']);
  const style=f.root.querySelector('style').textContent;
  assert.match(style,/\[data-page="xichuan"\] \.sd-language-slot\{display:none!important\}/);
  assert.ok(f.root.querySelector('[data-shrink] .sd-language-slot'),'the parent toggle is retained for other routes but hidden by the mounted page scope');
  assert.equal(f.root.querySelector('.xc-header [data-sd-lang]'),null,'no second language entry is added beside the native game');
  assert.ok(f.document.querySelector('#unrelated .sd-language-slot'),'the hiding rule does not target unrelated page slots');
  f.failSave(true);f.send({type:'xc-save',key:'lang',value:'en'});assert.match(status.textContent,/Save failed/);
  setLang('zh');assert.match(status.textContent,/保存失败/,'language changes preserve an existing save failure');
  f.failSave(false);
  const oldTitle=header.querySelector('h1').textContent,oldHeight=f.frame.style.getPropertyValue('--xc-frame-height');
  stopXichuan();assert.equal(f.languageListeners.size,0);assert.equal(f.resizeListeners.size,0);assert.equal(f.viewportListeners.size,0);assert.equal(f.observers[0].disconnected,true);
  setLang('en');f.observers[0].callback();f.send({type:'xc-save',key:'lang',value:'en'});
  assert.equal(header.querySelector('h1').textContent,oldTitle);assert.equal(f.frame.style.getPropertyValue('--xc-frame-height'),oldHeight,'late layout callbacks ignore the disposed view');
 }finally{stopXichuan();}
});

test('a language change updates an import offer in place without importing it',async()=>{
 const f=host({progress:false,legacy:true});
 try{
  const note=f.root.querySelector('[data-xichuan-import-note]'),button=f.root.querySelector('[data-import]');assert.ok(button);
  f.send({type:'xc-ready'});f.send({type:'xc-save',key:'lang',value:'en'});
  assert.equal(f.root.querySelector('[data-import]'),button);assert.match(note.textContent,/no Xichuan progress/);assert.match(button.textContent,/Import this device/);
  assert.deepEqual(f.values.get(XICHUAN_KEY),{lang:'en'},'a language save cannot import a device story');
  assert.deepEqual(JSON.parse(f.storageValues.get('xc.auto')),played,'the legacy save remains unchanged');
  await f.ready();
 }finally{stopXichuan();}
});

test('credit UI language changes preserve opt-in and a quoted in-flight request without replaying or aborting it',async()=>{
 const {window,document}=parseHTML('<html><body><iframe></iframe></body></html>'),frame=document.querySelector('iframe');
 let resolveConfig,resolveRequest;
 const originalCalls=[],apiCalls=[];let originalSettled=false;
 const original=async(input,init)=>{originalCalls.push({input,init});if(originalSettled)return Response.json({billing:{status:'settled'}});return new Promise(resolve=>resolveRequest=()=>{originalSettled=true;resolve(Response.json({billing:{status:'settled'}}));});};
 const peer={fetch:original};Object.defineProperty(frame,'contentWindow',{value:peer});
 const user={uid:'alice',getIdToken:async()=>'test-token'},account={user,api:async(path,body)=>{apiCalls.push([path,body]);return {version:'test-version',amount:3,wallet:{balance:20}};}};
 Object.assign(globalThis,{window,document,location:{origin:'https://test.example',href:'https://test.example/play/xichuan'},Event:window.Event,dispatchEvent:window.dispatchEvent.bind(window),sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},fetch:async()=>new Promise(resolve=>resolveConfig=()=>resolve(Response.json({billing,walletMode:'test'})))});
 const bridge=attachGameCredits(frame,account,{lang:'zh'}),bar=document.querySelector('[data-game-credits]'),check=bar.querySelector('input'),label=bar.querySelector('label');
 try{
  bridge.setLanguage('en');await until(()=>resolveConfig);resolveConfig();await tick();bridge.install();
  assert.match(label.textContent,/Enable optional AI/);
  await assert.rejects(()=>peer.fetch('/api/sanguo',{method:'POST',body:JSON.stringify({task:'game.express'})}),error=>error.code==='AI_OPT_IN_REQUIRED');
  bridge.setLanguage('zh');assert.match(bar.textContent,/使用编排内容/);assert.equal(originalCalls.length,0);assert.equal(apiCalls.length,0);
  check.checked=true;check.onchange();
  const controller=new AbortController(),request=peer.fetch('/api/sanguo',{method:'POST',body:JSON.stringify({task:'game.express',text:'hello'}),signal:controller.signal});
  await until(()=>originalCalls.length===1);assert.match(bar.textContent,/正在生成/);
  bridge.setLanguage('en');assert.match(bar.textContent,/Generating/);assert.equal(controller.signal.aborted,false);
  assert.equal(bar.querySelector('input'),check);assert.equal(bar.querySelector('label'),label);assert.equal(check.checked,true);assert.equal(originalCalls.length,1);
  assert.equal(originalCalls[0].init.headers.Authorization,'Bearer test-token');assert.equal(JSON.parse(originalCalls[0].init.body).billing.amount,3);
  resolveRequest();await (await request).json();assert.match(bar.textContent,/Completed; 3 credits/);assert.equal(originalCalls.length,1);
  bridge.setLanguage('zh');assert.match(bar.textContent,/本阶段结算 3 点/);
  await (await peer.fetch('/api/sanguo',{method:'POST',body:JSON.stringify({task:'game.express',text:'next explicit request'})})).json();
  assert.equal(originalCalls.length,2,'only a second explicit request reaches the provider; opt-in remained enabled');assert.equal(apiCalls.length,2);
  const copy=label.textContent;bridge.dispose();bridge.setLanguage('en');assert.equal(label.textContent,copy);
 }finally{bridge.dispose();}
});
