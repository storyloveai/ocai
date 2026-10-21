import fs from 'node:fs';
import {parseHTML} from 'linkedom';
const base='../interaction-evidence/';
const names={name:'onboarding-name',preferences:'onboarding-preferences-selected',complete:'onboarding-complete',character:'character-chat-initial',story:'chat-initial',shortcuts:'chat-keyboard-shortcuts'};
const pages={};
for(const [key,file] of Object.entries(names)){
 const raw=JSON.parse(fs.readFileSync(base+file+'.json'));const {document}=parseHTML(raw.html);const root=document.querySelector('#root')||document.documentElement;
 root.id='interaction-root';
 root.querySelectorAll('script,[role="tooltip"],a[href="/profile"]').forEach(e=>e.remove());
 root.querySelectorAll('a[href*="/episode/"]').forEach(a=>{a.href='/play/'+a.getAttribute('href').split('/')[2];});
 root.querySelectorAll('img').forEach(img=>{if((img.alt||'').includes('nezuko'))img.remove();});
 root.querySelectorAll('a[href^="/policy/"]').forEach(a=>{a.href='https://ooc.ai'+a.getAttribute('href');a.target='_blank';a.rel='noopener noreferrer';});
 if(key==='story'||key==='character'){
  const scroll=[...root.querySelectorAll('[style]')].find(e=>e.getAttribute('style').includes('overflow: auto'));pages[key+'Intro']=scroll.querySelector('.px-3').innerHTML.replaceAll('nezukoNPPYyT','nezuko');scroll.id='session-scroll';scroll.innerHTML='<div id="session-messages" class="session-messages"></div>';
  const editor=root.querySelector('textarea,[contenteditable=true]');editor.id='session-input';editor.setAttribute('aria-label','Send Message');
  if(editor.tagName==='TEXTAREA')editor.textContent='';else{editor.innerHTML='';editor.setAttribute('data-placeholder','Send Message');editor.setAttribute('role','textbox');}
  const send=root.querySelector('button:has(path[d^="M18.77 11.13"])')||editor.closest('.relative').querySelector('button:last-child');
  // Ground the send button in the composer, never in the settings drawer.
  let container=editor.parentElement;while(container&&!container.className.includes('border bg-bg-input-30'))container=container.parentElement;
  container.querySelectorAll('button').forEach((b,i,arr)=>b.dataset.control=i===arr.length-1?'send':i===0?'situation':i===1&&key==='story'?'slash':'suggest');
  root.querySelector('button:has(path[d^="M21 6.4H3"])').dataset.control='settings';
  const drawer=[...root.querySelectorAll('div')].find(e=>e.className.startsWith('box-content h-full'));drawer.id='session-settings';
  root.querySelector('[role=combobox]').dataset.control='model';
  const jump=root.querySelector('button:has(path[d^="m5.645 9.566"])');if(jump){jump.dataset.control='bottom';jump.setAttribute('aria-label','Back to bottom');}
  root.querySelectorAll('a[href="/credit"] span,a[href="/credit"] div').forEach(e=>{if(/^\d+$/.test(e.textContent.trim()))e.textContent='Demo';});
 }
 let html=root.outerHTML.replaceAll('nezukoNPPYyT','nezuko').replaceAll('6ad0032a9984296fa1acd34a','local-session');
 if(/nezukoNPP|6ad0032a/.test(html))throw new Error('Private reference remains');pages[key]=html;
}
fs.writeFileSync('dist/assets/interaction-pages.json',JSON.stringify(pages));
const styles=JSON.parse(fs.readFileSync(base+'chat-source-styles.json'));
fs.writeFileSync('dist/assets/chat-source.css',styles.filter(s=>s.href?.includes('/async/')&&s.css).map(s=>s.css).join('\n'));
