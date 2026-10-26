// Apply semantic grouping to the existing catalogue without changing story data or ranking rules.
const discovery=new Set(['Main','New Ranking','Rankings','Today']);
export function mountHomeSystem(root,{search=globalThis.location?.search||''}={}){
 if(new URLSearchParams(search).get('layout')==='baseline')return null;
 const library=root.querySelector('.sd-home-library');
 if(!library)return null;
 const doc=root.ownerDocument;
 root.classList.add('sd-evidence-home');
 const buttons=[...library.querySelectorAll('[data-category-label]')];
 const first=buttons[0],track=first?.parentElement?.parentElement,viewport=track?.parentElement,region=first?.closest('[role="region"]');
 let select;
 if(track&&viewport&&region){
  region.classList.add('sd-browse-toolbar');viewport.classList.add('sd-browse-viewport');track.classList.add('sd-browse-track');
  for(const button of buttons){button.parentElement.hidden=!discovery.has(button.dataset.categoryLabel);}
  select=region.querySelector('.sd-genre-select');
  if(!select){
   select=doc.createElement('select');select.className='sd-genre-select';select.setAttribute('aria-label','Browse by genre');
   const prompt=doc.createElement('option');prompt.value='';prompt.textContent='Browse by genre';select.append(prompt);
   for(const button of buttons.filter(button=>!discovery.has(button.dataset.categoryLabel))){
    const option=doc.createElement('option');option.value=button.dataset.categoryLabel;option.textContent=button.dataset.categoryLabel;select.append(option);
   }
   region.append(select);
  }
  select.onchange=()=>buttons.find(button=>button.dataset.categoryLabel===(select.value||'Main'))?.click();
 }
 for(const section of library.querySelectorAll('section')){
  const heading=section.querySelector('h2'),slide=section.querySelector('[aria-roledescription="slide"]');
  if(!heading||!slide)continue;
  section.classList.add('sd-shelf');section.parentElement.classList.add('sd-shelf-stack');
  const headingWrap=section.children[0];headingWrap.classList.add('sd-shelf-heading');
  const shelfTrack=slide.parentElement,shelfViewport=shelfTrack.parentElement;
  shelfTrack.classList.add('sd-shelf-track');shelfViewport.classList.add('sd-shelf-viewport');
  for(const item of shelfTrack.children)item.classList.add('sd-shelf-slide');
  for(const card of section.querySelectorAll('a[href^="/story/"],a[href^="/character/"]')){
   const title=card.querySelector('[data-name]');if(!title)continue;
   for(const paragraph of card.querySelectorAll('p'))if(paragraph!==title)paragraph.classList.add('sd-book-meta');
  }
 }
 const sync=()=>{
  if(!select)return;
  const selected=buttons.find(button=>button.getAttribute('aria-pressed')==='true')?.dataset.categoryLabel;
  const value=selected&&!discovery.has(selected)?selected:'';
  const option=[...select.querySelectorAll('option')].find(option=>option.value===value);
  if(option)option.selected=true;
  select.classList.toggle('is-active',Boolean(value));
 };
 sync();return {sync};
}
