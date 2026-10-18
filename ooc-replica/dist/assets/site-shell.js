import {escapeHTML as safe} from './stream.js';
export const symbol=(name,size=20)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${({bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',arrow:'<path d="m9 5 7 7-7 7"/>',gear:'<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',credit:'<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M2 8V2h6m8 0h6v6M2 16v6h6m8 0h6v-6"/><circle cx="12" cy="12" r="4"/>',person:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',chat:'<path d="M3 4h18v13H10l-5 4v-4H3Z"/><path d="M8 8h8m-8 4h5"/>',heart:'<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1s-1 7 8 14c9-7 11-11 8-14Z"/>',shield:'<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z"/>',star:'<path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z"/>',ticket:'<path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z"/><path d="M15 5v14"/>',edit:'<path d="m14 4 6 6-9 9-7 1 1-7Z"/>',book:'<path d="M4 3h14v18H4ZM8 7h6m-6 4h6m-6 4h4"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>'})[name]||'<circle cx="12" cy="12" r="8"/>'}</svg>`;
export function paintSidebar(host,account,{read,data,navigate,show}){
 const side=host.querySelector('[data-shrink]');if(!side)return false;
 const desktop=side.children[1];if(!desktop)return false;
 const user=account.user,profile=read('ooc-profile',{});
 const bottom=desktop.lastElementChild;
 if(!bottom.dataset.accountSlot){bottom.dataset.accountSlot='true';bottom.dataset.guestMarkup=bottom.innerHTML;}
 const group=desktop.children[1]?.children[2];
 if(user&&group&&!group.querySelector('[data-shell-notifications]')){
  const credit=group.querySelector('a[href="/credit"]');
  if(credit){const notification=credit.cloneNode(true);notification.removeAttribute('href');notification.tagName==='A'&&notification.setAttribute('role','button');notification.tabIndex=0;notification.dataset.shellNotifications='';notification.innerHTML=`${symbol('bell')}<span>Notifications</span>`;notification.onclick=()=>showNotifications(show);notification.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();notification.click();}};credit.before(notification);}
 }
 if(!user)group?.querySelector('[data-shell-notifications]')?.remove();
 const historySlot=desktop.children[1]?.lastElementChild;
 if(historySlot){
  if(!user){historySlot.innerHTML='';}else{
   const mode=historySlot.dataset.historyMode||'story';
   const ids=[...new Set([...read('ooc-history',[]),...data.filter(d=>read('ooc-session-v2-'+d.id,[]).length).map(d=>d.id)])];
   const entries=ids.map(id=>data.find(d=>d.id===id)).filter(d=>d&&(mode==='character'?d.type==='character':d.type!=='character'));
   historySlot.innerHTML=`<section class="shell-history"><div class="shell-history-label">History<a href="/history" aria-label="View all history">${symbol('arrow',14)}</a></div><div class="shell-history-tabs"><button data-history-mode="story" aria-pressed="${mode==='story'}">Story</button><button data-history-mode="character" aria-pressed="${mode==='character'}">Character</button></div><div class="shell-history-list">${entries.slice(0,8).map(d=>{const messages=read('ooc-session-v2-'+d.id,null)||read('ooc-chat-'+d.id,[]);const last=messages?.at?.(-1);return `<a href="/play/${safe(d.id)}"><img src="${safe(d.image.startsWith('assets/')?'/'+d.image:d.image)}" alt=""><div><strong>${safe(d.title)}</strong><p>${safe(last?.text?.replace(/[#>*`]/g,'').slice(0,70)||'Continue your story')}</p></div><span aria-hidden="true">⋮</span></a>`;}).join('')||'<p class="shell-history-empty">Your recent stories will appear here.</p>'}</div></section>`;
   historySlot.querySelectorAll('[data-history-mode]').forEach(b=>b.onclick=()=>{historySlot.dataset.historyMode=b.dataset.historyMode;paintSidebar(host,account,{read,data,navigate,show});});
  }
 }
 if(user){bottom.classList.add('shell-account-slot');bottom.innerHTML=`<a class="shell-account" href="/profile"><span class="shell-avatar">✱</span><span>${safe(profile.name||user.displayName||'My account')}</span>${symbol('arrow',14)}</a>`;}
 else {bottom.classList.remove('shell-account-slot');bottom.innerHTML=bottom.dataset.guestMarkup.replaceAll('Sign up and get 500 credits!','Sign in to save your stories');bottom.querySelectorAll('button').forEach(b=>{b.dataset.action='login';b.dataset.provider=/Apple/.test(b.textContent)?'apple':'google';b.hidden=b.dataset.provider==='apple'&&!account.providers.apple;});}
 side.querySelectorAll('a[href]').forEach(a=>{const selected=a.getAttribute('href')===location.pathname;a.dataset.status=selected?'active':'inactive';if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 return true;
}
export function showNotifications(show){
 const tabs=['All','News','Like','Comment','Follow'];
 show(`<section class="shell-notifications"><h2>Notification</h2><div role="tablist" aria-label="Notification categories">${tabs.map((name,i)=>`<button role="tab" id="notification-tab-${i}" aria-selected="${i===0}" aria-controls="notification-panel" tabindex="${i===0?0:-1}">${name}</button>`).join('')}</div><div id="notification-panel" role="tabpanel" aria-labelledby="notification-tab-0"><strong>No notifications</strong><p>You don't have any notifications yet.</p></div></section>`);
 const root=document.querySelector('.shell-notifications');
 const buttons=[...root.querySelectorAll('[role=tab]')];
 const select=index=>{buttons.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;});root.querySelector('[role=tabpanel]').setAttribute('aria-labelledby',buttons[index].id);};
 buttons.forEach((button,index)=>{button.onclick=()=>select(index);button.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();select(next);buttons[next].focus();}};});
}
