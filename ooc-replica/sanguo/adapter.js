/* Website adapter; upstream campaign/engine remain unchanged. */
let sitePacer=null,siteTurn=null,siteTyping=null,siteNotice='',siteDraft='';
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const clone=x=>JSON.parse(JSON.stringify(x));
const originalSet=store.set.bind(store);
store.set=(key,value)=>{if(!siteTurn?.cancelled)originalSet(key,value);};
initRuntime=async()=>{
 try{sitePacer=(await import('/assets/stream.js')).typeStream;}catch{}
 try{const cfg=await(await fetch('/api/config',{cache:'no-store'})).json();RT.sample=cfg.configured?{}:null;RT.ai=cfg.configured?'ready':'off';}catch{RT.ai='off';}
 RT.db=null;RT.canEdit=false;UI.zh.aiOn='AI 理解话意并生成对白，剧情结果由规则决定。';UI.en.aiOn='AI voices characters; rules decide outcomes.';render();
};
useLocalServer=async()=>{};askRecall=async()=>{};renderSurvey=()=>h('span',{});
function replyValid(value,lang){
 if(typeof value!=='string'||!value.trim())return null;const text=value.trim();
 if(lang==='zh'?(text.length>140||!/[\u4e00-\u9fff]/.test(text)):(text.split(/\s+/).length>80||/[\u4e00-\u9fff]/.test(text)))return null;
 return CC.futureTerms(CAMP,G.ch).some(x=>text.includes(x.zh)||text.toLowerCase().includes(x.en.toLowerCase()))?null:text;
}
const nearBottom=()=>document.documentElement.scrollHeight-(window.scrollY+window.innerHeight)<180;
function siteLive(){
 const follow=nearBottom();
 let live=$('#site-live');if(live)return live;
 live=h('section',{id:'site-live',class:'site-live','aria-label':settings.lang==='zh'?'正在回复':'Reply in progress'},h('small',{},settings.lang==='zh'?'正在理解你的话……':'Reading your words…'),h('p',{}),h('button',{type:'button','data-site-stop':'',onclick:()=>{if(siteTurn){siteTurn.cancelled=true;siteTurn.controller.abort();}}},settings.lang==='zh'?'停止':'Stop'));
 const act=$('#act');if(act)act.after(live);else $('#story').append(live);if(follow)live.scrollIntoView({block:'nearest'});return live;
}
async function siteSample(task,text,n,target,lang){
 const turn=siteTurn,signal=turn?.controller.signal;
 const context={node:n.id,text,target,vars:G.v,used:(G.used||{})[n.id]||[],turns:(G.turns||{})[n.id]||0,recent:talkHistory(n.id,lang).slice(-8),memories:((G.mem||{})[target]||[]).filter(x=>x.node!==n.id).slice(-3),promises:(G.commits||[]).filter(x=>x.char===target&&x.status==='open').slice(-4)};
 const live=siteLive(),line=live.querySelector('p');let final=null;
 try{
  const response=await fetch('/api/sanguo',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/x-ndjson'},body:JSON.stringify({phase:'express',task,lang,context}),signal});
  if(!response.ok){const err=await response.json().catch(()=>({}));throw Object.assign(Error('Model unavailable'),{code:err.code});}
  if(!response.body||!response.headers.get('content-type')?.startsWith('application/x-ndjson'))throw Error('Invalid stream');
  async function* chunks(){
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',last='';
   const event=value=>{if(value.type==='error')throw Object.assign(Error('Interrupted'),{code:value.code});if(value.type==='done')final=value.output;const next=value.output?.reply;if(typeof next==='string'&&next.startsWith(last)&&!signal?.aborted){const delta=next.slice(last.length);last=next;return delta;}return '';};
   try{while(true){const part=await reader.read();if(part.done)break;buffer+=decoder.decode(part.value,{stream:true});let nl;while((nl=buffer.indexOf('\n'))>=0){const raw=buffer.slice(0,nl);buffer=buffer.slice(nl+1);if(raw.trim()){const delta=event(JSON.parse(raw));if(delta)yield delta;}}}buffer+=decoder.decode();if(buffer.trim()){const delta=event(JSON.parse(buffer));if(delta)yield delta;}if(!final)throw Error('Incomplete stream');}
   finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  }
  if(sitePacer&&!reduced())await sitePacer(chunks(),{signal,onState:state=>{if(state==='streaming')live.querySelector('small').textContent=lang==='zh'?'正在回复……':'Replying…';},onText:value=>{const follow=nearBottom();line.textContent=value;if(follow)live.scrollIntoView({block:'end'});}});
  else for await(const chunk of chunks())line.textContent+=chunk;
  if(signal?.aborted)throw new DOMException('Stopped','AbortError');
  if(final?.reply&&!replyValid(final.reply,lang))throw Error('Invalid narrative');
  if(turn)turn.streamedReply=final.reply||'';return final;
 }catch(e){if(!signal?.aborted)siteNotice=lang==='zh'?'本次 AI 回复未完成，已使用规则与预设对白继续。':'AI unavailable this turn; rules and authored dialogue continue.';throw e;}
}
askAnswer=async(text,n,lang)=>{const out=await siteSample('answer',text,n,n.ask.who,lang);return n.ask.answers.some(a=>a.id===out.pick)?out.pick:null;};
askScene=async(text,n,cid,options,lang)=>{const out=await siteSample('scene',text,n,cid,lang),c=CAMP.chars[cid];return {pick:options.some(o=>o.id===out.pick)?out.pick:null,reply:replyValid(out.reply,lang),tone:CC.LABELS.includes(out.tone)?out.tone:null,mood:['neutral','warm','cold','sad','surprised',...(c.romance?['shy']:[])].includes(out.mood)?out.mood:null,commit:out.commit&&['protect','loyalty','other'].includes(out.commit.kind)?{kind:out.commit.kind,text:String(out.commit.text||'').slice(0,40)}:null};};
askModel=async(text,opts,lang)=>{const out=await siteSample('action',text,N(G.cur),castNow(N(G.cur))[0],lang);return {choice:opts.some(o=>o.id===out.pick)?out.pick:null,reply:replyValid(out.reply,lang)};};
const originalRender=render,originalStory=renderStory,originalAct=renderAct,seen=new Set();
function finishTyping(){siteTyping?.abort();siteTyping=null;document.querySelectorAll('[data-site-full]').forEach(el=>{el.textContent=el.dataset.siteFull;delete el.dataset.siteFull;el.classList.remove('site-typing');});document.querySelector('[data-site-finish]')?.remove();}
renderStory=function(){
 finishTyping();
 const key=el=>el.dataset.li+'|'+el.tagName+'|'+el.className.replace(' fresh','');
 const previous=new Map([...document.querySelectorAll('#story [data-li]')].map(el=>[key(el),el]));
 originalStory();
 for(const el of document.querySelectorAll('#story [data-li]')){if(!el.isConnected)continue;const old=previous.get(key(el));if(old&&old.textContent===el.textContent)el.replaceWith(old);}
 const pending=[];
 document.querySelectorAll('#story .fresh .prose,#story .fresh .reply').forEach(el=>{const text=el.textContent,k=(G?.run||'')+'|'+el.closest('[data-li]')?.dataset.li+'|'+settings.lang+'|'+text;if(seen.has(k))return;seen.add(k);if(!text||siteTurn?.streamedReply===text||!sitePacer||reduced())return;el.dataset.siteFull=text;el.textContent='';pending.push([el,text]);});
 if(pending.length){const controller=new AbortController();siteTyping=controller;const stop=h('button',{type:'button',class:'tbtn','data-site-finish':'',onclick:finishTyping},settings.lang==='zh'?'显示全部':'Show all');$('#story').append(stop);
  (async()=>{for(const [el,text]of pending){if(controller.signal.aborted)break;el.classList.add('site-typing');await sitePacer((async function*(){yield text;})(),{signal:controller.signal,onText:value=>{el.textContent=value;},onState:()=>{}});el.classList.remove('site-typing');}if(siteTyping===controller){siteTyping=null;stop.remove();}})();
 }
};
renderAct=function(){const input=$('#act input');if(input&&!V.busy&&input.value)siteDraft=input.value;originalAct();const next=$('#act input');if(next&&!V.busy)next.value=siteDraft;if(siteNotice&&$('#act'))$('#act').append(h('div',{class:'site-notice',role:'status'},siteNotice));};
render=function(scrollNew){if(siteTurn?.cancelled)return;originalRender(false);if(scrollNew&&V.firstNew>=0){const first=document.querySelector(`[data-li="${V.firstNew}"]`);if(first&&first.getBoundingClientRect().top>window.innerHeight-80)first.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});}};
function wrapTurn(fn){return async text=>{
 if(siteTurn||V.busy||!text.trim())return;finishTyping();siteDraft='';siteNotice='';const saved=clone(G),gallery=clone(COL),turn={controller:new AbortController(),cancelled:false};siteTurn=turn;
 const timer=setTimeout(()=>turn.controller.abort(),28000);
 try{await fn(text);}finally{clearTimeout(timer);if(turn.cancelled){G=saved;Object.keys(COL).forEach(k=>delete COL[k]);Object.assign(COL,gallery);siteDraft=text;siteNotice=settings.lang==='zh'?'已停止；本次输入没有改变剧情进度。':'Stopped. Your progress is unchanged.';}siteTurn=null;V.busy=false;$('#site-live')?.remove();if(turn.cancelled)render();}
};}
onFree=wrapTurn(onFree);onAnswer=wrapTurn(onAnswer);
document.addEventListener('input',event=>{if(event.target.matches('#act input'))siteDraft=event.target.value;});
document.addEventListener('click',event=>{if(siteTurn&&event.target.closest('.choice,.topic,.btn,.offer button,.seg button')){event.preventDefault();event.stopImmediatePropagation();}},true);
const explicitActions={choose,pickSide,sayTopic,newGame};
function clearDraft(fn){return(...args)=>{if(!siteTurn){siteDraft='';siteNotice='';}return fn(...args);};}
choose=clearDraft(explicitActions.choose);pickSide=clearDraft(explicitActions.pickSide);sayTopic=clearDraft(explicitActions.sayTopic);newGame=clearDraft(explicitActions.newGame);
const originalPanel=renderPanel;
renderPanel=function(){const y=window.scrollY||0,x=window.scrollX||0;originalPanel();const panel=$('#panel');if(V.panelOpen){panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',L().fab);}else{panel.removeAttribute('role');panel.removeAttribute('aria-modal');}if(!V.panelOpen)window.scrollTo?.({top:y,left:x,behavior:'instant'});};
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&V.panelOpen){V.panelOpen=false;renderPanel();$('#fab')?.focus();}});
