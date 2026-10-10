from pathlib import Path
p=Path('/workspace/scratch/5078990eb041/oocai/dist/app.js')
s=p.read_text()
s=s.replace("let page='story'", "const realCharacters=window.OOC_CHARACTERS||[];\nlet chatError='',activeRequest=null,serviceReady=null;\nlet page='character'")
s=s.replace('function items(){return [...state.created,...original]}','function items(){return [...realCharacters,...state.created,...original]}')
s=s.replace("function persist(){localStorage.setItem('ooc-demo',JSON.stringify(state));historyList()}","function persist(){try{localStorage.setItem('ooc-demo',JSON.stringify(state))}catch{toast('本地储存已满，本次聊天可能无法保存。')}historyList()}")
s=s.replace("${t.plays||'New'}", "${esc(t.real?t.mood:(t.plays||'Preview'))}")
s=s.replace("${page==='character'?'Character':'Story'}", "${t.real?'角色聊天':(t.type==='character'?'Character':'Story')}")
s=s.replace("${page==='character'?'character':''}", "${t.type==='character'?'character':''}")
s=s.replace("<p>Interface recreation · local demo</p>","<p>角色聊天实验室 · 非官方同人原型</p>")
a=s.index('function home()');b=s.index('function head(',a)
s=s[:a]+'''function home(){
 const h=realCharacters[hero%3];
 const featured=realCharacters.filter(t=>genre==='Main'||genre==='Rankings'||t.genre===genre);
 return `<section class="hero characterhero"><div class="herocopy"><span class="eyebrow">OOC AI · CHARACTER CHATS</span><h1>一次相遇，<br>一段属于你的故事。</h1><p>和鲜明的角色自然交谈。冒险、日常，或只是分享今天。</p><button class="explore" data-chat="${h.id}">与 ${esc(h.name)} 交谈 ↗</button><span class="hero-caption">${esc(h.scene)} · ${esc(h.mood)}</span></div><div class="heroart"><img src="${esc(h.image)}" alt="${esc(h.name)}"><div class="hero-art-caption"><small>${esc(h.origin)}</small><strong>${esc(h.name)}</strong></div></div><div class="herodots">${realCharacters.map((c,i)=>`<button data-feature="${i}" class="${i===hero%3?'selected':''}" aria-label="查看${esc(c.name)}"></button>`).join('')}</div></section><div class="content"><section class="section featured"><div class="sectionhead"><div><span class="eyebrow">MEET YOUR CHARACTERS</span><h2>从谁的故事开始？</h2></div><span class="quiet">3 位角色 · 3 种性格</span></div><div class="cards featured-cards">${featured.map((t,i)=>card(t,i)).join('')}</div><p class="fan-note">角色设定与开场为原创同人内容，与原作权利人无关联。聊天由 AI 生成，可能出现错误。</p></section>${page==='story'?section('故事预览 · 尚未接入聊天',original.slice(0,5)):''}</div>${footer()}`;
}
''' +s[b:]
a=s.index('function detail()');b=s.index('function openModal(',a)
s=s[:a]+'''function detail(){const t=selected;return head(t.real?'角色档案':'故事预览',`<button data-page="character" aria-label="返回角色">✕</button>`)+`<div class="detail"><div class="detailtop"><img src="${esc(t.image)}" alt="${esc(t.name)}"><div><span class="eyebrow">${esc(t.origin||t.genre)}</span><h1>${esc(t.name)}</h1><p>${esc(t.description)}</p><div class="tags"><span class="chip">${esc(t.mood||t.genre)}</span><span class="chip">${t.real?'非官方同人':'占位预览'}</span></div><div class="detailactions"><button class="primary" data-chat="${esc(t.id)}">${state.chats[t.id]?'继续对话':'开始对话'} →</button><button class="secondary" data-like="${t.id}">${state.favorites.includes(t.id)?'♥ 已收藏':'♡ 收藏'}</button><button class="secondary" data-action="share">↗ 分享</button></div></div></div><div class="detailtext"><h2>故事从这里开始</h2><p class="opening">${esc(t.intro)}</p><h2>关于这段对话</h2><p>${t.real?'近期聊天用于保持上下文，对话记录只保存在当前浏览器。发送后，最近最多20条消息会交给AI服务处理。':'此故事是界面预览，暂未接入真实聊天。'}</p></div></div>`}
function startChat(id){
 const next=items().find(t=>t.id===id);if(!next)return;
 if(selected?.id!==id&&activeRequest)activeRequest.abort();
 selected=next;chatError='';
 if(!state.chats[id])state.chats[id]=[{role:'assistant',text:selected.intro||'欢迎。'}];
 // An interrupted draft is never treated as a complete model response.
 state.chats[id]=state.chats[id].filter(m=>!m.pending);
 page='chat';location.hash='chat/'+id;persist();render();
}
function chat(){const ms=state.chats[selected.id]||[];return `<div class="chat-layout"><div class="chat"><div class="chathead"><button data-action="backDetail" aria-label="返回角色档案">‹</button><div class="chat-title"><b>${esc(selected.name)}</b><small>${esc(selected.scene||'预览场景')}</small></div><button class="secondary new-chat" data-action="restartChat" ${busy?'disabled':''}>新对话</button><button data-action="chatMenu" aria-label="对话菜单">⋯</button></div><div class="messages" id="messages"><div class="chatintro"><img src="${esc(selected.image)}" alt="${esc(selected.name)}"><span class="eyebrow">${esc(selected.origin||'故事预览')}</span><h2>${esc(selected.name)}</h2><p>${esc(selected.description)}</p></div>${ms.map((m,i)=>`<div class="msg ${m.role} ${m.pending?'pending':''}"><small>${m.role==='user'?esc(state.avatar):esc(selected.name)}</small><div class="bubble" ${m.pending?'id="streamBubble"':''}>${m.pending&&!m.text?'<span class="typing"><i></i><i></i><i></i></span>':esc(m.text)}</div>${m.role==='assistant'&&i===ms.length-1&&i>0&&!m.pending?`<button data-regenerate="${i}" ${busy?'disabled':''}>↻ 重新生成</button>`:''}</div>`).join('')}<div id="chatError" class="chat-error" role="alert" ${chatError?'':'hidden'}><span>${esc(chatError)}</span><button class="secondary" data-action="retryChat" ${busy?'disabled':''}>重试</button></div></div><div class="composer">${ms.length<=1?`<div class="suggestions">${(selected.suggestions||[]).map(t=>`<button data-suggestion="${esc(t)}">${esc(t)}</button>`).join('')}</div>`:''}<form id="sendForm" class="inputrow"><textarea id="message" maxlength="4000" rows="1" placeholder="说些什么，或描述你的行动…" aria-label="消息" ${busy?'disabled':''}></textarea><button type="submit" aria-label="发送消息" ${busy?'disabled':''}>↑</button></form><div class="demohint">${busy?'正在回复…':selected.real?'AI 角色 · 对话保存在此浏览器 · Enter 发送，Shift+Enter 换行':'占位故事暂未接入聊天'}${serviceReady===false&&selected.real?' · 服务待连接':''}</div></div></div><aside class="character-rail"><img src="${esc(selected.image)}" alt=""><div><span class="eyebrow">${esc(selected.origin||'PREVIEW')}</span><h2>${esc(selected.name)}</h2><p>${esc(selected.mood||selected.genre)}</p><p>${esc(selected.description)}</p><small>你的行动，由你决定。</small></div></aside></div>`}
function scrollChat(force=true){const m=$('#messages');if(m&&(force||m.scrollHeight-m.scrollTop-m.clientHeight<140))m.scrollTop=m.scrollHeight}
function recentMessages(ms){const history=ms.filter(m=>!m.pending&&!m.failed&&m.text.trim()).slice(-20);let size=0;const result=[];for(let i=history.length-1;i>=0;i--){if(size+history[i].text.length>20000)break;size+=history[i].text.length;result.unshift({role:history[i].role,content:history[i].text});}return result;}
async function generate(){
 if(busy||!selected)return;if(!selected.real){chatError='这个故事仍是预览。请选择 Lara、蒂法或春丽开始真实聊天。';render();return;}
 const id=selected.id,ms=state.chats[id];if(ms.at(-1)?.role!=='user')return;
 const messages=recentMessages(ms);busy=true;chatError='';const controller=new AbortController();activeRequest=controller;
 const pending={role:'assistant',text:'',pending:true};ms.push(pending);render();
 const timer=setTimeout(()=>controller.abort(),55000);
 let succeeded=false;
 try{
  const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({characterId:id,messages}),signal:controller.signal});
  if(!response.ok){let error;try{error=(await response.json()).error}catch{}throw Error(error||(response.status===429?'请求较多，请稍等一分钟再试。':'聊天服务暂时不可用，请重试。'));}
  if(!response.headers.get('content-type')?.includes('text/event-stream')||!response.body)throw Error('聊天接口尚未部署，请稍后再试。');
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',doneEvent=false;
  const line=raw=>{if(!raw.startsWith('data:'))return;const e=JSON.parse(raw.slice(5));if(e.error)throw Error(e.error);if(e.done)doneEvent=true;if(e.delta){pending.text+=e.delta;const bubble=$('#streamBubble');if(page==='chat'&&selected?.id===id&&bubble){const m=$('#messages'),follow=m.scrollHeight-m.scrollTop-m.clientHeight<140;bubble.textContent=pending.text;if(follow)scrollChat();}}};
  try{while(true){const {done,value}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});const lines=buffer.split('\\n');buffer=lines.pop();for(const l of lines)line(l);if(done){if(buffer)line(buffer);break;}}}finally{await reader.cancel().catch(()=>{});}
  if(!doneEvent||!pending.text)throw Error('回复中断，请重试。');
  delete pending.pending;succeeded=true;
 }catch(e){const index=ms.indexOf(pending);if(index>=0)ms.splice(index,1);if(selected?.id===id)chatError=controller.signal.aborted?'回复已中断，请重试。':e.message;}
 finally{clearTimeout(timer);if(activeRequest===controller){activeRequest=null;busy=false;}persist();if(page==='chat'&&selected?.id===id)render();}
 return succeeded;
}
function send(text){text=text.trim();if(!text||busy)return;if(chatError&&state.chats[selected.id]?.at(-1)?.role==='user'){toast('请重试上一条消息，或开始新对话。');return;}if(text.length>4000)return toast('每条消息最多4000个字符。');state.chats[selected.id].push({role:'user',text});persist();generate();}
''' +s[b:]
s=s.replace("if(e.target.id==='message'&&e.key==='Enter'&&!e.shiftKey)","if(e.target.id==='message'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing)")
s=s.replace("if(d.hero){", "if(d.feature!==undefined){hero=Number(d.feature);render();return}if(d.hero){")
s=s.replace("if(d.regenerate!==undefined){state.chats[selected.id][Number(d.regenerate)].text=reply('continue');persist();render();return}","if(d.regenerate!==undefined){if(busy)return;state.chats[selected.id].splice(Number(d.regenerate));persist();generate();return}")
s=s.replace("switch(d.action){", "switch(d.action){case'retryChat':generate();break;")
s=s.replace("case'backDetail':page='detail';render();break;", "case'backDetail':nav('character');break;")
s=s.replace("case'restartChat':state.chats[selected.id]=[{role:'assistant',text:selected.intro}];persist();modal.close();render();toast('New conversation started');break;", "case'restartChat':if(busy)break;state.chats[selected.id]=[{role:'assistant',text:selected.intro}];chatError='';persist();if(modal.open)modal.close();render();toast('已开始新对话');break;")
s=s.replace("if(page!=='chat')startChat(h.slice(5))", "if(selected?.id!==h.slice(5)||page!=='chat')startChat(h.slice(5))")
s=s.replace('This recreation uses local demo replies and placeholder artwork.', 'Lara、蒂法与春丽通过服务端连接真实AI；其他故事仍是占位预览。最近最多20条消息提供上下文。')
s=s.replace('Artwork, story content, authentication, payments, and AI replies are placeholders. This demo is not affiliated with OOC.', 'OOC AI 是独立的非官方角色聊天原型。账户、支付与其他故事暂为界面预览，既有角色及作品名称归原权利人所有。')
s+='\nfetch("/api/status").then(r=>r.ok?r.json():null).then(s=>{serviceReady=s?.ready??null;if(page==="chat"&&!busy)render()}).catch(()=>{});\n'
p.write_text(s)
h=Path('/workspace/scratch/5078990eb041/oocai/dist/index.html')
t=h.read_text().replace('<script src="app.js"></script>','<script src="characters.js"></script><script src="app.js"></script>')
t=t.replace('lang="en"','lang="zh-CN"').replace('OOC · The Playable Anime','OOC AI · 角色聊天').replace('An interactive OOC interface recreation with stories, characters, and local demo conversations.','OOC AI 角色聊天：与 Lara Croft、蒂法、春丽开启你的故事。')
h.write_text(t)
