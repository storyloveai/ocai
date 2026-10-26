import {escapeHTML as safe} from './stream.js';
import {sortStories} from './catalog-sort.js';
const users=new Map(),names=new Map(),comments=new Map();let catalogue=[];
const slug=name=>'creator-'+Array.from(name).map(c=>c.codePointAt(0).toString(16)).join('-');
function register(id,name,image=''){if(!id||!name)return;const old=users.get(id);users.set(id,{...old,id,name,image:old?.image||image});names.set(name,id);}
export function initSocial(catalog,evidence,previews){
 catalogue=catalog;
 for(const [path,html]of Object.entries(evidence.pages)){
  const doc=new DOMParser().parseFromString(html,'text/html');
  for(const a of doc.querySelectorAll('a[href^="/profile/"]')){const name=a.textContent.trim();if(name)register(a.getAttribute('href').split('/')[2],name,a.querySelector('img')?.getAttribute('src')||'');}
  const id=path==='detail'?'69f414d90abbab6f6a2c8131':path.startsWith('/story/')||path.startsWith('/character/')?path.split('/')[2]:null;
  if(id){const rows=[];for(const [index,article]of [...doc.querySelectorAll('article')].entries()){
   const author=[...article.querySelectorAll('a[href^="/profile/"]')].find(a=>a.textContent.trim());const text=[...article.querySelectorAll('p')].map(p=>p.textContent.trim()).filter(Boolean).join('\n');
   const name=author?.textContent.trim()||article.querySelector('span.typo-text-base_leading-none_medium')?.textContent.trim();if(!name||!text)continue;const uid=author?author.getAttribute('href').split('/')[2]:slug(name);register(uid,name);const buttons=[...article.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean);rows.push({id:`${id}-${index}`,uid,name,text,likes:buttons[0]||'0',replies:buttons[1]||'0',captured:true});
  }comments.set(id,rows);}
 }
 for(const record of Object.values(previews.titles)){const doc=new DOMParser().parseFromString(record.html,'text/html');for(const a of doc.querySelectorAll('a[href^="/profile/"]'))register(a.getAttribute('href').split('/')[2],a.textContent.trim());}
 for(const d of catalog)if(d.author&&!names.has(d.author))register(slug(d.author),d.author);
 // only creators of titles that are listed here keep a profile (the captured OOC creators are dropped)
 const keep=new Set(catalog.map(d=>d.author).filter(Boolean));
 for(const [id,u]of users)if(!keep.has(u.name)){users.delete(id);if(names.get(u.name)===id)names.delete(u.name);}
}
export function creatorLink(name){const id=names.get(name)||slug(name||'Storylove');return `<a class="creator-link" href="/profile/${safe(id)}">${safe(name||'Storylove')}</a>`;}
function saveState(h,key,value,status){try{h.save(key,value);return true;}catch{if(status)status.textContent='Unable to save. Please try again.';return false;}}
export function bindSocial(root,id,h){
 if(root.querySelector('[data-social-comments]'))return;
 const container=root.querySelector('.title-preview-body')||root;
 const section=document.createElement('section');section.className='social-comments';section.dataset.socialComments='';container.append(section);
 let order='liked',replyTo=null;
 const key='ooc-comments-'+id,likesKey='ooc-comments-social-likes';
 const local=()=>h.read(key,[]).map((c,i)=>typeof c==='string'?{id:`legacy-${i}`,name:'You',text:c,createdAt:0}:c);
 const draw=()=>{
  let rows=[...(comments.get(id)||[]),...local()];if(order==='newest')rows.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const liked=h.read(likesKey,[]);
  section.innerHTML=`<div class="social-heading"><h2>Comments <small>${rows.length}</small></h2><select aria-label="Sort comments"><option value="liked" ${order==='liked'?'selected':''}>Most Liked</option><option value="newest" ${order==='newest'?'selected':''}>Newest</option></select></div><small class="social-disclosure">Public comments are a captured snapshot. Your likes, comments and replies are private to your Storylove account or this device.</small><form data-comment-form><label for="social-comment">${replyTo?'Reply to '+safe(replyTo.name):'Leave a comment'}</label><textarea id="social-comment" name="comment" aria-label="Your comment" maxlength="1000" rows="2" required></textarea><button class="shell-white-button">${replyTo?'Reply':'Post'}</button>${replyTo?'<button type="button" data-cancel-reply>Cancel reply</button>':''}<span role="status" data-social-status></span></form><div class="social-comment-list">${rows.map(c=>`<article><header>${c.uid?`<a href="/profile/${safe(c.uid)}">${safe(c.name)}</a>`:`<strong>${safe(c.name||'You')}</strong>`}<small>${c.captured?'Captured comment':'Your comment'}</small></header>${c.parentName?`<small>↪ ${safe(c.parentName)}</small>`:''}<p>${safe(c.text)}</p><div><button type="button" data-comment-like="${safe(c.id)}" aria-pressed="${liked.includes(c.id)}" aria-label="Like comment by ${safe(c.name)}">♡ ${safe(c.likes||0)}${liked.includes(c.id)?' +1':''}</button><button type="button" data-comment-reply="${safe(c.id)}">Reply ${safe(c.replies||'')}</button></div></article>`).join('')||'<p>No comments yet. Start the conversation.</p>'}</div>`;
  section.querySelector('select').onchange=e=>{order=e.target.value;draw();};
  section.querySelector('[data-cancel-reply]')?.addEventListener('click',()=>{replyTo=null;draw();});
  section.querySelectorAll('[data-comment-reply]').forEach(b=>b.onclick=()=>{replyTo=rows.find(c=>c.id===b.dataset.commentReply);draw();section.querySelector('textarea').focus();});
  section.querySelectorAll('[data-comment-like]').forEach(b=>b.onclick=()=>{const values=h.read(likesKey,[]),target=b.dataset.commentLike;const status=section.querySelector('[data-social-status]');if(saveState(h,likesKey,values.includes(target)?values.filter(x=>x!==target):[...values,target],status))draw();});
  section.querySelector('form').onsubmit=e=>{e.preventDefault();const text=section.querySelector('textarea').value.trim();if(!text)return;const values=local();values.push({id:crypto.randomUUID(),text,name:h.read('ooc-profile',{}).name||'You',createdAt:Date.now(),parentId:replyTo?.id,parentName:replyTo?.name});if(saveState(h,key,values,section.querySelector('[data-social-status]'))){replyTo=null;order='newest';draw();section.querySelector('[data-social-status]').textContent='Saved';}};
 };draw();
}
export function showCreator(path,h,mountShell){
 const id=decodeURIComponent(path.split('/')[2]);const user=users.get(id);
 if(!user){mountShell('<div class="shell-empty"><h1>Creator unavailable</h1><a href="/">Explore stories</a></div>',h,'creator');return true;}
 let tab='Titles',kind='story',sort='newest';
 const root=mountShell(`<header class="shell-page-header"><a href="/" class="dialog-back" aria-label="Back to stories">‹</a><h1>Creator Profile</h1></header><div class="creator-profile"><section class="creator-identity"><div class="creator-avatar">${safe(user.name.slice(0,1).toUpperCase())}</div><h2>${safe(user.name)}</h2><p><button data-creators-followers>Followers <span data-follow-count></span></button> · <button data-creators-following>Following</button></p><div class="creator-actions"><button class="shell-white-button" data-creator-follow></button><button data-creator-share>Share</button></div><p>${safe(user.name)}</p><small class="social-disclosure">Captured public profile. Follow and feed activity are saved privately on Storylove.</small><p role="status" data-creator-status></p></section><div class="creator-tabs" role="tablist" aria-label="Creator content"><button role="tab" data-creator-tab="Titles" aria-selected="true">Titles</button><button role="tab" data-creator-tab="Feed" aria-selected="false">Feed</button></div><div class="creator-work-controls"><button data-creator-kind="story" aria-pressed="true">Story</button><button data-creator-kind="character" aria-pressed="false">Character</button><label>Sort <select aria-label="Sort creator titles"><option value="newest">Latest</option><option value="played">Most Played</option><option value="title">Title A–Z</option></select></label></div><div data-creator-content></div></div>`,h,'creator');
 const follows=()=>h.read('ooc-comments-social-follows',[]),status=root.querySelector('[data-creator-status]');
 const paintFollow=()=>{const followed=follows().includes(id);root.querySelector('[data-creator-follow]').textContent=followed?'Following':'Follow';root.querySelector('[data-creator-follow]').setAttribute('aria-label',followed?'Unfollow '+user.name:'Follow '+user.name);root.querySelector('[data-creator-follow]').setAttribute('aria-pressed',String(followed));root.querySelector('[data-follow-count]').textContent=(id==='pFH7KJlqym-GGENSoa-AX7LhJTk3Cqp'?92827:0)+(followed?1:0);};paintFollow();
 root.querySelector('[data-creator-follow]').onclick=()=>{const values=follows();if(saveState(h,'ooc-comments-social-follows',values.includes(id)?values.filter(x=>x!==id):[...values,id],status)){paintFollow();status.textContent=follows().includes(id)?'Following on Storylove':'Unfollowed';}};
 root.querySelector('[data-creator-share]').onclick=async()=>{const url=location.origin+path;try{if(navigator.share)await navigator.share({title:user.name+' · Storylove',url});else await navigator.clipboard.writeText(url);status.textContent='Profile link shared';}catch(e){if(e.name!=='AbortError'){status.textContent='Copy profile link:';const input=document.createElement('input');input.readOnly=true;input.value=url;status.append(input);input.select();}}};
 root.querySelector('[data-creators-followers]').onclick=()=>{status.textContent='Original follower counts are snapshots. Your follow is private to Storylove.';};
 root.querySelector('[data-creators-following]').onclick=()=>{const ids=follows();h.show(`<h2>Your following on Storylove</h2>${ids.map(value=>users.get(value)).filter(Boolean).map(value=>creatorLink(value.name)).join('<br>')||'<p>You are not following anyone yet.</p>'}`);};
 const draw=()=>{root.querySelector('.creator-work-controls').hidden=tab!=='Titles';const content=root.querySelector('[data-creator-content]');if(tab==='Feed'){const rows=[...comments.values()].flat().filter(c=>c.uid===id);content.innerHTML=rows.map(c=>`<article class="creator-feed-item"><strong>${safe(user.name)}</strong><p>${safe(c.text)}</p><a href="/story/${safe(c.id.split('-')[0])}">View conversation</a></article>`).join('')||'<p class="shell-empty">No captured posts from this creator.</p>';return;}
 const entries=sortStories(catalogue.filter(d=>d.author===user.name&&(kind==='character'?d.type==='character':d.type!=='character')),sort);content.innerHTML=`<p class="creator-count">Titles ${entries.length} in this catalogue</p><div class="creator-title-grid">${entries.map(d=>`<a href="/${d.type==='character'?'character':'story'}/${safe(d.id)}"><img loading="lazy" src="${safe(d.image||'')}" alt="${safe(d.title)}"><h3>${safe(d.title)}</h3><p>${safe(d.plays||'')}</p></a>`).join('')}</div>${entries.length?'':'<p class="shell-empty">No captured titles in this category.</p>'}`;};
 root.querySelectorAll('[data-creator-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.creatorTab;root.querySelectorAll('[data-creator-tab]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));draw();});
 root.querySelectorAll('[data-creator-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.creatorKind;root.querySelectorAll('[data-creator-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();});root.querySelector('select').onchange=e=>{sort=e.target.value;draw();};draw();document.title=user.name+' · Creator Profile · StoryDate';return true;
}
