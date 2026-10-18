import {readFile,writeFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {resolve} from 'node:path';
const captureDirectory=process.argv[2];
if(!captureDirectory)throw Error('Usage: node scripts/build-title-previews.mjs <private-capture-directory>');
const observed=[['lumencia','69f414d90abbab6f6a2c8131'],['apex','6aaad8746c080a5d3ff0402a'],['sovereign','6ab3b736e2e641b7fbeb6312'],['dating','6ab70e13499de207c7ca13c4'],['knight','6ac749a7ab586f53935a023d'],['commander','6ab2217bfa760164cd6c2f12']];
const result={captured:'2026-10-18',source:'Public Story Information dialogs observed on ooc.ai',titles:{}};
for(const [name,id]of observed){
 const {document}=parseHTML(await readFile(resolve(captureDirectory,name+'-modal-observed.html'),'utf8'));
 const root=document.querySelector('[role=dialog]');
 for(const el of root.querySelectorAll('*')){
  for(const a of [...el.attributes])if(a.name==='id'||a.name.startsWith('on')||['aria-controls','aria-labelledby','aria-describedby','data-aria-hidden','aria-hidden','tabindex','data-highlighted'].includes(a.name))el.removeAttribute(a.name);
 }
 root.querySelectorAll('script,iframe,style').forEach(el=>el.remove());
 const combos=[...root.querySelectorAll('[role=combobox]')];
 const avatar=combos[0];avatar.querySelector('span').textContent='Default avatar';avatar.dataset.previewAvatar='';avatar.setAttribute('aria-label','Avatar settings');
 if(combos[1]){combos[1].dataset.previewScenario='';combos[1].setAttribute('aria-label','Starting scenario');}
 const buttons=[...root.querySelectorAll('button')];buttons[0].dataset.previewClose='';buttons[0].setAttribute('aria-label','Close story information');
 const blank=buttons.slice(1).filter(b=>!b.textContent.trim());
 if(blank[0]){blank[0].dataset.previewBookmark=id;blank[0].setAttribute('aria-label','Bookmark story');}
 if(blank[1]){blank[1].dataset.previewMore='';blank[1].setAttribute('aria-label','More story options');}
 buttons.filter(b=>b.textContent==='View AllFold').forEach(b=>{b.textContent='View All';b.dataset.previewExpand='';b.setAttribute('aria-expanded','false');});
 buttons.filter(b=>b.textContent==='New Play').forEach(b=>{b.dataset.previewPlay=id;b.removeAttribute('aria-haspopup');b.removeAttribute('aria-expanded');});
 root.querySelectorAll('a').forEach(a=>{const href=a.getAttribute('href')||'';if(href.includes('/episode/')){a.remove();return;}if(href.startsWith('/?q=')){a.href='/search'+href.slice(1);}else if(/^https?:/.test(href)){a.target='_blank';a.rel='noopener noreferrer';}else if(!href.startsWith('/'))a.removeAttribute('href');});
 result.titles[id]={title:root.querySelector('h1').textContent,html:root.innerHTML};
}
await writeFile(new URL('../dist/assets/title-previews.json',import.meta.url),JSON.stringify(result));
console.log('Exported '+Object.keys(result.titles).length+' sanitized public title dialogs');
