import {resolveLibraryRecords, VISITED_TITLES_KEY, withVisitedTitle} from './library-records.js';
import {characterProfileUrl, canonicalCharacterUrl} from './character-links.js';
import {xichuanDemoReply, xichuanDemoStarters} from './xichuan-demo.js';
import {createCreditClient} from './credit-client.js';
import {chatAttempt,consumeStoryReturn} from './loop-events.js';
import {readXichuanProgress,storyContext,latestSave} from './xichuan-state.js';
import {xichuanStoryLink} from './xichuan-player.js';
import {JIBAI_ID, SHENCHENG_ID, isXichuanCharacterId} from './xichuan-character.js';
import {openCharacterSession} from './character-session.js';
import {attachCharacterControls} from './character-controls.js';
import {characterReadingHTML,balanceCharacterAction} from './character-reading.js';
import {translate} from './site-i18n.js';
import {julian, julianAt, impressions, seasonKey, nightPath} from './seven-nights-character.js';
import {characterIntroMarkup} from './sanguo-character-hub.js';
import {FEATURED_CHARACTER_CARDS} from './flywheel/cards-data.js';
import {SuggestionLoader,parseSuggestions} from './suggestions.js';
import {historyIds,lastSessionText} from './history.js';
import {loadPublicConfig} from './public-config.js';
import {mountInteraction} from './reference.js';
import {track} from './analytics.js';
import {typeStream,demoStream,httpStream,conversationForRequest,escapeHTML as safe,markdown} from './stream.js';
const [pages,storyPreviews,initialAIConfiguration]=await Promise.all([
 fetch('/assets/interaction-pages.json').then(r=>r.json()),
 fetch('/assets/scenarios.json').then(r=>r.json()).catch(()=>({stories:{}})),
 loadPublicConfig().catch(()=>null),
]);
let aiConfiguration=initialAIConfiguration;
for(const href of ['/assets/chat-source.css','/assets/interaction.css','/assets/character-reading.css']){const link=document.createElement('link');link.rel='stylesheet';link.href=href;await new Promise((resolve,reject)=>{link.onload=resolve;link.onerror=reject;document.head.append(link);});}
let cleanup=()=>{};
const genres=['Romance','Fantasy','Sci-Fi','Boys Love','Girls Love','History','Horror','Slice of Life','Oriental Fantasy','Fan Fiction','Utility','Others'];
const sessionLanguage=()=>document.documentElement.lang?.startsWith('zh')?'zh':'en';
const local=text=>translate(text,sessionLanguage());
const replyError=error=>['FUNDING_REVIEW_REQUIRED','INSUFFICIENT_CREDITS','LOGIN_REQUIRED','ACCOUNT_CHANGED','PRICE_CHANGED','OPERATION_RESERVED','OPERATION_SETTLED','BILLING_UNAVAILABLE'].includes(error?.code)?error.message:local(({AI_NOT_CONFIGURED:'Character replies are temporarily unavailable. Please try again.',AI_TIMEOUT:'The model is taking too long. Please try again.',AI_RATE_LIMIT:'The model service is busy. Please try again shortly.',AI_INCOMPLETE:'The reply was incomplete. No credits were charged. Please try again.',AI_INTERRUPTED:'The reply was interrupted. The text already shown is kept.'})[error?.code]||'The model service is unavailable. Please try again later.');
const triangle='<svg viewBox="0 0 24 24"><path d="m7 4 13 8-13 8z" fill="currentColor"/></svg>';
const arrow='<svg viewBox="0 0 24 24"><path d="M18.379 12.876H3v-1.6h15.379L13.684 6.58l1.132-1.131 6.625 6.626-6.625 6.625-1.132-1.131z" fill="currentColor"/></svg>';
const chatIcon=name=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+({edit:'<path d="m15 4 5 5M4 20l4-1L20 7a2 2 0 0 0-5-5L3 14l-1 6z"/>',send:'<path d="M12 20V4m-6 6 6-6 6 6"/>',copy:'<rect x="8" y="3" width="11" height="14" rx="1"/><path d="M5 7H3v14h12v-2"/>',regenerate:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/>',more:'<circle cx="12" cy="5" r=".6"/><circle cx="12" cy="12" r=".6"/><circle cx="12" cy="19" r=".6"/>'}[name]||'')+'</svg>';
function narrative(text){return markdown(text).replace(/<pre><small>([\s\S]*?)<\/small><code>([\s\S]*?)<\/code><\/pre>/g,(_match,language,code)=>`<div class="session-codeblock"><div class="session-codeblock-header"><span>${language||'text'}</span><button type="button" aria-label="Copy code" data-copy-code>${chatIcon('copy')}</button></div><pre tabindex="0"><code>${code}</code></pre></div>`);}
function modal(title,content,onSave){const d=document.createElement('dialog');d.className='interaction-modal';d.innerHTML=`<button class="modal-close" aria-label="${local('Close')}">×</button><h2>${safe(local(title))}</h2>${content}`;document.body.append(d);d.querySelector('.modal-close').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());d.addEventListener('click',e=>{if(e.target===d)d.close();});if(onSave)d.querySelector('.save').onclick=()=>{onSave(d);d.close();};d.showModal();return d;}
function paintChatHelp(dialog){
 const zh=sessionLanguage()==='zh';
 dialog.querySelector('h2').textContent=zh?'聊天操作说明':'Chat controls';
 dialog.querySelector('h2').dataset.noI18n='';
 const paragraphs=zh?['这里只说明此聊天窗口的操作。','Enter 发送，Shift+Enter 换行；在输入框内按 Esc 可离开输入框。','回复生成时，点击发送位置的停止按钮可停止本次生成；已显示的文字会保留。']:['These instructions cover only this chat window’s controls.','Enter sends your message; Shift+Enter adds a line. Esc leaves the input field.','While a reply is generating, use the stop button in the send position. Text already shown is kept.'];
 if(dialog.hasAttribute('data-xichuan-chat'))paragraphs.push(zh?'故事里的选择会作为聊天参考。聊天不会改写游戏选项和存档。':'Story choices provide context for chat. Chat does not change game choices or saves.');
 dialog.querySelector('[data-chat-help-content]').innerHTML=paragraphs.map(text=>`<p>${safe(text)}</p>`).join('');
 const authorHeading=dialog.querySelector('[data-author-guide-heading]');if(authorHeading)authorHeading.textContent=zh?'作者玩法提示':'Author play tips';
}
function onboard(path,h){const step=Math.min(4,Math.max(1,Number(path.split('/')[2])||1));const savedProfile=h.read('ooc-profile',{});const profile={name:'',audience:'Male',...savedProfile,genres:Array.isArray(savedProfile?.genres)?savedProfile.genres.filter(genre=>genres.includes(genre)):[...genres]};const root=mountInteraction(pages[step===1||step===2?'name':step===3?'preferences':'complete'],h);const buttons=()=>[...root.querySelectorAll('button')];const button=t=>buttons().find(b=>b.textContent.trim()===t);const progress=root.querySelector('[role=progressbar]');progress.setAttribute('aria-valuenow',String(step*25));progress.setAttribute('aria-valuetext',step*25+'%');progress.firstElementChild.style.transform=`translateX(-${100-step*25}%)`;
 root.insertAdjacentHTML('beforeend','<small class="onboarding-demo">Profile preferences · cloud sync available when signed in</small>');
 const close=buttons().find(b=>!b.textContent.trim());if(close&&step<4){close.setAttribute('aria-label','Close onboarding');close.onclick=()=>h.navigate('/');}
 const persist=()=>h.save('ooc-profile',profile);const policy=root.querySelector('a[href*="/policy/service"]')?.parentElement;if(policy)policy.innerHTML='Signed-in preferences sync to your private Firebase account. Guest preferences stay on this device. <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.';
 if(step<=2){const input=root.querySelector('input'),heading=root.querySelector('h2'),caption=heading.nextElementSibling,next=button('Next');
  if(step===1){heading.textContent='Enter your birthdate';caption.textContent='Select your date of birth.';input.type='date';input.classList.add('date-picker');input.setAttribute('aria-label','Birthdate');input.removeAttribute('placeholder');input.value='';input.max=new Date().toISOString().slice(0,10);input.closest('.relative')?.querySelector('button')?.remove();const counter=[...root.querySelectorAll('span,div')].find(e=>/^6\/24$/.test(e.textContent.trim())&&e.children.length===0);if(counter)counter.textContent='';next.disabled=true;input.oninput=()=>next.disabled=!input.value||!input.checkValidity();next.onclick=()=>{if(input.value&&input.checkValidity())h.navigate('/onboarding/2');};}
  else{input.value=profile.name;input.maxLength=24;input.setAttribute('aria-label','Your name');const counter=[...root.querySelectorAll('*')].find(e=>e.children.length===0&&/^6\/24$/.test(e.textContent.trim()));const update=()=>{if(counter)counter.textContent=input.value.length+'/24';next.disabled=!input.value.trim();};input.oninput=update;update();buttons().filter(b=>!b.textContent.trim()&&b!==close).forEach(b=>b.onclick=()=>{input.value='';update();input.focus();});next.onclick=()=>{profile.name=input.value.trim();persist();h.navigate('/onboarding/3');};}
 }
 if(step===3){for(const b of buttons()){const label=b.textContent.trim();if(genres.includes(label)){const paint=()=>{const selected=profile.genres.includes(label);b.classList.toggle('border-brand',selected);b.classList.toggle('text-brand',selected);b.classList.toggle('border-border',!selected);b.classList.toggle('text-gray-1',!selected);b.setAttribute('aria-pressed',String(selected));};paint();b.onclick=()=>{profile.genres=profile.genres.includes(label)?profile.genres.filter(g=>g!==label):[...profile.genres,label];paint();persist();};}}
  root.querySelectorAll('[role=radio]').forEach((b,i)=>{const value=['Male','Female','Neutral'][i];b.setAttribute('aria-label',value);b.onclick=()=>{profile.audience=value;root.querySelectorAll('[role=radio]').forEach((r,j)=>{const checked=j===i;r.setAttribute('aria-checked',String(checked));r.dataset.state=checked?'checked':'unchecked';r.innerHTML=checked?'<span class="flex items-center justify-center"><svg viewBox="0 0 24 24" class="size-2.5 fill-primary"><circle cx="12" cy="12" r="12"/></svg></span>':'';});persist();};if(value===profile.audience)b.onclick();});button('Previous').onclick=()=>h.navigate('/onboarding/2');button('Next').onclick=()=>{persist();h.navigate('/onboarding/4');};
 }
 if(step===4){h.save('ooc-onboarding-complete',true);root.querySelectorAll('a[href^="/story/"]').forEach(a=>{a.href='/play/'+a.getAttribute('href').split('/')[2];});button("I'll give up the free tutorial").onclick=()=>h.navigate('/');const track=root.querySelector('[aria-roledescription=carousel]')||root.querySelector('[role=region]');if(track){const slides=track.querySelector('[style*="translate"]')||track.querySelector('.flex');let index=0;for(const [label,direction]of [['Next slide',1],['Previous slide',-1]]){const b=button(label);if(b){b.disabled=false;b.onclick=()=>{index=Math.max(0,Math.min(4,index+direction));if(slides)slides.style.transform=`translateX(-${index*50}%)`;};}}}}
 document.title='Set up your profile · StoryDate';return true;
}
function storyReturnIntro(id, lang) {
 if(id===SHENCHENG_ID)return lang==='zh'?'*她把杯子放回吧台，安静地看着你。*':'*She sets the cup back on the counter and watches you quietly.*';
 if(id===JIBAI_ID)return lang==='zh'?'*她关掉检片灯，转过身等你开口。*':'*She switches off the film inspection lamp and turns to hear what you have to say.*';
 return lang==='zh'?'*她放下手里的东西，等你开口。*':'*She sets down what she is holding and waits for you to speak.*';
}
function session(id,h,remote){const mine=/^u-/.test(id)?(h.read('ooc-custom',[]).find(d=>d&&d.status==='published'&&d.publishedId===id)||remote||null):null;const custom=mine?{type:mine.type==='character'?'character':'story',title:String(mine.title||'').slice(0,50),description:String(mine.description||'').slice(0,50),details:String(mine.details||'').slice(0,6000),prologue:String(mine.prologue||'').slice(0,2000),opening:String(mine.opening||'').slice(0,2000),scenario:String(mine.scenario||'').slice(0,25)}:null;const title=mine?{id,title:mine.title,description:mine.description,type:custom.type,image:mine.image||'assets/cover-0.webp',genre:'Custom'}:id===julian.id?julianAt(new URLSearchParams(location.search).get('scene')):h.data.find(d=>d.id===id);if(!title){mountInteraction('<div class="shell-empty"><h1>Story unavailable</h1><a href="/">Back to stories</a></div>',h);return true;}const isCharacter=title.type==='character'||id==='6a808dbe8cc39ab3d8abaf5e';const characterState=isCharacter?openCharacterSession(id,h):null;const root=mountInteraction(pages[isCharacter?'character':'story'],h);const q=s=>root.querySelector(s);const body=q('#session-messages'),scroll=q('#session-scroll'),input=q('#session-input'),send=q('[data-control=send]'),settings=q('#session-settings');body.classList.toggle('character',isCharacter);if(isCharacter)track('character_chat_opened',{character:id});const profile=h.read('ooc-profile',{name:''});const name=profile.name||'You';const sessionConfiguration=aiConfiguration,creditClient=createCreditClient(h.account,{config:()=>Promise.resolve(sessionConfiguration)});const billingOn=!!aiConfiguration?.billing?.enabled;const key='ooc-session-v2-'+id+(id===julian.id&&title.number>1?'-'+title.sceneId:'');let messages=characterState?characterState.state.messages:h.read(key,[]),controller,state='ready',follow=true,disposed=false,suggestionsVisible=h.read('ooc-suggestions-visible',false);const liveCharacter=isCharacter&&id!=='6a808dbe8cc39ab3d8abaf5e';const xichuanChat=isXichuanCharacterId(id);const modeKey=xichuanChat?'ooc-response-mode-'+id:'ooc-response-mode';let transport=xichuanChat?(h.read(modeKey,'demo')==='ai'&&aiConfiguration?.configured?'ai':'demo'):liveCharacter||aiConfiguration?.configured?'ai':h.read(modeKey,'demo');
 const authorGuide=typeof mine?.guide==='string'?mine.guide.slice(0,1000).trim():'';
 const jump=q('[data-control=bottom]'),paintJump=()=>{if(jump){jump.hidden=follow;jump.tabIndex=follow?-1:0;}};paintJump();
 const titleLink=root.querySelector(`a[href="/${isCharacter?'character':'story'}/${isCharacter?'6a808dbe8cc39ab3d8abaf5e':'69f414d90abbab6f6a2c8131'}"]`);if(titleLink){titleLink.href=mine?(h.read('ooc-custom',[]).some(d=>d&&d.status==='published'&&d.publishedId===id)?'/my-title':'/community'):isCharacter?(characterProfileUrl(id)||`/character/${id}`):`/story/${id}`;if(mine)titleLink.title=titleLink.href.endsWith('/my-title')?'Back to My Titles':'Browse Community';const label=[...titleLink.querySelectorAll('*')].find(e=>e.children.length===0&&e.textContent.trim()===(isCharacter?'Your New beautiful neighbour':'Lumencia Academy'));if(label){label.textContent=title.title;label.dataset.sessionTitle='';}}
 titleLink?.classList.add('session-title-link');
 if(id===julian.id&&titleLink)titleLink.href='/seven-nights';
 const onSet = isCharacter && (id === julian.id || /^seven-nights-ep[1-3]$/.test(new URLSearchParams(globalThis.location?.search).get('from')));
 if (onSet) settings.dataset.filmScene = title.sceneId || 'ep1_study';
 const pilotReturn=id===julian.id?nightPath(title.number):'/pilot/sanguo-manga';
 const interludeReturn=isCharacter&&globalThis.history?.state?.storydateNavigation===true&&globalThis.history.state.from===pilotReturn;

 const capturedBack=titleLink?.previousElementSibling;if(capturedBack?.matches('button')&&capturedBack.classList.contains('ts:hidden')){const back=document.createElement('a');back.setAttribute('href',titleLink.getAttribute('href'));if(back.getAttribute('href').startsWith('/story/'))back.dataset.fullInfo='';back.dataset.sessionBack='';back.dataset.noI18n='';back.className=capturedBack.className.replace('inline-block','inline-flex')+' items-center justify-center';back.style.cssText='min-width:44px;min-height:44px';back.innerHTML=capturedBack.innerHTML;back.querySelector('svg')?.setAttribute('aria-hidden','true');capturedBack.replaceWith(back);}
 if(interludeReturn||id===julian.id){
  const back=q('[data-session-back]');
  if(back){
   back.href=id===julian.id?'/seven-nights':pilotReturn;
   back.classList.remove('ts:hidden');
   if(id!==julian.id)back.addEventListener('click',event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    globalThis.history.back();
   });
  }
 }
 if(isCharacter){scroll.parentElement.classList.add('character-dialogue-column');const actions=q('[data-control=model]')?.parentElement;actions?.classList.add('character-session-actions');actions?.parentElement?.classList.add('character-session-header');actions?.parentElement?.parentElement?.classList.add('character-session-shell');input.parentElement?.parentElement?.parentElement?.classList.add('character-composer-wrap');}
 const settingsTitle=settings.querySelector('p');if(settingsTitle){settingsTitle.textContent=title.title;settingsTitle.dataset.sessionTitle='';const pencil=settingsTitle.nextElementSibling;if(pencil?.matches('button.shrink-0'))pencil.remove();}
 settings.querySelectorAll('button').forEach(b=>{
  const label=b.textContent.trim();
  if(label==='Avatars'){b.remove();return;}
  if(label==='Character Preview'){const group=b.parentElement;if([...group.children].some(el=>el.textContent.trim()==='Start Settings'))group.remove();else b.remove();return;}
  if(label.includes('Image Gallery')){b.dataset.sessionSetting='View image';b.dataset.noI18n='';}
  else if(label==='Play Guide'){b.dataset.sessionSetting='Chat help';b.dataset.noI18n='';}
  else if(['User Note','Memories','Keyboard Shortcuts','Output Length'].includes(label))b.dataset.sessionSetting=label;
  if(isCharacter&&label==='Memories'){const text=[...b.querySelectorAll('span,div')].find(el=>!el.children.length&&el.textContent.trim()==='Memories');if(text){text.dataset.sessionMemoryLabel='';text.dataset.noI18n='';}}
 });
 settings.querySelectorAll('[role=region]').forEach(region=>region.remove());
 settings.querySelectorAll('[role=switch]').forEach(button=>button.parentElement.remove());
 if (onSet) {
  const model = q('[data-control=model]');
  const portrait = settings.querySelector('img');
  portrait?.closest('[class~="group/item"]')?.after(model);
 }
 const paintSettingsLanguage=()=>{
  const zh=sessionLanguage()==='zh',image=settings.querySelector('[data-session-setting="View image"]'),help=settings.querySelector('[data-session-setting="Chat help"]');
  if(image)image.textContent=zh?(isCharacter?'查看立绘':'查看封面'):(isCharacter?'View portrait':'View cover');
  if(help)help.textContent=zh?'聊天操作说明':'Chat controls';
  const back=q('[data-session-back]');if(back){const label=id===julian.id?(zh?'返回七夜剧场':'Back to Seven Nights'):interludeReturn?(zh?'返回分镜':'Back to the panels'):mine?(back.getAttribute('href')==='/my-title'?(zh?'返回我的作品':'Back to My Titles'):(zh?'返回社区':'Back to Community')):(isCharacter?(zh?'返回角色档案':'Back to character profile'):(zh?'返回作品详情':'Back to story details'));back.setAttribute('aria-label',label);back.title=label;}
  settings.querySelectorAll('[data-session-memory-label]').forEach(node=>{node.textContent=zh?'补充记忆':'Additional memories';});
  settings.querySelector('[data-session-close]')?.setAttribute('aria-label',local('Close session settings'));
  root.querySelectorAll('[data-film-line]').forEach((chip,i)=>chip.textContent=title.starters[i][zh?'zh':'en']);
  document.querySelectorAll('[data-chat-help]').forEach(paintChatHelp);
 };
 const syncSessionLanguage=()=>{const name=sessionLanguage()==='zh'?title.title_zh||title.title:title.title;root.querySelectorAll('[data-session-title]').forEach(el=>el.textContent=name);const person=root.querySelector('[data-onboard]');if(person){const label=[...person.childNodes].find(n=>n.nodeType===3);if(label)label.nodeValue=profile.name||local('You');if(person.firstElementChild)person.firstElementChild.textContent=(profile.name||local('You')).slice(0,1).toUpperCase();}input.setAttribute('data-placeholder',local('Send a message'));input.setAttribute('aria-label',local('Send a message'));if(input.tagName==='TEXTAREA')input.placeholder=local('Send a message');if(transport==='demo'){const model=q('[data-control=model]');const label=model?.querySelector('span span')||model?.querySelector('span');if(label){label.textContent=sessionLanguage()==='zh'?'演示对话':'Demo replies';label.dataset.noI18n='';}}paintComposerDraft();paintAIAvailability();paintSettingsLanguage();document.title=name+' · StoryDate';};
 settings.querySelectorAll('a[href="/credit"]').forEach(a=>{for(const el of a.querySelectorAll('*'))if(!el.children.length&&el.textContent.trim()==='Demo')el.textContent='View Credits';});
 // Rebind captured shell artwork to the selected title instead of Lumencia's cover.
 const cover=title.image?.startsWith('assets/')?'/'+title.image:title.image;
 if(cover){const headerImage=titleLink?.querySelector('img');if(headerImage){headerImage.src=cover;headerImage.alt=title.title;}const settingsImage=settings.querySelector('img');if(settingsImage){settingsImage.src=cover;settingsImage.alt=title.title;}}
 if(id!=='69f414d90abbab6f6a2c8131'&&!isCharacter){const gallery=settings.querySelector('[role=region]');if(gallery)gallery.replaceChildren();}

 let characterControls;const save=()=>{try{if(characterState){if(!characterState.manager.saveMessages(messages))return;}else h.save(key,messages);h.save('ooc-history',[id,...h.read('ooc-history',[]).filter(previous=>previous!==id)]);if(!disposed)renderHistory();}catch{if(!disposed)modal(document.documentElement.lang?.startsWith('zh')?'暂时无法保存':'Unable to save',document.documentElement.lang?.startsWith('zh')?'<p>对话暂未保存。请先复制重要内容，再重试或释放浏览器存储空间。</p>':'<p>Your conversation could not be saved. Copy any important lines, then retry or free some browser storage.</p>');}};const value=()=>input.tagName==='TEXTAREA'?input.value:input.innerText;const setValue=v=>{if(input.tagName==='TEXTAREA')input.value=v;else input.textContent=v;updateSend();};
 // Unsent character text stays in the account-scoped device cache, separated
 // by conversation branch. It never enters messages, memory or cloud sync.
 // A returning banner reply joins this same draft flow instead of disappearing.
 const draftBranch=characterState?.state.active||(id===julian.id&&title.number>1?title.sceneId:'main'),draftKey='ooc-composer-draft-'+id+'-'+draftBranch,draftOwner=h.account?.user?.uid||null;
 const entryQuery=new URLSearchParams(globalThis.location?.search||''),draftEntry=isCharacter&&entryQuery.has('draft');
 let awaitingDraftSend=draftEntry||id===julian.id;
 let deviceDraft=null,bannerAlternative='',draftSaveFailed=false,lastDraftMarkup='';
 const draftScopeCurrent=()=>!disposed&&(!h.account||!h.account.busy&&h.account.restored&&(h.account.user?.uid||null)===draftOwner)&&(!characterState||characterState.manager.isCurrent());
 function saveComposerDraft(text){
  if(!text.trim())text='';
  if(!draftScopeCurrent())return;
  const next=text||bannerAlternative?{version:1,branch:draftBranch,text,...(bannerAlternative?{incoming:bannerAlternative}:{})}:null;
  if(JSON.stringify(next)===JSON.stringify(deviceDraft)&&!draftSaveFailed)return;
  deviceDraft=next;
  try{h.save(draftKey,deviceDraft);draftSaveFailed=false;}catch{draftSaveFailed=true;}
 }
 if (id === julian.id) {
  const lines = document.createElement('div');
  lines.className = 'sn-draft-lines';
  lines.dataset.noI18n = '';
  for (const line of title.starters) {
   const chip = document.createElement('button');
   chip.type = 'button';
   chip.dataset.filmLine = '';
   chip.textContent = line[sessionLanguage()];
   chip.onclick = () => {
    if (!draftScopeCurrent() || state !== 'ready') return;
    bannerAlternative = '';
    setValue(chip.textContent);
    saveComposerDraft(value());
    if (draftEntry && !draftSaveFailed) consumeEntryReply();
    paintComposerDraft();
    input.focus();
   };
   lines.append(chip);
  }
  input.before(lines);
 }
 function paintComposerDraft(){
  let note=root.querySelector('[data-banner-reply]');
  if(!deviceDraft&&!bannerAlternative){note?.remove();lastDraftMarkup='';return;}
  if(!note){note=document.createElement('div');note.dataset.bannerReply='';note.dataset.noI18n='';note.setAttribute('role','status');note.style.cssText='margin:10px 12px 0;font-size:12px;line-height:1.6;color:#bcbcbc';input.before(note);}
  const zh=sessionLanguage()==='zh';
  const markup=`<p style="margin:0">${onSet?(zh?'草稿已备好 · 可直接编辑或发送':'Ready to send · Edit or tap →'):(zh?'本设备草稿 · 尚未发送':'Device draft · not sent')}</p>${bannerAlternative?`<p style="margin:6px 0">${zh?'另有一句尚未选择的回复：':'There is also a new reply to choose:'}</p><blockquote tabindex="0" aria-label="${zh?'待选择的回复':'Reply to choose'}" style="margin:6px 0;white-space:pre-wrap">${safe(bannerAlternative)}</blockquote><div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" data-banner-use style="min-height:44px;padding:8px 12px;border:1px solid #484848;border-radius:8px;background:transparent;color:inherit">${zh?'改用这句回复':'Use the new reply'}</button><button type="button" data-banner-keep style="min-height:44px;padding:8px 12px;border:1px solid #484848;border-radius:8px;background:transparent;color:inherit">${zh?'保留原草稿':'Keep my draft'}</button></div>`:''}${draftSaveFailed?`<p style="margin:6px 0">${zh?'此设备暂时无法保存草稿，请先复制这段文字。':'This device could not save the draft. Copy the text before leaving.'}</p>`:''}`;
  if(markup===lastDraftMarkup)return;note.innerHTML=markup;lastDraftMarkup=markup;
  note.querySelector('[data-banner-use]')?.addEventListener('click',()=>{if(!draftScopeCurrent())return;const text=bannerAlternative;bannerAlternative='';setValue(text);saveComposerDraft(text);if(draftEntry&&!draftSaveFailed)consumeEntryReply();paintComposerDraft();input.focus();});
  note.querySelector('[data-banner-keep]')?.addEventListener('click',()=>{if(!draftScopeCurrent())return;bannerAlternative='';saveComposerDraft(value());if(draftEntry&&!draftSaveFailed)consumeEntryReply();paintComposerDraft();input.focus();});
 }
 function restoreComposerDraft(opening,{prefillOnly=false}={}){
  if(!isCharacter)return !messages.some(m=>m.role==='user');
  if(!draftScopeCurrent())return false;
  const stored=h.read(draftKey,null);
  if(stored?.version===1&&stored.branch===draftBranch&&typeof stored.text==='string'&&(stored.text.trim()||typeof stored.incoming==='string'&&stored.incoming.trim())){
   bannerAlternative=typeof stored.incoming==='string'?stored.incoming:'';
   deviceDraft={version:1,branch:draftBranch,text:stored.text,...(bannerAlternative?{incoming:bannerAlternative}:{})};setValue(stored.text);
  }
  if(opening){
   const hasConversation=messages.some(m=>m.role==='user');
   if(!prefillOnly&&!hasConversation&&!value().trim()&&!aiUnavailable()){setValue(opening);saveComposerDraft(opening);paintComposerDraft();return true;}
   if(value().trim()&&value()!==opening){bannerAlternative=opening;saveComposerDraft(value());}
   else{setValue(opening);saveComposerDraft(opening);}
  }
  paintComposerDraft();if(deviceDraft||bannerAlternative)input.focus();return false;
 }
 const aiUnavailable=()=>transport==='ai'&&aiConfiguration?.configured===false;
 let checkingAI=false,configurationRetryFailed=false,lastAvailabilityMarkup='';
 function paintAIAvailability(){
  let notice=root.querySelector('[data-ai-availability]');
  if(!aiUnavailable()){notice?.remove();lastAvailabilityMarkup='';return;}
  if(!notice){notice=document.createElement('div');notice.dataset.aiAvailability='';notice.dataset.noI18n='';notice.setAttribute('role','status');notice.style.cssText='margin:10px 12px 0;font-size:12px;line-height:1.6;color:#bcbcbc';input.before(notice);}
  const zh=sessionLanguage()==='zh';
  const markup=`<p style="margin:0">${zh?'角色回复服务暂未开放。可以先写下草稿；服务恢复后再发送。':'Character replies are not available yet. You can keep a draft and send it when the service is available.'}</p>${configurationRetryFailed?`<p style="margin:6px 0">${zh?'暂时无法检查服务状态，草稿仍保留。':'Could not check the service. Your draft is still kept.'}</p>`:''}<button type="button" data-check-ai ${checkingAI?'disabled':''} style="min-height:44px;padding:8px 0;border:0;background:transparent;color:#fafafa;text-decoration:underline">${checkingAI?(zh?'正在检查…':'Checking…'):(zh?'重新检查服务状态':'Check service again')}</button>`;
  if(markup===lastAvailabilityMarkup)return;notice.innerHTML=markup;lastAvailabilityMarkup=markup;
  notice.querySelector('[data-check-ai]')?.addEventListener('click',async()=>{
   if(checkingAI||!draftScopeCurrent())return;
   checkingAI=true;configurationRetryFailed=false;paintAIAvailability();
   try{
    const next=await loadPublicConfig((path,options)=>fetch(path,{...options,cache:'no-store'}));
    if(!draftScopeCurrent())return;
    if(!next||typeof next.configured!=='boolean')throw Error('Unavailable public config');
    aiConfiguration=next;show('/play/'+id,h);
   }catch{if(draftScopeCurrent()){checkingAI=false;configurationRetryFailed=true;paintAIAvailability();}}
  });
 }
 const updateSend=()=>{characterControls?.update();if(billingOn){let label=root.querySelector('[data-credit-price]');if(!label){label=document.createElement('p');label.dataset.creditPrice='';label.dataset.noI18n='';label.style.cssText='font-size:12px;color:#bcb3cd;margin:6px 0';input.parentElement.append(label);}const points=aiConfiguration.billing.prices[String(h.read('ooc-output-length','standard')).toLowerCase()]||1;label.hidden=transport==='demo';label.textContent=sceneLang==='zh'?`每次回复 ${points} 点 · 生成失败不扣点 · 重新生成同价`:`${points} credit(s) per reply · failed generations are not charged · regenerations cost the same`;}send.setAttribute('aria-label',local(state==='streaming'?'Stop generating':state==='submitted'?'Cancel request':value().trim()?'Send message':xichuanChat?(sessionLanguage()==='zh'?'继续聊天':'Continue chat'):'Continue story'));send.disabled=state==='ready'&&aiUnavailable();paintAIAvailability();send.innerHTML=state==='submitted'?'<span class="session-spinner"></span>':state==='streaming'?'<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>':value().trim()?arrow:triangle;};
 const hour=new Date().getHours(),timeOfDay=hour>=5&&hour<12?'morning':hour>=12&&hour<18?'afternoon':'evening';const customScenario=custom?{opening:[custom.prologue,custom.opening].filter(Boolean).join('\n\n')||undefined}:isCharacter?undefined:storyPreviews.stories[id];const localCharacterIntro=()=>sessionLanguage()==='zh'?(title.description_zh||title.description||title.title_zh||title.title):(title.description||title.title);const campaignCharacter=characterState?.profile;root.classList.toggle('character-reading',isCharacter);root.classList.toggle('sg-character-session',Boolean(campaignCharacter));let sceneLang=document.documentElement.lang?.startsWith('zh')?'zh':'en';const storyOpening=()=>sceneLang==='zh'&&!isCharacter&&title?.description_zh&&customScenario?.opening===title.description?title.description_zh:customScenario?.opening;let intro=campaignCharacter?.opening[sceneLang]||customScenario?.openingByTime?.[timeOfDay]||storyOpening()||(liveCharacter?localCharacterIntro(): isCharacter?`*A new neighbour knocks at your door.*\n\n*Ashley smiles.* “Hi, you must be ${name}. I just moved in next door. It's nice to meet you!”`:`> Character Preview\n\n*The academy gates open. A new adventure awaits ${name}.*`);

 let suggestions=[];
 const returnedFromStory=xichuanChat&&entryQuery.get('from')==='xichuan'&&consumeStoryReturn(location,window.history);
 if(returnedFromStory)entryQuery.delete('from');
 let showReturnLine=returnedFromStory&&messages.length>0;
 const readStoryProgress=()=>readXichuanProgress(h.read,h.account);
 const xichuanContext=()=>xichuanChat?{xichuan:storyContext(readStoryProgress(),id)}:{};
 let storyBar;
 const syncStoryBar=()=>{
  const raw=readStoryProgress();
  if(!storyBar){
   scroll.insertAdjacentHTML('beforebegin','<aside class="xc-chat-bridge" data-no-i18n></aside>');
   storyBar=scroll.previousElementSibling;
  }
  storyBar.setAttribute('aria-label',sceneLang==='zh'?'故事与对话':'Story and conversation');
  storyBar.querySelector('.xc-chat-story')?.remove();
  storyBar.insertAdjacentHTML('afterbegin',xichuanStoryLink(raw,sceneLang,id));
  if(latestSave(raw)||returnedFromStory)intro=storyReturnIntro(id,sceneLang);
 };
 if(xichuanChat)syncStoryBar();
 if(returnedFromStory)track('xichuan_chat_returned',{character:id});
 root.addEventListener('click',event=>{if(xichuanChat&&event.target.closest('[data-xichuan-entry]'))track('xichuan_story_invitation_opened',{character:id});});
 const sceneContext=id===julian.id?{scene:title.sceneId,impressions:impressions(h.read(seasonKey,[]),title.number)}:campaignCharacter?.selectedScene?{characterScene:campaignCharacter.selectedScene}:{};const continuity=()=>characterState?[characterState.manager.memory(messages),String(h.read('ooc-Memories-'+id,'')||'').slice(0,350)].filter(Boolean).join('\n').slice(0,2000):isCharacter?String(h.read('ooc-Memories-'+id,'')||'').slice(0,350):h.read('ooc-Memories-'+id,'');
 const suggestionLoader=new SuggestionLoader((context,signal)=>httpStream(context.messages,signal,{task:'suggestions',titleId:id,...sceneContext,...xichuanContext(),memory:continuity(),...(custom?{custom}:{}),timeOfDay,language:context.language,opening:context.opening,previousSuggestions:context.previousSuggestions}));
 async function refreshSuggestions(){
  suggestionLoader.cancel();
  if(!suggestionsVisible||disposed||state!=='ready'||awaitingDraftSend)return;
  if(deviceDraft||bannerAlternative){suggestions=[];return;}
  if(xichuanChat&&transport==='demo'){suggestions=xichuanDemoStarters(readStoryProgress(),sceneLang,id);renderMessages();return;}
  const answer=messages.at(-1),language=sceneLang;
  if(!answer){
   if(campaignCharacter&&!(xichuanChat&&latestSave(readStoryProgress()))){suggestions=[...campaignCharacter.starters[sceneLang]];renderMessages();return;}
   suggestions=[];if(transport!=='ai'||!aiConfiguration?.configured||billingOn)return;
   const first=await suggestionLoader.load({messages:[{role:'assistant',content:intro.slice(0,3500)}],language,opening:true,previousSuggestions:[]});
   if(!first?.length||disposed||!suggestionsVisible||state!=='ready'||messages.length||isCharacter&&language!==sceneLang)return;
   suggestions=first;renderMessages();return;
  }
  suggestions=[];
  if(answer.role!=='assistant'||answer.streaming||answer.failed||answer.stopped||!answer.text?.trim())return;
  const currentStoryStamp=xichuanChat?JSON.stringify(xichuanContext()):null;
  if(xichuanChat&&answer.xichuanStamp!==currentStoryStamp){delete answer.suggestions;delete answer.suggestionsByLanguage;delete answer.suggestionsLanguage;}
  const cachedValue=isCharacter?(answer.suggestionsByLanguage?.[language]||(answer.suggestionsLanguage===language?answer.suggestions:undefined)):answer.suggestions;
  const cached=parseSuggestions(JSON.stringify(cachedValue));
  if(cached.length){suggestions=cached;renderMessages();return;}
  if(transport!=='ai'||!aiConfiguration?.configured||billingOn)return;
  const previousAnswer=messages.slice(0,-1).findLast(message=>message.suggestions?.length&&
   (!isCharacter||message.suggestionsLanguage===language)&&(!xichuanChat||message.xichuanStamp===currentStoryStamp));
  const next=await suggestionLoader.load({messages:conversationForRequest(messages),language,previousSuggestions:previousAnswer?.suggestions||[]});
  if(!next?.length||disposed||!suggestionsVisible||state!=='ready'||messages.at(-1)!==answer||isCharacter&&language!==sceneLang)return;
  answer.suggestions=next;if(xichuanChat)answer.xichuanStamp=currentStoryStamp;
  if(isCharacter){answer.suggestionsLanguage=language;answer.suggestionsByLanguage={...answer.suggestionsByLanguage,[language]:next};}
  suggestions=next;save();renderMessages();
 }

 let openMessage = null;
 function tapMessage(event) {
  // A mouse uses hover and a keyboard uses focus, even on hybrid devices.
  const touch = event.pointerType ? ['touch', 'pen'].includes(event.pointerType) : event.detail > 0 && matchMedia('(hover: none)').matches;
  if (!touch || event.target.closest('.character-turn-actions')) return;
  const previous = body.querySelector('[data-message-actions-open]');
  const article = event.target.closest('#session-messages article[data-index]');
  const next = article !== previous && article?.querySelector('.character-turn-actions') && !event.target.closest('a, button') ? article : null;
  previous?.removeAttribute('data-message-actions-open');
  if (document.activeElement?.closest('.character-turn-actions')) document.activeElement.blur();
  openMessage = next ? messages[Number(next.dataset.index)] : null;
  next?.setAttribute('data-message-actions-open', '');
 }
 if (isCharacter) document.addEventListener('click', tapMessage, true);
 function turnMarkup(message, index) {
  const user = message.role === 'user';
  const demo = message.transport === 'demo' ? `<small class="session-demo" data-no-i18n>${sceneLang === 'zh' ? '演示回复' : 'Demo reply'}</small>` : '';
  const stopped = message.stopped ? `<small class="session-demo">${local('Stopped')}</small>` : '';
  const badge = characterControls?.rememberedBadge(index) || '';
  const meta = isCharacter && (demo || stopped || badge) ? `<div class="character-turn-meta">${demo}${stopped}${badge}</div>` : demo;
  let content;
  if (message.streaming && !message.text) {
   const progress = xichuanChat && transport === 'demo'
    ? (sceneLang === 'zh' ? '正在准备演示回复，可随时取消。' : 'Preparing a demo reply. You can cancel at any time.')
    : local('Connecting to the model. You can cancel at any time.');
   content = `<p class="response-progress session-demo" role="status">${progress}</p>`;
  } else if (message.failed && !message.text) {
   content = `<p class="session-error">${safe(replyError({code:message.errorCode, message:message.error}))}</p>`;
  } else if (isCharacter) {
   content = user ? safe(message.text ?? '') : characterReadingHTML(narrative(balanceCharacterAction(message.text)), message.text);
  } else content = narrative(message.text);
  const replyTools = message.role === 'assistant' && !message.streaming ? `<div class="message-tools">
   <button type="button" aria-label="${local('Copy response')}" data-copy-message="${index}">${chatIcon('copy')}</button>
   <button type="button" aria-label="${local(message.failed ? 'Retry response' : 'Regenerate response')}" data-regenerate="${index}">${chatIcon('regenerate')}</button>
   <button type="button" aria-label="${local('Edit response')}" data-options="${index}">${chatIcon('edit')}</button>
  </div>` : '';
  const tools = replyTools + (characterControls?.tools(message, index) || '');
  const actions = isCharacter && tools ? `<div class="character-turn-actions" role="group" aria-label="${sceneLang === 'zh' ? '消息操作' : 'Message actions'}">${tools}</div>` : tools;
  return `<article class="session-message ${user ? 'user' : ''} ${message.streaming ? 'streaming' : ''}" data-index="${index}"${openMessage === message ? ' data-message-actions-open' : ''}>${meta}<div class="message-content">${content}</div>${actions}${isCharacter ? '' : stopped}</article>`;
 }
 const stageCard = id === julian.id ? title : isCharacter && FEATURED_CHARACTER_CARDS.find(card => card.chatId === id);
 const openingMarkup = () => {
  if (stageCard) {
   let opening = intro;
   if (xichuanChat && messages.length) opening = '';
   else if (xichuanChat && !returnedFromStory && !latestSave(readStoryProgress())) opening = campaignCharacter.opening[sceneLang];
   return characterIntroMarkup(campaignCharacter || title, stageCard, sceneLang, opening);
  }
  if (id === '69f414d90abbab6f6a2c8131' || id === '6a808dbe8cc39ab3d8abaf5e') return pages[isCharacter ? 'characterIntro' : 'storyIntro'].replaceAll('nezuko',safe(name));
  const preview = isCharacter ? `<img class="session-empty-preview" style="width:320px" src="${safe(title.image)}" alt="${safe(sessionLanguage()==='zh'?title.title_zh||title.title:title.title)}">` : '';
  return narrative(intro) + preview;
 };
 const renderMessages=()=>{
  // Replacing the stream must not drop a keyboard user back to the document.
  const focused = document.activeElement?.closest('.character-turn-actions button');
  const action = focused?.getAttributeNames().find(name => name.startsWith('data-'));
  characterControls?.update();const atBottom=follow;body.innerHTML=`<div class="session-message">${openingMarkup()}</div>`+messages.map(turnMarkup).join('');
  if(showReturnLine)body.insertAdjacentHTML('beforeend',`<div class="session-message" data-xichuan-return-intro>${narrative(storyReturnIntro(id,sceneLang))}</div>`);
  if(state==='ready'&&suggestionsVisible)body.insertAdjacentHTML('beforeend',`<div class="session-suggestions">${suggestions.map((s,i)=>`<div class="suggestion"><button type="button" class="suggestion-edit" aria-label="${local('Edit suggested response')}" data-edit="${i}">${chatIcon('edit')}</button><button type="button" class="suggestion-send" aria-label="${local('Send suggested response')}" data-suggest="${i}"><span class="suggestion-content">${markdown(s)}</span><span class="suggestion-arrow">${chatIcon('send')}</span></button></div>`).join('')}</div>`);characterControls?.update();if(isCharacter&&state==='ready'&&messages.at(-1)?.role==='user')body.insertAdjacentHTML('beforeend',`<div class="character-pending-reply" data-no-i18n><button type="button" data-character-resume>${document.documentElement.lang?.startsWith('zh')?'继续回复':'Continue the reply'}</button></div>`);if (action) body.querySelector(`[${action}="${Number(focused.getAttribute(action))}"]:not(:disabled)`)?.focus({preventScroll:true});
  if(atBottom)scroll.scrollTop=scroll.scrollHeight;paintJump();};
 async function generate(text,{regenerate=false,replaceIndex=null}={}){if(aiUnavailable()){if(isCharacter&&!regenerate&&typeof text==='string'&&text.trim()&&draftScopeCurrent()){if(value().trim()&&value()!==text){bannerAlternative=text;saveComposerDraft(value());}else{setValue(text);saveComposerDraft(text);}paintComposerDraft();input.focus();}paintAIAvailability();return;}if(state!=='ready'||disposed||typeof text!=='string'||!text.trim())return;awaitingDraftSend=false;const composerDraft=value();let payment=null;const retained=replaceIndex===null?messages:messages.slice(0,replaceIndex);const context={titleId:id,...sceneContext,...xichuanContext(),language:sceneLang,...(custom?{custom}:{}),timeOfDay,profile:{name,audience:profile.audience},userNote:h.read('ooc-User Note-'+id,''),memory:continuity(),outputLength:h.read('ooc-output-length','standard')};const requestMessages=conversationForRequest([...retained,...(!regenerate?[{role:'user',text}]:[])]);if(transport==='ai'&&billingOn){controller=new AbortController();state='submitted';updateSend();try{payment=await creditClient.prepare({...context,messages:requestMessages});if(disposed||controller.signal.aborted||!payment?.current()){state='ready';if(!disposed)updateSend();return;}}catch(e){state='ready';updateSend();modal('Response unavailable',`<p>${safe(replyError(e))}</p><a href="/credit">${sceneLang==='zh'?'查看积分与活动':'View credits and offers'}</a>`);return;}}showReturnLine=false;messages=retained;suggestionLoader.cancel();suggestions=[];if(!regenerate)messages.push({role:'user',text});if(isCharacter)save();const answer={role:'assistant',text:'',streaming:true,...(xichuanChat||transport==='demo'?{transport}:{})};messages.push(answer);controller=new AbortController();state='submitted';follow=true;if(value()===composerDraft&&(!deviceDraft||composerDraft.trim()===text.trim()))setValue('');if(deviceDraft&&deviceDraft.text.trim()===text.trim()){saveComposerDraft('');paintComposerDraft();}renderMessages();updateSend();const reply=xichuanChat?xichuanDemoReply({id,raw:readStoryProgress(),pins:characterState?.manager.pins(messages)||[],language:sceneLang}):sceneLang==='zh'?'*（演示模式：这是一段模拟回复，和这本书的剧情无关。点上方的「切换模式」改用 AI，角色会按这本书接着回应你。）*':isCharacter?`*Ashley turns back with a warm smile.*\n\n“There's a lovely café just around the corner. The coffee is good, and it's quiet enough to read. I can show you the way, ${name}.”\n\n*She gestures toward the tree-lined street, waiting for your reply.*`:`> D0 | Wednesday | 10:00 | Lumencia Academy - Grand Hall\n\n*Sunlight spills across the marble floor. A student carrying a stack of books pauses beside ${name}.*\n\n💬 Sia | “The library is past the fountain, then the first door on your left. Are you here to study, or would you like a tour?”\n\n*The courtyard bell rings as students pass through the archway.*\n\n\`\`\`info\nTier: Beginner | Affiliation: Lumencia Academy\nStatus: Normal 🟢\nInventory: Academy guide\nRelationships: Sia [Friendly]\n\`\`\``;
  if(id===julian.id && interludeReturn && !regenerate && replaceIndex===null){
   const turn=(globalThis.history.state.sevenNightsTurn || 0)+1;
   globalThis.history.replaceState({...globalThis.history.state,sevenNightsTurn:turn},'');
   track('living_manga_chat_turn',{episode_id:'seven-nights-ep'+title.number,character_id:id,turn_index:turn});
  }
  const attempt=chatAttempt(id,transport);track('chat_message_sent',{title_id:id,transport});try{const source=transport==='demo'?demoStream(reply,controller.signal):httpStream(conversationForRequest(messages.filter(m=>m!==answer)),controller.signal,context,status=>{if(disposed)return;const progress=body.querySelector('.response-progress');if(progress){const label=({connecting:local('Connecting to the model'), 'waiting-model':local('Waiting for the reply'),thinking:local('Preparing the reply')})[status.phase];progress.textContent=sessionLanguage()==='zh'?label+'（'+status.elapsedSeconds+' 秒），可随时取消。':label+' ('+status.elapsedSeconds+' seconds). You can cancel at any time.';}},payment);await typeStream(source,{signal:controller.signal,onText:t=>{if(disposed)return;attempt.receivedText();answer.text=t;const el=body.querySelector(`[data-index="${messages.length-1}"] .message-content`);if(el)el.innerHTML=isCharacter?characterReadingHTML(narrative(balanceCharacterAction(t)),t):narrative(t);if(follow)scroll.scrollTop=scroll.scrollHeight;},onState:s=>{if(disposed)return;state=s;updateSend();},revealOnStop:()=>Boolean(payment?.settled),step:matchMedia('(prefers-reduced-motion: reduce)').matches?24:3});answer.stopped=controller.signal.aborted&&!payment?.settled;}catch(e){if(!disposed){answer.failed=true;answer.errorCode=e.code||null;answer.error=replyError(e);answer.text=answer.text||'';modal('Response unavailable',`<p>${safe(replyError(e))}</p>${e.code?`<p class="session-demo">${safe(e.code)}${e.requestId?' · '+safe(e.requestId):''}</p>`:''}<p>${local('Your message is saved. Retry the reply without sending it again.')}</p>`);}}finally{if(!disposed)attempt.finish(answer.failed?'failed':controller.signal.aborted?'cancelled':answer.text.trim()?'completed':'failed',answer.errorCode);answer.streaming=false;save();if(!disposed){state='ready';renderMessages();updateSend();void refreshSuggestions();}}}
 if(transport==='ai'){const model=q('[data-control=model]');const label=model.querySelector('span span')||model.querySelector('span');label.textContent=aiConfiguration?.configured?aiConfiguration.model.replace(/^gemini-/,'Gemini ').replace(/-flash$/,' Flash'):'AI';model.title='Model comes from the server configuration';}root.querySelectorAll('a[href]').forEach(a=>{const before=a.getAttribute('href');const after=canonicalCharacterUrl(before);if(after!==before)a.setAttribute('href',after);});const sidebar=root.querySelector('[data-shrink]');sidebar.insertAdjacentHTML('beforeend',`<button class="session-profile" data-onboard><span>${safe(name.slice(0,1).toUpperCase())}</span>${safe(name)}</button>`);const history=sidebar.querySelector('ol');
 let historyKind=isCharacter?'character':'story';
 const historyTabs=[...sidebar.querySelectorAll('button')].filter(button=>['Story','Character'].includes(button.textContent.trim()));
 for(const button of historyTabs){button.dataset.historyMode=button.textContent.trim().toLowerCase();button.classList.add('session-history-tab');button.onclick=()=>renderHistory(button.dataset.historyMode);}
 const savedTitles=h.read('ooc-custom',[]).filter(item=>item?.status==='published'&&item.publishedId).map(item=>({...item,id:item.publishedId}));
 const visitedTitles=resolveLibraryRecords(historyIds(h.read,h.data),h.data,h.read('ooc-custom',[]),h.read(VISITED_TITLES_KEY,null));const historyTitles=new Map([...visitedTitles,...savedTitles,title].map(item=>[item.id,item]));
 const renderHistory=(kind=historyKind)=>{
  historyKind=kind;
  if(!history)return;
  const entries=[...new Set([id,...historyIds(h.read,h.data)])].map(storyId=>historyTitles.get(storyId)).filter(item=>item&&(item.type==='character'?'character':'story')===kind);
  history.innerHTML=entries.length?entries.slice(0,12).map(item=>{const last=lastSessionText(h.read('ooc-session-v2-'+item.id,null));return `<li class="session-history-item"><a data-no-i18n href="/play/${safe(item.id)}" ${item.id===id?'aria-current="page"':''}><img src="${safe(item.image?.startsWith('assets/')?'/'+item.image:item.image||'')}" alt=""><span><strong>${safe(sessionLanguage()==='zh'?item.title_zh||item.title:item.title)}</strong><small>${safe(last?.replace(/[*#>\n]/g,' ').slice(0,85)||local(kind==='character'?'Start chatting':'Start your story'))}</small></span></a></li>`;}).join(''):`<li class="session-history-empty">${local('Your recent sessions will appear here.')}</li>`;
  for(const button of historyTabs)button.setAttribute('aria-pressed',String(button.dataset.historyMode===kind));
 };renderHistory();
 sidebar.querySelectorAll('button').forEach(button=>{const label=button.textContent.trim();if(label==='Search')button.onclick=()=>h.navigate('/search');if(label==='Notifications')button.remove();});
  const toggleSidebar=()=>{const small=sidebar.dataset.shrink!=='true';sidebar.dataset.shrink=String(small);sidebar.nextElementSibling.style.marginLeft=matchMedia('(min-width:1024px)').matches?(small?'48px':'256px'):'';};if(sidebar){const toggle=sidebar.querySelector('button');toggle.onclick=toggleSidebar;toggle.setAttribute('aria-label','Toggle Side Navigation');sidebar.querySelectorAll('button').forEach(button=>{if(button!==toggle&&!button.textContent.trim()&&!button.getAttribute('aria-label'))button.remove();});}
 if(onSet && matchMedia('(min-width:1024px)').matches && sidebar.dataset.shrink !== 'true') toggleSidebar();
 const settingsToggle=q('[data-control=settings]');settingsToggle?.querySelectorAll('.bg-destructive').forEach(badge=>badge.remove());
 const showSettings=()=>{const open=settings.classList.toggle('session-open');settings.inert=!open;settingsToggle?.setAttribute('aria-expanded',String(open));if(open&&matchMedia('(max-width:767px)').matches)settings.querySelector('button')?.focus();};settings.inert=true;settingsToggle?.setAttribute('aria-controls','session-settings');settingsToggle?.setAttribute('aria-expanded','false');
 const closeSettings=document.createElement('button');closeSettings.type='button';closeSettings.className='session-settings-close';closeSettings.dataset.sessionClose='';closeSettings.textContent='×';closeSettings.style.cssText='min-width:44px;min-height:44px;flex:none';(settingsTitle?.parentElement||settings).append(closeSettings);closeSettings.setAttribute('aria-label',local('Close session settings'));closeSettings.onclick=()=>{if(settings.classList.contains('session-open'))showSettings();settingsToggle?.focus();};
 const suggestButton=q('[data-control=suggest]');suggestButton?.setAttribute('aria-pressed',String(suggestionsVisible));
 const toggleSuggestions=()=>{awaitingDraftSend=false;suggestionsVisible=!suggestionsVisible;h.save('ooc-suggestions-visible',suggestionsVisible);suggestButton?.setAttribute('aria-pressed',String(suggestionsVisible));if(!suggestionsVisible)suggestionLoader.cancel();renderMessages();if(suggestionsVisible)void refreshSuggestions().then(()=>{if(!disposed&&suggestionsVisible)renderMessages();});};
 const flushCharacterDraft=()=>{if(!isCharacter||!messages.at(-1)?.streaming)return;controller?.abort();const answer=messages.at(-1);answer.streaming=false;answer.stopped=true;if(!answer.text?.trim())messages.pop();const previous=disposed;disposed=true;try{save();}finally{disposed=previous;}};globalThis.addEventListener?.('pagehide',flushCharacterDraft);
 const stop=()=>controller?.abort();send.onclick=()=>state==='streaming'||state==='submitted'?stop():generate(value().trim()||local('Continue the scene.'));input.oninput=()=>{if(isCharacter&&draftScopeCurrent()){saveComposerDraft(value());paintComposerDraft();}if(input.tagName==='TEXTAREA'){input.style.height='45px';input.style.height=Math.min(171,input.scrollHeight)+'px';}updateSend();};input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(state==='ready')send.click();}if(e.key==='Escape')input.blur();};scroll.onscroll=()=>{follow=scroll.scrollHeight-scroll.clientHeight-scroll.scrollTop<80;paintJump();};
 const showNote=label=>{
  const noteKey='ooc-'+label+'-'+id,memories=isCharacter&&label==='Memories',zh=sessionLanguage()==='zh',limit=memories?350:4000;
  const title=memories?(zh?'补充记忆与偏好':'Additional memories and preferences'):label;
  const hint=memories?((zh?'最多350个字符，用来补充偏好和背景。':'Up to 350 characters for preferences and context.')+(characterState?(zh?'要保留对话原话，请在消息旁点“记住”。':' Use Remember beside a message to keep its original words.') : '')):(zh?'这些说明会作为这段互动的参考。':'These notes provide context for this conversation.');
  const scope=h.account?.user?(zh?'保存在当前账号。':'Saved for this account.'):(zh?'保存在本设备。':'Saved on this device.');
  const d=modal(title,`<textarea aria-label="${safe(title)}" rows="8" maxlength="${limit}">${safe(String(h.read(noteKey,'')||''))}</textarea><p class="session-demo">${safe(hint+' '+scope)}</p><p class="session-demo" data-note-limit role="status"></p><button class="save">${local('Save')}</button>`,dialog=>{const text=dialog.querySelector('textarea').value;if(text.length<=limit)h.save(noteKey,text);});
  const field=d.querySelector('textarea'),button=d.querySelector('.save'),status=d.querySelector('[data-note-limit]');
  const check=()=>{const tooLong=field.value.length>limit;button.disabled=tooLong;status.textContent=tooLong?(zh?'已有说明超过上限，原文完整保留。请精简后再保存。':'Your existing note is kept in full. Shorten it to the limit before saving.'):field.value.length+' / '+limit;};
  field.addEventListener('input',check);check();
 };
 function openMode(){
  if(!xichuanChat&&transport==='ai'){modal('AI model',`<p>${safe(aiConfiguration?.model||'Not configured')}</p><p>The same role and style prompts apply when the server model changes.</p>`);return;}
  const zh=sessionLanguage()==='zh',allowDemo=xichuanChat||!(aiConfiguration?.configured||liveCharacter);
  modal(zh?'回复模式':'Response mode',`<p>${zh?'AI 模式使用服务器配置，可能消耗积分；演示回复不调用 AI。':'AI mode uses the configured server and may use credits. Demo replies make no AI calls.'}</p><select aria-label="Response mode">${allowDemo?`<option value="demo" ${transport==='demo'?'selected':''}>${zh?'演示回复（不调用 AI）':'Demo replies (no AI calls)'}</option>`:''}<option value="ai" ${transport==='ai'?'selected':''} ${aiConfiguration?.configured?'':'disabled'}>${zh?(aiConfiguration?.configured?'AI（已配置）':'AI（尚未配置）'):(aiConfiguration?.configured?'AI (live streaming)':'AI (not configured)')}</option></select><button class="save">${local('Save')}</button>`,dialog=>{transport=dialog.querySelector('select').value;h.save(modeKey,transport);show('/play/'+id,h);});
 }
 const shortcuts=()=>modal(sessionLanguage()==='zh'?'快捷键':'Keyboard shortcuts','<div class="shortcut-grid">'+[['Panels',[['Toggle Side Navigation','Ctrl+Shift+S'],['Toggle Session Settings','Ctrl+0'],['Toggle User Notes','Ctrl+I'],['Toggle Memories','Ctrl+Shift+U']]],['Input Field',[['Unfocus Input Field','Esc']]],['Autosuggestion',[['Show Autosuggestion','Ctrl+/'],['Select Suggested Response','Ctrl+1~3']]],['Play Actions',[['Regenerate','Ctrl+Alt+R']]]].map(([group,rows])=>`<section><b>${safe(local(group))}</b>${rows.map(([a,b])=>`<div class="shortcut-row"><span>${safe(local(a))}</span><kbd>${b}</kbd></div>`).join('')}</section>`).join('')+'</div>');
 root.onclick=e=>{if(characterControls?.handle(e))return;const b=e.target.closest('button');if(!b)return;const d=b.dataset;if(b.hasAttribute('data-character-resume')){regenerate(messages.length);return;}if(b.querySelector('img')&&b.closest('#session-messages')&&!b.dataset.control){const image=b.querySelector('img');modal('Image preview',`<img class="session-image-preview" src="${safe(image.currentSrc||image.src)}" alt="${safe(image.alt||'Character image')}">`);return;}if('copyCode'in d||d.copyMessage!==undefined){const text='copyCode'in d?b.closest('.session-codeblock').querySelector('code').textContent:messages[Number(d.copyMessage)]?.text||'';navigator.clipboard.writeText(text).then(()=>{b.setAttribute('aria-label','Copied');b.classList.add('session-copied');},()=>modal('Copy text',`<textarea aria-label="Copy text" rows="8" readonly>${safe(text)}</textarea>`));return;}if(d.control==='settings')showSettings();if(d.control==='bottom'){follow=true;scroll.scrollTop=scroll.scrollHeight;paintJump();}if(d.control==='situation')modal('Add Situation','<textarea aria-label="Situation" rows="4" placeholder="Describe the situation"></textarea><button class="save">Add</button>',dialog=>{const t=dialog.querySelector('textarea').value.trim();if(t)generate(t);});if(d.control==='slash'){const pop=document.createElement('div');pop.className='session-popover';pop.innerHTML=['/continue','/situation','/regenerate'].map(t=>`<button>${t}</button>`).join('');root.append(pop);pop.onclick=event=>{const cmd=event.target.textContent;if(cmd==='/regenerate')regenerate();else if(cmd==='/continue')generate(local('Continue the scene.'));else setValue('*Describe the situation*');pop.remove();};}if(d.control==='suggest')toggleSuggestions();if(d.control==='model'){openMode();return;}
  if(d.edit!==undefined){setValue(suggestions[Number(d.edit)]);input.dispatchEvent(new input.ownerDocument.defaultView.Event('input',{bubbles:true}));input.focus();}if(d.suggest!==undefined)generate(suggestions[Number(d.suggest)]);if(d.regenerate!==undefined)regenerate(Number(d.regenerate));if(d.options!==undefined){const i=Number(d.options);modal('Message options',`<textarea aria-label="Edit message" rows="7">${safe(messages[i].text)}</textarea><button class="save">Save</button>`,dialog=>{messages[i].text=dialog.querySelector('textarea').value;for(const message of messages.slice(i)){delete message.suggestions;delete message.suggestionsByLanguage;delete message.suggestionsLanguage;}save();void refreshSuggestions();renderMessages();});}
  if('onboard'in d)h.navigate('/profile');
  if(b.getAttribute('aria-haspopup')==='menu'&&!b.dataset.options)modal('Message options','<p>The initial scene is read-only in this demo.</p>');const label=b.dataset.sessionSetting||b.textContent.trim();if(label==='User Note'||label==='Memories')showNote(label);if(label==='Keyboard Shortcuts')shortcuts();if(label==='Output Length'){const current=String(h.read('ooc-output-length','standard')).toLowerCase();modal(label,'<select aria-label="Output length">'+['standard','short','long'].map(v=>`<option value="${v}" ${v===current?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')+'</select><button class="save">Save</button>',dialog=>{h.save('ooc-output-length',dialog.querySelector('select').value);updateSend();});}if(label==='Chat help'){const dialog=modal(sessionLanguage()==='zh'?'聊天操作说明':'Chat controls','<div data-chat-help-content data-no-i18n></div>'+(authorGuide?`<section data-author-guide data-no-i18n><h3 data-author-guide-heading></h3><p style="white-space:pre-wrap">${safe(authorGuide)}</p></section>`:''));dialog.dataset.chatHelp='';if(xichuanChat)dialog.dataset.xichuanChat='';paintChatHelp(dialog);}if(label==='View image')modal(sessionLanguage()==='zh'?(isCharacter?'查看立绘':'查看封面'):(isCharacter?'View portrait':'View cover'),`<img style="max-height:65vh;max-width:100%;margin:auto" src="${safe(cover||'/assets/cover-0.webp')}" alt="${safe(sessionLanguage()==='zh'?title.title_zh||title.title:title.title)}">`);
 };
 function regenerate(index=messages.length-1){if(state!=='ready')return;const user=messages.slice(0,index).findLast(m=>m.role==='user');if(!user)return;generate(user.text,{regenerate:true,replaceIndex:index});}
 root.querySelectorAll('[data-control]').forEach(b=>{if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',({settings:'Session settings',model:'Response model',situation:'Add situation',slash:'Slash commands',suggest:'Suggested responses'})[b.dataset.control]||b.dataset.control);});
 const keydown=e=>{if(document.querySelector('.interaction-modal[open]'))return;if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='s'){e.preventDefault();toggleSidebar();}if(e.ctrlKey&&e.key==='0'){e.preventDefault();showSettings();}if(e.ctrlKey&&e.key.toLowerCase()==='i'){e.preventDefault();showNote('User Note');}if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='u'){e.preventDefault();showNote('Memories');}if(e.key==='Escape'&&settings.classList.contains('session-open')){e.preventDefault();showSettings();settingsToggle?.focus();}if(e.ctrlKey&&!e.shiftKey&&e.code==='Slash'){e.preventDefault();toggleSuggestions();}if(e.ctrlKey&&e.shiftKey&&e.code==='Slash'){e.preventDefault();shortcuts();}if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==='r'){e.preventDefault();regenerate();}if(suggestionsVisible&&e.ctrlKey&&['1','2','3'].includes(e.key)){e.preventDefault();generate(suggestions[Number(e.key)-1]);}};const onCharacterLang=event=>{if(disposed||!['zh','en'].includes(event.detail))return;sceneLang=event.detail;if(!isCharacter){const next=storyOpening();if(next&&!customScenario?.openingByTime?.[timeOfDay])intro=next;syncSessionLanguage();renderHistory();renderMessages();updateSend();return;}suggestionLoader.cancel();suggestions=[];intro=campaignCharacter?campaignCharacter.opening[sceneLang]:localCharacterIntro();if(xichuanChat)syncStoryBar();syncSessionLanguage();renderHistory();renderMessages();updateSend();void refreshSuggestions().then(()=>{if(!disposed)renderMessages();});};globalThis.addEventListener?.('sd-lang',onCharacterLang);document.addEventListener('keydown',keydown);cleanup=()=>{if(isCharacter&&draftScopeCurrent()){saveComposerDraft(value());}disposed=true;suggestionLoader.cancel();stop();flushCharacterDraft();globalThis.removeEventListener?.('pagehide',flushCharacterDraft);document.removeEventListener('keydown',keydown);document.removeEventListener('click',tapMessage,true);globalThis.removeEventListener?.('sd-lang',onCharacterLang);document.querySelectorAll('.interaction-modal').forEach(d=>d.remove());};
 root.querySelectorAll('a[href="/profile"]').forEach(a=>a.remove());
 // Profile replies are explicit drafts, unlike the legacy banner's first send.
 // Keep the URL while account restoration or a failed draft save prevents a
 // durable hand-off. Return contexts still strip reply text from their URLs.
 const opening=draftScopeCurrent()?String(entryQuery.get(draftEntry?'draft':'say')||'').trim().slice(0,300):'';
 const consumeEntryReply=()=>{if(!draftScopeCurrent())return;if(draftEntry)entryQuery.delete('draft');entryQuery.delete('say');try{globalThis.history?.replaceState(globalThis.history.state,'',(globalThis.location.pathname||'/play/'+id)+(entryQuery.size?'?'+entryQuery:'')+(globalThis.location.hash||''));}catch{}};
 if(!draftEntry&&entryQuery.has('say'))consumeEntryReply();
 if(characterState)characterControls=attachCharacterControls({root,body,storyBar,profile:campaignCharacter,manager:characterState.manager,getMessages:()=>messages,isReady:()=>state==='ready'&&!messages.some(m=>m.streaming),modal,render:()=>renderMessages(),onLocate:()=>{follow=false;},reopen:prefill=>{cleanup();session(id,h,remote);if(prefill){const input=root.querySelector('#session-input');if(input.tagName==='TEXTAREA')input.value=prefill;else input.textContent=prefill;input.dispatchEvent(new input.ownerDocument.defaultView.Event('input',{bubbles:true}));input.focus();}}});
 const sendOpening=restoreComposerDraft(opening,{prefillOnly:draftEntry});if(draftEntry&&!draftSaveFailed)consumeEntryReply();void refreshSuggestions();renderMessages();updateSend();syncSessionLanguage();if(opening&&sendOpening)void generate(opening);return true;
}
let remoteToken=0;
function remoteSession(id,h,pathname){
 const token=++remoteToken,controller=new AbortController(),owner=h.account?.user;
 const current=()=>token===remoteToken&&location.pathname===pathname&&h.account?.user===owner&&!h.account?.busy&&h.account?.restored!==false;
 cleanup=()=>{if(token===remoteToken)remoteToken++;controller.abort();};
 mountInteraction('<div class="shell-empty"><h1>Loading story…</h1></div>',h);
 fetch('/api/titles?id='+encodeURIComponent(id),{signal:controller.signal}).then(async r=>({ok:r.ok,data:await r.json().catch(()=>({}))})).then(({ok,data})=>{
  if(!current())return;
  if(!ok||data.title?.id!==id||!['story','character'].includes(data.title?.type)||typeof data.title?.title!=='string'||!data.title.title.trim()){
   mountInteraction(`<div class="shell-empty"><h1>Story unavailable</h1><p>${(data.error||'This title is not available.').replace(/[<>&]/g,'')}</p><a href="/community">Browse Community</a></div>`,h);return;
  }
  // A scoped, device-only label cache can make History useful. It contains no
  // author prompts and is never consulted to skip this access check.
  try{const snapshot=withVisitedTitle(h.read(VISITED_TITLES_KEY,null),data.title);if(snapshot)h.save(VISITED_TITLES_KEY,snapshot);}catch{}
  session(id,h,{...data.title,status:'published',publishedId:id});
 }).catch(()=>{
  if(current()&&!controller.signal.aborted)mountInteraction('<div class="shell-empty"><h1>Story unavailable</h1><p>Could not reach the server.</p><a href="/community">Browse Community</a></div>',h);
 });
 return true;
}
export function show(path,helpers){cleanup();cleanup=()=>{};if(path.startsWith('/onboarding'))return onboard(path,helpers);if(path==='/chat/sn-julian'||path.startsWith('/play/')||/^\/(story|character)\/[^/]+\/episode\//.test(path)){const id=path.split('/')[2];if(/^u-/.test(id)&&!helpers.read('ooc-custom',[]).some(d=>d&&d.status==='published'&&d.publishedId===id))return remoteSession(id,helpers,path);return session(id,helpers);}return false;}
