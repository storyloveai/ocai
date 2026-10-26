import {variants,getVariant} from './variants.js';
const query=new URLSearchParams(location.search);
let selected=getVariant(query.get('variant')||'outline');
let device=query.get('view')==='mobile'?'mobile':'desktop';
const options=document.querySelector('#options'),frame=document.querySelector('#site-preview'),viewport=document.querySelector('#viewport');
for(const variant of variants){
 const button=document.createElement('button');button.type='button';button.className='option';button.dataset.variant=variant.id;
 button.innerHTML=`<span class="option-heading"><span class="option-letter">${variant.letter}</span>${variant.name}<span class="option-check" aria-hidden="true">✓</span></span><span class="option-samples"><img class="sample-logo${variant.halo?' sample-halo':''}" src="${variant.logo}" alt="${variant.name}完整 Logo" width="164" height="40"><img class="sample-mark${variant.halo?' sample-halo':''}" src="${variant.mark}" alt="${variant.name}小图标" width="32" height="32"></span><span class="option-detail">${variant.detail}</span>`;
 button.onclick=()=>{selected=variant;paint();};options.append(button);
}
function resize(){viewport.style.setProperty('--preview-scale',String(viewport.clientWidth/(device==='mobile'?390:1440)));}
function paint(){
 options.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.variant===selected.id)));
 document.querySelector('#selected-letter').textContent=selected.letter;document.querySelector('#selected-name').textContent=selected.name;document.querySelector('#selected-description').textContent=selected.description;
 const path='/?logo='+selected.id;document.querySelector('#open-home').href=path;
 // Device changes resize the same live page; choosing a new design reloads it with that opt-in.
 if(frame.dataset.variant!==selected.id){frame.dataset.variant=selected.id;frame.src=path;}
 viewport.classList.toggle('is-mobile',device==='mobile');
 document.querySelector('#device-label').textContent=device==='mobile'?'390 px':'1440 px';
 document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===device)));
 history.replaceState(null,'','?variant='+selected.id+'&view='+device);resize();
}
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{device=button.dataset.view;paint();});
new ResizeObserver(resize).observe(viewport);paint();
