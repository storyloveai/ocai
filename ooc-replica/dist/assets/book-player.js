import {bookMetadata} from './book-catalog.js';
import {typeStream,escapeHTML as esc} from './stream.js';
let dispose=()=>{};
const text=x=>typeof x==='string'?x:x?.zh||'';
export function isBookPath(path){return bookMetadata.some(b=>path==='/play/'+b.id);}
export function stopBook(){dispose();dispose=()=>{};}
export async function mountBook(path,{reference,helpers}){
 stopBook();const meta=bookMetadata.find(b=>path==='/play/'+b.id);if(!meta)return false;
 const host=reference.mountShell('<div id="book-player" class="book-player" role="region" aria-label="名著互动"><p role="status">正在展开书页……</p></div>',helpers,'book-campaign');
 const root=host.querySelector('#book-player'),life=new AbortController();let turn=null,typing=null,busy=false,notice='',draft='',panel='journey',C,camp,G,started=false,mode='ai';
 const alive=()=>root.isConnected&&!life.signal.aborted;
 dispose=()=>{life.abort();turn?.abort();typing?.abort();};
 document.title=meta.title;
 const storeKey='ooc-session-v2-'+meta.id;
 try{
  const [module,response,cfg]=await Promise.all([import('./book-campaign-core.js'),fetch('/assets/book-campaigns/'+meta.id+'.json',{signal:life.signal}),fetch('/api/config',{signal:life.signal}).then(r=>r.json()).catch(()=>({configured:false}))]);
  if(!response.ok)throw Error('Book unavailable');camp=await response.json();C=window.CC;if(!C||!alive())return false;
  mode=cfg.configured?'ai':'authored';
  const saved=helpers.read(storeKey,{}),state=saved?.['campaign.save'];
  if(saved.book===meta.id&&state?.build===camp.build&&Array.isArray(state.log)&&Array.isArray(state.ledger)&&Number.isInteger(state.ch)&&state.ch>=0&&state.ch<=camp.chapters.length&&['node','side','end'].includes(state.phase)&&(state.phase!=='node'||camp.nodes[state.cur])&&Object.keys(camp.vars).every(k=>Object.hasOwn(state.v||{},k))){G=state;started=true;}else G=C.newGame(camp);
  function save(){
   if(!alive())return;G.build=camp.build;
   helpers.save(storeKey,{book:meta.id,title:meta.title,summary:started?(camp.chapters[G.ch]?.title||'卷一结局'):'卷一开场','campaign.save':G});
   helpers.save('ooc-history',[meta.id,...helpers.read('ooc-history',[]).filter(x=>x!==meta.id)]);
  }
  const paras=rows=>(rows||[]).map(row=>`<p>${esc(text(row.text))}</p>`).join('');
  function story(){
   return G.log.map((entry,i)=>{
    if(entry.k==='ch'){const ch=camp.chapters.find(x=>x.id===entry.c);return `<section class="book-chapter"><small>卷一 · 第 ${camp.chapters.indexOf(ch)+1} 章</small><h2>${esc(text(ch.title))}</h2>${paras(entry.p.map(n=>ch.intro[n]))}</section>`;}
    if(entry.k==='node'){const n=camp.nodes[entry.n];return `<section class="book-beat" data-book-beat="${i}"><small>${esc(n.place)} · ${n.kind==='side'?'支线':n.kind==='interrupt'?'突发事件':'主线'}</small><h3>${esc(text(n.title))}</h3>${(entry.cb||[]).map(j=>`<p class="book-echo">↳ ${esc(text(n.callbacks[j].text))}</p>`).join('')}${paras(entry.p.map(j=>n.intro[j]))}</section>`;}
    if(entry.k==='choice'){const n=camp.nodes[entry.n],ch=n.choices.find(x=>x.id===entry.c);return `<section class="book-beat" data-book-beat="${i}"><p class="book-decision">${esc(text(ch.label))}</p>${paras(entry.p.map(j=>ch.out[j]))}</section>`;}
    if(entry.k==='ans'){const n=camp.nodes[entry.n],ans=n.ask.answers.find(x=>x.id===entry.a);return `<section class="book-beat" data-book-beat="${i}">${entry.said?`<p class="book-you">${esc(entry.said)}</p>`:''}${paras(entry.p.map(j=>ans.out[j]))}</section>`;}
    if(entry.k==='book_chat')return `<section class="book-beat" data-book-beat="${i}"><p class="book-you">${esc(entry.words)}</p>${entry.reply?`<p>${esc(entry.reply)}</p>`:''}</section>`;
    if(entry.k==='walkout')return `<p class="book-echo">${esc(text(camp.chars[entry.who]?.name))}暂时不愿再谈。请用行动继续。</p>`;
    if(entry.k==='commit')return `<p class="book-echo">承诺${entry.status==='kept'?'已兑现':'未守住'}；详情可在记事中查看。</p>`;
    return '';
   }).join('');
  }
  function ending(){return C.endings(camp,G).map(hit=>{const group=camp.endings.find(x=>x.id===hit.group),f=group.fragments.find(x=>x.id===hit.frag);return `<section class="book-ending"><h3>${esc(text(group.title))}</h3>${paras([f])}${hit.why.length?`<details><summary>为什么走到这里</summary>${hit.why.map(e=>{const n=camp.nodes[e.node],ch=n?.choices.find(x=>x.id===e.choice);return `<p>${esc(text(n?.title))} · ${esc(text(ch?.label)||'对话与行动')}：${esc(text(camp.vars[e.var]?.label)||e.var)} ${esc(e.from)} → ${esc(e.to)}</p>`;}).join('')}</details>`:''}</section>`;}).join('');}
  function controls(){
   if(G.phase==='end')return `<h2>卷一终</h2>${ending()}<p>后续卷尚未制作。可在右侧记事查看承诺和因果记录。</p>`;
   if(G.phase==='side')return `<h3>路上只够做一件事</h3><p>${esc(camp.side_prompt)}</p><div class="book-choices">${G.offer.map(id=>{const n=camp.nodes[id];return `<button data-book-side="${id}"><strong>${esc(text(n.title))}</strong><span>${esc(n.place)} · ${esc(text(n.intro[0]?.text))}</span></button>`;}).join('')}</div>`;
   const n=camp.nodes[G.cur],ask=C.ask(camp,G),cast=C.castNow(camp,G);
   return `${ask?`<div class="book-question"><strong>${esc(text(camp.chars[ask.who].name))}问你</strong><p>${esc(text(ask.q))}</p><small>可自己打字回答；直接行动会保留“尚未回答”。</small></div>`:''}<div class="book-choices">${C.choices(camp,G).map(o=>`<button data-book-choice="${o.id}" ${o.locked?'disabled':''}><strong>${esc(text(o.c.label))}</strong>${o.locked?`<span>${esc(text(o.c.hint))}</span>`:''}</button>`).join('')}</div>${cast.length?`<form id="book-talk"><label>对谁说 <select name="target" aria-label="对话人物">${cast.map(id=>`<option value="${id}">${esc(text(camp.chars[id].name))}</option>`).join('')}</select></label><textarea name="words" maxlength="200" rows="3" aria-label="你的回答或行动" placeholder="用自己的话回答、交谈，或说明想做的行动……">${esc(draft)}</textarea><div class="book-compose"><small>${ask?'本场问题仍待回答':'本场还可自由交谈 '+C.freeLeft(camp,G)+' 次'} · ${mode==='ai'?'AI 白话与情景':'编排文本模式'}</small><button type="submit" ${!ask&&C.freeLeft(camp,G)<=0?'disabled':''}>发送</button></div></form>`:''}`;
  }
  function journal(){
   if(panel==='journey')return `<h3>章节</h3><ol>${camp.chapters.map((ch,i)=>`<li ${i===G.ch?'aria-current="step"':''}>${i<G.ch?'✓ ':i===G.ch?'→ ':''}${esc(text(ch.title))}${i>G.ch?' · 未至':''}</li>`).join('')}</ol><small>按故事推进，不跳过尚未完成的选择。</small>`;
   if(panel==='relations')return `<h3>人物关系</h3>${Object.entries(camp.chars).map(([id,ch])=>`<p>${esc(text(ch.name))}<br><small>信任 ${G.v['rel.'+id+'.trust']} / 8${ch.romance?' · 可逐渐发展关系':''}</small></p>`).join('')}<small>好感不能替代同意；伤害不会因闲聊而从记录中消失。</small>`;
   return `<h3>承诺与回响</h3>${(G.commits||[]).map(k=>`<p>${esc(text(camp.chars[k.char]?.name))}：${esc(k.text)}<br><small>${{open:'待行动证明',kept:'已兑现',broken:'未守住'}[k.status]}</small></p>`).join('')||'<p>尚未留下可检验的保护或同行承诺。</p>'}<p>旧账：${{none:'未预支',open:'尚待第六章结算',transform:'已转为明确任务',reroute:'已移交监督复核',cancel:'已清偿'}[G.v['debt.advance']]||'待复核'}</p><p>回响 ${Object.values(G.echoes).filter(e=>e.paid.length).length} / ${Object.keys(G.echoes).length}</p><details><summary>最近的规则记录</summary>${G.ledger.slice(-16).map(e=>`<p>${esc(text(camp.nodes[e.node]?.title))} ${e.changes.map(x=>`${esc(text(camp.vars[x.var]?.label)||x.var)} ${esc(x.from)}→${esc(x.to)}`).join('；')||'记事已更新'}</p>`).join('')}</details>`;
  }
  const seen=new Set();
  function render(animate=false){
   if(!alive())return;typing?.abort();
   const y=window.scrollY;root.innerHTML=`<header class="book-header"><a href="/">‹ 返回书架</a><h1>${esc(meta.title)}</h1><button data-book-reset>重新开始</button></header>${!started?`<section class="book-intro"><img src="${esc(meta.image)}" alt="${esc(meta.title)}"><div><small>${esc(meta.subtitle)}</small><h2>${esc(meta.title)}</h2><p>${esc(meta.description)}</p><p>${esc(camp.adaptation)}</p><p>八章连续故事 · 原创玩家视角 · 规则决定结果<br>进度使用当前账号的独立存档。封面为排版书封，插图待接入作图 API。</p><button data-book-start class="book-primary">展开第一章</button></div></section>`:`<div class="book-meters">${Object.entries(camp.vars).filter(([k,v])=>v.show&&!k.startsWith('rel.')).map(([k,v])=>`<span>${esc(text(v.label))}<b>${esc(G.v[k])}</b></span>`).join('')}</div><div class="book-columns"><div><div id="book-story">${story()}</div><section id="book-actions">${controls()}</section><p class="book-notice" role="status">${esc(notice)}</p><label class="book-mode">对白模式 <select id="book-mode"><option value="ai" ${mode==='ai'?'selected':''}>AI 流式对白</option><option value="authored" ${mode==='authored'?'selected':''}>编排文本</option></select></label><div id="book-live" hidden><small>正在理解并回复……</small><p></p><button data-book-stop>停止</button></div></div><aside><nav aria-label="战役侧栏">${[['journey','章节'],['relations','人物'],['journal','记事']].map(([id,label])=>`<button data-book-panel="${id}" aria-pressed="${panel===id}">${label}</button>`).join('')}</nav><div id="book-journal">${journal()}</div></aside></div>`}`;
   if(!animate)return;const fresh=[...root.querySelectorAll('[data-book-beat] p:not(.book-you):not(.book-decision)')].filter(el=>{const key=el.closest('[data-book-beat]').dataset.bookBeat+'|'+el.textContent;if(seen.has(key))return false;seen.add(key);return true;});
   if(!fresh.length||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
   const controller=new AbortController();typing=controller;
   const entries=fresh.map(el=>[el,el.textContent]);
   for(const [el,value]of entries){el.dataset.full=value;el.textContent='';}
   void(async()=>{try{for(const [el,value]of entries){if(controller.signal.aborted)break;await typeStream((async function*(){yield value;})(),{signal:controller.signal,onText:v=>{el.textContent=v;},onState:()=>{},step:5});}}finally{for(const [el,value]of entries){if(el.isConnected)el.textContent=value;delete el.dataset.full;}}})();
   if(Math.abs((window.scrollY||0)-y)<20)root.querySelector('#book-actions')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  async function speak(words,target){
   if(busy||!words.trim()||!alive())return;draft=words;typing?.abort();busy=true;notice='';turn=new AbortController();const signal=AbortSignal.any([life.signal,turn.signal]);
   const original=C.clone(G),n=camp.nodes[G.cur],ask=C.ask(camp,G);let output,finalReply='';
   const live=root.querySelector('#book-live');live.hidden=false;root.querySelector('#book-actions').setAttribute('inert','');
   try{
    if(mode==='authored')output={pick:ask?C.guessAnswer(camp,G,words):null,reply:ask?null:'对方听完，将目光移回眼前的事情，等你作出具体安排。',tone:C.guessTone(words),commit:null};
    else{
     const response=await fetch('/api/book-campaign',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/x-ndjson'},signal,body:JSON.stringify({book:meta.id,phase:'express',task:ask?'answer':'scene',lang:'zh',context:{node:n.id,text:words,target,vars:G.v,recent:G.log.filter(e=>e.k==='book_chat').slice(-4).flatMap(e=>[e.words,e.reply]),memories:(G.mem?.[target]||[]).slice(-3),promises:(G.commits||[]).filter(k=>k.char===target&&k.status==='open').slice(-4)}})});
     if(!response.ok||!response.body||!response.headers.get('content-type')?.startsWith('application/x-ndjson'))throw Error('AI unavailable');
     async function* chunks(){const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',last='';const parse=line=>{const e=JSON.parse(line);if(e.type==='error')throw Error(e.code);if(e.type==='done')output=e.output;const next=e.output?.reply;if(typeof next==='string'&&next.startsWith(last)){const delta=next.slice(last.length);last=next;return delta;}return '';};try{while(true){const part=await reader.read();if(part.done)break;buffer+=decoder.decode(part.value,{stream:true});let k;while((k=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,k);buffer=buffer.slice(k+1);if(line.trim()){const delta=parse(line);if(delta)yield delta;}}}buffer+=decoder.decode();if(buffer.trim()){const delta=parse(buffer);if(delta)yield delta;}if(!output)throw Error('Incomplete stream');}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}}
     await typeStream(chunks(),{signal,onText:value=>{live.querySelector('p').textContent=value;},onState:()=>{}});
    }
    if(signal.aborted)throw Error('Stopped');
    if(!output||output.reply!==null&&(typeof output.reply!=='string'||output.reply.length>1600))throw Error('Invalid output');
    G=C.clone(original);
    if(ask){C.answer(camp,G,ask.answers.some(a=>a.id===output.pick)?output.pick:ask.fallback,words);}
    else{
     const action=C.choices(camp,G).find(o=>o.id===output.pick&&!o.locked);
     if(!action&&C.freeLeft(camp,G)<=0)throw Error('No free lines');
     G.log.push({k:'book_chat',n:n.id,words,reply:output.reply||''});
     if(action)C.choose(camp,G,action.id);
     else{C.chat(camp,G);C.speak(camp,G,C.LABELS.includes(output.tone)?output.tone:'flat',words,target);C.remember(camp,G,target,{text:words.slice(0,60)});
      const kind=C.guessPromise(words);if(['protect','loyalty'].includes(kind)&&camp.commit_rules.some(r=>r.char===target&&r.kind===kind)&&!G.commits?.some(k=>k.status==='open'&&k.char===target&&k.kind===kind))C.commit(camp,G,{char:target,kind,text:words.slice(0,40)});
     }
    }
    finalReply=output.reply||'';draft='';notice=mode==='authored'?'使用编排文本；没有调用 AI。':'剧情变化已按规则记录。';save();
   }catch(e){G=original;notice=signal.aborted?'已停止，本次输入没有改变进度。':'AI 回复未完成；进度未变，输入已保留。可重试或切换编排文本。';}
   finally{busy=false;turn=null;if(alive())render(false);}
  }
  root.addEventListener('submit',event=>{if(event.target.id!=='book-talk')return;event.preventDefault();void speak(event.target.elements.words.value.trim(),event.target.elements.target.value);});
  root.addEventListener('input',event=>{if(event.target.name==='words')draft=event.target.value;});
  root.addEventListener('change',event=>{if(event.target.id==='book-mode')mode=event.target.value;});
  root.addEventListener('click',event=>{
   const b=event.target.closest('button');if(!b)return;
   if(b.hasAttribute('data-book-stop')){turn?.abort();return;}if(busy)return;
   if(b.dataset.bookPanel){panel=b.dataset.bookPanel;root.querySelector('#book-journal').innerHTML=journal();root.querySelectorAll('[data-book-panel]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));return;}
   if(b.hasAttribute('data-book-reset')){const form=document.createElement('div');form.className='book-reset';form.innerHTML='<p>从第一章重新开始？当前存档会保留为上一轮备份。</p><button data-book-confirm>保存备份并重开</button><button data-book-cancel>取消</button>';b.after(form);return;}
   if(b.hasAttribute('data-book-cancel')){b.parentElement.remove();return;}
   if(b.hasAttribute('data-book-confirm')){helpers.save(storeKey+'-previous',helpers.read(storeKey,{}));G=C.newGame(camp);started=true;draft='';notice='已保留上一轮备份。';seen.clear();save();render(true);return;}
   if(b.hasAttribute('data-book-start')){started=true;save();render(true);return;}
   if(b.dataset.bookSide){C.pickSide(camp,G,b.dataset.bookSide);save();draft='';render(true);return;}
   if(b.dataset.bookChoice&&!b.disabled){C.choose(camp,G,b.dataset.bookChoice);save();draft='';render(true);}
  });
  render(false);return true;
 }catch(e){console.warn('book_campaign_load_failed',e.message);if(alive())root.innerHTML='<p role="alert">本书暂时未能加载。请刷新重试，已有存档仍保留。</p><a href="/">返回书架</a>';return false;}
}
