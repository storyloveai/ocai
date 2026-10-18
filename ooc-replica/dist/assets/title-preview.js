import {escapeHTML as safe} from './stream.js';
let active;
export function closeTitlePreview(){active?.close();}
export function openTitlePreview(record,id,{navigate,read,save,assets={}}){
 closeTitlePreview();
 const previousFocus=document.activeElement;
 const dialog=document.createElement('dialog');dialog.id='title-preview';dialog.className='title-preview-dialog';
 dialog.setAttribute('aria-label','Story Information');dialog.innerHTML=record.html;
 const header=dialog.firstElementChild,body=header.nextElementSibling,footer=dialog.lastElementChild;
 header.classList.add('title-preview-header');body.classList.add('title-preview-body');footer.classList.add('title-preview-footer');
 const profile=read('ooc-profile',{name:'nezuko'}),avatar=dialog.querySelector('[data-preview-avatar]');
 if(avatar)avatar.querySelector('span').textContent=profile.name||'Default avatar';
 for(const image of dialog.querySelectorAll('img')){const url=image.getAttribute('src');if(assets[url])image.src=assets[url];image.loading='lazy';}
 for(const el of dialog.querySelectorAll('[style]'))for(const [url,local]of Object.entries(assets))if(el.style.backgroundImage?.includes(url))el.style.backgroundImage=`url("${local}")`;
 const selected=()=>read('ooc-favorites',[]).includes(id);
 const paintBookmark=()=>dialog.querySelectorAll('[data-preview-bookmark]').forEach(b=>{b.setAttribute('aria-pressed',String(selected()));b.style.color=selected()?'#e0ff2e':'';});paintBookmark();
 const originalOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';
 let menu;
 const closeMenu=()=>{menu?.remove();menu=null;dialog.querySelectorAll('[aria-expanded=true][role=combobox]').forEach(b=>b.setAttribute('aria-expanded','false'));};
 function choose(button,heading,options){
  closeMenu();button.setAttribute('aria-expanded','true');menu=document.createElement('div');menu.className='title-preview-menu';menu.setAttribute('role','listbox');menu.setAttribute('aria-label',heading);
  options.forEach(({label,run})=>{const option=document.createElement('button');option.type='button';option.setAttribute('role','option');option.setAttribute('aria-selected','true');option.innerHTML=`<span>${safe(label)}</span><span aria-hidden="true">✓</span>`;option.onclick=()=>{closeMenu();run?.();button.focus();};menu.append(option);});
  dialog.append(menu);const r=button.getBoundingClientRect(),d=dialog.getBoundingClientRect();menu.style.left=Math.max(12,Math.min(r.left-d.left,dialog.clientWidth-240))+'px';menu.style.width=Math.min(Math.max(r.width,220),dialog.clientWidth-24)+'px';menu.style.top=Math.min(r.bottom-d.top+4,dialog.clientHeight-menu.offsetHeight-12)+'px';menu.querySelector('button')?.focus();
 }
 dialog.addEventListener('click',event=>{
  if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();return;}
  const button=event.target.closest('button');if(!button){if(!event.target.closest('.title-preview-menu'))closeMenu();return;}
  if(button.hasAttribute('data-preview-close'))dialog.close();
  if(button.dataset.previewPlay){dialog.close();navigate('/play/'+id);}
  if(button.dataset.previewBookmark){const values=read('ooc-favorites',[]);save('ooc-favorites',selected()?values.filter(value=>value!==id):[...values,id]);paintBookmark();}
  if(button.hasAttribute('data-preview-expand')){const expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));button.textContent=expanded?'View All':'Fold';const clipped=button.parentElement.parentElement.querySelector('[class*="max-h-"]');if(clipped)clipped.style.maxHeight=expanded?'':'none';}
  if(button.hasAttribute('data-preview-avatar'))choose(button,'Avatar settings',[{label:profile.name||'Default avatar'}]);
  if(button.hasAttribute('data-preview-scenario'))choose(button,'Starting scenario',[{label:button.querySelector('span').textContent.trim()}]);
  if(button.hasAttribute('data-preview-more'))choose(button,'Story options',[{label:'Open full information',run:()=>{dialog.close();navigate('/story/'+id);}}]);
 });
 dialog.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu){event.preventDefault();event.stopPropagation();closeMenu();}else if(menu&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();menu.querySelector('button')?.focus();}});
 dialog.addEventListener('close',()=>{document.documentElement.style.overflow=originalOverflow;dialog.remove();if(active===dialog)active=null;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});},{once:true});
 document.body.append(dialog);active=dialog;dialog.showModal();body.scrollTop=0;dialog.querySelector('[data-preview-close]')?.focus({preventScroll:true});
 return dialog;
}
