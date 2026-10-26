import {returnFromAnnouncement} from './back-navigation.js';
import {historyIds} from './history.js';
import {showCreator} from './social.js';
import {normalizeDraft} from './builder.js';
import announcements from './announcements.js';
import {mountShell} from './reference.js';
import {show as showLegal} from './legal.js';
import {symbol as icon} from './site-shell.js';
import {escapeHTML as safe} from './stream.js';
const footer=()=>`<footer class="shell-footer"><div><strong>Explore</strong><a href="/">Story</a><a href="/character">Character</a><a href="/credit">Credits</a><a href="/my-title">My titles</a><a href="/profile">Profile</a></div><div><strong>Support</strong><a href="/support">Contact &amp; Support</a><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a></div><p>© 2026 StoryDate</p></footer>`;
const header=(name,settings=false)=>`<header class="shell-page-header"><h1>${safe(name)}</h1>${settings?`<a href="/profile/setting" aria-label="Account settings">${icon('gear',24)}</a>`:''}</header>`;
const row=(label,href,symbol)=>`<a href="${href}">${icon(symbol)}<span>${safe(label)}</span>${icon('arrow',14)}</a>`;
function itemsMarkup(items,resume=false){return items.map(d=>`<article><a href="/${resume?'play':d.type==='character'?'character':'story'}/${safe(d.id)}"><img src="${safe(d.image.startsWith('assets/')?'/'+d.image:d.image)}" alt="${safe(d.title)}"><h2>${safe(d.title)}</h2><p>${safe(d.plays||'')} ${d.author?'· '+safe(d.author):''}</p></a></article>`).join('');}
function showCommunity(h){
 document.title='Community · StoryDate';
 let type='All';
 const root=mountShell(`<div class="library-content"><header class="library-header"><h1>Community</h1><button class="shell-white-button" data-community-create>Create Title</button></header><div class="library-tabs" role="tablist" aria-label="Title type">${['All','Story','Character'].map(t=>`<button role="tab" data-community-type="${t}" aria-selected="${t==='All'}">${t}</button>`).join('')}</div><p class="community-note">Titles written and published by Storylove creators.</p><div class="library-items" aria-live="polite"></div></div>${footer()}`,h,'library');
 const list=root.querySelector('.library-items');let token=0;
 async function load(){
  const mine=++token;list.innerHTML='<div class="shell-empty">Loading titles…</div>';
  try{
   const response=await fetch('/api/titles'+(type==='All'?'':`?type=${type.toLowerCase()}`)),data=await response.json().catch(()=>({}));
   if(mine!==token)return;if(!response.ok)throw Error(data.error||'Community titles are unavailable right now.');
   list.innerHTML=data.titles.length?data.titles.map(d=>`<article class="library-draft community-card"><a href="/play/${encodeURIComponent(d.id)}" aria-label="Play ${safe(d.title)}">${d.image?`<img src="${safe(d.image)}" alt="">`:`<div class="community-noimg">${icon(d.type==='character'?'person':'book',32)}</div>`}<h2>${safe(d.title)}</h2><p>${safe(d.description)}</p><small>${d.type==='character'?'Character':'Story'} · by ${safe(d.ownerName)}</small></a></article>`).join(''):`<div class="shell-empty">${icon('book',40)}No community titles yet. Be the first to publish one!<br><a href="/builder">Create Title</a></div>`;
  }catch(error){if(mine===token)list.innerHTML=`<div class="shell-empty">${safe(error.message)}</div>`;}
 }
 root.querySelectorAll('[data-community-type]').forEach(b=>b.onclick=()=>{type=b.dataset.communityType;root.querySelectorAll('[data-community-type]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));load();});
 root.querySelector('[data-community-create]').onclick=()=>h.navigate('/builder');load();
}
export function show(path,h){
 if(showLegal(path,h,mountShell))return true;
 if(path==='/community'){showCommunity(h);return true;}
 if(/^\/profile\/[^/]+$/.test(path)&&!path.startsWith('/profile/setting'))return showCreator(path,h,mountShell);
 if(!path.startsWith('/announcement')&&!['/my-title','/history','/liked','/profile','/profile/setting','/profile/setting/chat','/profile/setting/personalization','/profile/setting/block-management','/profile/setting/customer-support'].includes(path))return false;
 const profile=h.read('ooc-profile',{}),name=profile.name||h.account?.user?.displayName||'Your profile';
 if(path==='/announcement'||path.startsWith('/announcement/')){
  const item=announcements.items.find(item=>item.href===path);
  const badge=item=>`<span class="announcement-badge announcement-${safe(item.type.toLowerCase())}">${safe(item.type)}</span>`;
  const content=path==='/announcement'?announcements.items.map(item=>`<a class="announcement-row" href="${safe(item.href)}">${badge(item)}<p>${safe(item.title)}</p><time>${safe(item.date)}</time></a>`).join(''):item?`<article class="announcement-detail">${badge(item)}<h2>${safe(item.title)}</h2><time>${safe(item.date)}</time><p>${safe(item.body||'')}</p></article>`:'<p class="shell-empty">Announcement unavailable.</p>';
  const root=mountShell(`<header class="shell-page-header"><button aria-label="Back" data-announcement-back>${icon('arrow',16)}</button><h1>Notice</h1></header><div class="announcement-page">${content}</div>`,h,'announcement');
  root.querySelector('[data-announcement-back]').onclick=()=>returnFromAnnouncement(path,h);
 }else if(path==='/profile'){
  const root=mountShell(`${header('MY',true)}<div class="profile-content"><section class="profile-card"><a href="/profile/setting/personalization" class="profile-identity"><span class="shell-avatar">✱</span><div><strong>${safe(name)}</strong><small>Profile and preferences</small></div>${icon('arrow',14)}</a><div class="profile-credit">${icon('credit')}<span data-profile-balance>—</span><a href="/credit">Recharge</a></div></section><section class="profile-menu"><h2>Content Settings</h2>${row('Session Settings','/profile/setting/chat','chat')}${row('Personalization','/profile/setting/personalization','person')}${row('Favorites','/liked','heart')}${row('Manage Blocked Content','/profile/setting/block-management','shield')}</section><section class="profile-menu"><h2>Benefits</h2>${row('Claim Free Credits','/credit?creditTab=free','star')}${row('Credit History','/credit','credit')}</section><section class="profile-menu"><h2>Creator</h2>${row('My Titles','/my-title','book')}</section><section class="profile-menu"><h2>Inquiries and Notice</h2>${row('Notice','/announcement','bell')}${row('Customer Support','/profile/setting/customer-support','chat')}</section></div>${footer()}`,h,'profile');
  if(h.account?.user)h.account.api('wallet').then(wallet=>{const node=root.querySelector('[data-profile-balance]');if(node&&location.pathname==='/profile')node.textContent=Number(wallet.balance).toLocaleString();}).catch(()=>{});
 }else if(path.startsWith('/profile/setting')){
  let body='';const personal=path.endsWith('/personalization'),chat=path.endsWith('/chat'),blocked=path.endsWith('/block-management'),support=path.endsWith('/customer-support');
  const title=personal?'Personalization':chat?'Session Settings':blocked?'Manage Blocked Content':support?'Customer Support':'Settings';
  if(personal)body=`<form data-profile-form><label for="profile-name">Name</label><input id="profile-name" name="name" value="${safe(name)}" maxlength="24" required><label for="profile-gender">Content preference</label><select id="profile-gender" name="audience">${['Male','Female','All'].map(v=>`<option ${v===profile.audience?'selected':''}>${v}</option>`).join('')}</select><label for="profile-bio">About your character</label><textarea id="profile-bio" name="bio" rows="4" maxlength="2000">${safe(profile.bio||'')}</textarea><button class="shell-white-button" type="submit">Save changes</button><p data-save-status role="status"></p></form>`;
  else if(chat)body=`<div class="settings-row"><span>Output Length</span><select data-output-length aria-label="Output Length">${['short','standard','long'].map(v=>`<option value="${v}" ${v===String(h.read('ooc-output-length','standard'))?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')}</select></div><label class="settings-row"><span>Suggested responses</span><input type="checkbox" data-suggestion-preference ${h.read('ooc-suggestions-visible',true)?'checked':''}></label><p data-save-status role="status"></p>`;
  else if(blocked)body=`<div class="shell-empty">${icon('shield',36)}No blocked content.</div>`;
  else if(support)body=`<h2>Customer Support</h2><p>For account, payment or conversation issues, see <a href="/support">Contact &amp; Support</a>. Include the page and the time of the issue.</p><p><a href="/terms">Terms of Service</a> · <a href="/privacy">Privacy Policy</a></p><a href="/credit" class="shell-white-button">View Credits</a>`;
  else body=`<section class="profile-menu">${row('Personalization','/profile/setting/personalization','person')}${row('Session Settings','/profile/setting/chat','chat')}${row('Favorites','/liked','heart')}<button data-action="logout">${icon('person')}<span>Sign out</span>${icon('arrow',14)}</button></section>`;
  const root=mountShell(`${header(title)}<div class="profile-settings"><a class="shell-back" href="/profile">‹ Back to MY</a>${body}</div>`,h,'settings');
  const status=()=>{root.querySelector('[data-save-status]').textContent='Saved.';};
  const form=root.querySelector('[data-profile-form]');if(form)form.onsubmit=e=>{e.preventDefault();h.save('ooc-profile',{...profile,name:form.elements.name.value.trim(),audience:form.elements.audience.value,bio:form.elements.bio.value.trim()});status();h.repaint?.();};
  const output=root.querySelector('[data-output-length]');if(output)output.onchange=()=>{h.save('ooc-output-length',output.value);status();};
  const suggest=root.querySelector('[data-suggestion-preference]');if(suggest)suggest.onchange=()=>{h.save('ooc-suggestions-visible',suggest.checked);status();};
 }else{
  const isCreated=path==='/my-title',isHistory=path==='/history',title=isCreated?'My Titles':isHistory?'History':'Favorites';
  let tab='All',sort='Latest',visibility='All';
  const ids=isCreated?[]:isHistory?historyIds(h.read,h.data):h.read('ooc-favorites',[]);
  const root=mountShell(`<div class="library-content"><header class="library-header"><h1>${title}</h1>${isCreated?'<button class="shell-white-button" data-community-create>Create Title</button>':''}</header><div class="library-tabs" role="tablist" aria-label="Title type">${['All','Story','Character',...(isCreated?['Drafts']:[])].map(t=>`<button role="tab" data-library-type="${t}" aria-selected="${t==='All'}">${t}</button>`).join('')}</div><div class="library-controls"><span data-library-count>All 0</span>${isCreated?'<select aria-label="Title visibility"><option>All</option><option>Published</option><option>Draft</option></select>':''}<select aria-label="Sort titles"><option>Latest</option><option>Title A–Z</option></select></div><div class="library-items"></div></div>${footer()}`,h,'library');
  function draw(){
   let entries=isCreated?h.read('ooc-custom',[]).map((d,i)=>({...normalizeDraft(d,i),draft:true})):ids.map(id=>h.data.find(d=>d.id===id)).filter(Boolean);
   entries=entries.filter(d=>tab==='All'||tab==='Drafts'&&d.status!=='published'||tab==='Character'&&d.type==='character'||tab==='Story'&&d.type!=='character');
   if(isCreated&&visibility==='Published')entries=entries.filter(d=>d.status==='published');if(isCreated&&visibility==='Draft')entries=entries.filter(d=>d.status!=='published');
   if(isCreated&&sort==='Latest')entries.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
   if(sort==='Title A–Z')entries.sort((a,b)=>a.title.localeCompare(b.title));
   root.querySelector('[data-library-count]').textContent=`${tab} ${entries.length}`;
   root.querySelector('.library-items').innerHTML=entries.length?(isCreated?entries.map(d=>`<article class="library-draft"><a href="/builder/${d.type}/${encodeURIComponent(d.id)}" aria-label="Edit ${safe(d.title||'Untitled')}">${d.image?`<img src="${safe(d.image)}" alt="">`:''}<h2>${safe(d.title||'Untitled')}</h2><p>${safe(d.description)}</p><small>${d.type==='character'?'Character':'Story'} · ${d.status==='published'?`Published · ${{public:'Public',link:'Link only',private:'Private'}[d.visibility]||'Private'}`:'Draft'} · Edit</small></a>${d.status==='published'?`<a class="library-play" href="/play/${encodeURIComponent(d.publishedId)}">Play</a>`:''}</article>`).join(''):itemsMarkup(entries,isHistory)):`<div class="shell-empty">${icon(isHistory?'chat':isCreated?'book':'heart',40)}${isCreated?'There are no titles yet. Create your first title!':isHistory?'No recent conversations.':'No favorites yet.'}<br>${isCreated?'<a href="/builder">Create Title</a>':'<a href="/">Explore stories</a>'}</div>`;
  }
  const tabs=[...root.querySelectorAll('[data-library-type]')];tabs.forEach((b,i)=>{b.tabIndex=i===0?0:-1;b.onclick=()=>{tab=b.dataset.libraryType;tabs.forEach(x=>{x.setAttribute('aria-selected',String(x===b));x.tabIndex=x===b?0:-1;});draw();};b.onkeydown=e=>{const next=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;if(next!==null){e.preventDefault();tabs[next].click();tabs[next].focus();}};});
  root.querySelector('[aria-label="Sort titles"]').onchange=e=>{sort=e.target.value;draw();};const visibilitySelect=root.querySelector('[aria-label="Title visibility"]');if(visibilitySelect)visibilitySelect.onchange=e=>{visibility=e.target.value;draw();};draw();
  const create=root.querySelector('[data-community-create]');if(create)create.onclick=()=>h.navigate('/builder');
 }
 document.title=(path.startsWith('/announcement')?'Notice':path==='/profile'?'MY':path==='/my-title'?'My Titles':path==='/history'?'History':path==='/liked'?'Favorites':'Settings')+' · StoryDate';
 return true;
}
